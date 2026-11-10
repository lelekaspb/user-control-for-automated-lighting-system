import assert from "node:assert/strict";
import { createHmac, pbkdf2Sync } from "node:crypto";
import { createServer } from "node:net";
import { once } from "node:events";
import { test } from "node:test";
import { authenticateDevice } from "../lib/device-auth.ts";

const salt = "0123456789abcdef0123456789abcdef";
const password = "test-access-password";
const key = pbkdf2Sync(password, Buffer.from(salt, "hex"), 10000, 32, "sha256");

function frame(header, payload) {
  const lengths = [];
  let length = payload.length;
  do {
    let digit = length % 128;
    length = Math.floor(length / 128);
    if (length) digit |= 128;
    lengths.push(digit);
  } while (length);
  return Buffer.concat([Buffer.from([header, ...lengths]), payload]);
}

function publish(topic, message, retain = false) {
  const topicBytes = Buffer.from(topic);
  const length = Buffer.alloc(2);
  length.writeUInt16BE(topicBytes.length);
  return frame(retain ? 0x31 : 0x30, Buffer.concat([length, topicBytes, Buffer.from(message)]));
}

test("MQTT device challenge verifies the password and rejects invalid responses", async (t) => {
  let response = "valid";
  const requests = [];
  const server = createServer((socket) => {
    let buffered = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      buffered = Buffer.concat([buffered, chunk]);
      while (buffered.length >= 2) {
        let length = 0;
        let multiplier = 1;
        let index = 1;
        let byte;
        do {
          if (index >= buffered.length) return;
          byte = buffered[index++];
          length += (byte & 127) * multiplier;
          multiplier *= 128;
        } while (byte & 128);
        if (buffered.length < index + length) return;
        const type = buffered[0] >> 4;
        const body = buffered.subarray(index, index + length);
        buffered = buffered.subarray(index + length);
        if (type === 1) socket.write(Buffer.from([0x20, 2, 0, 0]));
        if (type === 8) socket.write(frame(0x90, Buffer.from([body[0], body[1], 0])));
        if (type === 3) {
          const topicLength = body.readUInt16BE(0);
          const topic = body.subarray(2, 2 + topicLength).toString();
          const request = body.subarray(2 + topicLength).toString();
          assert.equal(topic, "esp32/auth/request");
          assert.match(request, /^[0-9a-f]{32}\|[0-9a-f]{64}$/);
          requests.push(request);
          const id = request.slice(0, 32);
          const mac = createHmac("sha256", key).update(`login|${request}`).digest("hex");
          const result = response === "malformed" ? "invalid" : `${salt}|${mac}`;
          if (response === "retained-first") {
            socket.write(publish(`esp32/auth/response/${id}`, "invalid", true));
          }
          socket.write(publish(`esp32/auth/response/${id}`, result));
        }
      }
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const oldUrl = process.env.MQTT_URL;
  process.env.MQTT_URL = `mqtt://127.0.0.1:${server.address().port}`;
  try {
    await t.test("correct password returns the device key", async () => {
      assert.deepEqual(await authenticateDevice(password), key);
    });
    await t.test("wrong password is rejected", async () => {
      assert.equal(await authenticateDevice("incorrect-password"), null);
    });
    await t.test("malformed response is an error", async () => {
      response = "malformed";
      await assert.rejects(authenticateDevice(password), /Invalid device authentication response/);
    });
    await t.test("retained messages are ignored", async () => {
      response = "retained-first";
      assert.deepEqual(await authenticateDevice(password), key);
    });
    assert.equal(new Set(requests).size, requests.length);
    assert.ok(requests.every((request) => !request.includes(password)));
  } finally {
    if (oldUrl === undefined) delete process.env.MQTT_URL;
    else process.env.MQTT_URL = oldUrl;
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

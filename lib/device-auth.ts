import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import mqtt, { type MqttClient } from "mqtt";

const REQUEST_TOPIC = "esp32/auth/request";
const RESPONSE_PREFIX = "esp32/auth/response/";
const RESPONSE_TIMEOUT_MS = 10000;

// The device proves possession of the password-derived key without receiving
// the password. A fresh request ID and challenge prevent response replay.
export async function authenticateDevice(password: string): Promise<Buffer | null> {
  const url = process.env.MQTT_URL;
  if (!url) throw new Error("MQTT_URL is not configured");
  const id = randomBytes(16).toString("hex");
  const challenge = randomBytes(32).toString("hex");
  const request = `${id}|${challenge}`;
  const responseTopic = RESPONSE_PREFIX + id;

  let client: MqttClient | undefined;
  try {
    client = await mqtt.connectAsync(url, {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      connectTimeout: RESPONSE_TIMEOUT_MS,
      reconnectPeriod: 0,
    });
    const connectedClient = client;
    const response = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Device did not respond"));
      }, RESPONSE_TIMEOUT_MS);
      function cleanup() {
        clearTimeout(timer);
        connectedClient.removeListener("error", onError);
        connectedClient.removeListener("message", onMessage);
      }
      function onError(error: Error) {
        cleanup();
        reject(error);
      }
      function onMessage(topic: string, payload: Buffer, packet: { retain: boolean }) {
        if (topic !== responseTopic || packet.retain) return;
        cleanup();
        resolve(payload.toString("utf8"));
      }
      connectedClient.once("error", onError);
      connectedClient.on("message", onMessage);
      connectedClient.subscribe(responseTopic, { qos: 0 }, (error, granted) => {
        if (error) return onError(error);
        if (!granted?.some((entry) => entry.topic === responseTopic && entry.qos !== 128)) {
          return onError(new Error("Device response subscription was rejected"));
        }
        connectedClient.publish(REQUEST_TOPIC, request, { qos: 0, retain: false }, (publishError) => {
          if (publishError) onError(publishError);
        });
      });
    });
    if (!/^[0-9a-f]{32}\|[0-9a-f]{64}$/.test(response)) {
      throw new Error("Invalid device authentication response");
    }
    const [saltHex, macHex] = response.split("|");
    const key = pbkdf2Sync(password, Buffer.from(saltHex, "hex"), 10000, 32, "sha256");
    const expected = createHmac("sha256", key).update(`login|${request}`).digest();
    return timingSafeEqual(expected, Buffer.from(macHex, "hex")) ? key : null;
  } finally {
    if (client) await client.endAsync(true);
  }
}

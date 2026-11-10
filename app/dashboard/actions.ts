"use server";

import mqtt from "mqtt";
import { createHmac } from "node:crypto";
import { getDeviceKey, requireCommandAccess } from "@/lib/auth";

let lastCounter = 0;

// Payload format expected by the ESP32: "<value>;<counter>;<hex HMAC>".
async function signPayload(topic: string, value: string): Promise<string> {
  lastCounter = Math.max(Date.now(), lastCounter + 1);
  const counter = lastCounter;
  const mac = createHmac("sha256", await getDeviceKey())
    .update(`${topic}|${value}|${counter}`)
    .digest("hex");
  return `${value};${counter};${mac}`;
}

async function publish(topic: string | undefined, message: string) {
  const url = process.env.MQTT_URL;
  if (!url || !topic) throw new Error("MQTT is not configured in .env");
  const payload = await signPayload(topic, message);

  // One short-lived connection per call is fine for occasional manual changes.
  const client = await mqtt.connectAsync(url, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });
  try {
    await client.publishAsync(topic, payload, { qos: 1 });
  } finally {
    await client.endAsync();
  }
}

// Server Actions are public POST endpoints, so validate everything.
export async function setColor(color: string) {
  const denied = await requireCommandAccess();
  if (denied) return denied;
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { ok: false, error: "Invalid color" };
  try {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    await publish(process.env.MQTT_COLOR_TOPIC, `${r}, ${g}, ${b}`);
    return { ok: true };
  } catch (err) {
    console.error("[mqtt] color publish failed", err);
    return { ok: false, error: "Could not reach the broker" };
  }
}

export async function setBrightness(brightness: number) {
  const denied = await requireCommandAccess();
  if (denied) return denied;
  if (!Number.isInteger(brightness) || brightness < 0 || brightness > 100) {
    return { ok: false, error: "Invalid brightness" };
  }
  try {
    await publish(process.env.MQTT_BRIGHTNESS_TOPIC, String(Math.round(brightness * 255 / 100)));
    return { ok: true };
  } catch (err) {
    console.error("[mqtt] brightness publish failed", err);
    return { ok: false, error: "Could not reach the broker" };
  }
}

"use server";

import mqtt from "mqtt";

async function publish(topic: string | undefined, message: string) {
  const url = process.env.MQTT_URL;
  if (!url || !topic) throw new Error("MQTT is not configured in .env");

  // One short-lived connection per call is fine for occasional manual changes.
  const client = await mqtt.connectAsync(url, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });
  try {
    await client.publishAsync(topic, message, { qos: 1 });
  } finally {
    await client.endAsync();
  }
}

// Server Actions are public POST endpoints, so validate everything.
export async function setColor(color: string) {
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
  if (!Number.isInteger(brightness) || brightness < 0 || brightness > 100) {
    return { ok: false, error: "Invalid brightness" };
  }
  try {
    await publish(process.env.MQTT_BRIGHTNESS_TOPIC, String(brightness));
    return { ok: true };
  } catch (err) {
    console.error("[mqtt] brightness publish failed", err);
    return { ok: false, error: "Could not reach the broker" };
  }
}

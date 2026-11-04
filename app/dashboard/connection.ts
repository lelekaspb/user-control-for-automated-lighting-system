"use server";
import mqtt from "mqtt";

// A short-lived probe checks server-to-broker connectivity without publishing.
// It does not indicate ESP32 connectivity or confirm device delivery.
export async function checkMqttConnection(): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.MQTT_URL;
  if (!url) return { ok: false, error: "MQTT is not configured. Check the server environment." };
  try {
    const client = await mqtt.connectAsync(url, {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      reconnectPeriod: 0,
      connectTimeout: 5000,
    });
    await client.endAsync(true);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not connect to the MQTT broker. Check its availability and server credentials." };
  }
}

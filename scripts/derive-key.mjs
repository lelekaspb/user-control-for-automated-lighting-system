// Usage: pnpm derive-key <device salt hex> <access password>
// Prints DEVICE_SALT_HEX and DEVICE_KEY_HEX for .env. Parameters must match the firmware.
import { pbkdf2Sync } from "node:crypto";

const [saltHex, password] = process.argv.slice(2);
if (!/^[0-9a-fA-F]{32}$/.test(saltHex ?? "") || !password) {
  console.error("Usage: pnpm derive-key <32-char salt hex shown by the ESP32> <access password>");
  process.exit(1);
}
const key = pbkdf2Sync(password, Buffer.from(saltHex, "hex"), 10000, 32, "sha256");
console.log(`DEVICE_SALT_HEX=${saltHex.toLowerCase()}`);
console.log(`DEVICE_KEY_HEX=${key.toString("hex")}`);

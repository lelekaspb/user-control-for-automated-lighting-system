# Lighting control web app

Next.js app for controlling the ESP32 + NeoPixel lighting system over MQTT.

## Package manager: pnpm only

This project uses **pnpm**. Do **not** use `npm install`, `npm i`, `yarn` or `bun`.
They create a different lockfile and leave `pnpm-lock.yaml` out of date, which makes the Vercel build fail
(`ERR_PNPM_OUTDATED_LOCKFILE`). Never create or commit `package-lock.json`, `yarn.lock` or `bun.lock`.

| Task | Command |
|---|---|
| Install dependencies | `pnpm install` |
| Add a dependency | `pnpm add <package>` |
| Add a dev dependency | `pnpm add -D <package>` |
| Remove a dependency | `pnpm remove <package>` |
| Run dev server | `pnpm dev` |
| Build / lint | `pnpm build` / `pnpm lint` |

Always commit `pnpm-lock.yaml` together with any change to `package.json`.

## Getting started

1. `pnpm install`
2. Create a `.env` file in the project root (it is git-ignored):

   ```
   MQTT_URL=mqtts://<broker-host>:8883
   MQTT_USERNAME=<username>
   MQTT_PASSWORD=<password>
   MQTT_COLOR_TOPIC=esp32/led/color
   MQTT_BRIGHTNESS_TOPIC=esp32/led/brightness
   ```

   These are read only on the server. Never prefix them with `NEXT_PUBLIC_`, or they will be exposed to the browser.
3. `pnpm dev` and open [http://localhost:3000](http://localhost:3000).

## Pages

- `/` home
- `/dashboard` color picker and brightness control (publishes to MQTT through server actions)
- `/settings` settings

## Deploy on Vercel

Vercel detects `pnpm-lock.yaml` and installs with pnpm. Add the same five `MQTT_*` variables under
Project Settings → Environment Variables, since `.env` is not deployed.

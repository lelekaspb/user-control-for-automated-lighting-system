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
   AUTH_MODE=protect-all
   AUTH_SECRET=<random-secret-at-least-32-characters>
   ```

   These are read only on the server. Never prefix them with `NEXT_PUBLIC_`, or they will be exposed to the browser.
3. Generate `AUTH_SECRET` once with
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   Keep it private and unchanged across deployments.
4. `pnpm dev` and open [http://localhost:3000](http://localhost:3000).

## Device login

Set the access password on the ESP32 Wi-Fi setup page. The same password is used
to log in to the app; no device salt or derived key needs to be configured on
the server. The ESP32 must be online and connected to the same MQTT broker when
logging in. The server sends a fresh challenge over MQTT and verifies the
device's response using a key derived from the entered password. The password
is not sent to the ESP32 over MQTT. The derived key is kept in an encrypted,
HTTP-only session cookie and used to sign device commands. Changing the server
secret invalidates existing sessions.

The login topics are `esp32/auth/request` and `esp32/auth/response/<random-id>`;
broker permissions must allow the ESP32 to subscribe to requests and publish
responses, and the web app to do the reverse. Use separate broker credentials
and ACLs so **only the intended ESP32 can publish responses**: otherwise another
broker client can impersonate the device and authorize its own password. This
configuration assumes one device per set of topics. Restrict broker access and
use TLS: someone able to observe challenges can attempt offline password
guessing. Use a strong access password.

Run the MQTT challenge integration tests with Node.js 24:
`node --test tests/device-auth.test.mjs`.

## Pages

- `/` home
- `/dashboard` color picker and brightness control (publishes to MQTT through server actions)
- `/settings` settings

## Deploy on Vercel

Vercel detects `pnpm-lock.yaml` and installs with pnpm. Add the `MQTT_*`,
`AUTH_MODE` and `AUTH_SECRET` variables under Project Settings → Environment
Variables, since `.env` is not deployed. The secret and broker settings are
one-time deployment configuration; the device password is not an environment
variable.

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";

// Access control for the web app. Everything is configured through .env so the
// system can be moved between sites without code changes:
//
//   AUTH_MODE        open              nobody has to log in
//                    protect-commands  anyone can view, only logged-in users can send commands
//                    protect-all       login required for every page (default)
//   AUTH_SECRET      random string (32+ chars) used to encrypt session JWTs
// The device key is carried only in an encrypted, authenticated session cookie.

export type AuthMode = "open" | "protect-commands" | "protect-all";

export const SESSION_COOKIE = "session";
export const LOGIN_REQUIRED = "Login required";
const SESSION_SECONDS = 60 * 60 * 8;

export function getAuthMode(): AuthMode {
  const mode = process.env.AUTH_MODE;
  if (mode === "open" || mode === "protect-commands") return mode;
  return "protect-all"; // fail closed on a missing or misspelled value
}

function sessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters in .env");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

async function sessionDeviceKey(token: string | undefined): Promise<Buffer | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, sessionSecret(), {
      keyManagementAlgorithms: ["dir"],
      contentEncryptionAlgorithms: ["A256GCM"],
    });
    if (payload.sub !== "owner" || typeof payload.key !== "string" ||
        !/^[0-9a-f]{64}$/.test(payload.key)) return null;
    return Buffer.from(payload.key, "hex");
  } catch {
    return null;
  }
}

export async function getDeviceKey(): Promise<Buffer> {
  const key = await sessionDeviceKey((await cookies()).get(SESSION_COOKIE)?.value);
  if (key) return key;
  const legacyKey = process.env.DEVICE_KEY_HEX;
  if (getAuthMode() === "open" && legacyKey && /^[0-9a-fA-F]{64}$/.test(legacyKey)) {
    return Buffer.from(legacyKey, "hex");
  }
  throw new Error("Device access key is not available; log in first.");
}

export async function createSession(deviceKey: Buffer): Promise<void> {
  const token = await new EncryptJWT({ key: deviceKey.toString("hex") })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setSubject("owner")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .encrypt(sessionSecret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  return (await sessionDeviceKey(token)) !== null;
}

export async function isLoggedIn(): Promise<boolean> {
  return isValidSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

// Call at the top of every Server Action that changes the device. This is the
// check that actually protects it; the proxy is only a convenience redirect.
export async function requireCommandAccess(): Promise<{ ok: false; error: string } | null> {
  if (getAuthMode() === "open") return null;
  return (await isLoggedIn()) ? null : { ok: false, error: LOGIN_REQUIRED };
}

// Brute-force protection: failed logins are counted per client and globally
// (the client address header can be spoofed, so the global limit is the backstop).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_CLIENT = 5;
const MAX_FAILURES_GLOBAL = 30;
const failures = new Map<string, number[]>();

function recent(key: string, now: number): number[] {
  const list = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  failures.set(key, list);
  return list;
}

export function isLoginBlocked(client: string): boolean {
  const now = Date.now();
  return (
    recent(client, now).length >= MAX_FAILURES_PER_CLIENT ||
    recent("*", now).length >= MAX_FAILURES_GLOBAL
  );
}

export function recordLoginFailure(client: string): void {
  const now = Date.now();
  recent(client, now).push(now);
  recent("*", now).push(now);
}

export function clearLoginFailures(client: string): void {
  failures.delete(client);
}

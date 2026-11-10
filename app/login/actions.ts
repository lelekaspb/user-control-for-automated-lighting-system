"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearLoginFailures,
  createSession,
  destroySession,
  isLoginBlocked,
  recordLoginFailure,
} from "@/lib/auth";
import { authenticateDevice } from "@/lib/device-auth";

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || Buffer.byteLength(password, "utf8") < 8 ||
      Buffer.byteLength(password, "utf8") > 64) {
    return { error: "Enter the access password" };
  }

  const client = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (isLoginBlocked(client)) {
    return { error: "Too many failed attempts. Try again in 15 minutes." };
  }

  let key: Buffer | null;
  try {
    key = await authenticateDevice(password);
  } catch (err) {
    console.error("[auth] device verification failed", err);
    return { error: "Could not reach the device. Check that it is online and try again." };
  }
  if (!key) {
    recordLoginFailure(client);
    return { error: "Wrong password" };
  }

  clearLoginFailures(client);
  try {
    await createSession(key);
  } catch (err) {
    console.error("[auth] session creation failed", err);
    return { error: "Could not create a login session. Contact the system administrator." };
  }
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });

  return (
    <form action={action} className="max-w-sm space-y-4">
      <input
        name="password"
        type="password"
        placeholder="Access password"
        autoComplete="current-password"
        required
        className="w-full rounded border border-zinc-400 bg-transparent px-3 py-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {pending ? "Checking…" : "Log in"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

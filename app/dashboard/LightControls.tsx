"use client";

import { useEffect, useRef, useState } from "react";
import { setBrightness, setColor } from "./actions";

export default function LightControls() {
  const [color, setColorValue] = useState("#ffffff");
  const [brightness, setBrightnessValue] = useState(50);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorInput = useRef<HTMLInputElement>(null);

  // React's onChange fires continuously while picking. The native "change"
  // event fires only once the user confirms/closes the picker, so send then.
  useEffect(() => {
    const input = colorInput.current;
    if (!input) return;
    const send = async () => {
      const result = await setColor(input.value);
      setError(result.ok ? null : (result.error ?? "Failed"));
    };
    input.addEventListener("change", send);
    return () => input.removeEventListener("change", send);
  }, []);

  async function applyBrightness() {
    setSending(true);
    const result = await setBrightness(brightness);
    setError(result.ok ? null : (result.error ?? "Failed"));
    setSending(false);
  }

  return (
    <section className="space-y-6">
      <label className="flex items-center gap-4">
        <span className="w-24">Color</span>
        <input
          ref={colorInput}
          type="color"
          value={color}
          onChange={(e) => setColorValue(e.target.value)}
          className="h-10 w-16 cursor-pointer"
        />
        <code className="text-sm">
          {[1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)).join(", ")}
        </code>
      </label>

      <label className="flex items-center gap-4">
        <span className="w-24">Brightness</span>
        <input
          type="range"
          min={0}
          max={100}
          value={brightness}
          onChange={(e) => setBrightnessValue(Number(e.target.value))}
          className="flex-1"
        />
        <span className="w-12 text-right text-sm">{brightness}%</span>
        <button
          type="button"
          onClick={applyBrightness}
          disabled={sending}
          className="rounded bg-foreground px-3 py-1 text-sm text-background disabled:opacity-50"
        >
          {sending ? "Sending…" : "Apply"}
        </button>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}

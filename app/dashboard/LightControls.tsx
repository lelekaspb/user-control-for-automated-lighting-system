"use client";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Icon from "../components/Icon";
import { setBrightness, setColor } from "./actions";
import { checkMqttConnection } from "./connection";

type Connection = "checking" | "connected" | "disconnected" | "unknown";
export default function LightControls() {
  const [color, setColorValue] = useState("#ffffff");
  const [brightness, setBrightnessValue] = useState(50);
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState<Connection>("checking");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const colorInput = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));

  useEffect(() => {
    let active = true;
    checkMqttConnection().then(result => {
      if (!active) return;
      setConnection(result.ok ? "connected" : "disconnected");
      setConnectionError(result.ok ? null : result.error ?? "Connection failed.");
    }).catch(() => {
      if (!active) return;
      setConnection("unknown");
      setConnectionError("Unable to check broker connection. Please retry.");
    });
    return () => { active = false; };
  }, []);

  // Preserve the original native change listener: publish a committed colour
  // selection, while React onChange updates the local preview and RGB values.
  useEffect(() => {
    const input = colorInput.current;
    if (!input) return;
    const send = async () => {
      if (busy.current) return;
      busy.current = true;
      const selectedColor = input.value;
      setColorValue(selectedColor);
      setSending(true);
      setMessage(null);
      try {
        const result = await setColor(selectedColor);
        setConnection(result.ok ? "connected" : "unknown");
        setConnectionError(null);
        setMessage({ error: !result.ok, text: result.ok ? "Colour command published to the broker." : result.error ?? "Colour command failed." });
      } catch {
        setConnection("unknown");
        setMessage({ error: true, text: "The colour request failed. Please try again." });
      } finally { busy.current = false; setSending(false); }
    };
    input.addEventListener("change", send);
    return () => input.removeEventListener("change", send);
  }, []);

  async function applyBrightness() {
    if (busy.current) return;
    busy.current = true;
    setSending(true);
    setMessage(null);
    try {
      const result = await setBrightness(brightness);
      setConnection(result.ok ? "connected" : "unknown");
      setConnectionError(null);
      setMessage({ error: !result.ok, text: result.ok ? `Brightness command (${brightness}%) published to the broker.` : result.error ?? "Brightness command failed." });
    } catch {
      setConnection("unknown");
      setMessage({ error: true, text: "The brightness request failed. Please try again." });
    } finally { busy.current = false; setSending(false); }
  }
  async function recheck() {
    if (busy.current) return;
    busy.current = true;
    setSending(true);
    setConnection("checking");
    setConnectionError(null);
    try {
      const result = await checkMqttConnection();
      setConnection(result.ok ? "connected" : "disconnected");
      setConnectionError(result.ok ? null : result.error ?? "Connection failed.");
    } catch { setConnection("unknown"); setConnectionError("Unable to check broker connection. Please retry."); }
    finally { busy.current = false; setSending(false); }
  }
  return <div className="dashboard-content">
    <div className="page-heading"><div><span className="eyebrow">LIGHTING CONTROL</span><h2>Dashboard</h2><p>Make your balcony feel just right.</p></div></div>
    <section className="card connection-card" aria-labelledby="connection-title"><div className="card-heading"><span className="icon-tile"><Icon name="wifi" size={28}/></span><div><h3 id="connection-title">MQTT Connection</h3><p>Server connection to your lighting broker</p></div></div><div className="connection-actions"><span className={`connection-badge ${connection}`} role="status"><span/>{connection === "connected" ? "Connected · last check" : connection === "checking" ? "Checking connection…" : connection === "disconnected" ? "Disconnected" : "Connection unconfirmed"}</span><button className="button subtle" disabled={sending || connection === "checking"} onClick={() => void recheck()}><Icon name="sync" size={17}/>Recheck</button></div>{connectionError && <p className="connection-error" role="alert">{connectionError}</p>}<p className="connection-note">Broker reachability does not confirm the ESP32 is online or that an LED command was applied.</p></section>
    <div className="controls-grid">
      <section className="card control-card" aria-labelledby="color-title"><div className="card-heading"><span className="icon-tile"><Icon name="palette" size={28}/></span><div><h3 id="color-title">Color Control</h3><p>Choose the light colour (RGB)</p></div></div><div className="color-preview" style={{ background: color }}><span className="preview-label">Selected colour</span></div><div className="color-picker-row"><label className="picker-label" htmlFor="light-color">Choose colour<span>Published when your selection is confirmed</span></label><div className="color-input-wrap"><input ref={colorInput} id="light-color" type="color" value={color} disabled={sending} onChange={e => setColorValue(e.target.value)}/><code>{color.toUpperCase()}</code></div></div><div className="rgb-values" aria-live="polite">{["R", "G", "B"].map((label, i) => <div key={label}><span>{label}</span><output>{rgb[i]}</output></div>)}</div></section>
      <section className="card control-card brightness-card" aria-labelledby="brightness-title"><div className="card-heading"><span className="icon-tile"><Icon name="sun" size={29}/></span><div><h3 id="brightness-title">Brightness Control</h3><p>Adjust overall light brightness</p></div></div><div className="brightness-display"><span className="sun-halo"><Icon name="sun" size={38}/></span><output htmlFor="brightness">{brightness}<small>%</small></output><span>Selected brightness</span></div><div className="range-block"><input id="brightness" aria-label="Light brightness" type="range" min="0" max="100" value={brightness} disabled={sending} onChange={e => setBrightnessValue(Number(e.target.value))} style={{ "--range-progress": `${brightness}%` } as CSSProperties}/><div className="range-labels"><span>0%</span><span>100%</span></div></div><button className="button primary apply-button" disabled={sending} onClick={() => void applyBrightness()}><Icon name="check" size={20}/>{sending ? "Sending…" : "Apply brightness"}</button><p className="control-note">Move the slider, then apply to send your selection.</p></section>
    </div>
    {message && <div className={`feedback ${message.error ? "error" : "success"}`} role={message.error ? "alert" : "status"}><Icon name={message.error ? "info" : "check"} size={21}/><span>{message.text}{!message.error && <small> Device confirmation is not available.</small>}</span></div>}
  </div>;
}


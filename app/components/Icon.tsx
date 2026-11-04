import type { CSSProperties } from "react";

export type IconName = "leaf" | "home" | "bulb" | "automation" | "energy" | "sensors" | "settings" | "info" | "school" | "pulse" | "sun" | "target" | "sync" | "battery" | "wifi" | "hand" | "palette" | "clock" | "motion" | "check" | "menu" | "close";
const paths: Record<IconName, React.ReactNode> = {
  leaf: <><path d="M21 3C9 3 2 7 5 16c8 5 16-2 16-13Z" fill="currentColor" stroke="none"/><path d="M3 21 16 8" stroke="#047c68"/></>,
  home: <><path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/><path d="M8 7v-3"/></>,
  bulb: <><path d="M9 18h6M10 21h4M8 14a7 7 0 1 1 8 0l-1 3H9Z"/></>,
  automation: <><path d="M3 6h8m6 0h4M3 18h3m6 0h9"/><circle cx="14" cy="6" r="3"/><circle cx="9" cy="18" r="3"/></>,
  energy: <path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>,
  sensors: <><circle cx="12" cy="12" r="2"/><path d="M7 7a7 7 0 0 0 0 10m10-10a7 7 0 0 1 0 10M4 4a12 12 0 0 0 0 16M20 4a12 12 0 0 1 0 16"/></>,
  settings: <><path d="m9 3-1 3-3 1-2 4 2 2v4l4 2 2 2 4-1 1-3 3-1 2-4-2-2V7l-4-2-2-2Z"/><circle cx="12" cy="12" r="3"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/></>,
  school: <><path d="m2 9 10-6 10 6-10 5ZM6 12v6c4 3 8 3 12 0v-6m4-3v9"/></>,
  pulse: <path d="M2 12h5l3-8 4 16 3-8h5"/>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>,
  target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/></>,
  sync: <><path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/></>,
  battery: <><rect x="2" y="6" width="18" height="12" rx="2"/><path d="M22 10v4"/><path d="M5 9h10v6H5Z" fill="currentColor" stroke="none"/></>,
  wifi: <><path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></>,
  hand: <path d="M8 12V5a2 2 0 0 1 4 0v7-9a2 2 0 0 1 4 0v9-6a2 2 0 0 1 4 0v10c0 9-10 10-14 3l-3-5c-1-3 2-4 4-1l1 1"/>,
  palette: <><path d="M21 12A9 9 0 1 0 12 21h2c3 0 3-4 0-4-2 0-2-3 1-3h3c2 0 3-1 3-2Z"/><path d="M7 9h.01M11 6h.01M16 8h.01M6 14h.01" strokeWidth="3"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  motion: <><circle cx="14" cy="4" r="2"/><path d="m7 10 5-3 5 5 4 1m-10-5-2 7 5 3 1 5m-6-8-4 7"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  menu: <path d="M3 6h18M3 12h18M3 18h18"/>,
  close: <path d="m5 5 14 14M5 19 19 5"/>,
};
export default function Icon({ name, size = 24, className = "", style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>{paths[name]}</svg>;
}

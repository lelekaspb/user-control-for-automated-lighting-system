"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon, { type IconName } from "./Icon";
const navigation: { label: string; href: string; icon: IconName }[] = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Dashboard", href: "/dashboard", icon: "bulb" },
  { label: "Settings", href: "/settings", icon: "settings" },
];
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="mobile-bar"><Link href="/dashboard" className="brand"><Icon name="leaf"/>BalconyLight</Link><button className="menu-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"}/></button></div>
    {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)}/>}
    <aside id="sidebar" className={`sidebar ${open ? "is-open" : ""}`}>
      <Link href="/dashboard" className="brand" onClick={() => setOpen(false)}><Icon name="leaf" size={35}/>BalconyLight</Link>
      <nav aria-label="Main navigation">{navigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`nav-item ${pathname === item.href ? "active" : ""}`} onClick={() => setOpen(false)}><Icon name={item.icon}/><span>{item.label}</span></Link>)}</nav>
      <div className="university"><Icon name="school" size={30}/><div><strong>University Project</strong><small>IoT · Solar · Smart Lighting</small></div></div>
    </aside>
    <div className="workspace"><header className="hero"><h1><Icon name="leaf" size={48}/>BalconyLight</h1><p>Smart off-grid balcony lighting control</p></header><main id="main-content" className="main-content">{children}</main><footer className="footer"><Icon name="leaf" size={20}/><strong>BalconyLight</strong><span>University IoT Project</span></footer></div>
  </div>;
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import { Home, Plus, FileText, Bell, Pulse, Gear, Inbox, Bot, Plug } from "./Icons";
import ThemeToggle from "./ThemeToggle";
import { Logo } from "./Logo";
import { Avatar } from "./UI";
import { assess } from "@/lib/rules";

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { state } = useApp();
  const due = state ? state.invoices.filter((i) => assess(i).severity >= 3).length : 0;
  const fresh = state ? state.inbox.filter((i) => !i.invoiceId).length : 0;
  const demo = state ? !state.config.paypal || !state.config.ai : false;

  const NAV = [
    { href: "/dashboard", label: "Overview", icon: Home },
    { href: "/inbox", label: "Inbox", icon: Inbox, badge: fresh },
    { href: "/invoices", label: "Invoices", icon: FileText },
    { href: "/followups", label: "Follow-ups", icon: Bell, badge: due },
    { href: "/assistant", label: "Assistant", icon: Bot },
    { href: "/activity", label: "Activity", icon: Pulse },
    { href: "/connections", label: "Connections", icon: Plug },
    { href: "/settings", label: "Settings", icon: Gear },
  ];

  return (
    <div className="app">
      <aside className="side">
        <Link href="/" className="brand" aria-label="Leash home">
          <Logo size={28} />
        </Link>
        <Link href="/new" className="btn primary new-btn">
          <Plus size={16} /> <span>New invoice</span>
        </Link>
        <nav aria-label="Main">
          {NAV.map(({ href, label, icon: Icon, badge }) => {
            const active = path === href || path.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
                <Icon size={17} />
                <span>{label}</span>
                {!!badge && badge > 0 && <span className="nav-badge">{badge}</span>}
              </Link>
            );
          })}
        </nav>
        {state && (
          <Link href="/settings" className="ws-card" aria-label="Workspace settings">
            <Avatar name={state.profile.yourName || "You"} size={34} />
            <span className="ws-text">
              <b>{state.profile.yourName || "Your name"}</b>
              <span>{state.profile.business || "Your business"}</span>
            </span>
          </Link>
        )}
        <div className="side-foot">
          {state && (
            <Link href="/connections" className={`mode ${demo ? "demo" : "live"}`}>
              <i />{" "}
              {!state.config.paypal
                ? "Demo mode"
                : demo
                  ? `PayPal ${state.config.env} · AI off`
                  : `Live · PayPal ${state.config.env}`}
            </Link>
          )}
          <ThemeToggle />
        </div>
      </aside>
      <main className="main">{state ? children : <Skeleton />}</main>
    </div>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="sk" style={{ width: 220, height: 34, marginBottom: 24 }} />
      <div className="kpis">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="sk" style={{ height: 96 }} />
        ))}
      </div>
      <div className="sk" style={{ height: 320, marginTop: 16 }} />
    </div>
  );
}

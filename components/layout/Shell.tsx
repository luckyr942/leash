"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useApp } from "./AppProvider";
import { Home, Plus, FileText, Bell, Pulse, Gear, Inbox, Bot, Plug, Menu, Close } from "@/components/ui/Icons";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Primitives";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { assess } from "@/lib/domain/rules";

// Desktop: a sidebar. Phones (≤900px): a slim top bar, a bottom tab bar for the five main places,
// and a "More" sheet for the rest. Same links, same badges.
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { state } = useApp();
  const [more, setMore] = useState(false);
  const due = state ? state.invoices.filter((i) => assess(i).severity >= 3).length : 0;
  const fresh = state ? state.inbox.filter((i) => !i.invoiceId).length : 0;
  const demo = state ? !state.config.paypal || !state.config.ai : false;
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);

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
  const TABS = ["/dashboard", "/inbox", "/invoices", "/followups"];
  const tabs = NAV.filter((n) => TABS.includes(n.href));
  const rest = NAV.filter((n) => !TABS.includes(n.href));
  const moreActive = rest.some((n) => isActive(n.href)) || isActive("/new");

  const modeLabel = state && (!state.config.paypal ? "Demo mode" : demo ? `PayPal ${state.config.env} · AI off` : `Live · PayPal ${state.config.env}`);

  return (
    <div className="app">
      {/* ---------- desktop sidebar ---------- */}
      <aside className="side">
        <Link href="/" className="brand" aria-label="Leash home">
          <Logo size={28} />
        </Link>
        <Link href="/new" className="btn primary new-btn">
          <Plus size={16} /> <span>New invoice</span>
        </Link>
        <nav aria-label="Main">
          {NAV.map(({ href, label, icon: Icon, badge }) => (
            <Link key={href} href={href} className={`nav-item ${isActive(href) ? "active" : ""}`} aria-current={isActive(href) ? "page" : undefined}>
              <Icon size={17} />
              <span>{label}</span>
              {!!badge && badge > 0 && <span className="nav-badge">{badge}</span>}
            </Link>
          ))}
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
              <i /> {modeLabel}
            </Link>
          )}
          <ThemeToggle />
        </div>
      </aside>

      {/* ---------- phone top bar ---------- */}
      <header className="m-top">
        <Link href="/" className="brand" aria-label="Leash home">
          <Logo size={26} />
        </Link>
        {state && <span className={`mode-dot ${demo ? "demo" : "live"}`} title={modeLabel ?? ""} aria-label={modeLabel ?? ""} />}
        <div className="m-top-actions">
          <Link href="/assistant" className={`icon-btn ${isActive("/assistant") ? "on" : ""}`} aria-label="Assistant">
            <Bot size={18} />
          </Link>
          <ThemeToggle />
          <Link href="/new" className="btn primary sm m-new" aria-label="New invoice">
            <Plus size={16} /> New
          </Link>
        </div>
      </header>

      <main className="main">{state ? children : <PageSkeleton />}</main>

      {/* ---------- phone bottom tabs ---------- */}
      <nav className="m-tabs" aria-label="Main">
        {tabs.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={`m-tab ${isActive(href) ? "on" : ""}`}
            aria-current={isActive(href) ? "page" : undefined}
            onClick={() => setMore(false)}
          >
            <span className="m-tab-ic">
              <Icon size={21} />
              {!!badge && badge > 0 && <span className="m-badge">{badge}</span>}
            </span>
            <span>{label}</span>
          </Link>
        ))}
        <button className={`m-tab ${more || moreActive ? "on" : ""}`} onClick={() => setMore(!more)} aria-expanded={more} aria-controls="m-sheet">
          <span className="m-tab-ic">{more ? <Close size={21} /> : <Menu size={21} />}</span>
          <span>More</span>
        </button>
      </nav>

      {/* ---------- phone "More" sheet ---------- */}
      {more && (
        <>
          <div className="m-scrim" onClick={() => setMore(false)} aria-hidden />
          <div className="m-sheet" id="m-sheet" role="dialog" aria-label="More">
            <div className="m-grab" aria-hidden />
            <div className="m-grid">
              {rest.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={`m-tile ${isActive(href) ? "on" : ""}`} onClick={() => setMore(false)}>
                  <Icon size={22} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
            {state && (
              <Link href="/settings" className="ws-card" onClick={() => setMore(false)}>
                <Avatar name={state.profile.yourName || "You"} size={34} />
                <span className="ws-text">
                  <b>{state.profile.yourName || "Your name"}</b>
                  <span>{modeLabel}</span>
                </span>
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

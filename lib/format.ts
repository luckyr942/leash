// Client-safe formatting helpers shared by the pages.
import { assess, isOverdue, type Assessment } from "./rules";
import type { Invoice, Channel } from "./store";

export const money = (n: number, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
export const money2 = (n: number, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);
export const day = (d?: string) =>
  d ? new Date(d.length === 10 ? `${d}T12:00:00Z` : d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
export const shortDay = (d?: string) =>
  d ? new Date(d.length === 10 ? `${d}T12:00:00Z` : d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
export const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : shortDay(iso);
};
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

export type DisplayStatus = "DRAFT" | "APPROVED" | "SENT" | "OVERDUE" | "PAID" | "CANCELLED";
export const displayStatus = (inv: Invoice): DisplayStatus => (isOverdue(inv) ? "OVERDUE" : inv.status);
export const STATUS_TEXT: Record<DisplayStatus, string> = {
  DRAFT: "Draft",
  APPROVED: "Approved",
  SENT: "Sent",
  OVERDUE: "Overdue",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const nextStep = (inv: Invoice): Assessment => assess(inv);

export const CHANNEL_TEXT: Record<Channel, string> = {
  paypal: "PayPal email",
  email: "Email",
  whatsapp: "WhatsApp",
  sms: "SMS",
  telegram: "Telegram",
  copy: "Copied",
};

/** One-tap deep links: open the person's own email / WhatsApp / SMS app with the approved text. */
export function channelLink(channel: Channel, to: { email?: string; phone?: string }, subject: string, body: string): string | null {
  const digits = (to.phone ?? "").replace(/[^\d]/g, "");
  switch (channel) {
    case "email":
      return `mailto:${encodeURIComponent(to.email ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    case "whatsapp":
      return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
    case "sms":
      return `sms:${to.phone ? `+${digits}` : ""}?&body=${encodeURIComponent(body)}`;
    default:
      return null;
  }
}

// ---------- multi-currency ----------
export type FxRates = { base: string; date: string; rates: Record<string, number> } | null;

/** Convert an amount into the rates' base currency (null if the rate is unknown). */
export function toBase(amount: number, currency: string, fx: FxRates): number | null {
  if (!fx) return null;
  if (currency === fx.base) return amount;
  const r = fx.rates[currency];
  return r ? amount / r : null;
}

/** Sum invoices: exact per-currency totals plus an approximate home-currency total. */
export function sumByCurrency(list: { total: number; currency: string }[], home: string, fx: FxRates) {
  const by = new Map<string, number>();
  for (const i of list) by.set(i.currency, (by.get(i.currency) ?? 0) + i.total);
  let approx = 0;
  let exact = true;
  for (const [cur, amt] of by) {
    const v = cur === home ? amt : toBase(amt, cur, fx);
    if (v === null) exact = false;
    else approx += v;
  }
  const others = [...by].filter(([c]) => c !== home);
  return { home: approx, converted: others.length > 0, complete: exact, parts: [...by].sort((a, b) => (a[0] === home ? -1 : b[0] === home ? 1 : b[1] - a[1])) };
}

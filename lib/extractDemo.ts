// Rule-based chat-to-invoice parser (demo mode) and shared normalisation. No runtime imports, so it is unit-testable.
import type { InvoiceItem } from "./store";

export type Extracted = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  description: string;
  items: InvoiceItem[];
  currency: string;
  dueDate: string; // YYYY-MM-DD or ""
  notes: string; // how dates/amounts were read
  missing: string[];
  extractedBy: "ai" | "demo";
};

export function normalise(e: Extracted): Extracted {
  const items = e.items
    .map((i) => ({ name: i.name.trim().slice(0, 200), quantity: Math.max(1, Number(i.quantity) || 1), unitPrice: Math.round((Number(i.unitPrice) || 0) * 100) / 100 }))
    .filter((i) => i.name && i.unitPrice > 0);
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(e.dueDate) ? e.dueDate : "";
  const missing = new Set(e.missing);
  if (!e.clientName) missing.add("Client name");
  if (!e.clientEmail) missing.add("Client email");
  if (!items.length) missing.add("Amount");
  if (!dueDate) missing.add("Due date");
  return { ...e, currency: (e.currency || "USD").toUpperCase().slice(0, 3), items, dueDate, missing: [...missing] };
}

// ---------------- demo parser ----------------

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function nextDate(month: number, day: number, today: Date): string {
  let y = today.getUTCFullYear();
  const t = Date.UTC(y, today.getUTCMonth(), today.getUTCDate());
  if (Date.UTC(y, month, day) < t) y += 1;
  return new Date(Date.UTC(y, month, day)).toISOString().slice(0, 10);
}

export function demoExtract(text: string, today = new Date()): Extracted {
  const t = text.replace(/\r/g, "");
  // Prefer a real address over platform no-reply senders (Upwork, Fiverr, Instagram notifications).
  const emails = [...t.matchAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)].map((m) => m[0]);
  const PLATFORM = /no-?reply|donotreply|notification|mailer|upwork|fiverr|instagram|facebookmail|linkedin/i;
  const email = emails.find((e) => !PLATFORM.test(e)) ?? "";
  const phone = t.match(/\+?\d[\d\s().-]{8,}\d/)?.[0]?.replace(/[^\d+]/g, "") ?? "";

  // Amount + currency
  const cur = /€/.test(t) ? "EUR" : /£/.test(t) ? "GBP" : /₹|\bINR\b|\brs\.?\s?\d/i.test(t) ? "INR" : "USD";
  // Amounts with a currency symbol are the most reliable; then "budget/price is 500"; then "500 dollars".
  const amt =
    t.match(/[$€£₹]\s?([\d,]+(?:\.\d{1,2})?)\s?(k\b)?/i) ??
    t.match(/(?:budget|price|cost|fee|total|quote)\s*(?:is|of|:)?\s*([\d,]+(?:\.\d{1,2})?)\s?(k\b)?/i) ??
    t.match(/([\d,]+(?:\.\d{1,2})?)\s?(k\b)?\s?(?:usd|dollars|eur|euros|inr|rupees)/i);
  const amount = amt ? Number(amt[1].replace(/,/g, "")) * (amt[2] ? 1000 : 1) : 0;

  // Dates: "November 10", "10 Nov", "2026-11-10"
  let dueDate = "";
  let dateNote = "";
  const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  const md = t.match(new RegExp(`\\b(${MONTHS.join("|")})[a-z]*\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i"));
  const dm = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTHS.join("|")})[a-z]*\\b`, "i"));
  if (iso) dueDate = iso[0];
  else if (md) dueDate = nextDate(MONTHS.indexOf(md[1].slice(0, 3).toLowerCase()), +md[2], today);
  else if (dm) dueDate = nextDate(MONTHS.indexOf(dm[2].slice(0, 3).toLowerCase()), +dm[1], today);
  const net = t.match(/net\s?(\d{1,3})/i);
  if (!dueDate && net) {
    // "net 15 from today" (or no date at all): count from today.
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + Number(net[1])));
    dueDate = d.toISOString().slice(0, 10);
    dateNote = `Due ${net[1]} days from today (net ${net[1]}).`;
  } else if (dueDate) {
    if (net) {
      const d = new Date(`${dueDate}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + Number(net[1]));
      dateNote = `Due ${net[1]} days after the date mentioned (net ${net[1]}).`;
      dueDate = d.toISOString().slice(0, 10);
    } else if (/after delivery|on delivery|upon delivery|when (?:it'?s )?delivered/i.test(t)) {
      dateNote = "Payment is due on delivery, so the due date is the delivery date.";
    } else dateNote = "Due date taken from the date in the conversation.";
  }

  // Name: chat speaker prefixes ("Sarah: ..."), sign-offs, or "I'm X".
  const speakers = [...t.matchAll(/^\s*(?:\[[^\]]*\]\s*)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*:/gm)].map((m) => m[1]).filter((n) => !/^(Me|You|Client|Freelancer|Subject|From|To|Re)$/i.test(n));
  const fromRaw = t.match(/^From:\s*([^<\n]+?)\s*</m)?.[1];
  const from = fromRaw && !PLATFORM.test(fromRaw) ? fromRaw : undefined;
  // Platform notifications: "Marco Silva (Silva Logistics) wrote:" / "New message from Marco Silva"
  const wrote = t.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*(?:\(([^)]{2,60})\))?\s*(?:wrote|says|sent you a message)\s*:/);
  const msgFrom = t.match(/(?:message|reply|offer) from\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/)?.[1];
  const intro = t.match(/\b(?:I'm|I am|this is|my name is|it's|it is|[Ii]t's|[Ii]t is|[Tt]his is)\s+([A-Z][a-z]+)(?:\s(?!from\b)[A-Z][a-z]+)?/)?.[1];
  const signoff = t.match(/(?:thanks|thank you|cheers|regards|best)[,!.]?\s*\n+\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*$/im)?.[1];
  const name = (from || wrote?.[1] || msgFrom || speakers.find((n) => !PLATFORM.test(n)) || intro || signoff || "").trim();
  const company = wrote?.[2] ?? t.match(/\b(?:from|at|with)\s+([A-Z][\w&.-]*(?:\s(?:[A-Z][\w&.-]*|Inc\.?|LLC|Ltd\.?|Co\.?))*)/)?.[1] ?? "";

  // Work description
  const sentence =
    t.match(/(?:i|we)\s+(?:need|want|would like|'d like|are looking for|am looking for)\s+([^.\n!?]+)/i)?.[1] ??
    t.match(/(?:build|design|create|develop|write|redesign|shoot|photograph|edit|film|record|translate|illustrate|code)\s+([^.\n!?]+)/i)?.[0] ??
    t.match(/(?:invoice us|bill us|invoice me|charge us)[^.\n]*?\bfor\s+([^.\n!?"]+)/i)?.[1] ??
    t.match(/(?:work on|great work on)\s+(?:the\s+)?([^.\n!?"]+)/i)?.[1] ??
    "";
  const work = sentence.replace(/^(?:a|an|the)\s+/i, "").replace(/\s+/g, " ").trim();
  const itemName = work ? work.charAt(0).toUpperCase() + work.slice(1, 120) : "Project work";

  return normalise({
    clientName: name,
    clientEmail: email,
    clientPhone: phone,
    clientCompany: company === name ? "" : company,
    description: work ? `${itemName}.` : "",
    items: amount > 0 ? [{ name: itemName, quantity: 1, unitPrice: amount }] : [],
    currency: cur,
    dueDate,
    notes: dateNote || "No due date found; add one before approving.",
    missing: [],
    extractedBy: "demo",
  });
}

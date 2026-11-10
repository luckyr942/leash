// AI collections assistant: the rules pick the stage; Gemini explains it and drafts the wording.
// Nothing is sent from here. The person reviews, edits and taps a channel to send.
import { askJSON, aiConfigured } from "./client";
import { assess, STAGE_LABEL, type Assessment, type Stage } from "@/lib/domain/rules";
import type { Invoice, Profile } from "@/lib/domain/models";

export type Draft = {
  stage: Stage | "SEND";
  subject: string;
  email: string; // longer message for email / PayPal reminder
  short: string; // one or two lines for SMS / WhatsApp / Telegram
  why: string; // plain-English explanation of the recommendation
  draftedBy: "ai" | "template";
};

const money = (n: number, c: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);
const pretty = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric" });
const first = (name: string) => name.trim().split(/\s+/)[0] || "there";

const TONE: Record<Stage | "SEND", string> = {
  SEND: "warm and professional; this is the first time the client sees the invoice",
  FRIENDLY: "light and friendly, assume they simply forgot; no pressure",
  FIRM: "polite but clear and direct; state the amount, how late it is, and ask for payment by a specific date 5 days from now",
  FINAL:
    "formal and serious, still courteous; say this is the final reminder and that you'll need to pause work or take further steps if unpaid by a date 7 days from now",
  ESCALATE:
    "not an email to send automatically: write a short, calm note the freelancer could use to open a direct conversation (phone call or meeting) about the overdue invoice",
};

const SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    email: { type: "string", description: "Plain-text email body, 60-140 words, signed with the freelancer's name. Include the placeholder {{link}} once." },
    short: { type: "string", description: "WhatsApp/SMS version under 280 characters, include {{link}} once." },
    why: { type: "string", description: "One or two sentences for the freelancer explaining why this step and tone fit now." },
  },
  required: ["subject", "email", "short", "why"],
};

export async function draftMessage(inv: Invoice, profile: Profile, today = new Date()): Promise<Draft & { assessment: Assessment }> {
  const a = assess(inv, today);
  // Rule stage when overdue; a gentle friendly note if the person chooses to nudge early; "SEND" for unsent invoices.
  const stage: Stage | "SEND" =
    a.action === "FRIENDLY" || a.action === "FIRM" || a.action === "FINAL" || a.action === "ESCALATE" ? a.action : inv.status === "SENT" ? "FRIENDLY" : "SEND";
  const base = template(inv, profile, stage, a);
  if (!aiConfigured()) return { ...base, assessment: a };

  try {
    const d = await askJSON<{ subject: string; email: string; short: string; why: string }>(
      "You write payment follow-ups for a freelancer. Use only the facts given. Never threaten legal action, never invent fees or deadlines " +
        "beyond those described in the tone. Keep it human and short. Use {{link}} where the payment link goes.",
      JSON.stringify({
        tone: TONE[stage],
        step: stage === "SEND" ? "Send the invoice" : STAGE_LABEL[stage],
        ruleReason: a.reason,
        today: today.toISOString().slice(0, 10),
        freelancer: { name: profile.yourName, business: profile.business },
        client: { name: inv.client.name, company: inv.client.company },
        invoice: {
          number: inv.number,
          amount: money(inv.total, inv.currency),
          dueDate: inv.dueDate,
          daysOverdue: Math.max(0, a.daysOverdue),
          work: inv.description || inv.items.map((i) => i.name).join(", "),
          remindersAlreadySent: inv.reminders.map((r) => ({ stage: r.stage, on: r.at.slice(0, 10), via: r.channel })),
        },
      }),
      SCHEMA,
    );
    if (!d?.email || !d?.subject) return { ...base, assessment: a };
    return { stage, subject: d.subject, email: d.email, short: d.short || base.short, why: d.why || base.why, draftedBy: "ai", assessment: a };
  } catch {
    return { ...base, assessment: a }; // never block a follow-up on the AI
  }
}

function template(inv: Invoice, p: Profile, stage: Stage | "SEND", a: Assessment): Draft {
  const amt = money(inv.total, inv.currency);
  const n = first(inv.client.name);
  const me = p.yourName || p.business || "Me";
  const due = pretty(inv.dueDate);
  const days = Math.max(0, a.daysOverdue);
  const by = (d: number) => pretty(new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10));
  const work = inv.description ? inv.description.replace(/\.$/, "").toLowerCase() : "the project";
  const t: Record<Stage | "SEND", Omit<Draft, "draftedBy" | "stage" | "why">> = {
    SEND: {
      subject: `Invoice ${inv.number} for ${work}`,
      email: `Hi ${n},\n\nThanks again for the work on ${work}. Here's invoice ${inv.number} for ${amt}, due ${due}. You can pay securely by PayPal or card here: {{link}}\n\nLet me know if you have any questions.\n\nBest,\n${me}`,
      short: `Hi ${n}, here's invoice ${inv.number} for ${amt} (due ${due}). Pay by PayPal or card: {{link}} Thanks! – ${me}`,
    },
    FRIENDLY: {
      subject: `Quick reminder: invoice ${inv.number}`,
      email: `Hi ${n},\n\nHope all's well! Just a friendly reminder that invoice ${inv.number} for ${amt} was due on ${due}. In case it slipped through, here's the link to pay: {{link}}\n\nThanks so much,\n${me}`,
      short: `Hi ${n}, friendly nudge: invoice ${inv.number} (${amt}) was due ${due}. Here's the link: {{link}} Thanks! – ${me}`,
    },
    FIRM: {
      subject: `Payment overdue: invoice ${inv.number} (${amt})`,
      email: `Hi ${n},\n\nInvoice ${inv.number} for ${amt} is now ${days} days past its due date of ${due}. Could you please arrange payment by ${by(5)}? You can pay here: {{link}}\n\nIf there's an issue with the invoice, just reply and we'll sort it out.\n\nThanks,\n${me}`,
      short: `Hi ${n}, invoice ${inv.number} (${amt}) is ${days} days overdue. Please pay by ${by(5)}: {{link}} – ${me}`,
    },
    FINAL: {
      subject: `Final notice: invoice ${inv.number} (${amt})`,
      email: `Hi ${n},\n\nThis is a final reminder that invoice ${inv.number} for ${amt} is ${days} days overdue (due ${due}). Please pay by ${by(7)} using this link: {{link}}\n\nIf it remains unpaid after that date, I'll need to pause any further work and take next steps to recover the balance. I'd much rather resolve it with you directly, so please get in touch if anything is holding it up.\n\nRegards,\n${me}`,
      short: `Hi ${n}, final notice: invoice ${inv.number} (${amt}) is ${days} days overdue. Please pay by ${by(7)}: {{link}} – ${me}`,
    },
    ESCALATE: {
      subject: `Can we talk about invoice ${inv.number}?`,
      email: `Hi ${n},\n\nInvoice ${inv.number} for ${amt} is now ${days} days overdue and my earlier reminders haven't reached a resolution. Could we get on a quick call this week to sort it out? If a payment plan would help, I'm open to that.\n\nThe invoice is here for reference: {{link}}\n\nThanks,\n${me}`,
      short: `Hi ${n}, invoice ${inv.number} (${amt}) is ${days} days overdue. Can we have a quick call this week to sort it out? – ${me}`,
    },
  };
  const why = stage === "SEND" ? "The invoice is approved but the client hasn't received it yet." : `${a.reason} Tone: ${TONE[stage].split(";")[0]}.`;
  return { stage, ...t[stage], why, draftedBy: "template" };
}

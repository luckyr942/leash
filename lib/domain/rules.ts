// Collections rules: plain, deterministic code decides WHAT to do.
// The AI only explains the recommendation and drafts the wording; a person approves every send.
// No imports, so it runs in the browser, the server and the unit tests alike.

export type Stage = "FRIENDLY" | "FIRM" | "FINAL" | "ESCALATE";
export type Action = "APPROVE" | "SEND" | "WAIT" | Stage | "NONE";

export type RuleInvoice = {
  status: "DRAFT" | "APPROVED" | "SENT" | "PAID" | "CANCELLED";
  dueDate: string; // YYYY-MM-DD
  reminders: { at: string; stage: Stage }[];
  escalatedAt?: string;
};

export type Assessment = {
  action: Action;
  daysOverdue: number; // negative = days until due
  label: string;
  reason: string;
  severity: number; // 0 (nothing) .. 5 (escalate), for sorting
};

export const STAGE_ORDER: Stage[] = ["FRIENDLY", "FIRM", "FINAL", "ESCALATE"];
export const COOLDOWN_DAYS = 3;
const DAY = 86_400_000;

export const STAGE_LABEL: Record<Stage, string> = {
  FRIENDLY: "Friendly reminder",
  FIRM: "Firm reminder",
  FINAL: "Final notice",
  ESCALATE: "Escalate",
};

/** Whole days from due date to today (positive = overdue). Uses calendar days in UTC. */
export function daysOverdue(dueDate: string, today = new Date()): number {
  const due = Date.UTC(+dueDate.slice(0, 4), +dueDate.slice(5, 7) - 1, +dueDate.slice(8, 10));
  const t = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((t - due) / DAY);
}

export function stageFor(days: number): Stage | null {
  if (days <= 0) return null;
  if (days <= 7) return "FRIENDLY";
  if (days <= 21) return "FIRM";
  if (days <= 30) return "FINAL";
  return "ESCALATE";
}

export function isOverdue(inv: Pick<RuleInvoice, "status" | "dueDate">, today = new Date()) {
  return inv.status === "SENT" && daysOverdue(inv.dueDate, today) > 0;
}

export function assess(inv: RuleInvoice, today = new Date()): Assessment {
  const days = daysOverdue(inv.dueDate, today);
  if (inv.status === "PAID" || inv.status === "CANCELLED") {
    return { action: "NONE", daysOverdue: days, label: inv.status === "PAID" ? "Paid" : "Cancelled", reason: "Nothing to do.", severity: 0 };
  }
  if (inv.status === "DRAFT") {
    return {
      action: "APPROVE",
      daysOverdue: days,
      label: "Review & approve",
      reason: "Drafted but not approved yet. Nothing goes to PayPal until you approve it.",
      severity: 2,
    };
  }
  if (inv.status === "APPROVED") {
    return { action: "SEND", daysOverdue: days, label: "Send invoice", reason: "Approved and created in PayPal, but not sent to the client yet.", severity: 2 };
  }
  // SENT
  if (inv.escalatedAt) {
    return {
      action: "NONE",
      daysOverdue: days,
      label: "Escalated",
      reason: "You've taken this one offline. Mark it paid when the money arrives.",
      severity: 1,
    };
  }
  const stage = stageFor(days);
  if (!stage) {
    const label = days === 0 ? "Due today" : `Due in ${-days} day${days === -1 ? "" : "s"}`;
    return { action: "WAIT", daysOverdue: days, label, reason: "Not overdue yet. No reminder needed; the client has the PayPal link.", severity: 0 };
  }
  const last = [...inv.reminders].sort((a, b) => b.at.localeCompare(a.at))[0];
  if (last && stage !== "ESCALATE") {
    const since = Math.floor((today.getTime() - new Date(last.at).getTime()) / DAY);
    const sameOrHigher = STAGE_ORDER.indexOf(last.stage) >= STAGE_ORDER.indexOf(stage);
    if (since < COOLDOWN_DAYS || sameOrHigher) {
      const next = new Date(new Date(last.at).getTime() + COOLDOWN_DAYS * DAY);
      const nextStage = nextStageAfter(last.stage, days);
      return {
        action: "WAIT",
        daysOverdue: days,
        label: `${days} days overdue · reminded`,
        reason: sameOrHigher
          ? `You already sent a ${STAGE_LABEL[last.stage].toLowerCase()} ${since === 0 ? "today" : `${since} day${since === 1 ? "" : "s"} ago`}. Next step: ${STAGE_LABEL[nextStage.stage].toLowerCase()} on day ${nextStage.day}.`
          : `You sent a reminder ${since === 0 ? "today" : `${since} day${since === 1 ? "" : "s"} ago`}. Give the client until ${next.toISOString().slice(0, 10)} before nudging again.`,
        severity: 1,
      };
    }
  }
  const severity = { FRIENDLY: 3, FIRM: 4, FINAL: 4.5, ESCALATE: 5 }[stage];
  const reason = {
    FRIENDLY: `${days} day${days === 1 ? "" : "s"} overdue. A friendly, no-pressure nudge usually gets paid within the week.`,
    FIRM: `${days} days overdue. Time for a clear, polite reminder with the amount and a specific pay-by date.`,
    FINAL: `${days} days overdue. Send a final notice and say what happens next if it isn't paid.`,
    ESCALATE: `${days} days overdue. Reminders haven't worked. Talk to the client directly or consider a formal step; Leash won't keep emailing.`,
  }[stage];
  return { action: stage, daysOverdue: days, label: `${days} days overdue`, reason, severity };
}

function nextStageAfter(stage: Stage, days: number): { stage: Stage; day: number } {
  const i = STAGE_ORDER.indexOf(stage);
  const next = STAGE_ORDER[Math.min(i + 1, STAGE_ORDER.length - 1)];
  const startDay = { FRIENDLY: 1, FIRM: 8, FINAL: 22, ESCALATE: 31 }[next];
  return { stage: next, day: Math.max(startDay, days + 1) };
}

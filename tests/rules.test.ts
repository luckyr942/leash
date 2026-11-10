import { test } from "node:test";
import assert from "node:assert/strict";
import { assess, daysOverdue, stageFor, type RuleInvoice } from "@/lib/domain/rules";

const today = new Date("2026-11-20T12:00:00Z");
const due = (daysAgo: number) => new Date(today.getTime() - daysAgo * 86_400_000).toISOString().slice(0, 10);
const sent = (daysAgo: number, reminders: RuleInvoice["reminders"] = []): RuleInvoice => ({ status: "SENT", dueDate: due(daysAgo), reminders });
const ago = (d: number) => new Date(today.getTime() - d * 86_400_000).toISOString();

test("days overdue counts calendar days", () => {
  assert.equal(daysOverdue("2026-11-19", today), 1);
  assert.equal(daysOverdue("2026-11-20", today), 0);
  assert.equal(daysOverdue("2026-11-25", today), -5);
});

test("stage table matches the policy", () => {
  assert.equal(stageFor(0), null);
  assert.equal(stageFor(1), "FRIENDLY");
  assert.equal(stageFor(7), "FRIENDLY");
  assert.equal(stageFor(8), "FIRM");
  assert.equal(stageFor(21), "FIRM");
  assert.equal(stageFor(22), "FINAL");
  assert.equal(stageFor(30), "FINAL");
  assert.equal(stageFor(31), "ESCALATE");
});

test("not yet due: wait", () => {
  assert.equal(assess(sent(-4), today).action, "WAIT");
  assert.equal(assess(sent(0), today).label, "Due today");
});

test("each overdue band suggests its stage", () => {
  assert.equal(assess(sent(3), today).action, "FRIENDLY");
  assert.equal(assess(sent(12), today).action, "FIRM");
  assert.equal(assess(sent(25), today).action, "FINAL");
  assert.equal(assess(sent(45), today).action, "ESCALATE");
});

test("drafts need approval and approved invoices need sending", () => {
  assert.equal(assess({ status: "DRAFT", dueDate: due(-10), reminders: [] }, today).action, "APPROVE");
  assert.equal(assess({ status: "APPROVED", dueDate: due(-10), reminders: [] }, today).action, "SEND");
});

test("paid and cancelled need nothing", () => {
  assert.equal(assess({ status: "PAID", dueDate: due(40), reminders: [] }, today).action, "NONE");
  assert.equal(assess({ status: "CANCELLED", dueDate: due(40), reminders: [] }, today).action, "NONE");
});

test("one reminder per stage, with a cool-down", () => {
  // Friendly sent 2 days ago, still in the friendly band: wait.
  assert.equal(assess(sent(5, [{ at: ago(2), stage: "FRIENDLY" }]), today).action, "WAIT");
  // Friendly sent long ago, now in the firm band: firm.
  assert.equal(assess(sent(12, [{ at: ago(9), stage: "FRIENDLY" }]), today).action, "FIRM");
  // Firm sent 1 day ago but now in the final band: still wait for the cool-down.
  assert.equal(assess(sent(22, [{ at: ago(1), stage: "FIRM" }]), today).action, "WAIT");
  // Firm already sent in this band: wait until the final band.
  const a = assess(sent(15, [{ at: ago(5), stage: "FIRM" }]), today);
  assert.equal(a.action, "WAIT");
  assert.match(a.reason, /final notice on day 22/);
});

test("escalated invoices stop suggesting reminders", () => {
  assert.equal(assess({ ...sent(45), escalatedAt: ago(1) }, today).action, "NONE");
});

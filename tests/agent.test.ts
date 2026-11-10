import "./helpers/isolated-env";
import { test } from "node:test";
import assert from "node:assert/strict";
import { runAgent } from "@/lib/ai/agent";
import { sampleWorkspace } from "./helpers/fixtures";

// The core product promise: the assistant can PREPARE a send or a reminder, but never execute one.
// (No Gemini key in tests, so this exercises the built-in assistant and the shared tools.)

test("'send' prepares a confirm card and changes nothing", async () => {
  const s = sampleWorkspace();
  const draft = s.invoices().find((i) => i.status === "DRAFT")!;
  const before = s.activity().length;

  const r = await runAgent(s, [{ role: "user", text: `Send ${draft.number}` }]);

  const card = r.cards.find((c) => c.type === "action");
  assert.ok(card, "returns an action card");
  assert.deepEqual(card.type === "action" && card.steps, ["approve", "send"]);
  assert.match(r.reply, /tap Confirm/i);
  assert.equal(s.getInvoice(draft.id)!.status, "DRAFT", "still a draft until the user confirms");
  assert.equal(s.activity().length, before, "nothing was logged as sent");
});

test("'remind' prepares a reminder card and sends nothing", async () => {
  const s = sampleWorkspace();
  const priya = s.invoices().find((i) => i.client.name === "Priya Nair")!;
  const reminders = priya.reminders.length;

  const r = await runAgent(s, [{ role: "user", text: "Remind Priya" }]);

  const card = r.cards.find((c) => c.type === "action");
  assert.ok(card, "returns an action card");
  assert.deepEqual(card.type === "action" && card.steps, ["remind"]);
  assert.equal(s.getInvoice(priya.id)!.reminders.length, reminders, "no reminder recorded until the user confirms");
});

test("questions are answered from real workspace data", async () => {
  const s = sampleWorkspace();
  const r = await runAgent(s, [{ role: "user", text: "Who owes me money?" }]);
  assert.match(r.reply, /follow-up/);
  assert.equal(r.cards.filter((c) => c.type === "action").length, 0, "a question never prepares an action");
});

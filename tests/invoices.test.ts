import "./helpers/isolated-env";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createDraft, invoiceAction, validate } from "@/lib/services/invoices";
import { HttpError } from "@/lib/server/errors";
import { draftInput, emptyWorkspace } from "./helpers/fixtures";

const ctx = { appUrl: "http://localhost:3000" };
const rejects = (fn: () => unknown, status: number, re: RegExp) =>
  assert.throws(fn, (e: unknown) => e instanceof HttpError && e.status === status && re.test(e.message));

test("validate: rejects incomplete invoices with a clear message", () => {
  rejects(() => validate(draftInput({ client: { name: "" } })), 400, /client's name/);
  rejects(() => validate(draftInput({ client: { name: "Ada", email: "not-an-email" } })), 400, /email/);
  rejects(() => validate(draftInput({ items: [] })), 400, /at least one line/);
  rejects(() => validate(draftInput({ dueDate: "next week" })), 400, /due date/);
  rejects(() => validate(draftInput({ currency: "U5D" })), 400, /3-letter/);
});

test("validate: cleans input (trims, rounds prices, drops empty lines, upper-cases currency)", () => {
  const v = validate(
    draftInput({
      currency: "eur",
      items: [
        { name: "  Design  ", quantity: 2, unitPrice: 10.005 },
        { name: "", quantity: 1, unitPrice: 5 },
      ],
    }),
  );
  assert.equal(v.currency, "EUR");
  assert.deepEqual(v.items, [{ name: "Design", quantity: 2, unitPrice: 10.01 }]);
});

test("demo mode: draft → approve → send → remind → paid, each step logged", async () => {
  const s = emptyWorkspace();
  const draft = createDraft(s, validate(draftInput()), "manual");
  assert.equal(draft.status, "DRAFT");
  assert.equal(draft.total, 12.5);
  assert.equal(draft.simulated, true, "no PayPal keys, so the invoice is simulated");

  const approved = await invoiceAction(s, draft.id, "approve", ctx);
  assert.equal(approved.status, "APPROVED");
  assert.match(approved.paypalInvoiceId!, /^SIM-INV2-/);

  const sent = await invoiceAction(s, draft.id, "send", ctx);
  assert.equal(sent.status, "SENT");
  assert.match(sent.payUrl!, new RegExp(`^http://localhost:3000/pay/${draft.id}\\?t=`));

  const reminded = await invoiceAction(s, draft.id, "remind", { ...ctx, channel: "paypal", stage: "FIRM" });
  assert.equal(reminded.reminders.length, 1);
  assert.equal(reminded.reminders[0].stage, "FIRM");

  const paid = await invoiceAction(s, draft.id, "mark_paid", ctx);
  assert.equal(paid.status, "PAID");

  const types = s.activity().map((a) => a.type);
  for (const t of ["created", "approved", "sent", "reminder_sent", "paid"]) assert.ok(types.includes(t), `activity has ${t}`);
});

test("lifecycle guards: steps can't be skipped or repeated", async () => {
  const s = emptyWorkspace();
  const { id } = createDraft(s, validate(draftInput()), "manual");
  await assert.rejects(invoiceAction(s, id, "send", ctx), /Approve the invoice before sending/);
  await assert.rejects(invoiceAction(s, id, "remind", ctx), /Only sent invoices/);
  await assert.rejects(invoiceAction(s, id, "mark_paid", ctx), /Only sent invoices/);
  await invoiceAction(s, id, "approve", ctx);
  await assert.rejects(invoiceAction(s, id, "approve", ctx), /Only drafts/);
  await assert.rejects(invoiceAction(s, id, "explode", ctx), /Unknown action/);
  await assert.rejects(invoiceAction(s, "nope1234", "approve", ctx), /No such invoice/);
});

test("approve needs a client email", async () => {
  const s = emptyWorkspace();
  const { id } = createDraft(s, validate(draftInput({ client: { name: "No Email" } })), "manual");
  await assert.rejects(invoiceAction(s, id, "approve", ctx), /client's email/);
});

test("cancel works before payment and not after", async () => {
  const s = emptyWorkspace();
  const { id } = createDraft(s, validate(draftInput()), "manual");
  assert.equal((await invoiceAction(s, id, "cancel", ctx)).status, "CANCELLED");
  await assert.rejects(invoiceAction(s, id, "cancel", ctx), /already cancelled/);
});

// End-to-end test against a running Leash (local or deployed), using real Gemini and the PayPal sandbox.
//
//   node scripts/e2e-live.mjs <app-url> <sandbox-buyer-email> [--wait]
//   node scripts/e2e-live.mjs https://leash-58zl.onrender.com sb-xxxx@personal.example.com --wait
//
// It creates one small invoice ($2) in a fresh workspace, approves and sends it through PayPal,
// checks AI extraction, follow-up drafting, the assistant, inbox imports and webhook security.
// With --wait it then waits (up to 10 minutes) for you to pay the invoice as the sandbox buyer,
// and checks that the PayPal webhook marks it PAID on its own (no manual refresh).
const [base0, buyer, flag] = process.argv.slice(2);
if (!base0 || !buyer) {
  console.error("Usage: node scripts/e2e-live.mjs <app-url> <sandbox-buyer-email> [--wait]");
  process.exit(2);
}
const BASE = base0.replace(/\/$/, "");
let cookie = "";
let failures = 0;
const ok = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const bad = (msg) => (failures++, console.log(`  \x1b[31m✗\x1b[0m ${msg}`));
const check = (cond, pass, fail = pass) => (cond ? ok(pass) : bad(fail));
const step = (name) => console.log(`\n\x1b[1m${name}\x1b[0m`);

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { cookie, origin: BASE, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120_000),
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const t0 = Date.now();
console.log(`Leash end-to-end test → ${BASE}`);

step("1. App is up");
{
  const t = Date.now();
  const r = await api("/api/health");
  check(r.status === 200 && r.json.ok, `health OK (${Date.now() - t} ms${Date.now() - t > 5000 ? ", it was asleep" : ""})`, `health failed: ${r.status}`);
}

step("2. Configuration");
const state = (await api("/api/state")).json;
check(!!cookie, "got a private workspace (session cookie)", "no session cookie");
check(state.config?.paypal, `PayPal connected (${state.config?.env})`, "PayPal keys missing");
check(state.config?.ai, `Gemini on (${state.config?.aiModel})`, `Gemini off: ${state.config?.aiProblem ?? "no key"}`);
check(state.config?.webhooks, "PayPal webhook configured", "PAYPAL_WEBHOOK_ID not set");
check(state.invoices?.length > 0, `sample month loaded (${state.invoices?.length} invoices)`, "no sample data");

step("3. Chat → invoice (Gemini)");
const chat = `Hi! Could you resize my logo for Instagram? Budget is $2. My email is ${buyer}. Need it by the end of the month. Thanks, Ravi`;
const ex = await api("/api/extract", { method: "POST", body: { conversation: chat } });
const e = ex.json.extracted ?? {};
check(
  ex.status === 200,
  `extracted in ${ex.status === 200 ? "OK" : ex.status}: client "${e.clientName}", ${e.currency} ${e.items?.[0]?.unitPrice}`,
  `extract failed: ${ex.json.error}`,
);
check(e.clientEmail?.toLowerCase() === buyer.toLowerCase(), "found the client email", `email not found (got "${e.clientEmail}")`);
check(e.items?.[0]?.unitPrice === 2, "found the $2 price", `price wrong (${e.items?.[0]?.unitPrice})`);

step("4. Draft → approve → send through PayPal");
const due = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
const draft = await api("/api/invoices", {
  method: "POST",
  body: {
    source: "chat",
    invoice: {
      client: { name: e.clientName || "Ravi", email: buyer },
      description: e.description || "Logo resize",
      items: [{ name: e.items?.[0]?.name || "Logo resize for Instagram", quantity: 1, unitPrice: 2 }],
      currency: "USD",
      dueDate: due,
      note: "Leash end-to-end test",
    },
  },
});
const inv = draft.json.invoice;
check(draft.status === 201 && inv?.status === "DRAFT", `draft ${inv?.number} saved ($${inv?.total})`, `draft failed: ${draft.json.error}`);
if (!inv) process.exit(1);
check(inv.simulated === false, "it's a live PayPal invoice, not simulated", "invoice is simulated (PayPal not configured)");

const ap = await api(`/api/invoices/${inv.id}`, { method: "POST", body: { action: "approve" } });
check(
  ap.json.invoice?.status === "APPROVED" && /^INV2-/.test(ap.json.invoice?.paypalInvoiceId ?? ""),
  `approved → created in PayPal as ${ap.json.invoice?.paypalInvoiceId}`,
  `approve failed: ${ap.json.error}`,
);

const sent = await api(`/api/invoices/${inv.id}`, { method: "POST", body: { action: "send" } });
const payUrl = sent.json.invoice?.payUrl;
check(sent.json.invoice?.status === "SENT", "sent → PayPal emailed the invoice to the buyer", `send failed: ${sent.json.error}`);
check(/paypal\.com/.test(payUrl ?? ""), `PayPal pay link: ${payUrl}`, "no PayPal pay link");

step("5. Follow-ups (rules + Gemini)");
const priya = state.invoices.find((i) => i.client.name === "Priya Nair");
const fu = await api(`/api/invoices/${priya.id}/followup`, { method: "POST" });
const d = fu.json.draft;
check(fu.status === 200 && d?.stage, `overdue sample → stage ${d?.stage}: "${d?.subject}"`, `follow-up failed: ${fu.json.error}`);
check((d?.email ?? "").length > 40, "reminder email drafted", "no draft text");

step("6. Assistant (never sends on its own)");
const before = (await api("/api/state")).json.activity.length;
const ag = await api("/api/agent", { method: "POST", body: { messages: [{ role: "user", text: `Send a reminder to Priya` }] } });
check(ag.status === 200 && ag.json.reply, `assistant: "${(ag.json.reply ?? "").slice(0, 90)}…"`, `assistant failed: ${ag.json.error}`);
check(
  (ag.json.cards ?? []).some((c) => c.type === "action"),
  "prepared a Confirm card instead of sending",
  "no confirm card (reply only)",
);
const after = (await api("/api/state")).json;
check(!after.activity.slice(0, after.activity.length - before).some((a) => a.type === "reminder_sent"), "nothing was sent without a tap");

step("7. Inbox imports");
const wa = await api("/api/inbox", {
  method: "POST",
  body: {
    action: "import_whatsapp",
    text: "[05/11/2026, 10:15:40] Meera Shah: Hi! Can you edit my wedding video? Budget ₹8000.\n[05/11/2026, 10:16:02] Alex Rivera: Sure!\n[05/11/2026, 10:17:11] Meera Shah: Deliver by Nov 20 please",
  },
});
check(wa.json.item?.fromName === "Meera Shah", "WhatsApp export imported (Meera Shah)", `WhatsApp import failed: ${wa.json.error}`);
const pa = await api("/api/inbox", {
  method: "POST",
  body: { action: "add_paste", source: "Instagram", from: "Jess", text: "Jess: love your work! can you do 3 posts for $120?" },
});
check(!!pa.json.item, "pasted Instagram DM saved to the inbox", `paste failed: ${pa.json.error}`);

step("8. Security");
const fake = await fetch(`${BASE}/api/paypal/webhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ event_type: "INVOICING.INVOICE.PAID", resource: { id: ap.json.invoice?.paypalInvoiceId } }),
});
check(fake.status === 400, "forged 'paid' webhook rejected", `forged webhook got ${fake.status}`);
const xsite = await fetch(`${BASE}/api/invoices/${inv.id}`, {
  method: "POST",
  headers: { cookie, origin: "https://evil.example", "content-type": "application/json" },
  body: JSON.stringify({ action: "mark_paid" }),
});
check(xsite.status === 403, "cross-site request blocked", `cross-site request got ${xsite.status}`);

if (flag === "--wait" && payUrl) {
  step("9. Pay it and watch the webhook");
  console.log(`  Pay now as the sandbox buyer (${buyer}):\n    ${payUrl}\n  Waiting for PayPal's webhook (no manual refresh)…`);
  const until = Date.now() + 10 * 60_000;
  let paid = false;
  while (!paid && Date.now() < until) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = (await api("/api/state")).json;
    paid = s.invoices?.find((i) => i.id === inv.id)?.status === "PAID";
    process.stdout.write(".");
  }
  console.log("");
  check(paid, `${inv.number} turned PAID by itself via the webhook`, "not PAID after 10 minutes (check Render logs for 'PayPal webhook')");
} else if (payUrl) {
  console.log(`\nTo finish: pay ${payUrl} as ${buyer}, then open the invoice in Leash. Re-run with --wait to watch the webhook.`);
}

console.log(`\n${failures ? `\x1b[31m${failures} check(s) failed\x1b[0m` : "\x1b[32mAll checks passed\x1b[0m"} in ${Math.round((Date.now() - t0) / 1000)}s`);
process.exit(failures ? 1 : 0);

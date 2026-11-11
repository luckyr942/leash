# Testing Leash

Three levels: automated tests (no keys), an automated live check (real PayPal sandbox + Gemini), and a manual walkthrough of everything a judge would click.

## 1. Automated tests (1 minute, no keys)

```bash
npm run check
```

Typecheck, lint and 39 tests: collections rules, chat parsing, WhatsApp import, the invoice lifecycle, the PayPal client against a fake PayPal API, model fallback, and a guard that the assistant never sends without Confirm.

## 2. Automated live check (1 minute)

Runs against the deployed app with the real PayPal sandbox and Gemini. It creates one $2 invoice in its own private workspace.

```bash
npm run e2e -- https://leash-58zl.onrender.com <sandbox-personal-email>
```

Add `--wait` at the end, then pay the printed PayPal link as the sandbox buyer: the script waits and confirms the webhook marks the invoice **PAID** on its own.

Checks: health, keys, Gemini extraction, draft → approve → send through PayPal, follow-up drafting, the assistant preparing (not sending), WhatsApp and pasted-DM imports, forged-webhook rejection and cross-site blocking.

## 3. Manual walkthrough

You need: the live URL, and your **sandbox Personal** login (developer.paypal.com → Testing tools → Sandbox accounts). Use a private window for the buyer so the two logins don't mix.

### A. Chat → invoice → PayPal → paid (the core loop, 5 min)
1. Open the app → **New invoice**. Paste:
   `Hi! Can you design a poster? Budget $3. My email is <sandbox-personal-email>. Due Nov 25.`
2. **Extract invoice** → fields fill in (badge says *Extracted by Gemini*). Check client, $3, email, due date.
3. **Save draft** → **Approve & create in PayPal** → **Send via PayPal**. Status: **Sent**, with a PayPal pay link and QR.
4. Private window → sandbox.paypal.com → log in as the **Personal** buyer → the invoice email/notification → **Pay**.
5. Back in Leash, keep the invoice open. Within about a minute it turns **Paid** by itself (webhook). **Activity** shows "PayPal: … paid".

✅ Pass: Paid without clicking Refresh. If not, open Render → Logs and search `PayPal webhook`.

### B. Follow-ups (2 min)
1. **Follow-ups** → open an overdue sample (e.g. Priya, 12 days → **Firm**).
2. The rules show *why* this stage; Gemini drafts the email and a short chat version. Edit the text.
3. Tap **PayPal** to send it as a PayPal reminder (sample invoices are simulated, so this logs without emailing). Tap **WhatsApp** / **Email** / **SMS**: each opens with the text ready.
4. **Activity** logs the reminder with the channel.

### C. Assistant (2 min)
Ask in **Assistant**:
- "Who owes me money?" → real totals and invoice cards.
- "Remind Priya" → a **Confirm & send** card. Nothing is sent until you tap it.
- "List my invoices in PayPal" → read from your real PayPal account (Agent Toolkit).
- "Invoice this: Sam wants a logo for $200, sam@example.com, due Dec 1" → a draft appears in Invoices.

### D. Getting clients' messages into the Inbox

**Email (Gmail, 5 min)**: reads your mailbox and sends reminders from your address.
1. Google Account → Security → turn on **2-Step Verification** → search **App passwords** → create one named "Leash" → copy the 16 letters.
2. Leash → **Connections** → Email → Gmail → your address + the app password → **Connect** → **Send test email** (arrives in your inbox).
3. From a *different* email account, send yourself: `Hi, can you edit 10 photos for $150? Need them by Friday.`
4. Leash → **Inbox** → **Check now** → the email appears → **Draft invoice** → fields fill from the email.
5. On a sent invoice, a follow-up via **Email** now really sends from your Gmail.

**Telegram (5 min)**: clients message your bot.
1. Telegram → **@BotFather** → `/newbot` → pick a name → copy the token.
2. Leash → **Connections** → Telegram → paste the token → **Connect**.
3. From your phone, open your bot and send: `Hi! I need a logo, budget $250, email me@example.com`.
4. Leash → **Inbox** → **Check now** → the message appears → **Draft invoice**.
5. Reminders for that client can now go to their Telegram chat with one tap.

**WhatsApp (2 min)**: no account needed.
1. WhatsApp → open a chat → ⋮ / contact name → **Export chat** → **Without media** → save the `.txt`.
2. Leash → **Inbox** → **Import WhatsApp chat** → pick the file → the conversation appears → **Draft invoice**.

**Instagram / Upwork / Fiverr**: no public DM API. Turn on their email notifications (they arrive through the email connector), or **Inbox → Paste** the conversation and tag the source.

### E. Everything else (3 min)
- **Invoices**: AG Grid table: sort, filter by status, search, export CSV.
- **Overview**: totals in your home currency, receivables-by-age bar, "needs your attention" list.
- **Settings**: change name / business / currency → reflected on new invoices.
- **Theme**: toggle dark mode in the sidebar.
- **Phone**: open the URL on your phone (or scan the QR on the home page) → the layout adapts.
- **404**: open `/anything` → branded "Page not found".

## Before you submit
- [ ] `npm run check` passes and the GitHub CI badge is green
- [ ] `npm run e2e -- <url> <buyer> --wait` passes, including **PAID via webhook**
- [ ] Manual A–C done on the live URL
- [ ] cron-job.org pinging `/api/health` every 5 minutes, so judges never hit a sleeping app

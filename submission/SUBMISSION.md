# Devpost submission: copy-paste fields

> Fill the three `TODO` links after you deploy and upload the video. Everything else is ready.

---

## Step 1 · Project overview

**Project name** (60 max)

```
Leash: AI invoices and follow-ups for freelancers
```

**Elevator pitch** (200 max)

```
Turn client chats from Telegram, email or WhatsApp into PayPal invoices. When they're late, Leash says how to follow up and writes the message: one tap to send by PayPal, email, Telegram or WhatsApp.
```

**Thumbnail** (3:2, JPG/PNG/GIF, 5 MB max): upload `submission/leash-thumbnail.png` (1500×1000).

---

## Step 2 · Project details

### About the project (paste into the story box; Markdown is supported)

```markdown
## Inspiration
Freelancers are great at the work and terrible at the admin around getting paid. Every project starts in a chat ("Budget is $500, deliver by Nov 10") that someone has to turn into an invoice by hand, and ends, too often, with an awkward month of "just checking in…" emails. Late payments aren't a tooling problem so much as an emotional one: people don't know *when* to chase or *what* to say, so they don't. We wanted an assistant that handles both, without ever acting behind the freelancer's back.

## What it does
**Leash turns a client conversation into a PayPal invoice and then helps you collect it.**

1. **Chat → invoice.** Conversations arrive from your **Telegram bot**, your **email inbox** (including Upwork, Fiverr and Instagram notifications), an exported **WhatsApp** chat, or a pasted DM. AI extracts the client, contact details, the work, amount, currency and due date (it understands "payment due after delivery" and "net 30"), and lists anything missing instead of guessing.
2. **Review and approve.** Edit any field. Only when you approve does Leash create the invoice through the **PayPal Invoicing API**. Sending it gives the client a secure PayPal pay link (PayPal or card).
3. **Dashboard.** Outstanding, overdue and collected totals, receivables by age, and a "Needs your attention" list ranked by urgency.
4. **AI collections assistant.** Plain, predictable rules decide the step: *not yet due → wait, 1–7 days → friendly reminder, 8–21 → firm, 22–30 → final notice, 30+ → talk to the client directly.* One reminder per stage, at least three days apart. The AI explains the recommendation and drafts the message in the right tone, with an email version and a short WhatsApp/SMS version.
5. **One-tap sending.** Approve a reminder by tapping **PayPal** (sent through PayPal's reminder API with your text), **Email** (sent from your own connected address), **Telegram** (posted in the client's chat with your bot), **WhatsApp**, **SMS** or **Copy**.
6. **AI assistant that transacts, with your OK.** Ask "Who owes me?", "Check my messages", "Invoice this chat", "Send the invoice to Bruce" or "Remind Priya by email". A Gemini agent with tools answers from your real data, creates drafts and *prepares* sends and reminders as cards; each runs only when you tap **Confirm & send**. In live mode it also uses **PayPal's official Agent Toolkit** to read your real PayPal invoices.
7. **Multi-currency.** Bill each client in their own currency; the dashboard shows exact amounts per currency plus an approximate total at daily ECB rates.
8. **Pay-link QR codes** on every sent invoice, on screen and in print.
9. **Activity log.** Every AI suggestion and every action you approve (created, approved, sent, reminded, paid) is recorded, per invoice and overall. PayPal webhooks mark invoices paid automatically.

**The AI can't send anything on its own.** It drafts and prepares; you confirm.

## How we built it
- **Next.js 16 + TypeScript**, App Router, a light professional UI with a dark-mode toggle.
- **PayPal Invoicing v2**: create (with an idempotency key so retries never duplicate), send, remind (with the user-approved text), get and cancel. **PayPal Webhooks** (`INVOICING.INVOICE.PAID` / `CANCELLED`) are verified with PayPal's signature API before updating anything.
- **Google Gemini** (free tier, `@google/genai`) with **JSON-schema structured output** for chat-to-invoice extraction (including a `missing` list) and follow-up drafts, plus **function calling** for the assistant (seven tools over invoices, inbox and follow-ups, plus PayPal Agent Toolkit tools in live mode). Prepared actions come back as confirm cards, so the agent can transact without ever acting alone. If the key is missing or rejected, Leash falls back to rule-based logic automatically.
- **Connectors**: Telegram Bot API (polling, so it works on a laptop), email via Nodemailer (SMTP) + ImapFlow (IMAP) with app passwords, WhatsApp chat-export parser. Credentials are encrypted with AES-256-GCM. Prompts forbid inventing emails, phone numbers or prices, and treat the pasted chat as data, not instructions.
- **Rules engine** in plain TypeScript (`lib/domain/rules.ts`), unit-tested, so *when* to chase is deterministic and explainable.
- **SQLite** (Node's built-in `node:sqlite`) with a private workspace per browser: signed HttpOnly sessions, same-origin checks, rate limits, strict CSP.
- **Multi-currency** totals with daily ECB exchange rates (Frankfurter) and **QR codes** for pay links.
- **AG Grid** for the invoices table (status filters, quick search, CSV export).
- **Demo mode**: with no keys, a rule-based extractor, template drafts and a simulated PayPal (including a client pay page) make the full loop work for anyone. Add keys and the same screens go live on the PayPal sandbox.

## Challenges we ran into
- **Making AI helpful without letting it act.** We split *deciding* (deterministic rules) from *wording* (AI), and made every send an explicit tap that's logged.
- **Not nagging.** Early versions suggested a reminder every time you opened an invoice. We added one-reminder-per-stage with a cool-down, plus an "escalate" stage that stops emailing and suggests a call.
- **Messy conversations.** Dates without years, "after delivery", "€2.5k", "net 30", speaker prefixes and signatures. Extraction had to flag uncertainty rather than fill gaps.
- **One-tap across channels** without storing anyone's email or WhatsApp credentials: deep links open the freelancer's own apps with the approved text, and PayPal's reminder API carries the same text.

## Accomplishments that we're proud of
- The complete journey works end to end: chat → extracted invoice → approval → PayPal → pay link → client pays → follow-up suggestions → one-tap reminder → logged.
- Collections logic that's predictable enough to trust and explained in plain language every time.
- A clean, focused product a freelancer could use on day one, with a full audit trail.

## What we learned
Small, deterministic rules plus AI for language beats "let the agent decide" when money and relationships are involved. And the best follow-up feature is the one that tells you to *stop* emailing and pick up the phone.

## What's next for Leash
- A daily digest ("3 clients to nudge today") with approve-from-email links.
- Partial payments, deposits and payment plans (PayPal Invoicing supports partial payments).
- Recurring retainers via PayPal subscriptions.
- Reminders translated into the client's language.
- Gmail / WhatsApp Business integrations to read the conversation directly instead of pasting.
```

### Built with (tags)

```
nextjs, react, typescript, paypal, paypal-invoicing, paypal-webhooks, paypal-agent-toolkit, gemini, google-ai, telegram-bot-api, nodemailer, imap, sqlite, ag-grid, render, node.js
```

### "Try it out" links

```
TODO: https://github.com/<you>/leash
TODO: https://<your-app>.onrender.com
```

### Image gallery (upload in this order; captions)

| File | Caption |
|---|---|
| `1-landing.jpg` | Landing page: a real recording of Leash plays behind the hero |
| `2-overview.png` | Overview in USD, EUR and GBP: exact amounts per currency, a converted total, receivables by age, and who needs attention |
| `3-chat-to-invoice.png` | Paste a client chat; AI extracts the invoice and flags anything missing |
| `9-inbox.png` | Inbox: conversations from Telegram, email, WhatsApp and pasted DMs |
| `10-assistant.png` | AI assistant prepares a send and a reminder; each runs only when you tap Confirm & send |
| `11-connections.png` | Connect Telegram and email; WhatsApp import; how Instagram/Upwork/Fiverr come in |
| `5-invoice-final-notice.png` | Each invoice shows the next step, the AI's reasoning, the drafted message and one-tap channels |
| `4-followups.png` | Follow-ups queue: rules pick the step, AI drafts, you approve |
| `6-invoices.png` | All invoices in AG Grid with status filters, search and CSV export |
| `7-activity.png` | Activity log: every AI suggestion and every approval |
| `8-client-pay-page.png` | What the client sees: a secure PayPal pay link |

### Video demo link

```
TODO: https://youtu.be/<id>    (public, under 3 minutes; script in DEMO_SCRIPT.md)
```

---

## Step 3 · Additional info (typical questions; adapt to the exact wording on the form)

**Which PayPal products/APIs did you use and how?**
```
PayPal Invoicing API v2 (create, send, remind, get, cancel) and PayPal Webhooks (INVOICING.INVOICE.PAID / CANCELLED, signature-verified). Invoices are created only after the user approves; reminders are sent through PayPal's remind endpoint with the user-approved text; webhooks mark invoices paid automatically. Everything runs in the PayPal sandbox.
```

**Which AI tools did you use and how?**
```
Google Gemini (gemini-3.5-flash with automatic model fallback, free tier) via the @google/genai SDK: (1) JSON-schema output to extract invoice fields and missing details from client conversations; (2) drafts follow-up messages (email + short chat version) and explains why, for the step chosen by our deterministic rules; (3) function calling for an assistant that reads invoices/inbox and creates drafts. The AI never approves or sends; every send is an explicit, logged user action.
```

**Sponsor tools used** → select **AG Grid** (invoices table) and **Render** (hosting). Pick **AG Grid** if only one sponsor prize can be chosen.

**Testing instructions for judges**
```
Open the hosted URL; no sign-up. You get a private workspace with sample clients at every stage. Try: New invoice → "WhatsApp: landing page" example → Extract invoice → Approve & create in PayPal → Send via PayPal → open the pay link. Then Follow-ups → open an overdue client → review the draft → tap Send via PayPal (or Email / WhatsApp). Every step appears in Activity. To run locally: npm install && npm run dev (works without keys in demo mode; add PayPal sandbox + Anthropic keys for live mode, see README).
```

**Test credentials** → none needed (no login). If you want judges to see live PayPal, invoices go to the client email they enter; suggest they use a sandbox Personal account.

---

## Step 4 · Submit
- [ ] Teammates invited and accepted (Manage team)
- [ ] Repo public with README + MIT license
- [ ] Video public on YouTube, under 3 minutes
- [ ] Hosted demo running until Dec 21
- [ ] Submit at least a day before **Nov 12, 12:00 pm PST**

# Going live: checklist

Deadline **Thu Nov 12, 12:00 pm PST**. Keep the demo running until winners are announced on **Dec 21**.

## 1. Keys (about 15 minutes)
- [ ] `GEMINI_API_KEY` (free) from aistudio.google.com/apikey: starts with `AIza`, 39 characters
- [ ] PayPal sandbox app: developer.paypal.com → Apps & Credentials → **Sandbox** → Create App → copy `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
- [ ] Note one sandbox **Personal** account email (Testing tools → Sandbox accounts). Use it as the client email so you can receive and pay invoices
- [ ] `SESSION_SECRET` (`openssl rand -hex 32`, or let Render generate it)

Test locally: `cp .env.example .env.local`, fill in, `npm run dev`. Settings should show green ticks.

## 2. GitHub
- [ ] Public repo, push the project (`.env.local` and `data/` are git-ignored)
- [ ] MIT license visible in the repo's About section

## 3. Render
- [ ] New → Blueprint → the repo (uses `render.yaml`)
- [ ] Fill in the secret env vars; set `APP_URL` to the Render URL
- [ ] Plan: **Starter + disk** keeps data and never sleeps (recommended through Dec 21). **Free** also works (sample data re-seeds per visitor) but sleeps and resets on deploy: set `plan: free` and delete the `disk:` block
- [ ] `https://<app>/api/health` returns `{"ok":true}`

## 4. Webhook (optional, recommended)
- [ ] PayPal app → Add Webhook → `https://<app>/api/paypal/webhook`, events `INVOICING.INVOICE.PAID`, `INVOICING.INVOICE.CANCELLED`, `INVOICING.INVOICE.REFUNDED`
- [ ] Put the webhook ID in `PAYPAL_WEBHOOK_ID`

## 5. Connect your accounts (in the app → Connections)
- [ ] Telegram: @BotFather → `/newbot` → paste the token → message your bot from your phone → Inbox → Check now
- [ ] Email: Gmail → Google Account → Security → 2-Step Verification → App passwords → paste → Send test email

## 6. Smoke test on the live URL
- [ ] New invoice → paste a chat with your sandbox Personal email → Extract → Approve & create in PayPal
- [ ] Send via PayPal → the invoice arrives in the sandbox Personal account (sandbox.paypal.com)
- [ ] Pay it there → status becomes **Paid** (webhook) or after **Refresh status**
- [ ] Follow-ups: open an overdue sample invoice → **Send via PayPal** reminder works; Email / WhatsApp open with the text
- [ ] Activity log shows every step
- [ ] Phone layout OK

## 7. Devpost
- [ ] Copy the fields from `submission/SUBMISSION.md`
- [ ] Thumbnail `submission/leash-thumbnail.png`; gallery `submission/1-…8-*.png`
- [ ] YouTube video under 3 minutes, public (script in `DEMO_SCRIPT.md`)
- [ ] Sponsor prize: **AG Grid**
- [ ] Submit a day early; don't change the repo or video until Dec 21

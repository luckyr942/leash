# Getting started with Leash

Leash turns client chats into PayPal invoices, tells you when a payment is late, and drafts every follow-up for you to approve with one tap.

This guide covers everything you need to run it, try it, take it live, deploy it and submit it.

---

## 1. Requirements

- **Node.js 22.13 or newer.** Check with `node -v`. Leash uses Node's built-in SQLite, so there's no database to install.
- **npm**, which comes with Node.
- That's all. You don't need Docker, Postgres or any accounts to run the demo.

## 2. Run it (demo mode, about 1 minute)

From the `leash` folder:

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. You'll see the home page.

- Click **Explore the live demo** to open a private workspace with sample clients at every stage.
- Without any keys, Leash runs in **demo mode**. Drafting uses built-in rules and PayPal is simulated, including a working client pay page. Every screen works.

## 3. Go live (optional): Gemini + PayPal sandbox

Copy the example settings file, then fill in the values:

```bash
cp .env.example .env.local
```

| Setting | Where to get it |
|---|---|
| `GEMINI_API_KEY` | Free at https://aistudio.google.com/apikey. It starts with `AIza` or `AQ.`. |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | https://developer.paypal.com/dashboard/applications/sandbox: create an app and copy its keys. |
| `PAYPAL_ENV` | Leave as `sandbox` while testing. |
| `PAYPAL_WEBHOOK_ID` | Optional. In the same PayPal app, add a webhook to `https://YOUR-URL/api/paypal/webhook` for `INVOICING.INVOICE.PAID`, `CANCELLED` and `REFUNDED`. |
| `SESSION_SECRET` | Run `openssl rand -hex 32` and paste the result. |
| `APP_URL` | Your public URL once deployed. It's used in link previews and PayPal links. |

Restart `npm run dev` after editing `.env.local`. The **Connections** page shows whether the AI and PayPal are live.

> Note: `npm run dev` ignores any `GEMINI_API_KEY` set in your shell profile (`~/.zshrc`) and always uses the one in `.env.local`. Google AI Studio keys may start with `AIza` or `AQ.`.

### Connect your channels (in the app → Connections)

- **Telegram:** create a bot with @BotFather, paste its token, then message the bot from another account.
- **Email (Gmail / Outlook / Zoho / Yahoo):** use an **app password**, not your normal password. Leash reads new messages and sends reminders from your own address.
- **WhatsApp:** export a chat (⋮ → More → Export chat → Without media) and import the `.txt` in the Inbox.
- **Instagram / Upwork / Fiverr:** turn on their email notifications, and Leash picks them up through your connected email.

## 4. Try the main flow

1. **New invoice** → paste a chat (or tap an example) → **Extract invoice**.
2. Check the fields → **Approve & create in PayPal** → **Send**.
3. Open the invoice → copy the pay link or scan the QR → pay on the client page.
4. **Follow-ups** shows who's late and drafts the right reminder. Tap a channel to send it.
5. **Assistant:** try "Who owes me money?", "Send the invoice to Bruce" or "Remind Priya". Prepared sends run only when you tap **Confirm & send**.
6. **Activity** logs every AI suggestion and every action you took.

To reset the sample data, go to **Settings → Load sample data**.

## 5. Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server on http://localhost:3000 |
| `npm run build` | Makes a production build |
| `npm start` | Runs the production build (port 3000, or `PORT`) |
| `npm test` | Runs the unit tests (16 tests: rules, chat extraction, WhatsApp import) |
| `npx tsc --noEmit` | Type-checks the project |

## 6. Project map

```
leash/
├─ app/                     Next.js App Router
│  ├─ page.tsx              Home page (landing)
│  ├─ landing.css           Home page styles (all scoped under .lp)
│  ├─ globals.css           App styles and design tokens (light + dark)
│  ├─ layout.tsx            Fonts (Plus Jakarta Sans + Geist Mono), metadata
│  ├─ (app)/                The app: dashboard, new, invoices, followups, inbox,
│  │                        assistant, activity, connections, settings
│  ├─ pay/[id]/             Client pay page (demo mode)
│  ├─ brand/                Brand kit page (/brand)
│  ├─ api/                  Route handlers: state, extract, invoices, agent,
│  │                        connectors, inbox, settings, workspace, paypal/webhook, health
│  ├─ icon.svg, favicon.ico, apple-icon.png, opengraph-image.png, manifest.ts
├─ components/              Shell (sidebar), UI, Logo, BrandIcons, Icons,
│  │                        InvoiceDoc, InvoiceGrid (AG Grid), FollowUp, PayQR
│  └─ landing/              HeroVideo, LandingFX (scroll effects), PhoneQR
├─ lib/
│  ├─ ai.ts                 Gemini client (falls back to rules if no key)
│  ├─ extract.ts            Chat → invoice (Gemini JSON schema) + extractDemo.ts
│  ├─ followup.ts           Reminder drafting
│  ├─ rules.ts              Collections rules: wait / friendly / firm / final / call
│  ├─ agent.ts              Assistant: Gemini function calling + confirm cards
│  ├─ paypal.ts             PayPal Invoicing v2 + webhook verification
│  ├─ paypalToolkit.ts      PayPal Agent Toolkit (read-only tools, live mode)
│  ├─ invoices.ts           Approve / send / remind / mark paid / cancel
│  ├─ store.ts              SQLite (node:sqlite) data layer
│  ├─ session.ts, secret.ts Signed sessions, encryption of connector secrets
│  ├─ fx.ts, format.ts      Exchange rates and money formatting
│  ├─ sample.ts             Sample month of data
│  └─ connectors/           telegram, email (SMTP + IMAP), whatsapp
├─ public/                  brand/ (logo files), media/ (hero video, screenshots), app icons
├─ tests/                   node:test unit tests
├─ docs/                    SYSTEM_DESIGN.md, GO_LIVE.md
├─ submission/              Devpost text, thumbnail, gallery screenshots
├─ DEMO_SCRIPT.md           3-minute video script
├─ render.yaml              One-click Render deploy
└─ .env.example             All settings, documented
```

Data is stored in `data/leash.sqlite`, which is created automatically and ignored by git. Each browser gets its own private workspace.

## 7. Deploy (Render, free)

1. Push the `leash` folder to a public GitHub repo. It must include `LICENSE` (MIT) and `README.md`.
2. On https://render.com: **New → Blueprint** → pick the repo. `render.yaml` sets up the service and a disk for the database.
3. Add the same settings as in `.env.local` (Gemini key, PayPal keys, `SESSION_SECRET`, and `APP_URL` set to your Render URL).
4. Point the PayPal webhook at `https://YOUR-URL/api/paypal/webhook`.

More detail is in `docs/GO_LIVE.md`.

## 8. Hackathon submission checklist

- [ ] Public GitHub repo with README + MIT license
- [ ] Live demo URL (Render) or these run instructions
- [ ] Video under 3 minutes on YouTube (script in `DEMO_SCRIPT.md`)
- [ ] Devpost fields: copy them from `submission/SUBMISSION.md`
- [ ] Thumbnail `submission/leash-thumbnail.png` and gallery images `submission/1-…11-…`
- [ ] Deadline: **Thu Nov 12, 2026, 12:00 pm PST**

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `node:sqlite` error | Upgrade to Node 22.13 or newer. |
| The app says "AI off" / Gemini rejected the key | Get a new key from AI Studio and put it in `.env.local`, then restart. |
| Port 3000 is busy | Run `PORT=3001 npm run dev`. |
| Odd errors after big changes | Stop the server, delete the build cache with `rm -rf .next`, and start it again. |
| You want fresh sample data | Settings → Load sample data, or delete `data/leash.sqlite`. |

import Link from "next/link";
import HeroVideo from "@/components/landing/HeroVideo";
import LandingFX from "@/components/landing/LandingFX";
import PhoneQR from "@/components/landing/PhoneQR";
import { Logo } from "@/components/Logo";
import { BiCapture, BiExtract, BiChase, BiAsk, BiCurrency, BiQR, BiConfirm, BiSecure, BiPaid, BiLog } from "@/components/BrandIcons";
import { ArrowRight, Check, Mail, Telegram, WhatsApp, Instagram, Sms, PayPalMark, Pulse, Lock } from "@/components/Icons";

// Leash home: a chaptered, scroll-driven page. White chapters for detail, sky chapters for big ideas,
// a navy chapter for the client side. Everything shown is the real product.
export default function Home() {
  return (
    <div className="lp" data-aud="pro">
      <LandingFX />

      {/* ================= NAV ================= */}
      <header className="h-nav">
        <div className="h-wrap h-nav-in">
          <Link href="/" className="h-brand" aria-label="Leash home">
            <Logo size={32} />
          </Link>
          <nav aria-label="Page" className="h-links">
            <a href="#how">How it works</a>
            <a href="#ladder">Follow-ups</a>
            <a href="#clients">For clients</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="h-nav-cta">
            <Link href="/dashboard" className="pill soft sm">
              Live demo
            </Link>
            <Link href="/new" className="pill dark sm">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="h-hero">
        <div className="h-wrap h-hero-in">
          <div className="seg hero-in" role="tablist" aria-label="Who is this for">
            <button role="tab" data-aud-btn="pro" aria-selected="true">
              Freelancers
            </button>
            <button role="tab" data-aud-btn="client" aria-selected="false">
              Their clients
            </button>
          </div>

          <div className="aud aud-pro">
            <h1 className="hero-in" style={{ ["--d" as string]: "60ms" }}>
              Get paid without the awkward follow&#8209;ups.
            </h1>
            <p className="h-lead hero-in" style={{ ["--d" as string]: "120ms" }}>
              Turn a client chat into a PayPal invoice, know exactly when to nudge, and send a reminder that&apos;s already written.
            </p>
            <div className="h-ctas hero-in" style={{ ["--d" as string]: "180ms" }}>
              <Link href="/new" className="pill dark">
                Create an invoice
              </Link>
              <Link href="/dashboard" className="pill soft">
                Explore the live demo
              </Link>
            </div>
          </div>
          <div className="aud aud-client">
            <h1>Pay in one tap. No account needed.</h1>
            <p className="h-lead">Your freelancer sends a secure PayPal link. Pay with PayPal or any card, or just scan the code on the invoice.</p>
            <div className="h-ctas">
              <a href="#clients" className="pill dark">
                See how paying works
              </a>
              <Link href="/dashboard" className="pill soft">
                Explore the live demo
              </Link>
            </div>
          </div>
        </div>

        <div className="h-wrap-wide hero-in" style={{ ["--d" as string]: "260ms" }}>
          <div className="h-stage">
            <div className="h-stage-sky" aria-hidden />
            <div className="frame h-stage-frame">
              <div className="frame-bar" aria-hidden>
                <i />
                <i />
                <i />
                <span>leash.app/dashboard</span>
              </div>
              <div className="h-stage-video">
                <HeroVideo />
              </div>
            </div>
            <div className="chip-float c1" aria-hidden>
              <span className="ci wa">
                <WhatsApp size={14} />
              </span>
              <div>
                <b>Jess · Bloom Cafe</b>
                <span>“Menu design, $350, by Dec 1?”</span>
              </div>
            </div>
            <div className="chip-float c2" aria-hidden>
              <span className="ci sky">
                <Pulse size={14} />
              </span>
              <div>
                <b>Firm reminder ready</b>
                <span>12 days overdue · tap to send</span>
              </div>
            </div>
            <div className="chip-float c3" aria-hidden>
              <span className="ci ok">
                <Check size={14} />
              </span>
              <div>
                <b>+$350.00 received</b>
                <span>via PayPal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= GROW SCENE (sky) ================= */}
      <section id="how" className="grow" aria-label="Invoice, chase and get paid">
        <div className="grow-sticky">
          <h2 className="grow-title">Invoice, chase and get paid. Smarter.</h2>
          <div className="grow-card">
            {GROW.map((g, i) => (
              <img key={g.src} src={g.src} alt={g.alt} data-i={i} loading={i ? "lazy" : "eager"} width={1500} height={1000} />
            ))}
            <div className="grow-shade" aria-hidden />
            <div className="grow-words" aria-hidden>
              <span className="gw-top">
                {GROW.map((g, i) => (
                  <i key={g.word} data-i={i}>
                    {g.word}
                  </i>
                ))}
              </span>
              <span className="gw-bottom">smarter</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SPLIT ROWS ================= */}
      <section className="h-sec h-wrap">
        {SPLITS.map((s, i) => {
          const Ic = s.icon;
          return (
            <article key={s.title} className={`split ${i % 2 ? "rev" : ""}`}>
              <div className="split-text" data-reveal>
                <Ic size={56} />
                <h2>{s.title}</h2>
                <p>{s.body}</p>
                <Link href={s.href} className="pill soft">
                  {s.cta} <ArrowRight size={15} />
                </Link>
              </div>
              <div className={`split-media tint-${s.tint}`} data-reveal style={{ ["--d" as string]: "100ms" }}>
                <img src={s.src} alt={s.alt} loading="lazy" width={1500} height={1000} />
              </div>
            </article>
          );
        })}
      </section>

      {/* ================= CHANNEL TILES ================= */}
      <section className="h-sec h-wrap tiles-sec">
        <div className="h-head center" data-reveal>
          <h2>Clients message you everywhere. Leash listens everywhere.</h2>
          <p>Every conversation lands in one inbox, ready to become an invoice.</p>
        </div>
        <div className="tiles">
          {TILES.map((t, i) => (
            <div key={t.name} className={`tile ${t.size ?? ""} ${t.tone ?? ""}`} data-reveal style={{ ["--d" as string]: `${(i % 4) * 60}ms` }}>
              <span className="tile-ic">{t.icon}</span>
              <b>{t.name}</b>
              <span>{t.line}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= GIANT NUMBER ================= */}
      <section className="h-sec h-wrap giant" aria-label="Leash in numbers">
        <div className="giant-main" data-reveal>
          <span className="giant-n">
            <span data-count="0">0</span>
          </span>
          <span className="giant-cap">messages sent without your tap. Ever.</span>
        </div>
        <dl className="giant-row">
          {[
            ["24", "currencies, with totals at daily ECB rates"],
            ["5", "ways to reach a client: PayPal, email, Telegram, WhatsApp, SMS"],
            ["4", "follow-up stages, chosen by clear rules"],
          ].map(([n, d], i) => (
            <div key={d} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
              <dt>
                <span data-count={n}>{n}</span>
              </dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ================= STACKED LADDER ================= */}
      <section id="ladder" className="h-sec h-wrap stack-sec">
        <div className="h-head" data-reveal>
          <h2>Firm when it should be. Friendly until then.</h2>
          <p>One reminder per stage, at least three days apart. After 30 days, Leash stops emailing and tells you to pick up the phone.</p>
        </div>
        <div className="stack">
          {LADDER.map((r, i) => (
            <article key={r.k} className={`stack-card s-${r.k}`} style={{ ["--i" as string]: i }}>
              <div className="stack-text">
                <span className="stack-when">{r.when}</span>
                <h3>{r.title}</h3>
                <p>{r.why}</p>
              </div>
              <div className="stack-ui" aria-hidden>
                <div className="bubble-mock">
                  <span className="bm-head">
                    <b>{r.title} reminder</b> · {r.via}
                  </span>
                  <p>{r.msg}</p>
                  <span className="bm-send">
                    <Check size={13} /> Approved by you
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ================= SAFETY ================= */}
      <section className="h-sec h-wrap safety">
        <div className="safety-ic" data-reveal>
          <BiSecure size={120} />
        </div>
        <div data-reveal style={{ ["--d" as string]: "80ms" }}>
          <h2>Safety and control are part of the product.</h2>
          <ul className="safety-list">
            <li>
              <Lock size={18} /> Clients pay on PayPal&apos;s secure page. Leash never sees card details.
            </li>
            <li>
              <Check size={18} /> AI drafts. You approve every invoice and every reminder.
            </li>
            <li>
              <Lock size={18} /> Connected accounts are encrypted (AES-256-GCM) and every action is logged.
            </li>
          </ul>
          <Link href="/activity" className="pill soft">
            See the activity log <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ================= NAVY CHAPTER: TABS ================= */}
      <section id="clients" className="navy">
        <div className="h-wrap">
          <h2 className="navy-title" data-reveal>
            Getting paid should be the easy part.
          </h2>
          <div className="tabs" data-tabs data-active="0">
            <div className="tab-list" role="tablist" aria-label="From invoice to paid">
              {TABS.map((t, i) => (
                <button key={t.k} role="tab" data-tab={i} aria-selected={i === 0}>
                  {t.k}
                </button>
              ))}
            </div>
            <div className="tab-panels">
              {TABS.map((t, i) => (
                <div key={t.k} className="tab-panel" data-panel={i} role="tabpanel">
                  <div className="tab-text">
                    <h3>{t.title}</h3>
                    <p>{t.body}</p>
                  </div>
                  <div className="phone" aria-hidden>
                    <div className="phone-notch" />
                    <div className="phone-screen">{t.screen}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= EXTRAS ================= */}
      <section className="h-sec h-wrap">
        <div className="extras">
          {[
            [BiCurrency, "Bill in their currency", "USD, EUR, GBP, INR and 20 more. Totals convert at daily ECB rates."],
            [BiQR, "Scan to pay", "Every invoice gets a QR code for its PayPal pay link, on screen and in print."],
            [BiConfirm, "Confirm, then it sends", "The assistant prepares invoices and reminders. One tap from you sends them."],
            [BiLog, "A paper trail you can trust", "Every AI suggestion, approval and PayPal event, in order."],
          ].map(([Ic, t, d], i) => {
            const X = Ic as typeof BiQR;
            return (
              <div key={t as string} className="extra" data-reveal style={{ ["--d" as string]: `${i * 70}ms` }}>
                <X size={52} />
                <h3>{t as string}</h3>
                <p>{d as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= WHO + FAQ ================= */}
      <section className="h-sec h-wrap who" data-reveal>
        <h2>Made for people who bill by the project.</h2>
        <div className="who-list">
          {["Designers", "Developers", "Photographers", "Writers", "Video editors", "Illustrators", "Consultants", "Translators", "Social media managers", "Music producers"].map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
      </section>

      <section id="faq" className="h-sec h-wrap faq-sec">
        <h2 data-reveal>Questions, answered.</h2>
        <div className="faq" data-reveal>
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ================= FINAL SKY PANEL ================= */}
      <section className="final">
        <div className="h-wrap final-in" data-reveal>
          <h2>
            All in <span>one place.</span>
          </h2>
          <p>Your chats, invoices, reminders and payments, with an assistant that knows the numbers.</p>
          <div className="h-ctas">
            <Link href="/new" className="pill dark">
              Create your first invoice
            </Link>
            <Link href="/dashboard" className="pill white">
              Explore the live demo
            </Link>
          </div>
        </div>
      </section>

      <PhoneQR />

      {/* ================= FOOTER ================= */}
      <footer className="h-foot">
        <div className="h-wrap">
          <div className="foot-top">
            <Logo size={32} />
            <div className="foot-cols">
              <div>
                <b>Product</b>
                <Link href="/dashboard">Live demo</Link>
                <Link href="/new">New invoice</Link>
                <Link href="/assistant">Assistant</Link>
                <Link href="/connections">Connections</Link>
              </div>
              <div>
                <b>Learn</b>
                <a href="#how">How it works</a>
                <a href="#ladder">Follow-up ladder</a>
                <a href="#clients">For clients</a>
                <a href="#faq">FAQ</a>
              </div>
              <div>
                <b>Project</b>
                <Link href="/brand">Brand kit</Link>
                <span>PayPal AI Hackathon 2026</span>
                <span>MIT licensed</span>
              </div>
            </div>
          </div>
          <p className="foot-legal">
            <PayPalMark size={14} /> Invoices and payments are processed by PayPal. This is a sandbox demo: no real money moves.
          </p>
        </div>
      </footer>
    </div>
  );
}

const GROW = [
  { word: "invoice", src: "/media/shots/3-chat-to-invoice.webp", alt: "A client chat turned into invoice fields by AI" },
  { word: "chase", src: "/media/shots/4-followups.webp", alt: "Follow-ups queue with a firm reminder ready to send" },
  { word: "get paid", src: "/media/shots/2-overview.webp", alt: "Overview of outstanding, overdue and collected money" },
];

const SPLITS = [
  {
    icon: BiExtract,
    title: "Turn any chat into an invoice.",
    body: "Paste a WhatsApp thread or a DM. AI fills in the client, the work, the price and the due date, and flags anything it can't find instead of guessing.",
    cta: "Try it with a chat",
    href: "/new",
    src: "/media/shots/3-chat-to-invoice.webp",
    alt: "Chat to invoice screen",
    tint: "sky",
  },
  {
    icon: BiChase,
    title: "Know exactly when to nudge.",
    body: "Clear rules pick the step: friendly, firm, final, or call them. AI writes it in the right tone. One tap sends it through PayPal, email, Telegram or WhatsApp.",
    cta: "See the follow-ups",
    href: "/followups",
    src: "/media/shots/4-followups.webp",
    alt: "Follow-ups queue",
    tint: "sand",
  },
  {
    icon: BiAsk,
    title: "Your assistant prepares. You confirm.",
    body: "“Who owes me?” “Send Bruce his invoice.” Answers come from your real data, and every send waits for your Confirm.",
    cta: "Ask the assistant",
    href: "/assistant",
    src: "/media/shots/10-assistant.webp",
    alt: "Assistant with confirm cards",
    tint: "mint",
  },
];

const TILES: { name: string; line: string; icon: React.ReactNode; size?: string; tone?: string }[] = [
  { name: "Telegram", line: "Your own bot, two-way", icon: <Telegram size={22} /> },
  { name: "Gmail", line: "Reads and sends from your address", icon: <Mail size={22} />, size: "tall" },
  { name: "One inbox", line: "Every conversation, ready to invoice", icon: <BiCapture size={44} />, size: "big", tone: "sky" },
  { name: "WhatsApp", line: "Import a chat, reply in one tap", icon: <WhatsApp size={22} /> },
  { name: "Instagram", line: "Via your DM notification emails", icon: <Instagram size={22} /> },
  { name: "Upwork", line: "Job messages by email", icon: <b className="tile-word">Up</b>, size: "tall" },
  { name: "Fiverr", line: "Order messages by email", icon: <b className="tile-word">Fi</b> },
  { name: "Outlook", line: "Same as Gmail, any IMAP inbox", icon: <Mail size={22} /> },
  { name: "SMS", line: "Opens ready to send", icon: <Sms size={22} /> },
  { name: "PayPal", line: "Invoices, reminders, payments", icon: <PayPalMark size={22} />, tone: "ink" },
];

const LADDER = [
  { k: "friendly", when: "Days 1–7", title: "Friendly", via: "PayPal email", why: "A light nudge with the pay link, in case it slipped through.", msg: "Hi Sarah, just a friendly reminder that invoice 0005 was due on the 2nd. Here's the link in case it got buried." },
  { k: "firm", when: "Days 8–21", title: "Firm", via: "your email", why: "Clear and polite, with a date to pay by.", msg: "Hi Priya, invoice 0004 for $1,750 is now 12 days past due. Could you arrange payment by November 11?" },
  { k: "final", when: "Days 22–30", title: "Final notice", via: "your email", why: "Explains what happens next, without burning the bridge.", msg: "Hi Tom, this is a final reminder for invoice 0002. If it remains unpaid, I'll need to pause further work." },
  { k: "call", when: "Day 31+", title: "Talk to them", via: "a phone call", why: "Leash stops emailing and suggests a conversation instead.", msg: "Hi Dana, could we get on a quick call this week about invoice 0001? A payment plan is completely fine." },
];

const TABS = [
  {
    k: "Invoice",
    title: "A clear invoice, from PayPal.",
    body: "Your client gets a PayPal invoice by email with the work, the amount and the due date. In their currency, with your note.",
    screen: (
      <div className="ps ps-invoice">
        <span className="ps-from">Invoice from Rivera Studio</span>
        <b className="ps-amt">$800.00</b>
        <span className="ps-num">LSH-2026-0006 · due Nov 12</span>
        <div className="ps-line">
          <span>Landing page design</span>
          <span>$800.00</span>
        </div>
        <span className="ps-btn">View and pay</span>
      </div>
    ),
  },
  {
    k: "Remind",
    title: "Reminders that sound like you.",
    body: "If it's late, they hear from you, in the right tone, at the right time. Never a robot, never a pile-on.",
    screen: (
      <div className="ps ps-chat">
        <span className="ps-day">Today</span>
        <div className="ps-msg">Hi Priya, invoice 0004 for $1,750 is now 12 days past due. Could you arrange payment by Nov 11? Here&apos;s the link.</div>
        <div className="ps-msg me">So sorry! Paying now 🙏</div>
      </div>
    ),
  },
  {
    k: "Get paid",
    title: "One tap, PayPal or card.",
    body: "They pay on PayPal's secure page or scan the QR on the invoice. You see it the moment it lands.",
    screen: (
      <div className="ps ps-paid">
        <span className="ps-check">
          <Check size={30} />
        </span>
        <b>Payment received</b>
        <span className="ps-amt sm">+$1,750.00</span>
        <span className="ps-num">Priya Nair · via PayPal</span>
        <span className="ps-qr">
          <BiPaid size={28} /> Logged in your activity
        </span>
      </div>
    ),
  },
];

const FAQ = [
  ["Can the AI send something without me?", "No. AI reads conversations and drafts invoices and messages. Approving an invoice, sending it and every reminder are always your tap, and each one is logged."],
  ["Does Leash hold my money?", "No. Invoices are created and paid through PayPal. Your client pays on PayPal's secure page by PayPal or card, and the money goes straight to your PayPal account."],
  ["What if my client doesn't use PayPal?", "They can pay by debit or credit card on the same PayPal page, no account needed (where PayPal supports guest checkout)."],
  ["Can it read my Instagram, Upwork or Fiverr messages?", "Those platforms don't allow apps to read DMs. Turn on their email notifications and Leash picks them up through your connected email, or paste the conversation in."],
  ["What does the AI cost?", "Leash uses Google Gemini, which has a free tier. Without a key it still works using built-in rules."],
  ["How do I go live?", "Add a PayPal sandbox app and a Gemini key, connect Telegram or email in Connections, and you're running. Switch PayPal to live when you're ready."],
];

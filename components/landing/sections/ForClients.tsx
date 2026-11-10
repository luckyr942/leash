import { BiPaid } from "@/components/brand/BrandIcons";
import { Check } from "@/components/ui/Icons";

/** Navy chapter: what the client experiences, as phone mockups. */
export function ForClients() {
  return (
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
  );
}

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

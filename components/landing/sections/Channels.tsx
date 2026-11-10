import { BiCapture } from "@/components/brand/BrandIcons";
import { Mail, Telegram, WhatsApp, Instagram, Sms, PayPalMark } from "@/components/ui/Icons";

/** Bento tiles for every channel clients use. */
export function Channels() {
  return (
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
  );
}

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

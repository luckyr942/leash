import Link from "next/link";
import { BiExtract, BiChase, BiAsk } from "@/components/brand/BrandIcons";
import { ArrowRight } from "@/components/ui/Icons";

/** Alternating feature rows with product screenshots. */
export function Features() {
  return (
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
  );
}

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

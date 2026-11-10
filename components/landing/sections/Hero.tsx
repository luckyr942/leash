import Link from "next/link";
import HeroVideo from "@/components/landing/HeroVideo";
import { Check, WhatsApp, Pulse } from "@/components/ui/Icons";

/** Hero: audience switch (freelancers / clients), headline and the product video. */
export function Hero() {
  return (
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
  );
}

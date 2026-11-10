import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { PayPalMark } from "@/components/ui/Icons";

/** Site footer. */
export function Footer() {
  return (
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
  );
}

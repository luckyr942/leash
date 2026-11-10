import Link from "next/link";
import { BiSecure } from "@/components/brand/BrandIcons";
import { ArrowRight, Check, Lock } from "@/components/ui/Icons";

/** Safety and control promises. */
export function Safety() {
  return (
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
  );
}

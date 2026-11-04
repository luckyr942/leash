import Link from "next/link";
import { Logo, LogoMark, BRAND } from "@/components/Logo";
import { BRAND_ICONS } from "@/components/BrandIcons";

export const metadata = { title: "Brand · Leash", robots: { index: false } };

// Brand kit: the logo, its variants, colors and the feature icon set.
export default function Brand() {
  return (
    <main className="bk">
      <header className="bk-head">
        <Link href="/">
          <Logo size={30} />
        </Link>
        <span>Brand kit</span>
      </header>

      <section className="bk-hero">
        <div className="bk-tile light">
          <LogoMark size={168} />
        </div>
        <div className="bk-tile dark">
          <LogoMark size={168} tone="ink" />
        </div>
        <div className="bk-story">
          <h1>
            A leash, shaped like an <em>L</em>, with a coin on the end.
          </h1>
          <p>The handle is you. The coin is the payment. Leash keeps every invoice on a lead until the money comes home: gently, and never letting go.</p>
        </div>
      </section>

      <section className="bk-grid">
        <div className="bk-card light">
          <h2>Lockup</h2>
          <Logo size={44} className="xl" />
        </div>
        <div className="bk-card dark">
          <h2>Lockup on dark</h2>
          <Logo size={44} className="xl" />
        </div>
        <div className="bk-card light">
          <h2>Sizes</h2>
          <div className="bk-sizes">
            {[96, 64, 48, 32, 24, 16].map((s) => (
              <span key={s}>
                <LogoMark size={s} />
                <small>{s}</small>
              </span>
            ))}
          </div>
        </div>
        <div className="bk-card light">
          <h2>Colors</h2>
          <div className="bk-colors">
            <span style={{ background: BRAND.sky }}>
              <b>Leash sky</b>
              {BRAND.sky}
            </span>
            <span style={{ background: BRAND.ink, color: "#fff" }}>
              <b>Ink</b>
              {BRAND.ink}
            </span>
            <span style={{ background: "#0A0C11", color: "#fff" }}>
              <b>Night</b>#0A0C11
            </span>
            <span style={{ background: "#F4F7FB" }}>
              <b>Paper</b>#F4F7FB
            </span>
          </div>
        </div>
      </section>

      <section className="bk-icons">
        <h2>Feature icons</h2>
        <div className="bk-icon-grid">
          {BRAND_ICONS.map(([name, Icon]) => (
            <figure key={name}>
              <Icon size={56} />
              <figcaption>{name}</figcaption>
            </figure>
          ))}
        </div>
        <div className="bk-icon-grid dark">
          {BRAND_ICONS.map(([name, Icon]) => (
            <figure key={name}>
              <Icon size={56} />
              <figcaption>{name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}

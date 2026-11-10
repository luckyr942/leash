import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

/** Top navigation bar. */
export function Nav() {
  return (
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
  );
}

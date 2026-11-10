import Link from "next/link";

/** Closing call to action. */
export function FinalCta() {
  return (
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
  );
}

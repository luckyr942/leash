/** Big-number strip. */
export function Numbers() {
  return (
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
  );
}

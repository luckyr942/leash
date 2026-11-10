/** Scroll-driven scene: invoice → chase → get paid. */
export function GrowScene() {
  return (
    <section id="how" className="grow" aria-label="Invoice, chase and get paid">
      <div className="grow-sticky">
        <h2 className="grow-title">Invoice, chase and get paid. Smarter.</h2>
        <div className="grow-card">
          {GROW.map((g, i) => (
            <img key={g.src} src={g.src} alt={g.alt} data-i={i} loading={i ? "lazy" : "eager"} width={1500} height={1000} />
          ))}
          <div className="grow-shade" aria-hidden />
          <div className="grow-words" aria-hidden>
            <span className="gw-top">
              {GROW.map((g, i) => (
                <i key={g.word} data-i={i}>
                  {g.word}
                </i>
              ))}
            </span>
            <span className="gw-bottom">smarter</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const GROW = [
  { word: "invoice", src: "/media/shots/3-chat-to-invoice.webp", alt: "A client chat turned into invoice fields by AI" },
  { word: "chase", src: "/media/shots/4-followups.webp", alt: "Follow-ups queue with a firm reminder ready to send" },
  { word: "get paid", src: "/media/shots/2-overview.webp", alt: "Overview of outstanding, overdue and collected money" },
];

import { Check } from "@/components/ui/Icons";

/** The four-stage follow-up ladder as stacked cards. */
export function Ladder() {
  return (
    <section id="ladder" className="h-sec h-wrap stack-sec">
      <div className="h-head" data-reveal>
        <h2>Firm when it should be. Friendly until then.</h2>
        <p>One reminder per stage, at least three days apart. After 30 days, Leash stops emailing and tells you to pick up the phone.</p>
      </div>
      <div className="stack">
        {LADDER.map((r, i) => (
          <article key={r.k} className={`stack-card s-${r.k}`} style={{ ["--i" as string]: i }}>
            <div className="stack-text">
              <span className="stack-when">{r.when}</span>
              <h3>{r.title}</h3>
              <p>{r.why}</p>
            </div>
            <div className="stack-ui" aria-hidden>
              <div className="bubble-mock">
                <span className="bm-head">
                  <b>{r.title} reminder</b> · {r.via}
                </span>
                <p>{r.msg}</p>
                <span className="bm-send">
                  <Check size={13} /> Approved by you
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const LADDER = [
  {
    k: "friendly",
    when: "Days 1–7",
    title: "Friendly",
    via: "PayPal email",
    why: "A light nudge with the pay link, in case it slipped through.",
    msg: "Hi Sarah, just a friendly reminder that invoice 0005 was due on the 2nd. Here's the link in case it got buried.",
  },
  {
    k: "firm",
    when: "Days 8–21",
    title: "Firm",
    via: "your email",
    why: "Clear and polite, with a date to pay by.",
    msg: "Hi Priya, invoice 0004 for $1,750 is now 12 days past due. Could you arrange payment by November 11?",
  },
  {
    k: "final",
    when: "Days 22–30",
    title: "Final notice",
    via: "your email",
    why: "Explains what happens next, without burning the bridge.",
    msg: "Hi Tom, this is a final reminder for invoice 0002. If it remains unpaid, I'll need to pause further work.",
  },
  {
    k: "call",
    when: "Day 31+",
    title: "Talk to them",
    via: "a phone call",
    why: "Leash stops emailing and suggests a conversation instead.",
    msg: "Hi Dana, could we get on a quick call this week about invoice 0001? A payment plan is completely fine.",
  },
];

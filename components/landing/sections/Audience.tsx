/** Who Leash is for. */
export function Audience() {
  return (
    <section className="h-sec h-wrap who" data-reveal>
      <h2>Made for people who bill by the project.</h2>
      <div className="who-list">
        {[
          "Designers",
          "Developers",
          "Photographers",
          "Writers",
          "Video editors",
          "Illustrators",
          "Consultants",
          "Translators",
          "Social media managers",
          "Music producers",
        ].map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
    </section>
  );
}

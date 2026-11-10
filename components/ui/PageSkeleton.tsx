/** Placeholder shown while a page's data loads: heading, four KPI cards and a table. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="sk" style={{ width: 220, height: 34, marginBottom: 24 }} />
      <div className="kpis">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="sk" style={{ height: 96 }} />
        ))}
      </div>
      <div className="sk" style={{ height: 320, marginTop: 16 }} />
    </div>
  );
}

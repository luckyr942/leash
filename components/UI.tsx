import { STATUS_TEXT, initials, type DisplayStatus } from "@/lib/format";

export function StatusPill({ status }: { status: DisplayStatus }) {
  return <span className={`pill s-${status.toLowerCase()}`}>{STATUS_TEXT[status]}</span>;
}

export function StagePill({ action, label }: { action: string; label: string }) {
  return <span className={`pill a-${action.toLowerCase()}`}>{label}</span>;
}

export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  // Stable soft colour per name.
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <span className="avatar" style={{ width: size, height: size, background: `hsl(${hue} 70% 92%)`, color: `hsl(${hue} 45% 30%)` }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="head-actions">{children}</div>}
    </header>
  );
}

export function Empty({ title, children, art }: { title: string; children?: React.ReactNode; art?: React.ReactNode }) {
  return (
    <div className="empty">
      {art}
      <b>{title}</b>
      {children && <p>{children}</p>}
    </div>
  );
}

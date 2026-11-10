import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";

/** Full-page centred card for not-found and error screens outside the app shell. */
export function StatusCard({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <main className="pay-page">
      <div className="pay-card" role="alert">
        <Link href="/" aria-label="Leash home">
          <LogoMark size={36} />
        </Link>
        <h1>{title}</h1>
        <p className="muted">{children}</p>
        {actions && <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>{actions}</div>}
      </div>
    </main>
  );
}

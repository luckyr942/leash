"use client";
import Link from "next/link";
import { Empty } from "@/components/ui/Primitives";

// Errors inside a dashboard page: keep the sidebar, show a friendly message and a retry.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert">
      <Empty title="This page couldn't load">
        Something went wrong while showing this page. Your invoices and data are safe.
        {error.digest && <span className="mono"> Reference: {error.digest}</span>}
      </Empty>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
        <button className="btn primary" onClick={reset}>
          Try again
        </button>
        <Link href="/dashboard" className="btn">
          Back to overview
        </Link>
      </div>
    </div>
  );
}

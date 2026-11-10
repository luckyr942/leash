"use client";
import Link from "next/link";
import { StatusCard } from "@/components/ui/StatusCard";

// Catches errors outside the app shell (landing page, pay page). The server already logged the details.
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatusCard
      title="Something went wrong"
      actions={
        <>
          <button className="btn primary" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="btn">
            Home
          </Link>
        </>
      }
    >
      This page hit an unexpected error. Your invoices and data are safe.
      {error.digest && <span className="mono"> Reference: {error.digest}</span>}
    </StatusCard>
  );
}

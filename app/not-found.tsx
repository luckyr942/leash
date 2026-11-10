import Link from "next/link";
import { StatusCard } from "@/components/ui/StatusCard";

export const metadata = { title: "Page not found · Leash" };

export default function NotFound() {
  return (
    <StatusCard
      title="Page not found"
      actions={
        <>
          <Link href="/dashboard" className="btn primary">
            Go to your dashboard
          </Link>
          <Link href="/" className="btn">
            Home
          </Link>
        </>
      }
    >
      That page doesn&apos;t exist or has moved.
    </StatusCard>
  );
}

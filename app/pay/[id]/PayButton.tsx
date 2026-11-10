"use client";
import { useState } from "react";
import { PayPalMark } from "@/components/ui/Icons";

export default function PayButton({ id, token }: { id: string; token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "paid" | "error">("idle");
  async function pay() {
    setState("busy");
    const r = await fetch(`/api/pay/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token }) });
    setState(r.ok ? "paid" : "error");
  }
  if (state === "paid") return <div className="paid-box">Paid · thank you!</div>;
  return (
    <>
      <button className="pp-pay" onClick={pay} disabled={state === "busy"}>
        <PayPalMark size={20} /> {state === "busy" ? "Processing…" : "Pay with PayPal"}
      </button>
      {state === "error" && <p className="muted sm-text">Something went wrong. Please try again.</p>}
    </>
  );
}

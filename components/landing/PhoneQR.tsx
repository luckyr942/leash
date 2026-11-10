"use client";
import { useEffect, useState } from "react";
import PayQR from "@/components/invoice/PayQR";

/** Floating "try it on your phone" chip with a QR code to this site's live demo. Desktop only, dismissible. */
export default function PhoneQR() {
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(true);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    // Appear after the hero, step aside at the very bottom (footer).
    const onScroll = () => {
      const y = window.scrollY;
      const nearEnd = y + window.innerHeight > document.documentElement.scrollHeight - 320;
      const g = document.querySelector(".grow")?.getBoundingClientRect();
      const inScene = !!g && g.top < window.innerHeight * 0.5 && g.bottom > window.innerHeight * 0.5;
      setShown(y > window.innerHeight * 0.9 && !nearEnd && !inScene);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- origin is only known in the browser
    setUrl(`${window.location.origin}/dashboard`);
    try {
      if (sessionStorage.getItem("leash-qr-closed")) setOpen(false);
    } catch {}
  }, []);
  if (!url || !open) return null;
  return (
    <aside className={`phone-qr ${shown ? "" : "hide"}`} aria-label="Open Leash on your phone" aria-hidden={!shown}>
      <div>
        <b>Try Leash on your phone</b>
        <span>Scan to open the live demo</span>
      </div>
      <PayQR url={url} size={64} label="" />
      <button
        className="phone-qr-x"
        aria-label="Close"
        onClick={() => {
          setOpen(false);
          try {
            sessionStorage.setItem("leash-qr-closed", "1");
          } catch {}
        }}
      >
        ×
      </button>
    </aside>
  );
}

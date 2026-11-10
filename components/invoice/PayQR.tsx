"use client";
import { useEffect, useState } from "react";

/** QR code for a pay link, drawn locally (the link never leaves the browser). Scan with any phone camera to pay. */
export default function PayQR({ url, size = 148, label = "Scan to pay" }: { url: string; size?: number; label?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let alive = true;
    import("qrcode")
      .then((q) => q.toDataURL(url, { margin: 1, width: size * 2, errorCorrectionLevel: "M", color: { dark: "#111827", light: "#ffffff" } }))
      .then((d) => alive && setSrc(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url, size]);
  return (
    <figure className="pay-qr" style={{ width: size }}>
      {src ? <img src={src} width={size} height={size} alt={`QR code for the pay link`} /> : <span style={{ width: size, height: size }} />}
      <figcaption>{label}</figcaption>
    </figure>
  );
}

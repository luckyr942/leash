// Inline SVG artwork: no image requests, crisp at any size.

/** Landing illustration: a client chat becomes an invoice, a reminder goes out, it gets paid. */
export function HeroArt() {
  const ink = "#111827";
  const y = "#6EC1FF";
  return (
    <svg viewBox="0 0 560 430" className="hero-art" role="img" aria-label="A client message turns into a PayPal invoice, a friendly reminder goes out, and the invoice is paid">
      <defs>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#111827" floodOpacity=".12" />
        </filter>
        <radialGradient id="glow" cx="60%" cy="55%" r="50%">
          <stop offset="0" stopColor="#BFE3FF" stopOpacity=".7" />
          <stop offset="1" stopColor="#BFE3FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="560" height="430" fill="url(#glow)" />

      {/* chat bubble */}
      <g filter="url(#sh)" transform="translate(20 34)">
        <rect width="250" height="112" rx="20" fill="#fff" />
        <circle cx="30" cy="30" r="14" fill="#e0e7ff" />
        <text x="30" y="35" textAnchor="middle" fontSize="12" fontWeight="600" fill="#3730a3">SK</text>
        <text x="54" y="26" fontSize="12" fontWeight="600" fill={ink}>Sarah · Acme</text>
        <text x="54" y="42" fontSize="10.5" fill="#6b7280">WhatsApp</text>
        <text x="18" y="70" fontSize="12.5" fill={ink}>Need a landing page. Budget</text>
        <text x="18" y="88" fontSize="12.5" fill={ink}>is <tspan fontWeight="700" fill="#b45309">$500</tspan>, deliver by <tspan fontWeight="700" fill="#b45309">Nov 10</tspan>.</text>
      </g>

      {/* arrow + AI spark */}
      <path d="M150 156 C 150 196, 200 206, 236 214" fill="none" stroke={ink} strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round" />
      <g transform="translate(150 178)">
        <circle r="17" fill={y} stroke={ink} strokeWidth="2" />
        <path d="M0 -8c.5 4 2.8 6.3 7 7-4.2.6-6.4 2.9-7 7-.6-4.1-2.8-6.4-7-7 4.2-.7 6.5-3 7-7Z" fill={ink} />
      </g>

      {/* invoice card */}
      <g filter="url(#sh)" transform="translate(236 168)">
        <rect width="250" height="190" rx="20" fill="#fff" />
        <text x="22" y="36" fontSize="11" fill="#6b7280">INVOICE LSH-2026-0008</text>
        <text x="22" y="72" fontSize="30" fontWeight="300" fill={ink}>$500.00</text>
        <text x="22" y="94" fontSize="11.5" fill="#6b7280">Due Nov 10 · Website landing page</text>
        <rect x="22" y="112" width="206" height="1" fill="#e5e7eb" />
        <circle cx="34" cy="138" r="10" fill="#dcfce7" />
        <path d="m29 138 4 4 7-8" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="52" y="142" fontSize="11.5" fill={ink}>Approved by you</text>
        <rect x="22" y="156" width="96" height="22" rx="11" fill="#003087" />
        <text x="70" y="171" textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">PayPal</text>
        <rect x="126" y="156" width="70" height="22" rx="11" fill="#dcfce7" />
        <text x="161" y="171" textAnchor="middle" fontSize="11" fontWeight="600" fill="#15803d">Paid</text>
      </g>

      {/* reminder toast */}
      <g filter="url(#sh)" transform="translate(36 268)">
        <rect width="200" height="64" rx="16" fill={ink} />
        <circle cx="30" cy="32" r="13" fill={y} />
        <path d="M24 30a6 6 0 1 1 12 0c0 6 2 7 2 7H22s2-1 2-7" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        <text x="52" y="28" fontSize="12" fontWeight="600" fill="#fff">Friendly reminder</text>
        <text x="52" y="45" fontSize="10.5" fill="#d1d5db">Approved · sent via WhatsApp</text>
      </g>

      {/* coins */}
      <g transform="translate(490 120)">
        <circle r="22" fill={y} stroke={ink} strokeWidth="2.5" />
        <text y="7" textAnchor="middle" fontSize="20" fontWeight="700" fill={ink}>$</text>
      </g>
    </svg>
  );
}

export function EmptyArt({ kind }: { kind: "clear" | "invoices" | "activity" }) {
  return (
    <svg viewBox="0 0 160 110" className="empty-art" aria-hidden>
      <ellipse cx="80" cy="100" rx="52" ry="6" fill="currentColor" opacity=".07" />
      {kind === "clear" && (
        <g>
          <circle cx="80" cy="50" r="36" fill="#BFE3FF" />
          <path d="m63 51 11 11 24-25" fill="none" stroke="#111827" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {kind === "invoices" && (
        <g>
          <path d="M52 10h42l14 14v68H52Z" fill="#fff" stroke="#111827" strokeWidth="3" strokeLinejoin="round" />
          <path d="M94 10v14h14M62 40h34M62 50h34M62 60h20" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
          <rect x="62" y="72" width="36" height="10" rx="5" fill="#6EC1FF" />
        </g>
      )}
      {kind === "activity" && (
        <g fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 56h22l10-26 16 52 12-26h40" />
          <circle cx="78" cy="82" r="4" fill="#6EC1FF" />
        </g>
      )}
    </svg>
  );
}

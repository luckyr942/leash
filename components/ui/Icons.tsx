// Small stroke icon set (24px grid, currentColor).
type P = { size?: number };
const svg = (size = 16) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});
const I = (d: React.ReactNode) =>
  function Icon({ size }: P) {
    return <svg {...svg(size)}>{d}</svg>;
  };

export const Home = I(
  <>
    <path d="M3 11 12 4l9 7" />
    <path d="M5 10v10h14V10" />
  </>,
);
export const Plus = I(<path d="M12 5v14M5 12h14" />);
export const FileText = I(
  <>
    <path d="M14 3H6v18h12V7Z" />
    <path d="M14 3v4h4M9 12h6M9 16h6" />
  </>,
);
export const Bell = I(<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0" />);
export const Pulse = I(<path d="M3 12h4l3-8 4 16 3-8h4" />);
export const Gear = I(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </>,
);
export const Mail = I(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </>,
);
export const WhatsApp = I(
  <>
    <path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3Z" />
    <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2Z" />
  </>,
);
export const Sms = I(
  <>
    <path d="M4 5h16v11H9l-5 4Z" />
    <path d="M8 10h8M8 13h5" />
  </>,
);
export const Copy = I(
  <>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V4H4v12h4" />
  </>,
);
export const Send = I(<path d="M21 3 10 14M21 3l-7 18-4-7-7-4Z" />);
export const Check = I(<path d="m5 12 5 5L20 7" />);
export const Close = I(<path d="M6 6l12 12M18 6 6 18" />);
export const ArrowRight = I(<path d="M5 12h14M13 6l6 6-6 6" />);
export const ArrowLeft = I(<path d="M19 12H5M11 6l-6 6 6 6" />);
export const Sparkle = I(
  <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7ZM19 16c.3 1.6 1 2.3 2.6 2.6-1.6.3-2.3 1-2.6 2.6-.3-1.6-1-2.3-2.6-2.6 1.6-.3 2.3-1 2.6-2.6Z" />,
);
export const Clock = I(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
);
export const Phone = I(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />);
export const Search = I(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
);
export const Download = I(<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />);
export const Printer = I(
  <>
    <path d="M7 9V3h10v6" />
    <rect x="3" y="9" width="18" height="8" rx="2" />
    <path d="M7 14h10v7H7Z" />
  </>,
);
export const Shield = I(<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z" />);
export const Sun = I(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>,
);
export const Moon = I(<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />);
export const Alert = I(
  <>
    <path d="M12 3 2 20h20Z" />
    <path d="M12 10v4M12 17h.01" />
  </>,
);
export const Link = I(<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />);
export const Wallet = I(
  <>
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 10h18M16 15h2" />
  </>,
);
export const Users = I(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" />
  </>,
);

export function PayPalMark({ size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#003087"
        d="M9.2 21H5.6a.5.5 0 0 1-.5-.6L7.9 3.5c.1-.3.3-.5.6-.5h6.2c3.1 0 5.2 1.9 4.6 5-.7 3.6-3.3 5.3-6.6 5.3h-2l-.9 6.1a.7.7 0 0 1-.6.6Z"
      />
      <path fill="#009cde" d="M19.9 8.1c-.8 3.9-3.6 5.6-7.1 5.6h-1.6l-1.1 7h2.9a.6.6 0 0 0 .6-.5l.6-3.8h1.7c2.9 0 5.1-1.5 5.6-4.6.3-1.6-.1-2.9-1.6-3.7Z" />
    </svg>
  );
}
export const Telegram = I(<path d="M21 4 3 11l6 2 2 6 3-4 5 4ZM9 13l9-6-6 8" />);
export const Inbox = I(
  <>
    <path d="M3 13h5l1.5 3h5L16 13h5" />
    <path d="M5 5h14l2 8v6H3v-6Z" />
  </>,
);
export const Bot = I(
  <>
    <rect x="4" y="8" width="16" height="11" rx="3" />
    <path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5" />
  </>,
);
export const Plug = I(<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0ZM12 17v4" />);
export const Upload = I(<path d="M12 20V9M7 14l5-5 5 5M5 4h14" />);
export const Instagram = I(
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5h.01" />
  </>,
);
export const Refresh = I(<path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4" />);
export const Trash = I(<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />);
export const Lock = I(
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>,
);

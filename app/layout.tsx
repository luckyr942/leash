import "./globals.css";
import "./landing.css";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { env } from "@/lib/server/env";

// Type system: Plus Jakarta Sans for everything; Geist Mono only for invoice numbers, references and amounts.
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env().APP_URL || "http://localhost:3000"),
  applicationName: "Leash",
  title: "Leash: get paid without the awkward follow-ups",
  description: "Paste a client chat, approve the invoice, and Leash sends it through PayPal and drafts every follow-up for you to approve with one tap.",
};

// viewport-fit=cover lets the phone tab bar sit above the iPhone home indicator (safe-area insets).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f7fb",
};

// Light theme by default; a saved choice is applied before first paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('leash-theme');if(t==='dark')document.documentElement.dataset.theme='dark'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

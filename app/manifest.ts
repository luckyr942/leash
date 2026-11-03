import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Leash: invoices and follow-ups for freelancers",
    short_name: "Leash",
    description: "Turn client chats into PayPal invoices and get paid without the awkward follow-ups.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F4F7FB",
    theme_color: "#111827",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

// WhatsApp: import an exported chat (WhatsApp → chat → ⋮ / ⓘ → Export chat → Without media).
// No Meta Business account needed. Reminders go out with one tap via wa.me deep links.
// Pure functions (no imports) so it is unit-testable.

export type ParsedChat = { client: string; participants: string[]; lines: string[]; phone: string };

// iOS:     [05/11/2026, 10:15:32] Sarah: Hi
// Android: 05/11/2026, 10:15 - Sarah: Hi     (also "11/5/26, 10:15 AM - Sarah: Hi")
const LINE = /^‎?\[?(\d{1,4}[./-]\d{1,2}[./-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\]?\s*(?:-\s*)?([^:]{1,60}):\s?(.*)$/;

export function parseWhatsAppExport(raw: string, myName = ""): ParsedChat {
  const out: { who: string; text: string }[] = [];
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    const m = line.match(LINE);
    if (m) out.push({ who: m[3].trim().replace(/^‎/, ""), text: m[4].trim() });
    else if (out.length && line.trim()) out[out.length - 1].text += `\n${line.trim()}`; // multi-line message
  }
  const msgs = out.filter((m) => !/^(Messages and calls are end-to-end encrypted|<Media omitted>|image omitted|This message was deleted)/i.test(m.text));
  if (!msgs.length) throw new Error("That doesn't look like a WhatsApp export. Export the chat “Without media” and upload the .txt file.");
  const counts = new Map<string, number>();
  for (const m of msgs) counts.set(m.who, (counts.get(m.who) ?? 0) + 1);
  const participants = [...counts.keys()];
  const me = myName.trim().toLowerCase();
  const others = participants.filter((p) => p.toLowerCase() !== me && !/^(you|me)$/i.test(p));
  const client = (others.length ? others : participants).sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))[0];
  // A participant saved only as a number is their phone; otherwise look for a number in the messages.
  const phone = (
    /^\+?[\d\s()-]{8,}$/.test(client)
      ? client
      : (msgs
          .map((m) => m.text)
          .join(" ")
          .match(/\+\d[\d\s()-]{8,}\d/)?.[0] ?? "")
  ).replace(/[^\d+]/g, "");
  return { client, participants, lines: msgs.slice(-80).map((m) => `${m.who}: ${m.text}`), phone };
}

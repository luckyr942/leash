/** Frequently asked questions. */
export function Faq() {
  return (
    <section id="faq" className="h-sec h-wrap faq-sec">
      <h2 data-reveal>Questions, answered.</h2>
      <div className="faq" data-reveal>
        {FAQ.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

const FAQ = [
  [
    "Can the AI send something without me?",
    "No. AI reads conversations and drafts invoices and messages. Approving an invoice, sending it and every reminder are always your tap, and each one is logged.",
  ],
  [
    "Does Leash hold my money?",
    "No. Invoices are created and paid through PayPal. Your client pays on PayPal's secure page by PayPal or card, and the money goes straight to your PayPal account.",
  ],
  [
    "What if my client doesn't use PayPal?",
    "They can pay by debit or credit card on the same PayPal page, no account needed (where PayPal supports guest checkout).",
  ],
  [
    "Can it read my Instagram, Upwork or Fiverr messages?",
    "Those platforms don't allow apps to read DMs. Turn on their email notifications and Leash picks them up through your connected email, or paste the conversation in.",
  ],
  ["What does the AI cost?", "Leash uses Google Gemini, which has a free tier. Without a key it still works using built-in rules."],
  [
    "How do I go live?",
    "Add a PayPal sandbox app and a Gemini key, connect Telegram or email in Connections, and you're running. Switch PayPal to live when you're ready.",
  ],
];

import { BiCurrency, BiQR, BiConfirm, BiLog } from "@/components/brand/BrandIcons";

/** Smaller features grid. */
export function Extras() {
  return (
    <section className="h-sec h-wrap">
      <div className="extras">
        {[
          [BiCurrency, "Bill in their currency", "USD, EUR, GBP, INR and 20 more. Totals convert at daily ECB rates."],
          [BiQR, "Scan to pay", "Every invoice gets a QR code for its PayPal pay link, on screen and in print."],
          [BiConfirm, "Confirm, then it sends", "The assistant prepares invoices and reminders. One tap from you sends them."],
          [BiLog, "A paper trail you can trust", "Every AI suggestion, approval and PayPal event, in order."],
        ].map(([Ic, t, d], i) => {
          const X = Ic as typeof BiQR;
          return (
            <div key={t as string} className="extra" data-reveal style={{ ["--d" as string]: `${i * 70}ms` }}>
              <X size={52} />
              <h3>{t as string}</h3>
              <p>{d as string}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

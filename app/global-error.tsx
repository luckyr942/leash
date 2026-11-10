"use client";

// Last-resort boundary for errors in the root layout itself, so it renders its own <html> and inline styles.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          background: "#f6f8fb",
          color: "#0b1b33",
        }}
      >
        <main style={{ textAlign: "center", padding: 24, maxWidth: 420 }}>
          <h1 style={{ fontSize: 24 }}>Leash couldn&apos;t load</h1>
          <p style={{ color: "#5b6b82" }}>An unexpected error stopped the app from starting.{error.digest ? ` Reference: ${error.digest}` : ""}</p>
          <button
            onClick={reset}
            style={{ padding: "10px 18px", borderRadius: 999, border: 0, background: "#0b1b33", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

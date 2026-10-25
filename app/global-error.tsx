"use client";
// Last safety net (covers errors in the root layout itself).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="hi">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24, textAlign: "center" }}>
        <h1>कुछ गड़बड़ हो गई / Something went wrong</h1>
        <p>फिर से कोशिश करें। / Please try again.</p>
        <button onClick={reset} style={{ fontSize: 18, padding: "12px 20px" }}>फिर से कोशिश करें / Try again</button>
      </body>
    </html>
  );
}

"use client";
// Crash screen: if anything throws in the browser, the user sees this (with Retry) instead of a blank white page.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>कुछ गड़बड़ हो गई / Something went wrong</h1>
      <p style={{ fontSize: 18, marginBottom: 16 }}>आपका डेटा सुरक्षित है। फिर से कोशिश करें। / Please try again.</p>
      <button className="btn" onClick={reset}>फिर से कोशिश करें / Try again</button>
      <a className="btn ghost" href="/" style={{ marginTop: 10 }}>होम / Home</a>
    </main>
  );
}

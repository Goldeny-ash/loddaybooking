"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Something went wrong</h2>
          <button
            onClick={() => reset()}
            style={{ padding: "0.5rem 1rem", fontSize: "1rem", cursor: "pointer", borderRadius: "0.375rem", border: "1px solid #ccc", background: "#fff" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

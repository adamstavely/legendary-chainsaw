import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CoverageSource } from "../../../src/elements/react";
import { caption, surface, textButton } from "../demo-kit";

/* An answer about a supplier, and what it could and couldn't see. Request coverage for the field reports: the first
   request fails (the queue is down), Retry goes through. A moment later the supplier filings refresh and turn current;
   the summary and the count follow. Switch to the inline line to see it under the answer instead. */

const START: CoverageSource[] = [
  { id: "sales", label: "Sales and orders", status: "current", detail: "Synced 20 minutes ago" },
  { id: "filings", label: "Supplier filings", status: "stale", age: "14 months", detail: "Last filing: annual report 2024" },
  { id: "field", label: "Field reports", status: "none", detail: "No visits logged for this site" },
  { id: "news", label: "News and web", status: "current", detail: "Searched today" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EvidenceCoverage } = ui;
  const [sources, setSources] = useState(START);
  const [inline, setInline] = useState(false);
  const [run, setRun] = useState(0);
  const [log, setLog] = useState("");
  const tries = useRef(0);

  // Once the filings are requested, they arrive a few seconds later
  const filingsRequested = sources.find((s) => s.id === "filings")?.request === "requested";
  useEffect(() => {
    if (!filingsRequested) return;
    const t = setTimeout(() => {
      setSources((list) => list.map((s) => (s.id === "filings" ? { id: s.id, label: s.label, status: "current", detail: "Annual report 2025 imported" } : s)));
      setLog("New filings arrived – the answer can be re-run with them.");
    }, 3000);
    return () => clearTimeout(t);
  }, [filingsRequested]);

  const requestCoverage = (source: CoverageSource, signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      const first = source.id === "field" && tries.current++ === 0;
      const t = setTimeout(() => (first ? reject(new Error("queue down")) : resolve()), 1100);
      signal.addEventListener("abort", () => clearTimeout(t));
    });

  const reset = () => {
    setSources(START);
    setLog("");
    tries.current = 0;
    setRun((n) => n + 1);
  };

  const coverage = (
    <EvidenceCoverage
      key={`${run}-${inline}`}
      inline={inline}
      scope="For the answer on Northwind Freight"
      sources={sources}
      requestCoverage={requestCoverage}
      onRequestCoverage={(source, e) => {
        // The filings request is tracked by the app; the rest by the element
        if (source.id !== "filings") return;
        e.preventDefault();
        setSources((list) => list.map((s) => (s.id === "filings" ? { ...s, request: "requested" } : s)));
        setLog("Filings requested from the data team.");
      }}
    />
  );

  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 10 }}>
      {inline ? (
        <div style={{ ...surface, borderRadius: 14, padding: "14px 16px", display: "grid", gap: 12, fontSize: 14, lineHeight: 1.5 }}>
          <p style={{ margin: 0 }}>
            Northwind looks able to take the Q3 volume: orders are up 12% and it hasn't missed a delivery since March. Its
            capacity figures come from last year's filing, though, and nobody has visited the new depot.
          </p>
          {coverage}
        </div>
      ) : (
        coverage
      )}
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || "Request coverage for the field reports – the first try fails."}{" "}
        <button type="button" style={textButton} onClick={() => setInline((v) => !v)}>
          {inline ? "Show as a card" : "Show under an answer"}
        </button>{" "}
        ·{" "}
        <button type="button" style={textButton} onClick={reset}>
          Reset
        </button>
      </p>
    </div>
  );
}

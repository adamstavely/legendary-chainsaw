import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CellHistoryEntry, CellSource, CellStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* One cell of a research institute's vendor list, filled by the "Risk tier" column. Accept it, edit it, mark it as
   wrong, or run it again – the re-run comes back with a new value after a moment. */

const NOW = Date.UTC(2026, 10, 12, 14, 30);
const SOURCES: CellSource[] = [
  {
    id: "s1",
    title: "Northwind Analytics – Security and compliance",
    url: "https://northwind-analytics.example/security",
    snippet: "Northwind holds a current SOC 2 Type II report, renewed in September 2026.",
  },
  {
    id: "s2",
    title: "Supplier register 2026 (internal)",
    snippet: "Annual spend £184,000; data processed: staff names and work emails.",
  },
];
const HISTORY: CellHistoryEntry[] = [
  { id: "h2", value: "High", at: NOW - 6 * 24 * 3600_000, by: "Analyst model", note: "Before the SOC 2 report was found" },
  { id: "h1", value: "", at: NOW - 9 * 24 * 3600_000, by: "Import" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CellInspector } = ui;
  const [value, setValue] = useState("Medium");
  const [status, setStatus] = useState<CellStatus>("new");
  const [log, setLog] = useState("");

  // A re-run comes back after a moment with the same answer
  useEffect(() => {
    if (status !== "running") return;
    const t = setTimeout(() => {
      setValue("Medium");
      setStatus("new");
      setLog("The re-run came back: Medium.");
    }, 1600);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: 10 }}>
      <CellInspector
        title="Risk tier"
        description="Northwind Analytics · row 214"
        value={value}
        onValueChange={setValue}
        status={status}
        onStatusChange={setStatus}
        prompt="Rate {{vendor}}'s risk tier as Low, Medium or High. It handles {{data}} for us, is based in {{country}}, and we spend {{spend}} a year with it. Cite what you used."
        variables={{ vendor: "Northwind Analytics", data: "staff names and work emails", country: "Ireland", spend: "£184,000" }}
        model="Analyst model"
        at={NOW - 42 * 60_000}
        now={NOW}
        confidence={0.72}
        reasoning={
          "Personal data is limited to work contact details, which keeps the tier below High.\nThe current SOC 2 Type II report covers the services we use.\nSpend is above the £100,000 line, so it can't be Low."
        }
        sources={SOURCES}
        tokensIn={1_180}
        tokensOut={214}
        cost={0.0068}
        history={HISTORY}
        closable
        onFlag={(reason) => setLog(`Marked as wrong: ${reason}`)}
        onClose={() => setLog("Closed the panel.")}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || "Edit the value, mark it as wrong, or run it again"}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setValue("Medium");
            setStatus("new");
            setLog("");
          }}
        >
          Reset
        </button>
      </p>
    </div>
  );
}

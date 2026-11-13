import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RunEstimateColumn, RunEstimateModel } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute enriches its 2,000-row vendor list with three AI columns – one looks each vendor up on the
   web. The estimate starts on the sample, so the first run is cheap; switch the budget to see the warning. */

const COLUMNS: RunEstimateColumn[] = [
  { id: "category", name: "Category", tokensIn: 420, tokensOut: 40 },
  { id: "tier", name: "Risk tier", tokensIn: 900, tokensOut: 220 },
  { id: "site", name: "Website and HQ", tokensIn: 2_400, tokensOut: 160, lookups: 2 },
];
const MODEL: RunEstimateModel = { name: "Analyst model", inputPrice: 3, outputPrice: 15 };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RunEstimate } = ui;
  const [budget, setBudget] = useState(60);
  const [log, setLog] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 10 }}>
      <RunEstimate
        title="Run estimate"
        description="Vendor list · 3 AI columns"
        rows={2000}
        columns={COLUMNS}
        model={MODEL}
        lookupPrice={0.005}
        concurrency={8}
        secondsPerCell={3}
        budget={budget}
        defaultSample
        defaultCap={40}
        onStart={(start) => setLog(start.sample ? `Started on ${start.rows} rows.` : `Started the whole run${start.cap ? `, capped at $${start.cap}` : ""}.`)}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || "Turn the sample off to see the whole run against the budget"}{" "}
        <button type="button" style={textButton} onClick={() => setBudget((b) => (b === 60 ? 25 : 60))}>
          {budget === 60 ? "Lower the budget" : "Raise the budget"}
        </button>
      </p>
    </div>
  );
}

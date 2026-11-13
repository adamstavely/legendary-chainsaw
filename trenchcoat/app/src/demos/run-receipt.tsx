import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RunReceiptModel } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* One run of a research institute's invoice matcher: an October supplier invoice matched against its purchase order. */

const MODELS: RunReceiptModel[] = [
  { model: "large-1", calls: 6, inputTokens: 48_200, outputTokens: 3_140, cachedTokens: 31_600, cost: 0.3124, cacheSavings: 0.0853 },
  { model: "small-2", calls: 14, inputTokens: 22_900, outputTokens: 1_820, cost: 0.0211 },
];
const STEPS = [
  { name: "Read the invoice PDF", cost: 0.0412 },
  { name: "Match purchase order lines", cost: 0.2268 },
  { name: "Check the supplier's bank details", cost: 0.0336 },
  { name: "Write the approval note", cost: 0.0319 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RunReceipt } = ui;
  const [retried, setRetried] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <RunReceipt
        agent="Invoice matcher · Halden Research Institute"
        runId="run_8f2c41d0"
        at={Date.UTC(2026, 10, 3, 9, 14)}
        duration={48_600}
        status={retried ? "failed" : "succeeded"}
        models={MODELS}
        tools={[
          { tool: "ledger.lookup", calls: 9, cost: 0.0045 },
          { tool: "pdf.extract", calls: 1, cost: 0.012 },
        ]}
        lookups={{ count: 2, cost: 0.01 }}
        retries={retried ? { count: 3, cost: 0.0472 } : null}
        steps={STEPS}
        onDownload={() => false}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Copy the run ID, or download the receipt as CSV.{" "}
        <button type="button" style={textButton} onClick={() => setRetried(!retried)}>
          {retried ? "Show the clean run" : "Show a run with retries"}
        </button>
      </div>
    </div>
  );
}

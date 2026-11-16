import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CostStep } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's report-drafting run, step by step – where its money and tokens went. */

const S = 1000;
const STEPS: CostStep[] = [
  { id: "plan", name: "Plan the report", kind: "llm", model: "large-1", tokensIn: 1840, tokensOut: 412, cost: 0.0584, duration: 2.3 * S, input: "Draft the Q3 water-quality report for the board", output: "Gather data, then write two pages" },
  { id: "research", name: "Researcher", kind: "subagent", model: "small-2", tokensIn: 14_200, tokensOut: 1_130, cost: 0.0412, duration: 13.6 * S },
  { id: "search", name: "Web search", kind: "tool", cost: 0.01, duration: 1.3 * S, input: "Q3 river sampling", output: "6 results" },
  { id: "pdf", name: "PDF reader (OCR)", kind: "tool", cost: 0.024, duration: 6.1 * S, output: "42 sampling rows" },
  { id: "sheet", name: "Spreadsheet", kind: "tool", cost: 0.002, duration: 1.7 * S, output: "Averages for 7 sites" },
  { id: "write", name: "Write two pages", kind: "llm", model: "large-1", tokensIn: 12_400, tokensOut: 2_210, cost: 0.3312, duration: 16.3 * S, output: "Summary, site table, three findings" },
  { id: "check", name: "Check the figures", kind: "llm", model: "small-2", tokensIn: 9_480, tokensOut: 320, cost: 0.0126, duration: 3.1 * S },
];
const LATE: CostStep = { id: "tone", name: "Board-ready wording", kind: "llm", model: "large-1", tokensIn: 3_100, tokensOut: 1_840, cost: 0.1215, duration: 7.4 * S };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CostWaterfall } = ui;
  const [more, setMore] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 8 }}>
      <CostWaterfall subtitle="Q3 water-quality report · Halden Research Institute" steps={more ? [...STEPS, LATE] : STEPS} defaultOpenId="write" />
      <div style={{ ...caption, textAlign: "center" }}>
        Switch between cost and tokens, or keep the run's order.{" "}
        <button type="button" style={textButton} onClick={() => setMore(!more)}>
          {more ? "Remove the last step" : "Add a step"}
        </button>
      </div>
    </div>
  );
}

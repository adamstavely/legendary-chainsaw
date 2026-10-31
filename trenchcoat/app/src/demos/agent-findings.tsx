import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AgentFinding, AgentFindingsAgent } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Three made-up agents check a research institute's grant application before it's submitted. */

const at = (minute: number) => Date.UTC(2026, 9, 31, 9, minute);
const AGENTS: AgentFindingsAgent[] = [
  { id: "budget", name: "Budget checker", status: "running", progress: 0.62, checked: "31 of 50 lines" },
  { id: "refs", name: "Reference checker", status: "done", progress: 1, checked: "84 references" },
  { id: "rules", name: "Rules checker", status: "queued" },
];
const FINDINGS: AgentFinding[] = [
  { id: "a", agent: "budget", severity: "high", title: "Equipment total doesn't match the summary", detail: "Line 18 adds up to $41,200, and the summary says $38,200.", at: at(12) },
  { id: "b", agent: "refs", severity: "medium", title: "Two references point to the same paper", detail: "References 12 and 47 are the same article.", at: at(9) },
  { id: "c", agent: "refs", severity: "info", title: "All 84 references were found", at: at(7) },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentFindings } = ui;
  const [findings, setFindings] = useState(FINDINGS);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <AgentFindings description="Grant application, before it's submitted" agents={AGENTS} findings={findings} locale="en-GB" />
      <div style={{ ...caption, textAlign: "center" }}>
        <button type="button" style={textButton} onClick={() => setFindings([{ id: `n${findings.length}`, agent: "budget", severity: "low", title: `Rounded figure on line ${findings.length + 20}`, at: at(12 + findings.length) }, ...findings])}>
          Add a finding
        </button>
      </div>
    </div>
  );
}

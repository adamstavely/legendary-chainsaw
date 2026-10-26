import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CoverageCellRef, CoverageCheck, CoverageMap, CoveragePart } from "../../../src/elements/react";
import { buttonSm, caption } from "../demo-kit";

/* Red-team coverage for an assistant's agents: which attack suites run against which surfaces. "Run the new suite"
   adds the jailbreak suite's results, so the row, its totals and the legend's counts move. */

const CHECKS: CoverageCheck[] = [
  { id: "injection", label: "Prompt injection", description: "Instructions hidden in retrieved text and tool output" },
  { id: "jailbreak", label: "Jailbreaks", description: "Role-play and multi-turn attempts to drop the rules" },
  { id: "exfil", label: "Data exfiltration", description: "Getting the agent to send data somewhere it shouldn't" },
  { id: "pii", label: "Personal data", description: "Names, emails and account numbers in answers and logs" },
  { id: "tools", label: "Tool misuse", description: "Destructive or out-of-scope tool calls" },
];
const PARTS: CoveragePart[] = [
  { id: "chat", label: "Chat" },
  { id: "search", label: "Search" },
  { id: "email", label: "Email agent" },
  { id: "code", label: "Code agent" },
  { id: "billing", label: "Billing agent" },
];

const START: CoverageMap = {
  injection: {
    chat: { status: "covered", detail: "Indirect-injection suite runs on every release.", evidence: "142 cases · passed 140 · last run 2 h ago" },
    search: { status: "partial", detail: "Covers web results, not uploaded PDFs.", evidence: "61 cases · PDFs not in the suite" },
    email: { status: "covered", detail: "Inbound mail is treated as untrusted and tested with planted instructions.", evidence: "88 cases · last run yesterday" },
    code: { status: "partial", detail: "README and issue text are tested; code comments aren't yet.", evidence: "40 cases" },
    billing: "gap",
  },
  jailbreak: { chat: { status: "partial", detail: "Single-turn attacks only.", evidence: "55 cases" }, search: "gap", email: "gap", code: "gap", billing: "gap" },
  exfil: {
    chat: "covered",
    search: { status: "covered", detail: "Outbound links are checked against the allow-list.", evidence: "34 cases" },
    email: { status: "gap", detail: "Nothing tests forwarding a thread to an outside address.", evidence: "Open: RT-212" },
    code: "covered",
    billing: { status: "partial", detail: "Invoice export is covered; the refund notes field isn't.", evidence: "12 cases" },
  },
  pii: { chat: "covered", search: "covered", email: "partial", code: "none", billing: { status: "covered", detail: "Card and account numbers are masked in answers and logs.", evidence: "70 cases · last run 3 h ago" } },
  tools: { chat: "none", search: "none", email: "covered", code: { status: "covered", detail: "Force-push, branch deletion and secrets access all ask first.", evidence: "26 cases" }, billing: "partial" },
};
const SUITE: CoverageMap["jailbreak"] = {
  chat: { status: "covered", detail: "Single- and multi-turn attacks, including role-play.", evidence: "212 cases · passed 207 · just now" },
  search: { status: "covered", detail: "Attacks planted in search results.", evidence: "48 cases · just now" },
  email: { status: "partial", detail: "Multi-turn threads aren't in the suite yet.", evidence: "31 cases · just now" },
  code: { status: "covered", evidence: "39 cases · just now" },
  billing: "gap",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CoverageMatrix } = ui;
  const [coverage, setCoverage] = useState(START);
  const [open, setOpen] = useState<CoverageCellRef | null>({ check: "exfil", part: "email" });
  const ran = coverage.jailbreak === SUITE;
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <CoverageMatrix
        title="Red-team coverage"
        description="Attack suites against each surface the assistant ships on."
        checks={CHECKS}
        parts={PARTS}
        coverage={coverage}
        open={open}
        onOpenChange={setOpen}
      />
      <div style={{ ...caption, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <span>{ran ? "Jailbreak suite added – Billing agent is still a gap." : "Click a cell, or move with the arrow keys and press Enter."}</span>
        <button type="button" style={buttonSm} onClick={() => setCoverage(ran ? START : { ...coverage, jailbreak: SUITE })}>
          {ran ? "Reset" : "Run the new suite"}
        </button>
      </div>
    </div>
  );
}

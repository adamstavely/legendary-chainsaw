import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SkillDetailFile, SkillDetailRun, SkillDetailTool } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The audit team's contract reviewer. It's off: turning it on asks first, because one of its tools runs a script and
   another fetches the supplier register over the network. Pick a file to read it; Remove names the two agents that use
   it. Times are fixed so the thumbnail is stable. */

const NOW = Date.UTC(2026, 10, 12, 15, 0);
const H = 3_600_000;
const TOOLS: SkillDetailTool[] = [
  { name: "read_file", permission: "read", description: "Reads the contract and the playbook" },
  { name: "search_clauses", permission: "read", description: "Finds clauses by topic" },
  { name: "clause_check.py", permission: "run", description: "Compares each clause with the playbook's limits" },
  { name: "supplier_register", permission: "network", description: "Looks up the supplier's risk rating" },
];
const FILES: SkillDetailFile[] = [
  {
    path: "SKILL.md",
    content: `---
name: contract-reviewer
description: Review a supplier contract against the procurement playbook. Use when asked to review, check or
  mark up a contract, or when a contract is attached with "can we sign this?".
---

# Contract reviewer

1. Read the contract and find each clause the playbook covers.
2. Run scripts/clause_check.py to compare limits (liability caps, notice periods, payment terms).
3. Look up the supplier in the register for its risk rating.
4. Report: clauses to negotiate first, then the ones that are fine, each with the playbook line it rests on.`,
  },
  {
    path: "scripts/clause_check.py",
    content: `import json, sys

LIMITS = json.load(open("references/limits.json"))

def check(clause):
    rule = LIMITS.get(clause["topic"])
    if rule is None:
        return "not covered"
    return "ok" if clause["value"] <= rule["max"] else "negotiate"

for clause in json.load(sys.stdin):
    print(clause["id"], check(clause))`,
  },
  { path: "references/playbook.md", content: "# Procurement playbook\n\n- Liability: capped at 12 months' fees.\n- Notice: at least 60 days.\n- Payment: 30 days from invoice." },
  { path: "references/limits.json", content: '{\n  "liability": { "max": 12 },\n  "notice": { "max": 60 },\n  "payment": { "max": 30 }\n}' },
];
const RUNS: SkillDetailRun[] = [
  { id: "r3", at: NOW - 3 * H, agent: "Procurement assistant", outcome: "succeeded", note: "Cleaning services contract – 2 clauses to negotiate" },
  { id: "r2", at: NOW - 27 * H, agent: "Legal intake", outcome: "failed", note: "The PDF was a scan with no text" },
  { id: "r1", at: NOW - 3 * 24 * H, agent: "Procurement assistant", outcome: "succeeded" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SkillDetail } = ui;
  const [enabled, setEnabled] = useState(false);
  const [note, setNote] = useState("Turn it on – it asks first – or pick a file to read it.");
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 8 }}>
      <SkillDetail
        title="Contract reviewer"
        description="Checks a supplier contract against the procurement playbook and flags clauses to negotiate."
        author="Your team"
        version="1.4.0"
        available="1.5.0"
        now={NOW}
        triggers={["Asked to review, check or mark up a contract", "A contract is attached with “can we sign this?”"]}
        tools={TOOLS}
        files={FILES}
        runs={RUNS}
        usedBy={["Procurement assistant", "Legal intake"]}
        enabled={enabled}
        onEnabledChange={(on) => {
          setEnabled(on);
          setNote(on ? "It's on – agents may pick it now." : "It's off.");
        }}
        onUpdate={(version) => setNote(`The app would install ${version}.`)}
        onExport={() => setNote("The app would download contract-reviewer.zip.")}
        onRemove={() => setNote("The app would remove it from the workspace.")}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setEnabled(false);
            setNote("Back to the start.");
          }}
        >
          Start again
        </button>
      </div>
    </div>
  );
}

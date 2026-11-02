import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ChangeItem } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* Fictional changes to a research institute's sample tracker. The page says what opening a row or its menu means. */

const REPO = "institute/sample-tracker";
const CHANGES: ChangeItem[] = [
  { id: "c1", title: "Add freezer locations to the sample index", repo: REPO, number: 214, state: "open", additions: 6793, deletions: 9201, checks: { passing: 5, failing: 0, pending: 6, skipped: 0 } },
  { id: "c2", title: "Warn before a sample's consent expires", repo: REPO, number: 213, state: "draft", additions: 412, deletions: 37, checks: { passing: 9, failing: 2, pending: 0, skipped: 1 } },
  { id: "c3", title: "Barcode scanner support", repo: REPO, number: 209, state: "merged", additions: 1280, deletions: 96, checks: { passing: 11, failing: 0, pending: 0, skipped: 0 } },
  { id: "c4", title: "Move shipment records to the new schema", repo: REPO, number: 205, state: "closed", additions: 88, deletions: 140 },
  { id: "c5", title: "Fix the export's date column", repo: REPO, number: 203, state: "merged", additions: 12, deletions: 4 },
  { id: "c6", title: "Audit log for chain of custody", repo: "institute/sample-audit", number: 77, state: "merged", additions: 530, deletions: 21 },
  { id: "c7", title: "Translate the intake form", repo: REPO, number: 198, state: "merged", additions: 240, deletions: 2 },
];
const ACTIONS = [
  { id: "copy", label: "Copy link" },
  { id: "hide", label: "Hide from this list" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ChangeList } = ui;
  const [said, setSaid] = useState("Open a row, or use its menu.");
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 8 }}>
      <ChangeList
        items={CHANGES}
        rowActions={ACTIONS}
        limit={5}
        onTcOpen={(e) => setSaid(`Open: ${e.detail.item.title}`)}
        onTcAction={(e) => setSaid(`${e.detail.id}: ${e.detail.item.title}`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>{said}</div>
    </div>
  );
}

import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { Redaction, RedactionBlock } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A fictional grievance note from a research institute, with made-up names and numbers. */

const BLOCKS: RedactionBlock[] = [
  { id: "p1", page: 1, text: "The complaint was raised by Jordan Vale on 3 March, who can be reached on 555-0142." },
  { id: "p2", page: 1, text: "The panel found that the sample log for Lab 4 was incomplete for two weeks." },
  { id: "p3", page: 2, text: "Payment of $4,200 was made to account 4471 as settlement." },
];
const find = (block: RedactionBlock, text: string) => ({ block: block.id, start: block.text.indexOf(text), end: block.text.indexOf(text) + text.length });
const REDACTIONS: Redaction[] = [
  { id: "r1", ...find(BLOCKS[0]!, "Jordan Vale"), reason: "Personal name", status: "proposed", proposedBy: "Auto-detect" },
  { id: "r2", ...find(BLOCKS[0]!, "555-0142"), reason: "Phone number", status: "approved", proposedBy: "Auto-detect" },
  { id: "r3", ...find(BLOCKS[1]!, "Lab 4"), reason: "Location", status: "proposed", proposedBy: "Noor Haddad" },
  { id: "r4", ...find(BLOCKS[2]!, "account 4471"), reason: "Bank details", status: "proposed", proposedBy: "Auto-detect" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RedactionReview } = ui;
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 8 }}>
      <RedactionReview blocks={BLOCKS} defaultRedactions={REDACTIONS} description="Panel note, before it goes to the board" onTcShare={(e) => setNote(`Your server would now produce the redacted copy, with ${e.detail.redactions.filter((r) => r.status === "approved").length} removed.`)} />
      <div style={{ ...caption, textAlign: "center" }}>{note || "Pick a bar to reveal it, then approve or reject. Share waits until none are left."}</div>
    </div>
  );
}

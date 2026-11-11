import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { DiffTableColumn, DiffTableEdit, DiffTableRow } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's vendor register, with an assistant's proposed cleanup. */

const COLUMNS: DiffTableColumn[] = [
  { key: "vendor", label: "Vendor" },
  { key: "category", label: "Category" },
  { key: "owner", label: "Owner" },
  { key: "status", label: "Status" },
  { key: "review", label: "Next review" },
];
const ROWS: DiffTableRow[] = [
  { id: "v1", cells: { vendor: "Northfield Labs", category: "Lab supplies", owner: "R. Okafor", status: "Active", review: "Mar 2027" } },
  { id: "v2", cells: { vendor: "Clearwater Analytics", category: "Software", owner: "M. Lindqvist", status: "Active", review: "Jan 2026" } },
  { id: "v3", cells: { vendor: "Harbor Couriers", category: "Logistics", owner: "–", status: "Active", review: "Jun 2027" } },
  { id: "v4", cells: { vendor: "Pinecrest Printing", category: "Print", owner: "A. Haddad", status: "Dormant", review: "Sep 2024" }, change: "removed" },
  { id: "v5", cells: { vendor: "Atlas Glassware", category: "Lab supplies", owner: "R. Okafor", status: "Active", review: "Nov 2027" } },
  { id: "v6", cells: { vendor: "Meridian Cloud", category: "Hosting", owner: "J. Park", status: "Under review", review: "Feb 2027" } },
  { id: "v7", cells: { vendor: "Brightline Translation", category: "Services", owner: "S. Ruiz", status: "Active", review: "Aug 2027" } },
  { id: "v8", cells: { vendor: "Kestrel Instruments", category: "Equipment", owner: "J. Park", status: "Active", review: "May 2028" }, change: "added" },
];
const EDITS: DiffTableEdit[] = [
  { id: "e1", row: "v2", column: "review", from: "Jan 2026", to: "Jan 2027", reason: "The renewal signed in December moved the review a year on." },
  { id: "e2", row: "v3", column: "owner", from: "–", to: "M. Lindqvist", reason: "Every vendor needs an owner; M. Lindqvist signs their invoices." },
  { id: "e3", row: "v5", column: "category", from: "Lab supplies", to: "Equipment", reason: "Their last three orders were instruments, not consumables." },
  { id: "e4", row: "v6", column: "status", from: "Under review", to: "Active", reason: "The security review closed on 2 October with no findings." },
  { id: "e5", row: "v7", column: "category", from: "Services", to: "Translation" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DiffTable } = ui;
  const [run, setRun] = useState(0);
  const [stream, setStream] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <DiffTable
        key={run}
        title="Proposed register cleanup"
        description="5 edits, 1 new vendor and 1 removal from the assistant"
        columns={COLUMNS}
        rows={ROWS}
        edits={EDITS}
        defaultDecisions={run ? {} : { e5: "rejected" }}
        streaming={stream}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Click a changed cell to see why, or press A or R on it.{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setRun((n) => n + 1);
            setStream(true);
          }}
        >
          Stream the edits in again
        </button>
      </div>
    </div>
  );
}

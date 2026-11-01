import type * as UI from "../../../src/elements/react";
import type { LegalHold } from "../../../src/elements/react";

/* A research institute's holds, for a supplier dispute and a closed audit. */

const at = (month: number, day: number) => Date.UTC(2026, month - 1, day);
const HOLDS: LegalHold[] = [
  {
    id: "supplier",
    name: "Northwind supply dispute",
    custodian: "Procurement",
    placedBy: "Noor Haddad",
    placedAt: at(3, 9),
    until: at(9, 30),
    reason: "Counsel asked us to keep everything about the 2041 contract.",
    status: "active",
    items: [
      { id: "a", name: "Vendor contract 2041.pdf", kind: "File" },
      { id: "b", name: "Supplier emails", kind: "Folder" },
    ],
  },
  { id: "trial", name: "Trial 9 regulator query", custodian: "Research office", placedBy: "Tomás Rivera", placedAt: at(8, 2), until: at(12, 15), reason: "The regulator may ask for the raw data.", status: "active", items: [{ id: "c", name: "Trial 9 raw data", kind: "Folder" }] },
  { id: "audit", name: "2024 audit", placedBy: "Maya Lindqvist", placedAt: at(1, 12), reason: "Kept until the audit closed.", releaseReason: "The audit closed in May.", status: "released", items: [{ id: "d", name: "Audit summary.docx", kind: "File" }] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { LegalHoldManager } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <LegalHoldManager defaultHolds={HOLDS} defaultSelected="supplier" now={at(10, 31)} locale="en-GB" description="Files that mustn't be changed or deleted" />
    </div>
  );
}

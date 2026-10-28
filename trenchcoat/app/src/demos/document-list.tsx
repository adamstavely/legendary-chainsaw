import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { DocumentRecord } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* The documents a fictional customer gave for a due-diligence review: two verified, one expired, one flagged because
   its expiry doesn't match the issuer's record, and a utility bill marked fraudulent. Numbers stay masked until
   someone shows them; View reports which document to open. */

const DOCUMENTS: DocumentRecord[] = [
  { id: "d1", type: "Passport", country: "Spain", number: "PAE481207", reference: "DOC-2270", expires: Date.UTC(2031, 2, 14), status: "verified" },
  { id: "d2", type: "National ID", country: "Spain", number: "48120731K", reference: "DOC-2271", expires: Date.UTC(2029, 7, 2), status: "verified" },
  { id: "d3", type: "Residence permit", country: "Portugal", number: "PT90044127", reference: "DOC-2275", expires: Date.UTC(2026, 4, 30), status: "expired" },
  {
    id: "d4",
    type: "Driving licence",
    country: "Spain",
    number: "V-4471208-R",
    reference: "DOC-2281",
    expires: Date.UTC(2033, 0, 9),
    status: "flagged",
    note: "Expiry date doesn't match the issuer's record",
  },
  { id: "d5", type: "Utility bill", country: "Spain", reference: "DOC-2288", status: "fraudulent", note: "Template matches a known forgery kit" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DocumentList } = ui;
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 8 }}>
      <DocumentList title="Identity documents" description="Elena Ruiz · due-diligence review" documents={DOCUMENTS} onOpen={(d) => setOpened(`${d.type} (${d.reference})`)} />
      <div style={{ ...caption, textAlign: "center" }}>{opened ? `Opened ${opened}.` : "Show a number with the eye, or press View to open a document."}</div>
    </div>
  );
}

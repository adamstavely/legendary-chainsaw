import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { QueryField, QueryGroup } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* Finding files in a fictional case workspace: documents owned by K. Osei, or anything touched since June. Run shows
   the query string the search would get. */

const FIELDS: QueryField[] = [
  {
    id: "type",
    label: "Type",
    type: "enum",
    options: [
      { value: "document", label: "Document" },
      { value: "spreadsheet", label: "Spreadsheet" },
      { value: "image", label: "Image" },
      { value: "audio", label: "Audio" },
      { value: "email", label: "Email" },
    ],
  },
  { id: "owner", label: "Owner", type: "text" },
  { id: "title", label: "Title", type: "text" },
  { id: "updated", label: "Updated", type: "date" },
  { id: "pages", label: "Pages", type: "number" },
  { id: "topic", label: "Topic", type: "enum", options: [{ value: "finance", label: "Finance" }, { value: "legal", label: "Legal" }, { value: "logistics", label: "Logistics" }] },
];

const START: QueryGroup = {
  kind: "group",
  id: "root",
  join: "and",
  children: [
    { kind: "condition", id: "c-type", field: "type", operator: "is", value: "document" },
    {
      kind: "group",
      id: "g-who",
      join: "or",
      children: [
        { kind: "condition", id: "c-owner", field: "owner", operator: "is", value: "K. Osei" },
        { kind: "condition", id: "c-updated", field: "updated", operator: "after", value: "2026-06-01" },
      ],
    },
  ],
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { QueryBuilder } = ui;
  const [ran, setRan] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <QueryBuilder title="Find files" description="Build a search from conditions instead of syntax." fields={FIELDS} defaultValue={START} onRun={(_v, q) => setRan(q)} />
      <div style={{ ...caption, textAlign: "center" }}>{ran ? `Ran: ${ran}` : "Change a field, flip AND / OR, add a condition, then Run."}</div>
    </div>
  );
}

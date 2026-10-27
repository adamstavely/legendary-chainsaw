import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { OutputSchemaField } from "../../../src/elements/react";
import { buttonSm, caption } from "../demo-kit";

/* A support team's triage step: the model reads a ticket and answers in this shape. The draft has two problems to fix –
   the category has "Only allowed values" on with none listed, and two fields are both called "summary". */

const DRAFT: OutputSchemaField[] = [
  { name: "summary", type: "string", required: true, description: "One sentence a person can read in the queue" },
  { name: "category", type: "string", required: true, description: "Where the ticket goes", enum: [] },
  { name: "priority", type: "string", required: true, enum: ["low", "normal", "high", "urgent"] },
  { name: "summary", type: "string", required: false },
  {
    name: "customer",
    type: "object",
    required: true,
    fields: [
      { name: "email", type: "string", required: true },
      { name: "plan", type: "string", required: false, enum: ["free", "team", "enterprise"] },
      { name: "seats", type: "integer", required: false },
    ],
  },
  {
    name: "actions",
    type: "array",
    itemType: "object",
    required: true,
    description: "What the agent should do next, in order",
    fields: [
      { name: "kind", type: "string", required: true, enum: ["reply", "refund", "escalate"] },
      { name: "confidence", type: "number", required: true },
    ],
  },
  { name: "needs_human", type: "boolean", required: true },
];

const FIXED: OutputSchemaField[] = DRAFT.filter((_, i) => i !== 3).map((f) => (f.name === "category" ? { ...f, enum: ["billing", "bug", "account", "how-to"] } : f));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { OutputSchemaBuilder, schemaFieldError } = ui;
  const [value, setValue] = useState(DRAFT);
  const error = schemaFieldError(value);
  return (
    <div style={{ width: "100%", maxWidth: 880, display: "grid", gap: 10 }}>
      <OutputSchemaBuilder title="Ticket triage" description="What the model returns for every new ticket" value={value} onChange={setValue} name="schema" />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, minWidth: 200 }}>{error ? `Can't save yet: ${error.charAt(0).toLowerCase()}${error.slice(1)}.` : "Ready to save – the schema is valid."}</span>
        <button type="button" style={buttonSm} onClick={() => setValue(FIXED)}>
          Fix both
        </button>
        <button type="button" style={buttonSm} onClick={() => setValue(DRAFT)}>
          Back to the draft
        </button>
      </div>
    </div>
  );
}

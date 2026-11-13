import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { JsonSchema } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A record in a fictional research institute's internal Records API: an owner object, tags, a classification enum and
   a retention policy. The owner starts open, so the nesting shows. */

const RECORD: JsonSchema = {
  type: "object",
  required: ["id", "title", "classification", "owner"],
  properties: {
    id: { type: "string", pattern: "^REC-\\d{6}$", description: "The record's id, assigned when it's filed." },
    title: { type: "string", minLength: 1, maxLength: 200, description: "What the record is, as people would search for it." },
    classification: {
      type: "string",
      enum: ["public", "internal", "restricted"],
      default: "internal",
      description: "Who may see it. **Restricted** records need the `records:restricted` scope.",
    },
    owner: { $ref: "#/$defs/Person", description: "The person accountable for the record." },
    tags: { type: "array", items: { type: "string" }, maxItems: 20, uniqueItems: true, description: "Free-form labels for finding related records." },
    created_at: { type: "string", format: "date-time", description: "When it was filed, in UTC." },
    retention: {
      type: "object",
      description: "How long it's kept – see the [retention schedule](https://example.org/retention).",
      properties: {
        years: { type: "integer", minimum: 1, maximum: 30, description: "Years from filing before review." },
        legal_hold: { type: "boolean", default: false, description: "Kept regardless of `years` while true." },
      },
    },
    archived: { type: "boolean", deprecated: true, description: "Use `retention.legal_hold` and the archive endpoint instead." },
  },
  $defs: {
    Person: {
      type: "object",
      title: "Person",
      required: ["id", "email"],
      properties: {
        id: { type: "string", description: "The person's staff id." },
        name: { type: "string" },
        email: { type: "string", format: "email" },
        unit: { type: "string", description: "Their research unit, e.g. `Climate Systems`." },
      },
    },
  },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SchemaFields } = ui;
  const [expanded, setExpanded] = useState<string[]>(["owner"]);
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <SchemaFields title="Record" description="Records API · the object every endpoint returns" schema={RECORD} expanded={expanded} onExpandedChange={setExpanded} searchThreshold={0} idPrefix="record" />
      <div style={{ ...caption, textAlign: "center" }}>
        Open a field's children, filter by name or meaning, or copy a field's link.{" "}
        <button type="button" style={textButton} onClick={() => setExpanded([])}>
          Fold everything
        </button>
      </div>
    </div>
  );
}

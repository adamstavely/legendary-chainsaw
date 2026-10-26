import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { StructuredOutputSchema, StructuredOutputValidate } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

// What the app asked the model for: a support ticket, triaged
const SCHEMA: StructuredOutputSchema = {
  type: "object",
  required: ["category", "priority", "summary", "customer", "confidence", "next_steps"],
  additionalProperties: false,
  properties: {
    category: { type: "string", enum: ["billing", "bug", "account", "feature request"], description: "What the ticket is about" },
    priority: { type: "string", enum: ["low", "normal", "high"], description: "How soon someone should answer" },
    summary: { type: "string", maxLength: 140, description: "One sentence for the queue" },
    customer: {
      type: "object",
      required: ["name", "plan", "email"],
      properties: {
        name: { type: "string" },
        plan: { type: "string", enum: ["Free", "Team", "Business"] },
        email: { type: "string", pattern: "^[^@\\s]+@[^@\\s]+\\.[a-z]{2,}$" },
        seats: { type: "integer", minimum: 1 },
      },
    },
    confidence: { type: "number", minimum: 0, maximum: 1, description: "How sure the model is, 0–1" },
    next_steps: { type: "array", minItems: 1, items: { type: "string", minLength: 3 } },
  },
};

const GOOD = `{
  "category": "billing",
  "priority": "high",
  "summary": "Charged twice for the March renewal after upgrading mid-cycle.",
  "customer": { "name": "Maya Chen", "plan": "Business", "email": "maya@northwind.io", "seats": 42 },
  "confidence": 0.92,
  "next_steps": ["Refund the duplicate charge", "Check the proration rule for mid-cycle upgrades"]
}`;

// The same answer with the kinds of mistakes models make: a value outside the enum, a number out of range, a field
// that isn't in the schema, and a required one that never came
const BAD = `\`\`\`json
{
  "category": "billing",
  "priority": "urgent",
  "summary": "Charged twice for the March renewal after upgrading mid-cycle.",
  "customer": { "name": "Maya Chen", "plan": "Business", "seats": 42.5 },
  "confidence": 1.4,
  "sentiment": "frustrated",
  "next_steps": ["Refund the duplicate charge", "OK"]
}
\`\`\``;

const CHUNK = 6;
const TICK_MS = 40;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { StructuredOutput, SegmentedControl } = ui;
  const [which, setWhich] = useState<"good" | "bad">("bad");
  const [run, setRun] = useState(0);
  const [shown, setShown] = useState(0);
  const [result, setResult] = useState<StructuredOutputValidate | null>(null);
  const source = which === "good" ? GOOD : BAD;

  // The model writes the JSON a few characters at a time, then stops
  useEffect(() => {
    setShown(0);
    setResult(null);
    const t = setInterval(() => {
      setShown((n) => {
        const next = Math.min(source.length, n + CHUNK);
        if (next >= source.length) clearInterval(t);
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(t);
  }, [run, source]);

  const streaming = shown < source.length;
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12 }}>
      <SegmentedControl
        aria-label="Example answer"
        options={[
          { value: "bad", label: "With problems" },
          { value: "good", label: "Valid" },
        ]}
        value={which}
        onChange={setWhich}
      />
      <StructuredOutput title="Ticket triage" text={source.slice(0, shown)} schema={SCHEMA} streaming={streaming} variableName="triage" onValidate={setResult} />
      <div style={{ ...caption, textAlign: "center" }} aria-live="off">
        {streaming
          ? "Writing the triage…"
          : result?.valid
            ? "Matches the schema – ready to file. "
            : `${result?.issues.length ?? 0} fields to fix before it can be filed. `}
        {!streaming && (
          <button type="button" style={textButton} onClick={() => setRun((r) => r + 1)}>
            Write it again
          </button>
        )}
      </div>
    </div>
  );
}

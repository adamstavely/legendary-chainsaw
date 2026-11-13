import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ModelAccessModel, ModelAccessValue } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

const MODELS: ModelAccessModel[] = [
  { id: "large-1", name: "large-1", provider: "Provider A", description: "Long reports and careful reasoning", capabilities: ["tools", "long-context", "reasoning"], tier: "high", residency: "EU", usedBy: ["Policy Q&A"] },
  { id: "small-2", name: "small-2", provider: "Provider A", description: "Quick answers and triage", capabilities: ["tools"], tier: "low", residency: "EU", usedBy: ["Invoice matcher", "Expense checker"] },
  { id: "vision-1", name: "vision-1", provider: "Provider B", description: "Reads scanned forms and charts", capabilities: ["vision", "tools"], tier: "medium", residency: "US" },
  { id: "large-2", name: "large-2", provider: "Provider B", capabilities: ["tools", "long-context", "audio"], tier: "high", residency: "US", isNew: true },
];

const START: ModelAccessValue = {
  models: { "large-1": { allowed: true }, "small-2": { allowed: true }, "vision-1": { allowed: true, approval: true }, "large-2": { allowed: false } },
  defaultModel: "small-2",
  blockNew: true,
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ModelAccess } = ui;
  const [access, setAccess] = useState(START);
  const [note, setNote] = useState("Block a model the agents use to see the warning.");
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <ModelAccess
        title="Model access"
        description="Which models the Halvorsen Research Institute workspace may use."
        models={MODELS}
        access={access}
        changedBy={{ name: "Priya Shah", at: Date.UTC(2026, 10, 9, 14, 30) }}
        locale="en-GB"
        onAccessChange={(next, change) => {
          setAccess(next);
          setNote(change.type === "allowed" ? `${change.model} ${change.allowed ? "allowed" : "blocked"}.` : change.type === "default" ? `Default is now ${change.model}.` : "Policy changed.");
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note}{" "}
        <button type="button" style={textButton} onClick={() => setAccess(START)}>
          Start over
        </button>
      </div>
    </div>
  );
}

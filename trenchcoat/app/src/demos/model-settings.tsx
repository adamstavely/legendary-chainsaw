import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ModelSettingsModel, ModelSettingsValue } from "../../../src/elements/react";
import { buttonSm, caption } from "../demo-kit";

/* A support team tunes the model behind its reply drafts. It starts on a general model with temperature and top-p both
   moved – the settings flag the pair. Switch to the reasoning model: temperature disappears, the value that's still
   set is called out as ignored, and reasoning effort appears. */

const MODELS: ModelSettingsModel[] = [
  { id: "atlas-2", label: "Atlas 2", description: "General model · fast, good at tone", supports: ["temperature", "topP", "maxOutputTokens"] },
  {
    id: "atlas-reason",
    label: "Atlas 2 Reasoning",
    description: "Reasoning model · works a problem through before it answers",
    supports: ["reasoningEffort", "maxOutputTokens"],
    defaults: { maxOutputTokens: 8192 },
    ignores: { temperature: "Reasoning models choose their own sampling.", topP: "Reasoning models choose their own sampling." },
  },
  { id: "swift", label: "Swift Mini", description: "Small model · cheapest, for short replies", supports: ["temperature", "maxOutputTokens"], defaults: { temperature: 0.7, maxOutputTokens: 1024 } },
];

const START: ModelSettingsValue = { temperature: 0.4, topP: 0.9 };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ModelSettings } = ui;
  const [model, setModel] = useState(MODELS[0]);
  const [value, setValue] = useState<ModelSettingsValue>(START);
  const [note, setNote] = useState("Temperature and top-p are both moved – try Precise, or switch model.");
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12 }}>
      <ModelSettings
        title="Reply drafts"
        model={model}
        value={value}
        onChange={(next, changed) => {
          setValue(next);
          setNote(`Changed ${changed.join(", ")}.`);
        }}
      />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        {MODELS.map((m) => (
          <button key={m.id} type="button" style={buttonSm} aria-pressed={m.id === model.id} onClick={() => setModel(m)}>
            {m.label}
          </button>
        ))}
        <button
          type="button"
          style={buttonSm}
          onClick={() => {
            setModel(MODELS[0]);
            setValue(START);
            setNote("Back to the start.");
          }}
        >
          Reset demo
        </button>
      </div>
      <div style={caption}>{note}</div>
    </div>
  );
}

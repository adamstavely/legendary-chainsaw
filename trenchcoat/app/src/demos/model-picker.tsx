import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ModelEffort, PickerModel } from "../../../src/elements/react";
import { surface } from "../demo-kit";

const Spark = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M9 2.5c.5 3.2 2.3 5 5.5 5.5-3.2.5-5 2.3-5.5 5.5-.5-3.2-2.3-5-5.5-5.5 3.2-.5 5-2.3 5.5-5.5Z" fill="currentColor" />
  </svg>
);

const models: PickerModel[] = [
  { id: "auto", name: "Auto", description: "Picks the right model per message", icon: <Spark /> },
  { id: "atlas-max", name: "Atlas Max", description: "Hardest problems, deep reasoning", speed: 2, quality: 5, cost: 5, latencyMs: 2400, pricePerM: 75 },
  { id: "atlas", name: "Atlas", description: "Balanced for everyday work", speed: 4, quality: 4, cost: 3, latencyMs: 900, pricePerM: 15 },
  { id: "atlas-mini", name: "Atlas Mini", description: "Fast answers, lowest cost", speed: 5, quality: 3, cost: 1, latencyMs: 350, pricePerM: 1.25 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ModelPicker } = ui;
  const [model, setModel] = useState("atlas");
  const [thinking, setThinking] = useState(true);
  const [web, setWeb] = useState(false);
  const [effort, setEffort] = useState<ModelEffort>("medium");
  const name = models.find((m) => m.id === model)?.name ?? model;

  return (
    <div style={{ width: "100%", maxWidth: 440, minHeight: 500, display: "grid", alignContent: "start", gap: 10 }}>
      <div
        style={{
          ...surface,
          borderRadius: 16,
          padding: "12px 10px 8px",
        }}
      >
        <div style={{ fontSize: 14, color: "var(--tc-text-placeholder, light-dark(#646464, #8e8e95))", padding: "2px 4px 14px" }}>Ask anything…</div>
        <ModelPicker
          models={models}
          value={model}
          onChange={setModel}
          thinking={thinking}
          onThinkingChange={setThinking}
          webSearch={web}
          onWebSearchChange={setWeb}
          effort={effort}
          onEffortChange={setEffort}
          defaultOpen
          align="start"
          side="bottom"
        />
      </div>
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>
        {name} · thinking {thinking ? `on (${effort})` : "off"} · web search {web ? "on" : "off"}
      </div>
    </div>
  );
}

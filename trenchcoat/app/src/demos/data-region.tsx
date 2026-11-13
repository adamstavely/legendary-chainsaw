import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { DataRegionOption, DataRegionItem, DataRegionProgressStep, DataRegionStep } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's AI workspace, stored in Frankfurt, thinking about a move. Model names are generic. */

const REGIONS: DataRegionOption[] = [
  { id: "eu-fra", name: "EU – Frankfurt", latency: "About 20 ms from your team" },
  { id: "eu-dub", name: "EU – Dublin", latency: "About 35 ms from your team", note: "Same jurisdiction as today" },
  { id: "us-east", name: "US – Virginia", latency: "About 95 ms from your team" },
  { id: "ap-syd", name: "AP – Sydney", latency: "About 290 ms from your team", unavailable: ["large-1"] },
];
const STORED: DataRegionItem[] = [
  { label: "Conversations", inRegion: true },
  { label: "Files and uploads", inRegion: true },
  { label: "Embeddings and search index", inRegion: true },
  { label: "Audit logs", inRegion: true },
  { label: "Model processing", inRegion: false, note: "large-1 runs in the EU and US" },
];
const PROGRESS: DataRegionProgressStep[] = [
  { id: "prep", label: "Preparing", status: "done" },
  { id: "copy", label: "Copying data", status: "active", detail: "62% – 18 GB of 29 GB" },
  { id: "index", label: "Re-indexing", status: "pending" },
  { id: "switch", label: "Switching over", status: "pending" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DataRegion } = ui;
  const [step, setStep] = useState<DataRegionStep>("choose");
  const [target, setTarget] = useState<string | null>("eu-dub");
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <DataRegion
        title="Data region"
        description="Halvorsen Research Institute"
        workspace="Halvorsen Research"
        current="eu-fra"
        regions={REGIONS}
        stored={STORED}
        step={step}
        onStepChange={setStep}
        target={target}
        onTargetChange={setTarget}
        impact={{
          downtime: "About 2 hours of read-only time",
          reindexed: ["Search index", "Embeddings"],
          notes: ["People stay signed in; links to chats and files keep working."],
        }}
        progress={PROGRESS}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Pick a region and step through the move.{" "}
        <button type="button" style={textButton} onClick={() => setStep(step === "progress" ? "choose" : "progress")}>
          {step === "progress" ? "Start over" : "Show a move in progress"}
        </button>
      </div>
    </div>
  );
}

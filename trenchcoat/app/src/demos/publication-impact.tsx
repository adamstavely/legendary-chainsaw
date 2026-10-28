import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PublicationFeedback, PublicationFeedbackFilter } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A year in the life of a Larkfield Institute paper: reach, mentions, who reads it and what people said. */

const FEEDBACK: PublicationFeedback[] = [
  { id: "f1", kind: "peer", who: "Reviewer 2", where: "Journal of Applied Sensing", date: Date.UTC(2025, 8, 2), quote: "The calibration gains are convincing, but the baseline drift model is under-tuned; rerun it with the longer warm-up.", sentiment: "mixed" },
  { id: "f2", kind: "reader", who: "Dr. Ines Marlow", where: "Northfield Lab", date: Date.UTC(2025, 11, 10), quote: "We reproduced the 12× drift reduction on our own rig. The harness is excellent.", sentiment: "positive" },
  { id: "f3", kind: "sponsor", who: "Programme manager", where: "Coastal Monitoring Fund", date: Date.UTC(2026, 0, 18), quote: "Exactly the normalised benchmark the programme needs. Let's brief the board.", sentiment: "positive" },
];
const READS = [400, 1300, 2600, 4100, 5800, 7400, 9100, 10800, 12400, 14100, 15900, 18000];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PublicationImpact } = ui;
  const [filter, setFilter] = useState<PublicationFeedbackFilter>("all");
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <PublicationImpact
        title="Self-Calibrating Coastal Sensors Cut Drift Twelvefold Over a Year at Sea"
        venue="Journal of Applied Sensing"
        date={Date.UTC(2025, 10, 4)}
        topic={{ label: "Ocean Sensing Networks" }}
        grade={{ label: "Outstanding", tone: "success" }}
        authors={[{ name: "Ada Okafor" }, { name: "Tomas Lindqvist" }, { name: "Mei Tanaka" }]}
        outcome="resolves gap"
        metrics={{ downloads: 18000, views: 46000, citations: 73, attention: 284 }}
        reads={READS}
        mentions={[
          { label: "News", value: 11 },
          { label: "Policy", value: 3 },
          { label: "Social", value: 128 },
          { label: "Patents", value: 2 },
        ]}
        audience={{
          sectors: [
            { label: "Academic", value: 54 },
            { label: "Industry", value: 23 },
            { label: "Government", value: 14 },
            { label: "Nonprofit", value: 9 },
          ],
          split: { internal: 6, external: 94 },
          places: [
            { label: "United States", value: 38 },
            { label: "Germany", value: 12 },
            { label: "Japan", value: 9 },
            { label: "Other", value: 41 },
          ],
        }}
        feedback={FEEDBACK}
        filter={filter}
        onFilterChange={setFilter}
      />
      <div style={{ ...caption, textAlign: "center" }}>Filter the feedback with the arrow keys, or point at a reader row.</div>
    </div>
  );
}

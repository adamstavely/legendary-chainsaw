import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ScoreRingMetric, ScoreRingSubscore } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's audit team scores its survey records: completeness counts most, then accuracy, freshness and
   consistency. "Run the clean-up" lifts the scores to what they'd be after the duplicates are merged. */

const BEFORE: ScoreRingSubscore[] = [
  { id: "complete", label: "Completeness", score: 91, weight: 4 },
  { id: "accurate", label: "Accuracy", score: 84, weight: 3 },
  { id: "fresh", label: "Freshness", score: 62, weight: 2 },
  { id: "consistent", label: "Consistency", score: 71, weight: 2 },
];
const AFTER: ScoreRingSubscore[] = BEFORE.map((s) => (s.id === "consistent" ? { ...s, score: 88 } : s.id === "accurate" ? { ...s, score: 87 } : s));

const metrics = (after: boolean): ScoreRingMetric[] => [
  { label: "Records checked", value: 48_210, change: "+2,140", trend: "neutral" },
  { label: "Duplicates found", value: after ? 12 : 386, change: after ? "−374" : "+41", trend: after ? "good" : "bad" },
  { label: "Median age", value: 19, unit: "days", change: "+3 days", trend: "bad" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ScoreRing } = ui;
  const [after, setAfter] = useState(false);
  const [subscore, setSubscore] = useState<string | null>("fresh");
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <ScoreRing
        title="Data quality"
        description="Survey records held by the audit team, scored this week."
        subscores={after ? AFTER : BEFORE}
        metrics={metrics(after)}
        subscore={subscore}
        onSubscoreChange={setSubscore}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {subscore === null ? "Point at a segment or a row to isolate it; Enter selects. " : `${(after ? AFTER : BEFORE).find((s) => s.id === subscore)?.label} is selected. `}
        <button type="button" style={textButton} onClick={() => setAfter(!after)}>
          {after ? "Undo the clean-up" : "Run the clean-up"}
        </button>
      </div>
    </div>
  );
}

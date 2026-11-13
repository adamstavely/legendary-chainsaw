import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { QualityChange, QualityCriterion, QualityDay, QualityRange } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's "Policy Q&A" agent in production: the judge scores four criteria on every live chat. A new
   policy-search tool in September lifts "Cites policy", a model switch in October helps a little, and prompt v14 on
   3 Nov drops correctness and citations. */

const DAY = 86_400_000;
const END = Date.UTC(2026, 10, 10);

/** A small deterministic noise, so the demo looks the same every time */
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const CRITERIA: QualityCriterion[] = [
  { id: "correct", label: "Correctness" },
  { id: "cites", label: "Cites policy" },
  { id: "helpful", label: "Helpfulness" },
  { id: "tone", label: "Tone" },
];

const CHANGES: QualityChange[] = [
  { id: "tool", at: Date.UTC(2026, 8, 22), label: "New tool: policy search", short: "policy search", kind: "tool", detail: "Looks up the handbook before answering" },
  { id: "model", at: Date.UTC(2026, 9, 14), label: "Model: Atlas 2 → Atlas 3", short: "Atlas 3", kind: "model" },
  { id: "v14", at: Date.UTC(2026, 10, 3), label: "Prompt v13 → v14", short: "v14", kind: "prompt", detail: "Shorter instructions; citation rule moved to the end" },
];

/** Each criterion's level on a day: a base, plus what each change did from its day on */
const LEVEL: Record<string, (t: number) => number> = {
  correct: (t) => 4.3 + (t >= CHANGES[1].at ? 0.12 : 0) - (t >= CHANGES[2].at ? 0.62 : 0),
  cites: (t) => 3.7 + (t >= CHANGES[0].at ? 0.45 : 0) - (t >= CHANGES[2].at ? 0.4 : 0),
  helpful: (t) => 4.0 + (t >= CHANGES[1].at ? 0.18 : 0) - (t >= CHANGES[2].at ? 0.12 : 0),
  tone: () => 4.5,
};

const DAYS: QualityDay[] = Array.from({ length: 90 }, (_, i) => {
  const date = END - (89 - i) * DAY;
  const weekday = new Date(date).getUTCDay();
  const n = Math.round((weekday === 0 || weekday === 6 ? 60 : 170) * (0.8 + 0.4 * noise(i + 3)));
  const scores: QualityDay["scores"] = {};
  CRITERIA.forEach((c, k) => {
    const wobble = (noise(i * 7 + k * 101) - 0.5) * (6 / Math.sqrt(n));
    scores[c.id] = { mean: Math.max(1, Math.min(5, LEVEL[c.id](date) + wobble)), n, sd: 0.9 };
  });
  return { date, scores };
});

export default function Demo({ ui }: { ui: typeof UI }) {
  const { QualityTrend } = ui;
  const [range, setRange] = useState<QualityRange>("30d");
  const [opened, setOpened] = useState<string>("");
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 10 }}>
      <QualityTrend
        title="Policy Q&A · judge scores"
        description="Live chats, scored 1–5 by the judge"
        criteria={CRITERIA}
        days={DAYS}
        changes={CHANGES}
        range={range}
        onRangeChange={setRange}
        defaultShown={["correct", "cites", "helpful"]}
        locale="en-GB"
        onChangeOpen={(c) => setOpened(c.label)}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {opened ? `Opened “${opened}”. ` : "Hover or focus a pin to see what changed. "}
        <button type="button" style={textButton} onClick={() => setRange(range === "90d" ? "30d" : "90d")}>
          {range === "90d" ? "Back to 30 days" : "Show 90 days"}
        </button>
      </div>
    </div>
  );
}

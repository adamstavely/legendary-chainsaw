import { useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SpendEntry } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's AI spend in November: three teams, three features, two models and a few people. */

/** A seeded sequence, so the chart and the thumbnail stay the same */
function noise(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const WORK = [
  { feature: "Policy Q&A", team: "Operations", model: "small-2", users: ["Ana Ruiz", "Ben Ode"], base: 38 },
  { feature: "Invoice matcher", team: "Audit", model: "large-1", users: ["Priya Raman", "Jonah Tran"], base: 92 },
  { feature: "Report drafting", team: "Research", model: "large-1", users: ["Sofia Almeida", "Marcus Okonkwo", "Naomi Yusuf"], base: 64 },
  { feature: "Report drafting", team: "Research", model: "small-2", users: ["Naomi Yusuf"], base: 14 },
];

function month(seed: number, scale: number, days: number): SpendEntry[] {
  const rnd = noise(seed);
  const out: SpendEntry[] = [];
  for (let d = 1; d <= days; d++) {
    const date = `2026-11-${String(d).padStart(2, "0")}`;
    const weekend = [7, 8, 14, 15, 21, 22, 28, 29].includes(d);
    for (const w of WORK) {
      const user = w.users[Math.floor(rnd() * w.users.length)];
      const cost = Math.round(w.base * scale * (weekend ? 0.25 : 0.7 + rnd() * 0.6) * 100) / 100;
      out.push({ date, cost, by: { model: w.model, feature: w.feature, team: w.team, user } });
    }
  }
  return out;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SpendBreakdown } = ui;
  const [period, setPeriod] = useState("month");
  const [picked, setPicked] = useState<string | null>(null);
  const entries = useMemo(() => (period === "month" ? month(3, 1, 12) : month(5, 1.05, 30)), [period]);
  const previous = useMemo(() => (period === "month" ? month(11, 0.9, 12) : month(13, 0.95, 30)), [period]);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <SpendBreakdown
        description="Northfield Research Institute · November so far"
        entries={entries}
        previous={previous}
        period={period}
        onPeriodChange={setPeriod}
        defaultDimension="feature"
        selected={picked}
        onSliceSelect={setPicked}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {picked ? (
          <>
            Filtered to {picked}.{" "}
            <button type="button" style={textButton} onClick={() => setPicked(null)}>
              Show all
            </button>
          </>
        ) : (
          "Switch between model, feature, user and team, or pick a row to filter."
        )}
      </div>
    </div>
  );
}

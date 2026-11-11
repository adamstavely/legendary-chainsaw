import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's labs by staff and papers published, each circle sized by its grant funding, with a
   least-squares trend and its confidence band (“Show last year” glides them to the year before); and 2,000 instrument
   calibration readings as a scatter plot – past the threshold, so they're painted on a canvas; and a scatter by group:
   each review's hours against its findings, by team, with stat tiles under it – point at a team in the legend to
   isolate it, press it to hide it. */

const LABS = ["Genomics", "Imaging", "Proteomics", "Field ecology", "Neuro", "Climate", "Chemistry", "Materials"];
const YEARS = [
  { staff: [24, 12, 16, 9, 20, 14, 18, 11], papers: [41, 18, 27, 14, 33, 22, 29, 16], grants: [3.2, 1.4, 2.1, 0.8, 4.5, 1.9, 2.6, 1.2] },
  { staff: [21, 13, 14, 8, 17, 10, 18, 9], papers: [35, 21, 22, 15, 24, 13, 31, 12], grants: [2.8, 1.6, 1.7, 0.7, 3.1, 1.1, 2.9, 0.9] },
];

/** A deterministic stream of numbers in [0, 1) */
function stream(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const rnd = stream(17);
const READINGS = Array.from({ length: 2000 }, (_, i) => {
  const ref = 5 + rnd() * 90;
  return { label: `Reading ${i + 1}`, reference: Math.round(ref * 10) / 10, measured: Math.round((ref * 1.02 + (rnd() + rnd() + rnd() - 1.5) * 4) * 10) / 10 };
});

const TEAMS = ["Fraud", "Audit", "Compliance"];
const REVIEWS = Array.from({ length: 54 }, (_, i) => {
  const t = i % 3;
  const hours = Math.round((4 + rnd() * 26 + t * 3) * 10) / 10;
  return { label: `Review ${i + 1}`, team: TEAMS[t], hours, findings: Math.max(0, Math.round(hours * (0.55 - t * 0.12) + (rnd() - 0.5) * 6)) };
});

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BubbleChart } = ui;
  const [y, setY] = useState(0);
  const year = YEARS[y];
  const data = LABS.map((label, i) => ({ label, staff: year.staff[i], papers: year.papers[i], grants: year.grants[i] }));
  const [groups, setGroups] = useState<string[] | undefined>(undefined);
  const shown = REVIEWS.filter((r) => !groups || groups.includes(r.team));
  const hours = shown.reduce((s, r) => s + r.hours, 0);
  const findings = shown.reduce((s, r) => s + r.findings, 0);
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <BubbleChart
          title="Labs by size and output"
          description={y === 0 ? "This year · circle size is grant funding ($M)" : "Last year · circle size is grant funding ($M)"}
          data={data}
          x="staff"
          y="papers"
          size="grants"
          xLabel="Staff"
          yLabel="Papers"
          trend="linear"
          trendBand
        />
        <BubbleChart title="Calibration readings" description="Measured against reference, 2,000 readings" data={READINGS} x="reference" y="measured" xLabel="Reference" yLabel="Measured" />
      </div>
      <BubbleChart
        title="Scatter by group"
        description="Review hours against findings, by team · this quarter"
        data={REVIEWS}
        x="hours"
        y="findings"
        group="team"
        groups={groups}
        onGroupsChange={setGroups}
        xLabel="Hours"
        yLabel="Findings"
        format="integer"
        stats={[
          { label: "Reviews", value: shown.length },
          { label: "Review hours", value: Math.round(hours), change: 6.2 },
          { label: "Findings", value: findings, change: -3.4 },
          { label: "Findings per hour", value: (findings / Math.max(1, hours)).toFixed(2) },
        ]}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a circle, or Tab in and use the arrows; press a team in the legend to hide it.{" "}
        <button type="button" style={textButton} onClick={() => setY(1 - y)}>
          Show {y === 0 ? "last year" : "this year"}
        </button>
      </div>
    </div>
  );
}

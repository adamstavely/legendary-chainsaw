import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's code repository: how one engineer's work split across commits, pull requests, reviews and
   issues, year by year (“Show next year” steps through), and three lab teams compared on the same five practices. */

const AXES = ["Code review", "Issues", "Pull requests", "Commits"];
const YEARS = [
  { year: 2026, values: [0, 0, 10, 90] },
  { year: 2025, values: [18, 7, 25, 50] },
  { year: 2024, values: [34, 12, 22, 32] },
];
const PRACTICES = ["Testing", "Documentation", "Code review", "Reproducibility", "Data handling"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RadarChart } = ui;
  const [i, setI] = useState(0);
  const shown = YEARS[i];
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <RadarChart title="Activity overview" description={`Contributions in ${shown.year}`} unit="%" axes={AXES} series={[{ name: "Contributions", values: shown.values }]} />
        <RadarChart
          title="Lab practices"
          description="Self-assessed, out of 5"
          grid="web"
          max={5}
          axes={PRACTICES}
          series={[
            { name: "Genomics", values: [4.5, 3, 4, 4.5, 3.5] },
            { name: "Imaging", values: [3, 4.5, 3.5, 2.5, 4] },
            { name: "Field ecology", values: [2, 3.5, 2.5, 4, 4.5] },
          ]}
          format={(v) => `${v} of 5`}
        />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Press Table for the numbers.{" "}
        <button type="button" style={textButton} onClick={() => setI((i + 1) % YEARS.length)}>
          Show {YEARS[(i + 1) % YEARS.length].year}
        </button>
      </div>
    </div>
  );
}

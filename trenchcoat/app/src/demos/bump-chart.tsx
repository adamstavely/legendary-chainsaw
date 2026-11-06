import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's grants office: where each lab ranked for funding won, year by year (“Show by awards” ranks
   the same labs by the number of awards instead, and the lines glide to their new places), and an audit league table
   ranked from its scores. */

const LABS = ["Genomics", "Imaging", "Proteomics", "Neuro", "Climate", "Materials"];
const YEARS = ["2021", "2022", "2023", "2024", "2025", "2026"];
// Each lab's rank per year: by funding won, then by awards
const RANKS = [
  {
    Genomics: [1, 1, 2, 2, 3, 3],
    Imaging: [5, 4, 4, 3, 2, 1],
    Proteomics: [2, 3, 1, 1, 1, 2],
    Neuro: [3, 2, 3, 4, 4, 5],
    Climate: [4, 5, 6, 5, 5, 4],
    Materials: [6, 6, 5, 6, 6, 6],
  },
  {
    Genomics: [2, 2, 1, 1, 2, 2],
    Imaging: [6, 5, 5, 4, 3, 3],
    Proteomics: [1, 1, 2, 3, 4, 4],
    Neuro: [4, 3, 3, 2, 1, 1],
    Climate: [3, 4, 4, 5, 5, 6],
    Materials: [5, 6, 6, 6, 6, 5],
  },
] as Record<string, number[]>[];
const SCORES = [
  { round: "Spring", lab: "Genomics", score: 82 },
  { round: "Spring", lab: "Imaging", score: 74 },
  { round: "Spring", lab: "Neuro", score: 88 },
  { round: "Spring", lab: "Climate", score: 69 },
  { round: "Summer", lab: "Genomics", score: 79 },
  { round: "Summer", lab: "Imaging", score: 85 },
  { round: "Summer", lab: "Neuro", score: 81 },
  { round: "Summer", lab: "Climate", score: 77 },
  { round: "Autumn", lab: "Genomics", score: 75 },
  { round: "Autumn", lab: "Imaging", score: 91 },
  { round: "Autumn", lab: "Neuro", score: 80 },
  { round: "Autumn", lab: "Climate", score: 84 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BumpChart } = ui;
  const [by, setBy] = useState(0);
  const data = LABS.flatMap((series) => RANKS[by][series].map((rank, k) => ({ x: YEARS[k], series, rank })));
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 12 }}>
        <BumpChart title="Grant ranking" description={by === 0 ? "By funding won, 2021–2026" : "By awards, 2021–2026"} data={data} />
        <BumpChart title="Audit league" description="Ranked by score each round" data={SCORES} x="round" series="lab" value="score" />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a year, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setBy(1 - by)}>
          Show by {by === 0 ? "awards" : "funding"}
        </button>
      </div>
    </div>
  );
}

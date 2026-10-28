import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { Grade } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* How a fictional research institute's papers were assessed this year. Pick a grade to filter the list below it;
   "Assess another" adds an Excellent. */

const START: Grade[] = [
  { id: "outstanding", label: "Outstanding", count: 3, tone: "success" },
  { id: "excellent", label: "Excellent", count: 5, tone: "info" },
  { id: "satisfactory", label: "Satisfactory", count: 2, tone: "neutral" },
  { id: "dissatisfactory", label: "Dissatisfactory", count: 0, tone: "danger" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { GradeDistribution } = ui;
  const [grades, setGrades] = useState(START);
  const [selected, setSelected] = useState<string | null>(null);
  const picked = grades.find((g) => g.id === selected);
  return (
    <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: 8 }}>
      <GradeDistribution title="Paper grades" grades={grades} bar selectable selected={selected} onSelectedChange={setSelected} />
      <div style={{ ...caption, textAlign: "center" }}>
        {picked ? `Showing the ${picked.count} ${picked.label.toLowerCase()} papers. ` : "Pick a grade to filter the papers. "}
        <button type="button" style={textButton} onClick={() => setGrades(grades.map((g) => (g.id === "excellent" ? { ...g, count: g.count + 1 } : g)))}>
          Assess another
        </button>
      </div>
    </div>
  );
}

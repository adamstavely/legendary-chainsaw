import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's grant office: proposals at each step of this year's round, the biggest drop emphasised
   (“Show last year” glides the bars to last year's round, when the drop came at a different step). */

const STEPS = ["Ideas logged", "Drafted", "Internal review", "Submitted", "Shortlisted", "Funded"];
const ROUNDS = [
  [212, 148, 121, 104, 39, 27],
  [188, 102, 88, 79, 41, 22],
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FunnelChart } = ui;
  const [r, setR] = useState(0);
  const data = STEPS.map((label, i) => ({ label, value: ROUNDS[r][i] }));
  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 8 }}>
      <FunnelChart title="Grant proposals" description={r === 0 ? "This year's round" : "Last year's round"} data={data} />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a step, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setR(1 - r)}>
          Show {r === 0 ? "last year" : "this year"}
        </button>
      </div>
    </div>
  );
}

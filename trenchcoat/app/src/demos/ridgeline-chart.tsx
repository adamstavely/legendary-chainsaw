import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's sample store: how long samples waited between collection and the freezer, by collecting
   team, in October and September (“Show September” reshapes the ridges to the month before). */

const TEAMS = ["Field ecology", "Clinical cohort", "Marine survey", "Soil microbiome", "Neuro tissue", "Air quality"];
// Two humps for teams that ship in batches: [centre, spread, second centre or 0]
const SHAPE = [
  [
    [5.5, 1.4, 9],
    [1.6, 0.5, 0],
    [7.2, 1.8, 0],
    [3.4, 1.0, 6.5],
    [1.1, 0.3, 0],
    [4.1, 1.2, 0],
  ],
  [
    [6.2, 1.6, 0],
    [1.9, 0.6, 0],
    [6.0, 1.5, 9.5],
    [3.8, 1.1, 0],
    [1.3, 0.4, 0],
    [3.6, 0.9, 6],
  ],
];

/** A deterministic sequence in [0, 1) */
function seq(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function month(m: number) {
  const rnd = seq(41 + m);
  return TEAMS.flatMap((group, g) => {
    const [mu, sd, mu2] = SHAPE[m][g];
    return Array.from({ length: 60 }, (_, k) => {
      const z = (rnd() + rnd() + rnd() - 1.5) * 2;
      const centre = mu2 && k % 3 === 0 ? mu2 : mu;
      return { group, value: Math.round(Math.max(0.2, centre + z * sd) * 10) / 10 };
    });
  });
}
const MONTHS = [month(0), month(1)];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RidgelineChart } = ui;
  const [m, setM] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <RidgelineChart title="Time to freezer" description={`${m === 0 ? "October" : "September"}, hours from collection, by team`} unit=" h" data={MONTHS[m]} />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a ridge, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setM(1 - m)}>
          Show {m === 0 ? "September" : "October"}
        </button>
      </div>
    </div>
  );
}

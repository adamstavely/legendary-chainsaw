import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's instrument lab: 20,000 calibration readings, the room temperature against how far each
   reading drifted from the reference, gathered into hexagons – shaded by how many readings, or (“Show mean drift”) by
   the mean absolute drift of the readings in each. */

/** A deterministic sequence in [0, 1) */
function seq(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Most readings sit near 21 °C with little drift; warmer rooms drift more, and one instrument runs warm
const rnd = seq(41);
const gauss = () => rnd() + rnd() + rnd() + rnd() - 2;
const READINGS = Array.from({ length: 20000 }, (_, k) => {
  const warm = k % 9 === 4;
  const temperature = Math.round((warm ? 25.5 + gauss() * 1.1 : 21 + gauss() * 1.5) * 100) / 100;
  const drift = Math.round(((temperature - 20) * 0.08 + gauss() * 0.22 + (warm ? 0.25 : 0)) * 1000) / 1000;
  return { temperature, drift, size: Math.abs(drift) };
});

export default function Demo({ ui }: { ui: typeof UI }) {
  const { HexbinChart } = ui;
  const [mean, setMean] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <HexbinChart
        title="Calibration readings"
        description={mean ? "20,000 readings · shade is the mean absolute drift" : "20,000 readings · shade is how many"}
        data={READINGS}
        x="temperature"
        y="drift"
        value="size"
        aggregate={mean ? "mean" : "count"}
        xLabel="Room temperature (°C)"
        yLabel="Drift"
        valueFormat={{ maximumFractionDigits: 2 }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a hexagon, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setMean(!mean)}>
          {mean ? "Show counts" : "Show mean drift"}
        </button>
      </div>
    </div>
  );
}

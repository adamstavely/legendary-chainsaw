import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SparklineType } from "../../../src/elements/react";
import { caption, surface, textButton } from "../demo-kit";

/* A laboratory's sample throughput over the last fortnight: one sparkline per bench in a table, and an interactive one
   in a sentence. "Show as bars" cycles the type through line, area, bars and win-loss (each day against the day
   before). */

/** A small deterministic noise, so the demo looks the same every time */
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const DAYS = Array.from({ length: 14 }, (_, i) => new Date(2026, 9, 15 + i).toLocaleDateString(undefined, { weekday: "short", day: "numeric" }));
const series = (seed: number, base: number, drift: number) =>
  Array.from({ length: 14 }, (_, i) => Math.round(base + drift * i + (noise(seed * 31 + i) - 0.5) * base * 0.35 - (i % 7 >= 5 ? base * 0.45 : 0)));
const BENCHES = [
  { name: "Sequencing", unit: "runs", values: series(1, 42, 1.4), good: "up" as const },
  { name: "Mass spectrometry", unit: "samples", values: series(2, 118, -1.8), good: "up" as const },
  { name: "Cell culture", unit: "plates", values: series(3, 64, 0.2), good: "up" as const },
  { name: "Turnaround", unit: "h", values: series(4, 30, -0.9), good: "down" as const },
];
const TYPES: SparklineType[] = ["line", "area", "bars", "win-loss"];
const NEXT: Record<SparklineType, string> = { line: "Show as area", area: "Show as bars", bars: "Show as win-loss", "win-loss": "Show as a line" };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Sparkline } = ui;
  const [type, setType] = useState<SparklineType>("line");
  const [point, setPoint] = useState("");
  const show = (values: number[]) => (type === "win-loss" ? values.map((v, i) => (i ? Math.sign(v - values[i - 1]) : 0)) : values);
  const cell = { padding: "8px 12px", borderTop: "1px solid var(--tc-border-subtle, light-dark(#f0f0f0, #232326))" };
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 12 }}>
      <table style={{ ...surface, borderRadius: 12, borderCollapse: "separate", borderSpacing: 0, fontSize: 13, overflow: "hidden" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", fontSize: 12 }}>
            <th style={{ padding: "8px 12px", fontWeight: 500 }}>Bench</th>
            <th style={{ padding: "8px 12px", fontWeight: 500 }}>Last 14 days</th>
            <th style={{ padding: "8px 12px", fontWeight: 500, textAlign: "right" }}>Today</th>
          </tr>
        </thead>
        <tbody>
          {BENCHES.map((b) => (
            <tr key={b.name}>
              <td style={cell}>{b.name}</td>
              <td style={cell}>
                <Sparkline label={`${b.name}, last 14 days`} type={type} values={show(b.values)} unit={type === "win-loss" ? undefined : b.unit} good={b.good} markers="last min max" width={120} />
              </td>
              <td style={{ ...cell, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {b.values[13]} {b.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--tc-text-primary, light-dark(#171717, #ededed))" }}>
        Sequencing ran{" "}
        <Sparkline interactive label="Sequencing runs per day" values={BENCHES[0].values} labels={DAYS} unit="runs" reference={50} referenceLabel="Target" good="up" onPointFocus={(_, v, l) => setPoint(`${l}: ${v ?? "no data"} runs`)} /> this
        fortnight, against a target of 50 a day.
      </p>
      <div style={{ ...caption, textAlign: "center" }}>
        {point ? `${point}. ` : "Focus the sparkline in the sentence and use the arrow keys, or point at it. "}
        <button type="button" style={textButton} onClick={() => setType(TYPES[(TYPES.indexOf(type) + 1) % TYPES.length])}>
          {NEXT[type]}
        </button>
      </div>
    </div>
  );
}

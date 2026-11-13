import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's quarterly spend chart, before and after an AI cleanup: the original has clashing
   colours, a cramped legend and no axis labels; the edit tidies them. Both drawn here as SVG, 640 × 360 */

const W = 640;
const H = 360;
const bars = [62, 118, 94, 150, 128, 176];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function chart(edited: boolean) {
  const colours = edited ? ["#5b7fb3"] : ["#e2513d", "#3fae49", "#f2b705", "#7a3fb8", "#14a3c7", "#e2513d"];
  const grid = edited ? [80, 140, 200, 260].map((y) => `<path d="M72 ${y}H600" stroke="#e6e7ec"/>`).join("") : "";
  const body = bars
    .map((v, i) => {
      const x = 96 + i * 84;
      const top = 300 - v;
      const fill = colours[i % colours.length];
      const label = edited ? `<text x="${x + 22}" y="${top - 8}" font-size="13" text-anchor="middle" fill="#3a3a40">£${v}k</text>` : "";
      return `<rect x="${x}" y="${top}" width="44" height="${v}" rx="${edited ? 4 : 0}" fill="${fill}"/>${label}<text x="${x + 22}" y="324" font-size="${edited ? 13 : 10}" text-anchor="middle" fill="${edited ? "#6b6b70" : "#999"}">${months[i]}</text>`;
    })
    .join("");
  const title = edited
    ? `<text x="72" y="44" font-size="18" font-weight="600" fill="#1d1d1f">Research spend by month, 2026</text><text x="72" y="64" font-size="12" fill="#6b6b70">£ thousands · Halvorsen Research Institute</text>`
    : `<text x="72" y="44" font-size="14" fill="#555">spend_q1q2_FINAL(2).xlsx</text><rect x="470" y="28" width="150" height="40" fill="#fff" stroke="#999"/><text x="480" y="52" font-size="9" fill="#555">Series1 Series2 Series3</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Helvetica, Arial, sans-serif"><rect width="${W}" height="${H}" fill="${edited ? "#fff" : "#fbfbf6"}"/>${grid}<path d="M72 300H600" stroke="${edited ? "#c9cad1" : "#333"}"/>${body}${title}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const BEFORE = { src: chart(false), alt: "The original chart: six bars in clashing colours, a cramped legend and no title or values", label: "Original" };
const AFTER = { src: chart(true), alt: "The edited chart: six bars in one blue with values on top, a title and a light grid", label: "AI edit" };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BeforeAfter } = ui;
  const [position, setPosition] = useState(42);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 10 }}>
      <BeforeAfter title="Chart cleanup" description="Asked: “Make this chart readable for the board pack”" beforeImage={BEFORE} afterImage={AFTER} position={position} onPositionChange={setPosition} />
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>Drag the divider, or focus it and use the arrow keys · {Math.round(position)}% original</span>
        <button type="button" style={textButton} onClick={() => setPosition(50)}>
          Centre
        </button>
      </div>
    </div>
  );
}

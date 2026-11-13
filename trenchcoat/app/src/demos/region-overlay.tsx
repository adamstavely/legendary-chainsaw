import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { OverlayRegion } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A scanned audit form from a fictional research institute, drawn here as SVG at 800 × 1000 – the boxes below are
   fractions of that */

const W = 800;
const H = 1000;
const ink = "#1d1d1f";
const soft = "#6b6b70";

const svgText = (x: number, y: number, size: number, text: string, fill = ink, weight = 400) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}">${text}</text>`;

const FORM = [
  svgText(64, 90, 24, "Halvorsen Research Institute", ink, 600),
  svgText(64, 118, 14, "Internal audit · Expense verification form", soft),
  svgText(64, 190, 12, "CASE NUMBER", soft),
  svgText(64, 214, 16, "AUD-2026-0412"),
  svgText(420, 190, 12, "DATE RECEIVED", soft),
  svgText(420, 214, 16, "3 November 2026"),
  // A table of claims
  `<rect x="64" y="270" width="672" height="200" fill="none" stroke="#c9c9cf"/>`,
  `<path d="M64 310H736M64 350H736M64 390H736M64 430H736M400 270V470M560 270V470" stroke="#e3e3e6"/>`,
  svgText(80, 296, 12, "ITEM", soft),
  svgText(416, 296, 12, "DATE", soft),
  svgText(576, 296, 12, "AMOUNT", soft),
  svgText(80, 336, 14, "Conference travel"),
  svgText(416, 336, 14, "14 Oct"),
  svgText(576, 336, 14, "£412.80"),
  svgText(80, 376, 14, "Field equipment"),
  svgText(416, 376, 14, "21 Oct"),
  svgText(576, 376, 14, "£1,180.00"),
  svgText(80, 416, 14, "Lab consumables"),
  svgText(416, 416, 14, "28 Oct"),
  svgText(576, 416, 14, "£96.45"),
  // A small bar chart
  `<rect x="64" y="520" width="320" height="200" fill="#f6f6f8" stroke="#e3e3e6"/>`,
  `<rect x="100" y="640" width="40" height="60" fill="#8fa8c8"/><rect x="170" y="590" width="40" height="110" fill="#8fa8c8"/><rect x="240" y="610" width="40" height="90" fill="#8fa8c8"/><rect x="310" y="560" width="40" height="140" fill="#8fa8c8"/>`,
  svgText(420, 540, 12, "REVIEWER NOTES", soft),
  svgText(420, 566, 14, "Receipts match card statement."),
  svgText(420, 588, 14, "Equipment over £1,000 needs a"),
  svgText(420, 610, 14, "second approver.", "#8a8a90"),
  // A photo badge with the face blurred, and a stamp
  `<rect x="64" y="780" width="96" height="120" rx="6" fill="#d9d9de"/><circle cx="112" cy="830" r="26" fill="#b8b8c0"/><rect x="80" y="864" width="64" height="28" rx="14" fill="#b8b8c0"/>`,
  `<circle cx="640" cy="840" r="58" fill="none" stroke="#b5483f" stroke-width="3"/>`,
  svgText(600, 846, 15, "VERIFIED", "#b5483f", 600),
  svgText(200, 860, 14, "Signed: M. Okafor, internal audit", soft),
].join("");

const SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Helvetica, Arial, sans-serif"><rect width="${W}" height="${H}" fill="#fff"/>${FORM}</svg>`,
)}`;

/** A box from pixels on the 800 × 1000 form */
const box = (x: number, y: number, w: number, h: number) => ({ x: x / W, y: y / H, width: w / W, height: h / H });

const REGIONS: OverlayRegion[] = [
  { id: "org", label: "Organisation", kind: "text", box: box(58, 64, 380, 34), confidence: 0.98, text: "Halvorsen Research Institute" },
  { id: "case", label: "Case number", kind: "text", box: box(58, 196, 160, 26), confidence: 0.96, text: "AUD-2026-0412" },
  { id: "date", label: "Date received", kind: "text", box: box(414, 196, 150, 26), confidence: 0.91, text: "3 November 2026" },
  { id: "claims", label: "Claims table", kind: "table", box: box(64, 270, 672, 200), confidence: 0.88, text: "Conference travel · 14 Oct · £412.80\nField equipment · 21 Oct · £1,180.00\nLab consumables · 28 Oct · £96.45" },
  { id: "chart", label: "Spend by week", kind: "figure", box: box(64, 520, 320, 200), confidence: 0.74 },
  { id: "notes", label: "Reviewer notes", kind: "text", box: box(414, 548, 260, 70), confidence: 0.67, text: "Receipts match card statement. Equipment over £1,000 needs a second approver." },
  { id: "badge", label: "ID photo", kind: "face-blurred", box: box(64, 780, 96, 120), confidence: 0.93 },
  { id: "stamp", label: "Verified stamp", kind: "object", box: box(580, 780, 120, 120), confidence: 0.82, text: "VERIFIED" },
  { id: "sign", label: "Signature line", kind: "text", box: box(194, 842, 250, 26), confidence: 0.52, text: "Signed: M. 0kafor, internal audit" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RegionOverlay } = ui;
  const [selected, setSelected] = useState<string | null>("claims");
  const [threshold, setThreshold] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 900, display: "grid", gap: 10 }}>
      <RegionOverlay
        title="What the model read"
        description="aud-2026-0412-scan.png · 9 regions"
        src={SRC}
        alt="Scanned expense verification form for case AUD-2026-0412"
        regions={REGIONS}
        selected={selected}
        onSelectedChange={setSelected}
        threshold={threshold}
        onThresholdChange={setThreshold}
      />
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>Point at a box or move through the list · the signature line was misread at 52%</span>
        <button type="button" style={textButton} onClick={() => setThreshold((t) => (t ? 0 : 0.7))}>
          {threshold ? "Show all" : "Hide under 70%"}
        </button>
      </div>
    </div>
  );
}

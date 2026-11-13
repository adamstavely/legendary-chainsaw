import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { EditRegionOp } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Page 4 of a research institute's annual report, drawn here as SVG so nothing loads: a bar chart of audits by quarter
 * on the left, a table of findings on the right. The mask starts over the chart, with the instruction to swap it for
 * a table; Generate pretends to work for a moment */

function page() {
  const bars = [62, 88, 74, 112]
    .map((h, i) => `<rect x="${70 + i * 58}" y="${330 - h * 1.6}" width="36" height="${h * 1.6}" rx="4" fill="${i === 3 ? "#2f7d6d" : "#8cc5b6"}"/><text x="${88 + i * 58}" y="352" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#4b5563">Q${i + 1}</text>`)
    .join("");
  const rows = [
    ["Vendor checks", "14"],
    ["Access reviews", "9"],
    ["Data retention", "6"],
    ["Expense claims", "11"],
  ]
    .map(([a, b], i) => `<text x="356" y="${196 + i * 36}" font-family="Arial, sans-serif" font-size="14" fill="#1f2937">${a}</text><text x="586" y="${196 + i * 36}" text-anchor="end" font-family="Arial, sans-serif" font-size="14" fill="#1f2937">${b}</text><path d="M356 ${208 + i * 36}H588" stroke="#e5e7eb"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="#fbfaf7"/>
<text x="48" y="62" font-family="Georgia, serif" font-size="26" fill="#111827">Audit activity, 2026</text>
<text x="48" y="90" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">Northfield Research Institute · Annual report, page 4</text>
<rect x="48" y="120" width="264" height="250" rx="10" fill="#ffffff" stroke="#e5e7eb"/>${bars}
<rect x="340" y="120" width="264" height="250" rx="10" fill="#ffffff" stroke="#e5e7eb"/>
<text x="356" y="152" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#374151">Findings by area</text>${rows}
<path d="M48 412H592M48 436H480" stroke="#d1d5db" stroke-width="8" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
const SRC = page();

/** A brushed scribble over the chart, drawn from a formula so the thumbnail is stable */
const START: EditRegionOp[] = [
  {
    kind: "brush",
    size: 0.09,
    points: Array.from({ length: 28 }, (_, i) => {
      const u = i / 27;
      return [Math.round((0.12 + 0.32 * u) * 1e4) / 1e4, Math.round((0.36 + 0.28 * Math.abs(Math.sin(u * Math.PI * 3))) * 1e4) / 1e4] as [number, number];
    }),
  },
  { kind: "box", x: 0.09, y: 0.27, w: 0.38, h: 0.47 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EditRegion } = ui;
  const [mask, setMask] = useState<EditRegionOp[]>(START);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("Brush over part of the page, or pick Box and use the arrow keys");
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 12 }}>
      <EditRegion
        title="Edit page 4"
        description="Annual report · Northfield Research Institute"
        src={SRC}
        alt="Annual report page 4: a bar chart of audits by quarter beside a table of findings by area"
        mask={mask}
        onMaskChange={setMask}
        defaultInstruction="Replace the chart with a table of the same numbers"
        busy={busy}
        onEdit={(edit, e) => {
          e.preventDefault();
          setBusy(true);
          setNote(`Sent: “${edit.instruction}” over ${Math.round(edit.coverage * 100)}% of the page`);
          timer.current = window.setTimeout(() => {
            setBusy(false);
            setNote("Done – in an app the edited image would replace this one");
          }, 1600);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note}.{" "}
        <button type="button" style={textButton} onClick={() => setMask(START)}>
          Restore the starting mask
        </button>
      </div>
    </div>
  );
}

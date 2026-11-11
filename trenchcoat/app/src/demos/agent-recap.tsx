import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RecapEvent, RecapItem, RecapKind } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/** A fixed clock: 7:30 in the morning, the agents having worked since 6:40 the evening before */
const NOW = new Date(2026, 10, 10, 7, 30).getTime();
const SINCE = new Date(2026, 10, 9, 18, 40).getTime();
const MIN = 60_000;

/** A seeded sequence, so the chart and the thumbnail stay the same */
function noise(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** A night's work: a busy evening, a quiet stretch, then the early-morning batch */
function night(): RecapEvent[] {
  const rnd = noise(7);
  const out: RecapEvent[] = [];
  for (let t = SINCE; t < NOW; t += 6 * MIN) {
    const h = new Date(t).getHours();
    const busy = h >= 19 && h < 23 ? 0.7 : h >= 4 && h < 7 ? 0.8 : 0.18;
    if (rnd() < busy) out.push({ at: t + Math.floor(rnd() * 5) * MIN, kind: "done" });
  }
  const notable: [number, RecapKind, string][] = [
    [new Date(2026, 10, 9, 20, 12).getTime(), "failed", "Tax ID check timed out"],
    [new Date(2026, 10, 9, 22, 48).getTime(), "needs-you", "Two files for Northwind Paper"],
    [new Date(2026, 10, 10, 2, 5).getTime(), "failed", "OCR failed on 3 scans"],
    [new Date(2026, 10, 10, 5, 40).getTime(), "needs-you", "Publish the draft summary?"],
  ];
  return [...out, ...notable.map(([at, kind, label]) => ({ at, kind, label }))];
}
const EVENTS = night();

const ITEMS: RecapItem[] = [
  { id: "n1", status: "needs-you", title: "Two vendor files for Northwind Paper", detail: "Same tax ID, different bank details", agent: "Records agent", at: new Date(2026, 10, 9, 22, 48).getTime(), href: "#vendors" },
  { id: "n2", status: "needs-you", title: "Publish the draft audit summary?", agent: "Report agent", at: new Date(2026, 10, 10, 5, 40).getTime() },
  { id: "f1", status: "failed", title: "Tax ID check for 3 suppliers", detail: "The registry timed out", agent: "Records agent", at: new Date(2026, 10, 9, 20, 12).getTime() },
  { id: "f2", status: "failed", title: "OCR on 3 scanned contracts", detail: "Pages too faint to read", agent: "Classification agent", at: new Date(2026, 10, 10, 2, 5).getTime(), href: "#scans" },
  { id: "d1", status: "done", title: "Classified 412 scanned contracts", agent: "Classification agent", at: NOW - 50 * MIN, href: "#contracts" },
  { id: "d2", status: "done", title: "Matched 1,180 invoices to vendors", agent: "Records agent", at: NOW - 3 * 60 * MIN },
  { id: "d3", status: "done", title: "Drafted the findings appendix", agent: "Report agent", at: NOW - 6 * 60 * MIN },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentRecap } = ui;
  const [run, setRun] = useState(0);
  const [last, setLast] = useState("");

  return (
    <div style={{ width: "100%", maxWidth: 880, display: "grid", gap: 12 }}>
      <AgentRecap
        key={run}
        title="Overnight recap"
        since={SINCE}
        now={NOW}
        events={EVENTS}
        items={ITEMS}
        onItemAction={(action, item, event) => {
          if (action === "open") event.preventDefault();
          setLast(`${action}: ${item.title}`);
        }}
        onClearDone={(ids) => setLast(`Cleared ${ids.length} done`)}
      />
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>{last || "Point at a marker for what happened · Approve and Retry glide the item out"}</span>
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setRun((n) => n + 1);
            setLast("");
          }}
        >
          Show the night again
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* The research institute's design-system site: the Components section, with three made-up screens as its previews. */

const svgUri = (body: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="#f7f8fa"/>${body}</svg>`)}`;
const bar = (x: number, y: number, w: number, fill = "#e3e6eb") => `<rect x="${x}" y="${y}" width="${w}" height="7" rx="3.5" fill="${fill}"/>`;

const PREVIEWS = [
  {
    alt: "A sample checklist with five steps",
    src: svgUri(
      `<rect x="24" y="18" width="272" height="164" rx="10" fill="#fff" stroke="#e4e7ec"/>${bar(40, 34, 140, "#c4cad3")}` +
        [0, 1, 2, 3, 4].map((i) => `<circle cx="46" cy="${62 + i * 24}" r="5" fill="none" stroke="#b6bdc8" stroke-width="1.5"/>${bar(60, 58 + i * 24, 150 - i * 12)}`).join(""),
    ),
  },
  {
    alt: "A line chart of samples logged this quarter",
    src: svgUri(
      `<rect x="24" y="18" width="272" height="164" rx="10" fill="#fff" stroke="#e4e7ec"/>${bar(40, 34, 70, "#c4cad3")}<text x="40" y="68" font-family="sans-serif" font-size="18" font-weight="600" fill="#30343b">4,812</text>` +
        `<path d="M40 150 C80 130 100 140 130 118 S190 100 220 110 260 86 280 80" fill="none" stroke="#6b8cdd" stroke-width="2.5"/><path d="M40 160 C90 150 120 156 160 146 S230 140 280 128" fill="none" stroke="#e5a65a" stroke-width="2"/>`,
    ),
  },
  {
    alt: "A chat panel answering a question about a report",
    src: svgUri(
      `<rect x="24" y="18" width="272" height="164" rx="10" fill="#fff" stroke="#e4e7ec"/><rect x="150" y="34" width="130" height="26" rx="13" fill="#eef1f5"/>${bar(162, 44, 90)}` +
        `${bar(40, 78, 200)}${bar(40, 92, 170)}${bar(40, 106, 186)}<rect x="40" y="140" width="240" height="28" rx="8" fill="#fff" stroke="#d3d8df"/>${bar(52, 151, 80)}`,
    ),
  },
];

const ITEMS = [
  "Agent Cursors", "Agent Findings", "Agent Graph", "Agent Handoff", "Agent Inbox", "Answer Card", "Approval Card", "Bibliography", "Breadcrumbs",
  "Change List", "Citation Chip", "Comment Thread", "Coverage Ring", "Data Table", "Digest", "Email Draft", "Eval Scorecard", "Fact Sheet",
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CollectionCard } = ui;
  const [note, setNote] = useState("Press anywhere on the card – or select some of its words, which doesn't open it.");
  return (
    <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 8 }}>
      <CollectionCard
        title="Components"
        count={273}
        files={273}
        subtitle="Interactive building blocks for research tools"
        description="Self-contained pieces – agent views, answer panels, charts, inputs and feedback. Each one ships in a Standard and a Clean style with the same props. Start here when you need a single control or widget."
        items={ITEMS}
        previews={PREVIEWS}
        onTcOpen={() => setNote("Opened: Components")}
      />
      <div style={{ ...caption, textAlign: "center" }} role="status">{note}</div>
    </div>
  );
}

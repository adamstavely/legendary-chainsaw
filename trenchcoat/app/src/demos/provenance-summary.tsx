import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ProvenanceSection } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A market brief while it's being drafted. Each beat a section grows – a paragraph pulled from sources, a passage
   the AI synthesised, a paragraph the author wrote – until the draft is done; then nothing ticks. Point at or tab to
   a segment to light that kind everywhere; press it to "open" its lineage. */

type Step = { id: string; title: string; add: [number, number, number] };

const STEPS: Step[] = [
  { id: "summary", title: "Executive summary", add: [40, 180, 120] },
  { id: "market", title: "Market size and growth", add: [420, 160, 60] },
  { id: "competitors", title: "Competitor landscape", add: [380, 290, 40] },
  { id: "pricing", title: "Pricing pressure", add: [210, 240, 90] },
  { id: "risks", title: "Risks and open questions", add: [60, 110, 260] },
  { id: "market", title: "Market size and growth", add: [120, 40, 80] },
  { id: "summary", title: "Executive summary", add: [0, 60, 140] },
];
const START_AT = 3;

function build(n: number): ProvenanceSection[] {
  const out: ProvenanceSection[] = [];
  for (const s of STEPS.slice(0, n)) {
    const at = out.find((x) => x.id === s.id);
    if (at) {
      at.sourced += s.add[0];
      at.synthesis += s.add[1];
      at.original += s.add[2];
    } else out.push({ id: s.id, title: s.title, sourced: s.add[0], synthesis: s.add[1], original: s.add[2] });
  }
  return out;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ProvenanceSummary } = ui;
  const [n, setN] = useState(START_AT);
  const [log, setLog] = useState("");

  useEffect(() => {
    if (n >= STEPS.length) return;
    const t = setTimeout(() => setN((x) => x + 1), 1500);
    return () => clearTimeout(t);
  }, [n]);

  const sections = build(n);
  const words = sections.reduce((sum, s) => sum + s.sourced + s.synthesis + s.original, 0);

  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 10 }}>
      <ProvenanceSummary
        title="What this brief is made of"
        scope={`EV charging market brief · draft · ${words.toLocaleString("en-US")} words`}
        sections={sections}
        onOpenLineage={(section, kind, d) =>
          setLog(`Would open the lineage of ${Math.round(d.share * 100)}% ${kind} in ${section ? sections.find((s) => s.id === section)?.title : "the whole brief"}.`)
        }
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || (n < STEPS.length ? "The draft grows section by section" : "Draft complete – press a segment")}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setN(START_AT);
            setLog("");
          }}
        >
          Replay
        </button>
      </p>
    </div>
  );
}

import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { LineageEdge, LineageNode, LineageView } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The lineage of a vendor risk memo: one run, two turns, the searches and tools they called, the chunks that came
   back, the claims made from them and the two documents that carry those claims. It builds up step by step as the
   run happened, then opens the claim whose evidence was cut short – its link from the incident log is dashed,
   because only 4 of 11 rows fit the context. Point at any step to light up where it came from and what it feeds. */

const NODES: LineageNode[] = [
  { id: "run", column: "run", label: "Vendor risk review", detail: "Analyst agent · 41s", at: 0, fields: [{ label: "Model", value: "General 4.1" }, { label: "Instruction", value: "a91f…c07e" }, { label: "Started by", value: "Dana Okafor" }] },
  { id: "t1", column: "turn", label: "Summarise Acme's SLA record", detail: "Turn 1 · 3 tool calls", at: 1200, text: "Summarise Acme Cloud's SLA performance over the last four quarters and anything we can use at renewal." },
  { id: "t2", column: "turn", label: "What leverage do we have?", detail: "Turn 2 · 1 tool call", at: 24_000, text: "Given that, where do we have leverage in the renewal?" },
  { id: "q1", column: "query", label: "search: Acme SLA uptime 2025", detail: "Retrieval · 6 results", at: 2400, fields: [{ label: "Index", value: "Vendor contracts" }, { label: "Top score", value: "0.84" }] },
  { id: "q2", column: "query", label: "fetch_contract(acme-cloud)", detail: "Tool · 212ms", at: 3100 },
  { id: "q3", column: "query", label: "sql: incidents by vendor", detail: "Tool · 11 rows", at: 4000, fields: [{ label: "Rows returned", value: "11" }, { label: "Rows in context", value: "4" }] },
  { id: "q4", column: "query", label: "search: renewal clauses", detail: "Retrieval · 4 results", at: 25_200 },
  { id: "c1", column: "chunk", label: "Master agreement §7.2", detail: "acme-msa.pdf · p. 14", at: 2600, text: "Service credits shall not exceed ten percent (10%) of the monthly fees for the affected service.", fields: [{ label: "Score", value: "0.84" }, { label: "Freshness", value: "Signed Mar 2024" }] },
  { id: "c2", column: "chunk", label: "SLA report, Q2", detail: "sla-q2-2025.pdf · p. 4", at: 2700, text: "Measured availability for the quarter: 99.72% against a 99.9% commitment.", fields: [{ label: "Score", value: "0.79" }] },
  { id: "c3", column: "chunk", label: "Incident log", detail: "incidents · rows 1–4 of 11", at: 4100, text: "2025-04-18 · Region outage · 3h 12m\n2025-05-02 · API errors · 47m\n2025-07-09 · Storage latency · 1h 05m\n2025-08-21 · Region outage · 2h 40m" },
  { id: "c4", column: "chunk", label: "Renewal terms §12", detail: "acme-msa.pdf · p. 22", at: 25_400, text: "Either party may propose amended terms no later than 60 days before the renewal date." },
  { id: "k1", column: "claim", label: "Uptime missed the SLA twice", detail: "Sourced · 0.86", at: 8200, tone: "green", text: "Acme Cloud fell below its 99.9% availability commitment in two of the last four quarters." },
  { id: "k2", column: "claim", label: "Credits are capped at 10%", detail: "Sourced · 0.93", at: 8900, tone: "green", text: "Service credits are capped at 10% of monthly fees, so the misses cost Acme little." },
  { id: "k3", column: "claim", label: "Outages are getting longer", detail: "Inferred · 0.58", at: 9600, tone: "amber", text: "Outage duration has been trending up through 2025.", fields: [{ label: "Support", value: "Incident log (partial)" }, { label: "Confidence", value: "0.58" }] },
  { id: "k4", column: "claim", label: "60-day window to renegotiate", detail: "Sourced · 0.91", at: 31_000, tone: "green" },
  { id: "a1", column: "artifact", label: "Risk memo §2", detail: "Draft · edited 2 min ago", at: 38_000 },
  { id: "a2", column: "artifact", label: "Board summary, slide 3", detail: "Shared with Finance", at: 40_500 },
];

const EDGES: LineageEdge[] = [
  { from: "run", to: "t1" },
  { from: "run", to: "t2" },
  { from: "t1", to: "q1" },
  { from: "t1", to: "q2" },
  { from: "t1", to: "q3" },
  { from: "t2", to: "q4" },
  { from: "q1", to: "c2" },
  { from: "q2", to: "c1" },
  { from: "q3", to: "c3" },
  { from: "q4", to: "c4" },
  { from: "c2", to: "k1" },
  { from: "c3", to: "k1", weak: true, note: "4 of 11 rows fit the context" },
  { from: "c1", to: "k2" },
  { from: "c3", to: "k3", weak: true, note: "4 of 11 rows fit the context" },
  { from: "c4", to: "k4" },
  { from: "k1", to: "a1" },
  { from: "k2", to: "a1" },
  { from: "k3", to: "a1" },
  { from: "k4", to: "a2" },
  { from: "k1", to: "a2" },
];

const ORDER = [...NODES].sort((a, b) => (a.at ?? 0) - (b.at ?? 0)).map((n) => n.id);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { LineageGraph } = ui;
  const [shown, setShown] = useState(4);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<LineageView>("graph");
  const [last, setLast] = useState("");

  // The run's steps arrive in the order they happened; once they're all in, the shaky claim opens. Then it stops.
  useEffect(() => {
    if (shown >= ORDER.length) return;
    const t = setTimeout(() => {
      setShown((n) => n + 2);
      if (shown + 2 >= ORDER.length) setSelected("k3");
    }, 260);
    return () => clearTimeout(t);
  }, [shown]);

  const ids = new Set(ORDER.slice(0, shown));
  const nodes = NODES.filter((n) => ids.has(n.id));
  const edges = EDGES.filter((e) => ids.has(e.from) && ids.has(e.to));

  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 10 }}>
      <LineageGraph
        title="Vendor risk memo"
        nodes={nodes}
        edges={edges}
        selected={selected}
        onSelectedChange={(id, node) => {
          setSelected(id);
          setLast(node ? `Opened: ${node.label}` : "Record closed");
        }}
        view={view}
        onViewChange={setView}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {last || "Arrow keys follow the links · Enter opens a step's record"}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setShown(4);
            setSelected(null);
            setLast("");
          }}
        >
          Replay
        </button>
      </p>
    </div>
  );
}

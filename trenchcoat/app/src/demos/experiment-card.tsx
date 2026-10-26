import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ExperimentMetric, ExperimentVariant } from "../../../src/elements/react";

const METRICS: ExperimentMetric[] = [
  { id: "conversion", label: "Conversion", format: (n) => `${n.toFixed(2)}%` },
  { id: "revenue", label: "Revenue / visitor", format: (n) => `$${n.toFixed(2)}` },
  { id: "bounce", label: "Bounce rate", format: (n) => `${n.toFixed(1)}%`, lowerIsBetter: true },
];

const VARIANTS: ExperimentVariant[] = [
  {
    id: "control",
    key: "A",
    name: "Current checkout",
    control: true,
    visitors: 12480,
    values: { conversion: 3.12, revenue: 4.86, bounce: 41.2 },
  },
  {
    id: "one-page",
    key: "B",
    name: "One-page checkout",
    visitors: 12391,
    values: { conversion: 3.71, revenue: 5.42, bounce: 36.8 },
    confidence: { conversion: 97.4, revenue: 93.1, bounce: 95.6 },
  },
  {
    id: "express",
    key: "C",
    name: "Express pay first",
    visitors: 12517,
    values: { conversion: 3.38, revenue: 5.61, bounce: 39.9 },
    confidence: { conversion: 78.2, revenue: 96.3, bounce: 61.0 },
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ExperimentCard } = ui;
  const [metric, setMetric] = useState("conversion");
  const [winner, setWinner] = useState<string | null>(null);
  const [shipped, setShipped] = useState<string | null>(null);

  return (
    <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: 10 }}>
      <ExperimentCard
        title="Checkout redesign"
        variants={VARIANTS}
        metrics={METRICS}
        metric={metric}
        onMetricChange={setMetric}
        winner={winner}
        onWinnerChange={(id) => {
          setWinner(id);
          setShipped(null);
        }}
        status={shipped ? { label: "Concluded", tone: "blue" } : { label: "Running", tone: "green" }}
        note={shipped ? "Shipped today" : "Day 9 of 14"}
        action={{
          label: (v) => `Ship ${v.name}`,
          onClick: (v) => setShipped(v.name),
        }}
        defaultOpen
      />
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center", minHeight: 16 }}>
        {shipped ? `Rolled out "${shipped}" to 100% of traffic.` : "Hover the card, switch metrics, click a variant to pick a winner."}
      </div>
    </div>
  );
}

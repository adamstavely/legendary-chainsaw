import type { ReactNode } from "react";
import type * as UI from "@components/thinking-state";
import type { ThinkingSource, ThinkingStep } from "@components/thinking-state";

/** A tiny favicon: a colored rounded square with a letter */
const Fav = ({ letter, color }: { letter: string; color: string }): ReactNode => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <rect width="16" height="16" rx="4" fill={color} />
    <text x="8" y="11.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">
      {letter}
    </text>
  </svg>
);

const src = (label: string, letter: string, color: string, href: string): ThinkingSource => ({
  label,
  icon: <Fav letter={letter} color={color} />,
  href,
});

const steps: ThinkingStep[] = [
  { kind: "step", label: "Understanding the question" },
  {
    kind: "search",
    label: "Searched “heat pump vs gas furnace running cost”",
    activeLabel: "Searching “heat pump vs gas furnace running cost”",
    sources: [
      src("energy.gov", "E", "#2f6bff", "https://www.energy.gov"),
      src("iea.org", "I", "#0f9d58", "https://www.iea.org"),
      src("consumerreports.org", "C", "#d93025", "https://www.consumerreports.org"),
    ],
    moreSources: [
      src("nrel.gov", "N", "#7c4dff", "https://www.nrel.gov"),
      src("wikipedia.org", "W", "#555", "https://en.wikipedia.org/wiki/Heat_pump"),
    ],
  },
  {
    kind: "search",
    label: "Searched “electricity price per kWh 2026”",
    activeLabel: "Searching “electricity price per kWh 2026”",
    sources: [src("eia.gov", "E", "#e37400", "https://www.eia.gov"), src("statista.com", "S", "#1a73e8", "https://www.statista.com")],
  },
  { kind: "step", label: "Comparing yearly costs for a 1,800 sq ft home" },
  { kind: "step", label: "Checking available tax credits" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ThinkingState } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 440 }}>
      <ThinkingState steps={steps} stepMs={1300} doneLabel="Ready to answer" loop />
    </div>
  );
}

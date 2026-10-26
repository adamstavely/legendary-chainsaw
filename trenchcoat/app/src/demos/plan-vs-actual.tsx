import { useEffect, useState } from "react";
import type * as UI from "@components/plan-vs-actual-clean";
import type { PlanStep } from "@components/plan-vs-actual-clean";

const S = 1000;

type Spec = { id: string; title: string; plan: number; real: number; deps?: string[]; planCost: number; costPerSec: number };

const SPECS: Spec[] = [
  { id: "brief", title: "Read the brief", plan: 6 * S, real: 5 * S, planCost: 0.02, costPerSec: 0.004 },
  { id: "copy", title: "Draft the copy", plan: 14 * S, real: 19 * S, deps: ["brief"], planCost: 0.12, costPerSec: 0.009 },
  { id: "layout", title: "Build the layout", plan: 18 * S, real: 16 * S, deps: ["brief"], planCost: 0.18, costPerSec: 0.011 },
  { id: "pricing", title: "Wire up the pricing table", plan: 10 * S, real: 14 * S, deps: ["layout"], planCost: 0.09, costPerSec: 0.008 },
  { id: "review", title: "Review copy + layout", plan: 8 * S, real: 9 * S, deps: ["copy", "pricing"], planCost: 0.05, costPerSec: 0.006 },
  { id: "tests", title: "Run visual tests", plan: 7 * S, real: 6 * S, deps: ["review"], planCost: 0.03, costPerSec: 0.005 },
  { id: "ship", title: "Open the pull request", plan: 3 * S, real: 3 * S, deps: ["tests"], planCost: 0.01, costPerSec: 0.003 },
];

/** Real start/end of every step, if each starts once all it waits for has finished */
const REAL: Record<string, { start: number; end: number }> = {};
for (const s of SPECS) {
  const start = Math.max(0, ...(s.deps ?? []).map((d) => REAL[d].end));
  REAL[s.id] = { start, end: start + s.real };
}
const FINISH = Math.max(...Object.values(REAL).map((r) => r.end));
const HOLD = 6 * S;

function stepsAt(now: number): PlanStep[] {
  return SPECS.map((s) => {
    const r = REAL[s.id];
    const started = now >= r.start;
    const ended = now >= r.end;
    const ran = started ? Math.min(now, r.end) - r.start : 0;
    return {
      id: s.id,
      title: s.title,
      plan: s.plan,
      deps: s.deps,
      planCost: s.planCost,
      start: started ? r.start : undefined,
      end: ended ? r.end : undefined,
      cost: started ? +((ran / S) * s.costPerSec).toFixed(3) : undefined,
    };
  });
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PlanVsActual } = ui;
  const [now, setNow] = useState(0);
  useEffect(() => {
    // 4× speed: 100ms real = 400ms of run time
    const id = window.setInterval(() => setNow((n) => (n >= FINISH + HOLD ? 0 : n + 400)), 100);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <PlanVsActual steps={stepsAt(Math.min(now, FINISH))} elapsed={Math.min(now, FINISH)} task="Ship the pricing page" />
    </div>
  );
}

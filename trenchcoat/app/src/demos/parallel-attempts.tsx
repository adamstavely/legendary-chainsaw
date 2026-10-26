import { useEffect, useState, type ReactNode } from "react";
import type * as UI from "../../../src/elements/react";
import type { Attempt } from "../../../src/elements/react";

const Star = ({ c }: { c: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1.5l1.7 4.8 4.8 1.7-4.8 1.7L8 14.5l-1.7-4.8L1.5 8l4.8-1.7z" fill={c} />
  </svg>
);
const Hex = ({ c }: { c: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1l6 3.5v7L8 15l-6-3.5v-7z" fill={c} />
  </svg>
);

type Plan = {
  id: string;
  name: string;
  approach: string;
  model: string;
  icon: ReactNode;
  /** ms to finish */
  dur: number;
  steps: string[];
  /** fails at this fraction, if set */
  failAt?: number;
  score?: number;
  note: string;
  cost: number;
};

const PLANS: Plan[] = [
  {
    id: "a",
    name: "Attempt A",
    approach: "Mock the payment API",
    model: "Claude Sonnet",
    icon: <Star c="#d97757" />,
    dur: 7000,
    steps: ["Reading checkout.spec.ts", "Writing Stripe mock", "Running tests 8/20", "Running tests 20/20"],
    score: 92,
    note: "20/20 runs green",
    cost: 0.31,
  },
  {
    id: "b",
    name: "Attempt B",
    approach: "Add explicit waits",
    model: "Claude Haiku",
    icon: <Star c="#e8a27e" />,
    dur: 4800,
    steps: ["Finding race conditions", "Adding waitFor()", "Running tests 14/20", "Running tests 20/20"],
    score: 71,
    note: "17/20 runs green · 1.4s slower",
    cost: 0.06,
  },
  {
    id: "c",
    name: "Attempt C",
    approach: "Retry flaky steps",
    model: "Open model",
    icon: <Hex c="#6366f1" />,
    dur: 8000,
    steps: ["Patching test runner", "Adding retry wrapper", "Running tests 3/20"],
    failAt: 0.55,
    note: "Type error in retry wrapper (line 42)",
    cost: 0.04,
  },
  {
    id: "d",
    name: "Attempt D",
    approach: "Seed the test database",
    model: "Claude Opus",
    icon: <Star c="#b45309" />,
    dur: 9500,
    steps: ["Inspecting fixtures", "Writing seed script", "Resetting DB per test", "Running tests 20/20"],
    score: 86,
    note: "20/20 runs green · adds 6s setup",
    cost: 0.88,
  },
];

const HOLD = 7000;
const TICK = 500;

function attemptsAt(t: number): Attempt[] {
  return PLANS.map((p) => {
    const end = p.failAt !== undefined ? p.dur * p.failAt : p.dur;
    const base = { id: p.id, name: p.name, approach: p.approach, model: p.model, icon: p.icon };
    if (t < end) {
      const progress = t / p.dur;
      return { ...base, status: "running", progress, step: p.steps[Math.min(p.steps.length - 1, Math.floor((t / end) * p.steps.length))] };
    }
    if (p.failAt !== undefined) {
      return { ...base, status: "failed", progress: p.failAt, note: p.note, took: end, cost: p.cost };
    }
    return { ...base, status: "done", progress: 1, score: p.score, note: p.note, took: p.dur, cost: p.cost };
  });
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ParallelAttempts } = ui;
  const [{ t, round }, setClock] = useState({ t: 0, round: 0 });
  const [chosen, setChosen] = useState<string | null>(null);
  const last = Math.max(...PLANS.map((p) => p.dur));

  // The attempts report their progress twice a second (the bars glide between reports); once all are through
  // the clock waits out the hold in one step instead of ticking, and it stands still while the tab is hidden
  useEffect(() => {
    let at = 0;
    let id = 0;
    const schedule = () => {
      id = window.setTimeout(() => {
        if (document.visibilityState !== "hidden") {
          if (at >= last) {
            at = 0;
            setClock((c) => ({ t: 0, round: c.round + 1 }));
          } else {
            at = Math.min(last, at + TICK);
            setClock((c) => ({ ...c, t: at }));
          }
        }
        schedule();
      }, at >= last ? HOLD : TICK);
    };
    schedule();
    return () => window.clearTimeout(id);
  }, [last]);
  useEffect(() => setChosen(null), [round]);

  return (
    <div style={{ width: "100%", maxWidth: 600, display: "grid", gap: 8 }}>
      <ParallelAttempts
        key={round}
        attempts={attemptsAt(t)}
        task="Fix the flaky checkout test"
        title="Parallel attempts"
        onPick={(a, { auto }) => !auto && setChosen(a.name)}
      />
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center", minHeight: 16 }}>
        {chosen ? `You picked ${chosen}.` : t >= last ? "Point at a finished row to pick another." : ""}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TreeAgent } from "../../../src/elements/react";

/* A run that grows: the orchestrator hands out work, sub-agents start their own helpers, one fails, one stops to
   ask you, branches finish and costs roll up. Answer from the "needs you" / "failed" windows to move it along.
   A new run starts ~8s after everything is done. */

const Tile = ({ bg, letter }: { bg: string; letter: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <rect width="16" height="16" rx="4" fill={bg} />
    <text x="8" y="11.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">
      {letter}
    </text>
  </svg>
);
const GH = <Tile bg="#24292f" letter="G" />;
const STRIPE = <Tile bg="#635bff" letter="S" />;
const SQL = <Tile bg="#0ea5e9" letter="Q" />;
const WEB = <Tile bg="#10b981" letter="W" />;
const SLACK = <Tile bg="#4a154b" letter="#" />;

type Phase = { id: string; parent: string | null; at: number; dur: number; agent: Omit<TreeAgent, "id" | "status" | "children" | "started" | "ended"> & { outcome?: "waiting" | "failed" }; rate: number };

// `at` and `dur` in seconds after the run started
const PLAN: Phase[] = [
  { id: "root", parent: null, at: 0, dur: 40, rate: 0.004, agent: { name: "Orchestrator", model: "Opus 5.5", task: "Ship annual billing for the Team plan", tools: [GH, STRIPE] } },
  { id: "spec", parent: "root", at: 1.5, dur: 6, rate: 0.006, agent: { name: "Spec writer", model: "Sonnet 5", task: "Write the spec and edge cases" } },
  { id: "api", parent: "root", at: 3, dur: 22, rate: 0.009, agent: { name: "Backend", model: "Sonnet 5", task: "Add annual prices and proration", tools: [GH, STRIPE] } },
  { id: "ui", parent: "root", at: 4.5, dur: 18, rate: 0.007, agent: { name: "Frontend", model: "Sonnet 5", task: "Monthly / annual toggle on checkout", tools: [GH] } },
  { id: "prices", parent: "api", at: 6, dur: 7, rate: 0.004, agent: { name: "Stripe setup", model: "Haiku 5", task: "Create annual prices in Stripe", tools: [STRIPE], outcome: "waiting", ask: "Create 3 live prices in Stripe ($288, $576, $1,152 / year)?" } },
  { id: "migr", parent: "api", at: 7.5, dur: 8, rate: 0.005, agent: { name: "Migrations", model: "Haiku 5", task: "Add billing_interval column", tools: [SQL] } },
  { id: "copy", parent: "ui", at: 8, dur: 6, rate: 0.003, agent: { name: "Copy", model: "Haiku 5", task: "Pricing page copy and FAQ", tools: [WEB], outcome: "failed", error: "Couldn't fetch the brand voice guide (403)" } },
  { id: "tests", parent: "ui", at: 11, dur: 9, rate: 0.006, agent: { name: "E2E tests", model: "Sonnet 5", task: "Checkout tests for both intervals", tools: [GH] } },
  { id: "notify", parent: "root", at: 30, dur: 5, rate: 0.002, agent: { name: "Announcer", model: "Haiku 5", task: "Post the release note", tools: [SLACK] } },
];

type Answers = Record<string, { action: "approve" | "reject" | "retry" | "dismiss"; at: number }>;

function build(t0: number, now: number, answers: Answers): TreeAgent {
  // Never before the start: a clock read a moment earlier than t0 would leave the tree without a root
  const s = Math.max(0, (now - t0) / 1000);
  const make = (p: Phase): TreeAgent | null => {
    if (s < p.at) return null;
    const started = t0 + p.at * 1000;
    const endT = t0 + (p.at + p.dur) * 1000;
    const { outcome, ...rest } = p.agent;
    let status: TreeAgent["status"] = now < endT ? "running" : "done";
    let ended: number | undefined = now < endT ? undefined : endT;
    const a = answers[p.id];
    if (outcome && now >= endT) {
      if (!a) {
        status = outcome;
        ended = outcome === "failed" ? endT : undefined;
      } else if (a.action === "approve") {
        status = now - a.at < 2500 ? "running" : "done";
        ended = status === "done" ? a.at + 2500 : undefined;
      } else if (a.action === "retry") {
        status = now - a.at < 4000 ? "running" : "done";
        ended = status === "done" ? a.at + 4000 : undefined;
      } else {
        status = "stopped";
        ended = a.at;
      }
    }
    const runFor = ((ended ?? now) - started) / 1000;
    const children = PLAN.filter((c) => c.parent === p.id)
      .map(make)
      .filter((c): c is TreeAgent => !!c);
    // A parent keeps running while any child does
    if (status === "done" && children.some((c) => c.status === "running" || c.status === "waiting" || c.status === "failed")) {
      status = "running";
      ended = undefined;
    }
    return { id: p.id, ...rest, status, started, ended, cost: Math.round(runFor * p.rate * 1000) / 1000 + 0.01, children };
  };
  return make(PLAN[0])!;
}

const allSettled = (a: TreeAgent): boolean => (a.status === "done" || a.status === "stopped") && (a.children ?? []).every(allSettled);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentTree } = ui;
  const [t0, setT0] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [answers, setAnswers] = useState<Answers>({});
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const settledAt = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const root = build(t0, now, answers);

  // Auto-answers after a while, so the run finishes even if nobody clicks; then a new run starts
  useEffect(() => {
    const s = (now - t0) / 1000;
    if (s > 26 && !answers.prices) setAnswers((a) => ({ ...a, prices: { action: "approve", at: Date.now() } }));
    if (s > 28 && !answers.copy) setAnswers((a) => ({ ...a, copy: { action: "retry", at: Date.now() } }));
    if (allSettled(root)) {
      if (settledAt.current === null) settledAt.current = now;
      else if (now - settledAt.current > 8000) {
        settledAt.current = null;
        setAnswers({});
        setCollapsed([]);
        setT0(Date.now());
      }
    }
  }, [now, t0, answers, root]);

  return (
    <div style={{ width: "100%", maxWidth: 860 }}>
      <AgentTree
        title="Annual billing run"
        root={root}
        now={now}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        onResolve={(agent, action) => setAnswers((a) => ({ ...a, [agent.id]: { action, at: Date.now() } }))}
      />
    </div>
  );
}

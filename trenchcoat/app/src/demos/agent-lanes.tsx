import { useEffect, useMemo, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { LaneTask } from "../../../src/elements/react";

/* A fast clock (1 real second = 20 demo seconds) drives the lanes, so you can watch tasks grow into "now",
   finish, hand off to the next agent and stop for an approval. The script loops every ~2.5 real minutes. */

const MIN = 60_000;
const SPEED = 20;

const Dot = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <rect x="1" y="1" width="10" height="10" rx="3" fill={color} />
  </svg>
);
const GH = <Dot color="#24292f" />;
const LIN = <Dot color="#5e6ad2" />;
const SLK = <Dot color="#e01e5a" />;
const FIG = <Dot color="#a259ff" />;

const agents = [
  { id: "plan", name: "Planner", model: "Opus 5.5" },
  { id: "code", name: "Coder", model: "Sonnet 5" },
  { id: "rev", name: "Reviewer", model: "Sonnet 5" },
  { id: "ops", name: "Release", model: "Haiku 5" },
];

/** The world at demo-time `m` minutes after `t0`: tasks with their state at that moment */
function world(t0: number, m: number, decisions: Record<string, { d: "approved" | "rejected"; at: number }>): LaneTask[] {
  const at = (min: number) => t0 + min * MIN;
  const span = (id: string, s: number, e: number, rest: Omit<LaneTask, "id" | "start" | "end" | "status">, failAt?: boolean): LaneTask | null => {
    if (m < s) return null;
    const running = m < e;
    return { id, start: at(s), end: running ? undefined : at(e), status: running ? "running" : failAt ? "failed" : "done", ...rest };
  };
  const out: (LaneTask | null)[] = [
    // History that is already there when the demo starts
    { id: "p0", agentId: "plan", title: "Triage new issues", status: "done", start: at(-26), end: at(-19), tools: [LIN], summary: ["Labelled 14 issues", "Closed 3 duplicates"], handoffTo: "c0" },
    { id: "c0", agentId: "code", title: "Fix date picker overflow", status: "done", start: at(-18), end: at(-8), tools: [GH], summary: ["Patched popover.tsx", "Added a test"], handoffTo: "r0" },
    { id: "r0", agentId: "rev", title: "Review PR #412", status: "done", start: at(-7), end: at(-3), tools: [GH], summary: ["2 nits, approved"] },
    { id: "o0", agentId: "ops", title: "Nightly build", status: "failed", start: at(-22), end: at(-14), summary: ["Flaky e2e: checkout.spec", "Retry scheduled"] },
    // The live script
    span("p1", -4, 6, { agentId: "plan", title: "Plan dark-mode tokens", tools: [LIN, FIG], summary: ["Read 6 Figma frames", "Wrote 4 sub-tasks"], handoffTo: "c1" }),
    span("c1", 7, 22, { agentId: "code", title: "Implement theme tokens", tools: [GH, FIG], summary: ["Added 48 tokens", "Migrated 12 components"], handoffTo: "r1" }),
    span("r1", 23, 30, { agentId: "rev", title: "Review PR #418", tools: [GH], summary: ["Checked contrast ratios", "1 change requested"] }),
    span("o1", 2, 9, { agentId: "ops", title: "Re-run nightly build", tools: [GH], summary: ["All 312 tests green"] }),
    span("p2", 12, 21, { agentId: "plan", title: "Draft release notes", tools: [LIN], summary: ["Collected 9 changes"], handoffTo: "o2" }),
  ];
  // The release step waits for you until you decide
  if (m >= 31) {
    const d = decisions.o2?.d;
    out.push({
      id: "o2",
      agentId: "ops",
      title: "Ship v3.8 to production",
      start: at(31),
      end: d ? Math.max(at(31) + 30_000, decisions.o2.at) : undefined,
      status: d === "approved" ? "done" : d === "rejected" ? "failed" : "waiting",
      tools: [GH, SLK],
      ask: "Deploy v3.8 to production and post the release notes in #releases?",
      summary: d === "approved" ? ["Deployed to 3 regions", "Posted to #releases"] : d === "rejected" ? ["Stopped by you"] : undefined,
    });
  }
  return out.filter((t): t is LaneTask => !!t);
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentLanes } = ui;
  // The demo clock starts at t0 and runs SPEED× real time – the lanes run it on by themselves (`now` + `rate`), so
  // the demo only renders when its script changes: once a demo minute, and on a decision
  const clock = useRef({ t0: Date.now(), base: Date.now() });
  const [t0, setT0] = useState(() => clock.current.t0);
  const [minute, setMinute] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, { d: "approved" | "rejected"; at: number }>>({});
  const demoNow = () => clock.current.t0 + (Date.now() - clock.current.base) * SPEED;

  useEffect(() => {
    const id = setInterval(() => {
      const m = (demoNow() - clock.current.t0) / MIN;
      // Loop: after 48 demo minutes, start over
      if (m > 48) {
        const t = Date.now();
        clock.current = { t0: t, base: t };
        setT0(t);
        setDecisions({});
        setMinute(0);
        return;
      }
      setMinute(Math.floor(m));
    }, 100);
    return () => clearInterval(id);
  }, []);

  const tasks = useMemo(() => world(t0, minute, decisions), [t0, minute, decisions]);

  return (
    <div style={{ width: "100%", maxWidth: 820 }}>
      <AgentLanes
        title="Release crew"
        agents={agents}
        tasks={tasks}
        now={t0}
        rate={SPEED}
        onApprove={(t) => setDecisions((d) => ({ ...d, [t.id]: { d: "approved", at: demoNow() } }))}
        onReject={(t) => setDecisions((d) => ({ ...d, [t.id]: { d: "rejected", at: demoNow() } }))}
        onOpen={() => {}}
      />
    </div>
  );
}

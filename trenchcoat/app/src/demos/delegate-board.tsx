import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { DelegateAgent, DelegateTask } from "../../../src/elements/react";

const Logo = ({ bg, children }: { bg: string; children: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <rect width="16" height="16" rx="4" fill={bg} />
    <text x="8" y="11.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">{children}</text>
  </svg>
);
const GH = <Logo bg="#24292f">G</Logo>;
const SL = <Logo bg="#4a154b">S</Logo>;
const LN = <Logo bg="#5e6ad2">L</Logo>;
const FG = <Logo bg="#a259ff">F</Logo>;
const NT = <Logo bg="#111">N</Logo>;

const Star = ({ c }: { c: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1.5l1.7 4.8 4.8 1.7-4.8 1.7L8 14.5l-1.7-4.8L1.5 8l4.8-1.7z" fill={c} />
  </svg>
);

const AGENTS: DelegateAgent[] = [
  { id: "a1", name: "Research", model: "Claude Opus", avatar: <Star c="#d97757" />, current: 18, rate: 0.08 },
  { id: "a2", name: "Code Review", model: "Claude Sonnet", avatar: <Star c="#c2410c" />, current: 6, rate: 0.04 },
  { id: "a3", name: "Support Triage", model: "Claude Haiku", rate: 0.01 },
];

const TASKS: DelegateTask[] = [
  { id: "t1", title: "Summarize churn interviews", estimate: 22, tools: [NT, SL], agentId: "a1" },
  { id: "t2", title: "Review PR #482 – auth refactor", estimate: 9, tools: [GH], agentId: "a2" },
  { id: "t3", title: "Check flaky e2e tests", estimate: 14, tools: [GH], agentId: "a2" },
  { id: "t4", title: "Draft release notes for 3.2", estimate: 12, tools: [GH, NT] },
  { id: "t5", title: "Tag 40 new support tickets", estimate: 8, tools: [LN, SL] },
  { id: "t6", title: "Audit onboarding screens", estimate: 25, tools: [FG] },
  { id: "t7", title: "Compare 3 vector DB vendors", estimate: 35, tools: [NT] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DelegateBoard } = ui;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div style={{ width: "100%", maxWidth: 820 }}>
      <DelegateBoard
        agents={AGENTS}
        tasks={TASKS}
        now={now}
        defaultMode="manual"
        suggestion={{ taskId: "t5", agentId: "a3" }}
        title="Delegate"
      />
    </div>
  );
}

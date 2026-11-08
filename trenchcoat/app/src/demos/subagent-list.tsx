import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { Subagent } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The sub-agents a review session at a fictional research institute has started: one waiting on a command, one
   running, and the ones that finished, failed or were stopped earlier. Times are fixed against a pinned `now` that the
   demo moves on a second at a time, so the thumbnail is stable and the clocks still tick. "Finish the next one" moves
   the oldest active agent to Done, which the list announces. */

const NOW = Date.UTC(2026, 10, 8, 15, 0, 0);
const S = 1000;
const M = 60 * S;
const H = 60 * M;

const START: Subagent[] = [
  { id: "a11y-current", name: "Review a11y current", status: "waiting", activity: "awaiting command message", startedAt: NOW - 86 * S },
  { id: "citations", name: "Check citations in chapter 3", status: "running", activity: "reading 14 of 40 sources", startedAt: NOW - 4 * M - 12 * S },
  { id: "data-security", name: "Review data security current", status: "done", endedAt: NOW - 20 * S },
  { id: "forms-current", name: "Review forms current", status: "done", endedAt: NOW - 35 * S },
  { id: "fresh-a11y", name: "Fresh accessibility", status: "done", endedAt: NOW - 62 * M },
  { id: "forms-papers", name: "Fresh forms papers", status: "failed", activity: "the archive didn't answer", endedAt: NOW - 70 * M },
  { id: "security-platform", name: "Fresh security platform", status: "done", endedAt: NOW - 75 * M },
  { id: "bugbot", name: "Bugbot", status: "stopped", activity: "stopped by you", endedAt: NOW - 12 * H },
  { id: "security-review", name: "Security review", status: "done", endedAt: NOW - 12 * H - 20 * M },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SubagentList } = ui;
  const [agents, setAgents] = useState(START);
  const [now, setNow] = useState(NOW);
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    const t = setInterval(() => setNow((n) => n + S), S);
    return () => clearInterval(t);
  }, []);
  const active = agents.filter((a) => a.status === "running" || a.status === "waiting");

  return (
    <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: 10 }}>
      <SubagentList agents={agents} now={now} selected={picked} onSelectedChange={(id) => setPicked(id)} />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {picked ? `Showing ${agents.find((a) => a.id === picked)?.name}` : "Choose a subagent to open it"}{" "}
        {active.length ? (
          <button
            type="button"
            style={textButton}
            onClick={() => {
              const last = active[active.length - 1];
              setAgents((list) => [{ ...last, status: "done", activity: undefined, endedAt: now }, ...list.filter((a) => a.id !== last.id)]);
            }}
          >
            Finish the next one
          </button>
        ) : (
          <button
            type="button"
            style={textButton}
            onClick={() => {
              setAgents(START);
              setNow(NOW);
            }}
          >
            Reset
          </button>
        )}
      </p>
    </div>
  );
}

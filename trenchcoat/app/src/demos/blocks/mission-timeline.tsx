import { useState } from "react";
import type * as UI from "@blocks/mission-timeline";
import { caption, textButton } from "../../demo-kit";

/* A regional transit authority's agents preparing the winter service-change notice, on one clock. */

const T = Date.UTC(2026, 10, 14, 6, 0);
const MIN = 60_000;

const AGENTS: UI.MissionLaneAgent[] = [
  { id: "planner", name: "Planner", model: "Sonnet 5.5" },
  { id: "scheduler", name: "Scheduler", model: "Opus 5.5" },
  { id: "translator", name: "Translator", model: "Sonnet 5.5" },
  { id: "access", name: "Accessibility reviewer", model: "Haiku 5.5" },
];

const TASKS: UI.MissionLaneTask[] = [
  { id: "p1", agentId: "planner", title: "List changed stops", status: "done", start: T - 28 * MIN, end: T - 19 * MIN, handoffTo: "s1" },
  { id: "s1", agentId: "scheduler", title: "Draft timetables", status: "done", start: T - 18 * MIN, end: T - 9 * MIN, handoffTo: "s2" },
  { id: "s2", agentId: "scheduler", title: "Route 31 last run", status: "waiting", start: T - 8 * MIN, ask: "Publish 23:10 instead of 23:40?" },
  { id: "t1", agentId: "translator", title: "Spanish notice", status: "failed", start: T - 17 * MIN, end: T - 12 * MIN },
  { id: "a1", agentId: "access", title: "Check the PDFs", status: "running", start: T - 6 * MIN },
];

const EVENTS: UI.MissionEvent[] = [
  { at: T - 19 * MIN, kind: "done", agentId: "planner", label: "Stop list ready" },
  { at: T - 12 * MIN, kind: "failed", agentId: "translator", label: "Glossary file couldn't be read" },
  { at: T - 9 * MIN, kind: "done", agentId: "scheduler" },
  { at: T - 8 * MIN, kind: "needs-you", agentId: "scheduler", label: "Route 31's last run moves earlier" },
  { at: T - 3 * MIN, kind: "done", agentId: "access" },
];

const DECISIONS: UI.MissionDecision[] = [
  { id: "d1", agentId: "scheduler", title: "Publish route 31's earlier last run?", detail: "23:40 becomes 23:10 from 8 December", primary: "Publish", secondary: "Ask the depot" },
  { id: "d2", title: "Send the notice to the print shop today?", detail: "Posters need two working days", primary: "Send today", secondary: "Wait" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MissionTimeline } = ui;
  const [filter, setFilter] = useState<UI.MissionFilter>("all");
  return (
    <div style={{ display: "grid", gap: "var(--tc-space-3)" }}>
      <MissionTimeline agents={AGENTS} tasks={TASKS} events={EVENTS} decisions={DECISIONS} since={T - 30 * MIN} now={T} filter={filter} onFilterChange={setFilter} />
      <p style={caption}>
        Every agent on its own lane, under one filter.{" "}
        <button type="button" style={textButton} onClick={() => setFilter(filter === "waiting" ? "all" : "waiting")}>
          {filter === "waiting" ? "Show all agents" : "Show only waiting"}
        </button>
      </p>
    </div>
  );
}

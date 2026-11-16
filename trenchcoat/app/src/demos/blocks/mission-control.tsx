import { useState } from "react";
import type * as UI from "@blocks/mission-control";
import { caption, textButton } from "../../demo-kit";

/* A regional transit authority's agents preparing the winter service-change notice. */

const T = Date.UTC(2026, 10, 14, 6, 0);
const MIN = 60_000;

const ROOT: UI.MissionAgent = {
  id: "lead",
  name: "Notice lead",
  task: "Prepare the winter service-change notice for routes 4, 12 and 31",
  model: "Opus 5.5",
  status: "running",
  cost: 0.42,
  started: T - 95 * MIN,
  children: [
    { id: "planner", name: "Planner", task: "List every stop and timetable that changes on 8 December", status: "done", cost: 0.31, started: T - 90 * MIN, ended: T - 61 * MIN },
    {
      id: "scheduler",
      name: "Scheduler",
      task: "Draft the new timetables for the three routes",
      status: "waiting",
      cost: 0.58,
      ask: "Route 31's last run moves from 23:40 to 23:10. Publish the earlier time?",
      started: T - 60 * MIN,
    },
    { id: "translator", name: "Translator", task: "Translate the notice into Spanish and Vietnamese", status: "failed", cost: 0.12, error: "The glossary file for route names couldn't be read", started: T - 40 * MIN, ended: T - 33 * MIN },
    { id: "access", name: "Accessibility reviewer", task: "Check the notice and its PDFs for screen readers and plain language", status: "running", cost: 0.09, started: T - 20 * MIN },
  ],
};

const EVENTS: UI.MissionEvent[] = [
  { at: T - 88 * MIN, kind: "done", agentId: "planner", label: "Stop list ready" },
  { at: T - 75 * MIN, kind: "done", agentId: "planner" },
  { at: T - 61 * MIN, kind: "done", agentId: "planner", label: "Changes confirmed with the depot" },
  { at: T - 52 * MIN, kind: "done", agentId: "scheduler" },
  { at: T - 44 * MIN, kind: "needs-you", agentId: "scheduler", label: "Route 31's last run moves earlier" },
  { at: T - 33 * MIN, kind: "failed", agentId: "translator", label: "Glossary file couldn't be read" },
  { at: T - 26 * MIN, kind: "done", agentId: "lead" },
  { at: T - 18 * MIN, kind: "needs-you", agentId: "lead", label: "Which date goes on the posters?" },
  { at: T - 9 * MIN, kind: "done", agentId: "access" },
  { at: T - 4 * MIN, kind: "failed", agentId: "access", label: "One PDF has no tags" },
];

const DECISIONS: UI.MissionDecision[] = [
  { id: "d1", agentId: "scheduler", title: "Publish route 31's earlier last run?", detail: "23:40 becomes 23:10 from 8 December", primary: "Publish", secondary: "Ask the depot" },
  { id: "d2", agentId: "lead", title: "Which date goes on the posters?", detail: "The change starts Monday 8 December", primary: "8 December", secondary: "Week of 8 December" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MissionControl } = ui;
  const [filter, setFilter] = useState<UI.MissionFilter>("all");
  return (
    <div style={{ display: "grid", gap: "var(--tc-space-3)" }}>
      <MissionControl root={ROOT} events={EVENTS} decisions={DECISIONS} since={T - 100 * MIN} now={T} filter={filter} onFilterChange={setFilter} />
      <p style={caption}>
        One filter for the chart, the tree and what needs you.{" "}
        <button type="button" style={textButton} onClick={() => setFilter(filter === "failed" ? "all" : "failed")}>
          {filter === "failed" ? "Show all agents" : "Show only failed"}
        </button>
      </p>
    </div>
  );
}

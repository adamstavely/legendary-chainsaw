import type * as UI from "../../../src/elements/react";
import type { ScheduledSession, ScheduledTask } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A research institute's overnight agent work, planned into a week of sessions. */

const SESSIONS: ScheduledSession[] = [
  { id: "mon", label: "Session 1", day: "Monday", limit: 100 },
  { id: "wed", label: "Session 2", day: "Wednesday", limit: 100 },
  { id: "fri", label: "Session 3", day: "Friday", limit: 60 },
];
const TASKS: ScheduledTask[] = [
  { id: "reindex", name: "Reindex the sample archive", cost: 140, priority: 2 },
  { id: "report", name: "Draft the quarterly report", cost: 40, pinned: "fri" },
  { id: "dedupe", name: "Find duplicate samples", cost: 35 },
  { id: "labels", name: "Check freezer labels", cost: 20 },
  { id: "survey", name: "Summarise the staff survey", cost: 90 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ScheduledRuns } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <ScheduledRuns description="Agent usage for this week" sessions={SESSIONS} tasks={TASKS} />
      <div style={{ ...caption, textAlign: "center" }}>Move a task with its list. Sessions without room aren't offered.</div>
    </div>
  );
}

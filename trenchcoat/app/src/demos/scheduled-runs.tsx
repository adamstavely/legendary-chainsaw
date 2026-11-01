import type * as UI from "../../../src/elements/react";
import type { ScheduledSession, ScheduledTask } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A research institute's overnight agent work, planned into a week of sessions. */

const at = (day: number, hour: number) => Date.UTC(2026, 10, day, hour);
const SESSIONS: ScheduledSession[] = [
  { id: "mon-am", label: "Morning", day: "Monday", time: "07:00", limit: 100, start: at(2, 7), end: at(2, 12) },
  { id: "tue-am", label: "Morning", day: "Tuesday", time: "07:00", limit: 100, start: at(3, 7), end: at(3, 12) },
  { id: "mon-pm", label: "Afternoon", day: "Monday", time: "12:00", limit: 100, start: at(2, 12), end: at(2, 17) },
  { id: "tue-pm", label: "Afternoon", day: "Tuesday", time: "12:00", limit: 60, start: at(3, 12), end: at(3, 17) },
];
const TASKS: ScheduledTask[] = [
  { id: "reindex", name: "Reindex the sample archive", agent: "Archive agent", cost: 140, priority: 2, stats: [{ label: "Files", value: 480 }] },
  { id: "report", name: "Draft the quarterly report", agent: "Writing agent", detail: "From the three lab summaries", cost: 40, pinned: "tue-pm" },
  { id: "dedupe", name: "Find duplicate samples", agent: "Archive agent", cost: 35 },
  { id: "labels", name: "Check freezer labels", agent: "Inventory agent", cost: 20, stats: [{ label: "Labels", value: 210 }] },
  { id: "survey", name: "Summarise the staff survey", agent: "Writing agent", cost: 90 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ScheduledRuns } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 1040, display: "grid", gap: 8 }}>
      <ScheduledRuns description="Agent usage for this week" sessions={SESSIONS} tasks={TASKS} now={at(2, 13)} />
      <div style={{ ...caption, textAlign: "center" }}>Drag a card to a session, or use its list. A session without room refuses it and says why.</div>
    </div>
  );
}

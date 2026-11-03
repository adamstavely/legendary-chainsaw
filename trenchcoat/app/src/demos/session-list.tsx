import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SessionGroupBy, SessionItem } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Coding sessions across a research institute's repositories. Pin and Archive change the list, because the page owns
   the data. */

const NOW = Date.UTC(2026, 10, 2, 15, 0);
const M = 60_000;
const START: SessionItem[] = [
  { id: "s1", title: "Booking calendar for instrument pages", status: "waiting", project: "sample-tracker", branch: "feature/booking-calendar", updated: NOW - 2 * M, detail: "Wants to run the migrations", unread: true },
  { id: "s2", title: "Fix CSV export of sample batches", status: "running", project: "sample-tracker", branch: "fix/sample-export", updated: NOW - 1 * M, detail: "Running tests" },
  { id: "s3", title: "Freezer map layout", status: "idle", project: "sample-tracker", branch: "feature/freezer-map", updated: NOW - 3 * 60 * M },
  { id: "s4", title: "Weekly usage report", status: "done", project: "facility-reports", branch: "main", updated: NOW - 26 * 60 * M, pinned: true },
  { id: "s5", title: "Upgrade the charting library", status: "failed", project: "facility-reports", branch: "chore/upgrade-charts", updated: NOW - 50 * 60 * M, detail: "Build failed" },
  { id: "s6", title: "Explain the scheduling model", status: "done", updated: NOW - 6 * 24 * 60 * M },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SessionList } = ui;
  const [sessions, setSessions] = useState(START);
  const [groupBy, setGroupBy] = useState<SessionGroupBy>("project");
  return (
    <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: 8 }}>
      <SessionList
        sessions={sessions}
        groupBy={groupBy}
        defaultSelected="s2"
        now={NOW}
        maxHeight="26rem"
        onTcPin={(e) => setSessions((list) => list.map((s) => (s.id === e.detail.id ? { ...s, pinned: e.detail.pinned } : s)))}
        onTcArchive={(e) => setSessions((list) => list.filter((s) => s.id !== e.detail.id))}
        onSelectedChange={(id) => setSessions((list) => list.map((s) => (s.id === id ? { ...s, unread: false } : s)))}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        <button type="button" style={textButton} onClick={() => setGroupBy(groupBy === "project" ? "status" : "project")}>
          Group by {groupBy === "project" ? "status" : "project"}
        </button>{" "}
        ·{" "}
        <button type="button" style={textButton} onClick={() => setSessions(START)}>
          Start again
        </button>
      </div>
    </div>
  );
}

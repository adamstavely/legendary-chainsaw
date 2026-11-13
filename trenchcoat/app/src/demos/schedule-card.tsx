import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ScheduleRun, ScheduleRunStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's weekly ledger reconciliation: an agent matches the week's invoices against the
   ledger every Monday morning. The clock is fixed, so the countdown reads the same every time. */

const NOW = new Date(2026, 10, 16, 7, 48).getTime();
const WEEK = 7 * 24 * 3600_000;
const FIRST = new Date(2026, 7, 31, 9, 0).getTime();
const STATUSES: ScheduleRunStatus[] = ["succeeded", "succeeded", "succeeded", "failed", "succeeded", "succeeded", "skipped", "succeeded", "succeeded", "succeeded", "failed", "succeeded"];
const NOTES: Partial<Record<number, string>> = { 3: "3 invoices didn't match the ledger", 6: "Skipped – institute holiday", 10: "The ledger export timed out" };

const RUNS: ScheduleRun[] = STATUSES.map((status, i) => ({
  id: `r${i + 1}`,
  at: FIRST + i * WEEK,
  status,
  duration: status === "skipped" ? undefined : 95_000 + ((i * 37_000) % 80_000),
  note: NOTES[i],
}));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ScheduleCard } = ui;
  const [paused, setPaused] = useState(false);
  const [opened, setOpened] = useState<ScheduleRun | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: 8 }}>
      <ScheduleCard
        title="Ledger reconciliation"
        schedule="Every Monday at 09:00, Europe/London"
        nextRun={new Date(2026, 10, 16, 9, 0).getTime()}
        now={NOW}
        runs={RUNS}
        paused={paused}
        onPausedChange={setPaused}
        onRunOpen={(_, run) => setOpened(run)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {opened ? `Opened the run from ${new Date(opened.at).toLocaleDateString()}. ` : "Point at a run to see when it ran. "}
        <button type="button" style={textButton} onClick={() => setPaused(!paused)}>
          {paused ? "Resume it" : "Pause it"}
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PlannedRun } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional newsroom's overnight agents against one 400k tokens-a-minute limit. Everything was set to start around
   one in the morning, so the night peaks well over the limit; the morning briefing has to go out at five. */

const DAY = Date.UTC(2026, 10, 16);
const at = (h: number, m = 0) => DAY + (h * 60 + m) * 60_000;
const RUNS: PlannedRun[] = [
  { id: "wire", name: "Wire summaries", agent: "Wire desk", start: at(0, 30), minutes: 150, tokensPerMinute: 180_000 },
  { id: "translate", name: "Translation batch", agent: "Languages desk", start: at(1), minutes: 120, tokensPerMinute: 160_000 },
  { id: "archive", name: "Archive tagging", agent: "Archive", start: at(1, 30), minutes: 180, tokensPerMinute: 140_000 },
  { id: "captions", name: "Photo captions", agent: "Picture desk", start: at(2), minutes: 60, tokensPerMinute: 90_000 },
  { id: "briefing", name: "Morning briefing", agent: "Briefing", start: at(5), minutes: 60, tokensPerMinute: 120_000, fixed: true },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RateLimitPlanner } = ui;
  const [runs, setRuns] = useState(RUNS);
  return (
    <div style={{ width: "100%", maxWidth: 900, display: "grid", gap: 8 }}>
      <RateLimitPlanner
        title="Overnight runs"
        description="The newsroom's agents against the 400k tokens a minute limit"
        limit={400_000}
        day={DAY}
        hours={12}
        locale="en-GB"
        timeZone="UTC"
        runs={runs}
        onRunsChange={setRuns}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Drag a run or move it with the arrow keys, or press Spread out.{" "}
        <button type="button" style={textButton} onClick={() => setRuns(RUNS)}>
          Reset
        </button>
      </div>
    </div>
  );
}

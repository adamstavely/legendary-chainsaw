import type * as UI from "../../../src/elements/react";
import type { SearchAlert } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A researcher's alerts on a fictional marine institute's archive: one with new matches, one paused, one weekly
   digest. Add alert starts from the search they just ran. Times are fixed so the demo reads the same every day. */

const NOW = Date.UTC(2026, 9, 24, 15);
const H = 3_600_000;
const ALERTS: SearchAlert[] = [
  { id: "a1", name: "New bleaching surveys", query: "coral bleaching survey kind:document", frequency: "daily", channels: ["email", "app"], newCount: 12, lastRun: NOW - 2 * H, lastMatch: NOW - 4 * 24 * H },
  { id: "a2", name: "Kelp grant reports", query: "kelp forest grant report", frequency: "weekly", channels: ["email"], lastRun: NOW - 3 * 24 * H },
  { id: "a3", name: "Buoy temperature alerts", query: "buoy temperature above 30", frequency: "instant", channels: ["slack"], newCount: 3, lastRun: NOW - 0.2 * H, lastMatch: NOW - 1 * H, paused: true },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SavedSearchAlerts } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 10 }}>
      <SavedSearchAlerts description="You hear when something new matches" defaultAlerts={ALERTS} now={NOW} locale="en-GB" draftQuery="seagrass carbon storage" />
      <div style={{ ...caption, textAlign: "center" }}>Change how often or where, pause one, remove one and Undo, or add the search below.</div>
    </div>
  );
}

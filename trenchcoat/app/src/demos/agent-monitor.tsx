import type * as UI from "../../../src/elements/react";
import type { AgentMonitorStep } from "../../../src/elements/react";

/* A made-up agent reads a research institute's archive. The times are fixed, so the card's the same on every visit. */

const NOW = Date.UTC(2026, 9, 31, 9, 30);
const ago = (seconds: number) => NOW - seconds * 1000;
const STEPS: AgentMonitorStep[] = [
  { id: "a", label: "Read the brief", tool: "Files", startedAt: ago(340), endedAt: ago(320), status: "done", detail: "Two pages, no open questions." },
  { id: "b", label: "Search the archive", tool: "Archive search", startedAt: ago(320), endedAt: ago(190), status: "done", detail: "212 records matched, and 40 were kept." },
  { id: "c", label: "Fetch an old report", tool: "Files", startedAt: ago(190), endedAt: ago(170), status: "failed", detail: "The scan was unreadable, so it moved on." },
  { id: "d", label: "Compare the records", startedAt: ago(170), status: "running" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentMonitor } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <AgentMonitor name="Archive reader" description="Harbour survey, 1950 to 1980" status="running" startedAt={ago(340)} now={NOW} cost={0.42} steps={STEPS} locale="en-GB" />
    </div>
  );
}

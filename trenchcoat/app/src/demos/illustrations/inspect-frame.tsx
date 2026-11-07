import type * as UI from "../../../../src/elements/react";
import type { AgentMonitorStep } from "../../../../src/elements/react";

/* Two real components seen like selections in a design tool, as they'd sit either side of a headline, and a flat still.
 * The data is a made-up research institute's; the times are fixed, so the cards are the same on every visit. */

const NOW = Date.UTC(2026, 10, 3, 14, 0);
const ago = (seconds: number) => NOW - seconds * 1000;
const STEPS: AgentMonitorStep[] = [
  { id: "a", label: "Read the survey brief", tool: "Files", startedAt: ago(220), endedAt: ago(205), status: "done" },
  { id: "b", label: "Collect the station data", tool: "Archive search", startedAt: ago(205), endedAt: ago(90), status: "done" },
  { id: "c", label: "Draft the methods section", startedAt: ago(90), endedAt: ago(12), status: "done" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { InspectFrame, AgentMonitor, ChatComposer } = ui;
  const card = (
    <AgentMonitor name="Survey writer" description="Annual field-survey report" status="done" startedAt={ago(220)} endedAt={ago(12)} now={NOW} cost={0.18} steps={STEPS} actions={false} locale="en-GB" />
  );
  return (
    <div style={{ display: "grid", gap: 24, width: "100%", maxWidth: 860 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <InspectFrame mirror delay={900}>{card}</InspectFrame>
        <InspectFrame contentWidth={340} delay={1800}>
          <ChatComposer placeholder="Ask about the field survey…" hideConnectApps hideProject />
        </InspectFrame>
      </div>
      <div style={{ maxWidth: 420 }}>
        <InspectFrame flat playing={false} label="The survey writer's card, its header selected with its spacing shown">
          {card}
        </InspectFrame>
      </div>
    </div>
  );
}

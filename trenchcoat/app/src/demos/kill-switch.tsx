import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { KillRunning, KillStop } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* An operations view of the agents a support team runs. The billing agent is already stopped while its refund policy
   is fixed; Stop on any row, or Stop everything, asks first and names what halts. Resume lifts a stop. */

const RUNNING: KillRunning[] = [
  { id: "support", label: "Support agent", kind: "Agent", detail: "14 conversations open" },
  { id: "billing", label: "Billing agent", kind: "Agent", detail: "2 refunds in progress" },
  { id: "sync", label: "Nightly CRM sync", kind: "Schedule", detail: "Next run at 02:00" },
  { id: "outbound", label: "Outbound email", kind: "Queue", detail: "38 messages waiting" },
];
const START: KillStop[] = [{ id: "s-1", target: "billing", label: "Billing agent", by: "Priya Shah", at: "09:42", reason: "Refunds over the limit while the policy is updated" }];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { KillSwitch } = ui;
  const [stops, setStops] = useState(START);
  const [note, setNote] = useState("Stop asks first and names what halts; Resume lifts a stop.");
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <KillSwitch
        running={RUNNING}
        stops={stops}
        onStopsChange={setStops}
        onStop={(stop, halts) => setNote(`Stopped ${stop.target === "all" ? "everything" : stop.label} – ${halts.length === 1 ? "1 item halts" : `${halts.length} items halt`} at the next step.`)}
        onResume={(stop) => setNote(`${stop.label} resumed.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>{note}</div>
    </div>
  );
}

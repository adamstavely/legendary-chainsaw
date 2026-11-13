import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AgentTrigger } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* How a research institute's invoice-matching agent starts. The addresses are fictional */

const NOW = Date.UTC(2026, 10, 12, 10);
const HOUR = 3_600_000;
const TRIGGERS: AgentTrigger[] = [
  { id: "daily", kind: "schedule", summary: "Every weekday at 09:00", enabled: true, lastFired: NOW - HOUR, fires7d: 5 },
  { id: "hook", kind: "webhook", summary: "POST /hooks/invoice-match/7f3a91", enabled: true, lastFired: NOW - 20 * 60_000, fires7d: 38, error: "The last 3 requests had no X-Signature header" },
  { id: "upload", kind: "event", summary: "When an invoice is uploaded to Accounts payable", enabled: true, lastFired: NOW - 3 * HOUR, fires7d: 1 },
  { id: "mail", kind: "email", summary: "Email to invoices@institute.example", enabled: false, lastFired: NOW - 9 * 24 * HOUR, fires7d: 0 },
  { id: "run", kind: "manual", summary: "Someone presses Run", enabled: true },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TriggerList } = ui;
  const [triggers, setTriggers] = useState(TRIGGERS);
  const [note, setNote] = useState("Turn a trigger off, or add one by kind.");
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <TriggerList
        description="Invoice matcher"
        triggers={triggers}
        onTriggersChange={setTriggers}
        onEdit={(_, t) => setNote(`Edit: ${t.summary}`)}
        onAdd={(kind) => setNote(`Add a ${kind} trigger`)}
        now={NOW}
        locale="en-GB"
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note}{" "}
        <button type="button" style={textButton} onClick={() => setTriggers(TRIGGERS)}>
          Start over
        </button>
      </div>
    </div>
  );
}

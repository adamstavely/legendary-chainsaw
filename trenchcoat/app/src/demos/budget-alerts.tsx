import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { BudgetAlert } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's AI budget for November, on the 12th. */

const ALERTS: BudgetAlert[] = [
  { id: "a50", at: 0.5, channel: "email", recipients: ["finance@northfield.example"] },
  { id: "a80", at: 0.8, channel: "chat", recipients: ["#finance-ops"] },
  { id: "a100", at: 1, channel: "email", recipients: ["finance@northfield.example", "cto@northfield.example"] },
];
const NOW = Date.UTC(2026, 10, 12, 12);
const END = Date.UTC(2026, 10, 30, 23, 59);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BudgetAlerts } = ui;
  const [alerts, setAlerts] = useState(ALERTS);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <BudgetAlerts
        description="Northfield Research Institute · November"
        budget={5000}
        spent={2140}
        forecast={5460}
        now={NOW}
        end={END}
        locale="en-GB"
        alerts={alerts}
        onAlertsChange={setAlerts}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Drag a marker or use the arrow keys; click the bar to add one.{" "}
        <button type="button" style={textButton} onClick={() => setAlerts(ALERTS)}>
          Reset
        </button>
      </div>
    </div>
  );
}

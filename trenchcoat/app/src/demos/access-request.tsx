import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AccessResource, AccessStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's data catalogue: a researcher asks for a year of field-station sensor readings.
   The page owns the status, so the caption can play the approver. */

const RESOURCE: AccessResource = {
  name: "Field station sensor readings 2024",
  type: "dataset",
  description: "Hourly temperature, wind and soil moisture from the Glen Ardach masts.",
  owner: "Field Data team",
  steward: "Dr Ines Okafor",
  classification: "internal",
  current: "No access",
};
const FIELDS = ["timestamp", "station_id", "air_temp_c", "wind_speed_ms", "soil_moisture", "battery_v"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AccessRequest } = ui;
  const [status, setStatus] = useState<AccessStatus>("draft");
  const [sent, setSent] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState<number | null>(null);
  const next: Partial<Record<AccessStatus, [string, () => void]>> = {
    pending: ["Approve it", () => setStatus("approved")],
    approved: [
      "Let it expire",
      () => {
        setUntil(Date.now());
        setStatus("expired");
      },
    ],
  };
  const step = next[status];
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <AccessRequest
        resource={RESOURCE}
        fields={FIELDS}
        approvers={["Dr Ines Okafor"]}
        status={status}
        submittedAt={sent}
        expiresAt={until ?? undefined}
        reason={status === "denied" ? "Please use the published monthly summary instead." : undefined}
        onStatusChange={setStatus}
        onRequest={(r) => {
          setSent(Date.now());
          setUntil(r.until);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {status === "draft" ? "Pick a level and how long, say why, then send it." : step || status === "pending" ? "Play the approver: " : "Use Request again to start over."}
        {step ? (
          <button type="button" style={textButton} onClick={step[1]}>
            {step[0]}
          </button>
        ) : null}
        {status === "pending" ? (
          <>
            {" · "}
            <button type="button" style={textButton} onClick={() => setStatus("denied")}>
              Deny it
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

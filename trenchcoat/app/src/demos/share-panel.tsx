import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ShareEntitlementCheck, ShareGrant, ShareRecipient } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A research institute shares restricted trial data. The check is the demo's own stand-in for an entitlement service:
   it answers after a moment, and nothing leaves the page. */

const DIRECTORY: ShareRecipient[] = [
  { id: "noor", kind: "person", name: "Noor Haddad", detail: "noor@institute.example" },
  { id: "tomas", kind: "person", name: "Tomás Rivera", detail: "tomas@institute.example" },
  { id: "ines", kind: "person", name: "Inês Costa", detail: "Visiting researcher" },
  { id: "kofi", kind: "person", name: "Kofi Mensah", detail: "kofi@institute.example" },
  { id: "biostat", kind: "group", name: "Biostatistics", detail: "12 members" },
  { id: "partners", kind: "group", name: "External partners", detail: "30 members" },
  { id: "flaky", kind: "person", name: "Sam Okafor", detail: "Directory out of sync" },
];
const byId = (id: string) => DIRECTORY.find((r) => r.id === id)!;
const ACCESS: ShareGrant[] = [
  { recipient: byId("noor"), level: "edit" },
  { recipient: byId("tomas"), level: "view" },
];

const check: ShareEntitlementCheck = async (recipient, level) => {
  await new Promise((r) => setTimeout(r, 500));
  if (recipient.id === "flaky") throw new Error("The entitlement service didn't answer");
  if (recipient.id === "ines") return { status: "denied", reason: "Needs the Restricted data agreement." };
  if (recipient.id === "partners") return { status: "denied", reason: "This data can't leave the institute." };
  if (recipient.id === "biostat") return { status: "partial", allowed: 9, total: 12, reason: "3 members haven't completed data training." };
  if (recipient.id === "kofi" && level === "edit") return { status: "denied", reason: "Entitled to view and comment, not to edit." };
  return { status: "allowed" };
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SharePanel } = ui;
  const [sent, setSent] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 600, display: "grid", gap: 8 }}>
      <SharePanel
        resourceName="Trial 12 results"
        description="Restricted data"
        directory={DIRECTORY}
        defaultAccess={ACCESS}
        checkEntitlement={check}
        onShare={(d) => setSent(`Added ${d.add.length}, changed ${d.change.length}, removed ${d.remove.length}, left out ${d.excluded.length}.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>{sent || "Search for Inês Costa, Biostatistics or Sam Okafor. Kofi Mensah can view but not edit."}</div>
    </div>
  );
}

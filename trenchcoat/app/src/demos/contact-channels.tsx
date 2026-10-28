import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ContactChannel } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A fictional customer's contact points in a support desk: a verified primary email, a work address that bounced,
   two phone numbers, a messaging handle and a postal address. Values stay masked until someone shows them; a shown
   value can be copied, and Message hands off to the page. */

const CHANNELS: ContactChannel[] = [
  { id: "e1", kind: "email", value: "elena.ruiz@example.com", role: "Primary", lastUsed: Date.UTC(2026, 9, 24, 12), state: "verified" },
  { id: "e2", kind: "email", value: "e.ruiz@larkfield-holdings.example", role: "Work", lastUsed: Date.UTC(2026, 4, 2, 12), state: "bounced", note: "Bounced twice in May" },
  { id: "p1", kind: "phone", value: "+34 612 448 107", role: "Primary", lastUsed: Date.UTC(2026, 9, 26, 12), state: "verified" },
  { id: "p2", kind: "phone", value: "+41 79 330 21 02", role: "Backup", lastUsed: Date.UTC(2025, 11, 3, 12), state: "dormant" },
  { id: "m1", kind: "messaging", value: "@elena.r", service: "Signal", role: "Linked to alias", state: "unverified" },
  { id: "a1", kind: "address", value: "Calle de la Luna 14, 3B, 28004 Madrid", role: "Home", state: "flagged", note: "Doesn't match the billing address" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ContactChannels } = ui;
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <ContactChannels
        title="Contact points"
        description="Elena Ruiz · customer since 2017"
        channels={CHANNELS}
        actions={[{ id: "message", label: "Message" }]}
        locale="en-GB"
        onCopy={(c) => setNote(`Copied the ${c.kind}.`)}
        onAction={(action, c) => setNote(`${action === "message" ? "Message" : action} ${c.role ?? c.kind}.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>{note || "Show a value with the eye, then copy it or send a message."}</div>
    </div>
  );
}

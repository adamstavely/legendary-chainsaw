import { useState } from "react";
import type * as UI from "@components/email-draft";
import type { DraftContact, DraftTone } from "@components/email-draft";
import { caption } from "../demo-kit";

const contacts: DraftContact[] = [
  { name: "Priya Raman", email: "priya@lumen-health.com" },
  { name: "Marcus Bell", email: "marcus@lumen-health.com" },
  { name: "Accounts payable", email: "ap@lumen-health.com" },
];

const first = (c: DraftContact) => c.name.split(" ")[0];

const tones: DraftTone[] = [
  {
    id: "friendly",
    label: "Friendly",
    body: (c) =>
      `Hi ${first(c)}, quick note that invoice INV-4471 for $12,450 was due last Friday. No stress if it's already in motion – if anything's holding it up, just reply and we'll sort it out. You can pay online here:`,
  },
  {
    id: "short",
    label: "Short",
    body: (c) => `Hi ${first(c)}, invoice INV-4471 ($12,450) is 6 days overdue. Pay online:`,
  },
  {
    id: "formal",
    label: "Formal",
    body: (c) =>
      `Dear ${c.name}, our records show that invoice INV-4471 in the amount of $12,450 remains outstanding as of today. We would appreciate settlement at your earliest convenience via the link below:`,
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EmailDraft } = ui;
  const [log, setLog] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 10 }}>
      <EmailDraft
        reference="INV-4471"
        account="Lumen Health"
        amount="$12,450"
        status="6 days overdue"
        agent="Collections agent"
        contacts={contacts}
        attachment="INV-4471.pdf"
        tones={tones}
        link={{ label: "Pay invoice", href: "#" }}
        onSend={(e) => setLog(`Sent to ${e.to.email}${e.attachment ? ` with ${e.attachment}` : ""}`)}
        onDiscard={() => setLog("Draft discarded")}
        onUndo={(action) => setLog(action === "send" ? "Send undone" : "Discard undone")}
      />
      {log && <div style={{ ...caption, textAlign: "center" }}>{log}</div>}
    </div>
  );
}

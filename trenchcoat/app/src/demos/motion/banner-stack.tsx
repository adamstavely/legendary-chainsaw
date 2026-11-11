import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { caption, textButton } from "../../demo-kit";

/* A research institute's system notices: the newest on top, older ones peeking behind; hover or tab in to spread them */

type Notice = { id: string; title: string; detail: string };
const START: Notice[] = [
  { id: "export", title: "Nightly export finished", detail: "4,812 records written to the archive at 02:14." },
  { id: "sync", title: "Vendor sync resumed", detail: "The register is current again after a 20-minute pause." },
  { id: "review", title: "Case 2041 is ready for review", detail: "Two reviewers have been assigned." },
  { id: "policy", title: "Retention policy updated", detail: "Interview audio is now kept for 18 months." },
];
const MORE: Notice[] = [
  { id: "backup", title: "Weekly backup verified", detail: "All 12 volumes restored cleanly in the test run." },
  { id: "quota", title: "Storage at 82%", detail: "The field-notes library is filling faster than usual." },
];

const card: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  padding: "12px 14px",
  borderRadius: 12,
  background: "var(--tc-surface-raised)",
  boxShadow: "var(--tc-card-shadow)",
  color: "var(--tc-text-primary)",
  fontSize: 13,
};
const close: React.CSSProperties = { ...textButton, marginLeft: "auto", fontSize: 12, color: "var(--tc-text-secondary)", textDecoration: "none" };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BannerStack } = ui;
  const [notices, setNotices] = useState(START);
  const [next, setNext] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 380, display: "grid", gap: 12 }}>
      <BannerStack label="System notices" limit={3} onDismiss={(id) => setNotices((n) => n.filter((x) => x.id !== id))}>
        {notices.map((n) => (
          <div key={n.id} data-id={n.id} style={card}>
            <div>
              <div style={{ fontWeight: 600 }}>{n.title}</div>
              <div style={{ color: "var(--tc-text-secondary)", marginTop: 2 }}>{n.detail}</div>
            </div>
            <button type="button" data-dismiss style={close}>Dismiss<span className="tc-sr-only"> {n.title}</span></button>
          </div>
        ))}
      </BannerStack>
      <div style={{ ...caption, display: "flex", gap: 12, justifyContent: "center" }}>
        <button type="button" style={textButton} onClick={() => { const n = MORE[next % MORE.length]!; setNotices([{ ...n, id: `${n.id}-${next}` }, ...notices]); setNext(next + 1); }}>Add a notice</button>
        <button type="button" style={textButton} onClick={() => setNotices(START)}>Reset</button>
      </div>
    </div>
  );
}

import type * as UI from "../../../../src/elements/react";

/* The folders of a fictional case-review app, one per status. */
const NOTES = [
  ["empty", "Drop case files here to start this folder."],
  ["shared", "Shared with the fraud review team – 6 people can edit."],
  ["archived", "Closed cases from 2025, kept for seven years."],
  ["locked", "Held for legal review. Ask Noor Haddad for access."],
] as const;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FolderStatus } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      {NOTES.map(([status, note]) => (
        <div key={status}>
          <FolderStatus status={status} />
          <p style={{ margin: "4px 0 0" }}>{note}</p>
        </div>
      ))}
    </div>
  );
}

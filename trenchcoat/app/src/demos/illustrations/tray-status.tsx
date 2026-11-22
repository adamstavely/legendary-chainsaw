import type * as UI from "../../../../src/elements/react";

/* Every tray scene, each at a moment in a fictional case-review app – the review queue emptied, a first visit, a place
   to drop files, new cases arriving, an import, an export and a sync finished, a paused queue, a scan that couldn't be
   uploaded, and storage running out. */

const NOTES = [
  ["all-done", "No cases are waiting for you. New ones land here as they're assigned."],
  ["empty", "Your saved searches will show up here once you save one."],
  ["drop-to-upload", "Drop case files here, or choose them from your computer."],
  ["new-items", "3 cases were assigned to you since this morning."],
  ["import-complete", "1,240 cases were imported; none needed fixing."],
  ["export-ready", "Cases_Q3.csv is ready – 2.4 MB, 1,240 rows."],
  ["sync-complete", "The case list matches the bank's records as of 09:40."],
  ["paused", "Intake is paused while the team reviews the backlog."],
  ["upload-failed", "Scan_0412.tiff is 48 MB; the limit is 25 MB. Try a PDF or a smaller scan."],
  ["storage-full", "The workspace has used its 50 GB. Remove old exports or ask an admin for more."],
] as const;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TrayStatus } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 900, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      {NOTES.map(([status, note]) => (
        <div key={status}>
          <TrayStatus status={status} />
          <p style={{ margin: "4px 0 0" }}>{note}</p>
        </div>
      ))}
    </div>
  );
}

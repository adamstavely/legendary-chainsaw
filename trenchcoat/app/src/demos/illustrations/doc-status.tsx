import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import type { DocStatusValue as Status } from "../../../../src/elements/react";
import { caption } from "../../demo-kit";

/* Every status of a fictional research institute's documents – a report moving through review and release, files
   coming and going, a scan, metadata being cleansed, an article saved for later, and the app working offline – with
   a picker to try one large. */

const GROUPS: { title: string; items: [Status, string][] }[] = [
  {
    title: "Workflow",
    items: [
      ["awaiting-review", "The annual report waits for the editor."],
      ["in-translation", "French and German versions in progress."],
      ["in-quality-control", "Checking figures against the source data."],
      ["in-coordination", "Three teams are agreeing the final wording."],
      ["draft", "Only you can see it."],
      ["pending-release", "Approved; goes live on Monday at 9:00."],
      ["scheduled", "Goes out on 3 December at 9:00."],
      ["released", "Live on the institute's site."],
      ["added-to-readbook", "“Card testing at small merchants” is saved."],
    ],
  },
  {
    title: "Work",
    items: [
      ["processing", "Building the export – about two minutes."],
      ["queued", "Third in line for the export worker."],
      ["in-progress", "Priya is reviewing the case."],
      ["success", "All 1,240 cases imported."],
      ["failed", "The import stopped at row 412."],
      ["uploading", "field-notes.pdf, 4.2 MB of 6 MB."],
      ["downloading", "Preparing the archive for download."],
      ["working-offline", "Changes are saved here and sync when you're back online."],
      ["locked", "Tomás is editing it."],
    ],
  },
  {
    title: "Access, signing and keeping",
    items: [
      ["restricted", "Only the review panel can open it."],
      ["redacted", "Names and account numbers are hidden."],
      ["password-protected", "Enter the password Priya sent you to open it."],
      ["encrypted", "Stored encrypted with the institute's key."],
      ["shared", "Shared with the review panel and two editors."],
      ["awaiting-signature", "Waiting for the director to sign."],
      ["signed", "Signed by both parties on 2 November."],
      ["comment-needed", "Three comments wait for your answer."],
      ["archived", "Moved to the 2025 archive."],
      ["in-trash", "Deleted today – restore it within 30 days."],
      ["expired", "Past its five-year retention date."],
      ["duplicate", "The same as “Annual report – final”."],
    ],
  },
  {
    title: "Files, metadata and more",
    items: [
      ["malware-scan", "Statement_March.pdf opens once the scan finishes."],
      ["malware-blocked", "This file may be harmful and can't be opened."],
      ["preview-unavailable", "survey-data.sav can't be shown here – download it instead."],
      ["metadata-cleansing-required", "38 records are missing a publisher or a date."],
      ["metadata-cleansing-in-progress", "Matching names against the authority file."],
      ["metadata-cleansing-failed", "The authority file couldn't be reached."],
      ["metadata-cleansing-success", "Every record is clean and ready."],
      ["update-available", "Version 4 is ready – update to see the new figures."],
      ["converting", "Reading the scanned pages into searchable text."],
      ["sync-conflict", "This copy and the one on the server both changed."],
    ],
  },
];
const ALL = GROUPS.flatMap((g) => g.items.map(([s]) => s));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DocStatus } = ui;
  const [picked, setPicked] = useState<Status>("in-quality-control");
  return (
    <div style={{ width: "100%", maxWidth: 900, display: "grid", gap: 20, fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <label style={{ display: "grid", gap: 6, justifyItems: "center" }}>
        <span>Try a status</span>
        <select value={picked} onChange={(e) => setPicked(e.target.value as Status)} style={{ font: "inherit", padding: "4px 8px", borderRadius: 8 }}>
          {ALL.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <div style={{ width: "100%", maxWidth: 320, justifySelf: "center" }}>
        <DocStatus status={picked} />
      </div>
      {GROUPS.map((g) => (
        <section key={g.title} style={{ display: "grid", gap: 8 }}>
          <h3 style={{ ...caption, margin: 0, fontWeight: 600 }}>{g.title}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16, textAlign: "center" }}>
            {g.items.map(([s, note]) => (
              <div key={s}>
                <DocStatus status={s} />
                <p style={{ margin: "4px 0 0" }}>{note}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

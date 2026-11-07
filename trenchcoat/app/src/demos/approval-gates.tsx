import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ApprovalGate } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* An agent publishing a research institute's annual field-survey report has stopped at three gates. Decide the top
   one – Approve, Reject or Ask for changes with a note – and it drops into Decided while the next rises. Open a
   decided row to see what was decided. */

const NOW = Date.UTC(2026, 10, 6, 14, 10);
const min = (m: number) => NOW - m * 60_000;

const GATES: ApprovalGate[] = [
  {
    id: "embargo",
    title: "Move the embargo forward a week",
    agent: "Writer",
    kind: "File change",
    at: min(1),
    reason: "The report goes public on November 13 instead of November 20.",
    blocking: true,
    diff: {
      path: "survey-2026/report.config.ts",
      lines: [
        { kind: "context", text: "export const report = {" },
        { kind: "context", text: '  title: "Annual Field Survey 2026",' },
        { kind: "remove", text: '  embargo: "2026-11-20T09:00Z",' },
        { kind: "add", text: '  embargo: "2026-11-13T09:00Z",' },
        { kind: "context", text: "};" },
      ],
    },
    holds: ["Build the report site", "Publish to the archive"],
    context: {
      before: ["Draft approved by the editorial board", "Figures regenerated from the 2026 data", "Proofs checked"],
      touches: ["survey-2026/report.config.ts"],
    },
    status: "open",
  },
  {
    id: "migration",
    title: "Run the station ID migration",
    agent: "Analyst",
    kind: "Command",
    at: min(3),
    reason: "Merges duplicate station IDs in this year's survey data – 48,210 rows change.",
    args: { migration: "2026_11_06_merge_station_ids", dataset: "field-survey-2026", rows: 48210, dry_run: false },
    holds: ["Regenerate the coastal figures"],
    status: "open",
  },
  {
    id: "newsletter",
    title: "Email 1,284 newsletter subscribers",
    agent: "Comms",
    kind: "Message",
    at: min(4),
    reason: "Announces the report the morning it goes public.",
    args: { list: "survey-newsletter", recipients: 1284, subject: "The 2026 Field Survey is out", send_at: "2026-11-13T09:05Z" },
    holds: ["Post to the institute blog"],
    status: "open",
  },
  {
    id: "archive",
    title: "Archive last year's raw files",
    agent: "Analyst",
    kind: "Command",
    at: min(9),
    reason: "Moves 2025 raw files to cold storage.",
    args: { source: "raw/2025", target: "cold-storage/2025", delete_source: false },
    status: "approved",
    decidedAt: min(6),
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ApprovalGates } = ui;
  const [round, setRound] = useState(0);
  const [log, setLog] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <ApprovalGates
        key={round}
        run="Publish the 2026 field-survey report"
        defaultGates={GATES}
        now={NOW}
        onDecide={({ gate, decision, note }) =>
          new Promise<void>((resolve) =>
            setTimeout(() => {
              setLog(`${decision === "approved" ? "Approved" : decision === "rejected" ? "Rejected" : "Asked for changes on"} “${gate.title}”${note ? ` – “${note}”` : ""}`);
              resolve();
            }, 600),
          )
        }
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log ?? "Decide the top request – it drops into Decided and the next one rises."}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setRound((r) => r + 1);
            setLog(null);
          }}
        >
          Start over
        </button>
      </p>
    </div>
  );
}

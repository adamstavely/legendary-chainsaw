import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ApprovalDiff, ApprovalStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* An agent asks before sending a campaign. Approve shows a spinner for a moment (the promise), then the tray folds
   into the compact row; Deny or letting the countdown run out does the same. A few seconds later a fresh request
   arrives, so the card can be tried again. The links under it swap in a request that shows exactly what it would
   change: a file change as a diff, or a call's arguments. */

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3.5" width="12" height="9" rx="2" />
    <path d="m2.8 4.6 5.2 4 5.2-4" />
  </svg>
);

const RECIPIENTS = ["maya@northwind.io", "j.okafor@lumen.co", "priya@fieldstone.app", "dev@harbor.so"];

type Kind = "email" | "diff" | "args";

const EMBARGO: ApprovalDiff = {
  path: "survey-2026/report.config.ts",
  lines: [
    { kind: "context", text: "export const report = {" },
    { kind: "context", text: '  title: "Annual Field Survey 2026",' },
    { kind: "remove", text: '  embargo: "2026-11-20T09:00Z",' },
    { kind: "add", text: '  embargo: "2026-11-13T09:00Z",' },
    { kind: "context", text: "};" },
  ],
};
const MIGRATION = { migration: "2026_11_06_merge_station_ids", dataset: "field-survey-2026", rows: 48210, dry_run: false };

const Recipients = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {RECIPIENTS.map((r) => (
      <span key={r} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, background: "var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)))", color: "var(--tc-text-secondary, light-dark(#404040, #c8c8cc))" }}>
        {r}
      </span>
    ))}
    <span style={{ fontSize: 12, padding: "2px 8px", color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>+ 2,408 more</span>
  </div>
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ApprovalCard } = ui;
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const [round, setRound] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>("email");
  const show = (k: Kind) => {
    setKind(k);
    setStatus("pending");
    setNote(null);
    setRound((r) => r + 1);
  };

  // A new request a few seconds after each decision
  useEffect(() => {
    if (status === "pending") return;
    const t = setTimeout(() => {
      setStatus("pending");
      setNote(null);
      setRound((r) => r + 1);
    }, 4500);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <div style={{ width: "100%", maxWidth: 460, display: "grid", gap: 10 }}>
      {kind === "email" ? (
        <ApprovalCard
          key={round}
          label="Step 4 · mailchimp.send_campaign"
          title="Send campaign email"
          description="The October product update goes out to every active customer on the Team plan."
          risk="high"
          icon={<MailIcon />}
          preview={<Recipients />}
          details={[
            { label: "Subject", value: "What's new in October – annual billing is here" },
            { label: "Audience", value: "2,412 contacts · Team plan" },
            { label: "Scheduled", value: "Now" },
          ]}
          status={status}
          onApprove={({ always }) =>
            new Promise<void>((resolve) =>
              setTimeout(() => {
                setStatus("approved");
                setNote(always ? "Approved – and future sends won't ask again." : "Approved – the campaign is on its way.");
                resolve();
              }, 1200),
            )
          }
          onDeny={({ reason }) => {
            setStatus("denied");
            setNote(reason === "timeout" ? "The request expired and was denied." : "Denied – nothing was sent.");
          }}
          onEdit={() => setNote("Opening the draft in the editor…")}
          expiresIn={45}
          allowAlways
          shortcuts
        />
      ) : (
        <ApprovalCard
          key={round}
          label={kind === "diff" ? "Step 3 · files.write" : "Step 5 · datasets.migrate"}
          title={kind === "diff" ? "Move the embargo forward a week" : "Run the station ID migration"}
          description={kind === "diff" ? "The report goes public on November 13 instead of November 20." : "Merges duplicate station IDs in this year's survey data."}
          risk={kind === "diff" ? "medium" : "high"}
          diff={kind === "diff" ? EMBARGO : undefined}
          args={kind === "args" ? MIGRATION : undefined}
          allowAlways={false}
          status={status}
          onApprove={() => {
            setStatus("approved");
            setNote(kind === "diff" ? "Approved – the config change is committed." : "Approved – the migration is running.");
          }}
          onDeny={() => {
            setStatus("denied");
            setNote("Denied – nothing changed.");
          }}
        />
      )}
      <div style={{ minHeight: 18, fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center" }}>{note}</div>
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        Show a request with{" "}
        <button type="button" style={textButton} onClick={() => show("diff")}>a file change</button>,{" "}
        <button type="button" style={textButton} onClick={() => show("args")}>a call's arguments</button> or{" "}
        <button type="button" style={textButton} onClick={() => show("email")}>a preview</button>
      </p>
    </div>
  );
}

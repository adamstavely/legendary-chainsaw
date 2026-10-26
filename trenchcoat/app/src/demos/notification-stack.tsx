import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { textButton } from "../demo-kit";

const NOTICES: UI.Notice[] = [
  {
    id: "maintenance",
    badge: "Notice",
    title: "Scheduled maintenance on Sunday",
    text: "The dashboard will be read-only from 02:00 to 03:30 UTC while we upgrade the database.",
    action: { label: "View status page", href: "https://status.example.com", external: true },
    pattern: "orbit",
  },
  {
    id: "export",
    badge: "New",
    title: "CSV exports are here",
    text: "Download any report as a spreadsheet – filters and column order come along.",
    action: { label: "Try it", onClick: () => {} },
    pattern: "grid",
  },
  {
    id: "seats",
    badge: "Billing",
    title: "You're using 9 of 10 seats",
    text: "Add seats before inviting more teammates so nobody gets stuck at sign-in.",
    action: { label: "Manage seats", onClick: () => {} },
    pattern: "rays",
  },
  {
    id: "security",
    badge: "Security",
    title: "Turn on two-factor sign-in",
    text: "Workspaces with 2FA enabled block over 99% of account takeover attempts.",
    action: { label: "Set up 2FA", onClick: () => {} },
    pattern: "orbit",
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { NotificationStack } = ui;
  const [round, setRound] = useState(0);
  const [left, setLeft] = useState(NOTICES.length);
  const [last, setLast] = useState<string | null>(null);

  return (
    <div style={{ width: "100%", maxWidth: 380, display: "grid", gap: 14, justifyItems: "center" }}>
      <div style={{ width: "100%", minHeight: 210 }}>
        <NotificationStack
          key={round}
          notices={NOTICES}
          onDismiss={(n) => {
            setLast(n.title);
            setLeft((c) => c - 1);
          }}
        />
      </div>
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center" }} aria-live="polite">
        {left > 0 ? (last ? `Dismissed “${last}” · ${left} left` : `${left} notices – dismiss the front one`) : "All caught up. "}
        {left < NOTICES.length && (
          <button
            type="button"
            onClick={() => {
              setRound((r) => r + 1);
              setLeft(NOTICES.length);
              setLast(null);
            }}
            style={{ ...textButton, marginLeft: 6 }}
          >
            Restore
          </button>
        )}
      </div>
    </div>
  );
}

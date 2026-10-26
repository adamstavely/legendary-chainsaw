import { useState } from "react";
import type * as UI from "@components/tips-panel";
import { textButton } from "../demo-kit";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TipsPanel, Kbd } = ui;
  const [round, setRound] = useState(0);
  const [log, setLog] = useState("Take an action – the tip marks itself done");
  const [closed, setClosed] = useState(false);

  const tips: UI.Tip[] = [
    {
      id: "palette",
      title: "Open anything fast",
      description: (
        <>
          Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to jump to any project, doc or setting.
        </>
      ),
      action: "Try it",
      doneLabel: "Tried",
      primary: true,
      onAction: () => setLog("Command palette opened"),
    },
    {
      id: "digest",
      title: "Daily digest",
      description: "Get one calm summary each morning instead of a ping for every change.",
      action: "Turn on",
      doneLabel: "Enabled",
      onAction: () => setLog("Daily digest enabled"),
    },
    {
      id: "dark",
      title: "Match your system",
      description: "Follow your OS theme so the app goes dark when you do.",
      action: "Use system theme",
      doneLabel: "Following system",
      onAction: () => setLog("Theme now follows the system"),
    },
    {
      id: "mobile",
      title: "Take it with you",
      description: "Scan a QR code to sign in on your phone in seconds.",
      action: "Show QR code",
      doneLabel: "Shown",
      onAction: () => setLog("QR code shown"),
    },
    {
      id: "shortcuts",
      title: "Learn the shortcuts",
      description: (
        <>
          Press <Kbd>?</Kbd> anywhere to see every keyboard shortcut.
        </>
      ),
      action: "View list",
      doneLabel: "Viewed",
      onAction: () => setLog("Shortcut list opened"),
    },
    {
      id: "import",
      title: "Bring your data",
      description: "Import tasks from Trello, Asana or a CSV file in one go.",
      action: "Import",
      doneLabel: "Imported",
      onAction: () => setLog("Import started"),
    },
  ];

  const link = { ...textButton, marginLeft: 6 };

  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 12, justifyItems: "center" }}>
      {closed ? (
        <div style={{ fontSize: 13, color: "var(--tc-text-secondary, light-dark(#404040, #c8c8cc))", padding: "40px 0" }}>
          Tips closed.
          <button
            type="button"
            onClick={() => {
              setClosed(false);
              setRound((r) => r + 1);
            }}
            style={link}
          >
            Show tips
          </button>
        </div>
      ) : (
        <>
          <div style={{ width: "100%" }}>
            <TipsPanel key={round} title="Tips for getting started" tips={tips} onClose={() => setClosed(true)} closeLabel="Done" />
          </div>
          <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center" }} aria-live="polite">
            {log}
            <button
              type="button"
              onClick={() => {
                setRound((r) => r + 1);
                setLog("Take an action – the tip marks itself done");
              }}
              style={link}
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}

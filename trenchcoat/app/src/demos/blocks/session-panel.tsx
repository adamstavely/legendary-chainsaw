import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import type { ChangeItem, EnvironmentItem, IconRailItem } from "../../../../src/elements/react";
import { caption } from "../../demo-kit";

/* A session working on a research institute's sample tracker. Icons are from Lucide (ISC). */

const TOOLS: IconRailItem[] = [
  { id: "overview", label: "Overview", icon: ["M3 5h18v14H3z", "M7 9h6", "M7 13h10"] },
  { id: "terminal", label: "Terminal", icon: ["m4 17 6-6-6-6", "M12 19h8"] },
  { id: "browser", label: "Browser", icon: ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20", "M2 12h20", "M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20"] },
  { id: "files", label: "Files", icon: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" },
];
const WHERE: EnvironmentItem[] = [
  { id: "machine", kind: "computer", label: "This computer", action: { id: "save", label: "Save" } },
  { id: "project", kind: "folder", label: "sample-tracker", detail: "~/institute" },
  { id: "repo", kind: "repo", label: "institute/sample-tracker" },
  { id: "branch", kind: "branch", label: "cold-chain-alerts" },
  { id: "remote", kind: "custom", icon: "M3 3l7 18 2.5-7.5L20 11Z", label: "Remote control", toggle: true },
];
const CHANGES: ChangeItem[] = [
  { id: "a", title: "Alert when a freezer's log has a gap", repo: "sample-tracker", number: 214, state: "open", additions: 682, deletions: 91, checks: { passing: 5, failing: 0, pending: 6, skipped: 0 } },
  { id: "b", title: "Move barcode parsing into one module", repo: "sample-tracker", number: 209, state: "merged" },
  { id: "c", title: "Label printer: draft of the new layout", repo: "label-service", number: 37, state: "draft", additions: 48, deletions: 12 },
  { id: "d", title: "Add chain-of-custody export", repo: "sample-tracker", number: 201, state: "merged" },
  { id: "e", title: "Retire the old import script", repo: "sample-tracker", number: 188, state: "closed" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SessionPanel } = ui;
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 340, display: "grid", gap: 8 }}>
      <SessionPanel
        tools={TOOLS}
        defaultTool="overview"
        moreTools={[{ id: "export", label: "Export the session" }]}
        environment={WHERE}
        defaultToggles={{ remote: true }}
        context={0.17}
        connectors="3 to reconnect"
        outputs="51"
        changes={CHANGES}
        changeActions={[{ id: "copy", label: "Copy link" }]}
        changeLimit={3}
        background="4 running"
        onTcSectionOpen={(e) => setNote(`Open the details for ${e.detail.section}.`)}
        onTcOpen={(e) => setNote(`Open “${e.detail.item.title}”.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>{note || "Fold a section, or press a row: the page decides what opens."}</div>
    </div>
  );
}

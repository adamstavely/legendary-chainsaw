import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import type { ChangeItem, DiffFile, EnvironmentItem, IconRailItem } from "../../../../src/elements/react";
import { caption } from "../../demo-kit";

/* A session working on a research institute's sample tracker. Icons are from Lucide (ISC). */

const TOOLS: IconRailItem[] = [
  { id: "overview", label: "Overview", icon: ["M3 5h18v14H3z", "M7 9h6", "M7 13h10"] },
  { id: "terminal", label: "Terminal", icon: ["m4 17 6-6-6-6", "M12 19h8"] },
  { id: "changes", label: "Changes", icon: ["M12 3v14", "M5 10h14", "M5 21h14"] },
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

const EDITS: DiffFile[] = [
  { path: "src/alerts/gaps.ts", before: "export const LIMIT = HOUR;\nexport const CHANNEL = 'email';\n", after: "export const LIMIT = 2 * HOUR;\nexport const CHANNEL = 'email';\nexport const REPEAT = DAY;\n" },
  { path: "tests/gaps.test.ts", after: 'test("repeats after a day", () => {\n  expect(REPEAT).toBe(DAY);\n});\n' },
];
const PRINTED = "\x1b[2m~/institute/sample-tracker\x1b[0m\n$ npm test\n \x1b[32m✓\x1b[0m tests/gaps.test.ts (7)\n\n\x1b[1mTests\x1b[0m  \x1b[32m7 passed\x1b[0m\n";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DiffViewer, SessionPanel, Terminal } = ui;
  const [note, setNote] = useState("");
  const [tool, setTool] = useState<string | null>("overview");
  const [printed, setPrinted] = useState(PRINTED);
  return (
    <div style={{ width: "100%", maxWidth: tool === "terminal" || tool === "changes" ? 980 : 340, display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center", gap: 8 }}>
      <div style={{ flex: "1 1 280px", maxWidth: 340, minWidth: 0, display: "grid", gap: 8 }}>
      <SessionPanel
        tools={TOOLS}
        tool={tool}
        onToolChange={setTool}
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
      {tool === "terminal" ? (
        <div style={{ flex: "2 1 320px", minWidth: 0 }}>
          <Terminal output={printed} height={420} onTcCommand={(e) => setPrinted((p) => `${p}$ ${e.detail.command}\n`)} onTcClear={() => setPrinted("")} />
        </div>
      ) : null}
      {tool === "changes" ? (
        <div style={{ flex: "2 1 320px", minWidth: 0 }}>
          <DiffViewer description="cold-chain-alerts, compared with main" files={EDITS} />
        </div>
      ) : null}
    </div>
  );
}

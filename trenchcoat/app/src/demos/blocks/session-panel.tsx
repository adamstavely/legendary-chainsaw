import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import type { BranchItem, ChangeItem, DiffFile, EnvironmentItem, IconRailItem, ProblemItem, ProcessItem, SearchResultsFile, SessionItem } from "../../../../src/elements/react";
import { caption } from "../../demo-kit";

/* A session working on a research institute's sample tracker. Icons are from Lucide (ISC). */

const TOOLS: IconRailItem[] = [
  { id: "overview", label: "Overview", icon: ["M3 5h18v14H3z", "M7 9h6", "M7 13h10"] },
  { id: "sessions", label: "Sessions", icon: ["M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z", "M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"] },
  { id: "terminal", label: "Terminal", icon: ["m4 17 6-6-6-6", "M12 19h8"] },
  { id: "changes", label: "Changes", icon: ["M12 3v14", "M5 10h14", "M5 21h14"] },
  { id: "browser", label: "Browser", icon: ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20", "M2 12h20", "M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20"] },
  { id: "files", label: "Files", icon: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" },
  { id: "search", label: "Search", icon: ["m21 21-4.34-4.34", "M11 3a8 8 0 1 0 0 16a8 8 0 1 0 0-16"] },
  { id: "problems", label: "Problems", icon: ["m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3", "M12 9v4", "M12 17h.01"] },
  { id: "processes", label: "Processes", icon: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" },
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
/** What the demo's files say, for its search */
const TEXT: Record<string, string> = {
  "src/alerts/gaps.ts": EDITS[0].after!,
  "src/alerts/notify.ts": "import { CHANNEL, REPEAT } from './gaps';\nexport function notify(freezer: string) {\n  send(CHANNEL, `Gap in ${freezer}'s log`, { repeat: REPEAT });\n}\n",
  "tests/gaps.test.ts": EDITS[1].after!,
  "README.md": "# Sample tracker\nAlerts repeat once a day until someone answers.\n",
};
const PATHS = Object.keys(TEXT).concat("package.json");
const PRINTED = "\x1b[2m~/institute/sample-tracker\x1b[0m\n$ npm test\n \x1b[32m✓\x1b[0m tests/gaps.test.ts (7)\n\n\x1b[1mTests\x1b[0m  \x1b[32m7 passed\x1b[0m\n";

const NOW = Date.UTC(2026, 10, 2, 15, 0);
const M = 60_000;
const SESSIONS: SessionItem[] = [
  { id: "s1", title: "Cold-chain alerts", status: "running", project: "sample-tracker", branch: "cold-chain-alerts", updated: NOW - M, detail: "Running tests" },
  { id: "s2", title: "Booking calendar for instrument pages", status: "waiting", project: "sample-tracker", branch: "feature/booking-calendar", updated: NOW - 4 * M, unread: true, detail: "Wants to run the migrations" },
  { id: "s3", title: "Label printer layout", status: "idle", project: "label-service", branch: "label-layout", updated: NOW - 3 * 60 * M },
];
const BRANCHES: BranchItem[] = [
  { name: "cold-chain-alerts", kind: "worktree", ahead: 3, behind: 1, updated: NOW - M, dirty: true, path: "~/institute/.worktrees/cold-chain" },
  { name: "main", kind: "local", updated: NOW - 2 * 60 * M },
  { name: "feature/booking-calendar", kind: "local", ahead: 7, updated: NOW - 4 * M },
  { name: "origin/fix/sample-export", kind: "remote", behind: 2, updated: NOW - 26 * 60 * M },
];
const PROBLEMS: ProblemItem[] = [
  { path: "src/alerts/notify.ts", line: 3, column: 3, severity: "error", message: "Cannot find name 'send'.", source: "ts", code: "TS2304", fix: "Import send" },
  { path: "src/alerts/gaps.ts", line: 3, column: 14, severity: "warning", message: "'REPEAT' is exported but only used in tests.", source: "eslint" },
  { path: "README.md", line: 2, severity: "info", message: "Line is longer than 80 characters.", source: "markdownlint", code: "MD013" },
];
const PROCESSES: ProcessItem[] = [
  { id: "web", name: "Dev server", command: "npm run dev", status: "running", port: 5173, url: "http://localhost:5173/", started: NOW - 42 * M, lastLine: "ready in 412 ms" },
  { id: "tests", name: "Test watcher", command: "npm test -- --watch", status: "running", started: NOW - 40 * M, lastLine: "7 passed" },
  { id: "api", name: "API", command: "npm run api", status: "crashed", port: 8080, exitCode: 1, lastLine: "Error: listen EADDRINUSE :::8080" },
];

/** Every line that holds the query, without case, the way a simple search in files would */
function search(query: string): SearchResultsFile[] {
  const q = query.toLowerCase();
  if (!q) return [];
  return Object.entries(TEXT)
    .map(([path, text]) => ({
      path,
      matches: text.split("\n").flatMap((line, i) => {
        const at = line.toLowerCase().indexOf(q);
        return at < 0 ? [] : [{ line: i + 1, column: at + 1, text: line, ranges: [[at, at + q.length]] as [number, number][] }];
      }),
    }))
    .filter((f) => f.matches.length);
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BranchSwitcher, DiffViewer, FileTree, PreviewFrame, ProblemList, ProcessList, PullRequest, SearchResults, SessionList, SessionPanel, Terminal, fileTreeFromPaths } = ui;
  const [note, setNote] = useState("");
  const [tool, setTool] = useState<string | null>("overview");
  const [printed, setPrinted] = useState(PRINTED);
  const [query, setQuery] = useState("repeat");
  const [branch, setBranch] = useState("cold-chain-alerts");
  const where: EnvironmentItem[] = [
    { id: "machine", kind: "computer", label: "This computer", action: { id: "save", label: "Save" } },
    { id: "project", kind: "folder", label: "sample-tracker", detail: "~/institute" },
    { id: "repo", kind: "repo", label: "institute/sample-tracker" },
    { id: "branch", kind: "branch", label: branch, action: { id: "switch", label: "Switch" } },
    { id: "remote", kind: "custom", icon: "M3 3l7 18 2.5-7.5L20 11Z", label: "Remote control", toggle: true },
  ];
  const opened = (path: string, line?: number) => setNote(`Open ${path}${line ? ` at line ${line}` : ""}.`);
  const view = (() => {
    switch (tool) {
      case "sessions":
        return <SessionList sessions={SESSIONS} defaultSelected="s1" now={NOW} onTcCreate={() => setNote("Start a new session.")} />;
      case "terminal":
        return <Terminal output={printed} height={420} onTcCommand={(e) => setPrinted((p) => `${p}$ ${e.detail.command}\n`)} onTcClear={() => setPrinted("")} />;
      case "changes":
        return <DiffViewer description={`${branch}, compared with main`} files={EDITS} />;
      case "browser":
        return (
          <PreviewFrame url="http://localhost:5173/freezers" consoleCount={{ errors: 0, warnings: 1 }} height={380} onTcConsole={() => setNote("Show the console.")}>
            <div style={{ padding: 24, display: "grid", alignContent: "start", gap: 8, fontFamily: "var(--tc-font-sans)", color: "var(--tc-text-primary)" }}>
              <strong style={{ fontSize: 20 }}>Freezers</strong>
              <span style={{ color: "var(--tc-text-secondary)" }}>Freezer B-12: a 3-hour gap in its log. The team was told at 14:02.</span>
            </div>
          </PreviewFrame>
        );
      case "files":
        return (
          <FileTree
            description="sample-tracker"
            nodes={fileTreeFromPaths(PATHS)}
            defaultExpanded={["src", "src/alerts"]}
            searchable
            onTcOpen={(e) => opened(e.detail.path)}
            onTcSearch={(e) => {
              setQuery(e.detail.query);
              setTool("search");
            }}
          />
        );
      case "search":
        return <SearchResults query={query} results={search(query)} status="done" onTcSearch={(e) => setQuery(e.detail.query)} onTcOpen={(e) => opened(e.detail.path, e.detail.line)} />;
      case "problems":
        return <ProblemList problems={PROBLEMS} onTcOpen={(e) => opened(e.detail.path, e.detail.line)} onTcFix={(e) => setNote(`${e.detail.problem.fix}.`)} />;
      case "processes":
        return <ProcessList processes={PROCESSES} now={NOW} onTcOpen={() => setTool("browser")} onTcRestart={(e) => setNote(`Restart ${e.detail.process.name}.`)} />;
      case "pr":
        return (
          <PullRequest
            number={214}
            prTitle="Alert when a freezer's log has a gap"
            state="open"
            head={branch}
            base="main"
            author="Ines Okafor"
            updatedAt={NOW - 12 * M}
            now={NOW}
            additions={682}
            deletions={91}
            files={14}
            review="requested"
            checks={{ passing: 5, failing: 0, pending: 6, skipped: 0 }}
            mergeable="behind"
            onTcMerge={() => setNote("Merge #214.")}
            onTcUpdateBranch={() => setNote("Bring main into the branch.")}
          />
        );
      case "branch":
        return <BranchSwitcher inline branches={BRANCHES} current={branch} base="main" now={NOW} onCurrentChange={(name) => setBranch(name)} onTcCreate={(e) => setNote(`Create ${e.detail.name} from ${e.detail.from}.`)} />;
      default:
        return null;
    }
  })();
  return (
    <div style={{ width: "100%", maxWidth: view ? 980 : 340, display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center", gap: 8 }}>
      <div style={{ flex: "1 1 280px", maxWidth: 340, minWidth: 0, display: "grid", gap: 8 }}>
        <SessionPanel
          tools={TOOLS}
          tool={tool}
          onToolChange={setTool}
          moreTools={[{ id: "export", label: "Export the session" }]}
          environment={where}
          defaultToggles={{ remote: true }}
          context={0.17}
          connectors="3 to reconnect"
          outputs="51"
          changes={CHANGES}
          changeActions={[{ id: "copy", label: "Copy link" }]}
          changeLimit={3}
          background="4 running"
          onTcSectionOpen={(e) => setNote(`Open the details for ${e.detail.section}.`)}
          onTcAction={(e) => {
            if ("itemId" in e.detail && e.detail.itemId === "branch") setTool("branch");
          }}
          onTcOpen={(e) => (e.detail.item.id === "a" ? setTool("pr") : setNote(`Open “${e.detail.item.title}”.`))}
        />
        <div style={{ ...caption, textAlign: "center" }}>{note || "Pick a tool, Switch the branch or press the open pull request: the page decides what opens."}</div>
      </div>
      {view ? <div style={{ flex: "2 1 320px", minWidth: 0 }}>{view}</div> : null}
    </div>
  );
}

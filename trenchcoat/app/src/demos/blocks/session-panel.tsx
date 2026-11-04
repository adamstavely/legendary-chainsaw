import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import type {
  BranchItem,
  ChangeItem,
  ConsoleEntry,
  DiffFile,
  EnvironmentItem,
  IconRailItem,
  InspectorDetails,
  InspectorNode,
  NetworkRequest,
  ProblemItem,
  ProcessItem,
  RouteItem,
  SearchResultsFile,
  SessionItem,
  WebVital,
} from "../../../../src/elements/react";
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

// What the browser view's tools show about the page being built
const DEVTOOLS = [
  { value: "console", label: "Console" },
  { value: "network", label: "Network" },
  { value: "elements", label: "Elements" },
  { value: "vitals", label: "Vitals" },
  { value: "routes", label: "Routes" },
];
const LOGGED: ConsoleEntry[] = [
  { id: "c1", level: "info", message: "[vite] connected.", source: "client:912", time: NOW - 3 * M },
  { id: "c2", level: "warn", message: "Freezer B-12 has no reading for 3 h – showing the gap.", source: "freezers.tsx:48", time: NOW - 2 * M, count: 3 },
  { id: "c3", level: "log", message: "Loaded 24 freezers in 182 ms", source: "api.ts:21", time: NOW - 2 * M },
];
const REQUESTS: NetworkRequest[] = [
  { id: "n1", method: "GET", url: "http://localhost:5173/freezers", status: 200, type: "document", size: 2_140, start: 0, duration: 38 },
  { id: "n2", method: "GET", url: "http://localhost:5173/src/main.tsx", status: 200, type: "script", size: 48_200, start: 42, duration: 96 },
  { id: "n3", method: "GET", url: "http://localhost:5173/api/freezers", status: 200, type: "fetch", size: 6_310, start: 150, duration: 182, body: { freezers: 24, gaps: [{ id: "B-12", hours: 3 }] } },
  { id: "n4", method: "GET", url: "http://localhost:8080/api/alerts", status: 0, type: "fetch", start: 152, duration: 12 },
];
const PAGE: InspectorNode[] = [
  {
    id: "main",
    tag: "main",
    attrs: { class: "page" },
    children: [
      { id: "title", tag: "h1", text: "Freezers" },
      { id: "gap", tag: "p", attrs: { class: "gap-note" }, text: "Freezer B-12: a 3-hour gap in its log." },
    ],
  },
];
const PAGE_DETAILS: Record<string, InspectorDetails> = {
  title: { box: { width: 520, height: 28, margin: [0, 0, 8, 0], padding: [0, 0, 0, 0] }, styles: [{ property: "font-size", value: "20px", source: "page.css:4" }, { property: "font-weight", value: "600", source: "page.css:5" }] },
  gap: { box: { width: 520, height: 20, margin: [0, 0, 0, 0], padding: [0, 0, 0, 0] }, styles: [{ property: "color", value: "var(--text-secondary)", source: "freezers.css:12" }] },
};
const VITALS: WebVital[] = [
  { id: "lcp", value: 1840, unit: "ms", history: [2600, 2300, 2100, 1900, 1840] },
  { id: "inp", value: 240, unit: "ms", history: [180, 210, 260, 230, 240] },
  { id: "cls", value: 0.02, unit: "", history: [0.08, 0.05, 0.03, 0.02, 0.02] },
];
const ROUTES: RouteItem[] = [
  { id: "home", path: "/", name: "Home", status: "ok", lastVisited: NOW - 30 * M, loadMs: 140 },
  {
    id: "freezers",
    path: "/freezers",
    name: "Freezers",
    status: "ok",
    lastVisited: NOW - 2 * M,
    loadMs: 380,
    children: [{ id: "freezer", path: "/freezers/:id", name: "One freezer", status: "slow", lastVisited: NOW - 20 * M, loadMs: 1_900 }],
  },
  { id: "alerts", path: "/alerts", name: "Alerts", status: "error", lastVisited: NOW - 5 * M },
  { id: "bookings", path: "/bookings", name: "Bookings", status: "unvisited" },
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
  const {
    BranchSwitcher,
    ConsolePanel,
    DiffViewer,
    ElementInspector,
    FileTree,
    NetworkLog,
    PreviewFrame,
    ProblemList,
    ProcessList,
    PullRequest,
    RouteMap,
    SearchResults,
    SegmentedControl,
    SessionList,
    SessionPanel,
    Terminal,
    WebVitals,
    fileTreeFromPaths,
  } = ui;
  const [devtool, setDevtool] = useState("console");
  const [logged, setLogged] = useState(LOGGED);
  const [inspected, setInspected] = useState<string | null>("gap");
  const [outlined, setOutlined] = useState<string | null>(null);
  const [route, setRoute] = useState(ROUTES[1]);
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
      case "browser": {
        // The element under the inspector's pointer is outlined in the page, the way a browser's tools do it
        const outline = (id: string) => (outlined === id ? { outline: "var(--tc-focus-outline)", outlineOffset: "var(--tc-focus-ring-offset)" } : undefined);
        const tally = (level: ConsoleEntry["level"]) => logged.reduce((n, c) => n + (c.level === level ? (c.count ?? 1) : 0), 0);
        const tools = (() => {
          switch (devtool) {
            case "network":
              return <NetworkLog requests={REQUESTS} defaultSelected="n3" maxHeight={260} />;
            case "elements":
              return (
                <ElementInspector
                  nodes={PAGE}
                  defaultExpanded={["main"]}
                  selected={inspected}
                  onSelectedChange={(id) => setInspected(id)}
                  details={inspected ? (PAGE_DETAILS[inspected] ?? null) : null}
                  onTcHighlight={(e) => setOutlined(e.detail.id)}
                  maxHeight={260}
                />
              );
            case "vitals":
              return <WebVitals description={route.path} metrics={VITALS} defaultDevice="desktop" />;
            case "routes":
              return (
                <RouteMap
                  routes={ROUTES}
                  selected={route.id}
                  now={NOW}
                  maxHeight={260}
                  onTcOpen={(e) => setRoute(e.detail.route)}
                />
              );
            default:
              return <ConsolePanel entries={logged} maxHeight={260} onTcClear={() => setLogged([])} />;
          }
        })();
        return (
          <div style={{ display: "grid", gap: 8 }}>
            <PreviewFrame
              url={`http://localhost:5173${route.path}`}
              consoleCount={{ errors: tally("error"), warnings: tally("warn") }}
              height={240}
              onTcConsole={() => setDevtool("console")}
            >
              <div style={{ padding: 24, display: "grid", alignContent: "start", gap: 8, fontFamily: "var(--tc-font-sans)", color: "var(--tc-text-primary)" }}>
                <strong style={{ fontSize: 20, ...outline("title") }}>{route.name}</strong>
                {route.id === "freezers" ? (
                  <span style={{ color: "var(--tc-text-secondary)", ...outline("gap") }}>Freezer B-12: a 3-hour gap in its log. The team was told at 14:02.</span>
                ) : null}
              </div>
            </PreviewFrame>
            <SegmentedControl aria-label="Page tools" size="sm" value={devtool} onChange={setDevtool} options={DEVTOOLS} />
            {tools}
          </div>
        );
      }
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
            // Only the environment's branch row: a change could be called "branch" too
            const fromEnvironment = e.target instanceof Element && e.target.closest("tc-environment-list");
            if (fromEnvironment && "itemId" in e.detail && e.detail.itemId === "branch") setTool("branch");
          }}
          onTcOpen={(e) => (e.detail.item.id === "a" ? setTool("pr") : setNote(`Open “${e.detail.item.title}”.`))}
        />
        <div style={{ ...caption, textAlign: "center" }}>{note || "Pick a tool, Switch the branch or press the open pull request: the page decides what opens."}</div>
      </div>
      {view ? <div style={{ flex: "2 1 320px", minWidth: 0 }}>{view}</div> : null}
    </div>
  );
}

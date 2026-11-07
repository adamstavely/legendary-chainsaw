import { useEffect, useRef, useState, type ReactNode } from "react";
import type * as UI from "../../../src/elements/react";
import type { ToolAccessAgent, ToolAccessCall, ToolAccessTool } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's data steward agent, cleaning and loading the November field surveys, with every
   tool it can reach: the ones it used, one that failed, one it's calling now, one it hasn't touched and three it has
   no access to. A second agent, the report writer, has its own tools behind the tab. */

const BASE = Date.UTC(2026, 10, 6, 14, 2, 0);

/** Small stroke icons the page brings: Lucide (ISC, lucide.dev) */
const icon = (...paths: string[]): ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {paths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);
const ICONS = {
  repo: icon("M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4", "M9 18c-4.51 2-5-2-7-2"),
  terminal: icon("m4 17 6-6-6-6", "M12 19h8"),
  sheet: icon("M3 3h18v18H3z", "M3 9h18", "M3 15h18", "M9 3v18"),
  database: icon("M3 5c0 1.66 4 3 9 3s9-1.34 9-3-4-3-9-3-9 1.34-9 3", "M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5", "M3 12c0 1.66 4 3 9 3s9-1.34 9-3"),
  search: icon("m21 21-4.34-4.34", "M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16"),
  notebook: icon("M2 6h4", "M2 10h4", "M2 14h4", "M2 18h4", "M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6z", "M9.5 8h5", "M9.5 12H16"),
  mail: icon("m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7", "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2"),
  calendar: icon("M8 2v4", "M16 2v4", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2", "M3 10h18"),
  archive: icon("M3 3h18v5H3z", "M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8", "M10 12h4"),
  chart: icon("M3 3v16a2 2 0 0 0 2 2h16", "M18 17V9", "M13 17V5", "M8 17v-3"),
  doc: icon("M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v4a2 2 0 0 0 2 2h4", "M10 13H8", "M16 17H8"),
};

const call = (id: string, min: number, ms: number | undefined, status: ToolAccessCall["status"], label: string, args?: unknown, result?: unknown): ToolAccessCall => ({
  id,
  at: BASE + min * 60_000,
  ms,
  status,
  label,
  args,
  result,
});

const STEWARD_TOOLS: ToolAccessTool[] = [
  {
    id: "repo",
    name: "Repository",
    icon: ICONS.repo,
    detail: "The import scripts and the survey schema.",
    calls: [
      call("r1", 0, 610, "ok", "read parse.py", { path: "import/parse.py" }, "184 lines"),
      call("r2", 3, 520, "ok", "read schema.yaml", { path: "import/schema.yaml" }, "23 fields, updated 3 Nov"),
    ],
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: ICONS.terminal,
    detail: "A sandbox shell on the import server.",
    calls: [call("t1", 5, 4200, "failed", "run the import for batch 7", { command: "python import.py --batch 7 --dry-run" }, "ValueError: could not convert 'JT' to float (column 7, row 2)")],
  },
  { id: "sheet", name: "Spreadsheet", icon: ICONS.sheet, detail: "The survey team's shared sheets.", calls: [call("s1", 7, 730, "ok", "open the November field log", { sheet: "Field log – Nov" }, "12 tabs, 1,284 rows")] },
  { id: "database", name: "Database", icon: ICONS.database, detail: "The survey warehouse, read only.", calls: [call("d1", 8, 280, "ok", "count samples by batch", { query: "select batch, count(*) from samples where month = '2026-11' group by batch" }, "12 rows")] },
  { id: "search", name: "Web search", short: "Search", icon: ICONS.search, detail: "Public web search." },
  { id: "notebook", name: "Lab notebook", short: "Notebook", icon: ICONS.notebook, detail: "The field team's notes for each survey day.", calls: [call("n1", 10, undefined, "running", "find notes on the new observer column", { search: "observer column November" })] },
  { id: "mail", name: "Mail", icon: ICONS.mail, access: "none", detail: "The institute's mail." },
  { id: "calendar", name: "Calendar", icon: ICONS.calendar, access: "none", detail: "Team calendars." },
  { id: "archive", name: "Archive", icon: ICONS.archive, access: "none", detail: "Published datasets – changes need a person." },
];

const WRITER_TOOLS: ToolAccessTool[] = [
  { id: "docs", name: "Documents", icon: ICONS.doc, calls: [call("w1", 2, 940, "ok", "open the monthly report template", { file: "Monthly survey report.docx" }, "6 sections")] },
  { id: "charts", name: "Charts", icon: ICONS.chart, calls: [call("w2", 4, 1800, "ok", "draw samples by station", { series: "samples", by: "station" }, "1 bar chart")] },
  { id: "database", name: "Database", icon: ICONS.database },
  { id: "mail", name: "Mail", icon: ICONS.mail, access: "none" },
];

const AGENTS: Record<string, ToolAccessAgent> = {
  steward: { id: "steward", name: "Data steward", model: "Reasoning model", status: "running", task: "Load the November field surveys" },
  writer: { id: "writer", name: "Report writer", model: "Fast model", status: "idle", task: "Draft the monthly survey report" },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ToolAccessMap } = ui;
  const [agentId, setAgentId] = useState("steward");
  const [steward, setSteward] = useState(STEWARD_TOOLS);
  const [selected, setSelected] = useState<string | null>("terminal");
  const [note, setNote] = useState("");
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const tools = agentId === "steward" ? steward : WRITER_TOOLS;
  const searchNow = () => {
    const id = "q1";
    setSteward((ts) => ts.map((t) => (t.id === "search" ? { ...t, calls: [...(t.calls ?? []), call(id, 12, undefined, "running", "search: survey CSV observer column")] } : t)));
    timers.current.push(
      window.setTimeout(
        () => setSteward((ts) => ts.map((t) => (t.id === "search" ? { ...t, calls: (t.calls ?? []).map((c) => (c.id === id ? { ...c, status: "ok", ms: 1650, result: "3 results" } : c)) } : t))),
        2400,
      ),
    );
  };
  return (
    <div style={{ width: "100%", maxWidth: 920, display: "grid", gap: 8 }}>
      <ToolAccessMap
        title="Tool access"
        description="What each agent can reach, and what it has used."
        agents={[
          { id: "steward", name: "Data steward" },
          { id: "writer", name: "Report writer" },
        ]}
        agentId={agentId}
        onAgentIdChange={(id) => {
          setAgentId(id ?? "steward");
          setSelected(null);
        }}
        agent={AGENTS[agentId]}
        tools={tools}
        selected={selected}
        onSelectedChange={setSelected}
        onReplay={(tool, c) => {
          setNote(`Replaying “${c.label ?? c.id}” on ${tool.name}…`);
          return new Promise<void>((done) =>
            timers.current.push(
              window.setTimeout(() => {
                setNote(`Replayed “${c.label ?? c.id}” on ${tool.name}.`);
                done();
              }, 1200),
            ),
          );
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || "Open a tool for its calls; Replay runs one again on its own. "}
        {agentId === "steward" && !steward.find((t) => t.id === "search")?.calls?.length ? (
          <button type="button" style={textButton} onClick={searchNow}>
            Call the web search
          </button>
        ) : null}
      </div>
    </div>
  );
}

import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ProcessItem, ProcessStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The processes behind a research institute's sample tracker while someone works on it. The demo changes the statuses
   itself; nothing runs. A fixed clock keeps the uptimes steady. */

const NOW = Date.UTC(2026, 9, 12, 9, 30);
const min = 60_000;
const START: ProcessItem[] = [
  { id: "web", name: "web", command: "vite --port 5173", status: "running", port: 5173, pid: 41822, started: NOW - 47 * min, cpu: 6, memory: 182_000_000, lastLine: "\x1b[32m✓\x1b[0m page reload src/freezers/map.tsx" },
  { id: "api", name: "api", command: "node server/index.mjs", status: "running", port: 8080, pid: 41830, started: NOW - 2 * 60 * min - 5 * min, cpu: 2, memory: 96_000_000, lastLine: "GET /api/samples?freezer=F4 200 18ms" },
  { id: "tests", name: "tests", command: "vitest --watch", status: "running", pid: 41907, started: NOW - 12 * min, cpu: 0, memory: 141_000_000, lastLine: "Waiting for file changes…" },
  { id: "docs", name: "docs", command: "component-docs dev --port 6006", status: "crashed", port: 6006, exitCode: 1, lastLine: "\x1b[31mError:\x1b[0m Cannot find module './stories/freezer-map'" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ProcessList } = ui;
  const [processes, setProcesses] = useState(START);
  const [said, setSaid] = useState("Stop, start or restart a process, or open a port.");
  const set = (id: string, status: ProcessStatus, extra: Partial<ProcessItem> = {}) =>
    setProcesses((all) => all.map((p) => (p.id === id ? { ...p, status, ...extra } : p)));
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <ProcessList
        description="~/institute/sample-tracker"
        processes={processes}
        now={NOW}
        defaultSelected="web"
        onTcStop={(e) => {
          set(e.detail.id, "stopped", { cpu: undefined, memory: undefined, exitCode: undefined });
          setSaid(`Stopped ${e.detail.process.name}`);
        }}
        onTcStart={(e) => {
          set(e.detail.id, "running", { started: NOW, exitCode: undefined, cpu: 1, memory: 64_000_000, lastLine: "Ready" });
          setSaid(`Started ${e.detail.process.name}`);
        }}
        onTcRestart={(e) => {
          set(e.detail.id, "starting", { started: NOW, exitCode: undefined, lastLine: `$ ${e.detail.process.command ?? e.detail.process.name}` });
          setSaid(`Restarting ${e.detail.process.name}`);
        }}
        onTcStopAll={() => {
          setProcesses((all) => all.map((p) => (p.status === "running" || p.status === "starting" ? { ...p, status: "stopped", cpu: undefined, memory: undefined } : p)));
          setSaid("Stopped everything");
        }}
        onTcOpen={(e) => setSaid(`Open ${e.detail.url}`)}
        onTcLogs={(e) => setSaid(`Show the output of ${e.detail.process.name}`)}
        onTcCreate={() => setSaid("Start a command")}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {said}{" "}
        <button type="button" style={textButton} onClick={() => setProcesses(START)}>
          Reset
        </button>
      </div>
    </div>
  );
}

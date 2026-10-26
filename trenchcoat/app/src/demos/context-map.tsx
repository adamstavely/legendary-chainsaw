import { useEffect, useRef, useState } from "react";
import type * as UI from "@components/context-map";
import type { ContextBlock, ContextCompaction } from "@components/context-map";

/* The fixer's context fills up as it reads files, runs tests and chats; near the limit it compacts (status in the
   bar), and Before / After appear. Then it keeps working and the cycle repeats. A second agent with a 500k window
   is in the menu. */

const Logo = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M6 1c.35 2.5 1.6 3.65 4.6 4-3 .35-4.25 1.5-4.6 4.6C5.65 6.6 4.4 5.35 1.4 5 4.4 4.65 5.65 3.5 6 1Z" fill="#d97757" />
  </svg>
);

const BASE: ContextBlock[] = [
  { id: "sys", label: "System prompt", kind: "system", tokens: 3200, detail: "Coding agent instructions" },
  {
    id: "tools",
    label: "Tools",
    kind: "tools",
    tokens: 14800,
    detail: "7 tool definitions",
    items: [{ label: "read_file" }, { label: "edit_file" }, { label: "run_tests" }, { label: "grep" }, { label: "git_diff" }, { label: "browser" }, { label: "ask_user" }],
  },
  { id: "mem", label: "Project memory", kind: "memory", tokens: 6100, detail: "CLAUDE.md and notes from earlier runs" },
];

// What arrives, in order: [seconds after start, block]
const ARRIVALS: [number, ContextBlock][] = [
  [0, { id: "chat1", label: "Your request", kind: "chat", tokens: 900, detail: "“Checkout fails for EU cards – fix it”" }],
  [1, { id: "f1", label: "checkout.ts", kind: "file", tokens: 18400, detail: "Read at 0:04" }],
  [3, { id: "f2", label: "payment-intent.ts", kind: "file", tokens: 12600, detail: "Read at 0:09" }],
  [5, { id: "r1", label: "grep “sca”", kind: "result", tokens: 7800, detail: "41 matches in 12 files" }],
  [7, { id: "f3", label: "checkout.spec.ts", kind: "file", tokens: 21200, detail: "Read at 0:21" }],
  [9, { id: "r2", label: "run_tests", kind: "result", tokens: 26400, detail: "3 failing: 3DS redirect" }],
  [11, { id: "chat2", label: "Agent ↔ you", kind: "chat", tokens: 9800, detail: "Asked which PSP region to use" }],
  [13, { id: "f4", label: "stripe-config.ts", kind: "file", tokens: 8900, detail: "Read at 0:58" }],
  [15, { id: "r3", label: "git_diff", kind: "result", tokens: 15300, detail: "Proposed patch, 4 files" }],
  [17, { id: "r4", label: "run_tests", kind: "result", tokens: 29800, detail: "1 failing: currency rounding" }],
];
const COMPACT_AT = 19;
const COMPACT_MS = 2200;
const AFTER: [number, ContextBlock][] = [
  [24, { id: "f5", label: "money.ts", kind: "file", tokens: 9400, detail: "Read after compaction" }],
  [27, { id: "r5", label: "run_tests", kind: "result", tokens: 11200, detail: "All 214 passing" }],
  [30, { id: "chat3", label: "Agent ↔ you", kind: "chat", tokens: 2600, detail: "Summary of the fix" }],
];
const LOOP_S = 40;
/** When the demo's blocks change: arrivals, compacting, compacted and what comes after */
const EVENTS = [...ARRIVALS.map(([t]) => t), COMPACT_AT, COMPACT_AT + COMPACT_MS / 1000, ...AFTER.map(([t]) => t)].sort((x, y) => x - y);

const LARGE: ContextBlock[] = [
  { id: "sys", label: "System prompt", kind: "system", tokens: 4100 },
  { id: "tools", label: "Tools", kind: "tools", tokens: 22000, detail: "12 tool definitions" },
  { id: "mem", label: "Memory", kind: "memory", tokens: 12000 },
  { id: "repo", label: "Repository map", kind: "file", tokens: 96000, detail: "1,840 files, signatures only" },
  { id: "spec", label: "RFC-118.md", kind: "file", tokens: 31000 },
  { id: "chat", label: "Conversation", kind: "chat", tokens: 58000 },
  { id: "res", label: "Search results", kind: "result", tokens: 44000 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ContextMap } = ui;
  const start = useRef(Date.now());
  const [s, setS] = useState(0);
  const [agent, setAgent] = useState("fixer");
  const [view, setView] = useState<"before" | "after">("after");

  useEffect(() => {
    const id = setInterval(() => {
      let sec = (Date.now() - start.current) / 1000;
      if (sec > LOOP_S) {
        start.current = Date.now();
        sec = 0;
        setView("after");
      }
      // Only the moments something changes – the map animates on its own in between
      const at = EVENTS.filter((t) => t <= sec).pop() ?? 0;
      setS((prev) => (prev === at ? prev : at));
    }, 200);
    return () => clearInterval(id);
  }, []);

  const arrived = ARRIVALS.filter(([t]) => s >= t).map(([, b]) => b);
  const compacting = s >= COMPACT_AT && s < COMPACT_AT + COMPACT_MS / 1000;
  const compacted = s >= COMPACT_AT + COMPACT_MS / 1000;

  let blocks: ContextBlock[] = [...BASE, ...arrived];
  let compaction: ContextCompaction | null = null;
  if (compacted) {
    const summarized = ["chat1", "r1", "r2", "chat2", "f2"];
    const dropped = ["r3", "f4"];
    compaction = { before: blocks, summarized, dropped, summary: "sum" };
    blocks = [
      ...BASE,
      { id: "sum", label: "Summary", kind: "summary", tokens: 6400, detail: "Earlier turns, test runs and the PSP decision" },
      ...blocks.filter((b) => !BASE.some((x) => x.id === b.id) && !summarized.includes(b.id) && !dropped.includes(b.id)),
      ...AFTER.filter(([t]) => s >= t).map(([, b]) => b),
    ];
  }

  return (
    <div style={{ width: "100%", maxWidth: 680 }}>
      {agent === "fixer" ? (
        <ContextMap
          title="Context"
          blocks={blocks}
          limit={200_000}
          model="Sonnet 5"
          modelIcon={<Logo />}
          agents={[
            { id: "fixer", name: "Checkout fixer", model: "Sonnet 5", icon: <Logo />, limit: 200_000 },
            { id: "planner", name: "Migration planner", model: "Opus 5.5", icon: <Logo />, limit: 500_000 },
          ]}
          agent={agent}
          onAgentChange={setAgent}
          compaction={compaction}
          view={compacted ? view : "after"}
          onViewChange={setView}
          status={compacting ? "Compacting" : undefined}
        />
      ) : (
        <ContextMap
          title="Context"
          blocks={LARGE}
          limit={500_000}
          model="Opus 5.5"
          modelIcon={<Logo />}
          agents={[
            { id: "fixer", name: "Checkout fixer", model: "Sonnet 5", icon: <Logo />, limit: 200_000 },
            { id: "planner", name: "Migration planner", model: "Opus 5.5", icon: <Logo />, limit: 500_000 },
          ]}
          agent={agent}
          onAgentChange={setAgent}
          compaction={null}
        />
      )}
    </div>
  );
}

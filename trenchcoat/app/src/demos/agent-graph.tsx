import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { GraphCall, GraphNode } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A research crew at work: the lead hands work to three agents, each calling its own tools.
   Calls are generated on a timer, resolve after a while (sometimes with an error), a new tool joins
   mid-run and the writer stops to ask you something. The whole run loops every ~36s. */

type Route = { from: string; to: string; labels: string[]; ms: [number, number] };

const ROUTES: Route[] = [
  { from: "lead", to: "research", labels: ["brief: competitor pricing", "brief: churn drivers"], ms: [400, 900] },
  { from: "lead", to: "writer", labels: ["draft: summary memo"], ms: [500, 1100] },
  { from: "lead", to: "analyst", labels: ["check: revenue model"], ms: [500, 900] },
  { from: "research", to: "search", labels: ["search: pricing linear.app", "search: notion plans 2026", "search: churn benchmarks saas"], ms: [500, 1400] },
  { from: "research", to: "browser", labels: ["open: linear.app/pricing", "open: g2.com/compare"], ms: [900, 2200] },
  { from: "analyst", to: "sql", labels: ["select mrr by month", "select churn by cohort", "select seats by plan"], ms: [300, 1200] },
  { from: "analyst", to: "python", labels: ["run: forecast.py", "run: cohort_plot.py"], ms: [800, 2400] },
  { from: "writer", to: "docs", labels: ["read: Q3 board memo", "write: draft v2"], ms: [300, 800] },
];

const LATE_ROUTE: Route = { from: "writer", to: "slack", labels: ["post: #growth draft ready", "read: #growth thread"], ms: [300, 700] };

const BASE_NODES: GraphNode[] = [
  { id: "lead", name: "Lead", kind: "agent", detail: "Orchestrator · large model", lead: true, doing: "Coordinating the pricing review" },
  { id: "research", name: "Researcher", kind: "agent", short: "Research", detail: "Browsing agent", doing: "Comparing competitor plans" },
  { id: "analyst", name: "Analyst", kind: "agent", detail: "Data agent", doing: "Modelling churn by cohort" },
  { id: "writer", name: "Writer", kind: "agent", detail: "Drafting agent", doing: "Writing the summary memo" },
  { id: "search", name: "Web search", short: "Search", kind: "tool", detail: "Search API" },
  { id: "browser", name: "Browser", kind: "tool", detail: "Headless Chromium" },
  { id: "sql", name: "Warehouse", short: "SQL", kind: "tool", detail: "Postgres, read-only" },
  { id: "python", name: "Python sandbox", short: "Python", kind: "tool", detail: "Code interpreter" },
  { id: "docs", name: "Docs", kind: "tool", detail: "Company wiki" },
  { id: "you", name: "You", kind: "user", detail: "Product lead" },
];
const SLACK: GraphNode = { id: "slack", name: "Slack", kind: "tool", detail: "Workspace connector" };

const LOOP_MS = 36000;
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentGraph } = ui;
  const [now, setNow] = useState(() => Date.now());
  const [calls, setCalls] = useState<GraphCall[]>([]);
  const [costs, setCosts] = useState<Record<string, number>>({ lead: 0.12, research: 0.05, analyst: 0.03, writer: 0.02 });
  const [selected, setSelected] = useState<string | null>(null);
  const start = useRef(Date.now());
  const seq = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.current.push(id);
    };
    const clock = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t - start.current > LOOP_MS) {
        start.current = t;
        setCalls([]);
        setCosts({ lead: 0.12, research: 0.05, analyst: 0.03, writer: 0.02 });
      }
    }, 1000);

    const fire = () => {
      const phase = Date.now() - start.current;
      const routes = phase > 9000 && phase < 30000 ? [...ROUTES, LATE_ROUTE, LATE_ROUTE] : ROUTES;
      const r = pick(routes);
      // The writer stops while it waits for you
      if (r.from === "writer" && phase > 16000 && phase < 24000) return;
      const id = `c${++seq.current}`;
      const at = Date.now();
      const ms = rand(...r.ms);
      setCalls((cs) => [...cs.slice(-60), { id, from: r.from, to: r.to, label: pick(r.labels), status: "pending", at }]);
      // The clock ticks once a second; a new call brings it up to date, so its pulse leaves right away
      setNow(at);
      setCosts((c) => ({ ...c, [r.from]: (c[r.from] ?? 0) + rand(0.002, 0.012) }));
      const fails = r.to === "browser" ? Math.random() < 0.25 : Math.random() < 0.05;
      later(() => setCalls((cs) => cs.map((c) => (c.id === id ? { ...c, status: fails ? "error" : "ok", ms } : c))), ms);
    };
    const pump = window.setInterval(fire, 650);

    // The writer asks you to sign off on the framing
    const ask = () => {
      const id = `ask${++seq.current}`;
      const at = Date.now();
      setCalls((cs) => [...cs, { id, from: "writer", to: "you", label: "approve: memo framing", status: "pending", at }]);
      setNow(at);
      later(() => setCalls((cs) => cs.map((c) => (c.id === id ? { ...c, status: "ok", ms: 8000 } : c))), 8000);
    };
    const askEvery = () => later(ask, 16000);
    askEvery();
    const askLoop = window.setInterval(askEvery, LOOP_MS);

    return () => {
      clearInterval(clock);
      clearInterval(pump);
      clearInterval(askLoop);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const phase = now - start.current;
  const pendingFrom = (id: string) => calls.some((c) => c.from === id && c.status === "pending");
  const waiting = calls.some((c) => c.to === "you" && c.status === "pending");
  const lastError = (id: string) => calls.some((c) => c.from === id && c.status === "error" && now - c.at < 2500);

  const nodes: GraphNode[] = [...BASE_NODES, ...(phase > 9000 && phase < 30000 ? [SLACK] : [])].map((n) => {
    if (n.kind !== "agent") return n;
    let status: GraphNode["status"] = pendingFrom(n.id) ? "working" : "idle";
    if (n.id === "writer" && waiting) status = "waiting";
    else if (lastError(n.id)) status = "error";
    else if (n.id === "lead") status = "working";
    return { ...n, status, cost: costs[n.id], doing: n.id === "writer" && waiting ? "Waiting for you to approve the framing" : n.doing };
  });

  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <AgentGraph
        title="Pricing review"
        nodes={nodes}
        calls={calls}
        edges={[["lead", "research"], ["lead", "analyst"], ["lead", "writer"], ["writer", "you"]]}
        now={now}
        heatWindow={20000}
        onSelect={(n) => setSelected(n?.id ?? null)}
      />
      {selected && (
        <div style={{ ...caption, marginTop: 8, textAlign: "center" }}>Selected: {nodes.find((n) => n.id === selected)?.name}</div>
      )}
    </div>
  );
}

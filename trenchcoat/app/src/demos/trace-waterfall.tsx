import { useEffect, useState } from "react";
import type * as UI from "@components/trace-waterfall";
import type { TraceSpan } from "@components/trace-waterfall";

const S = 1000;

/** The finished run – the demo reveals it over time */
type Tpl = Omit<TraceSpan, "status" | "end" | "children"> & { end: number; fail?: boolean; children?: Tpl[] };

const RUN: Tpl = {
  id: "root",
  name: "Research agent",
  kind: "agent",
  detail: "“Compare CRM vendors for a 20-person team”",
  model: "claude-opus",
  start: 0,
  end: 24.2 * S,
  children: [
    { id: "plan", name: "Plan the research", kind: "llm", detail: "claude-opus", model: "claude-opus", start: 0.1 * S, end: 2.4 * S, tokensIn: 1840, tokensOut: 412, cost: 0.058, input: "Compare CRM vendors for a 20-person B2B team…", output: "1. Search pricing pages 2. Read reviews 3. Summarize trade-offs" },
    { id: "search", name: "search_web", kind: "tool", detail: "CRM pricing 2026", start: 2.5 * S, end: 4.1 * S, input: '{ "query": "CRM pricing 2026" }', output: "8 results" },
    {
      id: "sub-a",
      name: "Pricing reader",
      kind: "subagent",
      detail: "3 vendor pages",
      model: "claude-haiku",
      start: 4.2 * S,
      end: 13.6 * S,
      children: [
        { id: "fa", name: "fetch_page", kind: "tool", detail: "hubspot.com/pricing", start: 4.3 * S, end: 5.9 * S, output: "12 KB markdown" },
        { id: "fb", name: "fetch_page", kind: "tool", detail: "attio.com/pricing", start: 4.3 * S, end: 6.1 * S, output: "9 KB markdown" },
        { id: "fc", name: "fetch_page", kind: "tool", detail: "salesforce.com/pricing", start: 4.3 * S, end: 9.3 * S, fail: true, error: "403 Forbidden – blocked by bot protection" },
        { id: "fc2", name: "fetch_page", kind: "tool", detail: "salesforce.com/pricing (cache)", start: 9.4 * S, end: 10.4 * S, output: "14 KB markdown" },
        { id: "ex", name: "Extract plans", kind: "llm", detail: "claude-haiku", model: "claude-haiku", start: 10.5 * S, end: 13.5 * S, tokensIn: 9200, tokensOut: 860, cost: 0.011, output: "3 vendors · 11 plans · per-seat prices" },
      ],
    },
    {
      id: "sub-b",
      name: "Review reader",
      kind: "subagent",
      detail: "G2 + Reddit",
      model: "claude-haiku",
      start: 4.2 * S,
      end: 11.8 * S,
      children: [
        { id: "rv", name: "search_reviews", kind: "tool", detail: "G2 · CRM · 20–50 seats", start: 4.4 * S, end: 7.6 * S, output: "42 reviews" },
        { id: "rs", name: "Summarize reviews", kind: "llm", detail: "claude-haiku", model: "claude-haiku", start: 7.7 * S, end: 11.7 * S, tokensIn: 14100, tokensOut: 690, cost: 0.016 },
      ],
    },
    { id: "write", name: "Write the comparison", kind: "llm", detail: "claude-opus", model: "claude-opus", start: 13.8 * S, end: 23.4 * S, tokensIn: 12400, tokensOut: 1920, cost: 0.33, output: "A table of 3 vendors with seat price, limits and verdict" },
    { id: "save", name: "save_doc", kind: "tool", detail: "Notion · Research", start: 23.5 * S, end: 24.1 * S, output: "notion.so/…/crm-comparison" },
  ],
};

function at(t: Tpl, now: number): TraceSpan | null {
  if (t.start > now) return null;
  const { fail, end, children, ...rest } = t;
  const done = now >= end;
  return {
    ...rest,
    status: done ? (fail ? "failed" : "done") : "running",
    end: done ? end : undefined,
    // costs and tokens only land when the call returns
    cost: done ? t.cost : undefined,
    tokensIn: done ? t.tokensIn : undefined,
    tokensOut: done ? t.tokensOut : undefined,
    output: done ? t.output : undefined,
    error: done ? t.error : undefined,
    children: children?.map((c) => at(c, now)).filter((c): c is TraceSpan => c !== null),
  };
}

const HOLD = 6 * S;
/** Every moment a span starts or ends – the only times the demo re-renders */
const flatten = (t: Tpl): Tpl[] => [t, ...(t.children ?? []).flatMap(flatten)];
const EVENTS = [...new Set(flatten(RUN).flatMap((t) => [t.start, t.end]))].filter((t) => t > 0).sort((a, b) => a - b);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TraceWaterfall } = ui;
  // The run plays in real time on the component's own clock (`startedAt`): bars grow and numbers count without
  // re-rendering, the demo only hands over the spans that started or ended
  const [{ startedAt, at: clock, round }, setRun] = useState(() => ({ startedAt: Date.now(), at: 0, round: 0 }));
  useEffect(() => {
    let timer = 0;
    let start = startedAt;
    const schedule = (from: number) => {
      const next = EVENTS.find((t) => t > from);
      timer = window.setTimeout(
        () => {
          if (next === undefined) {
            start = Date.now();
            setRun((r) => ({ startedAt: start, at: 0, round: r.round + 1 }));
            schedule(0);
          } else {
            setRun((r) => ({ ...r, at: next }));
            schedule(next);
          }
        },
        Math.max(0, start + (next ?? RUN.end + HOLD) - Date.now()),
      );
    };
    schedule(0);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- one schedule for the demo's lifetime, from its first start
  return (
    <div style={{ width: "100%", maxWidth: 860 }}>
      <TraceWaterfall key={round} root={at(RUN, clock)!} startedAt={startedAt} title="Trace" />
    </div>
  );
}

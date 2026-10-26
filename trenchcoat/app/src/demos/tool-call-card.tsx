import { useEffect, useState } from "react";
import type * as UI from "@components/tool-call-card";
import type { ToolCallStatus } from "@components/tool-call-card";

const Globe = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <circle cx="8" cy="8" r="6.25" />
    <path d="M1.75 8h12.5M8 1.75c1.8 1.9 2.6 4 2.6 6.25S9.8 12.35 8 14.25C6.2 12.35 5.4 10.25 5.4 8S6.2 3.65 8 1.75z" />
  </svg>
);
const Db = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <ellipse cx="8" cy="3.75" rx="5.25" ry="2" />
    <path d="M2.75 3.75v8.5c0 1.1 2.35 2 5.25 2s5.25-.9 5.25-2v-8.5M2.75 8c0 1.1 2.35 2 5.25 2s5.25-.9 5.25-2" />
  </svg>
);
const Doc = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 1.75h5l3 3v9.5H4z" />
    <path d="M9 1.75v3h3M6 8.5h4M6 11h4" />
  </svg>
);
const Mail = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
    <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="2" />
    <path d="M2.5 4.5L8 8.75l5.5-4.25" />
  </svg>
);

const SEARCH_RESULT = {
  results: [
    { title: "CRM pricing comparison 2026", url: "https://example.com/crm-pricing", snippet: "HubSpot Starter $20/seat, Pipedrive $24/seat, Attio $29/seat…" },
    { title: "The real cost of a CRM", url: "https://example.com/real-cost", snippet: "Seat price is only part of it – onboarding and add-ons…" },
    { title: "Attio vs HubSpot for startups", url: "https://example.com/attio-hubspot", snippet: "For teams under 20, Attio's flexible objects…" },
  ],
  took_ms: 812,
};

/** One cycle of the demo, in ms: [when, phase] */
const CYCLE = 16000;

/** The moments something changes within a cycle – the clock only moves on to these, so the demo re-renders
 *  when a call starts or finishes, not five times a second (the cards run their own timers) */
const STEPS = [1200, 2400, 3400, 5200];

function useClock() {
  const [c, setC] = useState(() => ({ t: 0, cycle: 0, base: Date.now() }));
  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const el = Date.now() - start;
      const cycle = Math.floor(el / CYCLE);
      const t = STEPS.filter((s) => s <= el % CYCLE).pop() ?? 0;
      setC((c) => (c.t === t && c.cycle === cycle ? c : { t, cycle, base: start + cycle * CYCLE }));
    }, 200);
    return () => window.clearInterval(id);
  }, []);
  return c;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ToolCallCard, ToolCallGroup } = ui;
  const { t, cycle, base } = useClock();

  // Card 1: a search that runs for ~2.4s, then succeeds
  const searchStatus: ToolCallStatus = t < 2400 ? "running" : "success";

  // Card 2: a fetch that fails – Retry runs it again and it succeeds
  const [fetchRun, setFetchRun] = useState<{ status: ToolCallStatus; startedAt: number; attempt: number }>(() => ({ status: "running", startedAt: Date.now(), attempt: 1 }));
  useEffect(() => {
    // every new cycle starts the fetch over (its first try fails)
    if (cycle > 0) setFetchRun({ status: "running", startedAt: Date.now(), attempt: 1 });
  }, [cycle]);
  useEffect(() => {
    if (fetchRun.status !== "running") return;
    const failing = fetchRun.attempt === 1;
    const id = window.setTimeout(() => setFetchRun((r) => ({ ...r, status: failing ? "error" : "success" })), failing ? 1600 : 1300);
    return () => window.clearTimeout(id);
  }, [fetchRun]);

  // Group: three calls that run one after another
  const s1: ToolCallStatus = t < 1200 ? "running" : "success";
  const s2: ToolCallStatus = t < 3400 ? "running" : "success";
  const s3: ToolCallStatus = t < 5200 ? "running" : "success";

  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 12 }}>
      <ToolCallCard
        key={cycle}
        name="search_web"
        icon={<Globe />}
        summary="Searched the web for “CRM pricing 2026”"
        status={searchStatus}
        startedAt={base}
        duration={searchStatus === "success" ? 2400 : undefined}
        args={{ query: "CRM pricing 2026", max_results: 3, region: "us" }}
        result={searchStatus === "success" ? SEARCH_RESULT : undefined}
        defaultOpen
      />
      <ToolCallCard
        name="fetch_page"
        icon={<Doc />}
        summary="Read the pricing page of attio.com"
        status={fetchRun.status}
        startedAt={fetchRun.startedAt}
        args={{ url: "https://attio.com/pricing", format: "markdown" }}
        result={fetchRun.status === "success" ? "# Pricing\n\nFree – up to 3 seats\nPlus – $29 per seat / month\nPro – $59 per seat / month\nEnterprise – talk to sales" : undefined}
        error="Request timed out after 1.5s (ETIMEDOUT)"
        openOnError
        onRetry={() => setFetchRun((r) => ({ status: "running", startedAt: Date.now(), attempt: r.attempt + 1 }))}
      />
      <ToolCallGroup>
        <ToolCallCard name="query_db" icon={<Db />} summary="Looked up 3 open deals" status={s1} duration={s1 === "success" ? 1200 : undefined} args={{ sql: "SELECT id, name, amount FROM deals WHERE stage = 'open' LIMIT 3" }} result={s1 === "success" ? [{ id: 41, name: "Northwind", amount: 4800 }, { id: 52, name: "Globex", amount: 12000 }, { id: 57, name: "Initech", amount: 2600 }] : undefined} />
        <ToolCallCard name="read_file" icon={<Doc />} summary="Read q4-targets.md" status={s2} duration={s2 === "success" ? 2200 : undefined} args={{ path: "notes/q4-targets.md" }} result={s2 === "success" ? "Q4 target: $180k new ARR. 62% closed so far." : undefined} />
        <ToolCallCard name="send_email" icon={<Mail />} summary="Drafted an update to the sales team" status={s3} duration={s3 === "success" ? 1800 : undefined} args={{ to: "sales@acme.co", subject: "Pipeline check-in", draft: true }} result={s3 === "success" ? { id: "draft_8f2c", status: "saved" } : undefined} />
      </ToolCallGroup>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import type * as UI from "@components/agent-queue";
import type { QueueJob, QueueJobKind, QueueJobPriority, QueueRateLimit, QueueWorker } from "@components/agent-queue";

/* A small scheduler drives the queue: jobs arrive at a steady clip (with bursts), free workers pull the front one,
   some fail and retry, and every ~40s the provider rate-limits for 8s so you can watch the backlog build and drain.
   Pause/Resume, the worker stepper, Move to front and Cancel all act on the simulation. */

const TEMPLATES: { name: string; kind: QueueJobKind; detail: string; est: [number, number] }[] = [
  { name: "Summarise ticket", kind: "llm", detail: "Zendesk · Sonnet 5", est: [2500, 5000] },
  { name: "Classify email", kind: "llm", detail: "Gmail · Haiku 5", est: [1200, 2500] },
  { name: "Enrich lead", kind: "tool", detail: "Clearbit lookup", est: [1500, 3500] },
  { name: "Scrape pricing page", kind: "tool", detail: "Headless browser", est: [3000, 6500] },
  { name: "Research account", kind: "agent", detail: "Research agent · 6 steps", est: [6000, 11000] },
  { name: "Draft reply", kind: "llm", detail: "Opus 5.5", est: [3000, 6000] },
  { name: "Review refund", kind: "human", detail: "Waits for finance", est: [5000, 9000] },
];

const ALL_WORKERS: QueueWorker[] = [
  { id: "w1", name: "Worker 1", detail: "us-east" },
  { id: "w2", name: "Worker 2", detail: "us-east" },
  { id: "w3", name: "Worker 3", detail: "eu-west" },
  { id: "w4", name: "Worker 4", detail: "eu-west" },
  { id: "w5", name: "Worker 5", detail: "ap-south" },
  { id: "w6", name: "Worker 6", detail: "ap-south" },
];

const RANK: Record<QueueJobPriority, number> = { high: 0, normal: 1, low: 2 };
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const WINDOW = 120_000;

type Sim = { jobs: QueueJob[]; done: number; failed: number; seq: number };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentQueue } = ui;
  const t0 = useRef(Date.now());
  const [concurrency, setConcurrency] = useState(3);
  const [paused, setPaused] = useState(false);
  const [rateLimits, setRateLimits] = useState<QueueRateLimit[]>([]);
  const [sim, setSim] = useState<Sim>(() => {
    const t = Date.now();
    const jobs: QueueJob[] = Array.from({ length: 7 }, (_, i) => {
      const tpl = TEMPLATES[i % TEMPLATES.length];
      return { id: `j${i}`, name: tpl.name, kind: tpl.kind, detail: tpl.detail, status: "queued", enqueuedAt: t - (7 - i) * 900, estimate: rand(...tpl.est), attempt: 1, maxAttempts: 3, priority: i === 5 ? "low" : "normal" };
    });
    return { jobs, done: 0, failed: 0, seq: 7 };
  });

  // Live config the scheduler reads without restarting
  const cfg = useRef({ concurrency, paused, rateLimits });
  cfg.current = { concurrency, paused, rateLimits };

  useEffect(() => {
    const id = setInterval(() => {
      // The queue keeps its own clock; the demo only renders when the simulation changes
      const t = Date.now();

      // A rate-limit stretch every 40s, 8s long
      const phase = (t - t0.current) % 40_000;
      if (phase > 22_000 && phase < 22_300) {
        setRateLimits((rl) => (rl.some((r) => t < r.until) ? rl : [...rl.filter((r) => t - r.until < WINDOW), { from: t, until: t + 8000, label: "Token limit · 2M/min" }]));
      }

      setSim((s) => {
        let { done, failed, seq } = s;
        const { concurrency: n, paused: p, rateLimits: rl } = cfg.current;
        const limited = rl.some((r) => t >= r.from && t < r.until);
        const workers = ALL_WORKERS.slice(0, n).map((w) => w.id);
        const before = s.jobs;
        let jobs = s.jobs.filter((j) => j.status === "queued" || j.status === "running" || t - (j.endedAt ?? t) < WINDOW);

        // Arrivals: about 0.5 jobs/s, with an occasional burst and an occasional urgent one (capped so it never runs away)
        const queued = jobs.filter((j) => j.status === "queued").length;
        const arrivals = queued < 30 && Math.random() < 0.12 ? (Math.random() < 0.08 ? 4 : 1) : 0;
        for (let i = 0; i < arrivals; i++) {
          const tpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
          const r = Math.random();
          jobs.push({
            id: `j${++seq}`,
            name: tpl.name,
            kind: tpl.kind,
            detail: tpl.detail,
            status: "queued",
            priority: r < 0.07 ? "high" : r < 0.18 ? "low" : "normal",
            enqueuedAt: t,
            estimate: rand(...tpl.est),
            attempt: 1,
            maxAttempts: 3,
          });
        }

        // Running jobs finish (or fail – sometimes back into the queue for another try)
        jobs = jobs.map((j) => {
          if (j.status !== "running" || !j.startedAt || t - j.startedAt < (j.estimate ?? 3000)) return j;
          const fails = Math.random() < (j.kind === "tool" ? 0.18 : 0.06);
          if (!fails) {
            done++;
            return { ...j, status: "done", endedAt: t, worker: undefined };
          }
          if ((j.attempt ?? 1) < (j.maxAttempts ?? 3)) {
            return { ...j, status: "queued", enqueuedAt: t, startedAt: undefined, worker: undefined, attempt: (j.attempt ?? 1) + 1, error: "Upstream returned 503" };
          }
          failed++;
          return { ...j, status: "failed", endedAt: t, worker: undefined, error: "Failed 3 times: upstream returned 503" };
        });

        // Workers removed by the stepper hand their job back
        jobs = jobs.map((j) => (j.status === "running" && j.worker && !workers.includes(j.worker) ? { ...j, status: "queued", worker: undefined, startedAt: undefined, enqueuedAt: t } : j));

        // Free workers pull the front of the queue
        if (!p && !limited) {
          const busy = new Set(jobs.filter((j) => j.status === "running").map((j) => j.worker));
          const free = workers.filter((w) => !busy.has(w));
          const queue = jobs
            .filter((j) => j.status === "queued")
            .sort((a, b) => RANK[a.priority ?? "normal"] - RANK[b.priority ?? "normal"] || a.enqueuedAt - b.enqueuedAt);
          free.forEach((w, i) => {
            const next = queue[i];
            if (!next) return;
            jobs = jobs.map((j) => (j.id === next.id ? { ...j, status: "running", worker: w, startedAt: t } : j));
          });
        }
        // Nothing happened this tick: keep the state, so nothing renders
        if (seq === s.seq && jobs.length === before.length && jobs.every((j, i) => j === before[i])) return s;
        return { jobs, done, failed, seq };
      });
    }, 300);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <AgentQueue
        title="Queue"
        name="support-automation"
        jobs={sim.jobs}
        workers={ALL_WORKERS.slice(0, concurrency)}
        rateLimits={rateLimits}
        paused={paused}
        onPausedChange={setPaused}
        onConcurrencyChange={setConcurrency}
        minConcurrency={1}
        maxConcurrency={ALL_WORKERS.length}
        backpressure={14}
        window={WINDOW}
        totals={{ done: sim.done, failed: sim.failed }}
        onPromote={(job) => setSim((s) => ({ ...s, jobs: s.jobs.map((j) => (j.id === job.id ? { ...j, priority: "high" } : j)) }))}
        onCancel={(job) => setSim((s) => ({ ...s, jobs: s.jobs.filter((j) => j.id !== job.id) }))}
      />
    </div>
  );
}

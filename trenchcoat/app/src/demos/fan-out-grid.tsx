import { useEffect, useRef, useState } from "react";
import type * as UI from "@components/fan-out-grid";
import type { FanoutTask } from "@components/fan-out-grid";

const TOTAL = 140;
const WORKERS = 10;
const STEP = 400; // sim ms per tick
const TICK = 120; // real ms per tick

const PREFIX = ["north", "blue", "acme", "lumen", "pine", "vector", "orbit", "kite", "harbor", "nova", "atlas", "ember", "quill", "drift"];
const SUFFIX = ["wind", "labs", "works", "ly", "stack", "hq", "io", "base", "grid", "loop"];
const TLD = [".io", ".com", ".ai", ".dev", ".co"];

/** Small deterministic PRNG so the run looks the same every loop */
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

type Sim = FanoutTask & { dur: number; willFail: boolean; willRetry: boolean };

function makeTasks(): Sim[] {
  const r = rng(42);
  return Array.from({ length: TOTAL }, (_, i) => {
    const name = PREFIX[Math.floor(r() * PREFIX.length)] + SUFFIX[Math.floor(r() * SUFFIX.length)] + TLD[Math.floor(r() * TLD.length)];
    const x = r();
    return {
      id: `t${i}`,
      label: name,
      status: "queued" as const,
      dur: 1800 + r() * 5200,
      willFail: x < 0.04,
      willRetry: x >= 0.04 && x < 0.1,
    };
  });
}

const RESULTS = ["B2B SaaS · 120 employees · Series A", "Fintech · 45 employees · seed", "Dev tools · 300 employees · Series C", "E-commerce · 18 employees · bootstrapped", "Health · 75 employees · Series B"];
const ERRORS = ["Timed out fetching homepage (30s)", "403 from LinkedIn – rate limited", "DNS lookup failed"];

function step(tasks: Sim[], now: number, workers: number): Sim[] {
  const next = tasks.map((t) => {
    if ((t.status === "running" || t.status === "retrying") && t.start !== undefined && now - t.start >= t.dur) {
      const attempts = t.attempts ?? 1;
      if (t.willRetry && attempts < 2) {
        return { ...t, status: "retrying" as const, attempts: 2, start: now, dur: t.dur * 0.8, error: "429 Too Many Requests – backing off" };
      }
      if (t.willFail && attempts < 2) {
        return { ...t, status: "failed" as const, end: now, cost: 0.004, error: ERRORS[Number(t.id.slice(1)) % ERRORS.length] };
      }
      return {
        ...t,
        status: "done" as const,
        end: now,
        cost: +(0.006 + (t.dur / 1000) * 0.0021 * attempts).toFixed(4),
        result: RESULTS[Number(t.id.slice(1)) % RESULTS.length],
        error: undefined,
      };
    }
    return t;
  });
  let busy = next.filter((t) => t.status === "running" || t.status === "retrying").length;
  for (let i = 0; i < next.length && busy < workers; i++) {
    const t = next[i];
    if (t.status === "queued") {
      next[i] = { ...t, status: "running", start: now, end: undefined, worker: `Researcher ${(busy % workers) + 1}`, attempts: t.attempts ?? 1 };
      busy++;
    }
  }
  return next;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FanoutGrid } = ui;
  const [state, setState] = useState(() => ({ now: 0, tasks: step(makeTasks(), 0, WORKERS) }));
  // The sim runs here every tick; the grid only hears about it when a task moved or a second went by
  const sim = useRef({ now: state.now, tasks: state.tasks });
  const doneAt = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = sim.current;
      const settled = s.tasks.every((t) => t.status === "done" || t.status === "failed");
      if (settled) {
        // hold the finished grid for a while, then start over
        if (doneAt.current === null) doneAt.current = Date.now();
        if (Date.now() - doneAt.current > 6000) {
          doneAt.current = null;
          sim.current = { now: 0, tasks: step(makeTasks(), 0, WORKERS) };
          setState(sim.current);
        }
        return;
      }
      doneAt.current = null;
      const now = s.now + STEP;
      const tasks = step(s.tasks, now, WORKERS);
      const moved = tasks.some((t, i) => t !== s.tasks[i]);
      sim.current = { now, tasks: moved ? tasks : s.tasks };
      setState((shown) => (moved || now - shown.now >= 1000 ? sim.current : shown));
    }, TICK);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <FanoutGrid
        tasks={state.tasks}
        elapsed={state.now}
        workers={WORKERS}
        job={`Enrich ${TOTAL} leads`}
        title="Lead enrichment"
        onRetry={(ids) => {
          doneAt.current = null;
          const s = sim.current;
          sim.current = {
            ...s,
            tasks: s.tasks.map((t) => (ids.includes(t.id) ? { ...t, status: "queued", willFail: false, attempts: (t.attempts ?? 1) + 1, start: undefined, end: undefined, error: undefined } : t)),
          };
          setState(sim.current);
        }}
      />
    </div>
  );
}

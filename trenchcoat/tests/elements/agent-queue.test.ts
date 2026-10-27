/*
 * <tc-agent-queue> in real browsers – the React component's contract and regression checks, ported.
 */
import { html, render as litRender } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/agent-queue";
import { TcAgentQueue, type QueueJob, type QueueWorker } from "../../src/elements/agent-queue";
import { AgentQueue } from "../../src/elements/react/agent-queue";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const FRAME = 16;
const WORKERS: QueueWorker[] = [
  { id: "w1", name: "Worker 1" },
  { id: "w2", name: "Worker 2" },
];
const jobs = (age: number, t = Date.now()): QueueJob[] => [
  { id: "r1", name: "Summarize", kind: "llm", status: "running", worker: "w1", enqueuedAt: t - age - 4000, startedAt: t - age, estimate: 60_000 },
  ...Array.from({ length: 5 }, (_, i): QueueJob => ({ id: `q${i}`, name: `Job ${i}`, kind: "tool", status: "queued", enqueuedAt: t - age + i * 100 })),
];
/** Fake clocks, frames included – fixtures are then made without settle(), which waits for a real frame */
const fakeAll = () =>
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
    now: new Date("2026-10-24T12:00:00Z"),
  });
const mount = async (props: Partial<TcAgentQueue>, look: "standard" | "clean" = "standard") => {
  const host = document.createElement("div");
  host.style.width = "820px";
  document.body.append(host);
  litRender(html`<tc-agent-queue look=${look}></tc-agent-queue>`, host);
  const el = host.firstElementChild as TcAgentQueue;
  Object.assign(el, props);
  await el.updateComplete;
  return el;
};
const frames = async (el: TcAgentQueue, ms: number, each?: () => void) => {
  for (let t = 0; t < ms; t += FRAME) {
    vi.advanceTimersByTime(FRAME);
    await el.updateComplete;
    each?.();
  }
};
const job = (el: Element, id: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-agq__job")].find((b) => b.getAttribute("aria-label")!.startsWith(id))!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-agent-queue", () => {
  test("the host is the root, with the look and the state", async () => {
    const t = Date.now();
    const el = await fixture<TcAgentQueue>(html`<tc-agent-queue .jobs=${jobs(30_000, t)} .workers=${WORKERS} .now=${t}></tc-agent-queue>`);
    expect(el.dataset.ui).toBe("agq");
    expect(el.dataset.look).toBe("standard");
    expect(el.dataset.state).toBe("live");
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Queue");
    expect(el.querySelector(".ui-agq__jobs")!.getAttribute("aria-label")).toBe("Jobs: 1 running, 5 waiting");
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
  });

  for (const look of ["standard", "clean"] as const) {
    for (const [label, age] of [
      ["times in whole seconds", 30_000],
      ["times in tenths", 0],
    ] as const) {
      test(`${look}: own clock – the chart glides every frame, updates stay well under the frame rate (${label})`, async () => {
        fakeAll();
        const updated = vi.spyOn(TcAgentQueue.prototype as unknown as { updated: (c: unknown) => void }, "updated");
        const el = await mount({ jobs: jobs(age), workers: WORKERS }, look);
        await frames(el, 500);
        updated.mockClear();
        const line = () => el.querySelector(".ui-agq__line")?.getAttribute("d");
        const drawn = new Set<string | null | undefined>();
        await frames(el, 2000, () => drawn.add(line()));
        const n = 2000 / FRAME;
        // 4 a second with whole seconds, 10 with tenths
        expect(updated.mock.calls.length).toBeLessThanOrEqual(age ? 4 * 2 + 2 : 10 * 2 + 2);
        expect(updated.mock.calls.length).toBeLessThan(n / 4);
        // ...while the chart moved on almost every frame
        expect(drawn.size).toBeGreaterThan(n / 2);
        el.remove();
        expect(vi.getTimerCount()).toBe(0);
      });
    }

    test(`${look}: a controlled openId for a job that isn't placed asks to close once, not on every update`, async () => {
      fakeAll();
      const el = await mount({ jobs: jobs(30_000), workers: WORKERS }, look);
      const seen: unknown[] = [];
      el.addEventListener("tc-open-change", (e) => {
        e.preventDefault();
        seen.push((e as CustomEvent).detail);
      });
      el.openId = "missing";
      await frames(el, 1000);
      expect(seen).toEqual([{ id: null, job: undefined }]);
    });

    test(`${look}: paused and openId follow their properties`, async () => {
      const t = Date.now();
      const el = await fixture<TcAgentQueue>(html`<tc-agent-queue look=${look} pausable .jobs=${jobs(30_000, t)} .workers=${WORKERS} .now=${t}></tc-agent-queue>`);
      el.paused = true;
      await settle();
      expect(el.dataset.state).toBe("paused");
      el.paused = false;
      await settle();
      expect(el.dataset.state).toBe("live");
      el.openId = "r1";
      await settle();
      expect(el.querySelector('[role="dialog"]')!.textContent).toContain("Summarize");
      el.openId = "q1";
      await settle();
      expect(el.querySelector('[role="dialog"]')!.textContent).toContain("Job 1");
    });

    test(`${look}: uncontrolled paused toggles from its button and reports; controlled is only reported`, async () => {
      const t = Date.now();
      const el = await fixture<TcAgentQueue>(html`<tc-agent-queue look=${look} pausable .jobs=${jobs(30_000, t)} .workers=${WORKERS} .now=${t}></tc-agent-queue>`);
      const seen: boolean[] = [];
      el.addEventListener("tc-paused-change", (e) => seen.push((e as CustomEvent<{ paused: boolean }>).detail.paused));
      el.querySelector<HTMLButtonElement>('[aria-label="Pause the queue"]')!.click();
      await settle();
      expect(seen).toEqual([true]);
      expect(el.dataset.state).toBe("paused");
      el.addEventListener("tc-paused-change", (e) => e.preventDefault());
      el.querySelector<HTMLButtonElement>('[aria-label="Resume the queue"]')!.click();
      await settle();
      expect(seen).toEqual([true, false]);
      expect(el.dataset.state).toBe("paused");
    });

    test(`${look}: a failed job is held, announced once and then lands`, async () => {
      fakeAll();
      const t = Date.now();
      const running: QueueJob = { id: "r1", name: "Summarize", kind: "llm", status: "running", worker: "w1", enqueuedAt: t - 4000, startedAt: t - 2000 };
      const el = await mount({ jobs: [running], workers: WORKERS, now: t }, look);
      await frames(el, 200);
      el.jobs = [{ ...running, status: "failed", endedAt: t, error: "timeout" }];
      await frames(el, 100);
      expect(el.querySelector(".ui-agq__sr")!.textContent).toContain("Summarize failed: timeout");
      // Held in its slot, red, for a beat
      expect(el.querySelector('[data-shape="bar"]')).not.toBeNull();
      await frames(el, 1600);
      // Landed in its bin: no longer a bar in the slot
      expect(el.querySelector('[data-shape="bar"]')).toBeNull();
    });

    test(`${look}: the rate-limit countdown is not a live region; one persistent region announces the limit`, async () => {
      const t = Date.now();
      const el = await fixture<TcAgentQueue>(html`<tc-agent-queue look=${look} .jobs=${jobs(0, t)} .workers=${WORKERS} .now=${t} .rateLimits=${[{ from: t - 1000, until: t + 30_000 }]}></tc-agent-queue>`);
      const pill = el.querySelector('.ui-agq__pill[data-status="limited"]')!;
      expect(pill.getAttribute("role")).toBeNull();
      expect(pill.textContent).toMatch(/Rate limited · 30s/);
      expect(el.querySelectorAll('[aria-live="polite"].ui-agq__sr')).toHaveLength(1);
      expect(el.dataset.state).toBe("limited");
    });

    test(`${look}: focus on a job shows its peek, and Esc closes it without moving focus`, async () => {
      const t = Date.now();
      const el = await fixture<TcAgentQueue>(html`<tc-agent-queue look=${look} .jobs=${jobs(0, t)} .workers=${WORKERS} .now=${t}></tc-agent-queue>`);
      const j = el.querySelector<HTMLElement>('.ui-agq__job[tabindex="0"]')!;
      j.focus();
      await settle();
      expect(el.querySelector('[role="tooltip"]')).toBeTruthy();
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      await settle();
      expect(el.querySelector('[role="tooltip"]')).toBeNull();
      expect(document.activeElement).toBe(j);
    });

    test(`${look}: a job's name starts with the text it shows`, async () => {
      const t = Date.now();
      const el = await fixture<TcAgentQueue>(html`<tc-agent-queue look=${look} .jobs=${jobs(0, t)} .workers=${WORKERS} .now=${t}></tc-agent-queue>`);
      const bar = el.querySelector<HTMLElement>('[data-shape="bar"]')!;
      const meta = bar.querySelector(".ui-agq__job-meta")!.textContent;
      expect(bar.getAttribute("aria-label")!.startsWith(`Summarize ${meta}`)).toBe(true);
    });

    test(`${look}: one job in the tab order; arrows walk the busy slots, then the queue; Enter pins the card`, async () => {
      const t = Date.now();
      const el = await fixture<TcAgentQueue>(html`<tc-agent-queue look=${look} .jobs=${jobs(30_000, t)} .workers=${WORKERS} .now=${t}></tc-agent-queue>`);
      const tabbable = () => [...el.querySelectorAll<HTMLElement>('.ui-agq__job[tabindex="0"]')];
      expect(tabbable()).toHaveLength(1);
      const first = job(el, "Summarize");
      expect(tabbable()[0]).toBe(first);
      first.focus();
      key(first, "ArrowDown");
      await settle();
      expect(document.activeElement).toBe(job(el, "Job 0"));
      key(document.activeElement!, "End");
      await settle();
      expect(document.activeElement).toBe(job(el, "Job 4"));
      expect(tabbable()).toEqual([job(el, "Job 4")]);
      key(document.activeElement!, "Home");
      await settle();
      expect(document.activeElement).toBe(first);
      first.click();
      await settle();
      expect(el.querySelector('[role="dialog"]')).toBeTruthy();
      expect(first.getAttribute("aria-expanded")).toBe("true");
      key(first, "Escape");
      await settle();
      expect(el.querySelector('[role="dialog"]')).toBeNull();
    });

    test(`${look}: backlog squares are 12px, 24px apart, with a 24px hit area (WCAG 2.5.8)`, async () => {
      const t = Date.now();
      const many: QueueJob[] = Array.from({ length: 12 }, (_, i) => ({ id: `q${String(i).padStart(2, "0")}`, name: `Job ${i}`, kind: "tool", status: "queued", enqueuedAt: t - 10_000 + i }));
      const host = document.createElement("div");
      host.style.width = "820px";
      document.body.append(host);
      litRender(html`<tc-agent-queue look=${look} .jobs=${many} .workers=${WORKERS} .now=${t}></tc-agent-queue>`, host);
      await settle();
      await settle();
      const squares = [...host.querySelectorAll<HTMLElement>('.ui-agq__job[data-shape="square"]')];
      expect(squares.length).toBeGreaterThan(2);
      // Layout boxes (offset sizes and the translate they are placed with) – they scale in, so not client rects
      const x = (el: HTMLElement) => parseFloat(el.style.translate);
      expect(squares[0].offsetWidth).toBe(12);
      expect(squares[0].offsetHeight).toBe(12);
      expect(x(squares[1]) - x(squares[0])).toBeGreaterThanOrEqual(24);
      const before = getComputedStyle(squares[0], "::before");
      expect(before.content).not.toBe("none");
      expect(before.top).toBe("-6px");
      expect(before.left).toBe("-6px");
    });

    test(`${look}: Cancel returns focus to the job; if the job then leaves, focus stays inside the queue`, async () => {
      const t = Date.now();
      const el = await fixture<TcAgentQueue>(html`<tc-agent-queue look=${look} cancellable .jobs=${jobs(0, t)} .workers=${WORKERS} .now=${t} .openId=${"q0"}></tc-agent-queue>`);
      const cancelled: QueueJob[] = [];
      el.addEventListener("tc-cancel", (e) => cancelled.push((e as CustomEvent<{ job: QueueJob }>).detail.job));
      const cancel = [...el.querySelectorAll<HTMLButtonElement>(".ui-agq__pop button")].find((b) => b.textContent!.trim() === "Cancel")!;
      cancel.focus();
      cancel.click();
      await settle();
      expect(cancelled.map((j) => j.id)).toEqual(["q0"]);
      expect(el.contains(document.activeElement)).toBe(true);
      el.jobs = jobs(0, t).filter((j) => j.id !== "q0");
      await settle();
      expect(document.activeElement).not.toBe(document.body);
      expect(el.contains(document.activeElement)).toBe(true);
    });

    test(`${look}: the stepper and Move to front report through events`, async () => {
      const t = Date.now();
      const el = await fixture<TcAgentQueue>(html`<tc-agent-queue look=${look} stepper promotable .jobs=${jobs(0, t)} .workers=${WORKERS} .now=${t} .openId=${"q2"}></tc-agent-queue>`);
      const got: unknown[] = [];
      el.addEventListener("tc-concurrency-change", (e) => got.push((e as CustomEvent).detail));
      el.addEventListener("tc-promote", (e) => got.push((e as CustomEvent<{ job: QueueJob }>).detail.job.id));
      el.querySelector<HTMLButtonElement>('[aria-label="One worker more"]')!.click();
      el.querySelector<HTMLButtonElement>('[aria-label="One worker less"]')!.click();
      [...el.querySelectorAll<HTMLButtonElement>(".ui-agq__pop button")].find((b) => b.textContent!.trim() === "Move to front")!.click();
      expect(got).toEqual([{ workers: 3 }, { workers: 1 }, "q2"]);
    });
  }

  test("React wrapper: an uncontrolled pinned card survives a parent re-render, and onOpenChange gets the app's job", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    host.style.width = "820px";
    document.body.append(host);
    const root = createRoot(host);
    const t = Date.now();
    const list = jobs(30_000, t).map((j) => (j.id === "q0" ? { ...j, icon: React.createElement("i", null, "Q") } : j));
    const opened: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(AgentQueue, { jobs: list, workers: WORKERS, now: t, onOpenChange: (_id, j) => void opened.push(j), "data-n": n } as React.ComponentProps<typeof AgentQueue>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-agent-queue")!;
    expect(el.querySelector(".ui-agq__job-icon i")!.textContent).toBe("Q");
    job(el, "Job 0").click();
    await settle();
    expect(opened[0]).toBe(list[1]);
    await act(async () => bump());
    await settle();
    expect(el.querySelector('[role="dialog"]')).toBeTruthy();
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look", async () => {
    const t = Date.now();
    const wrap = await fixture(html`<div style="width: 820px">
      <tc-agent-queue pausable stepper .jobs=${jobs(30_000, t)} .workers=${WORKERS} .now=${t} backpressure="3"></tc-agent-queue>
      <tc-agent-queue look="clean" heading="Clean" .jobs=${jobs(0, t)} .workers=${WORKERS} .now=${t} .openId=${"r1"}></tc-agent-queue>
    </div>`);
    // Contrast is checked at rest: finish the entrances (a re-render can start new ones, so until none are left)
    for (let i = 0; i < 5; i++) {
      const running = wrap.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity);
      if (!running.length) break;
      for (const a of running) a.finish();
      await settle();
    }
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

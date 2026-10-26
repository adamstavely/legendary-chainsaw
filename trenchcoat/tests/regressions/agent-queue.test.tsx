/* agent-queue: its own clock re-rendered ~30×/s while anything was queued; a controlled openId for a job that isn't
   placed fired onOpenChange(null) on every one of those renders (H11) */
import { Profiler, StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/agent-queue";
import * as clean from "@components/agent-queue-clean";
import type { QueueJob, QueueWorker } from "@components/agent-queue";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const FRAME = 16;

beforeEach(() =>
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
    now: new Date("2026-10-24T12:00:00Z"),
  }),
);
afterEach(() => vi.useRealTimers());

const frames = async (ms: number, each?: () => void) => {
  for (let t = 0; t < ms; t += FRAME) {
    await act(async () => {
      vi.advanceTimersByTime(FRAME);
    });
    each?.();
  }
};

const WORKERS: QueueWorker[] = [
  { id: "w1", name: "Worker 1" },
  { id: "w2", name: "Worker 2" },
];
// Fake timers start at a fixed time, so these are stable
const jobs = (age: number): QueueJob[] => {
  const t = Date.now();
  return [
    { id: "r1", name: "Summarize", kind: "llm", status: "running", worker: "w1", enqueuedAt: t - age - 4000, startedAt: t - age, estimate: 60_000 },
    ...Array.from({ length: 5 }, (_, i): QueueJob => ({ id: `q${i}`, name: `Job ${i}`, kind: "tool", status: "queued", enqueuedAt: t - age + i * 100 })),
  ];
};

for (const [style, ui] of styles) {
  describe(`agent-queue ${style}`, () => {
    for (const [label, age] of [
      ["times in whole seconds", 30_000],
      ["times in tenths", 0],
    ] as const) {
      test(`own clock: the chart glides every frame, renders stay well under the frame rate (${label})`, async () => {
        let commits = 0;
        const view = render(
          <StrictMode>
            <Profiler id="queue" onRender={() => commits++}>
              <ui.AgentQueue jobs={jobs(age)} workers={WORKERS} />
            </Profiler>
          </StrictMode>,
        );
        await frames(500);
        commits = 0;
        const line = () => view.container.querySelector('path[class$="__line"]')?.getAttribute("d");
        const drawn = new Set<string | null | undefined>();
        await frames(2000, () => drawn.add(line()));
        const n = 2000 / FRAME;
        // 4 a second with whole seconds, 10 with tenths – the old clock re-rendered on every other frame
        expect(commits).toBeLessThanOrEqual(age ? 2 * 4 + 2 : 2 * 10 + 2);
        expect(commits).toBeLessThan(n / 4);
        // ...while the chart moved on almost every frame
        expect(drawn.size).toBeGreaterThan(n / 2);
        view.unmount();
        expect(vi.getTimerCount()).toBe(0);
      });
    }

    test("a controlled openId for a job that isn't placed asks to close once, not on every render", async () => {
      const onOpenChange = vi.fn();
      render(<ui.AgentQueue jobs={jobs(30_000)} workers={WORKERS} openId="missing" onOpenChange={onOpenChange} />);
      await frames(1000);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(null, undefined);
    });
  });
}

/* Phase 3: render is pure (the memory is kept after commits), paused is controllable both ways */
for (const [style, ui] of styles) {
  describe(`agent-queue ${style} – contract`, () => {
    test("uncontrolled paused toggles from its button and reports", async () => {
      const onPausedChange = vi.fn();
      const view = render(<ui.AgentQueue jobs={jobs(30_000)} workers={WORKERS} now={Date.now()} onPausedChange={onPausedChange} />);
      const button = view.getByRole("button", { name: "Pause the queue" });
      await act(async () => button.click());
      expect(onPausedChange).toHaveBeenCalledWith(true);
      expect(view.container.firstElementChild?.getAttribute("data-state")).toBe("paused");
    });

    test("a failed job is held, announced once and then lands – also in StrictMode's double render", async () => {
      const t = Date.now();
      const running: QueueJob = { id: "r1", name: "Summarize", kind: "llm", status: "running", worker: "w1", enqueuedAt: t - 4000, startedAt: t - 2000 };
      const view = render(
        <StrictMode>
          <ui.AgentQueue jobs={[running]} workers={WORKERS} now={t} />
        </StrictMode>,
      );
      await frames(200);
      view.rerender(
        <StrictMode>
          <ui.AgentQueue jobs={[{ ...running, status: "failed", endedAt: t, error: "timeout" }]} workers={WORKERS} now={t} />
        </StrictMode>,
      );
      await frames(100);
      expect(view.container.textContent).toContain("Summarize failed: timeout");
      // Held in its slot, red, for a beat
      expect(view.container.querySelector('[data-shape="bar"]')).not.toBeNull();
      await frames(1600);
      // Landed in its bin: no longer a bar in the slot
      expect(view.container.querySelector('[data-shape="bar"]')).toBeNull();
    });
  });
}

/* WCAG + design pass (f3): the rate-limit pill isn't a live region, focus opens the peek and Esc closes it, Cancel
 * keeps focus on a job, job names start with what the job shows */
import { fireEvent, screen } from "@testing-library/react";

for (const [style, ui] of styles) {
  describe(`agent-queue ${style} – a11y`, () => {
    test("the rate-limit countdown is not a live region; one persistent region announces the limit", () => {
      const t = Date.now();
      const { container } = render(<ui.AgentQueue jobs={jobs(0)} workers={WORKERS} now={t} rateLimits={[{ from: t - 1000, until: t + 30_000 }]} />);
      const pill = container.querySelector('.ui-agq__pill[data-status="limited"]')!;
      expect(pill.getAttribute("role")).toBeNull();
      expect(container.querySelectorAll('[aria-live="polite"].ui-agq__sr')).toHaveLength(1);
    });

    test("focus on a job shows its peek, and Esc closes it without moving focus", () => {
      const { container } = render(<ui.AgentQueue jobs={jobs(0)} workers={WORKERS} now={Date.now()} />);
      const job = container.querySelector<HTMLElement>('.ui-agq__job[tabindex="0"]')!;
      act(() => job.focus());
      expect(screen.getByRole("tooltip")).toBeTruthy();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("tooltip")).toBeNull();
      expect(document.activeElement).toBe(job);
    });

    test("a job's name starts with the text it shows", () => {
      const { container } = render(<ui.AgentQueue jobs={jobs(0)} workers={WORKERS} now={Date.now()} />);
      const job = container.querySelector<HTMLElement>('[data-shape="bar"]')!;
      const meta = job.querySelector(".ui-agq__job-meta")!.textContent;
      expect(job.getAttribute("aria-label")!.startsWith(`Summarize ${meta}`)).toBe(true);
    });

    test("Cancel returns focus to the job; if the job then leaves, focus stays inside the queue", async () => {
      const t = Date.now();
      const onCancel = vi.fn();
      const { container, rerender } = render(<ui.AgentQueue jobs={jobs(0)} workers={WORKERS} now={t} defaultOpenId="q0" onCancel={onCancel} />);
      const cancel = screen.getByRole("button", { name: "Cancel" });
      cancel.focus();
      fireEvent.click(cancel);
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(document.activeElement?.closest(".ui-agq")).toBe(container.querySelector(".ui-agq"));
      await act(async () => {
        rerender(<ui.AgentQueue jobs={jobs(0).filter((j) => j.id !== "q0")} workers={WORKERS} now={t} onCancel={onCancel} />);
      });
      expect(document.activeElement).not.toBe(document.body);
    });
  });
}

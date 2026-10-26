/* agent-lanes: the local override map masked later task updates – Phase 3 contract */
import { Profiler } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/agent-lanes";
import * as clean from "@components/agent-lanes-clean";
import type { LaneTask } from "@components/agent-lanes";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const NOW = Date.UTC(2026, 9, 24, 12);
const agents = [{ id: "ada", name: "Ada" }];
const waiting: LaneTask = { id: "a", agentId: "ada", title: "Ship it?", status: "waiting", start: NOW - 60_000 };
const statusOf = (c: HTMLElement) => c.querySelector('[data-task="a"]')?.getAttribute("data-status");

for (const [style, ui] of styles) {
  describe(`agent-lanes ${style}`, () => {
    test("a decision shows at once, and a later task update still wins", () => {
      const onApprove = vi.fn();
      const { container, rerender } = render(<ui.AgentLanes agents={agents} tasks={[waiting]} now={NOW} onApprove={onApprove} />);
      fireEvent.click(container.querySelector('[data-task="a"]')!);
      fireEvent.click(screen.getByRole("button", { name: "Approve" }));
      expect(onApprove).toHaveBeenCalledTimes(1);
      expect(statusOf(container)).toBe("running");
      rerender(<ui.AgentLanes agents={agents} tasks={[{ ...waiting, status: "failed", end: NOW }]} now={NOW} onApprove={onApprove} />);
      expect(statusOf(container)).toBe("failed");
    });

    test("an async decision waits, and a rejection keeps the block and says so", async () => {
      let fail: (e: Error) => void = () => {};
      const onReject = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
      const { container } = render(<ui.AgentLanes agents={agents} tasks={[waiting]} now={NOW} onReject={onReject} />);
      fireEvent.click(container.querySelector('[data-task="a"]')!);
      const reject = screen.getByRole("button", { name: "Reject" });
      fireEvent.click(reject);
      expect(reject).toHaveProperty("disabled", true);
      await act(async () => fail(new Error("offline")));
      expect(statusOf(container)).toBe("waiting");
      expect(screen.getByRole("alert").textContent).toMatch(/try again/);
    });

    test("without `now` nothing is placed until the clock is read, then the lanes follow it", () => {
      vi.useFakeTimers({ now: NOW });
      try {
        const { container } = render(<ui.AgentLanes agents={agents} tasks={[waiting]} />);
        expect(container.querySelector('[data-task="a"]')).toBeTruthy();
        act(() => {
          vi.advanceTimersByTime(500);
        });
        expect(container.querySelector('[data-task="a"]')).toBeTruthy();
      } finally {
        vi.useRealTimers();
      }
    });

    test("DOM ids never contain the task id", () => {
      const { container } = render(<ui.AgentLanes agents={agents} tasks={[{ ...waiting, id: "x y" }]} now={NOW} defaultExpanded="x y" />);
      const pop = container.querySelector(".ui-al__pop")!;
      expect(pop.id).not.toContain("x");
      expect(container.querySelector('[aria-expanded="true"]')?.getAttribute("aria-controls")).toBe(pop.id);
    });
  });
}

/* Phase 4: the clock moves pixels without rendering; renders come only when a label or the set of blocks changes */
for (const [style, ui] of styles) {
  describe(`agent-lanes ${style} – performance`, () => {
    const steps = async (ms: number) => {
      for (let t = 0; t < ms; t += 16)
        await act(async () => {
          vi.advanceTimersByTime(16);
        });
    };
    const shift = (c: HTMLElement) => Number((c.querySelector(".ui-al__track") as HTMLElement).style.getPropertyValue("--t"));

    test("real time: the window slides every few frames, with no render in between", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "Date", "performance"], now: NOW });
      try {
        let commits = 0;
        const running: LaneTask = { id: "r", agentId: "ada", title: "Draft", status: "running", start: NOW - 10_000 };
        const { container, unmount } = render(
          <Profiler id="lanes" onRender={() => commits++}>
            <ui.AgentLanes agents={agents} tasks={[running]} />
          </Profiler>,
        );
        await steps(100);
        commits = 0;
        const before = shift(container);
        await steps(5_000);
        expect(shift(container)).toBeGreaterThan(before);
        expect(commits).toBe(0);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });

    test("`now` with a `rate` runs the clock on from it, rendering once a duration label changes", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "Date", "performance"], now: NOW });
      try {
        let commits = 0;
        const running: LaneTask = { id: "r", agentId: "ada", title: "Draft", status: "running", start: NOW - 60_000 };
        const label = (c: HTMLElement) => c.querySelector('[data-task="r"]')?.getAttribute("aria-label");
        const { container } = render(
          <Profiler id="lanes" onRender={() => commits++}>
            <ui.AgentLanes agents={agents} tasks={[running]} now={NOW} rate={60} />
          </Profiler>,
        );
        expect(label(container)).toMatch(/, 1m$/);
        commits = 0;
        // 60× real time: a demo minute a second – the label rounds to 2m half a minute in, and to 3m a minute later
        await steps(2_000);
        expect(label(container)).toMatch(/, 3m$/);
        expect(commits).toBeLessThanOrEqual(3);
        expect(shift(container)).toBeGreaterThan(5);
      } finally {
        vi.useRealTimers();
      }
    });
  });
}

/* WCAG + design pass (f3): the moving timeline can be paused and holds still under the pointer and focus (2.2.2),
 * decisions hand focus back to their block (2.4.3), the details popover isn't a role=tooltip, failed isn't colour only */
const done: LaneTask = { id: "d", agentId: "ada", title: "Triage the inbox", status: "done", start: NOW - 600_000, end: NOW - 300_000, summary: ["Sorted 12"] };
const failed: LaneTask = { id: "f", agentId: "ada", title: "Fix date parsing", status: "failed", start: NOW - 280_000, end: NOW - 200_000 };

for (const [style, ui] of styles) {
  describe(`agent-lanes ${style} – a11y`, () => {
    test("a running clock gets one Pause toggle that keeps focus; a still clock has none", () => {
      const { container, rerender } = render(<ui.AgentLanes agents={agents} tasks={[done]} now={NOW} />);
      expect(screen.queryByRole("button", { name: "Pause timeline" })).toBeNull();
      rerender(<ui.AgentLanes agents={agents} tasks={[done]} now={NOW} rate={20} />);
      const pause = screen.getByRole("button", { name: "Pause timeline" });
      expect(pause.getAttribute("aria-pressed")).toBe("false");
      expect(container.querySelector(".ui-al")!.hasAttribute("data-still")).toBe(false);
      pause.focus();
      fireEvent.click(pause);
      expect(screen.getByRole("button", { name: "Pause timeline" })).toBe(pause);
      expect(pause.getAttribute("aria-pressed")).toBe("true");
      expect(document.activeElement).toBe(pause);
      expect(container.querySelector(".ui-al")!.hasAttribute("data-still")).toBe(true);
    });

    test("focus on a block holds the timeline still", () => {
      const { container } = render(<ui.AgentLanes agents={agents} tasks={[done]} now={NOW} rate={20} />);
      const block = container.querySelector<HTMLElement>('[data-task="d"]')!;
      act(() => block.focus());
      expect(container.querySelector(".ui-al")!.hasAttribute("data-still")).toBe(true);
    });

    test("Approve hands focus back to the block, not <body>", () => {
      const { container } = render(<ui.AgentLanes agents={agents} tasks={[waiting]} now={NOW} onApprove={() => {}} />);
      fireEvent.click(container.querySelector('[data-task="a"]')!);
      const approve = screen.getByRole("button", { name: "Approve" });
      approve.focus();
      fireEvent.click(approve);
      expect(document.activeElement).toBe(container.querySelector('[data-task="a"]'));
    });

    test("the details popover is a labelled group, not a tooltip holding a button", () => {
      const { container } = render(<ui.AgentLanes agents={agents} tasks={[done]} now={NOW} onOpen={() => {}} />);
      fireEvent.click(container.querySelector('[data-task="d"]')!);
      expect(screen.queryByRole("tooltip")).toBeNull();
      const group = screen.getByRole("group", { name: "Triage the inbox – details" });
      expect(group.querySelector("button")!.textContent).toBe("Open");
    });

    test("a failed block carries a mark, and every block names its full title", () => {
      const { container } = render(<ui.AgentLanes agents={agents} tasks={[done, failed]} now={NOW} />);
      expect(container.querySelector('[data-task="f"] .ui-al__mark')).toBeTruthy();
      expect(container.querySelector('[data-task="d"] .ui-al__mark')).toBeNull();
      expect(container.querySelector('[data-task="f"]')!.getAttribute("title")).toBe("Fix date parsing");
    });
  });
}

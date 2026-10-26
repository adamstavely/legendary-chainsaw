/*
 * fan-out-grid: `now` was job-relative ms with no clock of its own. Now `now` is epoch ms (task start/end on the same
 * clock), `elapsed` keeps the old job-relative meaning, and without either the grid reads the clock after mount.
 * Also: filter and selection are controllable, and an onRetry promise holds the button (a rejection says so).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/fan-out-grid";
import * as clean from "@components/fan-out-grid-clean";
import type { FanoutTask } from "@components/fan-out-grid";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const T0 = Date.UTC(2026, 9, 24, 12, 0, 0);
const time = (c: HTMLElement) => c.querySelector(".ui-fog__time")!.textContent;

for (const [style, ui] of [
  ["standard", standard],
  ["clean", clean],
] as const) {
  describe(`fan-out-grid ${style}`, () => {
    test("`now` in epoch ms counts from the earliest start", () => {
      const tasks: FanoutTask[] = [{ id: "a", label: "a", status: "running", start: T0 }];
      const { container } = render(<ui.FanoutGrid tasks={tasks} now={T0 + 12_000} />);
      expect(time(container)).toBe("12s so far");
    });

    test("`elapsed` keeps the job-relative meaning", () => {
      const tasks: FanoutTask[] = [{ id: "a", label: "a", status: "running", start: 400 }];
      const { container } = render(<ui.FanoutGrid tasks={tasks} elapsed={5_000} />);
      expect(time(container)).toBe("5.0s so far");
    });

    test("without a clock prop it reads the clock after mount and ticks while tasks run", async () => {
      vi.setSystemTime(T0 + 3_000);
      const tasks: FanoutTask[] = [{ id: "a", label: "a", status: "running", start: T0 }];
      const { container } = render(<ui.FanoutGrid tasks={tasks} />);
      await act(async () => {});
      expect(time(container)).toBe("3.0s so far");
      await act(async () => vi.advanceTimersByTime(2_000));
      expect(time(container)).toBe("5.0s so far");
    });

    test("finished: the span from the first start to the last end", () => {
      const tasks: FanoutTask[] = [
        { id: "a", label: "a", status: "done", start: T0, end: T0 + 4_000 },
        { id: "b", label: "b", status: "failed", start: T0 + 1_000, end: T0 + 7_000 },
      ];
      const { container } = render(<ui.FanoutGrid tasks={tasks} now={T0 + 9_000} />);
      expect(time(container)).toBe("Finished in 7.0s");
    });

    test("controlled filter reports and follows its prop", () => {
      const onFilterChange = vi.fn();
      const tasks: FanoutTask[] = [{ id: "a", label: "a", status: "done", start: 0, end: 10 }];
      const { container } = render(<ui.FanoutGrid tasks={tasks} now={20} filter={null} onFilterChange={onFilterChange} />);
      fireEvent.click(container.querySelector('.ui-fog__key[data-status="done"]')!);
      expect(onFilterChange).toHaveBeenCalledWith("done");
      expect(container.querySelector('.ui-fog__key[aria-pressed="true"]')).toBeNull();
    });

    test("a rejected onRetry says so and the button can be pressed again", async () => {
      const onRetry = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
      const tasks: FanoutTask[] = [{ id: "a", label: "a", status: "failed", start: 0, end: 10 }];
      render(<ui.FanoutGrid tasks={tasks} now={20} onRetry={onRetry} />);
      await act(async () => fireEvent.click(screen.getByRole("button", { name: /Retry failed/ })));
      expect(onRetry).toHaveBeenCalledWith(["a"]);
      expect(screen.getByRole("alert").textContent).toMatch(/Couldn't retry/);
      await act(async () => fireEvent.click(screen.getByRole("button", { name: /try again/ })));
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("alert")).toBeNull();
    });

    const mixed: FanoutTask[] = [
      { id: "a", label: "alpha.io", status: "done", start: 0, end: 10 },
      { id: "b", label: "beta.io", status: "running", start: 0 },
      { id: "c", label: "gamma.io", status: "failed", start: 0, end: 10, error: "timeout" },
      { id: "d", label: "delta.io", status: "queued" },
    ];

    test("WCAG 4.1.2: the grid is a listbox of named options; arrows move the active option", () => {
      render(<ui.FanoutGrid tasks={mixed} now={20} />);
      const grid = screen.getByRole("listbox");
      const options = screen.getAllByRole("option");
      expect(options.map((o) => o.getAttribute("aria-label"))).toEqual(["alpha.io, done", "beta.io, running", "gamma.io, failed", "delta.io, queued"]);
      act(() => grid.focus());
      expect(grid.getAttribute("aria-activedescendant")).toBe(options[0].id);
      fireEvent.keyDown(grid, { key: "ArrowRight" });
      expect(grid.getAttribute("aria-activedescendant")).toBe(options[1].id);
      fireEvent.keyDown(grid, { key: "Enter" });
      expect(options[1].getAttribute("aria-selected")).toBe("true");
    });

    test("WCAG 1.4.13: the hover window can be hovered and closes with Escape without moving focus", async () => {
      const { container } = render(<ui.FanoutGrid tasks={mixed} now={20} />);
      const before = document.activeElement;
      fireEvent.mouseEnter(screen.getAllByRole("option")[2]);
      const tip = screen.getByRole("tooltip");
      fireEvent.mouseLeave(container.querySelector(".ui-fog__grid")!);
      fireEvent.mouseEnter(tip);
      await act(async () => vi.advanceTimersByTime(500));
      expect(screen.getByRole("tooltip")).toBeTruthy();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("tooltip")).toBeNull();
      expect(document.activeElement).toBe(before);
    });

    test("WCAG 4.1.3: the live region is there from mount and speaks in steps of ten percent", () => {
      const tasks: FanoutTask[] = Array.from({ length: 20 }, (_, i) => ({ id: `t${i}`, label: `t${i}`, status: i < 2 ? "done" : "running", start: 0 }));
      const { container, rerender } = render(<ui.FanoutGrid tasks={tasks} now={20} />);
      const live = container.querySelector('.ui-fog__sr[aria-live="polite"]')!;
      expect(live.textContent).toBe("10% of 20 tasks done.");
      rerender(<ui.FanoutGrid tasks={tasks.map((t, i) => (i === 2 ? { ...t, status: "done" as const, end: 5 } : t))} now={20} />);
      expect(live.textContent).toBe("10% of 20 tasks done.");
    });

    test("WCAG 2.4.3: Retry going away moves focus to the grid", async () => {
      const tasks: FanoutTask[] = [{ id: "a", label: "a", status: "failed", start: 0, end: 10 }];
      const { rerender } = render(<ui.FanoutGrid tasks={tasks} now={20} onRetry={() => {}} />);
      act(() => screen.getByRole("button", { name: /Retry failed/ }).focus());
      rerender(<ui.FanoutGrid tasks={[{ ...tasks[0], status: "running" }]} now={20} onRetry={() => {}} />);
      await act(async () => {});
      expect(document.activeElement).toBe(screen.getByRole("listbox"));
    });

    test("performance and 2.2.2: the shine moves with transform, stops after a few runs and pauses off-screen", () => {
      render(<ui.FanoutGrid tasks={mixed} now={20} />);
      const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("");
      expect(css).not.toMatch(/background-position/);
      expect(css).toMatch(/ui-fog-cell-sweep \{ from \{ transform/);
      expect(css).not.toMatch(/infinite/);
      expect(css).toMatch(/\[data-offscreen\] \.ui-fog__cell[^{]*\{ animation-play-state: paused/);
    });
  });
}

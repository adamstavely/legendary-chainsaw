/*
 * parallel-attempts: the best attempt was taken on its own once all were through, but onPick never heard of it; a pick
 * from an earlier run stuck around. Now the auto pick is reported (`auto: true`), picks by hand say `auto: false`,
 * and a pick that isn't among the attempts any more no longer counts.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/parallel-attempts";
import * as clean from "@components/parallel-attempts-clean";
import type { Attempt } from "@components/parallel-attempts";

const run = (status: Attempt["status"], prefix = ""): Attempt[] => [
  { id: `${prefix}a`, name: "Attempt A", approach: "Mock the API", status, score: 80 },
  { id: `${prefix}b`, name: "Attempt B", approach: "Retry the call", status, score: 60 },
];
const inUse = (c: HTMLElement) => c.querySelector(".ui-pa__row[data-picked] .ui-pa__name")?.firstChild?.textContent ?? null;

for (const [style, ui] of [
  ["standard", standard],
  ["clean", clean],
] as const) {
  describe(`parallel-attempts ${style}`, () => {
    test("the auto pick is reported once all are through; a pick by hand says so", () => {
      const onPick = vi.fn();
      const { container, rerender } = render(<ui.ParallelAttempts attempts={run("running")} onPick={onPick} />);
      expect(onPick).not.toHaveBeenCalled();
      rerender(<ui.ParallelAttempts attempts={run("done")} onPick={onPick} />);
      expect(onPick).toHaveBeenCalledTimes(1);
      expect(onPick).toHaveBeenLastCalledWith(expect.objectContaining({ id: "a" }), { auto: true });
      expect(inUse(container)).toBe("Attempt A");
      fireEvent.click(screen.getByRole("radio", { name: /Use this one: Attempt B/ }));
      expect(onPick).toHaveBeenLastCalledWith(expect.objectContaining({ id: "b" }), { auto: false });
      expect(inUse(container)).toBe("Attempt B");
    });

    test("a pick from an earlier run doesn't stick to a new one", () => {
      const { container, rerender } = render(<ui.ParallelAttempts attempts={run("done")} />);
      fireEvent.click(screen.getByRole("radio", { name: /Use this one: Attempt B/ }));
      rerender(<ui.ParallelAttempts attempts={run("done", "r2-")} />);
      expect(inUse(container)).toBe("Attempt A");
    });

    test("controlled: a click reports, the prop decides", () => {
      const onPick = vi.fn();
      const { container } = render(<ui.ParallelAttempts attempts={run("done")} picked="a" onPick={onPick} />);
      fireEvent.click(screen.getByRole("radio", { name: /Use this one: Attempt B/ }));
      expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }), { auto: false });
      expect(inUse(container)).toBe("Attempt A");
    });
    /* WCAG + design pass */
    test("radio group: one tab stop on the one in use, arrow keys move and pick (APG)", () => {
      const onPick = vi.fn();
      render(<ui.ParallelAttempts attempts={run("done")} onPick={onPick} />);
      const [a, b] = screen.getAllByRole("radio");
      expect([a.tabIndex, b.tabIndex]).toEqual([0, -1]);
      a.focus();
      fireEvent.keyDown(a, { key: "ArrowDown" });
      expect(document.activeElement).toBe(screen.getByRole("radio", { name: /In use: Attempt B/ }));
      expect(onPick).toHaveBeenLastCalledWith(expect.objectContaining({ id: "b" }), { auto: false });
      expect(screen.getAllByRole("radio").map((r) => r.tabIndex)).toEqual([-1, 0]);
    });

    test("a persistent status says the result and the pick, not the running progress (4.1.3)", () => {
      const { rerender } = render(<ui.ParallelAttempts attempts={run("running")} />);
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      rerender(<ui.ParallelAttempts attempts={run("done")} />);
      expect(screen.getByRole("status")).toBe(status);
      expect(status.textContent).toBe("2 of 2 done, best: Attempt A. Using Attempt A.");
    });

    test("styles: quiet rows never fade their text; the running sweep stops and pauses off-screen", () => {
      render(<ui.ParallelAttempts attempts={run("running")} />);
      const sheet = [...document.querySelectorAll("style")].map((x) => x.textContent).join("\n");
      expect(sheet).not.toMatch(/\.ui-pa__row\[data-quiet\] { opacity/);
      expect(sheet).not.toMatch(/ui-pa-(sweep|glow)[^;]*infinite/);
      expect(sheet).toMatch(/\.ui-pa\[data-offscreen\] \.ui-pa__fill::before/);
    });
  });
}

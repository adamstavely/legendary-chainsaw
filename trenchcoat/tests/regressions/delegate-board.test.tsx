/*
 * delegate-board: a move made on the board used to mask `tasks` forever (and passing onAssign froze the board).
 * Now the board moves at once, reports, and `tasks` wins as soon as it gives that task another agent.
 * The clock is read after mount; tooltip ids no longer come from agent ids.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/delegate-board";
import * as clean from "@components/delegate-board-clean";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const agents = [
  { id: "a1", name: "Research" },
  { id: "a2", name: "Review" },
];
const task = (agentId: string | null) => [{ id: "t1", title: "Summarise the RFC", estimate: 12, agentId }];
const queueOf = (c: HTMLElement, id: string) => c.querySelector(`[data-agent="${id}"] .ui-db__queue`)!.textContent;

for (const [style, ui] of [
  ["standard", standard],
  ["clean", clean],
] as const) {
  describe(`delegate-board ${style}`, () => {
    test("a listening onAssign doesn't freeze the board, and `tasks` wins once it changes", () => {
      const onAssign = vi.fn();
      const { container, rerender } = render(<ui.DelegateBoard agents={agents} tasks={task(null)} now={0} onAssign={onAssign} />);
      fireEvent.keyDown(screen.getByRole("button", { name: /Summarise the RFC/ }), { key: "1" });
      expect(onAssign).toHaveBeenCalledWith("t1", "a1");
      expect(queueOf(container, "a1")).toContain("Summarise the RFC");
      // A re-render with the same tasks keeps the move
      rerender(<ui.DelegateBoard agents={agents} tasks={task(null)} now={0} onAssign={onAssign} />);
      expect(queueOf(container, "a1")).toContain("Summarise the RFC");
      // The parent assigns it elsewhere: that shows
      rerender(<ui.DelegateBoard agents={agents} tasks={task("a2")} now={0} onAssign={onAssign} />);
      expect(queueOf(container, "a1")).not.toContain("Summarise the RFC");
      expect(queueOf(container, "a2")).toContain("Summarise the RFC");
    });

    test("controlled mode: the switch reports, the prop decides", () => {
      const onModeChange = vi.fn();
      render(<ui.DelegateBoard agents={agents} tasks={task(null)} now={0} mode="manual" onModeChange={onModeChange} />);
      fireEvent.click(screen.getByRole("switch"));
      expect(onModeChange).toHaveBeenCalledWith("auto");
      expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("false");
    });

    test("without `now` the clock is read after mount", async () => {
      vi.setSystemTime(new Date(2026, 9, 24, 9, 0));
      const { container } = render(<ui.DelegateBoard agents={agents} tasks={task("a1")} />);
      await act(async () => {});
      expect(container.querySelector('[data-kind="busy"]')!.textContent).toBe("Busy until 09:12");
    });

    describe("WCAG pass", () => {
      const many = [
        { id: "q1", title: "Run the migration", estimate: 5, agentId: "a1" },
        { id: "q2", title: "Write the notes", estimate: 5, agentId: "a1" },
        { id: "q3", title: "Tag the release", estimate: 5, agentId: "a1" },
        { id: "q4", title: "Email the team", estimate: 5, agentId: "a1" },
        { id: "q5", title: "Close the ticket", estimate: 5, agentId: "a1" },
      ];
      const status = (c: HTMLElement) => c.querySelector('[role="status"]')!;

      test("2.5.7: click a task, then click an agent – no drag needed", () => {
        const onAssign = vi.fn();
        const { container } = render(<ui.DelegateBoard agents={agents} tasks={task(null)} now={0} onAssign={onAssign} />);
        fireEvent.click(screen.getByRole("button", { name: /Summarise the RFC/ }), { detail: 1 });
        expect(container.querySelector("[data-picked]")).not.toBeNull();
        fireEvent.click(container.querySelector('[data-agent="a2"]')!);
        expect(onAssign).toHaveBeenCalledWith("t1", "a2");
        expect(queueOf(container, "a2")).toContain("Summarise the RFC");
      });

      test("a picked queued chip goes back to Unassigned on a click on the pile", () => {
        const onAssign = vi.fn();
        const { container } = render(<ui.DelegateBoard agents={agents} tasks={task("a1")} now={0} onAssign={onAssign} />);
        fireEvent.click(container.querySelector('[data-chip-id="t1"]')!, { detail: 1 });
        fireEvent.click(container.querySelector("[data-pile]")!);
        expect(onAssign).toHaveBeenCalledWith("t1", null);
      });

      test("keyboard: the status region is there from mount, arrow keys announce the target, focus follows the task", () => {
        const onAssign = vi.fn();
        const { container } = render(<ui.DelegateBoard agents={agents} tasks={task(null)} now={0} onAssign={onAssign} />);
        expect(status(container).textContent).toBe("");
        const btn = screen.getByRole("button", { name: /Summarise the RFC/ });
        btn.focus();
        fireEvent.keyDown(btn, { key: "Enter" });
        expect(status(container).textContent).toMatch(/Picked up Summarise the RFC/);
        fireEvent.keyDown(btn, { key: "ArrowDown" });
        expect(status(container).textContent).toMatch(/^Review: \+12 min/);
        fireEvent.keyDown(btn, { key: "Enter" });
        expect(onAssign).toHaveBeenCalledWith("t1", "a2");
        // The card became a chip in Review's queue – it keeps focus there
        expect(document.activeElement).toBe(container.querySelector('[data-chip-id="t1"]'));
      });

      test("keyboard unassign: Delete on a queued chip, or choose Unassigned with the arrows", () => {
        const onAssign = vi.fn();
        const { container } = render(<ui.DelegateBoard agents={agents} tasks={task("a1")} now={0} onAssign={onAssign} />);
        const chip = container.querySelector<HTMLElement>('[data-chip-id="t1"]')!;
        chip.focus();
        fireEvent.keyDown(chip, { key: "Enter" });
        fireEvent.keyDown(chip, { key: "ArrowUp" });
        expect(status(container).textContent).toBe("Unassigned");
        fireEvent.keyDown(chip, { key: "Escape" });
        fireEvent.keyDown(chip, { key: "Delete" });
        expect(onAssign).toHaveBeenCalledWith("t1", null);
        expect(document.activeElement).toBe(container.querySelector('[data-task-id="t1"]'));
      });

      test("tasks behind +N are reachable: the chip expands the queue and focus moves to the first revealed task", () => {
        const { container } = render(<ui.DelegateBoard agents={agents} tasks={many} now={0} />);
        const more = screen.getByRole("button", { name: "+2 more tasks" });
        expect(more.getAttribute("aria-expanded")).toBe("false");
        fireEvent.click(more);
        expect(more.getAttribute("aria-expanded")).toBe("true");
        expect(document.activeElement).toBe(container.querySelector('[data-chip-id="q4"]'));
        expect(screen.getByRole("button", { name: /Close the ticket/ })).toBeTruthy();
      });

      test("1.4.13: Esc closes the +N tooltip without moving focus", () => {
        const { container } = render(<ui.DelegateBoard agents={agents} tasks={many} now={0} />);
        const more = screen.getByRole("button", { name: "+2 more tasks" });
        more.focus();
        fireEvent.keyDown(more, { key: "Escape" });
        expect(container.querySelector(".ui-db__more")!.hasAttribute("data-tip-off")).toBe(true);
        expect(document.activeElement).toBe(more);
        fireEvent.pointerEnter(container.querySelector(".ui-db__more")!);
        fireEvent.pointerLeave(container.querySelector(".ui-db__more")!);
        expect(container.querySelector(".ui-db__more")!.hasAttribute("data-tip-off")).toBe(false);
      });

      test("the running task says so in its name, not only by colour", () => {
        render(<ui.DelegateBoard agents={agents} tasks={many} now={0} />);
        expect(screen.getByRole("button", { name: /^Running: Run the migration/ })).toBeTruthy();
      });
    });
  });
}

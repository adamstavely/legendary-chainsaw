/* agent-inbox: the local override map masked later task updates – Phase 3 contract */
import { Profiler } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/agent-inbox";
import * as clean from "@components/agent-inbox-clean";
import type { AgentTask } from "@components/agent-inbox";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const waiting: AgentTask = { id: "a", title: "Write the brief", agent: "Opus", status: "waiting", startedAt: 0 };
const statusOf = (c: HTMLElement) => c.querySelector('[data-id="a"]')?.getAttribute("data-status");

for (const [style, ui] of styles) {
  describe(`agent-inbox ${style}`, () => {
    test("a decision shows at once, and a later task update still wins", () => {
      const onApprove = vi.fn();
      const { container, rerender } = render(<ui.AgentInbox tasks={[waiting]} onApprove={onApprove} />);
      fireEvent.click(screen.getByRole("button", { name: "Approve" }));
      expect(onApprove).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
      expect(statusOf(container)).toBe("running");
      // The server says it failed after all – the prop is the source of truth
      rerender(<ui.AgentInbox tasks={[{ ...waiting, status: "failed" }]} onApprove={onApprove} />);
      expect(statusOf(container)).toBe("failed");
      rerender(<ui.AgentInbox tasks={[{ ...waiting, status: "done", elapsed: 1000 }]} onApprove={onApprove} />);
      expect(statusOf(container)).toBe("done");
    });

    test("an async decision waits, and a rejection leaves the card as it was", async () => {
      let fail: (e: Error) => void = () => {};
      const onApprove = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
      const { container } = render(<ui.AgentInbox tasks={[waiting]} onApprove={onApprove} />);
      const approve = screen.getByRole("button", { name: "Approve" });
      fireEvent.click(approve);
      // aria-disabled (not disabled) while it waits, so it keeps focus
      expect(approve.getAttribute("aria-disabled")).toBe("true");
      fireEvent.click(approve);
      expect(onApprove).toHaveBeenCalledTimes(1);
      await act(async () => fail(new Error("offline")));
      expect(statusOf(container)).toBe("waiting");
      expect(screen.getByRole("alert").textContent).toMatch(/try again/);
      expect(screen.getByRole("button", { name: "Approve" }).getAttribute("aria-disabled")).toBeNull();
    });

    test("an async decision that succeeds shows its result", async () => {
      let ok: () => void = () => {};
      const onRetry = vi.fn(() => new Promise<void>((resolve) => (ok = resolve)));
      const { container } = render(<ui.AgentInbox tasks={[{ ...waiting, status: "failed" }]} onRetry={onRetry} />);
      fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      expect(statusOf(container)).toBe("failed");
      await act(async () => ok());
      expect(statusOf(container)).toBe("running");
    });

    test("view and expanded are uncontrolled by default and report", () => {
      const onViewChange = vi.fn();
      const onExpandedChange = vi.fn();
      const { container } = render(<ui.AgentInbox tasks={[waiting]} onViewChange={onViewChange} onExpandedChange={onExpandedChange} />);
      fireEvent.click(screen.getByRole("radio", { name: /List/ }));
      expect(container.firstElementChild?.getAttribute("data-view")).toBe("list");
      expect(onViewChange).toHaveBeenCalledWith("list");
      fireEvent.click(container.querySelector(".ui-ai__card-main")!);
      expect(onExpandedChange).toHaveBeenCalledWith("a");
    });

    test("DOM ids never contain the task id", () => {
      const { container } = render(<ui.AgentInbox tasks={[{ ...waiting, id: 'x" y' }]} />);
      const fold = container.querySelector(".ui-ai__fold")!;
      expect(fold.id).not.toContain("x");
      expect(container.querySelector(".ui-ai__card-main")?.getAttribute("aria-controls")).toBe(fold.id);
    });
  });
}

/* Phase 4: the elapsed times tick in place – no render a second */
for (const [style, ui] of styles) {
  describe(`agent-inbox ${style} – performance`, () => {
    test("a running task's time moves on every second without re-rendering the inbox", () => {
      vi.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
      try {
        let commits = 0;
        const start = Date.now() - 5_000;
        const { container } = render(
          <Profiler id="inbox" onRender={() => commits++}>
            <ui.AgentInbox tasks={[{ id: "r", title: "Research", agent: "Opus", status: "running", startedAt: start }]} />
          </Profiler>,
        );
        const time = () => container.querySelector(".ui-ai__time")?.textContent;
        expect(time()).toBe("5s");
        commits = 0;
        act(() => {
          vi.advanceTimersByTime(3_000);
        });
        expect(time()).toBe("8s");
        expect(commits).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });
}

/* WCAG + design pass (f3): decisions keep focus on the card even after it moves columns, the layout radiogroup has
 * its keyboard pattern, counts are named in words, and the switch never disappears */
for (const [style, ui] of styles) {
  describe(`agent-inbox ${style} – a11y`, () => {
    test("Approve: focus goes to the card, and stays on it after it moves to Running (2.4.3)", async () => {
      vi.useFakeTimers();
      try {
        const { container } = render(<ui.AgentInbox tasks={[waiting]} defaultExpanded="a" onApprove={() => {}} />);
        const approve = screen.getByRole("button", { name: "Approve" });
        approve.focus();
        fireEvent.click(approve);
        expect(document.activeElement).toBe(container.querySelector('[data-id="a"] .ui-ai__card-main'));
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
        const main = container.querySelector('[data-id="a"] .ui-ai__card-main');
        expect(main!.closest('[aria-label="Running"]')).toBeTruthy();
        expect(document.activeElement).toBe(main);
      } finally {
        vi.useRealTimers();
      }
    });

    test("Board / List: one tab stop, arrow keys move and pick", () => {
      const { container } = render(<ui.AgentInbox tasks={[waiting]} />);
      const board = screen.getByRole("radio", { name: /Board/ });
      const list = screen.getByRole("radio", { name: /List/ });
      expect(board.tabIndex).toBe(0);
      expect(list.tabIndex).toBe(-1);
      board.focus();
      fireEvent.keyDown(board, { key: "ArrowRight" });
      expect(container.firstElementChild?.getAttribute("data-view")).toBe("list");
      expect(document.activeElement).toBe(list);
    });

    test("tool and source counts are named in words, not only by title", () => {
      render(<ui.AgentInbox tasks={[{ ...waiting, tools: 3, sources: 5 }]} />);
      const main = document.querySelector(".ui-ai__card-main")!;
      expect(main.textContent).toMatch(/5 sources read/);
      expect(main.textContent).toMatch(/3 tool calls/);
    });
  });
}

/* notification-stack: `notices` was copied into state once and later updates were ignored; card ids were built
 * from notice ids; the exit timer could set state after unmount (Phase 3) */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/notification-stack";
import * as clean from "@components/notification-stack-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const a = { id: "a b", title: "First", text: "One" };
const b = { id: "b", title: "Second", text: "Two" };
const c = { id: "c", title: "Third", text: "Three" };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const titles = (container: HTMLElement) => [...container.querySelectorAll("article:not([data-leaving]) h3")].map((h) => h.textContent);

for (const [style, ui] of styles) {
  describe(`notification-stack ${style}`, () => {
    test("notices added after mount show up; dismissed ones stay hidden while listed", () => {
      const { container, rerender } = render(<ui.NotificationStack notices={[a, b]} />);
      fireEvent.click(screen.getByRole("button", { name: "Dismiss First" }));
      act(() => vi.advanceTimersByTime(400));
      expect(titles(container)).toEqual(["Second"]);
      rerender(<ui.NotificationStack notices={[c, a, b]} />);
      expect(titles(container)).toEqual(["Third", "Second"]);
    });

    test("a parent that drops the notice in onDismiss still sees it slide out, and it can come back", () => {
      const { container, rerender } = render(<ui.NotificationStack notices={[a, b]} />);
      fireEvent.click(screen.getByRole("button", { name: "Dismiss First" }));
      rerender(<ui.NotificationStack notices={[b]} />);
      expect(container.querySelectorAll("article[data-leaving]")).toHaveLength(1);
      act(() => vi.advanceTimersByTime(400));
      expect(container.querySelectorAll("article")).toHaveLength(1);
      rerender(<ui.NotificationStack notices={[a, b]} />);
      expect(titles(container)).toEqual(["First", "Second"]);
    });

    test("cards are named without ids built from notice ids", () => {
      const { container } = render(<ui.NotificationStack notices={[a]} />);
      expect(container.querySelector("[id]")).toBeNull();
      expect(screen.getByRole("article", { name: "First" })).toBeTruthy();
    });

    test("unmounting during the exit leaves no timer behind", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const { unmount } = render(<ui.NotificationStack notices={[a, b]} />);
      fireEvent.click(screen.getByRole("button", { name: "Dismiss First" }));
      unmount();
      expect(vi.getTimerCount()).toBe(0);
      expect(error).not.toHaveBeenCalled();
      error.mockRestore();
    });
    /* WCAG + design pass */
    test("dismissing the focused front card moves focus to the next card's dismiss button (2.4.3)", async () => {
      render(<ui.NotificationStack notices={[a, b, c]} />);
      const x = screen.getByRole("button", { name: "Dismiss First" });
      x.focus();
      fireEvent.click(x);
      await act(async () => {});
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Dismiss Second" }));
    });

    test("the last dismissal leaves focus on the stack; dismissals are announced in one persistent status (2.4.3, 4.1.3)", async () => {
      const { container } = render(<ui.NotificationStack notices={[a]} />);
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      const x = screen.getByRole("button", { name: "Dismiss First" });
      x.focus();
      fireEvent.click(x);
      await act(async () => {});
      expect(document.activeElement).toBe(container.querySelector("section"));
      expect(status.textContent).toBe("Dismissed First. No more notices.");
    });

    test("the front card says where it is in the stack", () => {
      render(<ui.NotificationStack notices={[a, b, c]} />);
      expect(screen.getByRole("article", { name: "First, 1 of 3" })).toBeTruthy();
    });
  });
}

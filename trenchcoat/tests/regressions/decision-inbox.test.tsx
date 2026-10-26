/*
 * decision-inbox: decisions were seeded into state once and later ones ignored their `collapsed`; answers were
 * uncontrolled-only; the fold-away timer could fire after unmount. Now answers follow `answers`/`defaultAnswers`/
 * `onAnswersChange`, new decisions join as passed, and an onDecide promise holds the row (a rejection says so).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/decision-inbox";
import * as clean from "@components/decision-inbox-clean";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const d1 = { id: "d1", title: "Merge it?", primary: "Merge", secondary: "Hold" };
const d2 = { id: "d2", title: "Refund it?", primary: "Refund", secondary: "Ask" };
const d3 = { id: "d3", title: "Rotate it?", primary: "Rotate", secondary: "Later", collapsed: true };
const head = (c: HTMLElement) => c.querySelector(".ui-di__head")!.textContent;

for (const [style, ui] of [
  ["standard", standard],
  ["clean", clean],
] as const) {
  describe(`decision-inbox ${style}`, () => {
    test("decisions passed later join, folded when they say so", () => {
      const { container, rerender } = render(<ui.DecisionInbox decisions={[d1]} />);
      expect(head(container)).toBe("1 needs your input");
      rerender(<ui.DecisionInbox decisions={[d1, d3]} />);
      expect(head(container)).toBe("2 need your input");
      expect(screen.getByRole("button", { name: "Rotate it?" }).classList.contains("ui-di__title--folded")).toBe(true);
    });

    test("uncontrolled with onAnswersChange: answers, reports, folds away and opens the next folded one", async () => {
      const onAnswersChange = vi.fn();
      const { container } = render(<ui.DecisionInbox decisions={[d1, d3]} onAnswersChange={onAnswersChange} />);
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Merge" })));
      expect(onAnswersChange).toHaveBeenCalledWith({ d1: "primary" });
      expect(head(container)).toBe("1 needs your input");
      await act(async () => vi.advanceTimersByTime(1200));
      expect(container.querySelector(".ui-di__row[data-gone]")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Rotate it?" })).toBeNull();
    });

    test("controlled answers: a click is reported, not applied; passing an answer shows it", async () => {
      const onAnswersChange = vi.fn();
      const { container, rerender } = render(<ui.DecisionInbox decisions={[d1, d2]} answers={{}} onAnswersChange={onAnswersChange} />);
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Hold" })));
      expect(onAnswersChange).toHaveBeenCalledWith({ d1: "secondary" });
      expect(head(container)).toBe("2 need your input");
      rerender(<ui.DecisionInbox decisions={[d1, d2]} answers={{ d2: "primary" }} onAnswersChange={onAnswersChange} />);
      expect(head(container)).toBe("1 needs your input");
      expect(container.querySelector(".ui-di__done")!.textContent).toBe("Refund");
    });

    test("a rejected onDecide says so and leaves the buttons to try again", async () => {
      const onDecide = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
      const { container } = render(<ui.DecisionInbox decisions={[d1]} onDecide={onDecide} />);
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Merge" })));
      expect(screen.getByRole("alert").textContent).toMatch(/try again/);
      expect(head(container)).toBe("1 needs your input");
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Merge" })));
      expect(screen.queryByRole("alert")).toBeNull();
      expect(head(container)).toBe("All caught up");
    });

    test("unmounting during the confirmation sets nothing later", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const { unmount } = render(<ui.DecisionInbox decisions={[d1]} />);
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Merge" })));
      unmount();
      await act(async () => vi.advanceTimersByTime(2000));
      expect(error).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    });

    test("WCAG 2.4.3: answering moves focus to the answer, folding away to the next decision", async () => {
      const { container } = render(<ui.DecisionInbox decisions={[d1, d2]} />);
      const merge = screen.getByRole("button", { name: "Merge" });
      merge.focus();
      await act(async () => fireEvent.click(merge));
      expect(document.activeElement).toBe(container.querySelector(".ui-di__done"));
      await act(async () => vi.advanceTimersByTime(1200));
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Refund" }));
    });

    test("WCAG 2.4.3 / 4.1.2: a folded title says it's collapsed and opening it focuses its first answer", async () => {
      const { container } = render(<ui.DecisionInbox decisions={[d1, d3]} />);
      const title = screen.getByRole("button", { name: "Rotate it?" });
      expect(title.getAttribute("aria-expanded")).toBe("false");
      const body = document.getElementById(title.getAttribute("aria-controls")!)!;
      expect(body.hasAttribute("inert")).toBe(true);
      title.focus();
      await act(async () => fireEvent.click(title));
      expect(body.hasAttribute("inert")).toBe(false);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Rotate" }));
      expect(container.querySelectorAll(".ui-di__body[inert]")).toHaveLength(0);
    });

    test("WCAG 2.4.3: the last answer folding away leaves focus in the component, not on <body>", async () => {
      const { container } = render(<ui.DecisionInbox decisions={[d1]} />);
      const merge = screen.getByRole("button", { name: "Merge" });
      merge.focus();
      await act(async () => fireEvent.click(merge));
      await act(async () => vi.advanceTimersByTime(1200));
      expect(document.activeElement).not.toBe(document.body);
      expect(container.contains(document.activeElement)).toBe(true);
    });

    test("WCAG 4.1.3: the count is a live region from mount", () => {
      const { container } = render(<ui.DecisionInbox decisions={[]} />);
      expect(container.querySelector(".ui-di__head")!.getAttribute("aria-live")).toBe("polite");
    });

    test("theme and primary: no .dark-scoped colours, answers use the action tokens", () => {
      render(<ui.DecisionInbox decisions={[d1]} />);
      const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("");
      expect(css).not.toMatch(/\.dark[^{}]*\.ui-di__/);
      expect(css).not.toMatch(/linear-gradient/);
      expect(css).toMatch(/\.ui-di__btn--primary \{[^}]*--tc-action-primary-bg/);
    });
  });
}

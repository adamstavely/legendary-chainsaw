/*
 * review-center (Phase 3): decided/skipped marks hid an item forever, even after the parent re-queued it; a
 * promise from onDecide was ignored (no pending, failures lost); the clock was read while rendering.
 */
import { renderToString } from "react-dom/server";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/review-center";
import * as clean from "@components/review-center-clean";
import type { ReviewItem } from "@components/review-center";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

afterEach(() => vi.restoreAllMocks());

const item = (id: string, title: string): ReviewItem => ({ id, title, agent: "Support agent", type: "Refund", risk: "medium", confidence: 0.9, createdAt: 0 });
const A = item("a", "Refund order 1");
const B = item("b", "Refund order 2");
// Rows still in the queue – a leaving row lingers a moment as a ghost
const rows = () => [...document.querySelectorAll<HTMLButtonElement>(".ui-rvc__item:not([data-leaving]) .ui-rvc__row")];
const row = (title: string) => rows().find((b) => b.querySelector(".ui-rvc__row-title")!.textContent === title) ?? null;
const approve = () => fireEvent.click(screen.getByRole("button", { name: /^Approve/ }));

for (const [style, ui] of styles) {
  const { ReviewCenter } = ui;
  describe(`review-center (${style})`, () => {
    test("an id that leaves items and comes back is pending again", async () => {
      const { rerender } = render(<ReviewCenter items={[A, B]} now={0} />);
      approve();
      expect(row("Refund order 1")).toBeNull();
      // The parent drops it, then re-queues it (e.g. the agent revised the proposal)
      await act(async () => rerender(<ReviewCenter items={[B]} now={0} />));
      await act(async () => rerender(<ReviewCenter items={[A, B]} now={0} />));
      expect(row("Refund order 1")!).toBeTruthy();
    });

    test("a decided id that stays in items stays hidden", async () => {
      const { rerender } = render(<ReviewCenter items={[A, B]} now={0} />);
      approve();
      await act(async () => rerender(<ReviewCenter items={[{ ...A }, B]} now={0} />));
      expect(row("Refund order 1")).toBeNull();
    });

    test("onDecide's promise: pending while it runs, rejected → the item comes back with the error, Try again", async () => {
      let fail!: (e: Error) => void;
      const onDecide = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
      const { container } = render(<ReviewCenter items={[A, B]} now={0} onDecide={onDecide} />);
      approve();
      expect(container.querySelector(".ui-rvc__undo")?.getAttribute("aria-busy")).toBe("true");
      expect(row("Refund order 1")).toBeNull();
      await act(async () => fail(new Error("Network down")));
      // The chip shows it; the review center's one status region says it (the chip is no second alert)
      const alert = container.querySelector<HTMLElement>(".ui-rvc__undo[data-error]")!;
      expect(screen.queryByRole("alert")).toBeNull();
      expect(container.querySelector("[aria-live]")!.textContent).toContain("Couldn't approve");
      expect(alert.textContent).toContain("Couldn't approve");
      expect(alert.textContent).toContain("Network down");
      expect(row("Refund order 1")!.getAttribute("aria-current")).toBe("true");
      onDecide.mockImplementation(() => Promise.resolve());
      await act(async () => fireEvent.click(within(alert).getByRole("button", { name: /Try again/ })));
      expect(onDecide).toHaveBeenCalledTimes(2);
      expect(row("Refund order 1")).toBeNull();
      expect(container.querySelector(".ui-rvc__undo[data-error]")).toBeNull();
      expect(container.querySelector(".ui-rvc__undo")?.getAttribute("aria-busy")).toBeNull();
    });

    test("a failure after Undo leaves the item alone", async () => {
      let fail!: (e: Error) => void;
      const onDecide = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
      const { container } = render(<ReviewCenter items={[A, B]} now={0} onDecide={onDecide} />);
      approve();
      fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
      await act(async () => fail(new Error("late")));
      expect(container.querySelector(".ui-rvc__undo[data-error]")).toBeNull();
      expect(rows()).toHaveLength(2);
    });

    test("no state is set after unmount when the promise settles", async () => {
      let fail!: (e: Error) => void;
      const error = vi.spyOn(console, "error");
      const { unmount } = render(<ReviewCenter items={[A, B]} now={0} onDecide={() => new Promise<void>((_, r) => (fail = r))} />);
      approve();
      unmount();
      await act(async () => fail(new Error("x")));
      expect(error).not.toHaveBeenCalled();
    });

    test("a server render doesn't read the clock", () => {
      const spy = vi.spyOn(Date, "now");
      renderToString(<ReviewCenter items={[A, B]} />);
      expect(spy).not.toHaveBeenCalled();
    });

    test("controlled filter: clicks are reported, not applied", () => {
      const onFilterChange = vi.fn();
      render(<ReviewCenter items={[A, B]} now={0} filter="all" onFilterChange={onFilterChange} />);
      fireEvent.click(screen.getByRole("button", { name: /High risk/ }));
      expect(onFilterChange).toHaveBeenCalledWith("high");
      expect(screen.getByRole("button", { name: /^All/ }).getAttribute("aria-pressed")).toBe("true");
    });
  });
}

/*
 * WCAG pass: rows named from their content (label-in-name 2.5.3), the flagged span's note hoverable and closable with
 * Esc (1.4.13), no aria-label on <mark>, a visible "Cancel" with its key (2.5.3), focus kept on mode swaps (2.4.3),
 * the Undo chip waits while hovered or focused and can be kept (2.2.1), SLA state in words and a mark (1.4.1),
 * single-key shortcuts can be turned off (2.1.4), the sheen is composited, finite and paused off-screen (2.2.2).
 */
const F: ReviewItem = {
  ...item("f", "Reply to Maya"),
  risk: "high",
  confidence: 0.55,
  body: ["Hi Maya, we ", { text: "refunded $40", note: "Amount not confirmed", source: "Stripe" }, " today."],
};
const css = () => [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");

for (const [style, ui] of styles) {
  const { ReviewCenter } = ui;
  describe(`review-center (${style}) – a11y`, () => {
    test("queue rows are named by their visible text plus risk and confidence; long titles carry a title", () => {
      render(<ReviewCenter items={[F, B]} now={0} />);
      const r = rows()[0];
      expect(r.hasAttribute("aria-label")).toBe(false);
      expect(r.textContent).toContain("Reply to Maya");
      expect(r.textContent).toContain("high risk, 55% confidence");
      expect(r.querySelector(".ui-rvc__row-title")!.getAttribute("title")).toBe("Reply to Maya");
    });

    test("the status region is there from the start", () => {
      const { container } = render(<ReviewCenter items={[A, B]} now={0} />);
      const live = container.querySelector('[aria-live="polite"]')!;
      expect(live.textContent).toBe("");
      approve();
      expect(live.textContent).toContain("Approved: Refund order 1");
    });

    test("SLA state is in words and marked, not only coloured", () => {
      const old = { ...A, createdAt: 0 };
      const { container } = render(<ReviewCenter items={[old, B]} now={60 * 60_000} sla={30 * 60_000} />);
      const wait = container.querySelector('.ui-rvc__wait[data-sla="over"]')!;
      expect(wait.querySelector("svg")).toBeTruthy();
      expect(wait.textContent).toContain("past the limit");
      expect(container.querySelector('.ui-rvc__oldest-time[data-sla="over"]')!.textContent).toContain("past the limit");
    });

    test("a flagged span: no aria-label, described by a hint; its note opens on focus and on hover, stays when the pointer moves onto it, Esc closes it", async () => {
      vi.useFakeTimers();
      const { container } = render(<ReviewCenter items={[F]} now={0} />);
      const mark = container.querySelector<HTMLElement>(".ui-rvc__flag")!;
      expect(mark.hasAttribute("aria-label")).toBe(false);
      const hint = document.getElementById(mark.getAttribute("aria-describedby")!.split(" ")[0])!;
      expect(hint.textContent).toContain("unsure");
      // hover → note; leave the span, enter the note → it stays
      fireEvent.mouseEnter(mark);
      expect(screen.getByRole("tooltip").textContent).toContain("Amount not confirmed");
      fireEvent.mouseLeave(mark);
      fireEvent.mouseEnter(screen.getByRole("tooltip"));
      await act(async () => vi.advanceTimersByTime(500));
      expect(screen.queryByRole("tooltip")).toBeTruthy();
      // Esc closes it, with the focus elsewhere on the page
      await act(async () => fireEvent.keyDown(document, { key: "Escape" }));
      expect(screen.queryByRole("tooltip")).toBeNull();
      // focus opens it too, and it describes the span
      await act(async () => mark.focus());
      expect(mark.getAttribute("aria-describedby")).toContain(screen.getByRole("tooltip").id);
      vi.useRealTimers();
    });

    test("Reject → focus on the first reason; Cancel (visible word, Esc key) → back on Reject", async () => {
      render(<ReviewCenter items={[A, B]} now={0} />);
      const reject = screen.getByRole("button", { name: /^Reject/ });
      reject.focus();
      await act(async () => fireEvent.click(reject));
      expect(document.activeElement?.textContent).toContain("Wrong info");
      const cancel = screen.getByRole("button", { name: /^Cancel/ });
      expect(cancel.textContent).toBe("CancelEsc");
      expect(cancel.getAttribute("aria-keyshortcuts")).toBe("Escape");
      cancel.focus();
      await act(async () => fireEvent.click(cancel));
      expect(document.activeElement).toBe(screen.getByRole("button", { name: /^Reject/ }));
    });

    test("Edit → Esc in the editor → focus back on Edit, not <body>", async () => {
      const E = { ...F, id: "e" };
      render(<ReviewCenter items={[E, B]} now={0} />);
      const edit = screen.getByRole("button", { name: /^Edit/ });
      edit.focus();
      await act(async () => fireEvent.click(edit));
      const field = screen.getByRole("textbox");
      field.focus();
      await act(async () => fireEvent.keyDown(field, { key: "Escape" }));
      expect(document.activeElement).toBe(screen.getByRole("button", { name: /^Edit/ }));
    });

    test("the Undo chip waits while hovered or focused, goes after its time otherwise, and can be kept", async () => {
      vi.useFakeTimers();
      const { container, unmount } = render(<ReviewCenter items={[A, B]} now={0} />);
      approve();
      const chip = () => container.querySelector<HTMLElement>(".ui-rvc__undo");
      fireEvent.mouseEnter(chip()!);
      await act(async () => vi.advanceTimersByTime(20_000));
      expect(chip()).toBeTruthy();
      fireEvent.mouseLeave(chip()!);
      // focus holds it as well
      await act(async () => screen.getByRole("button", { name: /^Undo/ }).focus());
      await act(async () => vi.advanceTimersByTime(20_000));
      expect(chip()).toBeTruthy();
      await act(async () => screen.getByRole("button", { name: /^Undo/ }).blur());
      await act(async () => vi.advanceTimersByTime(5_000));
      expect(chip()!.hasAttribute("data-leaving")).toBe(false);
      await act(async () => vi.advanceTimersByTime(1_000));
      expect(chip()).toBeNull();
      unmount();
      const kept = render(<ReviewCenter items={[A, B]} now={0} undoTimeout={false} />);
      approve();
      await act(async () => vi.advanceTimersByTime(60_000));
      expect(kept.container.querySelector(".ui-rvc__undo")).toBeTruthy();
      vi.useRealTimers();
    });

    test("shortcuts={false}: single keys do nothing, Esc still backs out", async () => {
      const onDecide = vi.fn();
      const { container } = render(<ReviewCenter items={[A, B]} now={0} shortcuts={false} onDecide={onDecide} />);
      const root = container.querySelector<HTMLElement>(".ui-rvc")!;
      fireEvent.keyDown(root, { key: "a" });
      expect(onDecide).not.toHaveBeenCalled();
      await act(async () => fireEvent.click(screen.getByRole("button", { name: /^Reject/ })));
      fireEvent.keyDown(root, { key: "1" });
      expect(onDecide).not.toHaveBeenCalled();
      await act(async () => fireEvent.keyDown(root, { key: "Escape" }));
      expect(screen.queryByRole("group", { name: "Why reject it?" })).toBeNull();
    });

    test("styles: composited, finite sheen that pauses off-screen; no dark-only colour rules; field focus on the editor frame", () => {
      render(<ReviewCenter items={[A, B]} now={0} />);
      const text = css();
      expect(text).not.toMatch(/background-position/);
      expect(text).toMatch(/@keyframes ui-rvc-sweep \{ to \{ transform: translateX\(100%\); \} \}/);
      expect(text).toMatch(/ui-rvc-sweep [^;]* linear 3;/);
      expect(text).toMatch(/\.ui-rvc\[data-offscreen\] \*[^{]*\{ animation-play-state: paused; \}/);
      expect(text).not.toMatch(/:where\(\.dark, \[data-theme="dark"\]\) :where\(\[data-look/);
      expect(text).toMatch(/\.ui-rvc__editor:focus-within \{ box-shadow: var\(--tc-field-shadow-focus/);
      expect(text).toMatch(/\.ui-rvc__btn\[data-primary\] \{ background: var\(--tc-action-primary-bg/);
    });
  });
}

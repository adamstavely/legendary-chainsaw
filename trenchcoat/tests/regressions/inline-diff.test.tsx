/*
 * Phase 3 inline-diff: the verdicts follow the controllable contract (decisions / defaultDecisions /
 * onDecisionsChange), new text resets them (and says so), and DOM props reach the root.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/inline-diff";
import * as clean from "@components/inline-diff-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const states = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>(".ui-df__chg")].map((el) => el.dataset.state);

for (const [style, ui] of styles) {
  const { InlineDiff } = ui;

  describe(`inline-diff (${style})`, () => {
    test("controlled decisions: Accept all is reported, not applied, until the parent passes it back", () => {
      const onDecisionsChange = vi.fn();
      const onChange = vi.fn();
      const { container, rerender } = render(
        <InlineDiff original="a b c" suggested="a x c" decisions={{}} onDecisionsChange={onDecisionsChange} onChange={onChange} />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Accept all" }));
      expect(onDecisionsChange).toHaveBeenLastCalledWith({ 0: "accepted" });
      expect(onChange).toHaveBeenLastCalledWith("a x c");
      expect(states(container)).toEqual(["pending"]);
      rerender(<InlineDiff original="a b c" suggested="a x c" decisions={{ 0: "accepted" }} onDecisionsChange={onDecisionsChange} />);
      expect(states(container)).toEqual(["accepted"]);
    });

    test("uncontrolled: starts at defaultDecisions, still reports, and new text starts over", () => {
      const onDecisionsChange = vi.fn();
      const { container, rerender } = render(
        <InlineDiff original="a b c" suggested="a x c" defaultDecisions={{ 0: "rejected" }} onDecisionsChange={onDecisionsChange} />,
      );
      expect(states(container)).toEqual(["rejected"]);
      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
      // Undo has nothing to undo (the default isn't a decision made here)
      expect(states(container)).toEqual(["rejected"]);
      rerender(<InlineDiff original="a b d" suggested="a y d" onDecisionsChange={onDecisionsChange} />);
      expect(states(container)).toEqual(["pending"]);
      expect(onDecisionsChange).toHaveBeenLastCalledWith({});
    });

    test("the imperative handle still drives an uncontrolled diff", async () => {
      const ref = { current: null as standard.InlineDiffHandle | null };
      const { container } = render(<InlineDiff ref={ref} original="one two three" suggested="one 2 three" />);
      await act(async () => ref.current!.accept(0));
      expect(states(container)).toEqual(["accepted"]);
      await act(async () => ref.current!.undo());
      expect(states(container)).toEqual(["pending"]);
    });

    /* Phase 4: the LCS table is capped while text streams in; the full diff runs once it is quiet */

    test("diffWords caps the table: past maxCells the middle is one replacement", () => {
      const o = "keep a b c d e keep";
      const s = "keep a x c y e keep";
      expect(ui.diffWords(o, s).filter((seg) => seg.type === "change")).toHaveLength(2);
      // The common start and end stay outside the table; the rest becomes a single change
      expect(ui.diffWords(o, s, 4)).toEqual([
        { type: "equal", text: "keep a " },
        { type: "change", remove: "b c d", insert: "x c y" },
        { type: "equal", text: " e keep" },
      ]);
    });

    describe("streaming", () => {
      afterEach(() => vi.useRealTimers());
      const words = Array.from({ length: 600 }, (_, i) => `w${i}`);
      const original = words.join(" ");
      const edited = (upTo: number) => words.slice(0, upTo).map((w, i) => (i % 10 === 5 ? `x${i}` : w)).join(" ");
      const changeCount = (container: HTMLElement) => container.querySelectorAll(".ui-df__chg").length;

      test("a long suggestion streaming in is diffed coarsely, then once in full – the same as the final text diffed directly", async () => {
        vi.useFakeTimers();
        const { container, rerender } = render(<InlineDiff original={original} suggested={edited(500)} />);
        // Text that changes again within a moment counts as streaming: the big middle becomes one replacement
        await act(async () => vi.advanceTimersByTime(50));
        rerender(<InlineDiff original={original} suggested={edited(550)} />);
        await act(async () => vi.advanceTimersByTime(50));
        rerender(<InlineDiff original={original} suggested={edited(600)} />);
        await act(async () => vi.advanceTimersByTime(10));
        expect(changeCount(container)).toBe(1);
        // Quiet: the full diff, change for change what diffWords gives for the final text
        await act(async () => vi.advanceTimersByTime(400));
        const full = ui.diffWords(original, edited(600)).filter((seg) => seg.type === "change").length;
        expect(full).toBe(60);
        expect(changeCount(container)).toBe(full);
      });

      test("text that changes once is diffed in full right away", () => {
        const { container, rerender } = render(<InlineDiff original={original} suggested={edited(300)} />);
        rerender(<InlineDiff original={original} suggested={edited(600)} />);
        expect(changeCount(container)).toBe(60);
      });
    });

    test("DOM props reach the root and its own keyboard handling still runs", () => {
      const onKeyDown = vi.fn();
      const { container } = render(<InlineDiff original="a" suggested="b" id="diff" onKeyDown={onKeyDown} />);
      const root = container.querySelector<HTMLElement>(".ui-df")!;
      expect(root.id).toBe("diff");
      fireEvent.keyDown(root, { key: "Escape" });
      expect(onKeyDown).toHaveBeenCalled();
    });
  });
}

/* WCAG + design pass: Esc keeps focus, Space accepts, names match content, undo mid-review, arrows at narrow widths */

for (const [style, ui] of styles) {
  const { InlineDiff } = ui;
  describe(`inline-diff (${style}) – a11y pass`, () => {
    const setup = () => render(<InlineDiff original="one two three four" suggested="one 2 three 4" />);
    const changes = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('.ui-df__chg[data-state="pending"]')];

    test("Esc on a change hides the popover and keeps focus on the change (2.4.3, 1.4.13)", () => {
      const { container } = setup();
      const first = changes(container)[0];
      act(() => first.focus());
      expect(container.querySelector(".ui-df__pop")!.hasAttribute("data-open")).toBe(true);
      fireEvent.keyDown(first, { key: "Escape" });
      expect(document.activeElement).toBe(first);
      expect(container.querySelector(".ui-df__pop")!.hasAttribute("data-open")).toBe(false);
    });

    test("Esc closes a hover-opened popover from anywhere without moving focus", () => {
      const { container } = setup();
      fireEvent.mouseEnter(changes(container)[1]);
      expect(container.querySelector(".ui-df__pop")!.hasAttribute("data-open")).toBe(true);
      fireEvent.keyDown(document.body, { key: "Escape" });
      expect(container.querySelector(".ui-df__pop")!.hasAttribute("data-open")).toBe(false);
      expect(document.activeElement).toBe(document.body);
    });

    test("Space accepts like Enter, and focus moves to the next change", () => {
      const { container } = setup();
      const [first, second] = changes(container);
      act(() => first.focus());
      fireEvent.keyDown(first, { key: " " });
      expect(first.dataset.state).toBe("accepted");
      expect(document.activeElement).toBe(second);
    });

    test("changes are named by their words and described separately (2.5.3); popover buttons by their labels", () => {
      const { container } = setup();
      const first = changes(container)[0];
      expect(first.hasAttribute("aria-label")).toBe(false);
      const desc = document.getElementById(first.getAttribute("aria-describedby")!);
      expect(desc?.textContent).toMatch(/Suggestion 1 of 2: replace “two” with “2”/);
      expect(container.querySelectorAll(".ui-df__pbtn[aria-label]")).toHaveLength(0);
    });

    test("Undo works mid-review and returns focus to the change", () => {
      const { container } = setup();
      const undoStep = () => container.querySelector<HTMLButtonElement>('button[aria-label="Undo last decision"]')!;
      expect(undoStep().hidden).toBe(true);
      const first = changes(container)[0];
      act(() => first.focus());
      fireEvent.keyDown(first, { key: "n" });
      expect(undoStep().hidden).toBe(false);
      act(() => undoStep().focus());
      fireEvent.click(undoStep());
      const back = container.querySelectorAll<HTMLElement>(".ui-df__chg")[0];
      expect(back.dataset.state).toBe("pending");
      expect(document.activeElement).toBe(back);
    });

    test("inserted words get an underline, the arrows never disappear at narrow widths, focus uses tokens", () => {
      setup();
      const css = document.querySelector('style[data-href="ui-inline-diff"]')!.textContent!;
      expect(css).toMatch(/\.ui-df__ins \{\s*text-decoration: underline;/);
      expect(css).not.toMatch(/ui-df__nav \{ display: none/);
      expect(css).not.toMatch(/[^-]outline: 2px solid var/);
      expect(css).not.toContain("@media (max-width: 400px)");
    });
  });
}

/* fill: an opt-in way to grow to the container's height (screens used to override .ui-df's internals for it) */
for (const [style, ui] of styles) {
  describe(`inline-diff (${style}) – fill`, () => {
    const css = () => document.querySelector('style[data-href="ui-inline-diff"], style[href="ui-inline-diff"]')?.textContent ?? "";

    test("off by default: the diff is as tall as its text", () => {
      const { container } = render(<ui.InlineDiff original="a b" suggested="a c" label="Label" className="mine" />);
      const root = container.querySelector(".ui-df")!;
      expect(root.hasAttribute("data-fill")).toBe(false);
      expect(root.classList.contains("mine")).toBe(true);
    });

    test("fill marks the root, and the styles stretch it and let the card take the rest", () => {
      const { container } = render(<ui.InlineDiff original="a b" suggested="a c" label="Label" fill className="mine" />);
      const root = container.querySelector(".ui-df")!;
      expect(root.hasAttribute("data-fill")).toBe(true);
      expect(root.getAttribute("data-look")).toBe(style);
      expect(root.classList.contains("mine")).toBe(true);
      const sheet = css().replace(/\s+/g, " ");
      expect(sheet).toMatch(/\.ui-df\[data-fill\] \{[^}]*align-self: stretch/);
      expect(sheet).toMatch(/\.ui-df\[data-fill\] > \.ui-df__card \{[^}]*flex: 1 0 auto/);
    });
  });
}

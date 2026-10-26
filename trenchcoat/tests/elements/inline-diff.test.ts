/*
 * <tc-inline-diff> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/inline-diff";
import { TcInlineDiff, diffWords } from "../../src/elements/inline-diff";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);
const states = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-df__chg")].map((c) => c.dataset.state);
const button = (el: Element, name: string) => [...el.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === name)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const popOpen = (el: Element) => el.querySelector(".ui-df__pop")!.hasAttribute("data-open");

describe("tc-inline-diff", () => {
  test("the host is the root, with the look, fill and done", async () => {
    const el = await fixture<TcInlineDiff>(html`<tc-inline-diff original="a b" suggested="a c" label="Label"></tc-inline-diff>`);
    expect(el.dataset.ui).toBe("df");
    expect(el.dataset.look).toBe("standard");
    expect(el.hasAttribute("data-fill")).toBe(false);
    expect(el.querySelector(":scope > .ui-df__label")!.textContent).toBe("Label");
    el.fill = true;
    el.look = "clean";
    await settle();
    expect(el.hasAttribute("data-fill")).toBe(true);
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-df__card .ui-df__body > .ui-df__label")).toBeTruthy();
    el.acceptAll();
    await settle();
    expect(el.hasAttribute("data-done")).toBe(true);
  });

  test("fill: the styles stretch the host and let the card take the rest", () => {
    const sheet = TcInlineDiff.css.replace(/\s+/g, " ");
    expect(sheet).toMatch(/\[data-ui="df"\]\[data-fill\] \{[^}]*align-self: stretch/);
    expect(sheet).toMatch(/\[data-ui="df"\]\[data-fill\] > \.ui-df__card \{[^}]*flex: 1 0 auto/);
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      const make = (original: string, suggested: string, decisions?: object) =>
        fixture<TcInlineDiff>(html`<tc-inline-diff look=${look} original=${original} suggested=${suggested} .decisions=${decisions ?? {}}></tc-inline-diff>`);

      test("controlled decisions: Accept all is reported, not applied, until the page passes it back", async () => {
        const el = await make("a b c", "a x c");
        const seen: unknown[] = [];
        const texts: unknown[] = [];
        on(el, "tc-decisions-change", (e) => {
          e.preventDefault();
          seen.push(e.detail.decisions);
        });
        on(el, "tc-text-change", (e) => texts.push(e.detail.text));
        button(el, "Accept all").click();
        await settle();
        expect(seen.at(-1)).toEqual({ 0: "accepted" });
        expect(texts.at(-1)).toBe("a x c");
        expect(states(el)).toEqual(["pending"]);
        el.decisions = { 0: "accepted" };
        await settle();
        expect(states(el)).toEqual(["accepted"]);
      });

      test("uncontrolled: starts at the given decisions, and new text starts over (reported)", async () => {
        const el = await make("a b c", "a x c", { 0: "rejected" });
        const seen: unknown[] = [];
        on(el, "tc-decisions-change", (e) => seen.push(e.detail.decisions));
        expect(states(el)).toEqual(["rejected"]);
        button(el, "Undo").click();
        await settle();
        // Undo has nothing to undo (the starting value isn't a decision made here)
        expect(states(el)).toEqual(["rejected"]);
        el.original = "a b d";
        el.suggested = "a y d";
        await settle();
        expect(states(el)).toEqual(["pending"]);
        expect(seen.at(-1)).toEqual({});
      });

      test("the element is its own imperative handle", async () => {
        const el = await make("one two three", "one 2 three");
        const done: unknown[] = [];
        on(el, "tc-done", (e) => done.push(e.detail.text));
        el.accept(0);
        await settle();
        expect(states(el)).toEqual(["accepted"]);
        expect(done).toEqual(["one 2 three"]);
        el.undo();
        await settle();
        expect(states(el)).toEqual(["pending"]);
        el.rejectAll();
        await settle();
        expect(states(el)).toEqual(["rejected"]);
        el.reset();
        await settle();
        expect(states(el)).toEqual(["pending"]);
        el.highlight(0);
        await settle();
        expect(popOpen(el)).toBe(true);
      });

      test("a long suggestion streaming in is diffed coarsely, then once in full", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const words = Array.from({ length: 600 }, (_, i) => `w${i}`);
        const original = words.join(" ");
        const edited = (upTo: number) => words.slice(0, upTo).map((w, i) => (i % 10 === 5 ? `x${i}` : w)).join(" ");
        const count = () => el.querySelectorAll(".ui-df__chg").length;
        const el = await make(original, edited(500));
        vi.advanceTimersByTime(50);
        el.suggested = edited(550);
        await el.updateComplete;
        vi.advanceTimersByTime(50);
        el.suggested = edited(600);
        await el.updateComplete;
        vi.advanceTimersByTime(10);
        await el.updateComplete;
        expect(count()).toBe(1);
        vi.advanceTimersByTime(400);
        await el.updateComplete;
        const full = diffWords(original, edited(600)).filter((s) => s.type === "change").length;
        expect(full).toBe(60);
        expect(count()).toBe(full);
      });

      test("text that changes once is diffed in full right away", async () => {
        const words = Array.from({ length: 600 }, (_, i) => `w${i}`);
        const edited = (upTo: number) => words.slice(0, upTo).map((w, i) => (i % 10 === 5 ? `x${i}` : w)).join(" ");
        const el = await make(words.join(" "), edited(300));
        el.suggested = edited(600);
        await settle();
        expect(el.querySelectorAll(".ui-df__chg")).toHaveLength(60);
      });

      /* WCAG + design pass: Esc keeps focus, Space accepts, names match content, undo mid-review */
      const setup = () => make("one two three four", "one 2 three 4");
      const pendingChanges = (el: Element) => [...el.querySelectorAll<HTMLElement>('.ui-df__chg[data-state="pending"]')];

      test("Esc on a change hides the popover and keeps focus on the change (2.4.3, 1.4.13)", async () => {
        const el = await setup();
        const first = pendingChanges(el)[0];
        first.focus();
        await settle();
        expect(popOpen(el)).toBe(true);
        key(first, "Escape");
        await settle();
        expect(document.activeElement).toBe(first);
        expect(popOpen(el)).toBe(false);
      });

      test("Esc closes a hover-opened popover from anywhere without moving focus", async () => {
        const el = await setup();
        pendingChanges(el)[1].dispatchEvent(new MouseEvent("mouseenter"));
        await settle();
        expect(popOpen(el)).toBe(true);
        key(document.body, "Escape");
        await settle();
        expect(popOpen(el)).toBe(false);
        expect(document.activeElement).toBe(document.body);
      });

      test("Space accepts like Enter, and focus moves to the next change", async () => {
        const el = await setup();
        const [first, second] = pendingChanges(el);
        first.focus();
        key(first, " ");
        await settle();
        expect(first.dataset.state).toBe("accepted");
        expect(document.activeElement).toBe(second);
      });

      test("deciding the last change moves focus to Undo, which restores it", async () => {
        const el = await make("a b c", "a x c");
        const only = pendingChanges(el)[0];
        only.focus();
        key(only, "n");
        await settle();
        const undo = button(el, "Undo");
        expect(document.activeElement).toBe(undo);
        expect(el.textContent).toMatch(/All changes reviewed/);
        undo.click();
        await settle();
        expect(states(el)).toEqual(["pending"]);
        expect(document.activeElement).toBe(el.querySelector(".ui-df__chg"));
      });

      test("changes are named by their words and described separately (2.5.3); popover buttons by their labels", async () => {
        const el = await setup();
        const first = pendingChanges(el)[0];
        expect(first.hasAttribute("aria-label")).toBe(false);
        expect(document.getElementById(first.getAttribute("aria-describedby")!)?.textContent).toMatch(/Suggestion 1 of 2: replace “two” with “2”/);
        expect(el.querySelectorAll(".ui-df__pbtn[aria-label]")).toHaveLength(0);
      });

      test("Undo works mid-review and returns focus to the change", async () => {
        const el = await setup();
        const undoStep = () => button(el, "Undo last decision");
        expect(undoStep().hidden).toBe(true);
        const first = pendingChanges(el)[0];
        first.focus();
        key(first, "n");
        await settle();
        expect(undoStep().hidden).toBe(false);
        undoStep().focus();
        undoStep().click();
        await settle();
        const back = el.querySelectorAll<HTMLElement>(".ui-df__chg")[0];
        expect(back.dataset.state).toBe("pending");
        expect(document.activeElement).toBe(back);
      });

      test("the arrows highlight the next and previous pending change without taking focus", async () => {
        const el = await setup();
        button(el, "Next suggestion").click();
        await settle();
        expect(popOpen(el)).toBe(true);
        expect(el.querySelectorAll(".ui-df__chg")[0].hasAttribute("data-active")).toBe(true);
        button(el, "Next suggestion").click();
        await settle();
        expect(el.querySelectorAll(".ui-df__chg")[1].hasAttribute("data-active")).toBe(true);
        button(el, "Previous suggestion").click();
        await settle();
        expect(el.querySelectorAll(".ui-df__chg")[0].hasAttribute("data-active")).toBe(true);
        // A click outside lets the highlight go
        document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
        await settle();
        expect(popOpen(el)).toBe(false);
      });

      test("the popover sits above its change, inside the card", async () => {
        const el = await setup();
        el.highlight(1);
        await settle();
        const pop = el.querySelector<HTMLElement>(".ui-df__pop")!;
        expect(pop.style.left).toMatch(/px$/);
        expect(pop.style.top).toMatch(/px$/);
      });
    });
  }

  test("inserted words get an underline, the arrows never disappear at narrow widths, focus uses tokens", () => {
    const css = TcInlineDiff.css;
    expect(css).toMatch(/\.ui-df__ins \{\s*text-decoration: underline;/);
    expect(css).not.toMatch(/ui-df__nav \{ display: none/);
    expect(css).not.toMatch(/[^-]outline: 2px solid var/);
    expect(css).not.toContain("@media (max-width: 400px)");
  });

  test("diffWords caps the work: past maxCells the middle is one replacement", () => {
    const o = "keep a b c d e keep";
    const s = "keep a x c y e keep";
    expect(diffWords(o, s).filter((seg) => seg.type === "change")).toHaveLength(2);
    expect(diffWords(o, s, 4)).toEqual([
      { type: "equal", text: "keep a " },
      { type: "change", remove: "b c d", insert: "x c y" },
      { type: "equal", text: " e keep" },
    ]);
  });

  test("precomputed changes are shown as given", async () => {
    const el = await fixture<TcInlineDiff>(html`<tc-inline-diff .changes=${[{ type: "equal", text: "Hi " }, { type: "change", remove: "you", insert: "there" }]}></tc-inline-diff>`);
    expect(el.querySelector(".ui-df__text")!.textContent).toBe("Hi youthere");
    expect(states(el)).toEqual(["pending"]);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-inline-diff label="Suggested by AI" original="one two three four" suggested="one 2 three 4"></tc-inline-diff>
      <tc-inline-diff look="clean" label="Clean" original="one two three four" suggested="one 2 three 4"></tc-inline-diff>
    </div>`);
    for (const a of document.getAnimations()) {
      try {
        a.finish();
      } catch {
        a.cancel();
      }
    }
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

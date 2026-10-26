/*
 * <tc-thinking-state> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/thinking-state";
import type { TcThinkingState, ThinkingStep } from "../../src/elements/thinking-state";
import { cleanup, fixture, settle } from "./helpers";

const fake = () => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
beforeEach(fake);
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

/** Moves the fake clock in steps, letting the element update after each */
const advance = async (el: TcThinkingState, ms: number, step = 100) => {
  for (let t = 0; t < ms; t += step) {
    vi.advanceTimersByTime(step);
    await el.updateComplete;
  }
};

const A: ThinkingStep = { kind: "step", label: "Reading the brief" };
const B: ThinkingStep = { kind: "step", label: "Drafting the plan" };
const C: ThinkingStep = { kind: "step", label: "Checking the numbers" };
const SEARCH: ThinkingStep = { kind: "search", label: "Searched the web", sources: [{ label: "Docs", href: "https://example.com/docs" }] };
const labels = (el: Element) => [...el.querySelectorAll(".ui-think__item:not([data-kind='done']) .ui-think__label")].map((l) => l.textContent);

for (const look of ["standard", "clean"] as const) {
  describe(`tc-thinking-state ${look}`, () => {
    test("the host is the root, with the look", async () => {
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[A]}></tc-thinking-state>`);
      expect(el.dataset.ui).toBe("think");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-think__head")!.getAttribute("aria-expanded")).toBe("true");
    });

    test("an appended step continues the timeline instead of restarting it", async () => {
      const onDone = vi.fn();
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} step-ms="400" .steps=${[A, B]} @tc-done=${(e: CustomEvent) => onDone(e.detail.seconds)}></tc-thinking-state>`);
      await advance(el, 1200);
      expect(labels(el)).toContain(B.label);
      // Streaming: a longer array – what was shown stays shown
      el.steps = [A, B, C];
      await el.updateComplete;
      expect(labels(el)).toEqual([A.label, B.label]);
      await advance(el, 1500);
      expect(labels(el)).toContain(C.label);
      expect(onDone).toHaveBeenCalled();
      expect(el.querySelector(".ui-think__title")!.textContent).toMatch(/^Worked for/);
    });

    test("a different list starts over", async () => {
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} step-ms="400" .steps=${[A, B]}></tc-thinking-state>`);
      await advance(el, 1200);
      el.steps = [C, B];
      await el.updateComplete;
      expect(labels(el)).not.toContain(B.label);
    });

    test("controlled progress shows exactly that many steps and the timeline leaves them alone", async () => {
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[A, B, C]} progress="1"></tc-thinking-state>`);
      await advance(el, 5000);
      expect(labels(el)).toEqual([A.label]);
      expect(el.hasAttribute("data-done")).toBe(false);
      for (const value of [2, 3]) {
        el.progress = value;
        await el.updateComplete;
        expect(labels(el)).toHaveLength(value);
      }
    });

    test("controlled done finishes when the page says so and reports the seconds", async () => {
      const onDone = vi.fn();
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[A, B]} step-ms="100" .done=${false} @tc-done=${(e: CustomEvent) => onDone(e.detail.seconds)}></tc-thinking-state>`);
      await advance(el, 3000);
      expect(onDone).not.toHaveBeenCalled();
      expect(labels(el)).toContain(B.label);
      el.done = true;
      await el.updateComplete;
      expect(onDone).toHaveBeenCalledWith(3);
      expect(el.hasAttribute("data-done")).toBe(true);
      expect(el.querySelector(".ui-think__title")!.textContent).toBe("Worked for 3s");
    });

    test("the timeline reports each step it reveals", async () => {
      const onProgress = vi.fn();
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[A, B]} step-ms="400" @tc-progress-change=${(e: CustomEvent) => onProgress(e.detail.progress)}></tc-thinking-state>`);
      await advance(el, 2000);
      expect(onProgress).toHaveBeenLastCalledWith(2);
    });

    test("started-at sets where the header's timer counts from", async () => {
      vi.setSystemTime(1_000_000);
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[A]} progress="1" started-at=${1_000_000 - 65_000}></tc-thinking-state>`);
      await advance(el, 300);
      expect(el.querySelector(".ui-think__time")!.textContent).toBe("1m 05s");
    });

    test("open: the header toggles it; preventDefault keeps it (controlled)", async () => {
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[A]} .open=${false}></tc-thinking-state>`);
      const head = el.querySelector<HTMLButtonElement>(".ui-think__head")!;
      expect(head.getAttribute("aria-expanded")).toBe("false");
      const onOpen = vi.fn();
      const prevent = (e: Event) => {
        e.preventDefault();
        onOpen((e as CustomEvent).detail.open);
      };
      el.addEventListener("tc-open-change", prevent);
      head.click();
      await el.updateComplete;
      expect(onOpen).toHaveBeenCalledWith(true);
      expect(head.getAttribute("aria-expanded")).toBe("false");
      el.removeEventListener("tc-open-change", prevent);
      head.click();
      await el.updateComplete;
      expect(head.getAttribute("aria-expanded")).toBe("true");
      el.open = false;
      await el.updateComplete;
      expect(head.getAttribute("aria-expanded")).toBe("false");
    });

    test("the live timer is painted without re-rendering", async () => {
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[A]} progress="1"></tc-thinking-state>`);
      await advance(el, 100);
      const renders = vi.spyOn(el as unknown as { render: () => unknown }, "render");
      await advance(el, 3000, 250);
      expect(el.querySelector(".ui-think__time")!.textContent).toBe("3s");
      expect(renders).not.toHaveBeenCalled();
    });

    test("folded steps are inert; the header controls them", async () => {
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[SEARCH]} progress="1" .open=${false}></tc-thinking-state>`);
      const head = el.querySelector<HTMLButtonElement>("button[aria-expanded]")!;
      const body = document.getElementById(head.getAttribute("aria-controls")!)!;
      expect(body.hasAttribute("inert")).toBe(true);
      el.open = true;
      await el.updateComplete;
      expect(body.hasAttribute("inert")).toBe(false);
    });

    test("only the outcome is announced, from a region that's there from the start; the timer isn't in the name", async () => {
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[A]} step-ms="300" done-label="Done"></tc-thinking-state>`);
      expect(el.querySelector('[role="status"]')!.textContent).toBe("");
      expect(el.querySelector("ol")!.hasAttribute("aria-live")).toBe(false);
      expect(el.querySelector(".ui-think__time")!.getAttribute("aria-hidden")).toBe("true");
      await advance(el, 2000);
      expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^Done\. Worked for \d+s$/);
    });

    test("loop stops by itself after a few runs", async () => {
      const onDone = vi.fn();
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[A]} step-ms="200" loop @tc-done=${onDone}></tc-thinking-state>`);
      await advance(el, 30_000, 250);
      expect(onDone).toHaveBeenCalledTimes(3);
    });

    test("loop stays put once focus is inside", async () => {
      const onDone = vi.fn();
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[A]} step-ms="200" loop @tc-done=${onDone}></tc-thinking-state>`);
      el.querySelector<HTMLButtonElement>("button")!.focus();
      await advance(el, 15_000, 250);
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    test("+N more shows the extra sources; Escape hides a source's tooltip without moving focus", async () => {
      const step: ThinkingStep = { ...SEARCH, kind: "search", moreSources: [{ label: "Wiki" }] } as ThinkingStep;
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[step]} progress="1"></tc-thinking-state>`);
      const more = el.querySelector<HTMLButtonElement>(".ui-think__more")!;
      expect(more.textContent).toBe("+1 more");
      more.click();
      await el.updateComplete;
      expect(more.getAttribute("aria-expanded")).toBe("true");
      expect(el.querySelectorAll(".ui-think__source-label").length).toBe(2);
      const chip = el.querySelector<HTMLAnchorElement>("a")!;
      chip.focus();
      expect(chip.hasAttribute("data-tip-off")).toBe(false);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(chip.hasAttribute("data-tip-off")).toBe(true);
      expect(document.activeElement).toBe(chip);
      chip.blur();
      expect(chip.hasAttribute("data-tip-off")).toBe(false);
    });

    test("a source icon element is cloned", async () => {
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("data-mine", "");
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[{ kind: "search", label: "S", sources: [{ label: "X", icon }] }]} progress="1"></tc-thinking-state>`);
      expect(el.querySelector(".ui-think__favicon svg[data-mine]")).toBeTruthy();
      expect(icon.isConnected).toBe(false);
    });

    test("no timers left behind when removed", async () => {
      const el = await fixture<TcThinkingState>(html`<tc-thinking-state look=${look} .steps=${[A, B]} loop></tc-thinking-state>`);
      el.remove();
      expect(vi.getTimerCount()).toBe(0);
    });
  });
}

test("axe: no violations in either look", async () => {
  vi.useRealTimers();
  const wrap = await fixture(html`<div>
    <tc-thinking-state .steps=${[A, SEARCH]} progress="2" .done=${true}></tc-thinking-state>
    <tc-thinking-state look="clean" .steps=${[A, SEARCH]} progress="2"></tc-thinking-state>
  </div>`);
  await settle();
  for (const a of wrap.getAnimations({ subtree: true })) if (a.effect?.getComputedTiming().iterations !== Infinity) a.finish();
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});

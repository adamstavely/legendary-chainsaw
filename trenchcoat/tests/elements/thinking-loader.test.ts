/*
 * <tc-thinking-loader> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/thinking-loader";
import type { TcThinkingLoader } from "../../src/elements/thinking-loader";
import { cleanup, fixture } from "./helpers";

const label = (el: Element) => el.querySelector(".ui-tl__label:not(.ui-tl__label--out)")!.textContent;
const tick = async (el: TcThinkingLoader, ms: number) => {
  vi.advanceTimersByTime(ms);
  await el.updateComplete;
};

describe("tc-thinking-loader", () => {
  beforeEach(() => vi.useFakeTimers({ now: 1_000_000, toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"] }));
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  test("the host is the root and the status", async () => {
    const el = await fixture<TcThinkingLoader>(html`<tc-thinking-loader size="sm" variant="plain"></tc-thinking-loader>`);
    expect(el.dataset.ui).toBe("tl");
    expect(el.dataset.look).toBe("standard");
    expect(el.dataset.size).toBe("sm");
    expect(el.dataset.variant).toBe("plain");
    expect(el.getAttribute("role")).toBe("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(getComputedStyle(el).display).toBe("inline-flex");
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("the done label counts the seconds since connecting, and the first update of done already shows it", async () => {
        const el = await fixture<TcThinkingLoader>(html`<tc-thinking-loader look=${look}></tc-thinking-loader>`);
        await tick(el, 6000);
        el.done = true;
        await el.updateComplete;
        expect(label(el)).toBe("Thought for 6s");
        expect(el.hasAttribute("data-done")).toBe(true);
        // Only one swap: the phase label rolls out, no intermediate done label
        expect(el.querySelector(".ui-tl__label--out")!.textContent).not.toMatch(/Thought/);
      });

      test("startedAt (epoch ms) sets where the count starts", async () => {
        const el = await fixture<TcThinkingLoader>(html`<tc-thinking-loader look=${look} done startedAt=${1_000_000 - 12_000}></tc-thinking-loader>`);
        expect(label(el)).toBe("Thought for 12s");
      });

      test("restarting work starts the clock and the phases over", async () => {
        const el = await fixture<TcThinkingLoader>(html`<tc-thinking-loader look=${look} done></tc-thinking-loader>`);
        el.done = false;
        await el.updateComplete;
        expect(label(el)).toBe("Thinking");
        await tick(el, 3000);
        el.done = true;
        await el.updateComplete;
        expect(label(el)).toBe("Thought for 3s");
      });

      test("the timer fires tc-phase-change for each phase; phase sets where it starts", async () => {
        const seen: number[] = [];
        const el = await fixture<TcThinkingLoader>(html`<tc-thinking-loader look=${look} phase="1" interval="1000" @tc-phase-change=${(e: CustomEvent<{ phase: number }>) => seen.push(e.detail.phase)}></tc-thinking-loader>`);
        expect(label(el)).toBe("Searching the web");
        await tick(el, 1000);
        expect(seen).toEqual([2]);
        expect(label(el)).toBe("Reading sources");
      });

      test("preventDefault() keeps the phase (controlled use); manual stops the timer", async () => {
        const el = await fixture<TcThinkingLoader>(html`<tc-thinking-loader look=${look} interval="1000" @tc-phase-change=${(e: Event) => e.preventDefault()}></tc-thinking-loader>`);
        await tick(el, 3000);
        expect(label(el)).toBe("Thinking");
        const seen: number[] = [];
        const manual = await fixture<TcThinkingLoader>(html`<tc-thinking-loader look=${look} manual interval="1000" @tc-phase-change=${(e: CustomEvent<{ phase: number }>) => seen.push(e.detail.phase)}></tc-thinking-loader>`);
        await tick(manual, 5000);
        expect(label(manual)).toBe("Thinking");
        expect(seen).toEqual([]);
        manual.phase = 2;
        await manual.updateComplete;
        expect(label(manual)).toBe("Reading sources");
      });

      test("loop starts over at most twice, then holds the last phase (2.2.2)", async () => {
        const el = await fixture<TcThinkingLoader>(html`<tc-thinking-loader look=${look} .phases=${["A", "B"]} interval="100" loop></tc-thinking-loader>`);
        const seen: string[] = [];
        for (let i = 0; i < 12; i++) {
          await tick(el, 100);
          seen.push(label(el)!);
        }
        expect(seen.join("")).toBe("BABABBBBBBBB");
      });

      test("only the first phase and the done label are announced; the rolling label is aria-hidden (4.1.3)", async () => {
        const el = await fixture<TcThinkingLoader>(html`<tc-thinking-loader look=${look} .phases=${["Thinking", "Searching"]} interval="100"></tc-thinking-loader>`);
        const sr = el.querySelector(".ui-tl__sr")!;
        expect(sr.textContent).toBe("Thinking");
        await tick(el, 100);
        expect(label(el)).toBe("Searching");
        expect(sr.textContent).toBe("Thinking");
        expect(el.querySelector(".ui-tl__text")!.getAttribute("aria-hidden")).toBe("true");
        el.doneLabel = "Done";
        el.done = true;
        await el.updateComplete;
        expect(sr.textContent).toBe("Done");
      });

      test("the text box takes the width of the label", async () => {
        const el = await fixture<TcThinkingLoader>(html`<tc-thinking-loader look=${look}></tc-thinking-loader>`);
        const box = el.querySelector<HTMLElement>(".ui-tl__text")!;
        const current = el.querySelector<HTMLElement>(".ui-tl__label")!;
        expect(box.style.width).toBe(`${current.offsetWidth + 1}px`);
      });
    });
  }

  test("styles: the sweep animates transform a few times and pauses off-screen; the text box is one line in lh", async () => {
    await fixture(html`<tc-thinking-loader></tc-thinking-loader>`);
    const sheet = (customElements.get("tc-thinking-loader") as unknown as { css: string }).css;
    expect(sheet).not.toMatch(/background-position/);
    expect(sheet).toMatch(/animation: ui-tl-sweep [^;]* 3 both/);
    expect(sheet).toMatch(/\[data-ui="tl"\]\[data-offscreen\][^{]*{ animation-play-state: paused/);
    expect(sheet).toMatch(/height: 1lh/);
  });

  test("timers stop when the element leaves the page", async () => {
    const el = await fixture<TcThinkingLoader>(html`<tc-thinking-loader interval="100"></tc-thinking-loader>`);
    expect(vi.getTimerCount()).toBe(1);
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("axe: no violations in either look", async () => {
    vi.useRealTimers();
    const wrap = await fixture(html`<div>
      <tc-thinking-loader></tc-thinking-loader>
      <tc-thinking-loader look="clean" done></tc-thinking-loader>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

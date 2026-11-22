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

  describe('mark="pixels" and a fixed label (what Pixel Loader did)', () => {
    const dots = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-tl__dot")];
    const lit = (el: Element) => dots(el).flatMap((d, i) => (d.hasAttribute("data-lit") ? [i] : []));
    const time = (el: Element) => el.querySelector(".ui-tl__time")!.textContent;

    test("the grid replaces the rays, the time ticks without re-rendering, and the label stays when done", async () => {
      const el = await fixture<TcThinkingLoader>(html`<tc-thinking-loader mark="pixels" pattern="orbit" label="Reading the audit log"></tc-thinking-loader>`);
      expect(el.querySelector(".ui-tl__icon")).toBeNull();
      expect(dots(el)).toHaveLength(25);
      expect(el.querySelector(".ui-tl__grid")!.getAttribute("aria-hidden")).toBe("true");
      expect(dots(el).filter((d) => d.hasAttribute("data-rest"))).toHaveLength(9);
      expect(el.dataset.status).toBe("working");
      // The host stays the status; the line under it isn't a second one
      expect(el.getAttribute("role")).toBe("status");
      expect(el.querySelector(".ui-tl__sr")!.hasAttribute("role")).toBe(false);
      expect(el.querySelector(".ui-tl__sr")!.textContent).toBe("Reading the audit log");
      const updates = vi.spyOn(el as unknown as { update: (c: unknown) => void }, "update");
      vi.advanceTimersByTime(2300);
      expect(time(el)).toBe("2.3s");
      expect(updates).not.toHaveBeenCalled();
      el.state = "done";
      await el.updateComplete;
      expect(lit(el)).toEqual([4, 8, 10, 12, 16]);
      expect(label(el)).toBe("Reading the audit log");
      expect(el.querySelector(".ui-tl__sr")!.textContent).toBe("Done: Reading the audit log");
      expect(vi.getTimerCount()).toBe(0);
    });

    test("error: a cross (pixels or rays), and the status says it failed", async () => {
      const px = await fixture<TcThinkingLoader>(html`<tc-thinking-loader mark="pixels" label="Exporting" .labels=${{ error: "Couldn't finish" }}></tc-thinking-loader>`);
      px.state = "error";
      await px.updateComplete;
      expect(lit(px)).toEqual([0, 4, 6, 8, 12, 16, 18, 20, 24]);
      expect(px.querySelector(".ui-tl__sr")!.textContent).toBe("Couldn't finish: Exporting");
      const rays = await fixture<TcThinkingLoader>(html`<tc-thinking-loader state="error"></tc-thinking-loader>`);
      expect(rays.dataset.status).toBe("error");
      expect(rays.hasAttribute("data-done")).toBe(false);
      expect(label(rays)).toBe("Failed");
      expect(getComputedStyle(rays.querySelector(".ui-tl__cross")!).opacity).not.toBe("0");
    });

    test("started and now from Pixel Loader work too; hide-time drops the time; rays show no time", async () => {
      const driven = await fixture<TcThinkingLoader>(html`<tc-thinking-loader mark="pixels" .started=${0} .now=${64_000}></tc-thinking-loader>`);
      expect(time(driven)).toBe("1m 4s");
      driven.now = 65_000;
      await driven.updateComplete;
      expect(time(driven)).toBe("1m 5s");
      const hidden = await fixture<TcThinkingLoader>(html`<tc-thinking-loader mark="pixels" hide-time></tc-thinking-loader>`);
      expect(hidden.querySelector(".ui-tl__time")).toBeNull();
      const rays = await fixture<TcThinkingLoader>(html`<tc-thinking-loader></tc-thinking-loader>`);
      expect(rays.querySelector(".ui-tl__time")).toBeNull();
    });
  });

  test(`tc-pixel-loader is this element with mark="pixels" and its own look`, async () => {
    await import("../../src/elements/pixel-loader");
    const { TcThinkingLoader: Base } = await import("../../src/elements/thinking-loader");
    const el = await fixture<TcThinkingLoader>(html`<tc-pixel-loader mark="rays"></tc-pixel-loader>`);
    expect(el).toBeInstanceOf(Base);
    expect(el.dataset.ui).toBe("pxl");
    // Always the grid, whatever mark says
    expect(el.querySelectorAll(".ui-pxl__dot")).toHaveLength(25);
    expect(el.querySelector(".ui-pxl__label")!.textContent).toBe("Working");
  });

  test("axe: no violations in either look", async () => {
    vi.useRealTimers();
    const wrap = await fixture(html`<div>
      <tc-thinking-loader></tc-thinking-loader>
      <tc-thinking-loader look="clean" done></tc-thinking-loader>
      <tc-thinking-loader mark="pixels" pattern="drive" label="Matching vendor IDs"></tc-thinking-loader>
      <tc-thinking-loader look="clean" mark="pixels" label="Uploading" state="error"></tc-thinking-loader>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

/*
 * <tc-plan-vs-actual> in real browsers – the React component's contract and regression checks, ported. Clean only:
 * the element renders the Clean look whatever `look` says.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/plan-vs-actual";
import type { PlanVsActualStep, TcPlanVsActual } from "../../src/elements/plan-vs-actual";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const T0 = Date.UTC(2026, 9, 24, 12, 0, 0);
const time = (el: Element) => el.querySelector(".ui-pvac__stat dd b")!.textContent;
const css = () => (customElements.get("tc-plan-vs-actual") as unknown as { css: string }).css;
const steps: PlanVsActualStep[] = [
  { id: "a", title: "Read the brief", plan: 4000, start: 0 },
  { id: "b", title: "Build the layout", plan: 6000, deps: ["a"] },
  { id: "c", title: "Write the copy", plan: 5000, deps: ["a", "b"] },
];

describe("tc-plan-vs-actual", () => {
  test("the host is the root, always Clean", async () => {
    const el = await fixture<TcPlanVsActual>(html`<tc-plan-vs-actual heading="Release" .elapsed=${4000} .steps=${steps}></tc-plan-vs-actual>`);
    expect(el.dataset.ui).toBe("pvac");
    expect(el.dataset.look).toBe("clean");
    el.look = "standard";
    await settle();
    expect(el.dataset.look).toBe("clean");
    const list = el.querySelector('[role="list"]')!;
    expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Release");
    expect(el.querySelectorAll('[role="listitem"]').length).toBe(3);
    expect(el.style.getPropertyValue("--tc-plan-vs-actual-rows")).toBe("3");
  });

  test("cyclic and self deps render instead of overflowing the stack", async () => {
    const cyclic: PlanVsActualStep[] = [
      { id: "a", title: "Read the brief", plan: 4000, deps: ["c"], start: 0 },
      { id: "b", title: "Build the layout", plan: 6000, deps: ["a"] },
      { id: "c", title: "Write the copy", plan: 5000, deps: ["b", "c"] },
    ];
    const el = await fixture<TcPlanVsActual>(html`<tc-plan-vs-actual .steps=${cyclic} .now=${2000}></tc-plan-vs-actual>`);
    expect([...el.querySelectorAll(".ui-pvac__label")].map((l) => l.textContent)).toEqual(cyclic.map((s) => s.title));
  });

  test("`now` in epoch ms counts from the first start", async () => {
    const el = await fixture<TcPlanVsActual>(html`<tc-plan-vs-actual .steps=${[{ id: "a", title: "Read the brief", plan: 60_000, start: T0 }]} .now=${T0 + 42_000}></tc-plan-vs-actual>`);
    expect(time(el)).toBe("0:42");
  });

  test("`elapsed` keeps the run-relative meaning", async () => {
    const el = await fixture<TcPlanVsActual>(html`<tc-plan-vs-actual .steps=${[{ id: "a", title: "Read the brief", plan: 60_000, start: 5_000 }]} .elapsed=${65_000}></tc-plan-vs-actual>`);
    expect(time(el)).toBe("1:05");
  });

  test("without a clock it reads the clock after connecting and ticks while the run goes on; the timer stops on disconnect", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(T0 + 10_000);
    const el = await fixture<TcPlanVsActual>(html`<tc-plan-vs-actual .steps=${[{ id: "a", title: "Read the brief", plan: 60_000, start: T0 }]}></tc-plan-vs-actual>`);
    expect(time(el)).toBe("0:10");
    vi.advanceTimersByTime(5_000);
    await settle();
    expect(time(el)).toBe("0:15");
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("a jump glides without reading the clock during render, then settles on the target", async () => {
    const base: PlanVsActualStep[] = [
      { id: "a", title: "First", plan: 60_000, start: 0 },
      { id: "b", title: "Second", plan: 30_000, deps: ["a"] },
    ];
    const forecast = (el: Element) => Number(el.querySelectorAll<HTMLElement>(".ui-pvac__row")[1].querySelector<HTMLElement>('.ui-pvac__bar[data-kind="forecast"]')!.style.getPropertyValue("--s"));
    const el = await fixture<TcPlanVsActual>(html`<tc-plan-vs-actual .steps=${base} .elapsed=${10_000}></tc-plan-vs-actual>`);
    expect(forecast(el)).toBe(60_000);
    const spy = vi.spyOn(performance, "now");
    // The first step finishes early: the second one jumps forward – it glides there
    el.steps = [{ ...base[0], end: 20_000 }, base[1]];
    el.elapsed = 20_000;
    await el.updateComplete;
    expect(forecast(el)).toBe(60_000);
    // Read it every frame until it lands (frame timestamps only: performance.now is watched)
    const seen: number[] = [];
    for (let i = 0; i < 600 && forecast(el) !== 20_000; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      await el.updateComplete;
      seen.push(forecast(el));
    }
    // (reduced motion lands at once)
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) expect(seen.some((v) => v < 60_000 && v > 20_000)).toBe(true);
    await settle();
    expect(forecast(el)).toBe(20_000);
    expect(spy).not.toHaveBeenCalled();
  });

  test("each row names what it waits for, and a waiting row its planned time", async () => {
    const el = await fixture<TcPlanVsActual>(html`<tc-plan-vs-actual .steps=${steps} .elapsed=${2000}></tc-plan-vs-actual>`);
    const rows = [...el.querySelectorAll('[role="listitem"]')];
    expect(rows[0].getAttribute("aria-label")).not.toMatch(/Waits for/);
    expect(rows[1].getAttribute("aria-label")).toMatch(/planned 0:06\. Waits for Read the brief$/);
    expect(rows[2].getAttribute("aria-label")).toMatch(/Waits for Read the brief, Build the layout$/);
  });

  test("dimming another row never dims its text; the sheen is finite, composited and pauses off-screen", async () => {
    const el = await fixture<TcPlanVsActual>(html`<tc-plan-vs-actual .steps=${steps} .elapsed=${2000}></tc-plan-vs-actual>`);
    const sheet = css();
    expect(sheet).not.toMatch(/\.ui-pvac__row\[data-dim\]\s*\{\s*opacity/);
    expect(sheet).toMatch(/\.ui-pvac__row\[data-dim\] :is\(\.ui-pvac__bar, \.ui-pvac__ghost/);
    expect(sheet).not.toMatch(/background-position/);
    expect(sheet).not.toMatch(/infinite alternate|ui-pvac-sweep[^;]*infinite/);
    expect(sheet).toMatch(/\[data-offscreen\] \.ui-pvac__bar::before/);
    expect(sheet).not.toMatch(/\.dark[^{]*\[data-ui="pvac"\]/);
    expect(el.querySelector(".ui-pvac__live[data-live]")).not.toBeNull();
    expect(sheet).not.toMatch(/\.ui-pvac__live\[data-live\]\s*\{/);
    expect(sheet).toMatch(/\.ui-pvac__row:focus-visible \{ outline: var\(--tc-focus-outline/);
  });

  test("off-screen, the host is marked so its animations pause", async () => {
    let cb: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(fn: IntersectionObserverCallback) {
          cb = fn;
        }
        observe() {}
        disconnect() {}
      },
    );
    const el = await fixture<TcPlanVsActual>(html`<tc-plan-vs-actual .steps=${steps} .elapsed=${2000}></tc-plan-vs-actual>`);
    cb([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(el.hasAttribute("data-offscreen")).toBe(true);
    cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(el.hasAttribute("data-offscreen")).toBe(false);
  });

  test("keyboard: focusing a row shows what it waits for and what waits for it, and its cost", async () => {
    const withCost = steps.map((s, i) => ({ ...s, cost: i === 0 ? 0.25 : undefined }));
    const el = await fixture<TcPlanVsActual>(html`<tc-plan-vs-actual .steps=${withCost} .elapsed=${2000}></tc-plan-vs-actual>`);
    const rows = el.querySelectorAll<HTMLElement>('[role="listitem"]');
    expect(rows[0].tabIndex).toBe(0);
    rows[0].focus();
    await settle();
    expect(rows[0].hasAttribute("data-focus")).toBe(true);
    expect(el.querySelectorAll(".ui-pvac__link").length).toBe(2);
    expect(rows[0].querySelector(".ui-pvac__cost")!.textContent).toBe("$0.25");
    expect(rows[1].hasAttribute("data-dim")).toBe(false);
    rows[1].focus();
    await settle();
    expect(rows[0].hasAttribute("data-focus")).toBe(false);
    // b waits for a, c waits for b – nothing is dimmed
    expect([...rows].map((r) => r.hasAttribute("data-dim"))).toEqual([false, false, false]);
    rows[1].blur();
    await settle();
    expect(el.querySelectorAll(".ui-pvac__link").length).toBe(0);
  });

  test("a custom icon is cloned; formatTime and formatCost are used", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("data-mine", "");
    const el = await fixture<TcPlanVsActual>(
      html`<tc-plan-vs-actual .steps=${[{ id: "a", title: "A", plan: 4000, start: 0, icon, cost: 1, planCost: 2 }]} .elapsed=${1000} .formatTime=${(ms: number) => `${ms}ms`} .formatCost=${(n: number) => `€${n}`}></tc-plan-vs-actual>`,
    );
    expect(el.querySelector(".ui-pvac__icon svg[data-mine]")).toBeTruthy();
    expect(icon.isConnected).toBe(false);
    expect(time(el)).toBe("1000ms");
    expect(el.querySelectorAll(".ui-pvac__stat dd b")[1].textContent).toBe("€1");
  });

  test("axe: no violations", async () => {
    const wrap = await fixture(html`<div>
      <tc-plan-vs-actual task="Ship it" .steps=${steps} .elapsed=${2000}></tc-plan-vs-actual>
    </div>`);
    wrap.getAnimations({ subtree: true }).forEach((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.finish());
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

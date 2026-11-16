/*
 * <tc-rate-limit-planner> in real browsers: the load against the limit with the overflow hatched, the peak and the time
 * over in words, runs as sliders moved by keys and by dragging, fixed runs, Spread out, the narrow scroll, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/rate-limit-planner";
import { rateLoad, spreadRuns, type PlannedRun, type RateLimitRunsChange, type TcRateLimitPlanner } from "../../src/elements/rate-limit-planner";
import { RateLimitPlanner } from "../../src/elements/react/rate-limit-planner";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DAY = Date.UTC(2026, 10, 16);
const MIN = 60_000;
const at = (h: number, m = 0) => DAY + (h * 60 + m) * MIN;
const RUNS: PlannedRun[] = [
  { id: "wire", name: "Wire summaries", agent: "Wire desk", start: at(0, 30), minutes: 150, tokensPerMinute: 180_000 },
  { id: "translate", name: "Translation batch", agent: "Languages desk", start: at(1), minutes: 120, tokensPerMinute: 160_000 },
  { id: "archive", name: "Archive tagging", agent: "Archive", start: at(1, 30), minutes: 180, tokensPerMinute: 140_000 },
  { id: "briefing", name: "Morning briefing", agent: "Briefing", start: at(5), minutes: 60, tokensPerMinute: 120_000, fixed: true },
];
const make = (look: "standard" | "clean" = "standard", runs = RUNS) =>
  fixture<TcRateLimitPlanner>(
    html`<tc-rate-limit-planner look=${look} heading="Overnight" locale="en-GB" time-zone="UTC" limit="400000" hours="12" .day=${DAY} .runs=${runs}></tc-rate-limit-planner>`,
  );
const bar = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-rlp__bar[data-id="${id}"]`)!;
const key = (t: Element, k: string, init: KeyboardEventInit = {}) => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const changes = (el: Element) => {
  const seen: RateLimitRunsChange[] = [];
  el.addEventListener("tc-runs-change", (e) => seen.push((e as CustomEvent<RateLimitRunsChange>).detail));
  return seen;
};
/** The browser's own compact form – "480k" or "480K" depending on its ICU */
const k = (v: number) => new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(v);
const startOf = (el: TcRateLimitPlanner, id: string) => (el.runs.find((r) => r.id === id)!.start - DAY) / MIN;

describe("tc-rate-limit-planner", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the load, the limit, the overflow, the peak in words and a slider per movable run`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rlp");
      expect(el.dataset.look).toBe(look);
      // 01:30–03:00: wire + translate + archive = 480k
      expect(el.querySelector(".ui-rlp__peak")!.textContent).toBe(`Peak ${k(480_000)} a minute at 01:30 – 20% over the limit`);
      expect(el.querySelector(".ui-rlp__over-words")!.textContent).toBe("Over the limit for 1 h 30 min: 01:30–03:00");
      expect(el.querySelector(".ui-rlp__pill")!.textContent).toBe("Over the limit");
      expect(el.querySelector(".ui-rlp__over")).toBeTruthy();
      expect(el.querySelector(".ui-rlp__limit-label")!.textContent).toBe(`Limit ${k(400_000)}/min`);
      expect(el.querySelector(".ui-rlp__chart")!.getAttribute("aria-label")).toContain(`Peak ${k(480_000)} a minute at 01:30`);
      const b = bar(el, "wire");
      expect(b.getAttribute("role")).toBe("slider");
      expect(b.getAttribute("aria-valuenow")).toBe("30");
      expect(b.getAttribute("aria-valuemax")).toBe(String(12 * 60 - 150));
      expect(b.getAttribute("aria-valuetext")).toBe("Starts 00:30, ends 03:00, while over the limit");
      expect(b.hasAttribute("data-over")).toBe(true);
      expect(bar(el, "briefing").getAttribute("role")).toBeNull();
      expect(bar(el, "briefing").hasAttribute("data-fixed")).toBe(true);
      expect(el.querySelector('.ui-rlp__row[data-id="briefing"] .ui-rlp__meta')!.textContent).toContain("Fixed");
      expect([...el.querySelectorAll(".ui-rlp__bar[role=slider]")].filter((n) => n.getAttribute("tabindex") === "0").length).toBe(1);
    });
  }

  test("rateLoad sums each slot; spreadRuns lowers the peak and leaves fixed runs alone", () => {
    const load = rateLoad(RUNS, DAY, 12 * 60, 15);
    expect(load.length).toBe(48);
    expect(load[0]).toBe(0);
    expect(load[2]).toBe(180_000);
    expect(load[6]).toBe(480_000);
    expect(load[20]).toBe(120_000);
    const spread = spreadRuns(RUNS, { day: DAY, hours: 12 });
    expect(Math.max(...rateLoad(spread, DAY, 12 * 60))).toBeLessThanOrEqual(180_000 + 120_000);
    expect(spread.find((r) => r.id === "briefing")).toBe(RUNS[3]);
    expect(spread.map((r) => r.id)).toEqual(RUNS.map((r) => r.id));
  });

  test("← / → move a run by 15 minutes, Shift by an hour, Home and End to the ends; ↑ / ↓ go between runs; preventDefault keeps it", async () => {
    const el = await make();
    const seen = changes(el);
    bar(el, "wire").focus();
    key(bar(el, "wire"), "ArrowRight");
    await settle();
    expect(startOf(el, "wire")).toBe(45);
    expect(seen.at(-1)).toMatchObject({ change: "move", id: "wire" });
    key(bar(el, "wire"), "ArrowLeft", { shiftKey: true });
    await settle();
    expect(startOf(el, "wire")).toBe(0);
    key(bar(el, "wire"), "End");
    await settle();
    expect(startOf(el, "wire")).toBe(12 * 60 - 150);
    expect(el.querySelector('[role="status"]')!.textContent).toContain("Wire summaries: Starts 09:30, ends 12:00");
    key(bar(el, "wire"), "Home");
    await settle();
    expect(startOf(el, "wire")).toBe(0);
    key(bar(el, "wire"), "ArrowDown");
    await settle();
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("translate");
    expect(bar(el, "translate").getAttribute("tabindex")).toBe("0");
    expect(bar(el, "wire").getAttribute("tabindex")).toBe("-1");

    el.addEventListener("tc-runs-change", (e) => e.preventDefault(), { once: true });
    key(bar(el, "translate"), "ArrowRight");
    await settle();
    expect(startOf(el, "translate")).toBe(60);
  });

  test("dragging a bar moves its run in 15-minute steps and the chart follows", async () => {
    const el = await make();
    const b = bar(el, "archive");
    const track = b.parentElement!.getBoundingClientRect();
    const perHour = track.width / 12;
    const r = b.getBoundingClientRect();
    const x = r.left + 4;
    const y = r.top + r.height / 2;
    b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: x, clientY: y, pointerId: 1 }));
    b.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: x + perHour * 3, clientY: y, pointerId: 1 }));
    await settle();
    expect(startOf(el, "archive")).toBe(270);
    expect(bar(el, "archive").hasAttribute("data-dragging")).toBe(true);
    bar(el, "archive").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: x + perHour * 3, clientY: y, pointerId: 1 }));
    await settle();
    expect(bar(el, "archive").hasAttribute("data-dragging")).toBe(false);
    expect(el.querySelector(".ui-rlp__peak")!.textContent).toBe(`Peak ${k(340_000)} a minute at 01:00 – 85% of the limit`);
    expect(el.querySelector(".ui-rlp__pill")!.textContent).toBe("Under the limit");
    expect(el.querySelector(".ui-rlp__over-words")!.textContent).toBe("Under the limit all day");
    // A fixed run doesn't move
    const f = bar(el, "briefing");
    f.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: f.getBoundingClientRect().left + 2, pointerId: 2 }));
    f.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: f.getBoundingClientRect().left + perHour, pointerId: 2 }));
    await settle();
    expect(startOf(el, "briefing")).toBe(300);
  });

  test("Spread out applies start times that lower the peak, unless the page prevents it", async () => {
    const el = await make();
    const seen = changes(el);
    const spread = el.querySelector<HTMLButtonElement>(".ui-rlp__spread")!;
    el.addEventListener("tc-runs-change", (e) => e.preventDefault(), { once: true });
    spread.click();
    await settle();
    expect(seen.at(-1)).toMatchObject({ change: "spread", id: null });
    expect(el.runs).toBe(RUNS);
    spread.click();
    await settle();
    expect(el.runs).not.toBe(RUNS);
    expect(el.querySelector(".ui-rlp__pill")!.textContent).toBe("Under the limit");
    expect(el.querySelector('[role="status"]')!.textContent).toBe(`Spread out: peak from ${k(480_000)} to ${k(180_000)} a minute`);
    spread.click();
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Spreading out wouldn't lower the peak");
  });

  test("no runs: nothing planned, no sliders", async () => {
    const el = await make("standard", []);
    expect(el.querySelector(".ui-rlp__peak")!.textContent).toBe("Nothing planned");
    expect(el.querySelector(".ui-rlp__empty")!.textContent).toBe("No runs planned.");
    expect(el.querySelector<HTMLButtonElement>(".ui-rlp__spread")!.disabled).toBe(true);
  });

  test("narrow, the axis keeps its width and scrolls sideways, with the names held at the left", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="width: 360px"><tc-rate-limit-planner limit="400000" hours="12" .day=${DAY} .runs=${RUNS}></tc-rate-limit-planner></div>`);
    const scroll = wrap.querySelector<HTMLElement>(".ui-rlp__scroll")!;
    expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
    expect(getComputedStyle(wrap.querySelector(".ui-rlp__name")!).position).toBe("sticky");
  });

  test("React wrapper: uncontrolled runs survive re-renders; controlled ones stay until the parent changes them", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RateLimitPlanner, { title: "Plan", limit: 400_000, day: DAY, hours: 12, defaultRuns: RUNS, onRunsChange: (_r, change, id) => void seen.push(`${change}:${id}`), "data-n": n } as React.ComponentProps<typeof RateLimitPlanner>);
    }
    await act(async () => root.render(React.createElement(App)));
    const el = host.querySelector<TcRateLimitPlanner>("tc-rate-limit-planner")!;
    expect(el.heading).toBe("Plan");
    await act(async () => void key(bar(el, "wire"), "ArrowRight"));
    expect(startOf(el, "wire")).toBe(45);
    await act(async () => bump());
    expect(startOf(el, "wire")).toBe(45);
    expect(seen).toEqual(["move:wire"]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(RateLimitPlanner, { limit: 400_000, day: DAY, hours: 12, runs: RUNS, onRunsChange: (_r, change, id) => void seen.push(`${change}:${id}`) })));
    const el2 = host2.querySelector<TcRateLimitPlanner>("tc-rate-limit-planner")!;
    await act(async () => void key(bar(el2, "wire"), "ArrowRight"));
    expect(startOf(el2, "wire")).toBe(30);
    expect(seen.at(-1)).toBe("move:wire");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-rate-limit-planner look="standard" heading="Overnight" limit="400000" hours="12" time-zone="UTC" .day=${DAY} .runs=${RUNS}></tc-rate-limit-planner>
        <tc-rate-limit-planner look="clean" heading="Overnight, clean" limit="400000" hours="12" time-zone="UTC" .day=${DAY} .runs=${RUNS}></tc-rate-limit-planner>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

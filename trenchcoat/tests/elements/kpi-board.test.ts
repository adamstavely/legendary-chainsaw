/*
 * <tc-kpi-board> in real browsers: the cards and their numbers, changes and charts, numbers that roll through the DOM
 * (never a render per frame, and from the old numbers to the new ones on a new range), the pickers' keyboard pattern,
 * controlled range and segment, the day under the pointer, the buttons, bad data, narrow width, the React wrapper and
 * the block on it, and axe in both looks and both themes. Ported from the jsdom regressions of blocks/kpi-board.tsx.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act, Profiler } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/kpi-board";
import type { KpiBoardData, KpiRangeChange, TcKpiBoard } from "../../src/elements/kpi-board";
import { KpiBoard } from "../../src/elements/react/kpi-board";
import { KpiBoard as KpiBoardBlock } from "../../blocks/kpi-board";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const set = (scale: number): KpiBoardData => {
  const labels = ["1 Oct", "2 Oct", "3 Oct"];
  const values = [300, 500, 400].map((v) => v * scale);
  return {
    stats: [
      { id: "orders", label: "Orders", kind: "count", labels, values, previous: 1000 },
      { id: "refunds", label: "Refunds", kind: "money", labels, values: [10, 20, 30], previous: 90, lowerIsBetter: true },
    ],
    overview: { title: "Gross volume", labels, current: values, previous: [200, 400, 300], segments: { pro: { current: [1, 2, 3], previous: [1, 1, 1] } } },
    focus: { title: "Pro plan", note: "Best seller", metric: "Sales", unit: "items", labels, values, previous: 900 },
  };
};
const DATA = { "7d": set(1), "30d": set(2) };
const RANGES = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];
const SEGMENTS = [
  { id: "all", label: "All plans" },
  { id: "pro", label: "Pro" },
];

const make = (extra: Partial<TcKpiBoard> = {}, look: "standard" | "clean" = "standard") =>
  fixture<HTMLElement>(
    html`<div style="width: 1100px"><tc-kpi-board look=${look} heading="Overview" .data=${DATA} .ranges=${RANGES} .segments=${SEGMENTS} .range=${extra.range} .setup=${extra.setup} .action=${extra.action}></tc-kpi-board></div>`,
  ).then((w) => w.querySelector("tc-kpi-board")!);
const orders = (el: Element) => el.querySelector('[aria-label="Orders"] .ui-kb__pair b')!.textContent!.trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const trigger = (el: Element, label: string) => el.querySelector<HTMLButtonElement>(`[role="combobox"][aria-label="${label}"]`)!;
/** Waits for every roll to land */
const rolled = (el: Element, text: string) => expect.poll(() => orders(el), { timeout: 3000 }).toBe(text);

describe("<tc-kpi-board>", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`structure (${look}): the heading, a range picker, the stat cards, the overview and the focus card`, async () => {
      const el = await make({}, look);
      expect(el.dataset.ui).toBe("kb");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-kb__heading")!.textContent).toBe("Overview");
      expect(trigger(el, "Date range").textContent).toContain("Last 7 days");
      expect([...el.querySelectorAll(".ui-kb__stat")].map((s) => s.getAttribute("aria-label"))).toEqual(["Orders", "Refunds"]);
      expect(el.querySelector(".ui-kb__overview")!.getAttribute("aria-label")).toBe("Gross volume");
      expect(el.querySelector(".ui-kb__focus")!.getAttribute("aria-label")).toBe("Pro plan");
    });
  }

  test("numbers roll up from zero on first view, then show their totals; changes are coloured by good news", async () => {
    const el = await make();
    await rolled(el, "1,200");
    // Orders up 200 = good; refunds down 30 with lowerIsBetter = good
    const changes = [...el.querySelectorAll(".ui-kb__stat .ui-kb__change")];
    expect(changes.map((c) => c.textContent!.trim())).toEqual(["200", "$30.00"]);
    expect(changes.every((c) => c.hasAttribute("data-good"))).toBe(true);
    await expect.poll(() => el.querySelector(".ui-kb__overview .ui-kb__figure b")!.textContent).toBe("$1,200.00");
    expect(el.querySelector(".ui-kb__vs i")!.textContent).toBe("+33.3%");
    await expect.poll(() => el.querySelector(".ui-kb__focus .ui-kb__figure b")!.textContent).toBe("1,200 items");
  });

  test("a new range rolls from the old numbers to the new ones, and the charts draw in again", async () => {
    const el = await make();
    await rolled(el, "1,200");
    const svgBefore = el.querySelector(".ui-kb__stat .ui-kb__plot svg");
    el.range = "30d";
    await settle(el);
    expect(el.querySelector(".ui-kb__stat .ui-kb__plot svg")).not.toBe(svgBefore);
    const seen = new Set<string>();
    await expect
      .poll(() => {
        seen.add(orders(el));
        return orders(el);
      }, { timeout: 3000, interval: 16 })
      .toBe("2,400");
    // Somewhere between: the roll passed through numbers above the old total and below the new one
    expect([...seen].some((t) => Number(t.replace(/,/g, "")) > 1200 && Number(t.replace(/,/g, "")) < 2400)).toBe(true);
  });

  test("the range picker: a pick fires tc-range-change; preventDefault keeps the range", async () => {
    const el = await make();
    const asked: string[] = [];
    el.addEventListener("tc-range-change", (e) => {
      asked.push((e as CustomEvent<KpiRangeChange>).detail.range);
      e.preventDefault();
    });
    trigger(el, "Date range").click();
    await settle(el);
    [...el.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent!.includes("Last 30 days"))!.click();
    await settle(el);
    expect(asked).toEqual(["30d"]);
    expect(trigger(el, "Date range").textContent).toContain("Last 7 days");
  });

  test("the segment filter changes the overview only", async () => {
    const el = await make();
    await rolled(el, "1,200");
    trigger(el, "Segment").click();
    await settle(el);
    [...el.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent!.includes("Pro"))!.click();
    await settle(el);
    expect(trigger(el, "Segment").textContent).toContain("Pro");
    await expect.poll(() => el.querySelector(".ui-kb__overview .ui-kb__figure b")!.textContent).toBe("$6.00");
    expect(orders(el)).toBe("1,200");
  });

  test("keyboard: arrows open with a ring on the active option, the pointer takes it away, Escape keeps focus on the trigger", async () => {
    const el = await make();
    const t = trigger(el, "Date range");
    const pick = t.parentElement!;
    t.focus();
    key(t, "ArrowDown");
    await settle(el);
    expect(t.getAttribute("aria-expanded")).toBe("true");
    expect(pick.hasAttribute("data-keys")).toBe(true);
    key(t, "ArrowDown");
    await settle(el);
    const active = el.querySelector('[role="option"][data-active]')!;
    expect(t.getAttribute("aria-activedescendant")).toBe(active.id);
    el.querySelectorAll('[role="option"]')[0].dispatchEvent(new PointerEvent("pointerenter"));
    await settle(el);
    expect(pick.hasAttribute("data-keys")).toBe(false);
    key(t, "Escape");
    await settle(el);
    expect(t.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(t);
    // Enter picks the active option
    key(t, "ArrowDown");
    await settle(el);
    key(t, "End");
    key(t, "Enter");
    await settle(el);
    expect(trigger(el, "Date range").textContent).toContain("Last 30 days");
    expect(document.activeElement).toBe(trigger(el, "Date range"));
  });

  test("a press outside closes the picker", async () => {
    const el = await make();
    trigger(el, "Date range").click();
    await settle(el);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle(el);
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

  test("the day under the pointer: a dot, a tag with the value and the date on the axis; the overview tooltip compares periods", async () => {
    const el = await make();
    const plot = el.querySelector<HTMLElement>(".ui-kb__stat .ui-kb__plot")!;
    const box = plot.getBoundingClientRect();
    plot.dispatchEvent(new PointerEvent("pointermove", { clientX: box.right - 1, clientY: box.top + 5, pointerType: "mouse", bubbles: true }));
    await settle(el);
    expect(el.querySelector(".ui-kb__stat .ui-kb__tag")!.textContent).toContain("3 Oct");
    expect(el.querySelector(".ui-kb__stat .ui-kb__axis-tag")!.textContent).toBe("3 Oct");
    plot.dispatchEvent(new PointerEvent("pointerleave"));
    await settle(el);
    expect(el.querySelector(".ui-kb__tag")).toBeNull();
    const big = el.querySelector<HTMLElement>(".ui-kb__overview .ui-kb__plot")!;
    const b = big.getBoundingClientRect();
    big.dispatchEvent(new PointerEvent("pointermove", { clientX: b.left + 1, clientY: b.top + 5, pointerType: "mouse", bubbles: true }));
    await settle(el);
    const tip = el.querySelector(".ui-kb__tip")!;
    expect(tip.textContent).toContain("1 Oct");
    expect(tip.textContent).toContain("This period");
    expect(tip.textContent).toContain("$300.00");
    expect(tip.textContent).toContain("$200.00");
  });

  test("Set up and the action are library buttons that call back and fire events; the soft legend number has its swatch label", async () => {
    let setup = 0;
    let action = 0;
    const el = await make({ setup: { label: "Set up", onClick: () => setup++ }, action: { label: "View report", onClick: () => action++ } });
    const events: string[] = [];
    el.addEventListener("tc-setup", () => events.push("setup"));
    el.addEventListener("tc-action", () => events.push("action"));
    const setUp = el.querySelector<HTMLElement>(".ui-kb__setup")!;
    const view = el.querySelector<HTMLElement>(".ui-kb__action")!;
    expect(setUp.tagName).toBe("TC-BUTTON");
    expect(setUp.getAttribute("variant")).toBe("secondary");
    expect(view.tagName).toBe("TC-BUTTON");
    setUp.querySelector("button")!.click();
    view.querySelector("button")!.click();
    expect([setup, action]).toEqual([1, 1]);
    expect(events).toEqual(["setup", "action"]);
    expect(el.querySelector('.ui-kb__legend span[data-soft=""]')!.textContent).toBe("Last period");
  });

  test("bad data: no data shows only the bar; empty series and missing previous don't break it", async () => {
    const el = await fixture<TcKpiBoard>(html`<tc-kpi-board></tc-kpi-board>`);
    expect(el.querySelector(".ui-kb__card")).toBeNull();
    el.data = {
      x: { stats: [{ id: "a", label: "A", labels: [], values: [] }], overview: { title: "O", labels: [], current: [], previous: [] }, focus: { title: "F", metric: "M", labels: [], values: [], previous: 0 } },
    };
    await settle(el);
    expect(el.querySelectorAll(".ui-kb__card")).toHaveLength(3);
    await expect.poll(() => el.querySelector(".ui-kb__stat b")!.textContent).toBe("$0.00");
  });

  test("narrow: every card takes the full row", async () => {
    const w = await fixture(html`<div style="width: 380px"><tc-kpi-board .data=${DATA} .ranges=${RANGES}></tc-kpi-board></div>`);
    const el = w.querySelector("tc-kpi-board")!;
    const cards = [...el.querySelectorAll<HTMLElement>(".ui-kb__card")];
    const width = el.getBoundingClientRect().width;
    expect(cards.every((c) => Math.abs(c.getBoundingClientRect().width - width) < 2)).toBe(true);
  });

  test("React wrapper: numbers roll through the DOM, not through React renders; an uncontrolled range moves and reports", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    host.style.width = "1100px";
    document.body.append(host);
    const root = createRoot(host);
    let commits = 0;
    const picked: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(
          Profiler,
          { id: "kb", onRender: () => commits++ },
          React.createElement(KpiBoard, { data: DATA, ranges: RANGES, defaultRange: "7d", onRangeChange: (id: string) => void picked.push(id), icon: React.createElement("svg", { "data-icon": "" }) }),
        ),
      ),
    );
    await settle();
    const el = host.querySelector("tc-kpi-board")!;
    const before = commits;
    await rolled(el, "1,200");
    // The staged icon renders once more when its DOM node is picked up – never once per frame
    expect(commits - before).toBeLessThanOrEqual(1);
    await expect.poll(() => el.querySelector(".ui-kb__icon [data-icon]")).toBeTruthy();
    trigger(el, "Date range").click();
    await settle();
    [...el.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent!.includes("Last 30 days"))!.click();
    await settle();
    expect(picked).toEqual(["30d"]);
    await rolled(el, "2,400");
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled range reports a pick without moving", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picked: string[] = [];
    await act(async () => root.render(React.createElement(KpiBoard, { data: DATA, ranges: RANGES, range: "7d", onRangeChange: (id: string) => void picked.push(id) })));
    await settle();
    const el = host.querySelector("tc-kpi-board")!;
    trigger(el, "Date range").click();
    await settle();
    [...el.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent!.includes("Last 30 days"))!.click();
    await settle();
    expect(picked).toEqual(["30d"]);
    expect(trigger(el, "Date range").textContent).toContain("Last 7 days");
    await act(async () => root.unmount());
  });

  test("the block: className and DOM props reach the element, which is its ref; setup's onClick runs", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const ref = React.createRef<HTMLDivElement>();
    let setup = 0;
    await act(async () =>
      root.render(React.createElement(KpiBoardBlock, { ref, className: "mine", ...({ "data-x": "1" } as object), data: DATA, ranges: RANGES, setup: { label: "Set up", onClick: () => setup++ } })),
    );
    await settle();
    const el = host.querySelector("tc-kpi-board")!;
    expect(ref.current).toBe(el);
    expect(el.classList.contains("mine") && el.classList.contains("ui-kb")).toBe(true);
    expect(el.getAttribute("data-x")).toBe("1");
    el.querySelector<HTMLElement>(".ui-kb__setup button")!.click();
    expect(setup).toBe(1);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="width: 1100px; padding: 16px; background: var(--tc-surface-base)">
        <tc-kpi-board heading="Overview" .data=${DATA} .ranges=${RANGES} .segments=${SEGMENTS} .setup=${{ label: "Set up" }} .action=${{ label: "View report" }}></tc-kpi-board>
        <tc-kpi-board look="clean" .data=${DATA} .ranges=${RANGES}></tc-kpi-board>
      </div>`);
      await finish(wrap);
      await expect.poll(() => orders(wrap.querySelector("tc-kpi-board")!), { timeout: 3000 }).toBe("1,200");
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

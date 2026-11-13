/*
 * <tc-spend-breakdown> in real browsers: slices by dimension with cost, share and change in words, the total, the
 * dimension, period and view switches, picking a slice, the roving keyboard, the daily and table views, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/spend-breakdown";
import { spendSlices, type SpendEntry, type SpendSliceSelect, type TcSpendBreakdown } from "../../src/elements/spend-breakdown";
import { SpendBreakdown } from "../../src/elements/react/spend-breakdown";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

/** large-1 600, small-2 300, (no model) 100 – a total of 1,000; before: large-1 500, small-2 300 */
const ENTRIES: SpendEntry[] = [
  { date: "2026-11-01", cost: 400, by: { model: "large-1", feature: "Invoice matcher", team: "Audit" } },
  { date: "2026-11-02", cost: 200, by: { model: "large-1", feature: "Report drafting", team: "Research" } },
  { date: "2026-11-02", cost: 300, by: { model: "small-2", feature: "Policy Q&A", team: "Operations" } },
  { date: "2026-11-03", cost: 100, by: { feature: "Policy Q&A", team: "Operations" } },
];
const PREVIOUS: SpendEntry[] = [
  { date: "2026-10-01", cost: 500, by: { model: "large-1" } },
  { date: "2026-10-02", cost: 300, by: { model: "small-2" } },
];
const slices = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-spb__slice")];
const ids = (el: Element) => slices(el).map((s) => s.dataset.slice);
const slice = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-slice="${id}"]`)!;
const seg = (el: Element, attr: string, value: string) => el.querySelector<HTMLButtonElement>(`[data-${attr}="${value}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcSpendBreakdown>(html`<tc-spend-breakdown look=${look} locale="en-US" .entries=${ENTRIES} .previous=${PREVIOUS}></tc-spend-breakdown>`);

describe("tc-spend-breakdown", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a listbox of slices biggest first, one tab stop, cost, share and change in words, the total in the header`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("spb");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector('[role="listbox"]')!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("AI spend");
      expect(ids(el)).toEqual(["large-1", "small-2", "Unassigned"]);
      expect(el.querySelectorAll('.ui-spb__slice[tabindex="0"]')).toHaveLength(1);
      const words = (id: string) => slice(el, id).textContent!.replace(/\s+/g, " ").trim();
      expect(words("large-1")).toBe("large-1 $600, 60% of the total , Up 20%");
      expect(words("small-2")).toContain("About the same");
      expect(words("Unassigned")).toContain("New");
      expect(el.querySelector(".ui-spb__total")!.textContent!.replace(/\s+/g, " ")).toContain("$1,000Up 25% on the period before");
    });
  }

  test("spendSlices sums by dimension and gives each slice's cost before", () => {
    const s = spendSlices(ENTRIES, "team", PREVIOUS);
    expect(s.map((x) => [x.id, x.cost, x.share, x.previous])).toEqual([
      ["Audit", 400, 0.4, 0],
      ["Operations", 400, 0.4, 0],
      ["Research", 200, 0.2, 0],
    ]);
    expect(spendSlices(ENTRIES, "model")[0].previous).toBeNull();
  });

  test("the dimension switch regroups and clears the pick; tc-dimension-change is cancelable", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-dimension-change", (e) => seen.push((e as CustomEvent).detail.dimension));
    slice(el, "large-1").click();
    await settle();
    expect(el.selected).toBe("large-1");
    seg(el, "dimension", "team").click();
    await settle();
    expect(el.dimension).toBe("team");
    expect(el.selected).toBeNull();
    expect(ids(el)).toEqual(["Audit", "Operations", "Research"]);
    expect(seg(el, "dimension", "team").getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Split by team");
    el.addEventListener("tc-dimension-change", (e) => e.preventDefault());
    seg(el, "dimension", "user").click();
    await settle();
    expect(el.dimension).toBe("team");
    expect(seen).toEqual(["team", "user"]);
  });

  test("picking a slice fires tc-slice-select; again clears it; Clear clears it; preventDefault keeps it", async () => {
    const el = await make();
    const seen: SpendSliceSelect[] = [];
    el.addEventListener("tc-slice-select", (e) => seen.push((e as CustomEvent<SpendSliceSelect>).detail));
    slice(el, "small-2").click();
    await settle();
    expect(slice(el, "small-2").getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector(".ui-spb__filter")!.textContent).toContain("Filtered to small-2");
    slice(el, "small-2").click();
    await settle();
    expect(el.selected).toBeNull();
    slice(el, "large-1").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-spb__clear")!.click();
    await settle();
    expect(el.selected).toBeNull();
    expect(seen.map((d) => d.selected)).toEqual(["small-2", null, "large-1", null]);
    expect(seen[0]).toEqual({ dimension: "model", id: "small-2", selected: "small-2" });
    el.addEventListener("tc-slice-select", (e) => e.preventDefault());
    slice(el, "large-1").click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("keyboard: ↑ ↓ Home End move the tab stop; Enter and Space pick", async () => {
    const el = await make();
    slice(el, "large-1").focus();
    const at = () => (document.activeElement as HTMLElement)?.dataset.slice;
    const press = async (k: string, want: string) => {
      key(document.activeElement!, k);
      await expect.poll(at).toBe(want);
    };
    await press("ArrowDown", "small-2");
    await press("End", "Unassigned");
    await press("ArrowUp", "small-2");
    await press("Home", "large-1");
    key(document.activeElement!, "Enter");
    await settle();
    expect(el.selected).toBe("large-1");
    key(document.activeElement!, " ");
    await settle();
    expect(el.selected).toBeNull();
  });

  test("the daily view stacks each day; the table view lists every slice with a total; the period select fires tc-period-change", async () => {
    const el = await make();
    seg(el, "view", "daily").click();
    await settle();
    expect(el.view).toBe("daily");
    expect(el.querySelectorAll(".ui-spb__bar")).toHaveLength(4);
    expect(el.querySelector(".ui-spb__daily figcaption")!.textContent).toContain("The highest day was");
    seg(el, "view", "table").click();
    await settle();
    const cells = (r: Element) => [...r.children].map((c) => c.textContent!.trim());
    expect(cells(el.querySelector(".ui-spb__table tbody tr")!)).toEqual(["large-1", "$600", "60%", "Up 20%"]);
    expect(cells(el.querySelector(".ui-spb__table tfoot tr")!)).toEqual(["Total", "$1,000", "100%", "Up 25%"]);
    const periods: string[] = [];
    el.addEventListener("tc-period-change", (e) => periods.push((e as CustomEvent).detail.period));
    const select = el.querySelector<HTMLSelectElement>(".ui-spb__select")!;
    select.value = "30d";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.period).toBe("30d");
    expect(periods).toEqual(["30d"]);
  });

  test("empty: says so; narrow: rows stay inside", async () => {
    const empty = await fixture<TcSpendBreakdown>(html`<tc-spend-breakdown></tc-spend-breakdown>`);
    expect(empty.querySelector(".ui-spb__empty")).toBeTruthy();
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-spend-breakdown .entries=${ENTRIES}></tc-spend-breakdown></div>`);
    const el = wrap.querySelector("tc-spend-breakdown")!;
    for (const s of slices(el)) expect(s.getBoundingClientRect().right).toBeLessThanOrEqual(el.getBoundingClientRect().right + 1);
  });

  test("React wrapper: an uncontrolled dimension survives re-renders; a controlled pick stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(SpendBreakdown, { title: "Spend", entries: ENTRIES, onDimensionChange: (d) => void seen.push(d), "data-n": n } as React.ComponentProps<typeof SpendBreakdown>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-spend-breakdown")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Spend");
    seg(el, "dimension", "feature").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.dimension).toBe("feature");
    expect(seen).toEqual(["feature"]);
    await act(async () => root.unmount());
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(SpendBreakdown, { entries: ENTRIES, selected: null, onSliceSelect: (s) => void seen.push(s) })));
    await settle();
    const el2 = host2.querySelector("tc-spend-breakdown")!;
    slice(el2, "large-1").click();
    await settle();
    expect(seen.at(-1)).toBe("large-1");
    expect(el2.selected).toBeNull();
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look and every view`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-spend-breakdown .entries=${ENTRIES} .previous=${PREVIOUS} selected="small-2"></tc-spend-breakdown>
        <tc-spend-breakdown look="clean" view="daily" .entries=${ENTRIES}></tc-spend-breakdown>
        <tc-spend-breakdown look="clean" view="table" .entries=${ENTRIES} .previous=${PREVIOUS}></tc-spend-breakdown>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

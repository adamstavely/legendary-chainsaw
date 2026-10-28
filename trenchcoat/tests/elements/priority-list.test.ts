/*
 * <tc-priority-list> in real browsers: rows with priority, health, momentum, coverage, open and work, the health
 * filters, grouping by priority, the row keyboard, controlled use, narrow layouts, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/priority-list";
import type { PriorityFilter, PriorityFilterChange, PriorityItem, PriorityOpen, TcPriorityList } from "../../src/elements/priority-list";
import { PriorityList } from "../../src/elements/react/priority-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: PriorityItem[] = [
  { id: "climate", name: "Climate Resilience", owner: "Arjun Mehta", team: "Climate", priority: 2, health: "at-risk", trend: [9, 8, 7], change: -0.14, coverage: 0.33, open: 5, work: 3 },
  { id: "neuro", name: "Neuromorphic Computing", owner: "Marcus Okonkwo", priority: 1, health: "at-risk", trend: [7, 6.5], change: -0.08, coverage: 0.42, open: 1, work: 4 },
  { id: "carbon", name: "Carbon-Negative Materials", priority: 1, health: "on-track", trend: [6, 7], change: 0.12, coverage: 0.71, open: 0, work: 5 },
  { id: "edge", name: "Edge AI", priority: 4, health: "watch", change: 0, coverage: 0.58 },
];

const row = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-row="${id}"]`)!;
const ids = (el: Element) => [...el.querySelectorAll<HTMLElement>("[data-row]")].map((r) => r.dataset.row);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard", extra: Partial<TcPriorityList> = {}) =>
  fixture<TcPriorityList>(html`<tc-priority-list look=${look} description="This quarter." .items=${ITEMS} .grouped=${extra.grouped ?? false} .filter=${extra.filter ?? "all"}></tc-priority-list>`);

describe("tc-priority-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: one row per item in order, one tab stop, each reading the whole row`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("prl");
      expect(el.dataset.look).toBe(look);
      expect(ids(el)).toEqual(["climate", "neuro", "carbon", "edge"]);
      expect(el.querySelectorAll('[data-row][tabindex="0"]')).toHaveLength(1);
      const text = row(el, "climate").textContent!.replace(/\s+/g, " ");
      expect(text).toContain("Priority 2, High.");
      expect(text).toContain("Arjun Mehta · Climate");
      expect(text).toContain("At risk");
      expect(text).toContain("Momentum down 14%");
      expect(text).toContain("Coverage 33%");
      expect(text).toContain("5 gaps");
      expect(text).toContain("3 work items");
    });
  }

  test("momentum: a line when there's a trend, the change's direction and tone; coverage low below the threshold; open pill wording", async () => {
    const el = await make();
    expect(row(el, "climate").querySelector(".ui-prl__spark polyline")).toBeTruthy();
    expect(row(el, "edge").querySelector(".ui-prl__spark")).toBeNull();
    expect(row(el, "climate").querySelector<HTMLElement>(".ui-prl__momentum")!.dataset.dir).toBe("down");
    expect(row(el, "carbon").querySelector<HTMLElement>(".ui-prl__momentum")!.dataset.dir).toBe("up");
    expect(row(el, "edge").querySelector<HTMLElement>(".ui-prl__momentum")!.dataset.dir).toBe("flat");
    expect(row(el, "edge").textContent).toContain("Momentum steady");
    expect(getComputedStyle(row(el, "climate").querySelector(".ui-prl__change")!).color).not.toBe(getComputedStyle(row(el, "carbon").querySelector(".ui-prl__change")!).color);
    expect(row(el, "climate").querySelector(".ui-prl__bar-fill")!.hasAttribute("data-low")).toBe(true);
    expect(row(el, "carbon").querySelector(".ui-prl__bar-fill")!.hasAttribute("data-low")).toBe(false);
    expect(row(el, "carbon").querySelector(".ui-prl__open")!.hasAttribute("data-none")).toBe(true);
    el.openUnitOne = "gap";
    await settle();
    expect(row(el, "neuro").querySelector(".ui-prl__open")!.textContent).toContain("1 gap");
    expect(row(el, "neuro").querySelector(".ui-prl__open")!.textContent).not.toContain("gaps");
    // The top tier's badge is in ink
    expect(row(el, "neuro").querySelector<HTMLElement>(".ui-prl__badge")!.dataset.priority).toBe("1");
  });

  test("filters count each health; pressing one filters, pressing it again shows all; tc-filter-change fires", async () => {
    const el = await make();
    const seen: PriorityFilter[] = [];
    el.addEventListener("tc-filter-change", (e) => seen.push((e as CustomEvent<PriorityFilterChange>).detail.filter));
    const chip = (h: string) => el.querySelector<HTMLButtonElement>(`[data-filter="${h}"]`)!;
    expect(chip("at-risk").textContent!.replace(/\s+/g, " ").trim()).toBe("2 at risk");
    expect(chip("watch").textContent!.replace(/\s+/g, " ").trim()).toBe("1 watch");
    chip("at-risk").click();
    await settle();
    expect(ids(el)).toEqual(["climate", "neuro"]);
    expect(chip("at-risk").getAttribute("aria-pressed")).toBe("true");
    chip("at-risk").click();
    await settle();
    expect(ids(el)).toHaveLength(4);
    expect(seen).toEqual(["at-risk", "all"]);
  });

  test("grouped: rows under a header per priority, in priority order, each counting what's at risk", async () => {
    const el = await make("standard", { grouped: true });
    const heads = [...el.querySelectorAll(".ui-prl__group-head")].map((h) => h.textContent!.replace(/\s+/g, " ").trim());
    expect(heads).toEqual(["1 Top priority 2 1 at risk", "2 High 1 1 at risk", "4 Watching 1"]);
    expect(ids(el)).toEqual(["neuro", "carbon", "climate", "edge"]);
    expect(el.querySelectorAll('[data-row][tabindex="0"]')).toHaveLength(1);
    el.tiers = { 1: "Flagship" };
    await settle();
    expect(el.querySelector(".ui-prl__group-name")!.textContent).toBe("Flagship");
  });

  test("keyboard: ↑ ↓ Home End move one tab stop across groups; Enter or a click fires tc-open", async () => {
    const el = await make("standard", { grouped: true });
    const opened: string[] = [];
    el.addEventListener("tc-open", (e) => opened.push((e as CustomEvent<PriorityOpen>).detail.id));
    row(el, "neuro").focus();
    key(row(el, "neuro"), "ArrowDown");
    await expect.poll(() => document.activeElement?.getAttribute("data-row")).toBe("carbon");
    key(document.activeElement!, "ArrowDown");
    await expect.poll(() => document.activeElement?.getAttribute("data-row")).toBe("climate");
    key(document.activeElement!, "End");
    await expect.poll(() => document.activeElement?.getAttribute("data-row")).toBe("edge");
    key(document.activeElement!, "Home");
    await expect.poll(() => document.activeElement?.getAttribute("data-row")).toBe("neuro");
    expect(row(el, "neuro").getAttribute("tabindex")).toBe("0");
    row(el, "carbon").click();
    expect(opened).toEqual(["carbon"]);
  });

  test("controlled: preventDefault() keeps the filter; a filter whose health is gone resets to all; empty text", async () => {
    const el = await make("standard", { filter: "watch" });
    el.addEventListener("tc-filter-change", (e) => e.preventDefault());
    expect(ids(el)).toEqual(["edge"]);
    el.querySelector<HTMLButtonElement>('[data-filter="at-risk"]')!.click();
    await settle();
    expect(el.filter).toBe("watch");
    el.items = ITEMS.filter((i) => i.health !== "watch");
    await settle();
    expect(el.filter).toBe("all");
    el.items = [];
    await settle();
    expect(el.querySelector(".ui-prl__empty")!.textContent).toBe("Nothing to show.");
  });

  test("narrow: the momentum line and work count fold away; the row stays one line per item", async () => {
    const wrap = await fixture(html`<div style="width: 360px"><tc-priority-list .items=${ITEMS}></tc-priority-list></div>`);
    const el = wrap.querySelector("tc-priority-list")!;
    await settle();
    expect(getComputedStyle(row(el, "climate").querySelector(".ui-prl__spark")!).display).toBe("none");
    expect(getComputedStyle(row(el, "climate").querySelector(".ui-prl__work")!).display).toBe("none");
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React wrapper: an uncontrolled filter survives parent re-renders; onOpen gets the item", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(PriorityList, {
        title: "Topics",
        items: ITEMS,
        onFilterChange: (f) => void seen.push(f),
        onOpen: (id, item) => void seen.push([id, item.name]),
        "data-n": n,
      } as React.ComponentProps<typeof PriorityList>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-priority-list")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Topics");
    el.querySelector<HTMLButtonElement>('[data-filter="on-track"]')!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(ids(el)).toEqual(["carbon"]);
    row(el, "carbon").click();
    expect(seen).toEqual(["on-track", ["carbon", "Carbon-Negative Materials"]]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled filter stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: PriorityFilter[] = [];
    await act(async () => root.render(React.createElement(PriorityList, { items: ITEMS, filter: "all", onFilterChange: (f) => void asked.push(f) })));
    await settle();
    const el = host.querySelector("tc-priority-list")!;
    el.querySelector<HTMLButtonElement>('[data-filter="watch"]')!.click();
    await settle();
    expect(asked).toEqual(["watch"]);
    expect(ids(el)).toHaveLength(4);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-priority-list description="This quarter." .items=${ITEMS}></tc-priority-list>
        <tc-priority-list look="clean" grouped .items=${ITEMS}></tc-priority-list>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

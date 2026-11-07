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
import type { PriorityFigureColumn, PriorityFilter, PriorityFilterChange, PriorityItem, PriorityOpen, TcPriorityList } from "../../src/elements/priority-list";
import { PriorityList } from "../../src/elements/react/priority-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: PriorityItem[] = [
  { id: "climate", name: "Climate Resilience", owner: "Arjun Mehta", team: "Climate", priority: 2, health: "at-risk", trend: [9, 8, 7], change: -0.14, coverage: 0.33, open: 5, work: 3 },
  { id: "neuro", name: "Neuromorphic Computing", owner: "Marcus Okonkwo", priority: 1, health: "at-risk", trend: [7, 6.5], change: -0.08, coverage: 0.42, open: 1, work: 4 },
  { id: "carbon", name: "Carbon-Negative Materials", priority: 1, health: "on-track", trend: [6, 7], change: 0.12, coverage: 0.71, open: 0, work: 5 },
  { id: "edge", name: "Edge AI", priority: 4, health: "watch", change: 0, coverage: 0.58 },
];

// Centres: no tier, a code in the badge, and papers last month and this
const FIGURES: PriorityFigureColumn[] = [
  { id: "last", label: "Last mo." },
  { id: "this", label: "This mo.", unit: "pp" },
];
const CENTRES: PriorityItem[] = [
  { id: "energy", name: "Energy & Climate", badge: "CEC", owner: "Sofia Almeida", health: "watch", coverage: 0.33, open: 6, work: 4, change: -0.02, figures: { last: 1, this: 0 } },
  { id: "bio", name: "Biosciences", badge: "BIO", health: "on-track", coverage: 0.8, figures: { last: 1200 } },
];

const row = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-row="${id}"]`)!;
/** What a screen reader reads from a row: its text without the parts hidden from it */
const said = (el: Element) => {
  const copy = el.cloneNode(true) as Element;
  copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  return copy.textContent!.replace(/\s+/g, " ").replace(/ ([.,])/g, "$1").trim();
};
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

  test("figures: one column each after Work, in order, right-aligned under their headings; missing values are empty", async () => {
    const wrap = await fixture(html`<div style="width: 900px"><tc-priority-list locale="en" .items=${[...ITEMS, ...CENTRES]} .figures=${FIGURES}></tc-priority-list></div>`);
    const el = wrap.querySelector("tc-priority-list")!;
    await finish(el);
    const heads = [...el.querySelectorAll<HTMLElement>(".ui-prl__columns > *")];
    expect(heads.map((h) => h.textContent!.trim())).toEqual(["Topic", "Momentum", "Coverage", "Open", "Work", "Last mo.", "This mo."]);
    const cells = (id: string) => [...row(el, id).querySelectorAll<HTMLElement>(".ui-prl__fig")];
    expect(cells("energy").map((c) => c.dataset.fig)).toEqual(["last", "this"]);
    expect(cells("energy").map((c) => c.querySelector("[aria-hidden]")!.textContent)).toEqual(["1", "0·pp"]);
    expect(cells("bio").map((c) => c.textContent!.trim())).toEqual([". 1,200 Last mo.1,200", ""]);
    expect(cells("climate").map((c) => c.textContent!.trim())).toEqual(["", ""]);
    expect(said(row(el, "energy"))).toMatch(/\. 4 work items\. 1 Last mo\.\. 0 This mo\.$/);
    expect(said(row(el, "bio"))).toMatch(/Coverage 80%\. 1,200 Last mo\.$/);
    // Header and every row share the same tracks: each heading's right edge is its cells' right edge
    for (const [i, col] of FIGURES.entries()) {
      const head = el.querySelector<HTMLElement>(`.ui-prl__col--fig[data-fig="${col.id}"]`)!.getBoundingClientRect();
      for (const id of ["climate", "energy", "bio"]) {
        const cell = cells(id)[i].getBoundingClientRect();
        expect(Math.abs(cell.right - head.right), `${col.id} in ${id}`).toBeLessThanOrEqual(1);
      }
    }
    expect(getComputedStyle(cells("energy")[0]).fontVariantNumeric).toContain("tabular-nums");
    const work = row(el, "energy").querySelector(".ui-prl__work")!.getBoundingClientRect();
    expect(cells("energy")[0].getBoundingClientRect().left).toBeGreaterThan(work.right);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("a row with no priority shows its code in a neutral badge and reads it instead of a tier; filters count it", async () => {
    const el = await fixture<TcPriorityList>(html`<tc-priority-list heading="Centres" name-label="Centre" .items=${[...CENTRES, ITEMS[1]]}></tc-priority-list>`);
    const badge = row(el, "energy").querySelector<HTMLElement>(".ui-prl__badge")!;
    expect(badge.textContent).toBe("CEC");
    expect(badge.hasAttribute("data-priority")).toBe(false);
    expect(badge.getAttribute("aria-hidden")).toBe("true");
    expect(said(row(el, "energy"))).toMatch(/^CEC\. Energy & Climate Sofia Almeida\. Watch/);
    expect(said(row(el, "energy"))).not.toContain("Priority");
    expect(row(el, "neuro").textContent).toContain("Priority 1, Top priority.");
    expect(getComputedStyle(badge).backgroundColor).not.toBe(getComputedStyle(row(el, "neuro").querySelector(".ui-prl__badge")!).backgroundColor);
    // The code fits its column, which every row and the headings share
    const cell = row(el, "energy").querySelector<HTMLElement>(".ui-prl__cell--badge")!.getBoundingClientRect();
    expect(badge.getBoundingClientRect().right).toBeLessThanOrEqual(cell.right + 0.5);
    expect(row(el, "neuro").querySelector<HTMLElement>(".ui-prl__cell--badge")!.getBoundingClientRect().width).toBeCloseTo(cell.width, 0);
    expect(el.querySelector(".ui-prl__col--name")!.getBoundingClientRect().left).toBeCloseTo(cell.left, 0);
    expect(el.querySelector('[data-filter="watch"] .ui-prl__filter-count')!.textContent).toBe("1");
    el.querySelector<HTMLButtonElement>('[data-filter="watch"]')!.click();
    await settle();
    expect(ids(el)).toEqual(["energy"]);
  });

  test("grouped with rows that have no priority: the tiers first, then those rows under no header, in one keyboard order", async () => {
    const el = await fixture<TcPriorityList>(html`<tc-priority-list grouped .items=${[CENTRES[0], ...ITEMS, CENTRES[1]]}></tc-priority-list>`);
    const heads = [...el.querySelectorAll(".ui-prl__group-head")].map((h) => h.textContent!.replace(/\s+/g, " ").trim());
    expect(heads).toEqual(["1 Top priority 2 1 at risk", "2 High 1 1 at risk", "4 Watching 1"]);
    expect(ids(el)).toEqual(["neuro", "carbon", "climate", "edge", "energy", "bio"]);
    const rest = el.querySelector(".ui-prl__group--none")!;
    expect(rest.querySelector(".ui-prl__group-head")).toBeNull();
    expect([...rest.querySelectorAll<HTMLElement>("[data-row]")].map((r) => r.dataset.row)).toEqual(["energy", "bio"]);
    row(el, "neuro").focus();
    key(row(el, "neuro"), "End");
    await settle();
    expect(document.activeElement).toBe(row(el, "bio"));
    key(row(el, "bio"), "ArrowUp");
    await settle();
    expect(document.activeElement).toBe(row(el, "energy"));
    key(row(el, "energy"), "ArrowUp");
    await settle();
    expect(document.activeElement).toBe(row(el, "edge"));
  });

  for (const width of [300, 400, 600]) {
    test(`at ${width}px the name keeps at least 140px, with or without figures; the rest folds away instead`, async () => {
      for (const figures of [[], FIGURES]) {
        for (const look of ["standard", "clean"] as const) {
          const wrap = await fixture(html`<div style=${`width: ${width}px`}><tc-priority-list look=${look} .items=${[...ITEMS, ...CENTRES]} .figures=${figures}></tc-priority-list></div>`);
          const el = wrap.querySelector("tc-priority-list")!;
          await settle();
          for (const id of ["climate", "energy"]) {
            const who = row(el, id).querySelector(".ui-prl__who")!.getBoundingClientRect();
            expect(who.width, `${id}, ${look}, ${figures.length} figures`).toBeGreaterThanOrEqual(140);
            expect(row(el, id).querySelector(".ui-prl__name")!.getBoundingClientRect().width).toBeGreaterThan(0);
          }
          // The headings still line up with the rows
          const name = el.querySelector(".ui-prl__col--name")!.getBoundingClientRect();
          expect(name.left).toBeCloseTo(row(el, "climate").querySelector(".ui-prl__cell--badge")!.getBoundingClientRect().left, 0);
          expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
          wrap.remove();
        }
      }
    });
  }

  test("narrow with figures: the work count goes first, then the figures, and the row still fits", async () => {
    const wrap = await fixture(html`<div style="width: 580px"><tc-priority-list .items=${CENTRES} .figures=${FIGURES}></tc-priority-list></div>`);
    const el = wrap.querySelector("tc-priority-list")!;
    await settle();
    const shown = (sel: string) => getComputedStyle(row(el, "energy").querySelector(sel)!).display !== "none";
    expect(shown(".ui-prl__work")).toBe(false);
    expect(shown(".ui-prl__fig")).toBe(true);
    expect(shown(".ui-prl__bar")).toBe(true);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
    (wrap as HTMLElement).style.width = "440px";
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    expect(shown(".ui-prl__fig")).toBe(false);
    expect(getComputedStyle(el.querySelector(".ui-prl__col--fig")!).display).toBe("none");
    expect(shown(".ui-prl__bar")).toBe(true);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
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
        <tc-priority-list heading="Centres" grouped .items=${[...ITEMS, ...CENTRES]} .figures=${FIGURES}></tc-priority-list>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

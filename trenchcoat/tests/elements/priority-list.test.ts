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

  test("figures: a column's width fits a longer heading, taken from the name column; header and rows share it", async () => {
    const wide = [
      { id: "last", label: "Last month", width: 88 },
      { id: "this", label: "This month", width: 88 },
    ];
    const wrap = await fixture(html`<div style="width: 460px"><tc-priority-list locale="en" keep-trend-line .hide=${["coverage", "open", "work", "health"]} .items=${CENTRES} .figures=${wide}></tc-priority-list></div>`);
    const el = wrap.querySelector("tc-priority-list")!;
    await finish(el);
    const heads = [...el.querySelectorAll<HTMLElement>(".ui-prl__col--fig")];
    for (const h of heads) {
      expect(Math.round(h.getBoundingClientRect().width)).toBe(88);
      // The heading fits on one line, unclipped
      expect(h.scrollWidth).toBeLessThanOrEqual(h.clientWidth + 1);
    }
    for (const [i, h] of heads.entries()) {
      const cell = row(el, CENTRES[0].id).querySelectorAll<HTMLElement>(".ui-prl__fig")[i].getBoundingClientRect();
      expect(Math.abs(cell.right - h.getBoundingClientRect().right)).toBeLessThanOrEqual(1);
    }
    // The momentum line keeps its track; the name gave up the room
    expect(Math.round(el.querySelector<HTMLElement>(".ui-prl__col--momentum")!.getBoundingClientRect().width)).toBe(108);
    // Nothing overflows: the frame past the edge is clipped, and the row ends inside the list
    expect((wrap as HTMLElement).scrollWidth).toBeLessThanOrEqual((wrap as HTMLElement).clientWidth + 1);
    expect(row(el, CENTRES[0].id).getBoundingClientRect().right).toBeLessThanOrEqual(el.getBoundingClientRect().right + 1);
    // Unset, a column is 56px as before; a bad width is ignored
    el.figures = [{ id: "last", label: "Last mo." }, { id: "this", label: "This mo.", width: -4 }];
    await finish(el);
    expect([...el.querySelectorAll<HTMLElement>(".ui-prl__col--fig")].map((h) => Math.round(h.getBoundingClientRect().width))).toEqual([56, 56]);
  });

  test("figures centered, and name-align=center: values sit centered under their headings, names under theirs", async () => {
    const codes = CENTRES.map((c) => ({ ...c, name: c.badge ?? c.name, badge: undefined }));
    const centered = [
      { id: "last", label: "Last month", width: 88, align: "center" as const },
      { id: "this", label: "This month", width: 88, align: "center" as const },
    ];
    const wrap = await fixture(html`<div style="width: 460px"><tc-priority-list locale="en" name-align="center" name-label="Center" keep-trend-line .hide=${["coverage", "open", "work", "health"]} .items=${codes} .figures=${centered}></tc-priority-list></div>`);
    const el = wrap.querySelector("tc-priority-list")!;
    await finish(el);
    const mid = (r: DOMRect) => (r.left + r.right) / 2;
    const text = (e: Element) => {
      const range = document.createRange();
      range.selectNodeContents(e);
      return range.getBoundingClientRect();
    };
    for (const [i, h] of [...el.querySelectorAll<HTMLElement>(".ui-prl__col--fig")].entries()) {
      for (const c of codes) {
        const value = row(el, c.id).querySelectorAll<HTMLElement>(".ui-prl__fig")[i].querySelector("[aria-hidden]");
        // Biosciences has no figure this month
        if (value) expect(Math.abs(mid(text(value)) - mid(text(h)))).toBeLessThanOrEqual(1);
      }
    }
    const head = text(el.querySelector(".ui-prl__col--name")!);
    for (const c of codes) expect(Math.abs(mid(text(row(el, c.id).querySelector(".ui-prl__name")!)) - mid(head))).toBeLessThanOrEqual(1);
    // By default, names start their column and values end theirs
    el.nameAlign = "start";
    el.figures = centered.map(({ align: _, ...c }) => c);
    await finish(el);
    const h = el.querySelector<HTMLElement>(".ui-prl__col--fig")!.getBoundingClientRect();
    expect(Math.abs(text(row(el, codes[0].id).querySelector(".ui-prl__fig [aria-hidden]")!).right - h.right)).toBeLessThanOrEqual(1);
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

  test("badgeImage shows a logo in place of the code, which stays as screen-reader text; no image, or one that fails, shows the code", async () => {
    const LOGO = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="teal"/></svg>');
    const items: PriorityItem[] = [
      { id: "logo", name: "Air Force Materiel", badge: "AFMC", badgeImage: LOGO, health: "on-track" },
      { id: "broken", name: "Expeditionary", badge: "EAPMC", badgeImage: "/no-such-logo-404.png", health: "watch" },
      { id: "unsafe", name: "Unsafe", badge: "UNS", badgeImage: "javascript:alert(1)", health: "watch" },
      { id: "plain", name: "Plain", badge: "PLN", health: "on-track" },
    ];
    const el = await fixture<TcPriorityList>(html`<tc-priority-list heading="Centres" .items=${items}></tc-priority-list>`);
    const img = row(el, "logo").querySelector<HTMLImageElement>(".ui-prl__badge-img")!;
    expect(img).toBeTruthy();
    expect(img.getAttribute("alt")).toBe("");
    expect(img.getAttribute("src")).toBe(LOGO);
    expect(row(el, "logo").querySelector(".ui-prl__badge--code")).toBeNull();
    expect(row(el, "logo").querySelector(".ui-prl__sr")!.textContent).toBe("AFMC. ");
    await expect.poll(() => img.complete && img.naturalWidth > 0).toBe(true);
    expect(img.getBoundingClientRect().height).toBe(22);
    expect(img.getBoundingClientRect().width).toBeLessThanOrEqual(row(el, "logo").querySelector(".ui-prl__cell--badge")!.getBoundingClientRect().width);
    // A logo that fails to load falls back to the code, once, without retrying
    await expect.poll(() => row(el, "broken").querySelector(".ui-prl__badge--code")?.textContent).toBe("EAPMC");
    expect(row(el, "broken").querySelector(".ui-prl__badge-img")).toBeNull();
    el.items = [...el.items];
    await settle();
    expect(row(el, "broken").querySelector(".ui-prl__badge-img")).toBeNull();
    // An unsafe URL, or none, shows the code
    expect(row(el, "unsafe").querySelector(".ui-prl__badge-img")).toBeNull();
    expect(row(el, "unsafe").querySelector(".ui-prl__badge--code")!.textContent).toBe("UNS");
    expect(row(el, "plain").querySelector(".ui-prl__badge--code")!.textContent).toBe("PLN");
  });

  test("badge codes up to five letters show whole, wide and narrow", async () => {
    const items: PriorityItem[] = ["AFMC", "EAPMC", "WCPMC", "CCI"].map((code) => ({ id: code, name: `${code} centre`, badge: code, health: "on-track" }));
    const wrap = await fixture(html`<div style="width: 820px"><tc-priority-list .items=${items}></tc-priority-list></div>`);
    const el = wrap.querySelector("tc-priority-list")!;
    const clipped = () => [...el.querySelectorAll<HTMLElement>(".ui-prl__badge--code")].filter((b) => b.scrollWidth > b.clientWidth + 0.5).map((b) => b.textContent);
    expect(clipped()).toEqual([]);
    (wrap as HTMLElement).style.width = "360px";
    await settle();
    expect(clipped()).toEqual([]);
  });

  test("momentum-label renames the momentum column, and what screen readers hear before each change", async () => {
    const el = await fixture<TcPriorityList>(html`<tc-priority-list momentum-label="Trend" .items=${ITEMS}></tc-priority-list>`);
    expect(el.querySelector(".ui-prl__col--momentum")!.textContent!.trim()).toBe("Trend");
    expect(el.querySelector(".ui-prl__change .ui-prl__sr")!.textContent).toMatch(/^\. Trend /);
  });

  test("hide health leaves the health word out from under each name; screen readers still hear it", async () => {
    const items = ITEMS.map(({ owner: _o, team: _t, ...rest }) => rest);
    const el = await fixture<TcPriorityList>(html`<tc-priority-list hide="health" .items=${items}></tc-priority-list>`);
    expect(el.hide).toEqual(["health"]);
    expect(el.querySelector(".ui-prl__health")).toBeNull();
    expect(el.querySelector(".ui-prl__meta")).toBeNull();
    const who = el.querySelector(".ui-prl__who")!;
    expect(who.querySelector(".ui-prl__sr")!.textContent).toMatch(/^\. (At risk|Watch|On track)$/);
    // The columns are untouched
    expect(el.querySelector(".ui-prl__col--momentum")).not.toBeNull();
  });

  test("hide leaves columns out of the header, the rows and the grid; the name and figures take the room", async () => {
    const wrap = await fixture(html`<div style="width: 820px"><tc-priority-list hide="coverage open work" .items=${CENTRES} .figures=${FIGURES}></tc-priority-list></div>`);
    const el = wrap.querySelector<TcPriorityList>("tc-priority-list")!;
    expect(el.hide).toEqual(["coverage", "open", "work"]);
    for (const c of ["coverage", "open", "work"]) {
      expect(el.querySelector(`.ui-prl__col--${c}`), c).toBeNull();
    }
    expect(el.querySelector(".ui-prl__coverage, .ui-prl__open-cell, .ui-prl__work")).toBeNull();
    expect(el.querySelector(".ui-prl__col--momentum")).not.toBeNull();
    // The tracks: badge, name, momentum, then one per figure – nothing for the hidden columns
    const r = row(el, CENTRES[0].id);
    const tracks = getComputedStyle(r).gridTemplateColumns.split(" ");
    expect(tracks).toHaveLength(3 + FIGURES.length);
    expect(getComputedStyle(el.querySelector(".ui-prl__columns")!).gridTemplateColumns.split(" ")).toHaveLength(3 + FIGURES.length);
    // The last figure ends at the row's end: no empty gap after it
    const last = r.querySelectorAll(".ui-prl__fig");
    expect(r.getBoundingClientRect().right - last[last.length - 1].getBoundingClientRect().right).toBeLessThan(16);
    // A narrow rail: with three columns hidden, momentum and the figures still fit, and the name keeps 140px (beside a
    // code's 48px column)
    (wrap as HTMLElement).style.width = "460px";
    await settle();
    await expect.poll(() => getComputedStyle(row(el, CENTRES[0].id)).gridTemplateColumns.split(" ").length).toBe(3 + FIGURES.length);
    expect(getComputedStyle(row(el, CENTRES[0].id).querySelector(".ui-prl__fig")!).display).not.toBe("none");
    expect(row(el, CENTRES[0].id).querySelector(".ui-prl__name")!.getBoundingClientRect().width).toBeGreaterThanOrEqual(140);
    // The frame reaching past the edge is clipped: nothing scrolls around the list, and the rows end inside it
    expect((wrap as HTMLElement).scrollWidth).toBeLessThanOrEqual((wrap as HTMLElement).clientWidth + 1);
    expect(row(el, CENTRES[0].id).getBoundingClientRect().right).toBeLessThanOrEqual(el.getBoundingClientRect().right + 1);
    // Narrower: what's left still folds away, and the row fits
    (wrap as HTMLElement).style.width = "300px";
    await settle();
    await expect.poll(() => getComputedStyle(row(el, CENTRES[0].id)).gridTemplateColumns.split(" ").length).toBe(2);
    // The frame reaching past the edge is clipped: nothing scrolls around the list, and the rows end inside it
    expect((wrap as HTMLElement).scrollWidth).toBeLessThanOrEqual((wrap as HTMLElement).clientWidth + 1);
    expect(row(el, CENTRES[0].id).getBoundingClientRect().right).toBeLessThanOrEqual(el.getBoundingClientRect().right + 1);
    el.hide = [];
    await settle();
    expect(el.querySelector(".ui-prl__col--work")).not.toBeNull();
    expect(el.querySelector(".ui-prl__card")!.hasAttribute("data-hide")).toBe(false);
  });

  test("keep-trend-line at 460px, codes as names, two figures, coverage/open/work/health hidden: the line, both figures, no overflow", async () => {
    const centres: PriorityItem[] = [
      { id: "afmc", name: "AFMC", badge: "AFMC", health: "watch", trend: [4, 6, 5, 8], change: 0.12, figures: { last: 14, this: 17 } },
      { id: "eapmc", name: "EAPMC", badge: "EAPMC", health: "on-track", trend: [9, 7, 6], change: -0.2, figures: { last: 1200, this: 980 } },
    ];
    const wrap = await fixture(html`<div style="width: 460px"><tc-priority-list keep-trend-line hide="coverage open work health" .items=${centres} .figures=${FIGURES}></tc-priority-list></div>`);
    const el = wrap.querySelector<TcPriorityList>("tc-priority-list")!;
    await settle();
    expect(el.keepTrendLine).toBe(true);
    const r = row(el, "eapmc");
    const shown = (sel: string) => [...r.querySelectorAll(sel)].every((n) => getComputedStyle(n).display !== "none");
    await expect.poll(() => shown(".ui-prl__spark")).toBe(true);
    expect(r.querySelectorAll(".ui-prl__fig")).toHaveLength(2);
    expect(shown(".ui-prl__fig")).toBe(true);
    expect(r.querySelector(".ui-prl__momentum")!.getBoundingClientRect().width).toBeGreaterThanOrEqual(100);
    // Nothing overflows: the frame past the edge is clipped, and the row and its last figure end inside the list
    expect((wrap as HTMLElement).scrollWidth).toBeLessThanOrEqual((wrap as HTMLElement).clientWidth + 1);
    const figs = r.querySelectorAll(".ui-prl__fig");
    expect(r.getBoundingClientRect().right).toBeLessThanOrEqual(el.getBoundingClientRect().right + 1);
    expect(figs[1].getBoundingClientRect().right).toBeLessThanOrEqual(r.getBoundingClientRect().right + 1);
    expect(r.scrollWidth).toBeLessThanOrEqual(r.clientWidth + 1);
    // Below 400px the momentum column itself still folds away
    (wrap as HTMLElement).style.width = "300px";
    await settle();
    await expect.poll(() => getComputedStyle(row(el, "eapmc").querySelector(".ui-prl__momentum")!).display).toBe("none");
    expect((wrap as HTMLElement).scrollWidth).toBeLessThanOrEqual((wrap as HTMLElement).clientWidth + 1);
  });

  test("without keep-trend-line nothing changes: the line still folds at 460px and the tracks are as before", async () => {
    const centres: PriorityItem[] = [{ id: "afmc", name: "AFMC", badge: "AFMC", health: "watch", trend: [4, 6, 5, 8], change: 0.12, figures: { last: 14, this: 17 } }];
    const make = (keep: boolean) =>
      fixture(html`<div style="width: 460px"><tc-priority-list ?keep-trend-line=${keep} hide="coverage open work health" .items=${centres} .figures=${FIGURES}></tc-priority-list></div>`);
    const plain = (await make(false)).querySelector<TcPriorityList>("tc-priority-list")!;
    await settle();
    expect(plain.querySelector(".ui-prl__card")!.hasAttribute("data-keep-trend-line")).toBe(false);
    expect(getComputedStyle(row(plain, "afmc").querySelector(".ui-prl__spark")!).display).toBe("none");
    const before = getComputedStyle(row(plain, "afmc")).gridTemplateColumns;
    cleanup();
    const kept = (await make(true)).querySelector<TcPriorityList>("tc-priority-list")!;
    await settle();
    expect(getComputedStyle(row(kept, "afmc")).gridTemplateColumns).not.toBe(before);
  });

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

/*
 * <tc-year-list> in real browsers: the listbox and its options, years from `from` / `to` or `years`, one tab stop,
 * choosing by click and keys, moving without choosing, type-ahead, a row's arrow keys, counts, preventable changes,
 * a year that disappears, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/year-list";
import type { TcYearList, YearListSelectedChange } from "../../src/elements/year-list";
import { YearList } from "../../src/elements/react/year-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const options = (el: Element) => [...el.querySelectorAll<HTMLElement>("[role=option]")];
const stops = (el: Element) => options(el).filter((o) => o.tabIndex === 0).map((o) => o.dataset.year);
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcYearList>(html`<tc-year-list look=${look} label="Report year" .from=${2013} .to=${2026} .selected=${2024}></tc-year-list>`);

describe("tc-year-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a listbox named by its label, newest first, one tab stop on the chosen year`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("yl");
      expect(el.dataset.look).toBe(look);
      const box = el.querySelector("[role=listbox]")!;
      expect(box.getAttribute("aria-label")).toBe("Report year");
      expect(box.getAttribute("aria-orientation")).toBe("vertical");
      expect(options(el).map((o) => o.textContent!.trim())).toEqual(Array.from({ length: 14 }, (_, i) => String(2026 - i)));
      expect(options(el).filter((o) => o.getAttribute("aria-selected") === "true").map((o) => o.dataset.year)).toEqual(["2024"]);
      expect(stops(el)).toEqual(["2024"]);
    });
  }

  test("years: `years` in its own order; `from` and `to` either way round; none says so", async () => {
    const el = await fixture<TcYearList>(html`<tc-year-list .years=${[2019, 2023, 2021]}></tc-year-list>`);
    expect(el.list).toEqual([2019, 2023, 2021]);
    expect(stops(el)).toEqual(["2019"]);
    el.years = [];
    el.from = 2026;
    el.to = 2024;
    await settle();
    expect(el.list).toEqual([2026, 2025, 2024]);
    el.from = undefined;
    await settle();
    expect(el.querySelector(".ui-yl__empty")!.textContent).toBe("No years to show.");
  });

  test("click chooses; tc-selected-change, preventable; announced", async () => {
    const el = await make();
    const seen: number[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<YearListSelectedChange>).detail.selected));
    options(el)[0].click();
    await settle();
    expect(el.selected).toBe(2026);
    expect(document.activeElement).toBe(options(el)[0]);
    expect(el.querySelector("[role=status]")!.textContent).toBe("2026 chosen");
    // The chosen year again: no event
    options(el)[0].click();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault(), { once: true });
    options(el)[3].click();
    await settle();
    expect(el.selected).toBe(2026);
    expect(seen).toEqual([2026, 2023]);
  });

  test("keys: arrows and Home / End move without choosing; Enter and Space choose", async () => {
    const el = await make();
    const seen: number[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<YearListSelectedChange>).detail.selected));
    const at = () => document.activeElement as HTMLElement;
    options(el)[2].focus();
    key(at(), "ArrowDown");
    await settle();
    expect(at().dataset.year).toBe("2023");
    expect(stops(el)).toEqual(["2023"]);
    expect(el.selected).toBe(2024);
    key(at(), "ArrowUp");
    key(at(), "ArrowUp");
    await settle();
    expect(at().dataset.year).toBe("2025");
    key(at(), "End");
    await settle();
    expect(at().dataset.year).toBe("2013");
    key(at(), "ArrowDown");
    await settle();
    expect(at().dataset.year).toBe("2013");
    key(at(), "Enter");
    await settle();
    expect(el.selected).toBe(2013);
    key(at(), "Home");
    await settle();
    key(at(), " ");
    await settle();
    expect(el.selected).toBe(2026);
    expect(seen).toEqual([2013, 2026]);
  });

  test("type-ahead: a whole year, or its last digits", async () => {
    const el = await make();
    options(el)[0].focus();
    for (const d of "2019") key(document.activeElement!, d);
    await settle();
    expect((document.activeElement as HTMLElement).dataset.year).toBe("2019");
    await expect.poll(() => ((el as unknown as { typed: string }).typed), { timeout: 3000 }).toBe("");
    for (const d of "15") key(document.activeElement!, d);
    await settle();
    expect((document.activeElement as HTMLElement).dataset.year).toBe("2015");
    expect(el.selected).toBe(2024);
  });

  test("a row: ← / → move, ↑ / ↓ don't", async () => {
    const el = await fixture<TcYearList>(html`<tc-year-list orientation="horizontal" .from=${2020} .to=${2026}></tc-year-list>`);
    expect(el.querySelector("[role=listbox]")!.getAttribute("aria-orientation")).toBe("horizontal");
    options(el)[0].focus();
    key(document.activeElement!, "ArrowRight");
    await settle();
    expect((document.activeElement as HTMLElement).dataset.year).toBe("2025");
    key(document.activeElement!, "ArrowDown");
    await settle();
    expect((document.activeElement as HTMLElement).dataset.year).toBe("2025");
    const box = el.querySelector<HTMLElement>(".ui-yl__list")!;
    expect(getComputedStyle(box).display).toBe("flex");
  });

  test("counts: shown beside their years and read with count-label", async () => {
    const el = await fixture<TcYearList>(html`<tc-year-list .from=${2024} .to=${2026} .counts=${{ 2026: 1204, 2024: 7 }} count-label="reports" locale="en"></tc-year-list>`);
    expect(options(el).map((o) => o.querySelector(".ui-yl__count")?.textContent)).toEqual(["1,204 reports", undefined, "7 reports"]);
  });

  test("the tab stop on a year that disappears falls back to the chosen one", async () => {
    const el = await make();
    options(el)[0].focus();
    key(document.activeElement!, "ArrowDown");
    await settle();
    expect(stops(el)).toEqual(["2025"]);
    el.from = 2026;
    el.to = 2026;
    await settle();
    el.from = 2013;
    await settle();
    expect(stops(el)).toEqual(["2024"]);
  });

  test("React wrapper: uncontrolled keeps the choice through re-renders; controlled waits for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: (number | null)[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(YearList, { from: 2020, to: 2026, defaultSelected: 2026, onSelectedChange: (y) => void seen.push(y), "data-n": n } as React.ComponentProps<typeof YearList>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-year-list")!;
    options(el)[2].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe(2024);
    expect(seen).toEqual([2024]);
    await act(async () => root.render(React.createElement(YearList, { from: 2020, to: 2026, selected: 2026, onSelectedChange: (y) => void seen.push(y) })));
    await settle();
    const controlled = host.querySelector("tc-year-list")!;
    options(controlled)[1].click();
    await settle();
    expect(seen).toEqual([2024, 2025]);
    expect(controlled.selected).toBe(2026);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="display: grid; gap: 16px; padding: 16px; background: var(--tc-surface-base)">
        <tc-year-list label="Report year" .from=${2020} .to=${2026} .selected=${2026} .counts=${{ 2026: 41, 2025: 128 }} count-label="reports"></tc-year-list>
        <tc-year-list look="clean" label="Contribution year" .from=${2020} .to=${2026} .selected=${2024}></tc-year-list>
        <tc-year-list label="Compact" orientation="horizontal" .from=${2020} .to=${2026} .selected=${2025}></tc-year-list>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

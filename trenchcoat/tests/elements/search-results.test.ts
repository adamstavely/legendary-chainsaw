/*
 * <tc-search-results> in real browsers: grouping, marks, cutting long lines, the field and its toggles, folding, choosing,
 * the keyboard, empty states, replace, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/search-results";
import { searchResultsPattern, type SearchResultsFile, type TcSearchResults } from "../../src/elements/search-results";
import { SearchResults } from "../../src/elements/react/search-results";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const LONG = `${" ".repeat(4)}const description = "a very long line that goes on and on before it ever mentions the Freezer by name";`;
const RESULTS: SearchResultsFile[] = [
  { path: "src/lib/freezer.ts", matches: [{ line: 3, text: "export function freezerTemperature(freezer) {" }, { line: 9, text: LONG }] },
  { path: "README.md", matches: [{ line: 1, text: "# Freezer log" }] },
];
const make = (look: "standard" | "clean" = "standard", results: SearchResultsFile[] = RESULTS, query = "freezer") =>
  fixture<TcSearchResults>(html`<tc-search-results look=${look} query=${query} .results=${results}></tc-search-results>`);
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-srh__row")];
const file = (el: Element, path: string) => el.querySelector<HTMLElement>(`.ui-srh__file[title="${path}"]`)!;
const match = (el: Element, i: number) => el.querySelectorAll<HTMLElement>(".ui-srh__match")[i];
const input = (el: Element) => el.querySelector<HTMLInputElement>('.ui-srh__input[type="search"]')!;
const key = async (el: TcSearchResults, k: string, target: Element = document.activeElement!) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await el.updateComplete;
  await settle(el.parentElement!);
};

describe("tc-search-results", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: files with their matches, a summary, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("srh");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector('[role="tree"]')!.getAttribute("aria-label")).toBe("Search");
      expect(rows(el)).toHaveLength(5);
      expect(el.querySelectorAll('.ui-srh__row[tabindex="0"]')).toHaveLength(1);
      expect(el.querySelector(".ui-srh__summary")!.textContent!.trim()).toBe("3 results in 2 files");
      expect(file(el, "src/lib/freezer.ts").getAttribute("aria-expanded")).toBe("true");
      expect(file(el, "src/lib/freezer.ts").querySelector(".ui-srh__folder")!.textContent).toBe("src/lib");
      expect(file(el, "src/lib/freezer.ts").querySelector(".ui-srh__count")!.textContent).toBe("2 results");
      expect(match(el, 0).getAttribute("aria-level")).toBe("2");
      expect(match(el, 0).querySelector(".ui-srh__line")!.textContent).toBe("Line 3");
    });
  }

  test("marks the matches from the query, case-insensitively, or the ranges given", async () => {
    const el = await make();
    expect([...match(el, 0).querySelectorAll(".ui-srh__hit")].map((m) => m.textContent)).toEqual(["freezer", "freezer"]);
    expect(match(el, 2).querySelector(".ui-srh__hit")!.textContent).toBe("Freezer");
    el.results = [{ path: "a.ts", matches: [{ line: 1, text: "abcdef", ranges: [[2, 4]] }] }];
    await el.updateComplete;
    expect(match(el, 0).querySelector(".ui-srh__hit")!.textContent).toBe("cd");
  });

  test("a long line is cut so its first match shows; indentation is dropped", async () => {
    const el = await make();
    const text = match(el, 1).querySelector(".ui-srh__text")!.textContent!;
    expect(text.startsWith("…")).toBe(true);
    expect(text.length).toBeLessThan(LONG.length);
    expect(match(el, 1).querySelector(".ui-srh__hit")!.textContent).toBe("Freezer");
    expect(match(el, 0).querySelector(".ui-srh__text")!.textContent!.startsWith("export")).toBe(true);
  });

  test("searchResultsPattern follows the options and survives a bad regular expression", () => {
    expect(searchResultsPattern("a.b", { caseSensitive: false, wholeWord: false, regex: false })!.test("a.b")).toBe(true);
    expect(searchResultsPattern("a.b", { caseSensitive: false, wholeWord: false, regex: false })!.test("axb")).toBe(false);
    expect(searchResultsPattern("Cat", { caseSensitive: true, wholeWord: true, regex: false })!.test("Cats")).toBe(false);
    expect(searchResultsPattern("(", { caseSensitive: false, wholeWord: false, regex: true })).toBeNull();
  });

  test("Enter searches with the options; prevented keeps the query", async () => {
    const el = await make();
    const got: unknown[] = [];
    el.addEventListener("tc-search", (e) => got.push((e as CustomEvent).detail));
    input(el).value = "alarm";
    input(el).dispatchEvent(new Event("input", { bubbles: true }));
    await key(el, "Enter", input(el));
    expect(got).toEqual([{ query: "alarm", options: { caseSensitive: false, wholeWord: false, regex: false } }]);
    expect(el.query).toBe("alarm");
    el.addEventListener("tc-search", (e) => e.preventDefault());
    input(el).value = "log";
    input(el).dispatchEvent(new Event("input", { bubbles: true }));
    await key(el, "Enter", input(el));
    expect(el.query).toBe("alarm");
  });

  test("the toggles change the options and the marks; prevented keeps them", async () => {
    const el = await make();
    const toggle = el.querySelector<HTMLButtonElement>('.ui-srh__toggle[data-option="caseSensitive"]')!;
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.textContent).toContain("Match case");
    toggle.click();
    await el.updateComplete;
    expect(el.options.caseSensitive).toBe(true);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(match(el, 2).querySelector(".ui-srh__hit")).toBeNull();
    el.addEventListener("tc-options-change", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>('.ui-srh__toggle[data-option="regex"]')!.click();
    await el.updateComplete;
    expect(el.options.regex).toBe(false);
  });

  test("a file folds; collapse all and expand all; prevented stays", async () => {
    const el = await make();
    const changes: unknown[] = [];
    el.addEventListener("tc-expanded-change", (e) => changes.push((e as CustomEvent).detail));
    file(el, "README.md").click();
    await el.updateComplete;
    expect(el.expanded).toEqual(["src/lib/freezer.ts"]);
    expect(changes[0]).toEqual({ expanded: ["src/lib/freezer.ts"], path: "README.md" });
    expect(rows(el)).toHaveLength(4);
    el.querySelector<HTMLButtonElement>(".ui-srh__fold")!.click();
    await el.updateComplete;
    expect(el.expanded).toEqual([]);
    expect(rows(el)).toHaveLength(2);
    expect(el.querySelector(".ui-srh__fold")!.getAttribute("aria-label")).toBe("Expand all");
    el.addEventListener("tc-expanded-change", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-srh__fold")!.click();
    await el.updateComplete;
    expect(el.expanded).toEqual([]);
  });

  test("a match selects and opens; opening again only opens; prevented keeps the selection", async () => {
    const el = await make();
    const opened: unknown[] = [];
    let changes = 0;
    el.addEventListener("tc-open", (e) => opened.push((e as CustomEvent).detail));
    el.addEventListener("tc-selected-change", () => changes++);
    match(el, 0).click();
    await el.updateComplete;
    match(el, 0).click();
    expect(el.selected).toEqual({ path: "src/lib/freezer.ts", line: 3 });
    expect(match(el, 0).getAttribute("aria-selected")).toBe("true");
    expect(opened).toEqual([
      { path: "src/lib/freezer.ts", line: 3, column: undefined },
      { path: "src/lib/freezer.ts", line: 3, column: undefined },
    ]);
    expect(changes).toBe(1);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    match(el, 2).click();
    await el.updateComplete;
    expect(el.selected).toEqual({ path: "src/lib/freezer.ts", line: 3 });
  });

  test("keyboard: into the tree from the field, arrows, folding, parent, End, Enter", async () => {
    const el = await make();
    input(el).focus();
    await key(el, "ArrowDown", input(el));
    expect(document.activeElement).toBe(file(el, "src/lib/freezer.ts"));
    await key(el, "ArrowRight");
    expect(document.activeElement).toBe(match(el, 0));
    await key(el, "ArrowLeft");
    expect(document.activeElement).toBe(file(el, "src/lib/freezer.ts"));
    await key(el, "ArrowLeft");
    expect(el.expanded).toEqual(["README.md"]);
    await key(el, "ArrowRight");
    expect(el.expanded).toEqual(["README.md", "src/lib/freezer.ts"]);
    await key(el, "End");
    expect(document.activeElement).toBe(match(el, 2));
    await key(el, "Enter");
    expect(el.selected).toEqual({ path: "README.md", line: 1 });
    await key(el, "Home");
    expect(document.activeElement).toBe(file(el, "src/lib/freezer.ts"));
  });

  test("empty states: before a search, no results, searching, an error; truncated says so", async () => {
    const idle = await make("standard", [], "");
    expect(idle.querySelector(".ui-srh__empty")!.textContent).toBe("Type and press Enter to search in files");
    const none = await make("standard", [], "walrus");
    expect(none.querySelector(".ui-srh__empty")!.textContent).toBe("No results for “walrus”");
    none.status = "searching";
    await none.updateComplete;
    expect(none.querySelector(".ui-srh__empty")).toBeNull();
    expect(none.querySelector(".ui-srh__summary")!.textContent!.trim()).toBe("Searching");
    none.status = "error";
    none.error = "The index is rebuilding";
    await none.updateComplete;
    expect(none.querySelector('[role="alert"]')!.textContent).toBe("The index is rebuilding");
    const cut = await make();
    cut.truncated = true;
    await cut.updateComplete;
    expect(cut.querySelector(".ui-srh__note")!.textContent).toBe("Showing the first 3 results");
  });

  test("replaceable: previews the replacement; Replace needs a chosen match; Replace all", async () => {
    const el = await make();
    el.replaceable = true;
    el.replacement = "fridge";
    await el.updateComplete;
    expect(match(el, 2).querySelector(".ui-srh__del")!.textContent).toBe("Freezer");
    expect(match(el, 2).querySelector(".ui-srh__ins")!.textContent).toBe("fridge");
    const [one, all] = el.querySelectorAll<HTMLButtonElement>(".ui-srh__button");
    expect(one.disabled).toBe(true);
    const got: unknown[] = [];
    el.addEventListener("tc-replace", (e) => got.push((e as CustomEvent).detail));
    all.click();
    match(el, 2).click();
    await el.updateComplete;
    one.click();
    const options = { caseSensitive: false, wholeWord: false, regex: false };
    expect(got).toEqual([
      { query: "freezer", replacement: "fridge", options, path: undefined, line: undefined },
      { query: "freezer", replacement: "fridge", options, path: "README.md", line: 1 },
    ]);
  });

  test("many results draw only the rows near the view", async () => {
    const big: SearchResultsFile[] = Array.from({ length: 100 }, (_, i) => ({ path: `f${i}.ts`, matches: Array.from({ length: 30 }, (_, j) => ({ line: j + 1, text: `freezer ${j}` })) }));
    const el = await make("standard", big);
    expect(el.querySelectorAll(".ui-srh__row").length).toBeLessThan(300);
    expect(el.querySelector(".ui-srh__summary")!.textContent!.trim()).toBe("3000 results in 100 files");
  });

  test("React: uncontrolled selection survives re-renders; controlled stays until changed", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(SearchResults, { results: RESULTS, query: "freezer" })));
    const el = host.querySelector("tc-search-results") as TcSearchResults;
    await act(async () => match(el, 0).click());
    await act(async () => root.render(React.createElement(SearchResults, { results: RESULTS, query: "freezer", title: "Find" })));
    expect(el.selected).toEqual({ path: "src/lib/freezer.ts", line: 3 });
    let told: unknown = null;
    await act(async () => root.render(React.createElement(SearchResults, { results: RESULTS, query: "freezer", selected: { path: "README.md", line: 1 }, onSelectedChange: (s) => (told = s) })));
    await act(async () => match(el, 0).click());
    await settle(host);
    expect(el.selected).toEqual({ path: "README.md", line: 1 });
    expect(told).toEqual({ path: "src/lib/freezer.ts", line: 3 });
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: ${look} ${theme}`, async () => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        const el = await make(look);
        el.replaceable = true;
        el.replacement = "fridge";
        el.selected = { path: "README.md", line: 1 };
        el.truncated = true;
        el.actions = [{ id: "refresh", label: "Refresh", icon: "M3 12h18" }];
        await finish(el.parentElement!);
        const r = await axe.run(el);
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        expect(r.violations.map((v) => v.id)).toEqual([]);
      });
});

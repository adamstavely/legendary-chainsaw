/*
 * <tc-results-list> in real browsers: groups with counts, marked query words, links and buttons with tc-open, sort,
 * "Did you mean", Show more, the arrow keys, loading and empty states, the helpers, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/results-list";
import { pluralKind, queryTerms, type ResultsOpen, type SearchResult, type TcResultsList } from "../../src/elements/results-list";
import { ResultsList } from "../../src/elements/react/results-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const D = Date.UTC(2026, 9, 1);
const RESULTS: SearchResult[] = [
  { id: "a", kind: "Document", title: "Coral bleaching survey", snippet: "Bleaching hit the outer reef; coral cover fell.", source: "Reports", date: D - 5e8, href: "https://example.org/a" },
  { id: "b", kind: "Person", title: "Ana Kealoha", snippet: "Leads the coral programme." },
  { id: "c", kind: "Document", title: "Lab notes, week 12", snippet: "Strain T-7 kept its colour.", date: D, meta: ["Aquaria"] },
  { id: "d", kind: "Email", title: "Re: alert threshold", date: D - 1e9, href: "javascript:alert(1)" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const titles = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-rsl__title")];
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look = "standard", results = RESULTS) => fixture<TcResultsList>(html`<tc-results-list look=${look} query="coral bleaching" .results=${results}></tc-results-list>`);

describe("tc-results-list", () => {
  test("helpers: plural kinds and the query's words", () => {
    expect(["Document", "Person", "Inbox", "Gallery", "Day"].map(pluralKind)).toEqual(["Documents", "People", "Inboxes", "Galleries", "Days"]);
    expect(queryTerms("a Coral  coral bleaching")).toEqual(["bleaching", "coral"]);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: grouped by kind with counts, the query marked, one quiet line, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rsl");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".tc-head__sub"))).toBe("4 results for “coral bleaching”");
      expect([...el.querySelectorAll(".ui-rsl__group-name")].map(text)).toEqual(["Documents 2", "People 1", "Emails 1"]);
      expect([...el.querySelectorAll(".ui-rsl__mark")].map((m) => m.textContent)).toEqual(["Coral", "bleaching", "Bleaching", "coral", "coral"]);
      const meta = [...el.querySelectorAll('[data-id="c"] .ui-rsl__meta > *')];
      expect(text(meta[0])).toBe("Aquaria");
      expect(meta[1].tagName).toBe("TIME");
      expect(text(meta[1])).toMatch(/2026$/);
      expect(titles(el).filter((t) => t.tabIndex === 0)).toHaveLength(1);
      // A safe href is a link; an unsafe one never becomes an href
      expect(el.querySelector('[data-id="a"] a')!.getAttribute("href")).toBe("https://example.org/a");
      expect(el.querySelector('[data-id="d"] a')).toBeNull();
      expect(el.querySelector('[data-id="d"] button.ui-rsl__title')).not.toBeNull();
    });
  }

  test("open: tc-open for buttons and links; prevented, a link doesn't follow", async () => {
    const el = await make();
    const opened: ResultsOpen[] = [];
    el.addEventListener("tc-open", (e) => {
      opened.push((e as CustomEvent<ResultsOpen>).detail);
      e.preventDefault();
    });
    el.querySelector<HTMLElement>('[data-id="b"] .ui-rsl__title')!.click();
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    el.querySelector('[data-id="a"] a')!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(opened.map((o) => o.id)).toEqual(["b", "a"]);
  });

  test("keys: ↑ ↓ Home End move between results across groups; focus selects (tc-selected-change)", async () => {
    const el = await make();
    const seen: (string | null)[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent).detail.selected));
    titles(el)[0].focus();
    await settle();
    key(titles(el)[0], "ArrowDown");
    await settle();
    expect(document.activeElement).toBe(el.querySelector('[data-id="c"] .ui-rsl__title'));
    key(document.activeElement!, "End");
    await settle();
    expect(document.activeElement).toBe(el.querySelector('[data-id="d"] .ui-rsl__title'));
    key(document.activeElement!, "Home");
    await settle();
    expect(document.activeElement).toBe(titles(el)[0]);
    expect(seen).toEqual(["a", "c", "d", "a"]);
    expect(el.selected).toBe("a");
    expect(titles(el).filter((t) => t.tabIndex === 0)).toEqual([titles(el)[0]]);
  });

  test("sort by date: newest first, undated last; prevented, it stays", async () => {
    const el = await make();
    el.group = "none";
    await settle();
    el.querySelectorAll<HTMLButtonElement>(".ui-rsl__sort-opt")[1].click();
    await settle();
    expect(el.sort).toBe("date");
    expect([...el.querySelectorAll(".ui-rsl__item")].map((i) => (i as HTMLElement).dataset.id)).toEqual(["c", "a", "d", "b"]);
    // Ungrouped, each result shows its kind
    expect(text(el.querySelector('[data-id="c"] .ui-rsl__kind'))).toBe("Document");
    el.addEventListener("tc-sort-change", (e) => e.preventDefault(), { once: true });
    el.querySelectorAll<HTMLButtonElement>(".ui-rsl__sort-opt")[0].click();
    await settle();
    expect(el.sort).toBe("date");
  });

  test("Show more adds a page and moves focus to the first new result; prevented, the page adds them", async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, title: `Report ${i + 1}`, kind: "Document" }));
    const el = await make("standard", many);
    el.pageSize = 5;
    await settle();
    expect(el.querySelectorAll(".ui-rsl__item")).toHaveLength(5);
    el.querySelector<HTMLButtonElement>(".ui-rsl__more")!.click();
    await settle();
    expect(el.querySelectorAll(".ui-rsl__item")).toHaveLength(10);
    await expect.poll(() => document.activeElement).toBe(el.querySelector('[data-id="r5"] .ui-rsl__title'));
    // The group's count is every result of the kind
    expect(text(el.querySelector(".ui-rsl__group-name"))).toBe("Documents 12");
    el.addEventListener("tc-more", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLButtonElement>(".ui-rsl__more")!.click();
    await settle();
    expect(el.querySelectorAll(".ui-rsl__item")).toHaveLength(10);
  });

  test("Did you mean, empty, and loading", async () => {
    const el = await fixture<TcResultsList>(html`<tc-results-list query="corral" suggestion="coral"></tc-results-list>`);
    expect(text(el.querySelector(".ui-rsl__empty-title"))).toBe("No results for “corral”");
    const got: string[] = [];
    el.addEventListener("tc-suggestion", (e) => got.push((e as CustomEvent).detail.suggestion));
    el.querySelector<HTMLButtonElement>(".ui-rsl__suggest-btn")!.click();
    expect(got).toEqual(["coral"]);
    el.loading = true;
    await settle();
    expect(el.querySelector(".ui-rsl__card")!.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelectorAll(".ui-rsl__skeleton")).toHaveLength(3);
    expect(text(el.querySelector(".tc-head__sub"))).toBe("Searching…");
  });

  test("React wrapper: uncontrolled sort survives re-renders; controlled sort stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const sorts: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ResultsList, { title: "Found", query: "coral", results: RESULTS, onSortChange: (s) => void sorts.push(s), "data-n": n } as React.ComponentProps<typeof ResultsList>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-results-list")!;
    expect(text(el.querySelector(".tc-head__title"))).toBe("Found");
    el.querySelectorAll<HTMLButtonElement>(".ui-rsl__sort-opt")[1].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.sort).toBe("date");
    expect(sorts).toEqual(["date"]);
    await act(async () => root.render(React.createElement(ResultsList, { results: RESULTS, sort: "relevance" })));
    await settle();
    const held = host.querySelector("tc-results-list")!;
    held.querySelectorAll<HTMLButtonElement>(".ui-rsl__sort-opt")[1].click();
    await settle();
    expect(held.sort).toBe("relevance");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-results-list query="coral bleaching" suggestion="coral reef" .results=${RESULTS}></tc-results-list>
        <tc-results-list look="clean" group="none" sort="date" query="coral" .results=${RESULTS}></tc-results-list>
        <tc-results-list query="nothing"></tc-results-list>
        <tc-results-list look="clean" loading></tc-results-list>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

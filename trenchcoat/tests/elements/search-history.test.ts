/*
 * <tc-search-history> in real browsers: Recent and Saved tabs with counts, grouping by day, relative times, the
 * filter, run again, saving, removing with Undo, the keyboard, controlled use, the React wrapper and axe in both looks
 * and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/search-history";
import type { SearchHistoryEntry, SearchHistoryRemove, SearchHistorySavedChange, SearchHistorySelect, TcSearchHistory } from "../../src/elements/search-history";
import { SearchHistory } from "../../src/elements/react/search-history";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = new Date(2026, 9, 28, 15, 0).getTime();
const MIN = 60_000;
const SEARCHES: SearchHistoryEntry[] = [
  { id: "a", query: "invoice 7741", scopes: ["Files"], results: 12, at: NOW - 5 * MIN },
  { id: "b", query: "Who approved the Q3 budget?", scopes: ["AI mode"], results: 1, at: NOW - 3 * 60 * MIN, saved: true },
  { id: "c", query: "Helios Holdings", scopes: ["Entities"], results: 48, at: new Date(2026, 9, 27, 10, 30).getTime() },
  { id: "d", query: "type:document owner:K.Osei", scopes: ["Files", "Contents"], results: 230, at: new Date(2026, 9, 20, 9, 0).getTime(), saved: true },
];

const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-shis__row")];
const queries = (el: Element) => rows(el).map((r) => r.querySelector(".ui-shis__query")!.textContent);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcSearchHistory>(html`<tc-search-history look=${look} .now=${NOW} .searches=${SEARCHES}></tc-search-history>`);

describe("tc-search-history", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: tabs with counts, newest first, grouped by day, with scopes, results and times`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("shis");
      expect(el.dataset.look).toBe(look);
      const tabs = [...el.querySelectorAll<HTMLElement>('[role="tab"]')];
      expect(tabs.map((t) => t.textContent!.replace(/\s+/g, ""))).toEqual(["Recent4", "Saved2"]);
      expect(tabs[0].getAttribute("aria-selected")).toBe("true");
      expect(queries(el)).toEqual(["invoice 7741", "Who approved the Q3 budget?", "Helios Holdings", "type:document owner:K.Osei"]);
      expect([...el.querySelectorAll(".ui-shis__day-name")].map((d) => d.textContent)).toEqual([
        "Today",
        "Yesterday",
        new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(SEARCHES[3].at),
      ]);
      const first = rows(el)[0];
      expect([...first.querySelectorAll(".ui-shis__scope")].map((s) => s.textContent)).toEqual(["Files"]);
      expect(first.querySelector(".ui-shis__results")!.textContent).toBe("12 results");
      expect(first.querySelector(".ui-shis__time")!.textContent).toBe(new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "short" }).format(-5, "minute"));
      expect(rows(el)[1].querySelector(".ui-shis__results")!.textContent).toBe("1 result");
      expect(el.querySelectorAll('.ui-shis__list [tabindex="0"]')).toHaveLength(1);
    });
  }

  test("the Saved tab, arrow keys between tabs, and the filter", async () => {
    const el = await make();
    const tabs = () => [...el.querySelectorAll<HTMLElement>('[role="tab"]')];
    key(tabs()[0], "ArrowRight");
    await settle();
    expect(el.tab).toBe("saved");
    await expect.poll(() => document.activeElement === tabs()[1]).toBe(true);
    expect(queries(el)).toEqual(["Who approved the Q3 budget?", "type:document owner:K.Osei"]);
    tabs()[0].click();
    await settle();
    const filter = el.querySelector<HTMLInputElement>(".ui-shis__filter-input")!;
    filter.value = "files";
    filter.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    // Matches the query or the scopes
    expect(queries(el)).toEqual(["invoice 7741", "type:document owner:K.Osei"]);
    filter.value = "nothing like this";
    filter.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-shis__empty")!.textContent).toContain("No searches match");
  });

  test("run again, save and unsave, remove with Undo – each with its event", async () => {
    const el = await make();
    const events: string[] = [];
    el.addEventListener("tc-select", (e) => events.push(`select:${(e as CustomEvent<SearchHistorySelect>).detail.id}`));
    el.addEventListener("tc-saved-change", (e) => events.push(`saved:${(e as CustomEvent<SearchHistorySavedChange>).detail.id}:${(e as CustomEvent<SearchHistorySavedChange>).detail.saved}`));
    el.addEventListener("tc-remove", (e) => events.push(`remove:${(e as CustomEvent<SearchHistoryRemove>).detail.id}:${(e as CustomEvent<SearchHistoryRemove>).detail.searches.length}`));
    el.addEventListener("tc-restore", (e) => events.push(`restore:${(e as CustomEvent<SearchHistoryRemove>).detail.id}`));
    rows(el)[0].querySelector<HTMLButtonElement>(".ui-shis__run")!.click();
    const star = rows(el)[0].querySelector<HTMLButtonElement>(".ui-shis__star")!;
    expect(star.getAttribute("aria-pressed")).toBe("false");
    star.click();
    await settle();
    expect(rows(el)[0].querySelector(".ui-shis__star")!.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector('[role="tab"]:last-child')!.textContent!.replace(/\s+/g, "")).toBe("Saved3");
    rows(el)[2].querySelector<HTMLButtonElement>(".ui-shis__remove")!.click();
    await settle();
    expect(queries(el)).not.toContain("Helios Holdings");
    expect(el.querySelector(".ui-shis__removed")!.textContent).toContain("Removed “Helios Holdings”");
    await expect.poll(() => document.activeElement?.classList.contains("ui-shis__undo")).toBe(true);
    el.querySelector<HTMLButtonElement>(".ui-shis__undo")!.click();
    await settle();
    expect(queries(el)).toContain("Helios Holdings");
    expect(el.querySelector(".ui-shis__removed")).toBeNull();
    expect(events).toEqual(["select:a", "saved:a:true", "remove:c:3", "restore:c"]);
  });

  test("keyboard: one tab stop; ↑ ↓ between searches, ← → between a search's actions, Home / End", async () => {
    const el = await make();
    const at = () => (document.activeElement as HTMLElement | null)?.dataset.cell;
    el.querySelector<HTMLElement>('[data-cell="0:0"]')!.focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await settle();
    };
    await press("ArrowDown");
    await expect.poll(at).toBe("1:0");
    await press("ArrowRight");
    await expect.poll(at).toBe("1:1");
    await press("ArrowRight");
    await press("ArrowRight");
    await expect.poll(at).toBe("1:2");
    await press("End");
    await expect.poll(at).toBe("3:2");
    await press("Home");
    await expect.poll(at).toBe("0:2");
    await press("ArrowLeft");
    await expect.poll(at).toBe("0:1");
    expect(el.querySelectorAll('.ui-shis__list [tabindex="0"]')).toHaveLength(1);
  });

  test("controlled: prevented saves and removals leave the list; Undo appears once the page removes the search", async () => {
    const el = await make();
    el.addEventListener("tc-saved-change", (e) => e.preventDefault());
    el.addEventListener("tc-remove", (e) => e.preventDefault());
    rows(el)[0].querySelector<HTMLButtonElement>(".ui-shis__star")!.click();
    rows(el)[0].querySelector<HTMLButtonElement>(".ui-shis__remove")!.click();
    await settle();
    expect(el.searches).toBe(SEARCHES);
    expect(el.querySelector(".ui-shis__removed")).toBeNull();
    el.searches = SEARCHES.filter((s) => s.id !== "a");
    await settle();
    expect(el.querySelector(".ui-shis__removed")!.textContent).toContain("invoice 7741");
  });

  test("its own clock when `now` isn't given; an empty history says so", async () => {
    const el = await fixture<TcSearchHistory>(html`<tc-search-history .searches=${[{ id: "x", query: "just ran", at: Date.now() - 1000 }]}></tc-search-history>`);
    expect(el.querySelector(".ui-shis__time")!.textContent).toBe("just now");
    const empty = await fixture<TcSearchHistory>(html`<tc-search-history tab="saved"></tc-search-history>`);
    expect(empty.querySelector(".ui-shis__empty")!.textContent).toContain("No saved searches yet");
  });

  test("React wrapper: uncontrolled saves survive parent re-renders; onSearchesChange gets the next list", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const lists: SearchHistoryEntry[][] = [];
    const runs: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(SearchHistory, {
        title: "Your searches",
        now: NOW,
        defaultSearches: SEARCHES,
        onSearchesChange: (next) => void lists.push(next),
        onRunAgain: (s) => void runs.push(s.id),
        "data-n": n,
      } as React.ComponentProps<typeof SearchHistory>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-search-history")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Your searches");
    rows(el)[0].querySelector<HTMLButtonElement>(".ui-shis__star")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(rows(el)[0].querySelector(".ui-shis__star")!.getAttribute("aria-pressed")).toBe("true");
    expect(lists).toHaveLength(1);
    expect(lists[0].find((s) => s.id === "a")!.saved).toBe(true);
    rows(el)[1].querySelector<HTMLButtonElement>(".ui-shis__run")!.click();
    expect(runs).toEqual(["b"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled searches stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: SearchHistoryEntry[][] = [];
    await act(async () => root.render(React.createElement(SearchHistory, { now: NOW, searches: SEARCHES, onSearchesChange: (next) => void asked.push(next) })));
    await settle();
    const el = host.querySelector("tc-search-history")!;
    rows(el)[0].querySelector<HTMLButtonElement>(".ui-shis__remove")!.click();
    await settle();
    expect(asked).toHaveLength(1);
    expect(asked[0].map((s) => s.id)).toEqual(["b", "c", "d"]);
    expect(queries(el)).toContain("invoice 7741");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-search-history description="What you looked for." .now=${NOW} .searches=${SEARCHES}></tc-search-history>
        <tc-search-history look="clean" tab="saved" .now=${NOW} .searches=${SEARCHES}></tc-search-history>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

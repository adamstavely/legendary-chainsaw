/*
 * <tc-watchlist> in real browsers: rows sorted by risk then name, avatars, references, groups and risk in words, the
 * count, filters with counts, limit, opening rows, View all, the keyboard, controlled filters, the React wrapper and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/watchlist";
import type { TcWatchlist, WatchFilter, WatchFilterChange, WatchItem, WatchOpen } from "../../src/elements/watchlist";
import { Watchlist } from "../../src/elements/react/watchlist";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: WatchItem[] = [
  { id: "c", name: "Ravi Menon", ref: "CUS-2210", group: "Chargebacks", risk: "elevated" },
  { id: "a", name: "Northwind Traders", ref: "MER-4471", group: "Case 22-1187", risk: "critical", shape: "square" },
  { id: "d", name: "Mia Lindqvist", risk: "low", avatar: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" },
  { id: "b", name: "Dana Okafor", ref: "CUS-0098", risk: "critical" },
];

const names = (el: Element) => [...el.querySelectorAll(".ui-wls__name")].map((n) => n.textContent);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-row="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard", filters = false) =>
  fixture<TcWatchlist>(html`<tc-watchlist look=${look} description="Accounts under review." .items=${ITEMS} ?filters=${filters}></tc-watchlist>`);

describe("tc-watchlist", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: rows by risk then name, with avatar, reference, group and risk in words; the count; one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("wls");
      expect(el.dataset.look).toBe(look);
      expect(names(el)).toEqual(["Dana Okafor", "Northwind Traders", "Ravi Menon", "Mia Lindqvist"]);
      const list = el.querySelector("ul.ui-wls__list")!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent!.replace(/\s+/g, " ").trim()).toBe("Watchlist, 4");
      const first = row(el, "a");
      expect(first.querySelector(".ui-wls__avatar")!.textContent!.trim()).toBe("NT");
      expect(first.querySelector(".ui-wls__avatar")!.getAttribute("data-shape")).toBe("square");
      expect(first.querySelector(".ui-wls__ref")!.textContent).toBe("MER-4471");
      expect(first.querySelector(".ui-wls__group")!.textContent).toBe("Case 22-1187");
      expect(first.querySelector(".ui-wls__risk")!.textContent).toBe("Risk: Critical");
      expect(row(el, "d").querySelector("img")!.getAttribute("alt")).toBe("");
      expect(row(el, "d").querySelector(".ui-wls__meta")).toBeNull();
      expect(el.querySelectorAll('.ui-wls__row[tabindex="0"]')).toHaveLength(1);
      expect(row(el, "b").getAttribute("tabindex")).toBe("0");
    });
  }

  test("sort by name or as given; limit; risk names can be renamed", async () => {
    const el = await make();
    el.sort = "name";
    await settle();
    expect(names(el)).toEqual(["Dana Okafor", "Mia Lindqvist", "Northwind Traders", "Ravi Menon"]);
    el.sort = "none";
    el.limit = 2;
    await settle();
    expect(names(el)).toEqual(["Ravi Menon", "Northwind Traders"]);
    // The count is what the filter holds, not what the limit shows
    expect(el.querySelector(".ui-wls__count")!.textContent).toBe("4");
    el.riskLabels = { elevated: "High" };
    await settle();
    expect(row(el, "c").querySelector(".ui-wls__risk")!.textContent).toBe("Risk: High");
  });

  test("filters: All and each risk with rows, with counts; choosing one fires tc-filter-change and narrows the list", async () => {
    const el = await make("standard", true);
    const seen: WatchFilterChange[] = [];
    el.addEventListener("tc-filter-change", (e) => seen.push((e as CustomEvent<WatchFilterChange>).detail));
    const buttons = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-wls__filter")];
    expect(buttons().map((b) => b.textContent!.replace(/\s+/g, ""))).toEqual(["All4", "Critical2", "Elevated1", "Low1"]);
    expect(el.querySelector(".ui-wls__filters")!.getAttribute("aria-label")).toBe("Filter by risk");
    expect(buttons()[0].getAttribute("aria-pressed")).toBe("true");
    buttons()[1].click();
    await settle();
    expect(el.filter).toBe("critical");
    expect(names(el)).toEqual(["Dana Okafor", "Northwind Traders"]);
    expect(el.querySelector(".ui-wls__count")!.textContent).toBe("2");
    expect(buttons()[1].getAttribute("aria-pressed")).toBe("true");
    // Prevented, the filter stays
    el.addEventListener("tc-filter-change", (e) => e.preventDefault(), { once: true });
    buttons()[0].click();
    await settle();
    expect(el.filter).toBe("critical");
    expect(seen.map((s) => s.filter)).toEqual(["critical", "all"]);
    // A filter whose risk has no rows left goes back to All
    el.items = ITEMS.filter((i) => i.risk !== "critical");
    await settle();
    expect(el.filter).toBe("all");
  });

  test("Enter or a click opens a row; View all fires tc-action; an empty list says so", async () => {
    const el = await make();
    const opened: WatchOpen[] = [];
    const actions: unknown[] = [];
    el.addEventListener("tc-open", (e) => opened.push((e as CustomEvent<WatchOpen>).detail));
    el.addEventListener("tc-action", (e) => actions.push((e as CustomEvent).detail));
    row(el, "c").click();
    row(el, "a").focus();
    row(el, "a").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    row(el, "a").click();
    expect(opened.map((o) => [o.id, o.item.name])).toEqual([
      ["c", "Ravi Menon"],
      ["a", "Northwind Traders"],
    ]);
    el.querySelector<HTMLButtonElement>(".ui-wls__all")!.click();
    expect(actions).toEqual([{ action: "view-all" }]);
    el.viewAll = "";
    el.items = [];
    await settle();
    expect(el.querySelector(".ui-wls__all")).toBeNull();
    expect(el.querySelector(".ui-wls__empty")!.textContent).toBe("Nothing on the watchlist.");
  });

  test("keyboard: ↑ ↓ between rows, Home / End to the ends", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-row");
    row(el, "b").focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('.ui-wls__row[tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowDown");
    expect(at()).toBe("a");
    await press("End");
    expect(at()).toBe("d");
    await press("ArrowDown");
    expect(at()).toBe("d");
    await press("Home");
    expect(at()).toBe("b");
    await press("ArrowUp");
    expect(at()).toBe("b");
    expect(row(el, "b").getAttribute("tabindex")).toBe("0");
  });

  test("React wrapper: an uncontrolled filter survives re-renders; a controlled one waits for the parent; onOpen and onViewAll", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(Watchlist, {
        title: "Accounts",
        items: ITEMS,
        filters: true,
        onFilterChange: (f: WatchFilter) => void seen.push(f),
        onOpen: (id: string) => void seen.push(`open ${id}`),
        onViewAll: () => void seen.push("all"),
        "data-n": n,
      } as React.ComponentProps<typeof Watchlist>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-watchlist")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toContain("Accounts");
    el.querySelector<HTMLButtonElement>('[data-filter="critical"]')!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.filter).toBe("critical");
    row(el, "a").click();
    el.querySelector<HTMLButtonElement>(".ui-wls__all")!.click();
    expect(seen).toEqual(["critical", "open a", "all"]);
    await act(async () => root.render(React.createElement(Watchlist, { items: ITEMS, filters: true, filter: "all", onFilterChange: (f) => void seen.push(`asked ${f}`) })));
    await settle();
    // A new element: the App component was replaced
    const el2 = host.querySelector("tc-watchlist")!;
    el2.querySelector<HTMLButtonElement>('[data-filter="low"]')!.click();
    await settle();
    expect(el2.filter).toBe("all");
    expect(seen.at(-1)).toBe("asked low");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-watchlist description="Accounts under review." .items=${ITEMS} filters></tc-watchlist>
        <tc-watchlist look="clean" .items=${ITEMS} .riskLabels=${{ guarded: "Watch" }}></tc-watchlist>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

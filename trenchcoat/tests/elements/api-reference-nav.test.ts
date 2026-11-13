/*
 * <tc-api-reference-nav> in real browsers: the landmark and tree, method badges in words, the current endpoint, the
 * filter (words, count, prevented, Escape), the tree keys (arrows, ← →, Home/End, type-ahead), opening and closing
 * groups, tc-navigate (prevented, and left to the browser on modifier clicks), the Paths switch, deprecated
 * endpoints, scrolling the current one into view, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/api-reference-nav";
import {
  apiEndpointMatches,
  apiMethodTone,
  type ApiNavCollapsedChange,
  type ApiNavGroup,
  type ApiNavNavigate,
  type ApiNavQueryChange,
  type TcApiReferenceNav,
} from "../../src/elements/api-reference-nav";
import { ApiReferenceNav } from "../../src/elements/react/api-reference-nav";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const GROUPS: ApiNavGroup[] = [
  {
    id: "records",
    label: "Records",
    endpoints: [
      { id: "records-list", name: "List records", method: "GET", path: "/v1/records", href: "#records-list" },
      { id: "records-get", name: "Get a record", method: "GET", path: "/v1/records/{id}", href: "#records-get" },
      { id: "records-create", name: "Create a record", method: "POST", path: "/v1/records", href: "#records-create" },
      { id: "records-update", name: "Update a record", method: "PATCH", path: "/v1/records/{id}", href: "#records-update" },
      { id: "records-delete", name: "Delete a record", method: "DELETE", path: "/v1/records/{id}", href: "#records-delete" },
    ],
  },
  {
    id: "search",
    label: "Search",
    endpoints: [
      { id: "search-query", name: "Search records", method: "POST", path: "/v1/search", href: "#search-query" },
      { id: "search-suggest", name: "Suggest terms", method: "GET", path: "/v1/search/suggest" },
    ],
  },
  {
    id: "exports",
    label: "Exports",
    endpoints: [{ id: "exports-csv", name: "Export as CSV", method: "GET", path: "/v1/records.csv", href: "#exports-csv", deprecated: true }],
  },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: Element, k: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const item = (el: Element, k: string) => el.querySelector<HTMLElement>(`[data-key="${k}"]`)!;
const focused = () => (document.activeElement as HTMLElement | null)?.dataset.key;
const make = (look = "standard", attrs = html``) =>
  fixture<TcApiReferenceNav>(html`<tc-api-reference-nav look=${look} heading="Records API" current="records-update" .groups=${GROUPS}>${attrs}</tc-api-reference-nav>`);

describe("tc-api-reference-nav", () => {
  test("apiMethodTone and apiEndpointMatches", () => {
    expect(["GET", "head", "POST", "PUT", "PATCH", "DELETE", "TRACE"].map(apiMethodTone)).toEqual(["read", "read", "create", "change", "change", "delete", "other"]);
    const ep = GROUPS[0].endpoints[3];
    expect(apiEndpointMatches(ep, "")).toBe(true);
    expect(apiEndpointMatches(ep, "patch")).toBe(true);
    expect(apiEndpointMatches(ep, "update {id}")).toBe(true);
    expect(apiEndpointMatches(ep, "update delete")).toBe(false);
  });

  for (const look of ["standard", "clean"]) {
    test(`${look}: a named nav holding a tree with one tab stop; method badges in words; the current endpoint`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("arn");
      expect(el.dataset.look).toBe(look);
      const nav = el.querySelector("nav")!;
      expect(document.getElementById(nav.getAttribute("aria-labelledby")!)?.textContent).toBe("Records API");
      const tree = el.querySelector("[role=tree]")!;
      expect(tree.querySelectorAll("[role=treeitem][aria-level='1']")).toHaveLength(3);
      expect(tree.querySelectorAll("[role=treeitem][aria-level='2']")).toHaveLength(8);
      expect(text(item(el, "g:records"))).toBe("Records 5 endpoints");
      expect([...el.querySelectorAll(".ui-arn__method")].map(text)).toEqual(["GET", "GET", "POST", "PATCH", "DELETE", "POST", "GET", "GET"]);
      expect(el.querySelector(".ui-arn__method[data-tone=delete]")).not.toBeNull();
      const current = el.querySelectorAll("[aria-current=page]");
      expect(current).toHaveLength(1);
      expect(text(current[0])).toContain("Update a record");
      // One tab stop in the tree: the current endpoint
      expect(tree.querySelectorAll("[tabindex='0']")).toHaveLength(1);
      expect(item(el, "e:records-update").tabIndex).toBe(0);
      expect(text(el.querySelector(".ui-arn__count"))).toBe("8 endpoints");
      // The path is the description of the name, for screen readers
      const desc = document.getElementById(item(el, "e:records-update").getAttribute("aria-describedby")!);
      expect(text(desc)).toBe("/v1/records/{id}");
    });
  }

  test("deprecated endpoints say so; an endpoint without href is a non-link tree item", async () => {
    const el = await make();
    expect(text(item(el, "e:exports-csv").querySelector(".ui-arn__deprecated"))).toBe("Deprecated");
    const plain = item(el, "e:search-suggest");
    expect(plain.tagName).toBe("DIV");
    expect(plain.getAttribute("role")).toBe("treeitem");
  });

  test("the filter: every word must match name, path or method; groups without a match drop out; the count says how many", async () => {
    const el = await make();
    const input = el.querySelector<HTMLInputElement>(".ui-arn__filter-input")!;
    expect(input.labels?.[0]?.textContent).toBe("Filter endpoints");
    const seen: string[] = [];
    el.addEventListener("tc-query-change", (e) => seen.push((e as CustomEvent<ApiNavQueryChange>).detail.query));
    input.value = "post";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle(el);
    expect(seen).toEqual(["post"]);
    expect([...el.querySelectorAll(".ui-arn__group-label")].map(text)).toEqual(["Records", "Search"]);
    expect([...el.querySelectorAll(".ui-arn__name")].map(text)).toEqual(["Create a record", "Search records"]);
    expect(text(el.querySelector(".ui-arn__count"))).toBe("2 of 8 endpoints");
    await expect.poll(() => text(el.querySelector("[role=status]"))).toBe("2 of 8 endpoints");
    input.value = "nothing here";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle(el);
    expect(el.querySelector("[role=tree]")).toBeNull();
    expect(text(el.querySelector(".ui-arn__empty"))).toBe("No endpoints match");
    // Escape clears it
    key(input, "Escape");
    await settle(el);
    expect(el.query).toBe("");
    expect(el.querySelectorAll(".ui-arn__endpoint")).toHaveLength(8);
  });

  test("a prevented tc-query-change keeps the query and the field's text", async () => {
    const el = await make();
    el.addEventListener("tc-query-change", (e) => e.preventDefault());
    const input = el.querySelector<HTMLInputElement>(".ui-arn__filter-input")!;
    input.value = "get";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle(el);
    expect(el.query).toBe("");
    expect(input.value).toBe("");
    expect(el.querySelectorAll(".ui-arn__endpoint")).toHaveLength(8);
  });

  test("tree keys: ↓/↑ move, ← steps out to the group and closes it, → opens it and steps in, Home/End", async () => {
    const el = await make();
    const changes: ApiNavCollapsedChange[] = [];
    el.addEventListener("tc-collapsed-change", (e) => changes.push((e as CustomEvent<ApiNavCollapsedChange>).detail));
    item(el, "e:records-update").focus();
    key(document.activeElement!, "ArrowDown");
    await expect.poll(focused).toBe("e:records-delete");
    key(document.activeElement!, "ArrowDown");
    await expect.poll(focused).toBe("g:search");
    key(document.activeElement!, "ArrowUp");
    await expect.poll(focused).toBe("e:records-delete");
    key(document.activeElement!, "ArrowLeft");
    await expect.poll(focused).toBe("g:records");
    key(document.activeElement!, "ArrowLeft");
    await settle(el);
    expect(changes).toEqual([{ collapsed: ["records"], id: "records", open: false }]);
    expect(item(el, "g:records").getAttribute("aria-expanded")).toBe("false");
    expect(el.querySelector("[data-key='e:records-list']")).toBeNull();
    key(document.activeElement!, "ArrowRight");
    await settle(el);
    expect(item(el, "g:records").getAttribute("aria-expanded")).toBe("true");
    key(document.activeElement!, "ArrowRight");
    await expect.poll(focused).toBe("e:records-list");
    key(document.activeElement!, "End");
    await expect.poll(focused).toBe("e:exports-csv");
    key(document.activeElement!, "Home");
    await expect.poll(focused).toBe("g:records");
    // Only one tab stop, wherever focus went
    expect(el.querySelectorAll("[role=tree] [tabindex='0']")).toHaveLength(1);
  });

  test("type-ahead: a letter repeated moves through the items that start with it; more letters narrow it", async () => {
    const el = await make();
    item(el, "g:records").focus();
    key(document.activeElement!, "s");
    await expect.poll(focused).toBe("g:search");
    key(document.activeElement!, "s");
    await expect.poll(focused).toBe("e:search-query");
    key(document.activeElement!, "s");
    await expect.poll(focused).toBe("e:search-suggest");
    const other = await make();
    item(other, "g:records").focus();
    key(document.activeElement!, "e");
    key(document.activeElement!, "x");
    // "ex": Exports, before Export as CSV
    await expect.poll(focused).toBe("g:exports");
  });

  test("Enter or a click on a group opens and closes it; a prevented change keeps it open", async () => {
    const el = await make();
    const row = item(el, "g:records");
    row.click();
    await settle(el);
    expect(el.collapsed).toEqual(["records"]);
    item(el, "g:records").focus();
    key(document.activeElement!, "Enter");
    await settle(el);
    expect(el.collapsed).toEqual([]);
    el.addEventListener("tc-collapsed-change", (e) => e.preventDefault());
    row.click();
    await settle(el);
    expect(item(el, "g:records").getAttribute("aria-expanded")).toBe("true");
  });

  test("a click fires tc-navigate and moves current; prevented, it stays; a ⌘/Ctrl-click is left to the browser", async () => {
    const el = await make();
    const seen: ApiNavNavigate[] = [];
    el.addEventListener("tc-navigate", (e) => {
      seen.push((e as CustomEvent<ApiNavNavigate>).detail);
      e.preventDefault();
    });
    item(el, "e:records-get").click();
    await settle(el);
    expect(seen.map((d) => [d.id, d.href, d.current])).toEqual([["records-get", "#records-get", "records-get"]]);
    expect(el.current).toBe("records-update");
    item(el, "e:records-get").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true, metaKey: true }));
    expect(seen).toHaveLength(1);
    const free = await fixture<TcApiReferenceNav>(html`<tc-api-reference-nav .groups=${GROUPS}></tc-api-reference-nav>`);
    item(free, "e:search-suggest").click();
    await settle(free);
    expect(free.current).toBe("search-suggest");
    expect(item(free, "e:search-suggest").getAttribute("aria-current")).toBe("page");
  });

  test("the Paths switch shows paths, with the name as the description", async () => {
    const el = await make();
    const sw = el.querySelector<HTMLButtonElement>(".ui-arn__paths")!;
    expect(sw.getAttribute("aria-pressed")).toBe("false");
    sw.click();
    await settle(el);
    expect(el.showPaths).toBe(true);
    expect(sw.getAttribute("aria-pressed")).toBe("true");
    expect(text(item(el, "e:records-update").querySelector(".ui-arn__name"))).toBe("/v1/records/{id}");
    const desc = document.getElementById(item(el, "e:records-update").getAttribute("aria-describedby")!);
    expect(text(desc)).toBe("Update a record");
  });

  test("the current endpoint in a short tree is scrolled into view, without scrolling the page", async () => {
    const many: ApiNavGroup[] = [{ id: "all", label: "All", endpoints: Array.from({ length: 30 }, (_, i) => ({ id: `e${i}`, name: `Endpoint ${i}`, method: "GET", path: `/v1/e/${i}`, href: `#e${i}` })) }];
    const el = await fixture<TcApiReferenceNav>(html`<tc-api-reference-nav style="--tc-arn-max-h: 160px" current="e27" .groups=${many}></tc-api-reference-nav>`);
    const tree = el.querySelector<HTMLElement>(".ui-arn__tree")!;
    await expect.poll(() => tree.scrollTop).toBeGreaterThan(0);
    const row = item(el, "e:e27").getBoundingClientRect();
    const box = tree.getBoundingClientRect();
    expect(row.top).toBeGreaterThanOrEqual(box.top - 1);
    expect(row.bottom).toBeLessThanOrEqual(box.bottom + 1);
  });

  test("no groups: says there are none", async () => {
    const el = await fixture<TcApiReferenceNav>(html`<tc-api-reference-nav></tc-api-reference-nav>`);
    expect(text(el.querySelector(".ui-arn__empty"))).toBe("0 endpoints");
  });

  test("React wrapper: an uncontrolled query survives re-renders; a controlled current holds until the parent moves it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(
        "div",
        null,
        React.createElement(ApiReferenceNav, { id: "free", title: "Records API", groups: GROUPS, "data-n": n } as React.ComponentProps<typeof ApiReferenceNav>),
        React.createElement(ApiReferenceNav, {
          id: "held",
          groups: GROUPS,
          current: "records-list",
          "data-n": n,
          onNavigate: (id: string, _href: string | undefined, e: Event) => (e.preventDefault(), seen.push(id)),
        } as React.ComponentProps<typeof ApiReferenceNav>),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const free = host.querySelector<TcApiReferenceNav>("#free")!;
    expect(text(free.querySelector(".tc-head__title"))).toBe("Records API");
    const input = free.querySelector<HTMLInputElement>(".ui-arn__filter-input")!;
    input.value = "delete";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await act(async () => bump());
    await settle();
    expect(free.query).toBe("delete");
    expect(free.querySelectorAll(".ui-arn__endpoint")).toHaveLength(1);
    const held = host.querySelector<TcApiReferenceNav>("#held")!;
    item(held, "e:records-get").click();
    await act(async () => bump());
    await settle();
    expect(seen).toEqual(["records-get"]);
    expect(held.current).toBe("records-list");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with paths and a filter`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="display: grid; gap: 16px; padding: 16px; background: var(--tc-surface-base)">
        <tc-api-reference-nav heading="Records API" description="v1" current="records-update" .groups=${GROUPS}></tc-api-reference-nav>
        <tc-api-reference-nav look="clean" heading="Clean API" current="exports-csv" show-paths .groups=${GROUPS}></tc-api-reference-nav>
        <tc-api-reference-nav look="clean" heading="Filtered API" query="post" .groups=${GROUPS}></tc-api-reference-nav>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

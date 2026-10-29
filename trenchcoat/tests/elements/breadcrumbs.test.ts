/*
 * <tc-breadcrumbs> in real browsers: the landmark and current page, links and buttons, tc-navigate, folding the
 * middle by width and by `max`, the folded menu and its keys, Copy path, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/breadcrumbs";
import { breadcrumbLayout, type BreadcrumbItem, type BreadcrumbNavigate, type TcBreadcrumbs } from "../../src/elements/breadcrumbs";
import { Breadcrumbs } from "../../src/elements/react/breadcrumbs";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const TRAIL: BreadcrumbItem[] = [
  { label: "Library", href: "#library", icon: "home" },
  { label: "Special collections", href: "#special" },
  { label: "Maritime archive", id: "maritime" },
  { label: "Harbour board records", href: "#harbour" },
  { label: "1920–1939", href: "#1920" },
  { label: "Survey of the north quay", href: "#survey" },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const shownLabels = (el: Element) => [...el.querySelectorAll(".ui-crumb__nav .ui-crumb__list > .ui-crumb__item:not(.ui-crumb__more-item) .ui-crumb__text")].map(text);
const make = (width = 900, extra = html``, look = "standard") =>
  fixture<HTMLDivElement>(html`<div style=${`width: ${width}px`}><tc-breadcrumbs look=${look} .items=${TRAIL}>${extra}</tc-breadcrumbs></div>`).then((w) => w.firstElementChild as TcBreadcrumbs);

describe("tc-breadcrumbs", () => {
  test("breadcrumbLayout keeps the first and the last that fit, capped by max", () => {
    expect(breadcrumbLayout(6, Infinity)).toEqual({ hidden: [], shown: [0, 1, 2, 3, 4, 5] });
    expect(breadcrumbLayout(6, 2)).toEqual({ hidden: [1, 2, 3], shown: [0, 4, 5] });
    expect(breadcrumbLayout(6, 0)).toEqual({ hidden: [1, 2, 3, 4], shown: [0, 5] });
    expect(breadcrumbLayout(6, Infinity, 4)).toEqual({ hidden: [1, 2], shown: [0, 3, 4, 5] });
    expect(breadcrumbLayout(2, 0)).toEqual({ hidden: [], shown: [0, 1] });
  });

  for (const look of ["standard", "clean"]) {
    test(`${look}: a named nav with an ordered list; the last item is the current page, not a link`, async () => {
      const el = await make(900, html``, look);
      expect(el.dataset.ui).toBe("crumb");
      expect(el.dataset.look).toBe(look);
      const nav = el.querySelector(".ui-crumb__nav")!;
      expect(nav.tagName).toBe("NAV");
      expect(nav.getAttribute("aria-label")).toBe("Breadcrumb");
      expect(shownLabels(el)).toEqual(TRAIL.map((t) => t.label));
      const current = el.querySelector("[aria-current=page]")!;
      expect(text(current)).toBe("Survey of the north quay");
      expect(current.tagName).toBe("SPAN");
      expect(el.querySelector<HTMLAnchorElement>("a.ui-crumb__link")!.getAttribute("href")).toBe("#library");
      // An item with no href is a button
      expect(el.querySelector('[data-index="2"] button.ui-crumb__link')).not.toBeNull();
      expect(el.querySelectorAll(".ui-crumb__nav .ui-crumb__sep").length).toBe(5);
      expect(el.querySelector(".ui-crumb__icon")).not.toBeNull();
    });
  }

  test("tc-navigate carries the item and index; prevented, a link isn't followed", async () => {
    const el = await make();
    const seen: BreadcrumbNavigate[] = [];
    el.addEventListener("tc-navigate", (e) => {
      seen.push((e as CustomEvent<BreadcrumbNavigate>).detail);
      e.preventDefault();
    });
    const before = location.hash;
    el.querySelector<HTMLElement>('[data-index="1"] a')!.click();
    el.querySelector<HTMLElement>('[data-index="2"] button')!.click();
    expect(seen.map((s) => s.index)).toEqual([1, 2]);
    expect(seen[1].item.id).toBe("maritime");
    expect(location.hash).toBe(before);
  });

  test("unsafe hrefs aren't links", async () => {
    const el = await fixture<TcBreadcrumbs>(html`<tc-breadcrumbs .items=${[{ label: "Bad", href: "javascript:alert(1)" }, { label: "Here" }]}></tc-breadcrumbs>`);
    expect(el.querySelector("a")).toBeNull();
    expect(el.querySelector('[data-index="0"] button')).not.toBeNull();
  });

  test("narrow: the middle folds into “…”, which opens the folded items; keys move and Escape returns", async () => {
    const el = await make(360);
    await expect.poll(() => el.querySelector(".ui-crumb__more")).not.toBeNull();
    const shown = shownLabels(el);
    expect(shown[0]).toBe("Library");
    expect(shown[shown.length - 1]).toBe("Survey of the north quay");
    expect(shown.length).toBeLessThan(TRAIL.length);
    const more = el.querySelector<HTMLButtonElement>(".ui-crumb__more")!;
    const folded = TRAIL.length - shown.length;
    expect(text(more)).toBe(`Show ${folded} more`);
    expect(more.getAttribute("aria-expanded")).toBe("false");
    // Nothing overflows the nav
    const nav = el.querySelector<HTMLElement>(".ui-crumb__nav")!;
    expect(nav.scrollWidth).toBeLessThanOrEqual(nav.clientWidth + 1);
    more.focus();
    more.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 }));
    await settle();
    const menu = el.querySelector(".ui-crumb__menu")!;
    expect(more.getAttribute("aria-controls")).toBe(menu.id);
    const links = [...menu.querySelectorAll<HTMLElement>(".ui-crumb__menu-link")];
    expect(links.map(text)).toEqual(TRAIL.slice(1, 1 + folded).map((t) => t.label));
    await expect.poll(() => document.activeElement).toBe(links[0]);
    key(links[0], "ArrowDown");
    expect(document.activeElement).toBe(links[1] ?? links[0]);
    key(document.activeElement!, "Escape");
    await settle();
    expect(el.querySelector(".ui-crumb__menu")).toBeNull();
    expect(document.activeElement).toBe(more);
    // Widening shows everything again
    (el.parentElement as HTMLElement).style.width = "1200px";
    await expect.poll(() => shownLabels(el).length).toBe(TRAIL.length);
  });

  test("max folds even when there's room; a click outside closes the menu", async () => {
    const el = await fixture<TcBreadcrumbs>(html`<tc-breadcrumbs max="3" .items=${TRAIL}></tc-breadcrumbs>`);
    expect(shownLabels(el)).toEqual(["Library", "1920–1939", "Survey of the north quay"]);
    el.querySelector<HTMLButtonElement>(".ui-crumb__more")!.click();
    await settle();
    expect(el.querySelectorAll(".ui-crumb__menu-link").length).toBe(3);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-crumb__menu")).toBeNull();
  });

  test("copy-path: tc-copy with the trail as text; prevented, nothing is copied", async () => {
    const el = await fixture<TcBreadcrumbs>(html`<tc-breadcrumbs copy-path .items=${TRAIL.slice(0, 3)}></tc-breadcrumbs>`);
    const copies: string[] = [];
    el.addEventListener("tc-copy", (e) => {
      copies.push((e as CustomEvent<{ text: string }>).detail.text);
      e.preventDefault();
    });
    const btn = el.querySelector<HTMLButtonElement>(".ui-crumb__copy")!;
    expect(text(btn)).toBe("Copy path");
    btn.click();
    await settle();
    expect(copies).toEqual(["Library / Special collections / Maritime archive"]);
    expect(text(btn)).toBe("Copy path");
  });

  test("separator slash and an empty trail", async () => {
    const el = await fixture<TcBreadcrumbs>(html`<tc-breadcrumbs separator="slash" .items=${TRAIL.slice(0, 2)}></tc-breadcrumbs>`);
    expect(text(el.querySelector(".ui-crumb__nav .ui-crumb__sep"))).toBe("/");
    el.items = [];
    await settle();
    expect(el.querySelectorAll(".ui-crumb__nav .ui-crumb__item").length).toBe(0);
  });

  test("React wrapper: onNavigate gets the item, index and event; re-renders keep the trail", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: [string, number][] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(Breadcrumbs, {
        items: TRAIL.slice(0, 3),
        "data-n": n,
        onNavigate: (item, index, e) => {
          e.preventDefault();
          seen.push([item.label, index]);
        },
      } as React.ComponentProps<typeof Breadcrumbs>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-breadcrumbs")!;
    el.querySelector<HTMLElement>('[data-index="0"] a')!.click();
    await act(async () => bump());
    await settle();
    expect(seen).toEqual([["Library", 0]]);
    expect(shownLabels(el)).toEqual(["Library", "Special collections", "Maritime archive"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, full and folded with the menu open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px 16px 200px; background: var(--tc-surface-base); display: grid; gap: 16px; width: 420px">
        <tc-breadcrumbs copy-path .items=${TRAIL.slice(0, 3)}></tc-breadcrumbs>
        <tc-breadcrumbs look="clean" separator="slash" .items=${TRAIL.slice(0, 3)}></tc-breadcrumbs>
        <tc-breadcrumbs label="Archive trail" max="3" .items=${TRAIL}></tc-breadcrumbs>
        <tc-breadcrumbs look="clean" label="Clean archive trail" max="3" .items=${TRAIL}></tc-breadcrumbs>
      </div>`);
      const folded = wrap.querySelectorAll<TcBreadcrumbs>("tc-breadcrumbs")[3];
      folded.querySelector<HTMLButtonElement>(".ui-crumb__more")!.click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

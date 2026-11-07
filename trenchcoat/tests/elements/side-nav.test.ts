/*
 * <tc-side-nav> in real browsers: the landmark, brand and current page, links and buttons, sections and badges,
 * tc-navigate (prevented, and left to the browser on modifier clicks), disabled items, arrow keys, folding into a
 * rail, the page's children after the items, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/side-nav";
import { sideNavGroups, type SideNavCollapsedChange, type SideNavItem, type SideNavNavigate, type TcSideNav } from "../../src/elements/side-nav";
import { SideNav } from "../../src/elements/react/side-nav";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

function icon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", "M4 6h16M4 12h16");
  svg.append(p);
  return svg;
}

const ITEMS: SideNavItem[] = [
  { id: "home", label: "Overview", href: "#home", icon: icon() },
  { id: "portfolio", label: "Portfolio", href: "#portfolio", icon: icon(), badge: 12 },
  { id: "studies", label: "Studies", icon: icon() },
  { id: "team", label: "Team", href: "#team", icon: icon(), section: "Institute" },
  { id: "billing", label: "Billing", href: "#billing", icon: icon(), section: "Institute", disabled: true },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const link = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-index="${ITEMS.findIndex((i) => i.id === id)}"] .ui-snav__link`)!;
const make = (look = "standard", extra = html``) =>
  fixture<TcSideNav>(html`<tc-side-nav look=${look} brand="Halden Institute" brand-href="#home" current="portfolio" .items=${ITEMS} style="height: 480px">${extra}</tc-side-nav>`);

describe("tc-side-nav", () => {
  test("sideNavGroups starts a group wherever the section changes", () => {
    const groups = sideNavGroups(ITEMS);
    expect(groups.map((g) => [g.section, g.items.map((i) => i.index)])).toEqual([
      [undefined, [0, 1, 2]],
      ["Institute", [3, 4]],
    ]);
  });

  for (const look of ["standard", "clean"]) {
    test(`${look}: a named nav of links; the current item is aria-current; the brand links home`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("snav");
      expect(el.dataset.look).toBe(look);
      const nav = el.querySelector(".ui-snav__nav")!;
      expect(nav.tagName).toBe("NAV");
      expect(nav.getAttribute("aria-label")).toBe("Main");
      expect([...el.querySelectorAll(".ui-snav__label")].map(text)).toEqual(ITEMS.map((i) => i.label));
      const current = el.querySelectorAll("[aria-current=page]");
      expect(current.length).toBe(1);
      expect(text(current[0])).toBe("Portfolio 12");
      expect(link(el, "home").getAttribute("href")).toBe("#home");
      expect(link(el, "studies").tagName).toBe("BUTTON");
      expect(el.querySelector<HTMLAnchorElement>("a.ui-snav__brand")!.getAttribute("href")).toBe("#home");
      expect(text(el.querySelector(".ui-snav__brand"))).toBe("Halden Institute");
      // A section names its list
      const list = el.querySelectorAll(".ui-snav__list")[1];
      expect(text(document.getElementById(list.getAttribute("aria-labelledby")!))).toBe("Institute");
      expect(el.querySelectorAll(".ui-snav__icon svg").length).toBe(ITEMS.length);
    });
  }

  test("tc-navigate carries id, href and item; prevented, the link isn't followed and current stays", async () => {
    const el = await make();
    const seen: SideNavNavigate[] = [];
    el.addEventListener("tc-navigate", (e) => {
      seen.push((e as CustomEvent<SideNavNavigate>).detail);
      e.preventDefault();
    });
    const before = location.hash;
    link(el, "home").click();
    link(el, "studies").click();
    await settle();
    expect(seen.map((s) => [s.id, s.href])).toEqual([
      ["home", "#home"],
      ["studies", undefined],
    ]);
    expect(seen[0].item.label).toBe("Overview");
    expect(location.hash).toBe(before);
    expect(el.current).toBe("portfolio");
  });

  test("not prevented, the clicked item becomes current", async () => {
    const el = await make();
    link(el, "studies").click();
    await settle();
    expect(el.current).toBe("studies");
    expect(link(el, "studies").getAttribute("aria-current")).toBe("page");
    expect(link(el, "portfolio").hasAttribute("aria-current")).toBe(false);
  });

  test("a ⌘/Ctrl- or Shift-click is the browser's: no event", async () => {
    const el = await make();
    let fired = 0;
    el.addEventListener("tc-navigate", (e) => {
      fired++;
      e.preventDefault();
    });
    const a = link(el, "home");
    // Stop the browser from actually opening a tab or window
    a.addEventListener("click", (e) => e.preventDefault());
    for (const mod of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...mod }));
    expect(fired).toBe(0);
  });

  test("a disabled item can't be focused or chosen", async () => {
    const el = await make();
    let fired = 0;
    el.addEventListener("tc-navigate", () => fired++);
    const off = link(el, "billing");
    expect(off.getAttribute("aria-disabled")).toBe("true");
    expect(off.hasAttribute("href")).toBe(false);
    off.focus();
    expect(document.activeElement).not.toBe(off);
    off.click();
    expect(fired).toBe(0);
  });

  test("arrow keys, Home and End move between items, skipping disabled ones", async () => {
    const el = await make();
    link(el, "home").focus();
    key(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(link(el, "portfolio"));
    key(document.activeElement!, "End");
    expect(document.activeElement).toBe(link(el, "team"));
    key(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(link(el, "home"));
    key(document.activeElement!, "ArrowUp");
    expect(document.activeElement).toBe(link(el, "team"));
    key(document.activeElement!, "Home");
    expect(document.activeElement).toBe(link(el, "home"));
  });

  test("the page's children come after the items, and sit at the bottom", async () => {
    const el = await make("standard", html`<div class="promo">Review in 6 days <button type="button">Prep brief</button></div>`);
    const promo = el.querySelector(".promo")!;
    const nav = el.querySelector(".ui-snav__nav")!;
    expect(nav.compareDocumentPosition(promo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(el.querySelector(".ui-snav__head")!.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await finish(el);
    const box = el.getBoundingClientRect();
    expect(Math.round(box.bottom - promo.getBoundingClientRect().bottom)).toBeLessThan(40);
  });

  test("collapsible: the button folds it into a rail (cancelable); labels stay readable and show as tooltips", async () => {
    const el = await fixture<TcSideNav>(html`<tc-side-nav collapsible brand="Halden" .items=${ITEMS} current="home"><p class="promo">Hi</p></tc-side-nav>`);
    const toggle = el.querySelector<HTMLButtonElement>(".ui-snav__toggle")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const wide = el.getBoundingClientRect().width;
    const once = (e: Event) => e.preventDefault();
    el.addEventListener("tc-collapsed-change", once, { once: true });
    toggle.click();
    await settle();
    expect(el.collapsed).toBe(false);
    const seen: SideNavCollapsedChange[] = [];
    el.addEventListener("tc-collapsed-change", (e) => seen.push((e as CustomEvent<SideNavCollapsedChange>).detail));
    toggle.click();
    await settle();
    await finish(el);
    expect(seen).toEqual([{ collapsed: true }]);
    expect(el.hasAttribute("collapsed")).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await expect.poll(() => el.getBoundingClientRect().width).toBeLessThan(wide / 2);
    expect(link(el, "portfolio").getAttribute("title")).toBe("Portfolio (12)");
    expect(text(link(el, "portfolio"))).toBe("Portfolio 12");
    expect(getComputedStyle(el.querySelector(".promo")!).display).toBe("none");
    expect(text(el.querySelector("[role=status]"))).toBe("Navigation collapsed");
  });

  test("an item without an icon shows its first letter; no brand, no head content", async () => {
    const el = await fixture<TcSideNav>(html`<tc-side-nav .items=${[{ id: "a", label: "Archive" }]}></tc-side-nav>`);
    expect(text(el.querySelector(".ui-snav__initial"))).toBe("A");
    expect(el.querySelector(".ui-snav__brand")).toBeNull();
    el.items = [];
    await settle();
    expect(el.querySelectorAll(".ui-snav__link").length).toBe(0);
  });

  test("unsafe hrefs aren't links", async () => {
    const el = await fixture<TcSideNav>(html`<tc-side-nav .items=${[{ id: "x", label: "Bad", href: "javascript:alert(1)" }]}></tc-side-nav>`);
    expect(el.querySelector("a.ui-snav__link")).toBeNull();
    expect(el.querySelector("button.ui-snav__link")).not.toBeNull();
  });

  test("React wrapper: a prevented navigate keeps current across re-renders; a controlled current holds", async () => {
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
        React.createElement(SideNav, { id: "free", items: ITEMS, defaultCurrent: "home", "data-n": n, onNavigate: (id: string, _href: string | undefined, e: Event) => (e.preventDefault(), seen.push(id)) } as React.ComponentProps<typeof SideNav>),
        React.createElement(SideNav, { id: "held", items: ITEMS, current: "home", "data-n": n } as React.ComponentProps<typeof SideNav>),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const free = host.querySelector<TcSideNav>("#free")!;
    // Prevented: the router took it, so current doesn't move
    link(free, "portfolio").click();
    await act(async () => bump());
    await settle();
    expect(seen).toEqual(["portfolio"]);
    expect(free.current).toBe("home");
    // A button item, not prevented by a handler: it becomes current and survives a re-render
    const held = host.querySelector<TcSideNav>("#held")!;
    expect(held.current).toBe("home");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, open and as a rail`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="display: flex; gap: 16px; height: 420px; background: var(--tc-surface-base)">
        <tc-side-nav brand="Halden" brand-href="#home" current="portfolio" collapsible .items=${ITEMS}><p>Review in 6 days</p></tc-side-nav>
        <tc-side-nav look="clean" label="Clean main" brand="Halden" current="portfolio" collapsible .items=${ITEMS}></tc-side-nav>
        <tc-side-nav label="Rail" collapsed collapsible current="portfolio" .items=${ITEMS}></tc-side-nav>
        <tc-side-nav look="clean" label="Clean rail" collapsed current="team" .items=${ITEMS}></tc-side-nav>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

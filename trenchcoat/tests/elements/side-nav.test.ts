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
import { SIDE_NAV_BRAND_ID, sideNavGroups, type SideNavCollapsedChange, type SideNavItem, type SideNavNavigate, type TcSideNav } from "../../src/elements/side-nav";
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

  test("the linked brand fires tc-navigate as id \"brand\"; modifier clicks are the browser's; current stays", async () => {
    const el = await make();
    const seen: SideNavNavigate[] = [];
    el.addEventListener("tc-navigate", (e) => {
      seen.push((e as CustomEvent<SideNavNavigate>).detail);
      e.preventDefault();
    });
    const before = location.hash;
    const brand = el.querySelector<HTMLAnchorElement>("a.ui-snav__brand")!;
    brand.click();
    expect(seen).toEqual([{ id: SIDE_NAV_BRAND_ID, href: "#home", item: { id: "brand", label: "Halden Institute", href: "#home" }, brand: true }]);
    expect(location.hash).toBe(before);
    brand.addEventListener("click", (e) => e.preventDefault());
    for (const mod of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) brand.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...mod }));
    expect(seen.length).toBe(1);
    expect(el.current).toBe("portfolio");
  });

  test("not prevented, the brand leaves current alone", async () => {
    const el = await make();
    const brand = el.querySelector<HTMLAnchorElement>("a.ui-snav__brand")!;
    // Keep the browser from following it; the element's own handler still sees an unprevented event first
    el.addEventListener("click", (e) => e.preventDefault());
    brand.click();
    await settle();
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

  test("--tc-snav-item-gap and --tc-snav-item-height space the items, open and as a rail", async () => {
    const el = await fixture<TcSideNav>(html`<tc-side-nav brand="Intellect" collapsible .items=${ITEMS} style="--tc-snav-item-gap: 10px; --tc-snav-item-height: 44px"></tc-side-nav>`);
    const links = () => [...el.querySelectorAll<HTMLElement>(".ui-snav__link")];
    for (const collapsed of [false, true]) {
      el.collapsed = collapsed;
      await settle();
      const [a, b] = links().map((l) => l.getBoundingClientRect());
      expect(a.height, `collapsed ${collapsed}`).toBeCloseTo(44, 0);
      expect(b.top - a.bottom, `collapsed ${collapsed}`).toBeCloseTo(10, 0);
    }
    // The rail still centres each icon
    const link = links()[0].getBoundingClientRect();
    const icon = links()[0].querySelector(".ui-snav__icon")!.getBoundingClientRect();
    expect(icon.left + icon.width / 2).toBeCloseTo(link.left + link.width / 2, 0);
    // Unset, the defaults are as before
    el.removeAttribute("style");
    el.collapsed = false;
    await settle();
    const probe = document.createElement("div");
    probe.style.cssText = "height: var(--tc-control-h-md)";
    el.append(probe);
    expect(links()[0].getBoundingClientRect().height).toBeCloseTo(probe.getBoundingClientRect().height, 0);
    probe.remove();
  });

  test("a large brand name isn't clipped: its line height follows its own size, not the bar's", async () => {
    const el = await fixture<TcSideNav>(html`<tc-side-nav brand="Intellect" brand-href="#home" .items=${ITEMS} style="line-height: 16px; --tc-snav-brand-size: 48px"></tc-side-nav>`);
    const name = el.querySelector<HTMLElement>(".ui-snav__brand-name")!;
    expect(parseFloat(getComputedStyle(name).fontSize)).toBeCloseTo(48, 0);
    expect(parseFloat(getComputedStyle(name).lineHeight)).toBeCloseTo(48 * 1.2, 0);
    expect(name.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    expect(name.scrollHeight).toBeLessThanOrEqual(name.clientHeight + 1);
    expect(getComputedStyle(name).textOverflow).toBe("ellipsis");
  });

  test("the page sizes the brand: name size and weight, logo box; defaults keep today's look; the rail centres a capped logo", async () => {
    const logo = () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.innerHTML = '<rect width="24" height="24"></rect>';
      return svg;
    };
    const box = (el: Element, sel: string) => el.querySelector(sel)!.getBoundingClientRect();
    const plain = await fixture<TcSideNav>(html`<tc-side-nav brand="Intellect" brand-href="#home" collapsible .brandIcon=${logo()} .items=${ITEMS}></tc-side-nav>`);
    const name = (el: Element) => getComputedStyle(el.querySelector(".ui-snav__brand-name")!);
    expect(name(plain).fontSize).toBe(getComputedStyle(plain).fontSize);
    const weight = (token: string) => {
      const probe = document.createElement("span");
      probe.style.fontWeight = `var(${token})`;
      plain.append(probe);
      const w = getComputedStyle(probe).fontWeight;
      probe.remove();
      return w;
    };
    expect(name(plain).fontWeight).toBe(weight("--tc-font-weight-semibold"));
    expect(box(plain, ".ui-snav__logo").width).toBeCloseTo(28, 0);
    expect(box(plain, ".ui-snav__logo").height).toBeCloseTo(28, 0);

    // What INTELLECT sets: an xl name and a 32px logo, beside the collapse button at the default width
    const el = await fixture<TcSideNav>(html`<tc-side-nav
      brand="Intellect"
      brand-href="#home"
      collapsible
      .brandIcon=${logo()}
      .items=${ITEMS}
      style="--tc-snav-brand-size: var(--tc-font-size-xl); --tc-snav-brand-weight: var(--tc-font-weight-strong); --tc-snav-logo-size: 32px"
    ></tc-side-nav>`);
    const size = (token: string) => {
      const probe = document.createElement("span");
      probe.style.fontSize = `var(${token})`;
      el.append(probe);
      const v = getComputedStyle(probe).fontSize;
      probe.remove();
      return v;
    };
    expect(name(el).fontSize).toBe(size("--tc-font-size-xl"));
    expect(name(el).fontWeight).toBe(weight("--tc-font-weight-strong"));
    expect(box(el, ".ui-snav__logo").width).toBeCloseTo(32, 0);
    expect(box(el, ".ui-snav__logo").height).toBeCloseTo(32, 0);
    const brandName = el.querySelector<HTMLElement>(".ui-snav__brand-name")!;
    expect(brandName.scrollWidth).toBeLessThanOrEqual(brandName.clientWidth);
    expect(box(el, ".ui-snav__brand").right).toBeLessThanOrEqual(box(el, ".ui-snav__toggle").left);
    expect(box(el, ".ui-snav__toggle").right).toBeLessThanOrEqual(el.getBoundingClientRect().right);

    // Folded into the rail, the 32px logo is whole and centred; a logo bigger than the rail is capped at its inner width
    el.collapsed = true;
    await finish(el);
    // The width animates to the rail; measure once it's there
    await expect.poll(() => el.getBoundingClientRect().width).toBeCloseTo(parseFloat(getComputedStyle(el).getPropertyValue("--tc-snav-rail")), 0);
    const rail = el.getBoundingClientRect();
    const mark = box(el, ".ui-snav__logo");
    expect(mark.width).toBeCloseTo(32, 0);
    expect(Math.abs(mark.left + mark.width / 2 - (rail.left + rail.width / 2))).toBeLessThanOrEqual(1);
    expect(mark.left).toBeGreaterThanOrEqual(rail.left);
    expect(mark.right).toBeLessThanOrEqual(rail.right);
    el.style.setProperty("--tc-snav-logo-size", "80px");
    await settle();
    const capped = box(el, ".ui-snav__logo");
    const pad = parseFloat(getComputedStyle(el).paddingLeft) + parseFloat(getComputedStyle(el).paddingRight);
    expect(capped.width).toBeCloseTo(rail.width - pad, 0);
    expect(capped.height).toBeCloseTo(capped.width, 0);
    expect(capped.left).toBeGreaterThanOrEqual(rail.left);
    expect(capped.right).toBeLessThanOrEqual(rail.right);
  });

  test("--tc-snav-head-gap sets only the space under the head, open and as a rail; by default it's the bar's gap", async () => {
    const space = (el: Element, token: string) => {
      const probe = document.createElement("span");
      probe.style.width = `var(${token})`;
      probe.style.position = "absolute";
      el.append(probe);
      const w = probe.getBoundingClientRect().width;
      probe.remove();
      return w;
    };
    const under = (el: Element) => el.querySelector(".ui-snav__nav")!.getBoundingClientRect().top - el.querySelector(".ui-snav__head")!.getBoundingClientRect().bottom;
    const between = (el: Element) => el.querySelector("p")!.getBoundingClientRect().top - el.querySelector(".ui-snav__nav")!.getBoundingClientRect().bottom;
    const plain = await fixture<TcSideNav>(html`<tc-side-nav brand="Intellect" collapsible .items=${ITEMS} style="height: 480px"><p>Footer</p></tc-side-nav>`);
    expect(under(plain)).toBeCloseTo(space(plain, "--tc-space-2"), 0);
    const gap = between(plain);

    const el = await fixture<TcSideNav>(html`<tc-side-nav brand="Intellect" collapsible .items=${ITEMS} style="height: 480px; --tc-snav-head-gap: var(--tc-space-6)"><p>Footer</p></tc-side-nav>`);
    const six = space(el, "--tc-space-6");
    expect(under(el)).toBeCloseTo(six, 0);
    // The bar's other gaps stay as they were
    expect(between(el)).toBeCloseTo(gap, 0);
    // (The rail hides the page's children, so the token is measured above)
    el.collapsed = true;
    await finish(el);
    expect(under(el)).toBeCloseTo(six, 0);
    // Smaller than the bar's gap works too
    el.style.setProperty("--tc-snav-head-gap", "0px");
    await settle();
    expect(under(el)).toBeCloseTo(0, 0);
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

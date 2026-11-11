/* <tc-menu-morph> in real browsers: the menu button pattern's ARIA, opening and closing by pointer and keys, the morph, placement, focus, controlled use, React and axe. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/menu-morph";
import type { TcMenuMorph } from "../../src/elements/menu-morph";
import { MenuMorph } from "../../src/elements/react/menu-morph";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const menu = (open = false) =>
  fixture<TcMenuMorph>(html`<tc-menu-morph ?open=${open}>
    <button type="button" data-menu-trigger>Actions</button>
    <div data-menu aria-label="Finding actions">
      <button type="button" role="menuitem">Assign reviewer</button>
      <button type="button" role="menuitem">Request evidence</button>
      <button type="button" role="menuitem" data-keep-open>Pin</button>
      <button type="button" role="menuitem">Export finding</button>
    </div>
  </tc-menu-morph>`);
const trigger = (el: Element) => el.querySelector<HTMLButtonElement>("[data-menu-trigger]")!;
const panel = (el: Element) => el.querySelector<HTMLElement>("[data-menu]")!;
const items = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="menuitem"]')];
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const reduce = () => {
  const original = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation((q: string) => (q.includes("reduced-motion") ? ({ matches: true } as MediaQueryList) : original.call(window, q)));
};

describe("tc-menu-morph", () => {
  test("wires the menu button pattern: haspopup, expanded, controls, role=menu, items out of the tab order", async () => {
    const el = await menu();
    expect(el.dataset.ui).toBe("mmo");
    const t = trigger(el);
    const p = panel(el);
    expect(t.getAttribute("aria-haspopup")).toBe("menu");
    expect(t.getAttribute("aria-expanded")).toBe("false");
    expect(t.getAttribute("aria-controls")).toBe(p.id);
    expect(p.getAttribute("role")).toBe("menu");
    expect(p.hidden).toBe(true);
    expect(items(el).every((i) => i.tabIndex === -1)).toBe(true);
  });

  test("a panel without a label is labelled by its trigger", async () => {
    const el = await fixture<TcMenuMorph>(html`<tc-menu-morph><button data-menu-trigger>More</button><div data-menu><button role="menuitem">Copy</button></div></tc-menu-morph>`);
    expect(panel(el).getAttribute("aria-labelledby")).toBe(trigger(el).id);
  });

  test("a click opens it below the trigger, morphing out of it, without moving focus; a second click closes it", async () => {
    const el = await menu();
    const events: boolean[] = [];
    el.addEventListener("tc-open-change", (e) => events.push((e as CustomEvent).detail.open));
    await userEvent.click(trigger(el));
    await settle();
    expect(events).toEqual([true]);
    expect(el.open).toBe(true);
    expect(trigger(el).getAttribute("aria-expanded")).toBe("true");
    expect(panel(el).hidden).toBe(false);
    expect(panel(el).dataset.side).toBe("bottom");
    expect(panel(el).getAnimations().length).toBeGreaterThan(0);
    await finish(panel(el));
    expect(panel(el).getBoundingClientRect().top).toBeGreaterThanOrEqual(trigger(el).getBoundingClientRect().bottom);
    // A pointer leaves focus where it was (WebKit doesn't focus a clicked button at all)
    expect(panel(el).contains(document.activeElement)).toBe(false);
    await userEvent.click(trigger(el));
    await settle();
    expect(el.open).toBe(false);
    await expect.poll(() => panel(el).hidden, { timeout: 3000 }).toBe(true);
  });

  test("↓ on the trigger opens on the first item, ↑ on the last; arrows wrap, Home/End and a letter move", async () => {
    const el = await menu();
    trigger(el).focus();
    key(trigger(el), "ArrowDown");
    await settle();
    const [a, b, , d] = items(el);
    expect(document.activeElement).toBe(a);
    expect(a.tabIndex).toBe(0);
    key(a, "ArrowUp");
    expect(document.activeElement).toBe(d);
    key(d, "ArrowDown");
    expect(document.activeElement).toBe(a);
    key(a, "End");
    expect(document.activeElement).toBe(d);
    key(d, "Home");
    expect(document.activeElement).toBe(a);
    key(a, "r");
    expect(document.activeElement).toBe(b);
    key(b, "Escape");
    await settle();
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(trigger(el));
    key(trigger(el), "ArrowUp");
    await settle();
    expect(document.activeElement).toBe(d);
  });

  test("Enter on the trigger opens it on the first item", async () => {
    const el = await menu();
    trigger(el).focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(el.open).toBe(true);
    expect(document.activeElement).toBe(items(el)[0]);
  });

  test("choosing an item closes the menu and returns focus; data-keep-open keeps it open", async () => {
    const el = await menu();
    trigger(el).focus();
    key(trigger(el), "ArrowDown");
    await settle();
    items(el)[2].click();
    await settle();
    expect(el.open).toBe(true);
    items(el)[1].focus();
    items(el)[1].click();
    await settle();
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(trigger(el));
  });

  test("a pointer-down outside closes it; preventDefault keeps it open", async () => {
    const el = await menu(true);
    expect(el.open).toBe(true);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await settle();
    expect(el.open).toBe(false);
    el.open = true;
    await settle();
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await settle();
    expect(el.open).toBe(true);
  });

  test("Tab from an item closes it", async () => {
    const el = await menu();
    trigger(el).focus();
    key(trigger(el), "ArrowDown");
    await settle();
    key(items(el)[0], "Tab");
    await settle();
    expect(el.open).toBe(false);
  });

  test("with no room below it opens above, still from the trigger", async () => {
    const el = await fixture<TcMenuMorph>(html`<tc-menu-morph style="position: fixed; bottom: 4px; left: 20px">
      <button type="button" data-menu-trigger>Actions</button>
      <div data-menu aria-label="Actions"><button role="menuitem">One</button><button role="menuitem">Two</button><button role="menuitem">Three</button></div>
    </tc-menu-morph>`);
    el.open = true;
    await settle();
    await finish(panel(el));
    expect(panel(el).dataset.side).toBe("top");
    expect(panel(el).getBoundingClientRect().bottom).toBeLessThanOrEqual(trigger(el).getBoundingClientRect().top);
  });

  test("closing shrinks it back before it hides; nothing is left on the panel afterwards", async () => {
    const el = await menu(true);
    await finish(panel(el));
    el.open = false;
    await settle();
    expect(panel(el).hidden).toBe(false);
    expect(panel(el).getAnimations().length).toBeGreaterThan(0);
    await expect.poll(() => panel(el).hidden, { timeout: 3000 }).toBe(true);
    expect(panel(el).getAnimations()).toHaveLength(0);
  });

  test("with reduced motion it opens and closes without the morph", async () => {
    reduce();
    const el = await menu();
    el.open = true;
    await settle();
    expect(panel(el).hidden).toBe(false);
    expect(panel(el).getAnimations()).toHaveLength(0);
    el.open = false;
    await settle();
    expect(panel(el).hidden).toBe(true);
  });

  test("starting open shows the menu without taking focus", async () => {
    const el = await menu(true);
    expect(panel(el).hidden).toBe(false);
    expect(el.contains(document.activeElement)).toBe(false);
  });

  test("removed while open, it leaves the page alone", async () => {
    const el = await menu(true);
    el.remove();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    expect(panel(el).hidden).toBe(true);
  });

  test("React: uncontrolled survives re-renders; controlled stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const kids = [React.createElement("button", { key: "t", type: "button", "data-menu-trigger": "" }, "Actions"), React.createElement("div", { key: "m", "data-menu": "", "aria-label": "Actions" }, React.createElement("button", { type: "button", role: "menuitem" }, "Export"))];
    await act(async () => root.render(React.createElement(MenuMorph, { defaultOpen: false }, kids)));
    await settle();
    let el = host.querySelector<TcMenuMorph>("tc-menu-morph")!;
    await act(async () => trigger(el).click());
    await settle();
    expect(el.open).toBe(true);
    await act(async () => root.render(React.createElement(MenuMorph, { defaultOpen: false, title: "again" }, kids)));
    await settle();
    expect(el.open).toBe(true);

    const seen: boolean[] = [];
    await act(async () => root.render(React.createElement(MenuMorph, { key: "c", open: false, onOpenChange: (o: boolean) => seen.push(o) }, kids)));
    await settle();
    el = host.querySelector<TcMenuMorph>("tc-menu-morph")!;
    await act(async () => trigger(el).click());
    await settle();
    expect(seen).toEqual([true]);
    expect(el.open).toBe(false);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const theme of ["light", "dark"]) {
    test(`axe (${theme}): no violations, shut and open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme}><tc-menu-morph>
        <button type="button" data-menu-trigger>Actions</button>
        <div data-menu aria-label="Finding actions"><button type="button" role="menuitem">Assign reviewer</button><button type="button" role="menuitem">Export finding</button></div>
      </tc-menu-morph></div>`);
      expect((await axe.run(wrap)).violations.map((v) => v.id)).toEqual([]);
      const el = wrap.querySelector<TcMenuMorph>("tc-menu-morph")!;
      el.open = true;
      await settle();
      await finish(wrap);
      expect((await axe.run(wrap)).violations.map((v) => v.id)).toEqual([]);
    });
  }
});

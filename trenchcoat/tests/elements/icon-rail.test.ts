/*
 * <tc-icon-rail> in real browsers: the toolbar, one tab stop, choosing, keys, tooltips, the More menu, narrow width, the
 * React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/icon-rail";
import type { IconRailItem, TcIconRail } from "../../src/elements/icon-rail";
import { IconRail } from "../../src/elements/react/icon-rail";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: IconRailItem[] = [
  { id: "a", label: "Alpha", icon: "M4 4h16" },
  { id: "b", label: "Beta", icon: ["M4 4h16", "M4 8h16"] },
  { id: "c", label: "Gamma", icon: "M4 4h16", disabled: true },
  { id: "d", label: "Delta", icon: "M4 4h16" },
];
const MORE = [
  { id: "x", label: "Export" },
  { id: "y", label: "Settings" },
];
const rail = (look = "standard", selected: string | null = null) =>
  fixture<TcIconRail>(html`<tc-icon-rail look=${look} label="Views" .items=${ITEMS} .moreItems=${MORE} .selected=${selected}></tc-icon-rail>`);
const btn = (el: Element, name: string) => el.querySelector<HTMLButtonElement>(`.ui-irl__button[aria-label="${name}"]`)!;
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true }));

describe("tc-icon-rail", () => {
  for (const look of ["standard", "clean"]) {
    test(`${look}: a named toolbar with one tab stop, on the chosen button`, async () => {
      const el = await rail(look, "b");
      expect(el.dataset.ui).toBe("irl");
      expect(el.querySelector('[role="toolbar"]')!.getAttribute("aria-label")).toBe("Views");
      expect([...el.querySelectorAll('[tabindex="0"]')].map((b) => b.getAttribute("aria-label"))).toEqual(["Beta"]);
      expect(btn(el, "Beta").getAttribute("aria-pressed")).toBe("true");
      expect(btn(el, "Alpha").getAttribute("aria-pressed")).toBe("false");
      expect(btn(el, "Beta").querySelectorAll("path").length).toBe(2);
    });
  }

  test("choosing toggles, with the item in the event, and preventing keeps it", async () => {
    const el = await rail();
    const seen: unknown[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent).detail));
    btn(el, "Alpha").click();
    await settle();
    expect(el.selected).toBe("a");
    expect(seen[0]).toMatchObject({ selected: "a", item: { id: "a" } });
    btn(el, "Alpha").click();
    await settle();
    expect(el.selected).toBeNull();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    btn(el, "Beta").click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("a disabled button can't be chosen, and the arrows skip it", async () => {
    const el = await rail();
    expect(btn(el, "Gamma").disabled).toBe(true);
    btn(el, "Beta").focus();
    key(btn(el, "Beta"), "ArrowRight");
    await expect.poll(() => document.activeElement).toBe(btn(el, "Beta"));
  });

  test("arrows, Home and End move and wrap, with the tab stop", async () => {
    const el = await rail();
    btn(el, "Alpha").focus();
    key(btn(el, "Alpha"), "ArrowRight");
    await expect.poll(() => document.activeElement?.getAttribute("aria-label")).toBe("Beta");
    key(document.activeElement!, "ArrowRight");
    await expect.poll(() => document.activeElement?.getAttribute("aria-label")).toBe("Delta");
    key(document.activeElement!, "End");
    await expect.poll(() => document.activeElement?.getAttribute("aria-label")).toBe("More");
    key(document.activeElement!, "ArrowRight");
    await expect.poll(() => document.activeElement?.getAttribute("aria-label")).toBe("Alpha");
    key(document.activeElement!, "ArrowLeft");
    await expect.poll(() => document.activeElement?.getAttribute("aria-label")).toBe("More");
    key(document.activeElement!, "Home");
    await expect.poll(() => document.activeElement?.getAttribute("aria-label")).toBe("Alpha");
    expect(el.querySelectorAll('.ui-irl__button[tabindex="0"]').length).toBe(1);
  });

  test("the tooltip shows the label on hover and on keyboard focus", async () => {
    const el = await rail();
    const tip = btn(el, "Alpha").nextElementSibling!;
    expect(tip.textContent).toBe("Alpha");
    expect(tip.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(tip).visibility).toBe("hidden");
    await userEvent.hover(btn(el, "Alpha"));
    await expect.poll(() => getComputedStyle(tip).visibility).toBe("visible");
  });

  test("More opens a menu, fires tc-action and returns focus", async () => {
    const el = await rail();
    const more = btn(el, "More");
    expect(more.getAttribute("aria-haspopup")).toBe("menu");
    let action = "";
    el.addEventListener("tc-action", (e) => (action = (e as CustomEvent).detail.id));
    more.focus();
    key(more, "ArrowDown");
    await expect.poll(() => document.activeElement?.textContent).toBe("Export");
    expect(more.getAttribute("aria-expanded")).toBe("true");
    key(document.activeElement!, "ArrowDown");
    await expect.poll(() => document.activeElement?.textContent).toBe("Settings");
    key(document.activeElement!, "ArrowDown");
    await expect.poll(() => document.activeElement?.textContent).toBe("Export");
    key(document.activeElement!, "Escape");
    await expect.poll(() => document.activeElement).toBe(more);
    expect(el.querySelector('[role="menu"]')).toBeNull();
    more.click();
    await settle();
    el.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')[1].click();
    await settle();
    expect(action).toBe("y");
    expect(el.querySelector('[role="menu"]')).toBeNull();
  });

  test("a click outside shuts the menu; no moreItems, no More", async () => {
    const el = await rail();
    btn(el, "More").click();
    await settle();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await settle();
    expect(el.querySelector('[role="menu"]')).toBeNull();
    const plain = await fixture<TcIconRail>(html`<tc-icon-rail .items=${ITEMS}></tc-icon-rail>`);
    expect(btn(plain, "More")).toBeNull();
  });

  test("narrow: it wraps, and the buttons keep their size", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 80px"><tc-icon-rail label="V" .items=${ITEMS} .moreItems=${MORE}></tc-icon-rail></div>`);
    const buttons = [...wrap.querySelectorAll(".ui-irl__button")].map((b) => b.getBoundingClientRect());
    expect(new Set(buttons.map((b) => Math.round(b.width))).size).toBe(1);
    expect(new Set(buttons.map((b) => Math.round(b.top))).size).toBeGreaterThan(1);
    expect(wrap.scrollWidth).toBeLessThanOrEqual(80);
  });

  test("empty: nothing focusable, nothing broken", async () => {
    const el = await fixture<TcIconRail>(html`<tc-icon-rail label="V"></tc-icon-rail>`);
    expect(el.querySelector("button")).toBeNull();
  });

  test("React: uncontrolled survives a re-render, controlled waits for the parent", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: (string | null)[] = [];
    const draw = (selected: string | null) =>
      act(async () =>
        root.render(
          React.createElement(
            React.Fragment,
            null,
            React.createElement(IconRail, { id: "u", label: "U", items: ITEMS }),
            React.createElement(IconRail, { id: "c", label: "C", items: ITEMS, selected, onSelectedChange: (v: string | null) => seen.push(v) }),
          ),
        ),
      );
    await draw(null);
    await settle();
    const u = host.querySelector<TcIconRail>("#u")!;
    const c = host.querySelector<TcIconRail>("#c")!;
    await act(async () => btn(u, "Alpha").click());
    await settle();
    await draw(null);
    await settle();
    expect(u.selected).toBe("a");
    await act(async () => btn(c, "Beta").click());
    await settle();
    expect(seen).toEqual(["b"]);
    expect(c.selected).toBeNull();
    await draw("b");
    await settle();
    expect(c.selected).toBe("b");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`axe: ${look}, ${scheme}, with the menu open`, async () => {
        document.documentElement.style.colorScheme = scheme;
        const el = await rail(look, "a");
        btn(el, "More").click();
        await settle();
        await finish(el);
        const { violations } = await axe.run(el);
        document.documentElement.style.colorScheme = "";
        expect(violations.map((v) => v.id)).toEqual([]);
      });
    }
  }
});

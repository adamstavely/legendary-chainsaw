/*
 * <tc-session-tabs> in real browsers: the tablist and its one tab stop, status and unread in words, opening and closing
 * with their cancelable events, moving by keys and by drag, the more menu for tabs out of view, the React wrapper and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/session-tabs";
import type { SessionTab, TcSessionTabs } from "../../src/elements/session-tabs";
import { SessionTabs } from "../../src/elements/react/session-tabs";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const TABS: SessionTab[] = [
  { id: "q3", title: "Q3 reconciliation" },
  { id: "vendor", title: "Vendor risk summary", status: "running" },
  { id: "ledger", title: "Ledger variance", status: "waiting", unread: true },
  { id: "travel", title: "Travel sampling", status: "failed", closable: false },
];
const make = (look: "standard" | "clean" = "standard", width = 720) =>
  fixture<TcSessionTabs>(html`<div style="width: ${width}px"><tc-session-tabs look=${look} active="q3" .tabs=${TABS}></tc-session-tabs></div>`).then((w) => w.querySelector("tc-session-tabs")!);
const ids = (el: Element) => [...el.querySelectorAll<HTMLElement>("[data-tab]")].map((t) => t.dataset.tab);
const tab = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-tab="${id}"] [role="tab"]`)!;
const key = (k: string, extra: KeyboardEventInit = {}) => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...extra }));
const focusedTab = () => (document.activeElement as HTMLElement).closest<HTMLElement>("[data-tab]")?.dataset.tab;

describe("tc-session-tabs", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a tablist with one tab stop, the open tab selected`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("stab");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector('[role="tablist"]')!;
      expect(list.getAttribute("aria-label")).toBe("Open chats");
      expect(list.querySelectorAll('[role="tab"]')).toHaveLength(4);
      expect(el.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(tab(el, "q3").getAttribute("aria-selected")).toBe("true");
      expect(tab(el, "vendor").getAttribute("aria-selected")).toBe("false");
    });
  }

  test("status and unread in words; the whole title in the tooltip; idle says nothing", async () => {
    const el = await make();
    expect(tab(el, "ledger").querySelector(".tc-sr-only")!.textContent).toBe(", Needs you, unread");
    expect(tab(el, "vendor").querySelector(".tc-sr-only")!.textContent).toBe(", Running");
    expect(tab(el, "q3").querySelector(".tc-sr-only")).toBeNull();
    expect(tab(el, "ledger").title).toBe("Ledger variance");
    expect(el.querySelector('[data-tab="ledger"] .ui-stab__unread')).not.toBeNull();
    expect(el.querySelector('[data-tab="travel"] .ui-stab__close')).toBeNull();
  });

  test("clicking opens, unless prevented", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-active-change", (e) => seen.push((e as CustomEvent).detail.active));
    tab(el, "vendor").click();
    await settle();
    expect(el.active).toBe("vendor");
    el.addEventListener("tc-active-change", (e) => e.preventDefault(), { once: true });
    tab(el, "ledger").click();
    await settle();
    expect(el.active).toBe("vendor");
    expect(seen).toEqual(["vendor", "ledger"]);
  });

  test("keyboard: arrows wrap, Home and End, Enter opens, Delete closes", async () => {
    const el = await make();
    tab(el, "q3").focus();
    key("ArrowLeft");
    await expect.poll(focusedTab).toBe("travel");
    key("Home");
    await expect.poll(focusedTab).toBe("q3");
    key("ArrowRight");
    await expect.poll(focusedTab).toBe("vendor");
    expect(el.active).toBe("q3");
    key("Enter");
    await settle();
    expect(el.active).toBe("vendor");
    const closed: string[] = [];
    el.addEventListener("tc-close", (e) => closed.push((e as CustomEvent).detail.id));
    key("Delete");
    await settle();
    expect(closed).toEqual(["vendor"]);
    // The open tab closing opens its neighbour, and focus goes there
    expect(el.active).toBe("ledger");
    await expect.poll(focusedTab).toBe("ledger");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Closed Vendor risk summary");
    expect(el.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  test("a prevented close keeps everything; an unclosable tab ignores Delete", async () => {
    const el = await make();
    el.addEventListener("tc-close", (e) => e.preventDefault());
    el.querySelector<HTMLElement>('[data-tab="q3"] .ui-stab__close')!.click();
    await settle();
    expect(el.active).toBe("q3");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("");
    const seen: string[] = [];
    el.addEventListener("tc-close", () => seen.push("close"));
    tab(el, "travel").focus();
    key("Delete");
    await settle();
    expect(seen).toEqual([]);
  });

  test("Alt+Shift+arrows move a tab, announce it, and can be prevented", async () => {
    const el = await make();
    const seen: string[][] = [];
    el.addEventListener("tc-order-change", (e) => seen.push((e as CustomEvent).detail.order));
    tab(el, "q3").focus();
    key("ArrowRight", { altKey: true, shiftKey: true });
    await settle();
    expect(ids(el)).toEqual(["vendor", "q3", "ledger", "travel"]);
    expect(el.order).toEqual(["vendor", "q3", "ledger", "travel"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Moved Q3 reconciliation to position 2 of 4");
    await expect.poll(focusedTab).toBe("q3");
    el.addEventListener("tc-order-change", (e) => e.preventDefault(), { once: true });
    key("ArrowRight", { altKey: true, shiftKey: true });
    await settle();
    expect(ids(el)).toEqual(["vendor", "q3", "ledger", "travel"]);
    expect(seen).toHaveLength(2);
  });

  test("dragging a tab past another moves it, and the drag isn't a click", async () => {
    const el = await make();
    const q3 = el.querySelector<HTMLElement>('[data-tab="q3"]')!;
    const ledger = el.querySelector<HTMLElement>('[data-tab="ledger"]')!.getBoundingClientRect();
    const start = q3.getBoundingClientRect();
    const opened: string[] = [];
    el.addEventListener("tc-active-change", (e) => opened.push((e as CustomEvent).detail.active));
    const at = (type: string, x: number) => q3.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 7, button: 0, clientX: x, clientY: start.top + 4 }));
    at("pointerdown", start.left + 10);
    at("pointermove", start.left + 40);
    at("pointermove", ledger.left + ledger.width * 0.75);
    await settle();
    expect(q3.hasAttribute("data-dragging")).toBe(true);
    at("pointerup", ledger.left + ledger.width * 0.75);
    tab(el, "q3").click();
    await settle();
    expect(ids(el)).toEqual(["vendor", "ledger", "q3", "travel"]);
    expect(opened).toEqual([]);
  });

  test("narrow: tabs out of view go in the more menu, which opens one", async () => {
    const tabs = Array.from({ length: 9 }, (_, i) => ({ id: `t${i}`, title: `Audit chat number ${i + 1}` }));
    const wrap = await fixture<HTMLElement>(html`<div style="width: 360px"><tc-session-tabs active="t0" .tabs=${tabs}></tc-session-tabs></div>`);
    const el = wrap.querySelector<TcSessionTabs>("tc-session-tabs")!;
    await expect.poll(() => el.querySelector(".ui-stab__more")).not.toBeNull();
    expect(el.querySelector(".ui-stab__bar")!.hasAttribute("data-fade-end")).toBe(true);
    const more = el.querySelector<HTMLButtonElement>(".ui-stab__more")!;
    expect(more.getAttribute("aria-haspopup")).toBe("menu");
    more.click();
    await settle();
    const items = [...el.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    expect(items.length).toBeGreaterThan(0);
    expect(items.map((i) => i.textContent!.trim())).toContain("Audit chat number 9");
    await expect.poll(() => document.activeElement).toBe(items[0]);
    key("Escape");
    await settle();
    expect(el.querySelector('[role="menu"]')).toBeNull();
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-stab__more"));
    el.querySelector<HTMLElement>(".ui-stab__more")!.click();
    await settle();
    [...el.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((i) => i.textContent!.includes("number 9"))!.click();
    await settle();
    expect(el.active).toBe("t8");
  });

  test("the + button asks for a new chat; empty renders no tabs", async () => {
    const el = await fixture<TcSessionTabs>(html`<tc-session-tabs></tc-session-tabs>`);
    let asked = 0;
    el.addEventListener("tc-new", () => asked++);
    el.querySelector<HTMLElement>(".ui-stab__new")!.click();
    expect(asked).toBe(1);
    expect(el.querySelectorAll('[role="tab"]')).toHaveLength(0);
    el.hideCreate = true;
    await settle();
    expect(el.querySelector(".ui-stab__new")).toBeNull();
  });

  test("the tab stop moves on when its tab goes away; labels rename the words", async () => {
    const el = await make();
    el.labels = { running: "En cours", tabs: "Discussions" };
    el.tabs = TABS.filter((t) => t.id !== "q3");
    await settle();
    expect(el.querySelector('[tabindex="0"]')!.closest<HTMLElement>("[data-tab]")!.dataset.tab).toBe("vendor");
    expect(tab(el, "vendor").querySelector(".tc-sr-only")!.textContent).toBe(", En cours");
    expect(el.querySelector('[role="tablist"]')!.getAttribute("aria-label")).toBe("Discussions");
  });

  test("React: uncontrolled state survives re-renders; controlled waits for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    await act(async () => root.render(React.createElement(SessionTabs, { tabs: TABS, defaultActive: "q3" })));
    const el = wrap.querySelector<TcSessionTabs>("tc-session-tabs")!;
    await settle();
    tab(el, "ledger").click();
    tab(el, "q3").focus();
    key("ArrowRight", { altKey: true, shiftKey: true });
    await act(async () => root.render(React.createElement(SessionTabs, { tabs: [...TABS], defaultActive: "q3" })));
    await settle();
    expect(el.active).toBe("ledger");
    expect(ids(el)).toEqual(["vendor", "q3", "ledger", "travel"]);
    await act(async () => root.unmount());
    const seen: string[] = [];
    const root2 = createRoot(wrap);
    await act(async () => root2.render(React.createElement(SessionTabs, { tabs: TABS, active: "q3", onActiveChange: (id) => void seen.push(String(id)), order: [], onOrderChange: (o) => void seen.push(o.join()) })));
    const el2 = wrap.querySelector<TcSessionTabs>("tc-session-tabs")!;
    await settle();
    tab(el2, "vendor").click();
    tab(el2, "q3").focus();
    key("ArrowRight", { altKey: true, shiftKey: true });
    await settle();
    expect(seen).toEqual(["vendor", "vendor,q3,ledger,travel"]);
    expect(el2.active).toBe("q3");
    expect(ids(el2)).toEqual(["q3", "vendor", "ledger", "travel"]);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.cssText = `color-scheme: ${theme}; width: 360px`;
      wrap.innerHTML = `<tc-session-tabs look="standard" active="ledger"></tc-session-tabs><tc-session-tabs look="clean" active="q3"></tc-session-tabs>`;
      for (const el of wrap.querySelectorAll<TcSessionTabs>("tc-session-tabs")) el.tabs = [...TABS, { id: "x", title: "Fixed asset roll-forward" }, { id: "y", title: "Payroll cut-off test" }];
      await settle(wrap);
      await expect.poll(() => wrap.querySelectorAll(".ui-stab__more").length).toBe(2);
      wrap.querySelector<HTMLElement>(".ui-stab__more")!.click();
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

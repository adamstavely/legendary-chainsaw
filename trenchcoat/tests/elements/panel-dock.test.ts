/*
 * <tc-panel-dock> in real browsers: the tabs and the page's children as tab panels, showing and closing items with
 * their cancelable events, the splitter by keys and by drag, collapsing to a rail, Escape closing it with focus going
 * back, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/panel-dock";
import type { PanelDockItem, TcPanelDock } from "../../src/elements/panel-dock";
import { PanelDock } from "../../src/elements/react/panel-dock";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: PanelDockItem[] = [
  { id: "draft", title: "Q3 report draft", kind: "Artifact" },
  { id: "ledger", title: "ledger-q3.csv", kind: "File" },
  { id: "policy", title: "Expense policy §4.2", kind: "Source", closable: false },
];
const make = (look: "standard" | "clean" = "standard") =>
  fixture<HTMLElement>(
    html`<div style="display: flex; justify-content: flex-end; width: 900px; height: 360px">
      <button class="launcher">Open panel</button>
      <tc-panel-dock look=${look} active="draft" .items=${ITEMS} .width=${400}>
        <article slot="draft"><p>The report draft</p></article>
        <div slot="ledger"><p>1,284 rows</p></div>
        <div slot="policy"><p>Approval within 30 days</p></div>
      </tc-panel-dock>
    </div>`,
  ).then((w) => w.querySelector<TcPanelDock>("tc-panel-dock")!);
const tab = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-item="${id}"] [role="tab"]`)!;
const panel = (el: Element, id: string) => el.querySelector<HTMLElement>(`:scope > [slot="${id}"]`)!;
const key = (k: string) => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-panel-dock", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: tabs with one tab stop; the active child is the tab panel, the rest hidden`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("pdk");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-pdk__tabs")!.getAttribute("role")).toBe("tablist");
      expect(el.querySelectorAll('[role="tab"][tabindex="0"]')).toHaveLength(1);
      expect(tab(el, "draft").getAttribute("aria-selected")).toBe("true");
      expect(tab(el, "draft").textContent!.replace(/\s+/g, " ").trim()).toBe("Q3 report draft, Artifact");
      const draft = panel(el, "draft");
      expect(draft.getAttribute("role")).toBe("tabpanel");
      expect(draft.getAttribute("aria-labelledby")).toBe(tab(el, "draft").id);
      expect(tab(el, "draft").getAttribute("aria-controls")).toBe(draft.id);
      expect(draft.hidden).toBe(false);
      expect(panel(el, "ledger").hidden).toBe(true);
      expect(el.getBoundingClientRect().width).toBe(400);
      expect(el.querySelector(".ui-pdk__panel")!.getAttribute("aria-labelledby")).toBeTruthy();
    });
  }

  test("showing an item swaps the panel, unless prevented", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-active-change", (e) => seen.push((e as CustomEvent).detail.active));
    tab(el, "ledger").click();
    await settle();
    expect(el.active).toBe("ledger");
    expect(panel(el, "ledger").hidden).toBe(false);
    expect(panel(el, "draft").hidden).toBe(true);
    el.addEventListener("tc-active-change", (e) => e.preventDefault(), { once: true });
    tab(el, "policy").click();
    await settle();
    expect(el.active).toBe("ledger");
    expect(seen).toEqual(["ledger", "policy"]);
  });

  test("keyboard on the tabs: arrows, Enter shows, Delete closes and moves on", async () => {
    const el = await make();
    const focused = () => (document.activeElement as HTMLElement).closest<HTMLElement>("[data-item]")?.dataset.item;
    tab(el, "draft").focus();
    key("ArrowRight");
    await expect.poll(focused).toBe("ledger");
    key("End");
    await expect.poll(focused).toBe("policy");
    key("Delete");
    await settle();
    // Policy can't be closed
    expect(el.querySelector('[role="status"]')!.textContent).toBe("");
    key("Home");
    await expect.poll(focused).toBe("draft");
    const closed: string[] = [];
    el.addEventListener("tc-close", (e) => closed.push((e as CustomEvent).detail.id));
    key("Delete");
    await settle();
    expect(closed).toEqual(["draft"]);
    expect(el.active).toBe("ledger");
    await expect.poll(focused).toBe("ledger");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Closed Q3 report draft");
  });

  test("a child for an item that isn't open stays hidden; a child added later is wired", async () => {
    const el = await make();
    el.items = ITEMS.filter((i) => i.id !== "ledger");
    await settle();
    expect(panel(el, "ledger").hidden).toBe(true);
    el.items = [...ITEMS, { id: "preview", title: "Preview" }];
    el.active = "preview";
    const added = document.createElement("div");
    added.slot = "preview";
    added.textContent = "Rendered later";
    el.append(added);
    await settle();
    await expect.poll(() => added.getAttribute("role")).toBe("tabpanel");
    expect(added.hidden).toBe(false);
  });

  test("the splitter: arrows step 16 px, Home and End, clamped; prevented keeps the width", async () => {
    const el = await make();
    const handle = el.querySelector<HTMLElement>('[role="separator"]')!;
    expect(handle.getAttribute("aria-valuenow")).toBe("400");
    expect(handle.getAttribute("aria-valuetext")).toBe("400 pixels wide");
    const seen: number[] = [];
    el.addEventListener("tc-width-change", (e) => seen.push((e as CustomEvent).detail.width));
    handle.focus();
    key("ArrowLeft");
    await settle();
    expect(el.width).toBe(416);
    expect(handle.getAttribute("aria-valuenow")).toBe("416");
    key("ArrowRight");
    key("ArrowRight");
    await settle();
    expect(el.width).toBe(384);
    key("End");
    await settle();
    expect(el.width).toBe(760);
    key("Home");
    await settle();
    expect(el.width).toBe(280);
    expect(el.getBoundingClientRect().width).toBe(280);
    el.addEventListener("tc-width-change", (e) => e.preventDefault(), { once: true });
    key("ArrowLeft");
    await settle();
    expect(el.width).toBe(280);
    expect(handle.getAttribute("aria-valuenow")).toBe("280");
    expect(seen).toEqual([416, 400, 384, 760, 280, 296]);
  });

  test("dragging the edge resizes once, at the end; on the left side the direction flips", async () => {
    const el = await make();
    const handle = el.querySelector<HTMLElement>('[role="separator"]')!;
    const seen: number[] = [];
    el.addEventListener("tc-width-change", (e) => seen.push((e as CustomEvent).detail.width));
    const at = (type: string, x: number) => handle.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 3, button: 0, clientX: x, clientY: 100 }));
    at("pointerdown", 500);
    at("pointermove", 450);
    expect(el.style.getPropertyValue("--tc-pdk-w")).toBe("450px");
    at("pointerup", 440);
    await settle();
    expect(seen).toEqual([460]);
    expect(el.width).toBe(460);
    el.side = "left";
    await settle();
    at("pointerdown", 500);
    at("pointerup", 520);
    await settle();
    expect(el.width).toBe(480);
  });

  test("collapse to a rail and back; a rail item shows its item and opens it out", async () => {
    const el = await make();
    el.querySelector<HTMLElement>(".ui-pdk__collapse")!.click();
    await settle();
    expect(el.collapsed).toBe(true);
    expect(el.querySelector(".ui-pdk__rail")).not.toBeNull();
    expect(panel(el, "draft").hidden).toBe(true);
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-pdk__expand"));
    const rail = [...el.querySelectorAll<HTMLElement>(".ui-pdk__rail-item")];
    expect(rail.map((r) => r.textContent!.trim())).toEqual(["Artifact: Q3 report draft", "File: ledger-q3.csv", "Source: Expense policy §4.2"]);
    expect(rail[0].getAttribute("aria-current")).toBe("true");
    rail[1].click();
    await settle();
    expect(el.collapsed).toBe(false);
    expect(el.active).toBe("ledger");
    expect(panel(el, "ledger").hidden).toBe(false);
  });

  test("Escape from inside closes it and sends focus back where it came from; prevented, it stays", async () => {
    const el = await make();
    const launcher = document.querySelector<HTMLButtonElement>(".launcher")!;
    launcher.focus();
    tab(el, "draft").focus();
    el.addEventListener("tc-open-change", (e) => e.preventDefault(), { once: true });
    key("Escape");
    await settle();
    expect(el.open).toBe(true);
    key("Escape");
    await settle();
    expect(el.open).toBe(false);
    expect(el.getBoundingClientRect().width).toBe(0);
    await expect.poll(() => document.activeElement).toBe(launcher);
    el.open = true;
    await settle();
    expect(panel(el, "draft").hidden).toBe(false);
  });

  test("a parent narrower than the breakpoint makes it a full-width sheet, without the splitter", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 500px; height: 300px"><tc-panel-dock .items=${ITEMS}></tc-panel-dock></div>`);
    const el = wrap.querySelector<TcPanelDock>("tc-panel-dock")!;
    await expect.poll(() => el.hasAttribute("data-sheet")).toBe(true);
    expect(el.querySelector('[role="separator"]')).toBeNull();
    expect(getComputedStyle(el).position).toBe("fixed");
    el.breakpoint = 0;
    await settle();
    await expect.poll(() => el.hasAttribute("data-sheet")).toBe(false);
    expect(el.querySelector('[role="separator"]')).not.toBeNull();
  });

  test("no items: an empty message, and Close still works", async () => {
    const el = await fixture<TcPanelDock>(html`<tc-panel-dock></tc-panel-dock>`);
    expect(el.querySelector(".ui-pdk__empty")!.textContent).toContain("Nothing open");
    expect(el.querySelector('[role="tablist"]')).toBeNull();
    el.querySelector<HTMLElement>(".ui-pdk__close")!.click();
    await settle();
    expect(el.open).toBe(false);
  });

  test("React: uncontrolled state survives re-renders; controlled waits; children's events aren't the dock's", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    wrap.style.cssText = "width: 900px; height: 360px";
    const root = createRoot(wrap);
    const kids = [React.createElement("article", { slot: "draft", key: "d" }, "Draft"), React.createElement("div", { slot: "ledger", key: "l" }, "Rows")];
    await act(async () => root.render(React.createElement(PanelDock, { items: ITEMS, defaultActive: "draft" }, kids)));
    const el = wrap.querySelector<TcPanelDock>("tc-panel-dock")!;
    await settle();
    tab(el, "ledger").click();
    await act(async () => root.render(React.createElement(PanelDock, { items: [...ITEMS], defaultActive: "draft" }, kids)));
    await settle();
    expect(el.active).toBe("ledger");
    expect(panel(el, "ledger").hidden).toBe(false);
    // A child's own tc-active-change bubbling through doesn't move the dock
    panel(el, "ledger").dispatchEvent(new CustomEvent("tc-active-change", { bubbles: true, cancelable: true, detail: { active: "x" } }));
    await act(async () => root.render(React.createElement(PanelDock, { items: [...ITEMS], defaultActive: "draft" }, kids)));
    expect(el.active).toBe("ledger");
    await act(async () => root.unmount());
    const seen: string[] = [];
    const root2 = createRoot(wrap);
    await act(async () =>
      root2.render(React.createElement(PanelDock, { items: ITEMS, active: "draft", onActiveChange: (a) => void seen.push(String(a)), width: 400, onWidthChange: (w) => void seen.push(String(w)) }, kids)),
    );
    const el2 = wrap.querySelector<TcPanelDock>("tc-panel-dock")!;
    await settle();
    tab(el2, "ledger").click();
    el2.querySelector<HTMLElement>('[role="separator"]')!.focus();
    key("ArrowLeft");
    await settle();
    expect(seen).toEqual(["ledger", "416"]);
    expect(el2.active).toBe("draft");
    expect(el2.width).toBe(400);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, open and collapsed`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.cssText = `color-scheme: ${theme}; display: flex; gap: 16px; height: 320px; width: 1000px`;
      wrap.innerHTML = `<tc-panel-dock look="standard" active="draft"><article slot="draft"><p>The draft</p></article><div slot="ledger"><p>Rows</p></div></tc-panel-dock>
        <tc-panel-dock look="clean" active="ledger"><article slot="draft"><p>The draft</p></article><div slot="ledger"><p>Rows</p></div></tc-panel-dock>
        <tc-panel-dock look="clean" collapsed></tc-panel-dock>`;
      for (const el of wrap.querySelectorAll<TcPanelDock>("tc-panel-dock")) Object.assign(el, { items: ITEMS, width: 300 });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

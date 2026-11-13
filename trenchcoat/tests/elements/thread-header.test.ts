/*
 * <tc-thread-header> in real browsers: the title as a heading and renaming it in place, the chips, the panel toggles
 * and their cancelable event, Share and the menu, folding into the menu when narrow, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/thread-header";
import type { TcThreadHeader, ThreadHeaderToggle } from "../../src/elements/thread-header";
import { ThreadHeader } from "../../src/elements/react/thread-header";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const TOGGLES: ThreadHeaderToggle[] = [
  { id: "sources", label: "Sources" },
  { id: "report", label: "Report draft" },
];
const make = (look: "standard" | "clean" = "standard", width = 720) =>
  fixture<HTMLElement>(
    html`<div style="width: ${width}px"><tc-thread-header look=${look} heading="Q3 reconciliation" model="Analyst model" project="Annual audit" .toggles=${TOGGLES} .panels=${["sources"]}></tc-thread-header></div>`,
  ).then((w) => w.querySelector<TcThreadHeader>("tc-thread-header")!);
const key = (k: string) => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const visible = (el: Element | null) => !!el && (el as HTMLElement).offsetParent !== null;

describe("tc-thread-header", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the title is a heading, with the chips, Share, toggles and More`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("thd");
      expect(el.dataset.look).toBe(look);
      const heading = el.querySelector('[role="heading"]')!;
      expect(heading.getAttribute("aria-level")).toBe("2");
      expect(heading.textContent!.replace(/\s+/g, " ").trim()).toBe("Q3 reconciliation, Rename");
      expect([...el.querySelectorAll(".ui-thd__chip")].map((c) => c.textContent!.trim())).toEqual(["Model: Analyst model", "Project: Annual audit"]);
      expect(visible(el.querySelector(".ui-thd__share"))).toBe(true);
      const toggles = [...el.querySelectorAll<HTMLElement>(".ui-thd__toggle")];
      expect(toggles.map((t) => t.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
      expect(el.querySelector(".ui-thd__more")!.getAttribute("aria-haspopup")).toBe("menu");
    });
  }

  test("renaming: Enter saves and announces, Escape cancels, an empty name is ignored", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-title-change", (e) => seen.push((e as CustomEvent).detail));
    el.querySelector<HTMLElement>(".ui-thd__title-btn")!.click();
    await settle();
    const input = el.querySelector<HTMLInputElement>(".ui-thd__input")!;
    await expect.poll(() => document.activeElement).toBe(input);
    expect(input.value).toBe("Q3 reconciliation");
    input.value = "Q3 reconciliation – final";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    key("Enter");
    await settle();
    expect(el.heading).toBe("Q3 reconciliation – final");
    expect(seen).toEqual([{ title: "Q3 reconciliation – final", previous: "Q3 reconciliation" }]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Renamed to Q3 reconciliation – final");
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-thd__title-btn"));
    // F2 starts it from the keyboard; Escape cancels
    key("F2");
    await settle();
    const again = el.querySelector<HTMLInputElement>(".ui-thd__input")!;
    again.value = "Something else";
    again.dispatchEvent(new Event("input", { bubbles: true }));
    await expect.poll(() => document.activeElement).toBe(again);
    key("Escape");
    await settle();
    expect(el.heading).toBe("Q3 reconciliation – final");
    // Blank isn't a name
    el.querySelector<HTMLElement>(".ui-thd__title-btn")!.click();
    await settle();
    const blank = el.querySelector<HTMLInputElement>(".ui-thd__input")!;
    blank.value = "   ";
    blank.dispatchEvent(new Event("input", { bubbles: true }));
    blank.blur();
    await settle();
    expect(el.heading).toBe("Q3 reconciliation – final");
    expect(seen).toHaveLength(1);
  });

  test("a prevented rename keeps the title; no-rename makes it plain text", async () => {
    const el = await make();
    el.addEventListener("tc-title-change", (e) => e.preventDefault());
    el.querySelector<HTMLElement>(".ui-thd__title-btn")!.click();
    await settle();
    const input = el.querySelector<HTMLInputElement>(".ui-thd__input")!;
    input.value = "Nope";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await settle();
    expect(el.heading).toBe("Q3 reconciliation");
    el.noRename = true;
    await settle();
    expect(el.querySelector(".ui-thd__title-btn")).toBeNull();
    expect(el.querySelector(".ui-thd__title")!.textContent!.trim()).toBe("Q3 reconciliation");
  });

  test("toggles change `panels` with the detail, unless prevented", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-panels-change", (e) => seen.push((e as CustomEvent).detail));
    const [sources, report] = el.querySelectorAll<HTMLElement>(".ui-thd__toggle");
    report.click();
    await settle();
    expect(el.panels).toEqual(["sources", "report"]);
    expect(report.getAttribute("aria-pressed")).toBe("true");
    sources.click();
    await settle();
    expect(el.panels).toEqual(["report"]);
    el.addEventListener("tc-panels-change", (e) => e.preventDefault(), { once: true });
    report.click();
    await settle();
    expect(el.panels).toEqual(["report"]);
    expect(seen).toEqual([
      { panels: ["sources", "report"], id: "report", open: true },
      { panels: ["report"], id: "sources", open: false },
      { panels: [], id: "report", open: false },
    ]);
  });

  test("Share and the menu's actions are events; the menu's keys and Escape", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-share", () => seen.push("share"));
    el.addEventListener("tc-action", (e) => seen.push((e as CustomEvent).detail.action));
    el.querySelector<HTMLElement>(".ui-thd__share")!.click();
    const more = el.querySelector<HTMLButtonElement>(".ui-thd__more")!;
    more.click();
    await settle();
    expect(more.getAttribute("aria-expanded")).toBe("true");
    // Wide, Share and the toggles are in the bar, so the menu shows only the actions
    const shown = () => [...el.querySelectorAll<HTMLElement>(".ui-thd__menu-item")].filter(visible).map((i) => i.textContent!.trim());
    expect(shown()).toEqual(["Export", "Archive", "Delete"]);
    await expect.poll(() => document.activeElement?.textContent?.trim()).toBe("Export");
    key("ArrowUp");
    await expect.poll(() => document.activeElement?.textContent?.trim()).toBe("Delete");
    key("Escape");
    await settle();
    expect(el.querySelector('[role="menu"]')).toBeNull();
    await expect.poll(() => document.activeElement).toBe(more);
    more.click();
    await settle();
    [...el.querySelectorAll<HTMLElement>(".ui-thd__menu-item")].find((i) => i.textContent!.trim() === "Archive")!.click();
    await settle();
    expect(seen).toEqual(["share", "archive"]);
    expect(el.querySelector('[role="menu"]')).toBeNull();
  });

  test("narrow: the chips hide and Share and the toggles fold into the menu", async () => {
    const el = await make("standard", 320);
    expect(visible(el.querySelector(".ui-thd__chips"))).toBe(false);
    expect(visible(el.querySelector(".ui-thd__share"))).toBe(false);
    expect(visible(el.querySelector(".ui-thd__toggles"))).toBe(false);
    el.querySelector<HTMLElement>(".ui-thd__more")!.click();
    await settle();
    const items = [...el.querySelectorAll<HTMLElement>(".ui-thd__menu-item")].filter(visible);
    expect(items.map((i) => i.textContent!.replace(/✓/g, "").trim())).toEqual(["Share", "Sources", "Report draft", "Export", "Archive", "Delete"]);
    const report = items[2];
    expect(report.getAttribute("role")).toBe("menuitemcheckbox");
    expect(report.getAttribute("aria-checked")).toBe("false");
    report.click();
    await settle();
    expect(el.panels).toEqual(["sources", "report"]);
    // A toggle keeps the menu open, so several can be flipped
    expect(el.querySelector('[role="menu"]')).not.toBeNull();
  });

  test("an empty title shows the untitled word; the level is kept in range", async () => {
    const el = await fixture<TcThreadHeader>(html`<tc-thread-header .level=${9}></tc-thread-header>`);
    expect(el.querySelector(".ui-thd__title-text")!.textContent).toBe("New chat");
    expect(el.querySelector('[role="heading"]')!.getAttribute("aria-level")).toBe("6");
    expect(el.querySelector(".ui-thd__chips")).toBeNull();
  });

  test("React: uncontrolled title and panels survive re-renders; controlled ones wait for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    wrap.style.width = "720px";
    const root = createRoot(wrap);
    await act(async () => root.render(React.createElement(ThreadHeader, { defaultTitle: "Q3", toggles: TOGGLES })));
    const el = wrap.querySelector<TcThreadHeader>("tc-thread-header")!;
    await settle();
    el.querySelector<HTMLElement>(".ui-thd__toggle")!.click();
    await act(async () => root.render(React.createElement(ThreadHeader, { defaultTitle: "Q3", toggles: [...TOGGLES] })));
    await settle();
    expect(el.panels).toEqual(["sources"]);
    await act(async () => root.unmount());
    const seen: string[] = [];
    const root2 = createRoot(wrap);
    await act(async () => root2.render(React.createElement(ThreadHeader, { title: "Q3", onTitleChange: (t) => void seen.push(t), toggles: TOGGLES, panels: [], onPanelsChange: (p) => void seen.push(p.join()) })));
    const el2 = wrap.querySelector<TcThreadHeader>("tc-thread-header")!;
    await settle();
    el2.querySelector<HTMLElement>(".ui-thd__toggle")!.click();
    el2.querySelector<HTMLElement>(".ui-thd__title-btn")!.click();
    await settle();
    const input = el2.querySelector<HTMLInputElement>(".ui-thd__input")!;
    input.value = "Q4";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await settle();
    expect(seen).toEqual(["sources", "Q4"]);
    expect(el2.heading).toBe("Q3");
    expect(el2.panels).toEqual([]);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, wide and narrow, menu open`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.cssText = `color-scheme: ${theme}; width: 720px; display: grid; gap: 8px`;
      wrap.innerHTML = `<tc-thread-header look="standard" heading="Q3 reconciliation" model="Analyst model" project="Annual audit"></tc-thread-header>
        <div style="width: 320px"><tc-thread-header look="clean" heading="Vendor risk summary" model="Analyst model"></tc-thread-header></div>`;
      for (const el of wrap.querySelectorAll<TcThreadHeader>("tc-thread-header")) Object.assign(el, { toggles: TOGGLES, panels: ["sources"] });
      await settle(wrap);
      for (const more of wrap.querySelectorAll<HTMLElement>(".ui-thd__more")) more.click();
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

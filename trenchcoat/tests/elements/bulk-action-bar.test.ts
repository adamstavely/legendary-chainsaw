/*
 * <tc-bulk-action-bar> in real browsers: shown only with a selection, count, keys, a question before danger, Undo and its
 * timer, events, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/bulk-action-bar";
import type { BulkAction, BulkActionDetail, BulkUndoDetail, TcBulkActionBar } from "../../src/elements/bulk-action-bar";
import { BulkActionBar } from "../../src/elements/react/bulk-action-bar";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ACTIONS: BulkAction[] = [
  { id: "flag", label: "Flag" },
  { id: "remove", label: "Remove", danger: true, confirm: true },
  { id: "note", label: "Note", undoable: false },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const mount = async (node: React.ReactElement) => {
  const host = document.body.appendChild(document.createElement("div"));
  const root = createRoot(host);
  await act(async () => root.render(node));
  await settle();
  return { host, root };
};
const bar = (count = 3) => fixture<TcBulkActionBar>(html`<tc-bulk-action-bar .count=${count} total="10" undo-seconds="60" .actions=${ACTIONS}></tc-bulk-action-bar>`);
const btn = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-item="${id}"]`)!;

describe("tc-bulk-action-bar", () => {
  test("isn't shown with nothing selected", async () => {
    const el = await bar(0);
    expect(el.dataset.ui).toBe("bab");
    expect(el.querySelector('[role="toolbar"]')).toBeNull();
    expect(el.hasAttribute("data-empty")).toBe(true);
  });

  test("says how many, and announces changes", async () => {
    const el = await bar();
    expect(text(el.querySelector(".ui-bab__count"))).toBe("3 of 10 selected");
    el.count = 4;
    await settle();
    expect(text(el.querySelector('[role="status"]'))).toBe("4 of 10 selected");
  });

  test("is one tab stop, and arrow keys move", async () => {
    const el = await bar();
    expect(el.querySelectorAll('[role="toolbar"] button[tabindex="0"]')).toHaveLength(1);
    btn(el, "flag").focus();
    btn(el, "flag").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(document.activeElement).toBe(btn(el, "remove"));
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(document.activeElement).toBe(btn(el, "__clear"));
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(document.activeElement).toBe(btn(el, "flag"));
  });

  test("an action fires, then offers Undo, which fires too", async () => {
    const el = await bar();
    const acted: BulkActionDetail[] = [];
    const undone: BulkUndoDetail[] = [];
    el.addEventListener("tc-action", (e) => acted.push((e as CustomEvent<BulkActionDetail>).detail));
    el.addEventListener("tc-undo", (e) => undone.push((e as CustomEvent<BulkUndoDetail>).detail));
    btn(el, "flag").click();
    await settle();
    expect(acted).toEqual([{ action: ACTIONS[0], count: 3 }]);
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-bab__undo"));
    expect(text(el.querySelector(".ui-bab__done"))).toContain("Flag");
    el.querySelector<HTMLElement>(".ui-bab__undo")!.click();
    await settle();
    expect(undone[0]!.action.id).toBe("flag");
    expect(el.querySelector(".ui-bab__undo")).toBeNull();
  });

  test("Undo stays when the page clears the selection, then the bar goes", async () => {
    const el = await fixture<TcBulkActionBar>(html`<tc-bulk-action-bar count="2" undo-seconds="1" .actions=${ACTIONS}></tc-bulk-action-bar>`);
    btn(el, "flag").click();
    el.count = 0;
    await settle();
    expect(el.querySelector(".ui-bab__undo")).toBeTruthy();
    await expect.poll(() => el.querySelector('[role="toolbar"]'), { timeout: 4000 }).toBeNull();
    expect(el.hasAttribute("data-empty")).toBe(true);
  });

  test("a danger action asks first, naming how many, and Escape backs out", async () => {
    const el = await bar();
    const acted: unknown[] = [];
    el.addEventListener("tc-action", (e) => acted.push(e));
    btn(el, "remove").click();
    await settle();
    expect(text(el.querySelector(".ui-bab__question"))).toBe("Remove 3 selected?");
    expect(el.querySelectorAll('[role="toolbar"] button[tabindex="0"]')).toHaveLength(1);
    expect(acted).toHaveLength(0);
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-bab__cancel"));
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-bab__question")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(btn(el, "remove"));
    btn(el, "remove").click();
    await settle();
    el.querySelector<HTMLElement>(".ui-bab__yes")!.click();
    await settle();
    expect(acted).toHaveLength(1);
  });

  test("preventDefault, or undoable false, offers no Undo", async () => {
    const el = await bar();
    btn(el, "note").click();
    await settle();
    expect(el.querySelector(".ui-bab__undo")).toBeNull();
    const stopped = await bar();
    stopped.addEventListener("tc-action", (e) => e.preventDefault());
    btn(stopped, "flag").click();
    await settle();
    expect(stopped.querySelector(".ui-bab__undo")).toBeNull();
  });

  test("Select all shows below the total, and Clear fires", async () => {
    const el = await bar();
    const seen: string[] = [];
    el.addEventListener("tc-select-all", () => seen.push("all"));
    el.addEventListener("tc-clear", () => seen.push("clear"));
    btn(el, "__all").click();
    btn(el, "__clear").click();
    expect(seen).toEqual(["all", "clear"]);
    el.count = 10;
    await settle();
    expect(btn(el, "__all")).toBeNull();
  });

  test("sticky reflects", async () => {
    const el = await fixture<TcBulkActionBar>(html`<tc-bulk-action-bar count="1" sticky></tc-bulk-action-bar>`);
    expect(getComputedStyle(el).position).toBe("sticky");
  });
});

describe("React", () => {
  test("the wrapper passes count and fires", async () => {
    const seen: string[] = [];
    const { host, root } = await mount(React.createElement(BulkActionBar, { count: 2, actions: ACTIONS, onTcAction: (e: CustomEvent<BulkActionDetail>) => seen.push(e.detail.action.id) }));
    const el = host.querySelector<TcBulkActionBar>("tc-bulk-action-bar")!;
    await act(async () => btn(el, "flag").click());
    expect(seen).toEqual(["flag"]);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas; color: CanvasText`}><tc-bulk-action-bar count="3" total="10" .actions=${ACTIONS}></tc-bulk-action-bar></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});

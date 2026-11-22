/*
 * <tc-saved-views> in real browsers: the tablist and its names, one tab stop and the arrow keys, opening a view, View
 * options (rename in place, duplicate, share, set as default, delete with a confirmation), the Edited bar (save,
 * reset, save as new), + New view, the More views menu at a narrow width, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/saved-views";
import type { SavedView, TcSavedViews } from "../../src/elements/saved-views";
import { SavedViews } from "../../src/elements/react/saved-views";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const VIEWS: SavedView[] = [
  { id: "mine", name: "My open cases", count: 14, isDefault: true },
  { id: "high", name: "High risk this week", count: 6, shared: true },
  { id: "waiting", name: "Waiting on customer", count: 9, shared: true, owner: "Tomas Lind" },
  { id: "all", name: "All cases", count: 212 },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const tabs = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const make = (attrs: { look?: string; dirty?: boolean; width?: number } = {}) =>
  fixture<HTMLElement>(
    html`<div style=${`width: ${attrs.width ?? 760}px`}><tc-saved-views look=${attrs.look ?? "standard"} active="mine" controls="case-list" ?dirty=${attrs.dirty} .views=${VIEWS}></tc-saved-views></div>`,
  ).then((w) => w.querySelector<TcSavedViews>("tc-saved-views")!);
/** Collects the details of an event */
const listen = <T>(el: Element, name: string, prevent = false) => {
  const got: T[] = [];
  el.addEventListener(name, (e) => {
    got.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return got;
};
const openOptions = async (el: TcSavedViews) => {
  el.querySelector<HTMLButtonElement>(".ui-svw__options")!.click();
  await settle();
  return [...el.querySelectorAll<HTMLButtonElement>('.ui-svw__menu [role="menuitem"]')];
};

describe("tc-saved-views", () => {
  for (const look of ["standard", "clean"]) {
    test(`renders in ${look}: a named tablist, each tab read with its count and marks, one tab stop`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("svw");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector('[role="tablist"]')!;
      expect(list.getAttribute("aria-label")).toBe("Saved views");
      const t = tabs(el);
      expect(t.map((b) => text(b))).toEqual([
        "My open cases 14 , 14, default view",
        "High risk this week 6 , 6, shared with the team",
        "Waiting on customer 9 , 9, by Tomas Lind, shared with the team",
        "All cases 212 , 212",
      ]);
      expect(t.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1]);
      expect(t[0].getAttribute("aria-selected")).toBe("true");
      expect(t[0].getAttribute("aria-controls")).toBe("case-list");
      expect(el.querySelector(".ui-svw__options .tc-sr-only")!.textContent).toBe("Options for My open cases");
      expect(el.querySelector(".ui-svw__dirty")).toBeNull();
    });
  }

  test("arrows move the tab stop, Home and End go to the ends, Enter opens; a prevented change keeps the view", async () => {
    const el = await make();
    const changes = listen<{ active: string }>(el, "tc-active-change");
    tabs(el)[0].focus();
    key(tabs(el)[0], "ArrowRight");
    await expect.poll(() => document.activeElement === tabs(el)[1]).toBe(true);
    key(tabs(el)[1], "End");
    await expect.poll(() => document.activeElement === tabs(el)[3]).toBe(true);
    key(tabs(el)[3], "ArrowRight");
    await expect.poll(() => document.activeElement === tabs(el)[0]).toBe(true);
    key(tabs(el)[0], "ArrowLeft");
    await expect.poll(() => document.activeElement === tabs(el)[3]).toBe(true);
    key(tabs(el)[3], "Enter");
    await settle();
    expect(changes.map((c) => c.active)).toEqual(["all"]);
    expect(el.active).toBe("all");
    expect(tabs(el)[3].getAttribute("aria-selected")).toBe("true");
    el.addEventListener("tc-active-change", (e) => e.preventDefault());
    tabs(el)[1].click();
    await settle();
    expect(el.active).toBe("all");
  });

  test("View options: rename in place – Enter saves, Escape keeps the old name", async () => {
    const el = await make();
    const items = await openOptions(el);
    expect(el.querySelector(".ui-svw__menu")!.getAttribute("role")).toBe("menu");
    expect(items.map((i) => text(i))).toEqual(["Rename", "Duplicate", "Share with team", "Delete…"]);
    expect(document.activeElement).toBe(items[0]);
    const renames = listen<{ id: string; name: string }>(el, "tc-view-rename");
    items[0].click();
    await settle();
    const input = el.querySelector<HTMLInputElement>(".ui-svw__rename")!;
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-label")).toBe("View name");
    input.value = "My queue";
    key(input, "Enter");
    await settle();
    expect(renames).toEqual([{ id: "mine", name: "My queue" }]);
    expect(el.querySelector(".ui-svw__rename")).toBeNull();
    expect(text(el.querySelector('[role="status"]'))).toBe("Renamed to My queue");
    await openOptions(el);
    el.querySelector<HTMLButtonElement>('.ui-svw__menu [role="menuitem"]')!.click();
    await settle();
    const again = el.querySelector<HTMLInputElement>(".ui-svw__rename")!;
    again.value = "Something else";
    key(again, "Escape");
    await settle();
    expect(renames).toHaveLength(1);
    await expect.poll(() => document.activeElement === tabs(el)[0]).toBe(true);
  });

  test("a prevented rename keeps the name field open", async () => {
    const el = await make();
    listen(el, "tc-view-rename", true);
    (await openOptions(el))[0].click();
    await settle();
    const input = el.querySelector<HTMLInputElement>(".ui-svw__rename")!;
    input.value = "Taken";
    key(input, "Enter");
    await settle();
    expect(el.querySelector(".ui-svw__rename")).not.toBeNull();
  });

  test("Duplicate, Share and Set as default ask the page; a shared view offers Stop sharing; Escape closes and refocuses", async () => {
    const el = await make();
    const dup = listen<{ id: string }>(el, "tc-view-duplicate");
    const share = listen<{ id: string; shared: boolean }>(el, "tc-view-share");
    const def = listen<{ id: string }>(el, "tc-view-default");
    (await openOptions(el))[1].click();
    await settle();
    expect(dup).toEqual([{ id: "mine" }]);
    expect(el.querySelector(".ui-svw__menu")).toBeNull();
    el.active = "high";
    await settle();
    const items = await openOptions(el);
    expect(items.map((i) => text(i))).toEqual(["Rename", "Duplicate", "Stop sharing", "Set as default", "Delete…"]);
    items[2].click();
    await settle();
    expect(share).toEqual([{ id: "high", shared: false }]);
    (await openOptions(el))[3].click();
    await settle();
    expect(def).toEqual([{ id: "high" }]);
    const menuItems = await openOptions(el);
    key(menuItems[0], "Escape");
    await settle();
    expect(el.querySelector(".ui-svw__menu")).toBeNull();
    await expect.poll(() => document.activeElement === el.querySelector(".ui-svw__options")).toBe(true);
  });

  test("Delete asks in place first – Cancel keeps it, Delete asks the page", async () => {
    const el = await make();
    el.active = "high";
    await settle();
    const deletes = listen<{ id: string }>(el, "tc-view-delete");
    (await openOptions(el))[4].click();
    await settle();
    const dialog = el.querySelector(".ui-svw__menu")!;
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(text(el.querySelector(".ui-svw__confirm-title"))).toBe("Delete “High risk this week”?");
    expect(text(el.querySelector(".ui-svw__confirm-note"))).toBe("It goes for everyone it's shared with.");
    await expect.poll(() => document.activeElement === el.querySelector(".ui-svw__confirm-cancel")).toBe(true);
    el.querySelector<HTMLButtonElement>(".ui-svw__confirm-cancel")!.click();
    await settle();
    expect(deletes).toEqual([]);
    expect(el.querySelector(".ui-svw__menu")).toBeNull();
    (await openOptions(el))[4].click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-svw__confirm-delete")!.click();
    await settle();
    expect(deletes).toEqual([{ id: "high" }]);
  });

  test("dirty: the open tab says edited, and the bar saves, resets or saves as a new view", async () => {
    const el = await make({ dirty: true });
    expect(text(tabs(el)[0])).toContain("edited");
    expect(el.querySelector(".ui-svw__tab[data-selected] .ui-svw__edited")).not.toBeNull();
    const bar = el.querySelector(".ui-svw__dirty")!;
    expect(bar.getAttribute("aria-label")).toBe("This view has unsaved changes");
    expect([...bar.querySelectorAll("button")].map((b) => text(b))).toEqual(["Reset", "Save as new view", "Save changes"]);
    const saves = listen<{ id: string }>(el, "tc-view-save");
    const resets = listen<{ id: string }>(el, "tc-view-reset");
    const creates = listen<{ name: string; basis: string }>(el, "tc-view-create");
    el.querySelector<HTMLButtonElement>(".ui-svw__save")!.click();
    [...bar.querySelectorAll("button")][0].click();
    expect(saves).toEqual([{ id: "mine" }]);
    expect(resets).toEqual([{ id: "mine" }]);
    [...bar.querySelectorAll("button")][1].click();
    await settle();
    const input = el.querySelector<HTMLInputElement>(".ui-svw__name-input")!;
    await expect.poll(() => document.activeElement === input).toBe(true);
    // An empty name isn't sent
    el.querySelector<HTMLFormElement>(".ui-svw__naming")!.requestSubmit();
    await settle();
    expect(creates).toEqual([]);
    input.value = "My high risk";
    el.querySelector<HTMLFormElement>(".ui-svw__naming")!.requestSubmit();
    await settle();
    expect(creates).toEqual([{ name: "My high risk", basis: "current" }]);
    expect(el.querySelector(".ui-svw__naming")).toBeNull();
    el.dirty = false;
    await settle();
    expect(el.querySelector(".ui-svw__dirty")).toBeNull();
  });

  test("+ New view asks for a name in place; Escape cancels; a prevented create keeps the field", async () => {
    const el = await make();
    const creates = listen<{ name: string; basis: string }>(el, "tc-view-create");
    el.querySelector<HTMLButtonElement>(".ui-svw__new")!.click();
    await settle();
    const form = el.querySelector<HTMLFormElement>(".ui-svw__naming")!;
    form.querySelector("input")!.value = "Weekend";
    key(form.querySelector("input")!, "Escape");
    await settle();
    expect(el.querySelector(".ui-svw__naming")).toBeNull();
    await expect.poll(() => document.activeElement === el.querySelector(".ui-svw__new")).toBe(true);
    el.addEventListener("tc-view-create", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLButtonElement>(".ui-svw__new")!.click();
    await settle();
    el.querySelector<HTMLInputElement>(".ui-svw__name-input")!.value = "Weekend";
    el.querySelector<HTMLFormElement>(".ui-svw__naming")!.requestSubmit();
    await settle();
    expect(creates).toEqual([{ name: "Weekend", basis: "blank" }]);
    expect(el.querySelector(".ui-svw__naming")).not.toBeNull();
  });

  test("narrow: the tabs scroll and More views lists the ones out of view", async () => {
    const el = await make({ width: 320 });
    await expect.poll(() => el.querySelector(".ui-svw__more") !== null).toBe(true);
    const more = el.querySelector<HTMLButtonElement>(".ui-svw__more")!;
    expect(text(more.querySelector(".tc-sr-only"))).toMatch(/^More views \(\d\)$/);
    expect(el.scrollWidth).toBeLessThanOrEqual(322);
    more.click();
    await settle();
    const items = [...el.querySelectorAll<HTMLButtonElement>('.ui-svw__menu [role="menuitem"]')];
    expect(items.length).toBeGreaterThan(0);
    const last = items[items.length - 1];
    const changes = listen<{ active: string }>(el, "tc-active-change");
    last.click();
    await settle();
    expect(changes).toHaveLength(1);
    expect(el.active).toBe(changes[0].active);
  });

  test("a view that goes away takes its menu with it; renamed words show", async () => {
    const el = await make();
    el.labels = { views: "Case views", options: "More" };
    el.active = "high";
    await settle();
    expect(el.querySelector('[role="tablist"]')!.getAttribute("aria-label")).toBe("Case views");
    await openOptions(el);
    el.views = VIEWS.filter((v) => v.id !== "high");
    await settle();
    expect(el.querySelector(".ui-svw__menu")).toBeNull();
  });
});

describe("React", () => {
  test("uncontrolled active survives re-renders; a controlled one stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    let asked: string | null | undefined;
    const node = (extra = {}) => React.createElement(SavedViews, { views: VIEWS, defaultActive: "mine", ...extra });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcSavedViews>("tc-saved-views")!;
    await act(async () => tabs(el)[2].click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.active).toBe("waiting");
    await act(async () => root.render(node({ active: "all", onActiveChange: (a: string | null) => (asked = a) })));
    await settle();
    await act(async () => tabs(el)[1].click());
    await settle();
    expect(asked).toBe("high");
    expect(el.active).toBe("all");
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}, edited and with the menu open`, async () => {
        const wrap = await fixture<HTMLElement>(
          html`<div data-look=${look} style=${`width: 760px; color-scheme: ${scheme}; background: Canvas; color: CanvasText`}>
            <tc-saved-views look=${look} active="mine" dirty .views=${VIEWS}></tc-saved-views>
          </div>`,
        );
        const el = wrap.querySelector<TcSavedViews>("tc-saved-views")!;
        await finish(wrap);
        let { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
        await openOptions(el);
        await finish(wrap);
        ({ violations } = await axe.run(wrap));
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});

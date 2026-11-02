/*
 * <tc-change-list> in real browsers: rows and their words, opening, the More menu, Show more and controlled use, the
 * keyboard, narrow width, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/change-list";
import type { ChangeItem, TcChangeList } from "../../src/elements/change-list";
import { ChangeList } from "../../src/elements/react/change-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: ChangeItem[] = [
  { id: "a", title: "Add freezer locations", repo: "institute/sample-tracker", number: 214, state: "open", additions: 6793, deletions: 9201, checks: { passing: 5, failing: 0, pending: 6, skipped: 0 } },
  { id: "b", title: "Warn before consent expires", repo: "institute/sample-tracker", state: "draft" },
  { id: "c", title: "Barcode support", repo: "institute/sample-tracker", number: 209, state: "merged", additions: 12 },
  { id: "d", title: "Old schema", repo: "institute/sample-tracker", number: 205, state: "closed", deletions: 4 },
];
const ACTIONS = [
  { id: "copy", label: "Copy link" },
  { id: "hide", label: "Hide" },
];
const make = (look: "standard" | "clean" = "standard", limit = 2) =>
  fixture<TcChangeList>(html`<tc-change-list look=${look} locale="en-US" .items=${ITEMS} .rowActions=${ACTIONS} .limit=${limit}></tc-change-list>`);
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-chl__row")];
const key = (k: string) => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const at = () => (document.activeElement as HTMLElement).dataset.at;

describe("tc-change-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: rows carry the state in words, the place, the numbers and the checks`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("chl");
      expect(el.dataset.look).toBe(look);
      expect(rows(el)).toHaveLength(2);
      const a = rows(el)[0];
      expect(a.dataset.state).toBe("open");
      expect(a.querySelector(".ui-chl__sr")!.textContent).toContain("Open");
      expect(a.querySelector(".ui-chl__title")!.getAttribute("title")).toBe("Add freezer locations");
      expect(a.querySelector(".ui-chl__where")!.textContent).toBe("institute/sample-tracker #214");
      expect(a.querySelector(".ui-chl__add")!.textContent).toContain("+6,793");
      expect(a.querySelector(".ui-chl__add")!.textContent).toContain("6,793 lines added");
      expect(a.querySelector(".ui-chl__del")!.textContent).toContain("9,201 lines removed");
      expect(a.querySelector(".ui-cks__tally")!.textContent).toBe("5/11");
      expect(rows(el)[1].querySelector(".ui-chl__where")!.textContent).toBe("institute/sample-tracker");
      expect(rows(el)[1].querySelector(".ui-chl__side")).toBeNull();
      expect(el.querySelectorAll('.ui-chl__list button[tabindex="0"]')).toHaveLength(1);
    });
  }

  test("a row opens; empty says so; no actions means no More", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-open", (e) => seen.push((e as CustomEvent).detail.item.title));
    rows(el)[1].querySelector<HTMLElement>(".ui-chl__open")!.click();
    expect(seen).toEqual(["Warn before consent expires"]);
    el.rowActions = [];
    await settle();
    expect(el.querySelector(".ui-chl__more")).toBeNull();
    el.items = [];
    await settle();
    expect(el.querySelector(".ui-chl__empty")!.textContent).toBe("No changes");
  });

  test("More: a menu with arrows, an action, Escape returning focus, and a click outside", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-action", (e) => seen.push((e as CustomEvent).detail));
    const more = rows(el)[0].querySelector<HTMLElement>(".ui-chl__more")!;
    expect(more.getAttribute("aria-haspopup")).toBe("menu");
    more.click();
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.action).toBe("copy");
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(el.querySelector(".ui-chl__menu")!.getAttribute("role")).toBe("menu");
    key("ArrowDown");
    expect((document.activeElement as HTMLElement).dataset.action).toBe("hide");
    key("ArrowDown");
    expect((document.activeElement as HTMLElement).dataset.action).toBe("copy");
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await expect.poll(() => el.querySelector(".ui-chl__menu")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(more);

    more.click();
    await expect.poll(() => el.querySelector(".ui-chl__menu [data-action=hide]")).not.toBeNull();
    el.querySelector<HTMLElement>(".ui-chl__menu [data-action=hide]")!.click();
    expect(seen).toEqual([{ id: "hide", itemId: "a", item: ITEMS[0] }]);
    await expect.poll(() => el.querySelector(".ui-chl__menu")).toBeNull();

    more.click();
    await expect.poll(() => el.querySelector(".ui-chl__menu")).not.toBeNull();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await expect.poll(() => el.querySelector(".ui-chl__menu")).toBeNull();
    expect(more.getAttribute("aria-expanded")).toBe("false");
  });

  test("Show more reveals the rest and moves focus to the first new row; preventing it keeps the list", async () => {
    const el = await make();
    const toggle = el.querySelector<HTMLElement>(".ui-chl__toggle")!;
    expect(toggle.textContent).toBe("Show more");
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-expanded-change", stop);
    toggle.click();
    await settle();
    expect(rows(el)).toHaveLength(2);
    el.removeEventListener("tc-expanded-change", stop);
    toggle.click();
    await expect.poll(() => at()).toBe("2:0");
    expect(rows(el)).toHaveLength(4);
    expect(toggle.textContent).toBe("Show less");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    toggle.click();
    await settle();
    expect(rows(el)).toHaveLength(2);
  });

  test("no Show more when everything fits", async () => {
    const el = await make("standard", 5);
    expect(el.querySelector(".ui-chl__toggle")).toBeNull();
  });

  test("keyboard: arrows, Home and End move the one tab stop", async () => {
    const el = await make("standard", 4);
    el.querySelector<HTMLElement>('[data-at="0:0"]')!.focus();
    key("ArrowDown");
    await expect.poll(at).toBe("1:0");
    key("ArrowRight");
    await expect.poll(at).toBe("1:1");
    key("End");
    await expect.poll(at).toBe("3:1");
    key("ArrowLeft");
    await expect.poll(at).toBe("3:0");
    key("Home");
    await expect.poll(at).toBe("0:0");
  });

  test("narrow: the numbers drop under the title and the width holds", async () => {
    const el = await make();
    el.style.width = "260px";
    await settle();
    const row = rows(el)[0];
    const title = row.querySelector(".ui-chl__title")!.getBoundingClientRect();
    const side = row.querySelector(".ui-chl__side")!.getBoundingClientRect();
    expect(side.top).toBeGreaterThanOrEqual(title.bottom);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth);
  });

  test("React: uncontrolled survives a re-render, controlled waits for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const render = (props: Partial<React.ComponentProps<typeof ChangeList>>) => act(async () => root.render(React.createElement(ChangeList, { items: ITEMS, limit: 2, ...props })));
    await render({});
    const el = wrap.querySelector<TcChangeList>("tc-change-list")!;
    await settle();
    el.querySelector<HTMLElement>(".ui-chl__toggle")!.click();
    await settle();
    await render({ description: "Again" });
    await settle();
    expect(rows(el)).toHaveLength(4);
    const seen: boolean[] = [];
    await render({ expanded: false, onExpandedChange: (x) => void seen.push(x) });
    await settle();
    expect(rows(el)).toHaveLength(2);
    await act(async () => el.querySelector<HTMLElement>(".ui-chl__toggle")!.click());
    await settle();
    expect(seen).toEqual([true]);
    expect(rows(el)).toHaveLength(2);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with the menu open`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.colorScheme = theme;
      wrap.innerHTML = `<tc-change-list look="standard"></tc-change-list><tc-change-list look="clean"></tc-change-list>`;
      wrap.querySelectorAll<TcChangeList>("tc-change-list").forEach((el) => {
        el.items = ITEMS;
        el.rowActions = ACTIONS;
        el.limit = 3;
      });
      await settle(wrap);
      wrap.querySelector<HTMLElement>(".ui-chl__more")!.click();
      await expect.poll(() => wrap.querySelector(".ui-chl__menu")).not.toBeNull();
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

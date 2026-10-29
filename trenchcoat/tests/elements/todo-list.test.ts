/*
 * <tc-todo-list> in real browsers: adding, ticking off, editing, moving, removing with Undo, clearing done, the tabs,
 * controlled use, read only, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/todo-list";
import type { TcTodoList, TodoItem, TodoItemsChange } from "../../src/elements/todo-list";
import { TodoList } from "../../src/elements/react/todo-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ITEMS: TodoItem[] = [
  { id: "a", text: "Book the hall", done: true },
  { id: "b", text: "Print posters" },
  { id: "c", text: "Order badges" },
];
const make = (look = "standard", items = ITEMS) => fixture<TcTodoList>(html`<tc-todo-list look=${look} heading="Prep" .items=${items}></tc-todo-list>`);
/** Each to-do's words as shown – the text, without the screen-reader-only ", edit" */
const texts = (el: Element) =>
  [...el.querySelectorAll(".ui-todo__item .ui-todo__text")].map((t) => [...t.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join("").trim());
const box = (el: Element, id: string) => el.querySelector<HTMLInputElement>(`.ui-todo__item[data-id="${CSS.escape(id)}"] input[type="checkbox"]`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const type = async (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
const changes = (el: Element) => {
  const out: TodoItemsChange[] = [];
  el.addEventListener("tc-items-change", (e) => out.push((e as CustomEvent<TodoItemsChange>).detail));
  return out;
};

describe("tc-todo-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the heading, tabs with counts, the add box, the list and the progress`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("todo");
      expect(el.dataset.look).toBe(look);
      expect([...el.querySelectorAll('[role="tab"]')].map((t) => t.textContent!.replace(/\s+/g, " ").trim())).toEqual(["All 3", "To do 2", "Done 1"]);
      expect(el.querySelector(".ui-todo__list")!.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      expect(texts(el)).toEqual(["Book the hall", "Print posters", "Order badges"]);
      expect(box(el, "a").checked).toBe(true);
      expect(box(el, "b").getAttribute("aria-label")).toBe("Print posters");
      expect(el.querySelector('[role="progressbar"]')!.getAttribute("aria-valuetext")).toBe("1 of 3 done");
      expect(el.querySelector<HTMLButtonElement>(".ui-todo__add-btn")!.disabled).toBe(true);
    });
  }

  test("add: Enter adds to the end (or the start); blank adds nothing; the box clears", async () => {
    const el = await make();
    const seen = changes(el);
    const input = el.querySelector<HTMLInputElement>(".ui-todo__input")!;
    await type(input, "   ");
    el.querySelector("form")!.requestSubmit();
    await settle();
    expect(seen).toHaveLength(0);
    await type(input, "  Set up the survey ");
    el.querySelector("form")!.requestSubmit();
    await settle();
    expect(texts(el).at(-1)).toBe("Set up the survey");
    expect(input.value).toBe("");
    expect(seen[0].change.type).toBe("add");
    expect(seen[0].items).toHaveLength(4);
    expect(text(el.querySelector('[role="status"]'))).toBe("Added “Set up the survey”");
    el.addTo = "start";
    await type(input, "First thing");
    el.querySelector("form")!.requestSubmit();
    await settle();
    expect(texts(el)[0]).toBe("First thing");
    // Ids are unique
    expect(new Set(el.items.map((i) => i.id)).size).toBe(5);
  });

  test("tick off and back; tabs filter; prevented, the box shows the list as it was", async () => {
    const el = await make();
    const seen = changes(el);
    box(el, "b").click();
    await settle();
    expect(el.items.find((i) => i.id === "b")!.done).toBe(true);
    expect(seen[0].change).toEqual({ type: "toggle", id: "b", done: true });
    el.querySelector<HTMLButtonElement>('[role="tab"]:nth-child(2)')!.click();
    await settle();
    expect(el.filter).toBe("active");
    expect(texts(el)).toEqual(["Order badges"]);
    el.addEventListener("tc-items-change", (e) => e.preventDefault(), { once: true });
    box(el, "c").click();
    await settle();
    expect(box(el, "c").checked).toBe(false);
    expect(el.items.find((i) => i.id === "c")!.done).toBeFalsy();
    // Tabs move with the arrow keys
    key(el.querySelector('[role="tab"][aria-selected="true"]')!, "ArrowRight");
    await settle();
    expect(el.filter).toBe("done");
    expect(document.activeElement).toBe(el.querySelector('[role="tab"][aria-selected="true"]'));
    expect(texts(el)).toEqual(["Book the hall", "Print posters"]);
  });

  test("remove with Undo: focus goes to Undo, Undo puts it back where it was", async () => {
    const el = await make();
    const seen = changes(el);
    el.querySelector<HTMLButtonElement>('.ui-todo__item[data-id="b"] .ui-todo__remove')!.click();
    await settle();
    expect(texts(el)).toEqual(["Book the hall", "Order badges"]);
    const undo = el.querySelector<HTMLButtonElement>(".ui-todo__undo")!;
    expect(document.activeElement).toBe(undo);
    expect(text(el.querySelector(".ui-todo__removed"))).toBe("Removed “Print posters” · Undo");
    undo.click();
    await settle();
    expect(texts(el)).toEqual(["Book the hall", "Print posters", "Order badges"]);
    expect(el.querySelector(".ui-todo__removed")).toBeNull();
    expect(document.activeElement).toBe(box(el, "b"));
    expect(seen.map((s) => s.change.type)).toEqual(["remove", "restore"]);
  });

  test("edit in place: Enter keeps, Escape puts back, empty removes", async () => {
    const el = await make();
    el.querySelector<HTMLButtonElement>('.ui-todo__item[data-id="c"] .ui-todo__text')!.click();
    await settle();
    let edit = el.querySelector<HTMLInputElement>(".ui-todo__edit")!;
    expect(document.activeElement).toBe(edit);
    await type(edit, "Order 40 badges");
    key(edit, "Enter");
    await settle();
    expect(texts(el)[2]).toBe("Order 40 badges");
    expect(document.activeElement).toBe(el.querySelector('.ui-todo__item[data-id="c"] .ui-todo__text'));
    el.querySelector<HTMLButtonElement>('.ui-todo__item[data-id="c"] .ui-todo__text')!.click();
    await settle();
    edit = el.querySelector<HTMLInputElement>(".ui-todo__edit")!;
    await type(edit, "Something else");
    key(edit, "Escape");
    await settle();
    expect(texts(el)[2]).toBe("Order 40 badges");
    el.querySelector<HTMLButtonElement>('.ui-todo__item[data-id="c"] .ui-todo__text')!.click();
    await settle();
    edit = el.querySelector<HTMLInputElement>(".ui-todo__edit")!;
    await type(edit, "  ");
    key(edit, "Enter");
    await settle();
    expect(texts(el)).toEqual(["Book the hall", "Print posters"]);
  });

  test("Alt + ↑ / ↓ moves a to-do; focus stays on it", async () => {
    const el = await make();
    const seen = changes(el);
    box(el, "c").focus();
    key(box(el, "c"), "ArrowUp", { altKey: true });
    await settle();
    expect(texts(el)).toEqual(["Book the hall", "Order badges", "Print posters"]);
    expect(document.activeElement).toBe(box(el, "c"));
    expect(seen[0].change).toEqual({ type: "move", id: "c", index: 1 });
    key(box(el, "a"), "ArrowUp", { altKey: true });
    await settle();
    expect(seen).toHaveLength(1);
  });

  test("ids that aren't valid selectors work: remove, Undo, move and edit keep focus", async () => {
    const el = await make("standard", [
      { id: "1.5", text: "Dotted" },
      { id: "task:1", text: "Coloned" },
      { id: "a b", text: "Spaced" },
    ]);
    // No element ids are built from page ids
    expect(el.querySelector('[id*="1.5"], [id*="task:1"]')).toBeNull();
    box(el, "task:1").focus();
    key(box(el, "task:1"), "ArrowUp", { altKey: true });
    await settle();
    expect(texts(el)).toEqual(["Coloned", "Dotted", "Spaced"]);
    expect(document.activeElement).toBe(box(el, "task:1"));
    el.querySelector<HTMLButtonElement>('.ui-todo__item[data-id="a b"] .ui-todo__remove')!.click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-todo__undo")!.click();
    await settle();
    expect(document.activeElement).toBe(box(el, "a b"));
    el.querySelector<HTMLButtonElement>('.ui-todo__item[data-id="1.5"] .ui-todo__text')!.click();
    await settle();
    const edit = el.querySelector<HTMLInputElement>(".ui-todo__edit")!;
    await type(edit, "Dotted, edited");
    key(edit, "Enter");
    await settle();
    expect(document.activeElement).toBe(el.querySelector('.ui-todo__item[data-id="1.5"] .ui-todo__text'));
  });

  test("ticking a to-do out of the To do or Done tab moves focus to its neighbour", async () => {
    const el = await make();
    el.filter = "active";
    await settle();
    box(el, "b").focus();
    box(el, "b").click();
    await settle();
    expect(texts(el)).toEqual(["Order badges"]);
    expect(document.activeElement).toBe(box(el, "c"));
    // The last one: focus falls back to the add box
    box(el, "c").click();
    await settle();
    expect(document.activeElement).toBe(el.querySelector(".ui-todo__input"));
    // In Done, unticking moves to the next done one
    el.filter = "done";
    await settle();
    box(el, "a").focus();
    box(el, "a").click();
    await settle();
    expect(document.activeElement).toBe(box(el, "b"));
  });

  test("duplicate ids: the first is kept, so actions act on exactly one to-do", async () => {
    const el = await make("standard", [
      { id: "x", text: "First" },
      { id: "x", text: "Second" },
      { id: "y", text: "Other" },
    ]);
    expect(texts(el)).toEqual(["First", "Other"]);
    expect(el.items.map((i) => i.text)).toEqual(["First", "Other"]);
    box(el, "x").click();
    await settle();
    expect(el.items.filter((i) => i.done)).toHaveLength(1);
  });

  test("Clear done; empty states for each tab", async () => {
    const el = await make();
    el.querySelector<HTMLButtonElement>(".ui-todo__clear")!.focus();
    el.querySelector<HTMLButtonElement>(".ui-todo__clear")!.click();
    await settle();
    expect(texts(el)).toEqual(["Print posters", "Order badges"]);
    // The button went with the done to-dos: focus is on the add box
    expect(document.activeElement).toBe(el.querySelector(".ui-todo__input"));
    expect(el.querySelector(".ui-todo__clear")).toBeNull();
    el.filter = "done";
    await settle();
    expect(text(el.querySelector(".ui-todo__empty"))).toBe("Nothing ticked off yet.");
    const empty = await make("standard", []);
    expect(text(empty.querySelector(".ui-todo__empty"))).toBe("Nothing to do yet – add the first one above.");
    expect(empty.querySelector('[role="tab"]')).toBeNull();
    expect(empty.querySelector(".ui-todo__foot")).toBeNull();
  });

  test("read only: nothing to add, tick, edit or remove", async () => {
    const el = await fixture<TcTodoList>(html`<tc-todo-list readonly .items=${ITEMS}></tc-todo-list>`);
    expect(el.querySelector(".ui-todo__add")).toBeNull();
    expect(el.querySelector(".ui-todo__remove")).toBeNull();
    expect(box(el, "b").disabled).toBe(true);
    expect(el.querySelector("button.ui-todo__text")).toBeNull();
  });

  test("React wrapper: uncontrolled survives re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const lists: TodoItem[][] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(TodoList, { title: "Mine", defaultItems: ITEMS, onItemsChange: (next) => void lists.push(next), "data-n": n } as React.ComponentProps<typeof TodoList>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-todo-list")!;
    box(el, "b").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(box(el, "b").checked).toBe(true);
    expect(lists).toHaveLength(1);
    await act(async () => root.render(React.createElement(TodoList, { items: ITEMS })));
    await settle();
    const held = host.querySelector("tc-todo-list")!;
    box(held, "c").click();
    await settle();
    expect(box(held, "c").checked).toBe(false);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-todo-list heading="Prep" description="Due Friday" .items=${ITEMS}></tc-todo-list>
        <tc-todo-list look="clean" heading="Done" filter="done" .items=${ITEMS}></tc-todo-list>
        <tc-todo-list heading="Empty"></tc-todo-list>
      </div>`);
      wrap.querySelector<HTMLButtonElement>(".ui-todo__remove")!.click();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

function text(el: Element | null | undefined) {
  return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
}

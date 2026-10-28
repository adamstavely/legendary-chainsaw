/*
 * <tc-task-board> in real browsers – the block's behaviour, as an element.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import "../../src/elements/task-board";
import type { Task, TaskBoardTasksChange, TaskLabel, TaskPerson, TaskStatus, TcTaskBoard } from "../../src/elements/task-board";
import { TaskBoard } from "../../src/elements/react/task-board";
import { TaskBoard as Block } from "../../blocks/task-board";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const dot = () => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 14 14");
  s.innerHTML = '<circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor"></circle>';
  return s;
};
const STATUSES: TaskStatus[] = [
  { id: "todo", label: "Todo", icon: dot() },
  { id: "progress", label: "In progress", icon: dot() },
  { id: "done", label: "Done" },
];
const LABELS: TaskLabel[] = [
  { id: "bug", label: "Bug", color: "#ef4444" },
  { id: "docs", label: "Docs", color: "#10b981" },
];
const PEOPLE: TaskPerson[] = [
  { id: "maya", name: "Maya Kim" },
  { id: "leo", name: "Leo Brandt", avatar: "javascript:alert(1)" },
];
const TASKS: Task[] = [
  { id: "a", key: "NW-1", title: "Fix login", status: "todo", priority: 4, estimate: "S", labels: ["bug"], assignee: "maya", dueIn: -1, created: "Oct 2" },
  { id: "b", key: "NW-2", title: "Write guide", status: "todo", priority: 1, labels: ["docs"], dueIn: 2, subtasks: [1, 3], created: "Oct 3" },
  { id: "c", key: "NW-3", title: "Queue workers", status: "progress", priority: 3, labels: [], assignee: "leo", pullRequest: 12, created: "Oct 4" },
];
const NOW = new Date(2026, 9, 27, 12).getTime();

async function board(tasks = TASKS, look: "standard" | "clean" = "standard") {
  const el = await fixture<TcTaskBoard>(
    html`<tc-task-board look=${look} .now=${NOW} .tasks=${tasks} .statuses=${STATUSES} .labels=${LABELS} .people=${PEOPLE} .path=${["Northwind", "Web", "Sprint 24"]}></tc-task-board>`,
  );
  await finish(el);
  return el;
}
const column = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-tb__column[data-status="${id}"]`)!;
const cardsIn = (el: Element, id: string) => [...column(el, id).querySelectorAll<HTMLElement>("[data-card]")].map((c) => c.dataset.card);
const card = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-card="${id}"]`)!;
const inner = (el: Element | null) => el!.querySelector<HTMLButtonElement>("button")!;
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const changes = (el: Element) => {
  const seen: TaskBoardTasksChange[] = [];
  el.addEventListener("tc-tasks-change", (e) => seen.push((e as CustomEvent<TaskBoardTasksChange>).detail));
  return seen;
};

describe("tc-task-board", () => {
  test("the host is the root in both looks; a region named by the path", async () => {
    for (const look of ["standard", "clean"] as const) {
      const el = await board(TASKS, look);
      expect(el.dataset.ui).toBe("tb");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("section")!.getAttribute("aria-label")).toBe("Northwind / Web / Sprint 24");
      expect(el.querySelector(".ui-tb__crumb[aria-current='page']")!.textContent!.trim()).toBe("Sprint 24");
      expect(el.querySelectorAll(".ui-tb__column")).toHaveLength(3);
      expect(cardsIn(el, "todo")).toEqual(["a", "b"]);
      expect(el.querySelector(".ui-tb__count")!.textContent!.trim()).toBe("3 tasks");
      cleanup();
    }
  });

  test("cards show their properties: priority in words, due, subtasks, PR, labels; an unsafe avatar isn't loaded", async () => {
    const el = await board();
    const a = card(el, "a");
    expect(a.getAttribute("aria-label")).toBe("NW-1 Fix login");
    expect(a.querySelector(".ui-tb__prop .ui-tb__sr")!.textContent).toBe("Urgent");
    expect(a.querySelector("[data-tone='late']")!.textContent).toContain("1d late");
    expect(card(el, "b").querySelector("[data-tone='soon']")!.textContent).toContain("2d");
    expect(card(el, "b").textContent).toContain("1/3");
    expect(card(el, "c").textContent).toContain("#12");
    expect(a.textContent).toContain("Bug");
    // Leo's avatar URL is javascript: – initials instead of an <img>
    expect(card(el, "c").querySelector("img")).toBeNull();
    expect(card(el, "c").querySelector(".ui-tb__avatar--initials")!.textContent!.trim()).toBe("L");
    // Status icons are cloned into every place they appear
    expect(column(el, "todo").querySelectorAll(".ui-tb__status svg").length).toBeGreaterThanOrEqual(3);
  });

  test("search and the label filter narrow the board, and the count says so", async () => {
    const el = await board();
    const input = el.querySelector<HTMLInputElement>(".ui-tb__search input")!;
    input.value = "guide";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(cardsIn(el, "todo")).toEqual(["b"]);
    expect(el.querySelector(".ui-tb__count")!.textContent!.replace(/\s+/g, " ").trim()).toBe("1 task of 3");
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    inner(el.querySelector(".ui-tb__filter")).click();
    await settle();
    const menu = el.querySelector(".ui-tb__menu[role='menu']")!;
    await expect.poll(() => document.activeElement).toBe(menu.querySelector("[role='menuitemcheckbox']"));
    (menu.querySelectorAll<HTMLElement>("[role='menuitemcheckbox']")[0]).click();
    await settle();
    expect(cardsIn(el, "todo")).toEqual(["a"]);
    expect(cardsIn(el, "progress")).toEqual([]);
    expect(el.querySelector(".ui-tb__filter")!.getAttribute("label")).toBe("Filter by label, 1 selected");
    expect(column(el, "progress").querySelector(".ui-tb__empty")!.textContent).toBe("Drop tasks here");
  });

  test("the label menu: arrows, Home / End, Esc returns focus to the trigger", async () => {
    const el = await board();
    const trigger = el.querySelector(".ui-tb__filter")!;
    await key(trigger, "ArrowUp");
    const items = [...el.querySelectorAll<HTMLElement>(".ui-tb__menu [role^='menuitem']")];
    await expect.poll(() => document.activeElement).toBe(items[items.length - 1]);
    await key(items[1], "Home");
    expect(document.activeElement).toBe(items[0]);
    await key(items[0], "ArrowUp");
    expect(document.activeElement).toBe(items[items.length - 1]);
    await key(items[0], "Escape");
    expect(el.querySelector(".ui-tb__menu")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(inner(trigger));
  });

  test("open a card with Enter: the panel edits status, priority, labels, assignee and title; Esc returns focus", async () => {
    const el = await board();
    const seen = changes(el);
    card(el, "a").focus();
    await key(card(el, "a"), "Enter");
    const panel = el.querySelector<HTMLElement>(".ui-tb__panel")!;
    expect(panel.hasAttribute("data-open")).toBe(true);
    expect(panel.inert).toBe(false);
    await expect.poll(() => panel.contains(document.activeElement)).toBe(true);
    const group = (name: string) => [...panel.querySelectorAll("dt")].find((d) => d.textContent === name)!.nextElementSibling!;
    [...group("Status").querySelectorAll<HTMLElement>("button")].find((b) => b.textContent!.includes("In progress"))!.click();
    await settle();
    expect(seen.at(-1)!.change).toBe("move");
    expect(cardsIn(el, "progress")).toContain("a");
    [...group("Priority").querySelectorAll<HTMLElement>("button")].find((b) => b.textContent!.includes("Low"))!.click();
    [...group("Labels").querySelectorAll<HTMLElement>("button")].find((b) => b.textContent!.includes("Docs"))!.click();
    [...group("Assignee").querySelectorAll<HTMLElement>("button")].find((b) => b.textContent!.includes("Maya"))!.click();
    await settle();
    const title = panel.querySelector<HTMLTextAreaElement>(".ui-tb__title-input")!;
    title.value = "Fix login on Safari";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    const a = el.tasks.find((t) => t.id === "a")!;
    expect(a).toMatchObject({ status: "progress", priority: 1, labels: ["bug", "docs"], assignee: undefined, title: "Fix login on Safari" });
    await key(title, "Escape");
    expect(panel.hasAttribute("data-open")).toBe(false);
    expect(panel.inert).toBe(true);
    await expect.poll(() => document.activeElement).toBe(card(el, "a"));
  });

  test("delete from the panel: focus moves to the neighbour card", async () => {
    const el = await board();
    const seen = changes(el);
    card(el, "a").click();
    await settle();
    inner(el.querySelector(".ui-tb__panel-foot tc-button")).click();
    await settle();
    expect(seen.at(-1)).toMatchObject({ change: "delete", task: { id: "a" } });
    expect(el.tasks.map((t) => t.id)).toEqual(["b", "c"]);
    await expect.poll(() => document.activeElement).toBe(card(el, "b"));
  });

  test("add a card per column: Enter adds it at the top and focuses it, Esc cancels", async () => {
    const el = await board();
    const seen = changes(el);
    inner(el.querySelector('[data-add="done"]')).click();
    await settle();
    const input = el.querySelector<HTMLInputElement>('[data-new="done"]')!;
    await expect.poll(() => document.activeElement).toBe(input);
    input.value = "Ship it";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.form!.requestSubmit();
    await settle();
    expect(seen.at(-1)!.change).toBe("add");
    const added = el.tasks[0];
    expect(added).toMatchObject({ title: "Ship it", status: "done", priority: 0, created: "Oct 27" });
    await expect.poll(() => document.activeElement).toBe(card(el, added.id));
    inner(el.querySelector('[data-add="done"]')).click();
    await settle();
    await key(el.querySelector('[data-new="done"]')!, "Escape");
    expect(el.querySelector('[data-new="done"]')).toBeNull();
    expect(el.tasks).toHaveLength(4);
    await expect.poll(() => document.activeElement).toBe(inner(el.querySelector('[data-add="done"]')));
  });

  test("drag a card to another column, before the card under the pointer", async () => {
    const el = await board();
    const seen = changes(el);
    const data = new DataTransfer();
    card(el, "c").dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: data }));
    await settle();
    expect(card(el, "c").hasAttribute("data-dragging")).toBe(true);
    const target = column(el, "todo");
    const top = card(el, "a").getBoundingClientRect();
    target.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, clientY: top.top + 2, dataTransfer: data }));
    await settle();
    expect(target.hasAttribute("data-over")).toBe(true);
    expect(target.querySelector(".ui-tb__drop")).not.toBeNull();
    target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data }));
    await settle();
    expect(seen.at(-1)).toMatchObject({ change: "move", task: { id: "c", status: "todo" } });
    expect(cardsIn(el, "todo")).toEqual(["c", "a", "b"]);
  });

  test("controlled: preventDefault keeps the tasks", async () => {
    const el = await board();
    el.addEventListener("tc-tasks-change", (e) => e.preventDefault());
    card(el, "a").click();
    await settle();
    inner(el.querySelector(".ui-tb__panel-foot tc-button")).click();
    await settle();
    expect(el.tasks).toBe(TASKS);
    expect(cardsIn(el, "todo")).toEqual(["a", "b"]);
    // Prevented, the panel stays open on the card
    expect(el.querySelector(".ui-tb__panel")!.hasAttribute("data-open")).toBe(true);
  });

  test("compact hides the properties; the toggle is pressed", async () => {
    const el = await board();
    inner(el.querySelector(".ui-tb__compact")).click();
    await settle();
    expect(el.compact).toBe(true);
    expect(inner(el.querySelector(".ui-tb__compact")).getAttribute("aria-pressed")).toBe("true");
    expect(getComputedStyle(card(el, "a").querySelector(".ui-tb__props")!).display).toBe("none");
  });

  test("narrow: columns scroll sideways inside the board, the breadcrumb keeps two steps", async () => {
    const wrap = await fixture(html`<div style="width: 360px"><tc-task-board .now=${NOW} .tasks=${TASKS} .statuses=${STATUSES} .labels=${LABELS} .people=${PEOPLE} .path=${["A", "B", "C"]}></tc-task-board></div>`);
    const el = wrap.querySelector<TcTaskBoard>("tc-task-board")!;
    await finish(el);
    expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(360);
    const cols = el.querySelector<HTMLElement>(".ui-tb__columns")!;
    expect(cols.scrollWidth).toBeGreaterThan(cols.clientWidth);
    const crumbs = [...el.querySelectorAll<HTMLElement>(".ui-tb__crumb")].filter((c) => getComputedStyle(c).display !== "none");
    expect(crumbs.map((c) => c.textContent!.trim())).toEqual(["B", "C"]);
  });

  test("React: uncontrolled keeps changes over re-renders; controlled reports and waits for the parent", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const onTasksChange = vi.fn();
    const statuses = STATUSES.map((s) => ({ ...s, icon: React.createElement("svg", { viewBox: "0 0 14 14", "data-react-icon": s.id }) }));
    await act(async () => root.render(React.createElement(TaskBoard, { defaultTasks: TASKS, statuses, labels: LABELS, people: PEOPLE, onTasksChange })));
    await settle();
    const el = host.querySelector<TcTaskBoard>("tc-task-board")!;
    // React icons are rendered and cloned in
    await expect.poll(() => el.querySelector("[data-react-icon='todo']")).not.toBeNull();
    card(el, "a").click();
    await settle();
    await act(async () => inner(el.querySelector(".ui-tb__panel-foot tc-button")).click());
    await settle();
    expect(onTasksChange, JSON.stringify(onTasksChange.mock.calls).slice(0, 300)).toHaveBeenCalledTimes(1);
    expect(onTasksChange.mock.calls[0][0].map((t: Task) => t.id)).toEqual(["b", "c"]);
    await act(async () => root.render(React.createElement(TaskBoard, { defaultTasks: TASKS, statuses, labels: LABELS, people: PEOPLE, onTasksChange, path: ["X"] })));
    await settle();
    expect(el.tasks.map((t) => t.id)).toEqual(["b", "c"]);

    const onControlled = vi.fn();
    await act(async () => root.render(React.createElement(TaskBoard, { tasks: TASKS, statuses, labels: LABELS, people: PEOPLE, onTasksChange: onControlled })));
    await settle();
    expect(el.tasks.map((t) => t.id)).toEqual(["a", "b", "c"]);
    card(el, "b").click();
    await settle();
    await act(async () => inner(el.querySelector(".ui-tb__panel-foot tc-button")).click());
    await settle();
    expect(onControlled).toHaveBeenCalledTimes(1);
    expect(el.tasks.map((t) => t.id)).toEqual(["a", "b", "c"]);
    act(() => root.unmount());
  });

  test("the block file keeps its props, including the deprecated onChange", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const onChange = vi.fn();
    await act(async () => root.render(React.createElement(Block, { defaultTasks: TASKS, statuses: STATUSES.map(({ icon: _, ...s }) => s), labels: LABELS, people: PEOPLE, onChange })));
    await settle();
    const el = host.querySelector<TcTaskBoard>("tc-task-board")!;
    card(el, "c").click();
    await settle();
    await act(async () => inner(el.querySelector(".ui-tb__panel-foot tc-button")).click());
    expect(onChange).toHaveBeenCalledTimes(1);
    act(() => root.unmount());
  });

  test("axe: no violations in both looks and both themes, with the panel open", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-task-board .now=${NOW} .tasks=${TASKS} .statuses=${STATUSES} .labels=${LABELS} .people=${PEOPLE}></tc-task-board>
        <tc-task-board look="clean" .now=${NOW} .tasks=${TASKS} .statuses=${STATUSES} .labels=${LABELS} .people=${PEOPLE}></tc-task-board>
      </div>`);
      card(wrap.querySelector("tc-task-board")!, "a").click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});

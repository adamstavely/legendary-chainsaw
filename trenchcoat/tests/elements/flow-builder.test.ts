/*
 * <tc-flow-builder> in real browsers: the trigger, steps and If / else paths, the + menu adding a step where it was
 * pressed, renaming, moving and removing, undo and redo, the one tab stop, a test run's light and statuses, read-only,
 * the narrow layout, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/flow-builder";
import {
  flowCount,
  flowInsert,
  flowMove,
  flowPlaceOf,
  flowRemove,
  flowRename,
  flowStep,
  type FlowChange,
  type FlowStep,
  type TcFlowBuilder,
} from "../../src/elements/flow-builder";
import { FlowBuilder } from "../../src/elements/react/flow-builder";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const FLOW: FlowStep[] = [
  { id: "classify", kind: "llm", title: "Sort the request" },
  {
    id: "factual",
    kind: "condition",
    title: "Is it a factual error?",
    branches: [
      { id: "yes", label: "Factual error", steps: [{ id: "draft", kind: "llm", title: "Draft a correction" }, { id: "signoff", kind: "approval", title: "Editor signs off" }] },
      { id: "no", label: "Anything else", steps: [{ id: "reply", kind: "output", title: "Send the standard reply" }] },
    ],
  },
  { id: "log", kind: "output", title: "Log it" },
];
const make = (look: "standard" | "clean" = "standard", flow = FLOW) =>
  fixture<TcFlowBuilder>(html`<tc-flow-builder look=${look} heading="Corrections" .trigger=${{ title: "Form submitted" }} .flow=${flow}></tc-flow-builder>`);
const nav = (el: Element, key: string) => el.querySelector<HTMLElement>(`[data-nav="${key}"]`)!;
const key = (t: Element, k: string, init: KeyboardEventInit = {}) => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const changes = (el: Element) => {
  const seen: FlowChange[] = [];
  el.addEventListener("tc-flow-change", (e) => seen.push((e as CustomEvent<FlowChange>).detail));
  return seen;
};
const titles = (steps: FlowStep[]) => steps.map((s) => s.title);

describe("tc-flow-builder", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the trigger, steps and paths, a + on every line and one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("flb");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("[data-trigger] .ui-flb__title")!.textContent).toBe("Form submitted");
      expect(el.querySelectorAll(".ui-flb__step:not([data-trigger])").length).toBe(6);
      expect(el.querySelector(".ui-flb__count")!.textContent).toBe("6 steps");
      expect([...el.querySelectorAll(".ui-flb__path")].map((p) => p.textContent!.trim())).toEqual(["Path: Factual error", "Path: Anything else"]);
      expect(el.querySelector(".ui-flb__branches")!.getAttribute("aria-label")).toBe("Paths of Is it a factual error?");
      // root: 4 (+) – before, between and after 3 steps; yes: 3; no: 2
      expect(el.querySelectorAll(".ui-flb__add").length).toBe(9);
      expect(nav(el, "add:root:1").textContent).toContain("Add a step after Sort the request");
      expect(nav(el, "add:no:0").textContent).toContain("Add a step at the start of Anything else");
      const stops = [...el.querySelectorAll("[data-nav]")].filter((n) => n.getAttribute("tabindex") === "0");
      expect(stops.length).toBe(1);
      expect(nav(el, "step:draft").textContent).toBe("AI: Draft a correction");
    });
  }

  test("the helpers insert, remove, move, rename, find and count in nested paths", () => {
    const added = flowInsert(FLOW, { list: "yes", index: 1 }, { id: "x", kind: "wait", title: "Wait a day" });
    expect(titles(added[1].branches![0].steps)).toEqual(["Draft a correction", "Wait a day", "Editor signs off"]);
    expect(FLOW[1].branches![0].steps.length).toBe(2);
    expect(added[0]).toBe(FLOW[0]);
    expect(flowCount(added)).toBe(7);
    expect(flowPlaceOf(added, "x")).toMatchObject({ list: "yes", index: 1 });
    expect(flowCount(flowRemove(FLOW, "factual"))).toBe(2);
    expect(titles(flowMove(FLOW, "log", -1))).toEqual(["Sort the request", "Log it", "Is it a factual error?"]);
    expect(flowMove(FLOW, "classify", -1)).toBe(FLOW);
    const renamed = flowRename(FLOW, "no", "Other");
    expect(renamed[1].branches![1].label).toBe("Other");
    expect(flowStep(flowRename(FLOW, "reply", "Reply"), "reply")!.title).toBe("Reply");
    expect(flowPlaceOf(FLOW, "nope")).toBeNull();
  });

  test("a + opens the menu; picking adds the step there, focuses it and says so; preventDefault keeps the flow", async () => {
    const el = await make();
    const seen = changes(el);
    nav(el, "add:root:1").click();
    await settle();
    const menu = el.querySelector(".ui-flb__menu")!;
    expect(menu.getAttribute("role")).toBe("menu");
    expect(nav(el, "add:root:1").getAttribute("aria-expanded")).toBe("true");
    await expect.poll(() => document.activeElement?.classList.contains("ui-flb__menu-item")).toBe(true);
    key(document.activeElement!, "ArrowDown");
    expect((document.activeElement as HTMLElement).textContent).toContain("Send message");
    key(document.activeElement!, "ArrowUp");
    [...menu.querySelectorAll<HTMLElement>(".ui-flb__menu-item")].find((b) => b.textContent!.includes("If / else"))!.click();
    await settle();
    expect(seen.at(-1)!.change).toBe("add");
    expect(titles(el.flow)).toEqual(["Sort the request", "If / else", "Is it a factual error?", "Log it"]);
    expect(el.flow[1].branches!.map((b) => b.label)).toEqual(["If", "Else"]);
    expect(el.querySelector(".ui-flb__menu")).toBeNull();
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.nav).toBe(`step:${el.flow[1].id}`);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Added If / else after Sort the request");

    el.addEventListener("tc-flow-change", (e) => e.preventDefault(), { once: true });
    nav(el, "add:yes:0").click();
    await settle();
    el.querySelector<HTMLElement>(".ui-flb__menu-item")!.click();
    await settle();
    expect(el.flow[2].branches![0].steps.length).toBe(2);
  });

  test("Escape closes the menu and returns focus to its +; a click outside closes it", async () => {
    const el = await make();
    nav(el, "add:root:0").click();
    await settle();
    await expect.poll(() => document.activeElement?.classList.contains("ui-flb__menu-item")).toBe(true);
    key(document.activeElement!, "Escape");
    await settle();
    expect(el.querySelector(".ui-flb__menu")).toBeNull();
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.nav).toBe("add:root:0");
    nav(el, "add:root:0").click();
    await settle();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await settle();
    expect(el.querySelector(".ui-flb__menu")).toBeNull();
  });

  test("↑ / ↓, Home and End move the tab stop through steps, path names and + buttons in reading order", async () => {
    const el = await make();
    nav(el, "add:root:0").focus();
    key(document.activeElement!, "ArrowDown");
    await settle();
    expect((document.activeElement as HTMLElement).dataset.nav).toBe("step:classify");
    key(document.activeElement!, "ArrowDown");
    await settle();
    key(document.activeElement!, "ArrowDown");
    await settle();
    expect((document.activeElement as HTMLElement).dataset.nav).toBe("step:factual");
    key(document.activeElement!, "ArrowDown");
    await settle();
    expect((document.activeElement as HTMLElement).dataset.nav).toBe("branch:yes");
    key(document.activeElement!, "End");
    await settle();
    expect((document.activeElement as HTMLElement).dataset.nav).toBe("add:root:3");
    key(document.activeElement!, "Home");
    await settle();
    expect((document.activeElement as HTMLElement).dataset.nav).toBe("add:root:0");
    expect([...el.querySelectorAll("[data-nav]")].filter((n) => n.getAttribute("tabindex") === "0").length).toBe(1);
  });

  test("Alt + arrows move a step within its path, Delete removes it, Enter renames it; the buttons do the same", async () => {
    const el = await make();
    const seen = changes(el);
    nav(el, "step:draft").focus();
    key(nav(el, "step:draft"), "ArrowDown", { altKey: true });
    await settle();
    expect(titles(el.flow[1].branches![0].steps)).toEqual(["Editor signs off", "Draft a correction"]);
    expect(seen.at(-1)).toMatchObject({ change: "move", id: "draft" });
    expect(document.activeElement).toBe(nav(el, "step:draft"));
    key(nav(el, "step:draft"), "ArrowDown", { altKey: true });
    await settle();
    expect(seen.length).toBe(1);

    key(nav(el, "step:draft"), "Enter");
    await settle();
    const input = el.querySelector<HTMLInputElement>(".ui-flb__rename")!;
    expect(input).toBeTruthy();
    await expect.poll(() => document.activeElement === input || (input.focus(), document.activeElement === input)).toBe(true);
    input.value = "Write the correction";
    key(input, "Enter");
    await settle();
    expect(flowStep(el.flow, "draft")!.title).toBe("Write the correction");
    expect(seen.at(-1)!.change).toBe("rename");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.nav).toBe("step:draft");

    key(nav(el, "step:factual"), "Delete");
    await settle();
    expect(titles(el.flow)).toEqual(["Sort the request", "Log it"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Removed Is it a factual error? and the 3 steps in its paths. Undo brings it back.");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.nav).toBe("add:root:1");

    el.querySelector<HTMLElement>('.ui-flb__act[aria-label="Move Log it up"]')!.click();
    await settle();
    expect(titles(el.flow)).toEqual(["Log it", "Sort the request"]);
    el.querySelector<HTMLElement>('.ui-flb__act[aria-label="Remove Log it"]')!.click();
    await settle();
    expect(titles(el.flow)).toEqual(["Sort the request"]);
  });

  test("a path's name is renamed in place; Escape leaves it", async () => {
    const el = await make();
    nav(el, "branch:no").click();
    await settle();
    const input = el.querySelector<HTMLInputElement>(".ui-flb__rename")!;
    input.value = "Other";
    key(input, "Escape");
    await settle();
    expect(el.flow[1].branches![1].label).toBe("Anything else");
    key(nav(el, "branch:no"), "F2");
    await settle();
    const again = el.querySelector<HTMLInputElement>(".ui-flb__rename")!;
    again.value = "Other";
    key(again, "Enter");
    await settle();
    expect(el.flow[1].branches![1].label).toBe("Other");
  });

  test("Undo and Redo walk edits back and forth, by button and by ⌘Z / ⇧⌘Z; a new flow from the page clears them", async () => {
    const el = await make();
    const seen = changes(el);
    const undo = el.querySelector<HTMLButtonElement>('[data-tool="undo"]')!;
    const redo = el.querySelector<HTMLButtonElement>('[data-tool="redo"]')!;
    expect(undo.disabled).toBe(true);
    key(nav(el, "step:log"), "Delete");
    await settle();
    expect(flowCount(el.flow)).toBe(5);
    expect(undo.disabled).toBe(false);
    undo.click();
    await settle();
    expect(flowCount(el.flow)).toBe(6);
    expect(seen.at(-1)!.change).toBe("undo");
    expect(redo.disabled).toBe(false);
    redo.click();
    await settle();
    expect(flowCount(el.flow)).toBe(5);
    key(nav(el, "step:classify"), "z", { metaKey: true, ctrlKey: true });
    await settle();
    expect(flowCount(el.flow)).toBe(6);
    key(nav(el, "step:classify"), "z", { metaKey: true, ctrlKey: true, shiftKey: true });
    await settle();
    expect(flowCount(el.flow)).toBe(5);
    el.flow = FLOW;
    await settle();
    expect(undo.disabled).toBe(true);
    expect(redo.disabled).toBe(true);
  });

  test("a test run: Test run asks the page, the line into the running step is lit, and steps say their status", async () => {
    const el = await make();
    let asked: FlowStep[] | null = null;
    el.addEventListener("tc-test-run", (e) => (asked = (e as CustomEvent<{ flow: FlowStep[] }>).detail.flow));
    el.querySelector<HTMLButtonElement>(".ui-flb__test")!.click();
    expect(asked).toBe(el.flow);
    el.statuses = { classify: "done", factual: "done", draft: "running", reply: "skipped" };
    await settle();
    const into = nav(el, "add:yes:0").closest(".ui-flb__link")!;
    expect(into.hasAttribute("data-flow")).toBe(true);
    expect(nav(el, "add:root:1").closest(".ui-flb__link")!.hasAttribute("data-done")).toBe(true);
    expect(nav(el, "step:draft").textContent).toBe("AI: Draft a correction, Running");
    expect(el.querySelector('.ui-flb__step[data-status="skipped"] .ui-flb__status')!.textContent).toBe("Skipped");
    const test = el.querySelector<HTMLButtonElement>(".ui-flb__test")!;
    expect(test.disabled).toBe(true);
    expect(test.textContent).toBe("Running…");
  });

  test("read-only: no + buttons, step actions or Undo; steps can't be renamed", async () => {
    const el = await fixture<TcFlowBuilder>(html`<tc-flow-builder readonly .flow=${FLOW}></tc-flow-builder>`);
    expect(el.querySelectorAll(".ui-flb__add").length).toBe(0);
    expect(el.querySelectorAll(".ui-flb__actions").length).toBe(0);
    expect(el.querySelector('[data-tool="undo"]')).toBeNull();
    nav(el, "step:classify").click();
    await settle();
    expect(el.querySelector(".ui-flb__rename")).toBeNull();
    expect([...el.querySelectorAll("[data-nav]")].filter((n) => n.getAttribute("tabindex") === "0").length).toBe(1);
  });

  test("narrow, an If / else's paths stack", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="width: 380px"><tc-flow-builder .flow=${FLOW}></tc-flow-builder></div>`);
    const branches = wrap.querySelector<HTMLElement>(".ui-flb__branches")!;
    expect(getComputedStyle(branches).flexDirection).toBe("column");
    const [a, b] = [...wrap.querySelectorAll<HTMLElement>(".ui-flb__branch")];
    expect(b.getBoundingClientRect().top).toBeGreaterThan(a.getBoundingClientRect().bottom - 1);
  });

  test("an empty flow has one + and says 0 steps", async () => {
    const el = await make("standard", []);
    expect(el.querySelectorAll(".ui-flb__add").length).toBe(1);
    expect(el.querySelector(".ui-flb__count")!.textContent).toBe("0 steps");
    expect(nav(el, "add:root:0").getAttribute("tabindex")).toBe("0");
  });

  test("React wrapper: an uncontrolled flow survives re-renders; a controlled one stays until the parent changes it", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(FlowBuilder, { title: "Flow", defaultFlow: FLOW, onFlowChange: (_f, change, id) => void seen.push(`${change}:${id}`), "data-n": n } as React.ComponentProps<typeof FlowBuilder>);
    }
    await act(async () => root.render(React.createElement(App)));
    const el = host.querySelector<TcFlowBuilder>("tc-flow-builder")!;
    expect(el.heading).toBe("Flow");
    await act(async () => void key(nav(el, "step:log"), "Delete"));
    expect(flowCount(el.flow)).toBe(5);
    await act(async () => bump());
    expect(flowCount(el.flow)).toBe(5);
    expect(seen).toEqual(["remove:log"]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    let tested = 0;
    await act(async () => root2.render(React.createElement(FlowBuilder, { flow: FLOW, onFlowChange: (_f, change, id) => void seen.push(`${change}:${id}`), onTestRun: () => void tested++ })));
    const el2 = host2.querySelector<TcFlowBuilder>("tc-flow-builder")!;
    await act(async () => void key(nav(el2, "step:log"), "Delete"));
    expect(flowCount(el2.flow)).toBe(6);
    expect(seen.at(-1)).toBe("remove:log");
    await act(async () => el2.querySelector<HTMLButtonElement>(".ui-flb__test")!.click());
    expect(tested).toBe(1);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with a run and the menu open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-flow-builder look="standard" heading="Corrections" .flow=${FLOW} .statuses=${{ classify: "done", factual: "done", draft: "running", reply: "skipped" }}></tc-flow-builder>
        <tc-flow-builder look="clean" heading="Corrections, clean" .flow=${FLOW}></tc-flow-builder>
      </div>`);
      wrap.querySelector<HTMLElement>('tc-flow-builder[look="clean"] [data-nav="add:root:1"]')!.click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

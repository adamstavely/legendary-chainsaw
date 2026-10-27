/*
 * <tc-tool-permissions> in real browsers: the matrix as a WAI-ARIA grid, the per-cell choice, presets, the summary,
 * Reset and Save, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/tool-permissions";
import type { TcToolPermissions, ToolPermissionAgent, ToolPermissionMatrix, ToolPermissionSave, ToolPermissionTool, ToolPermissionValueChange } from "../../src/elements/tool-permissions";
import { ToolPermissions } from "../../src/elements/react/tool-permissions";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const agents: ToolPermissionAgent[] = [
  { id: "coder", name: "Coder", model: "Sonnet" },
  { id: "ops", name: "Ops" },
];
const tools: ToolPermissionTool[] = [
  {
    id: "github",
    name: "GitHub",
    scopes: [
      { id: "read", label: "Read code", description: "Repos and issues" },
      { id: "pr", label: "Open pull requests", risk: "risky" },
      { id: "push", label: "Push to main", risk: "destructive" },
    ],
  },
  { id: "slack", name: "Slack", scopes: [{ id: "post", label: "Post", risk: "risky" }] },
];
/** Custom: no preset matches it (Ops may not read code) */
const START: ToolPermissionMatrix = { coder: { "github/read": "allow", "github/pr": "ask" }, ops: { "github/read": "deny" } };

const cell = (el: Element, r: number, c: number) => el.querySelector<HTMLElement>(`[data-cell="${r}:${c}"]`)!;
const level = (el: Element, r: number, c: number) => cell(el, r, c).dataset.level;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const preset = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-tperm__preset")].find((b) => b.textContent!.trim() === name)!;
const save = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-tperm__btn--primary")!;
const reset = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-tperm__btn:not(.ui-tperm__btn--primary)")!;
const make = (look: "standard" | "clean" = "standard", value: ToolPermissionMatrix = START) =>
  fixture<TcToolPermissions>(html`<tc-tool-permissions look=${look} description="What each agent may do." .agents=${agents} .tools=${tools} .value=${value}></tc-tool-permissions>`);
const finish = async (root: Element) => {
  for (const a of root.getAnimations?.({ subtree: true }) ?? []) a.finish();
  await settle();
};

describe("tc-tool-permissions", () => {
  test("the host and the grid: rows grouped by tool, agents as column headers, one tab stop", async () => {
    const el = await make();
    expect(el.dataset.ui).toBe("tperm");
    expect(el.dataset.look).toBe("standard");
    const grid = el.querySelector('[role="grid"]')!;
    expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toBe("Tool permissions");
    const headers = [...grid.querySelectorAll('[role="columnheader"]')];
    expect(headers.map((h) => h.querySelector(".ui-tperm__agent-name, .ui-tperm__corner-label")!.textContent)).toEqual(["Tool and scope", "Coder", "Ops"]);
    expect(headers[1].querySelector(".ui-tperm__agent-model")!.textContent).toBe("Sonnet");
    expect(headers[1].querySelector(".ui-tperm__avatar")!.getAttribute("aria-hidden")).toBe("true");
    expect([...grid.querySelectorAll(".ui-tperm__group")].map((g) => g.textContent!.trim())).toEqual(["GitHub", "Slack"]);
    expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(8);
    expect(grid.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
    expect(grid.getAttribute("aria-rowcount")).toBe("7");
    expect([...grid.querySelectorAll('[role="row"]')].map((r) => r.getAttribute("aria-rowindex"))).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
    // The row header names the tool too, for a screen reader moving down a column
    expect(cell(el, 1, 0).closest("tr")!.querySelector('[role="rowheader"]')!.textContent).toContain("GitHub · Open pull requests");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: cells show the value, the default level and each scope's offered levels`, async () => {
      const el = await make(look);
      expect(el.dataset.look).toBe(look);
      expect(level(el, 0, 0)).toBe("allow");
      expect(level(el, 1, 0)).toBe("ask");
      // Missing: the default level
      expect(level(el, 1, 1)).toBe("ask");
      // Destructive scopes never offer Allow
      expect(cell(el, 2, 0).querySelector('[data-level="allow"]')!.hasAttribute("data-off")).toBe(true);
      expect(cell(el, 0, 0).querySelector(".ui-tperm__sr")!.textContent).toBe("Allow");
      el.defaultLevel = "deny";
      await settle();
      expect(level(el, 1, 1)).toBe("deny");
    });
  }

  test("clicking a choice sets the cell; tc-value-change carries the value, the changes and the cause", async () => {
    const el = await make();
    const events: ToolPermissionValueChange[] = [];
    el.addEventListener("tc-value-change", (e) => events.push((e as CustomEvent<ToolPermissionValueChange>).detail));
    cell(el, 1, 0).querySelector<HTMLElement>('[data-level="deny"]')!.click();
    await settle();
    expect(level(el, 1, 0)).toBe("deny");
    expect(el.value.coder["github/pr"]).toBe("deny");
    expect(events[0].cause).toEqual({ type: "cell", agent: "coder", tool: "github", scope: "pr", level: "deny" });
    expect(events[0].changes).toEqual([{ agent: "coder", tool: "github", scope: "pr", from: "ask", to: "deny" }]);
    expect(cell(el, 1, 0).hasAttribute("data-changed")).toBe(true);
    expect(cell(el, 1, 0).querySelector(".ui-tperm__sr")!.textContent).toBe("Deny, changed from Ask");
    // A level the scope doesn't offer does nothing
    cell(el, 2, 0).querySelector<HTMLElement>('[data-level="allow"]')!.click();
    await settle();
    expect(events).toHaveLength(1);
    expect(level(el, 2, 0)).toBe("ask");
  });

  test("keyboard: arrows, Home/End, ⌘/Ctrl+Home/End and PageDown move a roving tab stop between cells", async () => {
    const el = await make();
    const at = () => (document.activeElement as HTMLElement).dataset.cell;
    cell(el, 0, 0).focus();
    key(cell(el, 0, 0), "ArrowRight");
    await settle();
    expect(at()).toBe("0:1");
    expect(cell(el, 0, 1).tabIndex).toBe(0);
    expect(cell(el, 0, 0).tabIndex).toBe(-1);
    key(document.activeElement!, "ArrowRight");
    await settle();
    expect(at()).toBe("0:1");
    // Down crosses the tool's group row to the next scope
    for (let i = 0; i < 3; i++) {
      key(document.activeElement!, "ArrowDown");
      await settle();
    }
    expect(at()).toBe("3:1");
    key(document.activeElement!, "Home");
    await settle();
    expect(at()).toBe("3:0");
    key(document.activeElement!, "Home", { ctrlKey: true, metaKey: true });
    await settle();
    expect(at()).toBe("0:0");
    key(document.activeElement!, "End", { ctrlKey: true, metaKey: true });
    await settle();
    expect(at()).toBe("3:1");
    key(document.activeElement!, "PageUp");
    await settle();
    expect(at()).toBe("0:1");
    key(document.activeElement!, "ArrowUp");
    await settle();
    expect(at()).toBe("0:1");
  });

  test("keyboard: Space/Enter step through the offered levels, Shift backwards; 1/2/3 pick; Delete puts back the saved one", async () => {
    const el = await make();
    const c = cell(el, 1, 0);
    c.focus();
    key(c, " ");
    await settle();
    expect(level(el, 1, 0)).toBe("deny");
    key(c, "Enter");
    await settle();
    expect(level(el, 1, 0)).toBe("allow");
    key(c, " ", { shiftKey: true });
    await settle();
    expect(level(el, 1, 0)).toBe("deny");
    key(c, "2");
    await settle();
    expect(level(el, 1, 0)).toBe("ask");
    key(c, "1");
    await settle();
    expect(level(el, 1, 0)).toBe("allow");
    key(c, "Delete");
    await settle();
    expect(level(el, 1, 0)).toBe("ask");
    // Destructive: Space skips Allow
    const d = cell(el, 2, 0);
    key(d, " ");
    await settle();
    expect(level(el, 2, 0)).toBe("deny");
    key(d, " ");
    await settle();
    expect(level(el, 2, 0)).toBe("ask");
    expect(document.activeElement === c || document.activeElement === document.body || el.contains(document.activeElement)).toBe(true);
  });

  test("presets: the matching one is checked; picking one applies it to every agent, within each scope's levels", async () => {
    const el = await make();
    const checked = () => el.querySelector('.ui-tperm__preset[aria-checked="true"]')?.textContent;
    expect(checked()).toBeUndefined();
    expect(el.querySelector(".ui-tperm__custom")!.textContent).toBe("Custom");
    const events: ToolPermissionValueChange[] = [];
    el.addEventListener("tc-value-change", (e) => events.push((e as CustomEvent<ToolPermissionValueChange>).detail));
    preset(el, "Trusted").click();
    await settle();
    expect(checked()).toBe("Trusted");
    expect(el.querySelector(".ui-tperm__custom")).toBeNull();
    expect(events[0].cause).toEqual({ type: "preset", preset: "trusted" });
    expect([level(el, 0, 1), level(el, 1, 1), level(el, 2, 1), level(el, 3, 1)]).toEqual(["allow", "allow", "ask", "allow"]);
    // Arrow keys move through the radiogroup and apply
    preset(el, "Trusted").focus();
    key(preset(el, "Trusted"), "ArrowRight");
    await settle();
    expect(checked()).toBe("Locked");
    expect(document.activeElement).toBe(preset(el, "Locked"));
    expect(preset(el, "Locked").tabIndex).toBe(0);
    expect([level(el, 0, 0), level(el, 2, 0)]).toEqual(["ask", "ask"]);
    // Read only: destructive scopes fall to the stricter level
    preset(el, "Read only").click();
    await settle();
    expect([level(el, 0, 0), level(el, 1, 0), level(el, 2, 0)]).toEqual(["allow", "deny", "deny"]);
    el.presets = [];
    await settle();
    expect(el.querySelector(".ui-tperm__presets")).toBeNull();
  });

  test("summary, Reset and Save: changes since the first value, then since the save", async () => {
    const el = await make();
    expect(el.querySelector(".ui-tperm__label")!.textContent).toBe("No changes");
    expect(save(el).getAttribute("aria-disabled")).toBe("true");
    const saves: ToolPermissionSave[] = [];
    el.addEventListener("tc-save", (e) => saves.push((e as CustomEvent<ToolPermissionSave>).detail));
    save(el).click();
    await settle();
    expect(saves).toHaveLength(0);
    preset(el, "Trusted").click();
    await settle();
    expect(el.querySelector(".ui-tperm__count")!.textContent).toBe("5");
    expect(el.querySelectorAll(".ui-tperm__change")).toHaveLength(4);
    expect(el.querySelector(".ui-tperm__change")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Ops · GitHub read code Deny to Allow");
    const more = el.querySelector<HTMLButtonElement>(".ui-tperm__more")!;
    expect(more.textContent).toBe("1 more");
    more.click();
    await settle();
    expect(el.querySelectorAll(".ui-tperm__change")).toHaveLength(5);
    expect(save(el).textContent).toContain("5");
    reset(el).click();
    await settle();
    expect(el.querySelector(".ui-tperm__label")!.textContent).toBe("No changes");
    expect(level(el, 1, 0)).toBe("ask");
    preset(el, "Trusted").click();
    await settle();
    save(el).click();
    await settle();
    expect(saves[0].changes).toHaveLength(5);
    expect(el.saved).toEqual(saves[0].value);
    expect(el.querySelector(".ui-tperm__label")!.textContent).toBe("No changes");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Saved 5 changes");
    expect(el.querySelectorAll("[data-changed]")).toHaveLength(0);
  });

  test("controlled: preventDefault() keeps the value and the saved state", async () => {
    const el = await make();
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    cell(el, 1, 0).querySelector<HTMLElement>('[data-level="deny"]')!.click();
    preset(el, "Trusted").click();
    await settle();
    expect(level(el, 1, 0)).toBe("ask");
    expect(el.value).toEqual(START);
    const el2 = await make("clean", { ...START, ops: { "github/read": "allow" } });
    el2.saved = START;
    await settle();
    el2.addEventListener("tc-save", (e) => e.preventDefault());
    save(el2).click();
    await settle();
    expect(el2.saved).toEqual(START);
    expect(el2.querySelector(".ui-tperm__count")!.textContent).toBe("1");
  });

  test("focus: clicking a choice focuses its cell; rows going away keep the tab stop inside the grid", async () => {
    const el = await make();
    const opt = cell(el, 3, 1).querySelector<HTMLElement>('[data-level="deny"]')!;
    opt.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" }));
    opt.click();
    await settle();
    expect(document.activeElement).toBe(cell(el, 3, 1));
    el.tools = [tools[0]];
    el.agents = [agents[0]];
    await settle();
    expect(el.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
    expect(el.querySelector('[role="gridcell"][tabindex="0"]')!.getAttribute("data-cell")).toBe("2:0");
  });

  test("an empty element renders without errors", async () => {
    const el = await fixture<TcToolPermissions>(html`<tc-tool-permissions></tc-tool-permissions>`);
    expect(el.querySelector(".ui-tperm__empty")).toBeTruthy();
    expect(el.querySelector('[role="grid"]')).toBeNull();
  });

  test("React wrapper: an uncontrolled value and save survive parent re-renders; callbacks fire", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ToolPermissions, {
        title: "Who may do what",
        agents: [{ id: "coder", name: "Coder", avatar: React.createElement("i", null, "C") }],
        tools: [{ ...tools[0], icon: React.createElement("b", null, "G") }],
        defaultValue: START,
        onChange: (v, d) => void seen.push(["change", v.coder["github/pr"], d.cause.type]),
        onSave: (v, c) => void seen.push(["save", c.length]),
        "data-n": n,
      } as React.ComponentProps<typeof ToolPermissions>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-tool-permissions")!;
    expect(el.querySelector(".ui-tperm__avatar i")!.textContent).toBe("C");
    expect(el.querySelector(".ui-tperm__tool-icon b")!.textContent).toBe("G");
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Who may do what");
    cell(el, 1, 0).querySelector<HTMLElement>('[data-level="allow"]')!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(level(el, 1, 0)).toBe("allow");
    save(el).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.querySelector(".ui-tperm__label")!.textContent).toBe("No changes");
    expect(seen).toEqual([
      ["change", "allow", "cell"],
      ["save", 1],
    ]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled value stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: ToolPermissionMatrix[] = [];
    await act(async () => root.render(React.createElement(ToolPermissions, { agents: agents.map(({ avatar: _a, ...a }) => a), tools: tools.map(({ icon: _i, ...t }) => t), value: START, onChange: (v) => void asked.push(v) })));
    await settle();
    const el = host.querySelector("tc-tool-permissions")!;
    cell(el, 1, 0).querySelector<HTMLElement>('[data-level="allow"]')!.click();
    await settle();
    expect(asked).toHaveLength(1);
    expect(level(el, 1, 0)).toBe("ask");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-tool-permissions description="What each agent may do." .agents=${agents} .tools=${tools} .value=${START}></tc-tool-permissions>
        <tc-tool-permissions look="clean" .agents=${agents} .tools=${tools} .value=${START}></tc-tool-permissions>
      </div>`);
      const [a, b] = wrap.querySelectorAll<TcToolPermissions>("tc-tool-permissions");
      // One with changes listed, one without
      cell(a, 1, 0).querySelector<HTMLElement>('[data-level="allow"]')!.click();
      preset(b, "Trusted").click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

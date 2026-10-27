/*
 * <tc-playbook-canvas> in real browsers: phases and steps, picking, the keyboard (moving between steps, reordering,
 * changing phase, removing), dragging, the settings and the embedded gate, versions, the dry run, controlled use,
 * focus, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/playbook-canvas";
import type { Playbook, PlaybookStep, TcPlaybookCanvas } from "../../src/elements/playbook-canvas";
import type { TcGateConfig } from "../../src/elements/gate-config";
import { PlaybookCanvas } from "../../src/elements/react/playbook-canvas";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const GATE = { triggers: ["low-confidence"], reviewer: "lead", view: "evidence", actions: ["approve", "reject"], reason: "" };
const STEPS: PlaybookStep[] = [
  { id: "t", phase: "trigger", type: "event", title: "Request arrives" },
  { id: "a", phase: "intake", type: "tool", title: "Read the request" },
  { id: "b", phase: "intake", type: "tool", title: "Check the order" },
  { id: "c", phase: "context", type: "retrieve", title: "Look up the policy" },
  { id: "d", phase: "analysis", type: "agent", title: "Decide" },
  { id: "g", phase: "review", type: "review", title: "Lead signs off", gate: GATE },
];
const PB: Playbook = { steps: STEPS };
const VERSIONS = [
  { id: "v2", label: "v2", note: "Added the policy lookup", meta: "Oct 24 · Maya" },
  { id: "v1", label: "v1", note: "First version" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (extra: { look?: "standard" | "clean"; selected?: string | null } = {}) =>
  fixture<TcPlaybookCanvas>(html`<tc-playbook-canvas look=${extra.look ?? "standard"} heading="Refunds" .value=${PB} .selected=${extra.selected ?? null} .versions=${VERSIONS} current-version="v2"></tc-playbook-canvas>`);
const step = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-pb__step[data-id="${id}"]`)!;
const order = (el: TcPlaybookCanvas) => el.value.steps.map((s) => `${s.phase}:${s.id}`);
const key = async (target: Element, k: string, opts: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...opts }));
  await settle();
};
const status = (el: Element) => el.querySelector('.ui-pb__sr[role="status"]')!.textContent!.trim();

describe("tc-playbook-canvas", () => {
  test("the host is a region named by the heading; phases, steps and counts, in either look", async () => {
    const el = await mount();
    expect(el.dataset.ui).toBe("pb");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Refunds");
    // Standard: the header on the tray, above the card; Versions and Dry run at its right
    expect(el.querySelector(":scope > .tc-head + .ui-pb__card")).toBeTruthy();
    expect(el.querySelector(".tc-head__aside .ui-pb__btn--primary")).toBeTruthy();
    expect([...el.querySelectorAll(".ui-pb__phase-title")].map((h) => h.textContent)).toEqual(["Trigger", "Intake", "Context", "Analysis", "Review"]);
    expect(el.querySelector(".ui-pb__meta")!.textContent!.replace(/\s+/g, " ").trim()).toBe("v2 · 6 steps · 1 review gate");
    // Each phase is a listbox of its steps, named by the phase
    const lists = [...el.querySelectorAll('[role="listbox"]')];
    expect(lists).toHaveLength(5);
    expect(document.getElementById(lists[1].getAttribute("aria-labelledby")!)!.textContent).toBe("Intake");
    expect([...lists[1].querySelectorAll('[role="option"]')].map((o) => o.querySelector(".ui-pb__step-title")!.textContent)).toEqual(["Step 2: Read the request", "Step 3: Check the order"]);
    expect(step(el, "g").hasAttribute("data-review")).toBe(true);
    expect(step(el, "g").querySelector(".ui-pb__pause")!.textContent).toBe("Pauses for review");
    // One tab stop for all the steps
    expect([...el.querySelectorAll('.ui-pb__step[tabindex="0"]')].map((s) => (s as HTMLElement).dataset.id)).toEqual(["t"]);
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-pb__card")).toBeNull();
    expect(el.querySelector(":scope > .ui-pb__sr + .tc-head")).toBeTruthy();
    // An empty phase says so
    el.value = { steps: STEPS.filter((s) => s.phase !== "context") };
    await settle();
    expect(el.querySelector('[data-phase="context"] .ui-pb__empty')!.textContent).toBe("No steps yet");
    expect(el.querySelectorAll('[role="listbox"]')).toHaveLength(4);
  });

  test("click picks a step; its settings show below; tc-selected-change is cancelable", async () => {
    const el = await mount();
    expect(el.querySelector(".ui-pb__panel-empty")!.textContent).toBe("Pick a step to set it up");
    const seen: unknown[] = [];
    on(el, "tc-selected-change", (e) => seen.push(e.detail.selected));
    step(el, "d").click();
    await settle();
    expect(seen).toEqual(["d"]);
    expect(el.selected).toBe("d");
    expect(step(el, "d").getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector(".ui-pb__panel-title")!.textContent).toBe("Step 5 · Analysis");
    expect(el.querySelector<HTMLInputElement>(".ui-pb__title-input")!.value).toBe("Decide");
    on(el, "tc-selected-change", (e) => e.preventDefault());
    step(el, "a").click();
    await settle();
    expect(el.selected).toBe("d");
  });

  test("keyboard: arrows move between steps and phases, Enter goes to the settings, Escape comes back", async () => {
    const el = await mount();
    step(el, "t").focus();
    await key(step(el, "t"), "ArrowDown");
    expect(document.activeElement).toBe(step(el, "a"));
    expect(el.selected).toBe("a");
    await key(step(el, "a"), "ArrowRight");
    expect(document.activeElement).toBe(step(el, "c"));
    await key(step(el, "c"), "ArrowLeft");
    expect(document.activeElement).toBe(step(el, "a"));
    await key(step(el, "a"), "End");
    expect(document.activeElement).toBe(step(el, "g"));
    await key(step(el, "g"), "Home");
    expect(document.activeElement).toBe(step(el, "t"));
    expect(step(el, "t").tabIndex).toBe(0);
    expect(step(el, "g").tabIndex).toBe(-1);
    await key(step(el, "t"), "Enter");
    const title = el.querySelector<HTMLInputElement>(".ui-pb__title-input")!;
    expect(document.activeElement).toBe(title);
    await key(title, "Escape");
    expect(document.activeElement).toBe(step(el, "t"));
  });

  test("keyboard: Alt+arrows reorder within a phase, cross into the next one, and respect where a type may go", async () => {
    const el = await mount();
    const changes: Playbook[] = [];
    on(el, "tc-value-change", (e) => changes.push(e.detail.value as Playbook));
    step(el, "a").focus();
    await key(step(el, "a"), "ArrowDown", { altKey: true });
    expect(order(el).slice(1, 3)).toEqual(["intake:b", "intake:a"]);
    expect(document.activeElement).toBe(step(el, "a"));
    expect(status(el)).toBe("Moved Read the request to Intake, step 2 of 2");
    // Past the last step of its phase: the first of the next
    await key(step(el, "a"), "ArrowDown", { altKey: true });
    expect(el.value.steps.find((s) => s.id === "a")!.phase).toBe("context");
    expect(el.value.steps.filter((s) => s.phase === "context").map((s) => s.id)).toEqual(["a", "c"]);
    expect(document.activeElement).toBe(step(el, "a"));
    // Alt+→ jumps a phase, keeping its place in the list where it can
    await key(step(el, "a"), "ArrowRight", { altKey: true });
    expect(el.value.steps.filter((s) => s.phase === "analysis").map((s) => s.id)).toEqual(["a", "d"]);
    expect(changes).toHaveLength(3);
    // A trigger type only goes in Trigger
    step(el, "t").focus();
    await key(step(el, "t"), "ArrowDown", { altKey: true });
    expect(el.value.steps.find((s) => s.id === "t")!.phase).toBe("trigger");
    expect(status(el)).toBe("Can't move Request arrives – When an event happens steps only go in Trigger");
    expect(changes).toHaveLength(3);
  });

  test("Delete removes a step and focus moves to the next one; the last one leaves focus on Add step", async () => {
    const el = await mount({ selected: "b" });
    step(el, "b").focus();
    await key(step(el, "b"), "Delete");
    expect(el.value.steps.map((s) => s.id)).toEqual(["t", "a", "c", "d", "g"]);
    expect(document.activeElement).toBe(step(el, "c"));
    expect(el.selected).toBe("c");
    expect(status(el)).toBe("Removed Check the order");
    el.value = { steps: [STEPS[0]] };
    await settle();
    step(el, "t").focus();
    await key(step(el, "t"), "Backspace");
    expect(el.value.steps).toEqual([]);
    expect(document.activeElement).toBe(el.querySelector('.ui-pb__add[data-phase="trigger"]'));
    expect(el.querySelector(".ui-pb__panel-empty")!.textContent).toBe("Add a step to a phase to start the playbook");
  });

  test("Add step adds the phase's default type, picks it and focuses its title", async () => {
    const el = await mount();
    el.querySelector<HTMLButtonElement>('.ui-pb__add[data-phase="analysis"]')!.click();
    await settle();
    const added = el.value.steps.filter((s) => s.phase === "analysis");
    expect(added.map((s) => [s.type, s.title])).toEqual([
      ["agent", "Decide"],
      ["agent", "Agent task"],
    ]);
    expect(el.selected).toBe(added[1].id);
    expect(document.activeElement).toBe(el.querySelector(".ui-pb__title-input"));
    expect(status(el)).toBe("Added Agent task to Analysis, step 2 of 2");
    // A review phase adds a review step with a gate
    el.querySelector<HTMLButtonElement>('.ui-pb__add[data-phase="review"]')!.click();
    await settle();
    const review = el.value.steps.filter((s) => s.phase === "review")[1];
    expect(review.type).toBe("review");
    expect(review.gate).toBeTruthy();
  });

  test("settings: title, type, instructions, if it fails, and the toolbar", async () => {
    const el = await mount({ selected: "b" });
    const title = el.querySelector<HTMLInputElement>(".ui-pb__title-input")!;
    title.value = "Check the order is paid";
    title.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.steps.find((s) => s.id === "b")!.title).toBe("Check the order is paid");
    // An empty title is not kept
    title.value = "  ";
    title.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.steps.find((s) => s.id === "b")!.title).toBe("Check the order is paid");
    // Types offered: the ones allowed in the phase
    const select = el.querySelector<HTMLSelectElement>(".ui-pb__select select")!;
    expect([...select.options].map((o) => o.value)).toEqual(["agent", "tool", "retrieve", "review"]);
    select.value = "agent";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.steps.find((s) => s.id === "b")!.type).toBe("agent");
    const notes = el.querySelector<HTMLTextAreaElement>(".ui-pb__notes")!;
    notes.value = "Paid and under 60 days";
    notes.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.steps.find((s) => s.id === "b")!.notes).toBe("Paid and under 60 days");
    // If it fails: a segmented control whose own event stops at the canvas
    const outer: string[] = [];
    const listen = (e: Event) => outer.push((e.target as Element).tagName);
    document.body.addEventListener("tc-value-change", listen);
    const retry = [...el.querySelectorAll<HTMLButtonElement>(".ui-pb__fail .ui-seg__opt")].find((b) => b.textContent!.includes("Retry once"))!;
    retry.click();
    await settle();
    document.body.removeEventListener("tc-value-change", listen);
    expect(outer).toEqual(["TC-PLAYBOOK-CANVAS"]);
    expect(el.value.steps.find((s) => s.id === "b")!.onFail).toBe("retry");
    expect(el.querySelector(".ui-pb__fail .ui-pb__hint")!.textContent).toBe("The step runs once more, then the run stops");
    // The toolbar: one tab stop, arrows between Move earlier, Move later and Remove
    const tools = [...el.querySelectorAll<HTMLButtonElement>(".ui-pb__tool")];
    expect(el.querySelector(".ui-pb__tools")!.getAttribute("role")).toBe("toolbar");
    expect(tools.map((t) => t.tabIndex)).toEqual([0, -1, -1]);
    tools[0].focus();
    await key(tools[0], "ArrowRight");
    expect(document.activeElement).toBe(tools[1]);
    tools[0].click();
    await settle();
    expect(el.value.steps.filter((s) => s.phase === "intake").map((s) => s.id)).toEqual(["b", "a"]);
    // The trigger step can't move at all
    el.selected = "t";
    await settle();
    expect([...el.querySelectorAll(".ui-pb__tool")].slice(0, 2).map((t) => t.getAttribute("aria-disabled"))).toEqual(["true", "true"]);
  });

  test("a review step embeds the gate; its changes come back as the playbook's", async () => {
    const el = await mount({ selected: "g" });
    const gate = el.querySelector<TcGateConfig>("tc-gate-config")!;
    expect(gate.flat).toBe(true);
    expect(gate.getAttribute("aria-label")).toBe("Lead signs off – review gate");
    expect(gate.value).toEqual(GATE);
    expect(el.querySelector(".ui-pb__fail")).toBeNull();
    const outer: string[] = [];
    const listen = (e: Event) => outer.push((e.target as Element).tagName);
    document.body.addEventListener("tc-value-change", listen);
    gate.querySelector<HTMLButtonElement>('.ui-gc__switch[data-id="irreversible"]')!.click();
    await settle();
    document.body.removeEventListener("tc-value-change", listen);
    expect(outer).toEqual(["TC-PLAYBOOK-CANVAS"]);
    expect(el.value.steps.find((s) => s.id === "g")!.gate!.triggers).toEqual(["low-confidence", "irreversible"]);
    expect(gate.value.triggers).toEqual(["low-confidence", "irreversible"]);
    // The playbook's own gate options reach it
    el.gateReviewers = [{ id: "fin", label: "Finance" }];
    await settle();
    expect([...gate.querySelectorAll("option")].map((o) => o.textContent)).toEqual(["Pick a reviewer", "Finance"]);
  });

  test("dragging a step drops it where the pointer is; a pointer that barely moves is a click", async () => {
    const el = await mount();
    const card = step(el, "a");
    const r = card.getBoundingClientRect();
    const target = step(el, "d").getBoundingClientRect();
    const ev = (type: string, x: number, y: number) => card.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, pointerType: "mouse", clientX: x, clientY: y }));
    ev("pointerdown", r.left + 20, r.top + 10);
    ev("pointermove", r.left + 24, r.top + 30);
    await settle();
    expect(el.hasAttribute("data-dragging")).toBe(true);
    ev("pointermove", target.left + 20, target.bottom - 2);
    await settle();
    ev("pointerup", target.left + 20, target.bottom - 2);
    card.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(el.value.steps.filter((s) => s.phase === "analysis").map((s) => s.id)).toEqual(["d", "a"]);
    expect(el.hasAttribute("data-dragging")).toBe(false);
    // The click that ends a drag isn't a pick
    expect(el.selected).toBeNull();
    const b = step(el, "b");
    const rb = b.getBoundingClientRect();
    b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 2, button: 0, pointerType: "mouse", clientX: rb.left + 20, clientY: rb.top + 10 }));
    b.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 2, button: 0, pointerType: "mouse", clientX: rb.left + 21, clientY: rb.top + 10 }));
    b.click();
    await settle();
    expect(el.selected).toBe("b");
  });

  test("versions: a disclosure with the current one marked; Open asks for another; edits mark the playbook", async () => {
    const el = await mount();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-pb__btn[aria-expanded]")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).toBeTruthy();
    const rows = [...el.querySelectorAll(".ui-pb__version")];
    expect(rows[0].getAttribute("aria-current")).toBe("true");
    expect(rows[0].querySelector(".ui-pb__current")!.textContent).toBe("Current");
    const opened: string[] = [];
    on(el, "tc-version-open", (e) => opened.push(e.detail.id as string));
    rows[1].querySelector<HTMLButtonElement>("button")!.click();
    expect(opened).toEqual(["v1"]);
    expect(el.querySelector(".ui-pb__edited")).toBeNull();
    step(el, "a").focus();
    await key(step(el, "a"), "ArrowDown", { altKey: true });
    expect(el.querySelector(".ui-pb__edited")!.textContent).toBe("Edited");
    // Loading a version clears it
    el.currentVersion = "v1";
    el.value = { steps: STEPS.slice(0, 3) };
    await settle();
    expect(el.querySelector(".ui-pb__edited")).toBeNull();
  });

  test("dry run: the request, the app's answer on the board, out of date after an edit, cleared", async () => {
    const el = await mount();
    const asked: Playbook[] = [];
    on(el, "tc-dry-run", (e) => asked.push(e.detail.value as Playbook));
    const run = el.querySelector<HTMLButtonElement>(".ui-pb__btn--primary")!;
    run.click();
    await settle();
    expect(asked).toEqual([PB]);
    expect(run.getAttribute("aria-busy")).toBe("true");
    expect(run.textContent!.trim()).toBe("Running…");
    el.dryRun = { steps: [{ id: "t", outcome: "run" }, { id: "a", outcome: "run" }, { id: "b", outcome: "skip", note: "Already checked" }, { id: "c", outcome: "run" }, { id: "d", outcome: "run" }, { id: "g", outcome: "pause" }] };
    await settle();
    expect(run.hasAttribute("aria-busy")).toBe(false);
    expect(el.querySelector(".ui-pb__dry-text")!.textContent).toBe("Dry run · 4 of 6 steps run · 1 skipped · pauses at Lead signs off");
    expect(status(el)).toBe("Dry run: 4 of 6 steps run · 1 skipped · pauses at Lead signs off");
    expect(step(el, "g").dataset.outcome).toBe("pause");
    expect(step(el, "b").querySelector(".ui-pb__outcome")!.textContent).toBe("Skipped");
    expect(step(el, "b").querySelector(".ui-pb__outcome-note")!.textContent).toBe("Already checked");
    // An edit makes it out of date: the marks go, the line says so
    step(el, "a").focus();
    await key(step(el, "a"), "ArrowDown", { altKey: true });
    expect(step(el, "g").dataset.outcome).toBeUndefined();
    expect(el.querySelector(".ui-pb__dry-text")!.textContent).toBe("Dry run · Out of date – the playbook changed since");
    const cleared = vi.fn();
    on(el, "tc-dry-run-clear", cleared);
    [...el.querySelectorAll<HTMLButtonElement>(".ui-pb__dry .ui-pb__ghost")].find((b) => b.textContent === "Clear")!.click();
    await settle();
    expect(cleared).toHaveBeenCalledOnce();
    expect(el.querySelector(".ui-pb__dry")).toBeNull();
    // Nothing to run without steps
    el.value = { steps: [] };
    await settle();
    expect(run.disabled).toBe(true);
  });

  test("controlled: preventDefault keeps the playbook as it is", async () => {
    const el = await mount();
    on(el, "tc-value-change", (e) => e.preventDefault());
    step(el, "a").focus();
    await key(step(el, "a"), "ArrowDown", { altKey: true });
    await key(step(el, "a"), "Delete");
    el.querySelector<HTMLButtonElement>(".ui-pb__add")!.click();
    await settle();
    expect(el.value).toBe(PB);
    expect(document.activeElement).toBe(step(el, "a"));
  });

  test("React wrapper: uncontrolled value and selection survive a re-render; controlled stays with the app; callbacks", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    const onSelectedChange = vi.fn();
    const onDryRun = vi.fn();
    const onVersionOpen = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(PlaybookCanvas, { title: "Refunds", defaultValue: PB, onChange, onSelectedChange, onDryRun, onVersionOpen, versions: VERSIONS, currentVersion: "v2" });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcPlaybookCanvas>("tc-playbook-canvas")!;
    expect(el.heading).toBe("Refunds");
    await act(async () => step(el, "b").click());
    await settle();
    expect(onSelectedChange).toHaveBeenCalledWith("b");
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-pb__tool")!.click());
    await settle();
    expect(onChange).toHaveBeenCalled();
    await act(async () => rerender());
    await settle();
    expect(el.selected).toBe("b");
    expect(el.value.steps.filter((s) => s.phase === "intake").map((s) => s.id)).toEqual(["b", "a"]);
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-pb__btn--primary")!.click());
    expect(onDryRun).toHaveBeenCalledWith(el.value);
    // Controlled
    await act(async () => root.render(React.createElement(PlaybookCanvas, { value: PB, selected: "d", onChange, onSelectedChange })));
    await settle();
    const ctl = host.querySelector<TcPlaybookCanvas>("tc-playbook-canvas")!;
    await act(async () => step(ctl, "a").click());
    await settle();
    expect(onSelectedChange).toHaveBeenLastCalledWith("a");
    expect(ctl.selected).toBe("d");
    await act(async () => ctl.querySelector<HTMLButtonElement>(".ui-pb__add")!.click());
    await settle();
    expect(ctl.value).toBe(PB);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme}) – with a dry run, versions open and a review step picked`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <tc-playbook-canvas heading="Standard" .value=${PB} selected="g" .versions=${VERSIONS} current-version="v2"
          .dryRun=${{ steps: [{ id: "t", outcome: "run" }, { id: "a", outcome: "skip", note: "Nothing new" }, { id: "g", outcome: "pause" }] }}></tc-playbook-canvas>
        <tc-playbook-canvas look="clean" heading="Clean" .value=${PB} selected="b"></tc-playbook-canvas>
        <tc-playbook-canvas look="clean" heading="Empty"></tc-playbook-canvas>
      </div>`);
      wrap.querySelectorAll<TcPlaybookCanvas>("tc-playbook-canvas")[0].querySelector<HTMLButtonElement>(".ui-pb__btn[aria-expanded]")!.click();
      await settle();
      for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns animations and transitions off", () => {
    const css = (customElements.get("tc-playbook-canvas") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion[^{]*\{\s*\.ui-pb__versions, \.ui-pb__dry \{ animation: none; \}/);
  });
});

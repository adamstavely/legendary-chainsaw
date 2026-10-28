/*
 * <tc-status-tracker> in real browsers: the steps on a line with their marks, words and dates, the line filling as
 * steps clear, the current step, the count and legend, a step's record on click or Enter, the keyboard, the vertical
 * layout, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/status-tracker";
import type { StatusTrackerSelectedChange, StatusTrackerStep, TcStatusTracker } from "../../src/elements/status-tracker";
import { StatusTracker } from "../../src/elements/react/status-tracker";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const OCT12 = new Date(2025, 9, 12, 12).getTime();
const STEPS: StatusTrackerStep[] = [
  { id: "scope", label: "Scope", status: "cleared", date: OCT12, detail: { summary: "Registered.", owner: "Programme office", items: [{ label: "Registration", value: "PR-118", href: "#pr" }] } },
  { id: "red", label: "Red team", status: "cleared" },
  { id: "adv", label: "Adversarial", status: "pending", attention: "One finding awaiting re-test" },
  { id: "truth", label: "Ground truth", status: "blocked" },
  { id: "pilot", label: "Pilot", status: "not-reached" },
];

const step = (el: Element, i: number) => el.querySelector<HTMLButtonElement>(`.ui-stk__step[data-index="${i}"]`)!;
const item = (el: Element, i: number) => el.querySelector<HTMLElement>(`.ui-stk__item[data-index="${i}"]`)!;
/** A step's accessible name: its words, without what's hidden from screen readers */
const named = (b: Element) => {
  const c = b.cloneNode(true) as Element;
  c.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  return c.textContent!.replace(/\s+/g, " ").replace(/ ,/g, ",").trim();
};
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard", selected: string | null = null) =>
  fixture<TcStatusTracker>(html`<div style="width: 900px"><tc-status-tracker look=${look} heading="Pipeline" noun="Gate" hint="click a gate" .steps=${STEPS} .selected=${selected}></tc-status-tracker></div>`).then(
    (w) => w.querySelector("tc-status-tracker")!,
  );

describe("tc-status-tracker", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: an ordered list of steps with marks, words and dates; the count, the legend, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("stk");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector("ol.ui-stk__list")!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Pipeline");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("2 of 5 gates cleared · click a gate");
      expect(list.querySelectorAll(":scope > li")).toHaveLength(5);
      // Marks: ✓ for cleared, × for blocked, the number otherwise
      expect(item(el, 0).querySelector(".ui-stk__marker svg")).toBeTruthy();
      expect(item(el, 2).querySelector(".ui-stk__num")!.textContent).toBe("3");
      expect(item(el, 3).querySelector(".ui-stk__num")).toBeNull();
      expect(item(el, 4).querySelector(".ui-stk__num")!.textContent).toBe("5");
      expect(item(el, 2).querySelector(".ui-stk__marker .ui-stk__bang")).toBeTruthy();
      // Words under each marker
      expect(item(el, 0).querySelector(".ui-stk__noun")!.textContent).toBe("Gate 1");
      expect(item(el, 0).querySelector(".ui-stk__status")!.textContent).toBe("Cleared");
      expect(item(el, 0).querySelector(".ui-stk__date")!.lastChild!.textContent).toBe(new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(OCT12));
      expect(item(el, 4).querySelector(".ui-stk__status")!.textContent).toBe("Not reached");
      // The legend names the statuses in use, in order
      expect([...el.querySelectorAll(".ui-stk__key")].map((k) => k.textContent!.trim())).toEqual(["Cleared", "Pending", "Blocked", "Not reached"]);
      // One tab stop, on the current step
      expect(list.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(step(el, 2).getAttribute("tabindex")).toBe("0");
    });
  }

  test("the line fills after each cleared step; the current step is the first not cleared and reads in full", async () => {
    const el = await make();
    const filled = () => [0, 1, 2, 3].map((i) => item(el, i).querySelector(".ui-stk__line")!.hasAttribute("data-filled"));
    expect(filled()).toEqual([true, true, false, false]);
    expect(item(el, 4).querySelector(".ui-stk__line")).toBeNull();
    expect(item(el, 2).hasAttribute("data-current")).toBe(true);
    expect(step(el, 2).getAttribute("aria-current")).toBe("step");
    expect(el.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
    expect(named(step(el, 2))).toBe("Gate 3 of 5, Adversarial, Pending, needs attention: One finding awaiting re-test");
    expect(named(step(el, 0))).toBe(`Gate 1 of 5, Scope, Cleared, ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(OCT12)}`);
    expect(step(el, 0).hasAttribute("aria-label")).toBe(false);
    // Clearing the pending step moves the line and the current step on
    el.steps = STEPS.map((s) => (s.id === "adv" ? { ...s, status: "cleared", attention: undefined } : s));
    await settle();
    expect(filled()).toEqual([true, true, true, false]);
    expect(step(el, 3).getAttribute("aria-current")).toBe("step");
    expect(el.querySelector(".tc-head__sub")!.textContent).toBe("3 of 5 gates cleared · click a gate");
  });

  test("click or Enter opens a step's record; again or Escape closes it; Close returns focus; tc-selected-change fires", async () => {
    const el = await make();
    const seen: StatusTrackerSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<StatusTrackerSelectedChange>).detail));
    step(el, 0).click();
    await settle();
    expect(el.selected).toBe("scope");
    const detail = el.querySelector(".ui-stk__detail")!;
    expect(detail.querySelector(".ui-stk__detail-title")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Gate 1 · : Scope");
    expect(detail.querySelector(".ui-stk__pill")!.textContent).toBe("Cleared");
    expect(detail.querySelector(".ui-stk__summary")!.textContent).toBe("Registered.");
    expect(detail.querySelector(".ui-stk__meta")!.textContent).toContain("Programme office");
    expect(detail.querySelector<HTMLAnchorElement>(".ui-stk__link")!.getAttribute("href")).toBe("#pr");
    expect(step(el, 0).getAttribute("aria-expanded")).toBe("true");
    expect(step(el, 0).getAttribute("aria-controls")).toBe(detail.id);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Gate 1, Scope: Cleared. Record shown");
    key(step(el, 0), "Enter");
    // A native button turns Enter into a click; a synthetic keydown doesn't, so click as the browser would
    step(el, 0).click();
    await settle();
    expect(el.selected).toBeNull();
    step(el, 2).click();
    await settle();
    expect(el.querySelector(".ui-stk__attention")!.textContent).toContain("One finding awaiting re-test");
    expect(el.querySelector(".ui-stk__summary")!.textContent).toBe("Nothing recorded yet.");
    key(step(el, 2), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Record closed");
    step(el, 3).click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-stk__close")!.click();
    await expect.poll(() => document.activeElement).toBe(step(el, 3));
    expect(el.selected).toBeNull();
    expect(seen.map((s) => [s.selected, s.step?.label])).toEqual([
      ["scope", "Scope"],
      [null, undefined],
      ["adv", "Adversarial"],
      [null, undefined],
      ["truth", "Ground truth"],
      [null, undefined],
    ]);
  });

  test("keyboard: ← → move between steps, Home / End to the ends; ↑ ↓ instead when vertical", async () => {
    const el = await make();
    step(el, 2).focus();
    const at = () => document.activeElement?.getAttribute("data-index");
    const press = async (k: string, want: string) => {
      key(document.activeElement!, k);
      await expect.poll(at).toBe(want);
    };
    await press("ArrowRight", "3");
    await press("ArrowLeft", "2");
    await press("End", "4");
    await press("ArrowRight", "4");
    await press("Home", "0");
    await press("ArrowLeft", "0");
    expect(el.querySelectorAll('.ui-stk__step[tabindex="0"]')).toHaveLength(1);
    el.orientation = "vertical";
    await settle();
    expect(el.querySelector(".ui-stk__list")!.hasAttribute("data-vertical")).toBe(true);
    await press("ArrowDown", "1");
    await press("ArrowUp", "0");
    key(document.activeElement!, "ArrowRight");
    await settle();
    expect(at()).toBe("0");
  });

  test("narrow: stacks vertically below 480 px; many steps scroll sideways with the current one in view", async () => {
    const wrap = await fixture(html`<div style="width: 360px"><tc-status-tracker noun="Gate" .steps=${STEPS}></tc-status-tracker></div>`);
    const el = wrap.querySelector("tc-status-tracker")!;
    await expect.poll(() => el.querySelector(".ui-stk__list")!.hasAttribute("data-vertical")).toBe(true);
    (wrap as HTMLElement).style.width = "640px";
    await expect.poll(() => el.querySelector(".ui-stk__list")!.hasAttribute("data-vertical")).toBe(false);
    // Twelve steps at 132 px don't fit in 640 px: the line scrolls, with the current step (the 9th) in view
    const many: StatusTrackerStep[] = Array.from({ length: 12 }, (_, i) => ({ id: `s${i}`, label: `Step ${i + 1}`, status: i < 8 ? "cleared" : "not-reached" }));
    el.steps = many;
    const scroll = el.querySelector<HTMLElement>(".ui-stk__scroll")!;
    await expect.poll(() => scroll.scrollLeft).toBeGreaterThan(0);
    const box = scroll.getBoundingClientRect();
    const cur = item(el, 8).getBoundingClientRect();
    expect(cur.left).toBeGreaterThanOrEqual(box.left - 1);
    expect(cur.right).toBeLessThanOrEqual(box.right + 1);
  });

  test("statuses can be renamed and added; the noun can change or go; controlled: preventDefault() keeps the record", async () => {
    const el = await make("standard", "red");
    el.statuses = { waived: { label: "Waived", tone: "info", mark: "check", done: true }, cleared: { label: "Passed", tone: "success", mark: "check", done: true } };
    el.steps = [...STEPS.slice(0, 4), { id: "pilot", label: "Pilot", status: "waived" }];
    await settle();
    expect(item(el, 0).querySelector(".ui-stk__status")!.textContent).toBe("Passed");
    expect(item(el, 4).querySelector(".ui-stk__status")!.textContent).toBe("Waived");
    expect(el.querySelector(".tc-head__sub")!.textContent).toBe("3 of 5 gates cleared · click a gate");
    el.noun = "";
    await settle();
    expect(el.querySelector(".ui-stk__noun")).toBeNull();
    expect(named(step(el, 1))).toBe("2 of 5, Red team, Passed");
    expect(el.querySelector(".tc-head__sub")!.textContent).toBe("3 of 5 steps cleared · click a gate");
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    step(el, 0).click();
    await settle();
    expect(el.selected).toBe("red");
    el.description = "Custom line";
    el.legend = false;
    await settle();
    expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Custom line");
    expect(el.querySelector(".ui-stk__legend")).toBeNull();
    // A step that goes away takes its open record with it
    el.steps = STEPS.filter((s) => s.id !== "red");
    await settle();
    expect(el.selected).toBeNull();
  });

  test("an empty element renders without errors", async () => {
    const el = await fixture<TcStatusTracker>(html`<tc-status-tracker noun="Gate"></tc-status-tracker>`);
    expect(el.querySelector(".ui-stk__empty")!.textContent).toBe("No gates yet.");
    expect(el.querySelector("ol")).toBeNull();
  });

  test("React wrapper: an uncontrolled record survives parent re-renders; onSelectedChange gets the step", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(StatusTracker, {
        title: "Gates",
        noun: "Gate",
        steps: STEPS,
        onSelectedChange: (s, st) => void seen.push([s, st?.label]),
        "data-n": n,
      } as React.ComponentProps<typeof StatusTracker>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-status-tracker")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Gates");
    step(el, 1).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.querySelector(".ui-stk__detail")).toBeTruthy();
    expect(seen).toEqual([["red", "Red team"]]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled record stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: (string | null)[] = [];
    await act(async () => root.render(React.createElement(StatusTracker, { steps: STEPS, selected: null, onSelectedChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-status-tracker")!;
    step(el, 0).click();
    await settle();
    expect(asked).toEqual(["scope"]);
    expect(el.querySelector(".ui-stk__detail")).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="width: 900px; padding: 16px; background: var(--tc-surface-base)">
        <tc-status-tracker heading="Pipeline" noun="Gate" .steps=${STEPS} .selected=${"scope"}></tc-status-tracker>
        <tc-status-tracker look="clean" heading="Pipeline (clean)" orientation="vertical" .steps=${STEPS} .selected=${"adv"}></tc-status-tracker>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

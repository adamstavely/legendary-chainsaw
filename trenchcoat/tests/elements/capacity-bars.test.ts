/*
 * <tc-capacity-bars> in real browsers: rows sorted by load, pieces on a shared scale with a capacity line, over
 * capacity marked and counted, the readout, selecting a person, the grid keyboard, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/capacity-bars";
import type { CapacityPerson, CapacitySelectedChange, TcCapacityBars } from "../../src/elements/capacity-bars";
import { CapacityBars } from "../../src/elements/react/capacity-bars";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

/** am 1.2 / 1 (over) · jt 1.0 / 1 · pr 0.4 / 0.8 */
const PEOPLE: CapacityPerson[] = [
  { id: "pr", name: "Priya Raman", role: "Principal Investigator", capacity: 0.8, allocations: [{ id: "qs", label: "Quantum Sensing", amount: 0.4 }] },
  { id: "jt", name: "Jonah Tran", role: "Staff Scientist", allocations: [{ id: "nc", label: "Neuromorphic Computing", amount: 0.7 }, { id: "aml", label: "Adversarial ML", amount: 0.3 }] },
  { id: "am", name: "Arjun Mehta", role: "Principal Investigator", capacity: 1, allocations: [{ id: "crm", label: "Climate Resilience", amount: 0.7 }, { id: "wps", label: "Wildfire Prediction", amount: 0.5 }] },
];
const cell = (el: Element, id: string, c: number) => el.querySelector<HTMLElement>(`[data-cell="${id}:${c}"]`)!;
const order = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-capb__person")].map((p) => p.dataset.person);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") => fixture<TcCapacityBars>(html`<tc-capacity-bars look=${look} locale="en-US" .people=${PEOPLE}></tc-capacity-bars>`);

describe("tc-capacity-bars", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid of people sorted by load, one tab stop, over capacity marked and counted`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("capb");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toBe("People capacity");
      expect(grid.querySelectorAll('[role="row"]')).toHaveLength(3);
      expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      // Load ÷ capacity: am 1.2, jt 1.0, pr 0.5
      expect(order(el)).toEqual(["am", "jt", "pr"]);
      expect(cell(el, "am", 0).getAttribute("aria-label")).toBe("Arjun Mehta, Principal Investigator: 1.2 FTE of 1 FTE, over capacity");
      expect(cell(el, "am", 0).querySelector(".ui-capb__over")!.textContent).toContain("over");
      expect(cell(el, "jt", 0).querySelector(".ui-capb__over")).toBeNull();
      expect(el.querySelector(".ui-capb__count")!.textContent).toContain("1 over capacity");
      expect(cell(el, "am", 2).getAttribute("aria-label")).toBe("Wildfire Prediction, 0.5 FTE");
    });
  }

  test("pieces share one scale; the capacity line sits at capacity; colours follow the work, not the row", async () => {
    const el = await make();
    // Scale is 1.2 (am's load): 0.7 → 58.33%, capacity 1 → 83.33%; pr's capacity 0.8 → 66.67%
    expect(parseFloat(cell(el, "am", 1).style.inlineSize)).toBeCloseTo(58.33, 1);
    const cap = (id: string) => parseFloat(cell(el, id, 0).closest('[role="row"]')!.querySelector<HTMLElement>(".ui-capb__cap")!.style.insetInlineStart);
    expect(cap("am")).toBeCloseTo(83.33, 1);
    expect(cap("pr")).toBeCloseTo(66.67, 1);
    const colours = [...el.querySelectorAll<HTMLElement>(".ui-capb__seg")].map((s) => `${s.dataset.person}:${s.dataset.colour}`);
    expect(new Set(colours.map((c) => c.split(":")[1])).size).toBe(5);
    // The legend names each piece and its amount
    expect([...cell(el, "am", 0).closest('[role="row"]')!.querySelectorAll(".ui-capb__key")].map((k) => k.textContent)).toEqual(["Climate Resilience0.7", "Wildfire Prediction0.5"]);
    // sort="none" keeps the given order
    el.sort = "none";
    await settle();
    expect(order(el)).toEqual(["pr", "jt", "am"]);
  });

  test("keyboard: ← → along a bar, ↑ ↓ between people, Home End; the readout names what's in focus", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-cell");
    cell(el, "am", 0).focus();
    const press = async (k: string, want: string) => {
      key(document.activeElement!, k);
      await expect.poll(at).toBe(want);
    };
    await press("ArrowRight", "am:1");
    await expect.poll(() => el.querySelector(".ui-capb__readout")!.textContent).toBe("Arjun Mehta · Climate Resilience · 0.7 FTE of 1 FTE (70%)");
    await press("ArrowRight", "am:2");
    await press("ArrowRight", "am:2");
    await press("ArrowDown", "jt:2");
    // pr has one piece: the column clamps
    await press("ArrowDown", "pr:1");
    await press("Home", "pr:0");
    await expect.poll(() => el.querySelector(".ui-capb__readout")!.textContent).toBe("Priya Raman · Principal Investigator · 0.4 FTE of 0.8 FTE");
    await press("End", "pr:1");
    await press("ArrowUp", "jt:1");
    expect(el.querySelectorAll('[role="grid"] [tabindex="0"]')).toHaveLength(1);
  });

  test("Enter, Space or a click selects the person; Escape clears; tc-selected-change can be prevented", async () => {
    const el = await make();
    const seen: (string | null)[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<CapacitySelectedChange>).detail.selected));
    cell(el, "jt", 1).click();
    await settle();
    expect(el.selected).toBe("jt");
    expect(cell(el, "jt", 0).closest('[role="row"]')!.getAttribute("aria-selected")).toBe("true");
    key(cell(el, "jt", 0), "Escape");
    await settle();
    key(cell(el, "am", 2), "Enter");
    await settle();
    key(cell(el, "am", 0), " ");
    await settle();
    expect(seen).toEqual(["jt", null, "am", null]);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    cell(el, "pr", 0).click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("a person who goes away clears the selection; units and an empty element", async () => {
    const el = await make();
    el.selected = "pr";
    await settle();
    el.people = PEOPLE.slice(1);
    await settle();
    expect(el.selected).toBeNull();
    el.unit = "%";
    el.people = [{ id: "x", name: "Sam Lee", capacity: 100, allocations: [{ id: "a", label: "Alpha", amount: 60 }] }];
    await settle();
    expect(cell(el, "x", 0).getAttribute("aria-label")).toBe("Sam Lee: 60% of 100%");
    const empty = await fixture<TcCapacityBars>(html`<tc-capacity-bars></tc-capacity-bars>`);
    expect(empty.querySelector(".ui-capb__empty")).toBeTruthy();
  });

  test("React wrapper: uncontrolled survives re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(CapacityBars, { title: "Team load", people: PEOPLE, onSelectedChange: (s, p) => void seen.push([s, p?.name]), "data-n": n } as React.ComponentProps<typeof CapacityBars>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-capacity-bars")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Team load");
    cell(el, "jt", 0).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("jt");
    expect(seen).toEqual([["jt", "Jonah Tran"]]);
    await act(async () => root.unmount());
    // Controlled, on a fresh root: a click asks, and nothing changes until the parent does
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(CapacityBars, { people: PEOPLE, selected: null, onSelectedChange: (s) => void seen.push(s) })));
    await settle();
    const el2 = host2.querySelector("tc-capacity-bars")!;
    cell(el2, "am", 0).click();
    await settle();
    expect(seen.at(-1)).toBe("am");
    expect(el2.selected).toBeNull();
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-capacity-bars .people=${PEOPLE} selected="am"></tc-capacity-bars>
        <tc-capacity-bars look="clean" .people=${PEOPLE}></tc-capacity-bars>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

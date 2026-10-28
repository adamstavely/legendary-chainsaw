/*
 * <tc-traceability-spine> in real browsers: stage columns with counts, cards and their pills, lines between linked
 * cards, tracing a card's path up and down, the keyboard, "+N more", controlled use, the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/traceability-spine";
import type { SpineAction, SpineNode, SpineSelectedChange, SpineStage, TcTraceabilitySpine } from "../../src/elements/traceability-spine";
import { TraceabilitySpine } from "../../src/elements/react/traceability-spine";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const STAGES: SpineStage[] = [
  { id: "question", label: "Questions", noun: ["question", "questions"] },
  { id: "gap", label: "Gaps", noun: ["gap", "gaps"] },
  { id: "work", label: "Work in flight", noun: ["work item", "work items"] },
  { id: "paper", label: "Papers", noun: ["paper", "papers"] },
  { id: "cited", label: "Cited by", noun: ["citing work", "citing works"], more: 80 },
];
/** q1 → g1 → w1 → p1 → c1, c2 · q2 → g2 (uncovered) · q3 → g3 → w2 */
const NODES: SpineNode[] = [
  { id: "q1", stage: "question", title: "Can spiking nets match dense accuracy?", status: "Open", links: ["g1"] },
  { id: "q2", stage: "question", title: "Which memristors last?", status: "Partial", tone: "warning", links: ["g2"] },
  { id: "q3", stage: "question", title: "How do we train on-chip?", status: "Open", links: ["g3"] },
  { id: "g1", stage: "gap", title: "No benchmark suite.", status: "High", tone: "warning", links: ["w1"] },
  { id: "g2", stage: "gap", title: "Endurance data missing.", status: "High", tone: "warning", flag: "Uncovered" },
  { id: "g3", stage: "gap", title: "No local learning rule.", status: "Critical", tone: "danger", links: ["w2"] },
  { id: "w1", stage: "work", title: "Benchmark harness", status: "Active", tone: "info", progress: 0.6, people: ["Jonah Tran", "Elena Castellanos"], links: ["p1"] },
  { id: "w2", stage: "work", title: "Plasticity rule", status: "Blocked", tone: "danger", progress: 0.35, people: ["Elena Castellanos"] },
  { id: "p1", stage: "paper", title: "Sparse spiking networks at 40× lower energy", meta: "↓ 18k · 73 cites", links: ["c1", "c2"] },
  { id: "c1", stage: "cited", title: "Energy-aware inference at the edge", meta: "IEEE TNNLS · 2026" },
  { id: "c2", stage: "cited", title: "A survey of SNN benchmarks", meta: "ACM Computing Surveys · 2026" },
];

const card = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-node="${id}"]`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const lit = (el: Element) => [...el.querySelectorAll<HTMLElement>("[data-node][data-on]")].map((c) => c.dataset.node).sort();
const make = (look: "standard" | "clean" = "standard", selected: string | null = null) =>
  fixture<TcTraceabilitySpine>(html`<div style="width: 1200px"><tc-traceability-spine look=${look} heading="Neuromorphic computing" description="Questions to outcomes." .stages=${STAGES} .nodes=${NODES} .selected=${selected}></tc-traceability-spine></div>`).then((w) => w.querySelector("tc-traceability-spine")!);

describe("tc-traceability-spine", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a column per stage with its count, cards with their pills, one tab stop and a legend`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("tsp");
      expect(el.dataset.look).toBe(look);
      const board = el.querySelector('[role="group"]')!;
      expect(document.getElementById(board.getAttribute("aria-labelledby")!)!.textContent).toBe("Neuromorphic computing");
      expect([...el.querySelectorAll(".ui-tsp__stage")].map((s) => [...s.children].map((c) => c.textContent).join(" "))).toEqual(["Questions 3", "Gaps 3", "Work in flight 2", "Papers 1", "Cited by 82"]);
      expect([...el.querySelectorAll(".ui-tsp__legend-item")].map((i) => i.textContent!.replace("→", "").trim())).toEqual(["Questions", "Gaps", "Work in flight", "Papers", "Cited by"]);
      expect(el.querySelectorAll("[data-node]")).toHaveLength(11);
      expect(board.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(card(el, "q1").getAttribute("tabindex")).toBe("0");
      // Kind, status, flag, progress and people
      expect(card(el, "g2").querySelector(".ui-tsp__kind")!.textContent).toBe("Gap");
      expect([...card(el, "g2").querySelectorAll(".ui-tsp__pill")].map((p) => p.textContent)).toEqual(["High", "Uncovered"]);
      expect(card(el, "w1").querySelector(".ui-tsp__pct")!.textContent).toBe("60%");
      expect([...card(el, "w1").querySelectorAll(".ui-tsp__avatar")].map((a) => a.textContent)).toEqual(["JT", "EC"]);
      expect(card(el, "w1").querySelector(".ui-tsp__sr")!.textContent).toBe("Jonah Tran, Elena Castellanos");
      expect(el.querySelector(".ui-tsp__more")!.textContent).toBe("+80 more citing works");
    });
  }

  test("lines join each linked pair, from the earlier card's right edge to the later card's left edge", async () => {
    const el = await make();
    await expect.poll(() => el.querySelectorAll(".ui-tsp__line").length).toBe(8);
    const board = el.querySelector(".ui-tsp__board")!.getBoundingClientRect();
    const line = el.querySelector<SVGPathElement>('.ui-tsp__line[data-from="g1"][data-to="w1"]')!;
    const [x1, y1] = line.getAttribute("d")!.slice(1).split(/[ C]/).map(Number);
    const g1 = card(el, "g1").getBoundingClientRect();
    expect(Math.abs(x1 - (g1.right - board.left))).toBeLessThan(1);
    expect(Math.abs(y1 - (g1.top + g1.height / 2 - board.top))).toBeLessThan(1);
    const end = line.getAttribute("d")!.split(" ").slice(-2).map(Number);
    const w1 = card(el, "w1").getBoundingClientRect();
    expect(Math.abs(end[0] - (w1.left - board.left))).toBeLessThan(1);
    // A gap nobody works on has no line to the right
    expect(el.querySelector('.ui-tsp__line[data-from="g2"]')).toBeNull();
  });

  test("click or Enter traces a card's path up and down, dims the rest and says what it found; again or Escape clears", async () => {
    const el = await make();
    const seen: SpineSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<SpineSelectedChange>).detail));
    await expect.poll(() => el.querySelectorAll(".ui-tsp__line").length).toBe(8);
    card(el, "w1").click();
    await settle();
    expect(el.selected).toBe("w1");
    expect(lit(el)).toEqual(["c1", "c2", "g1", "p1", "q1", "w1"]);
    expect(card(el, "w1").getAttribute("aria-pressed")).toBe("true");
    expect(card(el, "g2").hasAttribute("data-dim")).toBe(true);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Traced 1 question, 1 gap, 1 work item, 1 paper and 2 citing works");
    expect(el.querySelectorAll(".ui-tsp__line[data-on]")).toHaveLength(5);
    expect(seen[0].selected).toBe("w1");
    expect([...seen[0].path].sort()).toEqual(["c1", "c2", "g1", "p1", "q1", "w1"]);
    // A citing work traces back to its question, not to the paper's other citer
    key(card(el, "c1"), "Enter");
    await settle();
    expect(lit(el)).toEqual(["c1", "g1", "p1", "q1", "w1"]);
    key(card(el, "c1"), "Enter");
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector("[data-dim]")).toBeNull();
    card(el, "q2").click();
    await settle();
    expect(lit(el)).toEqual(["g2", "q2"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Traced 1 question and 1 gap");
    key(card(el, "q2"), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Trace cleared");
  });

  test("keyboard: ↑ ↓ in a column, ← → to the nearest card across, Home / End", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-node");
    card(el, "q1").focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('[data-node][tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowDown");
    expect(at()).toBe("q2");
    await press("End");
    expect(at()).toBe("q3");
    await press("Home");
    expect(at()).toBe("q1");
    await press("ArrowUp");
    expect(at()).toBe("q1");
    await press("ArrowRight");
    expect(at()).toBe("g1");
    await press("ArrowDown");
    await press("ArrowDown");
    await press("ArrowRight");
    // g3 is lowest in its column; the nearest work card by height is the lower one
    expect(at()).toBe("w2");
    await press("ArrowLeft");
    expect(at()).toBe("g3");
    expect(card(el, "g3").getAttribute("tabindex")).toBe("0");
  });

  test("“+N more” fires tc-action with the stage; preventDefault() keeps the trace; nodes going away clear it", async () => {
    const el = await make("standard", "p1");
    const actions: SpineAction[] = [];
    el.addEventListener("tc-action", (e) => actions.push((e as CustomEvent<SpineAction>).detail));
    el.querySelector<HTMLButtonElement>(".ui-tsp__more")!.click();
    expect(actions).toEqual([{ action: "more", stage: "cited" }]);
    expect(card(el, "p1").getAttribute("tabindex")).toBe("0");
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    card(el, "q2").click();
    await settle();
    expect(el.selected).toBe("p1");
    el.nodes = NODES.filter((n) => n.id !== "p1");
    await settle();
    expect(el.selected).toBeNull();
  });

  test("an empty element renders without errors", async () => {
    const el = await fixture<TcTraceabilitySpine>(html`<tc-traceability-spine></tc-traceability-spine>`);
    expect(el.querySelector(".ui-tsp__empty")).toBeTruthy();
    expect(el.querySelector(".ui-tsp__board")).toBeNull();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Traceability");
  });

  test("React wrapper: an uncontrolled trace survives parent re-renders; onSelectedChange gets the path; onMore the stage", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    const more: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(TraceabilitySpine, {
        title: "Topic",
        stages: STAGES,
        nodes: NODES,
        onSelectedChange: (s, p) => void seen.push([s, p.length]),
        onMore: (stage) => void more.push(stage),
        "data-n": n,
      } as React.ComponentProps<typeof TraceabilitySpine>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-traceability-spine")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Topic");
    card(el, "g1").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("g1");
    expect(seen).toEqual([["g1", 6]]);
    el.querySelector<HTMLButtonElement>(".ui-tsp__more")!.click();
    expect(more).toEqual(["cited"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled trace stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: (string | null)[] = [];
    await act(async () => root.render(React.createElement(TraceabilitySpine, { stages: STAGES, nodes: NODES, selected: null, onSelectedChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-traceability-spine")!;
    card(el, "w2").click();
    await settle();
    expect(asked).toEqual(["w2"]);
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 1200px; background: var(--tc-surface-base)">
        <tc-traceability-spine description="Questions to outcomes." .stages=${STAGES} .nodes=${NODES} .selected=${"w1"}></tc-traceability-spine>
        <tc-traceability-spine look="clean" .stages=${STAGES} .nodes=${NODES}></tc-traceability-spine>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

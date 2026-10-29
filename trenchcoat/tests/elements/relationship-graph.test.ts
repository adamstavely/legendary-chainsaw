/*
 * <tc-relationship-graph> in real browsers: the ego and its rings in a fixed order, re-centring, depth, the kinds
 * legend, selecting nodes and relationships, the panel, the node list's keys, fitting the width, the React wrapper and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/relationship-graph";
import { relationEdgeId, type RelationEdge, type RelationEgoChange, type RelationNode, type RelationSelectedChange, type TcRelationshipGraph } from "../../src/elements/relationship-graph";
import { RelationshipGraph } from "../../src/elements/react/relationship-graph";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NODES: RelationNode[] = [
  { id: "ines", label: "Ines Okafor", kind: "person", subtitle: "Principal investigator" },
  { id: "tomas", label: "Tomás Reyes", kind: "person" },
  { id: "mira", label: "Mira Lindqvist", kind: "person" },
  { id: "uni", label: "Northfield University", kind: "organisation" },
  { id: "inst", label: "Harbour Lane Institute", kind: "organisation" },
  { id: "fund", label: "Tidewater Foundation", kind: "funder" },
];
const EDGES: RelationEdge[] = [
  { from: "uni", to: "ines", label: "employs", weight: 5, since: "2014" },
  { from: "uni", to: "tomas", label: "employs", weight: 3 },
  { from: "ines", to: "mira", label: "co-author", weight: 3 },
  { from: "inst", to: "mira", label: "employs", weight: 4 },
  { id: "f1", from: "fund", to: "uni", label: "funds", weight: 5 },
  { from: "fund", to: "inst", label: "funds", weight: 2 },
];
const make = (look = "standard", depth: 1 | 2 = 1) =>
  fixture<TcRelationshipGraph>(html`<tc-relationship-graph look=${look} heading="Consortium" style="width: 760px" .depth=${depth} .nodes=${NODES} .edges=${EDGES}></tc-relationship-graph>`);
const text = (el: Element | null | undefined) =>
  [...(el?.childNodes ?? [])].map((n) => (n.nodeType === Node.COMMENT_NODE ? "" : (n.textContent ?? ""))).join("").replace(/\s+/g, " ").trim();
const options = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
const order = (el: Element) => options(el).map((o) => text(o.querySelector(".ui-rgr__option-name")));
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-relationship-graph", () => {
  test("helpers: an edge's id is its own, or made from its ends", () => {
    expect(relationEdgeId({ from: "a", to: "b", label: "funds" })).toBe("a->b:funds");
    expect(relationEdgeId({ id: "x", from: "a", to: "b" })).toBe("x");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the first person in the middle, their connections around them, people before organisations`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rgr");
      expect(el.dataset.look).toBe(look);
      expect(el.centre!.id).toBe("ines");
      expect(order(el)).toEqual(["Ines Okafor", "Mira Lindqvist", "Northfield University"]);
      expect(text(options(el)[1].querySelector(".ui-rgr__option-meta"))).toBe("Direct · Person · 2 connections");
      expect(el.querySelector(".ui-rgr__svg")!.getAttribute("aria-hidden")).toBe("true");
      expect(el.querySelectorAll(".ui-rgr__node")).toHaveLength(3);
      // The two relationships between placed nodes, thick and thin by weight
      expect([...el.querySelectorAll(".ui-rgr__edge")].map((e) => e.getAttribute("data-weight")).sort()).toEqual(["3", "5"]);
      expect(el.querySelector('.ui-rgr__node[data-id="uni"] rect')).not.toBeNull();
      expect(el.querySelector('.ui-rgr__node[data-id="mira"] circle')).not.toBeNull();
      // The panel: the ego's connections by relationship
      expect([...el.querySelectorAll(".ui-rgr__group-name")].map(text)).toEqual(["Employs 1", "Co-author 1"]);
    });
  }

  test("depth 2 adds the outer ring, each beside the node it hangs off – the same order every time", async () => {
    const el = await make("standard", 2);
    expect(order(el)).toEqual(["Ines Okafor", "Mira Lindqvist", "Northfield University", "Harbour Lane Institute", "Tomás Reyes", "Tidewater Foundation"]);
    expect(el.querySelectorAll('.ui-rgr__node[data-ring="2"]')).toHaveLength(3);
    const seen: number[] = [];
    el.addEventListener("tc-depth-change", (e) => seen.push((e as CustomEvent).detail.depth));
    el.querySelectorAll<HTMLButtonElement>(".ui-rgr__depth-opt")[0].click();
    await settle();
    expect(el.depth).toBe(1);
    expect(seen).toEqual([1]);
  });

  test("clicking a node puts it in the middle (cancelable tc-ego-change) and selects it", async () => {
    const el = await make();
    const egos: RelationEgoChange[] = [];
    el.addEventListener("tc-ego-change", (e) => egos.push((e as CustomEvent<RelationEgoChange>).detail));
    el.querySelector('.ui-rgr__node[data-id="uni"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(el.ego).toBe("uni");
    expect(el.selected).toBe("uni");
    expect(egos.map((e) => e.ego)).toEqual(["uni"]);
    expect(order(el)).toEqual(["Northfield University", "Ines Okafor", "Tomás Reyes", "Tidewater Foundation"]);
    expect(text(el.querySelector('[role="status"]'))).toBe("Northfield University in the middle, 3 connections");
    el.addEventListener("tc-ego-change", (e) => e.preventDefault(), { once: true });
    el.querySelector('.ui-rgr__node[data-id="fund"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(el.ego).toBe("uni");
  });

  test("the node list: arrows move in ring order, Enter centres, Space selects", async () => {
    const el = await make();
    const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
    list.focus();
    await settle();
    key(list, "ArrowDown");
    await settle();
    expect(list.getAttribute("aria-activedescendant")).toBe(options(el)[1].id);
    expect(el.querySelector('.ui-rgr__node[data-id="mira"]')!.hasAttribute("data-active")).toBe(true);
    key(list, " ");
    await settle();
    expect(el.selected).toBe("mira");
    expect(options(el)[1].getAttribute("aria-selected")).toBe("true");
    expect(text(el.querySelector(".ui-rgr__panel-name"))).toBe("Mira Lindqvist");
    key(list, "End");
    await settle();
    key(list, "Enter");
    await settle();
    expect(el.ego).toBe("uni");
  });

  test("selecting a relationship shows it in the panel; the legend hides and shows kinds", async () => {
    const el = await make("standard", 2);
    const sel: RelationSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => sel.push((e as CustomEvent<RelationSelectedChange>).detail));
    const edge = [...el.querySelectorAll(".ui-rgr__edge")].find((e) => e.querySelector(".ui-rgr__line")!.getAttribute("x1") !== null)!;
    edge.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(el.selected!.startsWith("edge:")).toBe(true);
    expect(sel[0].edge).not.toBeNull();
    expect(text(el.querySelector(".ui-rgr__panel-kind"))).toBe("Relationship");
    const kinds = [...el.querySelectorAll<HTMLButtonElement>(".ui-rgr__kind")];
    expect(kinds.map(text)).toEqual(["Person", "Organisation", "Funder"]);
    kinds[2].click();
    await settle();
    expect(el.kinds).toEqual(["person", "organisation"]);
    expect(order(el)).not.toContain("Tidewater Foundation");
    expect(kinds[2].getAttribute("aria-pressed")).toBe("false");
    kinds[2].click();
    await settle();
    expect(el.kinds).toEqual([]);
  });

  test("it fits the width it's given", async () => {
    const el = await make();
    const svgEl = () => el.querySelector<SVGSVGElement>(".ui-rgr__svg")!;
    await expect.poll(() => Number(svgEl().getAttribute("width"))).toBeLessThan(560);
    el.style.width = "1100px";
    await expect.poll(() => Number(svgEl().getAttribute("width"))).toBeGreaterThan(600);
  });

  test("React wrapper: uncontrolled ego survives re-renders; a controlled depth stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const egos: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RelationshipGraph, { title: "Ours", nodes: NODES, edges: EDGES, onEgoChange: (id) => void egos.push(id), "data-n": n } as React.ComponentProps<typeof RelationshipGraph>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-relationship-graph")!;
    el.querySelector('.ui-rgr__node[data-id="mira"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.ego).toBe("mira");
    expect(egos).toEqual(["mira"]);
    await act(async () => root.render(React.createElement(RelationshipGraph, { nodes: NODES, edges: EDGES, depth: 1 })));
    await settle();
    const held = host.querySelector("tc-relationship-graph")!;
    held.querySelectorAll<HTMLButtonElement>(".ui-rgr__depth-opt")[1].click();
    await settle();
    expect(held.depth).toBe(1);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-relationship-graph heading="Consortium" description="People and institutions" selected="uni" .nodes=${NODES} .edges=${EDGES}></tc-relationship-graph>
        <tc-relationship-graph look="clean" heading="Two steps" .depth=${2} .nodes=${NODES} .edges=${EDGES} selected=${`edge:${relationEdgeId(EDGES[0])}`}></tc-relationship-graph>
        <tc-relationship-graph heading="Empty"></tc-relationship-graph>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

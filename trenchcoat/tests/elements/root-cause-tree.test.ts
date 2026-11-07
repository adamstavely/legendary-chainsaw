/*
 * <tc-root-cause-tree> in real browsers: the failure and its hypotheses laid out as a tree, status in words, the
 * summary, muted ruled-out branches, the lit way up from a confirmed cause, opening a node's evidence, the tree
 * keyboard, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/root-cause-tree";
import type { RootCauseFailure, RootCauseHypothesis, RootCauseSelectedChange, TcRootCauseTree } from "../../src/elements/root-cause-tree";
import { RootCauseTree } from "../../src/elements/react/root-cause-tree";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const FAILURE: RootCauseFailure = { title: "Nightly import failed", ref: "import.log", detail: "4 of 12 batches" };
/** schema (AND: column, position) · stations · geocode · units */
const HYPS = (s: Record<string, RootCauseHypothesis["status"]> = {}): RootCauseHypothesis[] => [
  {
    id: "schema",
    title: "Survey CSV schema changed",
    ref: "survey.csv",
    status: s.schema,
    gate: "and",
    children: [
      { id: "column", title: "A new column shifts depth", ref: "schema.yaml", status: s.column, note: "The schema gained a column." },
      { id: "position", title: "Parser reads by position", ref: "parse.py", status: s.position },
    ],
  },
  { id: "stations", title: "Station codes are stale", ref: "stations.json", status: s.stations, note: "All codes are current." },
  { id: "geocode", title: "Geocoder timed out", ref: "geocode.log", status: s.geocode, children: [{ id: "dns", title: "DNS failed", status: s.dns }] },
  { id: "units", title: "Depth in feet", ref: "units.ts", status: s.units },
];

const node = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-node="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const ids = (el: Element, attr: string) => [...el.querySelectorAll<HTMLElement>(`[data-node][${attr}]`)].map((n) => n.dataset.node).sort();
const make = (look: "standard" | "clean" = "standard", s: Record<string, RootCauseHypothesis["status"]> = {}, selected: string | null = null) =>
  fixture<TcRootCauseTree>(html`<div style="width: 1100px"><tc-root-cause-tree look=${look} heading="Why did it fail?" .failure=${FAILURE} .hypotheses=${HYPS(s)} .selected=${selected}></tc-root-cause-tree></div>`).then(
    (w) => w.querySelector("tc-root-cause-tree")!,
  );

describe("tc-root-cause-tree", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a tree of the failure and its hypotheses, status in words, one tab stop and a summary`, async () => {
      const el = await make(look, { geocode: "ruled-out", stations: "checking" });
      expect(el.dataset.ui).toBe("rct");
      expect(el.dataset.look).toBe(look);
      const tree = el.querySelector('[role="tree"]')!;
      expect(document.getElementById(tree.getAttribute("aria-labelledby")!)!.textContent).toBe("Why did it fail?");
      const items = [...tree.querySelectorAll<HTMLElement>('[role="treeitem"]')];
      expect(items.map((i) => i.dataset.node)).toEqual(["failure", "schema", "column", "position", "stations", "geocode", "dns", "units"]);
      expect(items.map((i) => i.getAttribute("aria-level"))).toEqual(["1", "2", "3", "3", "2", "2", "3", "2"]);
      expect(node(el, "stations").getAttribute("aria-posinset")).toBe("2");
      expect(node(el, "stations").getAttribute("aria-setsize")).toBe("4");
      expect(tree.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(node(el, "failure").getAttribute("tabindex")).toBe("0");
      expect(node(el, "failure").querySelector(".ui-rct__word")!.textContent).toBe("Failed");
      expect(node(el, "failure").querySelector(".ui-rct__detail")!.textContent).toBe("4 of 12 batches");
      expect(node(el, "units").querySelector(".ui-rct__word")!.textContent).toBe("Not checked");
      expect(node(el, "stations").querySelector(".ui-rct__word")!.textContent).toBe("Checking");
      expect(node(el, "geocode").querySelector(".ui-rct__word")!.textContent).toBe("Ruled out");
      expect(node(el, "schema").querySelector(".ui-rct__ref")!.textContent).toBe("survey.csv");
      expect(node(el, "schema").textContent).toContain("Only all 2 below together could cause this");
      expect(el.querySelector(".ui-rct__count")!.textContent).toBe("7 hypotheses · 1 ruled out");
      expect(el.querySelector(".tc-head .ui-rct__pill")!.textContent).toBe("Investigating");
      // Gates: OR under the failure, AND under the schema
      expect([...el.querySelectorAll(".ui-rct__gate")].map((g) => g.textContent)).toEqual(["OR", "AND"]);
      // One line per child
      expect(el.querySelectorAll(".ui-rct__line")).toHaveLength(7);
    });
  }

  test("parents sit centred over their children, a level per row", async () => {
    const el = await make();
    const box = (id: string) => node(el, id).getBoundingClientRect();
    const mid = (r: DOMRect) => r.left + r.width / 2;
    expect(Math.abs(mid(box("schema")) - (mid(box("column")) + mid(box("position"))) / 2)).toBeLessThan(1);
    expect(box("column").top).toBeGreaterThan(box("schema").bottom);
    expect(Math.abs(box("schema").top - box("units").top)).toBeLessThan(1);
    expect(box("failure").bottom).toBeLessThan(box("schema").top);
  });

  test("ruled-out branches mute down to their leaves; a confirmed cause lights the way up to the failure", async () => {
    const el = await make("standard", { geocode: "ruled-out", stations: "ruled-out", column: "confirmed", position: "confirmed", schema: "confirmed" });
    expect(ids(el, "data-muted")).toEqual(["dns", "geocode", "stations"]);
    expect(ids(el, "data-lit")).toEqual(["column", "failure", "position", "schema"]);
    expect(node(el, "failure").querySelector(".ui-rct__word")!.textContent).toBe("Cause found");
    expect(el.querySelector(".tc-head .ui-rct__pill")!.textContent).toBe("Cause found");
    expect(el.querySelector(".ui-rct__count")!.textContent).toBe("7 hypotheses · 2 ruled out");
    expect([...el.querySelectorAll<SVGPathElement>(".ui-rct__glow")].map((g) => g.dataset.to).sort()).toEqual(["column", "position", "schema"]);
    expect(el.querySelector('.ui-rct__line[data-to="dns"]')!.hasAttribute("data-muted")).toBe(true);
    // The deepest link draws first
    const delay = (id: string) => el.querySelector<SVGPathElement>(`.ui-rct__glow[data-to="${id}"]`)!.style.getPropertyValue("--i");
    expect([delay("column"), delay("schema")]).toEqual(["0", "1"]);
  });

  test("a cause confirmed later is announced", async () => {
    const el = await make("standard", { schema: "checking" });
    el.hypotheses = HYPS({ schema: "confirmed" });
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Cause found: Survey CSV schema changed");
  });

  test("click or Enter opens a node's evidence; Close, Escape or again closes it; preventDefault() keeps it", async () => {
    const el = await make("standard", { stations: "ruled-out" });
    const seen: RootCauseSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<RootCauseSelectedChange>).detail));
    node(el, "stations").click();
    await settle();
    expect(el.selected).toBe("stations");
    expect(node(el, "stations").getAttribute("aria-selected")).toBe("true");
    const panel = el.querySelector(".ui-rct__panel")!;
    expect(panel.querySelector(".ui-rct__panel-title")!.textContent).toBe("Station codes are stale");
    expect(panel.querySelector(".ui-rct__pill")!.textContent).toBe("Ruled out");
    expect([...panel.querySelectorAll("dd")].map((d) => d.textContent)).toEqual(["stations.json", "All codes are current."]);
    expect(seen[0].selected).toBe("stations");
    expect((seen[0].node as RootCauseHypothesis).id).toBe("stations");
    el.querySelector<HTMLButtonElement>(".ui-rct__close")!.click();
    await settle();
    expect(el.selected).toBeNull();
    await expect.poll(() => document.activeElement?.getAttribute("data-node")).toBe("stations");
    key(node(el, "schema"), "Enter");
    await settle();
    expect(el.querySelector(".ui-rct__panel dd:last-child")).toBeTruthy();
    expect(el.querySelector(".ui-rct__panel")!.textContent).toContain("Only all 2 below together could cause this");
    key(node(el, "schema"), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    node(el, "units").click();
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector(".ui-rct__panel")).toBeNull();
  });

  test("keyboard: ↑ ↓ in reading order, → to the first child, ← to the parent, Home / End", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-node");
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await settle();
    };
    node(el, "failure").focus();
    await press("ArrowDown");
    expect(at()).toBe("schema");
    await press("ArrowRight");
    expect(at()).toBe("column");
    await press("ArrowDown");
    expect(at()).toBe("position");
    await press("ArrowLeft");
    expect(at()).toBe("schema");
    await press("ArrowLeft");
    expect(at()).toBe("failure");
    await press("End");
    expect(at()).toBe("units");
    await press("ArrowRight");
    expect(at()).toBe("units");
    await press("Home");
    expect(at()).toBe("failure");
    expect(node(el, "failure").getAttribute("tabindex")).toBe("0");
  });

  test("a narrow container scrolls the drawing sideways instead of squeezing it", async () => {
    const wrap = await fixture(html`<div style="width: 360px"><tc-root-cause-tree .failure=${FAILURE} .hypotheses=${HYPS()}></tc-root-cause-tree></div>`);
    const scroll = wrap.querySelector<HTMLElement>(".ui-rct__scroll")!;
    expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
    expect(wrap.querySelector<HTMLElement>('[data-node="units"]')!.getBoundingClientRect().width).toBe(184);
  });

  test("hypotheses that go away close their panel; an empty element renders without errors", async () => {
    const el = await make("clean", {}, "units");
    expect(el.querySelector(".ui-rct__panel")).toBeTruthy();
    el.hypotheses = HYPS().filter((h) => h.id !== "units");
    await settle();
    expect(el.selected).toBeNull();
    const empty = await fixture<TcRootCauseTree>(html`<tc-root-cause-tree></tc-root-cause-tree>`);
    expect(empty.querySelector(".ui-rct__empty")).toBeTruthy();
    expect(empty.querySelector(".tc-head__title")!.textContent).toBe("Root cause");
  });

  test("renamed status words", async () => {
    const el = await fixture<TcRootCauseTree>(html`<tc-root-cause-tree .failure=${FAILURE} .hypotheses=${HYPS({ units: "ruled-out" })} .statusLabels=${{ "ruled-out": "Excluded" }}></tc-root-cause-tree>`);
    expect(node(el, "units").querySelector(".ui-rct__word")!.textContent).toBe("Excluded");
  });

  test("React wrapper: an uncontrolled selection survives parent re-renders; onSelectedChange gets the node", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RootCauseTree, { title: "Why?", failure: FAILURE, hypotheses: HYPS(), onSelectedChange: (s, nd) => void seen.push([s, nd?.title]), "data-n": n } as React.ComponentProps<typeof RootCauseTree>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-root-cause-tree")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Why?");
    node(el, "units").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("units");
    expect(seen).toEqual([["units", "Depth in feet"]]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled selection stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: (string | null)[] = [];
    await act(async () => root.render(React.createElement(RootCauseTree, { failure: FAILURE, hypotheses: HYPS(), selected: null, onSelectedChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-root-cause-tree")!;
    node(el, "stations").click();
    await settle();
    expect(asked).toEqual(["stations"]);
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const s = { geocode: "ruled-out", stations: "checking", column: "confirmed", schema: "confirmed", position: "confirmed" } as const;
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 1100px; background: var(--tc-surface-base)">
        <tc-root-cause-tree description="The agent checks each suspect." .failure=${FAILURE} .hypotheses=${HYPS(s)} .selected=${"column"}></tc-root-cause-tree>
        <tc-root-cause-tree look="clean" .failure=${FAILURE} .hypotheses=${HYPS(s)} .selected=${"failure"}></tc-root-cause-tree>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

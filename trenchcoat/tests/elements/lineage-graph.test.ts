/*
 * <tc-lineage-graph> in real browsers: the host and both looks, the layout in columns, weak links, the lineage that
 * lights up, the record (click, Enter, Escape, links), the grid keyboard along columns and links, the event chain,
 * controlled use, focus, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/lineage-graph";
import type { LineageEdge, LineageNode, TcLineageGraph } from "../../src/elements/lineage-graph";
import { LineageGraph } from "../../src/elements/react/lineage-graph";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const NODES: LineageNode[] = [
  { id: "run", column: "run", label: "Review", at: 0, fields: [{ label: "Model", value: "General 4.1" }] },
  { id: "t1", column: "turn", label: "Turn one", at: 1000 },
  { id: "q1", column: "query", label: "search: uptime", detail: "6 results", at: 2000 },
  { id: "q2", column: "query", label: "sql: incidents", at: 3000 },
  { id: "c1", column: "chunk", label: "SLA report", at: 2100, text: "99.72% against 99.9%" },
  { id: "c2", column: "chunk", label: "Incident log", at: 3100 },
  { id: "k1", column: "claim", label: "Missed the SLA", at: 5000, tone: "green" },
  { id: "a1", column: "artifact", label: "Risk memo", at: 9000 },
];
const EDGES: LineageEdge[] = [
  { from: "run", to: "t1" },
  { from: "t1", to: "q1" },
  { from: "t1", to: "q2" },
  { from: "q1", to: "c1" },
  { from: "q2", to: "c2" },
  { from: "c1", to: "k1" },
  { from: "c2", to: "k1", weak: true, note: "4 of 11 rows fit" },
  { from: "k1", to: "a1" },
];
const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const make = (attrs: { look?: string; selected?: string | null; view?: string } = {}) =>
  fixture<TcLineageGraph>(
    html`<tc-lineage-graph look=${attrs.look ?? "standard"} heading="Memo lineage" view=${attrs.view ?? "graph"} .selected=${attrs.selected ?? null} .nodes=${NODES} .edges=${EDGES}></tc-lineage-graph>`,
  );
const cell = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-lng-node][data-id="${id}"]`)!;
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const focused = () => (document.activeElement as HTMLElement | null)?.dataset.id;

describe("tc-lineage-graph", () => {
  for (const look of looks) {
    test(`${look}: the host is the root and a region named by its heading; the bar counts steps and weak links`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("lng");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Memo lineage");
      expect(el.querySelector(".ui-lng__sum")!.textContent!.replace(/\s+/g, " ").trim()).toBe("8 steps 1 weak link");
    });
  }

  test("graph: a grid with a header row per column, nodes in columns left to right, weak links dashed", async () => {
    const el = await make();
    const grid = el.querySelector('[role="grid"]')!;
    expect(grid.getAttribute("aria-colcount")).toBe("6");
    expect([...el.querySelectorAll('[role="columnheader"]')].map((h) => h.querySelector(".ui-lng__head-label")!.textContent)).toEqual(["Run", "Turns", "Queries & tools", "Source chunks", "Claims", "Artifacts"]);
    const x = (id: string) => parseFloat(cell(el, id).style.left);
    expect(x("run")).toBeLessThan(x("t1"));
    expect(x("t1")).toBeLessThan(x("q1"));
    expect(x("q1")).toBe(x("q2"));
    expect(x("k1")).toBeLessThan(x("a1"));
    expect(cell(el, "q1").getAttribute("aria-colindex")).toBe("3");
    expect(el.querySelectorAll(".ui-lng__edge").length).toBe(8);
    expect(el.querySelectorAll(".ui-lng__edge[data-weak]").length).toBe(1);
    expect(cell(el, "k1").dataset.tone).toBe("green");
    expect(cell(el, "c1").dataset.tone).toBe("teal");
    // Screen readers hear where it sits and what it came from – the weak link with its note
    expect(cell(el, "k1").textContent).toContain("From SLA report, Incident log (weak link: 4 of 11 rows fit). Feeds Risk memo.");
  });

  test("the column set is data: custom columns, and a column with no nodes doesn't show", async () => {
    const el = await make();
    el.columns = [
      { id: "query", label: "Lookups" },
      { id: "chunk", label: "Passages", tone: "pink" },
      { id: "empty", label: "Nothing here" },
    ];
    await settle();
    expect([...el.querySelectorAll(".ui-lng__head-label")].map((h) => h.textContent)).toEqual(["Lookups", "Passages"]);
    expect(el.querySelectorAll("[data-lng-node]").length).toBe(4);
    expect(cell(el, "c1").dataset.tone).toBe("pink");
  });

  test("focusing or pointing at a node lights up its whole lineage and dims the rest", async () => {
    const el = await make();
    cell(el, "c1").focus();
    await settle();
    const dim = [...el.querySelectorAll<HTMLElement>("[data-lng-node][data-dim]")].map((n) => n.dataset.id);
    expect(dim.sort()).toEqual(["c2", "q2"]);
    expect(cell(el, "c1").hasAttribute("data-lit")).toBe(true);
    expect(el.querySelectorAll(".ui-lng__edge[data-lit]").length).toBe(5);
    cell(el, "c1").blur();
    await settle();
    expect(el.querySelectorAll("[data-lng-node][data-dim]").length).toBe(0);
  });

  test("a click opens the node's record and fires a cancelable tc-selected-change; a second click closes it", async () => {
    const el = await make();
    const seen: (string | null)[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent).detail.selected));
    cell(el, "c1").click();
    await settle();
    expect(el.selected).toBe("c1");
    expect(cell(el, "c1").getAttribute("aria-selected")).toBe("true");
    const record = el.querySelector(".ui-lng__record")!;
    expect(record.querySelector("h4")!.textContent).toBe("SLA report");
    expect(record.querySelector(".ui-lng__pill")!.textContent).toBe("Source chunks");
    expect(record.querySelector(".ui-lng__record-at")!.textContent).toBe("+2.1s");
    expect(record.querySelector("blockquote")!.textContent).toBe("99.72% against 99.9%");
    expect([...record.querySelectorAll(".ui-lng__links h5")].map((h) => h.textContent)).toEqual(["Came from", "Feeds"]);
    cell(el, "c1").click();
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector(".ui-lng__record")).toBeNull();
    expect(seen).toEqual(["c1", null]);
  });

  test("the record shows fields and weak links with their note; a link goes to that node", async () => {
    const el = await make({ selected: "run" });
    expect([...el.querySelectorAll(".ui-lng__field")].map((f) => f.textContent)).toEqual(["ModelGeneral 4.1"]);
    expect(el.querySelector(".ui-lng__record-at")!.textContent).toBe("Start of the run");
    el.selected = "k1";
    await settle();
    const weak = el.querySelector<HTMLButtonElement>(".ui-lng__link[data-weak]")!;
    expect(weak.textContent).toContain("Incident log");
    expect(weak.querySelector(".ui-lng__weak")!.textContent).toBe(", weak link: 4 of 11 rows fit");
    weak.click();
    await settle();
    expect(el.selected).toBe("c2");
    expect(focused()).toBe("c2");
  });

  test("controlled: preventDefault() keeps the record as it is", async () => {
    const el = await make({ selected: "q1" });
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    cell(el, "c1").click();
    await settle();
    expect(el.selected).toBe("q1");
  });

  test("keyboard: one tab stop; up and down a column, left and right along the links, Home/End, Enter and Escape", async () => {
    const el = await make();
    const tabbable = [...el.querySelectorAll<HTMLElement>('[data-lng-node][tabindex="0"]')];
    expect(tabbable.map((n) => n.dataset.id)).toEqual(["run"]);
    cell(el, "run").focus();
    await key(cell(el, "run"), "ArrowRight");
    expect(focused()).toBe("t1");
    await key(cell(el, "t1"), "ArrowRight");
    const q = focused()!;
    expect(["q1", "q2"]).toContain(q);
    await key(cell(el, q), q === "q1" ? "ArrowDown" : "ArrowUp");
    const other = q === "q1" ? "q2" : "q1";
    expect(focused()).toBe(other);
    await key(cell(el, other), "ArrowRight");
    expect(focused()).toBe(other === "q1" ? "c1" : "c2");
    await key(cell(el, focused()!), "ArrowRight");
    expect(focused()).toBe("k1");
    await key(cell(el, "k1"), "ArrowLeft");
    expect(["c1", "c2"]).toContain(focused());
    await key(cell(el, focused()!), "End", { ctrlKey: true });
    expect(focused()).toBe("a1");
    await key(cell(el, "a1"), "Home", { ctrlKey: true });
    expect(focused()).toBe("run");
    await key(cell(el, "run"), "ArrowLeft");
    expect(focused()).toBe("run");
    expect([...el.querySelectorAll<HTMLElement>('[data-lng-node][tabindex="0"]')].map((n) => n.dataset.id)).toEqual(["run"]);
    await key(cell(el, "run"), "Enter");
    expect(el.selected).toBe("run");
    await key(cell(el, "run"), "Escape");
    expect(el.selected).toBeNull();
    await key(cell(el, "run"), " ");
    expect(el.selected).toBe("run");
  });

  test("Escape in the record closes it and puts focus back on its node; the close button does the same", async () => {
    const el = await make({ selected: "q2" });
    const close = el.querySelector<HTMLButtonElement>(".ui-lng__close")!;
    expect(close.getAttribute("aria-label")).toBe("Close record");
    close.focus();
    await key(close, "Escape");
    expect(el.selected).toBeNull();
    expect(focused()).toBe("q2");
    el.selected = "c1";
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-lng__close")!.click();
    await settle();
    expect(focused()).toBe("c1");
  });

  test("the event chain: tabs switch views (cancelable tc-view-change), a listbox in the order things happened", async () => {
    const el = await make({ selected: "c1" });
    const views: string[] = [];
    el.addEventListener("tc-view-change", (e) => views.push((e as CustomEvent).detail.view));
    const tabs = [...el.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    expect(tabs.map((t) => t.textContent)).toEqual(["Graph", "Event chain"]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    tabs[1].click();
    await settle();
    expect(el.view).toBe("chain");
    expect(views).toEqual(["chain"]);
    const opts = [...el.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(opts.map((o) => o.dataset.id)).toEqual(["run", "t1", "q1", "c1", "q2", "c2", "k1", "a1"]);
    expect(opts.map((o) => o.querySelector(".ui-lng__time")!.textContent)).toEqual(["0s", "+1.0s", "+2.0s", "+2.1s", "+3.0s", "+3.1s", "+5.0s", "+9.0s"]);
    expect(opts[6].querySelector(".ui-lng__weak")!.textContent).toBe("Truncated context");
    // The open record stays open across views
    expect(opts[3].getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector(".ui-lng__record")).not.toBeNull();
    // The keyboard: the open node takes Tab; arrows, Enter
    expect(el.querySelector<HTMLElement>('[role="option"][tabindex="0"]')!.dataset.id).toBe("c1");
    opts[3].focus();
    await key(opts[3], "ArrowDown");
    expect(focused()).toBe("q2");
    await key(document.activeElement!, "End");
    expect(focused()).toBe("a1");
    await key(document.activeElement!, "Enter");
    expect(el.selected).toBe("a1");
    // Arrow keys on the tabs
    tabs[1].focus();
    await key(el.querySelector('[role="tablist"]')!, "ArrowLeft");
    expect(el.view).toBe("graph");
    expect(document.activeElement!.textContent).toBe("Graph");
    el.addEventListener("tc-view-change", (e) => e.preventDefault());
    el.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
    await settle();
    expect(el.view).toBe("graph");
  });

  test("weak-label and empty-text are properties; a removed open node closes its record", async () => {
    const el = await make({ selected: "a1" });
    el.weakLabel = "Context cut";
    await settle();
    expect(el.querySelector(".ui-lng__legend")!.textContent).toContain("Context cut");
    el.nodes = NODES.filter((n) => n.id !== "a1");
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector(".ui-lng__record")).toBeNull();
    el.emptyText = "Nothing yet";
    el.nodes = [];
    await settle();
    expect(el.querySelector(".ui-lng__empty")!.textContent).toBe("Nothing yet");
    expect(el.querySelector('[role="tablist"]')).toBeNull();
  });

  test("focus doesn't drop to the body when the focused node goes away", async () => {
    const el = await make();
    cell(el, "a1").focus();
    await settle();
    el.nodes = NODES.filter((n) => n.id !== "a1");
    await settle();
    await wait(50);
    expect(el.contains(document.activeElement)).toBe(true);
  });

  test("the wrapper: title, uncontrolled values survive a parent re-render, callbacks fire", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picks: (string | null)[] = [];
    const views: string[] = [];
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(LineageGraph, { title: `Lineage ${n}`, nodes: NODES, edges: EDGES, onSelectedChange: (id) => picks.push(id), onViewChange: (v) => views.push(v) });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-lineage-graph")!;
    cell(el, "c1").click();
    el.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector(".ui-lng__title")!.textContent).toBe("Lineage 1");
    expect(el.selected).toBe("c1");
    expect(el.view).toBe("chain");
    expect(picks).toEqual(["c1"]);
    expect(views).toEqual(["chain"]);
    await act(async () => root.unmount());
  });

  test("the wrapper: controlled selected and view", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picks: (string | null)[] = [];
    await act(async () => root.render(React.createElement(LineageGraph, { nodes: NODES, edges: EDGES, selected: "q1", view: "graph", onSelectedChange: (id) => picks.push(id) })));
    await settle();
    const el = host.querySelector("tc-lineage-graph")!;
    cell(el, "c1").click();
    el.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
    await act(async () => settle());
    expect(picks).toEqual(["c1"]);
    expect(el.selected).toBe("q1");
    expect(el.view).toBe("graph");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look or view (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-lineage-graph heading="Standard graph" .nodes=${NODES} .edges=${EDGES} selected="k1"></tc-lineage-graph>
        <tc-lineage-graph look="clean" heading="Clean graph" .nodes=${NODES} .edges=${EDGES}></tc-lineage-graph>
        <tc-lineage-graph heading="Standard chain" view="chain" .nodes=${NODES} .edges=${EDGES} selected="c2"></tc-lineage-graph>
        <tc-lineage-graph look="clean" heading="Clean chain" view="chain" .nodes=${NODES} .edges=${EDGES}></tc-lineage-graph>
        <tc-lineage-graph heading="Empty" .nodes=${[]}></tc-lineage-graph>
      </div>`);
      cell(wrap, "c1").focus();
      await wait(600);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

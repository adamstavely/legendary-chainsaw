/*
 * <tc-workflow-canvas> in real browsers: step cards with kind, status and where they lead, connectors and their labels,
 * the flowing connector into a running step, selecting, moving and connecting with the pointer and the keyboard,
 * removing, adding, zoom, the list view, read-only use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/workflow-canvas";
import {
  workflowEdgePath,
  type TcWorkflowCanvas,
  type WorkflowAddRequest,
  type WorkflowEdge,
  type WorkflowEdgesChange,
  type WorkflowNode,
  type WorkflowNodesChange,
  type WorkflowSelectedChange,
} from "../../src/elements/workflow-canvas";
import { WorkflowCanvas } from "../../src/elements/react/workflow-canvas";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

/** received → extract → amount → approve | post · approve → post */
const NODES: WorkflowNode[] = [
  { id: "received", kind: "trigger", title: "Invoice received", x: 0, y: 100, status: "done" },
  { id: "extract", kind: "llm", title: "Extract fields", summary: "Vendor, amount", x: 240, y: 100, status: "done" },
  { id: "amount", kind: "condition", title: "Amount over 10k?", x: 480, y: 100, status: "running" },
  { id: "approve", kind: "approval", title: "Manager approval", x: 720, y: 0 },
  { id: "post", kind: "output", title: "Post to ledger", x: 720, y: 200 },
];
const EDGES: WorkflowEdge[] = [
  { from: "received", to: "extract" },
  { from: "extract", to: "amount" },
  { from: "amount", to: "approve", label: "over 10k" },
  { from: "amount", to: "post", label: "10k or less" },
  { from: "approve", to: "post" },
];

const node = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-wfc__node[data-node="${id}"]`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, composed: true, ...init }));
const centre = (target: Element) => {
  const r = target.getBoundingClientRect();
  return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
};
const pointer = (target: Element, type: string, at: { clientX: number; clientY: number }) =>
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 7, button: 0, isPrimary: true, ...at }));
const make = (look: "standard" | "clean" = "standard", extra: { readonly?: boolean; selected?: string | null } = {}) =>
  fixture<TcWorkflowCanvas>(
    html`<div style="width: 1200px"><tc-workflow-canvas look=${look} heading="Invoice approval" description="Inbox to ledger." .nodes=${NODES} .edges=${EDGES} .selected=${extra.selected ?? null} ?readonly=${extra.readonly}></tc-workflow-canvas></div>`,
  ).then(async (w) => {
    const el = w.querySelector("tc-workflow-canvas")!;
    // Fitted once the canvas has a size
    await expect.poll(() => el.querySelector<HTMLElement>(".ui-wfc__layer")?.style.transform ?? "").not.toBe("translate(32px, 32px) scale(1)");
    await settle();
    return el;
  });

describe("tc-workflow-canvas", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a card per step with its kind, status and where it leads; one tab stop; a toolbar and a named canvas`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("wfc");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelectorAll(".ui-wfc__node")).toHaveLength(5);
      const canvas = el.querySelector(".ui-wfc__viewport")!;
      expect(canvas.getAttribute("role")).toBe("group");
      expect(document.getElementById(canvas.getAttribute("aria-labelledby")!)!.textContent).toBe("Invoice approval");
      expect(el.querySelectorAll('.ui-wfc__node[tabindex="0"]')).toHaveLength(1);
      expect(node(el, "received").getAttribute("tabindex")).toBe("0");
      expect(el.querySelector('[role="toolbar"]')!.getAttribute("aria-label")).toBe("Workflow");
      const amount = node(el, "amount");
      expect(amount.querySelector(".ui-wfc__node-kind")!.textContent).toBe("Condition");
      expect(amount.querySelector(".ui-wfc__status")!.textContent!.trim()).toBe("Running");
      expect(amount.textContent).toContain("Leads to Manager approval (over 10k), Post to ledger (10k or less)");
      expect(node(el, "post").textContent).toContain("Last step");
      expect(node(el, "extract").querySelector(".ui-wfc__node-summary")!.textContent).toBe("Vendor, amount");
      // No status before a run: no status line
      expect(node(el, "approve").querySelector(".ui-wfc__status")).toBeNull();
      expect(el.querySelector(".tc-head__aside")!.textContent!.trim()).toBe("Running");
    });
  }

  test("connectors: one per edge with arrowheads and labels; the one into the running step flows", async () => {
    const el = await make();
    const edges = el.querySelectorAll<SVGPathElement>(".ui-wfc__edge");
    expect(edges).toHaveLength(5);
    const into = el.querySelector<SVGPathElement>('.ui-wfc__edge[data-from="extract"][data-to="amount"]')!;
    expect(into.hasAttribute("data-flow")).toBe(true);
    expect(el.querySelector('.ui-wfc__edge[data-from="received"]')!.hasAttribute("data-done")).toBe(true);
    expect(into.getAttribute("d")).toBe(workflowEdgePath(NODES[1], NODES[2]).d);
    expect(into.getAttribute("marker-end")).toMatch(/^url\(#tc-wfc-\d+-arrow-on\)$/);
    expect([...el.querySelectorAll(".ui-wfc__edge-label")].map((l) => l.textContent)).toEqual(["over 10k", "10k or less"]);
    expect(el.querySelector(".ui-wfc__edges")!.getAttribute("aria-hidden")).toBe("true");
  });

  test("click or Enter selects a step and says so; Escape clears; preventDefault() keeps the selection", async () => {
    const el = await make();
    const seen: WorkflowSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<WorkflowSelectedChange>).detail));
    const vp = el.querySelector(".ui-wfc__viewport")!;
    const at = centre(node(el, "extract"));
    pointer(node(el, "extract"), "pointerdown", at);
    pointer(vp, "pointerup", at);
    await settle();
    expect(el.selected).toBe("extract");
    expect(node(el, "extract").getAttribute("aria-pressed")).toBe("true");
    expect(seen[0].node!.title).toBe("Extract fields");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Selected Extract fields");
    // Selected steps' connectors stand out
    expect(el.querySelector('.ui-wfc__edge[data-from="extract"]')!.hasAttribute("data-on")).toBe(true);
    key(node(el, "post"), "Enter");
    await settle();
    expect(el.selected).toBe("post");
    key(node(el, "post"), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    key(node(el, "post"), "Enter");
    await settle();
    expect(el.selected).toBeNull();
  });

  test("arrow keys move to the nearest step in that direction; Home / End to the ends", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-node");
    node(el, "received").focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await settle();
    };
    await press("ArrowRight");
    expect(at()).toBe("extract");
    await press("ArrowRight");
    expect(at()).toBe("amount");
    await press("ArrowRight");
    expect(["approve", "post"]).toContain(at());
    await press("ArrowDown");
    expect(at()).toBe("post");
    await press("ArrowUp");
    expect(at()).toBe("approve");
    await press("Home");
    expect(at()).toBe("received");
    await press("End");
    expect(at()).toBe("post");
    expect(node(el, "post").getAttribute("tabindex")).toBe("0");
  });

  test("M moves a step from the keyboard – arrows 8 px, Shift 32 px – Enter keeps it, Escape puts it back", async () => {
    const el = await make();
    const moves: WorkflowNodesChange[] = [];
    el.addEventListener("tc-nodes-change", (e) => moves.push((e as CustomEvent<WorkflowNodesChange>).detail));
    node(el, "post").focus();
    key(node(el, "post"), "m");
    await settle();
    expect(el.selected).toBe("post");
    expect(node(el, "post").hasAttribute("data-moving")).toBe(true);
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^Moving Post to ledger/);
    key(node(el, "post"), "ArrowRight");
    key(node(el, "post"), "ArrowRight");
    key(node(el, "post"), "ArrowDown", { shiftKey: true });
    await settle();
    expect(node(el, "post").style.left).toBe("736px");
    expect(node(el, "post").style.top).toBe("232px");
    key(node(el, "post"), "Enter");
    await settle();
    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({ reason: "move", id: "post" });
    expect(moves[0].nodes.find((n) => n.id === "post")).toMatchObject({ x: 736, y: 232 });
    expect(el.nodes.find((n) => n.id === "post")).toMatchObject({ x: 736, y: 232 });
    // Escape puts it back, with no change
    key(node(el, "post"), "m");
    key(node(el, "post"), "ArrowLeft");
    await settle();
    key(node(el, "post"), "Escape");
    await settle();
    expect(node(el, "post").style.left).toBe("736px");
    expect(moves).toHaveLength(1);
  });

  test("dragging a step moves it by the pointer's distance at the canvas's zoom; preventDefault() puts it back", async () => {
    const el = await make();
    const zoom = Number(el.querySelector<HTMLElement>(".ui-wfc__layer")!.style.transform.match(/scale\(([\d.]+)\)/)![1]);
    const vp = el.querySelector(".ui-wfc__viewport")!;
    const start = centre(node(el, "approve"));
    const moves: WorkflowNodesChange[] = [];
    el.addEventListener("tc-nodes-change", (e) => moves.push((e as CustomEvent<WorkflowNodesChange>).detail));
    pointer(node(el, "approve"), "pointerdown", start);
    pointer(vp, "pointermove", { clientX: start.clientX + 40, clientY: start.clientY + 20 });
    await settle();
    expect(node(el, "approve").hasAttribute("data-moving")).toBe(true);
    pointer(vp, "pointerup", { clientX: start.clientX + 40, clientY: start.clientY + 20 });
    await settle();
    const moved = moves[0].nodes.find((n) => n.id === "approve")!;
    expect(moved.x).toBe(Math.round(720 + 40 / zoom));
    expect(moved.y).toBe(Math.round(20 / zoom));
    // A drag isn't a click: nothing was selected
    expect(el.selected).toBeNull();
    el.addEventListener("tc-nodes-change", (e) => e.preventDefault());
    const before = node(el, "approve").style.left;
    const s2 = centre(node(el, "approve"));
    pointer(node(el, "approve"), "pointerdown", s2);
    pointer(vp, "pointermove", { clientX: s2.clientX + 60, clientY: s2.clientY });
    pointer(vp, "pointerup", { clientX: s2.clientX + 60, clientY: s2.clientY });
    await settle();
    expect(node(el, "approve").style.left).toBe(before);
  });

  test("dragging from a step's port onto another step connects them", async () => {
    const el = await make();
    const seen: WorkflowEdgesChange[] = [];
    el.addEventListener("tc-edges-change", (e) => seen.push((e as CustomEvent<WorkflowEdgesChange>).detail));
    const vp = el.querySelector(".ui-wfc__viewport")!;
    const port = el.querySelector('.ui-wfc__port[data-port="received"]')!;
    expect(port.getAttribute("aria-hidden")).toBe("true");
    pointer(port, "pointerdown", centre(port));
    const target = centre(node(el, "post"));
    pointer(vp, "pointermove", target);
    await settle();
    expect(el.querySelector(".ui-wfc__edge[data-linking]")).toBeTruthy();
    pointer(vp, "pointerup", target);
    await settle();
    expect(seen[0]).toMatchObject({ reason: "connect", edge: { from: "received", to: "post" } });
    expect(el.querySelector('.ui-wfc__edge[data-from="received"][data-to="post"]')).toBeTruthy();
    expect(el.querySelector(".ui-wfc__edge[data-linking]")).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Connected Invoice received to Post to ledger");
  });

  test("C opens “Connect … to”: checkable steps, Enter connects or disconnects, Escape closes back to the step", async () => {
    const el = await make();
    node(el, "approve").focus();
    key(node(el, "approve"), "c");
    await settle();
    const menu = el.querySelector('[role="menu"]')!;
    expect(menu.getAttribute("aria-label")).toBe("Connect Manager approval to");
    const items = [...menu.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]')];
    expect(items.map((i) => i.textContent!.trim())).toEqual(["Invoice received", "Extract fields", "Amount over 10k?", "Post to ledger"]);
    expect(items.map((i) => i.getAttribute("aria-checked"))).toEqual(["false", "false", "false", "true"]);
    await expect.poll(() => document.activeElement).toBe(items[0]);
    key(items[0], "End");
    await settle();
    expect(document.activeElement?.textContent?.trim()).toBe("Post to ledger");
    (document.activeElement as HTMLElement).click();
    await settle();
    expect(el.edges.some((e) => e.from === "approve" && e.to === "post")).toBe(false);
    expect(el.querySelector('[role="menu"]')).toBeNull();
    await expect.poll(() => document.activeElement).toBe(node(el, "approve"));
    key(node(el, "approve"), "c");
    await settle();
    key(el.querySelector('[role="menuitemcheckbox"]')!, "Escape");
    await settle();
    expect(el.querySelector('[role="menu"]')).toBeNull();
    await expect.poll(() => document.activeElement).toBe(node(el, "approve"));
  });

  test("Delete removes a step and its connectors and moves focus on; A and Add step ask for a new step", async () => {
    const el = await make();
    const nodes: WorkflowNodesChange[] = [];
    const edges: WorkflowEdgesChange[] = [];
    const adds: WorkflowAddRequest[] = [];
    el.addEventListener("tc-nodes-change", (e) => nodes.push((e as CustomEvent<WorkflowNodesChange>).detail));
    el.addEventListener("tc-edges-change", (e) => edges.push((e as CustomEvent<WorkflowEdgesChange>).detail));
    el.addEventListener("tc-add-request", (e) => adds.push((e as CustomEvent<WorkflowAddRequest>).detail));
    node(el, "amount").focus();
    key(node(el, "amount"), "a");
    expect(adds).toEqual([{ after: "amount" }]);
    key(node(el, "amount"), "Delete");
    await settle();
    expect(nodes[0]).toMatchObject({ reason: "remove", id: "amount" });
    expect(el.nodes.map((n) => n.id)).toEqual(["received", "extract", "approve", "post"]);
    expect(edges[0].reason).toBe("remove");
    expect(el.edges).toEqual([{ from: "received", to: "extract" }, { from: "approve", to: "post" }]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Removed Amount over 10k?");
    await expect.poll(() => document.activeElement?.getAttribute("data-node")).toBe("approve");
    // The toolbar's Add step asks after the selected step
    key(node(el, "approve"), "Enter");
    await settle();
    el.querySelector<HTMLButtonElement>('[data-tool="add"]')!.click();
    expect(adds.at(-1)).toEqual({ after: "approve" });
    // preventDefault() keeps the step
    el.addEventListener("tc-nodes-change", (e) => e.preventDefault());
    key(node(el, "approve"), "Backspace");
    await settle();
    expect(el.nodes).toHaveLength(4);
  });

  test("narrow: Fit stops at 75% so step titles stay readable, and a workflow too wide starts at its first step", async () => {
    const w = await fixture<HTMLElement>(
      html`<div style="width: 360px"><tc-workflow-canvas heading="Invoice approval" .nodes=${NODES} .edges=${EDGES}></tc-workflow-canvas></div>`,
    );
    const el = w.querySelector("tc-workflow-canvas")!;
    const pct = () => parseInt(el.querySelector(".ui-wfc__zoom")!.textContent!);
    await expect.poll(() => el.querySelector<HTMLElement>(".ui-wfc__layer")?.style.transform ?? "").not.toBe("translate(32px, 32px) scale(1)");
    await settle();
    expect(pct()).toBeGreaterThanOrEqual(75);
    const box = el.querySelector(".ui-wfc__viewport")!.getBoundingClientRect();
    const first = [...el.querySelectorAll(".ui-wfc__node")].map((n) => n.getBoundingClientRect()).sort((a, b) => a.left - b.left)[0];
    expect(first.left).toBeGreaterThanOrEqual(box.left - 1);
    expect(first.left).toBeLessThan(box.left + 64);
  });

  test("zoom: the buttons and + / − / 0 on the canvas change the zoom, shown as a percentage; Fit frames every step", async () => {
    const el = await make();
    const pct = () => el.querySelector(".ui-wfc__zoom")!.textContent;
    const start = pct();
    el.querySelector<HTMLButtonElement>('[data-tool="zoom-in"]')!.click();
    await settle();
    expect(pct()).not.toBe(start);
    expect(el.querySelector('[role="status"]')!.textContent).toBe(`Zoom ${pct()}`);
    const vp = el.querySelector<HTMLElement>(".ui-wfc__viewport")!;
    vp.focus();
    key(vp, "-");
    key(vp, "-");
    await settle();
    expect(parseInt(pct()!)).toBeLessThan(parseInt(start!));
    key(vp, "0");
    await settle();
    expect(pct()).toBe(start);
    // Arrow keys on the canvas pan it
    const before = el.querySelector<HTMLElement>(".ui-wfc__layer")!.style.transform;
    key(vp, "ArrowLeft");
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-wfc__layer")!.style.transform).not.toBe(before);
    // Every step is inside the canvas once fitted
    const box = vp.getBoundingClientRect();
    for (const n of el.querySelectorAll(".ui-wfc__node")) {
      const r = n.getBoundingClientRect();
      expect(r.left).toBeGreaterThanOrEqual(box.left - 1);
      expect(r.right).toBeLessThanOrEqual(box.right + 1);
    }
  });

  test("the list view: the same steps numbered, with where each leads; tc-view-change; toolbar arrows move between buttons", async () => {
    const el = await make();
    const views: string[] = [];
    el.addEventListener("tc-view-change", (e) => views.push((e as CustomEvent<{ view: string }>).detail.view));
    const list = el.querySelector<HTMLButtonElement>('[data-tool="list"]')!;
    expect(list.getAttribute("aria-pressed")).toBe("false");
    list.click();
    await settle();
    expect(views).toEqual(["list"]);
    expect(el.view).toBe("list");
    expect(el.querySelector(".ui-wfc__viewport")).toBeNull();
    const rows = [...el.querySelectorAll(".ui-wfc__row")];
    expect(rows).toHaveLength(5);
    expect(rows[2].querySelector(".ui-wfc__row-meta")!.textContent).toBe("Condition → Manager approval (over 10k), Post to ledger (10k or less)");
    expect(rows[4].querySelector(".ui-wfc__row-meta")!.textContent).toBe("Output · Last step");
    key(rows[0], "ArrowDown");
    await settle();
    expect(document.activeElement).toBe(rows[1]);
    // The toolbar is one tab stop with arrow keys; disabled buttons are skipped
    const tools = [...el.querySelectorAll<HTMLButtonElement>(".ui-wfc__tools button:not([disabled])")];
    tools[0].focus();
    key(tools[0], "ArrowLeft");
    await settle();
    expect(document.activeElement).toBe(tools.at(-1));
    expect(el.querySelectorAll('.ui-wfc__tools button[tabindex="0"]')).toHaveLength(1);
  });

  test("read-only: no ports and no editing tools; M, C and Delete do nothing", async () => {
    const el = await make("standard", { readonly: true });
    expect(el.querySelector(".ui-wfc__port")).toBeNull();
    expect([...el.querySelectorAll<HTMLElement>(".ui-wfc__tool")].map((t) => t.dataset.tool)).toEqual(["zoom-out", "zoom-in", "fit", "list"]);
    node(el, "post").focus();
    key(node(el, "post"), "Delete");
    key(node(el, "post"), "c");
    await settle();
    expect(el.nodes).toHaveLength(5);
    expect(el.querySelector('[role="menu"]')).toBeNull();
  });

  test("an empty canvas offers the first step; steps going away clear the selection", async () => {
    const el = await fixture<TcWorkflowCanvas>(html`<tc-workflow-canvas></tc-workflow-canvas>`);
    const adds: WorkflowAddRequest[] = [];
    el.addEventListener("tc-add-request", (e) => adds.push((e as CustomEvent<WorkflowAddRequest>).detail));
    expect(el.querySelector(".ui-wfc__empty")!.textContent).toContain("No steps yet.");
    el.querySelector<HTMLButtonElement>(".ui-wfc__first")!.click();
    expect(adds).toEqual([{ after: null }]);
    const full = await make("standard", { selected: "post" });
    full.nodes = NODES.filter((n) => n.id !== "post");
    await settle();
    expect(full.selected).toBeNull();
  });

  test("React wrapper: uncontrolled steps keep a move across parent re-renders; a controlled selection waits for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    host.style.width = "1200px";
    document.body.append(host);
    const root = createRoot(host);
    const moved: string[] = [];
    const asked: (string | null)[] = [];
    const adds: (string | null)[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(WorkflowCanvas, {
        title: "Flow",
        defaultNodes: NODES,
        defaultEdges: EDGES,
        selected: null,
        onSelectedChange: (s) => void asked.push(s),
        onNodesChange: (_ns, d) => void moved.push(d.id),
        onAddRequest: (after) => void adds.push(after),
        "data-n": n,
      } as React.ComponentProps<typeof WorkflowCanvas>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-workflow-canvas")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Flow");
    node(el, "post").focus();
    key(node(el, "post"), "Enter");
    await settle();
    expect(asked).toEqual(["post"]);
    expect(el.selected).toBeNull();
    key(node(el, "post"), "Delete");
    await settle();
    await act(async () => bump());
    await settle();
    expect(moved).toEqual(["post"]);
    expect(el.nodes).toHaveLength(4);
    node(el, "approve").focus();
    key(node(el, "approve"), "a");
    expect(adds).toEqual(["approve"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, on the canvas and in the list`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 1100px; background: var(--tc-surface-base)">
        <tc-workflow-canvas description="Inbox to ledger." .nodes=${NODES} .edges=${EDGES} .selected=${"amount"}></tc-workflow-canvas>
        <tc-workflow-canvas look="clean" view="list" .nodes=${NODES} .edges=${EDGES}></tc-workflow-canvas>
        <tc-workflow-canvas look="clean"></tc-workflow-canvas>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

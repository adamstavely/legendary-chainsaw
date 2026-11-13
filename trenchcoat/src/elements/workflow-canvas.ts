import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-workflow-canvas> – an agent workflow drawn as a node graph: each step a compact card (its kind's icon, the kind,
 * the title, a one-line summary and its run status in a mark and a word), joined by curved connectors with arrowheads
 * and optional labels ("amount > 10k"). While a run is in flight the steps colour by status and the connector into
 * the running step flows.
 *   · pan by dragging the background, or with the arrow keys while the canvas itself has focus; zoom with the buttons,
 *     + / − / 0 on the canvas, or Ctrl/⌘ + wheel; Fit frames every step
 *   · steps are one tab stop: arrow keys move to the nearest step in that direction, Enter selects, M starts moving the
 *     selected step (arrows 8 px, Shift 32 px, Enter keeps, Escape puts it back), C opens "Connect to…", A asks the page
 *     for a step after it (tc-add-request), Delete removes it with its connectors
 *   · with a pointer: drag a step to move it, drag from its output port (the dot on its right edge) onto another step
 *     to connect them
 *   · the same graph as a list of steps and where each leads ("Condition → Manager approval, Post to ledger") – the
 *     List button, or every step's own description, for screen readers and narrow screens
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-workflow-canvas .nodes=${[{ id: "a", kind: "trigger", title: "Invoice received", x: 0, y: 80 }, …]}
 *     .edges=${[{ from: "a", to: "b" }]} @tc-add-request=${(e) => openPicker(e.detail.after)}></tc-workflow-canvas>
 */

export type WorkflowKind = "trigger" | "llm" | "tool" | "condition" | "approval" | "output" | (string & {});
export type WorkflowStatus = "idle" | "running" | "done" | "failed" | "skipped";
export type WorkflowNode = {
  id: string;
  kind: WorkflowKind;
  title: string;
  /** Position on the canvas, px at 100% zoom – the card's top-left corner */
  x: number;
  y: number;
  /** Run status; leave it out before a run */
  status?: WorkflowStatus;
  /** One quiet line under the title: what the step does, or what it found */
  summary?: string;
};
export type WorkflowEdge = { from: string; to: string; label?: string };
export type WorkflowView = "canvas" | "list";

/** Details of the events */
export type WorkflowNodesChange = { nodes: WorkflowNode[]; reason: "move" | "remove"; id: string };
export type WorkflowEdgesChange = { edges: WorkflowEdge[]; reason: "connect" | "disconnect" | "remove"; edge?: WorkflowEdge };
export type WorkflowSelectedChange = { selected: string | null; node: WorkflowNode | null };
export type WorkflowAddRequest = { after: string | null };
export type WorkflowViewChange = { view: WorkflowView };

/** A step card's size on the canvas, px at 100% zoom – connectors leave and arrive at its vertical middle */
export const WORKFLOW_NODE_W = 196;
export const WORKFLOW_NODE_H = 76;
const MIN_ZOOM = 0.4;
/** Fit never zooms out further than this: below it, step titles get too small to read */
const FIT_MIN = 0.75;
const MAX_ZOOM = 2;
const PAD = 32;

/* ---------- Kinds and their icons: Lucide (ISC, lucide.dev) ---------- */

export type WorkflowKindInfo = { label: string; icon: TemplateResult };
export const defaultWorkflowKinds: Record<string, WorkflowKindInfo> = {
  trigger: {
    label: "Trigger",
    icon: svg`<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>`,
  },
  llm: {
    label: "AI",
    icon: svg`<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"></path>`,
  },
  tool: {
    label: "Tool",
    icon: svg`<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>`,
  },
  condition: {
    label: "Condition",
    icon: svg`<path d="M16 3h5v5"></path><path d="M8 3H3v5"></path><path d="M12 22v-8.3a4 4 0 0 0-1.17-2.87L3 3"></path><path d="m15 9 6-6"></path>`,
  },
  approval: {
    label: "Approval",
    icon: svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="m16 11 2 2 4-4"></path>`,
  },
  output: {
    label: "Output",
    icon: svg`<path d="M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.63l-19 6.5a.5.5 0 0 0-.02.93l7.93 3.18a2 2 0 0 1 1.11 1.11z"></path><path d="m21.85 2.15-10.94 10.94"></path>`,
  },
};
/** A box – for kinds the page names without an icon */
const boxIcon = svg`<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path>`;

/** A kind's label and icon: the page's own first, then the defaults, then the kind itself and a box */
export function workflowKind(kind: string, kinds: Record<string, Partial<WorkflowKindInfo>> = {}): WorkflowKindInfo {
  const own = kinds[kind] ?? {};
  const base = defaultWorkflowKinds[kind];
  return { label: own.label ?? base?.label ?? kind.charAt(0).toUpperCase() + kind.slice(1), icon: own.icon ?? base?.icon ?? boxIcon };
}

/** The kind's icon as a 24×24 stroked SVG */
export const workflowKindIcon = (kind: string, kinds?: Record<string, Partial<WorkflowKindInfo>>) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${workflowKind(kind, kinds).icon}</svg>`;

export const defaultWorkflowStatusLabels: Record<WorkflowStatus, string> = { idle: "Not run", running: "Running", done: "Done", failed: "Failed", skipped: "Skipped" };

/** The connector from one card's right edge to the next card's left edge, as an SVG path, and its middle */
export function workflowEdgePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const x1 = from.x + WORKFLOW_NODE_W;
  const y1 = from.y + WORKFLOW_NODE_H / 2;
  const x2 = to.x;
  const y2 = to.y + WORKFLOW_NODE_H / 2;
  // A connector that runs backwards loops out wider, so it doesn't cut through the cards
  const bend = x2 >= x1 ? Math.max(28, (x2 - x1) / 2) : Math.max(60, (x1 - x2) / 2);
  const f = (n: number) => n.toFixed(1);
  return { d: `M${f(x1)} ${f(y1)}C${f(x1 + bend)} ${f(y1)} ${f(x2 - bend)} ${f(y2)} ${f(x2)} ${f(y2)}`, mid: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 } };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const icon = (d: TemplateResult) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const icons = {
  head: svg`<rect width="8" height="8" x="3" y="3" rx="2"></rect><path d="M7 11v4a2 2 0 0 0 2 2h4"></path><rect width="8" height="8" x="13" y="13" rx="2"></rect>`,
  zoomIn: svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path><path d="M11 8v6"></path><path d="M8 11h6"></path>`,
  zoomOut: svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path><path d="M8 11h6"></path>`,
  fit: svg`<path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>`,
  add: svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`,
  link: svg`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>`,
  move: svg`<path d="M12 2v20"></path><path d="m15 19-3 3-3-3"></path><path d="m19 9 3 3-3 3"></path><path d="M2 12h20"></path><path d="m5 9-3 3 3 3"></path><path d="m9 5 3-3 3 3"></path>`,
  remove: svg`<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>`,
  list: svg`<path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path><path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path>`,
};
const statusMarks: Record<WorkflowStatus, TemplateResult> = {
  idle: svg`<circle cx="12" cy="12" r="5"></circle>`,
  running: svg`<circle cx="12" cy="12" r="5" fill="currentColor"></circle>`,
  done: svg`<path d="M20 6 9 17l-5-5"></path>`,
  failed: svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`,
  skipped: svg`<path d="M5 12h14"></path>`,
};

let uidCount = 0;

type Point = { x: number; y: number };
type Drag =
  | { mode: "node"; id: string; start: Point; origin: Point; moved: boolean; pointer: number }
  | { mode: "pan"; start: Point; origin: Point; pointer: number }
  | { mode: "link"; from: string; at: Point; pointer: number };

/**
 * An agent workflow as a node graph – step cards joined by connectors, panned, zoomed, edited with the pointer or
 * the keyboard, and coloured by status while it runs.
 * @tag tc-workflow-canvas
 * @fires tc-nodes-change - A step was moved or removed ({ nodes, reason, id }: WorkflowNodesChange); cancelable – prevented, `nodes` stays as it was
 * @fires tc-edges-change - Steps were connected or disconnected, or a removed step took its connectors ({ edges, reason, edge }: WorkflowEdgesChange); cancelable – prevented, `edges` stays as it was
 * @fires tc-selected-change - A step was selected or the selection cleared ({ selected, node }: WorkflowSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-add-request - Add step was asked for, after the given step or at the start ({ after }: WorkflowAddRequest) – the page opens a step picker
 * @fires tc-view-change - The canvas or the list was chosen ({ view }: WorkflowViewChange); cancelable – prevented, `view` stays as it was
 */
export class TcWorkflowCanvas extends TcElement {
  static override ui = "wfc";

  /** The heading */
  @property() accessor heading = "Workflow";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The steps, each with its position on the canvas */
  @property({ attribute: false }) accessor nodes: WorkflowNode[] = [];
  /** The connectors between steps */
  @property({ attribute: false }) accessor edges: WorkflowEdge[] = [];
  /** The selected step. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: string | null = null;
  /** "canvas" (the default) or "list" – the same steps as a list. Changed by the user unless prevented */
  @property({ reflect: true }) accessor view: WorkflowView = "canvas";
  /** Watching only: no moving, connecting, adding or removing */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;
  /** Labels and icons for kinds, merged over the defaults (trigger, llm, tool, condition, approval, output) */
  @property({ attribute: false }) accessor kinds: Record<string, Partial<WorkflowKindInfo>> = {};
  /** Words for each run status, merged over `defaultWorkflowStatusLabels` */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<WorkflowStatus, string>> = {};

  @state() private accessor zoom = 1;
  @state() private accessor pan: Point = { x: PAD, y: PAD };
  @state() private accessor size = { w: 0, h: 0 };
  /** A step's position while it's dragged or moved from the keyboard, before the change is kept */
  @state() private accessor draft: { id: string; x: number; y: number; origin: Point; keys: boolean } | null = null;
  @state() private accessor linking: { from: string; at: Point } | null = null;
  @state() private accessor active: string | null = null;
  @state() private accessor menu: { for: string; from: "node" | "tool" } | null = null;
  @state() private accessor menuIndex = 0;
  @state() private accessor tool = 0;
  @state() private accessor announce = "";

  private uid = `tc-wfc-${++uidCount}`;
  private observer: ResizeObserver | undefined;
  private fitted = false;
  private drag: Drag | null = null;

  /* ---------- The model ---------- */

  private get labels() {
    return { ...defaultWorkflowStatusLabels, ...this.statusLabels };
  }
  private node(id: string | null | undefined) {
    return id ? (this.nodes.find((n) => n.id === id) ?? null) : null;
  }
  private pos(n: WorkflowNode): Point {
    return this.draft?.id === n.id ? { x: this.draft.x, y: this.draft.y } : { x: n.x, y: n.y };
  }
  /** Connectors between steps that exist */
  private get links() {
    const ids = new Set(this.nodes.map((n) => n.id));
    return this.edges.filter((e) => ids.has(e.from) && ids.has(e.to) && e.from !== e.to);
  }
  private next(id: string) {
    return this.links.filter((e) => e.from === id);
  }
  private leadsTo(id: string) {
    return this.next(id)
      .map((e) => `${this.node(e.to)!.title}${e.label ? ` (${e.label})` : ""}`)
      .join(", ");
  }
  private bounds() {
    if (!this.nodes.length) return { x: 0, y: 0, w: 0, h: 0 };
    const xs = this.nodes.map((n) => this.pos(n).x);
    const ys = this.nodes.map((n) => this.pos(n).y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) + WORKFLOW_NODE_W - x, h: Math.max(...ys) + WORKFLOW_NODE_H - y };
  }

  /* ---------- Changes ---------- */

  private setSelected(next: string | null) {
    if (next === this.selected) return true;
    if (!this.emit<WorkflowSelectedChange>("tc-selected-change", { selected: next, node: this.node(next) }, { cancelable: true })) return false;
    this.selected = next;
    this.announce = next ? `Selected ${this.node(next)!.title}` : "Selection cleared";
    return true;
  }
  private setView(view: WorkflowView) {
    if (view === this.view || !this.emit<WorkflowViewChange>("tc-view-change", { view }, { cancelable: true })) return;
    this.view = view;
    this.menu = null;
  }
  /** Keeps a moved step's new place, unless the page prevents it */
  private commitMove() {
    const d = this.draft;
    this.draft = null;
    if (!d || (d.x === d.origin.x && d.y === d.origin.y)) return;
    const nodes = this.nodes.map((n) => (n.id === d.id ? { ...n, x: Math.round(d.x), y: Math.round(d.y) } : n));
    if (!this.emit<WorkflowNodesChange>("tc-nodes-change", { nodes, reason: "move", id: d.id }, { cancelable: true })) return;
    this.nodes = nodes;
    this.announce = `Moved ${this.node(d.id)?.title}`;
  }
  private removeStep(id: string) {
    const n = this.node(id);
    if (!n || this.readonly) return;
    const nodes = this.nodes.filter((x) => x.id !== id);
    if (!this.emit<WorkflowNodesChange>("tc-nodes-change", { nodes, reason: "remove", id }, { cancelable: true })) return;
    // The step's place in the tab order goes to a neighbour, so focus doesn't fall to the page
    const i = this.nodes.indexOf(n);
    this.nodes = nodes;
    const edges = this.edges.filter((e) => e.from !== id && e.to !== id);
    if (edges.length !== this.edges.length && this.emit<WorkflowEdgesChange>("tc-edges-change", { edges, reason: "remove" }, { cancelable: true })) this.edges = edges;
    if (this.selected === id) this.setSelected(null);
    this.menu = null;
    this.announce = `Removed ${n.title}`;
    const neighbour = nodes[Math.min(i, nodes.length - 1)];
    if (neighbour) this.focusNode(neighbour.id);
  }
  private toggleEdge(from: string, to: string) {
    if (this.readonly || from === to) return;
    const has = this.edges.find((e) => e.from === from && e.to === to);
    const edge = has ?? { from, to };
    const edges = has ? this.edges.filter((e) => e !== has) : [...this.edges, edge];
    const reason = has ? "disconnect" : "connect";
    if (!this.emit<WorkflowEdgesChange>("tc-edges-change", { edges, reason, edge }, { cancelable: true })) return;
    this.edges = edges;
    this.announce = `${has ? "Disconnected" : "Connected"} ${this.node(from)?.title} ${has ? "from" : "to"} ${this.node(to)?.title}`;
  }
  private requestAdd(after: string | null) {
    if (this.readonly) return;
    this.emit<WorkflowAddRequest>("tc-add-request", { after });
  }

  /* ---------- Zoom and pan ---------- */

  private setZoom(next: number, around?: Point) {
    const z = clamp(Math.round(next * 100) / 100, MIN_ZOOM, MAX_ZOOM);
    if (z === this.zoom) return;
    // Keep the point under the pointer (or the middle of the canvas) where it is
    const at = around ?? { x: this.size.w / 2, y: this.size.h / 2 };
    const wx = (at.x - this.pan.x) / this.zoom;
    const wy = (at.y - this.pan.y) / this.zoom;
    this.pan = { x: at.x - wx * z, y: at.y - wy * z };
    this.zoom = z;
    this.announce = `Zoom ${Math.round(z * 100)}%`;
  }
  /** Frames every step, never zooming past 100% or below FIT_MIN so step cards stay readable; a workflow too big for
   * that starts at its first step, and the rest is a pan away */
  fit() {
    const b = this.bounds();
    if (!b.w || !this.size.w) return;
    const z = clamp(Math.min((this.size.w - PAD * 2) / b.w, (this.size.h - PAD * 2) / b.h, 1), FIT_MIN, MAX_ZOOM);
    this.zoom = Math.round(z * 100) / 100;
    const fitsX = b.w * this.zoom <= this.size.w - PAD * 2;
    const fitsY = b.h * this.zoom <= this.size.h - PAD * 2;
    this.pan = {
      x: fitsX ? (this.size.w - b.w * this.zoom) / 2 - b.x * this.zoom : PAD - b.x * this.zoom,
      y: fitsY ? (this.size.h - b.h * this.zoom) / 2 - b.y * this.zoom : PAD - b.y * this.zoom,
    };
  }
  /** A pointer position in canvas coordinates */
  private toCanvas(e: { clientX: number; clientY: number }): Point {
    const r = this.viewport?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (e.clientX - r.left - this.pan.x) / this.zoom, y: (e.clientY - r.top - this.pan.y) / this.zoom };
  }
  private get viewport() {
    return this.querySelector<HTMLElement>(".ui-wfc__viewport");
  }
  private onWheel = (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const r = this.viewport!.getBoundingClientRect();
    this.setZoom(this.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), { x: e.clientX - r.left, y: e.clientY - r.top });
  };

  /* ---------- Pointer ---------- */

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || this.view !== "canvas") return;
    const target = e.target as HTMLElement;
    const port = target.closest<HTMLElement>("[data-port]");
    const card = target.closest<HTMLElement>("[data-node]");
    const vp = this.viewport!;
    if (port && !this.readonly) {
      e.preventDefault();
      this.drag = { mode: "link", from: port.dataset.port!, at: this.toCanvas(e), pointer: e.pointerId };
      this.linking = { from: port.dataset.port!, at: this.toCanvas(e) };
    } else if (card) {
      const n = this.node(card.dataset.node)!;
      this.drag = { mode: "node", id: n.id, start: { x: e.clientX, y: e.clientY }, origin: { x: n.x, y: n.y }, moved: false, pointer: e.pointerId };
    } else if (target.closest(".ui-wfc__viewport")) {
      this.drag = { mode: "pan", start: { x: e.clientX, y: e.clientY }, origin: { ...this.pan }, pointer: e.pointerId };
    } else return;
    try {
      vp.setPointerCapture(e.pointerId);
    } catch {
      // A pointer that's already gone (or a synthetic one) can't be captured; moves still reach the canvas
    }
  };
  private onPointerMove = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointer) return;
    if (d.mode === "pan") this.pan = { x: d.origin.x + e.clientX - d.start.x, y: d.origin.y + e.clientY - d.start.y };
    else if (d.mode === "link") this.linking = { from: d.from, at: this.toCanvas(e) };
    else {
      const dx = (e.clientX - d.start.x) / this.zoom;
      const dy = (e.clientY - d.start.y) / this.zoom;
      if (!d.moved && Math.hypot(dx, dy) < 3) return;
      if (this.readonly) return;
      d.moved = true;
      this.draft = { id: d.id, x: d.origin.x + dx, y: d.origin.y + dy, origin: d.origin, keys: false };
    }
  };
  private onPointerUp = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointer) return;
    this.drag = null;
    if (this.viewport?.hasPointerCapture?.(e.pointerId)) this.viewport.releasePointerCapture(e.pointerId);
    if (d.mode === "link") {
      this.linking = null;
      const over = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-node]");
      const to = over?.dataset.node;
      if (to && to !== d.from && !this.edges.some((x) => x.from === d.from && x.to === to)) this.toggleEdge(d.from, to);
    } else if (d.mode === "node") {
      if (d.moved) this.commitMove();
      else {
        this.active = d.id;
        this.setSelected(d.id);
      }
    } else if (Math.hypot(e.clientX - d.start.x, e.clientY - d.start.y) < 3 && this.selected) this.setSelected(null);
  };

  /* ---------- Keyboard ---------- */

  private nodeEl(id: string) {
    return this.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`);
  }
  private get stop() {
    const ids = this.nodes.map((n) => n.id);
    if (this.active && ids.includes(this.active)) return this.active;
    if (this.selected && ids.includes(this.selected)) return this.selected;
    return ids[0] ?? null;
  }
  private focusNode(id: string) {
    this.active = id;
    void this.updateComplete.then(() => this.nodeEl(id)?.focus({ preventScroll: true }));
  }
  /** The nearest step from `id` in a direction, favouring ones straight ahead */
  private nearest(id: string, dx: number, dy: number) {
    const from = this.pos(this.node(id)!);
    let best: string | null = null;
    let score = Infinity;
    for (const n of this.nodes) {
      if (n.id === id) continue;
      const p = this.pos(n);
      const vx = p.x - from.x;
      const vy = p.y - from.y;
      const along = vx * dx + vy * dy;
      if (along <= 0) continue;
      const across = Math.abs(vx * dy - vy * dx);
      const s = along + across * 2;
      if (s < score) {
        score = s;
        best = n.id;
      }
    }
    return best;
  }
  private onNodeKey = (e: KeyboardEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-node]");
    if (!el || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    e.stopPropagation();
    const id = el.dataset.node!;
    const dirs: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const moving = this.draft?.keys && this.draft.id === id;
    if (moving) {
      e.preventDefault();
      if (dirs[e.key]) {
        const step = e.shiftKey ? 32 : 8;
        const [dx, dy] = dirs[e.key];
        this.draft = { ...this.draft!, x: this.draft!.x + dx * step, y: this.draft!.y + dy * step };
        this.announce = `${Math.round(this.draft.x)}, ${Math.round(this.draft.y)}`;
      } else if (e.key === "Enter" || e.key === "m" || e.key === "M") this.commitMove();
      else if (e.key === "Escape") {
        this.draft = null;
        this.announce = `Move cancelled`;
      }
      return;
    }
    if (dirs[e.key]) {
      e.preventDefault();
      const to = this.nearest(id, ...dirs[e.key]);
      if (to) this.focusNode(to);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      this.focusNode((e.key === "Home" ? this.nodes[0] : this.nodes.at(-1))!.id);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setSelected(id);
    } else if (e.key === "Escape" && this.selected) {
      e.preventDefault();
      this.setSelected(null);
    } else if ((e.key === "m" || e.key === "M") && !this.readonly) {
      e.preventDefault();
      this.startMove(id);
    } else if ((e.key === "c" || e.key === "C") && !this.readonly) {
      e.preventDefault();
      this.openMenu(id, "node");
    } else if ((e.key === "a" || e.key === "A") && !this.readonly) {
      e.preventDefault();
      this.requestAdd(id);
    } else if ((e.key === "Delete" || e.key === "Backspace") && !this.readonly) {
      e.preventDefault();
      this.removeStep(id);
    }
  };
  private startMove(id: string) {
    if (!this.setSelected(id)) return;
    const n = this.node(id)!;
    this.draft = { id, x: n.x, y: n.y, origin: { x: n.x, y: n.y }, keys: true };
    this.announce = `Moving ${n.title}. Arrow keys move it, Shift moves further, Enter keeps it, Escape puts it back`;
    this.focusNode(id);
  }
  private onViewportKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget || e.altKey || e.metaKey || e.ctrlKey) return;
    const step = e.shiftKey ? 120 : 40;
    const pans: Record<string, Point> = { ArrowLeft: { x: step, y: 0 }, ArrowRight: { x: -step, y: 0 }, ArrowUp: { x: 0, y: step }, ArrowDown: { x: 0, y: -step } };
    if (pans[e.key]) {
      e.preventDefault();
      this.pan = { x: this.pan.x + pans[e.key].x, y: this.pan.y + pans[e.key].y };
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      this.setZoom(this.zoom * 1.2);
    } else if (e.key === "-") {
      e.preventDefault();
      this.setZoom(this.zoom / 1.2);
    } else if (e.key === "0") {
      e.preventDefault();
      this.fit();
      this.announce = `Zoom ${Math.round(this.zoom * 100)}%`;
    } else if (e.key === "Escape" && this.selected) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  /* ---------- The toolbar ---------- */

  private toolButtons() {
    return [...this.querySelectorAll<HTMLButtonElement>(".ui-wfc__tools button:not([disabled])")];
  }
  private onToolKey = (e: KeyboardEvent) => {
    const all = this.toolButtons();
    const i = all.indexOf(e.target as HTMLButtonElement);
    if (i < 0) return;
    const to = e.key === "ArrowRight" ? (i + 1) % all.length : e.key === "ArrowLeft" ? (i - 1 + all.length) % all.length : e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.tool = to;
    all[to].focus();
  };

  /* ---------- "Connect to…" ---------- */

  private menuTargets(from: string) {
    return this.nodes.filter((n) => n.id !== from);
  }
  private openMenu(id: string, from: "node" | "tool") {
    if (!this.menuTargets(id).length) return;
    this.menu = { for: id, from };
    this.menuIndex = 0;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-wfc__menu [role=menuitemcheckbox]")?.focus());
  }
  private closeMenu() {
    const m = this.menu;
    this.menu = null;
    if (!m) return;
    if (m.from === "node") this.focusNode(m.for);
    else void this.updateComplete.then(() => this.querySelector<HTMLElement>('.ui-wfc__tools [data-tool="connect"]')?.focus());
  }
  private onMenuKey = (e: KeyboardEvent) => {
    const m = this.menu;
    if (!m) return;
    const items = this.menuTargets(m.for);
    const keys: Record<string, number> = { ArrowDown: this.menuIndex + 1, ArrowUp: this.menuIndex - 1, Home: 0, End: items.length - 1 };
    if (e.key in keys) {
      e.preventDefault();
      this.menuIndex = (keys[e.key] + items.length) % items.length;
      void this.updateComplete.then(() => this.querySelectorAll<HTMLElement>(".ui-wfc__menu [role=menuitemcheckbox]")[this.menuIndex]?.focus());
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      e.stopPropagation();
      this.closeMenu();
    }
  };

  /* ---------- Lifecycle ---------- */

  override connectedCallback() {
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.measure());
      void this.updateComplete.then(() => this.observeViewport());
    }
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
    this.viewport?.removeEventListener("wheel", this.onWheel);
  }
  private observed: HTMLElement | null = null;
  private observeViewport() {
    const vp = this.viewport;
    if (vp === this.observed) return;
    this.observed?.removeEventListener("wheel", this.onWheel);
    this.observer?.disconnect();
    this.observed = vp;
    if (!vp) return;
    this.observer?.observe(vp);
    vp.addEventListener("wheel", this.onWheel, { passive: false });
  }
  private measure() {
    const vp = this.viewport;
    if (!vp) return;
    const size = { w: vp.clientWidth, h: vp.clientHeight };
    if (size.w === this.size.w && size.h === this.size.h) return;
    this.size = size;
    if (!this.fitted && this.nodes.length && size.w) {
      this.fitted = true;
      this.fit();
    }
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("nodes")) {
      const ids = new Set(this.nodes.map((n) => n.id));
      if (this.selected && !ids.has(this.selected)) this.selected = null;
      if (this.active && !ids.has(this.active)) this.active = null;
      if (this.draft && !ids.has(this.draft.id)) this.draft = null;
      if (this.menu && !ids.has(this.menu.for)) this.menu = null;
      if (!this.nodes.length) this.fitted = false;
      else if (!this.fitted && this.size.w) {
        this.fitted = true;
        this.fit();
      }
    }
  }
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.observeViewport();
    if (changed.has("view") && this.view === "canvas") this.measure();
  }

  /* ---------- Rendering ---------- */

  private renderNode(n: WorkflowNode, stop: string | null) {
    const p = this.pos(n);
    const k = workflowKind(n.kind, this.kinds);
    const status = n.status ?? "idle";
    const leads = this.leadsTo(n.id);
    const moving = this.draft?.id === n.id;
    return html`<button
        type="button"
        class="ui-wfc__node"
        data-node=${n.id}
        data-kind=${n.kind}
        data-status=${status}
        ?data-moving=${moving}
        ?data-selected=${this.selected === n.id}
        style=${`left: ${p.x}px; top: ${p.y}px; width: ${WORKFLOW_NODE_W}px; height: ${WORKFLOW_NODE_H}px`}
        tabindex=${stop === n.id ? 0 : -1}
        aria-pressed=${this.selected === n.id ? "true" : "false"}
        aria-describedby=${`${this.uid}-keys`}
        @focus=${() => (this.active = n.id)}
      >
        <span class="ui-wfc__node-icon" aria-hidden="true">${workflowKindIcon(n.kind, this.kinds)}</span>
        <span class="ui-wfc__node-text">
          <span class="ui-wfc__node-kind">${k.label}</span>
          <span class="ui-wfc__node-title">${n.title}</span>
          ${n.summary ? html`<span class="ui-wfc__node-summary">${n.summary}</span>` : nothing}
        </span>
        ${n.status ? html`<span class="ui-wfc__status" data-status=${status}>${icon(statusMarks[status])}<span>${this.labels[status]}</span></span>` : nothing}
        <span class="ui-wfc__sr">${leads ? `. Leads to ${leads}` : ". Last step"}</span>
      </button>
      ${this.readonly
        ? nothing
        : html`<div class="ui-wfc__port" data-port=${n.id} aria-hidden="true" style=${`left: ${p.x + WORKFLOW_NODE_W}px; top: ${p.y + WORKFLOW_NODE_H / 2}px`}></div>`}`;
  }

  private renderEdges() {
    const b = this.bounds();
    const w = Math.max(1, b.x + b.w + 400);
    const h = Math.max(1, b.y + b.h + 400);
    const status = (id: string) => this.node(id)?.status;
    const marker = `${this.uid}-arrow`;
    return html`<svg class="ui-wfc__edges" aria-hidden="true" width=${w} height=${h}>
        <defs>
          <marker id=${marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
            <path d="M0 1L9 5L0 9z" class="ui-wfc__arrow"></path>
          </marker>
          <marker id=${`${marker}-on`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
            <path d="M0 1L9 5L0 9z" class="ui-wfc__arrow" data-on=""></path>
          </marker>
        </defs>
        ${repeat(
          this.links,
          (e) => `${e.from}>${e.to}`,
          (e) => {
            const { d } = workflowEdgePath(this.pos(this.node(e.from)!), this.pos(this.node(e.to)!));
            const flow = status(e.from) === "done" && status(e.to) === "running";
            const done = status(e.from) === "done" && (status(e.to) === "done" || status(e.to) === "failed");
            const on = flow || this.selected === e.from || this.selected === e.to;
            return svg`<path class="ui-wfc__edge" d=${d} data-from=${e.from} data-to=${e.to} data-flow=${ifDefined(flow ? "" : undefined)} data-done=${ifDefined(done ? "" : undefined)} data-on=${ifDefined(on ? "" : undefined)} marker-end=${`url(#${on ? `${marker}-on` : marker})`}></path>`;
          },
        )}
        ${this.linking
          ? (() => {
              const from = this.pos(this.node(this.linking.from)!);
              const x1 = from.x + WORKFLOW_NODE_W;
              const y1 = from.y + WORKFLOW_NODE_H / 2;
              const { x, y } = this.linking.at;
              return svg`<path class="ui-wfc__edge" data-linking="" d=${`M${x1} ${y1}C${x1 + 40} ${y1} ${x - 40} ${y} ${x} ${y}`}></path>`;
            })()
          : nothing}
      </svg>
      ${this.links
        .filter((e) => e.label)
        .map((e) => {
          const { mid } = workflowEdgePath(this.pos(this.node(e.from)!), this.pos(this.node(e.to)!));
          return html`<span class="ui-wfc__edge-label" aria-hidden="true" style=${`left: ${mid.x}px; top: ${mid.y}px`}>${e.label}</span>`;
        })}`;
  }

  private renderList(stop: string | null) {
    return html`<ol class="ui-wfc__list" aria-labelledby=${`${this.uid}-title`}>
      ${this.nodes.map((n, i) => {
        const status = n.status ?? "idle";
        const leads = this.next(n.id);
        return html`<li class="ui-wfc__item">
          <button
            type="button"
            class="ui-wfc__row"
            data-node=${n.id}
            data-status=${status}
            ?data-selected=${this.selected === n.id}
            tabindex=${stop === n.id ? 0 : -1}
            aria-pressed=${this.selected === n.id ? "true" : "false"}
            @focus=${() => (this.active = n.id)}
            @click=${() => this.setSelected(n.id)}
            @keydown=${(e: KeyboardEvent) => {
              const to = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? this.nodes.length - 1 : -1;
              if (to >= 0 && to < this.nodes.length) {
                e.preventDefault();
                this.focusNode(this.nodes[to].id);
              } else if ((e.key === "Delete" || e.key === "Backspace") && !this.readonly) {
                e.preventDefault();
                this.removeStep(n.id);
              }
            }}
          >
            <span class="ui-wfc__num" aria-hidden="true">${i + 1}</span>
            <span class="ui-wfc__node-icon" aria-hidden="true">${workflowKindIcon(n.kind, this.kinds)}</span>
            <span class="ui-wfc__row-text">
              <span class="ui-wfc__node-title">${n.title}</span>
              <span class="ui-wfc__row-meta">${workflowKind(n.kind, this.kinds).label}${leads.length
                  ? html` → ${leads.map((e) => `${this.node(e.to)!.title}${e.label ? ` (${e.label})` : ""}`).join(", ")}`
                  : " · Last step"}</span>
            </span>
            ${n.status ? html`<span class="ui-wfc__status" data-status=${status}>${icon(statusMarks[status])}<span>${this.labels[status]}</span></span>` : nothing}
          </button>
        </li>`;
      })}
    </ol>`;
  }

  private renderMenu() {
    const m = this.menu!;
    const from = this.node(m.for)!;
    return html`<div class="ui-wfc__menu" role="menu" aria-label=${`Connect ${from.title} to`} @keydown=${this.onMenuKey}>
      <p class="ui-wfc__menu-title" aria-hidden="true">Connect ${from.title} to</p>
      ${this.menuTargets(m.for).map((n, i) => {
        const on = this.edges.some((e) => e.from === m.for && e.to === n.id);
        return html`<button
          type="button"
          class="ui-wfc__menu-item"
          role="menuitemcheckbox"
          aria-checked=${on ? "true" : "false"}
          tabindex=${i === this.menuIndex ? 0 : -1}
          @click=${() => {
            this.toggleEdge(m.for, n.id);
            this.closeMenu();
          }}
        >
          <span class="ui-wfc__check" aria-hidden="true">${on ? icon(statusMarks.done) : nothing}</span>
          <span class="ui-wfc__node-icon" aria-hidden="true">${workflowKindIcon(n.kind, this.kinds)}</span>
          ${n.title}
        </button>`;
      })}
    </div>`;
  }

  private renderTools() {
    const sel = this.node(this.selected);
    const tools: { id: string; label: string; glyph: TemplateResult; on?: () => void; disabled?: boolean; pressed?: boolean; hide?: boolean; quiet?: boolean }[] = [
      { id: "zoom-out", label: "Zoom out", glyph: icons.zoomOut, on: () => this.setZoom(this.zoom / 1.2), disabled: this.view !== "canvas" || this.zoom <= MIN_ZOOM, quiet: true },
      { id: "zoom-in", label: "Zoom in", glyph: icons.zoomIn, on: () => this.setZoom(this.zoom * 1.2), disabled: this.view !== "canvas" || this.zoom >= MAX_ZOOM, quiet: true },
      {
        id: "fit",
        label: "Fit",
        glyph: icons.fit,
        on: () => {
          this.fit();
          this.announce = `Zoom ${Math.round(this.zoom * 100)}%`;
        },
        disabled: this.view !== "canvas" || !this.nodes.length,
        quiet: true,
      },
      { id: "add", label: "Add step", glyph: icons.add, on: () => this.requestAdd(this.selected), hide: this.readonly },
      { id: "connect", label: "Connect", glyph: icons.link, on: () => sel && this.openMenu(sel.id, "tool"), disabled: !sel || this.nodes.length < 2, hide: this.readonly },
      { id: "move", label: "Move", glyph: icons.move, on: () => sel && this.startMove(sel.id), disabled: !sel || this.view !== "canvas", hide: this.readonly },
      { id: "remove", label: "Delete", glyph: icons.remove, on: () => sel && this.removeStep(sel.id), disabled: !sel, hide: this.readonly },
      { id: "list", label: "List", glyph: icons.list, on: () => this.setView(this.view === "list" ? "canvas" : "list"), pressed: this.view === "list" },
    ];
    const shown = tools.filter((t) => !t.hide);
    const enabled = shown.filter((t) => !t.disabled);
    const current = enabled[Math.min(this.tool, enabled.length - 1)]?.id;
    return html`<div class="ui-wfc__tools" role="toolbar" aria-label="Workflow" @keydown=${this.onToolKey}>
      ${shown.map(
        (t) => html`<button
          type="button"
          class="ui-wfc__tool"
          data-tool=${t.id}
          ?data-quiet=${t.quiet}
          ?disabled=${t.disabled}
          tabindex=${t.id === current ? 0 : -1}
          aria-pressed=${ifDefined(t.pressed === undefined ? undefined : t.pressed ? "true" : "false")}
          aria-haspopup=${ifDefined(t.id === "connect" ? "menu" : undefined)}
          aria-expanded=${ifDefined(t.id === "connect" ? (this.menu?.from === "tool" ? "true" : "false") : undefined)}
          @focus=${() => (this.tool = enabled.findIndex((x) => x.id === t.id))}
          @click=${() => t.on?.()}
        >
          ${icon(t.glyph)}<span class=${t.quiet ? "ui-wfc__sr" : "ui-wfc__tool-label"}>${t.label}</span>
        </button>`,
      )}
      <span class="ui-wfc__zoom" aria-hidden="true">${Math.round(this.zoom * 100)}%</span>
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const stop = this.stop;
    const empty = !this.nodes.length;
    const running = this.nodes.filter((n) => n.status === "running").length;
    const failed = this.nodes.filter((n) => n.status === "failed").length;
    const aside = failed
      ? html`<span class="ui-wfc__pill" data-tone="danger">${failed} failed</span>`
      : running
        ? html`<span class="ui-wfc__pill" data-tone="info">Running</span>`
        : html`<span class="ui-wfc__count">${this.nodes.length} ${this.nodes.length === 1 ? "step" : "steps"}</span>`;
    return html`
      <span class="ui-wfc__sr" role="status">${this.announce}</span>
      <span class="ui-wfc__sr" id=${`${id}-keys`}
        >${this.readonly
          ? "Arrow keys move between steps; Enter selects"
          : "Arrow keys move between steps; Enter selects; M moves the step; C connects it; A adds a step after it; Delete removes it"}</span
      >
      <span class="ui-wfc__sr" id=${`${id}-pan`}>Arrow keys pan; plus and minus zoom; 0 fits every step</span>
      ${cardHead({ icon: icons.head, title: this.heading, subtitle: this.description, id: `${id}-title`, aside: empty ? undefined : aside })}
      <div class="ui-wfc__card">
        ${this.renderTools()} ${this.menu ? this.renderMenu() : nothing}
        ${empty
          ? html`<div class="ui-wfc__empty">
              <p>No steps yet.</p>
              ${this.readonly ? nothing : html`<button type="button" class="ui-wfc__first" @click=${() => this.requestAdd(null)}>${icon(icons.add)}Add the first step</button>`}
            </div>`
          : this.view === "list"
            ? this.renderList(stop)
            : html`<div
                class="ui-wfc__viewport"
                role="group"
                tabindex="0"
                aria-labelledby=${`${id}-title`}
                aria-describedby=${`${id}-pan`}
                ?data-panning=${this.drag?.mode === "pan"}
                @keydown=${this.onViewportKey}
                @pointerdown=${this.onPointerDown}
                @pointermove=${this.onPointerMove}
                @pointerup=${this.onPointerUp}
                @pointercancel=${this.onPointerUp}
              >
                <div class="ui-wfc__layer" style=${`transform: translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`} @keydown=${this.onNodeKey}>
                  ${this.renderEdges()} ${repeat(this.nodes, (n) => n.id, (n) => this.renderNode(n, stop))}
                </div>
              </div>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="wfc"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="wfc"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The canvas height, and each kind's colour on its card's icon – override on the element */
[data-ui="wfc"] {
  --tc-wfc-h: 420px;
  --tc-wfc-trigger: var(--tc-tone-amber-solid);
  --tc-wfc-llm: var(--tc-tone-violet-solid);
  --tc-wfc-tool: var(--tc-chart-1);
  --tc-wfc-condition: var(--tc-tone-teal-solid);
  --tc-wfc-approval: var(--tc-tone-pink-solid);
  --tc-wfc-output: var(--tc-status-success-solid);
  --tc-wfc-dot: 10px;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="wfc"] { --tc-wfc-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="wfc"] { --tc-wfc-bg: var(--tc-surface-raised); }
[data-ui="wfc"] *, [data-ui="wfc"] *::before, [data-ui="wfc"] *::after { box-sizing: border-box; }
:where([data-ui="wfc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="wfc"] button:focus-visible, .ui-wfc__viewport:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="wfc"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="wfc"] p { margin: 0; }
[data-ui="wfc"] svg { display: block; flex: none; }
.ui-wfc__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-wfc__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-wfc__card { position: relative; }
.ui-wfc__count { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-wfc__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
.ui-wfc__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-wfc__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* ----- The toolbar ----- */
.ui-wfc__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-wfc__tool { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) !important; border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-wfc__tool[data-quiet] { padding: 0 var(--tc-space-1-5) !important; }
.ui-wfc__tool svg { width: 16px; height: 16px; }
.ui-wfc__tool:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-wfc__tool:disabled { cursor: default; color: var(--tc-text-disabled); }
.ui-wfc__tool[aria-pressed="true"], .ui-wfc__tool[aria-expanded="true"] { background: var(--tc-fill-selected); color: var(--tc-text-primary); }
.ui-wfc__tool[data-tool="add"] { margin-left: var(--tc-space-2); }
.ui-wfc__tool[data-tool="list"] { margin-left: auto; }
.ui-wfc__zoom { min-width: 3.5em; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-align: right; font-variant-numeric: tabular-nums; }
/* ----- "Connect to…" ----- */
.ui-wfc__menu { position: absolute; z-index: var(--tc-z-dropdown); top: var(--tc-space-12); left: var(--tc-space-3); display: grid; gap: var(--tc-space-0-5); min-width: 220px; max-height: 280px; overflow: auto; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); }
.ui-wfc__menu-title { padding: var(--tc-space-1) var(--tc-space-2) !important; font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-wfc__menu-item { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px) !important; border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); color: var(--tc-text-primary); }
.ui-wfc__menu-item:hover, .ui-wfc__menu-item:focus-visible { background: var(--tc-menu-item-hover); }
.ui-wfc__check { display: inline-grid; place-items: center; width: 16px; height: 16px; color: var(--tc-accent-text); }
.ui-wfc__check svg { width: 14px; height: 14px; }
/* ----- The canvas ----- */
.ui-wfc__viewport { position: relative; height: var(--tc-wfc-h); overflow: hidden; cursor: grab; touch-action: none; user-select: none; background-color: var(--tc-wfc-bg); background-image: radial-gradient(circle, var(--tc-border-default) 1px, transparent 1px); background-size: var(--tc-space-5) var(--tc-space-5); }
.ui-wfc__viewport[data-panning] { cursor: grabbing; }
.ui-wfc__layer { position: absolute; inset: 0 auto auto 0; transform-origin: 0 0; }
.ui-wfc__edges { position: absolute; inset: 0 auto auto 0; overflow: visible; pointer-events: none; }
.ui-wfc__edge { fill: none; stroke: var(--tc-border-strong); stroke-width: 1.5px; transition: stroke var(--tc-duration-base) var(--tc-ease-standard); }
.ui-wfc__edge[data-done] { stroke: var(--tc-text-muted); }
.ui-wfc__edge[data-on] { stroke: var(--tc-accent); stroke-width: 2px; }
.ui-wfc__edge[data-flow] { stroke: var(--tc-accent); stroke-width: 2px; stroke-dasharray: 6 6; animation: ui-wfc-flow var(--tc-duration-shimmer) linear infinite; }
.ui-wfc__edge[data-linking] { stroke: var(--tc-accent); stroke-dasharray: 4 4; }
.ui-wfc__arrow { fill: var(--tc-border-strong); }
.ui-wfc__arrow[data-on] { fill: var(--tc-accent); }
@keyframes ui-wfc-flow { to { stroke-dashoffset: -24; } }
.ui-wfc__edge-label { position: absolute; transform: translate(-50%, -50%); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-wfc-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); white-space: nowrap; pointer-events: none; }
/* A step card */
.ui-wfc__node { position: absolute; display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; column-gap: var(--tc-space-2); align-items: start; padding: var(--tc-space-2) var(--tc-space-2-5) !important; overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default), var(--tc-shadow-raised); cursor: pointer; touch-action: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-wfc__node:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong), var(--tc-shadow-raised-hover); }
.ui-wfc__node[data-selected] { box-shadow: inset 0 0 0 2px var(--tc-border-selected), var(--tc-shadow-raised-hover); }
.ui-wfc__node[data-moving] { cursor: grabbing; box-shadow: inset 0 0 0 2px var(--tc-accent), var(--tc-shadow-overlay); }
.ui-wfc__node[data-status="running"] { box-shadow: inset 0 0 0 1.5px var(--tc-status-info-solid), var(--tc-shadow-raised); }
.ui-wfc__node[data-status="failed"] { box-shadow: inset 0 0 0 1.5px var(--tc-status-danger-solid), var(--tc-shadow-raised); }
.ui-wfc__node[data-status="skipped"] { background: var(--tc-surface-sunken) !important; }
.ui-wfc__node-icon { display: grid; place-items: center; grid-row: 1 / 3; width: 28px; height: 28px; border-radius: var(--tc-radius-md); background: var(--tc-fill-default); color: var(--tc-wfc-kind, var(--tc-icon-muted)); }
.ui-wfc__node-icon svg { width: 16px; height: 16px; }
[data-kind="trigger"] { --tc-wfc-kind: var(--tc-wfc-trigger); }
[data-kind="llm"] { --tc-wfc-kind: var(--tc-wfc-llm); }
[data-kind="tool"] { --tc-wfc-kind: var(--tc-wfc-tool); }
[data-kind="condition"] { --tc-wfc-kind: var(--tc-wfc-condition); }
[data-kind="approval"] { --tc-wfc-kind: var(--tc-wfc-approval); }
[data-kind="output"] { --tc-wfc-kind: var(--tc-wfc-output); }
.ui-wfc__node-text, .ui-wfc__row-text { display: grid; min-width: 0; }
.ui-wfc__node-kind { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-wfc__node-title { overflow: hidden; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-wfc__node-summary { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-wfc__status { display: inline-flex; grid-column: 2; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-wfc__status svg { width: 12px; height: 12px; }
.ui-wfc__status[data-status="running"] { color: var(--tc-status-info-fg); }
.ui-wfc__status[data-status="running"] svg { animation: ui-wfc-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
.ui-wfc__status[data-status="done"] { color: var(--tc-status-success-fg); }
.ui-wfc__status[data-status="failed"] { color: var(--tc-status-danger-fg); }
@keyframes ui-wfc-pulse { 50% { opacity: 0.35; } }
/* The output port: drag from it onto another step to connect them */
.ui-wfc__port { position: absolute; width: var(--tc-wfc-dot); height: var(--tc-wfc-dot); transform: translate(-50%, -50%); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1.5px var(--tc-border-strong); cursor: crosshair; touch-action: none; }
.ui-wfc__port:hover { background: var(--tc-accent); box-shadow: none; }
/* ----- The list ----- */
.ui-wfc__list { display: grid; gap: var(--tc-space-1); max-height: var(--tc-wfc-h); overflow: auto; padding: var(--tc-space-2) !important; }
.ui-wfc__row { display: flex; align-items: center; gap: var(--tc-space-2-5); width: 100%; min-height: var(--tc-control-h-md); padding: var(--tc-space-2) var(--tc-space-2-5) !important; border-radius: var(--tc-radius-md); }
.ui-wfc__row:hover { background: var(--tc-fill-hover); }
.ui-wfc__row[data-selected] { background: var(--tc-fill-selected); }
.ui-wfc__row .ui-wfc__node-icon { grid-row: auto; }
.ui-wfc__row .ui-wfc__status { margin-left: auto; }
.ui-wfc__row-text { flex: 1; }
.ui-wfc__row-meta { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-wfc__num { min-width: 1.5em; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-align: right; font-variant-numeric: tabular-nums; }
.ui-wfc__empty { display: grid; justify-items: center; gap: var(--tc-space-3); padding: var(--tc-space-10) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
.ui-wfc__first { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg) !important; box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); color: var(--tc-action-secondary-fg); }
.ui-wfc__first svg { width: 16px; height: 16px; }
@container (max-width: 560px) {
  [data-ui="wfc"] { --tc-wfc-h: 360px; }
  .ui-wfc__tool-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .ui-wfc__tool { padding: 0 var(--tc-space-1-5) !important; }
}
@media (forced-colors: active) {
  .ui-wfc__edge { stroke: CanvasText; }
  .ui-wfc__edge[data-on], .ui-wfc__edge[data-flow] { stroke: Highlight; }
  .ui-wfc__arrow { fill: CanvasText; }
  .ui-wfc__node { border: 1px solid CanvasText; }
  .ui-wfc__node[data-selected] { border: 2px solid Highlight; }
  .ui-wfc__port { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="wfc"] *, [data-ui="wfc"] *::before, [data-ui="wfc"] *::after { animation: none !important; transition: none !important; }
  .ui-wfc__edge[data-flow] { stroke-dasharray: none; stroke-width: 2.5px; }
}
`;
}

if (!customElements.get("tc-workflow-canvas")) customElements.define("tc-workflow-canvas", TcWorkflowCanvas);

declare global {
  interface HTMLElementTagNameMap {
    "tc-workflow-canvas": TcWorkflowCanvas;
  }
}

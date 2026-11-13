import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-edit-region> – mark the part of an image that should change, then say how. A brush paints a mask over the
 * image (tinted, so the picture stays visible underneath), an eraser takes paint away, and a box tool selects a
 * rectangle – the box is also the way to mark without a pointer: it appears in the middle, the arrow keys move it,
 * Shift + arrows resize it and Enter adds it to the mask. Undo and Redo step through the mask's history (Ctrl/⌘ + Z,
 * Shift + Ctrl/⌘ + Z), Clear empties it. A line under the image says how much is selected ("About 18% of the image
 * selected"). Then an instruction – "Replace the chart with a table" – and Generate, which hands the page the
 * instruction, the mask as a black-and-white PNG at the image's own size, and the mask's bounds.
 *   · the mask is a list of operations (brush strokes, erasures, boxes) in fractions of the image, so it survives
 *     resizes and can be stored or sent as data
 *   · mouse, pen and touch all draw through pointer events; the stroke being drawn paints straight to the canvas
 *   · `busy` holds everything while the page generates
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-edit-region src="report-page.png" alt="Page 4 of the annual report"></tc-edit-region>
 */

/** A point across the image: x and y as fractions (0–1) of its width and height */
export type EditRegionPoint = [x: number, y: number];
/** One change to the mask: a brush stroke (its width a fraction of the image's width) or a box; `erase` takes paint away */
export type EditRegionOp =
  | { kind: "brush"; size: number; points: EditRegionPoint[]; erase?: boolean }
  | { kind: "box"; x: number; y: number; w: number; h: number; erase?: boolean };
export type EditRegionTool = "brush" | "erase" | "box";
/** The mask's bounding box, as fractions of the image */
export type EditRegionBounds = { x: number; y: number; w: number; h: number };
/** Detail of tc-mask-change */
export type EditRegionMaskChange = { mask: EditRegionOp[]; reason: "draw" | "box" | "undo" | "redo" | "clear" };
/** Detail of tc-tool-change */
export type EditRegionToolChange = { tool: EditRegionTool };
/** Detail of tc-instruction-change */
export type EditRegionInstructionChange = { instruction: string };
/** Detail of tc-edit: what to change and where – the mask as a PNG data URL (white is selected) at the image's size */
export type EditRegionEdit = { instruction: string; mask: string; bounds: EditRegionBounds; ops: EditRegionOp[]; coverage: number };

/** The words on the element; a page can rename any of them */
export const defaultEditRegionLabels = {
  tools: "Tool",
  brush: "Brush",
  erase: "Erase",
  box: "Box",
  size: "Brush size",
  undo: "Undo",
  redo: "Redo",
  clear: "Clear",
  instruction: "What should change?",
  placeholder: "Replace the chart with a table",
  generate: "Generate",
  generating: "Generating…",
  nothing: "Nothing selected yet",
  /** {n} is the percentage */
  selected: "About {n}% of the image selected",
  tiny: "Less than 1% of the image selected",
  draft: "Selection box",
  addBox: "Add box",
  boxKeys: "Arrow keys move the box, Shift + arrow keys resize it, Enter adds it to the mask, Shift + Enter takes it away.",
  canvasKeys: "Ctrl or Command + Z undoes, Shift + Ctrl or Command + Z redoes.",
  added: "Box added to the mask",
  removed: "Box taken from the mask",
  undone: "Undone",
  redone: "Redone",
  cleared: "Mask cleared",
  needsMask: "Mark part of the image first.",
  needsInstruction: "Say what should change.",
};
export type EditRegionLabels = typeof defaultEditRegionLabels;

/** The resolution the coverage and bounds are measured at (its width; the height follows the image) */
const MEASURE_W = 200;
/** The largest mask exported, on its longer side */
const EXPORT_MAX = 2048;
const MIN_BOX = 0.04;
const round4 = (n: number) => Math.round(n * 10000) / 10000;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Paints the operations onto a 2-D context of the given size: added paint in `colour`, erasures cut out */
export function paintMask(ctx: CanvasRenderingContext2D, ops: readonly EditRegionOp[], w: number, h: number, colour: string) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const op of ops) {
    ctx.globalCompositeOperation = op.erase ? "destination-out" : "source-over";
    ctx.fillStyle = colour;
    ctx.strokeStyle = colour;
    if (op.kind === "box") {
      ctx.fillRect(op.x * w, op.y * h, op.w * w, op.h * h);
      continue;
    }
    const lw = Math.max(1, op.size * w);
    const pts = op.points;
    if (!pts.length) continue;
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0][0] * w, pts[0][1] * h, lw / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
    ctx.stroke();
  }
  ctx.restore();
}

/** How much of the image the mask covers (0–1) and its bounds, measured on a small raster */
export function measureMask(ops: readonly EditRegionOp[], aspect: number): { coverage: number; bounds: EditRegionBounds | null } {
  if (!ops.length) return { coverage: 0, bounds: null };
  const w = MEASURE_W;
  const h = Math.max(1, Math.round(MEASURE_W / (aspect || 1)));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { coverage: 0, bounds: null };
  paintMask(ctx, ops, w, h, "#000");
  const data = ctx.getImageData(0, 0, w, h).data;
  let n = 0;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] < 128) continue;
      n++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (!n) return { coverage: 0, bounds: null };
  return { coverage: n / (w * h), bounds: { x: round4(x0 / w), y: round4(y0 / h), w: round4((x1 + 1 - x0) / w), h: round4((y1 + 1 - y0) / h) } };
}

const ico = (paths: ReturnType<typeof svg>) => html`<svg class="ui-edr__ico" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
// Lucide icons (ISC): brush, eraser, square-dashed, undo-2, redo-2, x
const ICONS = {
  head: svg`<path d="m11 10 3 3"/><path d="M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z"/><path d="M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031"/>`,
  brush: svg`<path d="m11 10 3 3"/><path d="M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z"/><path d="M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031"/>`,
  erase: svg`<path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.828 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21"/><path d="m5.082 11.09 8.828 8.828"/>`,
  box: svg`<path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M21 19a2 2 0 0 1-2 2"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h1"/><path d="M14 3h1"/><path d="M14 21h1"/><path d="M3 9v1"/><path d="M21 9v1"/><path d="M3 14v1"/><path d="M21 14v1"/>`,
  undo: svg`<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>`,
  redo: svg`<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"/>`,
  clear: svg`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
};

let instances = 0;

/**
 * Brush a mask over an image and say what should change – brush, eraser and a keyboard-movable box, undo and redo,
 * how much is selected, and Generate with the mask as a PNG.
 * @tag tc-edit-region
 * @fires tc-mask-change - The mask changed: a stroke or box was added, or undo, redo or clear ({ mask, reason }: EditRegionMaskChange); cancelable – prevented, the mask stays as it was
 * @fires tc-tool-change - Another tool was picked ({ tool }: EditRegionToolChange); cancelable – prevented, the tool stays
 * @fires tc-instruction-change - The instruction was edited ({ instruction }: EditRegionInstructionChange); cancelable – prevented, the text goes back
 * @fires tc-edit - Generate was pressed ({ instruction, mask, bounds, ops, coverage }: EditRegionEdit); cancelable – not prevented, the element turns `busy` until the page clears it
 */
export class TcEditRegion extends TcElement {
  static override ui = "edr";

  /** The title above the image */
  @property() accessor heading = "Edit region";
  /** One line under the title */
  @property() accessor description: string | undefined = undefined;
  /** The image to edit */
  @property() accessor src = "";
  /** What the image shows, for screen readers */
  @property() accessor alt = "";
  /** The mask: brush strokes, erasures and boxes in fractions of the image */
  @property({ attribute: false }) accessor mask: EditRegionOp[] = [];
  /** The tool in use */
  @property() accessor tool: EditRegionTool = "brush";
  /** The brush's width in px on the image as shown */
  @property({ type: Number, attribute: "brush-size" }) accessor brushSize = 32;
  /** The smallest and largest brush the slider offers, in px */
  @property({ type: Number, attribute: "min-brush" }) accessor minBrush = 8;
  /** The largest brush the slider offers, in px */
  @property({ type: Number, attribute: "max-brush" }) accessor maxBrush = 96;
  /** What should change */
  @property() accessor instruction = "";
  /** Holds everything while the page generates; Generate turns it on unless tc-edit is prevented */
  @property({ type: Boolean, reflect: true }) accessor busy = false;
  /** Words the page can rename (merged over defaultEditRegionLabels) */
  @property({ attribute: false }) accessor labels: Partial<EditRegionLabels> = {};

  /** @internal The image's width over its height, once it has loaded */
  @state() accessor aspect = 4 / 3;
  /** @internal How much is selected (0–1), and where */
  @state() accessor coverage = 0;
  /** @internal The mask's bounds */
  @state() accessor bounds: EditRegionBounds | null = null;
  /** @internal The keyboard box, in fractions */
  @state() accessor draft: EditRegionBounds = { x: 0.3, y: 0.3, w: 0.4, h: 0.4 };
  /** @internal Undo / redo are possible */
  @state() accessor canUndo = false;
  /** @internal Redo is possible */
  @state() accessor canRedo = false;
  /** @internal Why Generate can't run yet, said when it's pressed */
  @state() accessor hint = "";
  /** @internal The live region's text */
  @state() accessor announce = "";

  private readonly uid = `tc-edr${++instances}`;
  private past: EditRegionOp[][] = [];
  private future: EditRegionOp[][] = [];
  private pending: { kind: "undo" | "redo"; target: EditRegionOp[] } | null = null;
  private drawing: { id: number; rect: DOMRect; op: EditRegionOp; start: EditRegionPoint } | null = null;
  private ro?: ResizeObserver;
  private size = { w: 0, h: 0 };

  private get words(): EditRegionLabels {
    return { ...defaultEditRegionLabels, ...this.labels };
  }
  private get canvas() {
    return this.querySelector<HTMLCanvasElement>(".ui-edr__mask");
  }
  private get surface() {
    return this.querySelector<HTMLElement>(".ui-edr__surface");
  }

  /* ---------- Lifecycle ---------- */

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    this.drawing = null;
  }
  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("mask") && this.hasUpdated) {
      const prev = (changed.get("mask") as EditRegionOp[] | undefined) ?? [];
      const p = this.pending;
      if (p && p.target === this.mask) {
        if (p.kind === "undo") {
          this.past.pop();
          this.future.push(prev);
        } else {
          this.future.pop();
          this.past.push(prev);
        }
      } else if (prev !== this.mask) {
        this.past.push(prev);
        this.future = [];
      }
      this.pending = null;
    }
    this.canUndo = this.past.length > 0;
    this.canRedo = this.future.length > 0;
    if (changed.has("mask") || changed.has("aspect")) {
      const m = measureMask(this.mask, this.aspect);
      this.coverage = m.coverage;
      this.bounds = m.bounds;
      if (m.coverage) this.hint = "";
    }
    if (changed.has("instruction") && this.instruction.trim()) this.hint = "";
  }
  protected override firstUpdated() {
    this.observe();
  }
  protected override updated() {
    if (!this.ro) this.observe();
    this.paint();
  }

  private observe() {
    const s = this.surface;
    if (!s || typeof ResizeObserver !== "function") return;
    this.ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const h = Math.round(entry.contentRect.height);
      if (w > 0 && h > 0 && (w !== this.size.w || h !== this.size.h)) {
        this.size = { w, h };
        this.paint();
      }
    });
    this.ro.observe(s);
  }

  /** The mask on the visible canvas, at the screen's pixel density; the stroke being drawn is included */
  private paint() {
    const c = this.canvas;
    const s = this.surface;
    if (!c || !s) return;
    const w = this.size.w || Math.round(s.clientWidth);
    const h = this.size.h || Math.round(s.clientHeight);
    if (!w || !h) return;
    const scale = Math.max(1, window.devicePixelRatio || 1);
    const pw = Math.round(w * scale);
    const ph = Math.round(h * scale);
    if (c.width !== pw || c.height !== ph) {
      c.width = pw;
      c.height = ph;
    }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pw, ph);
    ctx.scale(scale, scale);
    const colour = getComputedStyle(c).color || "currentColor";
    paintMask(ctx, this.drawing ? [...this.mask, this.drawing.op] : this.mask, w, h, colour);
  }

  /* ---------- Changes ---------- */

  private propose(mask: EditRegionOp[], reason: EditRegionMaskChange["reason"], say?: string) {
    if (!this.emit<EditRegionMaskChange>("tc-mask-change", { mask, reason }, { cancelable: true })) {
      // A controlled page may still apply it; `pending` stays so undo / redo history follows when it does
      return false;
    }
    this.mask = mask;
    if (say) this.say(say);
    return true;
  }
  private say(text: string) {
    this.announce = this.announce === text ? `${text} ` : text;
  }

  /** Steps the mask back one change */
  undo() {
    if (this.busy || !this.past.length) return;
    const target = this.past[this.past.length - 1];
    this.pending = { kind: "undo", target };
    this.propose(target, "undo", this.words.undone);
  }
  /** Steps forward again after undo */
  redo() {
    if (this.busy || !this.future.length) return;
    const target = this.future[this.future.length - 1];
    this.pending = { kind: "redo", target };
    this.propose(target, "redo", this.words.redone);
  }
  /** Empties the mask */
  clear() {
    if (this.busy || !this.mask.length) return;
    this.propose([], "clear", this.words.cleared);
  }

  private pickTool(tool: EditRegionTool) {
    if (tool === this.tool) return;
    if (!this.emit<EditRegionToolChange>("tc-tool-change", { tool }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.tool = tool;
  }

  /* ---------- Drawing ---------- */

  private point(e: PointerEvent, rect: DOMRect): EditRegionPoint {
    return [round4(clamp((e.clientX - rect.left) / (rect.width || 1), 0, 1)), round4(clamp((e.clientY - rect.top) / (rect.height || 1), 0, 1))];
  }
  private onDown = (e: PointerEvent) => {
    if (this.busy || this.drawing) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    const surface = e.currentTarget as HTMLElement;
    try {
      surface.setPointerCapture(e.pointerId);
    } catch {
      // A pointer that's already gone (or a synthetic one) can't be captured; the stroke still ends on its pointerup
    }
    const rect = surface.getBoundingClientRect();
    const p = this.point(e, rect);
    const op: EditRegionOp =
      this.tool === "box"
        ? { kind: "box", x: p[0], y: p[1], w: 0, h: 0 }
        : { kind: "brush", size: round4(this.brushSize / (rect.width || 1)), points: [p], ...(this.tool === "erase" ? { erase: true } : {}) };
    this.drawing = { id: e.pointerId, rect, op, start: p };
    this.paint();
  };
  private onMove = (e: PointerEvent) => {
    const d = this.drawing;
    if (!d || e.pointerId !== d.id) return;
    const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
    for (const ev of events.length ? events : [e]) {
      const p = this.point(ev, d.rect);
      if (d.op.kind === "box") {
        const { start } = d;
        d.op = { kind: "box", x: Math.min(start[0], p[0]), y: Math.min(start[1], p[1]), w: Math.abs(p[0] - start[0]), h: Math.abs(p[1] - start[1]) };
      } else {
        const last = d.op.points[d.op.points.length - 1];
        if (Math.hypot((p[0] - last[0]) * d.rect.width, (p[1] - last[1]) * d.rect.height) < 1.5) continue;
        d.op.points.push(p);
      }
    }
    this.paint();
  };
  private onUp = (e: PointerEvent) => {
    const d = this.drawing;
    if (!d || e.pointerId !== d.id) return;
    this.drawing = null;
    const op = d.op;
    if (op.kind === "box") {
      const box = { ...op, x: round4(op.x), y: round4(op.y), w: round4(op.w), h: round4(op.h) };
      if (e.type !== "pointercancel" && box.w > 0.005 && box.h > 0.005) this.propose([...this.mask, box], "box");
    } else if (e.type !== "pointercancel" || op.points.length > 1) {
      this.propose([...this.mask, op], "draw");
    }
    this.paint();
  };

  /* ---------- Keyboard ---------- */

  private onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.matches("input[type='text'], textarea")) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) this.redo();
      else this.undo();
    } else if (mod && !e.altKey && e.key.toLowerCase() === "y") {
      e.preventDefault();
      this.redo();
    }
  };
  private onDraftKey = (e: KeyboardEvent) => {
    if (this.busy) return;
    const step = 0.02;
    const d = { ...this.draft };
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const mv = moves[e.key];
    if (mv) {
      e.preventDefault();
      if (e.shiftKey) {
        d.w = clamp(d.w + mv[0] * step, MIN_BOX, 1 - d.x);
        d.h = clamp(d.h + mv[1] * step, MIN_BOX, 1 - d.y);
      } else {
        d.x = clamp(d.x + mv[0] * step, 0, 1 - d.w);
        d.y = clamp(d.y + mv[1] * step, 0, 1 - d.h);
      }
      this.draft = { x: round4(d.x), y: round4(d.y), w: round4(d.w), h: round4(d.h) };
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.addDraft(e.shiftKey);
    }
  };
  private addDraft(erase = false) {
    if (this.busy) return;
    const op: EditRegionOp = { kind: "box", ...this.draft, ...(erase ? { erase: true } : {}) };
    this.propose([...this.mask, op], "box", erase ? this.words.removed : this.words.added);
  }

  /* ---------- Generate ---------- */

  /** The mask as a PNG data URL – white where selected, black elsewhere – at the image's own size (at most 2048 px) */
  toMaskDataURL(): string {
    const img = this.querySelector<HTMLImageElement>(".ui-edr__img");
    let w = img?.naturalWidth || this.size.w || 1024;
    let h = img?.naturalHeight || this.size.h || Math.round(w / this.aspect);
    const k = Math.min(1, EXPORT_MAX / Math.max(w, h));
    w = Math.max(1, Math.round(w * k));
    h = Math.max(1, Math.round(h * k));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    // The selection is drawn on its own layer so erasures cut it, then laid over black
    const layer = document.createElement("canvas");
    layer.width = w;
    layer.height = h;
    const lctx = layer.getContext("2d");
    if (lctx) paintMask(lctx, this.mask, w, h, "#fff");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(layer, 0, 0);
    return canvas.toDataURL("image/png");
  }

  private generate() {
    if (this.busy) return;
    const w = this.words;
    if (!this.coverage || !this.bounds) {
      this.hint = w.needsMask;
      this.say(w.needsMask);
      return;
    }
    const instruction = this.instruction.trim();
    if (!instruction) {
      this.hint = w.needsInstruction;
      this.say(w.needsInstruction);
      void this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>(".ui-edr__input")?.focus());
      return;
    }
    const detail: EditRegionEdit = { instruction, mask: this.toMaskDataURL(), bounds: this.bounds, ops: this.mask, coverage: round4(this.coverage) };
    if (this.emit<EditRegionEdit>("tc-edit", detail, { cancelable: true })) this.busy = true;
  }

  private onInstruction = (e: Event) => {
    const input = e.target as HTMLTextAreaElement;
    const instruction = input.value;
    if (!this.emit<EditRegionInstructionChange>("tc-instruction-change", { instruction }, { cancelable: true })) {
      input.value = this.instruction;
      return;
    }
    this.instruction = instruction;
  };
  private onLoad = (e: Event) => {
    const img = e.target as HTMLImageElement;
    if (img.naturalWidth && img.naturalHeight) this.aspect = img.naturalWidth / img.naturalHeight;
  };

  /* ---------- Render ---------- */

  private coverageText() {
    const w = this.words;
    if (!this.coverage) return w.nothing;
    const pct = Math.round(this.coverage * 100);
    return pct < 1 ? w.tiny : w.selected.replace("{n}", String(pct));
  }

  protected override render() {
    const w = this.words;
    const id = this.uid;
    const busy = this.busy;
    const tools: [EditRegionTool, string][] = [
      ["brush", w.brush],
      ["erase", w.erase],
      ["box", w.box],
    ];
    const src = safeMediaUrl(this.src);
    const status = this.coverageText();
    const d = this.draft;
    const pct = (n: number) => `${Math.round(n * 100)}%`;
    const head = cardHead({ icon: ICONS.head, title: this.heading, subtitle: this.description, id: `${id}-title` });
    const body = html`<div class="ui-edr__card" aria-busy=${busy ? "true" : "false"} @keydown=${this.onKey}>
      <div class="ui-edr__tools">
        <fieldset class="ui-edr__toolset" ?disabled=${busy}>
          <legend class="tc-sr-only">${w.tools}</legend>
          ${tools.map(
            ([t, label]) => html`<label class="ui-edr__tool" ?data-on=${this.tool === t}>
              <input class="tc-sr-only ui-edr__tool-input" type="radio" name=${`${id}-tool`} value=${t} .checked=${live(this.tool === t)} @change=${() => this.pickTool(t)} />
              ${ico(ICONS[t])}<span>${label}</span>
            </label>`,
          )}
        </fieldset>
        ${this.tool === "box"
          ? nothing
          : html`<label class="ui-edr__size">
              <span>${w.size}</span>
              <input
                class="ui-edr__size-input"
                type="range"
                min=${this.minBrush}
                max=${this.maxBrush}
                step="1"
                .value=${live(String(this.brushSize))}
                aria-valuetext=${`${this.brushSize} px`}
                ?disabled=${busy}
                @input=${(e: Event) => (this.brushSize = Number((e.target as HTMLInputElement).value))}
              />
              <span class="ui-edr__size-value" aria-hidden="true">${this.brushSize}</span>
            </label>`}
        <div class="ui-edr__history">
          <button type="button" class="tc-btn-sm ui-edr__undo" ?disabled=${busy || !this.canUndo} aria-keyshortcuts="Control+Z Meta+Z" @click=${() => this.undo()}>${ico(ICONS.undo)}<span>${w.undo}</span></button>
          <button type="button" class="tc-btn-sm ui-edr__redo" ?disabled=${busy || !this.canRedo} aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z" @click=${() => this.redo()}>${ico(ICONS.redo)}<span>${w.redo}</span></button>
          <button type="button" class="tc-btn-sm ui-edr__clear" ?disabled=${busy || !this.mask.length} @click=${() => this.clear()}>${ico(ICONS.clear)}<span>${w.clear}</span></button>
        </div>
      </div>
      <div class="ui-edr__stage" style=${`aspect-ratio: ${round4(this.aspect)}`}>
        <div
          class="ui-edr__surface"
          data-tool=${this.tool}
          ?data-busy=${busy}
          @pointerdown=${this.onDown}
          @pointermove=${this.onMove}
          @pointerup=${this.onUp}
          @pointercancel=${this.onUp}
        >
          ${src ? html`<img class="ui-edr__img" src=${src} alt=${this.alt} draggable="false" @load=${this.onLoad} />` : html`<div class="ui-edr__img ui-edr__img--empty" role="img" aria-label=${this.alt || w.nothing}></div>`}
          <canvas class="ui-edr__mask" aria-hidden="true"></canvas>
          ${this.tool === "box"
            ? html`<div
                class="ui-edr__draft"
                tabindex=${busy ? "-1" : "0"}
                role="img"
                aria-roledescription=${w.draft}
                aria-label=${`${w.draft}: ${pct(d.x)} from the left, ${pct(d.y)} from the top, ${pct(d.w)} wide, ${pct(d.h)} tall`}
                aria-describedby=${`${id}-boxkeys`}
                style=${`left: ${d.x * 100}%; top: ${d.y * 100}%; width: ${d.w * 100}%; height: ${d.h * 100}%`}
                @keydown=${this.onDraftKey}
                @pointerdown=${(e: Event) => e.stopPropagation()}
              ></div>`
            : nothing}
        </div>
        ${busy ? html`<div class="ui-edr__busy" aria-hidden="true"><span class="ui-edr__busy-bar"></span></div>` : nothing}
      </div>
      <div class="ui-edr__under">
        <p class="ui-edr__status" id=${`${id}-status`}>${status}</p>
        ${this.tool === "box" ? html`<button type="button" class="tc-btn-sm ui-edr__add" ?disabled=${busy} @click=${() => this.addDraft()}>${w.addBox}</button>` : nothing}
      </div>
      <label class="ui-edr__field">
        <span class="ui-edr__label">${w.instruction}</span>
        <textarea
          class="ui-edr__input"
          rows="2"
          .value=${live(this.instruction)}
          placeholder=${w.placeholder}
          ?disabled=${busy}
          aria-describedby=${ifDefined(this.hint ? `${id}-hint` : undefined)}
          aria-invalid=${this.hint === w.needsInstruction ? "true" : "false"}
          @input=${this.onInstruction}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              this.generate();
            }
          }}
        ></textarea>
      </label>
      <div class="ui-edr__actions">
        ${this.hint ? html`<p class="ui-edr__hint" id=${`${id}-hint`}>${this.hint}</p>` : nothing}
        <button type="button" class="ui-edr__generate" aria-disabled=${busy ? "true" : "false"} aria-describedby=${`${id}-status`} @click=${() => this.generate()}>${busy ? w.generating : w.generate}</button>
      </div>
      <span class="tc-sr-only" id=${`${id}-boxkeys`}>${w.boxKeys} ${w.canvasKeys}</span>
      <span class="tc-sr-only" role="status">${this.announce}</span>
    </div>`;
    return html`${head}${body}`;
  }

  static override css = /* css */ `
[data-ui="edr"] {
  --tc-edr-tint-opacity: 0.45;
}
/* Standard: the header on a gray tray, above a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="edr"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white card, the header its first row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="edr"] {
  position: relative;
  display: block;
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
[data-ui="edr"] *, [data-ui="edr"] *::before, [data-ui="edr"] *::after { box-sizing: border-box; }
[data-ui="edr"] p { margin: 0; }
.ui-edr__card { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-edr__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-edr__card { padding-top: 0; }
.ui-edr__ico { width: var(--tc-space-4); height: var(--tc-space-4); flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
/* ----- Tools ----- */
.ui-edr__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-edr__toolset { display: inline-flex; gap: var(--tc-space-1); margin: 0; padding: var(--tc-space-1); border: 0; border-radius: var(--tc-control-radius-md); background: var(--tc-surface-sunken); }
.ui-edr__tool { position: relative; display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-edr__tool:hover { color: var(--tc-text-primary); }
.ui-edr__tool[data-on] { background: var(--tc-surface-raised); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-text-strong); }
.ui-edr__tool:has(:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-edr__toolset:disabled .ui-edr__tool { cursor: not-allowed; color: var(--tc-text-disabled); }
.ui-edr__size { display: inline-flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-edr__size-input { width: calc(var(--tc-space-16) * 2); margin: 0; accent-color: var(--tc-action-primary-bg); }
.ui-edr__size-value { min-width: var(--tc-space-6); text-align: right; font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-edr__history { display: inline-flex; gap: var(--tc-space-1); margin-left: auto; }
/* ----- The image and its mask ----- */
.ui-edr__stage { position: relative; width: 100%; overflow: hidden; border-radius: var(--tc-field-radius); background: var(--tc-surface-sunken); box-shadow: var(--tc-field-shadow); }
.ui-edr__surface { position: absolute; inset: 0; touch-action: none; user-select: none; -webkit-user-select: none; cursor: crosshair; }
.ui-edr__surface[data-busy] { cursor: progress; }
.ui-edr__img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
.ui-edr__img--empty { background: var(--tc-surface-sunken); }
.ui-edr__mask { position: absolute; inset: 0; width: 100%; height: 100%; color: var(--tc-accent); opacity: var(--tc-edr-tint-opacity); pointer-events: none; }
.ui-edr__draft { position: absolute; border: var(--tc-focus-ring-width) dashed var(--tc-accent); border-radius: var(--tc-radius-xs); background: var(--tc-accent-subtle); cursor: move; }
.ui-edr__draft:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-edr__busy { position: absolute; inset: auto 0 0; height: var(--tc-space-1); overflow: hidden; background: var(--tc-accent-subtle); }
.ui-edr__busy-bar { position: absolute; inset: 0 auto 0 0; width: 30%; background: var(--tc-accent); animation: ui-edr-busy var(--tc-duration-shimmer) var(--tc-ease-standard) infinite; }
@keyframes ui-edr-busy { from { transform: translateX(-100%); } to { transform: translateX(340%); } }
/* ----- Below ----- */
.ui-edr__under { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-edr__status { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-edr__field { display: grid; gap: var(--tc-space-1); }
.ui-edr__label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-edr__input { width: 100%; min-height: var(--tc-field-h); margin: 0; padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); resize: vertical; }
.ui-edr__input::placeholder { color: var(--tc-text-placeholder); }
.ui-edr__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-edr__input:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-edr__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-edr__input:disabled { background: var(--tc-surface-sunken); color: var(--tc-text-muted); }
.ui-edr__actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-edr__hint { margin-right: auto; font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
.ui-edr__generate { display: inline-flex; align-items: center; justify-content: center; height: var(--tc-control-h-md); margin: 0; padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-edr__generate:hover { background: var(--tc-action-primary-bg-hover); }
.ui-edr__generate:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-edr__generate[aria-disabled="true"] { cursor: progress; }
@container (max-width: 420px) {
  .ui-edr__tool span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-edr__history .tc-btn-sm span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-edr__history { margin-left: 0; }
  .ui-edr__size-input { width: var(--tc-space-16); }
}
@media (forced-colors: active) {
  .ui-edr__mask { color: Highlight; }
  .ui-edr__draft { border-color: Highlight; }
  .ui-edr__tool[data-on] { border: 1px solid Highlight; }
  .ui-edr__generate { border: 1px solid ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="edr"] *, [data-ui="edr"] *::before, [data-ui="edr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-edit-region")) customElements.define("tc-edit-region", TcEditRegion);

declare global {
  interface HTMLElementTagNameMap {
    "tc-edit-region": TcEditRegion;
  }
}

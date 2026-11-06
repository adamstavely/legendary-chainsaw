/*
 * Picking a range of x by dragging (ported from ztd-charts' brush, MIT, © 2026 Junhan2 –
 * https://github.com/Junhan2/ztd-charts): drag across the plot with a mouse or pen, or Shift+arrows from the keyboard
 * and Enter to settle it; Escape clears it. Touch doesn't drag – a finger reads values instead. The chart draws the
 * range as a band with its change, and tags its highest and lowest points; in zoom mode the chart narrows to it.
 */
import { svg } from "lit";
import { txt } from "./axis";
import { formatNumber } from "./format";
import { textWidth } from "./text";

/** A picked range: indexes of the points shown, both ends included, from < to */
export type BrushRange = { from: number; to: number };

/** A picked range of x, as tc-brush reports it: indexes in the full (unzoomed) order, with keys and labels */
export type XRange = { from: number; to: number; fromKey: string; toKey: string; fromLabel: string; toLabel: string };

/** Off, picking a range and showing its change ("select"), or zooming into it ("zoom") */
export type BrushMode = "none" | "select" | "zoom";

export type BrushWords = { zoomHint: string; pickHint: string; high: string; low: string; reset: string; resetLabel: string; range: string };
export const defaultBrushWords: BrushWords = {
  zoomHint: " Press Enter to zoom in.",
  pickHint: " Press Enter to select.",
  high: "High",
  low: "Low",
  reset: "Show all",
  resetLabel: "Show all (reset zoom)",
  range: "{from} to {to}",
};

const MIN_DRAG_PX = 4;

export type BrushOptions = {
  /** How many points are shown */
  count: () => number;
  /** The nearest point to an x in plot px */
  indexAt: (x: number) => number;
  /** Whether a drag may start here – inside the plot area */
  inPlot: (x: number, y: number) => boolean;
  /** A range was settled (released, or Enter), or cleared (null) */
  commit: (r: BrushRange | null) => void;
  /** Keep the band after settling; false for zoom, where the view changes at once */
  keep: () => boolean;
  /** Ask the host to draw again */
  changed: () => void;
};

export class ChartBrush {
  range: BrushRange | null = null;
  dragging = false;
  private start: { i: number; x: number; moved: boolean } | null = null;
  private anchor: number | null = null;

  constructor(private o: BrushOptions) {}

  /** Picking from the keyboard, not yet settled with Enter */
  get keyboard() {
    return this.range !== null && this.anchor !== null;
  }

  clear() {
    this.start = null;
    this.anchor = null;
    this.dragging = false;
    this.range = null;
    this.o.changed();
  }

  /** True when a drag started */
  down(x: number, y: number, e: PointerEvent) {
    if (this.o.count() < 2 || e.pointerType === "touch" || e.button !== 0 || !this.o.inPlot(x, y)) return false;
    this.start = { i: this.o.indexAt(x), x, moved: false };
    // A pointer the browser no longer tracks can't be captured; the drag still works without it
    try {
      (e.currentTarget as Element | null)?.setPointerCapture?.(e.pointerId);
    } catch {
      /* not capturable */
    }
    return true;
  }

  /** True while dragging – the chart need not track hover then */
  move(x: number) {
    const s = this.start;
    if (!s) return false;
    if (!s.moved && Math.abs(x - s.x) < MIN_DRAG_PX) return true;
    s.moved = true;
    const i = this.o.indexAt(x);
    const from = Math.min(s.i, i);
    const to = Math.max(s.i, i);
    this.dragging = true;
    if (this.range?.from !== from || this.range?.to !== to) {
      this.range = { from, to };
      this.o.changed();
    }
    return true;
  }

  up(x: number, e: PointerEvent) {
    const s = this.start;
    this.start = null;
    const t = e.currentTarget as Element | null;
    try {
      if (t?.hasPointerCapture?.(e.pointerId)) t.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (!s) return;
    this.dragging = false;
    // A click without a drag clears the range
    if (!s.moved || e.type === "pointercancel") {
      if (this.range) {
        this.range = null;
        this.o.commit(null);
      }
      this.o.changed();
      return;
    }
    const i = this.o.indexAt(x);
    const r = { from: Math.min(s.i, i), to: Math.max(s.i, i) };
    const ok = r.to > r.from;
    this.range = ok && this.o.keep() ? r : null;
    this.o.commit(ok ? r : null);
    this.o.changed();
  }

  /** Shift+arrows widen, Enter settles, Escape clears; true when it handled the key */
  key(e: KeyboardEvent, active: number | null) {
    if (e.key === "Escape" && this.range) {
      this.clear();
      this.o.commit(null);
      return true;
    }
    if (e.key === "Enter" && this.range && this.anchor !== null) {
      this.anchor = null;
      const r = this.range;
      if (!this.o.keep()) this.range = null;
      this.o.commit(r);
      this.o.changed();
      return true;
    }
    if (!e.shiftKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight") || this.o.count() < 2) return false;
    const step = e.key === "ArrowRight" ? 1 : -1;
    const a = this.anchor ?? active ?? (step > 0 ? 0 : this.o.count() - 1);
    // Move the end away from the anchor
    const end = this.range && this.anchor !== null ? (this.range.from === a ? this.range.to : this.range.from) : a;
    const next = Math.max(0, Math.min(this.o.count() - 1, end + step));
    this.anchor = a;
    this.range = next === a ? null : { from: Math.min(a, next), to: Math.max(a, next) };
    this.o.changed();
    return true;
  }
}

/** How much b changed from a, as a ratio; null when a is 0 */
export function changeRatio(a: number, b: number): number | null {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) return null;
  return (b - a) / Math.abs(a);
}

export function signedPercent(r: number, locale?: string): string {
  const v = Math.round(r * 1000) / 10;
  return `${v > 0 ? "+" : ""}${formatNumber(v, { locale, maximumFractionDigits: 1 })}%`;
}

const CHIP_FONT = 12;

/** The picked range: a soft band, lines at its ends, and a chip at the top with its change and its span */
export function brushBand(o: { x0: number; x1: number; top: number; bottom: number; width: number; main: string; sub: string; dragging: boolean }) {
  const a = Math.min(o.x0, o.x1);
  const b = Math.max(o.x0, o.x1);
  const mainW = textWidth(o.main, CHIP_FONT, 700);
  const subW = textWidth(o.sub, 11, 500) + 6;
  const chipW = mainW + subW + 16;
  const chipX = Math.max(2, Math.min(o.width - chipW - 2, (a + b) / 2 - chipW / 2));
  const chipY = o.top + 4;
  return svg`<g class="tc-brush" pointer-events="none" ?data-dragging=${o.dragging}>
    <rect class="tc-brush__band" x=${a} y=${o.top} width=${Math.max(1, b - a)} height=${Math.max(0, o.bottom - o.top)}></rect>
    <line class="tc-brush__edge" x1=${a} x2=${a} y1=${o.top} y2=${o.bottom}></line>
    <line class="tc-brush__edge" x1=${b} x2=${b} y1=${o.top} y2=${o.bottom}></line>
    <rect class="tc-brush__chip" x=${chipX} y=${chipY} width=${chipW} height="22" rx="8"></rect>
    ${txt(chipX + 8, chipY + 11, o.main, { cls: "value", strong: true })}
    ${txt(chipX + 8 + mainW + 6, chipY + 11, o.sub)}
  </g>`;
}

type TagPoint = { x: number; y: number; text: string };

/** Tags on the range's highest point (above it) and lowest (below), flipped when there's no room */
export function extremeTags(o: { width: number; top: number; bottom: number; max: TagPoint; min: TagPoint; words: BrushWords }) {
  return svg`${pointTag(o.max.x, o.max.y, `${o.words.high} ${o.max.text}`, o.max.y - 26 < o.top + 30, o.width)}${pointTag(o.min.x, o.min.y, `${o.words.low} ${o.min.text}`, o.min.y + 26 < o.bottom, o.width)}`;
}

function pointTag(x: number, y: number, text: string, below: boolean, width: number) {
  const w = textWidth(text, 11, 700) + 12;
  const h = 18;
  const tx = Math.max(2, Math.min(width - w - 2, x - w / 2));
  const ty = below ? y + 8 : y - h - 8;
  return svg`<g class="tc-brush__tag" pointer-events="none">
    <circle class="tc-brush__dot" cx=${x} cy=${y} r="3.5"></circle>
    <rect class="tc-brush__tag-back" x=${tx} y=${ty} width=${w} height=${h} rx="9"></rect>
    <text class="tc-brush__tag-text" x=${tx + w / 2} y=${ty + h / 2} dy="0.35em" text-anchor="middle">${text}</text>
  </g>`;
}

export const brushCss = /* css */ `
.tc-brush__band { fill: var(--tc-plot-accent); opacity: 0.14; }
.tc-brush[data-dragging] .tc-brush__band { opacity: 0.1; }
.tc-brush__edge { stroke: var(--tc-plot-accent); stroke-width: 1; }
.tc-brush__chip { fill: var(--tc-plot-bg); stroke: var(--tc-border-subtle); }
.tc-brush__dot { fill: var(--tc-text-primary); stroke: var(--tc-plot-bg); stroke-width: 2; }
.tc-brush__tag-back { fill: var(--tc-tooltip-bg); }
.tc-brush__tag-text { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-strong); fill: var(--tc-tooltip-fg); font-variant-numeric: tabular-nums; }
.tc-chart__reset { position: absolute; top: 0; right: 0; z-index: 4; }
@media (forced-colors: active) {
  .tc-brush__band { fill: Highlight; }
  .tc-brush__edge { stroke: Highlight; }
  .tc-brush__chip, .tc-brush__tag-back { stroke: CanvasText; }
}
`;

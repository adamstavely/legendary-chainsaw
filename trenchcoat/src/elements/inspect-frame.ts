import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-inspect-frame> – a picture of a real component seen like a selection in a design tool: the component, tilted
 * back, with a cursor that walks through its rows, a selection frame with corner handles round each one, its padding
 * as numbers on guide lines and a chip with its width ("W Fill 300px").
 *
 *   <tc-inspect-frame><tc-agent-monitor …></tc-agent-monitor></tc-inspect-frame>
 *   <tc-inspect-frame mirror targets=".ui-agm-head, .ui-agm-step"><div class="my-card">…</div></tc-inspect-frame>
 *   <tc-inspect-frame flat .playing=${false}>…</tc-inspect-frame>
 *
 * The content is the element's first element child, and it stays where the page put it (the React wrapper puts its
 * children in one div). Like tilt-card, every layer – the content and the element's overlay – sits in one grid cell
 * and takes the same transform, so the overlay lines up with the content however it's tilted. The rows are measured
 * from the live content with the transform switched off for the moment of measuring (data-measuring), so the numbers
 * are the content's own CSS pixels; a ResizeObserver measures again when the content or the frame changes size.
 *
 * Rows: the elements matching `targets` inside the content, or by default the visible block children of the content's
 * root – the first element down that has more than one visible child. At most eight.
 *
 * It's a picture: the host is inert, so nothing in it takes focus or clicks, and it's hidden from screen readers
 * unless `label` names it (the host is then role="img"). The walk is finite – `rounds` times through the rows, then it
 * rests on the first one (data-done) – holds while it's off screen or in a hidden tab, and with reduced motion
 * nothing moves: the selection stands on the first row.
 */

/** One measured row, in the content's CSS pixels */
export type InspectFrameRow = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Padding: top, right, bottom, left */
  pad: [number, number, number, number];
  /** "Fill" when it spans its parent's content box, else "Hug" */
  sizing: "Fill" | "Hug";
};

type Phase = "idle" | "move" | "show";

/** Whether the user asked for reduced motion */
const reducedMotion = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const MAX_ROWS = 8;
/** How long the cursor takes to reach a row before the frame draws, in ms */
const TRAVEL = 420;

/** Visible element children – no hidden parts, nothing without a box; positioned layers only when `layers` is set */
function visibleChildren(el: Element, layers = false) {
  return [...el.children].filter((c): c is HTMLElement => {
    if (!(c instanceof HTMLElement)) return false;
    const cs = getComputedStyle(c);
    if (cs.display === "none" || cs.display === "contents" || cs.visibility === "hidden") return false;
    if (!layers && (cs.position === "absolute" || cs.position === "fixed")) return false;
    return c.offsetWidth > 0 && c.offsetHeight > 0;
  });
}

/**
 * A component seen like a selection in a design tool – tilted back, with a selection frame, spacing numbers and a
 * guide walking through its rows. Its content is its first element child.
 * @tag tc-inspect-frame
 */
export class TcInspectFrame extends TcElement {
  static override ui = "isp";
  static override looks = false;

  /** Accessible name; without it the illustration is decorative and hidden from screen readers */
  @property() accessor label = "";
  /** CSS selector for the rows to walk through, inside the content; "" (the default) picks the root's block children */
  @property() accessor targets = "";
  /** Walks the selection through the rows; false holds it on the first row */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor playing = true;
  /** How long the selection stays on a row, in ms */
  @property({ type: Number }) accessor hold = 1600;
  /** Wait before the first selection, in ms – e.g. until the section around it has come in */
  @property({ type: Number }) accessor delay = 600;
  /** How many times it walks through the rows before it rests on the first one */
  @property({ type: Number }) accessor rounds = 2;
  /** Tilted the other way and fading out to the left – for the left side of a layout */
  @property({ type: Boolean, reflect: true }) accessor mirror = false;
  /** No tilt and no fade */
  @property({ type: Boolean, reflect: true }) accessor flat = false;
  /** The content's width in px, before it's scaled to fit the frame */
  @property({ type: Number, attribute: "content-width" }) accessor contentWidth = 300;

  /** @internal The measured rows */
  @state() accessor rows: InspectFrameRow[] = [];
  /** @internal The row the selection is on */
  @state() accessor index = 0;
  /** @internal Where the walk is on that row */
  @state() accessor phase: Phase = "idle";

  /** @internal */
  private readonly screen = new OnScreenController(this);
  /** @internal */
  private timer = 0;
  /** @internal Rounds walked so far */
  private round = 0;
  /** @internal */
  private ro?: ResizeObserver;
  /** @internal The element the rows were measured in */
  private observed?: Element;
  /** @internal The walk has started (it starts once, after the first measure) */
  private started = false;

  /** The rows as measured, in the content's CSS pixels */
  get measuredRows(): readonly InspectFrameRow[] {
    return this.rows;
  }

  /** The row the selection is on */
  get selectedIndex() {
    return this.index;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.inert = true;
    if (this.hasUpdated) this.watch();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.timer);
    this.timer = 0;
    this.ro?.disconnect();
    this.ro = undefined;
    this.observed = undefined;
    this.started = false;
  }

  protected override firstUpdated() {
    this.watch();
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("contentWidth")) this.style.setProperty("--w", `${this.contentWidth}px`);
  }

  protected override updated(changed: PropertyValues<this>) {
    if (this.label) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.label);
      this.removeAttribute("aria-hidden");
    } else {
      if (this.getAttribute("role") === "img") this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }
    this.toggleAttribute("data-paused", !this.screen.onScreen);
    if (changed.has("targets") || changed.has("contentWidth") || changed.has("flat")) {
      if (this.hasUpdated) this.measure();
    }
    if ((changed.has("playing") || changed.has("rounds")) && this.started) this.restart();
  }

  /** @internal The content: the first element child that isn't one of the element's own parts */
  private content(): HTMLElement | null {
    for (const c of this.children) if (c instanceof HTMLElement && !c.classList.contains("ui-isp-layer")) return c;
    return null;
  }

  /** @internal Measure now and whenever the content or the frame changes size */
  private watch() {
    this.ro?.disconnect();
    this.ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => this.measure()) : undefined;
    this.ro?.observe(this);
    const content = this.content();
    if (content) this.ro?.observe(content);
    this.observed = content ?? undefined;
    this.measure();
    // Components inside render after this one: measure again once they have
    if (content) {
      const pending = [content, ...content.querySelectorAll("*")]
        .map((el) => (el as Partial<{ updateComplete: Promise<unknown> }>).updateComplete)
        .filter((p): p is Promise<unknown> => p instanceof Promise);
      if (pending.length) void Promise.all(pending).then(() => requestAnimationFrame(() => this.measure()));
    }
  }

  /** Measures the rows again – call it after changing the content in a way that keeps its size */
  measure() {
    const content = this.content();
    if (!content) {
      this.rows = [];
      return;
    }
    if (content !== this.observed) {
      if (this.observed) this.ro?.unobserve(this.observed);
      this.ro?.observe(content);
      this.observed = content;
    }
    // With the transform off, rects are the content's own CSS pixels
    this.setAttribute("data-measuring", "");
    const box = content.getBoundingClientRect();
    const rows = this.pick(content).map((t): InspectFrameRow => {
      const r = t.getBoundingClientRect();
      const cs = getComputedStyle(t);
      const parent = t.parentElement;
      let sizing: InspectFrameRow["sizing"] = "Hug";
      if (parent) {
        const ps = getComputedStyle(parent);
        const inner = parent.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight);
        if (r.width >= inner - 1) sizing = "Fill";
      }
      return {
        x: r.left - box.left,
        y: r.top - box.top,
        w: r.width,
        h: r.height,
        pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((p) => Math.round(parseFloat(p) || 0)) as InspectFrameRow["pad"],
        sizing,
      };
    });
    const cw = content.offsetWidth;
    const ch = content.offsetHeight;
    this.removeAttribute("data-measuring");
    // Scaled to fit the frame, with room round it for the tilt and the fades
    const fw = this.clientWidth;
    const fh = this.clientHeight;
    if (cw && ch && fw && fh) {
      const room = this.flat ? 0.92 : 0.8;
      const s = Math.min((fw * room) / cw, (fh * room) / ch, 1.6);
      this.style.setProperty("--s", String(Math.max(0.2, Math.round(s * 1000) / 1000)));
    }
    const same = rows.length === this.rows.length && rows.every((r, i) => {
      const o = this.rows[i];
      return Math.abs(r.x - o.x) < 0.5 && Math.abs(r.y - o.y) < 0.5 && Math.abs(r.w - o.w) < 0.5 && Math.abs(r.h - o.h) < 0.5;
    });
    if (!same) this.rows = rows;
    if (this.index >= rows.length) this.index = 0;
    if (!this.started && rows.length) {
      this.started = true;
      this.restart();
    }
  }

  /** @internal The rows' elements */
  private pick(content: HTMLElement): HTMLElement[] {
    if (this.targets) {
      let found: HTMLElement[] = [];
      try {
        found = [...content.querySelectorAll(this.targets)].filter((t): t is HTMLElement => t instanceof HTMLElement && t.offsetWidth > 0 && t.offsetHeight > 0);
      } catch {
        found = [];
      }
      return found.slice(0, MAX_ROWS);
    }
    // Down through single children (a wrapper, the component's own root) to the first level with several rows
    let root: HTMLElement = content;
    for (let depth = 0; depth < 6; depth++) {
      let kids = visibleChildren(root);
      // A component drawn on stacked layers (a tray behind a card) has no rows in the flow: take the layers that hold something
      if (!kids.length) kids = visibleChildren(root, true).filter((k) => k.children.length > 0);
      if (kids.length !== 1) return kids.slice(0, MAX_ROWS);
      root = kids[0];
    }
    return [root];
  }

  /** @internal Runs `fn` after `ms`, waiting while the frame is off screen */
  private later(fn: () => void, ms: number) {
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => (this.screen.onScreen ? fn() : this.later(fn, 250)), ms);
  }

  /** @internal Starts the walk over: after `delay`, or still on the first row */
  private restart() {
    clearTimeout(this.timer);
    this.round = 0;
    this.index = 0;
    if (!this.rows.length) return;
    if (!this.playing || reducedMotion()) {
      this.phase = "show";
      this.toggleAttribute("data-done", true);
      return;
    }
    this.toggleAttribute("data-done", false);
    this.phase = "idle";
    this.later(() => this.go(0), this.delay);
  }

  /** @internal The cursor travels to row i, then the frame, guides and chip draw; then on to the next */
  private go(i: number) {
    this.index = i;
    this.phase = "move";
    this.later(() => {
      this.phase = "show";
      this.later(() => {
        const next = i + 1;
        if (next < this.rows.length) return this.go(next);
        this.round++;
        if (this.round < this.rounds) return this.go(0);
        // Rest on the first row
        this.index = 0;
        this.phase = "move";
        this.later(() => {
          this.phase = "show";
          this.toggleAttribute("data-done", true);
        }, TRAVEL);
      }, Math.max(0, this.hold - TRAVEL));
    }, TRAVEL);
  }

  protected override render() {
    const row = this.rows[this.index];
    const [pt, pr, pb, pl] = row?.pad ?? [0, 0, 0, 0];
    const at = row ? `--x: ${row.x}px; --y: ${row.y}px; --fw: ${row.w}px; --fh: ${row.h}px` : "";
    // The guides: each padding as a line from the frame's edge inwards, with its number
    const guide = (side: "t" | "r" | "b" | "l", n: number) =>
      n > 0
        ? html`<span class="ui-isp-guide ui-isp-guide--${side}" style=${`--n: ${n}px`}><span class="ui-isp-num">${n}</span></span>`
        : nothing;
    return html`<div class="ui-isp-layer" aria-hidden="true" data-phase=${this.phase} style=${at}>
        ${row
          ? html`<div class="ui-isp-sel">
                <span class="ui-isp-handle ui-isp-handle--tl"></span><span class="ui-isp-handle ui-isp-handle--tr"></span>
                <span class="ui-isp-handle ui-isp-handle--bl"></span><span class="ui-isp-handle ui-isp-handle--br"></span>
                ${guide("t", pt)}${guide("r", pr)}${guide("b", pb)}${guide("l", pl)}
              </div>
              <span class="ui-isp-chip">W ${row.sizing} ${Math.round(row.w)}px</span>
              <svg class="ui-isp-cursor" viewBox="0 0 16 20">${svg`<path d="M1.5 1.5v15l4-3.6 2.7 5.6 2.6-1.2-2.6-5.5h5.4z"></path>`}</svg>`
          : nothing}
      </div><!---->`;
  }

  static override css = /* css */ `
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="isp"] {
  /* The selection, its handles and the width chip */
  --tc-inspect-frame-select: var(--tc-blue-600, #2456d6);
  --tc-inspect-frame-on-select: var(--tc-text-on-accent, #ffffff);
  /* The padding guides and their numbers */
  --tc-inspect-frame-guide: var(--tc-action-danger-bg, var(--tc-red-600));
  --tc-inspect-frame-on-guide: var(--tc-action-danger-fg, #ffffff);
  --tc-inspect-frame-handle-fill: var(--tc-surface-raised, light-dark(#ffffff, var(--tc-zinc-875)));
  --tc-inspect-frame-cursor: var(--tc-text-primary, light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9)));
  --tc-inspect-frame-cursor-edge: var(--tc-surface-raised, light-dark(#ffffff, var(--tc-zinc-875)));
  --tc-inspect-frame-tilt: rotateX(22deg) rotateY(-16deg) rotateZ(5deg);
  --tc-inspect-frame-tilt-mirror: rotateX(22deg) rotateY(16deg) rotateZ(-5deg);
  --tc-inspect-frame-perspective: 1100px;
  --tc-inspect-frame-width: 300px;
  --tc-inspect-frame-fade: linear-gradient(to right, #000 55%, transparent 98%);
  --tc-inspect-frame-fade-mirror: linear-gradient(to left, #000 55%, transparent 98%);
  --tc-inspect-frame-fade-y: linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent);
  --s: 1;
  --t: var(--tc-inspect-frame-tilt);
  position: relative;
  display: grid;
  place-content: center;
  width: 100%;
  aspect-ratio: 40 / 33;
  overflow: hidden;
  perspective: var(--tc-inspect-frame-perspective);
  font-family: var(--tc-font-sans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
  -webkit-mask-image: var(--tc-inspect-frame-fade), var(--tc-inspect-frame-fade-y);
  mask-image: var(--tc-inspect-frame-fade), var(--tc-inspect-frame-fade-y);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  pointer-events: none;
  user-select: none;
}
[data-ui="isp"][mirror] {
  --t: var(--tc-inspect-frame-tilt-mirror);
  -webkit-mask-image: var(--tc-inspect-frame-fade-mirror), var(--tc-inspect-frame-fade-y);
  mask-image: var(--tc-inspect-frame-fade-mirror), var(--tc-inspect-frame-fade-y);
}
[data-ui="isp"][flat] {
  --t: rotateX(0deg);
  -webkit-mask-image: none;
  mask-image: none;
}

/* Every layer in one cell, the same size and the same transform */
[data-ui="isp"] > * {
  grid-area: 1 / 1;
  position: relative;
  width: var(--w, var(--tc-inspect-frame-width));
  box-sizing: border-box;
  transform: scale(var(--s)) var(--t);
  transform-style: preserve-3d;
}
[data-ui="isp"][data-measuring] > * { transform: none; }

.ui-isp-layer { z-index: 1; }
.ui-isp-sel {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: var(--fw);
  height: var(--fh);
  box-sizing: border-box;
  border: 1.5px solid var(--tc-inspect-frame-select);
  opacity: 0;
  transition: left var(--tc-duration-slow, 320ms) var(--tc-ease-move, var(--tc-ease-out)), top var(--tc-duration-slow, 320ms) var(--tc-ease-move, var(--tc-ease-out)), width var(--tc-duration-slow, 320ms) var(--tc-ease-move, var(--tc-ease-out)), height var(--tc-duration-slow, 320ms) var(--tc-ease-move, var(--tc-ease-out)), opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-isp-handle {
  position: absolute;
  width: 7px;
  height: 7px;
  box-sizing: border-box;
  border: 1.5px solid var(--tc-inspect-frame-select);
  background: var(--tc-inspect-frame-handle-fill);
}
.ui-isp-handle--tl { left: -4px; top: -4px; }
.ui-isp-handle--tr { right: -4px; top: -4px; }
.ui-isp-handle--bl { left: -4px; bottom: -4px; }
.ui-isp-handle--br { right: -4px; bottom: -4px; }

/* A padding guide: a line from the frame's edge inwards, as long as the padding, with its number */
.ui-isp-guide {
  position: absolute;
  background: var(--tc-inspect-frame-guide);
  opacity: 0;
  transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease) var(--tc-duration-moderate, 260ms);
}
.ui-isp-guide--t, .ui-isp-guide--b { left: 50%; width: 1px; height: var(--n); }
.ui-isp-guide--t { top: 0; }
.ui-isp-guide--b { bottom: 0; }
.ui-isp-guide--l, .ui-isp-guide--r { top: 50%; height: 1px; width: var(--n); }
.ui-isp-guide--l { left: 0; }
.ui-isp-guide--r { right: 0; }
.ui-isp-num {
  position: absolute;
  left: 50%;
  top: 50%;
  translate: -50% -50%;
  padding: 0 var(--tc-space-0-5, 2px);
  border-radius: var(--tc-radius-xs, 4px);
  background: var(--tc-inspect-frame-guide);
  color: var(--tc-inspect-frame-on-guide);
  font-family: var(--tc-font-mono, ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace);
  font-size: var(--tc-font-size-2xs, 10px);
  font-weight: var(--tc-font-weight-semibold, 600);
  line-height: var(--tc-line-height-tight, 16px);
  white-space: nowrap;
}
.ui-isp-guide--t .ui-isp-num, .ui-isp-guide--b .ui-isp-num { left: calc(50% + 12px); }
.ui-isp-guide--l .ui-isp-num, .ui-isp-guide--r .ui-isp-num { top: calc(50% + 10px); }

/* The width chip, centred under the frame */
.ui-isp-chip {
  position: absolute;
  left: calc(var(--x) + var(--fw) / 2);
  top: calc(var(--y) + var(--fh) + 6px);
  translate: -50% 0;
  padding: 0 var(--tc-space-1, 4px);
  border-radius: var(--tc-radius-xs, 4px);
  background: var(--tc-inspect-frame-select);
  color: var(--tc-inspect-frame-on-select);
  font-family: var(--tc-font-mono, ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace);
  font-size: var(--tc-font-size-2xs, 10px);
  font-weight: var(--tc-font-weight-semibold, 600);
  line-height: var(--tc-line-height-tight, 16px);
  white-space: nowrap;
  opacity: 0;
  transition: left var(--tc-duration-slow, 320ms) var(--tc-ease-move, var(--tc-ease-out)), top var(--tc-duration-slow, 320ms) var(--tc-ease-move, var(--tc-ease-out)), opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease) var(--tc-duration-slow, 320ms);
}

/* The cursor: it waits off to the side, then travels to each row */
.ui-isp-cursor {
  position: absolute;
  left: calc(var(--x) + var(--fw) * 0.72);
  top: calc(var(--y) + var(--fh) * 0.55);
  width: 14px;
  height: 18px;
  fill: var(--tc-inspect-frame-cursor);
  stroke: var(--tc-inspect-frame-cursor-edge);
  stroke-width: 1.2;
  stroke-linejoin: round;
  transition: left var(--tc-duration-reveal, 700ms) var(--tc-ease-move, var(--tc-ease-out)), top var(--tc-duration-reveal, 700ms) var(--tc-ease-move, var(--tc-ease-out)), opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-isp-layer[data-phase="idle"] .ui-isp-cursor { left: calc(100% + 24px); top: calc(100% + 24px); opacity: 0; }
.ui-isp-layer[data-phase="show"] :is(.ui-isp-sel, .ui-isp-guide, .ui-isp-chip) { opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .ui-isp-sel, .ui-isp-guide, .ui-isp-chip, .ui-isp-cursor { transition: none; }
}
@media (forced-colors: active) {
  .ui-isp-sel, .ui-isp-handle { border-color: Highlight; }
  .ui-isp-guide, .ui-isp-num, .ui-isp-chip { forced-color-adjust: none; background: Highlight; color: HighlightText; }
}
`;
}

if (!customElements.get("tc-inspect-frame")) customElements.define("tc-inspect-frame", TcInspectFrame);

declare global {
  interface HTMLElementTagNameMap {
    "tc-inspect-frame": TcInspectFrame;
  }
}

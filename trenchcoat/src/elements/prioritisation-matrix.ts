import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-prioritisation-matrix> – value against effort, the 2 × 2 teams use to choose what to do next. Each item is a
 * numbered point at its effort (across, 0–10) and value (up, 0–10): Quick wins top left, Big bets top right, Fill-ins
 * bottom left, Time sinks bottom right. Beside the plot (under it when narrow), the items listed by quadrant with
 * counts; pointing at a row lights its point and pointing at a point lights its row.
 *   · drag a point (mouse, pen or touch) to move it, in half steps; or focus it and use the arrow keys – ← → effort,
 *     ↑ ↓ value, half a step each, two with Shift. Every move fires a cancelable tc-items-change ({ items, change })
 *     with the list as it will be – prevent it to keep the items yourself
 *   · points that land on the same spot gather into one with a count; click it to fan them out, Escape to gather
 *   · `readonly` keeps the points where they are
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-prioritisation-matrix .items=${[{ id: "a", label: "Open data portal", value: 8, effort: 3 }]}></tc-prioritisation-matrix>
 */

export type PrioritisationItem = { id: string; label: string; value: number; effort: number; group?: string; note?: string };
export type PrioritisationQuadrant = "quickWins" | "bigBets" | "fillIns" | "moneyPits";
export type PrioritisationLabels = Record<PrioritisationQuadrant, string>;

/** Details of the events */
export type PrioritisationItemsChange = { items: PrioritisationItem[]; change: { id: string; value: number; effort: number } };

export const defaultPrioritisationLabels: PrioritisationLabels = { quickWins: "Quick wins", bigBets: "Big bets", fillIns: "Fill-ins", moneyPits: "Time sinks" };
const ORDER: PrioritisationQuadrant[] = ["quickWins", "bigBets", "fillIns", "moneyPits"];

/** Which quadrant a value and effort fall in: value 5 and over is high, effort under 5 is low */
export function quadrantOf(value: number, effort: number): PrioritisationQuadrant {
  const high = value >= 5;
  const low = effort < 5;
  return high ? (low ? "quickWins" : "bigBets") : low ? "fillIns" : "moneyPits";
}

type Placed = { it: PrioritisationItem; n: number; value: number; effort: number; quadrant: PrioritisationQuadrant };

const clamp = (n: number) => Math.max(0, Math.min(10, n));
const half = (n: number) => Math.round(n * 2) / 2;
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
let uidCount = 0;

/* grid-2x2: Lucide (ISC, lucide.dev) */
const matrixIcon = svg`<path d="M12 3v18"></path><path d="M3 12h18"></path><rect x="3" y="3" width="18" height="18" rx="2"></rect>`;

/**
 * Value against effort, a 2 × 2 – numbered points you drag or move with the keys, gathered when they overlap, and the
 * items listed by quadrant beside it.
 * @tag tc-prioritisation-matrix
 * @fires tc-items-change - An item was moved ({ items, change }: PrioritisationItemsChange), by dragging or the arrow keys; cancelable – prevented, `items` stays as it was
 */
export class TcPrioritisationMatrix extends TcElement {
  static override ui = "pmx";

  /** The heading, and the plot's name */
  @property() accessor heading = "Prioritisation";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The items. Moved by the user unless tc-items-change is prevented */
  @property({ attribute: false }) accessor items: PrioritisationItem[] = [];
  /** The across axis's name */
  @property({ attribute: "x-label" }) accessor xLabel = "Effort";
  /** The up axis's name */
  @property({ attribute: "y-label" }) accessor yLabel = "Value";
  /** Names for the quadrants */
  @property({ attribute: false }) accessor labels: Partial<PrioritisationLabels> = {};
  /** Points can't be moved */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;

  @state() private accessor drag: { id: string; value: number; effort: number } | null = null;
  @state() private accessor lit: string | null = null;
  @state() private accessor fanned: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-pmx-${++uidCount}`;
  private plotRect: DOMRect | null = null;
  private moved = false;

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("items") && this.fanned && !this.clusters.some((c) => c.key === this.fanned)) this.fanned = null;
  }

  /* ---------- The model ---------- */

  private name(q: PrioritisationQuadrant) {
    return this.labels[q] ?? defaultPrioritisationLabels[q];
  }
  /** Each item with its number (its place in `items`) and where it's drawn – mid-drag where it's being dragged */
  private get placed(): Placed[] {
    return this.items.map((it, i) => {
      const d = this.drag?.id === it.id ? this.drag : null;
      const value = clamp(d ? d.value : it.value);
      const effort = clamp(d ? d.effort : it.effort);
      return { it, n: i + 1, value, effort, quadrant: quadrantOf(value, effort) };
    });
  }
  /** Points on the same spot (within a quarter step), gathered; a single item is a cluster of one */
  private get clusters() {
    const out: { key: string; value: number; effort: number; members: Placed[] }[] = [];
    for (const p of this.placed) {
      const near = this.drag?.id !== p.it.id && out.find((c) => !c.members.some((m) => m.it.id === this.drag?.id) && Math.abs(c.value - p.value) < 0.3 && Math.abs(c.effort - p.effort) < 0.3);
      if (near) near.members.push(p);
      else out.push({ key: p.it.id, value: p.value, effort: p.effort, members: [p] });
    }
    return out;
  }
  private describe(value: number, effort: number) {
    return `${this.yLabel} ${fmt(value)}, ${this.xLabel.toLowerCase()} ${fmt(effort)} – ${this.name(quadrantOf(value, effort))}`;
  }

  /* ---------- Moving ---------- */

  private commit(id: string, value: number, effort: number) {
    const before = this.items.find((i) => i.id === id);
    if (!before) return false;
    value = half(clamp(value));
    effort = half(clamp(effort));
    if (before.value === value && before.effort === effort) return false;
    const items = this.items.map((i) => (i.id === id ? { ...i, value, effort } : i));
    if (!this.emit<PrioritisationItemsChange>("tc-items-change", { items, change: { id, value, effort } }, { cancelable: true })) return false;
    this.items = items;
    const q = quadrantOf(value, effort);
    this.announce = `${before.label}: ${this.describe(value, effort)}${q !== quadrantOf(before.value, before.effort) ? `, now in ${this.name(q)}` : ""}`;
    return true;
  }

  private onPointerDown(e: PointerEvent, id: string) {
    if (this.readonly || e.button !== 0) return;
    const plot = this.querySelector<HTMLElement>(".ui-pmx__plot");
    if (!plot) return;
    this.plotRect = plot.getBoundingClientRect();
    this.moved = false;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // A pointer that isn't active can't be captured; the drag still follows events on the point
    }
    const it = this.items.find((i) => i.id === id)!;
    this.drag = { id, value: it.value, effort: it.effort };
  }
  private onPointerMove(e: PointerEvent) {
    if (!this.drag || !this.plotRect) return;
    const r = this.plotRect;
    const effort = half(clamp(((e.clientX - r.left) / r.width) * 10));
    const value = half(clamp(10 - ((e.clientY - r.top) / r.height) * 10));
    if (effort !== this.drag.effort || value !== this.drag.value) {
      this.moved = true;
      this.drag = { ...this.drag, value, effort };
    }
  }
  private onPointerUp() {
    const d = this.drag;
    this.drag = null;
    this.plotRect = null;
    if (d && this.moved) this.commit(d.id, d.value, d.effort);
  }

  private onKey(e: KeyboardEvent, id: string) {
    if (e.key === "Escape" && this.fanned) {
      e.preventDefault();
      const key = this.fanned;
      this.fanned = null;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-cluster="${CSS.escape(key)}"]`)?.focus());
      return;
    }
    if (this.readonly) return;
    const step = e.shiftKey ? 2 : 0.5;
    const it = this.items.find((i) => i.id === id);
    if (!it) return;
    const moves: Record<string, [number, number]> = { ArrowUp: [step, 0], ArrowDown: [-step, 0], ArrowRight: [0, step], ArrowLeft: [0, -step] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    if (this.commit(id, it.value + m[0], it.effort + m[1])) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-point="${CSS.escape(id)}"]`)?.focus());
  }

  /* ---------- Rendering ---------- */

  private point(p: Placed, dx = 0, dy = 0) {
    const id = `${this.uid}-d-${p.it.id}`;
    return html`<button
        type="button"
        class="ui-pmx__point"
        data-point=${p.it.id}
        data-quadrant=${p.quadrant}
        ?data-lit=${this.lit === p.it.id}
        ?data-dragging=${this.drag?.id === p.it.id}
        aria-describedby=${id}
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
        aria-disabled=${this.readonly ? "true" : "false"}
        style=${`left:calc(${p.effort * 10}% + ${dx}px);top:calc(${(10 - p.value) * 10}% + ${dy}px)`}
        @pointerdown=${(e: PointerEvent) => this.onPointerDown(e, p.it.id)}
        @pointermove=${(e: PointerEvent) => this.onPointerMove(e)}
        @pointerup=${() => this.onPointerUp()}
        @pointercancel=${() => (this.drag = null)}
        @pointerenter=${() => (this.lit = p.it.id)}
        @pointerleave=${() => (this.lit = null)}
        @focus=${() => (this.lit = p.it.id)}
        @blur=${() => (this.lit = null)}
        @keydown=${(e: KeyboardEvent) => this.onKey(e, p.it.id)}
      >
        <span aria-hidden="true">${p.n}</span><span class="tc-sr-only">${p.it.label}</span>
        <span class="ui-pmx__tip" aria-hidden="true">${p.it.label}</span>
      </button>
      <span class="tc-sr-only" id=${id}>${this.describe(p.value, p.effort)}</span>`;
  }

  private renderPlot() {
    const clusters = this.clusters;
    return html`<div class="ui-pmx__figure">
      <div class="ui-pmx__ylabel" aria-hidden="true">${this.yLabel} →</div>
      <div class="ui-pmx__plot" role="group" aria-label=${`${this.heading}: ${this.yLabel.toLowerCase()} up, ${this.xLabel.toLowerCase()} across`} aria-describedby=${`${this.uid}-keys`}>
        ${ORDER.map((q) => html`<span class="ui-pmx__quad" data-quadrant=${q} aria-hidden="true"><span class="ui-pmx__quad-name">${this.name(q)}</span></span>`)}
        ${repeat(
          clusters,
          (c) => c.key,
          (c) => {
            if (c.members.length === 1) return this.point(c.members[0]);
            if (this.fanned === c.key) {
              const n = c.members.length;
              return html`${c.members.map((m, i) => {
                const a = (2 * Math.PI * i) / n - Math.PI / 2;
                return this.point(m, Math.round(Math.cos(a) * 26), Math.round(Math.sin(a) * 26));
              })}`;
            }
            const names = c.members.map((m) => m.it.label).join(", ");
            return html`<button
              type="button"
              class="ui-pmx__point ui-pmx__cluster"
              data-cluster=${c.key}
              data-quadrant=${quadrantOf(c.value, c.effort)}
              aria-expanded="false"
              style=${`left:${c.effort * 10}%;top:${(10 - c.value) * 10}%`}
              @click=${() => {
                this.fanned = c.key;
                void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-point="${CSS.escape(c.members[0].it.id)}"]`)?.focus());
              }}
            >
              <span aria-hidden="true">${c.members.length}</span><span class="tc-sr-only">${c.members.length} items here: ${names}. Show them</span>
              <span class="ui-pmx__tip" aria-hidden="true">${names}</span>
            </button>`;
          },
        )}
      </div>
      <div class="ui-pmx__xlabel" aria-hidden="true">${this.xLabel} →</div>
    </div>`;
  }

  private renderList() {
    const placed = this.placed;
    return html`<div class="ui-pmx__lists">
      ${ORDER.map((q) => {
        const rows = placed.filter((p) => p.quadrant === q).sort((a, b) => b.value - a.value || a.effort - b.effort);
        return html`<section class="ui-pmx__group" data-quadrant=${q} aria-labelledby=${`${this.uid}-q-${q}`}>
          <h4 class="ui-pmx__group-name" id=${`${this.uid}-q-${q}`}><span class="ui-pmx__swatch" aria-hidden="true"></span>${this.name(q)} <span class="ui-pmx__count">${rows.length}</span></h4>
          ${rows.length
            ? html`<ul class="ui-pmx__rows">
                ${rows.map(
                  (p) => html`<li
                    class="ui-pmx__row"
                    ?data-lit=${this.lit === p.it.id}
                    @pointerenter=${() => (this.lit = p.it.id)}
                    @pointerleave=${() => (this.lit = null)}
                  >
                    <span class="ui-pmx__num" aria-hidden="true">${p.n}</span>
                    <span class="ui-pmx__row-main">
                      <span class="ui-pmx__row-label">${p.it.label}</span>
                      ${p.it.group || p.it.note ? html`<span class="ui-pmx__row-note">${[p.it.group, p.it.note].filter(Boolean).join(" · ")}</span>` : nothing}
                    </span>
                    <span class="ui-pmx__scores"><abbr title=${this.yLabel}>${this.yLabel.charAt(0)}</abbr> ${fmt(p.value)} · <abbr title=${this.xLabel}>${this.xLabel.charAt(0)}</abbr> ${fmt(p.effort)}</span>
                  </li>`,
                )}
              </ul>`
            : html`<p class="ui-pmx__none">None</p>`}
        </section>`;
      })}
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: matrixIcon, title: this.heading, subtitle: this.description, id: `${id}-title`, aside: html`<span class="ui-pmx__total">${this.items.length} ${this.items.length === 1 ? "item" : "items"}</span>` })}
      <div class="ui-pmx__card">
        ${this.items.length ? html`${this.renderPlot()}${this.renderList()}` : html`<p class="ui-pmx__empty">Nothing to place yet.</p>`}
        <p class="tc-sr-only" id=${`${id}-keys`}>${this.readonly ? "" : `Arrow keys move the focused item: up and down for ${this.yLabel.toLowerCase()}, left and right for ${this.xLabel.toLowerCase()}; Shift for bigger steps.`}</p>
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="pmx"] {
  --tc-pmx-point: 28px;
  --tc-pmx-plot-max: 420px;
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pmx"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-pmx__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pmx"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-pmx__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="pmx"] *, [data-ui="pmx"] *::before, [data-ui="pmx"] *::after { box-sizing: border-box; }
:where([data-ui="pmx"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="pmx"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="pmx"]) :is(h4, p, ul) { margin: 0; padding: 0; }
[data-ui="pmx"] ul { list-style: none; }
[data-ui="pmx"] abbr { text-decoration: none; }
.ui-pmx__total { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- Plot beside the lists; the lists go under it when narrow ----- */
.ui-pmx__card { display: grid; grid-template-columns: minmax(0, var(--tc-pmx-plot-max)) minmax(0, 1fr); gap: var(--tc-space-5); padding: var(--tc-space-4); }
.ui-pmx__figure { display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-rows: auto auto; gap: var(--tc-space-1-5); align-self: start; }
.ui-pmx__ylabel { grid-row: 1; display: flex; align-items: center; justify-content: center; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); writing-mode: vertical-rl; transform: rotate(180deg); }
.ui-pmx__xlabel { grid-column: 2; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); text-align: center; }
.ui-pmx__plot { position: relative; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; aspect-ratio: 1; overflow: visible; border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); touch-action: none; }
.ui-pmx__quad { position: relative; display: block; padding: var(--tc-space-2) var(--tc-space-2-5); background: var(--pmx-bg); }
.ui-pmx__quad[data-quadrant="quickWins"] { border-top-left-radius: var(--tc-radius-lg); border-right: 1px dashed var(--tc-border-default); border-bottom: 1px dashed var(--tc-border-default); }
.ui-pmx__quad[data-quadrant="bigBets"] { border-top-right-radius: var(--tc-radius-lg); border-bottom: 1px dashed var(--tc-border-default); text-align: right; }
.ui-pmx__quad[data-quadrant="fillIns"] { border-bottom-left-radius: var(--tc-radius-lg); border-right: 1px dashed var(--tc-border-default); display: flex; align-items: flex-end; }
.ui-pmx__quad[data-quadrant="moneyPits"] { border-bottom-right-radius: var(--tc-radius-lg); display: flex; align-items: flex-end; justify-content: flex-end; }
[data-quadrant="quickWins"] { --pmx-bg: color-mix(in srgb, var(--tc-status-success-bg) 70%, transparent); --pmx-solid: var(--tc-status-success-solid); --pmx-fg: var(--tc-status-success-fg); }
[data-quadrant="bigBets"] { --pmx-bg: color-mix(in srgb, var(--tc-status-info-bg) 70%, transparent); --pmx-solid: var(--tc-status-info-solid); --pmx-fg: var(--tc-status-info-fg); }
[data-quadrant="fillIns"] { --pmx-bg: var(--tc-fill-subtle); --pmx-solid: var(--tc-text-muted); --pmx-fg: var(--tc-text-secondary); }
[data-quadrant="moneyPits"] { --pmx-bg: color-mix(in srgb, var(--tc-status-warning-bg) 70%, transparent); --pmx-solid: var(--tc-status-warning-solid); --pmx-fg: var(--tc-status-warning-fg); }
.ui-pmx__quad-name { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--pmx-fg); }
/* Points: numbered dots centred on their spot */
.ui-pmx__point { position: absolute; z-index: 1; display: grid; place-items: center; width: var(--tc-pmx-point); height: var(--tc-pmx-point); margin: calc(var(--tc-pmx-point) / -2) 0 0 calc(var(--tc-pmx-point) / -2); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 2px var(--pmx-solid), var(--tc-shadow-control); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; cursor: grab; touch-action: none; transition: transform var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="pmx"][readonly] .ui-pmx__point:not(.ui-pmx__cluster) { cursor: default; }
.ui-pmx__point[data-lit], .ui-pmx__point:hover { z-index: 2; transform: scale(1.12); background: var(--pmx-solid); color: var(--tc-text-on-accent); }
.ui-pmx__point[data-dragging] { z-index: 3; cursor: grabbing; transform: scale(1.2); transition: none; }
.ui-pmx__cluster { background: var(--pmx-solid); color: var(--tc-text-on-accent); cursor: pointer; box-shadow: 0 0 0 3px var(--tc-surface-raised), 0 0 0 4px var(--pmx-solid); }
.ui-pmx__tip { position: absolute; bottom: calc(100% + var(--tc-space-1-5)); left: 50%; display: none; max-width: 14rem; padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-surface-inverse); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-on-inverse); white-space: nowrap; transform: translateX(-50%); pointer-events: none; }
.ui-pmx__point:is(:hover, :focus-visible, [data-dragging]) .ui-pmx__tip { display: block; }
.ui-pmx__point[data-lit] .ui-pmx__tip { display: block; }
/* ----- Lists by quadrant ----- */
.ui-pmx__lists { display: grid; align-content: start; gap: var(--tc-space-3); }
.ui-pmx__group { display: grid; gap: var(--tc-space-1); }
.ui-pmx__group-name { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-pmx__swatch { width: var(--tc-space-2-5); height: var(--tc-space-2-5); border-radius: var(--tc-radius-2xs); background: var(--pmx-solid); }
.ui-pmx__count { display: inline-grid; place-items: center; min-width: var(--tc-space-5); height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-pmx__rows { display: grid; }
.ui-pmx__row { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-menu-item-radius); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-pmx__row[data-lit] { background: var(--tc-menu-item-hover); }
.ui-pmx__num { display: inline-grid; flex: none; place-items: center; width: var(--tc-space-5); height: var(--tc-space-5); border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1.5px var(--pmx-solid); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-pmx__row-main { display: grid; flex: 1; min-width: 0; }
.ui-pmx__row-label { overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-pmx__row-note { overflow: hidden; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-pmx__scores { flex: none; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-pmx__none { padding: 0 var(--tc-space-2); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-pmx__empty { grid-column: 1 / -1; padding: var(--tc-space-6) 0; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 620px) {
  .ui-pmx__card { grid-template-columns: minmax(0, 1fr); }
  .ui-pmx__figure { max-width: var(--tc-pmx-plot-max); width: 100%; justify-self: center; }
}
@media (forced-colors: active) {
  .ui-pmx__point { border: 2px solid CanvasText; }
  .ui-pmx__point[data-lit] { outline: 2px solid Highlight; }
  .ui-pmx__quad { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="pmx"] *, [data-ui="pmx"] *::before, [data-ui="pmx"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-prioritisation-matrix")) customElements.define("tc-prioritisation-matrix", TcPrioritisationMatrix);

declare global {
  interface HTMLElementTagNameMap {
    "tc-prioritisation-matrix": TcPrioritisationMatrix;
  }
}

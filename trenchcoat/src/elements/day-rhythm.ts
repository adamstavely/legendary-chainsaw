import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-day-rhythm> – a typical day as a strip: blocks of time from midnight to midnight, each block a kind of place or
 * activity (Home, Work, Transit … – the page names the kinds) and, optionally, the place itself. One strip, or a row
 * per kind of day (weekdays, weekend) with the row's name beside it. Hour ticks run along the bottom, a legend names
 * the kinds, and an optional marker shows the time now. Each block carries its kind's colour and, when it's wide
 * enough, its kind in words – colour is never the only cue; the readout under the strips names the block under the
 * pointer or focus in full: "Work · 08:00–18:00 · Harbour office".
 *   · a block that runs past midnight (22:00–07:00) is drawn as two pieces, the evening and the morning
 *   · the blocks are one tab stop: ← / → move along the row, ↑ / ↓ to the block at the same time in the next row,
 *     Home / End to the row's ends; Enter or Space fires tc-select
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-day-rhythm .kinds=${[{ id: "home", label: "Home" }]} .rows=${[{ id: "wk", label: "Weekdays", segments: [{ start: 0, end: 420, kind: "home" }] }]}></tc-day-rhythm>
 */

/** A sun over a horizon: Lucide sunrise (ISC, lucide.dev) */
const dayIcon = svg`<path d="M12 2v8"></path><path d="m4.93 10.93 1.41 1.41"></path><path d="M2 18h2"></path><path d="M20 18h2"></path><path d="m19.07 10.93-1.41 1.41"></path><path d="M22 22H2"></path><path d="m8 6 4-4 4 4"></path><path d="M16 18a4 4 0 0 0-8 0"></path>`;

export type RhythmKind = {
  id: string;
  /** The kind's name, in the legend and on wide blocks: "Work" */
  label: string;
  /** Which chart colour, 1–6; by default the kinds take them in order */
  color?: number;
};
export type RhythmSegment = {
  /** Minutes from midnight, 0–1440 */
  start: number;
  /** Minutes from midnight, 0–1440; less than `start` when the block runs past midnight */
  end: number;
  /** A kind's id */
  kind: string;
  /** Where or what, in the readout: "Harbour office" */
  place?: string;
};
export type RhythmRow = {
  id: string;
  /** The row's name beside its strip, e.g. "Weekdays"; with one row it can be left out */
  label?: string;
  segments: RhythmSegment[];
};

/** Details of the events */
export type RhythmSelect = { row: string; segment: RhythmSegment };

const DAY = 1440;
const TICKS = [0, 360, 720, 1080, 1440];
/** Blocks at least this long (in minutes) show their kind in words */
const WORDS_FROM = 150;
let uidCount = 0;

/** "08:00", "24:00" */
export const rhythmTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`;
const clamp = (m: number) => Math.max(0, Math.min(DAY, m));

type Piece = { seg: RhythmSegment; start: number; end: number };

/**
 * A typical day as a strip of blocks by kind of place or activity, one row per kind of day, with hour ticks, a legend,
 * a now marker and a readout of the block under the pointer or focus.
 * @tag tc-day-rhythm
 * @fires tc-select - A block was chosen with Enter, Space or a click ({ row, segment }: RhythmSelect)
 */
export class TcDayRhythm extends TcElement {
  static override ui = "drh";

  /** The heading */
  @property() accessor heading = "Daily rhythm";
  /** One line under the heading, e.g. "Typical day, last 30 days" */
  @property() accessor description: string | undefined = undefined;
  /** The kinds of place or activity, in legend order */
  @property({ attribute: false }) accessor kinds: RhythmKind[] = [];
  /** The strips, top to bottom */
  @property({ attribute: false }) accessor rows: RhythmRow[] = [];
  /** A marker at this time, in minutes from midnight; none when unset */
  @property({ type: Number }) accessor now: number | undefined = undefined;

  @state() private accessor active = { r: 0, i: 0 };
  @state() private accessor shown: { r: number; i: number } | null = null;

  private uid = `tc-drh-${++uidCount}`;

  /* ---------- The model ---------- */

  /** A row's pieces in time order; a block past midnight is two pieces */
  private pieces(row: RhythmRow | undefined): Piece[] {
    const out: Piece[] = [];
    for (const seg of row?.segments ?? []) {
      const s = clamp(seg.start);
      const e = clamp(seg.end);
      if (e > s) out.push({ seg, start: s, end: e });
      else if (e < s) {
        out.push({ seg, start: s, end: DAY });
        if (e > 0) out.push({ seg, start: 0, end: e });
      }
    }
    return out.sort((a, b) => a.start - b.start);
  }
  private kindOf(id: string) {
    return this.kinds.find((k) => k.id === id);
  }
  private colorOf(id: string) {
    const i = this.kinds.findIndex((k) => k.id === id);
    const k = this.kinds[i];
    const n = k?.color ?? (i < 0 ? 0 : (i % 6) + 1);
    return n >= 1 && n <= 6 ? `var(--tc-chart-${Math.round(n)})` : "var(--tc-chart-neutral)";
  }
  private say(seg: RhythmSegment) {
    const kind = this.kindOf(seg.kind)?.label ?? seg.kind;
    return [kind, `${rhythmTime(clamp(seg.start))}–${rhythmTime(clamp(seg.end))}`, seg.place].filter(Boolean).join(" · ");
  }

  /* ---------- Keyboard ---------- */

  private focusPiece(r: number, i: number) {
    const rows = this.rows.map((row) => this.pieces(row));
    if (!rows.some((p) => p.length)) return;
    r = Math.max(0, Math.min(rows.length - 1, r));
    // An empty row hands the move on to the next row that has blocks, in the same direction
    i = Math.max(0, Math.min(rows[r].length - 1, i));
    if (!rows[r].length) return;
    this.active = { r, i };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-piece="${r}:${i}"]`)?.focus());
  }

  /** The piece in row `to` at the middle of piece `i` of row `from` – or the nearest one */
  private across(from: number, i: number, to: number) {
    const src = this.pieces(this.rows[from])[i];
    const dst = this.pieces(this.rows[to]);
    if (!src || !dst.length) return 0;
    const mid = (src.start + src.end) / 2;
    let best = 0;
    dst.forEach((p, j) => {
      const d = mid < p.start ? p.start - mid : mid > p.end ? mid - p.end : 0;
      const b = dst[best];
      const db = mid < b.start ? b.start - mid : mid > b.end ? mid - b.end : 0;
      if (d < db) best = j;
    });
    return best;
  }

  private onKey = (e: KeyboardEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-piece]");
    if (!el || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const [r, i] = el.dataset.piece!.split(":").map(Number);
    const count = this.pieces(this.rows[r]).length;
    let next: [number, number] | null = null;
    if (e.key === "ArrowLeft") next = [r, i - 1];
    else if (e.key === "ArrowRight") next = [r, i + 1];
    else if (e.key === "Home") next = [r, 0];
    else if (e.key === "End") next = [r, count - 1];
    else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const step = e.key === "ArrowUp" ? -1 : 1;
      let to = r + step;
      while (this.rows[to] && !this.pieces(this.rows[to]).length) to += step;
      if (!this.rows[to]) {
        e.preventDefault();
        return;
      }
      next = [to, this.across(r, i, to)];
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.choose(r, i);
      return;
    }
    if (next) {
      e.preventDefault();
      this.focusPiece(next[0], next[1]);
    }
  };

  private choose(r: number, i: number) {
    const row = this.rows[r];
    const piece = row && this.pieces(row)[i];
    if (piece) this.emit<RhythmSelect>("tc-select", { row: row.id, segment: piece.seg });
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("rows")) {
      // The tab stop stays on a block that's still there
      const { r, i } = this.active;
      const rows = this.rows.map((row) => this.pieces(row));
      if (!rows[r]?.[i]) {
        const first = rows.findIndex((p) => p.length);
        this.active = rows[r]?.length ? { r, i: rows[r].length - 1 } : { r: Math.max(0, first), i: 0 };
      }
      if (this.shown && !rows[this.shown.r]?.[this.shown.i]) this.shown = null;
    }
  }

  /* ---------- Rendering ---------- */

  private renderRow(row: RhythmRow, r: number, labelled: boolean, now: number | undefined) {
    const pieces = this.pieces(row);
    return html`<div class="ui-drh__row">
      ${labelled ? html`<span class="ui-drh__row-label" id=${`${this.uid}-row-${r}`}>${row.label ?? ""}</span>` : nothing}
      <div class="ui-drh__track">
      <ul class="ui-drh__strip" aria-labelledby=${labelled ? `${this.uid}-row-${r}` : `${this.uid}-title`} aria-describedby=${`${this.uid}-keys`}>
        ${pieces.map((p, i) => {
          const isActive = this.active.r === r && this.active.i === i;
          const kind = this.kindOf(p.seg.kind);
          const style = `left: ${(p.start / DAY) * 100}%; width: ${((p.end - p.start) / DAY) * 100}%; --tc-drh-color: ${this.colorOf(p.seg.kind)}`;
          return html`<li class="ui-drh__item" style=${style}>
            <button
              type="button"
              class="ui-drh__seg"
              data-piece=${`${r}:${i}`}
              data-kind=${p.seg.kind}
              tabindex=${isActive ? 0 : -1}
              aria-label=${this.say(p.seg)}
              @focus=${() => {
                if (!isActive) this.active = { r, i };
                this.shown = { r, i };
              }}
              @blur=${() => {
                if (this.shown?.r === r && this.shown.i === i) this.shown = null;
              }}
              @pointerenter=${() => (this.shown = { r, i })}
              @click=${() => {
                this.active = { r, i };
                this.choose(r, i);
              }}
            >${p.end - p.start >= WORDS_FROM ? html`<span class="ui-drh__seg-label" aria-hidden="true">${kind?.label ?? p.seg.kind}</span>` : nothing}</button>
          </li>`;
        })}
      </ul>
      ${now === undefined ? nothing : html`<span class="ui-drh__now-line" style=${`left: ${(now / DAY) * 100}%`} aria-hidden="true"></span>`}
      </div>
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const labelled = this.rows.length > 1 || this.rows.some((r) => r.label);
    const empty = !this.rows.some((r) => this.pieces(r).length);
    const shown = this.shown && this.pieces(this.rows[this.shown.r])[this.shown.i];
    const now = this.now === undefined ? undefined : clamp(this.now);
    return html`
      <span class="ui-drh__sr" id=${`${id}-keys`}>Arrow keys move between blocks; up and down move between rows</span>
      ${now === undefined ? nothing : html`<span class="ui-drh__sr">Now ${rhythmTime(now)}</span>`}
      ${cardHead({ icon: dayIcon, title: this.heading, subtitle: this.description, id: `${id}-title` })}
      <div class="ui-drh__card">
        ${empty
          ? html`<p class="ui-drh__empty">No day to show yet.</p>`
          : html`<div class="ui-drh__body" ?data-labelled=${labelled} @keydown=${this.onKey} @pointerleave=${() => (this.shown = null)}>
                ${this.rows.map((row, r) => this.renderRow(row, r, labelled, now))}
                <div class="ui-drh__axis" aria-hidden="true">
                  ${labelled ? html`<span></span>` : nothing}
                  <span class="ui-drh__ticks">
                    ${TICKS.map((t) => html`<span class="ui-drh__tick" style=${`left: ${(t / DAY) * 100}%`}>${rhythmTime(t).slice(0, 2)}</span>`)}
                    ${now === undefined ? nothing : html`<span class="ui-drh__now" style=${`left: ${(now / DAY) * 100}%`}>Now ${rhythmTime(now)}</span>`}
                  </span>
                </div>
              </div>
              <div class="ui-drh__foot">
                <span class="ui-drh__readout" aria-hidden="true">${shown ? this.say(shown.seg) : html`<span class="ui-drh__hint">Point at a block to see it in full</span>`}</span>
                <ul class="ui-drh__legend" aria-label="Legend">
                  ${this.kinds.map((k) => html`<li class="ui-drh__key"><span class="ui-drh__swatch" style=${`--tc-drh-color: ${this.colorOf(k.id)}`} aria-hidden="true"></span>${k.label}</li>`)}
                </ul>
              </div>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="drh"] {
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
  --tc-drh-bg: var(--tc-surface-on-tray);
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="drh"] {
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
  --tc-drh-bg: var(--tc-surface-raised);
}
[data-ui="drh"] *, [data-ui="drh"] *::before, [data-ui="drh"] *::after { box-sizing: border-box; }
[data-ui="drh"] p { margin: 0; }
[data-ui="drh"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="drh"] svg { display: block; flex: none; }
:where([data-ui="drh"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-drh__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-drh__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The strips: a row label column when there are rows, then the day ----- */
.ui-drh__body { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-drh__body { padding-top: var(--tc-space-1); }
.ui-drh__row, .ui-drh__axis { display: grid; grid-template-columns: minmax(0, 1fr); align-items: center; gap: var(--tc-space-3); }
.ui-drh__body[data-labelled] :is(.ui-drh__row, .ui-drh__axis) { grid-template-columns: 76px minmax(0, 1fr); }
.ui-drh__row-label { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-drh__row-label { font-weight: var(--tc-font-weight-medium); }
.ui-drh__strip { position: relative; height: 30px; overflow: hidden; border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-drh__item { position: absolute; top: 0; bottom: 0; }
/* A block: its kind's colour as a tint with a solid edge, so the words on it stay readable */
.ui-drh__seg {
  position: absolute; inset: 0 1px 0 0; display: flex; align-items: center; min-width: 2px; overflow: hidden; padding: 0 var(--tc-space-2) 0 var(--tc-space-2-5);
  background: color-mix(in oklab, var(--tc-drh-color) 26%, var(--tc-drh-bg));
  box-shadow: inset 3px 0 0 var(--tc-drh-color);
  outline: none;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-drh__seg:hover { background: color-mix(in oklab, var(--tc-drh-color) 40%, var(--tc-drh-bg)); }
.ui-drh__seg:focus-visible { box-shadow: inset 3px 0 0 var(--tc-drh-color), inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-drh__seg-label { overflow: hidden; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
/* ----- The hour ticks and the now marker ----- */
.ui-drh__ticks { position: relative; height: 14px; }
.ui-drh__tick { position: absolute; top: 0; font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; transform: translateX(-50%); }
.ui-drh__tick:first-child { transform: none; }
.ui-drh__tick:nth-child(5) { transform: translateX(-100%); }
.ui-drh__track { position: relative; }
.ui-drh__now-line { position: absolute; top: calc(-1 * var(--tc-space-1)); bottom: calc(-1 * var(--tc-space-1)); width: 2px; border-radius: var(--tc-radius-full); background: var(--tc-text-primary); box-shadow: 0 0 0 var(--tc-hairline) var(--tc-drh-bg); transform: translateX(-50%); pointer-events: none; }
.ui-drh__now { position: absolute; top: 0; z-index: 1; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-surface-inverse); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-on-inverse); font-variant-numeric: tabular-nums; transform: translateX(-50%); white-space: nowrap; }
/* ----- The readout and the legend ----- */
.ui-drh__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-4); padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
.ui-drh__readout { min-width: 0; color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-drh__hint { color: var(--tc-text-muted); }
.ui-drh__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5) var(--tc-space-3); color: var(--tc-text-secondary); }
.ui-drh__key { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-drh__swatch { width: 10px; height: 10px; border-radius: var(--tc-radius-2xs); background: color-mix(in oklab, var(--tc-drh-color) 26%, var(--tc-drh-bg)); box-shadow: inset 3px 0 0 var(--tc-drh-color); }
.ui-drh__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 420px) {
  .ui-drh__body[data-labelled] :is(.ui-drh__row, .ui-drh__axis) { grid-template-columns: 56px minmax(0, 1fr); }
  .ui-drh__seg-label { display: none; }
}
@media (forced-colors: active) {
  .ui-drh__seg { border: 1px solid CanvasText; }
  .ui-drh__seg:focus-visible { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="drh"] *, [data-ui="drh"] *::before, [data-ui="drh"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-day-rhythm")) customElements.define("tc-day-rhythm", TcDayRhythm);

declare global {
  interface HTMLElementTagNameMap {
    "tc-day-rhythm": TcDayRhythm;
  }
}

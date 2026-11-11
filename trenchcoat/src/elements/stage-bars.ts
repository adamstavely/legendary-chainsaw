import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { MotionController } from "./internal/chart/motion-controller";
import { RollingController } from "./internal/controllers";

/*
 * <tc-stage-bars> – a funnel written as a list: one row per stage, its name in a column as wide as the longest name, a
 * rounded pill on a track as long as its share of the first stage, then the count and that share. The headline is the
 * first stage's count with the change against the period before; pointing at a stage (or moving to it with the keys)
 * emphasises its pill, quiets the rest and rolls the headline to that stage. Stat tiles under the list repeat each
 * stage's count. `ranges` adds a period switch in the header – each range has its own stages – and the pills grow in
 * again when it changes. The pills grow in when the card first comes on screen.
 *   · the rows are a listbox: one tab stop, arrows and Home/End move, Enter or Space picks a stage (`stage`)
 *   · a Table button swaps the list for a table of every stage's count and share
 *   · narrow, the shares column goes before the counts do, and the tiles drop to two a row, then one
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-stage-bars heading="Case pipeline" .stages=${[{ label: "Flagged", value: 1180 }, …]}></tc-stage-bars>
 */

export type StageBarsStage = {
  label: string;
  value: number;
  /** The pill's colour: any CSS colour or token – by default the chart colour for the stage's place */
  color?: string;
  /** SVG path data for a 24×24 stroked icon, drawn at 14px at the pill's left end */
  icon?: string;
};

export type StageBarsRange = {
  id: string;
  /** The switch's word for it: "7 days" */
  label: string;
  stages: StageBarsStage[];
  /** Change in the first stage against the period before, in percent */
  delta?: number;
};

export type StageBarsView = "chart" | "table";

/** Details of the events */
export type StageBarsRangeChange = { range: string };
export type StageBarsStageChange = { stage: number | null; item: StageBarsStage | null };
export type StageBarsViewChange = { view: StageBarsView };

export type StageBarsLabels = {
  /** The Table button */
  table: string;
  /** The period switch's name */
  period: string;
  /** The table's columns */
  stage: string;
  value: string;
  share: string;
  /** Read after each share: "67% of first stage" */
  ofFirst: string;
  /** The change chip, read: "up 2.4% on the period before" */
  up: string;
  down: string;
  /** Announced when a stage is picked */
  selected: string;
  /** No stages */
  empty: string;
};

export const defaultStageBarsLabels: StageBarsLabels = {
  table: "Table",
  period: "Period",
  stage: "Stage",
  value: "Count",
  share: "Share of first",
  ofFirst: "of first stage",
  up: "up",
  down: "down",
  selected: "Selected",
  empty: "No stages yet",
};

/** Bars narrowing: Lucide's chart-bar-decreasing (ISC, lucide.dev) */
const stagesIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M7 6h12"></path><path d="M7 11h8"></path><path d="M7 16h3"></path>`;

const INTEGER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

let uid = 0;

type Row = StageBarsStage & { i: number; share: number; ink: string };

/**
 * A funnel as a list: a pill per stage sized to its share of the first, the counts and shares beside it, a headline that
 * follows the pointer, stat tiles, an optional period switch and a table view.
 * @tag tc-stage-bars
 * @fires tc-range-change - A period was picked ({ range }: StageBarsRangeChange); cancelable – prevented, `range` stays as it was
 * @fires tc-stage-change - A stage was picked with a click, Enter or Space, or let go ({ stage, item }: StageBarsStageChange); cancelable – prevented, `stage` stays as it was
 * @fires tc-view-change - The Table button was pressed ({ view }: StageBarsViewChange); cancelable – prevented, `view` stays as it was
 */
export class TcStageBars extends TcElement {
  static override ui = "stgb";

  /** The heading, and the list's name */
  @property() accessor heading = "Stages";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The stages, top of the funnel first – used when there are no `ranges` */
  @property({ attribute: false }) accessor stages: StageBarsStage[] = [];
  /** Periods, each with its own stages and change – adds a switch to the header */
  @property({ attribute: false }) accessor ranges: StageBarsRange[] | undefined = undefined;
  /** The chosen range's id; unset is the first */
  @property() accessor range: string | undefined = undefined;
  /** Change in the first stage against the period before, in percent – a range's own `delta` wins */
  @property({ type: Number }) accessor delta: number | undefined = undefined;
  /** The picked stage's index, or null for none – it stays emphasised while nothing else is pointed at */
  @property({ type: Number }) accessor stage: number | null = null;
  /** Draws every pill in one ink instead of a colour per stage */
  @property({ type: Boolean, reflect: true }) accessor mono = false;
  /** Draws the stages' icons at the pills' left ends; show-icons="false" hides them */
  @property({ attribute: "show-icons", converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor showIcons = true;
  /** Formats every count */
  @property({ attribute: false }) accessor format: (value: number) => string = (n) => INTEGER.format(n);
  /** The list or the table */
  @property() accessor view: StageBarsView = "chart";
  /** Draws everything where it ends, with no entrance */
  @property({ type: Boolean }) accessor still = false;
  /** Words the page can rename, merged over `defaultStageBarsLabels` */
  @property({ attribute: false }) accessor labels: Partial<StageBarsLabels> = {};

  /** @internal The stage under the pointer or the focus */
  @state() accessor active: number | null = null;
  /** @internal The row that holds the list's tab stop */
  @state() accessor current = 0;
  /** @internal The card has come on screen */
  @state() accessor onScreen = false;
  /** @internal What the status region says */
  @state() accessor spoken = "";

  private readonly uid = `tc-stgb-${++uid}`;
  private rows: Row[] = [];
  private readonly motion = new MotionController<number>(this);
  private readonly rolling = new RollingController(this, () => ({ figure: this.figureRow?.value ?? 0 }), 520);
  private io?: IntersectionObserver;

  /** @internal The words, the page's over the defaults */
  get words(): StageBarsLabels {
    return { ...defaultStageBarsLabels, ...this.labels };
  }

  /** @internal The range in use */
  get activeRange(): StageBarsRange | undefined {
    const ranges = this.ranges;
    if (!ranges?.length) return undefined;
    return ranges.find((r) => r.id === this.range) ?? ranges[0];
  }

  /** The stages shown: the chosen range's, else `stages` */
  get shownStages(): StageBarsStage[] {
    return this.activeRange?.stages ?? this.stages;
  }

  /** @internal The stage the headline shows: the pointed-at one, else the picked one, else the first */
  private get figureRow(): Row | undefined {
    const at = this.active ?? (this.stage !== null && this.stage < this.rows.length ? this.stage : null);
    return this.rows[at ?? 0];
  }

  override connectedCallback() {
    super.connectedCallback();
    if (typeof IntersectionObserver === "function") {
      this.io = new IntersectionObserver((entries) => {
        if (entries[entries.length - 1].isIntersecting) {
          this.onScreen = true;
          this.io?.disconnect();
        }
      });
      this.io.observe(this);
    } else this.onScreen = true;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.io?.disconnect();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const stages = this.shownStages;
    const first = Math.max(0, stages[0]?.value ?? 0);
    this.rows = stages.map((s, i) => ({
      ...s,
      i,
      share: first ? Math.max(0, s.value) / first : 0,
      ink: this.mono ? "var(--tc-stgb-mono)" : s.color || `var(--tc-chart-${(i % 6) + 1})`,
    }));
    if (this.active !== null && this.active >= this.rows.length) this.active = null;
    if (this.current >= this.rows.length) this.current = Math.max(0, this.rows.length - 1);
    const enabled = !this.still && !reducedMotion();
    this.motion.sync(
      this.rows.map((r) => ({ key: `s:${r.i}`, to: [Math.min(1, r.share)], from: [0], enter: [0], delay: r.i * 70, data: r.i })),
      { enabled, active: this.onScreen, dataKey: stages, easing: "spring", duration: 820, stagger: 50 },
    );
    // A new period grows its pills in again, from nothing
    if (changed.has("range") && this.hasUpdated && changed.get("range") !== undefined) this.motion.replay();
  }

  /** Plays the entrance again */
  replay() {
    this.motion.replay();
  }

  private chooseRange(id: string) {
    if (id === this.activeRange?.id) return;
    if (!this.emit<StageBarsRangeChange>("tc-range-change", { range: id }, { cancelable: true })) return;
    const before = this.range;
    this.range = id;
    // The first pick from an unset range still replays (willUpdate replays when `range` had a value before)
    if (before === undefined) void this.updateComplete.then(() => this.motion.replay());
  }

  private onRangeKey = (e: KeyboardEvent) => {
    const ranges = this.ranges;
    if (!ranges?.length) return;
    const i = ranges.findIndex((r) => r.id === this.activeRange?.id);
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? ranges.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    this.chooseRange(ranges[(to + ranges.length) % ranges.length].id);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>('.ui-stgb__range [aria-checked="true"]')?.focus());
  };

  private pick(i: number) {
    const next = this.stage === i ? null : i;
    const item = next === null ? null : (this.shownStages[next] ?? null);
    if (!this.emit<StageBarsStageChange>("tc-stage-change", { stage: next, item }, { cancelable: true })) return;
    this.stage = next;
    this.spoken = next === null ? "" : `${this.words.selected} ${item?.label ?? ""}`;
  }

  private setView(view: StageBarsView) {
    if (view === this.view) return;
    if (!this.emit<StageBarsViewChange>("tc-view-change", { view }, { cancelable: true })) return;
    this.view = view;
  }

  private focusRow(i: number) {
    this.current = i;
    this.active = i;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-row-${i}`)?.focus());
  }

  private onListKey = (e: KeyboardEvent) => {
    const n = this.rows.length;
    if (!n) return;
    const i = this.current;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        this.focusRow(Math.min(n - 1, i + 1));
        break;
      case "ArrowUp":
      case "ArrowLeft":
        this.focusRow(Math.max(0, i - 1));
        break;
      case "Home":
        this.focusRow(0);
        break;
      case "End":
        this.focusRow(n - 1);
        break;
      case "Enter":
      case " ":
        this.pick(i);
        break;
      case "Escape":
        if (this.stage === null) return;
        this.pick(this.stage);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  private onFocusIn = (e: FocusEvent) => {
    const row = (e.target as Element).closest<HTMLElement>(".ui-stgb__row");
    if (!row) return;
    const i = Number(row.dataset.i);
    this.current = i;
    this.active = i;
  };

  private onFocusOut = (e: FocusEvent) => {
    if (!(e.currentTarget as Element).contains(e.relatedTarget as Node)) this.active = null;
  };

  private renderDelta(delta: number) {
    const up = delta >= 0;
    const w = this.words;
    return html`<span class="ui-stgb__delta" ?data-up=${up}>
      <svg viewBox="0 0 12 12" aria-hidden="true">${svg`<path d=${up ? "M6 9.5v-7M2.8 5.6 6 2.4l3.2 3.2" : "M6 2.5v7M2.8 6.4 6 9.6l3.2-3.2"}></path>`}</svg>
      <span class="tc-sr-only">${up ? w.up : w.down} </span>${Math.abs(delta).toLocaleString("en-US", { maximumFractionDigits: 1 })}%
    </span>`;
  }

  private renderRow(r: Row, shownIndex: number, pct: (n: number) => string) {
    const w = this.words;
    const on = this.active === r.i || (this.active === null && this.stage === r.i);
    const grown = this.motion.get(`s:${r.i}`)?.[0] ?? Math.min(1, r.share);
    const icon = this.showIcons && r.icon;
    return html`<li
      class="ui-stgb__row"
      id=${`${this.uid}-row-${r.i}`}
      role="option"
      data-i=${r.i}
      aria-selected=${this.stage === r.i ? "true" : "false"}
      tabindex=${shownIndex === this.current ? 0 : -1}
      ?data-on=${on}
      style=${styleMap({ "--tc-stgb-ink": r.ink })}
      @pointerenter=${() => (this.active = r.i)}
      @click=${() => {
        this.current = r.i;
        this.pick(r.i);
      }}
    >
      <span class="ui-stgb__name">${r.label}</span>
      <span class="ui-stgb__track" aria-hidden="true">
        <span class="ui-stgb__pill" ?data-icon=${!!icon} style=${styleMap({ width: `${(grown * 100).toFixed(2)}%` })}>
          ${icon ? html`<svg class="ui-stgb__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg`<path d=${r.icon!}></path>`}</svg>` : nothing}
        </span>
      </span>
      <span class="ui-stgb__value"><span class="tc-sr-only">, </span>${this.format(r.value)}</span>
      <span class="ui-stgb__share"><span class="tc-sr-only">, </span>${pct(r.share)}<span class="tc-sr-only"> ${w.ofFirst}</span></span>
    </li>`;
  }

  private renderTable(pct: (n: number) => string) {
    const w = this.words;
    return html`<div class="ui-stgb__scroll">
      <table class="ui-stgb__table">
        <caption class="tc-sr-only">${this.heading}</caption>
        <thead><tr><th scope="col">${w.stage}</th><th scope="col">${w.value}</th><th scope="col">${w.share}</th></tr></thead>
        <tbody>
          ${this.rows.map((r) => html`<tr><th scope="row">${r.label}</th><td>${this.format(r.value)}</td><td>${pct(r.share)}</td></tr>`)}
        </tbody>
      </table>
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const rows = this.rows;
    const has = rows.length > 0;
    const table = this.view === "table" && has;
    const ranges = this.ranges;
    const chosen = this.activeRange;
    const delta = chosen?.delta ?? this.delta;
    const fig = this.figureRow;
    const showsFirst = !fig || fig.i === 0;
    const pct = (n: number) => `${Math.round(n * 100)}%`;
    const switcher =
      ranges && ranges.length > 1
        ? html`<div class="ui-stgb__range" role="radiogroup" aria-label=${w.period} @keydown=${this.onRangeKey}>
            ${repeat(
              ranges,
              (r) => r.id,
              (r) => html`<button type="button" role="radio" class="ui-stgb__option" aria-checked=${r.id === chosen?.id ? "true" : "false"} tabindex=${r.id === chosen?.id ? 0 : -1} @click=${() => this.chooseRange(r.id)}>${r.label}</button>`,
            )}
          </div>`
        : nothing;
    const toggle = has
      ? html`<button type="button" class="tc-btn-sm ui-stgb__toggle" aria-pressed=${table ? "true" : "false"} @click=${() => this.setView(table ? "chart" : "table")}>${w.table}</button>`
      : nothing;

    return html`${cardHead({ icon: stagesIcon, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`${switcher}${toggle}` })}
      <div class="ui-stgb__card">
        ${has
          ? html`<div class="ui-stgb__figure">
                <p class="ui-stgb__big"><span class="tc-sr-only">${fig?.label}: </span>${this.format(this.still || !fig ? (fig?.value ?? 0) : Math.round(this.rolling.shown.figure ?? 0))}</p>
                ${delta !== undefined && showsFirst ? this.renderDelta(delta) : nothing}
                <p class="ui-stgb__caption" aria-hidden="true">${fig?.label}${showsFirst ? nothing : html` · ${pct(fig.share)}`}</p>
              </div>
              ${table
                ? this.renderTable(pct)
                : html`<ul
                      class="ui-stgb__list"
                      role="listbox"
                      aria-labelledby=${`${this.uid}-title`}
                      ?data-active=${this.active !== null || this.stage !== null}
                      @keydown=${this.onListKey}
                      @focusin=${this.onFocusIn}
                      @focusout=${this.onFocusOut}
                      @pointerleave=${(e: PointerEvent) => {
                        // Focus in the list keeps its row in front
                        this.active = (e.currentTarget as Element).contains(document.activeElement) ? this.current : null;
                      }}
                    >
                      ${repeat(
                        rows,
                        (r) => r.i,
                        (r, n) => this.renderRow(r, n, pct),
                      )}
                    </ul>
                    <ul class="ui-stgb__tiles" aria-hidden="true">
                      ${rows.map(
                        (r) => html`<li class="ui-stgb__tile" ?data-on=${this.active === r.i || (this.active === null && this.stage === r.i)} style=${styleMap({ "--tc-stgb-ink": r.ink })}>
                          <span class="ui-stgb__tile-name"><i class="ui-stgb__swatch"></i>${r.label}</span>
                          <span class="ui-stgb__tile-value">${this.format(r.value)}</span>
                        </li>`,
                      )}
                    </ul>`}`
          : html`<p class="ui-stgb__empty">${w.empty}</p>`}
        <span class="tc-sr-only" role="status">${this.spoken}</span>
      </div>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="stgb"] {
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
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="stgb"] {
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
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The inks – override any of them on the element */
[data-ui="stgb"] {
  --tc-stgb-mono: var(--tc-text-muted);
  --tc-stgb-track: var(--tc-fill-subtle);
  --tc-stgb-pill-h: 14px;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="stgb"] { --tc-stgb-surface: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="stgb"] { --tc-stgb-surface: var(--tc-surface-raised); }
[data-ui="stgb"] *, [data-ui="stgb"] *::before, [data-ui="stgb"] *::after { box-sizing: border-box; }
:where([data-ui="stgb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="stgb"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="stgb"]) :is(p, ul) { margin: 0; padding: 0; }
:where([data-ui="stgb"]) ul { list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-stgb__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-stgb__card { padding: var(--tc-space-1) var(--tc-space-4) var(--tc-space-4); }
/* The period switch: the segmented track in Standard, separate chips in Clean */
.ui-stgb__range { display: inline-flex; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-stgb__range { padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-stgb__option { height: 24px; padding: 0 var(--tc-space-2); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); white-space: nowrap; transition: color var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-stgb__option[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-stgb__range { gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-stgb__option { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-stgb__option[aria-checked="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
.ui-stgb__option[aria-checked="false"]:hover { color: var(--tc-text-primary); }
.ui-stgb__toggle[aria-pressed="true"] { background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); box-shadow: none; }
/* The headline: the count, the change, and whose count it is */
.ui-stgb__figure { display: flex; flex-wrap: wrap; align-items: center; column-gap: var(--tc-space-2); margin-bottom: var(--tc-space-3); }
.ui-stgb__big { font-size: var(--tc-font-size-3xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-stgb__big { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
.ui-stgb__caption { flex-basis: 100%; min-height: 18px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-stgb__delta { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-1-5) 0 var(--tc-space-1); border-radius: var(--tc-pill-radius); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.ui-stgb__delta[data-up] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-stgb__delta svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
/* The rows share one grid, so the names' column is as wide as the longest name */
.ui-stgb__list { display: grid; grid-template-columns: fit-content(40%) minmax(48px, 1fr) auto auto; column-gap: var(--tc-space-3); border-radius: var(--tc-radius-md); }
.ui-stgb__row { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; align-items: center; min-height: var(--tc-control-h-sm); margin: 0 calc(var(--tc-space-2) * -1); padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-radius-md); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-stgb__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-offset) * -1); }
.ui-stgb__row[aria-selected="true"] { background: var(--tc-fill-subtle); }
.ui-stgb__name { overflow: hidden; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); white-space: nowrap; text-overflow: ellipsis; transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-stgb__track { position: relative; display: block; height: var(--tc-stgb-pill-h); border-radius: var(--tc-radius-full); background: var(--tc-stgb-track); }
.ui-stgb__pill { position: absolute; inset: 0 auto 0 0; display: flex; align-items: center; min-width: var(--tc-stgb-pill-h); border-radius: var(--tc-radius-full); background: var(--tc-stgb-ink); color: var(--tc-stgb-surface); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-stgb__pill[data-icon] { min-width: calc(var(--tc-stgb-pill-h) + var(--tc-space-2)); }
.ui-stgb__icon { flex: none; width: 10px; height: 10px; margin-left: var(--tc-space-1); }
.ui-stgb__value { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; text-align: right; }
.ui-stgb__share { min-width: 4ch; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; text-align: right; }
/* One stage in front: its pill keeps its ink, the others fade towards the track – by colour, so text keeps its contrast */
.ui-stgb__list[data-active] .ui-stgb__row:not([data-on]) .ui-stgb__pill { background: color-mix(in oklab, var(--tc-stgb-ink) 32%, var(--tc-stgb-track)); }
.ui-stgb__list[data-active] .ui-stgb__row:not([data-on]) .ui-stgb__name { color: var(--tc-text-muted); }
.ui-stgb__row[data-on] .ui-stgb__name { font-weight: var(--tc-font-weight-medium); }
/* The stat tiles, three a row */
.ui-stgb__tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-2); margin-top: var(--tc-space-4); }
.ui-stgb__tile { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-stgb__tile[data-on] { box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
.ui-stgb__tile-name { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); white-space: nowrap; text-overflow: ellipsis; }
.ui-stgb__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); background: var(--tc-stgb-ink); }
.ui-stgb__tile-value { color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
/* The table view */
.ui-stgb__scroll { overflow-x: auto; scrollbar-width: thin; }
.ui-stgb__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.ui-stgb__table th, .ui-stgb__table td { padding: var(--tc-space-1-5) var(--tc-space-2); border-bottom: 1px solid var(--tc-border-subtle); text-align: right; white-space: nowrap; }
.ui-stgb__table th { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-stgb__table th[scope="row"], .ui-stgb__table thead th:first-child { text-align: left; color: var(--tc-text-secondary); }
.ui-stgb__table td { color: var(--tc-text-primary); }
.ui-stgb__empty { padding: var(--tc-space-6) var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
/* Narrow: the shares go first, then the tiles drop to two a row, then one */
@container (max-width: 380px) {
  .ui-stgb__list { grid-template-columns: fit-content(40%) minmax(40px, 1fr) auto; }
  .ui-stgb__share { display: none; }
  .ui-stgb__tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container (max-width: 240px) {
  .ui-stgb__tiles { grid-template-columns: minmax(0, 1fr); }
}
@media (hover: none) and (pointer: coarse) {
  .ui-stgb__row { min-height: var(--tc-control-h-md); }
}
@media (forced-colors: active) {
  .ui-stgb__pill, .ui-stgb__swatch { forced-color-adjust: none; background: CanvasText; }
  .ui-stgb__track { border: 1px solid CanvasText; }
  .ui-stgb__row[aria-selected="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="stgb"] *, [data-ui="stgb"] *::before, [data-ui="stgb"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-stage-bars")) customElements.define("tc-stage-bars", TcStageBars);

declare global {
  interface HTMLElementTagNameMap {
    "tc-stage-bars": TcStageBars;
  }
}

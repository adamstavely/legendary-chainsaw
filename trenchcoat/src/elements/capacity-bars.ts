import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { initials } from "./internal/util";
import { ifDefined } from "lit/directives/if-defined.js";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-capacity-bars> – how loaded each person is: a row per person with their initials, name and role, and a bar of
 * their allocation split by what they work on, against their capacity – "1.2 / 1.0 FTE · over". Bars share one scale,
 * so loads compare across rows, and a line marks each person's capacity. Each piece of work is named under the bar
 * with its amount, so colour is never the only cue; anyone over capacity is marked in words and counted in the header.
 * Rows are sorted by load, most loaded first, unless `sort` is "none".
 *   · the rows are a WAI-ARIA grid: ↑ / ↓ move between people, ← / → between a person and the pieces of their bar,
 *     Home / End to the row's ends; the readout names the piece in focus. Enter or Space selects (or clears) the
 *     person, Escape clears it; selecting fires a cancelable tc-selected-change
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-capacity-bars .people=${[{ id: "am", name: "Arjun Mehta", capacity: 1, allocations: [{ id: "crm", label: "Climate Resilience Modeling", amount: 0.7 }] }]}></tc-capacity-bars>
 */

/** A gauge: Lucide (ISC, lucide.dev) */
const gaugeIcon = svg`<path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>`;

export type CapacityAllocation = {
  /** Identifies the piece of work; the same id gets the same colour on every row */
  id: string;
  /** What it is, e.g. "Climate Resilience Modeling" */
  label: string;
  /** How much of the person it takes, in `unit` */
  amount: number;
};
export type CapacityPerson = {
  id: string;
  name: string;
  /** Their role, e.g. "Principal Investigator" */
  role?: string;
  /** A picture URL; without one the row shows the name's initials */
  picture?: string;
  /** How much they can take, in `unit` – 1 FTE by default */
  capacity?: number;
  /** What they work on */
  allocations: CapacityAllocation[];
};

/** Details of the events */
export type CapacitySelectedChange = { selected: string | null; person?: CapacityPerson };

/** Colours for the pieces of work, in order of first appearance */
const CHARTS = 6;
let uidCount = 0;

/**
 * People's capacity: each person's allocation, split by what they work on, against what they can take, with anyone
 * over capacity marked and counted.
 * @tag tc-capacity-bars
 * @fires tc-selected-change - A person was selected or cleared ({ selected, person }: CapacitySelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcCapacityBars extends TcElement {
  static override ui = "capb";

  /** The heading, and the grid's name */
  @property() accessor heading = "People capacity";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The people */
  @property({ attribute: false }) accessor people: CapacityPerson[] = [];
  /** The unit loads are counted in: "FTE", "h", "%" */
  @property() accessor unit = "FTE";
  /** "load" puts the most loaded first; "none" keeps the order given */
  @property() accessor sort: "load" | "none" = "load";
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The selected person's id. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;

  /** The cell holding the tab stop: a person's id and a column (0 the person, 1… the pieces of their bar) */
  @state() private accessor active: { id: string; c: number } | null = null;
  @state() private accessor announce = "";

  private uid = `tc-capb-${++uidCount}`;

  /* ---------- The model ---------- */

  private capacityOf(p: CapacityPerson) {
    return p.capacity !== undefined && p.capacity > 0 ? p.capacity : 1;
  }
  private loadOf(p: CapacityPerson) {
    return p.allocations.reduce((n, a) => n + Math.max(0, a.amount || 0), 0);
  }
  private isOver(p: CapacityPerson) {
    return this.loadOf(p) > this.capacityOf(p) + 1e-9;
  }
  private get rows() {
    if (this.sort !== "load") return this.people;
    return [...this.people].sort((a, b) => this.loadOf(b) / this.capacityOf(b) - this.loadOf(a) / this.capacityOf(a));
  }
  /** The scale every bar shares: the biggest load or capacity */
  private get scale() {
    return Math.max(1e-9, ...this.people.map((p) => Math.max(this.loadOf(p), this.capacityOf(p))));
  }
  /** Each piece of work's colour, 1–6, by first appearance */
  private get colours() {
    const map = new Map<string, number>();
    for (const p of this.people) for (const a of p.allocations) if (!map.has(a.id)) map.set(a.id, (map.size % CHARTS) + 1);
    return map;
  }
  private num(v: number) {
    return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 2 }).format(v);
  }
  private amount(v: number) {
    return `${this.num(v)}${this.unit === "%" ? "%" : ` ${this.unit}`}`;
  }
  private pct(v: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(v);
  }

  /* ---------- Selection and keyboard ---------- */

  private get stop() {
    const rows = this.rows;
    const has = (c: { id: string; c: number } | null) => !!c && rows.some((p) => p.id === c.id && c.c <= p.allocations.length);
    if (has(this.active)) return this.active!;
    if (this.selected !== null && rows.some((p) => p.id === this.selected)) return { id: this.selected, c: 0 };
    return rows[0] ? { id: rows[0].id, c: 0 } : null;
  }

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const person = next === null ? undefined : this.people.find((p) => p.id === next);
    if (!this.emit<CapacitySelectedChange>("tc-selected-change", { selected: next, person }, { cancelable: true })) return;
    this.selected = next;
    this.announce = person ? `Selected ${person.name}` : "Selection cleared";
  }

  private focusCell(id: string, c: number) {
    this.active = { id, c };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-cell="${CSS.escape(id)}:${c}"]`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const cell = (e.target as Element).closest<HTMLElement>("[data-cell]");
    if (!cell || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const rows = this.rows;
    const id = cell.dataset.person!;
    const r = rows.findIndex((p) => p.id === id);
    const c = Number(cell.dataset.col);
    const width = (i: number) => rows[i].allocations.length;
    let to: [number, number] | null = null;
    if (e.key === "ArrowDown") to = [Math.min(rows.length - 1, r + 1), c];
    else if (e.key === "ArrowUp") to = [Math.max(0, r - 1), c];
    else if (e.key === "ArrowRight") to = [r, Math.min(width(r), c + 1)];
    else if (e.key === "ArrowLeft") to = [r, Math.max(0, c - 1)];
    else if (e.key === "Home") to = [r, 0];
    else if (e.key === "End") to = [r, width(r)];
    if (to) {
      e.preventDefault();
      this.focusCell(rows[to[0]].id, Math.min(to[1], width(to[0])));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setSelected(this.selected === id ? null : id);
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const ids = this.people.map((p) => p.id);
    if (this.active && !ids.includes(this.active.id)) this.active = null;
    if (this.selected !== null && !ids.includes(this.selected)) this.selected = null;
  }

  /* ---------- Rendering ---------- */

  /** What the readout says about the cell in focus */
  private readout() {
    const at = this.active;
    const p = at && this.people.find((x) => x.id === at.id);
    if (!p || !at) return "";
    const cap = this.capacityOf(p);
    if (at.c === 0) return `${p.name}${p.role ? ` · ${p.role}` : ""} · ${this.amount(this.loadOf(p))} of ${this.amount(cap)}${this.isOver(p) ? " · over capacity" : ""}`;
    const a = p.allocations[at.c - 1];
    return a ? `${p.name} · ${a.label} · ${this.amount(a.amount)} of ${this.amount(cap)} (${this.pct(a.amount / cap)})` : "";
  }

  private renderRow(p: CapacityPerson, r: number) {
    const stop = this.stop;
    const load = this.loadOf(p);
    const cap = this.capacityOf(p);
    const over = this.isOver(p);
    const scale = this.scale;
    const colours = this.colours;
    const isSel = this.selected === p.id;
    const cell = (c: number) => ({
      tabindex: stop?.id === p.id && stop.c === c ? 0 : -1,
      focus: () => {
        if (this.active?.id !== p.id || this.active.c !== c) this.active = { id: p.id, c };
      },
    });
    const head = cell(0);
    return html`<div class="ui-capb__row" role="row" aria-rowindex=${r + 1} aria-selected=${isSel ? "true" : "false"} ?data-over=${over}>
      <div
        class="ui-capb__person"
        role="rowheader"
        data-cell=${`${p.id}:0`}
        data-person=${p.id}
        data-col="0"
        tabindex=${head.tabindex}
        aria-label=${`${p.name}${p.role ? `, ${p.role}` : ""}: ${this.amount(load)} of ${this.amount(cap)}${over ? ", over capacity" : ""}`}
        @focus=${head.focus}
        @click=${() => {
          this.active = { id: p.id, c: 0 };
          this.setSelected(isSel ? null : p.id);
        }}
      >
        ${p.picture ? html`<span class="ui-capb__avatar" aria-hidden="true"><img src=${ifDefined(safeMediaUrl(p.picture))} alt="" /></span>` : html`<span class="ui-capb__avatar" aria-hidden="true">${initials(p.name)}</span>`}
        <span class="ui-capb__who" aria-hidden="true"><span class="ui-capb__name">${p.name}</span>${p.role ? html`<span class="ui-capb__role">${p.role}</span>` : nothing}</span>
        <span class="ui-capb__load" aria-hidden="true"
          ><span class="ui-capb__load-num">${this.num(load)} / ${this.amount(cap)}</span>${over
            ? html`<span class="ui-capb__over"><span class="ui-capb__over-mark" aria-hidden="true">▲</span>over</span>`
            : nothing}</span
        >
      </div>
      <div class="ui-capb__bar-cell">
        <div class="ui-capb__track">
          ${p.allocations.map((a, i) => {
            const c = cell(i + 1);
            return html`<span
              class="ui-capb__seg"
              role="gridcell"
              data-cell=${`${p.id}:${i + 1}`}
              data-person=${p.id}
              data-col=${i + 1}
              data-colour=${colours.get(a.id) ?? 1}
              tabindex=${c.tabindex}
              aria-label=${`${a.label}, ${this.amount(a.amount)}`}
              style=${`inline-size: ${(Math.max(0, a.amount) / scale) * 100}%`}
              @focus=${c.focus}
              @click=${() => {
                this.active = { id: p.id, c: i + 1 };
                this.setSelected(isSel ? null : p.id);
              }}
            ></span>`;
          })}
          <span class="ui-capb__cap" aria-hidden="true" style=${`inset-inline-start: ${(cap / scale) * 100}%`}></span>
        </div>
        <span class="ui-capb__legend" aria-hidden="true">
          ${p.allocations.map((a) => html`<span class="ui-capb__key"><span class="ui-capb__dot" data-colour=${colours.get(a.id) ?? 1}></span><span class="ui-capb__key-label">${a.label}</span><span class="ui-capb__key-num">${this.num(a.amount)}</span></span>`)}
        </span>
      </div>
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const over = this.people.filter((p) => this.isOver(p)).length;
    const rows = this.rows;
    return html`
      <span class="ui-capb__sr" role="status">${this.announce}</span>
      <span class="ui-capb__sr" id=${`${id}-keys`}>Up and down arrows move between people, left and right along their work; Enter selects the person</span>
      ${cardHead({
        icon: gaugeIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: this.people.length
          ? html`<span class="ui-capb__count" ?data-over=${over > 0}>${over ? html`<span class="ui-capb__over-mark" aria-hidden="true">▲</span>${over} over capacity` : "All within capacity"}</span>`
          : nothing,
      })}
      <div class="ui-capb__card">
        ${rows.length
          ? html`<div class="ui-capb__grid" role="grid" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} aria-rowcount=${rows.length} @keydown=${this.onKey}>
                ${repeat(rows, (p) => p.id, (p, r) => this.renderRow(p, r))}
              </div>
              <p class="ui-capb__readout" aria-hidden="true">${this.readout() || html`<span class="ui-capb__hint">Move along a bar to see each piece of work</span>`}</p>`
          : html`<p class="ui-capb__empty">No people to show yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="capb"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="capb"] {
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
[data-ui="capb"] *, [data-ui="capb"] *::before, [data-ui="capb"] *::after { box-sizing: border-box; }
[data-ui="capb"] p { margin: 0; }
.ui-capb__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-capb__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-capb__count { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
.ui-capb__count[data-over] { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-capb__over-mark { font-size: var(--tc-font-size-2xs); }
/* ----- Rows: the person on the left, their bar on the right ----- */
.ui-capb__grid { display: grid; padding: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-capb__grid { padding-top: 0; }
.ui-capb__row { position: relative; display: grid; grid-template-columns: minmax(180px, 0.9fr) minmax(0, 2fr); align-items: start; gap: var(--tc-space-4); padding: var(--tc-space-2-5); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-capb__row + .ui-capb__row::before { content: ""; position: absolute; top: 0; left: var(--tc-space-2-5); right: var(--tc-space-2-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-capb__row:hover { background: var(--tc-fill-subtle); }
.ui-capb__row[aria-selected="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); }
.ui-capb__row:hover::before, .ui-capb__row:hover + .ui-capb__row::before, .ui-capb__row[aria-selected="true"]::before, .ui-capb__row[aria-selected="true"] + .ui-capb__row::before { opacity: 0; }
.ui-capb__person { display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-rows: auto auto; column-gap: var(--tc-space-2-5); align-items: center; min-width: 0; border-radius: var(--tc-radius-sm); cursor: pointer; outline: none; }
.ui-capb__person:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-capb__avatar { display: grid; grid-row: span 2; place-items: center; width: 32px; height: 32px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-surface-sunken); color: var(--tc-text-secondary); font-size: var(--tc-avatar-font-size); font-weight: var(--tc-avatar-font-weight); line-height: var(--tc-line-height-none); }
.ui-capb__avatar > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ui-capb__who { display: grid; min-width: 0; }
.ui-capb__name { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-capb__role { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-capb__load { display: inline-flex; grid-column: 2; align-items: center; gap: var(--tc-space-1-5); margin-top: var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-capb__row[aria-selected="true"] .ui-capb__role { color: var(--tc-text-secondary); }
.ui-capb__over { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); height: 18px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-none); }
/* The bar: pieces of work on one shared scale, and a line at the person's capacity */
.ui-capb__bar-cell { display: grid; gap: var(--tc-space-1-5); min-width: 0; padding-top: var(--tc-space-1); }
.ui-capb__track { position: relative; display: flex; gap: var(--tc-space-0-5); height: 14px; }
.ui-capb__seg { display: block; height: 100%; min-width: 3px; border-radius: var(--tc-radius-2xs); background: var(--tc-chart-1); cursor: pointer; outline: none; transition: inline-size var(--tc-duration-moderate) var(--tc-ease-move), filter var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-capb__seg:hover { filter: brightness(1.08); }
.ui-capb__seg:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="capb"] [data-colour="2"] { --tc-capb-c: var(--tc-chart-2); }
[data-ui="capb"] [data-colour="3"] { --tc-capb-c: var(--tc-chart-3); }
[data-ui="capb"] [data-colour="4"] { --tc-capb-c: var(--tc-chart-4); }
[data-ui="capb"] [data-colour="5"] { --tc-capb-c: var(--tc-chart-5); }
[data-ui="capb"] [data-colour="6"] { --tc-capb-c: var(--tc-chart-6); }
.ui-capb__seg[data-colour], .ui-capb__dot[data-colour] { background: var(--tc-capb-c, var(--tc-chart-1)); }
.ui-capb__cap { position: absolute; top: calc(-1 * var(--tc-space-1)); bottom: calc(-1 * var(--tc-space-1)); width: 2px; translate: -50% 0; border-radius: var(--tc-radius-2xs); background: var(--tc-text-primary); pointer-events: none; }
.ui-capb__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-capb__key { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: 0; }
.ui-capb__dot { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); }
.ui-capb__key-num { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-capb__row[aria-selected="true"] .ui-capb__key-num { color: var(--tc-text-secondary); }
/* ----- The readout and empty ----- */
.ui-capb__readout { min-height: calc(var(--tc-font-size-sm) * 1.5 + var(--tc-space-2-5) * 2); padding: var(--tc-space-2-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-capb__hint { color: var(--tc-text-muted); }
.ui-capb__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* Narrow: the bar drops under the person */
@container (max-width: 520px) {
  .ui-capb__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-2); }
}
@media (pointer: coarse) {
  .ui-capb__track { height: 20px; }
}
@media (forced-colors: active) {
  .ui-capb__seg { background: CanvasText !important; }
  .ui-capb__cap { background: Highlight; }
  .ui-capb__over { border: 1px solid CanvasText; }
  .ui-capb__row[aria-selected="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="capb"] *, [data-ui="capb"] *::before, [data-ui="capb"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-capacity-bars")) customElements.define("tc-capacity-bars", TcCapacityBars);

declare global {
  interface HTMLElementTagNameMap {
    "tc-capacity-bars": TcCapacityBars;
  }
}

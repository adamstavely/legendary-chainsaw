import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-audience-mix> – who is reading: a sector mix (Academic, Industry, Government, Nonprofit …) as bars with each
 * share, an internal-versus-external split, and the top places readers come from, with "Other" for the rest. Each
 * group is optional and shows only when it has data. Values are counts or shares in any unit – each group's
 * percentages are worked out from its own total. The rows are one tab stop: ↑ / ↓ move between them (Home / End to
 * the ends) and a readout under the groups names the row under the pointer or focus in full.
 * `embedded` drops the card, for use inside another component (publication-impact uses it this way).
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-audience-mix .sectors=${[{ label: "Academic", value: 54 }, …]} .split=${{ internal: 6, external: 94 }}></tc-audience-mix>
 */

/** People: Lucide "users" (ISC, lucide.dev) */
const usersIcon = svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`;

export type AudienceShare = {
  label: string;
  /** A count or a share in any unit; the percentage comes from the group's total */
  value: number;
};
export type AudienceSplit = { internal: number; external: number };
/** The data publication-impact passes through */
export type AudienceMixData = { sectors?: AudienceShare[]; split?: AudienceSplit | null; places?: AudienceShare[] };

type Row = { key: string; group: string; label: string; value: number; pct: number };
let uidCount = 0;

/**
 * Who is reading – a sector mix as bars, an internal-versus-external split and the top places, each with its share,
 * and a readout of the row under the pointer or focus.
 * @tag tc-audience-mix
 */
export class TcAudienceMix extends TcElement {
  static override ui = "audm";

  /** The heading */
  @property() accessor heading = "Who is reading";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** Readers by sector, in the order given */
  @property({ attribute: false }) accessor sectors: AudienceShare[] = [];
  /** Readers inside and outside the organisation; null hides the split */
  @property({ attribute: false }) accessor split: AudienceSplit | null = null;
  /** Readers by place, largest first as given; put "Other" last yourself */
  @property({ attribute: false }) accessor places: AudienceShare[] = [];
  /** The heading of the sectors */
  @property({ attribute: "sectors-label" }) accessor sectorsLabel = "Sector";
  /** The heading of the internal-versus-external split */
  @property({ attribute: "split-label" }) accessor splitLabel = "Internal vs external";
  /** The heading of the places */
  @property({ attribute: "places-label" }) accessor placesLabel = "Where";
  /** The name of the internal share in the split */
  @property({ attribute: "internal-label" }) accessor internalLabel = "Internal";
  /** The name of the external share in the split */
  @property({ attribute: "external-label" }) accessor externalLabel = "External";
  /** What the shares are of, for the readout: "54% of readers" */
  @property() accessor unit = "readers";
  /** No card or header – for use inside another component */
  @property({ type: Boolean, reflect: true }) accessor embedded = false;
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor active = 0;
  @state() private accessor shown: number | null = null;

  private uid = `tc-audm-${++uidCount}`;

  /* ---------- The model ---------- */

  private shares(group: string, items: AudienceShare[]): Row[] {
    const clean = items.filter((i) => Number.isFinite(i.value) && i.value >= 0);
    const total = clean.reduce((n, i) => n + i.value, 0);
    return clean.map((i, n) => ({ key: `${group}:${n}`, group, label: i.label, value: i.value, pct: total ? (i.value / total) * 100 : 0 }));
  }
  private get groups() {
    const out: { id: string; label: string; rows: Row[] }[] = [];
    const sectors = this.shares("sector", this.sectors);
    if (sectors.length) out.push({ id: "sector", label: this.sectorsLabel, rows: sectors });
    if (this.split) {
      const rows = this.shares("split", [
        { label: this.internalLabel, value: this.split.internal },
        { label: this.externalLabel, value: this.split.external },
      ]);
      if (rows.some((r) => r.value > 0)) out.push({ id: "split", label: this.splitLabel, rows });
    }
    const places = this.shares("place", this.places);
    if (places.length) out.push({ id: "place", label: this.placesLabel, rows: places });
    return out;
  }
  private get rows() {
    return this.groups.flatMap((g) => g.rows);
  }
  private pct(n: number) {
    return `${new Intl.NumberFormat(this.locale, { maximumFractionDigits: n > 0 && n < 1 ? 1 : 0 }).format(n)}%`;
  }

  /* ---------- Keyboard ---------- */

  private focusRow(i: number) {
    const rows = this.rows;
    if (!rows.length) return;
    this.active = Math.max(0, Math.min(rows.length - 1, i));
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-row="${this.active}"]`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-row]");
    if (!row || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const i = Number(row.dataset.row);
    const moves: Record<string, number> = { ArrowUp: i - 1, ArrowLeft: i - 1, ArrowDown: i + 1, ArrowRight: i + 1, Home: 0, End: this.rows.length - 1 };
    if (e.key in moves) {
      e.preventDefault();
      this.focusRow(moves[e.key]);
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const n = this.rows.length;
    if (this.active >= n) this.active = Math.max(0, n - 1);
    if (this.shown !== null && this.shown >= n) this.shown = null;
  }

  /* ---------- Rendering ---------- */

  private renderRow(r: Row, i: number) {
    const handlers = {
      focus: () => {
        this.active = i;
        this.shown = i;
      },
      blur: () => {
        if (this.shown === i) this.shown = null;
      },
      enter: () => (this.shown = i),
    };
    const name = `${r.label}, ${this.pct(r.pct)}`;
    if (r.group === "split") return nothing;
    return html`<li
      class="ui-audm__row"
      data-row=${i}
      tabindex=${this.active === i ? 0 : -1}
      aria-label=${name}
      @focus=${handlers.focus}
      @blur=${handlers.blur}
      @pointerenter=${handlers.enter}
    >
      <span class="ui-audm__label" aria-hidden="true">${r.label}</span>
      <span class="ui-audm__bar" aria-hidden="true"><span class="ui-audm__fill" style=${`inline-size: ${r.pct.toFixed(2)}%`}></span></span>
      <span class="ui-audm__pct" aria-hidden="true">${this.pct(r.pct)}</span>
    </li>`;
  }

  private renderSplit(rows: Row[], start: number) {
    return html`<ul class="ui-audm__split" role="list">
        ${rows.map((r, n) => {
          const i = start + n;
          return html`<li
            class="ui-audm__part"
            data-row=${i}
            data-side=${n === 0 ? "internal" : "external"}
            tabindex=${this.active === i ? 0 : -1}
            aria-label=${`${r.label}, ${this.pct(r.pct)}`}
            style=${`flex-grow: ${Math.max(r.pct, 0.0001)}`}
            @focus=${() => {
              this.active = i;
              this.shown = i;
            }}
            @blur=${() => {
              if (this.shown === i) this.shown = null;
            }}
            @pointerenter=${() => (this.shown = i)}
          ></li>`;
        })}
      </ul>
      <p class="ui-audm__split-key" aria-hidden="true">
        ${rows.map((r, n) => html`<span class="ui-audm__split-item" data-side=${n === 0 ? "internal" : "external"}><span class="ui-audm__dot"></span><span class="ui-audm__split-pct">${this.pct(r.pct)}</span> ${r.label.toLowerCase()}</span>`)}
      </p>`;
  }

  private renderBody() {
    const groups = this.groups;
    if (!groups.length) return html`<p class="ui-audm__empty">No readers to show yet.</p>`;
    const rows = this.rows;
    const shown = this.shown === null ? null : rows[this.shown];
    let start = 0;
    return html`<div class="ui-audm__groups" @keydown=${this.onKey} @pointerleave=${() => (this.shown = null)}>
        ${groups.map((g) => {
          const from = start;
          start += g.rows.length;
          return html`<section class="ui-audm__group" data-group=${g.id} aria-labelledby=${`${this.uid}-${g.id}`}>
            <h4 class="ui-audm__group-label" id=${`${this.uid}-${g.id}`}>${g.label}</h4>
            ${g.id === "split" ? this.renderSplit(g.rows, from) : html`<ul class="ui-audm__rows" role="list">${g.rows.map((r, n) => this.renderRow(r, from + n))}</ul>`}
          </section>`;
        })}
      </div>
      <p class="ui-audm__readout" aria-hidden="true">
        ${shown
          ? html`<span class="ui-audm__readout-value">${shown.label} · ${this.pct(shown.pct)}</span> of ${this.unit}`
          : html`<span class="ui-audm__readout-hint">Point at a row to see its share</span>`}
      </p>`;
  }

  protected override render() {
    if (this.embedded) return html`<div class="ui-audm__body">${this.renderBody()}</div>`;
    return html`${cardHead({ icon: usersIcon, title: this.heading, subtitle: this.description, id: `${this.uid}-title` })}
      <div class="ui-audm__card"><div class="ui-audm__body">${this.renderBody()}</div></div>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="audm"]:not([embedded]) {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="audm"]:not([embedded]) {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="audm"] {
  display: block;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  --tc-audm-ink: var(--tc-chart-1);
}
[data-ui="audm"] *, [data-ui="audm"] *::before, [data-ui="audm"] *::after { box-sizing: border-box; }
[data-ui="audm"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="audm"] h4, [data-ui="audm"] p { margin: 0; }
[data-ui="audm"] svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-audm__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-audm__body { padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="audm"]:not([embedded]) .ui-audm__body { padding-top: var(--tc-space-1); }
[data-ui="audm"][embedded] .ui-audm__body { padding: 0; }
/* ----- The groups: side by side when there's room ----- */
.ui-audm__groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--tc-space-4) var(--tc-space-6); }
.ui-audm__group { display: grid; align-content: start; gap: var(--tc-space-2); min-width: 0; }
.ui-audm__group-label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-audm__rows { display: grid; gap: var(--tc-space-1); }
/* A row: the name, a bar and the share */
.ui-audm__row { display: grid; grid-template-columns: minmax(72px, 1fr) minmax(48px, 1.4fr) 40px; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-1) var(--tc-space-1-5); margin: 0 calc(-1 * var(--tc-space-1-5)); border-radius: var(--tc-radius-sm); outline: none; cursor: default; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-audm__row:hover { background: var(--tc-fill-subtle); }
.ui-audm__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-audm__label { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-audm__bar { display: block; height: 6px; overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-audm__fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-audm-ink); transition: inline-size var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-audm__pct { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); text-align: right; font-variant-numeric: tabular-nums; }
/* The split: one bar in two parts, with the shares in words beneath */
.ui-audm__split { display: flex; gap: var(--tc-space-0-5); height: 12px; }
.ui-audm__part { flex-basis: 0; min-width: var(--tc-space-1); border-radius: var(--tc-radius-2xs); outline: none; }
.ui-audm__part[data-side="internal"] { background: var(--tc-audm-ink); }
.ui-audm__part[data-side="external"] { background: var(--tc-fill-strong); }
.ui-audm__part:hover { box-shadow: inset 0 0 0 1px var(--tc-border-strong); }
.ui-audm__part:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-audm__split-key { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-audm__split-item { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-audm__split-pct { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-audm__dot { width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); }
[data-side="internal"] > .ui-audm__dot { background: var(--tc-audm-ink); }
[data-side="external"] > .ui-audm__dot { background: var(--tc-fill-strong); }
/* The readout */
.ui-audm__readout { margin-top: var(--tc-space-3) !important; min-height: var(--tc-space-4); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-audm__readout-value { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-audm__empty { color: var(--tc-text-muted); text-align: center; padding: var(--tc-space-4) 0 !important; }
@media (forced-colors: active) {
  .ui-audm__fill, .ui-audm__part[data-side="internal"], [data-side="internal"] > .ui-audm__dot { background: CanvasText; }
  .ui-audm__part, .ui-audm__dot { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="audm"] *, [data-ui="audm"] *::before, [data-ui="audm"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-audience-mix")) customElements.define("tc-audience-mix", TcAudienceMix);

declare global {
  interface HTMLElementTagNameMap {
    "tc-audience-mix": TcAudienceMix;
  }
}

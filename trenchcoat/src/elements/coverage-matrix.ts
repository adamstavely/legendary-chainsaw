import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController } from "./internal/controllers";
import { isMac } from "./internal/util";

/*
 * <tc-coverage-matrix> – which checks cover which parts: a heatmap with checks as rows (tests, controls, policies)
 * and parts as columns (components, systems, models), each cell covered, partial or a gap – or not applicable. Every
 * row and column has a total, the header counts each status and doubles as the legend, and a cell's detail – what
 * covers it, what's missing, the evidence – opens below the grid on Enter or click.
 *   · the matrix is a WAI-ARIA grid: arrows move between cells (totals included), Home / End to the row's ends,
 *     ⌘/Ctrl+Home / End to the first and last cell, Page Up / Down five rows; Enter or Space opens a cell's detail,
 *     Escape closes it; Tab leaves the grid
 *   · a total is the share covered, with partial counting as `partialWeight` (half by default)
 * Standard: a white card on a gray tray. Clean: one white card.
 *
 *   <tc-coverage-matrix .checks=${checks} .parts=${parts} .coverage=${coverage}></tc-coverage-matrix>
 */

/** "none": the check doesn't apply to the part – left out of the totals */
export type CoverageStatus = "covered" | "partial" | "gap" | "none";
export type CoverageCheck = {
  id: string;
  label: string;
  /** One quiet line under the label, e.g. "Jailbreaks through retrieved text" */
  description?: string;
};
export type CoveragePart = { id: string; label: string };
export type CoverageCell = {
  status: CoverageStatus;
  /** What covers it, or what's missing, in a sentence */
  detail?: string;
  /** Where the coverage comes from, e.g. "12 tests · last run 2 h ago" */
  evidence?: string;
};
/** check id → part id → a cell, or just its status; a missing cell is `defaultStatus` */
export type CoverageMap = Record<string, Record<string, CoverageCell | CoverageStatus>>;
export type CoverageCellRef = { check: string; part: string };

/** Details of the events */
export type CoverageOpenChange = { open: CoverageCellRef | null; cell?: CoverageCell };

const STATUSES: CoverageStatus[] = ["covered", "partial", "gap", "none"];
/** The statuses' names used when the page gives none */
export const defaultCoverageStatusLabels: Record<CoverageStatus, string> = { covered: "Covered", partial: "Partial", gap: "Gap", none: "Not applicable" };
let uidCount = 0;

/* Covered, partial, gap and not applicable – check, circle-half, x, minus; close: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON: Record<CoverageStatus, () => ReturnType<typeof lucide>> = {
  covered: () => lucide(14, svg`<path d="M20 6 9 17l-5-5"></path>`),
  partial: () => lucide(14, svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"></path>`),
  gap: () => lucide(14, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`),
  none: () => lucide(14, svg`<path d="M7 12h10"></path>`),
};
const closeIcon = () => lucide(14, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const pct = (n: number | null) => (n === null ? "–" : `${Math.round(n * 100)}%`);

/**
 * A heatmap of checks × parts – covered, partial or gap – with totals, a legend with counts, and a cell's detail on
 * Enter or click.
 * @tag tc-coverage-matrix
 * @fires tc-open-change - A cell's detail opened or closed ({ open, cell }: CoverageOpenChange); cancelable – prevented, `open` stays as it was
 */
export class TcCoverageMatrix extends TcElement {
  static override ui = "cov";

  /** The heading, and the grid's name */
  @property() accessor heading = "Coverage";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The rows: what does the covering – tests, controls, policies */
  @property({ attribute: false }) accessor checks: CoverageCheck[] = [];
  /** The columns: what gets covered – components, systems, models */
  @property({ attribute: false }) accessor parts: CoveragePart[] = [];
  /** Each cell's status, with optional detail and evidence */
  @property({ attribute: false }) accessor coverage: CoverageMap = {};
  /** The cell whose detail is open. Changed by the user unless a tc-open-change listener calls preventDefault() */
  @property({ attribute: false }) accessor open: CoverageCellRef | null = null;
  /** A cell missing from `coverage` */
  @property({ attribute: "default-status" }) accessor defaultStatus: CoverageStatus = "gap";
  /** How much a partial cell counts towards a total, from 0 to 1 */
  @property({ type: Number, attribute: "partial-weight" }) accessor partialWeight = 0.5;
  /** The statuses' names, merged over the defaults (Covered, Partial, Gap, Not applicable) */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<CoverageStatus, string>> = {};
  /** The heading of the checks column */
  @property({ attribute: "check-label" }) accessor checkLabel = "Check";
  /** The heading of the totals column and row */
  @property({ attribute: "total-label" }) accessor totalLabel = "Coverage";

  @state() private accessor active = { r: 0, c: 0 };
  @state() private accessor announce = "";

  private uid = `tc-cov-${++uidCount}`;

  constructor() {
    super();
    // Focus never drops to <body> when the detail's Close button it was on goes away
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]'));
  }

  /* ---------- The model ---------- */

  private label(s: CoverageStatus) {
    return this.statusLabels[s] ?? defaultCoverageStatusLabels[s];
  }
  private cellOf(check: string, part: string): CoverageCell {
    const v = this.coverage[check]?.[part];
    return v === undefined ? { status: this.defaultStatus } : typeof v === "string" ? { status: v } : v;
  }
  /** The share covered among applicable cells; null when none apply */
  private score(cells: CoverageCell[]) {
    const applicable = cells.filter((c) => c.status !== "none");
    if (!applicable.length) return null;
    const w = Math.max(0, Math.min(1, this.partialWeight));
    return applicable.reduce((n, c) => n + (c.status === "covered" ? 1 : c.status === "partial" ? w : 0), 0) / applicable.length;
  }
  private rowCells(check: CoverageCheck) {
    return this.parts.map((p) => this.cellOf(check.id, p.id));
  }
  private colCells(part: CoveragePart) {
    return this.checks.map((c) => this.cellOf(c.id, part.id));
  }
  private get allCells() {
    return this.checks.flatMap((c) => this.rowCells(c));
  }

  private setOpen(next: CoverageCellRef | null) {
    const same = (a: CoverageCellRef | null, b: CoverageCellRef | null) => a?.check === b?.check && a?.part === b?.part;
    if (same(next, this.open)) return;
    const cell = next ? this.cellOf(next.check, next.part) : undefined;
    if (!this.emit<CoverageOpenChange>("tc-open-change", { open: next, cell }, { cancelable: true })) return;
    this.open = next;
    if (next && cell) {
      const check = this.checks.find((c) => c.id === next.check);
      const part = this.parts.find((p) => p.id === next.part);
      this.announce = `${check?.label} for ${part?.label}: ${this.label(cell.status)}${cell.detail ? `. ${cell.detail}` : ""}`;
    } else this.announce = "Detail closed";
  }

  /* ---------- Keyboard: the grid ---------- */

  private focusCell(r: number, c: number) {
    const rows = this.checks.length + 1;
    const cols = this.parts.length + 1;
    if (!this.checks.length || !this.parts.length) return;
    this.active = { r: Math.max(0, Math.min(rows - 1, r)), c: Math.max(0, Math.min(cols - 1, c)) };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-cell="${this.active.r}:${this.active.c}"]`)?.focus());
  }

  private onGridKey = (e: KeyboardEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]");
    if (!cell || e.isComposing || e.altKey) return;
    const [r, c] = cell.dataset.cell!.split(":").map(Number);
    const mod = isMac() ? e.metaKey : e.ctrlKey;
    const last = { r: this.checks.length, c: this.parts.length };
    const moves: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, c - 1],
      ArrowRight: [r, c + 1],
      Home: mod ? [0, 0] : [r, 0],
      End: mod ? [last.r, last.c] : [r, last.c],
      PageUp: [r - 5, c],
      PageDown: [r + 5, c],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      this.focusCell(move[0], move[1]);
      return;
    }
    if (e.metaKey || e.ctrlKey) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.toggle(r, c);
    } else if (e.key === "Escape" && this.open) {
      e.preventDefault();
      this.setOpen(null);
    }
  };

  private toggle(r: number, c: number) {
    const check = this.checks[r];
    const part = this.parts[c];
    // Totals have no detail
    if (!check || !part) return;
    const isOpen = this.open?.check === check.id && this.open?.part === part.id;
    this.setOpen(isOpen ? null : { check: check.id, part: part.id });
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The active cell stays inside the grid when rows or columns go away
    const rows = this.checks.length + 1;
    const cols = this.parts.length + 1;
    const { r, c } = this.active;
    if (r >= rows || c >= cols) this.active = { r: Math.min(r, rows - 1), c: Math.min(c, cols - 1) };
    // An open cell whose row or column went away closes
    if (this.open && (!this.checks.some((x) => x.id === this.open!.check) || !this.parts.some((x) => x.id === this.open!.part))) this.open = null;
  }

  /* ---------- Rendering ---------- */

  private renderCell(check: CoverageCheck, r: number, part: CoveragePart, c: number) {
    const cell = this.cellOf(check.id, part.id);
    const isActive = this.active.r === r && this.active.c === c;
    const isOpen = this.open?.check === check.id && this.open?.part === part.id;
    return html`<td
      role="gridcell"
      class="ui-cov__cell"
      data-cell=${`${r}:${c}`}
      data-status=${cell.status}
      ?data-open=${isOpen}
      tabindex=${isActive ? 0 : -1}
      aria-controls=${ifDefined(isOpen ? `${this.uid}-detail` : undefined)}
      @focus=${() => {
        if (!isActive) this.active = { r, c };
      }}
      @pointerdown=${(e: PointerEvent) => {
        this.active = { r, c };
        if (e.pointerType === "mouse") e.preventDefault();
        (e.currentTarget as HTMLElement).focus({ preventScroll: true });
      }}
      @click=${() => {
        this.active = { r, c };
        this.toggle(r, c);
      }}
    >
      <span class="ui-cov__swatch" aria-hidden="true">${ICON[cell.status]()}</span>
      <span class="ui-cov__sr">${this.label(cell.status)}${isOpen ? ", detail shown" : ""}</span>
    </td>`;
  }

  private renderTotal(value: number | null, r: number, c: number, kind: "row" | "col" | "all") {
    const isActive = this.active.r === r && this.active.c === c;
    return html`<td
      role="gridcell"
      class="ui-cov__total"
      data-cell=${`${r}:${c}`}
      data-kind=${kind}
      tabindex=${isActive ? 0 : -1}
      @focus=${() => {
        if (!isActive) this.active = { r, c };
      }}
    >
      <span class="ui-cov__total-inner"><span class="ui-cov__total-num">${pct(value)}</span>${value === null
        ? nothing
        : html`<span class="ui-cov__meter" aria-hidden="true"><span class="ui-cov__meter-fill" style=${`inline-size: ${Math.round(value * 100)}%`}></span></span>`}</span>
    </td>`;
  }

  private renderGrid() {
    const { checks, parts } = this;
    const id = this.uid;
    const rows = checks.length + 2;
    return html`<div class="ui-cov__scroll">
      <table class="ui-cov__grid" role="grid" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} aria-rowcount=${rows} aria-colcount=${parts.length + 2} @keydown=${this.onGridKey}>
        <thead>
          <tr role="row" aria-rowindex="1">
            <th role="columnheader" class="ui-cov__corner" scope="col"><span class="ui-cov__corner-label">${this.checkLabel}</span></th>
            ${repeat(parts, (p) => p.id, (p) => html`<th role="columnheader" class="ui-cov__part" scope="col"><span class="ui-cov__part-label">${p.label}</span></th>`)}
            <th role="columnheader" class="ui-cov__part ui-cov__part--total" scope="col"><span class="ui-cov__part-label">${this.totalLabel}</span></th>
          </tr>
        </thead>
        <tbody>
          ${repeat(
            checks,
            (ch) => ch.id,
            (ch, r) => html`<tr role="row" class="ui-cov__row" aria-rowindex=${r + 2}>
              <th role="rowheader" class="ui-cov__check" scope="row">
                <span class="ui-cov__check-label">${ch.label}</span>
                ${ch.description ? html`<span class="ui-cov__check-desc">${ch.description}</span>` : nothing}
              </th>
              ${parts.map((p, c) => this.renderCell(ch, r, p, c))}
              ${this.renderTotal(this.score(this.rowCells(ch)), r, parts.length, "row")}
            </tr>`,
          )}
          <tr role="row" class="ui-cov__row ui-cov__row--total" aria-rowindex=${rows}>
            <th role="rowheader" class="ui-cov__check" scope="row"><span class="ui-cov__check-label">${this.totalLabel}</span></th>
            ${parts.map((p, c) => this.renderTotal(this.score(this.colCells(p)), checks.length, c, "col"))}
            ${this.renderTotal(this.score(this.allCells), checks.length, parts.length, "all")}
          </tr>
        </tbody>
      </table>
    </div>`;
  }

  private renderDetail() {
    const open = this.open;
    const check = open && this.checks.find((c) => c.id === open.check);
    const part = open && this.parts.find((p) => p.id === open.part);
    if (!open || !check || !part) return nothing;
    const cell = this.cellOf(check.id, part.id);
    const id = this.uid;
    return html`<section class="ui-cov__detail" id=${`${id}-detail`} data-status=${cell.status} aria-labelledby=${`${id}-detail-title`}>
      <div class="ui-cov__detail-head">
        <span class="ui-cov__swatch" data-status=${cell.status} aria-hidden="true">${ICON[cell.status]()}</span>
        <h4 class="ui-cov__detail-title" id=${`${id}-detail-title`}>${check.label}<span class="ui-cov__times" aria-hidden="true"> × </span><span class="ui-cov__sr"> for </span>${part.label}</h4>
        <span class="ui-cov__pill" data-status=${cell.status}>${this.label(cell.status)}</span>
        <button
          type="button"
          class="ui-cov__close"
          aria-label="Close detail"
          @click=${() => {
            const at = this.active;
            this.setOpen(null);
            this.focusCell(at.r, at.c);
          }}
        >${closeIcon()}</button>
      </div>
      ${check.description ? html`<p class="ui-cov__detail-check">${check.description}</p>` : nothing}
      <p class="ui-cov__detail-text">${cell.detail ?? (cell.status === "gap" ? "Nothing covers this yet." : cell.status === "none" ? "This check doesn't apply here." : "No detail given.")}</p>
      ${cell.evidence ? html`<p class="ui-cov__evidence">${cell.evidence}</p>` : nothing}
    </section>`;
  }

  protected override render() {
    const empty = !this.checks.length || !this.parts.length;
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<CoverageStatus, number>;
    for (const cell of this.allCells) counts[cell.status]++;
    const id = this.uid;
    return html`
      <span class="ui-cov__sr" role="status">${this.announce}</span>
      <span class="ui-cov__sr" id=${`${id}-keys`}>Arrow keys move between cells; Enter opens a cell's detail</span>
      <div class="ui-cov__card">
        <header class="ui-cov__head">
          <div class="ui-cov__titles">
            <h3 class="ui-cov__title" id=${`${id}-title`}>${this.heading}</h3>
            ${this.description ? html`<p class="ui-cov__desc">${this.description}</p>` : nothing}
          </div>
          ${empty ? nothing : html`<span class="ui-cov__overall"><span class="ui-cov__overall-num">${pct(this.score(this.allCells))}</span><span class="ui-cov__overall-label">${this.totalLabel.toLowerCase()}</span></span>`}
        </header>
        ${empty
          ? html`<p class="ui-cov__empty">No checks or parts to show yet.</p>`
          : html`<ul class="ui-cov__legend" aria-label="Legend">
                ${STATUSES.filter((s) => s !== "none" || counts.none).map(
                  (s) => html`<li class="ui-cov__legend-item"><span class="ui-cov__swatch" data-status=${s} aria-hidden="true">${ICON[s]()}</span>${this.label(s)}<span class="ui-cov__legend-count">${counts[s]}</span></li>`,
                )}
              </ul>
              ${this.renderGrid()} ${this.renderDetail()}`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cov"] {
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
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cov"] {
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
[data-ui="cov"] *, [data-ui="cov"] *::before, [data-ui="cov"] *::after { box-sizing: border-box; }
:where([data-ui="cov"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="cov"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="cov"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="cov"] h3, [data-ui="cov"] h4, [data-ui="cov"] p { margin: 0; }
[data-ui="cov"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cov"] svg[stroke-width] { stroke-width: 1.6; }
.ui-cov__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cov__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- Heading, overall share and the legend ----- */
.ui-cov__head { display: flex; align-items: flex-start; gap: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-cov__head { padding: var(--tc-space-4) var(--tc-space-4) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-cov__head { padding: var(--tc-space-3-5) var(--tc-space-4) 0; }
.ui-cov__titles { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-cov__title { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-normal); letter-spacing: -0.011em; }
:where([data-look="standard"], [data-look="standard"] *).ui-cov__title { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cov__title { color: var(--tc-text-strong); }
.ui-cov__desc { color: var(--tc-text-muted); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-cov__desc { font-size: var(--tc-font-size-sm); }
.ui-cov__overall { display: grid; flex: none; justify-items: end; }
.ui-cov__overall-num { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); letter-spacing: -0.02em; color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-cov__overall-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-cov__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5) var(--tc-space-4); padding: var(--tc-space-3) var(--tc-space-4) 0 !important; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-cov__legend-item { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-cov__legend-count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-cov__legend .ui-cov__swatch { width: 16px; height: 16px; border-radius: var(--tc-radius-xs); }
.ui-cov__legend .ui-cov__swatch > svg { width: 11px; height: 11px; }
/* A status swatch: a tint and its mark – colour is never the only cue */
.ui-cov__swatch { display: grid; place-items: center; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); }
.ui-cov__swatch[data-status="covered"], [data-status="covered"] > .ui-cov__swatch { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-cov__swatch[data-status="partial"], [data-status="partial"] > .ui-cov__swatch { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-cov__swatch[data-status="gap"], [data-status="gap"] > .ui-cov__swatch { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-cov__swatch[data-status="none"], [data-status="none"] > .ui-cov__swatch { background: var(--tc-fill-subtle); color: var(--tc-icon-muted); }
/* ----- The matrix ----- */
.ui-cov__scroll { margin-top: var(--tc-space-3); overflow-x: auto; border-top: var(--tc-hairline) solid var(--tc-divider); scrollbar-width: thin; }
.ui-cov__grid { width: 100%; border-collapse: collapse; border-spacing: 0; }
.ui-cov__grid th, .ui-cov__grid td { padding: 0; font-weight: inherit; text-align: left; vertical-align: middle; }
/* The first column stays put while the parts scroll sideways */
.ui-cov__grid th:first-child { position: sticky; left: 0; z-index: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-cov__grid th:first-child { background: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-cov__grid th:first-child { background: var(--tc-surface-raised); }
.ui-cov__corner { min-width: 148px; padding: var(--tc-space-2) var(--tc-space-4) !important; vertical-align: bottom !important; }
.ui-cov__corner-label, .ui-cov__part-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *):is(.ui-cov__corner-label, .ui-cov__part-label) { font-weight: var(--tc-font-weight-medium); }
.ui-cov__part { min-width: 56px; max-width: 104px; padding: var(--tc-space-3) var(--tc-space-1) var(--tc-space-2) !important; text-align: center !important; vertical-align: bottom !important; }
.ui-cov__part-label { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow-wrap: break-word; }
.ui-cov__part--total { min-width: 72px; padding-right: var(--tc-space-4) !important; }
.ui-cov__row > th, .ui-cov__row > td { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cov__check { padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2) var(--tc-space-4) !important; }
.ui-cov__check-label { display: block; color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
.ui-cov__check-desc { display: -webkit-box; overflow: hidden; margin-top: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
/* A cell: a tinted tile with its mark */
.ui-cov__cell { padding: var(--tc-space-1) !important; cursor: pointer; outline: none; }
.ui-cov__cell > .ui-cov__swatch { width: 100%; min-width: 40px; height: 30px; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-cov__cell:hover > .ui-cov__swatch { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-cov__cell:focus-visible > .ui-cov__swatch { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-cov__cell[data-open] > .ui-cov__swatch { box-shadow: inset 0 0 0 1.5px currentColor; }
.ui-cov__row:hover > th, .ui-cov__row:hover > td { background-color: var(--tc-fill-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-cov__row:hover > th:first-child { background: linear-gradient(var(--tc-fill-subtle), var(--tc-fill-subtle)), var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-cov__row:hover > th:first-child { background: linear-gradient(var(--tc-fill-subtle), var(--tc-fill-subtle)), var(--tc-surface-raised); }
/* Totals: the share and a slim meter */
.ui-cov__total { padding: var(--tc-space-1) var(--tc-space-2) !important; outline: none; }
.ui-cov__row > .ui-cov__total:last-child { padding-right: var(--tc-space-4) !important; }
.ui-cov__total:focus-visible .ui-cov__total-inner { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-cov__total-inner { display: grid; justify-items: center; gap: var(--tc-space-1); border-radius: var(--tc-radius-sm); }
.ui-cov__total-num { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-cov__total[data-kind="all"] .ui-cov__total-num { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-cov__meter { display: block; width: 100%; max-width: 48px; height: 3px; overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-cov__meter-fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); }
.ui-cov__row--total > th, .ui-cov__row--total > td { border-top: var(--tc-hairline) solid var(--tc-border-default); }
.ui-cov__row--total .ui-cov__check-label { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-cov__row--total .ui-cov__check-label { font-weight: var(--tc-font-weight-medium); }
.ui-cov__row--total > .ui-cov__total { padding-top: var(--tc-space-2) !important; padding-bottom: var(--tc-space-2-5) !important; }
.ui-cov__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* ----- A cell's detail ----- */
.ui-cov__detail { display: grid; gap: var(--tc-space-1-5); margin: 0 var(--tc-space-3) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); animation: ui-cov-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-cov__detail-head { display: flex; align-items: flex-start; gap: var(--tc-space-2); min-width: 0; }
.ui-cov__detail-head > .ui-cov__swatch { width: 20px; height: 20px; }
.ui-cov__detail-head > .ui-cov__swatch > svg { width: 12px; height: 12px; }
.ui-cov__detail-title { flex: 1; min-width: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-cov__times { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
.ui-cov__pill { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); }
.ui-cov__pill[data-status="covered"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-cov__pill[data-status="partial"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-cov__pill[data-status="gap"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-cov__pill[data-status="none"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-cov__close { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin-right: calc(-1 * var(--tc-space-1-5)) !important; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cov__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-cov__detail-check { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-cov__detail-text { line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-cov__evidence { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
@keyframes ui-cov-in { from { opacity: 0; transform: translateY(3px); } }
@container (max-width: 480px) {
  .ui-cov__corner { min-width: 104px; padding-right: var(--tc-space-2) !important; }
  .ui-cov__check { padding-right: var(--tc-space-2) !important; }
  .ui-cov__part { min-width: 36px; }
  .ui-cov__part--total { min-width: 52px; }
  .ui-cov__cell { padding: var(--tc-space-0-5) !important; }
  .ui-cov__cell > .ui-cov__swatch { min-width: 30px; }
  .ui-cov__total { padding: var(--tc-space-1) !important; }
  .ui-cov__check-desc { display: none; }
  .ui-cov__overall-num { font-size: var(--tc-font-size-lg); }
}
@media (pointer: coarse) {
  .ui-cov__cell > .ui-cov__swatch { height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cov"] *, [data-ui="cov"] *::before, [data-ui="cov"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-coverage-matrix")) customElements.define("tc-coverage-matrix", TcCoverageMatrix);

declare global {
  interface HTMLElementTagNameMap {
    "tc-coverage-matrix": TcCoverageMatrix;
  }
}

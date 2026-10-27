import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-provenance-summary> – what a document is made of: how much of it came from sources, from AI synthesis and from
 * its authors' own writing, for the whole document and section by section. Each row is a stacked bar; every segment
 * is a button that asks the app to open the lineage behind it (`tc-lineage-open`). Hovering or focusing a segment
 * lights that kind across every row and its legend entry, and the row says the segment's share.
 *
 *   <tc-provenance-summary .sections=${[{ id: "intro", title: "Introduction", sourced: 420, synthesis: 260, original: 180 }]}>
 *   </tc-provenance-summary>
 *
 * The bars are a grid: one tab stop, ← → move along a row, ↑ ↓ between rows, Home End to a row's ends, Ctrl+Home
 * Ctrl+End to the first and last segment, Enter or Space opens the lineage. Amounts are in any unit (`unit`, "words"
 * by default); the kinds' names are properties, so an app can use its own.
 */

export type ProvenanceKind = "sourced" | "synthesis" | "original";

export type ProvenanceSection = {
  id: string;
  title: string;
  /** How much came from sources – quoted, paraphrased or cited */
  sourced: number;
  /** How much the AI wrote from what it was given */
  synthesis: number;
  /** How much the authors wrote themselves */
  original: number;
};

/** Detail of tc-lineage-open: the section (null for the whole document), the kind, and its amount and share */
export type ProvenanceLineageOpen = { section: string | null; kind: ProvenanceKind; amount: number; share: number };

/* After Lucide: layers – the header's icon */
const headIcon = svg`<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"></path><path d="m2 12.65 9.17 4.16a2 2 0 0 0 1.66 0L22 12.65M2 17.65l9.17 4.16a2 2 0 0 0 1.66 0L22 17.65"></path>`;
const KINDS: ProvenanceKind[] = ["sourced", "synthesis", "original"];
const DEFAULT_LABELS: Record<ProvenanceKind, string> = { sourced: "From sources", synthesis: "AI synthesis", original: "Original writing" };

type Row = { id: string | null; title: string; amounts: Record<ProvenanceKind, number>; total: number };

let instances = 0;

const formats = new Map<string, Intl.NumberFormat>();
const numberFormat = (locale: string, options: Intl.NumberFormatOptions) => {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = formats.get(key);
  if (!f) formats.set(key, (f = new Intl.NumberFormat(locale, options)));
  return f;
};
const amountOf = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/**
 * What a document is made of: the share from sources, AI synthesis and original writing, per section and in total,
 * with each segment opening its lineage.
 * @tag tc-provenance-summary
 * @fires tc-lineage-open - A segment was pressed (detail: { section: string | null, kind: "sourced" | "synthesis" | "original", amount: number, share: number }) – section is null for the whole document
 */
export class TcProvenanceSummary extends TcElement {
  static override ui = "pvs";

  /** The heading, and the region's name */
  @property() accessor heading = "Provenance";
  /** What the summary covers, a quiet line under the heading – e.g. the document's name */
  @property() accessor scope = "";
  /** The document's sections, in order, with how much of each came from where */
  @property({ attribute: false }) accessor sections: ProvenanceSection[] = [];
  /** Names of the three kinds */
  @property({ attribute: false }) accessor kindLabels: Partial<Record<ProvenanceKind, string>> = {};
  /** The unit of the amounts, plural – "words", "characters", "sentences" */
  @property() accessor unit = "words";
  /** The name of the whole-document row */
  @property({ attribute: "total-label" }) accessor totalLabel = "Whole document";
  /** Hide the per-section rows and show the total only */
  @property({ type: Boolean, attribute: "total-only" }) accessor totalOnly = false;
  /** Locale for numbers */
  @property() accessor locale = "en-US";

  /** @internal The segment pointed at or focused: row index and kind */
  @state() private accessor active: { row: number; kind: ProvenanceKind } | null = null;

  private readonly uid = `tc-pvs${++instances}`;
  /** The segment Tab lands on */
  private cursor = { row: 0, kind: "sourced" as ProvenanceKind };

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  /* ---------- Data ---------- */

  /** @internal The whole document first, then each section */
  private get rows(): Row[] {
    const sections: Row[] = this.sections.map((s) => {
      const amounts = { sourced: amountOf(s.sourced), synthesis: amountOf(s.synthesis), original: amountOf(s.original) };
      return { id: s.id, title: s.title, amounts, total: amounts.sourced + amounts.synthesis + amounts.original };
    });
    const amounts = { sourced: 0, synthesis: 0, original: 0 };
    for (const r of sections) for (const k of KINDS) amounts[k] += r.amounts[k];
    const total: Row = { id: null, title: this.totalLabel, amounts, total: amounts.sourced + amounts.synthesis + amounts.original };
    return this.totalOnly ? [total] : [total, ...sections];
  }

  /** @internal */
  private label(kind: ProvenanceKind) {
    return this.kindLabels[kind] ?? DEFAULT_LABELS[kind];
  }
  /** @internal */
  private pct = (n: number) => numberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(n);
  /** @internal */
  private num = (n: number) => numberFormat(this.locale, { maximumFractionDigits: 0 }).format(n);
  /** @internal */
  private share(r: Row, k: ProvenanceKind) {
    return r.total > 0 ? r.amounts[k] / r.total : 0;
  }
  /** @internal Kinds of a row that have something in them */
  private present(r: Row) {
    return KINDS.filter((k) => r.amounts[k] > 0);
  }

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // Keep the tab stop on a segment that exists
    const rows = this.rows;
    const fix = (pos: { row: number; kind: ProvenanceKind }) => {
      const row = Math.min(pos.row, Math.max(0, rows.length - 1));
      const present = rows[row] ? this.present(rows[row]) : [];
      return { row, kind: present.includes(pos.kind) ? pos.kind : (present[0] ?? "sourced") };
    };
    this.cursor = fix(this.cursor);
    if (this.active && (!rows[this.active.row] || !this.present(rows[this.active.row]).includes(this.active.kind))) this.active = null;
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  /* ---------- Interaction ---------- */

  private segment(row: number, kind: ProvenanceKind) {
    return this.querySelector<HTMLButtonElement>(`.ui-pvs__row[data-row="${row}"] .ui-pvs__seg[data-kind="${kind}"]`);
  }

  private move(row: number, kind: ProvenanceKind) {
    this.cursor = { row, kind };
    this.active = { row, kind };
    this.requestUpdate();
    void this.updateComplete.then(() => this.segment(row, kind)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".ui-pvs__seg");
    if (!btn) return;
    const rows = this.rows;
    const row = Number(btn.closest<HTMLElement>(".ui-pvs__row")!.dataset.row);
    const kind = btn.dataset.kind as ProvenanceKind;
    const here = this.present(rows[row]);
    const at = here.indexOf(kind);
    /** The same kind in another row, else the one nearest to it */
    const near = (r: number) => {
      const there = this.present(rows[r]);
      if (there.includes(kind)) return kind;
      const want = KINDS.indexOf(kind);
      return there.reduce((best, k) => (Math.abs(KINDS.indexOf(k) - want) < Math.abs(KINDS.indexOf(best) - want) ? k : best), there[0]);
    };
    /** The next row in `step` direction that has any segment */
    const next = (from: number, step: number) => {
      for (let r = from + step; r >= 0 && r < rows.length; r += step) if (this.present(rows[r]).length) return r;
      return -1;
    };
    let to: { row: number; kind: ProvenanceKind } | null = null;
    if (e.key === "ArrowRight" && at < here.length - 1) to = { row, kind: here[at + 1] };
    else if (e.key === "ArrowLeft" && at > 0) to = { row, kind: here[at - 1] };
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const r = next(row, e.key === "ArrowDown" ? 1 : -1);
      if (r >= 0) to = { row: r, kind: near(r) };
    } else if (e.key === "Home" || e.key === "End") {
      const first = e.key === "Home";
      if (e.ctrlKey || e.metaKey) {
        const r = first ? next(-1, 1) : next(rows.length, -1);
        if (r >= 0) {
          const there = this.present(rows[r]);
          to = { row: r, kind: first ? there[0] : there[there.length - 1] };
        }
      } else to = { row, kind: first ? here[0] : here[here.length - 1] };
    } else if (e.key === "Escape" && this.active) {
      this.active = null;
      e.preventDefault();
      return;
    } else if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      return;
    } else return;
    e.preventDefault();
    if (to) this.move(to.row, to.kind);
  };

  private onFocusIn = (e: FocusEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".ui-pvs__seg");
    if (!btn) return;
    const row = Number(btn.closest<HTMLElement>(".ui-pvs__row")!.dataset.row);
    const kind = btn.dataset.kind as ProvenanceKind;
    this.cursor = { row, kind };
    this.active = { row, kind };
  };
  private onFocusOut = (e: FocusEvent) => {
    if (!this.contains(e.relatedTarget as Node | null)) this.active = null;
  };
  private onLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && !this.contains(document.activeElement)) this.active = null;
  };

  private open(r: Row, kind: ProvenanceKind) {
    this.emit<ProvenanceLineageOpen>("tc-lineage-open", { section: r.id, kind, amount: r.amounts[kind], share: this.share(r, kind) });
  }

  /* ---------- Render ---------- */

  private renderRow(r: Row, i: number) {
    const active = this.active;
    const mine = active?.row === i ? active.kind : null;
    const whole = r.id === null;
    const unit = this.unit;
    return html`<div class="ui-pvs__row" role="row" data-row=${i} ?data-total=${whole}>
      <span class="ui-pvs__name" role="rowheader">
        <span class="ui-pvs__title">${r.title}</span>
        <span class="ui-pvs__amount">${mine
          ? html`<span class="ui-pvs__read" data-kind=${mine}>${this.label(mine)} · <b>${this.pct(this.share(r, mine))}</b></span>`
          : html`${this.num(r.total)} ${unit}`}</span>
      </span>
      <div class="ui-pvs__bar">
        ${KINDS.map((k) => {
          const amount = r.amounts[k];
          const share = this.share(r, k);
          const empty = amount <= 0;
          const tab = !empty && this.cursor.row === i && this.cursor.kind === k ? 0 : -1;
          return html`<span class="ui-pvs__cell" role="gridcell" data-kind=${k} style=${styleMap({ width: `${share * 100}%` })}>
            <button
              type="button"
              class="ui-pvs__seg"
              data-kind=${k}
              tabindex=${tab}
              ?disabled=${empty}
              ?data-active=${mine === k}
              aria-label=${`${this.label(k)}: ${this.pct(share)}, ${this.num(amount)} ${unit}${empty ? "" : " – open lineage"}`}
              @click=${() => this.open(r, k)}
              @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && !empty && (this.active = { row: i, kind: k })}
            ></button>
          </span>`;
        })}
      </div>
    </div>`;
  }

  protected override render() {
    const rows = this.rows;
    const total = rows[0];
    const kind = this.active?.kind;
    // The header (.tc-head): on the tray in Standard, the card's first row in Clean
    const clean = this.resolvedLook === "clean";
    const head = cardHead({ icon: headIcon, title: this.heading, subtitle: this.scope || undefined, id: `${this.uid}-title` });
    return html`
      ${clean ? nothing : head}
      <div class="ui-pvs__card">
        ${clean ? head : nothing}
        <div class="ui-pvs__inner">
          <ul class="ui-pvs__legend" aria-label="In total" ?data-active=${!!kind}>
            ${KINDS.map(
              (k) => html`<li class="ui-pvs__key" data-kind=${k} ?data-active=${kind === k}>
                <span class="ui-pvs__key-head"><span class="ui-pvs__swatch" aria-hidden="true"></span>${this.label(k)}</span>
                <span class="ui-pvs__key-share">${this.pct(this.share(total, k))}</span>
              </li>`,
            )}
          </ul>
          ${total.total > 0
            ? html`<div
                class="ui-pvs__grid"
                role="grid"
                aria-label=${`${this.heading} by section – arrow keys move between segments, Enter opens the lineage`}
                ?data-active=${!!kind}
                data-kind=${ifDefined(kind)}
                @keydown=${this.onKey}
                @focusin=${this.onFocusIn}
                @focusout=${this.onFocusOut}
                @pointerleave=${this.onLeave}
              >
                ${repeat(
                  rows,
                  (r) => r.id ?? "#total",
                  (r, i) => this.renderRow(r, i),
                )}
              </div>`
            : html`<p class="ui-pvs__empty">Nothing written yet</p>`}
        </div>
      </div>
      ${this.renderFoot(rows)}
    `;
  }

  /** The section that leans least on sources – where a reviewer looks first */
  private renderFoot(rows: Row[]) {
    const sections = rows.filter((r) => r.id !== null && r.total > 0);
    if (sections.length < 2) return nothing;
    const least = sections.reduce((low, r) => (this.share(r, "sourced") < this.share(low, "sourced") ? r : low));
    return html`<p class="ui-pvs__foot">
      <span class="ui-pvs__foot-label">Least ${this.label("sourced").toLowerCase()}:</span>
      <b class="ui-pvs__foot-name">${least.title}</b>
      <span class="ui-pvs__foot-share">${this.pct(this.share(least, "sourced"))}</span>
    </p>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pvs"] {
  /* The three kinds – override them on [data-ui="pvs"] */
  --tc-provenance-summary-sourced: var(--tc-source-grounded-fg);
  --tc-provenance-summary-synthesis: var(--tc-source-model-fg);
  --tc-provenance-summary-original: var(--tc-text-muted);
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 480px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pvs"] {
  --tc-provenance-summary-sourced: var(--tc-source-grounded-fg);
  --tc-provenance-summary-synthesis: var(--tc-source-model-fg);
  --tc-provenance-summary-original: var(--tc-text-muted);
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 480px;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="pvs"] *, [data-ui="pvs"] *::before, [data-ui="pvs"] *::after { box-sizing: border-box; }
[data-ui="pvs"] { grid-template-columns: minmax(0, 1fr); }
:where([data-ui="pvs"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="pvs"]) :is(h3, p, ul) { margin: 0; padding: 0; }
:where([data-ui="pvs"]) ul { list-style: none; }
[data-ui="pvs"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
/* The white card (Clean: the one card) */
:where([data-look="standard"], [data-look="standard"] *).ui-pvs__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-pvs__inner { padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-pvs__inner { padding: 0 var(--tc-space-4) var(--tc-space-4); }
/* The legend: each kind's share of the whole document */
.ui-pvs__legend { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-3); }
.ui-pvs__key { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
/* The other kinds step back – the swatch fades, the text stays readable */
.ui-pvs__swatch, .ui-pvs__key-share { transition: opacity var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-pvs__legend[data-active] .ui-pvs__key:not([data-active]) .ui-pvs__swatch { opacity: 0.35; }
.ui-pvs__legend[data-active] .ui-pvs__key:not([data-active]) .ui-pvs__key-share { color: var(--tc-text-muted); }
.ui-pvs__key-head { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-pvs__key-head { line-height: var(--tc-line-height-tight); }
.ui-pvs__key-share { font-weight: var(--tc-font-weight-strong); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-pvs__key-share { font-size: var(--tc-font-size-2xl); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pvs__key-share { font-size: var(--tc-font-size-xl); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-strong); }
.ui-pvs__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); }
[data-kind="sourced"] > * > .ui-pvs__swatch, .ui-pvs__cell[data-kind="sourced"] { background: var(--tc-provenance-summary-sourced); }
[data-kind="synthesis"] > * > .ui-pvs__swatch, .ui-pvs__cell[data-kind="synthesis"] { background: var(--tc-provenance-summary-synthesis); }
[data-kind="original"] > * > .ui-pvs__swatch, .ui-pvs__cell[data-kind="original"] { background: var(--tc-provenance-summary-original); }
/* The rows: name and size above, the stacked bar below; the whole document first, under the legend */
.ui-pvs__grid { display: grid; margin-top: var(--tc-space-4); }
.ui-pvs__row { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2-5) 0; }
.ui-pvs__row[data-total] { padding-top: 0; padding-bottom: var(--tc-space-3-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-pvs__row[data-total] + .ui-pvs__row { padding-top: var(--tc-space-3-5); }
.ui-pvs__row:last-child { padding-bottom: 0; }
.ui-pvs__row[data-total]:last-child { border-bottom: 0; }
.ui-pvs__name { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-3); min-width: 0; }
.ui-pvs__title { min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-pvs__row[data-total] .ui-pvs__title { font-weight: var(--tc-font-weight-medium); }
.ui-pvs__amount { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-pvs__read { animation: ui-pvs-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-pvs__bar { display: flex; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-pvs__row[data-total] .ui-pvs__bar { height: var(--tc-meter-h-hero); }
.ui-pvs__cell { position: relative; flex: none; height: 100%; transition: width var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
/* A thin cut between the parts */
.ui-pvs__cell + .ui-pvs__cell::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; z-index: 1; width: 2px; background: var(--tc-surface-raised); pointer-events: none; }
.ui-pvs__seg { position: absolute; inset: 0; display: block; width: 100%; border-radius: 0; }
.ui-pvs__seg:disabled { display: none; }
/* Pointing at a kind: the others step back in every row */
.ui-pvs__grid[data-kind="sourced"] .ui-pvs__cell:not([data-kind="sourced"]),
.ui-pvs__grid[data-kind="synthesis"] .ui-pvs__cell:not([data-kind="synthesis"]),
.ui-pvs__grid[data-kind="original"] .ui-pvs__cell:not([data-kind="original"]) { opacity: 0.3; }
/* Focus: a ring around the bar the segment sits in – the lit kind says which segment */
.ui-pvs__bar:has(.ui-pvs__seg:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-pvs__seg:focus-visible { outline: none; }
/* Standard: the tray below the card · Clean: the last row of the card, under a hairline */
.ui-pvs__foot { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; min-height: 40px; margin: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-pvs__foot { padding: var(--tc-space-1) var(--tc-space-3) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pvs__foot { min-height: 44px; padding: 0 var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); line-height: var(--tc-line-height-tight); }
.ui-pvs__foot-label { flex: none; }
.ui-pvs__foot-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-pvs__foot-share { flex: none; font-variant-numeric: tabular-nums; }
.ui-pvs__empty { margin-top: var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
@keyframes ui-pvs-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
@container (max-width: 400px) {
  :where([data-look="standard"], [data-look="standard"] *).ui-pvs__inner { padding: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-pvs__inner { padding: 0 var(--tc-space-3-5) var(--tc-space-3-5); }
  :where([data-look="standard"], [data-look="standard"] *).ui-pvs__key-share { font-size: var(--tc-font-size-xl); }
  .ui-pvs__legend { gap: var(--tc-space-2); }
  /* Long names wrap rather than clip; the shares stay on one line */
  .ui-pvs__key { align-content: space-between; }
  .ui-pvs__key-head { align-items: baseline; white-space: normal; }
  .ui-pvs__swatch { transform: translateY(-1px); }
}
/* Touch screens: taller bars to aim at */
@media (hover: none) and (pointer: coarse) {
  .ui-pvs__bar { height: 12px; }
  .ui-pvs__row[data-total] .ui-pvs__bar { height: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="pvs"] *, [data-ui="pvs"] *::before, [data-ui="pvs"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-provenance-summary")) customElements.define("tc-provenance-summary", TcProvenanceSummary);

declare global {
  interface HTMLElementTagNameMap {
    "tc-provenance-summary": TcProvenanceSummary;
  }
}

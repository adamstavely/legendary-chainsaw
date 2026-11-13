import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-enrichment-grid> – a table a model fills in, cell by cell. The source columns are what the page already has
 * (a vendor, a website); the AI columns, marked with a sparkle, are filled by a prompt run on every row – the prompt
 * shows when you point at or focus the column's header. Each AI cell says where it stands: queued, filling (a quiet
 * shimmer), done (the value, with how sure the model was and a link to its source), failed (with Retry) or "Review"
 * when a person should look. The header counts the run in words – "1,204 of 2,000 cells · 3 failed · ~4 min left" –
 * with Pause / Resume and Retry failed. Only the rows in view are drawn, so thousands of rows scroll smoothly.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-enrichment-grid heading="Vendors" running .columns=${columns} .rows=${rows} .remaining=${240000}></tc-enrichment-grid>
 *
 * The page owns the run: it fills `rows` as cells finish, answers tc-run-change ({ running }) and tc-retry
 * ({ cells }), and sets `remaining` (ms) for the time left. Picking a cell – a click, Enter or Space – fires a
 * cancelable tc-cell-select ({ row, column, cell, selected }), for a cell inspector beside the grid.
 *
 * Keyboard (the WAI-ARIA grid pattern, one tab stop): arrows move cell by cell (up from the first row reaches the
 * column headers), Home / End to the row's ends, Ctrl+Home / Ctrl+End to the first and last row, Page Up / Page Down
 * by a screenful. Enter or Space picks the cell, R retries a failed cell, Escape hides a header's prompt.
 */

/* Icons: Lucide (ISC, lucide.dev) – table-properties, sparkles, pause, play, rotate-cw, external-link, triangle-alert */
const tableIcon = svg`<path d="M15 3v18"></path><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M21 9H3"></path><path d="M21 15H3"></path>`;
const icons = {
  sparkles: svg`<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path>`,
  pause: svg`<rect x="14" y="4" width="4" height="16" rx="1"></rect><rect x="6" y="4" width="4" height="16" rx="1"></rect>`,
  play: svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`,
  retry: svg`<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path>`,
  link: svg`<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>`,
  warn: svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`,
};
const glyph = (body: TemplateResult) =>
  html`<svg class="ui-eng__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

/** A column: a source column the page has, or an AI column a prompt fills */
export type EnrichmentColumn = {
  id: string;
  label: string;
  /** Filled by a model – marked with a sparkle, its cells carry a state */
  ai?: boolean;
  /** The prompt that fills an AI column – shown on its header */
  prompt?: string;
};

export type EnrichmentCellState = "queued" | "running" | "done" | "failed" | "review";

/** One AI cell */
export type EnrichmentCell = {
  state: EnrichmentCellState;
  /** What the model wrote – shown when done or under review */
  value?: string;
  /** How sure the model was, 0 to 1 */
  confidence?: number;
  /** Where the value came from – a link on the cell */
  source?: string;
  /** What went wrong, for a failed cell; why to look, for one under review */
  note?: string;
};

/** A row: the source columns' text, and each AI column's cell (missing: queued) */
export type EnrichmentRow = {
  id: string;
  cells: Record<string, string | number | EnrichmentCell | null | undefined>;
};

/** A cell's place */
export type EnrichmentSelection = { row: string; column: string };

/** Detail of tc-run-change */
export type EnrichmentRunChange = { running: boolean };
/** Detail of tc-retry: the failed cells to run again */
export type EnrichmentRetry = { cells: EnrichmentSelection[] };
/** Detail of tc-cell-select: the cell picked, under its own names and as `selected` */
export type EnrichmentCellSelect = { row: string; column: string; cell: EnrichmentCell | string | null; selected: EnrichmentSelection };

/** The run in numbers: every AI cell counted by state; `filled` is done plus under review */
export type EnrichmentProgress = { total: number; filled: number; done: number; review: number; running: number; queued: number; failed: number };

const isCell = (v: unknown): v is EnrichmentCell => typeof v === "object" && v !== null && "state" in v;

/** The AI cell at a row and column – a missing one is queued */
export function enrichmentCell(row: EnrichmentRow, column: string): EnrichmentCell {
  const v = row.cells[column];
  return isCell(v) ? v : { state: "queued" };
}

/** Counts every AI cell by state */
export function enrichmentProgress(columns: readonly EnrichmentColumn[], rows: readonly EnrichmentRow[]): EnrichmentProgress {
  const p: EnrichmentProgress = { total: 0, filled: 0, done: 0, review: 0, running: 0, queued: 0, failed: 0 };
  const ai = columns.filter((c) => c.ai);
  for (const row of rows)
    for (const c of ai) {
      p.total++;
      p[enrichmentCell(row, c.id).state]++;
    }
  p.filled = p.done + p.review;
  return p;
}

/** Time left in words – "~4 min left", "under a minute left" */
export function enrichmentTimeLeft(ms: number): string {
  if (!(ms > 0)) return "";
  if (ms < 60_000) return "under a minute left";
  const min = Math.round(ms / 60_000);
  if (min < 90) return `~${min} min left`;
  return `~${Math.round(min / 60)} h left`;
}

const WORD: Record<EnrichmentCellState, string> = { queued: "Queued", running: "Filling", done: "Done", failed: "Failed", review: "Review" };
/** Rows drawn above and below the ones in view */
const OVERSCAN = 6;

let instances = 0;

/**
 * A table a model fills in, cell by cell, with the run's progress, Pause / Resume and Retry failed.
 * @tag tc-enrichment-grid
 * @fires tc-run-change - Pause or Resume was pressed ({ running }: EnrichmentRunChange); cancelable – prevented, `running` stays as it was
 * @fires tc-retry - Retry failed, or R on a failed cell ({ cells }: EnrichmentRetry); cancelable – prevented, nothing is announced
 * @fires tc-cell-select - A cell was picked with a click, Enter or Space ({ row, column, cell, selected }: EnrichmentCellSelect); cancelable – prevented, `selected` stays as it was
 */
export class TcEnrichmentGrid extends TcElement {
  static override ui = "eng";

  /** The heading */
  @property() accessor heading = "Enrichment";
  /** A line under the heading – what's being enriched */
  @property() accessor description: string | undefined = undefined;
  /** The columns, in order – source columns and AI columns */
  @property({ attribute: false }) accessor columns: EnrichmentColumn[] = [];
  /** The rows – source text and AI cells by column id */
  @property({ attribute: false }) accessor rows: EnrichmentRow[] = [];
  /** Whether the run is going. Changed by Pause and Resume unless a tc-run-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor running = false;
  /** Time left in the run, in ms – the header says "~4 min left" */
  @property({ type: Number }) accessor remaining: number | undefined = undefined;
  /** The picked cell (null: none). Changed by picking a cell unless a tc-cell-select listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: EnrichmentSelection | null = null;
  /** Confidence below this (0–1) is called low */
  @property({ type: Number }) accessor threshold = 0.6;
  /** The locale for the counts and percentages */
  @property() accessor locale: string | undefined = undefined;

  /** @internal The cell holding the grid's tab stop; row -1 is the header */
  @state() accessor pos = { row: 0, col: 0 };
  /** @internal How far the rows are scrolled, in px */
  @state() accessor scrollY = 0;
  /** @internal The height of the scrolling area, in px */
  @state() accessor viewH = 480;
  /** @internal A header whose prompt Escape hid, until focus leaves it */
  @state() accessor tipHidden = -1;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-eng${++instances}`;
  private rowH = 36;
  private focusNext = false;
  private ro?: ResizeObserver;
  private frame = 0;
  private wasDone = false;

  private get scroller() {
    return this.querySelector<HTMLElement>(".ui-eng__scroll");
  }

  private n(v: number) {
    return new Intl.NumberFormat(this.locale).format(v);
  }
  private pct(v: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(v);
  }

  /* ---------- Lifecycle ---------- */

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    cancelAnimationFrame(this.frame);
  }

  protected override firstUpdated() {
    const h = parseFloat(getComputedStyle(this).getPropertyValue("--tc-eng-row-h"));
    if (h > 0) this.rowH = h;
    this.observe();
  }

  private observe() {
    const s = this.scroller;
    if (!s || this.ro) return;
    this.ro = new ResizeObserver(() => {
      const el = this.scroller;
      if (el && el.clientHeight && el.clientHeight !== this.viewH) this.viewH = el.clientHeight;
    });
    this.ro.observe(s);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const rows = this.rows.length;
    const cols = this.columns.length;
    this.pos = { row: Math.max(-1, Math.min(this.pos.row, rows - 1)), col: Math.max(0, Math.min(this.pos.col, Math.max(0, cols - 1))) };
    if (changed.has("rows") || changed.has("columns")) {
      const p = enrichmentProgress(this.columns, this.rows);
      const done = p.total > 0 && p.queued === 0 && p.running === 0;
      if (done && !this.wasDone && changed.get("rows") !== undefined) this.said = p.failed ? `Run finished – ${this.n(p.failed)} failed` : `All ${this.n(p.total)} cells filled`;
      this.wasDone = done;
    }
  }

  protected override updated() {
    this.observe();
    if (!this.focusNext) return;
    this.focusNext = false;
    this.cellAt(this.pos.row, this.pos.col)?.focus({ preventScroll: true });
  }

  private cellAt(row: number, col: number) {
    return this.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`);
  }

  private onScroll = () => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      const s = this.scroller;
      if (s) this.scrollY = s.scrollTop;
    });
  };

  /** Scrolls so the row is in view, under the sticky header */
  private reveal(row: number) {
    const s = this.scroller;
    if (!s || row < 0) return;
    const top = (row + 1) * this.rowH;
    const bottom = top + this.rowH;
    if (top - this.rowH < s.scrollTop) s.scrollTop = top - this.rowH;
    else if (bottom > s.scrollTop + s.clientHeight) s.scrollTop = bottom - s.clientHeight;
    this.scrollY = s.scrollTop;
  }

  /* ---------- Changes ---------- */

  private setRunning(next: boolean) {
    if (next === this.running) return;
    if (!this.emit<EnrichmentRunChange>("tc-run-change", { running: next }, { cancelable: true })) return;
    this.running = next;
    this.said = next ? "Run resumed" : "Run paused";
  }

  private retry(cells: EnrichmentSelection[]) {
    if (!cells.length) return;
    if (this.emit<EnrichmentRetry>("tc-retry", { cells }, { cancelable: true })) this.said = cells.length === 1 ? "Retrying 1 cell" : `Retrying ${this.n(cells.length)} cells`;
  }

  private failedCells(): EnrichmentSelection[] {
    const out: EnrichmentSelection[] = [];
    const ai = this.columns.filter((c) => c.ai);
    for (const row of this.rows) for (const c of ai) if (enrichmentCell(row, c.id).state === "failed") out.push({ row: row.id, column: c.id });
    return out;
  }

  private pick(r: number, c: number) {
    const row = this.rows[r];
    const col = this.columns[c];
    if (!row || !col) return;
    const v = row.cells[col.id];
    const cell = col.ai ? enrichmentCell(row, col.id) : v === undefined || v === null || isCell(v) ? null : String(v);
    const selected = { row: row.id, column: col.id };
    if (!this.emit<EnrichmentCellSelect>("tc-cell-select", { ...selected, cell, selected }, { cancelable: true })) return;
    this.selected = selected;
    this.said = `Picked ${col.label}, ${this.rowName(row)}`;
  }

  private rowName(row: EnrichmentRow) {
    const first = this.columns[0];
    const v = first ? row.cells[first.id] : undefined;
    return v === undefined || v === null || isCell(v) ? row.id : String(v);
  }

  /* ---------- Keyboard ---------- */

  private onFocusIn = (e: FocusEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-row][data-col]");
    if (!cell) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (row !== this.pos.row || col !== this.pos.col) this.pos = { row, col };
  };

  private onFocusOut = () => {
    this.tipHidden = -1;
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.isComposing) return;
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-row][data-col]");
    if (!cell) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const last = this.rows.length - 1;
    const lastCol = this.columns.length - 1;
    const ctrl = e.ctrlKey || e.metaKey;
    const page = Math.max(1, Math.floor(this.viewH / this.rowH) - 1);
    const moves: Record<string, [number, number]> = {
      ArrowUp: [row - 1, col],
      ArrowDown: [row + 1, col],
      ArrowLeft: [row, col - 1],
      ArrowRight: [row, col + 1],
      Home: ctrl ? [0, col] : [row, 0],
      End: ctrl ? [last, col] : [row, lastCol],
      PageUp: [Math.max(0, row - page), col],
      PageDown: [row + page, col],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      const r = Math.max(-1, Math.min(last, move[0]));
      const c = Math.max(0, Math.min(lastCol, move[1]));
      this.pos = { row: r, col: c };
      this.reveal(r);
      this.focusNext = true;
      return;
    }
    if (e.key === "Escape" && row === -1) {
      if (this.tipHidden !== col) {
        e.preventDefault();
        this.tipHidden = col;
      }
      return;
    }
    if (row < 0 || ctrl || e.altKey) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.pick(row, col);
    } else if (e.key === "r" || e.key === "R") {
      const r = this.rows[row];
      const c = this.columns[col];
      if (r && c?.ai && enrichmentCell(r, c.id).state === "failed") {
        e.preventDefault();
        this.retry([{ row: r.id, column: c.id }]);
      }
    }
  };

  /* ---------- Render ---------- */

  private renderHead() {
    return html`<div class="ui-eng__row ui-eng__headrow" role="row" aria-rowindex="1">
      ${this.columns.map((c, i) => {
        const on = this.pos.row === -1 && this.pos.col === i;
        const tip = c.ai && c.prompt ? `${this.uid}-tip-${i}` : undefined;
        return html`<div
          role="columnheader"
          class="ui-eng__colhead"
          data-row="-1"
          data-col=${i}
          ?data-ai=${c.ai}
          ?data-tip-hidden=${this.tipHidden === i}
          tabindex=${on ? 0 : -1}
          aria-describedby=${ifDefined(tip)}
        >
          ${c.ai ? html`<span class="ui-eng__spark">${glyph(icons.sparkles)}</span>` : nothing}<span class="ui-eng__colname">${c.label}</span>${c.ai
            ? html`<span class="ui-eng__sr"> (AI column)</span>`
            : nothing}
          ${tip ? html`<div class="ui-eng__tip" role="tooltip" id=${tip}>Prompt: ${c.prompt}</div>` : nothing}
        </div>`;
      })}
    </div>`;
  }

  private renderCell(row: EnrichmentRow, r: number, c: EnrichmentColumn, i: number) {
    const on = this.pos.row === r && this.pos.col === i;
    const picked = this.selected?.row === row.id && this.selected.column === c.id;
    const common = { tabindex: on ? 0 : -1 };
    if (!c.ai) {
      const v = row.cells[c.id];
      const text = v === undefined || v === null || isCell(v) ? "" : String(v);
      return html`<div
        role=${i === 0 ? "rowheader" : "gridcell"}
        class="ui-eng__cell"
        data-row=${r}
        data-col=${i}
        tabindex=${common.tabindex}
        aria-selected=${picked ? "true" : "false"}
        ?data-picked=${picked}
        @click=${() => this.pick(r, i)}
      ><span class="ui-eng__text">${text || html`<span class="ui-eng__muted">–</span>`}</span></div>`;
    }
    const cell = enrichmentCell(row, c.id);
    const href = cell.source ? safeUrl(cell.source) : undefined;
    const low = cell.confidence !== undefined && cell.confidence < this.threshold;
    let body: TemplateResult;
    if (cell.state === "queued") body = html`<span class="ui-eng__muted">${WORD.queued}</span>`;
    else if (cell.state === "running") body = html`<span class="ui-eng__shim" aria-hidden="true"></span><span class="ui-eng__sr">${WORD.running}</span>`;
    else if (cell.state === "failed")
      body = html`<span class="ui-eng__failed">${glyph(icons.warn)}${WORD.failed}</span><button
          type="button"
          class="ui-eng__retry"
          tabindex="-1"
          title=${cell.note ?? "Retry"}
          @click=${(e: Event) => {
            e.stopPropagation();
            this.retry([{ row: row.id, column: c.id }]);
          }}
        >Retry</button>`;
    else
      body = html`<span class="ui-eng__text">${cell.value ?? ""}</span>${cell.confidence !== undefined
          ? html`<span class="ui-eng__conf" ?data-low=${low}>${low ? "Low · " : ""}${this.pct(cell.confidence)}<span class="ui-eng__sr"> confidence</span></span>`
          : nothing}${cell.state === "review" ? html`<span class="ui-eng__review" title=${ifDefined(cell.note)}>${WORD.review}</span>` : nothing}${href
          ? html`<a class="ui-eng__source" href=${href} target="_blank" rel="noopener noreferrer" tabindex="-1" aria-label=${`Source for ${c.label}`} @click=${(e: Event) => e.stopPropagation()}
              >${glyph(icons.link)}</a
            >`
          : nothing}`;
    return html`<div
      role="gridcell"
      class="ui-eng__cell"
      data-row=${r}
      data-col=${i}
      data-state=${cell.state}
      tabindex=${common.tabindex}
      aria-selected=${picked ? "true" : "false"}
      aria-describedby=${`${this.uid}-keys`}
      ?data-picked=${picked}
      @click=${() => this.pick(r, i)}
    >${body}</div>`;
  }

  private renderRows() {
    const n = this.rows.length;
    const start = Math.max(0, Math.floor(this.scrollY / this.rowH) - 1 - OVERSCAN);
    const end = Math.min(n, Math.ceil((this.scrollY + this.viewH) / this.rowH) + OVERSCAN);
    const shown: number[] = [];
    for (let r = start; r < end; r++) shown.push(r);
    // The row holding the tab stop is always drawn, so focus never falls out of the grid
    if (this.pos.row >= 0 && (this.pos.row < start || this.pos.row >= end)) shown.push(this.pos.row);
    return shown.map((r) => {
      const row = this.rows[r];
      return html`<div class="ui-eng__row" role="row" aria-rowindex=${r + 2} data-id=${row.id} style=${styleMap({ top: `${(r + 1) * this.rowH}px` })}>
        ${this.columns.map((c, i) => this.renderCell(row, r, c, i))}
      </div>`;
    });
  }

  private renderBar(p: EnrichmentProgress) {
    const busy = p.queued + p.running > 0;
    const failed = p.failed;
    const share = p.total ? p.filled / p.total : 0;
    return html`<div class="ui-eng__bar">
      <div class="ui-eng__meter" aria-hidden="true"><span style=${styleMap({ width: `${share * 100}%` })}></span>${p.total
          ? html`<span class="ui-eng__meter-failed" style=${styleMap({ width: `${(failed / p.total) * 100}%` })}></span>`
          : nothing}</div>
      <div class="ui-eng__actions">
        ${busy
          ? html`<button type="button" class="ui-eng__btn ui-eng__run" @click=${() => this.setRunning(!this.running)}>
              ${glyph(this.running ? icons.pause : icons.play)}${this.running ? "Pause" : "Resume"}
            </button>`
          : nothing}
        ${failed
          ? html`<button type="button" class="ui-eng__btn ui-eng__retry-all" @click=${() => this.retry(this.failedCells())}>${glyph(icons.retry)}Retry failed (${this.n(failed)})</button>`
          : nothing}
      </div>
    </div>`;
  }

  private progressText(p: EnrichmentProgress) {
    if (!this.columns.some((c) => c.ai)) return "No AI columns";
    if (!p.total) return "No rows";
    const parts = [`${this.n(p.filled)} of ${this.n(p.total)} cells`];
    if (p.failed) parts.push(`${this.n(p.failed)} failed`);
    if (p.review) parts.push(`${this.n(p.review)} to review`);
    if (p.queued + p.running > 0) {
      if (!this.running) parts.push("Paused");
      else if (this.remaining !== undefined) {
        const left = enrichmentTimeLeft(this.remaining);
        if (left) parts.push(left);
      }
    }
    return parts.join(" · ");
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const p = enrichmentProgress(this.columns, this.rows);
    const n = this.rows.length;
    const aside = html`<span class="ui-eng__progress">${this.progressText(p)}</span>`;
    const head = cardHead({ icon: tableIcon, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside });
    const cols = this.columns.map((c) => (c.ai ? "minmax(var(--tc-eng-ai-w), 1.3fr)" : "minmax(var(--tc-eng-col-w), 1fr)")).join(" ");
    const grid = this.columns.length
      ? html`<div class="ui-eng__scroll" @scroll=${this.onScroll}>
          <div
            class="ui-eng__grid"
            role="grid"
            aria-labelledby=${`${this.uid}-title`}
            aria-rowcount=${n + 1}
            aria-colcount=${this.columns.length}
            aria-busy=${this.running && p.queued + p.running > 0 ? "true" : "false"}
            style=${styleMap({ "--tc-eng-cols": cols, height: `${(n + 1) * this.rowH}px` })}
            @keydown=${this.onKey}
            @focusin=${this.onFocusIn}
            @focusout=${this.onFocusOut}
          >
            ${this.renderHead()} ${this.renderRows()}
          </div>
          ${n ? nothing : html`<p class="ui-eng__none">No rows yet</p>`}
        </div>`
      : html`<p class="ui-eng__none">No columns yet</p>`;
    const body = html`${this.renderBar(p)}${grid}`;
    return html`${clean ? html`<div class="ui-eng__card">${head}${body}</div>` : html`${head}<div class="ui-eng__card">${body}</div>`}
      <span class="ui-eng__sr" id=${`${this.uid}-keys`}>Enter picks the cell, R retries a failed cell</span>
      <span class="ui-eng__sr" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="eng"] {
  --tc-eng-row-h: 36px;
  --tc-eng-h: 420px;
  --tc-eng-col-w: 140px;
  --tc-eng-ai-w: 180px;
  --tc-eng-meter-h: 4px;
  --tc-eng-tip-w: 280px;
  --tc-eng-pick-w: 2px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="eng"] {
  --tc-eng-row-h: 36px;
  --tc-eng-h: 420px;
  --tc-eng-col-w: 140px;
  --tc-eng-ai-w: 180px;
  --tc-eng-meter-h: 4px;
  --tc-eng-tip-w: 280px;
  --tc-eng-pick-w: 2px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="eng"] *, [data-ui="eng"] *::before, [data-ui="eng"] *::after { box-sizing: border-box; }
:where([data-ui="eng"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="eng"] button:focus-visible, .ui-eng__cell:focus-visible, .ui-eng__colhead:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-offset) * -1); }
.ui-eng__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-eng__glyph { display: block; flex: none; width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-eng__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-eng__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-eng__card > .tc-head + * { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-eng__progress { font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
/* ----- The bar: a thin meter and the run's actions ----- */
.ui-eng__bar { display: flex; align-items: center; gap: var(--tc-space-3); padding: var(--tc-space-2) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-eng__meter { position: relative; display: flex; flex: 1; height: var(--tc-eng-meter-h); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-eng__meter > span { display: block; height: 100%; background: var(--tc-accent); transition: width var(--tc-duration-base) var(--tc-ease-move); }
.ui-eng__meter > .ui-eng__meter-failed { background: var(--tc-status-danger-fg); }
.ui-eng__actions { display: flex; flex: none; gap: var(--tc-space-1); }
.ui-eng__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-eng__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
/* ----- The grid: rows absolutely placed, only the ones in view drawn ----- */
.ui-eng__scroll { position: relative; max-height: var(--tc-eng-h); overflow: auto; overscroll-behavior: contain; }
.ui-eng__grid { position: relative; width: max-content; min-width: 100%; }
.ui-eng__row { display: grid; grid-template-columns: var(--tc-eng-cols); width: 100%; height: var(--tc-eng-row-h); }
.ui-eng__row:not(.ui-eng__headrow) { position: absolute; left: 0; right: 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-eng__row:not(.ui-eng__headrow):hover { background: var(--tc-fill-subtle); }
.ui-eng__headrow { position: sticky; top: 0; z-index: 2; background: inherit; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *) .ui-eng__headrow { background: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *) .ui-eng__headrow { background: var(--tc-surface-raised); }
.ui-eng__colhead { position: relative; display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; padding: 0 var(--tc-space-3); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-eng__colname { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-eng__spark { display: inline-flex; color: var(--tc-accent-text); }
.ui-eng__spark .ui-eng__glyph { width: 12px; height: 12px; }
.ui-eng__colhead[data-ai] { background: var(--tc-accent-subtle); }
/* The prompt: a tooltip under an AI column's header, on hover or focus */
.ui-eng__tip { position: absolute; top: 100%; left: var(--tc-space-2); z-index: 3; display: none; width: var(--tc-eng-tip-w); max-width: 80cqi; padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); color: var(--tc-tooltip-fg); font-size: var(--tc-tooltip-font-size); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-snug); letter-spacing: normal; text-transform: none; white-space: normal; }
.ui-eng__colhead:is(:hover, :focus-visible):not([data-tip-hidden]) .ui-eng__tip { display: block; }
.ui-eng__cell { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; padding: 0 var(--tc-space-3); overflow: hidden; color: var(--tc-text-primary); cursor: default; }
.ui-eng__cell[data-picked] { box-shadow: inset 0 0 0 var(--tc-eng-pick-w) var(--tc-accent); }
.ui-eng__text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-eng__muted { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-eng__conf { flex: none; margin-left: auto; font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-eng__conf[data-low] { color: var(--tc-status-warning-fg); }
.ui-eng__review { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-status-warning-fg); }
.ui-eng__source { display: inline-flex; flex: none; color: var(--tc-text-muted); }
.ui-eng__source:hover { color: var(--tc-accent-text); }
.ui-eng__failed { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
.ui-eng__retry { margin-left: auto; font-size: var(--tc-font-size-sm); color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
/* Filling: a quiet shimmer where the value will land */
.ui-eng__shim { position: relative; flex: 1; max-width: 70%; height: var(--tc-space-2); overflow: hidden; border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); }
.ui-eng__shim::after { content: ""; position: absolute; inset: 0; background: var(--tc-shimmer); transform: translateX(-100%); animation: ui-eng-shimmer var(--tc-duration-shimmer) linear infinite; }
.ui-eng__none { margin: 0; padding: var(--tc-space-8) var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
@keyframes ui-eng-shimmer { to { transform: translateX(100%); } }
@container (max-width: 520px) {
  .ui-eng__bar { flex-wrap: wrap; }
  .ui-eng__meter { flex-basis: 100%; }
  .tc-head .ui-eng__progress { white-space: normal; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="eng"] *, [data-ui="eng"] *::before, [data-ui="eng"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-eng__meter > span { background: Highlight; }
  .ui-eng__cell[data-picked] { outline: 2px solid Highlight; }
}
`;
}

if (!customElements.get("tc-enrichment-grid")) customElements.define("tc-enrichment-grid", TcEnrichmentGrid);

declare global {
  interface HTMLElementTagNameMap {
    "tc-enrichment-grid": TcEnrichmentGrid;
  }
}

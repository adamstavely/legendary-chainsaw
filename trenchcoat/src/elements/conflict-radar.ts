import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-conflict-radar> – which agents working in parallel touch the same files, and where they collide. A grid of files
 * by agents, conflicts first, each file's status in a word and a mark. Two or more agents on a file is an overlap, and
 * line ranges that cross are a conflict, unless the file gives its own `status`. Picking a file or a cell opens what each
 * agent touched below the grid.
 *   · the grid is one tab stop: arrows move between cells, Home / End to the row's ends, Enter or Space opens the file,
 *     Escape closes it. On a narrow page it scrolls in its own box with the file column staying put
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-conflict-radar .agents=${agents} .files=${files}></tc-conflict-radar>
 */

export type ConflictStatus = "clear" | "overlap" | "conflict";
export type ConflictAgent = { id: string; name: string; branch?: string };
export type ConflictEdit = {
  /** The agent's id */
  agent: string;
  /** The lines it changed, first and last */
  lines?: [number, number];
  /** What it did, in a word: "refactor" */
  kind?: string;
};
export type ConflictFile = { path: string; edits: ConflictEdit[]; status?: ConflictStatus };
export type ConflictFilter = "all" | "conflicts";
export type ConflictSelectedChange = { selected: string | null; file: ConflictFile | null };
export type ConflictFilterChange = { filter: ConflictFilter };
export type ConflictResolve = { file: ConflictFile };

/** The element's words, every one renameable through `labels` */
export type ConflictRadarLabels = {
  file: string;
  all: string;
  conflicts: string;
  filter: string;
  clear: string;
  overlap: string;
  conflict: string;
  edited: string;
  untouched: string;
  /** {name} */
  crosses: string;
  noFiles: string;
  noConflicts: string;
  resolve: string;
  close: string;
  keys: string;
  /** {n} */
  summary: string;
  summaryOne: string;
  summaryNone: string;
};
export const defaultConflictRadarLabels: ConflictRadarLabels = {
  file: "File",
  all: "All",
  conflicts: "Conflicts",
  filter: "Show",
  clear: "Clear",
  overlap: "Overlap",
  conflict: "Conflict",
  edited: "Edited",
  untouched: "Not touched",
  crosses: "Crosses {name}",
  noFiles: "No agents are changing files yet.",
  noConflicts: "No conflicts right now.",
  resolve: "Resolve",
  close: "Close",
  keys: "Arrow keys move between cells. Enter opens the file. Escape closes it.",
  summary: "{n} conflicts",
  summaryOne: "1 conflict",
  summaryNone: "No conflicts",
};

const ORDER: Record<ConflictStatus, number> = { conflict: 0, overlap: 1, clear: 2 };
const ICON = svg`<path d="M6 3v12"></path><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path>`;
const MARKS: Record<ConflictStatus, ReturnType<typeof svg>> = {
  conflict: svg`<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6M9 9l6 6"></path>`,
  overlap: svg`<circle cx="9" cy="12" r="7"></circle><circle cx="15" cy="12" r="7"></circle>`,
  clear: svg`<path d="M20 6 9 17l-5-5"></path>`,
};
const crossing = (a: ConflictEdit, b: ConflictEdit) => !!a.lines && !!b.lines && a.agent !== b.agent && a.lines[0] <= b.lines[1] && b.lines[0] <= a.lines[1];
let instances = 0;

/** A file's status: its own, or worked out from who touched which lines */
export function conflictStatus(file: ConflictFile): ConflictStatus {
  if (file.status) return file.status;
  if (file.edits.some((a) => file.edits.some((b) => crossing(a, b)))) return "conflict";
  return new Set(file.edits.map((e) => e.agent)).size > 1 ? "overlap" : "clear";
}

/**
 * Which parallel agents touch the same files, and where they collide.
 * @tag tc-conflict-radar
 * @fires tc-selected-change - A file was opened or closed ({ selected, file }: ConflictSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-filter-change - The filter changed ({ filter }: ConflictFilterChange); cancelable – prevented, `filter` stays as it was
 * @fires tc-resolve - Resolve was pressed ({ file }: ConflictResolve)
 */
export class TcConflictRadar extends TcElement {
  static override ui = "cfr";

  /** The heading */
  @property() accessor heading = "Conflict radar";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The agents, one column each */
  @property({ attribute: false }) accessor agents: ConflictAgent[] = [];
  /** The files being changed */
  @property({ attribute: false }) accessor files: ConflictFile[] = [];
  /** The open file's path. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** "all" or "conflicts". Changed by the user unless a tc-filter-change listener calls preventDefault() */
  @property() accessor filter: ConflictFilter = "all";
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<ConflictRadarLabels> = {};

  @state() private accessor row = 0;
  @state() private accessor col = 0;
  private readonly uid = `tc-cfr-${++instances}`;

  private get words(): ConflictRadarLabels {
    return { ...defaultConflictRadarLabels, ...this.labels };
  }

  private get sorted() {
    return this.files.map((file, i) => ({ file, i, status: conflictStatus(file) })).sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.i - b.i);
  }

  private get shown() {
    return this.sorted.filter((f) => this.filter === "all" || f.status === "conflict");
  }

  private select(file: ConflictFile | null) {
    const selected = file?.path ?? null;
    if (selected === this.selected) return;
    if (this.emit<ConflictSelectedChange>("tc-selected-change", { selected, file }, { cancelable: true })) this.selected = selected;
  }

  private setFilter(filter: ConflictFilter) {
    if (filter === this.filter) return;
    if (!this.emit<ConflictFilterChange>("tc-filter-change", { filter }, { cancelable: true })) return;
    this.filter = filter;
    this.row = 0;
    this.col = 0;
  }

  private focusActive() {
    this.updateComplete.then(() => this.querySelector<HTMLElement>('[data-cell][tabindex="0"]')?.focus());
  }

  private onKey(e: KeyboardEvent) {
    const rows = this.shown;
    const r = Math.min(this.row, rows.length - 1);
    const last = this.agents.length;
    const moves: Record<string, [number, number]> = {
      ArrowRight: [r, Math.min(last, this.col + 1)],
      ArrowLeft: [r, Math.max(0, this.col - 1)],
      ArrowDown: [Math.min(rows.length - 1, r + 1), this.col],
      ArrowUp: [Math.max(0, r - 1), this.col],
      Home: [r, 0],
      End: [r, last],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      [this.row, this.col] = move;
      this.focusActive();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const file = rows[r]?.file;
      if (file) this.select(file.path === this.selected ? null : file);
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.select(null);
    }
  }

  private lines(edit: ConflictEdit) {
    return edit.lines ? (edit.lines[0] === edit.lines[1] ? `${edit.lines[0]}` : `${edit.lines[0]}–${edit.lines[1]}`) : this.words.edited;
  }

  private renderCell(file: ConflictFile, agent: ConflictAgent, r: number, c: number) {
    const w = this.words;
    const edits = file.edits.filter((e) => e.agent === agent.id);
    const crossed = edits.some((a) => file.edits.some((b) => crossing(a, b)));
    return html`<td
      role="gridcell"
      data-cell
      class="ui-cfr__cell"
      data-state=${crossed ? "conflict" : edits.length ? "edited" : "none"}
      tabindex=${r === this.row && c === this.col ? 0 : -1}
      @click=${() => {
        this.row = r;
        this.col = c;
        this.select(file);
      }}
    >
      ${edits.length ? html`<span class="ui-cfr__lines">${edits.map((e) => this.lines(e)).join(", ")}</span>` : html`<span class="ui-cfr__none" aria-hidden="true">–</span><span class="tc-sr-only">${w.untouched}</span>`}
    </td>`;
  }

  private renderStatus(status: ConflictStatus) {
    return html`<span class="ui-cfr__status" data-status=${status}><svg class="ui-cfr__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS[status]}</svg>${this.words[status]}</span>`;
  }

  private renderDetail(file: ConflictFile, status: ConflictStatus) {
    const w = this.words;
    const name = (id: string) => this.agents.find((a) => a.id === id)?.name ?? id;
    return html`<section class="ui-cfr__detail" aria-labelledby=${`${this.uid}-detail`}>
      <div class="ui-cfr__detail-head">
        <h4 class="ui-cfr__detail-path" id=${`${this.uid}-detail`}>${file.path}</h4>
        ${this.renderStatus(status)}
      </div>
      <ul class="ui-cfr__edits">
        ${file.edits.map((e) => {
          const others = [...new Set(file.edits.filter((o) => crossing(e, o)).map((o) => name(o.agent)))];
          return html`<li class="ui-cfr__edit">
            <b>${name(e.agent)}</b> <span class="ui-cfr__edit-lines">${e.lines ? `Lines ${this.lines(e)}` : w.edited}</span>${e.kind ? html` <span class="ui-cfr__kind">${e.kind}</span>` : nothing}
            ${others.map((o) => html`<span class="ui-cfr__cross">${w.crosses.replace("{name}", o)}</span>`)}
          </li>`;
        })}
      </ul>
      <div class="ui-cfr__actions">
        ${status === "clear" ? nothing : html`<button type="button" class="tc-btn-sm ui-cfr__resolve" @click=${() => this.emit<ConflictResolve>("tc-resolve", { file })}>${w.resolve}<span class="tc-sr-only"> ${file.path}</span></button>`}
        <button
          type="button"
          class="tc-btn-sm ui-cfr__close"
          @click=${() => {
            this.select(null);
            this.focusActive();
          }}
        >
          ${w.close}
        </button>
      </div>
    </section>`;
  }

  protected override render() {
    const w = this.words;
    const all = this.sorted;
    const rows = this.shown;
    const conflicts = all.filter((f) => f.status === "conflict").length;
    const summary = conflicts === 0 ? w.summaryNone : conflicts === 1 ? w.summaryOne : w.summary.replace("{n}", String(conflicts));
    const open = rows.find((f) => f.file.path === this.selected);
    const keys = `${this.uid}-keys`;
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-cfr__summary" data-any=${conflicts ? "true" : "false"}>${summary}</span>` })}
      <div class="ui-cfr__card">
        <div class="ui-cfr__filters" role="group" aria-label=${w.filter}>
          ${(["all", "conflicts"] as const).map(
            (f) => html`<button type="button" class="ui-cfr__filter" aria-pressed=${this.filter === f ? "true" : "false"} @click=${() => this.setFilter(f)}>${f === "all" ? w.all : w.conflicts} <span class="ui-cfr__n">${f === "all" ? all.length : conflicts}</span></button>`,
          )}
        </div>
        ${rows.length
          ? html`<div class="ui-cfr__scroll">
              <table class="ui-cfr__grid" role="grid" aria-labelledby=${`${this.uid}-title`} aria-describedby=${keys} @keydown=${this.onKey}>
                <thead>
                  <tr>
                    <th scope="col" class="ui-cfr__corner">${w.file}</th>
                    ${repeat(this.agents, (a) => a.id, (a) => html`<th scope="col" class="ui-cfr__agent"><span class="ui-cfr__agent-name">${a.name}</span>${a.branch ? html`<span class="ui-cfr__branch">${a.branch}</span>` : nothing}</th>`)}
                  </tr>
                </thead>
                <tbody>
                  ${repeat(
                    rows,
                    (f) => f.file.path,
                    (f, r) => html`<tr data-file=${f.file.path} data-status=${f.status} aria-selected=${f.file.path === this.selected ? "true" : "false"}>
                      <th
                        scope="row"
                        data-cell
                        class="ui-cfr__file"
                        tabindex=${r === this.row && this.col === 0 ? 0 : -1}
                        @click=${() => {
                          this.row = r;
                          this.col = 0;
                          this.select(f.file);
                        }}
                      >
                        <span class="ui-cfr__path">${f.file.path}</span>${this.renderStatus(f.status)}
                      </th>
                      ${this.agents.map((a, c) => this.renderCell(f.file, a, r, c + 1))}
                    </tr>`,
                  )}
                </tbody>
              </table>
            </div>
            <span class="tc-sr-only" id=${keys}>${w.keys}</span>`
          : html`<p class="ui-cfr__empty">${this.files.length ? w.noConflicts : w.noFiles}</p>`}
        ${open ? this.renderDetail(open.file, open.status) : nothing}
      </div>
      <span class="tc-sr-only" role="status">${summary}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cfr"] { position: relative; display: block; box-sizing: border-box; width: 100%; container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cfr"] { position: relative; display: block; box-sizing: border-box; width: 100%; container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="cfr"] *, [data-ui="cfr"] *::before, [data-ui="cfr"] *::after { box-sizing: border-box; }
[data-ui="cfr"] :where(p, ul, ol, h4) { margin: 0; padding: 0; }
[data-ui="cfr"] { --tc-cfr-bg: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cfr"] { --tc-cfr-bg: var(--tc-surface-on-tray); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cfr"] .ui-cfr__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-cfr__summary { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-cfr__summary[data-any="true"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-cfr__filters { display: flex; gap: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-cfr__filter { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-cfr__filter:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-cfr__filter[aria-pressed="true"] { background: var(--tc-fill-selected); color: var(--tc-text-primary); }
.ui-cfr__filter:focus-visible, .ui-cfr__cell:focus-visible, .ui-cfr__file:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-cfr__n { font-variant-numeric: tabular-nums; }
.ui-cfr__scroll { position: relative; overflow-x: auto; scrollbar-width: thin; }
.ui-cfr__grid { width: 100%; border-collapse: collapse; }
.ui-cfr__corner, .ui-cfr__agent { padding: var(--tc-space-2) var(--tc-space-3); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); text-align: left; vertical-align: bottom; }
.ui-cfr__agent-name { display: block; color: var(--tc-text-primary); white-space: nowrap; }
.ui-cfr__branch { display: block; font-family: var(--tc-font-mono); font-weight: var(--tc-font-weight-regular); white-space: nowrap; }
.ui-cfr__grid tr > :first-child { position: sticky; left: 0; z-index: 1; background: var(--tc-cfr-bg); }
.ui-cfr__file { min-width: 11em; padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); font-weight: var(--tc-font-weight-regular); text-align: left; cursor: pointer; }
.ui-cfr__corner { padding-left: var(--tc-space-4); }
.ui-cfr__path { display: block; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-cfr__status { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-cfr__status[data-status="overlap"] { color: var(--tc-status-warning-fg); }
.ui-cfr__status[data-status="conflict"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-cfr__mark { flex: none; width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-cfr__cell { min-width: 6em; padding: var(--tc-space-2) var(--tc-space-3); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; cursor: pointer; }
.ui-cfr__cell[data-state="edited"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-cfr__cell[data-state="conflict"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-cfr__none { color: var(--tc-text-muted); }
tr[aria-selected="true"] > .ui-cfr__file { background: var(--tc-fill-selected); }
.ui-cfr__empty { padding: var(--tc-space-6) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); color: var(--tc-text-secondary); text-align: center; }
.ui-cfr__detail { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-cfr__detail-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-cfr__detail-path { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-cfr__edits { display: grid; gap: var(--tc-space-1); list-style: none; }
.ui-cfr__edit b { font-weight: var(--tc-font-weight-medium); }
.ui-cfr__edit-lines, .ui-cfr__kind { color: var(--tc-text-secondary); }
.ui-cfr__cross { display: block; color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-cfr__actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); }
@media (forced-colors: active) {
  .ui-cfr__filter[aria-pressed="true"] { background: Highlight; color: HighlightText; forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-conflict-radar")) customElements.define("tc-conflict-radar", TcConflictRadar);

declare global {
  interface HTMLElementTagNameMap {
    "tc-conflict-radar": TcConflictRadar;
  }
}

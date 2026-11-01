import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
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
 *   · a conflict whose edits say their `approach` can be settled: the detail offers each agent's way as a radio group, and
 *     keeping one marks the file Settled. With `mergeable`, the header's merge button waits until no conflict is unsettled.
 *     This records a choice and asks: your merge tool does the merging
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
  /** The agent's way of doing it, in one sentence, to choose between */
  approach?: string;
};
export type ConflictFile = { path: string; edits: ConflictEdit[]; status?: ConflictStatus };
export type ConflictFilter = "all" | "conflicts";
export type ConflictSelectedChange = { selected: string | null; file: ConflictFile | null };
export type ConflictFilterChange = { filter: ConflictFilter };
export type ConflictResolve = { file: ConflictFile };
/** The kept agent's id, by file path */
export type ConflictSettled = Record<string, string>;
export type ConflictSettledChange = { settled: ConflictSettled; file: ConflictFile; agent: string | null };
export type ConflictMerge = { settled: ConflictSettled };

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
  summarySettled: string;
  changed: string;
  settled: string;
  /** {name} */
  settledBy: string;
  kept: string;
  legend: string;
  /** {path} */
  keepOne: string;
  keep: string;
  unsettle: string;
  /** {n} */
  merge: string;
  mergeOne: string;
  /** {n} */
  left: string;
  leftOne: string;
  merging: string;
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
  summarySettled: "All settled",
  changed: "Changed",
  settled: "Settled",
  settledBy: "Settled: {name} kept",
  kept: "Kept",
  legend: "What the cells mean",
  keepOne: "Which way to keep in {path}",
  keep: "Keep",
  unsettle: "Undo",
  merge: "Merge {n} branches",
  mergeOne: "Merge 1 branch",
  left: "{n} conflicts left to settle",
  leftOne: "1 conflict left to settle",
  merging: "Merge requested",
};

const ORDER: Record<ConflictStatus, number> = { conflict: 0, overlap: 1, clear: 2 };
// A settled conflict stays above what never conflicted, but below what still needs a decision
const SETTLED_ORDER = 0.5;
const folderOf = (path: string) => path.slice(0, path.lastIndexOf("/") + 1);
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
 * @fires tc-settled-change - A way was kept or undone ({ settled, file, agent }: ConflictSettledChange); cancelable – prevented, `settled` stays as it was
 * @fires tc-merge - Merge was pressed ({ settled }: ConflictMerge); cancelable – prevented, nothing is announced
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
  /** Which agent's way is kept, by file path. Changed by the user unless a tc-settled-change listener calls preventDefault() */
  @property({ attribute: false }) accessor settled: ConflictSettled = {};
  /** Show the merge button, enabled once no conflict is unsettled */
  @property({ type: Boolean }) accessor mergeable = false;
  /** The merge button's words; {n} is how many agents. By default "Merge {n} branches" */
  @property({ attribute: "merge-label" }) accessor mergeLabel: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<ConflictRadarLabels> = {};

  @state() private accessor row = 0;
  @state() private accessor col = 0;
  @state() private accessor announce = "";
  private readonly uid = `tc-cfr-${++instances}`;

  private get words(): ConflictRadarLabels {
    return { ...defaultConflictRadarLabels, ...this.labels };
  }

  private keptIn(file: ConflictFile, status: ConflictStatus) {
    const agent = status === "conflict" ? this.settled[file.path] : undefined;
    return agent && file.edits.some((e) => e.agent === agent) ? agent : null;
  }

  private get sorted() {
    const rank = (f: { file: ConflictFile; status: ConflictStatus }) => (this.keptIn(f.file, f.status) ? SETTLED_ORDER : ORDER[f.status]);
    return this.files
      .map((file, i) => ({ file, i, status: conflictStatus(file) }))
      .sort((a, b) => rank(a) - rank(b) || a.i - b.i);
  }

  private setKept(file: ConflictFile, agent: string | null) {
    const { [file.path]: _gone, ...rest } = this.settled;
    const settled = agent ? { ...rest, [file.path]: agent } : rest;
    if (this.emit<ConflictSettledChange>("tc-settled-change", { settled, file, agent }, { cancelable: true })) this.settled = settled;
    else this.requestUpdate();
  }

  private merge() {
    if (this.emit<ConflictMerge>("tc-merge", { settled: this.settled }, { cancelable: true })) this.announce = this.words.merging;
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

  private renderCell(file: ConflictFile, agent: ConflictAgent, r: number, c: number, kept: string | null) {
    const w = this.words;
    const edits = file.edits.filter((e) => e.agent === agent.id);
    const crossed = edits.some((a) => file.edits.some((b) => crossing(a, b)));
    const cellState = !edits.length ? "none" : kept ? (kept === agent.id ? "kept" : "dropped") : crossed ? "conflict" : "edited";
    return html`<td
      role="gridcell"
      data-cell
      class="ui-cfr__cell"
      data-state=${cellState}
      tabindex=${r === this.row && c === this.col ? 0 : -1}
      @click=${() => {
        this.row = r;
        this.col = c;
        this.select(file);
      }}
    >
      ${edits.length
        ? html`<span class="ui-cfr__lines">${edits.map((e) => this.lines(e)).join(", ")}</span>${cellState === "kept" ? html`<span class="ui-cfr__kept"><svg class="ui-cfr__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS.clear}</svg>${w.kept}</span>` : nothing}`
        : html`<span class="ui-cfr__none" aria-hidden="true">–</span><span class="tc-sr-only">${w.untouched}</span>`}
    </td>`;
  }

  private renderStatus(status: ConflictStatus, kept: string | null = null) {
    if (kept) {
      const name = this.agents.find((a) => a.id === kept)?.name ?? kept;
      return html`<span class="ui-cfr__status" data-status="settled"><svg class="ui-cfr__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS.clear}</svg>${this.words.settledBy.replace("{name}", name)}</span>`;
    }
    return html`<span class="ui-cfr__status" data-status=${status}><svg class="ui-cfr__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS[status]}</svg>${this.words[status]}</span>`;
  }

  private renderKeep(file: ConflictFile, kept: string | null) {
    const w = this.words;
    const name = (id: string) => this.agents.find((a) => a.id === id)?.name ?? id;
    const ways = [...new Set(file.edits.map((e) => e.agent))].map((agent) => ({ agent, approach: file.edits.find((e) => e.agent === agent && e.approach)?.approach }));
    const id = `${this.uid}-keep`;
    return html`<div class="ui-cfr__keep">
      <p class="ui-cfr__keep-title" id=${id}>${w.keepOne.replace("{path}", file.path)}</p>
      <div class="ui-cfr__ways" role="radiogroup" aria-labelledby=${id}>
        ${ways.map(
          (way) => html`<label class="ui-cfr__way" ?data-on=${kept === way.agent}>
            <input type="radio" name=${`${this.uid}-way`} value=${way.agent} .checked=${live(kept === way.agent)} @change=${() => this.setKept(file, way.agent)} />
            <span class="ui-cfr__way-text">
              <span class="ui-cfr__way-name">${w.keep} ${name(way.agent)}${kept === way.agent ? html`<span class="ui-cfr__kept"><svg class="ui-cfr__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS.clear}</svg>${w.kept}</span>` : nothing}</span>
              ${way.approach ? html`<span class="ui-cfr__approach">${way.approach}</span>` : nothing}
            </span>
          </label>`,
        )}
      </div>
      ${kept ? html`<button type="button" class="tc-btn-sm ui-cfr__unsettle" @click=${() => this.setKept(file, null)}>${w.unsettle}<span class="tc-sr-only"> ${file.path}</span></button>` : nothing}
    </div>`;
  }

  private renderDetail(file: ConflictFile, status: ConflictStatus) {
    const w = this.words;
    const name = (id: string) => this.agents.find((a) => a.id === id)?.name ?? id;
    const kept = this.keptIn(file, status);
    const canKeep = status === "conflict" && (this.mergeable || file.edits.some((e) => e.approach));
    return html`<section class="ui-cfr__detail" aria-labelledby=${`${this.uid}-detail`}>
      <div class="ui-cfr__detail-head">
        <h4 class="ui-cfr__detail-path" id=${`${this.uid}-detail`}>${file.path}</h4>
        ${this.renderStatus(status, kept)}
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
      ${canKeep ? this.renderKeep(file, kept) : nothing}
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
    const unsettled = all.filter((f) => f.status === "conflict" && !this.keptIn(f.file, f.status)).length;
    const summary = conflicts === 0 ? w.summaryNone : unsettled === 0 ? w.summarySettled : unsettled === 1 ? w.summaryOne : w.summary.replace("{n}", String(unsettled));
    const count = this.agents.length;
    const mergeWords = this.mergeLabel ? this.mergeLabel.replace("{n}", String(count)) : count === 1 ? w.mergeOne : w.merge.replace("{n}", String(count));
    const open = rows.find((f) => f.file.path === this.selected);
    const keys = `${this.uid}-keys`;
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-cfr__summary" data-any=${unsettled ? "true" : "false"}>${summary}</span>${this.mergeable ? html`<button type="button" class="ui-cfr__merge" ?disabled=${unsettled > 0 || !this.files.length} aria-describedby=${unsettled ? `${this.uid}-left` : nothing} @click=${this.merge}>${mergeWords}</button>` : nothing}` })}
      <div class="ui-cfr__card">
        ${this.mergeable && unsettled ? html`<p class="ui-cfr__left" id=${`${this.uid}-left`}>${unsettled === 1 ? w.leftOne : w.left.replace("{n}", String(unsettled))}</p>` : nothing}
        <div class="ui-cfr__bar">
          <div class="ui-cfr__filters" role="group" aria-label=${w.filter}>
            ${(["all", "conflicts"] as const).map(
              (f) => html`<button type="button" class="ui-cfr__filter" aria-pressed=${this.filter === f ? "true" : "false"} @click=${() => this.setFilter(f)}>${f === "all" ? w.all : w.conflicts} <span class="ui-cfr__n">${f === "all" ? all.length : conflicts}</span></button>`,
            )}
          </div>
          <ul class="ui-cfr__legend" aria-label=${w.legend}>
            ${(["changed", "overlap", "conflict", "settled"] as const).map((k) => html`<li class="ui-cfr__key"><span class="ui-cfr__swatch" data-key=${k} aria-hidden="true"></span>${w[k]}</li>`)}
          </ul>
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
                    (f, r) => html`<tr data-file=${f.file.path} data-status=${f.status} ?data-settled=${!!this.keptIn(f.file, f.status)} aria-selected=${f.file.path === this.selected ? "true" : "false"}>
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
                        <span class="ui-cfr__path">${folderOf(f.file.path) ? html`<span class="ui-cfr__folder">${folderOf(f.file.path)}</span>` : nothing}${f.file.path.slice(folderOf(f.file.path).length)}</span>${this.renderStatus(f.status, this.keptIn(f.file, f.status))}
                      </th>
                      ${this.agents.map((a, c) => this.renderCell(f.file, a, r, c + 1, this.keptIn(f.file, f.status)))}
                    </tr>`,
                  )}
                </tbody>
              </table>
            </div>
            <span class="tc-sr-only" id=${keys}>${w.keys}</span>`
          : html`<p class="ui-cfr__empty">${this.files.length ? w.noConflicts : w.noFiles}</p>`}
        ${open ? this.renderDetail(open.file, open.status) : nothing}
      </div>
      <span class="tc-sr-only" role="status">${this.announce || summary}</span>`;
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
.ui-cfr__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-4); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-cfr__filters { display: flex; gap: var(--tc-space-1); }
.ui-cfr__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); list-style: none; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-cfr__key { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-cfr__swatch { width: var(--tc-space-3); height: var(--tc-space-2); border-radius: var(--tc-radius-2xs); background: var(--tc-fill-selected); }
.ui-cfr__swatch[data-key="overlap"] { background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-fg); }
.ui-cfr__swatch[data-key="conflict"] { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-fg); }
.ui-cfr__swatch[data-key="settled"] { background: var(--tc-status-success-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-success-fg); }
.ui-cfr__left { padding: var(--tc-space-3) var(--tc-space-4) 0; color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-cfr__merge { flex: none; margin-inline-start: var(--tc-space-3); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font: inherit; font-size: var(--tc-font-size-xs); font-weight: var(--tc-control-font-weight); white-space: nowrap; cursor: pointer; }
.ui-cfr__merge:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-cfr__merge:disabled { background: var(--tc-fill-hover); box-shadow: none; color: var(--tc-text-secondary); cursor: not-allowed; }
.ui-cfr__merge:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
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
.ui-cfr__status[data-status="settled"] { color: var(--tc-status-success-fg); font-weight: var(--tc-font-weight-medium); }
.ui-cfr__folder { color: var(--tc-text-secondary); }
.ui-cfr__mark { flex: none; width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-cfr__cell { min-width: 6em; padding: var(--tc-space-2) var(--tc-space-3); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; cursor: pointer; }
.ui-cfr__cell[data-state="edited"] { background: var(--tc-fill-selected); }
tr[data-status="overlap"] > .ui-cfr__cell[data-state="edited"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-cfr__cell[data-state="kept"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); font-weight: var(--tc-font-weight-medium); }
.ui-cfr__cell[data-state="dropped"] { color: var(--tc-text-secondary); text-decoration: line-through; }
.ui-cfr__kept { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); margin-inline-start: var(--tc-space-1-5); color: var(--tc-status-success-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
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
.ui-cfr__keep { display: grid; gap: var(--tc-space-1-5); justify-items: start; }
.ui-cfr__keep-title { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-cfr__ways { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); gap: var(--tc-space-2); width: 100%; }
.ui-cfr__way { display: flex; align-items: flex-start; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-control-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); cursor: pointer; }
.ui-cfr__way:hover { background: var(--tc-fill-hover); }
.ui-cfr__way[data-on] { background: var(--tc-fill-selected); }
.ui-cfr__way input { flex: none; margin: var(--tc-space-0-5) 0 0; accent-color: var(--tc-action-primary-bg); }
.ui-cfr__way input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-cfr__way-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-cfr__way-name { font-weight: var(--tc-font-weight-medium); }
.ui-cfr__approach { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
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

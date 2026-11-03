import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-problem-list> – what a build, type check or linter found: errors, warnings and notes, grouped by file. Each has a
 * mark for its severity (a shape and a word, not only a colour), the message, where it came from and its line. A filter
 * by severity shows counts; a text filter narrows by message, file or code. Nothing here runs a check: the page passes
 * `problems` and a `status`, and decides what opening one or applying a fix means.
 *   · the list is one tab stop, a tree: ↑ / ↓ move, → opens a file, goes to its first problem or to a problem's fix,
 *     ← goes back, Enter opens a problem (tc-open) or folds a file
 *   · `group-by="none"` lists the problems without files, each with its path
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-problem-list .problems=${[{ path: "src/a.ts", line: 4, severity: "error", message: "Cannot find name 'x'." }]}>
 *   </tc-problem-list>
 */

export type ProblemSeverity = "error" | "warning" | "info";
export type ProblemItem = {
  /** Stable identity; path, line, column and message stand in when it's left out */
  id?: string;
  path: string;
  /** 1-based */
  line: number;
  /** 1-based */
  column?: number;
  severity: ProblemSeverity;
  message: string;
  /** What found it, such as "ts" or "eslint" */
  source?: string;
  /** Its rule or error code, such as "TS2322" */
  code?: string;
  /** The label of a quick fix the page can apply */
  fix?: string;
};
export type ProblemFilter = "all" | ProblemSeverity;
export type ProblemListStatus = "idle" | "running" | "done";
export type ProblemSelectedChange = { selected: string | null; problem?: ProblemItem };
export type ProblemFilterChange = { filter: ProblemFilter };
export type ProblemQueryChange = { query: string };
export type ProblemExpandedChange = { expanded: string[]; path?: string };
export type ProblemOpen = { path: string; line: number; column?: number; problem: ProblemItem };
export type ProblemFix = { problem: ProblemItem };
export type ProblemListAction = { id: string };
export type ProblemListActionItem = { id: string; label: string; icon: string | string[]; pressed?: boolean };
export type ProblemListLabels = Record<ProblemSeverity, string> &
  Record<"errors" | "warnings" | "infos" | "all" | "filter" | "severity" | "empty" | "noMatches" | "running" | "problem" | "problems" | "line", string>;
export const defaultProblemListLabels: ProblemListLabels = {
  error: "Error",
  warning: "Warning",
  info: "Info",
  errors: "Errors",
  warnings: "Warnings",
  infos: "Info",
  all: "All",
  filter: "Filter problems",
  severity: "Severity",
  empty: "No problems",
  noMatches: "No problems match",
  running: "Checking",
  problem: "problem",
  problems: "problems",
  line: "Line",
};

/** A problem's identity: its id, or where it is and what it says */
export const problemKey = (p: ProblemItem) => p.id ?? `${p.path}:${p.line}:${p.column ?? 0}:${p.message}`;

type Row =
  | { kind: "file"; key: string; path: string; problems: ProblemItem[]; open: boolean; pos: number; size: number }
  | { kind: "problem"; key: string; path: string; problem: ProblemItem; level: number; pos: number; size: number };

const RANK: Record<ProblemSeverity, number> = { error: 0, warning: 1, info: 2 };
const FILTERS: ProblemFilter[] = ["all", "error", "warning", "info"];

/* After Lucide: circle-x, triangle-alert, info, circle-check, chevron-right, list-x, wand-sparkles (ISC licence) */
const MARK: Record<ProblemSeverity, string[]> = {
  error: ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20", "m15 9-6 6", "m9 9 6 6"],
  warning: ["m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3", "M12 9v4", "M12 17h.01"],
  info: ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20", "M12 16v-4", "M12 8h.01"],
};
const CHECK = ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20", "m9 12 2 2 4-4"];
const FIX = ["m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72", "m14 7 3 3", "M5 6v4", "M19 14v4", "M10 2v2", "M7 8H3", "M21 16h-4", "M11 3H9"];
const glyph = (paths: string | string[], cls: string) =>
  html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${(Array.isArray(paths) ? paths : [paths]).map((d) => svg`<path d=${d}></path>`)}</svg>`;
const headIcon = svg`<path d="M11 12H3"></path><path d="M16 6H3"></path><path d="M16 18H3"></path><path d="m19 10-4 4"></path><path d="m15 10 4 4"></path>`;

/**
 * Diagnostics from a build, type check or linter: grouped by file, a severity filter with counts, a text filter, and quick fixes.
 * @tag tc-problem-list
 * @fires tc-selected-change - Another problem was chosen ({ selected, problem }: ProblemSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-filter-change - The severity filter changed ({ filter }: ProblemFilterChange); cancelable – prevented, `filter` stays as it was
 * @fires tc-query-change - The text filter changed ({ query }: ProblemQueryChange); cancelable – prevented, `query` stays as it was
 * @fires tc-expanded-change - A file was opened or closed ({ expanded, path }: ProblemExpandedChange); cancelable – prevented, `expanded` stays as it was
 * @fires tc-open - A problem was clicked, or Enter or Space pressed on it ({ path, line, column, problem }: ProblemOpen)
 * @fires tc-fix - A problem's fix was pressed ({ problem }: ProblemFix); cancelable – prevented, the page has dealt with it and nothing else is said
 * @fires tc-action - A header button was pressed ({ id }: ProblemListAction)
 */
export class TcProblemList extends TcElement {
  static override ui = "prob";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Problems";
  /** Small text under the heading – what was checked */
  @property() accessor description = "";
  /** What was found */
  @property({ attribute: false }) accessor problems: ProblemItem[] = [];
  /** Which severities show: all, error, warning or info */
  @property() accessor filter: ProblemFilter = "all";
  /** The text filter: matches the message, path, source or code */
  @property() accessor query = "";
  /** "file" groups problems under their file; "none" lists them with their path */
  @property({ attribute: "group-by" }) accessor groupBy: "file" | "none" = "file";
  /** The open files' paths; null opens them all */
  @property({ attribute: false }) accessor expanded: string[] | null = null;
  /** The chosen problem's key (its id, or `problemKey`) */
  @property() accessor selected: string | null = null;
  /** idle, running or done */
  @property() accessor status: ProblemListStatus = "done";
  /** Leaves out the severity and text filters */
  @property({ type: Boolean, attribute: "hide-filter" }) accessor hideFilter = false;
  /** Height in px at which the list scrolls */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 480;
  /** Buttons in the header */
  @property({ attribute: false }) accessor actions: ProblemListActionItem[] = [];
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<ProblemListLabels> = {};

  /** The key of the row that holds the tab stop */
  @state() private accessor active: string | null = null;
  /** The problem whose fix button has the focus */
  @state() private accessor onFix: string | null = null;

  private rows: Row[] = [];

  private get words() {
    return { ...defaultProblemListLabels, ...this.labels };
  }
  private isOpen(path: string) {
    return this.expanded === null || this.expanded.includes(path);
  }
  private counts() {
    const c: Record<ProblemSeverity, number> = { error: 0, warning: 0, info: 0 };
    for (const p of this.problems) c[p.severity]++;
    return c;
  }
  private get shown() {
    const q = this.query.trim().toLowerCase();
    return this.problems.filter(
      (p) => (this.filter === "all" || p.severity === this.filter) && (!q || [p.message, p.path, p.source, p.code].some((s) => s?.toLowerCase().includes(q))),
    );
  }

  private build(): Row[] {
    const rows: Row[] = [];
    const sort = (a: ProblemItem, b: ProblemItem) => RANK[a.severity] - RANK[b.severity] || a.line - b.line || (a.column ?? 0) - (b.column ?? 0);
    const shown = this.shown;
    if (this.groupBy === "none") {
      const list = [...shown].sort((a, b) => RANK[a.severity] - RANK[b.severity] || a.path.localeCompare(b.path) || sort(a, b));
      list.forEach((problem, i) => rows.push({ kind: "problem", key: `p\u001f${problemKey(problem)}`, path: problem.path, problem, level: 1, pos: i + 1, size: list.length }));
      return rows;
    }
    const files = new Map<string, ProblemItem[]>();
    for (const p of shown) (files.get(p.path) ?? files.set(p.path, []).get(p.path)!).push(p);
    // Files with errors first, then by path
    const order = [...files.entries()].sort(([a, pa], [b, pb]) => Math.min(...pa.map((p) => RANK[p.severity])) - Math.min(...pb.map((p) => RANK[p.severity])) || a.localeCompare(b));
    order.forEach(([path, list], i) => {
      const open = this.isOpen(path);
      rows.push({ kind: "file", key: `f\u001f${path}`, path, problems: list, open, pos: i + 1, size: order.length });
      if (open) [...list].sort(sort).forEach((problem, j) => rows.push({ kind: "problem", key: `p\u001f${problemKey(problem)}`, path, problem, level: 2, pos: j + 1, size: list.length }));
    });
    return rows;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.rows = this.build();
    if (!this.rows.some((r) => r.key === this.active)) this.active = this.rows.find((r) => r.kind === "problem" && problemKey(r.problem) === this.selected)?.key ?? this.rows[0]?.key ?? null;
    if (this.onFix && this.onFix !== this.active) this.onFix = null;
  }

  private setExpanded(expanded: string[], path?: string) {
    if (this.emit<ProblemExpandedChange>("tc-expanded-change", { expanded, path }, { cancelable: true })) this.expanded = expanded;
  }

  private toggle(path: string) {
    const now = this.expanded ?? [...new Set(this.problems.map((p) => p.path))];
    this.setExpanded(this.isOpen(path) ? now.filter((p) => p !== path) : [...now, path], path);
  }

  private press(r: Row) {
    this.active = r.key;
    if (r.kind === "file") return this.toggle(r.path);
    const key = problemKey(r.problem);
    if (key !== this.selected && this.emit<ProblemSelectedChange>("tc-selected-change", { selected: key, problem: r.problem }, { cancelable: true })) this.selected = key;
    this.emit<ProblemOpen>("tc-open", { path: r.path, line: r.problem.line, column: r.problem.column, problem: r.problem });
  }

  private fix(problem: ProblemItem, e: Event) {
    e.stopPropagation();
    this.emit<ProblemFix>("tc-fix", { problem }, { cancelable: true });
  }

  private async focusRow(key: string, fix = false) {
    this.active = key;
    this.onFix = fix ? key : null;
    await this.updateComplete;
    const row = this.querySelector<HTMLElement>(`.ui-prob__row[data-key="${CSS.escape(key)}"]`);
    (fix ? row?.querySelector<HTMLElement>(".ui-prob__fix") : row)?.focus();
  }

  private onTreeKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const rows = this.rows;
    const i = rows.findIndex((r) => r.key === this.active);
    const r = rows[i];
    if (!r) return;
    const onFix = this.onFix === r.key;
    let to: string | undefined;
    switch (e.key) {
      case "ArrowDown":
        to = rows[i + 1]?.key;
        break;
      case "ArrowUp":
        to = rows[i - 1]?.key;
        break;
      case "Home":
        to = rows[0].key;
        break;
      case "End":
        to = rows[rows.length - 1].key;
        break;
      case "ArrowRight":
        if (r.kind === "file") {
          if (!r.open) this.toggle(r.path);
          else to = rows[i + 1]?.kind === "problem" ? rows[i + 1].key : undefined;
        } else if (r.problem.fix && !onFix) {
          e.preventDefault();
          void this.focusRow(r.key, true);
          return;
        }
        break;
      case "ArrowLeft":
        if (onFix) to = r.key;
        else if (r.kind === "file") {
          if (r.open) this.toggle(r.path);
        } else if (r.level === 2) to = `f\u001f${r.path}`;
        break;
      case "Enter":
      case " ":
        // The fix button acts on its own
        if (onFix) return;
        this.press(r);
        break;
      default:
        return;
    }
    e.preventDefault();
    if (to) void this.focusRow(to);
  };

  private setFilter(filter: ProblemFilter) {
    if (filter === this.filter) return;
    if (this.emit<ProblemFilterChange>("tc-filter-change", { filter }, { cancelable: true })) this.filter = filter;
  }

  private onFilterKey = (e: KeyboardEvent) => {
    const i = FILTERS.indexOf(this.filter);
    const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: FILTERS.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = FILTERS[(to + FILTERS.length) % FILTERS.length];
    this.setFilter(next);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-prob__seg[data-filter="${this.filter}"]`)?.focus());
  };

  private setQuery(query: string) {
    if (query === this.query) return;
    if (this.emit<ProblemQueryChange>("tc-query-change", { query }, { cancelable: true })) this.query = query;
    else this.requestUpdate();
  }

  private where(p: ProblemItem) {
    return `${p.line}${p.column ? `:${p.column}` : ""}`;
  }

  private row(r: Row): TemplateResult {
    const words = this.words;
    if (r.kind === "file") {
      const slash = r.path.lastIndexOf("/");
      const name = r.path.slice(slash + 1);
      const folder = slash > 0 ? r.path.slice(0, slash) : "";
      const n = r.problems.length;
      const worst = r.problems.reduce<ProblemSeverity>((w, p) => (RANK[p.severity] < RANK[w] ? p.severity : w), "info");
      return html`<div
        class="ui-prob__row ui-prob__file"
        role="treeitem"
        data-key=${r.key}
        data-severity=${worst}
        aria-level="1"
        aria-setsize=${r.size}
        aria-posinset=${r.pos}
        aria-expanded=${r.open ? "true" : "false"}
        tabindex=${r.key === this.active ? 0 : -1}
        title=${r.path}
        @click=${() => this.press(r)}
      >
        <svg class="ui-prob__chevron" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m9 18 6-6-6-6"></path>`}</svg>
        <span class="ui-prob__name">${name}</span>
        ${folder ? html`<span class="ui-prob__folder">${folder}</span>` : nothing}
        <span class="ui-prob__count">${n}<span class="ui-prob__sr"> ${n === 1 ? words.problem : words.problems}</span></span>
      </div>`;
    }
    const p = r.problem;
    const key = problemKey(p);
    const meta = [p.source, p.code].filter(Boolean).join(" ");
    return html`<div
      class="ui-prob__row ui-prob__problem"
      role="treeitem"
      data-key=${r.key}
      data-severity=${p.severity}
      aria-level=${r.level}
      aria-setsize=${r.size}
      aria-posinset=${r.pos}
      aria-selected=${key === this.selected ? "true" : "false"}
      tabindex=${r.key === this.active && this.onFix !== r.key ? 0 : -1}
      style=${styleMap({ "--tc-prob-level": String(r.level - 1) })}
      @click=${() => this.press(r)}
    >
      ${glyph(MARK[p.severity], "ui-prob__mark")}
      <span class="ui-prob__body">
        <span class="ui-prob__message"><span class="ui-prob__sr">${words[p.severity]}: </span>${p.message}</span>
        <span class="ui-prob__meta">
          ${meta ? html`<span class="ui-prob__source">${meta}</span>` : nothing}
          ${this.groupBy === "none" ? html`<span class="ui-prob__path">${p.path}</span>` : nothing}
          <span class="ui-prob__where"><span class="ui-prob__sr">${words.line} </span>${this.where(p)}</span>
        </span>
      </span>
      ${p.fix
        ? html`<button type="button" class="ui-prob__fix" tabindex=${this.onFix === r.key ? 0 : -1} title=${p.fix} @click=${(e: Event) => this.fix(p, e)} @keydown=${(e: KeyboardEvent) => (e.key === "Enter" || e.key === " ") && e.stopPropagation()}>
            ${glyph(FIX, "ui-prob__fix-glyph")}<span class="ui-prob__fix-text">${p.fix}</span>
          </button>`
        : nothing}
    </div>`;
  }

  private filters() {
    const words = this.words;
    const c = this.counts();
    const total = this.problems.length;
    const names: Record<ProblemFilter, string> = { all: words.all, error: words.errors, warning: words.warnings, info: words.infos };
    const counts: Record<ProblemFilter, number> = { all: total, ...c };
    return html`<div class="ui-prob__filters">
      <div class="ui-prob__segs" role="radiogroup" aria-label=${words.severity} @keydown=${this.onFilterKey}>
        ${FILTERS.map(
          (f) => html`<button type="button" class="ui-prob__seg" role="radio" data-filter=${f} aria-checked=${f === this.filter ? "true" : "false"} tabindex=${f === this.filter ? 0 : -1} @click=${() => this.setFilter(f)}>
            ${f === "all" ? nothing : glyph(MARK[f], "ui-prob__seg-mark")}<span>${names[f]}</span> <span class="ui-prob__seg-count">${counts[f]}</span>
          </button>`,
        )}
      </div>
      <label class="ui-prob__field">
        <svg class="ui-prob__glass" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M11 3a8 8 0 1 0 0 16a8 8 0 1 0 0-16"></path><path d="m21 21-4.3-4.3"></path>`}</svg>
        <input class="ui-prob__input" type="search" aria-label=${words.filter} placeholder=${words.filter} autocomplete="off" spellcheck="false" .value=${live(this.query)} @input=${(e: Event) => this.setQuery((e.target as HTMLInputElement).value)} @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Escape" && this.query) {
            e.preventDefault();
            this.setQuery("");
          }
        }} />
      </label>
    </div>`;
  }

  private body() {
    const words = this.words;
    if (!this.rows.length) {
      if (this.status === "running" && !this.problems.length) return html`<p class="ui-prob__empty">${words.running}</p>`;
      const none = !this.problems.length;
      return html`<p class="ui-prob__empty" data-clear=${ifDefined(none ? "" : undefined)}>${none ? glyph(CHECK, "ui-prob__empty-mark") : nothing}${none ? words.empty : words.noMatches}</p>`;
    }
    return html`<div class="ui-prob__scroll" style=${styleMap({ maxHeight: `${this.maxHeight}px` })}>
      <div class="ui-prob__rows" role="tree" aria-label=${this.heading || words.problems} aria-busy=${this.status === "running" ? "true" : "false"} @keydown=${this.onTreeKey}>
        ${this.rows.map((r) => this.row(r))}
      </div>
    </div>`;
  }

  protected override render() {
    const words = this.words;
    const c = this.counts();
    const summary = html`<span class="ui-prob__summary">
      ${this.status === "running" ? html`<span class="ui-prob__running">${words.running}</span>` : nothing}
      ${(["error", "warning", "info"] as const).map(
        (s) => html`<span class="ui-prob__total" data-severity=${s}>${glyph(MARK[s], "ui-prob__total-mark")}${c[s]}<span class="ui-prob__sr"> ${s === "error" ? words.errors : s === "warning" ? words.warnings : words.infos}</span></span>`,
      )}
    </span>`;
    const aside = html`<div class="ui-prob__aside">
      ${summary}
      ${this.actions.length
        ? html`<div class="ui-prob__actions">${this.actions.map(
            (a) => html`<button type="button" class="ui-prob__action" title=${a.label} aria-label=${a.label} aria-pressed=${ifDefined(a.pressed === undefined ? undefined : a.pressed ? "true" : "false")} @click=${() => this.emit<ProblemListAction>("tc-action", { id: a.id })}>${glyph(a.icon, "ui-prob__action-glyph")}</button>`,
          )}</div>`
        : nothing}
    </div>`;
    const n = this.shown.length;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, aside }) : nothing}
      <div class="ui-prob__card">
        ${this.hideFilter ? nothing : this.filters()}
        ${this.body()}
      </div>
      <span class="ui-prob__sr" role="status">${this.status === "running" ? words.running : `${n} ${n === 1 ? words.problem : words.problems}`}</span>`;
  }

  static override css = /* css */ `
[data-ui="prob"] {
  box-sizing: border-box;
  display: block;
  min-width: 0;
  width: 100%;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
  --tc-prob-indent: var(--tc-space-4);
  --tc-prob-mark-nudge: 3px;
}
[data-ui="prob"] *, [data-ui="prob"] *::before, [data-ui="prob"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="prob"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="prob"] .ui-prob__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="prob"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-prob__card { overflow: hidden; }
.ui-prob__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-prob__aside { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-prob__summary { display: flex; align-items: center; gap: var(--tc-space-2); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-prob__running { color: var(--tc-text-muted); }
.ui-prob__total { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); }
.ui-prob__actions { display: flex; gap: var(--tc-space-0-5); }
.ui-prob__action {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: none;
  color: var(--tc-icon-muted);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-prob__action:hover, .ui-prob__action[aria-pressed="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-prob__action:focus-visible, .ui-prob__seg:focus-visible, .ui-prob__fix:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-prob__action-glyph, .ui-prob__fix-glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-prob__mark, .ui-prob__total-mark, .ui-prob__seg-mark { flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-prob__seg-mark, .ui-prob__total-mark { width: 12px; height: 12px; }
[data-severity="error"] > .ui-prob__mark, [data-severity="error"] > .ui-prob__total-mark, [data-filter="error"] > .ui-prob__seg-mark { color: var(--tc-status-danger-fg); }
[data-severity="warning"] > .ui-prob__mark, [data-severity="warning"] > .ui-prob__total-mark, [data-filter="warning"] > .ui-prob__seg-mark { color: var(--tc-status-warning-fg); }
[data-severity="info"] > .ui-prob__mark, [data-severity="info"] > .ui-prob__total-mark, [data-filter="info"] > .ui-prob__seg-mark { color: var(--tc-status-info-fg); }
.ui-prob__filters { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-1); }
.ui-prob__segs { display: flex; flex: none; max-width: 100%; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); overflow-x: auto; }
.ui-prob__seg {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad));
  margin: 0;
  padding: 0 var(--tc-space-2);
  border: 0;
  border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad));
  background: none;
  color: var(--tc-text-secondary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  white-space: nowrap;
  cursor: pointer;
}
.ui-prob__seg[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-prob__seg-count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-prob__field {
  display: flex;
  flex: 1 1 140px;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-prob__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-prob__field:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-prob__glass { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; }
.ui-prob__input { flex: 1; min-width: 0; height: 100%; margin: 0; padding: 0; border: 0; outline: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-prob__input::placeholder { color: var(--tc-text-placeholder); }
.ui-prob__input::-webkit-search-cancel-button { display: none; }
.ui-prob__scroll { overflow: auto; overscroll-behavior: contain; padding: var(--tc-space-1); }
.ui-prob__row { display: flex; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); cursor: pointer; }
.ui-prob__row:hover { background: var(--tc-fill-subtle); }
.ui-prob__row[aria-selected="true"] { background: var(--tc-fill-default); }
.ui-prob__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-prob__file { align-items: center; user-select: none; }
.ui-prob__problem { align-items: flex-start; padding-top: var(--tc-space-1); padding-bottom: var(--tc-space-1); padding-left: calc(var(--tc-space-2) + var(--tc-prob-level) * var(--tc-prob-indent)); }
.ui-prob__problem > .ui-prob__mark { margin-top: var(--tc-prob-mark-nudge); }
.ui-prob__chevron { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-prob__file[aria-expanded="true"] > .ui-prob__chevron { transform: rotate(90deg); }
.ui-prob__name { flex: none; max-width: 70%; overflow: hidden; font-weight: var(--tc-font-weight-medium); text-overflow: ellipsis; white-space: nowrap; }
.ui-prob__folder { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-overflow: ellipsis; white-space: nowrap; direction: rtl; text-align: left; }
.ui-prob__count {
  flex: none;
  margin-left: auto;
  min-width: var(--tc-pill-h);
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-default);
  color: var(--tc-text-secondary);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-pill-h);
  text-align: center;
}
.ui-prob__file[data-severity="error"] > .ui-prob__count { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-prob__file[data-severity="warning"] > .ui-prob__count { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-prob__body { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-prob__message { overflow-wrap: anywhere; }
.ui-prob__meta { display: flex; flex-wrap: wrap; gap: 0 var(--tc-space-2); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-prob__source, .ui-prob__where { font-family: var(--tc-font-mono); }
.ui-prob__path { min-width: 0; overflow-wrap: anywhere; }
.ui-prob__fix {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-1);
  height: var(--tc-control-h-sm);
  margin: calc(-1 * var(--tc-space-0-5)) 0;
  padding: 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: none;
  color: var(--tc-accent-text);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  white-space: nowrap;
  cursor: pointer;
}
.ui-prob__fix:hover { background: var(--tc-fill-default); }
.ui-prob__empty { display: flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); margin: 0; padding: var(--tc-space-6) var(--tc-space-3); color: var(--tc-text-muted); text-align: center; }
.ui-prob__empty-mark { width: 16px; height: 16px; fill: none; stroke: var(--tc-status-success-fg); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
@container (max-width: 360px) {
  .ui-prob__fix-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-prob__fix { padding: 0; width: var(--tc-control-h-sm); justify-content: center; }
  .ui-prob__folder { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="prob"] *, [data-ui="prob"] *::before, [data-ui="prob"] *::after { transition: none !important; }
}
@media (forced-colors: active) {
  .ui-prob__mark, .ui-prob__total-mark, .ui-prob__seg-mark { color: CanvasText; }
}
`;
}

if (!customElements.get("tc-problem-list")) customElements.define("tc-problem-list", TcProblemList);
declare global {
  interface HTMLElementTagNameMap {
    "tc-problem-list": TcProblemList;
  }
}

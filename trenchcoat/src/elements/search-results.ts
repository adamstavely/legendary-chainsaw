import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { RowWindowController } from "./internal/controllers";

/*
 * <tc-search-results> – what a search across files found: a field to change the search, three toggles (match case, whole
 * word, regular expression), a summary, then the files with their matching lines, the matched text marked. Nothing here
 * searches: Enter asks the page (tc-search), and the page passes back `results` and a `status`. With `replaceable`, a second
 * field shows each match as it would be replaced and asks the page to replace one or all.
 *   · the results are one tab stop, a tree: ↑ / ↓ move, → opens a file or goes to its first match, ← closes or goes up,
 *     Enter opens a match (tc-open) or folds a file
 *   · a long line is cut around its first match, so the match is always in view
 *   · many results render only the rows near the view
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-search-results query="freezer" .results=${[{ path: "src/a.ts", matches: [{ line: 4, text: "const freezer = 1" }] }]}>
 *   </tc-search-results>
 */

export type SearchResultsMatch = {
  /** 1-based line number */
  line: number;
  /** 1-based column of the first match, when known */
  column?: number;
  /** The line's text */
  text: string;
  /** Where the matches are in `text`, as [start, end) offsets. Required for regex highlighting; literal queries are matched locally when omitted. */
  ranges?: [number, number][];
};
export type SearchResultsFile = { path: string; matches: SearchResultsMatch[] };
export type SearchResultsOptions = { caseSensitive: boolean; wholeWord: boolean; regex: boolean };
export type SearchResultsStatus = "idle" | "searching" | "done" | "error";
export type SearchResultsSelection = { path: string; line: number; /** 1-based; tells two matches on one line apart */ column?: number };
export type SearchResultsSearch = { query: string; options: SearchResultsOptions };
export type SearchResultsOptionsChange = { options: SearchResultsOptions };
export type SearchResultsExpandedChange = { expanded: string[]; path?: string };
export type SearchResultsSelectedChange = { selected: SearchResultsSelection | null; match?: SearchResultsMatch };
export type SearchResultsOpen = { path: string; line: number; column?: number };
export type SearchResultsReplace = { query: string; replacement: string; options: SearchResultsOptions; path?: string; line?: number; column?: number };
export type SearchResultsReplacementChange = { replacement: string };
export type SearchResultsAction = { id: string };
export type SearchResultsActionItem = { id: string; label: string; icon: string | string[]; pressed?: boolean };
export type SearchResultsLabels = {
  search: string;
  replace: string;
  caseSensitive: string;
  wholeWord: string;
  regex: string;
  replaceOne: string;
  replaceAll: string;
  collapseAll: string;
  expandAll: string;
  searching: string;
  /** Before anything is searched */
  idle: string;
  /** "{query}" is replaced by the search */
  noResults: string;
  error: string;
  /** "{n}" is replaced by the number shown */
  truncated: string;
  result: string;
  results: string;
  file: string;
  files: string;
  line: string;
};
export const defaultSearchResultsLabels: SearchResultsLabels = {
  search: "Search",
  replace: "Replace",
  caseSensitive: "Match case",
  wholeWord: "Whole word",
  regex: "Regular expression",
  replaceOne: "Replace",
  replaceAll: "Replace all",
  collapseAll: "Collapse all",
  expandAll: "Expand all",
  searching: "Searching",
  idle: "Type and press Enter to search in files",
  noResults: "No results for “{query}”",
  error: "The search didn't finish",
  truncated: "Showing the first {n} results",
  result: "result",
  results: "results",
  file: "file",
  files: "files",
  line: "Line",
};

type Row =
  | { kind: "file"; key: string; path: string; file: SearchResultsFile; open: boolean; pos: number; size: number }
  | { kind: "match"; key: string; path: string; file: SearchResultsFile; match: SearchResultsMatch; pos: number; size: number };

/** How far before the first match a cut line starts */
const LEAD = 16;
/** A line whose first match starts later than this is cut */
const CUT_FROM = 28;
const WINDOW_FROM = 200;
const OVERSCAN = 30;
/** --tc-control-h-sm, the row height before the first row is measured */
const ROW = 28;

const KINDS: Record<string, "code" | "text" | "data" | "image"> = {};
for (const e of "ts tsx js jsx mjs cjs py rb go rs java kt swift c h cpp cs php sh css scss html vue svelte".split(" ")) KINDS[e] = "code";
for (const e of "md mdx txt rst pdf doc docx".split(" ")) KINDS[e] = "text";
for (const e of "json yaml yml toml csv xml lock".split(" ")) KINDS[e] = "data";
for (const e of "png jpg jpeg gif webp svg ico".split(" ")) KINDS[e] = "image";
const kindOf = (name: string) => KINDS[name.slice(name.lastIndexOf(".") + 1).toLowerCase()] ?? "file";

/* After Lucide: file, file-code, file-text, file-json, image, chevron-right, search, chevrons-down-up, chevrons-up-down,
   replace-all, text-search (ISC licence) */
const PAGE = ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v5h6"];
const ICONS: Record<string, string[]> = {
  file: PAGE,
  code: [...PAGE, "m10 13-2 2 2 2", "m14 17 2-2-2-2"],
  text: [...PAGE, "M16 13H8", "M16 17H8"],
  data: [...PAGE, "M10 12c-1 0-1 1-1 2s-1 1-1 1 1 0 1 1 0 2 1 2", "M14 18c1 0 1-1 1-2s1-1 1-1-1 0-1-1 0-2-1-2"],
  image: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z", "M9 9h.01", "m21 15-5-5L5 21"],
};
const COLLAPSE = ["m7 20 5-5 5 5", "m7 4 5 5 5-5"];
const EXPAND = ["m7 15 5 5 5-5", "m7 9 5-5 5 5"];
const glyph = (paths: string | string[], cls: string) =>
  html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${(Array.isArray(paths) ? paths : [paths]).map((d) => svg`<path d=${d}></path>`)}</svg>`;
const headIcon = svg`<path d="M21 6H3"></path><path d="M10 12H3"></path><path d="M10 18H3"></path><circle cx="17" cy="15" r="3"></circle><path d="m21 19-1.9-1.9"></path>`;

/** Fills "{name}" placeholders from `values` in one pass; "$&" and the like in a value stay as typed */
const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (all, key: string) => (Object.hasOwn(values, key) ? values[key] : all));
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** The search as a regular expression, or null when it can't be one */
export function searchResultsPattern(query: string, options: SearchResultsOptions): RegExp | null {
  if (!query) return null;
  try {
    let src = options.regex ? query : escapeRe(query);
    // A word edge only where the search has one: \b on both ends would never match "@media" or "fn(" at all.
    // A regular expression's ends aren't known, so it gets the edges on both sides
    if (options.wholeWord) {
      const start = options.regex || /^\w/.test(query) ? "(?<!\\w)" : "";
      const end = options.regex || /\w$/.test(query) ? "(?!\\w)" : "";
      src = `${start}(?:${src})${end}`;
    }
    return new RegExp(src, options.caseSensitive ? "g" : "gi");
  } catch {
    return null;
  }
}
function rangesOf(text: string, re: RegExp | null): [number, number][] {
  if (!re) return [];
  const out: [number, number][] = [];
  re.lastIndex = 0;
  for (let m = re.exec(text); m && out.length < 50; m = re.exec(text)) {
    if (!m[0].length) {
      re.lastIndex++;
      continue;
    }
    out.push([m.index, m.index + m[0].length]);
  }
  return out;
}

/**
 * Results of a search across files: grouped by file, each matching line with the match marked, with a field to search again and optional replace.
 * @tag tc-search-results
 * @fires tc-search - Enter in the search field ({ query, options }: SearchResultsSearch); cancelable – prevented, `query` stays as it was
 * @fires tc-options-change - Match case, whole word or regular expression was toggled ({ options }: SearchResultsOptionsChange); cancelable – prevented, `options` stay as they were
 * @fires tc-expanded-change - A file was opened or closed, or all were ({ expanded, path }: SearchResultsExpandedChange); cancelable – prevented, `expanded` stays as it was
 * @fires tc-selected-change - Another match was chosen ({ selected, match }: SearchResultsSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-open - A match was clicked, or Enter or Space pressed on it ({ path, line, column }: SearchResultsOpen)
 * @fires tc-replacement-change - The replace field was typed in ({ replacement }: SearchResultsReplacementChange); cancelable – prevented, `replacement` stays as it was
 * @fires tc-replace - Replace or Replace all was pressed, with `replaceable` ({ query, replacement, options, path, line, column }: SearchResultsReplace); one match carries its path, line and column
 * @fires tc-action - A header button was pressed ({ id }: SearchResultsAction)
 */
export class TcSearchResults extends TcElement {
  static override ui = "srh";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Search";
  /** Small text under the heading – where it searched */
  @property() accessor description = "";
  /** The text that was searched for */
  @property() accessor query = "";
  /** Match case, whole word and regular expression */
  @property({ attribute: false }) accessor options: SearchResultsOptions = { caseSensitive: false, wholeWord: false, regex: false };
  /** The files that matched, each with its matching lines */
  @property({ attribute: false }) accessor results: SearchResultsFile[] = [];
  /** idle, searching, done or error */
  @property() accessor status: SearchResultsStatus = "done";
  /** What went wrong, with status "error" */
  @property() accessor error = "";
  /** The page stopped before finding everything */
  @property({ type: Boolean }) accessor truncated = false;
  /** The open files' paths; null opens them all */
  @property({ attribute: false }) accessor expanded: string[] | null = null;
  /** The chosen match */
  @property({ attribute: false }) accessor selected: SearchResultsSelection | null = null;
  /** Shows a replace field, with Replace and Replace all */
  @property({ type: Boolean }) accessor replaceable = false;
  /** The replace field's text */
  @property() accessor replacement = "";
  /** Leaves out the search field, for a page that has its own */
  @property({ type: Boolean, attribute: "hide-field" }) accessor hideField = false;
  /** Height in px at which the results scroll */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 480;
  /** Buttons in the header, before Collapse all */
  @property({ attribute: false }) accessor actions: SearchResultsActionItem[] = [];
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<SearchResultsLabels> = {};

  /** The search field's text before Enter */
  @state() private accessor draft = "";
  /** The key of the row that holds the tab stop */
  @state() private accessor active: string | null = null;

  private rows: Row[] = [];
  private win = new RowWindowController(this, {
    count: () => this.rows.length,
    body: () => this.querySelector<HTMLElement>(".ui-srh__rows"),
    rowSelector: ".ui-srh__row",
    from: WINDOW_FROM,
    overscan: OVERSCAN,
    rowHeight: ROW,
  });

  private get words() {
    return { ...defaultSearchResultsLabels, ...this.labels };
  }
  private isOpen(path: string) {
    return this.expanded === null || this.expanded.includes(path);
  }
  private get total() {
    return this.results.reduce((n, f) => n + f.matches.length, 0);
  }

  private build(): Row[] {
    const rows: Row[] = [];
    this.results.forEach((file, i) => {
      const open = this.isOpen(file.path);
      rows.push({ kind: "file", key: `f\u001f${file.path}`, path: file.path, file, open, pos: i + 1, size: this.results.length });
      if (open)
        file.matches.forEach((match, j) => rows.push({ kind: "match", key: `m\u001f${file.path}\u001f${j}`, path: file.path, file, match, pos: j + 1, size: file.matches.length }));
    });
    return rows;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("query")) this.draft = this.query;
    this.rows = this.build();
    if (!this.rows.some((r) => r.key === this.active)) this.active = this.rows.find((r) => this.isSelected(r))?.key ?? this.rows[0]?.key ?? null;
    this.win.compute();
  }

  /** Where a match starts, 1-based, when it's known */
  private columnOf(m: SearchResultsMatch) {
    return m.column ?? (m.ranges?.[0] ? m.ranges[0][0] + 1 : undefined);
  }
  private isSelected(r: Row) {
    const s = this.selected;
    if (r.kind !== "match" || !s || s.path !== r.path || s.line !== r.match.line) return false;
    if (s.column !== undefined) return this.columnOf(r.match) === s.column;
    // A selection without a column is the first match on its line
    return r.file.matches.find((m) => m.line === s.line) === r.match;
  }

  private setExpanded(expanded: string[], path?: string) {
    if (!this.emit<SearchResultsExpandedChange>("tc-expanded-change", { expanded, path }, { cancelable: true })) return;
    this.expanded = expanded;
  }

  private toggle(path: string) {
    const all = this.results.map((f) => f.path);
    const now = this.expanded ?? all;
    this.setExpanded(this.isOpen(path) ? now.filter((p) => p !== path) : [...now, path], path);
  }

  private choose(r: Row & { kind: "match" }) {
    const column = this.columnOf(r.match);
    const selected: SearchResultsSelection = column === undefined ? { path: r.path, line: r.match.line } : { path: r.path, line: r.match.line, column };
    if (!this.isSelected(r) && this.emit<SearchResultsSelectedChange>("tc-selected-change", { selected, match: r.match }, { cancelable: true })) this.selected = selected;
    this.emit<SearchResultsOpen>("tc-open", { path: r.path, line: r.match.line, column: r.match.column });
  }

  private press(r: Row) {
    this.active = r.key;
    if (r.kind === "file") this.toggle(r.path);
    else this.choose(r);
  }

  private async focusRow(key: string) {
    this.active = key;
    this.win.reveal(this.rows.findIndex((r) => r.key === key));
    await this.updateComplete;
    this.querySelector<HTMLElement>(`.ui-srh__row[data-key="${CSS.escape(key)}"]`)?.focus();
  }

  private onTreeKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const rows = this.rows;
    const i = rows.findIndex((r) => r.key === this.active);
    const r = rows[i];
    if (!r) return;
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
          else to = rows[i + 1]?.kind === "match" ? rows[i + 1].key : undefined;
        }
        break;
      case "ArrowLeft":
        if (r.kind === "file") {
          if (r.open) this.toggle(r.path);
        } else to = `f\u001f${r.path}`;
        break;
      case "Enter":
      case " ":
        this.press(r);
        break;
      default:
        return;
    }
    e.preventDefault();
    if (to) void this.focusRow(to);
  };

  private search() {
    const query = this.draft.trim();
    if (!query) return;
    if (this.emit<SearchResultsSearch>("tc-search", { query, options: { ...this.options } }, { cancelable: true })) this.query = query;
  }

  private onFieldKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      this.search();
    } else if (e.key === "Escape" && this.draft) {
      e.preventDefault();
      this.draft = "";
    } else if (e.key === "ArrowDown" && this.rows.length) {
      e.preventDefault();
      void this.focusRow(this.active ?? this.rows[0].key);
    }
  };

  private toggleOption(key: keyof SearchResultsOptions) {
    const options = { ...this.options, [key]: !this.options[key] };
    if (this.emit<SearchResultsOptionsChange>("tc-options-change", { options }, { cancelable: true })) this.options = options;
  }

  private setReplacement(replacement: string) {
    if (this.emit<SearchResultsReplacementChange>("tc-replacement-change", { replacement }, { cancelable: true })) this.replacement = replacement;
    else this.requestUpdate();
  }

  private replace(one: boolean) {
    const at = one ? this.selected : null;
    if (one && !at) return;
    this.emit<SearchResultsReplace>("tc-replace", { query: this.query, replacement: this.replacement, options: { ...this.options }, path: at?.path, line: at?.line, column: at?.column });
  }

  /** The line, cut around its first match, with the matches marked – and, while replacing, shown as replaced */
  private line(m: SearchResultsMatch): TemplateResult {
    let text = m.text;
    // Regex evaluation belongs to the search provider: a single exec can block forever, regardless of match limits.
    let ranges = m.ranges ?? (this.options.regex ? [] : rangesOf(text, searchResultsPattern(this.query, this.options)));
    // Leading indentation says nothing here
    const indent = text.length - text.trimStart().length;
    let cut = indent;
    if (ranges.length && ranges[0][0] - cut > CUT_FROM) cut = ranges[0][0] - LEAD;
    text = text.slice(cut).trimEnd();
    ranges = ranges.map(([a, b]) => [Math.max(0, a - cut), Math.max(0, b - cut)] as [number, number]).filter(([a, b]) => b > a);
    const parts: unknown[] = cut > indent ? ["…"] : [];
    const swap = this.replaceable && this.replacement !== "";
    let at = 0;
    for (const [a, b] of ranges) {
      if (a < at) continue;
      parts.push(text.slice(at, a));
      parts.push(swap ? html`<del class="ui-srh__del">${text.slice(a, b)}</del><ins class="ui-srh__ins">${this.replacement}</ins>` : html`<mark class="ui-srh__hit">${text.slice(a, b)}</mark>`);
      at = b;
    }
    parts.push(text.slice(at));
    return html`${parts}`;
  }

  private row(r: Row, stop: string | null) {
    const words = this.words;
    if (r.kind === "file") {
      const slash = r.path.lastIndexOf("/");
      const name = r.path.slice(slash + 1);
      const folder = slash > 0 ? r.path.slice(0, slash) : "";
      const n = r.file.matches.length;
      return html`<div
        class="ui-srh__row ui-srh__file"
        role="treeitem"
        data-key=${r.key}
        data-kind=${kindOf(name)}
        aria-level="1"
        aria-setsize=${r.size}
        aria-posinset=${r.pos}
        aria-expanded=${r.open ? "true" : "false"}
        tabindex=${r.key === stop ? 0 : -1}
        title=${r.path}
        @click=${() => this.press(r)}
        @focus=${() => this.active !== r.key && (this.active = r.key)}
      >
        <svg class="ui-srh__chevron" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m9 18 6-6-6-6"></path>`}</svg>
        ${glyph(ICONS[kindOf(name)], "ui-srh__icon")}
        <span class="ui-srh__name">${name}</span>
        ${folder ? html`<span class="ui-srh__folder">${folder}</span>` : nothing}
        <span class="ui-srh__count">${n}<span class="ui-srh__sr"> ${n === 1 ? words.result : words.results}</span></span>
      </div>`;
    }
    return html`<div
      class="ui-srh__row ui-srh__match"
      role="treeitem"
      data-key=${r.key}
      aria-level="2"
      aria-setsize=${r.size}
      aria-posinset=${r.pos}
      aria-selected=${this.isSelected(r) ? "true" : "false"}
      tabindex=${r.key === stop ? 0 : -1}
      @click=${() => this.press(r)}
      @focus=${() => this.active !== r.key && (this.active = r.key)}
    >
      <span class="ui-srh__line"><span class="ui-srh__sr">${words.line} </span>${r.match.line}</span>
      <span class="ui-srh__text">${this.line(r.match)}</span>
    </div>`;
  }

  private summary() {
    const words = this.words;
    const total = this.total;
    const files = this.results.length;
    if (this.status === "error") return "";
    if (this.status === "searching") return total ? `${words.searching} · ${total} ${total === 1 ? words.result : words.results}` : words.searching;
    if (!this.query || this.status === "idle") return "";
    if (!total) return "";
    return `${total} ${total === 1 ? words.result : words.results} in ${files} ${files === 1 ? words.file : words.files}`;
  }

  private body() {
    const words = this.words;
    const rows = this.rows;
    if (this.status === "error") return html`<p class="ui-srh__empty" data-tone="danger" role="alert">${this.error || words.error}</p>`;
    if (!rows.length) {
      if (this.status === "searching") return nothing;
      if (!this.query || this.status === "idle") return html`<p class="ui-srh__empty">${words.idle}</p>`;
      return html`<p class="ui-srh__empty">${fill(words.noResults, { query: this.query })}</p>`;
    }
    const { start, end } = this.win;
    const h = this.win.rowHeight;
    // Only the rows near the view render; when the active one has scrolled out, the first rendered row takes the tab stop
    const at = rows.findIndex((r) => r.key === this.active);
    const stop = at >= start && at < end ? this.active : (rows[start]?.key ?? null);
    const shown: TemplateResult[] = [];
    for (let n = start; n < end; n++) shown.push(this.row(rows[n], stop));
    return html`<div class="ui-srh__scroll" style=${styleMap({ maxHeight: `${this.maxHeight}px` })}>
      <div class="ui-srh__rows" role="tree" aria-label=${this.heading || words.search} aria-busy=${this.status === "searching" ? "true" : "false"} @keydown=${this.onTreeKey}>
        ${start > 0 ? html`<div aria-hidden="true" style=${styleMap({ height: `${start * h}px` })}></div>` : nothing}${shown}${end < rows.length ? html`<div aria-hidden="true" style=${styleMap({ height: `${(rows.length - end) * h}px` })}></div>` : nothing}
      </div>
    </div>`;
  }

  private field() {
    const words = this.words;
    const toggles: [keyof SearchResultsOptions, string, string][] = [
      ["caseSensitive", "Aa", words.caseSensitive],
      ["wholeWord", "ab", words.wholeWord],
      ["regex", ".*", words.regex],
    ];
    return html`<div class="ui-srh__fields">
      <div class="ui-srh__field">
        <svg class="ui-srh__glass" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M11 3a8 8 0 1 0 0 16a8 8 0 1 0 0-16"></path><path d="m21 21-4.3-4.3"></path>`}</svg>
        <input class="ui-srh__input" type="search" aria-label=${words.search} placeholder=${words.search} autocomplete="off" spellcheck="false" .value=${live(this.draft)} @input=${(e: Event) => (this.draft = (e.target as HTMLInputElement).value)} @keydown=${this.onFieldKey} />
        <span class="ui-srh__toggles">${toggles.map(
          ([key, mark, name]) => html`<button type="button" class="ui-srh__toggle" data-option=${key} title=${name} aria-pressed=${this.options[key] ? "true" : "false"} @click=${() => this.toggleOption(key)}><span aria-hidden="true">${mark}</span><span class="ui-srh__sr">${name}</span></button>`,
        )}</span>
      </div>
      ${this.replaceable
        ? html`<div class="ui-srh__replace">
            <div class="ui-srh__field">
              <svg class="ui-srh__glass" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M14 4a2 2 0 0 1 2-2"></path><path d="M16 10a2 2 0 0 1-2-2"></path><path d="M20 2a2 2 0 0 1 2 2"></path><path d="M22 8a2 2 0 0 1-2 2"></path><path d="m3 7 3 3 3-3"></path><path d="M6 10V5a3 3 0 0 1 3-3h1"></path><rect x="2" y="14" width="8" height="8" rx="2"></rect>`}</svg>
              <input class="ui-srh__input" type="text" aria-label=${words.replace} placeholder=${words.replace} autocomplete="off" spellcheck="false" .value=${live(this.replacement)} @input=${(e: Event) => this.setReplacement((e.target as HTMLInputElement).value)} />
            </div>
            <button type="button" class="ui-srh__button" ?disabled=${!this.selected || !this.total} @click=${() => this.replace(true)}>${words.replaceOne}</button>
            <button type="button" class="ui-srh__button" ?disabled=${!this.total} @click=${() => this.replace(false)}>${words.replaceAll}</button>
          </div>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const words = this.words;
    const anyOpen = this.results.some((f) => this.isOpen(f.path));
    const actions = html`<div class="ui-srh__actions">
      ${this.actions.map(
        (a) => html`<button type="button" class="ui-srh__action" title=${a.label} aria-label=${a.label} aria-pressed=${ifDefined(a.pressed === undefined ? undefined : a.pressed ? "true" : "false")} @click=${() => this.emit<SearchResultsAction>("tc-action", { id: a.id })}>${glyph(a.icon, "ui-srh__action-glyph")}</button>`,
      )}
      ${this.results.length
        ? html`<button type="button" class="ui-srh__action ui-srh__fold" title=${anyOpen ? words.collapseAll : words.expandAll} aria-label=${anyOpen ? words.collapseAll : words.expandAll} @click=${() => this.setExpanded(anyOpen ? [] : this.results.map((f) => f.path))}>${glyph(anyOpen ? COLLAPSE : EXPAND, "ui-srh__action-glyph")}</button>`
        : nothing}
    </div>`;
    const summary = this.summary();
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, aside: this.actions.length || this.results.length ? actions : undefined }) : nothing}
      <div class="ui-srh__card">
        ${this.hideField ? nothing : this.field()}
        <p class="ui-srh__summary" role="status" ?hidden=${!summary && !this.truncated}>
          ${summary}${this.truncated && this.status !== "error" ? html`<span class="ui-srh__note">${fill(words.truncated, { n: String(this.total) })}</span>` : nothing}
        </p>
        ${this.body()}
      </div>`;
  }

  static override css = /* css */ `
[data-ui="srh"] {
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
  --tc-srh-line-w: 4ch;
  --tc-srh-toggle: 24px;
}
[data-ui="srh"] *, [data-ui="srh"] *::before, [data-ui="srh"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="srh"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="srh"] .ui-srh__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="srh"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-srh__card { overflow: hidden; }
.ui-srh__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-srh__actions { display: flex; gap: var(--tc-space-0-5); }
.ui-srh__action {
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
.ui-srh__action:hover, .ui-srh__action[aria-pressed="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-srh__action:focus-visible, .ui-srh__toggle:focus-visible, .ui-srh__button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-srh__action-glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-srh__fields { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-1); }
.ui-srh__field {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-srh__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-srh__field:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-srh__glass { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-srh__input { flex: 1; min-width: 0; height: 100%; margin: 0; padding: 0; border: 0; outline: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-srh__input::placeholder { color: var(--tc-text-placeholder); }
.ui-srh__input::-webkit-search-cancel-button { display: none; }
.ui-srh__toggles { display: flex; flex: none; gap: var(--tc-space-0-5); }
.ui-srh__toggle {
  display: grid;
  place-items: center;
  min-width: var(--tc-srh-toggle);
  height: var(--tc-srh-toggle);
  margin: 0;
  padding: 0 var(--tc-space-1);
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: none;
  color: var(--tc-text-muted);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  cursor: pointer;
}
.ui-srh__toggle[data-option="wholeWord"] > span:first-child { text-decoration: underline; text-underline-offset: 2px; }
.ui-srh__toggle:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-srh__toggle[aria-pressed="true"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-srh__replace { display: flex; gap: var(--tc-space-1); min-width: 0; }
.ui-srh__replace > .ui-srh__field { flex: 1; }
.ui-srh__button {
  flex: none;
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  color: var(--tc-action-secondary-fg);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  cursor: pointer;
}
.ui-srh__button:disabled { color: var(--tc-text-disabled); cursor: default; }
.ui-srh__summary { display: flex; flex-wrap: wrap; gap: 0 var(--tc-space-2); margin: 0; padding: var(--tc-space-1) var(--tc-space-3); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-srh__summary[hidden] { display: none; }
.ui-srh__note { color: var(--tc-status-warning-fg); }
.ui-srh__scroll { overflow: auto; overflow-anchor: none; overscroll-behavior: contain; padding: var(--tc-space-1); }
/* Fixed-height rows: windowing places them by index */
.ui-srh__row {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-radius-sm);
  cursor: pointer;
  user-select: none;
}
.ui-srh__match { padding-left: calc(var(--tc-space-2) + var(--tc-space-4)); }
.ui-srh__row:hover { background: var(--tc-fill-subtle); }
.ui-srh__row[aria-selected="true"] { background: var(--tc-fill-default); }
.ui-srh__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-srh__chevron { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-srh__file[aria-expanded="true"] > .ui-srh__chevron { transform: rotate(90deg); }
.ui-srh__icon { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-srh__file[data-kind="code"] > .ui-srh__icon { stroke: var(--tc-accent-text); }
.ui-srh__file[data-kind="text"] > .ui-srh__icon { stroke: var(--tc-status-success-fg); }
.ui-srh__file[data-kind="data"] > .ui-srh__icon { stroke: var(--tc-status-warning-fg); }
.ui-srh__file[data-kind="image"] > .ui-srh__icon { stroke: var(--tc-tone-violet-fg); }
.ui-srh__name { flex: none; max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: var(--tc-font-weight-medium); }
.ui-srh__folder { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-overflow: ellipsis; white-space: nowrap; direction: rtl; text-align: left; }
.ui-srh__count {
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
.ui-srh__line { flex: none; min-width: var(--tc-srh-line-w); color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); text-align: right; }
.ui-srh__text { flex: 1; min-width: 0; overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); text-overflow: ellipsis; white-space: pre; }
.ui-srh__hit { border-radius: var(--tc-radius-xs); background: var(--tc-status-warning-bg); color: inherit; }
.ui-srh__del { background: var(--tc-status-danger-bg); color: var(--tc-text-primary); text-decoration: line-through; }
.ui-srh__ins { background: var(--tc-status-success-bg); color: var(--tc-text-primary); text-decoration: none; }
.ui-srh__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-3); color: var(--tc-text-muted); text-align: center; }
.ui-srh__empty[data-tone="danger"] { color: var(--tc-status-danger-fg); }
@container (max-width: 300px) {
  .ui-srh__folder { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="srh"] *, [data-ui="srh"] *::before, [data-ui="srh"] *::after { transition: none !important; }
}
`;
}

if (!customElements.get("tc-search-results")) customElements.define("tc-search-results", TcSearchResults);
declare global {
  interface HTMLElementTagNameMap {
    "tc-search-results": TcSearchResults;
  }
}

import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { RowWindowController } from "./internal/controllers";

/*
 * <tc-file-tree> – a project's files: folders that fold, a filter that keeps the matches and the folders they're in, an
 * icon per kind of file and an optional Git status. Folders come first unless `sort` is off. With `searchable`, "?" then
 * text and Enter asks the page to search inside files. One tab stop: arrows walk the tree, ← and → fold, typing jumps.
 * Long trees render only the rows near the view.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-file-tree .nodes=${fileTreeFromPaths(["src/a.ts", "README.md"])}></tc-file-tree>
 *
 * A file's identity is its path from the root, joined with "/": that's what `selected` and `expanded` hold.
 */

export type FileTreeStatus = "added" | "modified" | "deleted" | "untracked";
export type FileTreeNode = {
  name: string;
  /** Makes it a folder; omit for a file */
  children?: FileTreeNode[];
  /** A folder whose children aren't known yet: opening it fires tc-load */
  lazy?: boolean;
  /** Its Git status, shown as a letter */
  status?: FileTreeStatus;
  /** SVG path data for a 24×24 stroked icon, in place of the one for its kind */
  icon?: string | string[];
};
export type FileTreeSelectedChange = { selected: string | null; node?: FileTreeNode };
export type FileTreeExpandedChange = { expanded: string[]; path: string };
export type FileTreeQueryChange = { query: string };
export type FileTreeOpen = { path: string; node: FileTreeNode };
export type FileTreeLoad = { path: string; node: FileTreeNode };
export type FileTreeSearch = { query: string };
export type FileTreeAction = { id: string };
export type FileTreeActionItem = { id: string; label: string; icon: string | string[]; pressed?: boolean };
export type FileTreeLabels = Record<FileTreeStatus | "filter" | "searchHint" | "empty" | "noMatches" | "loading", string>;
export const defaultFileTreeLabels: FileTreeLabels = {
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
  untracked: "Untracked",
  filter: "Filter",
  searchHint: "Filter, or ? to search in files",
  empty: "No files",
  noMatches: "No matching files",
  loading: "Loading",
};

/** Builds nodes from paths such as "src/a.ts"; a path ending in "/" is an empty folder. Backslashes count as slashes,
 *  "." parts are dropped and ".." goes up a folder, so "./lib/a.ts" and "lib\\a.ts" land in the same place */
export function fileTreeFromPaths(paths: readonly string[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  for (const raw of paths) {
    const path = raw.replace(/\\/g, "/");
    const folder = path.endsWith("/");
    const parts: string[] = [];
    for (const part of path.split("/")) {
      if (part === "..") parts.pop();
      else if (part && part !== ".") parts.push(part);
    }
    let level = root;
    parts.forEach((name, i) => {
      const last = i === parts.length - 1;
      let node = level.find((n) => n.name === name);
      if (!node) {
        node = last && !folder ? { name } : { name, children: [] };
        level.push(node);
      }
      if (!last || folder) level = node.children ??= [];
    });
  }
  return root;
}

const isFolder = (n: FileTreeNode) => !!n.children || !!n.lazy;
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const sorted = (nodes: FileTreeNode[]) => [...nodes].sort((a, b) => +isFolder(b) - +isFolder(a) || collator.compare(a.name, b.name));

type Row = { node: FileTreeNode; path: string; parent: string | null; level: number; size: number; pos: number; open: boolean };

const KINDS: Record<string, "code" | "text" | "data" | "image"> = {};
for (const e of "ts tsx js jsx mjs cjs py rb go rs java kt swift c h cpp cs php sh css scss html vue svelte".split(" ")) KINDS[e] = "code";
for (const e of "md mdx txt rst pdf doc docx".split(" ")) KINDS[e] = "text";
for (const e of "json yaml yml toml csv xml lock".split(" ")) KINDS[e] = "data";
for (const e of "png jpg jpeg gif webp svg ico".split(" ")) KINDS[e] = "image";
const kindOf = (name: string) => KINDS[name.slice(name.lastIndexOf(".") + 1).toLowerCase()] ?? "file";

/* After Lucide: file, file-code, file-text, file-json, image, chevron-right, search (ISC licence) */
const PAGE = ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v5h6"];
const ICONS: Record<string, string[]> = {
  file: PAGE,
  code: [...PAGE, "m10 13-2 2 2 2", "m14 17 2-2-2-2"],
  text: [...PAGE, "M16 13H8", "M16 17H8"],
  data: [...PAGE, "M10 12c-1 0-1 1-1 2s-1 1-1 1 1 0 1 1 0 2 1 2", "M14 18c1 0 1-1 1-2s1-1 1-1-1 0-1-1 0-2-1-2"],
  image: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z", "M9 9h.01", "m21 15-5-5L5 21"],
};
const glyph = (paths: string | string[], cls: string) =>
  html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${(Array.isArray(paths) ? paths : [paths]).map((d) => svg`<path d=${d}></path>`)}</svg>`;
const headIcon = svg`<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>`;
const STATUS_LETTER: Record<FileTreeStatus, string> = { added: "A", modified: "M", deleted: "D", untracked: "U" };

/** A tree with more visible rows than this renders only the ones near the view */
const WINDOW_FROM = 200;
const OVERSCAN = 30;
/** --tc-control-h-sm, the row height before the first row is measured */
const ROW = 28;

/**
 * A project's files: folders that fold, a filter, an icon per kind of file and an optional Git status.
 * @tag tc-file-tree
 * @fires tc-selected-change - Another file was chosen ({ selected, node }: FileTreeSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-expanded-change - A folder opened or closed ({ expanded, path }: FileTreeExpandedChange); cancelable – prevented, `expanded` stays as it was
 * @fires tc-query-change - The filter's text changed ({ query }: FileTreeQueryChange); cancelable – prevented, `query` stays as it was
 * @fires tc-open - A file was clicked, or Enter or Space pressed on it ({ path, node }: FileTreeOpen)
 * @fires tc-load - A lazy folder was opened and needs its children ({ path, node }: FileTreeLoad)
 * @fires tc-search - "?" and text then Enter, with `searchable` ({ query }: FileTreeSearch)
 * @fires tc-action - A header button was pressed ({ id }: FileTreeAction)
 */
export class TcFileTree extends TcElement {
  static override ui = "ftr";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Files";
  /** Small text under the heading – the project or branch */
  @property() accessor description = "";
  /** The top level of the tree; `fileTreeFromPaths` builds it from paths */
  @property({ attribute: false }) accessor nodes: FileTreeNode[] = [];
  /** The chosen file's path, or null */
  @property() accessor selected: string | null = null;
  /** The paths of the open folders */
  @property({ attribute: false }) accessor expanded: string[] = [];
  /** The filter's text */
  @property() accessor query = "";
  /** Folders first, then by name with numbers in order; off keeps the order given */
  @property({ type: Boolean, converter: { fromAttribute: (v) => v !== "false" } }) accessor sort = true;
  /** Leaves out the filter */
  @property({ type: Boolean, attribute: "hide-filter" }) accessor hideFilter = false;
  /** "?" then text and Enter fires tc-search, for searching inside files */
  @property({ type: Boolean }) accessor searchable = false;
  /** Height in px at which the tree scrolls */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 480;
  /** Buttons in the header */
  @property({ attribute: false }) accessor actions: FileTreeActionItem[] = [];
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<FileTreeLabels> = {};

  /** The path of the row that holds the tab stop */
  @state() private accessor active: string | null = null;
  @state() private accessor message = "";
  /** Folders opened or closed by hand while a filter is on; forgotten when the filter changes */
  @state() private accessor filterOpen = new Map<string, boolean>();

  private rows: Row[] = [];
  private typed = "";
  private typedAt = 0;
  private win = new RowWindowController(this, {
    count: () => this.rows.length,
    body: () => this.querySelector<HTMLElement>(".ui-ftr__rows"),
    rowSelector: ".ui-ftr__row",
    from: WINDOW_FROM,
    overscan: OVERSCAN,
    rowHeight: ROW,
  });

  private get words() {
    return { ...defaultFileTreeLabels, ...this.labels };
  }
  /** The filter's text, unless it's asking to search inside files */
  private get filter() {
    const q = this.query.trim().toLowerCase();
    return this.searchable && q.startsWith("?") ? "" : q;
  }

  private build(): Row[] {
    const q = this.filter;
    const open = new Set(this.expanded);
    const rows: Row[] = [];
    const hit = (n: FileTreeNode) => n.name.toLowerCase().includes(q);
    const matches = (n: FileTreeNode): boolean => hit(n) || (n.children ?? []).some(matches);
    // `inside`: under a folder whose own name matched, so everything in it shows
    const walk = (nodes: FileTreeNode[], parent: string | null, level: number, inside: boolean) => {
      const shown = (this.sort ? sorted(nodes) : nodes).filter((n) => !q || inside || matches(n));
      shown.forEach((node, i) => {
        const path = parent ? `${parent}/${node.name}` : node.name;
        // While filtering, a folder with a match inside starts open; any folder can still be opened or closed by hand
        const isOpen = isFolder(node) && (q ? (this.filterOpen.get(path) ?? (node.children ?? []).some(matches)) : open.has(path));
        rows.push({ node, path, parent, level, size: shown.length, pos: i + 1, open: isOpen });
        if (isOpen && node.children) walk(node.children, path, level + 1, inside || (!!q && hit(node)));
      });
    };
    walk(this.nodes, null, 1, false);
    return rows;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("query") && this.filterOpen.size) this.filterOpen = new Map();
    this.rows = this.build();
    if (!this.rows.some((r) => r.path === this.active)) this.active = this.rows.find((r) => r.path === this.selected)?.path ?? this.rows[0]?.path ?? null;
    this.win.compute();
  }

  private setExpanded(path: string, open: boolean) {
    const expanded = open ? [...this.expanded, path] : this.expanded.filter((p) => p !== path);
    if (!this.emit<FileTreeExpandedChange>("tc-expanded-change", { expanded, path }, { cancelable: true })) return false;
    this.expanded = expanded;
    return true;
  }

  private toggle(row: Row) {
    // While filtering, opening and closing is the filter's own view: it doesn't change `expanded`
    if (this.filter) this.filterOpen = new Map(this.filterOpen).set(row.path, !row.open);
    else if (!this.setExpanded(row.path, !row.open)) return;
    if (!row.open && row.node.lazy && !row.node.children) this.emit<FileTreeLoad>("tc-load", { path: row.path, node: row.node });
  }

  private press(row: Row) {
    this.active = row.path;
    if (isFolder(row.node)) return this.toggle(row);
    if (row.path !== this.selected && this.emit<FileTreeSelectedChange>("tc-selected-change", { selected: row.path, node: row.node }, { cancelable: true })) this.selected = row.path;
    this.emit<FileTreeOpen>("tc-open", { path: row.path, node: row.node });
  }

  private async focusRow(path: string) {
    this.active = path;
    this.win.reveal(this.rows.findIndex((r) => r.path === path));
    await this.updateComplete;
    this.querySelector<HTMLElement>(`.ui-ftr__row[data-path="${CSS.escape(path)}"]`)?.focus();
  }

  private onTreeKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const rows = this.rows;
    const i = rows.findIndex((r) => r.path === this.active);
    const row = rows[i];
    if (!row) return;
    let to: string | undefined;
    switch (e.key) {
      case "ArrowDown":
        to = rows[i + 1]?.path;
        break;
      case "ArrowUp":
        to = rows[i - 1]?.path;
        break;
      case "Home":
        to = rows[0].path;
        break;
      case "End":
        to = rows[rows.length - 1].path;
        break;
      case "ArrowRight":
        if (isFolder(row.node) && !row.open) this.toggle(row);
        else if (row.open) to = rows[i + 1]?.level > row.level ? rows[i + 1].path : undefined;
        break;
      case "ArrowLeft":
        if (row.open) this.toggle(row);
        else to = row.parent ?? undefined;
        break;
      case "Enter":
      case " ":
        this.press(row);
        break;
      default:
        if (e.key.length !== 1) return;
        to = this.typeahead(e.key, i, e.timeStamp);
        break;
    }
    e.preventDefault();
    if (to) void this.focusRow(to);
  };

  /** Printable keys build a prefix for a moment; the next row whose name starts with it gets the focus */
  private typeahead(key: string, from: number, now: number) {
    this.typed = now - this.typedAt > 600 ? key.toLowerCase() : this.typed + key.toLowerCase();
    this.typedAt = now;
    const rows = this.rows;
    const start = this.typed.length > 1 ? from : from + 1;
    for (let k = 0; k < rows.length; k++) {
      const r = rows[(start + k) % rows.length];
      if (r.node.name.toLowerCase().startsWith(this.typed)) return r.path;
    }
    return undefined;
  }

  private setQuery(query: string) {
    if (query === this.query) return;
    if (this.emit<FileTreeQueryChange>("tc-query-change", { query }, { cancelable: true })) {
      this.query = query;
      void this.updateComplete.then(() => {
        const q = this.filter;
        const n = this.rows.filter((r) => !isFolder(r.node)).length;
        this.message = q ? `${n} ${n === 1 ? "file matches" : "files match"}` : "";
      });
    } else this.requestUpdate();
  }

  private onFilterKey = (e: KeyboardEvent) => {
    const q = this.query.trim();
    if (e.key === "Enter" && this.searchable && q.startsWith("?") && q.length > 1) {
      e.preventDefault();
      this.emit<FileTreeSearch>("tc-search", { query: q.slice(1).trim() });
    } else if (e.key === "Escape" && this.query) {
      e.preventDefault();
      this.setQuery("");
    } else if (e.key === "ArrowDown" && this.rows.length) {
      e.preventDefault();
      void this.focusRow(this.active ?? this.rows[0].path);
    }
  };

  /** The name, with what the filter matched marked */
  private name(name: string): TemplateResult | string {
    const q = this.filter;
    const at = q ? name.toLowerCase().indexOf(q) : -1;
    if (at < 0) return name;
    return html`${name.slice(0, at)}<mark class="ui-ftr__hit">${name.slice(at, at + q.length)}</mark>${name.slice(at + q.length)}`;
  }

  private row(r: Row, stop: string | null) {
    const words = this.words;
    const folder = isFolder(r.node);
    const loading = folder && r.open && !!r.node.lazy && !r.node.children;
    return html`<div
      class="ui-ftr__row"
      role="treeitem"
      data-path=${r.path}
      data-kind=${folder ? "folder" : kindOf(r.node.name)}
      aria-level=${r.level}
      aria-setsize=${r.size}
      aria-posinset=${r.pos}
      aria-expanded=${ifDefined(folder ? (r.open ? "true" : "false") : undefined)}
      aria-selected=${r.path === this.selected ? "true" : "false"}
      aria-busy=${ifDefined(loading ? "true" : undefined)}
      tabindex=${r.path === stop ? 0 : -1}
      title=${r.path}
      style=${styleMap({ "--tc-file-tree-level": String(r.level - 1) })}
      @click=${() => this.press(r)}
      @focus=${() => this.active !== r.path && (this.active = r.path)}
    >
      ${folder ? html`<svg class="ui-ftr__chevron" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m9 18 6-6-6-6"></path>`}</svg>` : glyph(r.node.icon ?? ICONS[kindOf(r.node.name)], "ui-ftr__icon")}
      <span class="ui-ftr__name">${this.name(r.node.name)}</span>
      ${loading ? html`<span class="ui-ftr__note">${words.loading}</span>` : nothing}
      ${r.node.status ? html`<span class="ui-ftr__status" data-status=${r.node.status} title=${words[r.node.status]}><span aria-hidden="true">${STATUS_LETTER[r.node.status]}</span><span class="ui-ftr__sr">${words[r.node.status]}</span></span>` : nothing}
    </div>`;
  }

  private tree() {
    const rows = this.rows;
    const words = this.words;
    if (!rows.length) return html`<p class="ui-ftr__empty">${this.filter ? words.noMatches : words.empty}</p>`;
    const { start, end } = this.win;
    const h = this.win.rowHeight;
    // A long tree only renders the rows near the view; when the active row has scrolled out, the first rendered row
    // takes the tab stop, so Tab never skips the tree
    const at = rows.findIndex((r) => r.path === this.active);
    const stop = at >= start && at < end ? this.active : (rows[start]?.path ?? null);
    const shown: TemplateResult[] = [];
    for (let n = start; n < end; n++) shown.push(this.row(rows[n], stop));
    return html`<div class="ui-ftr__scroll" style=${styleMap({ maxHeight: `${this.maxHeight}px` })}>
      <div class="ui-ftr__rows" role="tree" aria-label=${this.heading || "Files"} @keydown=${this.onTreeKey}>
        ${start > 0 ? html`<div aria-hidden="true" style=${styleMap({ height: `${start * h}px` })}></div>` : nothing}${shown}${end < rows.length ? html`<div aria-hidden="true" style=${styleMap({ height: `${(rows.length - end) * h}px` })}></div>` : nothing}
      </div>
    </div>`;
  }

  protected override render() {
    const words = this.words;
    const actions = this.actions.length
      ? html`<div class="ui-ftr__actions">${this.actions.map(
          (a) => html`<button type="button" class="ui-ftr__action" title=${a.label} aria-label=${a.label} aria-pressed=${ifDefined(a.pressed === undefined ? undefined : a.pressed ? "true" : "false")} @click=${() => this.emit<FileTreeAction>("tc-action", { id: a.id })}>${glyph(a.icon, "ui-ftr__action-glyph")}</button>`,
        )}</div>`
      : nothing;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, aside: actions === nothing ? undefined : actions }) : nothing}
      <div class="ui-ftr__card">
        ${this.hideFilter
          ? nothing
          : html`<div class="ui-ftr__filter">
              <label class="ui-ftr__field">
                <svg class="ui-ftr__search" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M11 3a8 8 0 1 0 0 16a8 8 0 1 0 0-16"></path><path d="m21 21-4.3-4.3"></path>`}</svg>
                <input class="ui-ftr__input" type="search" aria-label=${words.filter} placeholder=${this.searchable ? words.searchHint : words.filter} autocomplete="off" spellcheck="false" .value=${live(this.query)} @input=${(e: Event) => this.setQuery((e.target as HTMLInputElement).value)} @keydown=${this.onFilterKey} />
              </label>
            </div>`}
        ${this.tree()}
      </div>
      <span class="ui-ftr__sr" role="status">${this.message}</span>`;
  }

  static override css = /* css */ `
[data-ui="ftr"] {
  box-sizing: border-box;
  display: block;
  min-width: 0;
  width: 100%;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  -webkit-font-smoothing: antialiased;
}
[data-ui="ftr"] *, [data-ui="ftr"] *::before, [data-ui="ftr"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ftr"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ftr"] .ui-ftr__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ftr"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-ftr__card { overflow: hidden; }
.ui-ftr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-ftr__actions { display: flex; gap: var(--tc-space-0-5); }
.ui-ftr__action {
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
.ui-ftr__action:hover, .ui-ftr__action[aria-pressed="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-ftr__action:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ftr__action-glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-ftr__filter { padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-1); }
.ui-ftr__field {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ftr__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-ftr__field:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-ftr__search { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; }
.ui-ftr__input { flex: 1; min-width: 0; height: 100%; margin: 0; padding: 0; border: 0; outline: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-ftr__input::placeholder { color: var(--tc-text-placeholder); }
.ui-ftr__input::-webkit-search-cancel-button { display: none; }
.ui-ftr__scroll { overflow: auto; overflow-anchor: none; overscroll-behavior: contain; padding: var(--tc-space-1); }
/* Fixed-height rows: windowing places them by index */
.ui-ftr__row {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  padding-right: var(--tc-space-2);
  padding-left: calc(var(--tc-space-2) + var(--tc-file-tree-level) * var(--tc-file-tree-indent));
  border-radius: var(--tc-radius-sm);
  cursor: pointer;
  user-select: none;
  --tc-file-tree-indent: var(--tc-space-4);
}
.ui-ftr__row:hover { background: var(--tc-fill-subtle); }
.ui-ftr__row[aria-selected="true"] { background: var(--tc-fill-default); }
.ui-ftr__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-ftr__chevron { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ftr__row[aria-expanded="true"] > .ui-ftr__chevron { transform: rotate(90deg); }
.ui-ftr__icon { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-ftr__row[data-kind="code"] > .ui-ftr__icon { stroke: var(--tc-accent-text); }
.ui-ftr__row[data-kind="text"] > .ui-ftr__icon { stroke: var(--tc-status-success-fg); }
.ui-ftr__row[data-kind="data"] > .ui-ftr__icon { stroke: var(--tc-status-warning-fg); }
.ui-ftr__row[data-kind="image"] > .ui-ftr__icon { stroke: var(--tc-tone-violet-fg); }
.ui-ftr__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-ftr__hit { border-radius: var(--tc-radius-xs); background: var(--tc-status-warning-bg); color: inherit; }
.ui-ftr__note { flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-ftr__status { flex: none; color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); }
.ui-ftr__status[data-status="added"], .ui-ftr__status[data-status="untracked"] { color: var(--tc-status-success-fg); }
.ui-ftr__status[data-status="modified"] { color: var(--tc-status-warning-fg); }
.ui-ftr__status[data-status="deleted"] { color: var(--tc-status-danger-fg); }
.ui-ftr__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-3); color: var(--tc-text-muted); text-align: center; }
@media (prefers-reduced-motion: reduce) {
  [data-ui="ftr"] *, [data-ui="ftr"] *::before, [data-ui="ftr"] *::after { transition: none !important; }
}
`;
}


if (!customElements.get("tc-file-tree")) customElements.define("tc-file-tree", TcFileTree);
declare global {
  interface HTMLElementTagNameMap {
    "tc-file-tree": TcFileTree;
  }
}

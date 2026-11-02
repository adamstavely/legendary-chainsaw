import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { codeBlockDiff } from "./code-block";
import "./code-block";

/*
 * <tc-diff-viewer> – the changes to a set of files: totals at the top, then a row per file with its status and lines
 * added and removed, which opens to a line diff (tc-code-block's, with long unchanged runs folded). Only open files draw
 * a diff, so a large change stays quick. The rows are an accordion: ↑ ↓ Home End move, Enter or Space opens.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-diff-viewer .files=${[{ path: "src/a.ts", before: "…", after: "…" }]}></tc-diff-viewer>
 */

export type DiffFileStatus = "added" | "modified" | "deleted" | "renamed";
export type DiffFile = {
  /** The file's path, which also identifies it */
  path: string;
  /** Its text before; omit or "" for a new file */
  before?: string;
  /** Its text after; omit or "" for a deleted file */
  after?: string;
  /** By default worked out from the texts and `previousPath` */
  status?: DiffFileStatus;
  /** The old path of a renamed file */
  previousPath?: string;
  /** The language for the colours; by default the path's extension */
  language?: string;
  /** A file with no text to compare: the row says so, and doesn't open */
  binary?: boolean;
};
export type DiffViewerExpandedChange = { expanded: string[]; path: string };
export type DiffViewerLabels = Record<DiffFileStatus | "binary" | "empty" | "expandAll" | "collapseAll", string>;
export const defaultDiffViewerLabels: DiffViewerLabels = {
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
  renamed: "Renamed",
  binary: "Binary file",
  empty: "No changes",
  expandAll: "Expand all",
  collapseAll: "Collapse all",
};

/** The status a file's texts and paths say it has */
export function diffFileStatus(file: DiffFile): DiffFileStatus {
  if (file.status) return file.status;
  if (file.previousPath && file.previousPath !== file.path) return "renamed";
  if (!file.binary && !file.before && file.after) return "added";
  if (!file.binary && file.before && !file.after) return "deleted";
  return "modified";
}

/** Lines added and removed in a file */
export function diffFileCounts(file: DiffFile): { additions: number; deletions: number } {
  if (file.binary) return { additions: 0, deletions: 0 };
  // An empty text is no lines, not one empty line
  const rows = codeBlockDiff(file.before ?? "", file.after ?? "").filter((r) => r.text !== "" || (file.before && file.after));
  return { additions: rows.filter((r) => r.kind === "added").length, deletions: rows.filter((r) => r.kind === "removed").length };
}

/* After Lucide: file-diff, chevron-right (ISC licence) */
const headIcon = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M9 10h6"></path><path d="M12 13V7"></path><path d="M9 17h6"></path>`;
const chevron = html`<svg class="ui-dfv__chevron" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m9 18 6-6-6-6"></path>`}</svg>`;
// The block's own parts, hidden below: ui-cblk__name, ui-cblk__title, ui-cblk__stat, ui-cblk__lang
const count = (n: number) => n.toLocaleString("en-US");

/**
 * The changes to a set of files: a row per file with its status and line counts, opening to a line diff.
 * @tag tc-diff-viewer
 * @fires tc-expanded-change - A file was opened or closed, or all of them ({ expanded, path }: DiffViewerExpandedChange); cancelable – prevented, `expanded` stays as it was
 */
export class TcDiffViewer extends TcElement {
  static override ui = "dfv";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Changes";
  /** Small text under the heading – the branch, or what it's compared with */
  @property() accessor description = "";
  /** The changed files, in the order to show them */
  @property({ attribute: false }) accessor files: DiffFile[] = [];
  /** The paths of the open files; unset opens the first `autoExpand` */
  @property({ attribute: false }) accessor expanded: string[] | undefined = undefined;
  /** How many files start open when `expanded` is unset */
  @property({ type: Number, attribute: "auto-expand" }) accessor autoExpand = 3;
  /** Height in px at which one file's diff scrolls; 0 lets it grow */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 360;
  /** Wrap long lines instead of scrolling sideways */
  @property({ type: Boolean }) accessor wrap = false;
  /** Renames the status words and buttons */
  @property({ attribute: false }) accessor labels: Partial<DiffViewerLabels> = {};

  @state() private accessor message = "";
  private counts = new Map<string, { file: DiffFile; counts: { additions: number; deletions: number } }>();

  private get words() {
    return { ...defaultDiffViewerLabels, ...this.labels };
  }
  private get openable() {
    return this.files.filter((f) => !f.binary);
  }
  private get open() {
    return this.expanded ?? this.openable.slice(0, this.autoExpand).map((f) => f.path);
  }
  private countsOf(file: DiffFile) {
    const had = this.counts.get(file.path);
    if (had && had.file === file) return had.counts;
    const counts = diffFileCounts(file);
    this.counts.set(file.path, { file, counts });
    return counts;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("files")) for (const path of [...this.counts.keys()]) if (!this.files.some((f) => f.path === path)) this.counts.delete(path);
  }

  private setExpanded(expanded: string[], path: string) {
    if (this.emit<DiffViewerExpandedChange>("tc-expanded-change", { expanded, path }, { cancelable: true })) this.expanded = expanded;
  }

  private toggle(path: string) {
    const open = this.open;
    const name = path.slice(path.lastIndexOf("/") + 1);
    const closing = open.includes(path);
    this.setExpanded(closing ? open.filter((p) => p !== path) : [...open, path], path);
    this.message = `${name} ${closing ? "closed" : "open"}`;
  }

  private onKey = (e: KeyboardEvent) => {
    const rows = [...this.querySelectorAll<HTMLButtonElement>(".ui-dfv__toggle:not(:disabled)")];
    const i = rows.indexOf(e.target as HTMLButtonElement);
    if (i < 0) return;
    const to = e.key === "ArrowDown" ? (i + 1) % rows.length : e.key === "ArrowUp" ? (i - 1 + rows.length) % rows.length : e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    rows[to].focus();
  };

  private row(file: DiffFile) {
    const words = this.words;
    const status = diffFileStatus(file);
    const open = !file.binary && this.open.includes(file.path);
    const { additions, deletions } = this.countsOf(file);
    const cut = file.path.lastIndexOf("/") + 1;
    return html`<li class="ui-dfv__file" data-path=${file.path} data-status=${status}>
      <button type="button" class="ui-dfv__toggle" aria-expanded=${ifDefined(file.binary ? undefined : open ? "true" : "false")} ?disabled=${file.binary} @click=${() => this.toggle(file.path)}>
        ${file.binary ? html`<span class="ui-dfv__chevron-gap" aria-hidden="true"></span>` : chevron}
        <span class="ui-dfv__path" title=${file.previousPath ? `${file.previousPath} → ${file.path}` : file.path}>
          <span class="ui-dfv__dir">${file.previousPath ? `${file.previousPath} → ` : ""}${file.path.slice(0, cut)}</span><span class="ui-dfv__base">${file.path.slice(cut)}</span>
        </span>
        <span class="ui-dfv__status">${words[status]}</span>
        ${file.binary
          ? html`<span class="ui-dfv__note">${words.binary}</span>`
          : html`<span class="ui-dfv__counts"><span class="ui-dfv__plus">+${count(additions)}</span> <span class="ui-dfv__minus">−${count(deletions)}</span></span>`}
      </button>
      ${open
        ? html`<div class="ui-dfv__body"><tc-code-block
            bare
            .filename=${file.path}
            .code=${file.after ?? ""}
            .current=${file.before ?? ""}
            .view=${"diff"}
            .language=${file.language ?? file.path.slice(file.path.lastIndexOf(".") + 1)}
            .maxHeight=${this.maxHeight}
            .wrap=${this.wrap}
            @tc-view-change=${(e: Event) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          ></tc-code-block></div>`
        : nothing}
    </li>`;
  }

  protected override render() {
    const words = this.words;
    const files = this.files;
    const totals = files.reduce(
      (t, f) => {
        const c = this.countsOf(f);
        return { additions: t.additions + c.additions, deletions: t.deletions + c.deletions };
      },
      { additions: 0, deletions: 0 },
    );
    const allOpen = this.openable.length > 0 && this.openable.every((f) => this.open.includes(f.path));
    const aside = files.length
      ? html`<span class="ui-dfv__totals">${count(files.length)} ${files.length === 1 ? "file" : "files"} <span class="ui-dfv__plus">+${count(totals.additions)}</span> <span class="ui-dfv__minus">−${count(totals.deletions)}</span></span>`
      : nothing;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, aside }) : nothing}
      <div class="ui-dfv__card">
        ${files.length
          ? html`${this.openable.length > 1
                ? html`<div class="ui-dfv__bar"><button type="button" class="ui-dfv__all" @click=${() => this.setExpanded(allOpen ? [] : this.openable.map((f) => f.path), "")}>${allOpen ? words.collapseAll : words.expandAll}</button></div>`
                : nothing}
              <ul class="ui-dfv__list" aria-label=${this.heading || "Changed files"} @keydown=${this.onKey}>${repeat(files, (f) => f.path, (f) => this.row(f))}</ul>`
          : html`<p class="ui-dfv__empty">${words.empty}</p>`}
      </div>
      <span class="ui-dfv__sr" role="status">${this.message}</span>`;
  }

  static override css = /* css */ `
[data-ui="dfv"] {
  box-sizing: border-box;
  display: block;
  container-type: inline-size;
  min-width: 0;
  width: 100%;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  -webkit-font-smoothing: antialiased;
}
[data-ui="dfv"] *, [data-ui="dfv"] *::before, [data-ui="dfv"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dfv"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dfv"] .ui-dfv__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dfv"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-dfv__card { overflow: hidden; }
:where([data-ui="dfv"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
[data-ui="dfv"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-dfv__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-dfv__totals { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-dfv__plus { color: var(--tc-status-success-fg); }
.ui-dfv__minus { color: var(--tc-status-danger-fg); }
.ui-dfv__bar { display: flex; justify-content: flex-end; padding: var(--tc-space-1) var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-border-default); }
.ui-dfv__all { min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); }
.ui-dfv__all:hover { background: var(--tc-fill-default); }
.ui-dfv__list { margin: 0; padding: 0; list-style: none; }
.ui-dfv__file + .ui-dfv__file { border-top: var(--tc-hairline) solid var(--tc-border-default); }
.ui-dfv__toggle {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  width: 100%;
  min-height: var(--tc-control-h-md);
  padding: var(--tc-space-1) var(--tc-space-3);
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-dfv__toggle:hover:not(:disabled) { background: var(--tc-fill-subtle); }
.ui-dfv__toggle:disabled { cursor: default; }
.ui-dfv__chevron { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dfv__chevron-gap { flex: none; width: 14px; }
.ui-dfv__toggle[aria-expanded="true"] .ui-dfv__chevron { transform: rotate(90deg); }
/* The directory gives way first, so the file's name stays */
.ui-dfv__path { display: flex; flex: 1; min-width: 0; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-dfv__dir { flex: 0 1 auto; min-width: 0; overflow: hidden; color: var(--tc-text-muted); text-overflow: ellipsis; }
.ui-dfv__base { flex: 0 0 auto; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.ui-dfv__status { flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
[data-status="added"] > .ui-dfv__toggle .ui-dfv__status { color: var(--tc-status-success-fg); }
[data-status="deleted"] > .ui-dfv__toggle .ui-dfv__status { color: var(--tc-status-danger-fg); }
.ui-dfv__counts, .ui-dfv__note { flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-dfv__body { border-top: var(--tc-hairline) solid var(--tc-border-default); }
/* The row already says the name and counts: the block keeps the name only to name its region */
.ui-dfv__body .ui-cblk__name, .ui-dfv__body .ui-cblk__title > svg, .ui-dfv__body .ui-cblk__stat { display: none; }
.ui-dfv__body .ui-cblk__name + .ui-cblk__lang::before { content: none; }
.ui-dfv__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-3); color: var(--tc-text-muted); text-align: center; }
@container (max-width: 420px) {
  .ui-dfv__status { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="dfv"] *, [data-ui="dfv"] *::before, [data-ui="dfv"] *::after { transition: none !important; }
}
`;
}

if (!customElements.get("tc-diff-viewer")) customElements.define("tc-diff-viewer", TcDiffViewer);
declare global {
  interface HTMLElementTagNameMap {
    "tc-diff-viewer": TcDiffViewer;
  }
}

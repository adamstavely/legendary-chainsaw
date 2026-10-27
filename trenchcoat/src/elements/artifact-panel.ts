import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import "./code-block";
import { codeBlockDiff, codeBlockLanguageLabel } from "./code-block";
import { diffWords } from "./inline-diff";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OffScreenController } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-artifact-panel> – everything a run produced, in one place: files, code, documents, images and tables. A list on
 * the left (a listbox; on narrow cards it sits above), and a preview of the picked artifact with its versions:
 *   · text – a light document reading (headings, lists, paragraphs); code – a <tc-code-block> with colours and Copy;
 *     image – the picture on a sunken stage; table – a scrolling table
 *   · versions are chips (a radio group); Compare shows what changed since the version before: a word diff for text
 *     (inline-diff's diffWords), a line diff for code (tc-code-block), rows added and removed for tables, before and
 *     after for images
 *   · Download fires a cancelable tc-download; unless the app prevents it, the element saves the version itself (a
 *     Blob for text, code and tables – a CSV –, the image's own URL for images)
 *   · an artifact still being written shows "Writing" in the list and streams into its preview
 *
 *   <tc-artifact-panel .artifacts=${artifacts}></tc-artifact-panel>
 *
 * Standard is a white card on the gray tray, with a caption on the tray below; Clean is one white card with hairline
 * rows. The host is a region named by the heading.
 */

export type ArtifactKind = "text" | "code" | "image" | "table";
export type ArtifactTable = { columns: string[]; rows: Array<Array<string | number>> };
export type ArtifactVersion = {
  id: string;
  /** Chip text; defaults to v1, v2 … */
  label?: string;
  /** When, ready to show: "2 min ago" */
  time?: string;
  /** What changed in this version: "Tightened the intro" */
  note?: string;
  /** Text or code; an image URL; a table (or CSV text) */
  content: string | ArtifactTable;
};
export type Artifact = {
  id: string;
  /** File name, e.g. "launch-plan.md" – also the download name */
  name: string;
  kind: ArtifactKind;
  /** Code: the language for the colours (ts, py, json, html, css, sh …) */
  language?: string;
  /** The download's media type; a sensible one by kind when left out */
  mimeType?: string;
  /** Images: the description */
  alt?: string;
  /** Ready to show, e.g. "2.4 KB" */
  size?: string;
  /** "writing" while the run is still producing it: the newest version streams */
  status?: "writing" | "ready";
  /** Oldest first */
  versions: ArtifactVersion[];
};
export type ArtifactPanelView = "preview" | "diff";
export type ArtifactSelectedChange = { id: string };
export type ArtifactVersionChange = { artifact: string; version: string };
export type ArtifactViewChange = { view: ArtifactPanelView };
export type ArtifactDownload = { artifact: Artifact; version: ArtifactVersion };

/* ---------- Tables ---------- */

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvRow = (r: Array<string | number>) => r.map(csvCell).join(",");

/** A table as CSV text, with a header row */
export function artifactTableToCsv(t: ArtifactTable) {
  return [t.columns, ...t.rows].map(csvRow).join("\n") + "\n";
}

/** CSV text (first row: the columns) as a table */
export function artifactTableFromCsv(text: string): ArtifactTable {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [columns = [], ...body] = rows;
  return { columns, rows: body };
}

const tableOf = (c: ArtifactVersion["content"]): ArtifactTable => (typeof c === "string" ? artifactTableFromCsv(c) : c);
const textOf = (c: ArtifactVersion["content"]) => (typeof c === "string" ? c : artifactTableToCsv(c));

/** Saves a version as a file: a Blob for text, code and tables, the image's own URL for images */
export function saveArtifact(artifact: Artifact, version: ArtifactVersion) {
  const a = document.createElement("a");
  a.download = artifact.name;
  let url = "";
  if (artifact.kind === "image") a.href = textOf(version.content);
  else {
    const type = artifact.mimeType ?? (artifact.kind === "table" ? "text/csv" : /\.md$/i.test(artifact.name) ? "text/markdown" : "text/plain");
    const body = artifact.kind === "table" ? artifactTableToCsv(tableOf(version.content)) : textOf(version.content);
    url = URL.createObjectURL(new Blob([body], { type: `${type};charset=utf-8` }));
    a.href = url;
  }
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
  // The download has its own copy by now
  if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- Documents ---------- */

/** A light reading of Markdown-ish text: # headings, - lists, paragraphs */
function doc(text: string) {
  const blocks: TemplateResult[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push(html`<p class="ui-artp__h" data-level=${h[1].length}>${h[2]}</p>`);
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      blocks.push(html`<ul class="ui-artp__ul">${items.map((t) => html`<li class="ui-artp__li">${t}</li>`)}</ul>`);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3})\s/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) para.push(lines[i++]);
    blocks.push(html`<p class="ui-artp__p">${para.join("\n")}</p>`);
  }
  return blocks;
}

/** A line's Markdown marker ("# ", "- ") and the rest */
const marker = (line: string): [string, string] => {
  const m = /^(#{1,3}\s+|\s*[-*]\s+)/.exec(line);
  return m ? [m[1], line.slice(m[1].length)] : ["", line];
};

/** One line of a document diff, styled like the document: a heading, a list item or a paragraph */
function docLine(line: string, kind: "same" | "changed" | "added" | "removed", body: unknown) {
  const [mark] = marker(line);
  const level = mark.trim().startsWith("#") ? mark.trim().length : 0;
  const cls = level ? "ui-artp__h" : mark ? "ui-artp__li" : "ui-artp__p";
  return html`<p class=${cls} data-level=${ifDefined(level ? String(level) : undefined)} data-kind=${kind}>${body}</p>`;
}

const del = (t: string) => html`<del class="ui-artp__del"><span class="ui-artp__sr">Removed: </span>${t}</del>`;
const ins = (t: string) => html`<ins class="ui-artp__ins"><span class="ui-artp__sr">Added: </span>${t}</ins>`;

/**
 * What changed between two versions of a document, line by line (tc-code-block's line diff), and word by word inside
 * a line that was edited (inline-diff's diffWords) – shown in the document's own styles
 */
function docDiff(before: string, after: string) {
  const rows = codeBlockDiff(before, after).filter((r) => r.text.trim());
  const out: TemplateResult[] = [];
  let i = 0;
  while (i < rows.length) {
    const r = rows[i];
    if (r.kind === "same") {
      out.push(docLine(r.text, "same", marker(r.text)[1]));
      i++;
      continue;
    }
    const removed: string[] = [];
    const added: string[] = [];
    while (i < rows.length && rows[i].kind === "removed") removed.push(rows[i++].text);
    while (i < rows.length && rows[i].kind === "added") added.push(rows[i++].text);
    // Lines edited in place pair up and show the words that changed
    const pairs = Math.min(removed.length, added.length);
    for (let k = 0; k < Math.max(removed.length, added.length); k++) {
      const a = removed[k];
      const b = added[k];
      if (k < pairs && marker(a)[0].trim() === marker(b)[0].trim()) {
        const parts = diffWords(marker(a)[1], marker(b)[1]).map((d) => (d.type === "equal" ? d.text : html`${d.remove ? del(d.remove) : nothing}${d.insert ? ins(d.insert) : nothing}`));
        out.push(docLine(b, "changed", parts));
        continue;
      }
      if (a !== undefined) out.push(docLine(a, "removed", del(marker(a)[1])));
      if (b !== undefined) out.push(docLine(b, "added", ins(marker(b)[1])));
    }
  }
  return out;
}

/* ---------- Icons ---------- */

const glyph = (body: TemplateResult, cls = "ui-artp__glyph") => html`<svg class=${cls} viewBox="0 0 16 16" aria-hidden="true">${body}</svg>`;
const KIND_ICON: Record<ArtifactKind, TemplateResult> = {
  text: svg`<path d="M4 1.75h5l3.25 3.25v8.25a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2.75a1 1 0 0 1 1-1Z"></path><path d="M5.5 8.25h5M5.5 10.75h3.5"></path>`,
  code: svg`<path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5"></path>`,
  image: svg`<rect x="2" y="2.75" width="12" height="10.5" rx="1.75"></rect><circle cx="5.75" cy="6.25" r="1.1"></circle><path d="m2.5 12 3.75-3.5 2.5 2.25 2-1.75 3 2.75"></path>`,
  table: svg`<rect x="2" y="2.75" width="12" height="10.5" rx="1.75"></rect><path d="M2 6.25h12M2 9.75h12M6.5 6.25v7"></path>`,
};
const KIND_LABEL: Record<ArtifactKind, string> = { text: "Document", code: "Code", image: "Image", table: "Table" };
const downloadIcon = glyph(svg`<path d="M8 2.25v7.5M5 6.75l3 3 3-3M2.75 11.25v1a1.5 1.5 0 0 0 1.5 1.5h7.5a1.5 1.5 0 0 0 1.5-1.5v-1"></path>`);
const compareIcon = glyph(svg`<path d="M8 2.5v6M5 5.5h6M5 12.5h6"></path>`);
// The header icon: a stack of files
const filesIcon = svg`<path d="M20 7h-3a2 2 0 0 1-2-2V2"></path><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z"></path><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8"></path>`;

/* ---------- Element ---------- */

let instances = 0;

/**
 * The files, code and documents a run produced: a list, a preview per type, versions with a diff, download.
 * @tag tc-artifact-panel
 * @fires tc-selected-change - An artifact was picked in the list ({ id: string }); cancelable
 * @fires tc-version-change - A version was picked, or picking another artifact went back to its latest ({ artifact: string, version: string }); cancelable
 * @fires tc-view-change - Compare was turned on or off ({ view: "preview" | "diff" }); cancelable
 * @fires tc-download - Download was pressed ({ artifact: Artifact, version: ArtifactVersion }); cancelable – unless prevented, the element saves the file
 */
export class TcArtifactPanel extends TcElement {
  static override ui = "artp";

  /** What the run produced */
  @property({ attribute: false }) accessor artifacts: Artifact[] = [];
  /** The id of the artifact shown; empty shows the first. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected = "";
  /** The id of the version shown; empty shows the latest. Changed by the user unless a tc-version-change listener calls preventDefault() */
  @property() accessor version = "";
  /** "preview", or "diff" to compare the version with the one before. Changed by the user unless a tc-view-change listener calls preventDefault() */
  @property({ reflect: true }) accessor view: ArtifactPanelView = "preview";
  /** The heading, and the region's name */
  @property() accessor heading = "Artifacts";
  /** Shown when there is nothing yet */
  @property({ attribute: "empty-label" }) accessor emptyLabel = "Nothing produced yet";
  /** The preview's height cap in px; longer content scrolls */
  @property({ type: Number, attribute: "preview-height" }) accessor previewHeight = 360;

  @state() private accessor message = "";

  private readonly uid = `tc-artp${++instances}`;
  private typed = "";
  private typedAt = 0;
  private namedByUs = false;

  constructor() {
    super();
    // Focus that was on a removed artifact goes to the one now selected, else the list
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('.ui-artp__option[tabindex="0"]') ?? this.querySelector<HTMLElement>(".ui-artp__list"));
    // The "writing" pulse pauses off-screen
    new OffScreenController(this, () => this.artifacts.some((a) => a.status === "writing"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  /* ---------- Derived ---------- */

  /** @internal The artifact shown */
  get currentArtifact(): Artifact | undefined {
    return this.artifacts.find((a) => a.id === this.selected) ?? this.artifacts[0];
  }
  private versionIndex(a: Artifact) {
    const i = this.version ? a.versions.findIndex((v) => v.id === this.version) : -1;
    return i < 0 ? a.versions.length - 1 : i;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // Named by the heading unless the page named it
    const label = this.getAttribute("aria-label");
    if (label === null || this.namedByUs) {
      this.setAttribute("aria-label", this.heading);
      this.namedByUs = true;
    }
  }

  /* ---------- Changes ---------- */

  private pick(id: string, focus = false) {
    const a = this.currentArtifact;
    if (a && a.id === id) {
      if (focus) this.focusOption(id);
      return;
    }
    if (!this.emit<ArtifactSelectedChange>("tc-selected-change", { id }, { cancelable: true })) return;
    this.selected = id;
    // Another artifact starts at its latest version
    if (this.version && this.emit<ArtifactVersionChange>("tc-version-change", { artifact: id, version: "" }, { cancelable: true })) this.version = "";
    if (focus) this.focusOption(id);
  }
  private focusOption(id: string) {
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-artp__option[data-id="${CSS.escape(id)}"]`)?.focus());
  }

  private pickVersion(a: Artifact, index: number, focus = false) {
    const v = a.versions[index];
    if (!v) return;
    const latest = index === a.versions.length - 1;
    const id = latest ? "" : v.id;
    if (index !== this.versionIndex(a) && this.emit<ArtifactVersionChange>("tc-version-change", { artifact: a.id, version: id }, { cancelable: true })) this.version = id;
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>('.ui-artp__chip[tabindex="0"]')?.focus());
  }

  private setView(view: ArtifactPanelView) {
    if (view === this.view) return;
    if (this.emit<ArtifactViewChange>("tc-view-change", { view }, { cancelable: true })) this.view = view;
  }

  private download(a: Artifact, v: ArtifactVersion) {
    if (!this.emit<ArtifactDownload>("tc-download", { artifact: a, version: v }, { cancelable: true })) return;
    saveArtifact(a, v);
    this.message = `Downloading ${a.name}`;
  }

  /* ---------- Keyboard ---------- */

  /** The list: a single-select listbox where selection follows focus; letters jump to a name */
  private onListKey(e: KeyboardEvent) {
    const list = this.artifacts;
    const at = list.indexOf(this.currentArtifact!);
    if (at < 0) return;
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(list.length - 1, at + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = list.length - 1;
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      // Type-ahead: letters typed within a moment add up
      const now = e.timeStamp;
      this.typed = now - this.typedAt < 700 ? this.typed + e.key.toLowerCase() : e.key.toLowerCase();
      this.typedAt = now;
      const order = [...list.slice(at + (this.typed.length === 1 ? 1 : 0)), ...list.slice(0, at + (this.typed.length === 1 ? 1 : 0))];
      const hit = order.find((a) => a.name.toLowerCase().startsWith(this.typed));
      if (hit) next = list.indexOf(hit);
    }
    if (next < 0) return;
    e.preventDefault();
    this.pick(list[next].id, true);
  }

  /** The versions: a radio group where arrows move the selection */
  private onChipKey(e: KeyboardEvent, a: Artifact) {
    const n = a.versions.length;
    const at = this.versionIndex(a);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (at + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (at - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    this.pickVersion(a, next, true);
  }

  /* ---------- Render ---------- */

  private option(a: Artifact, on: boolean) {
    const n = a.versions.length;
    const writing = a.status === "writing";
    const meta = writing ? "Writing" : [a.kind === "code" && a.language ? codeBlockLanguageLabel(a.language) : KIND_LABEL[a.kind], a.size, n > 1 ? `${n} versions` : ""].filter(Boolean).join(" · ");
    return html`<div
      class="ui-artp__option"
      role="option"
      data-id=${a.id}
      data-focus-key=${`o-${a.id}`}
      aria-selected=${on ? "true" : "false"}
      tabindex=${on ? "0" : "-1"}
      @click=${() => this.pick(a.id, true)}
    >
      <span class="ui-artp__kind" data-kind=${a.kind}>${glyph(KIND_ICON[a.kind])}</span>
      <span class="ui-artp__otext">
        <span class="ui-artp__oname" title=${a.name}>${a.name}</span>
        <span class="ui-artp__ometa">${writing ? html`<span class="ui-artp__dot" aria-hidden="true"></span>` : nothing}${meta}</span>
      </span>
      ${n > 1 && !writing ? html`<span class="ui-artp__badge" aria-hidden="true">${a.versions[n - 1].label ?? `v${n}`}</span>` : nothing}
    </div>`;
  }

  private versions(a: Artifact, at: number) {
    if (a.versions.length < 2) return nothing;
    return html`<div class="ui-artp__chips" role="radiogroup" aria-label="Versions">
      ${a.versions.map((v, i) => {
        const label = v.label ?? `v${i + 1}`;
        const on = i === at;
        const name = [label, v.time, v.note, i === a.versions.length - 1 ? "latest" : ""].filter(Boolean).join(", ");
        return html`<button
          type="button"
          class="ui-artp__chip"
          role="radio"
          aria-checked=${on ? "true" : "false"}
          aria-label=${name}
          title=${ifDefined(v.note)}
          tabindex=${on ? "0" : "-1"}
          @click=${() => this.pickVersion(a, i)}
          @keydown=${(e: KeyboardEvent) => this.onChipKey(e, a)}
        >${label}</button>`;
      })}
    </div>`;
  }

  private tableView(a: Artifact, cur: ArtifactTable, prev: ArtifactTable | null) {
    type R = { kind: "same" | "added" | "removed"; cells: Array<string | number> };
    let rows: R[] = cur.rows.map((cells) => ({ kind: "same", cells }));
    if (prev) {
      const byLine = new Map<string, Array<string | number>>();
      [...prev.rows, ...cur.rows].forEach((r) => byLine.set(csvRow(r), r));
      const diff = codeBlockDiff(prev.rows.map(csvRow).join("\n"), cur.rows.map(csvRow).join("\n"));
      rows = diff.map((d) => ({ kind: d.kind, cells: byLine.get(d.text) ?? [d.text] }));
    }
    const cols = cur.columns;
    return html`<div class="ui-artp__frame ui-artp__scroll" role="region" tabindex="0" aria-label=${prev ? `Changes to ${a.name}` : a.name}>
      <table class="ui-artp__table">
        <thead><tr>${prev ? html`<th class="ui-artp__sign" aria-hidden="true"></th>` : nothing}${cols.map((c) => html`<th scope="col">${c}</th>`)}</tr></thead>
        <tbody>${rows.map(
          (r) => html`<tr data-kind=${r.kind}>${prev ? html`<td class="ui-artp__sign" aria-hidden="true">${r.kind === "added" ? "+" : r.kind === "removed" ? "−" : ""}</td>` : nothing}${cols.map(
            (_, ci) => html`<td data-num=${ifDefined(typeof r.cells[ci] === "number" ? "" : undefined)}>${ci === 0 && r.kind !== "same" ? html`<span class="ui-artp__sr">${r.kind === "added" ? "Added row: " : "Removed row: "}</span>` : nothing}${r.cells[ci] ?? ""}</td>`,
          )}</tr>`,
        )}</tbody>
      </table>
    </div>`;
  }

  private preview(a: Artifact, at: number, diffOn: boolean, look: Look) {
    const v = a.versions[at];
    const prev = diffOn ? a.versions[at - 1] : undefined;
    const writing = a.status === "writing" && at === a.versions.length - 1;
    if (!v) return html`<p class="ui-artp__wait">${a.status === "writing" ? "Writing…" : "No versions yet"}</p>`;
    switch (a.kind) {
      case "code":
        return html`<div class="ui-artp__frame"><tc-code-block
          bare
          .look=${look}
          .code=${textOf(v.content)}
          .language=${a.language ?? ""}
          .current=${prev ? textOf(prev.content) : undefined}
          .view=${prev ? "diff" : "code"}
          .streaming=${writing}
          .maxHeight=${this.previewHeight}
          @tc-view-change=${(e: Event) => {
            // The panel owns the view; the block's own event mustn't reach the panel's listeners
            e.stopPropagation();
            e.preventDefault();
          }}
        ></tc-code-block></div>`;
      case "image":
        if (prev)
          return html`<div class="ui-artp__pair">${[prev, v].map(
            (x, i) => html`<figure class="ui-artp__figure"><div class="ui-artp__stage"><img src=${textOf(x.content)} alt=${`${a.alt ?? a.name} (${x.label ?? `v${at + i}`})`} /></div><figcaption>${i ? "After" : "Before"} · ${x.label ?? `v${at + i}`}</figcaption></figure>`,
          )}</div>`;
        return html`<figure class="ui-artp__figure"><div class="ui-artp__stage"><img src=${textOf(v.content)} alt=${a.alt ?? a.name} /></div></figure>`;
      case "table":
        return this.tableView(a, tableOf(v.content), prev ? tableOf(prev.content) : null);
      default:
        return html`<div class="ui-artp__frame ui-artp__scroll ui-artp__doc" role="region" tabindex="0" aria-label=${prev ? `Changes to ${a.name}` : a.name} aria-busy=${ifDefined(writing ? "true" : undefined)} ?data-writing=${writing} ?data-diff=${!!prev}>
          ${prev ? docDiff(textOf(prev.content), textOf(v.content)) : doc(textOf(v.content))}
        </div>`;
    }
  }

  private pane(a: Artifact, look: Look) {
    const at = this.versionIndex(a);
    const v = a.versions[at];
    const canDiff = at > 0;
    const diffOn = this.view === "diff" && canDiff;
    const label = v ? (v.label ?? `v${at + 1}`) : "";
    const meta = [a.versions.length > 1 ? label : "", v?.time, v?.note].filter(Boolean).join(" · ");
    const before = canDiff ? (a.versions[at - 1].label ?? `v${at}`) : "";
    return html`<div class="ui-artp__pane">
      <div class="ui-artp__bar">
        <div class="ui-artp__titles">
          <span class="ui-artp__pname">${a.name}</span>
          ${meta ? html`<span class="ui-artp__pmeta">${meta}</span>` : nothing}
        </div>
        <button type="button" class="ui-artp__btn" ?disabled=${!v} @click=${() => v && this.download(a, v)} aria-label=${`Download ${a.name}`} title=${`Download ${a.name}`}>${downloadIcon}<span class="ui-artp__btn-label" aria-hidden="true">Download</span></button>
      </div>
      ${a.versions.length > 1
        ? html`<div class="ui-artp__tools">
            ${this.versions(a, at)}
            <button type="button" class="ui-artp__btn ui-artp__btn--toggle" aria-pressed=${diffOn ? "true" : "false"} ?disabled=${!canDiff} title=${canDiff ? `Compare with ${before}` : "The first version has nothing to compare with"} @click=${() => this.setView(diffOn ? "preview" : "diff")}>${compareIcon}<span>Compare</span></button>
            ${diffOn ? html`<span class="ui-artp__since">since ${before}</span>` : nothing}
          </div>`
        : nothing}
      <div class="ui-artp__preview">${this.preview(a, at, diffOn, look)}</div>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const list = this.artifacts;
    const a = this.currentArtifact;
    const writing = list.filter((x) => x.status === "writing");
    const versionCount = list.reduce((n, x) => n + x.versions.length, 0);
    const caption = !list.length
      ? "Files, code and documents from this run show up here"
      : writing.length
        ? `Writing ${writing.map((x) => x.name).join(", ")}…`
        : `${list.length} ${list.length === 1 ? "file" : "files"} · ${versionCount} ${versionCount === 1 ? "version" : "versions"}`;
    const foot = html`<div class="ui-artp__foot"><span class="ui-artp__caption">${caption}</span></div>`;
    const head = cardHead({
      icon: filesIcon,
      title: this.heading,
      id: `${this.uid}-title`,
      aside: list.length ? html`<span class="ui-artp__count" aria-hidden="true">${list.length}</span>` : nothing,
    });
    // Standard: the header sits on the tray above the card; Clean: it's the card's first row
    const card = html`<div class="ui-artp__card" style=${styleMap({ "--tc-artifact-panel-preview-h": `${this.previewHeight}px` })}>
      ${look === "clean" ? head : nothing}
      ${list.length && a
        ? html`<div class="ui-artp__body">
            <div class="ui-artp__list" role="listbox" aria-label="Files" aria-orientation="vertical" tabindex="-1" @keydown=${(e: KeyboardEvent) => this.onListKey(e)}>
              ${repeat(list, (x) => x.id, (x) => this.option(x, x === a))}
            </div>
            ${this.pane(a, look)}
          </div>`
        : html`<div class="ui-artp__empty"><p class="ui-artp__empty-title">${this.emptyLabel}</p></div>`}
      ${look === "clean" ? foot : nothing}
    </div>`;
    return html`${look === "clean" ? nothing : head}${card}${look === "clean" ? nothing : foot}<span class="ui-artp__sr" role="status">${this.message}</span>`;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // The picked artifact stays in view in a list that scrolls
    if (changed.has("selected")) this.querySelector<HTMLElement>('.ui-artp__option[aria-selected="true"]')?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }

  static override css = /* css */ `
[data-ui="artp"] {
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  min-width: 0;
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="artp"] *, [data-ui="artp"] *::before, [data-ui="artp"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="artp"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-secondary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  letter-spacing: var(--tc-tracking-normal);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="artp"] {
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
}
.ui-artp__card { position: relative; min-width: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-artp__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-artp__card { border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* ----- Head: the count of files beside the title ----- */
.ui-artp__count { flex: none; min-width: 20px; height: 20px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); color: var(--tc-text-muted); font-size: var(--tc-pill-font-size); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); text-align: center; font-variant-numeric: tabular-nums; }
/* ----- Body: the list beside the preview; above it on narrow cards ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-artp__body { border-top: 0.5px solid var(--tc-border-default); }
.ui-artp__body { display: grid; grid-template-columns: minmax(176px, 32%) minmax(0, 1fr); min-width: 0; }
.ui-artp__list {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-0-5);
  min-width: 0;
  max-height: calc(var(--tc-artifact-panel-preview-h, 360px) + 104px);
  padding: var(--tc-space-2);
  overflow-y: auto;
  outline: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-artp__list { border-right: var(--tc-hairline) solid var(--tc-border-default); background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-artp__list { border-right: 0.5px solid var(--tc-border-default); }
.ui-artp__option {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  min-width: 0;
  min-height: 48px;
  padding: var(--tc-space-1-5) var(--tc-space-2);
  border-radius: var(--tc-radius-md);
  color: var(--tc-text-secondary);
  cursor: pointer;
  outline: none;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
  -webkit-tap-highlight-color: transparent;
}
.ui-artp__option:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-artp__option[aria-selected="true"] { background: var(--tc-surface-on-tray); box-shadow: var(--tc-shadow-raised); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-artp__option[aria-selected="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-artp__option:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-artp__kind { display: grid; flex: none; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-sm); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-artp__kind { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-artp__kind { width: 20px; color: var(--tc-icon-muted); }
.ui-artp__kind[data-kind="code"] { color: var(--tc-tone-violet-fg); }
.ui-artp__kind[data-kind="image"] { color: var(--tc-tone-pink-fg); }
.ui-artp__kind[data-kind="table"] { color: var(--tc-status-success-fg); }
.ui-artp__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-artp__glyph { width: 16px; height: 16px; stroke-width: 1.1; }
.ui-artp__otext { display: grid; flex: 1; min-width: 0; }
.ui-artp__oname { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-overflow: ellipsis; white-space: nowrap; }
.ui-artp__ometa { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); text-overflow: ellipsis; white-space: nowrap; }
.ui-artp__dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-accent); animation: ui-artp-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
[data-ui="artp"][data-offscreen] .ui-artp__dot { animation-play-state: paused; }
.ui-artp__badge { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); font-variant-numeric: tabular-nums; }
/* ----- The preview pane ----- */
.ui-artp__pane { display: flex; flex-direction: column; min-width: 0; }
.ui-artp__bar { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-2) var(--tc-space-4); }
.ui-artp__titles { display: grid; flex: 1; min-width: 0; }
.ui-artp__pname { overflow: hidden; color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); text-overflow: ellipsis; white-space: nowrap; }
.ui-artp__pmeta { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); text-overflow: ellipsis; white-space: nowrap; }
.ui-artp__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: 0 var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-4); }
.ui-artp__since { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; }
/* Versions: a segmented row of chips */
.ui-artp__chips { display: inline-flex; flex-wrap: wrap; gap: var(--tc-seg-pad); padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-artp__chip,
.ui-artp__btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5);
  margin: 0;
  border: 0;
  font: inherit;
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
  -webkit-tap-highlight-color: transparent;
}
.ui-artp__chip {
  min-width: 36px;
  height: 24px;
  padding: 0 var(--tc-space-2);
  border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad));
  background: transparent;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
}
.ui-artp__chip:hover { color: var(--tc-text-primary); }
.ui-artp__chip[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-artp__btn {
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm) 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-sm);
  background: transparent;
  color: var(--tc-action-ghost-fg);
  font-size: var(--tc-control-font-size);
  line-height: var(--tc-line-height-normal);
}
.ui-artp__btn:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-artp__btn:active:not(:disabled) { transform: scale(0.97); }
.ui-artp__btn:disabled { cursor: default; opacity: 0.4; }
.ui-artp__bar > .ui-artp__btn { flex: none; background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-artp__bar > .ui-artp__btn:hover:not(:disabled) { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-artp__btn .ui-artp__glyph { color: var(--tc-icon-muted); }
.ui-artp__btn--toggle[aria-pressed="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-artp__chip:focus-visible,
.ui-artp__btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* ----- Previews ----- */
.ui-artp__preview { display: grid; flex: 1; min-width: 0; padding: 0 var(--tc-space-3) var(--tc-space-3) var(--tc-space-4); }
.ui-artp__frame { min-width: 0; overflow: hidden; border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-artp__frame { box-shadow: inset 0 0 0 0.5px var(--tc-border-strong); }
.ui-artp__scroll { max-height: var(--tc-artifact-panel-preview-h, 360px); overflow: auto; overscroll-behavior: contain; }
.ui-artp__scroll:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
/* Documents */
.ui-artp__doc { padding: var(--tc-space-4) var(--tc-space-4-5); color: var(--tc-text-secondary); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); }
.ui-artp__doc > :first-child { margin-top: 0; }
.ui-artp__doc > :last-child { margin-bottom: 0; }
.ui-artp__h { margin: var(--tc-space-4) 0 var(--tc-space-1-5); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-semibold); }
.ui-artp__h[data-level="1"] { font-size: var(--tc-font-size-xl); line-height: var(--tc-line-height-loose); }
.ui-artp__h[data-level="2"] { font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-relaxed); }
.ui-artp__h[data-level="3"] { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-normal); }
.ui-artp__p { margin: 0 0 var(--tc-space-2-5); white-space: pre-line; overflow-wrap: anywhere; }
.ui-artp__ul { margin: 0 0 var(--tc-space-2-5); padding: 0; list-style: none; }
.ui-artp__li { position: relative; margin: 0; padding-left: var(--tc-space-4); overflow-wrap: anywhere; }
.ui-artp__li::before { content: ""; position: absolute; top: calc(var(--tc-line-height-relaxed) / 2 - 2px); left: var(--tc-space-1); width: 4px; height: 4px; border-radius: 50%; background: var(--tc-text-muted); }
.ui-artp__li + .ui-artp__li { margin-top: var(--tc-space-1); }
p.ui-artp__li + .ui-artp__p, p.ui-artp__li + .ui-artp__h { margin-top: var(--tc-space-2-5); }
.ui-artp__doc[data-diff] .ui-artp__p[data-kind] { margin-bottom: var(--tc-space-1-5); }
.ui-artp__doc[data-writing] > :last-child::after { content: ""; display: inline-block; width: 2px; height: 1.05em; margin-left: var(--tc-space-0-5); vertical-align: text-bottom; background: var(--tc-accent); animation: ui-artp-blink var(--tc-duration-shimmer) steps(2, jump-none) infinite; }
[data-ui="artp"][data-offscreen] .ui-artp__doc::after { animation-play-state: paused; }
/* Word diff: removed words struck on a red tint, new ones underlined on a green one (inline-diff's marks) */
.ui-artp__del, .ui-artp__ins { padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-xs); -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.ui-artp__del { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); text-decoration: line-through; text-decoration-thickness: 1px; }
.ui-artp__ins { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); text-decoration: underline; text-decoration-color: var(--tc-status-success-solid); text-decoration-thickness: 1px; text-underline-offset: 3px; }
.ui-artp__del + .ui-artp__ins { margin-left: var(--tc-space-1); }
/* Tables */
.ui-artp__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); font-variant-numeric: tabular-nums; }
.ui-artp__table th { position: sticky; top: 0; padding: var(--tc-space-2) var(--tc-space-3); background: var(--tc-surface-raised); box-shadow: inset 0 -1px 0 var(--tc-border-default); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); text-align: left; white-space: nowrap; }
.ui-artp__table td { padding: var(--tc-space-2) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-border-subtle); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-artp__table tbody tr:first-child td { border-top: 0; }
.ui-artp__table td[data-num] { text-align: right; }
.ui-artp__table td:first-child:not(.ui-artp__sign), .ui-artp__sign + td { color: var(--tc-text-primary); }
.ui-artp__table tr[data-kind="added"] td { background: var(--tc-status-success-bg); }
.ui-artp__table tr[data-kind="removed"] td { background: var(--tc-status-danger-bg); text-decoration: line-through; text-decoration-color: var(--tc-status-danger-fg); }
.ui-artp__table .ui-artp__sign { width: 2ch; padding-right: 0; text-align: center; }
.ui-artp__table tr[data-kind="added"] .ui-artp__sign { color: var(--tc-status-success-fg); }
.ui-artp__table tr[data-kind="removed"] .ui-artp__sign { color: var(--tc-status-danger-fg); text-decoration: none; }
/* Images: on a sunken stage, before and after side by side */
.ui-artp__figure { display: grid; gap: var(--tc-space-1-5); min-width: 0; margin: 0; }
.ui-artp__stage { display: grid; place-items: center; min-height: 160px; max-height: var(--tc-artifact-panel-preview-h, 360px); padding: var(--tc-space-4); overflow: hidden; border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); box-shadow: var(--tc-shadow-sunken); }
.ui-artp__stage img { display: block; max-width: 100%; max-height: calc(var(--tc-artifact-panel-preview-h, 360px) - 32px); border-radius: var(--tc-radius-xs); object-fit: contain; }
.ui-artp__figure figcaption { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-artp__pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--tc-space-3); }
.ui-artp__wait { margin: 0; padding: var(--tc-space-6) 0; color: var(--tc-text-muted); text-align: center; }
/* ----- Empty ----- */
.ui-artp__empty { display: grid; place-items: center; min-height: 160px; padding: var(--tc-space-6) var(--tc-space-4); }
.ui-artp__empty-title { margin: 0; color: var(--tc-text-muted); }
/* ----- Foot: the tray line (Standard), the card's last row (Clean) ----- */
.ui-artp__foot { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-artp__foot { min-height: 34px; padding: var(--tc-space-1) var(--tc-space-2-5) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-artp__foot { min-height: 40px; padding: 0 var(--tc-space-4); border-top: 0.5px solid var(--tc-border-default); }
.ui-artp__caption { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-artp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-artp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes ui-artp-blink { from { opacity: 1; } to { opacity: 0; } }
/* Narrow cards: the list sits above the preview and scrolls */
@container (max-width: 600px) {
  .ui-artp__body { grid-template-columns: minmax(0, 1fr); }
  .ui-artp__list { max-height: 168px; border-right: 0 !important; border-bottom: var(--tc-hairline) solid var(--tc-border-default); }
  :where([data-look="clean"], [data-look="clean"] *).ui-artp__list { border-bottom-width: 0.5px; }
  .ui-artp__option { min-height: 44px; }
  .ui-artp__bar, .ui-artp__tools, .ui-artp__preview { padding-left: var(--tc-space-3); }
  .ui-artp__btn-label { display: none; }
  .ui-artp__bar > .ui-artp__btn { width: var(--tc-control-h-sm); padding: 0; }
}
@media (hover: none) and (pointer: coarse) {
  .ui-artp__btn { height: 34px; }
  .ui-artp__chip { height: 30px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="artp"] *, [data-ui="artp"] *::before, [data-ui="artp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-artifact-panel")) customElements.define("tc-artifact-panel", TcArtifactPanel);

declare global {
  interface HTMLElementTagNameMap {
    "tc-artifact-panel": TcArtifactPanel;
  }
}

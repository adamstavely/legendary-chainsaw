import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-file-import> – drop a spreadsheet and see what was read before anything is imported. A drop area (or a file
 * picker) takes a CSV, TSV or Excel file. CSV and TSV are read here: an RFC 4180 parser (quoted fields, doubled quotes,
 * line breaks inside quotes, CRLF) with the delimiter sniffed from the first lines. Excel is the page's to read, through
 * `parse(file, signal)`, which returns the rows as arrays of strings. Once read, the card says what it found – the file,
 * its size, rows and columns, the delimiter and how the text was decoded – shows the first rows as a table with each
 * column's type guessed in words (Text, Number, Date, Email, Empty), lists problems in words (rows with a different
 * number of cells, empty columns, a header named twice) and offers Continue.
 *
 *   <tc-file-import></tc-file-import>   el.file = new File([csv], "vendors.csv")   el.addEventListener("tc-parsed", …)
 *
 * `file` is the value: choosing or dropping one fires a cancelable tc-file-change ({ file }), and setting it reads it.
 * "First row is headers" is `headerRow`, with tc-header-row-change. Standard: the header on a gray tray above a white
 * card. Clean: one white card, the header its first row.
 */

/** A spreadsheet with a grid: what's imported (Lucide sheet, ISC) */
const sheetIcon = svg`<rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line x1="3" x2="21" y1="9" y2="9"></line><line x1="3" x2="21" y1="15" y2="15"></line><line x1="9" x2="9" y1="9" y2="21"></line><line x1="15" x2="15" y1="9" y2="21"></line>`;

export type FileImportColumnType = "text" | "number" | "date" | "email" | "empty";

export type FileImportColumn = {
  /** From 0, in the file's order */
  index: number;
  /** The header's text, or "Column 3" when the first row isn't headers or the header is blank */
  name: string;
  /** What the values look like, guessed from every row */
  type: FileImportColumnType;
};

export type FileImportProblemKind = "ragged" | "empty-column" | "duplicate-header" | "no-rows" | "encoding";

export type FileImportProblem = {
  kind: FileImportProblemKind;
  /** The problem in words, e.g. "3 rows have a different number of cells than the header: rows 4, 9 and 12" */
  message: string;
  /** Rows concerned, numbered as in the file (1 is the first line) */
  rows?: number[];
  /** Columns concerned, by index */
  columns?: number[];
};

export type FileImportDelimiter = "," | "\t" | ";" | "|";

/** Detail of tc-file-change: the file chosen or dropped, or null when it was removed */
export type FileImportFileChange = { file: File | null };
/** Detail of tc-header-row-change */
export type FileImportHeaderRowChange = { headerRow: boolean };
/** Detail of tc-parsed and tc-continue: the columns, the data rows (without the header row) and the problems */
export type FileImportResult = { columns: FileImportColumn[]; rows: string[][]; problems: FileImportProblem[]; delimiter: FileImportDelimiter | null };

/** The page's own reader for files the element can't read itself (Excel): the rows as arrays of strings */
export type FileImportParser = (file: File, signal: AbortSignal) => Promise<string[][]>;

export const defaultFileImportLabels = {
  drop: "Drop a spreadsheet here or",
  browse: "browse",
  choose: "Choose a file",
  release: "Release to read the file",
  hint: "CSV, TSV or Excel",
  reading: "Reading",
  another: "Choose another file",
  headerRow: "First row is headers",
  continue: "Continue",
  noRows: "No rows to import",
  excel: "Excel workbooks can't be read here – save the sheet as CSV and choose it again.",
  unreadable: "This file couldn't be read.",
};
export type FileImportLabels = typeof defaultFileImportLabels;

/* ---------- Reading ---------- */

/** Splits delimited text into rows of fields (RFC 4180): quoted fields, "" inside quotes, line breaks in quotes, CRLF */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
      } else field += c;
      i++;
      continue;
    }
    if (c === '"' && field === "") quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else field += c;
    i++;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  // A blank line is a row of one empty field: not a row
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

const CANDIDATES: FileImportDelimiter[] = [",", "\t", ";", "|"];

/** The delimiter that splits the first lines into the most columns, most consistently; comma when nothing does */
export function sniffDelimiter(text: string): FileImportDelimiter {
  const sample = text.slice(0, 8000);
  let best: FileImportDelimiter = ",";
  let bestScore = 0;
  for (const d of CANDIDATES) {
    const rows = parseDelimited(sample, d).slice(0, 20);
    if (!rows.length) continue;
    const freq = new Map<number, number>();
    for (const r of rows) freq.set(r.length, (freq.get(r.length) ?? 0) + 1);
    const [cols, times] = [...freq].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
    if (cols < 2) continue;
    const score = (times / rows.length) * cols;
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NUMBER = /^[-+]?[$€£¥]?\s?(?:\d{1,3}(?:[,\s]\d{3})+|\d+)(?:[.,]\d+)?%?$/;
const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december";
const DATES = [
  /^\d{4}-\d{1,2}-\d{1,2}(?:[T ]\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/,
  /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/,
  new RegExp(`^\\d{1,2}\\s+(?:${MONTHS})\\.?,?\\s+\\d{4}$`, "i"),
  new RegExp(`^(?:${MONTHS})\\.?\\s+\\d{1,2},?\\s+\\d{4}$`, "i"),
];

/** What a column's values look like: empty when all are blank, else the one type every filled value fits, else text */
export function guessColumnType(values: string[]): FileImportColumnType {
  const filled = values.map((v) => v.trim()).filter(Boolean);
  if (!filled.length) return "empty";
  if (filled.every((v) => EMAIL.test(v))) return "email";
  if (filled.every((v) => NUMBER.test(v))) return "number";
  if (filled.every((v) => DATES.some((re) => re.test(v)))) return "date";
  return "text";
}

const TYPE_WORDS: Record<FileImportColumnType, string> = { text: "Text", number: "Number", date: "Date", email: "Email", empty: "Empty" };
const DELIMITER_WORDS: Record<FileImportDelimiter, string> = { ",": "Comma-separated", "\t": "Tab-separated", ";": "Semicolon-separated", "|": "Pipe-separated" };

/** "rows 4, 9 and 12", "row 4", "rows 4, 9, 12 and 5 more" */
function listOf(noun: string, items: (string | number)[], max = 5): string {
  const shown = items.slice(0, max).map(String);
  const more = items.length - shown.length;
  const head = `${noun}${items.length === 1 ? "" : "s"} `;
  if (more > 0) return `${head}${shown.join(", ")} and ${more} more`;
  if (shown.length === 1) return head + shown[0];
  return `${head}${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}`;
}

/** Reads the grid into columns, data rows and problems, given whether its first row is the header */
export function readGrid(grid: string[][], headerRow: boolean): Omit<FileImportResult, "delimiter"> {
  const head = headerRow ? (grid[0] ?? []) : [];
  const data = headerRow ? grid.slice(1) : grid;
  const width = Math.max(head.length, ...data.map((r) => r.length), 0);
  const columns: FileImportColumn[] = Array.from({ length: width }, (_, index) => ({
    index,
    name: head[index]?.trim() || `Column ${index + 1}`,
    type: guessColumnType(data.map((r) => r[index] ?? "")),
  }));
  const problems: FileImportProblem[] = [];
  if (!data.length) problems.push({ kind: "no-rows", message: headerRow && grid.length ? "The file has a header row but no rows under it" : "The file has no rows" });
  // Rows that don't match the expected width: the header's, else the most common one
  const freq = new Map<number, number>();
  for (const r of data) freq.set(r.length, (freq.get(r.length) ?? 0) + 1);
  const expected = headerRow && head.length ? head.length : ([...freq].sort((a, b) => b[1] - a[1])[0]?.[0] ?? width);
  const offset = headerRow ? 2 : 1;
  const ragged = data.map((r, i) => (r.length !== expected ? i + offset : -1)).filter((i) => i > 0);
  if (ragged.length) {
    const against = headerRow && head.length ? "the header" : "most rows";
    const count = ragged.length === 1 ? "1 row has" : `${ragged.length} rows have`;
    problems.push({ kind: "ragged", message: `${count} a different number of cells than ${against}: ${listOf("row", ragged)}`, rows: ragged });
  }
  const empty = columns.filter((c) => c.type === "empty" && data.length).map((c) => c.index);
  if (empty.length) {
    const names = empty.map((i) => `“${columns[i].name}”`);
    problems.push({ kind: "empty-column", message: `${empty.length === 1 ? `${names[0]} is` : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} are`} empty`, columns: empty });
  }
  if (headerRow) {
    const seen = new Map<string, number[]>();
    head.forEach((h, i) => {
      const k = h.trim().toLowerCase();
      if (k) seen.set(k, [...(seen.get(k) ?? []), i]);
    });
    for (const idx of seen.values()) {
      if (idx.length < 2) continue;
      problems.push({ kind: "duplicate-header", message: `“${head[idx[0]].trim()}” is in the header row ${idx.length === 2 ? "twice" : `${idx.length} times`}`, columns: idx });
    }
  }
  return { columns, rows: data, problems };
}

/** "18.4 KB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[u]}`;
}

const isExcel = (f: File) => /\.(xlsx|xlsm|xls)$/i.test(f.name) || /spreadsheetml|ms-excel/.test(f.type);
const isTsv = (f: File) => /\.tsv$/i.test(f.name) || f.type === "text/tab-separated-values";

/* ---------- Icons: 24px line glyphs (Lucide, ISC) – thinner in Clean ---------- */

const glyph = (d: string) => html`<svg viewBox="0 0 24 24" class="ui-fim__glyph" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const icons = {
  upload: "M12 3v12M7 8l5-5 5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
  file: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v4a2 2 0 0 0 2 2h4M8 13h2M14 13h2M8 17h2M14 17h2",
  alert: "M12 8v5M12 16.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  check: "M5.5 12.5l4 4L18.5 8",
};

let instances = 0;

/**
 * Drop a CSV, TSV or Excel file and see what was read: rows and columns found, the delimiter, the header row, a
 * preview with each column's type in words, problems in words, and Continue.
 * @tag tc-file-import
 * @fires tc-file-change - A file was chosen or dropped, or removed ({ file }: FileImportFileChange); cancelable – prevented, `file` stays as it was
 * @fires tc-header-row-change - "First row is headers" was switched ({ headerRow }: FileImportHeaderRowChange); cancelable – prevented, `headerRow` stays as it was
 * @fires tc-parsed - The file was read ({ columns, rows, problems, delimiter }: FileImportResult)
 * @fires tc-continue - Continue was pressed with rows to import ({ columns, rows, problems, delimiter }: FileImportResult)
 */
export class TcFileImport extends TcElement {
  static override ui = "fim";

  /** The heading */
  @property() accessor heading = "Import a spreadsheet";
  /** A quiet line under the heading – what the rows will become */
  @property() accessor description = "";
  /** The file being read – the value. Choosing or dropping one changes it unless a tc-file-change listener calls preventDefault() */
  @property({ attribute: false }) accessor file: File | null = null;
  /** Whether the first row holds the column names. Changed by its checkbox unless a tc-header-row-change listener calls preventDefault() */
  @property({ type: Boolean, attribute: "header-row" }) accessor headerRow = true;
  /** The file types the picker offers, as for an input's accept */
  @property() accessor accept = ".csv,.tsv,.txt,.xlsx,.xls,text/csv,text/tab-separated-values";
  /** The page's reader for files the element can't read itself (Excel): resolves to the rows as arrays of strings */
  @property({ attribute: false }) accessor parse: FileImportParser | undefined = undefined;
  /** How many rows the preview shows */
  @property({ type: Number, attribute: "preview-rows" }) accessor previewRows = 10;
  /** Words the page can rename, merged over defaultFileImportLabels */
  @property({ attribute: false }) accessor labels: Partial<FileImportLabels> = {};

  /** @internal Idle, reading, read or failed */
  @state() accessor phase: "idle" | "reading" | "ready" | "error" = "idle";
  /** @internal The file read as a grid of strings */
  @state() accessor grid: string[][] = [];
  /** @internal The delimiter used, null for a page-read file */
  @state() accessor delimiter: FileImportDelimiter | null = null;
  /** @internal How the text was decoded, in words */
  @state() accessor encoding = "";
  /** @internal Why reading failed */
  @state() accessor failure = "";
  /** @internal Files dragged over the drop area */
  @state() accessor dragging = false;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-fim${++instances}`;
  private depth = 0;
  private reading: AbortController | null = null;
  private readFile: File | null = null;
  private result: Omit<FileImportResult, "delimiter"> | null = null;
  private resultKey = "";

  private get w(): FileImportLabels {
    return { ...defaultFileImportLabels, ...this.labels };
  }

  /** What was read: the columns, the data rows and the problems – null until a file is read */
  get parsed(): FileImportResult | null {
    const r = this.read();
    return r ? { ...r, delimiter: this.delimiter } : null;
  }

  private read() {
    if (this.phase !== "ready") return null;
    const key = `${this.headerRow}`;
    if (!this.result || this.resultKey !== key) {
      this.result = readGrid(this.grid, this.headerRow);
      if (this.encoding.startsWith("Some")) this.result.problems.push({ kind: "encoding", message: "Some characters couldn't be decoded – save the file as UTF-8 and choose it again" });
      this.resultKey = key;
    }
    return this.result;
  }

  override connectedCallback() {
    super.connectedCallback();
    // Moved while reading: the read was abandoned on the way out, so start it again
    if (this.hasUpdated && this.file && this.file !== this.readFile) void this.load(this.file);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.reading?.abort();
    this.reading = null;
    this.readFile = null;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("headerRow") || changed.has("grid")) this.result = null;
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has("file") && this.file !== this.readFile) void this.load(this.file);
  }

  /* ---------- Reading the file ---------- */

  private async load(file: File | null) {
    this.reading?.abort();
    this.readFile = file;
    this.result = null;
    if (!file) {
      this.reading = null;
      this.phase = "idle";
      this.grid = [];
      return;
    }
    const ctrl = new AbortController();
    this.reading = ctrl;
    this.phase = "reading";
    this.said = `${this.w.reading} ${file.name}`;
    try {
      let grid: string[][];
      if (isExcel(file)) {
        if (!this.parse) throw new Error(this.w.excel);
        grid = (await this.parse(file, ctrl.signal)).map((r) => r.map((v) => (v == null ? "" : String(v))));
        if (ctrl.signal.aborted) return;
        this.delimiter = null;
        this.encoding = "Read by the page";
      } else {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (ctrl.signal.aborted) return;
        const bom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
        const text = new TextDecoder("utf-8").decode(bom ? bytes.subarray(3) : bytes);
        this.encoding = text.includes("�") ? "Some characters couldn't be decoded" : bom ? "UTF-8 with a byte-order mark" : "UTF-8";
        const delimiter = isTsv(file) ? "\t" : sniffDelimiter(text);
        this.delimiter = delimiter;
        grid = parseDelimited(text, delimiter);
      }
      this.grid = grid;
      this.phase = "ready";
      this.failure = "";
      const r = this.parsed!;
      const n = r.rows.length;
      this.said = `${file.name} read: ${n === 1 ? "1 row" : `${n} rows`}, ${r.columns.length === 1 ? "1 column" : `${r.columns.length} columns`}${r.problems.length ? `, ${r.problems.length === 1 ? "1 problem" : `${r.problems.length} problems`}` : ""}`;
      this.emit<FileImportResult>("tc-parsed", r);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      this.phase = "error";
      this.grid = [];
      this.failure = err instanceof Error && err.message ? err.message : this.w.unreadable;
      this.said = this.failure;
    } finally {
      if (this.reading === ctrl) this.reading = null;
    }
  }

  private choose(file: File | null) {
    if (file === this.file) return;
    if (!this.emit<FileImportFileChange>("tc-file-change", { file }, { cancelable: true })) return;
    this.file = file;
    if (!file) void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-fim__drop")?.focus());
  }

  private openPicker = () => this.querySelector<HTMLInputElement>(`#${this.uid}-input`)?.click();

  private onPick = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    input.value = "";
    if (f) this.choose(f);
  };

  private hasFiles(e: DragEvent) {
    return !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");
  }
  private onDragEnter = (e: DragEvent) => {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    this.depth++;
    this.dragging = true;
  };
  private onDragOver = (e: DragEvent) => {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
  };
  private onDragLeave = () => {
    this.depth = Math.max(0, this.depth - 1);
    if (!this.depth) this.dragging = false;
  };
  private onDrop = (e: DragEvent) => {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    this.depth = 0;
    this.dragging = false;
    const f = e.dataTransfer!.files[0];
    if (f) this.choose(f);
  };

  private setHeaderRow(on: boolean) {
    if (on === this.headerRow) return;
    if (!this.emit<FileImportHeaderRowChange>("tc-header-row-change", { headerRow: on }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.headerRow = on;
    const r = this.parsed;
    if (r) {
      this.said = `${r.rows.length === 1 ? "1 row" : `${r.rows.length} rows`} with ${on ? "the first row as headers" : "no header row"}`;
      this.emit<FileImportResult>("tc-parsed", r);
    }
  }

  private continue() {
    const r = this.parsed;
    if (!r?.rows.length) {
      this.said = this.w.noRows;
      return;
    }
    this.emit<FileImportResult>("tc-continue", r);
  }

  /* ---------- Rendering ---------- */

  private renderDrop(): TemplateResult {
    const w = this.w;
    return html`<input id=${`${this.uid}-input`} class="ui-fim__input" type="file" tabindex="-1" aria-label=${this.w.choose} accept=${this.accept} @change=${this.onPick} /><button
        type="button"
        class="ui-fim__drop"
        ?data-dragging=${this.dragging}
        aria-describedby=${`${this.uid}-hint`}
        @click=${this.openPicker}
        @dragenter=${this.onDragEnter}
        @dragover=${this.onDragOver}
        @dragleave=${this.onDragLeave}
        @drop=${this.onDrop}
      >
        <span class="ui-fim__drop-mark" aria-hidden="true">${glyph(icons.upload)}</span>
        <span class="ui-fim__drop-title">${this.dragging ? w.release : html`${w.drop} <span class="ui-fim__browse">${w.browse}</span>`}</span>
        <span class="ui-fim__hint" id=${`${this.uid}-hint`}>${w.hint}</span>
      </button>`;
  }

  private renderFile(file: File, meta: unknown): TemplateResult {
    return html`<div class="ui-fim__file">
      <span class="ui-fim__file-mark" aria-hidden="true">${glyph(icons.file)}</span>
      <span class="ui-fim__file-text">
        <span class="ui-fim__name" title=${file.name}>${file.name}</span>
        <span class="ui-fim__meta">${meta}</span>
      </span>
      <input id=${`${this.uid}-input`} class="ui-fim__input" type="file" tabindex="-1" aria-label=${this.w.choose} accept=${this.accept} @change=${this.onPick} />
      <button type="button" class="tc-btn-sm ui-fim__another" @click=${this.openPicker}>${this.w.another}</button>
    </div>`;
  }

  private renderReady(file: File, r: FileImportResult): TemplateResult {
    const w = this.w;
    const n = r.rows.length;
    const facts = [formatFileSize(file.size), n === 1 ? "1 row" : `${n} rows`, r.columns.length === 1 ? "1 column" : `${r.columns.length} columns`, r.delimiter ? DELIMITER_WORDS[r.delimiter] : null, this.encoding].filter(Boolean);
    const shown = r.rows.slice(0, Math.max(0, this.previewRows));
    const ragged = new Set(r.problems.find((p) => p.kind === "ragged")?.rows ?? []);
    const offset = this.headerRow ? 2 : 1;
    return html`${this.renderFile(file, facts.join(" · "))}
      <label class="ui-fim__check"><input type="checkbox" .checked=${live(this.headerRow)} @change=${(e: Event) => this.setHeaderRow((e.target as HTMLInputElement).checked)} />${w.headerRow}</label>
      ${r.problems.length
        ? html`<ul class="ui-fim__problems" aria-label=${r.problems.length === 1 ? "1 problem" : `${r.problems.length} problems`}>
            ${r.problems.map((p) => html`<li class="ui-fim__problem" data-kind=${p.kind}>${glyph(icons.alert)}<span>${p.message}</span></li>`)}
          </ul>`
        : html`<p class="ui-fim__ok">${glyph(icons.check)}<span>No problems found</span></p>`}
      ${r.columns.length
        ? html`<div class="ui-fim__scroll" tabindex="0" role="region" aria-labelledby=${`${this.uid}-caption`}>
            <table class="ui-fim__table">
              <caption class="ui-fim__caption" id=${`${this.uid}-caption`}>${n > shown.length ? `First ${shown.length} of ${n} rows` : n === 1 ? "The 1 row" : `All ${n} rows`}</caption>
              <thead>
                <tr>
                  <th scope="col" class="ui-fim__rownum"><span class="tc-sr-only">Row</span></th>
                  ${r.columns.map(
                    (c) => html`<th scope="col" data-type=${c.type}>
                      <span class="ui-fim__col">${c.name}</span><span class="ui-fim__type"><span class="tc-sr-only">, </span>${TYPE_WORDS[c.type]}</span>
                    </th>`,
                  )}
                </tr>
              </thead>
              <tbody>
                ${shown.map((row, i) => {
                  const line = i + offset;
                  return html`<tr ?data-ragged=${ragged.has(line)}>
                    <th scope="row" class="ui-fim__rownum">${line}${ragged.has(line) ? html`<span class="tc-sr-only">, different number of cells</span>` : nothing}</th>
                    ${r.columns.map((c) => {
                      const v = row[c.index];
                      return html`<td ?data-missing=${v === undefined}>${v === undefined ? html`<span class="tc-sr-only">no cell</span>` : v}</td>`;
                    })}
                  </tr>`;
                })}
              </tbody>
            </table>
          </div>`
        : nothing}`;
  }

  private renderBody(): TemplateResult {
    const file = this.file;
    if (!file || this.phase === "idle") return this.renderDrop();
    if (this.phase === "reading") return html`<div class="ui-fim__busy" aria-busy="true">${this.renderFile(file, html`${this.w.reading}…`)}<span class="ui-fim__bar" aria-hidden="true"></span></div>`;
    if (this.phase === "error")
      return html`${this.renderFile(file, formatFileSize(file.size))}
        <p class="ui-fim__error" role="alert">${glyph(icons.alert)}<span>${this.failure}</span></p>`;
    return this.renderReady(file, this.parsed!);
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const r = this.parsed;
    const head = cardHead({ icon: sheetIcon, title: this.heading, subtitle: this.description || undefined, id: `${this.uid}-title` });
    const body = html`<div class="ui-fim__body">${this.renderBody()}</div>`;
    const rows = r?.rows.length ?? 0;
    const foot = r
      ? html`<div class="ui-fim__foot">
          <span class="ui-fim__summary">${rows ? `${rows === 1 ? "1 row" : `${rows} rows`} ready to map` : this.w.noRows}</span>
          <button type="button" class="ui-fim__continue" aria-disabled=${ifDefined(rows ? undefined : "true")} aria-describedby=${ifDefined(rows ? undefined : `${this.uid}-why`)} @click=${this.continue}>${this.w.continue}</button>
          ${rows ? nothing : html`<span class="tc-sr-only" id=${`${this.uid}-why`}>${this.w.noRows}</span>`}
        </div>`
      : nothing;
    return html`
      ${clean ? html`<div class="ui-fim__card">${head}${body}${foot}</div>` : html`${head}<div class="ui-fim__card">${body}</div>${foot}`}
      <span class="tc-sr-only" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; the summary and Continue sit on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fim"] {
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 760px;
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
/* Clean: one white card, its last row the summary */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fim"] {
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 740px;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="fim"] *, [data-ui="fim"] *::before, [data-ui="fim"] *::after { box-sizing: border-box; }
:where([data-ui="fim"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="fim"]) svg { display: block; flex: none; }
[data-ui="fim"] button:focus-visible, .ui-fim__scroll:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-fim__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-fim__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-fim__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-fim__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-fim__card > .tc-head + .ui-fim__body { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-fim__body { display: grid; gap: var(--tc-space-3); min-width: 0; padding: var(--tc-space-4); }
.ui-fim__input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
/* The drop area: a well with a dashed edge */
.ui-fim__drop { display: grid; justify-items: center; gap: var(--tc-space-1-5); width: 100%; padding: var(--tc-space-8) var(--tc-space-4); border-radius: var(--tc-radius-lg); border: 1px dashed var(--tc-border-strong); background: var(--tc-fill-subtle); text-align: center; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), border-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fim__drop:hover { background: var(--tc-fill-default); }
.ui-fim__drop[data-dragging] { border-color: var(--tc-accent); background: var(--tc-accent-subtle); }
.ui-fim__drop-mark { display: grid; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-control); color: var(--tc-icon-muted); }
.ui-fim__drop-title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-fim__browse { color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: 2px; }
.ui-fim__hint { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* The file read: its name and what was found */
.ui-fim__file { display: flex; align-items: center; gap: var(--tc-space-3); min-width: 0; }
.ui-fim__file-mark { display: grid; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-radius-md); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-fim__file-text { display: grid; flex: 1; min-width: 0; }
.ui-fim__name { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-fim__meta { font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-fim__busy { display: grid; gap: var(--tc-space-2); }
.ui-fim__bar { position: relative; height: 3px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-fim__bar::after { content: ""; position: absolute; inset: 0; width: 40%; border-radius: inherit; background: var(--tc-accent); animation: ui-fim-slide var(--tc-duration-shimmer) linear infinite; }
@keyframes ui-fim-slide { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
.ui-fim__check { display: inline-flex; align-items: center; gap: var(--tc-space-2); justify-self: start; min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); cursor: pointer; }
.ui-fim__check input { width: 16px; height: 16px; margin: 0; accent-color: var(--tc-accent); }
/* Problems: a warning mark and the problem in words */
.ui-fim__problems { display: grid; gap: var(--tc-space-1); margin: 0; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); list-style: none; }
.ui-fim__problem { display: flex; align-items: start; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-status-warning-fg); }
.ui-fim__problem .ui-fim__glyph, .ui-fim__ok .ui-fim__glyph, .ui-fim__error .ui-fim__glyph { width: 14px; height: 14px; margin-top: var(--tc-space-0-5); }
.ui-fim__ok { display: flex; align-items: center; gap: var(--tc-space-2); margin: 0; font-size: var(--tc-font-size-sm); color: var(--tc-status-success-fg); }
.ui-fim__error { display: flex; align-items: start; gap: var(--tc-space-2); margin: 0; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-danger-bg); font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
/* The preview: a scrolling table */
.ui-fim__scroll { max-width: 100%; max-height: var(--tc-file-import-preview-h, 320px); overflow: auto; border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 1px var(--tc-border-default); overscroll-behavior: contain; }
.ui-fim__table { width: max-content; min-width: 100%; border-collapse: separate; border-spacing: 0; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-fim__caption { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-fim__table th, .ui-fim__table td { max-width: 220px; padding: var(--tc-space-1-5) var(--tc-space-3); overflow: hidden; border-bottom: var(--tc-hairline) solid var(--tc-divider); text-align: left; white-space: nowrap; text-overflow: ellipsis; vertical-align: top; }
.ui-fim__table thead th { position: sticky; top: 0; z-index: 1; background: var(--tc-surface-raised); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-fim__table td { color: var(--tc-text-secondary); }
.ui-fim__col { display: block; overflow: hidden; text-overflow: ellipsis; }
.ui-fim__type { display: block; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-fim__table th[data-type="empty"] .ui-fim__type { color: var(--tc-status-warning-fg); }
.ui-fim__rownum { width: 1%; color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular) !important; }
.ui-fim__table tbody .ui-fim__rownum { position: sticky; left: 0; background: var(--tc-surface-raised); }
.ui-fim__table thead .ui-fim__rownum { left: 0; z-index: 2; }
.ui-fim__table tr[data-ragged] > * { background: var(--tc-status-warning-bg); }
.ui-fim__table tr[data-ragged] .ui-fim__rownum { color: var(--tc-status-warning-fg); }
.ui-fim__table td[data-missing] { background: var(--tc-fill-subtle); }
.ui-fim__table tbody tr:last-child > * { border-bottom: 0; }
/* The tray below the card (Standard) / the card's last row (Clean) */
.ui-fim__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 44px; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-fim__foot { min-height: 48px; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-fim__continue { flex: none; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fim__continue:hover { background: var(--tc-action-primary-bg-hover); }
.ui-fim__continue[aria-disabled="true"] { background: var(--tc-fill-strong); box-shadow: none; color: var(--tc-text-muted); cursor: default; }
@container (max-width: 480px) {
  .ui-fim__file { flex-wrap: wrap; }
  .ui-fim__another { width: 100%; }
  .ui-fim__body { padding: var(--tc-space-3); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="fim"] *, [data-ui="fim"] *::before, [data-ui="fim"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-fim__drop { border-color: ButtonText; }
  .ui-fim__problems, .ui-fim__error { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-file-import")) customElements.define("tc-file-import", TcFileImport);

declare global {
  interface HTMLElementTagNameMap {
    "tc-file-import": TcFileImport;
  }
}

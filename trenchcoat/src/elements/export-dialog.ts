import { html, nothing, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { ModalController } from "./internal/modal";

/*
 * <tc-export-dialog> – exporting a list: pick the format (CSV, Excel, PDF), which rows (the selected ones, the ones the
 * filters show, or all of them – each with its count, and a choice with nothing in it disabled with the reason) and
 * which columns (Select all / none; required ones always go), and, for a big export, "Email me when it's ready". Export
 * fires tc-export with those choices; from then on the page drives `status`:
 *   · "preparing" – a progress bar (`progress` 0–1, or moving when unknown) and Cancel (tc-export-cancel)
 *   · "ready" – the file (`fileName`, `fileSize`) with Download (`downloadUrl`) and Done
 *   · "emailed" – "We'll email … when it's ready", and Close
 *   · "failed" – what went wrong (`error`), Retry (tc-export again) and Close
 * Each change of status is announced and moves focus to its main button. It's a native modal: the page behind is
 * inert, Escape, Close or a click outside close it, and focus goes back to what opened it. `open`, `format`, `rows`,
 * `selectedColumns` and `emailMe` are the page's to own. The panel is a card in both looks.
 *
 *   <tc-export-dialog open .counts=${{ selected: 12, filtered: 340, all: 12480 }} .columns=${columns}></tc-export-dialog>
 */

export type ExportFormat = "csv" | "xlsx" | "pdf";
export type ExportRows = "selected" | "filtered" | "all";
export type ExportStatus = "idle" | "preparing" | "ready" | "emailed" | "failed";
export type ExportColumn = { id: string; label: string; required?: boolean };
export type ExportCounts = { selected?: number; filtered?: number; all: number };
export type ExportDialogOpenChange = { open: boolean };
export type ExportFormatChange = { format: ExportFormat };
export type ExportRowsChange = { rows: ExportRows };
export type ExportSelectedColumnsChange = { selectedColumns: string[] };
export type ExportEmailMeChange = { emailMe: boolean };
/** tc-export: what to export */
export type ExportRequest = { format: ExportFormat; rows: ExportRows; columns: string[]; emailMe: boolean };

/** The element's words, every one renameable through `labels` */
export type ExportDialogLabels = {
  format: string;
  csv: string;
  csvHint: string;
  xlsx: string;
  xlsxHint: string;
  pdf: string;
  pdfHint: string;
  rows: string;
  selected: string;
  filtered: string;
  all: string;
  noneSelected: string;
  noFilter: string;
  columns: string;
  /** {n} of {total} */
  columnsCount: string;
  selectAll: string;
  selectNone: string;
  required: string;
  /** {email} */
  emailMe: string;
  emailHint: string;
  export: string;
  cancel: string;
  close: string;
  preparing: string;
  /** {n} – a whole percentage */
  percent: string;
  ready: string;
  download: string;
  done: string;
  /** {email} */
  emailed: string;
  failed: string;
  retry: string;
};
export const defaultExportDialogLabels: ExportDialogLabels = {
  format: "Format",
  csv: "CSV",
  csvHint: "For spreadsheets and imports",
  xlsx: "Excel",
  xlsxHint: "Keeps columns and formatting",
  pdf: "PDF",
  pdfHint: "For printing and sharing",
  rows: "Rows",
  selected: "Selected rows",
  filtered: "Rows matching the filters",
  all: "All rows",
  noneSelected: "Nothing is selected",
  noFilter: "No filters are applied",
  columns: "Columns",
  columnsCount: "{n} of {total}",
  selectAll: "Select all",
  selectNone: "Select none",
  required: "always included",
  emailMe: "Email me at {email} when it's ready",
  emailHint: "Large exports can take a few minutes.",
  export: "Export",
  cancel: "Cancel",
  close: "Close",
  preparing: "Preparing your export…",
  percent: "{n}%",
  ready: "Your export is ready",
  download: "Download",
  done: "Done",
  emailed: "We'll email {email} when it's ready.",
  failed: "The export didn't finish",
  retry: "Retry",
};

/** "12 KB", "3.4 MB" – a file's size for people */
export function exportFileSize(bytes: number, locale?: string) {
  const units = ["bytes", "KB", "MB", "GB"];
  let v = Math.max(0, bytes);
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: u === 0 || v >= 10 ? 0 : 1 }).format(v);
  return `${n} ${units[u]}`;
}

const CROSS = svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`;
const CHECK = svg`<path d="M20 6 9 17l-5-5"></path>`;
const ALERT = svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path>`;
const MAIL = svg`<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>`;
const FILE = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path>`;
const SAVE = svg`<path d="M12 4v11"></path><path d="m7 10 5 5 5-5"></path><path d="M5 20h14"></path>`;
let instances = 0;

/**
 * Export a list: format, which rows and which columns, then progress, a download link, or an email when it's ready.
 * @tag tc-export-dialog
 * @fires tc-open-change - The dialog was opened or closed ({ open }: ExportDialogOpenChange); cancelable – prevented, `open` stays as it was
 * @fires tc-format-change - A format was picked ({ format }: ExportFormatChange); cancelable – prevented, `format` stays as it was
 * @fires tc-rows-change - Which rows was picked ({ rows }: ExportRowsChange); cancelable – prevented, `rows` stays as it was
 * @fires tc-selected-columns-change - The columns changed ({ selectedColumns }: ExportSelectedColumnsChange); cancelable – prevented, `selectedColumns` stays as it was
 * @fires tc-email-me-change - "Email me" was ticked or unticked ({ emailMe }: ExportEmailMeChange); cancelable – prevented, `emailMe` stays as it was
 * @fires tc-export - Export or Retry was pressed ({ format, rows, columns, emailMe }: ExportRequest); the page starts the export and sets `status`
 * @fires tc-export-cancel - Cancel was pressed while preparing; the page stops the export
 */
export class TcExportDialog extends TcElement {
  static override ui = "exd";

  /** Whether the dialog is open. Changed by the user unless a tc-open-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** The heading */
  @property() accessor heading = "Export";
  /** A line under the heading: what's being exported */
  @property() accessor description: string | undefined = undefined;
  /** The formats on offer, in order */
  @property({ attribute: false }) accessor formats: ExportFormat[] = ["csv", "xlsx", "pdf"];
  /** The format picked. Changed by the user unless a tc-format-change listener calls preventDefault() */
  @property() accessor format: ExportFormat = "csv";
  /** How many rows each choice holds: the selected ones, the ones the filters show (unset: no filters) and all */
  @property({ attribute: false }) accessor counts: ExportCounts = { all: 0 };
  /** Which rows to export. Changed by the user unless a tc-rows-change listener calls preventDefault() */
  @property() accessor rows: ExportRows = "all";
  /** The columns on offer, in order; required ones can't be left out */
  @property({ attribute: false }) accessor columns: ExportColumn[] = [];
  /** The ids of the columns to export; unset, all of them. Changed by the user unless a tc-selected-columns-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selectedColumns: string[] | undefined = undefined;
  /** The person's email address; set, "Email me when it's ready" is offered */
  @property() accessor email: string | undefined = undefined;
  /** Whether to email the file instead of waiting; unset, ticked when the rows exceed `email-threshold`. Changed by the user unless a tc-email-me-change listener calls preventDefault() */
  @property({ type: Boolean, attribute: "email-me" }) accessor emailMe: boolean | undefined = undefined;
  /** Above this many rows "Email me" starts ticked (default 5000) */
  @property({ type: Number, attribute: "email-threshold" }) accessor emailThreshold = 5000;
  /** Where the export is: "idle" (the form), "preparing", "ready", "emailed" or "failed" – the page's to set after tc-export */
  @property() accessor status: ExportStatus = "idle";
  /** How far preparing has got, 0–1; unset, the bar moves without a number */
  @property({ type: Number }) accessor progress: number | undefined = undefined;
  /** The file to download, when ready */
  @property({ attribute: "download-url" }) accessor downloadUrl: string | undefined = undefined;
  /** The file's name, when ready */
  @property({ attribute: "file-name" }) accessor fileName: string | undefined = undefined;
  /** The file's size in bytes, when ready */
  @property({ type: Number, attribute: "file-size" }) accessor fileSize: number | undefined = undefined;
  /** What went wrong, when it failed */
  @property() accessor error: string | undefined = undefined;
  /** The locale for numbers */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<ExportDialogLabels> = {};

  private readonly uid = `tc-exd-${++instances}`;
  private readonly modal = new ModalController(this, {
    dialog: () => this.querySelector<HTMLDialogElement>(".ui-exd__dialog"),
    focus: () => this.querySelector<HTMLElement>(".ui-exd__main") ?? this.querySelector<HTMLElement>(".ui-exd__close"),
  });

  private get words(): ExportDialogLabels {
    return { ...defaultExportDialogLabels, ...this.labels };
  }

  /** The columns that will be exported: the picked ones plus every required one, in the columns' order */
  get exportColumns(): string[] {
    const picked = new Set(this.selectedColumns ?? this.columns.map((c) => c.id));
    return this.columns.filter((c) => c.required || picked.has(c.id)).map((c) => c.id);
  }

  /** How many rows a choice holds; undefined when it doesn't apply */
  private countOf(r: ExportRows) {
    return r === "all" ? this.counts.all : this.counts[r];
  }

  /** Whether "Email me" is ticked: as set, or by default when the rows exceed the threshold */
  get emailing(): boolean {
    if (!this.email) return false;
    return this.emailMe ?? (this.countOf(this.rows) ?? 0) > this.emailThreshold;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.modal.sync(this.open);
    // A new status replaces the buttons: its main one takes focus
    if (changed.has("status") && changed.get("status") !== undefined && this.open) this.querySelector<HTMLElement>(".ui-exd__main")?.focus();
  }

  private setOpen(open: boolean) {
    if (open !== this.open && this.emit<ExportDialogOpenChange>("tc-open-change", { open }, { cancelable: true })) this.open = open;
  }
  // A prevented change re-renders, so the native control the person just changed snaps back to the kept value
  private setFormat(format: ExportFormat) {
    if (format === this.format) return;
    if (this.emit<ExportFormatChange>("tc-format-change", { format }, { cancelable: true })) this.format = format;
    else this.requestUpdate();
  }
  private setRows(rows: ExportRows) {
    if (rows === this.rows) return;
    if (this.emit<ExportRowsChange>("tc-rows-change", { rows }, { cancelable: true })) this.rows = rows;
    else this.requestUpdate();
  }
  private setColumns(selectedColumns: string[]) {
    if (this.emit<ExportSelectedColumnsChange>("tc-selected-columns-change", { selectedColumns }, { cancelable: true })) this.selectedColumns = selectedColumns;
    else this.requestUpdate();
  }
  private setEmailMe(emailMe: boolean) {
    if (this.emit<ExportEmailMeChange>("tc-email-me-change", { emailMe }, { cancelable: true })) this.emailMe = emailMe;
    else this.requestUpdate();
  }
  private toggleColumn(id: string, on: boolean) {
    const cur = new Set(this.exportColumns);
    if (on) cur.add(id);
    else cur.delete(id);
    this.setColumns(this.columns.filter((c) => c.required || cur.has(c.id)).map((c) => c.id));
  }
  private startExport() {
    this.emit<ExportRequest>("tc-export", { format: this.format, rows: this.rows, columns: this.exportColumns, emailMe: this.emailing });
  }

  private num(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }

  private renderForm() {
    const w = this.words;
    const picked = new Set(this.exportColumns);
    const choices: ExportRows[] = ["selected", "filtered", "all"];
    return html`<div class="ui-exd__body">
        <fieldset class="ui-exd__group">
          <legend class="ui-exd__legend">${w.format}</legend>
          <div class="ui-exd__formats">
            ${this.formats.map(
              (f) => html`<label class="ui-exd__format">
                <input type="radio" name=${`${this.uid}-format`} value=${f} .checked=${live(f === this.format)} @change=${() => this.setFormat(f)} />
                <span class="ui-exd__format-name">${w[f]}</span>
                <span class="ui-exd__hint">${w[`${f}Hint`]}</span>
              </label>`,
            )}
          </div>
        </fieldset>
        <fieldset class="ui-exd__group">
          <legend class="ui-exd__legend">${w.rows}</legend>
          <div class="ui-exd__rows">
            ${choices.map((r) => {
              const n = this.countOf(r);
              const off = !n;
              const why = `${this.uid}-why-${r}`;
              return html`<label class="ui-exd__row" ?data-off=${off}>
                <input type="radio" name=${`${this.uid}-rows`} value=${r} ?disabled=${off} .checked=${live(r === this.rows)} aria-describedby=${ifDefined(off && r !== "all" ? why : undefined)} @change=${() => this.setRows(r)} />
                <span class="ui-exd__row-name">${w[r]}</span>
                ${off && r !== "all"
                  ? html`<span class="ui-exd__hint" id=${why}>${r === "selected" ? w.noneSelected : w.noFilter}</span>`
                  : html`<span class="ui-exd__count">${this.num(n ?? 0)}</span>`}
              </label>`;
            })}
          </div>
        </fieldset>
        ${this.columns.length
          ? html`<fieldset class="ui-exd__group">
              <legend class="ui-exd__legend">${w.columns} <span class="ui-exd__count">${w.columnsCount.replace("{n}", String(picked.size)).replace("{total}", String(this.columns.length))}</span></legend>
              <div class="ui-exd__col-actions">
                <button type="button" class="ui-exd__link" @click=${() => this.setColumns(this.columns.map((c) => c.id))}>${w.selectAll}</button>
                <button type="button" class="ui-exd__link" @click=${() => this.setColumns(this.columns.filter((c) => c.required).map((c) => c.id))}>${w.selectNone}</button>
              </div>
              <div class="ui-exd__columns">
                ${this.columns.map(
                  (c) => html`<label class="ui-exd__column" ?data-required=${!!c.required}>
                    <input type="checkbox" .checked=${live(!!c.required || picked.has(c.id))} ?disabled=${!!c.required} @change=${(e: Event) => this.toggleColumn(c.id, (e.target as HTMLInputElement).checked)} />
                    <span>${c.label}</span>
                    ${c.required ? html`<span class="ui-exd__hint">(${w.required})</span>` : nothing}
                  </label>`,
                )}
              </div>
            </fieldset>`
          : nothing}
        ${this.email
          ? html`<label class="ui-exd__email">
              <input type="checkbox" .checked=${live(this.emailing)} @change=${(e: Event) => this.setEmailMe((e.target as HTMLInputElement).checked)} />
              <span>${w.emailMe.replace("{email}", this.email)}<span class="ui-exd__hint ui-exd__email-hint">${w.emailHint}</span></span>
            </label>`
          : nothing}
      </div>
      <div class="ui-exd__footer">
        <button type="button" class="tc-btn-sm" @click=${() => this.setOpen(false)}>${w.cancel}</button>
        <button type="button" class="tc-btn-sm ui-exd__primary" ?disabled=${!picked.size || !this.countOf(this.rows)} @click=${() => this.startExport()}>${w.export}</button>
      </div>`;
  }

  private renderStatus() {
    const w = this.words;
    const s = this.status;
    if (s === "preparing") {
      const pct = this.progress != null ? Math.round(Math.max(0, Math.min(1, this.progress)) * 100) : undefined;
      return html`<div class="ui-exd__body ui-exd__state">
          <p class="ui-exd__state-title">${w.preparing}</p>
          <div
            class="ui-exd__bar"
            role="progressbar"
            aria-label=${w.preparing}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow=${ifDefined(pct)}
            ?data-indeterminate=${pct === undefined}
            style=${pct !== undefined ? `--tc-exd-progress: ${pct}%` : ""}
          ><span class="ui-exd__fill"></span></div>
          ${pct !== undefined ? html`<p class="ui-exd__hint" aria-hidden="true">${w.percent.replace("{n}", String(pct))}</p>` : nothing}
        </div>
        <div class="ui-exd__footer"><button type="button" class="tc-btn-sm ui-exd__main" @click=${() => this.emit("tc-export-cancel", {})}>${w.cancel}</button></div>`;
    }
    if (s === "ready")
      return html`<div class="ui-exd__body ui-exd__state">
          <p class="ui-exd__state-title"><span class="ui-exd__mark" data-tone="success"><svg viewBox="0 0 24 24" aria-hidden="true">${CHECK}</svg></span>${w.ready}</p>
          <div class="ui-exd__file">
            <svg class="ui-exd__file-icon" viewBox="0 0 24 24" aria-hidden="true">${FILE}</svg>
            <span class="ui-exd__file-name">${this.fileName ?? ""}</span>
            ${this.fileSize != null ? html`<span class="ui-exd__hint">${exportFileSize(this.fileSize, this.locale)}</span>` : nothing}
          </div>
        </div>
        <div class="ui-exd__footer">
          <button type="button" class="tc-btn-sm" @click=${() => this.setOpen(false)}>${w.done}</button>
          <a class="tc-btn-sm ui-exd__primary ui-exd__main" href=${ifDefined(this.downloadUrl)} download=${ifDefined(this.fileName)}
            ><svg viewBox="0 0 24 24" aria-hidden="true">${SAVE}</svg>${w.download}<span class="tc-sr-only">${this.fileName ? ` ${this.fileName}` : ""}</span></a
          >
        </div>`;
    if (s === "emailed")
      return html`<div class="ui-exd__body ui-exd__state">
          <p class="ui-exd__state-title"><span class="ui-exd__mark"><svg viewBox="0 0 24 24" aria-hidden="true">${MAIL}</svg></span>${w.emailed.replace("{email}", this.email ?? "")}</p>
        </div>
        <div class="ui-exd__footer"><button type="button" class="tc-btn-sm ui-exd__primary ui-exd__main" @click=${() => this.setOpen(false)}>${w.close}</button></div>`;
    return html`<div class="ui-exd__body ui-exd__state">
        <p class="ui-exd__state-title"><span class="ui-exd__mark" data-tone="danger"><svg viewBox="0 0 24 24" aria-hidden="true">${ALERT}</svg></span>${w.failed}</p>
        ${this.error ? html`<p class="ui-exd__error">${this.error}</p>` : nothing}
      </div>
      <div class="ui-exd__footer">
        <button type="button" class="tc-btn-sm" @click=${() => this.setOpen(false)}>${w.close}</button>
        <button type="button" class="tc-btn-sm ui-exd__primary ui-exd__main" @click=${() => this.startExport()}>${w.retry}</button>
      </div>`;
  }

  /** What the status region says for the current status */
  private announcement() {
    const w = this.words;
    switch (this.status) {
      case "preparing":
        return w.preparing;
      case "ready":
        return `${w.ready}${this.fileName ? `: ${this.fileName}` : ""}`;
      case "emailed":
        return w.emailed.replace("{email}", this.email ?? "");
      case "failed":
        return `${w.failed}${this.error ? `. ${this.error}` : ""}`;
      default:
        return "";
    }
  }

  protected override render() {
    const w = this.words;
    return html`<dialog
      class="ui-exd__dialog"
      aria-labelledby=${`${this.uid}-title`}
      aria-describedby=${ifDefined(this.description ? `${this.uid}-desc` : undefined)}
      @cancel=${(e: Event) => {
        e.preventDefault();
        this.setOpen(false);
      }}
      @close=${() => {
        if (!this.modal.ownClose() && this.open) this.setOpen(false);
      }}
      @click=${(e: MouseEvent) => {
        // A click on the backdrop (the dialog itself, outside the panel) closes
        if (e.target === e.currentTarget) this.setOpen(false);
      }}
    >
      ${this.open
        ? html`<div class="ui-exd__panel">
            <div class="ui-exd__head">
              <div class="ui-exd__titles">
                <h3 class="ui-exd__title" id=${`${this.uid}-title`}>${this.heading}</h3>
                ${this.description ? html`<p class="ui-exd__desc" id=${`${this.uid}-desc`}>${this.description}</p>` : nothing}
              </div>
              <button type="button" class="ui-exd__close" @click=${() => this.setOpen(false)}><svg viewBox="0 0 24 24" aria-hidden="true">${CROSS}</svg><span class="tc-sr-only">${w.close}</span></button>
            </div>
            ${this.status === "idle" ? this.renderForm() : this.renderStatus()}
          </div>`
        : nothing}
      <span class="tc-sr-only" role="status">${this.open ? this.announcement() : ""}</span>
    </dialog>`;
  }

  static override css = /* css */ `
/* The panel's widest – override it on the element */
[data-ui="exd"] { --tc-exd-w: calc(var(--tc-space-16) * 8); --tc-exd-progress: 0%; display: contents; }
[data-ui="exd"] *, [data-ui="exd"] *::before, [data-ui="exd"] *::after { box-sizing: border-box; }
[data-ui="exd"] :where(p, h3, fieldset, legend) { margin: 0; }
.ui-exd__dialog { width: min(var(--tc-exd-w), 94vw); max-width: none; max-height: 90vh; margin: auto; padding: 0; overflow: auto; border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); color: var(--tc-text-primary); box-shadow: var(--tc-shadow-overlay); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); text-align: left; }
.ui-exd__dialog::backdrop { background: var(--tc-scrim); }
.ui-exd__dialog:not([open]) { display: none; }
.ui-exd__panel { display: grid; }
.ui-exd__head { display: flex; align-items: flex-start; gap: var(--tc-space-3); padding: var(--tc-space-4) var(--tc-space-3) var(--tc-space-2) var(--tc-space-4); }
.ui-exd__titles { flex: 1 1 auto; min-width: 0; }
.ui-exd__title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); }
.ui-exd__desc { margin-top: var(--tc-space-0-5); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-exd__close { display: inline-grid; place-items: center; flex: none; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin: 0; padding: 0; border: 0; border-radius: var(--tc-control-radius-sm); background: transparent; color: var(--tc-text-secondary); cursor: pointer; }
.ui-exd__close:hover { background: var(--tc-surface-tray); color: var(--tc-text-primary); }
[data-ui="exd"] :is(.ui-exd__close, .ui-exd__head, .ui-exd__state-title, .ui-exd__primary, .ui-exd__file) svg { width: var(--tc-space-4); height: var(--tc-space-4); flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-exd__body { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-4); }
.ui-exd__group { display: grid; gap: var(--tc-space-2); min-width: 0; padding: 0; border: 0; }
.ui-exd__legend { display: flex; align-items: baseline; gap: var(--tc-space-2); padding: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-exd__formats { display: grid; grid-template-columns: repeat(auto-fit, minmax(calc(var(--tc-space-16) * 2), 1fr)); gap: var(--tc-space-2); }
.ui-exd__format { position: relative; display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); cursor: pointer; }
.ui-exd__format:has(input:checked) { box-shadow: inset 0 0 0 calc(var(--tc-hairline) * 2) var(--tc-text-primary); }
.ui-exd__format:has(input:focus-visible), .ui-exd__row:has(input:focus-visible), .ui-exd__column:has(input:focus-visible), .ui-exd__email:has(input:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-exd__format input { position: absolute; opacity: 0; pointer-events: none; }
.ui-exd__format-name { font-weight: var(--tc-font-weight-medium); }
.ui-exd__hint { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); }
.ui-exd__count { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-exd__rows { display: grid; gap: var(--tc-space-0-5); }
.ui-exd__row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); cursor: pointer; }
.ui-exd__row[data-off] { color: var(--tc-text-secondary); cursor: not-allowed; }
.ui-exd__row input, .ui-exd__column input, .ui-exd__email input { margin: 0; accent-color: var(--tc-text-primary); }
.ui-exd__col-actions { display: flex; gap: var(--tc-space-3); }
.ui-exd__link { padding: 0; border: 0; background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); text-decoration: underline; cursor: pointer; }
.ui-exd__link:hover { color: var(--tc-text-primary); }
.ui-exd__link:focus-visible, .ui-exd__close:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-exd__columns { display: grid; grid-template-columns: repeat(auto-fill, minmax(calc(var(--tc-space-16) * 2.5), 1fr)); gap: var(--tc-space-0-5) var(--tc-space-3); }
.ui-exd__column { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); cursor: pointer; }
.ui-exd__column[data-required] { cursor: default; }
.ui-exd__email { display: flex; align-items: flex-start; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-tray); cursor: pointer; }
.ui-exd__email input { margin-top: var(--tc-space-0-5); }
.ui-exd__email-hint { display: block; }
.ui-exd__footer { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-exd__primary { background: var(--tc-action-primary-bg); color: var(--tc-action-primary-fg); box-shadow: var(--tc-action-primary-shadow); text-decoration: none; }
.ui-exd__primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-exd__state { padding-top: var(--tc-space-4); }
.ui-exd__state-title { display: flex; align-items: center; gap: var(--tc-space-2); font-weight: var(--tc-font-weight-medium); }
.ui-exd__mark { display: inline-grid; place-items: center; color: var(--tc-text-secondary); }
.ui-exd__mark[data-tone="success"] { color: var(--tc-status-success-fg); }
.ui-exd__mark[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-exd__error { color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-exd__bar { position: relative; height: var(--tc-space-1-5); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-surface-tray); }
.ui-exd__fill { position: absolute; inset: 0 auto 0 0; width: var(--tc-exd-progress); border-radius: inherit; background: var(--tc-text-primary); transition: width var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-exd__bar[data-indeterminate] .ui-exd__fill { width: 35%; animation: tc-exd-slide var(--tc-duration-shimmer) var(--tc-ease-standard) infinite; }
@keyframes tc-exd-slide { from { transform: translateX(-100%); } to { transform: translateX(300%); } }
.ui-exd__file { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-tray); }
.ui-exd__file-icon { color: var(--tc-text-secondary); }
.ui-exd__file-name { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; font-weight: var(--tc-font-weight-medium); }
@media (prefers-reduced-motion: reduce) {
  .ui-exd__fill { transition: none; }
  .ui-exd__bar[data-indeterminate] .ui-exd__fill { animation: none; width: 100%; opacity: 0.5; }
}
@media (forced-colors: active) {
  .ui-exd__fill { background: Highlight; forced-color-adjust: none; }
  .ui-exd__format:has(input:checked) { outline: 2px solid Highlight; }
}
`;
}

if (!customElements.get("tc-export-dialog")) customElements.define("tc-export-dialog", TcExportDialog);

declare global {
  interface HTMLElementTagNameMap {
    "tc-export-dialog": TcExportDialog;
  }
}

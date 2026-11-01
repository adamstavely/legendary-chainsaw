import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";
import "./malware-blocked";

/*
 * <tc-scan-status> – where a file stands in malware scanning: queued, scanning, clean, suspicious, quarantined or failed,
 * each with a mark and a word. Inline by default, for a row in a list; layout="card" adds the file's name, what scanned it
 * and when, and in quarantine the Malware Blocked picture. Failed offers Rescan and quarantined offers Request review.
 * Changes of state are announced politely. It reports what the page tells it: blocking a file is the server's job.
 *
 *   <tc-scan-status state="scanning" progress="0.4" file-name="invoice.zip"></tc-scan-status>
 */

export type ScanState = "queued" | "scanning" | "clean" | "suspicious" | "quarantined" | "failed";
export type ScanLayout = "inline" | "card";
export type ScanAction = "rescan" | "request-review";
export type ScanActionDetail = { action: ScanAction; state: ScanState };

/** The status's words, every one renameable through `labels` */
export type ScanStatusLabels = Record<ScanState, string> & {
  heading: string;
  /** {engine} */
  scannedBy: string;
  /** {when} */
  scannedAt: string;
  rescan: string;
  requestReview: string;
};
export const defaultScanStatusLabels: ScanStatusLabels = {
  queued: "Waiting to scan",
  scanning: "Scanning",
  clean: "No threats found",
  suspicious: "Suspicious",
  quarantined: "Quarantined",
  failed: "Scan failed",
  heading: "Malware scan",
  scannedBy: "Scanned by {engine}",
  scannedAt: "Scanned {when}",
  rescan: "Rescan",
  requestReview: "Request review",
};

/* clock, loader, shield-check, triangle-alert, shield-x, circle-x: Lucide (ISC, lucide.dev) */
const MARKS: Record<ScanState, unknown> = {
  queued: svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`,
  scanning: svg`<path d="M21 12a9 9 0 1 1-6.2-8.6"></path>`,
  clean: svg`<path d="M20 13c0 5-3.5 7.500-8 9-4.5-1.500-8-4-8-9V5l8-3 8 3Z"></path><path d="m9 12 2 2 4-4"></path>`,
  suspicious: svg`<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"></path><path d="M12 9v4M12 17h.01"></path>`,
  quarantined: svg`<path d="M20 13c0 5-3.5 7.500-8 9-4.5-1.500-8-4-8-9V5l8-3 8 3Z"></path><path d="m14.5 9.5-5 5M9.5 9.5l5 5"></path>`,
  failed: svg`<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6M9 9l6 6"></path>`,
};
const ICON = svg`<path d="M20 13c0 5-3.5 7.500-8 9-4.5-1.500-8-4-8-9V5l8-3 8 3Z"></path>`;
const STATES = Object.keys(MARKS) as ScanState[];
let instances = 0;

/**
 * Where a file stands in malware scanning.
 * @tag tc-scan-status
 * @fires tc-action - Rescan or Request review was pressed ({ action, state }: ScanActionDetail); cancelable
 */
export class TcScanStatus extends TcElement {
  static override ui = "scn";

  /** Where the scan stands: queued, scanning, clean, suspicious, quarantined or failed */
  @property({ reflect: true }) accessor state: ScanState = "queued";
  /** The file's name */
  @property({ attribute: "file-name" }) accessor fileName = "";
  /** What scanned it */
  @property() accessor engine: string | undefined = undefined;
  /** When it was scanned, epoch ms */
  @property({ type: Number, attribute: "scanned-at" }) accessor scannedAt: number | undefined = undefined;
  /** More about it: what was found, or why it failed */
  @property() accessor detail: string | undefined = undefined;
  /** How far the scan is, 0 to 1 */
  @property({ type: Number }) accessor progress: number | undefined = undefined;
  /** "inline", for a row, or "card" */
  @property({ reflect: true }) accessor layout: ScanLayout = "inline";
  /** The locale for dates */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<ScanStatusLabels> = {};

  @state() private accessor announce = "";
  private readonly uid = `tc-scn-${++instances}`;

  private get words(): ScanStatusLabels {
    return { ...defaultScanStatusLabels, ...this.labels };
  }
  private get safeState(): ScanState {
    return STATES.includes(this.state) ? this.state : "queued";
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("state") && changed.get("state") !== undefined) {
      const name = this.fileName ? `${this.fileName}: ` : "";
      this.announce = `${name}${this.words[this.safeState]}`;
    }
  }

  private act(action: ScanAction) {
    this.emit<ScanActionDetail>("tc-action", { action, state: this.safeState }, { cancelable: true });
  }

  private renderMark(s: ScanState) {
    return html`<svg class="ui-scn__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS[s]}</svg>`;
  }

  private renderAction(s: ScanState) {
    const w = this.words;
    const name = this.fileName ? html`<span class="tc-sr-only">, ${this.fileName}</span>` : nothing;
    if (s === "failed") return html`<button type="button" class="tc-btn-sm ui-scn__action" @click=${() => this.act("rescan")}>${w.rescan}${name}</button>`;
    if (s === "quarantined") return html`<button type="button" class="tc-btn-sm ui-scn__action" @click=${() => this.act("request-review")}>${w.requestReview}${name}</button>`;
    return nothing;
  }

  private renderProgress(s: ScanState) {
    const p = this.progress;
    if (s !== "scanning" || p === undefined || !Number.isFinite(p)) return nothing;
    const pct = Math.round(Math.min(1, Math.max(0, p)) * 100);
    return html`<span class="ui-scn__track" role="progressbar" aria-label=${this.words.scanning} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${pct}><span class="ui-scn__fill" style=${`width: ${pct}%`}></span></span><span class="ui-scn__percent">${pct}%</span>`;
  }

  protected override render() {
    const w = this.words;
    const s = this.safeState;
    const status = html`<span class="tc-sr-only" role="status">${this.announce}</span>`;
    const badge = html`<span class="ui-scn__badge" data-state=${s}>${this.renderMark(s)}<span class="ui-scn__word">${w[s]}</span></span>`;
    if (this.layout !== "card") {
      return html`<span class="ui-scn__inline">${badge}${this.renderProgress(s)}${this.renderAction(s)}</span>${status}`;
    }
    const facts = [this.engine ? w.scannedBy.replace("{engine}", this.engine) : "", this.scannedAt !== undefined ? w.scannedAt.replace("{when}", formatDate(this.scannedAt, this.locale, { dateStyle: "medium", timeStyle: "short" })) : ""].filter(Boolean);
    return html`${cardHead({ icon: ICON, title: this.fileName || w.heading, subtitle: this.fileName ? w.heading : undefined, id: `${this.uid}-title` })}
      <div class="ui-scn__card">
        ${s === "quarantined" ? html`<div class="ui-scn__picture"><tc-malware-blocked caption=""></tc-malware-blocked></div>` : nothing}
        <div class="ui-scn__row">${badge}${this.renderProgress(s)}</div>
        ${this.detail ? html`<p class="ui-scn__detail">${this.detail}</p>` : nothing}
        ${facts.length ? html`<p class="ui-scn__facts">${facts.join(" · ")}</p>` : nothing}
        ${s === "failed" || s === "quarantined" ? html`<div class="ui-scn__actions">${this.renderAction(s)}</div>` : nothing}
      </div>
      ${status}`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="scn"],
:where([data-look="clean"], [data-look="clean"] *)[data-ui="scn"] {
  display: inline-block; max-width: 100%; min-width: 0; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; vertical-align: middle; -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="scn"][layout="card"] {
  position: relative; display: block; box-sizing: border-box; width: 100%; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="scn"][layout="card"] {
  position: relative; display: block; box-sizing: border-box; width: 100%; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
}
/* The picture's width and the progress track's – override them on the element */
[data-ui="scn"] { --tc-scn-picture: 220px; --tc-scn-track: 72px; }
[data-ui="scn"] *, [data-ui="scn"] *::before, [data-ui="scn"] *::after { box-sizing: border-box; }
[data-ui="scn"] :where(p) { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="scn"] .ui-scn__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-scn__inline, .ui-scn__row { display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-scn__badge { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); }
.ui-scn__badge[data-state="clean"] { color: var(--tc-status-success-fg); }
.ui-scn__badge[data-state="suspicious"] { color: var(--tc-status-warning-fg); }
.ui-scn__badge[data-state="quarantined"], .ui-scn__badge[data-state="failed"] { color: var(--tc-status-danger-fg); }
.ui-scn__mark { flex: none; width: var(--tc-icon-size-md, 16px); height: var(--tc-icon-size-md, 16px); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-scn__badge[data-state="scanning"] .ui-scn__mark { animation: ui-scn-spin var(--tc-duration-reveal) linear infinite; }
@keyframes ui-scn-spin { to { transform: rotate(360deg); } }
.ui-scn__track { display: inline-block; flex: none; width: var(--tc-scn-track); height: var(--tc-space-1); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-hover); }
.ui-scn__fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-text-secondary); }
.ui-scn__percent { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-scn__card { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-4); }
.ui-scn__picture { justify-self: center; width: 100%; max-width: var(--tc-scn-picture); }
.ui-scn__detail { overflow-wrap: anywhere; }
.ui-scn__facts { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-scn__actions { display: flex; justify-content: flex-end; }
@media (prefers-reduced-motion: reduce) {
  .ui-scn__badge[data-state="scanning"] .ui-scn__mark { animation: none; }
}
@media (forced-colors: active) {
  .ui-scn__fill { background: CanvasText; }
  .ui-scn__track { outline: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-scan-status")) customElements.define("tc-scan-status", TcScanStatus);

declare global {
  interface HTMLElementTagNameMap {
    "tc-scan-status": TcScanStatus;
  }
}

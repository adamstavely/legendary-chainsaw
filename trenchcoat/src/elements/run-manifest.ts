import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { ToolbarController } from "./internal/controllers";
import { copyText } from "./internal/util";

/*
 * <tc-run-manifest> – a run's reproducibility record: what someone needs to run it again and to judge what came out.
 * The model (its exact id), the settings, the instruction's hash (shortened; Copy copies all of it), the sources and
 * corpus it drew on, the intent the session was started with, and the verification summary – how many claims were
 * verified, couldn't be verified, were incorrect, dismissed or not reviewed yet.
 *
 *   <tc-run-manifest model="Opus 5.5" .runId=${run.id} .modelId=${run.modelId} .instructionHash=${run.hash}
 *     .settings=${[{ label: "Temperature", value: "0.2" }]} .sources=${[{ id: "kb", label: "Policy library" }]}
 *     .verification=${{ verified: 14, pending: 3 }}></tc-run-manifest>
 *
 * Copy buttons fire a cancelable `tc-copy` ({ field, text }) and then write the clipboard – prevent it to copy
 * yourself. Export fires `tc-export` ({ manifest }) with the whole record as data; the app writes the file. The footer
 * is a toolbar: one tab stop, arrow keys between Copy and Export. The element reads no clock – `timestamp` is shown as
 * given.
 */

export type RunManifestSetting = { label: string; value: string };

export type RunManifestSource = {
  id: string;
  /** "Policy library", "Uploaded: vendor-contract.pdf" */
  label: string;
  /** A quiet second line – size, version, when it was indexed */
  detail?: string;
};

export type RunVerificationState = "verified" | "unverifiable" | "incorrect" | "dismissed" | "pending";
/** Claims per verification state */
export type RunVerification = Partial<Record<RunVerificationState, number>>;

/** The whole record, as copied and exported */
export type RunManifestRecord = {
  runId: string;
  timestamp: string;
  model: string;
  modelId: string;
  settings: RunManifestSetting[];
  instruction: { label: string; hash: string };
  sources: RunManifestSource[];
  intent: string;
  verification: Record<RunVerificationState, number>;
};

export type RunManifestCopyField = "run" | "model" | "instruction" | "manifest";

/** Details of the events */
export type RunManifestCopy = { field: RunManifestCopyField; text: string };
export type RunManifestExport = { manifest: RunManifestRecord };

const STATES: RunVerificationState[] = ["verified", "unverifiable", "incorrect", "dismissed", "pending"];
const DEFAULT_STATE_LABELS: Record<RunVerificationState, string> = {
  verified: "Verified",
  unverifiable: "Can't verify",
  incorrect: "Incorrect",
  dismissed: "Dismissed",
  pending: "Not reviewed",
};
const FIELD_NAMES: Record<RunManifestCopyField, string> = { run: "Run id", model: "Model id", instruction: "Instruction hash", manifest: "Manifest" };
/** How long "Copied" shows */
const COPIED_MS = 1600;

/** "sha256:3f9a2c71…b81e" – the algorithm, the first eight characters and the last four */
function shortHash(hash: string) {
  const at = hash.indexOf(":");
  const prefix = at > 0 ? hash.slice(0, at + 1) : "";
  const body = hash.slice(prefix.length);
  return body.length > 14 ? `${prefix}${body.slice(0, 8)}…${body.slice(-4)}` : hash;
}

let instances = 0;

/* ---------- Icons ---------- */

const copyIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<rect x="5.5" y="5.5" width="8" height="8" rx="1.6"></rect><path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"></path>`}</svg>`;
const doneIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="m3.5 8.4 2.9 2.9 6.1-6.6"></path>`}</svg>`;
const exportIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 10V2.5M5 5.3 8 2.3l3 3"></path><path d="M3 9.5v2.8c0 .7.5 1.2 1.2 1.2h7.6c.7 0 1.2-.5 1.2-1.2V9.5"></path>`}</svg>`;
const fileIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4 2.5h5l3 3v8H4z"></path><path d="M9 2.5v3h3"></path>`}</svg>`;

/**
 * A run's reproducibility record: model, settings, instruction hash, sources, intent and the verification summary,
 * with copy and export.
 * @tag tc-run-manifest
 * @fires tc-copy - A copy button was pressed (detail: { field: "run" | "model" | "instruction" | "manifest", text: string }); cancelable – prevent it to write the clipboard yourself
 * @fires tc-export - Export was pressed (detail: { manifest: RunManifestRecord })
 */
export class TcRunManifest extends TcElement {
  static override ui = "rmf";

  /** The heading, and the region's name */
  @property() accessor heading = "Run manifest";
  /** The run's id – shown under the heading, with a copy button */
  @property({ attribute: "run-id" }) accessor runId = "";
  /** When the run happened, shown as given – e.g. "Oct 24, 14:02 UTC" */
  @property() accessor timestamp = "";
  /** The model's display name, shown as a badge in the head */
  @property() accessor model = "";
  /** The model's exact id or version – what reproducing the run needs; shown in full with a copy button */
  @property({ attribute: "model-id" }) accessor modelId = "";
  /** An icon for the model badge, cloned in (an svg or img) */
  @property({ attribute: false }) accessor modelIcon: Element | undefined = undefined;
  /** Sampling and other settings, in order: temperature, top-p, maximum tokens, seed… */
  @property({ attribute: false }) accessor settings: RunManifestSetting[] = [];
  /** The instruction's name or version, e.g. "Analyst v4" */
  @property({ attribute: "instruction-label" }) accessor instructionLabel = "";
  /** The instruction's hash – shown shortened, copied in full */
  @property({ attribute: "instruction-hash" }) accessor instructionHash = "";
  /** The sources and corpus the run drew on */
  @property({ attribute: false }) accessor sources: RunManifestSource[] = [];
  /** How many sources show before "Show all" */
  @property({ type: Number, attribute: "source-limit" }) accessor sourceLimit = 3;
  /** The intent the session was started with, in the person's words */
  @property() accessor intent = "";
  /** Claims per verification state: verified, unverifiable, incorrect, dismissed, pending */
  @property({ attribute: false }) accessor verification: RunVerification = {};
  /** Names of the verification states */
  @property({ attribute: false }) accessor stateLabels: Partial<Record<RunVerificationState, string>> = {};
  /** What the verified things are called, plural – "claims" */
  @property() accessor noun = "claims";

  /** @internal The field whose copy button shows "Copied" */
  @state() private accessor copied: RunManifestCopyField | null = null;
  /** @internal All sources shown */
  @state() private accessor allSources = false;
  /** @internal */
  @state() private accessor message = "";

  private readonly uid = `tc-rmf${++instances}`;
  private copiedTimer = 0;
  /** The footer's roving tabindex */
  private tools = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-rmf__tool")] });

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
    this.copiedTimer = 0;
    this.copied = null;
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  /* ---------- Data ---------- */

  /** @internal Every state's count, zero when missing */
  private get counts(): Record<RunVerificationState, number> {
    const v = this.verification ?? {};
    return Object.fromEntries(STATES.map((s) => [s, Math.max(0, Math.round(v[s] ?? 0))])) as Record<RunVerificationState, number>;
  }

  /** The whole record as data – what Copy writes as JSON and Export hands to the app */
  get manifest(): RunManifestRecord {
    return {
      runId: this.runId,
      timestamp: this.timestamp,
      model: this.model,
      modelId: this.modelId,
      settings: this.settings.map((s) => ({ ...s })),
      instruction: { label: this.instructionLabel, hash: this.instructionHash },
      sources: this.sources.map((s) => ({ ...s })),
      intent: this.intent,
      verification: this.counts,
    };
  }

  /** @internal */
  private label(s: RunVerificationState) {
    return this.stateLabels[s] ?? DEFAULT_STATE_LABELS[s];
  }

  /* ---------- Actions ---------- */

  private async copy(field: RunManifestCopyField) {
    const text = field === "manifest" ? JSON.stringify(this.manifest, null, 2) : field === "run" ? this.runId : field === "model" ? this.modelId : this.instructionHash;
    if (!this.emit<RunManifestCopy>("tc-copy", { field, text }, { cancelable: true })) return this.done(field);
    if (await copyText(text)) this.done(field);
    else this.announce(`Couldn't copy the ${FIELD_NAMES[field].toLowerCase()}.`);
  }

  /** @internal "Copied" for a moment, and said */
  private done(field: RunManifestCopyField) {
    clearTimeout(this.copiedTimer);
    this.copied = field;
    this.announce(`${FIELD_NAMES[field]} copied.`);
    this.copiedTimer = window.setTimeout(() => {
      this.copiedTimer = 0;
      this.copied = null;
    }, COPIED_MS);
  }

  private exportManifest() {
    this.emit<RunManifestExport>("tc-export", { manifest: this.manifest });
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private announce(text: string) {
    this.message = this.message === text ? `${text} ` : text;
  }

  /* ---------- Render ---------- */

  private copyButton(field: RunManifestCopyField) {
    const done = this.copied === field;
    return html`<button type="button" class="ui-rmf__copy" ?data-done=${done} aria-label=${`Copy ${FIELD_NAMES[field].toLowerCase()}`} @click=${() => this.copy(field)}>${done ? doneIcon : copyIcon}</button>`;
  }

  private renderSettings() {
    if (!this.settings.length) return nothing;
    return html`<div class="ui-rmf__row">
      <dt class="ui-rmf__key">Settings</dt>
      <dd class="ui-rmf__val">
        <ul class="ui-rmf__settings">
          ${repeat(
            this.settings,
            (s) => s.label,
            (s) => html`<li class="ui-rmf__setting"><span class="ui-rmf__setting-key">${s.label}</span> <span class="ui-rmf__setting-val">${s.value}</span></li>`,
          )}
        </ul>
      </dd>
    </div>`;
  }

  private renderSources() {
    const sources = this.sources;
    if (!sources.length) return nothing;
    const limit = Math.max(1, this.sourceLimit);
    const shown = this.allSources ? sources : sources.slice(0, limit);
    const more = sources.length - limit;
    return html`<div class="ui-rmf__row">
      <dt class="ui-rmf__key">Sources</dt>
      <dd class="ui-rmf__val">
        <ul class="ui-rmf__sources" id=${`${this.uid}-sources`}>
          ${repeat(
            shown,
            (s) => s.id,
            (s) => html`<li class="ui-rmf__source">
              <span class="ui-rmf__source-icon">${fileIcon}</span>
              <span class="ui-rmf__source-text"><span class="ui-rmf__source-label">${s.label}</span>${s.detail ? html`<span class="ui-rmf__source-detail">${s.detail}</span>` : nothing}</span>
            </li>`,
          )}
        </ul>
        ${more > 0
          ? html`<button type="button" class="ui-rmf__more" aria-expanded=${this.allSources ? "true" : "false"} aria-controls=${`${this.uid}-sources`} @click=${() => (this.allSources = !this.allSources)}>
              ${this.allSources ? "Show fewer" : `Show all ${sources.length}`}
            </button>`
          : nothing}
      </dd>
    </div>`;
  }

  private renderVerification() {
    const counts = this.counts;
    const total = STATES.reduce((n, s) => n + counts[s], 0);
    const reviewed = total - counts.pending;
    const noun = this.noun;
    const summary = total === 0 ? `No ${noun} collected` : reviewed === total ? `All ${total} ${noun} reviewed` : `${reviewed} of ${total} ${noun} reviewed`;
    const parts = STATES.filter((s) => counts[s] > 0);
    return html`<div class="ui-rmf__row ui-rmf__row--verify">
      <dt class="ui-rmf__key">Verification</dt>
      <dd class="ui-rmf__val">
        <p class="ui-rmf__verify-summary" data-done=${total > 0 && reviewed === total ? "true" : "false"}>${summary}</p>
        ${total > 0
          ? html`<span
                class="ui-rmf__verify-bar"
                .role=${"meter"}
                aria-label=${`${noun[0]?.toUpperCase() ?? ""}${noun.slice(1)} reviewed`}
                aria-valuemin="0"
                aria-valuemax=${total}
                aria-valuenow=${reviewed}
                aria-valuetext=${`${summary}: ${parts.map((s) => `${counts[s]} ${this.label(s).toLowerCase()}`).join(", ")}`}
                >${parts
                  .filter((s) => s !== "pending")
                  .map((s) => html`<span class="ui-rmf__verify-seg" data-state=${s} style=${styleMap({ width: `${(counts[s] / total) * 100}%` })}></span>`)}</span
              >
              <ul class="ui-rmf__verify-legend" aria-hidden="true">
                ${parts.map((s) => html`<li data-state=${s}><span class="ui-rmf__swatch"></span>${this.label(s)} <b>${counts[s]}</b></li>`)}
              </ul>`
          : nothing}
      </dd>
    </div>`;
  }

  protected override render() {
    return html`
      <div class="ui-rmf__card">
        <div class="ui-rmf__inner">
          <header class="ui-rmf__head">
            <div class="ui-rmf__heading">
              <h3 class="ui-rmf__title" id=${`${this.uid}-title`}>${this.heading}</h3>
              ${this.runId || this.timestamp
                ? html`<p class="ui-rmf__sub">
                    ${this.runId ? html`<code class="ui-rmf__run">${this.runId}</code>${this.copyButton("run")}` : nothing}${this.runId && this.timestamp
                      ? html`<span class="ui-rmf__sep" aria-hidden="true">·</span>`
                      : nothing}${this.timestamp ? html`<span>${this.timestamp}</span>` : nothing}
                  </p>`
                : nothing}
            </div>
            ${this.model
              ? html`<span class="ui-rmf__model">${this.modelIcon ? html`<span class="ui-rmf__model-icon">${this.modelIcon.cloneNode(true)}</span>` : nothing}<span>${this.model}</span></span>`
              : nothing}
          </header>
          <dl class="ui-rmf__list">
            ${this.modelId || this.model
              ? html`<div class="ui-rmf__row">
                  <dt class="ui-rmf__key">Model</dt>
                  <dd class="ui-rmf__val ui-rmf__val--line">${this.modelId ? html`<code class="ui-rmf__code">${this.modelId}</code>${this.copyButton("model")}` : this.model}</dd>
                </div>`
              : nothing}
            ${this.renderSettings()}
            ${this.instructionHash || this.instructionLabel
              ? html`<div class="ui-rmf__row">
                  <dt class="ui-rmf__key">Instruction</dt>
                  <dd class="ui-rmf__val ui-rmf__val--line">
                    ${this.instructionLabel ? html`<span class="ui-rmf__instruction">${this.instructionLabel}</span>` : nothing}
                    ${this.instructionHash
                      ? html`<code class="ui-rmf__code ui-rmf__hash" title=${this.instructionHash}><span class="ui-rmf__sr">Hash </span>${shortHash(this.instructionHash)}</code>${this.copyButton("instruction")}`
                      : nothing}
                  </dd>
                </div>`
              : nothing}
            ${this.renderSources()}
            ${this.intent
              ? html`<div class="ui-rmf__row">
                  <dt class="ui-rmf__key">Intent</dt>
                  <dd class="ui-rmf__val"><q class="ui-rmf__intent">${this.intent}</q></dd>
                </div>`
              : nothing}
            ${this.renderVerification()}
          </dl>
        </div>
      </div>
      <div class="ui-rmf__foot">
        <span class="ui-rmf__foot-note">Everything needed to run it again</span>
        <div class="ui-rmf__tools" role="toolbar" aria-label="Manifest actions" @keydown=${this.tools.onKeyDown} @focusin=${this.tools.onFocusIn}>
          <button type="button" class="ui-rmf__tool" ?data-done=${this.copied === "manifest"} @click=${() => this.copy("manifest")}>
            ${this.copied === "manifest" ? doneIcon : copyIcon}<span>${this.copied === "manifest" ? "Copied" : "Copy"}</span>
          </button>
          <button type="button" class="ui-rmf__tool ui-rmf__tool--primary" @click=${() => this.exportManifest()}>${exportIcon}<span>Export</span></button>
        </div>
      </div>
      <p class="ui-rmf__sr" role="status">${this.message}</p>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rmf"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 480px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rmf"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 480px;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="rmf"] *, [data-ui="rmf"] *::before, [data-ui="rmf"] *::after { box-sizing: border-box; }
[data-ui="rmf"] { grid-template-columns: minmax(0, 1fr); }
[data-ui="rmf"] svg { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rmf"] svg { stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rmf"] svg { stroke-width: 1.2; }
:where([data-ui="rmf"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="rmf"]) :is(h3, p, ul, dl, dd) { margin: 0; padding: 0; }
:where([data-ui="rmf"]) ul { list-style: none; }
[data-ui="rmf"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="rmf"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rmf__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card (Clean: the body of the one card) */
:where([data-look="standard"], [data-look="standard"] *).ui-rmf__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-rmf__inner { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-rmf__inner { padding: var(--tc-space-4); }
/* Head: title, the run id and when; the model badge – context-window's */
.ui-rmf__head { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, max-content); align-items: center; column-gap: var(--tc-space-3); }
/* The title and the badge share the first line; the run id and time get the full width below */
.ui-rmf__heading { display: contents; }
.ui-rmf__model { grid-column: 2; grid-row: 1; }
.ui-rmf__title { overflow: hidden; font-weight: var(--tc-font-weight-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-rmf__title { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rmf__title { font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-loose); color: var(--tc-text-strong); }
.ui-rmf__sub { display: flex; grid-column: 1 / -1; align-items: center; min-width: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
.ui-rmf__sub > :last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-rmf__run { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-rmf__sep { margin: 0 var(--tc-space-1-5); color: var(--tc-text-disabled); }
.ui-rmf__model { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); min-width: 0; height: 20px; color: var(--tc-text-secondary); white-space: nowrap; background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); }
:where([data-look="standard"], [data-look="standard"] *).ui-rmf__model { padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); font-family: var(--tc-font-mono); line-height: var(--tc-line-height-normal); }
:where([data-look="clean"], [data-look="clean"] *).ui-rmf__model { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); }
.ui-rmf__model > span:last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-rmf__model-icon { display: grid; flex: none; place-items: center; width: 12px; height: 12px; }
.ui-rmf__model-icon > * { width: 12px; height: 12px; }
/* The record: label on the left, value on the right; stacked when narrow */
.ui-rmf__list { display: grid; margin-top: var(--tc-space-3-5); }
.ui-rmf__row { display: grid; grid-template-columns: 92px minmax(0, 1fr); column-gap: var(--tc-space-3); padding: var(--tc-space-2-5) 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rmf__row:first-child { border-top: 0; padding-top: 0; }
.ui-rmf__row:last-child { padding-bottom: 0; }
.ui-rmf__key { padding-top: var(--tc-space-0-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-rmf__key { line-height: var(--tc-line-height-normal); }
.ui-rmf__val { min-width: 0; color: var(--tc-text-primary); }
.ui-rmf__val--line { display: flex; flex-wrap: wrap; align-items: center; column-gap: var(--tc-space-2); row-gap: var(--tc-space-1); }
.ui-rmf__code { min-width: 0; overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-rmf__hash { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-surface-well); }
.ui-rmf__instruction { font-weight: var(--tc-font-weight-medium); }
/* Copy: a small ghost icon button; a check for a moment after */
.ui-rmf__copy { display: inline-grid; flex: none; place-items: center; width: 24px; height: 24px; margin-left: calc(-1 * var(--tc-space-1)); border-radius: var(--tc-radius-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rmf__sub .ui-rmf__copy { margin-left: 0; }
.ui-rmf__copy:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-rmf__copy[data-done] { color: var(--tc-status-success-fg); }
.ui-rmf__copy svg, .ui-rmf__tool svg { animation: ui-rmf-in var(--tc-duration-base) var(--tc-ease-move) both; }
/* Settings: key–value chips */
.ui-rmf__settings { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-rmf__setting { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-rmf__setting-key { color: var(--tc-text-muted); }
.ui-rmf__setting-val { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-primary); }
/* Sources: a short list, with Show all */
.ui-rmf__sources { display: grid; gap: var(--tc-space-2); }
.ui-rmf__source { display: flex; align-items: flex-start; gap: var(--tc-space-2); min-width: 0; animation: ui-rmf-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-rmf__source-icon { display: grid; flex: none; place-items: center; width: 16px; height: 20px; color: var(--tc-icon-muted); }
.ui-rmf__source-text { display: grid; min-width: 0; }
.ui-rmf__source-label { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-rmf__source-detail { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-rmf__source-detail { line-height: var(--tc-line-height-tight); }
.ui-rmf__more { margin-top: var(--tc-space-1-5); border-radius: var(--tc-radius-xs); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); }
.ui-rmf__more:hover { text-decoration: underline; }
/* Intent: the person's words */
.ui-rmf__intent { display: block; quotes: "“" "”"; color: var(--tc-text-primary); }
/* Verification: a thin stacked bar of the reviewed claims, and the counts */
.ui-rmf__verify-summary { font-weight: var(--tc-font-weight-medium); }
.ui-rmf__verify-bar { display: flex; height: var(--tc-meter-h); margin-top: var(--tc-space-2); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-rmf__verify-seg { position: relative; flex: none; height: 100%; transition: width var(--tc-duration-slow) var(--tc-ease-move); }
.ui-rmf__verify-seg + .ui-rmf__verify-seg { box-shadow: inset 2px 0 0 var(--tc-surface-raised); }
[data-state="verified"] > .ui-rmf__swatch, .ui-rmf__verify-seg[data-state="verified"] { background: var(--tc-status-success-solid); }
[data-state="unverifiable"] > .ui-rmf__swatch, .ui-rmf__verify-seg[data-state="unverifiable"] { background: var(--tc-status-warning-solid); }
[data-state="incorrect"] > .ui-rmf__swatch, .ui-rmf__verify-seg[data-state="incorrect"] { background: var(--tc-status-danger-solid); }
[data-state="dismissed"] > .ui-rmf__swatch, .ui-rmf__verify-seg[data-state="dismissed"] { background: var(--tc-text-disabled); }
[data-state="pending"] > .ui-rmf__swatch { background: var(--tc-meter-track); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-rmf__verify-legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); margin-top: var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-rmf__verify-legend li { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-variant-numeric: tabular-nums; }
.ui-rmf__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); }
/* Standard: the tray below the card · Clean: the last row of the card, under a hairline */
.ui-rmf__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 44px; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-rmf__foot { padding: var(--tc-space-1-5) var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-rmf__foot { padding: 0 var(--tc-space-2) 0 var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); line-height: var(--tc-line-height-tight); }
.ui-rmf__foot-note { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-rmf__tools { display: flex; flex: none; align-items: center; gap: var(--tc-space-1); }
.ui-rmf__tool { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-rmf__tool:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-rmf__tool:active { transform: scale(0.97); }
.ui-rmf__tool[data-done] { color: var(--tc-status-success-fg); }
.ui-rmf__tool--primary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-rmf__tool--primary:hover { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow-hover); }
@keyframes ui-rmf-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
/* Narrow: labels above their values, tighter gutters */
@container (max-width: 400px) {
  :where([data-look="standard"], [data-look="standard"] *).ui-rmf__inner { padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-rmf__inner { padding: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-rmf__foot { padding: 0 var(--tc-space-2) 0 var(--tc-space-3-5); }
  .ui-rmf__row { grid-template-columns: minmax(0, 1fr); row-gap: var(--tc-space-1); }
  .ui-rmf__key { padding-top: 0; }
  .ui-rmf__foot-note { display: none; }
  .ui-rmf__tools { flex: 1; justify-content: flex-end; }
}
/* Touch screens: bigger targets */
@media (hover: none) and (pointer: coarse) {
  .ui-rmf__copy { width: 32px; height: 32px; }
  .ui-rmf__tool { height: var(--tc-control-h-lg); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rmf"] *, [data-ui="rmf"] *::before, [data-ui="rmf"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-run-manifest")) customElements.define("tc-run-manifest", TcRunManifest);

declare global {
  interface HTMLElementTagNameMap {
    "tc-run-manifest": TcRunManifest;
  }
}

import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, RequestController } from "./internal/controllers";

/*
 * <tc-evidence-coverage> – what an answer could and couldn't see. One row per source category, each current, stale
 * (with its age, as the app gives it) or not covered at all, and a summary line that says what was missing:
 * "Couldn't see Field reports. Lab results (14 months) is out of date."
 * Stale and missing rows carry "Request coverage" – a cancelable tc-coverage-request. Not prevented, the row shows
 * "Requested"; with a `requestCoverage` resolver it shows "Requesting…", then "Requested", or "Couldn't request"
 * with Retry. The app can set each source's `request` itself.
 *
 *   <tc-evidence-coverage .sources=${[{ id: "lab", label: "Lab results", status: "stale", age: "14 months" }]}>
 *   </tc-evidence-coverage>
 *
 * Two shapes:
 *   · a card (default) – Standard: the header on the gray tray above a white card; Clean: one white card, the header
 *     its first row;
 *   · `inline` – a quiet line under an answer: the summary and a "Sources" disclosure that folds out the rows.
 * Keyboard: Tab reaches each Request coverage (and Retry) button, and the disclosure when inline; Enter or Space
 * presses them. Nothing else is a control.
 */

export type EvidenceCoverageStatus = "current" | "stale" | "none";
/** Where a coverage request stands: "pending" while the app sends it, "requested" once sent, "failed" if it couldn't */
export type CoverageRequest = "pending" | "requested" | "failed";

export type CoverageSource = {
  id: string;
  /** The category's name, e.g. "Lab results" */
  label: string;
  status: EvidenceCoverageStatus;
  /** How old the newest evidence is, as the app words it – "14 months", "3d". Shown with stale sources */
  age?: string;
  /** A quiet second line, e.g. "Last import 12 Aug" or "No feed connected" */
  detail?: string;
  /** The request's state, when the app owns it; unset, the element keeps its own */
  request?: CoverageRequest;
};

/** Detail of tc-coverage-request */
export type CoverageRequestDetail = { id: string; source: CoverageSource };
/** Detail of tc-open-change (inline only) */
export type EvidenceCoverageOpenChange = { open: boolean };
/** Sends a coverage request; resolve when it's sent, reject if it couldn't be. The signal aborts when the element leaves the page */
export type CoverageRequestResolver = (source: CoverageSource, signal: AbortSignal) => Promise<unknown>;

const DEFAULT_LABELS: Record<EvidenceCoverageStatus, string> = { current: "Current", stale: "Stale", none: "No coverage" };

/* After Lucide (ISC, lucide.dev): radar (the header), circle-check, clock, eye-off, check, refresh, loader */
const headIcon = svg`<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"></path><path d="M4 6h.01"></path><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"></path><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"></path><path d="M12 18h.01"></path><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"></path><circle cx="12" cy="12" r="2"></circle><path d="m13.41 10.59 5.66-5.66"></path>`;
const icon = (body: TemplateResult) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const GLYPHS: Record<EvidenceCoverageStatus, () => TemplateResult> = {
  current: () => icon(svg`<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>`),
  stale: () => icon(svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`),
  none: () =>
    icon(
      svg`<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path><path d="m2 2 20 20"></path>`,
    ),
};
const checkIcon = () => icon(svg`<path d="M20 6 9 17l-5-5"></path>`);
const spinIcon = () => icon(svg`<path class="ui-evc__spin" d="M21 12a9 9 0 1 1-6.219-8.56"></path>`);
const chevron = () => icon(svg`<path d="m6 9 6 6 6-6"></path>`);

let instances = 0;
const lists = new Map<string, Intl.ListFormat>();
const listOf = (locale: string, items: string[]) => {
  let f = lists.get(locale);
  if (!f) lists.set(locale, (f = new Intl.ListFormat(locale, { type: "conjunction" })));
  return f.format(items);
};

/**
 * What an answer could and couldn't see: each source category current, stale or missing, with a request for coverage.
 * @tag tc-evidence-coverage
 * @fires tc-coverage-request - Request coverage (or Retry) was pressed ({ id, source }: CoverageRequestDetail); cancelable – prevented, the app sets the source's `request` itself
 * @fires tc-open-change - The inline disclosure opened or closed ({ open }: EvidenceCoverageOpenChange); cancelable
 */
export class TcEvidenceCoverage extends TcElement {
  static override ui = "evc";

  /** The heading, and the region's name */
  @property() accessor heading = "Evidence coverage";
  /** A quiet line under the heading – what the coverage is of, e.g. "For this answer" */
  @property() accessor scope = "";
  /** The source categories, in the order to show them */
  @property({ attribute: false }) accessor sources: CoverageSource[] = [];
  /** The words for each status */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<EvidenceCoverageStatus, string>> = {};
  /** The summary line; unset, it's written from the sources ("Couldn't see …") */
  @property() accessor summary = "";
  /** The request button's text */
  @property({ attribute: "request-label" }) accessor requestLabel = "Request coverage";
  /** Offer Request coverage on stale and missing sources. Default true */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor requestable = true;
  /** Sends a request and settles when it's sent – the element shows Requesting…, Requested or Retry. Unset, a request counts as sent */
  @property({ attribute: false }) accessor requestCoverage: CoverageRequestResolver | undefined = undefined;
  /** A quiet line under an answer instead of a card */
  @property({ type: Boolean, reflect: true }) accessor inline = false;
  /** Inline: whether the rows are folded out */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** Locale for joining names into a sentence */
  @property() accessor locale = "en-US";

  /** @internal Request states the element keeps, by source id */
  @state() private accessor requests: Record<string, CoverageRequest> = {};
  /** @internal The polite announcement */
  @state() private accessor announce = "";

  private readonly uid = `tc-evc${++instances}`;
  private readonly sender = new RequestController(this);

  constructor() {
    super();
    // A Request button that turns into "Requested" hands focus to the status that replaced it
    new FocusRescueController(this, (key) => (key ? this.querySelector(`[data-focus-key="${CSS.escape(key)}"]`) : null));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  /* ---------- Data ---------- */

  /** @internal */
  private label(status: EvidenceCoverageStatus) {
    return this.statusLabels[status] ?? DEFAULT_LABELS[status];
  }
  /** @internal The request state of a source: the app's, else the element's own */
  private requestOf(s: CoverageSource): CoverageRequest | undefined {
    return s.request ?? this.requests[s.id];
  }
  /** @internal "Stale · 14 months" */
  private stateText(s: CoverageSource) {
    return s.status === "stale" && s.age ? `${this.label("stale")} · ${s.age}` : this.label(s.status);
  }
  /** @internal What the answer couldn't see, as one or two sentences */
  private summaryText() {
    if (this.summary) return this.summary;
    const none = this.sources.filter((s) => s.status === "none");
    const stale = this.sources.filter((s) => s.status === "stale");
    if (!this.sources.length) return "No sources to show.";
    if (!none.length && !stale.length) return "Every source is current.";
    const parts: string[] = [];
    if (none.length) parts.push(`Couldn't see ${listOf(this.locale, none.map((s) => s.label))}.`);
    if (stale.length) {
      const names = listOf(this.locale, stale.map((s) => (s.age ? `${s.label} (${s.age})` : s.label)));
      parts.push(`${names} ${stale.length > 1 ? "are" : "is"} out of date.`);
    }
    return parts.join(" ");
  }
  /** @internal The worst status present – the summary's tone */
  private get tone(): EvidenceCoverageStatus {
    if (this.sources.some((s) => s.status === "none")) return "none";
    if (this.sources.some((s) => s.status === "stale")) return "stale";
    return "current";
  }

  /* ---------- Requests ---------- */

  private setRequest(id: string, r: CoverageRequest) {
    this.requests = { ...this.requests, [id]: r };
  }

  private async request(s: CoverageSource) {
    if (!this.emit<CoverageRequestDetail>("tc-coverage-request", { id: s.id, source: s }, { cancelable: true })) return;
    const resolver = this.requestCoverage;
    const said: Record<CoverageRequest, string> = {
      pending: `Requesting coverage for ${s.label}…`,
      requested: `Coverage requested for ${s.label}.`,
      failed: `Couldn't request coverage for ${s.label}.`,
    };
    await this.sender.run(resolver && ((signal) => resolver(s, signal)), (r) => {
      this.setRequest(s.id, r);
      this.announce = said[r];
    });
  }

  private toggle = () => {
    const next = !this.open;
    if (this.emit<EvidenceCoverageOpenChange>("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  };

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.dataset.tone = this.tone;
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    // Inline there's no heading on show: the region is named by its summary line
    if (this.getAttribute("aria-labelledby")?.startsWith(this.uid)) this.setAttribute("aria-labelledby", `${this.uid}-${this.inline ? "line" : "title"}`);
  }

  /* ---------- Render ---------- */

  private renderAction(s: CoverageSource) {
    if (!this.requestable || s.status === "current") return nothing;
    const r = this.requestOf(s);
    const key = `req-${s.id}`;
    if (r === "pending")
      return html`<span class="ui-evc__note" data-request="pending" tabindex="-1" data-focus-key=${key}>${spinIcon()}Requesting…</span>`;
    if (r === "requested")
      return html`<span class="ui-evc__note" data-request="requested" tabindex="-1" data-focus-key=${key}>${checkIcon()}Requested</span>`;
    if (r === "failed")
      return html`<span class="ui-evc__note" data-request="failed"
        >Couldn't request<button type="button" class="tc-btn-sm ui-evc__retry" data-focus-key=${key} aria-label=${`Retry the request for ${s.label}`} @click=${() => this.request(s)}>
          Retry
        </button></span
      >`;
    return html`<button type="button" class="tc-btn-sm" data-focus-key=${key} aria-label=${`${this.requestLabel} for ${s.label}`} @click=${() => this.request(s)}>
      ${this.requestLabel}
    </button>`;
  }

  private renderRows() {
    return html`<ul class="ui-evc__list" id=${`${this.uid}-list`} aria-label="Source categories">
      ${repeat(
        this.sources,
        (s) => s.id,
        (s) => html`<li class="ui-evc__row" data-status=${s.status}>
          <span class="ui-evc__glyph" data-status=${s.status}>${GLYPHS[s.status]()}</span>
          <span class="ui-evc__name">
            <span class="ui-evc__label">${s.label}</span>
            ${s.detail ? html`<span class="ui-evc__detail">${s.detail}</span>` : nothing}
          </span>
          <span class="ui-evc__state" data-status=${s.status}>${this.stateText(s)}</span>
          <span class="ui-evc__act">${this.renderAction(s)}</span>
        </li>`,
      )}
    </ul>`;
  }

  private renderSummary(id?: string) {
    return html`<p class="ui-evc__summary" id=${ifDefined(id)} data-tone=${this.tone}>
      <span class="ui-evc__glyph" data-status=${this.tone}>${GLYPHS[this.tone]()}</span><span>${this.summaryText()}</span>
    </p>`;
  }

  protected override render() {
    const live = html`<span class="tc-sr-only" role="status">${this.announce}</span>`;
    if (this.inline) {
      return html`<div class="ui-evc__line">
          ${this.renderSummary(`${this.uid}-line`)}
          ${this.sources.length
            ? html`<button type="button" class="ui-evc__toggle" aria-expanded=${this.open ? "true" : "false"} aria-controls=${`${this.uid}-list`} @click=${this.toggle}>
                Sources <span class="ui-evc__count">${this.sources.filter((s) => s.status === "current").length}/${this.sources.length}</span>${chevron()}
              </button>`
            : nothing}
        </div>
        ${this.open ? this.renderRows() : nothing}${live}`;
    }
    const current = this.sources.filter((s) => s.status === "current").length;
    const aside = this.sources.length
      ? html`<span class="ui-evc__pill" data-tone=${this.tone}>${current} of ${this.sources.length} current</span>`
      : undefined;
    const head = cardHead({ icon: headIcon, title: this.heading, subtitle: this.scope || undefined, id: `${this.uid}-title`, aside });
    const clean = this.resolvedLook === "clean";
    return html`${clean ? nothing : head}
      <div class="ui-evc__card">
        ${clean ? head : nothing}
        <div class="ui-evc__body">${this.renderSummary()}${this.sources.length ? this.renderRows() : nothing}</div>
      </div>
      ${live}`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="evc"]:not([inline]) {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-secondary);
}
[data-ui="evc"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 480px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="evc"] *, [data-ui="evc"] *::before, [data-ui="evc"] *::after { box-sizing: border-box; }
:where([data-ui="evc"]) :is(p, ul) { margin: 0; padding: 0; }
:where([data-ui="evc"]) ul { list-style: none; }
[data-ui="evc"] svg { display: block; flex: none; }
/* The white card (Clean: the one card) */
.ui-evc__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-evc__card { background: var(--tc-surface-raised); }
.ui-evc__body { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-evc__body { padding-top: var(--tc-space-1); }
/* The header pill: how many are current */
.ui-evc__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-evc__pill[data-tone="current"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-evc__pill[data-tone="stale"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-evc__pill[data-tone="none"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* The summary: what the answer couldn't see, first */
.ui-evc__summary { display: flex; align-items: flex-start; gap: var(--tc-space-2); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-evc__summary > .ui-evc__glyph { margin-top: var(--tc-space-0-5); }
/* Status colours: a glyph and a word, never colour alone */
.ui-evc__glyph { display: grid; flex: none; place-items: center; width: 16px; height: 16px; }
.ui-evc__glyph > svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-evc__glyph > svg { stroke-width: 1.5; }
.ui-evc__glyph[data-status="current"] { color: var(--tc-status-success-fg); }
.ui-evc__glyph[data-status="stale"] { color: var(--tc-status-warning-fg); }
.ui-evc__glyph[data-status="none"] { color: var(--tc-status-danger-fg); }
/* The rows */
.ui-evc__list { display: grid; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-evc__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "glyph name state" ". act act"; align-items: center; column-gap: var(--tc-space-2-5); row-gap: var(--tc-space-1-5); padding: var(--tc-space-2-5) 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-evc__row:last-child { border-bottom: 0; padding-bottom: 0; }
.ui-evc__row > .ui-evc__glyph { grid-area: glyph; align-self: start; margin-top: var(--tc-space-0-5); }
.ui-evc__name { grid-area: name; display: grid; min-width: 0; }
.ui-evc__label { min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-evc__detail { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); overflow-wrap: anywhere; }
.ui-evc__state { grid-area: state; justify-self: end; font-size: var(--tc-font-size-sm); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-evc__state[data-status="current"] { color: var(--tc-text-muted); }
.ui-evc__state[data-status="stale"] { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-evc__state[data-status="none"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-evc__act { grid-area: act; display: flex; justify-content: flex-start; min-width: 0; }
.ui-evc__act:empty { display: none; }
@container (min-width: 420px) {
  .ui-evc__row { grid-template-columns: auto minmax(0, 1fr) auto auto; grid-template-areas: "glyph name state act"; }
  .ui-evc__act { justify-content: flex-end; min-width: 132px; }
  .ui-evc__act:empty { display: flex; }
}
/* Request coverage: the small secondary button (.tc-btn-sm); Retry the ghost one */
.ui-evc__retry { background: none; box-shadow: none; color: var(--tc-action-ghost-fg); text-decoration: underline; text-underline-offset: 2px; }
.ui-evc__retry:hover { background: var(--tc-action-ghost-bg-hover); box-shadow: none; color: var(--tc-text-primary); }
[data-ui="evc"] :is(button, [tabindex="-1"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="evc"] [tabindex="-1"]:focus:not(:focus-visible) { outline: none; }
.ui-evc__note { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; border-radius: var(--tc-radius-sm); animation: ui-evc-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-evc__note > svg { width: 14px; height: 14px; }
.ui-evc__note[data-request="requested"] { color: var(--tc-status-success-fg); }
.ui-evc__note[data-request="failed"] { gap: var(--tc-space-1); color: var(--tc-status-danger-fg); }
.ui-evc__spin { transform-origin: 12px 12px; animation: ui-evc-spin var(--tc-duration-slowest) linear infinite; }
/* Inline: a quiet line under an answer */
[data-ui="evc"][inline] { max-width: none; font-size: var(--tc-font-size-sm); }
.ui-evc__line { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); }
[inline] > .ui-evc__line .ui-evc__summary { flex: 1 1 240px; font-weight: var(--tc-font-weight-regular); color: var(--tc-text-secondary); }
[inline] > .ui-evc__line .ui-evc__summary > .ui-evc__glyph { margin-top: 0; }
.ui-evc__toggle { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-action-ghost-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-evc__toggle:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-evc__toggle > svg { width: 14px; height: 14px; transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-evc__toggle[aria-expanded="true"] > svg { transform: rotate(180deg); }
.ui-evc__count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
[inline] > .ui-evc__list { margin-top: var(--tc-space-1-5); padding: 0 var(--tc-space-3); border: 0; border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); animation: ui-evc-in var(--tc-duration-base) var(--tc-ease-move) both; }
[inline] > .ui-evc__list .ui-evc__row:last-child { padding-bottom: var(--tc-space-2-5); }
@keyframes ui-evc-in { from { opacity: 0; transform: translateY(-2px); } }
@keyframes ui-evc-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="evc"] *, [data-ui="evc"] *::before, [data-ui="evc"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-evc__pill { border: 1px solid ButtonText; }
}
`;
}

if (!customElements.get("tc-evidence-coverage")) customElements.define("tc-evidence-coverage", TcEvidenceCoverage);

declare global {
  interface HTMLElementTagNameMap {
    "tc-evidence-coverage": TcEvidenceCoverage;
  }
}

import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-citation-badge> – a small badge of how a work is cited, to embed beside a paper or a profile: a count per
 * kind of citation – by default Publications, Supporting, Mentioning and Contrasting – each with its mark. The
 * page may put its own source name or logo on top (`source`, `logo`); there is no brand line otherwise.
 *   · layout "labelled" shows each kind's name, mark and count; "compact" only the mark and the count
 *   · the whole badge is one control: a link with `href`, a button with `openable` (tc-open), else an image that is
 *     focusable so the tooltip can be reached. A link or button is named by what it shows – "Publications 522,
 *     Supporting 29 …" (compact adds each kind's name for screen readers) – and an image by a summary, "Citations:
 *     522 publications, 29 supporting …"
 *   · on hover or focus a tooltip lists each kind in words, its count and what it means; Escape hides it
 * Standard: a white badge with a soft shadow. Clean: a hairline badge, quieter marks.
 *
 *   <tc-citation-badge .counts=${{ publications: 522, supporting: 29, mentioning: 348, contrasting: 7 }}></tc-citation-badge>
 */

export type CitationTone = "neutral" | "success" | "info" | "warning" | "danger";
export type CitationIcon = "document" | "supporting" | "mentioning" | "contrasting";
export type CitationRow = {
  id: string;
  label: string;
  /** A built-in mark or an element to show (cloned) */
  icon?: CitationIcon | Element;
  tone?: CitationTone;
  /** What this kind means, for the tooltip: "cites this work as evidence for its claim" */
  meaning?: string;
};

/** Details of the events */
export type CitationOpen = { href?: string };

/** The kinds shown when the page gives none */
export const defaultCitationRows: CitationRow[] = [
  { id: "publications", label: "Publications", icon: "document", tone: "neutral", meaning: "publications that cite this work" },
  { id: "supporting", label: "Supporting", icon: "supporting", tone: "success", meaning: "cites this work as evidence for its claim" },
  { id: "mentioning", label: "Mentioning", icon: "mentioning", tone: "neutral", meaning: "refers to this work without taking a side" },
  { id: "contrasting", label: "Contrasting", icon: "contrasting", tone: "info", meaning: "reports findings that question or disagree with it" },
];

/* File-text, circle-check, circle-slash and circle-help: Lucide (ISC, lucide.dev) */
const ICONS: Record<CitationIcon, ReturnType<typeof svg>> = {
  document: svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path>`,
  supporting: svg`<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>`,
  mentioning: svg`<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path>`,
  contrasting: svg`<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path>`,
};
const mark = (icon: CitationIcon | Element | undefined) =>
  icon instanceof Element
    ? icon.cloneNode(true)
    : html`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[icon ?? "document"]}</svg>`;
let uidCount = 0;

/**
 * A small badge of citation counts by kind – Publications, Supporting, Mentioning, Contrasting – with a tooltip
 * that says what each means, and an optional link to the details.
 * @tag tc-citation-badge
 * @fires tc-open - The badge was opened (clicked, or Enter on it) with `href` or `openable` ({ href }: CitationOpen); cancelable – prevented, a link isn't followed
 */
export class TcCitationBadge extends TcElement {
  static override ui = "ctb";

  /** Each kind's count by id: { publications: 522, supporting: 29 … }; a kind without one shows 0 */
  @property({ attribute: false }) accessor counts: Record<string, number> = {};
  /** The kinds, in order; by default Publications, Supporting, Mentioning and Contrasting */
  @property({ attribute: false }) accessor rows: CitationRow[] = defaultCitationRows;
  /** "labelled": name, mark and count; "compact": the mark and the count */
  @property({ reflect: true }) accessor layout: "labelled" | "compact" = "labelled";
  /** A source's name shown on top, e.g. your index's name; none by default */
  @property() accessor source: string | undefined = undefined;
  /** A logo shown on top instead of `source` (cloned); give it an accessible name, or set `source` too */
  @property({ attribute: false }) accessor logo: Element | undefined = undefined;
  /** What the counts are, for the badge's name when there's no `source` */
  @property() accessor label = "Citations";
  /** Where the details are – the badge becomes a link */
  @property() accessor href: string | undefined = undefined;
  /** Without `href`, makes the badge a button that fires tc-open */
  @property({ type: Boolean }) accessor openable = false;
  /** The link's hint in the tooltip */
  @property({ attribute: "details-label" }) accessor detailsLabel = "See more details";
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor tip = false;

  private uid = `tc-ctb-${++uidCount}`;

  private count(id: string) {
    const n = this.counts[id];
    return typeof n === "number" && Number.isFinite(n) ? n : 0;
  }
  private num(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }
  /** "Citations: 522 publications, 29 supporting, 348 mentioning and 7 contrasting" */
  private get summary() {
    const parts = this.rows.map((r) => `${this.num(this.count(r.id))} ${r.label.toLowerCase()}`);
    const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : (parts[0] ?? "none");
    return `${this.source ?? this.label}: ${list}`;
  }

  private open(e: Event) {
    if (!this.emit<CitationOpen>("tc-open", { href: this.href }, { cancelable: true })) e.preventDefault();
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.tip) {
      e.preventDefault();
      e.stopPropagation();
      this.tip = false;
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!this.rows.length) this.rows = defaultCitationRows;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("pointerenter", this.show);
    this.addEventListener("pointerleave", this.hide);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("pointerenter", this.show);
    this.removeEventListener("pointerleave", this.hide);
  }
  private show = () => (this.tip = true);
  private hide = () => {
    if (!this.querySelector(".ui-ctb__badge:focus-visible")) this.tip = false;
  };

  private renderInner() {
    const top = this.logo
      ? html`<span class="ui-ctb__source" data-logo>${this.logo.cloneNode(true)}</span>`
      : this.source
        ? html`<span class="ui-ctb__source">${this.source}</span>`
        : nothing;
    return html`${top}
      <span class="ui-ctb__rows">
        ${this.rows.map(
          (r) => html`<span class="ui-ctb__row" data-kind=${r.id} data-tone=${r.tone ?? "neutral"}>
            ${this.layout === "labelled" ? html`<span class="ui-ctb__label">${r.label}</span>` : nothing}
            <span class="ui-ctb__mark">${mark(r.icon)}</span>
            <span class="ui-ctb__count">${this.num(this.count(r.id))}</span>${this.layout === "compact" ? html`<span class="ui-ctb__sr"> ${r.label.toLowerCase()}</span>` : nothing}
          </span>`,
        )}
      </span>`;
  }

  protected override render() {
    const tipId = `${this.uid}-tip`;
    const actionable = !!this.href || this.openable;
    const common = {
      focus: () => (this.tip = true),
      blur: () => (this.tip = false),
    };
    const badge = this.href
      ? html`<a class="ui-ctb__badge" href=${this.href} aria-describedby=${tipId} @click=${(e: Event) => this.open(e)} @focus=${common.focus} @blur=${common.blur} @keydown=${this.onKey}>${this.renderInner()}</a>`
      : this.openable
        ? html`<button type="button" class="ui-ctb__badge" aria-describedby=${tipId} @click=${(e: Event) => this.open(e)} @focus=${common.focus} @blur=${common.blur} @keydown=${this.onKey}>${this.renderInner()}</button>`
        : html`<span class="ui-ctb__badge" role="img" tabindex="0" aria-label=${this.summary} aria-describedby=${tipId} @focus=${common.focus} @blur=${common.blur} @keydown=${this.onKey}>${this.renderInner()}</span>`;
    return html`${badge}
      <span class="ui-ctb__tip" id=${tipId} role="tooltip" ?data-open=${this.tip}>
        ${this.rows.map(
          (r) => html`<span class="ui-ctb__tip-row" data-tone=${r.tone ?? "neutral"}
            ><span class="ui-ctb__tip-mark" aria-hidden="true">${mark(r.icon)}</span
            ><span class="ui-ctb__tip-text"><span class="ui-ctb__tip-name">${r.label} · ${this.num(this.count(r.id))}</span>${r.meaning ? html` – ${r.meaning}` : nothing}</span></span
          >`,
        )}
        ${actionable ? html`<span class="ui-ctb__tip-hint">${this.detailsLabel}</span>` : nothing}
      </span>`;
  }

  static override css = /* css */ `
[data-ui="ctb"] {
  position: relative;
  display: inline-block;
  vertical-align: top;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="ctb"] *, [data-ui="ctb"] *::before, [data-ui="ctb"] *::after { box-sizing: border-box; }
[data-ui="ctb"] svg { display: block; flex: none; }
/* The badge: one control holding the source line and the counts */
.ui-ctb__badge { display: inline-grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); color: inherit; font: inherit; text-decoration: none; text-align: left; cursor: default; outline: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ctb__badge { border: 0; box-shadow: var(--tc-shadow-control); }
:where([data-look="clean"], [data-look="clean"] *).ui-ctb__badge { border: var(--tc-hairline) solid var(--tc-border-default); }
a.ui-ctb__badge, button.ui-ctb__badge { cursor: pointer; margin: 0; }
button.ui-ctb__badge { border: 0; }
:where([data-look="clean"], [data-look="clean"] *)button.ui-ctb__badge { border: var(--tc-hairline) solid var(--tc-border-default); }
:is(a, button).ui-ctb__badge:hover { box-shadow: var(--tc-shadow-raised-hover); }
.ui-ctb__badge:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ctb__source { display: block; font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); }
.ui-ctb__source[data-logo] > * { max-height: 24px; width: auto; }
/* The counts: name, mark and count – or mark and count when compact */
.ui-ctb__rows { display: grid; grid-template-columns: auto auto minmax(3ch, auto); align-items: center; gap: var(--tc-space-1) var(--tc-space-2); }
:where([data-ui="ctb"][layout="compact"]) .ui-ctb__rows { grid-template-columns: auto minmax(3ch, auto); }
.ui-ctb__row { display: contents; }
.ui-ctb__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.ui-ctb__label { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
.ui-ctb__mark { display: grid; place-items: center; color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *) .ui-ctb__mark svg { stroke-width: 1.6; }
[data-tone="success"] > .ui-ctb__mark { color: var(--tc-status-success-fg); }
[data-tone="info"] > .ui-ctb__mark { color: var(--tc-status-info-fg); }
[data-tone="warning"] > .ui-ctb__mark { color: var(--tc-status-warning-fg); }
[data-tone="danger"] > .ui-ctb__mark { color: var(--tc-status-danger-fg); }
.ui-ctb__row[data-kind="mentioning"] > .ui-ctb__mark { color: var(--tc-text-primary); }
.ui-ctb__count { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: right; font-variant-numeric: tabular-nums; }
/* The tooltip: each kind in words, under the badge */
.ui-ctb__tip { position: absolute; top: calc(100% + var(--tc-space-1-5)); left: 0; z-index: var(--tc-z-popover); display: none; gap: var(--tc-space-1-5); width: max-content; max-width: 300px; padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); color: var(--tc-tooltip-fg); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-tooltip-font-size); line-height: var(--tc-line-height-snug); pointer-events: none; }
.ui-ctb__tip[data-open] { display: grid; animation: ui-ctb-in var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ctb__tip-row { display: flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-ctb__tip-mark { display: grid; place-items: center; color: inherit; }
.ui-ctb__tip-mark svg { width: 14px; height: 14px; }
.ui-ctb__tip-name { font-weight: var(--tc-font-weight-medium); }
.ui-ctb__tip-hint { padding-top: var(--tc-space-1); border-top: var(--tc-hairline) solid color-mix(in srgb, currentColor 25%, transparent); font-weight: var(--tc-font-weight-medium); }
@keyframes ui-ctb-in { from { opacity: 0; transform: translateY(-2px); } }
@media (forced-colors: active) {
  .ui-ctb__badge { border: 1px solid CanvasText; }
  .ui-ctb__tip { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ctb"] *, [data-ui="ctb"] *::before, [data-ui="ctb"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-citation-badge")) customElements.define("tc-citation-badge", TcCitationBadge);

declare global {
  interface HTMLElementTagNameMap {
    "tc-citation-badge": TcCitationBadge;
  }
}

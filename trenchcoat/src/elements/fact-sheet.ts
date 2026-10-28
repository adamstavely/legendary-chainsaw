import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { copyText } from "./internal/util";

/*
 * <tc-fact-sheet> – what's known about a person, an organisation or a record, and how far each fact can be trusted:
 * labelled values in sections ("Biographic", "Physical description"), each value with a small tag naming its
 * source and grade, e.g. "Registry · A1". Grades follow the Admiralty (NATO) scale – a letter for how reliable the
 * source is (A completely reliable … E unreliable, F can't be judged) and a digit for how credible the information is
 * (1 confirmed … 5 improbable, 6 can't be judged). The element sorts each grade into a confidence band – high,
 * medium, low or unknown – that tints the tag and fills a three-bar mark, so the band never rests on colour alone; a
 * source can set its own band. "How grades work" opens the scale below the header.
 *   · a fact with `alternatives` is conflicting: every reading shows with its own source, under a "Conflicting" pill
 *   · a fact with no value reads `missingLabel` ("Not known")
 *   · `copyable` (on the element or a fact) adds a Copy button to the value; it fires a cancelable tc-copy
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row. Sections sit
 * side by side when the element is wide enough, unless `columns` is 1.
 *
 *   <tc-fact-sheet .sections=${[{ id: "bio", title: "Biographic", facts: [{ id: "dob", label: "Date of birth",
 *     value: "19 March 1984", source: { label: "Registry", grade: "A1" } }] }]}></tc-fact-sheet>
 */

/** A list with a check: Lucide (ISC, lucide.dev) */
const sheetIcon = svg`<path d="M13 5h8"></path><path d="M13 12h8"></path><path d="M13 19h8"></path><path d="m3 17 2 2 4-4"></path><rect x="3" y="4" width="6" height="6" rx="1"></rect>`;

/** How far a value can be trusted, from its grade */
export type FactBand = "high" | "medium" | "low" | "unknown";
export type FactSource = {
  /** Where the value comes from, short: "Registry", "OSINT", "Customer" */
  label: string;
  /** The Admiralty grade: a reliability letter A–F and a credibility digit 1–6, e.g. "B2" */
  grade?: string;
  /** Sets the band instead of working it out from the grade */
  band?: FactBand;
  /** One line on the source, read after the grade: "Companies House filing, 2025" */
  note?: string;
};
/** One reading of a fact */
export type FactReading = { value: string | string[]; source?: FactSource };
export type Fact = {
  id: string;
  label: string;
  /** The value – a string, or several; empty or missing reads `missingLabel` */
  value?: string | string[];
  source?: FactSource;
  /** Other readings that disagree with `value` – the fact then shows as conflicting */
  alternatives?: FactReading[];
  /** Adds a Copy button to this value (the element's `copyable` does it for all) */
  copyable?: boolean;
};
export type FactSection = { id: string; title: string; facts: Fact[] };

/** Details of the events */
export type FactCopy = { fact: string; text: string };

const RELIABILITY: Record<string, string> = {
  A: "completely reliable",
  B: "usually reliable",
  C: "fairly reliable",
  D: "not usually reliable",
  E: "unreliable",
  F: "reliability can't be judged",
};
const CREDIBILITY: Record<string, string> = {
  "1": "confirmed",
  "2": "probably true",
  "3": "possibly true",
  "4": "doubtful",
  "5": "improbable",
  "6": "truth can't be judged",
};
const BAND_LABEL: Record<FactBand, string> = { high: "High confidence", medium: "Medium confidence", low: "Low confidence", unknown: "Confidence unknown" };
const BARS: Record<FactBand, number> = { high: 3, medium: 2, low: 1, unknown: 0 };

/** The band a grade falls in: A–B with 1–2 is high, D–E or 4–5 is low, F or 6 (or no grade) unknown, else medium */
export function factBand(grade: string | undefined): FactBand {
  const m = /^([A-F])([1-6])$/i.exec(grade?.trim() ?? "");
  if (!m) return "unknown";
  const r = m[1].toUpperCase();
  const c = m[2];
  if (r === "F" || c === "6") return "unknown";
  if ("DE".includes(r) || "45".includes(c)) return "low";
  if ("AB".includes(r) && "12".includes(c)) return "high";
  return "medium";
}

/** A grade in words: "A1" → "completely reliable source, confirmed" */
export function gradeWords(grade: string | undefined) {
  const m = /^([A-F])([1-6])$/i.exec(grade?.trim() ?? "");
  if (!m) return "";
  return `${RELIABILITY[m[1].toUpperCase()]} source, ${CREDIBILITY[m[2]]}`;
}

let uidCount = 0;
const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v.filter((x) => x !== "") : v === "" ? [] : [v]);

/* Copy and its done state: Lucide (ISC, lucide.dev) */
const lucide = (body: ReturnType<typeof svg>) =>
  html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const copyIcon = () => lucide(svg`<rect width="14" height="14" x="8" y="8" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`);
const doneIcon = () => lucide(svg`<path d="M20 6 9 17l-5-5"></path>`);
const alertIcon = () => lucide(svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`);

/**
 * Facts in sections, each value tagged with its source and an Admiralty grade, tinted and marked by confidence –
 * with conflicting readings side by side, unknowns said plainly and an optional Copy per value.
 * @tag tc-fact-sheet
 * @fires tc-copy - A value's Copy was pressed ({ fact, text }: FactCopy); cancelable – prevented, the element doesn't copy, so the page can copy its own way
 */
export class TcFactSheet extends TcElement {
  static override ui = "fsh";

  /** The heading */
  @property() accessor heading = "Facts";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The sections and their facts, in order */
  @property({ attribute: false }) accessor sections: FactSection[] = [];
  /** 2 puts sections side by side when there's room (from about 720 px); 1 keeps them stacked */
  @property({ type: Number }) accessor columns: 1 | 2 = 2;
  /** Adds a Copy button to every value */
  @property({ type: Boolean }) accessor copyable = false;
  /** What a fact with no value reads */
  @property({ attribute: "missing-label" }) accessor missingLabel = "Not known";
  /** Hides "How grades work", for a page that explains the scale elsewhere */
  @property({ type: Boolean, attribute: "no-legend" }) accessor noLegend = false;

  @state() private accessor legendOpen = false;
  @state() private accessor copied: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-fsh-${++uidCount}`;
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
  }

  private bandOf(source: FactSource | undefined): FactBand {
    return source?.band ?? factBand(source?.grade);
  }

  private async copy(fact: Fact) {
    const text = list(fact.value).join(", ");
    if (!this.emit<FactCopy>("tc-copy", { fact: fact.id, text }, { cancelable: true })) return;
    if (!(await copyText(text))) {
      this.announce = "Couldn't copy";
      return;
    }
    this.copied = fact.id;
    this.announce = `${fact.label} copied`;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => (this.copied = null), 1600);
  }

  /* ---------- Rendering ---------- */

  private renderTag(source: FactSource | undefined) {
    if (!source) return nothing;
    const band = this.bandOf(source);
    const words = gradeWords(source.grade);
    const spoken = `Source: ${source.label}${source.grade ? `, grade ${source.grade.toUpperCase()}` : ""}${words ? ` (${words})` : ""}. ${BAND_LABEL[band]}${source.note ? `. ${source.note}` : ""}`;
    return html`<span class="ui-fsh__tag" data-band=${band} title=${`${BAND_LABEL[band]}${words ? ` – ${words}` : ""}${source.note ? `\n${source.note}` : ""}`}>
      <span class="ui-fsh__bars" aria-hidden="true">${[1, 2, 3].map((b) => html`<span class="ui-fsh__bar" ?data-on=${b <= BARS[band]}></span>`)}</span>
      <span aria-hidden="true">${source.label}${source.grade ? html` · <span class="ui-fsh__grade">${source.grade.toUpperCase()}</span>` : nothing}</span>
      <span class="ui-fsh__sr">${spoken}</span>
    </span>`;
  }

  private renderValues(value: string | string[] | undefined) {
    const items = list(value);
    if (!items.length) return html`<span class="ui-fsh__missing">${this.missingLabel}</span>`;
    if (items.length === 1) return html`<span class="ui-fsh__text">${items[0]}</span>`;
    return html`<ul class="ui-fsh__items">${items.map((v) => html`<li>${v}</li>`)}</ul>`;
  }

  private renderFact(fact: Fact) {
    const id = `${this.uid}-${fact.id}`;
    const conflict = !!fact.alternatives?.length;
    const canCopy = (this.copyable || fact.copyable) && list(fact.value).length > 0;
    return html`<div class="ui-fsh__row" data-fact=${fact.id} ?data-conflict=${conflict}>
      <dt class="ui-fsh__label" id=${`${id}-label`}>
        ${fact.label}
        ${conflict ? html`<span class="ui-fsh__conflict">${alertIcon()}Conflicting</span>` : nothing}
      </dt>
      <dd class="ui-fsh__value">
        <div class="ui-fsh__reading">
          ${this.renderValues(fact.value)} ${this.renderTag(fact.source)}
          ${canCopy
            ? html`<button
                type="button"
                class="ui-fsh__copy"
                aria-label=${`Copy ${fact.label}`}
                ?data-done=${this.copied === fact.id}
                @click=${() => void this.copy(fact)}
              >${this.copied === fact.id ? doneIcon() : copyIcon()}</button>`
            : nothing}
        </div>
        ${conflict
          ? fact.alternatives!.map((alt) => html`<div class="ui-fsh__reading ui-fsh__reading--alt"><span class="ui-fsh__or" aria-hidden="true">or</span><span class="ui-fsh__sr">Another source says</span>${this.renderValues(alt.value)} ${this.renderTag(alt.source)}</div>`)
          : nothing}
      </dd>
    </div>`;
  }

  private renderLegend() {
    const id = this.uid;
    return html`<div class="ui-fsh__legend" id=${`${id}-legend`} role="region" aria-label="How grades work">
      <p class="ui-fsh__legend-intro">Each value is tagged with its source and a grade: a letter for the source and a number for the information.</p>
      <div class="ui-fsh__scales">
        <dl class="ui-fsh__scale">
          ${Object.entries(RELIABILITY).map(([k, v]) => html`<div><dt>${k}</dt><dd>${v[0].toUpperCase() + v.slice(1)}</dd></div>`)}
        </dl>
        <dl class="ui-fsh__scale">
          ${Object.entries(CREDIBILITY).map(([k, v]) => html`<div><dt>${k}</dt><dd>${v[0].toUpperCase() + v.slice(1)}</dd></div>`)}
        </dl>
      </div>
      <ul class="ui-fsh__bands">
        ${(["high", "medium", "low", "unknown"] as FactBand[]).map(
          (b) => html`<li><span class="ui-fsh__tag" data-band=${b} aria-hidden="true"><span class="ui-fsh__bars">${[1, 2, 3].map((n) => html`<span class="ui-fsh__bar" ?data-on=${n <= BARS[b]}></span>`)}</span></span>${BAND_LABEL[b]}<span class="ui-fsh__band-rule">${b === "high" ? "A–B and 1–2" : b === "medium" ? "the rest" : b === "low" ? "D–E or 4–5" : "F, 6 or no grade"}</span></li>`,
        )}
      </ul>
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const facts = this.sections.flatMap((s) => s.facts);
    const empty = !facts.length;
    return html`
      <span class="ui-fsh__sr" role="status">${this.announce}</span>
      ${cardHead({
        icon: sheetIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside:
          empty || this.noLegend
            ? nothing
            : html`<button type="button" class="ui-fsh__legend-btn" aria-expanded=${this.legendOpen ? "true" : "false"} aria-controls=${`${id}-legend`} @click=${() => (this.legendOpen = !this.legendOpen)}>How grades work</button>`,
      })}
      <div class="ui-fsh__card">
        ${this.legendOpen && !this.noLegend && !empty ? this.renderLegend() : nothing}
        ${empty
          ? html`<p class="ui-fsh__empty">No facts to show yet.</p>`
          : html`<div class="ui-fsh__sections" ?data-columns=${this.columns !== 1}>
              ${repeat(
                this.sections.filter((s) => s.facts.length),
                (s) => s.id,
                (s) => html`<section class="ui-fsh__section" aria-labelledby=${`${id}-s-${s.id}`}>
                  <h4 class="ui-fsh__section-title" id=${`${id}-s-${s.id}`}>${s.title}</h4>
                  <dl class="ui-fsh__list">${repeat(s.facts, (f) => f.id, (f) => this.renderFact(f))}</dl>
                </section>`,
              )}
            </div>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fsh"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fsh"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="fsh"] *, [data-ui="fsh"] *::before, [data-ui="fsh"] *::after { box-sizing: border-box; }
:where([data-ui="fsh"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="fsh"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="fsh"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="fsh"] h4, [data-ui="fsh"] p, [data-ui="fsh"] dl, [data-ui="fsh"] dd { margin: 0; }
[data-ui="fsh"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fsh"] svg[stroke-width] { stroke-width: 1.6; }
.ui-fsh__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fsh__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header's legend button, and the scale it opens ----- */
.ui-fsh__legend-btn { flex: none; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fsh__legend-btn:hover, .ui-fsh__legend-btn[aria-expanded="true"] { background: var(--tc-action-ghost-bg-hover); }
.ui-fsh__legend { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-fill-subtle); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); animation: ui-fsh-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-fsh__legend-intro { color: var(--tc-text-secondary); }
.ui-fsh__scales { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--tc-space-1) var(--tc-space-6); }
.ui-fsh__scale > div { display: flex; gap: var(--tc-space-2); }
.ui-fsh__scale dt { width: 1.2em; font-family: var(--tc-font-mono); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-fsh__scale dd { color: var(--tc-text-secondary); }
.ui-fsh__bands { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5) var(--tc-space-4); }
.ui-fsh__bands li { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); }
.ui-fsh__band-rule { color: var(--tc-text-muted); }
/* ----- Sections, side by side when there's room ----- */
.ui-fsh__sections { display: grid; gap: var(--tc-space-1) var(--tc-space-6); padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-fsh__sections { padding-top: 0; }
@container (min-width: 720px) { .ui-fsh__sections[data-columns] { grid-template-columns: 1fr 1fr; align-items: start; } }
.ui-fsh__section { min-width: 0; padding-top: var(--tc-space-2); }
.ui-fsh__section-title { padding-bottom: var(--tc-space-1-5); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
/* ----- A fact: label, value(s) and the source tag ----- */
.ui-fsh__row { display: grid; grid-template-columns: minmax(96px, 36%) 1fr; gap: var(--tc-space-3); padding: var(--tc-space-2) 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-fsh__label { display: flex; flex-direction: column; align-items: flex-start; gap: var(--tc-space-1); min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-fsh__value { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-fsh__reading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; }
.ui-fsh__text, .ui-fsh__items { flex: 1 1 auto; min-width: 0; color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
:where([data-look="standard"], [data-look="standard"] *).ui-fsh__text { font-weight: var(--tc-font-weight-medium); }
.ui-fsh__items li + li { margin-top: var(--tc-space-0-5); }
.ui-fsh__missing { flex: 1 1 auto; font-style: italic; color: var(--tc-text-muted); }
.ui-fsh__reading--alt { padding-top: var(--tc-space-1-5); border-top: var(--tc-hairline) dashed var(--tc-border-default); }
.ui-fsh__or { flex: none; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-fsh__conflict { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-status-warning-fg); }
.ui-fsh__conflict svg { width: 11px; height: 11px; }
/* The source tag: mono, tinted by band, with a three-bar mark so the band isn't colour alone */
.ui-fsh__tag { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-radius-badge); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; white-space: nowrap; cursor: help; }
.ui-fsh__tag[data-band="high"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-fsh__tag[data-band="medium"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-fsh__tag[data-band="low"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-fsh__tag[data-band="unknown"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-fsh__bars { display: inline-flex; align-items: flex-end; gap: var(--tc-space-0-5); height: 9px; }
.ui-fsh__bar { width: 2px; border-radius: var(--tc-radius-2xs); background: currentColor; opacity: 0.25; }
.ui-fsh__bar:nth-child(1) { height: 4px; }
.ui-fsh__bar:nth-child(2) { height: 6.5px; }
.ui-fsh__bar:nth-child(3) { height: 9px; }
.ui-fsh__bar[data-on] { opacity: 1; }
.ui-fsh__grade { font-weight: var(--tc-font-weight-semibold); }
.ui-fsh__copy { display: grid; flex: none; place-items: center; width: 24px; height: 24px; align-self: center; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); opacity: 0; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fsh__row:hover .ui-fsh__copy, .ui-fsh__copy:focus-visible, .ui-fsh__copy[data-done] { opacity: 1; }
.ui-fsh__copy:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-fsh__copy[data-done] { color: var(--tc-status-success-fg); }
.ui-fsh__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@keyframes ui-fsh-in { from { opacity: 0; transform: translateY(-3px); } }
@container (max-width: 420px) {
  .ui-fsh__row { grid-template-columns: 1fr; gap: var(--tc-space-1); }
  .ui-fsh__label { flex-direction: row; align-items: center; }
}
@media (hover: none) { .ui-fsh__copy { opacity: 1; } }
@media (forced-colors: active) { .ui-fsh__tag { border: 1px solid CanvasText; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="fsh"] *, [data-ui="fsh"] *::before, [data-ui="fsh"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-fact-sheet")) customElements.define("tc-fact-sheet", TcFactSheet);

declare global {
  interface HTMLElementTagNameMap {
    "tc-fact-sheet": TcFactSheet;
  }
}

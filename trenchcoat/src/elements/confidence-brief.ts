import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { copyText } from "./internal/util";

/*
 * <tc-confidence-brief> – an answer explained for someone who wasn't in the session: a short document that reads on
 * its own, printed, pasted into an email or attached to a decision. In order:
 *   · the conclusion, with how confident it is;
 *   · the kind of uncertainty – data, model, disagreement or time, as labels, with a sentence on why;
 *   · what it rests on (optional), what would change it, the key assumptions and the signs to watch;
 *   · the track record on similar questions ("right 17 of 20"), drawn as one dot per question;
 *   · a reference to the provenance record – pressing it fires tc-provenance-open; the app opens the record.
 * "Copy as text" puts the whole brief on the clipboard as plain text (cancelable tc-copy; `toText()` returns the same
 * text). Everything is a property; the element calls nothing.
 * Standard: the header and the reference sit on the gray tray around a white page. Clean: one white card, the header
 * its first row, the reference its last. Both print without the tray, the shadows or the copy button.
 *
 *   <tc-confidence-brief heading="Will annual pricing reduce churn?" conclusion="Probably, by 2–4 points." confidence="moderate"
 *     .uncertainty=${["data", "time"]} .record=${{ right: 17, total: 20 }} .provenanceId=${ref}></tc-confidence-brief>
 *
 * Keyboard: Tab reaches "Copy as text" and the provenance reference; nothing else is a control.
 */

export type ConfidenceLevel = "high" | "moderate" | "low";
export type ConfidenceUncertaintyKind = "data" | "model" | "disagreement" | "time";
/** How often similar conclusions turned out right */
export type ConfidenceRecord = {
  /** How many similar questions it got right */
  right: number;
  /** How many similar questions have a known outcome */
  total: number;
  /** What counts as similar, e.g. "Pricing questions since 2024" */
  note?: string;
};
/** Detail of tc-provenance-open */
export type ConfidenceProvenanceOpen = { id: string };
/** Detail of tc-copy: the brief as plain text */
export type ConfidenceCopy = { text: string };

const LEVELS: Record<ConfidenceLevel, string> = { high: "High confidence", moderate: "Moderate confidence", low: "Low confidence" };
const LEVEL_BARS: Record<ConfidenceLevel, number> = { high: 3, moderate: 2, low: 1 };
const KINDS: Record<ConfidenceUncertaintyKind, string> = { data: "Data", model: "Model", disagreement: "Disagreement", time: "Time" };
/** What each kind means, for screen readers and the copied text */
const KIND_MEANS: Record<ConfidenceUncertaintyKind, string> = {
  data: "the evidence is thin or incomplete",
  model: "the method may not fit the question",
  disagreement: "sources or experts disagree",
  time: "the situation is still changing",
};

/* Icons: Lucide (ISC, lucide.dev) – file-text (the header), copy, check, database, cpu, git-compare-arrows, hourglass, arrow-up-right */
const headIcon = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"></path>`;
const glyph = (body: ReturnType<typeof svg>) => html`<svg class="ui-cfb__glyph" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const copyIcon = svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`;
const checkIcon = svg`<path d="M20 6 9 17l-5-5"></path>`;
const linkIcon = svg`<path d="M7 7h10v10M7 17 17 7"></path>`;
const KIND_ICON: Record<ConfidenceUncertaintyKind, ReturnType<typeof svg>> = {
  data: svg`<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14a9 3 0 0 0 18 0V5"></path><path d="M3 12a9 3 0 0 0 18 0"></path>`,
  model: svg`<rect width="16" height="16" x="4" y="4" rx="2"></rect><rect width="6" height="6" x="9" y="9" rx="1"></rect><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"></path>`,
  disagreement: svg`<circle cx="5" cy="6" r="3"></circle><path d="M12 6h5a2 2 0 0 1 2 2v7"></path><path d="m15 9-3-3 3-3"></path><circle cx="19" cy="18" r="3"></circle><path d="M12 18H7a2 2 0 0 1-2-2V9"></path><path d="m9 15 3 3-3 3"></path>`,
  time: svg`<path d="M5 22h14M5 2h14"></path><path d="M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"></path>`,
};

/** The most dots the track record draws before it becomes a bar */
const MAX_DOTS = 40;

let instances = 0;

/**
 * An answer explained for someone who wasn't in the session: the conclusion, the kind of uncertainty, what would
 * change it, the key assumptions, signs to watch, the track record and the provenance record – with Copy as text.
 * @tag tc-confidence-brief
 * @fires tc-provenance-open - The provenance reference was pressed; detail `{ id }`: ConfidenceProvenanceOpen.
 * @fires tc-copy - "Copy as text" was pressed; detail `{ text }`: ConfidenceCopy. Cancelable: preventDefault() stops the element copying, to copy or export it yourself.
 */
export class TcConfidenceBrief extends TcElement {
  static override ui = "cfb";

  /** The heading – what the brief is about, often the question as it was asked */
  @property() accessor heading = "Confidence brief";
  /** A quiet line under the heading: when it was prepared, for whom */
  @property() accessor meta = "";
  /** The question as it was asked, quoted above the conclusion */
  @property() accessor question = "";
  /** What we conclude, in a sentence or two */
  @property() accessor conclusion = "";
  /** How confident the conclusion is – shown beside it; unset shows no level */
  @property() accessor confidence: ConfidenceLevel | undefined = undefined;
  /** Names of the three levels – "High confidence", "Moderate confidence" and "Low confidence" by default */
  @property({ attribute: false }) accessor confidenceLabels: Partial<Record<ConfidenceLevel, string>> = {};
  /** The kinds of uncertainty behind the conclusion: "data", "model", "disagreement", "time" */
  @property({ attribute: false }) accessor uncertainty: ConfidenceUncertaintyKind[] = [];
  /** Names of the four kinds – "Data", "Model", "Disagreement" and "Time" by default */
  @property({ attribute: false }) accessor uncertaintyLabels: Partial<Record<ConfidenceUncertaintyKind, string>> = {};
  /** A sentence on why it's uncertain, under the labels */
  @property({ attribute: "uncertainty-note" }) accessor uncertaintyNote = "";
  /** What the conclusion rests on, in plain words – the kinds of source and how recent, not their names */
  @property() accessor basis = "";
  /** What would change the conclusion */
  @property({ attribute: false }) accessor changers: string[] = [];
  /** The assumptions the conclusion depends on */
  @property({ attribute: false }) accessor assumptions: string[] = [];
  /** Things to watch for that would call the conclusion into question */
  @property({ attribute: false }) accessor signals: string[] = [];
  /** How often similar conclusions turned out right */
  @property({ attribute: false }) accessor record: ConfidenceRecord | undefined = undefined;
  /** The provenance record's reference; set, the brief shows it and fires tc-provenance-open when it's pressed */
  @property({ attribute: "provenance-id" }) accessor provenanceId = "";
  /** What the provenance reference is called */
  @property({ attribute: "provenance-label" }) accessor provenanceLabel = "Provenance record";
  /** The label of the copy button */
  @property({ attribute: "copy-label" }) accessor copyLabel = "Copy as text";
  /** Hides the copy button */
  @property({ type: Boolean, attribute: "no-copy" }) accessor noCopy = false;

  /** @internal The copy button shows "Copied" for a moment */
  @state() accessor copied = false;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-cfb${++instances}`;
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "article");
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
    this.copied = false;
  }

  private levelLabel(l: ConfidenceLevel) {
    return this.confidenceLabels[l] ?? LEVELS[l];
  }
  private kindLabel(k: ConfidenceUncertaintyKind) {
    return this.uncertaintyLabels[k] ?? KINDS[k];
  }
  private get kinds() {
    return (this.uncertainty ?? []).filter((k) => k in KINDS);
  }
  private recordLine(r: ConfidenceRecord) {
    return `Right ${r.right} of ${r.total} on similar questions`;
  }

  /** The brief as plain text – what "Copy as text" copies */
  toText() {
    const out: string[] = [this.heading];
    if (this.meta) out.push(this.meta);
    if (this.question) out.push("", `Asked: ${this.question}`);
    const level = this.confidence && this.confidence in LEVELS ? ` (${this.levelLabel(this.confidence)})` : "";
    if (this.conclusion) out.push("", `Conclusion${level}`, this.conclusion);
    const kinds = this.kinds;
    if (kinds.length || this.uncertaintyNote) {
      out.push("", `Kind of uncertainty: ${kinds.map((k) => this.kindLabel(k)).join(", ") || "–"}`);
      if (this.uncertaintyNote) out.push(this.uncertaintyNote);
    }
    if (this.basis) out.push("", "What it rests on", this.basis);
    const list = (title: string, items: string[]) => items?.length && out.push("", title, ...items.map((i) => `- ${i}`));
    list("What would change it", this.changers);
    list("Key assumptions", this.assumptions);
    list("Signs to watch", this.signals);
    if (this.record) out.push("", `Track record: ${this.recordLine(this.record).toLowerCase()}${this.record.note ? ` – ${this.record.note}` : ""}`);
    if (this.provenanceId) out.push("", `${this.provenanceLabel}: ${this.provenanceId}`);
    return out.join("\n");
  }

  private async copy() {
    const text = this.toText();
    if (!this.emit<ConfidenceCopy>("tc-copy", { text }, { cancelable: true })) return;
    const ok = await copyText(text);
    this.said = ok ? "Brief copied as text" : "Couldn't copy the brief";
    if (!ok) return;
    this.copied = true;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => (this.copied = false), 2000);
  }

  private openProvenance() {
    this.emit<ConfidenceProvenanceOpen>("tc-provenance-open", { id: this.provenanceId });
  }

  /* ---------- Rendering ---------- */

  private section(key: string, title: string, body: TemplateResult) {
    const id = `${this.uid}-${key}`;
    return html`<section class="ui-cfb__sec" data-sec=${key} aria-labelledby=${id}>
      <h4 class="ui-cfb__label" id=${id}>${title}</h4>
      ${body}
    </section>`;
  }

  private list(items: string[]) {
    return html`<ul class="ui-cfb__list">${items.map((i) => html`<li>${i}</li>`)}</ul>`;
  }

  private renderLevel() {
    const l = this.confidence;
    if (!l || !(l in LEVELS)) return nothing;
    const bars = LEVEL_BARS[l];
    return html`<span class="ui-cfb__level" data-level=${l}>
      <span class="ui-cfb__bars" aria-hidden="true">${[1, 2, 3].map((b) => html`<span class="ui-cfb__bar" ?data-on=${b <= bars}></span>`)}</span>${this.levelLabel(l)}
    </span>`;
  }

  private renderRecord(r: ConfidenceRecord) {
    const total = Math.max(0, Math.round(r.total));
    const right = Math.min(total, Math.max(0, Math.round(r.right)));
    const share = total ? right / total : 0;
    const dots =
      total > 0 && total <= MAX_DOTS
        ? html`<span class="ui-cfb__dots" aria-hidden="true">${Array.from({ length: total }, (_, i) => html`<span class="ui-cfb__dot" ?data-right=${i < right}></span>`)}</span>`
        : html`<span class="ui-cfb__meter" aria-hidden="true"><span class="ui-cfb__fill" style=${`inline-size: ${share * 100}%`}></span></span>`;
    return html`<p class="ui-cfb__record"><span class="ui-cfb__score"><b>${right}</b> of ${total}</span> <span class="ui-cfb__sr">${this.recordLine({ right, total })}</span></p>
      ${dots}
      ${r.note ? html`<p class="ui-cfb__note">${r.note}</p>` : nothing}`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const copyBtn = this.noCopy
      ? nothing
      : html`<button type="button" class="ui-cfb__copy" ?data-copied=${this.copied} @click=${this.copy}>${glyph(this.copied ? checkIcon : copyIcon)}<span>${this.copied ? "Copied" : this.copyLabel}</span></button>`;
    const head = cardHead({ icon: headIcon, title: this.heading, subtitle: this.meta || undefined, id: `${this.uid}-title`, aside: copyBtn === nothing ? undefined : copyBtn });
    const kinds = this.kinds;
    const has = (a: string[] | undefined) => !!a?.length;
    const pairs = [
      has(this.changers) ? this.section("change", "What would change it", this.list(this.changers)) : nothing,
      has(this.assumptions) ? this.section("assume", "Key assumptions", this.list(this.assumptions)) : nothing,
      has(this.signals) ? this.section("watch", "Signs to watch", this.list(this.signals)) : nothing,
      this.record ? this.section("record", "Track record", this.renderRecord(this.record)) : nothing,
    ].filter((s) => s !== nothing);
    const ref = this.provenanceId
      ? html`<div class="ui-cfb__foot">
          <button type="button" class="ui-cfb__ref" @click=${this.openProvenance}>
            <span class="ui-cfb__ref-label">${this.provenanceLabel}</span> <code class="ui-cfb__ref-id">${this.provenanceId}</code>${glyph(linkIcon)}
          </button>
        </div>`
      : nothing;
    const page = html`<div class="ui-cfb__page">
      <section class="ui-cfb__lead" aria-labelledby=${`${this.uid}-conclusion`}>
        <div class="ui-cfb__lead-top"><h4 class="ui-cfb__label" id=${`${this.uid}-conclusion`}>Conclusion</h4>${this.renderLevel()}</div>
        ${this.question ? html`<p class="ui-cfb__question"><span class="ui-cfb__q-label">Asked</span> “${this.question}”</p>` : nothing}
        <p class="ui-cfb__conclusion">${this.conclusion || html`<span class="ui-cfb__none">No conclusion yet</span>`}</p>
      </section>
      ${kinds.length || this.uncertaintyNote
        ? this.section(
            "kind",
            "Kind of uncertainty",
            html`${kinds.length
                ? html`<ul class="ui-cfb__kinds">
                    ${kinds.map((k) => html`<li class="ui-cfb__kind" data-kind=${k}>${glyph(KIND_ICON[k])}${this.kindLabel(k)}<span class="ui-cfb__sr"> – ${KIND_MEANS[k]}</span></li>`)}
                  </ul>`
                : nothing}${this.uncertaintyNote ? html`<p class="ui-cfb__text">${this.uncertaintyNote}</p>` : nothing}`,
          )
        : nothing}
      ${this.basis ? this.section("basis", "What it rests on", html`<p class="ui-cfb__text">${this.basis}</p>`) : nothing}
      ${pairs.length ? html`<div class="ui-cfb__grid">${pairs}</div>` : nothing}
    </div>`;
    return html`${clean ? nothing : head}
      <div class="ui-cfb__card">${clean ? head : nothing}${page}${clean ? ref : nothing}</div>
      ${clean ? nothing : ref}
      <span class="ui-cfb__sr" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
[data-ui="cfb"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
}
/* Standard: the gray tray around a white page */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cfb"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
[data-ui="cfb"] *, [data-ui="cfb"] *::before, [data-ui="cfb"] *::after { box-sizing: border-box; }
:where([data-ui="cfb"]) :is(p, ul, h4) { margin: 0; padding: 0; }
:where([data-ui="cfb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="cfb"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="cfb"] b { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-cfb__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-cfb__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-cfb__glyph { stroke-width: 1.5; }
/* Copy as text: Button's ghost recipe, in the header's aside */
.ui-cfb__copy { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cfb__copy:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-cfb__copy[data-copied] { color: var(--tc-status-success-fg); }
/* ----- The page ----- */
.ui-cfb__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-cfb__card { background: var(--tc-surface-raised); }
.ui-cfb__page { display: grid; gap: 0; padding: var(--tc-space-1) var(--tc-space-5) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-cfb__page { padding: 0 var(--tc-space-4) var(--tc-space-1); border-top: var(--tc-hairline) solid var(--tc-divider); }
/* Section labels: small capitals, like the headings of a printed form */
.ui-cfb__label { font-size: var(--tc-eyebrow-font-size); font-weight: var(--tc-eyebrow-font-weight); line-height: var(--tc-eyebrow-line-height); letter-spacing: var(--tc-eyebrow-tracking); text-transform: var(--tc-eyebrow-transform); color: var(--tc-eyebrow-color); }
/* The conclusion leads: larger type with a rule down its left edge */
.ui-cfb__lead { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-4) 0; }
.ui-cfb__lead-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); }
.ui-cfb__conclusion { padding-left: var(--tc-space-3); border-left: 3px solid var(--tc-text-primary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-primary); text-wrap: pretty; }
:where([data-look="clean"], [data-look="clean"] *).ui-cfb__conclusion { border-left-width: 2px; border-left-color: var(--tc-border-strong); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-strong); }
.ui-cfb__none { color: var(--tc-text-muted); }
.ui-cfb__question { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); text-wrap: pretty; }
.ui-cfb__q-label { margin-right: var(--tc-space-0-5); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-cfb__level { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; }
.ui-cfb__bars { display: inline-flex; align-items: flex-end; gap: var(--tc-space-0-5); height: 12px; }
.ui-cfb__bar { width: 4px; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-strong); }
.ui-cfb__bar:nth-child(1) { height: 6px; }
.ui-cfb__bar:nth-child(2) { height: 9px; }
.ui-cfb__bar:nth-child(3) { height: 12px; }
.ui-cfb__bar[data-on] { background: var(--tc-text-primary); }
.ui-cfb__level[data-level="low"] .ui-cfb__bar[data-on] { background: var(--tc-status-warning-solid); }
/* Each section under a hairline */
.ui-cfb__sec { display: grid; align-content: start; gap: var(--tc-space-1-5); min-width: 0; padding: var(--tc-space-3) 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cfb__text { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-secondary); text-wrap: pretty; }
.ui-cfb__kinds { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); list-style: none; }
.ui-cfb__kind { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); color: var(--tc-status-warning-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-cfb__kind { background: none; box-shadow: inset 0 0 0 1px var(--tc-status-warning-border); }
.ui-cfb__kind .ui-cfb__glyph { width: 13px; height: 13px; }
/* Two columns of short lists */
.ui-cfb__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: var(--tc-space-6); }
.ui-cfb__list { display: grid; gap: var(--tc-space-1); list-style: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
.ui-cfb__list > li { position: relative; padding-left: var(--tc-space-3-5); text-wrap: pretty; }
.ui-cfb__list > li::before { content: ""; position: absolute; top: 0.6em; left: var(--tc-space-0-5); width: 5px; height: 1.5px; background: var(--tc-text-muted); }
.ui-cfb__sec[data-sec="watch"] .ui-cfb__list > li::before { width: 5px; height: 5px; top: 0.5em; border-radius: var(--tc-radius-full); background: none; box-shadow: inset 0 0 0 1.5px var(--tc-status-warning-solid); }
/* The track record: the score, then one dot per similar question */
.ui-cfb__record { display: flex; align-items: baseline; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-cfb__score { font-variant-numeric: tabular-nums; }
.ui-cfb__score b { font-size: var(--tc-font-size-xl); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); }
.ui-cfb__dots { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-cfb__dot { width: 8px; height: 8px; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1.5px var(--tc-border-strong); }
.ui-cfb__dot[data-right] { background: var(--tc-status-success-solid); box-shadow: none; }
.ui-cfb__meter { display: block; height: var(--tc-meter-h); max-width: 220px; overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-cfb__fill { display: block; height: 100%; background: var(--tc-status-success-solid); }
.ui-cfb__note { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
/* ----- The provenance reference: on the tray (Standard), the card's last row (Clean) ----- */
.ui-cfb__foot { display: flex; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cfb__foot { padding: var(--tc-space-1) var(--tc-space-1) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-cfb__foot { padding: var(--tc-space-1-5) var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cfb__ref { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-width: 0; max-width: 100%; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cfb__ref:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-cfb__ref-label { flex: none; }
.ui-cfb__ref-id { min-width: 0; overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* Narrow: one column */
@container (max-width: 460px) {
  .ui-cfb__page { padding-right: var(--tc-space-4); padding-left: var(--tc-space-4); }
  .ui-cfb__grid { grid-template-columns: minmax(0, 1fr); }
}
@media (pointer: coarse) {
  .ui-cfb__copy, .ui-cfb__ref { height: var(--tc-control-h-md); }
}
@media (forced-colors: active) {
  .ui-cfb__dot[data-right], .ui-cfb__bar[data-on], .ui-cfb__fill { background: CanvasText; }
  .ui-cfb__kind { border: 1px solid CanvasText; }
}
/* Printed: no tray, no shadows, no copy button */
@media print {
  [data-ui="cfb"] { max-width: none; padding: 0; background: none; }
  .ui-cfb__card { box-shadow: none; border: 1px solid var(--tc-border-default); }
  .ui-cfb__copy { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cfb"] *, [data-ui="cfb"] *::before, [data-ui="cfb"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-confidence-brief")) customElements.define("tc-confidence-brief", TcConfidenceBrief);

declare global {
  interface HTMLElementTagNameMap {
    "tc-confidence-brief": TcConfidenceBrief;
  }
}

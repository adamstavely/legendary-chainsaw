import { html, nothing, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { initials } from "./internal/util";
import "./audience-mix";
import type { AudienceMixData } from "./audience-mix";

/*
 * <tc-publication-impact> – one paper's impact on one card. The header has the venue and date, the topic it belongs
 * to, the title, an assessment grade ("Outstanding"), the authors and what it achieved ("resolves gap"). Below come
 * the reach figures – downloads, views, citations and an attention score – beside a sparkline of cumulative reads,
 * then mentions (news, policy, social, patents), who is reading (a <tc-audience-mix> when `audience` is given) and
 * feedback: quotes from peer reviewers, readers and sponsors, each with who, where, when and a sentiment in words,
 * filtered All / Peer / Reader / Sponsor and summed up ("2 positive · 1 mixed").
 *   · the filter is a radio group: ← / → move and pick; picking fires a cancelable tc-filter-change
 * Standard: a white card on a gray tray. Clean: one white card.
 *
 *   <tc-publication-impact heading="Sparse spiking networks…" venue="Neural Computation Letters" .metrics=${{ downloads: 18000 }}></tc-publication-impact>
 */

export type PublicationTone = "neutral" | "info" | "success" | "warning" | "danger";
export type PublicationAuthor = { name: string; picture?: string };
export type PublicationMetrics = { downloads?: number; views?: number; citations?: number; attention?: number };
export type PublicationMention = { label: string; value: number };
export type PublicationFeedbackKind = "peer" | "reader" | "sponsor";
export type PublicationSentiment = "positive" | "mixed" | "negative";
export type PublicationFeedback = {
  id: string;
  kind: PublicationFeedbackKind;
  /** Who said it: "Reviewer 2" */
  who: string;
  /** Where they're from: "Journal of Applied Sensing", "Northfield Lab" */
  where?: string;
  /** When, as epoch ms */
  date?: number;
  quote: string;
  sentiment: PublicationSentiment;
};
export type PublicationFeedbackFilter = "all" | PublicationFeedbackKind;

/** Details of the events */
export type PublicationFilterChange = { filter: PublicationFeedbackFilter };

const KINDS: PublicationFeedbackKind[] = ["peer", "reader", "sponsor"];
/** The feedback kinds' and sentiments' names used when the page gives none */
export const defaultPublicationFeedbackLabels: Record<PublicationFeedbackKind, string> = { peer: "Peer", reader: "Reader", sponsor: "Sponsor" };
export const defaultPublicationSentimentLabels: Record<PublicationSentiment, string> = { positive: "Positive", mixed: "Mixed", negative: "Negative" };
const SENTIMENT_TONE: Record<PublicationSentiment, PublicationTone> = { positive: "success", mixed: "warning", negative: "danger" };
let uidCount = 0;

/* Download, eye, quote and spark marks: Lucide (ISC, lucide.dev) */
const lucide = (body: ReturnType<typeof svg>) =>
  html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON = {
  downloads: svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path><path d="M12 15V3"></path>`,
  views: svg`<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"></path><circle cx="12" cy="12" r="3"></circle>`,
  citations: svg`<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>`,
  attention: svg`<path d="M9.94 14.06 4 20"></path><path d="m14 4 1.5 3L19 8.5 15.5 10 14 13l-1.5-3L9 8.5 12.5 7z"></path>`,
};

/**
 * One paper's impact – venue, topic, grade and authors; downloads, views, citations and attention with a reads
 * sparkline; mentions; who is reading; and feedback quotes filtered by kind, each with a sentiment.
 * @tag tc-publication-impact
 * @fires tc-filter-change - A feedback filter was picked ({ filter }: PublicationFilterChange); cancelable – prevented, `filter` stays as it was
 */
export class TcPublicationImpact extends TcElement {
  static override ui = "pubi";

  /** The paper's title */
  @property() accessor heading = "";
  /** Where it was published */
  @property() accessor venue: string | undefined = undefined;
  /** When it was published, as epoch ms */
  @property({ type: Number }) accessor date: number | undefined = undefined;
  /** The topic it belongs to; with `href` it's a link */
  @property({ attribute: false }) accessor topic: { label: string; href?: string } | undefined = undefined;
  /** The assessment grade, e.g. { label: "Outstanding", tone: "success" } */
  @property({ attribute: false }) accessor grade: { label: string; tone?: PublicationTone } | undefined = undefined;
  /** The grade's caption */
  @property({ attribute: "grade-label" }) accessor gradeLabel = "Assessment";
  /** The authors, in order */
  @property({ attribute: false }) accessor authors: PublicationAuthor[] = [];
  /** What the paper achieved, as a short tag: "resolves gap" */
  @property() accessor outcome: string | undefined = undefined;
  /** Downloads, views, citations and attention score; each shows only when given */
  @property({ attribute: false }) accessor metrics: PublicationMetrics = {};
  /** Cumulative reads over time, oldest first, for the sparkline */
  @property({ attribute: false }) accessor reads: number[] = [];
  /** Mentions by kind: [{ label: "News", value: 11 }, …] */
  @property({ attribute: false }) accessor mentions: PublicationMention[] = [];
  /** Who is reading – shown with <tc-audience-mix> when given */
  @property({ attribute: false }) accessor audience: AudienceMixData | undefined = undefined;
  /** Feedback quotes */
  @property({ attribute: false }) accessor feedback: PublicationFeedback[] = [];
  /** The feedback kind shown. Changed by the user unless a tc-filter-change listener calls preventDefault() */
  @property() accessor filter: PublicationFeedbackFilter = "all";
  /** The feedback kinds' names, merged over the defaults (Peer, Reader, Sponsor) */
  @property({ attribute: false }) accessor kindLabels: Partial<Record<PublicationFeedbackKind, string>> = {};
  /** The sentiments' names, merged over the defaults (Positive, Mixed, Negative) */
  @property({ attribute: false }) accessor sentimentLabels: Partial<Record<PublicationSentiment, string>> = {};
  /** The language for dates and numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  private uid = `tc-pubi-${++uidCount}`;

  private kindLabel(k: PublicationFeedbackKind) {
    return this.kindLabels[k] ?? defaultPublicationFeedbackLabels[k];
  }
  private sentimentLabel(s: PublicationSentiment) {
    return this.sentimentLabels[s] ?? defaultPublicationSentimentLabels[s];
  }
  private compact(n: number) {
    return new Intl.NumberFormat(this.locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
  }
  private full(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }
  private day(ms: number, month: "short" | "long" = "short") {
    return new Intl.DateTimeFormat(this.locale, { day: "numeric", month, year: "numeric" }).format(ms);
  }

  private pick(filter: PublicationFeedbackFilter) {
    if (filter === this.filter) return;
    if (this.emit<PublicationFilterChange>("tc-filter-change", { filter }, { cancelable: true })) this.filter = filter;
  }
  private get filters(): PublicationFeedbackFilter[] {
    return ["all", ...KINDS.filter((k) => this.feedback.some((f) => f.kind === k))];
  }
  private onFilterKey = (e: KeyboardEvent) => {
    const list = this.filters;
    const i = list.indexOf(this.filter);
    const next = { ArrowLeft: i - 1, ArrowUp: i - 1, ArrowRight: i + 1, ArrowDown: i + 1, Home: 0, End: list.length - 1 }[e.key];
    if (next === undefined || e.isComposing) return;
    e.preventDefault();
    const to = list[(next + list.length) % list.length];
    this.pick(to);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-filter="${this.filter}"]`)?.focus());
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A filter whose kind has no quotes falls back to All
    if (this.filter !== "all" && !this.feedback.some((f) => f.kind === this.filter)) this.filter = "all";
  }

  /* ---------- Rendering ---------- */

  private renderHead() {
    const tone = this.grade?.tone ?? "success";
    return html`<header class="ui-pubi__head">
      <div class="ui-pubi__meta">
        ${this.venue ? html`<span class="ui-pubi__venue">${this.venue}</span>` : nothing}
        ${this.date !== undefined ? html`<span class="ui-pubi__date">${new Intl.DateTimeFormat(this.locale, { month: "short", year: "numeric" }).format(this.date)}</span>` : nothing}
        ${this.topic
          ? this.topic.href
            ? html`<a class="ui-pubi__topic" href=${this.topic.href}><span aria-hidden="true">↳ </span>${this.topic.label}</a>`
            : html`<span class="ui-pubi__topic"><span aria-hidden="true">↳ </span>${this.topic.label}</span>`
          : nothing}
      </div>
      <div class="ui-pubi__title-row">
        <h3 class="ui-pubi__title" id=${`${this.uid}-title`}>${this.heading}</h3>
        ${this.grade
          ? html`<span class="ui-pubi__grade" data-tone=${tone}><span class="ui-pubi__grade-label">${this.gradeLabel}</span><span class="ui-pubi__grade-value"><span class="ui-pubi__dot" aria-hidden="true"></span>${this.grade.label}</span></span>`
          : nothing}
      </div>
      ${this.authors.length || this.outcome
        ? html`<div class="ui-pubi__by">
            ${this.authors.length
              ? html`<span class="ui-pubi__faces" aria-hidden="true">${this.authors.slice(0, 4).map((a) => (a.picture ? html`<img class="ui-pubi__face" src=${a.picture} alt="" />` : html`<span class="ui-pubi__face">${initials(a.name)}</span>`))}</span>
                  <span class="ui-pubi__names">${this.authors.map((a) => a.name.split(/\s+/).slice(-1)[0]).join(", ")}</span>`
              : nothing}
            ${this.outcome ? html`<span class="ui-pubi__outcome">${this.outcome}</span>` : nothing}
          </div>`
        : nothing}
    </header>`;
  }

  private renderSpark() {
    const pts = this.reads.filter((n) => Number.isFinite(n));
    if (pts.length < 2) return nothing;
    const max = Math.max(...pts) || 1;
    const min = Math.min(...pts);
    const span = max - min || 1;
    const xy = pts.map((v, i) => [(i / (pts.length - 1)) * 120, 34 - ((v - min) / span) * 30] as const);
    const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join("");
    return html`<div class="ui-pubi__spark" role="img" aria-label=${`Cumulative reads, rising to ${this.full(pts[pts.length - 1])}`}>
      <span class="ui-pubi__spark-label" aria-hidden="true">Cumulative reads</span>
      <svg viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true">
        <path class="ui-pubi__spark-area" d=${`${line}L120 36L0 36Z`}></path>
        <path class="ui-pubi__spark-line" d=${line}></path>
      </svg>
    </div>`;
  }

  private renderMetrics() {
    const m = this.metrics;
    const items = (
      [
        ["downloads", "Downloads", m.downloads],
        ["views", "Views", m.views],
        ["citations", "Citations", m.citations],
        ["attention", "Attention score", m.attention],
      ] as const
    ).filter((x) => typeof x[2] === "number");
    if (!items.length && this.reads.length < 2) return nothing;
    return html`<section class="ui-pubi__reach" aria-label="Reach">
      <dl class="ui-pubi__stats">
        ${items.map(
          ([id, label, v]) => html`<div class="ui-pubi__stat" data-kind=${id}>
            <dt class="ui-pubi__stat-label"><span class="ui-pubi__stat-icon">${lucide(ICON[id])}</span>${label}</dt>
            <dd class="ui-pubi__stat-value" title=${this.full(v!)}>${this.compact(v!)}</dd>
          </div>`,
        )}
      </dl>
      ${this.renderSpark()}
    </section>`;
  }

  private renderMentions() {
    if (!this.mentions.length) return nothing;
    return html`<section class="ui-pubi__section" aria-labelledby=${`${this.uid}-mentions`}>
      <h4 class="ui-pubi__section-title" id=${`${this.uid}-mentions`}>Mentions</h4>
      <ul class="ui-pubi__mentions" role="list">
        ${this.mentions.map((x) => html`<li class="ui-pubi__mention"><span class="ui-pubi__mention-value">${this.compact(x.value)}</span><span class="ui-pubi__mention-label">${x.label}</span></li>`)}
      </ul>
    </section>`;
  }

  private renderFeedback() {
    if (!this.feedback.length) return nothing;
    const counts = { positive: 0, mixed: 0, negative: 0 } as Record<PublicationSentiment, number>;
    for (const f of this.feedback) counts[f.sentiment]++;
    const summary = (["positive", "mixed", "negative"] as const)
      .filter((s) => counts[s])
      .map((s) => `${counts[s]} ${this.sentimentLabel(s).toLowerCase()}`)
      .join(" · ");
    const shown = this.feedback.filter((f) => this.filter === "all" || f.kind === this.filter);
    const fid = `${this.uid}-feedback`;
    return html`<section class="ui-pubi__section" aria-labelledby=${fid}>
      <div class="ui-pubi__feedback-head">
        <h4 class="ui-pubi__section-title" id=${fid}>Feedback</h4>
        <span class="ui-pubi__summary">${summary}</span>
        <div class="ui-pubi__filter" role="radiogroup" aria-label="Show feedback from" @keydown=${this.onFilterKey}>
          ${this.filters.map(
            (k) => html`<button
              type="button"
              role="radio"
              class="ui-pubi__filter-opt"
              data-filter=${k}
              aria-checked=${this.filter === k ? "true" : "false"}
              tabindex=${this.filter === k ? 0 : -1}
              @click=${() => this.pick(k)}
            >${k === "all" ? "All" : this.kindLabel(k)}</button>`,
          )}
        </div>
      </div>
      <ul class="ui-pubi__quotes" role="list">
        ${shown.map(
          (f) => html`<li class="ui-pubi__quote" data-kind=${f.kind}>
            <div class="ui-pubi__quote-head">
              <span class="ui-pubi__kind">${this.kindLabel(f.kind)}</span>
              <span class="ui-pubi__who">${f.who}${f.where ? html`<span class="ui-pubi__where">, ${f.where}</span>` : nothing}</span>
              <span class="ui-pubi__sentiment" data-tone=${SENTIMENT_TONE[f.sentiment]}><span class="ui-pubi__dot" aria-hidden="true"></span>${this.sentimentLabel(f.sentiment)}</span>
            </div>
            <blockquote class="ui-pubi__text">“${f.quote}”</blockquote>
            ${f.date !== undefined ? html`<span class="ui-pubi__quote-date">${this.day(f.date)}</span>` : nothing}
          </li>`,
        )}
      </ul>
    </section>`;
  }

  protected override render() {
    const a = this.audience;
    return html`<article class="ui-pubi__card" aria-labelledby=${`${this.uid}-title`}>
      ${this.renderHead()} ${this.renderMetrics()} ${this.renderMentions()}
      ${a && (a.sectors?.length || a.split || a.places?.length)
        ? html`<section class="ui-pubi__section" aria-labelledby=${`${this.uid}-audience`}>
            <h4 class="ui-pubi__section-title" id=${`${this.uid}-audience`}>Who is reading</h4>
            <tc-audience-mix embedded look=${this.resolvedLook} .sectors=${a.sectors ?? []} .split=${a.split ?? null} .places=${a.places ?? []} .locale=${this.locale}></tc-audience-mix>
          </section>`
        : nothing}
      ${this.renderFeedback()}
    </article>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pubi"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pubi"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="pubi"] {
  display: block;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  --tc-pubi-ink: var(--tc-chart-1);
}
[data-ui="pubi"] *, [data-ui="pubi"] *::before, [data-ui="pubi"] *::after { box-sizing: border-box; }
[data-ui="pubi"] h3, [data-ui="pubi"] h4, [data-ui="pubi"] p, [data-ui="pubi"] dl, [data-ui="pubi"] dd, [data-ui="pubi"] blockquote { margin: 0; }
[data-ui="pubi"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="pubi"] svg { display: block; flex: none; }
:where([data-ui="pubi"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
[data-ui="pubi"] :is(button, a):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-pubi__card { display: grid; }
:where([data-look="standard"], [data-look="standard"] *).ui-pubi__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-pubi__card > * + * { border-top: var(--tc-hairline) solid var(--tc-divider); }
/* ----- The header ----- */
.ui-pubi__head { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-4); }
.ui-pubi__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-2); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-pubi__venue, .ui-pubi__topic { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-radius-sm); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-pubi__topic { margin-left: auto; background: var(--tc-fill-subtle); text-decoration: none; }
a.ui-pubi__topic:hover { color: var(--tc-text-primary); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-pubi__title-row { display: flex; align-items: flex-start; gap: var(--tc-space-3); }
.ui-pubi__title { flex: 1; min-width: 0; font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display-sm); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); text-wrap: balance; }
.ui-pubi__grade { display: grid; flex: none; justify-items: start; gap: var(--tc-space-0-5); padding: var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-pubi__grade-label { font-size: var(--tc-eyebrow-font-size); font-weight: var(--tc-eyebrow-font-weight); line-height: var(--tc-eyebrow-line-height); letter-spacing: var(--tc-eyebrow-tracking); text-transform: var(--tc-eyebrow-transform); }
.ui-pubi__grade-value { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); }
.ui-pubi__dot { width: 7px; height: 7px; border-radius: var(--tc-radius-full); background: currentColor; }
[data-ui="pubi"] [data-tone="info"] { --tc-pubi-bg: var(--tc-status-info-bg); --tc-pubi-fg: var(--tc-status-info-fg); }
[data-ui="pubi"] [data-tone="success"] { --tc-pubi-bg: var(--tc-status-success-bg); --tc-pubi-fg: var(--tc-status-success-fg); }
[data-ui="pubi"] [data-tone="warning"] { --tc-pubi-bg: var(--tc-status-warning-bg); --tc-pubi-fg: var(--tc-status-warning-fg); }
[data-ui="pubi"] [data-tone="danger"] { --tc-pubi-bg: var(--tc-status-danger-bg); --tc-pubi-fg: var(--tc-status-danger-fg); }
[data-ui="pubi"] [data-tone="neutral"] { --tc-pubi-bg: var(--tc-fill-default); --tc-pubi-fg: var(--tc-text-secondary); }
.ui-pubi__grade[data-tone], .ui-pubi__sentiment[data-tone] { background: var(--tc-pubi-bg); color: var(--tc-pubi-fg); }
.ui-pubi__by { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-pubi__faces { display: inline-flex; }
.ui-pubi__face { display: grid; place-items: center; width: var(--tc-avatar-sm); height: var(--tc-avatar-sm); margin-left: calc(-1 * var(--tc-space-1-5)); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); box-shadow: 0 0 0 2px var(--tc-surface-raised); font-size: var(--tc-avatar-font-size); font-weight: var(--tc-avatar-font-weight); color: var(--tc-text-secondary); object-fit: cover; }
.ui-pubi__face:first-child { margin-left: 0; }
.ui-pubi__outcome { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-radius-sm); background: var(--tc-accent-subtle); color: var(--tc-accent-text); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
/* ----- Reach: the figures and the reads sparkline ----- */
.ui-pubi__reach { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(140px, 1fr); align-items: stretch; gap: var(--tc-space-4); padding: var(--tc-space-4); }
.ui-pubi__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: var(--tc-space-3); }
.ui-pubi__stat { display: grid; gap: var(--tc-space-0-5); }
.ui-pubi__stat-label { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-pubi__stat-icon { color: var(--tc-icon-muted); }
.ui-pubi__stat-value { font-size: var(--tc-font-size-3xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-pubi__stat[data-kind="attention"] .ui-pubi__stat-value { color: var(--tc-accent-text); }
.ui-pubi__spark { position: relative; display: grid; grid-template-rows: auto 1fr; gap: var(--tc-space-1); min-height: 64px; }
.ui-pubi__spark-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-align: right; }
.ui-pubi__spark > svg { width: 100%; height: 100%; min-height: 44px; }
.ui-pubi__spark-line { fill: none; stroke: var(--tc-pubi-ink); stroke-width: 1.75px; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
.ui-pubi__spark-area { fill: color-mix(in oklab, var(--tc-pubi-ink) 14%, transparent); }
/* ----- Sections: mentions, who is reading, feedback ----- */
.ui-pubi__section { display: grid; gap: var(--tc-space-2-5); padding: var(--tc-space-4); }
.ui-pubi__section-title { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-pubi__mentions { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: var(--tc-space-2); }
.ui-pubi__mention { display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-pubi__mention-value { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-pubi__mention-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-pubi__feedback-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-pubi__summary { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-pubi__filter { display: flex; gap: var(--tc-space-0-5); margin-left: auto; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-pubi__filter-opt { padding: var(--tc-space-1) var(--tc-space-2-5) !important; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-pubi__filter-opt[aria-checked="true"] { background: var(--tc-seg-thumb-bg); color: var(--tc-text-primary); box-shadow: var(--tc-seg-thumb-shadow); }
:where([data-look="standard"], [data-look="standard"] *) .ui-pubi__filter-opt[aria-checked="true"] { font-weight: var(--tc-font-weight-strong); }
.ui-pubi__quotes { display: grid; gap: var(--tc-space-2); }
.ui-pubi__quote { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); animation: ui-pubi-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-pubi__quote-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-pubi__kind { font-size: var(--tc-eyebrow-font-size); font-weight: var(--tc-eyebrow-font-weight); letter-spacing: var(--tc-eyebrow-tracking); text-transform: var(--tc-eyebrow-transform); color: var(--tc-eyebrow-color); }
.ui-pubi__who { color: var(--tc-text-primary); }
.ui-pubi__where { color: var(--tc-text-muted); }
.ui-pubi__sentiment { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); margin-left: auto; padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); }
.ui-pubi__text { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-pubi__quote-date { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
@keyframes ui-pubi-in { from { opacity: 0; transform: translateY(2px); } }
@container (max-width: 520px) {
  .ui-pubi__reach { grid-template-columns: 1fr; }
  .ui-pubi__title-row { flex-direction: column; }
  .ui-pubi__topic { margin-left: 0; }
  .ui-pubi__filter { margin-left: 0; }
  .ui-pubi__title { font-size: var(--tc-font-size-xl); }
}
@media (forced-colors: active) {
  .ui-pubi__grade, .ui-pubi__sentiment, .ui-pubi__mention, .ui-pubi__quote { border: 1px solid CanvasText; }
  .ui-pubi__spark-line { stroke: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="pubi"] *, [data-ui="pubi"] *::before, [data-ui="pubi"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-publication-impact")) customElements.define("tc-publication-impact", TcPublicationImpact);

declare global {
  interface HTMLElementTagNameMap {
    "tc-publication-impact": TcPublicationImpact;
  }
}

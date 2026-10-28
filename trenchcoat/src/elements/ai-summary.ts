import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OffScreenController } from "./internal/controllers";
import { copyText } from "./internal/util";

/*
 * <tc-ai-summary> – an AI summary of a set of sources: a thread, a meeting, some documents, a ticket's history. (For
 * one file, use tc-file-summary.) The header says what was summarised – "12 messages · 3 documents" – and that it's
 * AI-generated, by which model and how long ago. The body leads with a one-line TL;DR, then the summary, key points
 * citing their sources as numbered chips, and open questions. The footer asks whether it helped, and offers Copy,
 * Regenerate and the list of sources.
 *   · `status` drives it: "idle" offers Summarise, "summarising" shows a shimmer until text arrives and a caret while
 *     it grows, "done" shows everything, "error" shows the message with Retry. The page streams by setting `tldr`,
 *     `summary`, `points` and `questions` as they arrive
 *   · a citation chip shows its source's name on hover or focus and opens it: a link with the source's `href`
 *     (prevent tc-cite-open to open it your own way), else a button
 *   · freshness: `stale` (true, or how many new items), or sources dated after `generatedAt`, shows "3 new messages
 *     since this summary" with Update
 *   · times are epoch ms; the element reads the clock when it connects and every 30 s unless `now` is given
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-ai-summary status="done" .sources=${sources} tldr="Launch moves to the 14th." .summary=${text}
 *     .points=${points}></tc-ai-summary>
 */

export type AiSummarySourceKind = "message" | "document" | "meeting" | "ticket" | "web" | "other";
export type AiSummarySource = {
  id: string;
  /** How the source is named in chips and the list: "Priya in #launch", "Pricing brief.docx" */
  label: string;
  kind?: AiSummarySourceKind;
  /** Where the source opens; makes its chips and its row in the list links */
  href?: string;
  /** When it was written or last changed, epoch ms */
  at?: number;
};
/** A key point, with the ids of the sources it comes from */
export type AiSummaryPoint = { id: string; text: string; sources?: string[] };
export type AiSummaryStatus = "idle" | "summarising" | "done" | "error";
export type AiSummaryLength = "short" | "detailed";
export type AiSummaryFeedbackValue = "up" | "down" | null;

/** Details of the events */
export type AiSummaryCiteOpen = { sourceId: string; pointId: string };
export type AiSummaryLengthChange = { length: AiSummaryLength };
export type AiSummaryRetry = { reason: "regenerate" | "error" | "stale" };
export type AiSummaryFeedback = { value: AiSummaryFeedbackValue };

let uidCount = 0;
const MIN = 60_000;
const HOUR = 60 * MIN;

/* Sparkles, message, file, video, ticket, globe, copy, check, refresh, thumbs, list, chevron, alert: Lucide (ISC, lucide.dev) */
const lucide = (body: TemplateResult, size = 16) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const sparkles = svg`<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path>`;
const page = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path>`;
const KIND_ICON: Record<AiSummarySourceKind, TemplateResult> = {
  message: svg`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>`,
  document: svg`${page}<path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path>`,
  meeting: svg`<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect>`,
  ticket: svg`<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path>`,
  web: svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>`,
  other: page,
};
/** Each kind's name, one and many: "1 message", "3 documents" */
const KIND_NOUN: Record<AiSummarySourceKind, [string, string]> = {
  message: ["message", "messages"],
  document: ["document", "documents"],
  meeting: ["meeting", "meetings"],
  ticket: ["ticket", "tickets"],
  web: ["web page", "web pages"],
  other: ["source", "sources"],
};
const KINDS = Object.keys(KIND_NOUN) as AiSummarySourceKind[];
const copyIcon = () => lucide(svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`, 14);
const checkIcon = () => lucide(svg`<path d="M20 6 9 17l-5-5"></path>`, 14);
const refreshIcon = () => lucide(svg`<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path>`, 14);
const upIcon = () => lucide(svg`<path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"></path>`, 14);
const downIcon = () => lucide(svg`<path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"></path>`, 14);
const chevronIcon = () => lucide(svg`<path d="m6 9 6 6 6-6"></path>`, 14);
const alertIcon = () => lucide(svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path>`, 16);

/** "just now", "5 min ago", "3 h ago", else the date */
export function aiSummaryAgo(ms: number, now: number, locale?: string) {
  const diff = Math.max(0, now - ms);
  if (diff < 45_000) return "just now";
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MIN))} min ago`;
  if (diff < 24 * HOUR) return `${Math.floor(diff / HOUR)} h ago`;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(ms);
}

/**
 * An AI summary of a set of sources – a thread, a meeting, documents, a ticket's history – with a TL;DR, key points
 * citing their sources, open questions, a note when the sources have moved on, feedback, Copy and Regenerate.
 * @tag tc-ai-summary
 * @fires tc-summarise - Summarise was pressed while `status` is "idle" – start summarising
 * @fires tc-retry - Regenerate, Retry after an error, or Update when stale ({ reason: "regenerate" | "error" | "stale" }: AiSummaryRetry)
 * @fires tc-length-change - Short or Detailed was picked ({ length }: AiSummaryLengthChange); cancelable – prevented, `length` stays as it was
 * @fires tc-cite-open - A citation chip was used ({ sourceId, pointId }: AiSummaryCiteOpen); cancelable – prevented, a link to the source doesn't open
 * @fires tc-feedback - Helpful or not helpful was pressed, or pressed again to take it back ({ value }: AiSummaryFeedback); cancelable – prevented, `feedback` stays as it was
 * @fires tc-copy - The summary is on the clipboard ({ text })
 */
export class TcAiSummary extends TcElement {
  static override ui = "aism";

  /** The heading */
  @property() accessor heading = "Summary";
  /** What was summarised, named before the counts: "#launch-q3" */
  @property() accessor subject: string | undefined = undefined;
  /** The sources summarised, in citation order – a point's chip shows its source's number in this list */
  @property({ attribute: false }) accessor sources: AiSummarySource[] = [];
  /** Where the summary is: "idle", "summarising", "done" or "error" */
  @property({ reflect: true }) accessor status: AiSummaryStatus = "idle";
  /** The one-line gist, shown first and emphasised */
  @property() accessor tldr = "";
  /** The summary; may grow while "summarising". Blank lines split paragraphs */
  @property() accessor summary = "";
  /** The key points, each with the sources it comes from */
  @property({ attribute: false }) accessor points: AiSummaryPoint[] = [];
  /** What the sources leave open */
  @property({ attribute: false }) accessor questions: string[] = [];
  /** Short or detailed. Changed by the user unless a tc-length-change listener calls preventDefault() */
  @property({ reflect: true }) accessor length: AiSummaryLength = "short";
  /** The model that wrote it, e.g. "Claude Sonnet" */
  @property() accessor model: string | undefined = undefined;
  /** When it was generated, epoch ms */
  @property({ type: Number, attribute: "generated-at" }) accessor generatedAt: number | undefined = undefined;
  /** "Now" for the relative time and freshness, epoch ms; unset, the element keeps its own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The sources have moved on since the summary: true, or how many new items there are. Sources dated after `generatedAt` count too */
  @property({ attribute: false }) accessor stale: boolean | number = false;
  /** The banner's words in place of "3 new messages since this summary" */
  @property({ attribute: "stale-label" }) accessor staleLabel: string | undefined = undefined;
  /** Whether it helped: "up", "down" or null. Changed by the user unless a tc-feedback listener calls preventDefault() */
  @property({ attribute: false }) accessor feedback: AiSummaryFeedbackValue = null;
  /** The list of sources under the footer is open */
  @property({ type: Boolean, reflect: true, attribute: "sources-open" }) accessor sourcesOpen = false;
  /** What went wrong, shown with "error" */
  @property() accessor error: string | undefined = undefined;
  /** The language for dates and numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor clock = 0;
  @state() private accessor copied = false;
  @state() private accessor announce = "";
  /** The citation chip whose source is previewed: "point:source" */
  @state() private accessor tip = "";

  private uid = `tc-aism-${++uidCount}`;
  private copiedTimer = 0;
  private timer = 0;

  constructor() {
    super();
    // The shimmer pauses while the element is off screen
    new OffScreenController(this, () => this.status === "summarising");
    // Focus never drops to <body> when a button it was on goes away (Summarise, Retry, Update)
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-aism__len [tabindex='0']"));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.tick();
    this.timer = window.setInterval(this.tick, 30_000);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
    clearTimeout(this.copiedTimer);
  }
  /** The clock read: only when the page doesn't give `now` */
  private tick = () => {
    if (this.now === undefined) this.clock = Date.now();
  };

  /* ---------- The model ---------- */

  private get at() {
    return this.now ?? this.clock;
  }
  private kindOf(s: AiSummarySource): AiSummarySourceKind {
    return s.kind && KIND_NOUN[s.kind] ? s.kind : "other";
  }
  private count(n: number, kind: AiSummarySourceKind) {
    return `${new Intl.NumberFormat(this.locale).format(n)} ${KIND_NOUN[kind][n === 1 ? 0 : 1]}`;
  }
  /** "12 messages · 3 documents" */
  private get counts() {
    return KINDS.map((k) => [k, this.sources.filter((s) => this.kindOf(s) === k).length] as const)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => this.count(n, k))
      .join(" · ");
  }
  /** Sources dated after the summary */
  private get newer() {
    const g = this.generatedAt;
    return g === undefined ? [] : this.sources.filter((s) => s.at !== undefined && s.at > g);
  }
  /** The freshness banner's words, or "" when the summary is current */
  private get staleText() {
    const newer = this.newer;
    if (this.stale === false && !newer.length) return "";
    if (this.staleLabel) return this.staleLabel;
    const n = typeof this.stale === "number" && this.stale > 0 ? this.stale : newer.length;
    if (!n) return this.stale === true ? "The sources have changed since this summary" : "";
    // Named by kind when the new sources share one – "3 new messages" – else "3 new sources"
    const kinds = new Set(newer.map((s) => this.kindOf(s)));
    const kind = kinds.size === 1 ? [...kinds][0] : "other";
    return `${new Intl.NumberFormat(this.locale).format(n)} new ${KIND_NOUN[kind][n === 1 ? 0 : 1]} since this summary`;
  }
  private sourceIndex(id: string) {
    return this.sources.findIndex((s) => s.id === id);
  }

  /** The summary as plain text, for Copy: the gist, the summary, the points with their source numbers and the sources */
  private get plainText() {
    const points = this.points.map((p) => {
      const refs = (p.sources ?? []).map((id) => this.sourceIndex(id) + 1).filter((n) => n > 0);
      return `• ${p.text}${refs.length ? ` ${refs.map((n) => `[${n}]`).join("")}` : ""}`;
    });
    const qs = this.questions.map((q) => `• ${q}`);
    const srcs = this.sources.map((s, i) => `[${i + 1}] ${s.label}${s.href ? ` – ${s.href}` : ""}`);
    return [
      this.heading + (this.subject ? ` – ${this.subject}` : ""),
      ...(this.tldr ? ["", `TL;DR: ${this.tldr.trim()}`] : []),
      ...(this.summary.trim() ? ["", this.summary.trim()] : []),
      ...(points.length ? ["", "Key points", ...points] : []),
      ...(qs.length ? ["", "Open questions", ...qs] : []),
      ...(srcs.length ? ["", "Sources", ...srcs] : []),
    ].join("\n");
  }

  /* ---------- Actions ---------- */

  private async copy() {
    const text = this.plainText;
    if (!(await copyText(text))) return;
    this.copied = true;
    this.announce = "Summary copied";
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = false), 1800);
    this.emit("tc-copy", { text });
  }

  private setLength(next: AiSummaryLength) {
    if (next === this.length) return;
    if (!this.emit<AiSummaryLengthChange>("tc-length-change", { length: next }, { cancelable: true })) return;
    this.length = next;
  }

  private onLengthKey(e: KeyboardEvent) {
    const order = ["short", "detailed"] as const;
    const at = order.indexOf(this.length);
    const to = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key) ? (at + 1) % 2 : e.key === "Home" ? 0 : e.key === "End" ? 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.setLength(order[to]);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-aism__len [data-len="${this.length}"]`)?.focus());
  }

  private setFeedback(pressed: "up" | "down") {
    const next = this.feedback === pressed ? null : pressed;
    if (!this.emit<AiSummaryFeedback>("tc-feedback", { value: next }, { cancelable: true })) return;
    this.feedback = next;
    this.announce = next === "up" ? "Marked as helpful" : next === "down" ? "Marked as not helpful" : "Feedback cleared";
  }

  private openCite(e: Event, point: AiSummaryPoint, source: AiSummarySource) {
    if (!this.emit<AiSummaryCiteOpen>("tc-cite-open", { sourceId: source.id, pointId: point.id }, { cancelable: true })) e.preventDefault();
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const was = changed.get("status") as AiSummaryStatus | undefined;
    const what = this.subject ?? "these sources";
    // Announced politely when the status changes, not on the first render
    if (changed.has("status") && was !== undefined) {
      if (this.status === "summarising") this.announce = `Summarising ${what}`;
      else if (this.status === "done") this.announce = `Summary of ${what} ready`;
      else if (this.status === "error") this.announce = `Couldn't summarise ${what}${this.error ? `: ${this.error}` : ""}`;
      else this.announce = "";
    }
    if (changed.has("status") && this.status !== "done") this.copied = false;
  }

  /* ---------- Rendering ---------- */

  private renderHead() {
    const by = [this.model, this.generatedAt !== undefined && this.status === "done" && this.at ? aiSummaryAgo(this.generatedAt, this.at, this.locale) : ""].filter(Boolean);
    const counts = this.counts;
    const about = [this.subject, counts].filter(Boolean).join(" · ");
    return cardHead({
      icon: sparkles,
      title: this.heading,
      subtitle: html`${about ? html`<span class="ui-aism__about">${about}</span>` : nothing}<span class="ui-aism__ai"
          ><span class="ui-aism__ai-tag">AI-generated</span>${by.length ? html`<span class="ui-aism__ai-by">${by.join(" · ")}</span>` : nothing}</span
        >`,
      id: `${this.uid}-title`,
      aside: html`<div class="ui-aism__len" role="radiogroup" aria-label="Summary length" @keydown=${this.onLengthKey}>
        ${(["short", "detailed"] as const).map(
          (l) => html`<button
            type="button"
            role="radio"
            class="ui-aism__len-opt"
            data-len=${l}
            aria-checked=${this.length === l ? "true" : "false"}
            tabindex=${this.length === l ? 0 : -1}
            @click=${() => this.setLength(l)}
          >${l === "short" ? "Short" : "Detailed"}</button>`,
        )}
      </div>`,
    });
  }

  private renderStale() {
    const text = this.staleText;
    if (!text || this.status !== "done") return nothing;
    return html`<div class="ui-aism__stale">
      <span class="ui-aism__stale-dot" aria-hidden="true"></span>
      <p class="ui-aism__stale-text">${text}</p>
      <button type="button" class="tc-btn-sm ui-aism__update" @click=${() => this.emit<AiSummaryRetry>("tc-retry", { reason: "stale" })}>${refreshIcon()}<span>Update</span></button>
    </div>`;
  }

  private renderSummary() {
    const streaming = this.status === "summarising";
    const paras = this.summary.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const tldr = this.tldr.trim();
    if (!paras.length && !tldr && streaming)
      return html`<div class="ui-aism__skeleton" aria-hidden="true"><span></span><span></span><span></span></div>`;
    return html`<div class="ui-aism__summary" aria-busy=${streaming ? "true" : "false"}>
      ${tldr
        ? html`<p class="ui-aism__tldr"><span class="ui-aism__tldr-tag">TL;DR</span> <span class="ui-aism__tldr-text">${tldr}${streaming && !paras.length ? html`<span class="ui-aism__caret" aria-hidden="true"></span>` : nothing}</span></p>`
        : nothing}
      ${paras.map((p, i) => html`<p class="ui-aism__p">${p}${streaming && i === paras.length - 1 ? html`<span class="ui-aism__caret" aria-hidden="true"></span>` : nothing}</p>`)}
    </div>`;
  }

  private renderCite(point: AiSummaryPoint, id: string) {
    const i = this.sourceIndex(id);
    const source = this.sources[i];
    if (!source) return nothing;
    const key = `${point.id}:${id}`;
    const open = this.tip === key;
    const show = () => (this.tip = key);
    const hide = () => {
      if (this.tip === key) this.tip = "";
    };
    // Read as "Source 2: Priya in #launch"; seen as "2", with the name in a tooltip on hover or focus
    const body = html`<span class="tc-sr-only">Source ${i + 1}: ${source.label}</span><span aria-hidden="true">${i + 1}</span>`;
    const events = {
      enter: show,
      leave: hide,
      key: (e: KeyboardEvent) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          hide();
        }
      },
    };
    const chip = source.href
      ? html`<a
          class="ui-aism__cite"
          href=${source.href}
          target="_blank"
          rel="noopener"
          @click=${(e: Event) => this.openCite(e, point, source)}
          @pointerenter=${events.enter}
          @pointerleave=${events.leave}
          @focus=${events.enter}
          @blur=${events.leave}
          @keydown=${events.key}
          >${body}</a
        >`
      : html`<button
          type="button"
          class="ui-aism__cite"
          @click=${(e: Event) => this.openCite(e, point, source)}
          @pointerenter=${events.enter}
          @pointerleave=${events.leave}
          @focus=${events.enter}
          @blur=${events.leave}
          @keydown=${events.key}
        >${body}</button>`;
    return html`<span class="ui-aism__cite-wrap">${chip}${open
        ? html`<span class="ui-aism__tip" aria-hidden="true"><span class="ui-aism__tip-kind">${lucide(KIND_ICON[this.kindOf(source)], 12)}</span>${source.label}</span>`
        : nothing}</span>`;
  }

  private renderPoints() {
    if (!this.points.length) return nothing;
    return html`<section class="ui-aism__section" aria-labelledby=${`${this.uid}-points`}>
      <h4 class="ui-aism__caption" id=${`${this.uid}-points`}>Key points</h4>
      <ul class="ui-aism__points">
        ${repeat(
          this.points,
          (p) => p.id,
          (p) => html`<li class="ui-aism__point">
            <span class="ui-aism__bullet" aria-hidden="true"></span>
            <span class="ui-aism__point-text">${p.text}${(p.sources ?? []).map((id) => html` ${this.renderCite(p, id)}`)}</span>
          </li>`,
        )}
      </ul>
    </section>`;
  }

  private renderQuestions() {
    if (!this.questions.length) return nothing;
    return html`<section class="ui-aism__section" aria-labelledby=${`${this.uid}-qs`}>
      <h4 class="ui-aism__caption" id=${`${this.uid}-qs`}>Open questions</h4>
      <ul class="ui-aism__points">
        ${this.questions.map((q) => html`<li class="ui-aism__point ui-aism__question"><span class="ui-aism__q-mark" aria-hidden="true">?</span><span class="ui-aism__point-text">${q}</span></li>`)}
      </ul>
    </section>`;
  }

  private renderBody() {
    const s = this.status;
    if (s === "idle")
      return html`<div class="ui-aism__idle">
        <p class="ui-aism__idle-text">Get the gist${this.sources.length ? ` of ${this.counts}` : ""}, the key points with their sources, and what's still open.</p>
        <button type="button" class="ui-aism__primary" @click=${() => this.emit("tc-summarise", null)}>${lucide(sparkles, 14)}Summarise</button>
      </div>`;
    if (s === "error")
      return html`<div class="ui-aism__error" role="alert">
        <span class="ui-aism__error-icon">${alertIcon()}</span>
        <div class="ui-aism__error-text">
          <p class="ui-aism__error-title">Couldn't summarise${this.subject ? ` ${this.subject}` : " these sources"}</p>
          ${this.error ? html`<p class="ui-aism__error-detail">${this.error}</p>` : nothing}
        </div>
        <button type="button" class="tc-btn-sm ui-aism__retry" @click=${() => this.emit<AiSummaryRetry>("tc-retry", { reason: "error" })}>${refreshIcon()}Retry</button>
      </div>`;
    return html`${this.renderStale()}
      <div class="ui-aism__body">${this.renderSummary()} ${this.renderPoints()} ${this.renderQuestions()}</div>`;
  }

  private renderSources() {
    if (!this.sourcesOpen || !this.sources.length) return nothing;
    return html`<ol class="ui-aism__sources" id=${`${this.uid}-sources`} aria-label="Sources">
      ${repeat(
        this.sources,
        (s) => s.id,
        (s, i) => {
          const when = s.at !== undefined && this.at ? aiSummaryAgo(s.at, this.at, this.locale) : "";
          const label = html`<span class="ui-aism__src-label">${s.label}</span>`;
          return html`<li class="ui-aism__src" data-kind=${this.kindOf(s)}>
            <span class="ui-aism__src-n" aria-hidden="true">${i + 1}</span>
            <span class="ui-aism__src-icon" title=${KIND_NOUN[this.kindOf(s)][0]}>${lucide(KIND_ICON[this.kindOf(s)], 14)}</span>
            ${s.href ? html`<a class="ui-aism__src-link" href=${s.href} target="_blank" rel="noopener">${label}</a>` : label}
            ${when ? html`<span class="ui-aism__src-at">${when}</span>` : nothing}
          </li>`;
        },
      )}
    </ol>`;
  }

  private renderFoot() {
    const s = this.status;
    if (s === "idle" || s === "error") return nothing;
    const done = s === "done";
    return html`<div class="ui-aism__foot">
        <span class="ui-aism__helpful" role="group" aria-labelledby=${`${this.uid}-helpful`}>
          <span class="ui-aism__helpful-label" id=${`${this.uid}-helpful`}>Was this helpful?</span>
          <button type="button" class="ui-aism__thumb" data-value="up" aria-label="Helpful" aria-pressed=${this.feedback === "up" ? "true" : "false"} ?disabled=${!done} @click=${() => this.setFeedback("up")}>${upIcon()}</button>
          <button type="button" class="ui-aism__thumb" data-value="down" aria-label="Not helpful" aria-pressed=${this.feedback === "down" ? "true" : "false"} ?disabled=${!done} @click=${() => this.setFeedback("down")}>${downIcon()}</button>
        </span>
        <span class="ui-aism__actions">
          ${this.sources.length
            ? html`<button
                type="button"
                class="tc-btn-sm ui-aism__src-toggle"
                aria-expanded=${this.sourcesOpen ? "true" : "false"}
                aria-controls=${`${this.uid}-sources`}
                @click=${() => (this.sourcesOpen = !this.sourcesOpen)}
              ><span>Sources</span><span class="ui-aism__src-count">${this.sources.length}</span>${chevronIcon()}</button>`
            : nothing}
          <button type="button" class="tc-btn-sm ui-aism__copy" ?disabled=${!done} ?data-copied=${this.copied} @click=${() => void this.copy()}>
            ${this.copied ? checkIcon() : copyIcon()}<span>${this.copied ? "Copied" : "Copy"}</span>
          </button>
          <button type="button" class="tc-btn-sm ui-aism__regen" ?disabled=${!done} @click=${() => this.emit<AiSummaryRetry>("tc-retry", { reason: "regenerate" })}>${refreshIcon()}<span>Regenerate</span></button>
        </span>
      </div>
      ${this.renderSources()}`;
  }

  protected override render() {
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${this.renderHead()}
      <div class="ui-aism__card">${this.renderBody()} ${this.renderFoot()}</div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="aism"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="aism"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
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
[data-ui="aism"] *, [data-ui="aism"] *::before, [data-ui="aism"] *::after { box-sizing: border-box; }
:where([data-ui="aism"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="aism"] :is(button, a):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="aism"] :is(ul, ol) { margin: 0; padding: 0; list-style: none; }
[data-ui="aism"] h4, [data-ui="aism"] p { margin: 0; }
[data-ui="aism"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="aism"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-aism__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header: what was summarised, that it's AI-generated, and Short / Detailed ----- */
[data-ui="aism"] .tc-head__icon { color: var(--tc-tone-violet-fg); }
.ui-aism__about { display: block; }
.ui-aism__ai { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1) !important; }
.ui-aism__ai-tag { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); }
.ui-aism__ai-by { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-aism__len { display: flex; flex: none; gap: var(--tc-space-0-5); padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-aism__len-opt { display: inline-flex; align-items: center; height: 24px; padding: 0 var(--tc-space-2-5) !important; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-aism__len-opt[aria-checked="true"] { background: var(--tc-seg-thumb-bg); color: var(--tc-text-primary); box-shadow: var(--tc-seg-thumb-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-aism__len-opt[aria-checked="true"] { font-weight: var(--tc-font-weight-strong); }
/* ----- Idle: what a summary gives, and Summarise ----- */
.ui-aism__idle { display: grid; justify-items: start; gap: var(--tc-space-3); padding: var(--tc-space-4); }
.ui-aism__idle-text { color: var(--tc-text-secondary); line-height: var(--tc-line-height-snug); }
.ui-aism__primary { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md) !important; border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg) !important; box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg) !important; font-size: var(--tc-control-font-size) !important; font-weight: var(--tc-control-font-weight) !important; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aism__primary:hover { background: var(--tc-action-primary-bg-hover) !important; }
.ui-aism__primary:active { background: var(--tc-action-primary-bg-active) !important; }
/* ----- Freshness: the sources have moved on ----- */
.ui-aism__stale { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-2-5); margin: var(--tc-space-3) var(--tc-space-3) 0; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-aism__stale-dot { flex: none; width: 6px; height: 6px; border-radius: var(--tc-radius-full); background: var(--tc-status-warning-fg); }
.ui-aism__stale-text { flex: 1 1 12rem; min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
/* ----- The summary: the TL;DR, then paragraphs that stream in, or a shimmer before the first words ----- */
.ui-aism__body { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-aism__body { padding-top: var(--tc-space-2); }
.ui-aism__summary { display: grid; gap: var(--tc-space-2); }
.ui-aism__tldr { padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); }
.ui-aism__tldr-tag { margin-right: var(--tc-space-1) !important; font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); color: var(--tc-tone-violet-fg); }
.ui-aism__p { color: var(--tc-text-primary); line-height: var(--tc-line-height-relaxed); }
:where([data-look="clean"], [data-look="clean"] *).ui-aism__p { line-height: var(--tc-line-height-loose); }
.ui-aism__caret { display: inline-block; width: 2px; height: 1em; margin-left: var(--tc-space-0-5); vertical-align: text-bottom; background: var(--tc-accent); animation: ui-aism-blink var(--tc-duration-shimmer) steps(2, start) infinite; }
.ui-aism__skeleton { display: grid; gap: var(--tc-space-2); }
.ui-aism__skeleton > span { position: relative; display: block; height: 12px; overflow: hidden; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-default); }
.ui-aism__skeleton > span:nth-child(2) { width: 92%; }
.ui-aism__skeleton > span:nth-child(3) { width: 64%; }
.ui-aism__skeleton > span::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, var(--tc-shimmer), transparent); transform: translateX(-100%); animation: ui-aism-shimmer var(--tc-duration-shimmer) linear infinite; }
[data-offscreen] .ui-aism__skeleton > span::after, [data-offscreen] .ui-aism__caret { animation-play-state: paused; }
/* ----- Key points with their source chips, and open questions ----- */
.ui-aism__section { display: grid; gap: var(--tc-space-2); min-width: 0; }
.ui-aism__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-aism__points { display: grid; gap: var(--tc-space-2); }
.ui-aism__point { display: flex; gap: var(--tc-space-2); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-aism__bullet { display: flex; flex: none; align-items: center; height: 1lh; }
.ui-aism__bullet::before { content: ""; width: 5px; height: 5px; border-radius: var(--tc-radius-full); background: var(--tc-icon-muted); }
.ui-aism__q-mark { display: grid; flex: none; place-items: center; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary); }
.ui-aism__point-text { min-width: 0; }
.ui-aism__cite-wrap { position: relative; display: inline-block; }
.ui-aism__cite { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1) !important; border-radius: var(--tc-radius-badge); background: var(--tc-fill-default) !important; font-size: var(--tc-font-size-2xs) !important; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary) !important; text-decoration: none; font-variant-numeric: tabular-nums; vertical-align: text-bottom; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aism__cite:hover, .ui-aism__cite:focus-visible { background: var(--tc-fill-selected) !important; color: var(--tc-accent-text) !important; }
.ui-aism__tip { position: absolute; bottom: calc(100% + var(--tc-space-1-5)); left: 50%; z-index: var(--tc-z-popover); display: flex; align-items: center; gap: var(--tc-space-1-5); width: max-content; max-width: 260px; padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); color: var(--tc-tooltip-fg); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-tooltip-font-size); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-snug); pointer-events: none; transform: translateX(-50%); animation: ui-aism-in var(--tc-duration-fast) var(--tc-ease-standard) both; }
.ui-aism__tip-kind { opacity: 0.8; }
/* ----- The footer: was it helpful, Sources, Copy and Regenerate ----- */
.ui-aism__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-aism__helpful { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-aism__helpful-label { margin-right: var(--tc-space-1) !important; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-aism__thumb { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aism__thumb:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-aism__thumb[aria-pressed="true"] { background: var(--tc-fill-selected); color: var(--tc-accent-text); }
.ui-aism__thumb:disabled { cursor: default; opacity: 0.5; }
.ui-aism__actions { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-aism__copy[data-copied] { color: var(--tc-status-success-fg); }
.ui-aism__src-count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-aism__src-toggle > svg { transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-aism__src-toggle[aria-expanded="true"] > svg { transform: rotate(180deg); }
/* ----- The sources, numbered as the chips cite them ----- */
.ui-aism__sources { display: grid; gap: var(--tc-space-1); padding: 0 var(--tc-space-4) var(--tc-space-3) !important; animation: ui-aism-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-aism__src { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-aism__src-n { flex: none; min-width: 18px; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; text-align: right; }
.ui-aism__src-icon { flex: none; color: var(--tc-icon-muted); }
.ui-aism__src-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-aism__src-link { min-width: 0; overflow: hidden; color: var(--tc-accent-text); text-decoration: none; }
.ui-aism__src-link:hover { text-decoration: underline; }
.ui-aism__src-at { flex: none; margin-left: auto !important; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
/* ----- Error ----- */
.ui-aism__error { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); margin: var(--tc-space-3); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-aism__error-icon { display: flex; align-items: center; height: 1lh; }
.ui-aism__error-text { flex: 1; min-width: 0; }
.ui-aism__error-title { font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
.ui-aism__error-detail { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
@keyframes ui-aism-shimmer { to { transform: translateX(100%); } }
@keyframes ui-aism-blink { to { visibility: hidden; } }
@keyframes ui-aism-in { from { opacity: 0; } }
@container (max-width: 420px) {
  .ui-aism__actions .tc-btn-sm:not(.ui-aism__src-toggle) > span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-aism__helpful-label { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="aism"] *, [data-ui="aism"] *::before, [data-ui="aism"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-aism__cite, .ui-aism__ai-tag { border: 1px solid ButtonText; }
  .ui-aism__len-opt[aria-checked="true"], .ui-aism__thumb[aria-pressed="true"] { outline: 2px solid Highlight; }
}
`;
}

if (!customElements.get("tc-ai-summary")) customElements.define("tc-ai-summary", TcAiSummary);

declare global {
  interface HTMLElementTagNameMap {
    "tc-ai-summary": TcAiSummary;
  }
}

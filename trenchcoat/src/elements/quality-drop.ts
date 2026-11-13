import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-quality-drop> – one drop in a judge score on live chats, and what to do about it: what fell (the criterion, from
 * → to, since when, over how many chats), a small chart round the drop, the likely cause – the change that went live
 * nearest the drop, with how sure that is in words and the failing chats that point to it – the topics the failures
 * cluster in, and three ways out: roll back, investigate, or dismiss it as expected.
 *   · Roll back asks first, saying what reverts; confirming fires tc-rollback, and the card then reads "Rolled back"
 *   · Dismiss as expected folds the card to one line with Undo
 *   · `status` ("open", "rolled-back", "dismissed") changes on its own; preventDefault() on tc-status-change keeps
 *     control, and on tc-rollback keeps the card open
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-quality-drop criterion="Correctness" .from=${4.4} .to=${3.6} .at=${…} .cause=${…}></tc-quality-drop>
 */

export type QualityDropPoint = { date: number; value: number };
export type QualityDropConfidence = "high" | "medium" | "low";
export type QualityDropChange = {
  /** What changed – "Prompt v13 → v14" */
  label: string;
  /** When it went live, as epoch ms */
  at: number;
  kind?: "prompt" | "model" | "tool" | "other";
};
export type QualityDropCause = {
  change: QualityDropChange;
  /** How sure the link is – said in words */
  confidence: QualityDropConfidence;
  /** Why this change, in a line – "Started the day the scores fell; failing answers skip the policy citation" */
  reason?: string;
};
export type QualityDropEvidence = {
  id: string;
  /** A short quote from the failing chat – the part that shows the problem */
  quote: string;
  /** What the judge said about it */
  note?: string;
};
export type QualityDropSegment = {
  id: string;
  /** The topic – "Refunds", "Travel policy" */
  label: string;
  /** Its share of the failing chats, 0–1 */
  share: number;
};
export type QualityDropStatus = "open" | "rolled-back" | "dismissed";
export type QualityDropStatusChange = { status: QualityDropStatus };
export type QualityDropRollback = { version: string };
export type QualityDropInvestigate = { criterion: string };
export type QualityDropChatOpen = { id: string; evidence: QualityDropEvidence };

const CONFIDENCE: Record<QualityDropConfidence, { title: string; word: string }> = {
  high: { title: "Likely cause", word: "High confidence" },
  medium: { title: "Possible cause", word: "Medium confidence" },
  low: { title: "Unclear cause", word: "Low confidence" },
};

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult) => html`<svg class="ui-qdr__glyph" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/** trending-down */
const mark = svg`<path d="M16 17h6v-6"></path><path d="m22 17-8.5-8.5-5 5L2 7"></path>`;
const undoIcon = glyph(svg`<path d="M9 14 4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"></path>`);
const searchIcon = glyph(svg`<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>`);
const checkIcon = glyph(svg`<path d="M20 6 9 17l-5-5"></path>`);

let instances = 0;

/**
 * One drop in a judge score on live chats – what fell, the likely cause with its evidence, the topics it clusters in,
 * and Roll back, Investigate or Dismiss as expected.
 * @tag tc-quality-drop
 * @fires tc-rollback - Roll back was confirmed ({ version }: QualityDropRollback); cancelable – prevented, the card stays open
 * @fires tc-status-change - The drop was rolled back, dismissed or reopened ({ status }: QualityDropStatusChange); cancelable – prevented, `status` stays as it was
 * @fires tc-investigate - Investigate was pressed ({ criterion }: QualityDropInvestigate)
 * @fires tc-chat-open - A failing chat's quote was opened ({ id, evidence }: QualityDropChatOpen)
 */
export class TcQualityDrop extends TcElement {
  static override ui = "qdr";

  /** The heading */
  @property() accessor heading = "Quality drop";
  /** The criterion that fell – "Correctness" */
  @property() accessor criterion = "";
  /** Its mean before the drop */
  @property({ type: Number }) accessor from = 0;
  /** Its mean since */
  @property({ type: Number }) accessor to = 0;
  /** When it fell, as epoch ms */
  @property({ type: Number }) accessor at = 0;
  /** How many chats were scored since it fell */
  @property({ type: Number }) accessor chats = 0;
  /** The daily mean round the drop, for the small chart */
  @property({ attribute: false }) accessor series: QualityDropPoint[] = [];
  /** The likely cause, or null when nothing lines up */
  @property({ attribute: false }) accessor cause: QualityDropCause | null = null;
  /** Failing chats that point to the cause, as short quotes */
  @property({ attribute: false }) accessor evidence: QualityDropEvidence[] = [];
  /** The topics the failing chats fall in, with their share */
  @property({ attribute: false }) accessor segments: QualityDropSegment[] = [];
  /** The version Roll back returns to – "v13"; empty hides Roll back */
  @property({ attribute: "rollback-to" }) accessor rollbackTo = "";
  /** What rolling back reverts, a line each – said before it's confirmed */
  @property({ attribute: false }) accessor reverts: string[] = [];
  /** "open", "rolled-back" or "dismissed" */
  @property({ reflect: true }) accessor status: QualityDropStatus = "open";
  /** Formats dates and numbers */
  @property() accessor locale = "en-US";
  /** The time zone dates are read in */
  @property({ attribute: "time-zone" }) accessor timeZone = "UTC";

  /** @internal Roll back's confirmation is open */
  @state() accessor confirming = false;
  /** @internal What the status region says */
  @state() accessor spoken = "";

  private readonly uid = `tc-qdr${++instances}`;

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("status") && this.status !== "open") this.confirming = false;
  }

  /** @internal */
  private get dateFmt() {
    return new Intl.DateTimeFormat(this.locale, { day: "numeric", month: "short", timeZone: this.timeZone });
  }

  /** @internal */
  private score(n: number) {
    return n.toLocaleString(this.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  /** @internal */
  private setStatus(status: QualityDropStatus, focus?: string) {
    if (status === this.status) return true;
    if (!this.emit<QualityDropStatusChange>("tc-status-change", { status }, { cancelable: true })) return false;
    this.status = status;
    this.spoken = status === "rolled-back" ? `Rolled back to ${this.rollbackTo}` : status === "dismissed" ? "Dismissed as expected" : "Reopened";
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(focus)?.focus());
    return true;
  }

  /** @internal */
  private askRollback() {
    this.confirming = true;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-qdr__confirm-go")?.focus());
  }

  /** @internal */
  private cancelRollback() {
    this.confirming = false;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-qdr__rollback")?.focus());
  }

  /** @internal */
  private confirmRollback() {
    if (!this.emit<QualityDropRollback>("tc-rollback", { version: this.rollbackTo }, { cancelable: true })) return;
    this.confirming = false;
    this.setStatus("rolled-back", ".ui-qdr__undo");
  }

  /** @internal The small chart: the daily mean, a rule where it fell and a dashed one where the cause went live */
  private chart() {
    const pts = [...this.series].sort((a, b) => a.date - b.date);
    if (pts.length < 2) return nothing;
    const t0 = pts[0].date;
    const t1 = pts[pts.length - 1].date;
    const vals = pts.map((p) => p.value);
    const lo = Math.min(...vals, this.to);
    const hi = Math.max(...vals, this.from);
    const pad = (hi - lo) * 0.15 || 0.5;
    const x = (t: number) => (t1 > t0 ? ((t - t0) / (t1 - t0)) * 100 : 50);
    const y = (v: number) => (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * 100;
    const inside = (t: number) => t >= t0 && t <= t1;
    const cause = this.cause?.change;
    const fmt = this.dateFmt;
    return html`<figure class="ui-qdr__chart">
      <div class="ui-qdr__plot" aria-hidden="true">
        <svg class="ui-qdr__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          ${svg`<line class="ui-qdr__base" x1="0" x2="100" y1=${y(this.from)} y2=${y(this.from)} vector-effect="non-scaling-stroke"></line>`}
          ${cause && inside(cause.at) ? svg`<line class="ui-qdr__rule" data-kind="cause" x1=${x(cause.at)} x2=${x(cause.at)} y1="0" y2="100" vector-effect="non-scaling-stroke"></line>` : nothing}
          ${this.at && inside(this.at) ? svg`<line class="ui-qdr__rule" data-kind="drop" x1=${x(this.at)} x2=${x(this.at)} y1="0" y2="100" vector-effect="non-scaling-stroke"></line>` : nothing}
          ${svg`<polyline class="ui-qdr__line" points=${pts.map((p) => `${x(p.date)},${y(p.value)}`).join(" ")} vector-effect="non-scaling-stroke"></polyline>`}
        </svg>
        <span class="ui-qdr__end" style=${styleMap({ left: `${x(t1)}%`, top: `${y(pts[pts.length - 1].value)}%` })}></span>
      </div>
      <figcaption class="ui-qdr__chart-key">
        <span>${fmt.format(t0)}</span>
        ${cause && inside(cause.at) ? html`<span class="ui-qdr__key" data-kind="cause">${cause.label} · ${fmt.format(cause.at)}</span>` : nothing}
        <span>${fmt.format(t1)}</span>
      </figcaption>
    </figure>`;
  }

  /** @internal The likely cause and its evidence */
  private causeBlock() {
    const cause = this.cause;
    const fmt = this.dateFmt;
    if (!cause)
      return html`<section class="ui-qdr__cause" aria-labelledby=${`${this.uid}-cause`}>
        <h4 class="ui-qdr__label" id=${`${this.uid}-cause`}>Cause</h4>
        <p class="ui-qdr__muted">No change went live near the drop.</p>
      </section>`;
    const c = CONFIDENCE[cause.confidence];
    return html`<section class="ui-qdr__cause" aria-labelledby=${`${this.uid}-cause`}>
      <h4 class="ui-qdr__label" id=${`${this.uid}-cause`}>${c.title}</h4>
      <p class="ui-qdr__change">
        <span class="ui-qdr__change-label">${cause.change.label}</span>
        <span class="ui-qdr__muted">went live ${fmt.format(cause.change.at)}</span>
        <span class="ui-qdr__pill" data-confidence=${cause.confidence}>${c.word}</span>
      </p>
      ${cause.reason ? html`<p class="ui-qdr__reason">${cause.reason}</p>` : nothing}
      ${this.evidence.length
        ? html`<ul class="ui-qdr__evidence" aria-label="Failing chats">
            ${this.evidence.map(
              (ev) => html`<li class="ui-qdr__quote">
                <button type="button" class="ui-qdr__quote-btn" @click=${() => this.emit<QualityDropChatOpen>("tc-chat-open", { id: ev.id, evidence: ev })}>
                  <q class="ui-qdr__quote-text">${ev.quote}</q>
                  ${ev.note ? html`<span class="ui-qdr__quote-note">${ev.note}</span>` : nothing}
                  <span class="ui-qdr__sr">, open chat</span>
                </button>
              </li>`,
            )}
          </ul>`
        : nothing}
    </section>`;
  }

  /** @internal Where the failing chats cluster */
  private segmentsBlock() {
    if (!this.segments.length) return nothing;
    const pct = (n: number) => `${Math.round(Math.max(0, Math.min(1, n)) * 100)}%`;
    return html`<section class="ui-qdr__segments" aria-labelledby=${`${this.uid}-segments`}>
      <h4 class="ui-qdr__label" id=${`${this.uid}-segments`}>Where it fails</h4>
      <ul class="ui-qdr__chips">
        ${[...this.segments]
          .sort((a, b) => b.share - a.share)
          .map(
            (s) => html`<li class="ui-qdr__chip">
              <span class="ui-qdr__chip-label">${s.label}</span>
              <span class="ui-qdr__chip-share">${pct(s.share)}<span class="ui-qdr__sr"> of failing chats</span></span>
              <span class="ui-qdr__chip-bar" aria-hidden="true"><span style=${styleMap({ width: pct(s.share) })}></span></span>
            </li>`,
          )}
      </ul>
    </section>`;
  }

  /** @internal Roll back, Investigate, Dismiss – or the confirmation */
  private actions() {
    if (this.confirming)
      return html`<div class="ui-qdr__confirm" role="group" aria-labelledby=${`${this.uid}-confirm`} @keydown=${(e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        this.cancelRollback();
      }}>
        <p class="ui-qdr__confirm-title" id=${`${this.uid}-confirm`}>Roll back to ${this.rollbackTo}?</p>
        ${this.reverts.length
          ? html`<p class="ui-qdr__muted">This reverts:</p>
              <ul class="ui-qdr__reverts">${this.reverts.map((r) => html`<li>${r}</li>`)}</ul>`
          : html`<p class="ui-qdr__muted">Live chats go back to ${this.rollbackTo} straight away.</p>`}
        <div class="ui-qdr__actions">
          <button type="button" class="ui-qdr__btn ui-qdr__btn--danger ui-qdr__confirm-go" @click=${() => this.confirmRollback()}>Roll back to ${this.rollbackTo}</button>
          <button type="button" class="ui-qdr__btn ui-qdr__btn--quiet" @click=${() => this.cancelRollback()}>Cancel</button>
        </div>
      </div>`;
    return html`<div class="ui-qdr__actions">
      ${this.rollbackTo
        ? html`<button type="button" class="ui-qdr__btn ui-qdr__btn--primary ui-qdr__rollback" @click=${() => this.askRollback()}>${undoIcon}Roll back to ${this.rollbackTo}</button>`
        : nothing}
      <button type="button" class="ui-qdr__btn ui-qdr__btn--quiet" @click=${() => this.emit<QualityDropInvestigate>("tc-investigate", { criterion: this.criterion })}>${searchIcon}Investigate</button>
      <button type="button" class="ui-qdr__btn ui-qdr__btn--ghost ui-qdr__dismiss" @click=${() => this.setStatus("dismissed", ".ui-qdr__undo")}>Dismiss as expected</button>
    </div>`;
  }

  protected override render() {
    const titleId = `${this.uid}-title`;
    const fmt = this.dateFmt;
    const fell = this.to < this.from;
    const headline = html`${this.criterion} ${fell ? "fell" : "moved"} from <span class="ui-qdr__num">${this.score(this.from)}</span> to <span class="ui-qdr__num">${this.score(this.to)}</span>`;
    const when = [this.at ? `since ${fmt.format(this.at)}` : "", this.chats ? `${this.chats.toLocaleString(this.locale)} ${this.chats === 1 ? "chat" : "chats"} scored` : ""].filter(Boolean).join(" · ");
    const done = this.status !== "open";
    return html`
      ${cardHead({
        icon: mark,
        title: this.heading,
        id: titleId,
        aside: done
          ? html`<span class="ui-qdr__state" data-status=${this.status}>${this.status === "rolled-back" ? checkIcon : nothing}${this.status === "rolled-back" ? `Rolled back to ${this.rollbackTo}` : "Dismissed as expected"}</span>`
          : nothing,
      })}
      <div class="ui-qdr__card" ?data-done=${done}>
        <div class="ui-qdr__top">
          <p class="ui-qdr__headline">${headline}</p>
          ${when ? html`<p class="ui-qdr__when">${when}</p>` : nothing}
        </div>
        ${done
          ? html`<div class="ui-qdr__folded">
              <p class="ui-qdr__muted">${this.status === "rolled-back" ? `Live chats are back on ${this.rollbackTo}. Scores from here show whether it recovers.` : "Marked as an expected change – it won't alert again."}</p>
              <button type="button" class="ui-qdr__btn ui-qdr__btn--quiet ui-qdr__undo" @click=${() => this.setStatus("open", this.rollbackTo ? ".ui-qdr__rollback" : ".ui-qdr__dismiss")}>${undoIcon}Undo</button>
            </div>`
          : html`${this.chart()}
              <div class="ui-qdr__body">${this.causeBlock()}${this.segmentsBlock()}</div>
              ${this.actions()}`}
      </div>
      <span class="ui-qdr__sr" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="qdr"] {
  --tc-quality-drop-chart-h: 72px;
  --tc-quality-drop-line: var(--tc-status-danger-solid);
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: ui-qdr / inline-size;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="qdr"] {
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="qdr"] *, [data-ui="qdr"] *::before, [data-ui="qdr"] *::after { box-sizing: border-box; }
[data-ui="qdr"] :is(p, h4, ul, figure, q) { margin: 0; }
[data-ui="qdr"] ul { padding: 0; list-style: none; }
:where([data-ui="qdr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="qdr"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-qdr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-qdr__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-qdr__muted { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-qdr__card { display: grid; gap: var(--tc-space-3-5); padding: var(--tc-space-4); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-qdr__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
.ui-qdr__state { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
.ui-qdr__state[data-status="rolled-back"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-qdr__state[data-status="dismissed"] { background: var(--tc-fill-subtle); color: var(--tc-text-secondary); }
.ui-qdr__state .ui-qdr__glyph { width: 12px; height: 12px; }
/* ----- What fell ----- */
.ui-qdr__top { display: grid; gap: var(--tc-space-0-5); }
.ui-qdr__headline { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *) .ui-qdr__headline { font-weight: var(--tc-font-weight-medium); }
.ui-qdr__num { font-variant-numeric: tabular-nums; }
.ui-qdr__card:not([data-done]) .ui-qdr__num:last-child { color: var(--tc-status-danger-fg); }
.ui-qdr__when { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- The small chart ----- */
.ui-qdr__chart { display: grid; gap: var(--tc-space-1); }
.ui-qdr__plot { position: relative; height: var(--tc-quality-drop-chart-h); }
.ui-qdr__svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.ui-qdr__base { stroke: var(--tc-border-strong); stroke-width: 1; stroke-dasharray: 2 3; }
.ui-qdr__rule { stroke-width: 1; }
.ui-qdr__rule[data-kind="drop"] { stroke: var(--tc-border-strong); }
.ui-qdr__rule[data-kind="cause"] { stroke: var(--tc-text-secondary); stroke-dasharray: 4 3; }
.ui-qdr__line { fill: none; stroke: var(--tc-quality-drop-line); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.ui-qdr__end { position: absolute; width: 8px; height: 8px; border-radius: 50%; translate: -50% -50%; background: var(--tc-quality-drop-line); box-shadow: 0 0 0 2px var(--tc-surface-on-tray); }
.ui-qdr__chart-key { display: flex; justify-content: space-between; gap: var(--tc-space-2); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-qdr__key[data-kind="cause"] { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-secondary); }
.ui-qdr__key[data-kind="cause"]::before { content: ""; width: 12px; border-top: 1px dashed currentColor; }
/* ----- Cause and segments ----- */
.ui-qdr__body { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-3-5); }
.ui-qdr__label { margin-bottom: var(--tc-space-1); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-qdr__cause { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-qdr__change { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-qdr__change-label { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-qdr__pill { height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); white-space: nowrap; }
.ui-qdr__pill[data-confidence="high"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-qdr__pill[data-confidence="medium"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-qdr__pill[data-confidence="low"] { background: var(--tc-fill-subtle); color: var(--tc-text-secondary); }
.ui-qdr__reason { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-qdr__evidence { display: grid; gap: var(--tc-space-1-5); margin-top: var(--tc-space-0-5); }
.ui-qdr__quote-btn { display: grid; gap: var(--tc-space-0-5); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-surface-well); box-shadow: inset 2px 0 0 var(--tc-status-danger-solid); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="qdr"] .ui-qdr__quote-btn:hover { background: var(--tc-fill-hover); }
.ui-qdr__quote-text { font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-qdr__quote-note { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-qdr__segments { min-width: 0; }
.ui-qdr__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-qdr__chip { display: grid; grid-template-columns: auto auto; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-2); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); }
.ui-qdr__chip-label { color: var(--tc-text-primary); }
.ui-qdr__chip-share { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-qdr__chip-bar { grid-column: 1 / -1; height: 3px; overflow: hidden; border-radius: var(--tc-radius-xs); background: var(--tc-fill-subtle); }
.ui-qdr__chip-bar span { display: block; height: 100%; background: var(--tc-quality-drop-line); }
/* ----- Actions and the confirmation ----- */
.ui-qdr__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-qdr__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); line-height: var(--tc-line-height-none); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-qdr__btn--primary { background: var(--tc-action-primary-bg); color: var(--tc-action-primary-fg); box-shadow: var(--tc-action-primary-shadow); }
[data-ui="qdr"] .ui-qdr__btn--primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-qdr__btn--danger { background: var(--tc-action-danger-bg); color: var(--tc-action-danger-fg); }
[data-ui="qdr"] .ui-qdr__btn--danger:hover { background: var(--tc-action-danger-bg-hover); }
.ui-qdr__btn--quiet { background: var(--tc-action-secondary-bg); color: var(--tc-action-secondary-fg); box-shadow: var(--tc-action-secondary-shadow); }
[data-ui="qdr"] .ui-qdr__btn--quiet:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-qdr__btn--ghost { color: var(--tc-action-ghost-fg); }
[data-ui="qdr"] .ui-qdr__btn--ghost:hover { background: var(--tc-action-ghost-bg-hover); }
.ui-qdr__confirm { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-danger-bg); }
.ui-qdr__confirm-title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
.ui-qdr__confirm .ui-qdr__muted { color: var(--tc-text-secondary); }
.ui-qdr__reverts { display: grid; gap: var(--tc-space-0-5); padding-left: var(--tc-space-4); list-style: disc; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-qdr__folded { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-qdr__folded .ui-qdr__muted { flex: 1 1 220px; }
@container ui-qdr (min-width: 640px) {
  .ui-qdr__body { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: var(--tc-space-5); }
}
@media (forced-colors: active) {
  .ui-qdr__line { stroke: CanvasText; }
  .ui-qdr__end, .ui-qdr__chip-bar span { background: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="qdr"] *, [data-ui="qdr"] *::before, [data-ui="qdr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-quality-drop")) customElements.define("tc-quality-drop", TcQualityDrop);

declare global {
  interface HTMLElementTagNameMap {
    "tc-quality-drop": TcQualityDrop;
  }
}

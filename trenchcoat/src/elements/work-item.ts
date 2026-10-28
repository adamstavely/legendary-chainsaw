import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { initials } from "./internal/util";

/*
 * <tc-work-item> – one piece of work as a card: its title and a status in words and a mark (Active, Blocked, In review,
 * Done, Paused – renamable), a one-line note (the blocker, the next step), progress with its %, the due date (marked
 * when it's passed), the people on it, what it delivers ("fills 1 gap"), spent against budget with a slim bar, the
 * effort ("1.5 FTE") and, for work mirrored from another system, a source badge ("Synced · read-only").
 *   · the title is the card's one control – a link when `href` is set, else a button – and the whole card is its
 *     target; opening fires tc-open, which a listener can cancel (a link then doesn't follow)
 *   · overdue compares `due` with `now`, else with today, read once when the card connects
 *   · the card fills its column; under 280 px wide the money and effort line wraps under the progress
 * Standard: a white card with a lift. Clean: a quieter card with a hairline. The content is the same in both.
 *
 *   <tc-work-item heading="NeuroBench-E harness" status="active" .progress=${0.6} .due=${Date.parse("2026-08-15")}></tc-work-item>
 */

export type WorkStatus = "active" | "blocked" | "review" | "done" | "paused";
export type WorkPerson = { name: string; picture?: string };

/** Details of the events */
export type WorkOpen = { href?: string };

const DAY = 86_400_000;
/** The statuses' names used when the page gives none */
export const defaultWorkStatusLabels: Record<WorkStatus, string> = { active: "Active", blocked: "Blocked", review: "In review", done: "Done", paused: "Paused" };

/* Active, blocked, in review, done, paused – circle-play, octagon-x, eye, circle-check, circle-pause: Lucide (ISC, lucide.dev) */
const mark = (body: ReturnType<typeof svg>) =>
  html`<svg class="ui-wki__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const MARK: Record<WorkStatus, () => ReturnType<typeof mark>> = {
  active: () => mark(svg`<circle cx="12" cy="12" r="9"></circle><path d="m10 8.5 5 3.5-5 3.5z" fill="currentColor"></path>`),
  blocked: () => mark(svg`<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"></path><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`),
  review: () => mark(svg`<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"></path><circle cx="12" cy="12" r="3"></circle>`),
  done: () => mark(svg`<circle cx="12" cy="12" r="9"></circle><path d="m8.5 12 2.5 2.5 4.5-5"></path>`),
  paused: () => mark(svg`<circle cx="12" cy="12" r="9"></circle><path d="M10 9v6"></path><path d="M14 9v6"></path>`),
};
/* A calendar and a sync arrow: Lucide (ISC, lucide.dev) */
const calendarIcon = html`<svg class="ui-wki__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>`;
const syncIcon = html`<svg class="ui-wki__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>`;

/**
 * A work item card – title, status, a note, progress, due date, people, what it delivers, spent against budget and
 * effort – that opens as a link or a button.
 * @tag tc-work-item
 * @fires tc-open - The card was opened ({ href }: WorkOpen); cancelable – prevented, a link doesn't follow
 */
export class TcWorkItem extends TcElement {
  static override ui = "wki";

  /** The work's title, and the card's control */
  @property() accessor heading = "";
  /** Where the work stands: active, blocked, review, done or paused – shown in words with a mark */
  @property({ reflect: true }) accessor status: WorkStatus = "active";
  /** The statuses' names, merged over the defaults (Active, Blocked, In review, Done, Paused) */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<WorkStatus, string>> = {};
  /** One line under the title: the blocker, the next step */
  @property() accessor note: string | undefined = undefined;
  /** How far along, from 0 to 1; no bar when unset */
  @property({ type: Number }) accessor progress: number | undefined = undefined;
  /** When it's due, as epoch ms */
  @property({ type: Number }) accessor due: number | undefined = undefined;
  /** The time to compare `due` with, as epoch ms; today when unset */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Who's on it */
  @property({ attribute: false }) accessor people: WorkPerson[] = [];
  /** What it delivers, as a tag, e.g. "fills 1 gap" */
  @property() accessor outcome: string | undefined = undefined;
  /** Money spent so far */
  @property({ type: Number }) accessor spent: number | undefined = undefined;
  /** The money it has; spent is shown against it */
  @property({ type: Number }) accessor budget: number | undefined = undefined;
  /** The currency of `spent` and `budget`, as an ISO 4217 code */
  @property() accessor currency = "USD";
  /** The effort, written as shown, e.g. "1.5 FTE" */
  @property() accessor effort: string | undefined = undefined;
  /** Where the item comes from when it's mirrored, e.g. "Synced · read-only" */
  @property() accessor source: string | undefined = undefined;
  /** Makes the title a link */
  @property() accessor href: string | undefined = undefined;
  /** The language for dates and money, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** Today, read once on connect when `now` isn't given */
  @state() private accessor today: number | undefined = undefined;

  override connectedCallback() {
    super.connectedCallback();
    // The one clock read: overdue is a day-level judgement, so it needn't tick
    if (this.today === undefined) this.today = Date.now();
  }

  /* ---------- The model ---------- */

  private get statusLabel() {
    return this.statusLabels[this.status] ?? defaultWorkStatusLabels[this.status] ?? this.status;
  }
  private get overdue() {
    const now = this.now ?? this.today;
    if (this.due === undefined || now === undefined || this.status === "done") return false;
    // Due on a day means by its end
    const end = new Date(this.due);
    return now > new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() + DAY - 1;
  }
  private money(n: number) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, notation: "compact", maximumFractionDigits: 1 }).format(n);
    } catch {
      return new Intl.NumberFormat(this.locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
    }
  }

  private open(e: Event) {
    if (!this.emit<WorkOpen>("tc-open", { href: this.href }, { cancelable: true })) e.preventDefault();
  }

  /* ---------- Rendering ---------- */

  private renderTitle() {
    return this.href
      ? html`<a class="ui-wki__title" href=${this.href} @click=${(e: MouseEvent) => this.open(e)}>${this.heading}</a>`
      : html`<button type="button" class="ui-wki__title" @click=${(e: MouseEvent) => this.open(e)}>${this.heading}</button>`;
  }

  protected override render() {
    const progress = this.progress === undefined ? undefined : Math.max(0, Math.min(1, this.progress));
    const hasMoney = this.spent !== undefined && this.budget !== undefined && this.budget > 0;
    const share = hasMoney ? this.spent! / this.budget! : 0;
    const over = hasMoney && share > 1;
    const overdue = this.overdue;
    return html`
      <div class="ui-wki__top">
        <h4 class="ui-wki__heading">${this.renderTitle()}</h4>
        <span class="ui-wki__status" data-status=${this.status}>${MARK[this.status]?.() ?? nothing}<span class="ui-wki__sr">Status: </span>${this.statusLabel}</span>
      </div>
      ${this.note ? html`<p class="ui-wki__note">${this.note}</p>` : nothing}
      ${progress !== undefined
        ? html`<div class="ui-wki__progress">
            <span class="ui-wki__progress-label">Progress</span>
            <span class="ui-wki__progress-n">${Math.round(progress * 100)}%</span>
            <span class="ui-wki__bar" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(progress * 100)}
              ><span style=${`inline-size: ${progress * 100}%`}></span
            ></span>
          </div>`
        : nothing}
      <div class="ui-wki__meta">
        ${this.due !== undefined
          ? html`<span class="ui-wki__due" ?data-overdue=${overdue}>${calendarIcon}${overdue ? html`<span class="ui-wki__overdue">Overdue</span>` : html`<span class="ui-wki__sr">Due </span>`}${new Intl.DateTimeFormat(this.locale, { month: "short", day: "numeric" }).format(this.due)}</span>`
          : nothing}
        ${this.people.length
          ? html`<span class="ui-wki__people" aria-label=${`People: ${this.people.map((p) => p.name).join(", ")}`} role="img">
              ${this.people.slice(0, 4).map((p) => html`<span class="ui-wki__avatar" title=${p.name}>${p.picture ? html`<img src=${p.picture} alt="" />` : initials(p.name)}</span>`)}
              ${this.people.length > 4 ? html`<span class="ui-wki__avatar ui-wki__more">+${this.people.length - 4}</span>` : nothing}
            </span>`
          : nothing}
        ${this.outcome ? html`<span class="ui-wki__outcome">${this.outcome}</span>` : nothing}
      </div>
      ${hasMoney || this.effort || this.source
        ? html`<div class="ui-wki__foot">
            ${hasMoney
              ? html`<span class="ui-wki__money" ?data-over=${over}>
                  <span class="ui-wki__money-n"><span class="ui-wki__spent">${this.money(this.spent!)}</span> / ${this.money(this.budget!)}${over ? html`<span class="ui-wki__over"> · over budget</span>` : html`<span class="ui-wki__sr"> spent</span>`}</span>
                  <span class="ui-wki__money-bar" aria-hidden="true"><span style=${`inline-size: ${Math.min(1, share) * 100}%`}></span></span>
                </span>`
              : nothing}
            ${this.effort ? html`<span class="ui-wki__effort">${this.effort}</span>` : nothing}
            ${this.source ? html`<span class="ui-wki__source" title=${ifDefined(this.source)}>${syncIcon}${this.source}</span>` : nothing}
          </div>`
        : nothing}
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="wki"], :where([data-look="clean"], [data-look="clean"] *)[data-ui="wki"] {
  position: relative;
  box-sizing: border-box;
  display: grid;
  gap: var(--tc-space-2-5);
  width: 100%;
  padding: var(--tc-space-3-5) var(--tc-space-4);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="wki"] { font-weight: var(--tc-font-weight-regular); }
[data-ui="wki"]:hover { box-shadow: var(--tc-card-shadow-hover); }
/* A focused title rings the whole card, which is its target */
[data-ui="wki"]:has(.ui-wki__title:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="wki"] *, [data-ui="wki"] *::before, [data-ui="wki"] *::after { box-sizing: border-box; }
[data-ui="wki"] p, [data-ui="wki"] h4 { margin: 0; }
[data-ui="wki"] svg { display: block; flex: none; }
.ui-wki__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
/* ----- The title (the card's control, stretched over it) and the status ----- */
.ui-wki__top { display: flex; align-items: flex-start; gap: var(--tc-space-2); min-width: 0; }
.ui-wki__heading { flex: 1; min-width: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-wki__title { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: left; text-decoration: none; cursor: pointer; outline: none; -webkit-tap-highlight-color: transparent; }
.ui-wki__title::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
.ui-wki__status { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-wki__status[data-status="active"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-wki__status[data-status="blocked"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-wki__status[data-status="review"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-wki__status[data-status="done"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-wki__status[data-status="paused"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-wki__mark { width: 12px; height: 12px; }
.ui-wki__note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
/* ----- Progress ----- */
.ui-wki__progress { display: grid; grid-template-columns: 1fr auto; row-gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-wki__progress-n { color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-wki__bar { grid-column: 1 / -1; display: block; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-wki__bar > span { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); transition: inline-size var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-status="blocked"]) .ui-wki__bar > span { background: var(--tc-status-danger-solid); }
:where([data-status="done"]) .ui-wki__bar > span { background: var(--tc-status-success-solid); }
/* ----- Due, people and what it delivers ----- */
.ui-wki__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-3); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-wki__icon { width: 13px; height: 13px; }
.ui-wki__due { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-variant-numeric: tabular-nums; }
.ui-wki__due[data-overdue] { color: var(--tc-status-danger-fg); }
.ui-wki__overdue { font-weight: var(--tc-font-weight-medium); }
.ui-wki__overdue::after { content: " ·"; }
.ui-wki__people { display: inline-flex; }
.ui-wki__avatar { display: grid; place-items: center; width: var(--tc-avatar-sm); height: var(--tc-avatar-sm); overflow: hidden; border-radius: 50%; background: var(--tc-fill-default); box-shadow: 0 0 0 1.5px var(--tc-surface-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-avatar-font-weight); color: var(--tc-text-secondary); }
.ui-wki__avatar + .ui-wki__avatar { margin-left: calc(-1 * var(--tc-space-1-5)); }
.ui-wki__avatar > img { width: 100%; height: 100%; object-fit: cover; }
.ui-wki__outcome { display: inline-flex; align-items: center; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-family: var(--tc-font-mono); color: var(--tc-accent-text); }
/* ----- Money, effort and the source ----- */
.ui-wki__foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-3); padding-top: var(--tc-space-2-5); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-wki__money { display: inline-flex; flex: 1 1 auto; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-wki__money-n { white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-wki__spent { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-wki__money-bar { display: block; flex: 1 1 40px; max-width: 80px; height: 3px; overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-wki__money-bar > span { display: block; height: 100%; border-radius: inherit; background: var(--tc-text-muted); }
.ui-wki__money[data-over] .ui-wki__money-bar > span { background: var(--tc-status-danger-solid); }
.ui-wki__over { color: var(--tc-status-danger-fg); }
.ui-wki__effort { font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-wki__source { display: inline-flex; align-items: center; gap: var(--tc-space-1); white-space: nowrap; }
@container (max-width: 280px) {
  .ui-wki__money { flex-basis: 100%; }
  .ui-wki__money-bar { max-width: none; }
}
@media (forced-colors: active) {
  [data-ui="wki"] { border: 1px solid CanvasText; }
  .ui-wki__bar, .ui-wki__money-bar { border: 1px solid CanvasText; }
  .ui-wki__bar > span, .ui-wki__money-bar > span { background: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="wki"], [data-ui="wki"] *, [data-ui="wki"] *::before, [data-ui="wki"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-work-item")) customElements.define("tc-work-item", TcWorkItem);

declare global {
  interface HTMLElementTagNameMap {
    "tc-work-item": TcWorkItem;
  }
}

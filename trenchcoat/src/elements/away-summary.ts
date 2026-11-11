import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-away-summary> – the "while you were away" card at the top of a chat thread, right where the person left off.
 * One line says how long they were gone; then three short groups: Needs you, each with its action; Failed, each with
 * Retry; and Done, folded to a count that opens. Nothing new is one quiet line, and Mark all seen folds the card to
 * "You're all caught up". It stays compact – a few rows – so the thread isn't pushed far down.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-away-summary .since=${leftAt} .items=${items} @tc-item-action=${(e) => act(e.detail)}></tc-away-summary>
 *
 * The page owns the items. Their buttons fire a cancelable tc-item-action ({ id, action, item }) – "review" (or the
 * item's own `action`), "retry" or "open"; preventing it on an item with `href` keeps the link from being followed.
 * The Done group is a disclosure (`expanded`, tc-expanded-change). Times are epoch ms; unset `now` reads the clock
 * once, when `since` is set.
 */

export type AwayItemStatus = "needs-you" | "failed" | "done";

export type AwayItem = {
  id: string;
  /** What happened, in a few words: "Vendor check needs a tax ID" */
  title: string;
  status: AwayItemStatus;
  /** A quiet line: why, or what came of it */
  detail?: string;
  /** Which agent did it */
  agent?: string;
  /** When it happened, in epoch ms */
  at?: number;
  /** Where Open goes (done) – also the action link of a needs-you item */
  href?: string;
  /** The needs-you button's label – "Review" by default */
  action?: string;
};

/** Detail of tc-item-action */
export type AwayItemAction = { id: string; action: string; item: AwayItem };
/** Detail of tc-expanded-change */
export type AwayExpandedChange = { expanded: boolean };
/** Detail of tc-seen: the ids the card showed */
export type AwaySeen = { ids: string[] };

export type AwaySummaryLabels = {
  away: string;
  since: string;
  needsYou: string;
  failed: string;
  done: string;
  review: string;
  retry: string;
  open: string;
  markSeen: string;
  nothing: string;
  caughtUp: string;
};

export const defaultAwaySummaryLabels: AwaySummaryLabels = {
  away: "You were away",
  since: "since",
  needsYou: "Needs you",
  failed: "Failed",
  done: "Done",
  review: "Review",
  retry: "Retry",
  open: "Open",
  markSeen: "Mark all seen",
  nothing: "Nothing new while you were away",
  caughtUp: "You're all caught up",
};

/** How long someone was gone: 45 min · 3 h 12 min · 2 d 4 h */
export function awayFor(ms: number): string {
  const m = Math.max(1, Math.round(Math.max(0, ms) / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d} d ${h % 24} h` : `${d} d`;
}

/** Wall time – read in updates only, never during render */
const wall = () => Date.now();
const timeFormats = new Map<string, Intl.DateTimeFormat>();
const timeOfDay = (at: number, locale: string | undefined) => {
  const key = locale ?? "";
  let f = timeFormats.get(key);
  if (!f) timeFormats.set(key, (f = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" })));
  return f.format(at);
};

/* Icons: Lucide (ISC, lucide.dev), 24×24 strokes */
const ICON_AWAY = svg`<path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle>`;
const MARK: Record<AwayItemStatus, string> = {
  "needs-you": "M12 8v4M12 16h.01",
  failed: "M18 6 6 18M6 6l12 12",
  done: "M20 6 9 17l-5-5",
};
const CHEVRON = "m6 9 6 6 6-6";
const glyph = (d: string, cls = "") => html`<svg class=${`ui-aws__glyph ${cls}`} viewBox="0 0 24 24" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

let instances = 0;

/**
 * The "while you were away" card for a chat thread: how long you were gone, then what needs you, what failed and
 * what's done – acted on in place.
 * @tag tc-away-summary
 * @fires tc-item-action - An item's button ({ id, action, item }: AwayItemAction); cancelable – on an item with `href`, prevented keeps the link from being followed
 * @fires tc-expanded-change - The Done group opens or closes ({ expanded }: AwayExpandedChange); cancelable – prevented, it stays
 * @fires tc-seen - Mark all seen ({ ids }: AwaySeen); cancelable – unless prevented the card folds to "You're all caught up"
 */
export class TcAwaySummary extends TcElement {
  static override ui = "aws";

  /** The heading */
  @property() accessor heading = "While you were away";
  /** When the person left, in epoch ms */
  @property({ type: Number }) accessor since: number | undefined = undefined;
  /** When they came back, in epoch ms; unset reads the clock once */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** What happened, in any order – grouped by status, newest first within a group */
  @property({ attribute: false }) accessor items: AwayItem[] = [];
  /** The Done group is open */
  @property({ type: Boolean, reflect: true }) accessor expanded = false;
  /** Mark all seen was pressed: the card folds to one line */
  @property({ type: Boolean, reflect: true }) accessor seen = false;
  /** Locale for times of day */
  @property() accessor locale: string | undefined = undefined;
  /** Words the page can change, merged over defaultAwaySummaryLabels */
  @property({ attribute: false }) accessor labels: Partial<AwaySummaryLabels> = {};

  /** @internal When they came back, read once */
  @state() accessor back = 0;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-aws${++instances}`;

  constructor() {
    super();
    // Mark all seen removes the button that had focus: it goes to the folded line
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-aws__line, .ui-aws__card"));
  }

  private get l(): AwaySummaryLabels {
    return { ...defaultAwaySummaryLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (this.now !== undefined) this.back = this.now;
    else if (!this.back || changed.has("since")) this.back = wall();
  }

  private group(status: AwayItemStatus) {
    return this.items.filter((i) => i.status === status).sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  }

  private act(e: Event, item: AwayItem, action: string) {
    const go = this.emit<AwayItemAction>("tc-item-action", { id: item.id, action, item }, { cancelable: true });
    if (!go && e.currentTarget instanceof HTMLAnchorElement) e.preventDefault();
  }

  private toggle() {
    const expanded = !this.expanded;
    if (this.emit<AwayExpandedChange>("tc-expanded-change", { expanded }, { cancelable: true })) this.expanded = expanded;
  }

  private markSeen() {
    if (!this.emit<AwaySeen>("tc-seen", { ids: this.items.map((i) => i.id) }, { cancelable: true })) return;
    this.seen = true;
    this.said = this.l.caughtUp;
  }

  /* ---------- Rendering ---------- */

  private awayText() {
    const l = this.l;
    if (this.since === undefined) return "";
    return `${l.away} ${awayFor(this.back - this.since)}`;
  }

  private button(item: AwayItem, action: string, label: string, primary = false): TemplateResult {
    const href = safeUrl(item.href);
    const cls = `ui-aws__btn${primary ? " ui-aws__btn--primary" : ""}`;
    return href
      ? html`<a class=${cls} href=${href} @click=${(e: Event) => this.act(e, item, action)}>${label}<span class="ui-aws__sr">: ${item.title}</span></a>`
      : html`<button type="button" class=${cls} @click=${(e: Event) => this.act(e, item, action)}>${label}<span class="ui-aws__sr">: ${item.title}</span></button>`;
  }

  private row(item: AwayItem) {
    const l = this.l;
    const meta = [item.agent, item.at !== undefined ? timeOfDay(item.at, this.locale) : undefined].filter(Boolean).join(" · ");
    const action =
      item.status === "needs-you" ? this.button(item, item.action ? item.action.toLowerCase() : "review", item.action ?? l.review, true)
      : item.status === "failed" ? this.button(item, "retry", l.retry)
      : item.href ? this.button(item, "open", l.open)
      : nothing;
    return html`<li class="ui-aws__item" data-status=${item.status}>
      <span class="ui-aws__mark" aria-hidden="true">${glyph(MARK[item.status])}</span>
      <span class="ui-aws__text">
        <span class="ui-aws__title">${item.title}</span>
        ${item.detail || meta
          ? html`<span class="ui-aws__detail">${item.detail ?? ""}${item.detail && meta ? html`<span aria-hidden="true"> · </span><span class="ui-aws__sr">, </span>` : nothing}${meta}</span>`
          : nothing}
      </span>
      ${action}
    </li>`;
  }

  private section(status: AwayItemStatus, label: string, list: AwayItem[]) {
    if (!list.length) return nothing;
    const id = `${this.uid}-${status}`;
    return html`<section class="ui-aws__group" data-status=${status} aria-labelledby=${id}>
      <h4 class="ui-aws__label" id=${id}>${label} <span class="ui-aws__count">${list.length}</span></h4>
      <ul class="ui-aws__list" role="list">${repeat(list, (i) => i.id, (i) => this.row(i))}</ul>
    </section>`;
  }

  private renderDone(list: AwayItem[]) {
    if (!list.length) return nothing;
    const l = this.l;
    const id = `${this.uid}-done`;
    return html`<section class="ui-aws__group ui-aws__group--done" data-status="done">
      <button type="button" class="ui-aws__toggle" aria-expanded=${this.expanded ? "true" : "false"} aria-controls=${id} @click=${() => this.toggle()}>
        <span class="ui-aws__mark" aria-hidden="true">${glyph(MARK.done)}</span>
        <span class="ui-aws__toggle-text">${list.length} ${l.done.toLowerCase()}</span>
        ${glyph(CHEVRON, "ui-aws__chevron")}
      </button>
      <ul class="ui-aws__list" role="list" id=${id} ?hidden=${!this.expanded}>${repeat(list, (i) => i.id, (i) => this.row(i))}</ul>
    </section>`;
  }

  /** One quiet line: nothing new, or caught up */
  private renderLine(text: string) {
    const away = this.awayText();
    return html`<p class="ui-aws__line" tabindex="-1">
      <span class="ui-aws__line-icon" aria-hidden="true"><svg class="ui-aws__glyph" viewBox="0 0 24 24">${ICON_AWAY}</svg></span>
      <span class="ui-aws__line-text">${text}</span>
      ${away ? html`<span class="ui-aws__line-away"><span class="ui-aws__sr">. </span>${away}</span>` : nothing}
    </p>`;
  }

  protected override render() {
    const l = this.l;
    const status = html`<span class="ui-aws__sr" role="status">${this.said}</span>`;
    if (this.seen) return html`${this.renderLine(l.caughtUp)}${status}`;
    if (!this.items.length) return html`${this.renderLine(l.nothing)}${status}`;
    const needs = this.group("needs-you");
    const failed = this.group("failed");
    const done = this.group("done");
    const away = this.awayText();
    const sub = away ? html`${away}${this.since !== undefined ? html`<span aria-hidden="true"> · </span><span class="ui-aws__sr">, </span>${l.since} ${timeOfDay(this.since, this.locale)}` : nothing}` : undefined;
    const clean = this.resolvedLook === "clean";
    const head = cardHead({
      icon: ICON_AWAY,
      title: this.heading,
      subtitle: sub,
      id: `${this.uid}-title`,
      aside: html`<button type="button" class="ui-aws__btn ui-aws__btn--ghost" @click=${() => this.markSeen()}>${l.markSeen}</button>`,
    });
    const body = html`<div class="ui-aws__body">${this.section("needs-you", l.needsYou, needs)}${this.section("failed", l.failed, failed)}${this.renderDone(done)}</div>`;
    return html`<section class="ui-aws__root" aria-labelledby=${`${this.uid}-title`}>
        ${clean ? html`<div class="ui-aws__card">${head}${body}</div>` : html`${head}<div class="ui-aws__card">${body}</div>`}
      </section>
      ${status}`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="aws"] {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="aws"] {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="aws"] *, [data-ui="aws"] *::before, [data-ui="aws"] *::after { box-sizing: border-box; }
:where([data-ui="aws"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="aws"] :is(button, a):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="aws"] :is(p, h4, ul) { margin: 0; padding: 0; }
[data-ui="aws"] ul { list-style: none; }
[data-ui="aws"] [hidden] { display: none !important; }
.ui-aws__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-aws__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-aws__glyph { stroke-width: 1.6; }
/* ----- The card ----- */
.ui-aws__card { min-width: 0; animation: ui-aws-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-aws__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-aws__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-aws__body { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *) .ui-aws__body { padding-top: 0; }
/* ----- Groups ----- */
.ui-aws__group { display: grid; gap: var(--tc-space-0-5); }
.ui-aws__group + .ui-aws__group { padding-top: var(--tc-space-1); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-aws__label { display: flex; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-0-5); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-aws__count { font-variant-numeric: tabular-nums; color: var(--tc-text-secondary); }
.ui-aws__item { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: var(--tc-control-h-md); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-md); }
.ui-aws__item:hover { background: var(--tc-fill-subtle); }
.ui-aws__mark { display: grid; flex: none; place-items: center; width: 20px; height: 20px; border-radius: 50%; }
[data-status="needs-you"] > .ui-aws__mark { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
[data-status="failed"] > .ui-aws__mark { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
[data-status="done"] > .ui-aws__mark, .ui-aws__toggle > .ui-aws__mark { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-aws__mark .ui-aws__glyph { width: 12px; height: 12px; stroke-width: 2.4; }
.ui-aws__text { display: grid; flex: 1; min-width: 0; }
.ui-aws__title { overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-aws__detail { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* Done, folded to a count */
.ui-aws__toggle { display: flex; align-items: center; gap: var(--tc-space-2-5); width: 100%; min-height: var(--tc-control-h-md); padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-radius-md); color: var(--tc-text-secondary); }
.ui-aws__toggle:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-aws__toggle-text { flex: 1; min-width: 0; font-variant-numeric: tabular-nums; }
.ui-aws__chevron { color: var(--tc-text-muted); transition: transform var(--tc-duration-base) var(--tc-ease-standard); }
[aria-expanded="true"] > .ui-aws__chevron { transform: rotate(180deg); }
/* ----- Buttons ----- */
.ui-aws__btn { display: inline-flex; flex: none; align-items: center; justify-content: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-action-secondary-fg); text-decoration: none; white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aws__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-aws__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-aws__btn--primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-aws__btn--ghost { background: none; box-shadow: none; color: var(--tc-action-ghost-fg); }
.ui-aws__btn--ghost:hover { background: var(--tc-action-ghost-bg-hover); box-shadow: none; color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-aws__btn:not(.ui-aws__btn--primary, .ui-aws__btn--ghost) { background: var(--tc-fill-default); box-shadow: none; }
/* ----- One line: nothing new, or caught up ----- */
.ui-aws__line { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: var(--tc-control-h-md); padding: var(--tc-space-1-5) var(--tc-space-3); border-radius: var(--tc-card-radius); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); outline: none; }
:where([data-look="standard"], [data-look="standard"] *) .ui-aws__line { background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *) .ui-aws__line { background: var(--tc-fill-subtle); }
.ui-aws__line:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-aws__line-icon { color: var(--tc-text-muted); }
.ui-aws__line-text { flex: 1; min-width: 0; }
.ui-aws__line-away { flex: none; font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
@keyframes ui-aws-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
/* Narrow: details drop; the line's time goes under */
@container (max-width: 360px) {
  .ui-aws__detail { display: none; }
  .ui-aws__line { flex-wrap: wrap; }
}
@media (pointer: coarse) {
  .ui-aws__btn { height: 36px; }
  .ui-aws__item, .ui-aws__toggle { min-height: 44px; }
}
@media (forced-colors: active) {
  .ui-aws__mark { outline: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="aws"] *, [data-ui="aws"] *::before, [data-ui="aws"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-away-summary")) customElements.define("tc-away-summary", TcAwaySummary);

declare global {
  interface HTMLElementTagNameMap {
    "tc-away-summary": TcAwaySummary;
  }
}

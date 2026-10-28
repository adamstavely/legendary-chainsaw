import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-alert-feed> – a live feed of alerts, newest first. Each alert has a category tag (Sign-in, Payment, Location …
 * – the page names them), a severity shown as an edge, a mark and a word (critical, high, medium, info – never colour
 * alone), a title, a subject line (who or what · an id · where), a source tag, a relative time that stays fresh, and
 * its actions – Escalate and Acknowledge by default, or the page's own. Acting fires a cancelable tc-action;
 * acknowledging, unless prevented, quiets the alert. The header has a live dot with the count of events today, the
 * number of critical alerts open, and Pause feed: while paused, alerts that arrive wait behind a "Show N new" button.
 * New alerts slide in (not with reduced motion) and are announced politely, several at once as a count.
 *   · the alerts are one tab stop: ↑ / ↓ move between them, Home / End to the ends; Tab goes on to the focused
 *     alert's actions, then leaves the feed
 *   · times are epoch ms; the element reads the clock when it connects and every 30 s unless `now` is given
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-alert-feed .items=${[{ id: "a1", category: "Payment", severity: "critical", title: "Card used in two countries", time: at }]}></tc-alert-feed>
 */

/** A siren: Lucide (ISC, lucide.dev) */
const sirenIcon = svg`<path d="M7 18v-6a5 5 0 1 1 10 0v6"></path><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"></path><path d="M21 12h1"></path><path d="M18.5 4.5 18 5"></path><path d="M2 12h1"></path><path d="M12 2v1"></path><path d="m4.929 4.929.707.707"></path><path d="M12 12v6"></path>`;

export type AlertSeverity = "critical" | "high" | "medium" | "info";
export type AlertAction = {
  id: string;
  label: string;
  /** "danger" for an action that escalates, "primary" for the main one; plain otherwise */
  tone?: "danger" | "primary";
};
export type AlertItem = {
  id: string;
  /** The kind of alert, shown as a small caps tag: "Payment" */
  category: string;
  severity: AlertSeverity;
  title: string;
  /** Who or what it's about, an id and where, e.g. "Northwind Traders · ACC-4471 · Rotterdam" */
  subject?: string;
  /** Where it came from – a team, a rule, a case – as a quiet tag */
  source?: string;
  /** When it happened, epoch ms */
  time: number;
  /** Already dealt with: shown quietly, without Acknowledge */
  acknowledged?: boolean;
  /** This alert's actions, in place of `actions` */
  actions?: AlertAction[];
};

/** Details of the events */
export type AlertActionEvent = { id: string; action: string; item: AlertItem };
export type AlertPausedChange = { paused: boolean };

/** The severities' names used when the page gives none */
export const defaultAlertSeverityLabels: Record<AlertSeverity, string> = { critical: "Critical", high: "High", medium: "Medium", info: "Info" };
/** The actions an alert gets when neither it nor the element names any */
export const defaultAlertActions: AlertAction[] = [
  { id: "escalate", label: "Escalate", tone: "danger" },
  { id: "acknowledge", label: "Acknowledge" },
];
const MIN = 60_000;
const HOUR = 60 * MIN;
let uidCount = 0;

/** "just now", "4m ago", "3h ago", then the date and time */
export function alertTime(ms: number, now: number, locale?: string) {
  const diff = Math.max(0, now - ms);
  if (diff < 45_000) return "just now";
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MIN))}m ago`;
  if (diff < 24 * HOUR) return `${Math.floor(diff / HOUR)}h ago`;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(ms);
}

/* A mark per severity, so it never rests on colour: an octagon, a triangle, a circle, an i */
const MARK: Record<AlertSeverity, TemplateResult> = {
  critical: svg`<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z" fill="currentColor" stroke="none"></path><path d="M12 7.5v5.5M12 16.5h.01" stroke="var(--tc-afd-mark-ink)"></path>`,
  high: svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" fill="currentColor" stroke="none"></path><path d="M12 9v4M12 17h.01" stroke="var(--tc-afd-mark-ink)"></path>`,
  medium: svg`<circle cx="12" cy="12" r="8"></circle><path d="M12 8v4.5M12 16h.01"></path>`,
  info: svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 16v-4M12 8h.01"></path>`,
};

/**
 * A live feed of alerts – category, severity, title, subject and a fresh relative time, with actions per alert,
 * counts in the header, Pause feed, and polite announcements of new alerts.
 * @tag tc-alert-feed
 * @fires tc-action - An alert's action was used ({ id, action, item }: AlertActionEvent); cancelable – for "acknowledge", prevented means the alert isn't quieted
 * @fires tc-paused-change - Pause feed or Resume was pressed ({ paused }: AlertPausedChange); cancelable – prevented, `paused` stays as it was
 */
export class TcAlertFeed extends TcElement {
  static override ui = "afd";

  /** The heading, and the feed's name */
  @property() accessor heading = "Live alerts";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The alerts, in any order – shown newest first */
  @property({ attribute: false }) accessor items: AlertItem[] = [];
  /** Every alert's actions, unless it names its own (Escalate and Acknowledge by default) */
  @property({ attribute: false }) accessor actions: AlertAction[] = defaultAlertActions;
  /** Holds new alerts back behind a "Show N new" button. Changed by the user unless a tc-paused-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor paused = false;
  /** "Now" for the relative times and today's count, epoch ms; unset, the element keeps its own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The events counted today, in the header; by default the alerts given since midnight */
  @property({ type: Number, attribute: "today-count" }) accessor todayCount: number | undefined = undefined;
  /** The severities' names, merged over the defaults (Critical, High, Medium, Info) */
  @property({ attribute: false }) accessor severityLabels: Partial<Record<AlertSeverity, string>> = {};
  /** The language for times, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Shown when there are no alerts */
  @property() accessor empty = "No alerts. All quiet.";

  @state() private accessor activeId = "";
  @state() private accessor status = "";
  @state() private accessor clock = 0;
  /** Acknowledged here, for alerts the page doesn't mark itself */
  @state() private accessor acked: ReadonlySet<string> = new Set();
  /** While paused, the alerts that were showing when the feed paused */
  @state() private accessor held: ReadonlySet<string> | null = null;

  private uid = `tc-afd-${++uidCount}`;
  private seen: Set<string> | null = null;
  private fresh = new Set<string>();
  private timer = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.tick();
    this.timer = window.setInterval(this.tick, 30_000);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
  }
  /** The clock read: only when the page doesn't give `now` */
  private tick = () => {
    if (this.now === undefined) this.clock = Date.now();
  };

  /* ---------- The model ---------- */

  private get at() {
    return this.now ?? this.clock;
  }
  private label(s: AlertSeverity) {
    return this.severityLabels[s] ?? defaultAlertSeverityLabels[s];
  }
  private isAcked(item: AlertItem) {
    return !!item.acknowledged || this.acked.has(item.id);
  }
  private get sorted() {
    return [...this.items].sort((a, b) => b.time - a.time);
  }
  /** The alerts shown: all of them, or while paused only those that were showing */
  private get shown() {
    const held = this.held;
    return held ? this.sorted.filter((i) => held.has(i.id)) : this.sorted;
  }
  private actionsOf(item: AlertItem) {
    const list = item.actions ?? this.actions;
    return this.isAcked(item) ? list.filter((a) => a.id !== "acknowledge") : list;
  }

  private act(item: AlertItem, action: AlertAction) {
    if (!this.emit<AlertActionEvent>("tc-action", { id: item.id, action: action.id, item }, { cancelable: true })) return;
    if (action.id === "acknowledge") {
      const next = new Set(this.acked);
      next.add(item.id);
      this.acked = next;
      this.status = `Acknowledged: ${item.title}`;
      // The focus was on Acknowledge, which goes away: it moves to the alert
      void this.updateComplete.then(() => {
        if (!this.contains(document.activeElement) || document.activeElement === document.body)
          this.querySelector<HTMLElement>(`[data-alert="${CSS.escape(item.id)}"]`)?.focus();
      });
    }
  }

  private setPaused(next: boolean) {
    if (next === this.paused) return;
    if (!this.emit<AlertPausedChange>("tc-paused-change", { paused: next }, { cancelable: true })) return;
    this.paused = next;
  }

  /* ---------- Keyboard ---------- */

  private onKey = (e: KeyboardEvent) => {
    const card = e.target as HTMLElement;
    if (!card.matches?.("[data-alert]") || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const list = this.shown;
    const i = list.findIndex((a) => a.id === card.dataset.alert);
    const to = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const next = list[Math.max(0, Math.min(list.length - 1, to))];
    if (!next) return;
    this.activeId = next.id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-alert="${CSS.escape(next.id)}"]`)?.focus());
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("now") && this.now === undefined) this.tick();
    if (changed.has("paused")) this.held = this.paused ? new Set(this.items.map((i) => i.id)) : null;
    if (changed.has("items") || changed.has("paused")) {
      // Alerts not seen before are new: they slide in, and they're announced – unless the feed is paused
      const ids = new Set(this.items.map((i) => i.id));
      if (this.seen === null) this.seen = ids;
      else if (!this.held) {
        const added = this.sorted.filter((i) => !this.seen!.has(i.id));
        this.fresh = new Set(added.map((i) => i.id));
        if (added.length === 1) this.status = `New ${this.label(added[0].severity).toLowerCase()} alert: ${added[0].title}`;
        else if (added.length > 1) {
          const critical = added.filter((i) => i.severity === "critical").length;
          this.status = `${added.length} new alerts${critical ? `, ${critical} critical` : ""}`;
        }
        this.seen = ids;
      } else if (changed.has("items")) {
        const waiting = this.items.filter((i) => !this.held!.has(i.id)).length;
        if (waiting) this.status = `${waiting} new ${waiting === 1 ? "alert" : "alerts"} waiting`;
      }
    }
  }

  /* ---------- Rendering ---------- */

  private renderAlert(item: AlertItem, stop: string) {
    const id = `${this.uid}-${item.id}`;
    const isStop = item.id === stop;
    const acked = this.isAcked(item);
    return html`<li class="ui-afd__item">
      <article
        class="ui-afd__alert"
        data-alert=${item.id}
        data-severity=${item.severity}
        ?data-acked=${acked}
        ?data-new=${this.fresh.has(item.id)}
        tabindex=${isStop ? 0 : -1}
        aria-labelledby=${`${id}-title`}
        aria-describedby=${`${id}-meta`}
        @focusin=${() => (this.activeId = item.id)}
      >
        <span class="ui-afd__mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${MARK[item.severity]}</svg></span>
        <div class="ui-afd__main">
          <div class="ui-afd__top">
            <span class="ui-afd__category">${item.category}</span>
            <span class="ui-afd__severity">${this.label(item.severity)}</span>
            ${item.source ? html`<span class="ui-afd__source">${item.source}</span>` : nothing}
            <time class="ui-afd__time" datetime=${Number.isFinite(item.time) ? new Date(item.time).toISOString() : ""}>${this.at ? alertTime(item.time, this.at, this.locale) : ""}</time>
          </div>
          <h4 class="ui-afd__title" id=${`${id}-title`}>${item.title}</h4>
          <p class="ui-afd__subject" id=${`${id}-meta`}>${[this.label(item.severity), item.category, item.subject, acked ? "Acknowledged" : ""].filter(Boolean).join(" · ")}</p>
          ${item.subject ? html`<p class="ui-afd__subject-line" aria-hidden="true">${item.subject}</p>` : nothing}
        </div>
        <div class="ui-afd__actions">
          ${acked ? html`<span class="ui-afd__done">Acknowledged</span>` : nothing}
          ${this.actionsOf(item).map(
            (a) => html`<button type="button" class="ui-afd__btn" data-action=${a.id} data-tone=${a.tone ?? "plain"} tabindex=${isStop ? 0 : -1} aria-describedby=${`${id}-title`} @click=${() => this.act(item, a)}>${a.label}</button>`,
          )}
        </div>
      </article>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const list = this.shown;
    const stop = list.some((a) => a.id === this.activeId) ? this.activeId : (list[0]?.id ?? "");
    const at = this.at;
    const midnight = at ? new Date(at).setHours(0, 0, 0, 0) : 0;
    const today = this.todayCount ?? this.items.filter((i) => at && i.time >= midnight && i.time <= at).length;
    const critical = this.items.filter((i) => i.severity === "critical" && !this.isAcked(i)).length;
    const waiting = this.held ? this.items.filter((i) => !this.held!.has(i.id)).length : 0;
    return html`
      <span class="ui-afd__sr" role="status">${this.status}</span>
      ${cardHead({
        icon: sirenIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: html`<span class="ui-afd__head">
          <span class="ui-afd__live" ?data-paused=${this.paused}><span class="ui-afd__dot" aria-hidden="true"></span>${this.paused ? "Paused" : "Live"} · ${today} ${today === 1 ? "event" : "events"} today</span>
          ${critical ? html`<span class="ui-afd__critical">${critical} critical</span>` : nothing}
          <button type="button" class="ui-afd__pause" aria-pressed=${this.paused ? "true" : "false"} @click=${() => this.setPaused(!this.paused)}>${this.paused ? "Resume feed" : "Pause feed"}</button>
        </span>`,
      })}
      <div class="ui-afd__card">
        ${waiting
          ? html`<button type="button" class="ui-afd__waiting" @click=${() => this.setPaused(false)}>Show ${waiting} new ${waiting === 1 ? "alert" : "alerts"}</button>`
          : nothing}
        ${list.length
          ? html`<ul class="ui-afd__list" aria-labelledby=${`${id}-title`} @keydown=${this.onKey}>
              ${repeat(list, (a) => a.id, (a) => this.renderAlert(a, stop))}
            </ul>`
          : html`<p class="ui-afd__empty">${this.empty}</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="afd"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="afd"] {
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
[data-ui="afd"] { --tc-afd-mark-ink: var(--tc-surface-raised); }
[data-ui="afd"] *, [data-ui="afd"] *::before, [data-ui="afd"] *::after { box-sizing: border-box; }
[data-ui="afd"] p, [data-ui="afd"] h4 { margin: 0; }
[data-ui="afd"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="afd"] svg { display: block; flex: none; }
:where([data-ui="afd"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="afd"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-afd__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-afd__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header: live, today's count, critical, Pause ----- */
.ui-afd__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-afd__live { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-afd__dot { position: relative; width: 8px; height: 8px; border-radius: 50%; background: var(--tc-status-success-solid); }
.ui-afd__dot::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: inherit; animation: ui-afd-pulse var(--tc-duration-shimmer) var(--tc-ease-decelerate) infinite; }
.ui-afd__live[data-paused] .ui-afd__dot { background: var(--tc-icon-muted); }
.ui-afd__live[data-paused] .ui-afd__dot::after { animation: none; }
.ui-afd__critical { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-danger-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-fg); white-space: nowrap; }
.ui-afd__pause { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg) !important; box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; }
.ui-afd__pause:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
/* ----- New alerts waiting while paused ----- */
.ui-afd__waiting { display: block; width: calc(100% - 2 * var(--tc-space-3)); margin: var(--tc-space-3) var(--tc-space-3) 0 !important; padding: var(--tc-space-1-5) var(--tc-space-3) !important; border-radius: var(--tc-radius-full); background: var(--tc-fill-selected) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); text-align: center; }
/* ----- The alerts ----- */
.ui-afd__list { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-3) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-afd__list { padding-top: var(--tc-space-1) !important; }
.ui-afd__alert {
  position: relative; display: flex; align-items: flex-start; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-4);
  border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); outline: none;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-afd__alert { background: var(--tc-surface-on-tray); }
.ui-afd__alert:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The severity edge, its mark and its word */
.ui-afd__alert::before { content: ""; position: absolute; left: 0; top: var(--tc-space-2); bottom: var(--tc-space-2); width: 3px; border-radius: var(--tc-radius-full); background: var(--tc-afd-sev); }
.ui-afd__alert[data-severity="critical"] { --tc-afd-sev: var(--tc-status-danger-solid); --tc-afd-sev-fg: var(--tc-status-danger-fg); }
.ui-afd__alert[data-severity="high"] { --tc-afd-sev: var(--tc-status-warning-solid); --tc-afd-sev-fg: var(--tc-status-warning-fg); }
.ui-afd__alert[data-severity="medium"] { --tc-afd-sev: var(--tc-status-info-solid); --tc-afd-sev-fg: var(--tc-status-info-fg); }
.ui-afd__alert[data-severity="info"] { --tc-afd-sev: var(--tc-border-strong); --tc-afd-sev-fg: var(--tc-text-secondary); }
.ui-afd__mark { display: grid; flex: none; place-items: center; width: 20px; height: 20px; margin-top: var(--tc-space-0-5); color: var(--tc-afd-sev); }
.ui-afd__mark > svg { width: 18px; height: 18px; }
.ui-afd__main { display: grid; flex: 1; min-width: 0; gap: var(--tc-space-1); }
.ui-afd__top { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); }
.ui-afd__category { font-family: var(--tc-font-mono); font-weight: var(--tc-font-weight-semibold); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-afd-sev-fg); }
.ui-afd__severity { font-weight: var(--tc-font-weight-medium); color: var(--tc-afd-sev-fg); }
.ui-afd__source { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-afd__time { margin-left: auto; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-afd__title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-afd__subject { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ui-afd__subject-line { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-afd__actions { display: flex; flex: none; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-1-5); align-self: center; }
.ui-afd__btn { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg) !important; box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-afd__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-afd__btn[data-tone="danger"] { background: var(--tc-status-danger-bg) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border); color: var(--tc-status-danger-fg); }
.ui-afd__btn[data-tone="primary"] { background: var(--tc-action-primary-bg) !important; box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-afd__done { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
/* Acknowledged: quiet, the edge and mark go gray */
.ui-afd__alert[data-acked] { --tc-afd-sev: var(--tc-border-strong); background: var(--tc-fill-subtle); box-shadow: none; }
.ui-afd__alert[data-acked] .ui-afd__title { color: var(--tc-text-secondary); }
.ui-afd__alert[data-acked] :is(.ui-afd__category, .ui-afd__severity) { color: var(--tc-text-muted); }
/* A new alert slides in */
.ui-afd__alert[data-new] { animation: ui-afd-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-afd__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@keyframes ui-afd-in { from { opacity: 0; transform: translateY(-6px); } }
@keyframes ui-afd-pulse { from { opacity: 0.6; transform: scale(1); } to { opacity: 0; transform: scale(2.4); } }
@container (max-width: 480px) {
  .ui-afd__alert { flex-wrap: wrap; }
  .ui-afd__actions { width: 100%; justify-content: flex-start; padding-left: calc(var(--tc-space-5) + var(--tc-space-3)); }
}
@media (forced-colors: active) {
  .ui-afd__alert { border: 1px solid CanvasText; }
  .ui-afd__alert::before { background: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="afd"] *, [data-ui="afd"] *::before, [data-ui="afd"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-alert-feed")) customElements.define("tc-alert-feed", TcAlertFeed);

declare global {
  interface HTMLElementTagNameMap {
    "tc-alert-feed": TcAlertFeed;
  }
}

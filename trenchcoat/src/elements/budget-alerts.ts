import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-budget-alerts> – spend alerts set by dragging markers along the month's budget. The bar shows what's spent so
 * far and, hatched beyond it, the forecast to the month's end, with a line at the budget. Each alert is a marker on the
 * bar – drag it, or focus it and use the arrow keys – at a share of the budget ("Alert at $4,000, 80% of budget").
 * Clicking the bar or Add alert adds one; Delete or Remove takes it away. Under the bar each alert lists where it sends
 * (email or chat) and to whom, and a line says when the forecast crosses it ("Forecast crosses 80% around 24 Nov").
 *   · every marker is a slider: ← / → 1%, Shift or Page Up / Down 10%, Home / End to the ends, Delete removes it
 *   · the forecast date needs `now` and `end`; the element never reads the clock
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-budget-alerts budget="5000" spent="2100" forecast="5400" .alerts=${[{ id: "a1", at: 0.8, channel: "email", recipients: ["finance@…"] }]}></tc-budget-alerts>
 */

/** A bell: Lucide (ISC, lucide.dev) */
const bellIcon = svg`<path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>`;

export type BudgetAlertChannel = "email" | "chat";
export type BudgetAlert = {
  id: string;
  /** Where it fires, as a share of the budget: 0.8 is 80% */
  at: number;
  channel: BudgetAlertChannel;
  /** Who it goes to: addresses, people or a chat channel */
  recipients: string[];
};

/** Details of the events */
export type BudgetAlertsChange = { alerts: BudgetAlert[]; change: "move" | "add" | "remove" | "channel" | "recipients"; id: string };

/** The lowest and highest an alert may be set, as shares of the budget */
export const BUDGET_ALERT_MIN = 0.01;
export const BUDGET_ALERT_MAX = 1.5;
const snap = (v: number) => Math.min(BUDGET_ALERT_MAX, Math.max(BUDGET_ALERT_MIN, Math.round(v * 100) / 100));

/**
 * When spend reaches `amount`, drawing a straight line from `spent` at `now` to `forecast` at `end`; null when it
 * never does within the period, and `now` when it already has
 */
export function budgetCrossing(amount: number, { spent, forecast, now, end }: { spent: number; forecast: number; now: number; end: number }): number | null {
  if (spent >= amount) return now;
  if (forecast <= spent || forecast < amount || end <= now) return null;
  return now + ((amount - spent) / (forecast - spent)) * (end - now);
}

let uidCount = 0;
let alertCount = 0;

/**
 * Budget alerts: alert markers dragged along the month's budget bar – spent so far and the hatched forecast – with each
 * alert's channel and recipients and when the forecast crosses it.
 * @tag tc-budget-alerts
 * @fires tc-alerts-change - An alert was moved, added or removed, or its channel or recipients changed ({ alerts, change, id }: BudgetAlertsChange); cancelable – prevented, `alerts` stays as it was
 */
export class TcBudgetAlerts extends TcElement {
  static override ui = "bal";

  /** The heading */
  @property() accessor heading = "Budget alerts";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The month's budget, in `currency` */
  @property({ type: Number }) accessor budget = 0;
  /** Spent so far this month, in `currency` */
  @property({ type: Number }) accessor spent = 0;
  /** The forecast for the month's end, in `currency`; unset leaves the hatched forecast out */
  @property({ type: Number }) accessor forecast: number | undefined = undefined;
  /** The alerts. Changed by dragging, the keys and the fields unless a tc-alerts-change listener calls preventDefault() */
  @property({ attribute: false }) accessor alerts: BudgetAlert[] = [];
  /** Now, as epoch ms; with `end` it dates the forecast's crossings */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The period's last moment, as epoch ms */
  @property({ type: Number }) accessor end: number | undefined = undefined;
  /** The currency, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** The language for numbers and dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The time zone the crossing dates are given in, e.g. "Europe/London"; by default the browser's */
  @property({ attribute: "time-zone" }) accessor timeZone: string | undefined = undefined;

  /** The alert being dragged */
  @state() private accessor dragging: string | null = null;
  /** A polite message for screen readers */
  @state() private accessor announce = "";

  private uid = `tc-bal-${++uidCount}`;

  /* ---------- The scale ---------- */

  /** The bar's right end, as a share of the budget */
  private get scale() {
    const b = this.budget > 0 ? this.budget : 1;
    const top = Math.max(1.1, this.spent / b, (this.forecast ?? 0) / b, ...this.alerts.map((a) => a.at));
    return Math.min(BUDGET_ALERT_MAX, Math.ceil(top * 10) / 10 + 0.05);
  }
  private x(share: number) {
    return `${(Math.max(0, share) / this.scale) * 100}%`;
  }
  private money(v: number) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, maximumFractionDigits: 0 }).format(v);
    } catch {
      return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 }).format(v);
    }
  }
  private pct(v: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(v);
  }
  private date(t: number) {
    return new Intl.DateTimeFormat(this.locale, { day: "numeric", month: "short", timeZone: this.timeZone }).format(t);
  }
  /** "Alert at $4,000, 80% of budget" */
  valueText(a: Pick<BudgetAlert, "at">) {
    return `Alert at ${this.money(a.at * this.budget)}, ${this.pct(a.at)} of budget`;
  }
  /** "Forecast crosses 80% around 24 Nov", "Already passed", or "" when it can't be worked out or won't happen */
  crossingWords(a: Pick<BudgetAlert, "at">) {
    const amount = a.at * this.budget;
    if (this.spent >= amount) return "Already passed";
    if (this.forecast === undefined || this.now === undefined || this.end === undefined) return "";
    const t = budgetCrossing(amount, { spent: this.spent, forecast: this.forecast, now: this.now, end: this.end });
    return t === null ? "Not on track to reach it this month" : `Forecast crosses ${this.pct(a.at)} around ${this.date(t)}`;
  }

  /* ---------- Changes ---------- */

  private commit(alerts: BudgetAlert[], change: BudgetAlertsChange["change"], id: string, words = "") {
    if (!this.emit<BudgetAlertsChange>("tc-alerts-change", { alerts, change, id }, { cancelable: true })) return false;
    this.alerts = alerts;
    if (words) this.announce = words;
    return true;
  }
  private move(id: string, at: number, announce = false) {
    const a = this.alerts.find((x) => x.id === id);
    const next = snap(at);
    if (!a || next === a.at) return;
    this.commit(
      this.alerts.map((x) => (x.id === id ? { ...x, at: next } : x)),
      "move",
      id,
      announce ? this.valueText({ at: next }) : "",
    );
  }
  private add(at?: number) {
    const taken = new Set(this.alerts.map((a) => Math.round(a.at * 100)));
    let share = at !== undefined ? snap(at) : 0.5;
    if (at === undefined) for (const s of [0.5, 0.75, 0.9, 1, 0.25, 1.1]) if (!taken.has(Math.round(s * 100))) {
      share = s;
      break;
    }
    const id = `alert-${++alertCount}`;
    const last = this.alerts[this.alerts.length - 1];
    const next: BudgetAlert = { id, at: share, channel: last?.channel ?? "email", recipients: last ? [...last.recipients] : [] };
    if (!this.commit([...this.alerts, next], "add", id, `Added: ${this.valueText(next)}`)) return;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-bal__marker[data-id="${CSS.escape(id)}"]`)?.focus());
  }
  private removeAlert(a: BudgetAlert, focusAfter: "marker" | "row") {
    const sorted = this.sorted;
    const i = sorted.findIndex((x) => x.id === a.id);
    if (!this.commit(this.alerts.filter((x) => x.id !== a.id), "remove", a.id, `Removed the alert at ${this.pct(a.at)}`)) return;
    const next = this.sorted[Math.min(i, this.sorted.length - 1)];
    void this.updateComplete.then(() =>
      this.querySelector<HTMLElement>(next ? (focusAfter === "marker" ? `.ui-bal__marker[data-id="${CSS.escape(next.id)}"]` : `[data-remove="${CSS.escape(next.id)}"]`) : ".ui-bal__add")?.focus(),
    );
  }
  private get sorted() {
    return [...this.alerts].sort((a, b) => a.at - b.at);
  }

  /* ---------- Pointer and keys ---------- */

  private shareAt(e: PointerEvent | MouseEvent) {
    const bar = this.querySelector<HTMLElement>(".ui-bal__bar");
    if (!bar) return 0;
    const r = bar.getBoundingClientRect();
    return r.width > 0 ? ((e.clientX - r.left) / r.width) * this.scale : 0;
  }
  private onMarkerDown(e: PointerEvent, a: BudgetAlert) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).focus();
    this.dragging = a.id;
    // Capture can fail for a pointer the browser no longer tracks; the drag still follows pointermove on the marker
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* not capturable */
    }
  }
  private onMarkerMove(e: PointerEvent, a: BudgetAlert) {
    if (this.dragging !== a.id) return;
    this.move(a.id, this.shareAt(e));
  }
  private onMarkerUp(e: PointerEvent, a: BudgetAlert) {
    if (this.dragging !== a.id) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    this.dragging = null;
    const now = this.alerts.find((x) => x.id === a.id);
    if (now) this.announce = this.valueText(now);
  }
  private onBarClick(e: MouseEvent) {
    if ((e.target as Element).closest(".ui-bal__marker")) return;
    this.add(this.shareAt(e));
  }
  private onMarkerKey(e: KeyboardEvent, a: BudgetAlert) {
    const big = e.shiftKey ? 0.1 : 0.01;
    const step: Record<string, number | undefined> = { ArrowRight: big, ArrowUp: big, ArrowLeft: -big, ArrowDown: -big, PageUp: 0.1, PageDown: -0.1 };
    if (e.key in step) {
      e.preventDefault();
      this.move(a.id, a.at + step[e.key]!, true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      this.move(a.id, e.key === "Home" ? BUDGET_ALERT_MIN : BUDGET_ALERT_MAX, true);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      this.removeAlert(a, "marker");
    }
  }

  /* ---------- Rendering ---------- */

  private renderBar() {
    const b = this.budget > 0 ? this.budget : 1;
    const spent = this.spent / b;
    const forecast = this.forecast !== undefined ? this.forecast / b : undefined;
    return html`<div class="ui-bal__scale">
      <div class="ui-bal__bar" @click=${this.onBarClick}>
        <span class="ui-bal__spent" data-over=${spent > 1 ? "true" : "false"} style=${`inline-size: ${this.x(spent)}`}></span>
        ${forecast !== undefined && forecast > spent
          ? html`<span class="ui-bal__forecast" style=${`inset-inline-start: ${this.x(spent)}; inline-size: calc(${this.x(forecast)} - ${this.x(spent)})`}></span>`
          : nothing}
        <span class="ui-bal__budget" style=${`inset-inline-start: ${this.x(1)}`}><span class="ui-bal__budget-label">Budget</span></span>
        ${repeat(
          this.sorted,
          (a) => a.id,
          (a) => html`<span
            class="ui-bal__marker"
            data-id=${a.id}
            role="slider"
            tabindex="0"
            aria-label=${`Alert at ${this.pct(a.at)}`}
            aria-valuemin=${Math.round(BUDGET_ALERT_MIN * 100)}
            aria-valuemax=${Math.round(BUDGET_ALERT_MAX * 100)}
            aria-valuenow=${Math.round(a.at * 100)}
            aria-valuetext=${this.valueText(a)}
            aria-describedby=${`${this.uid}-keys`}
            ?data-dragging=${this.dragging === a.id}
            ?data-passed=${this.spent >= a.at * this.budget}
            style=${`inset-inline-start: ${this.x(a.at)}`}
            @pointerdown=${(e: PointerEvent) => this.onMarkerDown(e, a)}
            @pointermove=${(e: PointerEvent) => this.onMarkerMove(e, a)}
            @pointerup=${(e: PointerEvent) => this.onMarkerUp(e, a)}
            @pointercancel=${(e: PointerEvent) => this.onMarkerUp(e, a)}
            @keydown=${(e: KeyboardEvent) => this.onMarkerKey(e, a)}
            ><span class="ui-bal__tag" aria-hidden="true">${this.pct(a.at)}</span></span
          >`,
        )}
      </div>
      <div class="ui-bal__ticks" aria-hidden="true"><span>${this.money(0)}</span><span>${this.money(this.scale * this.budget)}</span></div>
    </div>`;
  }

  private renderAlert(a: BudgetAlert) {
    const crossing = this.crossingWords(a);
    const rid = `${this.uid}-r-${a.id}`;
    return html`<li class="ui-bal__alert" data-id=${a.id}>
      <div class="ui-bal__what">
        <span class="ui-bal__at">${this.money(a.at * this.budget)} <span class="ui-bal__share">${this.pct(a.at)}</span></span>
        ${crossing ? html`<span class="ui-bal__cross" ?data-passed=${crossing === "Already passed"}>${crossing}</span>` : nothing}
      </div>
      <label class="ui-bal__channel"
        ><span class="tc-sr-only">Send the ${this.pct(a.at)} alert by</span
        ><select
          class="ui-bal__field"
          @change=${(e: Event) => {
            const sel = e.target as HTMLSelectElement;
            if (!this.commit(this.alerts.map((x) => (x.id === a.id ? { ...x, channel: sel.value as BudgetAlertChannel } : x)), "channel", a.id)) sel.value = a.channel;
          }}
        >
          <option value="email" ?selected=${a.channel === "email"}>Email</option>
          <option value="chat" ?selected=${a.channel === "chat"}>Chat</option>
        </select></label
      >
      <span class="ui-bal__to"
        ><label class="tc-sr-only" for=${rid}>Recipients for the ${this.pct(a.at)} alert, separated by commas</label
        ><input
          id=${rid}
          class="ui-bal__field ui-bal__recipients"
          .value=${a.recipients.join(", ")}
          placeholder=${a.channel === "chat" ? "#finance-ops" : "finance@example.org"}
          @change=${(e: Event) => {
            const input = e.target as HTMLInputElement;
            const recipients = input.value.split(",").map((s) => s.trim()).filter(Boolean);
            if (!this.commit(this.alerts.map((x) => (x.id === a.id ? { ...x, recipients } : x)), "recipients", a.id)) input.value = a.recipients.join(", ");
          }}
      /></span>
      <button type="button" class="ui-bal__quiet" data-remove=${a.id} @click=${() => this.removeAlert(a, "row")}>Remove<span class="tc-sr-only"> the ${this.pct(a.at)} alert</span></button>
    </li>`;
  }

  protected override render() {
    const b = this.budget;
    const share = b > 0 ? this.spent / b : 0;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      <span class="tc-sr-only" id=${`${this.uid}-keys`}>Arrow keys move the alert by 1%, Shift with an arrow or Page Up and Page Down by 10%. Delete removes it.</span>
      ${cardHead({
        icon: bellIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: html`<span class="ui-bal__summary"
          ><span class="ui-bal__summary-num">${this.money(this.spent)}</span> of ${this.money(b)} · ${this.pct(share)}${this.forecast !== undefined
            ? html`<span class="ui-bal__summary-forecast">Forecast ${this.money(this.forecast)}</span>`
            : nothing}</span
        >`,
      })}
      <div class="ui-bal__card">
        <div class="ui-bal__top">
          ${this.renderBar()}
          <ul class="ui-bal__legend" aria-hidden="true">
            <li><span class="ui-bal__swatch" data-k="spent"></span>Spent</li>
            ${this.forecast !== undefined ? html`<li><span class="ui-bal__swatch" data-k="forecast"></span>Forecast</li>` : nothing}
            <li><span class="ui-bal__swatch" data-k="alert"></span>Alert – drag, or click the bar to add</li>
          </ul>
        </div>
        ${this.alerts.length
          ? html`<ul class="ui-bal__list" aria-labelledby=${`${this.uid}-title`}>${repeat(this.sorted, (a) => a.id, (a) => this.renderAlert(a))}</ul>`
          : html`<p class="ui-bal__empty">No alerts yet.</p>`}
        <div class="ui-bal__foot"><button type="button" class="tc-btn-sm ui-bal__add" @click=${() => this.add()}>Add alert</button></div>
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bal"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bal"] {
  position: relative; display: block; box-sizing: border-box; width: 100%; overflow: hidden;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="bal"] { --tc-bal-bar-h: 14px; --tc-bal-marker-w: 14px; }
[data-ui="bal"] *, [data-ui="bal"] *::before, [data-ui="bal"] *::after { box-sizing: border-box; }
:where([data-ui="bal"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
[data-ui="bal"] button:focus-visible, [data-ui="bal"] select:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="bal"] ul, [data-ui="bal"] p { margin: 0; padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-bal__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-bal__summary { display: grid; justify-items: end; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
.ui-bal__summary-num { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-bal__summary-forecast { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-bal__top { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-8) var(--tc-space-5) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-bal__scale { display: grid; gap: var(--tc-space-1-5); }
.ui-bal__bar { position: relative; height: var(--tc-bal-bar-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); cursor: copy; touch-action: none; }
.ui-bal__spent { position: absolute; inset-block: 0; inset-inline-start: 0; max-inline-size: 100%; border-radius: inherit; background: var(--tc-meter-fill); }
.ui-bal__spent[data-over="true"] { background: var(--tc-status-danger-solid); }
.ui-bal__forecast { position: absolute; inset-block: 0; max-inline-size: 100%; border-radius: var(--tc-meter-radius); background: repeating-linear-gradient(135deg, var(--tc-fill-subtle) 0 4px, var(--tc-border-strong) 4px 5px); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-bal__budget { position: absolute; inset-block: calc(var(--tc-space-1) * -1); width: 2px; translate: -50% 0; border-radius: var(--tc-radius-2xs); background: var(--tc-text-primary); pointer-events: none; }
.ui-bal__budget-label { position: absolute; top: 100%; left: 50%; translate: -50% var(--tc-space-0-5); font-size: var(--tc-font-size-2xs); color: var(--tc-text-muted); white-space: nowrap; }
.ui-bal__marker { position: absolute; top: 50%; width: var(--tc-bal-marker-w); height: calc(var(--tc-bal-bar-h) + var(--tc-space-3)); translate: -50% -50%; border-radius: var(--tc-radius-sm); background: var(--tc-accent-solid); box-shadow: 0 0 0 2px var(--tc-surface-raised); cursor: ew-resize; touch-action: none; }
.ui-bal__marker[data-passed] { background: var(--tc-status-warning-solid); }
.ui-bal__marker:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-bal__marker[data-dragging] { cursor: grabbing; }
.ui-bal__tag { position: absolute; bottom: calc(100% + var(--tc-space-1)); left: 50%; translate: -50% 0; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); font-size: var(--tc-font-size-2xs); font-variant-numeric: tabular-nums; white-space: nowrap; pointer-events: none; }
.ui-bal__ticks { display: flex; justify-content: space-between; margin-top: var(--tc-space-3); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-bal__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-bal__legend li { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-bal__swatch { width: var(--tc-space-3); height: var(--tc-space-2); border-radius: var(--tc-radius-2xs); }
.ui-bal__swatch[data-k="spent"] { background: var(--tc-meter-fill); }
.ui-bal__swatch[data-k="forecast"] { background: repeating-linear-gradient(135deg, var(--tc-fill-subtle) 0 2px, var(--tc-border-strong) 2px 3px); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-bal__swatch[data-k="alert"] { width: var(--tc-space-1-5); height: var(--tc-space-3); background: var(--tc-accent-solid); }
.ui-bal__list { padding: var(--tc-space-1-5) !important; }
.ui-bal__alert { display: grid; grid-template-columns: minmax(0, 1.3fr) auto minmax(0, 1.2fr) auto; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-2-5); }
.ui-bal__alert + .ui-bal__alert { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-bal__what { display: grid; min-width: 0; }
.ui-bal__at { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-bal__share { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-bal__cross { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-bal__cross[data-passed] { color: var(--tc-status-warning-fg); }
.ui-bal__field { width: 100%; height: var(--tc-field-h-sm); min-width: 0; margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-bal__field:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-bal__field::placeholder { color: var(--tc-text-placeholder); }
.ui-bal__to { display: block; min-width: 0; }
.ui-bal__quiet { min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) !important; border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-bal__quiet:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-bal__foot { padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-bal__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 560px) {
  .ui-bal__alert { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "what what" "channel remove" "to to"; }
  .ui-bal__what { grid-area: what; }
  .ui-bal__channel { grid-area: channel; }
  .ui-bal__to { grid-area: to; }
  .ui-bal__quiet { grid-area: remove; justify-self: end; }
}
@media (forced-colors: active) {
  .ui-bal__spent, .ui-bal__marker, .ui-bal__budget { background: CanvasText !important; }
  .ui-bal__bar { outline: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="bal"] *, [data-ui="bal"] *::before, [data-ui="bal"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-budget-alerts")) customElements.define("tc-budget-alerts", TcBudgetAlerts);

declare global {
  interface HTMLElementTagNameMap {
    "tc-budget-alerts": TcBudgetAlerts;
  }
}

import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";

/*
 * <tc-saved-search-alerts> – saved searches that tell you when new things match. Each alert shows its name, its query,
 * how many new matches there are ("12 new since Tue" – a button that opens them), when it last ran, how often it
 * checks (Instant, Daily, Weekly, Off), where it tells you (email, in the app, Slack – a toggle each), Pause and
 * Resume, Run now, and Remove – which leaves "Removed · Undo" until the next removal. At the foot, Add alert takes a
 * name, a query and how often; `draft-query` fills the query in (say, from the search the person just ran).
 *   · every change fires a cancelable tc-alerts-change ({ alerts, change }) with the list as it will be – prevent it
 *     and update `alerts` yourself to keep them on your server
 *   · Run now fires tc-run; the new-matches badge fires tc-open
 *   · times are relative to `now`, or to the element's own clock, read every minute
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-saved-search-alerts .alerts=${[{ id: "a1", name: "Coral grants", query: "coral bleaching grant", frequency: "daily", channels: ["email"] }]}></tc-saved-search-alerts>
 */

export type AlertFrequency = "instant" | "daily" | "weekly" | "off";
export type SearchAlert = {
  id: string;
  name: string;
  query: string;
  frequency: AlertFrequency;
  /** Where it tells you: the ids of `channels` */
  channels: string[];
  /** How many new matches since it last told you */
  newCount?: number;
  /** When it last checked, epoch ms */
  lastRun?: number;
  /** When it last found something new, epoch ms – "12 new since Tue" */
  lastMatch?: number;
  paused?: boolean;
};
export type AlertChannel = { id: string; label: string };
export type AlertChange =
  | { type: "add"; id: string }
  | { type: "remove"; id: string }
  | { type: "restore"; id: string }
  | { type: "frequency"; id: string; frequency: AlertFrequency }
  | { type: "channel"; id: string; channel: string; on: boolean }
  | { type: "pause"; id: string; paused: boolean };

/** Details of the events */
export type AlertsChange = { alerts: SearchAlert[]; change: AlertChange };
export type AlertRun = { id: string; alert: SearchAlert };

export const defaultAlertChannels: AlertChannel[] = [
  { id: "email", label: "Email" },
  { id: "app", label: "In app" },
  { id: "slack", label: "Slack" },
];
const FREQUENCIES: [AlertFrequency, string][] = [
  ["instant", "Instant"],
  ["daily", "Daily"],
  ["weekly", "Weekly"],
  ["off", "Off"],
];

const MIN = 60_000;
const DAY = 86_400_000;
let uidCount = 0;
let idCount = 0;
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `alert-${(++idCount).toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

/* bell-ring, play, pause, x, plus, mail, layout-panel-top, hash: Lucide (ISC, lucide.dev) */
const bellGlyph = svg`<path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M22 8c0-2.3-.8-4.3-2-6"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path><path d="M4 2C2.8 3.7 2 5.7 2 8"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const playIcon = () => lucide(14, svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`);
const pauseIcon = () => lucide(14, svg`<rect x="14" y="4" width="4" height="16" rx="1"></rect><rect x="6" y="4" width="4" height="16" rx="1"></rect>`);
const xIcon = () => lucide(14, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const plusIcon = () => lucide(16, svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`);
const CHANNEL_ICONS: Record<string, ReturnType<typeof svg>> = {
  email: svg`<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>`,
  app: svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path>`,
  slack: svg`<line x1="4" x2="20" y1="9" y2="9"></line><line x1="4" x2="20" y1="15" y2="15"></line><line x1="10" x2="8" y1="3" y2="21"></line><line x1="16" x2="14" y1="3" y2="21"></line>`,
};
const dayStart = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

/**
 * Saved searches that tell you about new matches – the new count, how often and where each checks, pause, Run now,
 * remove with Undo, and Add alert.
 * @tag tc-saved-search-alerts
 * @fires tc-alerts-change - An alert was added, changed, paused, removed or restored ({ alerts, change }: AlertsChange); cancelable – prevented, `alerts` stays as it was
 * @fires tc-run - Run now was pressed ({ id, alert }: AlertRun)
 * @fires tc-open - The new matches were asked for ({ id, alert }: AlertRun)
 */
export class TcSavedSearchAlerts extends TcElement {
  static override ui = "ssa";

  /** The heading, and the list's name */
  @property() accessor heading = "Search alerts";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The alerts, in order. Changed by the user unless tc-alerts-change is prevented */
  @property({ attribute: false }) accessor alerts: SearchAlert[] = [];
  /** Where alerts can tell people */
  @property({ attribute: false }) accessor channels: AlertChannel[] = defaultAlertChannels;
  /** A query to fill Add alert with – the search the person just ran */
  @property({ attribute: "draft-query" }) accessor draftQuery = "";
  /** The time now, epoch ms; by default the element's own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The language for dates and numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Read only: no adding, changing or removing */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;

  @state() private accessor clock = 0;
  @state() private accessor removedAlert: { alert: SearchAlert; index: number } | null = null;
  @state() private accessor draftName = "";
  @state() private accessor draftText = "";
  @state() private accessor draftFrequency: AlertFrequency = "daily";
  @state() private accessor announce = "";
  /** A removal or an addition the page was asked to make (controlled `alerts`): Undo appears, or the form clears, once `alerts` shows it */
  private pendingRemoval: { alert: SearchAlert; index: number } | null = null;
  private pendingAdd: string | null = null;

  private uid = `tc-ssa-${++uidCount}`;
  private timer = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.tick();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.timer);
    this.timer = 0;
  }
  private tick() {
    clearInterval(this.timer);
    this.timer = 0;
    if (this.now !== undefined) return;
    this.readClock();
    this.timer = window.setInterval(this.readClock, MIN);
  }
  private readClock = () => (this.clock = Date.now());

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("now") && this.isConnected) this.tick();
    if (changed.has("draftQuery") && this.draftQuery) this.draftText = this.draftQuery;
    if (changed.has("alerts") && this.removedAlert && this.alerts.some((a) => a.id === this.removedAlert!.alert.id)) this.removedAlert = null;
    if (changed.has("alerts") && this.pendingRemoval && !this.alerts.some((a) => a.id === this.pendingRemoval!.alert.id)) {
      this.removedAlert = this.pendingRemoval;
      this.pendingRemoval = null;
      this.announce = `Removed “${this.removedAlert.alert.name}”. Undo is above the list`;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-ssa__undo")?.focus());
    }
    if (changed.has("alerts") && this.pendingAdd && this.alerts.some((a) => a.id === this.pendingAdd)) {
      this.pendingAdd = null;
      this.clearDraft();
    }
  }

  private get time() {
    return this.now ?? this.clock;
  }

  /** "Tue", "yesterday", "today", or a date for anything over a week ago */
  private since(at: number) {
    const days = Math.round((dayStart(this.time) - dayStart(at)) / DAY);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return formatDate(at, this.locale, { weekday: "short" });
    return formatDate(at, this.locale, { month: "short", day: "numeric" });
  }
  private ago(at: number) {
    const diff = Math.max(0, this.time - at);
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: "auto", style: "short" });
    if (diff < MIN) return "just now";
    if (diff < 60 * MIN) return rtf.format(-Math.floor(diff / MIN), "minute");
    if (diff < DAY) return rtf.format(-Math.floor(diff / (60 * MIN)), "hour");
    return rtf.format(-Math.floor(diff / DAY), "day");
  }

  /* ---------- Actions ---------- */

  private commit(alerts: SearchAlert[], change: AlertChange, said: string) {
    if (!this.emit<AlertsChange>("tc-alerts-change", { alerts, change }, { cancelable: true })) {
      this.requestUpdate();
      return false;
    }
    this.alerts = alerts;
    this.announce = said;
    return true;
  }
  private patch(a: SearchAlert, next: Partial<SearchAlert>, change: AlertChange, said: string) {
    return this.commit(
      this.alerts.map((x) => (x.id === a.id ? { ...x, ...next } : x)),
      change,
      said,
    );
  }

  private add() {
    const query = this.draftText.trim();
    if (!query || this.readonly) return;
    const name = this.draftName.trim() || query;
    const alert: SearchAlert = { id: newId(), name, query, frequency: this.draftFrequency, channels: this.channels[0] ? [this.channels[0].id] : [] };
    if (!this.commit([...this.alerts, alert], { type: "add", id: alert.id }, `Alert “${name}” added`)) {
      // Controlled: the form clears when the page adds it
      this.pendingAdd = alert.id;
      return;
    }
    this.clearDraft();
  }
  private clearDraft() {
    this.draftName = "";
    this.draftText = "";
    this.draftFrequency = "daily";
  }

  private removeAlert(a: SearchAlert) {
    const index = this.alerts.findIndex((x) => x.id === a.id);
    if (!this.commit(
      this.alerts.filter((x) => x.id !== a.id),
      { type: "remove", id: a.id },
      `Removed “${a.name}”. Undo is above the list`,
    )) {
      // Controlled: Undo appears when the page takes it out
      this.pendingRemoval = { alert: a, index };
      return;
    }
    this.removedAlert = { alert: a, index };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-ssa__undo")?.focus());
  }

  private undo() {
    const r = this.removedAlert;
    if (!r) return;
    const alerts = [...this.alerts];
    alerts.splice(Math.min(r.index, alerts.length), 0, r.alert);
    if (!this.commit(alerts, { type: "restore", id: r.alert.id }, `Restored “${r.alert.name}”`)) return;
    this.removedAlert = null;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-id="${CSS.escape(r.alert.id)}"] .ui-ssa__name`)?.focus());
  }

  /* ---------- Rendering ---------- */

  private renderAlert(a: SearchAlert) {
    const id = `${this.uid}-${a.id}`;
    const off = a.paused || a.frequency === "off";
    const fresh = a.newCount ?? 0;
    const ro = this.readonly;
    return html`<li class="ui-ssa__alert" data-id=${a.id} ?data-off=${off}>
      <div class="ui-ssa__top">
        <div class="ui-ssa__what">
          <h4 class="ui-ssa__name" id=${`${id}-name`} tabindex="-1">${a.name}</h4>
          <code class="ui-ssa__query" title=${a.query}>${a.query}</code>
        </div>
        ${fresh > 0
          ? html`<button type="button" class="ui-ssa__new" @click=${() => this.emit<AlertRun>("tc-open", { id: a.id, alert: a })}>
              ${new Intl.NumberFormat(this.locale).format(fresh)} new${a.lastMatch !== undefined ? ` since ${this.since(a.lastMatch)}` : ""}<span class="tc-sr-only"> for ${a.name}</span>
            </button>`
          : nothing}
      </div>
      <p class="ui-ssa__status">
        ${a.paused ? html`<span class="ui-ssa__paused">Paused</span>` : nothing}
        <span>${a.lastRun !== undefined ? `Checked ${this.ago(a.lastRun)}` : "Not run yet"}</span>
      </p>
      <div class="ui-ssa__controls" role="group" aria-labelledby=${`${id}-name`}>
        <label class="ui-ssa__freq">
          <span class="tc-sr-only">How often</span>
          <select
            class="ui-ssa__select"
            ?disabled=${ro}
            .value=${live(a.frequency)}
            @change=${(e: Event) => {
              const frequency = (e.target as HTMLSelectElement).value as AlertFrequency;
              this.patch(a, { frequency }, { type: "frequency", id: a.id, frequency }, `“${a.name}”: ${FREQUENCIES.find((f) => f[0] === frequency)?.[1]}`);
            }}
          >
            ${FREQUENCIES.map(([v, label]) => html`<option value=${v} ?selected=${a.frequency === v}>${label}</option>`)}
          </select>
        </label>
        <span class="ui-ssa__channels">
          ${this.channels.map((c) => {
            const on = a.channels.includes(c.id);
            return html`<button
              type="button"
              class="ui-ssa__channel"
              aria-pressed=${on ? "true" : "false"}
              ?disabled=${ro}
              @click=${() =>
                this.patch(
                  a,
                  { channels: on ? a.channels.filter((x) => x !== c.id) : [...a.channels, c.id] },
                  { type: "channel", id: a.id, channel: c.id, on: !on },
                  `${c.label} ${on ? "off" : "on"} for “${a.name}”`,
                )}
            >${CHANNEL_ICONS[c.id] ? lucide(14, CHANNEL_ICONS[c.id]) : nothing}${c.label}</button>`;
          })}
        </span>
        <span class="ui-ssa__spacer"></span>
        ${ro
          ? nothing
          : html`<button
                type="button"
                class="ui-ssa__btn"
                @click=${() => this.patch(a, { paused: !a.paused }, { type: "pause", id: a.id, paused: !a.paused }, a.paused ? `Resumed “${a.name}”` : `Paused “${a.name}”`)}
              >${a.paused ? playIcon() : pauseIcon()}${a.paused ? "Resume" : "Pause"}</button>
              <button type="button" class="ui-ssa__btn" @click=${() => this.emit<AlertRun>("tc-run", { id: a.id, alert: a })}>Run now</button>
              <button type="button" class="ui-ssa__remove" title="Remove" @click=${() => this.removeAlert(a)}>${xIcon()}<span class="tc-sr-only">Remove “${a.name}”</span></button>`}
      </div>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const live_ = this.alerts.filter((a) => !a.paused && a.frequency !== "off").length;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({
        icon: bellGlyph,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: this.alerts.length ? html`<span class="ui-ssa__count">${live_} of ${this.alerts.length} on</span>` : nothing,
      })}
      <div class="ui-ssa__card">
        ${this.removedAlert
          ? html`<p class="ui-ssa__removed">Removed “${this.removedAlert.alert.name}” · <button type="button" class="ui-ssa__undo" @click=${() => this.undo()}>Undo</button></p>`
          : nothing}
        ${this.alerts.length
          ? html`<ul class="ui-ssa__list" aria-labelledby=${`${id}-title`}>
              ${repeat(
                this.alerts,
                (a) => a.id,
                (a) => this.renderAlert(a),
              )}
            </ul>`
          : html`<p class="ui-ssa__empty">No alerts yet. Save a search below and you'll hear when something new matches it.</p>`}
        ${this.readonly
          ? nothing
          : html`<form
              class="ui-ssa__add"
              aria-label="Add alert"
              @submit=${(e: Event) => {
                e.preventDefault();
                this.add();
              }}
            >
              <p class="ui-ssa__add-title">Add alert</p>
              <div class="ui-ssa__add-fields">
                <label class="ui-ssa__field">
                  <span class="ui-ssa__field-label">Name</span>
                  <input class="ui-ssa__input" type="text" placeholder="Optional" .value=${live(this.draftName)} @input=${(e: Event) => (this.draftName = (e.target as HTMLInputElement).value)} />
                </label>
                <label class="ui-ssa__field ui-ssa__field--query">
                  <span class="ui-ssa__field-label">Search</span>
                  <input class="ui-ssa__input" type="text" required .value=${live(this.draftText)} @input=${(e: Event) => (this.draftText = (e.target as HTMLInputElement).value)} />
                </label>
                <label class="ui-ssa__field">
                  <span class="ui-ssa__field-label">How often</span>
                  <select class="ui-ssa__select" .value=${live(this.draftFrequency)} @change=${(e: Event) => (this.draftFrequency = (e.target as HTMLSelectElement).value as AlertFrequency)}>
                    ${FREQUENCIES.filter(([v]) => v !== "off").map(([v, label]) => html`<option value=${v} ?selected=${this.draftFrequency === v}>${label}</option>`)}
                  </select>
                </label>
                <button type="submit" class="ui-ssa__add-btn" ?disabled=${!this.draftText.trim()}>${plusIcon()}Add alert</button>
              </div>
            </form>`}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="ssa"] {
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
/* Standard: a gray tray holding a white card. Clean: one white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ssa"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-ssa__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ssa"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-ssa__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="ssa"] *, [data-ui="ssa"] *::before, [data-ui="ssa"] *::after { box-sizing: border-box; }
:where([data-ui="ssa"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ssa"] :is(button, select, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="ssa"]) :is(h4, p, ul, form) { margin: 0; padding: 0; }
[data-ui="ssa"] ul { list-style: none; }
[data-ui="ssa"] svg { display: block; flex: none; }
.ui-ssa__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-ssa__removed { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); margin: var(--tc-space-3) var(--tc-space-3) 0; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-ssa__undo { font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
/* ----- Alerts ----- */
.ui-ssa__list { display: grid; }
.ui-ssa__alert { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-ssa__top { display: flex; align-items: flex-start; gap: var(--tc-space-3); }
.ui-ssa__what { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-ssa__name { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); outline: none; }
.ui-ssa__alert[data-off] .ui-ssa__name { color: var(--tc-text-secondary); }
.ui-ssa__query { overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-ssa__new { flex: none; display: inline-flex; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-full); background: var(--tc-status-info-bg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-info-fg); white-space: nowrap; }
.ui-ssa__new:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-info-fg); }
.ui-ssa__status { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-ssa__paused { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-status-warning-fg); }
.ui-ssa__controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); }
.ui-ssa__spacer { flex: 1; }
.ui-ssa__select { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); cursor: pointer; }
.ui-ssa__channels { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-ssa__channel { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-control); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ssa__channel:hover:not(:disabled) { background: var(--tc-fill-subtle); }
.ui-ssa__channel[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); color: var(--tc-text-primary); }
.ui-ssa__channel:disabled { cursor: default; }
.ui-ssa__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-ssa__btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-ssa__remove { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-ssa__remove:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-ssa__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* ----- Add alert ----- */
.ui-ssa__add { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); background: var(--tc-fill-subtle); }
.ui-ssa__add-title { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-ssa__add-fields { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) auto auto; align-items: end; gap: var(--tc-space-2); }
.ui-ssa__field { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-ssa__field-label { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-ssa__input { width: 100%; min-width: 0; height: var(--tc-control-h-md); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); outline: none; }
.ui-ssa__input::placeholder { color: var(--tc-text-placeholder); }
.ui-ssa__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); outline: none; }
.ui-ssa__add .ui-ssa__select { height: var(--tc-control-h-md); }
.ui-ssa__add-btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md) 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; }
.ui-ssa__add-btn:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-ssa__add-btn:disabled { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-disabled); cursor: not-allowed; }
@container (max-width: 560px) {
  .ui-ssa__add-fields { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .ui-ssa__field--query { grid-column: 1 / -1; order: -1; }
}
@media (forced-colors: active) {
  .ui-ssa__channel[aria-pressed="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ssa"] *, [data-ui="ssa"] *::before, [data-ui="ssa"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-saved-search-alerts")) customElements.define("tc-saved-search-alerts", TcSavedSearchAlerts);

declare global {
  interface HTMLElementTagNameMap {
    "tc-saved-search-alerts": TcSavedSearchAlerts;
  }
}

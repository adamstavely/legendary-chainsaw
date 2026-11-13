import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { duration } from "./internal/format";
import { hushTip, unhushTip } from "./internal/trigger-tip";
import { formatDate, pick } from "./internal/util";

/*
 * <tc-schedule-card> – a recurring agent task at a glance: its name, the schedule in words ("Every weekday at 09:00,
 * Europe/London"), a countdown to the next run that keeps itself fresh, and the last runs as a strip of marks –
 * succeeded, failed, skipped or running, each in words for screen readers, with a tooltip of when it ran and how long
 * it took. Run now, Pause / Resume and Edit sit in the footer; a paused task says so in words and shows no countdown.
 *   · the strip is one tab stop: ← / → move between runs, Home / End go to the ends, Enter or Space opens a run
 *     (tc-run-open)
 *   · Pause / Resume fires a cancelable tc-paused-change ({ paused }); Run now fires tc-run-now, Edit tc-edit
 *   · the countdown comes from `now`, or the element's own clock, which ticks once a second while a run is due
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-schedule-card heading="Ledger reconciliation" schedule="Every Monday at 09:00, Europe/London"
 *     .nextRun=${Date.parse("2026-11-16T09:00:00Z")} .runs=${[{ id: "r1", at: …, status: "succeeded", duration: 125000 }]}>
 *   </tc-schedule-card>
 */

export type ScheduleRunStatus = "succeeded" | "failed" | "skipped" | "running";
export type ScheduleRun = {
  id: string;
  /** When it started, epoch ms */
  at: number;
  status: ScheduleRunStatus;
  /** How long it took, ms */
  duration?: number;
  /** One quiet line for the tooltip, e.g. "3 invoices didn't match" */
  note?: string;
};

/** Details of the events */
export type SchedulePausedChange = { paused: boolean };
export type ScheduleRunOpen = { id: string; run: ScheduleRun };

/** The words the card uses; the page can rename any of them */
export type ScheduleCardLabels = {
  runNow: string;
  pause: string;
  resume: string;
  edit: string;
  paused: string;
  nextRun: string;
  due: string;
  noNextRun: string;
  lastRuns: string;
  noRuns: string;
  statuses: Record<ScheduleRunStatus, string>;
};
/** Labels the page passes: any of them, and any of the statuses */
export type ScheduleCardLabelsInput = Partial<Omit<ScheduleCardLabels, "statuses">> & { statuses?: Partial<Record<ScheduleRunStatus, string>> };
export const defaultScheduleCardLabels: ScheduleCardLabels = {
  runNow: "Run now",
  pause: "Pause",
  resume: "Resume",
  edit: "Edit",
  paused: "Paused – it won't run until you resume it",
  nextRun: "Next run",
  due: "Due now",
  noNextRun: "No run scheduled",
  lastRuns: "Last runs",
  noRuns: "No runs yet",
  statuses: { succeeded: "Succeeded", failed: "Failed", skipped: "Skipped", running: "Running" },
};

const TONE: Record<ScheduleRunStatus, "success" | "danger" | "neutral" | "info"> = { succeeded: "success", failed: "danger", skipped: "neutral", running: "info" };

/** "in 2 h 10 min", "in 45 s" – the time left, to the precision that matters */
export function scheduleCountdown(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `in ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `in ${m} min${m < 10 && s % 60 ? ` ${s % 60} s` : ""}`;
  const h = Math.floor(m / 60);
  if (h < 48) return `in ${h} h${m % 60 ? ` ${m % 60} min` : ""}`;
  return `in ${Math.round(h / 24)} days`;
}

/* Calendar clock, play, pause, pencil and the status marks: Lucide (ISC, lucide.dev) */
const calendarClock = svg`<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"></path><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h5"></path><path d="M17.5 17.5 16 16.3V14"></path><circle cx="16" cy="16" r="6"></circle>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const playIcon = () => lucide(14, svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`);
const pauseIcon = () => lucide(14, svg`<rect x="14" y="4" width="4" height="16" rx="1"></rect><rect x="6" y="4" width="4" height="16" rx="1"></rect>`);
const pencilIcon = () =>
  lucide(14, svg`<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path>`);
const MARK: Record<ScheduleRunStatus, () => ReturnType<typeof lucide>> = {
  succeeded: () => lucide(12, svg`<path d="M20 6 9 17l-5-5"></path>`),
  failed: () => lucide(12, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`),
  skipped: () => lucide(12, svg`<path d="M5 12h14"></path>`),
  running: () => lucide(12, svg`<circle cx="12" cy="12" r="4" fill="currentColor"></circle>`),
};

let uidCount = 0;

/**
 * A recurring agent task at a glance – the schedule in words, a live countdown to the next run, the last runs as
 * marks, and Run now, Pause / Resume and Edit.
 * @tag tc-schedule-card
 * @fires tc-run-now - Run now was pressed (detail: {})
 * @fires tc-paused-change - Pause or Resume was pressed ({ paused }: SchedulePausedChange); cancelable – prevented, `paused` stays as it was
 * @fires tc-edit - Edit was pressed (detail: {})
 * @fires tc-run-open - A run in the strip was opened ({ id, run }: ScheduleRunOpen)
 */
export class TcScheduleCard extends TcElement {
  static override ui = "scd";

  /** The task's name, and the card's heading */
  @property() accessor heading = "Scheduled task";
  /** The schedule in words, e.g. "Every weekday at 09:00, Europe/London" */
  @property() accessor schedule = "";
  /** When it runs next, epoch ms; null when nothing is scheduled */
  @property({ attribute: false }) accessor nextRun: number | null = null;
  /** The last runs, oldest first */
  @property({ attribute: false }) accessor runs: ScheduleRun[] = [];
  /** How many of the last runs the strip shows */
  @property({ type: Number, attribute: "max-runs" }) accessor maxRuns = 14;
  /** Paused: no countdown, and Resume in place of Pause. Changed by the user unless a tc-paused-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor paused = false;
  /** The time now, epoch ms; leave it unset and the element keeps its own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Hides Edit */
  @property({ type: Boolean, attribute: "hide-edit" }) accessor hideEdit = false;
  /** The language for dates and times, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The card's words, merged over defaultScheduleCardLabels */
  @property({ attribute: false }) accessor labels: ScheduleCardLabelsInput = {};

  @state() private accessor clock = 0;
  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-scd-${++uidCount}`;
  private tickTimer: number | undefined;

  private get words(): ScheduleCardLabels {
    return { ...defaultScheduleCardLabels, ...this.labels, statuses: { ...defaultScheduleCardLabels.statuses, ...this.labels.statuses } };
  }
  private get shown() {
    return this.runs.slice(-Math.max(0, this.maxRuns));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.syncClock();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.tickTimer);
    this.tickTimer = undefined;
  }
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("now") || changed.has("paused") || changed.has("nextRun")) this.syncClock();
  }
  /** The own clock ticks once a second, only while `now` isn't given, the task isn't paused and a run is scheduled */
  private syncClock() {
    const want = this.isConnected && this.now === undefined && !this.paused && this.nextRun != null;
    if (want && this.tickTimer === undefined) {
      this.clock = Date.now();
      this.tickTimer = window.setInterval(() => (this.clock = this.clock + 1000), 1000);
    } else if (!want && this.tickTimer !== undefined) {
      clearInterval(this.tickTimer);
      this.tickTimer = undefined;
    }
  }

  private setPaused(next: boolean) {
    if (!this.emit<SchedulePausedChange>("tc-paused-change", { paused: next }, { cancelable: true })) return;
    this.paused = next;
    this.announce = next ? this.words.paused : `Resumed ${this.heading}`;
  }
  private open(run: ScheduleRun) {
    this.active = run.id;
    this.emit<ScheduleRunOpen>("tc-run-open", { id: run.id, run });
  }

  private when(ms: number, withDay = true) {
    return formatDate(ms, this.locale, withDay ? { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } : { hour: "2-digit", minute: "2-digit" });
  }
  private runText(run: ScheduleRun) {
    const w = this.words;
    const parts = [w.statuses[run.status] ?? run.status, this.when(run.at)];
    if (run.duration != null) parts.push(run.status === "running" ? `running for ${duration(run.duration)}` : `took ${duration(run.duration)}`);
    if (run.note) parts.push(run.note);
    return parts.join(", ");
  }

  private get stop() {
    const ids = this.shown.map((r) => r.id);
    if (this.active && ids.includes(this.active)) return this.active;
    return ids.at(-1) ?? null;
  }
  private onStripKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-run]");
    if (!btn || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const runs = this.shown;
    const i = runs.findIndex((r) => r.id === btn.dataset.run);
    const to: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: runs.length - 1 };
    if (!(e.key in to)) return;
    e.preventDefault();
    const next = runs[Math.max(0, Math.min(runs.length - 1, to[e.key]))];
    this.active = next.id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-run="${CSS.escape(next.id)}"]`)?.focus());
  };

  private renderNext() {
    const w = this.words;
    if (this.paused) return html`<p class="ui-scd__paused">${pauseIcon()}<span>${w.paused}</span></p>`;
    if (this.nextRun == null) return html`<p class="ui-scd__next"><span class="ui-scd__next-label">${w.noNextRun}</span></p>`;
    const now = this.now ?? this.clock;
    const left = this.nextRun - now;
    return html`<p class="ui-scd__next">
      <span class="ui-scd__next-label">${w.nextRun}</span>
      <time class="ui-scd__next-at" datetime=${new Date(this.nextRun).toISOString()}>${this.when(this.nextRun)}</time>
      ${now ? html`<span class="ui-scd__countdown" data-due=${left <= 0 ? "true" : "false"}>${left <= 0 ? w.due : scheduleCountdown(left)}</span>` : nothing}
    </p>`;
  }

  private renderStrip(id: string) {
    const w = this.words;
    const runs = this.shown;
    if (!runs.length) return html`<p class="ui-scd__none">${w.noRuns}</p>`;
    const stop = this.stop;
    return html`<ul class="ui-scd__strip" aria-labelledby=${`${id}-runs`} aria-describedby=${`${id}-keys`} @keydown=${this.onStripKey}>
      ${repeat(
        runs,
        (r) => r.id,
        (r) => html`<li class="ui-scd__cell">
          <button
            type="button"
            class="ui-scd__run"
            data-run=${r.id}
            data-tone=${pick(TONE, r.status, "skipped")}
            tabindex=${stop === r.id ? 0 : -1}
            @focus=${() => (this.active = r.id)}
            @click=${() => this.open(r)}
            @keydown=${hushTip}
            @pointerenter=${unhushTip}
            @focusin=${unhushTip}
          >
            ${pick(MARK, r.status, "skipped")()}
            <span class="tc-sr-only">${this.runText(r)}</span>
            <span class="ui-scd__tip" aria-hidden="true">
              <span class="ui-scd__tip-status">${w.statuses[r.status] ?? r.status}</span>
              <span>${this.when(r.at)}${r.duration != null ? ` · ${duration(r.duration)}` : ""}</span>
              ${r.note ? html`<span>${r.note}</span>` : nothing}
            </span>
          </button>
        </li>`,
      )}
    </ul>`;
  }

  protected override render() {
    const id = this.uid;
    const w = this.words;
    const runs = this.shown;
    const ok = runs.filter((r) => r.status === "succeeded").length;
    const done = runs.filter((r) => r.status !== "running").length;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      <span class="tc-sr-only" id=${`${id}-keys`}>Left and right arrow keys move between runs; Enter opens one.</span>
      ${cardHead({
        icon: calendarClock,
        title: this.heading,
        subtitle: this.schedule || undefined,
        id: `${id}-title`,
        aside: this.paused ? html`<span class="ui-scd__badge" data-tone="warning">${pauseIcon()}Paused</span>` : nothing,
      })}
      <div class="ui-scd__card">
        ${this.renderNext()}
        <div class="ui-scd__runs">
          <div class="ui-scd__runs-head">
            <span class="ui-scd__runs-label" id=${`${id}-runs`}>${w.lastRuns}</span>
            ${done ? html`<span class="ui-scd__tally">${ok} of ${done} succeeded</span>` : nothing}
          </div>
          ${this.renderStrip(id)}
        </div>
        <div class="ui-scd__actions">
          <button type="button" class="tc-btn-sm ui-scd__run-now" ?disabled=${this.paused} @click=${() => this.emit("tc-run-now", {})}>${playIcon()}${w.runNow}</button>
          <button type="button" class="tc-btn-sm ui-scd__pause" @click=${() => this.setPaused(!this.paused)}>
            ${this.paused ? playIcon() : pauseIcon()}${this.paused ? w.resume : w.pause}
          </button>
          ${this.hideEdit ? nothing : html`<button type="button" class="tc-btn-sm ui-scd__edit" @click=${() => this.emit("tc-edit", {})}>${pencilIcon()}${w.edit}</button>`}
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="scd"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="scd"] {
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
[data-ui="scd"] {
  --tc-scd-mark: 22px;
}
[data-ui="scd"] *, [data-ui="scd"] *::before, [data-ui="scd"] *::after { box-sizing: border-box; }
[data-ui="scd"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="scd"] p { margin: 0; }
[data-ui="scd"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="scd"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-scd__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-scd__card { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
/* Tones */
[data-ui="scd"] [data-tone="success"] { --tc-scd-tone: var(--tc-status-success-fg); --tc-scd-tone-bg: var(--tc-status-success-bg); }
[data-ui="scd"] [data-tone="danger"] { --tc-scd-tone: var(--tc-status-danger-fg); --tc-scd-tone-bg: var(--tc-status-danger-bg); }
[data-ui="scd"] [data-tone="info"] { --tc-scd-tone: var(--tc-status-info-fg); --tc-scd-tone-bg: var(--tc-status-info-bg); }
[data-ui="scd"] [data-tone="warning"] { --tc-scd-tone: var(--tc-status-warning-fg); --tc-scd-tone-bg: var(--tc-status-warning-bg); }
[data-ui="scd"] [data-tone="neutral"] { --tc-scd-tone: var(--tc-text-muted); --tc-scd-tone-bg: var(--tc-fill-default); }
.ui-scd__badge { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; background: var(--tc-scd-tone-bg); color: var(--tc-scd-tone); }
.ui-scd__badge svg { width: 11px; height: 11px; }
/* ----- Next run ----- */
.ui-scd__next { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-scd__next-label { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-scd__next-at { font-size: var(--tc-font-size-lg); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-scd__next-at { font-weight: var(--tc-font-weight-medium); }
.ui-scd__countdown { font-size: var(--tc-font-size-sm); color: var(--tc-accent-text); font-variant-numeric: tabular-nums; }
.ui-scd__countdown[data-due="true"] { color: var(--tc-status-warning-fg); }
.ui-scd__paused { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-sm); }
/* ----- Last runs ----- */
.ui-scd__runs { display: grid; gap: var(--tc-space-2); }
.ui-scd__runs-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); }
.ui-scd__runs-label { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-scd__tally { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-scd__strip { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-scd__cell { position: relative; }
.ui-scd__run { position: relative; display: grid; place-items: center; width: var(--tc-scd-mark); height: var(--tc-control-h-sm); padding: 0; border: 0; border-radius: var(--tc-radius-sm); background: var(--tc-scd-tone-bg); color: var(--tc-scd-tone); cursor: pointer; font: inherit; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-scd__run:hover { box-shadow: inset 0 0 0 1px var(--tc-scd-tone); }
.ui-scd__run:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-scd__run[data-tone="info"] svg { animation: ui-scd-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
@keyframes ui-scd-pulse { 50% { opacity: 0.35; } }
/* The tooltip: under the mark on hover (after a beat) and focus; Escape hides it */
.ui-scd__tip { position: absolute; top: calc(100% + var(--tc-space-1)); left: 50%; z-index: 2; display: grid; gap: var(--tc-space-0-5); width: max-content; max-width: 220px; padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); color: var(--tc-tooltip-fg); font-size: var(--tc-tooltip-font-size); line-height: var(--tc-line-height-snug); text-align: left; white-space: normal; pointer-events: none; opacity: 0; visibility: hidden; transform: translateX(-50%); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), visibility var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-scd__tip-status { font-weight: var(--tc-font-weight-medium); }
.ui-scd__cell:first-child .ui-scd__tip { left: 0; transform: none; }
.ui-scd__cell:last-child .ui-scd__tip { left: auto; right: 0; transform: none; }
.ui-scd__run:hover:not([data-hush]) .ui-scd__tip { opacity: 1; visibility: visible; transition-delay: var(--tc-duration-moderate); }
.ui-scd__run:focus-visible:not([data-hush]) .ui-scd__tip { opacity: 1; visibility: visible; }
.ui-scd__none { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* ----- Actions ----- */
.ui-scd__actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); padding-top: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-scd__actions .tc-btn-sm { gap: var(--tc-space-1-5); }
@container (max-width: 360px) {
  .ui-scd__actions .tc-btn-sm { flex: 1 1 auto; justify-content: center; }
}
@media (forced-colors: active) {
  .ui-scd__run { border: 1px solid CanvasText; }
  .ui-scd__badge, .ui-scd__paused { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="scd"] *, [data-ui="scd"] *::before, [data-ui="scd"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-schedule-card")) customElements.define("tc-schedule-card", TcScheduleCard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-schedule-card": TcScheduleCard;
  }
}

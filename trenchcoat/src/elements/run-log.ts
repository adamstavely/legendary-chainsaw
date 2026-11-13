import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-run-log> – every agent run on one line: its status as a mark and a word, the agent, what started it, when, how
 * long it took, its steps, tokens and cost, and who it ran for. Chips filter by status, agent and trigger, a search
 * matches any text on the line, and a time range keeps the recent ones. A failed run opens in place to its error;
 * Enter opens the run itself (`tc-run-open`). With `live`, runs that arrive after the first render wait above the list
 * behind "Show 3 new runs" – announced, never shifting the rows under the reader – until they're let in.
 *   · the list is one tab stop, a treegrid of rows – a failed run's error is its child row: ↑ / ↓ / Home / End move, Enter opens a run, → / ← or Space show and
 *     hide a failed run's error
 *   · each chip group is one tab stop: ← / → move, Enter or Space toggle
 *   · "Started" is relative ("4 min ago") when `now` is given, and a date and time otherwise – it keeps no clock
 *   · narrow, steps, tokens and user are left out
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-run-log .runs=${[{ id: "r1", status: "failed", agent: "Invoice matcher", trigger: "Webhook", startedAt: 1762412400000, error: "Timed out" }]}></tc-run-log>
 */

export type RunLogStatus = "succeeded" | "failed" | "running" | "queued" | "cancelled";
export type RunLogRun = {
  /** Stable identity */
  id: string;
  status: RunLogStatus;
  agent: string;
  /** What started it: "Schedule", "Webhook", "Manual"… */
  trigger: string;
  /** When it started, epoch ms */
  startedAt: number;
  /** How long it ran, in ms; leave out while running */
  duration?: number;
  steps?: number;
  /** Tokens in and out together */
  tokens?: number;
  cost?: number;
  /** Who it ran for */
  user?: string;
  /** Why a failed run failed – shown when its line opens */
  error?: string;
};
export type RunLogFilter = { status: RunLogStatus[]; agents: string[]; triggers: string[] };
export type RunLogRange = "1h" | "24h" | "7d" | "30d" | "all";
export type RunLogFilterChange = { filter: RunLogFilter };
export type RunLogQueryChange = { query: string };
export type RunLogRangeChange = { range: RunLogRange };
export type RunLogExpandedChange = { expanded: string[]; id: string; open: boolean };
export type RunLogOpen = { id: string; run: RunLogRun };
export type RunLogShowNew = { ids: string[] };
export type RunLogLabels = Record<RunLogStatus, string> &
  Record<RunLogRange, string> &
  Record<
    | "statusCol"
    | "agent"
    | "trigger"
    | "started"
    | "duration"
    | "steps"
    | "tokens"
    | "cost"
    | "user"
    | "statusFilter"
    | "agentFilter"
    | "triggerFilter"
    | "search"
    | "range"
    | "run"
    | "runs"
    | "failedCount"
    | "newRun"
    | "newRuns"
    | "show"
    | "empty"
    | "noMatches"
    | "clear"
    | "error"
    | "noError"
    | "keys",
    string
  >;
export const defaultRunLogLabels: RunLogLabels = {
  succeeded: "Succeeded",
  failed: "Failed",
  running: "Running",
  queued: "Queued",
  cancelled: "Cancelled",
  "1h": "Last hour",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
  statusCol: "Status",
  agent: "Agent",
  trigger: "Trigger",
  started: "Started",
  duration: "Duration",
  steps: "Steps",
  tokens: "Tokens",
  cost: "Cost",
  user: "User",
  statusFilter: "Filter by status",
  agentFilter: "Filter by agent",
  triggerFilter: "Filter by trigger",
  search: "Search runs",
  range: "Time range",
  run: "run",
  runs: "runs",
  failedCount: "failed",
  newRun: "new run",
  newRuns: "new runs",
  show: "Show",
  empty: "No runs yet",
  noMatches: "No runs match",
  clear: "Clear filters",
  error: "Error",
  noError: "No error message was recorded.",
  keys: "Enter opens the run. Right arrow or Space shows a failed run's error.",
};
export const runLogStatuses: RunLogStatus[] = ["succeeded", "failed", "running", "queued", "cancelled"];
export const runLogRanges: RunLogRange[] = ["1h", "24h", "7d", "30d", "all"];
const RANGE_MS: Record<RunLogRange, number> = { "1h": 3_600_000, "24h": 86_400_000, "7d": 604_800_000, "30d": 2_592_000_000, all: Infinity };
const TONES: Record<RunLogStatus, string> = { succeeded: "success", failed: "danger", running: "info", queued: "neutral", cancelled: "neutral" };
const EMPTY_FILTER: RunLogFilter = { status: [], agents: [], triggers: [] };

/** The runs a filter, search and range keep, newest first. `reference` is "now" for the range */
export function filterRuns(runs: RunLogRun[], filter: RunLogFilter, query: string, range: RunLogRange, reference: number) {
  const q = query.trim().toLowerCase();
  return runs
    .filter(
      (r) =>
        (!filter.status.length || filter.status.includes(r.status)) &&
        (!filter.agents.length || filter.agents.includes(r.agent)) &&
        (!filter.triggers.length || filter.triggers.includes(r.trigger)) &&
        (range === "all" || reference - r.startedAt <= RANGE_MS[range]) &&
        (!q || [r.id, r.agent, r.trigger, r.user ?? "", r.error ?? "", r.status].some((t) => t.toLowerCase().includes(q))),
    )
    .sort((a, b) => b.startedAt - a.startedAt);
}

/* After Lucide: activity, search, chevron-right (ISC licence) */
const headIcon = svg`<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>`;
const searchIcon = html`<svg class="ui-runl__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`}</svg>`;
const chevron = html`<svg class="ui-runl__chevron" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m9 18 6-6-6-6"></path>`}</svg>`;
const marks: Record<RunLogStatus, TemplateResult> = {
  succeeded: svg`<path d="M5 12.5 10 17l9-10"></path>`,
  failed: svg`<path d="M7 7l10 10M17 7 7 17"></path>`,
  running: svg`<circle cx="12" cy="12" r="4"></circle>`,
  queued: svg`<circle cx="12" cy="12" r="6"></circle>`,
  cancelled: svg`<path d="M7 17 17 7"></path>`,
};
type ChipGroup = "status" | "agents" | "triggers";

let instances = 0;

/**
 * Every agent run on one line – status, agent, trigger, when, duration, steps, tokens, cost and user – with filters, search, a time range, errors that open in place, and new runs held behind Show new.
 * @tag tc-run-log
 * @fires tc-filter-change - A status, agent or trigger chip was toggled, or the filters cleared ({ filter }: RunLogFilterChange); cancelable – prevented, `filter` stays as it was
 * @fires tc-query-change - The search changed ({ query }: RunLogQueryChange); cancelable – prevented, `query` stays as it was
 * @fires tc-range-change - The time range changed ({ range }: RunLogRangeChange); cancelable – prevented, `range` stays as it was
 * @fires tc-expanded-change - A failed run's error was shown or hidden ({ expanded, id, open }: RunLogExpandedChange); cancelable – prevented, `expanded` stays as it was
 * @fires tc-run-open - A run was opened: Enter on its line, or a click ({ id, run }: RunLogOpen)
 * @fires tc-show-new - Show new let the waiting runs in ({ ids }: RunLogShowNew)
 */
export class TcRunLog extends TcElement {
  static override ui = "runl";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Runs";
  /** Small text under the heading */
  @property() accessor description = "";
  /** The runs, in any order – the list shows the newest first */
  @property({ attribute: false }) accessor runs: RunLogRun[] = [];
  /** The status, agent and trigger chips that are on; an empty list means all */
  @property({ attribute: false }) accessor filter: RunLogFilter = EMPTY_FILTER;
  /** The search text */
  @property() accessor query = "";
  /** How far back runs show, from `now` (or the newest run when `now` isn't given) */
  @property() accessor range: RunLogRange = "all";
  /** The failed runs whose error is open */
  @property({ attribute: false }) accessor expanded: string[] = [];
  /** Holds runs that arrive after the first render behind Show new */
  @property({ type: Boolean, reflect: true }) accessor live = false;
  /** The current time, epoch ms – "Started" reads relative to it; without it, a date and time */
  @property({ type: Number }) accessor now: number | null = null;
  /** ISO 4217 currency code for costs */
  @property() accessor currency = "USD";
  /** Locale for dates, numbers and amounts */
  @property() accessor locale: string | undefined = undefined;
  /** Height in px at which the list scrolls */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 420;
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<RunLogLabels> = {};

  /** @internal The row that holds the tab stop */
  @state() private accessor active: string | null = null;
  /** @internal Each chip group's tab stop */
  @state() private accessor chipStop: Record<ChipGroup, string> = { status: "", agents: "", triggers: "" };
  /** @internal What the status region says */
  @state() private accessor message = "";
  /** @internal Runs in live mode that wait behind Show new */
  @state() private accessor pending: string[] = [];

  private uid = `tc-runl-${++instances}`;
  /** Ids the reader has been shown – live runs not in here wait */
  private seen = new Set<string>();
  private primed = false;
  private visible: RunLogRun[] = [];

  private get words() {
    return { ...defaultRunLogLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("runs")) {
      const ids = this.runs.map((r) => r.id);
      if (!this.primed || !this.live) {
        // Before the first render, or not live: everything shows at once
        this.seen = new Set(ids);
        this.pending = [];
        this.primed = true;
      } else {
        const fresh = ids.filter((id) => !this.seen.has(id) && !this.pending.includes(id));
        const pending = [...this.pending, ...fresh].filter((id) => ids.includes(id));
        if (fresh.length) this.say(pending.length);
        this.pending = pending;
      }
    }
    if (changed.has("live") && !this.live && this.pending.length) {
      for (const id of this.pending) this.seen.add(id);
      this.pending = [];
    }
    const shown = this.runs.filter((r) => this.seen.has(r.id));
    this.visible = filterRuns(shown, this.filter, this.query, this.range, this.reference(shown));
    if (!this.visible.some((r) => r.id === this.active)) this.active = this.visible[0]?.id ?? null;
  }

  private reference(runs: RunLogRun[]) {
    return this.now ?? Math.max(0, ...runs.map((r) => r.startedAt));
  }

  private say(n: number) {
    const words = this.words;
    const text = `${n} ${n === 1 ? words.newRun : words.newRuns}`;
    this.message = this.message === text ? `${text} ` : text;
  }

  /* ---------- formatting ---------- */

  private num(n: number) {
    return new Intl.NumberFormat(this.locale, { notation: n >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
  }
  private money(n: number) {
    const small = n !== 0 && n < 0.01;
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, minimumFractionDigits: small ? 3 : 2, maximumFractionDigits: small ? 3 : 2 }).format(n);
    } catch {
      return n.toFixed(2);
    }
  }
  private time(ms: number) {
    if (ms < 1000) return `${Math.round(ms)} ms`;
    const s = ms / 1000;
    if (s < 60) return `${new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(s)} s`;
    return `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, "0")} s`;
  }
  private started(at: number) {
    if (this.now === null) return new Intl.DateTimeFormat(this.locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(at);
    const diff = (at - this.now) / 1000;
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: "auto" });
    const abs = Math.abs(diff);
    if (abs < 45) return rtf.format(Math.round(diff), "second");
    if (abs < 2700) return rtf.format(Math.round(diff / 60), "minute");
    if (abs < 79_200) return rtf.format(Math.round(diff / 3600), "hour");
    return rtf.format(Math.round(diff / 86_400), "day");
  }

  /* ---------- state changes ---------- */

  private setFilter(filter: RunLogFilter) {
    if (this.emit<RunLogFilterChange>("tc-filter-change", { filter }, { cancelable: true })) this.filter = filter;
  }
  private toggle(group: ChipGroup, value: string) {
    const list = (this.filter[group] as string[]) ?? [];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    this.setFilter({ ...EMPTY_FILTER, ...this.filter, [group]: next });
  }
  private setQuery(query: string) {
    if (query === this.query) return;
    if (this.emit<RunLogQueryChange>("tc-query-change", { query }, { cancelable: true })) this.query = query;
    else this.requestUpdate();
  }
  private setRange(range: RunLogRange) {
    if (range === this.range) return;
    if (this.emit<RunLogRangeChange>("tc-range-change", { range }, { cancelable: true })) this.range = range;
    else this.requestUpdate();
  }
  private setOpen(id: string, open: boolean) {
    if (open === this.expanded.includes(id)) return;
    const expanded = open ? [...this.expanded, id] : this.expanded.filter((e) => e !== id);
    if (this.emit<RunLogExpandedChange>("tc-expanded-change", { expanded, id, open }, { cancelable: true })) this.expanded = expanded;
  }
  private open(run: RunLogRun) {
    this.emit<RunLogOpen>("tc-run-open", { id: run.id, run });
  }
  private showNew() {
    const ids = this.pending;
    for (const id of ids) this.seen.add(id);
    this.pending = [];
    this.emit<RunLogShowNew>("tc-show-new", { ids });
    // The newest run now leads: put the tab stop on it and go there
    this.requestUpdate();
    void this.updateComplete.then(() => {
      const first = this.visible[0];
      if (first) void this.focusRow(first.id);
    });
  }

  /* ---------- keyboard ---------- */

  private async focusRow(id: string) {
    this.active = id;
    await this.updateComplete;
    this.querySelector<HTMLElement>(`.ui-runl__row[data-id="${CSS.escape(id)}"]`)?.focus();
  }

  private onGridKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const list = this.visible;
    const i = list.findIndex((r) => r.id === this.active);
    if (i < 0) return;
    const run = list[i];
    let to: string | undefined;
    switch (e.key) {
      case "ArrowDown":
        to = list[i + 1]?.id;
        break;
      case "ArrowUp":
        to = list[i - 1]?.id;
        break;
      case "Home":
        to = list[0].id;
        break;
      case "End":
        to = list[list.length - 1].id;
        break;
      case "Enter":
        this.open(run);
        break;
      case " ":
        if (run.status !== "failed") return;
        this.setOpen(run.id, !this.expanded.includes(run.id));
        break;
      case "ArrowRight":
        if (run.status !== "failed") return;
        this.setOpen(run.id, true);
        break;
      case "ArrowLeft":
        if (run.status !== "failed") return;
        this.setOpen(run.id, false);
        break;
      default:
        return;
    }
    e.preventDefault();
    if (to) void this.focusRow(to);
  };

  private onChipsKey(group: ChipGroup, values: string[]) {
    return (e: KeyboardEvent) => {
      const i = Math.max(0, values.indexOf(this.chipStop[group] || values[0]));
      const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: values.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      const next = values[(to + values.length) % values.length];
      this.chipStop = { ...this.chipStop, [group]: next };
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-runl__chips[data-group="${group}"] .ui-runl__chip[data-value="${CSS.escape(next)}"]`)?.focus());
    };
  }

  /* ---------- render ---------- */

  private chips(group: ChipGroup, label: string, values: string[], text: (v: string) => string, counts: Map<string, number>) {
    if (values.length < 2 && group !== "status") return nothing;
    const stop = values.includes(this.chipStop[group]) ? this.chipStop[group] : values[0];
    const on = this.filter[group] as string[];
    return html`<div class="ui-runl__chips" role="group" aria-label=${label} data-group=${group} @keydown=${this.onChipsKey(group, values)}>
      ${values.map(
        (v) => html`<button
          type="button"
          class="ui-runl__chip"
          data-value=${v}
          data-tone=${group === "status" ? TONES[v as RunLogStatus] : nothing}
          aria-pressed=${on.includes(v) ? "true" : "false"}
          tabindex=${v === stop ? 0 : -1}
          @click=${() => {
            this.chipStop = { ...this.chipStop, [group]: v };
            this.toggle(group, v);
          }}
        >
          ${group === "status" ? html`<svg class="ui-runl__mark" viewBox="0 0 24 24" aria-hidden="true">${marks[v as RunLogStatus]}</svg>` : nothing}${text(v)}
          <span class="ui-runl__chip-count">${counts.get(v) ?? 0}</span>
        </button>`,
      )}
    </div>`;
  }

  private row(r: RunLogRun) {
    const words = this.words;
    const status = TONES[r.status] ? r.status : "queued";
    const failed = status === "failed";
    const open = failed && this.expanded.includes(r.id);
    const errorId = `${this.uid}-err-${r.id}`;
    return html`<div
        class="ui-runl__row"
        role="row"
        aria-level="1"
        data-id=${r.id}
        data-tone=${TONES[status]}
        aria-expanded=${ifDefined(failed ? (open ? "true" : "false") : undefined)}
        aria-controls=${open ? errorId : nothing}
        aria-describedby=${`${this.uid}-keys`}
        tabindex=${r.id === this.active ? 0 : -1}
        @click=${(e: MouseEvent) => {
          this.active = r.id;
          if (failed && (e.target as Element).closest(".ui-runl__toggle")) this.setOpen(r.id, !open);
          else this.open(r);
        }}
      >
        <span class="ui-runl__cell ui-runl__status" role="gridcell">
          ${failed ? html`<span class="ui-runl__toggle" aria-hidden="true">${chevron}</span>` : html`<span class="ui-runl__toggle-space" aria-hidden="true"></span>`}
          <svg class="ui-runl__mark" viewBox="0 0 24 24" aria-hidden="true">${marks[status]}</svg>${words[status]}
        </span>
        <span class="ui-runl__cell ui-runl__agent" role="gridcell">${r.agent}</span>
        <span class="ui-runl__cell ui-runl__trigger" role="gridcell">${r.trigger}</span>
        <span class="ui-runl__cell ui-runl__started" role="gridcell"><time datetime=${new Date(r.startedAt).toISOString()}>${this.started(r.startedAt)}</time></span>
        <span class="ui-runl__cell ui-runl__duration ui-runl__num" role="gridcell">${r.duration === undefined ? "–" : this.time(r.duration)}</span>
        <span class="ui-runl__cell ui-runl__steps ui-runl__num" role="gridcell">${r.steps === undefined ? "–" : this.num(r.steps)}</span>
        <span class="ui-runl__cell ui-runl__tokens ui-runl__num" role="gridcell">${r.tokens === undefined ? "–" : this.num(r.tokens)}</span>
        <span class="ui-runl__cell ui-runl__cost ui-runl__num" role="gridcell">${r.cost === undefined ? "–" : this.money(r.cost)}</span>
        <span class="ui-runl__cell ui-runl__user" role="gridcell">${r.user ?? "–"}</span>
      </div>
      ${open
        ? html`<div class="ui-runl__error-row" role="row" aria-level="2" id=${errorId}>
            <div class="ui-runl__error" role="gridcell" aria-colspan="9"><span class="ui-runl__error-label">${words.error}</span> <span class="ui-runl__error-text">${r.error || words.noError}</span></div>
          </div>`
        : nothing}`;
  }

  protected override render() {
    const words = this.words;
    const shown = this.runs.filter((r) => this.seen.has(r.id));
    const list = this.visible;
    const agents = [...new Set(shown.map((r) => r.agent))].sort();
    const triggers = [...new Set(shown.map((r) => r.trigger))].sort();
    const count = (key: "status" | "agent" | "trigger") => {
      const m = new Map<string, number>();
      for (const r of shown) m.set(r[key], (m.get(r[key]) ?? 0) + 1);
      return m;
    };
    const failed = list.filter((r) => r.status === "failed").length;
    const cost = list.reduce((n, r) => n + (r.cost ?? 0), 0);
    const filtered = this.filter.status.length + this.filter.agents.length + this.filter.triggers.length > 0 || !!this.query.trim() || this.range !== "all";
    const n = list.length;
    const p = this.pending.length;
    const aside = failed ? html`<span class="ui-runl__failed">${failed} ${words.failedCount}</span>` : nothing;
    const columns = ["statusCol", "agent", "trigger", "started", "duration", "steps", "tokens", "cost", "user"] as const;
    const colClass = { statusCol: "status", agent: "agent", trigger: "trigger", started: "started", duration: "duration ui-runl__num", steps: "steps ui-runl__num", tokens: "tokens ui-runl__num", cost: "cost ui-runl__num", user: "user" };
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside }) : nothing}
      <div class="ui-runl__card">
        <div class="ui-runl__tools">
          <label class="ui-runl__search">
            ${searchIcon}<span class="tc-sr-only">${words.search}</span>
            <input type="search" class="ui-runl__query" .value=${this.query} placeholder=${words.search} @input=${(e: Event) => this.setQuery((e.target as HTMLInputElement).value)} />
          </label>
          <label class="ui-runl__range-label">
            <span class="tc-sr-only">${words.range}</span>
            <select class="ui-runl__range" @change=${(e: Event) => this.setRange((e.target as HTMLSelectElement).value as RunLogRange)}>
              ${runLogRanges.map((r) => html`<option value=${r} ?selected=${r === this.range}>${words[r]}</option>`)}
            </select>
          </label>
        </div>
        <div class="ui-runl__filters">
          ${this.chips("status", words.statusFilter, runLogStatuses.filter((s) => count("status").has(s) || this.filter.status.includes(s)), (s) => words[s as RunLogStatus], count("status"))}
          ${this.chips("agents", words.agentFilter, agents, (a) => a, count("agent"))}
          ${this.chips("triggers", words.triggerFilter, triggers, (t) => t, count("trigger"))}
        </div>
        ${p ? html`<button type="button" class="ui-runl__new" @click=${() => this.showNew()}>${words.show} ${p} ${p === 1 ? words.newRun : words.newRuns}</button>` : nothing}
        ${n
          ? html`<div class="ui-runl__grid" role="treegrid" aria-labelledby=${this.heading ? `${this.uid}-title` : nothing} aria-label=${this.heading ? nothing : words.runs} aria-rowcount=${n + 1} @keydown=${this.onGridKey}>
              <div class="ui-runl__head" role="row">${columns.map((c) => html`<span class=${`ui-runl__cell ui-runl__${colClass[c]}`} role="columnheader">${words[c]}</span>`)}</div>
              <div class="ui-runl__scroll" role="rowgroup" style=${styleMap({ maxHeight: `${this.maxHeight}px` })}>${list.map((r) => this.row(r))}</div>
            </div>`
          : html`<div class="ui-runl__empty">
              <p>${shown.length ? words.noMatches : words.empty}</p>
              ${shown.length && filtered
                ? html`<button
                    type="button"
                    class="tc-btn-sm ui-runl__clear"
                    @click=${() => {
                      this.setFilter(EMPTY_FILTER);
                      this.setQuery("");
                      this.setRange("all");
                    }}
                  >${words.clear}</button>`
                : nothing}
            </div>`}
        <div class="ui-runl__foot">
          <span>${n === shown.length ? this.num(n) : `${this.num(n)} / ${this.num(shown.length)}`} ${shown.length === 1 ? words.run : words.runs}</span>
          ${failed ? html`<span aria-hidden="true">·</span><span>${failed} ${words.failedCount}</span>` : nothing}
          <span aria-hidden="true">·</span><span>${this.money(cost)}</span>
        </div>
      </div>
      <span class="tc-sr-only" id=${`${this.uid}-keys`}>${words.keys}</span>
      <span class="tc-sr-only" role="status">${this.message}</span>`;
  }

  static override css = /* css */ `
[data-ui="runl"] {
  box-sizing: border-box;
  display: block;
  min-width: 0;
  width: 100%;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
  --tc-runl-cols: 7.5rem minmax(6rem, 1.4fr) minmax(5rem, 1fr) 6.5rem 4.5rem 3.5rem 4rem 4.5rem minmax(4rem, 1fr);
  --tc-runl-cols-narrow: 6.5rem minmax(0, 1fr) 5.5rem 4.5rem;
  --tc-runl-icon: 14px;
}
[data-ui="runl"] *, [data-ui="runl"] *::before, [data-ui="runl"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="runl"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="runl"] .ui-runl__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="runl"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-runl__card { overflow: hidden; }
.ui-runl__failed { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-runl__tools { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); padding: var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-runl__search { display: flex; flex: 1 1 12rem; align-items: center; gap: var(--tc-space-1-5); min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: var(--tc-hairline) solid var(--tc-border-control); border-radius: var(--tc-control-radius-sm); background: var(--tc-surface-raised); color: var(--tc-icon-muted); }
.ui-runl__search:focus-within { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-runl__query { flex: 1; min-width: 0; margin: 0; padding: 0; border: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-sm); outline: none; }
.ui-runl__query::placeholder { color: var(--tc-text-placeholder); }
.ui-runl__range { height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: var(--tc-hairline) solid var(--tc-border-control); border-radius: var(--tc-control-radius-sm); background: var(--tc-surface-raised); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-sm); }
.ui-runl__range:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-runl__filters { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-runl__filters:not(:has(.ui-runl__chips)) { display: none; }
.ui-runl__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-runl__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0 var(--tc-space-2);
  border: var(--tc-hairline) solid var(--tc-border-default);
  border-radius: var(--tc-pill-radius);
  background: none;
  color: var(--tc-text-secondary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-runl__chip:hover { background: var(--tc-fill-subtle); }
.ui-runl__chip[aria-pressed="true"] { border-color: var(--tc-border-selected); background: var(--tc-fill-selected); color: var(--tc-text-primary); }
.ui-runl__chip-count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-runl__chip:focus-visible, .ui-runl__new:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-runl__new {
  display: block;
  width: 100%;
  margin: 0;
  padding: var(--tc-space-1-5) var(--tc-space-3);
  border: 0;
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
  background: var(--tc-accent-subtle);
  color: var(--tc-accent-text);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  text-align: center;
  cursor: pointer;
}
.ui-runl__head, .ui-runl__row { display: grid; grid-template-columns: var(--tc-runl-cols); align-items: center; gap: var(--tc-space-2); padding: 0 var(--tc-space-3); }
.ui-runl__head { min-height: var(--tc-control-h-sm); border-bottom: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-runl__scroll { overflow: auto; overscroll-behavior: contain; }
.ui-runl__row { min-height: var(--tc-control-h-md); padding-top: var(--tc-space-1); padding-bottom: var(--tc-space-1); border-bottom: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); cursor: pointer; }
.ui-runl__row:hover { background: var(--tc-fill-subtle); }
.ui-runl__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-runl__cell { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-runl__num { font-variant-numeric: tabular-nums; text-align: right; }
.ui-runl__status { display: flex; align-items: center; gap: var(--tc-space-1); font-weight: var(--tc-font-weight-medium); }
.ui-runl__mark { width: var(--tc-runl-icon); height: var(--tc-runl-icon); flex: none; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.ui-runl__row[data-tone="success"] .ui-runl__status, .ui-runl__chip[data-tone="success"] .ui-runl__mark { color: var(--tc-status-success-fg); }
.ui-runl__row[data-tone="danger"] .ui-runl__status, .ui-runl__chip[data-tone="danger"] .ui-runl__mark { color: var(--tc-status-danger-fg); }
.ui-runl__row[data-tone="info"] .ui-runl__status, .ui-runl__chip[data-tone="info"] .ui-runl__mark { color: var(--tc-status-info-fg); }
.ui-runl__row[data-tone="neutral"] .ui-runl__status { color: var(--tc-text-secondary); }
.ui-runl__row[data-tone="info"] .ui-runl__mark { fill: currentColor; }
.ui-runl__toggle, .ui-runl__toggle-space { display: grid; flex: none; place-items: center; width: var(--tc-runl-icon); height: var(--tc-runl-icon); color: var(--tc-icon-muted); }
.ui-runl__chevron { width: var(--tc-runl-icon); height: var(--tc-runl-icon); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-runl__row[aria-expanded="true"] .ui-runl__chevron { transform: rotate(90deg); }
.ui-runl__glyph { width: var(--tc-runl-icon); height: var(--tc-runl-icon); flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.ui-runl__agent { font-weight: var(--tc-font-weight-medium); }
.ui-runl__trigger, .ui-runl__started, .ui-runl__duration, .ui-runl__steps, .ui-runl__tokens, .ui-runl__user { color: var(--tc-text-secondary); }
.ui-runl__error-row { border-bottom: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-status-danger-bg); }
.ui-runl__error { padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2) var(--tc-space-8); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); overflow-wrap: anywhere; }
.ui-runl__error-label { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-runl__error-text { font-family: var(--tc-font-mono); }
.ui-runl__empty { display: grid; justify-items: center; gap: var(--tc-space-2); padding: var(--tc-space-6) var(--tc-space-3); color: var(--tc-text-muted); text-align: center; }
.ui-runl__empty p { margin: 0; }
.ui-runl__foot { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: var(--tc-space-1-5) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
@container (max-width: 560px) {
  .ui-runl__head, .ui-runl__row { grid-template-columns: var(--tc-runl-cols-narrow); }
  .ui-runl__trigger, .ui-runl__steps, .ui-runl__tokens, .ui-runl__user, .ui-runl__duration { display: none; }
  .ui-runl__error { padding-left: var(--tc-space-3); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="runl"] *, [data-ui="runl"] *::before, [data-ui="runl"] *::after { transition: none !important; }
}
@media (forced-colors: active) {
  .ui-runl__mark { stroke: CanvasText; }
  .ui-runl__chip[aria-pressed="true"] { border-color: Highlight; }
}
`;
}

if (!customElements.get("tc-run-log")) customElements.define("tc-run-log", TcRunLog);
declare global {
  interface HTMLElementTagNameMap {
    "tc-run-log": TcRunLog;
  }
}

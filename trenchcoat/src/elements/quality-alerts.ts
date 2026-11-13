import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";

/*
 * <tc-quality-alerts> – alert rules for a production agent's quality, each written as a sentence with the choices in
 * it: "Alert [#ops-quality] when [Correctness] [drops below] [3.5] over [24 hours] on at least [50] chats". Every slot
 * is a native select or number field with its own label, so the sentence works with a keyboard and a screen reader.
 * Each rule has an on/off switch, when it last fired, and how often it would have fired in the last 30 days (the page
 * works that out and passes it as `preview`). Add rule and Remove change the list. A value that can't work – a
 * threshold outside the metric's scale, fewer than one chat – is said in words under the sentence, and isn't kept.
 *   · `rules` is controllable: every change fires a cancelable tc-rules-change with the whole list
 *   · times are epoch ms; relative times need `now`, otherwise dates are shown – the element keeps no clock
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-quality-alerts .channels=${[{ id: "ops", label: "#ops-quality" }]} .metrics=${[{ id: "correct", label: "Correctness", min: 1, max: 5 }]}
 *     .rules=${[{ id: "r1", channel: "ops", metric: "correct", comparison: "below", threshold: 3.5, window: "24h", minChats: 50, enabled: true }]}></tc-quality-alerts>
 */

/** A bell with a pulse: Lucide "bell-ring" (ISC, lucide.dev) */
const bellIcon = svg`<path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M22 8c0-2.3-.8-4.3-2-6"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path><path d="M4 2C2.8 3.7 2 5.7 2 8"></path>`;
/** Trash: Lucide "trash-2" (ISC) */
const trashIcon = svg`<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>`;

export type QualityAlertComparison = "below" | "drops-by" | "above";
export type QualityAlertOption = { id: string; label: string };
export type QualityAlertMetric = QualityAlertOption & {
  /** The scale's lowest value (default 0) */
  min?: number;
  /** The scale's highest value (default 5) */
  max?: number;
  /** The threshold field's step (default 0.1) */
  step?: number;
};
export type QualityAlertRule = {
  id: string;
  /** Where the alert goes – a channel's id */
  channel: string;
  /** What's watched – a metric's id */
  metric: string;
  comparison: QualityAlertComparison;
  /** The level, or for "drops-by" the size of the drop */
  threshold: number;
  /** Over how long – a window's id */
  window: string;
  /** Fires only when at least this many chats were judged in the window */
  minChats: number;
  enabled: boolean;
  /** When it last fired, epoch ms */
  lastTriggered?: number;
  /** How many times it would have fired in the last 30 days, worked out by the page; undefined while unknown */
  preview?: number;
};

export type QualityAlertsChange = { rules: QualityAlertRule[]; id: string; change: "edit" | "add" | "remove" | "toggle" };

export type QualityAlertsLabels = {
  alert: string;
  when: string;
  over: string;
  atLeast: string;
  chats: string;
  channel: string;
  metric: string;
  comparison: string;
  threshold: string;
  window: string;
  minChats: string;
  on: string;
  add: string;
  remove: string;
  never: string;
  empty: string;
  comparisons: Record<QualityAlertComparison, string>;
};
export const defaultQualityAlertsLabels: QualityAlertsLabels = {
  alert: "Alert",
  when: "when",
  over: "over",
  atLeast: "on at least",
  chats: "chats",
  channel: "Channel",
  metric: "Metric",
  comparison: "Comparison",
  threshold: "Threshold",
  window: "Window",
  minChats: "Minimum chats",
  on: "On",
  add: "Add rule",
  remove: "Remove",
  never: "Hasn't fired yet",
  empty: "No alert rules yet. Add one to hear when quality drops.",
  comparisons: { below: "drops below", "drops-by": "falls by more than", above: "rises above" },
};

const COMPARISONS: QualityAlertComparison[] = ["below", "drops-by", "above"];
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
let uidCount = 0;
let ruleCount = 0;

/** What's wrong with a rule, in words; "" when it can work */
export function qualityAlertProblem(rule: QualityAlertRule, metric: QualityAlertMetric | undefined, labels: Pick<QualityAlertsLabels, "chats"> = defaultQualityAlertsLabels) {
  if (!metric) return "Choose what to watch.";
  const lo = metric.min ?? 0;
  const hi = metric.max ?? 5;
  if (!Number.isFinite(rule.threshold)) return "Enter a threshold.";
  if (rule.comparison === "drops-by") {
    if (rule.threshold <= 0 || rule.threshold > hi - lo) return `A drop must be more than 0 and at most ${hi - lo}.`;
  } else if (rule.threshold < lo || rule.threshold > hi) return `${metric.label} runs from ${lo} to ${hi}; choose a threshold in that range.`;
  if (!Number.isInteger(rule.minChats) || rule.minChats < 1) return `The minimum must be a whole number of ${labels.chats}, at least 1.`;
  return "";
}

/** The rule as a sentence: "Alert #ops-quality when Correctness drops below 3.5 over 24 hours on at least 50 chats" */
export function qualityAlertSentence(
  rule: QualityAlertRule,
  options: { channels: QualityAlertOption[]; metrics: QualityAlertMetric[]; windows: QualityAlertOption[]; labels?: QualityAlertsLabels; locale?: string },
) {
  const l = options.labels ?? defaultQualityAlertsLabels;
  const name = (list: QualityAlertOption[], id: string) => list.find((o) => o.id === id)?.label ?? id;
  const n = new Intl.NumberFormat(options.locale, { maximumFractionDigits: 2 });
  return `${l.alert} ${name(options.channels, rule.channel)} ${l.when} ${name(options.metrics, rule.metric)} ${l.comparisons[rule.comparison]} ${n.format(rule.threshold)} ${l.over} ${name(options.windows, rule.window)} ${l.atLeast} ${n.format(rule.minChats)} ${l.chats}`;
}

/**
 * Alert rules for an agent's quality, written as sentences with the choices in them – each with an on/off switch,
 * when it last fired and how often it would have fired in the last 30 days; add and remove rules.
 * @tag tc-quality-alerts
 * @fires tc-rules-change - A rule was edited, added, removed or switched ({ rules, id, change }: QualityAlertsChange); cancelable – prevented, `rules` stays as it was
 */
export class TcQualityAlerts extends TcElement {
  static override ui = "qal";

  /** The heading */
  @property() accessor heading = "Quality alerts";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The rules. Changed by the user unless a tc-rules-change listener calls preventDefault() */
  @property({ attribute: false }) accessor rules: QualityAlertRule[] = [];
  /** Where alerts can go */
  @property({ attribute: false }) accessor channels: QualityAlertOption[] = [];
  /** What can be watched, with each metric's scale */
  @property({ attribute: false }) accessor metrics: QualityAlertMetric[] = [];
  /** The windows a rule can look over, e.g. { id: "24h", label: "24 hours" } */
  @property({ attribute: false }) accessor windows: QualityAlertOption[] = [];
  /** "Now" for when rules last fired, epoch ms; unset, dates are shown instead */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The words used, merged over the defaults */
  @property({ attribute: false }) accessor labels: Partial<QualityAlertsLabels> = {};
  /** The language for numbers and dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor status = "";
  /** Number fields holding a value that can't be kept, by rule id and field: what was typed and why it's wrong */
  @state() private accessor drafts: ReadonlyMap<string, { field: "threshold" | "minChats"; text: string; problem: string }> = new Map();

  private uid = `tc-qal-${++uidCount}`;

  private get l(): QualityAlertsLabels {
    return { ...defaultQualityAlertsLabels, ...this.labels, comparisons: { ...defaultQualityAlertsLabels.comparisons, ...this.labels.comparisons } };
  }
  private metricOf(rule: QualityAlertRule) {
    return this.metrics.find((m) => m.id === rule.metric);
  }
  private num(n: number) {
    return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 2 }).format(n);
  }
  private sentence(rule: QualityAlertRule) {
    return qualityAlertSentence(rule, { channels: this.channels, metrics: this.metrics, windows: this.windows, labels: this.l, locale: this.locale });
  }

  /* ---------- Changes ---------- */

  private commit(rules: QualityAlertRule[], id: string, change: QualityAlertsChange["change"]) {
    // Prevented, the fields go back to what the rules still say
    if (!this.emit<QualityAlertsChange>("tc-rules-change", { rules, id, change }, { cancelable: true })) {
      this.requestUpdate();
      return false;
    }
    this.rules = rules;
    return true;
  }
  private edit(rule: QualityAlertRule, patch: Partial<QualityAlertRule>) {
    // An edit makes the page's preview stale: it's dropped until the page sends a new one
    const next = { ...rule, ...patch, preview: undefined };
    this.commit(
      this.rules.map((r) => (r.id === rule.id ? next : r)),
      rule.id,
      "edit",
    );
  }
  private toggle(rule: QualityAlertRule) {
    const enabled = !rule.enabled;
    if (this.commit(this.rules.map((r) => (r.id === rule.id ? { ...r, enabled } : r)), rule.id, "toggle"))
      this.status = `${enabled ? "Turned on" : "Turned off"}: ${this.sentence(rule)}`;
  }
  private removeRule(rule: QualityAlertRule) {
    const i = this.rules.findIndex((r) => r.id === rule.id);
    const rules = this.rules.filter((r) => r.id !== rule.id);
    if (!this.commit(rules, rule.id, "remove")) return;
    this.status = `Rule removed: ${this.sentence(rule)}`;
    // The focus goes to the next rule's first field, the previous one's, or Add rule
    const to = rules[Math.min(i, rules.length - 1)];
    void this.updateComplete.then(() => (to ? this.querySelector<HTMLElement>(`[data-rule="${CSS.escape(to.id)}"] select`) : this.querySelector<HTMLElement>(".ui-qal__add"))?.focus());
  }
  private addRule() {
    const metric = this.metrics[0];
    const lo = metric?.min ?? 0;
    const hi = metric?.max ?? 5;
    const rule: QualityAlertRule = {
      id: `${this.uid}-rule-${++ruleCount}`,
      channel: this.channels[0]?.id ?? "",
      metric: metric?.id ?? "",
      comparison: "below",
      threshold: Math.round((lo + (hi - lo) * 0.7) * 10) / 10,
      window: this.windows[0]?.id ?? "",
      minChats: 50,
      enabled: true,
    };
    if (!this.commit([...this.rules, rule], rule.id, "add")) return;
    this.status = `Rule added: ${this.sentence(rule)}`;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-rule="${CSS.escape(rule.id)}"] select`)?.focus());
  }
  private onNumber(rule: QualityAlertRule, field: "threshold" | "minChats", input: HTMLInputElement) {
    const value = input.value.trim() === "" ? NaN : input.valueAsNumber;
    const candidate = { ...rule, [field]: value };
    const problem = !Number.isFinite(value) ? (field === "threshold" ? "Enter a threshold." : "Enter how many chats.") : qualityAlertProblem(candidate, this.metricOf(rule), this.l);
    const drafts = new Map(this.drafts);
    if (problem) {
      drafts.set(rule.id, { field, text: input.value, problem });
      this.drafts = drafts;
      return;
    }
    drafts.delete(rule.id);
    this.drafts = drafts;
    this.edit(rule, { [field]: value });
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // Drafts for rules that are gone go too
    if (changed.has("rules") && this.drafts.size) {
      const ids = new Set(this.rules.map((r) => r.id));
      if ([...this.drafts.keys()].some((k) => !ids.has(k))) this.drafts = new Map([...this.drafts].filter(([k]) => ids.has(k)));
    }
  }

  /* ---------- Rendering ---------- */

  private last(rule: QualityAlertRule) {
    const at = rule.lastTriggered;
    if (at === undefined || !Number.isFinite(at)) return this.l.never;
    if (this.now === undefined) return `Last fired ${formatDate(at, this.locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
    const diff = Math.max(0, this.now - at);
    const ago = diff < HOUR ? `${Math.max(1, Math.round(diff / MIN))}m ago` : diff < DAY ? `${Math.floor(diff / HOUR)}h ago` : `${Math.floor(diff / DAY)}d ago`;
    return `Last fired ${ago}`;
  }
  private preview(rule: QualityAlertRule) {
    const p = rule.preview;
    if (p === undefined || !Number.isFinite(p)) return "";
    if (p === 0) return "Wouldn't have fired in the last 30 days";
    return `Would have fired ${p === 1 ? "once" : `${this.num(p)} times`} in the last 30 days`;
  }
  private select(rule: QualityAlertRule, field: "channel" | "metric" | "comparison" | "window", label: string, options: QualityAlertOption[], invalid = false) {
    const id = `${this.uid}-${rule.id}-${field}`;
    const value = rule[field];
    const known = options.some((o) => o.id === value);
    return html`<span class="ui-qal__slot">
      <label class="ui-qal__sr" for=${id}>${label}</label>
      <select
        id=${id}
        class="ui-qal__select"
        data-field=${field}
        aria-invalid=${invalid ? "true" : "false"}
        @change=${(e: Event) => this.edit(rule, { [field]: (e.target as HTMLSelectElement).value } as Partial<QualityAlertRule>)}
      >
        ${known ? nothing : html`<option value="" .selected=${true} disabled>Choose…</option>`}
        ${options.map((o) => html`<option value=${o.id} .selected=${live(o.id === value)}>${o.label}</option>`)}
      </select>
      <svg class="ui-qal__caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
    </span>`;
  }
  private number(rule: QualityAlertRule, field: "threshold" | "minChats", label: string, problemId: string) {
    const id = `${this.uid}-${rule.id}-${field}`;
    const metric = this.metricOf(rule);
    const draft = this.drafts.get(rule.id);
    const mine = draft?.field === field ? draft : undefined;
    const step = field === "threshold" ? (metric?.step ?? 0.1) : 1;
    return html`<span class="ui-qal__slot">
      <label class="ui-qal__sr" for=${id}>${label}</label>
      <input
        id=${id}
        class="ui-qal__number"
        data-field=${field}
        type="number"
        inputmode=${field === "threshold" ? "decimal" : "numeric"}
        step=${step}
        min=${field === "minChats" ? 1 : (metric?.min ?? 0)}
        .value=${live(mine ? mine.text : String(rule[field]))}
        aria-invalid=${mine ? "true" : "false"}
        aria-describedby=${mine ? problemId : nothing}
        @change=${(e: Event) => this.onNumber(rule, field, e.target as HTMLInputElement)}
      />
    </span>`;
  }

  private renderRule(rule: QualityAlertRule, n: number) {
    const l = this.l;
    const id = `${this.uid}-${rule.id}`;
    const draft = this.drafts.get(rule.id);
    const problem = draft?.problem || qualityAlertProblem(rule, this.metricOf(rule), l);
    const preview = this.preview(rule);
    const comparisons = COMPARISONS.map((c) => ({ id: c, label: l.comparisons[c] }));
    return html`<li class="ui-qal__rule" data-rule=${rule.id} ?data-off=${!rule.enabled} ?data-invalid=${!!problem}>
      <fieldset class="ui-qal__set" aria-describedby=${`${id}-sentence ${id}-facts`}>
        <legend class="ui-qal__sr">Rule ${n}</legend>
        <span class="ui-qal__sr" id=${`${id}-sentence`}>${this.sentence(rule)}</span>
        <p class="ui-qal__sentence">
          <span class="ui-qal__word">${l.alert}</span>
          ${this.select(rule, "channel", l.channel, this.channels)}
          <span class="ui-qal__word">${l.when}</span>
          ${this.select(rule, "metric", l.metric, this.metrics, !this.metricOf(rule))}
          ${this.select(rule, "comparison", l.comparison, comparisons)}
          ${this.number(rule, "threshold", l.threshold, `${id}-problem`)}
          <span class="ui-qal__word">${l.over}</span>
          ${this.select(rule, "window", l.window, this.windows)}
          <span class="ui-qal__word">${l.atLeast}</span>
          ${this.number(rule, "minChats", l.minChats, `${id}-problem`)}
          <span class="ui-qal__word">${l.chats}</span>
        </p>
        ${problem
          ? html`<p class="ui-qal__problem" id=${`${id}-problem`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v4.5M12 16h.01"></path></svg>${problem}</p>`
          : nothing}
        <div class="ui-qal__foot">
          <span class="ui-qal__facts" id=${`${id}-facts`}>${[rule.enabled ? "" : "Off", this.last(rule), preview].filter(Boolean).join(" · ")}</span>
          <button type="button" role="switch" class="ui-qal__switch" aria-checked=${rule.enabled ? "true" : "false"} aria-describedby=${`${id}-sentence`} @click=${() => this.toggle(rule)}>
            <span class="ui-qal__track" aria-hidden="true"><span class="ui-qal__knob"></span></span>
            <span>${l.on}</span>
          </button>
          <button type="button" class="ui-qal__remove" @click=${() => this.removeRule(rule)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${trashIcon}</svg>
            <span>${l.remove}</span><span class="ui-qal__sr"> rule ${n}</span>
          </button>
        </div>
      </fieldset>
    </li>`;
  }

  protected override render() {
    const l = this.l;
    const on = this.rules.filter((r) => r.enabled).length;
    return html`
      <span class="ui-qal__sr" role="status">${this.status}</span>
      ${cardHead({
        icon: bellIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: this.rules.length ? html`<span class="ui-qal__count">${this.rules.length} ${this.rules.length === 1 ? "rule" : "rules"} · ${on} on</span>` : nothing,
      })}
      <div class="ui-qal__card">
        ${this.rules.length
          ? html`<ol class="ui-qal__list" aria-labelledby=${`${this.uid}-title`}>
              ${repeat(this.rules, (r) => r.id, (r, i) => this.renderRule(r, i + 1))}
            </ol>`
          : html`<p class="ui-qal__empty">${l.empty}</p>`}
        <div class="ui-qal__bar">
          <button type="button" class="ui-qal__add" @click=${() => this.addRule()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
            ${l.add}
          </button>
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="qal"] {
  position: relative; box-sizing: border-box; width: 100%; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); text-align: left; -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="qal"] {
  position: relative; box-sizing: border-box; width: 100%; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="qal"] { --tc-qal-number-w: 7ch; }
[data-ui="qal"] *, [data-ui="qal"] *::before, [data-ui="qal"] *::after { box-sizing: border-box; }
[data-ui="qal"] :is(p, fieldset) { margin: 0; }
[data-ui="qal"] fieldset { min-width: 0; padding: 0; border: 0; }
[data-ui="qal"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="qal"] svg { display: block; flex: none; }
:where([data-ui="qal"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="qal"] :is(button, select, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-qal__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-qal__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-qal__count { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-qal__list { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-3) 0 !important; }
.ui-qal__rule { padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-qal__rule[data-off] { background: var(--tc-fill-subtle); }
.ui-qal__rule[data-invalid] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-border); }
.ui-qal__set { display: grid; gap: var(--tc-space-2-5); }
/* ----- The sentence: words and slots on one flowing line ----- */
.ui-qal__sentence { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-qal__rule[data-off] .ui-qal__sentence { color: var(--tc-text-secondary); }
.ui-qal__word { white-space: nowrap; }
.ui-qal__slot { position: relative; display: inline-flex; }
.ui-qal__select, .ui-qal__number {
  height: var(--tc-field-h-sm); margin: 0; border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow);
  font: inherit; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary);
}
.ui-qal__select { padding: 0 var(--tc-space-7) 0 var(--tc-space-2-5); appearance: none; cursor: pointer; }
.ui-qal__number { width: var(--tc-qal-number-w); padding: 0 var(--tc-space-2); font-variant-numeric: tabular-nums; }
.ui-qal__select:hover, .ui-qal__number:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-qal__select:focus, .ui-qal__number:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-qal__select[aria-invalid="true"], .ui-qal__number[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-qal__caret { position: absolute; top: 50%; right: var(--tc-space-2); width: var(--tc-space-3-5); height: var(--tc-space-3-5); color: var(--tc-icon-muted); transform: translateY(-50%); pointer-events: none; }
.ui-qal__problem { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-warning-fg); }
.ui-qal__problem svg { width: var(--tc-space-4); height: var(--tc-space-4); margin-top: var(--tc-space-0-5); }
/* ----- The foot: last fired, preview, the switch and Remove ----- */
.ui-qal__foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-qal__facts { flex: 1; min-width: 0; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-qal__switch { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1-5) !important; border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-qal__switch:hover { background: var(--tc-fill-hover); }
.ui-qal__track { position: relative; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-qal__knob { position: absolute; top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-qal__switch[aria-checked="true"] .ui-qal__track { background: var(--tc-switch-on); }
.ui-qal__switch[aria-checked="true"] .ui-qal__knob { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-qal__remove { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1-5) !important; border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-qal__remove:hover { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-qal__remove svg { width: var(--tc-space-3-5); height: var(--tc-space-3-5); }
.ui-qal__bar { padding: var(--tc-space-3); }
.ui-qal__add { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg) !important; box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); }
.ui-qal__add:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-qal__add svg { width: var(--tc-space-3-5); height: var(--tc-space-3-5); }
.ui-qal__empty { padding: var(--tc-space-6) var(--tc-space-4) var(--tc-space-2) !important; color: var(--tc-text-muted); text-align: center; }
@media (forced-colors: active) {
  .ui-qal__rule { border: 1px solid CanvasText; }
  .ui-qal__track { border: 1px solid CanvasText; }
  .ui-qal__knob { background: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="qal"] *, [data-ui="qal"] *::before, [data-ui="qal"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-quality-alerts")) customElements.define("tc-quality-alerts", TcQualityAlerts);

declare global {
  interface HTMLElementTagNameMap {
    "tc-quality-alerts": TcQualityAlerts;
  }
}

import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-data-region> – where a workspace's data lives, and moving it safely. The top says which region holds the data
 * now and, item by item, what is stored there and what isn't – in words, since "processed outside this region" matters
 * as much as "stored here". Below it, a short flow moves the data:
 *   1. Choose – the other regions as radio cards, each with its latency and what isn't available there yet
 *   2. Impact – what the move means: the downtime window, what's re-indexed, features that won't be there
 *   3. Schedule – a date, a time and a time zone
 *   4. Confirm – a summary, and the workspace's name typed to confirm; Start migration fires a cancelable tc-migrate
 *   5. Progress – the migration's steps from `progress`, each with a mark and a word, the active one announced
 * Each step is checked before the next and says what's missing in words. The step is controllable: every move fires a
 * cancelable tc-step-change ({ step, previous }), and picking a region a cancelable tc-target-change ({ target }).
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-data-region workspace="Halvorsen Research" current="eu-fra" .regions=${regions} .stored=${stored}>
 *   </tc-data-region>
 */

export type DataRegionStep = "choose" | "impact" | "schedule" | "confirm" | "progress";
export type DataRegionOption = {
  id: string;
  /** The region's name, e.g. "EU – Frankfurt" */
  name: string;
  /** Typical latency from the workspace's people, ready to show, e.g. "About 40 ms" */
  latency?: string;
  /** One quiet line, e.g. "Same jurisdiction as today" */
  note?: string;
  /** What isn't available there yet, e.g. ["large-1"] – said as "large-1 not yet available in AP – Sydney" */
  unavailable?: string[];
  /** Can't be chosen, with `note` saying why */
  disabled?: boolean;
};
export type DataRegionItem = {
  /** What it is, e.g. "Conversations" */
  label: string;
  /** Stored (or processed) in the region */
  inRegion: boolean;
  /** One line more, e.g. "Model calls are processed in the US" */
  note?: string;
};
export type DataRegionImpact = {
  /** The downtime window in words, e.g. "About 2 hours of read-only time" */
  downtime?: string;
  /** What's re-indexed after the move, e.g. ["Search index", "Embeddings"] */
  reindexed?: string[];
  /** Features that won't be there in the new region; by default the chosen region's `unavailable` */
  unavailable?: string[];
  /** Anything else worth knowing, one line each */
  notes?: string[];
};
export type DataRegionProgressStep = { id: string; label: string; status: "done" | "active" | "pending" | "failed"; detail?: string };

/** Details of the events */
export type DataRegionStepChange = { step: DataRegionStep; previous: DataRegionStep };
export type DataRegionTargetChange = { target: string | null };
export type DataRegionMigrate = { region: string; at: string; timeZone: string };

export type DataRegionLabels = {
  current: string;
  stored: string;
  notStored: string;
  steps: Record<DataRegionStep, string>;
  chooseLegend: string;
  currentBadge: string;
  notAvailable: string;
  downtime: string;
  reindexed: string;
  unavailable: string;
  date: string;
  time: string;
  timeZone: string;
  confirmLabel: string;
  confirmSummary: string;
  back: string;
  next: string;
  start: string;
  problems: { region: string; date: string; time: string; confirm: string };
  statuses: Record<DataRegionProgressStep["status"], string>;
};
export const defaultDataRegionLabels: DataRegionLabels = {
  current: "Your data lives in",
  stored: "In this region",
  notStored: "Outside this region",
  steps: { choose: "Choose", impact: "Impact", schedule: "Schedule", confirm: "Confirm", progress: "Progress" },
  chooseLegend: "Move the data to",
  currentBadge: "Current",
  notAvailable: "{items} not yet available in {region}",
  downtime: "Downtime",
  reindexed: "Re-indexed after the move",
  unavailable: "Not available in {region}",
  date: "Date",
  time: "Time",
  timeZone: "Time zone",
  confirmLabel: "Type {workspace} to confirm",
  confirmSummary: "Move {workspace} from {from} to {to} on {date} at {time}, {zone}.",
  back: "Back",
  next: "Next",
  start: "Start migration",
  problems: { region: "Choose a region to move to.", date: "Choose a date.", time: "Choose a time.", confirm: "Type the workspace's name exactly as shown." },
  statuses: { done: "Done", active: "In progress", pending: "Waiting", failed: "Failed" },
};
export type DataRegionLabelsInput = Partial<Omit<DataRegionLabels, "steps" | "problems" | "statuses">> & {
  steps?: Partial<DataRegionLabels["steps"]>;
  problems?: Partial<DataRegionLabels["problems"]>;
  statuses?: Partial<DataRegionLabels["statuses"]>;
};

export const DATA_REGION_STEPS: DataRegionStep[] = ["choose", "impact", "schedule", "confirm", "progress"];
const DEFAULT_ZONES = ["UTC", "Europe/London", "Europe/Berlin", "America/New_York", "Asia/Singapore", "Australia/Sydney"];
const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);

/* Globe, check, cloud-off, alert and loader marks: Lucide (ISC, lucide.dev) */
const globe = svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const MARK = {
  done: () => lucide(14, svg`<path d="M20 6 9 17l-5-5"></path>`),
  active: () => lucide(14, svg`<path d="M21 12a9 9 0 1 1-6.219-8.56"></path>`),
  pending: () => lucide(14, svg`<circle cx="12" cy="12" r="3"></circle>`),
  failed: () => lucide(14, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`),
  outside: () => lucide(14, svg`<path d="m2 2 20 20"></path><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"></path><path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07"></path>`),
};

let uidCount = 0;

/**
 * Where a workspace's data lives, item by item, and a flow to move it – choose a region, see the impact, schedule it,
 * confirm by typing the workspace's name, and follow the migration's progress.
 * @tag tc-data-region
 * @fires tc-step-change - The flow moved to another step ({ step, previous }: DataRegionStepChange); cancelable – prevented, `step` stays as it was
 * @fires tc-target-change - A region was picked ({ target }: DataRegionTargetChange); cancelable – prevented, `target` stays as it was
 * @fires tc-migrate - Start migration was confirmed ({ region, at, timeZone }: DataRegionMigrate); cancelable – prevented, the flow stays on Confirm
 */
export class TcDataRegion extends TcElement {
  static override ui = "drg";

  /** The heading */
  @property() accessor heading = "Data region";
  /** One line under the heading */
  @property() accessor description = "";
  /** The workspace's name: shown in the summary, and typed to confirm a move */
  @property() accessor workspace = "";
  /** The id of the region the data lives in now */
  @property() accessor current = "";
  /** Every region, the current one included */
  @property({ attribute: false }) accessor regions: DataRegionOption[] = [];
  /** What the current region holds, and what it doesn't */
  @property({ attribute: false }) accessor stored: DataRegionItem[] = [];
  /** The flow's step. Changed by the user unless a tc-step-change listener calls preventDefault() */
  @property({ reflect: true }) accessor step: DataRegionStep = "choose";
  /** The region chosen to move to. Changed by the user unless a tc-target-change listener calls preventDefault() */
  @property() accessor target: string | null = null;
  /** What the move means, from the page once a region is chosen */
  @property({ attribute: false }) accessor impact: DataRegionImpact = {};
  /** The time zones offered for the schedule */
  @property({ attribute: false }) accessor timeZones: string[] = DEFAULT_ZONES;
  /** The migration's steps and where each stands, from the page */
  @property({ attribute: false }) accessor progress: DataRegionProgressStep[] = [];
  /** The language for the date in the summary, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The card's words, merged over defaultDataRegionLabels */
  @property({ attribute: false }) accessor labels: DataRegionLabelsInput = {};

  /** The schedule's date, YYYY-MM-DD */
  @state() private accessor date = "";
  /** The schedule's time, HH:MM */
  @state() private accessor time = "";
  /** The schedule's time zone; empty means the first of `timeZones` */
  @state() private accessor zone = "";
  /** What's typed in the confirmation field */
  @state() private accessor typed = "";
  /** The answer that's missing, said under its field */
  @state() private accessor problem: { field: string; text: string } | null = null;
  /** The polite status message */
  @state() private accessor announce = "";

  private uid = `tc-drg-${++uidCount}`;
  private lastActive = "";
  private moved = false;

  private get words(): DataRegionLabels {
    const l = this.labels;
    const d = defaultDataRegionLabels;
    return { ...d, ...l, steps: { ...d.steps, ...l.steps }, problems: { ...d.problems, ...l.problems }, statuses: { ...d.statuses, ...l.statuses } };
  }
  private region(id: string | null | undefined) {
    return this.regions.find((r) => r.id === id);
  }
  private get timeZone() {
    return this.zone || this.timeZones[0] || "UTC";
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("progress")) {
      const active = this.progress.find((p) => p.status === "active" || p.status === "failed");
      const key = active ? `${active.id}:${active.status}` : "";
      if (key && key !== this.lastActive) this.announce = `${active!.label}: ${this.words.statuses[active!.status]}`;
      this.lastActive = key;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (this.moved) {
      this.moved = false;
      this.querySelector<HTMLElement>(".ui-drg__step-title")?.focus();
    }
  }

  private go(step: DataRegionStep) {
    if (step === this.step) return;
    if (!this.emit<DataRegionStepChange>("tc-step-change", { step, previous: this.step }, { cancelable: true })) return;
    this.step = step;
    this.problem = null;
    this.moved = true;
  }
  private pick(id: string, radio?: HTMLInputElement) {
    if (id === this.target) return;
    if (!this.emit<DataRegionTargetChange>("tc-target-change", { target: id }, { cancelable: true })) {
      // The browser has already checked the radio: put the choice back the way the page left it
      if (radio) radio.checked = false;
      const kept = this.querySelector<HTMLInputElement>(`input[type="radio"][value="${CSS.escape(this.target ?? "")}"]`);
      if (kept) kept.checked = true;
      return;
    }
    this.target = id;
    this.problem = null;
  }
  private fail(field: string, text: string) {
    this.problem = { field, text };
    this.announce = text;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-field="${field}"]:not(:disabled)`)?.focus());
  }
  private next() {
    const p = this.words.problems;
    if (this.step === "choose") {
      if (!this.region(this.target) || this.target === this.current) return this.fail("region", p.region);
      return this.go("impact");
    }
    if (this.step === "impact") return this.go("schedule");
    if (this.step === "schedule") {
      if (!this.date) return this.fail("date", p.date);
      if (!this.time) return this.fail("time", p.time);
      return this.go("confirm");
    }
  }
  private back() {
    const i = DATA_REGION_STEPS.indexOf(this.step);
    if (i > 0) this.go(DATA_REGION_STEPS[i - 1]);
  }
  private start() {
    if (this.typed.trim() !== this.workspace.trim()) return this.fail("confirm", this.words.problems.confirm);
    const detail: DataRegionMigrate = { region: this.target ?? "", at: `${this.date}T${this.time}`, timeZone: this.timeZone };
    if (!this.emit<DataRegionMigrate>("tc-migrate", detail, { cancelable: true })) return;
    this.go("progress");
  }

  private error(field: string) {
    return this.problem?.field === field ? html`<p class="ui-drg__error" id=${`${this.uid}-${field}-error`}>${this.problem.text}</p>` : nothing;
  }
  private invalid(field: string) {
    return this.problem?.field === field ? "true" : "false";
  }
  private describe(field: string) {
    return this.problem?.field === field ? `${this.uid}-${field}-error` : "";
  }

  private renderCurrent() {
    const w = this.words;
    const here = this.region(this.current);
    if (!here && !this.stored.length) return nothing;
    return html`<section class="ui-drg__current" aria-labelledby=${`${this.uid}-current`}>
      <p class="ui-drg__where" id=${`${this.uid}-current`}><span>${w.current}</span> <strong>${here?.name ?? this.current}</strong></p>
      ${this.stored.length
        ? html`<ul class="ui-drg__items">
            ${this.stored.map(
              (item) => html`<li class="ui-drg__item" data-in=${item.inRegion ? "true" : "false"}>
                <span class="ui-drg__mark">${item.inRegion ? MARK.done() : MARK.outside()}</span>
                <span class="ui-drg__item-text">
                  <span class="ui-drg__item-label">${item.label}</span>
                  <span class="ui-drg__item-where">${item.inRegion ? w.stored : w.notStored}${item.note ? ` · ${item.note}` : ""}</span>
                </span>
              </li>`,
            )}
          </ul>`
        : nothing}
    </section>`;
  }

  private renderSteps() {
    const w = this.words;
    const at = DATA_REGION_STEPS.indexOf(this.step);
    return html`<ol class="ui-drg__steps" aria-label="Steps">
      ${DATA_REGION_STEPS.map(
        (s, i) => html`<li class="ui-drg__steps-item" data-state=${i < at ? "done" : i === at ? "current" : "next"} aria-current=${i === at ? "step" : "false"}>
          <span class="ui-drg__steps-num" aria-hidden="true">${i + 1}</span><span class="ui-drg__steps-label">${w.steps[s]}</span>
        </li>`,
      )}
    </ol>
    <p class="ui-drg__steps-short">Step ${at + 1} of ${DATA_REGION_STEPS.length} · ${w.steps[this.step]}</p>`;
  }

  private renderChoose() {
    const w = this.words;
    const name = `${this.uid}-region`;
    return html`<fieldset class="ui-drg__choices" aria-invalid=${this.invalid("region")} aria-describedby=${this.describe("region") || nothing}>
        <legend class="ui-drg__legend">${w.chooseLegend}</legend>
        ${this.regions.map((r) => {
          const isCurrent = r.id === this.current;
          const missing = r.unavailable?.length ? fill(w.notAvailable, { items: r.unavailable.join(", "), region: r.name }) : "";
          return html`<label class="ui-drg__choice" data-current=${isCurrent ? "true" : "false"} ?data-disabled=${r.disabled || isCurrent}>
            <input
              type="radio"
              name=${name}
              value=${r.id}
              data-field="region"
              .checked=${this.target === r.id}
              ?disabled=${r.disabled || isCurrent}
              @change=${(e: Event) => this.pick(r.id, e.target as HTMLInputElement)}
            />
            <span class="ui-drg__choice-text">
              <span class="ui-drg__choice-name">${r.name}${isCurrent ? html` <span class="ui-drg__badge">${w.currentBadge}</span>` : nothing}</span>
              ${r.latency ? html`<span class="ui-drg__choice-meta">${r.latency}</span>` : nothing}
              ${r.note ? html`<span class="ui-drg__choice-meta">${r.note}</span>` : nothing}
              ${missing ? html`<span class="ui-drg__choice-warn">${MARK.failed()}<span>${missing}</span></span>` : nothing}
            </span>
          </label>`;
        })}
      </fieldset>
      ${this.error("region")}`;
  }

  private renderImpact() {
    const w = this.words;
    const to = this.region(this.target);
    const im = this.impact;
    const unavailable = im.unavailable ?? to?.unavailable ?? [];
    return html`<dl class="ui-drg__impact">
      ${im.downtime ? html`<div class="ui-drg__fact"><dt>${w.downtime}</dt><dd>${im.downtime}</dd></div>` : nothing}
      ${im.reindexed?.length ? html`<div class="ui-drg__fact"><dt>${w.reindexed}</dt><dd>${im.reindexed.join(", ")}</dd></div>` : nothing}
      ${unavailable.length ? html`<div class="ui-drg__fact" data-tone="warning"><dt>${fill(w.unavailable, { region: to?.name ?? "" })}</dt><dd>${unavailable.join(", ")}</dd></div>` : nothing}
      ${(im.notes ?? []).map((n) => html`<div class="ui-drg__fact"><dt class="tc-sr-only">Note</dt><dd>${n}</dd></div>`)}
    </dl>`;
  }

  private renderSchedule() {
    const w = this.words;
    const id = this.uid;
    return html`<div class="ui-drg__schedule">
      <div class="ui-drg__field">
        <label for=${`${id}-date`}>${w.date}</label>
        <input id=${`${id}-date`} data-field="date" type="date" .value=${this.date} aria-invalid=${this.invalid("date")} aria-describedby=${this.describe("date") || nothing} @input=${(e: Event) => ((this.date = (e.target as HTMLInputElement).value), (this.problem = null))} />
        ${this.error("date")}
      </div>
      <div class="ui-drg__field">
        <label for=${`${id}-time`}>${w.time}</label>
        <input id=${`${id}-time`} data-field="time" type="time" .value=${this.time} aria-invalid=${this.invalid("time")} aria-describedby=${this.describe("time") || nothing} @input=${(e: Event) => ((this.time = (e.target as HTMLInputElement).value), (this.problem = null))} />
        ${this.error("time")}
      </div>
      <div class="ui-drg__field">
        <label for=${`${id}-zone`}>${w.timeZone}</label>
        <select id=${`${id}-zone`} @change=${(e: Event) => (this.zone = (e.target as HTMLSelectElement).value)}>
          ${this.timeZones.map((z) => html`<option value=${z} ?selected=${z === this.timeZone}>${z}</option>`)}
        </select>
      </div>
    </div>`;
  }

  private dateWords() {
    if (!this.date) return "";
    const [y, m, d] = this.date.split("-").map(Number);
    return new Intl.DateTimeFormat(this.locale, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(Date.UTC(y, m - 1, d));
  }

  private renderConfirm() {
    const w = this.words;
    const id = `${this.uid}-confirm`;
    const summary = fill(w.confirmSummary, {
      workspace: this.workspace,
      from: this.region(this.current)?.name ?? this.current,
      to: this.region(this.target)?.name ?? "",
      date: this.dateWords(),
      time: this.time,
      zone: this.timeZone,
    });
    const [before, after = ""] = w.confirmLabel.split("{workspace}");
    return html`<p class="ui-drg__summary">${summary}</p>
      <div class="ui-drg__field">
        <label for=${id}>${before}<strong class="ui-drg__name">${this.workspace}</strong>${after}</label>
        <input
          id=${id}
          data-field="confirm"
          type="text"
          autocomplete="off"
          spellcheck="false"
          .value=${this.typed}
          aria-invalid=${this.invalid("confirm")}
          aria-describedby=${this.describe("confirm") || nothing}
          @input=${(e: Event) => ((this.typed = (e.target as HTMLInputElement).value), (this.problem = null))}
          @keydown=${(e: KeyboardEvent) => e.key === "Enter" && this.start()}
        />
        ${this.error("confirm")}
      </div>`;
  }

  private renderProgress() {
    const w = this.words;
    const steps = this.progress;
    if (!steps.length) return html`<p class="ui-drg__summary">${w.statuses.pending}…</p>`;
    return html`<ol class="ui-drg__progress">
      ${steps.map(
        (p) => html`<li class="ui-drg__progress-item" data-status=${p.status}>
          <span class="ui-drg__mark">${MARK[p.status]()}</span>
          <span class="ui-drg__item-text">
            <span class="ui-drg__item-label">${p.label}</span>
            <span class="ui-drg__item-where">${w.statuses[p.status]}${p.detail ? ` · ${p.detail}` : ""}</span>
          </span>
        </li>`,
      )}
    </ol>`;
  }

  protected override render() {
    const w = this.words;
    const id = this.uid;
    const step = this.step;
    const body =
      step === "choose"
        ? this.renderChoose()
        : step === "impact"
          ? this.renderImpact()
          : step === "schedule"
            ? this.renderSchedule()
            : step === "confirm"
              ? this.renderConfirm()
              : this.renderProgress();
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: globe, title: this.heading, subtitle: this.description || undefined, id: `${id}-title` })}
      <div class="ui-drg__card">
        ${this.renderCurrent()}
        <section class="ui-drg__flow" aria-labelledby=${`${id}-step`}>
          ${this.renderSteps()}
          <h4 class="ui-drg__step-title" id=${`${id}-step`} tabindex="-1">${w.steps[step]}</h4>
          ${body}
          ${step === "progress"
            ? nothing
            : html`<div class="ui-drg__actions">
                ${step === "choose" ? nothing : html`<button type="button" class="tc-btn-sm ui-drg__back" @click=${() => this.back()}>${w.back}</button>`}
                ${step === "confirm"
                  ? html`<button type="button" class="tc-btn-sm ui-drg__start" @click=${() => this.start()}>${w.start}</button>`
                  : html`<button type="button" class="tc-btn-sm ui-drg__next" @click=${() => this.next()}>${w.next}</button>`}
              </div>`}
        </section>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="drg"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="drg"] {
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
[data-ui="drg"] { --tc-drg-step: 20px; --tc-drg-ring: 2px; }
[data-ui="drg"] *, [data-ui="drg"] *::before, [data-ui="drg"] *::after { box-sizing: border-box; }
[data-ui="drg"] ul, [data-ui="drg"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="drg"] p, [data-ui="drg"] h4, [data-ui="drg"] dl, [data-ui="drg"] dd { margin: 0; }
[data-ui="drg"] fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
[data-ui="drg"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="drg"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-drg__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-drg__card { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); color: var(--tc-text-secondary); }
/* ----- Where the data lives ----- */
.ui-drg__current { display: grid; gap: var(--tc-space-2); padding-bottom: var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-drg__where { font-size: var(--tc-font-size-sm); }
.ui-drg__where strong { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-drg__items, .ui-drg__progress { display: grid; gap: var(--tc-space-2); }
.ui-drg__item, .ui-drg__progress-item { display: flex; align-items: flex-start; gap: var(--tc-space-2); }
.ui-drg__mark { display: grid; place-items: center; width: var(--tc-drg-step); height: var(--tc-drg-step); border-radius: var(--tc-radius-full); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-drg__item[data-in="false"] .ui-drg__mark { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-drg__item-text { display: grid; min-width: 0; }
.ui-drg__item-label { color: var(--tc-text-primary); }
.ui-drg__item-where { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-drg__progress-item[data-status="active"] .ui-drg__mark { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-drg__progress-item[data-status="active"] .ui-drg__mark svg { animation: ui-drg-spin var(--tc-duration-shimmer) linear infinite; }
.ui-drg__progress-item[data-status="pending"] .ui-drg__mark { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-drg__progress-item[data-status="failed"] .ui-drg__mark { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
@keyframes ui-drg-spin { to { transform: rotate(360deg); } }
/* ----- The flow ----- */
.ui-drg__flow { display: grid; gap: var(--tc-space-3); }
.ui-drg__steps { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); }
.ui-drg__steps-item { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-drg__steps-num { display: grid; place-items: center; width: var(--tc-drg-step); height: var(--tc-drg-step); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-drg__steps-item[data-state="done"] .ui-drg__steps-num { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-drg__steps-item[data-state="current"] { color: var(--tc-text-primary); }
.ui-drg__steps-item[data-state="current"] .ui-drg__steps-num { background: var(--tc-accent-solid); color: var(--tc-text-on-accent); }
.ui-drg__steps-short { display: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-drg__step-title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-drg__step-title:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); border-radius: var(--tc-radius-sm); }
.ui-drg__choices { display: grid; gap: var(--tc-space-2); }
.ui-drg__legend { margin-bottom: var(--tc-space-2); padding: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-drg__choice { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); cursor: pointer; }
.ui-drg__choice:has(input:checked) { box-shadow: inset 0 0 0 var(--tc-drg-ring) var(--tc-border-selected); }
.ui-drg__choice[data-disabled] { cursor: default; background: var(--tc-fill-subtle); }
.ui-drg__choice input { margin: var(--tc-space-0-5) 0 0; accent-color: var(--tc-accent-solid); }
.ui-drg__choice input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-drg__choice-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-drg__choice-name { color: var(--tc-text-primary); }
.ui-drg__choice-meta { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-drg__choice-warn { display: flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-status-warning-fg); }
.ui-drg__badge { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); color: var(--tc-text-secondary); }
.ui-drg__impact { display: grid; gap: var(--tc-space-2); }
.ui-drg__fact { display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); }
.ui-drg__fact dt { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-drg__fact dd { color: var(--tc-text-primary); }
.ui-drg__fact[data-tone="warning"] { background: var(--tc-status-warning-bg); }
.ui-drg__fact[data-tone="warning"] dt, .ui-drg__fact[data-tone="warning"] dd { color: var(--tc-status-warning-fg); }
.ui-drg__schedule { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--tc-space-3); }
.ui-drg__field { display: grid; gap: var(--tc-space-1); }
.ui-drg__field label { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-drg__field input, .ui-drg__field select { height: var(--tc-field-h); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-drg__field input:focus-visible, .ui-drg__field select:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-drg__field input[aria-invalid="true"], [aria-invalid="true"] .ui-drg__choice { box-shadow: var(--tc-field-shadow-invalid); }
.ui-drg__name { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-drg__summary { color: var(--tc-text-primary); }
.ui-drg__error { font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
.ui-drg__actions { display: flex; justify-content: flex-end; gap: var(--tc-space-2); padding-top: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-drg__next.tc-btn-sm, .ui-drg__start.tc-btn-sm { background: var(--tc-action-primary-bg); color: var(--tc-action-primary-fg); box-shadow: var(--tc-action-primary-shadow); }
.ui-drg__next.tc-btn-sm:hover, .ui-drg__start.tc-btn-sm:hover { background: var(--tc-action-primary-bg-hover); }
@container (max-width: 420px) {
  .ui-drg__steps { display: none; }
  .ui-drg__steps-short { display: block; }
}
@media (forced-colors: active) {
  .ui-drg__mark, .ui-drg__steps-num, .ui-drg__fact { border: 1px solid CanvasText; }
  .ui-drg__choice { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="drg"] *, [data-ui="drg"] *::before, [data-ui="drg"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-data-region")) customElements.define("tc-data-region", TcDataRegion);

declare global {
  interface HTMLElementTagNameMap {
    "tc-data-region": TcDataRegion;
  }
}

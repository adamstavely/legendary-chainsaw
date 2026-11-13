import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-channel-setup> – connect one channel and set when the agent replies there, as five short steps:
 *   1. Connect – an authorize button the page handles (tc-connect); then the connected account's name
 *   2. Where – the channels, inboxes or numbers to reply in, picked from a list the page supplies, with search
 *   3. When it replies – every message, when mentioned, only in direct messages, or business hours (times and a zone)
 *   4. Test – send a test message (tc-test) and see the page's result
 *   5. Go live – a summary, then tc-go-live
 * Next checks the step and says what's missing in words; Back keeps everything. Earlier steps stay one click away
 * in the step list. `step` and `value` are the page's to control (cancelable tc-step-change and tc-value-change).
 * Narrow, the step list shrinks to "Step 2 of 5 · Where".
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-channel-setup channel="Team chat" .targets=${[{ id: "policy", label: "#policy-questions" }]}></tc-channel-setup>
 */

export type ChannelSetupStep = "connect" | "where" | "when" | "test" | "live";
export type ChannelReplyMode = "every" | "mentions" | "direct" | "hours";
export type ChannelSetupValue = {
  /** Ids of the targets picked in Where */
  targets: string[];
  replies: ChannelReplyMode;
  /** For "hours": 24-hour "HH:MM" times and an IANA time zone */
  hours: { from: string; to: string; timeZone: string };
};
export type ChannelTarget = { id: string; label: string; detail?: string };
export type ChannelTestResult = { ok: boolean; reply?: string; message?: string };

/** Details of the events */
export type ChannelStepChange = { step: ChannelSetupStep; previous: ChannelSetupStep };
export type ChannelValueChange = { value: ChannelSetupValue };
export type ChannelTest = { message: string; value: ChannelSetupValue };
export type ChannelGoLive = { value: ChannelSetupValue; account: string };

export const CHANNEL_SETUP_STEPS: ChannelSetupStep[] = ["connect", "where", "when", "test", "live"];

export type ChannelSetupLabels = {
  steps: Record<ChannelSetupStep, string>;
  headings: Record<ChannelSetupStep, string>;
  replies: Record<ChannelReplyMode, string>;
  repliesHint: Record<ChannelReplyMode, string>;
  connect: string;
  reconnect: string;
  connecting: string;
  /** "Connected as {account}" */
  connected: string;
  search: string;
  /** "{n} selected" */
  selected: string;
  noMatches: string;
  noTargets: string;
  from: string;
  to: string;
  timeZone: string;
  testMessage: string;
  sendTest: string;
  sending: string;
  testPassed: string;
  testFailed: string;
  back: string;
  next: string;
  goLive: string;
  /** "{agent} is live in {channel}" */
  isLive: string;
  /** "Step {n} of {total}" */
  stepOf: string;
  /** Names the step list */
  progress: string;
  done: string;
  current: string;
  summaryAccount: string;
  summaryWhere: string;
  summaryWhen: string;
  summaryTest: string;
  /** "{from}–{to} ({zone})" */
  hoursRange: string;
  errors: { connect: string; where: string; hoursMissing: string; hoursOrder: string; timeZone: string; test: string; testFailed: string };
};

export const defaultChannelSetupLabels: ChannelSetupLabels = {
  steps: { connect: "Connect", where: "Where", when: "When it replies", test: "Test", live: "Go live" },
  headings: {
    connect: "Connect an account",
    where: "Where it replies",
    when: "When it replies",
    test: "Send a test message",
    live: "Ready to go live",
  },
  replies: { every: "Every message", mentions: "When mentioned", direct: "Only in direct messages", hours: "During business hours" },
  repliesHint: {
    every: "Answers each message in the places you picked.",
    mentions: "Answers only when someone mentions it by name.",
    direct: "Answers direct messages and stays quiet elsewhere.",
    hours: "Answers every message between the times below, and nothing outside them.",
  },
  connect: "Connect",
  reconnect: "Use another account",
  connecting: "Connecting…",
  connected: "Connected as {account}",
  search: "Search",
  selected: "{n} selected",
  noMatches: "Nothing matches “{q}”",
  noTargets: "Nothing to pick yet",
  from: "From",
  to: "To",
  timeZone: "Time zone",
  testMessage: "Test message",
  sendTest: "Send test",
  sending: "Sending…",
  testPassed: "It replied",
  testFailed: "No reply",
  back: "Back",
  next: "Next",
  goLive: "Go live",
  isLive: "{agent} is live in {channel}",
  stepOf: "Step {n} of {total}",
  progress: "Setup steps",
  done: "done",
  current: "current step",
  summaryAccount: "Account",
  summaryWhere: "Replies in",
  summaryWhen: "Replies",
  summaryTest: "Test",
  hoursRange: "{from}–{to} ({zone})",
  errors: {
    connect: "Connect an account to continue.",
    where: "Pick at least one place for the agent to reply in.",
    hoursMissing: "Enter a start and an end time.",
    hoursOrder: "The end time must be after the start time.",
    timeZone: "Pick a time zone.",
    test: "Send a test message first.",
    testFailed: "The test didn't get a reply. Fix the problem and send another.",
  },
};

export type ChannelSetupLabelsInput = Partial<Omit<ChannelSetupLabels, "steps" | "headings" | "replies" | "repliesHint" | "errors">> & {
  steps?: Partial<ChannelSetupLabels["steps"]>;
  headings?: Partial<ChannelSetupLabels["headings"]>;
  replies?: Partial<ChannelSetupLabels["replies"]>;
  repliesHint?: Partial<ChannelSetupLabels["repliesHint"]>;
  errors?: Partial<ChannelSetupLabels["errors"]>;
};

export const DEFAULT_TIME_ZONES = ["UTC", "Europe/London", "Europe/Lisbon", "Europe/Berlin", "America/New_York", "America/Chicago", "America/Los_Angeles", "Asia/Singapore", "Australia/Sydney"];

const blankValue = (): ChannelSetupValue => ({ targets: [], replies: "mentions", hours: { from: "09:00", to: "17:00", timeZone: "UTC" } });
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** What stops a step: the key of its error in labels.errors, or "" when it's fine */
export function channelStepProblem(
  step: ChannelSetupStep,
  ctx: { account: string; value: ChannelSetupValue; testResult: ChannelTestResult | null },
): "" | keyof ChannelSetupLabels["errors"] {
  if (step === "connect") return ctx.account ? "" : "connect";
  if (step === "where") return ctx.value.targets.length ? "" : "where";
  if (step === "when") {
    if (ctx.value.replies !== "hours") return "";
    const { from, to, timeZone } = ctx.value.hours;
    if (!TIME.test(from) || !TIME.test(to)) return "hoursMissing";
    if (to <= from) return "hoursOrder";
    return timeZone ? "" : "timeZone";
  }
  if (step === "test") return !ctx.testResult ? "test" : ctx.testResult.ok ? "" : "testFailed";
  return "";
}

const fill = (s: string, values: Record<string, string>) => s.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);

/* Lucide (ISC, lucide.dev): plug for the header, check, link, send */
const HEAD = svg`<path d="M12 22v-5"></path><path d="M9 8V2"></path><path d="M15 8V2"></path><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"></path>`;
const CHECK = svg`<path d="M20 6 9 17l-5-5"></path>`;
const ALERT = svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path>`;
const SEND = svg`<path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>`;
const glyph = (paths: unknown, cls: string) =>
  html`<svg class=${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

let uid = 0;

/**
 * Connect one channel and set when the agent replies there – Connect, Where, When it replies, Test and Go live, each checked in words before the next.
 * @tag tc-channel-setup
 * @fires tc-connect - Connect was pressed; the page authorizes, then sets `account` ({ step }: { step: "connect" })
 * @fires tc-step-change - The step is changing ({ step, previous }: ChannelStepChange); cancelable – prevented, the step stays
 * @fires tc-value-change - The settings changed ({ value }: ChannelValueChange); cancelable – prevented, `value` stays as it was
 * @fires tc-test - Send test was pressed ({ message, value }: ChannelTest); cancelable – not prevented, `testing` turns on until the page sets `testResult`
 * @fires tc-go-live - Go live was pressed ({ value, account }: ChannelGoLive); cancelable – not prevented, the setup shows it's live
 */
export class TcChannelSetup extends TcElement {
  static override ui = "chs";

  /** The heading */
  @property() accessor heading = "Set up a channel";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The channel's name, used in the words: "Team chat" */
  @property() accessor channel = "this channel";
  /** The agent's name, used in the words: "Policy Q&A" */
  @property() accessor agent = "The agent";
  /** The current step. Changed by Next, Back and the step list unless a tc-step-change listener prevents it */
  @property() accessor step: ChannelSetupStep = "connect";
  /** The settings. Changed by the user unless a tc-value-change listener prevents it */
  @property({ attribute: false }) accessor value: ChannelSetupValue = blankValue();
  /** The connected account's name; empty while not connected */
  @property() accessor account = "";
  /** The page is authorizing: Connect waits */
  @property({ type: Boolean }) accessor connecting = false;
  /** The places to pick in Where */
  @property({ attribute: false }) accessor targets: ChannelTarget[] = [];
  /** The time zones offered for business hours */
  @property({ attribute: false }) accessor timeZones: string[] = DEFAULT_TIME_ZONES;
  /** The message Send test sends; editable in the Test step */
  @property({ attribute: "test-message" }) accessor testMessage = "Hello! Can you tell me what you help with?";
  /** A test is on its way: Send test waits */
  @property({ type: Boolean }) accessor testing = false;
  /** The page's result for the last test; null before one */
  @property({ attribute: false }) accessor testResult: ChannelTestResult | null = null;
  /** The channel is live: the setup shows its done state */
  @property({ type: Boolean, reflect: true }) accessor live = false;
  /** Words the component uses, merged over defaultChannelSetupLabels */
  @property({ attribute: false }) accessor labels: ChannelSetupLabelsInput = {};

  @state() private accessor query = "";
  @state() private accessor tried = false;
  @state() private accessor furthest = 0;
  @state() private accessor said = "";
  private readonly uid = `tc-chs-${++uid}`;
  private moved = false;

  private get words(): ChannelSetupLabels {
    const l = this.labels ?? {};
    const d = defaultChannelSetupLabels;
    return {
      ...d,
      ...l,
      steps: { ...d.steps, ...l.steps },
      headings: { ...d.headings, ...l.headings },
      replies: { ...d.replies, ...l.replies },
      repliesHint: { ...d.repliesHint, ...l.repliesHint },
      errors: { ...d.errors, ...l.errors },
    };
  }

  private get index() {
    return Math.max(0, CHANNEL_SETUP_STEPS.indexOf(this.step));
  }

  private get val(): ChannelSetupValue {
    const v = this.value ?? blankValue();
    const b = blankValue();
    return { targets: v.targets ?? [], replies: v.replies ?? b.replies, hours: { ...b.hours, ...v.hours } };
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("step")) {
      this.furthest = Math.max(this.furthest, this.index);
      if (changed.get("step") !== undefined) {
        this.tried = false;
        this.query = "";
      }
    }
    if (changed.has("testResult") && this.testResult) this.testing = false;
    if (changed.has("account") && this.account) this.connecting = false;
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    // A step changed by the user: the new step's heading takes focus, so a screen reader starts there
    if (changed.has("step") && this.moved) {
      this.moved = false;
      this.querySelector<HTMLElement>(".ui-chs__heading")?.focus();
    }
  }

  private setValue(next: ChannelSetupValue) {
    if (!this.emit<ChannelValueChange>("tc-value-change", { value: next }, { cancelable: true })) return;
    this.value = next;
  }

  private goTo(step: ChannelSetupStep) {
    if (step === this.step) return;
    if (!this.emit<ChannelStepChange>("tc-step-change", { step, previous: this.step }, { cancelable: true })) return;
    this.moved = true;
    this.step = step;
  }

  private problem() {
    return channelStepProblem(this.step, { account: this.account, value: this.val, testResult: this.testResult });
  }

  private next() {
    const problem = this.problem();
    if (problem) {
      this.tried = true;
      this.said = this.words.errors[problem];
      void this.updateComplete.then(() => this.querySelector<HTMLElement>("[data-first]")?.focus());
      return;
    }
    if (this.step === "live") {
      if (!this.emit<ChannelGoLive>("tc-go-live", { value: this.val, account: this.account }, { cancelable: true })) return;
      this.live = true;
      this.said = fill(this.words.isLive, { agent: this.agent, channel: this.channel });
      return;
    }
    this.goTo(CHANNEL_SETUP_STEPS[this.index + 1]);
  }

  private back() {
    if (this.index > 0) this.goTo(CHANNEL_SETUP_STEPS[this.index - 1]);
  }

  private connect() {
    if (this.connecting) return;
    this.connecting = true;
    this.emit("tc-connect", { step: "connect" });
  }

  private sendTest() {
    if (this.testing) return;
    if (!this.emit<ChannelTest>("tc-test", { message: this.testMessage, value: this.val }, { cancelable: true })) return;
    this.testing = true;
    this.said = this.words.sending;
  }

  private toggleTarget(id: string, on: boolean) {
    const v = this.val;
    const targets = on ? [...v.targets.filter((t) => t !== id), id] : v.targets.filter((t) => t !== id);
    this.setValue({ ...v, targets });
  }

  private whenWords(w: ChannelSetupLabels, v: ChannelSetupValue) {
    if (v.replies !== "hours") return w.replies[v.replies];
    return `${w.replies.hours}, ${fill(w.hoursRange, { from: v.hours.from, to: v.hours.to, zone: v.hours.timeZone })}`;
  }

  private errorFor(w: ChannelSetupLabels) {
    if (!this.tried) return nothing;
    const problem = this.problem();
    if (!problem) return nothing;
    return html`<p class="ui-chs__error" id=${`${this.uid}-error`}>${glyph(ALERT, "ui-chs__error-mark")}<span>${w.errors[problem]}</span></p>`;
  }

  private described() {
    return this.tried && this.problem() ? `${this.uid}-error` : undefined;
  }

  private renderConnect(w: ChannelSetupLabels) {
    return html`<div class="ui-chs__connect">
      ${this.account
        ? html`<p class="ui-chs__connected">${glyph(CHECK, "ui-chs__ok-mark")}<span>${fill(w.connected, { account: this.account })}</span></p>
            <button type="button" class="tc-btn-sm" @click=${() => this.connect()} aria-disabled=${this.connecting ? "true" : "false"}>
              ${this.connecting ? w.connecting : w.reconnect}
            </button>`
        : html`<button
            type="button"
            class="ui-chs__primary"
            data-first
            aria-disabled=${this.connecting ? "true" : "false"}
            aria-describedby=${this.described() ?? nothing}
            @click=${() => this.connect()}
          >${this.connecting ? w.connecting : html`${w.connect}<span class="tc-sr-only"> ${this.channel}</span>`}</button>`}
    </div>`;
  }

  private renderWhere(w: ChannelSetupLabels) {
    const v = this.val;
    const q = this.query.trim().toLowerCase();
    const shown = (this.targets ?? []).filter((t) => !q || `${t.label} ${t.detail ?? ""}`.toLowerCase().includes(q));
    const searchId = `${this.uid}-search`;
    return html`<div class="ui-chs__where">
      <label class="ui-chs__field-label" for=${searchId}>${w.search}</label>
      <input
        id=${searchId}
        class="ui-chs__input"
        type="search"
        autocomplete="off"
        .value=${live(this.query)}
        @input=${(e: Event) => (this.query = (e.target as HTMLInputElement).value)}
      />
      <fieldset class="ui-chs__group" aria-describedby=${this.described() ?? nothing}>
        <legend class="tc-sr-only">${w.headings.where}</legend>
        ${!(this.targets ?? []).length
          ? html`<p class="ui-chs__none">${w.noTargets}</p>`
          : shown.length
            ? html`<ul class="ui-chs__targets">
                ${repeat(
                  shown,
                  (t) => t.id,
                  (t, n) => html`<li class="ui-chs__target">
                    <label class="ui-chs__check">
                      <input
                        type="checkbox"
                        ?data-first=${n === 0}
                        .checked=${live(v.targets.includes(t.id))}
                        @change=${(e: Event) => {
                          const box = e.target as HTMLInputElement;
                          const on = box.checked;
                          this.toggleTarget(t.id, on);
                          // Prevented: the box shows the value again
                          void this.updateComplete.then(() => (box.checked = this.val.targets.includes(t.id)));
                        }}
                      />
                      <span class="ui-chs__target-text"><span class="ui-chs__target-label">${t.label}</span>${t.detail ? html`<span class="ui-chs__target-detail">${t.detail}</span>` : nothing}</span>
                    </label>
                  </li>`,
                )}
              </ul>`
            : html`<p class="ui-chs__none">${fill(w.noMatches, { q: this.query.trim() })}</p>`}
      </fieldset>
      <p class="ui-chs__count" aria-live="polite">${fill(w.selected, { n: String(v.targets.length) })}</p>
    </div>`;
  }

  private renderWhen(w: ChannelSetupLabels) {
    const v = this.val;
    const name = `${this.uid}-replies`;
    const modes: ChannelReplyMode[] = ["every", "mentions", "direct", "hours"];
    const setHours = (patch: Partial<ChannelSetupValue["hours"]>) => this.setValue({ ...v, hours: { ...v.hours, ...patch } });
    const zones = this.timeZones?.length ? this.timeZones : DEFAULT_TIME_ZONES;
    return html`<fieldset class="ui-chs__group" aria-describedby=${this.described() ?? nothing}>
        <legend class="tc-sr-only">${w.headings.when}</legend>
        <div class="ui-chs__radios">
          ${modes.map(
            (m) => html`<label class="ui-chs__radio" data-mode=${m}>
              <input
                type="radio"
                name=${name}
                value=${m}
                .checked=${live(v.replies === m)}
                aria-describedby=${`${this.uid}-hint-${m}`}
                @change=${(e: Event) => {
                  const box = e.target as HTMLInputElement;
                  this.setValue({ ...v, replies: m });
                  void this.updateComplete.then(() => (box.checked = this.val.replies === m));
                }}
              />
              <span class="ui-chs__radio-text"
                ><span class="ui-chs__radio-label">${w.replies[m]}</span><span class="ui-chs__radio-hint" id=${`${this.uid}-hint-${m}`}>${w.repliesHint[m]}</span></span
              >
            </label>`,
          )}
        </div>
      </fieldset>
      ${v.replies === "hours"
        ? html`<div class="ui-chs__hours">
            <label class="ui-chs__hour">
              <span class="ui-chs__field-label">${w.from}</span>
              <input class="ui-chs__input" type="time" data-first .value=${live(v.hours.from)} aria-describedby=${this.described() ?? nothing} @change=${(e: Event) => setHours({ from: (e.target as HTMLInputElement).value })} />
            </label>
            <label class="ui-chs__hour">
              <span class="ui-chs__field-label">${w.to}</span>
              <input class="ui-chs__input" type="time" .value=${live(v.hours.to)} aria-describedby=${this.described() ?? nothing} @change=${(e: Event) => setHours({ to: (e.target as HTMLInputElement).value })} />
            </label>
            <label class="ui-chs__hour ui-chs__hour--zone">
              <span class="ui-chs__field-label">${w.timeZone}</span>
              <select class="ui-chs__input" .value=${live(v.hours.timeZone)} @change=${(e: Event) => setHours({ timeZone: (e.target as HTMLSelectElement).value })}>
                ${(zones.includes(v.hours.timeZone) ? zones : [v.hours.timeZone, ...zones]).map((z) => html`<option value=${z} ?selected=${z === v.hours.timeZone}>${z}</option>`)}
              </select>
            </label>
          </div>`
        : nothing}`;
  }

  private renderTest(w: ChannelSetupLabels) {
    const id = `${this.uid}-message`;
    const r = this.testResult;
    return html`<div class="ui-chs__test">
      <label class="ui-chs__field-label" for=${id}>${w.testMessage}</label>
      <div class="ui-chs__test-row">
        <input id=${id} class="ui-chs__input" type="text" .value=${live(this.testMessage)} @input=${(e: Event) => (this.testMessage = (e.target as HTMLInputElement).value)} />
        <button type="button" class="tc-btn-sm" data-first aria-disabled=${this.testing ? "true" : "false"} aria-describedby=${this.described() ?? nothing} @click=${() => this.sendTest()}>
          ${glyph(SEND, "ui-chs__btn-glyph")}${this.testing ? w.sending : w.sendTest}
        </button>
      </div>
      <div class="ui-chs__result" role="status">
        ${r && !this.testing
          ? html`<div class="ui-chs__result-card" data-ok=${r.ok ? "true" : "false"}>
              <p class="ui-chs__result-head">${glyph(r.ok ? CHECK : ALERT, "ui-chs__result-mark")}<span>${r.ok ? w.testPassed : w.testFailed}</span></p>
              ${r.reply ? html`<p class="ui-chs__result-reply">${r.reply}</p>` : nothing}
              ${r.message ? html`<p class="ui-chs__result-message">${r.message}</p>` : nothing}
            </div>`
          : nothing}
      </div>
    </div>`;
  }

  private renderLive(w: ChannelSetupLabels) {
    const v = this.val;
    const names = v.targets.map((id) => this.targets.find((t) => t.id === id)?.label ?? id);
    return html`<dl class="ui-chs__summary">
      <div class="ui-chs__summary-row"><dt>${w.summaryAccount}</dt><dd>${this.account || "—"}</dd></div>
      <div class="ui-chs__summary-row"><dt>${w.summaryWhere}</dt><dd>${names.length ? names.join(", ") : "—"}</dd></div>
      <div class="ui-chs__summary-row"><dt>${w.summaryWhen}</dt><dd>${this.whenWords(w, v)}</dd></div>
      <div class="ui-chs__summary-row"><dt>${w.summaryTest}</dt><dd>${this.testResult ? (this.testResult.ok ? w.testPassed : w.testFailed) : "—"}</dd></div>
    </dl>`;
  }

  private renderSteps(w: ChannelSetupLabels) {
    const total = CHANNEL_SETUP_STEPS.length;
    return html`<ol class="ui-chs__steps">
        ${CHANNEL_SETUP_STEPS.map((s, i) => {
          const done = this.live || i < this.index;
          const current = !this.live && i === this.index;
          const reachable = !this.live && !current && i <= this.furthest;
          const inner = html`<span class="ui-chs__step-mark" aria-hidden="true">${done ? glyph(CHECK, "ui-chs__step-check") : i + 1}</span><span class="ui-chs__step-name">${w.steps[s]}</span
            >${done ? html`<span class="tc-sr-only">, ${w.done}</span>` : nothing}`;
          return html`<li class="ui-chs__step" data-step=${s} data-state=${done ? "done" : current ? "current" : "upcoming"} aria-current=${ifDefined(current ? ("step" as const) : undefined)}>
            ${reachable ? html`<button type="button" class="ui-chs__step-btn" @click=${() => this.goTo(s)}>${inner}</button>` : html`<span class="ui-chs__step-btn">${inner}</span>`}
          </li>`;
        })}
      </ol>
      <p class="ui-chs__step-of">${fill(w.stepOf, { n: String(this.index + 1), total: String(total) })} · ${w.steps[this.step] ?? ""}</p>`;
  }

  protected override render() {
    const w = this.words;
    const headingId = `${this.uid}-heading`;
    const body = this.live
      ? html`<div class="ui-chs__done">${glyph(CHECK, "ui-chs__done-mark")}<p class="ui-chs__done-text">${fill(w.isLive, { agent: this.agent, channel: this.channel })}</p></div>`
      : html`<section class="ui-chs__panel" aria-labelledby=${headingId}>
          <h4 class="ui-chs__heading" id=${headingId} tabindex="-1">${w.headings[this.step]}</h4>
          ${this.step === "connect"
            ? this.renderConnect(w)
            : this.step === "where"
              ? this.renderWhere(w)
              : this.step === "when"
                ? this.renderWhen(w)
                : this.step === "test"
                  ? this.renderTest(w)
                  : this.renderLive(w)}
          ${this.errorFor(w)}
        </section>
        <div class="ui-chs__footer">
          ${this.index > 0 ? html`<button type="button" class="tc-btn-sm ui-chs__back" @click=${() => this.back()}>${w.back}</button>` : nothing}
          <button type="button" class="ui-chs__primary ui-chs__next" @click=${() => this.next()}>${this.step === "live" ? w.goLive : w.next}</button>
        </div>`;
    return html`${cardHead({ icon: HEAD, title: this.heading, subtitle: this.description })}
      <div class="ui-chs__card">
        <nav class="ui-chs__nav" aria-label=${w.progress}>${this.renderSteps(w)}</nav>
        ${body}
      </div>
      <span class="tc-sr-only" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
[data-ui="chs"] {
  --tc-chs-mark: 22px;
  --tc-chs-glyph: 14px;
  container-type: inline-size;
}
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="chs"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="chs"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="chs"] *, [data-ui="chs"] *::before, [data-ui="chs"] *::after { box-sizing: border-box; }
:where([data-ui="chs"]) button { margin: 0; border: 0; font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="chs"] button:focus-visible, [data-ui="chs"] input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="chs"] button[aria-disabled="true"] { cursor: progress; }
[data-ui="chs"] ul, [data-ui="chs"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="chs"] p { margin: 0; }
[data-ui="chs"] fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
[data-ui="chs"] svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-chs__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-chs__nav { padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-chs__steps { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); }
.ui-chs__step-btn { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-md); background: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
button.ui-chs__step-btn:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-chs__step-mark {
  display: grid;
  place-items: center;
  width: var(--tc-chs-mark);
  height: var(--tc-chs-mark);
  border-radius: var(--tc-radius-full);
  border: var(--tc-hairline) solid var(--tc-border-control);
  font-size: var(--tc-font-size-xs);
  font-variant-numeric: tabular-nums;
}
.ui-chs__step-check { width: var(--tc-chs-glyph); height: var(--tc-chs-glyph); }
[data-state="current"] .ui-chs__step-btn { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); }
[data-state="current"] .ui-chs__step-mark { border-color: var(--tc-accent); background: var(--tc-accent); color: var(--tc-text-on-accent); }
[data-state="done"] .ui-chs__step-mark { border-color: var(--tc-accent); color: var(--tc-accent-text); }
.ui-chs__step-of { display: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-chs__panel { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
.ui-chs__heading { margin: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); }
.ui-chs__heading:focus { outline: none; }
.ui-chs__heading:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-chs__primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-primary-bg);
  box-shadow: var(--tc-action-primary-shadow);
  color: var(--tc-action-primary-fg);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-chs__primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-chs__primary:active { background: var(--tc-action-primary-bg-active); }
.ui-chs__connect { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-3); }
.ui-chs__connected, .ui-chs__result-head, .ui-chs__error { display: inline-flex; align-items: center; gap: var(--tc-space-2); }
.ui-chs__connected { color: var(--tc-text-primary); }
.ui-chs__ok-mark, .ui-chs__error-mark, .ui-chs__result-mark, .ui-chs__btn-glyph { width: var(--tc-chs-glyph); height: var(--tc-chs-glyph); }
.ui-chs__ok-mark { color: var(--tc-status-success-fg); }
.ui-chs__field-label { display: block; margin-bottom: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-chs__input {
  width: 100%;
  height: var(--tc-field-h);
  padding: 0 var(--tc-field-px);
  border: 0;
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-field-font-size);
}
.ui-chs__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-chs__input:focus { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-chs__input[aria-describedby] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-chs__where { display: grid; gap: var(--tc-space-2); }
.ui-chs__targets { display: grid; gap: var(--tc-space-1); max-height: calc(var(--tc-control-h-md) * 6); overflow: auto; padding: var(--tc-space-1); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); box-shadow: var(--tc-shadow-sunken); }
.ui-chs__check, .ui-chs__radio { display: flex; align-items: flex-start; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-radius-sm); cursor: pointer; }
.ui-chs__check:hover, .ui-chs__radio:hover { background: var(--tc-fill-hover); }
.ui-chs__check input, .ui-chs__radio input { flex: none; margin: var(--tc-space-1) 0 0; accent-color: var(--tc-accent); }
.ui-chs__target-text, .ui-chs__radio-text { display: grid; min-width: 0; }
.ui-chs__target-label, .ui-chs__radio-label { color: var(--tc-text-primary); }
.ui-chs__target-detail, .ui-chs__radio-hint { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-chs__none { padding: var(--tc-space-3); color: var(--tc-text-muted); text-align: center; }
.ui-chs__count { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-chs__radios { display: grid; gap: var(--tc-space-1); }
.ui-chs__hours { display: grid; grid-template-columns: repeat(2, minmax(0, 8rem)) minmax(0, 1fr); gap: var(--tc-space-3); }
.ui-chs__test { display: grid; gap: var(--tc-space-1); }
.ui-chs__test-row { display: flex; gap: var(--tc-space-2); align-items: center; }
.ui-chs__test-row .ui-chs__input { flex: 1 1 auto; min-width: 0; }
.ui-chs__result:empty { display: none; }
.ui-chs__result-card { display: grid; gap: var(--tc-space-1); margin-top: var(--tc-space-2); padding: var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-chs__result-card[data-ok="false"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-chs__result-head { font-weight: var(--tc-font-weight-medium); }
.ui-chs__result-reply { color: var(--tc-text-primary); }
.ui-chs__result-message { font-size: var(--tc-font-size-sm); }
.ui-chs__summary { display: grid; gap: var(--tc-space-2); margin: 0; }
.ui-chs__summary-row { display: grid; grid-template-columns: minmax(0, 8rem) minmax(0, 1fr); gap: var(--tc-space-3); }
.ui-chs__summary dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-chs__summary dd { margin: 0; color: var(--tc-text-primary); }
.ui-chs__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); }
.ui-chs__footer { display: flex; justify-content: flex-end; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-chs__back { margin-right: auto; }
.ui-chs__done { display: flex; align-items: center; gap: var(--tc-space-3); padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-chs__done-mark { width: var(--tc-chs-mark); height: var(--tc-chs-mark); color: var(--tc-status-success-fg); }
/* Narrow: the step list becomes "Step 2 of 5 · Where"; the hours stack */
@container (max-width: 480px) {
  .ui-chs__steps { display: none; }
  .ui-chs__step-of { display: block; }
  .ui-chs__hours { grid-template-columns: 1fr 1fr; }
  .ui-chs__hour--zone { grid-column: 1 / -1; }
  .ui-chs__summary-row { grid-template-columns: 1fr; gap: 0; }
}
@media (prefers-reduced-motion: reduce) { .ui-chs__primary { transition: none; } }
@media (forced-colors: active) {
  .ui-chs__step-mark { border-color: CanvasText; }
  [data-state="current"] .ui-chs__step-mark { background: Highlight; color: HighlightText; }
  .ui-chs__primary { border: 1px solid ButtonText; }
}
`;
}

if (!customElements.get("tc-channel-setup")) customElements.define("tc-channel-setup", TcChannelSetup);
declare global {
  interface HTMLElementTagNameMap {
    "tc-channel-setup": TcChannelSetup;
  }
}

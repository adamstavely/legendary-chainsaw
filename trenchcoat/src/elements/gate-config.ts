import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";

/*
 * <tc-gate-config> – when a person decides. A review gate in an agent's workflow pauses the run and hands it to a
 * person; this sets it up:
 *   · Pauses when – the trigger conditions, each a switch ("Confidence is low", "The next action can't be undone")
 *   · Reviewer – who reviews, a select
 *   · They see – what the reviewer is shown: the output, with its evidence, or the full trace (a segmented control)
 *   · They may – the actions they can take: approve, edit and approve, send back, escalate, reject (checkboxes)
 *   · Why – a note on why the gate is there, which the reviewer reads above their decision
 * and reads it back as one plain sentence. Standard is a white card on a gray tray; Clean is one white card; `flat`
 * drops both, for a gate inside another card (playbook-canvas puts one in a review step).
 *
 *   <tc-gate-config .value=${{ triggers: ["low-confidence"], reviewer: "lead", view: "evidence", actions: ["approve", "reject"], reason: "" }}></tc-gate-config>
 *
 * The whole config is one value: every change fires a cancelable `tc-value-change` ({ value }) – call
 * preventDefault() to control `value` yourself. With `name` it's a form control: the form gets the config as JSON,
 * and a gate that allows no action is invalid. Conditions, reviewers, views and actions are properties, so a product
 * uses its own words.
 */

export type GateConfigValue = {
  /** The ids of the conditions that pause the run */
  triggers: string[];
  /** The id of who reviews */
  reviewer: string;
  /** The id of what the reviewer sees */
  view: string;
  /** The ids of the actions the reviewer may take */
  actions: string[];
  /** Why the gate is there – the reviewer reads it */
  reason: string;
};
export type GateCondition = {
  id: string;
  /** "Confidence is low" – also used, lower-cased, in the sentence */
  label: string;
  /** A quieter line under the label */
  description?: string;
};
export type GateReviewer = { id: string; /** "A team lead" – also used, lower-cased, in the sentence */ label: string };
export type GateView = {
  id: string;
  /** On the segmented control: "With evidence" */
  label: string;
  /** In the sentence after "reviews": "the output with its evidence"; defaults to the label */
  phrase?: string;
  /** Shown under the control when it's picked */
  description?: string;
};
export type GateActionOption = {
  /** approve, edit, send-back, escalate and reject by default */
  id: string;
  label: string;
  /** A quieter line under the label */
  description?: string;
};
export type GateValueChange = { value: GateConfigValue };

export const GATE_CONDITIONS: GateCondition[] = [
  { id: "low-confidence", label: "Confidence is low", description: "The agent rates its own answer under the threshold" },
  { id: "no-source", label: "A claim has no source", description: "Something in the output isn't backed by a retrieved source" },
  { id: "irreversible", label: "The next action can't be undone", description: "Sending, paying, deleting or publishing" },
  { id: "personal-data", label: "It touches personal data", description: "Names, contact details or records about a person" },
  { id: "new-version", label: "The playbook just changed", description: "The first ten runs after a new version" },
];
export const GATE_REVIEWERS: GateReviewer[] = [
  { id: "owner", label: "Whoever started the run" },
  { id: "lead", label: "A team lead" },
  { id: "on-call", label: "The on-call reviewer" },
  { id: "named", label: "A named approver" },
];
export const GATE_VIEWS: GateView[] = [
  { id: "output", label: "Output", phrase: "the output", description: "The result only, as it would go out" },
  { id: "evidence", label: "With evidence", phrase: "the output with its evidence", description: "The result, the sources behind it and the agent's confidence" },
  { id: "trace", label: "Full trace", phrase: "the full trace", description: "Every step, tool call and source of the run" },
];
export const GATE_ACTIONS: GateActionOption[] = [
  { id: "approve", label: "Approve", description: "The run carries on as it is" },
  { id: "edit", label: "Edit and approve", description: "Change the output, then carry on" },
  { id: "send-back", label: "Send back", description: "The agent tries again with the reviewer's note" },
  { id: "escalate", label: "Escalate", description: "Hand the decision to someone more senior" },
  { id: "reject", label: "Reject", description: "The run stops here" },
];
const DEFAULT_VALUE: GateConfigValue = { triggers: ["low-confidence", "irreversible"], reviewer: "lead", view: "evidence", actions: ["approve", "send-back", "reject"], reason: "" };

/** "A team lead" → "a team lead"; acronyms ("QA lead") stay */
const lower = (s: string) => (/^[A-Z](?![A-Z])/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const list = (items: string[], last = "and") => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} ${last} ${items[items.length - 1]}`);

/** The gate in plain words: "Pauses when confidence is low or a claim has no source, for a team lead to review the
 *  output with its evidence. They may approve, send back or reject." */
export function describeGate(
  value: GateConfigValue,
  o: { conditions?: GateCondition[]; reviewers?: GateReviewer[]; views?: GateView[]; actions?: GateActionOption[] } = {},
): string {
  const conditions = (o.conditions ?? GATE_CONDITIONS).filter((c) => value.triggers.includes(c.id));
  if (!conditions.length) return "Never pauses – turn on a condition.";
  const reviewer = (o.reviewers ?? GATE_REVIEWERS).find((r) => r.id === value.reviewer);
  const view = (o.views ?? GATE_VIEWS).find((v) => v.id === value.view);
  const actions = (o.actions ?? GATE_ACTIONS).filter((a) => value.actions.includes(a.id));
  const who = reviewer ? lower(reviewer.label) : "a reviewer";
  const what = view ? (view.phrase ?? lower(view.label)) : "the output";
  const may = actions.length ? `They may ${list(actions.map((a) => lower(a.label)), "or")}.` : "They can't answer yet – allow at least one action.";
  return `Pauses when ${list(conditions.map((c) => lower(c.label)), "or")}, for ${who} to review ${what}. ${may}`;
}

/* ---------- Icons ---------- */

const check = (clean: boolean) =>
  clean ? html`<svg viewBox="0 0 16 16">${svg`<path d="m4.25 8.25 2.5 2.5 5-5.5"></path>`}</svg>` : html`<svg viewBox="0 0 24 24">${svg`<path d="m6 12.5 4 4 8-9"></path>`}</svg>`;
const chevronDown = html`<svg class="ui-gc__chevron" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`;
/* hand: a raised palm – a person steps in */
/** A pause: the run stops here for a person */
const gateIcon = svg`<rect x="6" y="4.5" width="4" height="15" rx="1"></rect><rect x="14" y="4.5" width="4" height="15" rx="1"></rect>`;
const sentenceIcon = html`<svg class="ui-gc__sentence-icon" viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="5.25" r="2.5"></circle><path d="M3.25 13.5c.6-2.5 2.5-3.75 4.75-3.75s4.15 1.25 4.75 3.75"></path>`}</svg>`;

let instances = 0;

/**
 * When a person decides: the conditions that pause a run, who reviews, what they see, what they may do and why.
 * @tag tc-gate-config
 * @fires tc-value-change - The config changed ({ value: GateConfigValue }); cancelable – prevent it to control `value`
 */
export class TcGateConfig extends TcElement {
  static override ui = "gcfg";
  static formAssociated = true;

  /** The gate's config. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: GateConfigValue = DEFAULT_VALUE;
  /** The conditions that can pause a run, each shown as a switch */
  @property({ attribute: false }) accessor conditions: GateCondition[] = GATE_CONDITIONS;
  /** Who can review, offered in the Reviewer select */
  @property({ attribute: false }) accessor reviewers: GateReviewer[] = GATE_REVIEWERS;
  /** What a reviewer can be shown, offered as a segmented control – two to four work best */
  @property({ attribute: false }) accessor views: GateView[] = GATE_VIEWS;
  /** The actions a reviewer may be allowed, shown as checkboxes */
  @property({ attribute: false }) accessor actions: GateActionOption[] = GATE_ACTIONS;
  /** Names the group, shown at the top */
  @property() accessor heading = "Review gate";
  /** A quieter line under the heading, e.g. which step the gate guards */
  @property() accessor description = "";
  /** Placeholder for the note */
  @property() accessor placeholder = "Why a person decides here – the reviewer reads this first";
  /** Drops the tray and the card, for a gate inside another card */
  @property({ type: Boolean, reflect: true }) accessor flat = false;
  /** Submitted with the form: the config as JSON */
  @property({ reflect: true }) accessor name = "";
  /** Turns every control off and leaves the config out of the form; a disabled fieldset does the same */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  @state() private accessor formDisabled = false;
  @state() private accessor announcement = "";

  private readonly internals: ElementInternals;
  private readonly uid = `tc-gc${++instances}`;
  private initialValue: GateConfigValue | null = null;
  private ownName = false;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }

  formResetCallback() {
    const value = this.initialValue ?? DEFAULT_VALUE;
    // Through tc-value-change like any edit, so a controlled wrapper hears of it and keeps the value until it agrees
    if (this.emit<GateValueChange>("tc-value-change", { value }, { cancelable: true })) this.value = value;
    else this.requestUpdate();
  }
  formDisabledCallback(disabled: boolean) {
    // Also called while `disabled` is reflected during an update, where a property change would be dropped – so after it
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }

  /** The config in one sentence */
  get summary(): string {
    return describeGate(this.value, { conditions: this.conditions, reviewers: this.reviewers, views: this.views, actions: this.actions });
  }

  private commit(patch: Partial<GateConfigValue>) {
    const next: GateConfigValue = { ...this.value, ...patch };
    if (this.emit<GateValueChange>("tc-value-change", { value: next }, { cancelable: true })) this.value = next;
    else this.requestUpdate();
  }
  /** Flips one id in a list, keeping the order the options are listed in */
  private flip(ids: string[], id: string, order: { id: string }[]) {
    const on = new Set(ids);
    if (on.has(id)) on.delete(id);
    else on.add(id);
    const known = order.map((o) => o.id).filter((x) => on.has(x));
    return [...known, ...[...on].filter((x) => !known.includes(x))];
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The reset baseline is what the first render shows, so props a framework sets after connecting (React does) count
    if (!this.hasUpdated) this.initialValue = this.value;
    this.toggleAttribute("data-disabled", this.isDisabled);
    if (changed.has("value") && changed.get("value") !== undefined) this.announcement = this.summary;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    this.syncForm();
  }

  private syncForm() {
    // Environments without form-associated custom elements (jsdom) skip it; every supported browser has it
    if (typeof this.internals.setFormValue !== "function") return;
    const disabled = this.isDisabled;
    this.internals.setFormValue(this.name && !disabled ? JSON.stringify(this.value) : null);
    if (!disabled && !this.value.actions.length) this.internals.setValidity({ valueMissing: true }, "Allow at least one action.", this.querySelector<HTMLElement>(".ui-gc__check") ?? undefined);
    else this.internals.setValidity({});
  }

  /** A labelled row: the label on the left, the control on the right (stacked when narrow) */
  private row(id: string, label: string, control: unknown) {
    return html`<div class="ui-gc__row" data-row=${id}><span class="ui-gc__label" id=${`${this.uid}-${id}`}>${label}</span><div class="ui-gc__control">${control}</div></div>`;
  }

  private renderConditions() {
    const on = new Set(this.value.triggers);
    const disabled = this.isDisabled;
    if (!this.conditions.length) return html`<p class="ui-gc__empty">No conditions to choose from</p>`;
    return html`<ul class="ui-gc__conds" aria-labelledby=${`${this.uid}-when`}>
      ${repeat(
        this.conditions,
        (c) => c.id,
        (c) => {
          const id = `${this.uid}-c-${c.id}`;
          return html`<li class="ui-gc__cond" ?data-on=${on.has(c.id)}>
            <label class="ui-gc__cond-text" for=${id}>
              <span class="ui-gc__cond-label" id=${`${id}-l`}>${c.label}</span>
              ${c.description ? html`<span class="ui-gc__cond-desc" id=${`${id}-d`}>${c.description}</span>` : nothing}
            </label>
            <button
              type="button"
              role="switch"
              id=${id}
              class="ui-gc__switch"
              data-id=${c.id}
              aria-checked=${on.has(c.id) ? "true" : "false"}
              aria-labelledby=${`${id}-l`}
              aria-describedby=${ifDefined(c.description ? `${id}-d` : undefined)}
              ?disabled=${disabled}
              @click=${() => this.commit({ triggers: this.flip(this.value.triggers, c.id, this.conditions) })}
            ><span></span></button>
          </li>`;
        },
      )}
    </ul>`;
  }

  private renderReviewer() {
    const v = this.value;
    const known = this.reviewers.some((r) => r.id === v.reviewer);
    return html`<span class="ui-gc__select">
      <select
        class="ui-gc__input"
        aria-labelledby=${`${this.uid}-who`}
        ?disabled=${this.isDisabled}
        @change=${(e: Event) => this.commit({ reviewer: (e.target as HTMLSelectElement).value })}
      >
        ${known ? nothing : html`<option value="" .selected=${live(true)} disabled>Pick a reviewer</option>`}
        ${this.reviewers.map((r) => html`<option value=${r.id} .selected=${live(r.id === v.reviewer)}>${r.label}</option>`)}
      </select>${chevronDown}
    </span>`;
  }

  private renderView(look: "standard" | "clean") {
    const v = this.value;
    const picked = this.views.find((x) => x.id === v.view);
    return html`<div class="ui-gc__view">
      <tc-segmented-control
        look=${look}
        class="ui-gc__seg"
        size="sm"
        aria-labelledby=${`${this.uid}-sees`}
        aria-describedby=${ifDefined(picked?.description ? `${this.uid}-sees-d` : undefined)}
        .options=${this.views.map((x) => ({ value: x.id, label: x.label })) as SegmentOption[]}
        .value=${v.view}
        ?disabled=${this.isDisabled}
        @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
          // The inner control's event stops here: the page hears this element's tc-value-change only
          e.stopPropagation();
          e.preventDefault();
          this.commit({ view: e.detail.value });
        }}
      ></tc-segmented-control>
      ${picked?.description ? html`<span class="ui-gc__hint" id=${`${this.uid}-sees-d`}>${picked.description}</span>` : nothing}
    </div>`;
  }

  private renderActions(clean: boolean) {
    const on = new Set(this.value.actions);
    const disabled = this.isDisabled;
    const none = !on.size;
    const noApprove = !none && !on.has("approve") && !on.has("edit") && this.actions.some((a) => a.id === "approve" || a.id === "edit");
    return html`<div class="ui-gc__actions">
      <div class="ui-gc__checks" role="group" aria-labelledby=${`${this.uid}-may`} aria-describedby=${ifDefined(none ? `${this.uid}-may-e` : undefined)}>
        ${repeat(
          this.actions,
          (a) => a.id,
          (a) => html`<button
            type="button"
            role="checkbox"
            class="ui-gc__check"
            data-id=${a.id}
            aria-checked=${on.has(a.id) ? "true" : "false"}
            ?disabled=${disabled}
            @click=${() => this.commit({ actions: this.flip(this.value.actions, a.id, this.actions) })}
          >
            <span class="ui-gc__box" aria-hidden="true">${check(clean)}</span>
            <span class="ui-gc__check-text">
              <span class="ui-gc__check-label">${a.label}</span>
              ${a.description ? html`<span class="ui-gc__check-desc">${a.description}</span>` : nothing}
            </span>
          </button>`,
        )}
      </div>
      ${none
        ? html`<span class="ui-gc__error" id=${`${this.uid}-may-e`}>Allow at least one action – a reviewer has to be able to answer</span>`
        : noApprove
          ? html`<span class="ui-gc__hint">Nothing gets approved here – the run can only go back or stop</span>`
          : nothing}
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const v = this.value;
    const count = this.conditions.filter((c) => v.triggers.includes(c.id)).length;
    const head = this.flat
      ? nothing
      : cardHead({
          icon: gateIcon,
          title: this.heading,
          subtitle: this.description,
          aside: html`<span class="ui-gc__pill" data-state=${count ? "on" : "off"}>${count ? `Pauses on ${count} of ${this.conditions.length}` : "Never pauses"}</span>`,
        });
    const body = html`
      <div class="ui-gc__rows">
        ${this.row("when", "Pauses when", this.renderConditions())}
        ${this.row("who", "Reviewer", this.renderReviewer())}
        ${this.views.length ? this.row("sees", "They see", this.renderView(look)) : nothing}
        ${this.row("may", "They may", this.renderActions(clean))}
        ${this.row(
          "why",
          "Why",
          html`<textarea
            class="ui-gc__input ui-gc__note"
            rows="2"
            aria-labelledby=${`${this.uid}-why`}
            placeholder=${this.placeholder}
            .value=${live(v.reason)}
            ?disabled=${this.isDisabled}
            @change=${(e: Event) => this.commit({ reason: (e.target as HTMLTextAreaElement).value })}
          ></textarea>`,
        )}
      </div>
      <div class="ui-gc__summary" data-state=${count ? "on" : "off"}>${sentenceIcon}<p class="ui-gc__sentence">${this.summary}</p></div>
    `;
    return html`
      <span class="ui-gc__sr" role="status">${this.announcement}</span>
      ${head}${clean || this.flat ? body : html`<div class="ui-gc__card">${body}</div>`}
    `;
  }

  static override css = /* css */ `
[data-ui="gcfg"] {
  display: flow-root;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 560px;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="gcfg"] *, [data-ui="gcfg"] *::before, [data-ui="gcfg"] *::after { box-sizing: border-box; }
:where([data-ui="gcfg"]) :is(p, ul) { margin: 0; padding: 0; }
:where([data-ui="gcfg"]) ul { list-style: none; }
/* Standard: a gray tray with the header on it, above a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="gcfg"]:not([flat]) {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
.ui-gc__card {
  display: flow-root;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
/* Clean: one white card with hairline shadows; the header is its first row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="gcfg"]:not([flat]) {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
/* Flat: no tray, no card – the rows sit in the caller's card */
[data-ui="gcfg"][flat] { max-width: none; }
.ui-gc__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.ui-gc__switch, .ui-gc__check { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-gc__switch:focus-visible, .ui-gc__check:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-gc__switch:disabled, .ui-gc__check:disabled, .ui-gc__input:disabled { cursor: not-allowed; opacity: 0.55; }

/* ---------- Header (cardHead): how often it pauses, at the right ---------- */
.ui-gc__pill { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-gc__pill[data-state="off"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }

/* ---------- Rows: a label column and the controls ---------- */
.ui-gc__rows { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="gcfg"]:not([flat]) .ui-gc__rows { padding-top: var(--tc-space-1); }
[data-ui="gcfg"][flat] .ui-gc__rows { padding: 0 0 var(--tc-space-3); }
.ui-gc__row { display: grid; grid-template-columns: 92px minmax(0, 1fr); align-items: start; gap: var(--tc-space-3); }
.ui-gc__label { display: flex; align-items: center; min-height: var(--tc-control-h-sm); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-gc__label { color: var(--tc-text-muted); }
.ui-gc__control { display: grid; gap: var(--tc-space-2); min-width: 0; min-height: var(--tc-control-h-sm); }
.ui-gc__hint { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-gc__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-gc__empty { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }

/* Conditions: a quiet list, each line with its switch on the right */
.ui-gc__conds { display: grid; }
.ui-gc__cond { display: flex; align-items: center; gap: var(--tc-space-3); min-height: 40px; padding: var(--tc-space-1-5) 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-gc__cond:first-child { padding-top: 0; border-top: 0; }
.ui-gc__cond-text { display: grid; flex: 1; min-width: 0; cursor: pointer; }
.ui-gc__cond-label { color: var(--tc-text-secondary); transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-gc__cond[data-on] .ui-gc__cond-label { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-gc__cond[data-on] .ui-gc__cond-label { font-weight: var(--tc-font-weight-medium); }
.ui-gc__cond-desc { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
/* The switch pattern; the off track is --tc-switch-off (≥ 3:1), on is the accent */
.ui-gc__switch {
  position: relative;
  flex: none;
  width: var(--tc-switch-w);
  height: var(--tc-switch-h);
  border-radius: var(--tc-switch-radius);
  background: var(--tc-switch-off) !important;
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-gc__switch[aria-checked="true"] { background: var(--tc-switch-on) !important; }
.ui-gc__switch span {
  position: absolute;
  top: var(--tc-space-0-5);
  left: var(--tc-space-0-5);
  width: var(--tc-switch-knob);
  height: var(--tc-switch-knob);
  border-radius: calc(var(--tc-switch-radius) - var(--tc-space-0-5));
  background: var(--tc-switch-knob-bg);
  box-shadow: var(--tc-shadow-control);
  transition: transform var(--tc-duration-moderate) var(--tc-ease-move);
}
.ui-gc__switch[aria-checked="true"] span { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
/* A hit area of at least 24 × 24 around the small switch */
.ui-gc__switch::after { content: ""; position: absolute; inset: -8px -6px; }

/* Reviewer: the field recipe, a native select */
.ui-gc__input {
  width: 100%;
  min-width: 0;
  height: var(--tc-field-h);
  margin: 0;
  padding: 0 var(--tc-field-px);
  border: 0;
  border-radius: var(--tc-field-radius);
  outline: 0;
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-field-font-size);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-gc__input:hover:not(:disabled) { box-shadow: var(--tc-field-shadow-hover); }
.ui-gc__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-gc__input::placeholder { color: var(--tc-text-placeholder); }
.ui-gc__select { position: relative; display: block; max-width: 320px; }
.ui-gc__select > select { padding-right: var(--tc-space-7); appearance: none; cursor: pointer; text-overflow: ellipsis; }
.ui-gc__chevron { position: absolute; top: 50%; right: var(--tc-space-2); width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }
.ui-gc__note { height: auto; min-height: 60px; max-height: 200px; field-sizing: content; padding: var(--tc-space-2) var(--tc-space-2-5); line-height: var(--tc-line-height-normal); resize: vertical; }
.ui-gc__view { display: grid; justify-items: start; gap: var(--tc-space-1-5); min-width: 0; }
.ui-gc__seg { max-width: 100%; }

/* Actions: filter-menu's checkboxes, two columns once there's room */
.ui-gc__actions { display: grid; gap: var(--tc-space-1-5); }
.ui-gc__checks { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-0-5) var(--tc-space-3); }
.ui-gc__check { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-gc__check:hover:not(:disabled) { background: var(--tc-fill-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-gc__check { border-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-gc__check:hover:not(:disabled) { background: var(--tc-fill-subtle); }
.ui-gc__check-text { display: grid; min-width: 0; }
.ui-gc__check-label { color: var(--tc-text-primary); }
.ui-gc__check-desc { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-gc__actions .ui-gc__check { margin-left: calc(-1 * var(--tc-space-2)); }
/* Checkbox: its edge is its only cue at rest, so it uses the control border (≥ 3:1) */
.ui-gc__box {
  display: grid;
  flex: none;
  place-items: center;
  background: var(--tc-surface-control);
  box-shadow: inset 0 0 0 1px var(--tc-border-control);
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-gc__box { width: 18px; height: 18px; margin-top: var(--tc-space-0-5); border-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-gc__box { width: 14px; height: 14px; margin-top: var(--tc-space-0-5); border-radius: var(--tc-radius-xs); }
.ui-gc__box svg { fill: none; stroke-linecap: round; stroke-linejoin: round; transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-gc__box svg { width: 13px; height: 13px; stroke: var(--tc-text-on-inverse); stroke-width: 2.2; stroke-dasharray: 20; stroke-dashoffset: 20; }
:where([data-look="clean"], [data-look="clean"] *).ui-gc__box svg { width: 12px; height: 12px; stroke: var(--tc-text-on-accent); stroke-width: 1.6; stroke-dasharray: 12; stroke-dashoffset: 12; }
:where([data-look="standard"], [data-look="standard"] *).ui-gc__check[aria-checked="true"] .ui-gc__box { background: var(--tc-surface-inverse); box-shadow: inset 0 0 0 1px var(--tc-surface-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-gc__check[aria-checked="true"] .ui-gc__box { background: var(--tc-accent); box-shadow: none; }
.ui-gc__check[aria-checked="true"] .ui-gc__box svg { stroke-dashoffset: 0; }

/* ---------- The sentence ---------- */
.ui-gc__summary {
  display: flex;
  align-items: flex-start;
  gap: var(--tc-space-2-5);
  margin: 0 var(--tc-space-4) var(--tc-space-4);
  padding: var(--tc-space-3) var(--tc-space-3-5);
  border-radius: var(--tc-radius-lg);
  background: var(--tc-fill-subtle);
}
[data-ui="gcfg"][flat] .ui-gc__summary { margin: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-gc__summary { border-radius: var(--tc-radius-md); background: var(--tc-accent-subtle); }
.ui-gc__summary[data-state="off"] { background: var(--tc-fill-subtle); }
.ui-gc__sentence-icon { flex: none; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); fill: none; stroke: var(--tc-text-secondary); stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-gc__sentence-icon { stroke: var(--tc-accent-text); stroke-width: 1.3; }
.ui-gc__summary[data-state="off"] .ui-gc__sentence-icon { stroke: var(--tc-icon-muted); }
.ui-gc__sentence { min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; animation: ui-gc-fade var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-gc__summary[data-state="off"] .ui-gc__sentence { color: var(--tc-text-secondary); }
@keyframes ui-gc-fade { from { opacity: 0.4; } }

@container (min-width: 500px) {
  .ui-gc__checks { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
/* Narrow: labels above their controls */
@container (max-width: 420px) {
  .ui-gc__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1); }
  .ui-gc__label { min-height: 0; }
  .ui-gc__rows { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-gc__summary { margin-left: var(--tc-space-3); margin-right: var(--tc-space-3); }
  .ui-gc__pill { display: none; }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
  .ui-gc__input:not(textarea) { height: 40px; }
  .ui-gc__check { min-height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-gc__sentence { animation: none; }
  .ui-gc__switch, .ui-gc__switch span, .ui-gc__box, .ui-gc__box svg, .ui-gc__check, .ui-gc__input, .ui-gc__cond-label { transition: none; }
}
[data-ui="gcfg"][data-disabled] .ui-gc__sentence { color: var(--tc-text-muted); }
`;
}

if (!customElements.get("tc-gate-config")) customElements.define("tc-gate-config", TcGateConfig);

declare global {
  interface HTMLElementTagNameMap {
    "tc-gate-config": TcGateConfig;
  }
}

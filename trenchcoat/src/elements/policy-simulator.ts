import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, ToolbarController } from "./internal/controllers";
import { duration } from "./internal/format";

/*
 * <tc-policy-simulator> – try an action against the policy set before it's real. The person describes the action,
 * picks its rule class and adds optional context; Simulate hands that to the app's `evaluate()` and shows what comes
 * back: the decision (allow, needs approval, deny or hard stop), the rule that decided it, the reason, and a
 * step-by-step trace of every rule that was checked. Nothing executes – the element only shows the answer.
 *   · the inputs are a form: Enter in the action field (⌘/Ctrl+Enter in the context) runs it
 *   · examples, when given, are a toolbar of chips that fill the form (arrows move between them)
 *   · the trace is a disclosure; the deciding rule is marked, rules after it read "not reached"
 *   · a result whose inputs have changed since is marked as out of date until it runs again
 * Standard: a white card on a gray tray, the result in a second card below it. Clean: one white card, the result
 * under a hairline.
 *
 *   <tc-policy-simulator .ruleClasses=${classes} .evaluate=${(input) => api.dryRun(input)}></tc-policy-simulator>
 */

export type PolicyDecision = "allow" | "require-approval" | "deny" | "hard-stop";
/** "matched": the rule applied; "no-match": checked, didn't apply; "skipped": not checked (another class, or after the decision) */
export type PolicyTraceOutcome = "matched" | "no-match" | "skipped";

export type PolicyRuleClass = {
  id: string;
  label: string;
  /** One quiet line shown under the field when this class is picked */
  description?: string;
};
/** What is simulated */
export type PolicySimInput = { action: string; ruleClass: string; context: string };
/** One rule checked, in the order the policy set checked it */
export type PolicyTraceStep = {
  /** The rule's name, e.g. "External send over limit" */
  rule: string;
  /** Its id – the step whose id is the result's `rule.id` is marked as the deciding one */
  ruleId?: string;
  outcome: PolicyTraceOutcome;
  /** Why it did or didn't apply, in a few words */
  detail?: string;
  /** What this rule would decide, for a matched rule */
  decision?: PolicyDecision;
  /** How long the check took, in ms */
  ms?: number;
};
export type PolicyMatchedRule = {
  id: string;
  name: string;
  /** Where the rule lives, e.g. "Outbound policy · v12" */
  source?: string;
};
export type PolicySimResult = {
  decision: PolicyDecision;
  /** The rule that decided it; unset when no rule matched and the default applied */
  rule?: PolicyMatchedRule;
  /** Why, in a sentence */
  reason: string;
  trace: PolicyTraceStep[];
};
/** A ready-made action the person can try with one click */
export type PolicySimExample = { label: string; action: string; ruleClass?: string; context?: string };

/** Details of the events */
export type PolicySimInputChange = { input: PolicySimInput; field: "action" | "ruleClass" | "context" | "example" };
export type PolicySimRun = { input: PolicySimInput };
export type PolicySimResultEvent = { input: PolicySimInput; result: PolicySimResult };

/** The rule classes used when the page gives none */
export const defaultPolicyRuleClasses: PolicyRuleClass[] = [
  { id: "read", label: "Read", description: "Looks something up; changes nothing" },
  { id: "write", label: "Write", description: "Creates or changes records" },
  { id: "communicate", label: "Communicate", description: "Sends something to a person or another system" },
  { id: "spend", label: "Spend", description: "Moves money or commits to a cost" },
  { id: "delete", label: "Delete", description: "Removes something that may not come back" },
];

/** The decisions' names used when the page gives none */
export const defaultPolicyDecisionLabels: Record<PolicyDecision, string> = {
  allow: "Allow",
  "require-approval": "Needs approval",
  deny: "Deny",
  "hard-stop": "Hard stop",
};

const OUTCOME_LABEL: Record<PolicyTraceOutcome, string> = { matched: "Matched", "no-match": "No match", skipped: "Not checked" };
const keyOf = (i: PolicySimInput) => JSON.stringify([i.action.trim(), i.ruleClass, i.context.trim()]);
let uidCount = 0;

/* Decision and trace marks – circle-check, user-check, ban, octagon-x, check, minus, chevron: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const DECISION_ICON: Record<PolicyDecision, () => ReturnType<typeof lucide>> = {
  allow: () => lucide(16, svg`<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>`),
  "require-approval": () => lucide(16, svg`<path d="m16 11 2 2 4-4"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>`),
  deny: () => lucide(16, svg`<circle cx="12" cy="12" r="10"></circle><path d="m4.9 4.9 14.2 14.2"></path>`),
  "hard-stop": () =>
    lucide(16, svg`<path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z"></path><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`),
};
const STEP_ICON: Record<PolicyTraceOutcome, () => ReturnType<typeof lucide>> = {
  matched: () => lucide(12, svg`<path d="M20 6 9 17l-5-5"></path>`),
  "no-match": () => lucide(12, svg`<path d="M5 12h14"></path>`),
  skipped: () => lucide(12, svg`<circle cx="12" cy="12" r="1"></circle>`),
};
const chevronDown = () => lucide(14, svg`<path d="m6 9 6 6 6-6"></path>`);

/**
 * A dry run of an action against a policy set: the decision, the rule that decided it, the reason and a step-by-step
 * rule trace. Nothing executes.
 * @tag tc-policy-simulator
 * @fires tc-input-change - The action, the rule class or the context changed, or an example filled them ({ input, field }: PolicySimInputChange); cancelable – prevented, the fields keep their values
 * @fires tc-simulate - Simulate was pressed with a described action ({ input }: PolicySimRun); cancelable – prevented, `evaluate` isn't called and the app sets `result` itself
 * @fires tc-result - `evaluate` returned a result ({ input, result }: PolicySimResultEvent)
 */
export class TcPolicySimulator extends TcElement {
  static override ui = "psim";

  /** The heading, and the form's name */
  @property() accessor heading = "Policy simulator";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The action to try, in words or as a tool call, e.g. "Send the Q3 report to an external address" */
  @property() accessor action = "";
  /** The id of the picked rule class; unset picks the first */
  @property({ attribute: "rule-class" }) accessor ruleClass = "";
  /** Optional context the rules can read, e.g. "amount: 4,800 · recipient: outside the company" */
  @property() accessor context = "";
  /** The rule classes to pick from */
  @property({ attribute: false }) accessor ruleClasses: PolicyRuleClass[] = defaultPolicyRuleClasses;
  /** Ready-made actions shown as chips above the form; [] hides them */
  @property({ attribute: false }) accessor examples: PolicySimExample[] = [];
  /** Runs the dry run: return the result, or a promise of it. Nothing in the element executes the action */
  @property({ attribute: false }) accessor evaluate: ((input: PolicySimInput) => PolicySimResult | Promise<PolicySimResult>) | undefined = undefined;
  /** The result shown – set by a run, or by the app (after preventing tc-simulate) */
  @property({ attribute: false }) accessor result: PolicySimResult | undefined = undefined;
  /** The decisions' names, merged over the defaults (Allow, Needs approval, Deny, Hard stop) */
  @property({ attribute: false }) accessor decisionLabels: Partial<Record<PolicyDecision, string>> = {};
  /** The action field's label */
  @property({ attribute: "action-label" }) accessor actionLabel = "Action";
  /** The action field's placeholder */
  @property({ attribute: "action-placeholder" }) accessor actionPlaceholder = "What should the agent do?";
  /** The rule class field's label */
  @property({ attribute: "class-label" }) accessor classLabel = "Rule class";
  /** The context field's label; the field is optional */
  @property({ attribute: "context-label" }) accessor contextLabel = "Context";
  /** The context field's placeholder */
  @property({ attribute: "context-placeholder" }) accessor contextPlaceholder = "Anything the rules should know – amount, recipient, environment";
  /** The Simulate button's text */
  @property({ attribute: "simulate-label" }) accessor simulateLabel = "Simulate";
  /** Shown when Simulate is pressed with no action */
  @property({ attribute: "required-label" }) accessor requiredLabel = "Describe the action to simulate.";
  /** Shown when `evaluate` throws or its promise rejects */
  @property({ attribute: "error-label" }) accessor errorLabel = "Couldn't run the simulation. Try again.";
  /** The reminder next to Simulate that nothing runs */
  @property({ attribute: "dry-run-label" }) accessor dryRunLabel = "Dry run – nothing is executed";

  @state() private accessor busy = false;
  @state() private accessor failed = false;
  @state() private accessor missing = false;
  @state() private accessor traceOpen = true;
  @state() private accessor announce = "";
  /** The inputs the shown result was made from */
  @state() private accessor resultFor = "";

  private uid = `tc-psim-${++uidCount}`;
  private runId = 0;
  private alive = false;
  private ownResult: PolicySimResult | undefined = undefined;
  private examplesBar = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-psim__example")] });

  constructor() {
    super();
    // Focus never drops to <body> when the trace toggle it was on goes away with the result
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-psim__run"));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.alive = true;
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.alive = false;
  }

  /* ---------- The model ---------- */

  private get input(): PolicySimInput {
    return { action: this.action, ruleClass: this.ruleClass || this.ruleClasses[0]?.id || "", context: this.context };
  }
  private label(d: PolicyDecision) {
    return this.decisionLabels[d] ?? defaultPolicyDecisionLabels[d];
  }

  private change(field: PolicySimInputChange["field"], next: Partial<PolicySimInput>, el?: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
    const input = { ...this.input, ...next };
    if (!this.emit<PolicySimInputChange>("tc-input-change", { input, field }, { cancelable: true })) {
      // Controlled: the field shows the property again until the app passes the new value back
      if (el) el.value = field === "action" ? this.action : field === "context" ? this.context : this.input.ruleClass;
      return;
    }
    this.action = input.action;
    this.ruleClass = input.ruleClass;
    this.context = input.context;
    if (input.action.trim()) this.missing = false;
  }

  private async run() {
    if (this.busy) return;
    const input = this.input;
    if (!input.action.trim()) {
      this.missing = true;
      this.querySelector<HTMLInputElement>(".ui-psim__action")?.focus();
      return;
    }
    this.failed = false;
    if (!this.emit<PolicySimRun>("tc-simulate", { input }, { cancelable: true }) || !this.evaluate) return;
    const id = ++this.runId;
    let out: PolicySimResult | Promise<PolicySimResult>;
    try {
      out = this.evaluate(input);
    } catch {
      this.failed = true;
      return;
    }
    let result: PolicySimResult;
    if (out && typeof (out as Promise<PolicySimResult>).then === "function") {
      this.busy = true;
      this.announce = "Simulating…";
      try {
        result = await out;
      } catch {
        if (this.alive && id === this.runId) {
          this.busy = false;
          this.failed = true;
          this.announce = this.errorLabel;
        }
        return;
      }
      if (!this.alive || id !== this.runId) return;
      this.busy = false;
    } else result = out as PolicySimResult;
    this.ownResult = result;
    this.result = result;
    this.resultFor = keyOf(input);
    this.traceOpen = true;
    this.announce = `${this.label(result.decision)}${result.rule ? ` – ${result.rule.name}` : ""}. ${result.reason}`;
    this.emit<PolicySimResultEvent>("tc-result", { input, result });
  }

  private pickExample(ex: PolicySimExample) {
    const known = ex.ruleClass && this.ruleClasses.some((c) => c.id === ex.ruleClass);
    this.change("example", { action: ex.action, ruleClass: known ? ex.ruleClass! : this.input.ruleClass, context: ex.context ?? "" });
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A result the app set itself belongs to the inputs it was set with
    if (changed.has("result") && this.result !== this.ownResult) {
      this.ownResult = this.result;
      this.resultFor = this.result ? keyOf(this.input) : "";
      if (this.result) this.announce = `${this.label(this.result.decision)}${this.result.rule ? ` – ${this.result.rule.name}` : ""}. ${this.result.reason}`;
    }
  }

  /* ---------- Rendering ---------- */

  private renderExamples() {
    if (!this.examples.length) return nothing;
    return html`<div class="ui-psim__examples-row">
      <span class="ui-psim__examples-label" id=${`${this.uid}-ex`}>Try</span>
      <div class="ui-psim__examples" role="toolbar" aria-labelledby=${`${this.uid}-ex`} @keydown=${this.examplesBar.onKeyDown} @focusin=${this.examplesBar.onFocusIn}>
        ${this.examples.map((ex) => html`<button type="button" class="ui-psim__example" title=${ex.action} @click=${() => this.pickExample(ex)}>${ex.label}</button>`)}
      </div>
    </div>`;
  }

  private renderForm() {
    const input = this.input;
    const cls = this.ruleClasses.find((c) => c.id === input.ruleClass);
    const id = this.uid;
    return html`<form
      class="ui-psim__form"
      aria-labelledby=${`${id}-title`}
      novalidate
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        void this.run();
      }}
    >
      <div class="ui-psim__field ui-psim__field--action">
        <label class="ui-psim__label" for=${`${id}-action`}>${this.actionLabel}</label>
        <input
          id=${`${id}-action`}
          class="ui-psim__input ui-psim__action"
          type="text"
          autocomplete="off"
          spellcheck="false"
          placeholder=${this.actionPlaceholder}
          .value=${live(input.action)}
          aria-invalid=${this.missing ? "true" : "false"}
          aria-describedby=${ifDefined(this.missing ? `${id}-missing` : undefined)}
          @input=${(e: Event) => this.change("action", { action: (e.target as HTMLInputElement).value }, e.target as HTMLInputElement)}
        />
        ${this.missing ? html`<p class="ui-psim__invalid" id=${`${id}-missing`}>${this.requiredLabel}</p>` : nothing}
      </div>
      ${this.ruleClasses.length
        ? html`<div class="ui-psim__field ui-psim__field--class">
            <label class="ui-psim__label" for=${`${id}-class`}>${this.classLabel}</label>
            <span class="ui-psim__select">
              <select
                id=${`${id}-class`}
                class="ui-psim__input"
                aria-describedby=${ifDefined(cls?.description ? `${id}-class-desc` : undefined)}
                @change=${(e: Event) => this.change("ruleClass", { ruleClass: (e.target as HTMLSelectElement).value }, e.target as HTMLSelectElement)}
              >
                ${this.ruleClasses.map((c) => html`<option value=${c.id} ?selected=${c.id === input.ruleClass}>${c.label}</option>`)}
              </select>
              ${chevronDown()}
            </span>
            ${cls?.description ? html`<p class="ui-psim__hint" id=${`${id}-class-desc`}>${cls.description}</p>` : nothing}
          </div>`
        : nothing}
      <div class="ui-psim__field ui-psim__field--context">
        <label class="ui-psim__label" for=${`${id}-context`}>${this.contextLabel}<span class="ui-psim__optional"> · optional</span></label>
        <textarea
          id=${`${id}-context`}
          class="ui-psim__input ui-psim__context"
          rows="2"
          spellcheck="false"
          placeholder=${this.contextPlaceholder}
          aria-keyshortcuts="Meta+Enter Control+Enter"
          .value=${live(input.context)}
          @input=${(e: Event) => this.change("context", { context: (e.target as HTMLTextAreaElement).value }, e.target as HTMLTextAreaElement)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !e.isComposing) {
              e.preventDefault();
              void this.run();
            }
          }}
        ></textarea>
      </div>
      <div class="ui-psim__run-row">
        <span class="ui-psim__dry">${lucide(14, svg`<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path>`)}${this.dryRunLabel}</span>
        <button type="submit" class="ui-psim__btn ui-psim__btn--primary ui-psim__run" aria-disabled=${this.busy ? "true" : "false"}>
          ${this.busy ? html`<svg class="ui-psim__spinner" viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="6"></circle>`}</svg>` : nothing}${this.simulateLabel}
        </button>
      </div>
      ${this.failed ? html`<p class="ui-psim__error" role="alert">${this.errorLabel}</p>` : nothing}
    </form>`;
  }

  private renderTrace(result: PolicySimResult) {
    const steps = result.trace;
    if (!steps.length) return nothing;
    const decidingAt = result.rule ? steps.findIndex((s) => s.ruleId === result.rule!.id) : -1;
    const checked = steps.filter((s) => s.outcome !== "skipped").length;
    const id = this.uid;
    return html`<div class="ui-psim__trace">
      <button type="button" class="ui-psim__trace-toggle" aria-expanded=${this.traceOpen ? "true" : "false"} aria-controls=${`${id}-trace`} @click=${() => (this.traceOpen = !this.traceOpen)}>
        <span class="ui-psim__trace-chev" aria-hidden="true">${chevronDown()}</span>
        <span>Rule trace</span>
        <span class="ui-psim__trace-count">${checked} of ${steps.length} checked</span>
      </button>
      <ol class="ui-psim__steps" id=${`${id}-trace`} ?hidden=${!this.traceOpen}>
        ${steps.map((s, i) => {
          const deciding = i === decidingAt;
          const after = decidingAt >= 0 && i > decidingAt;
          return html`<li class="ui-psim__step" data-outcome=${s.outcome} ?data-deciding=${deciding} ?data-after=${after} data-decision=${ifDefined(deciding ? result.decision : s.decision)}>
            <span class="ui-psim__step-mark" aria-hidden="true">${STEP_ICON[s.outcome]()}</span>
            <span class="ui-psim__step-body">
              <span class="ui-psim__step-head">
                <span class="ui-psim__step-name">${s.rule}</span>
                ${s.ruleId ? html`<code class="ui-psim__id">${s.ruleId}</code>` : nothing}
                ${deciding ? html`<span class="ui-psim__pill" data-decision=${result.decision}>Decides · ${this.label(result.decision)}</span>` : s.outcome === "matched" && s.decision ? html`<span class="ui-psim__pill" data-decision=${s.decision}>${this.label(s.decision)}</span>` : nothing}
              </span>
              <span class="ui-psim__step-detail"><span class="ui-psim__sr">${after && s.outcome === "skipped" ? "Not reached" : OUTCOME_LABEL[s.outcome]}. </span>${s.detail ?? (after && s.outcome === "skipped" ? "Not reached – an earlier rule decided" : OUTCOME_LABEL[s.outcome])}</span>
            </span>
            ${s.ms !== undefined ? html`<span class="ui-psim__step-ms">${duration(s.ms)}</span>` : nothing}
          </li>`;
        })}
      </ol>
    </div>`;
  }

  private renderResult() {
    const r = this.result;
    const id = this.uid;
    if (!r) return html`<section class="ui-psim__result" data-empty="" aria-labelledby=${`${id}-res`}>
      <h4 class="ui-psim__sr" id=${`${id}-res`}>Result</h4>
      <p class="ui-psim__empty">Simulate an action to see which rule decides and why.</p>
    </section>`;
    const stale = this.resultFor !== keyOf(this.input);
    return html`<section class="ui-psim__result" ?data-stale=${stale} aria-labelledby=${`${id}-res`} aria-busy=${this.busy ? "true" : "false"}>
      <div class="ui-psim__verdict" data-decision=${r.decision}>
        <span class="ui-psim__verdict-icon" aria-hidden="true">${DECISION_ICON[r.decision]()}</span>
        <div class="ui-psim__verdict-text">
          <h4 class="ui-psim__verdict-label" id=${`${id}-res`}><span class="ui-psim__sr">Decision: </span>${this.label(r.decision)}</h4>
          <p class="ui-psim__reason">${r.reason}</p>
        </div>
      </div>
      ${stale ? html`<p class="ui-psim__stale">The inputs changed since this run – simulate again to update it.</p>` : nothing}
      <dl class="ui-psim__rule">
        <dt>Rule</dt>
        <dd>${r.rule
          ? html`<span class="ui-psim__rule-name">${r.rule.name}</span><code class="ui-psim__id">${r.rule.id}</code>${r.rule.source ? html`<span class="ui-psim__rule-source">${r.rule.source}</span>` : nothing}`
          : html`<span class="ui-psim__rule-none">No rule matched – the default applied</span>`}</dd>
      </dl>
      ${this.renderTrace(r)}
    </section>`;
  }

  protected override render() {
    // The header (.tc-head): on the tray above the form card in Standard, the first row in Clean
    return html`
      <span class="ui-psim__sr" role="status">${this.announce}</span>
      ${cardHead({
        icon: svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>`,
        title: this.heading,
        id: `${this.uid}-title`,
        subtitle: this.description || undefined,
      })}
      <div class="ui-psim__card">
        ${this.renderExamples()}
        ${this.renderForm()}
      </div>
      ${this.renderResult()}
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding the form card and the result card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="psim"] {
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
/* Clean: one quiet white card; the result is its last section */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="psim"] {
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
[data-ui="psim"] *, [data-ui="psim"] *::before, [data-ui="psim"] *::after { box-sizing: border-box; }
:where([data-ui="psim"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="psim"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="psim"] h3, [data-ui="psim"] h4, [data-ui="psim"] p, [data-ui="psim"] dl, [data-ui="psim"] dd, [data-ui="psim"] ol { margin: 0; }
[data-ui="psim"] ol { padding: 0; list-style: none; }
[data-ui="psim"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="psim"] svg[stroke-width] { stroke-width: 1.5; }
.ui-psim__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-psim__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- Examples ----- */
.ui-psim__examples-row { display: flex; align-items: flex-start; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) 0; }
.ui-psim__examples-label { flex: none; padding: var(--tc-space-1) 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-psim__examples-label { font-weight: var(--tc-font-weight-medium); }
.ui-psim__examples { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); min-width: 0; }
.ui-psim__example { max-width: 100%; overflow: hidden; padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); white-space: nowrap; text-overflow: ellipsis; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-psim__example { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-psim__example:hover { box-shadow: var(--tc-action-secondary-shadow-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-psim__example { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-psim__example:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
/* ----- The form ----- */
.ui-psim__form { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-3); padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); }
.ui-psim__field { display: grid; gap: var(--tc-space-1-5); min-width: 0; align-content: start; }
.ui-psim__label { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-psim__label { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-psim__optional { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
/* Fields: the field recipe */
.ui-psim__input { width: 100%; min-width: 0; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: 0; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-psim__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-psim__input:focus-visible, .ui-psim__input:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-psim__input::placeholder { color: var(--tc-text-placeholder); }
.ui-psim__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-psim__context { height: auto; min-height: calc(var(--tc-field-h) * 1.75); padding: var(--tc-space-2) var(--tc-field-px); line-height: var(--tc-line-height-snug); resize: vertical; }
.ui-psim__select { position: relative; display: flex; min-width: 0; }
.ui-psim__select > select { padding-right: var(--tc-space-7); appearance: none; cursor: pointer; text-overflow: ellipsis; }
.ui-psim__select > svg { position: absolute; top: 50%; right: var(--tc-space-2-5); color: var(--tc-icon-muted); transform: translateY(-50%); pointer-events: none; }
.ui-psim__hint { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-psim__invalid, .ui-psim__error { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-danger-fg); }
.ui-psim__run-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-psim__dry { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-psim__dry > svg { color: var(--tc-icon-muted); }
/* Button's primary recipe, medium */
.ui-psim__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-2); height: var(--tc-control-h-md); margin-left: auto; padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-psim__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-psim__btn--primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-psim__btn--primary:active { background: var(--tc-action-primary-bg-active); transform: scale(0.98); }
.ui-psim__btn[aria-disabled="true"] { cursor: progress; }
.ui-psim__spinner { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-dasharray: 26 38; animation: ui-psim-spin var(--tc-duration-shimmer) linear infinite; }
/* ----- The result ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-psim__result { margin-top: var(--tc-tray-inset); padding: var(--tc-space-4); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-psim__result { padding: var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-psim__result:not([data-empty]) { animation: ui-psim-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-psim__result[data-empty] { padding: var(--tc-space-3) var(--tc-space-4); background: transparent; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-psim__empty { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-align: center; }
.ui-psim__result[aria-busy="true"] > :not(.ui-psim__sr) { opacity: 0.55; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-psim__verdict { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: var(--tc-space-3); }
.ui-psim__verdict-icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-lg); }
.ui-psim__verdict[data-decision="allow"] .ui-psim__verdict-icon { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-psim__verdict[data-decision="require-approval"] .ui-psim__verdict-icon { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-psim__verdict[data-decision="deny"] .ui-psim__verdict-icon { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-psim__verdict[data-decision="hard-stop"] .ui-psim__verdict-icon { background: var(--tc-status-danger-solid); color: var(--tc-text-on-accent); }
.ui-psim__verdict-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-psim__verdict-label { font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); color: var(--tc-title-color); }
.ui-psim__verdict[data-decision="deny"] .ui-psim__verdict-label, .ui-psim__verdict[data-decision="hard-stop"] .ui-psim__verdict-label { color: var(--tc-status-danger-fg); }
.ui-psim__reason { line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-psim__stale { margin-top: var(--tc-space-3) !important; padding: var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-warning-fg); }
.ui-psim__result[data-stale] .ui-psim__verdict-icon { opacity: 0.5; }
.ui-psim__rule { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: var(--tc-space-1) var(--tc-space-4); margin-top: var(--tc-space-3-5) !important; padding-top: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-psim__rule dt { color: var(--tc-text-muted); line-height: var(--tc-line-height-snug); }
.ui-psim__rule dd { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-2); min-width: 0; line-height: var(--tc-line-height-snug); }
.ui-psim__rule-name { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-psim__rule-source { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-psim__rule-none { color: var(--tc-text-secondary); }
.ui-psim__id { padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
/* The trace: a disclosure over the rules in the order they were checked */
.ui-psim__trace { margin-top: var(--tc-space-3); }
.ui-psim__trace-toggle { display: flex; align-items: center; gap: var(--tc-space-1-5); width: 100%; padding: var(--tc-space-1) 0; border-radius: var(--tc-radius-sm); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-psim__trace-chev { display: grid; place-items: center; color: var(--tc-icon-muted); transform: rotate(-90deg); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-psim__trace-toggle[aria-expanded="true"] .ui-psim__trace-chev { transform: none; }
.ui-psim__trace-count { margin-left: auto; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-psim__steps { display: grid; margin-top: var(--tc-space-1-5) !important; }
.ui-psim__steps[hidden] { display: none; }
.ui-psim__step { position: relative; display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; align-items: start; gap: var(--tc-space-2-5); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-md); animation: ui-psim-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
/* The line joining the marks, as in a trace */
.ui-psim__step:not(:last-child)::before { content: ""; position: absolute; top: calc(var(--tc-space-1-5) + 22px); bottom: calc(-1 * var(--tc-space-1-5) + 2px); left: calc(var(--tc-space-2) + 10px); width: var(--tc-hairline); background: var(--tc-border-default); }
.ui-psim__step-mark { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: var(--tc-fill-default); color: var(--tc-icon-muted); }
.ui-psim__step[data-outcome="matched"] .ui-psim__step-mark { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-psim__step[data-outcome="skipped"] .ui-psim__step-mark { background: transparent; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-psim__step[data-deciding] { background: var(--tc-fill-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-psim__step[data-deciding] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-psim__step[data-deciding][data-decision="allow"] .ui-psim__step-mark { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-psim__step[data-deciding][data-decision="require-approval"] .ui-psim__step-mark { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-psim__step[data-deciding][data-decision="deny"] .ui-psim__step-mark { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-psim__step[data-deciding][data-decision="hard-stop"] .ui-psim__step-mark { background: var(--tc-status-danger-solid); color: var(--tc-text-on-accent); }
.ui-psim__step-body { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-psim__step-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-1-5); min-width: 0; }
.ui-psim__step-name { min-width: 0; color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
.ui-psim__step[data-deciding] .ui-psim__step-name { font-weight: var(--tc-font-weight-medium); }
.ui-psim__step-detail { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-psim__step[data-outcome="skipped"] .ui-psim__step-name { color: var(--tc-text-muted); }
.ui-psim__step-ms { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-psim__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-psim__pill[data-decision="allow"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-psim__pill[data-decision="require-approval"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-psim__pill[data-decision="deny"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-psim__pill[data-decision="hard-stop"] { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 1px var(--tc-status-danger-solid); color: var(--tc-status-danger-fg); }
@keyframes ui-psim-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-psim-spin { to { transform: rotate(360deg); } }
/* Wider containers: the action and its class side by side */
@container (min-width: 520px) {
  .ui-psim__form { grid-template-columns: minmax(0, 1fr) minmax(0, 13rem); }
  .ui-psim__field--context, .ui-psim__run-row, .ui-psim__error { grid-column: 1 / -1; }
  .ui-psim__form:not(:has(.ui-psim__field--class)) .ui-psim__field--action { grid-column: 1 / -1; }
}
@container (max-width: 400px) {
  .ui-psim__example { flex: none; max-width: none; }
  .ui-psim__examples { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
  .ui-psim__run-row .ui-psim__btn { flex: 1 1 100%; }
  .ui-psim__step { grid-template-columns: 20px minmax(0, 1fr); }
  .ui-psim__step-ms { grid-column: 2; padding-top: 0; }
}
@media (pointer: coarse) {
  .ui-psim__btn { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="psim"] *, [data-ui="psim"] *::before, [data-ui="psim"] *::after { animation: none !important; transition: none !important; }
  .ui-psim__spinner { animation: ui-psim-spin var(--tc-duration-shimmer) linear infinite !important; }
}
`;
}

if (!customElements.get("tc-policy-simulator")) customElements.define("tc-policy-simulator", TcPolicySimulator);

declare global {
  interface HTMLElementTagNameMap {
    "tc-policy-simulator": TcPolicySimulator;
  }
}

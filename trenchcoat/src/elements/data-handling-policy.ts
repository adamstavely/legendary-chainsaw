import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";

/*
 * <tc-data-handling-policy> – what happens to an organization's data, as a lifecycle: Conversations (kept for a
 * period) → Logs (off, metadata or full content, with categories such as personal details redacted) → Memory (off,
 * this conversation, across conversations) → Training (used or not) → Deleted (after the retention period, or on
 * request). Each stage leads with the policy the app reports as in effect; under it, "Changing to …" when the choice
 * hasn't been applied yet, "Not reported" when the app hasn't said. A lock marks a stage set higher up – "Set by your
 * organization" – and its controls can't be changed.
 *   · each stage is a disclosure button: Enter or Space opens its controls in place, under the lifecycle, and moves
 *     focus to them; Done or Escape closes them and returns focus to the stage. One stage is open at a time.
 *   · the controls: segmented choices (arrow keys, Home and End), redaction checkboxes and the training switch (Space)
 *   · below, deletion requests as a small status list; Request deletion asks first, in a modal dialog with the scope:
 *     focus moves to Cancel, Tab and Shift+Tab stay inside it, Escape cancels, and focus returns to Request deletion
 * The element enforces nothing. Every change fires a cancelable tc-value-change ({ value, field }); the app saves the
 * policy, applies it and reports `effective`. tc-deletion-request asks the app to delete; it reports status through
 * `deletions`. With `name` it's a form control: the form gets the policy as JSON.
 * Standard: the header on a gray tray above a white card, the stages as filled tiles joined by chevrons, the open one outlined. Clean:
 * one white card, the stages as columns between hairlines, the open one with an accent rule, quieter type and thinner
 * icons. Narrow, the lifecycle runs down the card.
 *
 *   <tc-data-handling-policy .value=${policy} .effective=${applied} .locks=${[{ field: "training" }]}></tc-data-handling-policy>
 */

/** The policy */
export type DataHandlingPolicyValue = {
  /** The id of a retention option */
  retention: string;
  /** The id of a memory option */
  memory: string;
  /** The id of a logging option */
  logging: string;
  /** The ids of the categories redacted from logs */
  redact: string[];
  /** Whether conversations may be used for model training */
  training: boolean;
};
/** One of the policy's settings */
export type DataPolicyField = keyof DataHandlingPolicyValue;
/** A choice for retention, memory, logging or a deletion's scope */
export type DataPolicyOption = {
  id: string;
  /** "30 days" */
  label: string;
  /** Shown under the choice when it's picked */
  description?: string;
  /** Why it can't be picked, e.g. "Longer than your organization allows" – the option is shown but disabled */
  unavailable?: string;
};
/** A kind of data that can be redacted from logs */
export type DataPolicyCategory = { id: string; label: string; description?: string };
/** A setting fixed higher up. With `category`, only that redaction category is fixed */
export type DataPolicyLock = {
  field: DataPolicyField;
  category?: string;
  /** Who set it; unset, "your organization" */
  by?: string;
  /** Why, shown under the setting */
  note?: string;
};
/** A deletion request and how far it has got, as the app reports it */
export type DataPolicyDeletion = {
  id: string;
  /** What's deleted, e.g. "Conversations" */
  label: string;
  state: "received" | "in-progress" | "completed" | "failed";
  /** A quiet line, e.g. "Requested 24 Oct by Priya Shah" */
  detail?: string;
};
/** Details of the events */
/** `field` is null when a form reset puts back the whole policy */
export type DataPolicyChange = { value: DataHandlingPolicyValue; field: DataPolicyField | null };
export type DataPolicyDeletionEvent = { scope: DataPolicyOption };

export const DATA_POLICY_RETENTION: DataPolicyOption[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "1y", label: "1 year" },
  { id: "forever", label: "Until deleted" },
];
export const DATA_POLICY_MEMORY: DataPolicyOption[] = [
  { id: "off", label: "Off", description: "Nothing is remembered between messages beyond the conversation itself." },
  { id: "conversation", label: "This conversation", description: "Remembered facts are forgotten when the conversation ends." },
  { id: "persistent", label: "Across conversations", description: "Remembered facts are kept until someone deletes them." },
];
export const DATA_POLICY_LOGGING: DataPolicyOption[] = [
  { id: "off", label: "Off", description: "Nothing is logged." },
  { id: "metadata", label: "Metadata", description: "Timing, model and token counts – no message content." },
  { id: "content", label: "Full content", description: "Messages and responses, with the categories below redacted." },
];
export const DATA_POLICY_CATEGORIES: DataPolicyCategory[] = [
  { id: "personal", label: "Personal details", description: "Names, email addresses, phone numbers" },
  { id: "financial", label: "Payment details", description: "Card and bank account numbers" },
  { id: "credentials", label: "Credentials", description: "Passwords, keys and tokens" },
  { id: "health", label: "Health information", description: "Conditions, treatments, records" },
];
export const DATA_POLICY_DELETION_SCOPES: DataPolicyOption[] = [
  { id: "conversations", label: "Conversations", description: "Every conversation and its attachments." },
  { id: "memory", label: "Memory", description: "Everything remembered across conversations." },
  { id: "logs", label: "Logs", description: "Logged messages and metadata." },
];
const DEFAULT_VALUE: DataHandlingPolicyValue = { retention: "30d", memory: "conversation", logging: "metadata", redact: ["personal", "financial", "credentials"], training: false };
const FIELDS: DataPolicyField[] = ["retention", "memory", "logging", "redact", "training"];
const DEFAULT_LABELS: Record<DataPolicyField, string> = { retention: "Conversations", memory: "Memory", logging: "Logs", redact: "Redact from logs", training: "Training" };
/** The lifecycle, in order: four stages you can edit and where the data ends */
type DataPolicyStage = "retention" | "logging" | "memory" | "training" | "deleted";
const STAGES: DataPolicyStage[] = ["retention", "logging", "memory", "training", "deleted"];
const STATE_LABEL: Record<DataPolicyDeletion["state"], string> = { received: "Received", "in-progress": "In progress", completed: "Completed", failed: "Failed" };

/** "Full content" → "full content"; "1 year" stays */
const lower = (t: string) => (/^[A-Z](?![A-Z])/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
const same = (field: DataPolicyField, a: DataHandlingPolicyValue[DataPolicyField], b: DataHandlingPolicyValue[DataPolicyField]) =>
  field === "redact" ? sameSet(a as string[], b as string[]) : a === b;
let instances = 0;

/* Shield, lock, check, clock, trash-2: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const shieldIcon = svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>`;
const lockIcon = () => lucide(12, svg`<rect width="16" height="10" x="4" y="11" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path>`);
const checkIcon = () => lucide(12, svg`<path d="M20 6 9 17l-5-5"></path>`);
const clockIcon = () => lucide(12, svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>`);
const trashIcon = (size = 14) => lucide(size, svg`<path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>`);
const chevron = () => lucide(14, svg`<path d="m9 18 6-6-6-6"></path>`);
/* Message-square, file-text, database, cpu: Lucide (ISC, lucide.dev) */
const STAGE_ICON: Record<DataPolicyStage, () => ReturnType<typeof lucide>> = {
  retention: () => lucide(14, svg`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>`),
  logging: () => lucide(14, svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>`),
  memory: () => lucide(14, svg`<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14a9 3 0 0 0 18 0V5"></path><path d="M3 12a9 3 0 0 0 18 0"></path>`),
  training: () => lucide(14, svg`<rect width="16" height="16" x="4" y="4" rx="2"></rect><rect width="6" height="6" x="9" y="9" rx="1"></rect><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"></path>`),
  deleted: () => trashIcon(14),
};
const tick = (clean: boolean) =>
  clean ? html`<svg viewBox="0 0 16 16">${svg`<path d="m4.25 8.25 2.5 2.5 5-5.5"></path>`}</svg>` : html`<svg viewBox="0 0 24 24">${svg`<path d="m6 12.5 4 4 8-9"></path>`}</svg>`;

/**
 * Organization-level data handling as a lifecycle – conversations, logs, memory, training, deletion – led by the policy
 * in effect, each stage edited in place, locked stages marked, and deletion requests with their status.
 * @tag tc-data-handling-policy
 * @fires tc-value-change - A setting changed, or a form reset put them all back with field null ({ value, field }: DataPolicyChange); cancelable – prevent it to control `value`
 * @fires tc-deletion-request - A deletion was confirmed ({ scope }: DataPolicyDeletionEvent); cancelable – prevented, no pending request is shown
 */
export class TcDataHandlingPolicy extends TcElement {
  static override ui = "dhp";
  static formAssociated = true;

  /** The chosen policy. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: DataHandlingPolicyValue = DEFAULT_VALUE;
  /** The policy the app reports as applied; a missing field reads "Not reported" */
  @property({ attribute: false }) accessor effective: Partial<DataHandlingPolicyValue> | undefined = undefined;
  /** Settings fixed higher up; they can't be edited here and say who set them */
  @property({ attribute: false }) accessor locks: DataPolicyLock[] = [];
  /** How long conversations can be kept */
  @property({ attribute: false }) accessor retentionOptions: DataPolicyOption[] = DATA_POLICY_RETENTION;
  /** How memory can persist */
  @property({ attribute: false }) accessor memoryOptions: DataPolicyOption[] = DATA_POLICY_MEMORY;
  /** How much can be logged */
  @property({ attribute: false }) accessor loggingOptions: DataPolicyOption[] = DATA_POLICY_LOGGING;
  /** The kinds of data that can be redacted from logs */
  @property({ attribute: false }) accessor categories: DataPolicyCategory[] = DATA_POLICY_CATEGORIES;
  /** What a deletion request can cover; empty hides Request deletion */
  @property({ attribute: false }) accessor deletionScopes: DataPolicyOption[] = DATA_POLICY_DELETION_SCOPES;
  /** Deletion requests and their status, as the app reports them */
  @property({ attribute: false }) accessor deletions: DataPolicyDeletion[] = [];
  /** The stages' and settings' names, merged over the defaults (Conversations, Logs, Memory, Training, Redact from logs) */
  @property({ attribute: false }) accessor labels: Partial<Record<DataPolicyField, string>> = {};
  /** The heading */
  @property() accessor heading = "Data handling";
  /** A quieter line under the heading, e.g. which workspace this is */
  @property() accessor description = "";
  /** The last stage's name */
  @property({ attribute: "deleted-label" }) accessor deletedLabel = "Deleted";
  /** The training switch's label */
  @property({ attribute: "training-label" }) accessor trainingLabel = "Allow conversations to be used to train models";
  /** Who a lock without `by` was set by */
  @property() accessor organization = "your organization";
  /** Said in the deletion dialog, under the scope */
  @property({ attribute: "deletion-note" }) accessor deletionNote = "Deletion can't be undone. It can take a while; the request's status shows here.";
  /** Submitted with the form: the policy as JSON */
  @property({ reflect: true }) accessor name = "";
  /** Turns every control off and leaves the policy out of the form; a disabled fieldset does the same */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  @state() private accessor formDisabled = false;
  @state() private accessor announcement = "";
  @state() private accessor confirming = false;
  @state() private accessor scope = "";
  /** The stage whose controls are open under the lifecycle */
  @state() private accessor editing: DataPolicyStage | null = null;
  /** A request the app accepted and hasn't listed yet; `was` is the list's ids then */
  @state() private accessor pending: { label: string; was: string } | null = null;

  private readonly internals: ElementInternals;
  private readonly uid = `tc-dhp${++instances}`;
  private initialValue: DataHandlingPolicyValue | null = null;
  private opener: HTMLElement | null = null;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.dialogEl?.open) this.dialogEl.close();
  }

  formResetCallback() {
    const value = this.initialValue ?? DEFAULT_VALUE;
    // Through tc-value-change like any edit, so a controlled wrapper hears of it and keeps the value until it agrees
    if (this.emit<DataPolicyChange>("tc-value-change", { value, field: null }, { cancelable: true })) this.value = value;
    else this.requestUpdate();
  }
  formDisabledCallback(disabled: boolean) {
    // Also called while `disabled` is reflected during an update, where a property change would be dropped – so after it
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }

  /* ---------- The model ---------- */

  private label(field: DataPolicyField) {
    return this.labels[field] ?? DEFAULT_LABELS[field];
  }
  private lock(field: DataPolicyField, category?: string) {
    return this.locks.find((l) => l.field === field && (l.category === undefined || l.category === category));
  }
  private lockText(lock: DataPolicyLock) {
    return `Set by ${lock.by ?? this.organization}`;
  }
  private options(field: "retention" | "memory" | "logging") {
    return field === "retention" ? this.retentionOptions : field === "memory" ? this.memoryOptions : this.loggingOptions;
  }
  /** How a field reads, for the effective line */
  private describe(field: DataPolicyField, v: DataHandlingPolicyValue[DataPolicyField]) {
    if (field === "training") return v ? "Allowed" : "Not allowed";
    if (field === "redact") {
      const ids = v as string[];
      const names = this.categories.filter((c) => ids.includes(c.id)).map((c) => c.label);
      return names.length ? names.join(", ") : "Nothing redacted";
    }
    return this.options(field).find((o) => o.id === v)?.label ?? String(v);
  }
  /** Fields whose reported effect differs from the choice */
  private get behind(): DataPolicyField[] {
    const e = this.effective;
    if (!e) return [];
    return FIELDS.filter((f) => e[f] !== undefined && !same(f, e[f]!, this.value[f]));
  }

  private commit(field: DataPolicyField, patch: Partial<DataHandlingPolicyValue>) {
    if (this.isDisabled || this.lock(field)) return;
    const next: DataHandlingPolicyValue = { ...this.value, ...patch };
    if (this.emit<DataPolicyChange>("tc-value-change", { value: next, field }, { cancelable: true })) this.value = next;
    else this.requestUpdate();
  }
  private flip(id: string) {
    const on = new Set(this.value.redact);
    if (on.has(id)) on.delete(id);
    else on.add(id);
    const known = this.categories.map((c) => c.id).filter((x) => on.has(x));
    return [...known, ...[...on].filter((x) => !known.includes(x))];
  }

  /** Why the form can't submit the policy: a retention period that isn't offered or isn't allowed */
  private get invalid() {
    const r = this.retentionOptions.find((o) => o.id === this.value.retention);
    return !r ? "Pick how long conversations are kept." : r.unavailable ? `${r.label} isn't allowed: ${r.unavailable}` : "";
  }

  /* ---------- Deletion ---------- */

  private get dialogEl() {
    return this.querySelector<HTMLDialogElement>(".ui-dhp__dialog");
  }
  private ask(opener: HTMLElement) {
    if (this.isDisabled || !this.deletionScopes.length) return;
    this.opener = opener;
    // Only a scope it can delete is picked for the person; with none, nothing is
    const usable = this.deletionScopes.filter((s) => !s.unavailable);
    this.scope = usable.some((s) => s.id === this.scope) ? this.scope : (usable[0]?.id ?? "");
    this.confirming = true;
    void this.updateComplete.then(() => {
      const d = this.dialogEl;
      if (!d) return;
      if (!d.open) {
        if (typeof d.showModal === "function") d.showModal();
        else d.setAttribute("open", "");
      }
      d.querySelector<HTMLElement>(".ui-dhp__cancel")?.focus();
    });
  }
  private close() {
    if (!this.confirming) return;
    const d = this.dialogEl;
    if (d?.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
    const focus = this.opener;
    this.confirming = false;
    this.opener = null;
    void this.updateComplete.then(() => (focus?.isConnected ? focus : this.querySelector<HTMLElement>(".ui-dhp__request"))?.focus());
  }
  private confirm() {
    const scope = this.deletionScopes.find((s) => s.id === this.scope);
    // Checked again here: a scope can become unavailable while the dialog is open
    if (!scope || scope.unavailable) return;
    if (this.emit<DataPolicyDeletionEvent>("tc-deletion-request", { scope }, { cancelable: true })) {
      this.pending = { label: scope.label, was: this.deletions.map((d) => d.id).join("|") };
      this.announcement = `Deletion of ${scope.label.toLowerCase()} requested.`;
    }
    this.close();
  }
  private onDialogKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
      return;
    }
    if (e.key !== "Tab") return;
    // Tab and Shift+Tab stay inside the dialog; the scope's segmented control is one stop
    const items = [...(this.dialogEl?.querySelectorAll<HTMLElement>("button") ?? [])].filter((el) => !el.hasAttribute("disabled") && el.tabIndex >= 0);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || !this.dialogEl?.contains(at))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && at === last) {
      e.preventDefault();
      first.focus();
    }
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The reset baseline is what the first render shows, so props a framework sets after connecting (React does) count
    if (!this.hasUpdated) this.initialValue = this.value;
    this.toggleAttribute("data-disabled", this.isDisabled);
    // The app listed a new request: the pending one is no longer needed (compared by ids, so equal data doesn't end it)
    if (this.pending && changed.has("deletions") && this.deletions.map((d) => d.id).join("|") !== this.pending.was) this.pending = null;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.setAttribute("aria-label", this.heading);
    // Environments without form-associated custom elements (jsdom) skip it; every supported browser has it
    if (typeof this.internals.setFormValue !== "function") return;
    const disabled = this.isDisabled;
    this.internals.setFormValue(this.name && !disabled ? JSON.stringify(this.value) : null);
    const invalid = disabled ? "" : this.invalid;
    if (invalid) this.internals.setValidity({ customError: true }, invalid, this.querySelector<HTMLElement>('[data-row="retention"] tc-segmented-control') ?? undefined);
    else this.internals.setValidity({});
  }

  /* ---------- Rendering ---------- */

  /** What happens to the data at a stage, in a few words, for a value of its field */
  private happens(stage: DataPolicyStage, v: DataHandlingPolicyValue) {
    switch (stage) {
      case "retention": {
        const label = this.describe("retention", v.retention);
        return /^\d/.test(label) ? `Kept ${label}` : label;
      }
      case "logging":
        return this.describe("logging", v.logging);
      case "memory":
        return this.describe("memory", v.memory);
      case "training":
        return v.training ? "Used to train models" : "Not used for training";
      default: {
        const r = this.retentionOptions.find((o) => o.id === v.retention);
        return r && /^\d/.test(r.label) ? `After ${r.label}` : "Only on request";
      }
    }
  }
  /** The fields a stage shows */
  private fieldsOf(stage: DataPolicyStage): DataPolicyField[] {
    return stage === "deleted" ? ["retention"] : stage === "logging" ? ["logging", "redact"] : [stage];
  }
  /** Where a stage stands: the app's report matches the choice, is behind it, or is missing */
  private standing(stage: DataPolicyStage): "match" | "behind" | "unknown" {
    const e = this.effective;
    const fields = this.fieldsOf(stage);
    if (!e || fields.some((f) => e[f] === undefined)) return "unknown";
    return fields.every((f) => same(f, e[f]!, this.value[f])) ? "match" : "behind";
  }
  /** The effective value where it's reported, the choice where it isn't */
  private get shown(): DataHandlingPolicyValue {
    return { ...this.value, ...Object.fromEntries(Object.entries(this.effective ?? {}).filter(([, v]) => v !== undefined)) };
  }

  private open(stage: DataPolicyStage) {
    if (this.editing === stage) return this.closePanel();
    this.editing = stage;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-dhp__panel .ui-dhp__panel-title")?.focus());
  }
  private closePanel() {
    const was = this.editing;
    if (!was) return;
    this.editing = null;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-dhp__stage-btn[data-stage="${was}"]`)?.focus());
  }

  private renderFlow() {
    const shown = this.shown;
    return html`<ol class="ui-dhp__flow" aria-label="Data lifecycle">
      ${STAGES.map((stage, i) => {
        const editable = stage !== "deleted";
        const lock = this.fieldsOf(stage)
          .map((f) => this.lock(f))
          .find(Boolean);
        const standing = this.standing(stage);
        const open = this.editing === stage;
        // What it's changing to: the stage's main setting as chosen, or its redaction when only that differs
        const main = this.fieldsOf(stage)[0];
        const e = this.effective;
        const next = e && e[main] !== undefined && same(main, e[main]!, this.value[main]) ? "" : this.describe(main, this.value[main]);
        const redacted = stage === "logging" && shown.logging !== "off" ? shown.redact.filter((id) => this.categories.some((c) => c.id === id)).length : -1;
        const active = this.deletions.filter((d) => d.state === "received" || d.state === "in-progress").length + (this.pending ? 1 : 0);
        const body = html`<span class="ui-dhp__stage-top">
            <span class="ui-dhp__stage-icon" aria-hidden="true">${STAGE_ICON[stage]()}</span>
            <span class="ui-dhp__stage-name">${this.stageLabel(stage)}</span>
            ${lock ? html`<span class="ui-dhp__stage-lock" title=${this.lockText(lock)}>${lockIcon()}<span class="ui-dhp__sr">, ${this.lockText(lock)}</span></span>` : nothing}
          </span>
          <span class="ui-dhp__stage-what">${this.happens(stage, shown)}</span>
          ${redacted >= 0 ? html`<span class="ui-dhp__stage-line">${redacted ? `${redacted} ${redacted === 1 ? "kind" : "kinds"} redacted` : "Nothing redacted"}</span>` : nothing}
          ${stage === "deleted" ? html`<span class="ui-dhp__stage-line">${active ? `${active} ${active === 1 ? "request" : "requests"} open` : "Or on request"}</span>` : nothing}
          ${standing === "behind"
            ? html`<span class="ui-dhp__stage-state" data-state="behind">${clockIcon()}${next ? `Changing to ${lower(next)}` : "Redaction changing"}</span>`
            : standing === "unknown"
              ? html`<span class="ui-dhp__stage-state" data-state="unknown">Not reported</span>`
              : nothing}`;
        return html`<li class="ui-dhp__stage" data-stage=${stage} data-state=${standing} ?data-open=${open} ?data-locked=${!!lock}>
          ${i ? html`<span class="ui-dhp__arrow" aria-hidden="true">${chevron()}</span>` : nothing}
          ${editable
            ? html`<button type="button" class="ui-dhp__stage-btn" data-stage=${stage} aria-expanded=${open ? "true" : "false"} aria-controls=${`${this.uid}-panel`} @click=${() => this.open(stage)}>${body}</button>`
            : html`<div class="ui-dhp__stage-btn" data-stage=${stage}>${body}</div>`}
        </li>`;
      })}
    </ol>`;
  }

  private stageLabel(stage: DataPolicyStage) {
    return stage === "deleted" ? this.deletedLabel : this.label(stage);
  }

  private renderEffective(field: DataPolicyField) {
    const e = this.effective?.[field];
    if (e === undefined) return html`<span class="ui-dhp__effect" data-state="unknown">${clockIcon()}Not reported</span>`;
    const ok = same(field, e, this.value[field]);
    return html`<span class="ui-dhp__effect" data-state=${ok ? "match" : "behind"}
      >${ok ? checkIcon() : clockIcon()}<span>In effect: ${this.describe(field, e)}${ok ? "" : " – not yet your choice"}</span></span
    >`;
  }

  /** A field's controls with what's in effect and its lock */
  private field(field: DataPolicyField, label: string, control: unknown, hint: string | undefined) {
    const id = `${this.uid}-${field}`;
    const lock = this.lock(field);
    return html`<div class="ui-dhp__field" data-field=${field} ?data-locked=${!!lock}>
      ${label ? html`<span class="ui-dhp__label" id=${id}>${label}</span>` : nothing}
      ${control} ${hint ? html`<span class="ui-dhp__hint" id=${`${id}-hint`}>${hint}</span>` : nothing}
      <span class="ui-dhp__meta">${lock ? html`<span class="ui-dhp__lock" id=${`${id}-lock`}>${lockIcon()}${this.lockText(lock)}</span>` : nothing}${this.renderEffective(field)}</span>
      ${lock?.note ? html`<span class="ui-dhp__hint">${lock.note}</span>` : nothing}
    </div>`;
  }

  private renderChoice(field: "retention" | "memory" | "logging", label: string, look: "standard" | "clean") {
    const id = `${this.uid}-${field}`;
    const lock = this.lock(field);
    const opts = this.options(field);
    const picked = opts.find((o) => o.id === this.value[field]);
    const unavailable = opts.filter((o) => o.unavailable);
    const hint = picked?.unavailable ? `${picked.label} isn't allowed: ${picked.unavailable}` : (picked?.description ?? (unavailable.length ? unavailable[0].unavailable : undefined));
    const describedBy = [hint ? `${id}-hint` : "", lock ? `${id}-lock` : ""].filter(Boolean).join(" ");
    return this.field(
      field,
      label,
      html`<tc-segmented-control
        look=${look}
        class="ui-dhp__seg"
        size="sm"
        aria-labelledby=${id}
        aria-describedby=${ifDefined(describedBy || undefined)}
        .options=${opts.map((o) => ({ value: o.id, label: o.label, disabled: !!o.unavailable })) as SegmentOption[]}
        .value=${this.value[field]}
        ?disabled=${this.isDisabled || !!lock}
        @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
          // The inner control's event stops here: the page hears this element's tc-value-change only
          e.stopPropagation();
          e.preventDefault();
          this.commit(field, { [field]: e.detail.value });
        }}
      ></tc-segmented-control>`,
      hint,
    );
  }

  private renderRedaction(clean: boolean) {
    const id = `${this.uid}-redact`;
    const on = new Set(this.value.redact);
    const all = this.lock("redact");
    const control = this.categories.length
      ? html`<div class="ui-dhp__checks" role="group" aria-labelledby=${id}>
          ${repeat(
            this.categories,
            (c) => c.id,
            (c) => {
              const lock = all ?? this.lock("redact", c.id);
              return html`<button
                type="button"
                role="checkbox"
                class="ui-dhp__check"
                data-id=${c.id}
                aria-checked=${on.has(c.id) ? "true" : "false"}
                ?disabled=${this.isDisabled || !!lock}
                @click=${() => !this.lock("redact", c.id) && this.commit("redact", { redact: this.flip(c.id) })}
              >
                <span class="ui-dhp__box" aria-hidden="true">${tick(clean)}</span>
                <span class="ui-dhp__check-text">
                  <span class="ui-dhp__check-label">${c.label}${lock && !all ? html`<span class="ui-dhp__lock ui-dhp__lock--inline">${lockIcon()}${this.lockText(lock)}</span>` : nothing}</span>
                  ${c.description ? html`<span class="ui-dhp__check-desc">${c.description}</span>` : nothing}
                </span>
              </button>`;
            },
          )}
        </div>`
      : html`<span class="ui-dhp__hint">No categories to redact.</span>`;
    return this.field("redact", this.label("redact"), control, this.value.logging === "off" ? "Applies when logging is on." : undefined);
  }

  private renderTraining() {
    const id = `${this.uid}-training`;
    const lock = this.lock("training");
    const flip = () => this.commit("training", { training: !this.value.training });
    return this.field(
      "training",
      "",
      html`<span class="ui-dhp__toggle">
        <button
          type="button"
          role="switch"
          class="ui-dhp__switch"
          aria-checked=${this.value.training ? "true" : "false"}
          aria-labelledby=${`${id}-switch`}
          aria-describedby=${ifDefined(lock ? `${id}-lock` : undefined)}
          ?disabled=${this.isDisabled || !!lock}
          @click=${flip}
        ><span></span></button>
        <span class="ui-dhp__toggle-label" id=${`${id}-switch`} @click=${flip}>${this.trainingLabel}</span>
      </span>`,
      undefined,
    );
  }

  /** The open stage's controls, in place under the lifecycle */
  private renderPanel(look: "standard" | "clean") {
    const stage = this.editing;
    if (!stage || stage === "deleted") return nothing;
    const id = `${this.uid}-panel`;
    const clean = look === "clean";
    const body =
      stage === "retention"
        ? this.renderChoice("retention", "Keep conversations for", look)
        : stage === "memory"
          ? this.renderChoice("memory", "Remember facts", look)
          : stage === "logging"
            ? html`${this.renderChoice("logging", "Log", look)}${this.renderRedaction(clean)}`
            : this.renderTraining();
    return html`<section
      class="ui-dhp__panel"
      id=${id}
      data-stage=${stage}
      aria-labelledby=${`${id}-title`}
      style=${`--dhp-at: ${STAGES.indexOf(stage)}`}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        this.closePanel();
      }}
    >
      <div class="ui-dhp__panel-head">
        <h4 class="ui-dhp__panel-title" id=${`${id}-title`} tabindex="-1">${this.stageLabel(stage)}</h4>
        <button type="button" class="ui-dhp__btn ui-dhp__btn--ghost ui-dhp__done" @click=${() => this.closePanel()}>Done</button>
      </div>
      ${body}
    </section>`;
  }

  private renderDeletions() {
    const list = this.deletions;
    const id = `${this.uid}-del`;
    return html`<section class="ui-dhp__deletions" aria-labelledby=${id}>
      <div class="ui-dhp__del-head">
        <h4 class="ui-dhp__section" id=${id}>Deletion requests${list.length ? html`<span class="ui-dhp__count">${list.length}</span>` : nothing}</h4>
        ${this.deletionScopes.length
          ? html`<button type="button" class="ui-dhp__btn ui-dhp__btn--secondary ui-dhp__btn--sm ui-dhp__request" aria-haspopup="dialog" ?disabled=${this.isDisabled} @click=${(e: Event) => this.ask(e.currentTarget as HTMLElement)}>
              ${trashIcon(13)}Request deletion
            </button>`
          : nothing}
      </div>
      ${list.length || this.pending
        ? html`<ul class="ui-dhp__list">
            ${this.pending
              ? html`<li class="ui-dhp__del" data-state="pending">
                  <span class="ui-dhp__del-name">${this.pending.label}</span>
                  <span class="ui-dhp__del-detail">Waiting for confirmation</span>
                  <span class="ui-dhp__state" data-state="pending">Requested</span>
                </li>`
              : nothing}
            ${repeat(
              list,
              (d) => d.id,
              (d) => html`<li class="ui-dhp__del" data-state=${d.state}>
                <span class="ui-dhp__del-name">${d.label}</span>
                <span class="ui-dhp__del-detail">${d.detail ?? ""}</span>
                <span class="ui-dhp__state" data-state=${d.state}>${STATE_LABEL[d.state]}</span>
              </li>`,
            )}
          </ul>`
        : html`<p class="ui-dhp__none">No deletion requests.</p>`}
    </section>`;
  }

  private renderDialog(look: "standard" | "clean") {
    const id = this.uid;
    const scope = this.deletionScopes.find((s) => s.id === this.scope);
    const why = scope
      ? scope.unavailable
        ? `${scope.label} can't be deleted: ${scope.unavailable}`
        : ""
      : `Nothing can be deleted right now.${this.deletionScopes[0]?.unavailable ? ` ${this.deletionScopes[0].unavailable}` : ""}`;
    return html`<dialog
      class="ui-dhp__dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby=${`${id}-dlg-title`}
      aria-describedby=${`${id}-dlg-desc`}
      @keydown=${this.onDialogKey}
      @cancel=${(e: Event) => {
        e.preventDefault();
        this.close();
      }}
    >
      ${!this.confirming
        ? nothing
        : html`<div class="ui-dhp__dlg">
            <div class="ui-dhp__dlg-head">
              <span class="ui-dhp__dlg-icon" aria-hidden="true">${trashIcon(18)}</span>
              <h3 class="ui-dhp__dlg-title" id=${`${id}-dlg-title`}>Request deletion?</h3>
            </div>
            <div class="ui-dhp__dlg-body">
              <span class="ui-dhp__dlg-label" id=${`${id}-scope`}>What to delete</span>
              <tc-segmented-control
                look=${look}
                size="sm"
                class="ui-dhp__seg"
                aria-labelledby=${`${id}-scope`}
                .options=${this.deletionScopes.map((s) => ({ value: s.id, label: s.label, disabled: !!s.unavailable })) as SegmentOption[]}
                .value=${this.scope}
                @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
                  e.stopPropagation();
                  this.scope = e.detail.value;
                }}
              ></tc-segmented-control>
              <div id=${`${id}-dlg-desc`} class="ui-dhp__dlg-desc">
                ${why ? html`<p class="ui-dhp__dlg-lead">${why}</p>` : scope?.description ? html`<p class="ui-dhp__dlg-lead">${scope.description}</p>` : nothing}
                <p class="ui-dhp__dlg-note">${this.deletionNote}</p>
              </div>
            </div>
            <div class="ui-dhp__dlg-actions">
              <button type="button" class="ui-dhp__btn ui-dhp__btn--secondary ui-dhp__cancel" @click=${() => this.close()}>Cancel</button>
              <button type="button" class="ui-dhp__btn ui-dhp__btn--danger ui-dhp__confirm" ?disabled=${!!why} @click=${() => this.confirm()}>${trashIcon()}Delete${scope ? ` ${scope.label.toLowerCase()}` : ""}</button>
            </div>
          </div>`}
    </dialog>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const behind = this.behind;
    const reported = this.effective ? FIELDS.filter((f) => this.effective![f] !== undefined).length : 0;
    const [pill, tone] = !reported
      ? ["Not reported", "neutral"]
      : behind.length
        ? [behind.length === 1 ? "1 change pending" : `${behind.length} changes pending`, "warning"]
        : reported < FIELDS.length
          ? ["Partly reported", "neutral"]
          : ["In effect", "success"];
    return html`
      <span class="ui-dhp__sr" role="status">${this.announcement}</span>
      ${cardHead({ icon: shieldIcon, title: this.heading, subtitle: this.description, aside: html`<span class="ui-dhp__pill" data-tone=${tone}>${pill}</span>` })}
      <div class="ui-dhp__card">
        ${this.renderFlow()} ${this.renderPanel(look)} ${this.renderDeletions()}
      </div>
      ${this.renderDialog(look)}
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dhp"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-muted);
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dhp"] {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  color: var(--tc-text-secondary);
}
[data-ui="dhp"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 760px;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: var(--tc-tracking-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="dhp"] *, [data-ui="dhp"] *::before, [data-ui="dhp"] *::after { box-sizing: border-box; }
:where([data-ui="dhp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="dhp"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="dhp"] button:disabled { cursor: not-allowed; }
[data-ui="dhp"] :is(ul) { margin: 0; padding: 0; list-style: none; }
[data-ui="dhp"] :is(h3, h4, p) { margin: 0; }
[data-ui="dhp"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dhp"] svg[stroke-width] { stroke-width: 1.5; }
.ui-dhp__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dhp__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }

/* ----- Header (cardHead): on the tray in Standard, the card's first row in Clean; the state pill at its right ----- */
.ui-dhp__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-muted); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-none); white-space: nowrap; }
.ui-dhp__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-dhp__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }

/* ----- The lifecycle: what happens to the data, stage by stage, as the app reports it ----- */
.ui-dhp__flow { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--tc-space-2-5); padding: var(--tc-space-4); }
.ui-dhp__stage { position: relative; display: grid; min-width: 0; }
.ui-dhp__arrow { position: absolute; top: 50%; left: calc(-1 * var(--tc-space-2-5)); display: grid; place-items: center; width: var(--tc-space-2-5); color: var(--tc-icon-muted); transform: translateY(-50%); }
.ui-dhp__arrow > svg { width: 12px; height: 12px; }
.ui-dhp__stage-btn { display: grid; align-content: start; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
/* Standard: filled tiles; the open one is raised and outlined */
:where([data-look="standard"], [data-look="standard"] *).ui-dhp__stage-btn { background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
:where([data-look="standard"], [data-look="standard"] *)button.ui-dhp__stage-btn:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-dhp__stage[data-open] .ui-dhp__stage-btn { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
/* Clean: columns between hairlines; the open one gets an accent rule */
:where([data-look="clean"], [data-look="clean"] *).ui-dhp__flow { gap: 0; padding: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-dhp__stage-btn { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3-5); border-radius: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-dhp__stage + .ui-dhp__stage { box-shadow: inset 1px 0 0 var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-dhp__arrow { display: none; }
:where([data-look="clean"], [data-look="clean"] *)button.ui-dhp__stage-btn:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-dhp__stage[data-open] .ui-dhp__stage-btn { background: var(--tc-accent-subtle); box-shadow: inset 0 -2px 0 var(--tc-accent); }
.ui-dhp__stage-top { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-dhp__stage-icon { display: grid; place-items: center; color: var(--tc-icon-muted); }
.ui-dhp__stage-name { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; }
.ui-dhp__stage-lock { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-dhp__stage-what { color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); overflow-wrap: break-word; }
:where([data-look="clean"], [data-look="clean"] *).ui-dhp__stage-what { font-weight: var(--tc-font-weight-regular); }
.ui-dhp__stage-line { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-dhp__stage-state { display: inline-flex; align-items: flex-start; gap: var(--tc-space-1); margin-top: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-dhp__stage-state > svg { margin-top: var(--tc-space-0-5); }
.ui-dhp__stage-state[data-state="behind"] { color: var(--tc-status-warning-fg); }
.ui-dhp__stage-state[data-state="unknown"] { color: var(--tc-text-muted); }

/* ----- The open stage's controls, in place under the lifecycle ----- */
.ui-dhp__panel { display: grid; gap: var(--tc-space-4); margin: 0 var(--tc-space-4) var(--tc-space-4); padding: var(--tc-space-4); border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-selected); animation: ui-dhp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-dhp__panel { margin: 0; padding: var(--tc-space-4); border-radius: 0; background: none; box-shadow: inset 0 var(--tc-hairline) 0 var(--tc-divider); }
.ui-dhp__panel-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); margin-bottom: calc(-1 * var(--tc-space-1)); }
.ui-dhp__panel-title { color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); outline: 0; }
.ui-dhp__field { display: grid; justify-items: start; gap: var(--tc-space-1-5); min-width: 0; }
.ui-dhp__label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-dhp__seg { max-width: 100%; }
.ui-dhp__hint { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-dhp__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); }
/* What the app reports as applied */
.ui-dhp__effect { display: inline-flex; align-items: flex-start; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-dhp__effect > svg { margin-top: var(--tc-space-0-5); }
.ui-dhp__effect[data-state="match"] { color: var(--tc-text-secondary); }
.ui-dhp__effect[data-state="match"] > svg { color: var(--tc-status-success-fg); }
.ui-dhp__effect[data-state="behind"] { color: var(--tc-status-warning-fg); }
.ui-dhp__effect[data-state="unknown"] { color: var(--tc-text-muted); }
/* A locked setting says who set it */
.ui-dhp__lock { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-dhp__lock--inline { margin-left: var(--tc-space-1-5); vertical-align: 1px; }

/* Redaction: checkboxes, two columns once there's room */
.ui-dhp__checks { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-0-5) var(--tc-space-3); justify-self: stretch; margin-left: calc(-1 * var(--tc-space-2)); }
.ui-dhp__check { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-dhp__check:hover:not(:disabled) { background: var(--tc-fill-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-dhp__check { border-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-dhp__check:hover:not(:disabled) { background: var(--tc-fill-subtle); }
.ui-dhp__check-text { display: grid; min-width: 0; }
.ui-dhp__check-label { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-dhp__check-desc { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-dhp__check:disabled .ui-dhp__box { opacity: 0.55; }
.ui-dhp__box { display: grid; flex: none; place-items: center; background: var(--tc-surface-control); box-shadow: inset 0 0 0 1px var(--tc-border-control); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-dhp__box { width: 16px; height: 16px; margin-top: var(--tc-space-0-5); border-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-dhp__box { width: 14px; height: 14px; margin-top: var(--tc-space-0-5); border-radius: var(--tc-radius-xs); }
.ui-dhp__box svg { fill: none; stroke-linecap: round; stroke-linejoin: round; transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-dhp__box svg { width: 12px; height: 12px; stroke: var(--tc-text-on-inverse); stroke-width: 2.2; stroke-dasharray: 20; stroke-dashoffset: 20; }
:where([data-look="clean"], [data-look="clean"] *).ui-dhp__box svg { width: 12px; height: 12px; stroke: var(--tc-text-on-accent); stroke-width: 1.6; stroke-dasharray: 12; stroke-dashoffset: 12; }
:where([data-look="standard"], [data-look="standard"] *).ui-dhp__check[aria-checked="true"] .ui-dhp__box { background: var(--tc-surface-inverse); box-shadow: inset 0 0 0 1px var(--tc-surface-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-dhp__check[aria-checked="true"] .ui-dhp__box { background: var(--tc-accent); box-shadow: none; }
.ui-dhp__check[aria-checked="true"] .ui-dhp__box svg { stroke-dashoffset: 0; }

/* Training: the switch pattern; the off track is --tc-switch-off (≥ 3:1), on is the accent */
.ui-dhp__toggle { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: var(--tc-control-h-sm); }
.ui-dhp__toggle-label { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); cursor: pointer; }
.ui-dhp__field[data-locked] .ui-dhp__toggle-label { color: var(--tc-text-secondary); cursor: default; }
.ui-dhp__switch { position: relative; flex: none; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off) !important; transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-dhp__switch[aria-checked="true"] { background: var(--tc-switch-on) !important; }
.ui-dhp__switch:disabled { opacity: 0.55; }
.ui-dhp__switch span { position: absolute; top: var(--tc-space-0-5); left: var(--tc-space-0-5); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: calc(var(--tc-switch-radius) - var(--tc-space-0-5)); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-dhp__switch[aria-checked="true"] span { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-dhp__switch::after { content: ""; position: absolute; inset: -8px -6px; }

/* ----- Deletion requests: a small status list ----- */
.ui-dhp__deletions { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-dhp__del-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); }
.ui-dhp__section { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-dhp__count { display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; letter-spacing: var(--tc-tracking-normal); text-transform: none; }
.ui-dhp__list { display: grid; }
.ui-dhp__del { display: grid; grid-template-columns: minmax(6rem, auto) minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-3); min-height: 36px; padding: var(--tc-space-1) 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-dhp__del + .ui-dhp__del { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-dhp__del-name { color: var(--tc-text-primary); }
.ui-dhp__del-detail { overflow: hidden; color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-dhp__state { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-dhp__state[data-state="pending"], .ui-dhp__state[data-state="received"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-dhp__state[data-state="in-progress"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-dhp__state[data-state="completed"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-dhp__state[data-state="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-dhp__del[data-state="pending"] { animation: ui-dhp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-dhp__none { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }

/* ----- Buttons ----- */
.ui-dhp__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-dhp__btn:active:not(:disabled) { transform: scale(0.98); }
.ui-dhp__btn--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-dhp__btn--secondary:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-dhp__btn--danger { background: var(--tc-action-danger-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-danger-fg); }
.ui-dhp__btn--danger:hover { background: var(--tc-action-danger-bg-hover); }
.ui-dhp__btn:disabled { opacity: 0.55; }
.ui-dhp__btn--sm { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); }
.ui-dhp__btn--ghost { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); }
.ui-dhp__btn--ghost:hover { background: var(--tc-action-ghost-bg-hover); }
.ui-dhp__request > svg { color: var(--tc-status-danger-fg); }

/* ----- The deletion dialog ----- */
.ui-dhp__dialog { width: min(460px, calc(100vw - 2 * var(--tc-space-4))); max-height: calc(100vh - 2 * var(--tc-space-4)); margin: auto; padding: 0; overflow: auto; border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); color: var(--tc-text-secondary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); text-align: left; }
.ui-dhp__dialog:not([open]) { display: none; }
.ui-dhp__dialog::backdrop { background: var(--tc-scrim); }
.ui-dhp__dialog[open] { animation: ui-dhp-pop var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-dhp__dlg { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-5); }
.ui-dhp__dlg-head { display: flex; align-items: center; gap: var(--tc-space-3); }
.ui-dhp__dlg-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: var(--tc-radius-lg); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-dhp__dlg-title { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-primary); }
.ui-dhp__dlg-body { display: grid; justify-items: start; gap: var(--tc-space-2); }
.ui-dhp__dlg-label { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); }
.ui-dhp__dlg-desc { display: grid; gap: var(--tc-space-2); }
.ui-dhp__dlg-lead { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
.ui-dhp__dlg-note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-dhp__dlg-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); }
@keyframes ui-dhp-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-dhp-pop { from { opacity: 0; transform: translateY(6px) scale(0.98); } }

@container (min-width: 600px) {
  .ui-dhp__checks { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
/* Narrow: the lifecycle runs down the card, one stage a row */
@container (max-width: 600px) {
  .ui-dhp__flow { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1-5); }
  .ui-dhp__arrow { display: none; }
  .ui-dhp__stage-btn { grid-template-columns: minmax(0, 7rem) minmax(0, 1fr); align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-3); }
  .ui-dhp__stage-btn > :not(.ui-dhp__stage-top) { grid-column: 2; }
  :where([data-look="clean"], [data-look="clean"] *).ui-dhp__flow { gap: 0; }
  :where([data-look="clean"], [data-look="clean"] *).ui-dhp__stage + .ui-dhp__stage { box-shadow: inset 0 1px 0 var(--tc-divider); }
  :where([data-look="clean"], [data-look="clean"] *).ui-dhp__stage-btn { padding: var(--tc-space-2-5) var(--tc-space-4); }
}
@container (max-width: 400px) {
  .ui-dhp__flow { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-dhp__stage-btn { grid-template-columns: minmax(0, 1fr); }
  .ui-dhp__stage-btn > :not(.ui-dhp__stage-top) { grid-column: 1; }
  :where([data-look="standard"], [data-look="standard"] *).ui-dhp__panel { margin-left: var(--tc-space-3); margin-right: var(--tc-space-3); padding: var(--tc-space-3); }
  .ui-dhp__deletions { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-dhp__del { grid-template-columns: minmax(0, 1fr) auto; }
  .ui-dhp__del-detail { grid-row: 2; }
}
@media (max-width: 400px) {
  .ui-dhp__dlg { padding: var(--tc-space-4); }
  .ui-dhp__dlg-actions > .ui-dhp__btn { flex: 1 1 0; }
}
@media (pointer: coarse) {
  .ui-dhp__btn { height: 40px; }
  .ui-dhp__check { min-height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="dhp"] *, [data-ui="dhp"] *::before, [data-ui="dhp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-data-handling-policy")) customElements.define("tc-data-handling-policy", TcDataHandlingPolicy);

declare global {
  interface HTMLElementTagNameMap {
    "tc-data-handling-policy": TcDataHandlingPolicy;
  }
}

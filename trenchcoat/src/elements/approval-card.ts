import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-approval-card> – the Lit port of src/components/approval-card.tsx: an AI agent asks before it does something
 * consequential. A header with the action, a risk badge and a preview (recipients, key-value details), then "Always
 * allow this action" in a white card; Approve / Deny (⌘↵ / Esc) sit on the gray tray below it. An optional countdown
 * ("Expires in 0:42") sits quietly in the tray and pauses while you hover or focus the card (or the tab is hidden);
 * "Stop" turns it off. After a decision the tray footer folds away into a compact row.
 *
 *   <tc-approval-card heading="Send campaign email" risk="high" expires-in="45"></tc-approval-card>
 *
 * The host is the group (role="group"), named by the heading (by the resolved row once decided). Clean is one white
 * card: a risk tag, the preview as plain rows under a hairline, and – by default (actions="card") – a last row holding
 * "Always allow this action" and Deny / Approve; with actions="tray" the buttons sit on a gray tray below the card.
 *
 * Optional decision detail (all off unless set, so the card is unchanged without them): `why` – "Why you're seeing
 * this", one line; `consequences` – "If you approve / If you deny"; `editableDetails` – an "Edit arguments" mode that
 * turns the text details into fields (each change fires a cancelable tc-details-change); `evidence` – chips that open
 * the sources the request rests on. Two more show what exactly would change: `diff` – a file change as a small unified
 * diff (+ / −, and "Added:" / "Removed:" for screen readers) – and `args` – the call's arguments as a readable code block.
 * With `editableArgs`, Edit beside the arguments turns each one into a field – text, number, a yes / no box or a choice
 * from `argsSchema`, anything else as JSON checked as it's typed. Changed arguments say "Edited" and a diff against the
 * original sits under the block; Approve becomes "Approve with changes" and its events carry `args` and `edited`.
 */

// The header icon: a shield with a check – a request to approve
const shieldIcon = svg`<path d="M12 3 5 5.8v5.4c0 4.3 2.9 8.2 7 9.8 4.1-1.6 7-5.5 7-9.8V5.8L12 3Z"></path><path d="m9.2 12.2 2 2 3.8-4"></path>`;

export type ApprovalStatus = "pending" | "approved" | "denied";
export type ApprovalRisk = "low" | "medium" | "high";
/** A key-value row of the preview: the value is text or an element (cloned) */
export type ApprovalDetail = {
  label: string;
  value: string | Element;
  /** With `editableDetails`: false keeps this row read-only. Element values are always read-only */
  editable?: boolean;
};
export type DenyReason = "user" | "timeout";
/** What happens either way, one sentence each */
export type ApprovalConsequences = { approve?: string; deny?: string };
/** A source the request rests on, shown as a chip: a link with `href`, else a button that fires tc-evidence-select */
export type ApprovalEvidence = {
  label: string;
  /** A quiet second part, e.g. "p. 4" or "2 h ago" */
  detail?: string;
  /** Opens in a new tab */
  href?: string;
};

/** One line of a file change: unchanged context, an added line or a removed one */
export type ApprovalDiffLine = { kind: "context" | "add" | "remove"; text: string };
/** A file change shown as a small unified diff */
export type ApprovalDiff = { path: string; lines: ApprovalDiffLine[] };
/** The call's arguments – any JSON-like value, shown as a readable code block */
export type ApprovalArgs = Record<string, unknown>;
/** What one argument may be, in JSON Schema's words: a type, a list of choices, a friendlier name */
export type ApprovalArgSchema = { type?: "string" | "number" | "integer" | "boolean" | "object" | "array"; enum?: (string | number | boolean)[]; title?: string; description?: string };
/** The arguments' schema – a JSON Schema object's `properties`, the subset the editor reads */
export type ApprovalArgsSchema = { properties?: Record<string, ApprovalArgSchema>; required?: string[] };

/** Details of the events */
export type ApprovalStatusChange = {
  status: ApprovalStatus;
  /** With `editableArgs`, on approve: the arguments as approved – edited or not */
  args?: ApprovalArgs;
  /** With `editableArgs`, on approve: whether any argument was changed */
  edited?: boolean;
};
/** What onApprove is called with */
export type ApprovalDecision = { always: boolean; args?: ApprovalArgs; edited?: boolean };
export type ApprovalDeny = { reason: DenyReason };
export type ApprovalDetailsChange = { details: ApprovalDetail[]; index: number; label: string; value: string };
export type ApprovalEvidenceSelect = { evidence: ApprovalEvidence; index: number };

const RISK_LABEL: Record<ApprovalRisk, string> = { low: "Low", medium: "Medium", high: "High" };
/** The countdown announces itself once, this long before it runs out */
const WARN_AT = 20_000;

/** Escape belongs to the content it was pressed in (a field or menu inside the preview), not to Deny */
const ownsEscape = (el: Element | null) => !!el?.closest?.(".ui-ap__custom, .ui-ap__details, .ui-ap__argform, textarea, select, [contenteditable=''], [contenteditable='true'], input:not([type='checkbox'])");
const timerText = (s: number) => `Expires in ${s} seconds unless approved. The timer pauses while the card is hovered or focused.`;
/** 0:42, 2:05 */
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
/** just now, 4 min ago, 2 h ago */
function ago(t: number, now: number) {
  const s = Math.floor((now - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)} h ago`;
}
/** Text as it is, an element cloned */
const content = (v: string | Element | undefined) => (v === undefined ? nothing : typeof v === "string" ? v : v.cloneNode(true));
/** One line of JSON with its keys, strings, numbers and true / false / null coloured */
const JSON_TOKEN = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
function jsonLine(line: string) {
  const out: unknown[] = [];
  let at = 0;
  for (const m of line.matchAll(JSON_TOKEN)) {
    const i = m.index ?? 0;
    if (i > at) out.push(line.slice(at, i));
    const kind = m[1] ? (m[2] ? "p" : "s") : /^[tfn]/.test(m[0]) ? "k" : "n";
    out.push(html`<span class="ui-ap__t-${kind}">${m[1] ?? m[0]}</span>`);
    if (m[2]) out.push(m[2]);
    at = i + m[0].length;
  }
  if (at < line.length) out.push(line.slice(at));
  return out;
}
/** The arguments as indented JSON, or as text when they can't be (a cycle, a BigInt) */
function argsText(args: ApprovalArgs) {
  try {
    return JSON.stringify(args, null, 2) ?? String(args);
  } catch {
    return String(args);
  }
}

/** JSON for a value on one line, for the edited-arguments diff */
const oneLine = (v: unknown) => {
  try {
    return JSON.stringify(v) ?? String(v);
  } catch {
    return String(v);
  }
};
/** Two argument values are the same, compared as JSON */
const sameValue = (a: unknown, b: unknown) => a === b || oneLine(a) === oneLine(b);
/** Which field an argument gets: from the schema first, else from its value */
function fieldKind(value: unknown, schema?: ApprovalArgSchema): "choice" | "boolean" | "number" | "integer" | "text" | "json" {
  if (schema?.enum?.length) return "choice";
  const t = schema?.type;
  if (t === "boolean" || (!t && typeof value === "boolean")) return "boolean";
  if (t === "integer") return "integer";
  if (t === "number" || (!t && typeof value === "number")) return "number";
  if (t === "string" || (!t && typeof value === "string")) return "text";
  return "json";
}

/**
 * @internal A file change as a small unified diff: a heading with the path and the +/− counts, then the lines with a
 * sign and screen-reader words – never colour alone. Shared with tc-approval-gates, which adopts this element's CSS
 */
export function renderApprovalDiff(diff: ApprovalDiff, label: string) {
  const added = diff.lines.filter((l) => l.kind === "add").length;
  const removed = diff.lines.filter((l) => l.kind === "remove").length;
  return html`<div class="ui-ap__code-sec">
    <div class="ui-ap__code-head">
      <span class="ui-ap__code-label">${label}</span>
      <code class="ui-ap__path">${diff.path}</code>
      <span class="ui-ap__stat"><span aria-hidden="true"><span class="ui-ap__plus">+${added}</span> <span class="ui-ap__minus">−${removed}</span></span><span class="tc-sr-only">${added} added, ${removed} removed</span></span>
    </div>
    <div class="ui-ap__code" role="region" tabindex="0" aria-label=${`${label}: ${diff.path}`} data-kind="diff">
      <div class="ui-ap__lines">${diff.lines.map(
        (l) => html`<div class="ui-ap__line" data-kind=${l.kind}><span class="ui-ap__sign" aria-hidden="true">${l.kind === "add" ? "+" : l.kind === "remove" ? "−" : " "}</span><span class="ui-ap__lc">${l.kind === "add"
          ? html`<span class="tc-sr-only">Added: </span>`
          : l.kind === "remove"
            ? html`<span class="tc-sr-only">Removed: </span>`
            : nothing}${l.text}</span></div>`,
      )}</div>
    </div>
  </div>`;
}

/** @internal The call's arguments as a readable code block. Shared with tc-approval-gates */
export function renderApprovalArgs(args: ApprovalArgs, label: string) {
  return html`<div class="ui-ap__code-sec">
    <div class="ui-ap__code-head"><span class="ui-ap__code-label">${label}</span></div>
    <div class="ui-ap__code" role="region" tabindex="0" aria-label=${label} data-kind="args">
      <div class="ui-ap__lines">${argsText(args)
        .split("\n")
        .map((line) => html`<div class="ui-ap__line"><span class="ui-ap__lc">${jsonLine(line)}</span></div>`)}</div>
    </div>
  </div>`;
}

/** A boolean attribute that defaults to true: "false" turns it off */
const onByDefault = { fromAttribute: (v: string | null) => v !== "false" };

const clockIcon = (hidden: boolean) =>
  html`<svg viewBox="0 0 16 16" aria-hidden=${ifDefined(hidden ? "true" : undefined)}>${svg`<circle cx="8" cy="8" r="6"></circle><path d="M8 5v3.2l2 1.3"></path>`}</svg>`;

/* Pencil, check, x, info and file-text: Lucide (ISC, lucide.dev) */
const smallIcon = (body: ReturnType<typeof svg>) =>
  html`<svg class="ui-ap__mini" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const pencilIcon = smallIcon(svg`<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"></path><path d="m15 5 4 4"></path>`);
const checkIcon = smallIcon(svg`<path d="M20 6 9 17l-5-5"></path>`);
const crossIcon = smallIcon(svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const infoIcon = smallIcon(svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>`);
const fileIcon = smallIcon(svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 13H8"></path><path d="M16 17H8"></path>`);

let uid = 0;

/**
 * An agent's request for approval, with Approve / Deny, an optional countdown, and a compact row once decided.
 * @tag tc-approval-card
 * @fires tc-status-change - The card was approved, denied or expired; detail `{ status }`, plus `{ args, edited }` on approve with `editableArgs`. Cancelable: preventDefault() keeps the status (controlled use)
 * @fires tc-deny - Denied by the user or by the countdown; detail `{ reason: "user" | "timeout" }`
 * @fires tc-expire - The countdown ran out (tc-deny fires too); detail: null
 * @fires tc-edit - Edit was pressed (shown with `editable`); detail: null
 * @fires tc-details-change - An argument was edited in "Edit arguments" mode; detail `{ details, index, label, value }`. Cancelable: preventDefault() keeps the rows (controlled use)
 * @fires tc-evidence-select - An evidence chip without `href` was pressed; detail `{ evidence, index }`
 */
export class TcApprovalCard extends TcElement {
  static override ui = "ap";

  /** The action, e.g. "Send campaign email" – the group's name */
  @property() accessor heading = "";
  /** One line of context below the heading: text, or an element (cloned) */
  @property({ attribute: false }) accessor description: string | Element | undefined = undefined;
  /** Tinted badge in the header; leave out to hide it */
  @property() accessor risk: ApprovalRisk | undefined = undefined;
  /** Icon element in the header tile (cloned) – defaults to a small shield */
  @property({ attribute: false }) accessor icon: Element | undefined = undefined;
  /** Key-value rows in the preview, e.g. To, Subject, Scheduled */
  @property({ attribute: false }) accessor details: ApprovalDetail[] | undefined = undefined;
  /** Anything to show above the details, e.g. a recipient list: text, or an element (cloned) */
  @property({ attribute: false }) accessor preview: string | Element | undefined = undefined;
  /** The status */
  @property() accessor status: ApprovalStatus = "pending";
  /**
   * Called on Approve with the "Always allow" choice. Return a promise to show a spinner and lock the card until it
   * settles; a rejection keeps it pending and shows `errorLabel`, and Approve can be pressed again to retry
   */
  @property({ attribute: false }) accessor onApprove: ((decision: ApprovalDecision) => void | Promise<unknown>) | undefined = undefined;
  /** Shown under the buttons when an onApprove promise rejects */
  @property({ attribute: "error-label" }) accessor errorLabel = "Couldn't approve. Try again.";
  /** Shows an "Edit" button (it fires tc-edit) */
  @property({ type: Boolean }) accessor editable = false;
  /** Seconds until the request expires and is denied with reason "timeout" */
  @property({ type: Number, attribute: "expires-in" }) accessor expiresIn: number | undefined = undefined;
  /** Show a "Stop" button next to the countdown that turns the time limit off (WCAG 2.2.1). Default true */
  @property({ attribute: "allow-stop-timer", converter: onByDefault }) accessor allowStopTimer = true;
  /** Its label – the countdown ("Expires in 42 seconds…") describes it */
  @property({ attribute: "stop-timer-label" }) accessor stopTimerLabel = "Stop";
  /** Show the "Always allow this action" checkbox. Default true */
  @property({ attribute: "allow-always", converter: onByDefault }) accessor allowAlways = true;
  /** The "Always allow" checkbox's label */
  @property({ attribute: "always-label" }) accessor alwaysLabel = "Always allow this action";
  /** The Approve button's label */
  @property({ attribute: "approve-label" }) accessor approveLabel = "Approve";
  /** The Deny button's label */
  @property({ attribute: "deny-label" }) accessor denyLabel = "Deny";
  /** The Edit button's label (shown with `editable`) */
  @property({ attribute: "edit-label" }) accessor editLabel = "Edit";
  /** Show ⌘↵ / Esc hints on the buttons (the shortcuts work either way). Default true */
  @property({ converter: onByDefault }) accessor shortcuts = true;
  /** Small label on the gray tray above the card, e.g. "Step 4 · gmail.send": text, or an element (cloned) */
  @property({ attribute: false }) accessor label: string | Element | undefined = undefined;
  /** Where the buttons sit: on the gray tray below the card or inside the white card. Default: "tray" in the Standard look, "card" in the Clean look */
  @property() accessor actions: "tray" | "card" | undefined = undefined;
  /** "Why you're seeing this": one line on what made the agent ask, e.g. the rule or threshold it met */
  @property() accessor why: string | undefined = undefined;
  /** The heading of the `why` line */
  @property({ attribute: "why-label" }) accessor whyLabel = "Why you're seeing this";
  /** What happens if the person approves, and if they deny – one sentence each */
  @property({ attribute: false }) accessor consequences: ApprovalConsequences | undefined = undefined;
  /** The heading of the approve consequence */
  @property({ attribute: "if-approve-label" }) accessor ifApproveLabel = "If you approve";
  /** The heading of the deny consequence */
  @property({ attribute: "if-deny-label" }) accessor ifDenyLabel = "If you deny";
  /** Shows "Edit arguments", which turns the text details into fields; each change fires tc-details-change */
  @property({ type: Boolean, attribute: "editable-details" }) accessor editableDetails = false;
  /** The "Edit arguments" button's label */
  @property({ attribute: "edit-details-label" }) accessor editDetailsLabel = "Edit arguments";
  /** The button's label while editing */
  @property({ attribute: "done-details-label" }) accessor doneDetailsLabel = "Done";
  /** Sources the request rests on, shown as chips */
  @property({ attribute: false }) accessor evidence: ApprovalEvidence[] | undefined = undefined;
  /** The heading of the evidence chips */
  @property({ attribute: "evidence-label" }) accessor evidenceLabel = "Evidence";
  /** A file change the action would make, shown as a small unified diff: `{ path, lines: [{ kind, text }] }` */
  @property({ attribute: false }) accessor diff: ApprovalDiff | undefined = undefined;
  /** The heading of the diff */
  @property({ attribute: "diff-label" }) accessor diffLabel = "Changes";
  /** The call's arguments, shown as a readable code block */
  @property({ attribute: false }) accessor args: ApprovalArgs | undefined = undefined;
  /** The heading of the arguments */
  @property({ attribute: "args-label" }) accessor argsLabel = "Arguments";
  /** Lets the person change the arguments before approving: Edit beside them turns each one into a field */
  @property({ type: Boolean, attribute: "editable-args" }) accessor editableArgs = false;
  /** The arguments' JSON Schema (its `properties`): types and choices for the fields */
  @property({ attribute: false }) accessor argsSchema: ApprovalArgsSchema | undefined = undefined;
  /** The arguments' Edit button label */
  @property({ attribute: "edit-args-label" }) accessor editArgsLabel = "Edit";
  /** Its label while editing */
  @property({ attribute: "done-args-label" }) accessor doneArgsLabel = "Done";
  /** The Reset button's label – it puts every argument back */
  @property({ attribute: "reset-args-label" }) accessor resetArgsLabel = "Reset";
  /** The Approve button's label once an argument has changed */
  @property({ attribute: "approve-edited-label" }) accessor approveEditedLabel = "Approve with changes";
  /** The heading of the diff of changed arguments */
  @property({ attribute: "changes-label" }) accessor changesLabel = "Your changes";

  /** @internal */ @state() accessor always = false;
  /** @internal */ @state() accessor busy = false;
  /** @internal */ @state() accessor failed = false;
  /** @internal */ @state() accessor reason: DenyReason = "user";
  /** @internal When the card was decided – read from the clock after an update, never during render */
  @state() accessor decidedAt: number | null = null;
  /** @internal */ @state() accessor now = 0;
  /** @internal */ @state() accessor announce = "";
  /** @internal */ @state() accessor hover = false;
  /** @internal */ @state() accessor focusIn = false;
  /** @internal */ @state() accessor tabHidden = false;
  /** @internal */ @state() accessor timerOff = false;
  /** @internal */ @state() accessor mod = "⌘";
  /** @internal */ @state() accessor leaving = false;
  /** @internal */ @state() accessor entering = false;
  /** @internal Milliseconds left on the countdown */
  @state() accessor left = 0;
  /** @internal The countdown's one warning */
  @state() accessor warn = "";
  /** @internal "Edit arguments" mode */
  @state() accessor editingDetails = false;
  /** @internal The detail values when editing first opened for this request – edited rows are marked against them */
  @state() accessor detailsBefore: (string | Element)[] | null = null;
  /** @internal Editing the arguments */
  @state() accessor editingArgs = false;
  /** @internal Changed arguments, by key – the rest are as `args` has them */
  @state() accessor argEdits: Record<string, unknown> = {};
  /** @internal What's typed in a JSON field that doesn't parse yet, by key */
  @state() accessor argDrafts: Record<string, string> = {};

  private readonly uid = `tc-ap-${++uid}`;
  private prevStatus: ApprovalStatus | undefined = undefined;
  private alive = false;
  private expired = false;
  private timer = 0;
  private running = "";
  private stampedFor = "";
  private ticker = 0;
  private rowFocused = false;
  private lastH = 0;
  private animating = false;
  private morphTimer = 0;
  private wasResolved: boolean | undefined = undefined;
  private ro?: ResizeObserver;
  private ownDescribedBy: string | null = null;

  constructor() {
    super();
    // Safety net: focus never drops to <body> when a focused control inside the card goes away
    new FocusRescueController(this, () => (this.resolved ? this.rowEl : this.approveBtn));
  }

  /** The arguments as they'd be approved now: `args` with the person's changes */
  get editedArgs(): ApprovalArgs | undefined {
    if (!this.args) return undefined;
    return { ...this.args, ...this.argEdits };
  }
  /** Some argument differs from `args` */
  get argsEdited() {
    const args = this.args;
    return !!args && Object.entries(this.argEdits).some(([k, v]) => !sameValue(v, args[k]));
  }
  private get argsInvalid() {
    return Object.keys(this.argDrafts).length > 0;
  }
  private get argsEditable() {
    const a = this.args;
    return this.editableArgs && !!a && typeof a === "object" && !Array.isArray(a) && Object.keys(a).length > 0;
  }

  /** @internal */
  get resolved() {
    return this.status !== "pending";
  }
  private get total() {
    return this.expiresIn && this.expiresIn > 0 ? this.expiresIn * 1000 : 0;
  }
  private get paused() {
    return this.hover || this.focusIn || this.busy || this.tabHidden;
  }
  private get approveBtn() {
    return this.querySelector<HTMLElement>(".ui-ap__approve");
  }
  private get rowEl() {
    return this.querySelector<HTMLElement>(".ui-ap__resolved");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.alive = true;
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    if (this.ownDescribedBy === null) this.ownDescribedBy = this.getAttribute("aria-describedby") ?? "";
    // ⌘ on Apple devices, Ctrl elsewhere
    const p = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform;
    if (!/mac|iphone|ipad|ipod/i.test(p || navigator.userAgent)) this.mod = "Ctrl";
    document.addEventListener("visibilitychange", this.syncHidden);
    this.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("pointerenter", this.onEnter);
    this.addEventListener("pointerleave", this.onLeave);
    this.addEventListener("focusin", this.onFocusIn);
    this.addEventListener("focusout", this.onFocusOut);
    if (typeof ResizeObserver !== "undefined") {
      // Remember the settled height, so a status change knows where to animate from
      this.ro = new ResizeObserver(() => {
        if (!this.animating) this.lastH = this.offsetHeight;
      });
      this.ro.observe(this);
    }
    this.running = "";
    this.stampedFor = "";
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // An onApprove promise that settles after the card is gone sets nothing
    this.alive = false;
    document.removeEventListener("visibilitychange", this.syncHidden);
    this.removeEventListener("keydown", this.onKeyDown);
    this.removeEventListener("pointerenter", this.onEnter);
    this.removeEventListener("pointerleave", this.onLeave);
    this.removeEventListener("focusin", this.onFocusIn);
    this.removeEventListener("focusout", this.onFocusOut);
    this.ro?.disconnect();
    this.ro = undefined;
    clearTimeout(this.timer);
    clearInterval(this.ticker);
    clearTimeout(this.morphTimer);
    this.animating = false;
    this.style.height = "";
  }

  // A hidden tab doesn't eat the time
  private syncHidden = () => {
    this.tabHidden = document.visibilityState === "hidden";
  };
  private onEnter = () => (this.hover = true);
  private onLeave = () => (this.hover = false);
  private onFocusIn = () => (this.focusIn = true);
  private onFocusOut = (e: FocusEvent) => {
    if (!this.contains(e.relatedTarget as Node | null)) this.focusIn = false;
  };
  private onKeyDown = (e: KeyboardEvent) => {
    if (this.resolved || this.busy || e.defaultPrevented || e.isComposing) return;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void this.approve();
    } else if (e.key === "Escape" && !ownsEscape(e.target as Element)) {
      e.preventDefault();
      this.deny("user");
    }
  };

  private setStatus(next: ApprovalStatus) {
    const extra = next === "approved" && this.argsEditable ? { args: this.editedArgs, edited: this.argsEdited } : {};
    if (this.emit<ApprovalStatusChange>("tc-status-change", { status: next, ...extra }, { cancelable: true })) this.status = next;
  }

  private async approve() {
    if (this.resolved || this.busy) return;
    if (this.argsEditable && this.argsInvalid) {
      // A JSON field that doesn't parse can't be approved: say so and go to it
      this.editingArgs = true;
      this.announce = `Fix ${Object.keys(this.argDrafts)[0]} before approving: it isn't valid JSON.`;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>('.ui-ap__argfield[aria-invalid="true"]')?.focus());
      return;
    }
    this.failed = false;
    let result: void | Promise<unknown>;
    try {
      result = this.onApprove?.(this.argsEditable ? { always: this.always, args: this.editedArgs, edited: this.argsEdited } : { always: this.always });
    } catch {
      this.failed = true;
      return;
    }
    if (result && typeof (result as Promise<unknown>).then === "function") {
      this.busy = true;
      try {
        await result;
      } catch {
        // Stays pending and says so; Approve can be pressed again
        if (this.alive) {
          this.busy = false;
          this.failed = true;
        }
        return;
      }
      if (!this.alive) return;
      this.busy = false;
    }
    this.setStatus("approved");
  }

  private deny(why: DenyReason = "user") {
    if (this.resolved || (this.busy && why === "user")) return;
    this.reason = why;
    this.failed = false;
    if (why === "timeout") this.emit("tc-expire", null);
    this.emit<ApprovalDeny>("tc-deny", { reason: why });
    this.setStatus("denied");
  }

  /** A detail row that "Edit arguments" turns into a field */
  private canEdit(d: ApprovalDetail) {
    return typeof d.value === "string" && d.editable !== false;
  }

  private toggleDetails() {
    if (this.busy) return;
    if (!this.editingDetails && !this.detailsBefore) this.detailsBefore = (this.details ?? []).map((d) => d.value);
    this.editingDetails = !this.editingDetails;
    if (this.editingDetails) void this.updateComplete.then(() => this.querySelector<HTMLInputElement>(".ui-ap__arg")?.focus());
  }

  private editDetail(index: number, field: HTMLInputElement) {
    const rows = this.details ?? [];
    const row = rows[index];
    if (!row) return;
    const value = field.value;
    const details = rows.map((d, i) => (i === index ? { ...d, value } : d));
    if (!this.emit<ApprovalDetailsChange>("tc-details-change", { details, index, label: row.label, value }, { cancelable: true })) {
      // Controlled: the field shows the row's value until the app passes the new rows back
      field.value = typeof row.value === "string" ? row.value : "";
      return;
    }
    this.details = details;
  }

  private toggleArgs() {
    if (this.busy) return;
    this.editingArgs = !this.editingArgs;
    if (this.editingArgs) void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-ap__argfield")?.focus());
  }
  private resetArgs() {
    if (this.busy) return;
    this.argEdits = {};
    this.argDrafts = {};
    this.announce = "Arguments put back as the agent asked";
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(this.editingArgs ? ".ui-ap__argfield" : ".ui-ap__args-edit")?.focus());
  }
  private setArg(key: string, value: unknown) {
    const { [key]: _, ...drafts } = this.argDrafts;
    this.argDrafts = drafts;
    const edits = { ...this.argEdits };
    if (sameValue(value, this.args?.[key])) delete edits[key];
    else edits[key] = value;
    this.argEdits = edits;
  }
  private onArgInput(key: string, kind: ReturnType<typeof fieldKind>, field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, schema?: ApprovalArgSchema) {
    if (kind === "boolean") return this.setArg(key, (field as HTMLInputElement).checked);
    if (kind === "choice") {
      const choice = schema?.enum?.find((c) => String(c) === field.value);
      return this.setArg(key, choice ?? field.value);
    }
    if (kind === "number" || kind === "integer") {
      const n = field.value.trim() === "" ? NaN : Number(field.value);
      if (Number.isFinite(n) && (kind === "number" || Number.isInteger(n))) return this.setArg(key, n);
      this.argDrafts = { ...this.argDrafts, [key]: field.value };
      return;
    }
    if (kind === "text") return this.setArg(key, field.value);
    try {
      this.setArg(key, JSON.parse(field.value));
    } catch {
      this.argDrafts = { ...this.argDrafts, [key]: field.value };
    }
  }
  private onArgsKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.isComposing) return;
    // Escape leaves the editor, keeping the changes – it never denies from inside it
    e.preventDefault();
    e.stopPropagation();
    this.editingArgs = false;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-ap__args-edit")?.focus());
  };

  private stopTimer() {
    // The button goes away with the countdown – focus moves on to Approve first
    rescueFocus(this.querySelector(".ui-ap__stop"), [this.approveBtn]);
    this.timerOff = true;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // New arguments are a new request: the person's changes were to the old ones
    if (changed.has("args") && changed.get("args") !== undefined) {
      this.argEdits = {};
      this.argDrafts = {};
    }
    const status = this.status;
    if (this.prevStatus === undefined) {
      this.left = this.total;
    } else if (this.prevStatus !== status) {
      if (status === "pending") {
        this.editingDetails = false;
        this.detailsBefore = null;
        this.editingArgs = false;
        this.argEdits = {};
        this.argDrafts = {};
        this.leaving = false;
        this.entering = true;
        this.always = false;
        this.busy = false;
        this.failed = false;
        this.reason = "user";
        this.decidedAt = null;
        this.announce = "";
        this.timerOff = false;
      } else {
        this.leaving = this.prevStatus === "pending";
        this.entering = false;
        this.failed = false;
        this.decidedAt = null;
        this.announce = `${status === "approved" ? "Approved" : this.reason === "timeout" ? "Expired" : "Denied"}: ${this.heading}`;
      }
    }
    // A fresh request gets the full time again
    if (status === "pending" && (this.prevStatus !== status || changed.has("expiresIn"))) {
      this.left = this.total;
      this.expired = false;
      this.warn = "";
    }
    this.prevStatus = status;

    const actions = this.actions ?? (this.resolvedLook === "clean" ? "card" : "tray");
    const total = this.total;
    const describedBy = [this.ownDescribedBy, this.description ? `${this.uid}-desc` : null, this.why && !this.resolved ? `${this.uid}-why` : null, total && !this.resolved && !this.timerOff ? `${this.uid}-timer` : null].filter(Boolean).join(" ");
    this.setAttribute("aria-labelledby", this.resolved ? `${this.uid}-row` : `${this.uid}-title`);
    if (describedBy) this.setAttribute("aria-describedby", describedBy);
    else this.removeAttribute("aria-describedby");
    if (this.busy) this.setAttribute("aria-busy", "true");
    else this.removeAttribute("aria-busy");
    this.dataset.status = status;
    this.toggleAttribute("data-busy", this.busy);
    this.toggleAttribute("data-label", !!this.label);
    this.dataset.actions = actions;
  }

  /**
   * The countdown: one timeout per whole second (no animation frames), paused while hovered, focused, busy or the tab
   * is hidden, off for good with Stop. Time runs out once per request: a card whose page leaves it pending doesn't
   * expire again each time hover or focus restarts the countdown
   */
  private syncTimer() {
    const run = !!this.total && !this.resolved && !this.paused && !this.timerOff && !this.expired;
    const key = run ? `run:${this.total}` : "";
    if (key === this.running) return;
    this.running = key;
    clearTimeout(this.timer);
    if (!run) return;
    const next = () => {
      const wait = this.left % 1000 || 1000;
      this.timer = window.setTimeout(() => {
        const before = this.left;
        this.left -= wait;
        if (before > WARN_AT && this.left <= WARN_AT && this.left > 0) this.warn = `20 seconds left to decide: ${this.heading}. Stop the timer to keep it open.`;
        if (this.left <= 0) {
          this.expired = true;
          this.running = "";
          this.deny("timeout");
          return;
        }
        next();
      }, wait);
    };
    next();
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.syncTimer();

    // The decision time is stamped after the update; "just now" turns into "2 min ago" over time
    const stamp = this.resolved ? `${this.status}` : "";
    if (stamp !== this.stampedFor) {
      this.stampedFor = stamp;
      clearInterval(this.ticker);
      if (stamp) {
        const at = Date.now();
        this.decidedAt = at;
        this.now = at;
        this.ticker = window.setInterval(() => (this.now += 30000), 30000);
      }
    }

    // The card morphs between its pending and resolved heights; the focus stays in the card
    const resolved = this.resolved;
    if (this.wasResolved === undefined) {
      this.wasResolved = resolved;
      this.lastH = this.offsetHeight;
    } else if (this.wasResolved !== resolved) {
      this.wasResolved = resolved;
      // Keep focus in the card: on the resolved row, or back on Approve for a new request
      const active = document.activeElement;
      if (resolved && active && this.contains(active)) this.rowEl?.focus({ preventScroll: true });
      if (!resolved && this.rowFocused) this.approveBtn?.focus({ preventScroll: true });
      this.rowFocused = false;
      clearTimeout(this.morphTimer);
      const from = this.lastH;
      this.style.height = "";
      const to = this.offsetHeight;
      if (from && from !== to) {
        this.animating = true;
        this.style.height = `${from}px`;
        void this.offsetHeight;
        this.style.height = `${to}px`;
        this.morphTimer = window.setTimeout(() => {
          this.style.height = "";
          this.animating = false;
          this.lastH = this.offsetHeight;
        }, 560);
      } else this.animating = false;
    }
  }

  private renderFoot(alwaysBox: unknown) {
    const total = this.total;
    const secondsLeft = Math.max(0, Math.ceil(this.left / 1000));
    const busy = this.busy;
    const timerOff = this.timerOff;
    return html`<div class="ui-ap__foot">
      ${this.failed ? html`<p class="ui-ap__error" role="alert">${this.errorLabel}</p>` : nothing}
      ${alwaysBox}
      ${total > 0
        ? html`<span class="ui-ap__timer">
            ${timerOff
              ? html`<span class="ui-ap__expires" data-off="">${clockIcon(true)}No time limit</span>`
              : html`<span class="ui-ap__expires" data-paused=${ifDefined(this.paused ? "" : undefined)} data-low=${ifDefined(secondsLeft <= 10 ? "" : undefined)} aria-hidden="true">${clockIcon(false)}Expires in ${clock(secondsLeft)}</span>`}
            ${!timerOff && this.allowStopTimer
              ? html`<button type="button" class="ui-ap__btn ui-ap__btn--ghost ui-ap__stop" aria-describedby="${this.uid}-timer" @click=${() => this.stopTimer()}>${this.stopTimerLabel}</button>`
              : nothing}
          </span>`
        : nothing}
      <div class="ui-ap__actions">
        ${this.editable
          ? html`<button
              type="button"
              class="ui-ap__btn ui-ap__btn--ghost"
              aria-disabled=${ifDefined(busy ? "true" : undefined)}
              @click=${() => {
                if (!this.busy) this.emit("tc-edit", null);
              }}
            >${this.editLabel}</button>`
          : nothing}
        <button type="button" class="ui-ap__btn ui-ap__btn--quiet ui-ap__deny" aria-keyshortcuts="Escape" aria-disabled=${ifDefined(busy ? "true" : undefined)} @click=${() => this.deny("user")}>
          ${this.denyLabel}${this.shortcuts ? html`<kbd class="ui-ap__kbd" aria-hidden="true">Esc</kbd>` : nothing}
        </button>
        <button
          type="button"
          class="ui-ap__btn ui-ap__btn--primary ui-ap__approve"
          aria-keyshortcuts="Meta+Enter Control+Enter"
          aria-disabled=${ifDefined(busy ? "true" : undefined)}
          @click=${() => void this.approve()}
        >
          ${this.argsEditable && this.argsEdited ? this.approveEditedLabel : this.approveLabel}${busy
            ? html`<svg class="ui-ap__spinner" viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="6"></circle>`}</svg>`
            : this.shortcuts
              ? html`<kbd class="ui-ap__kbd" aria-hidden="true">${this.mod === "⌘" ? "⌘↵" : "Ctrl ↵"}</kbd>`
              : nothing}
        </button>
      </div>
    </div>`;
  }

  private renderPending(alwaysBox: unknown, foot: unknown, actions: "tray" | "card") {
    const leaving = this.leaving;
    const id = this.uid;
    const total = this.total;
    const details = this.details;
    const body = this.preview;
    const risk = this.risk;
    const clean = this.resolvedLook === "clean";
    const head = cardHead({
      icon: this.icon ? svg`${this.icon.cloneNode(true)}` : shieldIcon,
      title: this.heading,
      id: leaving ? undefined : `${id}-title`,
      subtitle: this.description ? html`<span id=${ifDefined(leaving ? undefined : `${id}-desc`)}>${content(this.description)}</span>` : nothing,
      aside: risk
        ? html`<span class="ui-ap__risk" data-risk=${risk}><span class="ui-ap__risk-dot" aria-hidden="true"></span>${RISK_LABEL[risk]}<span class="ui-ap__risk-word"> risk</span></span>`
        : nothing,
    });
    const why = this.why
      ? html`<div class="ui-ap__why">
          <span class="ui-ap__why-label">${infoIcon}${this.whyLabel}</span>
          <p class="ui-ap__why-text" id=${ifDefined(leaving ? undefined : `${id}-why`)}>${this.why}</p>
        </div>`
      : nothing;
    const diff = this.diff?.lines.length ? this.diff : undefined;
    const args = this.args;
    const preview =
      body || details?.length || diff || args
        ? html`<div class="ui-ap__preview">
            ${body ? html`<div class="ui-ap__custom">${content(body)}</div>` : nothing}
            ${details?.length ? this.renderDetails(details, leaving) : nothing}
            ${diff ? renderApprovalDiff(diff, this.diffLabel) : nothing}
            ${args ? (this.argsEditable ? this.renderArgsEditor(args, leaving) : renderApprovalArgs(args, this.argsLabel)) : nothing}
          </div>`
        : nothing;
    const outcomes = this.renderConsequences();
    const evidence = this.renderEvidence();
    // The white card holds the request's content; with none (no preview, no checkbox, buttons on the tray) it's left out
    const hasBody = [why, preview, outcomes, evidence, alwaysBox].some((part) => part !== nothing) || actions === "card";
    return html`<div
      class="ui-ap__pending"
      data-leaving=${ifDefined(leaving ? "" : undefined)}
      data-entering=${ifDefined(this.entering ? "" : undefined)}
      .inert=${leaving}
      aria-hidden=${ifDefined(leaving ? "true" : undefined)}
      @animationend=${(e: AnimationEvent) => {
        if (e.target !== e.currentTarget) return;
        if (this.leaving) this.leaving = false;
        if (this.entering) this.entering = false;
      }}
    >
      ${clean ? nothing : head}
      ${clean || hasBody
        ? html`<div class="ui-ap__card">
            ${clean ? head : nothing}
            ${hasBody
              ? html`<div class="ui-ap__body">
                  ${why}
                  ${preview}
                  ${outcomes}
                  ${evidence}
                  ${alwaysBox}
                  ${actions === "card" ? foot : nothing}
                </div>`
              : nothing}
          </div>`
        : nothing}

      ${actions === "tray" ? foot : nothing}

      ${total > 0 && !this.timerOff
        ? html`<span class="ui-ap__sr" id=${ifDefined(leaving ? undefined : `${id}-timer`)}>${timerText(Math.max(0, Math.ceil(this.left / 1000)))}</span>`
        : nothing}
    </div>`;
  }

  private renderDetails(details: ApprovalDetail[], leaving: boolean) {
    const editable = this.editableDetails && details.some((d) => this.canEdit(d));
    const editing = editable && this.editingDetails;
    const before = this.detailsBefore;
    const toggle = editable
      ? html`<button
          type="button"
          class="ui-ap__btn ui-ap__btn--ghost ui-ap__args-toggle"
          aria-disabled=${ifDefined(this.busy ? "true" : undefined)}
          aria-controls=${ifDefined(leaving ? undefined : `${this.uid}-args`)}
          @click=${() => this.toggleDetails()}
        >${editing ? checkIcon : pencilIcon}${editing ? this.doneDetailsLabel : this.editDetailsLabel}</button>`
      : nothing;
    return html`<dl class="ui-ap__details" id=${ifDefined(editable && !leaving ? `${this.uid}-args` : undefined)} ?data-editing=${editing}>
        ${details.map((d, i) => {
          const edited = !!before && i < before.length && before[i] !== d.value;
          return html`<div class="ui-ap__detail" ?data-edited=${edited}><dt>${d.label}</dt><dd>${editing && this.canEdit(d)
              ? html`<input
                  class="ui-ap__arg"
                  type="text"
                  spellcheck="false"
                  autocomplete="off"
                  aria-label=${d.label}
                  .value=${live(d.value as string)}
                  ?disabled=${this.busy}
                  @input=${(e: Event) => this.editDetail(i, e.target as HTMLInputElement)}
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key !== "Escape" || e.isComposing) return;
                    // Escape leaves the mode, keeping the edits – it never denies from inside a field
                    e.preventDefault();
                    this.editingDetails = false;
                    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-ap__args-toggle")?.focus());
                  }}
                />`
              : content(d.value)}${edited ? html`<span class="ui-ap__edited">Edited</span>` : nothing}</dd></div>`;
        })}
      </dl>
      ${toggle}`;
  }

  /** The arguments with Edit: the code block, or a field per argument while editing, and the changes as a diff */
  private renderArgsEditor(args: ApprovalArgs, leaving: boolean) {
    const editing = this.editingArgs;
    const shown = this.editedArgs ?? args;
    const edited = this.argsEdited;
    const formId = `${this.uid}-argform`;
    const tools = html`<div class="ui-ap__args-tools">
      <button
        type="button"
        class="ui-ap__btn ui-ap__btn--ghost ui-ap__args-toggle ui-ap__args-edit"
        aria-expanded=${editing ? "true" : "false"}
        aria-controls=${ifDefined(leaving || !editing ? undefined : formId)}
        aria-disabled=${ifDefined(this.busy ? "true" : undefined)}
        @click=${() => this.toggleArgs()}
      >${editing ? checkIcon : pencilIcon}${editing ? this.doneArgsLabel : this.editArgsLabel}<span class="tc-sr-only"> ${this.argsLabel.toLowerCase()}</span></button>
      ${edited || this.argsInvalid
        ? html`<button type="button" class="ui-ap__btn ui-ap__btn--ghost ui-ap__args-toggle ui-ap__args-reset" aria-disabled=${ifDefined(this.busy ? "true" : undefined)} @click=${() => this.resetArgs()}>${this.resetArgsLabel}</button>`
        : nothing}
    </div>`;
    if (!editing)
      return html`${renderApprovalArgs(shown, this.argsLabel)}${tools}${edited ? this.renderArgsDiff(args) : nothing}`;
    const props = this.argsSchema?.properties ?? {};
    const required = new Set(this.argsSchema?.required ?? []);
    return html`<div class="ui-ap__code-sec">
        <div class="ui-ap__code-head"><span class="ui-ap__code-label" id=${`${formId}-label`}>${this.argsLabel}</span></div>
        <div class="ui-ap__argform" id=${ifDefined(leaving ? undefined : formId)} role="group" aria-labelledby=${`${formId}-label`} @keydown=${this.onArgsKey}>
          ${Object.keys(args).map((key) => {
            const schema = props[key];
            const value = shown[key];
            const kind = fieldKind(args[key], schema);
            const id = `${formId}-${key}`;
            const changed = key in this.argEdits && !sameValue(this.argEdits[key], args[key]);
            const draft = this.argDrafts[key];
            const invalid = draft !== undefined;
            const hint = schema?.description;
            const describedBy = [invalid ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
            const label = schema?.title ?? key;
            const onInput = (e: Event) => this.onArgInput(key, kind, e.target as HTMLInputElement, schema);
            let field: unknown;
            if (kind === "boolean")
              field = html`<input id=${id} class="ui-ap__argfield ui-ap__argcheck" type="checkbox" .checked=${live(value === true)} ?disabled=${this.busy} aria-describedby=${ifDefined(describedBy)} @change=${onInput} />`;
            else if (kind === "choice")
              field = html`<select id=${id} class="ui-ap__argfield ui-ap__arg" ?disabled=${this.busy} aria-describedby=${ifDefined(describedBy)} @change=${onInput}>
                ${schema!.enum!.map((c) => html`<option value=${String(c)} ?selected=${sameValue(c, value)}>${String(c)}</option>`)}
              </select>`;
            else if (kind === "json" || (kind === "text" && typeof value === "string" && (value.includes("\n") || value.length > 60)))
              field = html`<textarea
                id=${id}
                class="ui-ap__argfield ui-ap__arg ui-ap__argarea"
                rows=${kind === "json" ? 3 : 2}
                spellcheck=${kind === "json" ? "false" : "true"}
                ?disabled=${this.busy}
                aria-invalid=${invalid ? "true" : "false"}
                aria-describedby=${ifDefined(describedBy)}
                .value=${live(draft ?? (kind === "json" ? argsText(value as ApprovalArgs) : String(value ?? "")))}
                @input=${onInput}
              ></textarea>`;
            else
              field = html`<input
                id=${id}
                class="ui-ap__argfield ui-ap__arg"
                type=${kind === "text" ? "text" : "number"}
                .step=${kind === "integer" ? "1" : "any"}
                spellcheck="false"
                autocomplete="off"
                ?required=${required.has(key)}
                ?disabled=${this.busy}
                aria-invalid=${invalid ? "true" : "false"}
                aria-describedby=${ifDefined(describedBy)}
                .value=${live(draft ?? (value === undefined || value === null ? "" : String(value)))}
                @input=${onInput}
              />`;
            return html`<div class="ui-ap__argrow" data-kind=${kind} ?data-edited=${changed} ?data-invalid=${invalid}>
              <label class="ui-ap__arglabel" for=${id}>${label}${label !== key ? html` <code class="ui-ap__argkey">${key}</code>` : nothing}</label>
              <div class="ui-ap__argctl">
                ${field}
                ${changed ? html`<span class="ui-ap__edited">Edited</span>` : nothing}
              </div>
              ${hint ? html`<p class="ui-ap__arghint" id=${`${id}-hint`}>${hint}</p>` : nothing}
              ${invalid ? html`<p class="ui-ap__argerror" id=${`${id}-error`}>${kind === "json" ? "Not valid JSON yet" : "Not a whole number"}</p>` : nothing}
            </div>`;
          })}
        </div>
      </div>
      ${tools}${edited ? this.renderArgsDiff(args) : nothing}`;
  }

  /** The changed arguments as a small diff: the agent's value removed, the person's added */
  private renderArgsDiff(args: ApprovalArgs) {
    const lines: ApprovalDiffLine[] = [];
    // In the arguments' own order, however they were edited
    for (const key of Object.keys(args)) {
      if (!(key in this.argEdits)) continue;
      const value = this.argEdits[key];
      if (sameValue(value, args[key])) continue;
      lines.push({ kind: "remove", text: `${key}: ${oneLine(args[key])}` }, { kind: "add", text: `${key}: ${oneLine(value)}` });
    }
    return lines.length ? html`<div class="ui-ap__argdiff">${renderApprovalDiff({ path: this.argsLabel.toLowerCase(), lines }, this.changesLabel)}</div>` : nothing;
  }

  private renderConsequences() {
    const c = this.consequences;
    if (!c?.approve && !c?.deny) return nothing;
    return html`<div class="ui-ap__outcomes">
      ${c.approve
        ? html`<div class="ui-ap__outcome" data-kind="approve"><span class="ui-ap__outcome-label">${checkIcon}${this.ifApproveLabel}</span><p class="ui-ap__outcome-text">${c.approve}</p></div>`
        : nothing}
      ${c.deny
        ? html`<div class="ui-ap__outcome" data-kind="deny"><span class="ui-ap__outcome-label">${crossIcon}${this.ifDenyLabel}</span><p class="ui-ap__outcome-text">${c.deny}</p></div>`
        : nothing}
    </div>`;
  }

  private renderEvidence() {
    const items = this.evidence;
    if (!items?.length) return nothing;
    const id = `${this.uid}-evidence`;
    return html`<div class="ui-ap__evidence">
      <span class="ui-ap__evidence-label" id=${id}>${this.evidenceLabel}</span>
      <ul class="ui-ap__chips" aria-labelledby=${id}>
        ${items.map((ev, index) => {
          const inner = html`${fileIcon}<span class="ui-ap__chip-label">${ev.label}</span>${ev.detail ? html`<span class="ui-ap__chip-detail">${ev.detail}</span>` : nothing}`;
          return html`<li>${safeUrl(ev.href)
            ? html`<a class="ui-ap__chip" href=${ifDefined(safeUrl(ev.href))} target="_blank" rel="noopener noreferrer">${inner}</a>`
            : html`<button type="button" class="ui-ap__chip" @click=${() => this.emit<ApprovalEvidenceSelect>("tc-evidence-select", { evidence: ev, index })}>${inner}</button>`}</li>`;
        })}
      </ul>
    </div>`;
  }

  private renderResolved() {
    const status = this.status;
    const resolvedLabel = status === "approved" ? "Approved" : this.reason === "timeout" ? "Expired" : "Denied";
    return html`<div
      class="ui-ap__card ui-ap__resolved"
      tabindex="-1"
      data-status=${status}
      @focus=${() => (this.rowFocused = true)}
      @blur=${(e: FocusEvent) => {
        // A blur from being removed (the card resets) keeps the flag, so focus can return to Approve
        if (e.relatedTarget || (e.currentTarget as HTMLElement).isConnected) this.rowFocused = false;
      }}
    >
      <span class="ui-ap__mark" aria-hidden="true">
        <svg viewBox="0 0 16 16">${status === "approved" ? svg`<path d="M4.2 8.4 6.9 11 11.8 5.6" pathLength="1"></path>` : svg`<path d="M5.2 5.2 10.8 10.8M10.8 5.2 5.2 10.8" pathLength="1"></path>`}</svg>
      </span>
      <span class="ui-ap__row-title" id="${this.uid}-row">${this.heading}</span>
      <span class="ui-ap__row-status">${resolvedLabel}${status === "approved" && this.always ? html`<span class="ui-ap__row-extra"> · Always</span>` : nothing}${this.decidedAt !== null
        ? html`<span class="ui-ap__row-time"> · ${ago(this.decidedAt, this.now)}</span>`
        : nothing}</span>
    </div>`;
  }

  protected override render() {
    const actions = this.actions ?? (this.resolvedLook === "clean" ? "card" : "tray");
    // Clean puts the checkbox in the bottom row with the buttons when they sit inside the card
    const alwaysInFoot = this.resolvedLook === "clean" && actions === "card";
    const alwaysBox = this.allowAlways
      ? html`<label class="ui-ap__always">
          <span class="ui-ap__box">
            <input type="checkbox" .checked=${this.always} ?disabled=${this.busy} @change=${(e: Event) => (this.always = (e.target as HTMLInputElement).checked)} />
            <svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4 8.3 6.8 11 12 5.2"></path>`}</svg>
          </span>
          <span class="ui-ap__always-label">${this.alwaysLabel}</span>
        </label>`
      : nothing;
    const foot = this.renderFoot(alwaysInFoot ? alwaysBox : nothing);
    return html`
      ${this.label ? html`<div class="ui-ap__label">${content(this.label)}</div>` : nothing}
      ${!this.resolved || this.leaving ? this.renderPending(alwaysInFoot ? nothing : alwaysBox, foot, actions) : nothing}
      ${this.resolved ? this.renderResolved() : nothing}
      <span class="ui-ap__sr" role="status" aria-live="polite">${this.announce}</span>
      <span class="ui-ap__sr" role="status" aria-live="polite">${this.warn}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="ap"]. The card sits on the gray tray (Standard, and Clean
   with actions="tray"); Clean's default actions="card" drops the tray. */
[data-ui="ap"] {
  /* The shortcut chip's text inside the ink primary button */
  --tc-approval-card-primary-kbd-fg: light-dark(rgba(255, 255, 255, 0.72), rgba(25, 25, 27, 0.72));
  --tc-approval-card-spin: 800ms;
  /* The tallest a diff or the arguments get before they scroll */
  --tc-approval-card-code-max: 220px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  container-type: inline-size;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-muted);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  letter-spacing: var(--tc-tracking-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  transition: height var(--tc-duration-slowest) var(--tc-ease-move);
}
[data-ui="ap"] *,
[data-ui="ap"] *::before,
[data-ui="ap"] *::after {
  box-sizing: border-box;
}
/* The white card – the pending request and the resolved row both live in one */
.ui-ap__card {
  position: relative;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
/* ---------- Pending ---------- */
.ui-ap__body {
  padding: var(--tc-space-4);
}
.ui-ap__body > :first-child {
  margin-top: 0;
}
/* Clean: the header is the card's first row, so the content starts right under it */
:where([data-look="clean"], [data-look="clean"] *).ui-ap__card > .ui-ap__body {
  padding-top: 0;
}
.ui-ap__pending[data-leaving] {
  position: absolute;
  top: var(--tc-tray-inset);
  left: var(--tc-tray-inset);
  right: var(--tc-tray-inset);
  pointer-events: none;
  animation: ui-ap-out var(--tc-duration-moderate) var(--tc-ease-move) both;
}
.ui-ap__pending[data-entering] {
  animation: ui-ap-in var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-instant) both;
}
[data-ui="ap"][data-busy] .ui-ap__pending {
  pointer-events: none;
}
/* The risk badge: a status pill with its dot in both looks */
.ui-ap__risk {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-pill-h-lg);
  padding: 0 var(--tc-pill-px-lg);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-default);
  color: var(--tc-text-muted);
  font-size: var(--tc-pill-font-size-lg);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-none);
  white-space: nowrap;
}
.ui-ap__risk-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.ui-ap__risk-word {
  white-space: pre;
}
.ui-ap__risk[data-risk="medium"] {
  background: var(--tc-status-warning-bg);
  color: var(--tc-status-warning-fg);
}
.ui-ap__risk[data-risk="high"] {
  background: var(--tc-status-danger-bg);
  color: var(--tc-status-danger-fg);
}
/* Preview: custom content and key-value rows in one soft panel */
:where([data-look="standard"], [data-look="standard"] *).ui-ap__preview {
  display: grid;
  gap: var(--tc-space-3);
  margin-top: var(--tc-space-3-5);
  padding: var(--tc-space-3);
  border-radius: var(--tc-radius-lg);
  background: var(--tc-fill-subtle);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
}
/* Preview: custom content and key-value rows, plain on the card under one hairline – no second gray panel */
:where([data-look="clean"], [data-look="clean"] *).ui-ap__preview {
  display: grid;
  gap: var(--tc-space-3);
  margin-top: var(--tc-space-3-5);
  padding-top: var(--tc-space-3-5);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
.ui-ap__custom {
  min-width: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ap__custom + .ui-ap__details {
  padding-top: var(--tc-space-3);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__custom + .ui-ap__details {
  padding-top: var(--tc-space-0-5);
}
.ui-ap__details {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--tc-space-1-5) var(--tc-space-4);
  margin: 0;
}
.ui-ap__detail {
  display: contents;
}
.ui-ap__detail dt {
  color: var(--tc-text-muted);
}
.ui-ap__detail dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--tc-text-primary);
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* "Always allow" closes the card */
.ui-ap__always {
  display: flex;
  width: fit-content;
  max-width: 100%;
  margin-top: var(--tc-space-3-5);
  align-items: center;
  gap: var(--tc-space-2);
  min-width: 0;
  cursor: pointer;
  user-select: none;
}
.ui-ap__always-label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-ap__box {
  position: relative;
  display: grid;
  flex: none;
  width: 16px;
  height: 16px;
}
/* The checkbox's edge is its only cue: --tc-border-control (≥ 3:1) */
.ui-ap__box input {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  margin: 0;
  border-radius: var(--tc-radius-xs);
  background: var(--tc-surface-control);
  box-shadow: inset 0 0 0 1px var(--tc-border-control);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ap__box input:hover {
  box-shadow: inset 0 0 0 1px var(--tc-border-control-hover);
}
.ui-ap__box input:checked {
  background: var(--tc-surface-inverse);
  box-shadow: inset 0 0 0 1px var(--tc-surface-inverse);
}
.ui-ap__box input:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
.ui-ap__box svg {
  position: absolute;
  inset: 0;
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--tc-text-on-inverse);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move);
  pointer-events: none;
}
.ui-ap__box input:checked + svg {
  opacity: 1;
  transform: none;
}
/* Optional label on the gray tray above the card */
.ui-ap__label {
  overflow: hidden;
  padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1);
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* The leaving request is laid over the resolved row – below the label when there is one */
[data-ui="ap"][data-label] .ui-ap__pending[data-leaving] { top: 30px; }
/* actions="card": the buttons close the white card instead of sitting on the tray */
:where([data-look="standard"], [data-look="standard"] *).ui-ap__body > .ui-ap__foot { min-height: 0; margin-top: var(--tc-space-3-5); padding: 0; }
/* actions="card" (the default): one clean white card – no gray tray around it, the decision is its last row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ap"][data-actions="card"] { padding: 0; border-radius: var(--tc-card-radius); background: transparent; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ap"][data-actions="card"] .ui-ap__card { background: var(--tc-surface-raised); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ap"][data-actions="card"] .ui-ap__pending[data-leaving] { top: 0; left: 0; right: 0; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ap"][data-actions="card"][data-label] .ui-ap__pending[data-leaving] { top: 26px; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ap"][data-actions="card"] .ui-ap__label { padding-left: var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ap__body > .ui-ap__foot { min-height: 0; margin-top: var(--tc-space-4); padding: var(--tc-space-3-5) 0 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-ap__body > .ui-ap__foot .ui-ap__always { margin-top: 0; }
/* The tray below the card: countdown on the left, buttons on the right */
.ui-ap__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-1-5) var(--tc-space-3);
  min-height: 44px;
  padding: var(--tc-space-1-5) var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-2-5);
}
.ui-ap__timer {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  min-width: 0;
}
.ui-ap__expires {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transition: color var(--tc-duration-slow) var(--tc-ease-standard);
}
.ui-ap__expires svg {
  width: 14px;
  height: 14px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ui-ap__expires[data-low] {
  color: var(--tc-status-warning-fg);
}
.ui-ap__error {
  flex: 1 1 100%;
  order: 1;
  margin: 0;
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-font-size-sm);
}
.ui-ap__actions {
  display: flex;
  flex: 0 0 auto;
  gap: var(--tc-space-1);
  margin-left: auto;
}
/* Buttons: the control pattern, primary/secondary/ghost exactly like Button */
.ui-ap__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-2);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  font: inherit;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-none);
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ap__btn:active {
  transform: scale(0.97);
}
.ui-ap__btn:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
.ui-ap__btn--primary {
  padding-right: var(--tc-space-2);
  background: var(--tc-action-primary-bg);
  color: var(--tc-action-primary-fg);
  box-shadow: var(--tc-action-primary-shadow);
}
.ui-ap__btn--primary:hover {
  background: var(--tc-action-primary-bg-hover);
}
.ui-ap__btn--primary:active {
  background: var(--tc-action-primary-bg-active);
}
/* Deny – Standard: quiet on the tray, a soft fill on hover; Clean: the secondary button */
.ui-ap__btn--quiet {
  padding-right: var(--tc-space-2);
  background: transparent;
  color: var(--tc-text-primary);
}
.ui-ap__btn--quiet:hover {
  background: var(--tc-action-ghost-bg-hover);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__btn--quiet {
  background: var(--tc-action-secondary-bg);
  color: var(--tc-action-secondary-fg);
  box-shadow: var(--tc-action-secondary-shadow);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__btn--quiet:hover {
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow-hover);
}
.ui-ap__btn--ghost {
  background: transparent;
  color: var(--tc-action-ghost-fg);
}
.ui-ap__btn--ghost:hover {
  background: var(--tc-action-ghost-bg-hover);
  color: var(--tc-text-primary);
}
/* "Stop": a small ghost button next to the countdown */
.ui-ap__stop {
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-1-5);
  border-radius: var(--tc-control-radius-sm);
  font-size: var(--tc-font-size-sm);
}
[data-ui="ap"][data-busy] .ui-ap__btn:not(.ui-ap__approve),
[data-ui="ap"][data-busy] .ui-ap__always {
  opacity: 0.5;
}
[data-ui="ap"][data-busy] .ui-ap__approve {
  cursor: progress;
}
.ui-ap__kbd {
  display: inline-grid;
  place-items: center;
  min-width: var(--tc-kbd-h);
  height: var(--tc-kbd-h);
  padding: 0 var(--tc-kbd-px);
  border-radius: var(--tc-kbd-radius);
  background: var(--tc-kbd-bg);
  box-shadow: var(--tc-kbd-shadow);
  color: var(--tc-kbd-fg);
  font: inherit;
  font-size: var(--tc-kbd-font-size);
  font-weight: var(--tc-kbd-font-weight);
  line-height: var(--tc-line-height-none);
}
.ui-ap__btn--primary .ui-ap__kbd {
  background: var(--tc-kbd-on-inverse-bg);
  box-shadow: none;
  color: var(--tc-approval-card-primary-kbd-fg);
}
.ui-ap__spinner {
  width: 20px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-dasharray: 26 38;
  transform-origin: 50% 50%;
  animation: ui-ap-spin var(--tc-approval-card-spin) linear infinite;
}
/* ---------- Resolved row ---------- */
.ui-ap__resolved {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  min-height: 48px;
  padding: var(--tc-space-3) var(--tc-space-3-5);
  animation: ui-ap-in var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-quick) both;
}
.ui-ap__resolved:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: calc(-1 * var(--tc-focus-ring-width));
}
.ui-ap__mark {
  display: grid;
  flex: none;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--tc-status-success-bg);
  color: var(--tc-status-success-fg);
  animation: ui-ap-pop var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-fast) both;
}
.ui-ap__resolved[data-status="denied"] .ui-ap__mark {
  background: var(--tc-fill-default);
  color: var(--tc-text-muted);
}
.ui-ap__mark svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ui-ap__mark path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ui-ap-draw var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-slow) forwards;
}
.ui-ap__row-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--tc-text-primary);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-ap__row-status {
  flex: none;
  color: var(--tc-text-muted);
  white-space: nowrap;
}
.ui-ap__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
/* ---------- Decision detail (optional): why, consequences, editable arguments, evidence ---------- */
.ui-ap__mini {
  width: 14px;
  height: 14px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__mini { stroke-width: 1.5; }
.ui-ap__why,
.ui-ap__evidence {
  display: grid;
  gap: var(--tc-space-1-5);
  margin-top: var(--tc-space-3-5);
}
.ui-ap__why-label,
.ui-ap__evidence-label,
.ui-ap__outcome-label {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
}
:where([data-look="standard"], [data-look="standard"] *):is(.ui-ap__why-label, .ui-ap__evidence-label, .ui-ap__outcome-label) { font-weight: var(--tc-font-weight-medium); }
.ui-ap__why-label > svg { color: var(--tc-icon-muted); }
.ui-ap__why-text {
  margin: 0;
  color: var(--tc-text-primary);
  line-height: var(--tc-line-height-snug);
}
/* If you approve / If you deny: two quiet panels side by side */
.ui-ap__outcomes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: var(--tc-space-2);
  margin-top: var(--tc-space-3-5);
}
.ui-ap__outcome {
  display: grid;
  align-content: start;
  gap: var(--tc-space-1);
  min-width: 0;
  padding: var(--tc-space-2-5) var(--tc-space-3);
  border-radius: var(--tc-radius-lg);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ap__outcome { background: var(--tc-fill-subtle); }
.ui-ap__outcome[data-kind="approve"] .ui-ap__outcome-label > svg { color: var(--tc-status-success-fg); }
.ui-ap__outcome[data-kind="deny"] .ui-ap__outcome-label > svg { color: var(--tc-status-danger-fg); }
.ui-ap__outcome-text {
  margin: 0;
  color: var(--tc-text-primary);
  line-height: var(--tc-line-height-snug);
}
/* Editable arguments: Edit and Reset under the block, a field per argument, and the changes as a diff */
.ui-ap__args-tools { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-ap__argform { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-ap__argrow { display: grid; grid-template-columns: minmax(6rem, max-content) minmax(0, 1fr); align-items: center; column-gap: var(--tc-space-3); row-gap: var(--tc-space-1); }
.ui-ap__arglabel { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-ap__argkey { color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-ap__argctl { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-ap__argctl > .ui-ap__arg { flex: 1; }
.ui-ap__argarea { height: auto; padding: var(--tc-space-1-5) var(--tc-space-2); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); resize: vertical; }
.ui-ap__argcheck { width: var(--tc-space-4); height: var(--tc-space-4); margin: 0; accent-color: var(--tc-accent); }
.ui-ap__arghint, .ui-ap__argerror { grid-column: 2; margin: 0; font-size: var(--tc-font-size-xs); }
.ui-ap__arghint { color: var(--tc-text-muted); }
.ui-ap__argerror { color: var(--tc-status-danger-fg); }
.ui-ap__argrow[data-invalid] .ui-ap__arg { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-status-danger-fg); }
@container (max-width: 26rem) {
  .ui-ap__argrow { grid-template-columns: minmax(0, 1fr); }
  .ui-ap__arghint, .ui-ap__argerror { grid-column: 1; }
}
/* Edit arguments: the text details become fields */
.ui-ap__args-toggle {
  justify-self: start;
  height: var(--tc-control-h-sm);
  margin-left: calc(-1 * var(--tc-space-2));
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-sm);
  font-size: var(--tc-font-size-sm);
  gap: var(--tc-space-1-5);
}
.ui-ap__details[data-editing] { align-items: center; }
.ui-ap__details[data-editing] dd { overflow: visible; }
.ui-ap__arg {
  width: 100%;
  min-width: 0;
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  outline: 0;
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  font: inherit;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ap__arg:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-ap__arg:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-ap__detail[data-edited] dd {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
}
.ui-ap__edited {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-accent-subtle);
  color: var(--tc-accent-text);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-tight);
}
/* Evidence: chips that open the sources */
.ui-ap__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tc-space-1-5);
  margin: 0;
  padding: 0;
  list-style: none;
}
.ui-ap__chips > li { display: flex; min-width: 0; max-width: 100%; }
.ui-ap__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  max-width: 100%;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-fill-default);
  color: var(--tc-text-secondary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ap__chip:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
.ui-ap__chip:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ap__chip > svg { color: var(--tc-icon-muted); }
.ui-ap__chip-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-ap__chip-detail { flex: none; color: var(--tc-text-muted); }
/* Diff and arguments: mono lines in a quiet box that scrolls – white on Standard's gray preview, a soft fill in Clean */
.ui-ap__code-sec {
  display: grid;
  gap: var(--tc-space-1-5);
  min-width: 0;
}
.ui-ap__code-head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-width: 0;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
}
.ui-ap__code-label {
  flex: none;
  color: var(--tc-text-muted);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ap__code-label { font-weight: var(--tc-font-weight-medium); }
.ui-ap__path {
  min-width: 0;
  overflow: hidden;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-ap__stat {
  flex: none;
  margin-left: auto;
  font-family: var(--tc-font-mono);
  font-variant-numeric: tabular-nums;
}
.ui-ap__plus { color: var(--tc-status-success-fg); }
.ui-ap__minus { color: var(--tc-status-danger-fg); }
.ui-ap__code {
  max-height: var(--tc-approval-card-code-max);
  overflow: auto;
  border-radius: var(--tc-radius-md);
  color: var(--tc-syntax-text);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  letter-spacing: 0;
  tab-size: 2;
  overscroll-behavior: contain;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ap__code {
  background: var(--tc-surface-on-tray);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__code { background: var(--tc-fill-subtle); }
.ui-ap__code:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
.ui-ap__lines {
  display: grid;
  width: max-content;
  min-width: 100%;
  padding: var(--tc-space-2) 0;
}
.ui-ap__line { display: flex; min-width: 0; }
.ui-ap__sign {
  flex: none;
  width: 3ch;
  color: var(--tc-text-muted);
  text-align: center;
  user-select: none;
  -webkit-user-select: none;
}
.ui-ap__lc {
  flex: 1;
  min-height: var(--tc-line-height-normal);
  padding: 0 var(--tc-space-3) 0 0;
  white-space: pre;
}
.ui-ap__code[data-kind="args"] .ui-ap__lc { padding-left: var(--tc-space-3); }
.ui-ap__line[data-kind="add"] { background: var(--tc-status-success-bg); }
.ui-ap__line[data-kind="remove"] { background: var(--tc-status-danger-bg); }
.ui-ap__line[data-kind="add"] .ui-ap__sign { color: var(--tc-status-success-fg); }
.ui-ap__line[data-kind="remove"] .ui-ap__sign { color: var(--tc-status-danger-fg); }
.ui-ap__t-p { color: var(--tc-syntax-property); }
.ui-ap__t-s { color: var(--tc-syntax-string); }
.ui-ap__t-n { color: var(--tc-syntax-number); }
.ui-ap__t-k { color: var(--tc-syntax-keyword); }
@media (forced-colors: active) {
  .ui-ap__code { border: 1px solid CanvasText; }
  .ui-ap__line[data-kind="add"] .ui-ap__sign,
  .ui-ap__line[data-kind="remove"] .ui-ap__sign { color: CanvasText; }
}
/* Narrow: an edited row is marked with a dot, so its field keeps the width (the word stays for screen readers) */
@container (max-width: 400px) {
  .ui-ap__edited { width: 6px; height: 6px; padding: 0; overflow: hidden; border-radius: 50%; background: var(--tc-accent); color: transparent; font-size: 0; }
}
/* Narrow cards: buttons share the full width, the hints go */
@container (max-width: 400px) {
  .ui-ap__actions {
    flex: 1 1 100%;
    margin-left: 0;
  }
  .ui-ap__foot {
    padding-left: var(--tc-space-0-5);
  }
  .ui-ap__timer {
    padding-left: var(--tc-space-2);
  }
  .ui-ap__actions .ui-ap__btn {
    flex: 1 1 0;
    min-width: 0;
    padding: 0 var(--tc-space-2-5);
  }
  .ui-ap__kbd {
    display: none;
  }
}
@container (max-width: 340px) {
  .ui-ap__body { padding: var(--tc-space-3-5); }
  .ui-ap__risk-word { display: none; }
  .ui-ap__row-time { display: none; }
  .ui-ap__details { column-gap: var(--tc-space-3); }
}
/* Touch screens have no shortcuts */
@media (hover: none) {
  .ui-ap__kbd { display: none; }
}
@keyframes ui-ap-out {
  to { opacity: 0; transform: translateY(-6px) scale(0.985); filter: blur(2px); }
}
@keyframes ui-ap-in {
  from { opacity: 0; transform: translateY(4px); filter: blur(2px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-ap-pop {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-ap-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes ui-ap-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ap"],
  [data-ui="ap"] *,
  [data-ui="ap"] *::before,
  [data-ui="ap"] *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
  }
  .ui-ap__spinner { animation: ui-ap-spin var(--tc-duration-shimmer) linear infinite !important; }
  .ui-ap__mark path { stroke-dashoffset: 0; }
}
`;
}

if (!customElements.get("tc-approval-card")) customElements.define("tc-approval-card", TcApprovalCard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-approval-card": TcApprovalCard;
  }
}

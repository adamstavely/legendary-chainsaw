import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcApprovalCard, renderApprovalArgs, renderApprovalDiff, type ApprovalArgs, type ApprovalDiff } from "./approval-card";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { adoptStyles } from "./internal/styles";

/*
 * <tc-approval-gates> – the approval requests of one agent run as a stack of cards. The request to decide now is on
 * top: who asks, what exactly (a diff or the call's arguments, from tc-approval-card) and why, and the steps it holds
 * back. The other open requests peek out behind it ("1 of 2"). Approve, Reject or Ask for changes (with a note):
 * the card drops into the Decided list below and the next one rises. A strip above says it in words – “Waiting on
 * you 2 · Decided 1/3 · Paused – 3 steps wait on 2 gates”. Decided rows fold open to show what was decided.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-approval-gates run="Publish the field-survey report" .gates=${[…]}></tc-approval-gates>
 *
 * Keyboard: Tab reaches the top card's controls in order (Full context, Ask for changes, Reject, Approve); the Decided
 * list is one tab stop – ↑ ↓ Home End move, Enter or Space folds a row open. After a decision focus moves to the next
 * card, or to the decided row when nothing else waits.
 */

/* Layers, check, x, pencil, pause and chevron-down: Lucide (ISC, lucide.dev) */
const layersIcon = svg`<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"></path><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"></path><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"></path>`;
const mini = (body: ReturnType<typeof svg>) => html`<svg class="ui-apg__mini" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const checkIcon = mini(svg`<path d="M20 6 9 17l-5-5"></path>`);
const crossIcon = mini(svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const pencilIcon = mini(svg`<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"></path><path d="m15 5 4 4"></path>`);
const pauseIcon = mini(svg`<rect x="14" y="4" width="4" height="16" rx="1"></rect><rect x="6" y="4" width="4" height="16" rx="1"></rect>`);
const chevronIcon = mini(svg`<path d="m6 9 6 6 6-6"></path>`);

export type GateStatus = "open" | "approved" | "rejected" | "changes-requested";
export type GateDecision = Exclude<GateStatus, "open">;
/** One approval request of the run */
export type ApprovalGate = {
  id: string;
  /** The action in plain words, e.g. "Move the embargo forward a week" */
  title: string;
  /** Who asks, e.g. "Writer" */
  agent?: string;
  /** What kind of request, e.g. "File change", "Command", "Message" */
  kind?: string;
  /** When it was asked, in epoch ms */
  at?: number;
  /** What it changes or why it needs a person, one line */
  reason?: string;
  /** A file change, shown as a small unified diff */
  diff?: ApprovalDiff;
  /** The call's arguments, shown as a code block */
  args?: ApprovalArgs;
  status: GateStatus;
  /** When it was decided, in epoch ms */
  decidedAt?: number;
  /** The note sent with "Ask for changes" */
  note?: string;
  /** The steps of the run waiting behind this gate */
  holds?: string[];
  /** What happened before it and what it touches – shown under "Full context" */
  context?: { before?: string[]; touches?: string[] };
  /** Marks a request that holds up the whole run */
  blocking?: boolean;
};

/** Details of the events */
export type GateDecide = { gate: ApprovalGate; decision: GateDecision; note: string };
export type GatesChange = { gates: ApprovalGate[]; gate: ApprovalGate; decision: GateDecision; note: string };
export type GatesExpandedChange = { expanded: string | null };

export type ApprovalGatesLabels = {
  waiting: string;
  decided: string;
  run: string;
  approve: string;
  reject: string;
  changes: string;
  send: string;
  cancel: string;
  note: string;
  context: string;
  before: string;
  touches: string;
  blocking: string;
  allDecided: string;
  nothingWaits: string;
  empty: string;
  error: string;
  justNow: string;
  diff: string;
  args: string;
  holds: string;
  held: string;
  released: string;
  approved: string;
  rejected: string;
  "changes-requested": string;
};
export const defaultApprovalGatesLabels: ApprovalGatesLabels = {
  waiting: "Waiting on you",
  decided: "Decided",
  run: "Run",
  approve: "Approve",
  reject: "Reject",
  changes: "Ask for changes",
  send: "Send",
  cancel: "Cancel",
  note: "What should change?",
  context: "Full context",
  before: "Before this",
  touches: "Touches",
  blocking: "Blocking",
  allDecided: "All decided",
  nothingWaits: "Nothing waits on you",
  empty: "No approvals in this run yet",
  error: "Couldn't send the decision. Try again.",
  justNow: "just now",
  diff: "Changes",
  args: "Arguments",
  holds: "Holds",
  held: "Held",
  released: "Released",
  approved: "Approved",
  rejected: "Rejected",
  "changes-requested": "Changes asked",
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const fmtCache = new Map<string, Intl.DateTimeFormat>();
/** "6m ago" against `now`; without it the time of day */
function when(t: number | undefined, now: number | undefined, locale: string | undefined, justNow: string) {
  if (t === undefined) return "";
  if (now === undefined) {
    const key = locale ?? "";
    let f = fmtCache.get(key);
    if (!f) fmtCache.set(key, (f = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" })));
    return f.format(t);
  }
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return justNow;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

let uid = 0;

/**
 * The approval requests of an agent run as a stack of cards – decide the top one, and it drops into the decided list.
 * @tag tc-approval-gates
 * @fires tc-decide - Approve, Reject or Send (Ask for changes) was pressed ({ gate, decision, note }: GateDecide); cancelable – prevented, nothing is decided and onDecide isn't called
 * @fires tc-gates-change - A decision went through ({ gates, gate, decision, note }: GatesChange); cancelable – prevented, `gates` stays as it was (controlled use)
 * @fires tc-expanded-change - A decided row was folded open or shut ({ expanded }: GatesExpandedChange); cancelable – prevented, `expanded` stays as it was
 */
export class TcApprovalGates extends TcElement {
  static override ui = "apg";

  /** The heading */
  @property() accessor heading = "Approvals";
  /** The run the requests come from, shown under the heading */
  @property() accessor run = "";
  /** The requests, in the order they should be decided */
  @property({ attribute: false }) accessor gates: ApprovalGate[] = [];
  /** Called with each decision before it's applied. Return a promise to show a spinner until it settles; a rejection keeps the request open and says so */
  @property({ attribute: false }) accessor onDecide: ((decision: GateDecide) => void | Promise<unknown>) | undefined = undefined;
  /** The decided row folded open, by gate id */
  @property() accessor expanded: string | null = null;
  /** The clock for "6m ago", in epoch ms – unset shows the time of day instead */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Locale for the time of day */
  @property() accessor locale: string | undefined = undefined;
  /** Words the page can rename, merged over defaultApprovalGatesLabels */
  @property({ attribute: false }) accessor labels: Partial<ApprovalGatesLabels> = {};

  /** @internal The open note form, by gate id */
  @state() accessor noteFor: string | null = null;
  /** @internal */ @state() accessor noteText = "";
  /** @internal The top card's "Full context", by gate id */
  @state() accessor contextFor: string | null = null;
  /** @internal The decision on its way (a pending onDecide promise) */
  @state() accessor busy: GateDecision | null = null;
  /** @internal */ @state() accessor failed = false;
  /** @internal */ @state() accessor announce = "";
  /** @internal The decided row with the list's tab stop */
  @state() accessor activeRow: string | null = null;
  /** @internal Gates decided here, most recent first – they head the list and say "just now" without a decision time */
  @state() accessor decidedHere: string[] = [];
  /** @internal The card rising after a decision, and the row landing */
  @state() accessor rising: string | null = null;
  /** @internal */ @state() accessor landing: string | null = null;

  private readonly uid = `tc-apg-${++uid}`;
  private alive = false;
  /** After a decision, focus follows once the gate has left the stack */
  private focusAfter: string | null = null;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-apg__gate") ?? this.querySelector<HTMLElement>(".ui-apg__row[tabindex='0']"));
  }

  override connectedCallback() {
    super.connectedCallback();
    // The diff and the arguments are drawn with tc-approval-card's pieces and styles
    adoptStyles("ui-ap", TcApprovalCard.css, this.ownerDocument);
    this.alive = true;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.alive = false;
  }

  private get words(): ApprovalGatesLabels {
    return { ...defaultApprovalGatesLabels, ...this.labels };
  }
  private get open() {
    return this.gates.filter((g) => g.status === "open");
  }
  /** Decided gates: those decided here first (most recent first), then the rest, latest decision first */
  private get decided() {
    const here = this.decidedHere;
    const rank = (g: ApprovalGate) => {
      const i = here.indexOf(g.id);
      return i < 0 ? Infinity : i;
    };
    return this.gates
      .map((g, i) => ({ g, i }))
      .filter(({ g }) => g.status !== "open")
      .sort((a, b) => rank(a.g) - rank(b.g) || (b.g.decidedAt ?? -Infinity) - (a.g.decidedAt ?? -Infinity) || a.i - b.i)
      .map(({ g }) => g);
  }

  private async decide(gate: ApprovalGate, decision: GateDecision) {
    if (this.busy) return;
    const note = decision === "changes-requested" ? this.noteText.trim() : "";
    if (decision === "changes-requested" && !note) {
      this.querySelector<HTMLTextAreaElement>(".ui-apg__note-field")?.focus();
      return;
    }
    const detail: GateDecide = { gate, decision, note };
    if (!this.emit<GateDecide>("tc-decide", detail, { cancelable: true })) return;
    this.failed = false;
    let result: void | Promise<unknown>;
    try {
      result = this.onDecide?.(detail);
    } catch {
      this.failed = true;
      return;
    }
    if (result && typeof (result as Promise<unknown>).then === "function") {
      this.busy = decision;
      try {
        await result;
      } catch {
        if (this.alive) {
          this.busy = null;
          this.failed = true;
        }
        return;
      }
      if (!this.alive) return;
      this.busy = null;
    }
    const next: ApprovalGate = { ...gate, status: decision, ...(this.now !== undefined ? { decidedAt: this.now } : {}), ...(note ? { note } : {}) };
    const gates = this.gates.map((g) => (g.id === gate.id ? next : g));
    const following = gates.find((g) => g.status === "open");
    const w = this.words;
    this.decidedHere = [gate.id, ...this.decidedHere.filter((id) => id !== gate.id)];
    this.landing = gate.id;
    this.rising = following?.id ?? null;
    this.noteFor = null;
    this.noteText = "";
    this.contextFor = null;
    this.focusAfter = this.contains(document.activeElement) ? gate.id : null;
    this.announce = `${w[decision]}: ${gate.title}. ${following ? `Next: ${following.title}.` : `${w.nothingWaits}.`}`;
    if (this.emit<GatesChange>("tc-gates-change", { gates, gate: next, decision, note }, { cancelable: true })) this.gates = gates;
  }

  private setExpanded(id: string | null) {
    if (this.emit<GatesExpandedChange>("tc-expanded-change", { expanded: id }, { cancelable: true })) this.expanded = id;
  }

  private openNote(gate: ApprovalGate) {
    if (this.busy) return;
    this.noteFor = gate.id;
    void this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>(".ui-apg__note-field")?.focus());
  }

  private closeNote() {
    this.noteFor = null;
    this.noteText = "";
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-apg__changes")?.focus());
  }

  private onListKey(e: KeyboardEvent, ids: string[]) {
    const at = ids.indexOf(this.activeRow ?? ids[0]);
    let to = -1;
    if (e.key === "ArrowDown") to = Math.min(ids.length - 1, at + 1);
    else if (e.key === "ArrowUp") to = Math.max(0, at - 1);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = ids.length - 1;
    else return;
    e.preventDefault();
    this.activeRow = ids[to];
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-apg__row[data-id="${CSS.escape(ids[to])}"]`)?.focus());
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // Folding and the note follow their gate: gone or decided, they close
    const open = this.open;
    if (this.noteFor && !open.some((g) => g.id === this.noteFor)) {
      this.noteFor = null;
      this.noteText = "";
    }
    if (this.contextFor && open[0]?.id !== this.contextFor) this.contextFor = null;
    const decided = this.decided;
    if (!decided.some((g) => g.id === this.activeRow)) this.activeRow = decided[0]?.id ?? null;
    this.toggleAttribute("data-busy", !!this.busy);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const id = this.focusAfter;
    if (id && !this.open.some((g) => g.id === id)) {
      this.focusAfter = null;
      const next = this.querySelector<HTMLElement>(".ui-apg__gate");
      if (next) next.focus({ preventScroll: true });
      else {
        this.activeRow = id;
        void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-apg__row[data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true }));
      }
    }
  }

  private renderStats(open: ApprovalGate[], decidedCount: number) {
    const w = this.words;
    const held = [...new Set(open.flatMap((g) => g.holds ?? []))];
    const holding = open.filter((g) => g.holds?.length).length;
    const total = this.gates.length;
    const runText = held.length
      ? `Paused – ${plural(held.length, "step waits", "steps wait")} on ${plural(holding, "gate", "gates")}`
      : open.length
        ? `Running – ${plural(open.length, "request waits", "requests wait")} on you`
        : `Running – ${w.allDecided.toLowerCase()}`;
    return html`<dl class="ui-apg__stats">
      <div class="ui-apg__stat"><dt>${w.waiting}</dt><dd>${open.length}</dd></div>
      <div class="ui-apg__stat"><dt>${w.decided}</dt><dd><span>${decidedCount}<span class="ui-apg__of">/${total}</span></span></dd></div>
      <div class="ui-apg__stat ui-apg__stat--run" ?data-paused=${held.length > 0}><dt>${w.run}</dt><dd>${held.length ? pauseIcon : nothing}${runText}</dd></div>
    </dl>`;
  }

  private renderGate(gate: ApprovalGate, index: number, count: number) {
    const w = this.words;
    const id = `${this.uid}-g`;
    const busy = this.busy;
    const time = when(gate.at, this.now, this.locale, w.justNow);
    const rest = [gate.kind, time].filter(Boolean);
    const ctx = gate.context;
    const hasContext = !!(ctx?.before?.length || ctx?.touches?.length);
    const ctxOpen = hasContext && this.contextFor === gate.id;
    const noteOpen = this.noteFor === gate.id;
    const holds = gate.holds ?? [];
    const spinner = html`<svg class="ui-apg__spinner" viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="6"></circle>`}</svg>`;
    return html`<div
      class="ui-apg__gate"
      role="group"
      tabindex="-1"
      aria-labelledby="${id}-title"
      aria-describedby=${ifDefined(gate.reason ? `${id}-reason` : undefined)}
      aria-busy=${ifDefined(busy ? "true" : undefined)}
      data-id=${gate.id}
      ?data-rise=${this.rising === gate.id}
    >
      <div class="ui-apg__meta">
        <span class="ui-apg__meta-text">${gate.agent ? html`<span class="ui-apg__agent">${gate.agent}</span>` : nothing}${(gate.agent ? rest.map((m) => ` · ${m}`) : rest.join(" · "))}</span>
        ${gate.blocking ? html`<span class="ui-apg__blocking"><span class="ui-apg__dot" aria-hidden="true"></span>${w.blocking}</span>` : nothing}
        ${count > 1 ? html`<span class="ui-apg__pos">${index + 1} of ${count}</span>` : nothing}
      </div>
      <h4 class="ui-apg__title" id="${id}-title">${gate.title}</h4>
      ${gate.reason ? html`<p class="ui-apg__reason" id="${id}-reason">${gate.reason}</p>` : nothing}
      ${gate.diff?.lines.length || gate.args
        ? html`<div class="ui-apg__show">
            ${gate.diff?.lines.length ? renderApprovalDiff(gate.diff, w.diff) : nothing}
            ${gate.args ? renderApprovalArgs(gate.args, w.args) : nothing}
          </div>`
        : nothing}
      ${hasContext
        ? html`<button type="button" class="ui-apg__fold" aria-expanded=${ctxOpen ? "true" : "false"} aria-controls="${id}-ctx" @click=${() => (this.contextFor = ctxOpen ? null : gate.id)}>
              ${chevronIcon}${w.context}
            </button>
            <div class="ui-apg__ctx" id="${id}-ctx" ?hidden=${!ctxOpen}>
              ${ctx?.before?.length
                ? html`<div class="ui-apg__ctx-part"><span class="ui-apg__eyebrow" id="${id}-before">${w.before}</span>
                    <ul class="ui-apg__ctx-list" aria-labelledby="${id}-before">${ctx.before.map((b) => html`<li>${checkIcon}${b}</li>`)}</ul></div>`
                : nothing}
              ${ctx?.touches?.length
                ? html`<div class="ui-apg__ctx-part"><span class="ui-apg__eyebrow" id="${id}-touches">${w.touches}</span>
                    <ul class="ui-apg__ctx-list ui-apg__ctx-list--code" aria-labelledby="${id}-touches">${ctx.touches.map((t) => html`<li><code>${t}</code></li>`)}</ul></div>`
                : nothing}
            </div>`
        : nothing}
      ${holds.length
        ? html`<p class="ui-apg__holds">${pauseIcon}<span>${w.holds} ${plural(holds.length, "step", "steps")}: ${holds.join(", ")}</span></p>`
        : nothing}
      ${noteOpen
        ? html`<div class="ui-apg__note">
            <label class="ui-apg__note-label" for="${id}-note">${w.note}</label>
            <textarea
              class="ui-apg__note-field"
              id="${id}-note"
              rows="2"
              .value=${live(this.noteText)}
              ?disabled=${!!busy}
              @input=${(e: Event) => (this.noteText = (e.target as HTMLTextAreaElement).value)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.isComposing) return;
                if (e.key === "Escape") {
                  e.preventDefault();
                  this.closeNote();
                } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void this.decide(gate, "changes-requested");
                }
              }}
            ></textarea>
            <div class="ui-apg__note-actions">
              <button type="button" class="ui-apg__btn ui-apg__btn--ghost" aria-disabled=${ifDefined(busy ? "true" : undefined)} @click=${() => !this.busy && this.closeNote()}>${w.cancel}</button>
              <button
                type="button"
                class="ui-apg__btn ui-apg__btn--primary ui-apg__send"
                aria-disabled=${ifDefined(busy || !this.noteText.trim() ? "true" : undefined)}
                @click=${() => void this.decide(gate, "changes-requested")}
              >${w.send}${busy === "changes-requested" ? spinner : nothing}</button>
            </div>
          </div>`
        : nothing}
      ${this.failed ? html`<p class="ui-apg__error" role="alert">${w.error}</p>` : nothing}
      ${noteOpen
        ? nothing
        : html`<div class="ui-apg__actions">
            <button type="button" class="ui-apg__btn ui-apg__btn--ghost ui-apg__changes" aria-disabled=${ifDefined(busy ? "true" : undefined)} @click=${() => this.openNote(gate)}>${pencilIcon}${w.changes}</button>
            <span class="ui-apg__grow"></span>
            <button type="button" class="ui-apg__btn ui-apg__btn--secondary ui-apg__reject" aria-disabled=${ifDefined(busy ? "true" : undefined)} @click=${() => void this.decide(gate, "rejected")}>${w.reject}${busy === "rejected" ? spinner : nothing}</button>
            <button type="button" class="ui-apg__btn ui-apg__btn--primary ui-apg__approve" aria-disabled=${ifDefined(busy ? "true" : undefined)} @click=${() => void this.decide(gate, "approved")}>${w.approve}${busy === "approved" ? spinner : nothing}</button>
          </div>`}
    </div>`;
  }

  private renderStack(open: ApprovalGate[]) {
    const w = this.words;
    if (!this.gates.length) return html`<p class="ui-apg__empty">${w.empty}</p>`;
    if (!open.length) return html`<p class="ui-apg__clear"><span class="ui-apg__mark" data-status="approved" aria-hidden="true">${checkIcon}</span>${w.nothingWaits}</p>`;
    const peeks = Math.min(open.length - 1, 2);
    return html`<div class="ui-apg__stack" style="--tc-apg-peeks: ${peeks}">
      ${Array.from({ length: peeks }, (_, i) => html`<div class="ui-apg__peek" data-depth=${peeks - i} aria-hidden="true"></div>`)}
      ${keyed(open[0].id, this.renderGate(open[0], 0, open.length))}
    </div>`;
  }

  private renderDecided(decided: ApprovalGate[]) {
    if (!decided.length) return nothing;
    const w = this.words;
    const ids = decided.map((g) => g.id);
    const active = this.activeRow ?? ids[0];
    const headId = `${this.uid}-decided`;
    return html`<div class="ui-apg__decided">
      <h4 class="ui-apg__sub" id=${headId}>${w.decided} <span class="ui-apg__count">${decided.length}</span></h4>
      <ul class="ui-apg__list" aria-labelledby=${headId} @keydown=${(e: KeyboardEvent) => this.onListKey(e, ids)}>
        ${repeat(decided, (g) => g.id, (g) => {
          const open = this.expanded === g.id;
          const detailId = `${this.uid}-d-${ids.indexOf(g.id)}`;
          const time = g.decidedAt !== undefined ? when(g.decidedAt, this.now, this.locale, w.justNow) : this.decidedHere.includes(g.id) ? w.justNow : "";
          const status = g.status as GateDecision;
          const hasDetail = !!(g.reason || g.note || g.diff?.lines.length || g.args || g.holds?.length);
          return html`<li class="ui-apg__item" ?data-land=${this.landing === g.id}>
            <button
              type="button"
              class="ui-apg__row"
              data-id=${g.id}
              data-status=${status}
              tabindex=${g.id === active ? "0" : "-1"}
              aria-expanded=${ifDefined(hasDetail ? (open ? "true" : "false") : undefined)}
              aria-controls=${ifDefined(hasDetail ? detailId : undefined)}
              @focus=${() => (this.activeRow = g.id)}
              @click=${() => hasDetail && this.setExpanded(open ? null : g.id)}
            >
              <span class="ui-apg__mark" data-status=${status} aria-hidden="true">${status === "approved" ? checkIcon : status === "rejected" ? crossIcon : pencilIcon}</span>
              <span class="ui-apg__row-title">${g.title}</span><span class="tc-sr-only">, </span>
              <span class="ui-apg__row-meta">${g.agent ? html`<span class="ui-apg__row-agent">${g.agent} · </span>` : nothing}<span class="ui-apg__row-status">${w[status]}</span>${time ? html`<span class="ui-apg__row-time"> · ${time}</span>` : nothing}</span>
              ${hasDetail ? html`<span class="ui-apg__chev" aria-hidden="true">${chevronIcon}</span>` : nothing}
            </button>
            ${hasDetail
              ? html`<div class="ui-apg__detail" id=${detailId} ?hidden=${!open}>
                  ${g.reason ? html`<p class="ui-apg__reason">${g.reason}</p>` : nothing}
                  ${g.note ? html`<p class="ui-apg__said"><span class="ui-apg__eyebrow">${w.note}</span>${g.note}</p>` : nothing}
                  ${open && g.diff?.lines.length ? renderApprovalDiff(g.diff, w.diff) : nothing}
                  ${open && g.args ? renderApprovalArgs(g.args, w.args) : nothing}
                  ${g.holds?.length ? html`<p class="ui-apg__holds">${pauseIcon}<span>${status === "approved" ? w.released : w.held} ${plural(g.holds.length, "step", "steps")}: ${g.holds.join(", ")}</span></p>` : nothing}
                </div>`
              : nothing}
          </li>`;
        })}
      </ul>
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const open = this.open;
    const decided = this.decided;
    const clean = this.resolvedLook === "clean";
    const head = cardHead({
      icon: layersIcon,
      title: this.heading,
      subtitle: this.run || nothing,
      id: `${this.uid}-title`,
      aside: this.gates.length
        ? open.length
          ? html`<span class="ui-apg__pill" data-tone="waiting"><span class="ui-apg__dot" aria-hidden="true"></span>${w.waiting}</span>`
          : html`<span class="ui-apg__pill" data-tone="done"><span class="ui-apg__dot" aria-hidden="true"></span>${w.allDecided}</span>`
        : nothing,
    });
    const body = html`
      ${this.gates.length ? this.renderStats(open, decided.length) : nothing}
      <div class="ui-apg__body">${this.renderStack(open)}${this.renderDecided(decided)}</div>
    `;
    return html`
      ${clean ? nothing : head}
      <div class="ui-apg__card" role="group" aria-labelledby="${this.uid}-title">${clean ? head : nothing}${body}</div>
      <span class="tc-sr-only" role="status" aria-live="polite">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="apg"] */
[data-ui="apg"] {
  /* How far each card behind the top one peeks out */
  --tc-approval-gates-peek: 6px;
  --tc-approval-gates-spin: 800ms;
  /* The round status mark of a decided row */
  --tc-approval-gates-mark: 22px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  letter-spacing: var(--tc-tracking-normal);
  -webkit-font-smoothing: antialiased;
}
[data-ui="apg"] *,
[data-ui="apg"] *::before,
[data-ui="apg"] *::after { box-sizing: border-box; }
/* Standard: a gray tray with the header, holding the white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="apg"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="apg"] .ui-apg__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
/* Clean: one white card, the header its first row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="apg"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-apg__card { min-width: 0; }
/* The pill in the header: waiting (amber) or all decided (green), with a dot and a word */
.ui-apg__pill {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-pill-h-lg);
  padding: 0 var(--tc-pill-px-lg);
  border-radius: var(--tc-pill-radius);
  font-size: var(--tc-pill-font-size-lg);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-none);
  white-space: nowrap;
}
.ui-apg__pill[data-tone="waiting"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-apg__pill[data-tone="done"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-apg__dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
/* The strip in words: waiting, decided, the run */
.ui-apg__stats {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: var(--tc-space-1) var(--tc-space-6);
  margin: 0;
  padding: var(--tc-space-3) var(--tc-space-4);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-apg__stats { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-apg__stat { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-apg__stat dt,
.ui-apg__eyebrow {
  color: var(--tc-eyebrow-color);
  font-size: var(--tc-eyebrow-font-size);
  font-weight: var(--tc-eyebrow-font-weight);
  line-height: var(--tc-eyebrow-line-height);
  letter-spacing: var(--tc-eyebrow-tracking);
  text-transform: var(--tc-eyebrow-transform);
}
.ui-apg__stat dd {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  margin: 0;
  color: var(--tc-text-primary);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-medium);
  font-variant-numeric: tabular-nums;
}
.ui-apg__of { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
.ui-apg__stat--run dd { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-regular); }
.ui-apg__stat--run[data-paused] dd { color: var(--tc-status-warning-fg); }
.ui-apg__body { display: grid; gap: var(--tc-space-5); padding: var(--tc-space-4); }
/* ---------- The stack ---------- */
.ui-apg__stack {
  position: relative;
  isolation: isolate;
  padding-bottom: calc(var(--tc-approval-gates-peek) * var(--tc-apg-peeks, 0));
}
.ui-apg__gate,
.ui-apg__peek {
  border-radius: var(--tc-radius-xl);
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default), var(--tc-shadow-raised);
}
:where([data-look="standard"], [data-look="standard"] *).ui-apg__gate,
:where([data-look="standard"], [data-look="standard"] *).ui-apg__peek { background: var(--tc-surface-on-tray); }
.ui-apg__peek {
  position: absolute;
  inset: 0;
  z-index: -1;
  transform: translateY(calc(var(--tc-approval-gates-peek) * var(--d))) scale(calc(1 - 0.035 * var(--d)));
  transform-origin: 50% 100%;
}
.ui-apg__peek[data-depth="1"] { --d: 1; }
.ui-apg__peek[data-depth="2"] { --d: 2; z-index: -2; }
.ui-apg__gate {
  position: relative;
  display: grid;
  gap: var(--tc-space-2-5);
  min-width: 0;
  padding: var(--tc-space-4);
  outline: none;
}
.ui-apg__gate:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-apg__gate[data-rise] { animation: ui-apg-rise var(--tc-duration-slower) var(--tc-ease-move) both; }
.ui-apg__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-1) var(--tc-space-2);
  min-width: 0;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
}
.ui-apg__meta-text { min-width: 0; }
.ui-apg__agent { color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); }
.ui-apg__blocking {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-status-danger-bg);
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
}
.ui-apg__pos { margin-left: auto; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-apg__title {
  margin: 0;
  color: var(--tc-text-strong);
  font-size: var(--tc-title-font-size);
  font-weight: var(--tc-title-font-weight);
  line-height: var(--tc-title-line-height);
}
.ui-apg__reason { margin: 0; color: var(--tc-text-secondary); }
.ui-apg__show { display: grid; gap: var(--tc-space-3); min-width: 0; margin-top: var(--tc-space-1); }
/* Full context: a quiet fold */
.ui-apg__fold {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: var(--tc-space-1);
  height: var(--tc-control-h-sm);
  margin-left: calc(-1 * var(--tc-space-2));
  padding: 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: transparent;
  color: var(--tc-text-secondary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  cursor: pointer;
}
.ui-apg__fold:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-apg__fold:focus-visible,
.ui-apg__btn:focus-visible,
.ui-apg__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-apg__fold .ui-apg__mini { transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-apg__fold[aria-expanded="true"] .ui-apg__mini { transform: rotate(180deg); }
.ui-apg__ctx { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: var(--tc-space-3); }
.ui-apg__ctx[hidden] { display: none; }
.ui-apg__ctx-part { display: grid; align-content: start; gap: var(--tc-space-1-5); min-width: 0; }
.ui-apg__ctx-list { display: grid; gap: var(--tc-space-1); margin: 0; padding: 0; list-style: none; color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); }
.ui-apg__ctx-list li { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-apg__ctx-list li > .ui-apg__mini { color: var(--tc-status-success-fg); }
.ui-apg__ctx-list code { overflow: hidden; color: var(--tc-text-primary); font-family: var(--tc-font-mono); text-overflow: ellipsis; white-space: nowrap; }
.ui-apg__holds {
  display: flex;
  align-items: flex-start;
  gap: var(--tc-space-1-5);
  margin: 0;
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
}
.ui-apg__holds > .ui-apg__mini { margin-top: var(--tc-space-0-5); color: var(--tc-status-warning-fg); }
.ui-apg__mini {
  width: 14px;
  height: 14px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-apg__mini { stroke-width: 1.5; }
/* Ask for changes: a note before it's sent */
.ui-apg__note { display: grid; gap: var(--tc-space-1-5); }
.ui-apg__note-label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); }
.ui-apg__note-field {
  width: 100%;
  min-height: var(--tc-control-h-lg);
  margin: 0;
  padding: var(--tc-space-2) var(--tc-space-2-5);
  border: 0;
  border-radius: var(--tc-field-radius);
  outline: 0;
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  font: inherit;
  resize: vertical;
}
.ui-apg__note-field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-apg__note-field:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-apg__note-actions { display: flex; justify-content: flex-end; gap: var(--tc-space-1); }
.ui-apg__error { margin: 0; color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); }
/* The decision: Ask for changes on the left, Reject and Approve on the right */
.ui-apg__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); margin-top: var(--tc-space-1); }
.ui-apg__grow { flex: 1 1 0; }
.ui-apg__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5);
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
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
.ui-apg__btn:active { transform: scale(0.97); }
.ui-apg__btn--primary { background: var(--tc-action-primary-bg); color: var(--tc-action-primary-fg); box-shadow: var(--tc-action-primary-shadow); }
.ui-apg__btn--primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-apg__btn--secondary { background: var(--tc-action-secondary-bg); color: var(--tc-action-secondary-fg); box-shadow: var(--tc-action-secondary-shadow); }
.ui-apg__btn--secondary:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-apg__btn--ghost { background: transparent; color: var(--tc-action-ghost-fg); }
.ui-apg__btn--ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-apg__changes { margin-left: calc(-1 * var(--tc-space-2)); padding: 0 var(--tc-space-2); }
.ui-apg__send[aria-disabled="true"],
[data-ui="apg"][data-busy] .ui-apg__btn:not(:has(.ui-apg__spinner)) { opacity: 0.5; cursor: not-allowed; }
[data-ui="apg"][data-busy] .ui-apg__btn:has(.ui-apg__spinner) { cursor: progress; }
.ui-apg__spinner {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-dasharray: 26 38;
  animation: ui-apg-spin var(--tc-approval-gates-spin) linear infinite;
}
.ui-apg__empty,
.ui-apg__clear {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  margin: 0;
  padding: var(--tc-space-3) 0;
  color: var(--tc-text-muted);
}
/* ---------- Decided ---------- */
.ui-apg__decided { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-apg__sub {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  margin: 0;
  color: var(--tc-eyebrow-color);
  font-size: var(--tc-eyebrow-font-size);
  font-weight: var(--tc-eyebrow-font-weight);
  line-height: var(--tc-eyebrow-line-height);
  letter-spacing: var(--tc-eyebrow-tracking);
  text-transform: var(--tc-eyebrow-transform);
}
.ui-apg__count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-apg__list { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-apg__item { min-width: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-apg__item:first-child { border-top: 0; }
.ui-apg__item[data-land] { animation: ui-apg-land var(--tc-duration-slower) var(--tc-ease-move) both; }
.ui-apg__row {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  width: 100%;
  min-height: var(--tc-control-h-lg);
  margin: 0;
  padding: var(--tc-space-1-5) var(--tc-space-1);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ui-apg__row:hover { background: var(--tc-fill-hover); }
.ui-apg__mark {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--tc-approval-gates-mark);
  height: var(--tc-approval-gates-mark);
  border-radius: 50%;
}
.ui-apg__mark[data-status="approved"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-apg__mark[data-status="rejected"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-apg__mark[data-status="changes-requested"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-apg__row-title { flex: 1 1 auto; min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-overflow: ellipsis; white-space: nowrap; }
.ui-apg__row-meta { flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-apg__chev { display: inline-flex; color: var(--tc-icon-muted); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-apg__row[aria-expanded="true"] .ui-apg__chev { transform: rotate(180deg); }
.ui-apg__detail { display: grid; gap: var(--tc-space-2-5); min-width: 0; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-3) calc(var(--tc-approval-gates-mark) + var(--tc-space-3-5)); }
.ui-apg__detail[hidden] { display: none; }
.ui-apg__said { display: grid; gap: var(--tc-space-0-5); margin: 0; color: var(--tc-text-primary); }
/* Narrow: the strip stacks, the run's words get their own line, the buttons share the width */
@container (max-width: 480px) {
  .ui-apg__stats { grid-template-columns: auto auto; }
  .ui-apg__stat--run { grid-column: 1 / -1; }
  .ui-apg__grow { flex-basis: 100%; height: 0; }
  .ui-apg__actions .ui-apg__btn:not(.ui-apg__changes) { flex: 1 1 0; min-width: 0; }
  .ui-apg__row-agent,
  .ui-apg__row-time { display: none; }
  .ui-apg__detail { padding-left: var(--tc-space-1); }
}
@container (max-width: 340px) {
  .ui-apg__body,
  .ui-apg__gate { padding: var(--tc-space-3); }
  .ui-apg__stats { padding: var(--tc-space-3); }
}
@keyframes ui-apg-rise {
  from { opacity: 0; transform: translateY(var(--tc-approval-gates-peek)) scale(0.97); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-apg-land {
  from { opacity: 0; transform: translateY(calc(-3 * var(--tc-approval-gates-peek))); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-apg-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="apg"] *,
  [data-ui="apg"] *::before,
  [data-ui="apg"] *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
  }
  .ui-apg__spinner { animation: ui-apg-spin var(--tc-duration-shimmer) linear infinite !important; }
}
@media (forced-colors: active) {
  .ui-apg__gate,
  .ui-apg__peek { border: 1px solid CanvasText; }
  .ui-apg__mark,
  .ui-apg__dot { forced-color-adjust: none; color: CanvasText; }
}
`;
}

if (!customElements.get("tc-approval-gates")) customElements.define("tc-approval-gates", TcApprovalGates);

declare global {
  interface HTMLElementTagNameMap {
    "tc-approval-gates": TcApprovalGates;
  }
}

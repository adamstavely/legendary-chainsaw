import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { safeUrl } from "./internal/safe-url";
import { initials } from "./internal/util";

/*
 * <tc-decision-card> – one question an agent needs answered before it carries on, as its own card docked just above
 * the chat composer. The header names the agent and says how long it has waited; then the question, a line of
 * context, and numbered options – one of them may be Recommended, which takes the first focus but is never picked for
 * you. "Something else…" (`allow-other`) opens a short field. For a yes / no step, `kind="approve"` shows Approve and
 * Decline instead, Decline asking for an optional reason. When several decisions wait, "1 of 3" with previous / next
 * steps through them (the page swaps the content).
 * Sending folds the card into a one-line receipt – "You chose: Archive the duplicates" – with Undo for a few seconds.
 * Standard: the header on a gray tray above a white card, Send on the tray below. Clean: one white card.
 *
 *   <tc-decision-card agent="Records agent" question="Which copy should I keep?" .options=${options}
 *     @tc-decision=${(e) => agent.answer(e.detail)}></tc-decision-card>
 *
 * Keyboard. The options are a radio group with one tab stop – the picked option, else the recommended one; the arrow
 * keys move and pick. 1–9 pick an option from anywhere in the card (outside a text field). ⌘ / Ctrl + Enter sends,
 * Escape defers ("Later").
 */

export type DecisionCardKind = "choose" | "approve";

export type DecisionCardOption = {
  id: string;
  label: string;
  /** A quiet line under the label: what this option means or costs */
  detail?: string;
  /** The agent's suggestion – at most one; shows a Recommended chip and takes the first focus */
  recommended?: boolean;
};

/** What was decided: an option's id, "other" with the text, or "approve" / "decline" with an optional reason */
export type DecisionCardMade = { choice: string; other?: string; reason?: string };
/** Detail of tc-value-change */
export type DecisionCardValueChange = { value: string | null };
/** Detail of tc-position-change */
export type DecisionCardPositionChange = { position: number };
/** Detail of tc-undo */
export type DecisionCardUndo = { decision: DecisionCardMade };

export type DecisionCardLabels = {
  status: string;
  send: string;
  later: string;
  approve: string;
  decline: string;
  confirmDecline: string;
  back: string;
  other: string;
  otherPlaceholder: string;
  reasonPlaceholder: string;
  recommended: string;
  chose: string;
  approved: string;
  declined: string;
  sent: string;
  undo: string;
  pick: string;
  previous: string;
  next: string;
};

export const defaultDecisionCardLabels: DecisionCardLabels = {
  status: "Needs your decision",
  send: "Send",
  later: "Later",
  approve: "Approve",
  decline: "Decline",
  confirmDecline: "Decline",
  back: "Back",
  other: "Something else…",
  otherPlaceholder: "Say what you'd like instead",
  reasonPlaceholder: "Why not? (optional)",
  recommended: "Recommended",
  chose: "You chose",
  approved: "You approved",
  declined: "You declined",
  sent: "Decision sent",
  undo: "Undo",
  pick: "Pick an option first",
  previous: "Previous decision",
  next: "Next decision",
};

/** The value of the "Something else…" option, and the choice it sends */
export const DECISION_CARD_OTHER = "other";

/** How long it has waited: just now · 4 min · 2 h 10 min · 3 d */
export function waitedFor(ms: number): string {
  const m = Math.floor(Math.max(0, ms) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

/** Wall time – read in updates and timers only, never during render */
const wall = () => Date.now();

/* Icons: Lucide (ISC, lucide.dev), 24×24 strokes */
const ICON_CHECK = "M20 6 9 17l-5-5";
const ICON_LEFT = "m15 18-6-6 6-6";
const ICON_RIGHT = "m9 18 6-6-6-6";
const glyph = (d: string) => html`<svg class="ui-dcd__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

let instances = 0;

/**
 * One question an agent needs answered before it carries on – numbered options with one recommended, or Approve /
 * Decline – docked above the composer, folding into a receipt with Undo once sent.
 * @tag tc-decision-card
 * @fires tc-value-change - An option was picked ({ value }: DecisionCardValueChange); cancelable – prevented, `value` stays as it was
 * @fires tc-decision - Send, Approve or Decline ({ choice, other?, reason? }: DecisionCardMade); cancelable – unless prevented the card folds into its receipt
 * @fires tc-defer - Later or Escape: the person will decide later ({})
 * @fires tc-undo - Undo on the receipt ({ decision }: DecisionCardUndo); cancelable – unless prevented the card opens again
 * @fires tc-position-change - Previous or next decision in the queue ({ position }: DecisionCardPositionChange); cancelable – prevented, `position` stays
 */
export class TcDecisionCard extends TcElement {
  static override ui = "dcd";

  /** Who is asking: the agent's name */
  @property() accessor agent = "Agent";
  /** The agent's picture (an image URL); unset shows its initials */
  @property() accessor avatar: string | undefined = undefined;
  /** The question, as the agent asks it */
  @property() accessor question = "";
  /** A line or two of context: what the agent found, why it can't go on alone */
  @property() accessor context: string | undefined = undefined;
  /** "choose" (default): numbered options; "approve": Approve and Decline */
  @property({ reflect: true }) accessor kind: DecisionCardKind = "choose";
  /** The options for kind="choose", in the agent's order */
  @property({ attribute: false }) accessor options: DecisionCardOption[] = [];
  /** Offers "Something else…" with a short field */
  @property({ type: Boolean, attribute: "allow-other" }) accessor allowOther = false;
  /** The picked option's id ("other" for Something else), or null */
  @property() accessor value: string | null = null;
  /** The text of Something else */
  @property({ attribute: "other-text" }) accessor otherText = "";
  /** When the agent asked, in epoch ms – the header says how long it has waited */
  @property({ type: Number }) accessor since: number | undefined = undefined;
  /** The time now, in epoch ms; unset reads the clock, once a minute */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** How many decisions wait in all; above 1 the header shows "1 of 3" with previous / next */
  @property({ type: Number }) accessor queue = 1;
  /** Which of the waiting decisions this is, from 0 */
  @property({ type: Number }) accessor position = 0;
  /** Sent: the card shows its receipt */
  @property({ type: Boolean, reflect: true }) accessor sent = false;
  /** What was sent – the receipt reads it */
  @property({ attribute: false }) accessor decision: DecisionCardMade | null = null;
  /** How long Undo stays on the receipt, in ms (0 hides it) */
  @property({ type: Number, attribute: "undo-ms" }) accessor undoMs = 6000;
  /** Words the page can change, merged over defaultDecisionCardLabels */
  @property({ attribute: false }) accessor labels: Partial<DecisionCardLabels> = {};

  /** @internal Decline was pressed: the reason field shows */
  @state() accessor declining = false;
  /** @internal The reason typed for Decline */
  @state() accessor reason = "";
  /** @internal Undo is still offered */
  @state() accessor undoOpen = false;
  /** @internal Send was tried with nothing picked */
  @state() accessor missing = false;
  /** @internal What the status region says */
  @state() accessor said = "";
  /** @internal The clock, when the page doesn't pass `now` */
  @state() accessor clock = 0;

  private readonly uid = `tc-dcd${++instances}`;
  private focusNext: string | null = null;
  private undoTimer = 0;
  private tick = 0;

  constructor() {
    super();
    // Sending replaces the options with the receipt, and Undo the receipt with the options
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(this.sent ? ".ui-dcd__receipt" : ".ui-dcd__card"));
  }

  private get l(): DecisionCardLabels {
    return { ...defaultDecisionCardLabels, ...this.labels };
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.undoTimer);
    window.clearInterval(this.tick);
    this.tick = 0;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (!this.clock || changed.has("since")) this.clock = wall();
    if (changed.has("value") && this.value !== null) this.missing = false;
    // Turning sent – by Send, or by a page that controls it – opens the Undo window and announces the receipt
    if (changed.has("sent") && changed.get("sent") !== undefined) {
      window.clearTimeout(this.undoTimer);
      this.undoOpen = this.sent && this.undoMs > 0;
      this.declining = false;
      this.said = this.sent ? this.receiptText(this.decision) : "";
      if (this.undoOpen) this.undoTimer = window.setTimeout(() => (this.undoOpen = false), this.undoMs);
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    // A minute's tick while the waited-for time shows and the page doesn't drive the clock
    const ticking = this.since !== undefined && this.now === undefined && !this.sent && this.isConnected;
    if (ticking && !this.tick) this.tick = window.setInterval(() => (this.clock = wall()), 60000);
    else if (!ticking && this.tick) {
      window.clearInterval(this.tick);
      this.tick = 0;
    }
    if (changed.has("position") && changed.get("position") !== undefined) this.declining = false;
    if (this.focusNext) {
      const sel = this.focusNext;
      this.focusNext = null;
      this.querySelector<HTMLElement>(sel)?.focus();
    }
  }

  /* ---------- Choices ---------- */

  /** The choices as the radio group lists them: the options, then Something else */
  private get choices(): DecisionCardOption[] {
    return this.allowOther ? [...this.options, { id: DECISION_CARD_OTHER, label: this.l.other }] : this.options;
  }

  private pick(id: string, focus = false) {
    if (id !== this.value && this.emit<DecisionCardValueChange>("tc-value-change", { value: id }, { cancelable: true })) this.value = id;
    if (focus) this.focusNext = `[data-choice="${CSS.escape(id)}"]`;
  }

  private labelOf(id: string) {
    return this.options.find((o) => o.id === id)?.label ?? id;
  }

  /* ---------- Sending ---------- */

  private send(made?: DecisionCardMade) {
    let decision = made;
    if (!decision) {
      if (this.kind === "approve") return;
      const other = this.value === DECISION_CARD_OTHER;
      if (this.value === null || (other && !this.otherText.trim())) {
        this.missing = true;
        this.said = other ? this.l.otherPlaceholder : this.l.pick;
        this.focusNext = other ? `#${this.uid}-other` : ".ui-dcd__choice[tabindex='0']";
        this.requestUpdate();
        return;
      }
      decision = other ? { choice: DECISION_CARD_OTHER, other: this.otherText.trim() } : { choice: this.value! };
    }
    // Kept even when a controlling page prevents it: the receipt reads it once the page sets `sent`
    this.decision = decision;
    if (!this.emit<DecisionCardMade>("tc-decision", decision, { cancelable: true })) return;
    this.sent = true;
    this.focusNext = ".ui-dcd__receipt";
  }

  private undo() {
    const decision = this.decision ?? { choice: this.value ?? "" };
    if (!this.emit<DecisionCardUndo>("tc-undo", { decision }, { cancelable: true })) return;
    this.sent = false;
    this.focusNext = this.kind === "approve" ? ".ui-dcd__btn--primary" : ".ui-dcd__choice[tabindex='0']";
  }

  private defer() {
    this.emit("tc-defer", {});
  }

  private move(step: number) {
    const position = Math.max(0, Math.min(this.queue - 1, this.position + step));
    if (position === this.position) return;
    if (this.emit<DecisionCardPositionChange>("tc-position-change", { position }, { cancelable: true })) this.position = position;
  }

  /* ---------- Keyboard ---------- */

  private onKey = (e: KeyboardEvent) => {
    if (this.sent || e.isComposing) return;
    const inField = (e.target as Element).matches("input, textarea");
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (this.kind === "approve") this.send(this.declining ? { choice: "decline", ...(this.reason.trim() ? { reason: this.reason.trim() } : {}) } : { choice: "approve" });
      else this.send();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (this.declining) {
        this.declining = false;
        this.focusNext = ".ui-dcd__btn--decline";
      } else this.defer();
      return;
    }
    if (!inField && this.kind === "choose" && /^[1-9]$/.test(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const c = this.choices[Number(e.key) - 1];
      if (!c) return;
      e.preventDefault();
      this.pick(c.id, true);
    }
  };

  private onChoiceKey(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const list = this.choices;
    const at = list.findIndex((c) => c.id === (e.target as HTMLElement).dataset.choice);
    if (at < 0) return;
    const n = list.length;
    const to =
      e.key === "ArrowDown" || e.key === "ArrowRight" ? (at + 1) % n
      : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (at - 1 + n) % n
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : -1;
    if (to < 0) return;
    e.preventDefault();
    this.pick(list[to].id, true);
  }

  /* ---------- Rendering ---------- */

  private receiptText(d: DecisionCardMade | null) {
    if (!d) return this.l.sent;
    if (d.choice === "approve" && this.kind === "approve") return this.l.approved;
    if (d.choice === "decline" && this.kind === "approve") return d.reason ? `${this.l.declined}: ${d.reason}` : this.l.declined;
    return `${this.l.chose}: ${d.choice === DECISION_CARD_OTHER ? (d.other ?? this.l.other) : this.labelOf(d.choice)}`;
  }

  private renderHead() {
    const l = this.l;
    const waited = this.since !== undefined ? waitedFor((this.now ?? this.clock) - this.since) : "";
    const picture = this.avatar && safeUrl(this.avatar) ? html`<img src=${safeUrl(this.avatar)!} alt="" />` : html`<span class="ui-dcd__initials">${initials(this.agent)}</span>`;
    const queue =
      this.queue > 1
        ? html`<span class="ui-dcd__queue">
            <button type="button" class="ui-dcd__step" aria-label=${l.previous} ?disabled=${this.position <= 0} @click=${() => this.move(-1)}>${glyph(ICON_LEFT)}</button>
            <span class="ui-dcd__count" aria-live="polite">${this.position + 1} of ${this.queue}</span>
            <button type="button" class="ui-dcd__step" aria-label=${l.next} ?disabled=${this.position >= this.queue - 1} @click=${() => this.move(1)}>${glyph(ICON_RIGHT)}</button>
          </span>`
        : nothing;
    const sub = html`<span class="ui-dcd__status">${l.status}</span>${waited ? html`<span aria-hidden="true"> · </span><span class="ui-dcd__sr">, </span><span class="ui-dcd__waited">${waited === "just now" ? waited : `waiting ${waited}`}</span>` : nothing}`;
    return cardHead({ picture, title: this.agent, subtitle: sub, id: `${this.uid}-agent`, aside: queue });
  }

  private renderChoices() {
    const l = this.l;
    const list = this.choices;
    const picked = list.findIndex((c) => c.id === this.value);
    const rec = list.findIndex((c) => c.recommended);
    const stop = picked >= 0 ? picked : Math.max(0, rec);
    const other = this.value === DECISION_CARD_OTHER;
    return html`<div
        class="ui-dcd__choices"
        role="radiogroup"
        aria-labelledby=${`${this.uid}-q`}
        aria-required="true"
        aria-describedby=${`${this.uid}-keys${this.missing ? ` ${this.uid}-err` : ""}`}
        @keydown=${(e: KeyboardEvent) => this.onChoiceKey(e)}
      >
        ${repeat(
          list,
          (c) => c.id,
          (c, i) => html`<button
            type="button"
            class="ui-dcd__choice"
            role="radio"
            data-choice=${c.id}
            aria-checked=${c.id === this.value ? "true" : "false"}
            tabindex=${i === stop ? 0 : -1}
            ?data-recommended=${!!c.recommended}
            ?data-other=${c.id === DECISION_CARD_OTHER}
            @click=${() => this.pick(c.id)}
          >
            <span class="ui-dcd__num" aria-hidden="true">${i < 9 ? i + 1 : ""}</span>
            <span class="ui-dcd__choice-text"
              ><span class="ui-dcd__choice-label">${c.label}</span>${c.recommended ? html`<span class="ui-dcd__sr">, </span><span class="ui-dcd__chip">${l.recommended}</span>` : nothing}${c.detail
                ? html`<span class="ui-dcd__sr">, </span><span class="ui-dcd__choice-detail">${c.detail}</span>`
                : nothing}</span
            >
            <span class="ui-dcd__radio" aria-hidden="true"></span>
          </button>`,
        )}
      </div>
      ${other
        ? html`<input
            id=${`${this.uid}-other`}
            class="ui-dcd__input"
            type="text"
            .value=${live(this.otherText)}
            placeholder=${l.otherPlaceholder}
            aria-label=${l.other}
            aria-invalid=${this.missing ? "true" : "false"}
            @input=${(e: Event) => {
              this.otherText = (e.target as HTMLInputElement).value;
              if (this.otherText.trim()) this.missing = false;
            }}
          />`
        : nothing}
      ${this.missing ? html`<p class="ui-dcd__error" id=${`${this.uid}-err`}>${other ? l.otherPlaceholder : l.pick}</p>` : nothing}`;
  }

  private renderReason() {
    return html`<label class="ui-dcd__reason">
      <span class="ui-dcd__sr">${this.l.reasonPlaceholder}</span>
      <textarea
        id=${`${this.uid}-reason`}
        class="ui-dcd__input ui-dcd__textarea"
        rows="2"
        .value=${live(this.reason)}
        placeholder=${this.l.reasonPlaceholder}
        @input=${(e: Event) => (this.reason = (e.target as HTMLTextAreaElement).value)}
      ></textarea>
    </label>`;
  }

  private renderFoot() {
    const l = this.l;
    const kbd = html`<kbd class="ui-dcd__kbd" aria-hidden="true">⌘↵</kbd>`;
    let buttons;
    if (this.kind === "approve") {
      buttons = this.declining
        ? html`<button type="button" class="ui-dcd__btn ui-dcd__btn--ghost" @click=${() => ((this.declining = false), (this.focusNext = ".ui-dcd__btn--decline"))}>${l.back}</button>
            <button type="button" class="ui-dcd__btn ui-dcd__btn--danger" aria-keyshortcuts="Control+Enter Meta+Enter" @click=${() => this.send({ choice: "decline", ...(this.reason.trim() ? { reason: this.reason.trim() } : {}) })}>${l.confirmDecline}${kbd}</button>`
        : html`<button type="button" class="ui-dcd__btn ui-dcd__btn--ghost" aria-keyshortcuts="Escape" @click=${() => this.defer()}>${l.later}</button>
            <button type="button" class="ui-dcd__btn ui-dcd__btn--secondary ui-dcd__btn--decline" @click=${() => ((this.declining = true), (this.focusNext = `#${this.uid}-reason`))}>${l.decline}</button>
            <button type="button" class="ui-dcd__btn ui-dcd__btn--primary" aria-keyshortcuts="Control+Enter Meta+Enter" @click=${() => this.send({ choice: "approve" })}>${l.approve}${kbd}</button>`;
    } else
      buttons = html`<button type="button" class="ui-dcd__btn ui-dcd__btn--ghost" aria-keyshortcuts="Escape" @click=${() => this.defer()}>${l.later}</button>
        <button type="button" class="ui-dcd__btn ui-dcd__btn--primary" aria-keyshortcuts="Control+Enter Meta+Enter" @click=${() => this.send()}>${l.send}${kbd}</button>`;
    return html`<div class="ui-dcd__foot"><span class="ui-dcd__buttons">${buttons}</span></div>`;
  }

  private renderReceipt() {
    return html`<div class="ui-dcd__receipt" tabindex="-1" role="group" aria-label=${this.receiptText(this.decision)}>
      <span class="ui-dcd__tick" aria-hidden="true">${glyph(ICON_CHECK)}</span>
      <span class="ui-dcd__receipt-text">${this.receiptText(this.decision)}</span>
      <span class="ui-dcd__receipt-agent">${this.agent}</span>
      ${this.undoOpen ? html`<button type="button" class="ui-dcd__btn ui-dcd__btn--ghost ui-dcd__undo" @click=${() => this.undo()}>${this.l.undo}</button>` : nothing}
    </div>`;
  }

  protected override render() {
    const status = html`<span class="ui-dcd__sr" role="status">${this.said}</span>`;
    if (this.sent) return html`${this.renderReceipt()}${status}`;
    const clean = this.resolvedLook === "clean";
    const head = this.renderHead();
    const body = html`<div class="ui-dcd__body">
      <p class="ui-dcd__question" id=${`${this.uid}-q`}>${this.question}</p>
      ${this.context ? html`<p class="ui-dcd__context">${this.context}</p>` : nothing}
      ${this.kind === "approve" ? (this.declining ? this.renderReason() : nothing) : this.renderChoices()}
    </div>`;
    const keys =
      this.kind === "choose"
        ? html`<span class="ui-dcd__sr" id=${`${this.uid}-keys`}>Arrow keys or 1 to ${Math.min(9, this.choices.length)} pick; Control or Command Enter sends; Escape decides later</span>`
        : nothing;
    return html`<section class="ui-dcd__form" aria-labelledby=${`${this.uid}-agent ${this.uid}-q`} @keydown=${this.onKey}>
        ${clean ? html`<div class="ui-dcd__card" tabindex="-1">${head}${body}${this.renderFoot()}</div>` : html`${head}<div class="ui-dcd__card" tabindex="-1">${body}</div>${this.renderFoot()}`}
        ${keys}
      </section>
      ${status}`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; Later and Send sit on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dcd"] {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  /* The option number's size – the option text lines up after it */
  --tc-dcd-num: 22px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dcd"] {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  --tc-dcd-num: 20px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="dcd"] *, [data-ui="dcd"] *::before, [data-ui="dcd"] *::after { box-sizing: border-box; }
:where([data-ui="dcd"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="dcd"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="dcd"] button:disabled { cursor: default; color: var(--tc-text-disabled); }
[data-ui="dcd"] p { margin: 0; }
.ui-dcd__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-dcd__glyph { display: block; flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-dcd__glyph { stroke-width: 1.5; }
.ui-dcd__initials { display: grid; place-items: center; width: 100%; height: 100%; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); color: var(--tc-accent-text); background: var(--tc-accent-subtle); }
.ui-dcd__status { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-dcd__waited { font-variant-numeric: tabular-nums; }
/* The queue: 1 of 3 with previous / next */
.ui-dcd__queue { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); white-space: nowrap; }
.ui-dcd__step { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); }
.ui-dcd__step:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-dcd__count { padding: 0 var(--tc-space-1); }
/* ----- The card ----- */
.ui-dcd__card { min-width: 0; outline: none; animation: ui-dcd-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-dcd__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-dcd__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-dcd__body { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *) .ui-dcd__body { padding-top: var(--tc-space-1); }
.ui-dcd__question { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-wrap: pretty; }
.ui-dcd__context { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-wrap: pretty; }
/* ----- Options: numbered rows, the picked one tinted and ringed ----- */
.ui-dcd__choices { display: grid; gap: var(--tc-space-1); margin-top: var(--tc-space-1); }
.ui-dcd__choice { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: var(--tc-control-h-md); padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 1px var(--tc-border-default); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *) .ui-dcd__choice { border-radius: var(--tc-radius-md); box-shadow: none; background: var(--tc-fill-subtle); }
.ui-dcd__choice:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *) .ui-dcd__choice:hover { background: var(--tc-fill-default); }
.ui-dcd__choice[aria-checked="true"] { background: var(--tc-accent-subtle) !important; box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
.ui-dcd__num { display: grid; flex: none; place-items: center; width: var(--tc-dcd-num); height: var(--tc-dcd-num); border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
[aria-checked="true"] > .ui-dcd__num { background: var(--tc-accent-solid); color: var(--tc-text-on-accent); }
.ui-dcd__choice-text { display: flex; flex: 1; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-2); min-width: 0; }
.ui-dcd__choice-label { min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
[aria-checked="true"] .ui-dcd__choice-label { color: var(--tc-accent-text); }
.ui-dcd__choice[data-other] .ui-dcd__choice-label { color: var(--tc-text-muted); }
.ui-dcd__choice-detail { flex-basis: 100%; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-dcd__chip { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-success-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-status-success-fg); }
.ui-dcd__radio { position: relative; flex: none; width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--tc-border-control); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-dcd__radio::after { content: ""; position: absolute; inset: 4px; border-radius: 50%; background: var(--tc-accent); transform: scale(0); transition: transform var(--tc-duration-moderate) var(--tc-ease-spring); }
[aria-checked="true"] > .ui-dcd__radio { box-shadow: inset 0 0 0 1.5px var(--tc-accent); }
[aria-checked="true"] > .ui-dcd__radio::after { transform: scale(1); }
/* ----- Fields: Something else and Decline's reason ----- */
.ui-dcd__reason { display: block; }
.ui-dcd__input { display: block; width: 100%; min-width: 0; height: var(--tc-control-h-md); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); caret-color: var(--tc-accent); outline: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dcd__textarea { height: auto; min-height: calc(var(--tc-control-h-md) * 1.6); padding-top: var(--tc-space-2); padding-bottom: var(--tc-space-2); resize: vertical; line-height: var(--tc-line-height-snug); }
.ui-dcd__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-dcd__input:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-dcd__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-dcd__input::placeholder { color: var(--tc-text-placeholder); }
.ui-dcd__error { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-danger-fg); }
/* ----- The tray below the card (Standard) / the card's last row (Clean) ----- */
.ui-dcd__foot { display: flex; justify-content: flex-end; }
:where([data-look="standard"], [data-look="standard"] *).ui-dcd__foot { padding: var(--tc-space-1-5) var(--tc-space-1) var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *) .ui-dcd__foot { padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-dcd__buttons { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-1); }
.ui-dcd__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-2); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-dcd__btn:active { transform: scale(0.98); }
.ui-dcd__btn--ghost { color: var(--tc-action-ghost-fg); }
.ui-dcd__btn--ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-dcd__btn--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-dcd__btn--secondary:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-dcd__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-dcd__btn--primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-dcd__btn--danger { background: var(--tc-action-danger-bg); color: var(--tc-action-danger-fg); }
.ui-dcd__btn--danger:hover { background: var(--tc-action-danger-bg-hover); }
.ui-dcd__btn--primary, .ui-dcd__btn--danger { padding-right: var(--tc-space-1-5); }
.ui-dcd__kbd { display: grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-on-inverse-bg); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); color: inherit; }
/* ----- The receipt: one quiet line ----- */
.ui-dcd__receipt { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-md); padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) var(--tc-space-3); border-radius: var(--tc-card-radius); outline: none; animation: ui-dcd-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *) .ui-dcd__receipt { background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *) .ui-dcd__receipt { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-dcd__receipt:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-dcd__tick { display: grid; flex: none; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-dcd__tick .ui-dcd__glyph { width: 12px; height: 12px; stroke-width: 2.4; }
.ui-dcd__receipt-text { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-dcd__receipt-agent { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-dcd__undo { flex: none; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); }
@keyframes ui-dcd-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
/* Narrow: the buttons share the row; the agent's name leaves the receipt */
@container (max-width: 380px) {
  .ui-dcd__body { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-dcd__buttons { flex: 1 1 100%; }
  .ui-dcd__btn--primary, .ui-dcd__btn--danger { flex: 1; }
  .ui-dcd__receipt-agent { display: none; }
}
@media (hover: none) {
  .ui-dcd__kbd { display: none; }
}
@media (pointer: coarse) {
  .ui-dcd__choice { min-height: 44px; }
  .ui-dcd__btn, .ui-dcd__input:not(.ui-dcd__textarea) { height: 40px; }
}
@media (forced-colors: active) {
  .ui-dcd__choice[aria-checked="true"] { outline: 2px solid Highlight; }
  .ui-dcd__radio::after { background: Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="dcd"] *, [data-ui="dcd"] *::before, [data-ui="dcd"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-decision-card")) customElements.define("tc-decision-card", TcDecisionCard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-decision-card": TcDecisionCard;
  }
}

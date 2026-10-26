import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import { isMac, tokenMs } from "./internal/util";

/*
 * <tc-handoff> – the agent hands the task to a person mid-run, with the context it has, and takes it back when
 * they're done. Built on approval-card and permission-request: the same tray, card, pills, buttons and fold.
 *   · waiting: "Coder needs you to sign in to Stripe" – why it stopped (a pill and its own words), what it did so
 *     far and what it needs from you; "Take over" (⌘↵)
 *   · active: you have control – the needs become a checklist, a note for the agent, "Hand back" (⌘↵) with how many
 *     are still open
 *   · returned: the card folds into one line – "Back with Coder · 3 of 3 done" – with "Take over again"
 * Standard: a white card on a gray tray, the buttons on the tray. Clean: one quiet white card, the buttons in its last
 * row under a hairline.
 *
 *   <tc-handoff .agent=${{ name: "Coder" }} ask="sign in to Stripe" blocker="Sign-in required"
 *     reason="The dashboard asks for a one-time code sent to your phone." .needs=${[…]}></tc-handoff>
 *
 * The host is a group named by its heading (by the folded line once returned).
 */

export type HandoffStatus = "waiting" | "active" | "returned";

export type HandoffItem = {
  id: string;
  label: string;
  /** Right-aligned and quiet, e.g. "3 results" or "0:42" */
  meta?: string;
};

/** Who hands over */
export type HandoffAgent = { name: string; model?: string; /** An avatar or logo (cloned); unset shows initials */ avatar?: Element };

/** Details of the events */
export type HandoffStatusChange = { status: HandoffStatus; previous: HandoffStatus };
export type HandoffCheckedChange = { checked: string[] };
export type HandoffNoteChange = { note: string };
export type HandoffReturn = { checked: string[]; open: string[]; note: string };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
const clone = (node: Element | undefined) => node?.cloneNode(true);
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
let uidCount = 0;

/* Hand, check, circle-check, undo and dot – hand, check, circle-check, undo-2: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const handIcon = () =>
  lucide(
    12,
    svg`<path d="M18 11V6a2 2 0 0 0-4 0v5"></path><path d="M14 10V4a2 2 0 0 0-4 0v2"></path><path d="M10 10.5V6a2 2 0 0 0-4 0v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>`,
  );
const doneIcon = () => lucide(16, svg`<path d="M20 6 9 17l-5-5"></path>`);
const returnedIcon = () => lucide(16, svg`<circle cx="12" cy="12" r="10"></circle><path d="m16 9-5.5 5.5L8 12"></path>`);
const tickIcon = () => html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4 8.3 6.8 11 12 5.2"></path>`}</svg>`;

/**
 * The agent hands control to a person mid-task with what it did, why it stopped and what it needs – and takes it back.
 * @tag tc-handoff
 * @fires tc-status-change - Take over, Hand back or Take over again ({ status, previous }: HandoffStatusChange); cancelable
 * @fires tc-checked-change - A need was ticked or unticked ({ checked }: HandoffCheckedChange); cancelable
 * @fires tc-note-change - The note for the agent changed ({ note }: HandoffNoteChange); cancelable
 * @fires tc-return - Handed back, with what was done and the note ({ checked, open, note }: HandoffReturn)
 */
export class TcHandoff extends TcElement {
  static override ui = "hand";

  /** Who hands over */
  @property({ attribute: false }) accessor agent: HandoffAgent = { name: "" };
  /** What it needs you to do, lower case after "needs you to", e.g. "sign in to Stripe" */
  @property() accessor ask = "";
  /** The run it belongs to, e.g. "Book flights to Lisbon" – shown under the heading */
  @property() accessor task: string | undefined = undefined;
  /** Where in the run, e.g. "Step 4 of 7" */
  @property() accessor step: string | undefined = undefined;
  /** Why it stopped, in a pill: "Sign-in required", "Needs a decision" */
  @property() accessor blocker: string | undefined = undefined;
  /** The agent's own words on why it stopped */
  @property() accessor reason: string | undefined = undefined;
  /** What it did so far */
  @property({ attribute: false }) accessor done: HandoffItem[] = [];
  /** What it needs from you – a checklist once you have control */
  @property({ attribute: false }) accessor needs: HandoffItem[] = [];
  /** Who has control */
  @property({ reflect: true }) accessor status: HandoffStatus = "waiting";
  /** Ids of the needs ticked off */
  @property({ attribute: false }) accessor checked: string[] = [];
  /** Your note for the agent, passed on when you hand back */
  @property() accessor note = "";
  /** Done steps shown before "N more" */
  @property({ type: Number, attribute: "done-limit" }) accessor doneLimit = 3;
  /** Heading of the list of what the agent did */
  @property({ attribute: "done-title" }) accessor doneTitle = "What I did";
  /** Heading of the list of what the agent needs – the checklist once you have control */
  @property({ attribute: "needs-title" }) accessor needsTitle = "What I need from you";
  /** Label of the note field shown while you have control */
  @property({ attribute: "note-label" }) accessor noteLabel = "Note for the agent";
  /** Placeholder of the note field */
  @property({ attribute: "note-placeholder" }) accessor notePlaceholder = "Anything it should know before it carries on";
  /** Show ⌘↵ hints on the main button (the shortcut works either way). Default true */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor shortcuts = true;

  @state() private accessor open = false;
  @state() private accessor announce = "";
  @state() private accessor mod = "⌘";

  private uid = `tc-hand-${++uidCount}`;
  private lastShape = "";
  private foldHeight = 0;
  private ro?: ResizeObserver;

  constructor() {
    super();
    // Focus never drops to <body> when the card changes shape under it
    new FocusRescueController(this, () => this.mainButton);
  }

  private get card() {
    return this.querySelector<HTMLElement>(".ui-hand__card");
  }
  private get mainButton() {
    return this.querySelector<HTMLElement>('[data-focus-key="main"]');
  }
  private get ticked() {
    const ids = new Set(this.needs.map((n) => n.id));
    return this.checked.filter((id) => ids.has(id));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    if (!isMac()) this.mod = "Ctrl";
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
  }

  /* ---------- Changes ---------- */

  private setStatus(next: HandoffStatus) {
    const previous = this.status;
    if (next === previous) return;
    // Focus waits on the card while it changes shape, then moves on to the new shape's first control
    const card = this.card;
    rescueFocus(card, [card]);
    if (!this.emit<HandoffStatusChange>("tc-status-change", { status: next, previous }, { cancelable: true })) {
      requestAnimationFrame(() => this.settleFocus());
      return;
    }
    this.status = next;
  }

  private takeOver = () => this.setStatus("active");

  private handBack = () => {
    const checked = this.ticked;
    const open = this.needs.map((n) => n.id).filter((id) => !checked.includes(id));
    this.emit<HandoffReturn>("tc-return", { checked, open, note: this.note });
    this.setStatus("returned");
  };

  private toggle(id: string, on: boolean) {
    const next = on ? [...this.ticked.filter((x) => x !== id), id] : this.ticked.filter((x) => x !== id);
    // Keep the needs' order
    const order = this.needs.map((n) => n.id);
    next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    if (this.emit<HandoffCheckedChange>("tc-checked-change", { checked: next }, { cancelable: true })) this.checked = next;
    // A page that keeps the old list gets its checkboxes put back
    else this.requestUpdate();
  }

  private onNote = (e: Event) => {
    const next = (e.target as HTMLTextAreaElement).value;
    if (this.emit<HandoffNoteChange>("tc-note-change", { note: next }, { cancelable: true })) this.note = next;
    else this.requestUpdate();
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.isComposing) return;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      if (this.status === "waiting") {
        e.preventDefault();
        this.takeOver();
      } else if (this.status === "active") {
        e.preventDefault();
        this.handBack();
      }
    }
  };

  // Once the new shape is there, focus held on the card moves on: the first open need when you take over, the main
  // button otherwise
  private settleFocus() {
    const card = this.card;
    if (!card || document.activeElement !== card) return;
    const first = this.status === "active" ? this.querySelector<HTMLElement>(".ui-hand__check input:not(:checked)") : null;
    (first ?? this.mainButton)?.focus({ preventScroll: true });
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.dataset.status = this.status;
    this.setAttribute("aria-labelledby", `${this.uid}-${this.status === "returned" ? "line" : "title"}`);
    if (this.status !== "returned" && this.reason) this.setAttribute("aria-describedby", `${this.uid}-why`);
    else this.removeAttribute("aria-describedby");
    if (changed.has("status") && changed.get("status") !== undefined) {
      const name = this.agent.name;
      this.announce =
        this.status === "active" ? `You have control. ${name} is paused.` : this.status === "returned" ? `Handed back to ${name}.` : `${name} needs you to ${this.ask}.`;
    }
  }

  protected override firstUpdated() {
    // The card's height, kept fresh while it resizes without a change of shape
    const card = this.card;
    if (card && typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(() => {
        const c = this.card;
        if (c && !c.getAnimations?.().length) this.foldHeight = c.offsetHeight;
      });
      this.ro.observe(card);
    }
  }

  protected override updated() {
    // The card folds to one line and back: its height animates when its shape changes
    const card = this.card;
    const shape = this.status;
    if (card) {
      const from = this.foldHeight;
      const to = card.offsetHeight;
      this.foldHeight = to;
      if (this.lastShape && this.lastShape !== shape && !reducedMotion() && from && Math.abs(to - from) > 1 && typeof card.animate === "function") {
        const easing = getComputedStyle(this).getPropertyValue("--tc-ease-move").trim() || "ease-out";
        card.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: tokenMs(this, "--tc-duration-slower", 420), easing });
      }
    }
    if (this.lastShape !== shape) {
      this.lastShape = shape;
      this.settleFocus();
    }
  }

  /* ---------- Rendering ---------- */

  private renderList(items: HandoffItem[], kind: "done" | "needs") {
    const active = this.status === "active";
    const checked = new Set(this.ticked);
    const shown = kind === "done" && !this.open ? items.slice(0, this.doneLimit) : items;
    const hidden = items.length - shown.length;
    const id = `${this.uid}-${kind}`;
    const title = kind === "done" ? this.doneTitle : this.needsTitle;
    return html`<section class="ui-hand__section" data-kind=${kind} aria-labelledby=${id}>
      <h4 class="ui-hand__label" id=${id}>${title}${kind === "done" || !active
        ? html`<span class="ui-hand__count">${items.length}</span>`
        : html`<span class="ui-hand__count" data-progress="">${checked.size}/${items.length}</span>`}</h4>
      <ul class="ui-hand__list">
        ${repeat(
          shown,
          (p) => p.id,
          (p, i) =>
            kind === "needs" && active
              ? html`<li class="ui-hand__item" ?data-checked=${checked.has(p.id)}>
                  <label class="ui-hand__check">
                    <span class="ui-hand__box">
                      <input type="checkbox" .checked=${live(checked.has(p.id))} @change=${(e: Event) => this.toggle(p.id, (e.target as HTMLInputElement).checked)} />
                      ${tickIcon()}
                    </span>
                    <span class="ui-hand__item-label">${p.label}</span>
                  </label>
                  ${p.meta ? html`<span class="ui-hand__item-meta">${p.meta}</span>` : nothing}
                </li>`
              : html`<li class="ui-hand__item">
                  <span class="ui-hand__item-icon" data-kind=${kind}>${kind === "done" ? doneIcon() : html`<span class="ui-hand__num">${i + 1}</span>`}</span>
                  <span class="ui-hand__item-label">${p.label}</span>
                  ${p.meta ? html`<span class="ui-hand__item-meta">${p.meta}</span>` : nothing}
                </li>`,
        )}
      </ul>
      ${kind === "done" && items.length > this.doneLimit
        ? html`<button type="button" class="ui-hand__more" aria-expanded=${this.open ? "true" : "false"} @click=${() => (this.open = !this.open)}>${this.open ? "Show less" : `${hidden} more`}</button>`
        : nothing}
    </section>`;
  }

  private renderMain() {
    const { agent, uid } = this;
    const active = this.status === "active";
    const sub = [this.step, this.task].filter(Boolean).join(" · ");
    const left = this.needs.length - this.ticked.length;
    const kbd = this.shortcuts ? html`<kbd class="ui-hand__kbd" aria-hidden="true">${this.mod === "⌘" ? "⌘↵" : "Ctrl ↵"}</kbd>` : nothing;
    return html`<div class="ui-hand__main">
      <div class="ui-hand__body">
        <header class="ui-hand__head">
          <span class="ui-hand__avatar" ?data-logo=${!!agent.avatar}>${agent.avatar ? clone(agent.avatar) : initials(agent.name)}</span>
          <span class="ui-hand__heading">
            <span class="ui-hand__title" id=${`${uid}-title`}>${active
              ? html`<b>You have control</b><span class="ui-hand__title-ask"> · ${this.ask}</span>`
              : html`<b>${agent.name}</b> needs you to <b>${this.ask}</b>`}</span>
            ${active
              ? html`<span class="ui-hand__sub">${agent.name} is paused${this.step ? ` at ${this.step.toLowerCase()}` : ""}</span>`
              : sub || agent.model
                ? html`<span class="ui-hand__sub">${sub || agent.model}</span>`
                : nothing}
          </span>
          ${active
            ? html`<span class="ui-hand__pill" data-tone="info"><span class="ui-hand__dot" aria-hidden="true"></span>Yours</span>`
            : this.blocker
              ? html`<span class="ui-hand__pill" data-tone="warning">${handIcon()}${this.blocker}</span>`
              : nothing}
        </header>
        ${this.reason ? html`<p class="ui-hand__why" id=${`${uid}-why`}>${this.reason}</p>` : nothing}
        ${this.done.length || this.needs.length
          ? html`<div class="ui-hand__context">
              ${this.done.length ? this.renderList(this.done, "done") : nothing}
              ${this.needs.length ? this.renderList(this.needs, "needs") : nothing}
            </div>`
          : nothing}
        ${active
          ? html`<div class="ui-hand__note">
              <label class="ui-hand__note-label" for=${`${uid}-note`}>${this.noteLabel}</label>
              <textarea class="ui-hand__field" id=${`${uid}-note`} rows="2" placeholder=${this.notePlaceholder} .value=${live(this.note)} @input=${this.onNote}></textarea>
            </div>`
          : nothing}
      </div>
      <div class="ui-hand__answer">
        ${active && this.needs.length
          ? html`<span class="ui-hand__hint" id=${`${uid}-left`}>${left === 0 ? "All done" : `${left} still open – ${agent.name} will see which`}</span>`
          : nothing}
        ${active
          ? html`<button type="button" class="ui-hand__btn ui-hand__btn--primary" data-focus-key="main" aria-keyshortcuts="Meta+Enter Control+Enter" aria-describedby=${ifDefined(this.needs.length ? `${uid}-left` : undefined)} @click=${this.handBack}>
              <span class="ui-hand__btn-label">Hand back to ${agent.name}</span>${kbd}
            </button>`
          : html`<button type="button" class="ui-hand__btn ui-hand__btn--primary" data-focus-key="main" aria-keyshortcuts="Meta+Enter Control+Enter" @click=${this.takeOver}>
              <span class="ui-hand__btn-label">Take over</span>${kbd}
            </button>`}
      </div>
    </div>`;
  }

  private renderReturned() {
    const name = this.agent.name;
    const done = this.ticked.length;
    const total = this.needs.length;
    const note = [total ? `${done} of ${total} done` : "", this.note.trim() ? "your note was passed on" : ""].filter(Boolean).join(" · ") || `${name} carries on`;
    return html`<div class="ui-hand__result">
      <span class="ui-hand__result-icon">${returnedIcon()}</span>
      <span class="ui-hand__result-text">
        <span class="ui-hand__result-head" id=${`${this.uid}-line`}>Back with ${name}<span class="ui-hand__result-ask"> · ${this.ask}</span></span>
        <span class="ui-hand__result-note">${note}</span>
      </span>
      <button type="button" class="ui-hand__ghost" data-focus-key="main" @click=${this.takeOver}>Take over<span class="ui-hand__again"> again</span></button>
    </div>`;
  }

  protected override render() {
    const returned = this.status === "returned";
    return html`
      <span class="ui-hand__sr" role="status">${this.announce}</span>
      <div class="ui-hand__card" tabindex="-1" @keydown=${this.onKey}>
        ${returned ? this.renderReturned() : this.renderMain()}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; the main button sits on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="hand"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 440px;
  padding: var(--tc-tray-inset);
  overflow: hidden;
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="hand"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 420px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="hand"] *, [data-ui="hand"] *::before, [data-ui="hand"] *::after { box-sizing: border-box; }
:where([data-ui="hand"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="hand"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="hand"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="hand"] h4, [data-ui="hand"] p, [data-ui="hand"] section { margin: 0; }
[data-ui="hand"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="hand"] svg[stroke-width] { stroke-width: 1.3; }
.ui-hand__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.ui-hand__card:focus { outline: none; }
.ui-hand__main { animation: ui-hand-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__card { overflow: hidden; border-radius: var(--tc-card-radius); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__body { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__body { padding-bottom: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__body { padding-bottom: var(--tc-space-3-5); }
/* ----- Who needs what ----- */
.ui-hand__head { display: flex; align-items: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__head { gap: var(--tc-space-3); padding: var(--tc-space-4) var(--tc-space-4) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__head { gap: var(--tc-space-2-5); padding: var(--tc-space-3-5) var(--tc-space-3-5) 0 var(--tc-space-4); }
.ui-hand__avatar { display: grid; flex: none; place-items: center; background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-weight: var(--tc-avatar-font-weight); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__avatar { width: 32px; height: 32px; border-radius: var(--tc-radius-lg); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__avatar[data-logo] > svg { width: 18px; height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__avatar { width: 28px; height: 28px; border-radius: var(--tc-avatar-radius-agent); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__avatar[data-logo] > svg { width: 16px; height: 16px; }
.ui-hand__heading { display: grid; flex: 1; min-width: 0; }
.ui-hand__title b { font-weight: var(--tc-font-weight-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__title { color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__title b { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__title { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__title b { color: var(--tc-text-strong); }
.ui-hand__title-ask { color: var(--tc-text-muted); }
.ui-hand__sub { min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__sub { line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__sub { line-height: var(--tc-line-height-tight); }
/* Why it stopped – or that it's yours now: a header pill on a status tone */
.ui-hand__pill { display: inline-flex; flex: none; align-self: start; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-hand__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-hand__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); animation: ui-hand-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-hand__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
/* The agent's reason: a quiet line with a rule on the left */
.ui-hand__why { padding-left: var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__why { margin: var(--tc-space-3) var(--tc-space-4) 0 var(--tc-space-14) !important; border-left: 2px solid var(--tc-border-default); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__why { margin: var(--tc-space-3) var(--tc-space-4) 0 var(--tc-space-12) !important; border-left: 2px solid var(--tc-fill-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
/* ----- What it did, what it needs ----- */
.ui-hand__context { display: flex; flex-direction: column; margin-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__context { gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-2) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__context { gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-2-5) 0; }
.ui-hand__label { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__label { margin: 0 var(--tc-space-2) var(--tc-space-1) !important; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__label { margin: 0 var(--tc-space-1-5) var(--tc-space-1) !important; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-tight); }
/* The count: a badge */
.ui-hand__count { display: grid; place-items: center; border-radius: var(--tc-radius-badge); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__count { min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__count { min-width: 16px; height: 16px; padding: 0 var(--tc-space-1); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-hand__section { min-width: 0; }
.ui-hand__list { display: grid; grid-template-columns: minmax(0, 1fr); }
.ui-hand__item { display: flex; align-items: center; gap: var(--tc-space-2-5); animation: ui-hand-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__item { min-height: 32px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__item { min-height: 30px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); }
.ui-hand__item-icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; color: var(--tc-icon-muted); }
.ui-hand__item-icon[data-kind="done"] { color: var(--tc-status-success-fg); }
.ui-hand__item-icon > svg { width: 14px; height: 14px; }
/* The needs, numbered while they wait */
.ui-hand__num { display: grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 1px var(--tc-border-strong); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-hand__item-label { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__item-label { font-size: var(--tc-font-size-md); }
.ui-hand__section[data-kind="done"] .ui-hand__item-label { color: var(--tc-text-secondary); }
.ui-hand__item-meta { flex: none; color: var(--tc-text-muted); white-space: nowrap; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-hand__more { padding: var(--tc-space-0-5) 0; color: var(--tc-text-muted); transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__more { margin: 0 0 var(--tc-space-1) var(--tc-space-8) !important; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__more { margin: 0 0 var(--tc-space-1) var(--tc-space-8) !important; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-hand__more:hover { color: var(--tc-text-primary); }
/* The checklist once it's yours: the whole row is the label */
.ui-hand__check { display: flex; flex: 1; align-items: center; gap: var(--tc-space-2-5); min-width: 0; min-height: inherit; cursor: pointer; user-select: none; }
.ui-hand__item[data-checked] .ui-hand__item-label { color: var(--tc-text-muted); text-decoration: line-through; text-decoration-color: var(--tc-border-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__item:has(.ui-hand__check):hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__item:has(.ui-hand__check):hover { background: var(--tc-fill-subtle); }
.ui-hand__box { position: relative; display: grid; flex: none; width: 16px; height: 16px; }
/* The checkbox's edge is its only cue: --tc-border-control (≥ 3:1) */
.ui-hand__box input { appearance: none; -webkit-appearance: none; width: 16px; height: 16px; margin: 0; border-radius: var(--tc-radius-xs); background: var(--tc-surface-control); box-shadow: inset 0 0 0 1px var(--tc-border-control); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-hand__box input:hover { box-shadow: inset 0 0 0 1px var(--tc-border-control-hover); }
.ui-hand__box input:checked { background: var(--tc-status-success-fg); box-shadow: inset 0 0 0 1px var(--tc-status-success-fg); }
.ui-hand__box input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-hand__box svg { position: absolute; inset: 0; width: 16px; height: 16px; fill: none; stroke: var(--tc-text-on-inverse); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; opacity: 0; transform: scale(0.6); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move); pointer-events: none; }
.ui-hand__box input:checked + svg { opacity: 1; transform: none; }
/* The note for the agent: the field pattern */
.ui-hand__note { display: grid; gap: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__note { margin: var(--tc-space-3) var(--tc-space-4) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__note { margin: var(--tc-space-3) var(--tc-space-4) 0; }
.ui-hand__note-label { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__note-label { font-weight: var(--tc-font-weight-medium); }
.ui-hand__field { display: block; width: 100%; min-height: 56px; margin: 0; padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); resize: vertical; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-hand__field::placeholder { color: var(--tc-text-placeholder); }
.ui-hand__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-hand__field:focus { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-hand__field:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* ----- The main button ----- */
.ui-hand__answer { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2) var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__answer { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__answer { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-hand__hint { flex: 1; min-width: 0; color: var(--tc-text-muted); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__hint { padding-left: var(--tc-space-2); font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__hint { font-size: var(--tc-font-size-sm); }
/* Take over / Hand back: Button's primary recipe (Standard large, Clean medium) */
.ui-hand__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-2); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__btn { height: var(--tc-control-h-lg); padding: 0 var(--tc-space-2-5) 0 var(--tc-control-px-lg); border-radius: var(--tc-control-radius-lg); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="hand"]:not([data-status="active"]) .ui-hand__btn { flex: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__btn { height: var(--tc-control-h-md); padding: 0 var(--tc-space-2) 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); }
.ui-hand__btn:active { transform: scale(0.98); }
.ui-hand__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-hand__btn--primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-hand__btn--primary:active { background: var(--tc-action-primary-bg-active); }
.ui-hand__btn-label { animation: ui-hand-swap var(--tc-duration-base) var(--tc-ease-move) both; }
/* Key hints: the kbd chip, on the ink */
.ui-hand__kbd { display: grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-on-inverse-bg); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); color: inherit; }
/* ----- The folded line: back with the agent ----- */
.ui-hand__result { position: relative; display: flex; align-items: center; padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__result { gap: var(--tc-space-3); min-height: 60px; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); animation: ui-hand-in var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__result { gap: var(--tc-space-2-5); min-height: 56px; animation: ui-hand-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-hand__result-icon { display: grid; flex: none; place-items: center; color: var(--tc-status-success-fg); animation: ui-hand-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__result-icon > svg { width: 18px; height: 18px; }
.ui-hand__result-text { display: grid; flex: 1; min-width: 0; }
.ui-hand__result-head { overflow: hidden; font-weight: var(--tc-font-weight-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__result-head { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__result-head { color: var(--tc-text-strong); }
.ui-hand__result-ask { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-hand__result-note { overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__result-note { line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__result-note { line-height: var(--tc-line-height-tight); }
/* Take over again: Standard's secondary button, Clean's ghost button */
.ui-hand__ghost { flex: none; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__ghost { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-hand__ghost:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__ghost { color: var(--tc-action-ghost-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-hand__ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
@keyframes ui-hand-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-hand-swap { from { opacity: 0; transform: translateY(2px); } }
@keyframes ui-hand-pop { 0% { opacity: 0; transform: scale(0.5); } 60% { opacity: 1; transform: scale(1.12); } }
/* Narrow containers: the reason loses its indent, the main button takes the width, no keyboard hints */
@container (max-width: 380px) {
  [data-ui="hand"] .ui-hand__why { margin-left: var(--tc-space-4) !important; }
  /* The pill moves under the heading, so the heading keeps its width */
  .ui-hand__head { flex-wrap: wrap; row-gap: var(--tc-space-2); }
  .ui-hand__heading { flex-basis: 70%; }
  .ui-hand__pill { order: 3; }
  :where([data-look="standard"], [data-look="standard"] *).ui-hand__pill { margin-left: calc(var(--tc-space-10) + var(--tc-space-1)); }
  :where([data-look="clean"], [data-look="clean"] *).ui-hand__pill { margin-left: calc(var(--tc-space-8) + var(--tc-space-1-5)); }
  .ui-hand__again { display: none; }
  [data-ui="hand"] .ui-hand__btn { flex: 1; }
  [data-ui="hand"] .ui-hand__hint { flex-basis: 100%; }
  .ui-hand__kbd { display: none; }
  .ui-hand__title-ask, .ui-hand__result-ask { display: none; }
}
@media (hover: none) {
  .ui-hand__kbd { display: none; }
}
@media (pointer: coarse) {
  :where([data-look="standard"], [data-look="standard"] *).ui-hand__btn { height: 46px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-hand__btn { height: 40px; }
  .ui-hand__ghost { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="hand"] *, [data-ui="hand"] *::before, [data-ui="hand"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-handoff")) customElements.define("tc-handoff", TcHandoff);

declare global {
  interface HTMLElementTagNameMap {
    "tc-handoff": TcHandoff;
  }
}

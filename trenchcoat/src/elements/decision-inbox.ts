import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-decision-inbox> – the Lit port of src/components/decision-inbox.tsx: open decisions with two quick actions
 * each. Answering a decision confirms it briefly, then folds it away and the count goes down. Standard sits in a gray
 * tray with a white card; Clean is one white card with a heading row and solid glyphs.
 *
 *   <tc-decision-inbox .decisions=${[{ id: "d1", title: "Merge it?", primary: "Merge", secondary: "Hold" }]}>
 *   </tc-decision-inbox>
 *
 * Every answer fires a cancelable `tc-answers-change` ({ answers }): call preventDefault() to keep control of
 * `answers` yourself. `decide` may return a promise to hold the row until it settles: it answers on success, and on a
 * rejection says so and offers both buttons again. Focus never drops to <body> when a row changes (WCAG 2.4.3).
 */

export type InboxDecision = {
  id: string;
  title: string;
  /** Short context under the title */
  detail?: string;
  /** Main answer, shown as the dark button */
  primary: string;
  /** Other answer, shown as the light button */
  secondary: string;
  /** Starts folded to one muted line – click to open */
  collapsed?: boolean;
};

export type DecisionAnswer = "primary" | "secondary";
export type DecisionAnswersChange = { answers: Record<string, DecisionAnswer> };
export type DecisionAnswersChangeEvent = CustomEvent<DecisionAnswersChange>;

/** How long the confirmation shows before the row folds away */
const CONFIRM_MS = 1100;

// Solid glyphs – the cut-out mark takes the surface colour (CSS), so it works in dark mode too
const alertIcon = (clean: boolean) =>
  clean
    ? html`<svg class="ui-di__glyph" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${svg`<path d="M6.7 2.3a1.5 1.5 0 0 1 2.6 0l5.4 9.4A1.5 1.5 0 0 1 13.4 14H2.6a1.5 1.5 0 0 1-1.3-2.3Z" fill="currentColor"></path><path class="ui-di__cut" d="M8 5.8v3.2" stroke-width="1.4" stroke-linecap="round" fill="none"></path><circle class="ui-di__cut-dot" cx="8" cy="11.3" r="0.8"></circle>`}</svg>`
    : html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${svg`<path d="M6.7 2.3a1.5 1.5 0 0 1 2.6 0l5.4 9.4A1.5 1.5 0 0 1 13.4 14H2.6a1.5 1.5 0 0 1-1.3-2.3Z" fill="currentColor"></path><path class="ui-di__cut" d="M8 5.6v3.6" stroke-width="1.5" stroke-linecap="round" fill="none"></path><circle class="ui-di__cut-dot" cx="8" cy="11.4" r="0.85"></circle>`}</svg>`;
const doneIcon = (clean: boolean) =>
  clean
    ? html`<svg class="ui-di__glyph" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="6.5" fill="currentColor"></circle><path class="ui-di__cut" d="m5.3 8.2 1.8 1.8 3.6-3.8" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`
    : html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="7" fill="currentColor"></circle><path class="ui-di__cut" d="m5 8.2 2 2 4-4.2" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;

let instances = 0;

/**
 * Open decisions with two quick answers each; answered ones confirm, then fold away.
 * @tag tc-decision-inbox
 * @fires tc-answers-change - An answer was given ({ answers }: DecisionAnswersChange, every answer by decision id); cancelable
 * @fires tc-decide - A decision was answered ({ decision, answer }), after `decide` settled
 */
export class TcDecisionInbox extends TcElement {
  static override ui = "di";

  /** The decisions to show – new ones join as they're passed, answered ones fold away */
  @property({ attribute: false }) accessor decisions: InboxDecision[] = [];
  /** The answers given so far, by decision id. Answers present on first render start folded away. Changed by the
   *  user unless a tc-answers-change listener calls preventDefault() */
  @property({ attribute: false }) accessor answers: Record<string, DecisionAnswer> = {};
  /** Called with the decision and the chosen answer. Return a promise to hold the row until it settles */
  @property({ attribute: false }) accessor decide: ((decision: InboxDecision, answer: DecisionAnswer) => void | Promise<unknown>) | undefined = undefined;

  /** Opened or folded by hand, by id – a decision that hasn't been touched starts as its `collapsed` says */
  @state() private accessor opened: Record<string, boolean> = {};
  /** Rows folded away after their confirmation */
  @state() private accessor gone: Record<string, true> = {};
  /** Answers waiting on a `decide` promise, and the rows whose promise rejected */
  @state() private accessor pending: Record<string, DecisionAnswer> = {};
  @state() private accessor failed: Record<string, true> = {};

  private readonly uid = `tc-di${++instances}`;
  private readonly timers = new Map<string, number>();
  private started = false;

  constructor() {
    super();
    // Focus goes to the answer, then the next open decision, and a just-opened decision's first button
    new FocusRescueController(this, (key) => {
      if (!key) return null;
      const id = key.slice(0, key.lastIndexOf("::"));
      const rows = [...this.querySelectorAll<HTMLElement>(".ui-di__row")];
      const at = rows.findIndex((r) => r.dataset.id === id);
      const firstIn = (r: HTMLElement | undefined) =>
        r && !r.hasAttribute("inert") ? r.querySelector<HTMLElement>(".ui-di__done, .ui-di__body:not([inert]) button, button.ui-di__title--folded") : null;
      return firstIn(rows[at]) ?? rows.slice(at + 1).map(firstIn).find(Boolean) ?? rows.slice(0, Math.max(at, 0)).reverse().map(firstIn).find(Boolean);
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    // Timers cleared on disconnect start again
    if (this.started) this.schedule();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!this.started) {
      // Answers that are there on first render start folded away
      this.started = true;
      this.gone = Object.fromEntries(Object.keys(this.answers).map((id) => [id, true as const]));
    }
  }

  protected override updated() {
    this.toggleAttribute("data-clear", this.openCount === 0);
    this.schedule();
  }

  private get openCount() {
    return this.decisions.filter((d) => !this.answers[d.id]).length;
  }

  private isOpen(d: InboxDecision) {
    return this.opened[d.id] ?? !d.collapsed;
  }

  /** An answer – given here or passed in – shows its confirmation for a moment, then the row folds away and the
   *  next folded one opens */
  private schedule() {
    if (!this.isConnected) return;
    for (const id of Object.keys(this.answers)) {
      if (this.gone[id] || this.timers.has(id)) continue;
      this.timers.set(
        id,
        window.setTimeout(() => {
          this.timers.delete(id);
          this.gone = { ...this.gone, [id]: true };
          const folded = this.decisions.find((x) => x.id !== id && !this.isOpen(x) && !this.answers[x.id]);
          if (folded) this.opened = { ...this.opened, [folded.id]: true };
        }, CONFIRM_MS),
      );
    }
  }

  private async answer(d: InboxDecision, answer: DecisionAnswer) {
    if (this.answers[d.id] || this.pending[d.id]) return;
    const { [d.id]: _was, ...others } = this.failed;
    this.failed = others;
    let result: void | Promise<unknown>;
    try {
      result = this.decide?.(d, answer);
    } catch {
      this.failed = { ...this.failed, [d.id]: true };
      return;
    }
    if (result && typeof (result as Promise<unknown>).then === "function") {
      this.pending = { ...this.pending, [d.id]: answer };
      let ok = true;
      try {
        await result;
      } catch {
        ok = false;
      }
      if (!this.isConnected) return;
      const { [d.id]: _done, ...rest } = this.pending;
      this.pending = rest;
      if (!ok) {
        this.failed = { ...this.failed, [d.id]: true };
        return;
      }
    }
    const next = { ...this.answers, [d.id]: answer };
    if (this.emit<DecisionAnswersChange>("tc-answers-change", { answers: next }, { cancelable: true })) this.answers = next;
    this.emit("tc-decide", { decision: d, answer });
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const open = this.openCount;
    return html`
      <header class="ui-di__head" aria-live="polite">
        ${open > 0
          ? html`${alertIcon(clean)}<span>${open} ${open === 1 ? "needs" : "need"} your input</span>`
          : html`${doneIcon(clean)}<span>All caught up</span>`}
      </header>
      <div class="ui-di__card">
        ${repeat(
          this.decisions,
          (d) => d.id,
          (d) => {
            const given = this.answers[d.id];
            const answered = given ? (given === "primary" ? d.primary : d.secondary) : undefined;
            const rowOpen = this.isOpen(d);
            const waiting = this.pending[d.id];
            const bodyId = `${this.uid}-${d.id}`;
            const key = (part: string) => `${d.id}::${part}`;
            const folded = Boolean(this.gone[d.id] && answered);
            return html`<div class="ui-di__row" data-id=${d.id} ?data-gone=${folded} .inert=${folded}>
              <div class="ui-di__row-inner">
                <div class="ui-di__item" ?data-open=${rowOpen} ?data-answered=${!!answered} aria-busy=${ifDefined(waiting ? "true" : undefined)}>
                  ${rowOpen
                    ? html`<p class="ui-di__title">${d.title}</p>`
                    : html`<button
                        type="button"
                        class="ui-di__title ui-di__title--folded"
                        aria-expanded="false"
                        aria-controls=${bodyId}
                        data-focus-key=${key("title")}
                        @click=${() => (this.opened = { ...this.opened, [d.id]: true })}
                      >${d.title}</button>`}
                  <div class="ui-di__body" id=${bodyId} ?data-open=${rowOpen} .inert=${!rowOpen}>
                    <div class="ui-di__body-inner">
                      ${d.detail ? html`<p class="ui-di__detail">${d.detail}</p>` : nothing}
                      <div class="ui-di__actions">
                        ${answered
                          ? html`<span class="ui-di__done" tabindex="-1" data-focus-key=${key("done")}>${doneIcon(clean)}${answered}</span>`
                          : html`<button
                                type="button"
                                class="ui-di__btn ui-di__btn--primary"
                                aria-disabled=${ifDefined(waiting ? "true" : undefined)}
                                ?data-pending=${waiting === "primary"}
                                data-focus-key=${key("primary")}
                                @click=${() => void this.answer(d, "primary")}
                              >${d.primary}</button><button
                                type="button"
                                class="ui-di__btn"
                                aria-disabled=${ifDefined(waiting ? "true" : undefined)}
                                ?data-pending=${waiting === "secondary"}
                                data-focus-key=${key("secondary")}
                                @click=${() => void this.answer(d, "secondary")}
                              >${d.secondary}</button>`}
                      </div>
                      ${this.failed[d.id] && !answered ? html`<p class="ui-di__error" role="alert">Couldn't save that – try again.</p>` : nothing}
                    </div>
                  </div>
                </div>
              </div>
            </div>`;
          },
        )}
        <p class="ui-di__empty">Nothing waiting on you – new decisions show up here.</p>
      </div>
    `;
  }

  static override css = /* css */ `
/* A decision whose onDecide promise is still running, and one whose promise failed */
.ui-di__btn[aria-disabled] { opacity: 0.6; cursor: progress; }
.ui-di__error {
  margin: var(--tc-space-2) 0 0;
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-font-size-sm);
}
[data-ui="di"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 440px;
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Like the Chat Composer: a tray with the heading, the card sits on top of it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="di"] {
  background: var(--tc-surface-tray);
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
}
/* Clean: one card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="di"] {
  container-type: inline-size;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  text-align: left;
}
[data-ui="di"] *, [data-ui="di"] *::before, [data-ui="di"] *::after { box-sizing: border-box; }
:where([data-ui="di"]) button { margin: 0; font: inherit; cursor: pointer; }
:where([data-ui="di"]):where([data-look="clean"], [data-look="clean"] *) button { padding: 0; border: 0; background: none; color: inherit; -webkit-tap-highlight-color: transparent; }
:where([data-ui="di"]):where([data-look="clean"], [data-look="clean"] *) svg { display: block; flex: none; }
[data-ui="di"] button:focus-visible, .ui-di__done:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-di__done:focus:not(:focus-visible) { outline: none; }
/* Solid glyphs: the mark is cut out in the colour of the surface under it */
.ui-di__cut { fill: none; stroke: var(--tc-surface-raised); }
.ui-di__cut-dot { fill: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="di"] .ui-di__cut { stroke: var(--tc-surface-on-tray); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="di"] .ui-di__cut-dot { fill: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__glyph { width: 16px; height: 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-di__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  padding: var(--tc-space-3) var(--tc-space-4-5) var(--tc-space-2-5);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-status-warning-fg);
  transition: color var(--tc-duration-slow) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="di"][data-clear] .ui-di__head { color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-di__card {
  overflow: hidden;
  background: var(--tc-surface-on-tray);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-card-shadow);
}
/* The heading row at the top of the card: an amber mark while something waits, a green one when all is done */
:where([data-look="clean"], [data-look="clean"] *).ui-di__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-height: 44px;
  padding: 0 var(--tc-space-4);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-di__head .ui-di__glyph { color: var(--tc-status-warning-solid); animation: ui-di-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="di"][data-clear] .ui-di__head .ui-di__glyph { color: var(--tc-status-success-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__head span { animation: ui-di-in var(--tc-duration-slow) var(--tc-ease-move) both; }
/* Rows fold away with a height transition once answered */
.ui-di__row {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slow) var(--tc-ease-standard);
}
.ui-di__row[data-gone] { grid-template-rows: 0fr; opacity: 0; }
.ui-di__row-inner { min-height: 0; overflow: hidden; }
.ui-di__row + .ui-di__row .ui-di__item { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-di__row[data-gone] + .ui-di__row .ui-di__item { border-top-color: transparent; }
:where([data-look="standard"], [data-look="standard"] *).ui-di__item { padding: var(--tc-space-4) var(--tc-space-5) var(--tc-space-3-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-di__item:not([data-open]) { padding-bottom: var(--tc-space-4); }
.ui-di__title {
  display: block;
  width: 100%;
  margin: 0;
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  text-align: left;
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__title {
  padding: 0;
  border: 0;
  background: none;
  font-size: var(--tc-font-size-lg);
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__title--folded {
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__title--folded:hover { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__item { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__item:not([data-open]) { padding: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-di__title {
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-strong);
}
/* A folded decision: one muted line that opens on click */
:where([data-ui="di"]) :where([data-look="clean"], [data-look="clean"] *).ui-di__title--folded {
  padding: var(--tc-space-3-5) var(--tc-space-4);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-di__title--folded:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="di"] button.ui-di__title--folded:focus-visible { outline-offset: -2px; }
.ui-di__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move);
}
.ui-di__body[data-open] { grid-template-rows: 1fr; }
/* Room around the buttons so the clipping for the fold never cuts their ring and shadow */
.ui-di__body-inner {
  min-height: 0;
  overflow: hidden;
  margin: 0 -4px -4px;
  padding: 0 var(--tc-space-1) var(--tc-space-1);
}
.ui-di__detail {
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__detail { margin: var(--tc-space-1) 0 0; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__detail { margin: var(--tc-space-0-5) 0 0; color: var(--tc-text-secondary); }
.ui-di__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-2);
  min-height: var(--tc-control-h-md);
  margin-top: var(--tc-space-3);
}
/* The two answers look exactly like Button: secondary, and the flat-ink primary */
.ui-di__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  white-space: nowrap;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-action-secondary-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
.ui-di__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-di__btn:active { transform: scale(0.98); }
.ui-di__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-di__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-di__btn--primary:active { background: var(--tc-action-primary-bg-active); }
/* The answer in the place of the buttons */
.ui-di__done {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-status-success-fg);
  animation: ui-di-in var(--tc-duration-slow) var(--tc-ease-move);
}
/* Clean: a minimal green fill */
:where([data-look="clean"], [data-look="clean"] *).ui-di__done {
  min-height: var(--tc-control-h-md);
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-status-success-bg);
}
.ui-di__empty {
  display: none;
  margin: 0;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__empty { padding: var(--tc-space-4-5) var(--tc-space-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__empty { padding: var(--tc-space-3-5) var(--tc-space-4); }
[data-ui="di"][data-clear] .ui-di__empty { display: block; animation: ui-di-in var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-slow) both; }
@keyframes ui-di-in {
  from { opacity: 0; transform: translateY(3px); }
}
@keyframes ui-di-pop {
  from { opacity: 0; transform: scale(0.6); }
}
/* Narrow cards (phones) */
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-di__head { padding: 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__item { padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5); }
:where([data-ui="di"]) :where([data-look="clean"], [data-look="clean"] *).ui-di__title--folded { padding: var(--tc-space-3-5) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__empty { padding: var(--tc-space-3-5); }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-di__btn,
:where([data-look="clean"], [data-look="clean"] *).ui-di__done { height: 36px; padding: 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__done { padding: 0 var(--tc-space-3-5) 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__actions { min-height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
.ui-di__row,
.ui-di__body { transition: none; }
.ui-di__done,
.ui-di__empty,
.ui-di__head .ui-di__glyph,
.ui-di__head span { animation: none !important; }
}
`;
}

if (!customElements.get("tc-decision-inbox")) customElements.define("tc-decision-inbox", TcDecisionInbox);

declare global {
  interface HTMLElementTagNameMap {
    "tc-decision-inbox": TcDecisionInbox;
  }
}

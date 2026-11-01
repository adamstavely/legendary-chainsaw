import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { TcElement } from "./internal/base";

/*
 * <tc-status-morph> – one state's mark changing into the next: the old mark fades and shrinks as the new one grows in,
 * and the word changes with it. Nothing loops, so "checking" is a still mark. With reduced motion it simply switches.
 * It's silent to screen readers unless `announce` is set, which reads each change politely.
 *
 *   <tc-status-morph status="checking" announce></tc-status-morph>
 */

export type StatusMorphStatus = "pending" | "checking" | "done" | "failed" | "warning";
/** The word for each status, every one renameable through `labels` */
export type StatusMorphLabels = Record<StatusMorphStatus, string>;
export const defaultStatusMorphLabels: StatusMorphLabels = { pending: "Pending", checking: "Checking", done: "Done", failed: "Failed", warning: "Warning" };

/* Marks after Lucide (ISC, lucide.dev) */
const MARKS: Record<StatusMorphStatus, unknown> = {
  pending: svg`<circle cx="12" cy="12" r="9"></circle>`,
  checking: svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>`,
  done: svg`<circle cx="12" cy="12" r="9"></circle><path d="m8 12.5 3 3 5-6"></path>`,
  failed: svg`<circle cx="12" cy="12" r="9"></circle><path d="m9 9 6 6M15 9l-6 6"></path>`,
  warning: svg`<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"></path><path d="M12 9v4M12 17h.01"></path>`,
};
const known = (s: string): s is StatusMorphStatus => s in MARKS;
const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * One state's mark changing into the next, with its word.
 * @tag tc-status-morph
 */
export class TcStatusMorph extends TcElement {
  static override ui = "smo";
  static override looks = false;

  /** The state: "pending", "checking", "done", "failed" or "warning" */
  @property({ reflect: true }) accessor status: StatusMorphStatus = "pending";
  /** The word beside the mark, in place of the status's own word */
  @property() accessor label: string | undefined = undefined;
  /** Read each change out politely */
  @property({ type: Boolean }) accessor announce = false;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<StatusMorphLabels> = {};

  /** The mark that's leaving */
  @state() private accessor leaving: StatusMorphStatus | null = null;
  @state() private accessor spoken = "";

  private get current(): StatusMorphStatus {
    return known(this.status) ? this.status : "pending";
  }
  private get word() {
    return this.label ?? { ...defaultStatusMorphLabels, ...this.labels }[this.current];
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const old = changed.get("status") as StatusMorphStatus | undefined;
    if (!changed.has("status") || old === undefined || old === this.status) return;
    this.leaving = reduced() || !known(old) ? null : old;
    if (this.announce) this.spoken = this.word;
  }

  protected override render() {
    const s = this.current;
    const icon = (status: StatusMorphStatus) => svg`${MARKS[status]}`;
    const moving = this.leaving !== null;
    return html`<span class="ui-smo-mark" aria-hidden="true">
        ${moving
          ? html`<svg class="ui-smo-icon" data-exit data-status=${this.leaving!} viewBox="0 0 24 24" @animationend=${() => (this.leaving = null)}>${icon(this.leaving!)}</svg>`
          : nothing}
        ${keyed(s, html`<svg class="ui-smo-icon" ?data-enter=${moving} data-status=${s} viewBox="0 0 24 24">${icon(s)}</svg>`)}
      </span>
      ${keyed(s, html`<span class="ui-smo-word" ?data-enter=${moving}>${this.word}</span>`)}
      ${this.announce ? html`<span class="tc-sr-only" role="status">${this.spoken}</span>` : nothing}`;
  }

  static override css = /* css */ `
[data-ui="smo"] {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
}
.ui-smo-mark { display: inline-grid; flex: none; width: 1.25em; height: 1.25em; }
.ui-smo-icon { grid-area: 1 / 1; display: block; width: 100%; height: 100%; fill: none; stroke: var(--tc-text-secondary); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-smo-icon[data-status="done"] { stroke: var(--tc-status-success-fg); }
.ui-smo-icon[data-status="failed"] { stroke: var(--tc-status-danger-fg); }
.ui-smo-icon[data-status="warning"] { stroke: var(--tc-status-warning-fg); }
.ui-smo-icon[data-enter] { animation: ui-smo-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-smo-icon[data-exit] { animation: ui-smo-out var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-smo-word[data-enter] { animation: ui-smo-word var(--tc-duration-moderate) var(--tc-ease-standard) both; }
@keyframes ui-smo-in { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: none; } }
@keyframes ui-smo-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: scale(0.6); } }
@keyframes ui-smo-word { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .ui-smo-icon[data-enter], .ui-smo-word[data-enter] { animation: none; }
  .ui-smo-icon[data-exit] { display: none; }
}
@media (forced-colors: active) {
  .ui-smo-icon, .ui-smo-icon[data-status] { stroke: CanvasText; }
}
`;
}

if (!customElements.get("tc-status-morph")) customElements.define("tc-status-morph", TcStatusMorph);

declare global {
  interface HTMLElementTagNameMap {
    "tc-status-morph": TcStatusMorph;
  }
}

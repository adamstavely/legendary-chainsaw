import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";

/*
 * <tc-moderation-queue> – reported replies, judged one at a time. Each item says why it's here (a person's report, or
 * an automatic flag with the classifier's score), the policy it may break, and the conversation around it with the
 * reported reply marked. One decision each: Keep (no violation), Remove reply, Restrict user or Escalate; removing and
 * restricting need a note. After a decision the next waiting item opens; Undo takes the last one back.
 *   · keys, anywhere in the queue but a text field: K keep, R remove, U restrict, E escalate, N / P next and previous,
 *     Z undo – each button shows its key
 *   · progress in words: "Item 2 of 6 · 3 waiting"
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-moderation-queue .items=${items}></tc-moderation-queue>
 */

export type ModerationDecision = "keep" | "remove" | "restrict" | "escalate";
export type ModerationTurn = {
  id: string;
  /** Who wrote it */
  from: "user" | "assistant";
  /** The name shown, e.g. a person or the agent; default "User" or "Assistant" */
  author?: string;
  text: string;
  /** The reply this item is about – marked in the conversation */
  reported?: boolean;
};
export type ModerationItem = {
  id: string;
  /** Why it's here, e.g. "Unsafe advice" */
  reason: string;
  /** The person who reported it */
  reportedBy?: string;
  /** An automatic flag: the classifier and its score from 0 to 1 */
  automated?: { classifier: string; score: number };
  /** When it was reported (epoch ms) */
  at?: number;
  /** The policy it may break */
  policy?: { name: string; excerpt?: string };
  /** The conversation around the reported reply */
  turns: ModerationTurn[];
  /** The user Restrict acts on */
  user?: string;
  /** The agent that replied */
  agent?: string;
};
export type ModerationVerdict = { decision: ModerationDecision; note?: string };
/** tc-decide: a decision was made */
export type ModerationDecide = { id: string; decision: ModerationDecision; note: string; item: ModerationItem };
/** tc-decisions-change: every decision so far, by item id */
export type ModerationDecisionsChange = { decisions: Record<string, ModerationVerdict>; id: string };
/** tc-index-change: the item on screen */
export type ModerationIndexChange = { index: number; item: ModerationItem | undefined };
/** tc-undo: the last decision taken back */
export type ModerationUndo = { id: string; decision: ModerationDecision };

export type ModerationDecisionLabels = Record<ModerationDecision, string>;
export const defaultModerationDecisionLabels: ModerationDecisionLabels = { keep: "Keep", remove: "Remove reply", restrict: "Restrict user", escalate: "Escalate" };
/** What each decision did, in the past tense */
const DONE: Record<ModerationDecision, string> = { keep: "Kept", remove: "Reply removed", restrict: "User restricted", escalate: "Escalated" };
const KEYS: Record<ModerationDecision, string> = { keep: "K", remove: "R", restrict: "U", escalate: "E" };
const ORDER: ModerationDecision[] = ["keep", "remove", "restrict", "escalate"];
const NEEDS_NOTE = new Set<ModerationDecision>(["remove", "restrict"]);
const scoreWord = (s: number) => (s >= 0.85 ? "High" : s >= 0.6 ? "Medium" : "Low");
let uidCount = 0;

/* After Lucide (ISC, lucide.dev): shield-alert – the header's icon; flag, bot, user */
const headIcon = svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path>`;
const icon = (body: ReturnType<typeof svg>) =>
  html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const flagIcon = () => icon(svg`<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"></path>`);
const botIcon = () => icon(svg`<path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path>`);

/**
 * Reported replies, one decision each – the report or automatic flag, the policy, the conversation with the reported
 * reply marked, and Keep, Remove reply, Restrict user or Escalate from buttons or keys, with Undo.
 * @tag tc-moderation-queue
 * @fires tc-decide - A decision was made ({ id, decision, note, item }: ModerationDecide); cancelable – prevented, nothing is recorded
 * @fires tc-decisions-change - The decisions changed, by a decision or Undo ({ decisions, id }: ModerationDecisionsChange); cancelable – prevented, `decisions` stays as it was
 * @fires tc-index-change - Another item opened ({ index, item }: ModerationIndexChange); cancelable – prevented, `index` stays as it was
 * @fires tc-undo - Undo took the last decision back ({ id, decision }: ModerationUndo); cancelable – prevented, the decision stays
 */
export class TcModerationQueue extends TcElement {
  static override ui = "mdq";

  /** The heading */
  @property() accessor heading = "Moderation";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The reported replies, oldest first */
  @property({ attribute: false }) accessor items: ModerationItem[] = [];
  /** The item on screen. Changed by deciding and moving unless a tc-index-change listener calls preventDefault() */
  @property({ type: Number }) accessor index = 0;
  /** Every decision so far, by item id. Changed by deciding and Undo unless a tc-decisions-change listener calls preventDefault() */
  @property({ attribute: false }) accessor decisions: Record<string, ModerationVerdict> = {};
  /** The buttons' words, merged over defaultModerationDecisionLabels */
  @property({ attribute: false }) accessor decisionLabels: Partial<ModerationDecisionLabels> = {};
  /** Turns off the single-letter keys */
  @property({ type: Boolean, attribute: "no-shortcuts" }) accessor noShortcuts = false;
  /** For dates */
  @property() accessor locale: string | undefined = undefined;

  /** @internal The note being written for the item on screen */
  @state() accessor note = "";
  /** @internal What's missing before the decision can be made */
  @state() accessor noteError = "";
  /** @internal The polite announcement */
  @state() accessor announce = "";

  private uid = `tc-mdq-${++uidCount}`;
  /** Decisions made here, newest last, for Undo */
  private history: string[] = [];
  private shownId: string | undefined;

  private get words(): ModerationDecisionLabels {
    return { ...defaultModerationDecisionLabels, ...this.decisionLabels };
  }
  private get current(): ModerationItem | undefined {
    return this.items[Math.max(0, Math.min(this.items.length - 1, this.index))];
  }
  private get waiting() {
    return this.items.filter((i) => !this.decisions[i.id]).length;
  }

  private go(index: number, say = true) {
    const n = this.items.length;
    if (!n) return;
    const next = Math.max(0, Math.min(n - 1, index));
    if (next === this.index) return;
    const item = this.items[next];
    if (!this.emit<ModerationIndexChange>("tc-index-change", { index: next, item }, { cancelable: true })) return;
    this.index = next;
    if (say) this.announce = `Item ${next + 1} of ${n}: ${item.reason}`;
  }

  private nextWaiting(from: number) {
    const n = this.items.length;
    for (let k = 1; k <= n; k++) {
      const i = (from + k) % n;
      if (!this.decisions[this.items[i].id]) return i;
    }
    return -1;
  }

  /** Decides the item on screen; a decision that needs a note and has none asks for it instead */
  decide(decision: ModerationDecision) {
    const item = this.current;
    if (!item) return;
    const note = this.note.trim();
    if (NEEDS_NOTE.has(decision) && !note) {
      this.noteError = decision === "remove" ? "Add a note to remove this reply" : `Add a note to restrict ${item.user ?? "this user"}`;
      this.announce = this.noteError;
      void this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>(".ui-mdq__note")?.focus());
      return;
    }
    if (!this.emit<ModerationDecide>("tc-decide", { id: item.id, decision, note, item }, { cancelable: true })) return;
    const decisions = { ...this.decisions, [item.id]: { decision, ...(note ? { note } : {}) } };
    if (!this.emit<ModerationDecisionsChange>("tc-decisions-change", { decisions, id: item.id }, { cancelable: true })) return;
    this.decisions = decisions;
    this.history = [...this.history.filter((id) => id !== item.id), item.id];
    this.noteError = "";
    const at = this.items.indexOf(item);
    const next = this.nextWaiting(at);
    if (next >= 0 && next !== at) {
      this.go(next, false);
      this.announce = `${DONE[decision]}. Item ${this.index + 1} of ${this.items.length}: ${this.items[this.index].reason}`;
    } else this.announce = `${DONE[decision]}. All ${this.items.length} decided`;
  }

  /** Takes the last decision made here back */
  undo() {
    const id = this.history[this.history.length - 1];
    const verdict = id ? this.decisions[id] : undefined;
    if (!id || !verdict) return;
    if (!this.emit<ModerationUndo>("tc-undo", { id, decision: verdict.decision }, { cancelable: true })) return;
    const decisions = { ...this.decisions };
    delete decisions[id];
    if (!this.emit<ModerationDecisionsChange>("tc-decisions-change", { decisions, id }, { cancelable: true })) return;
    this.decisions = decisions;
    this.history = this.history.slice(0, -1);
    const at = this.items.findIndex((i) => i.id === id);
    if (at >= 0) this.go(at, false);
    this.note = verdict.note ?? "";
    this.announce = `Undone: ${DONE[verdict.decision].toLowerCase()}. Item ${at + 1} is waiting again`;
  }

  private onKey = (e: KeyboardEvent) => {
    if (this.noShortcuts || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable]")) return;
    const k = e.key.toLowerCase();
    const decision = ORDER.find((d) => KEYS[d].toLowerCase() === k);
    if (decision) {
      e.preventDefault();
      this.decide(decision);
    } else if (k === "n") {
      e.preventDefault();
      this.go(this.index + 1);
    } else if (k === "p") {
      e.preventDefault();
      this.go(this.index - 1);
    } else if (k === "z") {
      e.preventDefault();
      this.undo();
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A new item on screen starts with its own note: the one it was decided with, or none
    const id = this.current?.id;
    if (id !== this.shownId) {
      this.shownId = id;
      this.note = (id && this.decisions[id]?.note) || "";
      this.noteError = "";
    }
  }

  private renderReason(item: ModerationItem) {
    const auto = item.automated;
    return html`<div class="ui-mdq__reason">
      <span class="ui-mdq__who">
        ${auto ? botIcon() : flagIcon()}
        <span>
          ${auto
            ? html`Flagged automatically · ${auto.classifier} <span class="ui-mdq__score" data-level=${scoreWord(auto.score).toLowerCase()}>${scoreWord(auto.score)}, ${auto.score.toFixed(2)}</span>`
            : html`Reported by <b>${item.reportedBy ?? "a user"}</b>`}
        </span>
      </span>
      <span class="ui-mdq__why">${item.reason}</span>
      ${item.at != null ? html`<time class="ui-mdq__at" datetime=${new Date(item.at).toISOString()}>${formatDate(item.at, this.locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</time>` : nothing}
    </div>`;
  }

  private renderTurns(item: ModerationItem) {
    return html`<ol class="ui-mdq__turns" aria-label="Conversation">
      ${item.turns.map(
        (t) => html`<li class="ui-mdq__turn" data-from=${t.from} ?data-reported=${!!t.reported}>
          <span class="ui-mdq__author">${t.author ?? (t.from === "user" ? "User" : (item.agent ?? "Assistant"))}${t.reported ? html`<span class="ui-mdq__flag">Reported reply</span>` : nothing}</span>
          <p class="ui-mdq__text">${t.text}</p>
        </li>`,
      )}
    </ol>`;
  }

  private renderItem(item: ModerationItem) {
    const w = this.words;
    const verdict = this.decisions[item.id];
    const id = this.uid;
    return html`<article class="ui-mdq__item" aria-labelledby=${`${id}-item`} data-item=${item.id}>
      <h4 class="ui-mdq__sr" id=${`${id}-item`}>${item.reason}</h4>
      ${this.renderReason(item)}
      ${item.policy
        ? html`<div class="ui-mdq__policy">
            <span class="ui-mdq__policy-name">May break: <b>${item.policy.name}</b></span>
            ${item.policy.excerpt ? html`<blockquote class="ui-mdq__excerpt">${item.policy.excerpt}</blockquote>` : nothing}
          </div>`
        : nothing}
      ${this.renderTurns(item)}
      ${verdict
        ? html`<p class="ui-mdq__verdict" data-decision=${verdict.decision}>
            <b>Decided: ${DONE[verdict.decision]}</b>${verdict.note ? html` · ${verdict.note}` : nothing}<span class="ui-mdq__verdict-hint"> – choose again to change it</span>
          </p>`
        : nothing}
      <div class="ui-mdq__note-field">
        <label class="ui-mdq__note-label" for=${`${id}-note`}>Note <span class="ui-mdq__note-hint">(needed to remove or restrict)</span></label>
        <textarea
          id=${`${id}-note`}
          class="ui-mdq__note"
          rows="2"
          .value=${this.note}
          aria-invalid=${this.noteError ? "true" : "false"}
          aria-describedby=${ifDefined(this.noteError ? `${id}-note-error` : undefined)}
          @input=${(e: Event) => {
            this.note = (e.target as HTMLTextAreaElement).value;
            if (this.noteError && this.note.trim()) this.noteError = "";
          }}
        ></textarea>
        ${this.noteError ? html`<p class="ui-mdq__note-error" id=${`${id}-note-error`}>${this.noteError}</p>` : nothing}
      </div>
      <div class="ui-mdq__decisions" role="group" aria-label="Decision">
        ${ORDER.map(
          (d) => html`<button
            type="button"
            class="ui-mdq__decide"
            data-decision=${d}
            aria-pressed=${verdict?.decision === d ? "true" : "false"}
            aria-keyshortcuts=${ifDefined(this.noShortcuts ? undefined : KEYS[d])}
            @click=${() => this.decide(d)}
          >${d === "restrict" && item.user ? html`${w[d]}<span class="ui-mdq__sr"> ${item.user}</span>` : w[d]}${this.noShortcuts ? nothing : html`<kbd class="ui-mdq__kbd" aria-hidden="true">${KEYS[d]}</kbd>`}</button>`,
        )}
      </div>
    </article>`;
  }

  protected override render() {
    const n = this.items.length;
    const item = this.current;
    const waiting = this.waiting;
    const at = item ? this.items.indexOf(item) : 0;
    const decided = n - waiting;
    const clean = this.resolvedLook === "clean";
    const head = cardHead({
      icon: headIcon,
      title: this.heading,
      subtitle: this.description || undefined,
      id: `${this.uid}-title`,
      aside: n ? html`<span class="ui-mdq__waiting" ?data-none=${!waiting}>${waiting ? `${waiting} waiting` : "All decided"}</span>` : undefined,
    });
    const canUndo = this.history.some((id) => this.decisions[id]);
    return html`
      <span class="ui-mdq__sr" role="status">${this.announce}</span>
      ${clean ? nothing : head}
      <div class="ui-mdq__card" @keydown=${this.onKey}>
        ${clean ? head : nothing}
        ${n && item
          ? html`<div class="ui-mdq__progress">
                <span class="ui-mdq__where">Item ${at + 1} of ${n} · ${decided} decided</span>
                <span class="ui-mdq__bar" aria-hidden="true"><span style=${`width: ${(decided / n) * 100}%`}></span></span>
              </div>
              ${this.renderItem(item)}
              <div class="ui-mdq__nav">
                <button type="button" class="ui-mdq__btn" aria-disabled=${at > 0 ? "false" : "true"} aria-keyshortcuts=${ifDefined(this.noShortcuts ? undefined : "P")} @click=${() => this.go(at - 1)}>Previous${this.noShortcuts ? nothing : html`<kbd class="ui-mdq__kbd" aria-hidden="true">P</kbd>`}</button>
                <button type="button" class="ui-mdq__btn" aria-disabled=${at < n - 1 ? "false" : "true"} aria-keyshortcuts=${ifDefined(this.noShortcuts ? undefined : "N")} @click=${() => this.go(at + 1)}>Next${this.noShortcuts ? nothing : html`<kbd class="ui-mdq__kbd" aria-hidden="true">N</kbd>`}</button>
                <span class="ui-mdq__spacer"></span>
                <button type="button" class="ui-mdq__btn" aria-disabled=${canUndo ? "false" : "true"} aria-keyshortcuts=${ifDefined(this.noShortcuts ? undefined : "Z")} @click=${() => this.undo()}>Undo${this.noShortcuts ? nothing : html`<kbd class="ui-mdq__kbd" aria-hidden="true">Z</kbd>`}</button>
              </div>`
          : html`<p class="ui-mdq__empty">Nothing waiting – every report has been judged.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mdq"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mdq"] {
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
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="mdq"] *, [data-ui="mdq"] *::before, [data-ui="mdq"] *::after { box-sizing: border-box; }
:where([data-ui="mdq"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
[data-ui="mdq"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="mdq"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="mdq"] h4, [data-ui="mdq"] p, [data-ui="mdq"] blockquote { margin: 0; }
[data-ui="mdq"] svg { display: block; flex: none; }
.ui-mdq__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdq__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-mdq__waiting { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-status-warning-fg); white-space: nowrap; }
.ui-mdq__waiting[data-none] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
/* Progress */
.ui-mdq__progress { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-4) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdq__progress { padding-top: 0; }
.ui-mdq__where { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-mdq__bar { display: block; height: 4px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-mdq__bar > span { display: block; height: 100%; border-radius: inherit; background: var(--tc-accent); transition: width var(--tc-duration-moderate) var(--tc-ease-move); }
/* The item */
.ui-mdq__item { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3-5); }
.ui-mdq__reason { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mdq__who { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); }
.ui-mdq__who b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-mdq__score { font-weight: var(--tc-font-weight-medium); color: var(--tc-status-warning-fg); }
.ui-mdq__score[data-level="high"] { color: var(--tc-status-danger-fg); }
.ui-mdq__score[data-level="low"] { color: var(--tc-text-secondary); }
.ui-mdq__why { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-danger-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-status-danger-fg); }
.ui-mdq__at { margin-left: auto; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-mdq__policy { display: grid; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-mdq__policy-name b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-mdq__excerpt { padding-left: var(--tc-space-3); border-left: 2px solid var(--tc-border-default); color: var(--tc-text-muted); }
/* The conversation, the reported reply marked */
.ui-mdq__turns { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); }
.ui-mdq__turn { display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); }
.ui-mdq__turn[data-reported] { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1.5px var(--tc-status-danger-border); }
.ui-mdq__author { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-mdq__flag { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-danger-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-status-danger-fg); }
.ui-mdq__text { line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); white-space: pre-wrap; }
.ui-mdq__verdict { padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-info-bg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-info-fg); }
.ui-mdq__verdict b { font-weight: var(--tc-font-weight-medium); }
/* The note */
.ui-mdq__note-field { display: grid; gap: var(--tc-space-1); }
.ui-mdq__note-label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-mdq__note-hint { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-mdq__note { width: 100%; min-height: var(--tc-control-h-lg); padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); resize: vertical; }
.ui-mdq__note:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-mdq__note:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-mdq__note[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-mdq__note-error { font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
/* Decisions: four buttons, each with its key */
.ui-mdq__decisions { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--tc-space-2); }
.ui-mdq__decide, .ui-mdq__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-2); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; }
.ui-mdq__decide:hover, .ui-mdq__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-mdq__decide[aria-pressed="true"] { box-shadow: var(--tc-action-secondary-shadow), inset 0 0 0 1.5px var(--tc-border-selected); }
.ui-mdq__decide[data-decision="remove"], .ui-mdq__decide[data-decision="restrict"] { color: var(--tc-status-danger-fg); }
.ui-mdq__btn[aria-disabled="true"] { opacity: 0.45; cursor: default; }
.ui-mdq__kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-kbd-fg); }
.ui-mdq__nav { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mdq__spacer { flex: 1; }
.ui-mdq__empty { padding: var(--tc-space-6) var(--tc-space-4); text-align: center; color: var(--tc-text-muted); }
@container (max-width: 520px) {
  .ui-mdq__decisions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ui-mdq__at { margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mdq"] *, [data-ui="mdq"] *::before, [data-ui="mdq"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) { .ui-mdq__turn[data-reported] { outline: 2px solid Highlight; } .ui-mdq__bar > span { background: Highlight; } }
`;
}

if (!customElements.get("tc-moderation-queue")) customElements.define("tc-moderation-queue", TcModerationQueue);

declare global {
  interface HTMLElementTagNameMap {
    "tc-moderation-queue": TcModerationQueue;
  }
}

import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, OffScreenController } from "./internal/controllers";
import type { Look } from "./internal/look";
import "./message-actions";
import type { MessageActionKey } from "./message-actions";

/*
 * <tc-conversation-branches> – edit a past message and the conversation forks. The messages are a tree (each one
 * names its parent); the element shows one path through it:
 *   · every message with siblings carries a "‹ 2 / 3 ›" switcher – the user's edits, or regenerated replies – and the
 *     messages below follow the branch that's picked
 *   · Edit on your own message opens it in place; Send makes a new branch next to it. The element fires a cancelable
 *     `tc-edit` whose detail has `respondWith(replies | Promise<replies>)`: the app answers with the new branch's
 *     replies, and "Writing a reply…" shows until they arrive
 *   · assistant replies carry the message-actions bar (copy, feedback) – its events bubble from a
 *     <tc-message-actions> whose data-message-id names the reply
 *   · the switch is announced ("Branch 2 of 3 – 3 messages below")
 *
 *   <tc-conversation-branches .messages=${messages}></tc-conversation-branches>
 *
 * Standard: the thread on a white card in the gray tray, with a caption line on the tray. Clean: one white card,
 * the caption as its last row. Changes fire cancelable `tc-messages-change` ({ messages }) and `tc-selected-change`
 * ({ selected, messageId, index, count }): prevent them to own `messages` or `selected`.
 */

export type BranchRole = "user" | "assistant";

export type BranchMessage = {
  id: string;
  role: BranchRole;
  text: string;
  /** The message this one answers or follows; unset or null for the first message */
  parentId?: string | null;
};

/** The picked child per parent id ("" for the first messages). A parent that isn't listed shows its newest child */
export type BranchSelection = Record<string, string>;

/** Details of the events */
export type BranchSelectedChange = { selected: BranchSelection; messageId: string; index: number; count: number };
export type BranchMessagesChange = { messages: BranchMessage[] };
export type BranchEditDetail = {
  /** The message that was edited */
  messageId: string;
  /** The new text */
  text: string;
  /** The new branch's first message, as it will be added */
  message: BranchMessage;
  /**
   * Answer with the new branch's replies, or a promise of them. A reply without `parentId` follows the one before it
   * (the first follows `message`)
   */
  respondWith: (replies: BranchMessage[] | Promise<BranchMessage[]>) => void;
};

const ROOT = "";
const DEFAULT_ACTIONS: MessageActionKey[] = ["copy", "feedback"];
let instances = 0;
let ids = 0;
const newId = () => `branch-${++ids}-${Math.random().toString(36).slice(2, 8)}`;
const isPromise = (value: unknown): value is Promise<unknown> => !!value && typeof (value as Promise<unknown>).then === "function";
/** Textareas grow with their text */
const grow = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* ---------- Icons: message-actions' sets – Standard 24-unit outlines at 16px, Clean thin or solid 16px glyphs ---------- */

type IconName = "edit" | "prev" | "next";
const outline = (d: string) => html`<svg viewBox="0 0 24 24" class="ui-cvb__glyph" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const clean = (d: string, solid = false) => html`<svg viewBox="0 0 16 16" class="ui-cvb__glyph" ?data-solid=${solid} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const ICONS: Record<Look, Record<IconName, TemplateResult>> = {
  standard: {
    edit: outline("M14.5 6.5l3 3M5 19l.8-3.6 9.9-9.9a1.8 1.8 0 0 1 2.6 0l.2.2a1.8 1.8 0 0 1 0 2.6l-9.9 9.9L5 19Z"),
    prev: outline("m14.5 7-5 5 5 5"),
    next: outline("m9.5 7 5 5-5 5"),
  },
  clean: {
    edit: clean("M9.8 3.7l2.5 2.5M3 13l.6-3 6.9-6.9a1.4 1.4 0 0 1 2 0l.4.4a1.4 1.4 0 0 1 0 2L6 12.4 3 13Z"),
    // The previous arrow is the next one, mirrored by the CSS
    prev: clean("M10.85 7.65a.5.5 0 0 1 0 .7L7.2 12a.5.5 0 0 1-.7-.7L9.79 8 6.5 4.7a.5.5 0 1 1 .7-.7l3.65 3.65Z", true),
    next: clean("M10.85 7.65a.5.5 0 0 1 0 .7L7.2 12a.5.5 0 0 1-.7-.7L9.79 8 6.5 4.7a.5.5 0 1 1 .7-.7l3.65 3.65Z", true),
  },
};

type Step = { message: BranchMessage; parent: string; siblings: BranchMessage[]; index: number };

/**
 * A conversation that forks when a past message is edited: a "‹ 2 / 3 ›" switcher on each message with siblings, and
 * the picked branch's messages below it.
 * @tag tc-conversation-branches
 * @fires tc-selected-change - A branch was picked in a switcher, or a new branch was made; detail `{ selected, messageId, index, count }`. Cancelable: prevent it to control `selected`
 * @fires tc-messages-change - Messages were added (a new branch, its replies); detail `{ messages: BranchMessage[] }`. Cancelable: prevent it to control `messages`
 * @fires tc-edit - Send was pressed on an edited message; detail `{ messageId, text, message, respondWith }`. Cancelable: prevent it to drop the edit. Call `respondWith(replies | promise)` to answer the new branch
 */
export class TcConversationBranches extends TcElement {
  static override ui = "cvb";

  /** Every message of every branch, in the order they were written; each names its parent */
  @property({ attribute: false }) accessor messages: BranchMessage[] = [];
  /** The picked child per parent id ("" for the first messages); a parent without an entry shows its newest child */
  @property({ attribute: false }) accessor selected: BranchSelection = {};
  /** Your messages can be edited (default true; editable="false" turns it off) */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor editable = true;
  /** The actions under each reply (message-actions' keys); an empty list hides the bar */
  @property({ attribute: false }) accessor replyActions: MessageActionKey[] = DEFAULT_ACTIONS;
  /** Draws a message's content – a Node or a string. Default: the text, a paragraph per blank line */
  @property({ attribute: false }) accessor renderContent: ((message: BranchMessage) => Node | string) | undefined = undefined;
  /** Accessible name of the conversation */
  @property() accessor label = "Conversation";
  /** Who "you" are, for screen readers */
  @property({ attribute: "user-name" }) accessor userName = "You";
  /** Who answers, for screen readers */
  @property({ attribute: "assistant-name" }) accessor assistantName = "Assistant";
  /** The caption line (Standard: on the tray, Clean: the card's last row); unset, it sums up the branches */
  @property() accessor caption: string | undefined = undefined;

  /** @internal The message being edited */
  @state() accessor editing: string | null = null;
  /** @internal */
  @state() accessor draft = "";
  /** @internal New branches waiting for their replies, or whose replies failed */
  @state() accessor pending: Record<string, "waiting" | "failed"> = {};
  /** @internal The live region's text */
  @state() accessor status = "";

  private readonly uid = `tc-cvb-${++instances}`;
  private alive = false;
  private byParent = new Map<string, BranchMessage[]>();
  private indexedFor: BranchMessage[] | null = null;
  /** After an update: what to focus ("edit:<depth>", "input") */
  private focusNext: string | null = null;

  constructor() {
    super();
    // Focus never drops to <body>: a step arrow that turns disabled hands focus to the other one; the rest go to the
    // nearest Edit button, else the host
    new FocusRescueController(this, (key) => {
      const m = key?.match(/^step-(prev|next):(\d+)$/);
      if (m) return this.querySelector<HTMLElement>(`[data-focus-key="step-${m[1] === "prev" ? "next" : "prev"}:${m[2]}"]`);
      return this.querySelector<HTMLElement>(".ui-cvb__edit");
    });
    // The "Writing a reply…" dots stop while scrolled away
    new OffScreenController(this, () => Object.values(this.pending).includes("waiting"));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.alive = true;
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // Replies that arrive after removal are dropped
    this.alive = false;
  }

  /* ---------- The tree ---------- */

  private index() {
    if (this.indexedFor === this.messages) return;
    this.indexedFor = this.messages;
    const map = new Map<string, BranchMessage[]>();
    for (const m of this.messages) {
      const key = m.parentId ?? ROOT;
      const list = map.get(key);
      if (list) list.push(m);
      else map.set(key, [m]);
    }
    this.byParent = map;
  }

  /** @internal The path shown for a selection: from the first message down, following the picked child at each fork */
  pathFor(selected: BranchSelection): Step[] {
    this.index();
    const steps: Step[] = [];
    let parent = ROOT;
    // A cycle in bad data can't loop forever
    for (let guard = 0; guard <= this.messages.length; guard++) {
      const siblings = this.byParent.get(parent);
      if (!siblings?.length) break;
      const at = siblings.findIndex((s) => s.id === selected[parent]);
      const index = at < 0 ? siblings.length - 1 : at;
      const message = siblings[index];
      steps.push({ message, parent, siblings, index });
      parent = message.id;
    }
    return steps;
  }

  /** @internal The messages on screen, top to bottom */
  get path() {
    return this.pathFor(this.selected);
  }

  private announce(text: string) {
    this.status = this.status === text ? `${text} ` : text;
  }

  /** Picks a branch: reports it and applies it unless prevented */
  private pick(step: Step, index: number, announce = true) {
    const target = step.siblings[index];
    if (!target) return;
    const selected = { ...this.selected, [step.parent]: target.id };
    const count = step.siblings.length;
    if (this.emit<BranchSelectedChange>("tc-selected-change", { selected, messageId: target.id, index, count }, { cancelable: true })) this.selected = selected;
    if (!announce) return;
    const path = this.pathFor(selected);
    const below = path.length - 1 - path.findIndex((s) => s.message.id === target.id);
    this.announce(`Branch ${index + 1} of ${count}${below > 0 ? ` – ${plural(below, "message")} below` : ""}`);
  }

  private commit(messages: BranchMessage[]) {
    if (this.emit<BranchMessagesChange>("tc-messages-change", { messages }, { cancelable: true })) this.messages = messages;
  }

  /* ---------- Editing ---------- */

  private startEdit(m: BranchMessage) {
    this.editing = m.id;
    this.draft = m.text;
    this.focusNext = "input";
  }

  private cancelEdit(depth: number) {
    this.editing = null;
    this.focusNext = `edit:${depth}`;
  }

  private send(step: Step, depth: number) {
    const text = this.draft.trim();
    const old = step.message;
    if (!text || text === old.text.trim()) return;
    const message: BranchMessage = { id: newId(), role: "user", text, parentId: old.parentId ?? null };
    let answer: BranchMessage[] | Promise<BranchMessage[]> | undefined;
    const detail: BranchEditDetail = { messageId: old.id, text, message, respondWith: (replies) => (answer = replies) };
    this.editing = null;
    this.focusNext = `edit:${depth}`;
    if (!this.emit<BranchEditDetail>("tc-edit", detail, { cancelable: true })) return;
    this.commit([...this.messages, message]);
    this.pick({ ...step, siblings: [...step.siblings, message] }, step.siblings.length, false);
    this.announce(`Branch ${step.siblings.length + 1} of ${step.siblings.length + 1} – your edit was sent`);
    if (answer === undefined) return;
    const done = (replies: BranchMessage[]) => {
      if (!this.alive) return;
      const rest = { ...this.pending };
      delete rest[message.id];
      this.pending = rest;
      if (!replies.length) return;
      let parent = message.id;
      const chained = replies.map((r) => {
        const m = { ...r, parentId: r.parentId === undefined ? parent : r.parentId };
        parent = m.id;
        return m;
      });
      this.commit([...this.messages, ...chained]);
      this.announce(chained.length === 1 ? "Reply ready" : `${chained.length} replies ready`);
    };
    if (!isPromise(answer)) {
      done(answer);
      return;
    }
    this.pending = { ...this.pending, [message.id]: "waiting" };
    answer.then(done, () => {
      if (!this.alive) return;
      this.pending = { ...this.pending, [message.id]: "failed" };
      this.announce("Couldn't write a reply");
    });
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // An edited message that went away closes its editor
    if (this.editing && !this.messages.some((m) => m.id === this.editing)) this.editing = null;
    if (changed.has("label")) this.setAttribute("aria-label", this.label);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const next = this.focusNext;
    if (!next) return;
    this.focusNext = null;
    if (next === "input") {
      const input = this.querySelector<HTMLTextAreaElement>(".ui-cvb__input");
      if (!input) return;
      grow(input);
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      return;
    }
    const depth = next.slice(5);
    this.querySelector<HTMLElement>(`.ui-cvb__row[data-depth="${depth}"] .ui-cvb__edit`)?.focus();
  }

  /* ---------- Parts ---------- */

  private content(m: BranchMessage) {
    const own = this.renderContent?.(m);
    if (own !== undefined) return own;
    return m.text
      .split(/\n{2,}/)
      .filter((p) => p.trim())
      .map((p) => html`<p>${p}</p>`);
  }

  /** "‹ 2 / 3 ›" – on every message with siblings */
  private switcher(step: Step, depth: number, icons: Record<IconName, TemplateResult>) {
    const { index, siblings } = step;
    const count = siblings.length;
    if (count < 2) return nothing;
    return html`<span
      class="ui-cvb__versions"
      role="group"
      aria-label=${step.message.role === "user" ? "Edits of this message" : "Versions of this reply"}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const to = index + (e.key === "ArrowRight" ? 1 : -1);
        if (to >= 0 && to < count) this.pick(step, to);
      }}
    >
      <button type="button" class="ui-cvb__step" data-dir="prev" data-focus-key="step-prev:${depth}" aria-label="Previous branch" ?disabled=${index === 0} @click=${() => this.pick(step, index - 1)}>${icons.prev}</button>
      <span class="ui-cvb__count">
        <span class="ui-cvb__sr">Branch </span>${keyed(index, html`<span class="ui-cvb__count-now">${index + 1}</span>`)}<span aria-hidden="true">/</span><span class="ui-cvb__sr"> of </span>${count}
      </span>
      <button type="button" class="ui-cvb__step" data-dir="next" data-focus-key="step-next:${depth}" aria-label="Next branch" ?disabled=${index >= count - 1} @click=${() => this.pick(step, index + 1)}>${icons.next}</button>
    </span>`;
  }

  private editor(step: Step, depth: number, below: number) {
    const count = step.siblings.length;
    const text = this.draft.trim();
    const same = text === step.message.text.trim();
    const noteId = `${this.uid}-note-${depth}`;
    return html`<div class="ui-cvb__editor">
      <textarea
        class="ui-cvb__input"
        rows="1"
        aria-label="Edit your message"
        aria-describedby=${noteId}
        .value=${this.draft}
        @input=${(e: Event) => {
          this.draft = (e.target as HTMLTextAreaElement).value;
          grow(e.target as HTMLTextAreaElement);
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            this.send(step, depth);
          } else if (e.key === "Escape") {
            e.stopPropagation();
            this.cancelEdit(depth);
          }
        }}
      ></textarea>
      <div class="ui-cvb__editor-foot">
        <span class="ui-cvb__note" id=${noteId}>${below > 0
          ? `Sending starts branch ${count + 1} – ${below === 1 ? "the reply below stays" : `the ${below} messages below stay`} in branch ${step.index + 1}`
          : `Sending starts branch ${count + 1}`}</span>
        <button type="button" class="ui-cvb__btn" @click=${() => this.cancelEdit(depth)}>Cancel</button>
        <button type="button" class="ui-cvb__btn ui-cvb__btn--main" ?disabled=${!text || same} @click=${() => this.send(step, depth)}>Send</button>
      </div>
    </div>`;
  }

  private row(step: Step, depth: number, look: Look, below: number) {
    const icons = ICONS[look];
    const m = step.message;
    const user = m.role === "user";
    const editing = this.editing === m.id;
    const switcher = this.switcher(step, depth, icons);
    if (user)
      return html`<article class="ui-cvb__row ui-cvb__row--user" data-depth=${depth} aria-label=${this.userName} ?data-editing=${editing}>
        ${editing
          ? this.editor(step, depth, below)
          : keyed(m.id, html`<div class="ui-cvb__bubble" data-message-id=${m.id}>${this.content(m)}</div>`)}
        ${editing
          ? nothing
          : html`<div class="ui-cvb__foot">
              ${this.editable
                ? html`<button type="button" class="ui-cvb__edit" aria-label="Edit message" title="Edit" @click=${() => this.startEdit(m)}>${icons.edit}</button>`
                : nothing}
              ${switcher}
            </div>`}
      </article>`;
    return html`<article class="ui-cvb__row ui-cvb__row--reply" data-depth=${depth} aria-label=${this.assistantName} data-ui-message="">
      ${keyed(m.id, html`<div class="ui-cvb__text" data-message-id=${m.id}>${this.content(m)}</div>`)}
      ${switcher !== nothing || this.replyActions.length
        ? html`<div class="ui-cvb__foot">
            ${switcher}
            ${this.replyActions.length
              ? keyed(
                  m.id,
                  html`<tc-message-actions class="ui-cvb__actions" data-message-id=${m.id} .look=${look} .text=${m.text} .actions=${this.replyActions} label="Reply actions"></tc-message-actions>`,
                )
              : nothing}
          </div>`
        : nothing}
    </article>`;
  }

  /** "Writing a reply…" under a new branch that's waiting for its replies */
  private pendingRow(path: Step[]) {
    const last = path[path.length - 1]?.message;
    const state = last ? this.pending[last.id] : undefined;
    if (!state || this.byParent.get(last!.id)?.length) return nothing;
    return state === "waiting"
      ? html`<div class="ui-cvb__pending" aria-busy="true"><span class="ui-cvb__dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="ui-cvb__shine">Writing a reply…</span></div>`
      : html`<div class="ui-cvb__pending ui-cvb__pending--failed">Couldn't write a reply. Edit the message to try again.</div>`;
  }

  /** @internal The caption: how many branches, and where you are */
  get summary() {
    if (this.caption !== undefined) return this.caption;
    const path = this.path;
    const forks = path.filter((s) => s.siblings.length > 1);
    if (!path.length) return "No messages yet";
    if (!forks.length) return this.editable ? `${plural(path.length, "message")} · edit one of yours to branch` : plural(path.length, "message");
    const first = forks[0];
    return `${plural(path.length, "message")} · branch ${first.index + 1} of ${first.siblings.length}${forks.length > 1 ? ` · ${forks.length} forks` : ""}`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const path = this.path;
    const thread = html`<div class="ui-cvb__thread">
      ${repeat(path, (_, depth) => depth, (step, depth) => this.row(step, depth, look, path.length - 1 - depth))}
      ${this.pendingRow(path)}
      ${path.length ? nothing : html`<p class="ui-cvb__empty">No messages yet</p>`}
    </div>`;
    const caption = html`<div class="ui-cvb__caption">${keyed(this.summary, html`<span class="ui-cvb__caption-text">${this.summary}</span>`)}</div>`;
    return html`
      ${look === "clean" ? html`${thread}${caption}` : html`<div class="ui-cvb__card">${thread}</div>${caption}`}
      <span class="ui-cvb__sr" aria-live="polite">${this.status}</span>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cvb"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  min-width: 0;
  container-type: inline-size;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cvb"] {
  /* One white card – the edge is a shadow, not a border */
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  min-width: 0;
  container-type: inline-size;
  overflow: hidden;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="cvb"] *, [data-ui="cvb"] *::before, [data-ui="cvb"] *::after { box-sizing: border-box; }
:where([data-ui="cvb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="cvb"]) p { margin: 0; }
[data-ui="cvb"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="cvb"] svg { display: block; flex: none; }
.ui-cvb__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cvb__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The thread ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cvb__thread { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-cvb__thread { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-2); }
.ui-cvb__row { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-cvb__row--user { justify-items: end; }
.ui-cvb__row--user[data-editing] { justify-items: stretch; }
/* Your messages: the chat bubble */
:where([data-look="standard"], [data-look="standard"] *).ui-cvb__bubble { max-width: 82%; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-2xl); background: var(--tc-fill-default); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); overflow-wrap: anywhere; animation: ui-cvb-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-cvb__bubble { max-width: 82%; padding: var(--tc-space-1-5) var(--tc-space-3); border-radius: var(--tc-radius-xl); background: var(--tc-fill-default); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-strong); overflow-wrap: anywhere; animation: ui-cvb-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-cvb__bubble > p + p, .ui-cvb__text > p + p { margin-top: var(--tc-space-2); }
/* Replies: plain text on the card */
:where([data-look="standard"], [data-look="standard"] *).ui-cvb__text { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); overflow-wrap: anywhere; animation: ui-cvb-in var(--tc-duration-slower) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-cvb__text { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); overflow-wrap: anywhere; animation: ui-cvb-in var(--tc-duration-slower) var(--tc-ease-standard) both; }
/* The row under a message: Edit and the switcher under yours, the switcher and the actions under a reply */
.ui-cvb__foot { display: flex; align-items: center; gap: var(--tc-space-0-5); min-height: 28px; }
.ui-cvb__row--reply .ui-cvb__foot { margin-left: calc(-1 * var(--tc-space-1-5)); }
.ui-cvb__row--user .ui-cvb__foot { margin-right: calc(-1 * var(--tc-space-1)); }
[data-ui="cvb"] .ui-cvb__actions { flex: 1 1 0; min-width: 0; }
/* Edit: quiet until the message is hovered or something in it is focused, like the message-actions bar */
:where([data-look="standard"], [data-look="standard"] *).ui-cvb__edit { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cvb__edit:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cvb__edit { display: grid; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cvb__edit:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
@media (hover: hover) {
  .ui-cvb__row--user:not(:hover, :focus-within) .ui-cvb__edit { opacity: 0; }
}
:where([data-look="standard"], [data-look="standard"] *).ui-cvb__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cvb__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cvb__glyph[data-solid] { fill: currentColor; stroke: none; }
/* ----- The switcher: message-actions' version switcher ----- */
.ui-cvb__versions { display: inline-flex; flex: none; align-items: center; animation: ui-cvb-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-cvb__step { display: grid; flex: none; place-items: center; width: 24px; height: 30px; border-radius: var(--tc-control-radius-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cvb__step .ui-cvb__glyph { width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cvb__step:hover:not(:disabled) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cvb__step { display: grid; flex: none; place-items: center; width: 24px; height: 28px; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cvb__step[data-dir="prev"] .ui-cvb__glyph { transform: scaleX(-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-cvb__step:hover:not(:disabled) { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-cvb__step:disabled { cursor: default; color: var(--tc-text-disabled); }
.ui-cvb__count { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); padding: 0 var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-cvb__count-now { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); animation: ui-cvb-roll var(--tc-duration-slow) var(--tc-ease-move) both; }
/* ----- Editing in place: the field pattern, Cancel as ghost text and Send as the dark chip ----- */
.ui-cvb__editor { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-2); border-radius: var(--tc-radius-xl); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); animation: ui-cvb-in var(--tc-duration-base) var(--tc-ease-standard) both; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cvb__editor:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-cvb__input { display: block; width: 100%; min-height: 20px; margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); caret-color: var(--tc-accent); resize: none; overflow: hidden; outline: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cvb__input { font-size: var(--tc-font-size-md); color: var(--tc-text-strong); }
.ui-cvb__editor-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-1-5); }
.ui-cvb__note { flex: 1 1 180px; min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* Cancel: Button's ghost, small; Save: the primary */
.ui-cvb__btn { display: inline-flex; flex: none; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); line-height: var(--tc-line-height-normal); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cvb__btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-cvb__btn--main, .ui-cvb__btn--main:hover { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-cvb__btn--main:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-cvb__btn:disabled { cursor: default; opacity: 0.32; }
/* ----- A new branch waiting for its reply ----- */
.ui-cvb__pending { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 24px; font-size: var(--tc-font-size-md); color: var(--tc-text-muted); animation: ui-cvb-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-cvb__pending--failed { color: var(--tc-status-danger-fg); }
.ui-cvb__dots { display: inline-flex; gap: var(--tc-space-1); }
.ui-cvb__dots i { display: block; width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: ui-cvb-dot var(--tc-duration-reveal-slow) var(--tc-ease-in-out) infinite; }
.ui-cvb__dots i:nth-child(2) { animation-delay: var(--tc-duration-fast); }
.ui-cvb__dots i:nth-child(3) { animation-delay: var(--tc-duration-slow); }
[data-ui="cvb"][data-offscreen] .ui-cvb__dots i { animation-play-state: paused; }
.ui-cvb__empty { padding: var(--tc-space-6) 0; font-size: var(--tc-font-size-md); text-align: center; color: var(--tc-text-muted); }
/* ----- The caption: on the tray (Standard), the card's last row (Clean) ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cvb__caption { display: flex; align-items: center; min-height: 34px; padding: var(--tc-space-1) var(--tc-space-3) 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cvb__caption { display: flex; align-items: center; min-height: 40px; padding: 0 var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-cvb__caption-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; animation: ui-cvb-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
@keyframes ui-cvb-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-cvb-roll { from { opacity: 0; transform: translateY(40%); } }
@keyframes ui-cvb-dot { 0%, 100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-2px); } }
/* Narrow: bubbles take more of the width */
@container (max-width: 360px) {
  .ui-cvb__bubble { max-width: 92%; }
  :where([data-look="standard"], [data-look="standard"] *).ui-cvb__thread,
  :where([data-look="clean"], [data-look="clean"] *).ui-cvb__thread { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
}
@media (pointer: coarse) {
  .ui-cvb__edit { width: 36px; height: 36px; }
  .ui-cvb__step { width: 32px; height: 36px; }
  .ui-cvb__btn { height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cvb"] *, [data-ui="cvb"] *::before, [data-ui="cvb"] *::after { animation: none !important; transition: none !important; }
  .ui-cvb__dots i { opacity: 0.6; }
}
`;
}

if (!customElements.get("tc-conversation-branches")) customElements.define("tc-conversation-branches", TcConversationBranches);

declare global {
  interface HTMLElementTagNameMap {
    "tc-conversation-branches": TcConversationBranches;
  }
}

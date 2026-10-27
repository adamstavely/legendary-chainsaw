import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { ToolbarController } from "./internal/controllers";
import { PopoverController } from "./internal/popover";
import { segments, SelectionController, trimRange, type TextSelection } from "./internal/selection";
import { SelectionToolbarController } from "./internal/selection-toolbar";
import { diffWords } from "./inline-diff";

/*
 * <tc-response-selection> – act on part of a model's answer. Select a passage with the pointer, or with the keyboard
 * in the text's caret mode, and a small toolbar offers Reply, Ask why and Edit:
 *   · Reply quotes the passage (tc-quote). Quotes collect as chips under the answer – each one also marked in the
 *     text – until "Reply with N quotes" hands them to the app (tc-reply), which puts them in its composer
 *   · Ask why fires tc-ask-why; the app answers in its own conversation
 *   · Edit opens a small menu – Shorter, Simpler, More formal, or "Your own words…" with a field – and fires a
 *     cancelable tc-edit-request ({ passage, start, end, instruction, preset, signal }). While the app works, the
 *     passage shimmers with "Rewriting…" and Cancel (which aborts the signal). The app answers by setting `edit`
 *     ({ start, end, replacement }, or { start, end, error } – shown with Retry). The edit shows inline as a word diff
 *     (inline-diff's diffWords) with Accept and Reject; Accept fires a cancelable tc-text-change and, unless prevented,
 *     changes `text` (quotes after the passage move with it; quotes inside it are dropped)
 * The component never calls a model.
 *
 *   <tc-response-selection .text=${answer} @tc-edit-request=${ask}></tc-response-selection>
 *
 * The answer is the `text` property – plain text, paragraphs separated by blank lines, shown as written – not slotted,
 * and not rendered through tc-ai-answer: ai-answer streams words straight into its own DOM and wraps them in its own
 * card, while offsets here must index one exact string. Put this element where the finished answer is shown (inside
 * an ai-answer-like bubble of your own, or a chat transcript).
 *
 * Keyboard (as tc-text-annotator). The text is one tab stop in caret mode (internal/selection.ts): ← → a character,
 * Ctrl/Alt + ← → a word, ↑ ↓ a line, Home / End, Shift to extend, Ctrl/⌘ + A all. With a selection, Tab moves into the
 * toolbar (← → Home End between its buttons, Shift + Tab or Esc back to the text). Edit opens its menu (↑ ↓ Home End,
 * Enter; Esc back to Edit). A pending request's Cancel and an edit's Accept / Reject are the next tab stops after the
 * text; Esc in the text cancels a pending request. The quote chips are a toolbar (← → between their Remove buttons),
 * followed by Clear and "Reply with N quotes". Screen readers hear "Quoted:" before each quoted passage, "removed:" /
 * "added:" inside a diff, and every action in a polite status region.
 *
 * Neither look adds a card: the text sits on whatever surface holds it. Standard sets the text a step larger, with
 * raised quote chips and a filled Reply button; Clean keeps the text at body size, with hairline chips and thinner icons.
 */

/** A passage collected for a reply – UTF-16 offsets into `text`, and the passage itself */
export type ResponseQuote = { id: string; start: number; end: number; text: string };
/** The app's answer to an edit request: the new wording for [start, end) of `text`, or why it couldn't */
export type ResponseEdit = { start: number; end: number; replacement?: string; error?: string };
/** An edit preset in the menu */
export type ResponseEditPreset = { id: string; label: string; instruction: string };
/** The toolbar's actions */
export type ResponseAction = "reply" | "why" | "edit";

/** tc-quote: Reply was chosen on a passage */
export type ResponseQuoteDetail = { passage: string; start: number; end: number };
/** tc-quotes-change: the collected quotes changed */
export type ResponseQuotesChange = { quotes: ResponseQuote[]; change: { type: "add" | "remove" | "clear" | "remap"; quote?: ResponseQuote } };
/** tc-reply: "Reply with N quotes" was pressed */
export type ResponseReplyDetail = { quotes: ResponseQuote[] };
/** tc-ask-why: Ask why was chosen on a passage */
export type ResponseAskDetail = { passage: string; start: number; end: number };
/** tc-edit-request: an edit was asked for; abort `signal` is aborted when the person cancels or asks again */
export type ResponseEditRequest = { passage: string; start: number; end: number; instruction: string; preset: string; signal: AbortSignal };
/** tc-edit-reject: the suggested edit was rejected or dismissed */
export type ResponseEditReject = { edit: ResponseEdit };
/** tc-text-change: an edit was accepted */
export type ResponseTextChange = { text: string; previous: string; start: number; end: number; replacement: string };

export const RESPONSE_EDIT_PRESETS: ResponseEditPreset[] = [
  { id: "shorter", label: "Shorter", instruction: "Make this shorter" },
  { id: "simpler", label: "Simpler", instruction: "Make this simpler" },
  { id: "formal", label: "More formal", instruction: "Make this more formal" },
];
const ALL_ACTIONS: ResponseAction[] = ["reply", "why", "edit"];

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const shorten = (t: string, n = 48) => {
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
};

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult) => html`<svg class="ui-rsel__glyph" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const replyIcon = glyph(svg`<path d="M9 17 4 12l5-5"></path><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>`);
const whyIcon = glyph(svg`<circle cx="12" cy="12" r="9"></circle><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path>`);
const editIcon = glyph(svg`<path d="M4 20h4L19 9l-4-4L4 16v4z"></path><path d="M13.5 6.5l4 4"></path>`);
const chevronIcon = glyph(svg`<path d="m6 9 6 6 6-6"></path>`);
const xIcon = glyph(svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const checkIcon = glyph(svg`<path d="M20 6 9 17l-5-5"></path>`);
const sendIcon = glyph(svg`<path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path>`);

let instances = 0;

/**
 * Select part of a model's answer and act on it: reply quoting it, ask why, or request an edit that comes back as a
 * word diff to accept or reject.
 * @tag tc-response-selection
 * @fires tc-quote - Reply was chosen on a passage ({ passage, start, end }: ResponseQuoteDetail); cancelable – prevent it to take the quote yourself, and it isn't collected
 * @fires tc-quotes-change - The collected quotes changed – added, removed, cleared or moved by an accepted edit ({ quotes, change }: ResponseQuotesChange); cancelable – prevent it to control `quotes`
 * @fires tc-reply - "Reply with N quotes" was pressed ({ quotes }: ResponseReplyDetail); cancelable – not prevented, the quotes are cleared
 * @fires tc-ask-why - Ask why was chosen on a passage ({ passage, start, end }: ResponseAskDetail)
 * @fires tc-edit-request - An edit was asked for ({ passage, start, end, instruction, preset, signal }: ResponseEditRequest); cancelable – prevented, nothing waits for an answer. Answer by setting `edit`
 * @fires tc-edit-reject - The suggested edit was rejected, or its error dismissed ({ edit }: ResponseEditReject); cancelable – not prevented, `edit` is cleared
 * @fires tc-text-change - A suggested edit was accepted ({ text, previous, start, end, replacement }: ResponseTextChange); cancelable – prevent it to control `text`
 */
export class TcResponseSelection extends TcElement {
  static override ui = "rsel";

  /** The answer: plain text, paragraphs separated by blank lines. Offsets index into it */
  @property() accessor text = "";
  /** The passages collected for a reply. Changed by the user unless a tc-quotes-change listener calls preventDefault() */
  @property({ attribute: false }) accessor quotes: ResponseQuote[] = [];
  /** The app's answer to an edit request – a replacement or an error for [start, end) – shown inline until accepted or rejected */
  @property({ attribute: false }) accessor edit: ResponseEdit | null = null;
  /** The toolbar's actions, in order */
  @property({ attribute: false }) accessor actions: ResponseAction[] = ALL_ACTIONS;
  /** The edit menu's presets, before "Your own words…" */
  @property({ attribute: false }) accessor presets: ResponseEditPreset[] = RESPONSE_EDIT_PRESETS;
  /** The text's accessible name */
  @property({ attribute: "text-label" }) accessor textLabel = "Answer";
  /** The label of the action that hands the quotes to the app; {n} is the count */
  @property({ attribute: "reply-label" }) accessor replyLabel = "Reply with {n}";

  /** @internal The trimmed selection the toolbar acts on */
  @state() accessor picked: { start: number; end: number } | null = null;
  /** @internal The edit menu: closed, the presets, or the free-text field */
  @state() accessor menu: "" | "presets" | "own" = "";
  /** @internal The words typed in "Your own words…" */
  @state() accessor ownWords = "";
  /** @internal The request the app is working on */
  @state() accessor pending: { start: number; end: number; instruction: string; preset: string } | null = null;
  /** @internal The quote whose chip is hovered or focused – its mark lights up */
  @state() accessor hotId = "";
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-rsel${++instances}`;
  private next = 0;
  private abort: AbortController | null = null;
  /** The last request, for Retry */
  private last: { instruction: string; preset: string } | null = null;
  /** The range the open toolbar and menu act on */
  private target: { start: number; end: number } | null = null;
  private focusAfter: (() => HTMLElement | null | undefined) | null = null;
  /** An accepted edit waiting for `text` to become its result */
  private accepted: { text: string; start: number; end: number; replacement: string } | null = null;
  /** Where the caret goes after the next update */
  private caretTo: number | null = null;

  private readonly sel = new SelectionController(this, {
    root: () => this.textRoot,
    caret: true,
    caretEl: () => this.querySelector<HTMLElement>(".ui-rsel__caret"),
    onChange: (s, how) => this.onSelection(s, how.cause, how.final),
  });
  /** Above the passage's first line, centred over the whole passage */
  private readonly bar = new SelectionToolbarController(this, {
    sel: this.sel,
    root: () => this.textRoot,
    range: () => this.target ?? this.picked,
    popover: () => this.querySelector<HTMLElement>(".ui-rsel__pop"),
    items: () => [...this.querySelectorAll<HTMLElement>(".ui-rsel__pop .ui-rsel__tool")],
    inside: () => [this.menuEl],
    onClose: () => this.menuPop.close("api"),
  });
  private readonly menuPop = new PopoverController(this, {
    popover: () => this.menuEl,
    anchor: () => this.querySelector(".ui-rsel__tool[data-kind='edit']"),
    side: "bottom",
    align: "start",
    gap: 6,
    returnFocus: () => this.querySelector<HTMLElement>(".ui-rsel__tool[data-kind='edit']"),
    inside: () => [this.querySelector(".ui-rsel__pop")],
    onClose: () => {
      this.menu = "";
      this.ownWords = "";
    },
  });
  private readonly chips = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-rsel__chip-x")] });

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.abort?.abort();
    this.abort = null;
  }

  private get textRoot() {
    return this.querySelector<HTMLElement>(".ui-rsel__text");
  }
  private get menuEl() {
    return this.querySelector<HTMLElement>(".ui-rsel__menu");
  }

  /* ---------- Reading the properties ---------- */

  private valid<R extends { start: number; end: number }>(r: R | null | undefined): r is R {
    return !!r && Number.isInteger(r.start) && Number.isInteger(r.end) && r.start >= 0 && r.end > r.start && r.end <= this.text.length;
  }
  /** @internal The edit, when it points at real text and says something */
  get shownEdit(): ResponseEdit | null {
    const e = this.edit;
    return this.valid(e) && (typeof e.replacement === "string" || !!e.error) ? e : null;
  }
  private passage(r: { start: number; end: number }) {
    return this.text.slice(r.start, r.end);
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private say(text: string) {
    this.said = this.said === text ? `${text} ` : text;
  }

  /* ---------- Quotes ---------- */

  private commitQuotes(quotes: ResponseQuote[], type: ResponseQuotesChange["change"]["type"], quote?: ResponseQuote) {
    if (!this.emit<ResponseQuotesChange>("tc-quotes-change", { quotes, change: { type, ...(quote ? { quote } : {}) } }, { cancelable: true })) return false;
    this.quotes = quotes;
    return true;
  }

  private newId() {
    let id = "";
    do id = `${this.uid}-q${++this.next}`;
    while (this.quotes.some((q) => q.id === id));
    return id;
  }

  private reply() {
    const r = this.target;
    if (!r) return;
    const passage = this.passage(r);
    this.finish(r.end);
    if (this.quotes.some((q) => q.start === r.start && q.end === r.end)) {
      this.say(`Already quoted: “${shorten(passage)}”`);
      return;
    }
    if (!this.emit<ResponseQuoteDetail>("tc-quote", { passage, start: r.start, end: r.end }, { cancelable: true })) {
      this.say(`Quoted “${shorten(passage)}”`);
      return;
    }
    const quote: ResponseQuote = { id: this.newId(), start: r.start, end: r.end, text: passage };
    if (!this.commitQuotes([...this.quotes, quote], "add", quote)) return;
    const n = this.quotes.length;
    this.say(`Quoted “${shorten(passage)}”. ${plural(n, "quote")} ready to reply with`);
  }

  private removeQuote(q: ResponseQuote) {
    const at = this.quotes.findIndex((x) => x.id === q.id);
    if (!this.commitQuotes(this.quotes.filter((x) => x.id !== q.id), "remove", q)) return;
    const left = this.quotes;
    const neighbour = left[at] ?? left[at - 1];
    this.focusAfter = () => (neighbour ? this.querySelector<HTMLElement>(`.ui-rsel__chip[data-id="${CSS.escape(neighbour.id)}"] .ui-rsel__chip-x`) : this.textRoot);
    this.say(left.length ? `Quote removed. ${plural(left.length, "quote")} left` : "Quote removed");
  }

  private sendQuotes() {
    const quotes = this.quotes;
    if (!quotes.length) return;
    if (!this.emit<ResponseReplyDetail>("tc-reply", { quotes }, { cancelable: true })) return;
    this.commitQuotes([], "clear");
    this.focusAfter = () => this.textRoot;
    this.say(`Replying with ${plural(quotes.length, "quote")}`);
  }

  private clearQuotes() {
    if (!this.commitQuotes([], "clear")) return;
    this.focusAfter = () => this.textRoot;
    this.say("Quotes cleared");
  }

  /* ---------- Ask why ---------- */

  private askWhy() {
    const r = this.target;
    if (!r) return;
    const passage = this.passage(r);
    this.finish(r.end);
    this.emit<ResponseAskDetail>("tc-ask-why", { passage, start: r.start, end: r.end });
    this.say(`Asked why: “${shorten(passage)}”`);
  }

  /* ---------- Edits ---------- */

  private openMenu() {
    if (!this.target) return;
    this.menu = this.menu ? "" : "presets";
    if (this.menu) this.menuPop.show({ focus: true });
    else this.menuPop.close();
  }

  private chooseOwn() {
    this.menu = "own";
    this.ownWords = "";
    this.menuPop.show({ focus: true });
  }

  private requestEdit(instruction: string, preset: string, r = this.target) {
    if (!r || !instruction.trim()) return;
    this.abort?.abort();
    this.abort = null;
    const abort = new AbortController();
    const passage = this.passage(r);
    this.menuPop.close();
    this.finish(r.end);
    if (!this.emit<ResponseEditRequest>("tc-edit-request", { passage, start: r.start, end: r.end, instruction: instruction.trim(), preset, signal: abort.signal }, { cancelable: true })) {
      abort.abort();
      return;
    }
    this.abort = abort;
    this.last = { instruction: instruction.trim(), preset };
    // A new request replaces the edit on show
    this.edit = null;
    this.pending = { start: r.start, end: r.end, instruction: instruction.trim(), preset };
    this.say(`Rewriting “${shorten(passage)}”. Escape cancels`);
  }

  private cancelRequest() {
    if (!this.pending) return;
    const at = this.pending.end;
    this.abort?.abort();
    this.abort = null;
    this.pending = null;
    this.focusAfter = () => this.textRoot;
    this.sel.select(at);
    this.say("Edit request cancelled");
  }

  private retry() {
    const e = this.shownEdit;
    if (!e || !this.last) return;
    this.focusAfter = () => this.textRoot;
    this.requestEdit(this.last.instruction, this.last.preset, { start: e.start, end: e.end });
  }

  private accept() {
    const e = this.shownEdit;
    if (!e || typeof e.replacement !== "string") return;
    const replacement = e.replacement;
    const previous = this.text;
    const text = previous.slice(0, e.start) + replacement + previous.slice(e.end);
    this.accepted = { text, start: e.start, end: e.end, replacement };
    this.focusAfter = () => this.textRoot;
    // Prevented, the app applies `text` itself – what follows an accepted edit happens when it does (willUpdate)
    if (!this.emit<ResponseTextChange>("tc-text-change", { text, previous, start: e.start, end: e.end, replacement }, { cancelable: true })) return;
    this.text = text;
  }

  /** The text became an accepted edit's: the edit is done, quotes move with it, the caret goes after the new words */
  private settleAccepted() {
    const a = this.accepted!;
    this.accepted = null;
    this.edit = null;
    // Quotes after the passage move with it; quotes that overlap it no longer quote the answer
    const delta = a.replacement.length - (a.end - a.start);
    const moved = this.quotes.filter((q) => q.end <= a.start || q.start >= a.end).map((q) => (q.start >= a.end ? { ...q, start: q.start + delta, end: q.end + delta } : q));
    if (moved.length !== this.quotes.length || moved.some((q, i) => q !== this.quotes[i])) this.commitQuotes(moved, "remap");
    this.caretTo = a.start + a.replacement.length;
    this.say("Edit accepted");
  }

  private reject() {
    const e = this.shownEdit;
    if (!e) return;
    if (!this.emit<ResponseEditReject>("tc-edit-reject", { edit: e }, { cancelable: true })) return;
    this.edit = null;
    this.focusAfter = () => this.textRoot;
    this.caretTo = e.end;
    this.say(e.error ? "Dismissed" : "Edit rejected");
  }

  /* ---------- Selection and keys ---------- */

  /** After an action on the selection: the toolbar closes, the caret goes to `at`, focus back in the text */
  private finish(at: number) {
    this.bar.pop.close();
    const root = this.textRoot;
    if (root && this.contains(document.activeElement) && document.activeElement !== root) root.focus({ preventScroll: true });
    this.sel.select(at);
  }

  private onSelection(s: TextSelection | null, cause: string, final: boolean) {
    const r = s && !s.collapsed ? trimRange(this.text, s.start, s.end) : null;
    this.picked = r && r.end > r.start ? r : null;
    this.bar.follow(!!this.picked, final);
    if (!this.picked || !final) return;
    this.target = this.picked;
    if (cause === "keyboard") this.say(`Selected “${shorten(this.passage(this.picked))}”. Tab for ${this.actionWords()}`);
  }

  private actionWords() {
    const names: Record<ResponseAction, string> = { reply: "reply", why: "ask why", edit: "edit" };
    const list = this.actions.filter((a) => names[a]).map((a) => names[a]);
    return list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : (list[0] ?? "actions");
  }

  private onTextKey(e: KeyboardEvent) {
    const root = this.textRoot;
    if (e.target !== root) return;
    // Esc with the toolbar open: the popover closes it and collapses the selection
    if (e.key === "Escape" && this.bar.pop.open) return;
    if (e.key === "Escape" && this.pending && this.sel.collapsed) {
      e.preventDefault();
      this.cancelRequest();
      return;
    }
    this.sel.onKeyDown(e);
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("text") && this.accepted) {
      if (this.text === this.accepted.text) this.settleAccepted();
      else this.accepted = null;
    }
    // The app answered: the request is done
    if (changed.has("edit") && this.edit && this.pending) {
      this.pending = null;
      this.abort = null;
      const e = this.shownEdit;
      if (e) this.say(e.error ? `Couldn't rewrite: ${e.error}. Retry or dismiss` : "Suggested edit ready. Tab to Accept or Reject");
    }
    if (this.pending && !this.valid(this.pending)) this.pending = null;
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    const f = this.focusAfter;
    if (f) {
      this.focusAfter = null;
      f()?.focus({ preventScroll: false });
    }
    if (this.caretTo !== null) {
      const at = this.caretTo;
      this.caretTo = null;
      this.sel.select(at);
    }
  }

  /* ---------- Render ---------- */

  private renderText() {
    type R = { start: number; end: number; kind: "quote" | "pending" | "edit"; id?: string; n?: number };
    const e = this.shownEdit;
    const p = this.pending;
    const ranges: R[] = [];
    if (e) ranges.push({ start: e.start, end: e.end, kind: "edit" });
    if (p) ranges.push({ start: p.start, end: p.end, kind: "pending" });
    this.quotes.forEach((q, i) => this.valid(q) && ranges.push({ start: q.start, end: q.end, kind: "quote", id: q.id, n: i + 1 }));
    const seen = new Set<string>();
    return segments(this.text, ranges).map((seg) => {
      if (!seg.ranges.length) return seg.text;
      // The edit owns its whole range: drawn once, at its first piece
      if (e && seg.ranges.some((r) => r.kind === "edit")) return seg.start === e.start ? this.renderEdit(e) : nothing;
      const pend = seg.ranges.find((r) => r.kind === "pending");
      if (pend) {
        const first = !seen.has("pending");
        seen.add("pending");
        return html`<mark class="ui-rsel__pending">${first ? html`<span class="ui-rsel__sr" data-tc-skip>Being rewritten: </span>` : nothing}${seg.text}</mark>${seg.end === pend.end ? this.renderWorking() : nothing}`;
      }
      const q = seg.ranges[0];
      const first = !seen.has(q.id!);
      seen.add(q.id!);
      return html`<mark class="ui-rsel__quote" data-id=${q.id!} ?data-hot=${seg.ranges.some((r) => r.id === this.hotId)}>${first ? html`<span class="ui-rsel__sr" data-tc-skip>Quoted: </span>` : nothing}${seg.text}</mark>`;
    });
  }

  private renderWorking() {
    return html`<span class="ui-rsel__aside" data-tc-skip
      ><span class="ui-rsel__busy" aria-hidden="true"><span class="ui-rsel__spinner"></span>Rewriting…</span
      ><button type="button" tabindex="0" class="ui-rsel__mini" data-kind="cancel" aria-label="Cancel the edit request" @click=${() => this.cancelRequest()}>Cancel</button></span
    >`;
  }

  private renderEdit(e: ResponseEdit) {
    const original = this.passage(e);
    if (e.error || typeof e.replacement !== "string")
      return html`<span class="ui-rsel__edit" data-state="error"><mark class="ui-rsel__failed">${original}</mark><span class="ui-rsel__aside" data-tc-skip
          ><span class="ui-rsel__err">${e.error || "Couldn't rewrite this"}</span
          ><button type="button" tabindex="0" class="ui-rsel__mini" data-kind="retry" ?disabled=${!this.last} @click=${() => this.retry()}>Retry</button
          ><button type="button" tabindex="0" class="ui-rsel__mini" data-kind="dismiss" @click=${() => this.reject()}>Dismiss</button></span
        ></span>`;
    const diff = diffWords(original, e.replacement);
    return html`<span class="ui-rsel__edit" data-state="ready"
      >${diff.map((d) =>
        d.type === "equal"
          ? d.text
          : html`${d.remove ? html`<del class="ui-rsel__del"><span class="ui-rsel__sr" data-tc-skip>removed: </span>${d.remove}</del>` : nothing}${d.insert
              ? html`<ins class="ui-rsel__ins" data-tc-skip><span class="ui-rsel__sr">added: </span>${d.insert}</ins>`
              : nothing}`,
      )}<span class="ui-rsel__aside" data-tc-skip role="group" aria-label="Suggested edit"
        ><button type="button" tabindex="0" class="ui-rsel__mini" data-kind="accept" @click=${() => this.accept()}>${checkIcon}<span>Accept</span></button
        ><button type="button" tabindex="0" class="ui-rsel__mini" data-kind="reject" @click=${() => this.reject()}>${xIcon}<span>Reject</span></button></span
      ></span
    >`;
  }

  private renderToolbar() {
    if (!this.bar.pop.open) return nothing;
    const tool = (a: ResponseAction) =>
      a === "reply"
        ? html`<button type="button" class="ui-rsel__tool" data-kind="reply" @click=${() => this.reply()}>${replyIcon}<span>Reply</span></button>`
        : a === "why"
          ? html`<button type="button" class="ui-rsel__tool" data-kind="why" @click=${() => this.askWhy()}>${whyIcon}<span>Ask why</span></button>`
          : a === "edit"
            ? html`<button type="button" class="ui-rsel__tool" data-kind="edit" aria-haspopup="menu" aria-expanded=${this.menu ? "true" : "false"} @click=${() => this.openMenu()}>
                ${editIcon}<span>Edit</span>${chevronIcon}
              </button>`
            : nothing;
    return html`<div class="tc-pop ui-rsel__pop" role="toolbar" aria-label="Selection">
      ${this.actions.map(tool)}
    </div>`;
  }

  private renderMenu() {
    if (!this.menu || !this.menuPop.open) return nothing;
    if (this.menu === "own") {
      const send = (ev: Event) => {
        ev.preventDefault();
        if (this.ownWords.trim()) this.requestEdit(this.ownWords, "custom");
      };
      return html`<form class="tc-pop ui-rsel__menu ui-rsel__own" role="dialog" aria-label="Edit in your own words" @submit=${send}>
        <input
          class="ui-rsel__field"
          type="text"
          aria-label="How should it change?"
          placeholder="e.g. Add an example"
          autocomplete="off"
          .value=${live(this.ownWords)}
          @input=${(ev: Event) => (this.ownWords = (ev.target as HTMLInputElement).value)}
        />
        <button type="submit" class="ui-rsel__send" aria-label="Ask for this edit" aria-disabled=${this.ownWords.trim() ? "false" : "true"}>${sendIcon}</button>
      </form>`;
    }
    const items = () => [...(this.menuEl?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? [])];
    const onKey = (e: KeyboardEvent) => {
      const list = items();
      const at = list.indexOf(e.target as HTMLElement);
      const go = (i: number) => list[(i + list.length) % list.length]?.focus();
      const keys: Record<string, () => void> = { ArrowDown: () => go(at + 1), ArrowUp: () => go(at - 1), Home: () => go(0), End: () => go(list.length - 1), Tab: () => this.menuPop.close() };
      if (!keys[e.key] || e.altKey || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      keys[e.key]();
    };
    return html`<div class="tc-pop ui-rsel__menu" role="menu" aria-label="Request an edit" @keydown=${onKey} @mousedown=${(e: Event) => e.preventDefault()}>
      ${this.presets.map((p) => html`<button type="button" role="menuitem" class="ui-rsel__item" tabindex="-1" data-preset=${p.id} @click=${() => this.requestEdit(p.instruction, p.id)}>${p.label}</button>`)}
      <span class="ui-rsel__sep" role="separator"></span>
      <button type="button" role="menuitem" class="ui-rsel__item" tabindex="-1" data-preset="custom" @click=${() => this.chooseOwn()}>Your own words…</button>
    </div>`;
  }

  private renderQuotes() {
    const list = this.quotes.filter((q) => this.valid(q));
    if (!list.length) return nothing;
    const label = this.replyLabel.replace("{n}", plural(list.length, "quote"));
    return html`<div class="ui-rsel__tray" role="group" aria-labelledby=${`${this.uid}-qs`}>
      <span class="ui-rsel__tray-label" id=${`${this.uid}-qs`}>Quoting</span>
      <div class="ui-rsel__chips" role="toolbar" aria-label="Quoted passages" @keydown=${this.chips.onKeyDown} @focusin=${this.chips.onFocusIn}>
        ${repeat(
          list,
          (q) => q.id,
          (q) => html`<span class="ui-rsel__chip" data-id=${q.id} @mouseenter=${() => (this.hotId = q.id)} @mouseleave=${() => (this.hotId = "")} @focusin=${() => (this.hotId = q.id)} @focusout=${() => (this.hotId = "")}>
            <q class="ui-rsel__chip-text">${shorten(q.text, 40)}</q>
            <button type="button" class="ui-rsel__chip-x" aria-label=${`Remove quote “${shorten(q.text)}”`} title="Remove" @click=${() => this.removeQuote(q)}>${xIcon}</button>
          </span>`,
        )}
      </div>
      <div class="ui-rsel__tray-acts">
        <button type="button" tabindex="0" class="ui-rsel__btn" data-kind="clear" @click=${() => this.clearQuotes()}>Clear</button>
        <button type="button" tabindex="0" class="ui-rsel__btn" data-kind="reply" @click=${() => this.sendQuotes()}>${replyIcon}<span>${label}</span></button>
      </div>
    </div>`;
  }

  protected override render() {
    return html`
      <div class="ui-rsel__doc">
        <div class="ui-rsel__text" role="document" tabindex="0" aria-label=${this.textLabel} aria-describedby=${`${this.uid}-hint`} aria-busy=${this.pending ? "true" : "false"} @keydown=${this.onTextKey}>${this.renderText()}</div>
        <span class="ui-rsel__caret" aria-hidden="true" hidden></span>
        ${this.renderToolbar()} ${this.renderMenu()}
      </div>
      ${this.renderQuotes()}
      <p class="ui-rsel__hint" id=${`${this.uid}-hint`} hidden>Select text with Shift and the arrow keys, then press Tab to ${this.actionWords()}.</p>
      <span class="ui-rsel__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="rsel"] {
  position: relative;
  box-sizing: border-box;
  display: grid;
  gap: var(--tc-space-3);
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="rsel"] *, [data-ui="rsel"] *::before, [data-ui="rsel"] *::after { box-sizing: border-box; }
:where([data-ui="rsel"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="rsel"]) :is(p, ul, li, q) { margin: 0; padding: 0; }
:where([data-ui="rsel"]) ul { list-style: none; }
[data-ui="rsel"] :is(button, [tabindex], input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rsel__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; user-select: none; -webkit-user-select: none; }
.ui-rsel__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-rsel__glyph { stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-rsel__glyph { stroke-width: 1.4; }
/* ----- The answer ----- */
.ui-rsel__doc { position: relative; min-width: 0; }
.ui-rsel__text { color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-loose); white-space: pre-wrap; overflow-wrap: break-word; cursor: text; border-radius: var(--tc-radius-xs); }
:where([data-look="clean"], [data-look="clean"] *).ui-rsel__text { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); }
.ui-rsel__text:focus-visible { outline-offset: var(--tc-space-1); }
.ui-rsel__text::selection, .ui-rsel__text ::selection { background: var(--tc-accent-highlight); }
.ui-rsel__caret { position: absolute; top: 0; left: -1px; width: 2px; border-radius: var(--tc-radius-2xs); background: var(--tc-accent); pointer-events: none; animation: ui-rsel-blink var(--tc-duration-shimmer) steps(1) infinite; }
.ui-rsel__caret[hidden] { display: none; }
@keyframes ui-rsel-blink { 50% { opacity: 0; } }
/* Quoted passages: a blue highlight, a firmer underline while their chip is hot */
.ui-rsel__quote { padding: var(--tc-space-0-5) 0; border-radius: var(--tc-radius-2xs); background: var(--tc-highlight-blue-bg); color: var(--tc-highlight-blue-fg); box-decoration-break: clone; -webkit-box-decoration-break: clone; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rsel__quote[data-hot] { box-shadow: inset 0 -2px 0 var(--tc-highlight-blue-fg); }
/* A passage being rewritten: a soft sweep while the app works */
.ui-rsel__pending { padding: var(--tc-space-0-5) 0; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-hover); color: var(--tc-text-secondary); box-decoration-break: clone; -webkit-box-decoration-break: clone; animation: ui-rsel-pulse var(--tc-duration-shimmer) var(--tc-ease-standard) infinite alternate; }
@keyframes ui-rsel-pulse { to { background-color: var(--tc-accent-highlight); } }
.ui-rsel__failed { padding: var(--tc-space-0-5) 0; border-radius: var(--tc-radius-2xs); background: none; color: inherit; text-decoration: underline wavy var(--tc-status-danger-fg); text-decoration-thickness: 1px; text-underline-offset: 3px; }
/* The suggested edit, as inline-diff draws it: removed words struck on red, new words underlined on green */
.ui-rsel__del, .ui-rsel__ins { padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-xs); box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.ui-rsel__del { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); text-decoration: line-through; text-decoration-thickness: 1px; }
.ui-rsel__ins { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; user-select: none; -webkit-user-select: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-rsel__del { color: var(--tc-text-muted); text-decoration-color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-rsel__ins { color: var(--tc-text-primary); text-decoration: none; }
.ui-rsel__del + .ui-rsel__ins { margin-left: var(--tc-space-1); }
/* What sits after a passage in the text: Rewriting… / Cancel, Accept / Reject, Retry / Dismiss */
.ui-rsel__aside { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); margin-left: var(--tc-space-1-5); vertical-align: baseline; white-space: nowrap; user-select: none; -webkit-user-select: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-rsel__busy { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); margin-right: var(--tc-space-1); color: var(--tc-text-muted); }
.ui-rsel__spinner { width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--tc-fill-strong); border-top: 1.5px solid var(--tc-text-muted); animation: ui-rsel-spin var(--tc-duration-shimmer) linear infinite; }
@keyframes ui-rsel-spin { to { transform: rotate(360deg); } }
.ui-rsel__err { margin-right: var(--tc-space-1); color: var(--tc-status-danger-fg); white-space: normal; }
.ui-rsel__mini { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rsel__mini:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-rsel__mini[disabled] { opacity: 0.5; cursor: default; }
.ui-rsel__mini .ui-rsel__glyph { width: 12px; height: 12px; }
.ui-rsel__mini[data-kind="accept"] { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-rsel__mini[data-kind="accept"]:hover { background: var(--tc-action-primary-bg-hover); color: var(--tc-action-primary-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rsel__mini[data-kind="reject"] { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
/* ----- The quotes ----- */
.ui-rsel__tray { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); min-width: 0; padding-top: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); animation: ui-rsel-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-rsel__tray-label { color: var(--tc-text-muted); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); }
.ui-rsel__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); min-width: 0; }
.ui-rsel__chip { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); max-width: 100%; min-width: 0; height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-0-5) 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-highlight-blue-bg); color: var(--tc-highlight-blue-fg); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *).ui-rsel__chip { box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-rsel__chip { background: none; box-shadow: inset 0 0 0 1px var(--tc-border-default); color: var(--tc-text-secondary); }
.ui-rsel__chip-text { overflow: hidden; min-width: 0; quotes: "“" "”"; white-space: nowrap; text-overflow: ellipsis; }
.ui-rsel__chip-x { display: grid; flex: none; place-items: center; width: 20px; height: 20px; border-radius: 50%; color: inherit; opacity: 0.75; }
.ui-rsel__chip-x:hover { background: var(--tc-fill-hover); opacity: 1; }
.ui-rsel__chip-x .ui-rsel__glyph { width: 12px; height: 12px; }
.ui-rsel__tray-acts { display: flex; gap: var(--tc-space-1-5); margin-left: auto; }
.ui-rsel__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rsel__btn[data-kind="reply"] { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-rsel__btn[data-kind="reply"]:hover { background: var(--tc-action-primary-bg-hover); }
.ui-rsel__btn[data-kind="clear"] { color: var(--tc-action-ghost-fg); }
.ui-rsel__btn[data-kind="clear"]:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* ----- The selection toolbar and the edit menu (internal/popover.ts places them) ----- */
.ui-rsel__pop { display: flex; align-items: center; gap: var(--tc-space-0-5); }
.ui-rsel__tool { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-secondary); font-family: var(--tc-font-sans); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rsel__tool[data-kind="edit"] { padding-right: var(--tc-space-1-5); }
.ui-rsel__tool:hover, .ui-rsel__tool[aria-expanded="true"] { background: var(--tc-menu-item-hover); color: var(--tc-text-primary); }
[data-ui="rsel"] .ui-rsel__tool:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-rsel__menu { display: grid; min-width: 168px; }
.ui-rsel__item { display: flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-primary); font-family: var(--tc-font-sans); font-size: var(--tc-control-font-size); text-align: left; white-space: nowrap; cursor: pointer; }
/* A menu shows where focus is with the item's fill, as command menus do */
.ui-rsel__item:hover, .ui-rsel__item:focus, [data-ui="rsel"] .ui-rsel__item:focus-visible { background: var(--tc-menu-item-hover); outline: none; }
.ui-rsel__sep { display: block; height: 1px; margin: var(--tc-space-1) var(--tc-space-1-5); background: var(--tc-divider); }
.ui-rsel__own { display: flex; align-items: center; gap: var(--tc-space-1); width: 280px; }
.ui-rsel__field { flex: 1; min-width: 0; height: var(--tc-field-h-sm); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font-family: var(--tc-font-sans); font-size: var(--tc-field-font-size); }
.ui-rsel__field::placeholder { color: var(--tc-text-placeholder); }
.ui-rsel__field:focus { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-rsel__send { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); cursor: pointer; }
.ui-rsel__send[aria-disabled="true"] { opacity: 0.5; cursor: default; }
.ui-rsel__send:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@keyframes ui-rsel-in { from { opacity: 0; transform: translateY(2px); } }
@media (forced-colors: active) {
  .ui-rsel__quote, .ui-rsel__pending { forced-color-adjust: none; background: Mark; color: MarkText; }
  .ui-rsel__quote[data-hot] { outline: 2px solid Highlight; }
  .ui-rsel__chip { border: 1px solid CanvasText; }
  .ui-rsel__ins, .ui-rsel__del { border: 1px solid CanvasText; }
  .ui-rsel__caret { background: CanvasText; }
  [data-ui="rsel"] .ui-rsel__item:is(:focus, :focus-visible) { outline: 2px solid Highlight; outline-offset: -2px; }
}
@media (pointer: coarse) {
  .ui-rsel__tool, .ui-rsel__item, .ui-rsel__btn, .ui-rsel__send { height: var(--tc-control-h-md); min-width: var(--tc-control-h-md); }
  .ui-rsel__chip-x { width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rsel"] *, [data-ui="rsel"] *::before, [data-ui="rsel"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-response-selection")) customElements.define("tc-response-selection", TcResponseSelection);

declare global {
  interface HTMLElementTagNameMap {
    "tc-response-selection": TcResponseSelection;
  }
}

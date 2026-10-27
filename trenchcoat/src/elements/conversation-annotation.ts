import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, ToolbarController } from "./internal/controllers";
import { diffWords } from "./inline-diff";
import type { RubricLevel } from "./feedback-rubric";

/*
 * <tc-conversation-annotation> – review a conversation the way an annotator does: select a span inside a message and
 * label it, redact what mustn't leave, rate each answer and write the answer it should have been – then send the
 * reviewed example to a dataset.
 *   · the transcript: one turn per message; labels show as marks in the text, each followed by its label's name (never
 *     colour alone); overlapping labels split the text at every boundary; a redacted span is a bar – its text isn't on
 *     the page at all
 *   · the legend: the label set as a toolbar – shortcut key, name and count – plus Redact; pressing one applies it to
 *     the selection
 *   · per-turn ratings on a small scale (feedback-rubric's RubricLevel, three levels by default), for `rateRoles`
 *   · "Correct the answer" on `correctRoles` turns: an editor seeded with the answer; the saved correction shows as a
 *     word diff (Inline Diff's diffWords)
 *   · the annotation list: every span, a jump to it and a remove
 *   · "Send to dataset" fires tc-send with the value and an export copy whose redacted text is blanked out
 *
 *   <tc-conversation-annotation .messages=${messages} .value=${{ spans: [], ratings: {}, corrections: {} }}></tc-conversation-annotation>
 *
 * Keyboard: the turns are a feed with one tab stop. On a turn ↑ ↓ (Page Up / Page Down) move between turns, Home / End
 * jump to the first and last; ← → move a caret a word at a time, Shift + ← → extend the selection a word, Shift + Home /
 * End to the start or end of the message, Ctrl/⌘ + A selects the message; 1–9 apply that label, R redacts, Esc clears.
 * In the list, Delete removes an annotation. The value is one object – every change fires a cancelable
 * tc-value-change ({ value }); preventDefault() keeps control. With `name` it's a form control (the value as JSON).
 * Standard is a gray tray with the transcript on a white card, user turns on a soft fill; Clean is one white card with
 * hairline dividers between turns, caption-style role labels and thinner icons.
 */

export type AnnotationMessage = {
  id: string;
  /** "user", "assistant", "system", "tool" – or your own; shown through `roleLabels` */
  role: string;
  /** Who wrote it, shown after the role – "Dana · Support" */
  author?: string;
  /** The exact text; span offsets index into it */
  text: string;
};
/** One of the tone token families: --tc-tone-<tone>-bg / -fg / -solid */
export type AnnotationTone = "teal" | "violet" | "amber" | "pink" | "rose";
export type AnnotationLabel = {
  id: string;
  /** "Unsupported" – on the legend button and after each mark */
  label: string;
  /** The colour of its marks; defaults by position */
  tone?: AnnotationTone;
  /** What it means, in a line – the legend button's tooltip */
  description?: string;
};
/** A labelled or redacted span. Offsets are UTF-16 indices into the message text */
export type AnnotationSpan = {
  id: string;
  messageId: string;
  start: number;
  end: number;
  /** The text between start and end when it was made – a span whose text changed is flagged */
  quote: string;
  /** The label's id; "" for a redaction */
  label: string;
  /** Redacted: shown as a bar, blanked out in the export */
  redacted?: boolean;
  /** A note the app attached */
  note?: string;
};
export type ConversationAnnotationValue = {
  spans: AnnotationSpan[];
  /** A rating per message id, a level's value */
  ratings: Record<string, number>;
  /** The corrected answer per message id */
  corrections: Record<string, string>;
};
/** What a dataset gets: the messages and every quote and correction with redacted text replaced by █ */
export type AnnotationExport = {
  messages: AnnotationMessage[];
  spans: AnnotationSpan[];
  ratings: Record<string, number>;
  corrections: Record<string, string>;
};
export type ConversationAnnotationValueChange = { value: ConversationAnnotationValue };
export type ConversationAnnotationSend = { value: ConversationAnnotationValue; example: AnnotationExport };

export const ANNOTATION_LABELS: AnnotationLabel[] = [
  { id: "incorrect", label: "Incorrect", tone: "rose", description: "States something that isn't true" },
  { id: "unsupported", label: "Unsupported", tone: "amber", description: "Not backed by anything it was given" },
  { id: "sensitive", label: "Sensitive", tone: "violet", description: "Personal or confidential information" },
  { id: "helpful", label: "Helpful", tone: "teal", description: "A good example of what we want" },
];
export const ANNOTATION_RATING_LEVELS: RubricLevel[] = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Okay" },
  { value: 3, label: "Good" },
];
const TONES: AnnotationTone[] = ["rose", "amber", "violet", "teal", "pink"];
const EMPTY: ConversationAnnotationValue = { spans: [], ratings: {}, corrections: {} };
const ROLE_LABELS: Record<string, string> = { user: "User", assistant: "Assistant", system: "System", tool: "Tool" };
const BLOCK = "█";

/** The span still points at the same text in its message */
export function annotationMatchesSource(span: AnnotationSpan, messages: readonly AnnotationMessage[]) {
  const m = messages.find((x) => x.id === span.messageId);
  return !!m && Number.isInteger(span.start) && Number.isInteger(span.end) && span.start >= 0 && span.end > span.start && span.end <= m.text.length && m.text.slice(span.start, span.end) === span.quote;
}

/** An export copy: redacted spans become █ in the messages, in every quote that overlaps them and in corrections */
export function prepareAnnotationExport(messages: readonly AnnotationMessage[], value: ConversationAnnotationValue): AnnotationExport {
  const redacted = value.spans.filter((s) => s.redacted && annotationMatchesSource(s, messages));
  const out = messages.map((m) => {
    const chars = [...m.text.split("")];
    for (const s of redacted) if (s.messageId === m.id) chars.fill(BLOCK, s.start, s.end);
    return { ...m, text: chars.join("") };
  });
  const secrets = [...new Set(redacted.map((s) => s.quote.trim()).filter(Boolean))];
  const scrub = (text: string) => secrets.reduce((t, q) => t.split(q).join(BLOCK.repeat(q.length)), text);
  return {
    messages: out,
    spans: value.spans.map((s) => ({ ...s, quote: annotationMatchesSource(s, messages) ? (out.find((m) => m.id === s.messageId)?.text.slice(s.start, s.end) ?? s.quote) : scrub(s.quote) })),
    ratings: { ...value.ratings },
    corrections: Object.fromEntries(Object.entries(value.corrections).map(([id, text]) => [id, scrub(text)])),
  };
}

type Selection = { messageId: string; anchor: number; focus: number };
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const words = (t: string) => [...t.matchAll(/\S+/g)].map((m) => [m.index, m.index + m[0].length] as const);
const shorten = (t: string, n = 48) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-cva__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/** A highlighter: marking spans in the text */
const markIcon = svg`<path d="m9 11-6 6v3h9l3-3"></path><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"></path>`;
const closeIcon = glyph(svg`<path d="M7 7l10 10M17 7L7 17"></path>`);
const pencilIcon = glyph(svg`<path d="M4 20h4L19 9l-4-4L4 16v4z"></path><path d="M13.5 6.5l4 4"></path>`);
const checkIcon = glyph(svg`<path d="M5 12.5l4.5 4.5L19 7.5"></path>`);
const alertIcon = glyph(svg`<path d="M12 8v5M12 16.5h.01"></path><circle cx="12" cy="12" r="9"></circle>`);

let instances = 0;

/**
 * A conversation transcript to annotate: label spans, redact, rate turns, correct answers and send the example on.
 * @tag tc-conversation-annotation
 * @fires tc-value-change - A span, rating or correction changed ({ value }: ConversationAnnotationValueChange); cancelable – prevent it to control `value`
 * @fires tc-send - "Send to dataset" was pressed ({ value, example }: ConversationAnnotationSend) – `example` has redacted text blanked out
 */
export class TcConversationAnnotation extends TcElement {
  static override ui = "cva";
  static formAssociated = true;

  /** The heading, and the transcript's accessible name */
  @property() accessor heading = "Conversation review";
  /** A quieter line under the heading – where the conversation came from */
  @property() accessor description = "";
  /** The conversation, in order */
  @property({ attribute: false }) accessor messages: AnnotationMessage[] = [];
  /** The label set; the first nine get the shortcut keys 1–9 */
  @property({ attribute: false }) accessor labels: AnnotationLabel[] = ANNOTATION_LABELS;
  /** Spans, ratings and corrections. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: ConversationAnnotationValue = EMPTY;
  /** The rating scale for a turn, lowest first */
  @property({ attribute: false }) accessor ratingLevels: RubricLevel[] = ANNOTATION_RATING_LEVELS;
  /** The roles whose turns can be rated */
  @property({ attribute: false }) accessor rateRoles: string[] = ["assistant"];
  /** The roles whose turns can be corrected */
  @property({ attribute: false }) accessor correctRoles: string[] = ["assistant"];
  /** Display names per role; an unknown role shows as written */
  @property({ attribute: false }) accessor roleLabels: Record<string, string> = ROLE_LABELS;
  /** The send button's label */
  @property({ attribute: "send-label" }) accessor sendLabel = "Send to dataset";
  /** The app is sending the example: the button shows it's busy */
  @property({ type: Boolean }) accessor sending = false;
  /** The app has stored the example: the button reads "Sent to dataset" until the value changes */
  @property({ type: Boolean, reflect: true }) accessor sent = false;
  /** Submitted with the form: the value as JSON */
  @property({ reflect: true }) accessor name = "";
  /** Turns every control off and leaves the value out of the form; a disabled fieldset does the same */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  /** @internal The turn that holds the tab stop */
  @state() accessor activeId = "";
  /** @internal The keyboard or mouse selection, in one message */
  @state() accessor selection: Selection | null = null;
  /** @internal The turn whose correction is being written, and the draft */
  @state() accessor editing: { id: string; draft: string } | null = null;
  /** @internal The span whose list item or mark is hovered or focused – both light up */
  @state() accessor hotId = "";
  /** @internal What the status region says */
  @state() accessor spoken = "";
  @state() private accessor formDisabled = false;

  private readonly internals: ElementInternals;
  private readonly uid = `tc-cva${++instances}`;
  private initialValue: ConversationAnnotationValue | null = null;
  private next = 0;
  private readonly legend = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-cva__key")] });

  constructor() {
    super();
    this.internals = this.attachInternals();
    // Removing an annotation moves focus to the next one (same data-focus-key), else the last one, else the turn
    new FocusRescueController(this, () => [...this.querySelectorAll<HTMLElement>(".ui-cva__jump")].pop() ?? this.querySelector<HTMLElement>('.ui-cva__turn[tabindex="0"]'));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.initialValue ??= this.value;
  }

  formResetCallback() {
    this.value = this.initialValue ?? EMPTY;
    this.selection = null;
    this.editing = null;
  }
  formDisabledCallback(disabled: boolean) {
    // Also called while `disabled` is reflected during an update, where a property change would be dropped – so after it
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }

  /** The export copy tc-send carries: redacted text replaced by █ */
  get example(): AnnotationExport {
    return prepareAnnotationExport(this.messages, this.value);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.toggleAttribute("data-disabled", this.isDisabled);
    if (!this.messages.some((m) => m.id === this.activeId)) this.activeId = this.messages[0]?.id ?? "";
    if (this.selection && !this.messages.some((m) => m.id === this.selection!.messageId)) this.selection = null;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (typeof this.internals.setFormValue !== "function") return;
    const disabled = this.isDisabled;
    this.internals.setFormValue(this.name && !disabled ? JSON.stringify(this.value) : null);
    const stale = !disabled && this.value.spans.some((s) => !annotationMatchesSource(s, this.messages));
    if (stale) this.internals.setValidity({ customError: true }, "An annotation's text has changed – remove it or annotate the new text.", this.querySelector<HTMLElement>(".ui-cva__jump") ?? undefined);
    else this.internals.setValidity({});
  }

  /* ---------- Changes ---------- */

  private commit(next: ConversationAnnotationValue) {
    if (this.isDisabled) return false;
    const ok = this.emit<ConversationAnnotationValueChange>("tc-value-change", { value: next }, { cancelable: true });
    if (ok) this.value = next;
    else this.requestUpdate();
    return ok;
  }

  private say(text: string) {
    // The same message twice in a row is still read: clear, then set after the update
    this.spoken = "";
    void this.updateComplete.then(() => (this.spoken = text));
  }

  private labelOf(id: string) {
    return this.labels.find((l) => l.id === id);
  }
  private toneOf(id: string): AnnotationTone {
    const i = this.labels.findIndex((l) => l.id === id);
    return this.labels[i]?.tone ?? TONES[Math.max(0, i) % TONES.length];
  }
  private roleName(m: AnnotationMessage) {
    return this.roleLabels[m.role] ?? m.role;
  }

  /** The selection, ordered and trimmed of surrounding spaces; null when nothing is selected */
  private range(): { m: AnnotationMessage; start: number; end: number } | null {
    const s = this.selection;
    const m = s && this.messages.find((x) => x.id === s.messageId);
    if (!s || !m) return null;
    let start = Math.min(s.anchor, s.focus);
    let end = Math.max(s.anchor, s.focus);
    while (start < end && /\s/.test(m.text[start])) start++;
    while (end > start && /\s/.test(m.text[end - 1])) end--;
    return end > start ? { m, start, end } : null;
  }

  /** Applies a label (or, with null, a redaction) to the selection */
  private apply(labelId: string | null) {
    if (this.isDisabled) return;
    const r = this.range();
    if (!r) {
      this.say("Select some text first");
      return;
    }
    const label = labelId === null ? null : this.labelOf(labelId);
    if (labelId !== null && !label) return;
    const quote = r.m.text.slice(r.start, r.end);
    const dupe = this.value.spans.some((s) => s.messageId === r.m.id && s.start === r.start && s.end === r.end && (labelId === null ? s.redacted : s.label === labelId && !s.redacted));
    if (dupe) {
      this.say(labelId === null ? "Already redacted" : `Already labelled ${label!.label}`);
      return;
    }
    let id = "";
    do id = `${this.uid}-a${++this.next}`;
    while (this.value.spans.some((s) => s.id === id));
    const span: AnnotationSpan = labelId === null ? { id, messageId: r.m.id, start: r.start, end: r.end, quote, label: "", redacted: true } : { id, messageId: r.m.id, start: r.start, end: r.end, quote, label: labelId };
    if (!this.commit({ ...this.value, spans: [...this.value.spans, span] })) return;
    this.selection = { messageId: r.m.id, anchor: r.end, focus: r.end };
    this.say(labelId === null ? `Redacted ${plural(quote.length, "character")}` : `Labelled ${label!.label}: “${shorten(quote)}”`);
  }

  private removeSpan(span: AnnotationSpan) {
    if (!this.commit({ ...this.value, spans: this.value.spans.filter((s) => s.id !== span.id) })) return;
    this.say(`Removed ${span.redacted ? "redaction" : (this.labelOf(span.label)?.label ?? "annotation")}`);
  }

  private rate(m: AnnotationMessage, level: number) {
    const ratings = { ...this.value.ratings };
    const clear = ratings[m.id] === level;
    if (clear) delete ratings[m.id];
    else ratings[m.id] = level;
    if (this.commit({ ...this.value, ratings })) this.say(clear ? "Rating cleared" : `Rated ${this.ratingLevels.find((l) => l.value === level)?.label ?? level}`);
  }

  private saveCorrection(m: AnnotationMessage) {
    const draft = this.editing?.draft ?? "";
    const corrections = { ...this.value.corrections };
    if (!draft.trim() || draft === m.text) delete corrections[m.id];
    else corrections[m.id] = draft;
    if (!this.commit({ ...this.value, corrections })) return;
    this.editing = null;
    this.say(corrections[m.id] ? "Correction saved" : "No change – correction removed");
    this.focusTurn(m.id);
  }

  private removeCorrection(m: AnnotationMessage) {
    const corrections = { ...this.value.corrections };
    delete corrections[m.id];
    if (this.commit({ ...this.value, corrections })) this.say("Correction removed");
    this.focusTurn(m.id);
  }

  private send() {
    if (this.isDisabled || this.sending) return;
    this.emit<ConversationAnnotationSend>("tc-send", { value: this.value, example: this.example });
  }

  /* ---------- Turns and the keyboard ---------- */

  private focusTurn(id: string) {
    this.activeId = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-cva__turn[data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: false }));
  }

  /** Jumps to a span: its turn gets focus with the span selected */
  private jump(span: AnnotationSpan) {
    if (!annotationMatchesSource(span, this.messages)) return;
    this.selection = { messageId: span.messageId, anchor: span.start, focus: span.end };
    this.focusTurn(span.messageId);
  }

  private onTurnKey(e: KeyboardEvent, m: AnnotationMessage, i: number) {
    if (e.target !== e.currentTarget || e.altKey) return;
    const list = this.messages;
    const mod = e.ctrlKey || e.metaKey;
    const text = m.text;
    const sel = this.selection?.messageId === m.id ? this.selection : null;
    const caret = sel?.focus ?? 0;
    const w = words(text);
    const nextEnd = (p: number) => w.find(([, b]) => b > p)?.[1] ?? text.length;
    const nextStart = (p: number) => w.find(([a]) => a > p)?.[0] ?? text.length;
    const prevStart = (p: number) => [...w].reverse().find(([a]) => a < p)?.[0] ?? 0;
    const select = (anchor: number, focus: number) => {
      this.selection = { messageId: m.id, anchor, focus };
      const a = Math.min(anchor, focus);
      const b = Math.max(anchor, focus);
      const q = text.slice(a, b).trim();
      if (q) this.say(`Selected “${shorten(q)}”`);
    };
    const move = (to: number) => {
      const target = list[Math.max(0, Math.min(list.length - 1, to))];
      if (target && target.id !== m.id) {
        this.selection = null;
        this.focusTurn(target.id);
      }
    };
    let handled = true;
    if (mod && e.key.toLowerCase() === "a") select(0, text.length);
    else if (mod) handled = false;
    else if (e.key === "ArrowDown" || e.key === "PageDown") move(i + 1);
    else if (e.key === "ArrowUp" || e.key === "PageUp") move(i - 1);
    else if (e.key === "Home" && !e.shiftKey) move(0);
    else if (e.key === "End" && !e.shiftKey) move(list.length - 1);
    else if (e.key === "Home") select(sel?.anchor ?? caret, 0);
    else if (e.key === "End") select(sel?.anchor ?? caret, text.length);
    else if (e.key === "ArrowRight" && e.shiftKey) select(sel?.anchor ?? caret, nextEnd(caret));
    else if (e.key === "ArrowLeft" && e.shiftKey) select(sel?.anchor ?? caret, prevStart(caret));
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      // A selection collapses to its end; a caret moves to the next or previous word's start
      const right = e.key === "ArrowRight";
      const p = sel && sel.anchor !== sel.focus ? (right ? Math.max(sel.anchor, sel.focus) : Math.min(sel.anchor, sel.focus)) : right ? nextStart(sel ? caret : -1) : prevStart(caret);
      this.selection = { messageId: m.id, anchor: p, focus: p };
    } else if (e.key === "Escape" && sel) this.selection = null;
    else if (/^[1-9]$/.test(e.key) && !e.shiftKey) {
      const label = this.labels[Number(e.key) - 1];
      if (label) this.apply(label.id);
      else handled = false;
    } else if (e.key.toLowerCase() === "r" && !e.shiftKey) this.apply(null);
    else handled = false;
    if (handled) e.preventDefault();
  }

  /** A DOM point inside a message's text → its offset in the message (marks, tags and screen-reader text skipped) */
  private offsetAt(body: HTMLElement, node: Node, offset: number): number {
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
    const seg = el?.closest<HTMLElement>("[data-from]");
    if (seg && body.contains(seg)) {
      const from = Number(seg.dataset.from);
      const to = Number(seg.dataset.to);
      if (seg.classList.contains("ui-cva__seg") && node.nodeType === Node.TEXT_NODE) return Math.min(to, from + offset);
      return offset > 0 ? to : from;
    }
    // A tag or the text box itself: the end of the last segment before the point
    const point = document.createRange();
    point.setStart(node, offset);
    let at = 0;
    for (const s of body.querySelectorAll<HTMLElement>("[data-from]")) if (point.comparePoint(s, 0) < 0) at = Number(s.dataset.to);
    return at;
  }

  private onMouseUp(e: MouseEvent, m: AnnotationMessage) {
    const body = e.currentTarget as HTMLElement;
    const native = window.getSelection();
    if (!native || !native.rangeCount) return;
    const r = native.getRangeAt(0);
    if (!body.contains(r.startContainer) || !body.contains(r.endContainer)) return;
    const a = this.offsetAt(body, r.startContainer, r.startOffset);
    const b = this.offsetAt(body, r.endContainer, r.endOffset);
    this.activeId = m.id;
    this.selection = { messageId: m.id, anchor: a, focus: b };
    if (a !== b) {
      native.removeAllRanges();
      const q = m.text.slice(Math.min(a, b), Math.max(a, b)).trim();
      if (q) this.say(`Selected “${shorten(q)}”`);
    }
    this.querySelector<HTMLElement>(`.ui-cva__turn[data-id="${CSS.escape(m.id)}"]`)?.focus({ preventScroll: true });
  }

  /* ---------- Render ---------- */

  /** The message's text, split at every span and selection boundary */
  private text(m: AnnotationMessage, active: boolean) {
    const text = m.text;
    const spans = this.value.spans.filter((s) => s.messageId === m.id && annotationMatchesSource(s, this.messages));
    // Redactions merge into bars
    const bars: [number, number][] = [];
    for (const [a, b] of spans.filter((s) => s.redacted).map((s) => [s.start, s.end] as [number, number]).sort((x, y) => x[0] - y[0])) {
      const last = bars[bars.length - 1];
      if (last && a <= last[1]) last[1] = Math.max(last[1], b);
      else bars.push([a, b]);
    }
    const labelled = spans.filter((s) => !s.redacted);
    const sel = this.selection?.messageId === m.id ? this.selection : null;
    const s0 = sel ? Math.min(sel.anchor, sel.focus) : -1;
    const s1 = sel ? Math.max(sel.anchor, sel.focus) : -1;
    const caret = active && sel && s0 === s1 ? s0 : -1;
    const cuts = new Set([0, text.length, ...labelled.flatMap((s) => [s.start, s.end]), ...bars.flat()]);
    if (sel) [s0, s1].forEach((x) => cuts.add(x));
    const points = [...cuts].filter((x) => x >= 0 && x <= text.length).sort((a, b) => a - b);
    const parts: unknown[] = [];
    const caretAt = (x: number) => (x === caret ? html`<span class="ui-cva__caret" aria-hidden="true"></span>` : nothing);
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      parts.push(caretAt(a));
      const bar = bars.find(([x, y]) => a >= x && b <= y);
      if (bar) {
        const hot = spans.some((x) => x.redacted && x.id === this.hotId && x.start >= bar[0] && x.end <= bar[1]);
        const bid = spans.find((x) => x.redacted && x.start >= bar[0] && x.end <= bar[1])?.id ?? "";
        if (a === bar[0]) parts.push(html`<span class="ui-cva__redacted" data-from=${bar[0]} data-to=${bar[1]} data-span=${bid} ?data-hot=${hot}>Redacted<span class="ui-cva__sr"> – ${plural(bar[1] - bar[0], "character")}</span></span>`);
        continue;
      }
      let part: TemplateResult = html`<span class="ui-cva__seg" data-from=${a} data-to=${b}>${text.slice(a, b)}</span>`;
      if (sel && a >= s0 && b <= s1 && s0 !== s1) part = html`<span class="ui-cva__sel">${part}</span>`;
      const on = labelled.filter((s) => s.start <= a && s.end >= b);
      // The innermost (shortest) span gives the colour, so a span inside another stays visible
      const inner = on.reduce<AnnotationSpan | null>((x, s) => (!x || s.end - s.start <= x.end - x.start ? s : x), null);
      if (inner) part = html`<mark class="ui-cva__mark" data-tone=${this.toneOf(inner.label)} data-span=${inner.id} ?data-multi=${on.length > 1} ?data-hot=${on.some((x) => x.id === this.hotId)}>${part}</mark>`;
      parts.push(part);
      for (const s of labelled.filter((x) => x.end === b)) {
        const l = this.labelOf(s.label);
        parts.push(html`<span class="ui-cva__tag" data-tone=${this.toneOf(s.label)}><span class="ui-cva__sr"> (</span>${l?.label ?? s.label}<span class="ui-cva__sr">)</span></span>`);
      }
    }
    if (text.length === caret || (text.length === 0 && caret === 0)) parts.push(caretAt(caret));
    return parts;
  }

  private rating(m: AnnotationMessage) {
    const v = this.value.ratings[m.id];
    const levels = this.ratingLevels;
    if (!levels.length) return nothing;
    const at = Math.max(0, levels.findIndex((l) => l.value === v));
    const onKey = (e: KeyboardEvent) => {
      const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in step)) return;
      e.preventDefault();
      e.stopPropagation();
      const i = levels.findIndex((l) => l.value === Number((e.target as HTMLElement).dataset.value));
      const to = levels[(i + step[e.key] + levels.length) % levels.length];
      if (to.value !== v) this.rate(m, to.value);
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-cva__turn[data-id="${CSS.escape(m.id)}"] .ui-cva__level[data-value="${to.value}"]`)?.focus());
    };
    return html`<div class="ui-cva__rating" role="radiogroup" aria-label=${`Rate ${this.roleName(m).toLowerCase()} turn`} @keydown=${onKey}>
      ${levels.map(
        (l, i) => html`<button
          type="button"
          role="radio"
          class="ui-cva__level"
          data-value=${l.value}
          aria-checked=${l.value === v ? "true" : "false"}
          tabindex=${i === at ? 0 : -1}
          ?disabled=${this.isDisabled}
          @click=${() => this.rate(m, l.value)}
        >${l.label}</button>`,
      )}
    </div>`;
  }

  private correction(m: AnnotationMessage) {
    if (!this.correctRoles.includes(m.role)) return nothing;
    const fixed = this.value.corrections[m.id];
    const disabled = this.isDisabled;
    if (this.editing?.id === m.id) {
      const id = `${this.uid}-fix-${m.id}`;
      return html`<div class="ui-cva__fix" @keydown=${(e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        e.stopPropagation();
        this.editing = null;
        this.focusTurn(m.id);
      }}>
        <label class="ui-cva__fix-label" for=${id}>The answer it should have been</label>
        <textarea id=${id} class="ui-cva__field" .value=${live(this.editing.draft)} @input=${(e: Event) => (this.editing = { id: m.id, draft: (e.target as HTMLTextAreaElement).value })}></textarea>
        <div class="ui-cva__fix-foot">
          <button type="button" class="ui-cva__btn" data-variant="primary" @click=${() => this.saveCorrection(m)}>Save correction</button>
          <button type="button" class="ui-cva__btn" @click=${() => {
            this.editing = null;
            this.focusTurn(m.id);
          }}>Cancel</button>
        </div>
      </div>`;
    }
    if (fixed === undefined)
      return html`<button type="button" class="ui-cva__btn ui-cva__ghost" ?disabled=${disabled} @click=${() => this.startEdit(m)}>${pencilIcon}Correct the answer</button>`;
    const diff = diffWords(m.text, fixed, 250_000);
    const changes = diff.filter((s) => s.type === "change").length;
    return html`<div class="ui-cva__fixed">
      <div class="ui-cva__fixed-head">
        <span class="ui-cva__fixed-title">${checkIcon}Corrected</span>
        <span class="ui-cva__fixed-count">${plural(changes, "change")}</span>
        <button type="button" class="ui-cva__btn ui-cva__ghost" ?disabled=${disabled} @click=${() => this.startEdit(m)}>Edit</button>
        <button type="button" class="ui-cva__btn ui-cva__ghost" ?disabled=${disabled} aria-label="Remove correction" @click=${() => this.removeCorrection(m)}>Remove</button>
      </div>
      <p class="ui-cva__diff">${diff.map((s) =>
        s.type === "equal"
          ? s.text
          : html`${s.remove ? html`<del class="ui-cva__del"><span class="ui-cva__sr">removed: </span>${s.remove}</del>` : nothing}${s.insert ? html`<ins class="ui-cva__ins"><span class="ui-cva__sr">added: </span>${s.insert}</ins>` : nothing}`,
      )}</p>
    </div>`;
  }

  private startEdit(m: AnnotationMessage) {
    this.editing = { id: m.id, draft: this.value.corrections[m.id] ?? m.text };
    void this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>(".ui-cva__field")?.focus());
  }

  private turn(m: AnnotationMessage, i: number) {
    const n = this.messages.length;
    const active = m.id === this.activeId;
    const role = this.roleName(m);
    return html`<article
      class="ui-cva__turn"
      data-id=${m.id}
      data-role=${m.role}
      ?data-active=${active}
      tabindex=${active ? 0 : -1}
      aria-label=${`${role}, turn ${i + 1} of ${n}`}
      aria-posinset=${i + 1}
      aria-setsize=${n}
      @focus=${(e: FocusEvent) => {
        if (e.target === e.currentTarget) this.activeId = m.id;
      }}
      @keydown=${(e: KeyboardEvent) => this.onTurnKey(e, m, i)}
    >
      <div class="ui-cva__turn-head">
        <span class="ui-cva__role">${role}${m.author ? html`<span class="ui-cva__author"> · ${m.author}</span>` : nothing}</span>
        ${this.rateRoles.includes(m.role) ? this.rating(m) : nothing}
      </div>
      <div
        class="ui-cva__text"
        @mouseup=${(e: MouseEvent) => this.onMouseUp(e, m)}
        @mouseover=${(e: MouseEvent) => (this.hotId = (e.target as Element).closest<HTMLElement>("[data-span]")?.dataset.span ?? "")}
        @mouseleave=${() => (this.hotId = "")}
      >${this.text(m, active)}</div>
      ${this.correction(m)}
    </article>`;
  }

  private legendBar() {
    const r = this.range();
    const spans = this.value.spans;
    const count = (id: string | null) => spans.filter((s) => (id === null ? s.redacted : !s.redacted && s.label === id)).length;
    const off = !r || this.isDisabled;
    const key = (k: string, tone: string, label: string, n: number, act: () => void, tip?: string, cls = "") => html`<button
      type="button"
      class=${`ui-cva__key ${cls}`}
      data-tone=${tone}
      aria-disabled=${off ? "true" : "false"}
      aria-keyshortcuts=${k}
      title=${ifDefined(tip)}
      @click=${() => {
        if (!off) act();
        else this.say(this.isDisabled ? "Annotation is turned off" : "Select some text first");
      }}
    ><kbd class="ui-cva__kbd" aria-hidden="true">${k}</kbd><span class="ui-cva__swatch" aria-hidden="true"></span><span class="ui-cva__key-label">${label}</span><span class="ui-cva__count"><span class="ui-cva__sr">, </span>${n}</span></button>`;
    const max = Math.min(9, this.labels.length);
    return html`<div class="ui-cva__legend">
      <div class="ui-cva__keys" role="toolbar" aria-label="Labels" aria-describedby=${`${this.uid}-hint`} @keydown=${this.legend.onKeyDown} @focusin=${this.legend.onFocusIn}>
        ${this.labels.map((l, i) => key(i < 9 ? String(i + 1) : "", this.toneOf(l.id), l.label, count(l.id), () => this.apply(l.id), l.description))}
        ${key("R", "redact", "Redact", count(null), () => this.apply(null), "Hide the text – it's blanked out in the export", "ui-cva__key--redact")}
      </div>
      <p class="ui-cva__hint" id=${`${this.uid}-hint`}>
        ${r
          ? html`<span class="ui-cva__picked">“${shorten(r.m.text.slice(r.start, r.end), 40)}”</span> – press ${max > 1 ? `1–${max}` : "1"} to label it, R to redact`
          : "Select text in a message to label it – or focus a turn and press Shift + → to select by word"}
      </p>
    </div>`;
  }

  private list() {
    const order = new Map(this.messages.map((m, i) => [m.id, i]));
    const spans = [...this.value.spans].sort((a, b) => (order.get(a.messageId) ?? 1e9) - (order.get(b.messageId) ?? 1e9) || a.start - b.start);
    return html`<section class="ui-cva__list" aria-labelledby=${`${this.uid}-list`}>
      <h4 class="ui-cva__list-title" id=${`${this.uid}-list`}>Annotations <span class="ui-cva__count">${spans.length}</span></h4>
      ${spans.length
        ? html`<ul class="ui-cva__items">
            ${repeat(
              spans,
              (s) => s.id,
              (s, i) => {
                const m = this.messages.find((x) => x.id === s.messageId);
                const ok = annotationMatchesSource(s, this.messages);
                const name = s.redacted ? "Redacted" : (this.labelOf(s.label)?.label ?? s.label);
                const quote = s.redacted ? plural(s.end - s.start, "character") : `“${shorten(s.quote, 80)}”`;
                const where = m ? `Turn ${(order.get(m.id) ?? 0) + 1} · ${this.roleName(m)}` : "Message removed";
                const hot = (on: boolean) => () => {
                  if (on) this.hotId = s.id;
                  else if (this.hotId === s.id) this.hotId = "";
                };
                return html`<li class="ui-cva__item" ?data-stale=${!ok} ?data-hot=${this.hotId === s.id} @mouseenter=${hot(true)} @mouseleave=${hot(false)} @focusin=${hot(true)} @focusout=${hot(false)}>
                  <button
                    type="button"
                    class="ui-cva__jump"
                    data-focus-key=${`item-${i}`}
                    aria-disabled=${ok ? "false" : "true"}
                    aria-keyshortcuts="Delete"
                    @click=${() => this.jump(s)}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key !== "Delete" && e.key !== "Backspace") return;
                      e.preventDefault();
                      this.removeSpan(s);
                    }}
                  >
                    <span class="ui-cva__tag" data-tone=${s.redacted ? "redact" : this.toneOf(s.label)}>${name}</span>
                    <span class="ui-cva__quote">${quote}</span>
                    <span class="ui-cva__where">${ok ? where : html`${alertIcon}Text changed`}</span>
                  </button>
                  <button type="button" class="ui-cva__remove" aria-label=${`Remove ${name}: ${quote}`} title="Remove" ?disabled=${this.isDisabled} @click=${() => this.removeSpan(s)}>${closeIcon}</button>
                </li>`;
              },
            )}
          </ul>`
        : html`<p class="ui-cva__empty">No annotations yet</p>`}
    </section>`;
  }

  protected override render() {
    const v = this.value;
    const titleId = `${this.uid}-title`;
    const rated = Object.keys(v.ratings).filter((id) => this.messages.some((m) => m.id === id)).length;
    const corrected = Object.keys(v.corrections).filter((id) => this.messages.some((m) => m.id === id)).length;
    const summary = [plural(v.spans.length, "annotation"), rated ? `${rated} rated` : "", corrected ? `${corrected} corrected` : ""].filter(Boolean).join(" · ");
    return html`
      ${cardHead({ icon: markIcon, title: this.heading, subtitle: this.description, id: titleId })}
      <div class="ui-cva__card">
        ${this.legendBar()}
        <div class="ui-cva__body">
          ${this.messages.length
            ? html`<div class="ui-cva__feed" role="feed" aria-labelledby=${titleId}>${repeat(this.messages, (m) => m.id, (m, i) => this.turn(m, i))}</div>`
            : html`<p class="ui-cva__empty ui-cva__none">No conversation to review</p>`}
          ${this.list()}
        </div>
        <div class="ui-cva__foot">
          <span class="ui-cva__summary">${summary}</span>
          <button
            type="button"
            class="ui-cva__btn ui-cva__send"
            data-variant="primary"
            ?data-sent=${this.sent}
            aria-busy=${this.sending ? "true" : "false"}
            ?disabled=${this.isDisabled || !this.messages.length}
            @click=${this.send}
          >${this.sent ? html`${checkIcon}Sent to dataset` : this.sending ? "Sending…" : this.sendLabel}</button>
        </div>
      </div>
      <span class="ui-cva__sr" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="cva"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: ui-cva / inline-size;
}
/* Clean: no tray – one white card with hairline dividers */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cva"] {
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="cva"] *, [data-ui="cva"] *::before, [data-ui="cva"] *::after { box-sizing: border-box; }
[data-ui="cva"] svg { display: block; flex: none; }
[data-ui="cva"] :is(p, h4, ul) { margin: 0; padding: 0; }
[data-ui="cva"] ul { list-style: none; }
:where([data-ui="cva"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="cva"] :is(button, textarea):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="cva"] button:disabled { cursor: default; opacity: 0.5; }
.ui-cva__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-cva__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-cva__glyph { stroke-width: 1.6; }

/* ----- The header (cardHead): on the tray in Standard, the card's first row in Clean ----- */

/* ----- The card ----- */
/* clip, not hidden: the side list can stick to the page as it scrolls */
.ui-cva__card { overflow: clip; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-cva__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }

/* ----- The legend: a key per label with its count, then Redact ----- */
.ui-cva__legend { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-cva__keys { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-cva__key { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) 0 var(--tc-space-1); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cva__key { background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
[data-ui="cva"] .ui-cva__key[aria-disabled="false"]:hover { background: var(--tc-fill-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-cva__key[aria-disabled="false"]:hover { background: var(--tc-fill-subtle); }
.ui-cva__key[aria-disabled="true"] { cursor: default; }
.ui-cva__key[aria-disabled="true"] .ui-cva__key-label { color: var(--tc-text-secondary); }
.ui-cva__kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-kbd-fg); }
.ui-cva__kbd:empty { display: none; }
.ui-cva__swatch { width: 8px; height: 8px; border-radius: 50%; background: var(--cva-solid); }
.ui-cva__key--redact .ui-cva__swatch { border-radius: var(--tc-radius-2xs); }
.ui-cva__count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-cva__hint { min-width: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-cva__picked { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }

/* Tones: each label's colours come from one --tc-tone-* family */
[data-ui="cva"] [data-tone="rose"] { --cva-bg: var(--tc-tone-rose-bg); --cva-fg: var(--tc-tone-rose-fg); --cva-solid: var(--tc-tone-rose-solid); }
[data-ui="cva"] [data-tone="amber"] { --cva-bg: var(--tc-tone-amber-bg); --cva-fg: var(--tc-tone-amber-fg); --cva-solid: var(--tc-tone-amber-solid); }
[data-ui="cva"] [data-tone="violet"] { --cva-bg: var(--tc-tone-violet-bg); --cva-fg: var(--tc-tone-violet-fg); --cva-solid: var(--tc-tone-violet-solid); }
[data-ui="cva"] [data-tone="teal"] { --cva-bg: var(--tc-tone-teal-bg); --cva-fg: var(--tc-tone-teal-fg); --cva-solid: var(--tc-tone-teal-solid); }
[data-ui="cva"] [data-tone="pink"] { --cva-bg: var(--tc-tone-pink-bg); --cva-fg: var(--tc-tone-pink-fg); --cva-solid: var(--tc-tone-pink-solid); }
[data-ui="cva"] [data-tone="redact"] { --cva-bg: var(--tc-surface-inverse); --cva-fg: var(--tc-text-on-inverse); --cva-solid: var(--tc-surface-inverse); }

/* ----- The transcript ----- */
.ui-cva__feed { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-cva__feed { gap: 0; padding: 0; }
.ui-cva__turn { display: grid; gap: var(--tc-space-1-5); min-width: 0; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); outline: none; }
.ui-cva__turn:focus-visible { box-shadow: 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
:where([data-look="standard"], [data-look="standard"] *).ui-cva__turn[data-role="user"] { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-cva__turn { padding: var(--tc-space-3) var(--tc-space-4); border-radius: 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-cva__turn:focus-visible { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-cva__turn-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); min-height: var(--tc-control-h-sm); }
.ui-cva__role { min-width: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-cva__role { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-cva__author { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); text-transform: none; letter-spacing: normal; }
.ui-cva__text { color: var(--tc-text-primary); line-height: var(--tc-line-height-relaxed); white-space: pre-wrap; overflow-wrap: anywhere; cursor: text; }
/* Marks: the label's tint with an underline in its solid colour; overlapping labels get a double line */
/* Marks: a highlighter fill in the label's tone with a solid edge under it; overlapping labels get a double edge */
.ui-cva__mark { padding: var(--tc-space-0-5) 0; border-radius: var(--tc-radius-2xs); background: color-mix(in srgb, var(--cva-solid) 20%, var(--cva-bg)); color: inherit; box-shadow: inset 0 -2px 0 var(--cva-solid); box-decoration-break: clone; -webkit-box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cva__mark[data-multi] { background: color-mix(in srgb, var(--cva-solid) 30%, var(--cva-bg)); box-shadow: inset 0 -2px 0 var(--cva-solid), inset 0 -3px 0 var(--tc-surface-on-tray), inset 0 -5px 0 var(--cva-solid); }
/* The span whose annotation is hovered or focused in the list */
.ui-cva__mark[data-hot] { background: color-mix(in srgb, var(--cva-solid) 38%, var(--cva-bg)); box-shadow: inset 0 -2px 0 var(--cva-solid), 0 0 0 1.5px var(--cva-solid); }
.ui-cva__redacted[data-hot] { box-shadow: 0 0 0 1.5px var(--tc-surface-raised), 0 0 0 3px var(--tc-surface-inverse); }
.ui-cva__tag { display: inline-flex; align-items: center; height: var(--tc-pill-h); margin-left: var(--tc-space-0-5); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--cva-bg); color: var(--cva-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; vertical-align: 1px; user-select: none; }
.ui-cva__redacted { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-xs); background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); font-size: var(--tc-pill-font-size); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; vertical-align: 1px; user-select: none; }
/* The selection and the keyboard caret */
.ui-cva__sel { border-radius: var(--tc-radius-2xs); background: var(--tc-accent-highlight); box-shadow: 0 0 0 1px var(--tc-border-selected); }
:where([data-look="clean"], [data-look="clean"] *).ui-cva__sel { background: var(--tc-accent-subtle); box-shadow: none; }
.ui-cva__caret { display: inline-block; width: 0; height: 1.15em; vertical-align: text-bottom; box-shadow: 0 0 0 1px var(--tc-accent); }
.ui-cva__turn:not(:focus) .ui-cva__caret { box-shadow: none; }

/* Ratings: feedback-rubric's segmented scale, small */
.ui-cva__rating { display: inline-flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-cva__level { display: grid; place-items: center; height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad) - var(--tc-space-1)); padding: 0 var(--tc-space-2); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="cva"] .ui-cva__level:hover:not(:disabled) { color: var(--tc-text-primary); }
[data-ui="cva"] .ui-cva__level[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }

/* Correcting an answer */
/* Ghost buttons: Correct the answer, Edit, Remove */
.ui-cva__btn.ui-cva__ghost { justify-self: start; background: transparent; box-shadow: none; color: var(--tc-action-ghost-fg); }
[data-ui="cva"] .ui-cva__btn.ui-cva__ghost:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); box-shadow: none; color: var(--tc-text-primary); }
.ui-cva__turn > .ui-cva__ghost { margin-left: calc(-1 * var(--tc-control-px-sm)); }
.ui-cva__fix { display: grid; gap: var(--tc-space-1-5); }
.ui-cva__fix-label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-cva__field { display: block; width: 100%; min-height: var(--tc-field-h); padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); resize: vertical; outline: none; field-sizing: content; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cva__field:hover { box-shadow: var(--tc-field-shadow-hover); }
[data-ui="cva"] .ui-cva__field:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-cva__fix-foot { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); }
.ui-cva__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="cva"] .ui-cva__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-cva__btn[data-variant="primary"] { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
[data-ui="cva"] .ui-cva__btn[data-variant="primary"]:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-cva__fixed { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-well); }
.ui-cva__fixed-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); margin-right: calc(-1 * var(--tc-space-1-5)); }
.ui-cva__fixed-title { display: inline-flex; align-items: center; gap: var(--tc-space-1); margin-right: auto; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-success-fg); }
.ui-cva__fixed-count { margin-right: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-cva__diff { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-cva__del { border-radius: var(--tc-radius-2xs); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); text-decoration: line-through; }
.ui-cva__ins { border-radius: var(--tc-radius-2xs); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); text-decoration: underline; text-underline-offset: 2px; }

/* ----- The annotation list ----- */
/* Transcript and list: stacked when narrow, side by side from 760 px */
.ui-cva__body { display: grid; grid-template-columns: minmax(0, 1fr); }
.ui-cva__list { display: grid; align-content: start; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-cva__list { border-top: 0; }
.ui-cva__item[data-hot] .ui-cva__jump { background: var(--tc-fill-hover); }
.ui-cva__list-title { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-cva__list-title { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-cva__items { display: grid; }
.ui-cva__item { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-cva__item:first-child { border-top: 0; }
.ui-cva__jump { display: flex; flex: 1; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-2); margin-left: calc(-1 * var(--tc-space-2)); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="cva"] .ui-cva__jump:hover { background: var(--tc-fill-hover); }
.ui-cva__jump[aria-disabled="true"] { cursor: default; }
.ui-cva__jump .ui-cva__tag { margin-left: 0; }
.ui-cva__quote { flex: 1 1 160px; min-width: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); overflow-wrap: anywhere; }
.ui-cva__where { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-cva__item[data-stale] .ui-cva__where { color: var(--tc-status-warning-fg); }
.ui-cva__item[data-stale] .ui-cva__quote { color: var(--tc-text-muted); text-decoration: line-through; }
.ui-cva__remove { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); background: transparent; color: var(--tc-action-ghost-fg); }
[data-ui="cva"] .ui-cva__remove:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-cva__empty { padding: var(--tc-space-2) 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-cva__none { padding: var(--tc-space-5) var(--tc-space-4); text-align: center; }

/* ----- The foot: what's there, and Send ----- */
.ui-cva__foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cva__summary { flex: 1; min-width: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-cva__send { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); }
.ui-cva__send[aria-busy="true"] { cursor: progress; }
[data-ui="cva"] .ui-cva__send[data-sent] { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-status-success-fg); }

@container ui-cva (min-width: 760px) {
  .ui-cva__body { grid-template-columns: minmax(0, 1fr) minmax(240px, 300px); }
  .ui-cva__list { position: sticky; top: 0; align-self: start; max-height: 100vh; overflow: auto; border-top: 0; border-left: var(--tc-hairline) solid var(--tc-divider); }
  :where([data-look="clean"], [data-look="clean"] *).ui-cva__list { border-top: 0; }
  .ui-cva__where { flex-basis: 100%; }
}
/* Narrow: the rating goes under the role */
@container ui-cva (max-width: 420px) {
  .ui-cva__legend, .ui-cva__list, .ui-cva__foot { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-cva__feed { padding: var(--tc-space-3); }
  .ui-cva__turn { padding: var(--tc-space-2) var(--tc-space-2-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-cva__turn { padding: var(--tc-space-3); }
  .ui-cva__where { flex-basis: 100%; }
  .ui-cva__fixed-count { display: none; }
}
@media (pointer: coarse) {
  .ui-cva__key, .ui-cva__btn { height: 36px; }
  .ui-cva__level { height: 30px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cva"] *, [data-ui="cva"] *::before, [data-ui="cva"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-conversation-annotation")) customElements.define("tc-conversation-annotation", TcConversationAnnotation);

declare global {
  interface HTMLElementTagNameMap {
    "tc-conversation-annotation": TcConversationAnnotation;
  }
}

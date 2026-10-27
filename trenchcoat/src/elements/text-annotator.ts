import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { ToolbarController } from "./internal/controllers";
import { segments, SelectionController, trimRange, type TextSelection } from "./internal/selection";
import { SelectionToolbarController } from "./internal/selection-toolbar";
import { copyText, isMac } from "./internal/util";

/*
 * <tc-text-annotator> – highlight and comment on a document's text. Select a passage with the pointer, or with the
 * keyboard in the text's caret mode; a small toolbar offers a highlight colour, Comment and Copy. Highlights are marks
 * in the text; comments sit in a margin rail beside their highlight (below the text when the component is narrow).
 * Each annotation can be edited, resolved or removed, and the rail and marks can be filtered by colour, author and
 * resolved state.
 *
 *   <tc-text-annotator heading="Launch brief" author="Maya Chen" .text=${body} .value=${notes}></tc-text-annotator>
 *
 * The text is the `text` property – plain text, paragraphs separated by blank lines (shown as written, white space
 * kept). It isn't slotted: frameworks replace an element's text children (lit-patterns, "Content"), and offsets must
 * index one exact string. The value is `{ id, start, end, color, comment?, author?, at?, resolved? }[]` (UTF-16
 * offsets into `text`); every change fires a cancelable tc-value-change ({ value, change }) – preventDefault() keeps
 * control. Copy fires a cancelable tc-copy before it writes to the clipboard. New annotations get `author` and, when
 * the app gives one, `timestamp()` (the element reads no clock).
 *
 * Keyboard. The text is one tab stop in caret mode (internal/selection.ts): ← → a character, Ctrl/Alt + ← → a word,
 * ↑ ↓ a line, Home / End, Shift to extend, Ctrl/⌘ + A all. With a selection, Tab moves into the toolbar (← → Home End
 * between its buttons, Shift + Tab or Esc back to the text) and 1–5 apply a colour directly. With the caret inside a
 * highlight, Enter opens its comment and Delete removes it. The marks are one more tab stop: ← → ↑ ↓ Home End move
 * between them, Enter opens the comment, Delete or Backspace removes the highlight (announced, with Undo – Ctrl/⌘ + Z),
 * Esc goes back to the text. In the comment editor Ctrl/⌘ + Enter saves and Esc cancels; Esc in a rail card goes back
 * to its mark. Screen readers hear each mark's colour and comment count before its text, and every action in a polite
 * status region.
 *
 * Standard sets the header on the gray tray and the document on a white card, with the rail's notes as small raised
 * cards; Clean is one white card whose notes are quiet rows separated by hairlines, with thinner icons.
 */

/** The highlighter colours – the --tc-highlight-<color>-bg / -fg tokens */
export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "purple";

export type TextAnnotation = {
  id: string;
  /** UTF-16 offsets into `text`; `end` is exclusive */
  start: number;
  end: number;
  color: HighlightColor;
  comment?: string;
  /** Who made it – shown on its note and used by the author filter */
  author?: string;
  /** When: epoch ms or an ISO string */
  at?: string | number;
  resolved?: boolean;
};

export type TextAnnotatorChangeType = "add" | "edit" | "resolve" | "reopen" | "remove" | "restore";
/** tc-value-change: the whole new list, and what changed */
export type TextAnnotatorValueChange = { value: TextAnnotation[]; change: { type: TextAnnotatorChangeType; annotation: TextAnnotation } };
/** tc-copy: the selected text and where it is */
export type TextAnnotatorCopy = { text: string; start: number; end: number };
/** What the rail and the marks show: empty lists mean every colour / author */
export type TextAnnotatorFilter = { colors: HighlightColor[]; authors: string[]; resolved: boolean };
export type TextAnnotatorFilterChange = { filter: TextAnnotatorFilter };

export const HIGHLIGHT_COLORS: HighlightColor[] = ["yellow", "green", "blue", "pink", "purple"];
const COLOR_NAMES: Record<HighlightColor, string> = { yellow: "Yellow", green: "Green", blue: "Blue", pink: "Pink", purple: "Purple" };
const ALL: TextAnnotatorFilter = { colors: [], authors: [], resolved: true };
/** Below this width the rail moves under the text */
const NARROW = 600;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const shorten = (t: string, n = 48) => {
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
};
const isColor = (c: unknown): c is HighlightColor => HIGHLIGHT_COLORS.includes(c as HighlightColor);

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult) => html`<svg class="ui-tan__glyph" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/** A highlighter: the title mark */
const markIcon = svg`<path d="m9 11-6 6v3h9l3-3"></path><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"></path>`;
const commentIcon = glyph(svg`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"></path>`);
const copyIcon = glyph(svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`);
const pencilIcon = glyph(svg`<path d="M4 20h4L19 9l-4-4L4 16v4z"></path><path d="M13.5 6.5l4 4"></path>`);
const checkIcon = glyph(svg`<path d="M20 6 9 17l-5-5"></path>`);
const reopenIcon = glyph(svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`);
const trashIcon = glyph(svg`<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>`);

let instances = 0;

/**
 * A document to highlight and comment on: marks in the text, notes in a margin rail, a toolbar on the selection.
 * @tag tc-text-annotator
 * @fires tc-value-change - An annotation was added, edited, resolved, reopened, removed or restored ({ value, change }: TextAnnotatorValueChange); cancelable – prevent it to control `value`
 * @fires tc-copy - Copy was chosen on a selection ({ text, start, end }: TextAnnotatorCopy); cancelable – prevent it to copy your own way
 * @fires tc-filter-change - The colour, author or resolved filter changed ({ filter }: TextAnnotatorFilterChange)
 */
export class TcTextAnnotator extends TcElement {
  static override ui = "tan";

  /** The heading, and the component's name */
  @property() accessor heading = "Annotations";
  /** A quieter line under the heading – the document's name or where it came from */
  @property() accessor description = "";
  /** The document: plain text, paragraphs separated by blank lines. Offsets index into it */
  @property() accessor text = "";
  /** The annotations. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: TextAnnotation[] = [];
  /** Who is annotating: the author of new annotations */
  @property() accessor author = "";
  /** The colours the toolbar offers, in order (1–5 pick them from the keyboard) */
  @property({ attribute: false }) accessor colors: HighlightColor[] = HIGHLIGHT_COLORS;
  /** The colours' names, as people read and hear them */
  @property({ attribute: false }) accessor colorNames: Record<HighlightColor, string> = COLOR_NAMES;
  /** What the rail and the marks show; changed from the filter bar (tc-filter-change) */
  @property({ attribute: false }) accessor filter: TextAnnotatorFilter = ALL;
  /** Read and copy only: no new highlights, comments or changes */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;
  /** Stamps a new annotation's `at` (epoch ms or ISO) – the element itself reads no clock */
  @property({ attribute: false }) accessor timestamp: (() => string | number) | undefined = undefined;
  /** The locale times are written in (default: the browser's) */
  @property() accessor locale: string | undefined = undefined;
  /** The text's accessible name */
  @property({ attribute: "text-label" }) accessor textLabel = "Document text";
  /** Shown in the rail before there are any annotations */
  @property({ attribute: "empty-text" }) accessor emptyText = "Select text to highlight it or add a comment.";

  /** @internal The trimmed selection the toolbar acts on */
  @state() accessor picked: { start: number; end: number } | null = null;
  /** @internal A new comment being written, not in the value yet */
  @state() accessor draft: (TextAnnotation & { comment: string }) | null = null;
  /** @internal An annotation whose comment (and colour) is being edited */
  @state() accessor editing: { id: string; comment: string; color: HighlightColor } | null = null;
  /** @internal The annotation whose mark or note is hovered or focused – both light up */
  @state() accessor hotId = "";
  /** @internal The mark that holds the marks' tab stop */
  @state() accessor activeId = "";
  /** @internal The rail sits under the text */
  @state() accessor narrow = false;
  /** @internal The last removal, for Undo */
  @state() accessor undo: { annotation: TextAnnotation; index: number } | null = null;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-tan${++instances}`;
  private next = 0;
  private lastColor: HighlightColor = "yellow";
  /** The annotation the caret was last announced inside */
  private caretIn = "";
  /** Focus to move after the next update */
  private focusAfter: (() => HTMLElement | null | undefined) | null = null;
  private ro?: ResizeObserver;
  private dates?: Intl.DateTimeFormat;
  private datesLocale: string | undefined = "";

  private readonly sel = new SelectionController(this, {
    root: () => this.textRoot,
    caret: true,
    caretEl: () => this.querySelector<HTMLElement>(".ui-tan__caret"),
    onChange: (s, how) => this.onSelection(s, how.cause, how.final),
  });
  /** Above the selection's first line, centred over the whole selection */
  private readonly bar = new SelectionToolbarController(this, {
    sel: this.sel,
    root: () => this.textRoot,
    range: () => this.picked,
    popover: () => this.querySelector<HTMLElement>(".ui-tan__pop"),
    items: () => [...this.querySelectorAll<HTMLElement>(".ui-tan__pop .ui-tan__tool")],
  });
  private readonly filters = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-tan__filter")] });

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.addEventListener("keydown", this.onUndoKey);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.onUndoKey);
    this.ro?.disconnect();
    this.ro = undefined;
  }

  private get textRoot() {
    return this.querySelector<HTMLElement>(".ui-tan__text");
  }

  /* ---------- Reading the value ---------- */

  /** @internal The annotations that point at real text, in reading order */
  get annotations(): TextAnnotation[] {
    const n = this.text.length;
    return this.value
      .filter((a) => Number.isInteger(a.start) && Number.isInteger(a.end) && a.start >= 0 && a.end > a.start && a.end <= n)
      .sort((a, b) => a.start - b.start || b.end - a.end);
  }

  private shown(a: TextAnnotation) {
    const f = this.filter;
    if (f.colors.length && !f.colors.includes(a.color)) return false;
    if (f.authors.length && !f.authors.includes(a.author ?? "")) return false;
    return f.resolved || !a.resolved;
  }

  private colorOf(a: TextAnnotation): HighlightColor {
    return isColor(a.color) ? a.color : "yellow";
  }
  private nameOf(c: HighlightColor) {
    return this.colorNames[c] ?? COLOR_NAMES[c];
  }
  private quoteOf(a: { start: number; end: number }) {
    return this.text.slice(a.start, a.end);
  }
  /** What a mark says before its text, and what's announced when the caret enters it */
  private describe(a: TextAnnotation) {
    const parts = [`${this.nameOf(this.colorOf(a))} highlight`, a.comment?.trim() ? "1 comment" : "no comments"];
    if (a.resolved) parts.push("resolved");
    return parts.join(", ");
  }
  private when(at: string | number | undefined) {
    if (at === undefined || at === "") return "";
    const d = new Date(at);
    if (Number.isNaN(d.getTime())) return "";
    if (!this.dates || this.datesLocale !== this.locale) {
      this.dates = new Intl.DateTimeFormat(this.locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
      this.datesLocale = this.locale;
    }
    return this.dates.format(d);
  }

  /* ---------- Changes ---------- */

  private commit(value: TextAnnotation[], type: TextAnnotatorChangeType, annotation: TextAnnotation) {
    if (!this.emit<TextAnnotatorValueChange>("tc-value-change", { value, change: { type, annotation } }, { cancelable: true })) return false;
    this.value = value;
    if (type !== "remove") this.undo = null;
    return true;
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private say(text: string) {
    this.said = this.said === text ? `${text} ` : text;
  }

  private newId() {
    let id = "";
    do id = `${this.uid}-${++this.next}`;
    while (this.value.some((a) => a.id === id));
    return id;
  }

  private stamp(): Partial<TextAnnotation> {
    const out: Partial<TextAnnotation> = {};
    if (this.author) out.author = this.author;
    const at = this.timestamp?.();
    if (at !== undefined) out.at = at;
    return out;
  }

  /** The selection the toolbar acts on, trimmed of white space at its ends */
  private target() {
    const { start, end } = this.sel;
    if (start === null || end === null) return null;
    const r = trimRange(this.text, start, end);
    return r.end > r.start ? r : null;
  }

  private highlight(color: HighlightColor) {
    if (this.readonly) return;
    const r = this.target();
    if (!r) {
      this.say("Select some text first");
      return;
    }
    const a: TextAnnotation = { id: this.newId(), start: r.start, end: r.end, color, ...this.stamp() };
    if (!this.commit([...this.value, a], "add", a)) return;
    this.lastColor = color;
    this.activeId = a.id;
    this.finishSelection(r.end);
    this.say(`Highlighted ${this.nameOf(color).toLowerCase()}: “${shorten(this.quoteOf(a))}”`);
  }

  private startComment() {
    if (this.readonly) return;
    const r = this.target();
    if (!r) {
      this.say("Select some text first");
      return;
    }
    this.editing = null;
    this.draft = { id: this.newId(), start: r.start, end: r.end, color: this.lastColor, comment: "", ...this.stamp() };
    this.bar.pop.close();
    this.focusAfter = () => this.querySelector<HTMLTextAreaElement>(`.ui-tan__note[data-id="${CSS.escape(this.draft?.id ?? "")}"] textarea`);
  }

  private async copy() {
    const r = this.target();
    if (!r) return;
    const text = this.quoteOf(r);
    const go = this.emit<TextAnnotatorCopy>("tc-copy", { text, start: r.start, end: r.end }, { cancelable: true });
    this.bar.pop.close();
    this.textRoot?.focus({ preventScroll: true });
    if (!go) return;
    this.say((await copyText(text)) ? "Copied" : "Couldn't copy – use Ctrl+C");
  }

  /** After an action on the selection: the toolbar closes, the caret goes to `at`, focus back in the text */
  private finishSelection(at: number) {
    this.bar.pop.close();
    const root = this.textRoot;
    if (root && this.contains(document.activeElement) && document.activeElement !== root) root.focus({ preventScroll: true });
    this.sel.select(at);
  }

  private saveDraft() {
    const d = this.draft;
    if (!d) return;
    const comment = d.comment.trim();
    const a: TextAnnotation = { ...d, ...(comment ? { comment } : {}) };
    if (!comment) delete a.comment;
    if (!this.commit([...this.value, a], "add", a)) return;
    this.draft = null;
    this.lastColor = a.color;
    this.activeId = a.id;
    this.focusAfter = () => this.markOf(a.id);
    this.say(comment ? `Comment added on “${shorten(this.quoteOf(a))}”` : `Highlighted ${this.nameOf(a.color).toLowerCase()}: “${shorten(this.quoteOf(a))}”`);
  }

  private cancelDraft() {
    const d = this.draft;
    this.draft = null;
    this.focusAfter = () => this.textRoot;
    if (d) this.sel.select(d.start, d.end);
    this.say("Comment discarded");
  }

  private startEdit(a: TextAnnotation) {
    if (this.readonly) return;
    this.draft = null;
    this.editing = { id: a.id, comment: a.comment ?? "", color: this.colorOf(a) };
    this.hotId = a.id;
    this.focusAfter = () => this.querySelector<HTMLTextAreaElement>(`.ui-tan__note[data-id="${CSS.escape(a.id)}"] textarea`);
  }

  private saveEdit() {
    const e = this.editing;
    const a = e && this.value.find((x) => x.id === e.id);
    if (!e || !a) return;
    const comment = e.comment.trim();
    const next: TextAnnotation = { ...a, color: e.color };
    if (comment) next.comment = comment;
    else delete next.comment;
    if (!this.commit(this.value.map((x) => (x.id === a.id ? next : x)), "edit", next)) return;
    this.editing = null;
    this.focusAfter = () => this.markOf(a.id) ?? this.noteButton(a.id);
    this.say(comment ? "Comment saved" : "Comment removed");
  }

  private cancelEdit() {
    const id = this.editing?.id ?? "";
    this.editing = null;
    this.focusAfter = () => this.markOf(id) ?? this.noteButton(id);
  }

  private toggleResolved(a: TextAnnotation) {
    if (this.readonly) return;
    const next: TextAnnotation = { ...a, resolved: !a.resolved };
    if (!next.resolved) delete next.resolved;
    if (!this.commit(this.value.map((x) => (x.id === a.id ? next : x)), next.resolved ? "resolve" : "reopen", next)) return;
    this.focusAfter = () => this.noteButton(a.id, "resolve");
    this.say(next.resolved ? (this.filter.resolved ? "Resolved" : "Resolved – hidden by the filter") : "Reopened");
  }

  private removeAnnotation(a: TextAnnotation, from: "mark" | "note" | "caret") {
    if (this.readonly) return;
    const index = this.value.findIndex((x) => x.id === a.id);
    if (index < 0) return;
    // Where focus goes: the next mark (or note), else the previous one, else the text
    const order = this.annotations.filter((x) => this.shown(x));
    const at = order.findIndex((x) => x.id === a.id);
    const neighbour = order[at + 1] ?? order[at - 1];
    if (!this.commit(this.value.filter((x) => x.id !== a.id), "remove", a)) return;
    this.undo = { annotation: a, index };
    if (this.editing?.id === a.id) this.editing = null;
    if (from === "mark") this.focusAfter = () => (neighbour && this.markOf(neighbour.id)) || this.textRoot;
    else if (from === "note") this.focusAfter = () => (neighbour && this.noteButton(neighbour.id)) || this.textRoot;
    if (neighbour) this.activeId = neighbour.id;
    this.say(`${this.nameOf(this.colorOf(a))} highlight removed. Press ${isMac() ? "⌘" : "Ctrl"}+Z or Undo to restore it`);
  }

  private restore() {
    const u = this.undo;
    if (!u || this.readonly) return;
    const value = [...this.value];
    value.splice(Math.min(u.index, value.length), 0, u.annotation);
    if (!this.commit(value, "restore", u.annotation)) return;
    this.undo = null;
    this.activeId = u.annotation.id;
    this.focusAfter = () => this.markOf(u.annotation.id);
    this.say(`${this.nameOf(this.colorOf(u.annotation))} highlight restored`);
  }

  private setFilter(filter: TextAnnotatorFilter) {
    this.filter = filter;
    this.emit<TextAnnotatorFilterChange>("tc-filter-change", { filter });
    const list = this.annotations;
    const n = list.filter((a) => this.shown(a)).length;
    this.say(n === list.length ? `Showing all ${plural(n, "annotation")}` : `Showing ${n} of ${plural(list.length, "annotation")}`);
  }

  /* ---------- Selection and keys ---------- */

  private onSelection(s: TextSelection | null, cause: string, final: boolean) {
    const r = s && !s.collapsed ? trimRange(this.text, s.start, s.end) : null;
    this.picked = r && r.end > r.start ? r : null;
    this.bar.follow(!!this.picked, final);
    if (!this.picked) {
      // The caret walked into (or out of) a highlight: say which
      if (cause === "keyboard" && s) {
        const a = this.annotationAt(s.focus);
        if (a && a.id !== this.caretIn) this.say(`${this.describe(a)}. Enter opens the comment, Delete removes it`);
        this.caretIn = a?.id ?? "";
      }
      return;
    }
    this.caretIn = "";
    if (!final) return;
    if (cause === "keyboard") this.say(`Selected “${shorten(this.quoteOf(this.picked))}”. Tab for highlight, comment and copy`);
  }

  /** The shown annotation under the caret: the innermost that contains it */
  private annotationAt(offset: number) {
    const hits = this.annotations.filter((a) => this.shown(a) && a.start <= offset && offset < a.end);
    return hits.sort((a, b) => a.end - a.start - (b.end - b.start))[0];
  }

  private onTextKey(e: KeyboardEvent) {
    const root = this.textRoot;
    const t = e.target as HTMLElement;
    const mark = t !== root ? t.closest<HTMLElement>(".ui-tan__mark[data-id]") : null;
    if (mark) {
      this.onMarkKey(e, mark.dataset.id!);
      return;
    }
    if (t !== root) return;
    const mod = e.ctrlKey || e.metaKey;
    if (!mod && !e.altKey && /^[1-9]$/.test(e.key) && this.picked && !this.readonly) {
      const c = this.colors[Number(e.key) - 1];
      if (c) {
        e.preventDefault();
        this.highlight(c);
        return;
      }
    }
    if (this.sel.collapsed && this.sel.focus !== null && !mod && !e.altKey && !e.shiftKey) {
      const a = this.annotationAt(this.sel.focus);
      if (a && e.key === "Enter") {
        e.preventDefault();
        this.openComment(a);
        return;
      }
      if (a && (e.key === "Delete" || e.key === "Backspace") && !this.readonly) {
        e.preventDefault();
        this.removeAnnotation(a, "caret");
        return;
      }
    }
    // Esc with the toolbar open: the popover closes it and collapses the selection
    if (e.key === "Escape" && this.bar.pop.open) return;
    this.sel.onKeyDown(e);
  }

  private onMarkKey(e: KeyboardEvent, id: string) {
    const order = this.annotations.filter((a) => this.shown(a) && this.markOf(a.id));
    const at = order.findIndex((a) => a.id === id);
    const a = order[at];
    if (!a) return;
    const go = (i: number) => {
      const target = order[Math.max(0, Math.min(order.length - 1, i))];
      if (!target) return;
      this.activeId = target.id;
      this.markOf(target.id)?.focus();
    };
    const keys: Record<string, () => void> = {
      ArrowRight: () => go(at + 1),
      ArrowDown: () => go(at + 1),
      ArrowLeft: () => go(at - 1),
      ArrowUp: () => go(at - 1),
      Home: () => go(0),
      End: () => go(order.length - 1),
      Enter: () => this.openComment(a),
      Delete: () => this.removeAnnotation(a, "mark"),
      Backspace: () => this.removeAnnotation(a, "mark"),
      Escape: () => {
        this.textRoot?.focus();
        this.sel.select(a.start);
      },
    };
    if (e.ctrlKey || e.metaKey || e.altKey || !keys[e.key]) return;
    e.preventDefault();
    keys[e.key]();
  }

  /** Enter on a mark: write or edit its comment; read-only, focus its note so it's read */
  private openComment(a: TextAnnotation) {
    this.hotId = a.id;
    if (this.readonly) {
      this.focusAfter = () => this.querySelector<HTMLElement>(`.ui-tan__note[data-id="${CSS.escape(a.id)}"]`);
      this.requestUpdate();
      return;
    }
    this.startEdit(a);
  }

  private onUndoKey = (e: KeyboardEvent) => {
    if (!this.undo || e.defaultPrevented || !(e.ctrlKey || e.metaKey) || e.shiftKey || e.key.toLowerCase() !== "z") return;
    if ((e.target as HTMLElement).closest?.("textarea, input")) return;
    e.preventDefault();
    this.restore();
  };

  private markOf(id: string) {
    return this.querySelector<HTMLElement>(`.ui-tan__mark[data-first][data-id="${CSS.escape(id)}"]`);
  }
  private noteButton(id: string, kind?: string) {
    const note = this.querySelector(`.ui-tan__note[data-id="${CSS.escape(id)}"]`);
    return (kind ? note?.querySelector<HTMLElement>(`.ui-tan__act[data-kind="${kind}"]`) : null) ?? note?.querySelector<HTMLElement>(".ui-tan__act") ?? null;
  }

  /* ---------- Layout ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const list = this.annotations.filter((a) => this.shown(a));
    if (!list.some((a) => a.id === this.activeId)) this.activeId = list[0]?.id ?? "";
    if (this.editing && !this.value.some((a) => a.id === this.editing!.id)) this.editing = null;
    this.toggleAttribute("data-narrow", this.narrow);
  }

  protected override firstUpdated() {
    const body = this.querySelector<HTMLElement>(".ui-tan__body");
    if (body && typeof ResizeObserver === "function") {
      // A frame later: changing the layout inside the observer's callback would loop
      let frame = 0;
      this.ro = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const narrow = body.clientWidth < NARROW;
          if (narrow !== this.narrow) this.narrow = narrow;
          else this.placeNotes(true);
        });
      });
      this.ro.observe(body);
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    this.placeNotes();
    const f = this.focusAfter;
    if (f) {
      this.focusAfter = null;
      const el = f();
      el?.focus({ preventScroll: false });
      if (el instanceof HTMLTextAreaElement) el.setSelectionRange(el.value.length, el.value.length);
    }
  }

  /** Wide: each note beside its mark, pushed down where they'd overlap. Narrow: a list under the text */
  private placeNotes(settled = false) {
    const rail = this.querySelector<HTMLElement>(".ui-tan__rail");
    const root = this.textRoot;
    if (!rail || !root) return;
    const notes = [...rail.querySelectorAll<HTMLElement>(":scope > .ui-tan__note")];
    if (this.narrow) {
      for (const n of notes) n.style.removeProperty("top");
      rail.style.removeProperty("min-height");
      return;
    }
    // All reads first, then the writes
    const r = rail.getBoundingClientRect();
    const scale = r.height && rail.offsetHeight ? rail.offsetHeight / r.height : 1;
    const gap = 8;
    const wants = notes.map((n) => {
      const m = this.querySelector(`.ui-tan__mark[data-first][data-id="${CSS.escape(n.dataset.id ?? "")}"]`);
      return { n, top: m ? (m.getBoundingClientRect().top - r.top) * scale : 0, h: n.offsetHeight };
    });
    let y = 0;
    for (const w of wants) {
      const top = Math.max(w.top, y);
      w.n.style.top = `${top}px`;
      y = top + w.h + gap;
    }
    rail.style.minHeight = `${Math.max(0, y - gap)}px`;
    // Notes glide to new places once the layout has settled (the observer's first report), not into their first ones
    if (settled) for (const w of wants) if (!w.n.hasAttribute("data-placed")) requestAnimationFrame(() => w.n.setAttribute("data-placed", ""));
  }

  /* ---------- Render ---------- */

  private renderText(list: TextAnnotation[]) {
    type R = { start: number; end: number; a: TextAnnotation; pending?: boolean };
    const ranges: R[] = list.map((a) => ({ start: a.start, end: a.end, a }));
    if (this.draft) ranges.push({ start: this.draft.start, end: this.draft.end, a: this.draft, pending: true });
    const seen = new Set<string>();
    return segments(this.text, ranges).map((seg) => {
      if (!seg.ranges.length) return seg.text;
      const top = seg.ranges[0];
      const a = top.a;
      const first = !seen.has(a.id);
      seen.add(a.id);
      const hot = seg.ranges.some((x) => x.a.id === this.hotId);
      const commentId = a.comment?.trim() && !top.pending ? `${this.uid}-c-${this.indexOf(a.id)}` : undefined;
      const tab = first && !top.pending ? (a.id === this.activeId ? "0" : "-1") : undefined;
      return html`<mark class="ui-tan__mark" data-id=${a.id} data-color=${this.colorOf(a)} ?data-first=${first} ?data-pending=${!!top.pending} ?data-resolved=${!!a.resolved} ?data-hot=${hot} ?data-multi=${seg.ranges.length > 1} tabindex=${ifDefined(tab)} aria-describedby=${ifDefined(first ? commentId : undefined)} @focus=${() => this.onMarkFocus(a.id)} @blur=${() => (this.hotId = "")} @mouseenter=${() => (this.hotId = a.id)} @mouseleave=${() => (this.hotId = "")}>${first ? html`<span class="ui-tan__sr" data-tc-skip>${top.pending ? "New comment" : this.describe(a)}: </span>` : nothing}${seg.text}</mark>`;
    });
  }

  private onMarkFocus(id: string) {
    this.activeId = id;
    this.hotId = id;
  }

  private indexOf(id: string) {
    return this.value.findIndex((a) => a.id === id);
  }

  private renderToolbar() {
    if (!this.bar.pop.open) return nothing;
    return html`<div class="tc-pop ui-tan__pop" role="toolbar" aria-label="Selection">
      ${this.readonly
        ? nothing
        : html`${this.colors.map(
              (c, i) => html`<button type="button" class="ui-tan__tool ui-tan__swatch" data-color=${c} aria-label=${`Highlight ${this.nameOf(c).toLowerCase()}`} title=${`${this.nameOf(c)} (${i + 1})`} @click=${() => this.highlight(c)}>
                <span class="ui-tan__chip" aria-hidden="true"></span>
              </button>`,
            )}
            <span class="ui-tan__sep" aria-hidden="true"></span>
            <button type="button" class="ui-tan__tool ui-tan__tool--text" @click=${() => this.startComment()}>${commentIcon}<span>Comment</span></button>`}
      <button type="button" class="ui-tan__tool ui-tan__tool--text" @click=${() => void this.copy()}>${copyIcon}<span>Copy</span></button>
    </div>`;
  }

  private renderFilters(list: TextAnnotation[]) {
    if (!list.length) return nothing;
    const f = this.filter;
    const used = this.colors.filter((c) => list.some((a) => this.colorOf(a) === c));
    const authors = [...new Set(list.map((a) => a.author ?? "").filter(Boolean))];
    const anyResolved = list.some((a) => a.resolved);
    const shown = list.filter((a) => this.shown(a)).length;
    const toggle = <T,>(arr: T[], x: T) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x]);
    const filtered = shown !== list.length || f.colors.length || f.authors.length || !f.resolved;
    return html`<div class="ui-tan__filters">
      <div class="ui-tan__filterbar" role="toolbar" aria-label="Filter annotations" @keydown=${this.filters.onKeyDown} @focusin=${this.filters.onFocusIn}>
        ${used.length > 1
          ? used.map(
              (c) => html`<button type="button" class="ui-tan__filter" data-color=${c} aria-pressed=${f.colors.includes(c) ? "true" : "false"} @click=${() => this.setFilter({ ...f, colors: toggle(f.colors, c) })}>
                <span class="ui-tan__dot" aria-hidden="true"></span>${this.nameOf(c)} <span class="ui-tan__n">${list.filter((a) => this.colorOf(a) === c).length}</span>
              </button>`,
            )
          : nothing}
        ${authors.length > 1
          ? authors.map(
              (name) => html`<button type="button" class="ui-tan__filter" data-kind="author" aria-pressed=${f.authors.includes(name) ? "true" : "false"} @click=${() => this.setFilter({ ...f, authors: toggle(f.authors, name) })}>${name}</button>`,
            )
          : nothing}
        ${anyResolved
          ? html`<button type="button" class="ui-tan__filter" data-kind="open" aria-pressed=${f.resolved ? "false" : "true"} @click=${() => this.setFilter({ ...f, resolved: !f.resolved })}>Open only</button>`
          : nothing}
      </div>
      <span class="ui-tan__shown">${filtered ? html`${shown} of ${list.length} shown` : plural(list.length, "annotation")}</span>
      ${filtered ? html`<button type="button" class="ui-tan__clear" @click=${() => this.setFilter(ALL)}>Show all</button>` : nothing}
    </div>`;
  }

  private renderNote(a: TextAnnotation, pending = false) {
    const color = this.colorOf(a);
    const editing = pending ? { comment: this.draft!.comment, color: this.draft!.color } : this.editing?.id === a.id ? this.editing : null;
    const quote = shorten(this.quoteOf(a), 80);
    const commentId = `${this.uid}-c-${this.indexOf(a.id)}`;
    const metaId = `${this.uid}-m-${pending ? "draft" : this.indexOf(a.id)}`;
    const time = this.when(a.at);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      if (pending) this.cancelDraft();
      else if (editing) this.cancelEdit();
      else this.markOf(a.id)?.focus();
    };
    return html`<li
      class="ui-tan__note"
      data-id=${a.id}
      data-color=${editing?.color ?? color}
      ?data-resolved=${!!a.resolved}
      ?data-hot=${this.hotId === a.id}
      ?data-editing=${!!editing}
      tabindex=${ifDefined(this.readonly ? "-1" : undefined)}
      aria-labelledby=${metaId}
      @mouseenter=${() => (this.hotId = a.id)}
      @mouseleave=${() => (this.hotId = "")}
      @focusin=${() => (this.hotId = a.id)}
      @keydown=${onKey}
    >
      <div class="ui-tan__meta" id=${metaId}>
        <span class="ui-tan__dot" aria-hidden="true"></span>
        <span class="ui-tan__sr">${this.nameOf(color)} highlight by </span><span class="ui-tan__who">${a.author || (pending ? "You" : "Someone")}</span>
        ${time ? html`<span class="ui-tan__time">${time}</span>` : nothing}
        ${a.resolved ? html`<span class="ui-tan__pill">Resolved</span>` : nothing}
      </div>
      <q class="ui-tan__quote">${quote}</q>
      ${editing ? this.renderEditor(a, editing, pending) : a.comment?.trim() ? html`<p class="ui-tan__comment" id=${commentId}>${a.comment}</p>` : nothing}
      ${editing || this.readonly ? nothing : this.renderActions(a, quote)}
    </li>`;
  }

  private renderActions(a: TextAnnotation, quote: string) {
    const has = !!a.comment?.trim();
    return html`<div class="ui-tan__acts">
      <button type="button" class="ui-tan__act" data-kind="edit" aria-label=${`${has ? "Edit comment" : "Comment"} on “${quote}”`} title=${has ? "Edit" : "Comment"} @click=${() => this.startEdit(a)}>${has ? pencilIcon : commentIcon}</button>
      <button type="button" class="ui-tan__act" data-kind="resolve" aria-label=${`${a.resolved ? "Reopen" : "Resolve"} “${quote}”`} title=${a.resolved ? "Reopen" : "Resolve"} @click=${() => this.toggleResolved(a)}>${a.resolved ? reopenIcon : checkIcon}</button>
      <button type="button" class="ui-tan__act" data-kind="remove" aria-label=${`Remove highlight “${quote}”`} title="Remove" @click=${() => this.removeAnnotation(a, "note")}>${trashIcon}</button>
    </div>`;
  }

  private renderEditor(a: TextAnnotation, e: { comment: string; color: HighlightColor }, pending: boolean) {
    const set = (patch: Partial<{ comment: string; color: HighlightColor }>) => {
      if (pending && this.draft) this.draft = { ...this.draft, ...patch };
      else if (this.editing) this.editing = { ...this.editing, ...patch };
    };
    const save = () => (pending ? this.saveDraft() : this.saveEdit());
    const onSwatchKey = (ev: KeyboardEvent) => {
      const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(ev.key in step)) return;
      ev.preventDefault();
      const i = this.colors.indexOf(e.color);
      const c = this.colors[(i + step[ev.key] + this.colors.length) % this.colors.length];
      set({ color: c });
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-tan__note[data-id="${CSS.escape(a.id)}"] .ui-tan__pick[data-color="${c}"]`)?.focus());
    };
    return html`<div class="ui-tan__editor">
      <div class="ui-tan__picks" role="radiogroup" aria-label="Colour" @keydown=${onSwatchKey}>
        ${this.colors.map(
          (c) => html`<button type="button" role="radio" class="ui-tan__pick" data-color=${c} aria-checked=${c === e.color ? "true" : "false"} aria-label=${this.nameOf(c)} tabindex=${c === e.color ? "0" : "-1"} @click=${() => set({ color: c })}>
            <span class="ui-tan__chip" aria-hidden="true"></span>
          </button>`,
        )}
      </div>
      <textarea
        class="ui-tan__input"
        rows="3"
        aria-label=${`Comment on “${shorten(this.quoteOf(a))}”`}
        placeholder="Add a comment…"
        .value=${live(e.comment)}
        @input=${(ev: Event) => set({ comment: (ev.target as HTMLTextAreaElement).value })}
        @keydown=${(ev: KeyboardEvent) => {
          if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
            ev.preventDefault();
            save();
          }
        }}
      ></textarea>
      <div class="ui-tan__editor-acts">
        <button type="button" class="ui-tan__btn" data-kind="cancel" @click=${() => (pending ? this.cancelDraft() : this.cancelEdit())}>Cancel</button>
        <button type="button" class="ui-tan__btn" data-kind="save" @click=${save}>${pending ? "Comment" : "Save"}</button>
      </div>
    </div>`;
  }

  protected override render() {
    const all = this.annotations;
    const list = all.filter((a) => this.shown(a));
    const clean = this.resolvedLook === "clean";
    const titleId = `${this.uid}-title`;
    const comments = all.filter((a) => a.comment?.trim() && !a.resolved).length;
    const head = cardHead({
      icon: markIcon,
      title: this.heading,
      subtitle: this.description,
      id: titleId,
      aside: all.length ? html`<span class="ui-tan__count">${plural(all.length, "highlight")}${comments ? html`<span aria-hidden="true"> · </span><span class="ui-tan__sr">, </span>${plural(comments, "open comment")}` : nothing}</span>` : nothing,
    });
    const notes = [...list];
    const draft = this.draft;
    if (draft) notes.splice(notes.filter((a) => a.start <= draft.start).length, 0, draft);
    return html`
      ${clean ? nothing : head}
      <div class="ui-tan__card">
        ${clean ? head : nothing}
        ${this.renderFilters(all)}
        <div class="ui-tan__body">
          <div class="ui-tan__doc">
            <div class="ui-tan__text" role="document" tabindex="0" aria-label=${this.textLabel} aria-describedby=${`${this.uid}-hint`} @keydown=${this.onTextKey}>${this.renderText(list)}</div>
            <span class="ui-tan__caret" aria-hidden="true" hidden></span>
            ${this.renderToolbar()}
          </div>
          <ul class="ui-tan__rail" aria-label="Notes">
            ${repeat(notes, (a) => a.id, (a) => this.renderNote(a, a === draft))}
            ${notes.length ? nothing : html`<li class="ui-tan__empty">${this.readonly ? "No annotations yet." : this.emptyText}</li>`}
          </ul>
        </div>
        ${this.undo
          ? html`<div class="ui-tan__undo">
              <span>${this.nameOf(this.colorOf(this.undo.annotation))} highlight removed</span>
              <button type="button" class="ui-tan__btn" data-kind="undo" @click=${() => this.restore()}>Undo</button>
            </div>`
          : nothing}
      </div>
      <p class="ui-tan__hint" id=${`${this.uid}-hint`} hidden>
        ${this.readonly
          ? "Select text with Shift and the arrow keys, then press Tab to copy it."
          : "Select text with Shift and the arrow keys, then press Tab to highlight it, comment on it or copy it, or press 1 to 5 to highlight it in a colour."}
      </p>
      <span class="ui-tan__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
/* Sizes as variables – override them on [data-ui="tan"] */
[data-ui="tan"] {
  --tc-text-annotator-rail: 248px;
  --tc-text-annotator-measure: 68ch;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tan"] {
  --tc-text-annotator-panel-bg: var(--tc-surface-on-tray);
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tan"] { --tc-text-annotator-panel-bg: var(--tc-surface-raised); }
[data-ui="tan"] *, [data-ui="tan"] *::before, [data-ui="tan"] *::after { box-sizing: border-box; }
:where([data-ui="tan"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="tan"]) :is(p, ul, li, q) { margin: 0; padding: 0; }
:where([data-ui="tan"]) ul { list-style: none; }
[data-ui="tan"] :is(button, [tabindex], textarea):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tan__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; user-select: none; -webkit-user-select: none; }
.ui-tan__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-tan__glyph { stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-tan__glyph { stroke-width: 1.4; }
/* Each colour's fill and ink */
[data-ui="tan"] [data-color="yellow"] { --tan-bg: var(--tc-highlight-yellow-bg); --tan-fg: var(--tc-highlight-yellow-fg); }
[data-ui="tan"] [data-color="green"] { --tan-bg: var(--tc-highlight-green-bg); --tan-fg: var(--tc-highlight-green-fg); }
[data-ui="tan"] [data-color="blue"] { --tan-bg: var(--tc-highlight-blue-bg); --tan-fg: var(--tc-highlight-blue-fg); }
[data-ui="tan"] [data-color="pink"] { --tan-bg: var(--tc-highlight-pink-bg); --tan-fg: var(--tc-highlight-pink-fg); }
[data-ui="tan"] [data-color="purple"] { --tan-bg: var(--tc-highlight-purple-bg); --tan-fg: var(--tc-highlight-purple-fg); }
/* ----- The header's count ----- */
.ui-tan__count { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; white-space: nowrap; }
/* ----- The card ----- */
.ui-tan__card { display: grid; min-width: 0; border-radius: var(--tc-card-radius); background: var(--tc-text-annotator-panel-bg); box-shadow: var(--tc-card-shadow); }
/* Filters: a row of toggles above the document */
.ui-tan__filters { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-tan__card > .tc-head + .ui-tan__filters { padding-top: 0; }
.ui-tan__filterbar { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); min-width: 0; }
.ui-tan__filterbar:empty { display: none; }
.ui-tan__filter { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); box-shadow: inset 0 0 0 1px var(--tc-border-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tan__filter:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-tan__filter[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-accent-text); }
.ui-tan__n { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-tan__shown { margin-left: auto; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-tan__clear { color: var(--tc-accent-text); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); }
.ui-tan__clear:hover { text-decoration: underline; }
/* The document and the rail side by side */
.ui-tan__body { display: grid; grid-template-columns: minmax(0, 1fr) var(--tc-text-annotator-rail); gap: var(--tc-space-5); align-items: start; padding: var(--tc-space-5) var(--tc-space-4) var(--tc-space-5) var(--tc-space-6); }
:where([data-look="clean"], [data-look="clean"] *).ui-tan__body { gap: var(--tc-space-6); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-5) var(--tc-space-5); }
[data-ui="tan"][data-narrow] .ui-tan__body { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-4); padding: var(--tc-space-4); }
.ui-tan__doc { position: relative; min-width: 0; }
.ui-tan__text { max-width: var(--tc-text-annotator-measure); color: var(--tc-text-primary); font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-loose); white-space: pre-wrap; overflow-wrap: break-word; cursor: text; border-radius: var(--tc-radius-xs); }
:where([data-look="clean"], [data-look="clean"] *).ui-tan__text { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-secondary); }
.ui-tan__text:focus-visible { outline-offset: var(--tc-space-1); }
.ui-tan__text::selection, .ui-tan__text ::selection { background: var(--tc-accent-highlight); }
/* The caret in caret mode: drawn by the selection controller */
.ui-tan__caret { position: absolute; top: 0; left: -1px; width: 2px; border-radius: var(--tc-radius-2xs); background: var(--tc-accent); pointer-events: none; animation: ui-tan-blink var(--tc-duration-shimmer) steps(1) infinite; }
.ui-tan__caret[hidden] { display: none; }
@keyframes ui-tan-blink { 50% { opacity: 0; } }
/* Marks: the highlight fill and its ink */
.ui-tan__mark { padding: var(--tc-space-0-5) 0; border-radius: var(--tc-radius-2xs); background: var(--tan-bg); color: var(--tan-fg); box-decoration-break: clone; -webkit-box-decoration-break: clone; cursor: text; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tan__mark[data-multi] { box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--tan-fg) 45%, transparent); }
.ui-tan__mark[data-hot] { box-shadow: inset 0 -2px 0 var(--tan-fg); }
.ui-tan__mark[data-resolved] { background: none; color: inherit; text-decoration: underline dotted var(--tan-fg); text-decoration-thickness: 2px; text-underline-offset: 3px; }
.ui-tan__mark[data-pending] { box-shadow: inset 0 0 0 1px var(--tan-fg); }
.ui-tan__mark:focus-visible { outline-offset: 1px; }
/* ----- The rail ----- */
.ui-tan__rail { position: relative; min-width: 0; }
[data-ui="tan"]:not([data-narrow]) .ui-tan__rail > .ui-tan__note { position: absolute; top: 0; right: 0; left: 0; }
[data-ui="tan"]:not([data-narrow]) .ui-tan__rail > .ui-tan__note[data-placed] { transition: top var(--tc-duration-base) var(--tc-ease-move); }
[data-ui="tan"][data-narrow] .ui-tan__rail { display: grid; gap: var(--tc-space-2); padding-top: var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-tan__empty { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-tan__note { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2-5) var(--tc-space-3); border-left: 3px solid var(--tan-bg); color: var(--tc-text-secondary); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); }
:where([data-look="standard"], [data-look="standard"] *).ui-tan__note { border-radius: var(--tc-radius-lg); background: var(--tc-surface-control); box-shadow: var(--tc-shadow-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-tan__note[data-hot] { box-shadow: var(--tc-shadow-raised-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-tan__note { border-radius: var(--tc-radius-sm); padding: var(--tc-space-2) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-tan__note[data-hot] { background: var(--tc-fill-hover); }
.ui-tan__note[data-resolved]:not([data-editing]) { color: var(--tc-text-muted); }
.ui-tan__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-tan__dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--tan-fg); }
.ui-tan__note .ui-tan__dot, .ui-tan__filter .ui-tan__dot { background: color-mix(in srgb, var(--tan-fg) 70%, var(--tan-bg)); }
.ui-tan__who { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-tan__time { color: var(--tc-text-muted); white-space: nowrap; }
.ui-tan__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); }
/* The quote: only where the note isn't beside its mark */
.ui-tan__quote { display: none; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); quotes: "“" "”"; white-space: nowrap; text-overflow: ellipsis; }
[data-ui="tan"][data-narrow] .ui-tan__quote { display: block; }
.ui-tan__comment { color: var(--tc-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-tan__note[data-resolved] .ui-tan__comment { color: var(--tc-text-muted); }
/* Actions: ghost icon buttons, quiet until the note is hot */
.ui-tan__acts { display: flex; gap: var(--tc-space-0-5); margin: 0 calc(var(--tc-space-1) * -1) calc(var(--tc-space-1) * -1); }
.ui-tan__act { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tan__act:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-tan__act[data-kind="remove"]:hover { color: var(--tc-status-danger-fg); }
/* The editor: colour, comment, Cancel / Save */
.ui-tan__editor { display: grid; gap: var(--tc-space-2); }
.ui-tan__picks { display: flex; gap: var(--tc-space-1); }
.ui-tan__pick { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: 50%; }
.ui-tan__pick[aria-checked="true"] { box-shadow: inset 0 0 0 2px var(--tc-text-muted); }
.ui-tan__chip { display: block; width: 16px; height: 16px; border-radius: 50%; background: var(--tan-bg); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tan-fg) 35%, transparent); }
.ui-tan__input { display: block; width: 100%; min-height: calc(var(--tc-line-height-snug) * 3 + var(--tc-space-2) * 2); padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); line-height: var(--tc-line-height-snug); resize: vertical; }
.ui-tan__input::placeholder { color: var(--tc-text-placeholder); }
.ui-tan__input:focus { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-tan__editor-acts { display: flex; justify-content: flex-end; gap: var(--tc-space-1-5); }
.ui-tan__btn { display: inline-flex; align-items: center; justify-content: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tan__btn[data-kind="save"] { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-tan__btn[data-kind="save"]:hover { background: var(--tc-action-primary-bg-hover); }
.ui-tan__btn:is([data-kind="cancel"], [data-kind="undo"]) { color: var(--tc-action-ghost-fg); }
.ui-tan__btn:is([data-kind="cancel"], [data-kind="undo"]):hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* Undo after a removal */
.ui-tan__undo { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); animation: ui-tan-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
/* ----- The selection toolbar (internal/popover.ts places it) ----- */
.ui-tan__pop { display: flex; align-items: center; gap: var(--tc-space-0-5); }
.ui-tan__tool { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); min-width: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); font-family: var(--tc-font-sans); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tan__tool--text { padding: 0 var(--tc-control-px-sm); }
.ui-tan__tool:hover { background: var(--tc-menu-item-hover); color: var(--tc-text-primary); }
.ui-tan__tool:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-tan__swatch .ui-tan__chip { width: 18px; height: 18px; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tan__swatch:hover .ui-tan__chip { transform: scale(1.12); }
.ui-tan__sep { flex: none; width: 1px; height: 18px; margin: 0 var(--tc-space-1); background: var(--tc-divider); }
@keyframes ui-tan-in { from { opacity: 0; transform: translateY(2px); } }
@media (forced-colors: active) {
  .ui-tan__mark { forced-color-adjust: none; background: Mark; color: MarkText; }
  .ui-tan__mark[data-resolved] { background: none; color: CanvasText; text-decoration-color: CanvasText; }
  .ui-tan__mark:is([data-hot], [data-pending]) { outline: 2px solid Highlight; }
  .ui-tan__note { border: 1px solid CanvasText; }
  .ui-tan__dot, .ui-tan__chip { forced-color-adjust: none; background: Mark; border: 1px solid CanvasText; }
  .ui-tan__caret { background: CanvasText; }
}
@media (pointer: coarse) {
  .ui-tan__tool, .ui-tan__act, .ui-tan__pick, .ui-tan__btn { height: var(--tc-control-h-md); min-width: var(--tc-control-h-md); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="tan"] *, [data-ui="tan"] *::before, [data-ui="tan"] *::after, .ui-tan__pop * { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-text-annotator")) customElements.define("tc-text-annotator", TcTextAnnotator);

declare global {
  interface HTMLElementTagNameMap {
    "tc-text-annotator": TcTextAnnotator;
  }
}

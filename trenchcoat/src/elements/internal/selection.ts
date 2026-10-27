import { html, type ReactiveController, type ReactiveControllerHost } from "lit";

/*
 * Text selection inside an element (remediation 6.0) – shared by text-annotator, response-selection,
 * selection-translate and isbn-details.
 *
 * Everything is in **text offsets**: UTF-16 indices into the root's plain text – the text of its text nodes in order,
 * skipping anything inside `[data-tc-skip]` (screen-reader-only text, tags, a drawn caret). Offsets are what a
 * component stores, so a selection or a highlight survives a Lit re-render that replaces every DOM node; DOM ranges
 * are made from offsets only when needed (`rangeOf`, `pointAt`).
 *
 *   Rendering the text. Draw it from offsets – don't wrap DOM ranges after the fact:
 *     html`<div class="ui-x__text">${marks(this.text, this.highlights, (seg) => html`<mark>${seg.text}</mark>`)}</div>`
 *   `segments()` splits the text at every range boundary; each segment knows the ranges that cover it (innermost
 *   first), so overlapping ranges just work. The root's text nodes must add up to the text exactly – keep stray
 *   whitespace out of the template inside the root, and put anything extra (an sr-only label) in [data-tc-skip].
 *
 *   Following the selection:
 *     sel = new SelectionController(this, { root: () => this.querySelector(".ui-x__text"), caret: true,
 *                                           caretEl: () => this.querySelector(".ui-x__caret"),
 *                                           onChange: (s, how) => { this.picked = s; if (how.final) this.showToolbar(); } });
 *     <div class="ui-x__text" tabindex="0" @keydown=${(e) => this.sel.onKeyDown(e)}>…</div><span class="ui-x__caret"></span>
 *   · pointer: the native selection is read on selectionchange (`final: false` while the pointer is down, `true` when
 *     it's released, and for touch-handle or programmatic changes); a selection partly outside the root is clamped
 *   · keyboard (caret mode, for read-only text): the root is focusable; ← → move the caret a character, Ctrl/Alt + ← →
 *     a word, ⌘ + ← → (Home / End) to the line's ends, ↑ ↓ a line, Ctrl/⌘ + Home / End to the text's ends; Shift
 *     extends; Ctrl/⌘ + A selects all; Esc collapses a selection. `onKeyDown` returns true when it used the key
 *   · the selection is mirrored into the native one (so ::selection paints it and Ctrl/⌘ + C copies it), and put back
 *     after a re-render replaced the nodes it was in
 *   · it reports `start`, `end`, `text`, `rect()` / `rects()` (viewport pixels) – what a popover anchors to
 *   · `caretEl`, if given, is positioned (absolutely, in its offset parent) at the caret while the root has focus and
 *     nothing is selected – the controller writes its transform and height and toggles `hidden`
 */

/** A span of the text, as UTF-16 offsets; `end` is exclusive */
export type TextRange = { start: number; end: number };

/** What the controller reports */
export type TextSelection = {
  /** Where the selection began and where it ends now – focus can be before anchor */
  anchor: number;
  focus: number;
  /** min / max of anchor and focus */
  start: number;
  end: number;
  /** The selected text (empty when collapsed) */
  text: string;
  collapsed: boolean;
};

export type SelectionCause = { cause: "pointer" | "keyboard" | "api"; /** The person has finished: pointer released, or a key */ final: boolean };

export type SelectionOptions = {
  /** The element whose text is selectable. May be re-rendered; it's re-read every time */
  root: () => HTMLElement | null;
  /** Caret mode: the root takes the keyboard (wire `onKeyDown`); default false */
  caret?: boolean | (() => boolean);
  /** An element the controller places at the caret (see above) */
  caretEl?: () => HTMLElement | null;
  /** Called when the selection changes (null: nothing selected or no caret) */
  onChange?: (selection: TextSelection | null, how: SelectionCause) => void;
};

/** Text inside these doesn't count: screen-reader labels, tags, drawn carets */
export const SKIP = "[data-tc-skip]";

/* ---------- Offsets ⇄ DOM ---------- */

/** The root's text nodes that count, in document order */
export function textNodes(root: Node): Text[] {
  const out: Text[] = [];
  const walker = (root.ownerDocument ?? (root as Document)).createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeType === Node.ELEMENT_NODE ? ((n as Element).matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP) : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
  return out;
}

/** The root's plain text, as offsets count it */
export function textOf(root: Node) {
  return textNodes(root).map((t) => t.data).join("");
}

/**
 * A DOM point → its offset in the root's text. A point before the root is 0, after it the text's length; a point
 * inside skipped content counts as where that content sits.
 */
export function offsetOf(root: Node, node: Node, offset: number): number {
  const doc = root.ownerDocument ?? (root as Document);
  const nodes = textNodes(root);
  const whole = doc.createRange();
  whole.selectNodeContents(root);
  const length = () => nodes.reduce((n, t) => n + t.length, 0);
  if (!root.contains(node)) {
    // comparePoint throws for a node in another document; that point is simply outside
    try {
      return whole.comparePoint(node, offset) < 0 ? 0 : length();
    } catch {
      return 0;
    }
  }
  const point = doc.createRange();
  point.setStart(node, offset);
  let at = 0;
  for (const t of nodes) {
    if (t === node) return at + Math.min(offset, t.length);
    // The text node starts at or after the point: the point sits before it
    if (point.comparePoint(t, 0) >= 0) return at;
    at += t.length;
  }
  return at;
}

/**
 * An offset → a DOM point. Where two text nodes meet, "forward" gives the start of the next one (what a range's start
 * wants – it doesn't begin with an empty piece of the previous node) and "backward" the end of the previous one.
 */
export function pointAt(root: Node, offset: number, bias: "forward" | "backward" = "forward"): { node: Node; offset: number } {
  const nodes = textNodes(root);
  let at = 0;
  for (let i = 0; i < nodes.length; i++) {
    const t = nodes[i];
    const end = at + t.length;
    if (offset < end || (offset === end && (bias === "backward" || i === nodes.length - 1))) return { node: t, offset: Math.max(0, offset - at) };
    at = end;
  }
  return { node: root, offset: root.childNodes.length };
}

/** A DOM range over [start, end) of the root's text */
export function rangeOf(root: Node, start: number, end: number): Range {
  const doc = root.ownerDocument ?? (root as Document);
  const range = doc.createRange();
  const a = pointAt(root, Math.min(start, end), "forward");
  const b = start === end ? a : pointAt(root, Math.max(start, end), "backward");
  range.setStart(a.node, a.offset);
  range.setEnd(b.node, b.offset);
  return range;
}

type CaretDoc = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

/** The text offset under a viewport point, or null when the point isn't over the root's text */
export function offsetFromPoint(root: HTMLElement, x: number, y: number): number | null {
  const doc = root.ownerDocument as CaretDoc;
  let node: Node | null = null;
  let off = 0;
  if (typeof doc.caretPositionFromPoint === "function") {
    const p = doc.caretPositionFromPoint(x, y);
    if (p) [node, off] = [p.offsetNode, p.offset];
  } else if (typeof doc.caretRangeFromPoint === "function") {
    const r = doc.caretRangeFromPoint(x, y);
    if (r) [node, off] = [r.startContainer, r.startOffset];
  }
  if (!node || !root.contains(node)) return null;
  return offsetOf(root, node, off);
}

/**
 * Where a caret at `offset` is drawn, in viewport pixels. Collapsed ranges give no box in some engines, so it measures
 * the character after the offset (its left edge) or, at the end of the text, the one before it (its right edge).
 */
export function caretRectAt(root: HTMLElement, offset: number): DOMRect | null {
  const text = textOf(root);
  if (!text.length) {
    const r = root.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(root).lineHeight) || parseFloat(getComputedStyle(root).fontSize) * 1.5 || 16;
    const pad = parseFloat(getComputedStyle(root).paddingLeft) || 0;
    const top = parseFloat(getComputedStyle(root).paddingTop) || 0;
    return new DOMRect(r.left + pad, r.top + top, 0, lh);
  }
  // The character after the caret, unless the caret ends a line of text (a line break follows text): then the one
  // before. A line break that starts an empty line is measured itself – its box is that line's start
  const lineEnd = offset >= text.length || (text[offset] === "\n" && offset > 0 && text[offset - 1] !== "\n");
  const measure = (useAfter: boolean) => {
    const i = useAfter ? offset : offset - 1;
    if (i < 0 || i >= text.length) return null;
    const rects = [...rangeOf(root, i, nextGrapheme(text, i)).getClientRects()].filter((r) => r.height > 0);
    const box = useAfter ? rects[0] : rects[rects.length - 1];
    return box ? new DOMRect(useAfter ? box.left : box.right, box.top, 0, box.height) : null;
  };
  return measure(!lineEnd) ?? measure(lineEnd);
}

/* ---------- Characters and words ---------- */

type Seg = { segment(text: string): Iterable<{ index: number; segment: string; isWordLike?: boolean }> & { containing(i: number): { index: number; segment: string } | undefined } };
const Segmenter = (globalThis.Intl as unknown as { Segmenter?: new (locale?: string, o?: { granularity: string }) => Seg }).Segmenter;
const graphemes = Segmenter ? new Segmenter(undefined, { granularity: "grapheme" }) : null;
const wordSeg = Segmenter ? new Segmenter(undefined, { granularity: "word" }) : null;

/** The offset after the character (grapheme: an emoji, a letter with its accents) at `i` */
export function nextGrapheme(text: string, i: number) {
  if (i >= text.length) return text.length;
  if (graphemes) {
    const s = graphemes.segment(text).containing(i);
    if (s) return s.index + s.segment.length;
  }
  const c = text.charCodeAt(i);
  return c >= 0xd800 && c <= 0xdbff && i + 1 < text.length ? i + 2 : i + 1;
}

/** The offset before the character that ends at `i` */
export function prevGrapheme(text: string, i: number) {
  if (i <= 0) return 0;
  if (graphemes) {
    const s = graphemes.segment(text).containing(i - 1);
    if (s) return s.index;
  }
  const c = text.charCodeAt(i - 1);
  return c >= 0xdc00 && c <= 0xdfff && i >= 2 ? i - 2 : i - 1;
}

let wordsMemo: { text: string; words: [number, number][] } = { text: "", words: [] };
/** The words of a text as [start, end) pairs – Intl.Segmenter where there is one, letters and digits otherwise */
export function words(text: string): [number, number][] {
  if (wordsMemo.text === text) return wordsMemo.words;
  const out: [number, number][] = [];
  if (wordSeg) {
    for (const s of wordSeg.segment(text)) if (s.isWordLike) out.push([s.index, s.index + s.segment.length]);
  } else for (const m of text.matchAll(/[\p{L}\p{N}_]+(?:['’][\p{L}\p{N}_]+)*/gu)) out.push([m.index!, m.index! + m[0].length]);
  wordsMemo = { text, words: out };
  return out;
}

/** Ctrl/Alt + →: the end of the word at or after `i` */
export function nextWordEnd(text: string, i: number) {
  return words(text).find(([, b]) => b > i)?.[1] ?? text.length;
}

/** Ctrl/Alt + ←: the start of the word before `i` */
export function prevWordStart(text: string, i: number) {
  const w = words(text);
  for (let k = w.length - 1; k >= 0; k--) if (w[k][0] < i) return w[k][0];
  return 0;
}

/** The range without the white space at either end; an all-space range collapses to its start */
export function trimRange(text: string, start: number, end: number): TextRange {
  let a = Math.max(0, Math.min(start, end));
  let b = Math.min(text.length, Math.max(start, end));
  while (a < b && /\s/.test(text[a])) a++;
  while (b > a && /\s/.test(text[b - 1])) b--;
  return { start: a, end: b };
}

/* ---------- Rendering text from offsets ---------- */

/** A piece of the text between two boundaries, with the ranges that cover all of it – shortest (innermost) first */
export type Segment<R extends TextRange = TextRange> = { start: number; end: number; text: string; ranges: R[] };

/**
 * Splits `text` at every boundary of `ranges`. Ranges are clamped to the text; empty and invalid ones are ignored.
 * Covering ranges are sorted shortest first, then by their order in `ranges`, so `seg.ranges[0]` is the one to paint.
 */
export function segments<R extends TextRange>(text: string, ranges: readonly R[]): Segment<R>[] {
  const n = text.length;
  const valid = ranges
    .map((r, i) => ({ r, i, a: Math.max(0, Math.min(n, Math.floor(r.start))), b: Math.max(0, Math.min(n, Math.floor(r.end))) }))
    .filter((x) => Number.isFinite(x.a) && Number.isFinite(x.b) && x.b > x.a);
  const cuts = [...new Set([0, n, ...valid.flatMap((x) => [x.a, x.b])])].sort((p, q) => p - q);
  const out: Segment<R>[] = [];
  const index = new Map<number, number>();
  for (let k = 0; k < cuts.length - 1; k++) {
    if (cuts[k] === cuts[k + 1]) continue;
    index.set(cuts[k], out.length);
    out.push({ start: cuts[k], end: cuts[k + 1], text: text.slice(cuts[k], cuts[k + 1]), ranges: [] });
  }
  const cover = new Map<Segment<R>, { r: R; i: number; len: number }[]>();
  for (const x of valid)
    for (let s = index.get(x.a)!; s < out.length && out[s].end <= x.b; s++) {
      const list = cover.get(out[s]) ?? [];
      list.push({ r: x.r, i: x.i, len: x.b - x.a });
      cover.set(out[s], list);
    }
  for (const [seg, list] of cover) seg.ranges = list.sort((p, q) => p.len - q.len || p.i - q.i).map((x) => x.r);
  return out;
}

/**
 * The text as template parts: plain strings for uncovered pieces, `mark(seg, i)` for covered ones (default a bare
 * <mark>). Put the result straight inside the selectable root.
 */
export function marks<R extends TextRange>(text: string, ranges: readonly R[], mark: (seg: Segment<R>, i: number) => unknown = (seg) => html`<mark>${seg.text}</mark>`): unknown[] {
  return segments(text, ranges).map((seg, i) => (seg.ranges.length ? mark(seg, i) : seg.text));
}

/* ---------- The controller ---------- */

type Host = ReactiveControllerHost & HTMLElement;

const isApple = () => /mac|iphone|ipad|ipod/i.test((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.userAgent);

/** Follows the selection in one root, by pointer and (in caret mode) by keyboard. See the file header */
export class SelectionController implements ReactiveController {
  /** Where the selection began; null when there's no caret or selection */
  anchor: number | null = null;
  /** Where it ends (the caret) */
  focus: number | null = null;

  private pointerDown = false;
  /** A pointer gesture just ended: report the selection even if it didn't change (the toolbar opens on release) */
  private released = false;
  private frame = 0;
  /** The x a run of ↑ ↓ keeps to, as a caret does in a text editor */
  private goalX: number | null = null;
  /** The native selection showed ours before an update; put it back if the update replaced its nodes */
  private owned = false;
  private last = "";

  constructor(
    private host: Host,
    private options: SelectionOptions,
  ) {
    host.addController(this);
  }

  /* ----- What it reports ----- */

  get start() {
    return this.anchor === null || this.focus === null ? null : Math.min(this.anchor, this.focus);
  }
  get end() {
    return this.anchor === null || this.focus === null ? null : Math.max(this.anchor, this.focus);
  }
  get collapsed() {
    return this.anchor === this.focus;
  }
  /** The root's text */
  get source() {
    const root = this.options.root();
    return root ? textOf(root) : "";
  }
  /** The selected text; "" when collapsed or empty */
  get text() {
    const { start, end } = this;
    return start === null || end === null ? "" : this.source.slice(start, end);
  }
  /** The selection as one object, or null */
  get value(): TextSelection | null {
    const { anchor, focus, start, end } = this;
    if (anchor === null || focus === null || start === null || end === null) return null;
    return { anchor, focus, start, end, text: this.text, collapsed: anchor === focus };
  }
  /** The selection's bounding box in viewport pixels (the caret's when collapsed); null without a selection */
  rect(): DOMRect | null {
    const root = this.options.root();
    const { start, end } = this;
    if (!root || start === null || end === null) return null;
    if (start === end) return caretRectAt(root, start);
    return rangeOf(root, start, end).getBoundingClientRect();
  }
  /** One box per line of the selection, in viewport pixels */
  rects(): DOMRect[] {
    const root = this.options.root();
    const { start, end } = this;
    if (!root || start === null || end === null || start === end) return [];
    return [...rangeOf(root, start, end).getClientRects()].filter((r) => r.width > 0 && r.height > 0);
  }

  /* ----- Changing it ----- */

  /** Selects [anchor, focus) (or places the caret when equal) and mirrors it into the native selection */
  select(anchor: number, focus = anchor, how: SelectionCause = { cause: "api", final: true }) {
    const n = this.source.length;
    this.anchor = Math.max(0, Math.min(n, anchor));
    this.focus = Math.max(0, Math.min(n, focus));
    this.apply();
    this.notify(how);
  }

  /** Forgets the selection and clears the native one if it was ours */
  clear(how: SelectionCause = { cause: "api", final: true }) {
    const had = this.anchor !== null;
    const root = this.options.root();
    const native = root?.ownerDocument.getSelection();
    if (root && native?.rangeCount && root.contains(native.getRangeAt(0).commonAncestorContainer)) native.removeAllRanges();
    this.anchor = this.focus = null;
    this.placeCaret();
    if (had) this.notify(how);
  }

  /** Caret-mode keys; returns true (and prevents the default) when the key moved the caret or the selection */
  onKeyDown = (e: KeyboardEvent): boolean => {
    const caret = typeof this.options.caret === "function" ? this.options.caret() : !!this.options.caret;
    const root = this.options.root();
    if (!caret || !root || e.target !== root || e.isComposing) return false;
    const text = this.source;
    const apple = isApple();
    const mod = apple ? e.metaKey : e.ctrlKey;
    const wordKey = apple ? e.altKey : e.ctrlKey;
    const focus = this.focus ?? 0;
    const anchor = this.anchor ?? focus;
    const collapsedNow = anchor === focus;
    let to: number | null = null;
    let vertical = false;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowRight": {
        const right = e.key === "ArrowRight";
        if (apple && e.metaKey) to = this.lineEdge(focus, right);
        else if (wordKey) to = right ? nextWordEnd(text, focus) : prevWordStart(text, focus);
        else if (!e.shiftKey && !collapsedNow) to = right ? Math.max(anchor, focus) : Math.min(anchor, focus);
        else to = right ? nextGrapheme(text, focus) : prevGrapheme(text, focus);
        break;
      }
      case "ArrowUp":
      case "ArrowDown":
        if (apple && e.metaKey) to = e.key === "ArrowDown" ? text.length : 0;
        else {
          to = this.lineStep(focus, e.key === "ArrowDown");
          vertical = true;
        }
        break;
      case "Home":
      case "End":
        to = mod || e.ctrlKey ? (e.key === "End" ? text.length : 0) : this.lineEdge(focus, e.key === "End");
        break;
      case "a":
      case "A":
        if (!mod || e.shiftKey || e.altKey) return false;
        e.preventDefault();
        this.goalX = null;
        this.select(0, text.length, { cause: "keyboard", final: true });
        return true;
      case "Escape":
        if (collapsedNow || this.anchor === null) return false;
        e.preventDefault();
        this.select(focus, focus, { cause: "keyboard", final: true });
        return true;
      default:
        return false;
    }
    // Alt + ← → is the browser's Back / Forward outside Apple keyboards
    if (to === null || (e.altKey && !wordKey)) return false;
    e.preventDefault();
    if (!vertical) this.goalX = null;
    this.select(e.shiftKey ? anchor : to, to, { cause: "keyboard", final: true });
    this.reveal();
    return true;
  };

  /* ----- Geometry for the keyboard ----- */

  private lineStep(from: number, down: boolean): number {
    const root = this.options.root();
    const text = this.source;
    if (!root) return from;
    const box = caretRectAt(root, from);
    if (!box) return down ? text.length : 0;
    const x = this.goalX ?? box.left;
    this.goalX = x;
    const y = down ? box.bottom + box.height / 2 : box.top - box.height / 2;
    const at = offsetFromPoint(root, x, y);
    // Off the first or last line (or off screen): the text's ends
    if (at === null || at === from) return down ? text.length : 0;
    return at;
  }

  private lineEdge(from: number, end: boolean): number {
    const root = this.options.root();
    const text = this.source;
    if (!root) return from;
    const box = caretRectAt(root, from);
    const r = root.getBoundingClientRect();
    if (!box) return end ? text.length : 0;
    const at = offsetFromPoint(root, end ? r.right - 1 : r.left + 1, box.top + box.height / 2);
    if (at === null) return end ? text.length : 0;
    // The end of a wrapped line sits before the space it broke at
    return end && at > from && /\s/.test(text[at - 1] ?? "") && at < text.length ? at - 1 : at;
  }

  /* ----- The native selection ----- */

  /** Our offsets → the native selection */
  private apply() {
    const root = this.options.root();
    if (!root || this.anchor === null || this.focus === null) return;
    const native = root.ownerDocument.getSelection();
    if (!native) return;
    const a = pointAt(root, this.anchor, this.anchor <= this.focus ? "forward" : "backward");
    const f = pointAt(root, this.focus, this.anchor <= this.focus ? "backward" : "forward");
    try {
      native.setBaseAndExtent(a.node, a.offset, f.node, f.offset);
    } catch {
      /* a node went away mid-update – the next update puts it back */
    }
    this.placeCaret();
  }

  /** The native selection → offsets; undefined when it says nothing about this root */
  private read(): { anchor: number; focus: number } | null | undefined {
    const root = this.options.root();
    const native = root?.ownerDocument.getSelection();
    if (!root || !native || !native.rangeCount || !native.anchorNode || !native.focusNode) return undefined;
    const range = native.getRangeAt(0);
    const inside = root.contains(native.anchorNode) || root.contains(native.focusNode) || range.intersectsNode(root);
    // A selection elsewhere: a collapsed one (a click on a button) leaves ours alone, a real one replaces it
    if (!inside) return native.isCollapsed ? undefined : null;
    return { anchor: offsetOf(root, native.anchorNode, native.anchorOffset), focus: offsetOf(root, native.focusNode, native.focusOffset) };
  }

  private matchesNative() {
    const r = this.read();
    return !!r && r.anchor === this.anchor && r.focus === this.focus;
  }

  private sync = (final: boolean) => {
    const r = this.read();
    if (r === undefined) return;
    if (r === null) {
      if (this.anchor !== null) this.clear({ cause: "pointer", final });
      return;
    }
    const changed = r.anchor !== this.anchor || r.focus !== this.focus;
    const released = this.released;
    this.released = false;
    if (changed) this.goalX = null;
    this.anchor = r.anchor;
    this.focus = r.focus;
    this.placeCaret();
    if (changed || released) this.notify({ cause: "pointer", final });
  };

  private onSelectionChange = () => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.sync(!this.pointerDown));
  };
  private onPointerDown = (e: PointerEvent) => {
    const root = this.options.root();
    if (root && e.button === 0 && root.contains(e.target as Node)) this.pointerDown = true;
  };
  private onPointerUp = () => {
    if (!this.pointerDown) return;
    this.pointerDown = false;
    this.released = true;
    cancelAnimationFrame(this.frame);
    // The selection settles after pointerup in some engines (a double-click's word); read it a frame later
    this.frame = requestAnimationFrame(() => this.sync(true));
  };
  // During focusout the active element isn't settled yet: draw after it is
  private onFocus = () => queueMicrotask(() => this.placeCaret());

  private notify(how: SelectionCause) {
    const v = this.value;
    const key = v ? `${v.anchor}:${v.focus}` : "";
    // Repeats are dropped unless they finish a pointer gesture (the toolbar opens on release)
    if (key === this.last && !(how.final && how.cause === "pointer")) return;
    this.last = key;
    this.options.onChange?.(v, how);
  }

  /** Scrolls the caret's line into view */
  private reveal() {
    const el = this.options.caretEl?.();
    if (el && !el.hidden) el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }

  /** Draws the caret: visible while the root has focus and nothing is selected */
  placeCaret() {
    const el = this.options.caretEl?.();
    const root = this.options.root();
    if (!el) return;
    const active = !!root && root.ownerDocument.activeElement === root;
    const show = active && this.anchor !== null && this.anchor === this.focus;
    const box = show ? caretRectAt(root!, this.focus!) : null;
    const parent = (el.offsetParent as HTMLElement | null) ?? root?.parentElement;
    if (!box || !parent) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    const p = parent.getBoundingClientRect();
    // Works inside CSS zoom or transforms: viewport pixels back to the parent's own pixels
    const scale = p.width ? parent.offsetWidth / p.width : 1;
    const x = (box.left - p.left) * scale + parent.scrollLeft - parent.clientLeft;
    const y = (box.top - p.top) * scale + parent.scrollTop - parent.clientTop;
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.style.height = `${box.height * scale}px`;
  }

  /* ----- Lifecycle ----- */

  hostConnected() {
    const doc = this.host.ownerDocument;
    doc.addEventListener("selectionchange", this.onSelectionChange);
    doc.addEventListener("pointerdown", this.onPointerDown, true);
    doc.addEventListener("pointerup", this.onPointerUp, true);
    doc.addEventListener("pointercancel", this.onPointerUp, true);
    this.host.addEventListener("focusin", this.onFocus);
    this.host.addEventListener("focusout", this.onFocus);
  }

  hostUpdate() {
    this.owned = this.anchor !== null && this.anchor !== this.focus && this.matchesNative();
  }

  hostUpdated() {
    // A re-render may have replaced the text nodes the native selection was in: put it back from the offsets
    if (this.owned && !this.matchesNative()) this.apply();
    else this.placeCaret();
    // The text got shorter under a stored selection
    const n = this.source.length;
    if (this.anchor !== null && (this.anchor > n || this.focus! > n)) this.select(Math.min(this.anchor, n), Math.min(this.focus!, n));
  }

  hostDisconnected() {
    const doc = this.host.ownerDocument;
    cancelAnimationFrame(this.frame);
    doc.removeEventListener("selectionchange", this.onSelectionChange);
    doc.removeEventListener("pointerdown", this.onPointerDown, true);
    doc.removeEventListener("pointerup", this.onPointerUp, true);
    doc.removeEventListener("pointercancel", this.onPointerUp, true);
    this.host.removeEventListener("focusin", this.onFocus);
    this.host.removeEventListener("focusout", this.onFocus);
  }
}

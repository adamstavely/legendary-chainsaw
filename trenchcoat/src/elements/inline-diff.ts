import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";

/*
 * <tc-inline-diff> – the Lit port of src/components/inline-diff.tsx: review an AI's edits to a piece of prose. The
 * original and the suggested text are diffed word by word and shown as one flowing paragraph: removed words struck
 * through on a soft red tint, new words underlined on a soft green one. Hover or focus a change and a small popover
 * offers Accept and Reject. Tab moves between changes, Y / Enter / Space accepts, N / Backspace rejects, Esc hides
 * the popover. A toolbar counts what's left, steps to the previous / next pending change, undoes the last decision
 * and turns into "All changes reviewed" with an Undo at the end. Clean drops the tray: one white card with hairline
 * shadows, the label opens the card and the toolbar is its last row.
 *
 *   <tc-inline-diff label="Suggested by AI" original="The quick fox" suggested="The slow fox"></tc-inline-diff>
 *
 * The element is its own imperative handle: highlight(), accept(), reject(), acceptAll(), rejectAll(), undo(),
 * reset().
 */

/** A run of unchanged text, or one change (removed and/or inserted text) */
export type DiffSegment = { type: "equal"; text: string } | { type: "change"; remove: string; insert: string };

export type InlineDiffVerdict = "accepted" | "rejected";

/** The verdict on each change, by its index among the changes; a missing index is still pending */
export type InlineDiffDecisions = Partial<Record<number, InlineDiffVerdict>>;

/** Imperative controls, e.g. for a guided tour or your own buttons */
export type InlineDiffHandle = {
  /** Show the popover on a change (by its index among the changes) without moving focus; null hides it */
  highlight: (index: number | null) => void;
  accept: (index: number) => void;
  reject: (index: number) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  /** Restores the last decision (or the last "all" batch) */
  undo: () => void;
  /** Back to every change pending */
  reset: () => void;
};

export type InlineDiffDecisionsChange = { decisions: InlineDiffDecisions };
export type InlineDiffText = { text: string };

const NO_DECISIONS: InlineDiffDecisions = {};

/* ---------- Word diff ---------- */

// Words (letters, digits, apostrophes), runs of whitespace, and single punctuation marks
const TOKEN = /\s+|[\p{L}\p{N}_'’]+|[^\s\p{L}\p{N}_]/gu;
const isSpace = (s: string) => /^\s+$/.test(s);

/** The most work for a settled diff – (tokens in the middle) × (edits); past it the middle becomes one replacement */
const MAX_CELLS = 20_000_000;
/** The most work while the text is still streaming in – the full diff runs once it has been quiet for a moment */
const STREAMING_CELLS = 250_000;
/** The most edits Myers' search looks for, whatever the budget – keeps its trace (about edits² numbers) small */
const MAX_EDITS = 2_000;
/** Text that changes again within this many ms counts as streaming */
const QUIET_MS = 250;

type Op = { t: 0 | 1 | 2; s: string }; // 0 equal, 1 removed, 2 inserted

/** Myers' O(ND) shortest edit script from x to y, or null when it needs more than maxD edits */
function editScript(x: string[], y: string[], maxD: number): Op[] | null {
  const n = x.length;
  const m = y.length;
  const off = maxD + 1;
  // v[off + k]: how far along x the furthest path on diagonal k (= i − j) reaches; trace[d] keeps it after d edits
  const v = new Int32Array(2 * maxD + 3);
  const trace: Int32Array[] = [];
  for (let d = 0; d <= maxD; d++) {
    for (let k = -d; k <= d; k += 2) {
      let i = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
      let j = i - k;
      while (i < n && j < m && x[i] === y[j]) {
        i++;
        j++;
      }
      v[off + k] = i;
      if (i >= n && j >= m) {
        trace.push(v.slice(off - d, off + d + 1));
        return backtrack(x, y, trace);
      }
    }
    trace.push(v.slice(off - d, off + d + 1));
  }
  return null;
}

/** Walks the trace back from the end, emitting the edit script in order */
function backtrack(x: string[], y: string[], trace: Int32Array[]): Op[] {
  const out: Op[] = [];
  let i = x.length;
  let j = y.length;
  for (let d = trace.length - 1; d > 0; d--) {
    const prev = trace[d - 1]; // diagonals −(d−1)…d−1, at index k + d − 1
    const k = i - j;
    const down = k === -d || (k !== d && prev[k - 1 + d - 1] < prev[k + 1 + d - 1]);
    const pk = down ? k + 1 : k - 1;
    const pi = prev[pk + d - 1];
    const pj = pi - pk;
    while (i > pi && j > pj) {
      out.push({ t: 0, s: x[--i] });
      j--;
    }
    if (down) out.push({ t: 2, s: y[--j] });
    else out.push({ t: 1, s: x[--i] });
  }
  while (i > 0 && j > 0) {
    out.push({ t: 0, s: x[--i] });
    j--;
  }
  return out.reverse();
}

/**
 * Word-level diff of two texts (Myers' shortest edit script over word and whitespace tokens), grouped into equal
 * runs and changes. `maxCells` caps the work – tokens in the part between the common start and end, times the
 * edits needed; past it the middle becomes one replacement.
 */
export function diffWords(original: string, suggested: string, maxCells: number = MAX_CELLS): DiffSegment[] {
  const a = original.match(TOKEN) ?? [];
  const b = suggested.match(TOKEN) ?? [];

  // Strip the common start and end so the table only covers the middle
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  const x = a.slice(pre, a.length - suf);
  const y = b.slice(pre, b.length - suf);
  const n = x.length;
  const m = y.length;

  const ops: Op[] = a.slice(0, pre).map((s) => ({ t: 0, s }));

  const maxD = Math.min(n + m, MAX_EDITS, Math.floor(maxCells / Math.max(1, n + m)));
  const script = editScript(x, y, maxD);
  if (script) ops.push(...script);
  else {
    // Too many edits for the budget: one replacement instead of a slow search
    x.forEach((s) => ops.push({ t: 1, s }));
    y.forEach((s) => ops.push({ t: 2, s }));
  }
  a.slice(a.length - suf).forEach((s) => ops.push({ t: 0, s }));

  // A pure removal or insertion that starts with a space slides right, so the space trails the words
  for (let s = 0; s < ops.length; s++) {
    if (ops[s].t === 0 || (s > 0 && ops[s - 1].t !== 0)) continue;
    const t = ops[s].t;
    let e = s;
    while (e < ops.length && ops[e].t === t) e++;
    if (e < ops.length && ops[e].t !== 0) continue; // mixed change – leave it
    while (e < ops.length && ops[e].t === 0 && ops[e].s === ops[s].s && isSpace(ops[s].s)) {
      ops[e] = { t, s: ops[e].s };
      ops[s] = { t: 0, s: ops[s].s };
      s++;
      e++;
    }
    s = e - 1;
  }

  // Group into segments
  const raw: DiffSegment[] = [];
  for (const op of ops) {
    const last = raw[raw.length - 1];
    if (op.t === 0) {
      if (last?.type === "equal") last.text += op.s;
      else raw.push({ type: "equal", text: op.s });
    } else {
      if (last?.type !== "change") raw.push({ type: "change", remove: "", insert: "" });
      const c = raw[raw.length - 1] as Extract<DiffSegment, { type: "change" }>;
      if (op.t === 1) c.remove += op.s;
      else c.insert += op.s;
    }
  }

  // Changes split only by a space read as one edit: "a lot faster" → "twice as fast"
  const merged: DiffSegment[] = [];
  for (let k = 0; k < raw.length; k++) {
    const seg = raw[k];
    const prev = merged[merged.length - 1];
    const next = raw[k + 1];
    if (seg.type === "equal" && isSpace(seg.text) && prev?.type === "change" && next?.type === "change") {
      prev.remove += seg.text + next.remove;
      prev.insert += seg.text + next.insert;
      k++;
      continue;
    }
    merged.push({ ...seg });
  }

  // Whitespace both sides share at their edges belongs to the surrounding text
  const out: DiffSegment[] = [];
  const pushEqual = (text: string) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last?.type === "equal") last.text += text;
    else out.push({ type: "equal", text });
  };
  for (const seg of merged) {
    if (seg.type === "equal") {
      pushEqual(seg.text);
      continue;
    }
    let { remove, insert } = seg;
    let lead = "";
    let trail = "";
    if (remove && insert) {
      const l = remove.match(/^\s+/)?.[0] ?? "";
      if (l && insert.startsWith(l) && l.length < remove.length && l.length < insert.length) {
        lead = l;
        remove = remove.slice(l.length);
        insert = insert.slice(l.length);
      }
      const t = remove.match(/\s+$/)?.[0] ?? "";
      if (t && insert.endsWith(t) && t.length < remove.length && t.length < insert.length) {
        trail = t;
        remove = remove.slice(0, -t.length);
        insert = insert.slice(0, -t.length);
      }
    }
    pushEqual(lead);
    out.push({ type: "change", remove, insert });
    pushEqual(trail);
  }
  return out;
}

/* ---------- Element ---------- */

type Change = { seg: number; remove: string; insert: string };

const plural = (n: number) => `${n} suggestion${n === 1 ? "" : "s"}`;
const quote = (s: string) => `“${s.trim()}”`;
const describe = (c: { remove: string; insert: string }) =>
  c.remove.trim() && c.insert.trim() ? `replace ${quote(c.remove)} with ${quote(c.insert)}` : c.insert.trim() ? `add ${quote(c.insert)}` : `remove ${quote(c.remove)}`;
const undoIcon = svg`<path d="M5.5 4 2.75 6.75 5.5 9.5"></path><path d="M3 6.75h6.5a3.75 3.75 0 0 1 0 7.5H7.5"></path>`;
const keep = (e: Event) => e.preventDefault();

let instances = 0;

/**
 * Review an AI's word-level edits to prose: accept or reject each change in place.
 * @tag tc-inline-diff
 * @fires tc-decisions-change - A decision, undo or reset, or new text starting over ({ decisions: InlineDiffDecisions }); cancelable
 * @fires tc-text-change - Every decision (and undo), with the text so far ({ text: string }) – pending changes keep the original words
 * @fires tc-done - No change is pending any more ({ text: string }, the final text)
 */
export class TcInlineDiff extends TcElement implements InlineDiffHandle {
  static override ui = "df";

  /** The text as it is now */
  @property() accessor original = "";
  /** The text the AI suggests */
  @property() accessor suggested = "";
  /** Pre-computed segments instead of original + suggested */
  @property({ attribute: false }) accessor changes: DiffSegment[] | undefined = undefined;
  /** The verdicts so far. Changed by the user unless a tc-decisions-change listener calls preventDefault(); new text
   *  resets them (reported as {}) */
  @property({ attribute: false }) accessor decisions: InlineDiffDecisions = NO_DECISIONS;
  /** Small line above the card (Clean: at the top of the card), e.g. "Suggested by AI · Make it shorter" */
  @property() accessor label = "";
  /** Grow to the container's height: the card fills the rest below the label, the toolbar staying in place */
  @property({ type: Boolean }) accessor fill = false;

  @state() private accessor history: number[][] = [];
  @state() private accessor hover: number | null = null;
  @state() private accessor focused: number | null = null;
  @state() private accessor highlighted: number | null = null;
  /** Esc hid the popover of this change (1.4.13) – it stays hidden until another change is shown */
  @state() private accessor hushed: number | null = null;
  @state() private accessor message = "";
  @state() private accessor quiet = true;

  private readonly idBase = `tc-df${++instances}`;
  private segments: DiffSegment[] = [];
  private list: Change[] = [];
  private changeAt = new Map<number, number>();
  private diffKey: { changes: DiffSegment[] | undefined; original: string; suggested: string; cap: number } | null = null;
  private signature: string | null = null;
  private textKey: string | null = null;
  private settling = 0;
  private leaveTimer = 0;
  private focusAfter: "undo" | number | null = null;
  /** The change the arrows step from: the last one shown, navigated to or decided */
  private cursor: number | null = null;
  private wasOpen = false;
  private placedKey = "";
  private ro?: ResizeObserver;
  private escOn = false;
  private outsideOn = false;

  constructor() {
    super();
    this.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.highlighted !== null) this.highlighted = null;
      if (e.key === "Escape" && this.active !== null) this.hushed = this.active;
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.settling);
    this.settling = 0;
    window.clearTimeout(this.leaveTimer);
    this.ro?.disconnect();
    this.ro = undefined;
    this.placedKey = "";
    this.wasOpen = false;
    if (this.escOn) document.removeEventListener("keydown", this.onDocKey);
    if (this.outsideOn) document.removeEventListener("pointerdown", this.onOutside);
    this.escOn = this.outsideOn = false;
  }

  /* ---------- Derived ---------- */

  private get pending() {
    return this.list.map((_, i) => i).filter((i) => !this.decisions[i]);
  }
  private textFor(d: InlineDiffDecisions) {
    return this.segments.map((s, i) => (s.type === "equal" ? s.text : d[this.changeAt.get(i)!] === "accepted" ? s.insert : s.remove)).join("");
  }
  /** Which change shows the popover: the hovered one, else the focused one, else a highlighted one */
  private get shownChange() {
    return [this.hover, this.focused, this.highlighted].find((i): i is number => i !== null && !this.decisions[i] && i < this.list.length) ?? null;
  }
  private get active() {
    const shown = this.shownChange;
    return shown === this.hushed ? null : shown;
  }
  private get items() {
    return [...this.querySelectorAll<HTMLElement>(".ui-df__chg")];
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // While the text keeps changing – a model streaming its suggestion – the diff runs with a small cap; once it has
    // been quiet for QUIET_MS the full diff runs once, so the settled result is the same as diffing the final text
    const key = `${this.original}\u0000${this.suggested}`;
    if (this.textKey !== null && this.textKey !== key) {
      if (this.settling) this.quiet = false;
      window.clearTimeout(this.settling);
      this.settling = window.setTimeout(() => {
        this.settling = 0;
        this.quiet = true;
      }, QUIET_MS);
    }
    this.textKey = key;
    const cap = this.quiet ? MAX_CELLS : STREAMING_CELLS;
    const d = this.diffKey;
    if (!d || d.changes !== this.changes || d.original !== this.original || d.suggested !== this.suggested || d.cap !== cap) {
      this.diffKey = { changes: this.changes, original: this.original, suggested: this.suggested, cap };
      this.segments = this.changes ?? diffWords(this.original, this.suggested, cap);
      this.list = [];
      this.segments.forEach((s, i) => {
        if (s.type === "change") this.list.push({ seg: i, remove: s.remove, insert: s.insert });
      });
      this.changeAt = new Map(this.list.map((c, ci) => [c.seg, ci]));
      // New text in → start over, and the verdicts too – reported, so a controlled page hears about it
      const signature = JSON.stringify(this.segments);
      if (this.signature !== null && this.signature !== signature) {
        this.history = [];
        this.hover = null;
        this.focused = null;
        this.highlighted = null;
        this.hushed = null;
        if (Object.keys(this.decisions).length) this.setDecisions(NO_DECISIONS);
      }
      this.signature = signature;
    }
    // Showing another change lifts the hush
    if (this.hushed !== null && this.shownChange !== this.hushed) this.hushed = null;
    const active = this.active;
    if (active !== null) this.cursor = active;
    const done = this.list.length > 0 && this.pending.length === 0;
    this.toggleAttribute("data-fill", this.fill);
    this.toggleAttribute("data-done", done);
  }

  protected override updated(changed: PropertyValues) {
    // Move focus once the DOM shows the new state (the Undo layer is inert until then)
    const target = this.focusAfter;
    if (target !== null && changed.has("decisions")) {
      this.focusAfter = null;
      if (target === "undo") this.querySelector<HTMLElement>(".ui-df__layer + .ui-df__layer > .ui-df__btn")?.focus();
      else this.items[target]?.focus();
    }
    const active = this.active;
    // A popover opened by hover closes with Esc from anywhere, without moving focus (1.4.13)
    const esc = active !== null && this.hover === active;
    if (esc !== this.escOn) {
      this.escOn = esc;
      if (esc) document.addEventListener("keydown", this.onDocKey);
      else document.removeEventListener("keydown", this.onDocKey);
    }
    // A highlight from the arrows stays until a decision, Esc or a click outside the element
    const outside = this.highlighted !== null;
    if (outside !== this.outsideOn) {
      this.outsideOn = outside;
      if (outside) document.addEventListener("pointerdown", this.onOutside);
      else document.removeEventListener("pointerdown", this.onOutside);
    }
    this.placePopover(active, changed.has("decisions"));
  }

  private onDocKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") this.hushed = this.active;
  };
  private onOutside = (e: PointerEvent) => {
    if (!this.contains(e.target as Node)) this.highlighted = null;
  };

  /** Where the popover sits: above the first line of the active change, kept inside the card */
  private placePopover(active: number | null, decided: boolean) {
    const key = active === null ? "" : String(active);
    if (key === this.placedKey && !decided) return;
    this.placedKey = key;
    this.ro?.disconnect();
    this.ro = undefined;
    if (active === null) {
      this.wasOpen = false;
      return;
    }
    const card = this.querySelector<HTMLElement>(":scope > .ui-df__card");
    const place = () => {
      const pop = this.querySelector<HTMLElement>(".ui-df__pop");
      const el = this.items[active];
      if (!card || !pop || !el) return;
      // All reads first, then the writes
      const r = card.getBoundingClientRect();
      // Works inside CSS zoom or transforms: convert viewport pixels back to the card's own pixels
      const scale = r.width ? card.offsetWidth / r.width : 1;
      const first = el.getClientRects()[0] ?? el.getBoundingClientRect();
      const pw = pop.offsetWidth;
      const ph = pop.offsetHeight;
      const center = (first.left - r.left + first.width / 2) * scale;
      const left = Math.min(Math.max(center - pw / 2, 8), Math.max(8, card.offsetWidth - pw - 8));
      const top = (first.top - r.top) * scale - ph - 6;
      pop.style.left = `${left}px`;
      pop.style.top = `${top}px`;
      pop.toggleAttribute("data-snap", !this.wasOpen);
      this.wasOpen = true;
    };
    place();
    if (card && typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(place);
      this.ro.observe(card);
    }
  }

  /* ---------- Decisions ---------- */

  private setDecisions(next: InlineDiffDecisions) {
    if (next === this.decisions) return;
    if (this.emit<InlineDiffDecisionsChange>("tc-decisions-change", { decisions: next }, { cancelable: true })) this.decisions = next;
  }

  private decide(ids: number[], verdict: InlineDiffVerdict, moveFocus = false) {
    const d = this.decisions;
    const l = this.list;
    const fresh = ids.filter((i) => i >= 0 && i < l.length && !d[i]);
    if (!fresh.length) return;
    const next = { ...d };
    fresh.forEach((i) => (next[i] = verdict));
    // Counted over the changes, so verdicts a controlled page passes for indexes past the end don't count
    const left = l.filter((_, i) => !next[i]).length;
    this.setDecisions(next);
    this.history = [...this.history, fresh];
    this.highlighted = null;
    this.cursor = Math.max(...fresh);
    const word = verdict === "accepted" ? "Accepted" : "Rejected";
    const what = fresh.length === 1 ? describe(l[fresh[0]]).replace(/^./, (c) => c.toUpperCase()) : `${fresh.length} suggestions`;
    this.message = `${word}: ${what}. ${left ? `${plural(left)} left.` : "All changes reviewed."}`;
    if (moveFocus) {
      const after = Math.max(...fresh);
      const rest = l.map((_, i) => i).filter((i) => !next[i]);
      this.focusAfter = left ? (rest.find((i) => i > after) ?? rest[0]) : "undo";
    }
    const result = this.textFor(next);
    this.emit<InlineDiffText>("tc-text-change", { text: result });
    if (!left) this.emit<InlineDiffText>("tc-done", { text: result });
  }

  private undoLast(moveFocus = false) {
    const last = this.history[this.history.length - 1];
    if (!last) return;
    const next = { ...this.decisions };
    last.forEach((i) => delete next[i]);
    this.setDecisions(next);
    this.history = this.history.slice(0, -1);
    this.message = `Undone. ${plural(this.list.filter((_, i) => !next[i]).length)} left.`;
    if (moveFocus) this.focusAfter = Math.min(...last);
    this.emit<InlineDiffText>("tc-text-change", { text: this.textFor(next) });
  }

  /* ---------- The handle ---------- */

  /** Shows the popover on a change (by its index among the changes) without moving focus; null hides it */
  highlight(index: number | null) {
    this.highlighted = index;
  }
  accept(index: number) {
    this.decide([index], "accepted");
  }
  reject(index: number) {
    this.decide([index], "rejected");
  }
  acceptAll() {
    this.decide(this.pending, "accepted");
  }
  rejectAll() {
    this.decide(this.pending, "rejected");
  }
  /** Restores the last decision (or the last "all" batch) */
  undo() {
    this.undoLast();
  }
  /** Back to every change pending */
  reset() {
    this.setDecisions(NO_DECISIONS);
    this.history = [];
    this.highlighted = null;
    this.hover = null;
    this.message = "";
    this.cursor = null;
  }

  /* ---------- Interaction ---------- */

  /*
   * Prev / next: highlight the neighbouring pending change (wrapping around) and show its popover. The arrows never
   * take focus, so the highlight can't be lost to a blur; if a change has keyboard focus, focus follows. The page
   * only scrolls when the change is out of view.
   */
  private step(dir: 1 | -1) {
    const p = this.pending;
    if (!p.length) return;
    const from = this.active ?? this.cursor ?? (dir === 1 ? -1 : Infinity);
    const target = dir === 1 ? (p.find((i) => i > from) ?? p[0]) : ([...p].reverse().find((i) => i < from) ?? p[p.length - 1]);
    window.clearTimeout(this.leaveTimer);
    this.hover = null;
    this.highlighted = target;
    this.cursor = target;
    const el = this.items[target];
    if (!el) return;
    if (this.focused !== null) el.focus({ preventScroll: true });
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: still ? "auto" : "smooth" });
  }

  private enter(i: number) {
    window.clearTimeout(this.leaveTimer);
    this.hover = i;
  }
  private leave = () => {
    window.clearTimeout(this.leaveTimer);
    this.leaveTimer = window.setTimeout(() => (this.hover = null), 140);
  };

  private onKey(e: KeyboardEvent, i: number) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "y" || k === "enter" || k === " ") {
      e.preventDefault();
      this.decide([i], "accepted", true);
    } else if (k === "n" || k === "backspace" || k === "delete") {
      e.preventDefault();
      this.decide([i], "rejected", true);
    } else if (k === "escape") {
      // Hides the popover; focus stays on the change
      this.hushed = i;
      this.highlighted = null;
    }
  }

  /* ---------- Render ---------- */

  private bar(pending: number, done: boolean) {
    const canUndo = this.history.length > 0;
    return html`<div class="ui-df__bar">
      <div class="ui-df__layer" ?data-show=${!done} .inert=${done} aria-hidden=${ifDefined(done ? "true" : undefined)}>
        <span class="ui-df__count"><span class="ui-df__num">${pending}</span><span class="ui-df__word">${pending === 1 ? "suggestion" : "suggestions"}</span></span>
        <span class="ui-df__actions">
          <span class="ui-df__nav" @mousedown=${keep}>
            <button type="button" class="ui-df__icon" @click=${() => this.undoLast(true)} ?hidden=${!canUndo || done} aria-label="Undo last decision" title="Undo last decision"><svg viewBox="0 0 16 16" aria-hidden="true">${undoIcon}</svg></button>
            <button type="button" class="ui-df__icon" @click=${() => this.step(-1)} ?disabled=${!pending} aria-label="Previous suggestion"><svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M10 12.5 5.5 8 10 3.5"></path>`}</svg></button>
            <button type="button" class="ui-df__icon" @click=${() => this.step(1)} ?disabled=${!pending} aria-label="Next suggestion"><svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M6 3.5 10.5 8 6 12.5"></path>`}</svg></button>
          </span>
          <button type="button" class="ui-df__btn" @click=${() => this.decide(this.pending, "rejected")} ?disabled=${!pending}>Reject all</button>
          <button type="button" class="ui-df__btn ui-df__btn--primary" @click=${() => this.decide(this.pending, "accepted")} ?disabled=${!pending}>Accept all</button>
        </span>
      </div>
      <div class="ui-df__layer" ?data-show=${done} .inert=${!done} aria-hidden=${ifDefined(!done ? "true" : undefined)}>
        <span class="ui-df__count ui-df__count--done"><svg class="ui-df__ok" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M3.75 8.4 6.6 11.1 12.25 5" pathLength="1"></path>`}</svg>All changes reviewed</span>
        <button type="button" class="ui-df__btn" @click=${() => this.undoLast(true)} ?disabled=${!canUndo}><svg viewBox="0 0 16 16" aria-hidden="true">${undoIcon}</svg>Undo</button>
      </div>
    </div>`;
  }

  /** The text as one paragraph: equal runs as they are, each change as a focusable span with its old and new words */
  private text(active: number | null) {
    const decisions = this.decisions;
    const idBase = this.idBase;
    const total = this.list.length;
    let ci = -1;
    return html`<p class="ui-df__text">${this.segments.map((s) => {
        if (s.type === "equal") return html`<span>${s.text}</span>`;
        ci++;
        const idx = ci;
        const state: InlineDiffVerdict | "pending" = decisions[idx] ?? "pending";
        const open = state === "pending";
        return html`<span
          class="ui-df__chg"
          data-state=${state}
          ?data-active=${active === idx}
          tabindex=${ifDefined(open ? "0" : undefined)}
          role=${ifDefined(open ? "button" : undefined)}
          aria-describedby=${ifDefined(open ? `${idBase}-d${idx}` : undefined)}
          @keydown=${(e: KeyboardEvent) => open && this.onKey(e, idx)}
          @focus=${() => (this.focused = idx)}
          @blur=${() => this.focused === idx && (this.focused = null)}
          @mouseenter=${() => this.enter(idx)}
          @mouseleave=${this.leave}
        >${s.remove ? html`<del class="ui-df__del" aria-hidden=${ifDefined(state === "accepted" ? "true" : undefined)}>${s.remove}</del>` : nothing}${s.insert ? html`<ins class="ui-df__ins" aria-hidden=${ifDefined(state === "rejected" ? "true" : undefined)}>${s.insert}</ins>` : nothing}</span>`;
      })}</p><span class="ui-df__sr">${this.list.map((s, idx) => (decisions[idx] ? nothing : html`<span id=${`${idBase}-d${idx}`}>Suggestion ${idx + 1} of ${total}: ${describe(s)}. Y, Enter or Space accepts, N rejects.</span>`))}</span>`;
  }

  /** Accept / Reject for the active change, floating above it */
  private popFor(active: number | null, clean: boolean) {
    const open = active !== null;
    return html`<div
      class="ui-df__pop"
      ?data-open=${open}
      role="group"
      aria-label="Review suggestion"
      aria-hidden=${ifDefined(!open ? "true" : undefined)}
      @mouseenter=${() => this.active !== null && this.enter(this.active)}
      @mouseleave=${this.leave}
      @mousedown=${keep}
    >
      <button type="button" tabindex="-1" class="ui-df__pbtn ui-df__pbtn--primary" @click=${() => this.active !== null && this.decide([this.active], "accepted", this.focused === this.active)}><svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M3.75 8.4 6.6 11.1 12.25 5"></path>`}</svg>Accept<kbd aria-hidden="true">Y</kbd></button>
      ${clean ? nothing : html`<span class="ui-df__sep" aria-hidden="true"></span>`}
      <button type="button" tabindex="-1" class="ui-df__pbtn" @click=${() => this.active !== null && this.decide([this.active], "rejected", this.focused === this.active)}><svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 4.5l7 7M11.5 4.5l-7 7"></path>`}</svg>Reject<kbd aria-hidden="true">N</kbd></button>
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const pending = this.pending.length;
    const done = this.list.length > 0 && pending === 0;
    const active = this.active;
    const labelEl = this.label
      ? html`<div class="ui-df__label"><svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 1.75c.3 2.9 1.35 3.95 4.25 4.25-2.9.3-3.95 1.35-4.25 4.25C7.7 7.35 6.65 6.3 3.75 6 6.65 5.7 7.7 4.65 8 1.75Z"></path><path d="M12.5 10.25c.15 1.25.6 1.7 1.75 1.75-1.15.15-1.6.6-1.75 1.75-.15-1.15-.6-1.6-1.75-1.75 1.15-.05 1.6-.5 1.75-1.75Z"></path>`}</svg><span>${this.label}</span></div>`
      : nothing;
    const barEl = this.bar(pending, done);
    const textEl = this.text(active);
    return html`
      ${clean ? nothing : labelEl}
      <div class="ui-df__card">
        ${clean
          ? html`<div class="ui-df__body">${labelEl}${textEl}</div><div class="ui-df__foot">${barEl}</div>`
          : html`<div class="ui-df__head">${barEl}</div><div class="ui-df__body">${textEl}</div>`}
        ${this.popFor(active, clean)}
      </div>
      <span class="ui-df__sr" role="status" aria-live="polite">${this.message}</span>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="df"] {
  --tc-inline-diff-ins-bg-active: light-dark(rgba(34, 160, 90, 0.18), rgba(60, 200, 120, 0.22));
  --tc-inline-diff-del-bg-active: light-dark(rgba(220, 60, 60, 0.15), rgba(240, 90, 90, 0.2));
  --tc-inline-diff-strike: light-dark(rgba(180, 35, 24, 0.55), rgba(255, 138, 128, 0.6));
  /* the suggestion popover is inverted: dark on a light page, light on a dark one */
  --tc-inline-diff-popover-fill: light-dark(rgba(255, 255, 255, 0.14), rgba(0, 0, 0, 0.08));
  --tc-inline-diff-popover-kbd-text: light-dark(rgba(255, 255, 255, 0.55), rgba(0, 0, 0, 0.5));
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-secondary);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
/* Colors and motion as variables – override them on [data-ui="df"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="df"] {
  --tc-inline-diff-ins-bg-active: light-dark(rgba(26, 154, 82, 0.16), rgba(62, 194, 122, 0.22));
  --tc-inline-diff-del-bg-active: light-dark(rgba(229, 72, 77, 0.14), rgba(240, 90, 90, 0.22));
  /* Edits are tinted fills only – no strokes */
  --tc-inline-diff-strike: light-dark(rgba(229, 72, 77, 0.6), rgba(255, 120, 120, 0.7));
  --tc-inline-diff-primary-kbd-bg: var(--tc-kbd-on-inverse-bg);
  --tc-inline-diff-primary-kbd-text: light-dark(rgba(255, 255, 255, 0.66), rgba(28, 28, 30, 0.6));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  display: grid;
  width: 100%;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
[data-ui="df"] *, [data-ui="df"] *::before, [data-ui="df"] *::after { box-sizing: border-box; }
/* The optional label sits on the gray tray, above the card */
:where([data-look="standard"], [data-look="standard"] *).ui-df__label {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1);
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  letter-spacing: -0.003em;
}
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="df"]) button {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="df"]) svg { display: block; flex: none; }
/* One card – the edge is a shadow, not a border. The popover is positioned relative to it */
.ui-df__card {
  position: relative;
  min-width: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
  container: ui-df-card / inline-size;
}
/* The optional label opens the card */
:where([data-look="clean"], [data-look="clean"] *).ui-df__label {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  margin: 0 0 var(--tc-space-2);
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
}
.ui-df__label span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__label svg { flex: none; width: 13px; height: 13px; fill: currentColor; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__head {
  padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-4);
  border-bottom: 1px solid var(--tc-border-default);
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__label svg { width: 16px; height: 16px; fill: var(--tc-accent); }
/* The prose */
:where([data-look="clean"], [data-look="clean"] *).ui-df__body { padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-4-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__text {
  margin: 0;
  color: var(--tc-text-primary);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-relaxed);
  white-space: pre-line; /* line breaks stay, doubled spaces around a settled change collapse */
  overflow-wrap: anywhere;
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__chg { border-radius: var(--tc-radius-xs); cursor: pointer; scroll-margin: 64px 0 72px; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__chg:not([data-state="pending"]) { cursor: auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__del,
:where([data-look="clean"], [data-look="clean"] *).ui-df__ins {
  padding: 1px var(--tc-space-0-5);
  border-radius: var(--tc-radius-xs);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  font-size: 1em;
  transition:
    background-color var(--tc-duration-slow) var(--tc-ease-standard),
    color var(--tc-duration-slow) var(--tc-ease-standard),
    text-decoration-color var(--tc-duration-slow) var(--tc-ease-standard),
    font-size var(--tc-duration-slower) var(--tc-ease-move),
    padding var(--tc-duration-slower) var(--tc-ease-move),
    margin var(--tc-duration-slower) var(--tc-ease-move),
    opacity var(--tc-duration-slow) var(--tc-ease-standard);
}
/* Removed: a red tint, the words grayed and struck */
:where([data-look="clean"], [data-look="clean"] *).ui-df__del {
  background: var(--tc-status-danger-bg);
  color: var(--tc-text-muted);
  text-decoration: line-through;
  text-decoration-color: var(--tc-inline-diff-strike);
  text-decoration-thickness: 1px;
}
/* Added: a green tint, the words in full ink */
:where([data-look="clean"], [data-look="clean"] *).ui-df__ins {
  background: var(--tc-status-success-bg);
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__del + .ui-df__ins { margin-left: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__chg[data-active] .ui-df__del { background: var(--tc-inline-diff-del-bg-active); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__chg[data-active] .ui-df__ins { background: var(--tc-inline-diff-ins-bg-active); }
/* Accepted: the old words shrink away, the new ones settle into the text */
:where([data-look="clean"], [data-look="clean"] *).ui-df__chg[data-state="accepted"] .ui-df__del,
:where([data-look="clean"], [data-look="clean"] *).ui-df__chg[data-state="rejected"] .ui-df__ins {
  font-size: 0;
  padding: 0;
  margin: 0;
  opacity: 0;
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__chg[data-state="accepted"] .ui-df__ins,
:where([data-look="clean"], [data-look="clean"] *).ui-df__chg[data-state="rejected"] .ui-df__del {
  padding: 0;
  margin: 0;
  background: transparent;
  color: inherit;
  text-decoration-color: transparent;
}
/* The toolbar: the last row of the card. Its two states share one cell and cross-fade */
:where([data-look="clean"], [data-look="clean"] *).ui-df__foot {
  display: grid;
  align-items: center;
  min-height: 44px;
  padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4);
  border-top: 0.5px solid var(--tc-border-default);
}
/* The two toolbars share one cell and cross-fade */
.ui-df__bar { display: grid; }
.ui-df__layer {
  grid-area: 1 / 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  min-width: 0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px);
  filter: blur(2px);
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard), transform var(--tc-duration-slower) var(--tc-ease-move), filter var(--tc-duration-moderate) var(--tc-ease-standard), visibility 0s var(--tc-duration-slower);
}
.ui-df__layer[data-show] {
  opacity: 1;
  visibility: visible;
  transform: none;
  filter: none;
  transition: opacity var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-instant), transform var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-instant), filter var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-instant), visibility 0s;
}
/* Narrow cards (e.g. a side panel): the count keeps only its number, so the toolbar stays on one line */
@container ui-df-card (max-width: 400px) {
  .ui-df__word { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__count {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  color: var(--tc-text-primary);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-none);
  letter-spacing: -0.006em;
  white-space: nowrap;
}
/* The count: a badge on the pill tokens */
.ui-df__num {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 var(--tc-space-1-5);
  border-radius: var(--tc-radius-badge);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-font-weight-strong);
  font-variant-numeric: tabular-nums;
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__num { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__ok {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--tc-status-success-solid);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__count {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__count--done { gap: var(--tc-space-1-5); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__num { background: var(--tc-fill-default); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__ok {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--tc-status-success-solid);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
[data-ui="df"][data-done] .ui-df__ok { animation: ui-df-draw var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-base) forwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__actions { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); margin-left: auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__nav { display: inline-flex; gap: var(--tc-space-0-5); margin-right: var(--tc-space-0-5); }
/* Toolbar buttons: Button's recipe – Reject all / Undo secondary, Accept all primary (flat ink), arrows ghost */
.ui-df__btn,
.ui-df__icon {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5);
  margin: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  font: inherit;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
  -webkit-tap-highlight-color: transparent;
}
/* 28px in both looks: Standard's small control, Clean's medium */
:where([data-look="standard"], [data-look="standard"] *).ui-df__btn, :where([data-look="standard"], [data-look="standard"] *).ui-df__icon { height: var(--tc-control-h-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__btn, :where([data-look="clean"], [data-look="clean"] *).ui-df__icon { height: var(--tc-control-h-md); }
.ui-df__btn { padding: 0 var(--tc-control-px-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-df__btn:has(svg) { padding-left: var(--tc-space-2); }
.ui-df__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__icon { width: var(--tc-control-h-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__icon { width: var(--tc-control-h-md); }
.ui-df__icon { padding: 0; background: transparent; color: var(--tc-action-ghost-fg); }
.ui-df__icon[hidden] { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__btn svg,
:where([data-look="standard"], [data-look="standard"] *).ui-df__icon svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__actions { display: inline-flex; align-items: center; gap: var(--tc-space-2); margin-left: auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__nav { display: inline-flex; gap: var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__btn svg,
:where([data-look="clean"], [data-look="clean"] *).ui-df__icon svg,
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__btn svg { color: var(--tc-icon-muted); }
.ui-df__icon:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-df__btn--primary { background: var(--tc-action-primary-bg); color: var(--tc-action-primary-fg); box-shadow: var(--tc-action-primary-shadow); }
.ui-df__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-df__btn--primary:active:not(:disabled) { background: var(--tc-action-primary-bg-active); }
.ui-df__btn:active:not(:disabled),
.ui-df__icon:active:not(:disabled) { transform: scale(0.97); }
.ui-df__btn:disabled,
.ui-df__icon:disabled { opacity: 0.4; cursor: default; }
.ui-df__btn:focus-visible,
.ui-df__icon:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The prose */
:where([data-look="standard"], [data-look="standard"] *).ui-df__body { padding: var(--tc-space-4) var(--tc-space-4-5) var(--tc-space-4-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__text {
  margin: 0;
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-lg-plus);
  line-height: var(--tc-line-height-loose);
  letter-spacing: -0.006em;
  white-space: pre-line; /* line breaks stay, doubled spaces around a settled change collapse */
  overflow-wrap: anywhere;
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__chg { border-radius: var(--tc-radius-xs); cursor: pointer; scroll-margin: 64px 0 24px; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__chg:not([data-state="pending"]) { cursor: auto; }
.ui-df__chg:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__del,
:where([data-look="standard"], [data-look="standard"] *).ui-df__ins {
  padding: 1px var(--tc-space-0-5);
  border-radius: var(--tc-radius-xs);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  font-size: 1em;
  transition:
    background-color var(--tc-duration-slow) var(--tc-ease-standard),
    color var(--tc-duration-slow) var(--tc-ease-standard),
    text-decoration-color var(--tc-duration-slow) var(--tc-ease-standard),
    font-size var(--tc-duration-slower) var(--tc-ease-move),
    padding var(--tc-duration-slower) var(--tc-ease-move),
    margin var(--tc-duration-slower) var(--tc-ease-move),
    opacity var(--tc-duration-slow) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__del {
  background: var(--tc-status-danger-bg);
  color: var(--tc-status-danger-fg);
  text-decoration: line-through;
  text-decoration-color: var(--tc-inline-diff-strike);
  text-decoration-thickness: 1px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__ins {
  background: var(--tc-status-success-bg);
  color: var(--tc-status-success-fg);
}
/* New words are underlined, removed ones struck through – the change never rests on colour alone (1.4.1) */
.ui-df__ins {
  text-decoration: underline;
  text-decoration-color: var(--tc-status-success-solid);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__del + .ui-df__ins { margin-left: var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__chg[data-active] .ui-df__del { background: var(--tc-inline-diff-del-bg-active); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__chg[data-active] .ui-df__ins { background: var(--tc-inline-diff-ins-bg-active); }
/* Accepted: the old words shrink away, the new ones settle into the text */
:where([data-look="standard"], [data-look="standard"] *).ui-df__chg[data-state="accepted"] .ui-df__del,
:where([data-look="standard"], [data-look="standard"] *).ui-df__chg[data-state="rejected"] .ui-df__ins {
  font-size: 0;
  padding: 0;
  margin: 0;
  opacity: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__chg[data-state="accepted"] .ui-df__ins,
:where([data-look="standard"], [data-look="standard"] *).ui-df__chg[data-state="rejected"] .ui-df__del {
  padding: 0;
  margin: 0;
  background: transparent;
  color: inherit;
  text-decoration-color: transparent;
}
/* Popover */
:where([data-look="standard"], [data-look="standard"] *).ui-df__pop {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--tc-space-0-5);
  padding: var(--tc-space-1);
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-inverse);
  color: var(--tc-text-on-inverse);
  box-shadow: var(--tc-shadow-overlay);
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px) scale(0.96);
  transform-origin: 50% 100%;
  pointer-events: none;
  transition:
    opacity var(--tc-duration-fast) var(--tc-ease-standard),
    transform var(--tc-duration-moderate) var(--tc-ease-move),
    left var(--tc-duration-slow) var(--tc-ease-move),
    top var(--tc-duration-slow) var(--tc-ease-move),
    visibility 0s var(--tc-duration-moderate);
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__pop[data-open] {
  opacity: 1;
  visibility: visible;
  transform: none;
  pointer-events: auto;
  transition:
    opacity var(--tc-duration-fast) var(--tc-ease-standard),
    transform var(--tc-duration-slow) var(--tc-ease-move),
    left var(--tc-duration-slow) var(--tc-ease-move),
    top var(--tc-duration-slow) var(--tc-ease-move),
    visibility 0s;
}
/* Popover: white, radius 10 – Accept is the dark chip, Reject the white secondary button */
:where([data-look="clean"], [data-look="clean"] *).ui-df__pop {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--tc-space-1);
  padding: var(--tc-space-1);
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-overlay);
  box-shadow: var(--tc-shadow-overlay);
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px) scale(0.96);
  transform-origin: 50% 100%;
  pointer-events: none;
  /* Moving from one change to the next is a short, crisp step – not a long glide */
  transition:
    opacity var(--tc-duration-fast) var(--tc-ease-standard),
    transform var(--tc-duration-base) var(--tc-ease-move),
    left var(--tc-duration-instant) var(--tc-ease-decelerate),
    top var(--tc-duration-instant) var(--tc-ease-decelerate),
    visibility 0s var(--tc-duration-base);
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__pop[data-open] {
  opacity: 1;
  visibility: visible;
  transform: none;
  pointer-events: auto;
  transition:
    opacity var(--tc-duration-fast) var(--tc-ease-standard),
    transform var(--tc-duration-moderate) var(--tc-ease-move),
    left var(--tc-duration-instant) var(--tc-ease-decelerate),
    top var(--tc-duration-instant) var(--tc-ease-decelerate),
    visibility 0s;
}
.ui-df__pop[data-snap] { transition-property: opacity, transform, visibility; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__pbtn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: 28px;
  margin: 0;
  padding: 0 var(--tc-space-2) 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-none);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__pbtn:hover { background: var(--tc-inline-diff-popover-fill); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__pbtn svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Key chips on the kbd tokens */
.ui-df__pbtn kbd {
  display: inline-grid;
  place-items: center;
  min-width: var(--tc-kbd-h);
  height: var(--tc-kbd-h);
  padding: 0 var(--tc-kbd-px);
  border-radius: var(--tc-kbd-radius);
  font: inherit;
  font-size: var(--tc-kbd-font-size);
  font-weight: var(--tc-kbd-font-weight);
  line-height: var(--tc-line-height-none);
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__pbtn kbd { background: var(--tc-kbd-on-inverse-bg); color: var(--tc-inline-diff-popover-kbd-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__sep { width: 1px; height: 16px; background: var(--tc-inline-diff-popover-fill); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  color: var(--tc-action-secondary-fg);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn svg { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn--primary svg { color: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn kbd { background: var(--tc-fill-default); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn--primary kbd { background: var(--tc-inline-diff-primary-kbd-bg); color: var(--tc-inline-diff-primary-kbd-text); }
/* fill: the diff takes the height it's given – the card fills it below the label, its text area grows */
[data-ui="df"][data-fill] { display: flex; flex-direction: column; align-self: stretch; }
[data-ui="df"][data-fill] > .ui-df__card { display: flex; flex: 1 0 auto; flex-direction: column; }
[data-ui="df"][data-fill] > .ui-df__card > .ui-df__body { flex: 1 0 auto; }
.ui-df__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
@keyframes ui-df-draw { to { stroke-dashoffset: 0; } }
/* Narrow cards: the arrows stay as 24px icon buttons (they used to disappear – 1.4.10) */
@container ui-df-card (max-width: 400px) {
:where([data-look="standard"], [data-look="standard"] *).ui-df__icon { width: 24px; height: 24px; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__head { padding-left: var(--tc-space-3-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__body { padding: var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-4); }
}
@container (max-width: 400px) {
:where([data-look="standard"], [data-look="standard"] *).ui-df__label { padding-left: var(--tc-space-1-5); }
}
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-df__pbtn kbd { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__pbtn { height: 34px; padding: 0 var(--tc-space-3) 0 var(--tc-space-2); }
}
@container ui-df-card (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-df__icon { width: 24px; height: 24px; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__actions { gap: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__body { padding: var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__foot { padding-left: var(--tc-space-3-5); }
}
/* Touch screens: taller targets, no key hints */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn kbd { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn { height: 34px; padding: 0 var(--tc-space-3) 0 var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__btn { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__icon { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__foot { min-height: 52px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="df"] *, [data-ui="df"] *::before, [data-ui="df"] *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }
  .ui-df__layer { filter: none; transform: none; }
}
`;
}

if (!customElements.get("tc-inline-diff")) customElements.define("tc-inline-diff", TcInlineDiff);

declare global {
  interface HTMLElementTagNameMap {
    "tc-inline-diff": TcInlineDiff;
  }
}

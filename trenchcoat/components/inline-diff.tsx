"use client";

/*
 * Inline Diff – review an AI's edits to a piece of prose, in a single self-contained file.
 * The original and the suggested text are diffed word by word and shown as one flowing paragraph:
 * removed words struck through on a soft red tint, new words on a soft green one. Hover or focus a
 * change and a small popover offers Accept and Reject; accepting shrinks the old words away and
 * settles the new ones into the text, rejecting does the opposite. Tab moves between changes,
 * Y / Enter / Space accepts, N / Backspace rejects, Esc hides the popover. Removed words are struck through and
 * new words underlined, so the change never rests on colour alone. A toolbar counts what's left, steps to the
 * previous / next pending change with its arrows, undoes the last decision and turns into "All changes reviewed"
 * with an Undo at the end.
 * The white card sits on a gray tray that also holds the optional label above it.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: inline-diff.tsx is Standard,
 * inline-diff-clean.tsx is Clean). Clean drops the tray: one white card with hairline shadows, edits are quiet
 * tinted fills without strokes, the optional label opens the card and the toolbar is its last row under a
 * hairline; the popover's Accept is a dark filled button.
 */
// Generated from src/components/inline-diff.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-df";

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

type InlineDiffOwnProps = {
  /** The text as it is now */
  original?: string;
  /** The text the AI suggests */
  suggested?: string;
  /** Pre-computed segments instead of original + suggested */
  changes?: DiffSegment[];
  /** Called on every decision (and undo) with the text so far – pending changes keep the original words */
  onChange?: (text: string) => void;
  /** Called once no change is pending, with the final text */
  onDone?: (text: string) => void;
  /**
   * The verdicts so far (controlled). Leave undefined to let the diff keep them, starting at `defaultDecisions`.
   * New text resets them: an uncontrolled diff starts over, a controlled one reports `{}` through onDecisionsChange
   */
  decisions?: InlineDiffDecisions;
  /** The verdicts to start with when uncontrolled */
  defaultDecisions?: InlineDiffDecisions;
  /** Every decision, undo and reset, with all verdicts so far */
  onDecisionsChange?: (decisions: InlineDiffDecisions) => void;
  /** Small line on the gray tray above the card (Clean: at the top of the card), e.g. "Suggested by AI · Make it shorter" */
  label?: string;
  /** Visual style. Defaults to the file's look: Standard in inline-diff.tsx, Clean in inline-diff-clean.tsx */
  look?: Look;
  /**
   * Grow to the container's height: the diff stretches to the height its grid or flex parent gives it and the white
   * card fills the rest below the label, the toolbar staying in its place – e.g. to match a taller card beside it in
   * a dashboard row. Off by default (the diff is as tall as its text)
   */
  fill?: boolean;
  /** The imperative handle (not the root element) */
  ref?: Ref<InlineDiffHandle>;
  className?: string;
};

export type InlineDiffProps = Omit<ComponentPropsWithoutRef<"div">, keyof InlineDiffOwnProps> & InlineDiffOwnProps;

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

/* ---------- Component ---------- */

type Decisions = InlineDiffDecisions;
type Change = { seg: number; remove: string; insert: string };

const plural = (n: number) => `${n} suggestion${n === 1 ? "" : "s"}`;
const quote = (s: string) => `“${s.trim()}”`;
const describe = (c: { remove: string; insert: string }) =>
  c.remove.trim() && c.insert.trim()
    ? `replace ${quote(c.remove)} with ${quote(c.insert)}`
    : c.insert.trim()
      ? `add ${quote(c.insert)}`
      : `remove ${quote(c.remove)}`;

/**
 * The segments for `original` → `suggested` (or the given `changes`). While the text keeps changing – a model
 * streaming its suggestion – the diff runs with a small table cap; once it has been quiet for QUIET_MS the full diff
 * runs once, so the settled result is the same as diffing the final text directly.
 */
function useDiff(original: string, suggested: string, changes: DiffSegment[] | undefined) {
  const [quiet, setQuiet] = useState(true);
  const lastKey = useRef(`${original}\u0000${suggested}`);
  // Pending while the text changed less than QUIET_MS ago
  const settling = useRef(0);
  useEffect(() => {
    const key = `${original}\u0000${suggested}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    if (settling.current) setQuiet(false);
    window.clearTimeout(settling.current);
    settling.current = window.setTimeout(() => {
      settling.current = 0;
      setQuiet(true);
    }, QUIET_MS);
  }, [original, suggested]);
  useEffect(
    () => () => {
      window.clearTimeout(settling.current);
      settling.current = 0;
    },
    [],
  );
  const cap = quiet ? MAX_CELLS : STREAMING_CELLS;
  return useMemo(() => changes ?? diffWords(original, suggested, cap), [changes, original, suggested, cap]);
}

/** Where the popover sits: above the first line of the active change, kept inside the card */
function usePopoverPosition(
  active: number | null,
  decisions: Decisions,
  cardRef: { current: HTMLDivElement | null },
  popRef: { current: HTMLDivElement | null },
  items: { current: (HTMLSpanElement | null)[] },
) {
  const [pos, setPos] = useState<{ left: number; top: number; snap: boolean } | null>(null);
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    const place = () => {
      const root = cardRef.current;
      const pop = popRef.current;
      const el = active === null ? null : items.current[active];
      if (!root || !pop || !el) return;
      // All reads first, then the one write
      const r = root.getBoundingClientRect();
      // Works inside CSS zoom or transforms: convert viewport pixels back to the card's own pixels
      const scale = r.width ? root.offsetWidth / r.width : 1;
      const first = el.getClientRects()[0] ?? el.getBoundingClientRect();
      const pw = pop.offsetWidth;
      const ph = pop.offsetHeight;
      const center = (first.left - r.left + first.width / 2) * scale;
      const left = Math.min(Math.max(center - pw / 2, 8), Math.max(8, root.offsetWidth - pw - 8));
      const top = (first.top - r.top) * scale - ph - 6;
      setPos({ left, top, snap: !wasOpen.current });
      wasOpen.current = true;
    };
    if (active === null) {
      wasOpen.current = false;
      return;
    }
    place();
    const ro = new ResizeObserver(place);
    if (cardRef.current) ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, [active, decisions, cardRef, popRef, items]);
  return pos;
}

function DiffToolbar({
  pending,
  done,
  canUndo,
  undoRef,
  onStep,
  onAll,
  onUndo,
  onUndoStep,
}: {
  pending: number;
  done: boolean;
  canUndo: boolean;
  undoRef: Ref<HTMLButtonElement>;
  onStep: (dir: 1 | -1) => void;
  onAll: (verdict: InlineDiffVerdict) => void;
  onUndo: () => void;
  /** Undo while changes are still pending – focus goes back to the change */
  onUndoStep: () => void;
}) {
  return (
    <div className="ui-df__bar">
      <div className="ui-df__layer" data-show={!done || undefined} inert={done} aria-hidden={done || undefined}>
        <span className="ui-df__count">
          <span className="ui-df__num">{pending}</span>
          <span className="ui-df__word">{pending === 1 ? "suggestion" : "suggestions"}</span>
        </span>
        <span className="ui-df__actions">
          {/* Not focus-stealing on click: a focused change keeps focus, so its highlight can't blur away */}
          <span className="ui-df__nav" onMouseDown={(e) => e.preventDefault()}>
            <button type="button" className="ui-df__icon" onClick={onUndoStep} hidden={!canUndo || done} aria-label="Undo last decision" title="Undo last decision">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5.5 4 2.75 6.75 5.5 9.5" />
                <path d="M3 6.75h6.5a3.75 3.75 0 0 1 0 7.5H7.5" />
              </svg>
            </button>
            <button type="button" className="ui-df__icon" onClick={() => onStep(-1)} disabled={!pending} aria-label="Previous suggestion">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M10 12.5 5.5 8 10 3.5" />
              </svg>
            </button>
            <button type="button" className="ui-df__icon" onClick={() => onStep(1)} disabled={!pending} aria-label="Next suggestion">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6 3.5 10.5 8 6 12.5" />
              </svg>
            </button>
          </span>
          <button type="button" className="ui-df__btn" onClick={() => onAll("rejected")} disabled={!pending}>
            Reject all
          </button>
          <button type="button" className="ui-df__btn ui-df__btn--primary" onClick={() => onAll("accepted")} disabled={!pending}>
            Accept all
          </button>
        </span>
      </div>

      <div className="ui-df__layer" data-show={done || undefined} inert={!done} aria-hidden={!done || undefined}>
        <span className="ui-df__count ui-df__count--done">
          <svg className="ui-df__ok" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3.75 8.4 6.6 11.1 12.25 5" pathLength={1} />
          </svg>
          All changes reviewed
        </span>
        <button ref={undoRef} type="button" className="ui-df__btn" onClick={onUndo} disabled={!canUndo}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M5.5 4 2.75 6.75 5.5 9.5" />
            <path d="M3 6.75h6.5a3.75 3.75 0 0 1 0 7.5H7.5" />
          </svg>
          Undo
        </button>
      </div>
    </div>
  );
}

/** The text as one paragraph: equal runs as they are, each change as a focusable span with its old and new words */
function DiffText({
  segments,
  decisions,
  active,
  idBase,
  items,
  onKey,
  onFocusChange,
  onBlurChange,
  onEnter,
  onLeave,
}: {
  segments: DiffSegment[];
  decisions: Decisions;
  active: number | null;
  /** Prefix for the ids of the hidden descriptions */
  idBase: string;
  items: { current: (HTMLSpanElement | null)[] };
  onKey: (e: KeyboardEvent, i: number) => void;
  onFocusChange: (i: number) => void;
  onBlurChange: (i: number) => void;
  onEnter: (i: number) => void;
  onLeave: () => void;
}) {
  const total = segments.filter((s) => s.type === "change").length;
  const pendingChanges = segments.filter((s): s is Extract<DiffSegment, { type: "change" }> => s.type === "change");
  let ci = -1;
  return (
    <>
    <p className="ui-df__text">
      {segments.map((s, i) => {
        if (s.type === "equal") return <span key={i}>{s.text}</span>;
        ci++;
        const idx = ci;
        const state: InlineDiffVerdict | "pending" = decisions[idx] ?? "pending";
        const open = state === "pending";
        return (
          <span
            key={i}
            ref={(el) => {
              items.current[idx] = el;
            }}
            className="ui-df__chg"
            data-state={state}
            data-active={active === idx || undefined}
            tabIndex={open ? 0 : undefined}
            role={open ? "button" : undefined}
            // Named by its own words (2.5.3); what it does and how to decide is the description
            aria-describedby={open ? `${idBase}-d${idx}` : undefined}
            onKeyDown={open ? (e) => onKey(e, idx) : undefined}
            onFocus={() => onFocusChange(idx)}
            onBlur={() => onBlurChange(idx)}
            onMouseEnter={() => onEnter(idx)}
            onMouseLeave={onLeave}
          >
            {s.remove && (
              <del className="ui-df__del" aria-hidden={state === "accepted" || undefined}>
                {s.remove}
              </del>
            )}
            {s.insert && (
              <ins className="ui-df__ins" aria-hidden={state === "rejected" || undefined}>
                {s.insert}
              </ins>
            )}
          </span>
        );
      })}
    </p>
    <span className="ui-df__sr">
      {pendingChanges.map((s, idx) =>
        decisions[idx] ? null : (
          <span key={idx} id={`${idBase}-d${idx}`}>
            Suggestion {idx + 1} of {total}: {describe(s)}. Y, Enter or Space accepts, N rejects.
          </span>
        ),
      )}
    </span>
    </>
  );
}

/** Accept / Reject for the active change, floating above it */
function ReviewPopover({
  popRef,
  open,
  pos,
  clean,
  onEnter,
  onLeave,
  onDecide,
}: {
  popRef: Ref<HTMLDivElement>;
  open: boolean;
  pos: { left: number; top: number; snap: boolean } | null;
  clean: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onDecide: (verdict: InlineDiffVerdict) => void;
}) {
  return (
    <div
      ref={popRef}
      className="ui-df__pop"
      data-open={open || undefined}
      data-snap={pos?.snap || undefined}
      style={pos ? { left: pos.left, top: pos.top } : undefined}
      role="group"
      aria-label="Review suggestion"
      aria-hidden={!open || undefined}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      // Keep focus on the change while clicking the popover
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        tabIndex={-1}
        className="ui-df__pbtn ui-df__pbtn--primary"
        onClick={() => onDecide("accepted")}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.75 8.4 6.6 11.1 12.25 5" />
        </svg>
        Accept
        <kbd aria-hidden="true">Y</kbd>
      </button>
      {!clean && <span className="ui-df__sep" aria-hidden="true" />}
      <button type="button" tabIndex={-1} className="ui-df__pbtn" onClick={() => onDecide("rejected")}>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
        </svg>
        Reject
        <kbd aria-hidden="true">N</kbd>
      </button>
    </div>
  );
}

export function InlineDiff({
  original = "",
  suggested = "",
  changes,
  onChange,
  onDone,
  decisions: decisionsProp,
  defaultDecisions = NO_DECISIONS,
  onDecisionsChange,
  label,
  look,
  fill,
  ref,
  className,
  ...rest
}: InlineDiffProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const segments = useDiff(original, suggested, changes);
  const signature = useMemo(() => JSON.stringify(segments), [segments]);

  // Index of every change among the segments
  const list = useMemo(() => {
    const out: Change[] = [];
    segments.forEach((s, i) => {
      if (s.type === "change") out.push({ seg: i, remove: s.remove, insert: s.insert });
    });
    return out;
  }, [segments]);

  const [decisions, setDecisions] = useControllable<Decisions>(decisionsProp, defaultDecisions, onDecisionsChange);
  const [history, setHistory] = useState<number[][]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  // Esc hid the popover of this change (1.4.13) – it stays hidden until another change is shown
  const [hushed, setHushed] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const idBase = "ui-df" + useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // New text in → start over
  const [seen, setSeen] = useState(signature);
  if (seen !== signature) {
    setSeen(signature);
    setHistory([]);
    setHover(null);
    setFocused(null);
    setHighlighted(null);
    setHushed(null);
  }

  // …and the verdicts start over too – reported, so a controlled parent hears about it (not on first render)
  const firstSignature = useRef(signature);
  useLayoutEffect(() => {
    if (firstSignature.current === signature) return;
    firstSignature.current = signature;
    setDecisions(NO_DECISIONS);
  }, [signature, setDecisions]);

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLSpanElement | null)[]>([]);
  const leaveTimer = useRef(0);
  const focusAfter = useRef<"undo" | number | null>(null);
  // The change the arrows step from: the last one shown, navigated to or decided
  const cursor = useRef<number | null>(null);

  const pending = list.map((_, i) => i).filter((i) => !decisions[i]);
  const done = list.length > 0 && pending.length === 0;

  // Which change each segment is (by index among the changes), for building the text
  const changeAt = useMemo(() => new Map(list.map((c, ci) => [c.seg, ci])), [list]);
  const textFor = (d: Decisions) =>
    segments
      .map((s, i) => {
        if (s.type === "equal") return s.text;
        return d[changeAt.get(i)!] === "accepted" ? s.insert : s.remove;
      })
      .join("");

  // Latest values for the handlers below, so the imperative handle never goes stale (updated after each commit)
  const live = useRef({ decisions, history, list, pending, textFor, onChange, onDone });
  useLayoutEffect(() => {
    live.current = { decisions, history, list, pending, textFor, onChange, onDone };
  });

  const decide = (ids: number[], verdict: InlineDiffVerdict, moveFocus = false) => {
    const { decisions: d, list: l, textFor: text } = live.current;
    const fresh = ids.filter((i) => i >= 0 && i < l.length && !d[i]);
    if (!fresh.length) return;
    const next = { ...d };
    fresh.forEach((i) => (next[i] = verdict));
    // Counted over the changes, so verdicts a controlled parent passes for indexes past the end don't count
    const left = l.filter((_, i) => !next[i]).length;
    setDecisions(next);
    setHistory((h) => [...h, fresh]);
    setHighlighted(null);
    cursor.current = Math.max(...fresh);
    const word = verdict === "accepted" ? "Accepted" : "Rejected";
    const what = fresh.length === 1 ? describe(l[fresh[0]]).replace(/^./, (c) => c.toUpperCase()) : `${fresh.length} suggestions`;
    setMessage(`${word}: ${what}. ${left ? `${plural(left)} left.` : "All changes reviewed."}`);
    if (moveFocus) {
      const after = Math.max(...fresh);
      const rest = l.map((_, i) => i).filter((i) => !next[i]);
      focusAfter.current = left ? (rest.find((i) => i > after) ?? rest[0]) : "undo";
    }
    const result = text(next);
    live.current.onChange?.(result);
    if (!left) live.current.onDone?.(result);
  };

  const undo = (moveFocus = false) => {
    const { decisions: d, history: h } = live.current;
    const last = h[h.length - 1];
    if (!last) return;
    const next = { ...d };
    last.forEach((i) => delete next[i]);
    setDecisions(next);
    setHistory(h.slice(0, -1));
    setMessage(`Undone. ${plural(live.current.list.filter((_, i) => !next[i]).length)} left.`);
    if (moveFocus) focusAfter.current = Math.min(...last);
    live.current.onChange?.(live.current.textFor(next));
  };

  const reset = () => {
    setDecisions(NO_DECISIONS);
    setHistory([]);
    setHighlighted(null);
    setHover(null);
    setMessage("");
    cursor.current = null;
  };

  useImperativeHandle(ref, () => ({
    highlight: (i) => setHighlighted(i),
    accept: (i) => decide([i], "accepted"),
    reject: (i) => decide([i], "rejected"),
    acceptAll: () => decide(live.current.pending, "accepted"),
    rejectAll: () => decide(live.current.pending, "rejected"),
    undo: () => undo(),
    reset,
  }));

  // Move focus once the DOM shows the new state (the Undo layer is inert until then)
  useLayoutEffect(() => {
    const target = focusAfter.current;
    if (target === null) return;
    focusAfter.current = null;
    if (target === "undo") undoRef.current?.focus();
    else items.current[target]?.focus();
  }, [decisions]);

  // Which change shows the popover: the hovered one, else the focused one, else a highlighted one
  const candidates = [hover, focused, highlighted];
  const shownChange = candidates.find((i): i is number => i !== null && !decisions[i] && i < list.length) ?? null;
  const active = shownChange === hushed ? null : shownChange;
  // Showing another change lifts the hush
  if (hushed !== null && shownChange !== hushed) setHushed(null);
  useEffect(() => {
    if (active !== null) cursor.current = active;
  }, [active]);

  /*
   * Prev / next: highlight the neighbouring pending change (wrapping around) and show its popover.
   * The arrows never take focus (see onMouseDown in DiffToolbar), so the highlight can't be lost to a blur;
   * if a change has keyboard focus, focus follows. The page only scrolls when the change is out of view.
   */
  const step = (dir: 1 | -1) => {
    const p = live.current.pending;
    if (!p.length) return;
    const from = active ?? cursor.current ?? (dir === 1 ? -1 : Infinity);
    const target = dir === 1 ? (p.find((i) => i > from) ?? p[0]) : ([...p].reverse().find((i) => i < from) ?? p[p.length - 1]);
    window.clearTimeout(leaveTimer.current);
    setHover(null);
    setHighlighted(target);
    cursor.current = target;
    const el = items.current[target];
    if (!el) return;
    if (focused !== null) el.focus({ preventScroll: true });
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: still ? "auto" : "smooth" });
  };

  // A popover opened by hover closes with Esc from anywhere, without moving focus (1.4.13)
  useEffect(() => {
    if (active === null || hover !== active) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setHushed(active);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, hover]);

  // A highlight from the arrows stays until a decision, Esc or a click outside the component
  useEffect(() => {
    if (highlighted === null) return;
    const outside = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setHighlighted(null);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [highlighted]);

  const pos = usePopoverPosition(active, decisions, cardRef, popRef, items);

  const enter = (i: number) => {
    window.clearTimeout(leaveTimer.current);
    setHover(i);
  };
  const leave = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setHover(null), 140);
  };
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "y" || k === "enter" || k === " ") {
      e.preventDefault();
      decide([i], "accepted", true);
    } else if (k === "n" || k === "backspace" || k === "delete") {
      e.preventDefault();
      decide([i], "rejected", true);
    } else if (k === "escape") {
      // Hides the popover; focus stays on the change (it used to blur to <body>)
      setHushed(i);
      setHighlighted(null);
    }
  };

  const clean = resolvedLook === "clean";
  const labelEl = label && (
    <div className="ui-df__label">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.75c.3 2.9 1.35 3.95 4.25 4.25-2.9.3-3.95 1.35-4.25 4.25C7.7 7.35 6.65 6.3 3.75 6 6.65 5.7 7.7 4.65 8 1.75Z" />
        <path d="M12.5 10.25c.15 1.25.6 1.7 1.75 1.75-1.15.15-1.6.6-1.75 1.75-.15-1.15-.6-1.6-1.75-1.75 1.15-.05 1.6-.5 1.75-1.75Z" />
      </svg>
      <span>{label}</span>
    </div>
  );

  const barEl = (
    <DiffToolbar
      pending={pending.length}
      done={done}
      canUndo={history.length > 0}
      undoRef={undoRef}
      onStep={step}
      onAll={(verdict) => decide(pending, verdict)}
      onUndo={() => undo(true)}
      onUndoStep={() => undo(true)}
    />
  );

  const textEl = (
    <DiffText
      segments={segments}
      decisions={decisions}
      active={active}
      idBase={idBase}
      items={items}
      onKey={onKey}
      onFocusChange={setFocused}
      onBlurChange={(idx) => setFocused((f) => (f === idx ? null : f))}
      onEnter={enter}
      onLeave={leave}
    />
  );

  return (
    <div
      {...rest}
      ref={rootRef}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-fill={fill || undefined}
      data-done={done || undefined}
      onKeyDown={(e) => {
        rest.onKeyDown?.(e);
        if (e.key === "Escape" && highlighted !== null) setHighlighted(null);
        if (e.key === "Escape" && active !== null) setHushed(active);
      }}
    >
      {/* React 19 hoists this into <head> once, no matter how many diffs render */}
      <style href="ui-inline-diff" precedence="default">
        {css}
      </style>

      {/* Standard: the label sits on the gray tray, above the white card */}
      {!clean && labelEl}

      <div ref={cardRef} className="ui-df__card">
        {clean ? (
          <>
            <div className="ui-df__body">
              {/* Clean: the optional label opens the card */}
              {labelEl}
              {textEl}
            </div>
            {/* Clean: the toolbar is the last row of the card, under a hairline */}
            <div className="ui-df__foot">{barEl}</div>
          </>
        ) : (
          <>
            <div className="ui-df__head">{barEl}</div>
            <div className="ui-df__body">{textEl}</div>
          </>
        )}

        <ReviewPopover
          popRef={popRef}
          open={active !== null}
          pos={pos}
          clean={clean}
          onEnter={() => active !== null && enter(active)}
          onLeave={leave}
          onDecide={(verdict) => active !== null && decide([active], verdict, focused === active)}
        />
      </div>

      <span className="ui-df__sr" role="status" aria-live="polite">
        {message}
      </span>
    </div>
  );
}

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-df:where([data-look="standard"]),
.ui-df__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 600;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-kbd-font-size: 10.5px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 18px;
  --_tc-kbd-on-inverse-bg: light-dark(rgba(255, 255, 255, 0.16), rgba(0, 0, 0, 0.1));
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 5px;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size: 11px;
  --_tc-radius-badge: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-overlay: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-surface-inverse: light-dark(#171717, #ededed);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-overlay: light-dark(#ffffff, #232326);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-inverse: light-dark(#ffffff, #111113);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-df:where([data-look="clean"]),
.ui-df__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 500;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-kbd-font-size: 10px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 16px;
  --_tc-kbd-on-inverse-bg: light-dark(rgba(255, 255, 255, 0.16), rgba(0, 0, 0, 0.1));
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 4px;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size: 11px;
  --_tc-radius-badge: 5px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-overlay: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-surface-inverse: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-overlay: light-dark(#ffffff, #252527);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-inverse: light-dark(#fcfcfc, #161618);
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
@media (forced-colors: active) {
  :where([data-look], [data-look] *):not(#tc-fc):is(button, [role="button"], [role="switch"], [role="combobox"], [role="checkbox"], [role="radio"], input:not([type="hidden"]), select, textarea):not([role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="tab"], [role="treeitem"], [role="gridcell"], [role="row"]) { border: 1px solid ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(input, select, textarea) { border-color: FieldText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([role="listbox"], [role="menu"], [role="dialog"], [role="tooltip"], [role="tablist"], [role="radiogroup"]) { outline: 1px solid CanvasText; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) { forced-color-adjust: none; background: Highlight !important; color: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) * { color: HighlightText !important; background: none !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"] span:empty { background: ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"][aria-checked="true"] span:empty { background: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(:disabled, [aria-disabled="true"]) { color: GrayText !important; border-color: GrayText !important; }
}

:where([data-look="standard"], [data-look="standard"] *).ui-df {
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
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
/* Colors and motion as variables – override them on .ui-df */
:where([data-look="clean"], [data-look="clean"] *).ui-df {
  --tc-inline-diff-ins-bg-active: light-dark(rgba(26, 154, 82, 0.16), rgba(62, 194, 122, 0.22));
  --tc-inline-diff-del-bg-active: light-dark(rgba(229, 72, 77, 0.14), rgba(240, 90, 90, 0.22));
  /* Edits are tinted fills only – no strokes */
  --tc-inline-diff-strike: light-dark(rgba(229, 72, 77, 0.6), rgba(255, 120, 120, 0.7));
  --tc-inline-diff-primary-kbd-bg: var(--tc-kbd-on-inverse-bg, var(--_tc-kbd-on-inverse-bg));
  --tc-inline-diff-primary-kbd-text: light-dark(rgba(255, 255, 255, 0.66), rgba(28, 28, 30, 0.6));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  display: grid;
  width: 100%;
  min-width: 0;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
.ui-df *, .ui-df *::before, .ui-df *::after { box-sizing: border-box; }
/* The optional label sits on the gray tray, above the card */
:where([data-look="standard"], [data-look="standard"] *).ui-df__label {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  min-width: 0;
  padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-1, var(--_tc-space-1));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  letter-spacing: -0.003em;
}
:where([data-look="clean"], [data-look="clean"] *):where(.ui-df) button {
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
:where([data-look="clean"], [data-look="clean"] *):where(.ui-df) svg { display: block; flex: none; }
/* One card – the edge is a shadow, not a border. The popover is positioned relative to it */
.ui-df__card {
  position: relative;
  min-width: 0;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  container: ui-df-card / inline-size;
}
/* The optional label opens the card */
:where([data-look="clean"], [data-look="clean"] *).ui-df__label {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  min-width: 0;
  margin: 0 0 var(--tc-space-2, var(--_tc-space-2));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
}
.ui-df__label span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__label svg { flex: none; width: 13px; height: 13px; fill: currentColor; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__head {
  padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-4, var(--_tc-space-4));
  border-bottom: 1px solid var(--tc-border-default, var(--_tc-border-default));
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__label svg { width: 16px; height: 16px; fill: var(--tc-accent, var(--_tc-accent)); }
/* The prose */
:where([data-look="clean"], [data-look="clean"] *).ui-df__body { padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4-5, var(--_tc-space-4-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__text {
  margin: 0;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed));
  white-space: pre-line; /* line breaks stay, doubled spaces around a settled change collapse */
  overflow-wrap: anywhere;
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__chg { border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); cursor: pointer; scroll-margin: 64px 0 72px; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__chg:not([data-state="pending"]) { cursor: auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__del,
:where([data-look="clean"], [data-look="clean"] *).ui-df__ins {
  padding: 1px var(--tc-space-0-5, var(--_tc-space-0-5));
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  font-size: 1em;
  transition:
    background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    text-decoration-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    font-size var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)),
    padding var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)),
    margin var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)),
    opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* Removed: a red tint, the words grayed and struck */
:where([data-look="clean"], [data-look="clean"] *).ui-df__del {
  background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  text-decoration: line-through;
  text-decoration-color: var(--tc-inline-diff-strike);
  text-decoration-thickness: 1px;
}
/* Added: a green tint, the words in full ink */
:where([data-look="clean"], [data-look="clean"] *).ui-df__ins {
  background: var(--tc-status-success-bg, var(--_tc-status-success-bg));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__del + .ui-df__ins { margin-left: var(--tc-space-1, var(--_tc-space-1)); }
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
  padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-4, var(--_tc-space-4));
  border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default));
}
/* The two toolbars share one cell and cross-fade */
.ui-df__bar { display: grid; }
.ui-df__layer {
  grid-area: 1 / 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2, var(--_tc-space-2));
  min-width: 0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px);
  filter: blur(2px);
  transition: opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), filter var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), visibility 0s var(--tc-duration-slower, var(--_tc-duration-slower));
}
.ui-df__layer[data-show] {
  opacity: 1;
  visibility: visible;
  transform: none;
  filter: none;
  transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-instant, var(--_tc-duration-instant)), transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-instant, var(--_tc-duration-instant)), filter var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-instant, var(--_tc-duration-instant)), visibility 0s;
}
/* Narrow cards (e.g. a side panel): the count keeps only its number, so the toolbar stays on one line */
@container ui-df-card (max-width: 400px) {
  .ui-df__word { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__count {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  letter-spacing: -0.006em;
  white-space: nowrap;
}
/* The count: a badge on the pill tokens */
.ui-df__num {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  border-radius: var(--tc-radius-badge, var(--_tc-radius-badge));
  font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size));
  font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong));
  font-variant-numeric: tabular-nums;
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__num { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__ok {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--tc-status-success-solid, var(--_tc-status-success-solid));
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__count {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__count--done { gap: var(--tc-space-1-5, var(--_tc-space-1-5)); color: var(--tc-text-primary, var(--_tc-text-primary)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__num { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__ok {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--tc-status-success-solid, var(--_tc-status-success-solid));
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
.ui-df[data-done] .ui-df__ok { animation: ui-df-draw var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-base, var(--_tc-duration-base)) forwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__actions { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); margin-left: auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__nav { display: inline-flex; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); margin-right: var(--tc-space-0-5, var(--_tc-space-0-5)); }
/* Toolbar buttons: Button's recipe – Reject all / Undo secondary, Accept all primary (flat ink), arrows ghost */
.ui-df__btn,
.ui-df__icon {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  margin: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  font: inherit;
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
  -webkit-tap-highlight-color: transparent;
}
/* 28px in both looks: Standard's small control, Clean's medium */
:where([data-look="standard"], [data-look="standard"] *).ui-df__btn, :where([data-look="standard"], [data-look="standard"] *).ui-df__icon { height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__btn, :where([data-look="clean"], [data-look="clean"] *).ui-df__icon { height: var(--tc-control-h-md, var(--_tc-control-h-md)); }
.ui-df__btn { padding: 0 var(--tc-control-px-sm, var(--_tc-control-px-sm)); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); }
.ui-df__btn:has(svg) { padding-left: var(--tc-space-2, var(--_tc-space-2)); }
.ui-df__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__icon { width: var(--tc-control-h-sm, var(--_tc-control-h-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__icon { width: var(--tc-control-h-md, var(--_tc-control-h-md)); }
.ui-df__icon { padding: 0; background: transparent; color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); }
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
:where([data-look="clean"], [data-look="clean"] *).ui-df__actions { display: inline-flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); margin-left: auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__nav { display: inline-flex; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
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
:where([data-look="clean"], [data-look="clean"] *).ui-df__btn svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
.ui-df__icon:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-df__btn--primary { background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); }
.ui-df__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); }
.ui-df__btn--primary:active:not(:disabled) { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); }
.ui-df__btn:active:not(:disabled),
.ui-df__icon:active:not(:disabled) { transform: scale(0.97); }
.ui-df__btn:disabled,
.ui-df__icon:disabled { opacity: 0.4; cursor: default; }
.ui-df__btn:focus-visible,
.ui-df__icon:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
/* The prose */
:where([data-look="standard"], [data-look="standard"] *).ui-df__body { padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4-5, var(--_tc-space-4-5)) var(--tc-space-4-5, var(--_tc-space-4-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__text {
  margin: 0;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus));
  line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose));
  letter-spacing: -0.006em;
  white-space: pre-line; /* line breaks stay, doubled spaces around a settled change collapse */
  overflow-wrap: anywhere;
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__chg { border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); cursor: pointer; scroll-margin: 64px 0 24px; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__chg:not([data-state="pending"]) { cursor: auto; }
.ui-df__chg:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__del,
:where([data-look="standard"], [data-look="standard"] *).ui-df__ins {
  padding: 1px var(--tc-space-0-5, var(--_tc-space-0-5));
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  font-size: 1em;
  transition:
    background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    text-decoration-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    font-size var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)),
    padding var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)),
    margin var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)),
    opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__del {
  background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg));
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
  text-decoration: line-through;
  text-decoration-color: var(--tc-inline-diff-strike);
  text-decoration-thickness: 1px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__ins {
  background: var(--tc-status-success-bg, var(--_tc-status-success-bg));
  color: var(--tc-status-success-fg, var(--_tc-status-success-fg));
}
/* New words are underlined, removed ones struck through – the change never rests on colour alone (1.4.1) */
.ui-df__ins {
  text-decoration: underline;
  text-decoration-color: var(--tc-status-success-solid, var(--_tc-status-success-solid));
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__del + .ui-df__ins { margin-left: var(--tc-space-1, var(--_tc-space-1)); }
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
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  padding: var(--tc-space-1, var(--_tc-space-1));
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-inverse, var(--_tc-surface-inverse));
  color: var(--tc-text-on-inverse, var(--_tc-text-on-inverse));
  box-shadow: var(--tc-shadow-overlay, var(--_tc-shadow-overlay));
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px) scale(0.96);
  transform-origin: 50% 100%;
  pointer-events: none;
  transition:
    opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)),
    left var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)),
    top var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)),
    visibility 0s var(--tc-duration-moderate, var(--_tc-duration-moderate));
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__pop[data-open] {
  opacity: 1;
  visibility: visible;
  transform: none;
  pointer-events: auto;
  transition:
    opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)),
    left var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)),
    top var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)),
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
  gap: var(--tc-space-1, var(--_tc-space-1));
  padding: var(--tc-space-1, var(--_tc-space-1));
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-overlay, var(--_tc-surface-overlay));
  box-shadow: var(--tc-shadow-overlay, var(--_tc-shadow-overlay));
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px) scale(0.96);
  transform-origin: 50% 100%;
  pointer-events: none;
  /* Moving from one change to the next is a short, crisp step – not a long glide */
  transition:
    opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)),
    left var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    top var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    visibility 0s var(--tc-duration-base, var(--_tc-duration-base));
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__pop[data-open] {
  opacity: 1;
  visibility: visible;
  transform: none;
  pointer-events: auto;
  transition:
    opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)),
    left var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    top var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    visibility 0s;
}
.ui-df__pop[data-snap] { transition-property: opacity, transform, visibility; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__pbtn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  height: 28px;
  margin: 0;
  padding: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-2, var(--_tc-space-2));
  border: 0;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
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
  min-width: var(--tc-kbd-h, var(--_tc-kbd-h));
  height: var(--tc-kbd-h, var(--_tc-kbd-h));
  padding: 0 var(--tc-kbd-px, var(--_tc-kbd-px));
  border-radius: var(--tc-kbd-radius, var(--_tc-kbd-radius));
  font: inherit;
  font-size: var(--tc-kbd-font-size, var(--_tc-kbd-font-size));
  font-weight: var(--tc-kbd-font-weight, var(--_tc-kbd-font-weight));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
}
:where([data-look="standard"], [data-look="standard"] *).ui-df__pbtn kbd { background: var(--tc-kbd-on-inverse-bg, var(--_tc-kbd-on-inverse-bg)); color: var(--tc-inline-diff-popover-kbd-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__sep { width: 1px; height: 16px; background: var(--tc-inline-diff-popover-fill); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5)) 0 var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn--primary { background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn--primary svg { color: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn--primary:hover { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn kbd { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn--primary kbd { background: var(--tc-inline-diff-primary-kbd-bg); color: var(--tc-inline-diff-primary-kbd-text); }
/* fill: the diff takes the height it's given – the card fills it below the label, its text area grows */
.ui-df[data-fill] { display: flex; flex-direction: column; align-self: stretch; }
.ui-df[data-fill] > .ui-df__card { display: flex; flex: 1 0 auto; flex-direction: column; }
.ui-df[data-fill] > .ui-df__card > .ui-df__body { flex: 1 0 auto; }
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
:where([data-look="standard"], [data-look="standard"] *).ui-df__head { padding-left: var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-df__body { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-4, var(--_tc-space-4)); }
}
@container (max-width: 400px) {
:where([data-look="standard"], [data-look="standard"] *).ui-df__label { padding-left: var(--tc-space-1-5, var(--_tc-space-1-5)); }
}
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-df__pbtn kbd { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-df__pbtn { height: 34px; padding: 0 var(--tc-space-3, var(--_tc-space-3)) 0 var(--tc-space-2, var(--_tc-space-2)); }
}
@container ui-df-card (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-df__icon { width: 24px; height: 24px; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__actions { gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__body { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-4, var(--_tc-space-4)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__foot { padding-left: var(--tc-space-3-5, var(--_tc-space-3-5)); }
}
/* Touch screens: taller targets, no key hints */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn kbd { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__pbtn { height: 34px; padding: 0 var(--tc-space-3, var(--_tc-space-3)) 0 var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-df__btn { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__icon { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-df__foot { min-height: 52px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-df *, .ui-df *::before, .ui-df *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }
  .ui-df__layer { filter: none; transform: none; }
}
`;

/* ---------- Shared helpers (inlined from src/internal) ---------- */

// Written as the literal `process.env.NODE_ENV` so bundlers replace it and production builds skip the warning;
// without a bundler `process` doesn't exist and the warning stays off
declare const process: { env: { NODE_ENV?: string } };
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

/**
 * State that a parent may control. `value` defined → controlled: the component shows `value` and only asks for
 * changes through `onChange`. `value` undefined → uncontrolled: the component keeps its own state, starting at
 * `defaultValue`, and still reports changes. Whether `onChange` is passed never decides which – passing a callback
 * for analytics must not freeze the component.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: a controlled value nobody can change is almost always a
  // starting value passed to the wrong prop, so say so once (in development)
  const warned = useRef(false);
  if (controlled && !onChange && !warned.current && DEV) {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  // Read through refs so the setter is stable and never acts on a stale value
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(latest.current) : next;
      if (Object.is(resolved, latest.current)) return;
      if (!controlled) setOwn(resolved);
      latest.current = resolved;
      report.current?.(resolved);
    },
    [controlled],
  );
  return [current, set] as const;
}

"use client";

import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type Dispatch,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
  type SetStateAction,
} from "react";
import { reducedMotion } from "../internal/reduced-motion";
import { useControllable } from "../internal/use-controllable";
import { useFocusRescue } from "../internal/use-focus-rescue";
import { useOnScreen } from "../internal/use-on-screen";

/*
 * Review Center – a focused workspace for what your agents want to do, in a single self-contained file.
 * Human in the loop, one item at a time and fast: the queue sorted by risk, and the item you're on – who proposes
 * it, why, the proposal itself (fields, text, a code diff or a plan) and the spots the agent isn't sure about in amber.
 * A white card on a soft gray tray, and a quiet line on top: how far you are and how long the oldest has waited.
 *   · on the left the queue, sorted by risk; on the right the item you're on
 *   · low-confidence spans are marked – point at one (or press F) for the agent's note and its source
 *   · Approve (A), Edit (E) in place, Reject (R) with a quick reason (1–4), Skip (S) – shortcuts on every button
 *   · a decision is calm: its row closes up with a small check or cross, and the next item rises in
 *   · new items slide into the queue at their sorted spot; the last decision can be undone (Z)
 * `onDecide` may return a promise: the chip shows the decision as saving, and if it rejects the item comes back into
 * the queue with the error, ready to try again. Decided and skipped marks are kept per id while the id stays in
 * `items`; an id that leaves `items` and comes back later is a fresh item. `filter` is controlled when defined.
 * Other DOM props go to the root; `ref` is the imperative handle below.
 * Narrow containers stack the queue above the item. The styles are injected below, so no extra files are needed.
 * Two looks, picked with the `look` prop (the default comes from the file: review-center.tsx is Standard,
 * review-center-clean.tsx is Clean). Clean is one quiet white card with hairlines instead of the gray tray, with
 * smaller radii and type, 0.5px edges and the emphasized easing.
 */

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-rvc";

export type ReviewRisk = "high" | "medium" | "low";

/** A span the agent isn't sure about – marked in the proposal, its note shows on hover */
export type ReviewFlag = { text: string; note: string; source?: string };
/** Plain text, or text with flagged spans in it */
export type ReviewText = string | (string | ReviewFlag)[];

export type ReviewField = { label: string; value: ReviewText };
/** One file of a code change – its diff in unified form: lines start with "+", "-" or " ", hunks with "@@ -12,6 +12,7 @@" */
export type ReviewFile = {
  path: string;
  added?: number;
  removed?: number;
  diff?: ReviewText;
  /** First line number of the diff (default 1) */ start?: number;
};
/** One step of a plan – flag a step's title or detail to mark it */
export type ReviewStep = {
  title: ReviewText;
  tool?: string;
  icon?: ReactNode;
  detail?: ReviewText;
};
export type ReviewSource = { label: string; icon?: ReactNode; href?: string };

export type ReviewItem = {
  id: string;
  /** What it is, e.g. "Refund order #4821 for Maya Chen" */
  title: string;
  /** Who proposes it, e.g. "Support agent" */
  agent: string;
  /** The model behind the agent – shown after its name */
  model?: string;
  /** A small mark, e.g. the model maker's logo – defaults to the agent's initial */
  icon?: ReactNode;
  /** The kind of task, e.g. "Refund", "Email", "Contract clause", "Code change" */
  type: string;
  risk: ReviewRisk;
  /** How sure the agent is, 0–1 */
  confidence: number;
  /** When it started waiting for you (epoch ms or a Date) */
  createdAt: number | Date;
  /** Why – the agent's short reasoning */
  reasoning?: string;
  /** Key facts of the proposal, e.g. amount, recipient, branch */
  fields?: ReviewField[];
  /** The proposed text – a reply, a clause, a diff */
  body?: ReviewText;
  /** Label above the body, e.g. "Reply" or "checkout/coupon.ts" */
  bodyLabel?: string;
  /** "code" sets the body as a diff – mono, line numbers, + and - lines tinted */
  format?: "text" | "code";
  /** A code change: files with their +/- counts, and a unified diff for the ones that matter */
  files?: ReviewFile[];
  /** A plan: ordered steps, each with the tool it calls */
  steps?: ReviewStep[];
  /** What the agent looked at */
  sources?: ReviewSource[];
};

export type ReviewResult = {
  decision: "approved" | "rejected";
  /** Why it was rejected – one of `reasons` */
  reason?: string;
  /** The edited body, when it was changed before approving */
  text?: string;
  /** Edited field values by label, when they were changed */
  fields?: Record<string, string>;
};

export type ReviewFilter = "all" | "high" | "unsure";

/** Drive it from outside – e.g. your own shortcuts, or a demo */
export type ReviewCenterHandle = {
  approve: () => void;
  /** Opens the reason picker, or rejects right away with a reason */
  reject: (reason?: string) => void;
  edit: () => void;
  /** Replaces the draft of the body (or of a field, by its label) while editing */
  setDraft: (text: string, field?: string) => void;
  /** Approves with the edits */
  save: () => void;
  cancel: () => void;
  skip: () => void;
  next: () => void;
  previous: () => void;
  undo: () => void;
  /** Shows the note of the n-th flagged span of the current item – null hides it */
  peek: (index: number | null) => void;
  select: (id: string) => void;
};

type ReviewCenterOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in review-center.tsx, Clean in review-center-clean.tsx */
  look?: Look;
  /** Everything waiting for review – decided items hide themselves, new ids slide in */
  items: ReviewItem[];
  /** May return a promise – while it runs the decision shows as saving; a rejection puts the item back with the error */
  onDecide?: (item: ReviewItem, result: ReviewResult) => void | Promise<unknown>;
  /** A decision was taken back – put the item back if you dropped it from `items` */
  onUndo?: (item: ReviewItem, result: ReviewResult) => void;
  onSkip?: (item: ReviewItem) => void;
  /** How many were reviewed before (e.g. today) – the header counts on from here */
  reviewed?: number;
  /** The total for the header – defaults to reviewed + waiting */
  total?: number;
  /** How long an item may wait, in ms – the waiting time turns amber at 75% and red past it (default 30 min) */
  sla?: number;
  /** The clock (epoch ms) – defaults to the real one */
  now?: number;
  /** Below this confidence an item counts as unsure (default 0.7) */
  lowConfidence?: number;
  /** The quick reasons for a rejection, picked with 1–4 */
  reasons?: string[];
  /** "risk" (default): high risk first, then oldest · "oldest" · "given": as passed */
  order?: "risk" | "oldest" | "given";
  filter?: ReviewFilter;
  defaultFilter?: ReviewFilter;
  onFilterChange?: (filter: ReviewFilter) => void;
  title?: string;
  /** How long the Undo chip stays after a decision, in ms (default 6000) – `false` keeps it until the next decision.
   *  It always waits while it is hovered or has focus; Z undoes the last decision either way */
  undoTimeout?: number | false;
  /** The single-key shortcuts (A, E, R, S, J/K, F, Z, 1–4) while focus is inside – `false` turns them off; Esc and
   *  ⌘/Ctrl combinations keep working (WCAG 2.1.4) */
  shortcuts?: boolean;
  ref?: Ref<ReviewCenterHandle>;
  className?: string;
};

export type ReviewCenterProps = Omit<ComponentPropsWithoutRef<"div">, keyof ReviewCenterOwnProps> & ReviewCenterOwnProps;

/* ---------- Helpers ---------- */

const RISK: Record<ReviewRisk, { label: string; rank: number }> = {
  high: { label: "High risk", rank: 0 },
  medium: { label: "Medium risk", rank: 1 },
  low: { label: "Low risk", rank: 2 },
};
const REASONS = ["Wrong info", "Tone", "Not allowed", "Other"];
/** Motion: how long a decided row shows its mark, how long leaving takes, how long Undo stays */
const STAMP = 180;
const EXIT = 300;
const UNDO_FOR = 6000;

const toMs = (d: number | Date) => (typeof d === "number" ? d : d.getTime());
const waited = (ms: number) => {
  const m = Math.floor(Math.max(0, ms) / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
  return `${Math.floor(h / 24)}d`;
};
const partsOf = (t?: ReviewText): (string | ReviewFlag)[] => (t === undefined ? [] : typeof t === "string" ? [t] : t);
const plain = (t?: ReviewText) =>
  partsOf(t)
    .map((p) => (typeof p === "string" ? p : p.text))
    .join("");
const flagsIn = (t?: ReviewText) => partsOf(t).filter((p) => typeof p !== "string").length;
const pct = (c: number) => `${Math.round(Math.max(0, Math.min(1, c)) * 100)}%`;
/** What changed between two texts: the common start, the new middle, the common end */
const changed = (a: string, b: string): [string, string, string] => {
  let s = 0;
  while (s < a.length && s < b.length && a[s] === b[s]) s++;
  let e = 0;
  while (e < a.length - s && e < b.length - s && a[a.length - 1 - e] === b[b.length - 1 - e]) e++;
  return [b.slice(0, s), b.slice(s, b.length - e), b.slice(b.length - e)];
};
/** Splits text parts into lines – for the code format */
const linesOf = (parts: (string | ReviewFlag)[]) => {
  const out: (string | ReviewFlag)[][] = [[]];
  for (const p of parts) {
    if (typeof p !== "string") {
      out[out.length - 1].push(p);
      continue;
    }
    p.split("\n").forEach((seg, i) => {
      if (i) out.push([]);
      if (seg) out[out.length - 1].push(seg);
    });
  }
  return out;
};
/** Every text of an item in the order it's shown – flags are counted along it */
const textsOf = (it: ReviewItem): (ReviewText | undefined)[] => [
  ...(it.fields ?? []).map((f) => f.value),
  it.body,
  ...(it.files ?? []).map((f) => f.diff),
  ...(it.steps ?? []).flatMap((st) => [st.title, st.detail]),
];
/** A light syntax tint, few soft colors: keywords, strings, function names and types – the rest stays ink */
const TOKENS =
  /(\/\/.*|--\s.*|"[^"]*"|'[^']*'|`[^`]*`|\b(?:const|let|var|return|if|else|await|async|function|export|import|from|new|throw|for|of|in|try|catch|null|undefined|true|false|SELECT|FROM|WHERE|UPDATE|SET|ALTER|TABLE|ADD|DROP|COLUMN|CREATE|INDEX|ON|NOT|NULL|DEFAULT|BEGIN|COMMIT|AND|IS)\b|\b[a-z_]\w*(?=\()|\b[A-Z][A-Za-z]+\b)/;
const KEYWORD = /^(?:const|let|var|return|if|else|await|async|function|export|import|from|new|throw|for|of|in|try|catch|null|undefined|true|false|[A-Z]{2,})$/;
const tint = (src: string): ReactNode[] =>
  src.split(TOKENS).map((t, i) => {
    if (i % 2 === 0 || !t) return t;
    const kind = /^(\/\/|--)/.test(t) ? "com" : /^["'`]/.test(t) ? "str" : KEYWORD.test(t) ? "kw" : /^[A-Z]/.test(t) ? "type" : "fn";
    return (
      <span key={i} data-tok={kind}>
        {t}
      </span>
    );
  });

type Mode = "view" | "reject" | "edit";
type Enter = "first" | "decide" | "down" | "up" | "fade";
type Done = { item: ReviewItem; result: ReviewResult; delay: number; key: number };
type Ghost = {
  item: ReviewItem;
  index: number;
  result?: ReviewResult;
  delay: number;
  key: number;
};
type Out = {
  item: ReviewItem;
  result: ReviewResult;
  draft: Record<string, string>;
  delay: number;
  key: number;
  dir: "approved" | "rejected";
};

/* ---------- Icons ---------- */

/* check, x, pencil-line, chevron-right, triangle-alert, rotate-ccw, link and badge-check: Lucide (ISC, lucide.dev) */
const Tick = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const Cross = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
const Pencil = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13 21h8" />
    <path d="m15 5 4 4" />
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
  </svg>
);
const Next = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const Alert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" strokeWidth="2" />
    <path d="M12 17h.01" strokeWidth="2.4" />
  </svg>
);
const UndoGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const LinkGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const Badge = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    <path d="m16 9-5.5 5.5L8 12" />
  </svg>
);
/* ---------- Pure pieces ---------- */

const slaOf = (it: ReviewItem, now: number, sla: number) => {
  const w = now - toMs(it.createdAt);
  return w >= sla ? "over" : w >= sla * 0.75 ? "near" : undefined;
};
/** A waiting time: near or past the SLA it says so in words, not only in colour; past it, a warning mark too */
const SLA_WORDS = { near: "close to the limit", over: "past the limit" } as const;
const Wait = ({ text, sla, className, as: Tag = "span" }: { text: string; sla?: "near" | "over"; className: string; as?: "span" | "b" }) => (
  <Tag className={className} data-sla={sla}>
    <span className="ui-rvc__sr">waiting </span>
    {sla === "over" && <Alert />}
    {text}
    {sla && <span className="ui-rvc__sr">{`, ${SLA_WORDS[sla]}`}</span>}
  </Tag>
);
const matches = (i: ReviewItem, f: ReviewFilter, lowConfidence: number) => f === "all" || (f === "high" ? i.risk === "high" : i.confidence < lowConfidence);
/** The editable texts of an item, as the editor starts them */
const draftOf = (it: ReviewItem) => {
  const d: Record<string, string> = {};
  for (const f of it.fields ?? []) d[`field:${f.label}`] = plain(f.value);
  if (it.body !== undefined) d.body = plain(it.body);
  return d;
};
const avatar = (it: ReviewItem) => (
  <span className="ui-rvc__avatar" data-logo={it.icon ? "" : undefined} aria-hidden="true">
    {it.icon ?? it.agent.slice(0, 1)}
  </span>
);
const editedText = (before: string, after: string) => {
  const [a, b, c] = changed(before, after);
  return (
    <>
      {a}
      {b && <ins className="ui-rvc__ins">{b}</ins>}
      {c}
    </>
  );
};

/** What the flagged spans of the item on screen need: which note is open, and where to report pointing and focus */
type FlagCtx = {
  tipIndex: number | null;
  tipId: string;
  /** A hidden "the agent is unsure" hint every flagged span points at */
  hintId: string;
  flagEls: Map<number, HTMLElement>;
  /** Pointing at a span opens its note; leaving closes it after a beat, unless the pointer moved onto the note */
  hoverFlag: (i: number) => void;
  leaveFlag: (i: number) => void;
  setPeek: Dispatch<SetStateAction<number | null>>;
};

/** The proposal's text: flagged spans marked (numbered along the item by `counter`); `format: "code"` draws a diff */
const renderText = (t: ReviewText | undefined, live: boolean, counter: { n: number }, ctx: FlagCtx, format?: "text" | "code", start = 1) => {
  const parts = partsOf(t);
  const flag = (p: ReviewFlag, k: number) => {
    const i = counter.n++;
    const on = live && ctx.tipIndex === i;
    return (
      <mark
        key={k}
        ref={
          live
            ? (el) => {
                if (el) ctx.flagEls.set(i, el);
                else ctx.flagEls.delete(i);
              }
            : undefined
        }
        className="ui-rvc__flag"
        data-on={on ? "" : undefined}
        tabIndex={live ? 0 : -1}
        aria-describedby={live ? (on ? `${ctx.hintId} ${ctx.tipId}` : ctx.hintId) : undefined}
        onMouseEnter={live ? () => ctx.hoverFlag(i) : undefined}
        onMouseLeave={live ? () => ctx.leaveFlag(i) : undefined}
        onFocus={live ? () => ctx.setPeek(i) : undefined}
        onBlur={live ? () => ctx.setPeek((p2) => (p2 === i ? null : p2)) : undefined}
      >
        {p.text}
      </mark>
    );
  };
  const inline = (ps: (string | ReviewFlag)[], code = false) => ps.map((p, k) => (typeof p === "string" ? <span key={k}>{code ? tint(p) : p}</span> : flag(p, k)));
  if (format !== "code") return inline(parts);
  // A unified diff: old and new line numbers, the sign in its own column, a light syntax tint
  let o = start;
  let n = start;
  return linesOf(parts).map((line, k) => {
    const first = line[0];
    const lead = typeof first === "string" ? first : "";
    if (lead.startsWith("@@")) {
      const m = /-(\d+)(?:,\d+)? \+(\d+)/.exec(lead);
      if (m) {
        o = Number(m[1]);
        n = Number(m[2]);
      }
      return (
        <span key={k} className="ui-rvc__hunk">
          {lead}
        </span>
      );
    }
    const sign = lead.startsWith("+") ? "add" : lead.startsWith("-") ? "del" : "ctx";
    const rest = typeof first === "string" ? [first.slice(1), ...line.slice(1)] : line;
    // One number column: the new line's number, or the old one for a removed line, with a tiny sign before it
    const no = sign === "add" ? n++ : sign === "del" ? o++ : (o++, n++);
    return (
      <span key={k} className="ui-rvc__line" data-diff={sign}>
        <span className="ui-rvc__ln">
          {sign !== "ctx" && <span className="ui-rvc__sign">{sign === "add" ? "+" : "−"}</span>}
          {no}
        </span>
        <span className="ui-rvc__src">{rest.length ? inline(rest, true) : "​"}</span>
      </span>
    );
  });
};

/* ---------- Hooks ---------- */


/**
 * The clock for waiting times, in minutes. Without one passed in, the first render (also on the server) counts from 0 –
 * every wait reads "now" – and the real clock is read before the first paint, then every 10s while on screen
 */
function useReviewClock(nowProp: number | undefined, onScreen: boolean) {
  const [tick, setTick] = useState(0);
  const own = nowProp === undefined;
  useLayoutEffect(() => {
    if (!own || !onScreen) return;
    const read = () => setTick(Date.now());
    read();
    const t = window.setInterval(read, 10_000);
    return () => window.clearInterval(t);
  }, [own, onScreen]);
  return nowProp ?? tick;
}

/** The queue: sorted, minus what's decided, through the filter – worked out again only when one of those changes */
function useQueue(items: ReviewItem[], order: ReviewCenterProps["order"], decided: Record<string, Done>, filter: ReviewFilter, lowConfidence: number) {
  return useMemo(() => {
    const sorted = order === "given" ? items : [...items].sort((a, b) => (order === "risk" ? RISK[a.risk].rank - RISK[b.risk].rank : 0) || toMs(a.createdAt) - toMs(b.createdAt));
    const pending = sorted.filter((i) => !decided[i.id]);
    const list = pending.filter((i) => matches(i, filter, lowConfidence));
    const ids = new Set(list.map((i) => i.id));
    const counts: Record<ReviewFilter, number> = {
      all: pending.length,
      high: pending.filter((i) => matches(i, "high", lowConfidence)).length,
      unsure: pending.filter((i) => matches(i, "unsure", lowConfidence)).length,
    };
    const oldest = pending.reduce<ReviewItem | undefined>((o, i) => (!o || toMs(i.createdAt) < toMs(o.createdAt) ? i : o), undefined);
    return { pending, list, ids, counts, oldest };
  }, [items, order, decided, filter, lowConfidence]);
}

/** Rows that leave – decided, filtered out, removed – stay a moment in place: marked, then they close up */
function useRowGhosts(list: ReviewItem[], ids: Set<string>, decided: Record<string, Done>, nextKey: () => number, later: (fn: () => void, ms: number) => void) {
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const prevList = useRef<ReviewItem[]>([]);
  useLayoutEffect(() => {
    const prev = prevList.current;
    prevList.current = list;
    const gone = prev.map((item, i) => ({ item, i })).filter((g) => !ids.has(g.item.id));
    if (!gone.length || reducedMotion()) return;
    const key = nextKey();
    const add: Ghost[] = gone.map((g) => ({
      item: g.item,
      index: g.i,
      result: decided[g.item.id]?.result,
      delay: decided[g.item.id]?.delay ?? 0,
      key,
    }));
    setGhosts((gs) => [...gs.filter((x) => !add.some((a) => a.item.id === x.item.id)), ...add]);
    const longest = Math.max(...add.map((a) => a.delay + (a.result ? STAMP : 0) + EXIT));
    later(() => setGhosts((gs) => gs.filter((x) => x.key !== key)), longest + 80);
  }, [list]); // eslint-disable-line react-hooks/exhaustive-deps -- a new list is the only thing that makes rows leave
  const rows: { item: ReviewItem; ghost?: Ghost }[] = list.map((item) => ({ item }));
  for (const g of [...ghosts].filter((x) => !ids.has(x.item.id)).sort((a, b) => a.index - b.index)) rows.splice(Math.min(g.index, rows.length), 0, { item: g.item, ghost: g });
  return rows;
}

type EnterOf = Map<string, { kind: "first" | "new" | "in"; delay: number }>;
/** How each listed row came in – the first picture row by row, new items with a soft highlight, returning ones simply
 *  open – fixed when it first shows, kept in state, never written while rendering */
function useRowEnter(list: ReviewItem[], items: ReviewItem[]) {
  const seen = useRef(new Set<string>());
  const mounted = useRef(false);
  const [enterKnown, setEnterKnown] = useState<EnterOf>(() => new Map());
  let enterOf: EnterOf = enterKnown;
  let fresh = 0;
  let changed = enterKnown.size !== list.filter((it) => enterKnown.has(it.id)).length;
  const next: EnterOf = new Map();
  for (const it of list) {
    const known = enterKnown.get(it.id);
    if (known) {
      next.set(it.id, known);
      continue;
    }
    changed = true;
    const kind = !mounted.current ? "first" : seen.current.has(it.id) ? "in" : "new";
    next.set(it.id, {
      kind,
      delay: Math.min(420, kind === "first" ? 80 + fresh++ * 50 : fresh++ * 30),
    });
  }
  if (changed) {
    enterOf = next;
    setEnterKnown(next);
  }
  useLayoutEffect(() => {
    mounted.current = true;
    for (const it of items) seen.current.add(it.id);
  });
  return enterOf;
}

/** Focus: keys keep working when the thing you were on goes away. Call the returned function before it might */
function useKeepFocus(rootRef: RefObject<HTMLDivElement | null>, listRef: RefObject<HTMLUListElement | null>, rowEls: Map<string, HTMLButtonElement>, current: ReviewItem | undefined) {
  const keep = useRef<"row" | "root" | null>(null);
  useLayoutEffect(() => {
    const how = keep.current;
    if (!how) return;
    keep.current = null;
    const root = rootRef.current;
    const a = document.activeElement;
    if (how === "row" && current) rowEls.get(current.id)?.focus({ preventScroll: true });
    else if (!root?.contains(a) || a === document.body) root?.focus({ preventScroll: true });
  });
  return () => {
    const a = document.activeElement;
    keep.current = listRef.current?.contains(a) ? "row" : rootRef.current?.contains(a) ? "root" : null;
  };
}

/** The agent's note sits under its flagged span (or over it): placed when it opens, and again when it or the pane resizes */
function useTipPlacement(tipRef: RefObject<HTMLDivElement | null>, stageRef: RefObject<HTMLDivElement | null>, flagEls: Map<number, HTMLElement>, tipIndex: number | null, shownKey: string) {
  useLayoutEffect(() => {
    const tip = tipRef.current;
    const stage = stageRef.current;
    const el = tipIndex !== null ? flagEls.get(tipIndex) : undefined;
    if (!tip || !stage || !el) return;
    // All reads first, then the writes
    const place = () => {
      const s = stage.getBoundingClientRect();
      const scale = stage.offsetWidth ? s.width / stage.offsetWidth : 1;
      // A span that wraps: the note sits under its last line (or over its first)
      const lines = el.getClientRects();
      const r = lines[0] ?? el.getBoundingClientRect();
      const rEnd = lines[lines.length - 1] ?? r;
      const w = tip.offsetWidth;
      const h = tip.offsetHeight;
      const top = (r.top - s.top) / scale + stage.scrollTop;
      const bottom = (rEnd.bottom - s.top) / scale + stage.scrollTop;
      const center = (r.left + r.width / 2 - s.left) / scale;
      // Below the span by default – above only when the pane has no room under it
      const fitsBelow = bottom + 8 + h <= stage.scrollTop + stage.clientHeight - 4;
      const above = !fitsBelow && top - h - 8 >= stage.scrollTop + 4;
      const left = Math.max(10, Math.min(center - w / 2, stage.offsetWidth - w - 10));
      tip.style.top = `${above ? top - h - 8 : bottom + 8}px`;
      tip.style.left = `${left}px`;
      tip.style.setProperty("--x", `${center - left}px`);
      tip.dataset.side = above ? "above" : "below";
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(tip);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [tipRef, stageRef, flagEls, tipIndex, shownKey]);
}

/** Narrow containers stack the queue above the item; there the item's box glides to its new height instead of jumping */
function useNarrowStage(rootRef: RefObject<HTMLDivElement | null>, stageRef: RefObject<HTMLDivElement | null>, curRef: RefObject<HTMLDivElement | null>, ghostRef: RefObject<HTMLDivElement | null>, out: Out | null, currentId: string | undefined) {
  const [narrow, setNarrow] = useState(false);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (!narrow) {
      stage.style.height = "";
      return;
    }
    // For a moment the box keeps the old item's height; then it glides to the new one
    const fit = () => {
      const c = curRef.current?.offsetHeight ?? 0;
      const hold = out && performance.now() - out.key < out.delay + STAMP;
      const g = hold ? (ghostRef.current?.offsetHeight ?? 0) : 0;
      stage.style.height = `${Math.max(c, g)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (curRef.current) ro.observe(curRef.current);
    const t = out ? window.setTimeout(fit, Math.max(0, out.key + out.delay + STAMP - performance.now()) + 10) : 0;
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [stageRef, curRef, ghostRef, narrow, out, currentId]);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => setNarrow(root.clientWidth - 8 < 640));
    ro.observe(root);
    return () => ro.disconnect();
  }, [rootRef]);
  return narrow;
}

/* ---------- Parts ---------- */

type DetailProps = {
  it: ReviewItem;
  /** The item that was just decided, on its way out – drawn from what was decided, with the edits marked */
  ghost?: Out;
  detailRef: RefObject<HTMLDivElement | null>;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  mode: Mode;
  draft: Record<string, string>;
  setDraft: Dispatch<SetStateAction<Record<string, string>>>;
  enterMode: Enter;
  /** The delay of the decision on its way out, if any */
  outDelay: number;
  flags: FlagCtx;
};

/** The item: who proposes it and why, the proposal itself – fields, text, a code diff or a plan – and its sources */
function Detail({ it, ghost, detailRef, editorRef, mode, draft, setDraft, enterMode, outDelay, flags }: DetailProps) {
  const live = !ghost;
  const counter = { n: 0 };
  const text = (t: ReviewText | undefined, format?: "text" | "code", start?: number) => renderText(t, live, counter, flags, format, start);
  const editing = live && mode === "edit";
  const edits = ghost?.draft ?? {};
  const base = ghost ? draftOf(it) : {};
  const d = ghost?.result.decision;
  return (
    <div
      ref={detailRef}
      className="ui-rvc__detail"
      data-ghost={ghost ? "" : undefined}
      data-decision={d}
      data-enter={ghost ? undefined : enterMode}
      aria-hidden={ghost ? true : undefined}
      style={{ "--d": `${ghost?.delay ?? outDelay}ms` } as CSSProperties}
    >
      {/* Who proposes it: the agent with a small risk tag, the model under it */}
      <div className="ui-rvc__who">
        {avatar(it)}
        <div className="ui-rvc__meta">
          <span className="ui-rvc__name">
            <span className="ui-rvc__agent" title={it.agent}>
              {it.agent}
            </span>
            {it.risk !== "low" && (
              <span className="ui-rvc__risk" data-risk={it.risk}>
                {RISK[it.risk].label}
              </span>
            )}
          </span>
          {it.model && (
            <span className="ui-rvc__model" title={it.model}>
              {it.model}
            </span>
          )}
        </div>
      </div>
      <div className="ui-rvc__ask">
        <h3 className="ui-rvc__title">{it.title}</h3>
      </div>
      {it.reasoning && (
        <p className="ui-rvc__why">
          <b>Why </b>
          {it.reasoning}
        </p>
      )}
      <section className="ui-rvc__proposal" data-editing={editing ? "" : undefined} aria-label={`Proposal: ${it.type}`}>
        {!!it.fields?.length && (
          <dl className="ui-rvc__fields">
            {it.fields.map((f) => {
              const k = `field:${f.label}`;
              return (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd title={editing ? undefined : plain(f.value)}>
                    {editing ? (
                      <input className="ui-rvc__input" value={draft[k] ?? ""} aria-label={f.label} onChange={(e) => setDraft((x) => ({ ...x, [k]: e.target.value }))} />
                    ) : ghost && edits[k] !== undefined && edits[k] !== base[k] ? (
                      editedText(base[k], edits[k])
                    ) : (
                      text(f.value)
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
        {it.body !== undefined && (
          <div className="ui-rvc__body" data-format={it.format}>
            {it.bodyLabel && <span className="ui-rvc__body-label">{it.bodyLabel}</span>}
            {editing ? (
              <div className="ui-rvc__editor">
                {/* The mirror under the field marks what you changed */}
                <div className="ui-rvc__mirror" aria-hidden="true">
                  {editedText(plain(it.body), draft.body ?? "")}
                  {"​"}
                </div>
                <textarea ref={editorRef} value={draft.body ?? ""} aria-label={it.bodyLabel ?? "Proposal"} spellCheck={false} onChange={(e) => setDraft((x) => ({ ...x, body: e.target.value }))} />
              </div>
            ) : it.format === "code" && !(ghost && edits.body !== undefined && edits.body !== base.body) ? (
              <div className="ui-rvc__code">
                <div className="ui-rvc__diff">{text(it.body, "code")}</div>
              </div>
            ) : (
              <p className="ui-rvc__text">{ghost && edits.body !== undefined && edits.body !== base.body ? editedText(base.body, edits.body) : text(it.body)}</p>
            )}
          </div>
        )}
        {!!it.files?.length && (
          // A code change: one row per file, the diff right under the files that matter
          <div className="ui-rvc__code">
            {it.files.map((f) => (
              <div key={f.path} className="ui-rvc__file">
                <div className="ui-rvc__file-head">
                  <span className="ui-rvc__path" title={f.path}>
                    {f.path.includes("/") && <span className="ui-rvc__dir">{f.path.slice(0, f.path.lastIndexOf("/") + 1)}</span>}
                    {f.path.slice(f.path.lastIndexOf("/") + 1)}
                  </span>
                  {f.added !== undefined && <span className="ui-rvc__count-add">+{f.added}</span>}
                  {f.removed !== undefined && <span className="ui-rvc__count-del">−{f.removed}</span>}
                </div>
                {f.diff !== undefined && <div className="ui-rvc__diff">{text(f.diff, "code", f.start ?? 1)}</div>}
              </div>
            ))}
          </div>
        )}
        {!!it.steps?.length && (
          <ol className="ui-rvc__steps">
            {it.steps.map((st, i) => (
              <li key={i} className="ui-rvc__step" data-flagged={flagsIn(st.title) + flagsIn(st.detail) ? "" : undefined}>
                <span className="ui-rvc__step-n" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="ui-rvc__step-main">
                  <span className="ui-rvc__step-title">{text(st.title)}</span>
                  {st.tool && (
                    <span className="ui-rvc__step-tool">
                      {st.icon && <span className="ui-rvc__source-icon">{st.icon}</span>}
                      {st.tool}
                    </span>
                  )}
                  {st.detail !== undefined && <span className="ui-rvc__step-detail">{text(st.detail)}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
      {!!it.sources?.length && (
        <div className="ui-rvc__foot">
          <ul className="ui-rvc__sources" aria-label="Sources">
            {it.sources.map((s) => {
              const inner = (
                <>
                  <span className="ui-rvc__source-icon">{s.icon ?? <LinkGlyph />}</span>
                  {s.label}
                </>
              );
              return (
                <li key={s.label}>
                  {s.href && live ? (
                    <a className="ui-rvc__source" href={s.href} target="_blank" rel="noreferrer">
                      {inner}
                    </a>
                  ) : (
                    <span className="ui-rvc__source">{inner}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

type QueueRowProps = {
  it: ReviewItem;
  ghost?: Ghost;
  isCurrent: boolean;
  /** The row the Tab key lands on */
  tabbable: boolean;
  enter?: { kind: "first" | "new" | "in"; delay: number };
  now: number;
  sla: number;
  skipped: boolean;
  rowEls: Map<string, HTMLButtonElement>;
  onSelect: (id: string) => void;
};

/** One row of the queue – a ghost row is one on its way out, marked with its decision */
function QueueRow({ it, ghost, isCurrent, tabbable, enter, now, sla, skipped, rowEls, onSelect }: QueueRowProps) {
  const w = waited(now - toMs(it.createdAt));
  const d = ghost?.result?.decision;
  return (
    <li
      className="ui-rvc__item"
      data-enter={enter?.kind}
      data-leaving={ghost ? "" : undefined}
      data-decision={d}
      style={
        {
          "--d": `${ghost ? ghost.delay : (enter?.delay ?? 0)}ms`,
        } as CSSProperties
      }
    >
      <button
        ref={
          ghost
            ? undefined
            : (el) => {
                if (el) rowEls.set(it.id, el);
                else rowEls.delete(it.id);
              }
        }
        type="button"
        className="ui-rvc__row"
        data-risk={it.risk}
        aria-current={isCurrent ? "true" : undefined}
        tabIndex={ghost ? -1 : tabbable ? 0 : -1}
        onClick={() => !ghost && onSelect(it.id)}
      >
        {avatar(it)}
        <span className="ui-rvc__row-main">
          <span className="ui-rvc__row-top">
            <span className="ui-rvc__row-title" title={it.title}>
              {it.title}
            </span>
            <span className="ui-rvc__sr">, </span>
            {d ? (
              <span className="ui-rvc__row-done" data-decision={d} aria-hidden="true">
                {d === "rejected" ? <Cross /> : <Tick />}
              </span>
            ) : (
              <Wait text={w} sla={slaOf(it, now, sla)} className="ui-rvc__wait" />
            )}
          </span>
          <span className="ui-rvc__row-meta">
            <span className="ui-rvc__sr">, </span>
            <span className="ui-rvc__tag" title={it.type}>
              {it.type}
            </span>
            <span className="ui-rvc__sr">{`, ${RISK[it.risk].label.toLowerCase()}, ${pct(it.confidence)} confidence`}</span>
            {skipped && <span className="ui-rvc__skipped">· skipped</span>}
          </span>
        </span>
      </button>
    </li>
  );
}

type Chip = {
  text: string;
  decision: ReviewResult["decision"];
  key: number;
  /** onDecide's promise is still running */
  pending?: boolean;
  /** Its time ran out while still saving */
  spent?: boolean;
  /** onDecide failed – the items are back in the queue */
  error?: { targets: ReviewItem[]; result: ReviewResult };
};

/** The last decision on top, with Undo – or, when onDecide failed, what went wrong and Try again. It goes after
 *  `timeout` ms, but the clock stops while it is hovered or has focus (WCAG 2.2.1) and starts over when you leave.
 *  The failure is announced through the review center's status region, so the chip itself is no alert */
function UndoChip({
  chip,
  pressed,
  timeout,
  onExpire,
  onRetry,
  onUndo,
}: {
  chip: Chip;
  pressed: string | null;
  timeout: number | false;
  onExpire: (key: number) => void;
  onRetry: () => void;
  onUndo: () => void;
}) {
  const [hold, setHold] = useState({ hover: false, focus: false });
  const [leaving, setLeaving] = useState(false);
  const held = hold.hover || hold.focus;
  const expire = useRef(onExpire);
  useLayoutEffect(() => {
    expire.current = onExpire;
  });
  useEffect(() => {
    setLeaving(false);
    if (held || timeout === false) return;
    const fade = Math.min(EXIT, timeout);
    const t1 = window.setTimeout(() => setLeaving(true), timeout - fade);
    const t2 = window.setTimeout(() => expire.current(chip.key), timeout);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [held, timeout, chip.key]);
  return (
    <div
      className="ui-rvc__undo"
      data-decision={chip.decision}
      data-pending={chip.pending ? "" : undefined}
      data-error={chip.error ? "" : undefined}
      data-leaving={leaving ? "" : undefined}
      aria-busy={chip.pending || undefined}
      onMouseEnter={() => setHold((h) => ({ ...h, hover: true }))}
      onMouseLeave={() => setHold((h) => ({ ...h, hover: false }))}
      onFocus={() => setHold((h) => ({ ...h, focus: true }))}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setHold((h) => ({ ...h, focus: false }))}
    >
      <span className="ui-rvc__undo-text" title={chip.text}>
        {chip.error ? <Alert /> : chip.decision === "rejected" ? <Cross /> : <Tick />}
        {chip.text}
      </span>
      {chip.error ? (
        <button type="button" className="ui-rvc__undo-btn" onClick={onRetry}>
          <UndoGlyph />
          Try again
        </button>
      ) : (
        <button type="button" className="ui-rvc__undo-btn" data-pressed={pressed === "undo" ? "" : undefined} onClick={onUndo} aria-keyshortcuts="Z Control+Z Meta+Z">
          <UndoGlyph />
          Undo
          <kbd className="ui-rvc__kbd">Z</kbd>
        </button>
      )}
    </div>
  );
}

type ActionsProps = {
  mode: Mode;
  pressed: string | null;
  empty: boolean;
  canEdit: boolean;
  canSkip: boolean;
  reasons: string[];
  approve: () => void;
  edit: () => void;
  openReject: () => void;
  skip: () => void;
  reject: (reason: string) => void;
  save: () => void;
  cancel: () => void;
};

/** The buttons under the item: Approve, Edit, Reject, Skip – the reasons while rejecting, Save and Cancel while editing */
function Actions({ mode, pressed, empty, canEdit, canSkip, reasons, approve, edit, openReject, skip, reject, save, cancel }: ActionsProps) {
  const btn = (name: string, label: string, icon: ReactNode, key: string, onClick: () => void, opts: { primary?: boolean; disabled?: boolean; danger?: boolean; focusKey?: string } = {}) => (
    <button
      type="button"
      className="ui-rvc__btn"
      data-focus-key={opts.focusKey}
      data-primary={opts.primary ? "" : undefined}
      data-danger={opts.danger ? "" : undefined}
      data-pressed={pressed === name ? "" : undefined}
      data-tone={opts.danger ? "rejected" : opts.primary ? "approved" : undefined}
      disabled={opts.disabled}
      aria-keyshortcuts={KEYS[key] ?? (key.length === 1 ? key.toUpperCase() : undefined)}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      <kbd className="ui-rvc__kbd">{key}</kbd>
    </button>
  );
  return (
    <div className="ui-rvc__actions" data-mode={mode}>
      {mode === "view" && (
        <div className="ui-rvc__btns" key="view">
          {btn("approve", "Approve", <Tick />, "A", approve, {
            primary: true,
            disabled: empty,
          })}
          {btn("edit", "Edit", <Pencil />, "E", edit, {
            disabled: empty || !canEdit,
            focusKey: "edit",
          })}
          {btn("reject", "Reject", <Cross />, "R", openReject, {
            disabled: empty,
            danger: true,
            focusKey: "reject",
          })}
          {btn("skip", "Skip", <Next />, "S", skip, {
            disabled: !canSkip,
          })}
        </div>
      )}
      {mode === "reject" && (
        <div className="ui-rvc__btns" key="reject" role="group" aria-label="Why reject it?">
          <span className="ui-rvc__why-label">Why?</span>
          {reasons.map((r, i) => (
            <button
              key={r}
              type="button"
              className="ui-rvc__reason"
              // Opening the picker from the Reject button lands on the first reason
              data-focus-key={i === 0 ? "reject" : undefined}
              data-pressed={pressed === `reason:${r}` ? "" : undefined} onClick={() => reject(r)} aria-keyshortcuts={String(i + 1)}>
              <kbd className="ui-rvc__kbd">{i + 1}</kbd>
              {r}
            </button>
          ))}
          <button type="button" className="ui-rvc__cancel" data-focus-key="reject" onClick={cancel} aria-keyshortcuts="Escape">
            Cancel
            <kbd className="ui-rvc__kbd">Esc</kbd>
          </button>
        </div>
      )}
      {mode === "edit" && (
        <div className="ui-rvc__btns" key="edit">
          {btn("save", "Approve with edits", <Tick />, "⌘↵", save, {
            primary: true,
          })}
          {btn("cancel", "Cancel", <Cross />, "Esc", cancel, { focusKey: "edit" })}
        </div>
      )}
    </div>
  );
}

/** aria-keyshortcuts for the keys shown on buttons that aren't a single letter */
const KEYS: Record<string, string> = { Esc: "Escape", "⌘↵": "Meta+Enter Control+Enter" };

const FILTERS: { id: ReviewFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "high", label: "High risk" },
  { id: "unsure", label: "Unsure" },
];

type Setter<T> = Dispatch<SetStateAction<T>>;
/** Everything the commands read and change – the review center's state at this render */
type CommandCtx = {
  current: ReviewItem | undefined;
  index: number;
  list: ReviewItem[];
  mode: Mode;
  draft: Record<string, string>;
  history: string[][];
  decided: Record<string, Done>;
  chip: Chip | null;
  filter: ReviewFilter;
  lowConfidence: number;
  done: number;
  total: number;
  flagCount: number;
  onDecide: ReviewCenterProps["onDecide"];
  onUndo: ReviewCenterProps["onUndo"];
  onSkip: ReviewCenterProps["onSkip"];
  setDecided: Setter<Record<string, Done>>;
  setHistory: Setter<string[][]>;
  setOut: Setter<Out | null>;
  setMode: Setter<Mode>;
  setPeek: Setter<number | null>;
  setDraft: Setter<Record<string, string>>;
  setChip: Setter<Chip | null>;
  setSaid: Setter<string>;
  setSkipped: Setter<Record<string, true>>;
  setCurrentId: Setter<string | null>;
  setFilter: (f: ReviewFilter) => void;
  setPressed: Setter<string | null>;
  nextEnter: { current: Enter | null };
  decidedNow: { current: Record<string, Done> };
  alive: { current: boolean };
  editorRef: RefObject<HTMLTextAreaElement | null>;
  rootRef: RefObject<HTMLDivElement | null>;
  /** The mode Cancel just left – where the focus rescue sends focus */
  leftMode: { current: Mode };
  holdFocus: () => void;
  later: (fn: () => void, ms: number) => void;
  nextKey: () => number;
};

/** What the buttons, keys and the imperative handle do: decide (and take a failed decision back), edit, move, undo */
function makeCommands(c: CommandCtx) {
  const { current, index, list, mode, draft, history, decided, chip, filter, lowConfidence, done, total, flagCount, onDecide, onUndo, onSkip, setDecided, setHistory, setOut, setMode, setPeek, setDraft, setChip, setSaid, setSkipped, setCurrentId, setFilter, setPressed, nextEnter, decidedNow, alive, editorRef, rootRef, leftMode, holdFocus, later, nextKey } = c;

  const flash = (name: string) => {
    setPressed(name);
    later(() => setPressed((p) => (p === name ? null : p)), 220);
  };
  const say = (text: string) => setSaid(text);

  const decide = (targets: ReviewItem[], result: ReviewResult) => {
    if (!targets.length) return;
    holdFocus();
    const add: Record<string, Done> = {};
    const stamp = nextKey();
    targets.forEach((it) => (add[it.id] = { item: it, result, delay: 0, key: stamp }));
    setDecided((d) => ({ ...d, ...add }));
    setHistory((h) => [...h.slice(-19), targets.map((t) => t.id)]);
    if (current && add[current.id] && !reducedMotion()) {
      const key = performance.now();
      const delay = add[current.id].delay;
      nextEnter.current = "decide";
      setOut({
        item: current,
        result,
        draft: { ...draft },
        delay,
        key,
        dir: result.decision,
      });
      later(() => setOut((o) => (o?.key === key ? null : o)), delay + STAMP + EXIT + 100);
    } else if (current && add[current.id]) nextEnter.current = "fade";
    setMode("view");
    setPeek(null);
    const word = result.decision === "approved" ? "Approved" : "Rejected";
    const edited = result.text !== undefined || result.fields !== undefined;
    const text = targets.length > 1 ? `${targets.length} approved` : `${word}${edited ? " with edits" : result.reason ? ` · ${result.reason}` : ""}`;
    const key = nextKey();
    // onDecide may return a promise: the chip shows the decision as saving until it settles
    const runs: Promise<unknown>[] = [];
    const failed: { item: ReviewItem; error: unknown }[] = [];
    for (const t of targets) {
      try {
        const r = onDecide?.(t, result);
        if (r && typeof (r as Promise<unknown>).then === "function")
          runs.push(Promise.resolve(r).catch((error: unknown) => void failed.push({ item: t, error })));
      } catch (error) {
        failed.push({ item: t, error });
      }
    }
    // The chip runs its own clock (it waits while hovered or focused); one still saving outlives it, see expireChip
    setChip({ text, decision: result.decision, key, pending: runs.length > 0 });
    say(`${targets.length > 1 ? `${targets.length} items approved` : `${word}: ${targets[0].title}${result.reason ? `, ${result.reason}` : ""}`}. ${done + targets.length} of ${total} reviewed.`);
    const settle = (sync: boolean) => {
      if (!alive.current) return;
      // Only decisions still standing go back – one already undone stays as it is
      const back = sync ? failed : failed.filter((f) => decidedNow.current[f.item.id]?.key === stamp);
      if (!back.length) {
        setChip((c) => (c?.key === key ? (c.spent ? null : { ...c, pending: false }) : c));
        return;
      }
      fail(back, result, stamp);
    };
    if (runs.length) void Promise.all(runs).then(() => settle(false));
    else if (failed.length) settle(true);
  };
  // onDecide failed: the items come back into the queue, the chip says so and offers to try again
  const fail = (back: { item: ReviewItem; error: unknown }[], result: ReviewResult, stamp: number) => {
    const ids = back.map((b) => b.item.id);
    setDecided((d) => {
      const n = { ...d };
      for (const id of ids) if (n[id]?.key === stamp) delete n[id];
      return n;
    });
    setHistory((h) => h.map((step) => step.filter((id) => !ids.includes(id))).filter((step) => step.length));
    const verb = result.decision === "approved" ? "approve" : "reject";
    const first = back[0];
    const why = first.error instanceof Error && first.error.message ? first.error.message : "";
    const text = `Couldn't ${verb}${back.length > 1 ? ` ${back.length} items` : ""}${why ? ` · ${why}` : ""}`;
    const key = nextKey();
    holdFocus();
    nextEnter.current = "up";
    setCurrentId(first.item.id);
    setChip({ text, decision: result.decision, key, error: { targets: back.map((b) => b.item), result } });
    say(`Couldn't ${verb} ${back.length > 1 ? `${back.length} items` : first.item.title}${why ? `: ${why}` : ""}. It is back in the queue.`);
  };
  const retry = () => {
    const e = chip?.error;
    if (!e) return;
    const targets = e.targets.filter((t) => list.some((i) => i.id === t.id));
    if (targets.length) decide(targets, e.result);
  };

  const approve = () => {
    if (!current) return;
    if (mode === "edit") return save();
    flash("approve");
    decide([current], { decision: "approved" });
  };
  const openReject = () => {
    if (!current) return;
    flash("reject");
    setMode(mode === "reject" ? "view" : "reject");
  };
  const reject = (reason: string) => {
    if (!current) return;
    flash(`reason:${reason}`);
    decide([current], { decision: "rejected", reason });
  };
  const edit = (focus = true) => {
    if (!current) return;
    flash("edit");
    if (mode === "edit") return;
    setDraft(draftOf(current));
    setMode("edit");
    setPeek(null);
    if (focus) requestAnimationFrame(() => (editorRef.current ?? rootRef.current?.querySelector<HTMLInputElement>(".ui-rvc__input"))?.focus({ preventScroll: true }));
  };
  const save = () => {
    if (!current || mode !== "edit") return;
    flash("save");
    const base = draftOf(current);
    const result: ReviewResult = { decision: "approved" };
    if (draft.body !== undefined && draft.body !== base.body) result.text = draft.body;
    const fields: Record<string, string> = {};
    for (const f of current.fields ?? []) {
      const k = `field:${f.label}`;
      if (draft[k] !== undefined && draft[k] !== base[k]) fields[f.label] = draft[k];
    }
    if (Object.keys(fields).length) result.fields = fields;
    decide([current], result);
  };
  const cancel = () => {
    if (mode === "view") return;
    // The focus rescue puts focus back on the button that opened this mode (Edit or Reject)
    leftMode.current = mode;
    setMode("view");
    setDraft({});
  };
  const move = (step: number) => {
    if (list.length < 2 || !current) return;
    holdFocus();
    const i = (index + step + list.length) % list.length;
    nextEnter.current = step > 0 ? "down" : "up";
    setCurrentId(list[i].id);
  };
  const skip = () => {
    if (!current) return;
    flash("skip");
    setSkipped((s) => ({ ...s, [current.id]: true }));
    onSkip?.(current);
    say(`Skipped: ${current.title}`);
    move(1);
  };
  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    holdFocus();
    flash("undo");
    setChip(null);
    const back = last.map((id) => decided[id]).filter(Boolean);
    setDecided((d) => {
      const n = { ...d };
      for (const id of last) delete n[id];
      return n;
    });
    setHistory((h) => h.slice(0, -1));
    setChip(null);
    if (back[0]) {
      nextEnter.current = "up";
      setCurrentId(back[0].item.id);
      if (!matches(back[0].item, filter, lowConfidence)) changeFilter("all");
    }
    say(`Undone – ${back.length > 1 ? `${back.length} items are` : `${back[0]?.item.title} is`} back in the queue.`);
    for (const b of back) onUndo?.(b.item, b.result);
  };
  const cycleFlag = () => {
    if (!flagCount) return;
    setPeek((p) => (p === null ? 0 : p + 1 >= flagCount ? null : p + 1));
  };
  const changeFilter = (f: ReviewFilter) => {
    nextEnter.current = "fade";
    setFilter(f);
  };
  const select = (id: string) => {
    const i = list.findIndex((x) => x.id === id);
    if (i < 0 || i === index) return;
    nextEnter.current = i > index ? "down" : "up";
    setCurrentId(id);
  };

  /** The chip's time is up: it goes – unless onDecide is still saving, then it goes once that settles */
  const expireChip = (key: number) => setChip((c) => (c?.key !== key ? c : c.pending ? { ...c, spent: true } : null));

  return { decide, retry, approve, openReject, reject, edit, save, cancel, move, skip, undo, cycleFlag, changeFilter, select, expireChip };
}

/** Decided and skipped marks belong to an id while it stays in `items`: one that left and came back is fresh again */
function useForgetLeft(
  items: ReviewItem[],
  decided: Record<string, Done>,
  skipped: Record<string, true>,
  setDecided: Dispatch<SetStateAction<Record<string, Done>>>,
  setHistory: Dispatch<SetStateAction<string[][]>>,
  setSkipped: Dispatch<SetStateAction<Record<string, true>>>,
) {
  const left = useRef(new Set<string>());
  useLayoutEffect(() => {
    const present = new Set(items.map((i) => i.id));
    const back: string[] = [];
    for (const id of Object.keys(decided)) {
      if (!present.has(id)) left.current.add(id);
      else if (left.current.has(id)) back.push(id);
    }
    for (const id of [...left.current]) if (!decided[id] || back.includes(id)) left.current.delete(id);
    if (back.length) {
      setDecided((d) => {
        const n = { ...d };
        for (const id of back) delete n[id];
        return n;
      });
      setHistory((h) => h.map((step) => step.filter((id) => !back.includes(id))).filter((step) => step.length));
    }
    if (Object.keys(skipped).some((id) => !present.has(id)))
      setSkipped((sk) => Object.fromEntries(Object.entries(sk).filter(([id]) => present.has(id))) as Record<string, true>);
  }, [items, decided, skipped, setDecided, setHistory, setSkipped]);
}

/** How the item comes in: a beat after a decision, or slid up or down when you move – set `nextEnter` before the move */
function useEnterMode(currentId: string | undefined) {
  const nextEnter = useRef<Enter | null>("first");
  const [entered, setEntered] = useState<{ id?: string; mode: Enter }>({ mode: "first" });
  const enterMode = currentId === entered.id ? entered.mode : (nextEnter.current ?? "down");
  if (currentId !== entered.id) setEntered({ id: currentId, mode: enterMode });
  // The way in is spent once the item it was for has rendered
  const enteredFor = useRef<string | undefined | null>(null);
  useLayoutEffect(() => {
    if (enteredFor.current === entered.id) return;
    enteredFor.current = entered.id;
    nextEnter.current = null;
  });
  return { nextEnter, enterMode };
}

/** Single keys while the focus is anywhere inside: A, E, R (then 1–4), S, J/K or the arrows, F, Z – Esc backs out */
const onReviewKey = (
  e: KeyboardEvent<HTMLDivElement>,
  k: {
    mode: Mode;
    peek: number | null;
    reasons: string[];
    shortcuts: boolean;
    setPeek: Dispatch<SetStateAction<number | null>>;
    dismissTip: () => boolean;
    approve: () => void;
    edit: () => void;
    openReject: () => void;
    reject: (reason: string) => void;
    skip: () => void;
    move: (step: number) => void;
    cycleFlag: () => void;
    undo: () => void;
    save: () => void;
    cancel: () => void;
  },
) => {
  const { mode, peek, reasons, shortcuts, setPeek, dismissTip, approve, edit, openReject, reject, skip, move, cycleFlag, undo, save, cancel } = k;
  if (e.defaultPrevented || e.nativeEvent.isComposing) return;
  const typing = (e.target as HTMLElement).closest("textarea, input, select, [contenteditable='true']");
  const mod = e.metaKey || e.ctrlKey;
  const run = (fn: () => void) => {
    e.preventDefault();
    fn();
  };
  if (mode === "edit" && mod && e.key === "Enter") return run(save);
  if (e.key === "Escape") {
    if (mode !== "view") return run(cancel);
    if (peek !== null) return run(() => setPeek(null));
    if (dismissTip()) e.preventDefault();
    return;
  }
  if (typing || e.altKey) return;
  if (mod) {
    if (e.key.toLowerCase() === "z" && !e.shiftKey) run(undo);
    return;
  }
  if (!shortcuts) return;
  if (mode === "reject") {
    const n = Number(e.key);
    if (n >= 1 && n <= reasons.length) return run(() => reject(reasons[n - 1]));
  }
  const keys: Record<string, () => void> = {
    a: approve,
    e: () => edit(),
    r: openReject,
    s: skip,
    j: () => move(1),
    arrowdown: () => move(1),
    k: () => move(-1),
    arrowup: () => move(-1),
    f: cycleFlag,
    z: undo,
    u: undo,
  };
  const fn = keys[e.key.toLowerCase()];
  if (fn) run(fn);
};

/** The quiet line on top: how far you are, how long the oldest has waited, and the last decision with Undo */
function Head({
  title,
  done,
  total,
  live,
  oldest,
  now,
  sla,
  chip,
  pressed,
  undoTimeout,
  onExpire,
  onRetry,
  onUndo,
}: {
  title: string;
  done: number;
  total: number;
  /** Items are still waiting */
  live: boolean;
  oldest: ReviewItem | undefined;
  now: number;
  sla: number;
  chip: Chip | null;
  pressed: string | null;
  undoTimeout: number | false;
  onExpire: (key: number) => void;
  onRetry: () => void;
  onUndo: () => void;
}) {
  return (
    <header className="ui-rvc__head">
      <span className="ui-rvc__mark">
        <Badge />
      </span>
      <span className="ui-rvc__heading">{title}</span>
      <span className="ui-rvc__progress">
        <span className="ui-rvc__track" data-live={live ? "" : undefined} aria-hidden="true">
          <span className="ui-rvc__fill" style={{ width: `${(total ? done / total : 0) * 100}%` }} />
        </span>
        <span className="ui-rvc__count">
          <b key={done}>{done}</b> of {total} reviewed
        </span>
      </span>
      {oldest && (
        <span className="ui-rvc__oldest">
          oldest <Wait as="b" className="ui-rvc__oldest-time" text={waited(now - toMs(oldest.createdAt))} sla={slaOf(oldest, now, sla)} />
        </span>
      )}
      {chip && <UndoChip key={chip.key} chip={chip} pressed={pressed} timeout={undoTimeout} onExpire={onExpire} onRetry={onRetry} onUndo={onUndo} />}
    </header>
  );
}

/* ---------- The review center ---------- */

export function ReviewCenter({
  look,
  items,
  onDecide,
  onUndo,
  onSkip,
  reviewed = 0,
  total: totalProp,
  sla = 30 * 60_000,
  now: nowProp,
  lowConfidence = 0.7,
  reasons = REASONS,
  order = "risk",
  filter: filterProp,
  defaultFilter = "all",
  onFilterChange,
  title = "Review center",
  undoTimeout = UNDO_FOR,
  shortcuts = true,
  ref,
  className,
  onKeyDown: onKeyDownProp,
  onMouseDown: onMouseDownProp,
  ...rest
}: ReviewCenterProps) {
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const rowEls = useRef(new Map<string, HTMLButtonElement>());
  const flagEls = useRef(new Map<number, HTMLElement>());
  const timers = useRef<number[]>([]);
  // Keys that only need to be unique (ghost batches, chips, decisions)
  const seq = useRef(0);
  const nextKey = () => ++seq.current;
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const list = timers.current;
    return () => {
      alive.current = false;
      list.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const onScreen = useOnScreen(rootRef);
  const now = useReviewClock(nowProp, onScreen);
  // Focus never drops to <body>: a mode swap lands on its counterpart (same data-focus-key), else the button that
  // opened the mode Cancel just left, else the root (which keeps the keys working)
  const leftMode = useRef<Mode>("view");
  useFocusRescue(rootRef, {
    fallback: () => {
      const root = rootRef.current;
      const m = leftMode.current;
      leftMode.current = "view";
      return (m !== "view" ? root?.querySelector(`.ui-rvc__actions [data-focus-key="${m}"]`) : null) ?? root?.querySelector(".ui-rvc__row[aria-current]");
    },
  });

  /* ---------- State ---------- */

  const [filter, setFilter] = useControllable<ReviewFilter>(filterProp, defaultFilter, onFilterChange, "filter");
  const [decided, setDecided] = useState<Record<string, Done>>({});
  const [history, setHistory] = useState<string[][]>([]);
  const [skipped, setSkipped] = useState<Record<string, true>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [peek, setPeek] = useState<number | null>(null);
  const [hoverFlag, setHoverFlag] = useState<number | null>(null);
  const [out, setOut] = useState<Out | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const [chip, setChip] = useState<Chip | null>(null);
  const [said, setSaid] = useState("");

  /* ---------- The queue ---------- */

  const { pending, list, ids, counts, oldest } = useQueue(items, order, decided, filter, lowConfidence);
  const done = reviewed + Object.keys(decided).length;
  const total = Math.max(totalProp ?? done + pending.length, done);

  useForgetLeft(items, decided, skipped, setDecided, setHistory, setSkipped);
  const decidedNow = useRef(decided);
  useLayoutEffect(() => {
    decidedNow.current = decided;
  });

  // The current item: the one picked, or whatever now sits where it was
  const lastIndex = useRef(0);
  const found = list.findIndex((i) => i.id === currentId);
  const index = found >= 0 ? found : Math.min(lastIndex.current, list.length - 1);
  const current = index >= 0 ? list[index] : undefined;
  const flagCount = current ? textsOf(current).reduce((n, t) => n + flagsIn(t), 0) : 0;

  const { nextEnter, enterMode } = useEnterMode(current?.id);

  // A fresh item starts clean: no picker, no draft, no note open
  useLayoutEffect(() => {
    lastIndex.current = Math.max(0, index);
    if (current && current.id !== currentId) setCurrentId(current.id);
  });
  useLayoutEffect(() => {
    setMode("view");
    setPeek(null);
    setHoverFlag(null);
    setDraft({});
    if (stageRef.current) stageRef.current.scrollTop = 0;
  }, [current?.id]);

  /* ---------- Rows that come and go ---------- */

  const rows = useRowGhosts(list, ids, decided, nextKey, later);
  const enterOf = useRowEnter(list, items);

  /* ---------- Focus: keys keep working when the thing you were on goes away ---------- */

  const holdFocus = useKeepFocus(rootRef, listRef, rowEls.current, current);
  // The current row stays in view in the queue
  useLayoutEffect(() => {
    const l = listRef.current;
    const li = current ? rowEls.current.get(current.id)?.parentElement : undefined;
    if (!l || !li || l.scrollHeight <= l.clientHeight) return;
    const top = li.offsetTop - 6;
    const bottom = li.offsetTop + li.offsetHeight + 6;
    if (top < l.scrollTop) l.scrollTo({ top, behavior: reducedMotion() ? "auto" : "smooth" });
    else if (bottom > l.scrollTop + l.clientHeight)
      l.scrollTo({
        top: bottom - l.clientHeight,
        behavior: reducedMotion() ? "auto" : "smooth",
      });
  }, [current?.id]);

  /* ---------- Actions ---------- */

  const { retry, approve, openReject, reject, edit, save, cancel, move, skip, undo, cycleFlag, changeFilter, select, expireChip } = makeCommands({
    current,
    index,
    list,
    mode,
    draft,
    history,
    decided,
    chip,
    filter,
    lowConfidence,
    done,
    total,
    flagCount,
    onDecide,
    onUndo,
    onSkip,
    setDecided,
    setHistory,
    setOut,
    setMode,
    setPeek,
    setDraft,
    setChip,
    setSaid,
    setSkipped,
    setCurrentId,
    setFilter,
    setPressed,
    nextEnter,
    decidedNow,
    alive,
    editorRef,
    rootRef,
    leftMode,
    holdFocus,
    later,
    nextKey,
  });

  useImperativeHandle(ref, () => ({
    approve,
    reject: (reason?: string) => (reason ? reject(reason) : openReject()),
    edit: () => edit(false),
    setDraft: (text: string, field?: string) => setDraft((d) => ({ ...d, [field ? `field:${field}` : "body"]: text })),
    save,
    cancel,
    skip,
    next: () => move(1),
    previous: () => move(-1),
    undo,
    peek: (i: number | null) => setPeek(i),
    select,
  }));

  /* ---------- Keyboard: single keys while the focus is anywhere inside ---------- */

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDownProp?.(e);
    onReviewKey(e, { mode, peek, reasons, shortcuts, setPeek, dismissTip, approve, edit: () => edit(), openReject, reject, skip, move, cycleFlag, undo, save, cancel });
  };

  /* ---------- The agent's note on a flagged span ---------- */

  const tipIndex = hoverFlag ?? peek;
  // The note stays while the pointer moves from the span onto it (WCAG 1.4.13); Esc closes it without moving focus
  const leaveTimer = useRef(0);
  const holdTip = () => window.clearTimeout(leaveTimer.current);
  const dropTip = (i?: number) => {
    holdTip();
    leaveTimer.current = window.setTimeout(() => setHoverFlag((h) => (i === undefined || h === i ? null : h)), 120);
  };
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);
  const dismissTip = () => {
    if (hoverFlag === null) return false;
    holdTip();
    setHoverFlag(null);
    return true;
  };
  // Esc also closes a note opened by pointing while the focus is elsewhere on the page
  const hovering = hoverFlag !== null;
  useEffect(() => {
    if (!hovering) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || rootRef.current?.contains(document.activeElement)) return;
      window.clearTimeout(leaveTimer.current);
      setHoverFlag(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hovering]);
  const tipFlag = useMemo(() => {
    if (!current || tipIndex === null) return undefined;
    const all = textsOf(current)
      .flatMap((t) => partsOf(t))
      .filter((p): p is ReviewFlag => typeof p !== "string");
    return all[tipIndex];
  }, [current, tipIndex]);
  const tipId = `${uid}-tip`;
  const hintId = `${uid}-hint`;
  const shownTip = !!tipFlag && mode !== "edit";
  useTipPlacement(tipRef, stageRef, flagEls.current, tipIndex, `${shownTip}|${current?.id}`);
  const flags: FlagCtx = {
    tipIndex,
    tipId,
    hintId,
    flagEls: flagEls.current,
    hoverFlag: (i) => {
      holdTip();
      setHoverFlag(i);
    },
    leaveFlag: (i) => dropTip(i),
    setPeek,
  };

  const narrow = useNarrowStage(rootRef, stageRef, curRef, ghostRef, out, current?.id);

  /* ---------- What is shown ---------- */

  const empty = !current;

  return (
    <div
      tabIndex={-1}
      {...rest}
      ref={rootRef}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={look ?? DEFAULT_LOOK}
      data-offscreen={onScreen ? undefined : ""}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => {
        onMouseDownProp?.(e);
        // A click on plain content keeps the keys working
        if (!(e.target as HTMLElement).closest("button, a, input, textarea, mark")) requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
      }}
    >
      <style href="ui-review-center" precedence="default">
        {css}
      </style>

      <Head
        title={title}
        done={done}
        total={total}
        live={pending.length > 0}
        oldest={oldest}
        now={now}
        sla={sla}
        chip={chip}
        pressed={pressed}
        undoTimeout={undoTimeout}
        onExpire={expireChip}
        onRetry={retry}
        onUndo={undo}
      />

      <div className="ui-rvc__card" data-narrow={narrow ? "" : undefined}>
        <div className="ui-rvc__queue">
          <div className="ui-rvc__queue-head">
            <div className="ui-rvc__filters" role="group" aria-label="Filter the queue">
              {FILTERS.map((f) => (
                <button key={f.id} type="button" className="ui-rvc__filter" aria-pressed={filter === f.id} onClick={() => changeFilter(f.id)}>
                  {f.label}
                  <span className="ui-rvc__filter-count">{counts[f.id]}</span>
                </button>
              ))}
            </div>
          </div>
          <ul ref={listRef} className="ui-rvc__list" aria-label="Queue">
            {rows.map(({ item: it, ghost }) => (
              <QueueRow
                key={ghost ? `${it.id}~out` : it.id}
                it={it}
                ghost={ghost}
                isCurrent={!ghost && current?.id === it.id}
                tabbable={!ghost && (current?.id === it.id || (!current && it === list[0]))}
                enter={ghost ? undefined : enterOf.get(it.id)}
                now={now}
                sla={sla}
                skipped={!!skipped[it.id]}
                rowEls={rowEls.current}
                onSelect={select}
              />
            ))}
            {!rows.length && <li className="ui-rvc__none">{pending.length ? "Nothing matches this filter" : "Nothing waiting"}</li>}
          </ul>
        </div>

        <div className="ui-rvc__main">
          <div ref={stageRef} className="ui-rvc__stage">
            {out && (
              <Detail
                key={`out-${out.key}`}
                it={out.item}
                ghost={out}
                detailRef={ghostRef}
                editorRef={editorRef}
                mode={mode}
                draft={draft}
                setDraft={setDraft}
                enterMode={enterMode}
                outDelay={out.delay}
                flags={flags}
              />
            )}
            {current ? (
              <Detail
                key={current.id}
                it={current}
                detailRef={curRef}
                editorRef={editorRef}
                mode={mode}
                draft={draft}
                setDraft={setDraft}
                enterMode={enterMode}
                outDelay={out?.delay ?? 0}
                flags={flags}
              />
            ) : (
              <div ref={curRef} className="ui-rvc__empty" data-after={out ? "" : undefined} style={{ "--d": `${out?.delay ?? 0}ms` } as CSSProperties}>
                <span className="ui-rvc__empty-mark">
                  <Badge size={22} />
                </span>
                <b>{pending.length ? "Nothing matches this filter" : "All caught up"}</b>
                <span>{pending.length ? `${pending.length} more in the queue under All` : `${done} of ${total} reviewed – new items from your agents show up here`}</span>
              </div>
            )}
            {shownTip && tipFlag && (
              <div
                ref={tipRef}
                id={tipId}
                role="tooltip"
                className="ui-rvc__tip"
                key={tipIndex}
                onMouseEnter={hoverFlag !== null ? holdTip : undefined}
                onMouseLeave={hoverFlag !== null ? () => dropTip() : undefined}
              >
                <span className="ui-rvc__tip-head">
                  <Alert />
                  Agent's note
                </span>
                <p>{tipFlag.note}</p>
                {tipFlag.source && <span className="ui-rvc__tip-source">{tipFlag.source}</span>}
              </div>
            )}
          </div>

          <Actions
            mode={mode}
            pressed={pressed}
            empty={empty}
            canEdit={!!current?.body || !!current?.fields?.length}
            canSkip={list.length >= 2}
            reasons={reasons}
            approve={approve}
            edit={() => edit()}
            openReject={openReject}
            skip={skip}
            reject={reject}
            save={save}
            cancel={cancel}
          />
        </div>
      </div>
      <div className="ui-rvc__sr" aria-live="polite" aria-atomic="true">
        {said}
      </div>
      <span id={hintId} hidden>
        The agent is unsure about this part – {shortcuts ? "press F or " : ""}focus it for the agent's note
      </span>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Colors, sizes and motion as variables – override them on .ui-rvc */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc {
  --tc-review-center-tok-kw: light-dark(color(display-p3 0.843 0.298 0.507), color(display-p3 0.98 0.52 0.68));
  --tc-review-center-tok-str: light-dark(color(display-p3 0.38 0.647 0.378), color(display-p3 0.56 0.82 0.54));
  --tc-review-center-tok-type: light-dark(color(display-p3 0.247 0.556 0.969), color(display-p3 0.48 0.7 1));
  --tc-review-center-tok-fn: light-dark(color(display-p3 0.587 0.29 0.667), color(display-p3 0.78 0.56 0.88));
  /* Progress bar edge and the glow at its end */
  --tc-review-center-progress-edge: light-dark(#bccdfb, #34508f);
  --tc-review-center-progress-mark: light-dark(#5b86f5, #5b9aff);
  --tc-review-center-queue-bg: light-dark(#fafafa, #1f1f22);
  /* Code: line numbers, hunk headers and comments; diff line tints; an inserted word */
  --tc-review-center-code-dim: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.42));
  --tc-review-center-diff-add-bg: light-dark(rgba(0, 160, 80, 0.06), rgba(60, 220, 130, 0.07));
  --tc-review-center-diff-del-bg: light-dark(rgba(215, 36, 0, 0.05), rgba(255, 90, 70, 0.07));
  --tc-review-center-ins-bg: light-dark(#dcf5e5, #173d27);
  /* Bars: a tint, its edge and the mark on it – progress blue, confidence by level */
  /* Risk and state */
  --tc-review-center-high-edge: light-dark(#f1a397, #74302a);
  --tc-review-center-mid-edge: light-dark(#f3c98d, #74491c);
  --tc-review-center-low-edge: light-dark(#a9dcbc, #23593a);
  /* Flagged spans: the agent isn't sure */
  --tc-review-center-flag-bg: light-dark(#fff2d4, #3d2b0c);
  --tc-review-center-flag-edge: light-dark(#f0b44c, #a8741f);
  --tc-review-center-flag-hot: light-dark(#ffe2a6, #54390c);
  --tc-review-center-flag-ink: light-dark(#6e4300, #ffd28a);
  --tc-review-center-height: 560px;
  --tc-review-center-queue: 300px;
  /* Rows grow with the text size (rem), never below their designed height */
  --tc-review-center-row: max(60px, 3.75rem);
  /* The soft highlight on a new row and the glow at the progress bar's end */
  --tc-review-center-arrive: 2200ms;
  --tc-review-center-glow: 1100ms;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container: ui-rvc / inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors, sizes and motion as variables – override them on .ui-rvc */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc {
  /* Progress bar edge and the glow at its end */
  --tc-review-center-progress-edge: light-dark(rgba(0, 96, 226, 0.32), rgba(91, 154, 255, 0.42));
  --tc-review-center-progress-mark: light-dark(rgba(0, 96, 226, 0.7), rgba(112, 170, 255, 0.85));
  /* Code: line numbers, hunk headers and comments; diff line tints; an inserted word */
  --tc-review-center-code-dim: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.42));
  --tc-review-center-diff-add-bg: light-dark(rgba(0, 160, 80, 0.06), rgba(60, 220, 130, 0.07));
  --tc-review-center-diff-del-bg: light-dark(rgba(215, 36, 0, 0.05), rgba(255, 90, 70, 0.07));
  --tc-review-center-ins-bg: light-dark(rgba(0, 164, 51, 0.13), rgba(60, 220, 130, 0.18));
  --tc-review-center-tok-kw: light-dark(color(display-p3 0.843 0.298 0.507), color(display-p3 0.98 0.52 0.68));
  --tc-review-center-tok-str: light-dark(color(display-p3 0.38 0.647 0.378), color(display-p3 0.56 0.82 0.54));
  --tc-review-center-tok-type: light-dark(color(display-p3 0.247 0.556 0.969), color(display-p3 0.48 0.7 1));
  --tc-review-center-tok-fn: light-dark(color(display-p3 0.587 0.29 0.667), color(display-p3 0.78 0.56 0.88));
  /* Bars: a tint, its edge and the mark at its leading edge */
  /* Risk and state */
  --tc-review-center-high-edge: light-dark(rgba(215, 36, 0, 0.34), rgba(255, 90, 70, 0.4));
  --tc-review-center-mid-edge: light-dark(rgba(204, 110, 0, 0.4), rgba(255, 150, 60, 0.42));
  --tc-review-center-low-edge: light-dark(rgba(0, 140, 50, 0.3), rgba(60, 220, 130, 0.36));
  /* Flagged spans: the agent isn't sure */
  --tc-review-center-flag-bg: light-dark(rgba(255, 166, 0, 0.16), rgba(255, 170, 40, 0.16));
  --tc-review-center-flag-edge: light-dark(rgba(214, 130, 0, 0.55), rgba(255, 180, 70, 0.55));
  --tc-review-center-flag-hot: light-dark(rgba(255, 166, 0, 0.28), rgba(255, 170, 40, 0.28));
  --tc-review-center-flag-ink: light-dark(#8a4600, #ffcf8a);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-review-center-height: 552px;
  --tc-review-center-queue: 296px;
  --tc-review-center-row: max(56px, 3.5rem);
  --tc-review-center-arrive: 2600ms;
  --tc-review-center-glow: 1100ms;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container: ui-rvc / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-rvc *, .ui-rvc *::before, .ui-rvc *::after { box-sizing: border-box; }
/* The root only takes focus when the focused control went away – the ring says where the keys now go */
.ui-rvc:focus { outline: none; }
.ui-rvc:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* Off-screen: every loop and highlight holds still */
.ui-rvc[data-offscreen] *, .ui-rvc[data-offscreen] *::before, .ui-rvc[data-offscreen] *::after { animation-play-state: paused; }
:where(.ui-rvc) :is(button, input, textarea) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; -webkit-tap-highlight-color: transparent; }
:where(.ui-rvc) button { cursor: pointer; }
:where(.ui-rvc) button:disabled { cursor: default; }
.ui-rvc :is(button, a, mark, input, textarea):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where(.ui-rvc) :is(p, dl, dd, h3, ul, ol) { margin: 0; padding: 0; }
.ui-rvc svg { display: block; flex: none; }
/* Key chips: the kbd pattern */
.ui-rvc__kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-kbd-fg); letter-spacing: 0; }
.ui-rvc__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- On the tray: how far you are, how long the oldest waits, the filter ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__head { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; min-width: 0; min-height: 44px; padding: 4px 6px 8px 12px; }
/* ----- The bar on top: how far you are, how long the oldest waits ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__head { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; min-width: 0; min-height: 48px; padding: 10px 12px 10px 16px; border-bottom: 0.5px solid var(--tc-border-default); }
.ui-rvc__mark { display: grid; flex: none; place-items: center; width: 16px; margin-right: -4px; color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__heading { flex: none; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__progress { display: flex; flex: none; align-items: center; gap: 8px; font-size: var(--tc-font-size-md); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__heading { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__progress { display: flex; flex: none; align-items: center; gap: 8px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
.ui-rvc__count { font-variant-numeric: tabular-nums; }
.ui-rvc__count b { display: inline-block; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); animation: ui-rvc-tick var(--tc-duration-slower) var(--tc-ease-move) both; }
/* The progress bar: a light tint with a hairline edge, a sheen sweeping while items wait */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__track { position: relative; width: 84px; height: 8px; overflow: hidden; border-radius: var(--tc-radius-xs); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__fill { position: absolute; inset: 0 auto 0 0; overflow: hidden; border-radius: var(--tc-radius-xs); background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 1px var(--tc-review-center-progress-edge); transition: width var(--tc-duration-reveal) var(--tc-ease-move); }
/* The progress bar: a light tint with a hairline edge, a sheen sweeping while items wait */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__track { position: relative; width: 80px; height: 6px; overflow: hidden; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__fill { position: absolute; inset: 0 auto 0 0; overflow: hidden; border-radius: var(--tc-radius-2xs); background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 0.5px var(--tc-review-center-progress-edge); transition: width var(--tc-duration-reveal) var(--tc-ease-move); }
/* The sheen moves with transform (composited), runs three passes when items arrive and stops (WCAG 2.2.2) */
.ui-rvc__track[data-live] .ui-rvc__fill::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent calc(50% - 20px), var(--tc-surface-raised) 50%, transparent calc(50% + 20px)); opacity: 0.7; transform: translateX(-100%); animation: ui-rvc-sweep var(--tc-duration-shimmer) linear 3; }
.ui-rvc__fill::after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; width: min(18px, 100%); background: linear-gradient(90deg, transparent, var(--tc-review-center-progress-mark)); opacity: 0.55; animation: ui-rvc-glow var(--tc-review-center-glow) var(--tc-ease-in-out) 4 alternate; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__oldest { flex: none; margin-left: -4px; font-size: var(--tc-font-size-md); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__oldest { flex: none; margin-left: -4px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
.ui-rvc__oldest::before { content: "·"; margin-right: 8px; color: var(--tc-text-disabled); }
.ui-rvc__oldest-time { display: inline-flex; align-items: center; gap: 2px; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-rvc__oldest-time[data-sla="near"] { color: var(--tc-status-warning-fg); }
.ui-rvc__oldest-time[data-sla="over"] { color: var(--tc-status-danger-fg); }
/* Past the SLA: a warning mark, not only the colour (WCAG 1.4.1) */
:is(.ui-rvc__wait, .ui-rvc__oldest-time) > svg { width: 11px; height: 11px; }
/* The filter: a small segmented control on top of the queue */
/* The filter: on white – the picked tab a white pill with a soft shadow, the others just quieter text */
.ui-rvc__filters { display: flex; flex: 1; gap: 4px; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__filter { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__filter { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rvc__filter:hover { color: var(--tc-text-primary); }
.ui-rvc__filter[aria-pressed="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow), inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); }
.ui-rvc__filter-count { font-size: var(--tc-font-size-xs-plus); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rvc__filter[aria-pressed="true"] .ui-rvc__filter-count { color: var(--tc-text-muted); }
/* ----- The white card: the queue on the left, the item on the right ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__card { position: relative; display: grid; grid-template-columns: var(--tc-review-center-queue) minmax(0, 1fr); height: var(--tc-review-center-height); overflow: hidden; border-radius: var(--tc-radius-2xl); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* ----- The queue ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__queue { display: flex; flex-direction: column; min-width: 0; min-height: 0; border-right: 1px solid var(--tc-border-default); background: var(--tc-review-center-queue-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__queue-head { display: flex; flex: none; align-items: center; padding: 8px; background: var(--tc-surface-raised); border-bottom: 1px solid var(--tc-border-default); }
/* ----- Under the bar: the queue on the left, the item on the right ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__card { position: relative; display: grid; grid-template-columns: var(--tc-review-center-queue) minmax(0, 1fr); height: var(--tc-review-center-height); overflow: hidden; border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); }
/* ----- The queue ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__queue { display: flex; flex-direction: column; min-width: 0; min-height: 0; border-right: 0.5px solid var(--tc-border-default); background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__queue-head { display: flex; flex: none; align-items: center; padding: 8px; background: var(--tc-surface-raised); border-bottom: 0.5px solid var(--tc-border-default); }
.ui-rvc__list { position: relative; flex: 1; min-height: 0; padding: 8px; overflow: hidden auto; overscroll-behavior: contain; list-style: none; scrollbar-width: thin; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__item { height: calc(var(--tc-review-center-row) + 4px); padding: 2px 0; overflow: hidden; }
.ui-rvc__item[data-enter="first"] { animation: ui-rvc-row-in var(--tc-duration-slower) var(--tc-ease-move) var(--d) backwards; }
.ui-rvc__item:is([data-enter="new"], [data-enter="in"]) { animation: ui-rvc-open var(--tc-duration-slowest) var(--tc-ease-move) var(--d) backwards; }
.ui-rvc__item[data-enter="new"] .ui-rvc__row { animation: ui-rvc-arrive var(--tc-review-center-arrive) var(--tc-ease-decelerate) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__item[data-leaving] { pointer-events: none; animation: ui-rvc-close ${EXIT}ms var(--tc-ease-move) var(--d) forwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__item { height: calc(var(--tc-review-center-row) + 2px); padding: 1px 0; overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__item[data-leaving] { pointer-events: none; animation: ui-rvc-close-clean ${EXIT}ms var(--tc-ease-move) var(--d) forwards; }
.ui-rvc__item[data-leaving][data-decision] { animation-delay: calc(var(--d) + ${STAMP}ms); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__row { position: relative; display: grid; grid-template-columns: 28px minmax(0, 1fr); align-items: center; column-gap: 10px; width: 100%; height: var(--tc-review-center-row); padding: 0 10px; border-radius: var(--tc-radius-lg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__row { position: relative; display: grid; grid-template-columns: 24px minmax(0, 1fr); align-items: center; column-gap: 10px; width: 100%; height: var(--tc-review-center-row); padding: 0 10px; border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-rvc__row:hover { background: var(--tc-fill-hover); }
/* The current row: a raised card – overlay surface, so it stands off the queue in dark too */
.ui-rvc__row[aria-current] { background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-raised); }
.ui-rvc__row:focus-visible { outline-offset: -2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__avatar { display: grid; flex: none; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__avatar > svg { width: 15px; height: 15px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__row-main { display: grid; gap: 3px; min-width: 0; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__avatar { display: grid; flex: none; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__avatar > svg { width: 13px; height: 13px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__row-main { display: grid; gap: 2px; min-width: 0; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-rvc__row-top { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ui-rvc__row-title { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__wait { flex: none; font-size: var(--tc-font-size-xs-plus); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__wait { flex: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rvc__wait { display: inline-flex; align-items: center; gap: 2px; }
.ui-rvc__wait[data-sla] { font-weight: var(--tc-font-weight-medium); }
.ui-rvc__wait[data-sla="near"] { color: var(--tc-status-warning-fg); }
.ui-rvc__wait[data-sla="over"] { color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__row-meta { display: flex; align-items: center; gap: 5px; min-width: 0; font-size: var(--tc-font-size-xs-plus); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__row-meta { display: flex; align-items: center; gap: 5px; min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
.ui-rvc__tag { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-rvc [data-risk="high"] { --tc-review-center-tone-bg: var(--tc-status-danger-bg); --tc-review-center-tone-edge: var(--tc-review-center-high-edge); --tc-review-center-tone-fg: var(--tc-status-danger-fg); }
.ui-rvc [data-risk="medium"] { --tc-review-center-tone-bg: var(--tc-status-warning-bg); --tc-review-center-tone-edge: var(--tc-review-center-mid-edge); --tc-review-center-tone-fg: var(--tc-status-warning-fg); }
.ui-rvc [data-risk="low"] { --tc-review-center-tone-bg: var(--tc-status-success-bg); --tc-review-center-tone-edge: var(--tc-review-center-low-edge); --tc-review-center-tone-fg: var(--tc-status-success-fg); }
.ui-rvc__skipped { flex: none; color: var(--tc-text-muted); }
/* A decided row: a small check or cross where the time was, then it fades and closes up */
.ui-rvc__item[data-decision] .ui-rvc__row-main { opacity: 0.5; transition-delay: var(--d); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__row-done { display: grid; flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-full); background: var(--tc-review-center-tone-bg); color: var(--tc-review-center-tone-fg); animation: ui-rvc-fade var(--tc-duration-fast) var(--tc-ease-standard) var(--d) backwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__row-done { display: grid; flex: none; place-items: center; width: 16px; height: 16px; border-radius: var(--tc-radius-xs); background: var(--tc-review-center-tone-bg); color: var(--tc-review-center-tone-fg); animation: ui-rvc-fade var(--tc-duration-fast) var(--tc-ease-standard) var(--d) backwards; }
.ui-rvc__row-done > svg { width: 12px; height: 12px; }
:is(.ui-rvc__row-done, .ui-rvc__undo, .ui-rvc__btn)[data-decision="approved"], .ui-rvc__btn[data-tone="approved"] { --tc-review-center-tone-bg: var(--tc-status-success-bg); --tc-review-center-tone-edge: var(--tc-review-center-low-edge); --tc-review-center-tone-fg: var(--tc-status-success-fg); }
:is(.ui-rvc__row-done, .ui-rvc__undo, .ui-rvc__btn)[data-decision="rejected"], .ui-rvc__btn[data-tone="rejected"] { --tc-review-center-tone-bg: var(--tc-status-danger-bg); --tc-review-center-tone-edge: var(--tc-review-center-high-edge); --tc-review-center-tone-fg: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__none { display: grid; place-items: center; height: 120px; font-size: var(--tc-font-size-sm-plus); color: var(--tc-text-muted); list-style: none; animation: ui-rvc-fade var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-slow) backwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__none { display: grid; place-items: center; height: 120px; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); list-style: none; animation: ui-rvc-fade var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-slow) backwards; }
/* ----- The item ----- */
.ui-rvc__main { position: relative; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.ui-rvc__stage { position: relative; flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; scrollbar-width: thin; transition: height var(--tc-duration-slower) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__detail { position: relative; display: grid; gap: 16px; padding: 22px 26px 24px; background: var(--tc-surface-raised); }
.ui-rvc__detail[data-enter="first"] > * { animation: ui-rvc-in var(--tc-duration-slower) var(--tc-ease-move) calc(var(--tc-duration-quick) + var(--i, 0) * var(--tc-duration-instant)) backwards; }
/* After a decision: the old item fades up and away, the next one follows a beat later from just below */
.ui-rvc__detail[data-enter="decide"] { animation: ui-rvc-in var(--tc-duration-slow) var(--tc-ease-move) calc(var(--d) + var(--tc-duration-instant)) backwards; }
.ui-rvc__detail[data-enter="down"] { animation: ui-rvc-in var(--tc-duration-moderate) var(--tc-ease-move) backwards; }
.ui-rvc__detail[data-enter="up"] { animation: ui-rvc-in-up var(--tc-duration-moderate) var(--tc-ease-move) backwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__detail { position: relative; display: grid; gap: 16px; padding: 22px 24px 24px; background: var(--tc-surface-raised); }
/* After a decision: the old item fades up and away, the next one follows a beat later from just below */
.ui-rvc__detail[data-enter="fade"] { animation: ui-rvc-fade var(--tc-duration-moderate) var(--tc-ease-standard) backwards; }
.ui-rvc__detail[data-ghost] { position: absolute; inset: 0 0 auto; z-index: 2; min-height: 100%; pointer-events: none; animation: ui-rvc-away var(--tc-duration-moderate) var(--tc-ease-move) var(--d) forwards; }
.ui-rvc__who { display: flex; align-items: center; gap: 10px; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__who .ui-rvc__avatar { width: 34px; height: 34px; border-radius: var(--tc-radius-md); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__who .ui-rvc__avatar > svg { width: 17px; height: 17px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__meta { display: grid; flex: 1; gap: 1px; min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__who .ui-rvc__avatar { width: 32px; height: 32px; border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__who .ui-rvc__avatar > svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__meta { display: grid; flex: 1; gap: 0; min-width: 0; }
.ui-rvc__name { display: flex; align-items: center; gap: 8px; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__agent { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md-plus); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__model { overflow: hidden; font-size: var(--tc-font-size-sm-plus); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* The risk tag: a tint with its color, like the Live tag in Trace Waterfall – low risk needs none */
.ui-rvc__risk { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-review-center-tone-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-review-center-tone-fg); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__agent { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__model { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* The risk tag: a tint with its color, like the Live tag in Trace Waterfall – low risk needs none */
.ui-rvc__ask { display: grid; gap: 4px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__title { font-size: 18px; font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-loose); letter-spacing: -0.012em; color: var(--tc-text-strong); text-wrap: balance; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__title { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); color: var(--tc-text-strong); text-wrap: balance; }
.ui-rvc__why { margin-top: -6px; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); text-wrap: pretty; }
.ui-rvc__why b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
/* The proposal: no box around it – the content is the focus */
.ui-rvc__proposal { display: grid; gap: 16px; min-width: 0; padding-top: 2px; }
/* Facts in a light row: a small label over each value, no lines between them */
.ui-rvc__fields { display: flex; flex-wrap: wrap; gap: 12px 36px; }
.ui-rvc__fields > div { display: grid; gap: 1px; min-width: 0; max-width: 100%; }
.ui-rvc__fields dt { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__fields dd { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__fields dd { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-rvc__body { display: grid; gap: 6px; min-width: 0; }
.ui-rvc__body-label { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* Prose sits on a thin line at its left, like a quote of what goes out */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__text { padding-left: 14px; box-shadow: inset 1px 0 0 var(--tc-border-strong); font-size: var(--tc-font-size-md-plus); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; text-wrap: pretty; }
/* Code: a white block on the card's shadow – a row per file, the diff under a hairline. Numbers soft, no gutter, few colors */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__code { overflow: hidden; border-radius: var(--tc-radius-xl); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__file + .ui-rvc__file { border-top: 1px solid var(--tc-border-default); }
/* Prose sits on a thin line at its left, like a quote of what goes out */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__text { padding-left: 14px; box-shadow: inset 0.5px 0 0 var(--tc-border-strong); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; text-wrap: pretty; }
/* Code: a white block on the card's shadow – a row per file, the diff under a hairline. Numbers soft, no gutter, few colors */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__code { overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__file + .ui-rvc__file { border-top: 0.5px solid var(--tc-border-default); }
.ui-rvc__file-head { display: flex; align-items: center; gap: 8px; min-width: 0; height: 36px; padding: 0 12px 0 16px; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); }
.ui-rvc__path { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-rvc__dir { color: var(--tc-text-muted); }
:is(.ui-rvc__count-add, .ui-rvc__count-del) { flex: none; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-rvc__count-add { color: var(--tc-status-success-fg); }
.ui-rvc__count-del { color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__diff { padding: 8px 0 2px; overflow-x: auto; border-top: 1px solid var(--tc-border-default); font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-normal); letter-spacing: normal; white-space: pre; scrollbar-width: thin; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__diff { padding: 8px 0 2px; overflow-x: auto; border-top: 0.5px solid var(--tc-border-default); font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-normal); letter-spacing: normal; white-space: pre; scrollbar-width: thin; }
.ui-rvc__line { display: flex; min-width: max-content; color: var(--tc-text-primary); }
.ui-rvc__line[data-diff="add"] { background: var(--tc-review-center-diff-add-bg); }
.ui-rvc__line[data-diff="del"] { background: var(--tc-review-center-diff-del-bg); }
.ui-rvc__ln { position: relative; flex: none; min-width: 5ch; padding: 0 1ch 0 2ch; color: var(--tc-review-center-code-dim); text-align: right; font-variant-numeric: tabular-nums; user-select: none; }
.ui-rvc__sign { position: absolute; left: 4px; font-size: var(--tc-font-size-xs); }
.ui-rvc__line[data-diff="add"] .ui-rvc__sign { color: var(--tc-status-success-fg); }
.ui-rvc__line[data-diff="del"] .ui-rvc__sign { color: var(--tc-status-danger-fg); }
.ui-rvc__src { padding: 0 1ch; }
.ui-rvc__hunk { display: block; padding: 0 1ch 0 6ch; color: var(--tc-review-center-code-dim); }
.ui-rvc [data-tok="kw"] { color: var(--tc-review-center-tok-kw); }
.ui-rvc [data-tok="str"] { color: var(--tc-review-center-tok-str); }
.ui-rvc [data-tok="fn"] { color: var(--tc-review-center-tok-fn); }
.ui-rvc [data-tok="type"] { color: var(--tc-review-center-tok-type); }
.ui-rvc [data-tok="com"] { color: var(--tc-review-center-code-dim); }
.ui-rvc__line .ui-rvc__flag { padding: 1px 1px; margin: 0; }
.ui-rvc__line .ui-rvc__flag [data-tok] { color: inherit; }
/* A plan: numbered steps with the tool each one calls; a flagged step's number turns amber */
.ui-rvc__steps { display: grid; gap: 12px; list-style: none; }
.ui-rvc__step { display: grid; grid-template-columns: 22px minmax(0, 1fr); column-gap: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__step-n { display: grid; place-items: center; width: 22px; height: 22px; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1px var(--tc-border-strong); font-size: var(--tc-font-size-xs-plus); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__step[data-flagged] .ui-rvc__step-n { background: var(--tc-review-center-flag-bg); box-shadow: inset 0 0 0 1px var(--tc-review-center-flag-edge); color: var(--tc-review-center-flag-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__step-n { display: grid; place-items: center; width: 22px; height: 22px; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 0.5px var(--tc-border-strong); font-size: var(--tc-font-size-xs-plus); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__step[data-flagged] .ui-rvc__step-n { background: var(--tc-review-center-flag-bg); box-shadow: inset 0 0 0 0.5px var(--tc-review-center-flag-edge); color: var(--tc-review-center-flag-ink); }
.ui-rvc__step-main { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; min-width: 0; padding-top: 1px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__step-title { font-size: var(--tc-font-size-md-plus); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__step-title { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
.ui-rvc__step-tool { display: inline-flex; align-items: center; gap: 5px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); white-space: nowrap; }
.ui-rvc__step-detail { width: 100%; font-size: var(--tc-font-size-sm-plus); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); }
/* A span the agent isn't sure about: a warm tint with a hairline underline – brighter while its note shows */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__flag { padding: 1px 2px; margin: 0 -1px; border-radius: var(--tc-radius-xs); background: var(--tc-review-center-flag-bg); box-shadow: inset 0 -1.5px 0 var(--tc-review-center-flag-edge); color: var(--tc-review-center-flag-ink); cursor: help; -webkit-box-decoration-break: clone; box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__flag:is(:hover, [data-on]) { background: var(--tc-review-center-flag-hot); box-shadow: inset 0 0 0 1px var(--tc-review-center-flag-edge); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__ins { padding: 1px 2px; margin: 0 -1px; border-radius: var(--tc-radius-xs); background: var(--tc-review-center-ins-bg); color: var(--tc-status-success-fg); text-decoration: none; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
/* Editing: the text field sits on a mirror that marks what changed; the ring is the only frame */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__editor { display: grid; margin: -6px -8px; border-radius: var(--tc-radius-lg); box-shadow: var(--tc-field-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__editor > * { grid-area: 1 / 1; padding: 6px 8px; font-size: var(--tc-font-size-md-plus); line-height: var(--tc-line-height-relaxed); white-space: pre-wrap; overflow-wrap: anywhere; }
/* A span the agent isn't sure about: a warm tint with a hairline underline – brighter while its note shows */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__flag { padding: 1px 2px; margin: 0 -1px; border-radius: var(--tc-radius-2xs); background: var(--tc-review-center-flag-bg); box-shadow: inset 0 -1px 0 var(--tc-review-center-flag-edge); color: var(--tc-review-center-flag-ink); cursor: help; -webkit-box-decoration-break: clone; box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__flag:is(:hover, [data-on]) { background: var(--tc-review-center-flag-hot); box-shadow: inset 0 0 0 0.5px var(--tc-review-center-flag-edge); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__ins { padding: 1px 2px; margin: 0 -1px; border-radius: var(--tc-radius-2xs); background: var(--tc-review-center-ins-bg); color: var(--tc-status-success-fg); text-decoration: none; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
/* Editing: the text field sits on a mirror that marks what changed; the ring is the only frame */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__editor { display: grid; margin: -6px -8px; border-radius: var(--tc-radius-md); box-shadow: var(--tc-field-shadow); }
/* The editor's focus is on its frame (the textarea itself draws none) */
.ui-rvc__editor:focus-within { box-shadow: var(--tc-field-shadow-focus); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__editor > * { grid-area: 1 / 1; padding: 6px 8px; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-rvc__body[data-format="code"] .ui-rvc__editor > * { font-family: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); letter-spacing: 0; }
.ui-rvc__mirror { color: transparent; }
/* No padding here – the mirror has to wrap exactly like the field; the tint reaches out with a shadow */
.ui-rvc__mirror .ui-rvc__ins { padding: 0; margin: 0; color: transparent; box-shadow: 0 0 0 2px var(--tc-review-center-ins-bg); }
.ui-rvc__editor textarea { width: 100%; height: 100%; overflow: hidden; resize: none; color: var(--tc-text-primary); caret-color: var(--tc-accent-text); outline: none; }
.ui-rvc__editor textarea:focus-visible { outline: none; }
.ui-rvc__input { width: 100%; min-width: 120px; height: 24px; margin: 0 -6px; padding: 0 6px; border-radius: var(--tc-radius-sm); background: var(--tc-field-bg-sunken); box-shadow: var(--tc-field-shadow); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rvc__input:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-rvc__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px; }
/* Sources: plain words with their marks – no chips */
.ui-rvc__sources { display: flex; flex-wrap: wrap; gap: 4px 14px; min-width: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__source { display: inline-flex; align-items: center; gap: 6px; font-size: var(--tc-font-size-sm-plus); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); white-space: nowrap; text-decoration: none; transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__source { display: inline-flex; align-items: center; gap: 6px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); white-space: nowrap; text-decoration: none; transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
a.ui-rvc__source:hover { color: var(--tc-text-primary); }
.ui-rvc__source-icon { display: grid; place-items: center; width: 14px; height: 14px; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__source-icon > svg { width: 13px; height: 13px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__empty { display: grid; place-content: center; justify-items: center; gap: 4px; min-height: 100%; padding: 48px 24px; text-align: center; animation: ui-rvc-in var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-quick) backwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__source-icon > svg { width: 12px; height: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__empty { display: grid; place-content: center; justify-items: center; gap: 2px; min-height: 100%; padding: 48px 24px; text-align: center; animation: ui-rvc-in var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-quick) backwards; }
.ui-rvc__empty[data-after] { animation-delay: calc(var(--d) + var(--tc-duration-quick)); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__empty-mark { display: grid; place-items: center; width: 44px; height: 44px; margin-bottom: 8px; border-radius: var(--tc-radius-xl); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); box-shadow: inset 0 0 0 1px var(--tc-review-center-low-edge); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__empty b { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-strong); }
.ui-rvc__empty > span:last-child { max-width: 280px; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); text-wrap: balance; }
/* The agent's note on a flagged span */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__tip { position: absolute; top: 0; left: 0; z-index: 6; display: grid; gap: 4px; width: min(300px, calc(100% - 20px)); padding: 10px 12px 11px; border-radius: var(--tc-menu-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); transform-origin: var(--x, 50%) bottom; animation: ui-rvc-tip var(--tc-duration-base) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__empty-mark { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 10px; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); color: var(--tc-status-success-fg); box-shadow: var(--tc-shadow-raised), 0 0 0 4px var(--tc-status-success-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__empty b { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); color: var(--tc-text-strong); }
/* The agent's note on a flagged span */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__tip { position: absolute; top: 0; left: 0; z-index: 6; display: grid; gap: 2px; width: min(300px, calc(100% - 20px)); padding: 10px 12px; border-radius: var(--tc-menu-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); transform-origin: var(--x, 50%) bottom; animation: ui-rvc-tip var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-rvc__tip[data-side="below"] { transform-origin: var(--x, 50%) top; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__tip-head { display: inline-flex; align-items: center; gap: 6px; font-size: var(--tc-font-size-xs-plus); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-status-warning-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__tip p { font-size: var(--tc-font-size-sm-plus); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-wrap: pretty; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__tip-source { justify-self: start; margin-top: 2px; padding: 1px 7px; border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs-plus); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
/* ----- The actions ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__actions { position: relative; display: flex; flex: none; align-items: center; gap: 12px; min-height: 60px; padding: 12px 16px; border-top: 1px solid var(--tc-border-default); background: var(--tc-surface-raised); }
.ui-rvc__btns { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; animation: ui-rvc-swap var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-rvc__btn { display: inline-flex; align-items: center; height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: transform var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn { gap: 7px; padding: 0 7px 0 var(--tc-control-px-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn > svg { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__tip-head { display: inline-flex; align-items: center; gap: 6px; font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-status-warning-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__tip-head > svg { width: 12px; height: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__tip p { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-wrap: pretty; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__tip-source { justify-self: start; margin-top: 4px; padding: 0 6px; border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
/* ----- The actions ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__actions { position: relative; display: flex; flex: none; align-items: center; gap: 12px; min-height: 52px; padding: 12px 16px; border-top: 0.5px solid var(--tc-border-default); background: var(--tc-surface-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn { gap: 6px; padding: 0 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn > svg { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn > span { margin-right: 2px; }
.ui-rvc__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn[data-primary] { padding-left: 11px; }
/* Primary: Button's flat ink */
.ui-rvc__btn[data-primary] { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-rvc__btn[data-primary]:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-rvc__btn[data-primary]:active:not(:disabled) { background: var(--tc-action-primary-bg-active); }
.ui-rvc__btn[data-primary] .ui-rvc__kbd { background: var(--tc-kbd-on-inverse-bg); box-shadow: none; color: inherit; }
.ui-rvc__btn[data-primary] > svg { color: inherit; }
.ui-rvc__btn:disabled { opacity: 0.45; }
:is(.ui-rvc__btn, .ui-rvc__reason, .ui-rvc__undo-btn)[data-pressed] { transform: scale(0.97); }
/* The pressed button flashes its decision's tint for a moment – the only color a decision adds */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn[data-pressed] { background: var(--tc-review-center-tone-bg, var(--tc-fill-subtle)); box-shadow: inset 0 0 0 1px var(--tc-review-center-tone-edge, var(--tc-border-default)); color: var(--tc-review-center-tone-fg, var(--tc-text-primary)); }
/* The pressed button flashes its decision's tint for a moment – the only color a decision adds */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn[data-pressed] { background: var(--tc-review-center-tone-bg, var(--tc-fill-subtle)); box-shadow: inset 0 0 0 0.5px var(--tc-review-center-tone-edge, var(--tc-border-default)); color: var(--tc-review-center-tone-fg, var(--tc-text-strong)); }
.ui-rvc__btn[data-pressed] > svg { color: inherit; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__why-label { margin-right: 2px; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rvc__reason { display: inline-flex; align-items: center; height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: transform var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__reason { gap: 7px; padding: 0 11px 0 7px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__reason:hover { box-shadow: inset 0 0 0 1px var(--tc-review-center-high-edge); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__reason[data-pressed] { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 1px var(--tc-review-center-high-edge); color: var(--tc-status-danger-fg); }
.ui-rvc__cancel { display: inline-flex; align-items: center; gap: 6px; height: var(--tc-control-h-md); padding: 0 8px; border-radius: var(--tc-control-radius-md); font-size: var(--tc-font-size-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__why-label { margin-right: 2px; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__reason { gap: 6px; padding: 0 10px 0 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__reason:hover { box-shadow: inset 0 0 0 0.5px var(--tc-review-center-high-edge), var(--tc-action-secondary-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__reason[data-pressed] { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 0.5px var(--tc-review-center-high-edge); color: var(--tc-status-danger-fg); }
.ui-rvc__cancel:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* Undo: a small chip on the tray for a few seconds, right of how far you are */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__undo { display: flex; flex: 0 1 auto; align-items: center; gap: 2px; min-width: 0; height: 30px; margin-left: auto; padding: 0 2px 0 4px; border-radius: var(--tc-radius-full); background: var(--tc-surface-sunken); animation: ui-rvc-chip-in var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__undo-text { display: inline-flex; align-items: center; gap: 5px; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm-plus); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* Undo: a small chip in the bar for a few seconds, right of how far you are */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__undo { display: flex; flex: 0 1 auto; align-items: center; gap: 2px; min-width: 0; height: 28px; margin-left: auto; padding: 0 0 0 4px; border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); animation: ui-rvc-chip-in var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__undo-text { display: inline-flex; align-items: center; gap: 5px; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-rvc__undo[data-leaving] { animation: ui-rvc-chip-out ${EXIT}ms var(--tc-ease-standard) forwards; }
.ui-rvc__undo-text > svg { width: 14px; height: 14px; color: var(--tc-review-center-tone-fg); }
.ui-rvc__undo[data-pending] .ui-rvc__undo-text > svg { opacity: 0.5; }
.ui-rvc__undo[data-error] .ui-rvc__undo-text { color: var(--tc-status-danger-fg); }
.ui-rvc__undo[data-error] .ui-rvc__undo-text > svg { color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__undo-btn { display: inline-flex; flex: none; align-items: center; gap: 5px; height: 26px; margin-left: 6px; padding: 0 4px 0 8px; border-radius: var(--tc-radius-full); font-size: var(--tc-font-size-sm-plus); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__undo-btn { display: inline-flex; flex: none; align-items: center; gap: 5px; height: 24px; margin-left: 4px; padding: 0 4px 0 6px; border-radius: var(--tc-radius-badge); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rvc__undo-btn:hover { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__undo-btn > svg { color: var(--tc-text-muted); }
/* ----- Medium: a slimmer queue ----- */
@container ui-rvc (max-width: 820px) {
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__card { --tc-review-center-queue: 272px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__detail { padding: 18px 20px 20px; }
}
@container ui-rvc (max-width: 740px) {
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn .ui-rvc__kbd { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn { padding-right: 11px; }
}
/* ----- Narrow: the queue on top, three rows high, the item under it ----- */
@container ui-rvc (max-width: 639px) {
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__head { padding: 4px 4px 8px 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__oldest { margin-left: auto; padding-right: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__oldest::before { content: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__progress { order: 5; width: 100%; padding-right: 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__progress .ui-rvc__track { flex: 1; }
  /* Undo sits over the right end of the bar, in front of "Oldest" */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__undo { position: absolute; top: auto; right: 4px; bottom: 6px; z-index: 2; max-width: calc(100% - 8px); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__card { display: flex; flex-direction: column; height: auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__queue { border-right: 0; border-bottom: 1px solid var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__list { flex: none; height: calc(3 * (var(--tc-review-center-row) + 4px) + 16px); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__stage { flex: none; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__detail { gap: 14px; padding: 16px 16px 18px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__title { font-size: var(--tc-font-size-xl); line-height: var(--tc-line-height-relaxed); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__actions { flex-wrap: wrap; padding: 10px 12px 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btns { flex: 1; flex-wrap: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btns > .ui-rvc__btn { flex: 1; justify-content: center; padding: 0 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btns[role="group"] { flex-wrap: wrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__reason { flex: 1 1 40%; justify-content: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__why-label { width: 100%; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__empty { min-height: 220px; padding: 36px 20px; }
}
/* Phones: the type tag steps aside in the item, the button labels get the room */
@container ui-rvc (max-width: 420px) {
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn > svg { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__filter { gap: 4px; font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__undo-btn .ui-rvc__kbd { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__sources { width: 100%; }
}
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__undo-btn > svg { color: var(--tc-icon-muted); }
/* ----- Medium: a slimmer queue ----- */
@container ui-rvc (max-width: 820px) {
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__card { --tc-review-center-queue: 268px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__detail { padding: 18px 20px 20px; }
}
@container ui-rvc (max-width: 740px) {
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn .ui-rvc__kbd { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn { padding-right: 10px; }
}
/* ----- Narrow: the queue on top, three rows high, the item under it ----- */
@container ui-rvc (max-width: 639px) {
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__head { padding: 10px 10px 10px 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__oldest { margin-left: auto; padding-right: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__oldest::before { content: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__progress { order: 5; width: 100%; padding-right: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__progress .ui-rvc__track { flex: 1; }
  /* Undo sits over the right end of the bar, in front of "Oldest" */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__undo { position: absolute; top: auto; right: 10px; bottom: 8px; z-index: 2; max-width: calc(100% - 20px); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__card { display: flex; flex-direction: column; height: auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__queue { border-right: 0; border-bottom: 0.5px solid var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__list { flex: none; height: calc(3 * (var(--tc-review-center-row) + 2px) + 16px); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__stage { flex: none; overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__detail { gap: 14px; padding: 16px 14px 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__actions { flex-wrap: wrap; padding: 10px 12px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btns { flex: 1; flex-wrap: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btns > .ui-rvc__btn { flex: 1; justify-content: center; padding: 0 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btns[role="group"] { flex-wrap: wrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__reason { flex: 1 1 40%; justify-content: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__why-label { width: 100%; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__empty { min-height: 220px; padding: 36px 20px; }
}
/* Phones: the type tag steps aside in the item, the button labels get the room */
@container ui-rvc (max-width: 420px) {
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn > svg { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__filter { gap: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__undo-btn .ui-rvc__kbd { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__sources { width: 100%; }
}
@keyframes ui-rvc-row-in { from { opacity: 0; transform: translateY(6px); } }
@keyframes ui-rvc-open { from { height: 0; padding: 0; opacity: 0; } }
@keyframes ui-rvc-close { from { height: calc(var(--tc-review-center-row) + 4px); } to { height: 0; padding: 0; opacity: 0; } }
@keyframes ui-rvc-close-clean { from { height: calc(var(--tc-review-center-row) + 2px); } to { height: 0; padding: 0; opacity: 0; } }
@keyframes ui-rvc-arrive { 0%, 40% { background: var(--tc-accent-subtle); } }
@keyframes ui-rvc-fade { from { opacity: 0; } }
@keyframes ui-rvc-in { from { opacity: 0; transform: translateY(8px); } }
@keyframes ui-rvc-in-up { from { opacity: 0; transform: translateY(-8px); } }
@keyframes ui-rvc-away { to { opacity: 0; transform: translateY(-6px); } }
@keyframes ui-rvc-tip { from { opacity: 0; transform: translateY(4px) scale(0.96); } }
@keyframes ui-rvc-swap { from { opacity: 0; transform: translateY(6px); } }
@keyframes ui-rvc-chip-in { from { opacity: 0; transform: translateX(8px); } }
@keyframes ui-rvc-chip-out { to { opacity: 0; transform: translateX(6px); } }
@keyframes ui-rvc-tick { from { opacity: 0; transform: translateY(-6px); } }
@keyframes ui-rvc-sweep { to { transform: translateX(100%); } }
@keyframes ui-rvc-glow { from { opacity: 0.25; } to { opacity: 0.7; } }
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-rvc .ui-rvc__kbd { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn { padding-right: 11px; }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-rvc .ui-rvc__kbd { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn { padding-right: 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-rvc *, .ui-rvc *::before, .ui-rvc *::after { animation: none !important; transition: none !important; }
}
`;

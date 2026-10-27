import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OnScreenController } from "./internal/controllers";

/*
 * <tc-review-center> – the Lit port of src/components/review-center.tsx: a focused workspace for what your agents
 * want to do. Human in the loop, one item at a time and fast: the queue sorted by risk, and the item you're on – who
 * proposes it, why, the proposal itself (fields, text, a code diff or a plan) and the spots the agent isn't sure about.
 *   · low-confidence spans are marked – point at one (or press F) for the agent's note and its source
 *   · Approve (A), Edit (E) in place, Reject (R) with a quick reason (1–4), Skip (S) – shortcuts on every button
 *   · a decision is calm: its row closes up with a small check or cross, and the next item rises in
 *   · new items slide into the queue at their sorted spot; the last decision can be undone (Z)
 * `onDecide` may return a promise: the chip shows the decision as saving, and if it rejects the item comes back into
 * the queue with the error. Decided and skipped marks are kept per id while the id stays in `items`.
 * The element is its own handle: approve(), reject(reason?), edit(), setDraft(), save(), cancel(), skip(), next(),
 * previous(), undo(), peek(), select().
 *
 *   <tc-review-center .items=${items} .onDecide=${(item, result) => save(item, result)}></tc-review-center>
 *
 * Standard is a white card on a soft gray tray; Clean one quiet white card with hairlines.
 */

export type ReviewRisk = "high" | "medium" | "low";
/** A span the agent isn't sure about – marked in the proposal, its note shows on hover */
export type ReviewFlag = { text: string; note: string; source?: string };
/** Plain text, or text with flagged spans in it */
export type ReviewText = string | (string | ReviewFlag)[];
export type ReviewField = { label: string; value: ReviewText };
/** One file of a code change – its diff in unified form */
export type ReviewFile = { path: string; added?: number; removed?: number; diff?: ReviewText; /** First line number of the diff (default 1) */ start?: number };
/** One step of a plan (icon cloned) */
export type ReviewStep = { title: ReviewText; tool?: string; icon?: Element; detail?: ReviewText };
export type ReviewSource = { label: string; icon?: Element; href?: string };

export type ReviewItem = {
  id: string;
  /** What it is, e.g. "Refund order #4821 for Maya Chen" */
  title: string;
  /** Who proposes it, e.g. "Support agent" */
  agent: string;
  /** The model behind the agent – shown after its name */
  model?: string;
  /** A small mark, e.g. the model maker's logo (cloned) – defaults to the agent's initial */
  icon?: Element;
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
  /** "code" sets the body as a diff */
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

/** What the element offers to drive it from outside */
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

/** Decides an item; may return a promise – while it runs the decision shows as saving, a rejection puts it back */
export type ReviewDecide = (item: ReviewItem, result: ReviewResult) => void | Promise<unknown>;

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

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
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
const textsOf = (it: ReviewItem): (ReviewText | undefined)[] => [...(it.fields ?? []).map((f) => f.value), it.body, ...(it.files ?? []).map((f) => f.diff), ...(it.steps ?? []).flatMap((st) => [st.title, st.detail])];
/** A light syntax tint: keywords, strings, function names and types – the rest stays ink */
const TOKENS =
  /(\/\/.*|--\s.*|"[^"]*"|'[^']*'|`[^`]*`|\b(?:const|let|var|return|if|else|await|async|function|export|import|from|new|throw|for|of|in|try|catch|null|undefined|true|false|SELECT|FROM|WHERE|UPDATE|SET|ALTER|TABLE|ADD|DROP|COLUMN|CREATE|INDEX|ON|NOT|NULL|DEFAULT|BEGIN|COMMIT|AND|IS)\b|\b[a-z_]\w*(?=\()|\b[A-Z][A-Za-z]+\b)/;
const KEYWORD = /^(?:const|let|var|return|if|else|await|async|function|export|import|from|new|throw|for|of|in|try|catch|null|undefined|true|false|[A-Z]{2,})$/;
const tint = (src: string) =>
  src.split(TOKENS).map((t, i) => {
    if (i % 2 === 0 || !t) return t;
    const kind = /^(\/\/|--)/.test(t) ? "com" : /^["'`]/.test(t) ? "str" : KEYWORD.test(t) ? "kw" : /^[A-Z]/.test(t) ? "type" : "fn";
    return html`<span data-tok=${kind}>${t}</span>`;
  });

type Mode = "view" | "reject" | "edit";
type Enter = "first" | "decide" | "down" | "up" | "fade";
type Done = { item: ReviewItem; result: ReviewResult; delay: number; key: number };
type Ghost = { item: ReviewItem; index: number; result?: ReviewResult; delay: number; key: number };
type Out = { item: ReviewItem; result: ReviewResult; draft: Record<string, string>; delay: number; key: number; dir: "approved" | "rejected" };
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
type EnterOf = Map<string, { kind: "first" | "new" | "in"; delay: number }>;

/* ---------- Icons: check, x, pencil-line, chevron-right, triangle-alert, rotate-ccw, link and badge-check: Lucide (ISC, lucide.dev) ---------- */

const tick = html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M20 6 9 17l-5-5"></path>`}</svg>`;
const cross = html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`}</svg>`;
const pencil = html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M13 21h8"></path><path d="m15 5 4 4"></path><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>`}</svg>`;
const nextGlyph = html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="m9 18 6-6-6-6"></path>`}</svg>`;
const alert = html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4" stroke-width="2"></path><path d="M12 17h.01" stroke-width="2.4"></path>`}</svg>`;
const undoGlyph = html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`}</svg>`;
const linkGlyph = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>`}</svg>`;
/* A badge with a tick: the header's icon, and the empty state's mark */
const badgePaths = svg`<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path><path d="m16 9-5.5 5.5L8 12"></path>`;
const badge = (size = 16) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${badgePaths}</svg>`;

/* ---------- Pure pieces ---------- */

const slaOf = (it: ReviewItem, now: number, sla: number) => {
  const w = now - toMs(it.createdAt);
  return w >= sla ? "over" : w >= sla * 0.75 ? "near" : undefined;
};
/** A waiting time: near or past the SLA it says so in words, not only in colour; past it, a warning mark too */
const SLA_WORDS = { near: "close to the limit", over: "past the limit" } as const;
const wait = (text: string, sla: "near" | "over" | undefined, className: string, bold = false) => {
  const inner = html`<span class="ui-rvc__sr">waiting </span>${sla === "over" ? alert : nothing}${text}${sla ? html`<span class="ui-rvc__sr">${`, ${SLA_WORDS[sla]}`}</span>` : nothing}`;
  return bold ? html`<b class=${className} data-sla=${ifDefined(sla)}>${inner}</b>` : html`<span class=${className} data-sla=${ifDefined(sla)}>${inner}</span>`;
};
const matches = (i: ReviewItem, f: ReviewFilter, lowConfidence: number) => f === "all" || (f === "high" ? i.risk === "high" : i.confidence < lowConfidence);
/** The editable texts of an item, as the editor starts them */
const draftOf = (it: ReviewItem) => {
  const d: Record<string, string> = {};
  for (const f of it.fields ?? []) d[`field:${f.label}`] = plain(f.value);
  if (it.body !== undefined) d.body = plain(it.body);
  return d;
};
const avatar = (it: ReviewItem) => html`<span class="ui-rvc__avatar" ?data-logo=${!!it.icon} aria-hidden="true">${it.icon ? it.icon.cloneNode(true) : it.agent.slice(0, 1)}</span>`;
const editedText = (before: string, after: string) => {
  const [a, b, c] = changed(before, after);
  return html`${a}${b ? html`<ins class="ui-rvc__ins">${b}</ins>` : nothing}${c}`;
};

/** aria-keyshortcuts for the keys shown on buttons that aren't a single letter */
const KEYS: Record<string, string> = { Esc: "Escape", "⌘↵": "Meta+Enter Control+Enter" };
const FILTERS: { id: ReviewFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "high", label: "High risk" },
  { id: "unsure", label: "Unsure" },
];

let uid = 0;

/**
 * Human in the loop: the queue of what your agents want to do, one item at a time.
 * @tag tc-review-center
 * @fires tc-filter-change - The filter changes; detail `{ filter }`. Cancelable: preventDefault() keeps the current one
 * @fires tc-undo - A decision was taken back; detail `{ item, result }` – put the item back if you dropped it
 * @fires tc-skip - An item was skipped; detail `{ item }`
 */
export class TcReviewCenter extends TcElement implements ReviewCenterHandle {
  static override ui = "rvc";

  /** Everything waiting for review – decided items hide themselves, new ids slide in */
  @property({ attribute: false }) accessor items: ReviewItem[] = [];
  /** Decides an item; may return a promise (see ReviewDecide) */
  @property({ attribute: false }) accessor onDecide: ReviewDecide | undefined = undefined;
  /** How many were reviewed before (e.g. today) – the header counts on from here */
  @property({ type: Number }) accessor reviewed = 0;
  /** The total for the header – defaults to reviewed + waiting */
  @property({ type: Number }) accessor total: number | undefined = undefined;
  /** How long an item may wait, in ms – the waiting time turns amber at 75% and red past it (default 30 min) */
  @property({ type: Number }) accessor sla = 30 * 60_000;
  /** The clock (epoch ms) – defaults to the real one, read after connecting */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Below this confidence an item counts as unsure (default 0.7) */
  @property({ type: Number, attribute: "low-confidence" }) accessor lowConfidence = 0.7;
  /** The quick reasons for a rejection, picked with 1–4 */
  @property({ attribute: false }) accessor reasons: string[] = REASONS;
  /** "risk" (default): high risk first, then oldest · "oldest" · "given": as passed */
  @property() accessor order: "risk" | "oldest" | "given" = "risk";
  /** Which items the queue shows: "all", "high" (high risk only) or "unsure" (below `lowConfidence`). Changed by the user unless a tc-filter-change listener calls preventDefault() */
  @property() accessor filter: ReviewFilter = "all";
  /** The heading */
  @property() accessor heading = "Review center";
  /** How long the Undo chip stays after a decision, in ms – false keeps it until the next decision */
  @property({ attribute: false }) accessor undoTimeout: number | false = UNDO_FOR;
  /** The single-key shortcuts while focus is inside – false turns them off; Esc and ⌘/Ctrl combinations keep working */
  @property({ type: Boolean }) accessor shortcuts = true;

  @state() private accessor decided: Record<string, Done> = {};
  @state() private accessor history: string[][] = [];
  @state() private accessor skipped: Record<string, true> = {};
  @state() private accessor currentId: string | null = null;
  @state() private accessor mode: Mode = "view";
  @state() private accessor draft: Record<string, string> = {};
  @state() private accessor peekAt: number | null = null;
  @state() private accessor hoverFlag: number | null = null;
  @state() private accessor out: Out | null = null;
  @state() private accessor pressed: string | null = null;
  @state() private accessor chip: Chip | null = null;
  @state() private accessor said = "";
  @state() private accessor ghosts: Ghost[] = [];
  @state() private accessor narrow = false;
  @state() private accessor tick = 0;
  /** @internal The Undo chip waits while hovered or focused, and fades before it goes */
  @state() private accessor chipHold = { hover: false, focus: false };
  @state() private accessor chipLeaving = false;

  /** @internal */
  private baseId = `tc-rvc-${++uid}`;
  private seq = 0;
  private timers: number[] = [];
  private alive = false;
  private onScreen = new OnScreenController(this);
  /** @internal The mode Cancel just left – where the focus rescue sends focus */
  private leftMode: Mode = "view";
  private lastIndex = 0;
  private prevList: ReviewItem[] = [];
  private prevCurrent: string | undefined | null = null;
  private seen = new Set<string>();
  private mounted = false;
  private enterKnown: EnterOf = new Map();
  private nextEnter: Enter | null = "first";
  private entered: { id?: string; mode: Enter } = { mode: "first" };
  private enteredFor: string | undefined | null = null;
  private keep: "row" | "root" | null = null;
  private left = new Set<string>();
  private leaveTimer = 0;
  private clockTimer = 0;
  private clockKey = "";
  private chipTimers: number[] = [];
  private chipKey = "";
  private holdFor: number | undefined = undefined;
  private tipRo?: ResizeObserver;
  private tipKey = "";
  private stageRo?: ResizeObserver;
  private stageTimer = 0;
  private stageKey = "";
  private rootRo?: ResizeObserver;
  private escListening = false;

  constructor() {
    super();
    // Focus never drops to <body>: a mode swap lands on its counterpart (same data-focus-key), else the button that
    // opened the mode Cancel just left, else the current row, else the host (which keeps the keys working)
    new FocusRescueController(this, () => {
      const m = this.leftMode;
      this.leftMode = "view";
      return (m !== "view" ? this.querySelector(`.ui-rvc__actions [data-focus-key="${m}"]`) : null) ?? this.querySelector(".ui-rvc__row[aria-current]");
    });
    this.addEventListener("keydown", this.onKey);
    this.addEventListener("mousedown", (e) => {
      // A click on plain content keeps the keys working
      if (!(e.target as HTMLElement).closest("button, a, input, textarea, mark")) requestAnimationFrame(() => this.focus({ preventScroll: true }));
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.alive = true;
    if (!this.hasAttribute("tabindex")) this.tabIndex = -1;
    if (typeof ResizeObserver === "function") {
      this.rootRo = new ResizeObserver(() => (this.narrow = this.clientWidth - 8 < 640));
      this.rootRo.observe(this);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.alive = false;
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    this.chipTimers.forEach((t) => window.clearTimeout(t));
    this.chipKey = "";
    window.clearTimeout(this.leaveTimer);
    window.clearInterval(this.clockTimer);
    this.clockKey = "";
    window.clearTimeout(this.stageTimer);
    this.stageKey = "";
    this.stageRo?.disconnect();
    this.tipRo?.disconnect();
    this.tipKey = "";
    this.rootRo?.disconnect();
    this.listenEsc(false);
  }

  /** @internal */
  private nextKey = () => ++this.seq;
  /** @internal */
  private later(fn: () => void, ms: number) {
    this.timers.push(window.setTimeout(fn, ms));
  }

  /* ---------- What is shown ---------- */

  /** @internal The queue: sorted, minus what's decided, through the filter */
  private queue() {
    const { items, order, decided, filter, lowConfidence } = this;
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
    const done = this.reviewed + Object.keys(decided).length;
    const total = Math.max(this.total ?? done + pending.length, done);
    // The current item: the one picked, or whatever now sits where it was
    const found = list.findIndex((i) => i.id === this.currentId);
    const index = found >= 0 ? found : Math.min(this.lastIndex, list.length - 1);
    const current = index >= 0 ? list[index] : undefined;
    const flagCount = current ? textsOf(current).reduce((n, t) => n + flagsIn(t), 0) : 0;
    return { pending, list, ids, counts, oldest, done, total, index, current, flagCount };
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>) {
    super.willUpdate(changed);
    // Decided and skipped marks belong to an id while it stays in `items`: one that left and came back is fresh again
    if (changed.has("items") || changed.has("decided") || changed.has("skipped")) {
      const present = new Set(this.items.map((i) => i.id));
      const back: string[] = [];
      for (const id of Object.keys(this.decided)) {
        if (!present.has(id)) this.left.add(id);
        else if (this.left.has(id)) back.push(id);
      }
      for (const id of [...this.left]) if (!this.decided[id] || back.includes(id)) this.left.delete(id);
      if (back.length) {
        const n = { ...this.decided };
        for (const id of back) delete n[id];
        this.decided = n;
        this.history = this.history.map((step) => step.filter((id) => !back.includes(id))).filter((step) => step.length);
      }
      if (Object.keys(this.skipped).some((id) => !present.has(id))) this.skipped = Object.fromEntries(Object.entries(this.skipped).filter(([id]) => present.has(id))) as Record<string, true>;
    }
    // A new chip starts with nothing holding it
    if (this.chip?.key !== this.holdFor) {
      this.holdFor = this.chip?.key;
      this.chipHold = { hover: false, focus: false };
    }
    const { list, current } = this.queue();
    // How the item comes in: a beat after a decision, or slid up or down when you move
    if (current?.id !== this.entered.id) this.entered = { id: current?.id, mode: this.nextEnter ?? "down" };
    // A fresh item starts clean: no picker, no draft, no note open
    if (this.prevCurrent !== null && current?.id !== this.prevCurrent) {
      this.mode = "view";
      this.peekAt = null;
      this.hoverFlag = null;
      this.draft = {};
    }
    // How each listed row came in – the first picture row by row, new items with a soft highlight, returning ones simply open
    let fresh = 0;
    let differs = this.enterKnown.size !== list.filter((it) => this.enterKnown.has(it.id)).length;
    const next: EnterOf = new Map();
    for (const it of list) {
      const known = this.enterKnown.get(it.id);
      if (known) {
        next.set(it.id, known);
        continue;
      }
      differs = true;
      const kind = !this.mounted ? "first" : this.seen.has(it.id) ? "in" : "new";
      next.set(it.id, { kind, delay: Math.min(420, kind === "first" ? 80 + fresh++ * 50 : fresh++ * 30) });
    }
    if (differs) this.enterKnown = next;
  }

  protected override updated(changed: Map<PropertyKey, unknown>) {
    const { list, ids, index, current } = this.queue();
    this.toggleAttribute("data-offscreen", !this.onScreen.onScreen);
    this.mounted = true;
    for (const it of this.items) this.seen.add(it.id);
    this.lastIndex = Math.max(0, index);
    if (current && current.id !== this.currentId) this.currentId = current.id;
    if (this.enteredFor !== this.entered.id) {
      this.enteredFor = this.entered.id;
      this.nextEnter = null;
    }
    const currentChanged = current?.id !== this.prevCurrent;
    this.prevCurrent = current?.id;
    const stage = this.querySelector<HTMLElement>(".ui-rvc__stage");
    if (currentChanged && stage) stage.scrollTop = 0;

    // Rows that leave – decided, filtered out, removed – stay a moment in place: marked, then they close up
    if (list !== this.prevList && (changed.has("items") || changed.has("decided") || changed.has("filter") || changed.has("order") || changed.has("lowConfidence"))) {
      const prev = this.prevList;
      this.prevList = list;
      const gone = prev.map((item, i) => ({ item, i })).filter((g) => !ids.has(g.item.id));
      if (gone.length && !reducedMotion()) {
        const key = this.nextKey();
        const add: Ghost[] = gone.map((g) => ({ item: g.item, index: g.i, result: this.decided[g.item.id]?.result, delay: this.decided[g.item.id]?.delay ?? 0, key }));
        this.ghosts = [...this.ghosts.filter((x) => !add.some((a) => a.item.id === x.item.id)), ...add];
        const longest = Math.max(...add.map((a) => a.delay + (a.result ? STAMP : 0) + EXIT));
        this.later(() => (this.ghosts = this.ghosts.filter((x) => x.key !== key)), longest + 80);
      }
    }

    // Focus: keys keep working when the thing you were on goes away
    const how = this.keep;
    if (how) {
      this.keep = null;
      const a = document.activeElement;
      if (how === "row" && current) this.rowEl(current.id)?.focus({ preventScroll: true });
      else if (!this.contains(a) || a === document.body) this.focus({ preventScroll: true });
    }

    // The current row stays in view in the queue
    if (currentChanged) {
      const l = this.querySelector<HTMLElement>(".ui-rvc__list");
      const li = current ? this.rowEl(current.id)?.parentElement : undefined;
      if (l && li && l.scrollHeight > l.clientHeight) {
        const top = li.offsetTop - 6;
        const bottom = li.offsetTop + li.offsetHeight + 6;
        if (top < l.scrollTop) l.scrollTo({ top, behavior: reducedMotion() ? "auto" : "smooth" });
        else if (bottom > l.scrollTop + l.clientHeight) l.scrollTo({ top: bottom - l.clientHeight, behavior: reducedMotion() ? "auto" : "smooth" });
      }
    }

    this.runClock();
    this.runChip();
    this.placeTip();
    this.fitStage();
    this.listenEsc(this.hoverFlag !== null);
  }

  /** @internal */
  private rowEl(id: string) {
    return [...this.querySelectorAll<HTMLButtonElement>(".ui-rvc__item:not([data-leaving]) .ui-rvc__row")].find((b) => b.dataset.id === id);
  }

  /** @internal The clock for waiting times: without `now`, read after connecting, then every 10s while on screen */
  private runClock() {
    const own = this.now === undefined;
    const on = this.onScreen.onScreen;
    const key = `${own}:${on}`;
    if (key === this.clockKey) return;
    this.clockKey = key;
    window.clearInterval(this.clockTimer);
    if (!own || !on) return;
    const read = () => (this.tick = Date.now());
    read();
    this.clockTimer = window.setInterval(read, 10_000);
  }

  /** @internal The chip goes after its time, but the clock stops while it is hovered or has focus (WCAG 2.2.1) */
  private runChip() {
    const chip = this.chip;
    const held = this.chipHold.hover || this.chipHold.focus;
    const key = chip ? `${chip.key}|${held}|${this.undoTimeout}` : "";
    if (key === this.chipKey) return;
    this.chipKey = key;
    this.chipTimers.forEach((t) => window.clearTimeout(t));
    this.chipTimers = [];
    if (this.chipLeaving) this.chipLeaving = false;
    const timeout = this.undoTimeout;
    if (!chip || held || timeout === false) return;
    const fade = Math.min(EXIT, timeout);
    this.chipTimers.push(
      window.setTimeout(() => (this.chipLeaving = true), timeout - fade),
      window.setTimeout(() => this.expireChip(chip.key), timeout),
    );
  }

  /** @internal The chip's time is up: it goes – unless onDecide is still saving, then it goes once that settles */
  private expireChip(key: number) {
    const c = this.chip;
    if (c?.key !== key) return;
    this.chip = c.pending ? { ...c, spent: true } : null;
  }

  /** @internal The agent's note sits under its flagged span (or over it): placed when it opens, and when it or the pane resizes */
  private placeTip() {
    const { current } = this.queue();
    const tipIndex = this.hoverFlag ?? this.peekAt;
    const tip = this.querySelector<HTMLElement>(".ui-rvc__tip");
    const key = `${tipIndex}|${!!tip}|${current?.id}`;
    if (key === this.tipKey) return;
    this.tipKey = key;
    this.tipRo?.disconnect();
    this.tipRo = undefined;
    const stage = this.querySelector<HTMLElement>(".ui-rvc__stage");
    const el = tipIndex !== null ? this.querySelectorAll<HTMLElement>(".ui-rvc__detail:not([data-ghost]) .ui-rvc__flag")[tipIndex] : undefined;
    if (!tip || !stage || !el) return;
    // All reads first, then the writes
    const place = () => {
      const s = stage.getBoundingClientRect();
      const scale = stage.offsetWidth ? s.width / stage.offsetWidth : 1;
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
    if (typeof ResizeObserver !== "function") return;
    this.tipRo = new ResizeObserver(place);
    this.tipRo.observe(tip);
    this.tipRo.observe(stage);
  }

  /** @internal Narrow containers stack the queue above the item; there the item's box glides to its new height */
  private fitStage() {
    const stage = this.querySelector<HTMLElement>(".ui-rvc__stage");
    const { current } = this.queue();
    const out = this.out;
    const key = `${this.narrow}|${out?.key}|${current?.id}`;
    if (!stage || key === this.stageKey) return;
    this.stageKey = key;
    this.stageRo?.disconnect();
    window.clearTimeout(this.stageTimer);
    if (!this.narrow) {
      stage.style.height = "";
      return;
    }
    const cur = () => stage.querySelector<HTMLElement>(":scope > .ui-rvc__detail:not([data-ghost]), :scope > .ui-rvc__empty");
    // For a moment the box keeps the old item's height; then it glides to the new one
    const fit = () => {
      const c = cur()?.offsetHeight ?? 0;
      const hold = out && performance.now() - out.key < out.delay + STAMP;
      const g = hold ? (stage.querySelector<HTMLElement>(":scope > .ui-rvc__detail[data-ghost]")?.offsetHeight ?? 0) : 0;
      stage.style.height = `${Math.max(c, g)}px`;
    };
    fit();
    if (typeof ResizeObserver === "function") {
      this.stageRo = new ResizeObserver(fit);
      const c = cur();
      if (c) this.stageRo.observe(c);
    }
    if (out) this.stageTimer = window.setTimeout(fit, Math.max(0, out.key + out.delay + STAMP - performance.now()) + 10);
  }

  /* ---------- The agent's note ---------- */

  /** @internal */
  private holdTip = () => window.clearTimeout(this.leaveTimer);
  /** @internal The note stays while the pointer moves from the span onto it (WCAG 1.4.13) */
  private dropTip = (i?: number) => {
    this.holdTip();
    this.leaveTimer = window.setTimeout(() => {
      if (i === undefined || this.hoverFlag === i) this.hoverFlag = null;
    }, 120);
  };
  /** @internal */
  private dismissTip() {
    if (this.hoverFlag === null) return false;
    this.holdTip();
    this.hoverFlag = null;
    return true;
  }
  /** @internal Esc also closes a note opened by pointing while the focus is elsewhere on the page */
  private onDocKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || this.contains(document.activeElement)) return;
    window.clearTimeout(this.leaveTimer);
    this.hoverFlag = null;
  };
  /** @internal */
  private listenEsc(on: boolean) {
    if (on === this.escListening) return;
    this.escListening = on;
    if (on) document.addEventListener("keydown", this.onDocKey);
    else document.removeEventListener("keydown", this.onDocKey);
  }

  /* ---------- Commands ---------- */

  /** @internal Call before something the focus might be on goes away */
  private holdFocus() {
    const a = document.activeElement;
    this.keep = this.querySelector(".ui-rvc__list")?.contains(a) ? "row" : this.contains(a) ? "root" : null;
  }
  /** @internal */
  private flash(name: string) {
    this.pressed = name;
    this.later(() => this.pressed === name && (this.pressed = null), 220);
  }
  /** @internal */
  private setFilter(f: ReviewFilter) {
    if (this.emit("tc-filter-change", { filter: f }, { cancelable: true })) this.filter = f;
  }
  /** @internal */
  private changeFilter(f: ReviewFilter) {
    this.nextEnter = "fade";
    this.setFilter(f);
  }

  /** @internal */
  private decide(targets: ReviewItem[], result: ReviewResult) {
    if (!targets.length) return;
    const { current, done, total } = this.queue();
    this.holdFocus();
    const add: Record<string, Done> = {};
    const stamp = this.nextKey();
    targets.forEach((it) => (add[it.id] = { item: it, result, delay: 0, key: stamp }));
    this.decided = { ...this.decided, ...add };
    this.history = [...this.history.slice(-19), targets.map((t) => t.id)];
    if (current && add[current.id] && !reducedMotion()) {
      const key = performance.now();
      const delay = add[current.id].delay;
      this.nextEnter = "decide";
      this.out = { item: current, result, draft: { ...this.draft }, delay, key, dir: result.decision };
      this.later(() => this.out?.key === key && (this.out = null), delay + STAMP + EXIT + 100);
    } else if (current && add[current.id]) this.nextEnter = "fade";
    this.mode = "view";
    this.peekAt = null;
    const word = result.decision === "approved" ? "Approved" : "Rejected";
    const edited = result.text !== undefined || result.fields !== undefined;
    const text = targets.length > 1 ? `${targets.length} approved` : `${word}${edited ? " with edits" : result.reason ? ` · ${result.reason}` : ""}`;
    const key = this.nextKey();
    // onDecide may return a promise: the chip shows the decision as saving until it settles
    const runs: Promise<unknown>[] = [];
    const failed: { item: ReviewItem; error: unknown }[] = [];
    for (const t of targets) {
      try {
        const r = this.onDecide?.(t, result);
        if (r && typeof (r as Promise<unknown>).then === "function") runs.push(Promise.resolve(r).catch((error: unknown) => void failed.push({ item: t, error })));
      } catch (error) {
        failed.push({ item: t, error });
      }
    }
    this.chip = { text, decision: result.decision, key, pending: runs.length > 0 };
    this.said = `${targets.length > 1 ? `${targets.length} items approved` : `${word}: ${targets[0].title}${result.reason ? `, ${result.reason}` : ""}`}. ${done + targets.length} of ${total} reviewed.`;
    const settle = (sync: boolean) => {
      if (!this.alive) return;
      // Only decisions still standing go back – one already undone stays as it is
      const back = sync ? failed : failed.filter((f) => this.decided[f.item.id]?.key === stamp);
      if (!back.length) {
        const c = this.chip;
        if (c?.key === key) this.chip = c.spent ? null : { ...c, pending: false };
        return;
      }
      this.fail(back, result, stamp);
    };
    if (runs.length) void Promise.all(runs).then(() => settle(false));
    else if (failed.length) settle(true);
  }

  /** @internal onDecide failed: the items come back into the queue, the chip says so and offers to try again */
  private fail(back: { item: ReviewItem; error: unknown }[], result: ReviewResult, stamp: number) {
    const ids = back.map((b) => b.item.id);
    const n = { ...this.decided };
    for (const id of ids) if (n[id]?.key === stamp) delete n[id];
    this.decided = n;
    this.history = this.history.map((step) => step.filter((id) => !ids.includes(id))).filter((step) => step.length);
    const verb = result.decision === "approved" ? "approve" : "reject";
    const first = back[0];
    const why = first.error instanceof Error && first.error.message ? first.error.message : "";
    const text = `Couldn't ${verb}${back.length > 1 ? ` ${back.length} items` : ""}${why ? ` · ${why}` : ""}`;
    const key = this.nextKey();
    this.holdFocus();
    this.nextEnter = "up";
    this.currentId = first.item.id;
    this.chip = { text, decision: result.decision, key, error: { targets: back.map((b) => b.item), result } };
    this.said = `Couldn't ${verb} ${back.length > 1 ? `${back.length} items` : first.item.title}${why ? `: ${why}` : ""}. It is back in the queue.`;
  }

  /** @internal */
  private retry() {
    const e = this.chip?.error;
    if (!e) return;
    const { list } = this.queue();
    const targets = e.targets.filter((t) => list.some((i) => i.id === t.id));
    if (targets.length) this.decide(targets, e.result);
  }

  approve() {
    const { current } = this.queue();
    if (!current) return;
    if (this.mode === "edit") return this.save();
    this.flash("approve");
    this.decide([current], { decision: "approved" });
  }

  /** @internal */
  private openReject() {
    if (!this.queue().current) return;
    this.flash("reject");
    this.mode = this.mode === "reject" ? "view" : "reject";
  }

  /** Opens the reason picker, or rejects right away with a reason */
  reject(reason?: string) {
    if (!reason) return this.openReject();
    const { current } = this.queue();
    if (!current) return;
    this.flash(`reason:${reason}`);
    this.decide([current], { decision: "rejected", reason });
  }

  /** Edits the current item in place */
  edit(focus = false) {
    const { current } = this.queue();
    if (!current) return;
    this.flash("edit");
    if (this.mode === "edit") return;
    this.draft = draftOf(current);
    this.mode = "edit";
    this.peekAt = null;
    if (focus) requestAnimationFrame(() => this.querySelector<HTMLElement>(".ui-rvc__editor textarea, .ui-rvc__input")?.focus({ preventScroll: true }));
  }

  /** Replaces the draft of the body (or of a field, by its label) while editing */
  setDraft(text: string, field?: string) {
    this.draft = { ...this.draft, [field ? `field:${field}` : "body"]: text };
  }

  /** Approves with the edits */
  save() {
    const { current } = this.queue();
    if (!current || this.mode !== "edit") return;
    this.flash("save");
    const draft = this.draft;
    const base = draftOf(current);
    const result: ReviewResult = { decision: "approved" };
    if (draft.body !== undefined && draft.body !== base.body) result.text = draft.body;
    const fields: Record<string, string> = {};
    for (const f of current.fields ?? []) {
      const k = `field:${f.label}`;
      if (draft[k] !== undefined && draft[k] !== base[k]) fields[f.label] = draft[k];
    }
    if (Object.keys(fields).length) result.fields = fields;
    this.decide([current], result);
  }

  cancel() {
    if (this.mode === "view") return;
    // The focus rescue puts focus back on the button that opened this mode (Edit or Reject)
    this.leftMode = this.mode;
    this.mode = "view";
    this.draft = {};
  }

  /** @internal */
  private move(step: number) {
    const { list, current, index } = this.queue();
    if (list.length < 2 || !current) return;
    this.holdFocus();
    const i = (index + step + list.length) % list.length;
    this.nextEnter = step > 0 ? "down" : "up";
    this.currentId = list[i].id;
  }

  skip() {
    const { current } = this.queue();
    if (!current) return;
    this.flash("skip");
    this.skipped = { ...this.skipped, [current.id]: true };
    this.emit("tc-skip", { item: current });
    this.said = `Skipped: ${current.title}`;
    this.move(1);
  }

  next() {
    this.move(1);
  }

  previous() {
    this.move(-1);
  }

  undo() {
    const last = this.history[this.history.length - 1];
    if (!last) return;
    this.holdFocus();
    this.flash("undo");
    const back = last.map((id) => this.decided[id]).filter(Boolean);
    const n = { ...this.decided };
    for (const id of last) delete n[id];
    this.decided = n;
    this.history = this.history.slice(0, -1);
    this.chip = null;
    if (back[0]) {
      this.nextEnter = "up";
      this.currentId = back[0].item.id;
      if (!matches(back[0].item, this.filter, this.lowConfidence)) this.changeFilter("all");
    }
    this.said = `Undone – ${back.length > 1 ? `${back.length} items are` : `${back[0]?.item.title} is`} back in the queue.`;
    for (const b of back) this.emit("tc-undo", { item: b.item, result: b.result });
  }

  /** Shows the note of the n-th flagged span of the current item – null hides it */
  peek(index: number | null) {
    this.peekAt = index;
  }

  select(id: string) {
    const { list, index } = this.queue();
    const i = list.findIndex((x) => x.id === id);
    if (i < 0 || i === index) return;
    this.nextEnter = i > index ? "down" : "up";
    this.currentId = id;
  }

  /** @internal */
  private cycleFlag() {
    const { flagCount } = this.queue();
    if (!flagCount) return;
    const p = this.peekAt;
    this.peekAt = p === null ? 0 : p + 1 >= flagCount ? null : p + 1;
  }

  /** @internal Single keys while the focus is anywhere inside: A, E, R (then 1–4), S, J/K or the arrows, F, Z – Esc backs out */
  private onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.isComposing) return;
    const mode = this.mode;
    const typing = (e.target as HTMLElement).closest("textarea, input, select, [contenteditable='true']");
    const mod = e.metaKey || e.ctrlKey;
    const run = (fn: () => void) => {
      e.preventDefault();
      fn();
    };
    if (mode === "edit" && mod && e.key === "Enter") return run(() => this.save());
    if (e.key === "Escape") {
      if (mode !== "view") return run(() => this.cancel());
      if (this.peekAt !== null) return run(() => (this.peekAt = null));
      if (this.dismissTip()) e.preventDefault();
      return;
    }
    if (typing || e.altKey) return;
    if (mod) {
      if (e.key.toLowerCase() === "z" && !e.shiftKey) run(() => this.undo());
      return;
    }
    if (!this.shortcuts) return;
    if (mode === "reject") {
      const n = Number(e.key);
      if (n >= 1 && n <= this.reasons.length) return run(() => this.reject(this.reasons[n - 1]));
    }
    const keys: Record<string, () => void> = {
      a: () => this.approve(),
      e: () => this.edit(true),
      r: () => this.openReject(),
      s: () => this.skip(),
      j: () => this.move(1),
      arrowdown: () => this.move(1),
      k: () => this.move(-1),
      arrowup: () => this.move(-1),
      f: () => this.cycleFlag(),
      z: () => this.undo(),
      u: () => this.undo(),
    };
    const fn = keys[e.key.toLowerCase()];
    if (fn) run(fn);
  };

  /* ---------- Parts ---------- */

  /** @internal The proposal's text: flagged spans marked (numbered along the item by `counter`); `code` draws a diff */
  private text(t: ReviewText | undefined, isLive: boolean, counter: { n: number }, format?: "text" | "code", start = 1): unknown {
    const tipIndex = this.hoverFlag ?? this.peekAt;
    const tipId = `${this.baseId}-tip`;
    const hintId = `${this.baseId}-hint`;
    const parts = partsOf(t);
    const flag = (p: ReviewFlag) => {
      const i = counter.n++;
      const on = isLive && tipIndex === i;
      return html`<mark
        class="ui-rvc__flag"
        ?data-on=${on}
        tabindex=${isLive ? 0 : -1}
        aria-describedby=${ifDefined(isLive ? (on ? `${hintId} ${tipId}` : hintId) : undefined)}
        @mouseenter=${isLive
          ? () => {
              this.holdTip();
              this.hoverFlag = i;
            }
          : nothing}
        @mouseleave=${isLive ? () => this.dropTip(i) : nothing}
        @focus=${isLive ? () => (this.peekAt = i) : nothing}
        @blur=${isLive ? () => this.peekAt === i && (this.peekAt = null) : nothing}
      >${p.text}</mark>`;
    };
    const inline = (ps: (string | ReviewFlag)[], code = false) => ps.map((p) => (typeof p === "string" ? html`<span>${code ? tint(p) : p}</span>` : flag(p)));
    if (format !== "code") return inline(parts);
    // A unified diff: old and new line numbers, the sign in its own column, a light syntax tint
    let o = start;
    let n = start;
    return linesOf(parts).map((line) => {
      const first = line[0];
      const lead = typeof first === "string" ? first : "";
      if (lead.startsWith("@@")) {
        const m = /-(\d+)(?:,\d+)? \+(\d+)/.exec(lead);
        if (m) {
          o = Number(m[1]);
          n = Number(m[2]);
        }
        return html`<span class="ui-rvc__hunk">${lead}</span>`;
      }
      const sign = lead.startsWith("+") ? "add" : lead.startsWith("-") ? "del" : "ctx";
      const rest = typeof first === "string" ? [first.slice(1), ...line.slice(1)] : line;
      // One number column: the new line's number, or the old one for a removed line, with a tiny sign before it
      const no = sign === "add" ? n++ : sign === "del" ? o++ : (o++, n++);
      return html`<span class="ui-rvc__line" data-diff=${sign}
        ><span class="ui-rvc__ln">${sign !== "ctx" ? html`<span class="ui-rvc__sign">${sign === "add" ? "+" : "−"}</span>` : nothing}${no}</span
        ><span class="ui-rvc__src">${rest.length ? inline(rest, true) : "​"}</span></span
      >`;
    });
  }

  /** @internal The item: who proposes it and why, the proposal itself and its sources – a ghost is the one on its way out */
  private detail(it: ReviewItem, ghost: Out | undefined, enterMode: Enter, outDelay: number) {
    const isLive = !ghost;
    const counter = { n: 0 };
    const text = (t: ReviewText | undefined, format?: "text" | "code", start?: number) => this.text(t, isLive, counter, format, start);
    const editing = isLive && this.mode === "edit";
    const draft = this.draft;
    const edits = ghost?.draft ?? {};
    const base = ghost ? draftOf(it) : {};
    const d = ghost?.result.decision;
    const bodyEdited = !!ghost && edits.body !== undefined && edits.body !== base.body;
    return html`<div
      class="ui-rvc__detail"
      ?data-ghost=${!!ghost}
      data-decision=${ifDefined(d)}
      data-enter=${ifDefined(ghost ? undefined : enterMode)}
      aria-hidden=${ifDefined(ghost ? "true" : undefined)}
      style=${styleMap({ "--d": `${ghost?.delay ?? outDelay}ms` })}
    >
      <div class="ui-rvc__who">
        ${avatar(it)}
        <div class="ui-rvc__meta">
          <span class="ui-rvc__name"
            ><span class="ui-rvc__agent" title=${it.agent}>${it.agent}</span>${it.risk !== "low" ? html`<span class="ui-rvc__risk" data-risk=${it.risk}>${RISK[it.risk].label}</span>` : nothing}</span
          >
          ${it.model ? html`<span class="ui-rvc__model" title=${it.model}>${it.model}</span>` : nothing}
        </div>
      </div>
      <div class="ui-rvc__ask"><h3 class="ui-rvc__title">${it.title}</h3></div>
      ${it.reasoning ? html`<p class="ui-rvc__why"><b>Why </b>${it.reasoning}</p>` : nothing}
      <section class="ui-rvc__proposal" ?data-editing=${editing} aria-label=${`Proposal: ${it.type}`}>
        ${it.fields?.length
          ? html`<dl class="ui-rvc__fields">
              ${it.fields.map((f) => {
                const k = `field:${f.label}`;
                return html`<div>
                  <dt>${f.label}</dt>
                  <dd title=${ifDefined(editing ? undefined : plain(f.value))}
                    >${editing
                      ? html`<input class="ui-rvc__input" .value=${live(draft[k] ?? "")} aria-label=${f.label} @input=${(e: Event) => (this.draft = { ...this.draft, [k]: (e.target as HTMLInputElement).value })} />`
                      : ghost && edits[k] !== undefined && edits[k] !== base[k]
                        ? editedText(base[k], edits[k])
                        : text(f.value)}</dd
                  >
                </div>`;
              })}
            </dl>`
          : nothing}
        ${it.body !== undefined
          ? html`<div class="ui-rvc__body" data-format=${ifDefined(it.format)}>
              ${it.bodyLabel ? html`<span class="ui-rvc__body-label">${it.bodyLabel}</span>` : nothing}
              ${editing
                ? html`<div class="ui-rvc__editor">
                    <div class="ui-rvc__mirror" aria-hidden="true">${editedText(plain(it.body), draft.body ?? "")}${"​"}</div>
                    <textarea .value=${live(draft.body ?? "")} aria-label=${it.bodyLabel ?? "Proposal"} spellcheck="false" @input=${(e: Event) => (this.draft = { ...this.draft, body: (e.target as HTMLTextAreaElement).value })}></textarea>
                  </div>`
                : it.format === "code" && !bodyEdited
                  ? html`<div class="ui-rvc__code"><div class="ui-rvc__diff">${text(it.body, "code")}</div></div>`
                  : html`<p class="ui-rvc__text">${bodyEdited ? editedText(base.body, edits.body) : text(it.body)}</p>`}
            </div>`
          : nothing}
        ${it.files?.length
          ? html`<div class="ui-rvc__code">
              ${it.files.map(
                (f) =>
                  html`<div class="ui-rvc__file">
                    <div class="ui-rvc__file-head">
                      <span class="ui-rvc__path" title=${f.path}
                        >${f.path.includes("/") ? html`<span class="ui-rvc__dir">${f.path.slice(0, f.path.lastIndexOf("/") + 1)}</span>` : nothing}${f.path.slice(f.path.lastIndexOf("/") + 1)}</span
                      >
                      ${f.added !== undefined ? html`<span class="ui-rvc__count-add">+${f.added}</span>` : nothing}
                      ${f.removed !== undefined ? html`<span class="ui-rvc__count-del">−${f.removed}</span>` : nothing}
                    </div>
                    ${f.diff !== undefined ? html`<div class="ui-rvc__diff">${text(f.diff, "code", f.start ?? 1)}</div>` : nothing}
                  </div>`,
              )}
            </div>`
          : nothing}
        ${it.steps?.length
          ? html`<ol class="ui-rvc__steps">
              ${it.steps.map(
                (st, i) =>
                  html`<li class="ui-rvc__step" ?data-flagged=${!!(flagsIn(st.title) + flagsIn(st.detail))}>
                    <span class="ui-rvc__step-n" aria-hidden="true">${i + 1}</span>
                    <span class="ui-rvc__step-main"
                      ><span class="ui-rvc__step-title">${text(st.title)}</span>${st.tool
                        ? html`<span class="ui-rvc__step-tool">${st.icon ? html`<span class="ui-rvc__source-icon">${st.icon.cloneNode(true)}</span>` : nothing}${st.tool}</span>`
                        : nothing}${st.detail !== undefined ? html`<span class="ui-rvc__step-detail">${text(st.detail)}</span>` : nothing}</span
                    >
                  </li>`,
              )}
            </ol>`
          : nothing}
      </section>
      ${it.sources?.length
        ? html`<div class="ui-rvc__foot">
            <ul class="ui-rvc__sources" aria-label="Sources">
              ${it.sources.map((s) => {
                const inner = html`<span class="ui-rvc__source-icon">${s.icon ? s.icon.cloneNode(true) : linkGlyph}</span>${s.label}`;
                return html`<li>${s.href && isLive ? html`<a class="ui-rvc__source" href=${s.href} target="_blank" rel="noreferrer">${inner}</a>` : html`<span class="ui-rvc__source">${inner}</span>`}</li>`;
              })}
            </ul>
          </div>`
        : nothing}
    </div>`;
  }

  /** @internal One row of the queue – a ghost row is one on its way out, marked with its decision */
  private queueRow(it: ReviewItem, ghost: Ghost | undefined, isCurrent: boolean, tabbable: boolean, enter: { kind: string; delay: number } | undefined, now: number) {
    const w = waited(now - toMs(it.createdAt));
    const d = ghost?.result?.decision;
    return html`<li class="ui-rvc__item" data-enter=${ifDefined(enter?.kind)} ?data-leaving=${!!ghost} data-decision=${ifDefined(d)} style=${styleMap({ "--d": `${ghost ? ghost.delay : (enter?.delay ?? 0)}ms` })}>
      <button
        type="button"
        class="ui-rvc__row"
        data-id=${it.id}
        data-risk=${it.risk}
        aria-current=${ifDefined(isCurrent ? "true" : undefined)}
        tabindex=${ghost ? -1 : tabbable ? 0 : -1}
        @click=${() => !ghost && this.select(it.id)}
      >
        ${avatar(it)}
        <span class="ui-rvc__row-main">
          <span class="ui-rvc__row-top"
            ><span class="ui-rvc__row-title" title=${it.title}>${it.title}</span><span class="ui-rvc__sr">, </span>${d
              ? html`<span class="ui-rvc__row-done" data-decision=${d} aria-hidden="true">${d === "rejected" ? cross : tick}</span>`
              : wait(w, slaOf(it, now, this.sla), "ui-rvc__wait")}</span
          >
          <span class="ui-rvc__row-meta"
            ><span class="ui-rvc__sr">, </span><span class="ui-rvc__tag" title=${it.type}>${it.type}</span><span class="ui-rvc__sr">${`, ${RISK[it.risk].label.toLowerCase()}, ${pct(it.confidence)} confidence`}</span>${this.skipped[it.id]
              ? html`<span class="ui-rvc__skipped">· skipped</span>`
              : nothing}</span
          >
        </span>
      </button>
    </li>`;
  }

  /** @internal The last decision with Undo – or, when onDecide failed, what went wrong and Try again */
  private undoChip(chip: Chip) {
    const setHold = (patch: Partial<{ hover: boolean; focus: boolean }>) => (this.chipHold = { ...this.chipHold, ...patch });
    return html`<div
      class="ui-rvc__undo"
      data-decision=${chip.decision}
      ?data-pending=${!!chip.pending}
      ?data-error=${!!chip.error}
      ?data-leaving=${this.chipLeaving}
      aria-busy=${ifDefined(chip.pending ? "true" : undefined)}
      @mouseenter=${() => setHold({ hover: true })}
      @mouseleave=${() => setHold({ hover: false })}
      @focusin=${() => setHold({ focus: true })}
      @focusout=${(e: FocusEvent) => !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null) && setHold({ focus: false })}
    >
      <span class="ui-rvc__undo-text" title=${chip.text}>${chip.error ? alert : chip.decision === "rejected" ? cross : tick}${chip.text}</span>
      ${chip.error
        ? html`<button type="button" class="ui-rvc__undo-btn" @click=${() => this.retry()}>${undoGlyph}Try again</button>`
        : html`<button type="button" class="ui-rvc__undo-btn" ?data-pressed=${this.pressed === "undo"} @click=${() => this.undo()} aria-keyshortcuts="Z Control+Z Meta+Z">${undoGlyph}Undo<kbd class="ui-rvc__kbd">Z</kbd></button>`}
    </div>`;
  }

  /** @internal The buttons under the item: Approve, Edit, Reject, Skip – the reasons while rejecting, Save and Cancel while editing */
  private actions(empty: boolean, canEdit: boolean, canSkip: boolean) {
    const { mode, pressed } = this;
    const btn = (name: string, label: string, icon: TemplateResult, key: string, onClick: () => void, opts: { primary?: boolean; disabled?: boolean; danger?: boolean; focusKey?: string } = {}) =>
      html`<button
        type="button"
        class="ui-rvc__btn"
        data-focus-key=${ifDefined(opts.focusKey)}
        ?data-primary=${!!opts.primary}
        ?data-danger=${!!opts.danger}
        ?data-pressed=${pressed === name}
        data-tone=${ifDefined(opts.danger ? "rejected" : opts.primary ? "approved" : undefined)}
        ?disabled=${!!opts.disabled}
        aria-keyshortcuts=${ifDefined(KEYS[key] ?? (key.length === 1 ? key.toUpperCase() : undefined))}
        @click=${onClick}
      >${icon}<span>${label}</span><kbd class="ui-rvc__kbd">${key}</kbd></button>`;
    return html`<div class="ui-rvc__actions" data-mode=${mode}>
      ${mode === "view"
        ? keyed(
            "view",
            html`<div class="ui-rvc__btns">
              ${btn("approve", "Approve", tick, "A", () => this.approve(), { primary: true, disabled: empty })}
              ${btn("edit", "Edit", pencil, "E", () => this.edit(true), { disabled: empty || !canEdit, focusKey: "edit" })}
              ${btn("reject", "Reject", cross, "R", () => this.openReject(), { disabled: empty, danger: true, focusKey: "reject" })}
              ${btn("skip", "Skip", nextGlyph, "S", () => this.skip(), { disabled: !canSkip })}
            </div>`,
          )
        : nothing}
      ${mode === "reject"
        ? keyed(
            "reject",
            html`<div class="ui-rvc__btns" role="group" aria-label="Why reject it?">
              <span class="ui-rvc__why-label">Why?</span>
              ${this.reasons.map(
                (r, i) =>
                  html`<button
                    type="button"
                    class="ui-rvc__reason"
                    data-focus-key=${ifDefined(i === 0 ? "reject" : undefined)}
                    ?data-pressed=${pressed === `reason:${r}`}
                    @click=${() => this.reject(r)}
                    aria-keyshortcuts=${String(i + 1)}
                  ><kbd class="ui-rvc__kbd">${i + 1}</kbd>${r}</button>`,
              )}
              <button type="button" class="ui-rvc__cancel" data-focus-key="reject" @click=${() => this.cancel()} aria-keyshortcuts="Escape">Cancel<kbd class="ui-rvc__kbd">Esc</kbd></button>
            </div>`,
          )
        : nothing}
      ${mode === "edit"
        ? keyed(
            "edit",
            html`<div class="ui-rvc__btns">
              ${btn("save", "Approve with edits", tick, "⌘↵", () => this.save(), { primary: true })}
              ${btn("cancel", "Cancel", cross, "Esc", () => this.cancel(), { focusKey: "edit" })}
            </div>`,
          )
        : nothing}
    </div>`;
  }

  protected override render() {
    const { pending, list, counts, oldest, done, total, current } = this.queue();
    const now = this.now ?? this.tick;
    const sla = this.sla;
    const out = this.out;
    const enterMode = current?.id === this.entered.id ? this.entered.mode : (this.nextEnter ?? "down");
    const ids = new Set(list.map((i) => i.id));
    const rows: { item: ReviewItem; ghost?: Ghost }[] = list.map((item) => ({ item }));
    for (const g of [...this.ghosts].filter((x) => !ids.has(x.item.id)).sort((a, b) => a.index - b.index)) rows.splice(Math.min(g.index, rows.length), 0, { item: g.item, ghost: g });

    const tipIndex = this.hoverFlag ?? this.peekAt;
    const tipFlag = current && tipIndex !== null ? textsOf(current).flatMap((t) => partsOf(t)).filter((p): p is ReviewFlag => typeof p !== "string")[tipIndex] : undefined;
    const shownTip = !!tipFlag && this.mode !== "edit";
    const tipId = `${this.baseId}-tip`;
    const hintId = `${this.baseId}-hint`;
    const chip = this.chip;

    return html`
      ${/* The header (.tc-head): on the tray in Standard, the card's first row in Clean. How far you are and how
           long the oldest waits under the title; Undo at the right */ cardHead({
        icon: badgePaths,
        title: this.heading,
        subtitle: html`<span class="ui-rvc__status">
          <span class="ui-rvc__progress">
            <span class="ui-rvc__track" ?data-live=${pending.length > 0} aria-hidden="true"><span class="ui-rvc__fill" style=${styleMap({ width: `${(total ? done / total : 0) * 100}%` })}></span></span>
            <span class="ui-rvc__count">${keyed(done, html`<b>${done}</b>`)} of ${total} reviewed</span>
          </span>
          ${oldest ? html`<span class="ui-rvc__oldest">oldest ${wait(waited(now - toMs(oldest.createdAt)), slaOf(oldest, now, sla), "ui-rvc__oldest-time", true)}</span>` : nothing}
        </span>`,
        aside: chip ? keyed(chip.key, this.undoChip(chip)) : undefined,
      })}

      <div class="ui-rvc__card" ?data-narrow=${this.narrow}>
        <div class="ui-rvc__queue">
          <div class="ui-rvc__queue-head">
            <div class="ui-rvc__filters" role="group" aria-label="Filter the queue">
              ${FILTERS.map(
                (f) =>
                  html`<button type="button" class="ui-rvc__filter" aria-pressed=${this.filter === f.id ? "true" : "false"} @click=${() => this.changeFilter(f.id)}>${f.label}<span class="ui-rvc__filter-count">${counts[f.id]}</span></button>`,
              )}
            </div>
          </div>
          <ul class="ui-rvc__list" aria-label="Queue">
            ${repeat(
              rows,
              ({ item, ghost }) => (ghost ? `${item.id}~out` : item.id),
              ({ item: it, ghost }) => this.queueRow(it, ghost, !ghost && current?.id === it.id, !ghost && (current?.id === it.id || (!current && it === list[0])), ghost ? undefined : this.enterKnown.get(it.id), now),
            )}
            ${!rows.length ? html`<li class="ui-rvc__none">${pending.length ? "Nothing matches this filter" : "Nothing waiting"}</li>` : nothing}
          </ul>
        </div>

        <div class="ui-rvc__main">
          <div class="ui-rvc__stage">
            ${out ? keyed(`out-${out.key}`, this.detail(out.item, out, enterMode, out.delay)) : nothing}
            ${current
              ? keyed(current.id, this.detail(current, undefined, enterMode, out?.delay ?? 0))
              : html`<div class="ui-rvc__empty" ?data-after=${!!out} style=${styleMap({ "--d": `${out?.delay ?? 0}ms` })}>
                  <span class="ui-rvc__empty-mark">${badge(22)}</span>
                  <b>${pending.length ? "Nothing matches this filter" : "All caught up"}</b>
                  <span>${pending.length ? `${pending.length} more in the queue under All` : `${done} of ${total} reviewed – new items from your agents show up here`}</span>
                </div>`}
            ${shownTip && tipFlag
              ? keyed(
                  tipIndex,
                  html`<div
                    id=${tipId}
                    role="tooltip"
                    class="ui-rvc__tip"
                    @mouseenter=${() => this.hoverFlag !== null && this.holdTip()}
                    @mouseleave=${() => this.hoverFlag !== null && this.dropTip()}
                  >
                    <span class="ui-rvc__tip-head">${alert}Agent's note</span>
                    <p>${tipFlag.note}</p>
                    ${tipFlag.source ? html`<span class="ui-rvc__tip-source">${tipFlag.source}</span>` : nothing}
                  </div>`,
                )
              : nothing}
          </div>
          ${this.actions(!current, !!current?.body || !!current?.fields?.length, list.length >= 2)}
        </div>
      </div>
      <div class="ui-rvc__sr" aria-live="polite" aria-atomic="true">${this.said}</div>
      <span id=${hintId} hidden>The agent is unsure about this part – ${this.shortcuts ? "press F or " : ""}focus it for the agent's note</span>
    `;
  }

  static override css = /* css */ `
/* Colors, sizes and motion as variables – override them on [data-ui="rvc"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rvc"] {
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
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors, sizes and motion as variables – override them on [data-ui="rvc"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rvc"] {
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
[data-ui="rvc"] *, [data-ui="rvc"] *::before, [data-ui="rvc"] *::after { box-sizing: border-box; }
/* The root only takes focus when the focused control went away – the ring says where the keys now go */
[data-ui="rvc"]:focus { outline: none; }
[data-ui="rvc"]:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* Off-screen: every loop and highlight holds still */
[data-ui="rvc"][data-offscreen] *, [data-ui="rvc"][data-offscreen] *::before, [data-ui="rvc"][data-offscreen] *::after { animation-play-state: paused; }
:where([data-ui="rvc"]) :is(button, input, textarea) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; -webkit-tap-highlight-color: transparent; }
:where([data-ui="rvc"]) button { cursor: pointer; }
:where([data-ui="rvc"]) button:disabled { cursor: default; }
[data-ui="rvc"] :is(button, a, mark, input, textarea):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="rvc"]) :is(p, dl, dd, h3, ul, ol) { margin: 0; padding: 0; }
[data-ui="rvc"] svg { display: block; flex: none; }
/* Key chips: the kbd pattern */
.ui-rvc__kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-kbd-fg); letter-spacing: 0; }
.ui-rvc__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- The header's line under the title: how far you are, how long the oldest waits ----- */
.ui-rvc__status { display: flex; flex-wrap: wrap; align-items: center; gap: 0 var(--tc-space-2); }
.ui-rvc__progress { display: flex; flex: none; align-items: center; gap: var(--tc-space-2); white-space: nowrap; }
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
.ui-rvc__oldest { flex: none; white-space: nowrap; }
.ui-rvc__oldest::before { content: "·"; margin-right: var(--tc-space-2); color: var(--tc-text-disabled); }
.ui-rvc__oldest-time { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-rvc__oldest-time[data-sla="near"] { color: var(--tc-status-warning-fg); }
.ui-rvc__oldest-time[data-sla="over"] { color: var(--tc-status-danger-fg); }
/* Past the SLA: a warning mark, not only the colour (WCAG 1.4.1) */
:is(.ui-rvc__wait, .ui-rvc__oldest-time) > svg { width: 11px; height: 11px; }
/* The filter: a small segmented control on top of the queue */
/* The filter: on white – the picked tab a white pill with a soft shadow, the others just quieter text */
.ui-rvc__filters { display: flex; flex: 1; gap: var(--tc-space-1); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__filter { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-1) var(--tc-space-2-5); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__filter { display: inline-flex; align-items: center; gap: var(--tc-space-1); padding: var(--tc-space-1) var(--tc-space-2-5); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rvc__filter:hover { color: var(--tc-text-primary); }
.ui-rvc__filter[aria-pressed="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow), inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); }
.ui-rvc__filter-count { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rvc__filter[aria-pressed="true"] .ui-rvc__filter-count { color: var(--tc-text-muted); }
/* ----- The white card: the queue on the left, the item on the right ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__card { position: relative; display: grid; grid-template-columns: var(--tc-review-center-queue) minmax(0, 1fr); height: var(--tc-review-center-height); overflow: hidden; border-radius: var(--tc-radius-2xl); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* ----- The queue ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__queue { display: flex; flex-direction: column; min-width: 0; min-height: 0; border-right: 1px solid var(--tc-border-default); background: var(--tc-review-center-queue-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__queue-head { display: flex; flex: none; align-items: center; padding: var(--tc-space-2); background: var(--tc-surface-raised); border-bottom: 1px solid var(--tc-border-default); }
/* ----- Under the bar: the queue on the left, the item on the right ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__card { position: relative; display: grid; grid-template-columns: var(--tc-review-center-queue) minmax(0, 1fr); height: var(--tc-review-center-height); overflow: hidden; border-top: 0.5px solid var(--tc-border-default); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); }
/* ----- The queue ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__queue { display: flex; flex-direction: column; min-width: 0; min-height: 0; border-right: 0.5px solid var(--tc-border-default); background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__queue-head { display: flex; flex: none; align-items: center; padding: var(--tc-space-2); background: var(--tc-surface-raised); border-bottom: 0.5px solid var(--tc-border-default); }
.ui-rvc__list { position: relative; flex: 1; min-height: 0; padding: var(--tc-space-2); overflow: hidden auto; overscroll-behavior: contain; list-style: none; scrollbar-width: thin; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__item { height: calc(var(--tc-review-center-row) + 4px); padding: var(--tc-space-0-5) 0; overflow: hidden; }
.ui-rvc__item[data-enter="first"] { animation: ui-rvc-row-in var(--tc-duration-slower) var(--tc-ease-move) var(--d) backwards; }
.ui-rvc__item:is([data-enter="new"], [data-enter="in"]) { animation: ui-rvc-open var(--tc-duration-slowest) var(--tc-ease-move) var(--d) backwards; }
.ui-rvc__item[data-enter="new"] .ui-rvc__row { animation: ui-rvc-arrive var(--tc-review-center-arrive) var(--tc-ease-decelerate) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__item[data-leaving] { pointer-events: none; animation: ui-rvc-close ${EXIT}ms var(--tc-ease-move) var(--d) forwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__item { height: calc(var(--tc-review-center-row) + 2px); padding: 1px 0; overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__item[data-leaving] { pointer-events: none; animation: ui-rvc-close-clean ${EXIT}ms var(--tc-ease-move) var(--d) forwards; }
.ui-rvc__item[data-leaving][data-decision] { animation-delay: calc(var(--d) + ${STAMP}ms); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__row { position: relative; display: grid; grid-template-columns: 28px minmax(0, 1fr); align-items: center; column-gap: var(--tc-space-2-5); width: 100%; height: var(--tc-review-center-row); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-lg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__row { position: relative; display: grid; grid-template-columns: 24px minmax(0, 1fr); align-items: center; column-gap: var(--tc-space-2-5); width: 100%; height: var(--tc-review-center-row); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-rvc__row:hover { background: var(--tc-fill-hover); }
/* The current row: a raised card – overlay surface, so it stands off the queue in dark too */
.ui-rvc__row[aria-current] { background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-raised); }
.ui-rvc__row:focus-visible { outline-offset: -2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__avatar { display: grid; flex: none; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__avatar > svg { width: 15px; height: 15px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__row-main { display: grid; gap: var(--tc-space-1); min-width: 0; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__avatar { display: grid; flex: none; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__avatar > svg { width: 13px; height: 13px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__row-main { display: grid; gap: var(--tc-space-0-5); min-width: 0; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-rvc__row-top { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-rvc__row-title { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__wait { flex: none; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__wait { flex: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rvc__wait { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); }
.ui-rvc__wait[data-sla] { font-weight: var(--tc-font-weight-medium); }
.ui-rvc__wait[data-sla="near"] { color: var(--tc-status-warning-fg); }
.ui-rvc__wait[data-sla="over"] { color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__row-meta { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__row-meta { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
.ui-rvc__tag { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
[data-ui="rvc"] [data-risk="high"] { --tc-review-center-tone-bg: var(--tc-status-danger-bg); --tc-review-center-tone-edge: var(--tc-review-center-high-edge); --tc-review-center-tone-fg: var(--tc-status-danger-fg); }
[data-ui="rvc"] [data-risk="medium"] { --tc-review-center-tone-bg: var(--tc-status-warning-bg); --tc-review-center-tone-edge: var(--tc-review-center-mid-edge); --tc-review-center-tone-fg: var(--tc-status-warning-fg); }
[data-ui="rvc"] [data-risk="low"] { --tc-review-center-tone-bg: var(--tc-status-success-bg); --tc-review-center-tone-edge: var(--tc-review-center-low-edge); --tc-review-center-tone-fg: var(--tc-status-success-fg); }
.ui-rvc__skipped { flex: none; color: var(--tc-text-muted); }
/* A decided row: a small check or cross where the time was, then it fades and closes up */
.ui-rvc__item[data-decision] .ui-rvc__row-main { opacity: 0.5; transition-delay: var(--d); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__row-done { display: grid; flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-full); background: var(--tc-review-center-tone-bg); color: var(--tc-review-center-tone-fg); animation: ui-rvc-fade var(--tc-duration-fast) var(--tc-ease-standard) var(--d) backwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__row-done { display: grid; flex: none; place-items: center; width: 16px; height: 16px; border-radius: var(--tc-radius-xs); background: var(--tc-review-center-tone-bg); color: var(--tc-review-center-tone-fg); animation: ui-rvc-fade var(--tc-duration-fast) var(--tc-ease-standard) var(--d) backwards; }
.ui-rvc__row-done > svg { width: 12px; height: 12px; }
:is(.ui-rvc__row-done, .ui-rvc__undo, .ui-rvc__btn)[data-decision="approved"], .ui-rvc__btn[data-tone="approved"] { --tc-review-center-tone-bg: var(--tc-status-success-bg); --tc-review-center-tone-edge: var(--tc-review-center-low-edge); --tc-review-center-tone-fg: var(--tc-status-success-fg); }
:is(.ui-rvc__row-done, .ui-rvc__undo, .ui-rvc__btn)[data-decision="rejected"], .ui-rvc__btn[data-tone="rejected"] { --tc-review-center-tone-bg: var(--tc-status-danger-bg); --tc-review-center-tone-edge: var(--tc-review-center-high-edge); --tc-review-center-tone-fg: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__none { display: grid; place-items: center; height: 120px; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); list-style: none; animation: ui-rvc-fade var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-slow) backwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__none { display: grid; place-items: center; height: 120px; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); list-style: none; animation: ui-rvc-fade var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-slow) backwards; }
/* ----- The item ----- */
.ui-rvc__main { position: relative; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.ui-rvc__stage { position: relative; flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; scrollbar-width: thin; transition: height var(--tc-duration-slower) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__detail { position: relative; display: grid; gap: var(--tc-space-4); padding: 22px 26px var(--tc-space-6); background: var(--tc-surface-raised); }
.ui-rvc__detail[data-enter="first"] > * { animation: ui-rvc-in var(--tc-duration-slower) var(--tc-ease-move) calc(var(--tc-duration-quick) + var(--i, 0) * var(--tc-duration-instant)) backwards; }
/* After a decision: the old item fades up and away, the next one follows a beat later from just below */
.ui-rvc__detail[data-enter="decide"] { animation: ui-rvc-in var(--tc-duration-slow) var(--tc-ease-move) calc(var(--d) + var(--tc-duration-instant)) backwards; }
.ui-rvc__detail[data-enter="down"] { animation: ui-rvc-in var(--tc-duration-moderate) var(--tc-ease-move) backwards; }
.ui-rvc__detail[data-enter="up"] { animation: ui-rvc-in-up var(--tc-duration-moderate) var(--tc-ease-move) backwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__detail { position: relative; display: grid; gap: var(--tc-space-4); padding: 22px var(--tc-space-6) var(--tc-space-6); background: var(--tc-surface-raised); }
/* After a decision: the old item fades up and away, the next one follows a beat later from just below */
.ui-rvc__detail[data-enter="fade"] { animation: ui-rvc-fade var(--tc-duration-moderate) var(--tc-ease-standard) backwards; }
.ui-rvc__detail[data-ghost] { position: absolute; inset: 0 0 auto; z-index: 2; min-height: 100%; pointer-events: none; animation: ui-rvc-away var(--tc-duration-moderate) var(--tc-ease-move) var(--d) forwards; }
.ui-rvc__who { display: flex; align-items: center; gap: var(--tc-space-2-5); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__who .ui-rvc__avatar { width: 34px; height: 34px; border-radius: var(--tc-radius-md); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__who .ui-rvc__avatar > svg { width: 17px; height: 17px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__meta { display: grid; flex: 1; gap: 1px; min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__who .ui-rvc__avatar { width: 32px; height: 32px; border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__who .ui-rvc__avatar > svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__meta { display: grid; flex: 1; gap: 0; min-width: 0; }
.ui-rvc__name { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__agent { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__model { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* The risk tag: a tint with its color, like the Live tag in Trace Waterfall – low risk needs none */
.ui-rvc__risk { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-review-center-tone-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-review-center-tone-fg); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__agent { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__model { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* The risk tag: a tint with its color, like the Live tag in Trace Waterfall – low risk needs none */
.ui-rvc__ask { display: grid; gap: var(--tc-space-1); }
/* The item under review is the pane's headline – display-sized on purpose, above the card title */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__title { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-loose); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-strong); text-wrap: balance; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__title { font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); color: var(--tc-title-color); text-wrap: balance; letter-spacing: var(--tc-title-tracking); }
.ui-rvc__why { margin-top: -6px; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); text-wrap: pretty; }
.ui-rvc__why b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
/* The proposal: no box around it – the content is the focus */
.ui-rvc__proposal { display: grid; gap: var(--tc-space-4); min-width: 0; padding-top: var(--tc-space-0-5); }
/* Facts in a light row: a small label over each value, no lines between them */
.ui-rvc__fields { display: flex; flex-wrap: wrap; gap: var(--tc-space-3) 36px; }
.ui-rvc__fields > div { display: grid; gap: 1px; min-width: 0; max-width: 100%; }
.ui-rvc__fields dt { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__fields dd { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__fields dd { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-rvc__body { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-rvc__body-label { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* Prose sits on a thin line at its left, like a quote of what goes out */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__text { padding-left: var(--tc-space-3-5); box-shadow: inset 1px 0 0 var(--tc-border-strong); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; text-wrap: pretty; }
/* Code: a white block on the card's shadow – a row per file, the diff under a hairline. Numbers soft, no gutter, few colors */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__code { overflow: hidden; border-radius: var(--tc-radius-xl); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__file + .ui-rvc__file { border-top: 1px solid var(--tc-border-default); }
/* Prose sits on a thin line at its left, like a quote of what goes out */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__text { padding-left: var(--tc-space-3-5); box-shadow: inset 0.5px 0 0 var(--tc-border-strong); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; text-wrap: pretty; }
/* Code: a white block on the card's shadow – a row per file, the diff under a hairline. Numbers soft, no gutter, few colors */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__code { overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__file + .ui-rvc__file { border-top: 0.5px solid var(--tc-border-default); }
.ui-rvc__file-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; height: 36px; padding: 0 var(--tc-space-3) 0 var(--tc-space-4); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); }
.ui-rvc__path { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-rvc__dir { color: var(--tc-text-muted); }
:is(.ui-rvc__count-add, .ui-rvc__count-del) { flex: none; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-rvc__count-add { color: var(--tc-status-success-fg); }
.ui-rvc__count-del { color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__diff { padding: var(--tc-space-2) 0 var(--tc-space-0-5); overflow-x: auto; border-top: 1px solid var(--tc-border-default); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-normal); letter-spacing: normal; white-space: pre; scrollbar-width: thin; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__diff { padding: var(--tc-space-2) 0 var(--tc-space-0-5); overflow-x: auto; border-top: 0.5px solid var(--tc-border-default); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-normal); letter-spacing: normal; white-space: pre; scrollbar-width: thin; }
.ui-rvc__line { display: flex; min-width: max-content; color: var(--tc-text-primary); }
.ui-rvc__line[data-diff="add"] { background: var(--tc-review-center-diff-add-bg); }
.ui-rvc__line[data-diff="del"] { background: var(--tc-review-center-diff-del-bg); }
.ui-rvc__ln { position: relative; flex: none; min-width: 5ch; padding: 0 1ch 0 2ch; color: var(--tc-review-center-code-dim); text-align: right; font-variant-numeric: tabular-nums; user-select: none; }
.ui-rvc__sign { position: absolute; left: 4px; font-size: var(--tc-font-size-xs); }
.ui-rvc__line[data-diff="add"] .ui-rvc__sign { color: var(--tc-status-success-fg); }
.ui-rvc__line[data-diff="del"] .ui-rvc__sign { color: var(--tc-status-danger-fg); }
.ui-rvc__src { padding: 0 1ch; }
.ui-rvc__hunk { display: block; padding: 0 1ch 0 6ch; color: var(--tc-review-center-code-dim); }
[data-ui="rvc"] [data-tok="kw"] { color: var(--tc-review-center-tok-kw); }
[data-ui="rvc"] [data-tok="str"] { color: var(--tc-review-center-tok-str); }
[data-ui="rvc"] [data-tok="fn"] { color: var(--tc-review-center-tok-fn); }
[data-ui="rvc"] [data-tok="type"] { color: var(--tc-review-center-tok-type); }
[data-ui="rvc"] [data-tok="com"] { color: var(--tc-review-center-code-dim); }
.ui-rvc__line .ui-rvc__flag { padding: 1px 1px; margin: 0; }
.ui-rvc__line .ui-rvc__flag [data-tok] { color: inherit; }
/* A plan: numbered steps with the tool each one calls; a flagged step's number turns amber */
.ui-rvc__steps { display: grid; gap: var(--tc-space-3); list-style: none; }
.ui-rvc__step { display: grid; grid-template-columns: 22px minmax(0, 1fr); column-gap: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__step-n { display: grid; place-items: center; width: 22px; height: 22px; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1px var(--tc-border-strong); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__step[data-flagged] .ui-rvc__step-n { background: var(--tc-review-center-flag-bg); box-shadow: inset 0 0 0 1px var(--tc-review-center-flag-edge); color: var(--tc-review-center-flag-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__step-n { display: grid; place-items: center; width: 22px; height: 22px; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 0.5px var(--tc-border-strong); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__step[data-flagged] .ui-rvc__step-n { background: var(--tc-review-center-flag-bg); box-shadow: inset 0 0 0 0.5px var(--tc-review-center-flag-edge); color: var(--tc-review-center-flag-ink); }
.ui-rvc__step-main { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-2-5); min-width: 0; padding-top: 1px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__step-title { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__step-title { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
.ui-rvc__step-tool { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); white-space: nowrap; }
.ui-rvc__step-detail { width: 100%; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); }
/* A span the agent isn't sure about: a warm tint with a hairline underline – brighter while its note shows */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__flag { padding: 1px var(--tc-space-0-5); margin: 0 -1px; border-radius: var(--tc-radius-xs); background: var(--tc-review-center-flag-bg); box-shadow: inset 0 -1.5px 0 var(--tc-review-center-flag-edge); color: var(--tc-review-center-flag-ink); cursor: help; -webkit-box-decoration-break: clone; box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__flag:is(:hover, [data-on]) { background: var(--tc-review-center-flag-hot); box-shadow: inset 0 0 0 1px var(--tc-review-center-flag-edge); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__ins { padding: 1px var(--tc-space-0-5); margin: 0 -1px; border-radius: var(--tc-radius-xs); background: var(--tc-review-center-ins-bg); color: var(--tc-status-success-fg); text-decoration: none; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
/* Editing: the text field sits on a mirror that marks what changed; the ring is the only frame */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__editor { display: grid; margin: -6px -8px; border-radius: var(--tc-radius-lg); box-shadow: var(--tc-field-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__editor > * { grid-area: 1 / 1; padding: var(--tc-space-1-5) var(--tc-space-2); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); white-space: pre-wrap; overflow-wrap: anywhere; }
/* A span the agent isn't sure about: a warm tint with a hairline underline – brighter while its note shows */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__flag { padding: 1px var(--tc-space-0-5); margin: 0 -1px; border-radius: var(--tc-radius-2xs); background: var(--tc-review-center-flag-bg); box-shadow: inset 0 -1px 0 var(--tc-review-center-flag-edge); color: var(--tc-review-center-flag-ink); cursor: help; -webkit-box-decoration-break: clone; box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__flag:is(:hover, [data-on]) { background: var(--tc-review-center-flag-hot); box-shadow: inset 0 0 0 0.5px var(--tc-review-center-flag-edge); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__ins { padding: 1px var(--tc-space-0-5); margin: 0 -1px; border-radius: var(--tc-radius-2xs); background: var(--tc-review-center-ins-bg); color: var(--tc-status-success-fg); text-decoration: none; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
/* Editing: the text field sits on a mirror that marks what changed; the ring is the only frame */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__editor { display: grid; margin: -6px -8px; border-radius: var(--tc-radius-md); box-shadow: var(--tc-field-shadow); }
/* The editor's focus is on its frame (the textarea itself draws none) */
.ui-rvc__editor:focus-within { box-shadow: var(--tc-field-shadow-focus); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__editor > * { grid-area: 1 / 1; padding: var(--tc-space-1-5) var(--tc-space-2); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-rvc__body[data-format="code"] .ui-rvc__editor > * { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); letter-spacing: 0; }
.ui-rvc__mirror { color: transparent; }
/* No padding here – the mirror has to wrap exactly like the field; the tint reaches out with a shadow */
.ui-rvc__mirror .ui-rvc__ins { padding: 0; margin: 0; color: transparent; box-shadow: 0 0 0 2px var(--tc-review-center-ins-bg); }
.ui-rvc__editor textarea { width: 100%; height: 100%; overflow: hidden; resize: none; color: var(--tc-text-primary); caret-color: var(--tc-accent-text); outline: none; }
.ui-rvc__editor textarea:focus-visible { outline: none; }
.ui-rvc__input { width: 100%; min-width: 120px; height: 24px; margin: 0 -6px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-field-bg-sunken); box-shadow: var(--tc-field-shadow); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rvc__input:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-rvc__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2-5) var(--tc-space-4); }
/* Sources: plain words with their marks – no chips */
.ui-rvc__sources { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3-5); min-width: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__source { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); white-space: nowrap; text-decoration: none; transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__source { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); white-space: nowrap; text-decoration: none; transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
a.ui-rvc__source:hover { color: var(--tc-text-primary); }
.ui-rvc__source-icon { display: grid; place-items: center; width: 14px; height: 14px; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__source-icon > svg { width: 13px; height: 13px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__empty { display: grid; place-content: center; justify-items: center; gap: var(--tc-space-1); min-height: 100%; padding: var(--tc-space-12) var(--tc-space-6); text-align: center; animation: ui-rvc-in var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-quick) backwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__source-icon > svg { width: 12px; height: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__empty { display: grid; place-content: center; justify-items: center; gap: var(--tc-space-0-5); min-height: 100%; padding: var(--tc-space-12) var(--tc-space-6); text-align: center; animation: ui-rvc-in var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-quick) backwards; }
.ui-rvc__empty[data-after] { animation-delay: calc(var(--d) + var(--tc-duration-quick)); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__empty-mark { display: grid; place-items: center; width: 44px; height: 44px; margin-bottom: var(--tc-space-2); border-radius: var(--tc-radius-xl); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); box-shadow: inset 0 0 0 1px var(--tc-review-center-low-edge); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__empty b { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-strong); }
.ui-rvc__empty > span:last-child { max-width: 280px; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); text-wrap: balance; }
/* The agent's note on a flagged span */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__tip { position: absolute; top: 0; left: 0; z-index: 6; display: grid; gap: var(--tc-space-1); width: min(300px, calc(100% - 20px)); padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3); border-radius: var(--tc-menu-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); transform-origin: var(--x, 50%) bottom; animation: ui-rvc-tip var(--tc-duration-base) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__empty-mark { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: var(--tc-space-2-5); border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); color: var(--tc-status-success-fg); box-shadow: var(--tc-shadow-raised), 0 0 0 4px var(--tc-status-success-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__empty b { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); color: var(--tc-text-strong); }
/* The agent's note on a flagged span */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__tip { position: absolute; top: 0; left: 0; z-index: 6; display: grid; gap: var(--tc-space-0-5); width: min(300px, calc(100% - 20px)); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-menu-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); transform-origin: var(--x, 50%) bottom; animation: ui-rvc-tip var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-rvc__tip[data-side="below"] { transform-origin: var(--x, 50%) top; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__tip-head { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); color: var(--tc-status-warning-fg); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__tip p { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-wrap: pretty; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__tip-source { justify-self: start; margin-top: var(--tc-space-0-5); padding: 1px var(--tc-space-2); border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
/* ----- The actions ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__actions { position: relative; display: flex; flex: none; align-items: center; gap: var(--tc-space-3); min-height: 60px; padding: var(--tc-space-3) var(--tc-space-4); border-top: 1px solid var(--tc-border-default); background: var(--tc-surface-raised); }
.ui-rvc__btns { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); min-width: 0; animation: ui-rvc-swap var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-rvc__btn { display: inline-flex; align-items: center; height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: transform var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn { gap: var(--tc-space-2); padding: 0 7px 0 var(--tc-control-px-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn > svg { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__tip-head { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-status-warning-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__tip-head > svg { width: 12px; height: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__tip p { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-wrap: pretty; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__tip-source { justify-self: start; margin-top: var(--tc-space-1); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
/* ----- The actions ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__actions { position: relative; display: flex; flex: none; align-items: center; gap: var(--tc-space-3); min-height: 52px; padding: var(--tc-space-3) var(--tc-space-4); border-top: 0.5px solid var(--tc-border-default); background: var(--tc-surface-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn { gap: var(--tc-space-1-5); padding: 0 var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn > svg { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn > span { margin-right: var(--tc-space-0-5); }
.ui-rvc__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn[data-primary] { padding-left: var(--tc-space-3); }
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
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__why-label { margin-right: var(--tc-space-0-5); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rvc__reason { display: inline-flex; align-items: center; height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: transform var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__reason { gap: var(--tc-space-2); padding: 0 var(--tc-space-3) 0 var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__reason:hover { box-shadow: inset 0 0 0 1px var(--tc-review-center-high-edge); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__reason[data-pressed] { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 1px var(--tc-review-center-high-edge); color: var(--tc-status-danger-fg); }
.ui-rvc__cancel { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); font-weight: var(--tc-control-font-weight); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__why-label { margin-right: var(--tc-space-0-5); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__reason { gap: var(--tc-space-1-5); padding: 0 var(--tc-space-2-5) 0 var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__reason:hover { box-shadow: inset 0 0 0 0.5px var(--tc-review-center-high-edge), var(--tc-action-secondary-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__reason[data-pressed] { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 0.5px var(--tc-review-center-high-edge); color: var(--tc-status-danger-fg); }
.ui-rvc__cancel:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* Undo: a small chip on the tray for a few seconds, right of how far you are */
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__undo { display: flex; flex: 0 1 auto; align-items: center; gap: var(--tc-space-0-5); min-width: 0; height: 30px; margin-left: auto; padding: 0 var(--tc-space-0-5) 0 var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-surface-sunken); animation: ui-rvc-chip-in var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__undo-text { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* Undo: a small chip in the bar for a few seconds, right of how far you are */
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__undo { display: flex; flex: 0 1 auto; align-items: center; gap: var(--tc-space-0-5); min-width: 0; height: 28px; margin-left: auto; padding: 0 0 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); animation: ui-rvc-chip-in var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__undo-text { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-rvc__undo { max-width: 55cqi; }
.ui-rvc__undo[data-leaving] { animation: ui-rvc-chip-out ${EXIT}ms var(--tc-ease-standard) forwards; }
.ui-rvc__undo-text > svg { width: 14px; height: 14px; color: var(--tc-review-center-tone-fg); }
.ui-rvc__undo[data-pending] .ui-rvc__undo-text > svg { opacity: 0.5; }
.ui-rvc__undo[data-error] .ui-rvc__undo-text { color: var(--tc-status-danger-fg); }
.ui-rvc__undo[data-error] .ui-rvc__undo-text > svg { color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__undo-btn { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); margin-left: var(--tc-space-1-5); padding: 0 var(--tc-space-1) 0 var(--tc-space-2); border-radius: var(--tc-radius-full); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-primary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__undo-btn { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); margin-left: var(--tc-space-1); padding: 0 var(--tc-space-1) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-strong); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rvc__undo-btn:hover { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__undo-btn > svg { color: var(--tc-text-muted); }
/* ----- Medium: a slimmer queue ----- */
@container ui-rvc (max-width: 820px) {
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__card { --tc-review-center-queue: 272px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__detail { padding: var(--tc-space-4-5) var(--tc-space-5) var(--tc-space-5); }
}
@container ui-rvc (max-width: 740px) {
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn .ui-rvc__kbd { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn { padding-right: var(--tc-space-3); }
}
/* ----- Narrow: the queue on top, three rows high, the item under it ----- */
@container ui-rvc (max-width: 639px) {
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__card { display: flex; flex-direction: column; height: auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__queue { border-right: 0; border-bottom: 1px solid var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__list { flex: none; height: calc(3 * (var(--tc-review-center-row) + 4px) + 16px); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__stage { flex: none; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__detail { gap: var(--tc-space-3-5); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-4-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__actions { flex-wrap: wrap; padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btns { flex: 1; flex-wrap: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btns > .ui-rvc__btn { flex: 1; justify-content: center; padding: 0 var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btns[role="group"] { flex-wrap: wrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__reason { flex: 1 1 40%; justify-content: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__why-label { width: 100%; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__empty { min-height: 220px; padding: 36px var(--tc-space-5); }
}
/* Phones: the type tag steps aside in the item, the button labels get the room */
@container ui-rvc (max-width: 420px) {
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn > svg { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__filter { gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__undo-btn .ui-rvc__kbd { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__sources { width: 100%; }
}
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__undo-btn > svg { color: var(--tc-icon-muted); }
/* ----- Medium: a slimmer queue ----- */
@container ui-rvc (max-width: 820px) {
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__card { --tc-review-center-queue: 268px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__detail { padding: var(--tc-space-4-5) var(--tc-space-5) var(--tc-space-5); }
}
@container ui-rvc (max-width: 740px) {
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn .ui-rvc__kbd { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn { padding-right: var(--tc-space-2-5); }
}
/* ----- Narrow: the queue on top, three rows high, the item under it ----- */
@container ui-rvc (max-width: 639px) {
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__card { display: flex; flex-direction: column; height: auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__queue { border-right: 0; border-bottom: 0.5px solid var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__list { flex: none; height: calc(3 * (var(--tc-review-center-row) + 2px) + 16px); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__stage { flex: none; overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__detail { gap: var(--tc-space-3-5); padding: var(--tc-space-4) var(--tc-space-3-5) var(--tc-space-4-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__actions { flex-wrap: wrap; padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btns { flex: 1; flex-wrap: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btns > .ui-rvc__btn { flex: 1; justify-content: center; padding: 0 var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btns[role="group"] { flex-wrap: wrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__reason { flex: 1 1 40%; justify-content: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__why-label { width: 100%; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__empty { min-height: 220px; padding: 36px var(--tc-space-5); }
}
/* Phones: the type tag steps aside in the item, the button labels get the room */
@container ui-rvc (max-width: 420px) {
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn > svg { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__filter { gap: var(--tc-space-1); }
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
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rvc"] .ui-rvc__kbd { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rvc__btn { padding-right: var(--tc-space-3); }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rvc"] .ui-rvc__kbd { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-rvc__btn { padding-right: var(--tc-space-2-5); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rvc"] *, [data-ui="rvc"] *::before, [data-ui="rvc"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-review-center")) customElements.define("tc-review-center", TcReviewCenter);

declare global {
  interface HTMLElementTagNameMap {
    "tc-review-center": TcReviewCenter;
  }
}

import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, rescueFocus } from "./internal/controllers";

/*
 * <tc-decision-tree> – the Lit port of src/components/decision-tree.tsx: an agent that is stuck on a decision lays it
 * out as a tree. A white card on a soft gray tray, the header on top: how many decisions wait and where you are.
 *   · on the left the question, with the agent, its model and how risky the call is
 *   · from it the options as branches, each with what it leads to – the agent's own pick marked
 *   · risky consequences are marked – point at one (or press F) for the agent's note and its source
 *   · a branch can lead to a follow-up question with its own options – the agent's pick runs through both levels
 *   · options carry the logo of the tool they run with, consequences the logos of the systems they touch
 *   · pick one (click or 1–4) and the others fade, the path draws on to its outcome and the next decision grows in
 *   · "Other…" opens a field that grows with what you write – your own instruction, Enter sends it
 * Narrow containers draw the tree top to bottom. Clean is one quiet white card with hairlines, the header its first row.
 *
 *   <tc-decision-tree heading="Waiting on you" .decisions=${decisions} .onChoose=${(d, choice) => api.answer(d, choice)}>
 *   </tc-decision-tree>
 *
 * `onChoose` gets each pick or instruction – return the agent's short answer to an instruction (or a promise of it);
 * a promise holds the picked path until it settles, a rejection lets go of the pick and says so. The decision on show
 * changes with a cancelable `tc-decision-change` ({ decision }): call preventDefault() to control `decision`. The
 * methods hover(), choose(), setOther(), send(), next(), previous() and peek() drive it from outside.
 */

export type DecisionRisk = "high" | "medium" | "low";

/** A part of a consequence the agent isn't sure about – marked, its note shows on hover */
export type DecisionFlag = { text: string; note: string; source?: string };
/** Plain text, or text with flagged parts in it */
export type DecisionText = string | (string | DecisionFlag)[];

export type TreeDecisionOption = {
  /** What to do, in a few words – e.g. "Roll back to #481" */
  label: string;
  /** The tool it runs with – a small logo element before the label (cloned) */
  icon?: Element;
  /** What it leads to, one line each – e.g. "Refunds $147 · not reversible" */
  effects?: DecisionText[];
  /** The systems it touches – small logo elements beside its consequences (cloned) */
  apps?: Element[];
  /** The agent's own preference – marked "Agent's pick" */
  pick?: boolean;
  /** A follow-up question this branch leads to – picked right after it. One level deep: its options end the path */
  next?: TreeDecisionStep;
};

/** A follow-up question with two to four options */
export type TreeDecisionStep = { question: string; options: TreeDecisionOption[] };

export type TreeDecision = {
  id: string;
  /** The question, in one sentence */
  question: string;
  /** A line of context under it */
  context?: string;
  /** Who asks, e.g. "Billing agent" */
  agent: string;
  /** The model behind the agent – shown under its name */
  model?: string;
  /** A small mark element, e.g. the model maker's logo (cloned) – defaults to the agent's initial */
  icon?: Element;
  /** High and medium show as a small tag next to the agent */
  risk?: DecisionRisk;
  /** Two to four options */
  options: TreeDecisionOption[];
};

/** What you chose: one of the options, or your own instruction */
export type TreeDecisionChoice = { index: number; option: TreeDecisionOption; then?: { index: number; option: TreeDecisionOption } } | { other: string };
export type DecisionTreeChange = { decision: string };

const RISK: Record<DecisionRisk, string> = { high: "High risk", medium: "Medium risk", low: "Low risk" };
/** Motion: how long the picked path shows its outcome, and how long the tree takes to fade */
const HOLD = 1500;
const ANSWER_HOLD = 2600;
const FADE = 280;
const partsOf = (t?: DecisionText): (string | DecisionFlag)[] => (t === undefined ? [] : typeof t === "string" ? [t] : t);

type Link = { id: string; d: string; b: number; s?: number; kind: "branch" | "leaf" | "sub" | "out" };
/** `j` is the pick in the follow-up – a branch with a follow-up waits for it */
type Picked = { id: string; i: number; j?: number; other?: string; answer?: string; leaving?: boolean };
/** Every consequence in the order it shows – the flagged parts are numbered in this order */
const effectsOf = (d: TreeDecision) => d.options.flatMap((o) => (o.next ? o.next.options.flatMap((s) => s.effects ?? []) : (o.effects ?? [])));

/* ---------- Icons (check, triangle-alert and badge-check: Lucide, ISC, lucide.dev) ---------- */

const tick = html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M20 6 9 17l-5-5"></path>`}</svg>`;
const alert = html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4" stroke-width="2"></path><path d="M12 17h.01" stroke-width="2.4"></path>`}</svg>`;
/* A small branching mark for the title (drawn for Trenchcoat) */
/** A fork: one question, branching into its options (Lucide git-fork, ISC) */
const branches = svg`<circle cx="12" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="6" r="3"></circle><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"></path><path d="M12 12v3"></path>`;
const badge = html`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path><path d="m16 9-5.5 5.5L8 12"></path>`}</svg>`;
const chevron = (d: string) =>
  html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

let instances = 0;

/**
 * An agent's open decision drawn as a tree of options and consequences – pick a path or write your own instruction.
 * @tag tc-decision-tree
 * @fires tc-decision-change - The decision on show changes (paging, or the shown one was decided); detail `{ decision: string }`. Cancelable: prevent it to control `decision`
 */
export class TcDecisionTree extends TcElement {
  static override ui = "dct";

  /** Everything waiting for a call – decided ones leave on their own, new ids join at the end */
  @property({ attribute: false }) accessor decisions: TreeDecision[] = [];
  /** The id of the decision on show – unset shows the first */
  @property() accessor decision: string | undefined = undefined;
  /**
   * A branch was picked or an instruction written – return the agent's short answer to an instruction (or a promise
   * of it). A promise holds the picked path until it settles; a rejection lets go of the pick and says so
   */
  @property({ attribute: false }) accessor onChoose: ((decision: TreeDecision, choice: TreeDecisionChoice) => string | void | Promise<string | void>) | undefined = undefined;
  /** Shows the "Other…" branch; allow-other="false" hides it */
  @property({ attribute: "allow-other", converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor allowOther = true;
  /** The heading in the bar, before how many decisions wait */
  @property() accessor heading = "Decisions";

  /** @internal */
  @state() private accessor done: Record<string, true> = {};
  @state() private accessor hovered: number | null = null;
  @state() private accessor picked: Picked | null = null;
  @state() private accessor otherOpen = false;
  @state() private accessor other = "";
  @state() private accessor peeked: number | null = null;
  @state() private accessor hoverFlag: number | null = null;
  @state() private accessor pressed: string | null = null;
  @state() private accessor said = "";
  /** @internal The last "Other…" instruction couldn't be sent – the field stays open with it, to try again */
  @state() private accessor failed = false;
  /** @internal The last branch pick was rejected – the branches are open again */
  @state() private accessor pickFailed = false;
  /** @internal Narrow containers draw the tree top to bottom */
  @state() private accessor narrow = false;
  @state() private accessor links: Link[] = [];
  @state() private accessor size = { w: 0, h: 0 };

  private readonly uid = `tc-dct${++instances}`;
  private lastIndex = 0;
  private lastCurrent: string | undefined = undefined;
  private reported: string | undefined = undefined;
  private timers: number[] = [];
  private frames = new Set<number>();
  private alive = false;
  /** The pointer is on the note itself – it stays open */
  private onTip = false;
  private ro?: ResizeObserver;
  private linksRo?: ResizeObserver;
  private linksKey = "";
  private growKey = "";
  private tipKey = "";

  constructor() {
    super();
    // Focus never drops to <body>: a picked option is disabled while its follow-up opens – focus goes to the
    // follow-up's first option, otherwise to the card
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-dct__sub[data-asking] .ui-dct__sopt:not(:disabled)") ?? this);
    this.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("mousedown", this.onMouseDown);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.alive = true;
    if (!this.hasAttribute("tabindex")) this.tabIndex = -1;
    if (typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(() => (this.narrow = this.clientWidth < 640));
      this.ro.observe(this);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.alive = false;
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    this.frames.forEach((f) => cancelAnimationFrame(f));
    this.frames.clear();
    this.ro?.disconnect();
    this.linksRo?.disconnect();
    this.linksRo = undefined;
    this.linksKey = "";
    document.removeEventListener("keydown", this.onDocKey);
  }

  /** @internal Timers that end with the element */
  private later(fn: () => void, ms: number) {
    this.timers.push(window.setTimeout(fn, ms));
  }
  /** @internal */
  private frame(fn: () => void) {
    const f = requestAnimationFrame(() => {
      this.frames.delete(f);
      fn();
    });
    this.frames.add(f);
  }

  /* ---------- What's on show ---------- */

  /** @internal The decisions still waiting */
  private get list() {
    return this.decisions.filter((d) => !this.done[d.id]);
  }
  /** @internal */
  private get index() {
    const list = this.list;
    const found = list.findIndex((d) => d.id === this.decision);
    return found >= 0 ? found : Math.min(this.lastIndex, list.length - 1);
  }
  /** @internal */
  private get current(): TreeDecision | undefined {
    const i = this.index;
    return i >= 0 ? this.list[i] : undefined;
  }
  /** @internal A branch with a follow-up is picked, its follow-up waits */
  private get waiting() {
    const current = this.current;
    const p = this.picked;
    return current && p?.id === current.id && p.other === undefined && p.j === undefined ? current.options[p.i]?.next : undefined;
  }
  /** @internal */
  private get flags() {
    const current = this.current;
    return current ? effectsOf(current).flatMap((e) => partsOf(e)).filter((p): p is DecisionFlag => typeof p !== "string") : [];
  }

  private setDecision(id: string) {
    if (id === this.decision || id === this.reported) return;
    this.reported = id;
    if (this.emit<DecisionTreeChange>("tc-decision-change", { decision: id }, { cancelable: true })) this.decision = id;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("decision")) this.reported = undefined;
    const current = this.current;
    // A fresh decision starts clean
    if (current?.id !== this.lastCurrent) {
      this.lastCurrent = current?.id;
      this.hovered = null;
      this.picked = null;
      this.otherOpen = false;
      this.other = "";
      this.peeked = null;
      this.hoverFlag = null;
      this.failed = false;
      this.pickFailed = false;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const current = this.current;
    this.lastIndex = Math.max(0, this.index);
    // The shown one was decided or isn't there: whatever shows now is reported
    if (current && current.id !== this.decision) this.setDecision(current.id);
    // A note opened by pointing closes with Escape wherever the focus is (WCAG 1.4.13)
    if (this.hoverFlag !== null) document.addEventListener("keydown", this.onDocKey);
    else document.removeEventListener("keydown", this.onDocKey);
    this.measureLinks();
    this.growField();
    this.placeTip();
  }

  /* ---------- Layout: the lines, the growing field, the note ---------- */

  /**
   * The lines: question to branches, branches to consequences, the pick to its outcome. Measured when the tree
   * changes (another decision, a pick, "Other…" opening, the layout flipping) and whenever a card changes size
   */
  private measureLinks() {
    const current = this.current;
    const clean = this.resolvedLook === "clean";
    const key = `${current?.id}|${JSON.stringify(this.picked)}|${this.narrow}|${clean}|${this.allowOther}|${this.otherOpen}`;
    if (key === this.linksKey) return;
    this.linksKey = key;
    this.linksRo?.disconnect();
    this.linksRo = undefined;
    const box = this.querySelector<HTMLElement>(".ui-dct__tree");
    if (!box || !current) return;
    const { narrow, allowOther, picked } = this;
    const measure = () => {
      // Offsets up to the page, minus the box's own – they ignore transforms, so the lines land where the cards settle
      const page = (el: HTMLElement) => {
        let l = 0;
        let t = 0;
        for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) {
          l += e.offsetLeft;
          t += e.offsetTop;
        }
        return { l, t };
      };
      const origin = page(box);
      const el = (k: string) => box.querySelector<HTMLElement>(`[data-k="${k}"]`);
      const R = (k: string) => {
        const e = el(k);
        // Folded away (narrow: a follow-up that isn't its turn yet) – no line to it. Standard checks only the
        // follow-up's own cards
        if (!e || ((clean || k.startsWith("s")) && !e.offsetParent)) return null;
        const p = page(e);
        const l = p.l - origin.l;
        const t = p.t - origin.t;
        return { l, t, r: l + e.offsetWidth, b: t + e.offsetHeight, h: e.offsetHeight };
      };
      const C = 8;
      // Wide: out of the right edge, a right-angled turn with small rounded corners, into the left edge
      const across = (x1: number, y1: number, x2: number, y2: number) => {
        const dy = y2 - y1;
        if (Math.abs(dy) < 2) return `M${x1} ${y1}H${x2}`;
        const mid = Math.round(x1 + (x2 - x1) / 2);
        const r = Math.min(C, Math.abs(dy) / 2, (x2 - x1) / 2);
        const sg = Math.sign(dy);
        return `M${x1} ${y1}H${mid - r}Q${mid} ${y1} ${mid} ${y1 + sg * r}V${y2 - sg * r}Q${mid} ${y2} ${mid + r} ${y2}H${x2}`;
      };
      // Narrow: down a rail on the left, a rounded corner, into the card's side
      const hang = (x1: number, y1: number, x2: number, y2: number) => {
        if (x2 - x1 < 2) return `M${x1} ${y1}V${y2}`;
        const r = Math.min(C, (y2 - y1) / 2, (x2 - x1) / 2);
        return `M${x1} ${y1}V${y2 - r}Q${x1} ${y2} ${x1 + r} ${y2}H${x2}`;
      };
      const root = R("root");
      if (!root) return;
      const next: Link[] = [];
      const n = current.options.length + (allowOther ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const o = R(`opt:${i}`);
        if (!o) continue;
        // "Other…" is met at its first line, so it can grow downwards without dragging its line along
        const isOther = i === current.options.length;
        const oc = isOther ? o.t + 18 : o.t + o.h / 2;
        next.push({ id: `b${i}`, b: i, kind: "branch", d: narrow ? hang(root.l + 18, root.b, o.l, o.t + Math.min(18, o.h / 2)) : across(root.r, root.t + root.h / 2, o.l, oc) });
        const lf = R(`leaf:${i}`) ?? R(`subq:${i}`);
        if (lf) next.push({ id: `l${i}`, b: i, kind: "leaf", d: narrow ? hang(o.l + 16, o.b, lf.l, lf.t + Math.min(14, lf.h / 2)) : across(o.r, o.t + o.h / 2, lf.l, lf.t + lf.h / 2) });
        // A follow-up: its options hang off a rail under its question
        const sq = R(`subq:${i}`);
        const subs = current.options[i]?.next?.options ?? [];
        if (sq)
          subs.forEach((_, j) => {
            const so = R(`sopt:${i}:${j}`);
            if (so) next.push({ id: `s${i}-${j}`, b: i, s: j, kind: "sub", d: hang(sq.l + 14, sq.b, so.l, so.t + Math.min(16, so.h / 2)) });
          });
      }
      // The outcome hangs under the picked branch's last card
      const outEl = el("out");
      if (outEl && picked) {
        const from = (picked.j !== undefined ? R(`sopt:${picked.i}:${picked.j}`) : null) ?? R(`leaf:${picked.i}`) ?? R(`opt:${picked.i}`);
        if (from && picked.other !== undefined && !narrow && clean) {
          // Clean: your own instruction sits in the last row – its answer goes beside it, where the column is free
          outEl.style.left = `${from.r + 24}px`;
          outEl.style.top = `${from.t}px`;
          const oc = R("out")!;
          next.push({ id: "o", b: picked.i, kind: "out", d: across(from.r, from.t + 18, oc.l, oc.t + 18) });
        } else if (from) {
          outEl.style.left = `${from.l + 24}px`;
          outEl.style.top = `${from.b + 14}px`;
          const oc = R("out")!;
          next.push({ id: "o", b: picked.i, kind: "out", d: hang(from.l + 12, from.b, oc.l, oc.t + Math.min(16, oc.h / 2)) });
        }
      }
      if (JSON.stringify(this.links) !== JSON.stringify(next)) this.links = next;
      if (this.size.w !== box.scrollWidth || this.size.h !== box.scrollHeight) this.size = { w: box.scrollWidth, h: box.scrollHeight };
    };
    measure();
    // Every frame of a card's growth reports a new size – the lines follow it
    if (typeof ResizeObserver === "function") {
      this.linksRo = new ResizeObserver(measure);
      this.linksRo.observe(box);
      box.querySelectorAll("[data-k]").forEach((e) => this.linksRo!.observe(e));
    }
  }

  /** @internal "Other…": two lines when it opens, it grows to three, then it scrolls */
  private growField() {
    const key = `${this.other}|${this.otherOpen}|${this.narrow}|${this.picked?.id}|${this.picked?.other}`;
    if (key === this.growKey) return;
    this.growKey = key;
    const box = this.querySelector<HTMLElement>(".ui-dct__grow");
    const m = this.querySelector<HTMLElement>(".ui-dct__mirror");
    const ta = this.querySelector<HTMLTextAreaElement>(".ui-dct__input");
    if (!box || !m || !ta) return;
    const line = 20;
    const pad = 12;
    // One read (the mirror sits outside the box's flow, so its height doesn't follow the box), then the writes
    const mh = m.offsetHeight;
    const h = Math.min(Math.max(mh, 2 * line + pad), 3 * line + pad);
    // It starts at one line, so opening is the first glide down to two
    if (!box.style.height) box.style.height = `${line + pad}px`;
    this.frame(() => (box.style.height = `${h}px`));
    const over = mh > 3 * line + pad;
    ta.style.overflowY = over ? "auto" : "hidden";
    if (over) ta.scrollTop = ta.scrollHeight;
  }

  /** @internal The agent's note on a flagged part: below it, above only when there's no room under it */
  private placeTip() {
    const tipIndex = this.hoverFlag ?? this.peeked;
    const key = `${tipIndex}|${this.querySelector(".ui-dct__tip") ? this.current?.id : ""}|${this.narrow}|${this.size.w}x${this.size.h}`;
    if (key === this.tipKey) return;
    this.tipKey = key;
    const tip = this.querySelector<HTMLElement>(".ui-dct__tip");
    const body = this.querySelector<HTMLElement>(".ui-dct__body");
    const el = tipIndex !== null ? this.querySelector<HTMLElement>(`.ui-dct__tree mark[data-flag="${tipIndex}"]`) : null;
    if (!tip || !body || !el) return;
    const b = body.getBoundingClientRect();
    const scale = body.offsetWidth ? b.width / body.offsetWidth : 1;
    const lines = el.getClientRects();
    const r = lines[0] ?? el.getBoundingClientRect();
    const rEnd = lines[lines.length - 1] ?? r;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const top = (r.top - b.top) / scale;
    const bottom = (rEnd.bottom - b.top) / scale;
    const center = (r.left + r.width / 2 - b.left) / scale;
    // Below the part by default – above only when there's no room under it
    const above = bottom + 8 + h > body.offsetHeight - 4 && top - h - 8 >= 4;
    const left = Math.max(10, Math.min(center - w / 2, body.offsetWidth - w - 10));
    tip.style.top = `${above ? top - h - 8 : bottom + 8}px`;
    tip.style.left = `${left}px`;
    tip.style.setProperty("--x", `${center - left}px`);
    tip.dataset.side = above ? "above" : "below";
  }

  /* ---------- Actions ---------- */

  private flash(name: string) {
    this.pressed = name;
    this.later(() => {
      if (this.pressed === name) this.pressed = null;
    }, 220);
  }
  /** @internal The picked path holds a moment with its outcome, the tree fades, the next one grows in */
  private finish(d: TreeDecision, hold: number) {
    const fade = reducedMotion() ? 0 : FADE;
    this.later(() => {
      const p = this.picked;
      if (p && p.id === d.id) this.picked = { ...p, leaving: true };
    }, hold);
    this.later(() => {
      this.done = { ...this.done, [d.id]: true };
      if (this.contains(document.activeElement)) this.frame(() => this.focus({ preventScroll: true }));
    }, hold + fade);
  }
  /** @internal A pick is passed on: a promise holds the path until it settles, a rejection lets go of the pick */
  private commit(d: TreeDecision, choice: TreeDecisionChoice, label: string) {
    this.pickFailed = false;
    const failed = () => {
      if (!this.alive) return;
      const p = this.picked;
      if (p && p.id === d.id && p.other === undefined) this.picked = null;
      this.hovered = null;
      this.pickFailed = true;
      this.said = `Couldn't pass “${label}” to the ${d.agent.toLowerCase()} – pick again.`;
    };
    let result: ReturnType<NonNullable<TcDecisionTree["onChoose"]>>;
    try {
      result = this.onChoose?.(d, choice);
    } catch {
      return failed();
    }
    if (result && typeof (result as Promise<unknown>).then === "function") (result as Promise<unknown>).then(() => this.alive && this.finish(d, HOLD), failed);
    else this.finish(d, HOLD);
  }

  /** Picks the n-th option – or, after a pick, the n-th option of its follow-up; the index after the last option opens "Other…" */
  choose(i: number) {
    const d = this.current;
    if (!d) return;
    const waiting = this.waiting;
    const picked = this.picked;
    if (waiting && picked) {
      const s = waiting.options[i];
      if (!s) return;
      this.flash(`sopt:${picked.i}:${i}`);
      this.hovered = null;
      this.peeked = null;
      this.picked = { ...picked, j: i };
      this.said = `${s.label} – picked. ${d.agent} goes ahead.`;
      this.commit(d, { index: picked.i, option: d.options[picked.i], then: { index: i, option: s } }, s.label);
      return;
    }
    if (picked) return;
    if (this.allowOther && i === d.options.length) {
      this.flash("other");
      this.otherOpen = true;
      this.hovered = i;
      this.frame(() => this.querySelector<HTMLElement>(".ui-dct__input")?.focus({ preventScroll: true }));
      return;
    }
    const o = d.options[i];
    if (!o) return;
    this.flash(`opt:${i}`);
    this.hovered = null;
    this.peeked = null;
    this.pickFailed = false;
    this.picked = { id: d.id, i };
    if (o.next) {
      this.said = `${o.label} – picked. Next: ${o.next.question}`;
      return;
    }
    this.said = `${o.label} – picked. ${d.agent} goes ahead.`;
    this.commit(d, { index: i, option: o }, o.label);
  }

  /** Sends the "Other…" field */
  send() {
    const text = this.other.trim();
    const d = this.current;
    if (!d || !text || this.picked) return;
    this.flash("send");
    this.failed = false;
    this.picked = { id: d.id, i: d.options.length, other: text };
    this.said = `Sent to the ${d.agent.toLowerCase()}: ${text}`;
    // Called inside the promise chain, so a callback that throws is handled like one that rejects
    Promise.resolve()
      .then(() => this.onChoose?.(d, { other: text }))
      .then(
        (answer) => {
          if (!this.alive) return;
          this.later(() => {
            const reply = answer || "Got it – I'll take it from here.";
            const p = this.picked;
            if (p && p.id === d.id) this.picked = { ...p, answer: reply };
            this.said = `${d.agent}: ${reply}`;
          }, 700);
          this.finish(d, ANSWER_HOLD);
        },
        () => {
          if (!this.alive) return;
          // Not sent: let go of the pick, keep the instruction in the open field and say so – the user can retry
          const p = this.picked;
          if (p && p.id === d.id && p.other === text) this.picked = null;
          this.other = text;
          this.otherOpen = true;
          this.failed = true;
          this.said = `Couldn't send to the ${d.agent.toLowerCase()}. Your instruction is still there – try again.`;
          this.frame(() => this.querySelector<HTMLElement>(".ui-dct__input")?.focus({ preventScroll: true }));
        },
      );
  }

  private move(step: number) {
    const list = this.list;
    if (list.length < 2 || !this.current || this.picked) return;
    this.setDecision(list[(this.index + step + list.length) % list.length].id);
  }

  /** Lights up the n-th branch (or, after a pick, the n-th option of its follow-up) as if pointed at – null lets go */
  hover(index: number | null) {
    if (!this.picked || this.waiting) this.hovered = index;
  }
  /** Fills the "Other…" field */
  setOther(text: string) {
    if (!this.otherOpen) this.otherOpen = true;
    this.other = text;
  }
  /** Shows the next decision */
  next() {
    this.move(1);
  }
  /** Shows the previous decision */
  previous() {
    this.move(-1);
  }
  /** Shows the note of the n-th flagged part – null hides it */
  peek(index: number | null) {
    this.peeked = index;
  }

  // Pointing at a flagged part shows its note; leaving it closes the note unless the pointer moved onto the note
  private flagEnter(i: number) {
    this.onTip = false;
    this.hoverFlag = i;
  }
  private flagLeave(i: number) {
    this.later(() => {
      if (!this.onTip && this.hoverFlag === i) this.hoverFlag = null;
    }, 150);
  }
  private tipEnter = () => {
    this.onTip = true;
  };
  private tipLeave = () => {
    this.onTip = false;
    this.hoverFlag = null;
  };
  private cycleFlag() {
    const n = this.flags.length;
    if (!n) return;
    const p = this.peeked;
    this.peeked = p === null ? 0 : p + 1 >= n ? null : p + 1;
  }

  private onDocKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    this.hoverFlag = null;
    this.peeked = null;
  };

  /* ---------- Keyboard: numbers pick, arrows move, while the focus is anywhere inside ---------- */

  private onKeyDown = (e: KeyboardEvent) => {
    const current = this.current;
    if (e.defaultPrevented || e.isComposing || !current) return;
    if ((e.target as HTMLElement).closest("textarea, input")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const run = (fn: () => void) => {
      e.preventDefault();
      fn();
    };
    const waiting = this.waiting;
    const n = Number(e.key);
    const count = waiting ? waiting.options.length : current.options.length + (this.allowOther ? 1 : 0);
    if (n >= 1 && n <= count) return run(() => this.choose(n - 1));
    const keys: Record<string, () => void> = {
      arrowright: () => this.move(1),
      j: () => this.move(1),
      arrowleft: () => this.move(-1),
      k: () => this.move(-1),
      f: () => this.cycleFlag(),
      escape: () => {
        if (this.peeked !== null || this.hoverFlag !== null) {
          this.peeked = null;
          this.hoverFlag = null;
        } else this.otherOpen = false;
      },
    };
    const fn = keys[e.key.toLowerCase()];
    if (fn) run(fn);
  };

  private onMouseDown = (e: MouseEvent) => {
    // A click on plain content keeps the keys working
    if (!(e.target as HTMLElement).closest("button, a, input, textarea, mark")) this.frame(() => this.focus({ preventScroll: true }));
  };

  private onOtherKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      // The field goes away: hold focus on the card until the "Other…" button is back
      rescueFocus(e.currentTarget as HTMLElement, [this]);
      this.otherOpen = false;
      this.hovered = null;
      // Back to the "Other…" button it opened from (the card if that's gone)
      this.frame(() => (this.querySelector<HTMLElement>(".ui-dct__other") ?? this).focus({ preventScroll: true }));
      return;
    }
    if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
    e.preventDefault();
    this.send();
  };

  /* ---------- Rendering ---------- */

  /** @internal The tree of one decision */
  private renderTree(d: TreeDecision, clean: boolean) {
    const { picked, hovered: hover, otherOpen, pressed, uid, allowOther } = this;
    const tipIndex = this.hoverFlag ?? this.peeked;
    const open = !picked || !!this.waiting;
    const counter = { n: 0 };
    const text = (t: DecisionText) =>
      partsOf(t).map((p) => {
        if (typeof p === "string") return html`<span>${p}</span>`;
        const i = counter.n++;
        const on = tipIndex === i && open;
        // Not a tab stop (it can sit inside an option button): the note travels with the text for screen readers,
        // F shows it for the keyboard and pointing at the part shows it for the pointer
        return html`<span><mark class="ui-dct__flag" data-flag=${i} ?data-on=${on} @mouseenter=${() => this.flagEnter(i)} @mouseleave=${() => this.flagLeave(i)}>${p.text}</mark><span class="ui-dct__sr">${` (the agent is unsure: ${p.note}${p.source ? ` Source: ${p.source}` : ""})`}</span></span>`;
      });

    const p = picked?.id === d.id ? picked : null;
    const otherIndex = d.options.length;
    const dim = (i: number) => (p ? p.i !== i : hover !== null && hover !== i);
    const hot = (i: number) => (p ? p.i === i : hover === i);
    // The follow-up of the picked branch: its options answer to the pointer, the keys and the pick
    const isLive = (i: number) => !!p && p.i === i && p.other === undefined;
    const sdim = (i: number, j: number) => isLive(i) && (p!.j !== undefined ? p!.j !== j : hover !== null && hover !== j);
    const shot = (i: number, j: number) => isLive(i) && (p!.j !== undefined ? p!.j === j : hover === j);
    const asking = !!p && p.other === undefined && p.j === undefined && !!d.options[p.i]?.next;
    const final = !!p && !asking;
    const apps = (list?: Element[]) =>
      list?.length ? html`<span class="ui-dct__apps" aria-hidden="true">${list.map((a) => html`<span class="ui-dct__app">${a.cloneNode(true)}</span>`)}</span>` : nothing;
    const effects = (list?: DecisionText[]) => (list ?? []).map((e) => html`<span class="ui-dct__effect">${text(e)}</span>`);
    const label = (o: TreeDecisionOption) =>
      html`<span class="ui-dct__label">${o.icon ? html`<span class="ui-dct__icon" aria-hidden="true">${o.icon.cloneNode(true)}</span>` : nothing}${o.label}</span>`;
    const risk = d.risk && d.risk !== "low" ? html`<span class="ui-dct__risk" data-risk=${d.risk}>${RISK[d.risk]}</span>` : nothing;
    const row = (i: number, content: TemplateResult, leaf: unknown) =>
      html`<div
        class="ui-dct__row"
        ?data-dim=${dim(i)}
        style=${styleMap({ "--i": String(i) })}
        @mouseenter=${() => !this.picked && (this.hovered = i)}
        @mouseleave=${() => !this.picked && !this.otherOpen && (this.hovered = null)}
      >${content}${leaf}</div>`;

    const branchRows = d.options.map((o, i) =>
      row(
        i,
        html`<button
          data-k=${`opt:${i}`}
          type="button"
          class="ui-dct__opt"
          ?data-pick=${!!o.pick}
          ?data-hot=${hot(i)}
          ?data-pressed=${pressed === `opt:${i}`}
          ?disabled=${!!p}
          aria-keyshortcuts=${String(i + 1)}
          aria-describedby=${ifDefined(o.next ? `${uid}-subq-${i}` : o.effects?.length ? `${uid}-leaf-${i}` : undefined)}
          @click=${() => this.choose(i)}
        ><kbd class="ui-dct__kbd" aria-hidden="true">${i + 1}</kbd>${label(o)}${o.pick ? html`<span class="ui-dct__pick">Agent's pick</span>` : nothing}</button>`,
        o.next
          ? // The follow-up: its question, its options hanging off a rail – quiet until this branch is picked
            html`<div class="ui-dct__sub" ?data-live=${isLive(i)} ?data-asking=${isLive(i) && asking}>
              <div data-k=${`subq:${i}`} id=${`${uid}-subq-${i}`} class="ui-dct__subq">${o.next.question}<span class="ui-dct__more">${o.next.options.length} options</span></div>
              <div class="ui-dct__subopts" role="group" aria-label=${o.next.question}>
                ${o.next.options.map((so, j) => {
                  const can = isLive(i) && asking;
                  return html`<button
                    data-k=${`sopt:${i}:${j}`}
                    type="button"
                    class="ui-dct__sopt"
                    ?data-pick=${!!(o.pick && so.pick)}
                    ?data-hot=${shot(i, j)}
                    ?data-soft=${sdim(i, j)}
                    ?data-pressed=${pressed === `sopt:${i}:${j}`}
                    style=${styleMap({ "--j": String(j) })}
                    ?disabled=${!can}
                    tabindex=${ifDefined(can ? undefined : -1)}
                    aria-keyshortcuts=${ifDefined(can ? String(j + 1) : undefined)}
                    aria-labelledby=${`${uid}-sopt-${i}-${j}`}
                    aria-describedby=${ifDefined(so.effects?.length ? `${uid}-sfx-${i}-${j}` : undefined)}
                    @mouseenter=${() => isLive(i) && asking && (this.hovered = j)}
                    @mouseleave=${() => isLive(i) && asking && (this.hovered = null)}
                    @click=${() => this.choose(j)}
                  ><span class="ui-dct__sopt-top" id=${`${uid}-sopt-${i}-${j}`}>${can ? html`<kbd class="ui-dct__kbd" aria-hidden="true">${j + 1}</kbd>` : nothing}${label(so)}${o.pick && so.pick
                    ? html`<span class="ui-dct__pick">Agent's pick</span>`
                    : nothing}</span>${so.effects?.length || so.apps?.length
                    ? html`<span class="ui-dct__sopt-effects"><span class="ui-dct__lines" id=${`${uid}-sfx-${i}-${j}`}>${effects(so.effects)}</span>${apps(so.apps)}</span>`
                    : nothing}</button>`;
                })}
              </div>
            </div>`
          : o.effects?.length || o.apps?.length
            ? html`<div data-k=${`leaf:${i}`} id=${`${uid}-leaf-${i}`} class="ui-dct__leaf">${clean || o.apps?.length
                ? html`<span class="ui-dct__lines">${effects(o.effects)}</span>${apps(o.apps)}`
                : effects(o.effects)}</div>`
            : nothing,
      ),
    );

    // Other…: your own instruction, as a prompt for the agent
    const failId = `${uid}-failed`;
    const otherRow = allowOther
      ? row(
          otherIndex,
          html`<div data-k=${`opt:${otherIndex}`} class="ui-dct__opt" data-other="" ?data-open=${otherOpen || !!p?.other} ?data-hot=${hot(otherIndex)}>${p?.other
            ? html`<span class="ui-dct__said">${p.other}</span>`
            : otherOpen
              ? html`<div class="ui-dct__grow"><span class="ui-dct__mirror" aria-hidden="true">${this.other || "Tell the agent what to do instead…"}${"​"}</span><textarea
                    class="ui-dct__input"
                    .value=${live(this.other)}
                    rows="2"
                    placeholder="Tell the agent what to do instead…"
                    aria-label=${`Your own instruction for the ${d.agent.toLowerCase()} – Enter sends, Shift+Enter for a new line`}
                    aria-invalid=${ifDefined(this.failed ? "true" : undefined)}
                    aria-describedby=${ifDefined(this.failed ? failId : undefined)}
                    @input=${(e: Event) => (this.other = (e.target as HTMLTextAreaElement).value)}
                    @keydown=${this.onOtherKey}
                  ></textarea></div>`
              : html`<button type="button" class="ui-dct__other" ?data-pressed=${pressed === "other"} ?disabled=${!!p} aria-keyshortcuts=${String(otherIndex + 1)} @click=${() => this.choose(otherIndex)}><kbd class="ui-dct__kbd" aria-hidden="true">${otherIndex + 1}</kbd><span class="ui-dct__label">Other…</span></button>`}${this.failed && !p && otherOpen
            ? html`<span id=${failId} class="ui-dct__failed">Couldn't send – press Enter to try again.</span>`
            : nothing}</div>`,
          nothing,
        )
      : nothing;

    return html`<div class="ui-dct__tree" ?data-picked=${!!p} ?data-final=${final} ?data-leaving=${!!p?.leaving}>
      <svg class="ui-dct__links" width=${this.size.w} height=${this.size.h} aria-hidden="true">${repeat(
        this.links,
        (l) => l.id,
        (l) => {
          const o = d.options[l.b];
          const sub = l.s !== undefined ? o?.next?.options[l.s] : undefined;
          const pick = l.s !== undefined ? o?.pick && sub?.pick : o?.pick;
          return svg`<path
            pathLength="1"
            d=${l.d}
            class="ui-dct__link"
            data-kind=${l.kind}
            ?data-pick=${!!pick}
            ?data-hot=${l.s !== undefined ? shot(l.b, l.s) : hot(l.b)}
            ?data-dim=${dim(l.b)}
            ?data-soft=${l.s !== undefined && sdim(l.b, l.s)}
            ?data-live=${l.s !== undefined && isLive(l.b)}
            style=${styleMap({ "--i": String(l.b), "--j": String(l.s ?? 0) })}
          ></path>`;
        },
      )}</svg>
      <div data-k="root" class="ui-dct__root">
        ${clean ? risk : nothing}
        <div class="ui-dct__who">
          <span class="ui-dct__avatar" aria-hidden="true">${d.icon ? d.icon.cloneNode(true) : d.agent.slice(0, 1)}</span>
          <span class="ui-dct__meta">${clean
            ? html`<span class="ui-dct__agent">${d.agent}</span>`
            : html`<span class="ui-dct__name"><span class="ui-dct__agent">${d.agent}</span>${risk}</span>`}${d.model ? html`<span class="ui-dct__model">${d.model}</span>` : nothing}</span>
        </div>
        <h3 class="ui-dct__q">${d.question}</h3>
        ${d.context ? html`<p class="ui-dct__context">${d.context}</p>` : nothing}
      </div>
      <div class="ui-dct__branches" role="group" aria-label="How should the agent go on?">${branchRows}${otherRow}</div>
      ${final && p
        ? html`<div data-k="out" class="ui-dct__out" data-kind=${p.other !== undefined ? "replied" : "approved"}>${p.other !== undefined
            ? html`<span class="ui-dct__out-head">${tick}Sent to the ${d.agent.toLowerCase()}</span>${p.answer
                ? html`<span class="ui-dct__answer">${p.answer}</span>`
                : html`<span class="ui-dct__typing" role="img" aria-label=${`${d.agent} is typing`}><span></span><span></span><span></span></span>`}`
            : html`<span class="ui-dct__out-head">${tick}Approved <span class="ui-dct__running">· running</span></span>`}</div>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const list = this.list;
    const index = this.index;
    const current = this.current;
    const total = this.decisions.length;
    const decided = Object.keys(this.done).length;
    const locked = !!this.picked;
    const showPager = !!current && list.length > 1;
    const waiting = this.waiting;
    const tipIndex = this.hoverFlag ?? this.peeked;
    // Notes show until the path is complete – also while a follow-up waits for its pick
    const open = !this.picked || !!waiting;
    const tipFlag = tipIndex !== null && open ? this.flags[tipIndex] : undefined;
    const count = current ? current.options.length + (this.allowOther ? 1 : 0) : 0;

    return html`
      ${cardHead({
        icon: branches,
        title: this.heading,
        aside: html`<span class="ui-dct__count">${list.length ? `${list.length} waiting for you` : `${decided} of ${total} decided`}</span>
        ${showPager
          ? html`<span class="ui-dct__pager">
              <span class="ui-dct__dots" aria-hidden="true">${repeat(
                list.slice(0, 8),
                (x) => x.id,
                (_, k) => html`<span ?data-on=${k === index}></span>`,
              )}</span>
              <span class="ui-dct__of"><span class="ui-dct__sr">Decision </span>${index + 1} of ${list.length}</span>
              <span class="ui-dct__nav">
                <button type="button" class="ui-dct__step" aria-label="Previous decision" aria-keyshortcuts="ArrowLeft K" aria-disabled=${ifDefined(locked ? "true" : undefined)} @click=${() => !locked && this.move(-1)}>${chevron("m15 18-6-6 6-6")}</button>
                <button type="button" class="ui-dct__step" aria-label="Next decision" aria-keyshortcuts="ArrowRight J" aria-disabled=${ifDefined(locked ? "true" : undefined)} @click=${() => !locked && this.move(1)}>${chevron("m9 18 6-6-6-6")}</button>
              </span>
            </span>`
          : nothing}`,
      })}

      <div class="ui-dct__body" ?data-narrow=${this.narrow}>
        ${current
          ? keyed(current.id, this.renderTree(current, clean))
          : html`<div class="ui-dct__empty"><span class="ui-dct__empty-mark">${badge}</span><b>All decided</b><span>New decisions from your agents show up here.</span></div>`}
        ${tipFlag
          ? keyed(
              tipIndex,
              // The note is in the text for screen readers already (after each flagged part) – this is its visual twin.
              // It stays while the pointer moves onto it, and Escape closes it
              html`<div id=${`${this.uid}-tip`} class="ui-dct__tip" aria-hidden="true" @mouseenter=${this.tipEnter} @mouseleave=${this.tipLeave}>
                <span class="ui-dct__tip-head">${alert}Agent's note</span>
                <p>${tipFlag.note}</p>
                ${tipFlag.source ? html`<span class="ui-dct__tip-source">${tipFlag.source}</span>` : nothing}
              </div>`,
            )
          : nothing}
        ${current
          ? html`${waiting
              ? keyed("then", html`<p class="ui-dct__hint" aria-hidden="true">Then <kbd class="ui-dct__kbd">1</kbd>–<kbd class="ui-dct__kbd">${waiting.options.length}</kbd></p>`)
              : nothing}${!this.picked && this.pickFailed
              ? html`<p class="ui-dct__hint ui-dct__hint--failed" aria-hidden="true">Couldn't reach the agent – pick again.</p>`
              : nothing}${!this.picked && !this.pickFailed
              ? html`<p class="ui-dct__hint" aria-hidden="true">Pick a branch <kbd class="ui-dct__kbd">1</kbd>–<kbd class="ui-dct__kbd">${count}</kbd>${list.length > 1
                  ? html`<span>·</span> next <kbd class="ui-dct__kbd">→</kbd>`
                  : nothing}</p>`
              : nothing}`
          : nothing}
      </div>
      <div class="ui-dct__sr" aria-live="polite" aria-atomic="true">${this.said}</div>
    `;
  }

  static override css = /* css */ `
/* Colors, sizes and motion as variables – override them on [data-ui="dct"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dct"] {
  /* Lines: idle, the agent's pick, the path you point at or picked */
  --tc-decision-tree-link-pick: light-dark(#a9bff5, #36518f);
  --tc-decision-tree-link-pick-hot: light-dark(#7d9df0, #4d70c2);
  /* The agent's pick: a lift tinted blue, with a faint blue edge */
  --tc-decision-tree-option-shadow-picked: 0 0 0 1px light-dark(rgba(0, 96, 226, 0.2), rgba(91, 154, 255, 0.3)), 0 3px 8px -4px light-dark(rgba(0, 96, 226, 0.14), rgba(40, 100, 220, 0.24)), 0 1px 2px light-dark(rgba(0, 60, 140, 0.05), rgba(0, 0, 0, 0.3));
  --tc-decision-tree-option-shadow-picked-hover: 0 0 0 1px light-dark(rgba(0, 96, 226, 0.36), rgba(112, 170, 255, 0.5)), 0 8px 22px -6px light-dark(rgba(0, 96, 226, 0.34), rgba(60, 130, 255, 0.5)), 0 2px 4px -1px light-dark(rgba(0, 96, 226, 0.16), rgba(60, 130, 255, 0.25));
  --tc-decision-tree-link-hot: light-dark(#a3a3a3, #6a6a72);
  --tc-decision-tree-flag-bg: light-dark(#fff2d4, #3d2b0c);
  --tc-decision-tree-flag-edge: light-dark(#f0b44c, #a8741f);
  --tc-decision-tree-flag-hot: light-dark(#ffe2a6, #54390c);
  --tc-decision-tree-flag-ink: light-dark(#6e4300, #ffd28a);
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
}
/* Colors, sizes and motion as variables – override them on [data-ui="dct"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dct"] {
  /* Lines: idle, the agent's pick, the path you point at or picked */
  --tc-decision-tree-link-pick: light-dark(rgba(0, 96, 226, 0.42), rgba(91, 154, 255, 0.5));
  --tc-decision-tree-link-pick-hot: light-dark(rgba(0, 96, 226, 0.6), rgba(112, 170, 255, 0.7));
  /* The agent's pick: a lift tinted blue, with a faint blue edge */
  --tc-decision-tree-option-shadow-picked: 0 0 0 0.5px light-dark(rgba(0, 96, 226, 0.24), rgba(91, 154, 255, 0.34)), 0 3px 8px -4px light-dark(rgba(0, 96, 226, 0.14), rgba(40, 100, 220, 0.24)), 0 1px 2px 0 light-dark(rgba(0, 60, 140, 0.05), rgba(0, 0, 0, 0.4));
  --tc-decision-tree-option-shadow-picked-hover: 0 0 0 0.5px light-dark(rgba(0, 96, 226, 0.42), rgba(112, 170, 255, 0.55)), 0 8px 22px -6px light-dark(rgba(0, 96, 226, 0.34), rgba(60, 130, 255, 0.5)), 0 2px 4px -1px light-dark(rgba(0, 96, 226, 0.16), rgba(60, 130, 255, 0.25));
  --tc-decision-tree-link-hot: light-dark(rgba(0, 0, 0, 0.38), rgba(255, 255, 255, 0.36));
  --tc-decision-tree-flag-bg: light-dark(rgba(255, 166, 0, 0.16), rgba(255, 170, 40, 0.16));
  --tc-decision-tree-flag-edge: light-dark(rgba(214, 130, 0, 0.55), rgba(255, 180, 70, 0.55));
  --tc-decision-tree-flag-hot: light-dark(rgba(255, 166, 0, 0.28), rgba(255, 170, 40, 0.28));
  --tc-decision-tree-flag-ink: light-dark(#8a4600, #ffcf8a);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
}
[data-ui="dct"] {
  --tc-decision-tree-height: 400px;
  --tc-decision-tree-typing: 1100ms;
  /* Stagger steps: 40 / 60 / 80 ms off the duration ladder */
  --tc-decision-tree-step-xs: calc(var(--tc-duration-slow) / 8);
  --tc-decision-tree-step-sm: calc(var(--tc-duration-quick) / 2);
  --tc-decision-tree-step: calc(var(--tc-duration-slow) / 4);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  container: ui-dct / inline-size;
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The card itself takes the focus when the control that had it goes away – shown, never hidden */
[data-ui="dct"]:focus { outline: none; }
[data-ui="dct"]:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="dct"] *, [data-ui="dct"] *::before, [data-ui="dct"] *::after { box-sizing: border-box; }
:where([data-ui="dct"]) :is(button, textarea) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; -webkit-tap-highlight-color: transparent; }
:where([data-ui="dct"]) button { cursor: pointer; }
:where([data-ui="dct"]) button:disabled, :where([data-ui="dct"]) button[aria-disabled="true"] { cursor: default; }
[data-ui="dct"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="dct"]) :is(p, h3) { margin: 0; }
[data-ui="dct"] svg { display: block; flex: none; }
.ui-dct__kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-kbd-fg); letter-spacing: 0; }
.ui-dct__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- The header (cardHead): what this is, with how many wait and where you are at its right ----- */
.ui-dct__count { color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__count { font-size: var(--tc-font-size-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__count { font-size: var(--tc-font-size-sm); }
.ui-dct__pager { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-dct__dots { display: flex; gap: var(--tc-space-1); }
.ui-dct__dots > span { width: 5px; height: 5px; border-radius: 50%; background: var(--tc-border-strong); transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__dots > span { border-radius: var(--tc-radius-2xs); }
.ui-dct__dots > span[data-on] { background: var(--tc-text-primary); transform: scale(1.15); }
/* Previous / next decision: small square ghost buttons */
.ui-dct__nav { display: inline-flex; gap: var(--tc-space-0-5); margin: -6px -4px -6px 0; }
.ui-dct__step { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dct__step:hover:not([aria-disabled]) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-dct__step[aria-disabled] { color: var(--tc-text-disabled); }
/* ----- The card with the tree ----- */
.ui-dct__body { position: relative; display: flex; align-items: center; justify-content: center; min-height: var(--tc-decision-tree-height); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__body { padding: 44px var(--tc-space-7) var(--tc-space-14); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clean: one white card – the header is its first row, the tree below it */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dct"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__body { padding: var(--tc-space-6) var(--tc-space-4) 44px; }
.ui-dct__tree { position: relative; isolation: isolate; display: grid; align-items: center; width: 100%; transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__tree { grid-template-columns: minmax(0, 210px) minmax(0, 1fr); column-gap: 44px; max-width: 860px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__tree { grid-template-columns: minmax(0, 204px) minmax(0, 1fr); column-gap: var(--tc-space-7); max-width: 900px; }
.ui-dct__tree[data-leaving] { opacity: 0; }
.ui-dct__links { position: absolute; top: 0; left: 0; z-index: -1; overflow: visible; pointer-events: none; }
/* Thin neutral hairlines that draw themselves in – the agent's pick a quiet blue, the path you point at a little stronger */
.ui-dct__link { fill: none; stroke: var(--tc-border-strong); stroke-width: var(--tc-hairline); stroke-linecap: round; stroke-dasharray: 1 1; animation: ui-dct-draw var(--tc-duration-slower) var(--tc-ease-move) calc(var(--tc-duration-instant) * 2 + var(--i, 0) * var(--tc-decision-tree-step)) both; transition: stroke var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-moderate) var(--tc-ease-standard), stroke-width var(--tc-duration-base) var(--tc-ease-standard); }
.ui-dct__link[data-kind="leaf"] { animation-delay: calc(var(--tc-duration-instant) * 4 + var(--i, 0) * var(--tc-decision-tree-step)); }
.ui-dct__link[data-kind="out"] { animation: ui-dct-draw var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-quick) both; }
.ui-dct__link[data-kind="sub"] { animation-delay: calc(var(--tc-duration-moderate) * 2 + var(--i, 0) * var(--tc-decision-tree-step) + var(--j, 0) * var(--tc-decision-tree-step-sm)); }
/* A follow-up's lines stay quiet until its branch is picked; then the ones you don't point at step back */
.ui-dct__link[data-kind="sub"]:not([data-live]) { opacity: 0.6; }
.ui-dct__link[data-soft] { opacity: 0.25; }
.ui-dct__tree[data-final] .ui-dct__link[data-soft] { opacity: 0; }
.ui-dct__link[data-pick] { stroke: var(--tc-decision-tree-link-pick); }
.ui-dct__link[data-hot] { stroke: var(--tc-decision-tree-link-hot); stroke-width: calc(var(--tc-hairline) * 2.5); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__link[data-hot] { stroke-width: 1.5px; }
.ui-dct__link[data-pick][data-hot] { stroke: var(--tc-decision-tree-link-pick-hot); }
.ui-dct__link[data-dim] { opacity: 0.25; }
.ui-dct__tree[data-picked] .ui-dct__link[data-dim] { opacity: 0; }
/* The question */
.ui-dct__root { position: relative; display: grid; gap: var(--tc-space-2-5); padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); animation: ui-dct-node var(--tc-duration-slower) var(--tc-ease-move) var(--tc-decision-tree-step-xs) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__root { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__root { border-radius: var(--tc-radius-md); }
/* Logo, then the agent's name with its model under it */
.ui-dct__who { display: flex; gap: var(--tc-space-2-5); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__who { align-items: flex-start; }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__who { align-items: center; }
.ui-dct__avatar { display: grid; flex: none; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-avatar-radius-agent); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-dct__avatar > svg { width: 14px; height: 14px; }
.ui-dct__meta { display: grid; flex: 1; gap: 1px; min-width: 0; }
/* The agent's name may wrap here – the question card is narrow */
.ui-dct__name { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; }
.ui-dct__agent { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__agent { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-dct__model { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* The risk tag: a status pill, like the Live tag in Trace Waterfall – in Clean outside the card, just above its top left */
.ui-dct__risk { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-decision-tree-risk-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-decision-tree-risk-fg); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__risk { position: absolute; bottom: calc(100% + 6px); left: 2px; }
[data-ui="dct"] [data-risk="high"] { --tc-decision-tree-risk-bg: var(--tc-status-danger-bg); --tc-decision-tree-risk-fg: var(--tc-status-danger-fg); }
[data-ui="dct"] [data-risk="medium"] { --tc-decision-tree-risk-bg: var(--tc-status-warning-bg); --tc-decision-tree-risk-fg: var(--tc-status-warning-fg); }
.ui-dct__q { font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); color: var(--tc-title-color); text-wrap: pretty; }
.ui-dct__context { margin-top: -4px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-wrap: pretty; }
/* The branches: an option card, then its consequences in muted text */
.ui-dct__branches { display: grid; gap: var(--tc-space-3-5); }
.ui-dct__row { display: grid; align-items: center; transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); animation: ui-dct-node var(--tc-duration-slower) var(--tc-ease-move) calc(var(--tc-duration-fast) + var(--i, 0) * var(--tc-decision-tree-step)) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__row { grid-template-columns: minmax(0, 200px) minmax(0, 1fr); column-gap: var(--tc-space-8); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__row { grid-template-columns: minmax(0, 184px) minmax(0, 1fr); column-gap: var(--tc-space-6); }
.ui-dct__row[data-dim] { opacity: 0.38; }
.ui-dct__tree[data-picked] .ui-dct__row[data-dim] { opacity: 0; pointer-events: none; }
.ui-dct__opt { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: var(--tc-space-0-5) var(--tc-space-2); min-width: 0; padding: var(--tc-space-2) var(--tc-space-3); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); text-align: left; transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__opt { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__opt { border-radius: var(--tc-radius-md); }
/* Highlighted boxes lift with a deeper shadow instead of a darker stroke */
button.ui-dct__opt:hover:not(:disabled), .ui-dct__opt[data-hot] { box-shadow: var(--tc-shadow-raised-hover); }
/* The agent's pick: the same lift, tinted blue, with a faint blue edge */
.ui-dct__opt[data-pick] { box-shadow: var(--tc-decision-tree-option-shadow-picked); }
button.ui-dct__opt[data-pick]:hover:not(:disabled), .ui-dct__opt[data-pick][data-hot] { box-shadow: var(--tc-decision-tree-option-shadow-picked-hover); }
.ui-dct__opt[data-pressed] { transform: scale(0.98); }
.ui-dct__label { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__label { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
/* The tool an option runs with: its logo on a small white tile */
.ui-dct__icon { display: grid; flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-dct__icon > svg { width: 11px; height: 11px; }
/* The systems a consequence touches: a row of the same tiles, slightly overlapping */
.ui-dct__lines { display: grid; gap: 1px; min-width: 0; }
.ui-dct__apps { display: flex; flex: none; }
.ui-dct__app { display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised), 0 0 0 1.5px var(--tc-surface-raised); }
.ui-dct__app + .ui-dct__app { margin-left: -3px; }
.ui-dct__app > svg { width: 12px; height: 12px; }
.ui-dct__pick { grid-column: 2; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-accent-text); }
.ui-dct__leaf { justify-self: start; min-width: 0; padding: var(--tc-space-2) var(--tc-space-3); animation: ui-dct-node var(--tc-duration-slower) var(--tc-ease-move) calc(var(--tc-duration-fast) * 2 + var(--i, 0) * var(--tc-decision-tree-step)) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__leaf { display: grid; gap: var(--tc-space-1); border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__leaf { display: flex; align-items: center; gap: var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-dct__effect { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
/* A part the agent isn't sure about: a warm tint with a hairline underline – brighter while its note shows */
.ui-dct__flag { padding: 1px var(--tc-space-0-5); margin: 0 -1px; border-radius: var(--tc-radius-xs); background: var(--tc-decision-tree-flag-bg); color: var(--tc-decision-tree-flag-ink); cursor: help; -webkit-box-decoration-break: clone; box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__flag { box-shadow: inset 0 -1.5px 0 var(--tc-decision-tree-flag-edge); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__flag { box-shadow: inset 0 -1px 0 var(--tc-decision-tree-flag-edge); }
.ui-dct__flag:is(:hover, [data-on]) { background: var(--tc-decision-tree-flag-hot); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-decision-tree-flag-edge); }
/* A follow-up: a small question card, its options hanging off a rail under it – quiet until its branch is picked */
.ui-dct__sub { display: grid; gap: var(--tc-space-2); justify-items: start; min-width: 0; transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); animation: ui-dct-node var(--tc-duration-slower) var(--tc-ease-move) calc(var(--tc-duration-fast) * 2 + var(--i, 0) * var(--tc-decision-tree-step)) backwards; }
.ui-dct__sub:not([data-live]) { opacity: 0.62; }
.ui-dct__subq { max-width: 100%; padding: var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-wrap: pretty; }
.ui-dct__subopts { display: grid; gap: var(--tc-space-1-5); justify-items: start; padding-left: 22px; }
.ui-dct__sopt { display: grid; gap: var(--tc-space-0-5); min-width: 0; max-width: 100%; padding: var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); text-align: left; transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-moderate) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); animation: ui-dct-node var(--tc-duration-slower) var(--tc-ease-move) calc(var(--tc-duration-slowest) + var(--i, 0) * var(--tc-decision-tree-step) + var(--j, 0) * var(--tc-decision-tree-step-sm)) backwards; }
.ui-dct__sopt[data-pick] { box-shadow: var(--tc-decision-tree-option-shadow-picked); }
button.ui-dct__sopt:hover:not(:disabled),
.ui-dct__sopt[data-hot] { box-shadow: var(--tc-shadow-raised-hover); }
button.ui-dct__sopt[data-pick]:hover:not(:disabled),
.ui-dct__sopt[data-pick][data-hot] { box-shadow: var(--tc-decision-tree-option-shadow-picked-hover); }
.ui-dct__sopt[data-pressed] { transform: scale(0.98); }
.ui-dct__sopt[data-soft] { opacity: 0.38; }
.ui-dct__tree[data-final] .ui-dct__sopt[data-soft] { opacity: 0; pointer-events: none; }
.ui-dct__sopt-top { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-2); }
.ui-dct__sopt .ui-dct__label { font-size: var(--tc-font-size-sm); }
.ui-dct__sopt .ui-dct__pick { grid-column: auto; }
.ui-dct__sopt-effects { display: flex; align-items: center; gap: var(--tc-space-2-5); }
.ui-dct__sopt .ui-dct__effect { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-dct__more { display: none; margin-left: var(--tc-space-1-5); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); white-space: nowrap; }
/* While the follow-up waits for you, its question lifts a little */
.ui-dct__sub[data-asking] .ui-dct__subq { box-shadow: var(--tc-shadow-raised); }
/* Other…: a quiet outline; opened, a field (--tc-field-shadow) that grows with what you write – the field's focus
   ring sits on it while you type */
.ui-dct__opt[data-other] { padding: 0; background: transparent; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-dct__opt[data-other][data-open] { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); }
.ui-dct__opt[data-other][data-open]:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-dct__other { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; padding: var(--tc-space-2) var(--tc-space-3); border-radius: inherit; text-align: left; }
.ui-dct__other .ui-dct__label { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-dct__grow { position: relative; height: 32px; overflow: hidden; transition: height var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-dct__mirror { position: absolute; top: 0; right: 0; left: 0; padding: var(--tc-space-1-5) var(--tc-space-3); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); white-space: pre-wrap; overflow-wrap: anywhere; visibility: hidden; pointer-events: none; }
.ui-dct__input { display: block; width: 100%; height: 100%; padding: var(--tc-space-1-5) var(--tc-space-3); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); resize: none; overflow-y: hidden; outline: none; scrollbar-width: thin; }
.ui-dct__input::placeholder { color: var(--tc-text-placeholder); }
.ui-dct__failed { grid-column: 1 / -1; padding: 0 var(--tc-space-3) var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-fg); }
.ui-dct__said { padding: var(--tc-space-1-5) var(--tc-space-3); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: pre-wrap; }
/* The outcome under the picked path */
.ui-dct__out { position: absolute; z-index: 1; display: grid; gap: var(--tc-space-1-5); max-width: 280px; padding: var(--tc-space-2) var(--tc-space-3); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised), 0 0 0 var(--tc-hairline) var(--tc-status-success-border); animation: ui-dct-node var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-slow) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__out { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__out { border-radius: var(--tc-radius-md); }
.ui-dct__out[data-kind="replied"] { box-shadow: var(--tc-shadow-raised); }
.ui-dct__out-head { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; }
.ui-dct__out-head > svg { width: 15px; height: 15px; color: var(--tc-status-success-fg); }
.ui-dct__running { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-dct__answer { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); animation: ui-dct-fade-up var(--tc-duration-moderate) var(--tc-ease-move) backwards; }
.ui-dct__typing { display: inline-flex; gap: var(--tc-space-1); justify-self: start; padding: var(--tc-space-1-5) 0 var(--tc-space-1); }
.ui-dct__typing > span { width: 5px; height: 5px; border-radius: 50%; background: var(--tc-text-muted); animation: ui-dct-dot var(--tc-decision-tree-typing) var(--tc-ease-in-out) infinite; }
.ui-dct__typing > span:nth-child(2) { animation-delay: var(--tc-duration-fast); }
.ui-dct__typing > span:nth-child(3) { animation-delay: calc(var(--tc-duration-fast) * 2); }
.ui-dct__hint { position: absolute; display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); pointer-events: none; animation: ui-dct-fade var(--tc-duration-slow) var(--tc-ease-standard) calc(var(--tc-duration-base) * 3) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__hint { bottom: 16px; left: 24px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__hint { bottom: 12px; left: 16px; }
.ui-dct__hint > span { margin: 0 var(--tc-space-1); color: var(--tc-text-disabled); }
.ui-dct__hint--failed { color: var(--tc-status-danger-fg); }
/* The agent's note on a flagged part – it can be hovered (to read or select it) and closes with Escape */
.ui-dct__tip { position: absolute; top: 0; left: 0; z-index: 6; display: grid; width: min(300px, calc(100% - 20px)); padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3); border-radius: var(--tc-menu-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); transform-origin: var(--x, 50%) top; animation: ui-dct-tip var(--tc-duration-base) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__tip { gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__tip { gap: var(--tc-space-0-5); }
.ui-dct__tip[data-side="above"] { transform-origin: var(--x, 50%) bottom; }
.ui-dct__tip-head { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-status-warning-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__tip-head { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__tip-head { font-size: var(--tc-eyebrow-font-size); font-weight: var(--tc-eyebrow-font-weight); line-height: var(--tc-eyebrow-line-height); letter-spacing: var(--tc-eyebrow-tracking); text-transform: var(--tc-eyebrow-transform); }
.ui-dct__tip-head > svg { width: 12px; height: 12px; }
.ui-dct__tip p { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-wrap: pretty; }
.ui-dct__tip-source { justify-self: start; margin-top: var(--tc-space-0-5); padding: 1px var(--tc-space-2); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-dct__empty { display: grid; justify-items: center; gap: var(--tc-space-1); text-align: center; animation: ui-dct-fade-up var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-dct__empty-mark { display: grid; place-items: center; width: 44px; height: 44px; margin-bottom: var(--tc-space-2); background: var(--tc-surface-raised); color: var(--tc-status-success-fg); box-shadow: var(--tc-shadow-raised), 0 0 0 4px var(--tc-status-success-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__empty-mark { border-radius: var(--tc-radius-xl); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__empty-mark { border-radius: var(--tc-radius-lg); }
.ui-dct__empty b { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-strong); }
.ui-dct__empty > span:last-child { font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
/* ----- Narrow: top to bottom – the question, then each branch hanging off a rail with its consequences under it ----- */
@container ui-dct (max-width: 639px) {
:where([data-look="standard"], [data-look="standard"] *).ui-dct__body { min-height: 0; padding: var(--tc-space-5) var(--tc-space-4) var(--tc-space-12); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__body { min-height: 0; padding: var(--tc-space-6) var(--tc-space-4) var(--tc-space-10); }
.ui-dct__count { display: none; }
.ui-dct__tree { grid-template-columns: minmax(0, 1fr); row-gap: var(--tc-space-4-5); }
.ui-dct__branches { padding-left: 34px; }
.ui-dct__row { grid-template-columns: minmax(0, 1fr); row-gap: var(--tc-space-2); }
.ui-dct__leaf { margin-left: 26px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__hint { left: 16px; bottom: 14px; }
.ui-dct__hint kbd:last-of-type,
.ui-dct__hint > span { display: none; }
.ui-dct__sub { margin-left: 26px; }
  /* A follow-up folds to its question until its branch is picked – then its options unfold */
.ui-dct__sub:not([data-live]) .ui-dct__subopts { display: none; }
.ui-dct__sub:not([data-live]) .ui-dct__more { display: inline; }
.ui-dct__sub[data-live] .ui-dct__sopt { animation-delay: calc(var(--tc-duration-quick) + var(--j, 0) * var(--tc-decision-tree-step-sm)); }
.ui-dct__link[data-kind="sub"] { animation-delay: calc(var(--tc-decision-tree-step) + var(--j, 0) * var(--tc-decision-tree-step-sm)); }
}
@container ui-dct (max-width: 380px) {
.ui-dct__of { display: none; }
.ui-dct__branches { padding-left: 26px; }
.ui-dct__leaf { margin-left: var(--tc-space-4-5); }
.ui-dct__sub { margin-left: var(--tc-space-4-5); }
}
@keyframes ui-dct-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes ui-dct-node { from { opacity: 0; transform: translateX(-8px); } }
@keyframes ui-dct-fade { from { opacity: 0; } }
@keyframes ui-dct-fade-up { from { opacity: 0; transform: translateY(6px); } }
@keyframes ui-dct-tip { from { opacity: 0; transform: translateY(4px) scale(0.96); } }
@keyframes ui-dct-dot { 0%, 60%, 100% { opacity: 0.35; } 30% { opacity: 1; } }
@media (pointer: coarse) {
  [data-ui="dct"] .ui-dct__kbd, .ui-dct__hint { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="dct"] *, [data-ui="dct"] *::before, [data-ui="dct"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-decision-tree")) customElements.define("tc-decision-tree", TcDecisionTree);

declare global {
  interface HTMLElementTagNameMap {
    "tc-decision-tree": TcDecisionTree;
  }
}

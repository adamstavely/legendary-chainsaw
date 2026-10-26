import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, OnScreenController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-agent-tree> – the Lit port of src/components/agent-tree.tsx: who started whom.
 * An orchestrator splits a job and hands parts to sub-agents, which may start their own. The tree shows every agent
 * as a card – model, status, what it was asked, its cost and time – joined by thin blue connectors with a hollow dot
 * where they leave the parent.
 *   · new agents grow in: the connector draws itself, then the card rises in – several at once, one after another
 *   · when the tree changes, cards glide to their new place and the connectors follow them frame by frame
 *   · agents that go – a folded branch, a new run – fade out a beat after each other, bottom first
 *   · costs roll up – a branch with children shows what the whole branch cost
 *   · fold a branch to "+3"; the header sums up the whole run, with a window behind "needs you" and "failed"
 * Wide trees lay the first level out side by side; narrow ones indent every level.
 *
 *   <tc-agent-tree heading="Run" .root=${root} selectable></tc-agent-tree>
 *
 * Avatars and tool marks are Elements, cloned into the cards. Running times tick in the DOM once a second while the
 * tree is on screen (unless `now` is given) – no re-render per tick.
 */

export type TreeAgentStatus = "queued" | "running" | "waiting" | "done" | "failed" | "stopped";

export type TreeAgent = {
  id: string;
  name: string;
  /** What it was asked to do */
  task: string;
  model?: string;
  /** A small mark, e.g. the model maker's logo (cloned) – defaults to the initials */
  avatar?: Element;
  /** Marks of the tools it works with (cloned) – shown as small overlapping tiles */
  tools?: Element[];
  status: TreeAgentStatus;
  /** Its own cost so far – the children's costs are added on top */
  cost?: number;
  /** What it waits for you to decide – shown when you open "needs you" */
  ask?: string;
  /** What went wrong – shown when you open "failed" */
  error?: string;
  /** When it started and ended (ms) – for the time it took */
  started?: number;
  ended?: number;
  children?: TreeAgent[];
};

export type AgentTreeResolution = "approve" | "reject" | "retry" | "dismiss";
export type AgentTreeResolve = { agent: TreeAgent; action: AgentTreeResolution };

/* ---------- Helpers ---------- */

const STATUS: Record<TreeAgentStatus, string> = {
  queued: "Queued",
  running: "Running",
  waiting: "Needs you",
  done: "Done",
  failed: "Failed",
  stopped: "Stopped",
};
const dollars = (n: number) => `$${n < 10 ? n.toFixed(2) : Math.round(n).toLocaleString("en-US")}`;
const took = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const walk = (a: TreeAgent): TreeAgent[] => [a, ...(a.children ?? []).flatMap(walk)];
const costOf = (a: TreeAgent): number => (a.cost ?? 0) + (a.children ?? []).reduce((sum, c) => sum + costOf(c), 0);
const reducedMotion = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const byKey = (root: ParentNode, key: string) => [...root.querySelectorAll<HTMLElement>("[data-focus-key]")].filter((el) => el.dataset.focusKey === key);

/** Position of an element inside the tree, from offsets – so transforms and zoom don't throw it off */
const place = (el: HTMLElement, box: HTMLElement) => {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== box) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
};

/* ---------- Icons ---------- */

const spark = html`<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">${svg`<path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor"></path><circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55"></circle>`}</svg>`;
/* Status glyphs check, triangle-alert and clock, chevron-down: Lucide (ISC, lucide.dev); the loader is a plain arc */
const STATUS_ICONS: Record<TreeAgentStatus, TemplateResult> = {
  running: html`<svg class="ui-agt__spin" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">${svg`<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-opacity="0.25" stroke-width="2.5"></circle><path d="M12 3.5A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" stroke-linecap="round" stroke-width="2.5"></path>`}</svg>`,
  done: html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M20 6 9 17l-5-5"></path>`}</svg>`,
  failed: html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4" stroke-width="2.2"></path><path d="M12 17h.01" stroke-width="2.6"></path>`}</svg>`,
  waiting: html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`}</svg>`,
  stopped: html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">${svg`<rect x="6" y="6" width="12" height="12" rx="2.5" stroke="currentColor" stroke-width="2.2"></rect>`}</svg>`,
  queued: html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">${svg`<circle cx="12" cy="12" r="3.5" fill="currentColor"></circle>`}</svg>`,
};
/* chevron-down: Lucide (ISC, lucide.dev) */
const chevron = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="m6 9 6 6 6-6"></path>`}</svg>`;

type Link = { id: string; d: string; dot: [number, number]; muted: boolean; leaving?: number; enter: number };
/** An agent as it is shown: its sub-agents after folding, and – while it fades out – the delay it leaves with */
type Shown = { agent: TreeAgent; kids: Shown[]; leaving?: number };
type Ghost = { shown: Shown; parent: string; index: number };
type Dot = { at: [number, number]; muted: boolean; leaving?: number };

/** One dot per parent, faded out with the last of its connectors */
const dotsOf = (links: Link[]) => {
  const dots = new Map<string, Dot>();
  for (const l of links) {
    const key = l.dot.join(",");
    const d = dots.get(key);
    const leaving = l.leaving;
    if (!d) dots.set(key, { at: l.dot, muted: l.muted, leaving });
    else dots.set(key, { at: d.at, muted: d.muted && l.muted, leaving: d.leaving === undefined || leaving === undefined ? undefined : Math.max(d.leaving, leaving) });
  }
  return dots;
};

/** What only a render can change: which connectors and dots there are and how they look – not where they run */
const structure = (links: Link[]) =>
  JSON.stringify([links.map((l) => [l.id, l.muted, l.leaving ?? null, l.enter]), [...dotsOf(links).values()].map((d) => [d.muted, d.leaving ?? null])]);

/** Moves the drawn connectors and dots to where they run now – same ones, in the same order */
const paintLinks = (paths: Element | null, dots: Element | null, links: Link[]) => {
  paths?.querySelectorAll("path").forEach((el, i) => links[i] && el.getAttribute("d") !== links[i].d && el.setAttribute("d", links[i].d));
  const at = [...dotsOf(links).values()].map((d) => d.at);
  dots?.querySelectorAll("circle").forEach((el, i) => {
    if (!at[i]) return;
    el.setAttribute("cx", String(at[i][0]));
    el.setAttribute("cy", String(at[i][1]));
  });
};

/** Motion: how long cards take to leave and to move, and the beat between cards that go together */
const EXIT = 280;
const MOVE = 420;
const STAGGER = 60;
const EASE = "cubic-bezier(0.32, 0.72, 0.24, 1)";
const flat = (s: Shown): Shown[] => [s, ...s.kids.flatMap(flat)];

/** " · 1m 05s" – how long an agent took, or has been at it */
const timeText = (a: TreeAgent, now: number) =>
  a.started ? ` · ${took((a.ended ?? (a.status === "running" || a.status === "waiting" ? now : a.started)) - a.started)}` : "";

/**
 * Who started whom in a run of agents: cards joined by connectors, with costs, times and folding.
 * @tag tc-agent-tree
 * @fires tc-collapsed-change - A branch was folded or unfolded (detail: { collapsed: string[] }); cancelable
 * @fires tc-select - A card was clicked, or its name pressed (detail: { agent: TreeAgent }); shown as a button with `selectable`
 * @fires tc-resolve - An answer from the "needs you" or "failed" window (detail: { agent: TreeAgent, action: "approve" | "reject" | "retry" | "dismiss" })
 */
export class TcAgentTree extends TcElement {
  static override ui = "agt";

  /** The heading, and the tree list's name */
  @property() accessor heading = "Agents";
  @property({ attribute: false }) accessor root: TreeAgent = { id: "", name: "", task: "", status: "queued" };
  /** Ids of folded branches. Changed by the fold buttons unless tc-collapsed-change is prevented */
  @property({ attribute: false }) accessor collapsed: string[] = [];
  /** The clock for running times, in epoch ms – unset uses an internal clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Formats every cost – defaults to dollars, e.g. "$0.42" */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;
  /** Called with each answer (as well as tc-resolve). May return a promise: the answer's buttons wait, and if it
   *  rejects the window stays open and says so */
  @property({ attribute: false }) accessor resolver: ((agent: TreeAgent, action: AgentTreeResolution) => void | Promise<unknown>) | undefined = undefined;
  /** The agents' names are buttons that fire tc-select (the whole card stays clickable for a pointer) */
  @property({ type: Boolean }) accessor selectable = false;

  /** @internal */ @state() accessor tick = 0;
  /** @internal */ @state() accessor wide = true;
  /** @internal */ @state() accessor ghosts: Ghost[] = [];
  /** @internal */ @state() accessor links: Link[] = [];
  /** @internal */ @state() accessor size = { w: 0, h: 0 };
  /** @internal */ @state() accessor drawnIn = new Set<string>();
  /** @internal Answers on their way (their buttons wait), and the ones that failed */
  @state() accessor answering: Record<string, "pending" | "error"> = {};
  /** @internal The "needs you" or "failed" window */
  @state() accessor opened: "waiting" | "failed" | null = null;

  private onScreenCtl = new OnScreenController(this);
  private nodes = new Map<string, HTMLElement>();
  private clones = new Map<string, { src: Element; clone: Element }>();
  // What willUpdate works out for the render and the effects after it
  private visible!: Shown;
  private visibleIds = new Set<string>();
  private shown!: Shown;
  private shownAll: Shown[] = [];
  private newDelays = new Map<string, number>();
  private newcomers = 0;
  private enterDelay = new Map<string, number>();
  private mountedOnce = false;
  private prevVisible: Shown | null = null;
  private shape = "";
  private layoutKey = "";
  private drawnShape = "";
  private drawnLayout = "";
  // The connectors as last measured; `links` changes only with their structure, so a glide doesn't re-render
  private geo: Link[] = [];
  private drawn = structure([]);
  private pending = false;
  private paintedLinks: Link[] | null = null;
  private firstSeen = new Map<string, number>();
  private drawTimers = new Set<number>();
  private linkKey = "";
  private ghostTimers = new Set<number>();
  private until = 0;
  private raf = 0;
  private visibleOnScreen = true;
  private lastPos = new Map<string, { x: number; y: number }>();
  private ro?: ResizeObserver;
  private clockTimer = 0;
  private clockOn = false;
  private openedBefore: "waiting" | "failed" | null = null;

  constructor() {
    super();
    // Focus never drops to <body>: a card that folds away or leaves hands focus to its nearest shown ancestor's fold
    // button; an answered "needs you"/"failed" window to the next answer, then to the button that opened it
    new FocusRescueController(this, (key) => {
      if (!key) return null;
      const find = (k: string) => byKey(this, k).find((el) => !el.closest("[inert]")) ?? null;
      const [kind, id] = [key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1)];
      const other = id === "waiting" ? "failed" : "waiting";
      const firstCard = () => [...this.querySelectorAll<HTMLElement>(".ui-agt__select, .ui-agt__fold")].find((el) => !el.closest("[inert]")) ?? null;
      if (kind === "pop") return this.querySelector<HTMLElement>(".ui-agt__pop .ui-agt__btn--primary:not(:disabled)") ?? find(`sum:${id}`) ?? find(`sum:${other}`) ?? firstCard();
      if (kind === "sum") return find(`sum:${other}`) ?? firstCard();
      const path = (a: TreeAgent, trail: TreeAgent[]): TreeAgent[] | null =>
        a.id === id ? trail : (a.children ?? []).reduce<TreeAgent[] | null>((found, c) => found ?? path(c, [...trail, a]), null);
      for (const anc of (path(this.root, []) ?? []).reverse()) {
        const el = find(`fold:${anc.id}`) ?? find(`select:${anc.id}`);
        if (el) return el;
      }
      return firstCard();
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("visibilitychange", this.syncClock);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this.syncClock);
    document.removeEventListener("pointerdown", this.away);
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ro?.disconnect();
    this.ro = undefined;
    window.clearInterval(this.clockTimer);
    this.clockTimer = 0;
    this.clockOn = false;
    this.drawTimers.forEach((t) => window.clearTimeout(t));
    this.drawTimers.clear();
    this.ghostTimers.forEach((t) => window.clearTimeout(t));
    this.ghostTimers.clear();
  }

  private get onScreen() {
    return this.onScreenCtl.onScreen;
  }

  /* ---------- Folding, selecting, answering ---------- */

  private toggle(id: string) {
    const next = this.collapsed.includes(id) ? this.collapsed.filter((c) => c !== id) : [...this.collapsed, id];
    if (this.emit("tc-collapsed-change", { collapsed: next }, { cancelable: true })) this.collapsed = next;
  }

  private select(agent: TreeAgent) {
    this.emit("tc-select", { agent });
  }

  private answer(a: TreeAgent, action: AgentTreeResolution, openList: TreeAgent[]) {
    if (this.answering[a.id] === "pending") return;
    const last = openList.length <= 1;
    this.emit<AgentTreeResolve>("tc-resolve", { agent: a, action });
    const done = this.resolver?.(a, action);
    const without = () => Object.fromEntries(Object.entries(this.answering).filter(([k]) => k !== a.id));
    if (done && typeof (done as Promise<unknown>).then === "function") {
      this.answering = { ...this.answering, [a.id]: "pending" };
      (done as Promise<unknown>).then(
        () => {
          if (!this.isConnected) return;
          this.answering = without();
          if (last) this.setOpened(null);
        },
        () => {
          if (this.isConnected) this.answering = { ...this.answering, [a.id]: "error" };
        },
      );
      return;
    }
    this.answering = without();
    if (last) this.setOpened(null);
  }

  private setOpened(next: "waiting" | "failed" | null) {
    this.opened = next;
    if (next) document.addEventListener("pointerdown", this.away);
    else document.removeEventListener("pointerdown", this.away);
  }
  /** A click elsewhere closes the window */
  private away = (e: PointerEvent) => {
    if (!this.querySelector(".ui-agt__bar")?.contains(e.target as Node)) this.setOpened(null);
  };
  private onPopKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    // Back to the button that opened it
    rescueFocus(e.currentTarget as Element, [byKey(this, `sum:${this.opened}`)[0]]);
    this.setOpened(null);
  };

  /* ---------- The running clock: written into the times, not rendered ---------- */

  private paintClock = () => {
    const now = Date.now();
    this.querySelectorAll<HTMLElement>("[data-since]").forEach((el) => {
      const text = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.nodeValue);
      const next = ` · ${took(now - Number(el.dataset.since))}`;
      if (text && text.nodeValue !== next) text.nodeValue = next;
    });
  };
  /** Running and waiting agents' times tick once a second while anything is live, the tree is on screen and the tab visible */
  private syncClock = () => {
    const live = this.isConnected && this.now === undefined && walk(this.root).some((a) => a.status === "running");
    const run = live && this.onScreen && document.visibilityState !== "hidden";
    if (run && !this.clockTimer) {
      this.paintClock();
      this.clockTimer = window.setInterval(this.paintClock, 1000);
    } else if (!run && this.clockTimer) {
      window.clearInterval(this.clockTimer);
      this.clockTimer = 0;
    }
  };

  /* ---------- The connectors, measured from the cards as they are drawn – so they follow every move ---------- */

  private measure = () => {
    const box = this.querySelector<HTMLElement>(".ui-agt__tree");
    if (!box || !this.shown) return;
    const outer = box.getBoundingClientRect();
    const scale = box.offsetWidth ? outer.width / box.offsetWidth : 1;
    const at = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { x: (r.left - outer.left) / scale, y: (r.top - outer.top) / scale, w: r.width / scale, h: r.height / scale };
    };
    const next: Link[] = [];
    const R = 8;
    const wide = this.wide;
    // The bar under the root runs at one height for every child: halfway down to the row the cards sit in
    const row = box.querySelector<HTMLElement>(":scope > .ui-agt__entry > .ui-agt__level");
    const rowTop = row ? at(row).y : null;
    const visit = (s: Shown, depth: number) => {
      const pe = this.nodes.get(s.agent.id);
      for (const k of s.kids) {
        const ce = this.nodes.get(k.agent.id);
        if (pe && ce) {
          const p = at(pe);
          const q = at(ce);
          const muted = k.agent.status === "queued" || k.agent.status === "stopped";
          const base = { id: `${s.agent.id}>${k.agent.id}`, muted, leaving: k.leaving, enter: this.enterDelay.get(k.agent.id) ?? 0 };
          if (wide && depth === 0) {
            // First level, side by side: one straight stem down from the parent, a straight bar along,
            // and each child's drop leaves the bar with a rounded corner
            const x1 = p.x + p.w / 2;
            const y1 = p.y + p.h;
            const x2 = q.x + q.w / 2;
            const y2 = q.y;
            const mid = Math.round(y1 + ((rowTop ?? y2) - y1) / 2);
            const dx = x2 - x1;
            const r = Math.max(0, Math.min(R, Math.abs(dx) / 2, (y2 - mid) / 2));
            const sg = Math.sign(dx);
            const from = muted ? `M${x1} ${mid}` : `M${x1} ${y1}V${mid}`;
            const d = Math.abs(dx) < 12 ? `${from}V${y2}` : `${from}H${x2 - sg * r}Q${x2} ${mid} ${x2} ${mid + r}V${y2}`;
            next.push({ ...base, d, dot: [x1, y1] });
            // The stem, once per parent – it stays while any child is still there
            const stem = `${s.agent.id}>stem`;
            const prev = next.find((l) => l.id === stem);
            if (!prev) next.push({ id: stem, d: `M${x1} ${y1}V${mid}`, dot: [x1, y1], muted, leaving: k.leaving, enter: base.enter });
            else {
              prev.muted = prev.muted && muted;
              prev.leaving = prev.leaving === undefined || k.leaving === undefined ? undefined : Math.max(prev.leaving, k.leaving);
              prev.enter = Math.min(prev.enter, base.enter);
            }
          } else {
            // Hanging below: down along the parent's left edge, then into the child's side
            const x1 = p.x + 21;
            const y1 = p.y + p.h;
            const x2 = q.x;
            const y2 = q.y + 20;
            const r = Math.max(0, Math.min(R, (x2 - x1) / 2, (y2 - y1) / 2));
            const d = x2 - x1 < 2 ? `M${x1} ${y1}V${q.y}` : `M${x1} ${y1}V${y2 - r}Q${x1} ${y2} ${x1 + r} ${y2}H${x2}`;
            next.push({ ...base, d, dot: [x1, y1] });
          }
        }
        visit(k, depth + 1);
      }
    };
    visit(this.shown, 0);
    // A connector that is gone draws itself again when it comes back
    for (const id of [...this.firstSeen.keys()]) if (!next.some((l) => l.id === id)) this.firstSeen.delete(id);
    this.geo = next;
    const sig = structure(next);
    if (sig !== this.drawn) {
      this.drawn = sig;
      this.pending = true;
      this.links = next;
    } else if (!this.pending) this.paint();
    const w = box.scrollWidth;
    const h = box.scrollHeight;
    if (this.size.w !== w || this.size.h !== h) this.size = { w, h };
  };

  private paint() {
    paintLinks(this.querySelector(".ui-agt__links:not(.ui-agt__dots)"), this.querySelector(".ui-agt__dots"), this.geo);
  }

  /** While cards rise, glide or leave, the connectors are measured every frame */
  private follow(ms: number) {
    this.until = Math.max(this.until, performance.now() + ms);
    if (this.raf || !this.visibleOnScreen || !this.isConnected) return;
    const loop = () => {
      this.measure();
      this.raf = performance.now() < this.until && this.visibleOnScreen ? requestAnimationFrame(loop) : 0;
    };
    this.raf = requestAnimationFrame(loop);
  }

  /** Every card that moved glides from where it was; positions are noted for the next change */
  private record(glide: boolean) {
    const box = this.querySelector<HTMLElement>(".ui-agt__tree");
    if (!box) return false;
    // Every read first; the glides (compositor-only animations) after
    const now = [...this.nodes].map(([id, el]) => [id, el, place(el, box)] as const);
    let moved = false;
    const still = reducedMotion();
    for (const [id, el, p] of now) {
      const before = this.lastPos.get(id);
      if (glide && !still && before && (Math.abs(before.x - p.x) > 0.5 || Math.abs(before.y - p.y) > 0.5) && typeof el.animate === "function") {
        el.animate([{ translate: `${before.x - p.x}px ${before.y - p.y}px` }, { translate: "0px 0px" }], { duration: MOVE, easing: EASE });
        moved = true;
      }
      this.lastPos.set(id, p);
    }
    for (const id of [...this.lastPos.keys()]) if (!this.nodes.has(id)) this.lastPos.delete(id);
    return moved;
  }

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.toggleAttribute("data-wide", this.wide);
    // The internal clock's start: read once per switch to it, before the first paint
    if ((!this.hasUpdated || changed.has("now")) && this.now === undefined) this.tick = Date.now();

    const folded = this.collapsed;
    const toShown = (a: TreeAgent): Shown => ({ agent: a, kids: folded.includes(a.id) ? [] : (a.children ?? []).map(toShown) });
    this.visible = toShown(this.root);
    this.visibleIds = new Set(flat(this.visible).map((s) => s.agent.id));
    // What is shown: the open tree, plus cards that are on their way out
    const leavingNow = this.ghosts.filter((g) => !this.visibleIds.has(g.shown.agent.id));
    const merge = (s: Shown): Shown => {
      const kids = s.kids.map(merge);
      leavingNow
        .filter((g) => g.parent === s.agent.id)
        .sort((a, b) => a.index - b.index)
        .forEach((g) => kids.splice(Math.min(g.index, kids.length), 0, g.shown));
      return { ...s, kids };
    };
    this.shown = merge(this.visible);
    this.shownAll = flat(this.shown);

    // Cards that appear together rise one after another; the delay sticks to the card until it leaves
    this.newcomers = 0;
    this.newDelays = new Map();
    for (const s of this.shownAll) {
      if (s.leaving !== undefined || this.enterDelay.has(s.agent.id) || this.newDelays.has(s.agent.id)) continue;
      this.newDelays.set(s.agent.id, s === this.shown ? 0 : (this.mountedOnce ? 160 : 200) + this.newcomers++ * STAGGER);
    }
    this.shape = JSON.stringify([this.wide, folded, this.shownAll.map((s) => [s.agent.id, s.agent.status, s.leaving ?? "", s.kids.map((k) => k.agent.id)])]);
    // What moves cards: the shape, the depth and what sizes a card
    this.layoutKey = JSON.stringify([this.shape, this.shownAll.map((s) => [s.agent.name, s.agent.model ?? "", s.agent.task, s.agent.tools?.length ?? 0])]);
  }

  protected override firstUpdated() {
    // One observer for size changes: it picks the layout, redraws the connectors and notes where the cards are now
    const box = this.querySelector<HTMLElement>(".ui-agt__tree");
    if (!box || typeof ResizeObserver === "undefined") return;
    this.ro = new ResizeObserver(() => {
      this.record(false);
      this.wide = box.offsetWidth >= 560;
      this.measure();
    });
    this.ro.observe(box);
  }

  protected override updated() {
    if (!this.isConnected) return;
    this.nodes = new Map([...this.querySelectorAll<HTMLElement>(".ui-agt__node[data-id]")].map((el) => [el.dataset.id!, el]));
    this.paintClock();

    // After the connectors' structure changes, the paths show what was measured last
    if (this.paintedLinks !== this.links) {
      this.paintedLinks = this.links;
      this.pending = false;
      this.paint();
    }
    // Cards glide to their new place
    if (this.layoutKey !== this.drawnLayout) {
      this.drawnLayout = this.layoutKey;
      if (this.record(true)) this.follow(MOVE + 40);
    }

    // What leaves the tree fades out, a beat after each other, bottom first
    const prev = this.prevVisible;
    this.prevVisible = this.visible;
    this.mountedOnce = true;
    for (const [id, d] of this.newDelays) if (!this.enterDelay.has(id)) this.enterDelay.set(id, d);
    // Cards that are gone for good start over when they come back
    for (const id of [...this.enterDelay.keys()]) if (!this.shownAll.some((s) => s.agent.id === id && s.leaving === undefined)) this.enterDelay.delete(id);
    if (prev && prev !== this.visible && !reducedMotion()) {
      const removed: Ghost[] = [];
      const scan = (s: Shown) =>
        s.kids.forEach((k, index) => {
          if (!this.visibleIds.has(k.agent.id)) removed.push({ shown: k, parent: s.agent.id, index });
          else scan(k);
        });
      scan(prev);
      if (removed.length) {
        const order = removed.flatMap((g) => flat(g.shown)).reverse();
        const delay = new Map(order.map((s, i) => [s.agent.id, i * STAGGER]));
        const mark = (s: Shown): Shown => ({ ...s, leaving: delay.get(s.agent.id) ?? 0, kids: s.kids.map(mark) });
        const batch = removed.filter((g) => this.visibleIds.has(g.parent) || g.parent === this.root.id).map((g) => ({ ...g, shown: mark(g.shown) }));
        const ids = new Set(batch.map((g) => g.shown.agent.id));
        this.ghosts = [...this.ghosts.filter((g) => !ids.has(g.shown.agent.id)), ...batch];
        const total = EXIT + (order.length - 1) * STAGGER;
        const t = window.setTimeout(() => {
          this.ghostTimers.delete(t);
          this.ghosts = this.ghosts.filter((g) => !ids.has(g.shown.agent.id));
        }, total + 30);
        this.ghostTimers.add(t);
        this.follow(total + MOVE + 60);
      }
    }

    if (this.shape !== this.drawnShape) {
      this.drawnShape = this.shape;
      this.measure();
      this.follow(900 + this.newcomers * STAGGER);
    }

    // Off screen the connectors stop following frame by frame; back on screen they are measured once
    if (this.visibleOnScreen !== this.onScreen) {
      this.visibleOnScreen = this.onScreen;
      if (this.onScreen) {
        this.measure();
        this.follow(0);
      }
    }

    // A connector drawn for the first time draws itself in, timed with its card
    const linkKey = this.links.map((l) => `${l.id}:${l.enter}`).join("|");
    if (linkKey !== this.linkKey) {
      this.linkKey = linkKey;
      for (const l of this.links) {
        if (this.firstSeen.has(l.id)) continue;
        this.firstSeen.set(l.id, 1);
        const t = window.setTimeout(() => {
          this.drawTimers.delete(t);
          this.drawnIn = new Set(this.drawnIn).add(l.id);
        }, 700 + l.enter);
        this.drawTimers.add(t);
      }
      const kept = [...this.drawnIn].filter((id) => this.links.some((l) => l.id === id));
      if (kept.length !== this.drawnIn.size) this.drawnIn = new Set(kept);
    }

    // The window opens with its first answer focused
    if (this.opened && this.opened !== this.openedBefore) this.querySelector<HTMLElement>(".ui-agt__pop .ui-agt__btn--primary")?.focus();
    this.openedBefore = this.opened;
    this.syncClock();
  }

  /* ---------- Render ---------- */

  /** A clone of an avatar or tool mark, made once per place it shows */
  private mark(key: string, src: Element) {
    let c = this.clones.get(key);
    if (c?.src !== src) this.clones.set(key, (c = { src, clone: src.cloneNode(true) as Element }));
    return c.clone;
  }

  private card(s: Shown, depth: number) {
    const look: Look = this.resolvedLook;
    const a = s.agent;
    const kids = a.children ?? [];
    const branch = kids.length ? costOf(a) : (a.cost ?? 0);
    const now = this.now ?? this.tick;
    const time = timeText(a, now);
    const ticking = this.now === undefined && a.started !== undefined && a.ended === undefined && (a.status === "running" || a.status === "waiting");
    const folded = this.collapsed.includes(a.id);
    const hidden = folded ? walk(a).length - 1 : 0;
    const leaving = s.leaving !== undefined;
    const delay = this.enterDelay.get(a.id) ?? this.newDelays.get(a.id) ?? 0;
    const selectable = this.selectable;
    const head = html`
      <div class="ui-agt__top">
        <span class="ui-agt__avatar" data-logo=${ifDefined(a.avatar ? "" : undefined)} aria-hidden="true">${a.avatar ? this.mark(`avatar:${a.id}`, a.avatar) : initials(a.name)}</span>
        <span class="ui-agt__who">
          ${selectable
            ? html`<button
                type="button"
                class="ui-agt__name ui-agt__select"
                data-focus-key=${`select:${a.id}`}
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this.select(a);
                }}
              >
                ${a.name}
              </button>`
            : html`<span class="ui-agt__name">${a.name}</span>`}
          ${a.model ? html`<span class="ui-agt__model">${a.model}</span>` : nothing}
        </span>
        <span class="ui-agt__status" data-status=${a.status}>${STATUS_ICONS[a.status]}${STATUS[a.status]}</span>
      </div>
      <p class="ui-agt__task">${a.tools && a.tools.length > 0 ? html`<span class="ui-agt__tools" aria-hidden="true">${a.tools.slice(0, 4).map((tool, i) => html`<span class="ui-agt__tool">${this.mark(`tool:${a.id}:${i}`, tool)}</span>`)}</span>` : nothing}${a.task}</p>
    `;
    return html`<div
      class="ui-agt__node"
      data-id=${a.id}
      data-status=${a.status}
      data-depth=${depth}
      data-leaving=${ifDefined(leaving ? "" : undefined)}
      .inert=${leaving}
      style=${styleMap({ animationDelay: `${leaving ? s.leaving : delay}ms` })}
      @click=${() => selectable && !leaving && this.select(a)}
      data-clickable=${ifDefined(selectable ? "" : undefined)}
    >
      ${look === "standard" ? html`<div class="ui-agt__card">${head}</div>` : head}
      <div class="ui-agt__meta">
        <span class="ui-agt__cost" title=${ifDefined(kids.length ? "This branch, with its sub-agents" : undefined)}>
          <span class="ui-agt__amount" data-live=${ifDefined(walk(a).some((x) => x.status === "running") ? "" : undefined)}>${this.formatCost(branch)}</span>
          ${time ? html`<span class="ui-agt__time" data-since=${ifDefined(ticking ? a.started : undefined)}>${time}</span>` : nothing}
        </span>
        ${kids.length > 0
          ? html`<button
              type="button"
              class="ui-agt__fold"
              aria-expanded=${folded ? "false" : "true"}
              aria-label=${`${folded ? `+${hidden}` : kids.length} sub-agents of ${a.name}`}
              data-focus-key=${`fold:${a.id}`}
              @click=${(e: Event) => {
                e.stopPropagation();
                this.toggle(a.id);
              }}
            >
              ${folded ? `+${hidden}` : kids.length}${chevron}
            </button>`
          : nothing}
      </div>
    </div>`;
  }

  private hang(s: Shown, depth: number): TemplateResult {
    return html`<div class="ui-agt__hang" role="listitem">
      ${this.card(s, depth)}
      ${s.kids.length > 0
        ? html`<div class="ui-agt__below" role="list" aria-label=${`Started by ${s.agent.name}`}>
            ${repeat(
              s.kids,
              (k) => k.agent.id,
              (k) => this.hang(k, depth + 1),
            )}
          </div>`
        : nothing}
    </div>`;
  }

  private renderBar(all: TreeAgent[]) {
    const opened = this.opened;
    const running = all.filter((a) => a.status === "running").length;
    const waiting = all.filter((a) => a.status === "waiting").length;
    const failed = all.filter((a) => a.status === "failed").length;
    const openList = opened ? all.filter((a) => a.status === opened) : [];
    const status = [waiting > 0 && `${waiting} ${waiting === 1 ? "agent needs" : "agents need"} you`, failed > 0 && `${failed} failed`, running === 0 && waiting === 0 && "No agent running"].filter(Boolean).join(", ");
    const sumButton = (kind: "waiting" | "failed", label: string) =>
      html`<button type="button" class="ui-agt__sum-btn" data-kind=${kind} data-focus-key=${`sum:${kind}`} aria-expanded=${opened === kind ? "true" : "false"} aria-haspopup="dialog" @click=${() => this.setOpened(this.opened === kind ? null : kind)}>
        ${label}${chevron}
      </button>`;
    return html`<header class="ui-agt__bar">
      <span class="ui-agt__spark">${spark}</span>
      <span class="ui-agt__title">${this.heading}</span>
      <span class="ui-agt__sr" role="status">${status}</span>
      <span class="ui-agt__sum">
        <span>${all.length === 1 ? "1 agent" : `${all.length} agents`}</span>
        ${running > 0 ? html`<span class="ui-agt__sum-run">${running} running</span>` : nothing}
        ${waiting > 0 ? sumButton("waiting", `${waiting} needs you`) : nothing}
        ${failed > 0 ? sumButton("failed", `${failed} failed`) : nothing}
        <span class="ui-agt__sum-cost"><span class="ui-agt__amount" data-live=${ifDefined(running > 0 ? "" : undefined)}>${this.formatCost(costOf(this.root))}</span></span>
      </span>
      ${opened && openList.length > 0
        ? html`<div class="ui-agt__pop" role="dialog" data-kind=${opened} aria-label=${opened === "waiting" ? "Agents that need you" : "Agents that failed"} @keydown=${this.onPopKey}>
            ${repeat(
              openList,
              (a) => a.id,
              (a) => {
                const text = opened === "waiting" ? a.ask : a.error;
                const pending = this.answering[a.id] === "pending";
                return html`<div class="ui-agt__pop-item">
                  <span class="ui-agt__pop-head">
                    <span class="ui-agt__status" data-status=${a.status}>${STATUS_ICONS[a.status]}</span>
                    <span class="ui-agt__pop-name">${a.name}</span>
                    <span class="ui-agt__pop-task">${a.task}</span>
                  </span>
                  ${text ? html`<span class="ui-agt__pop-text">${text}</span>` : nothing}
                  ${this.answering[a.id] === "error" ? html`<span class="ui-agt__pop-text ui-agt__pop-error" role="alert">Didn't go through – try again</span>` : nothing}
                  <span class="ui-agt__pop-actions" aria-busy=${ifDefined(pending ? "true" : undefined)}>
                    <button type="button" class="ui-agt__btn" data-focus-key=${`pop:${opened}`} ?disabled=${pending} @click=${() => this.answer(a, opened === "waiting" ? "reject" : "dismiss", openList)}>${opened === "waiting" ? "Reject" : "Dismiss"}</button>
                    <button type="button" class="ui-agt__btn ui-agt__btn--primary" data-focus-key=${`pop:${opened}`} ?disabled=${pending} @click=${() => this.answer(a, opened === "waiting" ? "approve" : "retry", openList)}>${opened === "waiting" ? "Approve" : "Retry"}</button>
                  </span>
                </div>`;
              },
            )}
          </div>`
        : nothing}
    </header>`;
  }

  protected override render() {
    const shown = this.shown;
    const all = walk(this.root);
    const links = this.links;
    const dots = dotsOf(links);
    const still = reducedMotion();
    const fresh = new Set(links.filter((l) => !this.drawnIn.has(l.id)).map((l) => l.id));
    // The deepest level on screen – narrow trees size every card to fit it, so all cards are as wide
    const deepest = (s: Shown, d: number): number => Math.max(d, ...s.kids.map((k) => deepest(k, d + 1)));
    const { w, h } = this.size;
    return html`
      ${this.renderBar(all)}
      <div class="ui-agt__tree" data-offscreen=${ifDefined(this.onScreen ? undefined : "")} role="list" aria-label=${this.heading} style=${styleMap({ "--tc-agent-tree-depth": String(deepest(shown, 0)) })}>
        <svg class="ui-agt__links" width=${w} height=${h} aria-hidden="true">
          ${repeat(
            links,
            (l) => l.id,
            (l) =>
              svg`<g data-muted=${ifDefined(l.muted ? "" : undefined)} data-fresh=${ifDefined(fresh.has(l.id) && l.leaving === undefined && !still ? "" : undefined)} data-leaving=${ifDefined(l.leaving !== undefined ? "" : undefined)}><path d=${l.d} pathLength="1" class="ui-agt__link" style=${`animation-delay: ${l.leaving !== undefined ? l.leaving : Math.max(0, l.enter - 160)}ms`}></path></g>`,
          )}
        </svg>
        <div class="ui-agt__entry" role="listitem">
          <div class="ui-agt__root">${this.card(shown, 0)}</div>
          ${shown.kids.length > 0
            ? html`<div class="ui-agt__level" role="list" aria-label=${`Started by ${this.root.name}`}>
                ${repeat(
                  shown.kids,
                  (k) => k.agent.id,
                  (k) => this.hang(k, 1),
                )}
              </div>`
            : nothing}
        </div>
        <svg class="ui-agt__links ui-agt__dots" width=${w} height=${h} aria-hidden="true">
          ${repeat(
            [...dots],
            ([key]) => key,
            ([, d]) =>
              svg`<circle cx=${d.at[0]} cy=${d.at[1]} r="3.25" class="ui-agt__dot" data-muted=${ifDefined(d.muted ? "" : undefined)} data-leaving=${ifDefined(d.leaving !== undefined ? "" : undefined)} style=${ifDefined(d.leaving !== undefined ? `animation-delay: ${d.leaving}ms` : undefined)}></circle>`,
          )}
        </svg>
      </div>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="agt"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agt"] {
  /* The connectors: a soft blue with hollow dots, as in the Project Flow illustration */
  --tc-agent-tree-link: light-dark(#82bcff, #4f8fdb);
  --tc-agent-tree-link-muted: var(--tc-border-strong);
  /* The gray layer and the white card on it: in dark the layer is a raised surface and the card an overlay */
  --tc-agent-tree-tray-bg: var(--tc-surface-tray);
  --tc-agent-tree-card-bg: var(--tc-surface-on-tray);
  --tc-agent-tree-dot-bg: var(--tc-surface-base);
  --tc-agent-tree-fold-hover-bg: light-dark(#e4e4e4, #2a2a2e);
  --tc-agent-tree-shine: light-dark(#c4c4c4, #6a6a70);
  --tc-agent-tree-card-w: 222px;
  --tc-agent-tree-indent: 24px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-space-1) 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="agt"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="agt"] {
  /* The connectors: a soft blue with hollow dots, as in the Project Flow illustration */
  --tc-agent-tree-link: light-dark(#82bcff, #4f8fdb);
  --tc-agent-tree-link-muted: var(--tc-border-strong);
  --tc-agent-tree-shine: light-dark(rgba(0, 0, 0, 0.22), rgba(255, 255, 255, 0.35));
  --tc-agent-tree-card-w: 216px;
  --tc-agent-tree-indent: 32px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="agt"] *, [data-ui="agt"] *::before, [data-ui="agt"] *::after { box-sizing: border-box; }
:where([data-ui="agt"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="agt"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="agt"] p { margin: 0; }
[data-ui="agt"] svg { display: block; flex: none; }
.ui-agt__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- The bar: title and the whole run in numbers ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agt__bar { position: relative; z-index: 3; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; margin: 0 var(--tc-space-1) var(--tc-space-4-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__bar { position: relative; z-index: 3; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; margin-bottom: var(--tc-space-4); }
.ui-agt__spark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__title { flex: none; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__sum { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); margin-left: auto; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__title { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__sum { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--tc-space-1) var(--tc-space-2-5); margin-left: auto; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-agt__sum-run { color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__sum-cost { min-width: 46px; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-semibold); text-align: right; }
/* "needs you" and "failed" open a small window to deal with them */
:where([data-look="standard"], [data-look="standard"] *).ui-agt__sum-btn { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); height: 24px; margin: -3px 0; padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2); border-radius: var(--tc-radius-badge); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); transition: filter var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__sum-cost { min-width: 44px; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-align: right; }
/* "needs you" and "failed" open a small window to deal with them */
:where([data-look="clean"], [data-look="clean"] *).ui-agt__sum-btn { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); height: 22px; margin: -3px 0; padding: 0 var(--tc-space-1) 0 var(--tc-space-2); border-radius: var(--tc-radius-badge); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-agt__sum-btn[data-kind="waiting"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-agt__sum-btn[data-kind="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-agt__sum-btn:hover { filter: saturate(1.3) brightness(0.97); }
.ui-agt__sum-btn > svg { transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-agt__sum-btn[aria-expanded="true"] > svg { transform: rotate(180deg); }
/* The window behind "needs you" and "failed": a popover on the menu recipe */
.ui-agt__pop { position: absolute; top: calc(100% + 8px); right: 0; z-index: var(--tc-z-dropdown); display: grid; gap: var(--tc-space-1); max-width: 100%; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-agt-pop var(--tc-duration-base) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop { width: 310px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-item { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-item + .ui-agt__pop-item { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop { width: 300px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-item { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2); border-radius: calc(var(--tc-menu-radius) - var(--tc-menu-padding)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-item + .ui-agt__pop-item { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 calc(var(--tc-menu-radius) - var(--tc-menu-padding)) calc(var(--tc-menu-radius) - var(--tc-menu-padding)); }
.ui-agt__pop-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-head .ui-agt__status { width: 22px; padding: 0; justify-content: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-name { flex: none; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-task { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-text { padding-left: 30px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-agt__pop-text.ui-agt__pop-error { color: var(--tc-status-danger-fg); }
.ui-agt__pop-actions[aria-busy] .ui-agt__btn { opacity: 0.6; cursor: progress; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-actions { display: flex; justify-content: flex-end; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-head .ui-agt__status { width: 20px; padding: 0; justify-content: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-name { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-task { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-text { padding-left: var(--tc-space-7); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-actions { display: flex; justify-content: flex-end; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1); }
/* Reject/Dismiss and Approve/Retry: the library's secondary and primary buttons */
.ui-agt__btn { display: inline-flex; align-items: center; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-agt__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-agt__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-agt__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-agt__btn--primary:active { background: var(--tc-action-primary-bg-active); }
/* ----- The tree ----- */
.ui-agt__tree { position: relative; display: grid; justify-items: center; }
.ui-agt__links { position: absolute; top: 0; left: 0; overflow: visible; pointer-events: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__link { fill: none; stroke: var(--tc-agent-tree-link); stroke-width: 1.75; stroke-linecap: round; transition: stroke var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__link { fill: none; stroke: var(--tc-agent-tree-link); stroke-width: 1.5; stroke-linecap: round; transition: stroke var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-agt__links [data-muted] .ui-agt__link { stroke: var(--tc-agent-tree-link-muted); }
/* A new connector draws itself from the parent */
.ui-agt__links [data-fresh] .ui-agt__link { stroke-dasharray: 1 1; stroke-dashoffset: 1; animation: ui-agt-draw var(--tc-duration-slower) var(--tc-ease-move) both; }
.ui-agt__dots { z-index: 2; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__dot { fill: var(--tc-agent-tree-dot-bg); stroke: var(--tc-agent-tree-link); stroke-width: 1.75; transition: stroke var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__dot { fill: var(--tc-surface-raised); stroke: var(--tc-agent-tree-link); stroke-width: 1.5; transition: stroke var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-agt__dot[data-muted] { stroke: var(--tc-agent-tree-link-muted); }
/* Wide: the first level side by side under the root, each with its branch hanging below */
.ui-agt__entry { display: contents; }
.ui-agt__root { position: relative; z-index: 1; }
.ui-agt__level { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: center; gap: var(--tc-space-2); width: 100%; margin-top: var(--tc-space-10); }
/* Every column as wide as a card plus its indent, and the root over the middle of the cards – so an odd middle connector runs straight down */
.ui-agt__level > .ui-agt__hang { flex: none; width: calc(var(--tc-agent-tree-card-w) + var(--tc-agent-tree-indent)); }
[data-ui="agt"][data-wide] .ui-agt__root:has(+ .ui-agt__level) { margin-right: var(--tc-agent-tree-indent); }
.ui-agt__hang { display: grid; align-content: start; gap: var(--tc-space-3); }
.ui-agt__below { display: grid; gap: var(--tc-space-3); padding-left: var(--tc-agent-tree-indent); }
[data-ui="agt"]:not([data-wide]) .ui-agt__tree { justify-items: stretch; }
[data-ui="agt"]:not([data-wide]) .ui-agt__tree { container-type: inline-size; }
/* Every card is as wide as the others: a fixed width side by side, and room for the deepest level when indented */
.ui-agt__node { width: var(--tc-agent-tree-card-w); }
[data-ui="agt"]:not([data-wide]) .ui-agt__node { width: calc(100cqw - var(--tc-agent-tree-depth, 0) * var(--tc-agent-tree-indent)); }
[data-ui="agt"]:not([data-wide]) .ui-agt__level { display: grid; gap: var(--tc-space-3); margin-top: var(--tc-space-3); padding-left: var(--tc-agent-tree-indent); }
/* Narrow: the first level is a plain indented list – no fixed column width, no centering */
[data-ui="agt"]:not([data-wide]) .ui-agt__level { justify-content: stretch; }
[data-ui="agt"]:not([data-wide]) .ui-agt__level > .ui-agt__hang { width: auto; }
/* One agent: the gray tray with a white card on it, like every component of the library */
:where([data-look="standard"], [data-look="standard"] *).ui-agt__node { position: relative; display: grid; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-agent-tree-tray-bg); animation: ui-agt-rise var(--tc-duration-slow) var(--tc-ease-move) both; transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__card { display: grid; gap: var(--tc-space-1-5); min-width: 0; padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5); border-radius: var(--tc-card-radius); background: var(--tc-agent-tree-card-bg); box-shadow: var(--tc-card-shadow); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
/* Leaving: the card fades and sinks a little, its connector pulls back into the parent */
.ui-agt__node[data-leaving] { animation: ui-agt-leave var(--tc-duration-moderate) var(--tc-ease-move) forwards; pointer-events: none; }
.ui-agt__links [data-leaving] .ui-agt__link { stroke-dasharray: 1 1; stroke-dashoffset: 0; animation: ui-agt-retract var(--tc-duration-moderate) var(--tc-ease-move) forwards; }
/* One agent: a small white card */
:where([data-look="clean"], [data-look="clean"] *).ui-agt__node { position: relative; display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2); border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); animation: ui-agt-rise var(--tc-duration-slow) var(--tc-ease-move) both; transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-agt__dot[data-leaving] { animation: ui-agt-fade var(--tc-duration-moderate) var(--tc-ease-standard) forwards; }
.ui-agt__node[data-clickable] { cursor: pointer; }
/* The name is the card's keyboard target; the ring goes round the whole card */
.ui-agt__select { display: block; justify-self: start; min-width: 0; max-width: 100%; }
[data-ui="agt"] .ui-agt__select:focus-visible { outline: none; }
.ui-agt__node:has(.ui-agt__select:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__node[data-clickable]:hover .ui-agt__card { box-shadow: var(--tc-card-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__node[data-clickable]:hover { box-shadow: var(--tc-card-shadow-hover); }
/* Queued and stopped agents step back – the marks fade, the text stays readable */
.ui-agt__node:is([data-status="queued"], [data-status="stopped"]) :is(.ui-agt__avatar, .ui-agt__tools) { opacity: 0.6; }
.ui-agt__top { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__avatar { display: grid; flex: none; place-items: center; width: var(--tc-avatar-md); height: var(--tc-avatar-md); border-radius: var(--tc-radius-md); background: var(--tc-agent-tree-card-bg); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__avatar[data-logo] > svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__avatar { display: grid; flex: none; place-items: center; width: 22px; height: 22px; border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__avatar[data-logo] > svg { width: 13px; height: 13px; }
.ui-agt__who { display: grid; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__name { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__name { overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
/* The tools: small white tiles, each slightly over the one before */
.ui-agt__tools { display: inline-flex; margin-right: var(--tc-space-1-5); vertical-align: top; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__tool { display: grid; flex: none; place-items: center; width: 17px; height: 17px; border-radius: var(--tc-radius-xs); background: var(--tc-agent-tree-card-bg); box-shadow: var(--tc-shadow-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__tool + .ui-agt__tool { margin-left: -5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__tool { display: grid; flex: none; place-items: center; width: 16px; height: 16px; border-radius: var(--tc-radius-xs); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__tool + .ui-agt__tool { margin-left: -4px; }
.ui-agt__tool > svg { width: 10px; height: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__model { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__model { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* Status: an icon and the word on a subtle tone – the pill recipe */
.ui-agt__status { display: inline-flex; flex: none; align-self: start; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px) 0 calc(var(--tc-pill-px) - 2px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__status { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__status { color: var(--tc-text-secondary); }
.ui-agt__status[data-status="running"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-agt__spin { animation: ui-agt-spin var(--tc-duration-reveal-slow) linear infinite; }
.ui-agt__status[data-status="waiting"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-agt__status[data-status="done"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-agt__status[data-status="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* A little room around the text, so the tiles' hairline and shadow aren't clipped by the line clamp */
:where([data-look="standard"], [data-look="standard"] *).ui-agt__task { display: -webkit-box; overflow: hidden; margin: -2px -2px -3px !important; padding: var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__meta { display: flex; align-items: center; gap: var(--tc-space-1-5); min-height: 30px; padding: 0 var(--tc-space-1) 0 var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__cost { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__task { display: -webkit-box; overflow: hidden; margin: -2px -2px -3px !important; padding: var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__meta { display: flex; align-items: center; gap: var(--tc-space-1-5); min-height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__cost { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* Costs that still climb: a light shine runs over the amount a few times, then rests (off screen it pauses) */
.ui-agt__amount[data-live] {
  background: linear-gradient(90deg, currentColor 0%, currentColor 38%, var(--tc-agent-tree-shine) 50%, currentColor 62%, currentColor 100%) 0 0 / 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ui-agt-shine var(--tc-duration-shimmer) linear 3;
}
.ui-agt__tree[data-offscreen] * { animation-play-state: paused !important; }
.ui-agt__time { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__fold { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-0-5); height: 24px; margin-right: -2px; padding: 0 var(--tc-space-1) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__fold:hover { background: var(--tc-agent-tree-fold-hover-bg); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__fold { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-0-5); height: 20px; padding: 0 var(--tc-space-1) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__fold:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-agt__fold > svg { transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-agt__fold[aria-expanded="false"] > svg { transform: rotate(-90deg); }
@keyframes ui-agt-shine { from { background-position: 100% 0; } to { background-position: 0 0; } }
@keyframes ui-agt-draw { to { stroke-dashoffset: 0; } }
@keyframes ui-agt-retract { to { stroke-dashoffset: 1; } }
@keyframes ui-agt-leave { to { opacity: 0; transform: translateY(4px) scale(0.97); } }
@keyframes ui-agt-fade { to { opacity: 0; } }
@keyframes ui-agt-rise { from { opacity: 0; transform: translateY(6px) scale(0.98); } }
@keyframes ui-agt-spin { to { transform: rotate(360deg); } }
@keyframes ui-agt-pop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-agt__fold { height: 32px; padding: 0 var(--tc-space-2-5) 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__fold { height: 32px; padding: 0 var(--tc-space-2) 0 var(--tc-space-2-5); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="agt"] *, [data-ui="agt"] *::before, [data-ui="agt"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-agent-tree")) customElements.define("tc-agent-tree", TcAgentTree);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-tree": TcAgentTree;
  }
}

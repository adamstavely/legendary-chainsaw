import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";

/*
 * <tc-memory-panel> – the Lit port of src/components/memory-panel.tsx: what an AI assistant remembers about someone,
 * and a calm place to change it. Memories are short facts grouped by category, each with where it came from.
 *   · a master switch turns memory off: the list dims and a short note unfolds under the head
 *   · category chips (and a small search) filter the list – rows fold away instead of jumping
 *   · hover a memory for its actions: edit the text in place, pause it or forget it
 *   · a forgotten memory folds away and the tray offers Undo for a few seconds
 *   · "New memory" at the bottom unfolds into an inline editor with a category picker
 *   · the tray line counts memories and paused ones with rolling numbers and says what you are pointing at
 *
 *   <tc-memory-panel .memories=${memories} .categories=${["Work", "Preferences"]}></tc-memory-panel>
 *
 * Every change to the list fires a cancelable `tc-memories-change` with the whole list, applied unless prevented; the
 * switch fires a cancelable `tc-enabled-change`. The granular callbacks (onAdd, onEdit, onPause, onForget, onRestore)
 * are function properties: each may return a promise – the row waits while it runs and a rejection rolls the change
 * back and says so on the tray. The host is the group, named by the heading.
 */

export type Memory = {
  id: string;
  /** The remembered fact, one short sentence */
  text: string;
  /** Group of the memory, e.g. "Work", "Preferences", "Projects" */
  category: string;
  /** Where it came from, ready to show, e.g. "From chat" */
  source?: string;
  /** When it was learned, ready to show, e.g. "Oct 12" */
  date?: string;
  /** Kept, but not used in answers */
  paused?: boolean;
};

/** A granular callback's result: a promise makes the row wait, and its rejection rolls the change back */
export type MemoryCallbackResult = void | Promise<unknown>;

/* ---------- Helpers ---------- */

const isPromise = (value: unknown): value is Promise<unknown> => !!value && typeof (value as Promise<unknown>).then === "function";
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const today = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
const newId = () => `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
/** Textareas grow with their text */
const grow = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};
/** Arrow keys (and Home / End with `ends`) move through a radio group: the index of the option to go to, or -1 */
const radioStep = (e: KeyboardEvent, at: number, count: number, ends = false) => {
  if (ends && e.key === "Home") return 0;
  if (ends && e.key === "End") return count - 1;
  if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return -1;
  return (at + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + count) % count;
};

/** Sets data-more on a sideways-scrolling row while more content hides past its right edge (the port of useMore) */
class MoreWatcher {
  private ro: ResizeObserver;
  private mo: MutationObserver;
  constructor(private row: HTMLElement) {
    this.ro = new ResizeObserver(this.check);
    this.ro.observe(row);
    this.mo = new MutationObserver(this.check);
    this.mo.observe(row, { childList: true, subtree: true, characterData: true });
    row.addEventListener("scroll", this.check, { passive: true });
    this.check();
  }
  check = () => this.row.toggleAttribute("data-more", this.row.scrollLeft + this.row.clientWidth < this.row.scrollWidth - 1);
  stop() {
    this.ro.disconnect();
    this.mo.disconnect();
    this.row.removeEventListener("scroll", this.check);
  }
}

/* ---------- Icons ---------- */

type IconName = "edit" | "pause" | "play" | "forget" | "undo" | "plus" | "search" | "close" | "info" | "arrow";
/* Standard: 14px outline icons */
const ln = (d: string, w = 1.4) => svg`<path d=${d} stroke="currentColor" stroke-width=${w} stroke-linecap="round" stroke-linejoin="round"></path>`;
const box = (children: TemplateResult, size = 14) => html`<svg width=${size} height=${size} viewBox="0 0 14 14" fill="none" aria-hidden="true">${children}</svg>`;
const standardIcons: Record<IconName, TemplateResult> = {
  edit: box(ln("M8.6 3.1 10.9 5.4M2.8 11.2l.5-2.6 6-6a1.2 1.2 0 0 1 1.7 0l.6.6a1.2 1.2 0 0 1 0 1.7l-6 6-2.8.3Z")),
  pause: box(ln("M5.3 3.8v6.4M8.7 3.8v6.4", 1.6)),
  play: box(ln("M4.8 3.6v6.8a.4.4 0 0 0 .6.3l5.2-3.4a.4.4 0 0 0 0-.6L5.4 3.3a.4.4 0 0 0-.6.3Z")),
  forget: box(ln("M2.8 4.2h8.4M5.6 4.2V3a.8.8 0 0 1 .8-.8h1.2a.8.8 0 0 1 .8.8v1.2M3.9 4.2l.5 6.6a1 1 0 0 0 1 .9h3.2a1 1 0 0 0 1-.9l.5-6.6")),
  undo: box(ln("M4.6 2.8 2.4 5l2.2 2.2M2.6 5h5.6a3.2 3.2 0 0 1 0 6.4H6"), 12),
  plus: box(ln("M7 3v8M3 7h8")),
  search: box(svg`<circle cx="6.2" cy="6.2" r="3.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></circle>${ln("m8.9 8.9 2.4 2.4")}`),
  close: box(ln("m4 4 6 6m0-6-6 6"), 12),
  info: box(svg`<circle cx="7" cy="7" r="5.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></circle>${ln("M7 6.4v3M7 4.6v.01", 1.6)}`),
  arrow: box(ln("M2.5 7h8M7.5 4l3 3-3 3"), 12),
};
/* Clean: 16px, thin 1.1px lines with round caps – or solid shapes */
const glyph = (d: string, solid = false) =>
  html`<svg viewBox="0 0 16 16" class="ui-mp__glyph" ?data-solid=${solid} aria-hidden="true">${svg`<path d=${d} fill-rule="evenodd"></path>`}</svg>`;
const cleanIcons: Record<IconName, TemplateResult> = {
  edit: glyph("M9.8 3.7l2.5 2.5M3 13l.6-3 6.9-6.9a1.4 1.4 0 0 1 2 0l.4.4a1.4 1.4 0 0 1 0 2L6 12.4 3 13Z"),
  pause: glyph("M4.5 3.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-9Zm4 0a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-9Z", true),
  play: glyph("M4.5 3.4v9.2a.9.9 0 0 0 1.37.77l7.4-4.6a.9.9 0 0 0 0-1.54l-7.4-4.6a.9.9 0 0 0-1.37.77Z", true),
  forget: glyph("M2.5 4.5h11M6.5 4.5V3.2a.7.7 0 0 1 .7-.7h1.6a.7.7 0 0 1 .7.7v1.3M4 4.5l.6 8a1.1 1.1 0 0 0 1.1 1h4.6a1.1 1.1 0 0 0 1.1-1l.6-8M6.8 7.2v3.6M9.2 7.2v3.6"),
  undo: glyph("M5.5 3.5 3 6l2.5 2.5M3.2 6h6.3a3.5 3.5 0 0 1 0 7H7"),
  plus: glyph("M8 3.5v9M3.5 8h9"),
  search: glyph("M7.2 11.9a4.7 4.7 0 1 0 0-9.4 4.7 4.7 0 0 0 0 9.4ZM10.6 10.6l2.9 2.9"),
  close: glyph("m4.5 4.5 7 7m0-7-7 7"),
  info: glyph("M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 5.4a.6.6 0 0 0-.6.6v3.6a.6.6 0 0 0 1.2 0V7.5a.6.6 0 0 0-.6-.6Zm0-2.3a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z", true),
  arrow: glyph("M3.5 8h9M9 4.5 12.5 8 9 11.5"),
};

type Line = { id: string; node: TemplateResult | string };
type Counts = { total: number; paused: number };
let uidCount = 0;

/**
 * What an assistant remembers – grouped memories with filters, search, in-place editing, pause, forget with Undo, and
 * a master switch.
 * @tag tc-memory-panel
 * @fires tc-memories-change - The list changed (added, edited, paused, forgotten, restored or rolled back); detail
 *   `{ memories: Memory[] }`. Cancelable: preventDefault() keeps the change out until the app passes the list back.
 * @fires tc-enabled-change - The master switch was flipped; detail `{ enabled: boolean }`. Cancelable.
 * @fires tc-action - The action button (`actionLabel`) was pressed
 */
export class TcMemoryPanel extends TcElement {
  static override ui = "mp";

  @property({ attribute: false }) accessor memories: Memory[] = [];
  /** The master switch */
  @property({ type: Boolean }) accessor enabled = true;
  /** Order of the groups and the choices for new memories – defaults to the categories in the order they appear */
  @property({ attribute: false }) accessor categories: string[] | undefined = undefined;
  /** The heading, and the group's name */
  @property() accessor heading = "Memory";
  /** Height of the list before it scrolls, in px */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 360;
  /**
   * How long Undo stays on the tray (Clean: in the card's last row), in ms. It waits while the pointer or focus is on
   * the tray and starts over after; `Infinity` keeps it until the next forget (WCAG 2.2.1)
   */
  @property({ type: Number, attribute: "undo-for" }) accessor undoFor = 5000;
  /** Source given to memories added here */
  @property({ attribute: "added-source" }) accessor addedSource = "You added";
  /** A button on the tray that fires tc-action – Undo takes its place for a moment */
  @property({ attribute: "action-label" }) accessor actionLabel = "";
  /** Called with a memory added here */
  @property({ attribute: false }) accessor onAdd: ((memory: Memory) => MemoryCallbackResult) | undefined = undefined;
  /** Called when a memory's text was edited */
  @property({ attribute: false }) accessor onEdit: ((id: string, text: string) => MemoryCallbackResult) | undefined = undefined;
  /** Called when a memory was paused or resumed */
  @property({ attribute: false }) accessor onPause: ((id: string, paused: boolean) => MemoryCallbackResult) | undefined = undefined;
  /** Called when a memory was forgotten */
  @property({ attribute: false }) accessor onForget: ((id: string) => MemoryCallbackResult) | undefined = undefined;
  /** Called when a forgotten memory is brought back with Undo */
  @property({ attribute: false }) accessor onRestore: ((memory: Memory) => MemoryCallbackResult) | undefined = undefined;

  /** @internal Rows whose call is still running, with how many */
  @state() accessor saving: Record<string, number> = {};
  /** @internal A failed call, said on the tray */
  @state() accessor failed: { text: string; key: number } | null = null;
  /** @internal Rows folding away before they go */
  @state() accessor leaving: Record<string, true> = {};
  /** @internal Rows that just arrived: closed once, unfolded on the next frame */
  @state() accessor born: Record<string, true> = {};
  /** @internal */
  @state() accessor filter: string | null = null;
  /** @internal */
  @state() accessor searching = false;
  /** @internal */
  @state() accessor query = "";
  /** @internal */
  @state() accessor hot: string | null = null;
  /** @internal */
  @state() accessor editing: string | null = null;
  /** @internal */
  @state() accessor draft = "";
  /** @internal */
  @state() accessor adding = false;
  /** @internal */
  @state() accessor newText = "";
  /** @internal */
  @state() accessor newCat: string | null = null;
  /** @internal */
  @state() accessor forgot: { memory: Memory; index: number; key: number } | null = null;
  /** @internal Undo waits while the pointer or focus is on the tray */
  @state() accessor holdUndo = { hover: false, focus: false };
  /** @internal The counts as rendered – they change when a roll starts and ends; frames are written into the DOM */
  @state() accessor shownCounts: Counts | null = null;
  /** @internal The caption line fading out underneath the new one */
  @state() accessor swapOut: Line | null = null;

  private uid = `tc-mp-${++uidCount}`;
  /** The list as last committed – the property, or a change not passed back yet */
  private latest: Memory[] = [];
  private failures = 0;
  private forgets = 0;
  private failedTimer = 0;
  private forgotTimer = 0;
  private forgotTimerFor = "";
  private bornFrames: number[] = [];
  private reveal: string | null = null;
  private revealTimer = 0;
  private swapTimer = 0;
  private swapLine: Line | null = null;
  private rollCurrent: Counts | null = null;
  private rollSignature = "";
  private rollFrame = 0;
  private watchers = new Map<Element, MoreWatcher>();
  private ownName = false;

  constructor() {
    super();
    // Whatever takes the focused control away (a row folding, a button turning off) – focus goes to New memory
    new FocusRescueController(this, () => this.querySelector(".ui-mp__add"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= this.hasAttribute("aria-label") || (this.hasAttribute("aria-labelledby") && this.getAttribute("aria-labelledby") !== `${this.uid}-title`);
    if (!this.ownName) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    for (const t of [this.failedTimer, this.forgotTimer, this.revealTimer, this.swapTimer]) window.clearTimeout(t);
    this.forgotTimerFor = "";
    this.bornFrames.forEach((f) => cancelAnimationFrame(f));
    cancelAnimationFrame(this.rollFrame);
    this.rollFrame = 0;
    this.watchers.forEach((w) => w.stop());
    this.watchers.clear();
  }

  /* ---------- Derived ---------- */

  private get groups() {
    const groups = [...(this.categories ?? [])];
    for (const m of this.memories) if (!groups.includes(m.category)) groups.push(m.category);
    return groups;
  }
  private get present() {
    return this.memories.filter((m) => !this.leaving[m.id]);
  }
  private shows(m: Memory) {
    const q = this.query.trim().toLowerCase();
    return (!this.filter || m.category === this.filter) && (!q || m.text.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("memories")) this.latest = this.memories;
    this.toggleAttribute("data-off", !this.enabled);
    this.style.setProperty("--tc-memory-panel-max", `${this.maxHeight}px`);
    // The counts roll: `shownCounts` holds where a roll starts and ends; frames are painted into the DOM
    const present = this.present;
    const target = { total: present.length, paused: present.filter((m) => m.paused).length };
    const signature = JSON.stringify(target);
    if (signature !== this.rollSignature) {
      this.rollSignature = signature;
      this.roll(target);
    }
    // The caption: when it says something else, the old line fades out underneath for a moment
    const line = this.trayLine();
    const before = this.swapLine;
    if (before && before.id !== line.id) {
      this.swapOut = before;
      window.clearTimeout(this.swapTimer);
      this.swapTimer = window.setTimeout(() => (this.swapOut = null), 260);
    }
    this.swapLine = line;
  }

  protected override updated(changed: PropertyValues) {
    // A render in the middle of a roll shows where it started – put the frame's values back
    this.paint();
    // Chip rows fade at their right edge only while more chips hide past it
    const rows = new Set(this.querySelectorAll(".ui-mp__chips, .ui-mp__cats"));
    for (const [row, w] of this.watchers) {
      if (rows.has(row)) continue;
      w.stop();
      this.watchers.delete(row);
    }
    if (typeof ResizeObserver === "function") {
      for (const row of rows) if (!this.watchers.has(row)) this.watchers.set(row, new MoreWatcher(row as HTMLElement));
    }
    for (const t of this.querySelectorAll<HTMLTextAreaElement>("textarea")) grow(t);
    // Focus moves into what just opened
    if (changed.has("searching") && this.searching) this.querySelector<HTMLElement>(".ui-mp__search .ui-mp__input")?.focus({ preventScroll: true });
    if (changed.has("adding") && this.adding) this.querySelector<HTMLElement>(".ui-mp__edit--new")?.focus({ preventScroll: true });
    if (changed.has("editing") && this.editing) {
      const t = this.querySelector<HTMLTextAreaElement>(`[data-memory="${CSS.escape(this.editing)}"] .ui-mp__edit`);
      t?.focus({ preventScroll: true });
      t?.setSelectionRange(t.value.length, t.value.length);
    }
    // Rows that just arrived unfold on the next frame; then the list scrolls to the one `reveal` names
    if (changed.has("born")) {
      this.bornFrames.forEach((f) => cancelAnimationFrame(f));
      this.bornFrames = [];
      if (Object.keys(this.born).length) {
        this.bornFrames.push(requestAnimationFrame(() => this.bornFrames.push(requestAnimationFrame(() => (this.born = {})))));
      } else if (this.reveal) {
        const id = this.reveal;
        this.reveal = null;
        window.clearTimeout(this.revealTimer);
        this.revealTimer = window.setTimeout(() => {
          const list = this.querySelector<HTMLElement>(".ui-mp__list");
          const row = list?.querySelector<HTMLElement>(`[data-memory="${CSS.escape(id)}"]`);
          if (!list || !row) return;
          const top = row.offsetTop - list.offsetTop;
          if (top < list.scrollTop || top + row.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTo({ top: top - 8, behavior: reducedMotion() ? "auto" : "smooth" });
        }, 120);
      }
    }
    // Undo stays for `undoFor` – the clock stops while the tray is held, and starts over after
    const held = this.holdUndo.hover || this.holdUndo.focus;
    const want = this.forgot && !held && Number.isFinite(this.undoFor) ? `${this.forgot.key}:${this.undoFor}` : "";
    if (want !== this.forgotTimerFor) {
      window.clearTimeout(this.forgotTimer);
      this.forgotTimerFor = want;
      if (want) this.forgotTimer = window.setTimeout(() => (this.forgot = null), this.undoFor);
    }
  }

  /* ---------- Rolling counts ---------- */

  private roll(to: Counts) {
    cancelAnimationFrame(this.rollFrame);
    const from = this.rollCurrent ?? to;
    if (!this.rollCurrent || reducedMotion() || (from.total === to.total && from.paused === to.paused)) {
      this.rollCurrent = to;
      this.shownCounts = to;
      return;
    }
    this.shownCounts = { ...from };
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 520);
      const e = easeOutQuart(t);
      this.rollCurrent = { total: from.total + (to.total - from.total) * e, paused: from.paused + (to.paused - from.paused) * e };
      this.paint();
      if (t < 1) this.rollFrame = requestAnimationFrame(step);
      else {
        this.rollFrame = 0;
        this.shownCounts = to;
      }
    };
    this.rollFrame = requestAnimationFrame(step);
  }

  /** Writes the rolling values into each `[data-roll]` text (not into lines fading out) */
  private paint() {
    const current = this.rollCurrent;
    if (!current) return;
    this.querySelectorAll<HTMLElement>("[data-roll]").forEach((n) => {
      const value = current[n.dataset.roll as keyof Counts];
      const text = [...n.childNodes].find((c) => c.nodeType === Node.TEXT_NODE);
      if (value === undefined || !text || n.closest("[data-out]")) return;
      const next = String(Math.round(value));
      if (text.nodeValue !== next) text.nodeValue = next;
    });
  }

  /* ---------- Changes ---------- */

  private commit(next: Memory[]) {
    this.latest = next;
    if (this.emit("tc-memories-change", { memories: next }, { cancelable: true })) this.memories = next;
  }

  /** A granular call that returned a promise: the row waits, and a rejection rolls back and says so on the tray */
  private track(id: string, result: unknown, rollback: () => void, what: string) {
    if (!isPromise(result)) return;
    const bump = (by: number) => {
      const { [id]: count = 0, ...others } = this.saving;
      this.saving = count + by > 0 ? { ...others, [id]: count + by } : others;
    };
    bump(1);
    result.then(
      () => this.isConnected && bump(-1),
      () => {
        if (!this.isConnected) return;
        bump(-1);
        rollback();
        this.failed = { text: `Couldn't ${what}. Try again.`, key: ++this.failures };
        window.clearTimeout(this.failedTimer);
        if (Number.isFinite(this.undoFor)) this.failedTimer = window.setTimeout(() => (this.failed = null), this.undoFor);
      },
    );
  }

  private setEnabled(next: boolean) {
    if (this.emit("tc-enabled-change", { enabled: next }, { cancelable: true })) this.enabled = next;
  }

  private async forget(m: Memory) {
    if (this.leaving[m.id]) return;
    // The row goes inert as it folds: focus moves first – to the next memory's Forget, the one before, or New memory
    const rows = [...this.querySelectorAll<HTMLElement>("[data-memory]")].filter((r) => !r.closest("[inert]"));
    const at = rows.findIndex((r) => r.dataset.memory === m.id);
    const forgetOf = (r?: HTMLElement) => r?.querySelector<HTMLElement>('[data-act="forget"]');
    rescueFocus(rows[at], [forgetOf(rows[at + 1]), forgetOf(rows[at - 1]), this.querySelector(".ui-mp__add")]);
    if (this.editing === m.id) this.editing = null;
    this.hot = null;
    this.leaving = { ...this.leaving, [m.id]: true };
    if (!reducedMotion()) await wait(320);
    if (!this.isConnected) return;
    const index = this.latest.findIndex((x) => x.id === m.id);
    this.commit(this.latest.filter((x) => x.id !== m.id));
    const forgetting = this.onForget?.(m.id);
    const { [m.id]: _gone, ...others } = this.leaving;
    this.leaving = others;
    const key = ++this.forgets;
    this.forgot = { memory: m, index, key };
    this.track(
      m.id,
      forgetting,
      () => {
        if (this.forgot?.key === key) this.forgot = null;
        if (this.latest.some((x) => x.id === m.id)) return;
        const next = [...this.latest];
        next.splice(Math.max(0, Math.min(index, next.length)), 0, m);
        this.born = { [m.id]: true };
        this.commit(next);
      },
      "forget it",
    );
  }

  private undo() {
    const forgot = this.forgot;
    if (!forgot) return;
    const { memory, index } = forgot;
    const next = [...this.latest];
    next.splice(Math.max(0, Math.min(index, next.length)), 0, memory);
    this.born = { [memory.id]: true };
    this.reveal = memory.id;
    if (this.filter && this.filter !== memory.category) this.filter = null;
    this.commit(next);
    const restoring = this.onRestore?.(memory);
    this.forgot = null;
    // Undo goes away – focus lands on the memory it brought back (once it has unfolded)
    requestAnimationFrame(() => this.refocus(`[data-memory="${CSS.escape(memory.id)}"] [data-act="forget"]`));
    this.track(memory.id, restoring, () => this.commit(this.latest.filter((x) => x.id !== memory.id)), "bring it back");
  }

  private togglePause(m: Memory) {
    const paused = !m.paused;
    this.commit(this.latest.map((x) => (x.id === m.id ? { ...x, paused } : x)));
    this.track(
      m.id,
      this.onPause?.(m.id, paused),
      () => this.commit(this.latest.map((x) => (x.id === m.id && !!x.paused === paused ? { ...x, paused: !paused } : x))),
      paused ? "pause it" : "resume it",
    );
  }

  /** Back to a button after an editor closes, so the keyboard keeps its place */
  private refocus(selector: string) {
    requestAnimationFrame(() => this.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true }));
  }

  private startEdit(m: Memory) {
    this.adding = false;
    this.draft = m.text;
    this.editing = m.id;
  }
  private saveEdit() {
    const id = this.editing;
    const text = this.draft.trim().replace(/\s+/g, " ");
    this.editing = null;
    if (!id) return;
    const before = this.latest.find((x) => x.id === id);
    if (!before || !text || text === before.text) return;
    this.commit(this.latest.map((x) => (x.id === id ? { ...x, text } : x)));
    this.track(id, this.onEdit?.(id, text), () => this.commit(this.latest.map((x) => (x.id === id && x.text === text ? { ...x, text: before.text } : x))), "save the edit");
    this.refocus(`[data-memory="${CSS.escape(id)}"] [data-act="edit"]`);
  }
  private cancelEdit() {
    const id = this.editing;
    this.editing = null;
    if (id) this.refocus(`[data-memory="${CSS.escape(id)}"] [data-act="edit"]`);
  }

  private get addCategory() {
    return this.newCat ?? this.filter ?? this.groups[0] ?? "General";
  }
  private openAdd() {
    this.editing = null;
    this.newText = "";
    this.newCat = this.filter ?? this.groups[0] ?? "General";
    this.adding = true;
  }
  private closeAdd() {
    this.adding = false;
    this.refocus(".ui-mp__add");
  }
  private saveAdd() {
    const text = this.newText.trim().replace(/\s+/g, " ");
    if (!text) return;
    const memory: Memory = { id: newId(), text, category: this.addCategory, source: this.addedSource, date: today() };
    this.born = { [memory.id]: true };
    this.reveal = memory.id;
    if (this.filter && this.filter !== memory.category) this.filter = null;
    if (this.query.trim()) this.query = "";
    this.commit([...this.latest, memory]);
    this.track(memory.id, this.onAdd?.(memory), () => this.commit(this.latest.filter((x) => x.id !== memory.id)), "save the memory");
    this.newText = "";
    this.closeAdd();
  }

  private closeSearch() {
    this.searching = false;
    this.query = "";
    this.refocus(".ui-mp__search-open");
  }

  /* ---------- What the tray says ---------- */

  /** By priority: a failure, Undo after forgetting, editing hints, the memory pointed at, the counts */
  private trayLine(): Line {
    const { failed, forgot } = this;
    const on = this.enabled;
    const hotMemory = this.memories.find((m) => m.id === this.hot) ?? null;
    if (failed) return { id: `failed-${failed.key}`, node: failed.text };
    if (forgot)
      return {
        id: `forgot-${forgot.key}`,
        node: html`<span class="ui-mp__forgot"><span class="ui-mp__flat">Forgot “</span><b class="ui-mp__quote">${forgot.memory.text}</b><span class="ui-mp__flat">”</span></span>`,
      };
    if (this.editing) return { id: "editing", node: "Enter to save · Esc to cancel" };
    if (this.adding) return { id: "adding", node: "Pick a category · Enter to save" };
    if (hotMemory)
      return {
        id: `hot-${hotMemory.id}-${hotMemory.paused ? 1 : 0}-${on ? 1 : 0}`,
        node: html`<b>${hotMemory.category}</b> · ${!on ? "memory is off" : hotMemory.paused ? "paused, not used in answers" : "used in answers"}`,
      };
    if (!on) return { id: "off", node: "Memory is off" };
    const { total, paused } = this.counts();
    return {
      id: "rest",
      node: html`<b data-roll="total">${total}</b> ${total === 1 ? "memory" : "memories"}${paused > 0 ? html` · <span data-roll="paused">${paused}</span> paused` : nothing}`,
    };
  }

  /** The counts as rendered: where the roll starts or ends */
  private counts(): Counts {
    const present = this.present;
    const pausedCount = present.filter((m) => m.paused).length;
    const shown = this.shownCounts;
    return { total: Math.round(shown?.total ?? present.length), paused: Math.round(Math.max(shown?.paused ?? 0, pausedCount)) };
  }

  /* ---------- Parts ---------- */

  private filters(icons: Record<IconName, TemplateResult>, chips: (string | null)[], counts: number[], linked: string | null) {
    const searching = this.searching;
    // Chips move with the arrow keys like any radio group
    const onChipsKey = (e: KeyboardEvent) => {
      const next = radioStep(e, chips.indexOf(this.filter), chips.length, true);
      if (next < 0) return;
      e.preventDefault();
      this.filter = chips[next];
      const buttons = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[role='radio']");
      buttons[next]?.focus();
      buttons[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    return html`<div class="ui-mp__filters" ?data-searching=${searching}>
      <div class="ui-mp__chips" role="radiogroup" aria-label="Category" .inert=${searching} @keydown=${onChipsKey}>
        ${chips.map((c, i) => {
          const checked = this.filter === c;
          return html`<button
            type="button"
            role="radio"
            aria-checked=${checked ? "true" : "false"}
            tabindex=${checked ? 0 : -1}
            class="ui-mp__chip"
            ?data-linked=${!!c && linked === c}
            @click=${() => (this.filter = c)}
          >${c ?? "All"}<span class="ui-mp__chip-count">${counts[i]}</span></button>`;
        })}
      </div>
      <div class="ui-mp__search" .inert=${!searching}>
        ${icons.search}
        <input
          class="ui-mp__input"
          type="text"
          .value=${this.query}
          placeholder="Search memories"
          aria-label="Search memories"
          @input=${(e: Event) => (this.query = (e.target as HTMLInputElement).value)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              this.closeSearch();
            }
          }}
        />
        <button type="button" class="ui-mp__icon" aria-label="Close search" @click=${() => this.closeSearch()}>${icons.close}</button>
      </div>
      <button
        type="button"
        class="ui-mp__icon ui-mp__search-open"
        aria-label="Search memories"
        aria-expanded=${searching ? "true" : "false"}
        .inert=${searching}
        @click=${() => {
          this.filter = null;
          this.searching = true;
        }}
      >
        ${icons.search}
      </button>
    </div>`;
  }

  /** One memory: its text (or the editor), where it came from, Paused, and the actions on hover */
  private item(m: Memory, icons: Record<IconName, TemplateResult>) {
    const editing = this.editing === m.id;
    const pending = !!this.saving[m.id];
    return html`<div
      class="ui-mp__item"
      data-memory=${m.id}
      ?data-paused=${!!m.paused}
      ?data-hot=${this.hot === m.id}
      ?data-editing=${editing}
      ?data-pending=${pending}
      aria-busy=${ifDefined(pending ? "true" : undefined)}
      @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hot = m.id)}
      @focusin=${() => (this.hot = m.id)}
      @focusout=${(e: FocusEvent) => {
        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) this.hot = null;
      }}
    >
      ${editing
        ? html`<textarea
            class="ui-mp__edit"
            .value=${this.draft}
            rows="1"
            aria-label="Edit memory"
            @input=${(e: Event) => {
              this.draft = (e.target as HTMLTextAreaElement).value;
              grow(e.target as HTMLTextAreaElement);
            }}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                this.saveEdit();
              } else if (e.key === "Escape") {
                e.stopPropagation();
                this.cancelEdit();
              }
            }}
          ></textarea>`
        : html`<p class="ui-mp__text">${m.text}</p>`}
      <div class="ui-mp__meta">
        <span class="ui-mp__source">${m.source}${m.source && m.date ? html`<span class="ui-mp__dot"> · </span>` : nothing}${m.date}</span>
        <span class="ui-mp__tag" ?data-on=${!!m.paused} aria-hidden=${m.paused ? "false" : "true"}>Paused</span>
        ${editing
          ? html`<span class="ui-mp__acts ui-mp__acts--edit">
              <button type="button" class="ui-mp__text-btn" @click=${() => this.cancelEdit()}>Cancel</button>
              <button type="button" class="ui-mp__text-btn ui-mp__text-btn--main" @click=${() => this.saveEdit()}>Save</button>
            </span>`
          : html`<span class="ui-mp__acts">
              <button type="button" class="ui-mp__icon" data-act="edit" aria-label=${`Edit “${m.text}”`} title="Edit" @click=${() => this.startEdit(m)}>${icons.edit}</button>
              <button
                type="button"
                class="ui-mp__icon"
                data-act="pause"
                aria-label=${`${m.paused ? "Resume" : "Pause"} “${m.text}”`}
                title=${m.paused ? "Resume" : "Pause"}
                @click=${() => this.togglePause(m)}
              >
                ${keyed(m.paused ? "play" : "pause", html`<span class="ui-mp__icon-swap">${m.paused ? icons.play : icons.pause}</span>`)}
              </button>
              <button type="button" class="ui-mp__icon ui-mp__icon--forget" data-act="forget" aria-label=${`Forget “${m.text}”`} title="Forget" @click=${() => void this.forget(m)}>${icons.forget}</button>
            </span>`}
      </div>
    </div>`;
  }

  /** The memories by category: a group folds away when none of its rows are listed, a row when it's filtered out */
  private groupsPart(groups: string[], icons: Record<IconName, TemplateResult>) {
    const list = this.memories;
    const listed = (m: Memory) => this.shows(m) && !this.leaving[m.id];
    const visible = (m: Memory) => listed(m) && !this.born[m.id];
    // repeat(): rows and groups keep their DOM (and focus) when others come and go
    const filled = groups.filter((g) => list.some((m) => m.category === g));
    return repeat(filled, (g) => g, (g) => {
      const items = list.filter((m) => m.category === g);
      const open = items.some(listed);
      return html`<section class="ui-mp__fold" ?data-open=${open} .inert=${!open} aria-label=${g}>
          <div class="ui-mp__clip">
            <h3 class="ui-mp__group">${g}</h3>
            <ul class="ui-mp__items">
              ${repeat(items, (m) => m.id, (m) => {
                const shown = visible(m);
                return html`<li class="ui-mp__fold ui-mp__fold--row" ?data-open=${shown} ?data-leaving=${!!this.leaving[m.id]} .inert=${!shown}>
                  <div class="ui-mp__clip">${this.item(m, icons)}</div>
                </li>`;
              })}
            </ul>
          </div>
        </section>`;
    });
  }

  /** "New memory" at the bottom: a row that unfolds into an inline editor with a category picker */
  private newMemory(icons: Record<IconName, TemplateResult>, categories: string[], category: string) {
    const adding = this.adding;
    return html`<div class="ui-mp__bottom">
      <div class="ui-mp__fold" ?data-open=${!adding} .inert=${adding}>
        <div class="ui-mp__clip">
          <button type="button" class="ui-mp__add" aria-expanded=${adding ? "true" : "false"} aria-controls="${this.uid}-new" @click=${() => this.openAdd()}>${icons.plus}New memory</button>
        </div>
      </div>
      <div id="${this.uid}-new" class="ui-mp__fold" ?data-open=${adding} .inert=${!adding}>
        <div class="ui-mp__clip">
          <div class="ui-mp__new">
            <textarea
              class="ui-mp__edit ui-mp__edit--new"
              .value=${this.newText}
              rows="1"
              placeholder="Something the assistant should remember…"
              aria-label="New memory"
              @input=${(e: Event) => {
                this.newText = (e.target as HTMLTextAreaElement).value;
                grow(e.target as HTMLTextAreaElement);
              }}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
                  e.preventDefault();
                  this.saveAdd();
                } else if (e.key === "Escape") {
                  e.stopPropagation();
                  this.closeAdd();
                }
              }}
            ></textarea>
            <div class="ui-mp__new-row">
              <div
                class="ui-mp__cats"
                role="radiogroup"
                aria-label="Category of the new memory"
                @keydown=${(e: KeyboardEvent) => {
                  const next = radioStep(e, categories.indexOf(category), categories.length);
                  if (next < 0) return;
                  e.preventDefault();
                  this.newCat = categories[next];
                  (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[role='radio']")[next]?.focus();
                }}
              >
                ${categories.map(
                  (g) => html`<button type="button" role="radio" aria-checked=${category === g ? "true" : "false"} tabindex=${category === g ? 0 : -1} class="ui-mp__cat" @click=${() => (this.newCat = g)}>${g}</button>`,
                )}
              </div>
              <span class="ui-mp__acts ui-mp__acts--edit">
                <button type="button" class="ui-mp__text-btn" @click=${() => this.closeAdd()}>Cancel</button>
                <button type="button" class="ui-mp__text-btn ui-mp__text-btn--main" ?disabled=${!this.newText.trim()} @click=${() => this.saveAdd()}>Save</button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const icons = clean ? cleanIcons : standardIcons;
    const list = this.memories;
    const groups = this.groups;
    const present = this.present;
    const q = this.query.trim();
    const anyVisible = list.some((m) => this.shows(m) && !this.leaving[m.id]);
    const hotMemory = list.find((m) => m.id === this.hot) ?? null;
    const chips = [null, ...groups.filter((g) => list.some((m) => m.category === g))];
    const { total } = this.counts();
    const forgot = this.forgot;
    const failed = this.failed;
    const line = this.swapLine!;
    const out = this.swapOut;
    const setHold = (h: { hover?: boolean; focus?: boolean }) => (this.holdUndo = { ...this.holdUndo, ...h });

    // The tray (Standard) or the card's last row (Clean): counts, what you point at, and Undo after forgetting
    const foot = html`<div
      class="ui-mp__foot"
      @pointerenter=${() => setHold({ hover: true })}
      @pointerleave=${() => setHold({ hover: false })}
      @focusin=${() => setHold({ focus: true })}
      @focusout=${(e: FocusEvent) => !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null) && setHold({ focus: false })}
    >
      <span class="ui-mp__caption"><span class="ui-mp__swap">${out ? keyed(`out-${out.id}`, html`<span class="ui-mp__swap-item" data-out="" aria-hidden="true">${out.node}</span>`) : nothing}${keyed(line.id, html`<span class="ui-mp__swap-item">${line.node}</span>`)}</span></span>
      <span class="ui-mp__sr" role="status">${failed ? failed.text : forgot ? `Forgot “${forgot.memory.text}”. Undo is on the tray.` : ""}</span>
      ${forgot
        ? keyed(`undo-${forgot.key}`, html`<button type="button" class="ui-mp__action ui-mp__action--undo" @click=${() => this.undo()}>${icons.undo}Undo</button>`)
        : this.actionLabel
          ? keyed("action", html`<button type="button" class="ui-mp__action" @click=${() => this.emit("tc-action", null)}>${this.actionLabel}${icons.arrow}</button>`)
          : nothing}
    </div>`;

    return html`
      <div class="ui-mp__card">
        <div class="ui-mp__head">
          <span id="${this.uid}-title" class="ui-mp__title">${this.heading}</span>
          <span class="ui-mp__count" aria-hidden="true" data-roll="total">${total}</span>
          <button type="button" role="switch" aria-checked=${this.enabled ? "true" : "false"} aria-controls="${this.uid}-note" class="ui-mp__switch" @click=${() => this.setEnabled(!this.enabled)}>
            <span class="ui-mp__switch-label">Use memory</span>
            <span class="ui-mp__track" aria-hidden="true"><span class="ui-mp__knob"></span></span>
          </button>
        </div>
        <div id="${this.uid}-note" class="ui-mp__fold" ?data-open=${!this.enabled} .inert=${this.enabled}>
          <div class="ui-mp__clip">
            <p class="ui-mp__note">${icons.info}<span>The assistant won't use or save memories in new chats. Nothing here is deleted.</span></p>
          </div>
        </div>
        ${this.filters(
          icons,
          chips,
          chips.map((c) => present.filter((m) => !c || m.category === c).length),
          hotMemory?.category ?? null,
        )}
        <div class="ui-mp__list" @pointerleave=${() => (this.hot = null)}>
          ${this.groupsPart(groups, icons)}
          <div class="ui-mp__fold" ?data-open=${!anyVisible} .inert=${anyVisible}>
            <div class="ui-mp__clip">
              <p class="ui-mp__empty">${list.length === 0 ? "Nothing remembered yet" : q ? `No memory mentions “${q}”` : "No memories here"}</p>
            </div>
          </div>
        </div>
        ${this.newMemory(icons, groups.length ? groups : ["General"], this.addCategory)}
        ${clean ? foot : nothing}
      </div>
      ${!clean ? foot : nothing}
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mp"] {
  /* insets and hover fills: a light grey on the card, lighter than the card in dark mode */
  --tc-memory-panel-well: light-dark(#f4f4f5, #222225);
  box-sizing: border-box;
  width: 100%;
  max-width: 380px;
  min-width: 0;
  container-type: inline-size;
  padding: var(--tc-space-1);
  border-radius: var(--tc-radius-3xl);
  background: var(--tc-surface-sunken);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="mp"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mp"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 400px;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="mp"] *, [data-ui="mp"] *::before, [data-ui="mp"] *::after { box-sizing: border-box; }
:where([data-ui="mp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="mp"]) :is(p, h3, ul) { margin: 0; padding: 0; list-style: none; font: inherit; }
[data-ui="mp"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-mp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mp"] svg { display: block; flex: none; }
/* Text fields: the search box and the memory being edited show the field focus ring instead of an outline */
[data-ui="mp"] :is(input, textarea):focus-visible { outline: none; }
.ui-mp__search:focus-within, .ui-mp__item:has(.ui-mp__edit:focus) { box-shadow: var(--tc-field-shadow-focus); }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="mp"]) svg { display: block; flex: none; }
[data-ui="mp"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__card { border-radius: var(--tc-radius-2xl); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* Everything that opens or goes does it the same quiet way: it unfolds or folds and fades, nothing travels */
.ui-mp__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mp__fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slow) var(--tc-ease-standard) 80ms; }
.ui-mp__fold--row[data-leaving] { transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard), filter var(--tc-duration-base) var(--tc-ease-standard); filter: blur(2px); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__glyph[data-solid] { fill: currentColor; stroke: none; }
/* One white card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__card { border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-mp__clip { min-height: 0; overflow: hidden; }
/* ----- Head ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-mp__head { display: flex; align-items: center; gap: var(--tc-space-2); height: 48px; padding: 0 var(--tc-space-3) 0 var(--tc-space-3-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__title { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__count { flex: none; min-width: 20px; height: 20px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-memory-panel-well); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); text-align: center; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__switch { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2); height: 28px; margin-left: auto; padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__switch:hover { background: var(--tc-memory-panel-well); }
.ui-mp__track { position: relative; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-mp__knob { position: absolute; top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: calc(var(--tc-switch-radius) - 2px); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-mp__switch[aria-checked="true"] .ui-mp__track { background: var(--tc-switch-on); }
.ui-mp__switch[aria-checked="true"] .ui-mp__knob { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__note { display: flex; gap: var(--tc-space-2); margin: 0 var(--tc-space-3) var(--tc-space-2-5) !important; padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-lg); background: var(--tc-memory-panel-well); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__note svg { margin-top: var(--tc-space-0-5); color: var(--tc-text-muted); }
/* ----- Filters ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-mp__filters { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-1); padding: 0 var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-3); }
/* ----- Head ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__head { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-2-5) 0 var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__title { min-width: 0; overflow: hidden; font-size: 15px; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__count { flex: none; min-width: 20px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-align: center; color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__switch { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2); height: 28px; margin-left: auto; padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__switch:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
/* The note while memory is off: a soft gray fill, no stroke */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__note { display: flex; gap: var(--tc-space-2); margin: var(--tc-space-2-5) var(--tc-space-3) 0 var(--tc-space-4) !important; padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); font-size: var(--tc-font-size-sm) !important; line-height: var(--tc-line-height-tight) !important; color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__note .ui-mp__glyph { color: var(--tc-icon-muted); }
/* ----- Filters: the button-switch look ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__filters { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-4); border-bottom: 0.5px solid var(--tc-border-default); transition: opacity var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-mp__chips, .ui-mp__search { grid-area: 1 / 1; transition: opacity var(--tc-duration-base) var(--tc-ease-standard), filter var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chips { display: flex; gap: var(--tc-space-1); min-width: 0; margin: -2px -4px; padding: var(--tc-space-0-5) var(--tc-space-1); overflow-x: auto; scrollbar-width: none; mask-image: linear-gradient(90deg, #000 calc(100% - 14px), transparent); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chips { display: flex; gap: var(--tc-space-1); min-width: 0; margin: -3px; padding: var(--tc-space-1); overflow-x: auto; scrollbar-width: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chips[data-more],
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cats[data-more] { -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 24px), transparent); mask-image: linear-gradient(90deg, #000 calc(100% - 24px), transparent); }
.ui-mp__chips::-webkit-scrollbar { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: 26px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip:hover { background: var(--tc-memory-panel-well); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-1) var(--tc-space-2-5); border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 0.5px var(--tc-border-default); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip:hover { background: var(--tc-fill-subtle); }
.ui-mp__chip[data-linked] { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip[data-linked]:not([aria-checked="true"]) { background: var(--tc-memory-panel-well); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip[aria-checked="true"] { background: var(--tc-memory-panel-well); color: var(--tc-text-primary); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip-count { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__search { display: flex; align-items: center; gap: var(--tc-space-1-5); height: 28px; padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2); border-radius: var(--tc-field-radius); background: var(--tc-field-bg-sunken); box-shadow: var(--tc-field-shadow); color: var(--tc-text-muted); opacity: 0; visibility: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__input { flex: 1; min-width: 0; height: 28px; margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); outline: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__input::placeholder { color: var(--tc-text-placeholder); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip[aria-checked="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip-count { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip[aria-checked="true"] .ui-mp__chip-count { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__search { display: flex; align-items: center; gap: var(--tc-space-1-5); height: 28px; padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2); border-radius: var(--tc-field-radius); box-shadow: var(--tc-field-shadow); background: var(--tc-field-bg-sunken); color: var(--tc-icon-muted); opacity: 0; visibility: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__input { flex: 1; min-width: 0; height: 28px; margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-font-size-md); color: var(--tc-text-strong); caret-color: var(--tc-accent); outline: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__input::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
.ui-mp__search .ui-mp__icon { width: 24px; height: 24px; }
.ui-mp__filters[data-searching] .ui-mp__chips { opacity: 0; filter: blur(2px); }
.ui-mp__filters[data-searching] .ui-mp__search { grid-area: 1 / 1 / 2 / 3; opacity: 1; visibility: visible; }
.ui-mp__filters[data-searching] .ui-mp__search-open { opacity: 0; visibility: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__search-open { grid-area: 1 / 2; transition: opacity var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
/* ----- List ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-mp__list { max-height: var(--tc-memory-panel-max); padding: var(--tc-space-0-5) var(--tc-space-1-5) var(--tc-space-1-5); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--tc-fill-strong) transparent; border-top: 1px solid var(--tc-border-default); transition: opacity var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__search-open { grid-area: 1 / 2; transition: opacity var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard); }
/* ----- List ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__list { max-height: var(--tc-memory-panel-max); padding: var(--tc-space-0-5) var(--tc-space-1-5) var(--tc-space-1-5); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--tc-fill-strong) transparent; transition: opacity var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__filters { transition: opacity var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__group { padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-0-5); font-size: var(--tc-font-size-sm) !important; font-weight: var(--tc-font-weight-medium) !important; line-height: var(--tc-line-height-snug) !important; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__item { padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1); border-radius: var(--tc-radius-lg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__item[data-hot],
:where([data-look="standard"], [data-look="standard"] *).ui-mp__item[data-editing] { background: var(--tc-memory-panel-well); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__group { padding: var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-1); font-size: 10px !important; font-weight: var(--tc-font-weight-medium) !important; line-height: var(--tc-line-height-tight) !important; letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted); }
/* The hovered row gets a soft wash – short and crisp, and gone when the pointer leaves */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__item { padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__item[data-hot],
:where([data-look="clean"], [data-look="clean"] *).ui-mp__item[data-editing] { background: var(--tc-fill-subtle); }
.ui-mp__text { color: var(--tc-text-primary); overflow-wrap: anywhere; transition: color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-mp__item[data-paused] .ui-mp__text { color: var(--tc-text-muted); }
/* A change whose callback is still running */
.ui-mp__item[data-pending] .ui-mp__text { opacity: 0.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__meta { display: flex; align-items: center; gap: var(--tc-space-1-5); min-height: 24px; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__meta { display: flex; align-items: center; gap: var(--tc-space-1-5); min-height: 20px; margin-top: var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-mp__source { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__tag { display: inline-flex; flex: none; align-items: center; height: 18px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-fill-strong); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); opacity: 0; transform: scale(0.9); transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__dot { color: var(--tc-text-disabled); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__tag { display: inline-flex; flex: none; align-items: center; height: 18px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-status-warning-bg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-status-warning-fg); opacity: 0; transform: scale(0.9); transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-mp__tag:not([data-on]) { position: absolute; visibility: hidden; }
.ui-mp__tag[data-on] { opacity: 1; transform: none; animation: ui-mp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__acts { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-0-5); margin: -1px -4px -1px auto; opacity: 0; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__acts { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-0-5); margin: -4px -6px -4px auto; opacity: 0; transition: opacity var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-mp__item:is([data-hot], :focus-within) .ui-mp__acts, .ui-mp__acts--edit { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__icon { display: grid; flex: none; place-items: center; width: 26px; height: 26px; border-radius: var(--tc-radius-md); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__icon:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__icon--forget:hover { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__acts--edit { gap: var(--tc-space-1); margin-top: var(--tc-space-1); margin-right: -2px; margin-bottom: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__item[data-editing] { padding-bottom: var(--tc-space-2); }
/* Ghost icon button */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__icon { display: grid; flex: none; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__icon:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__item .ui-mp__icon:hover { background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__item .ui-mp__icon--forget:hover { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-mp__icon-swap { display: grid; animation: ui-mp-in var(--tc-duration-moderate) var(--tc-ease-standard) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__text-btn { display: inline-flex; align-items: center; height: 26px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__text-btn:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__text-btn--main { background: var(--tc-text-primary); color: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__text-btn--main:hover { background: var(--tc-text-primary); color: var(--tc-surface-raised); opacity: 0.86; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__text-btn:disabled { cursor: default; opacity: 0.35; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__edit { display: block; width: 100%; min-height: 20px; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: var(--tc-text-primary); resize: none; overflow: hidden; outline: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__edit::placeholder { color: var(--tc-text-placeholder); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__empty { padding: var(--tc-space-4-5) var(--tc-space-2) var(--tc-space-3); font-size: var(--tc-font-size-sm); text-align: center; color: var(--tc-text-muted); }
/* ----- New memory ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-mp__bottom { padding: var(--tc-space-1) var(--tc-space-1-5) var(--tc-space-1-5); border-top: 1px solid var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__add { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; height: 32px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-lg); font-size: var(--tc-font-size-md); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__add:hover { background: var(--tc-memory-panel-well); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__new { margin: var(--tc-space-0-5) 0 0; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-1-5); border-radius: var(--tc-radius-lg); background: var(--tc-memory-panel-well); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__new-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-1-5); margin-top: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__cats { display: flex; flex: 1 1 auto; flex-wrap: wrap; gap: var(--tc-space-1); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__cat { display: inline-flex; align-items: center; height: 24px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__cat:hover { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__cat[aria-checked="true"] { background: var(--tc-surface-raised); color: var(--tc-text-primary); box-shadow: var(--tc-shadow-raised); }
/* ----- Tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-mp__foot { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 38px; padding: var(--tc-space-1) var(--tc-space-1) 0 var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* Cancel: ghost text; Save: the dark chip */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn { display: inline-flex; flex: none; align-items: center; height: 28px; padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn--main,
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn--main:hover { background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn--main:hover { opacity: 0.88; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn:disabled { cursor: default; opacity: 0.3; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__edit { display: block; width: 100%; min-height: 20px; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: var(--tc-text-strong); caret-color: var(--tc-accent); resize: none; overflow: hidden; outline: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__edit::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__empty { padding: var(--tc-space-5) var(--tc-space-2) var(--tc-space-3-5); font-size: var(--tc-font-size-md); text-align: center; color: var(--tc-text-muted); }
/* ----- New memory ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__bottom { padding: var(--tc-space-1-5); border-top: 0.5px solid var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__add { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; height: 32px; padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__add .ui-mp__glyph { color: var(--tc-icon-muted); transition: color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__add:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__add:hover .ui-mp__glyph { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__new { padding: var(--tc-space-1-5) var(--tc-space-1) var(--tc-space-0-5) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__new-row { display: flex; align-items: center; gap: var(--tc-space-2); margin-top: var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cats { display: flex; flex: 1 1 auto; gap: var(--tc-space-1); min-width: 0; margin: -3px; padding: var(--tc-space-1); overflow-x: auto; scrollbar-width: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cats::-webkit-scrollbar { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cat { display: inline-flex; flex: none; align-items: center; padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 0.5px var(--tc-border-default); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cat:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cat[aria-checked="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__new .ui-mp__acts--edit { margin: 0; }
/* ----- The last row of the card ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__foot { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 44px; padding: 0 var(--tc-space-2) 0 var(--tc-space-4); border-top: 0.5px solid var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-mp__swap { display: grid; min-width: 0; }
.ui-mp__swap-item { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; animation: ui-mp-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-mp__swap-item[data-out] { animation: ui-mp-swap-out var(--tc-duration-base) var(--tc-ease-standard) both; }
.ui-mp__forgot { display: flex; min-width: 0; }
.ui-mp__flat { flex: none; white-space: pre; }
.ui-mp__quote { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__action { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: 26px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-lg); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); white-space: nowrap; animation: ui-mp-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__action:hover { background: var(--tc-surface-raised); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__action--undo { padding: 0 var(--tc-space-2) 0 var(--tc-space-2); background: var(--tc-action-secondary-bg); color: var(--tc-action-secondary-fg); box-shadow: var(--tc-action-secondary-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__action:not(.ui-mp__action--undo) svg { transition: transform var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__action:not(.ui-mp__action--undo):hover svg { transform: translateX(2px); }
/* The action button: ghost text with an arrow */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__action { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: 28px; padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2-5); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); white-space: nowrap; animation: ui-mp-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__action .ui-mp__glyph { color: var(--tc-icon-muted); transition: transform var(--tc-duration-base) var(--tc-ease-move), color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__action:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__action:not(.ui-mp__action--undo):hover .ui-mp__glyph { transform: translateX(2px); color: var(--tc-text-primary); }
/* Undo: the white button with the hairline shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__action--undo { gap: var(--tc-space-1-5); padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-mp__action--undo:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
@keyframes ui-mp-in { from { opacity: 0; transform: scale(0.9); } }
@keyframes ui-mp-swap-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-mp-swap-out { from { opacity: 1; } to { opacity: 0; filter: blur(2px); } }
/* Narrow panels: chips drop their counts and the switch keeps only its track, so the filters fit */
@container (max-width: 340px) {
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip-count { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip { padding: 0 var(--tc-space-2); }
}
@container (max-width: 320px) {
:where([data-look="standard"], [data-look="standard"] *).ui-mp__switch-label { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__switch { padding: 0 var(--tc-space-0-5); }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-mp__acts { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__icon { width: 32px; height: 32px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__meta { min-height: 32px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip,
:where([data-look="standard"], [data-look="standard"] *).ui-mp__text-btn { height: 32px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__cat { height: 30px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__switch,
:where([data-look="standard"], [data-look="standard"] *).ui-mp__add { height: 36px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__action { height: 30px; }
}
/* Narrow panels: chips drop their counts and the switch keeps only its track, so the filters fit */
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip-count { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__head { padding-left: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__filters { padding-left: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__foot { padding-left: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__note { margin-left: var(--tc-space-3-5) !important; }
}
@container (max-width: 320px) {
:where([data-look="clean"], [data-look="clean"] *).ui-mp__switch-label { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__switch { padding: 0 var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip { padding: var(--tc-space-1) var(--tc-space-2); }
}
/* Touch screens: actions always visible, taller targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-mp__acts { opacity: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__icon { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__acts { margin-top: -7px; margin-bottom: -7px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__acts--edit { margin-top: var(--tc-space-1); margin-bottom: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip { padding: var(--tc-space-1-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cat { padding: var(--tc-space-1) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn,
:where([data-look="clean"], [data-look="clean"] *).ui-mp__action { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__switch,
:where([data-look="clean"], [data-look="clean"] *).ui-mp__add { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__search,
:where([data-look="clean"], [data-look="clean"] *).ui-mp__input { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__foot { min-height: 52px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mp"] *, [data-ui="mp"] *::before, [data-ui="mp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-memory-panel")) customElements.define("tc-memory-panel", TcMemoryPanel);

declare global {
  interface HTMLElementTagNameMap {
    "tc-memory-panel": TcMemoryPanel;
  }
}

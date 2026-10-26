import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";

/*
 * <tc-agent-cursors> – the Lit port of src/components/agent-cursors.tsx: agents working in a document like teammates
 * in a multiplayer editor. Every agent has a pointer with its name on a small flag, and you see live where each one
 * is and what it is doing – in the text, on an image, in a code block or in a comment next to the page.
 *   · pointers glide from place to place; while an agent types, its pointer and caret follow every letter
 *   · an agent can select a passage – it lights up in the agent's color
 *   · changes arrive as suggestions in the agent's color: new text underlined, removed text struck through; hover or
 *     focus one to see it; Enter or Space opens it to accept or reject it (Esc goes back), or accept them all
 *   · images shimmer while they load; an agent can take one by its corner and resize it
 *   · comments are pins on the page: open while an agent writes, then a round pin; hover or focus it to read it,
 *     reply, or resolve it
 *   · the faces in the header show who is here and who is typing; click one to follow that agent
 *   · with a fixed `height` the page fades out towards the bottom
 * The positions are measured from the page itself (pointers are moved by writing their styles – no render per move),
 * so any width, font or zoom works. Clean has no tray – one white page with the header inside it.
 *
 *   <tc-agent-cursors heading="Launch brief" .agents=${agents} .blocks=${blocks} .cursors=${{ ada: { block: "p1", at: 4 } }}>
 *   </tc-agent-cursors>
 *
 * `following` and `tab` change on their own; preventDefault() on tc-following-change / tc-tab-change keeps control.
 * Accept / Reject / Accept all / Resolve fire events; they show when `can-accept`, `can-reject`, `can-accept-all` and
 * `can-resolve` are set. `onReply` (may return a promise) shows a reply field in each comment.
 */

export type CursorAgent = {
  id: string;
  name: string;
  /** The agent's color – pointer, caret, selection, frame and suggestions. Leave it out for the one shared ink */
  color?: string;
  /** A small mark, e.g. the model maker's logo (cloned) – defaults to the initial */
  avatar?: Element;
  /** The fill of its face while you follow it – defaults to a light wash of its color */
  tint?: string;
  /** What it has cost so far – shown on its flag, and summed up in the header */
  cost?: number;
};

export type DocBlock = {
  id: string;
  kind?: "title" | "heading" | "paragraph" | "item" | "code" | "image" | "table";
  /** The text – for an image its caption */
  text?: string;
  /** Image: its width as a share of the page, 0–1 (default 1) – change it and the image resizes smoothly */
  width?: number;
  /** Image: width ÷ height (default 16 / 9). A floated image without a ratio is as tall as the text beside it */
  ratio?: number;
  /** Image: let the following text flow around it, on its right ("left") or its left ("right") */
  float?: "left" | "right";
  /** Image: still loading – a shimmer instead of the picture */
  loading?: boolean;
  /** Image: the picture */
  src?: string;
  alt?: string;
  /** Table: its rows of cells, the first one the header. Every cell is a block of its own (id and text) */
  rows?: DocBlock[][];
  /** Table: shows an "Add row" line under the rows – a cursor can point at it with the block id `${table id}:add` */
  addRow?: boolean;
  /** Table cell: shows its text as a small status pill in this tone */
  tone?: "gray" | "blue" | "green" | "amber";
};

export type DocTab = { id: string; label: string };

export type DocSuggestion = {
  id: string;
  /** Who suggests it */
  agent: string;
  block: string;
  /** Where it starts, as a character offset in the block's text */
  at: number;
  /** How many characters it removes from there */
  remove?: number;
  /** What it puts in their place */
  insert?: string;
  /** Why – shown when you open the suggestion */
  note?: string;
};

export type DocComment = {
  id: string;
  agent: string;
  /** The block it is pinned to – the pin sits at its top edge */
  block: string;
  /** Pins it to a character in the block's text – the pin's point sits right on it */
  at?: number;
  /** Without `at`: where along the page the pin sits, 0 (left) – 1 (right); default 0.9 */
  x?: number;
  /** Moves the pin down from the block's top edge, in px */
  y?: number;
  text: string;
  /** Keeps the comment open, e.g. while the agent writes it – otherwise it shows as a pin that opens on hover */
  open?: boolean;
};

export type AgentCursor = {
  /** A block id – or a comment id, for an agent writing a comment */
  block: string;
  /** Character offset in the text – or in the suggestion's new text when `in` is set */
  at?: number;
  /** The id of a suggestion the agent is typing into */
  in?: string;
  /** Text: a selected passage of this many characters from `at`. Image: any number – the agent holds the image */
  select?: number;
  /** Image: where the pointer rests – on the middle or on the corner handle (default "center") */
  point?: "center" | "corner";
  /** What it is doing, on its flag – e.g. "Checking the numbers" */
  doing?: string;
  /** Typing: the caret holds still instead of blinking and the pointer follows each letter */
  typing?: boolean;
  /** A click: the arrow presses in and what it points at lights up */
  press?: boolean;
};

export type AgentCursorsReply = (comment: DocComment, text: string) => void | Promise<unknown>;
export type AgentFollowingChange = { following: string | null };
export type AgentTabChange = { tab: string };

/** Accepts a suggestion: writes it into the text and moves the other suggestions in that block along */
export function acceptSuggestion(blocks: DocBlock[], suggestions: DocSuggestion[], id: string) {
  const s = suggestions.find((x) => x.id === id);
  if (!s) return { blocks, suggestions };
  const remove = s.remove ?? 0;
  const insert = s.insert ?? "";
  const shift = insert.length - remove;
  return {
    blocks: blocks.map(function write(b: DocBlock): DocBlock {
      if (b.id === s.block) return { ...b, text: (b.text ?? "").slice(0, s.at) + insert + (b.text ?? "").slice(s.at + remove) };
      // Table cells are blocks too
      return b.rows ? { ...b, rows: b.rows.map((row) => row.map(write)) } : b;
    }),
    suggestions: suggestions.filter((x) => x.id !== id).map((x) => (x.block === s.block && x.at >= s.at + remove ? { ...x, at: x.at + shift } : x)),
  };
}

type Point = { x: number; y: number; h: number; free?: boolean };
type Box = { x: number; y: number; w: number; h: number };

const textOf = (el: Element | null) => {
  const n = el?.firstChild;
  return n && n.nodeType === 3 ? (n as Text) : null;
};

/** The text node and offset for a place in a block: in the plain text, or inside a suggestion's new text */
function locate(block: HTMLElement, at: number, inSuggestion?: string): [Text, number] | null {
  if (inSuggestion) {
    const el = block.querySelector(`[data-ins="${CSS.escape(inSuggestion)}"]`);
    if (el) {
      const t = textOf(el);
      if (t) return [t, Math.max(0, Math.min(at, t.length))];
      // Nothing typed yet: right after the struck-through text (past the line-break hint), or before what follows
      let before = el.previousElementSibling;
      if (before?.tagName === "WBR") before = before.previousElementSibling;
      const prev = textOf(before);
      if (prev) return [prev, prev.length];
      const next = textOf(el.nextElementSibling);
      if (next) return [next, 0];
    }
  }
  let best: [Text, number] | null = null;
  for (const seg of block.querySelectorAll<HTMLElement>("[data-from]")) {
    const t = textOf(seg);
    if (!t) continue;
    const from = Number(seg.dataset.from);
    if (at >= from && at <= from + t.length) {
      best = [t, at - from];
      if (at < from + t.length) break;
    }
  }
  return best;
}

/** The caret's box at a place in a text node */
function caret(node: Text, offset: number): DOMRect | null {
  const r = document.createRange();
  if (!node.length) return null;
  if (offset < node.length) {
    r.setStart(node, offset);
    r.setEnd(node, offset + 1);
    return r.getClientRects()[0] ?? null;
  }
  r.setStart(node, offset - 1);
  r.setEnd(node, offset);
  const rects = r.getClientRects();
  const b = rects[rects.length - 1];
  return b ? new DOMRect(b.right, b.top, 0, b.height) : null;
}

const initial = (name: string) => name.trim().charAt(0).toUpperCase();
const dollars = (n: number) => `$${n.toFixed(2)}`;
/** A zero-width space keeps an empty comment measurable, so a caret can sit in it */
const EMPTY = "​";

/** What the page's geometry decides about the markup – the element renders again only when one of these changes */
type DocLayout = {
  /** The agents whose place is measured now, and every agent that has had one (it fades out where it was) */
  placed: string[];
  seen: string[];
  marks: Record<string, Box[]>;
  notes: Record<string, { x: number; y: number }>;
  /** The height of each comment's content – the pin grows to it when it opens */
  pinH: Record<string, number>;
  /** Floated images without a ratio take the height of the text beside them */
  fit: Record<string, { w: number; h: number }>;
  width: number;
  sheetW: number;
  stageH: number;
};
const NO_LAYOUT: DocLayout = { placed: [], seen: [], marks: {}, notes: {}, pinH: {}, fit: {}, width: 0, sheetW: 0, stageH: 0 };

/** A pointer's place, caret height, flag shift and fade, written straight to its element – no render per move */
function placePointer(el: HTMLElement, p: Point, shift: number, fade: number) {
  el.style.transform = `translate(${p.x}px, ${p.y}px)`;
  el.style.setProperty("--tc-agent-cursors-h", `${p.h}px`);
  el.style.setProperty("--tc-agent-cursors-shift", `${shift}px`);
  if (p.free) el.dataset.free = "";
  else delete el.dataset.free;
  const inner = el.firstElementChild as HTMLElement | null;
  // On a fading page, a pointer fades with the page below it
  if (inner) inner.style.opacity = fade < 1 ? String(fade) : "";
}

/** Tables grow and shrink smoothly: the card's height follows its table with a transition. All reads first */
function syncTableCards(stage: HTMLElement) {
  const cards = [...stage.querySelectorAll<HTMLElement>(".ui-agc__table-card")].map((card) => {
    const table = card.firstElementChild as HTMLElement | null;
    return { card, h: table ? `${table.offsetHeight}px` : null };
  });
  for (const { card, h } of cards) {
    if (!h || card.style.height === h) continue;
    if (!card.style.height) {
      // First time: no animation
      card.style.transition = "none";
      card.style.height = h;
      void card.offsetHeight;
      card.style.transition = "";
    } else card.style.height = h;
  }
}

/** The nearest ancestor that clips the element (a scroll area, a preview frame) – null for the window */
function clipAncestor(stage: HTMLElement) {
  let clip: HTMLElement | null = stage.parentElement;
  while (clip && clip !== document.body && getComputedStyle(clip).overflowX === "visible") clip = clip.parentElement;
  return clip && clip !== document.body ? clip : null;
}

/** Reuses the parts of `prev` that didn't change, and `prev` itself when nothing did */
function keepSame(prev: DocLayout, next: DocLayout): DocLayout {
  let changed = false;
  const out = { ...next } as Record<string, unknown>;
  for (const k of Object.keys(next) as (keyof DocLayout)[]) {
    if (JSON.stringify(prev[k]) === JSON.stringify(next[k])) out[k] = prev[k];
    else changed = true;
  }
  return changed ? (out as DocLayout) : prev;
}

/* ---------- Icons ---------- */

const docIcon = () =>
  html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${svg`<path d="M14 2.5H7.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7z"></path><path d="M14 2.5V7h4.5M9 12.5h6M9 16h4"></path>`}</svg>`;
const plusIcon = () =>
  html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">${svg`<path d="M12 5v14M5 12h14"></path>`}</svg>`;
const checkIcon = () =>
  html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${svg`<path d="M5 12.5l4.5 4.5L19 7.5"></path>`}</svg>`;
/* The pointer: a soft, rounded arrow */
const arrow = () =>
  html`<svg class="ui-agc__arrow" viewBox="-2.186 -0.256 18.514 22.277">${svg`<path transform="rotate(21.37)" d="M13.92 4.07c1.69.66 3.03 1.18 3.94 1.68.46.25.87.53 1.16.86.31.35.51.79.48 1.29-.03.51-.27.92-.62 1.23-.33.3-.77.53-1.25.74-.96.4-2.36.78-4.12 1.26-.56.15-.98.27-1.26.37-.26.1-.38.18-.47.27-.09.09-.17.21-.27.47-.1.28-.22.7-.37 1.26-.48 1.76-.86 3.16-1.26 4.12-.2.49-.44.93-.74 1.25-.32.35-.72.6-1.23.62-.51.03-.94-.17-1.29-.48-.33-.29-.61-.7-.86-1.16-.5-.91-1.02-2.25-1.68-3.94L1.66 7.76C.96 5.99.41 4.59.16 3.51-.09 2.44-.12 1.39.63.63 1.39-.12 2.44-.09 3.51.16c1.08.25 2.48.8 4.25 1.5l6.16 2.41Z"></path>`}</svg>`;

let instances = 0;

/**
 * Agents working in a document like teammates in a multiplayer editor: pointers, selections, suggestions and comments.
 * @tag tc-agent-cursors
 * @fires tc-following-change - A face was clicked to follow an agent, or to stop ({ following }: AgentFollowingChange); cancelable
 * @fires tc-tab-change - Another tab was picked ({ tab }: AgentTabChange); cancelable
 * @fires tc-accept - A suggestion was accepted; `detail` is the `DocSuggestion`
 * @fires tc-reject - A suggestion was rejected; `detail` is the `DocSuggestion`
 * @fires tc-accept-all - "Accept all" was pressed
 * @fires tc-resolve - A comment was resolved; `detail` is the `DocComment`
 */
export class TcAgentCursors extends TcElement {
  static override ui = "agc";

  /** The agents in the document – each one's name, colour, mark and cost; their faces show in the header */
  @property({ attribute: false }) accessor agents: CursorAgent[] = [];
  /** The document, block by block – title, headings, paragraphs, list items, code, images and tables */
  @property({ attribute: false }) accessor blocks: DocBlock[] = [];
  /** Suggested changes, shown inline in the text in the suggesting agent's colour */
  @property({ attribute: false }) accessor suggestions: DocSuggestion[] = [];
  /** Comment pins on the page */
  @property({ attribute: false }) accessor comments: DocComment[] = [];
  /** Where each agent is – a missing or null entry means the agent has left the document */
  @property({ attribute: false }) accessor cursors: Record<string, AgentCursor | null | undefined> = {};
  /** The agent you follow (the others fade back), or null */
  @property() accessor following: string | null = null;
  /** A fixed page height in px – the rest of the document fades out towards the bottom */
  @property({ type: Number }) accessor height: number | undefined = undefined;
  /** Formats every cost – defaults to dollars, e.g. "$0.42" */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;
  /** Tabs above the page, e.g. the document and a table view of it */
  @property({ attribute: false }) accessor tabs: DocTab[] | undefined = undefined;
  /** The open tab – unset is the first. The page content is yours to switch */
  @property() accessor tab: string | undefined = undefined;
  /** The document's title in the header */
  @property() accessor heading = "Untitled";
  /** Shows Accept in a suggestion's window (fires tc-accept) */
  @property({ type: Boolean, attribute: "can-accept" }) accessor canAccept = false;
  /** Shows Reject in a suggestion's window (fires tc-reject) */
  @property({ type: Boolean, attribute: "can-reject" }) accessor canReject = false;
  /** Shows "Accept all" in the header (fires tc-accept-all) */
  @property({ type: Boolean, attribute: "can-accept-all" }) accessor canAcceptAll = false;
  /** Shows the resolve check in a comment's window (fires tc-resolve) */
  @property({ type: Boolean, attribute: "can-resolve" }) accessor canResolve = false;
  /** A reply typed into a comment's window and sent with Enter. May return a promise: the field waits while it
   *  runs, and if it rejects the text comes back so it can be sent again */
  @property({ attribute: false }) accessor onReply: AgentCursorsReply | undefined = undefined;

  /** @internal What the page's geometry decides about the markup */
  @state() accessor layout: DocLayout = NO_LAYOUT;
  /** @internal The comment pin open from hover or focus */
  @state() accessor pinOpen: string | null = null;
  /** @internal One reply draft per pin */
  @state() accessor replies: Record<string, string> = {};
  /** @internal Replies on their way, and the ones that failed */
  @state() accessor sending: Record<string, "pending" | "error"> = {};
  /** @internal The open suggestion, its box, and whether focus moves into it */
  @state() accessor open: { id: string; box: Box; focus: boolean } | null = null;
  /** @internal Esc hid the faces' tips */
  @state() accessor tipsHushed = false;
  /** @internal The live region */
  @state() accessor announce = "";
  /** @internal Bumped once arriving pointers may glide */
  @state() accessor arrived = 0;

  private readonly uid = `tc-agc${++instances}`;
  // The measuring engine: pointer geometry lives here, not in state
  private points: Record<string, Point> = {};
  private last: Record<string, Point> = {};
  private clipR = Infinity;
  private flagW: Record<string, number> = {};
  private clip: HTMLElement | null | undefined;
  private ro?: ResizeObserver;
  private raf = 0;
  private until = 0;
  private alive = false;
  private pinTimer = 0;
  private pinHush: string | null = null;
  private trigger: HTMLElement | null = null;
  private quiet = false;
  private closeTimer = 0;
  private lastSug = 0;
  private seenArrivals = new Set<string>();
  private arrivingKey = "";
  private arriveTimer = 0;
  private known: Set<string> | null = null;
  private popFocusKey = "";

  constructor() {
    super();
    // When the focused control goes away (an accepted suggestion, a resolved comment), focus moves to the suggestion
    // that took its place, the next pin, or the page – never to <body>
    new FocusRescueController(this, (key) => {
      const stage = this.stage;
      if (key?.startsWith("sug:")) {
        const sugs = [...this.querySelectorAll<HTMLElement>("[data-sug]")];
        return sugs[Math.min(this.lastSug, sugs.length - 1)] ?? this.querySelector<HTMLElement>(".ui-agc__all:not(:disabled)") ?? stage;
      }
      if (key?.startsWith("pin:")) return this.querySelector<HTMLElement>(".ui-agc__pin-hit[tabindex='0']") ?? stage;
      return stage;
    });
    this.addEventListener(
      "focusin",
      (e) => {
        const t = e.target as HTMLElement;
        if (!t.dataset?.sug) return;
        this.lastSug = [...this.querySelectorAll("[data-sug]")].indexOf(t);
      },
      { capture: true },
    );
  }

  private get stage() {
    return this.querySelector<HTMLElement>(".ui-agc__stage");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.alive = true;
    document.addEventListener("keydown", this.onEscape);
    if (this.hasUpdated) this.watch();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.alive = false;
    document.removeEventListener("keydown", this.onEscape);
    this.ro?.disconnect();
    this.ro = undefined;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.stage?.removeEventListener("transitionrun", this.onRun);
    window.clearTimeout(this.closeTimer);
    window.clearTimeout(this.pinTimer);
    window.clearTimeout(this.arriveTimer);
    this.arriveTimer = 0;
    this.arrivingKey = "";
  }

  // Esc closes what hover opened – the suggestion preview, a hovered pin, a face's tip – without moving focus
  private onEscape = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    this.open = null;
    this.tipsHushed = true;
    if (this.pinOpen) this.pinHush = this.pinOpen;
    this.pinOpen = null;
  };

  /* ---------- Measuring ---------- */

  private run = () => this.measure();
  private onRun = (e: TransitionEvent) => {
    // Every frame while an image or a table card resizes, so pointers and pins ride along
    const el = e.target as HTMLElement;
    if (!el.classList?.contains("ui-agc__figure") && !el.classList?.contains("ui-agc__table-card")) return;
    this.until = performance.now() + 900;
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
  };
  private loop = () => {
    this.measure();
    this.raf = performance.now() < this.until ? requestAnimationFrame(this.loop) : 0;
  };

  /** Measures when the page changes size, when the fonts arrive, and every frame while an image or table resizes */
  private watch() {
    const stage = this.stage;
    if (!stage) return;
    if (typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(() => {
        this.clip = undefined;
        this.measure();
      });
      this.ro.observe(stage);
    }
    document.fonts?.ready.then(() => this.alive && this.measure());
    stage.addEventListener("transitionrun", this.onRun);
  }

  private writePointer(id: string, el: HTMLElement) {
    const p = this.points[id] ?? this.last[id];
    if (!p) return;
    const height = this.height;
    // A flag may stick out past the page, but moves in before the clipping edge would cut it off
    const shift = Math.min(0, this.clipR - 8 - (p.x + 16 + (this.flagW[id] ?? 0)));
    const fade = height ? Math.max(0, Math.min(1, (height * 0.97 - p.y) / (height * 0.47))) : 1;
    placePointer(el, p, shift, fade);
  }

  private measure() {
    const stage = this.stage;
    if (!stage) return;
    const sheet = this.querySelector<HTMLElement>(".ui-agc__sheet");
    const { agents, cursors, comments } = this;
    syncTableCards(stage);
    // Reads: every rect and size first
    const outer = stage.getBoundingClientRect();
    const scale = stage.offsetWidth ? outer.width / stage.offsetWidth : 1;
    const rel = (b: DOMRect | DOMRectReadOnly): Box => ({ x: (b.left - outer.left) / scale, y: (b.top - outer.top) / scale, w: b.width / scale, h: b.height / scale });
    const r10 = (n: number) => Math.round(n * 10) / 10;
    const nextPoints: Record<string, Point> = {};
    const marks: Record<string, Box[]> = {};
    for (const a of agents) {
      const c = cursors[a.id];
      if (!c) continue;
      const block = stage.querySelector<HTMLElement>(`[data-block="${CSS.escape(c.block)}"]`);
      if (!block) continue;
      // An image: the pointer rests on its middle or – on the corner – right on the bottom-right handle
      const img = block.dataset.kind === "image" ? block.querySelector<HTMLElement>(".ui-agc__img") : null;
      if (img) {
        const b = rel(img.getBoundingClientRect());
        nextPoints[a.id] = c.point === "corner" ? { x: r10(b.x + b.w), y: r10(b.y + b.h), h: 0, free: true } : { x: r10(b.x + b.w * 0.55), y: r10(b.y + b.h * 0.5), h: 0, free: true };
        continue;
      }
      const spot = locate(block, c.at ?? 0, c.in);
      const box = spot ? caret(...spot) : null;
      if (box) {
        const b = rel(box);
        nextPoints[a.id] = { x: r10(b.x), y: r10(b.y), h: r10(b.h) };
      }
      if (c.select && !c.in) {
        const from = locate(block, c.at ?? 0);
        const to = locate(block, (c.at ?? 0) + c.select);
        if (from && to) {
          const r = document.createRange();
          r.setStart(...from);
          r.setEnd(...to);
          // One box per line: the rects of the inline pieces joined
          const lines: Box[] = [];
          for (const rect of r.getClientRects()) {
            if (rect.width < 0.5) continue;
            const b = rel(rect);
            const line = lines.find((l) => Math.abs(l.y - b.y) < 3);
            if (line) {
              const right = Math.max(line.x + line.w, b.x + b.w);
              line.x = Math.min(line.x, b.x);
              line.w = right - line.x;
            } else lines.push({ ...b });
          }
          marks[a.id] = lines.map((l) => ({ x: Math.round(l.x), y: Math.round(l.y), w: Math.round(l.w), h: Math.round(l.h) }));
        }
      }
    }
    // Comment pins: on their block's top edge, at their place along the page
    const sheetBox = sheet ? rel(sheet.getBoundingClientRect()) : { x: 0, w: stage.offsetWidth };
    const notes: Record<string, { x: number; y: number }> = {};
    for (const cm of comments) {
      const block = stage.querySelector<HTMLElement>(`[data-block="${CSS.escape(cm.block)}"]`);
      if (!block) continue;
      // On a character: the pin's point touches the top of the letter
      const spot = cm.at !== undefined ? locate(block, cm.at) : null;
      const letter = spot ? caret(...spot) : null;
      if (letter) {
        const l = rel(letter);
        notes[cm.id] = { x: Math.round(l.x), y: Math.round(l.y + 3 + (cm.y ?? 0)) };
        continue;
      }
      const b = rel(block.getBoundingClientRect());
      notes[cm.id] = { x: Math.round(sheetBox.x + sheetBox.w * Math.max(0, Math.min(1, cm.x ?? 0.9))), y: Math.round(b.y + (cm.y ?? 0)) };
    }
    const fit: Record<string, { w: number; h: number }> = {};
    for (const fig of stage.querySelectorAll<HTMLElement>("figure[data-fit]")) {
      // Only while text runs beside it – on a narrow page the image sits above its text and keeps its own shape
      if (getComputedStyle(fig).float === "none") continue;
      const beside = fig.nextElementSibling as HTMLElement | null;
      if (beside && fig.dataset.block) fit[fig.dataset.block] = { w: Math.round(fig.offsetWidth), h: Math.max(48, Math.round(beside.offsetHeight)) };
    }
    const pinH: Record<string, number> = {};
    for (const cm of comments) {
      const body = stage.querySelector<HTMLElement>(`[data-comment="${CSS.escape(cm.id)}"] .ui-agc__pin-body`);
      if (body) pinH[cm.id] = body.offsetHeight;
    }
    if (this.clip === undefined) this.clip = clipAncestor(stage);
    const right = this.clip ? this.clip.getBoundingClientRect().right : window.innerWidth;
    const pointers = [...stage.querySelectorAll<HTMLElement>(".ui-agc__cursor[data-agent]")];
    const nextFlagW: Record<string, number> = {};
    for (const el of pointers) {
      const flag = el.querySelector<HTMLElement>(".ui-agc__flag");
      if (flag) nextFlagW[el.dataset.agent!] = flag.offsetWidth;
    }
    const next: DocLayout = {
      placed: Object.keys(nextPoints),
      // The last place of every agent, so one that leaves fades out where it was
      seen: Object.keys(Object.assign(this.last, nextPoints)),
      marks,
      notes,
      pinH,
      fit,
      width: stage.offsetWidth,
      sheetW: sheet?.offsetWidth ?? stage.offsetWidth,
      stageH: stage.offsetHeight,
    };
    // Writes: the pointers straight to their elements, then the state – which only changes when the markup must
    this.points = nextPoints;
    this.clipR = Math.round((right - outer.left) / scale);
    this.flagW = nextFlagW;
    for (const el of pointers) this.writePointer(el.dataset.agent!, el);
    const kept = keepSame(this.layout, next);
    // After this update, not inside it
    if (kept !== this.layout) queueMicrotask(() => (this.layout = kept));
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.toggleAttribute("data-hush", this.tipsHushed);
    if (this.following) this.dataset.following = this.following;
    else delete this.dataset.following;
    this.toggleAttribute("data-fade", !!this.height);
    if (this.height) this.style.setProperty("--tc-agent-cursors-height", `${this.height}px`);
    else this.style.removeProperty("--tc-agent-cursors-height");
    // New suggestions and comments are announced
    if (changed.has("suggestions") || changed.has("comments") || changed.has("agents")) {
      const ids = new Set([...this.suggestions.map((s) => s.id), ...this.comments.map((c) => c.id)]);
      const known = this.known;
      if (known) {
        const fresh = this.suggestions.find((s) => !known.has(s.id));
        const note = this.comments.find((c) => !known.has(c.id));
        const who = (id?: string) => this.agents.find((a) => a.id === id)?.name;
        if (fresh && who(fresh.agent)) this.announce = `${who(fresh.agent)} suggests a change${fresh.note ? `: ${fresh.note}` : ""}`;
        else if (note && who(note.agent)) this.announce = `${who(note.agent)} is writing a comment`;
      }
      this.known = ids;
    }
  }

  protected override firstUpdated() {
    this.watch();
  }

  protected override updated(changed: PropertyValues<this>) {
    // After every change to what's on the page – not on hover or while a reply is typed: those don't move anything
    const moves = ["agents", "cursors", "comments", "height", "blocks", "suggestions", "tab", "tabs", "formatCost", "layout", "look", "contextLook"] as PropertyKey[];
    if (this.alive && moves.some((k) => (changed as Map<PropertyKey, unknown>).has(k))) this.measure();
    // Arriving pointers pop in where they are, instead of flying in from the corner
    const present = this.present;
    const arriving = present.filter((id) => !this.seenArrivals.has(id));
    const key = arriving.join("\n");
    if (!key) {
      // Left agents arrive anew next time
      for (const id of [...this.seenArrivals]) if (!present.includes(id)) this.seenArrivals.delete(id);
    }
    if (key !== this.arrivingKey) {
      this.arrivingKey = key;
      window.clearTimeout(this.arriveTimer);
      this.arriveTimer = 0;
      if (key && this.alive)
        this.arriveTimer = window.setTimeout(() => {
          this.arriveTimer = 0;
          arriving.forEach((id) => this.seenArrivals.add(id));
          this.arrived++;
        }, 40);
    }
    // Opened from the keyboard: focus moves into the suggestion's window
    const popKey = this.open?.focus ? this.open.id : "";
    if (popKey && popKey !== this.popFocusKey) this.querySelector<HTMLElement>(".ui-agc__pop button")?.focus({ preventScroll: true });
    this.popFocusKey = popKey;
  }

  private get present() {
    return this.agents.filter((a) => this.cursors[a.id] && this.layout.placed.includes(a.id)).map((a) => a.id);
  }

  /* ---------- Suggestions ---------- */

  private place(id: string, el: HTMLElement, focus: boolean) {
    window.clearTimeout(this.closeTimer);
    const stage = this.stage;
    if (!stage) return;
    this.trigger = el;
    const outer = stage.getBoundingClientRect();
    const scale = stage.offsetWidth ? outer.width / stage.offsetWidth : 1;
    const rects = el.getClientRects();
    const b = rects[rects.length - 1] ?? el.getBoundingClientRect();
    this.open = { id, focus, box: { x: (b.left - outer.left) / scale, y: (b.top - outer.top) / scale, w: b.width / scale, h: b.height / scale } };
  }
  private show(id: string, el: HTMLElement) {
    if (!this.quiet) this.place(id, el, false);
  }
  private enter(id: string, el: HTMLElement) {
    this.place(id, el, true);
  }
  private hide = () => {
    window.clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(() => (this.open = null), 140);
  };
  /** Focus back on the suggestion that opened the window, without opening it again */
  private backToTrigger() {
    const el = this.trigger;
    window.clearTimeout(this.closeTimer);
    this.open = null;
    if (!el?.isConnected) return false;
    this.quiet = true;
    el.focus({ preventScroll: true });
    this.quiet = false;
    return true;
  }
  private leavePop(to: "back" | "next") {
    const from = this.trigger;
    if (!this.backToTrigger() || to === "back" || !from) return;
    // Tab past the window: the next stop after the suggestion
    const stops = [...this.querySelectorAll<HTMLElement>('button:not([disabled]), input, [tabindex="0"]')].filter((el) => !el.closest("[inert]"));
    stops[stops.indexOf(from) + 1]?.focus({ preventScroll: true });
  }

  /* ---------- Comment pins and replies ---------- */

  private keepPin(id: string, by: "hover" | "focus" | "press") {
    window.clearTimeout(this.pinTimer);
    if (by === "focus" && this.pinHush === id) return;
    this.pinHush = null;
    this.pinOpen = id;
  }
  private leavePin(id: string) {
    window.clearTimeout(this.pinTimer);
    if (this.pinHush === id) this.pinHush = null;
    this.pinTimer = window.setTimeout(() => {
      if (this.pinOpen === id) this.pinOpen = null;
    }, 160);
  }
  private closePin(id: string) {
    window.clearTimeout(this.pinTimer);
    this.pinHush = id;
    this.pinOpen = null;
  }

  private send(cm: DocComment) {
    const text = this.replies[cm.id]?.trim();
    if (!this.onReply || !text || this.sending[cm.id] === "pending") return;
    const done = this.onReply(cm, text);
    const { [cm.id]: _sent, ...others } = this.replies;
    this.replies = others;
    const settle = () => {
      const { [cm.id]: _done, ...rest } = this.sending;
      this.sending = rest;
    };
    if (done && typeof (done as Promise<unknown>).then === "function") {
      this.sending = { ...this.sending, [cm.id]: "pending" };
      (done as Promise<unknown>).then(
        () => this.alive && settle(),
        () => {
          if (!this.alive) return;
          this.sending = { ...this.sending, [cm.id]: "error" };
          this.replies = { ...this.replies, [cm.id]: this.replies[cm.id] || text };
        },
      );
    } else settle();
  }

  /* ---------- Changes ---------- */

  private follow(agent: string | null) {
    if (this.emit<AgentFollowingChange>("tc-following-change", { following: agent }, { cancelable: true })) this.following = agent;
  }
  private pickTab(tab: string) {
    if (tab === this.tab) return;
    if (this.emit<AgentTabChange>("tc-tab-change", { tab }, { cancelable: true })) this.tab = tab;
  }

  /* ---------- Render ---------- */

  private agentOf(id: string) {
    return this.agents.find((a) => a.id === id);
  }
  private mark(a?: CursorAgent) {
    return a?.avatar ? a.avatar.cloneNode(true) : html`<span class="ui-agc__face-initial">${initial(a?.name ?? "?")}</span>`;
  }

  /** A block's text with its suggestions inline */
  private textParts(b: DocBlock, byBlock: Map<string, DocSuggestion[]>) {
    const text = b.text ?? "";
    const list = byBlock.get(b.id) ?? [];
    const parts: TemplateResult[] = [];
    let pos = 0;
    for (const s of list) {
      const at = Math.max(pos, Math.min(s.at, text.length));
      if (at > pos) parts.push(html`<span data-from=${pos} .textContent=${text.slice(pos, at)}></span>`);
      const remove = Math.min(s.remove ?? 0, text.length - at);
      const a = this.agentOf(s.agent);
      const style = styleMap({ "--tc-agent-cursors-c": a?.color });
      const name = a?.name ?? "Agent";
      const isOpen = this.open?.id === s.id;
      const onKey = (e: KeyboardEvent) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        this.enter(s.id, e.currentTarget as HTMLElement);
      };
      // A button that opens the suggestion's window: hover or focus shows it, Enter / Space / click moves into it
      if (remove) {
        const removed = text.slice(at, at + remove);
        parts.push(
          html`<del
            class="ui-agc__del"
            data-from=${at}
            data-sug=${s.id}
            style=${style}
            tabindex="0"
            role="button"
            aria-haspopup="dialog"
            aria-expanded=${isOpen ? "true" : "false"}
            ?data-open=${isOpen}
            data-focus-key=${`sug:${s.id}`}
            aria-label=${`${name} suggests removing: ${removed}`}
            @mouseenter=${(e: MouseEvent) => this.show(s.id, e.currentTarget as HTMLElement)}
            @mouseleave=${this.hide}
            @focus=${(e: FocusEvent) => this.show(s.id, e.currentTarget as HTMLElement)}
            @blur=${this.hide}
            @click=${(e: MouseEvent) => this.enter(s.id, e.currentTarget as HTMLElement)}
            @keydown=${onKey}
            .textContent=${removed}
          ></del>`,
        );
      }
      // A possible line break between the old and the new text, so a narrow cell can wrap them
      if (remove && s.insert !== undefined) parts.push(html`<wbr />`);
      if (s.insert !== undefined) {
        parts.push(
          html`<ins
            class="ui-agc__ins"
            data-ins=${s.id}
            data-sug=${s.id}
            style=${style}
            tabindex="0"
            role="button"
            aria-haspopup="dialog"
            aria-expanded=${isOpen ? "true" : "false"}
            ?data-open=${isOpen}
            data-focus-key=${`sug:${s.id}`}
            aria-label=${`${name} suggests adding: ${s.insert}`}
            @mouseenter=${(e: MouseEvent) => this.show(s.id, e.currentTarget as HTMLElement)}
            @mouseleave=${this.hide}
            @focus=${(e: FocusEvent) => this.show(s.id, e.currentTarget as HTMLElement)}
            @blur=${this.hide}
            @click=${(e: MouseEvent) => this.enter(s.id, e.currentTarget as HTMLElement)}
            @keydown=${onKey}
            .textContent=${s.insert}
          ></ins>`,
        );
      }
      pos = at + remove;
    }
    // An empty block keeps an invisible character, so a caret can sit in it while an agent starts typing
    if (pos < text.length || !parts.length) parts.push(html`<span data-from=${pos} .textContent=${text.slice(pos) || EMPTY}></span>`);
    return parts;
  }

  private image(b: DocBlock) {
    const w = Math.max(0.2, Math.min(1, b.width ?? 1));
    const ratio = b.ratio ?? 16 / 9;
    const fits = !!b.float && b.ratio === undefined;
    const box = fits ? this.layout.fit[b.id] : undefined;
    // Who holds it: an agent on it with a selection
    const by = this.agents.find((a) => this.cursors[a.id]?.block === b.id && this.cursors[a.id]?.select);
    return html`<figure class="ui-agc__figure" data-block=${b.id} data-kind="image" data-float=${ifDefined(b.float)} ?data-fit=${fits} style=${styleMap({ width: `${w * 100}%` })}>
      <div
        class="ui-agc__img"
        ?data-loading=${!!b.loading}
        ?data-held=${!!by}
        style=${styleMap({ height: fits && box ? `${box.h}px` : undefined, aspectRatio: fits && box ? undefined : String(ratio), "--tc-agent-cursors-c": by?.color })}
        role="img"
        aria-label=${b.loading ? "Image loading" : b.alt || b.text || "Image"}
      >
        ${b.loading || !b.src ? html`<span class="ui-agc__shimmer" aria-hidden="true"></span>` : html`<img src=${b.src} alt="" draggable="false" />`}
        ${by
          ? html`${["tl", "tr", "bl", "br"].map((h) => html`<span class="ui-agc__handle" data-at=${h} aria-hidden="true"></span>`)}<span class="ui-agc__size" aria-hidden="true"
                >${box ? `${box.w * 2} × ${box.h * 2}` : `${Math.round(1200 * w)} × ${Math.round((1200 * w) / ratio)}`}</span
              >`
          : nothing}
      </div>
      ${b.text ? html`<figcaption class="ui-agc__caption">${b.text}</figcaption>` : nothing}
    </figure>`;
  }

  private table(b: DocBlock, byBlock: Map<string, DocSuggestion[]>) {
    const [head, ...body] = b.rows ?? [];
    const cell = (c: DocBlock) =>
      c.tone
        ? html`<span class="ui-agc__pill" data-tone=${c.tone} data-block=${c.id} title=${ifDefined(c.text)}>${this.textParts(c, byBlock)}</span>`
        : html`<span class="ui-agc__cell" data-block=${c.id} title=${ifDefined(c.text)}>${this.textParts(c, byBlock)}</span>`;
    const onAdd = this.agents.filter((a) => this.cursors[a.id]?.block === `${b.id}:add`);
    return html`<div class="ui-agc__table-card">
      <table class="ui-agc__table">
        ${head ? html`<thead><tr>${repeat(head, (c) => c.id, (c) => html`<th>${cell(c)}</th>`)}</tr></thead>` : nothing}
        <tbody>
          ${repeat(
            body,
            (row, i) => row[0]?.id ?? i,
            (row) => html`<tr>${repeat(row, (c) => c.id, (c) => html`<td>${cell(c)}</td>`)}</tr>`,
          )}
        </tbody>
        ${b.addRow
          ? html`<tfoot>
              <tr>
                <td colspan=${head?.length ?? 1}>
                  <span class="ui-agc__add" data-block=${`${b.id}:add`} ?data-hover=${onAdd.length > 0} ?data-pressed=${onAdd.some((a) => this.cursors[a.id]?.press)}
                    >${plusIcon()}<span data-from="0">Add row</span></span
                  >
                </td>
              </tr>
            </tfoot>`
          : nothing}
      </table>
    </div>`;
  }

  private block(b: DocBlock, byBlock: Map<string, DocSuggestion[]>) {
    const kind = b.kind ?? "paragraph";
    if (kind === "image") return this.image(b);
    if (kind === "table") return this.table(b, byBlock);
    if (kind === "code") return html`<pre class="ui-agc__code" data-block=${b.id}><code>${this.textParts(b, byBlock)}</code></pre>`;
    const cls = `ui-agc__block ui-agc__block--${kind}`;
    const parts = this.textParts(b, byBlock);
    if (kind === "title") return html`<h2 class=${cls} data-block=${b.id}>${parts}</h2>`;
    if (kind === "heading") return html`<h3 class=${cls} data-block=${b.id}>${parts}</h3>`;
    if (kind === "item") return html`<li class=${cls} data-block=${b.id}>${parts}</li>`;
    return html`<p class=${cls} data-block=${b.id}>${parts}</p>`;
  }

  /** The page's text – consecutive items form one list */
  private docBody() {
    const byBlock = new Map<string, DocSuggestion[]>();
    for (const s of this.suggestions) byBlock.set(s.block, [...(byBlock.get(s.block) ?? []), s]);
    for (const list of byBlock.values()) list.sort((x, y) => x.at - y.at);
    const groups: { key: string; list: boolean; items: DocBlock[] }[] = [];
    const blocks = this.blocks;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].kind === "item") {
        const items: DocBlock[] = [];
        while (i < blocks.length && blocks[i].kind === "item") items.push(blocks[i++]);
        i--;
        groups.push({ key: `l:${items[0].id}`, list: true, items });
      } else groups.push({ key: `b:${blocks[i].id}`, list: false, items: [blocks[i]] });
    }
    return repeat(
      groups,
      (g) => g.key,
      (g) => (g.list ? html`<ul class="ui-agc__list">${repeat(g.items, (b) => b.id, (b) => this.block(b, byBlock))}</ul>` : this.block(g.items[0], byBlock)),
    );
  }

  private header() {
    const { agents, cursors, following } = this;
    const here = agents.filter((a) => cursors[a.id]);
    const spent = agents.some((a) => a.cost !== undefined) ? agents.reduce((sum, a) => sum + (a.cost ?? 0), 0) : null;
    const typing = here.filter((a) => cursors[a.id]?.typing).length;
    const count = this.suggestions.length;
    const tipsBack = () => (this.tipsHushed = false);
    return html`<header class="ui-agc__bar">
      <span class="ui-agc__doc" aria-hidden="true">${docIcon()}</span>
      <span class="ui-agc__title" title=${this.heading}>${this.heading}</span>
      <div class="ui-agc__people" role="group" aria-label="Agents in this document" @pointerover=${tipsBack} @focusin=${tipsBack}>
        ${repeat(
          agents,
          (a) => a.id,
          (a) => {
            const c = cursors[a.id];
            const isOn = following === a.id;
            return html`<button
              type="button"
              class="ui-agc__face"
              ?data-here=${!!c}
              ?data-typing=${!!c?.typing}
              aria-pressed=${isOn ? "true" : "false"}
              aria-label=${`${isOn ? "Stop following" : "Follow"} ${a.name}${c?.doing ? ` – ${c.doing}` : c ? "" : " (not in the document)"}`}
              style=${styleMap({ "--tc-agent-cursors-c": a.color, "--tc-agent-cursors-tint": a.tint })}
              @click=${() => this.follow(isOn ? null : a.id)}
            >
              <span class="ui-agc__face-mark">${this.mark(a)}</span>
              <span class="ui-agc__face-tip" aria-hidden="true"><b>${a.name}</b><span>${c?.doing ?? (c ? "In the document" : "Away")}</span></span>
            </button>`;
          },
        )}
      </div>
      <span class="ui-agc__sum"
        >${count > 0 ? `${count} suggestion${count === 1 ? "" : "s"}` : typing ? `${typing} typing` : `${here.length} here`}${spent !== null
          ? html`<b class="ui-agc__spent" ?data-zero=${spent === 0}>${this.formatCost(spent)}</b>`
          : nothing}</span
      >
      ${this.canAcceptAll ? html`<button type="button" class="ui-agc__all" ?disabled=${count === 0} @click=${() => this.emit("tc-accept-all", null)}>Accept all</button>` : nothing}
    </header>`;
  }

  private pin(cm: DocComment) {
    const at = this.layout.notes[cm.id];
    const a = this.agentOf(cm.agent);
    const isOpen = !!cm.open || this.pinOpen === cm.id;
    const { width, stageH } = this.layout;
    const pinH = this.layout.pinH[cm.id];
    const reply = this.replies[cm.id] ?? "";
    const state = this.sending[cm.id];
    const canReply = !!this.onReply;
    const close = (host: Element) => {
      this.closePin(cm.id);
      // From inside the window, focus goes back to the pin before the window turns inert
      const hit = host.querySelector<HTMLElement>(".ui-agc__pin-hit");
      rescueFocus(hit?.parentElement, [hit]);
    };
    // The window is as wide as fits, and moves in from the pin just enough to stay on the page
    const cardW = Math.min(248, Math.max(160, width - 16));
    const slide = isOpen ? Math.max(8 - at.x, Math.min(0, width - 8 - (at.x + cardW))) : 0;
    // Near the bottom it opens upwards
    const up = stageH > 0 && at.y + 190 > stageH;
    const who = a?.name ?? "an agent";
    return html`<div
      class="ui-agc__pin"
      data-comment=${cm.id}
      ?data-open=${isOpen}
      ?data-up=${up}
      style=${styleMap({
        left: `${at.x}px`,
        top: `${at.y}px`,
        "--tc-agent-cursors-c": a?.color,
        "--tc-agent-cursors-pin-h": `${pinH ?? 120}px`,
        "--tc-agent-cursors-pin-w": `${cardW}px`,
        "--tc-agent-cursors-pin-x": `${slide}px`,
      })}
      @mouseenter=${() => this.keepPin(cm.id, "hover")}
      @mouseleave=${() => this.leavePin(cm.id)}
      @focusin=${() => this.keepPin(cm.id, "focus")}
      @focusout=${(e: FocusEvent) => !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node) && this.leavePin(cm.id)}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key !== "Escape" || !isOpen || cm.open) return;
        e.stopPropagation();
        close(e.currentTarget as Element);
      }}
    >
      <div class="ui-agc__pin-box">
        <span class="ui-agc__pin-mark">${this.mark(a)}</span>
        <button
          type="button"
          class="ui-agc__pin-hit"
          aria-expanded=${isOpen ? "true" : "false"}
          aria-label=${`Comment from ${who}: ${cm.text}`}
          tabindex=${isOpen ? -1 : 0}
          data-focus-key=${`pin:${cm.id}`}
          @click=${() => this.keepPin(cm.id, "press")}
        ></button>
        <div class="ui-agc__pin-body" role="group" aria-label=${`Comment from ${who}`} .inert=${!isOpen}>
          <div class="ui-agc__note-head"><b>${a?.name}</b><span>now</span></div>
          <p class="ui-agc__note-text" data-block=${cm.id}><span data-from="0" .textContent=${cm.text || EMPTY}></span></p>
          ${canReply || this.canResolve
            ? html`<div class="ui-agc__pin-actions">
                ${canReply
                  ? html`<input
                      class="ui-agc__reply"
                      .value=${live(reply)}
                      placeholder="Reply"
                      aria-label=${`Reply to ${a?.name ?? "the agent"}`}
                      aria-busy=${ifDefined(state === "pending" ? "true" : undefined)}
                      aria-invalid=${ifDefined(state === "error" ? "true" : undefined)}
                      title=${ifDefined(state === "error" ? "Couldn't send – press Enter to try again" : undefined)}
                      ?readonly=${state === "pending"}
                      data-state=${ifDefined(state)}
                      @input=${(e: InputEvent) => (this.replies = { ...this.replies, [cm.id]: (e.currentTarget as HTMLInputElement).value })}
                      @keydown=${(e: KeyboardEvent) => {
                        if (e.key === "Enter" && !e.isComposing) this.send(cm);
                      }}
                    />`
                  : html`<span class="ui-agc__reply" aria-hidden="true"></span>`}
                ${this.canResolve
                  ? html`<button
                      type="button"
                      class="ui-agc__resolve"
                      aria-label="Resolve"
                      title="Resolve"
                      @click=${(e: MouseEvent) => {
                        close((e.currentTarget as Element).closest(".ui-agc__pin")!);
                        this.emit("tc-resolve", cm);
                      }}
                    >
                      ${checkIcon()}
                    </button>`
                  : nothing}
              </div>`
            : nothing}
        </div>
      </div>
    </div>`;
  }

  private pointer(a: CursorAgent, arriving: string[], noteIds: Set<string>) {
    const c = this.cursors[a.id];
    const gone = !c || !this.layout.placed.includes(a.id);
    const tags = a.cost !== undefined ? [this.formatCost(a.cost)] : [];
    return html`<div
      class="ui-agc__cursor"
      data-agent=${a.id}
      ?data-gone=${gone}
      ?data-arrive=${!gone && arriving.includes(a.id)}
      ?data-typing=${!!c?.typing}
      ?data-in-note=${!!c && noteIds.has(c.block)}
      ?data-press=${!!c?.press}
      ?data-drag=${c?.point === "corner" && !!c.select}
      ?data-dim=${!!this.following && this.following !== a.id}
      style=${styleMap({ "--tc-agent-cursors-c": a.color })}
    >
      <div class="ui-agc__cursor-in">
        <span class="ui-agc__caret"></span>
        ${arrow()}
        <span class="ui-agc__flag">
          <span class="ui-agc__flag-row"
            ><span class="ui-agc__flag-name">${a.name}</span>${tags.length
              ? html`<span class="ui-agc__flag-tags">${tags.map((t) => html`<span class="ui-agc__flag-tag">${t}</span>`)}</span>`
              : nothing}</span
          >
          <span class="ui-agc__flag-doing" ?data-on=${!!c?.doing}><span>${c?.doing ?? ""}</span></span>
        </span>
      </div>
    </div>`;
  }

  private pop() {
    const open = this.open;
    const s = open ? this.suggestions.find((x) => x.id === open.id) : undefined;
    if (!open || !s) return nothing;
    const agent = this.agentOf(s.agent);
    const name = agent?.name ?? "Agent";
    const box = open.box;
    const act = (kind: "tc-accept" | "tc-reject") => {
      this.backToTrigger();
      this.emit(kind, s);
    };
    return html`<div
      class="ui-agc__pop"
      role="dialog"
      aria-label=${`Suggestion from ${name}`}
      style=${styleMap({ left: `${Math.max(0, Math.min(box.x, this.layout.sheetW - 260))}px`, top: `${box.y + box.h + 6}px`, "--tc-agent-cursors-c": agent?.color })}
      @mouseenter=${() => window.clearTimeout(this.closeTimer)}
      @mouseleave=${this.hide}
      @focusin=${() => window.clearTimeout(this.closeTimer)}
      @focusout=${(e: FocusEvent) => !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node) && this.hide()}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          this.leavePop("back");
          return;
        }
        if (e.key !== "Tab") return;
        // The window sits at the end of the page's markup: leaving it goes back to where the suggestion is
        const buttons = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("button")];
        const edge = e.shiftKey ? buttons[0] : buttons[buttons.length - 1];
        if (document.activeElement !== edge) return;
        e.preventDefault();
        this.leavePop(e.shiftKey ? "back" : "next");
      }}
    >
      <div class="ui-agc__pop-head">
        <span class="ui-agc__pop-mark">${this.mark(agent)}</span>
        <b>${name}</b>
        <span>${s.remove && s.insert ? "suggests a rewrite" : s.remove ? "suggests removing" : "suggests adding"}</span>
      </div>
      ${s.note ? html`<p class="ui-agc__pop-note">${s.note}</p>` : nothing}
      <div class="ui-agc__pop-actions">
        ${this.canReject ? html`<button type="button" class="ui-agc__btn" @click=${() => act("tc-reject")}>Reject</button>` : nothing}
        ${this.canAccept ? html`<button type="button" class="ui-agc__btn ui-agc__btn--primary" @click=${() => act("tc-accept")}>Accept</button>` : nothing}
      </div>
    </div>`;
  }

  protected override render() {
    const tabList = this.tabs && this.tabs.length > 0 ? this.tabs : null;
    const current = this.tab ?? tabList?.[0].id;
    const { marks, notes } = this.layout;
    const arriving = this.present.filter((id) => !this.seenArrivals.has(id));
    const noteIds = new Set(this.comments.map((cm) => cm.id));
    const tabsId = this.uid;
    const onTabKey = (e: KeyboardEvent, i: number) => {
      if (!tabList) return;
      const n = tabList.length;
      const to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
      if (to < 0) return;
      e.preventDefault();
      this.pickTab(tabList[to].id);
      ((e.currentTarget as HTMLElement).parentElement?.children[to] as HTMLElement | undefined)?.focus();
    };
    return html`
      ${tabList
        ? html`<div class="ui-agc__tabs" role="tablist" aria-label="Views">
            ${tabList.map(
              (t, i) => html`<button
                id=${`${tabsId}-${i}`}
                type="button"
                role="tab"
                class="ui-agc__tab"
                aria-selected=${t.id === current ? "true" : "false"}
                aria-controls=${`${tabsId}-panel`}
                tabindex=${t.id === current ? 0 : -1}
                @click=${() => this.pickTab(t.id)}
                @keydown=${(e: KeyboardEvent) => onTabKey(e, i)}
              >
                ${t.label}
              </button>`,
            )}
          </div>`
        : nothing}
      <div
        class="ui-agc__stage"
        tabindex="-1"
        id=${ifDefined(tabList ? `${tabsId}-panel` : undefined)}
        role=${ifDefined(tabList ? "tabpanel" : undefined)}
        aria-labelledby=${ifDefined(tabList ? `${tabsId}-${tabList.findIndex((t) => t.id === current)}` : undefined)}
      >
        <div class="ui-agc__shade" aria-hidden="true"><span></span></div>
        <div class="ui-agc__sheet">
          ${this.header()}
          <div class="ui-agc__paper" aria-hidden="true"></div>
          <div class="ui-agc__marks" aria-hidden="true">
            ${this.agents.map((a) =>
              (marks[a.id] ?? []).map(
                (m) =>
                  html`<span
                    class="ui-agc__mark"
                    ?data-dim=${!!this.following && this.following !== a.id}
                    style=${styleMap({ left: `${m.x - 1}px`, top: `${m.y}px`, width: `${m.w + 2}px`, height: `${m.h}px`, "--tc-agent-cursors-c": a.color })}
                  ></span>`,
              ),
            )}
          </div>
          ${keyed(current ?? "", html`<div class="ui-agc__text">${this.docBody()}</div>`)}
        </div>
        <div class="ui-agc__notes">
          ${repeat(
            this.comments.filter((cm) => notes[cm.id]),
            (cm) => cm.id,
            (cm) => this.pin(cm),
          )}
        </div>
        <div class="ui-agc__cursors" aria-hidden="true">
          ${repeat(
            this.agents.filter((a) => this.layout.seen.includes(a.id)),
            (a) => a.id,
            (a) => this.pointer(a, arriving, noteIds),
          )}
        </div>
        ${this.pop()}
      </div>
      <span class="ui-agc__live" role="status" aria-live="polite">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="agc"] */
[data-ui="agc"] {
  --tc-agent-cursors-gap: 18px;
  /* The one ink every agent shares unless it brings its own color */
  --tc-agent-cursors-c: var(--tc-surface-inverse);
  /* Flags and comment pins: dark cards with a pink-to-blue edge (light cards in dark) */
  --tc-agent-cursors-flag-bg: var(--tc-surface-inverse);
  --tc-agent-cursors-flag-fg: var(--tc-text-on-inverse);
  --tc-agent-cursors-flag-soft: light-dark(rgba(255, 255, 255, 0.14), rgba(0, 0, 0, 0.08));
  /* Secondary text on a flag or pin (≥ 4.5:1 on the pin in both themes) */
  --tc-agent-cursors-flag-muted: color-mix(in srgb, var(--tc-agent-cursors-flag-fg) 65%, transparent);
  --tc-agent-cursors-edge: linear-gradient(90deg, #ff4fa3, #8b6bff 55%, #3b8bff);
  /* Image placeholders: a gray block with a lighter sweep */
  --tc-agent-cursors-shimmer: light-dark(#f0f0f0, #29292d);
  --tc-agent-cursors-shine: light-dark(#fafafa, #36363b);
  /* The white outline of the arrow and the resize handles */
  --tc-agent-cursors-outline: light-dark(#ffffff, #1f1f22);
  --tc-agent-cursors-glide: var(--tc-duration-slowest);
  /* The caret blinks a few times, then holds still (WCAG 2.2.2) */
  --tc-agent-cursors-blink: 1100ms;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: agc / inline-size;
}
/* Clean: hairlines as shadows, Inter 400/500, small radii, no tray */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="agc"] {
  --tc-agent-cursors-gap: 16px;
  /* Clean's inverse ink is translucent – flags and pins sit over text and over their gradient edge, so they stay opaque */
  --tc-agent-cursors-c: light-dark(#1f1f22, #e4e4e7);
  --tc-agent-cursors-flag-bg: light-dark(#141416, #f4f4f5);
  --tc-agent-cursors-shimmer: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --tc-agent-cursors-shine: light-dark(rgba(0, 0, 0, 0.015), rgba(255, 255, 255, 0.1));
  --tc-agent-cursors-outline: light-dark(#ffffff, #1c1c1f);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  letter-spacing: normal;
}
[data-ui="agc"] *, [data-ui="agc"] *::before, [data-ui="agc"] *::after { box-sizing: border-box; }
:where([data-ui="agc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="agc"] :is(button, .ui-agc__stage):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="agc"] svg { display: block; flex: none; }
.ui-agc__stage { position: relative; }
/* ----- Tabs above the page: the open one white with a stroke, the others a plain gray (the segmented recipe without a track) ----- */
.ui-agc__tabs { display: flex; gap: var(--tc-space-1-5); margin: 0 0 var(--tc-space-1-5); }
.ui-agc__tab { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__tab { height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); }
.ui-agc__tab:hover { color: var(--tc-text-primary); }
.ui-agc__tab[aria-selected="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-shadow-raised); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
/* A new view fades in softly */
.ui-agc__text { animation: ui-agc-view var(--tc-duration-slower) var(--tc-ease-move) both; }
@keyframes ui-agc-view { from { opacity: 0; filter: blur(2px); transform: translateY(4px); } }
/* ----- Tables: like the library's Data Table – a bordered card, 40px rows, gray header ----- */
.ui-agc__table-card { overflow: hidden; border-radius: var(--tc-radius-xl); box-shadow: var(--tc-shadow-raised); transition: height var(--tc-duration-slower) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__table-card { border-radius: var(--tc-card-radius); }
.ui-agc__table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); }
.ui-agc__table :is(th, td) { height: 40px; padding: 0 var(--tc-space-3); border-top: 1px solid var(--tc-border-subtle); border-left: 1px solid var(--tc-border-subtle); text-align: left; vertical-align: middle; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ui-agc__table :is(th, td):first-child { border-left: 0; }
/* The first column names the row – it gets the room */
.ui-agc__table th:first-child { width: 38%; }
.ui-agc__table th { border-top: 0; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-agc__table td { color: var(--tc-text-primary); }
/* Clean tables: hairlines between rows only, 13px, 12px gray header */
:where([data-look="clean"], [data-look="clean"] *).ui-agc__table { font-size: var(--tc-font-size-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__table :is(th, td) { border-top: var(--tc-hairline) solid var(--tc-divider); border-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__table th { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); }
/* "Add row": a quiet line under the rows, like the Data Table */
.ui-agc__table tfoot td { height: 44px; padding: 0 var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__table tfoot td { height: 40px; }
.ui-agc__add { display: inline-flex; align-items: center; gap: var(--tc-space-2); height: 30px; padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__add { height: 28px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-md); }
.ui-agc__add[data-hover] { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-agc__add[data-pressed] { background: var(--tc-fill-strong); transform: scale(0.97); }
/* Rows an agent adds slide in */
.ui-agc__table tbody tr { animation: ui-agc-row var(--tc-duration-slower) var(--tc-ease-move) both; }
@keyframes ui-agc-row { from { opacity: 0; transform: translateY(-6px); } }
/* Status cells: the pill pattern, in status colours */
.ui-agc__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-agent-cursors-pill-bg); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); color: var(--tc-agent-cursors-pill-fg); }
.ui-agc__pill[data-tone="gray"] { --tc-agent-cursors-pill-bg: var(--tc-fill-default); --tc-agent-cursors-pill-fg: var(--tc-text-muted); }
.ui-agc__pill[data-tone="blue"] { --tc-agent-cursors-pill-bg: var(--tc-status-info-bg); --tc-agent-cursors-pill-fg: var(--tc-status-info-fg); }
.ui-agc__pill[data-tone="green"] { --tc-agent-cursors-pill-bg: var(--tc-status-success-bg); --tc-agent-cursors-pill-fg: var(--tc-status-success-fg); }
.ui-agc__pill[data-tone="amber"] { --tc-agent-cursors-pill-bg: var(--tc-status-warning-bg); --tc-agent-cursors-pill-fg: var(--tc-status-warning-fg); }
/* ----- The page: a sheet of paper; with a height it fades out towards the bottom ----- */
/* Standard: a tray carries the header, the page is a card inside it */
.ui-agc__sheet { position: relative; overflow: hidden; border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); container-type: inline-size; }
.ui-agc__paper { position: absolute; inset: 48px var(--tc-tray-inset) var(--tc-tray-inset); z-index: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clean has no tray: one card, the header inside it */
:where([data-look="clean"], [data-look="clean"] *).ui-agc__sheet { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__paper { display: none; }
[data-ui="agc"][data-fade] .ui-agc__sheet { height: var(--tc-agent-cursors-height); }
/* Stroke and shadow: a box as big as the page inside a larger, transparent one – so the fade-out mask
   (applied to the larger box) leaves the shadow on every side, the top included. Only 4px wider than the page,
   so it never makes a narrow stage scroll sideways */
.ui-agc__shade { position: absolute; inset: -40px -4px; pointer-events: none; }
.ui-agc__shade > span { position: absolute; inset: 40px 4px; border-radius: var(--tc-tray-radius); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__shade > span { border-radius: var(--tc-card-radius); }
[data-ui="agc"][data-fade] .ui-agc__shade { bottom: auto; height: calc(var(--tc-agent-cursors-height) + 80px); }
[data-ui="agc"][data-fade] .ui-agc__sheet {
  -webkit-mask: linear-gradient(#000 0, #000 calc(var(--tc-agent-cursors-height) * 0.5), transparent calc(var(--tc-agent-cursors-height) * 0.97));
  mask: linear-gradient(#000 0, #000 calc(var(--tc-agent-cursors-height) * 0.5), transparent calc(var(--tc-agent-cursors-height) * 0.97));
}
[data-ui="agc"][data-fade] .ui-agc__shade {
  -webkit-mask: linear-gradient(#000 0, #000 calc(40px + var(--tc-agent-cursors-height) * 0.5), transparent calc(40px + var(--tc-agent-cursors-height) * 0.97));
  mask: linear-gradient(#000 0, #000 calc(40px + var(--tc-agent-cursors-height) * 0.5), transparent calc(40px + var(--tc-agent-cursors-height) * 0.97));
}
/* ----- The header ----- */
.ui-agc__bar { position: relative; z-index: 3; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; height: 48px; padding: 0 var(--tc-space-3) 0 var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__bar { height: 44px; padding: 0 var(--tc-space-2-5) 0 var(--tc-space-3-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-agc__doc { display: grid; flex: none; place-items: center; color: var(--tc-icon-muted); }
.ui-agc__title { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__title { font-size: var(--tc-font-size-md); }
.ui-agc__sum { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__sum { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-agc__spent { margin-left: var(--tc-space-2); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); transition: color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__spent { color: var(--tc-text-strong); }
/* Nothing spent yet: quieter, still readable */
.ui-agc__spent[data-zero] { color: var(--tc-text-muted); }
/* Accept all: the primary action, like Button (small in Standard, the default size in Clean) */
.ui-agc__all { flex: none; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__all { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); }
.ui-agc__all:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-agc__all:active:not(:disabled) { background: var(--tc-action-primary-bg-active); }
.ui-agc__all:disabled { opacity: 0.2; cursor: default; }
/* Who is here: faces side by side with a little room, so every working arc can be seen in full */
.ui-agc__people { display: flex; flex: none; align-items: center; }
.ui-agc__face { position: relative; display: grid; place-items: center; width: 28px; height: 28px; margin-left: var(--tc-space-1); border-radius: 50%; background: var(--tc-surface-raised); box-shadow: 0 0 0 2px var(--tc-surface-tray), inset 0 0 0 1.5px var(--tc-border-default); transition: transform var(--tc-duration-base) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__face { width: 24px; height: 24px; margin-left: var(--tc-space-1); box-shadow: 0 0 0 1.5px var(--tc-surface-raised), inset 0 0 0 1px var(--tc-fill-default); }
.ui-agc__face:first-child { margin-left: 0; }
.ui-agc__face:not([data-here]) { opacity: 0.4; }
/* Working: an arc in the agent's color runs around the face – like a loader, for a few seconds */
.ui-agc__face[data-here]::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, transparent 0deg, transparent 60deg, var(--tc-agent-cursors-c) 360deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); animation: ui-agc-spin var(--tc-duration-reveal-slow) linear 5; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__face[data-here]::before { -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px)); }
.ui-agc__face:hover, .ui-agc__face[aria-pressed="true"] { z-index: 1; transform: translateY(-1px); }
/* Followed: the face fills with a light wash of its color instead of a second ring */
.ui-agc__face[aria-pressed="true"] { background: var(--tc-agent-cursors-tint, color-mix(in srgb, var(--tc-agent-cursors-c) 16%, var(--tc-surface-raised))); }
.ui-agc__face-mark { display: grid; place-items: center; width: 14px; height: 14px; }
.ui-agc__face-mark svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__face-mark,
:where([data-look="clean"], [data-look="clean"] *).ui-agc__face-mark svg { width: 12px; height: 12px; }
.ui-agc__face-initial { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-none); color: var(--tc-agent-cursors-c); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__face-initial { font-size: var(--tc-font-size-2xs); }
/* The name and what it is doing: a tooltip on hover and focus – it stays while hovered, Esc hides it */
.ui-agc__face-tip { position: absolute; top: calc(100% + 8px); right: -6px; z-index: 4; display: grid; gap: 1px; padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-tooltip-font-size); line-height: var(--tc-line-height-tight); color: var(--tc-tooltip-fg); text-align: left; white-space: nowrap; opacity: 0; transform: translateY(-2px); pointer-events: none; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
/* A bridge over the gap, so the pointer can move onto the tip */
.ui-agc__face-tip::before { content: ""; position: absolute; right: 0; bottom: 100%; left: 0; height: 8px; }
.ui-agc__face-tip b { font-weight: var(--tc-font-weight-strong); }
.ui-agc__face-tip > span { opacity: 0.75; }
.ui-agc__face:hover .ui-agc__face-tip, .ui-agc__face:focus-visible .ui-agc__face-tip { opacity: 1; transform: none; pointer-events: auto; }
[data-ui="agc"][data-hush] .ui-agc__face .ui-agc__face-tip { opacity: 0; pointer-events: none; }
/* ----- The text ----- */
.ui-agc__text { position: relative; z-index: 1; padding: 36px var(--tc-space-12) var(--tc-space-12); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__text { padding: var(--tc-space-8) 44px 44px; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); }
.ui-agc__block { margin: 0; }
.ui-agc__text > * + * { margin-top: var(--tc-agent-cursors-gap); }
.ui-agc__block--title { font-size: 22px; font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-display-sm); letter-spacing: -0.022em; color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__block--title { font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-medium); letter-spacing: -0.01em; color: var(--tc-text-strong); }
.ui-agc__text > .ui-agc__block--title + * { margin-top: var(--tc-space-3); }
.ui-agc__block--heading { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-loose); letter-spacing: -0.012em; color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__block--heading { font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-relaxed); letter-spacing: -0.01em; color: var(--tc-text-strong); }
.ui-agc__text > .ui-agc__block--heading:not(:first-child) { margin-top: calc(var(--tc-agent-cursors-gap) + 10px); }
.ui-agc__text > .ui-agc__block--heading + * { margin-top: var(--tc-space-2); }
.ui-agc__list { margin: 0; padding: 0 0 0 var(--tc-space-5); }
.ui-agc__list .ui-agc__block + .ui-agc__block { margin-top: var(--tc-space-1); }
.ui-agc__block--item::marker { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__block--item::marker { color: var(--tc-text-disabled); }
/* Code: a soft panel, monospace, same suggestions inside */
.ui-agc__code { margin: 0; padding: var(--tc-space-3-5) var(--tc-space-4); overflow: hidden; border-radius: var(--tc-radius-xl); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 1px var(--tc-border-default); font-family: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); letter-spacing: 0; color: var(--tc-text-primary); white-space: pre-wrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__code { padding: var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-agc__code code { font: inherit; }
/* Images: loading with a shimmer; held by an agent: frame, handles and size in its color */
.ui-agc__figure { max-width: 100%; margin: 0; transition: width var(--tc-duration-slowest) var(--tc-ease-move); }
.ui-agc__text::after { content: ""; display: block; clear: both; }
/* Floated: the next text runs beside the image and follows it as it gets narrower */
/* A floated image and the text beside it start together, one gap below what came before */
.ui-agc__figure[data-float="left"] { float: left; margin: var(--tc-agent-cursors-gap) 24px 8px 0; }
.ui-agc__figure[data-float="right"] { float: right; margin: var(--tc-agent-cursors-gap) 0 8px 24px; }
.ui-agc__text > .ui-agc__figure[data-float] { margin-top: var(--tc-agent-cursors-gap); }
.ui-agc__text > :is(.ui-agc__block--heading, .ui-agc__code, .ui-agc__list) { clear: both; }
/* Narrow pages: the image above its text instead of beside it */
@container (max-width: 480px) {
  .ui-agc__figure[data-float] { float: none; margin: 0 0 var(--tc-space-3); }
}
.ui-agc__img { position: relative; display: grid; width: 100%; border-radius: var(--tc-radius-xl); background: var(--tc-agent-cursors-shimmer); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__img { border-radius: var(--tc-radius-md); }
.ui-agc__img > img { width: 100%; height: 100%; border-radius: inherit; object-fit: cover; animation: ui-agc-fade var(--tc-duration-slowest) var(--tc-ease-standard) both; }
/* Loading: a light sweep moves across (transform, a few times – then the gray block holds still) */
.ui-agc__shimmer { position: relative; display: block; width: 100%; height: 100%; overflow: hidden; border-radius: inherit; background: var(--tc-agent-cursors-shimmer); }
.ui-agc__shimmer::after { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 35%, var(--tc-agent-cursors-shine) 50%, transparent 65%); transform: translateX(-100%); animation: ui-agc-shimmer var(--tc-duration-shimmer) linear 3; }
.ui-agc__img[data-held] { box-shadow: 0 0 0 2px var(--tc-agent-cursors-c); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__img[data-held] { box-shadow: 0 0 0 1.5px var(--tc-agent-cursors-c); }
.ui-agc__handle { position: absolute; width: 10px; height: 10px; border-radius: var(--tc-radius-2xs); background: var(--tc-agent-cursors-outline); box-shadow: 0 0 0 1.5px var(--tc-agent-cursors-c), 0 1px 3px rgba(0, 0, 0, 0.18); animation: ui-agc-fade var(--tc-duration-fast) var(--tc-ease-standard) both; }
.ui-agc__handle[data-at="tl"] { top: -5px; left: -5px; }
.ui-agc__handle[data-at="tr"] { top: -5px; right: -5px; }
.ui-agc__handle[data-at="bl"] { bottom: -5px; left: -5px; }
.ui-agc__handle[data-at="br"] { right: -5px; bottom: -5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__handle { width: 8px; height: 8px; box-shadow: 0 0 0 1px var(--tc-agent-cursors-c), 0 1px 2px rgba(0, 0, 0, 0.16); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__handle[data-at="tl"] { top: -4px; left: -4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__handle[data-at="tr"] { top: -4px; right: -4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__handle[data-at="bl"] { bottom: -4px; left: -4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__handle[data-at="br"] { right: -4px; bottom: -4px; }
.ui-agc__size { position: absolute; bottom: 10px; left: 50%; translate: -50% 0; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); background: var(--tc-agent-cursors-c); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-normal); color: #ffffff; white-space: nowrap; font-variant-numeric: tabular-nums; animation: ui-agc-fade var(--tc-duration-fast) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__size { border-radius: var(--tc-radius-xs); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-agc__caption { margin-top: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__caption { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* Suggestions: new text underlined in the agent's color, removed text struck through – buttons that open the suggestion */
.ui-agc__ins, .ui-agc__del { border-radius: var(--tc-radius-2xs); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.ui-agc__ins:focus-visible, .ui-agc__del:focus-visible { outline: var(--tc-focus-outline); outline-offset: 1px; }
.ui-agc__ins { padding: 1px 0; background: color-mix(in srgb, var(--tc-agent-cursors-c) 12%, transparent); color: var(--tc-text-primary); text-decoration: underline 1.5px var(--tc-agent-cursors-c); text-underline-offset: 4px; animation: ui-agc-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__ins { background: color-mix(in srgb, var(--tc-agent-cursors-c) 10%, transparent); text-decoration-thickness: 1px; }
.ui-agc__del { color: var(--tc-text-muted); text-decoration: line-through 1.5px var(--tc-agent-cursors-c); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__del { text-decoration-thickness: 1px; }
.ui-agc__ins:hover, .ui-agc__ins[data-open], .ui-agc__ins:focus-visible { background: color-mix(in srgb, var(--tc-agent-cursors-c) 22%, transparent); }
.ui-agc__del:hover, .ui-agc__del[data-open], .ui-agc__del:focus-visible { background: color-mix(in srgb, var(--tc-agent-cursors-c) 10%, transparent); }
/* Selections: the passage lights up in the agent's color, behind the text */
.ui-agc__marks { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.ui-agc__mark { position: absolute; border-radius: var(--tc-radius-2xs); background: color-mix(in srgb, var(--tc-agent-cursors-c) 20%, transparent); animation: ui-agc-fade var(--tc-duration-base) var(--tc-ease-standard) both; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__mark { background: color-mix(in srgb, var(--tc-agent-cursors-c) 16%, transparent); }
.ui-agc__mark[data-dim] { opacity: 0.25; }
/* ----- Comment pins ----- */
.ui-agc__notes { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
.ui-agc__pin { position: absolute; width: 0; height: 0; pointer-events: auto; animation: ui-agc-fade var(--tc-duration-moderate) var(--tc-ease-standard) both; }
/* One shape: closed, a round pin with three soft corners and a sharp one pointing at its spot;
   open, it grows into the comment's window – to the bottom right, to the left near the edge, upwards near the bottom */
.ui-agc__pin { --tc-agent-cursors-pin: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__pin { --tc-agent-cursors-pin: 28px; }
.ui-agc__pin-box { position: absolute; top: calc(var(--tc-agent-cursors-pin) * -1); left: var(--tc-agent-cursors-pin-x, 0px); width: var(--tc-agent-cursors-pin); height: var(--tc-agent-cursors-pin); overflow: hidden; border-radius: var(--tc-radius-2xl) var(--tc-radius-2xl) var(--tc-radius-2xl) var(--tc-radius-2xs); background: var(--tc-agent-cursors-flag-bg); color: var(--tc-agent-cursors-flag-fg); box-shadow: 0 0 0 1px var(--tc-agent-cursors-flag-soft), 0 8px 20px -8px rgba(0, 0, 0, 0.45); transition: left var(--tc-duration-slow) var(--tc-ease-move), width var(--tc-duration-slow) var(--tc-ease-move), height var(--tc-duration-slow) var(--tc-ease-move), border-radius var(--tc-duration-slow) var(--tc-ease-move), box-shadow var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__pin-box { border-radius: 14px 14px 14px var(--tc-radius-2xs); }
/* The closed pin's focus ring sits on the pin itself (its button is clipped inside it) */
.ui-agc__pin:has(.ui-agc__pin-hit:focus-visible) .ui-agc__pin-box { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-agc__pin[data-up] .ui-agc__pin-box { top: auto; bottom: 0; }
.ui-agc__pin[data-open] { z-index: 1; }
.ui-agc__pin[data-open] .ui-agc__pin-box { width: var(--tc-agent-cursors-pin-w, 248px); height: var(--tc-agent-cursors-pin-h); border-radius: var(--tc-menu-radius); box-shadow: 0 0 0 1px var(--tc-agent-cursors-flag-soft), 0 16px 32px -14px rgba(0, 0, 0, 0.4); }
/* The mark: centered in the pin, in the window's corner once open */
.ui-agc__pin-mark { position: absolute; z-index: 1; top: 7px; left: 7px; display: grid; place-items: center; width: 16px; height: 16px; transition: top var(--tc-duration-slow) var(--tc-ease-move), left var(--tc-duration-slow) var(--tc-ease-move), width var(--tc-duration-slow) var(--tc-ease-move), height var(--tc-duration-slow) var(--tc-ease-move); pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__pin-mark { width: 14px; height: 14px; }
.ui-agc__pin-mark svg { width: 100%; height: 100%; }
.ui-agc__pin[data-open] .ui-agc__pin-mark { top: 11px; left: 12px; width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__pin[data-open] .ui-agc__pin-mark { top: 10px; left: 11px; width: 12px; height: 12px; }
.ui-agc__pin-hit { position: absolute; inset: 0; z-index: 2; border-radius: inherit; }
.ui-agc__pin[data-open] .ui-agc__pin-hit { pointer-events: none; }
/* The content: fixed width, so its height is the open height; it fades in once the window has room */
.ui-agc__pin-body { position: absolute; top: 0; left: 0; display: grid; gap: var(--tc-space-1); width: var(--tc-agent-cursors-pin-w, 248px); padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-3); opacity: 0; transition: opacity var(--tc-duration-quick) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__pin-body { gap: var(--tc-space-0-5); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-3); }
.ui-agc__pin[data-up] .ui-agc__pin-body { top: auto; bottom: 0; }
.ui-agc__pin[data-open] .ui-agc__pin-body { opacity: 1; transition: opacity var(--tc-duration-base) var(--tc-ease-standard) var(--tc-duration-fast); }
.ui-agc__pin-body .ui-agc__note-head { padding-left: 22px; color: var(--tc-agent-cursors-flag-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__pin-body .ui-agc__note-head { padding-left: var(--tc-space-5); }
.ui-agc__pin-body .ui-agc__note-head b { color: var(--tc-agent-cursors-flag-fg); }
.ui-agc__pin-body .ui-agc__note-text { color: color-mix(in srgb, var(--tc-agent-cursors-flag-fg) 86%, transparent); }
.ui-agc__note-head { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-agc__note-head b { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-agc__note-head > span:last-child { margin-left: auto; }
.ui-agc__note-text { margin: 0; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
/* Reply and resolve: a field and a square with a check, in the pin's inverted colours */
.ui-agc__pin-actions { display: flex; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1-5); }
.ui-agc__reply { flex: 1; min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-agent-cursors-flag-soft); box-shadow: inset 0 0 0 1px var(--tc-agent-cursors-flag-soft); font: inherit; font-size: var(--tc-font-size-md); color: var(--tc-agent-cursors-flag-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__reply { height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); }
.ui-agc__reply::placeholder { color: var(--tc-agent-cursors-flag-muted); }
.ui-agc__reply[data-state="pending"] { opacity: 0.6; }
.ui-agc__reply[data-state="error"] { box-shadow: inset 0 0 0 1px var(--tc-status-danger-solid); }
/* Focus inside the pin: a ring in the pin's own ink, which contrasts with it in both themes */
[data-ui="agc"] .ui-agc__pin-body :focus-visible { outline: var(--tc-focus-ring-width) solid var(--tc-agent-cursors-flag-fg); outline-offset: 2px; }
.ui-agc__resolve { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-agent-cursors-flag-fg); color: var(--tc-agent-cursors-flag-bg); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__resolve { width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); }
.ui-agc__resolve:hover { opacity: 0.86; }
/* ----- The pointers ----- */
/* No mask here, so flags may stick out past the page's sides – pointers low on a fading page fade on their own */
.ui-agc__cursors { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.ui-agc__cursor-in { transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-agc__cursor { position: absolute; top: 0; left: 0; transition: transform var(--tc-agent-cursors-glide) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard); will-change: transform; }
/* Typing: the pointer keeps up with every letter */
.ui-agc__cursor[data-typing] { transition: transform var(--tc-duration-quick) linear, opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
/* Holding an image by its corner: the pointer sticks to the handle frame by frame, no glide behind it */
.ui-agc__cursor[data-drag] { transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-agc__cursor[data-arrive] { transition: none; opacity: 0; }
.ui-agc__cursor:not([data-arrive]):not([data-gone]) { animation: ui-agc-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-agc__cursor[data-gone] { opacity: 0; }
.ui-agc__cursor[data-dim] { opacity: 0.22; }
.ui-agc__cursor[data-gone][data-dim] { opacity: 0; }
.ui-agc__caret { position: absolute; top: 0; left: -1px; width: 2px; height: var(--tc-agent-cursors-h, 18px); border-radius: var(--tc-radius-2xs); background: var(--tc-agent-cursors-c); animation: ui-agc-blink var(--tc-agent-cursors-blink) steps(1, end) 4; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__caret { left: -0.75px; width: 1.5px; }
.ui-agc__cursor[data-typing] .ui-agc__caret { animation: none; }
.ui-agc__cursor[data-free] .ui-agc__caret { display: none; }
/* The arrow's tip sits just below the caret – or right on the point, on an image */
.ui-agc__arrow { position: absolute; z-index: 1; top: calc(var(--tc-agent-cursors-h, 18px) - 6px); left: 0; width: 19px; height: 23px; overflow: visible; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.22)); transform-origin: 2px 1px; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
/* A slightly smaller arrow in Clean – the flag follows its notch */
:where([data-look="clean"], [data-look="clean"] *).ui-agc__arrow { width: 17px; height: 21px; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2)); }
.ui-agc__cursor[data-free] .ui-agc__arrow { top: -0.6px; left: -2.3px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__cursor[data-free] .ui-agc__arrow { top: -0.55px; left: -2.05px; }
/* A click: the arrow presses in around its tip */
.ui-agc__cursor[data-press] .ui-agc__arrow { transform: scale(0.82); }
.ui-agc__arrow path { fill: var(--tc-agent-cursors-c); stroke: var(--tc-agent-cursors-outline); stroke-width: 1.4; paint-order: stroke; }
/* The flag: the name, and what the agent is doing slides out next to it */
.ui-agc__flag { position: absolute; top: calc(var(--tc-agent-cursors-h, 18px) + 15px); left: calc(16px + var(--tc-agent-cursors-shift, 0px)); display: grid; width: max-content; padding: var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-1-5); border-bottom: 1px solid transparent; border-radius: var(--tc-radius-lg); background: linear-gradient(var(--tc-agent-cursors-flag-bg), var(--tc-agent-cursors-flag-bg)) padding-box, var(--tc-agent-cursors-edge) border-box; box-shadow: 0 8px 18px -8px rgba(255, 79, 163, 0.5), 6px 8px 18px -8px rgba(59, 139, 255, 0.5), 0 2px 6px -2px rgba(0, 0, 0, 0.3); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); color: var(--tc-agent-cursors-flag-fg); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__flag { top: calc(var(--tc-agent-cursors-h, 18px) + 13px); left: calc(15px + var(--tc-agent-cursors-shift, 0px)); padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-1); border-radius: var(--tc-radius-md); }
/* In a comment window the agent's own flag steps aside – the window shows its name */
.ui-agc__cursor[data-in-note] .ui-agc__flag { opacity: 0; }
/* On an image the arrow sits right on its point */
.ui-agc__cursor[data-free] .ui-agc__flag { top: 21px; left: calc(14px + var(--tc-agent-cursors-shift, 0px)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__cursor[data-free] .ui-agc__flag { top: 19px; left: calc(13px + var(--tc-agent-cursors-shift, 0px)); }
.ui-agc__flag-row { display: flex; align-items: center; gap: var(--tc-space-3); }
.ui-agc__flag-tags { display: flex; gap: var(--tc-space-1); margin-left: auto; }
.ui-agc__flag-tag { padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-agent-cursors-flag-soft); font-size: 10.5px; font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
/* What it's doing: a second line that opens below the name */
.ui-agc__flag-doing { display: block; max-height: 0; overflow: hidden; opacity: 0; transition: max-height var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard), margin-top var(--tc-duration-slow) var(--tc-ease-move); }
.ui-agc__flag-doing > span { display: block; width: max-content; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__flag-doing > span { font-weight: var(--tc-font-weight-regular); }
.ui-agc__flag-doing[data-on] { max-height: 18px; margin-top: 1px; opacity: 0.9; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__flag-doing[data-on] { opacity: 0.88; }
.ui-agc__cursor[data-dim] .ui-agc__flag-doing { max-height: 0; opacity: 0; }
/* ----- The open suggestion: the popover recipe ----- */
.ui-agc__pop { position: absolute; z-index: 5; display: grid; gap: var(--tc-space-1-5); width: 260px; padding: var(--tc-space-2-5); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-agc-rise var(--tc-duration-base) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__pop { gap: var(--tc-space-1); }
.ui-agc__pop-head { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__pop-head { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-agc__pop-head b { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__pop-head b { color: var(--tc-text-strong); }
/* The agent's mark next to its name – the model maker's logo, or its initial */
.ui-agc__pop-mark { display: grid; flex: none; place-items: center; width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__pop-mark { width: 12px; height: 12px; }
.ui-agc__pop-mark svg { width: 100%; height: 100%; }
.ui-agc__pop-note { margin: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__pop-note { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); }
.ui-agc__pop-actions { display: flex; justify-content: flex-end; gap: var(--tc-space-1-5); margin-top: var(--tc-space-0-5); }
/* Reject / Accept: Button's secondary and primary (small in Standard, the default size in Clean) */
.ui-agc__btn { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__btn { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); }
.ui-agc__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-agc__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-agc__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-agc__btn--primary:active { background: var(--tc-action-primary-bg-active); }
.ui-agc__live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes ui-agc-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
@keyframes ui-agc-pop { from { opacity: 0; scale: 0.85; } }
@keyframes ui-agc-fade { from { opacity: 0; } }
@keyframes ui-agc-in { from { background-color: transparent; } }
@keyframes ui-agc-rise { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@keyframes ui-agc-spin { to { transform: rotate(360deg); } }
@keyframes ui-agc-shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
/* Phones: follows the component's own width, not the window's (the old 520px viewport query fired on phones,
   where the page is ~340–400px wide) */
@container agc (max-width: 400px) {
  .ui-agc__text { padding: 26px 22px 36px; font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); }
  .ui-agc__block--title { font-size: var(--tc-font-size-2xl); line-height: 26px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-agc__text { padding: var(--tc-space-6) var(--tc-space-5) var(--tc-space-8); }
  /* The count and cost give way to the faces and Accept all; the suggestions themselves stay in the text */
  .ui-agc__sum { display: none; }
}
/* Narrow (phones): a compact header, smaller flags, and tables whose cells wrap instead of cutting words */
@container agc (max-width: 480px) {
  .ui-agc__bar { gap: var(--tc-space-1-5); padding: 0 var(--tc-space-2) 0 var(--tc-space-3); }
  /* The title gives way to the faces – it is in the document's own heading, and in the tab title */
  .ui-agc__title { display: none; }
  .ui-agc__doc { margin-right: auto; }
  .ui-agc__face { width: 26px; height: 26px; margin-left: var(--tc-space-0-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-agc__face { width: 24px; height: 24px; }
  .ui-agc__text { padding: var(--tc-space-6) var(--tc-space-5) var(--tc-space-8); }
  :where([data-look="clean"], [data-look="clean"] *).ui-agc__text { padding: 22px var(--tc-space-4-5) 30px; }
  .ui-agc__flag { padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-1); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-xs); line-height: 14px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-agc__flag { padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-1); }
  .ui-agc__flag-tag { padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-2xs); line-height: 14px; }
  .ui-agc__flag-doing > span { font-size: 10.5px; }
  .ui-agc__flag-row { gap: var(--tc-space-2); }
  .ui-agc__table { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
  .ui-agc__table :is(th, td) { height: auto; padding: var(--tc-space-2) var(--tc-space-1); white-space: normal; text-overflow: clip; }
  .ui-agc__table :is(th, td):first-child { padding-left: var(--tc-space-2); }
  .ui-agc__table th { font-size: var(--tc-font-size-xs); }
  .ui-agc__table th:first-child { width: 30%; }
  .ui-agc__pill { display: inline-block; height: auto; min-height: 18px; padding: 1px var(--tc-space-1-5); font-size: 10.5px; line-height: var(--tc-line-height-tight); white-space: normal; }
}
/* The narrowest phones: a little more room for the table */
@container agc (max-width: 340px) {
  .ui-agc__text, :where([data-look="clean"], [data-look="clean"] *).ui-agc__text { padding-right: var(--tc-space-3); padding-left: var(--tc-space-3); }
  .ui-agc__table { font-size: var(--tc-font-size-xs); }
  .ui-agc__table th:first-child { width: 28%; }
}
@media (pointer: coarse) {
  .ui-agc__face { width: 32px; height: 32px; }
  .ui-agc__btn { height: 36px; padding: 0 var(--tc-space-3-5); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="agc"] *, [data-ui="agc"] *::before, [data-ui="agc"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-agent-cursors")) customElements.define("tc-agent-cursors", TcAgentCursors);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-cursors": TcAgentCursors;
  }
}

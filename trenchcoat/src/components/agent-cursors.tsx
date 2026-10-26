"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react";
import { useControllable } from "../internal/use-controllable";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Agent Cursors – agents working in a document like teammates in a multiplayer editor, in a single self-contained file.
 * Every agent has a pointer with its name on a small flag – a dark card with a pink-to-blue edge – and you see live where each one is and
 * what it is doing – in the text, on an image, in a code block or in a comment next to the page.
 *   · pointers glide from place to place; while an agent types, its pointer and caret follow every letter
 *   · an agent can select a passage – it lights up in the agent's color – and the flag tells what it does with it
 *   · changes arrive as suggestions in the agent's color: new text underlined, removed text struck through;
 *     hover or focus one to see it; Enter or Space opens it to accept or reject it (Esc goes back), or accept them all from the header
 *   · images shimmer while they load; an agent can take one by its corner and resize it – frame, handles and size in its color
 *   · comments are pins on the page: open while an agent writes, then a round pin with the agent's mark;
 *     hover or focus a pin to read it, reply, or resolve it
 *   · the faces in the header show who is here and who is typing; click one to follow that agent – the others fade back
 *   · with a fixed height the page fades out towards the bottom, like a long document seen through a window
 * The positions are measured from the page itself, so any width, font or zoom works.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (Standard by default). Clean has no tray – one white page with the header inside it – and draws
 * hairlines as shadows, with Inter 400/500, small radii and quieter tables. The markup and behaviour are the same.
 */

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-agc";

export type CursorAgent = {
  id: string;
  name: string;
  /** The agent's color – pointer, caret, selection, frame and suggestions. Leave it out for the one shared ink
   *  (near-black, light in dark mode), so every agent looks the same and only the logos tell them apart */
  color?: string;
  /** A small mark, e.g. the model maker's logo – defaults to the initial */
  avatar?: ReactNode;
  /** The fill of its face while you follow it – defaults to a light wash of its color (e.g. a gray for a black logo) */
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
  /** Table: its rows of cells, the first one the header. Every cell is a block of its own (id and text),
   *  so cursors, selections, suggestions and comment pins work in it like anywhere else */
  rows?: DocBlock[][];
  /** Table: shows an "Add row" line under the rows, like the Data Table – a cursor can point at it
   *  with the block id `${table id}:add` (and press it); add the row to `rows` and the table grows smoothly */
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
  /** Text: a selected passage of this many characters from `at`. Image: any number – the agent holds the image (frame and handles) */
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

type AgentCursorsOwnProps = {
  /** Visual style: "standard" (the default) or "clean" */
  look?: Look;
  agents: CursorAgent[];
  blocks: DocBlock[];
  suggestions?: DocSuggestion[];
  /** Comment pins on the page */
  comments?: DocComment[];
  /** Resolves a comment – the black check in its window */
  onResolveComment?: (comment: DocComment) => void;
  /** A reply typed into a comment's window and sent with Enter. May return a promise: the field waits while it
   *  runs, and if it rejects the text comes back so it can be sent again */
  onReply?: (comment: DocComment, text: string) => void | Promise<unknown>;
  /** Where each agent is – a missing or null entry means the agent has left the document */
  cursors: Record<string, AgentCursor | null | undefined>;
  onAccept?: (suggestion: DocSuggestion) => void;
  onReject?: (suggestion: DocSuggestion) => void;
  /** Shows "Accept all" in the header when there is more than one suggestion */
  onAcceptAll?: () => void;
  /** The agent you follow (the others fade back). Controlled when defined (null = nobody); otherwise the
   *  component keeps it, starting from `defaultFollowing` */
  following?: string | null;
  defaultFollowing?: string | null;
  onFollowingChange?: (agent: string | null) => void;
  /** A fixed page height in px – the rest of the document fades out towards the bottom */
  height?: number;
  /** Formats every cost – defaults to dollars, e.g. "$0.42" */
  formatCost?: (amount: number) => string;
  /** Tabs above the page, e.g. the document and a table view of it */
  tabs?: DocTab[];
  /** The open tab. Controlled when defined; otherwise the component keeps it, starting from `defaultTab` (the
   *  first tab). Either way the page content is yours to switch – listen with `onTabChange` */
  tab?: string;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
  title?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type AgentCursorsProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentCursorsOwnProps> & AgentCursorsOwnProps;

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
    suggestions: suggestions
      .filter((x) => x.id !== id)
      .map((x) => (x.block === s.block && x.at >= s.at + remove ? { ...x, at: x.at + shift } : x)),
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
/** One empty list for every default, so memoised work keyed on it stays put */
const NONE: never[] = [];

/* ---------- Measuring: every pointer, selection and comment from the page itself ---------- */

/** What the page's geometry decides about the markup – React re-renders only when one of these changes */
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

type MeasureInput = { agents: CursorAgent[]; cursors: AgentCursorsProps["cursors"]; comments: DocComment[]; height?: number };

/** A pointer's place, caret height, flag shift and fade, written straight to its element – no React render per move */
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

/** Tables grow and shrink smoothly: the card's height follows its table with a transition,
 *  so a new row opens up and everything below slides down instead of jumping. All reads first, then the writes */
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

/** The nearest ancestor that clips the component (a scroll area, a preview frame) – null for the window */
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

type DocInputs = MeasureInput & { blocks: DocBlock[]; suggestions: DocSuggestion[]; tab?: string; formatCost: unknown };

/** The measuring engine: its own mutable state (pointer geometry, pointer elements), created once per component */
function createDocMeasure() {
  let input: MeasureInput = { agents: [], cursors: {}, comments: [] };
  // Pointer geometry lives here, not in state: the current and the last place of every agent, the clip edge and flag widths
  let points: Record<string, Point> = {};
  const last: Record<string, Point> = {};
  let clipR = Infinity;
  let flagW: Record<string, number> = {};
  // The clipping ancestor – undefined until looked up, again after a resize
  let clip: HTMLElement | null | undefined;
  const pointers = new Map<string, HTMLElement>();
  const refs = new Map<string, (el: HTMLElement | null) => void>();
  // What React was last given – compared here, because even a state update that changes nothing costs a render
  let shown = NO_LAYOUT;

  const write = (id: string, el: HTMLElement) => {
    const p = points[id] ?? last[id];
    if (!p) return;
    const { height } = input;
    // A flag may stick out past the page, but moves in before the clipping edge would cut it off
    const shift = Math.min(0, clipR - 8 - (p.x + 16 + (flagW[id] ?? 0)));
    const fade = height ? Math.max(0, Math.min(1, (height * 0.97 - p.y) / (height * 0.47))) : 1;
    placePointer(el, p, shift, fade);
  };

  return {
    setInput(next: MeasureInput) {
      input = next;
    },
    /** A stable ref callback per agent: the element gets its place the moment it mounts */
    pointerRef(id: string) {
      let fn = refs.get(id);
      if (!fn) {
        fn = (el) => {
          if (el) {
            pointers.set(id, el);
            write(id, el);
          } else pointers.delete(id);
        };
        refs.set(id, fn);
      }
      return fn;
    },
    /** The page moved within its frame: the clipping ancestor may be another one now */
    resized() {
      clip = undefined;
    },
    measure(stage: HTMLElement | null, sheet: HTMLElement | null, commit: (layout: DocLayout) => void) {
      if (!stage) return;
      const { agents, cursors, comments } = input;
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
      if (clip === undefined) clip = clipAncestor(stage);
      const right = clip ? clip.getBoundingClientRect().right : window.innerWidth;
      const nextFlagW: Record<string, number> = {};
      for (const [id, el] of pointers) {
        const flag = el.querySelector<HTMLElement>(".ui-agc__flag");
        if (flag) nextFlagW[id] = flag.offsetWidth;
      }
      const next: DocLayout = {
        placed: Object.keys(nextPoints),
        // The last place of every agent, so one that leaves fades out where it was
        seen: Object.keys(Object.assign(last, nextPoints)),
        marks,
        notes,
        pinH,
        fit,
        width: stage.offsetWidth,
        sheetW: sheet?.offsetWidth ?? stage.offsetWidth,
        stageH: stage.offsetHeight,
      };
      // Writes: the pointers straight to their elements, then the state – which only changes when the markup must
      points = nextPoints;
      clipR = Math.round((right - outer.left) / scale);
      flagW = nextFlagW;
      for (const [id, el] of pointers) write(id, el);
      const kept = keepSame(shown, next);
      if (kept !== shown) commit((shown = kept));
    },
  };
}

/**
 * Measures the page when what's on it changes, when it changes size, when the fonts arrive, and every frame
 * while an image or table resizes. Pointers move by writing their styles (transform and CSS variables);
 * the returned layout – selections, pins, fitted images – only changes state when it really changes.
 */
function useDocLayout(stageRef: { current: HTMLDivElement | null }, sheetRef: { current: HTMLDivElement | null }, inputs: DocInputs) {
  const [layout, setLayout] = useState<DocLayout>(NO_LAYOUT);
  const [engine] = useState(createDocMeasure);
  const { agents, cursors, comments, height, blocks, suggestions, tab, formatCost } = inputs;

  // After every change to what's on the page – and to what the last measurement changed in it (new pointers, fitted
  // images, pin widths) – but not on hover or while a reply is typed: those don't move anything
  useLayoutEffect(() => {
    engine.setInput({ agents, cursors, comments, height });
    engine.measure(stageRef.current, sheetRef.current, setLayout);
  }, [engine, stageRef, sheetRef, agents, cursors, comments, height, blocks, suggestions, tab, formatCost, layout.seen, layout.fit, layout.width]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const run = () => engine.measure(stageRef.current, sheetRef.current, setLayout);
    const ro = new ResizeObserver(() => {
      engine.resized();
      run();
    });
    ro.observe(stage);
    let alive = true;
    document.fonts?.ready.then(() => alive && run());
    let raf = 0;
    let until = 0;
    const loop = () => {
      run();
      raf = performance.now() < until ? requestAnimationFrame(loop) : 0;
    };
    // Every frame while an image or a table card resizes, so pointers and pins ride along
    const onRun = (e: TransitionEvent) => {
      const el = e.target as HTMLElement;
      if (!el.classList?.contains("ui-agc__figure") && !el.classList?.contains("ui-agc__table-card")) return;
      until = performance.now() + 900;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    stage.addEventListener("transitionrun", onRun);
    return () => {
      alive = false;
      ro.disconnect();
      cancelAnimationFrame(raf);
      stage.removeEventListener("transitionrun", onRun);
    };
  }, [engine, stageRef, sheetRef]);

  return { layout, pointerRef: engine.pointerRef };
}

/* ---------- Arriving pointers pop in where they are, instead of flying in from the corner ---------- */

function useArrivals(present: string[]) {
  const seen = useRef(new Set<string>());
  const [, rerender] = useState(0);
  const arriving = present.filter((id) => !seen.current.has(id));
  const presentKey = present.join("\n");
  const arrivingKey = arriving.join("\n");
  useEffect(() => {
    if (!arrivingKey) {
      // Left agents arrive anew next time
      const here = new Set(presentKey.split("\n"));
      for (const id of [...seen.current]) if (!here.has(id)) seen.current.delete(id);
      return;
    }
    const t = window.setTimeout(() => {
      arrivingKey.split("\n").forEach((id) => seen.current.add(id));
      rerender((n) => n + 1);
    }, 40);
    return () => window.clearTimeout(t);
  }, [presentKey, arrivingKey]);
  return arriving;
}

/* ---------- New suggestions and comments are announced ---------- */

function useAnnouncement(suggestions: DocSuggestion[], comments: DocComment[], agents: CursorAgent[]) {
  const [announce, setAnnounce] = useState("");
  const known = useRef<Set<string> | null>(null);
  useEffect(() => {
    const ids = new Set([...suggestions.map((s) => s.id), ...comments.map((c) => c.id)]);
    if (known.current) {
      const fresh = suggestions.find((s) => !known.current!.has(s.id));
      const note = comments.find((c) => !known.current!.has(c.id));
      const who = (id?: string) => agents.find((a) => a.id === id)?.name;
      if (fresh && who(fresh.agent)) setAnnounce(`${who(fresh.agent)} suggests a change${fresh.note ? `: ${fresh.note}` : ""}`);
      else if (note && who(note.agent)) setAnnounce(`${who(note.agent)} is writing a comment`);
    }
    known.current = ids;
  }, [suggestions, comments, agents]);
  return announce;
}

/* ---------- Replies typed into comment pins: one draft per pin, sends that may be async ---------- */

function useReplies(onReply: AgentCursorsProps["onReply"]) {
  const [replies, setReplies] = useState<Record<string, string>>({});
  // Replies on their way: the field waits; a failed one gets its text back and is marked
  const [sending, setSending] = useState<Record<string, "pending" | "error">>({});
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const edit = (id: string, text: string) => setReplies((r) => ({ ...r, [id]: text }));
  const send = (cm: DocComment) => {
    const text = replies[cm.id]?.trim();
    if (!onReply || !text || sending[cm.id] === "pending") return;
    const done = onReply(cm, text);
    setReplies(({ [cm.id]: _sent, ...others }) => others);
    if (done && typeof (done as Promise<unknown>).then === "function") {
      setSending((m) => ({ ...m, [cm.id]: "pending" }));
      (done as Promise<unknown>).then(
        () => alive.current && setSending(({ [cm.id]: _done, ...others }) => others),
        () => {
          if (!alive.current) return;
          setSending((m) => ({ ...m, [cm.id]: "error" }));
          setReplies((r) => ({ ...r, [cm.id]: r[cm.id] || text }));
        },
      );
    } else setSending(({ [cm.id]: _done, ...others }) => others);
  };
  return { replies, sending, edit, send };
}

/* ---------- One block: its text with the suggestions inline ---------- */

type BlockContext = {
  agents: CursorAgent[];
  cursors: AgentCursorsProps["cursors"];
  /** The suggestions of each block, in text order */
  byBlock: Map<string, DocSuggestion[]>;
  fit: DocLayout["fit"];
  openId: string | undefined;
  show: (id: string, el: HTMLElement) => void;
  hide: () => void;
  /** Opens the suggestion and moves focus into its window (Enter / Space on the suggestion) */
  enter: (id: string, el: HTMLElement) => void;
};

function textParts(b: DocBlock, ctx: BlockContext) {
  const text = b.text ?? "";
  const list = ctx.byBlock.get(b.id) ?? [];
  const agentOf = (id: string) => ctx.agents.find((a) => a.id === id);
  const parts: ReactNode[] = [];
  let pos = 0;
  for (const s of list) {
    const at = Math.max(pos, Math.min(s.at, text.length));
    if (at > pos) parts.push(<span key={`t${pos}`} data-from={pos}>{text.slice(pos, at)}</span>);
    const remove = Math.min(s.remove ?? 0, text.length - at);
    const style = { ["--tc-agent-cursors-c" as string]: agentOf(s.agent)?.color };
    const name = agentOf(s.agent)?.name ?? "Agent";
    // A button that opens the suggestion's window: hover or focus shows it, Enter / Space / click moves into it
    const events = {
      tabIndex: 0,
      role: "button",
      "aria-haspopup": "dialog" as const,
      "aria-expanded": ctx.openId === s.id,
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => ctx.show(s.id, e.currentTarget),
      onMouseLeave: ctx.hide,
      onFocus: (e: React.FocusEvent<HTMLElement>) => ctx.show(s.id, e.currentTarget),
      onBlur: ctx.hide,
      onClick: (e: React.MouseEvent<HTMLElement>) => ctx.enter(s.id, e.currentTarget),
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        ctx.enter(s.id, e.currentTarget);
      },
      "data-open": ctx.openId === s.id ? "" : undefined,
      "data-focus-key": `sug:${s.id}`,
    };
    if (remove) {
      parts.push(
        <del key={`d${s.id}`} className="ui-agc__del" data-from={at} data-sug={s.id} style={style} {...events} aria-label={`${name} suggests removing: ${text.slice(at, at + remove)}`}>
          {text.slice(at, at + remove)}
        </del>,
      );
    }
    // A possible line break between the old and the new text, so a narrow cell can wrap them
    if (remove && s.insert !== undefined) parts.push(<wbr key={`b${s.id}`} />);
    if (s.insert !== undefined) {
      parts.push(
        <ins key={`i${s.id}`} className="ui-agc__ins" data-ins={s.id} data-sug={s.id} style={style} {...events} aria-label={`${name} suggests adding: ${s.insert}`}>
          {s.insert}
        </ins>,
      );
    }
    pos = at + remove;
  }
  // An empty block keeps an invisible character, so a caret can sit in it while an agent starts typing
  if (pos < text.length || !parts.length) parts.push(<span key={`t${pos}`} data-from={pos}>{text.slice(pos) || EMPTY}</span>);
  return parts;
}

function DocImage({ b, ctx }: { b: DocBlock; ctx: BlockContext }) {
  const w = Math.max(0.2, Math.min(1, b.width ?? 1));
  const ratio = b.ratio ?? 16 / 9;
  const fits = !!b.float && b.ratio === undefined;
  const box = fits ? ctx.fit[b.id] : undefined;
  // Who holds it: an agent on it with a selection
  const by = ctx.agents.find((a) => ctx.cursors[a.id]?.block === b.id && ctx.cursors[a.id]?.select);
  return (
    <figure className="ui-agc__figure" data-block={b.id} data-kind="image" data-float={b.float} data-fit={fits ? "" : undefined} style={{ width: `${w * 100}%` }}>
      <div
        className="ui-agc__img"
        data-loading={b.loading ? "" : undefined}
        data-held={by ? "" : undefined}
        style={{ ...(fits && box ? { height: box.h } : { aspectRatio: String(ratio) }), ["--tc-agent-cursors-c" as string]: by?.color }}
        role="img"
        aria-label={b.loading ? "Image loading" : b.alt || b.text || "Image"}
      >
        {/* Loading: gray with a light sweeping across – the picture fades in once it's there */}
        {b.loading || !b.src ? <span className="ui-agc__shimmer" aria-hidden="true" /> : <img src={b.src} alt="" draggable={false} />}
        {by && (
          <>
            {["tl", "tr", "bl", "br"].map((h) => (
              <span key={h} className="ui-agc__handle" data-at={h} aria-hidden="true" />
            ))}
            <span className="ui-agc__size" aria-hidden="true">
              {box ? `${box.w * 2} × ${box.h * 2}` : `${Math.round(1200 * w)} × ${Math.round((1200 * w) / ratio)}`}
            </span>
          </>
        )}
      </div>
      {b.text && <figcaption className="ui-agc__caption">{b.text}</figcaption>}
    </figure>
  );
}

function DocTable({ b, ctx }: { b: DocBlock; ctx: BlockContext }) {
  const [head, ...body] = b.rows ?? [];
  const cell = (c: DocBlock) =>
    c.tone ? (
      <span className="ui-agc__pill" data-tone={c.tone} data-block={c.id} title={c.text}>
        {textParts(c, ctx)}
      </span>
    ) : (
      <span className="ui-agc__cell" data-block={c.id} title={c.text}>
        {textParts(c, ctx)}
      </span>
    );
  const onAdd = ctx.agents.filter((a) => ctx.cursors[a.id]?.block === `${b.id}:add`);
  return (
    <div className="ui-agc__table-card">
      <table className="ui-agc__table">
        {head && (
          <thead>
            <tr>
              {head.map((c) => (
                <th key={c.id}>{cell(c)}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {body.map((row, i) => (
            <tr key={row[0]?.id ?? i}>
              {row.map((c) => (
                <td key={c.id}>{cell(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {b.addRow && (
          <tfoot>
            <tr>
              <td colSpan={head?.length ?? 1}>
                {/* "Add row", like the Data Table – lit while a pointer is on it, pressed when it clicks */}
                <span
                  className="ui-agc__add"
                  data-block={`${b.id}:add`}
                  data-hover={onAdd.length ? "" : undefined}
                  data-pressed={onAdd.some((a) => ctx.cursors[a.id]?.press) ? "" : undefined}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span data-from={0}>Add row</span>
                </span>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function renderBlock(b: DocBlock, ctx: BlockContext) {
  const kind = b.kind ?? "paragraph";
  if (kind === "image") return <DocImage key={b.id} b={b} ctx={ctx} />;
  if (kind === "table") return <DocTable key={b.id} b={b} ctx={ctx} />;
  if (kind === "code") {
    return (
      <pre key={b.id} className="ui-agc__code" data-block={b.id}>
        <code>{textParts(b, ctx)}</code>
      </pre>
    );
  }
  const Tag = kind === "title" ? "h2" : kind === "heading" ? "h3" : kind === "item" ? "li" : "p";
  return (
    <Tag key={b.id} className={`ui-agc__block ui-agc__block--${kind}`} data-block={b.id}>
      {textParts(b, ctx)}
    </Tag>
  );
}

/** The page's text – consecutive items form one list */
function docBody(blocks: DocBlock[], ctx: BlockContext) {
  const body: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].kind === "item") {
      const items: DocBlock[] = [];
      while (i < blocks.length && blocks[i].kind === "item") items.push(blocks[i++]);
      i--;
      body.push(
        <ul key={`l${items[0].id}`} className="ui-agc__list">
          {items.map((b) => renderBlock(b, ctx))}
        </ul>,
      );
    } else body.push(renderBlock(blocks[i], ctx));
  }
  return body;
}

const agentMark = (a?: CursorAgent) => a?.avatar ?? <span className="ui-agc__face-initial">{initial(a?.name ?? "?")}</span>;

/* ---------- The header: the document, who is here, and the suggestions ---------- */

function DocHeader({
  title,
  agents,
  cursors,
  following,
  follow,
  suggestions,
  formatCost,
  onAcceptAll,
  onTipsBack,
}: {
  /** The pointer or focus moved to a face: tips hidden with Esc may show again */
  onTipsBack: () => void;
  title: string;
  agents: CursorAgent[];
  cursors: AgentCursorsProps["cursors"];
  following: string | null;
  follow: (agent: string | null) => void;
  suggestions: number;
  formatCost: (amount: number) => string;
  onAcceptAll?: () => void;
}) {
  const here = agents.filter((a) => cursors[a.id]);
  const spent = agents.some((a) => a.cost !== undefined) ? agents.reduce((sum, a) => sum + (a.cost ?? 0), 0) : null;
  const typing = here.filter((a) => cursors[a.id]?.typing).length;
  return (
    <header className="ui-agc__bar">
      <span className="ui-agc__doc" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2.5H7.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7z" />
          <path d="M14 2.5V7h4.5M9 12.5h6M9 16h4" />
        </svg>
      </span>
      <span className="ui-agc__title" title={title}>
        {title}
      </span>

      <div className="ui-agc__people" role="group" aria-label="Agents in this document" onPointerOver={onTipsBack} onFocus={onTipsBack}>
        {agents.map((a) => {
          const c = cursors[a.id];
          const isOn = following === a.id;
          return (
            <button
              key={a.id}
              type="button"
              className="ui-agc__face"
              data-here={c ? "" : undefined}
              data-typing={c?.typing ? "" : undefined}
              aria-pressed={isOn}
              aria-label={`${isOn ? "Stop following" : "Follow"} ${a.name}${c?.doing ? ` – ${c.doing}` : c ? "" : " (not in the document)"}`}
              style={{ ["--tc-agent-cursors-c" as string]: a.color, ["--tc-agent-cursors-tint" as string]: a.tint }}
              onClick={() => follow(isOn ? null : a.id)}
            >
              <span className="ui-agc__face-mark">{agentMark(a)}</span>
              {/* The name, and below it in one short line what the agent is doing */}
              <span className="ui-agc__face-tip" aria-hidden="true">
                <b>{a.name}</b>
                <span>{c?.doing ?? (c ? "In the document" : "Away")}</span>
              </span>
            </button>
          );
        })}
      </div>

      <span className="ui-agc__sum">
        {suggestions > 0 ? `${suggestions} suggestion${suggestions === 1 ? "" : "s"}` : typing ? `${typing} typing` : `${here.length} here`}
        {spent !== null && (
          <b className="ui-agc__spent" data-zero={spent === 0 ? "" : undefined}>
            {formatCost(spent)}
          </b>
        )}
      </span>
      {/* Always there, so the header doesn't shift – faded and off until there is something to accept */}
      {onAcceptAll && (
        <button type="button" className="ui-agc__all" disabled={suggestions === 0} onClick={onAcceptAll}>
          Accept all
        </button>
      )}
    </header>
  );
}

/* ---------- A comment pin: open while written, then a round pin that opens on hover or focus ---------- */

function CommentPin({
  cm,
  agent: a,
  at,
  isOpen,
  width,
  stageH,
  pinH,
  reply,
  state,
  canReply,
  onEnter,
  onLeave,
  onEdit,
  onSend,
  onClose,
  onResolve,
}: {
  cm: DocComment;
  agent?: CursorAgent;
  at: { x: number; y: number };
  isOpen: boolean;
  width: number;
  stageH: number;
  pinH?: number;
  reply: string;
  state?: "pending" | "error";
  canReply: boolean;
  onEnter: (id: string, by: "hover" | "focus" | "press") => void;
  onLeave: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onSend: (cm: DocComment) => void;
  /** Closes the window – from inside it, focus goes back to the pin */
  onClose: (id: string) => void;
  onResolve?: (cm: DocComment) => void;
}) {
  const hitRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    onClose(cm.id);
    // From inside the window, focus goes back to the pin before the window turns inert
    rescueFocus(hitRef.current?.parentElement, [hitRef.current]);
  };
  // The window is as wide as fits, and moves in from the pin just enough to stay on the page
  const cardW = Math.min(248, Math.max(160, width - 16));
  const slide = isOpen ? Math.max(8 - at.x, Math.min(0, width - 8 - (at.x + cardW))) : 0;
  // Near the bottom it opens upwards
  const up = stageH > 0 && at.y + 190 > stageH;
  return (
    <div
      className="ui-agc__pin"
      data-comment={cm.id}
      data-open={isOpen ? "" : undefined}
      data-up={up ? "" : undefined}
      style={{ left: at.x, top: at.y, ["--tc-agent-cursors-c" as string]: a?.color, ["--tc-agent-cursors-pin-h" as string]: `${pinH ?? 120}px`, ["--tc-agent-cursors-pin-w" as string]: `${cardW}px`, ["--tc-agent-cursors-pin-x" as string]: `${slide}px` }}
      onMouseEnter={() => onEnter(cm.id, "hover")}
      onMouseLeave={() => onLeave(cm.id)}
      onFocus={() => onEnter(cm.id, "focus")}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && onLeave(cm.id)}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !isOpen || cm.open) return;
        e.stopPropagation();
        close();
      }}
    >
      {/* One shape: the round pin grows into the comment's window – the mark stays and moves to its corner */}
      <div className="ui-agc__pin-box">
        <span className="ui-agc__pin-mark">{agentMark(a)}</span>
        <button
          ref={hitRef}
          type="button"
          className="ui-agc__pin-hit"
          aria-expanded={isOpen}
          aria-label={`Comment from ${a?.name ?? "an agent"}: ${cm.text}`}
          tabIndex={isOpen ? -1 : 0}
          data-focus-key={`pin:${cm.id}`}
          onClick={() => onEnter(cm.id, "press")}
        />
        {/* Closed, the window's content is inert – out of the tab order and the accessibility tree */}
        <div className="ui-agc__pin-body" role="group" aria-label={`Comment from ${a?.name ?? "an agent"}`} inert={!isOpen}>
          <div className="ui-agc__note-head">
            <b>{a?.name}</b>
            <span>now</span>
          </div>
          <p className="ui-agc__note-text" data-block={cm.id}>
            <span data-from={0}>{cm.text || EMPTY}</span>
          </p>
          {(canReply || onResolve) && (
            <div className="ui-agc__pin-actions">
              {canReply ? (
                <input
                  className="ui-agc__reply"
                  value={reply}
                  placeholder="Reply"
                  aria-label={`Reply to ${a?.name ?? "the agent"}`}
                  aria-busy={state === "pending" || undefined}
                  aria-invalid={state === "error" || undefined}
                  title={state === "error" ? "Couldn't send – press Enter to try again" : undefined}
                  readOnly={state === "pending"}
                  data-state={state}
                  onChange={(e) => onEdit(cm.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) onSend(cm);
                  }}
                />
              ) : (
                <span className="ui-agc__reply" aria-hidden="true" />
              )}
              {onResolve && (
                <button
                  type="button"
                  className="ui-agc__resolve"
                  aria-label="Resolve"
                  title="Resolve"
                  onClick={() => {
                    close();
                    onResolve(cm);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- A pointer: arrow, caret and flag. Its place is written by useDocLayout, not rendered ---------- */

function AgentPointer({
  agent: a,
  cursor: c,
  gone,
  arriving,
  inNote,
  dim,
  formatCost,
  pointerRef,
}: {
  agent: CursorAgent;
  cursor: AgentCursor | null | undefined;
  gone: boolean;
  arriving: boolean;
  inNote: boolean;
  dim: boolean;
  formatCost: (amount: number) => string;
  pointerRef: (el: HTMLElement | null) => void;
}) {
  const tags = a.cost !== undefined ? [formatCost(a.cost)] : [];
  return (
    <div
      ref={pointerRef}
      className="ui-agc__cursor"
      data-agent={a.id}
      data-gone={gone ? "" : undefined}
      data-arrive={!gone && arriving ? "" : undefined}
      data-typing={c?.typing ? "" : undefined}
      data-in-note={inNote ? "" : undefined}
      data-press={c?.press ? "" : undefined}
      data-drag={c?.point === "corner" && c.select ? "" : undefined}
      data-dim={dim ? "" : undefined}
      style={{ ["--tc-agent-cursors-c" as string]: a.color }}
    >
      <div className="ui-agc__cursor-in">
        <span className="ui-agc__caret" />
        {/* The pointer: a soft, rounded arrow */}
        <svg className="ui-agc__arrow" viewBox="-2.186 -0.256 18.514 22.277">
          <path transform="rotate(21.37)" d="M13.92 4.07c1.69.66 3.03 1.18 3.94 1.68.46.25.87.53 1.16.86.31.35.51.79.48 1.29-.03.51-.27.92-.62 1.23-.33.3-.77.53-1.25.74-.96.4-2.36.78-4.12 1.26-.56.15-.98.27-1.26.37-.26.1-.38.18-.47.27-.09.09-.17.21-.27.47-.1.28-.22.7-.37 1.26-.48 1.76-.86 3.16-1.26 4.12-.2.49-.44.93-.74 1.25-.32.35-.72.6-1.23.62-.51.03-.94-.17-1.29-.48-.33-.29-.61-.7-.86-1.16-.5-.91-1.02-2.25-1.68-3.94L1.66 7.76C.96 5.99.41 4.59.16 3.51-.09 2.44-.12 1.39.63.63 1.39-.12 2.44-.09 3.51.16c1.08.25 2.48.8 4.25 1.5l6.16 2.41Z" />
        </svg>
        {/* The flag: a little below and to the right of the arrow – it may stick out past the page */}
        <span className="ui-agc__flag">
          {/* The name with its cost as a small tag on the right, what it's doing below */}
          <span className="ui-agc__flag-row">
            <span className="ui-agc__flag-name">{a.name}</span>
            {tags.length > 0 && (
              <span className="ui-agc__flag-tags">
                {tags.map((t, i) => (
                  <span key={i} className="ui-agc__flag-tag">
                    {t}
                  </span>
                ))}
              </span>
            )}
          </span>
          <span className="ui-agc__flag-doing" data-on={c?.doing ? "" : undefined}>
            <span>{c?.doing ?? ""}</span>
          </span>
        </span>
      </div>
    </div>
  );
}

/* ---------- The open suggestion: who, why, accept or reject ---------- */

function SuggestionPop({
  suggestion: s,
  agent,
  box,
  sheetW,
  focus,
  onKeep,
  onHide,
  onLeave,
  onAct,
  onAccept,
  onReject,
}: {
  suggestion: DocSuggestion;
  agent?: CursorAgent;
  box: Box;
  sheetW: number;
  /** Opened from the keyboard: focus moves into the window */
  focus: boolean;
  onKeep: () => void;
  onHide: () => void;
  /** Esc, or Tab past either end: closes and puts focus back on the suggestion (or the next stop after it) */
  onLeave: (to: "back" | "next") => void;
  /** Accept / Reject: closes the window – focus goes back to the suggestion before the callback runs */
  onAct: () => void;
  onAccept?: (suggestion: DocSuggestion) => void;
  onReject?: (suggestion: DocSuggestion) => void;
}) {
  const name = agent?.name ?? "Agent";
  const popRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (focus) popRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }, [focus, s.id]);
  return (
    <div
      ref={popRef}
      className="ui-agc__pop"
      role="dialog"
      aria-label={`Suggestion from ${name}`}
      style={{ left: Math.max(0, Math.min(box.x, sheetW - 260)), top: box.y + box.h + 6, ["--tc-agent-cursors-c" as string]: agent?.color }}
      onMouseEnter={onKeep}
      onMouseLeave={onHide}
      onFocus={onKeep}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && onHide()}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onLeave("back");
          return;
        }
        if (e.key !== "Tab") return;
        // The window sits at the end of the page's markup: leaving it goes back to where the suggestion is
        const buttons = [...e.currentTarget.querySelectorAll<HTMLElement>("button")];
        const edge = e.shiftKey ? buttons[0] : buttons[buttons.length - 1];
        if (document.activeElement !== edge) return;
        e.preventDefault();
        onLeave(e.shiftKey ? "back" : "next");
      }}
    >
      <div className="ui-agc__pop-head">
        <span className="ui-agc__pop-mark">{agentMark(agent)}</span>
        <b>{name}</b>
        <span>{s.remove && s.insert ? "suggests a rewrite" : s.remove ? "suggests removing" : "suggests adding"}</span>
      </div>
      {s.note && <p className="ui-agc__pop-note">{s.note}</p>}
      <div className="ui-agc__pop-actions">
        {onReject && (
          <button
            type="button"
            className="ui-agc__btn"
            onClick={() => {
              onAct();
              onReject(s);
            }}
          >
            Reject
          </button>
        )}
        {onAccept && (
          <button
            type="button"
            className="ui-agc__btn ui-agc__btn--primary"
            onClick={() => {
              onAct();
              onAccept(s);
            }}
          >
            Accept
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- The component ---------- */

export function AgentCursors({
  look,
  agents,
  blocks,
  suggestions = NONE,
  comments = NONE,
  onResolveComment,
  onReply,
  cursors,
  onAccept,
  onReject,
  onAcceptAll,
  following: followingProp,
  defaultFollowing = null,
  onFollowingChange,
  height,
  tabs,
  tab: tabProp,
  defaultTab,
  onTabChange,
  formatCost = dollars,
  title = "Untitled",
  className,
  ref,
  style,
  ...rest
}: AgentCursorsProps) {
  const [tab, setTab] = useControllable(tabProp, defaultTab ?? tabs?.[0]?.id, onTabChange as ((tab: string | undefined) => void) | undefined, "tab");
  const [following, follow] = useControllable<string | null>(followingProp, defaultFollowing, onFollowingChange, "following");
  const rootRef = useRef<HTMLDivElement>(null);
  const setRoot = useRootRef(rootRef, ref);
  const stageRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const tabsId = useId();
  const { layout, pointerRef } = useDocLayout(stageRef, sheetRef, { agents, cursors, comments, height, blocks, suggestions, tab, formatCost });
  const { placed, marks, notes, pinH, width, sheetW, stageH } = layout;

  // The comment pin that is open from hover or focus. A pin closed with Esc stays closed while focus is on it
  const [pinOpen, setPinOpen] = useState<string | null>(null);
  const pinTimer = useRef(0);
  const pinHush = useRef<string | null>(null);
  const { replies, sending, edit, send } = useReplies(onReply);

  // The suggestion that is open: hovered or focused (a preview), or entered from the keyboard (focus inside it),
  // with its box for the little window and the element that opened it
  const [open, setOpen] = useState<{ id: string; box: Box; focus: boolean } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const quiet = useRef(false);
  const closeTimer = useRef(0);
  const place = useCallback((id: string, el: HTMLElement, focus: boolean) => {
    window.clearTimeout(closeTimer.current);
    const stage = stageRef.current;
    if (!stage) return;
    trigger.current = el;
    const outer = stage.getBoundingClientRect();
    const scale = stage.offsetWidth ? outer.width / stage.offsetWidth : 1;
    const rects = el.getClientRects();
    const b = rects[rects.length - 1] ?? el.getBoundingClientRect();
    setOpen({ id, focus, box: { x: (b.left - outer.left) / scale, y: (b.top - outer.top) / scale, w: b.width / scale, h: b.height / scale } });
  }, []);
  const show = useCallback((id: string, el: HTMLElement) => !quiet.current && place(id, el, false), [place]);
  const enter = useCallback((id: string, el: HTMLElement) => place(id, el, true), [place]);
  const hide = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(null), 140);
  }, []);
  const openSug = open ? suggestions.find((s) => s.id === open.id) : undefined;
  /** Focus back on the suggestion that opened the window, without opening it again */
  const backToTrigger = () => {
    const el = trigger.current;
    window.clearTimeout(closeTimer.current);
    setOpen(null);
    if (!el?.isConnected) return false;
    quiet.current = true;
    el.focus({ preventScroll: true });
    quiet.current = false;
    return true;
  };
  const leavePop = (to: "back" | "next") => {
    const from = trigger.current;
    if (!backToTrigger() || to === "back" || !from) return;
    // Tab past the window: the next stop after the suggestion
    const stops = [...(rootRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input, [tabindex="0"]') ?? [])].filter((el) => !el.closest("[inert]"));
    stops[stops.indexOf(from) + 1]?.focus({ preventScroll: true });
  };

  // Hover tips over the faces: Esc hides them until the pointer or focus moves to another face
  const [tipsHushed, setTipsHushed] = useState(false);
  // Esc closes what hover opened – the suggestion preview, a hovered pin, a face's tip – without moving focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(null);
      setTipsHushed(true);
      setPinOpen((o) => {
        if (o) pinHush.current = o;
        return null;
      });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // When the focused control goes away (an accepted suggestion, a resolved comment), focus moves to the
  // suggestion that took its place, the next pin, or the page – never to <body>
  const lastSug = useRef(0);
  useFocusRescue(rootRef, {
    fallback: (key) => {
      const root = rootRef.current;
      if (!root) return null;
      if (key?.startsWith("sug:")) {
        const sugs = [...root.querySelectorAll<HTMLElement>("[data-sug]")];
        return sugs[Math.min(lastSug.current, sugs.length - 1)] ?? root.querySelector<HTMLElement>(".ui-agc__all:not(:disabled)") ?? stageRef.current;
      }
      if (key?.startsWith("pin:")) return root.querySelector<HTMLElement>(".ui-agc__pin-hit[tabindex='0']") ?? stageRef.current;
      return stageRef.current;
    },
  });
  const onFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (!t.dataset?.sug) return;
    lastSug.current = [...e.currentTarget.querySelectorAll("[data-sug]")].indexOf(t);
  };
  useEffect(
    () => () => {
      window.clearTimeout(closeTimer.current);
      window.clearTimeout(pinTimer.current);
    },
    [],
  );

  const present = agents.filter((a) => cursors[a.id] && placed.includes(a.id)).map((a) => a.id);
  const arriving = useArrivals(present);
  const announce = useAnnouncement(suggestions, comments, agents);
  const agentOf = (id: string) => agents.find((a) => a.id === id);

  // The page's text only changes with the document, the suggestions and who holds what – not on hover elsewhere
  const openId = open?.id;
  const body = useMemo(() => {
    const byBlock = new Map<string, DocSuggestion[]>();
    for (const s of suggestions) byBlock.set(s.block, [...(byBlock.get(s.block) ?? []), s]);
    for (const list of byBlock.values()) list.sort((x, y) => x.at - y.at);
    return docBody(blocks, { agents, cursors, byBlock, fit: layout.fit, openId, show, hide, enter });
  }, [blocks, suggestions, agents, cursors, layout.fit, openId, show, hide, enter]);

  // Comments being written: the agent's own flag steps aside – the window already shows its name
  const noteIds = new Set(comments.map((cm) => cm.id));
  const keepPin = (id: string, by: "hover" | "focus" | "press") => {
    window.clearTimeout(pinTimer.current);
    if (by === "focus" && pinHush.current === id) return;
    pinHush.current = null;
    setPinOpen(id);
  };
  const leavePin = (id: string) => {
    window.clearTimeout(pinTimer.current);
    if (pinHush.current === id) pinHush.current = null;
    pinTimer.current = window.setTimeout(() => setPinOpen((o) => (o === id ? null : o)), 160);
  };
  const closePin = (id: string) => {
    window.clearTimeout(pinTimer.current);
    pinHush.current = id;
    setPinOpen(null);
  };
  const tabList = tabs && tabs.length > 0 ? tabs : null;
  const current = tab ?? tabList?.[0].id;
  const onTabKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (!tabList) return;
    const n = tabList.length;
    const to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    setTab(tabList[to].id);
    (e.currentTarget.parentElement?.children[to] as HTMLElement | undefined)?.focus();
  };

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={look ?? DEFAULT_LOOK}
      data-hush={tipsHushed ? "" : undefined}
      onFocusCapture={(e) => {
        onFocusCapture(e);
        rest.onFocusCapture?.(e);
      }}
      data-following={following ?? undefined}
      data-fade={height ? "" : undefined}
      style={height ? { ...style, ["--tc-agent-cursors-height" as string]: `${height}px` } : style}
    >
      <style href="ui-agent-cursors" precedence="default">
        {css}
      </style>

      {tabList && (
        <div className="ui-agc__tabs" role="tablist" aria-label="Views">
          {tabList.map((t, i) => (
            <button
              key={t.id}
              id={`${tabsId}-${t.id}`}
              type="button"
              role="tab"
              className="ui-agc__tab"
              aria-selected={t.id === current}
              aria-controls={`${tabsId}-panel`}
              tabIndex={t.id === current ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <div
        className="ui-agc__stage"
        ref={stageRef}
        tabIndex={-1}
        {...(tabList ? { id: `${tabsId}-panel`, role: "tabpanel", "aria-labelledby": `${tabsId}-${current}` } : {})}
      >
        {/* The page's stroke and shadow on their own layer – the page itself is masked to fade out, which would cut them off */}
        <div className="ui-agc__shade" aria-hidden="true">
          <span />
        </div>
        <div className="ui-agc__sheet" ref={sheetRef}>
          <DocHeader
            onTipsBack={() => setTipsHushed(false)}
            title={title} agents={agents} cursors={cursors} following={following} follow={follow} suggestions={suggestions.length} formatCost={formatCost} onAcceptAll={onAcceptAll} />

          {/* Classic: the white page sits in the gray tray, under the header */}
          <div className="ui-agc__paper" aria-hidden="true" />
          {/* The page: selections behind the text */}
          <div className="ui-agc__marks" aria-hidden="true">
            {agents.map((a) =>
              (marks[a.id] ?? []).map((m, i) => (
                <span
                  key={`${a.id}-${i}`}
                  className="ui-agc__mark"
                  data-dim={following && following !== a.id ? "" : undefined}
                  style={{ left: m.x - 1, top: m.y, width: m.w + 2, height: m.h, ["--tc-agent-cursors-c" as string]: a.color }}
                />
              )),
            )}
          </div>
          <div className="ui-agc__text" key={tab}>
            {body}
          </div>
        </div>

        <div className="ui-agc__notes">
          {comments.map((cm) =>
            notes[cm.id] ? (
              <CommentPin
                key={cm.id}
                cm={cm}
                agent={agentOf(cm.agent)}
                at={notes[cm.id]}
                isOpen={!!cm.open || pinOpen === cm.id}
                width={width}
                stageH={stageH}
                pinH={pinH[cm.id]}
                reply={replies[cm.id] ?? ""}
                state={sending[cm.id]}
                canReply={!!onReply}
                onEnter={keepPin}
                onLeave={leavePin}
                onEdit={edit}
                onSend={send}
                onClose={closePin}
                onResolve={onResolveComment}
              />
            ) : null,
          )}
        </div>

        {/* The pointers, over everything */}
        <div className="ui-agc__cursors" aria-hidden="true">
          {agents.map((a) => {
            const c = cursors[a.id];
            if (!layout.seen.includes(a.id)) return null;
            return (
              <AgentPointer
                key={a.id}
                agent={a}
                cursor={c}
                gone={!c || !placed.includes(a.id)}
                arriving={arriving.includes(a.id)}
                inNote={!!c && noteIds.has(c.block)}
                dim={!!following && following !== a.id}
                formatCost={formatCost}
                pointerRef={pointerRef(a.id)}
              />
            );
          })}
        </div>

        {open && openSug && (
          <SuggestionPop
            suggestion={openSug}
            agent={agentOf(openSug.agent)}
            box={open.box}
            sheetW={sheetW}
            focus={open.focus}
            onKeep={() => window.clearTimeout(closeTimer.current)}
            onHide={hide}
            onLeave={leavePop}
            onAct={backToTrigger}
            onAccept={onAccept}
            onReject={onReject}
          />
        )}
      </div>

      <span className="ui-agc__live" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Colors and motion as variables – override them on .ui-agc */
.ui-agc {
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
:where([data-look="clean"], [data-look="clean"] *).ui-agc {
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
.ui-agc *, .ui-agc *::before, .ui-agc *::after { box-sizing: border-box; }
:where(.ui-agc) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-agc :is(button, .ui-agc__stage):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-agc svg { display: block; flex: none; }
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
.ui-agc[data-fade] .ui-agc__sheet { height: var(--tc-agent-cursors-height); }
/* Stroke and shadow: a box as big as the page inside a larger, transparent one – so the fade-out mask
   (applied to the larger box) leaves the shadow on every side, the top included. Only 4px wider than the page,
   so it never makes a narrow stage scroll sideways */
.ui-agc__shade { position: absolute; inset: -40px -4px; pointer-events: none; }
.ui-agc__shade > span { position: absolute; inset: 40px 4px; border-radius: var(--tc-tray-radius); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-agc__shade > span { border-radius: var(--tc-card-radius); }
.ui-agc[data-fade] .ui-agc__shade { bottom: auto; height: calc(var(--tc-agent-cursors-height) + 80px); }
.ui-agc[data-fade] .ui-agc__sheet {
  -webkit-mask: linear-gradient(#000 0, #000 calc(var(--tc-agent-cursors-height) * 0.5), transparent calc(var(--tc-agent-cursors-height) * 0.97));
  mask: linear-gradient(#000 0, #000 calc(var(--tc-agent-cursors-height) * 0.5), transparent calc(var(--tc-agent-cursors-height) * 0.97));
}
.ui-agc[data-fade] .ui-agc__shade {
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
.ui-agc[data-hush] .ui-agc__face .ui-agc__face-tip { opacity: 0; pointer-events: none; }
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
.ui-agc .ui-agc__pin-body :focus-visible { outline: var(--tc-focus-ring-width) solid var(--tc-agent-cursors-flag-fg); outline-offset: 2px; }
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
  .ui-agc *, .ui-agc *::before, .ui-agc *::after { animation: none !important; transition: none !important; }
}
`;

"use client";

/*
 * Context Map – what fills an agent's context window, as a treemap, in a single self-contained file.
 * A soft gray tray with the agent and how full it is, a white card of a fixed height below: every part of the context –
 * the system prompt, tools, memory, each file, the chat, tool results – a tile as large as its share of the tokens,
 * and what's left as a dashed free space.
 *   · tiles keep their order and glide as the context grows – sizes ease toward their new value and the whole map is
 *     laid out again every frame, so tiles never overlap; a new file grows in where it belongs, a removed one shrinks away
 *   · tinted by kind: a light tint and an edge in the same color
 *   · point at a tile for its name, tokens, share and a line about it; small tiles show only their color
 *   · with agents, the name in the bar is a menu – switch to another agent and its window, e.g. one with 500k
 *   · after a compaction, Before and After in the bar: Before shows the map as it was, each block marked kept,
 *     summarized or dropped, After the map now with the summary they went into – switching glides between the two,
 *     and a line under the map adds it up
 *   · a status in the bar – e.g. "Compacting" – while the agent squeezes old turns into a summary
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: context-map.tsx is Standard,
 * context-map-clean.tsx is Clean). Clean drops the tray: a bar on top with the model and how full it is, one area
 * below, and tiles tinted with the Trace Waterfall recipe – a light tint and a hairline edge. Behaviour is the same.
 */
// Generated from src/components/context-map.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ComponentPropsWithoutRef, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-cxm";

export type ContextKind = "system" | "tools" | "memory" | "file" | "chat" | "result" | "summary";

export type ContextBlock = {
  id: string;
  /** What it is – e.g. "checkout.spec.ts" */
  label: string;
  kind: ContextKind;
  tokens: number;
  /** One line about it, shown on hover – e.g. "Read at 0:42" */
  detail?: string;
  /** A small mark, e.g. a file type icon or a company's logo – before the label */
  icon?: ReactNode;
  /** What's inside, listed on hover – e.g. the tools, each with its logo */
  items?: { label: string; icon?: ReactNode }[];
};

/** What a compaction did with a block */
export type ContextFate = "kept" | "summarized" | "dropped";

export type ContextCompaction = {
  /** The blocks just before it compacted */
  before: ContextBlock[];
  /** Ids folded into the summary */
  summarized?: string[];
  /** Ids left out altogether – every other block was kept */
  dropped?: string[];
  /** The id of the summary they went into (in blocks) */
  summary?: string;
};

export type ContextAgent = {
  id: string;
  /** e.g. "Checkout fixer" */
  name: string;
  /** The model it runs on – shown in the menu */
  model?: string;
  /** The model maker's logo */
  icon?: ReactNode;
  /** Its context window in tokens */
  limit: number;
};

type ContextMapOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in context-map.tsx, Clean in context-map-clean.tsx */
  look?: Look;
  /** In the order they should sit – the free space always comes last */
  blocks: ContextBlock[];
  /** The context window's size in tokens – e.g. 200000 */
  limit: number;
  /** The model, next to the title */
  model?: string;
  /** The model maker's logo – on a small white tile before the model */
  modelIcon?: ReactNode;
  /** Agents to switch between – the bar shows the current one's name as a menu */
  agents?: ContextAgent[];
  /** The current agent's id. Controlled when defined */
  agent?: string;
  /** The agent shown first when `agent` isn't controlled – defaults to the first one */
  defaultAgent?: string;
  /** Called with the picked agent's id, controlled or not */
  onAgentChange?: (id: string) => void;
  /**
   * The last compaction, to compare before and after – null shows the line for it while there's none yet, so the
   * component keeps its height when one happens
   */
  compaction?: ContextCompaction | null;
  /** Which side of the compaction shows. Controlled when defined */
  view?: "before" | "after";
  /** The side shown first when `view` isn't controlled; a new compaction shows "after" again */
  defaultView?: "before" | "after";
  /** Called with the new side on every switch, controlled or not */
  onViewChange?: (view: "before" | "after") => void;
  /** A short status in the bar – e.g. "Compacting" */
  status?: string;
  onSelect?: (block: ContextBlock | null) => void;
  title?: string;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type ContextMapProps = Omit<ComponentPropsWithoutRef<"div">, keyof ContextMapOwnProps> & ContextMapOwnProps;

/* ---------- Helpers ---------- */

/** The nearest box around an element that cuts off what sticks out – e.g. a card – else the viewport */
const clipRect = (el: Element) => {
  let clip = el.parentElement;
  while (clip && clip !== document.body && getComputedStyle(clip).overflow === "visible") clip = clip.parentElement;
  return clip && clip !== document.body ? clip.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
};

/** The word on a tile, before a compaction */
const TILE_FATE: Record<ContextFate, string> = { kept: "· kept", summarized: "· summarized", dropped: "· dropped" };

/* Kept as it was: a tick */
const Kept = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="m2.5 6.3 2.3 2.2 4.7-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
/* Dropped: a cross */
const Dropped = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="m3.2 3.2 5.6 5.6M8.8 3.2 3.2 8.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
/* Folded into the summary: two arrows pressing together */
const Folded = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M6 1.5v3.2M4.4 3.3 6 4.9l1.6-1.6M6 10.5V7.3M4.4 8.7 6 7.1l1.6 1.6M2 6h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const FATE_ICON = { kept: Kept, summarized: Folded, dropped: Dropped } as const;
const KIND: Record<ContextKind, string> = { system: "System prompt", tools: "Tools", memory: "Memory", file: "File", chat: "Chat", result: "Tool result", summary: "Summary" };
const FREE = "__free";
const tokens = (n: number) => (n >= 100_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(Math.round(n)));

type Rect = { x: number; y: number; w: number; h: number };
type Item = { id: string; value: number };

/**
 * An ordered treemap: split the list where its weight halves, along the longer side, and again in each half.
 * It keeps the order, so tiles stay where they are as they grow – a squarified layout would shuffle them.
 */
const layout = (items: Item[], r: Rect, out: Map<string, Rect>) => {
  if (!items.length) return;
  if (items.length === 1) {
    out.set(items[0].id, r);
    return;
  }
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  let acc = 0;
  let cut = 1;
  for (let i = 0; i < items.length - 1; i++) {
    acc += items[i].value;
    cut = i + 1;
    if (acc >= total / 2) break;
  }
  const share = items.slice(0, cut).reduce((s, i) => s + i.value, 0) / total;
  if (r.w >= r.h) {
    const w = r.w * share;
    layout(items.slice(0, cut), { x: r.x, y: r.y, w, h: r.h }, out);
    layout(items.slice(cut), { x: r.x + w, y: r.y, w: r.w - w, h: r.h }, out);
  } else {
    const h = r.h * share;
    layout(items.slice(0, cut), { x: r.x, y: r.y, w: r.w, h }, out);
    layout(items.slice(cut), { x: r.x, y: r.y + h, w: r.w, h: r.h - h }, out);
  }
};

/** The tiles in their order, the free space last, and where each goes */
const arrange = (order: string[], shown: Map<string, number>, w: number, h: number) => {
  const items: Item[] = [...order, FREE].map((id) => ({ id, value: shown.get(id) ?? 0 })).filter((i) => i.value > 0.5);
  const rects = new Map<string, Rect>();
  // A small inset, so the tiles keep the same gap to the area's edge as to each other
  if (w && h) layout(items, { x: 3, y: 3, w: w - 6, h: h - 6 }, rects);
  return { items, rects };
};

/** Which lines of a tile show – each only while there's room for it, it fades out before the tile would cut it */
const lines = (r: Rect) => {
  const name = r.w >= 54 && r.h >= 28;
  const second = name && r.h >= 44;
  return { name, second, kind: second && r.w >= 120, badge: r.w >= 40 && r.h >= 28 };
};

/** What only a render can change: which tiles there are, and which of their lines and badges show */
const shape = (items: Item[], rects: Map<string, Rect>) =>
  items
    .map(({ id }) => {
      const r = rects.get(id);
      return r ? `${id}:${Object.values(lines(r)).map(Number).join("")}` : "";
    })
    .join(",");

/**
 * The window over a tile: above it, else below it, else over the tile itself. It may leave the map, but never the
 * nearest box that clips – e.g. a card the map sits in – so it's never cut off
 */
type TipRoom = { w: number; h: number; box: { l: number; t: number; r: number; b: number } };
/** The reads: the card's size and the room it has, in the area's coordinates – done before any write in a frame */
const measureTip = (tip: HTMLElement | null, area: HTMLElement | null): TipRoom | null => {
  if (!tip || !area) return null;
  const a = area.getBoundingClientRect();
  const c = clipRect(area);
  return { w: tip.offsetWidth, h: tip.offsetHeight, box: { l: c.left - a.left + 8, t: c.top - a.top + 8, r: c.right - a.left - 8, b: c.bottom - a.top - 8 } };
};
/** The writes: the card over its tile */
const moveTip = (tip: HTMLElement | null, room: TipRoom | null, r: Rect | undefined) => {
  if (!tip || !room || !r) return;
  const { w, h, box } = room;
  const x = Math.max(box.l, Math.min(r.x + r.w / 2 - w / 2, box.r - w));
  const above = r.y - h - 8;
  const below = r.y + r.h + 8;
  const top = above >= box.t ? above : below + h <= box.b ? below : Math.max(box.t, Math.min(r.y + 8, box.b - h));
  tip.style.left = `${x}px`;
  tip.style.top = `${top}px`;
};

/* ---------- Icons ---------- */

/* A small map mark for the title (drawn for Trenchcoat) */
/* A spinner of eight spokes pointing to the center, each fainter than the one before */
const Spinner = () => (
  <svg className="ui-cxm__spin" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    {Array.from({ length: 8 }, (_, i) => (
      <line key={i} x1="8" y1="1.75" x2="8" y2="4.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity={1 - i * 0.11} transform={`rotate(${-i * 45} 8 8)`} />
    ))}
  </svg>
);

const MapMark = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1.8" y="1.8" width="7" height="12.4" rx="1.6" fill="currentColor" />
    <rect x="10" y="1.8" width="4.2" height="6" rx="1.4" fill="currentColor" opacity="0.6" />
    <rect x="10" y="9" width="4.2" height="5.2" rx="1.4" fill="currentColor" opacity="0.3" />
  </svg>
);

/** The order tiles sit in: new ones join where the list puts them, removed ones keep their place until they're gone.
 *  Returns the same array when nothing joined */
const mergeOrder = (order: string[], ids: string[]) => {
  if (ids.every((id) => order.includes(id))) return order;
  const next = [...order];
  ids.forEach((id, i) => {
    if (next.includes(id)) return;
    // A new one goes right after the one before it in your list
    const before = ids.slice(0, i).reverse().find((x) => next.includes(x));
    next.splice(before ? next.indexOf(before) + 1 : 0, 0, id);
  });
  return next;
};

export function ContextMap({
  look,
  blocks: live,
  limit: windowSize,
  model,
  modelIcon,
  agents,
  agent: agentProp,
  defaultAgent,
  onAgentChange,
  compaction,
  view: viewProp,
  defaultView = "after",
  onViewChange,
  status,
  onSelect,
  title = "Context",
  className,
  ref,
  ...rest
}: ContextMapProps) {
  const label = useId();
  const [agent, setAgent] = useControllable<string | undefined>(
    agentProp,
    defaultAgent,
    onAgentChange && ((id) => id !== undefined && onAgentChange(id)),
    "agent",
  );
  const current = agents?.find((a) => a.id === agent) ?? agents?.[0];
  const limit = current?.limit ?? windowSize;
  const areaRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<string | null>(null);
  // The tile with keyboard focus shows its card too; Escape hides it (and a hovered or pinned one) until focus moves
  const [focused, setFocused] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  // The tile that takes Tab into the map – arrow keys move it (one tab stop for the whole map)
  const [active, setActive] = useState<string | null>(null);
  // A card pinned with a click – it stays until it's clicked again, Escape, or its block leaves the map
  const [pinned, setPinned] = useState<string | null>(null);
  const anyCard = !!(pinned || (hover && hover !== FREE) || (focused && !dismissed));
  useEffect(() => {
    if (!anyCard) return;
    // Escape hides the card without moving focus (WCAG 1.4.13)
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPinned(null);
      setHover(null);
      setDismissed(true);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [anyCard]);

  // Before or after the last compaction – before, the map shows the blocks as they were
  const [chosenView, setView] = useControllable(viewProp, defaultView, onViewChange, "view");
  const view = compaction ? chosenView : "after";
  // A new compaction (or none) shows what's there now – unless the parent controls the view
  const lastCompaction = useRef(compaction);
  useEffect(() => {
    if (lastCompaction.current === compaction) return;
    lastCompaction.current = compaction;
    if (viewProp === undefined) setView("after");
  }, [compaction]); // eslint-disable-line react-hooks/exhaustive-deps -- resets only when the compaction changes
  const fateOf = (id: string): ContextFate => (compaction?.summarized?.includes(id) ? "summarized" : compaction?.dropped?.includes(id) ? "dropped" : "kept");
  const blocks = view === "before" && compaction ? compaction.before : live;
  const tipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    // A new size only when it really changed – the observer also reports the first one, and equal ones
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const used = blocks.reduce((s, b) => s + Math.max(0, b.tokens), 0);
  const free = Math.max(0, limit - used);
  const share = used / limit;

  /* ---------- Motion: the sizes ease toward their targets, the map is laid out again every frame ---------- */
  // Frames that only move tiles and count tokens write to the tiles directly; a render happens only when a tile
  // comes or goes or a line shows or hides – and nothing runs once everything has arrived

  // Every block seen so far – a removed one keeps its looks while it shrinks away. Recorded after commit; the current
  // blocks always win
  const seen = useRef(new Map<string, ContextBlock>());
  useLayoutEffect(() => {
    for (const b of blocks) seen.current.set(b.id, b);
  });
  const byId = new Map(blocks.map((b) => [b.id, b]));
  const blockOf = (id: string) => byId.get(id) ?? seen.current.get(id);
  // The order tiles sit in – state, so render only derives it; the motion removes tiles once they've shrunk away
  const [storedOrder, setOrder] = useState<string[]>([]);
  const ids = blocks.filter((b) => b.tokens > 0).map((b) => b.id);
  const order = mergeOrder(storedOrder, ids);
  if (order !== storedOrder) setOrder(order);
  const orderRef = useRef(order);
  useLayoutEffect(() => {
    orderRef.current = order;
  });
  const target = new Map<string, number>([...order.map((id): [string, number] => [id, Math.max(0, byId.get(id)?.tokens ?? 0)]), [FREE, free]]);
  // Restarts only when a target changes – a parent rendering the same blocks again doesn't wake it
  const targetKey = [...target].map(([id, to]) => `${id}:${to}`).join(",");
  const shown = useRef(new Map<string, number>());
  const tiles = useRef(new Map<string, HTMLDivElement>());
  // The shape the last render drew, and the tile its card points at – both kept by the layout effect below
  const drawn = useRef("");
  const showingRef = useRef<string | null>(null);
  const [, setFrame] = useState(0);
  const tokensOf = (id: string, value: number) => tokens(target.get(id) || value);
  const ariaOf = (id: string, value: number) => {
    const b = blockOf(id);
    if (id === FREE) return `Free – ${tokens(value)} tokens`;
    // Before a compaction, what happened to the block is part of its name – not only the tile's styling
    const fate = view === "before" && compaction?.before.some((x) => x.id === id) ? `, ${fateOf(id)}` : "";
    return `${b?.label}, ${KIND[b!.kind]} – ${tokens(value)} tokens${fate}`;
  };
  // Off-screen (or in a hidden tab) the tiles jump to their sizes – no frames run where nobody sees them
  const onScreen = useOnScreen(areaRef);
  useEffect(() => {
    let raf = 0;
    // Time between animation frames, from the first frame on
    let last: number | null = null;
    const step = (now: number) => {
      const dt = last === null ? 16 : Math.min(64, now - last);
      last = now;
      const k = onScreen ? 1 - Math.exp(-dt / 110) : 1;
      let moving = false;
      let gone = false;
      for (const [id, to] of target) {
        const from = shown.current.get(id) ?? 0;
        const v = Math.abs(to - from) < 1 ? to : from + (to - from) * k;
        if (v !== to) moving = true;
        shown.current.set(id, v);
      }
      // Gone and shrunk to nothing: out of the map
      for (const id of [...shown.current.keys()]) {
        if (!target.has(id)) shown.current.delete(id);
        else if (id !== FREE && (target.get(id) ?? 0) === 0 && (shown.current.get(id) ?? 0) === 0) {
          orderRef.current = orderRef.current.filter((x) => x !== id);
          gone = true;
        }
      }
      const { items, rects } = arrange(orderRef.current, shown.current, size.w, size.h);
      if (gone) setOrder(orderRef.current);
      else if (shape(items, rects) !== drawn.current) setFrame((f) => f + 1);
      else {
        // Reads first (the card's size and room), then only writes – no layout is forced in between
        const room = showingRef.current ? measureTip(tipRef.current, areaRef.current) : null;
        // Same tiles, same lines: only sizes and numbers change
        for (const it of items) {
          const el = tiles.current.get(it.id);
          const r = rects.get(it.id);
          if (!el || !r) continue;
          el.style.setProperty("--x", `${r.x}px`);
          el.style.setProperty("--y", `${r.y}px`);
          el.style.setProperty("--w", `${r.w}px`);
          el.style.setProperty("--h", `${r.h}px`);
          el.querySelector(".ui-cxm__hit")?.setAttribute("aria-label", ariaOf(it.id, it.value));
          // The count is the first text in its line
          const count = el.querySelector(".ui-cxm__tokens")?.firstChild;
          if (count && count.nodeValue !== tokensOf(it.id, it.value)) count.nodeValue = tokensOf(it.id, it.value);
        }
        moveTip(tipRef.current, room, showingRef.current ? rects.get(showingRef.current) : undefined);
      }
      if (moving && onScreen) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `target` is read through targetKey, which says when it changed
  }, [targetKey, size.w, size.h, onScreen]);

  const { items, rects } = arrange(order, shown.current, size.w, size.h);
  // The pinned card goes once its block has left the map
  if (pinned && !order.includes(pinned)) setPinned(null);
  // Pointing shows a card; then the focused tile's; without either, the pinned one shows
  const showing = hover && hover !== FREE ? hover : focused && !dismissed ? focused : pinned;
  const hovered = showing ? (blockOf(showing) ?? null) : null;

  // The card goes over its tile when a render changed the tiles, the size or what's shown; the motion keeps it there
  // between renders
  const drawnShape = shape(items, rects);
  const showingRect = showing ? rects.get(showing) : undefined;
  const tipId = `${label}-tip`;
  // Tiles that take focus: every block, in the map's order (the free space is only a picture)
  const focusable = items.filter((it) => it.id !== FREE && rects.has(it.id)).map((it) => it.id);
  const tabStop = active && focusable.includes(active) ? active : focusable[0];
  const moveFocus = (from: string, key: string) => {
    const i = focusable.indexOf(from);
    const next = key === "Home" ? 0 : key === "End" ? focusable.length - 1 : key === "ArrowRight" || key === "ArrowDown" ? Math.min(focusable.length - 1, i + 1) : Math.max(0, i - 1);
    const id = focusable[next];
    if (id === undefined) return;
    setActive(id);
    tiles.current.get(id)?.querySelector<HTMLElement>(".ui-cxm__hit")?.focus();
  };
  const placeKey = showingRect && `${showing}:${view}:${hovered?.tokens}:${showingRect.x},${showingRect.y},${showingRect.w},${showingRect.h}`;
  useLayoutEffect(() => {
    drawn.current = drawnShape;
    showingRef.current = showing;
  }, [drawnShape, showing]);
  useLayoutEffect(() => {
    if (!placeKey) return;
    const tip = tipRef.current;
    moveTip(tip, measureTip(tip, areaRef.current), showingRect);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showingRect is read through placeKey, which says when it moved
  }, [placeKey]);

  return (
    <div {...rest} ref={ref} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={look ?? DEFAULT_LOOK}>
      <style href="ui-context-map" precedence="default">
        {css}
      </style>

      <Bar
        labelId={label}
        title={title}
        current={current}
        agents={agents}
        onAgent={setAgent}
        limit={limit}
        model={model}
        modelIcon={modelIcon}
        status={status}
        compaction={compaction}
        view={view}
        onView={setView}
        used={used}
        share={share}
      />

      <div ref={areaRef} className="ui-cxm__area" role="list" aria-labelledby={label} onMouseLeave={() => setHover(null)}>
        {items.map((it) => {
          const r = rects.get(it.id);
          if (!r) return null;
          const b = blockOf(it.id);
          const isFree = it.id === FREE;
          const { name, second, kind } = lines(r);
          return (
            <div
              key={it.id}
              ref={(el) => {
                if (el) tiles.current.set(it.id, el);
                return () => {
                  tiles.current.delete(it.id);
                };
              }}
              role="listitem"
              className="ui-cxm__tile"
              data-kind={isFree ? "free" : b?.kind}
              data-fate={
                isFree || !compaction
                  ? undefined
                  : view === "before"
                    ? compaction.before.some((x) => x.id === it.id)
                      ? fateOf(it.id)
                      : undefined
                    : it.id === compaction.summary
                      ? "summary"
                      : undefined
              }
              data-dim={hover && hover !== it.id ? "" : undefined}
              style={{ "--x": `${r.x}px`, "--y": `${r.y}px`, "--w": `${r.w}px`, "--h": `${r.h}px` } as CSSProperties}
              aria-label={isFree ? ariaOf(it.id, it.value) : undefined}
              onMouseEnter={() => {
                setHover(it.id);
                setDismissed(false);
              }}
              data-pinned={pinned === it.id ? "" : undefined}
              onClick={isFree ? () => onSelect?.(null) : undefined}
            >
              {/* Every block is a button: focus shows its card, Enter or Space pins it (as a click does) – arrow keys
                  move between blocks */}
              {!isFree && (
                <button
                  type="button"
                  className="ui-cxm__hit"
                  aria-label={ariaOf(it.id, it.value)}
                  aria-pressed={pinned === it.id}
                  aria-describedby={showing === it.id ? tipId : undefined}
                  tabIndex={it.id === tabStop ? 0 : -1}
                  onFocus={() => {
                    setFocused(it.id);
                    setActive(it.id);
                    setDismissed(false);
                  }}
                  onBlur={() => setFocused((f) => (f === it.id ? null : f))}
                  onKeyDown={(e) => {
                    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
                      e.preventDefault();
                      moveFocus(it.id, e.key);
                    }
                  }}
                  onClick={() => {
                    // A click pins its card – a second one lets it go
                    setPinned((p) => (p === it.id ? null : it.id));
                    setDismissed(false);
                    onSelect?.(b ?? null);
                  }}
                />
              )}
              {view === "before" && compaction?.before.some((x) => x.id === it.id) && fateOf(it.id) === "summarized" && lines(r).badge && (
                <span className="ui-cxm__badge" title="Summarized – click for more" aria-hidden="true">
                  <Folded />
                </span>
              )}
              <span className="ui-cxm__label" aria-hidden="true">
                <span className="ui-cxm__name" data-show={name ? "" : undefined}>
                  {b?.icon && !isFree && <span className="ui-cxm__icon">{b.icon}</span>}
                  {isFree ? "Free" : b?.label}
                </span>
                <span className="ui-cxm__tokens" data-show={second ? "" : undefined}>
                  {tokensOf(it.id, it.value)}
                  {!isFree && b && (
                    <span className="ui-cxm__kind" data-show={kind ? "" : undefined}>
                      {" "}
                      {view === "before" && compaction?.before.some((x) => x.id === it.id) ? (
                        <Roll k={fateOf(it.id)}>
                          <span data-fate={fateOf(it.id)}>{TILE_FATE[fateOf(it.id)]}</span>
                        </Roll>
                      ) : (
                        <Roll k="kind">· {KIND[b.kind]}</Roll>
                      )}
                    </span>
                  )}
                </span>
              </span>
            </div>
          );
        })}

        {hovered && <Tip key={hovered.id} id={tipId} tipRef={tipRef} block={hovered} limit={limit} compaction={compaction} view={view} />}
      </div>

      {/* What the last compaction did, added up – the same line on both sides, so nothing moves when you switch */}
      {compaction !== undefined && <Fates compaction={compaction} after={live} />}
    </div>
  );
}

/** The bar: the title, the agent (a menu when there are several) or the model, a status, Before / After and the count */
function Bar({
  labelId: label,
  title,
  current,
  agents,
  onAgent: setAgent,
  limit,
  model,
  modelIcon,
  status,
  compaction,
  view,
  onView: setView,
  used,
  share,
}: {
  labelId: string;
  title: string;
  current: ContextAgent | undefined;
  agents: ContextAgent[] | undefined;
  onAgent: (id: string) => void;
  limit: number;
  model?: string;
  modelIcon?: ReactNode;
  status?: string;
  compaction: ContextCompaction | null | undefined;
  view: "before" | "after";
  onView: (view: "before" | "after") => void;
  used: number;
  share: number;
}) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Which item takes focus when the menu opens: the checked one, or the first / last (ArrowUp opens on the last)
  const openAt = useRef<"checked" | "first" | "last">("checked");
  const items = () => [...(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
  const close = (refocus: boolean) => {
    setMenu(false);
    if (refocus) triggerRef.current?.focus();
  };

  // The agent menu opens under its button, moved left as far as it takes to stay inside the box around it
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!menu || !list) return;
    // Measured without the opening animation's scale; read first, then one write
    const over = list.parentElement!.getBoundingClientRect().left + list.offsetWidth - (clipRect(list).right - 8);
    list.style.left = over > 0 ? `${-over}px` : "0px";
    // Focus moves into the menu (APG menu button)
    const all = items();
    const at = openAt.current;
    (at === "first" ? all[0] : at === "last" ? all.at(-1) : (all.find((el) => el.getAttribute("aria-checked") === "true") ?? all[0]))?.focus();
  }, [menu]);

  // The agent menu closes on a click outside or Escape
  useEffect(() => {
    if (!menu) return;
    const down = (e: PointerEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    // Escape closes it and returns focus to its button
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close(!!menuRef.current?.contains(document.activeElement));
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [menu]);
  const level = share >= 0.95 ? "full" : share >= 0.8 ? "high" : undefined;
  return (
    <header className="ui-cxm__bar">
      <span className="ui-cxm__mark">
        <MapMark />
      </span>
      <span className="ui-cxm__title" id={label}>
        {title}
      </span>
      {current ? (
        <span className="ui-cxm__pick" ref={menuRef}>
          <button
            ref={triggerRef}
            type="button"
            className="ui-cxm__who ui-cxm__agent"
            aria-haspopup="menu"
            aria-expanded={menu}
            onClick={() => {
              openAt.current = "checked";
              setMenu((m) => !m);
            }}
            onKeyDown={(e) => {
              if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
              e.preventDefault();
              openAt.current = e.key === "ArrowUp" ? "last" : "first";
              setMenu(true);
            }}
          >
            {current.icon && (
              <span className="ui-cxm__logo" aria-hidden="true">
                {current.icon}
              </span>
            )}
            <span className="ui-cxm__model">{current.name}</span>
            <span className="ui-cxm__limit">{tokens(limit)}</span>
            <svg className="ui-cxm__chev" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="m3.5 4.75 2.5 2.5 2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {menu && (
            <span
              ref={listRef}
              className="ui-cxm__menu"
              role="menu"
              aria-label="Agents"
              onKeyDown={(e) => {
                const all = items();
                const i = all.indexOf(document.activeElement as HTMLElement);
                const go = (n: number) => {
                  e.preventDefault();
                  all[(n + all.length) % all.length]?.focus();
                };
                if (e.key === "ArrowDown") go(i + 1);
                else if (e.key === "ArrowUp") go(i - 1);
                else if (e.key === "Home") go(0);
                else if (e.key === "End") go(all.length - 1);
                // Tab leaves the menu and closes it
                else if (e.key === "Tab") setMenu(false);
              }}
            >
              {agents!.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={a.id === current.id}
                  tabIndex={-1}
                  className="ui-cxm__option"
                  onClick={() => {
                    // Picking closes the menu – focus goes back to its button, not to <body>
                    close(true);
                    if (a.id !== current.id) setAgent(a.id);
                  }}
                >
                  <span className="ui-cxm__logo" aria-hidden="true">
                    {a.icon}
                  </span>
                  <span className="ui-cxm__option-text">
                    <span className="ui-cxm__option-name">{a.name}</span>
                    {a.model && <span className="ui-cxm__option-model">{a.model}</span>}
                  </span>
                  <span className="ui-cxm__limit">{tokens(a.limit)}</span>
                  {/* The current agent: a tick, not only a tint */}
                  <svg className="ui-cxm__check" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    {a.id === current.id && <path d="m2.5 6.3 2.3 2.2 4.7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
                  </svg>
                </button>
              ))}
            </span>
          )}
        </span>
      ) : (model || modelIcon) && (
        <span className="ui-cxm__who">
          {modelIcon && (
            <span className="ui-cxm__logo" aria-hidden="true">
              {modelIcon}
            </span>
          )}
          {model && <span className="ui-cxm__model">{model}</span>}
          {/* The window's size as a small tag */}
          <span className="ui-cxm__limit">{tokens(limit)}</span>
        </span>
      )}
      {status && (
        <span className="ui-cxm__status" key={status} aria-hidden="true">
          <Spinner />
          {status}
        </span>
      )}
      {/* The status for screen readers: mounted from the start, so a new one is announced */}
      <span className="ui-cxm__sr" role="status">
        {status ?? ""}
      </span>
      <span className="ui-cxm__sum">
        {/* In the count's row – so on phones, where that row is the whole width, it never adds a line */}
        {compaction && (
          <span className="ui-cxm__compare" role="group" aria-label="Compaction">
            {(["before", "after"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                {v === "before" ? "Before" : "After"}
              </button>
            ))}
          </span>
        )}
        <span>
          {/* What's used, with a shine running over it */}
          <b className="ui-cxm__used">{tokens(used)}</b> / {tokens(limit)}
        </span>
        <span className="ui-cxm__pct" data-level={level}>
          {Math.round(share * 100)}%
        </span>
      </span>
    </header>
  );
}

/** The card over a tile: what the block is, its share, a line about it, what the compaction did with it */
function Tip({
  id,
  tipRef,
  block,
  limit,
  compaction,
  view,
}: {
  id: string;
  tipRef: Ref<HTMLDivElement>;
  block: ContextBlock;
  limit: number;
  compaction: ContextCompaction | null | undefined;
  view: "before" | "after";
}) {
  const fateOf = (id: string): ContextFate => (compaction?.summarized?.includes(id) ? "summarized" : compaction?.dropped?.includes(id) ? "dropped" : "kept");
  return (
    <div ref={tipRef} id={id} className="ui-cxm__tip" role="tooltip">
      <span className="ui-cxm__tip-head">
        {block.icon ? (
          <span className="ui-cxm__logo" aria-hidden="true">
            {block.icon}
          </span>
        ) : (
          <span className="ui-cxm__swatch" data-kind={block.kind} aria-hidden="true" />
        )}
        <span className="ui-cxm__tip-name">{block.label}</span>
      </span>
      <span className="ui-cxm__tip-meta">
        {KIND[block.kind]} · {tokens(block.tokens)} tokens · {Math.round((block.tokens / limit) * 1000) / 10}%
      </span>
      {block.detail && <span className="ui-cxm__tip-detail">{block.detail}</span>}
      {compaction && view === "before" && compaction.before.some((x) => x.id === block.id) && (
        <span className="ui-cxm__tip-fate" data-fate={fateOf(block.id)}>
          {(() => {
            const FateIcon = FATE_ICON[fateOf(block.id)];
            return <FateIcon />;
          })()}
          {fateOf(block.id) === "summarized" ? "Folded into the summary" : fateOf(block.id) === "dropped" ? "Dropped when it compacted" : "Kept as it was"}
        </span>
      )}
      {compaction && view === "after" && block.id === compaction.summary && (
        <span className="ui-cxm__tip-fate" data-fate="summary">
          <Folded />
          From {compaction.summarized?.length ?? 0} blocks, {tokens(compaction.before.filter((b) => compaction.summarized?.includes(b.id)).reduce((t, b) => t + b.tokens, 0))} before
        </span>
      )}
      {block.items && block.items.length > 0 && (
        <ul className="ui-cxm__tip-items">
          {block.items.map((item) => (
            <li key={item.label}>
              {item.icon && (
                <span className="ui-cxm__logo" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Text that rolls when it changes: the old one slides up and fades out, the new one comes in from below */
function Roll({ k, children }: { k: string; children: ReactNode }) {
  // The text last committed, kept after commit so a new key can roll it out
  const lastNode = useRef(children);
  useLayoutEffect(() => {
    lastNode.current = children;
  });
  const [lastK, setLastK] = useState(k);
  const [out, setOut] = useState<{ k: string; node: ReactNode } | null>(null);
  if (lastK !== k) {
    setLastK(k);
    setOut({ k: lastK, node: lastNode.current });
  }
  useEffect(() => {
    if (!out) return;
    const id = window.setTimeout(() => setOut(null), 360);
    return () => clearTimeout(id);
  }, [out]);
  return (
    <span className="ui-cxm__roll">
      {out && (
        <span className="ui-cxm__roll-out" key={`out-${out.k}`} aria-hidden="true">
          {out.node}
        </span>
      )}
      <span className="ui-cxm__roll-in" key={k} data-rolling={out ? "" : undefined}>
        {children}
      </span>
    </span>
  );
}

/** "186k → 54k · 7 kept 112k · 3 summarized 66k into 8.6k · 1 dropped 15.6k" */
function Fates({ compaction, after }: { compaction: ContextCompaction | null; after: ContextBlock[] }) {
  if (!compaction)
    return (
      <div className="ui-cxm__fates-row">
        <Roll k="none">
          <p className="ui-cxm__fates ui-cxm__fates--none">Not compacted yet – once it is, compare before and after here.</p>
        </Roll>
      </div>
    );
  const sum = (list: ContextBlock[]) => list.reduce((t, b) => t + Math.max(0, b.tokens), 0);
  const of = (fate: ContextFate) =>
    compaction.before.filter((b) => (compaction.summarized?.includes(b.id) ? "summarized" : compaction.dropped?.includes(b.id) ? "dropped" : "kept") === fate);
  const kept = of("kept");
  const summarized = of("summarized");
  const dropped = of("dropped");
  const summary = after.find((b) => b.id === compaction.summary);
  return (
    <div className="ui-cxm__fates-row">
      <Roll k="done">
    <p className="ui-cxm__fates">
      <b>
        {tokens(sum(compaction.before))} → {tokens(sum(after))}
      </b>
      <span className="ui-cxm__fate" data-fate="kept">
        {kept.length} kept · {tokens(sum(kept))}
      </span>
      {summarized.length > 0 && (
        <span className="ui-cxm__fate" data-fate="summarized">
          {summarized.length} summarized · {tokens(sum(summarized))}
          {summary && <> into {tokens(summary.tokens)}</>}
        </span>
      )}
      {dropped.length > 0 && (
        <span className="ui-cxm__fate" data-fate="dropped">
          {dropped.length} dropped · {tokens(sum(dropped))}
        </span>
      )}
    </p>
      </Roll>
    </div>
  );
}

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

/** True while `ref`'s element intersects the viewport and the tab is visible. Starts true; renders only on a change */
function useOnScreen(ref: RefObject<Element | null>) {
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    let inView = true;
    let last = true;
    // Only a real change is set: the observer's first report (visible) costs no render
    const update = () => {
      const next = inView && document.visibilityState !== "hidden";
      if (next !== last) setOnScreen((last = next));
    };
    const io =
      el && typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries) => {
            inView = entries[entries.length - 1].isIntersecting;
            update();
          })
        : null;
    if (el) io?.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [ref]);
  return onScreen;
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-cxm:where([data-look="standard"]),
.ui-cxm__portal:where([data-look="standard"]) {
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-font-weight-strong: 600;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #232326);
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-menu-item-px: 10px;
  --_tc-menu-item-radius: 8px;
  --_tc-menu-item-selected-fg: light-dark(#2456d6, #8ab4ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 12px;
  --_tc-menu-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-h-lg: 22px;
  --_tc-pill-px: 8px;
  --_tc-pill-px-lg: 10px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xl: 16px;
  --_tc-radius-3xl: 20px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-seg-pad: 2px;
  --_tc-seg-thumb-bg: light-dark(#ffffff, #34343a);
  --_tc-seg-thumb-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-seg-track-bg: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-seg-track-radius: 10px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-z-dropdown: 30;
}
.ui-cxm:where([data-look="clean"]),
.ui-cxm__portal:where([data-look="clean"]) {
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-font-weight-strong: 500;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #252527);
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-menu-item-px: 8px;
  --_tc-menu-item-radius: 6px;
  --_tc-menu-item-selected-fg: light-dark(#0058cf, #70b8ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 10px;
  --_tc-menu-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-h-lg: 20px;
  --_tc-pill-px: 6px;
  --_tc-pill-px-lg: 8px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xl: 16px;
  --_tc-radius-3xl: 20px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-seg-pad: 2px;
  --_tc-seg-thumb-bg: light-dark(#ffffff, #34343a);
  --_tc-seg-thumb-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-seg-track-bg: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-seg-track-radius: 8px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-z-dropdown: 30;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Colors, sizes and motion as variables – override them on .ui-cxm */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm {
  /* Tiles by kind: a tint, its edge and the ink on it */
  --tc-context-map-tools-bg: light-dark(#e2f2f9, #12303b);
  --tc-context-map-tools-edge: light-dark(#a6d6ea, #2a6a84);
  --tc-context-map-tools-ink: light-dark(#006a94, #6fd0f2);
  --tc-context-map-memory-bg: light-dark(#ececfc, #24244a);
  --tc-context-map-memory-edge: light-dark(#bdbdf0, #4a4aa0);
  --tc-context-map-memory-ink: light-dark(#4a4ac2, #b3b3ff);
  --tc-context-map-file-bg: light-dark(#e6effd, #1d2b4d);
  --tc-context-map-file-edge: light-dark(#a9c4f5, #3c5fb3);
  --tc-context-map-file-ink: light-dark(#2456d6, #8aaeff);
  --tc-context-map-chat-bg: light-dark(#f3eafa, #2f2140);
  --tc-context-map-chat-edge: light-dark(#d3b6ec, #6a4a94);
  --tc-context-map-chat-ink: light-dark(#7b3fb0, #d4a8ff);
  --tc-context-map-result-bg: light-dark(#ffefd6, #3a2a12);
  --tc-context-map-result-edge: light-dark(#f7c27a, #8a5a1c);
  --tc-context-map-result-ink: light-dark(#b35400, #ffc078);
  --tc-context-map-summary-bg: light-dark(#dcf3e4, #15321f);
  --tc-context-map-summary-edge: light-dark(#9fd9b4, #2f7a4b);
  --tc-context-map-summary-ink: light-dark(#1a7f45, #55d68c);
  --tc-context-map-shine: light-dark(#b8b8b8, #8a8a8a);
  --tc-context-map-height: 280px;
  --tc-context-map-gap: 3px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: 4px;
  border-radius: var(--tc-radius-3xl, var(--_tc-radius-3xl));
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  min-width: 0;
  container: ui-cxm / inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  text-align: left;
  letter-spacing: -0.006em;
  -webkit-font-smoothing: antialiased;
}
/* Colors, sizes and motion as variables – override them on .ui-cxm */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm {
  /* Tiles by kind: a tint, its hairline edge and the ink on it – the Trace Waterfall recipe */
  --tc-context-map-tools-bg: light-dark(rgba(0, 123, 172, 0.085), rgba(40, 170, 220, 0.16));
  --tc-context-map-tools-edge: light-dark(rgba(0, 123, 172, 0.28), rgba(70, 190, 235, 0.42));
  --tc-context-map-tools-ink: light-dark(#006a94, #6fd0f2);
  --tc-context-map-memory-bg: light-dark(rgba(91, 91, 214, 0.1), rgba(120, 120, 255, 0.18));
  --tc-context-map-memory-edge: light-dark(rgba(91, 91, 214, 0.3), rgba(150, 150, 255, 0.45));
  --tc-context-map-memory-ink: light-dark(#4a4ac2, #b3b3ff);
  --tc-context-map-file-bg: light-dark(rgba(0, 96, 226, 0.08), rgba(60, 130, 255, 0.18));
  --tc-context-map-file-edge: light-dark(rgba(0, 96, 226, 0.26), rgba(112, 170, 255, 0.45));
  --tc-context-map-file-ink: light-dark(#0058cf, #8ab8ff);
  --tc-context-map-chat-bg: light-dark(rgba(142, 78, 198, 0.09), rgba(180, 110, 240, 0.17));
  --tc-context-map-chat-edge: light-dark(rgba(142, 78, 198, 0.28), rgba(200, 140, 250, 0.42));
  --tc-context-map-chat-ink: light-dark(#7b3fb0, #d4a8ff);
  --tc-context-map-result-bg: light-dark(rgba(255, 156, 0, 0.13), rgba(255, 160, 40, 0.17));
  --tc-context-map-result-edge: light-dark(rgba(214, 120, 0, 0.36), rgba(255, 180, 70, 0.45));
  --tc-context-map-result-ink: light-dark(#b35400, #ffc078);
  --tc-context-map-summary-bg: light-dark(rgba(0, 164, 51, 0.13), rgba(40, 200, 110, 0.17));
  --tc-context-map-summary-edge: light-dark(rgba(0, 140, 50, 0.34), rgba(60, 220, 130, 0.42));
  --tc-context-map-summary-ink: light-dark(#007d2e, #6fe0a4);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-context-map-shine: light-dark(rgba(0, 0, 0, 0.22), rgba(255, 255, 255, 0.35));
  --tc-context-map-height: 280px;
  --tc-context-map-gap: 3px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container: ui-cxm / inline-size;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-cxm *, .ui-cxm *::before, .ui-cxm *::after { box-sizing: border-box; }
/* ----- On the tray: the agent, the status, how full it is ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; min-width: 0; padding: 10px 12px 12px; }
/* ----- The bar: the model, the status, how full it is ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; min-width: 0; margin-bottom: 16px; }
.ui-cxm__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__title { flex: none; font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__title { flex: none; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-cxm__who { display: inline-flex; align-items: center; gap: 7px; min-width: 0; }
/* The model maker's logo on a small white tile */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__logo { display: grid; flex: none; place-items: center; width: 22px; height: 22px; border-radius: 7px; background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__logo > svg { width: 12px; height: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__model { min-width: 0; overflow: hidden; color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
/* The model maker's logo on a small white tile */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__logo { display: grid; flex: none; place-items: center; width: 20px; height: 20px; border-radius: 5px; background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__logo > svg { width: 11px; height: 11px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__model { min-width: 0; overflow: hidden; color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; text-overflow: ellipsis; }
/* The agent menu */
.ui-cxm__pick { position: relative; display: inline-flex; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__agent { min-width: 0; height: 32px; margin: -5px 0; padding: 0 8px 0 11px; border: 0; border-radius: var(--tc-radius-full, var(--_tc-radius-full)); letter-spacing: inherit; background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font: inherit; color: inherit; cursor: pointer; transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__agent { min-width: 0; height: 28px; margin: -4px 0; padding: 0 6px 0 8px; border: 0; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font: inherit; color: inherit; cursor: pointer; transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-cxm__agent:hover, .ui-cxm__agent[aria-expanded="true"] { box-shadow: var(--tc-shadow-raised-hover, var(--_tc-shadow-raised-hover)); }
.ui-cxm__agent .ui-cxm__logo { width: 14px; height: 14px; border-radius: 0; background: none; box-shadow: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__agent .ui-cxm__logo > svg { width: 15px; height: 15px; }
.ui-cxm__agent:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
/* Menu rows: the ring sits inside the row, so neighbours never cover it */
.ui-cxm__option:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: calc(var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) * -1); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__chev { flex: none; width: 13px; height: 13px; margin-left: -2px; color: var(--tc-text-muted, var(--_tc-text-muted)); transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__agent .ui-cxm__logo > svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__chev { flex: none; width: 12px; height: 12px; margin-left: -2px; color: var(--tc-text-muted, var(--_tc-text-muted)); transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-cxm__agent[aria-expanded="true"] .ui-cxm__chev { transform: rotate(180deg); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__menu { position: absolute; top: calc(100% + 8px); left: 0; z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown)); display: grid; gap: 1px; width: 268px; padding: var(--tc-menu-padding, var(--_tc-menu-padding)); border-radius: var(--tc-menu-radius, var(--_tc-menu-radius)); background: var(--tc-menu-bg, var(--_tc-menu-bg)); box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow)); animation: ui-cxm-tip var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__option { display: flex; align-items: center; gap: 10px; width: 100%; min-height: var(--tc-menu-item-h, var(--_tc-menu-item-h)); padding: 7px var(--tc-menu-item-px, var(--_tc-menu-item-px)) 7px 7px; border: 0; border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius)); letter-spacing: inherit; background: none; font: inherit; text-align: left; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__menu { position: absolute; top: calc(100% + 6px); left: 0; z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown)); display: grid; gap: 1px; width: 250px; padding: var(--tc-menu-padding, var(--_tc-menu-padding)); border-radius: var(--tc-menu-radius, var(--_tc-menu-radius)); background: var(--tc-menu-bg, var(--_tc-menu-bg)); box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow)); animation: ui-cxm-tip-clean var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__option { display: flex; align-items: center; gap: 9px; width: 100%; min-height: var(--tc-menu-item-h, var(--_tc-menu-item-h)); padding: 6px var(--tc-menu-item-px, var(--_tc-menu-item-px)) 6px 6px; border: 0; border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius)); background: none; font: inherit; text-align: left; color: inherit; cursor: pointer; }
.ui-cxm__option:hover { background: var(--tc-menu-item-hover, var(--_tc-menu-item-hover)); }
/* The current agent: a tick in the selected colour */
.ui-cxm__check { flex: none; width: 12px; height: 12px; margin-left: -4px; color: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg)); }
.ui-cxm__option-text { display: grid; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__option-name { overflow: hidden; font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: 19px; color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__option-model { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: 17px; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__option .ui-cxm__logo { width: 28px; height: 28px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__option .ui-cxm__logo > svg { width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__limit { flex: none; height: var(--tc-pill-h, var(--_tc-pill-h)); padding: 0 var(--tc-pill-px, var(--_tc-pill-px)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-fill-hover, var(--_tc-fill-hover)); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-pill-h, var(--_tc-pill-h)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__status { display: inline-flex; flex: none; align-items: center; gap: 5px; height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg)); padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg)) 0 calc(var(--tc-pill-px-lg, var(--_tc-pill-px-lg)) - 2px); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-context-map-summary-bg); font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); color: var(--tc-context-map-summary-ink); animation: ui-cxm-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__sum { display: flex; align-items: center; gap: 10px; margin-left: auto; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__sum b { font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__option-name { overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: 17px; color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__option-model { font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); line-height: 15px; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__option .ui-cxm__logo { width: 24px; height: 24px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__option .ui-cxm__logo > svg { width: 13px; height: 13px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__limit { flex: none; height: var(--tc-pill-h, var(--_tc-pill-h)); padding: 0 var(--tc-pill-px, var(--_tc-pill-px)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-fill-hover, var(--_tc-fill-hover)); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-pill-h, var(--_tc-pill-h)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__status { display: inline-flex; flex: none; align-items: center; gap: 5px; height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg)); padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg)) 0 calc(var(--tc-pill-px-lg, var(--_tc-pill-px-lg)) - 2px); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-context-map-summary-bg); font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); color: var(--tc-context-map-summary-ink); animation: ui-cxm-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__sum { display: flex; align-items: center; gap: 10px; margin-left: auto; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__sum b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* The used count: a shine sweeping over it, all the time */
.ui-cxm__used { background: linear-gradient(90deg, var(--tc-text-primary, var(--_tc-text-primary)) 0%, var(--tc-text-primary, var(--_tc-text-primary)) 38%, var(--tc-context-map-shine) 50%, var(--tc-text-primary, var(--_tc-text-primary)) 62%, var(--tc-text-primary, var(--_tc-text-primary)) 100%) 0 0 / 300% 100%; -webkit-background-clip: text; background-clip: text; color: transparent !important; animation: ui-cxm-shine 1100ms linear 3; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__pct { min-width: 44px; height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg)); padding: 0 var(--tc-pill-px, var(--_tc-pill-px)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg)); color: var(--tc-text-muted, var(--_tc-text-muted)); text-align: center; transition: background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__pct { min-width: 36px; height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg)); padding: 0 var(--tc-pill-px, var(--_tc-pill-px)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); text-align: center; transition: background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-cxm__pct[data-level="high"] { background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
.ui-cxm__pct[data-level="full"] { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* Before | After a compaction */
.ui-cxm__compare { display: inline-flex; flex: none; gap: 1px; padding: var(--tc-seg-pad, var(--_tc-seg-pad)); border-radius: var(--tc-seg-track-radius, var(--_tc-seg-track-radius)); background: var(--tc-seg-track-bg, var(--_tc-seg-track-bg)); }
/* Before | After a compaction */
.ui-cxm__compare { margin: -2px 0; animation: ui-cxm-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
/* Rolling text: both sit in one cell, the old one leaves upward as the new one rises in */
.ui-cxm__roll { display: inline-grid; vertical-align: top; overflow: hidden; }
.ui-cxm__roll > * { grid-area: 1 / 1; }
.ui-cxm__roll-in[data-rolling] { animation: ui-cxm-roll-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-cxm__roll-out { animation: ui-cxm-roll-out var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; pointer-events: none; }
.ui-cxm__fates-row { display: grid; }
.ui-cxm__fates-row > .ui-cxm__roll { display: grid; }
@keyframes ui-cxm-roll-in { from { opacity: 0; transform: translateY(80%); } }
@keyframes ui-cxm-roll-out { to { opacity: 0; transform: translateY(-80%); } }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__compare button { height: 24px; padding: 0 9px; border: 0; border-radius: calc(var(--tc-seg-track-radius, var(--_tc-seg-track-radius)) - var(--tc-seg-pad, var(--_tc-seg-pad))); background: none; font: inherit; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); cursor: pointer; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__compare button { height: 20px; padding: 0 9px; border: 0; border-radius: calc(var(--tc-seg-track-radius, var(--_tc-seg-track-radius)) - var(--tc-seg-pad, var(--_tc-seg-pad))); background: none; font: inherit; font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); cursor: pointer; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-cxm__compare button:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-cxm__compare button[aria-pressed="true"] { background: var(--tc-seg-thumb-bg, var(--_tc-seg-thumb-bg)); color: var(--tc-text-primary, var(--_tc-text-primary)); font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); box-shadow: var(--tc-seg-thumb-shadow, var(--_tc-seg-thumb-shadow)); }
.ui-cxm__compare button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
/* ----- The white card: one tile per part, placed by the layout, gliding when it changes ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__area { position: relative; height: var(--tc-context-map-height); padding: 0; border-radius: var(--tc-radius-2xl, var(--_tc-radius-2xl)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tile { position: absolute; left: 0; top: 0; width: max(0px, calc(var(--w) - var(--tc-context-map-gap))); height: max(0px, calc(var(--h) - var(--tc-context-map-gap))); border-radius: 9px; background: var(--tc-context-map-tile-bg); box-shadow: inset 0 0 0 1px var(--tc-context-map-tile-edge); overflow: hidden; transform: translate(calc(var(--x) + var(--tc-context-map-gap) / 2), calc(var(--y) + var(--tc-context-map-gap) / 2)); transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); cursor: default; }
/* The free space: dashed, with a faint hatch */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tile[data-kind="free"] { background: repeating-linear-gradient(135deg, transparent 0 6px, var(--tc-fill-subtle, var(--_tc-fill-subtle)) 6px 7px); box-shadow: none; outline: 1.5px dashed var(--tc-border-strong, var(--_tc-border-strong)); outline-offset: -2px; }
/* ----- The area: one tile per part, placed by the layout, gliding when it changes ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__area { position: relative; height: var(--tc-context-map-height); padding: 0; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tile { position: absolute; left: 0; top: 0; width: max(0px, calc(var(--w) - var(--tc-context-map-gap))); height: max(0px, calc(var(--h) - var(--tc-context-map-gap))); border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-context-map-tile-bg); box-shadow: inset 0 0 0 0.5px var(--tc-context-map-tile-edge); overflow: hidden; transform: translate(calc(var(--x) + var(--tc-context-map-gap) / 2), calc(var(--y) + var(--tc-context-map-gap) / 2)); transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); cursor: default; }
/* The free space: dashed, with a faint hatch */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tile[data-kind="free"] { background: repeating-linear-gradient(135deg, transparent 0 6px, var(--tc-fill-subtle, var(--_tc-fill-subtle)) 6px 7px); box-shadow: inset 0 0 0 0.5px var(--tc-border-strong, var(--_tc-border-strong)); outline: 1px dashed var(--tc-border-strong, var(--_tc-border-strong)); outline-offset: -3px; }
.ui-cxm__tile[data-dim] { opacity: 0.55; }
/* The label: no ellipsis – a line that runs into the edge fades out, and a line without room fades away before it's cut */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__label { position: absolute; top: 8px; right: 0; left: 10px; display: grid; min-width: 0; pointer-events: none; }
/* The label: no ellipsis – a line that runs into the edge fades out, and a line without room fades away before it's cut */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__label { position: absolute; top: 7px; right: 0; left: 9px; display: grid; min-width: 0; pointer-events: none; }
.ui-cxm__name, .ui-cxm__tokens { overflow: hidden; white-space: nowrap; -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 22px), transparent calc(100% - 4px)); mask-image: linear-gradient(90deg, #000 calc(100% - 22px), transparent calc(100% - 4px)); opacity: 0; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__name { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: 17px; color: var(--tc-context-map-tile-ink); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tokens { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: 17px; color: var(--tc-context-map-tile-ink); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__name { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-context-map-tile-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tokens { font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); line-height: 15px; color: var(--tc-context-map-tile-ink); font-variant-numeric: tabular-nums; }
.ui-cxm__name[data-show] { opacity: 1; }
/* The count is real text: full ink, no opacity (1.4.3) */
.ui-cxm__tokens[data-show] { opacity: 1; }
.ui-cxm__kind { opacity: 0; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-cxm__kind[data-show] { opacity: 1; }
.ui-cxm__tile[data-kind="free"] :is(.ui-cxm__name, .ui-cxm__tokens) { color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Every kind's colors in one place */
.ui-cxm [data-kind="system"] { --tc-context-map-tile-bg: var(--tc-fill-default, var(--_tc-fill-default)); --tc-context-map-tile-edge: var(--tc-border-strong, var(--_tc-border-strong)); --tc-context-map-tile-ink: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-cxm [data-kind="tools"] { --tc-context-map-tile-bg: var(--tc-context-map-tools-bg); --tc-context-map-tile-edge: var(--tc-context-map-tools-edge); --tc-context-map-tile-ink: var(--tc-context-map-tools-ink); }
.ui-cxm [data-kind="memory"] { --tc-context-map-tile-bg: var(--tc-context-map-memory-bg); --tc-context-map-tile-edge: var(--tc-context-map-memory-edge); --tc-context-map-tile-ink: var(--tc-context-map-memory-ink); }
.ui-cxm [data-kind="file"] { --tc-context-map-tile-bg: var(--tc-context-map-file-bg); --tc-context-map-tile-edge: var(--tc-context-map-file-edge); --tc-context-map-tile-ink: var(--tc-context-map-file-ink); }
.ui-cxm [data-kind="chat"] { --tc-context-map-tile-bg: var(--tc-context-map-chat-bg); --tc-context-map-tile-edge: var(--tc-context-map-chat-edge); --tc-context-map-tile-ink: var(--tc-context-map-chat-ink); }
.ui-cxm [data-kind="result"] { --tc-context-map-tile-bg: var(--tc-context-map-result-bg); --tc-context-map-tile-edge: var(--tc-context-map-result-edge); --tc-context-map-tile-ink: var(--tc-context-map-result-ink); }
.ui-cxm [data-kind="summary"] { --tc-context-map-tile-bg: var(--tc-context-map-summary-bg); --tc-context-map-tile-edge: var(--tc-context-map-summary-edge); --tc-context-map-tile-ink: var(--tc-context-map-summary-ink); }
/* ----- The window over a tile ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip { position: absolute; top: 0; left: 0; z-index: 5; display: grid; gap: 2px; width: max-content; max-width: 320px; padding: 10px 14px 11px; border-radius: var(--tc-menu-radius, var(--_tc-menu-radius)); background: var(--tc-menu-bg, var(--_tc-menu-bg)); box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow)); animation: ui-cxm-tip var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
/* ----- The window over a tile ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip { position: absolute; top: 0; left: 0; z-index: 5; display: grid; gap: 2px; width: max-content; max-width: 300px; padding: 9px 12px 10px; border-radius: var(--tc-menu-radius, var(--_tc-menu-radius)); background: var(--tc-menu-bg, var(--_tc-menu-bg)); box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow)); animation: ui-cxm-tip-clean var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-cxm__tip-head { display: flex; align-items: center; gap: 7px; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__swatch { flex: none; width: 10px; height: 10px; border-radius: 3px; background: var(--tc-context-map-tile-bg); box-shadow: inset 0 0 0 1px var(--tc-context-map-tile-edge); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-name { overflow: hidden; font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-meta { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
/* What's inside: each with its logo, in two columns */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-items { display: grid; grid-template-columns: repeat(2, max-content); gap: 7px 18px; margin: 8px 0 0; padding: 9px 0 0; border-top: 1px solid var(--tc-border-default, var(--_tc-border-default)); list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-items li { display: flex; align-items: center; gap: 8px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-items .ui-cxm__logo,
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-head .ui-cxm__logo { width: 20px; height: 20px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-items .ui-cxm__logo > svg,
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-head .ui-cxm__logo > svg { width: 11px; height: 11px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__swatch { flex: none; width: 9px; height: 9px; border-radius: 2.5px; background: var(--tc-context-map-tile-bg); box-shadow: inset 0 0 0 0.5px var(--tc-context-map-tile-edge); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-name { overflow: hidden; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-meta { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
/* What's inside: each with its logo, in two columns */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-items { display: grid; grid-template-columns: repeat(2, max-content); gap: 6px 16px; margin: 7px 0 0; padding: 8px 0 0; border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); list-style: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-items li { display: flex; align-items: center; gap: 7px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-items .ui-cxm__logo,
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-head .ui-cxm__logo { width: 18px; height: 18px; color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-items .ui-cxm__logo > svg,
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-head .ui-cxm__logo > svg { width: 10px; height: 10px; }
.ui-cxm__icon { display: inline-flex; vertical-align: -2px; margin-right: 5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__icon > svg { width: 13px; height: 13px; border-radius: 3px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-detail { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: 19px; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* What the compaction did with the block, in the window */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__tip-fate { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__icon > svg { width: 12px; height: 12px; border-radius: 3px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-detail { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* What the compaction did with the block, in the window */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__tip-fate { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-cxm__tip-fate > svg { flex: none; width: 12px; height: 12px; }
.ui-cxm__tip-fate:is([data-fate="summarized"], [data-fate="summary"]) { color: var(--tc-context-map-summary-ink); }
.ui-cxm__tip-fate[data-fate="dropped"] { color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- Before a compaction: each block marked by what happened to it ----- */
/* Summarized: its own tint, a dashed edge in its own color, and "→ summary" in green */
.ui-cxm__tile[data-fate="summarized"] { box-shadow: none; outline: 1.5px dashed color-mix(in srgb, var(--tc-context-map-tile-ink) 55%, transparent); outline-offset: -1.5px; }
/* Dropped: greyed out, its name struck through */
.ui-cxm__tile[data-fate="dropped"] { filter: grayscale(1); --tc-context-map-tile-bg: var(--tc-fill-subtle, var(--_tc-fill-subtle)); --tc-context-map-tile-edge: var(--tc-border-default, var(--_tc-border-default)); --tc-context-map-tile-ink: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-cxm__tile[data-fate="dropped"] .ui-cxm__name { text-decoration: line-through; }
/* After: the summary they went into carries a ring */
.ui-cxm__tile[data-fate="summary"] { box-shadow: inset 0 0 0 1px var(--tc-context-map-summary-edge); }
/* Summarized: a small grey mark in the top right corner */
.ui-cxm__badge { position: absolute; top: 6px; right: 6px; z-index: 1; display: grid; place-items: center; width: 18px; height: 18px; border-radius: 5px; background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-muted, var(--_tc-text-muted)); pointer-events: none; animation: ui-cxm-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-cxm__badge > svg { width: 11px; height: 11px; }
/* A pinned card's block: a quiet ring in its own color */
.ui-cxm__tile[data-pinned] { box-shadow: inset 0 0 0 1.5px var(--tc-context-map-tile-ink); }
.ui-cxm__tile[data-fate="summarized"][data-pinned] { outline-style: solid; }
.ui-cxm__tile { cursor: pointer; }
.ui-cxm__tile[data-kind="free"] { cursor: default; }
/* Each block's button covers its tile; the focus ring sits inside the tile, which clips what sticks out */
.ui-cxm__hit { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; border-radius: inherit; background: none; font: inherit; color: inherit; cursor: pointer; }
.ui-cxm__hit:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: calc(var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) * -1); }
.ui-cxm__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The line under the map: before → after, then how many blocks went which way */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__fates { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 16px; min-height: 18px; margin: 10px 0 0; padding: 0 10px 8px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
/* The line under the map: before → after, then how many blocks went which way */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__fates { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 16px; min-height: 16px; margin: 10px 0 0; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
.ui-cxm__fates b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-cxm__fates--none { color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-cxm__fate { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__fate::before { content: ""; flex: none; width: 9px; height: 9px; border-radius: 2.5px; background: var(--tc-fill-default, var(--_tc-fill-default)); box-shadow: inset 0 0 0 1.5px var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__fate::before { content: ""; flex: none; width: 8px; height: 8px; border-radius: 2.5px; background: var(--tc-fill-default, var(--_tc-fill-default)); box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)); }
.ui-cxm__fate[data-fate="summarized"]::before { background: none; box-shadow: none; outline: 1px dashed var(--tc-text-muted, var(--_tc-text-muted)); outline-offset: -1px; }
.ui-cxm__fate[data-fate="dropped"]::before { opacity: 0.45; }
/* ----- Narrow: a shorter area, the numbers on their own line ----- */
@container ui-cxm (max-width: 480px) {
  /* The count on the left, Before | After and the share together on the right */
.ui-cxm__compare { order: 2; margin-left: auto; }
  /* As tall as the switch from the start, so the row doesn't grow when it appears */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__sum { min-height: 28px; }
  /* Room for the summary line's two rows, so it takes the placeholder's place without growing */
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__fates { min-height: 40px; align-content: flex-start; }
.ui-cxm__pct { order: 3; }
:where([data-look="standard"], [data-look="standard"] *).ui-cxm__sum { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
.ui-cxm__area { --tc-context-map-height: 240px; }
  /* As tall as the switch from the start, so the row doesn't grow when it appears */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__sum { min-height: 24px; }
  /* Room for the summary line's two rows, so it takes the placeholder's place without growing */
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__fates { min-height: 36px; align-content: flex-start; }
:where([data-look="clean"], [data-look="clean"] *).ui-cxm__sum { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
}
@keyframes ui-cxm-fade { from { opacity: 0; } }
@keyframes ui-cxm-shine { from { background-position: 100% 0; } to { background-position: 0 0; } }
.ui-cxm__spin { flex: none; width: 12px; height: 12px; animation: ui-cxm-spin 800ms steps(8) infinite; }
@keyframes ui-cxm-spin { to { transform: rotate(360deg); } }
@keyframes ui-cxm-tip { from { opacity: 0; transform: translateY(4px) scale(0.96); } }
@keyframes ui-cxm-tip-clean { from { opacity: 0; transform: translateY(3px) scale(0.97); } }
@media (prefers-reduced-motion: reduce) {
  .ui-cxm *, .ui-cxm *::before, .ui-cxm *::after { animation: none !important; transition: none !important; }
}
`;

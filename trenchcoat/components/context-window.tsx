"use client";

/*
 * Context Window – what fills an AI model's context right now, and what you can do about it, in one self-contained file.
 * The window is drawn as a field of small cells: every cell is a slice of the token limit, colored by what sits in
 * it – system prompt, tools, files, the conversation, memory. Empty cells are the room that is left.
 *   · hover a part and its cells stay lit while the rest fades; the big number rolls to that part
 *   · open a part with items (files, tools) and remove single ones – the cells empty in a sweep and everything moves up
 *   · press Compact on the conversation: its cells shimmer while it works, then most of them clear
 *   · the percentage turns amber before the window is full, and the gray tray says how much is left
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: context-window.tsx is Standard,
 * context-window-clean.tsx is Clean). Clean is one white card with hairline shadows: the caption and the action sit
 * in its last row instead of on a gray tray, the percentage is a tag, the icons are 16px with finer strokes, and
 * "Compacting…" shimmers.
 */
// Generated from src/components/context-window.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-cw";

export type ContextItem = { id: string; label: string; tokens: number };

export type ContextPart = {
  id: string;
  label: string;
  /** Tokens of this part – ignored when `items` are given (then it is their sum) */
  tokens?: number;
  /** Single things inside this part that can be removed, e.g. attached files */
  items?: ContextItem[];
  /** Nothing can be removed or compacted here, e.g. the system prompt */
  locked?: boolean;
  /** Shows a Compact button. A number is the share that stays after compacting (default 0.3) */
  compact?: boolean | number;
  /** Any CSS color – defaults to a fixed palette in the order of the parts */
  color?: string;
};

type ContextWindowOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in context-window.tsx, Clean in context-window-clean.tsx */
  look?: Look;
  parts: ContextPart[];
  /** Size of the context window in tokens */
  limit: number;
  title?: string;
  /** Small tag in the head, e.g. the model name */
  model?: string;
  /** Logo in front of the model name – any node, sized to 12px */
  modelIcon?: ReactNode;
  /**
   * Called when an item is removed. The card hides the item at once and keeps it hidden until `parts` brings a
   * different list of items for that part – so `parts` stays the source of truth, whether you handle the removal or
   * only listen to it
   */
  onRemoveItem?: (partId: string, itemId: string) => void;
  /**
   * Called when Compact is pressed; the cells shimmer until the returned promise settles, and a rejection says so and
   * leaves Compact to press again. The signal aborts when the card unmounts. Once it settles the part shows its
   * `compact` share at once, until `parts` brings a new size for it
   */
  onCompact?: (partId: string, options: { signal: AbortSignal }) => void | Promise<void>;
  /** A button on the tray (Clean: in the card's last row), e.g. { label: "New chat", onClick } */
  action?: { label: string; onClick: () => void };
  /** Share of the limit from which the card warns (0–1) */
  warnAt?: number;
  /** Number of cells and how many sit in one row */
  cells?: number;
  columns?: number;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type ContextWindowProps = Omit<ComponentPropsWithoutRef<"div">, keyof ContextWindowOwnProps> & ContextWindowOwnProps;

/** Which items a part holds – a removal made here holds only while the part still has the same ones */
const itemsKey = (p: ContextPart) => p.items?.map((it) => it.id).join("\u0000") ?? "";

/* ---------- Helpers ---------- */

const PALETTE = [
  "var(--tc-context-window-series-1)",
  "var(--tc-context-window-series-2)",
  "var(--tc-context-window-series-3)",
  "var(--tc-context-window-series-4)",
  "var(--tc-context-window-series-5)",
  "var(--tc-context-window-series-6)",
];
const tokens = (n: number) => {
  const v = Math.max(0, n);
  if (v >= 999_950) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return `${Math.round(v)}`;
};
/** For numbers that stand still: 200K instead of 200.0K */
const plain = (n: number) => tokens(n).replace(/\.0(?=[KM]$)/, "");
const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * Text that changes without a jump: the old line stays for a moment and fades out underneath while the new one fades in.
 * Quick changes (moving across rows) just retarget – nothing piles up.
 */
function Swap({ id, tone, children }: { id: string; tone?: string; children: ReactNode }) {
  type Line = { id: string; tone?: string; node: ReactNode };
  // The line last committed – kept after commit, so a new id can fade it out
  const last = useRef<Line>({ id, tone, node: children });
  useLayoutEffect(() => {
    last.current = { id, tone, node: children };
  });
  const [shownId, setShownId] = useState(id);
  const [out, setOut] = useState<Line | null>(null);
  if (shownId !== id) {
    // A new line: what was on screen until now becomes the one that fades out
    setShownId(id);
    setOut(last.current);
  }
  useEffect(() => {
    if (!out) return;
    const timer = window.setTimeout(() => setOut(null), 260);
    return () => window.clearTimeout(timer);
  }, [out]);
  return (
    <span className="ui-cw__swap">
      {out && (
        <span key={`out-${out.id}`} className="ui-cw__swap-item" data-out="" data-tone={out.tone} aria-hidden="true">
          {out.node}
        </span>
      )}
      <span key={id} className="ui-cw__swap-item" data-tone={tone}>
        {children}
      </span>
    </span>
  );
}

/**
 * useRolling's DOM-writing twin: rolls named numbers to their targets and writes each frame's value, formatted, into
 * the text of the elements bound to it – no React render per frame. React renders the target text (so it is right
 * on the server, for tests and once the roll ends); a layout effect puts the previous value back before the first
 * paint and the frame loop takes it from there. Only the existing text node is written, never replaced, so React's
 * later updates still land.
 */
function useRollingText(target: Record<string, number>, duration: number, formats: Record<string, (n: number) => string>, active = true) {
  const current = useRef(target);
  const els = useRef(new Map<string, HTMLElement>());
  const binders = useRef(new Map<string, (el: HTMLElement | null) => void>());
  const latestFormats = useRef(formats);
  useLayoutEffect(() => {
    latestFormats.current = formats;
  });
  const signature = JSON.stringify(target);
  useLayoutEffect(() => {
    const to = JSON.parse(signature) as Record<string, number>;
    const from = { ...current.current };
    const write = (values: Record<string, number>) => {
      for (const [key, el] of els.current) {
        const text = el.firstChild;
        const format = latestFormats.current[key];
        if (values[key] === undefined || !format || !text || text.nodeType !== Node.TEXT_NODE) continue;
        const next = format(values[key]);
        if (text.nodeValue !== next) text.nodeValue = next;
      }
    };
    // Off screen (or with reduced motion) the numbers jump – no frame loop nobody sees
    if (!active || reducedMotion() || Object.keys(to).every((k) => from[k] === to[k])) {
      current.current = to;
      write(to);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutQuart(t);
      const next: Record<string, number> = {};
      for (const k in to) next[k] = (from[k] ?? to[k]) + (to[k] - (from[k] ?? to[k])) * e;
      current.current = next;
      write(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    // Back to where the roll starts before this commit is painted (React has just written the target)
    write(from);
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [signature, duration]); // eslint-disable-line react-hooks/exhaustive-deps -- `active` only decides how the next change is shown
  /** A stable ref callback per key: binds an element whose only child is the rolling number's text */
  return useCallback((key: string) => {
    let bind = binders.current.get(key);
    if (!bind) {
      bind = (el: HTMLElement | null) => {
        if (el) els.current.set(key, el);
        else els.current.delete(key);
      };
      binders.current.set(key, bind);
    }
    return bind;
  }, []);
}

/* ---------- Icons ---------- */

/* Standard draws 12px icons with 1.4px strokes, Clean 16px ones with 1.1px strokes */
type IconProps = { clean: boolean };
const line = (clean: boolean) =>
  ({
    stroke: "currentColor",
    strokeWidth: clean ? 1.1 : 1.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  }) as const;
const ChevronIcon = ({ clean }: IconProps) =>
  clean ? (
    <svg className="ui-cw__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m5 6.75 3 3 3-3" {...line(clean)} />
    </svg>
  ) : (
    <svg className="ui-cw__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="m3 4.5 3 3 3-3" {...line(clean)} />
    </svg>
  );
const CloseIcon = ({ clean }: IconProps) =>
  clean ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m5 5 6 6m0-6-6 6" {...line(clean)} />
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="m2.5 2.5 5 5m0-5-5 5" {...line(clean)} />
    </svg>
  );
const DoneIcon = ({ clean }: IconProps) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="m2.6 6.3 2.2 2.2 4.6-5" {...line(clean)} strokeWidth={clean ? 1.3 : 1.6} />
  </svg>
);
const CompactIcon = ({ clean }: IconProps) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M6 1.5v3m0 0L4.6 3.1M6 4.5l1.4-1.4M6 10.5v-3m0 0L4.6 8.9M6 7.5l1.4 1.4M2 6h8" {...line(clean)} />
  </svg>
);
const ArrowIcon = ({ clean }: IconProps) =>
  clean ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" {...line(clean)} />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6h7M6.5 3l3 3-3 3" {...line(clean)} />
    </svg>
  );

/* ---------- What the tray says ---------- */

function trayCaption({
  clean,
  busy,
  failed,
  hotPart,
  saved,
  level,
  limit,
  used,
}: {
  clean: boolean;
  busy: string | null;
  failed: { id: number; label: string } | null;
  hotPart: { id: string; label: string; tokens: number } | null;
  saved: { id: number; amount: number } | null;
  level: "ok" | "warn" | "full";
  limit: number;
  used: number;
}) {
  const free = Math.max(0, limit - used);
  let caption: ReactNode = <>{plain(free)} free</>;
  let captionKey = "rest";
  let captionTone: string | undefined;
  if (busy) {
    // Clean: the word shimmers while it works
    caption = clean ? (
      <span className="ui-cw__shimmer" data-text="Compacting…">
        Compacting…
      </span>
    ) : (
      "Compacting…"
    );
    captionKey = "busy";
  } else if (failed) {
    caption = (
      <>
        Couldn't compact <b>{failed.label}</b> – try again
      </>
    );
    captionKey = `failed-${failed.id}`;
    captionTone = "error";
  } else if (hotPart) {
    caption = (
      <>
        <b>{hotPart.label}</b> ·{" "}
        {limit > 0
          ? ((hotPart.tokens / limit) * 100).toFixed(
              hotPart.tokens / limit < 0.1 ? 1 : 0,
            )
          : 0}
        % of the window
      </>
    );
    captionKey = `hot-${hotPart.id}`;
  } else if (saved) {
    caption = (
      <>
        Saved <b>{plain(saved.amount)}</b> tokens
      </>
    );
    captionKey = `saved-${saved.id}`;
    captionTone = "ok";
  } else if (level !== "ok") {
    caption = level === "full" ? "Window is full" : `${plain(free)} left`;
    captionKey = level;
    // Clean tints the warning in the last row too
    if (clean) captionTone = level;
  }
  return { caption, captionKey, captionTone };
}

/* ---------- Pieces ---------- */

type Part = Omit<ContextPart, "items" | "tokens" | "color"> & { items: ContextItem[] | undefined; raw: number; tokens: number; color: string };

function CompactButton({
  part: p,
  clean,
  busy,
  done,
  leaving,
  onCompact,
  onHot,
}: {
  part: Part;
  clean: boolean;
  busy: string | null;
  done: boolean;
  leaving: boolean;
  onCompact: (part: Part) => void;
  onHot: (id: string | null) => void;
}) {
  return (
    <button
      type="button"
      className="ui-cw__compact"
      aria-label={done ? `${p.label} is compacted` : `Compact ${p.label}`}
      // aria-disabled, not disabled: the button keeps focus while it works and while it says "Compacted"
      aria-disabled={Boolean(busy) || p.tokens === 0 || done || undefined}
      data-focus-key={`compact:${p.id}`}
      data-busy={busy === p.id ? "" : undefined}
      data-done={done ? "" : undefined}
      data-leaving={leaving ? "" : undefined}
      onClick={() => {
        if (!busy && p.tokens > 0 && !done) onCompact(p);
      }}
      onFocus={() => onHot(p.id)}
      onBlur={() => onHot(null)}
    >
      {/* Icon and word swap in place: Compact → working → Compacted */}
      <span className="ui-cw__compact-icon" key={busy === p.id ? "icon-busy" : done ? "icon-done" : "icon-idle"}>
        {busy === p.id ? <span className="ui-cw__spinner" /> : done ? <DoneIcon clean={clean} /> : <CompactIcon clean={clean} />}
      </span>
      <span className="ui-cw__compact-text" key={done ? "text-done" : "text-idle"}>
        {done ? "Compacted" : "Compact"}
      </span>
    </button>
  );
}

/** The window as a field of cells: which part each cell belongs to (null: free) */
function CellField({
  owner,
  list,
  hot,
  busy,
  columns,
  onHot,
}: {
  owner: (number | null)[];
  list: Part[];
  hot: string | null;
  busy: string | null;
  columns: number;
  onHot: (id: string | null) => void;
}) {
  return (
    <div
      className="ui-cw__field"
      aria-hidden="true"
      data-hot={hot !== null && list.some((p) => p.id === hot) ? "" : undefined}
      style={{ ["--tc-context-window-cols" as string]: columns, ["--tc-context-window-cols-narrow" as string]: Math.max(8, Math.round((columns * 2) / 3)) }}
    >
      {owner.map((index, i) => {
        const part = index === null ? null : list[index];
        return (
          <span
            key={i}
            className="ui-cw__cell"
            data-on={part && hot === part.id ? "" : undefined}
            data-busy={part && busy === part.id ? "" : undefined}
            data-free={part ? undefined : ""}
            style={{
              ["--i" as string]: i,
              ...(part ? { ["--tc-context-window-color" as string]: part.color } : {}),
            }}
            onPointerEnter={(e) =>
              e.pointerType === "mouse" && onHot(part ? part.id : null)
            }
          />
        );
      })}
    </div>
  );
}

/** A part's row – its own button when it has items to open – and the fold with those items */
function PartRow({
  part: p,
  clean,
  uid,
  open: isOpen,
  hot,
  leaving,
  roll,
  compactButton,
  onToggle,
  onHot,
  onRemove,
}: {
  part: Part;
  clean: boolean;
  uid: string;
  open: boolean;
  hot: string | null;
  leaving: Record<string, true>;
  roll: (key: string) => (el: HTMLElement | null) => void;
  compactButton: ReactNode;
  onToggle: () => void;
  onHot: (id: string | null) => void;
  onRemove: (partId: string, itemId: string, from: HTMLElement) => void;
}) {
  const canOpen = Boolean(p.items);
  // A part with items opens with its label button, which stretches over the whole row – Compact sits beside it,
  // never inside it
  const main = (
    <>
      <span
        className="ui-cw__swatch"
        style={{ background: p.color }}
      />
      {canOpen ? (
        <button
          type="button"
          className="ui-cw__label ui-cw__toggle"
          aria-expanded={isOpen}
          aria-controls={`${uid}-${p.id}`}
          data-focus-key={`part:${p.id}`}
          onClick={onToggle}
          onFocus={() => onHot(p.id)}
          onBlur={() => onHot(null)}
        >
          {p.label}
          <span className="ui-cw__open" data-open={isOpen ? "" : undefined}>
            <ChevronIcon clean={clean} />
          </span>
        </button>
      ) : (
        <span className="ui-cw__label">{p.label}</span>
      )}
      {compactButton}
      <span className="ui-cw__value" ref={roll(p.id)}>
        {tokens(p.tokens)}
      </span>
    </>
  );
  return (
    <li
      className="ui-cw__part"
      data-hot={hot === p.id ? "" : undefined}
      data-dim={hot && hot !== p.id ? "" : undefined}
      onPointerEnter={(e) =>
        e.pointerType === "mouse" && onHot(p.id)
      }
    >
      <div className="ui-cw__row">
        <div className="ui-cw__main" data-part={p.id}>
          {main}
        </div>
      </div>

      {p.items && (
        <div
          id={`${uid}-${p.id}`}
          className="ui-cw__fold"
          data-open={isOpen ? "" : undefined}
          inert={!isOpen}
        >
          <div className="ui-cw__clip">
            <ul className="ui-cw__items">
              {p.items.length === 0 && (
                <li className="ui-cw__empty">Nothing attached</li>
              )}
              {p.items.map((it) => (
                <li
                  key={it.id}
                  className="ui-cw__fold ui-cw__fold--item"
                  data-open={
                    leaving[`${p.id}/${it.id}`] ? undefined : ""
                  }
                  inert={leaving[`${p.id}/${it.id}`] || undefined}
                >
                  <div className="ui-cw__clip">
                    <div className="ui-cw__item">
                      <span className="ui-cw__item-label">
                        {it.label}
                      </span>
                      <span className="ui-cw__item-value">
                        {tokens(it.tokens)}
                      </span>
                      <button
                        type="button"
                        className="ui-cw__remove"
                        aria-label={`Remove ${it.label}`}
                        data-focus-key={`remove:${p.id}`}
                        onClick={(e) => onRemove(p.id, it.id, e.currentTarget)}
                      >
                        <CloseIcon clean={clean} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

export function ContextWindow({
  look,
  parts,
  limit,
  title = "Context window",
  model,
  modelIcon,
  onRemoveItem,
  onCompact,
  action,
  warnAt = 0.8,
  cells = 216,
  columns = 36,
  className,
  ref,
  ...rest
}: ContextWindowProps) {
  const clean = (look ?? DEFAULT_LOOK) === "clean";
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const setRoot = useRootRef(rootRef, ref);
  const onScreen = useOnScreen(rootRef);
  // Focus never drops to <body>: a removed item's × hands it to the next item's, then to the part's button; a
  // Compact button that folds away to the next control in the card
  useFocusRescue(rootRef, {
    fallback: (key) => {
      const box = rootRef.current;
      const id = key?.slice(key.indexOf(":") + 1);
      if (!box || !id) return null;
      const usable = (el: Element) => !el.closest("[inert]") && el.getAttribute("aria-disabled") !== "true";
      const row = box.querySelector(`.ui-cw__main[data-part="${CSS.escape(id)}"]`);
      const own = row?.closest(".ui-cw__part")?.querySelector<HTMLElement>(`.ui-cw__remove, .ui-cw__toggle`);
      if (own && usable(own)) return own;
      const all = [...box.querySelectorAll<HTMLElement>("button")].filter(usable);
      return (row && all.find((b) => row.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)) ?? all[all.length - 1] ?? null;
    },
  });
  // What was removed and compacted here, until `parts` says otherwise: a removal holds while the part has the same
  // items (the value is that list), a compaction while the part has the same size (raw is that size)
  const [removed, setRemoved] = useState<Record<string, string>>({});
  const [shrunk, setShrunk] = useState<Record<string, { raw: number; to: number }>>({});
  /** Items that are folding away before they go */
  const [leaving, setLeaving] = useState<Record<string, true>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ id: number; amount: number } | null>(
    null,
  );
  const alive = useRef(true);
  // Aborted on unmount: a compaction still running is told it's no longer wanted
  const aborter = useRef<AbortController | null>(null);
  useEffect(() => {
    alive.current = true;
    aborter.current = new AbortController();
    return () => {
      alive.current = false;
      aborter.current?.abort();
    };
  }, []);

  const list = parts.map((p, i) => {
    const key = itemsKey(p);
    const items = p.items?.filter((it) => removed[`${p.id}/${it.id}`] !== key);
    const raw = items
      ? items.reduce((sum, it) => sum + it.tokens, 0)
      : (p.tokens ?? 0);
    const own = shrunk[p.id];
    return {
      ...p,
      items,
      /** The size `parts` gives it */
      raw,
      tokens: own && own.raw === raw ? Math.min(raw, own.to) : raw,
      color: p.color ?? PALETTE[i % PALETTE.length],
    };
  });
  // The latest sizes from `parts`, for a compaction that settles later
  const latestRaw = useRef<Record<string, number>>({});
  useLayoutEffect(() => {
    latestRaw.current = Object.fromEntries(list.map((p) => [p.id, p.raw]));
  });
  const used = list.reduce((sum, p) => sum + p.tokens, 0);
  const share = limit > 0 ? used / limit : 0;
  const level = share >= 0.95 ? "full" : share >= warnAt ? "warn" : "ok";
  const hotPart = list.find((p) => p.id === hot) ?? null;

  // One tween for the total, the big figure (total or hovered part) and every row
  const target: Record<string, number> = {
    "#used": used,
    "#figure": hotPart ? hotPart.tokens : used,
  };
  for (const p of list) target[p.id] = p.tokens;
  const percent = (n: number) => `${Math.round((n / Math.max(limit, 1)) * 100)}%`;
  const formats: Record<string, (n: number) => string> = { "#used": percent, "#figure": tokens };
  for (const p of list) formats[p.id] = tokens;
  const roll = useRollingText(target, 640, formats, onScreen);

  // Which part each cell belongs to: the parts fill the field in order, the rest stays empty
  const perCell = limit / cells;
  const owner: (number | null)[] = new Array(cells).fill(null);
  let sum = 0;
  let from = 0;
  list.forEach((p, index) => {
    sum += p.tokens;
    const to = Math.min(
      cells,
      Math.max(p.tokens > 0 ? from + 1 : from, Math.round(sum / perCell)),
    );
    for (let i = from; i < to; i++) owner[i] = index;
    from = to;
  });

  /* ---------- Actions ---------- */

  const remove = async (partId: string, itemId: string, from?: HTMLElement) => {
    const key = `${partId}/${itemId}`;
    // Before the item goes inert: focus to the next item's ×, else the one before, else the part's button
    const li = from?.closest(".ui-cw__fold--item");
    const near = (dir: "next" | "prev") => {
      for (let el = dir === "next" ? li?.nextElementSibling : li?.previousElementSibling; el; el = dir === "next" ? el.nextElementSibling : el.previousElementSibling)
        if (el.hasAttribute("data-open")) return el.querySelector(".ui-cw__remove");
      return null;
    };
    rescueFocus(li, [() => near("next"), () => near("prev"), () => li?.closest(".ui-cw__part")?.querySelector(".ui-cw__toggle")]);
    const label = parts.find((p) => p.id === partId)?.items?.find((it) => it.id === itemId)?.label;
    if (label) note(`Removed ${label}`);
    setLeaving((l) => ({ ...l, [key]: true }));
    if (!reducedMotion()) await wait(240);
    if (!alive.current) return;
    setLeaving(({ [key]: _gone, ...others }) => others);
    const part = parts.find((p) => p.id === partId);
    if (part) setRemoved((r) => ({ ...r, [key]: itemsKey(part) }));
    onRemoveItem?.(partId, itemId);
  };

  const compact = async (part: (typeof list)[number]) => {
    if (busy) return;
    setBusy(part.id);
    setWatch(null);
    setFailed(null);
    const before = part.tokens;
    let ok = true;
    // The shimmer runs at least long enough to be seen
    const signal = aborter.current?.signal ?? new AbortController().signal;
    await Promise.all([
      Promise.resolve()
        .then(() => onCompact?.(part.id, { signal }))
        .catch(() => {
          ok = false;
        }),
      wait(reducedMotion() ? 0 : 1300),
    ]);
    if (!alive.current) return;
    setBusy(null);
    // A failed compaction isn't marked as done – the tray says so and the button stays, to try again
    if (!ok) {
      failures.current += 1;
      setFailed({ id: failures.current, label: part.label });
      return;
    }
    // Compacted parts can't be compacted again – until they have grown past this size
    setFarewell({ id: part.id, leaving: false });
    const raw = latestRaw.current[part.id] ?? part.raw;
    if (raw < before) {
      // The parent already passed the smaller part
      setCompacted((c) => ({ ...c, [part.id]: raw }));
      say(before - raw);
      return;
    }
    // The part shrinks here at once; when the parent passes a new size for it, that one shows instead
    const keep = typeof part.compact === "number" ? part.compact : 0.3;
    const after = Math.round(before * keep);
    setShrunk((s) => ({ ...s, [part.id]: { raw, to: after } }));
    setCompacted((c) => ({ ...c, [part.id]: after }));
    say(before - after);
    setWatch({ id: part.id, before, raw });
  };
  // A parent that passes the smaller part a moment later: say how much that saved
  const [watch, setWatch] = useState<{ id: string; before: number; raw: number } | null>(null);
  const said = useRef(0);
  const say = (amount: number) => setSaved({ id: ++said.current, amount });
  // A removal, for the status region only (the tray shows the new total)
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);
  const note = (text: string) => setNotice({ id: ++said.current, text });
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(id);
  }, [notice]);
  const [failed, setFailed] = useState<{ id: number; label: string } | null>(null);
  const failures = useRef(0);
  useEffect(() => {
    if (!failed) return;
    const id = window.setTimeout(() => setFailed(null), 4000);
    return () => window.clearTimeout(id);
  }, [failed]);
  const watched = watch ? (list.find((p) => p.id === watch.id)?.raw ?? 0) : 0;
  useEffect(() => {
    if (!watch || watched === watch.raw) return;
    setWatch(null);
    // It grew instead (or the part went): nothing more to say
    if (watched >= watch.before) return;
    setCompacted((c) => ({ ...c, [watch.id]: watched }));
    say(watch.before - watched);
  }, [watch, watched]);
  // "Saved …" stays on the tray for a moment
  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(() => setSaved(null), 3200);
    return () => window.clearTimeout(id);
  }, [saved]);

  const { caption, captionKey, captionTone } = trayCaption({ clean, busy, failed, hotPart, saved, level, limit, used });
  // What a screen reader hears: results and warnings – not the caption, which also follows the pointer
  const busyLabel = busy ? list.find((p) => p.id === busy)?.label : null;
  const announcement = busy
    ? `Compacting ${busyLabel ?? ""}…`
    : failed
      ? `Couldn't compact ${failed.label} – try again`
      : saved
        ? `Saved ${plain(saved.amount)} tokens`
        : notice
          ? notice.text
          : level === "full"
            ? "Context window is full"
            : level === "warn"
              ? "Context window is almost full"
              : "";

  /** Size of each part right after it was compacted; the button comes back once the part has grown again */
  const [compacted, setCompacted] = useState<Record<string, number>>({});
  const isCompacted = (p: { id: string; tokens: number }) => compacted[p.id] !== undefined && p.tokens <= compacted[p.id];

  // After compacting, the button says "Compacted" for a moment, then folds away
  const [farewell, setFarewell] = useState<{ id: string; leaving: boolean } | null>(null);
  useEffect(() => {
    if (!farewell) return;
    const timer = window.setTimeout(() => setFarewell(farewell.leaving ? null : { ...farewell, leaving: true }), farewell.leaving ? 420 : 1500);
    return () => window.clearTimeout(timer);
  }, [farewell]);

  return (
    <div
      role="group"
      aria-labelledby={`${uid}-title`}
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={look ?? DEFAULT_LOOK}
      data-level={level}
      onPointerLeave={(e) => {
        rest.onPointerLeave?.(e);
        setHot(null);
      }}
    >
      <style href="ui-context-window" precedence="default">
        {css}
      </style>

      <div className="ui-cw__card">
        <div className="ui-cw__head">
          <span id={`${uid}-title`} className="ui-cw__title">
            {title}
          </span>
          {model && (
            <span className="ui-cw__model">
              {modelIcon && <span className="ui-cw__model-icon">{modelIcon}</span>}
              <span>{model}</span>
            </span>
          )}
        </div>

        <div className="ui-cw__figure">
          <span className="ui-cw__big" aria-hidden="true" ref={roll("#figure")}>
            {tokens(target["#figure"])}
          </span>
          <span className="ui-cw__of" aria-hidden="true">
            <Swap id={hotPart ? hotPart.id : "total"}>{hotPart ? hotPart.label : `of ${plain(limit)} tokens`}</Swap>
          </span>
          <span className="ui-cw__pill" aria-hidden="true" ref={roll("#used")}>
            {percent(used)}
          </span>
          <span className="ui-cw__sr">
            {tokens(used)} of {tokens(limit)} tokens used,{" "}
            {Math.round(share * 100)} percent
          </span>
        </div>

        {/* The window as a field of cells – decorative, everything it shows is in the list */}
        <CellField owner={owner} list={list} hot={hot} busy={busy} columns={columns} onHot={setHot} />

        <ul className="ui-cw__parts">
          {list.map((p) => (
            <PartRow
              key={p.id}
              part={p}
              clean={clean}
              uid={uid}
              open={opened === p.id}
              hot={hot}
              leaving={leaving}
              roll={roll}
              compactButton={
                p.compact && !p.locked && (!isCompacted(p) || farewell?.id === p.id) ? (
                  <CompactButton
                    part={p}
                    clean={clean}
                    busy={busy}
                    done={isCompacted(p)}
                    leaving={farewell?.id === p.id && farewell.leaving}
                    onCompact={compact}
                    onHot={setHot}
                  />
                ) : null
              }
              onToggle={() => setOpened(opened === p.id ? null : p.id)}
              onHot={setHot}
              onRemove={remove}
            />
          ))}
        </ul>
      </div>

      <div className="ui-cw__foot">
        <span className="ui-cw__sr" role="status">
          {announcement}
        </span>
        <span className="ui-cw__caption">
          <Swap id={captionKey} tone={captionTone}>
            {caption}
          </Swap>
        </span>
        {action && (
          <button
            type="button"
            className="ui-cw__action"
            onClick={action.onClick}
          >
            {action.label}
            <ArrowIcon clean={clean} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/** Connected, not inside something inert or hidden, not disabled */
const focusable = (el: Element | null | undefined): boolean =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Moves focus to the first usable target, but only if focus is inside `from` now (call it before removing, disabling
 * or inerting `from`). Targets may be elements, selectors (looked up inside `within`, default document) or functions.
 */
function rescueFocus(
  from: Element | null | undefined,
  targets: Array<Element | string | null | undefined | (() => Element | null | undefined)>,
  within: ParentNode = document,
) {
  const active = document.activeElement;
  if (!from || !active || !from.contains(active)) return false;
  for (const t of targets) {
    const el = typeof t === "function" ? t() : typeof t === "string" ? within.querySelector(t) : t;
    if (el !== active && focusable(el)) {
      (el as HTMLElement).focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}

type Options = {
  /** Where focus goes when the control it was on is gone – gets that control's `data-focus-key` (if it had one) */
  fallback?: (key: string | null) => Element | null | undefined;
};

/**
 * Safety net for a component's root: when the focused element inside it is removed, disabled or made inert and
 * focus fell to <body>, focus moves (before paint) to
 *   1. an element with the same `data-focus-key` (the control was re-mounted, e.g. a card moved to another list),
 *   2. `fallback(key)`, e.g. the next row or the trigger,
 *   3. the root itself (made focusable with tabindex=-1 if it isn't).
 * Prefer moving focus explicitly with rescueFocus where the right target is known; this catches the rest.
 */
function useFocusRescue(root: RefObject<HTMLElement | null>, options: Options = {}) {
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    const el = root.current;
    if (!el || typeof MutationObserver !== "function") return;
    let last: HTMLElement | null = null;
    const onFocusIn = (e: FocusEvent) => {
      last = e.target instanceof HTMLElement ? e.target : null;
    };
    const check = () => {
      const prev = last;
      if (!prev || !el.isConnected) return;
      const gone = !focusable(prev);
      const active = document.activeElement;
      const lost = !active || active === document.body || active === prev;
      if (!lost || !gone) return;
      const key = prev.getAttribute("data-focus-key");
      const same = key ? [...el.querySelectorAll(`[data-focus-key="${CSS.escape(key)}"]`)].find((c) => c !== prev && focusable(c)) : null;
      const target = [same, latest.current.fallback?.(key)].find(focusable) as HTMLElement | undefined;
      last = null;
      if (target) target.focus({ preventScroll: true });
      else {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "inert", "hidden"] });
    el.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
    };
  }, [root]);
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

/** A ref callback that fills `own` and the caller's ref (object or callback, incl. React 19 cleanups) */
function useRootRef<T>(own: { current: T | null }, ref: Ref<T> | undefined) {
  return useCallback(
    (el: T | null) => {
      own.current = el;
      const cleanup = typeof ref === "function" ? ref(el) : (ref && (ref.current = el), undefined);
      return () => {
        own.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [own, ref],
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-cw:where([data-look="standard"]),
.ui-cw__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
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
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-mono: ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-3xl: 24px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xs: 11px;
  --_tc-font-size-xs-plus: 11.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-display: 32px;
  --_tc-line-height-display-sm: 28px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-badge: 999px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.28));
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-cw:where([data-look="clean"]),
.ui-cw__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
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
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-mono: ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-3xl: 24px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xs: 11px;
  --_tc-font-size-xs-plus: 11.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-display: 32px;
  --_tc-line-height-display-sm: 28px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-badge: 5px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.3));
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-cw {
  --tc-context-window-series-1: light-dark(#26262b, #e4e4e7);
  --tc-context-window-series-2: light-dark(#8d8d95, #8a8a92);
  --tc-context-window-series-3: light-dark(#c4c4ca, #55555c);
  --tc-context-window-series-4: light-dark(#2f6bff, #4f82ff);
  --tc-context-window-series-5: light-dark(#a9c4ff, #8fb1ff);
  --tc-context-window-series-6: #5f5f66;
  box-sizing: border-box;
  width: 100%;
  max-width: 360px;
  min-width: 0;
  container-type: inline-size;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-cw */
:where([data-look="clean"], [data-look="clean"] *).ui-cw {
  /* The parts: the accent blue and its lighter tints first, then indigo, green and amber */
  --tc-context-window-series-1: light-dark(rgba(0, 96, 226, 0.765), #4d8dff);
  --tc-context-window-series-2: light-dark(rgba(0, 96, 226, 0.5), rgba(77, 141, 255, 0.7));
  --tc-context-window-series-3: light-dark(rgba(0, 96, 226, 0.26), rgba(77, 141, 255, 0.46));
  --tc-context-window-series-4: light-dark(rgba(91, 91, 214, 0.8), #7b7bec);
  --tc-context-window-series-5: light-dark(rgba(26, 154, 82, 0.72), #3ec27a);
  --tc-context-window-series-6: light-dark(rgba(232, 162, 12, 0.8), #f0b43a);
  /* Shimmer bands are lighter than what they run over */
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 360px;
  min-width: 0;
  container-type: inline-size;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-cw *, .ui-cw *::before, .ui-cw *::after { box-sizing: border-box; }
:where(.ui-cw) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-cw button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-cw svg { display: block; flex: none; }
.ui-cw b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-cw ul { margin: 0; padding: 0; list-style: none; }
.ui-cw__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__card { position: relative; padding: 12px 14px 8px; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 22px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__title { overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__model { display: inline-flex; flex: none; align-items: center; gap: 5px; max-width: 62%; height: 20px; padding: 0 7px 0 6px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-family: var(--tc-font-mono, var(--_tc-font-mono)); font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__card { position: relative; padding: 14px 16px 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__title { overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__model { display: inline-flex; flex: none; align-items: center; gap: 5px; max-width: 62%; height: 20px; padding: 0 6px; border-radius: var(--tc-radius-badge, var(--_tc-radius-badge)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; }
.ui-cw__model > span:last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-cw__model-icon { display: grid; flex: none; place-items: center; width: 12px; height: 12px; }
.ui-cw__model-icon > * { width: 12px; height: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__figure { display: flex; align-items: baseline; gap: 7px; margin-top: 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__big { font-size: var(--tc-font-size-3xl, var(--_tc-font-size-3xl)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-line-height-display, var(--_tc-line-height-display)); letter-spacing: -0.02em; color: var(--tc-text-primary, var(--_tc-text-primary)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__of { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__pill { align-self: baseline; flex: none; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw[data-level="warn"] .ui-cw__pill { color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw[data-level="full"] .ui-cw__pill { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__figure { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__big { font-size: var(--tc-font-size-3xl, var(--_tc-font-size-3xl)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-display, var(--_tc-line-height-display)); letter-spacing: -0.02em; color: var(--tc-text-strong, var(--_tc-text-strong)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__of { flex: 1; min-width: 0; overflow: hidden; padding-top: 4px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
/* The share as a small tag – tinted amber, then red, as the window fills up */
:where([data-look="clean"], [data-look="clean"] *).ui-cw__pill { flex: none; height: 20px; padding: 0 6px; border-radius: var(--tc-radius-badge, var(--_tc-radius-badge)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw[data-level="warn"] .ui-cw__pill { background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw[data-level="full"] .ui-cw__pill { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* The field: one cell per slice of the window. Changes sweep through it cell by cell */
.ui-cw__field { display: grid; grid-template-columns: repeat(var(--tc-context-window-cols), minmax(0, 1fr)); gap: 2px; margin-top: 10px; }
.ui-cw__cell { position: relative; aspect-ratio: 1; background: var(--tc-context-window-color); transition: background-color var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); transition-delay: calc(var(--i) * 2ms), 0ms, 0ms; }
/* Standard cells are rounded squares (a quarter of their size), Clean cells sharp */
:where([data-look="standard"], [data-look="standard"] *).ui-cw__cell { border-radius: 26%; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__cell { border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); }
.ui-cw__cell[data-free] { background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__field[data-hot] .ui-cw__cell:not([data-on], [data-free]) { opacity: 0.22; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__cell[data-on] { transform: scale(1.12); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__cell[data-busy] { animation: ui-cw-wave var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) var(--tc-ease-in-out, var(--_tc-ease-in-out)) infinite; animation-delay: calc(var(--i) * 15ms); }
/* ----- Parts ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cw__parts { margin-top: 8px !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__part { margin: 0 -8px; padding: 0 8px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__part[data-hot] { background: var(--tc-fill-default, var(--_tc-fill-default)); }
/* While another part is lit, the rest step back: their swatch fades and the text turns muted – still readable */
.ui-cw__part[data-dim] .ui-cw__swatch { opacity: 0.35; }
.ui-cw__part[data-dim] :is(.ui-cw__label, .ui-cw__value) { color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-cw__swatch { transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__row { display: flex; align-items: center; gap: 8px; min-height: 30px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__main { position: relative; display: flex; flex: 1; align-items: center; gap: 9px; min-width: 0; height: 30px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); }
/* A part's button stretches over its whole row; Compact sits above it */
.ui-cw__toggle::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
.ui-cw__main > .ui-cw__toggle { border-radius: inherit; }
.ui-cw .ui-cw__toggle:focus-visible { outline: none; }
.ui-cw__main:has(> .ui-cw__toggle:focus-visible) { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-cw__compact { position: relative; z-index: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__swatch { flex: none; width: 7px; height: 7px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__label { display: flex; flex: 1; align-items: center; gap: 3px; min-width: 0; overflow: hidden; color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__value { flex: none; min-width: 52px; text-align: right; color: var(--tc-text-primary, var(--_tc-text-primary)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__open { display: grid; flex: none; place-items: center; width: 16px; height: 16px; color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-cw__chevron { transition: transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__field[data-hot] .ui-cw__cell:not([data-on], [data-free]) { opacity: 0.25; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__cell[data-on] { transform: scale(1.1); }
/* Compacting: a lighter wave washes through the part's cells */
:where([data-look="clean"], [data-look="clean"] *).ui-cw__cell::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: var(--tc-shimmer, var(--_tc-shimmer)); opacity: 0; pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__cell[data-busy] { animation: ui-cw-wave-clean var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) var(--tc-ease-in-out, var(--_tc-ease-in-out)) infinite; animation-delay: calc(var(--i) * 15ms); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__cell[data-busy]::after { animation: ui-cw-shine var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) var(--tc-ease-in-out, var(--_tc-ease-in-out)) infinite; animation-delay: calc(var(--i) * 15ms); }
/* ----- Parts ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-cw__parts { margin-top: 10px !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__part { margin: 0 -8px; padding: 0 8px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); transition: background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__part[data-hot] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__row { display: flex; align-items: center; gap: 8px; min-height: 32px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__main { position: relative; display: flex; flex: 1; align-items: center; gap: 10px; min-width: 0; height: 32px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__label { display: flex; flex: 1; align-items: center; gap: 2px; min-width: 0; overflow: hidden; color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__value { flex: none; min-width: 52px; text-align: right; color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__part[data-hot] .ui-cw__value { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__open { display: grid; flex: none; place-items: center; width: 16px; height: 16px; color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
.ui-cw__open[data-open] .ui-cw__chevron { transform: rotate(180deg); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__compact { display: inline-flex; align-items: center; gap: 5px; height: 24px; margin-right: -10px; padding: 0 6px 0 5px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__compact:hover:not([aria-disabled="true"]) { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__compact { display: inline-flex; align-items: center; gap: 4px; height: 24px; margin-right: -8px; padding: 0 8px 0 6px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__compact:hover:not([aria-disabled="true"]) { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-cw__compact[aria-disabled="true"] { cursor: default; opacity: 0.5; }
.ui-cw__compact[data-busy] { opacity: 1; color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__compact[data-done] { opacity: 1; color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
.ui-cw__compact[data-leaving] { animation: ui-cw-leave var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__compact[data-done] { opacity: 1; background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
.ui-cw__compact-icon { display: grid; place-items: center; width: 12px; height: 12px; animation: ui-cw-swap-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-cw__compact-text { animation: ui-cw-swap-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__spinner { width: 12px; height: 12px; border: 1.5px solid var(--tc-border-default, var(--_tc-border-default)); border-top-color: var(--tc-text-primary, var(--_tc-text-primary)); border-radius: var(--tc-radius-full, var(--_tc-radius-full)); animation: ui-cw-spin var(--tc-duration-reveal, var(--_tc-duration-reveal)) linear infinite; }
/* Items of a part unfold in place; a removed one folds away before it goes */
.ui-cw__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-cw__fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-instant, var(--_tc-duration-instant)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__spinner { width: 11px; height: 11px; border: 1.25px solid var(--tc-fill-default, var(--_tc-fill-default)); border-top-color: var(--tc-accent, var(--_tc-accent)); border-radius: var(--tc-radius-full, var(--_tc-radius-full)); animation: ui-cw-spin var(--tc-duration-reveal, var(--_tc-duration-reveal)) linear infinite; }
.ui-cw__fold--item { transition-duration: var(--tc-duration-moderate, var(--_tc-duration-moderate)), var(--tc-duration-base, var(--_tc-duration-base)); }
.ui-cw__clip { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__items { padding: 0 0 8px 17px !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__item { display: flex; align-items: center; gap: 8px; height: 28px; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__item-label { flex: 1; min-width: 0; overflow: hidden; font-family: var(--tc-font-mono, var(--_tc-font-mono)); font-size: var(--tc-font-size-xs-plus, var(--_tc-font-size-xs-plus)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__items { padding: 0 0 6px 18px !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__item { display: flex; align-items: center; gap: 8px; height: 28px; margin-right: -4px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__item-label { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; text-overflow: ellipsis; }
.ui-cw__item-value { flex: none; color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__remove { display: grid; flex: none; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__remove { display: grid; flex: none; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-cw__remove:hover { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__empty { height: 28px; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); line-height: var(--tc-line-height-display-sm, var(--_tc-line-height-display-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- Tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cw__foot { display: flex; align-items: center; gap: 8px; min-height: 38px; padding: 4px 4px 0 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__empty { height: 28px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-display-sm, var(--_tc-line-height-display-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- The last row ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-cw__foot { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 8px 0 16px; border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-cw__swap { display: grid; min-width: 0; }
.ui-cw__swap-item { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; animation: ui-cw-swap-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-cw__swap-item[data-out] { animation: ui-cw-swap-out var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-cw__swap-item[data-tone="ok"] { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
.ui-cw__swap-item[data-tone="ok"] b { color: inherit; }
.ui-cw__swap-item[data-tone="error"], .ui-cw__swap-item[data-tone="error"] b { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* The tray's action: the library's ghost button */
:where([data-look="standard"], [data-look="standard"] *).ui-cw__action { display: inline-flex; flex: none; align-items: center; gap: 4px; height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); padding: 0 6px 0 8px; border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); white-space: nowrap; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__action:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-cw__action svg { transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-cw__action:hover svg { transform: translateX(2px); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__swap-item[data-tone="warn"] { color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__swap-item[data-tone="full"] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* The secondary button, as Button draws it */
:where([data-look="clean"], [data-look="clean"] *).ui-cw__action { display: inline-flex; flex: none; align-items: center; gap: 6px; height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 8px 0 var(--tc-control-px-md, var(--_tc-control-px-md)); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); white-space: nowrap; transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__action:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__action svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__action:hover svg { color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Shimmer over the working caption – a lighter band runs through the gray text */
:where([data-look="clean"], [data-look="clean"] *).ui-cw__shimmer { position: relative; display: inline-block; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__shimmer::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, var(--tc-shimmer, var(--_tc-shimmer)) 50%, transparent 62%) 100% 0 / 300% 100% no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ui-cw-sweep var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear infinite;
  pointer-events: none;
}
@keyframes ui-cw-leave { to { opacity: 0; filter: blur(3px); transform: scale(0.92); } }
@keyframes ui-cw-swap-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-cw-swap-out { from { opacity: 1; } to { opacity: 0; filter: blur(2px); } }
@keyframes ui-cw-wave { 0%, 100% { opacity: 1; transform: none; } 50% { opacity: 0.28; transform: scale(0.72); } }
@keyframes ui-cw-wave-clean { 0%, 100% { transform: none; } 50% { transform: scale(0.82); } }
@keyframes ui-cw-shine { 0%, 100% { opacity: 0; } 50% { opacity: 0.75; } }
@keyframes ui-cw-spin { to { transform: rotate(360deg); } }
/* Narrow cards: fewer cells per row so they stay readable, the model tag gives way and Compact keeps only its icon */
@container (max-width: 310px) {
:where([data-look="standard"], [data-look="standard"] *).ui-cw__model { max-width: 42%; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__field { grid-template-columns: repeat(var(--tc-context-window-cols-narrow), minmax(0, 1fr)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__compact { padding: 0 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__compact-text { display: none; }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-cw__row { min-height: 38px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__main { height: 38px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__compact { height: 30px; padding: 0 9px 0 7px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__item { height: 34px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__remove { width: 30px; height: 30px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cw__action { height: 30px; }
}
@keyframes ui-cw-sweep { from { background-position: 100% 0; } to { background-position: 0% 0; } }
/* Narrow cards: fewer cells per row so they stay readable, the model tag gives way and Compact keeps only its icon */
@container (max-width: 310px) {
:where([data-look="clean"], [data-look="clean"] *).ui-cw__card { padding: 12px 14px 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__foot { padding: 0 8px 0 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__model { max-width: 42%; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__field { grid-template-columns: repeat(var(--tc-context-window-cols-narrow), minmax(0, 1fr)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__compact { padding: 0 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__compact-text { display: none; }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-cw__row { min-height: 38px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__main { height: 38px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__compact { height: 30px; padding: 0 9px 0 7px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__item { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__remove { width: 30px; height: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__foot { height: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cw__action { height: 34px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-cw *, .ui-cw *::before, .ui-cw *::after { animation: none !important; transition: none !important; }
}
`;

"use client";

/*
 * Memory Panel – what an AI assistant remembers about someone, and a calm place to change it, in one self-contained file.
 * Memories are short facts grouped by category, each with where it came from.
 *   · a master switch turns memory off: the list dims and a short note unfolds under the head
 *   · category chips (and a small search) filter the list – rows fold away instead of jumping
 *   · hover a memory for its actions: edit the text in place, pause it (it stays, but isn't used) or forget it
 *   · a forgotten memory folds away and the gray tray offers Undo for a few seconds
 *   · "New memory" at the bottom unfolds into an inline editor with a category picker
 *   · the tray line counts memories and paused ones with rolling numbers and says what you are pointing at
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: memory-panel.tsx is Standard,
 * memory-panel-clean.tsx is Clean). Clean drops the tray: one white card with hairline shadows whose last row holds
 * the counts and Undo; head, filters, list and New memory are rows of that card, with quiet gray type, thin 16px
 * icons, states as soft tinted fills, and chip rows that fade at the edge only while more chips hide past it.
 */
// Generated from src/components/memory-panel.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-mp";

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

type MemoryPanelOwnProps = {
  /**
   * The memories (controlled): the panel shows exactly these and asks for changes through onChange. Leave it
   * undefined to let the panel keep the list, starting at `defaultMemories`
   */
  memories?: Memory[];
  /** The memories to start with when uncontrolled */
  defaultMemories?: Memory[];
  /** Called with the full list after any change – in both modes (passing it no longer decides who holds the list) */
  onChange?: (memories: Memory[]) => void;
  /**
   * Granular callbacks – handy to call your API. They fire in both modes. Each may return a promise: the row shows
   * as pending until it settles, and a rejection undoes that change (onChange reports the list without it) and
   * says so on the tray
   */
  onAdd?: (memory: Memory) => void | Promise<unknown>;
  onEdit?: (id: string, text: string) => void | Promise<unknown>;
  onPause?: (id: string, paused: boolean) => void | Promise<unknown>;
  onForget?: (id: string) => void | Promise<unknown>;
  /** Called when a forgotten memory is brought back with Undo */
  onRestore?: (memory: Memory) => void | Promise<unknown>;
  /** The master switch – controlled when defined */
  enabled?: boolean;
  defaultEnabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  /** Order of the groups and the choices for new memories – defaults to the categories in the order they appear */
  categories?: string[];
  title?: string;
  /** Height of the list before it scrolls, in px */
  maxHeight?: number;
  /**
   * How long Undo stays on the tray (Clean: in the card's last row), in ms. It waits while the pointer or focus is on
   * the tray and starts over after; `Infinity` keeps it until the next forget (WCAG 2.2.1)
   */
  undoFor?: number;
  /** Source and date given to memories added here */
  addedSource?: string;
  /** A button on the tray, e.g. { label: "Manage", onClick } – Undo takes its place for a moment */
  action?: { label: string; onClick: () => void };
  /** Visual style. Defaults to the file's look: Standard in memory-panel.tsx, Clean in memory-panel-clean.tsx */
  look?: Look;
  className?: string;
};

export type MemoryPanelProps = Omit<ComponentPropsWithoutRef<"div">, keyof MemoryPanelOwnProps> &
  MemoryPanelOwnProps & {
    /** The root element */
    ref?: Ref<HTMLDivElement>;
  };

/* ---------- Helpers ---------- */

const NO_MEMORIES: Memory[] = [];
const isPromise = (value: unknown): value is Promise<unknown> =>
  !!value && typeof (value as Promise<unknown>).then === "function";

/** A change handler for state whose changes another callback already reports (keeps useControllable from warning) */
const reportedElsewhere = () => {};

const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const today = () =>
  new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
const newId = () => `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
/** Textareas grow with their text */
const grow = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

/** True while a sideways-scrolling row has more content hidden past its right edge */
function useMore(ref: RefObject<HTMLElement | null>) {
  const [more, setMore] = useState(false);
  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    const check = () => setMore(row.scrollLeft + row.clientWidth < row.scrollWidth - 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(row);
    const mo = new MutationObserver(check);
    mo.observe(row, { childList: true, subtree: true, characterData: true });
    row.addEventListener("scroll", check, { passive: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
      row.removeEventListener("scroll", check);
    };
  }, [ref]);
  return more;
}

/**
 * Text that changes without a jump: the old line stays for a moment and fades out underneath while the new one fades in.
 * Quick changes just retarget – nothing piles up.
 */
function Swap({ id, children }: { id: string; children: ReactNode }) {
  type Line = { id: string; node: ReactNode };
  const last = useRef<Line>({ id, node: children });
  const [shownId, setShownId] = useState(id);
  const [out, setOut] = useState<Line | null>(null);
  if (shownId !== id) {
    // A new line: what was on screen until now becomes the one that fades out
    setShownId(id);
    setOut(last.current);
  }
  // What's on screen, recorded after commit – a render that's thrown away never becomes the line that fades out
  useLayoutEffect(() => {
    last.current = { id, node: children };
  });
  useEffect(() => {
    if (!out) return;
    const timer = window.setTimeout(() => setOut(null), 260);
    return () => window.clearTimeout(timer);
  }, [out]);
  return (
    <span className="ui-mp__swap">
      {out && (
        <span key={`out-${out.id}`} className="ui-mp__swap-item" data-out="" aria-hidden="true">
          {out.node}
        </span>
      )}
      <span key={id} className="ui-mp__swap-item">
        {children}
      </span>
    </span>
  );
}

/**
 * Numbers that roll to their new values, like useRolling – but the frames don't re-render. React renders `shown`,
 * which only changes when a roll starts (the values it starts from) and when it ends (the targets); every frame in
 * between writes the rounded value into each `[data-roll="<name>"]` text under `root` (not into lines fading out).
 */
function useRollingText(root: RefObject<HTMLElement | null>, target: Record<string, number>, duration: number) {
  const [shown, setShown] = useState(target);
  const current = useRef(target);
  const paint = () => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>("[data-roll]").forEach((n) => {
      const value = current.current[n.dataset.roll!];
      const text = n.firstChild;
      if (value === undefined || !text || text.nodeType !== Node.TEXT_NODE || n.closest("[data-out]")) return;
      const next = String(Math.round(value));
      if (text.nodeValue !== next) text.nodeValue = next;
    });
  };
  // A commit in the middle of a roll renders `shown` – put the frame's values back before paint
  useLayoutEffect(paint);
  const signature = JSON.stringify(target);
  useEffect(() => {
    const to = JSON.parse(signature) as Record<string, number>;
    const from = { ...current.current };
    if (reducedMotion() || Object.keys(to).every((k) => from[k] === to[k])) {
      current.current = to;
      setShown(to);
      return;
    }
    setShown(from);
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutQuart(t);
      const next: Record<string, number> = {};
      for (const k in to) next[k] = (from[k] ?? to[k]) + (to[k] - (from[k] ?? to[k])) * e;
      current.current = next;
      if (t < 1) {
        paint();
        frame = requestAnimationFrame(step);
      } else setShown(to);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `target` is read through its signature; paint reads refs
  }, [signature, duration]);
  return shown;
}

/* ---------- Icons ---------- */

/* Standard: 14px outline icons */
const line = {
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;
const Icon = ({ children, size = 14 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    {children}
  </svg>
);
const StdEditIcon = () => (
  <Icon>
    <path d="M8.6 3.1 10.9 5.4M2.8 11.2l.5-2.6 6-6a1.2 1.2 0 0 1 1.7 0l.6.6a1.2 1.2 0 0 1 0 1.7l-6 6-2.8.3Z" {...line} />
  </Icon>
);
const StdPauseIcon = () => (
  <Icon>
    <path d="M5.3 3.8v6.4M8.7 3.8v6.4" {...line} strokeWidth={1.6} />
  </Icon>
);
const StdPlayIcon = () => (
  <Icon>
    <path d="M4.8 3.6v6.8a.4.4 0 0 0 .6.3l5.2-3.4a.4.4 0 0 0 0-.6L5.4 3.3a.4.4 0 0 0-.6.3Z" {...line} />
  </Icon>
);
const StdForgetIcon = () => (
  <Icon>
    <path d="M2.8 4.2h8.4M5.6 4.2V3a.8.8 0 0 1 .8-.8h1.2a.8.8 0 0 1 .8.8v1.2M3.9 4.2l.5 6.6a1 1 0 0 0 1 .9h3.2a1 1 0 0 0 1-.9l.5-6.6" {...line} />
  </Icon>
);
const StdUndoIcon = () => (
  <Icon size={12}>
    <path d="M4.6 2.8 2.4 5l2.2 2.2M2.6 5h5.6a3.2 3.2 0 0 1 0 6.4H6" {...line} />
  </Icon>
);
const StdPlusIcon = () => (
  <Icon>
    <path d="M7 3v8M3 7h8" {...line} />
  </Icon>
);
const StdSearchIcon = () => (
  <Icon>
    <circle cx="6.2" cy="6.2" r="3.6" {...line} />
    <path d="m8.9 8.9 2.4 2.4" {...line} />
  </Icon>
);
const StdCloseIcon = () => (
  <Icon size={12}>
    <path d="m4 4 6 6m0-6-6 6" {...line} />
  </Icon>
);
const StdInfoIcon = () => (
  <Icon>
    <circle cx="7" cy="7" r="5.2" {...line} />
    <path d="M7 6.4v3M7 4.6v.01" {...line} strokeWidth={1.6} />
  </Icon>
);
const StdArrowIcon = () => (
  <Icon size={12}>
    <path d="M2.5 7h8M7.5 4l3 3-3 3" {...line} />
  </Icon>
);

/* Clean: 16px, thin 1.1px lines with round caps – or solid shapes */
const Glyph = ({ d, solid }: { d: string; solid?: boolean }) => (
  <svg viewBox="0 0 16 16" className="ui-mp__glyph" data-solid={solid || undefined} aria-hidden="true">
    <path d={d} fillRule="evenodd" />
  </svg>
);
const CleanEditIcon = () => <Glyph d="M9.8 3.7l2.5 2.5M3 13l.6-3 6.9-6.9a1.4 1.4 0 0 1 2 0l.4.4a1.4 1.4 0 0 1 0 2L6 12.4 3 13Z" />;
const CleanPauseIcon = () => <Glyph solid d="M4.5 3.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-9Zm4 0a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-9Z" />;
const CleanPlayIcon = () => <Glyph solid d="M4.5 3.4v9.2a.9.9 0 0 0 1.37.77l7.4-4.6a.9.9 0 0 0 0-1.54l-7.4-4.6a.9.9 0 0 0-1.37.77Z" />;
const CleanForgetIcon = () => <Glyph d="M2.5 4.5h11M6.5 4.5V3.2a.7.7 0 0 1 .7-.7h1.6a.7.7 0 0 1 .7.7v1.3M4 4.5l.6 8a1.1 1.1 0 0 0 1.1 1h4.6a1.1 1.1 0 0 0 1.1-1l.6-8M6.8 7.2v3.6M9.2 7.2v3.6" />;
const CleanUndoIcon = () => <Glyph d="M5.5 3.5 3 6l2.5 2.5M3.2 6h6.3a3.5 3.5 0 0 1 0 7H7" />;
const CleanPlusIcon = () => <Glyph d="M8 3.5v9M3.5 8h9" />;
const CleanSearchIcon = () => <Glyph d="M7.2 11.9a4.7 4.7 0 1 0 0-9.4 4.7 4.7 0 0 0 0 9.4ZM10.6 10.6l2.9 2.9" />;
const CleanCloseIcon = () => <Glyph d="m4.5 4.5 7 7m0-7-7 7" />;
const CleanInfoIcon = () => (
  <Glyph solid d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 5.4a.6.6 0 0 0-.6.6v3.6a.6.6 0 0 0 1.2 0V7.5a.6.6 0 0 0-.6-.6Zm0-2.3a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z" />
);
const CleanArrowIcon = () => <Glyph d="M3.5 8h9M9 4.5 12.5 8 9 11.5" />;

const ICONS = {
  standard: { EditIcon: StdEditIcon, PauseIcon: StdPauseIcon, PlayIcon: StdPlayIcon, ForgetIcon: StdForgetIcon, UndoIcon: StdUndoIcon, PlusIcon: StdPlusIcon, SearchIcon: StdSearchIcon, CloseIcon: StdCloseIcon, InfoIcon: StdInfoIcon, ArrowIcon: StdArrowIcon },
  clean: { EditIcon: CleanEditIcon, PauseIcon: CleanPauseIcon, PlayIcon: CleanPlayIcon, ForgetIcon: CleanForgetIcon, UndoIcon: CleanUndoIcon, PlusIcon: CleanPlusIcon, SearchIcon: CleanSearchIcon, CloseIcon: CleanCloseIcon, InfoIcon: CleanInfoIcon, ArrowIcon: CleanArrowIcon },
} satisfies Record<Look, Record<string, () => ReactNode>>;

type Icons = (typeof ICONS)[Look];

/** Arrow keys (and Home / End with `ends`) move through a radio group: the index of the option to go to, or -1 */
const radioStep = (e: KeyboardEvent, at: number, count: number, ends = false) => {
  if (ends && e.key === "Home") return 0;
  if (ends && e.key === "End") return count - 1;
  if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return -1;
  return (at + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + count) % count;
};

/** Focuses the element once it mounts or `when` turns true (and not again until `when` turned false) */
const focusOnce = (el: HTMLElement | null, when = true) => {
  if (el && when && document.activeElement !== el && !el.dataset.focused) {
    el.dataset.focused = "1";
    el.focus({ preventScroll: true });
  }
  if (el && !when) delete el.dataset.focused;
};

/** The head: title, the count and the master switch */
function Head({ uid, title, on, onToggle, total }: { uid: string; title: string; on: boolean; onToggle: () => void; total: number }) {
  return (
    <div className="ui-mp__head">
      <span id={`${uid}-title`} className="ui-mp__title">
        {title}
      </span>
      {/* The count rolls – useRollingText writes its frames */}
      <span className="ui-mp__count" aria-hidden="true" data-roll="total">
        {total}
      </span>
      <button type="button" role="switch" aria-checked={on} aria-controls={`${uid}-note`} className="ui-mp__switch" onClick={onToggle}>
        <span className="ui-mp__switch-label">Use memory</span>
        <span className="ui-mp__track" aria-hidden="true">
          <span className="ui-mp__knob" />
        </span>
      </button>
    </div>
  );
}

/** The filter row: category chips with counts, or a search field in their place */
function Filters({
  icons: { SearchIcon, CloseIcon },
  chips,
  counts,
  filter,
  onFilter,
  linked,
  searching,
  onSearch,
  query,
  onQuery,
  onCloseSearch,
}: {
  icons: Icons;
  chips: (string | null)[];
  counts: number[];
  filter: string | null;
  onFilter: (category: string | null) => void;
  /** The category of the memory pointed at – its chip is marked */
  linked: string | null;
  searching: boolean;
  onSearch: () => void;
  query: string;
  onQuery: (query: string) => void;
  onCloseSearch: () => void;
}) {
  const chipsRef = useRef<HTMLDivElement>(null);
  // Chip rows fade at their right edge only while more chips hide past it (Clean; Standard always fades)
  const chipsMore = useMore(chipsRef);
  // Chips move with the arrow keys like any radio group
  const onChipsKey = (e: KeyboardEvent) => {
    const next = radioStep(e, chips.indexOf(filter), chips.length, true);
    if (next < 0) return;
    e.preventDefault();
    onFilter(chips[next]);
    const buttons = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[role='radio']");
    buttons[next]?.focus();
    buttons[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };
  return (
    <div className="ui-mp__filters" data-searching={searching ? "" : undefined}>
      <div
        ref={chipsRef}
        className="ui-mp__chips"
        data-more={chipsMore ? "" : undefined}
        role="radiogroup"
        aria-label="Category"
        inert={searching}
        onKeyDown={onChipsKey}
      >
        {chips.map((c, i) => {
          const checked = filter === c;
          return (
            <button
              key={c ?? "#all"}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              className="ui-mp__chip"
              data-linked={c && linked === c ? "" : undefined}
              onClick={() => onFilter(c)}
            >
              {c ?? "All"}
              <span className="ui-mp__chip-count">{counts[i]}</span>
            </button>
          );
        })}
      </div>
      <div className="ui-mp__search" inert={!searching}>
        <SearchIcon />
        <input
          className="ui-mp__input"
          type="text"
          value={query}
          placeholder="Search memories"
          aria-label="Search memories"
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onCloseSearch();
            }
          }}
          ref={(el) => focusOnce(el, searching)}
        />
        <button type="button" className="ui-mp__icon" aria-label="Close search" onClick={onCloseSearch}>
          <CloseIcon />
        </button>
      </div>
      <button type="button" className="ui-mp__icon ui-mp__search-open" aria-label="Search memories" aria-expanded={searching} inert={searching} onClick={onSearch}>
        <SearchIcon />
      </button>
    </div>
  );
}

/** One memory: its text (or the editor), where it came from, Paused, and the actions on hover */
function MemoryItem({
  icons: { EditIcon, PauseIcon, PlayIcon, ForgetIcon },
  memory: m,
  hot,
  editing,
  draft,
  pending,
  onHot,
  onDraft,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onTogglePause,
  onForget,
}: {
  icons: Icons;
  memory: Memory;
  hot: boolean;
  editing: boolean;
  draft: string;
  pending: boolean;
  onHot: (id: string | null) => void;
  onDraft: (text: string) => void;
  onStartEdit: (m: Memory) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onTogglePause: (m: Memory) => void;
  onForget: (m: Memory) => void;
}) {
  return (
    <div
      className="ui-mp__item"
      data-memory={m.id}
      data-paused={m.paused ? "" : undefined}
      data-hot={hot ? "" : undefined}
      data-editing={editing ? "" : undefined}
      data-pending={pending ? "" : undefined}
      aria-busy={pending ? true : undefined}
      onPointerEnter={(e) => e.pointerType === "mouse" && onHot(m.id)}
      onFocus={() => onHot(m.id)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onHot(null);
      }}
    >
      {editing ? (
        <textarea
          className="ui-mp__edit"
          value={draft}
          rows={1}
          aria-label="Edit memory"
          ref={(el) => {
            grow(el);
            if (el && !el.dataset.focused) {
              el.dataset.focused = "1";
              el.focus({ preventScroll: true });
              el.setSelectionRange(el.value.length, el.value.length);
            }
          }}
          onChange={(e) => {
            onDraft(e.target.value);
            grow(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSaveEdit();
            } else if (e.key === "Escape") {
              e.stopPropagation();
              onCancelEdit();
            }
          }}
        />
      ) : (
        <p className="ui-mp__text">{m.text}</p>
      )}
      <div className="ui-mp__meta">
        <span className="ui-mp__source">
          {m.source}
          {m.source && m.date && <span className="ui-mp__dot"> · </span>}
          {m.date}
        </span>
        <span className="ui-mp__tag" data-on={m.paused ? "" : undefined} aria-hidden={!m.paused}>
          Paused
        </span>
        {editing ? (
          <span className="ui-mp__acts ui-mp__acts--edit">
            <button type="button" className="ui-mp__text-btn" onClick={onCancelEdit}>
              Cancel
            </button>
            <button type="button" className="ui-mp__text-btn ui-mp__text-btn--main" onClick={onSaveEdit}>
              Save
            </button>
          </span>
        ) : (
          <span className="ui-mp__acts">
            <button type="button" className="ui-mp__icon" data-act="edit" aria-label={`Edit “${m.text}”`} title="Edit" onClick={() => onStartEdit(m)}>
              <EditIcon />
            </button>
            <button
              type="button"
              className="ui-mp__icon"
              data-act="pause"
              aria-label={`${m.paused ? "Resume" : "Pause"} “${m.text}”`}
              title={m.paused ? "Resume" : "Pause"}
              onClick={() => onTogglePause(m)}
            >
              <span className="ui-mp__icon-swap" key={m.paused ? "play" : "pause"}>
                {m.paused ? <PlayIcon /> : <PauseIcon />}
              </span>
            </button>
            <button
              type="button"
              className="ui-mp__icon ui-mp__icon--forget"
              data-act="forget"
              aria-label={`Forget “${m.text}”`}
              title="Forget"
              onClick={() => onForget(m)}
            >
              <ForgetIcon />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

/** The memories by category: a group folds away when none of its rows are listed, a row when it's filtered out */
function Groups({
  groups,
  list,
  listed,
  visible,
  leaving,
  renderItem,
}: {
  groups: string[];
  list: Memory[];
  /** Matches the filter and isn't leaving – keeps its group open */
  listed: (m: Memory) => boolean;
  /** Listed and not just born – unfolded */
  visible: (m: Memory) => boolean;
  leaving: Record<string, true>;
  renderItem: (m: Memory) => ReactNode;
}) {
  return groups.map((g) => {
    const items = list.filter((m) => m.category === g);
    if (!items.length) return null;
    const open = items.some(listed);
    return (
      <section key={g} className="ui-mp__fold" data-open={open ? "" : undefined} inert={!open} aria-label={g}>
        <div className="ui-mp__clip">
          <h3 className="ui-mp__group">{g}</h3>
          <ul className="ui-mp__items">
            {items.map((m) => {
              const open = visible(m);
              return (
                <li key={m.id} className="ui-mp__fold ui-mp__fold--row" data-open={open ? "" : undefined} data-leaving={leaving[m.id] ? "" : undefined} inert={!open}>
                  <div className="ui-mp__clip">{renderItem(m)}</div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  });
}

/** "New memory" at the bottom: a row that unfolds into an inline editor with a category picker */
function NewMemory({
  icons: { PlusIcon },
  uid,
  adding,
  onOpen,
  onClose,
  text,
  onText,
  categories,
  category,
  onCategory,
  onSave,
}: {
  icons: Icons;
  uid: string;
  adding: boolean;
  onOpen: () => void;
  onClose: () => void;
  text: string;
  onText: (text: string) => void;
  categories: string[];
  category: string;
  onCategory: (category: string) => void;
  onSave: () => void;
}) {
  const catsRef = useRef<HTMLDivElement>(null);
  const catsMore = useMore(catsRef);
  return (
    <div className="ui-mp__bottom">
      <div className="ui-mp__fold" data-open={adding ? undefined : ""} inert={adding}>
        <div className="ui-mp__clip">
          <button type="button" className="ui-mp__add" aria-expanded={adding} aria-controls={`${uid}-new`} onClick={onOpen}>
            <PlusIcon />
            New memory
          </button>
        </div>
      </div>
      <div id={`${uid}-new`} className="ui-mp__fold" data-open={adding ? "" : undefined} inert={!adding}>
        <div className="ui-mp__clip">
          <div className="ui-mp__new">
            <textarea
              className="ui-mp__edit ui-mp__edit--new"
              value={text}
              rows={1}
              placeholder="Something the assistant should remember…"
              aria-label="New memory"
              ref={(el) => {
                grow(el);
                if (el && adding && !el.dataset.focused) {
                  el.dataset.focused = "1";
                  el.focus({ preventScroll: true });
                }
                if (el && !adding) delete el.dataset.focused;
              }}
              onChange={(e) => {
                onText(e.target.value);
                grow(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  onSave();
                } else if (e.key === "Escape") {
                  e.stopPropagation();
                  onClose();
                }
              }}
            />
            <div className="ui-mp__new-row">
              <div
                ref={catsRef}
                className="ui-mp__cats"
                data-more={catsMore ? "" : undefined}
                role="radiogroup"
                aria-label="Category of the new memory"
                onKeyDown={(e) => {
                  const next = radioStep(e, categories.indexOf(category), categories.length);
                  if (next < 0) return;
                  e.preventDefault();
                  onCategory(categories[next]);
                  (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[role='radio']")[next]?.focus();
                }}
              >
                {categories.map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={category === g}
                    tabIndex={category === g ? 0 : -1}
                    className="ui-mp__cat"
                    onClick={() => onCategory(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <span className="ui-mp__acts ui-mp__acts--edit">
                <button type="button" className="ui-mp__text-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="ui-mp__text-btn ui-mp__text-btn--main" disabled={!text.trim()} onClick={onSave}>
                  Save
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** What the tray says, by priority: a failure, Undo after forgetting, editing hints, the memory pointed at, the counts */
function trayLine({
  failed,
  forgot,
  editing,
  adding,
  hotMemory,
  on,
  total,
  paused,
}: {
  failed: { text: string; key: number } | null;
  forgot: { memory: Memory; key: number } | null;
  editing: boolean;
  adding: boolean;
  hotMemory: Memory | null;
  on: boolean;
  /** The counts as rendered (useRollingText rolls them in the DOM) */
  total: number;
  paused: number;
}): { caption: ReactNode; key: string } {
  if (failed) return { caption: failed.text, key: `failed-${failed.key}` };
  if (forgot)
    return {
      caption: (
        <span className="ui-mp__forgot">
          <span className="ui-mp__flat">Forgot “</span>
          <b className="ui-mp__quote">{forgot.memory.text}</b>
          <span className="ui-mp__flat">”</span>
        </span>
      ),
      key: `forgot-${forgot.key}`,
    };
  if (editing) return { caption: "Enter to save · Esc to cancel", key: "editing" };
  if (adding) return { caption: "Pick a category · Enter to save", key: "adding" };
  if (hotMemory)
    return {
      caption: (
        <>
          <b>{hotMemory.category}</b> · {!on ? "memory is off" : hotMemory.paused ? "paused, not used in answers" : "used in answers"}
        </>
      ),
      key: `hot-${hotMemory.id}-${hotMemory.paused ? 1 : 0}-${on ? 1 : 0}`,
    };
  if (!on) return { caption: "Memory is off", key: "off" };
  return {
    caption: (
      <>
        <b data-roll="total">{total}</b> {total === 1 ? "memory" : "memories"}
        {paused > 0 && (
          <>
            {" "}
            · <span data-roll="paused">{paused}</span> paused
          </>
        )}
      </>
    ),
    key: "rest",
  };
}

/**
 * Async granular callbacks: a row waits while its call runs (`saving`), and a failed call is rolled back and
 * reported on the tray for `undoFor` ms (`failed`)
 */
function usePending(undoFor: number) {
  const [saving, setSaving] = useState<Record<string, number>>({});
  const [failed, setFailed] = useState<{ text: string; key: number } | null>(null);
  const failures = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!failed) return;
    const timer = window.setTimeout(() => setFailed(null), undoFor);
    return () => window.clearTimeout(timer);
  }, [failed, undoFor]);
  const track = (id: string, result: unknown, rollback: () => void, what: string) => {
    if (!isPromise(result)) return;
    const bump = (by: number) => setSaving(({ [id]: count = 0, ...others }) => (count + by > 0 ? { ...others, [id]: count + by } : others));
    bump(1);
    result.then(
      () => alive.current && bump(-1),
      () => {
        if (!alive.current) return;
        bump(-1);
        rollback();
        setFailed({ text: `Couldn't ${what}. Try again.`, key: ++failures.current });
      },
    );
  };
  return { saving, failed, track, alive };
}

/**
 * Rows that just arrived render closed once and unfold on the next frame; `reveal` then scrolls the list to the
 * one it names
 */
function useBorn(listRef: RefObject<HTMLElement | null>) {
  const [born, setBorn] = useState<Record<string, true>>({});
  const reveal = useRef<string | null>(null);
  useEffect(() => {
    if (!Object.keys(born).length) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setBorn({}));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [born]);
  useEffect(() => {
    if (Object.keys(born).length || !reveal.current) return;
    const id = reveal.current;
    reveal.current = null;
    const timer = window.setTimeout(() => {
      const box = listRef.current;
      const row = box?.querySelector<HTMLElement>(`[data-memory="${CSS.escape(id)}"]`);
      if (!box || !row) return;
      const top = row.offsetTop - box.offsetTop;
      if (top < box.scrollTop || top + row.offsetHeight > box.scrollTop + box.clientHeight)
        box.scrollTo({ top: top - 8, behavior: reducedMotion() ? "auto" : "smooth" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [born, listRef]);
  return { born, setBorn, reveal };
}

export function MemoryPanel({
  memories: memoriesProp,
  defaultMemories = NO_MEMORIES,
  onChange,
  onAdd,
  onEdit,
  onPause,
  onForget,
  onRestore,
  enabled,
  defaultEnabled = true,
  onEnabledChange,
  categories,
  title = "Memory",
  maxHeight = 360,
  undoFor = 5000,
  addedSource = "You added",
  action,
  look,
  className,
  ref,
  style,
  ...rest
}: MemoryPanelProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const icons = ICONS[resolvedLook];
  const { UndoIcon, InfoIcon, ArrowIcon } = icons;
  const uid = useId();
  // The root is ours (focus restoring, the rolling counts) and the consumer's
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  const listRef = useRef<HTMLDivElement>(null);

  // `memories` defined → the parent holds the list; undefined → the panel keeps it. Changes are always reported
  // Granular callbacks alone can keep a controlled list up to date, so they count as its change handler too
  const granular = onAdd || onEdit || onPause || onForget || onRestore;
  const [list, setList] = useControllable(memoriesProp, defaultMemories, onChange ?? (granular ? reportedElsewhere : undefined));
  const latest = useRef(list);
  latest.current = list;
  const commit = (next: Memory[]) => {
    latest.current = next;
    setList(next);
  };

  const [on, setOn] = useControllable(enabled, defaultEnabled, onEnabledChange);
  const { saving, failed, track, alive } = usePending(undoFor);
  // Keys for the Undo button and the tray line, so each forget replays their entrance
  const forgets = useRef(0);

  /** Rows folding away before they go, and rows that just arrived and unfold on the next frame */
  const [leaving, setLeaving] = useState<Record<string, true>>({});
  const { born, setBorn, reveal } = useBorn(listRef);
  const [filter, setFilter] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [hot, setHot] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newCat, setNewCat] = useState<string | null>(null);
  const [forgot, setForgot] = useState<{ memory: Memory; index: number; key: number } | null>(null);

  // Undo stays on the tray for a few seconds – the clock stops while the pointer or focus is on the tray, and the
  // full time starts again once they leave
  const [holdUndo, setHoldUndo] = useState({ hover: false, focus: false });
  const held = holdUndo.hover || holdUndo.focus;
  useEffect(() => {
    if (!forgot || held || !Number.isFinite(undoFor)) return;
    const timer = window.setTimeout(() => setForgot(null), undoFor);
    return () => window.clearTimeout(timer);
  }, [forgot, undoFor, held]);

  /* ---------- Derived ---------- */

  const groups = [...(categories ?? [])];
  for (const m of list) if (!groups.includes(m.category)) groups.push(m.category);
  const present = list.filter((m) => !leaving[m.id]);
  const pausedCount = present.filter((m) => m.paused).length;
  const q = query.trim().toLowerCase();
  const shows = (m: Memory) =>
    (!filter || m.category === filter) &&
    (!q || m.text.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
  const visible = (m: Memory) => shows(m) && !leaving[m.id] && !born[m.id];
  const anyVisible = list.some((m) => shows(m) && !leaving[m.id]);
  const hotMemory = list.find((m) => m.id === hot) ?? null;

  // The counts roll in the DOM; `shown` changes only when a roll starts and ends
  const shown = useRollingText(rootRef, { total: present.length, paused: pausedCount }, 520);
  const total = Math.round(shown.total ?? present.length);
  const paused = Math.round(Math.max(shown.paused ?? 0, pausedCount));

  /* ---------- Actions ---------- */

  // Whatever takes the focused control away (a row folding, a button turning off) – focus goes to New memory
  useFocusRescue(rootRef, { fallback: () => rootRef.current?.querySelector(".ui-mp__add") });

  const forget = async (m: Memory) => {
    if (leaving[m.id]) return;
    // The row goes inert as it folds: focus moves first – to the next memory's Forget, the one before, or New memory
    const rows = [...(rootRef.current?.querySelectorAll<HTMLElement>("[data-memory]") ?? [])].filter((r) => !r.closest("[inert]"));
    const at = rows.findIndex((r) => r.dataset.memory === m.id);
    const forgetOf = (r?: HTMLElement) => r?.querySelector<HTMLElement>('[data-act="forget"]');
    rescueFocus(rows[at], [forgetOf(rows[at + 1]), forgetOf(rows[at - 1]), ".ui-mp__add"], rootRef.current ?? document);
    if (editing === m.id) setEditing(null);
    setHot(null);
    setLeaving((l) => ({ ...l, [m.id]: true }));
    if (!reducedMotion()) await wait(320);
    if (!alive.current) return;
    const index = latest.current.findIndex((x) => x.id === m.id);
    commit(latest.current.filter((x) => x.id !== m.id));
    const forgetting = onForget?.(m.id);
    setLeaving(({ [m.id]: _gone, ...others }) => others);
    const key = ++forgets.current;
    setForgot({ memory: m, index, key });
    track(m.id, forgetting, () => {
      setForgot((f) => (f?.key === key ? null : f));
      if (latest.current.some((x) => x.id === m.id)) return;
      const next = [...latest.current];
      next.splice(Math.max(0, Math.min(index, next.length)), 0, m);
      setBorn({ [m.id]: true });
      commit(next);
    }, "forget it");
  };

  const undo = () => {
    if (!forgot) return;
    const { memory, index } = forgot;
    const next = [...latest.current];
    next.splice(Math.max(0, Math.min(index, next.length)), 0, memory);
    setBorn({ [memory.id]: true });
    reveal.current = memory.id;
    if (filter && filter !== memory.category) setFilter(null);
    commit(next);
    const restoring = onRestore?.(memory);
    setForgot(null);
    // Undo goes away – focus lands on the memory it brought back (once it has unfolded)
    window.requestAnimationFrame(() => refocus(`[data-memory="${CSS.escape(memory.id)}"] [data-act="forget"]`));
    track(memory.id, restoring, () => commit(latest.current.filter((x) => x.id !== memory.id)), "bring it back");
  };

  const togglePause = (m: Memory) => {
    const paused = !m.paused;
    commit(latest.current.map((x) => (x.id === m.id ? { ...x, paused } : x)));
    track(
      m.id,
      onPause?.(m.id, paused),
      () => commit(latest.current.map((x) => (x.id === m.id && !!x.paused === paused ? { ...x, paused: !paused } : x))),
      paused ? "pause it" : "resume it",
    );
  };

  /** Back to a button after an editor closes, so the keyboard keeps its place */
  const refocus = (selector: string) =>
    window.requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true }));

  const startEdit = (m: Memory) => {
    setAdding(false);
    setDraft(m.text);
    setEditing(m.id);
  };
  const saveEdit = () => {
    const id = editing;
    const text = draft.trim().replace(/\s+/g, " ");
    setEditing(null);
    if (!id) return;
    const before = latest.current.find((x) => x.id === id);
    if (!before || !text || text === before.text) return;
    commit(latest.current.map((x) => (x.id === id ? { ...x, text } : x)));
    track(
      id,
      onEdit?.(id, text),
      () => commit(latest.current.map((x) => (x.id === id && x.text === text ? { ...x, text: before.text } : x))),
      "save the edit",
    );
    refocus(`[data-memory="${CSS.escape(id)}"] [data-act="edit"]`);
  };
  const cancelEdit = () => {
    const id = editing;
    setEditing(null);
    if (id) refocus(`[data-memory="${CSS.escape(id)}"] [data-act="edit"]`);
  };

  const addCategory = newCat ?? filter ?? groups[0] ?? "General";
  const openAdd = () => {
    setEditing(null);
    setNewText("");
    setNewCat(filter ?? groups[0] ?? "General");
    setAdding(true);
  };
  const closeAdd = () => {
    setAdding(false);
    refocus(".ui-mp__add");
  };
  const saveAdd = () => {
    const text = newText.trim().replace(/\s+/g, " ");
    if (!text) return;
    const memory: Memory = { id: newId(), text, category: addCategory, source: addedSource, date: today() };
    setBorn({ [memory.id]: true });
    reveal.current = memory.id;
    if (filter && filter !== memory.category) setFilter(null);
    if (q) setQuery("");
    commit([...latest.current, memory]);
    track(memory.id, onAdd?.(memory), () => commit(latest.current.filter((x) => x.id !== memory.id)), "save the memory");
    setNewText("");
    closeAdd();
  };

  const closeSearch = () => {
    setSearching(false);
    setQuery("");
    refocus(".ui-mp__search-open");
  };

  const chips = [null, ...groups.filter((g) => list.some((m) => m.category === g))];
  const { caption, key: captionKey } = trayLine({ failed, forgot, editing: !!editing, adding, hotMemory, on, total, paused });

  const clean = resolvedLook === "clean";
  // The tray (Standard) or the card's last row (Clean): counts, what you point at, and Undo after forgetting
  const footEl = (
    <div
      className="ui-mp__foot"
      onPointerEnter={() => setHoldUndo((h) => ({ ...h, hover: true }))}
      onPointerLeave={() => setHoldUndo((h) => ({ ...h, hover: false }))}
      onFocus={() => setHoldUndo((h) => ({ ...h, focus: true }))}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setHoldUndo((h) => ({ ...h, focus: false }))}
    >
      {/* Not live: the counts roll frame by frame – the status below says what happened, once */}
      <span className="ui-mp__caption">
        <Swap id={captionKey}>{caption}</Swap>
      </span>
      <span className="ui-mp__sr" role="status">
        {failed ? failed.text : forgot ? `Forgot “${forgot.memory.text}”. Undo is on the tray.` : ""}
      </span>
      {forgot ? (
        <button key={`undo-${forgot.key}`} type="button" className="ui-mp__action ui-mp__action--undo" onClick={undo}>
          <UndoIcon />
          Undo
        </button>
      ) : (
        action && (
          <button key="action" type="button" className="ui-mp__action" onClick={action.onClick}>
            {action.label}
            <ArrowIcon />
          </button>
        )
      )}
    </div>
  );

  return (
    <div
      role="group"
      aria-labelledby={`${uid}-title`}
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-off={on ? undefined : ""}
      style={{ ...style, ["--tc-memory-panel-max" as string]: `${maxHeight}px` }}
    >
      <style href="ui-memory-panel" precedence="default">
        {css}
      </style>

      <div className="ui-mp__card">
        <Head uid={uid} title={title} on={on} onToggle={() => setOn(!on)} total={total} />

        {/* A short note unfolds while memory is off */}
        <div id={`${uid}-note`} className="ui-mp__fold" data-open={on ? undefined : ""} inert={on}>
          <div className="ui-mp__clip">
            <p className="ui-mp__note">
              <InfoIcon />
              <span>
                The assistant won't use or save memories in new chats. Nothing here is deleted.
              </span>
            </p>
          </div>
        </div>

        <Filters
          icons={icons}
          chips={chips}
          counts={chips.map((c) => present.filter((m) => !c || m.category === c).length)}
          filter={filter}
          onFilter={setFilter}
          linked={hotMemory?.category ?? null}
          searching={searching}
          onSearch={() => {
            setFilter(null);
            setSearching(true);
          }}
          query={query}
          onQuery={setQuery}
          onCloseSearch={closeSearch}
        />

        <div ref={listRef} className="ui-mp__list" onPointerLeave={() => setHot(null)}>
          <Groups
            groups={groups}
            list={list}
            listed={(m) => shows(m) && !leaving[m.id]}
            visible={visible}
            leaving={leaving}
            renderItem={(m) => (
              <MemoryItem
                icons={icons}
                memory={m}
                hot={hot === m.id}
                editing={editing === m.id}
                draft={draft}
                pending={!!saving[m.id]}
                onHot={setHot}
                onDraft={setDraft}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onTogglePause={togglePause}
                onForget={forget}
              />
            )}
          />

          <div className="ui-mp__fold" data-open={anyVisible ? undefined : ""} inert={anyVisible}>
            <div className="ui-mp__clip">
              <p className="ui-mp__empty">
                {list.length === 0 ? "Nothing remembered yet" : q ? `No memory mentions “${query.trim()}”` : "No memories here"}
              </p>
            </div>
          </div>
        </div>

        <NewMemory
          icons={icons}
          uid={uid}
          adding={adding}
          onOpen={openAdd}
          onClose={closeAdd}
          text={newText}
          onText={setNewText}
          categories={groups.length ? groups : ["General"]}
          category={addCategory}
          onCategory={setNewCat}
          onSave={saveAdd}
        />
        {/* Clean: the last row of the card */}
        {clean && footEl}
      </div>

      {/* Standard: the gray tray under the card */}
      {!clean && footEl}
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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
.ui-mp:where([data-look="standard"]),
.ui-mp__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg-sunken: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-field-radius: 10px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-md: 13px;
  --_tc-font-size-md-plus: 13.5px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xs: 11px;
  --_tc-font-size-xs-plus: 11.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xl: 16px;
  --_tc-radius-3xl: 20px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-control: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-inverse: light-dark(#171717, #ededed);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-switch-h: 20px;
  --_tc-switch-knob: 16px;
  --_tc-switch-knob-bg: #ffffff;
  --_tc-switch-off: light-dark(#858585, #7c7c82);
  --_tc-switch-on: #2f68ff;
  --_tc-switch-radius: 999px;
  --_tc-switch-w: 32px;
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-inverse: light-dark(#ffffff, #111113);
  --_tc-text-placeholder: light-dark(#646464, #8e8e95);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
}
.ui-mp:where([data-look="clean"]),
.ui-mp__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg-sunken: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-field-radius: 8px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#0060e2, #5b9aff), 0 0 0 3px color-mix(in srgb, light-dark(#0060e2, #5b9aff) 24%, transparent);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-md: 13px;
  --_tc-font-size-md-plus: 13.5px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xs: 11px;
  --_tc-font-size-xs-plus: 11.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xl: 16px;
  --_tc-radius-3xl: 20px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-control: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-inverse: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-switch-h: 16px;
  --_tc-switch-knob: 12px;
  --_tc-switch-knob-bg: #ffffff;
  --_tc-switch-off: light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-switch-on: light-dark(#0060e2, #1a6cf0);
  --_tc-switch-radius: 5px;
  --_tc-switch-w: 28px;
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-inverse: light-dark(#fcfcfc, #161618);
  --_tc-text-placeholder: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.5));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-mp {
  /* insets and hover fills: a light grey on the card, lighter than the card in dark mode */
  --tc-memory-panel-well: light-dark(#f4f4f5, #222225);
  box-sizing: border-box;
  width: 100%;
  max-width: 380px;
  min-width: 0;
  container-type: inline-size;
  padding: 4px;
  border-radius: var(--tc-radius-3xl, var(--_tc-radius-3xl));
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-mp */
:where([data-look="clean"], [data-look="clean"] *).ui-mp {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 400px;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-mp *, .ui-mp *::before, .ui-mp *::after { box-sizing: border-box; }
:where(.ui-mp) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where(.ui-mp) :is(p, h3, ul) { margin: 0; padding: 0; list-style: none; font: inherit; }
.ui-mp button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-mp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp svg { display: block; flex: none; }
/* Text fields: the search box and the memory being edited show the field focus ring instead of an outline */
.ui-mp :is(input, textarea):focus-visible { outline: none; }
.ui-mp__search:focus-within, .ui-mp__item:has(.ui-mp__edit:focus) { box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-mp) svg { display: block; flex: none; }
.ui-mp b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__card { border-radius: var(--tc-radius-2xl, var(--_tc-radius-2xl)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)), 0 1px 2px rgba(0, 0, 0, 0.04); }
/* Everything that opens or goes does it the same quiet way: it unfolds or folds and fades, nothing travels */
.ui-mp__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-mp__fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) 80ms; }
.ui-mp__fold--row[data-leaving] { transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), filter var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); filter: blur(2px); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__glyph[data-solid] { fill: currentColor; stroke: none; }
/* One white card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__card { border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
.ui-mp__clip { min-height: 0; overflow: hidden; }
/* ----- Head ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-mp__head { display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 12px 0 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__title { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md-plus, var(--_tc-font-size-md-plus)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__count { flex: none; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 5px; background: var(--tc-memory-panel-well); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); text-align: center; color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__switch { display: inline-flex; flex: none; align-items: center; gap: 8px; height: 28px; margin-left: auto; padding: 0 2px 0 8px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__switch:hover { background: var(--tc-memory-panel-well); }
.ui-mp__track { position: relative; width: var(--tc-switch-w, var(--_tc-switch-w)); height: var(--tc-switch-h, var(--_tc-switch-h)); border-radius: var(--tc-switch-radius, var(--_tc-switch-radius)); background: var(--tc-switch-off, var(--_tc-switch-off)); transition: background-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-mp__knob { position: absolute; top: calc((var(--tc-switch-h, var(--_tc-switch-h)) - var(--tc-switch-knob, var(--_tc-switch-knob))) / 2); left: calc((var(--tc-switch-h, var(--_tc-switch-h)) - var(--tc-switch-knob, var(--_tc-switch-knob))) / 2); width: var(--tc-switch-knob, var(--_tc-switch-knob)); height: var(--tc-switch-knob, var(--_tc-switch-knob)); border-radius: calc(var(--tc-switch-radius, var(--_tc-switch-radius)) - 2px); background: var(--tc-switch-knob-bg, var(--_tc-switch-knob-bg)); box-shadow: var(--tc-shadow-control, var(--_tc-shadow-control)); transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-mp__switch[aria-checked="true"] .ui-mp__track { background: var(--tc-switch-on, var(--_tc-switch-on)); }
.ui-mp__switch[aria-checked="true"] .ui-mp__knob { transform: translateX(calc(var(--tc-switch-w, var(--_tc-switch-w)) - var(--tc-switch-h, var(--_tc-switch-h)))); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__note { display: flex; gap: 8px; margin: 0 12px 10px !important; padding: 8px 10px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-memory-panel-well); font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__note svg { margin-top: 2px; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- Filters ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-mp__filters { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px; padding: 0 10px 10px 12px; }
/* ----- Head ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__head { display: flex; align-items: center; gap: 8px; padding: 12px 10px 0 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__title { min-width: 0; overflow: hidden; font-size: 15px; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__count { flex: none; min-width: 20px; height: 18px; padding: 0 5px; border-radius: 5px; background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); text-align: center; color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__switch { display: inline-flex; flex: none; align-items: center; gap: 8px; height: 28px; margin-left: auto; padding: 0 6px 0 8px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__switch:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* The note while memory is off: a soft gray fill, no stroke */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__note { display: flex; gap: 8px; margin: 10px 12px 0 16px !important; padding: 8px 10px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)) !important; line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)) !important; color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__note .ui-mp__glyph { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
/* ----- Filters: the button-switch look ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__filters { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 12px 10px 12px 16px; border-bottom: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-mp__chips, .ui-mp__search { grid-area: 1 / 1; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), filter var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chips { display: flex; gap: 4px; min-width: 0; margin: -2px -4px; padding: 2px 4px; overflow-x: auto; scrollbar-width: none; mask-image: linear-gradient(90deg, #000 calc(100% - 14px), transparent); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chips { display: flex; gap: 4px; min-width: 0; margin: -3px; padding: 3px; overflow-x: auto; scrollbar-width: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chips[data-more],
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cats[data-more] { -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 24px), transparent); mask-image: linear-gradient(90deg, #000 calc(100% - 24px), transparent); }
.ui-mp__chips::-webkit-scrollbar { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip { display: inline-flex; flex: none; align-items: center; gap: 5px; height: 26px; padding: 0 8px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip:hover { background: var(--tc-memory-panel-well); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip { display: inline-flex; flex: none; align-items: center; gap: 6px; padding: 4px 10px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
.ui-mp__chip[data-linked] { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip[data-linked]:not([aria-checked="true"]) { background: var(--tc-memory-panel-well); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip[aria-checked="true"] { background: var(--tc-memory-panel-well); color: var(--tc-text-primary, var(--_tc-text-primary)); box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip-count { font-size: var(--tc-font-size-xs-plus, var(--_tc-font-size-xs-plus)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__search { display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 2px 0 8px; border-radius: var(--tc-field-radius, var(--_tc-field-radius)); background: var(--tc-field-bg-sunken, var(--_tc-field-bg-sunken)); box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow)); color: var(--tc-text-muted, var(--_tc-text-muted)); opacity: 0; visibility: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__input { flex: 1; min-width: 0; height: 28px; margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-primary, var(--_tc-text-primary)); outline: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__input::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip[aria-checked="true"] { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip-count { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip[aria-checked="true"] .ui-mp__chip-count { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__search { display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 2px 0 8px; border-radius: var(--tc-field-radius, var(--_tc-field-radius)); box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow)); background: var(--tc-field-bg-sunken, var(--_tc-field-bg-sunken)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); opacity: 0; visibility: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__input { flex: 1; min-width: 0; height: 28px; margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-strong, var(--_tc-text-strong)); caret-color: var(--tc-accent, var(--_tc-accent)); outline: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__input::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); opacity: 1; }
.ui-mp__search .ui-mp__icon { width: 24px; height: 24px; }
.ui-mp__filters[data-searching] .ui-mp__chips { opacity: 0; filter: blur(2px); }
.ui-mp__filters[data-searching] .ui-mp__search { grid-area: 1 / 1 / 2 / 3; opacity: 1; visibility: visible; }
.ui-mp__filters[data-searching] .ui-mp__search-open { opacity: 0; visibility: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__search-open { grid-area: 1 / 2; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* ----- List ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-mp__list { max-height: var(--tc-memory-panel-max); padding: 2px 6px 6px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--tc-fill-strong, var(--_tc-fill-strong)) transparent; border-top: 1px solid var(--tc-border-default, var(--_tc-border-default)); transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__search-open { grid-area: 1 / 2; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* ----- List ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__list { max-height: var(--tc-memory-panel-max); padding: 2px 6px 6px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--tc-fill-strong, var(--_tc-fill-strong)) transparent; transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__filters { transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__group { padding: 10px 8px 2px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)) !important; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)) !important; line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)) !important; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__item { padding: 6px 8px 5px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__item[data-hot],
:where([data-look="standard"], [data-look="standard"] *).ui-mp__item[data-editing] { background: var(--tc-memory-panel-well); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__group { padding: 12px 10px 4px; font-size: 10px !important; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)) !important; line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)) !important; letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* The hovered row gets a soft wash – short and crisp, and gone when the pointer leaves */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__item { padding: 8px 10px 7px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__item[data-hot],
:where([data-look="clean"], [data-look="clean"] *).ui-mp__item[data-editing] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
.ui-mp__text { color: var(--tc-text-primary, var(--_tc-text-primary)); overflow-wrap: anywhere; transition: color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-mp__item[data-paused] .ui-mp__text { color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* A change whose callback is still running */
.ui-mp__item[data-pending] .ui-mp__text { opacity: 0.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__meta { display: flex; align-items: center; gap: 6px; min-height: 24px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__meta { display: flex; align-items: center; gap: 6px; min-height: 20px; margin-top: 2px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-mp__source { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__tag { display: inline-flex; flex: none; align-items: center; height: 18px; padding: 0 6px; border-radius: 5px; background: var(--tc-fill-strong, var(--_tc-fill-strong)); font-size: var(--tc-font-size-xs-plus, var(--_tc-font-size-xs-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); opacity: 0; transform: scale(0.9); transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__dot { color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__tag { display: inline-flex; flex: none; align-items: center; height: 18px; padding: 0 6px; border-radius: 5px; background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); opacity: 0; transform: scale(0.9); transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-mp__tag:not([data-on]) { position: absolute; visibility: hidden; }
.ui-mp__tag[data-on] { opacity: 1; transform: none; animation: ui-mp-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__acts { display: inline-flex; flex: none; align-items: center; gap: 2px; margin: -1px -4px -1px auto; opacity: 0; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__acts { display: inline-flex; flex: none; align-items: center; gap: 2px; margin: -4px -6px -4px auto; opacity: 0; transition: opacity var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-mp__item:is([data-hot], :focus-within) .ui-mp__acts, .ui-mp__acts--edit { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__icon { display: grid; flex: none; place-items: center; width: 26px; height: 26px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__icon:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__icon--forget:hover { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__acts--edit { gap: 4px; margin-top: 4px; margin-right: -2px; margin-bottom: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__item[data-editing] { padding-bottom: 8px; }
/* Ghost icon button */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__icon { display: grid; flex: none; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__icon:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__item .ui-mp__icon:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__item .ui-mp__icon--forget:hover { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-mp__icon-swap { display: grid; animation: ui-mp-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__text-btn { display: inline-flex; align-items: center; height: 26px; padding: 0 9px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__text-btn:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__text-btn--main { background: var(--tc-text-primary, var(--_tc-text-primary)); color: var(--tc-surface-raised, var(--_tc-surface-raised)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__text-btn--main:hover { background: var(--tc-text-primary, var(--_tc-text-primary)); color: var(--tc-surface-raised, var(--_tc-surface-raised)); opacity: 0.86; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__text-btn:disabled { cursor: default; opacity: 0.35; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__edit { display: block; width: 100%; min-height: 20px; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: var(--tc-text-primary, var(--_tc-text-primary)); resize: none; overflow: hidden; outline: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__edit::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__empty { padding: 18px 8px 12px; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); text-align: center; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- New memory ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-mp__bottom { padding: 4px 6px 6px; border-top: 1px solid var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__add { display: flex; align-items: center; gap: 8px; width: 100%; height: 32px; padding: 0 8px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__add:hover { background: var(--tc-memory-panel-well); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__new { margin: 2px 0 0; padding: 8px 8px 6px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-memory-panel-well); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__new-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px; margin-top: 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__cats { display: flex; flex: 1 1 auto; flex-wrap: wrap; gap: 4px; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__cat { display: inline-flex; align-items: center; height: 24px; padding: 0 8px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__cat:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__cat[aria-checked="true"] { background: var(--tc-surface-raised, var(--_tc-surface-raised)); color: var(--tc-text-primary, var(--_tc-text-primary)); box-shadow: 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)), 0 1px 2px rgba(0, 0, 0, 0.04); }
/* ----- Tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-mp__foot { display: flex; align-items: center; gap: 8px; min-height: 38px; padding: 4px 4px 0 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* Cancel: ghost text; Save: the dark chip */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn { display: inline-flex; flex: none; align-items: center; height: 28px; padding: 0 10px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn--main,
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn--main:hover { background: var(--tc-surface-inverse, var(--_tc-surface-inverse)); color: var(--tc-text-on-inverse, var(--_tc-text-on-inverse)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn--main:hover { opacity: 0.88; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn:disabled { cursor: default; opacity: 0.3; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__edit { display: block; width: 100%; min-height: 20px; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: var(--tc-text-strong, var(--_tc-text-strong)); caret-color: var(--tc-accent, var(--_tc-accent)); resize: none; overflow: hidden; outline: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__edit::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); opacity: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__empty { padding: 20px 8px 14px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); text-align: center; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- New memory ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__bottom { padding: 6px; border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__add { display: flex; align-items: center; gap: 8px; width: 100%; height: 32px; padding: 0 10px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__add .ui-mp__glyph { color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__add:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__add:hover .ui-mp__glyph { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__new { padding: 6px 4px 2px 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__new-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cats { display: flex; flex: 1 1 auto; gap: 4px; min-width: 0; margin: -3px; padding: 3px; overflow-x: auto; scrollbar-width: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cats::-webkit-scrollbar { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cat { display: inline-flex; flex: none; align-items: center; padding: 4px 8px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cat:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cat[aria-checked="true"] { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__new .ui-mp__acts--edit { margin: 0; }
/* ----- The last row of the card ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__foot { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 8px 0 16px; border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-mp__swap { display: grid; min-width: 0; }
.ui-mp__swap-item { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; animation: ui-mp-swap-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-mp__swap-item[data-out] { animation: ui-mp-swap-out var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-mp__forgot { display: flex; min-width: 0; }
.ui-mp__flat { flex: none; white-space: pre; }
.ui-mp__quote { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__action { display: inline-flex; flex: none; align-items: center; gap: 5px; height: 26px; padding: 0 8px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; animation: ui-mp-swap-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__action:hover { background: var(--tc-surface-raised, var(--_tc-surface-raised)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__action--undo { padding: 0 9px 0 7px; background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__action:not(.ui-mp__action--undo) svg { transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__action:not(.ui-mp__action--undo):hover svg { transform: translateX(2px); }
/* The action button: ghost text with an arrow */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__action { display: inline-flex; flex: none; align-items: center; gap: 4px; height: 28px; padding: 0 6px 0 10px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; animation: ui-mp-swap-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__action .ui-mp__glyph { color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__action:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__action:not(.ui-mp__action--undo):hover .ui-mp__glyph { transform: translateX(2px); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Undo: the white button with the hairline shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-mp__action--undo { gap: 6px; padding: 0 10px 0 8px; background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); }
.ui-mp__action--undo:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
@keyframes ui-mp-in { from { opacity: 0; transform: scale(0.9); } }
@keyframes ui-mp-swap-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-mp-swap-out { from { opacity: 1; } to { opacity: 0; filter: blur(2px); } }
/* Narrow panels: chips drop their counts and the switch keeps only its track, so the filters fit */
@container (max-width: 340px) {
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip-count { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__chip { padding: 0 7px; }
}
@container (max-width: 320px) {
:where([data-look="standard"], [data-look="standard"] *).ui-mp__switch-label { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mp__switch { padding: 0 2px; }
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
:where([data-look="clean"], [data-look="clean"] *).ui-mp__head { padding-left: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__filters { padding-left: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__foot { padding-left: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__note { margin-left: 14px !important; }
}
@container (max-width: 320px) {
:where([data-look="clean"], [data-look="clean"] *).ui-mp__switch-label { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__switch { padding: 0 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip { padding: 4px 8px; }
}
/* Touch screens: actions always visible, taller targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-mp__acts { opacity: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__icon { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__acts { margin-top: -7px; margin-bottom: -7px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__acts--edit { margin-top: 4px; margin-bottom: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__chip { padding: 6px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__cat { padding: 5px 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__text-btn,
:where([data-look="clean"], [data-look="clean"] *).ui-mp__action { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__switch,
:where([data-look="clean"], [data-look="clean"] *).ui-mp__add { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__search,
:where([data-look="clean"], [data-look="clean"] *).ui-mp__input { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mp__foot { min-height: 52px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-mp *, .ui-mp *::before, .ui-mp *::after { animation: none !important; transition: none !important; }
}
`;

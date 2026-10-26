"use client";

/*
 * Filter Menu – grouped filters with chips, in a single self-contained file.
 * Active filters sit on top as removable chips; below, collapsible groups list their options as checkboxes
 * with a count of what's picked. Every group head and visible option is a plain button in the Tab order; arrow keys
 * also move through them, Enter or Space picks, ← and → fold a group. Folded options are inert. Heights glide when groups open or chips come and go.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: filter-menu.tsx is Standard,
 * filter-menu-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows, gray tab-like chips
 * kept on one line (as many as fit, "+N" for the rest), quiet rows with a subtle hover, blue checkboxes, finer icons
 * and the keyboard hints as the card's last row.
 */
// Generated from src/components/filter-menu.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-fm";

export type FilterOption = { id: string; label: string };

export type FilterGroup = {
  id: string;
  label: string;
  options: FilterOption[];
  /** Put in front of the option on its chip, e.g. "Score: " → "Score: 80–90" */
  chipPrefix?: string;
};

/** Picked option ids per group id */
export type FilterValue = Record<string, string[]>;

export type FilterMenuOwnProps = {
  groups: FilterGroup[];
  /** The picked options. Controlled when defined; otherwise the menu keeps its own, starting at `defaultValue` */
  value?: FilterValue;
  /** Starting value when uncontrolled */
  defaultValue?: FilterValue;
  onChange?: (value: FilterValue) => void;
  /** Ids of the open groups. Controlled when defined; otherwise starts at `defaultOpen` */
  open?: string[];
  /** Groups that start open – by default the first one */
  defaultOpen?: string[];
  onOpenChange?: (open: string[]) => void;
  /** Name for native form submission: one hidden input per picked option, named `name[groupId]` */
  name?: string;
  /** Nothing can be picked, removed or cleared, and the hidden inputs are left out of the form */
  disabled?: boolean;
  title?: string;
  /** Show the keyboard hints at the bottom (Clean: as the last row of the card) */
  hints?: boolean;
  /** Visual style. Defaults to the file's look: Standard in filter-menu.tsx, Clean in filter-menu-clean.tsx */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type FilterMenuProps = Omit<ComponentPropsWithoutRef<"div">, keyof FilterMenuOwnProps> & FilterMenuOwnProps;

type Row = { kind: "group"; group: FilterGroup } | { kind: "option"; group: FilterGroup; option: FilterOption };

/** Gap between chips, in px – matches the Clean CSS */
const CHIP_GAP = 4;
const NONE: FilterValue = {};

/** One group: its head (opens and closes it, counts what's picked) and its options as checkboxes */
function FilterGroupSection({
  g,
  panelId,
  isOpen,
  count,
  clean,
  disabled,
  isOn,
  onToggleGroup,
  onToggle,
}: {
  g: FilterGroup;
  panelId: string;
  isOpen: boolean;
  count: number;
  clean: boolean;
  disabled: boolean;
  isOn: (g: string, o: string) => boolean;
  onToggleGroup: (g: string) => void;
  onToggle: (g: string, o: string) => void;
}) {
  const gKey = `g:${g.id}`;
  return (
    <section className="ui-fm__group" data-open={isOpen ? "" : undefined}>
      <button
        type="button"
        className="ui-fm__group-head"
        data-key={gKey}
        data-focus-key={`head:${panelId}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onToggleGroup(g.id)}
      >
        {clean ? (
          <svg className="ui-fm__chevron" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.5 6.25 8 9.75l3.5-3.5" />
          </svg>
        ) : (
          <svg className="ui-fm__chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6.5 9.5 12 15l5.5-5.5" />
          </svg>
        )}
        <span className="ui-fm__group-label">{g.label}</span>
        <span className="ui-fm__group-count">{g.options.length}</span>
        <span className="ui-fm__group-picked">
          {clean
            ? count > 0 && (
                <span key={count} className="ui-fm__roll">
                  {`${count} filter${count === 1 ? "" : "s"}`}
                </span>
              )
            : count > 0
              ? `${count} filter${count === 1 ? "" : "s"}`
              : ""}
        </span>
      </button>
      {/* Opens and closes by animating its grid row from 0 to the content height; folded, it is inert */}
      <div className="ui-fm__panel" id={panelId} role="group" aria-label={g.label} inert={!isOpen || undefined}>
        <div className="ui-fm__panel-inner">
          {g.options.map((o) => {
            const key = `o:${g.id}:${o.id}`;
            const on = isOn(g.id, o.id);
            return (
              <button
                key={o.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-disabled={disabled || undefined}
                className="ui-fm__option"
                data-key={key}
                data-focus-key={`opt:${panelId}`}
                onClick={() => !disabled && onToggle(g.id, o.id)}
              >
                <span className="ui-fm__box" aria-hidden="true">
                  {clean ? (
                    <svg viewBox="0 0 16 16">
                      <path d="m4.25 8.25 2.5 2.5 5-5.5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <path d="m6 12.5 4 4 8-9" />
                    </svg>
                  )}
                </span>
                {clean ? <span className="ui-fm__option-label">{o.label}</span> : o.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** The keyboard hints – Standard: in the tray below the card · Clean: the last row of the card, under a hairline */
function FilterHints({ clean }: { clean: boolean }) {
  return (
    <div className="ui-fm__hints" aria-hidden="true">
      {clean ? (
        <>
          <span className="ui-fm__hint">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>to navigate</span>
          </span>
          <span className="ui-fm__hint">
            <kbd>↵</kbd>
            <span>to select</span>
          </span>
        </>
      ) : (
        <>
          <span className="ui-fm__hint">
            <kbd>
              <svg viewBox="0 0 24 24">
                <path d="M12 5v14m0 0-5-5m5 5 5-5" />
              </svg>
            </kbd>
            <kbd>
              <svg viewBox="0 0 24 24">
                <path d="M12 19V5m0 0-5 5m5-5 5 5" />
              </svg>
            </kbd>
            To navigate
          </span>
          <span className="ui-fm__hint">
            <kbd>
              <svg viewBox="0 0 24 24">
                <path d="M18 6v6.5a2 2 0 0 1-2 2H7m0 0 3.5-3.5M7 14.5 10.5 18" />
              </svg>
            </kbd>
            To select
          </span>
        </>
      )}
    </div>
  );
}

export function FilterMenu({
  groups,
  value,
  defaultValue = NONE,
  onChange,
  open: openProp,
  defaultOpen,
  onOpenChange,
  name,
  disabled = false,
  title = "Filters",
  hints = true,
  look,
  className,
  ref,
  ...rest
}: FilterMenuProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const rootRef = useRootRef(root, ref);
  const [picked, setPicked] = useControllable(value, defaultValue, onChange, "value");
  const [openIds, setOpenIds] = useControllable(openProp, defaultOpen ?? groups.slice(0, 1).map((g) => g.id), onOpenChange, "open");
  const open = new Set(openIds);
  const listRef = useRef<HTMLDivElement>(null);
  const chipsInner = useRef<HTMLDivElement>(null);
  const chipsOuter = useSmoothHeight(chipsInner);
  const measure = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(Infinity);
  // Clean: "+N" shows every chip (wrapping) until pressed again
  const [allChips, setAllChips] = useState(false);
  // One quiet status line: how many filters are on, announced after a change (not on mount)
  const [status, setStatus] = useState("");
  const mounted = useRef(false);
  // Focus never drops to <body>: a removed chip's × hands focus to the chip that took its place (same
  // data-focus-key), else the previous one; Clear all (disabled once empty) and the rest go to the first group head
  useFocusRescue(root, {
    fallback: (key) => {
      const r = root.current;
      if (!r) return null;
      const m = key?.match(/^chip-x:(\d+)$/);
      if (m) {
        const xs = r.querySelectorAll<HTMLElement>("[data-focus-key^='chip-x:']");
        if (xs.length) return xs[Math.min(Number(m[1]), xs.length) - 1] ?? xs[0];
      }
      // An option whose group folded (or went away) → its group's head
      if (key?.startsWith("opt:")) {
        const head = r.querySelector<HTMLElement>(`[data-focus-key="head:${CSS.escape(key.slice(4))}"]`);
        if (head) return head;
      }
      return r.querySelector<HTMLElement>(".ui-fm__group-head");
    },
  });

  const commit = (next: FilterValue) => {
    if (!disabled) setPicked(next);
  };
  const isOn = (g: string, o: string) => picked[g]?.includes(o) ?? false;
  const toggle = (g: string, o: string) => {
    const cur = picked[g] ?? [];
    commit({ ...picked, [g]: cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o] });
  };
  const toggleGroup = (g: string) => setOpenIds((ids) => (ids.includes(g) ? ids.filter((x) => x !== g) : [...ids, g]));

  // Chips in the order of the groups and their options
  const chips = groups.flatMap((g) =>
    g.options.filter((o) => isOn(g.id, o.id)).map((o) => ({ group: g, option: o, label: `${g.chipPrefix ?? ""}${o.label}` })),
  );
  const chipKey = chips.map((c) => `${c.group.id}:${c.option.id}`).join("|");
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setStatus(chips.length === 0 ? "No filters" : `${chips.length} filter${chips.length === 1 ? "" : "s"} active`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- announce only when the picked set changes
  }, [chipKey]);

  // Clean – one line only: as many chips as fit, the rest hide behind "+N".
  // A hidden copy of the chips (plus a "+99" sample) is measured to know their widths before they are placed.
  useLayoutEffect(() => {
    const row = chipsInner.current;
    const list = measure.current;
    if (!clean || allChips || !row || !list) return;
    const place = () => {
      const widths = [...list.children].map((el) => (el as HTMLElement).offsetWidth + CHIP_GAP);
      const more = widths.pop() ?? 0;
      const style = getComputedStyle(row);
      const room = row.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0) + CHIP_GAP;
      let used = 0;
      let n = 0;
      for (; n < widths.length; n++) {
        const rest = n + 1 < widths.length ? more : 0;
        if (used + widths[n] + rest > room) break;
        used += widths[n];
      }
      setFit(n);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(row);
    return () => ro.disconnect();
  }, [chipKey, clean, allChips]);

  const wrapAll = clean && allChips;
  const shown = clean && !wrapAll ? chips.slice(0, fit) : chips;
  const hidden = clean && !wrapAll ? chips.slice(fit) : [];

  // Everything the arrow keys can reach, top to bottom
  const rows: Row[] = groups.flatMap((g) => [
    { kind: "group", group: g } as Row,
    ...(open.has(g.id) ? g.options.map((o) => ({ kind: "option", group: g, option: o }) as Row) : []),
  ]);
  const keyOf = (r: Row) => (r.kind === "group" ? `g:${r.group.id}` : `o:${r.group.id}:${r.option.id}`);

  const moveTo = (key: string) => {
    listRef.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing) return;
    const focus = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>("[data-key]")?.dataset.key ?? null;
    const i = rows.findIndex((r) => keyOf(r) === focus);
    const row = rows[i];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))] ?? rows[0];
      moveTo(keyOf(next));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      moveTo(keyOf(rows[e.key === "Home" ? 0 : rows.length - 1]));
    } else if (row && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      const g = row.group.id;
      if (e.key === "ArrowRight" && !open.has(g)) toggleGroup(g);
      if (e.key === "ArrowLeft") {
        // Focus moves to the head before the panel goes inert
        const head = listRef.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(`g:${g}`)}"]`);
        if (!rescueFocus(head?.nextElementSibling, [head])) moveTo(`g:${g}`);
        if (open.has(g)) toggleGroup(g);
      }
    } else if (row && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (row.kind === "group") toggleGroup(row.group.id);
      else toggle(row.group.id, row.option.id);
    }
  };

  // Standard: chips wrap onto as many lines as they need · Clean: one line, with a hidden copy to measure and "+N"
  const chipRow = clean ? (
    <div className="ui-fm__chips" ref={chipsInner} data-empty={chips.length === 0 || undefined} data-wrap={wrapAll || undefined}>
      {/* Hidden copy, only to measure how many chips fit on the line */}
      <div className="ui-fm__measure" ref={measure} aria-hidden="true">
        {chips.map((c) => (
          <span key={`${c.group.id}:${c.option.id}`} className="ui-fm__chip">
            <span className="ui-fm__chip-label">{c.label}</span>
            <span className="ui-fm__chip-x" />
          </span>
        ))}
        <span className="ui-fm__chip ui-fm__more">+99</span>
      </div>
      {shown.map((c, i) => (
        <span key={`${c.group.id}:${c.option.id}`} className="ui-fm__chip">
          <span className="ui-fm__chip-label" title={c.label}>
            {c.label}
          </span>
          <button
            type="button"
            className="ui-fm__chip-x"
            aria-label={`Remove ${c.label}`}
            data-focus-key={`chip-x:${i}`}
            disabled={disabled}
            onClick={() => toggle(c.group.id, c.option.id)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
            </svg>
          </button>
        </span>
      ))}
      {/* "+N" shows the hidden chips (so each can be removed); pressed again, back to one line */}
      {(hidden.length > 0 || (wrapAll && chips.length > 0)) && (
        <button
          type="button"
          className="ui-fm__chip ui-fm__more"
          data-focus-key="more"
          aria-expanded={wrapAll}
          title={wrapAll ? undefined : hidden.map((c) => c.label).join(", ")}
          onClick={() => setAllChips((v) => !v)}
        >
          {wrapAll ? (
            "Show less"
          ) : (
            <>
              <span key={hidden.length} className="ui-fm__roll" aria-hidden="true">
                +{hidden.length}
              </span>
              <span className="ui-fm__sr">{`Show ${hidden.length} more: ${hidden.map((c) => c.label).join(", ")}`}</span>
            </>
          )}
        </button>
      )}
    </div>
  ) : (
    <div className="ui-fm__chips" ref={chipsInner}>
      {shown.map((c, i) => (
        <span key={`${c.group.id}:${c.option.id}`} className="ui-fm__chip">
          {c.label}
          <button
            type="button"
            aria-label={`Remove ${c.label}`}
            data-focus-key={`chip-x:${i}`}
            disabled={disabled}
            onClick={() => toggle(c.group.id, c.option.id)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );

  const body = (
    <>
      <div className="ui-fm__head">
        <span className="ui-fm__title">{title}</span>
        <button type="button" className="ui-fm__clear" data-focus-key="clear" disabled={disabled || chips.length === 0} onClick={() => commit({})}>
          Clear all
        </button>
      </div>

      {/* Active filters – the box glides to its new height as chips (Clean: the line) come and go */}
      <div className="ui-fm__chips-outer" ref={chipsOuter}>
        {chipRow}
      </div>

      <div className="ui-fm__groups" ref={listRef} onKeyDown={onKeyDown}>
        {groups.map((g, gi) => (
          <FilterGroupSection
            key={g.id}
            g={g}
            // Ids from useId and the group's place – never from the group's own id, which is user data
            panelId={`${uid}-g${gi}`}
            isOpen={open.has(g.id)}
            count={picked[g.id]?.length ?? 0}
            clean={clean}
            disabled={disabled}
            isOn={isOn}
            onToggleGroup={toggleGroup}
            onToggle={toggle}
          />
        ))}
      </div>
    </>
  );

  return (
    <div {...rest} ref={rootRef} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook} data-disabled={disabled || undefined}>
      {/* React 19 hoists this into <head> once, no matter how many menus render */}
      <style href="ui-filter-menu" precedence="default">
        {css}
      </style>

      {/* Standard: a white card inside the tray · Clean: the root is the card */}
      {clean ? body : <div className="ui-fm__card">{body}</div>}

      {/* Persistent and narrow: only the number of active filters, after a change */}
      <div className="ui-fm__sr" role="status">
        {status}
      </div>

      {/* Native forms: one hidden input per picked option */}
      {name &&
        chips.map((c) => <input key={`${c.group.id}:${c.option.id}`} type="hidden" name={`${name}[${c.group.id}]`} value={c.option.id} disabled={disabled} />)}

      {/* Standard: the hints in the tray below the card · Clean: the last row of the card, under a hairline */}
      {hints && <FilterHints clean={clean} />}
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

/** The outer box follows the inner box's height, with a transition after the first frame */
function useSmoothHeight(inner: RefObject<HTMLElement | null>) {
  const outer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const sync = () => {
      o.style.height = `${i.offsetHeight}px`;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(i);
    const frame = requestAnimationFrame(() => o.setAttribute("data-smooth", ""));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [inner]);
  return outer;
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
.ui-fm:where([data-look="standard"]),
.ui-fm__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-border-control: light-dark(#858585, #7c7c82);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-kbd-bg: light-dark(#ffffff, #19191b);
  --_tc-kbd-fg: light-dark(#404040, #c8c8cc);
  --_tc-kbd-font-size: 10.5px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 18px;
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 5px;
  --_tc-kbd-shadow: inset 0 0 0 1px light-dark(#dedede, #3a3a40), 0 1px 0 light-dark(#ececec, #2a2a2e);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-8: 32px;
  --_tc-surface-control: light-dark(#ffffff, #232326);
  --_tc-surface-inverse: light-dark(#171717, #ededed);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-accent: #ffffff;
  --_tc-text-on-inverse: light-dark(#ffffff, #111113);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-fm:where([data-look="clean"]),
.ui-fm__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-border-control: light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-kbd-bg: light-dark(#ffffff, #1c1c1e);
  --_tc-kbd-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-kbd-font-size: 10px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 16px;
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 4px;
  --_tc-kbd-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-8: 32px;
  --_tc-surface-control: light-dark(#ffffff, #252527);
  --_tc-surface-inverse: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-accent: #ffffff;
  --_tc-text-on-inverse: light-dark(#fcfcfc, #161618);
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-fm {
  width: 100%;
  max-width: 420px;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 400px;
  container-type: inline-size;
  overflow: hidden;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-fm *, .ui-fm *::before, .ui-fm *::after { box-sizing: border-box; }
.ui-fm button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-fm__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm button { font: inherit; color: inherit; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__card {
  padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-2-5, var(--_tc-space-2-5));
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
}
/* ---------- Header ---------- */
.ui-fm__head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__head { padding: 0 var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__title { font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); letter-spacing: -0.01em; }
/* Clear all: the ghost button recipe */
.ui-fm__clear {
  border: 0;
  background: none;
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)) !important;
  transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-fm__clear:hover:not(:disabled) { color: var(--tc-text-primary, var(--_tc-text-primary)) !important; background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__clear {
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  padding: 0 var(--tc-control-px-sm, var(--_tc-control-px-sm));
  margin-right: calc(-1 * var(--tc-control-px-sm, var(--_tc-control-px-sm))) !important;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__clear:disabled { opacity: 0.45; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-fm) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-fm) svg { display: block; flex: none; }
/* ---------- Header ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__head { padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-4, var(--_tc-space-4)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__title { font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__clear {
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-sm, var(--_tc-control-px-sm)) !important;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__clear:disabled { color: var(--tc-text-disabled, var(--_tc-text-disabled)) !important; cursor: default; }
/* ---------- Chips ---------- */
.ui-fm__chips-outer { overflow: hidden; }
.ui-fm__chips-outer[data-smooth] { transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); padding-top: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chips:empty { padding-top: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  height: 30px;
  padding: 0 var(--tc-space-1, var(--_tc-space-1)) 0 var(--tc-space-2-5, var(--_tc-space-2-5));
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  white-space: nowrap;
  animation: ui-fm-chip-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
/* The × is a 24px target; its negative margin keeps the chip's size */
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chip button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin: 0 -1px !important;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: none;
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chip button:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chip svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
/* ---------- Groups ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-fm__groups { display: grid; padding-top: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  width: calc(100% + 12px);
  height: 36px;
  margin: var(--tc-space-0-5, var(--_tc-space-0-5)) -6px 0 !important;
  padding: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  border: 0;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: none;
  text-align: left;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-head:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
.ui-fm__chevron {
  width: 16px;
  height: 16px;
  flex: none;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(-90deg);
  transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chevron { stroke: var(--tc-text-secondary, var(--_tc-text-secondary)); stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chips { position: relative; display: flex; flex-wrap: nowrap; gap: var(--tc-space-1, var(--_tc-space-1)); padding: 0 var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-3, var(--_tc-space-3)); overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chips[data-wrap] { flex-wrap: wrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chips[data-empty] { padding-bottom: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__measure { position: absolute; top: 0; left: 0; display: flex; gap: var(--tc-space-1, var(--_tc-space-1)); width: max-content; visibility: hidden; pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  height: 24px;
  padding: 0 var(--tc-space-1, var(--_tc-space-1)) 0 var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  white-space: nowrap;
  animation: ui-fm-chip-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-label { max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
/* A 24px target drawn as an 18px square: the hover fill is inset, the margins keep the chip's size */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin: 0 -3px !important;
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x::before { content: ""; position: absolute; inset: 3px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x:hover::before { background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x svg { position: relative; width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__more { padding: 0 var(--tc-space-2, var(--_tc-space-2)) !important; color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; text-align: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__more:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__roll { display: inline-block; animation: ui-fm-roll var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
/* ---------- Groups ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__groups { display: grid; padding: var(--tc-space-1, var(--_tc-space-1)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  width: 100%;
  height: 32px;
  padding: 0 var(--tc-space-2, var(--_tc-space-2)) !important;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  /* Hover comes in crisp and fades out when the pointer moves on */
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-head:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); transition-duration: var(--tc-duration-instant, var(--_tc-duration-instant)); }
.ui-fm__group-head:focus-visible, .ui-fm__option:focus-visible { outline-offset: -2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chevron { stroke: var(--tc-icon-muted, var(--_tc-icon-muted)); stroke-width: 1.1; }
.ui-fm__group[data-open] .ui-fm__chevron { transform: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-label { font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-count { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-picked { margin-left: auto; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-label { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-count { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-picked { display: inline-flex; margin-left: auto; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-fm__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-fm__group[data-open] .ui-fm__panel { grid-template-rows: 1fr; }
.ui-fm__panel-inner {
  display: grid;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  opacity: 0;
  transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), padding var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__panel-inner { gap: 1px; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group[data-open] .ui-fm__panel-inner { opacity: 1; padding: var(--tc-space-0-5, var(--_tc-space-0-5)) 0 var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__option {
  display: flex;
  align-items: center;
  gap: var(--tc-space-3, var(--_tc-space-3));
  width: calc(100% + 12px);
  height: 34px;
  margin: 0 -6px !important;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  border: 0;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: none;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  color: var(--tc-text-secondary, var(--_tc-text-secondary)) !important;
  text-align: left;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__option:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
/* Checkbox: its edge is its only cue at rest, so it uses the control border (≥ 3:1) */
:where([data-look="standard"], [data-look="standard"] *).ui-fm__box {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  flex: none;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-surface-control, var(--_tc-surface-control));
  box-shadow: inset 0 0 0 1px var(--tc-border-control, var(--_tc-border-control));
  transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__box svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: var(--tc-text-on-inverse, var(--_tc-text-on-inverse));
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  transition: stroke-dashoffset var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__option[aria-checked="true"] .ui-fm__box { background: var(--tc-surface-inverse, var(--_tc-surface-inverse)); box-shadow: inset 0 0 0 1px var(--tc-surface-inverse, var(--_tc-surface-inverse)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__option[aria-checked="true"] .ui-fm__box svg { stroke-dashoffset: 0; }
/* ---------- Keyboard hints ---------- */
.ui-fm__hint kbd {
  display: inline-grid;
  place-items: center;
  min-width: var(--tc-kbd-h, var(--_tc-kbd-h));
  height: var(--tc-kbd-h, var(--_tc-kbd-h));
  padding: 0 var(--tc-kbd-px, var(--_tc-kbd-px));
  border-radius: var(--tc-kbd-radius, var(--_tc-kbd-radius));
  background: var(--tc-kbd-bg, var(--_tc-kbd-bg));
  box-shadow: var(--tc-kbd-shadow, var(--_tc-kbd-shadow));
  font-family: inherit;
  font-size: var(--tc-kbd-font-size, var(--_tc-kbd-font-size));
  line-height: var(--tc-kbd-h, var(--_tc-kbd-h));
  font-weight: var(--tc-kbd-font-weight, var(--_tc-kbd-font-weight));
  color: var(--tc-kbd-fg, var(--_tc-kbd-fg));
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hints { display: flex; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hint { display: inline-flex; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hint kbd { padding: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hint kbd:last-of-type { margin-right: var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hint svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group[data-open] .ui-fm__panel-inner { opacity: 1; padding: 0 0 var(--tc-space-1, var(--_tc-space-1)); }
/* Options sit under the group's label, the checkbox lined up with its text */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  width: 100%;
  height: 32px;
  padding: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-8, var(--_tc-space-8)) !important;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); transition-duration: var(--tc-duration-instant, var(--_tc-duration-instant)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option-label { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* Checkbox: 14px with a control-border edge (≥ 3:1), blue when picked; the check draws itself in */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__box {
  display: grid;
  place-items: center;
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  background: var(--tc-surface-control, var(--_tc-surface-control));
  box-shadow: inset 0 0 0 1px var(--tc-border-control, var(--_tc-border-control));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__box svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: var(--tc-text-on-accent, var(--_tc-text-on-accent));
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 12;
  stroke-dashoffset: 12;
  transition: stroke-dashoffset var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option[aria-checked="true"] .ui-fm__box { background: var(--tc-accent, var(--_tc-accent)); box-shadow: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option[aria-checked="true"] .ui-fm__box svg { stroke-dashoffset: 0; transition-delay: 40ms; }
/* ---------- Keyboard hints: the last row of the card ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__hints {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  height: 32px;
  padding: 0 var(--tc-space-3, var(--_tc-space-3));
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__hint { display: inline-flex; align-items: center; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__hint > span { margin-left: var(--tc-space-1, var(--_tc-space-1)); }
@keyframes ui-fm-chip-in { from { opacity: 0; transform: scale(0.9); } }
@keyframes ui-fm-roll { from { opacity: 0; transform: translateY(60%); } to { opacity: 1; transform: none; } }
/* Narrow: a bit less side padding, shorter chips */
@container (max-width: 320px) {
:where([data-look="clean"], [data-look="clean"] *).ui-fm__head { padding-left: var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chips { padding-left: var(--tc-space-3-5, var(--_tc-space-3-5)); padding-right: var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-label { max-width: 132px; }
}
/* Touch screens: taller rows and buttons */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-fm__clear { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip { height: 32px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x { width: 32px; height: 32px; margin: 0 -4px !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-head { height: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option { height: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__box { width: 18px; height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__box svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__hints { display: none; }
}
@media (prefers-reduced-motion: reduce) {
.ui-fm *, .ui-fm *::before, .ui-fm *::after { animation: none !important; transition: none !important; }
}
.ui-fm[data-disabled] .ui-fm__option, .ui-fm[data-disabled] .ui-fm__chip { opacity: 0.55; cursor: not-allowed; }
`;

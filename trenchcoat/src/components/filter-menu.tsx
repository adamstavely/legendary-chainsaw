"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type Ref } from "react";
import { useControllable } from "../internal/use-controllable";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";
import { useSmoothHeight } from "../internal/use-smooth-height";
import { useRootRef } from "../internal/use-root-ref";

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
      const room = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) + CHIP_GAP;
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

/* ---------- Styles ---------- */

const css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *).ui-fm {
  width: 100%;
  max-width: 420px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 400px;
  container-type: inline-size;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
.ui-fm *, .ui-fm *::before, .ui-fm *::after { box-sizing: border-box; }
.ui-fm button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-fm__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm button { font: inherit; color: inherit; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__card {
  padding: 16px 16px 10px;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
/* ---------- Header ---------- */
.ui-fm__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__head { padding: 0 2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__title { font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-relaxed); font-weight: var(--tc-font-weight-semibold); letter-spacing: -0.01em; }
/* Clear all: the ghost button recipe */
.ui-fm__clear {
  border: 0;
  background: none;
  font-size: var(--tc-control-font-size);
  color: var(--tc-action-ghost-fg) !important;
  transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-fm__clear:hover:not(:disabled) { color: var(--tc-text-primary) !important; background: var(--tc-action-ghost-bg-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__clear {
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  margin-right: calc(-1 * var(--tc-control-px-sm)) !important;
  border-radius: var(--tc-control-radius-sm);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__clear:disabled { opacity: 0.45; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-fm) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-fm) svg { display: block; flex: none; }
/* ---------- Header ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__head { padding: 12px 10px 8px 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__title { font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-loose); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__clear {
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-sm) !important;
  border-radius: var(--tc-control-radius-md);
  font-weight: var(--tc-control-font-weight);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__clear:disabled { color: var(--tc-text-disabled) !important; cursor: default; }
/* ---------- Chips ---------- */
.ui-fm__chips-outer { overflow: hidden; }
.ui-fm__chips-outer[data-smooth] { transition: height var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chips { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chips:empty { padding-top: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 30px;
  padding: 0 4px 0 11px;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-secondary);
  white-space: nowrap;
  animation: ui-fm-chip-in var(--tc-duration-moderate) var(--tc-ease-move) both;
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
  border-radius: var(--tc-radius-sm);
  background: none;
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chip button:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chip svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
/* ---------- Groups ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-fm__groups { display: grid; padding-top: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-head {
  display: flex;
  align-items: center;
  gap: 7px;
  width: calc(100% + 12px);
  height: 36px;
  margin: 2px -6px 0 !important;
  padding: 0 8px 0 6px;
  border: 0;
  border-radius: var(--tc-radius-lg);
  background: none;
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-head:hover { background: var(--tc-fill-hover); }
.ui-fm__chevron {
  width: 16px;
  height: 16px;
  flex: none;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(-90deg);
  transition: transform var(--tc-duration-moderate) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chevron { stroke: var(--tc-text-secondary); stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chips { position: relative; display: flex; flex-wrap: nowrap; gap: 4px; padding: 0 16px 12px; overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chips[data-wrap] { flex-wrap: wrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chips[data-empty] { padding-bottom: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__measure { position: absolute; top: 0; left: 0; display: flex; gap: 4px; width: max-content; visibility: hidden; pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 2px;
  height: 24px;
  padding: 0 3px 0 8px;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-primary);
  white-space: nowrap;
  animation: ui-fm-chip-in var(--tc-duration-moderate) var(--tc-ease-move) both;
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
  color: var(--tc-icon-muted);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x::before { content: ""; position: absolute; inset: 3px; border-radius: var(--tc-radius-xs); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x:hover { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x:hover::before { background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x svg { position: relative; width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__more { padding: 0 8px !important; color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; text-align: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__more:hover { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__roll { display: inline-block; animation: ui-fm-roll var(--tc-duration-slow) var(--tc-ease-move) both; }
/* ---------- Groups ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__groups { display: grid; padding: 4px; border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 8px !important;
  border-radius: var(--tc-radius-sm);
  /* Hover comes in crisp and fades out when the pointer moves on */
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-head:hover { background: var(--tc-fill-subtle); transition-duration: var(--tc-duration-instant); }
.ui-fm__group-head:focus-visible, .ui-fm__option:focus-visible { outline-offset: -2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chevron { stroke: var(--tc-icon-muted); stroke-width: 1.1; }
.ui-fm__group[data-open] .ui-fm__chevron { transform: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-label { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-picked { margin-left: auto; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-label { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-count { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-picked { display: inline-flex; margin-left: auto; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-fm__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move);
}
.ui-fm__group[data-open] .ui-fm__panel { grid-template-rows: 1fr; }
.ui-fm__panel-inner {
  display: grid;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  opacity: 0;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), padding var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__panel-inner { gap: 1px; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group[data-open] .ui-fm__panel-inner { opacity: 1; padding: 2px 0 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: calc(100% + 12px);
  height: 34px;
  margin: 0 -6px !important;
  padding: 0 6px;
  border: 0;
  border-radius: var(--tc-radius-lg);
  background: none;
  font-size: var(--tc-font-size-lg);
  color: var(--tc-text-secondary) !important;
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__option:hover { background: var(--tc-fill-hover); }
/* Checkbox: its edge is its only cue at rest, so it uses the control border (≥ 3:1) */
:where([data-look="standard"], [data-look="standard"] *).ui-fm__box {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  flex: none;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-control);
  box-shadow: inset 0 0 0 1px var(--tc-border-control);
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__box svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: var(--tc-text-on-inverse);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__option[aria-checked="true"] .ui-fm__box { background: var(--tc-surface-inverse); box-shadow: inset 0 0 0 1px var(--tc-surface-inverse); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__option[aria-checked="true"] .ui-fm__box svg { stroke-dashoffset: 0; }
/* ---------- Keyboard hints ---------- */
.ui-fm__hint kbd {
  display: inline-grid;
  place-items: center;
  min-width: var(--tc-kbd-h);
  height: var(--tc-kbd-h);
  padding: 0 var(--tc-kbd-px);
  border-radius: var(--tc-kbd-radius);
  background: var(--tc-kbd-bg);
  box-shadow: var(--tc-kbd-shadow);
  font-family: inherit;
  font-size: var(--tc-kbd-font-size);
  line-height: var(--tc-kbd-h);
  font-weight: var(--tc-kbd-font-weight);
  color: var(--tc-kbd-fg);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hints { display: flex; justify-content: space-between; gap: 12px; padding: 10px 8px 4px; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hint { display: inline-flex; align-items: center; gap: 5px; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hint kbd { padding: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hint kbd:last-of-type { margin-right: 4px; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hint svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group[data-open] .ui-fm__panel-inner { opacity: 1; padding: 0 0 4px; }
/* Options sit under the group's label, the checkbox lined up with its text */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 8px 0 32px !important;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option:hover { background: var(--tc-fill-subtle); transition-duration: var(--tc-duration-instant); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option-label { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* Checkbox: 14px with a control-border edge (≥ 3:1), blue when picked; the check draws itself in */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__box {
  display: grid;
  place-items: center;
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: var(--tc-radius-xs);
  background: var(--tc-surface-control);
  box-shadow: inset 0 0 0 1px var(--tc-border-control);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__box svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: var(--tc-text-on-accent);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 12;
  stroke-dashoffset: 12;
  transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option[aria-checked="true"] .ui-fm__box { background: var(--tc-accent); box-shadow: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option[aria-checked="true"] .ui-fm__box svg { stroke-dashoffset: 0; transition-delay: 40ms; }
/* ---------- Keyboard hints: the last row of the card ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__hints {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 32px;
  padding: 0 12px;
  border-top: var(--tc-hairline) solid var(--tc-divider);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__hint { display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__hint > span { margin-left: 4px; }
@keyframes ui-fm-chip-in { from { opacity: 0; transform: scale(0.9); } }
@keyframes ui-fm-roll { from { opacity: 0; transform: translateY(60%); } to { opacity: 1; transform: none; } }
/* Narrow: a bit less side padding, shorter chips */
@container (max-width: 320px) {
:where([data-look="clean"], [data-look="clean"] *).ui-fm__head { padding-left: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chips { padding-left: 14px; padding-right: 14px; }
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

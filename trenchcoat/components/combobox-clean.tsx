"use client";

/*
 * Combobox – pick one or many options from a searchable list, in a single self-contained file.
 * Picked options sit in the field as chips (with an avatar, a color dot or an icon) and can be removed with ×;
 * Backspace in the empty field first highlights the last chip, a second Backspace removes it.
 * The list below is grouped, highlights what you typed, marks picked rows with a check and can offer
 * to create what's missing. ↑ ↓ move, ↵ picks, Esc closes, Tab leaves. The field and the list glide to their new heights.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: combobox.tsx is Standard,
 * combobox-clean.tsx is Clean). Clean has no tray – a white field with a hairline shadow, gray tab-like chips and
 * one white popover with a blue check. Its field always stays one line: as many chips as fit next to the input are
 * shown, the rest go into "+N" (which names them, and opens the list where they can be unticked).
 * The row ↵ will pick always keeps its highlight; while the keyboard drives the list it also gets a focus ring.
 * Above WINDOW_FROM matching options only the rows in view (plus the active one) are rendered.
 */
// Generated from src/components/combobox.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-cbx";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Lighter text after the label, e.g. a role or an email */
  hint?: string;
  /** An image URL, or true for initials from the label */
  avatar?: string | boolean;
  /** A small color dot – nice for labels and tags */
  color?: string;
  /** Any icon – wins over avatar and color */
  icon?: ReactNode;
  /** Options with the same group are listed under one title */
  group?: string;
  /** Extra words that should find this option */
  keywords?: string;
};

export type ComboboxOwnProps = {
  options: ComboboxOption[];
  /** Pick many (chips) or one – defaults to many */
  multiple?: boolean;
  /** The picked values. Controlled when defined; otherwise the field keeps its own, starting at `defaultValue` */
  value?: string[];
  /** Starting values when uncontrolled */
  defaultValue?: string[];
  /** Called with the new values and their options */
  onChange?: (value: string[], options: ComboboxOption[]) => void;
  /** Whether the list is open. Controlled when defined; otherwise starts at `defaultOpen` */
  open?: boolean;
  /** Called when the list opens or closes */
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  /** Offer "Create “…”" when nothing matches the typed text exactly */
  creatable?: boolean;
  /** Turn typed text into an option – defaults to { value: text, label: text }. May return a promise (e.g. a server
   *  call): the create row shows that it's working, and a rejection shows an error there, so it can be tried again */
  onCreate?: (text: string) => ComboboxOption | void | Promise<ComboboxOption | void>;
  /** Name for native form submission: one hidden input per picked value */
  name?: string;
  /** Blocks every change and leaves the hidden inputs out of the form */
  disabled?: boolean;
  /** At least one value must be picked before a native form submits */
  required?: boolean;
  /** Text of the create row – defaults to Create “…” */
  createLabel?: (text: string) => string;
  /** Show at most this many chips, the rest as "+3". In the Clean look the field always stays one line – chips
   * that don't fit go into "+3" anyway */
  maxVisibleTags?: number;
  /** Visible label above the field */
  label?: string;
  /** Open the list right away – nice for previews */
  defaultOpen?: boolean;
  /** Shown when nothing matches */
  emptyText?: string;
  /** Shows the field as invalid (red edge, aria-invalid on the input) */
  invalid?: boolean;
  /** Visual style. Defaults to the file's look: Standard in combobox.tsx, Clean in combobox-clean.tsx */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type ComboboxProps = Omit<ComponentPropsWithoutRef<"div">, keyof ComboboxOwnProps> & ComboboxOwnProps;

type Chip = { value: string; leaving?: boolean };

const CREATE = "\u0000create";
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/* ---------- Helpers ---------- */

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const initials = (label: string) => {
  const words = label.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};

/** The typed text, marked where it matches */
function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

/** Room the text input keeps on the line, in px (Clean's one-line field) */
const INPUT_MIN = 72;
/** From this many matching options on, the list renders only the rows in view (plus the active one) */
const WINDOW_FROM = 300;
/** Rows rendered above and below the visible part of a windowed list */
const OVERSCAN = 12;

/** Avatar, color dot or icon in front of a chip or a row */
function Visual({ option }: { option: ComboboxOption }) {
  if (option.icon) return <span className="ui-cbx__icon">{option.icon}</span>;
  if (typeof option.avatar === "string") return <img className="ui-cbx__avatar" src={option.avatar} alt="" />;
  if (option.avatar) return <span className="ui-cbx__avatar" aria-hidden="true">{initials(option.label)}</span>;
  if (option.color) return <span className="ui-cbx__dot" style={{ background: option.color }} aria-hidden="true" />;
  return null;
}

const Glyph = ({ d, className }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={["ui-cbx__glyph", className].filter(Boolean).join(" ")} aria-hidden="true">
    <path d={d} />
  </svg>
);
const icons = {
  close: "M7 7l10 10M17 7 7 17",
  check: "M5.5 12.5l4 4L18.5 8",
  chevron: "M8 10l4 4 4-4",
  plus: "M12 6v12M6 12h12",
};

/** A chip in the field: it grows in with a small pop (not on the first render), folds away when removed */
function ChipItem({ animate, leaving, armed, plain, children }: { animate: boolean; leaving?: boolean; armed?: boolean; plain?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLLIElement>(null);
  useLayoutEffect(() => {
    const li = ref.current;
    if (!animate || !li || reducedMotion()) return;
    li.animate([{ gridTemplateColumns: "0fr", marginRight: "0px" }, { gridTemplateColumns: "1fr", marginRight: "var(--tc-space-1, var(--_tc-space-1))" }], { duration: 260, easing: EASE });
    li.firstElementChild?.animate(
      [
        { opacity: 0, transform: "scale(0.6)" },
        { opacity: 1, transform: "scale(1.05)", offset: 0.6 },
        { opacity: 1, transform: "none" },
      ],
      { duration: 340, easing: EASE },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <li ref={ref} className="ui-cbx__chip" data-leaving={leaving || undefined} data-armed={armed || undefined} data-plain={plain || undefined}>
      {children}
    </li>
  );
}

/* ---------- Hooks ---------- */

/** The chips: removed ones stay a moment to fold away; chips that arrive after the first render pop in */
function useChips(selected: string[]) {
  const [chips, setChips] = useState<Chip[]>(() => selected.map((v) => ({ value: v })));
  const chipsRef = useRef(chips);
  useLayoutEffect(() => {
    chipsRef.current = chips;
  });
  const timers = useRef(new Map<string, number>());
  // Chips that arrive after the first render pop in; the first ones don't
  const [ready, setReady] = useState(false);
  const selectedKey = selected.join("\u0001");

  useEffect(() => {
    const prev = chipsRef.current;
    let changed = false;
    const next: Chip[] = prev.map((c) => {
      const keep = selected.includes(c.value);
      if (keep && c.leaving) {
        changed = true;
        window.clearTimeout(timers.current.get(c.value));
        timers.current.delete(c.value);
        return { value: c.value };
      }
      if (!keep && !c.leaving) {
        changed = true;
        // A short flash, then the chip folds away (matches the CSS delays)
        timers.current.set(
          c.value,
          window.setTimeout(() => {
            timers.current.delete(c.value);
            setChips((list) => list.filter((x) => !(x.value === c.value && x.leaving)));
          }, 420),
        );
        return { value: c.value, leaving: true };
      }
      return c;
    });
    for (const v of selected) {
      if (!next.some((c) => c.value === v)) {
        next.push({ value: v });
        changed = true;
      }
    }
    if (changed) setChips(next);
  }, [selectedKey]); // eslint-disable-line react-hooks/exhaustive-deps -- runs when the selection changes, compared by value

  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    setReady(true);
    const t = timers.current;
    return () => {
      mounted.current = false;
      t.forEach((id) => window.clearTimeout(id));
    };
  }, []);
  return { chips, ready, mounted };
}

/**
 * Clean – one line only: as many chips as fit next to the input, the rest hide behind "+N". A hidden copy of the
 * chips is measured to know their widths before they are placed – when the chips change or the field resizes
 */
function useLineFit(clean: boolean, fieldInner: { current: HTMLDivElement | null }, measure: { current: HTMLUListElement | null }, chipKey: string) {
  const [fit, setFit] = useState(Infinity);
  useLayoutEffect(() => {
    const inner = fieldInner.current;
    const list = measure.current;
    if (!clean || !inner || !list) return;
    const place = () => {
      const widths = [...list.children].map((el) => (el as HTMLElement).offsetWidth + 4);
      const more = widths.pop() ?? 0; // the last one is a "+99" sample
      const style = getComputedStyle(inner);
      const room = inner.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - INPUT_MIN;
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
    ro.observe(inner);
    return () => ro.disconnect();
  }, [chipKey, clean, fieldInner, measure]);
  return fit;
}

type ElRef<T> = { current: T | null };

/** The field glides to the height of its content */
function useFieldHeight(field: ElRef<HTMLDivElement>, fieldInner: ElRef<HTMLDivElement>) {
  useLayoutEffect(() => {
    const box = field.current;
    const inner = fieldInner.current;
    if (!box || !inner) return;
    const set = () => (box.style.height = `${inner.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [field, fieldInner]);
}

/** The open list glides to the height of its rows, up to its max-height */
function useListHeight(listRef: ElRef<HTMLDivElement>, listInner: ElRef<HTMLDivElement>, open: boolean) {
  useLayoutEffect(() => {
    const list = listRef.current;
    const inner = listInner.current;
    if (!open || !list || !inner) return;
    const set = () => {
      const style = getComputedStyle(list);
      const pad = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      const limit = parseFloat(style.maxHeight) || Infinity;
      list.style.height = `${Math.min(inner.offsetHeight + pad, limit)}px`;
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [open, listRef, listInner]);
}

type PillArgs = {
  open: boolean;
  listRef: ElRef<HTMLDivElement>;
  pillRef: ElRef<HTMLSpanElement>;
  byKeyboard: { current: boolean };
  /** The active row and the rows on show – the pill is placed again when either changes, not on every render */
  current?: string;
  orderKey: string;
};

/**
 * The highlight glides to the active row – the row ↵ picks, so it never fades out; a keyboard move scrolls the list
 * to it. All geometry is read before anything is written, so placing it costs one layout
 */
function useActivePill({ open, listRef, pillRef, byKeyboard, current, orderKey }: PillArgs) {
  useLayoutEffect(() => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (!open || !list || !pill) return;
    const row = list.querySelector<HTMLElement>("[data-active]");
    if (!row) {
      pill.style.opacity = "0";
      return;
    }
    // Reads
    const rowTop = row.offsetTop;
    const rowH = row.offsetHeight;
    const scrollTop = list.scrollTop;
    const viewH = list.clientHeight;
    const prev = row.previousElementSibling as HTMLElement | null;
    const title = prev?.classList.contains("ui-cbx__group-label") ? prev.offsetHeight : 0;
    // Writes – no transition on the first placement, so it doesn't fly in
    const first = !pill.dataset.ready;
    if (first) pill.style.transition = "none";
    pill.style.opacity = "1";
    pill.style.height = `${rowH}px`;
    pill.style.transform = `translateY(${rowTop}px)`;
    if (first) {
      pill.dataset.ready = "1";
      void pill.offsetWidth;
      pill.style.transition = "";
    }
    if (!byKeyboard.current) return;
    byKeyboard.current = false;
    // Scroll only the list, keeping the group title above a first row in view
    const pad = 6;
    const top = rowTop - pad - title;
    const bottom = rowTop + rowH + pad;
    if (top < scrollTop) list.scrollTop = top;
    else if (bottom > scrollTop + viewH) list.scrollTop = bottom - viewH;
  }, [open, listRef, pillRef, byKeyboard, current, orderKey]);
}

type ListWindow = { top: number; height: number; row: number; label: number };

/** Long lists: which part of the list is in view, and how tall a row and a group title are (measured) */
function useListWindow(listRef: ElRef<HTMLDivElement>, open: boolean, windowed: boolean) {
  const [win, setWin] = useState<ListWindow>({ top: 0, height: 300, row: 32, label: 28 });
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!windowed || !open || !list) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const row = list.querySelector<HTMLElement>(".ui-cbx__option")?.offsetHeight;
      const labels = list.querySelectorAll<HTMLElement>(".ui-cbx__group-label");
      const label = (labels[1] ?? labels[0])?.offsetHeight;
      const next = { top: list.scrollTop, height: list.clientHeight || 300, row: row || 32, label: label || 28 };
      setWin((w) => (w.top === next.top && w.height === next.height && w.row === next.row && w.label === next.label ? w : next));
    };
    read();
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    list.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener("scroll", onScroll);
    };
  }, [listRef, open, windowed]);
  return windowed ? win : null;
}

/** The options a windowed list renders: those near the visible part, plus the active one */
function windowRows(groups: { name: string; options: ComboboxOption[] }[], win: ListWindow, current?: string) {
  const keep = new Set<string>();
  const lo = win.top - OVERSCAN * win.row;
  const hi = win.top + win.height + OVERSCAN * win.row;
  let y = 0;
  for (const g of groups) {
    if (g.name) y += win.label;
    for (const o of g.options) {
      if (y + win.row > lo && y < hi) keep.add(o.value);
      y += win.row;
    }
  }
  if (current) keep.add(current);
  return keep;
}

/** The options that match the typed text, in their groups */
function useGroups(all: ComboboxOption[], needle: string) {
  return useMemo(() => {
    const out: { name: string; options: ComboboxOption[] }[] = [];
    for (const o of all) {
      if (needle && !`${o.label} ${o.hint ?? ""} ${o.keywords ?? ""}`.toLowerCase().includes(needle)) continue;
      const name = o.group ?? "";
      let g = out.find((x) => x.name === name);
      if (!g) out.push((g = { name, options: [] }));
      g.options.push(o);
    }
    return out;
  }, [all, needle]);
}

/** A number that rolls up or down: its last shown value (kept while `keep` is false) and which way it went */
function useRoll(value: number, keep: boolean) {
  // Tracked in state, adjusted while rendering
  const [roll, setRoll] = useState<{ last: number; dir: "up" | "down" }>({ last: value, dir: "up" });
  if (keep && value !== roll.last) setRoll({ last: value, dir: value > roll.last ? "up" : "down" });
  return roll;
}

/**
 * Options made from the typed text. onCreate may return a promise: `creating` says which text it's for, and whether
 * it failed. A result that settles after unmount is dropped
 */
function useCreate(
  onCreate: ComboboxProps["onCreate"],
  mounted: { current: boolean },
  onMade: (made: ComboboxOption) => void,
  onFailed: (text: string) => void,
) {
  const [created, setCreated] = useState<ComboboxOption[]>([]);
  const [creating, setCreating] = useState<{ text: string; failed?: boolean } | null>(null);
  const add = (made: ComboboxOption) => {
    setCreated((list) => [...list.filter((c) => c.value !== made.value), made]);
    onMade(made);
  };
  const startCreate = (text: string) => {
    if (creating?.text === text && !creating.failed) return;
    const result = onCreate?.(text);
    if (!(result instanceof Promise)) {
      add(result || { value: text, label: text });
      return;
    }
    setCreating({ text });
    result.then(
      (made) => {
        if (!mounted.current) return;
        setCreating(null);
        add(made || { value: text, label: text });
      },
      () => {
        if (!mounted.current) return;
        setCreating({ text, failed: true });
        onFailed(text);
      },
    );
  };
  return { created, creating, startCreate };
}

/* ---------- Parts ---------- */

type ListboxProps = {
  uid: string;
  listRef: ElRef<HTMLDivElement>;
  pillRef: ElRef<HTMLSpanElement>;
  listInner: ElRef<HTMLDivElement>;
  multiple: boolean;
  label?: string;
  groups: { name: string; options: ComboboxOption[] }[];
  selected: string[];
  current?: string;
  q: string;
  optionId: (v: string) => string;
  /** Long lists: only these options are rendered (the others become spacers); `total` and `posOf` fill in their place */
  keep: Set<string> | null;
  win: ListWindow | null;
  total: number;
  posOf: (v: string) => number;
  emptyText: ReactNode;
  canCreate: boolean;
  creating: { text: string; failed?: boolean } | null;
  createLabel: (text: string) => string;
  onPointer: () => void;
  setActive: (v: string) => void;
  pick: (o: ComboboxOption) => void;
  create: () => void;
};

const keepFocus = (e: MouseEvent) => e.preventDefault();

const Gap = ({ h }: { h: number }) => <div className="ui-cbx__gap" aria-hidden="true" style={{ height: h }} />;

/** The options, grouped, with the typed text marked – and "Create …" at the end */
function Listbox({ uid, listRef, pillRef, listInner, multiple, label, groups, selected, current, q, optionId, keep, win, total, posOf, emptyText, canCreate, creating, createLabel, onPointer, setActive, pick, create }: ListboxProps) {
  const row = (o: ComboboxOption) => {
    const on = selected.includes(o.value);
    return (
      <div
        key={o.value}
        id={optionId(o.value)}
        role="option"
        aria-selected={on}
        aria-setsize={keep ? total : undefined}
        aria-posinset={keep ? posOf(o.value) + 1 : undefined}
        data-active={current === o.value || undefined}
        className="ui-cbx__option"
        onMouseDown={keepFocus}
        onMouseMove={() => {
          onPointer();
          if (current !== o.value) setActive(o.value);
        }}
        onClick={() => {
          setActive(o.value);
          pick(o);
        }}
      >
        <Visual option={o} />
        <span className="ui-cbx__text">
          <span className="ui-cbx__name">
            <Highlight text={o.label} query={q} />
          </span>
          {o.hint && (
            <span className="ui-cbx__hint">
              <Highlight text={o.hint} query={q} />
            </span>
          )}
        </span>
        <Glyph d={icons.check} className="ui-cbx__check" />
      </div>
    );
  };

  // Windowed: options out of view become spacers of the same height, whole groups out of view one spacer each
  const nodes: ReactNode[] = [];
  let gap = 0;
  groups.forEach((g, gi) => {
    const shown = keep ? g.options.filter((o) => keep.has(o.value)) : g.options;
    if (keep && win && !shown.length) {
      gap += (g.name ? win.label : 0) + g.options.length * win.row;
      return;
    }
    if (gap) nodes.push(<Gap key={`gap-${gi}`} h={gap} />);
    gap = 0;
    const inner: ReactNode[] = [];
    let skip = 0;
    for (const o of g.options) {
      if (keep && win && !keep.has(o.value)) {
        skip += win.row;
        continue;
      }
      if (skip) inner.push(<Gap key={`gap-${o.value}`} h={skip} />);
      skip = 0;
      inner.push(row(o));
    }
    if (skip) gap += skip;
    nodes.push(
      <div key={g.name || "_"} role="group" aria-labelledby={g.name ? `${uid}-g${gi}` : undefined} className="ui-cbx__group">
        {g.name && (
          <div className="ui-cbx__group-label" id={`${uid}-g${gi}`}>
            {g.name}
          </div>
        )}
        {inner}
      </div>,
    );
  });
  if (gap) nodes.push(<Gap key="gap-end" h={gap} />);

  return (
    <div
      ref={listRef}
      id={`${uid}-list`}
      className="ui-cbx__list"
      role="listbox"
      aria-multiselectable={multiple || undefined}
      aria-labelledby={label ? `${uid}-label` : undefined}
      aria-label={label ? undefined : "Options"}
    >
      <span ref={pillRef} className="ui-cbx__pill" aria-hidden="true" />
      <div ref={listInner} className="ui-cbx__list-inner">
        {nodes}

        {!groups.length && (
          <div className="ui-cbx__empty" key={q}>
            {emptyText}
            {q && <> for “{q}”</>}
          </div>
        )}

        {canCreate && (
          <div
            id={optionId(CREATE)}
            role="option"
            aria-selected={false}
            aria-busy={(creating?.text === q && !creating.failed) || undefined}
            aria-setsize={keep ? total : undefined}
            aria-posinset={keep ? total : undefined}
            data-active={current === CREATE || undefined}
            className="ui-cbx__option ui-cbx__create"
            onMouseDown={keepFocus}
            onMouseMove={() => {
              onPointer();
              if (current !== CREATE) setActive(CREATE);
            }}
            onClick={create}
          >
            <span className="ui-cbx__plus" aria-hidden="true">
              <Glyph d={icons.plus} />
            </span>
            <span className="ui-cbx__name">
              {creating?.text === q ? (creating.failed ? `Couldn't create “${q}” – try again` : `${createLabel(q)}…`) : createLabel(q)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Clean: a hidden copy of the chips plus a "+99" sample, only to measure how many fit on the line */
function MeasureChips({ chips, optionOf, measure }: { chips: Chip[]; optionOf: (v: string) => ComboboxOption; measure: ElRef<HTMLUListElement> }) {
  return (
    <ul ref={measure} className="ui-cbx__measure" aria-hidden="true">
      {chips
        .filter((c) => !c.leaving)
        .map((c) => {
          const o = optionOf(c.value);
          const plain = !o.icon && !o.avatar && !o.color;
          return (
            <li key={c.value} className="ui-cbx__chip" data-plain={plain || undefined}>
              <span className="ui-cbx__chip-body">
                <Visual option={o} />
                <span className="ui-cbx__chip-label">{o.label}</span>
                <span className="ui-cbx__chip-x" />
              </span>
            </li>
          );
        })}
      <li className="ui-cbx__chip ui-cbx__more">
        <span className="ui-cbx__chip-body">+99</span>
      </li>
    </ul>
  );
}

/** Standard: the tray below the card · Clean: the popover's last row, under a hairline – how many are picked, and the keys */
function PopFoot({ count, dir, multiple }: { count: number; dir: "up" | "down"; multiple: boolean }) {
  return (
    <div className="ui-cbx__foot" aria-hidden="true">
      <span className="ui-cbx__count">
        <span className="ui-cbx__roll">
          <span key={count} data-dir={dir}>
            {count}
          </span>
        </span>
        {multiple ? " selected" : count ? " selected" : " selected"}
      </span>
      <span className="ui-cbx__keys">
        <kbd>↑</kbd>
        <kbd>↓</kbd>
        <span>to move</span>
        <kbd>↵</kbd>
        <span>to {multiple ? "toggle" : "pick"}</span>
      </span>
    </div>
  );
}

type ChipListProps = {
  chips: Chip[];
  optionOf: (v: string) => ComboboxOption;
  ready: boolean;
  armed: string | null;
  disabled: boolean;
  remove: (v: string) => void;
  /** Shows the "+N" chip */
  more: boolean;
  hidden: number;
  armedMore: boolean;
  shownHidden: number;
  rollDir: "up" | "down";
  /** Labels of the chips behind "+N" – its name and tooltip */
  hiddenLabels: string[];
  /** "+N" pressed: open the list, where the hidden ones are ticked and can be unticked */
  onMore: () => void;
};

/** The picked values as chips, and "+N" for those that don't show */
function ChipList({ chips, optionOf, ready, armed, disabled, remove, more, hidden, armedMore, shownHidden, rollDir, hiddenLabels, onMore }: ChipListProps) {
  return (
    <ul className="ui-cbx__chips" role="list" aria-label="Selected">
      {chips.map((c) => {
        const o = optionOf(c.value);
        const plain = !o.icon && !o.avatar && !o.color;
        return (
          <ChipItem key={c.value} animate={ready} leaving={c.leaving} armed={armed === c.value} plain={plain}>
            <span className="ui-cbx__chip-body">
              <Visual option={o} />
              <span className="ui-cbx__chip-label">{o.label}</span>
              <button
                type="button"
                className="ui-cbx__chip-x"
                tabIndex={-1}
                disabled={disabled}
                aria-label={`Remove ${o.label}`}
                onMouseDown={keepFocus}
                onClick={() => remove(c.value)}
              >
                <Glyph d={icons.close} />
              </button>
            </span>
          </ChipItem>
        );
      })}
      {more && (
        <li className="ui-cbx__chip ui-cbx__more" data-hidden={!hidden || undefined} data-armed={armedMore || undefined} aria-hidden={!hidden || undefined}>
          {/* Not a tab stop (like the chip ×): the keyboard reaches the hidden ones through the list, where they're ticked */}
          <button
            type="button"
            className="ui-cbx__chip-body"
            tabIndex={-1}
            disabled={disabled || !hidden}
            aria-label={`${hidden} more selected: ${hiddenLabels.join(", ")}`}
            title={hiddenLabels.join(", ")}
            onMouseDown={keepFocus}
            onClick={onMore}
          >
            +
            <span className="ui-cbx__roll">
              <span key={shownHidden} data-dir={rollDir}>
                {shownHidden}
              </span>
            </span>
          </button>
        </li>
      )}
    </ul>
  );
}

/** Native forms: one hidden input per value; `required` is checked on a hidden stand-in that is empty while nothing
 *  is picked, and hands the focus to the field when the browser points at it */
function FormInputs({ name, selected, required, disabled, input }: { name?: string; selected: string[]; required: boolean; disabled: boolean; input: ElRef<HTMLInputElement> }) {
  return (
    <>
    {name && selected.map((v) => <input key={v} type="hidden" name={name} value={v} disabled={disabled} />)}
    {required && (
      <input
        className="ui-cbx__proxy"
        tabIndex={-1}
        aria-hidden="true"
        required
        disabled={disabled}
        value={selected.join(",")}
        onChange={() => {}}
        onFocus={() => input.current?.focus()}
      />
    )}
    </>
  );
}

export function Combobox({
  options,
  multiple = true,
  value,
  defaultValue,
  onChange,
  open: openProp,
  onOpenChange,
  placeholder = "Search…",
  creatable = false,
  onCreate,
  createLabel = (text) => `Create “${text}”`,
  maxVisibleTags,
  label,
  defaultOpen = false,
  emptyText = "No results",
  name,
  disabled = false,
  required = false,
  invalid = false,
  look,
  className,
  ref,
  onBlur: onBlurProp,
  ...rest
}: ComboboxProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const uid = "ui-cbx" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // onChange also gets the options: a created option isn't in `options` yet, so commit() hands it over in a ref
  const pickedOption = useRef<ComboboxOption | undefined>(undefined);
  const [selected, setSelected] = useControllable<string[]>(
    value,
    defaultValue ?? [],
    onChange && ((next) => onChange(next, next.map((v) => (pickedOption.current?.value === v ? pickedOption.current : optionOf(v))))),
    "value",
  );
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange, "open");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  // The keyboard drives the list (typing, arrows): the active row also gets a focus ring. The pointer moving over the
  // rows turns it off – the highlight then just follows the pointer
  const [kbd, setKbd] = useState(true);
  const [armed, setArmed] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const root = useRef<HTMLDivElement>(null);
  const rootRef = useRootRef(root, ref);
  const field = useRef<HTMLDivElement>(null);
  const fieldInner = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listInner = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const byKeyboard = useRef(false);

  const { chips, ready, mounted } = useChips(selected);
  const { created, creating, startCreate } = useCreate(onCreate, mounted, (made) => {
    setActive(made.value);
    pick(made);
  }, (text) => setAnnounce(`Couldn't create “${text}”`));
  const all = useMemo(() => [...options, ...created.filter((c) => !options.some((o) => o.value === c.value))], [options, created]);
  const byValue = useMemo(() => new Map(all.map((o) => [o.value, o])), [all]);
  const optionOf = (v: string): ComboboxOption => byValue.get(v) ?? { value: v, label: v };

  /* ---------- Filtering ---------- */

  const q = query.trim();
  const needle = q.toLowerCase();
  const groups = useGroups(all, needle);
  const canCreate = creatable && !!q && !all.some((o) => o.label.toLowerCase() === needle);
  const order = [...groups.flatMap((g) => g.options.map((o) => o.value)), ...(canCreate ? [CREATE] : [])];
  const current = active !== null && order.includes(active) ? active : order[0];
  // Each row's id from its place in the list – looked up, not searched, so long lists stay linear
  const orderIndex = new Map(order.map((v, i) => [v, i]));
  const optionId = (v: string) => `${uid}-o${orderIndex.get(v) ?? -1}`;
  // Long lists render only the rows in view
  const win = useListWindow(listRef, open, order.length > WINDOW_FROM);
  const keep = win ? windowRows(groups, win, current) : null;

  /* ---------- Chips: removed ones stay a moment to fold away ---------- */

  // Clean – one line only: as many chips as fit next to the input, the rest hide behind "+N"
  const measure = useRef<HTMLUListElement>(null);
  const chipKey = chips.filter((c) => !c.leaving).map((c) => c.value).join("|");
  const fit = useLineFit(clean, fieldInner, measure, chipKey);

  // Chips past maxVisibleTags (Clean: or past the line) hide behind "+N"; leaving chips keep their spot while they fold
  const max = Math.min(maxVisibleTags ?? Infinity, clean ? fit : Infinity);
  let seen = 0;
  const shownChips = chips.filter((c) => (c.leaving ? seen < max : seen++ < max));
  const hidden = Math.max(0, chips.filter((c) => !c.leaving).length - max);
  // "+N" rolls up or down; it keeps its last number while it fades out. Tracked in state, adjusted while rendering.
  const hiddenRoll = useRoll(hidden, hidden > 0);
  const shownHidden = hidden || hiddenRoll.last;
  const armedMore = !!armed && hidden > 0 && !shownChips.some((c) => c.value === armed);
  const hiddenLabels = hidden ? chips.filter((c) => !c.leaving && !shownChips.includes(c)).map((c) => optionOf(c.value).label) : [];

  // The selected count in the tray slides up or down
  const countRoll = useRoll(selected.length, true);

  /* ---------- Changes ---------- */

  const commit = (next: string[], extra?: ComboboxOption) => {
    if (disabled) return;
    pickedOption.current = extra;
    setSelected(next);
    pickedOption.current = undefined;
  };

  const say = (text: string, count: number) => setAnnounce(multiple ? `${text}. ${count} selected` : text);

  const pick = (o: ComboboxOption) => {
    const on = selected.includes(o.value);
    const next = multiple ? (on ? selected.filter((v) => v !== o.value) : [...selected, o.value]) : [o.value];
    commit(next, o);
    say(`${o.label} ${on && multiple ? "removed" : "selected"}`, next.length);
    setArmed(null);
    if (query) setQuery("");
    if (!multiple) setOpen(false);
  };

  const create = () => {
    if (!disabled) startCreate(q);
  };

  const remove = (v: string) => {
    const next = selected.filter((x) => x !== v);
    commit(next);
    say(`${optionOf(v).label} removed`, next.length);
    setArmed(null);
  };

  const choose = (v: string) => {
    if (v === CREATE) create();
    else pick(optionOf(v));
  };

  /* ---------- Measuring: the field and the list glide to their heights, the highlight to its row ---------- */

  useFieldHeight(field, fieldInner);
  useListHeight(listRef, listInner, open);
  useActivePill({ open, listRef, pillRef, byKeyboard, current, orderKey: order.join("\u0001") });

  // A click outside closes the list
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(false);
        setArmed(null);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, setOpen]);

  /* ---------- Keyboard ---------- */

  const move = (step: number) => {
    if (!order.length) return;
    byKeyboard.current = true;
    setKbd(true);
    const i = Math.max(0, order.indexOf(current));
    setActive(order[(i + step + order.length) % order.length]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Keys typed into an IME (picking a candidate with ↵, moving through it with arrows) belong to the IME
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key !== "Backspace") setArmed(null);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter") {
      if (!open || !current) return;
      e.preventDefault();
      choose(current);
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      } else if (query) setQuery("");
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key === "Backspace" && !query && selected.length) {
      // First press highlights the last chip, the second removes it
      e.preventDefault();
      const last = selected[selected.length - 1];
      if (armed === last) remove(last);
      else {
        setArmed(last);
        setAnnounce(`${optionOf(last).label} – press Backspace again to remove`);
      }
    }
  };

  const onFieldDown = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || (e.target as HTMLElement).closest("button")) return;
    if (e.target !== input.current) e.preventDefault();
    input.current?.focus();
    setArmed(null);
    setOpen(true);
  };

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    onBlurProp?.(e);
    if (root.current?.contains(e.relatedTarget as Node | null)) return;
    setOpen(false);
    setArmed(null);
  };

  // The options – on a white card inside the tray (Standard) or straight in the popover (Clean)
  const listbox = (
    <Listbox
      uid={uid}
      listRef={listRef}
      pillRef={pillRef}
      listInner={listInner}
      multiple={multiple}
      label={label}
      groups={groups}
      selected={selected}
      current={current}
      q={q}
      optionId={optionId}
      keep={keep}
      win={win}
      total={order.length}
      posOf={(v) => orderIndex.get(v) ?? 0}
      emptyText={emptyText}
      canCreate={canCreate}
      creating={creating}
      createLabel={createLabel}
      onPointer={() => setKbd(false)}
      setActive={setActive}
      pick={pick}
      create={create}
    />
  );

  return (
    <div
      {...rest}
      ref={rootRef}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-open={open || undefined}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      data-kbd={kbd || undefined}
      onBlur={onBlur}
    >
      {/* React 19 hoists this into <head> once, no matter how many fields render */}
      <style href="ui-combobox" precedence="default">
        {css}
      </style>

      {label && (
        <label className="ui-cbx__label" id={`${uid}-label`} htmlFor={`${uid}-input`}>
          {label}
        </label>
      )}

      <div ref={field} className="ui-cbx__field" onMouseDown={onFieldDown}>
        <div ref={fieldInner} className="ui-cbx__field-inner">
          {clean && <MeasureChips chips={chips} optionOf={optionOf} measure={measure} />}
          {(clean ? chips.length > 0 : shownChips.length > 0 || maxVisibleTags !== undefined) && (
            <ChipList
              chips={shownChips}
              optionOf={optionOf}
              ready={ready}
              armed={armed}
              disabled={disabled}
              remove={remove}
              more={clean || maxVisibleTags !== undefined}
              hidden={hidden}
              armedMore={armedMore}
              shownHidden={shownHidden}
              rollDir={hiddenRoll.dir}
              hiddenLabels={hiddenLabels}
              onMore={() => {
                input.current?.focus();
                setOpen(true);
              }}
            />
          )}
          <input
            ref={input}
            id={`${uid}-input`}
            className="ui-cbx__input"
            value={query}
            placeholder={selected.length ? undefined : placeholder}
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${uid}-list`}
            aria-autocomplete="list"
            aria-activedescendant={open && current ? optionId(current) : undefined}
            aria-label={label ? undefined : placeholder}
            aria-required={required || undefined}
            aria-invalid={invalid || undefined}
            disabled={disabled}
            onFocus={() => setKbd(true)}
            onChange={(e) => {
              setKbd(true);
              setQuery(e.target.value);
              setActive(null);
              setArmed(null);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
        <button
          type="button"
          className="ui-cbx__toggle"
          tabIndex={-1}
          disabled={disabled}
          aria-label={open ? "Close list" : "Open list"}
          onMouseDown={keepFocus}
          onClick={() => {
            input.current?.focus();
            setOpen((o) => !o);
          }}
        >
          <Glyph d={icons.chevron} />
        </button>
      </div>

      <FormInputs name={name} selected={selected} required={required} disabled={disabled} input={input} />

      {open && !disabled && (
        // Pressing inside the list (also its scrollbar) keeps the focus in the field
        <div className="ui-cbx__pop" onMouseDown={keepFocus}>
          {clean ? listbox : <div className="ui-cbx__card">{listbox}</div>}

          <PopFoot count={selected.length} dir={countRoll.dir} multiple={multiple} />
        </div>
      )}

      <span className="ui-cbx__live" aria-live="polite">
        {announce}
      </span>
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
.ui-cbx:where([data-look="standard"]),
.ui-cbx__portal:where([data-look="standard"]) {
  --_tc-accent-highlight: light-dark(rgba(47, 107, 255, 0.16), rgba(109, 139, 255, 0.26));
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-avatar-font-size: 9px;
  --_tc-avatar-font-weight: 600;
  --_tc-avatar-md: 24px;
  --_tc-avatar-sm: 20px;
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-caption-color: light-dark(#646464, #9a9aa1);
  --_tc-caption-font-size: 12px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0;
  --_tc-caption-transform: none;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #232326);
  --_tc-field-font-size: 13px;
  --_tc-field-h: 36px;
  --_tc-field-radius: 10px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent);
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-invalid: inset 0 0 0 1px light-dark(#e5484d, #ff6369);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12));
  --_tc-focus-ring: light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xl: 16px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
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
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #232326);
  --_tc-menu-item-font-size: 13px;
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-menu-item-px: 10px;
  --_tc-menu-item-radius: 8px;
  --_tc-menu-item-selected-fg: light-dark(#2456d6, #8ab4ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 12px;
  --_tc-menu-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-radius-2xs: 2px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-10: 40px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-placeholder: light-dark(#646464, #8e8e95);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
  --_tc-z-dropdown: 30;
}
.ui-cbx:where([data-look="clean"]),
.ui-cbx__portal:where([data-look="clean"]) {
  --_tc-accent-highlight: light-dark(rgba(0, 96, 226, 0.12), rgba(77, 141, 255, 0.24));
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-avatar-font-size: 9px;
  --_tc-avatar-font-weight: 500;
  --_tc-avatar-md: 24px;
  --_tc-avatar-sm: 20px;
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-caption-color: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-caption-font-size: 10px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0.05em;
  --_tc-caption-transform: uppercase;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #252527);
  --_tc-field-font-size: 13px;
  --_tc-field-h: 32px;
  --_tc-field-radius: 8px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#0060e2, #5b9aff), 0 0 0 3px color-mix(in srgb, light-dark(#0060e2, #5b9aff) 24%, transparent);
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.52));
  --_tc-field-shadow-invalid: inset 0 0 0 1px light-dark(#e5484d, #ff6369);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-focus-ring: light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xl: 16px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
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
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #252527);
  --_tc-menu-item-font-size: 13px;
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-menu-item-px: 8px;
  --_tc-menu-item-radius: 6px;
  --_tc-menu-item-selected-fg: light-dark(#0058cf, #70b8ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 10px;
  --_tc-menu-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-radius-2xs: 2px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-10: 40px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-placeholder: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.5));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
  --_tc-z-dropdown: 30;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Colors and motion as variables – override them on .ui-cbx. Fields, menus and key chips use the pattern tokens */
.ui-cbx {
  position: relative;
  display: block;
  width: 100%;
  max-width: 440px;
  container-type: inline-size;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cbx {
  /* The chip a second Backspace will remove */
  --tc-combobox-chip-border-armed: light-dark(#b5b5b5, #5c5c63);
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cbx {
  /* The chip a second Backspace will remove */
  --tc-combobox-chip-border-armed: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
.ui-cbx *, .ui-cbx *::before, .ui-cbx *::after { box-sizing: border-box; }
:where(.ui-cbx) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where(.ui-cbx) svg { display: block; flex: none; }
.ui-cbx__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__glyph { stroke-width: 1.8; }
/* 16px icons with thin ~1.1px lines */
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__glyph { stroke-width: 1.65; }
.ui-cbx__label { display: block; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__label { margin: 0 0 var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-0-5, var(--_tc-space-0-5)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__label { margin: 0 0 var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-0-5, var(--_tc-space-0-5)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* The field (the reference text field): its edge is the control border, focus a ring plus halo on the whole box. Its
   height glides when chips wrap */
.ui-cbx__field {
  position: relative;
  overflow: hidden;
  border-radius: var(--tc-field-radius, var(--_tc-field-radius));
  background: var(--tc-field-bg, var(--_tc-field-bg));
  box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow));
  cursor: text;
  transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-cbx__field:hover { box-shadow: var(--tc-field-shadow-hover, var(--_tc-field-shadow-hover)); }
.ui-cbx[data-invalid] .ui-cbx__field { box-shadow: var(--tc-field-shadow-invalid, var(--_tc-field-shadow-invalid)); }
.ui-cbx .ui-cbx__field:focus-within { box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
/* Chips sit 4px in from the edge, so the empty field is exactly --tc-field-h tall; the chevron keeps the right end */
.ui-cbx__field-inner { display: flex; align-items: center; min-height: var(--tc-field-h, var(--_tc-field-h)); padding: 4px var(--tc-field-h, var(--_tc-field-h)) 4px 4px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__field-inner { flex-wrap: wrap; row-gap: var(--tc-space-1, var(--_tc-space-1)); }
/* Always one line: chips that don't fit go into "+N" */
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__field-inner { position: relative; flex-wrap: nowrap; overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__measure { position: absolute; top: 0; left: 0; display: flex; width: max-content; margin: 0; padding: 0; list-style: none; visibility: hidden; pointer-events: none; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chips > .ui-cbx__chip { flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__measure > .ui-cbx__chip { flex: none; max-width: none; }
.ui-cbx__chips { display: contents; margin: 0; padding: 0; list-style: none; }
/* Chips: the outer grid folds the width, the body flashes and pops */
.ui-cbx__chip {
  display: grid;
  grid-template-columns: 1fr;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  margin-right: var(--tc-space-1, var(--_tc-space-1));
  transition: grid-template-columns var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-fast, var(--_tc-duration-fast)), margin-right var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-fast, var(--_tc-duration-fast)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-fast, var(--_tc-duration-fast));
}
.ui-cbx__chip[data-leaving] { grid-template-columns: 0fr; margin-right: 0; opacity: 0; pointer-events: none; }
.ui-cbx__chip-body {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  min-width: 0;
  height: calc(var(--tc-field-h, var(--_tc-field-h)) - 8px);
  overflow: hidden;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  white-space: nowrap;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip-body { padding: 0 var(--tc-space-0-5, var(--_tc-space-0-5)) 0 var(--tc-space-1, var(--_tc-space-1)); box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip-body { padding: 0 var(--tc-space-1, var(--_tc-space-1)) 0 var(--tc-space-1, var(--_tc-space-1)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip[data-plain] .ui-cbx__chip-body { padding-left: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip[data-plain] .ui-cbx__chip-body { padding-left: var(--tc-space-2, var(--_tc-space-2)); }
.ui-cbx__chip[data-armed] .ui-cbx__chip-body { background: var(--tc-fill-strong, var(--_tc-fill-strong)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-combobox-chip-border-armed); }
.ui-cbx__chip[data-leaving] .ui-cbx__chip-body { animation: ui-cbx-flash var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) both; }
.ui-cbx__chip-label { min-width: 0; max-width: 168px; overflow: hidden; text-overflow: ellipsis; }
/* The ×: drawn small, but its target is 24 × 24 (2.5.8) */
.ui-cbx__chip-x { position: relative; display: grid; place-items: center; flex: none; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-cbx__chip-x::after { content: ""; position: absolute; top: 50%; left: 50%; width: 24px; height: 24px; transform: translate(-50%, -50%); }
.ui-cbx__chip-x:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip-x { width: 20px; height: 20px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip-x:hover { background: var(--tc-fill-strong, var(--_tc-fill-strong)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip-x .ui-cbx__glyph { width: 13px; height: 13px; stroke-width: 2; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip .ui-cbx__avatar { width: 18px; height: 18px; font-size: 8.5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip .ui-cbx__dot { margin: 0 var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip-x { width: 18px; height: 18px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip-x:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip-x .ui-cbx__glyph { width: 12px; height: 12px; stroke-width: 1.9; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip .ui-cbx__avatar { width: 16px; height: 16px; font-size: 7px; background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip .ui-cbx__dot { margin: 0 1px 0 var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip .ui-cbx__icon { width: 16px; height: 16px; }
/* "+3": folds open and closed like a chip, the number rolls; it names the hidden ones and opens the list */
.ui-cbx__more .ui-cbx__chip-body { color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; }
.ui-cbx__more .ui-cbx__chip-body:hover { background: var(--tc-fill-strong, var(--_tc-fill-strong)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__more .ui-cbx__chip-body { padding: 0 var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__more .ui-cbx__chip-body { padding: 0 var(--tc-space-2, var(--_tc-space-2)); gap: 0; }
.ui-cbx__more { transition-delay: 0ms; }
.ui-cbx__more[data-hidden] { grid-template-columns: 0fr; margin-right: 0; opacity: 0; }
.ui-cbx__roll { display: inline-grid; overflow: hidden; }
.ui-cbx__roll > span { animation: ui-cbx-roll-up var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-cbx__roll > span[data-dir="down"] { animation-name: ui-cbx-roll-down; }
/* The text input: no box of its own – the field around it shows focus */
.ui-cbx__input {
  flex: 1 0 72px;
  min-width: 72px;
  height: calc(var(--tc-field-h, var(--_tc-field-h)) - 8px);
  margin: 0;
  padding: 0 var(--tc-space-1, var(--_tc-space-1)) 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--tc-field-font-size, var(--_tc-field-font-size));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  outline: none;
}
.ui-cbx__input::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); }
/* The chevron: a small ghost button */
.ui-cbx__toggle { position: absolute; top: 4px; right: 4px; display: grid; place-items: center; width: calc(var(--tc-field-h, var(--_tc-field-h)) - 8px); height: calc(var(--tc-field-h, var(--_tc-field-h)) - 8px); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-cbx__toggle:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__toggle { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__toggle { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
.ui-cbx__toggle .ui-cbx__glyph { transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-cbx[data-open] .ui-cbx__toggle .ui-cbx__glyph { transform: rotate(180deg); }
/* Avatars, dots, icons */
.ui-cbx__avatar {
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 50%;
  object-fit: cover;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  font-size: var(--tc-avatar-font-size, var(--_tc-avatar-font-size));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  font-weight: var(--tc-avatar-font-weight, var(--_tc-avatar-font-weight));
  letter-spacing: 0.02em;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__avatar { width: var(--tc-avatar-md, var(--_tc-avatar-md)); height: var(--tc-avatar-md, var(--_tc-avatar-md)); background: var(--tc-fill-strong, var(--_tc-fill-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__avatar { width: var(--tc-avatar-sm, var(--_tc-avatar-sm)); height: var(--tc-avatar-sm, var(--_tc-avatar-sm)); background: var(--tc-fill-default, var(--_tc-fill-default)); }
.ui-cbx__dot { flex: none; width: 8px; height: 8px; margin: 0 var(--tc-space-1, var(--_tc-space-1)); border-radius: 50%; }
.ui-cbx__icon { display: grid; place-items: center; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__icon { width: 18px; height: 18px; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__icon { width: 20px; height: 20px; color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
.ui-cbx__icon svg { width: 16px; height: 16px; }
/* The list: a menu popover. Standard sets the menu card on a tray whose last row is the count and keys */
.ui-cbx__pop {
  position: absolute;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  transform-origin: top center;
  animation: ui-cbx-open var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__pop { padding: var(--tc-tray-inset, var(--_tc-tray-inset)); border-radius: var(--tc-tray-radius, var(--_tc-tray-radius)); background: var(--tc-surface-tray, var(--_tc-surface-tray)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__card { overflow: hidden; border-radius: calc(var(--tc-tray-radius, var(--_tc-tray-radius)) - var(--tc-tray-inset, var(--_tc-tray-inset))); background: var(--tc-menu-bg, var(--_tc-menu-bg)); box-shadow: 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); }
/* Clean: one popover with the count and keys as its last row */
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__pop { overflow: hidden; border-radius: var(--tc-menu-radius, var(--_tc-menu-radius)); background: var(--tc-menu-bg, var(--_tc-menu-bg)); }
.ui-cbx__list { position: relative; max-height: 300px; padding: var(--tc-menu-padding, var(--_tc-menu-padding)); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
/* The active row – the one ↵ picks. While the keyboard drives the list it also gets the focus ring */
.ui-cbx__pill {
  position: absolute;
  top: 0;
  left: var(--tc-menu-padding, var(--_tc-menu-padding));
  right: var(--tc-menu-padding, var(--_tc-menu-padding));
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  background: var(--tc-menu-item-hover, var(--_tc-menu-item-hover));
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), height var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* Clean: a short, crisp move between rows – no long glide */
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__pill { transition-duration: var(--tc-duration-instant, var(--_tc-duration-instant)), var(--tc-duration-instant, var(--_tc-duration-instant)), var(--tc-duration-fast, var(--_tc-duration-fast)), var(--tc-duration-fast, var(--_tc-duration-fast)); }
.ui-cbx[data-kbd] .ui-cbx__field:focus-within ~ .ui-cbx__pop .ui-cbx__pill { box-shadow: inset 0 0 0 var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) var(--tc-focus-ring, var(--_tc-focus-ring)); }
.ui-cbx__group-label {
  padding: 8px var(--tc-menu-item-px, var(--_tc-menu-item-px)) 4px;
  font-size: var(--tc-caption-font-size, var(--_tc-caption-font-size));
  font-weight: var(--tc-caption-font-weight, var(--_tc-caption-font-weight));
  line-height: var(--tc-caption-line-height, var(--_tc-caption-line-height));
  letter-spacing: var(--tc-caption-tracking, var(--_tc-caption-tracking));
  text-transform: var(--tc-caption-transform, var(--_tc-caption-transform));
  color: var(--tc-caption-color, var(--_tc-caption-color));
}
.ui-cbx__group:first-child .ui-cbx__group-label { padding-top: var(--tc-space-1, var(--_tc-space-1)); }
.ui-cbx__option { position: relative; display: flex; align-items: center; height: var(--tc-menu-item-h, var(--_tc-menu-item-h)); padding: 0 var(--tc-menu-item-px, var(--_tc-menu-item-px)); border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius)); font-size: var(--tc-menu-item-font-size, var(--_tc-menu-item-font-size)); cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__option { gap: var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__option { gap: var(--tc-space-2, var(--_tc-space-2)); }
.ui-cbx__text { display: flex; flex: 1; align-items: baseline; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; }
/* The name wins over the hint when space runs out */
.ui-cbx__name { flex: 0 0 auto; max-width: 100%; min-width: 0; overflow: hidden; color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
.ui-cbx__hint { flex: 0 100 auto; min-width: 0; overflow: hidden; color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__hint { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__hint { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
.ui-cbx mark { border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-accent-highlight, var(--_tc-accent-highlight)); color: inherit; }
/* Picked: the check in the menu's selected colour. It pops in with a small spring and fades out quickly */
.ui-cbx__check { width: 16px; height: 16px; margin-left: auto; color: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg)); opacity: 0; transform: scale(0.4); transition: opacity var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__check { stroke-width: 2.2; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__check { stroke-width: 1.8; }
.ui-cbx__option[aria-selected="true"] .ui-cbx__check { opacity: 1; transform: none; transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-spring, var(--_tc-ease-spring)); }
.ui-cbx__empty { text-align: center; color: var(--tc-text-muted, var(--_tc-text-muted)); animation: ui-cbx-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__empty { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__empty { padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)); }
.ui-cbx__create { animation: ui-cbx-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-cbx__plus { display: grid; place-items: center; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__plus { width: 24px; height: 24px; border-radius: 50%; color: var(--tc-text-muted, var(--_tc-text-muted)); box-shadow: inset 0 0 0 1px var(--tc-border-strong, var(--_tc-border-strong)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__plus .ui-cbx__glyph { width: 13px; height: 13px; stroke-width: 2; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__plus { width: 20px; height: 20px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-fill-strong, var(--_tc-fill-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__plus .ui-cbx__glyph { width: 12px; height: 12px; stroke-width: 1.9; }
/* Standard: the tray below the card · Clean: the popover's last row, under a hairline */
.ui-cbx__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); height: 32px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__foot { padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__foot { padding: 0 var(--tc-space-3, var(--_tc-space-3)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
.ui-cbx__count { display: inline-flex; font-variant-numeric: tabular-nums; }
.ui-cbx__keys { display: inline-flex; align-items: center; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__keys { gap: var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__keys { gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
.ui-cbx kbd {
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
.ui-cbx__keys > span { margin: 0 var(--tc-space-1-5, var(--_tc-space-1-5)) 0 var(--tc-space-0-5, var(--_tc-space-0-5)); }
.ui-cbx__keys > span:last-child { margin-right: 0; }
.ui-cbx__live, .ui-cbx__proxy { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-cbx__proxy { bottom: 0; left: 50%; padding: 0; border: 0; opacity: 0; pointer-events: none; }
.ui-cbx[data-disabled] .ui-cbx__field { opacity: 0.55; cursor: not-allowed; }
.ui-cbx[data-disabled] .ui-cbx__field * { cursor: not-allowed; }
@keyframes ui-cbx-open { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes ui-cbx-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes ui-cbx-flash { 0% { background-color: var(--tc-fill-default, var(--_tc-fill-default)); } 35% { background-color: var(--tc-fill-strong, var(--_tc-fill-strong)); } 100% { background-color: var(--tc-fill-strong, var(--_tc-fill-strong)); transform: scale(0.92); } }
@keyframes ui-cbx-roll-up { from { opacity: 0; transform: translateY(70%); } to { opacity: 1; transform: none; } }
@keyframes ui-cbx-roll-down { from { opacity: 0; transform: translateY(-70%); } to { opacity: 1; transform: none; } }
/* Narrow (phones): no key hints, chips may use the full width; the text field fits next to a chip */
@container (max-width: 380px) {
  .ui-cbx__keys { display: none; }
  .ui-cbx__chip-label { max-width: 132px; }
  .ui-cbx__input { flex-basis: 44px; min-width: 44px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__hint { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); }
}
/* Touch screens: bigger rows, chips and buttons; 16px text so iOS doesn't zoom in */
@media (hover: none) and (pointer: coarse) {
  .ui-cbx__chip-body { height: 32px; }
  .ui-cbx__chip-x { width: 26px; height: 26px; }
  .ui-cbx__input { height: 32px; font-size: var(--tc-font-size-xl, var(--_tc-font-size-xl)); }
  .ui-cbx__toggle { width: 32px; height: 32px; }
  .ui-cbx__option { height: 44px; }
  .ui-cbx__list { max-height: 340px; }
  .ui-cbx__keys { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__field-inner { min-height: 44px; padding-right: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__field-inner { min-height: 40px; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-10, var(--_tc-space-10)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1, var(--_tc-space-1)); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-cbx *, .ui-cbx *::before, .ui-cbx *::after { animation: none !important; transition: none !important; }
}
`;

"use client";

/*
 * Breakdown Chart – a stacked bar chart with a linked table, in a single self-contained file.
 * Pick what to measure, how to slice the bars and how to segment them; hover a bar or a row to see its breakdown,
 * click legend entries to hide segments. The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: breakdown-chart.tsx is Standard,
 * breakdown-chart-clean.tsx is Clean). Clean has no tray – one white card with the title and total on top, quiet
 * white pickers, hairline gridlines, blue-family bars, small white popovers for the menus and the hover breakdown,
 * and the legend as the card's last row. Its icons are a touch larger and thinner.
 * The hover breakdown also opens when a bar has focus, stays while the pointer moves onto it and closes with Esc; the
 * table holds the same numbers for screen readers (and scrolls by keyboard when it is wider than the card).
 */
// Generated from src/components/breakdown-chart.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-bc";

export type Dimension = {
  key: string;
  label: string;
  /** Values in display order */
  values: string[];
  /** Colors per value, used when this dimension segments the bars */
  colors?: Record<string, string>;
  /** Small icon per value, shown under the bars and in the table */
  icons?: Record<string, ReactNode>;
};

export type Measure = {
  key: string;
  label: string;
  /** Unit after the total, e.g. "tasks" or "points" */
  unit: string;
  /** Field to sum – leave empty to count records */
  field?: string;
};

export type BreakdownRecord = Record<string, string | number>;

type OwnProps = {
  /** Visual style. Defaults to the file's look: Standard in breakdown-chart.tsx, Clean in breakdown-chart-clean.tsx */
  look?: Look;
  records: BreakdownRecord[];
  dimensions: Dimension[];
  measures: Measure[];
  title?: string;
  /** Measure key (controlled). Leave undefined and use `defaultMeasure` to let the chart keep it */
  measure?: string;
  defaultMeasure?: string;
  onMeasureChange?: (measure: string) => void;
  /** Dimension key the bars are sliced by (controlled) */
  slice?: string;
  defaultSlice?: string;
  onSliceChange?: (slice: string) => void;
  /** Dimension key the bars are segmented by, or "none" for single-color bars (controlled) */
  segment?: string;
  /** Dimension key, or "none" for single-color bars */
  defaultSegment?: string;
  onSegmentChange?: (segment: string) => void;
  /** Segment values hidden from the bars and totals (controlled); picking another segment clears it */
  hidden?: string[];
  defaultHidden?: string[];
  onHiddenChange?: (hidden: string[]) => void;
  className?: string;
  ref?: Ref<HTMLElement>;
};

export type BreakdownChartProps = Omit<ComponentPropsWithoutRef<"section">, keyof OwnProps> & OwnProps;

/** Segment colors per look – Clean: the accent blue (rgba(0, 96, 226, .765) on white) and its lighter tints, then the status colors */
const palettes: Record<Look, string[]> = {
  standard: ["#2f6bff", "#8b5cf6", "#ec4899", "#7aa2ff", "#c4b5fd", "#a3a3a3", "#f9a8d4"],
  clean: ["#3c85e9", "#5b5bd6", "#80b0f1", "#1a9a52", "#e8a20c", "#e5484d", "#b3cff6"],
};
/** Single-color bars (no segment) */
const unsegmentedColor: Record<Look, string> = { standard: "#2f6bff", clean: palettes.clean[0] };

/** A clean axis top: 10, 20, 50, 100 … split into five steps */
function niceMax(max: number) {
  if (max <= 0) return 5;
  const raw = max / 5;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= raw)! * pow;
  return step * 5;
}

// One formatter for the file – toLocaleString would build a new Intl.NumberFormat on every call
const INTEGER = new Intl.NumberFormat("en-US");
const fmt = (n: number) => (Number.isInteger(n) ? INTEGER.format(n) : n.toFixed(1));

/** The single segment of unsegmented bars – a stable array, so it doesn't bust the table memo every render */
const UNSEGMENTED = ["All"];
const NO_HIDDEN: string[] = [];
/** Used when no measures are passed: count records */
const COUNT: Measure = { key: "", label: "Count", unit: "" };
/** Used when no dimensions are passed: no bars */
const NO_DIMENSION: Dimension = { key: "", label: "", values: [] };

export function BreakdownChart({
  look,
  records,
  dimensions,
  measures,
  title = "Workload",
  measure: measureProp,
  defaultMeasure,
  onMeasureChange,
  slice: sliceProp,
  defaultSlice,
  onSliceChange,
  segment: segmentProp,
  defaultSegment,
  onSegmentChange,
  hidden: hiddenProp,
  defaultHidden = NO_HIDDEN,
  onHiddenChange,
  className,
  ref,
  ...rest
}: BreakdownChartProps) {
  const [measureKey, setMeasure] = useControllable(measureProp, defaultMeasure ?? measures[0]?.key ?? "", onMeasureChange);
  const [sliceKey, setSlice] = useControllable(sliceProp, defaultSlice ?? dimensions[0]?.key ?? "", onSliceChange);
  const [segmentKey, setSegment] = useControllable(segmentProp, defaultSegment ?? dimensions[1]?.key ?? "none", onSegmentChange);
  const [hiddenList, setHiddenList] = useControllable(hiddenProp, defaultHidden, onHiddenChange);
  const [hover, setHover] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const morphRef = useSmoothHeight(tableRef);
  const tipId = useId();
  // The table scrolls sideways when it is wider than the card – then it is a tab stop, so the keyboard can scroll it
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const wrap = tableRef.current;
    if (!wrap || typeof ResizeObserver !== "function") return;
    const check = () => setScrolls(wrap.scrollWidth > wrap.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(wrap);
    if (wrap.firstElementChild) ro.observe(wrap.firstElementChild);
    return () => ro.disconnect();
  }, []);
  // Esc closes the hover breakdown without moving focus (1.4.13)
  useEffect(() => {
    if (hover === null) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setHover(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hover]);

  const measure = measures.find((m) => m.key === measureKey) ?? measures[0] ?? COUNT;
  // No dimensions: nothing to slice by, so the chart renders empty instead of crashing
  const slice: Dimension = dimensions.find((d) => d.key === sliceKey) ?? dimensions[0] ?? NO_DIMENSION;
  const segment = segmentKey === "none" ? null : dimensions.find((d) => d.key === segmentKey) ?? null;
  const segValues = segment ? segment.values : UNSEGMENTED;
  // Only values of the current segment count as hidden
  const hidden = useMemo(() => new Set(hiddenList.filter((v) => segValues.includes(v))), [hiddenList, segValues]);
  const setHidden = (next: Set<string>) => setHiddenList([...next]);
  const resolvedLook = look ?? DEFAULT_LOOK;
  const palette = palettes[resolvedLook];
  const color = (v: string, i: number) => segment?.colors?.[v] ?? (segment ? palette[i % palette.length] : unsegmentedColor[resolvedLook]);

  // Picking another segment shows every value again
  const changeSegment = (v: string) => {
    if (v === segmentKey) return;
    setSegment(v);
    if (hiddenList.length) setHiddenList(NO_HIDDEN);
  };

  /** value per slice and segment */
  const table = useMemo(() => {
    const rows = slice.values.map((sv) => {
      const cells: Record<string, number> = {};
      for (const seg of segValues) cells[seg] = 0;
      for (const r of records) {
        // Compare as strings, like the segments: numeric fields (e.g. a year) match their string values
        if (String(r[slice.key]) !== sv) continue;
        const seg = segment ? String(r[segment.key]) : "All";
        if (!(seg in cells)) continue;
        cells[seg] += measure.field ? Number(r[measure.field]) || 0 : 1;
      }
      const total = segValues.reduce((sum, seg) => sum + (hidden.has(seg) ? 0 : cells[seg]), 0);
      return { value: sv, cells, total };
    });
    return rows;
  }, [records, slice, segment, segValues, measure, hidden]);

  const grand = table.reduce((s, r) => s + r.total, 0);
  const max = niceMax(Math.max(0, ...table.map((r) => r.total)));
  const ticks = [5, 4, 3, 2, 1, 0].map((i) => (max / 5) * i);
  const hovered = table.find((r) => r.value === hover) ?? null;
  const hoverIndex = hovered ? table.indexOf(hovered) : -1;

  const toggle = (seg: string) => {
    const next = new Set(hidden);
    if (next.has(seg)) next.delete(seg);
    else if (next.size < segValues.length - 1) next.add(seg);
    setHidden(next);
  };

  const dimensionOptions = dimensions.map((d) => ({ value: d.key, label: d.label }));

  const body = (
    <>
          <div className="ui-bc__controls">
            <Select look={resolvedLook} label="Measure" value={measureKey} onChange={setMeasure} options={measures.map((m) => ({ value: m.key, label: m.label }))} />
            <Select
              look={resolvedLook}
              label="Slice"
              value={sliceKey}
              onChange={(v) => {
                setSlice(v);
                if (v === segmentKey) changeSegment("none");
              }}
              options={dimensionOptions}
            />
            <Select
              look={resolvedLook}
              label="Segment"
              value={segmentKey}
              onChange={changeSegment}
              options={[{ value: "none", label: "None" }, ...dimensionOptions.filter((o) => o.value !== sliceKey)]}
            />
          </div>

          <div className="ui-bc__chart" onPointerLeave={() => setHover(null)}>
            <div className="ui-bc__plot">
              {ticks.map((t) => (
                <span key={t} className="ui-bc__grid" style={{ bottom: `${(t / max) * 100}%` }} data-zero={t === 0 || undefined}>
                  <span className="ui-bc__tick">{fmt(t)}</span>
                </span>
              ))}
              <div className="ui-bc__bars" style={{ gridTemplateColumns: `repeat(${table.length}, minmax(0, 1fr))` }}>
                {table.map((row) => (
                  <button
                    key={row.value}
                    type="button"
                    className="ui-bc__col"
                    data-dim={(hover && hover !== row.value) || undefined}
                    data-active={hover === row.value || undefined}
                    aria-label={`${row.value}: ${fmt(row.total)} ${measure.unit}`}
                    aria-describedby={hover === row.value && segment ? tipId : undefined}
                    onPointerEnter={() => setHover(row.value)}
                    onFocus={() => setHover(row.value)}
                    onBlur={() => setHover(null)}
                  >
                    {/* The empty part above the bar – only shown for the hovered bar */}
                    <span className="ui-bc__rest" style={{ bottom: `${(row.total / max) * 100}%` }} />
                    <span className="ui-bc__bar" style={{ height: `${(row.total / max) * 100}%` }}>
                      {segValues.map((seg, i) =>
                        hidden.has(seg) || !row.cells[seg] ? null : (
                          <span key={seg} className="ui-bc__seg" style={{ flexGrow: row.cells[seg], background: color(seg, i) }} />
                        ),
                      )}
                    </span>
                  </button>
                ))}
              </div>

              {hovered && (
                // Not a live region: it follows the pointer. The focused bar points at it with aria-describedby
                <div
                  id={tipId}
                  className="ui-bc__tooltip"
                  style={{ left: `${((hoverIndex + 0.5) / table.length) * 100}%` }}
                  data-side={(hoverIndex + 0.5) / table.length > 0.5 ? "left" : "right"}
                >
                  <p className="ui-bc__tip-head">
                    <span className="ui-bc__tip-label">
                      {slice.icons?.[hovered.value]}
                      {hovered.value}
                    </span>
                    <strong>{fmt(hovered.total)}</strong>
                  </p>
                  {segment && (
                    <ul>
                      {segValues
                        .map((seg, i) => ({ seg, i, v: hovered.cells[seg] }))
                        .filter((x) => x.v && !hidden.has(x.seg))
                        .sort((a, b) => b.v - a.v)
                        .map((x) => (
                          <li key={x.seg}>
                            <span className="ui-bc__swatch" style={{ background: color(x.seg, x.i) }} />
                            <span className="ui-bc__tip-seg">{x.seg}</span>
                            <span className="ui-bc__tip-num">{fmt(x.v)}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="ui-bc__xaxis" style={{ gridTemplateColumns: `repeat(${table.length}, minmax(0, 1fr))` }}>
              {table.map((row) => (
                <span key={row.value} className="ui-bc__xlabel" data-active={hover === row.value || undefined} title={row.value}>
                  {hover === row.value ? (
                    <span className="ui-bc__pill">
                      {slice.icons?.[row.value]}
                      {row.value}
                    </span>
                  ) : (
                    slice.icons?.[row.value] ?? <span className="ui-bc__xtext">{row.value}</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="ui-bc__morph" ref={morphRef}>
            <div
              className="ui-bc__table-wrap"
              ref={tableRef}
              role={scrolls ? "region" : undefined}
              aria-label={scrolls ? `${title} table` : undefined}
              tabIndex={scrolls ? 0 : undefined}
            >
            <table className="ui-bc__table">
              <thead>
                <tr>
                  <th scope="col">{slice.label}</th>
                  <th scope="col" data-num>
                    {measure.label}
                  </th>
                  {segment &&
                    segValues.map((seg, i) => (
                      <th key={seg} scope="col" data-num data-hidden={hidden.has(seg) || undefined}>
                        <span className="ui-bc__th-seg">
                          <span className="ui-bc__swatch" style={{ background: color(seg, i) }} />
                          {seg}
                        </span>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {table.map((row) => (
                  <tr
                    key={row.value}
                    data-active={hover === row.value || undefined}
                    onPointerEnter={() => setHover(row.value)}
                    onPointerLeave={() => setHover(null)}
                  >
                    <th scope="row">
                      <span className="ui-bc__row-label">
                        {slice.icons?.[row.value]}
                        {row.value}
                      </span>
                    </th>
                    <td data-num data-total>
                      {fmt(row.total)}
                    </td>
                    {segment &&
                      segValues.map((seg) => (
                        <td key={seg} data-num data-hidden={hidden.has(seg) || undefined}>
                          {fmt(row.cells[seg])}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
    </>
  );

  return (
    <>
      <style href="ui-breakdown-chart" precedence="default">
        {css}
      </style>
      <section aria-label={title} {...rest} ref={ref} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook}>
        <header className="ui-bc__head">
          <span className="ui-bc__title">{title}</span>
          <span className="ui-bc__total">
            <strong>{fmt(grand)}</strong> {measure.unit}
          </span>
        </header>

        {/* Standard sets the pickers, chart and table on a card on the tray; Clean is one card already */}
        {resolvedLook === "clean" ? body : <div className="ui-bc__card">{body}</div>}

        {/* Clean: the last row of the card – legend chips toggle segments */}
        <footer className="ui-bc__foot">
          {segment ? (
            <div className="ui-bc__legend" role="group" aria-label={`${segment.label} – click to show or hide`}>
              {segValues.map((seg, i) => (
                <button key={seg} type="button" className="ui-bc__chip" aria-pressed={!hidden.has(seg)} onClick={() => toggle(seg)}>
                  <span className="ui-bc__swatch" style={{ background: color(seg, i) }} />
                  {seg}
                </button>
              ))}
            </div>
          ) : (
            <span className="ui-bc__hint">Pick a segment to split the bars</span>
          )}
          {hidden.size > 0 && (
            <button type="button" className="ui-bc__reset" onClick={() => setHidden(new Set())}>
              Show all
            </button>
          )}
        </footer>
      </section>
    </>
  );
}

/**
 * Small dropdown with a label above it – a listbox popup: ↓/↑ (or Enter/Space) on the button open it on the picked
 * option, ↑ ↓ Home End move, Enter/Space/click pick, Esc closes; both return focus to the button. Tab or a click
 * outside closes it
 */
function Select({
  look,
  label,
  value,
  options,
  onChange,
}: {
  look: Look;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [open]);
  // Focus goes back to the button before the menu (and the focused option) unmounts
  const close = () => {
    button.current?.focus();
    setOpen(false);
  };
  const current = options.find((o) => o.value === value)?.label ?? value;
  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]')];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const to = { ArrowDown: Math.min(items.length - 1, i + 1), ArrowUp: Math.max(0, i - 1), Home: 0, End: items.length - 1 }[e.key];
    if (to !== undefined) {
      e.preventDefault();
      items[to]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") setOpen(false);
  };
  return (
    <div
      className="ui-bc__select"
      ref={ref}
      onBlur={(e) => {
        if (open && !ref.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <span className="ui-bc__select-label" id={id}>
        {label}
      </span>
      <button
        ref={button}
        type="button"
        className="ui-bc__select-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        aria-labelledby={`${id} ${id}-value`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span id={`${id}-value`}>{current}</span>
        <ChevronIcon look={look} />
      </button>
      {open && (
        <div className="ui-bc__menu" id={`${id}-menu`} role="listbox" aria-labelledby={id} onKeyDown={onMenuKey}>
          {options.map((o, i) => (
            <button
              key={o.value}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={o.value === value}
              className="ui-bc__option"
              autoFocus={o.value === value || (i === 0 && !options.some((x) => x.value === value))}
              onClick={() => {
                onChange(o.value);
                close();
              }}
            >
              <span>{o.label}</span>
              {o.value === value && <CheckIcon look={look} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Icon size per look – Clean draws them a touch larger and thinner */
const iconSize = (look: Look) => (look === "clean" ? 16 : 14);

const ChevronIcon = ({ look }: { look: Look }) => (
  <svg viewBox="0 0 16 16" width={iconSize(look)} height={iconSize(look)} fill="none" stroke="currentColor" strokeWidth={look === "clean" ? 1.1 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m4.5 6.25 3.5 3.5 3.5-3.5" />
  </svg>
);
const CheckIcon = ({ look }: { look: Look }) => (
  <svg viewBox="0 0 16 16" width={iconSize(look)} height={iconSize(look)} fill="none" stroke="currentColor" strokeWidth={look === "clean" ? 1.3 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m3.5 8.5 3 3 6-7" />
  </svg>
);

/** Small status icons – exported for your own status values */
export const StatusIcon = ({
  kind,
  color = "currentColor",
  look = DEFAULT_LOOK,
}: {
  kind: "backlog" | "todo" | "progress" | "review" | "done" | "canceled";
  color?: string;
  /** Visual style. Defaults to the file's look: Standard in breakdown-chart.tsx, Clean in breakdown-chart-clean.tsx */
  look?: Look;
}) => (
  <svg
    viewBox="0 0 16 16"
    width={look === "clean" ? 16 : 15}
    height={look === "clean" ? 16 : 15}
    fill="none"
    stroke={color}
    strokeWidth={look === "clean" ? 1.1 : 1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {kind === "backlog" && <path d="M2.5 9.5 4 3.5h8l1.5 6M2.5 9.5v3h11v-3M2.5 9.5H6l.8 1.5h2.4l.8-1.5h3.5" />}
    {kind === "todo" && <rect x="3" y="3" width="10" height="10" rx="2.5" />}
    {kind === "progress" && (
      <>
        <circle cx="8" cy="8" r="5.5" />
        <path d="M8 5v3l2 1.5" />
      </>
    )}
    {kind === "review" && (
      <>
        <path d="M1.8 8S4 3.8 8 3.8 14.2 8 14.2 8 12 12.2 8 12.2 1.8 8 1.8 8Z" />
        <circle cx="8" cy="8" r="1.8" />
      </>
    )}
    {kind === "done" && (
      <>
        <rect x="2.5" y="2.5" width="11" height="11" rx="3" fill={color} stroke="none" />
        <path d="m5.5 8.2 1.8 1.8 3.3-3.6" stroke="#fff" strokeWidth={look === "clean" ? 1.3 : 1.5} />
      </>
    )}
    {kind === "canceled" && (
      <>
        <circle cx="8" cy="8" r="5.5" />
        <path d="m4.2 11.8 7.6-7.6" />
      </>
    )}
  </svg>
);

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

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-bc:where([data-look="standard"]),
.ui-bc__portal:where([data-look="standard"]) {
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-border-subtle: light-dark(#f0f0f0, rgba(255, 255, 255, 0.06));
  --_tc-caption-color: light-dark(#646464, #9a9aa1);
  --_tc-caption-font-size: 12px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0;
  --_tc-caption-transform: none;
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-h-sm: 28px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #232326);
  --_tc-field-font-size: 13.5px;
  --_tc-field-h: 36px;
  --_tc-field-px: 12px;
  --_tc-field-radius: 10px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
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
  --_tc-radius-full: 999px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-control: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-overlay: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
  --_tc-z-dropdown: 30;
}
.ui-bc:where([data-look="clean"]),
.ui-bc__portal:where([data-look="clean"]) {
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-border-subtle: light-dark(rgba(0, 0, 0, 0.045), rgba(255, 255, 255, 0.05));
  --_tc-caption-color: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-caption-font-size: 10px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0.05em;
  --_tc-caption-transform: uppercase;
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-h-sm: 24px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #252527);
  --_tc-field-font-size: 13px;
  --_tc-field-h: 32px;
  --_tc-field-px: 10px;
  --_tc-field-radius: 8px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.52));
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
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
  --_tc-radius-full: 999px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-control: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-overlay: light-dark(#ffffff, #252527);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
  --_tc-z-dropdown: 30;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Colors and motion as variables – override them on .ui-bc */
.ui-bc {
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
}
/* Like the Chat Composer: a tray with heading and legend, the card sits on top of it */
:where([data-look="standard"], [data-look="standard"] *).ui-bc {
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
}
/* One white card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-bc {
  position: relative;
  container-type: inline-size;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
}
.ui-bc *, .ui-bc *::before, .ui-bc *::after { box-sizing: border-box; }
:where(.ui-bc) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where(.ui-bc) svg { display: block; flex: none; }
.ui-bc button:focus-visible, .ui-bc__table-wrap:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
/* Title and total */
.ui-bc__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__head { padding: 11px 18px 10px; font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__head { padding: 14px 16px 0; }
.ui-bc__title { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__title { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; text-overflow: ellipsis; }
.ui-bc__total { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__total { flex: none; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
.ui-bc__total strong { font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__total strong { line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__card { overflow: hidden; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
/* Pickers: select fields with a label above */
.ui-bc__controls { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__controls { gap: 10px; padding: 16px 18px 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__controls { gap: 8px; padding: 12px 16px 0; }
.ui-bc__select { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__select { gap: 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__select { gap: 4px; }
.ui-bc__select-label { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__select-label { padding-left: 2px; }
.ui-bc__select-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: var(--tc-field-h, var(--_tc-field-h));
  padding: 0 8px 0 var(--tc-field-px, var(--_tc-field-px));
  border-radius: var(--tc-field-radius, var(--_tc-field-radius));
  background: var(--tc-field-bg, var(--_tc-field-bg));
  box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow));
  font-size: var(--tc-field-font-size, var(--_tc-field-font-size));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-align: left;
  transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-bc__select-btn:hover { box-shadow: var(--tc-field-shadow-hover, var(--_tc-field-shadow-hover)); }
.ui-bc__select-btn span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-bc__select-btn svg { flex: none; transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__select-btn svg { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__select-btn svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
.ui-bc__select-btn[aria-expanded="true"] svg { transform: rotate(180deg); }
/* The menu (the reference menu): rows with the picked one in the selected colour and a ✓ */
.ui-bc__menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  display: grid;
  min-width: 140px;
  padding: var(--tc-menu-padding, var(--_tc-menu-padding));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  transform-origin: top center;
  animation: ui-bc-drop var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-bc__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: var(--tc-menu-item-h, var(--_tc-menu-item-h));
  padding: 0 var(--tc-menu-item-px, var(--_tc-menu-item-px));
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  font-size: var(--tc-menu-item-font-size, var(--_tc-menu-item-font-size));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-align: left;
  white-space: nowrap;
}
.ui-bc__option span { overflow: hidden; text-overflow: ellipsis; }
.ui-bc__option:hover, .ui-bc__option:focus-visible { background: var(--tc-menu-item-hover, var(--_tc-menu-item-hover)); }
/* The option with focus: the ring inside the row, so the menu's edge doesn't clip it */
.ui-bc .ui-bc__option:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width, var(--_tc-focus-ring-width))); }
.ui-bc__option[aria-selected="true"] { color: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
/* Chart: a grid, the scale on the right, stacked bars */
:where([data-look="standard"], [data-look="standard"] *).ui-bc__chart { padding: 22px 18px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__chart { padding: 20px 16px 10px; }
.ui-bc__plot { position: relative; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__plot { height: 200px; margin-right: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__plot { height: 196px; margin-right: 28px; }
.ui-bc__grid { position: absolute; left: 0; right: 0; height: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__grid { border-top: 1px dashed var(--tc-border-subtle, var(--_tc-border-subtle)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__grid[data-zero] { border-top-style: solid; border-color: var(--tc-border-strong, var(--_tc-border-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__grid { border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-border-subtle, var(--_tc-border-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__grid[data-zero] { border-color: var(--tc-border-strong, var(--_tc-border-strong)); }
.ui-bc__tick { position: absolute; top: -8px; font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); text-align: right; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__tick { right: -30px; width: 26px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tick { right: -28px; width: 24px; }
.ui-bc__bars { position: absolute; inset: 0; display: grid; gap: 4px; }
.ui-bc__col { position: relative; display: flex; align-items: flex-end; justify-content: center; height: 100%; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-bc .ui-bc__col:focus-visible { outline-offset: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__col:focus-visible { border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); }
/* Hover: the other bars fade back, the hovered one shows its empty rest up to the top */
:where([data-look="standard"], [data-look="standard"] *).ui-bc__col[data-dim] { opacity: 0.38; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__col[data-dim] { opacity: 0.35; }
.ui-bc__rest { position: absolute; top: 0; left: 50%; opacity: 0; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), bottom var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__rest { width: 10px; margin-left: -5px; background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__rest { width: 12px; margin-left: -6px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)) var(--tc-radius-2xs, var(--_tc-radius-2xs)) 0 0; background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
.ui-bc__col[data-active] .ui-bc__rest { opacity: 1; }
.ui-bc__bar { position: relative; display: flex; flex-direction: column-reverse; gap: 1px; min-height: 0; overflow: hidden; transition: height var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__bar { width: 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__bar { width: 12px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)) var(--tc-radius-2xs, var(--_tc-radius-2xs)) 0 0; }
.ui-bc__seg { flex-basis: 0; min-height: 2px; transition: flex-grow var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)), background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* The hover breakdown: a small popover beside the bar at the top of the plot, so it never leaves the card – flips on
   the right half. The pointer can move onto it (a bridge covers the gap to the bar) */
.ui-bc__tooltip {
  position: absolute;
  z-index: 4;
  top: 0;
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  transition: left var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
  animation: ui-bc-pop var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-bc__tooltip::before { content: ""; position: absolute; top: 0; bottom: 0; width: var(--tc-breakdown-chart-tip-gap); }
.ui-bc__tooltip[data-side="right"] { transform: translateX(var(--tc-breakdown-chart-tip-gap)); }
.ui-bc__tooltip[data-side="right"]::before { right: 100%; }
.ui-bc__tooltip[data-side="left"] { transform: translateX(calc(-100% - var(--tc-breakdown-chart-tip-gap))); }
.ui-bc__tooltip[data-side="left"]::before { left: 100%; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__tooltip { --tc-breakdown-chart-tip-gap: 22px; min-width: 150px; padding: 9px 11px 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tooltip { --tc-breakdown-chart-tip-gap: 18px; min-width: 152px; padding: 6px 10px 8px; }
.ui-bc__tip-head { display: flex; align-items: center; justify-content: space-between; margin: 0; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__tip-head { gap: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tip-head { gap: 16px; color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tip-head strong { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
.ui-bc__tip-label { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.ui-bc__tooltip ul { display: grid; border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__tooltip ul { gap: 2px; margin: 6px 0 0; padding: 6px 0 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tooltip ul { gap: 0; margin: 4px 0 0; padding: 4px 0 0; }
.ui-bc__tooltip li { display: flex; align-items: center; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__tooltip li { gap: 7px; line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tooltip li { gap: 8px; line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
.ui-bc__tip-seg { flex: 1; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tip-num { color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-bc__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); }
/* The x axis: icons or names; the hovered bar's label grows into a pill with its name */
.ui-bc__xaxis { display: grid; gap: 4px; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__xaxis { margin: 8px 30px 0 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__xaxis { margin: 8px 28px 0 0; }
.ui-bc__xlabel { position: relative; display: grid; place-items: center; height: 24px; min-width: 0; overflow: visible; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__xlabel { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__xlabel { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
.ui-bc__pill {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  background: var(--tc-surface-overlay, var(--_tc-surface-overlay));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  white-space: nowrap;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  transform: translate(-50%, -50%);
  animation: ui-bc-pill var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-bc__pill { padding: 0 10px 0 7px; border-radius: var(--tc-radius-full, var(--_tc-radius-full)); box-shadow: 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)), var(--tc-shadow-control, var(--_tc-shadow-control)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__pill { padding: 0 8px 0 6px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
.ui-bc__xtext { overflow: hidden; max-width: 100%; font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Table linked to the bars */
.ui-bc__table-wrap { overflow-x: auto; border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); scrollbar-width: thin; }
.ui-bc .ui-bc__table-wrap:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width, var(--_tc-focus-ring-width))); }
.ui-bc__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__table { line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table { line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
.ui-bc__table th, .ui-bc__table td { border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); text-align: left; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__table th, :where([data-look="standard"], [data-look="standard"] *).ui-bc__table td { height: 38px; padding: 0 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table th, :where([data-look="clean"], [data-look="clean"] *).ui-bc__table td { height: 36px; padding: 0 10px; background: var(--tc-surface-raised, var(--_tc-surface-raised)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table th:first-child, :where([data-look="clean"], [data-look="clean"] *).ui-bc__table td:first-child { padding-left: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table th:last-child, :where([data-look="clean"], [data-look="clean"] *).ui-bc__table td:last-child { padding-right: 16px; }
.ui-bc__table thead th { border-top: 0; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__table thead th { font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); }
/* Clean column titles: captions */
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table thead th {
  height: 32px;
  font-size: var(--tc-caption-font-size, var(--_tc-caption-font-size));
  line-height: var(--tc-caption-line-height, var(--_tc-caption-line-height));
  font-weight: var(--tc-caption-font-weight, var(--_tc-caption-font-weight));
  letter-spacing: var(--tc-caption-tracking, var(--_tc-caption-tracking));
  text-transform: var(--tc-caption-transform, var(--_tc-caption-transform));
  color: var(--tc-caption-color, var(--_tc-caption-color));
}
.ui-bc__table [data-num] { text-align: right; }
.ui-bc__table tbody th { position: sticky; left: 0; z-index: 1; font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__table tbody th { background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table tbody th { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__table tbody tr { transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* The linked row: a wash, laid over the card colour so the sticky first cell stays opaque */
:where([data-look="standard"], [data-look="standard"] *).ui-bc__table tbody tr[data-active] th, :where([data-look="standard"], [data-look="standard"] *).ui-bc__table tbody tr[data-active] td { background: linear-gradient(var(--tc-fill-default, var(--_tc-fill-default)), var(--tc-fill-default, var(--_tc-fill-default))) var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table tbody tr[data-active] th, :where([data-look="clean"], [data-look="clean"] *).ui-bc__table tbody tr[data-active] td { background: linear-gradient(var(--tc-fill-subtle, var(--_tc-fill-subtle)), var(--tc-fill-subtle, var(--_tc-fill-subtle))) var(--tc-surface-raised, var(--_tc-surface-raised)); }
.ui-bc__table td { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table td[data-total] { color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Hidden segments: muted (still readable) and struck through in the header, the swatch fades */
.ui-bc__table [data-hidden] { color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-bc__table th[data-hidden] .ui-bc__th-seg { text-decoration: line-through; }
.ui-bc__table [data-hidden] .ui-bc__swatch { opacity: 0.35; }
.ui-bc__row-label, .ui-bc__th-seg { display: inline-flex; align-items: center; gap: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__row-label svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__th-seg { gap: 6px; }
/* Standard: the tray's last row · Clean: the card's last row – legend chips toggle segments */
.ui-bc__foot { display: flex; align-items: center; justify-content: space-between; min-height: 44px; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__foot { gap: 10px; padding: 6px 10px 7px 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__foot { gap: 8px; padding: 8px; border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
.ui-bc__legend { display: flex; gap: 2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__legend { flex-wrap: wrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__legend { flex-wrap: nowrap; min-width: 0; overflow-x: auto; scrollbar-width: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__legend::-webkit-scrollbar { display: none; }
.ui-bc__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-bc__chip { padding: 0 9px; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__chip { flex: none; padding: 0 8px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
.ui-bc__chip:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__chip:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* The legend scrolls sideways when it doesn't fit, so the focus ring sits inside the chip */
:where([data-look="clean"], [data-look="clean"] *).ui-bc .ui-bc__chip:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width, var(--_tc-focus-ring-width))); }
/* Off: muted and struck through (not only faded), the swatch fades */
.ui-bc__chip[aria-pressed="false"] { color: var(--tc-text-muted, var(--_tc-text-muted)); text-decoration: line-through; }
.ui-bc__chip[aria-pressed="false"] .ui-bc__swatch { opacity: 0.35; }
.ui-bc__hint { padding-left: 8px; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__hint { font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__hint { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
.ui-bc__reset {
  flex: none;
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  padding: 0 10px;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-bc__reset { font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__reset:hover { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__reset { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); animation: ui-bc-pop var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__reset:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
@keyframes ui-bc-drop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@keyframes ui-bc-pop { from { opacity: 0; } }
@keyframes ui-bc-pill { from { opacity: 0; transform: translate(-50%, -50%) scale(0.92); } }
/* Height changes glide instead of jumping */
.ui-bc__morph { overflow: hidden; }
.ui-bc__morph[data-smooth] { transition: height var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)); }
/* Narrow (phones): tighter padding, smaller bars */
@container (max-width: 420px) {
:where([data-look="clean"], [data-look="clean"] *).ui-bc__head { padding: 12px 12px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__controls { gap: 6px; padding: 10px 12px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__select-btn { padding: 0 4px 0 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__chart { padding: 18px 12px 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__plot { height: 168px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__bar, :where([data-look="clean"], [data-look="clean"] *).ui-bc__rest { width: 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__rest { margin-left: -5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table th:first-child, :where([data-look="clean"], [data-look="clean"] *).ui-bc__table td:first-child { padding-left: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table th:last-child, :where([data-look="clean"], [data-look="clean"] *).ui-bc__table td:last-child { padding-right: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__foot { padding: 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__legend { gap: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__chip { gap: 5px; padding: 0 6px; }
}
/* Touch screens: taller pickers, menu rows and legend chips */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-bc__select-btn { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__option { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__chip, :where([data-look="clean"], [data-look="clean"] *).ui-bc__reset { height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-bc__bar, .ui-bc__seg, .ui-bc__tooltip, .ui-bc__col, .ui-bc__rest, .ui-bc__morph[data-smooth], .ui-bc__table tbody tr { transition: none; }
  .ui-bc__menu, .ui-bc__tooltip, .ui-bc__pill, .ui-bc__reset { animation: none; }
}
`;

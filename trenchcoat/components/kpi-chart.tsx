"use client";

/*
 * KPI Chart – a metric card with a multi-line chart and a hover tooltip, in a single self-contained file.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: kpi-chart.tsx is Standard,
 * kpi-chart-clean.tsx is Clean). Clean is one white card with hairline shadows; the title, value and chart sit in
 * its body and the footer in the card's last row.
 */
// Generated from src/components/kpi-chart.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type PointerEvent, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-kpi";

export type KpiSeries = {
  label: string;
  /** Line color, any CSS color */
  color: string;
  /** One value per label, same length as `labels` */
  values: number[];
};

type OwnProps = {
  /** Visual style. Defaults to the file's look: Standard in kpi-chart.tsx, Clean in kpi-chart-clean.tsx */
  look?: Look;
  title: string;
  /** Headline value, already formatted, e.g. "$96.4k" */
  value: string;
  /** Change against the previous period – positive is green, negative red */
  delta?: number;
  /** Short labels along the x-axis, e.g. "Mar 4" */
  labels: string[];
  /** Longer labels for the tooltip header, e.g. "Tue, Mar 4" – falls back to `labels` */
  tooltipLabels?: string[];
  series: KpiSeries[];
  /** Formats the axis, tooltip and delta values */
  format?: (n: number) => string;
  /** Line under the chart */
  footer?: string;
  /** A legend under the chart naming each line with its stroke pattern – on by default when there are two or more lines */
  legend?: boolean;
  /** Point that stays highlighted while nobody hovers – leave empty to hide the tooltip at rest */
  defaultIndex?: number;
  /**
   * The highlighted point (controlled), or null for none – e.g. to keep several charts' cursors in step. Pointer and
   * arrow keys then only report through `onIndexChange`
   */
  index?: number | null;
  /** Called with the point under the pointer or keyboard, or null when it leaves */
  onIndexChange?: (index: number | null) => void;
  /**
   * Fill the container instead of sitting at the card's own size: the card drops its 460px max-width, stretches to
   * the height its grid or flex parent gives it, and the plot grows with that height (never shorter than usual) –
   * e.g. a chart that spans a dashboard row next to a taller card. Off by default
   */
  fill?: boolean;
  className?: string;
  ref?: Ref<HTMLElement>;
};

export type KpiChartProps = Omit<ComponentPropsWithoutRef<"section">, keyof OwnProps> & OwnProps;

/** Each line also differs by its stroke pattern, so the series don't rely on colour alone (1.4.1) */
const DASHES = ["", "5 3", "1.5 3", "7 3 1.5 3"];
const dashOf = (k: number) => DASHES[k % DASHES.length] || undefined;

/** A short sample of a line: its colour and its stroke pattern */
const Swatch = ({ color, k }: { color: string; k: number }) => (
  <svg className="ui-kpi__swatch" viewBox="0 0 14 4" aria-hidden="true">
    <line x1="1" y1="2" x2="13" y2="2" stroke={color} strokeDasharray={dashOf(k)} />
  </svg>
);

const compact = (n: number) =>
  Math.abs(n) >= 1000 ? `${+(n / 1000).toFixed(Math.abs(n) >= 10000 ? 0 : 1)}k` : `${Math.round(n)}`;

/**
 * Picks an axis range that halves cleanly and always includes 0: 30 → 15 → 0, $8k → $4k → $0, 10 → 0 → −10.
 * Empty or non-finite data falls back to 0–2 instead of NaN.
 */
export function niceRange(values: number[]): [min: number, max: number] {
  let lo = 0;
  let hi = 0;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const half = (hi - lo) / 2 || 1;
  let pow = 10 ** Math.floor(Math.log10(half));
  // Smallest nice step whose two bands, starting on a multiple of the step, cover lo…hi
  for (;;) {
    for (const s of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]) {
      const step = s * pow;
      if (step < half) continue;
      const bottom = Math.floor(lo / step) * step || 0;
      if (hi <= bottom + 2 * step) return [bottom, bottom + 2 * step];
    }
    pow *= 10;
  }
}

export function KpiChart({
  look,
  title,
  value,
  delta,
  labels,
  tooltipLabels,
  series,
  format = compact,
  footer,
  legend,
  defaultIndex,
  index,
  onIndexChange,
  fill,
  className,
  ref,
  ...rest
}: KpiChartProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const [hover, setHover] = useControllable<number | null>(index, null, onIndexChange);
  // Controlled: exactly the index given · uncontrolled: the hovered point, else the resting one
  const active = index !== undefined ? index : (hover ?? defaultIndex ?? null);
  // The tooltip keeps its last content while it fades out
  const [shown, setShown] = useState(active ?? 0);
  if (active !== null && active !== shown) setShown(active);

  const count = labels.length;
  const x = (i: number) => (count > 1 ? (i / (count - 1)) * 100 : 50);
  // The scale and the lines depend on the data only – a hover moves the marker, it doesn't redraw them
  const { min, max, lines } = useMemo(() => {
    const [lo, hi] = niceRange(series.flatMap((s) => s.values));
    const px = (i: number) => (count > 1 ? (i / (count - 1)) * 100 : 50);
    const py = (v: number) => ((hi - v) / (hi - lo)) * 100;
    return { min: lo, max: hi, lines: series.map((s) => s.values.map((v, i) => `${px(i)},${py(v)}`).join(" ")) };
  }, [series, count]);
  const y = (v: number) => ((max - v) / (max - min)) * 100;
  // What a screen reader hears while reading the chart with the arrow keys – set by keys only, never by hovering
  const [spoken, setSpoken] = useState("");

  // Hover content closes with Esc wherever focus is, without moving focus (1.4.13)
  const hovering = index === undefined && hover !== null;
  useEffect(() => {
    if (!hovering) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setHover(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hovering, setHover]);

  const indexAt = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    // A plot with no width (not laid out yet) has no point under the pointer – NaN would never settle
    if (!box.width) return null;
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    return count ? Math.round(ratio * (count - 1)) : null;
  };

  /** One point read out: its date, then each line's value */
  const describe = (i: number) =>
    `${(tooltipLabels ?? labels)[i]}: ${series.map((s) => `${s.label} ${format(s.values[i] ?? 0)}`).join(", ")}`;

  const onKey = (e: KeyboardEvent) => {
    if (!count) return;
    const from = active ?? (e.key === "ArrowLeft" || e.key === "End" ? count : -1);
    let next: number | null | undefined;
    if (e.key === "ArrowRight") next = Math.min(count - 1, from + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, from - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    else if (e.key === "Escape") next = null;
    else return;
    e.preventDefault();
    e.stopPropagation();
    setHover(next);
    setSpoken(next === null ? "" : describe(next));
  };
  const showLegend = legend ?? series.length > 1;

  const rows = series
    .map((s) => ({ ...s, value: s.values[shown] ?? 0 }))
    .sort((a, b) => b.value - a.value);
  const flip = x(shown) > 50;
  const axis = [0, Math.round(count / 2 - 0.5), count - 1].filter((v, i, a) => a.indexOf(v) === i);

  const body = (
    <>
    <h3 className="ui-kpi__title">{title}</h3>
    <p className="ui-kpi__value">
      {value}
      {delta !== undefined && delta !== 0 && (
        <span className="ui-kpi__delta" data-trend={delta > 0 ? "up" : "down"}>
          {delta > 0 ? "+" : "−"}
          {format(Math.abs(delta))}
        </span>
      )}
    </p>

    <div className="ui-kpi__chart">
      <div className="ui-kpi__yaxis" aria-hidden="true">
        <span>{format(max)}</span>
        <span>{format((max + min) / 2)}</span>
        <span>{format(min)}</span>
      </div>

      <div
        className="ui-kpi__plot"
        tabIndex={0}
        role="group"
        aria-label={`${title} chart – use the arrow keys to read the values per day`}
        // Over the tooltip the point stays put, so the tooltip can be hovered and read
        onPointerMove={(e) => !(e.target as Element).closest(".ui-kpi__tooltip") && setHover(indexAt(e))}
        onPointerDown={(e) => !(e.target as Element).closest(".ui-kpi__tooltip") && setHover(indexAt(e))}
        onPointerLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        onKeyDown={onKey}
      >
        <span className="ui-kpi__grid" style={{ top: "0%" }} />
        <span className="ui-kpi__grid" style={{ top: "50%" }} />
        <span className="ui-kpi__grid" style={{ top: "100%" }} />

        <svg className="ui-kpi__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {series.map((s, k) => (
            <polyline
              key={s.label}
              points={lines[k]}
              stroke={s.color}
              strokeDasharray={dashOf(k)}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div className="ui-kpi__marker" data-open={active !== null || undefined} aria-hidden="true">
          <span className="ui-kpi__guide" style={{ left: `${x(shown)}%` }} />
          {series.map((s) => (
            <span
              key={s.label}
              className="ui-kpi__dot"
              style={{ left: `${x(shown)}%`, top: `${y(s.values[shown] ?? 0)}%`, background: s.color }}
            />
          ))}
        </div>

        <div
          className="ui-kpi__tooltip"
          data-open={active !== null || undefined}
          data-side={flip ? "left" : "right"}
          style={{ left: `${x(shown)}%` }}
          // A visual copy: keyboard readers hear the values through the status region below
          aria-hidden="true"
        >
          <p className="ui-kpi__date">{(tooltipLabels ?? labels)[shown]}</p>
          <ul>
            {rows.map((r) => (
              <li key={r.label}>
                <Swatch color={r.color} k={series.findIndex((s) => s.label === r.label)} />
                <span className="ui-kpi__label">{r.label}</span>
                <span className="ui-kpi__num">{format(r.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="ui-kpi__xaxis" aria-hidden="true">
        {axis.map((i) => (
          <span key={i} style={{ left: `${x(i)}%` }} data-edge={i === 0 ? "start" : i === count - 1 ? "end" : undefined}>
            {labels[i]}
          </span>
        ))}
      </div>
    </div>

    {showLegend && (
      <ul className="ui-kpi__legend" aria-label="Lines">
        {series.map((s, k) => (
          <li key={s.label}>
            <Swatch color={s.color} k={k} />
            {s.label}
          </li>
        ))}
      </ul>
    )}
    {/* Mounted from the start; speaks the point the arrow keys landed on */}
    <span className="ui-kpi__sr" role="status">
      {spoken}
    </span>
    </>
  );

  return (
    <>
      <style href="ui-kpi-chart" precedence="default">
        {css}
      </style>
      <section {...rest} ref={ref} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook} data-fill={fill || undefined}>
        {/* Clean wraps everything above the footer in the card's body */}
        {resolvedLook === "clean" ? <div className="ui-kpi__body">{body}</div> : body}

        {footer && <p className="ui-kpi__footer">{footer}</p>}
      </section>
    </>
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

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-kpi:where([data-look="standard"]),
.ui-kpi__portal:where([data-look="standard"]) {
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-border-subtle: light-dark(#f0f0f0, rgba(255, 255, 255, 0.06));
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-3xl: 24px;
  --_tc-font-size-4xl: 28px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 1px;
  --_tc-line-height-display: 32px;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #232326);
  --_tc-menu-radius: 12px;
  --_tc-menu-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 22px;
  --_tc-pill-px-lg: 10px;
  --_tc-pill-radius: 999px;
  --_tc-radius-xs: 4px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-space-5: 20px;
  --_tc-space-6: 24px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
}
.ui-kpi:where([data-look="clean"]),
.ui-kpi__portal:where([data-look="clean"]) {
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-border-subtle: light-dark(rgba(0, 0, 0, 0.045), rgba(255, 255, 255, 0.05));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-3xl: 24px;
  --_tc-font-size-4xl: 28px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 0.5px;
  --_tc-line-height-display: 32px;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #252527);
  --_tc-menu-radius: 10px;
  --_tc-menu-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 20px;
  --_tc-pill-px-lg: 8px;
  --_tc-pill-radius: 5px;
  --_tc-radius-xs: 4px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-space-5: 20px;
  --_tc-space-6: 24px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
@media (forced-colors: active) {
  :where([data-look], [data-look] *):not(#tc-fc):is(button, [role="button"], [role="switch"], [role="combobox"], [role="checkbox"], [role="radio"], input:not([type="hidden"]), select, textarea):not([role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="tab"], [role="treeitem"], [role="gridcell"], [role="row"]) { border: 1px solid ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(input, select, textarea) { border-color: FieldText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([role="listbox"], [role="menu"], [role="dialog"], [role="tooltip"], [role="tablist"], [role="radiogroup"]) { outline: 1px solid CanvasText; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) { forced-color-adjust: none; background: Highlight !important; color: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) * { color: HighlightText !important; background: none !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"] span:empty { background: ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"][aria-checked="true"] span:empty { background: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(:disabled, [aria-disabled="true"]) { color: GrayText !important; border-color: GrayText !important; }
}

:where([data-look="standard"], [data-look="standard"] *).ui-kpi {
  box-sizing: border-box;
  width: 100%;
  max-width: 460px;
  padding: var(--tc-space-5, var(--_tc-space-5)) var(--tc-space-5, var(--_tc-space-5)) var(--tc-space-4-5, var(--_tc-space-4-5));
  /* The card pattern – its ring is the shadow, no border */
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
}
/* Colors and motion as variables – override them on .ui-kpi */
:where([data-look="clean"], [data-look="clean"] *).ui-kpi {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 460px;
  /* One white card – the edge is a shadow, not a border */
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
}
.ui-kpi *, .ui-kpi *::before, .ui-kpi *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__title {
  margin: 0;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__value {
  display: flex;
  align-items: baseline;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  margin: var(--tc-space-2, var(--_tc-space-2)) 0 0;
  font-size: var(--tc-font-size-4xl, var(--_tc-font-size-4xl));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-display, var(--_tc-line-height-display));
  letter-spacing: -0.02em;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__delta {
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  letter-spacing: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__delta[data-trend="up"] { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__delta[data-trend="down"] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* Chart: y labels on the left, plot on the right, x labels below */
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__chart {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 116px 20px;
  column-gap: var(--tc-space-3, var(--_tc-space-3));
  row-gap: var(--tc-space-2, var(--_tc-space-2));
  margin-top: var(--tc-space-6, var(--_tc-space-6));
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__yaxis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: -9px 0;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug));
  text-align: right;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__body { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-3, var(--_tc-space-3)); }
/* Title, the big number and the change as a tinted badge */
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__title {
  margin: 0;
  overflow: hidden;
  font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose));
  color: var(--tc-text-strong, var(--_tc-text-strong));
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__value {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  margin: var(--tc-space-1-5, var(--_tc-space-1-5)) 0 0;
  font-size: var(--tc-font-size-3xl, var(--_tc-font-size-3xl));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-display, var(--_tc-line-height-display));
  letter-spacing: -0.02em;
  color: var(--tc-text-strong, var(--_tc-text-strong));
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__delta {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg));
  padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg));
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg));
  font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  letter-spacing: 0;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__delta[data-trend="up"] { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__delta[data-trend="down"] { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* Chart: y labels on the left, plot on the right, x labels below */
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__chart {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 124px 16px;
  column-gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  row-gap: var(--tc-space-2, var(--_tc-space-2));
  margin-top: var(--tc-space-5, var(--_tc-space-5));
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__yaxis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: -8px 0;
  font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  text-align: right;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
.ui-kpi__plot {
  position: relative;
  touch-action: pan-y;
  outline: none;
  cursor: crosshair;
}
/* A real outline (it shows in forced colours too), clear of the lines */
.ui-kpi__plot:focus-visible {
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: 4px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__grid {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--tc-border-subtle, var(--_tc-border-subtle));
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__grid {
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
.ui-kpi__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  animation: ui-kpi-draw var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__lines polyline {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Hover marker: thin guide and one dot per line */
.ui-kpi__marker {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__lines polyline {
  fill: none;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Hover marker: a hairline guide and one dot per line – short, crisp moves between points */
.ui-kpi__marker[data-open] { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__guide,
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__dot {
  position: absolute;
  transition: left var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), top var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__guide {
  top: -4px;
  bottom: 0;
  width: 1px;
  margin-left: -0.5px;
  background: var(--tc-border-strong, var(--_tc-border-strong));
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__dot {
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--tc-surface-raised, var(--_tc-surface-raised));
}
/* Tooltip: sits beside the guide, flips to the left on the right half */
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__tooltip {
  position: absolute;
  top: -12px;
  z-index: 2;
  min-width: 176px;
  padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3));
  /* A popover: the menu surface */
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  opacity: 0;
  transform: translateX(var(--tc-kpi-chart-shift)) scale(0.97);
  transition:
    left var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)),
    opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__guide,
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__dot {
  position: absolute;
  transition: left var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)), top var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate));
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__guide {
  top: -4px;
  bottom: 0;
  width: 0;
  border-left: 1px solid var(--tc-border-strong, var(--_tc-border-strong));
  margin-left: -0.5px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__dot {
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--tc-surface-raised, var(--_tc-surface-raised));
}
/* Tooltip: a small white popover beside the guide, flips to the left on the right half */
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__tooltip {
  position: absolute;
  top: -8px;
  z-index: 2;
  min-width: 160px;
  padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  opacity: 0;
  transform: translateX(var(--tc-kpi-chart-shift)) scale(0.98);
  transition:
    left var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    opacity var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-kpi__tooltip[data-side="right"] { --tc-kpi-chart-shift: 14px; transform-origin: left top; }
.ui-kpi__tooltip[data-side="left"] { --tc-kpi-chart-shift: calc(-100% - 14px); transform-origin: right top; }
/* Closed, it lets the pointer through; open, it can be hovered (1.4.13) */
.ui-kpi__tooltip:not([data-open]) { pointer-events: none; }
.ui-kpi__tooltip[data-open] {
  opacity: 1;
  transform: translateX(var(--tc-kpi-chart-shift));
  cursor: default;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__date {
  margin: 0 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__tooltip ul {
  display: grid;
  gap: var(--tc-space-1, var(--_tc-space-1));
  margin: 0;
  padding: 0;
  list-style: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__tooltip li {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__swatch {
  flex: none;
  width: 14px;
  height: 4px;
  overflow: visible;
  stroke-width: 2;
  stroke-linecap: round;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__label {
  flex: 1;
  white-space: nowrap;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__num {
  padding-left: var(--tc-space-4, var(--_tc-space-4));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__xaxis {
  position: relative;
  grid-column: 2;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__date {
  margin: 0;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-text-strong, var(--_tc-text-strong));
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__tooltip ul {
  display: grid;
  gap: 0;
  margin: var(--tc-space-1, var(--_tc-space-1)) 0 0;
  padding: var(--tc-space-1, var(--_tc-space-1)) 0 0;
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
  list-style: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__tooltip li {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__swatch {
  flex: none;
  width: 14px;
  height: 4px;
  overflow: visible;
  stroke-width: 1.5;
  stroke-linecap: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__label {
  flex: 1;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__num {
  padding-left: var(--tc-space-4, var(--_tc-space-4));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__xaxis {
  position: relative;
  grid-column: 2;
  font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
.ui-kpi__xaxis span {
  position: absolute;
  top: 0;
  white-space: nowrap;
  transform: translateX(-50%);
}
.ui-kpi__xaxis span[data-edge="start"] { transform: none; }
.ui-kpi__xaxis span[data-edge="end"] { transform: translateX(-100%); }
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__footer {
  margin: var(--tc-space-4, var(--_tc-space-4)) 0 0;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
/* The last row of the card */
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__footer {
  margin: 0;
  padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-4, var(--_tc-space-4));
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
/* Legend: each line's name with its colour and stroke pattern */
.ui-kpi__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-3-5, var(--_tc-space-3-5));
  margin: var(--tc-space-3, var(--_tc-space-3)) 0 0;
  padding: 0;
  list-style: none;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
.ui-kpi__legend li { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
.ui-kpi__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* fill: the card takes its container's width and stretched height, and the plot row grows to use it */
.ui-kpi[data-fill] {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  max-width: none;
}
.ui-kpi[data-fill] > .ui-kpi__body { display: flex; flex: 1 0 auto; flex-direction: column; }
.ui-kpi[data-fill] .ui-kpi__chart { flex: 1 0 auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-kpi[data-fill] .ui-kpi__chart { grid-template-rows: minmax(116px, 1fr) 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-kpi[data-fill] .ui-kpi__chart { grid-template-rows: minmax(124px, 1fr) 16px; }
@keyframes ui-kpi-draw {
  from { clip-path: inset(-10% 100% -10% 0); }
  to { clip-path: inset(-10% -2% -10% 0); }
}
/* Narrow (phones): tighter padding, a slightly shorter plot */
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__body { padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__chart { grid-template-rows: 112px 16px; column-gap: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-kpi[data-fill] .ui-kpi__chart { grid-template-rows: minmax(112px, 1fr) 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__footer { padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__tooltip { min-width: 144px; }
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__num { padding-left: var(--tc-space-3, var(--_tc-space-3)); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-kpi__lines { animation: none; }
  .ui-kpi__marker, .ui-kpi__guide, .ui-kpi__dot, .ui-kpi__tooltip { transition: none; }
}
`;

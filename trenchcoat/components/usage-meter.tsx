"use client";

/*
 * Usage Meter – the "Usage" card of a SaaS or AI product, in a single self-contained file.
 * One big credits meter split into categories (Chat, Search, Image …) with a legend, an optional daily sparkline,
 * thin meters for plan limits (seats, storage, projects) and a button that grows more prominent near the limit.
 * Hovering a part highlights it everywhere; switching the period rolls every number to its new value while the
 * bars glide to their new widths. From 80% a small amber dot warns, at 100% it says "Limit reached".
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: usage-meter.tsx is Standard,
 * usage-meter-clean.tsx is Clean). Clean is one white card with hairline shadows; what's left and the button sit
 * in its last row, under a hairline, instead of in a tray below the card.
 */
// Generated from src/components/usage-meter.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type Dispatch, type KeyboardEvent, type PointerEvent, type Ref, type SetStateAction } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-um";

export type UsageItem = {
  label: string;
  value: number;
  /** Any CSS color – defaults to shades of the accent, then grays */
  color?: string;
};

export type UsageLimit = {
  label: string;
  used: number;
  /** Leave out (or pass null / Infinity) for unlimited */
  total?: number | null;
  /** Shown after the numbers, e.g. "GB" */
  unit?: string;
  /** Decimal places – defaults to 1 for fractional values, else 0 */
  decimals?: number;
};

export type UsageDay = {
  /** Shown on hover, e.g. "Oct 3" */
  label: string;
  /** null for days still to come in the period */
  value: number | null;
};

export type UsagePeriod = { id: string; label: string };

export type UsageState = "ok" | "warn" | "limit";

export type UsageMeterOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in usage-meter.tsx, Clean in usage-meter-clean.tsx */
  look?: Look;
  /**
   * How the card is laid out. "stacked" (default): one column at most 460px wide. "wide": the card takes its
   * container's full width and, once it is 640px or wider, splits into two columns so it stays low – the figure,
   * bar and categories on the left, the daily bars and plan limits on the right; narrower, it stacks as usual
   */
  layout?: "stacked" | "wide";
  /** Credits included in the plan */
  total: number;
  /** What the credits were spent on in the shown period */
  used: UsageItem[];
  /** Thin meters below, e.g. seats, storage, projects */
  limits?: UsageLimit[];
  /** Options of the period switch – no switch when left out */
  periods?: UsagePeriod[];
  /** The chosen period id. Controlled when defined; otherwise the meter keeps its own, starting at `defaultPeriod` */
  period?: string;
  /** First period when uncontrolled – defaults to the first of `periods` */
  defaultPeriod?: string;
  /** Called with the new period id – pass the matching `used`, `limits` and `daily` back in */
  onPeriodChange?: (id: string) => void;
  /** When the credits reset – shown as "Resets in 9 days" */
  resetAt?: Date | string | number;
  /** The current time in epoch ms, for "Resets in …". Leave out to use the clock (read after mount, so server and
   *  client render the same markup) */
  now?: number;
  /** Locale for numbers and dates. Defaults to "en-US", so server and client always format alike */
  locale?: string;
  /** Usage per day for the sparkline under the meter */
  daily?: UsageDay[];
  /** Called by the button, with the current state */
  onUpgrade?: (state: UsageState) => void;
  title?: string;
  /** Plan name next to the reset date, e.g. "Pro plan" */
  plan?: string;
  /** Unit of the credits */
  unit?: string;
  /** Share from which the meter warns (0–1) */
  warnAt?: number;
  /** Button text while there is room left */
  upgradeLabel?: string;
  /** Button text near and at the limit */
  topUpLabel?: string;
  className?: string;
  /** The root <section> */
  ref?: Ref<HTMLElement>;
};

export type UsageMeterProps = Omit<ComponentPropsWithoutRef<"section">, keyof UsageMeterOwnProps> & UsageMeterOwnProps;

/* ---------- Helpers ---------- */

// One formatter per locale and number of digits – made once, not on every call (the tween formats every frame)
const formats = new Map<string, Intl.NumberFormat>();
const numberFormat = (locale: string, digits: number) => {
  const key = `${locale}|${digits}`;
  let f = formats.get(key);
  if (!f) formats.set(key, (f = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })));
  return f;
};
const dates = new Map<string, Intl.DateTimeFormat>();
const dateFormat = (locale: string) => {
  let f = dates.get(locale);
  if (!f) dates.set(locale, (f = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" })));
  return f;
};
/** Number and unit with a no-break space, so "3.2 GB" never splits */
const withUnit = (text: string, unit?: string) => (unit ? `${text} ${unit}` : text);

/** "Resets in 9 days" – before the clock is known (server render, first client render) the date itself */
function resetText(at: Date, now: number | null, date: string) {
  if (now === null) return `Resets ${date}`;
  const days = Math.ceil((at.getTime() - now) / 864e5);
  if (days <= 0) return "Resets today";
  if (days === 1) return "Resets tomorrow";
  return `Resets in ${days} days`;
}

const PALETTE = ["var(--tc-usage-meter-series-1)", "var(--tc-usage-meter-series-2)", "var(--tc-usage-meter-series-3)", "var(--tc-usage-meter-series-4)", "var(--tc-usage-meter-series-5)"];

type Get = (key: string) => number;

/** Writes text into the node React rendered for it – the same node, so React can still update it later */
const setText = (node: ChildNode | null | undefined, text: string) => {
  if (node && node.nodeValue !== text) node.nodeValue = text;
};

/**
 * Tweens a set of named numbers: every key rolls from where it is now to its target, new keys from zero.
 * One animation frame loop for the whole card, so numbers and bar widths move in step. The frames don't re-render the
 * card: a render draws the numbers as they are, and each element that shows one registers with `bind` how to redraw
 * itself, which the loop calls directly.
 */
function useTween(target: Record<string, number>, first: number, then: number) {
  const current = useRef<Record<string, number>>(Object.fromEntries(Object.keys(target).map((k) => [k, 0])));
  const painters = useRef(new Set<() => void>());
  const started = useRef(false);
  const signature = JSON.stringify(target);
  useEffect(() => {
    const to = JSON.parse(signature) as Record<string, number>;
    const from = { ...current.current };
    const paint = () => painters.current.forEach((draw) => draw());
    if (reducedMotion()) {
      current.current = to;
      paint();
      return;
    }
    // The count-in from zero takes a little longer than later changes
    const live = Object.values(to).some((v) => v !== 0);
    const duration = live && !started.current ? first : then;
    if (live) started.current = true;
    // The first frame's timestamp is the start, so the effect reads no clock of its own
    let start = -1;
    let frame = 0;
    const step = (now: number) => {
      if (start < 0) start = now;
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutQuart(t);
      const next: Record<string, number> = {};
      for (const k in to) next[k] = (from[k] ?? 0) + (to[k] - (from[k] ?? 0)) * e;
      current.current = next;
      paint();
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps
  // A render draws the numbers it read; the loop may have moved them on before the commit, so redraw once more
  useLayoutEffect(() => painters.current.forEach((draw) => draw()));
  const get: Get = (key) => current.current[key] ?? 0;
  /** A ref that redraws the element on every frame of the tween */
  const bind = (draw: (el: HTMLElement, get: Get) => void) => (el: HTMLElement | null) => {
    if (!el) return;
    const paint = () => draw(el, get);
    painters.current.add(paint);
    return () => {
      painters.current.delete(paint);
    };
  };
  return { get, bind };
}

/** Moves a pill under the active child of a list – no transition on the first placement, so it doesn't fly in */
function glide(list: HTMLElement | null, pill: HTMLElement | null, selector: string) {
  if (!list || !pill) return;
  const active = list.querySelector<HTMLElement>(selector);
  if (!active || !active.offsetWidth) {
    pill.style.opacity = "0";
    return;
  }
  const first = !pill.dataset.ready;
  if (first) pill.style.transition = "none";
  pill.style.opacity = "1";
  pill.style.width = `${active.offsetWidth}px`;
  pill.style.height = `${active.offsetHeight}px`;
  pill.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
  if (first) {
    pill.dataset.ready = "1";
    void pill.offsetWidth;
    pill.style.transition = "";
  }
}

type Row = UsageItem & { color: string; leaving?: boolean };

/** Gives each new label (without its own color) the next palette shade; known labels keep theirs */
function assignColors(known: Record<string, string>, items: UsageItem[]) {
  const out = { ...known };
  for (const item of items) if (!item.color && !(item.label in out)) out[item.label] = PALETTE[Object.keys(out).length % PALETTE.length];
  return out;
}

/** The new rows in their order; rows that disappeared stay at their old place (at zero) while they fold away */
function merge(prev: Row[], next: Row[]) {
  const out = [...next];
  prev.forEach((p, i) => {
    if (next.some((n) => n.label === p.label)) return;
    out.splice(Math.min(i, out.length), 0, { ...p, value: 0, leaving: true });
  });
  return out;
}

/* ---------- Hooks ---------- */

type Fmt = (n: number, digits?: number) => string;
type Bind = (draw: (el: HTMLElement, get: Get) => void) => (el: HTMLElement | null) => (() => void) | undefined;

/** The clock for "Resets in …": the `now` prop, else the time read after mount (never during render) – it only
 *  starts or stops with them, not on every new `resetAt` object */
function useResetClock(now: number | undefined, resetAt: UsageMeterProps["resetAt"]) {
  const [clock, setClock] = useState<number | null>(null);
  const ownClock = now === undefined && resetAt !== undefined;
  useEffect(() => {
    if (!ownClock) return;
    const tick = () => setClock(Date.now());
    tick();
    const t = window.setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [ownClock]);
  return now ?? clock;
}

/**
 * The rows of the legend and the bar, with stable default colors per label, so "API" keeps its shade when "Image"
 * drops out. Rows that leave fold away at their old place; the timer drops them afterwards. Only a row that leaves is
 * kept in state – new values alone render straight from the props, without a second pass
 */
function useRows(used: UsageItem[]) {
  // New labels are added during render through state (React's "adjust state while rendering" pattern), never by
  // writing a ref
  const [palette, setPalette] = useState(() => assignColors({}, used));
  let colors = palette;
  if (used.some((u) => !u.color && !(u.label in palette))) {
    colors = assignColors(palette, used);
    setPalette(colors);
  }
  const incoming: Row[] = used.map((u) => ({ ...u, color: u.color ?? colors[u.label] }));

  const [folding, setFolding] = useState<Row[] | null>(null);
  const rows = folding ?? incoming;
  const usedKey = used.map((u) => `${u.label}:${u.value}:${u.color ?? ""}`).join("|");
  const shownRows = useRef(rows);
  const firstRows = useRef(true);
  useLayoutEffect(() => {
    const prev = shownRows.current;
    if (firstRows.current) {
      firstRows.current = false;
      return;
    }
    const next = merge(
      prev.filter((p) => !p.leaving),
      incoming,
    );
    if (!next.some((r) => r.leaving)) {
      if (prev.some((r) => r.leaving)) setFolding(null);
      return;
    }
    setFolding(next);
    const t = window.setTimeout(() => setFolding(null), 460);
    return () => clearTimeout(t);
  }, [usedKey]); // eslint-disable-line react-hooks/exhaustive-deps -- runs when the items change, compared by value
  useLayoutEffect(() => {
    shownRows.current = rows;
  });
  return rows;
}

/** Keeps `box` as tall (or as wide) as `inner`, so it glides to its new size */
function useFollowSize(box: { current: HTMLElement | null }, inner: { current: HTMLElement | null }, side: "height" | "width") {
  useLayoutEffect(() => {
    const b = box.current;
    const i = inner.current;
    if (!b || !i) return;
    const set = () => (b.style[side] = `${side === "height" ? i.offsetHeight : i.offsetWidth}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(i);
    return () => ro.disconnect();
  }, [box, inner, side]);
}

/* ---------- Parts ---------- */

function PeriodSwitch({ periods, active, onChoose }: { periods: UsagePeriod[]; active?: string; onChoose: (id: string) => void }) {
  const switchRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const onKey = (e: KeyboardEvent) => {
    const i = periods.findIndex((p) => p.id === active);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % periods.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + periods.length) % periods.length;
    if (next < 0) return;
    e.preventDefault();
    onChoose(periods[next].id);
    switchRef.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  };
  // The selection pill glides to the chosen period – also when a narrow layout changes the option widths
  const periodsKey = periods.map((p) => `${p.id}:${p.label}`).join("|");
  useLayoutEffect(() => {
    glide(switchRef.current, pillRef.current, '[aria-checked="true"]');
  }, [active, periodsKey]);
  useLayoutEffect(() => {
    const list = switchRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => glide(list, pillRef.current, '[aria-checked="true"]'));
    ro.observe(list);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={switchRef} className="ui-um__switch" role="radiogroup" aria-label="Period" onKeyDown={onKey}>
      <span ref={pillRef} className="ui-um__pill" aria-hidden="true" />
      {periods.map((p) => (
        <button key={p.id} type="button" role="radio" aria-checked={p.id === active} tabIndex={p.id === active ? 0 : -1} className="ui-um__option" onClick={() => onChoose(p.id)}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

type SparkProps = { days: UsageDay[]; day: number | null; setDay: Dispatch<SetStateAction<number | null>>; title: string; unit: string; fmt: Fmt; tween: Get; bind: Bind };

/** The daily sparkline */
function DailySpark({ days, day, setDay, title, unit, fmt, tween, bind }: SparkProps) {
  const dayMax = Math.max(1, ...days.map((d) => d.value ?? 0));
  const past = days.filter((d) => d.value !== null);
  const average = past.length ? past.reduce((s, d) => s + (d.value ?? 0), 0) / past.length : 0;
  const dayHeight = (get: Get, i: number) => `${Math.max(4, (get(`d:${i}`) / dayMax) * 100)}%`;
  const dayAt = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - box.left) / box.width) * days.length);
    return Math.min(days.length - 1, Math.max(0, i));
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") setDay((d) => Math.min(days.length - 1, d === null ? 0 : d + 1));
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") setDay((d) => Math.max(0, d === null ? days.length - 1 : d - 1));
    else if (e.key === "Home") setDay(0);
    else if (e.key === "End") setDay(days.length - 1);
    else if (e.key === "Escape" && day !== null) setDay(null);
    else return;
    e.preventDefault();
  };
  const hoveredDay = day !== null ? days[day] : undefined;
  // A slider over the days: screen readers read the day's value as the arrow keys move (the readout above is visual)
  const lastPast = Math.max(0, days.reduce((last, d, i) => (d.value !== null ? i : last), -1));
  const dayText = (d: UsageDay) => `${d.label}: ${d.value === null ? "no data yet" : withUnit(fmt(d.value), unit)}`;
  // A new number of days (30 → 7) grows in fresh; the first fill comes from the count-in
  const [lastLength, setLastLength] = useState(days.length);
  const [regrow, setRegrow] = useState(false);
  if (lastLength !== days.length) {
    setLastLength(days.length);
    setRegrow(true);
  }
  return (
    <div className="ui-um__daily">
      <div className="ui-um__daily-head">
        <span>Per day</span>
        <span className="ui-um__daily-read" key={hoveredDay ? `d${day}` : "avg"} aria-hidden="true">
          {hoveredDay ? (
            <>
              {hoveredDay.label} · <b>{hoveredDay.value === null ? "–" : withUnit(fmt(hoveredDay.value), unit)}</b>
            </>
          ) : (
            <>
              Avg <b>{fmt(average)}</b> / day
            </>
          )}
        </span>
      </div>
      <div
        className="ui-um__spark"
        key={days.length}
        tabIndex={0}
        role="slider"
        aria-label={`${title} per day`}
        aria-valuemin={1}
        aria-valuemax={days.length}
        aria-valuenow={(day ?? lastPast) + 1}
        aria-valuetext={hoveredDay ? dayText(hoveredDay) : `Average ${fmt(average)} ${unit} per day`}
        data-hover={day !== null || undefined}
        data-regrow={regrow || undefined}
        data-few={days.length <= 14 || undefined}
        onPointerMove={(e) => setDay(dayAt(e))}
        onPointerDown={(e) => setDay(dayAt(e))}
        onPointerLeave={(e) => e.pointerType === "mouse" && setDay(null)}
        onKeyDown={onKey}
        onBlur={() => setDay(null)}
      >
        {days.map((d, i) => (
          <span key={i} className="ui-um__day" data-future={d.value === null || undefined} data-active={i === day || undefined} style={{ ["--i" as string]: i }}>
            <span style={{ height: d.value === null ? undefined : dayHeight(tween, i) }} ref={d.value === null ? undefined : bind((el, get) => (el.style.height = dayHeight(get, i)))} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Thin meters for the plan limits */
function LimitList({ limits, warnAt, fmt, tween, bind }: { limits: UsageLimit[]; warnAt: number; fmt: Fmt; tween: Get; bind: Bind }) {
  const limitWidth = (get: Get, l: UsageLimit) => `${Math.min(100, (get(`l:${l.label}`) / Math.max(l.total!, 1e-9)) * 100)}%`;
  return (
    <ul className="ui-um__limits" aria-label="Plan limits" style={{ ["--n" as string]: Math.min(3, limits.length) }}>
      {limits.map((l) => {
        const unlimited = l.total == null || !isFinite(l.total);
        const digits = l.decimals ?? (Number.isInteger(l.used) && (unlimited || Number.isInteger(l.total)) ? 0 : 1);
        const ratio = unlimited ? 0 : l.used / Math.max(l.total!, 1e-9);
        const lstate: UsageState = unlimited ? "ok" : ratio >= 1 ? "limit" : ratio >= warnAt ? "warn" : "ok";
        const shownUsed = tween(`l:${l.label}`);
        const totalText = unlimited ? "∞" : fmt(l.total!, Number.isInteger(l.total) ? 0 : digits);
        return (
          <li key={l.label} className="ui-um__limit" data-state={lstate}>
            <span className="ui-um__limit-label">
              {l.label}
              {lstate !== "ok" && (
                <>
                  <span className="ui-um__dot" aria-hidden="true" />
                  <span className="ui-um__sr">{lstate === "limit" ? ", at the limit" : ", close to the limit"}</span>
                </>
              )}
            </span>
            <span className="ui-um__limit-value" ref={bind((el, get) => setText(el.firstChild, fmt(get(`l:${l.label}`), digits)))}>
              {fmt(shownUsed, digits)}
              <span className="ui-um__muted"> of {withUnit(totalText, unlimited ? undefined : l.unit)}</span>
            </span>
            {unlimited ? (
              <span className="ui-um__thin" data-unlimited="" aria-label={`${l.label}: ${fmt(l.used, digits)}, unlimited`} role="img" />
            ) : (
              <span
                className="ui-um__thin"
                role="meter"
                aria-label={l.label}
                aria-valuemin={0}
                aria-valuemax={l.total!}
                aria-valuenow={Math.min(l.used, l.total!)}
                aria-valuetext={`${fmt(l.used, digits)} of ${withUnit(totalText, l.unit)}`}
              >
                <span style={{ width: limitWidth(tween, l) }} ref={bind((el, get) => (el.style.width = limitWidth(get, l)))} />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

type BarProps = {
  rows: Row[];
  total: number;
  sum: number;
  unit: string;
  active: string | null;
  tipLabel: string | null;
  highlight: (label: string | null) => void;
  /** Announces what the arrow keys moved to (the tooltip itself is visual – hover captions aren't live) */
  say: (text: string) => void;
  fmt: Fmt;
  tween: Get;
  bind: Bind;
};

/** The credits bar, split into its parts, with the tooltip of the part pointed at – and the legend under it */
function CreditsBreakdown({ rows, total, sum, unit, active, tipLabel, highlight, say, fmt, tween, bind }: BarProps) {
  const tipRef = useRef<HTMLDivElement>(null);
  // A tooltip shown by hover closes with Escape, wherever focus is, and focus stays where it was (1.4.13)
  useEffect(() => {
    if (!active) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") highlight(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, highlight]);
  // Over the limit the parts fill the whole bar instead of overflowing it
  const scale = Math.max(total, sum) || 1;
  // Where each part starts and ends on the bar, from the tweened values
  const segmentsOf = (get: Get) => {
    let cursor = 0;
    return rows.map((r) => {
      const width = (get(`r:${r.label}`) / scale) * 100;
      const seg = { ...r, left: cursor, width };
      cursor += width;
      return seg;
    });
  };
  const segments = segmentsOf(tween);
  const activeRow = rows.find((r) => r.label === active && !r.leaving);
  const tipRow = rows.find((r) => r.label === tipLabel);
  const tipCenterOf = (get: Get) => {
    const tipSeg = segmentsOf(get).find((s) => s.label === tipLabel);
    return tipSeg ? Math.min(100, Math.max(0, tipSeg.left + tipSeg.width / 2)) : 50;
  };
  const tipCenter = tipCenterOf(tween);
  const paintTip = bind((el, get) => {
    const c = tipCenterOf(get);
    el.style.left = `${c}%`;
    el.style.setProperty("--tc-usage-meter-tip-x", `${-c}%`);
  });
  // What the tweened numbers draw – used by the render and, between renders, by the tween's frames
  const shareText = (get: Get, label: string) => fmt(get("used") ? (get(`r:${label}`) / get("used")) * 100 : 0);

  // Mouse hover shows and hides; a tap toggles, since touch has no hover to leave
  const segmentAt = (e: PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 100;
    return segmentsOf(tween).find((s) => !s.leaving && s.width > 0 && x >= s.left && x <= s.left + s.width)?.label ?? null;
  };
  const onBarKey = (e: KeyboardEvent) => {
    const list = rows.filter((r) => !r.leaving && r.value > 0);
    if (!list.length) return;
    const i = list.findIndex((r) => r.label === active);
    let next: Row | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = list[(i + 1) % list.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = list[(i - 1 + list.length) % list.length];
    else if (e.key === "Home") next = list[0];
    else if (e.key === "End") next = list[list.length - 1];
    else if (e.key === "Escape" && active) highlight(null);
    else return;
    e.preventDefault();
    if (!next) return;
    highlight(next.label);
    say(`${next.label}: ${withUnit(fmt(next.value), unit)}, ${fmt(sum ? (next.value / sum) * 100 : 0)}%`);
  };

  return (
    <>
      <div
        className="ui-um__bar"
        tabIndex={0}
        role="group"
        aria-label={`${fmt(sum)} of ${fmt(total)} ${unit} used – arrow keys read each category`}
        data-active={activeRow ? "" : undefined}
        onPointerMove={(e) => e.pointerType === "mouse" && !tipRef.current?.contains(e.target as Node) && highlight(segmentAt(e))}
        onPointerLeave={(e) => e.pointerType === "mouse" && highlight(null)}
        onPointerUp={(e) => {
          if (e.pointerType === "mouse") return;
          const label = segmentAt(e);
          highlight(label === active ? null : label);
        }}
        onKeyDown={onBarKey}
        onBlur={() => highlight(null)}
      >
        <div
          className="ui-um__track"
          role="meter"
          aria-label={`${unit[0]?.toUpperCase() ?? ""}${unit.slice(1)} used`}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={Math.min(sum, total)}
          aria-valuetext={`${fmt(sum)} of ${fmt(total)} ${unit}`}
          ref={bind((el, get) => segmentsOf(get).forEach((s, i) => ((el.children[i] as HTMLElement | undefined)?.style.setProperty("width", `${s.width}%`))))}
        >
          {segments.map((s) => (
            <span key={s.label} className="ui-um__seg" data-active={s.label === active || undefined} style={{ width: `${s.width}%`, background: s.color }} />
          ))}
        </div>
        <div
          className="ui-um__tip"
          data-open={activeRow ? "" : undefined}
          style={{ left: `${tipCenter}%`, ["--tc-usage-meter-tip-x" as string]: `${-tipCenter}%` }}
          ref={(el) => {
            tipRef.current = el;
            return paintTip(el);
          }}
          aria-hidden="true"
        >
          {tipRow && (
            <>
              <span className="ui-um__tip-label">
                <span className="ui-um__swatch" style={{ background: tipRow.color }} />
                {tipRow.label}
              </span>
              <span className="ui-um__tip-value">
                {withUnit(fmt(tipRow.value), unit)}
                <span className="ui-um__muted"> · {fmt(sum ? (tipRow.value / sum) * 100 : 0)}%</span>
              </span>
            </>
          )}
        </div>
      </div>

      <ul className="ui-um__legend" aria-label="By category" data-active={activeRow ? "" : undefined}>
        {rows.map((r) => {
          const v = tween(`r:${r.label}`);
          return (
            <li key={r.label} className="ui-um__row" data-leaving={r.leaving || undefined}>
              <div
                className="ui-um__item"
                data-active={r.label === active || undefined}
                onPointerEnter={(e) => e.pointerType === "mouse" && !r.leaving && highlight(r.label)}
                onPointerLeave={(e) => e.pointerType === "mouse" && highlight(null)}
                onPointerUp={(e) => e.pointerType !== "mouse" && !r.leaving && highlight(r.label === active ? null : r.label)}
              >
                <span className="ui-um__swatch" style={{ background: r.color }} />
                <span className="ui-um__label">{r.label}</span>
                <span className="ui-um__value" ref={bind((el, get) => setText(el.firstChild, fmt(get(`r:${r.label}`))))}>
                  {fmt(v)}
                </span>
                <span className="ui-um__share" ref={bind((el, get) => setText(el.firstChild, shareText(get, r.label)))}>
                  {shareText(tween, r.label)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ---------- Component ---------- */

export function UsageMeter({
  look,
  layout = "stacked",
  total,
  used,
  limits = [],
  periods,
  period,
  defaultPeriod,
  onPeriodChange,
  resetAt,
  daily,
  onUpgrade,
  title = "Usage",
  plan,
  unit = "credits",
  warnAt = 0.8,
  upgradeLabel = "Upgrade",
  topUpLabel = "Add credits",
  now,
  locale = "en-US",
  className,
  ref,
  ...rest
}: UsageMeterProps) {
  const uid = useId();
  const root = useRef<HTMLElement>(null);
  const rootRef = useRootRef(root, ref);
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const actionInner = useRef<HTMLSpanElement>(null);

  const [activePeriod, setPeriod] = useControllable<string | undefined>(period, defaultPeriod ?? periods?.[0]?.id, onPeriodChange as ((id: string | undefined) => void) | undefined, "period");
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [tipLabel, setTipLabel] = useState<string | null>(null); // the tooltip keeps its text while fading out
  const [day, setDay] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");

  const fmt: Fmt = (n, digits = 0) => numberFormat(locale, digits).format(n);
  const current = useResetClock(now, resetAt);
  const rows = useRows(used);

  // Count in once the card scrolls into view
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Numbers */
  const sum = used.reduce((s, u) => s + Math.max(0, u.value), 0);
  const share = total > 0 ? sum / total : 0;
  const state: UsageState = share >= 1 ? "limit" : share >= warnAt ? "warn" : "ok";

  const target: Record<string, number> = { used: sum, left: Math.max(0, total - sum), pct: share * 100 };
  rows.forEach((r) => (target[`r:${r.label}`] = r.leaving ? 0 : Math.max(0, r.value)));
  limits.forEach((l) => (target[`l:${l.label}`] = l.used));
  daily?.forEach((d, i) => (target[`d:${i}`] = d.value ?? 0));
  if (!visible) for (const k in target) target[k] = 0;
  const { get: tween, bind } = useTween(target, 1200, 650);

  const highlight = useCallback((label: string | null) => {
    setActive(label);
    if (label) setTipLabel(label);
  }, []);
  const days = daily ?? [];

  /* Period switch */
  const choose = (id: string) => {
    if (id === activePeriod) return;
    setPeriod(id);
    setActive(null);
    setDay(null);
  };

  // The card glides to its new height when rows come or go; the button to the width of its new label
  useFollowSize(cardRef, innerRef, "height");
  useFollowSize(actionRef, actionInner, "width");

  // Screen readers hear when the state changes
  const lastState = useRef(state);
  useEffect(() => {
    if (lastState.current === state) return;
    lastState.current = state;
    setAnnounce(
      state === "limit"
        ? `${title}: limit reached, ${fmt(sum)} of ${fmt(total)} ${unit} used`
        : state === "warn"
          ? `${title}: running low, ${Math.round(share * 100)}% of ${unit} used`
          : `${title}: ${fmt(sum)} of ${fmt(total)} ${unit} used`,
    );
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = resetAt !== undefined ? new Date(resetAt) : null;
  const strong = state !== "ok";
  const pct = tween("pct");

  return (
    <section
      aria-labelledby={`${uid}-title`}
      {...rest}
      ref={rootRef}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={look ?? DEFAULT_LOOK}
      data-layout={layout === "wide" ? "wide" : undefined}
      data-state={state}
    >
      {/* React 19 hoists this into <head> once, no matter how many meters render */}
      <style href="ui-usage-meter" precedence="default">
        {css}
      </style>

      <div ref={cardRef} className="ui-um__card">
        <div ref={innerRef} className="ui-um__inner">
          <header className="ui-um__head">
            <div className="ui-um__heading">
              <h3 id={`${uid}-title`} className="ui-um__title">
                {title}
              </h3>
              {(plan || reset) && (
                <p className="ui-um__sub">
                  {plan}
                  {plan && reset && (
                    <span className="ui-um__sep" aria-hidden="true">
                      ·
                    </span>
                  )}
                  {reset && (
                    <time dateTime={reset.toISOString()} title={`Resets on ${dateFormat(locale).format(reset)}`}>
                      {resetText(reset, current, dateFormat(locale).format(reset))}
                    </time>
                  )}
                </p>
              )}
            </div>
            {periods && periods.length > 1 && <PeriodSwitch periods={periods} active={activePeriod} onChoose={choose} />}
          </header>

          {/* The credits meter */}
          <div className="ui-um__figure">
            <p className="ui-um__amount">
              <span className="ui-um__big" ref={bind((el, get) => setText(el.firstChild, fmt(get("used"))))}>
                {fmt(tween("used"))}
              </span>
              <span className="ui-um__of">
                of {withUnit(fmt(total), unit)}
              </span>
            </p>
            <span className="ui-um__pct" data-state={state} ref={bind((el, get) => setText(el.lastChild?.previousSibling, fmt(Math.min(get("pct"), 999))))}>
              {strong && <span className="ui-um__dot" aria-hidden="true" />}
              {fmt(Math.min(pct, 999))}%
            </span>
          </div>

          <CreditsBreakdown rows={rows} total={total} sum={sum} unit={unit} active={active} tipLabel={tipLabel} highlight={highlight} say={setAnnounce} fmt={fmt} tween={tween} bind={bind} />

          {days.length > 0 && <DailySpark days={days} day={day} setDay={setDay} title={title} unit={unit} fmt={fmt} tween={tween} bind={bind} />}

          {limits.length > 0 && <LimitList limits={limits} warnAt={warnAt} fmt={fmt} tween={tween} bind={bind} />}
        </div>
      </div>

      {/* Standard: the tray below the card · Clean: the card's last row, under a hairline – what's left, and the button */}
      <div className="ui-um__foot">
        <span className="ui-um__status" key={state}>
          {strong && <span className="ui-um__dot" aria-hidden="true" />}
          {state === "limit" ? (
            <>
              <b>Limit reached</b>
              {sum > total && <span className="ui-um__muted">{withUnit(fmt(sum - total), "over")}</span>}
            </>
          ) : (
            <>
              {state === "warn" && <b>Running low</b>}
              <span className={state === "warn" ? "ui-um__muted" : undefined} ref={bind((el, get) => setText(el.firstChild, withUnit(fmt(get("left")), unit)))}>
                {withUnit(fmt(tween("left")), unit)} left
              </span>
            </>
          )}
        </span>
        <button ref={actionRef} type="button" className="ui-um__action" data-strong={strong || undefined} onClick={() => onUpgrade?.(state)}>
          <span ref={actionInner} className="ui-um__action-inner">
            <span key={strong ? "top-up" : "upgrade"} className="ui-um__action-text">
              {strong ? topUpLabel : upgradeLabel}
            </span>
          </span>
        </button>
      </div>

      <span className="ui-um__live ui-um__sr" role="status">
        {announce}
      </span>
    </section>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

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
.ui-um:where([data-look="standard"]),
.ui-um__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-caption-color: light-dark(#646464, #9a9aa1);
  --_tc-caption-font-size: 12px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0;
  --_tc-caption-transform: none;
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-lg: 40px;
  --_tc-control-h-md: 32px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-lg: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-3xl: 24px;
  --_tc-font-size-4xl: 28px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
  --_tc-line-height-display: 32px;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-meter-fill: #2f68ff;
  --_tc-meter-h: 4px;
  --_tc-meter-h-hero: 8px;
  --_tc-meter-radius: 999px;
  --_tc-meter-track: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 22px;
  --_tc-pill-px-lg: 10px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-seg-pad: 2px;
  --_tc-seg-thumb-bg: light-dark(#ffffff, #34343a);
  --_tc-seg-thumb-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-seg-track-bg: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-seg-track-radius: 10px;
  --_tc-shadow-overlay: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-10: 40px;
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
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
  --_tc-surface-overlay: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tracking-snug: -0.01em;
  --_tc-tracking-tight: -0.02em;
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-um:where([data-look="clean"]),
.ui-um__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-caption-color: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-caption-font-size: 10px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0.05em;
  --_tc-caption-transform: uppercase;
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-lg: 32px;
  --_tc-control-h-md: 28px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-lg: 6px;
  --_tc-control-radius-md: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-3xl: 24px;
  --_tc-font-size-4xl: 28px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
  --_tc-line-height-display: 32px;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-meter-fill: light-dark(#0060e2, #1a6cf0);
  --_tc-meter-h: 4px;
  --_tc-meter-h-hero: 8px;
  --_tc-meter-radius: 999px;
  --_tc-meter-track: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 20px;
  --_tc-pill-px-lg: 8px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-seg-pad: 2px;
  --_tc-seg-thumb-bg: light-dark(#ffffff, #34343a);
  --_tc-seg-thumb-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-seg-track-bg: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-seg-track-radius: 8px;
  --_tc-shadow-overlay: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-10: 40px;
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
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
  --_tc-surface-overlay: light-dark(#ffffff, #252527);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tracking-snug: -0.01em;
  --_tc-tracking-tight: -0.02em;
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
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

/* Colors and motion as variables – override them on .ui-um */
:where([data-look="standard"], [data-look="standard"] *).ui-um {
  /* Series colours of the breakdown, largest first */
  --tc-usage-meter-series-1: light-dark(#2f6bff, #6d8bff);
  --tc-usage-meter-series-2: light-dark(#74a0ff, #4c66c9);
  --tc-usage-meter-series-3: light-dark(#b4cbff, #34468a);
  --tc-usage-meter-series-4: light-dark(#a8a8ae, #6b6b72);
  --tc-usage-meter-series-5: light-dark(#d4d4d8, #45454b);
  /* The daily bars */
  --tc-usage-meter-spark: light-dark(#dcdce0, #3a3a40);
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 460px;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-um */
:where([data-look="clean"], [data-look="clean"] *).ui-um {
  /* The parts: the accent blue, then lighter tints of it, then a gray */
  --tc-usage-meter-series-1: light-dark(rgba(0, 96, 226, 0.765), #4d8dff);
  --tc-usage-meter-series-2: light-dark(rgba(0, 96, 226, 0.5), rgba(77, 141, 255, 0.62));
  --tc-usage-meter-series-3: light-dark(rgba(0, 96, 226, 0.3), rgba(77, 141, 255, 0.4));
  --tc-usage-meter-series-4: light-dark(rgba(0, 96, 226, 0.16), rgba(77, 141, 255, 0.22));
  --tc-usage-meter-series-5: light-dark(rgba(0, 0, 0, 0.14), rgba(255, 255, 255, 0.16));
  --tc-usage-meter-spark: var(--tc-fill-strong, var(--_tc-fill-strong));
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 460px;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-um *, .ui-um *::before, .ui-um *::after { box-sizing: border-box; }
:where(.ui-um) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where(.ui-um) :is(h3, p, ul) { margin: 0; padding: 0; }
:where(.ui-um) ul { list-style: none; }
.ui-um :is(button, [tabindex="0"]):focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-um b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-um__muted { color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-um__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card (Clean: the body of the one card) – glides to its new height when rows come or go */
.ui-um__card { overflow: hidden; transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-um__inner { display: flow-root; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__card { border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__inner { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4-5, var(--_tc-space-4-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__card { border-radius: var(--tc-card-radius, var(--_tc-card-radius)) var(--tc-card-radius, var(--_tc-card-radius)) 0 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-um__inner { padding: var(--tc-space-4, var(--_tc-space-4)); }
/* Head: title and reset date, the period switch on the right */
.ui-um__head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); }
.ui-um__heading { min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__heading { padding-top: var(--tc-space-0-5, var(--_tc-space-0-5)); }
.ui-um__title { overflow: hidden; font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__title { font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__title { font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-um__sub { overflow: hidden; color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__sub { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__sub { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
.ui-um__sep { margin: 0 var(--tc-space-1-5, var(--_tc-space-1-5)); color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
/* The period switch: a segmented control – the thumb glides to the chosen period */
.ui-um__switch { position: relative; display: grid; grid-auto-columns: auto; grid-auto-flow: column; flex: none; padding: var(--tc-seg-pad, var(--_tc-seg-pad)); border-radius: var(--tc-seg-track-radius, var(--_tc-seg-track-radius)); background: var(--tc-seg-track-bg, var(--_tc-seg-track-bg)); }
.ui-um__pill {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: calc(var(--tc-seg-track-radius, var(--_tc-seg-track-radius)) - var(--tc-seg-pad, var(--_tc-seg-pad)));
  background: var(--tc-seg-thumb-bg, var(--_tc-seg-thumb-bg));
  box-shadow: var(--tc-seg-thumb-shadow, var(--_tc-seg-thumb-shadow));
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), width var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-um__option { position: relative; z-index: 1; min-width: 0; overflow: hidden; border-radius: calc(var(--tc-seg-track-radius, var(--_tc-seg-track-radius)) - var(--tc-seg-pad, var(--_tc-seg-pad))); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); white-space: nowrap; text-overflow: ellipsis; transition: color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__option { height: 26px; padding: 0 var(--tc-space-2, var(--_tc-space-2)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__option { height: 24px; padding: 0 var(--tc-space-2, var(--_tc-space-2)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-um__option:hover, .ui-um__option[aria-checked="true"] { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__option[aria-checked="true"] { font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); }
/* The big number and its share */
.ui-um__figure { display: flex; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__figure { align-items: baseline; margin-top: var(--tc-space-4-5, var(--_tc-space-4-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__figure { align-items: center; margin-top: var(--tc-space-3-5, var(--_tc-space-3-5)); }
.ui-um__amount { display: flex; flex-wrap: wrap; align-items: baseline; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__amount { column-gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__amount { column-gap: var(--tc-space-2, var(--_tc-space-2)); }
.ui-um__big { font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__big { font-size: var(--tc-font-size-4xl, var(--_tc-font-size-4xl)); line-height: var(--tc-line-height-display, var(--_tc-line-height-display)); letter-spacing: var(--tc-tracking-tight, var(--_tc-tracking-tight)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__big { font-size: var(--tc-font-size-3xl, var(--_tc-font-size-3xl)); line-height: var(--tc-line-height-display, var(--_tc-line-height-display)); letter-spacing: var(--tc-tracking-snug, var(--_tc-tracking-snug)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-um__of { color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__of { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__of { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__pct { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; transition: color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__pct[data-state="warn"] { color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__pct[data-state="limit"] { color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* The share as a status pill – tinted amber, then red, near and at the limit */
:where([data-look="clean"], [data-look="clean"] *).ui-um__pct {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg));
  padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg));
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg));
  font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  font-variant-numeric: tabular-nums;
  transition: color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-um__pct[data-state="warn"] { background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__pct[data-state="limit"] { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* The only place amber shows up: a small dot (the words next to it say the same) */
.ui-um__dot { display: inline-block; flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); animation: ui-um-pop var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-spring, var(--_tc-ease-spring)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-um[data-state="limit"] :is(.ui-um__pct, .ui-um__status) .ui-um__dot,
:where([data-look="standard"], [data-look="standard"] *).ui-um__limit[data-state="limit"] .ui-um__dot { box-shadow: 0 0 0 3px color-mix(in srgb, var(--tc-status-warning-solid, var(--_tc-status-warning-solid)) 22%, transparent); }
:where([data-look="clean"], [data-look="clean"] *).ui-um[data-state="limit"] :is(.ui-um__pct, .ui-um__status) .ui-um__dot,
:where([data-look="clean"], [data-look="clean"] *).ui-um__limit[data-state="limit"] .ui-um__dot { background: var(--tc-status-danger-solid, var(--_tc-status-danger-solid)); }
/* The stacked bar – the hero meter */
.ui-um__bar { position: relative; margin-top: var(--tc-space-2-5, var(--_tc-space-2-5)); padding: var(--tc-space-1, var(--_tc-space-1)) 0; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); cursor: default; }
.ui-um__track { display: flex; height: var(--tc-meter-h-hero, var(--_tc-meter-h-hero)); overflow: hidden; border-radius: var(--tc-meter-radius, var(--_tc-meter-radius)); background: var(--tc-meter-track, var(--_tc-meter-track)); }
.ui-um__seg { position: relative; flex: none; height: 100%; overflow: hidden; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* A thin cut between the parts */
.ui-um__seg::after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; width: 2px; background: var(--tc-surface-raised, var(--_tc-surface-raised)); }
.ui-um__bar[data-active] .ui-um__seg:not([data-active]) { opacity: 0.3; }
/* Tooltip: a small card anchored to the middle of the part, shifted so it never leaves the card. It can be hovered
   (it sits inside the bar) and closes with Escape */
.ui-um__tip {
  position: absolute;
  bottom: calc(100% + 6px);
  z-index: 2;
  display: grid;
  background: var(--tc-surface-overlay, var(--_tc-surface-overlay));
  box-shadow: var(--tc-shadow-overlay, var(--_tc-shadow-overlay));
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(var(--tc-usage-meter-tip-x), 4px) scale(0.97);
  transition: left var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)), transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-um__tip { gap: 1px; padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__tip { gap: var(--tc-space-0-5, var(--_tc-space-0-5)); padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-md, var(--_tc-radius-md)); }
.ui-um__tip[data-open] { opacity: 1; transform: translate(var(--tc-usage-meter-tip-x), 0); pointer-events: auto; }
.ui-um__tip-label { display: flex; align-items: center; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__tip-label { gap: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__tip-label { gap: var(--tc-space-1-5, var(--_tc-space-1-5)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
.ui-um__tip-value { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-um__tip-value { line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
.ui-um__tip-value .ui-um__muted { font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); }
/* Legend: one row per category, highlighted with the bar */
.ui-um__legend { display: grid; margin-top: var(--tc-space-2-5, var(--_tc-space-2-5)); }
.ui-um__row { display: grid; grid-template-rows: 1fr; animation: ui-um-grow var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both; transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-instant, var(--_tc-duration-instant)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-um__row[data-leaving] { grid-template-rows: 0fr; opacity: 0; pointer-events: none; }
.ui-um__item { display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); min-height: 0; margin: 0 -8px; padding: 0 var(--tc-space-2, var(--_tc-space-2)); overflow: hidden; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__item { height: 30px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__item { height: 32px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); }
.ui-um__row[data-leaving] .ui-um__item { background: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__item[data-active] { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__item[data-active] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
/* The other rows step back – the swatch fades, the text stays readable */
.ui-um__legend[data-active] .ui-um__item:not([data-active]) .ui-um__swatch { opacity: 0.35; }
.ui-um__legend[data-active] .ui-um__item:not([data-active]) :is(.ui-um__label, .ui-um__value) { color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-um__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-um__label { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__label { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__label { color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-um__value { color: var(--tc-text-primary, var(--_tc-text-primary)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); font-variant-numeric: tabular-nums; }
.ui-um__share { width: 40px; text-align: right; color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-um__share { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
/* Daily sparkline */
.ui-um__daily-head { display: flex; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__daily { margin-top: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__daily { margin-top: var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__daily-head { align-items: center; line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
/* Clean: the caption on the left, the readout on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-um__daily-head > :first-child { font-size: var(--tc-caption-font-size, var(--_tc-caption-font-size)); font-weight: var(--tc-caption-font-weight, var(--_tc-caption-font-weight)); line-height: var(--tc-caption-line-height, var(--_tc-caption-line-height)); letter-spacing: var(--tc-caption-tracking, var(--_tc-caption-tracking)); text-transform: var(--tc-caption-transform, var(--_tc-caption-transform)); color: var(--tc-caption-color, var(--_tc-caption-color)); }
.ui-um__daily-read { font-variant-numeric: tabular-nums; animation: ui-um-in var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-um__spark { display: flex; align-items: stretch; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); margin-top: var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__spark { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-um__spark { height: 32px; }
/* A week gets wider gaps, so seven bars don't read as one block */
.ui-um__spark[data-few] { gap: var(--tc-space-1, var(--_tc-space-1)); }
.ui-um__day { display: flex; flex: 1 1 0; align-items: flex-end; min-width: 0; }
.ui-um__day > span { width: 100%; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-usage-meter-spark); transform-origin: bottom; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-um__spark[data-regrow] .ui-um__day > span { animation: ui-um-rise var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) both; animation-delay: calc(var(--i) * var(--tc-duration-instant, var(--_tc-duration-instant)) / 5); }
.ui-um__day[data-future] > span { height: 2px; background: var(--tc-meter-track, var(--_tc-meter-track)); }
.ui-um__spark[data-hover] .ui-um__day:not([data-active]) > span { opacity: 0.6; }
.ui-um__day[data-active] > span { background: var(--tc-accent, var(--_tc-accent)); }
/* Plan limits: thin meters, side by side on wide cards */
.ui-um__limits { display: grid; grid-template-columns: repeat(var(--n, 3), minmax(0, 1fr)); gap: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-4-5, var(--_tc-space-4-5)); margin-top: var(--tc-space-4, var(--_tc-space-4)); padding-top: var(--tc-space-3-5, var(--_tc-space-3-5)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
.ui-um__limit { display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; min-width: 0; }
.ui-um__limit-label { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-um__limit-label { line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
.ui-um__limit-value { overflow: hidden; color: var(--tc-text-primary, var(--_tc-text-primary)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); font-variant-numeric: tabular-nums; white-space: nowrap; text-overflow: ellipsis; }
.ui-um__limit-value .ui-um__muted { font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); }
.ui-um__thin { position: relative; display: block; height: var(--tc-meter-h, var(--_tc-meter-h)); overflow: hidden; border-radius: var(--tc-meter-radius, var(--_tc-meter-radius)); background: var(--tc-meter-track, var(--_tc-meter-track)); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__thin { margin-top: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__thin { margin-top: var(--tc-space-1-5, var(--_tc-space-1-5)); }
.ui-um__thin > span { position: absolute; top: 0; bottom: 0; left: 0; border-radius: inherit; background: var(--tc-meter-fill, var(--_tc-meter-fill)); transition: background-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-um__limit[data-state="warn"] .ui-um__thin > span { background: var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); }
.ui-um__limit[data-state="limit"] .ui-um__thin > span { background: var(--tc-status-danger-solid, var(--_tc-status-danger-solid)); }
/* Unlimited: a quiet striped track instead of a fill */
.ui-um__thin[data-unlimited] { background: repeating-linear-gradient(-45deg, var(--tc-meter-track, var(--_tc-meter-track)) 0 3px, transparent 3px 6px); }
/* Standard: the tray below the card · Clean: the last row of the card, under a hairline */
.ui-um__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); min-height: 44px; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-um__foot { padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-0-5, var(--_tc-space-0-5)) var(--tc-space-0-5, var(--_tc-space-0-5)) var(--tc-space-3, var(--_tc-space-3)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__foot { padding: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-4, var(--_tc-space-4)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
.ui-um__status { display: flex; align-items: center; min-width: 0; overflow: hidden; white-space: nowrap; font-variant-numeric: tabular-nums; animation: ui-um-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-um__status { gap: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-um__status { gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
.ui-um__status > :last-child { overflow: hidden; text-overflow: ellipsis; }
/* The button: a secondary action, the primary (ink) one near the limit – the same recipe as Button */
.ui-um__action {
  display: inline-flex;
  flex: none;
  justify-content: center;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  overflow: hidden;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  transition: background-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), width var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-um__action:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
.ui-um__action:active { transform: scale(0.97); }
.ui-um__action[data-strong] { background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); animation: ui-um-nudge var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-spring, var(--_tc-ease-spring)); }
.ui-um__action[data-strong]:hover { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); }
.ui-um__action[data-strong]:active { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); }
.ui-um__action-inner { display: inline-flex; align-items: center; flex: none; height: 100%; padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)); white-space: nowrap; }
.ui-um__action-text { animation: ui-um-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
@keyframes ui-um-in { from { opacity: 0; transform: translateY(3px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ui-um-grow { from { grid-template-rows: 0fr; opacity: 0; } to { grid-template-rows: 1fr; opacity: 1; } }
@keyframes ui-um-rise { from { transform: scaleY(0); } to { transform: none; } }
@keyframes ui-um-pop { 0% { transform: scale(0.3); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
@keyframes ui-um-nudge { 0% { transform: scale(0.94); } 60% { transform: scale(1.04); } 100% { transform: scale(1); } }
/* layout="wide": the full width of the container, and two columns once there's room – the figure, bar and categories
   on the left; the daily bars (bottom-aligned with the bar) and the limits on the right */
.ui-um[data-layout="wide"] { max-width: none; }
@container (min-width: 640px) {
  .ui-um[data-layout="wide"] .ui-um__inner { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: var(--tc-space-10, var(--_tc-space-10)); }
  :where([data-look="standard"], [data-look="standard"] *).ui-um[data-layout="wide"] .ui-um__inner { padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-5, var(--_tc-space-5)) var(--tc-space-4-5, var(--_tc-space-4-5)); }
  :where([data-look="clean"], [data-look="clean"] *).ui-um[data-layout="wide"] .ui-um__inner { padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-5, var(--_tc-space-5)); }
  .ui-um[data-layout="wide"] .ui-um__head { grid-column: 1; grid-row: 1; }
  .ui-um[data-layout="wide"] .ui-um__figure { grid-column: 1; grid-row: 2; }
  .ui-um[data-layout="wide"] .ui-um__bar { grid-column: 1; grid-row: 3; }
  .ui-um[data-layout="wide"] .ui-um__legend { grid-column: 1; grid-row: 4; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: var(--tc-space-6, var(--_tc-space-6)); }
  .ui-um[data-layout="wide"] .ui-um__daily { grid-column: 2; grid-row: 1 / span 3; align-self: end; margin-top: 0; }
  .ui-um[data-layout="wide"] .ui-um__spark { height: 64px; }
  .ui-um[data-layout="wide"] .ui-um__limits { grid-column: 2; grid-row: 4; align-self: start; margin-top: var(--tc-space-2-5, var(--_tc-space-2-5)); }
}
/* Narrow (phones): the switch gets its own full-width row, limits stack as rows */
@container (max-width: 400px) {
  :where([data-look="standard"], [data-look="standard"] *).ui-um__inner { padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-4, var(--_tc-space-4)); }
  :where([data-look="clean"], [data-look="clean"] *).ui-um__inner { padding: var(--tc-space-3-5, var(--_tc-space-3-5)); }
  :where([data-look="clean"], [data-look="clean"] *).ui-um__foot { padding: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-3-5, var(--_tc-space-3-5)); }
  .ui-um__head { flex-direction: column; align-items: stretch; gap: var(--tc-space-3, var(--_tc-space-3)); }
  .ui-um__switch { grid-auto-columns: minmax(0, auto); }
  .ui-um__option { padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5)); }
  :where([data-look="standard"], [data-look="standard"] *).ui-um__big { font-size: var(--tc-font-size-3xl, var(--_tc-font-size-3xl)); }
  .ui-um__limits { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-3, var(--_tc-space-3)); }
  .ui-um__limit { grid-template-columns: minmax(0, 1fr) auto; column-gap: var(--tc-space-3, var(--_tc-space-3)); }
  :where([data-look="standard"], [data-look="standard"] *).ui-um__limit-value { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); }
  :where([data-look="clean"], [data-look="clean"] *).ui-um__limit-value { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
  .ui-um__thin { grid-column: 1 / -1; margin-top: var(--tc-space-1-5, var(--_tc-space-1-5)); }
}
@container (max-width: 300px) {
  :where([data-look="standard"], [data-look="standard"] *).ui-um__of { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); }
  .ui-um__share { width: 34px; }
}
/* Touch screens: bigger targets */
@media (hover: none) and (pointer: coarse) {
  :where([data-look="standard"], [data-look="standard"] *).ui-um__option { height: 34px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-um__option { height: 32px; }
  .ui-um__item { height: 36px; }
  .ui-um__action { height: var(--tc-control-h-lg, var(--_tc-control-h-lg)); border-radius: var(--tc-control-radius-lg, var(--_tc-control-radius-lg)); }
  :where([data-look="standard"], [data-look="standard"] *).ui-um__foot { min-height: 50px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-um__foot { min-height: 52px; }
  .ui-um__bar { padding: var(--tc-space-2-5, var(--_tc-space-2-5)) 0; margin-top: var(--tc-space-1, var(--_tc-space-1)); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-um *, .ui-um *::before, .ui-um *::after { animation: none !important; transition: none !important; }
}
`;

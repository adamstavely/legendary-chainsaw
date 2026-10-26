"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { Button } from "@/components/ui/button";

/*
 * KPI Board – the top of a dashboard in one self-contained file: one date range for everything, three small trend cards, one large overview chart
 * that compares this period with the last, and a focus card for one product or plan.
 * All charts share one look: thin angular lines, a quiet fill, dates under the plot.
 *   · hover a small card and the day under the pointer gets a dot, its value in a small tag and its date on the axis
 *   · hover the overview and a dark tooltip compares this period with the last at that day
 *   · switch the range and every number rolls while the lines draw themselves in again; the filter inside the
 *     overview does the same for that one card only
 *   · on first view the cards rise in and the lines are drawn from the left
 * No chart library – plain SVG. The buttons are the library's Button (copy button.tsx alongside); the pickers use the
 * field and menu pattern tokens. The styles are injected below.
 */

export type KpiStat = {
  id: string;
  label: string;
  /** "money" runs the value through formatMoney, "count" shows a whole number */
  kind?: "money" | "count";
  /** One label per point, e.g. "17 Aug" */
  labels: string[];
  values: number[];
  /** Total of the period before – shown as the change on the right */
  previous?: number;
  /** Set when a smaller number is the good news, e.g. refunds */
  lowerIsBetter?: boolean;
};

export type KpiBoardData = {
  /** The small cards in the first row – three fit best */
  stats: KpiStat[];
  overview: {
    title: string;
    labels: string[];
    current: number[];
    previous: number[];
    /** The same two lines per segment id – picked with the filter inside this card, which changes nothing else */
    segments?: Record<string, { current: number[]; previous: number[] }>;
  };
  focus: {
    title: string;
    note?: string;
    /** What is counted, e.g. "Product sales rate" */
    metric: string;
    /** Word after the number, e.g. "items" */
    unit?: string;
    labels: string[];
    values: number[];
    /** Total of the period before */
    previous: number;
  };
};

type OwnProps = {
  /** One data set per range id */
  data: Record<string, KpiBoardData>;
  ranges: { id: string; label: string }[];
  /** Controlled range id */
  range?: string;
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  /** A filter inside the overview card, e.g. All items / Pro / Team – it only switches the overview's lines (see overview.segments) */
  segments?: { id: string; label: string }[];
  segment?: string;
  defaultSegment?: string;
  onSegmentChange?: (id: string) => void;
  /** Words after every change, e.g. "vs. last month" */
  compareLabel?: string;
  /** Names of the two lines in the overview tooltip */
  currentLabel?: string;
  previousLabel?: string;
  formatMoney?: (value: number) => string;
  /** Icon in the focus card */
  icon?: ReactNode;
  /** Heading on the left of the bar above the cards */
  title?: string;
  /** The small button at the top right of the focus card, e.g. Set up */
  setup?: { label: string; onClick: () => void };
  /** The button at the bottom of the focus card */
  action?: { label: string; onClick: () => void };
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type KpiBoardProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

/* ---------- Helpers ---------- */

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const whole = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));
const money = (n: number) => `$${new Intl.NumberFormat("en-US", { minimumFractionDigits: Math.abs(n) < 10000 ? 2 : 0, maximumFractionDigits: Math.abs(n) < 10000 ? 2 : 0 }).format(n)}`;
const ease = (t: number) => 1 - Math.pow(1 - t, 4);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A series stretched or squeezed to a fixed number of points, so lines of different lengths can glide into each other */
function resample(values: number[] | undefined, n: number): number[] {
  if (!values || values.length === 0) return new Array(n).fill(0);
  if (values.length === 1) return new Array(n).fill(values[0]);
  return Array.from({ length: n }, (_, i) => {
    const at = (i / (n - 1)) * (values.length - 1);
    const lo = Math.floor(at);
    const hi = Math.min(values.length - 1, lo + 1);
    return mix(values[lo], values[hi], at - lo);
  });
}

/** Straight segments through evenly spaced points in a 0–100 box: the line, and the same shape closed to the floor */
function trace(values: number[], lo: number, hi: number, top = 6, bottom = 94) {
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * 100, bottom - ((v - lo) / span) * (bottom - top)] as const);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("");
  return { pts, line, area: `${line}L100,100L0,100Z` };
}

/** Where a point of the real data sits on a traced (resampled) line, in percent */
const spot = (pts: readonly (readonly [number, number])[], index: number, length: number) => pts[Math.round((index / Math.max(1, length - 1)) * (pts.length - 1))];

/**
 * Numbers that roll to their new values without a React render per frame: React renders the target text (right on
 * the server, in tests and once the roll ends); a layout effect puts the previous value back before the first paint
 * and an animation frame loop writes each step into the bound element's text node. On first view every number rolls
 * up from zero. Only the existing text node is written, never replaced, so React's later updates still land.
 */
function useRollingText(target: Record<string, number>, formats: Record<string, (n: number) => string>, duration = 760) {
  const current = useRef<Record<string, number>>({});
  const els = useRef(new Map<string, HTMLElement>());
  const binders = useRef(new Map<string, (el: HTMLElement | null) => void>());
  const latestFormats = useRef(formats);
  useLayoutEffect(() => {
    latestFormats.current = formats;
  });
  const signature = JSON.stringify(target);
  useLayoutEffect(() => {
    const to = JSON.parse(signature) as Record<string, number>;
    const from: Record<string, number> = {};
    for (const k in to) from[k] = current.current[k] ?? 0;
    const write = (values: Record<string, number>) => {
      for (const [key, el] of els.current) {
        const text = el.firstChild;
        const format = latestFormats.current[key];
        if (values[key] === undefined || !format || !text || text.nodeType !== Node.TEXT_NODE) continue;
        const next = format(values[key]);
        if (text.nodeValue !== next) text.nodeValue = next;
      }
    };
    if (reduced() || Object.keys(to).every((k) => from[k] === to[k])) {
      current.current = to;
      write(to);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const e = ease(p);
      const next: Record<string, number> = {};
      for (const k in to) next[k] = mix(from[k], to[k], e);
      current.current = next;
      write(next);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    // Back to where the roll starts before this commit is painted (React has just written the target)
    write(from);
    frame = requestAnimationFrame(step);
    // Interrupted by new data: the next roll starts where this one got to
    return () => cancelAnimationFrame(frame);
  }, [signature, duration]);
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

/** State a parent may control: controlled when `value` is defined, otherwise kept here from `defaultValue`; changes are always reported */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [own, setOwn] = useState(defaultValue);
  const controlled = value !== undefined;
  const set = (next: T) => {
    if (!controlled) setOwn(next);
    onChange?.(next);
  };
  return [controlled ? value : own, set] as const;
}

/* ---------- Small parts ---------- */

const ChevronIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="m2.5 3.8 2.5 2.5 2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="m2.6 6.3 2.2 2.2 4.6-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const GearIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 4.2h5.2M10.2 4.2H12M2 9.8h1.8M6.8 9.8H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="8.7" cy="4.2" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="5.3" cy="9.8" r="1.5" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);
const BoxIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 1.9 13.3 4.8v6.4L8 14.1 2.7 11.2V4.8L8 1.9Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M2.9 4.9 8 7.7l5.1-2.8M8 7.7V14" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

/** "▲ 12%" in green or red; `good` decides the color, `up` the direction of the arrow */
function Change({ up, good, children }: { up: boolean; good: boolean; children: ReactNode }) {
  return (
    <span className="ui-kb__change" data-good={good ? "" : undefined}>
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" style={up ? undefined : { transform: "scaleY(-1)" }}>
        <path d="M4 1.2 7.2 6.4H.8L4 1.2Z" fill="currentColor" />
      </svg>
      {children}
    </span>
  );
}

/** A bordered button with its own small menu – arrow keys move, Enter picks, Escape or a press outside closes */
function Pick({ label, value, options, onChange }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (id: string) => void }) {
  const uid = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // The keyboard drives the list: the active row also gets a ring (a fill alone is too faint, WCAG 1.4.11)
  const [keys, setKeys] = useState(false);
  const selected = Math.max(0, options.findIndex((o) => o.id === value));

  useEffect(() => {
    if (!open) return;
    const down = (e: globalThis.PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open]);

  const show = (fromKeyboard = false) => {
    setActive(selected);
    setKeys(fromKeyboard);
    setOpen(true);
  };
  const choose = (index: number) => {
    setOpen(false);
    if (options[index] && options[index].id !== value) onChange(options[index].id);
    ref.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        show(true);
      }
      return;
    }
    if (e.key !== "Tab") setKeys(true);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="ui-kb__pick" data-open={open ? "" : undefined} data-keys={keys ? "" : undefined} onKeyDown={onKeyDown}>
      <button
        type="button"
        className="ui-kb__pick-button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-activedescendant={open ? `${uid}-${active}` : undefined}
        onClick={(e) => (open ? setOpen(false) : show(e.detail === 0))}
      >
        <span>{options[selected]?.label}</span>
        <ChevronIcon />
      </button>
      {open && (
        <ul id={`${uid}-list`} className="ui-kb__menu" role="listbox" aria-label={label}>
          {options.map((o, i) => (
            <li
              key={o.id}
              id={`${uid}-${i}`}
              role="option"
              aria-selected={i === selected}
              className="ui-kb__option"
              data-active={i === active ? "" : undefined}
              onPointerEnter={() => {
                setActive(i);
                setKeys(false);
              }}
              onClick={() => choose(i)}
            >
              <span>{o.label}</span>
              {i === selected && <CheckIcon />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Mouse: follow the pointer. Touch: press or drag sideways on a chart, let go and the mark leaves */
const scrub = (set: (v: number | null) => void) => {
  const move = (e: PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    set(Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)));
  };
  const end = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") set(null);
  };
  return { onPointerDown: move, onPointerMove: move, onPointerUp: end, onPointerCancel: end, onPointerLeave: () => set(null) };
};

/** Every point keeps its kink; only very long series are thinned out. Lines don't glide between ranges – they are drawn in again from the left */
const glide = (values: number[] | undefined, n: number) => {
  const v = values ?? [];
  return v.length >= 2 && v.length <= n ? v : resample(v, n);
};

type Roll = (key: string) => (el: HTMLElement | null) => void;

/** A small trend card – marks the day under the pointer on its own */
function StatCard({
  stat: s,
  index: i,
  drawn,
  at,
  onAt,
  compareLabel,
  show,
  roll,
}: {
  stat: KpiStat;
  index: number;
  /** Changes with every new data set, so the drawing-in starts over */
  drawn: string;
  at: number | null;
  onAt: (at: number | null) => void;
  compareLabel: string;
  show: (kind: KpiStat["kind"], n: number) => string;
  roll: Roll;
}) {
  const line = glide(s.values, 48);
  const hi = Math.max(...line, 1) * 1.08;
  const lo = Math.min(...line) * 0.75;
  const tr = trace(line, lo, hi, 10, 92);
  const diff = s.previous === undefined ? null : sum(s.values) - s.previous;
  const index = at === null ? null : Math.round(at * (s.values.length - 1));
  const dot = index === null ? null : spot(tr.pts, index, s.values.length);
  return (
    <section className="ui-kb__card ui-kb__stat" aria-label={s.label} style={{ ["--n" as string]: i }}>
      <header className="ui-kb__row">
        <span className="ui-kb__pair">
          <b ref={roll(`stat${i}`)}>{show(s.kind, sum(s.values))}</b>
          <span>{s.label}</span>
        </span>
        {diff !== null && (
          <span className="ui-kb__pair ui-kb__pair--end">
            {diff === 0 ? (
              <b>0</b>
            ) : (
              <Change up={diff > 0} good={s.lowerIsBetter ? diff < 0 : diff > 0}>
                {show(s.kind, Math.abs(diff))}
              </Change>
            )}
            <span>{compareLabel}</span>
          </span>
        )}
      </header>
      <div className="ui-kb__plot ui-kb__plot--small" {...scrub(onAt)}>
        <svg key={drawn} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path className="ui-kb__fill" d={tr.area} />
          <path className="ui-kb__line" d={tr.line} />
        </svg>
        {dot && index !== null && (
          <>
            <span className="ui-kb__rule" style={{ left: `${dot[0]}%`, top: `${dot[1]}%` }} />
            <span className="ui-kb__dot" style={{ left: `${dot[0]}%`, top: `${dot[1]}%` }} />
            <span className="ui-kb__tag" data-side={dot[0] > 62 ? "left" : "right"} style={{ left: `${dot[0]}%`, top: `${dot[1]}%` }}>
              <span>{s.labels[index]}</span>
              <b>{show(s.kind, s.values[index])}</b>
            </span>
          </>
        )}
      </div>
      <div className="ui-kb__axis" aria-hidden="true">
        <span>{s.labels[0]}</span>
        <span>{s.labels[s.labels.length - 1]}</span>
        {dot && index !== null && (
          <span className="ui-kb__axis-tag" style={{ left: `${Math.min(88, Math.max(12, dot[0]))}%` }}>
            {s.labels[index]}
          </span>
        )}
      </div>
    </section>
  );
}

/** The overview: this period against the last, with its own segment filter */
function OverviewCard({
  overview,
  lines: ov,
  lineKey,
  segments,
  segmentId,
  onSegment,
  compareLabel,
  currentLabel,
  previousLabel,
  formatMoney,
  roll,
}: {
  overview: KpiBoardData["overview"];
  /** The two lines of the picked segment */
  lines: { current: number[]; previous: number[] };
  /** Changes with the range and the segment, so the drawing-in starts over */
  lineKey: string;
  segments?: { id: string; label: string }[];
  segmentId?: string;
  onSegment: (id: string) => void;
  compareLabel: string;
  currentLabel: string;
  previousLabel: string;
  formatMoney: (n: number) => string;
  roll: Roll;
}) {
  const uid = useId().replace(/:/g, "");
  const [at, setAt] = useState<number | null>(null);
  // A new range or segment: the mark leaves
  const [shownKey, setShownKey] = useState(lineKey);
  if (shownKey !== lineKey) {
    setShownKey(lineKey);
    setAt(null);
  }
  const now = glide(ov.current, 72);
  const before = glide(ov.previous, 72);
  const ovHi = Math.max(...now, ...before, 1) * 1.06;
  const ovLo = Math.min(...now, ...before) * 0.82;
  const ovNow = trace(now, ovLo, ovHi);
  const ovBefore = trace(before, ovLo, ovHi);
  const ovChange = sum(ov.previous) ? ((sum(ov.current) - sum(ov.previous)) / sum(ov.previous)) * 100 : 0;
  const ovIndex = at === null ? null : Math.round(at * (ov.current.length - 1));
  const ovDot = ovIndex === null ? null : spot(ovNow.pts, ovIndex, ov.current.length);
  const ovDotBefore = ovIndex === null ? null : spot(ovBefore.pts, ovIndex, ov.current.length);
  return (
    <section className="ui-kb__card ui-kb__overview" aria-label={overview.title} style={{ ["--n" as string]: 3 }}>
      <header className="ui-kb__row ui-kb__row--top">
        <div>
          <div className="ui-kb__label">{overview.title}</div>
          <div className="ui-kb__figure">
            <b ref={roll("overview")}>{formatMoney(sum(ov.current))}</b>
            <span className="ui-kb__vs">
              <i data-good={ovChange >= 0 ? "" : undefined}>
                {ovChange >= 0 ? "+" : "−"}
                {Math.abs(ovChange).toFixed(1)}%
              </i>{" "}
              {compareLabel}
            </span>
          </div>
        </div>
        {segments && segmentId && <Pick label="Segment" value={segmentId} options={segments} onChange={onSegment} />}
      </header>
      <div className="ui-kb__plot ui-kb__plot--large" {...scrub(setAt)}>
        <svg key={lineKey} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--tc-chart-1, light-dark(#2f68ff, #6b95ff))" stopOpacity="0.14" />
              <stop offset="1" stopColor="var(--tc-chart-1, light-dark(#2f68ff, #6b95ff))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: 19 }, (_, i) => (
            <path key={i} className="ui-kb__grid" d={`M${((i / 18) * 100).toFixed(2)},0V100`} />
          ))}
          <path d={ovNow.area} fill={`url(#${uid}-fade)`} />
          <path className="ui-kb__line ui-kb__line--soft" d={ovBefore.line} />
          <path className="ui-kb__line" d={ovNow.line} />
        </svg>
        {ovDot && ovDotBefore && ovIndex !== null && (
          <>
            <span className="ui-kb__rule" style={{ left: `${ovDot[0]}%`, top: 0 }} />
            <span className="ui-kb__dot ui-kb__dot--soft" style={{ left: `${ovDotBefore[0]}%`, top: `${ovDotBefore[1]}%` }} />
            <span className="ui-kb__dot" style={{ left: `${ovDot[0]}%`, top: `${ovDot[1]}%` }} />
            <div className="ui-kb__tip" data-side={ovDot[0] > 58 ? "left" : "right"} style={{ left: `${ovDot[0]}%`, top: `${Math.min(ovDot[1], ovDotBefore[1])}%` }}>
              <div className="ui-kb__tip-head">
                <span>{overview.labels[ovIndex]}</span>
                <b>{formatMoney(ov.current[ovIndex] + (ov.previous[ovIndex] ?? 0))}</b>
              </div>
              <div className="ui-kb__tip-row">
                <i />
                <span>{currentLabel}</span>
                <b>{formatMoney(ov.current[ovIndex])}</b>
              </div>
              <div className="ui-kb__tip-row" data-soft="">
                <i />
                <span>{previousLabel}</span>
                <b>{formatMoney(ov.previous[ovIndex] ?? 0)}</b>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="ui-kb__axis" aria-hidden="true">
        <span>{overview.labels[0]}</span>
        <span>{overview.labels[overview.labels.length - 1]}</span>
      </div>
    </section>
  );
}

/** The focus card: one product, plan or channel */
function FocusCard({
  focus,
  drawn,
  icon,
  setup,
  action,
  compareLabel,
  currentLabel,
  previousLabel,
  roll,
}: {
  focus: KpiBoardData["focus"];
  drawn: string;
  icon?: ReactNode;
  setup?: { label: string; onClick: () => void };
  action?: { label: string; onClick: () => void };
  compareLabel: string;
  currentLabel: string;
  previousLabel: string;
  roll: Roll;
}) {
  const [focusAt, setFocusAt] = useState<number | null>(null);
  const [shownKey, setShownKey] = useState(drawn);
  if (shownKey !== drawn) {
    setShownKey(drawn);
    setFocusAt(null);
  }
  const focusLine = glide(focus.values, 48);
  const fHi = Math.max(...focusLine, 1) * 1.05;
  const fLo = Math.min(...focusLine) * 0.8;
  const fTrace = trace(focusLine, fLo, fHi, 8, 92);
  const fTotal = sum(focus.values);
  const fChange = focus.previous ? ((fTotal - focus.previous) / focus.previous) * 100 : 0;
  const fIndex = focusAt === null ? null : Math.round(focusAt * (focus.values.length - 1));
  const fDot = fIndex === null ? null : spot(fTrace.pts, fIndex, focus.values.length);
  return (
    <section className="ui-kb__card ui-kb__focus" aria-label={focus.title} style={{ ["--n" as string]: 4 }}>
      <header className="ui-kb__row ui-kb__row--top">
        <div className="ui-kb__product">
          <span className="ui-kb__icon">{icon ?? <BoxIcon />}</span>
          <span className="ui-kb__pair">
            <b>{focus.title}</b>
            {focus.note && <span>{focus.note}</span>}
          </span>
        </div>
        {setup && (
          <Button variant="secondary" size="sm" className="ui-kb__setup" icon={<GearIcon />} onClick={setup.onClick}>
            {setup.label}
          </Button>
        )}
      </header>
      <div className="ui-kb__label">{focus.metric}</div>
      <div className="ui-kb__figure ui-kb__figure--small">
        {/* The total rolls; the day under the pointer doesn't */}
        <b ref={fIndex === null ? roll("focus") : undefined}>
          {whole(fIndex === null ? fTotal : focus.values[fIndex])}
          {focus.unit ? ` ${focus.unit}` : ""}
        </b>
        <span className="ui-kb__vs">
          {fIndex === null ? (
            <>
              <Change up={fChange >= 0} good={fChange >= 0}>
                {Math.abs(fChange).toFixed(0)}%
              </Change>{" "}
              {compareLabel}
            </>
          ) : (
            focus.labels[fIndex]
          )}
        </span>
      </div>
      <div className="ui-kb__plot ui-kb__plot--small" {...scrub(setFocusAt)}>
        <svg key={drawn} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path className="ui-kb__fill" d={fTrace.area} />
          <path className="ui-kb__line" d={fTrace.line} />
        </svg>
        {fDot && (
          <>
            <span className="ui-kb__rule" style={{ left: `${fDot[0]}%`, top: `${fDot[1]}%` }} />
            <span className="ui-kb__dot" style={{ left: `${fDot[0]}%`, top: `${fDot[1]}%` }} />
          </>
        )}
      </div>
      <div className="ui-kb__legend">
        <span data-soft="">{previousLabel}</span>
        <b data-soft="" ref={roll("focusPrevious")}>
          {whole(focus.previous)}
        </b>
        <span>{currentLabel}</span>
        <b ref={roll("focusLegend")}>{whole(fTotal)}</b>
      </div>
      {action && (
        <Button variant="secondary" className="ui-kb__action" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </section>
  );
}

export function KpiBoard({
  data,
  ranges,
  range,
  defaultRange,
  onRangeChange,
  segments,
  segment,
  defaultSegment,
  onSegmentChange,
  compareLabel = "vs. last period",
  currentLabel = "This period",
  previousLabel = "Last period",
  formatMoney = money,
  icon,
  title,
  setup,
  action,
  className,
  ref,
  ...rest
}: KpiBoardProps) {
  const [rangeId, setRange] = useControllable(range, defaultRange ?? ranges[0]?.id ?? "", onRangeChange);
  // "" when there is no filter
  const [segmentId, setSegment] = useControllable(segment, defaultSegment ?? segments?.[0]?.id ?? "", onSegmentChange);
  const d = data[rangeId] ?? Object.values(data)[0];

  // The overview follows the range and its own filter; nothing else reacts to that filter
  const ov = (segmentId && d.overview.segments?.[segmentId]) || d.overview;
  const show = (kind: KpiStat["kind"], n: number) => (kind === "count" ? whole(n) : formatMoney(n));

  /** The small card under the pointer and where – one at a time */
  const [day, setDay] = useState<{ id: string; at: number } | null>(null);
  const [shownRange, setShownRange] = useState(rangeId);
  if (shownRange !== rangeId) {
    setShownRange(rangeId);
    setDay(null);
  }

  // Every number rolls from the data that was shown to the new data (from zero on first view)
  const targets: Record<string, number> = {
    overview: sum(ov.current),
    focus: sum(d.focus.values),
    focusLegend: sum(d.focus.values),
    focusPrevious: d.focus.previous,
  };
  const formats: Record<string, (n: number) => string> = { overview: formatMoney, focus: whole, focusLegend: whole, focusPrevious: whole };
  d.stats.forEach((s, i) => {
    targets[`stat${i}`] = sum(s.values);
    formats[`stat${i}`] = (n) => show(s.kind, n);
  });
  const roll = useRollingText(targets, formats);

  return (
    <div {...rest} ref={ref} className={["ui-kb", className].filter(Boolean).join(" ")}>
      <style href="ui-kpi-board" precedence="default">
        {css}
      </style>

      {/* The date range sits above everything, because it changes every card */}
      <div className="ui-kb__bar">
        {title && <h2 className="ui-kb__heading">{title}</h2>}
        <Pick label="Date range" value={rangeId} options={ranges} onChange={setRange} />
      </div>

      {/* Row 1 – small trend cards */}
      {d.stats.map((s, i) => (
        <StatCard
          key={s.id}
          stat={s}
          index={i}
          drawn={rangeId}
          at={day?.id === s.id ? day.at : null}
          onAt={(at) => setDay(at === null ? null : { id: s.id, at })}
          compareLabel={compareLabel}
          show={show}
          roll={roll}
        />
      ))}

      {/* Row 2 – the overview and the focus card */}
      <OverviewCard
        overview={d.overview}
        lines={ov}
        lineKey={`${rangeId}/${segmentId}`}
        segments={segments}
        segmentId={segmentId}
        onSegment={setSegment}
        compareLabel={compareLabel}
        currentLabel={currentLabel}
        previousLabel={previousLabel}
        formatMoney={formatMoney}
        roll={roll}
      />
      <FocusCard
        focus={d.focus}
        drawn={rangeId}
        icon={icon}
        setup={setup}
        action={action}
        compareLabel={compareLabel}
        currentLabel={currentLabel}
        previousLabel={previousLabel}
        roll={roll}
      />
    </div>
  );
}

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"]) { color-scheme: light; }

.ui-kb {
  /* Wells: chart fill */
  --tc-kpi-board-well: light-dark(#f6f6f8, #202024);
  /* Cards rise and lines draw in one after another */
  --tc-kpi-board-stagger: 60ms;
  --tc-kpi-board-series-soft: light-dark(#a9c4ff, #37508f);
  /* The overview tooltip stays dark in both themes, so its series colours are tuned for it */
  --tc-kpi-board-tip-bg: light-dark(#1c1c20, #2c2c32);
  --tc-kpi-board-tip-fg: rgba(255, 255, 255, 0.72);
  --tc-kpi-board-tip-strong: #ffffff;
  --tc-kpi-board-tip-total: #4ade9b;
  --tc-kpi-board-tip-series: #7ea2ff;
  --tc-kpi-board-tip-series-soft: #8c9bc4;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md-plus, 13.5px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-kb *, .ui-kb *::before, .ui-kb *::after { box-sizing: border-box; }
.ui-kb svg { display: block; }
.ui-kb b { font-weight: var(--tc-font-weight-semibold, 600); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-kb i { font-style: normal; }

/* ----- The bar above the cards: a heading, and the date range for all of them ----- */
.ui-kb__bar { grid-column: 1 / -1; display: flex; align-items: center; justify-content: flex-end; gap: 12px; min-height: 30px; }
.ui-kb__heading { flex: 1; min-width: 0; margin: 0; overflow: hidden; font-size: var(--tc-font-size-xl, 16px); font-weight: var(--tc-font-weight-semibold, 600); line-height: var(--tc-line-height-loose, 24px); letter-spacing: -0.01em; color: var(--tc-text-primary, light-dark(#171717, #ededed)); white-space: nowrap; text-overflow: ellipsis; }

/* ----- Cards: the library card ----- */
.ui-kb__card { grid-column: span 2; display: flex; flex-direction: column; min-width: 0; padding: 16px 16px 14px; border-radius: var(--tc-card-radius, 16px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); animation: ui-kb-rise var(--tc-duration-slowest, 560ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1)) both; animation-delay: calc(var(--n) * var(--tc-kpi-board-stagger)); }
.ui-kb__overview { grid-column: span 4; }
.ui-kb__focus { padding-bottom: 16px; }
.ui-kb__row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; min-width: 0; }
.ui-kb__pair { display: grid; min-width: 0; font-variant-numeric: tabular-nums; }
.ui-kb__pair > * { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-kb__pair b { font-size: var(--tc-font-size-lg, 14px); }
.ui-kb__pair span { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-kb__pair--end { justify-items: end; flex: none; text-align: right; }
.ui-kb__change { display: inline-flex; align-items: center; gap: 5px; font-size: var(--tc-font-size-lg, 14px); font-weight: var(--tc-font-weight-semibold, 600); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); font-variant-numeric: tabular-nums; }
.ui-kb__change[data-good] { color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }

/* ----- One look for every chart: thin angular line, quiet fill, a floor line ----- */
.ui-kb__plot { position: relative; margin-top: 14px; border-bottom: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); cursor: crosshair; touch-action: pan-y; }
.ui-kb__plot--small { height: 64px; }
.ui-kb__plot--large { flex: 1; min-height: 190px; margin-top: 16px; border-bottom: 0; }
.ui-kb__plot svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; animation: ui-kb-draw var(--tc-duration-reveal-slow, 900ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1)) both; animation-delay: calc((var(--n) + 2) * var(--tc-kpi-board-stagger)); }
.ui-kb__line { fill: none; stroke: var(--tc-chart-1, light-dark(#2f68ff, #6b95ff)); stroke-width: 1.5; stroke-linejoin: miter; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.ui-kb__line--soft { stroke: var(--tc-kpi-board-series-soft); }
.ui-kb__fill { fill: var(--tc-kpi-board-well); }
.ui-kb__grid { fill: none; stroke: var(--tc-border-default, light-dark(#ececec, #2a2a2e)); stroke-width: 1; stroke-dasharray: 4 4; vector-effect: non-scaling-stroke; }
.ui-kb__axis { position: relative; display: flex; justify-content: space-between; height: 16px; margin-top: 8px; font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; }

/* Pointing at a day */
.ui-kb__rule { position: absolute; bottom: 0; width: 0; margin-left: -0.5px; border-left: 1px dashed var(--tc-chart-neutral, light-dark(#a3a3a3, #5c5c63)); pointer-events: none; }
.ui-kb__dot { position: absolute; z-index: 1; width: 8px; height: 8px; margin: -4px 0 0 -4px; border: 1.5px solid var(--tc-chart-1, light-dark(#2f68ff, #6b95ff)); border-radius: 50%; background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); pointer-events: none; }
.ui-kb__dot--soft { border-color: var(--tc-kpi-board-series-soft); }
.ui-kb__tag { position: absolute; z-index: 2; display: inline-flex; gap: 12px; height: 24px; padding: 0 8px; border-radius: var(--tc-radius-sm, 6px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: var(--tc-shadow-raised, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-loose, 24px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); white-space: nowrap; pointer-events: none; transform: translate(10px, -130%); font-variant-numeric: tabular-nums; animation: ui-kb-in var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease) both; }
.ui-kb__tag[data-side="left"] { transform: translate(calc(-100% - 10px), -130%); }
.ui-kb__tag b { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-chart-1, light-dark(#2f68ff, #6b95ff)); }
.ui-kb__axis-tag { position: absolute; top: -4px; height: 22px; padding: 0 7px; border: 1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e)); border-radius: var(--tc-radius-sm, 6px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); transform: translateX(-50%); }

/* ----- Overview ----- */
.ui-kb__row--top { padding-bottom: 14px; border-bottom: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-kb__label { font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-kb__figure { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; margin-top: 4px; font-variant-numeric: tabular-nums; }
.ui-kb__figure b { font-size: var(--tc-font-size-3xl, 24px); line-height: var(--tc-line-height-display, 32px); letter-spacing: -0.02em; }
.ui-kb__figure--small b { font-size: var(--tc-font-size-2xl, 20px); line-height: var(--tc-line-height-display-sm, 28px); }
.ui-kb__vs { display: inline-flex; align-items: baseline; gap: 5px; font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; }
.ui-kb__vs i { font-weight: var(--tc-font-weight-semibold, 600); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-kb__vs i[data-good] { color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-kb__vs .ui-kb__change { font-size: var(--tc-font-size-md, 13px); }

/* Pickers: a select field (field tokens) with a menu (menu tokens) */
.ui-kb__pick { position: relative; flex: none; }
.ui-kb__pick-button { display: inline-flex; align-items: center; gap: 8px; height: var(--tc-field-h, 36px); margin: 0; padding: 0 10px 0 var(--tc-field-px, 12px); border: 0; border-radius: var(--tc-field-radius, 10px); background: var(--tc-field-bg, light-dark(#ffffff, #232326)); box-shadow: var(--tc-field-shadow, inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); font: inherit; font-size: var(--tc-field-font-size, 13px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease); }
.ui-kb__pick-button:hover, .ui-kb__pick[data-open] .ui-kb__pick-button { box-shadow: var(--tc-field-shadow-hover, inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-kb__pick-button:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-kb__pick-button svg { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); transition: transform var(--tc-duration-moderate, 260ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1)); }
.ui-kb__pick[data-open] .ui-kb__pick-button svg { transform: rotate(180deg); }
.ui-kb__menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: var(--tc-z-dropdown, 30); min-width: max(100%, 148px); margin: 0; padding: var(--tc-menu-padding, 4px); border-radius: var(--tc-menu-radius, 12px); background: var(--tc-menu-bg, light-dark(#ffffff, #232326)); box-shadow: var(--tc-menu-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); list-style: none; transform-origin: 100% 0; animation: ui-kb-menu var(--tc-duration-base, 200ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1)) both; }
.ui-kb__option { display: flex; align-items: center; justify-content: space-between; gap: 14px; height: var(--tc-menu-item-h, 32px); padding: 0 var(--tc-menu-item-px, 10px); border-radius: var(--tc-menu-item-radius, 8px); font-size: var(--tc-menu-item-font-size, 13px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); white-space: nowrap; cursor: pointer; }
.ui-kb__option[data-active] { background: var(--tc-menu-item-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-kb__pick[data-keys] .ui-kb__option[data-active] { box-shadow: inset 0 0 0 var(--tc-focus-ring-width, 2px) var(--tc-focus-ring, light-dark(#2f68ff, #6b95ff)); }
.ui-kb__option[aria-selected="true"] { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-menu-item-selected-fg, light-dark(#2456d6, #8ab4ff)); }
.ui-kb__option svg { color: var(--tc-menu-item-selected-fg, light-dark(#2456d6, #8ab4ff)); }

.ui-kb__tip { position: absolute; z-index: 3; min-width: 168px; padding: 9px 11px 10px; border-radius: var(--tc-radius-md, 8px); background: var(--tc-kpi-board-tip-bg); box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-kpi-board-tip-fg); pointer-events: none; transform: translate(14px, calc(-100% - 12px)); font-variant-numeric: tabular-nums; animation: ui-kb-in var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease) both; }
.ui-kb__tip[data-side="left"] { transform: translate(calc(-100% - 14px), calc(-100% - 12px)); }
.ui-kb__tip b { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-kpi-board-tip-strong); }
.ui-kb__tip-head { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 6px; color: var(--tc-kpi-board-tip-strong); }
.ui-kb__tip-head b { color: var(--tc-kpi-board-tip-total); }
.ui-kb__tip-row { display: flex; align-items: center; gap: 7px; }
.ui-kb__tip-row span { flex: 1; }
.ui-kb__tip-row i { width: 7px; height: 7px; border: 1.5px solid var(--tc-kpi-board-tip-series); border-radius: 50%; }
.ui-kb__tip-row[data-soft] i { border-color: var(--tc-kpi-board-tip-series-soft); border-style: dashed; }

/* ----- Focus card ----- */
.ui-kb__focus .ui-kb__row--top { align-items: center; min-height: 69px; margin-bottom: 16px; }
.ui-kb__focus .ui-kb__plot--small { flex: 1; min-height: 64px; margin-top: 16px; }
.ui-kb__product { display: flex; align-items: center; gap: 12px; min-width: 0; }
.ui-kb__product b { font-size: var(--tc-font-size-lg-plus, 15px); font-weight: var(--tc-font-weight-medium, 500); }
.ui-kb__icon { display: grid; flex: none; place-items: center; width: 36px; height: 36px; border-radius: var(--tc-radius-lg, 10px); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-kb__focus .ui-kb__label { font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-kb__legend { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; margin-top: 12px; font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-kb__legend b { margin-right: 6px; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-chart-1, light-dark(#2f68ff, #6b95ff)); }
/* The last period's line is pale, so its number is plain text with a pale swatch beside the label */
.ui-kb__legend b[data-soft] { color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-kb__legend span::before { content: ""; display: inline-block; width: 10px; height: 0; margin: 0 6px 3px 0; border-top: 2px solid var(--tc-chart-1, light-dark(#2f68ff, #6b95ff)); vertical-align: middle; }
.ui-kb__legend span[data-soft]::before { border-top-color: var(--tc-kpi-board-series-soft); }
/* Two classes, so these win over Button's own margin wherever the styles land */
.ui-kb .ui-kb__setup { flex: none; }
.ui-kb .ui-kb__action { width: 100%; margin-top: auto; }
.ui-kb .ui-kb__legend + .ui-kb__action { margin-top: 16px; }

@keyframes ui-kb-rise { from { opacity: 0; transform: translateY(8px); } }
@keyframes ui-kb-draw { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(-8px -8px -8px -8px); } }
@keyframes ui-kb-in { from { opacity: 0; } }
@keyframes ui-kb-menu { from { opacity: 0; transform: translateY(-4px) scale(0.97); } }

/* Narrower containers: the overview and the focus card take a full row, then everything stacks */
@container (max-width: 820px) {
  .ui-kb__overview, .ui-kb__focus { grid-column: span 6; }
  /* Three small cards still share a row – the change moves under the label, and its words give way */
  .ui-kb__stat .ui-kb__row { flex-direction: column; gap: 2px; }
  .ui-kb__stat .ui-kb__pair--end { justify-items: start; text-align: left; }
  .ui-kb__stat .ui-kb__change { font-size: var(--tc-font-size-sm-plus, 12.5px); }
  .ui-kb__stat .ui-kb__pair--end > span:last-child { display: none; }
}
@container (max-width: 600px) {
  .ui-kb { gap: 8px; }
  .ui-kb__card { grid-column: span 6; }
  .ui-kb__stat .ui-kb__row { flex-direction: row; gap: 12px; }
  .ui-kb__stat .ui-kb__pair--end { justify-items: end; text-align: right; }
  .ui-kb__stat .ui-kb__change { font-size: var(--tc-font-size-lg, 14px); }
  .ui-kb__stat .ui-kb__pair--end > span:last-child { display: block; }
  .ui-kb__row--top { flex-wrap: wrap; }
  .ui-kb__plot--large { min-height: 160px; }
}

@media (pointer: coarse) {
  .ui-kb__option { height: 38px; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-kb__card, .ui-kb__plot svg, .ui-kb__tag, .ui-kb__tip, .ui-kb__menu, .ui-kb__pick-button, .ui-kb__pick-button svg { animation: none; transition: none; }
}
`;

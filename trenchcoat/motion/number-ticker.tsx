"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ComponentPropsWithoutRef, type Ref } from "react";

/*
 * Number Ticker – animated numbers like an odometer, in a single self-contained file.
 * Every digit is a small vertical column that rolls to its new value: up when the number grows, down when it
 * shrinks. On first view it counts in from zero. Formatting comes from Intl.NumberFormat, so currency signs,
 * separators and percent signs stay put while only the digits move. The styles are injected below.
 * The roll writes transforms straight to the DOM: React renders once per new value, never per frame.
 * Off screen or in a hidden tab a roll jumps to its end; reduced motion (read at every roll) jumps too.
 * Screen readers read the formatted number; each new value is announced once (a polite live region on the root –
 * pass aria-live="off" for numbers that change on their own every few seconds).
 * Part of Trenchcoat. Imports: react only.
 */

export type NumberTickerOwnProps = {
  /** The number to show */
  value: number;
  /** Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" } */
  format?: Intl.NumberFormatOptions;
  /** Locale for formatting, e.g. "en-US" – defaults to the browser's (pass one when you render on the server) */
  locale?: string;
  /** Length of a roll in ms */
  duration?: number;
  /** Wait before the first count-in, in ms */
  delay?: number;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLSpanElement>;
};

/** Other DOM props go to the root */
export type NumberTickerProps = Omit<ComponentPropsWithoutRef<"span">, keyof NumberTickerOwnProps> & NumberTickerOwnProps;

type Part = { key: string; digit: number } | { key: string; char: string };

/** "$48,240" → parts keyed from the right, so the ones column keeps its identity when the number grows */
function split(text: string): Part[] {
  const chars = Array.from(text);
  const parts: Part[] = [];
  let d = 0;
  let s = 0;
  for (let i = chars.length - 1; i >= 0; i--) {
    const c = chars[i];
    if (c >= "0" && c <= "9") parts.unshift({ key: `d${d++}`, digit: c.charCodeAt(0) - 48 });
    else parts.unshift({ key: `s${s++}`, char: c });
  }
  return parts;
}

const mod10 = (n: number) => ((n % 10) + 10) % 10;
const ease = (t: number) => 1 - Math.pow(1 - t, 4);
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
/** Position → transform; the stack holds 0–9 plus a trailing 0, so 9 → 0 rolls seamlessly */
const place = (col: HTMLElement, pos: number) => {
  const stack = col.firstElementChild as HTMLElement | null;
  if (stack) stack.style.transform = `translateY(${(-mod10(pos) / 11) * 100}%)`;
};

type Roll = { pos: number; from: number; to: number };

/** The component's own ref and the caller's `ref` prop on one element (React 19 ref cleanups included) */
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

/**
 * The rolling digits, kept outside React: per-column positions, the frame loop and the column elements.
 * Returns `attach` (one stable ref callback for every column, keyed by its data-col) and `roll()`, which rolls
 * every column to `latest`.
 */
function useDigitRolls(latest: { current: { parts: Part[]; value: number; duration: number } }, visible: { current: boolean }) {
  const rolls = useRef(new Map<string, Roll>());
  const cols = useRef(new Map<string, HTMLElement>());
  const frame = useRef(0);
  const prev = useRef(0);
  const up = useRef(true);

  const apply = useCallback(() => {
    for (const [k, r] of rolls.current) {
      const el = cols.current.get(k);
      if (el) place(el, r.pos);
    }
  }, []);

  /** Jump the running roll to its end */
  const finish = useCallback(() => {
    if (!frame.current) return;
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    for (const r of rolls.current.values()) r.pos = r.from = r.to;
    apply();
  }, [apply]);

  const roll = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    const { parts, value, duration } = latest.current;
    // Same value again (e.g. a format change) keeps the last direction
    if (value !== prev.current) up.current = value > prev.current;
    prev.current = value;
    const instant = reducedMotion() || !visible.current || duration <= 0;
    const keys = new Set<string>();
    for (const p of parts) {
      if (!("digit" in p)) continue;
      keys.add(p.key);
      const r = rolls.current.get(p.key) ?? { pos: 0, from: 0, to: 0 };
      const delta = up.current ? mod10(p.digit - r.pos) : -mod10(r.pos - p.digit);
      r.from = r.pos;
      r.to = r.pos + delta;
      if (instant) r.pos = r.from = r.to;
      rolls.current.set(p.key, r);
    }
    for (const k of rolls.current.keys()) if (!keys.has(k)) rolls.current.delete(k);
    if (instant) return apply();

    // The clock starts on the first frame, from the frame's own timestamp
    let t0 = -1;
    const tick = (now: number) => {
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / duration);
      const e = ease(t);
      for (const r of rolls.current.values()) r.pos = r.from + (r.to - r.from) * e;
      apply();
      frame.current = t < 1 ? requestAnimationFrame(tick) : 0;
    };
    frame.current = requestAnimationFrame(tick);
  }, [apply, latest, visible]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // One stable ref callback, so re-renders don't detach and re-attach every digit; a column's key never changes
  const attach = useCallback((el: HTMLElement | null) => {
    const key = el?.dataset.col;
    if (!el || !key) return;
    cols.current.set(key, el);
    place(el, rolls.current.get(key)?.pos ?? 0);
    return () => {
      if (cols.current.get(key) === el) cols.current.delete(key);
    };
  }, []);

  return { attach, roll, finish, cols };
}

export function NumberTicker({ value, format, locale, duration = 900, delay = 0, className, ref, ...rest }: NumberTickerProps) {
  // Options compared by content, so an inline object doesn't re-format on every render
  const fmtKey = JSON.stringify(format ?? {});
  const text = useMemo(
    () => new Intl.NumberFormat(locale, JSON.parse(fmtKey) as Intl.NumberFormatOptions).format(value),
    [value, locale, fmtKey],
  );
  const parts = useMemo(() => split(text), [text]);

  const root = useRef<HTMLSpanElement>(null);
  const setRoot = useRootRef(root, ref);
  const latest = useRef({ parts, value, duration, delay });
  const visible = useRef(true);
  const started = useRef(false);
  const { attach, roll, finish, cols } = useDigitRolls(latest, visible);

  // Columns that show up after the first render slide in (e.g. 9,999 → 10,000) – marked on the DOM before paint
  const seen = useRef<Set<string> | null>(null);
  useLayoutEffect(() => {
    const keys = new Set(parts.filter((p) => "digit" in p).map((p) => p.key));
    if (seen.current) for (const k of keys) if (!seen.current.has(k)) cols.current.get(k)?.setAttribute("data-enter", "");
    seen.current = keys;
  }, [parts, cols]);

  // Roll every digit column to its new value, once the count-in has started
  useEffect(() => {
    latest.current = { parts, value, duration, delay };
    if (started.current) roll();
  }, [parts, value, duration, delay, roll]);

  // Start once the number scrolls into view; afterwards, rolls off screen or in a hidden tab jump to their end
  useEffect(() => {
    const el = root.current;
    const begin = () => {
      started.current = true;
      roll();
    };
    if (!el || typeof IntersectionObserver === "undefined") return begin();
    let timer = 0;
    let inView = false;
    const update = () => {
      visible.current = inView && document.visibilityState !== "hidden";
      if (!visible.current) finish();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        update();
        if (inView && !started.current && !timer) timer = window.setTimeout(begin, latest.current.delay);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      clearTimeout(timer);
    };
  }, [roll, finish]);

  return (
    <>
      <style href="ui-number-ticker" precedence="default">
        {css}
      </style>
      <span aria-live="polite" {...rest} ref={setRoot} className={["ui-nt", className].filter(Boolean).join(" ")}>
        <span className="ui-nt__sr">{text}</span>
        <span className="ui-nt__track" aria-hidden="true">
          {parts.map((p) =>
            "digit" in p ? (
              <span key={p.key} className="ui-nt__col" data-col={p.key} ref={attach}>
                <span className="ui-nt__stack">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n, i) => (
                    <span key={i} className="ui-nt__cell">
                      {n}
                    </span>
                  ))}
                </span>
              </span>
            ) : (
              <span key={p.key} className="ui-nt__static">
                {p.char}
              </span>
            ),
          )}
        </span>
      </span>
    </>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

.ui-nt {
  --tc-number-ticker-lh: 1.15em;
  position: relative;
  display: inline-flex;
  line-height: var(--tc-number-ticker-lh);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.ui-nt__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.ui-nt__track {
  display: inline-flex;
  align-items: flex-start;
  height: var(--tc-number-ticker-lh);
  line-height: var(--tc-number-ticker-lh);
}
.ui-nt__col {
  display: inline-block;
  height: var(--tc-number-ticker-lh);
  overflow: hidden;
  /* Soft top and bottom edges while digits pass through */
  -webkit-mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
  mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
}
.ui-nt__col[data-enter] { animation: ui-nt-in var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both; }
.ui-nt__stack {
  display: flex;
  flex-direction: column;
  will-change: transform;
}
.ui-nt__cell,
.ui-nt__static {
  display: block;
  height: var(--tc-number-ticker-lh);
  text-align: center;
}
.ui-nt__static { white-space: pre; }

@keyframes ui-nt-in {
  from { opacity: 0; transform: translateY(-35%); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-nt__col[data-enter] { animation: none; }
}

`;

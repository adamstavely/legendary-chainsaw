"use client";

/*
 * Compact Breakdown – one total split into its parts, in a small card and a single self-contained file.
 * A big number, a thin stacked bar and the parts as a ranked list. Switching the period rolls every number,
 * the bar glides to its new split and the rows trade places when the ranking changes. Hovering a part (in the
 * bar or the list) dims the rest and rolls the big number to that part's value; leaving rolls it back.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: compact-breakdown.tsx is Standard,
 * compact-breakdown-clean.tsx is Clean). Standard sets a white card on a gray tray that holds the footer line;
 * Clean is one white card with hairline shadows, the footer as its last row, and a period switch whose light fill
 * slides short and crisp.
 */
// Generated from src/components/compact-breakdown.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-cb";

export type BreakdownItem = {
  /** Stable key across periods – defaults to the label */
  id?: string;
  label: string;
  value: number;
  /** Any CSS color – defaults to shades of the accent, then grays */
  color?: string;
};

export type BreakdownPeriod = { id: string; label: string };

type OwnProps = {
  /** Visual style. Defaults to the file's look: Standard in compact-breakdown.tsx, Clean in compact-breakdown-clean.tsx */
  look?: Look;
  title?: string;
  /** The parts of the shown period – the list ranks them by value */
  items: BreakdownItem[];
  /** Options of the period switch – no switch when left out */
  periods?: BreakdownPeriod[];
  /** Controlled period id */
  period?: string;
  defaultPeriod?: string;
  /** Called with the new period id – pass the matching `items` and `delta` back in */
  onPeriodChange?: (id: string) => void;
  /** Change against the previous period in percent, e.g. 12.4 or -3 – shown as a small pill */
  delta?: number;
  /** Formats every value, e.g. (n) => `$${Math.round(n).toLocaleString("en-US")}` */
  format?: (value: number) => string;
  /** Text under the big number while nothing is hovered */
  totalLabel?: string;
  /** Replaces the footer line – on the gray tray in Standard, the card's last row in Clean (default: the largest
   *  part); null hides it */
  footer?: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type CompactBreakdownProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

/* ---------- Helpers ---------- */

const INTEGER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const defaultFormat = (n: number) => INTEGER.format(n);
const PALETTE = ["var(--tc-compact-breakdown-series-1)", "var(--tc-compact-breakdown-series-2)", "var(--tc-compact-breakdown-series-3)", "var(--tc-compact-breakdown-series-4)", "var(--tc-compact-breakdown-series-5)"];
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const keyOf = (item: BreakdownItem) => item.id ?? item.label;

type Known = { key: string; label: string; color: string };

/** Every part ever shown, in first-seen order, with its latest label and color – the same array when nothing changed */
function mergeKnown(known: Known[], items: BreakdownItem[]): Known[] {
  let next = known;
  for (const item of items) {
    const key = keyOf(item);
    const i = next.findIndex((k) => k.key === key);
    if (i === -1) {
      next = [...next, { key, label: item.label, color: item.color ?? PALETTE[next.length] ?? "var(--tc-compact-breakdown-series-5)" }];
    } else if (next[i].label !== item.label || (item.color && next[i].color !== item.color)) {
      next = next.map((k, j) => (j === i ? { ...k, label: item.label, color: item.color ?? k.color } : k));
    }
  }
  return next;
}

type Values = Record<string, number>;

/** Writes a number into an element's own text node, so React keeps the node it rendered */
function setText(el: HTMLElement | null | undefined, text: string) {
  if (!el) return;
  const node = el.firstChild;
  if (node && node.nodeType === 3) {
    if (node.nodeValue !== text) node.nodeValue = text;
  } else el.textContent = text;
}

/**
 * Tweens a set of named numbers: every key rolls from where it is now to its target, new keys from zero.
 * One animation frame loop for the whole card, so numbers and bar widths move in step. Frames don't re-render:
 * each goes to `paint`, which writes the DOM. React gets the values (one commit) only when their `shape` changes
 * (a bar segment or a leaving row appears or goes) and once when the tween settles.
 */
function useTween(target: Values, first: number, then: number, paint: (v: Values) => void, shape: (v: Values) => string) {
  const [shown, setShown] = useState<Values>(() => Object.fromEntries(Object.keys(target).map((k) => [k, 0])));
  const current = useRef(shown);
  const committed = useRef(shown);
  const started = useRef(false);
  const latest = useRef({ paint, shape });
  // After every commit: take the newest paint/shape and repaint, so a render mid-tween never shows the snapshot
  useLayoutEffect(() => {
    latest.current = { paint, shape };
    paint(current.current);
  });
  const signature = JSON.stringify(target);
  useEffect(() => {
    const to = JSON.parse(signature) as Values;
    const from = { ...current.current };
    const commit = (v: Values) => {
      committed.current = v;
      setShown(v);
    };
    if (reducedMotion()) {
      current.current = to;
      commit(to);
      return;
    }
    const duration = started.current ? then : first;
    started.current = true;
    // The first frame's timestamp starts the clock – no clock read of our own
    let start = -1;
    let frame = 0;
    const step = (now: number) => {
      if (start < 0) start = now;
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutQuart(t);
      const next: Values = {};
      for (const k in to) next[k] = (from[k] ?? 0) + (to[k] - (from[k] ?? 0)) * e;
      current.current = next;
      latest.current.paint(next);
      if (t >= 1 || latest.current.shape(next) !== latest.current.shape(committed.current)) commit(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps -- the signature stands for target; first/then only matter when it changes
  return shown;
}

/** A ref callback that files the element under `key` in `map` */
const into = (map: Map<string, HTMLElement>, key: string) => (el: HTMLElement | null) => {
  if (el) map.set(key, el);
  else map.delete(key);
};

export function CompactBreakdown({
  look,
  title = "Breakdown",
  items,
  periods,
  period,
  defaultPeriod,
  onPeriodChange,
  delta,
  format = defaultFormat,
  totalLabel = "Total",
  footer,
  className,
  ref,
  ...rest
}: CompactBreakdownProps) {
  const uid = useId();
  const [activePeriod, setPeriod] = useControllable<string | undefined>(period, defaultPeriod ?? periods?.[0]?.id, (id) => id !== undefined && onPeriodChange?.(id));
  const [active, setActive] = useState<string | null>(null);

  // Every part ever shown keeps its place in the bar and its color, so the bar only glides – never reshuffles.
  // Kept in state and extended while rendering when new parts arrive (no ref writes during render)
  const [knownState, setKnown] = useState<Known[]>(() => mergeKnown([], items));
  const known = mergeKnown(knownState, items);
  if (known !== knownState) setKnown(known);

  const now = new Map(items.map((i) => [keyOf(i), Math.max(0, i.value)]));
  const total = [...now.values()].reduce((a, b) => a + b, 0);
  const activeValid = active !== null && now.has(active) ? active : null;

  // One tween for everything: each part, the total and the big figure (the total, or the hovered part)
  const target: Record<string, number> = { "#total": total, "#figure": activeValid ? (now.get(activeValid) ?? 0) : total };
  for (const k of known) target[k.key] = now.get(k.key) ?? 0;
  // The frames write straight into these elements; React renders them from the last committed values
  const figureEl = useRef<HTMLParagraphElement>(null);
  const captionEl = useRef<HTMLSpanElement>(null);
  const valueEls = useRef(new Map<string, HTMLElement>());
  const shareEls = useRef(new Map<string, HTMLElement>());
  const segEls = useRef(new Map<string, HTMLElement>());
  const percent = (v: Values, key: string) => ((v[key] ?? 0) / Math.max(v["#total"] ?? 0, 0.0001)) * 100;
  const paint = (v: Values) => {
    setText(figureEl.current, format(v["#figure"] ?? 0));
    valueEls.current.forEach((el, key) => setText(el, format(v[key] ?? 0)));
    shareEls.current.forEach((el, key) => setText(el, percent(v, key).toFixed(0)));
    segEls.current.forEach((el, key) => (el.style.flexGrow = String(percent(v, key))));
    if (activeRow) setText(captionEl.current, `${activeRow.label} · ${percent(v, activeRow.key).toFixed(0)}%`);
  };
  // What changes the markup: which segments are wide enough to draw, which leaving rows are still folding away
  const shape = (v: Values) => known.map((k) => `${percent(v, k.key) > 0.05 ? 1 : 0}${now.has(k.key) || (v[k.key] ?? 0) > 0.5 ? 1 : 0}`).join("");
  const shown = useTween(target, 900, 620, paint, shape);

  // Rows: ranked by the new values; parts that left the period fold away at the end
  const rows = known
    .map((k) => ({ ...k, value: now.get(k.key) ?? 0, leaving: !now.has(k.key) }))
    .filter((r) => !r.leaving || (shown[r.key] ?? 0) > 0.5)
    .sort((a, b) => Number(a.leaving) - Number(b.leaving) || b.value - a.value);
  const order = rows.map((r) => r.key).join("|");
  const top = rows.find((r) => !r.leaving);
  const activeRow = activeValid ? rows.find((r) => r.key === activeValid) : undefined;

  // Rows glide to their new rank (FLIP): remember where each one was, then animate from there
  const rowEls = useRef(new Map<string, HTMLLIElement>());
  const tops = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const next = new Map<string, number>();
    rowEls.current.forEach((el, key) => next.set(key, el.offsetTop));
    if (!reducedMotion()) {
      next.forEach((y, key) => {
        const before = tops.current.get(key);
        const el = rowEls.current.get(key);
        if (el && before !== undefined && before !== y) {
          el.animate([{ transform: `translateY(${before - y}px)` }, { transform: "none" }], { duration: 560, easing: EASE });
        }
      });
    }
    tops.current = next;
  }, [order]);

  // The period switch: a pill that slides under the chosen option (Clean: a light fill, short and crisp)
  const switchRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);
  useLayoutEffect(() => {
    const box = switchRef.current;
    const pill = pillRef.current;
    const option = box?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!box || !pill || !option) return;
    const place = () => {
      if (!placed.current) pill.style.transition = "none";
      pill.style.width = `${option.offsetWidth}px`;
      pill.style.height = `${option.offsetHeight}px`;
      pill.style.transform = `translate(${option.offsetLeft}px, ${option.offsetTop}px)`;
      pill.style.opacity = "1";
      if (!placed.current) {
        void pill.offsetWidth;
        pill.style.transition = "";
        placed.current = true;
      }
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(box);
    return () => ro.disconnect();
  }, [activePeriod, periods?.length]);

  const choose = (id: string) => setPeriod(id);
  const onSwitchKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!periods?.length) return;
    const i = periods.findIndex((p) => p.id === activePeriod);
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? periods.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const next = periods[(to + periods.length) % periods.length];
    choose(next.id);
    requestAnimationFrame(() => switchRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
  };

  const share = (key: string) => percent(shown, key);
  const up = (delta ?? 0) >= 0;

  return (
    <div role="group" aria-labelledby={`${uid}-title`} {...rest} ref={ref} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={look ?? DEFAULT_LOOK}>
      {/* React 19 hoists this into <head> once, no matter how many cards render */}
      <style href="ui-compact-breakdown" precedence="default">
        {css}
      </style>

      {/* Standard: a white card on the tray · Clean: the body of the one card */}
      <div className={(look ?? DEFAULT_LOOK) === "clean" ? "ui-cb__body" : "ui-cb__card"}>
        <header className="ui-cb__head">
          <h3 id={`${uid}-title`} className="ui-cb__title">
            {title}
          </h3>
          {periods && periods.length > 1 && (
            <div ref={switchRef} className="ui-cb__switch" role="radiogroup" aria-label="Period" onKeyDown={onSwitchKey}>
              <span ref={pillRef} className="ui-cb__pill" aria-hidden="true" />
              {periods.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={p.id === activePeriod}
                  tabIndex={p.id === activePeriod ? 0 : -1}
                  className="ui-cb__option"
                  onClick={() => choose(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* The big number: the total – or the hovered part, rolled to */}
        <div className="ui-cb__figure">
          <p ref={figureEl} className="ui-cb__big" aria-hidden="true">
            {format(shown["#figure"] ?? 0)}
          </p>
          {delta !== undefined && !activeRow && (
            <span key={`${activePeriod}-${delta}`} className="ui-cb__delta" data-up={up || undefined}>
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d={up ? "M6 9.5v-7M2.8 5.6 6 2.4l3.2 3.2" : "M6 2.5v7M2.8 6.4 6 9.6l3.2-3.2"} />
              </svg>
              {Math.abs(delta).toLocaleString("en-US", { maximumFractionDigits: 1 })}%
            </span>
          )}
        </div>
        <p className="ui-cb__caption" aria-hidden="true">
          <span key={activeRow?.key ?? "#total"} className="ui-cb__caption-in">
            {activeRow ? (
              <>
                <i className="ui-cb__swatch" style={{ background: activeRow.color }} />
                <span ref={captionEl}>{`${activeRow.label} · ${share(activeRow.key).toFixed(0)}%`}</span>
              </>
            ) : (
              totalLabel
            )}
          </span>
        </p>
        <p className="ui-cb__sr">
          {totalLabel}: {format(total)}
          {delta !== undefined ? `, ${up ? "up" : "down"} ${Math.abs(delta)}% against the previous period` : ""}
        </p>

        <div className="ui-cb__bar" data-active={activeValid ? "" : undefined} aria-hidden="true" onPointerLeave={() => setActive(null)}>
          {known.map((k) => {
            const w = share(k.key);
            return w > 0.05 ? (
              <span
                key={k.key}
                ref={into(segEls.current, k.key)}
                className="ui-cb__seg"
                data-active={k.key === activeValid || undefined}
                style={{ flexGrow: w, background: k.color }}
                onPointerEnter={() => now.has(k.key) && setActive(k.key)}
              />
            ) : null;
          })}
        </div>

        <ul className="ui-cb__list" data-active={activeValid ? "" : undefined} onPointerLeave={() => setActive(null)}>
          {rows.map((r) => (
            <li
              key={r.key}
              ref={(el) => {
                if (el) rowEls.current.set(r.key, el);
                else rowEls.current.delete(r.key);
              }}
              className="ui-cb__row"
              data-leaving={r.leaving || undefined}
              inert={r.leaving || undefined}
            >
              {/* Not a control: the row already shows the part's value and share, so it isn't a tab stop (hover only
                  previews it in the big number) */}
              <div className="ui-cb__item" data-active={r.key === activeValid || undefined} onPointerEnter={() => !r.leaving && setActive(r.key)}>
                <i className="ui-cb__swatch" style={{ background: r.color }} />
                <span className="ui-cb__label" title={r.label}>
                  {r.label}
                </span>
                <span ref={into(valueEls.current, r.key)} className="ui-cb__value">
                  {format(shown[r.key] ?? 0)}
                </span>
                <span ref={into(shareEls.current, r.key)} className="ui-cb__share">{share(r.key).toFixed(0)}%</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {footer !== null && (
        <div className="ui-cb__foot">
          {footer ??
            (top && (
              <span key={top.key} className="ui-cb__foot-in">
                Largest: <b>{top.label}</b>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

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

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-cb:where([data-look="standard"]),
.ui-cb__portal:where([data-look="standard"]) {
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-3xl: 24px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
  --_tc-line-height-display: 32px;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 22px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-full: 999px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-seg-pad: 2px;
  --_tc-seg-thumb-bg: light-dark(#ffffff, #34343a);
  --_tc-seg-thumb-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-seg-track-bg: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-seg-track-radius: 10px;
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
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
.ui-cb:where([data-look="clean"]),
.ui-cb__portal:where([data-look="clean"]) {
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-3xl: 24px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
  --_tc-line-height-display: 32px;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 20px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-full: 999px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-seg-pad: 2px;
  --_tc-seg-thumb-bg: light-dark(#ffffff, #34343a);
  --_tc-seg-thumb-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-seg-track-bg: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-seg-track-radius: 8px;
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
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

/* Colors and motion as variables – override them on .ui-cb */
:where([data-look="standard"], [data-look="standard"] *).ui-cb {
  /* Series colours, largest part first */
  --tc-compact-breakdown-series-1: light-dark(#2f6bff, #5b8cff);
  --tc-compact-breakdown-series-2: light-dark(#74a0ff, #3d63c9);
  --tc-compact-breakdown-series-3: light-dark(#b4cbff, #2c4388);
  --tc-compact-breakdown-series-4: light-dark(#a8a8ae, #6b6b73);
  --tc-compact-breakdown-series-5: light-dark(#d4d4d8, #3d3d42);
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 360px;
  /* The tray the card sits on */
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: 1.45;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-cb */
:where([data-look="clean"], [data-look="clean"] *).ui-cb {
  /* Parts: the accent blue, then lighter tints of it, then a gray */
  --tc-compact-breakdown-series-1: light-dark(rgba(0, 96, 226, 0.765), #4d8dff);
  --tc-compact-breakdown-series-2: light-dark(rgba(0, 96, 226, 0.5), rgba(77, 141, 255, 0.62));
  --tc-compact-breakdown-series-3: light-dark(rgba(0, 96, 226, 0.32), rgba(77, 141, 255, 0.4));
  --tc-compact-breakdown-series-4: light-dark(rgba(0, 96, 226, 0.18), rgba(77, 141, 255, 0.22));
  --tc-compact-breakdown-series-5: light-dark(rgba(0, 0, 0, 0.14), rgba(255, 255, 255, 0.16));
  /* One card: a hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 360px;
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
.ui-cb *, .ui-cb *::before, .ui-cb *::after { box-sizing: border-box; }
:where(.ui-cb) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where(.ui-cb) :is(h3, p, ul) { margin: 0; padding: 0; }
:where(.ui-cb) ul { list-style: none; }
.ui-cb button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where(.ui-cb[data-look="clean"]) svg { display: block; flex: none; }
.ui-cb b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-cb__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__card { border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-2, var(--_tc-space-2)); }
/* Head: title, the period switch on the right */
:where([data-look="standard"], [data-look="standard"] *).ui-cb__head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); min-height: 30px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__title { overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
/* The period switch: the segmented-control recipe – a track with a raised thumb that slides to the chosen option */
:where([data-look="standard"], [data-look="standard"] *).ui-cb__switch { position: relative; display: grid; grid-auto-columns: auto; grid-auto-flow: column; flex: none; padding: var(--tc-seg-pad, var(--_tc-seg-pad)); border-radius: var(--tc-seg-track-radius, var(--_tc-seg-track-radius)); background: var(--tc-seg-track-bg, var(--_tc-seg-track-bg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__pill {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: calc(var(--tc-seg-track-radius, var(--_tc-seg-track-radius)) - var(--tc-seg-pad, var(--_tc-seg-pad)));
  background: var(--tc-seg-thumb-bg, var(--_tc-seg-thumb-bg));
  box-shadow: var(--tc-seg-thumb-shadow, var(--_tc-seg-thumb-shadow));
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), width var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-cb__option { position: relative; z-index: 1; height: 24px; padding: 0 var(--tc-space-2, var(--_tc-space-2)); border-radius: calc(var(--tc-seg-track-radius, var(--_tc-seg-track-radius)) - var(--tc-seg-pad, var(--_tc-seg-pad))); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; transition: color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__option:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* The chosen period: primary text in the strong weight, on the raised thumb */
:where([data-look="standard"], [data-look="standard"] *).ui-cb__option[aria-checked="true"] { color: var(--tc-text-primary, var(--_tc-text-primary)); font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); }
/* The big number and the change against the period before */
.ui-cb__figure { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__figure { margin-top: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__big { font-size: 26px; font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-line-height-display, var(--_tc-line-height-display)); letter-spacing: -0.02em; color: var(--tc-text-primary, var(--_tc-text-primary)); font-variant-numeric: tabular-nums; }
/* A status pill (header size) */
.ui-cb__delta {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg));
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5)) 0 var(--tc-space-1, var(--_tc-space-1));
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg));
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
  font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg));
  font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-variant-numeric: tabular-nums;
  animation: ui-cb-pop var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cb__body { padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-2-5, var(--_tc-space-2-5)); }
/* Head: title, the period switch on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-cb__head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); min-height: 28px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__title { overflow: hidden; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; text-overflow: ellipsis; }
/* The "button switch": separate chips with a hairline; the light-gray fill slides to the chosen one */
:where([data-look="clean"], [data-look="clean"] *).ui-cb__switch { position: relative; display: grid; grid-auto-columns: auto; grid-auto-flow: column; gap: var(--tc-space-1, var(--_tc-space-1)); flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__pill {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), width var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cb__option {
  position: relative;
  z-index: 1;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2-5, var(--_tc-space-2-5));
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  white-space: nowrap;
  transition: color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* The chosen period: primary text, and its chip edge in the selected colour (≥ 3:1) so the choice isn't a fill alone */
:where([data-look="clean"], [data-look="clean"] *).ui-cb__option[aria-checked="true"] { color: var(--tc-text-primary, var(--_tc-text-primary)); box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); }
@media (hover: hover) {
:where([data-look="clean"], [data-look="clean"] *).ui-cb__option[aria-checked="false"]:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
}
/* The big number and the change against the period before */
:where([data-look="clean"], [data-look="clean"] *).ui-cb__figure { margin-top: var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__big { font-size: var(--tc-font-size-3xl, var(--_tc-font-size-3xl)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-display, var(--_tc-line-height-display)); letter-spacing: -0.02em; color: var(--tc-text-strong, var(--_tc-text-strong)); font-variant-numeric: tabular-nums; }
.ui-cb__delta[data-up] { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
.ui-cb__delta svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__delta svg { stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__delta svg { stroke-width: 1.3; }
/* The caption under the big number: a minimum height, so larger text grows it instead of being clipped */
.ui-cb__caption { overflow: hidden; color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__caption { min-height: 18px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
.ui-cb__caption-in { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__caption-in { animation: ui-cb-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
/* The stacked bar – parts keep their place and color, only the widths glide */
.ui-cb__bar { display: flex; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); padding: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__bar { height: 8px; margin-top: var(--tc-space-3, var(--_tc-space-3)); border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); }
/* Shares as flex-grow, so the 2px gaps come out of the bar instead of making it wider than the card */
.ui-cb__seg { flex: 0 1 0; height: 100%; min-width: 2px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__seg { transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__seg:first-child { border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)) var(--tc-radius-2xs, var(--_tc-radius-2xs)) var(--tc-radius-2xs, var(--_tc-radius-2xs)) var(--tc-radius-xs, var(--_tc-radius-xs)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__seg:last-child { border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)) var(--tc-radius-xs, var(--_tc-radius-xs)) var(--tc-radius-xs, var(--_tc-radius-xs)) var(--tc-radius-2xs, var(--_tc-radius-2xs)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__bar[data-active] .ui-cb__seg:not([data-active]) { opacity: 0.25; }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__caption { min-height: 16px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__caption-in { animation: ui-cb-in-clean var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
/* The stacked bar – parts keep their place and color, only the widths glide */
:where([data-look="clean"], [data-look="clean"] *).ui-cb__bar { height: 6px; margin-top: var(--tc-space-4, var(--_tc-space-4)); border-radius: var(--tc-radius-full, var(--_tc-radius-full)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__seg { transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__seg:first-child { border-radius: var(--tc-radius-full, var(--_tc-radius-full)) var(--tc-radius-2xs, var(--_tc-radius-2xs)) var(--tc-radius-2xs, var(--_tc-radius-2xs)) var(--tc-radius-full, var(--_tc-radius-full)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__seg:last-child { border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)) var(--tc-radius-full, var(--_tc-radius-full)) var(--tc-radius-full, var(--_tc-radius-full)) var(--tc-radius-2xs, var(--_tc-radius-2xs)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__bar[data-active] .ui-cb__seg:not([data-active]) { opacity: 0.3; }
.ui-cb__seg[data-active] { transform: scaleY(1.5); }
/* The ranked list */
.ui-cb__list { position: relative; display: grid; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__list { margin-top: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__list { margin-top: var(--tc-space-2-5, var(--_tc-space-2-5)); }
.ui-cb__row { display: grid; grid-template-rows: 1fr; transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-cb__row[data-leaving] { grid-template-rows: 0fr; opacity: 0; pointer-events: none; }
/* Rows get their height from padding around a 20px line, so larger text grows them instead of being clipped
   (min-height 0 lets a leaving row fold away) */
.ui-cb__item { display: flex; align-items: center; min-height: 0; margin: 0 -8px; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2, var(--_tc-space-2)); overflow: hidden; line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__item { gap: var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-md, var(--_tc-radius-md)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__item[data-active] { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__item {
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  /* The hover wash is short and crisp – no long glide between rows */
  transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cb__item[data-active] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
.ui-cb__list[data-active] .ui-cb__item:not([data-active]) { opacity: 0.45; }
.ui-cb__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); }
.ui-cb__label { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__label { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__label { color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-cb__value { color: var(--tc-text-primary, var(--_tc-text-primary)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); font-variant-numeric: tabular-nums; }
.ui-cb__share { width: 34px; text-align: right; color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
/* The line on the gray tray */
:where([data-look="standard"], [data-look="standard"] *).ui-cb__foot { display: flex; align-items: center; min-height: 34px; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2-5, var(--_tc-space-2-5)) 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
.ui-cb__foot-in { overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__foot-in { animation: ui-cb-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
@keyframes ui-cb-in {
  from { opacity: 0; transform: translateY(5px); filter: blur(2px); }
  to { opacity: 1; transform: none; filter: none; }
}
:where([data-look="clean"], [data-look="clean"] *).ui-cb__share { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
/* The last row inside the card */
:where([data-look="clean"], [data-look="clean"] *).ui-cb__foot {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 var(--tc-space-4, var(--_tc-space-4));
  overflow: hidden;
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cb__foot-in { animation: ui-cb-in-clean var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
@keyframes ui-cb-in-clean {
  from { opacity: 0; transform: translateY(4px); filter: blur(2px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-cb-pop {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: none; }
}
/* Narrow cards: the share column goes, the values stay */
@container (max-width: 250px) {
.ui-cb__share { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__option { padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5)); }
}
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-cb__option { height: 32px; padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__item { padding-block: var(--tc-space-2, var(--_tc-space-2)); }
}
/* Narrow cards: tighter chips, then the share column goes and the values stay */
@container (max-width: 320px) {
:where([data-look="clean"], [data-look="clean"] *).ui-cb__body { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__foot { padding: 0 var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__switch { gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__option { padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2, var(--_tc-space-2)); }
}
@container (max-width: 250px) {
:where([data-look="clean"], [data-look="clean"] *).ui-cb__option { padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1-5, var(--_tc-space-1-5)); }
}
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-cb__option { height: 32px; padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__item { padding-block: var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__foot { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-cb *, .ui-cb *::before, .ui-cb *::after { animation: none !important; transition: none !important; }
}
`;

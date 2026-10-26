"use client";

import {
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
import { useControllable } from "../internal/use-controllable";
import { easeOutQuart } from "../internal/ease";
import { reducedMotion } from "../internal/reduced-motion";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Experiment Card – an A/B test in two lines that quietly unfolds into the full comparison, in one self-contained file.
 * Closed, it shows the test, its status and who is ahead, next to a tiny column chart with one column per variant.
 * Hovering (or tapping) unfolds the variants below – the head stays where it is. Inside the open card:
 *   · hover a variant and its column lights up in the head (and the other way round)
 *   · switch the metric and every number rolls, the bars and columns glide, the leader chip follows
 *   · click a variant to pick it as the winner – the action on the tray appears with its name
 *   · the line on the gray tray always says what you are pointing at: visitors and confidence
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: experiment-card.tsx is Standard,
 * experiment-card-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows, quiet gray type,
 * tinted chips, thinner icons, a status dot in a soft ring, and the caption and action as the card's last row
 * instead of on the gray tray.
 */
export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-xc";

export type ExperimentTone = "red" | "amber" | "green" | "blue" | "violet" | "gray";

export type ExperimentMetric = {
  id: string;
  label: string;
  /** Formats a value of this metric, e.g. (n) => `${n.toFixed(1)}%` */
  format?: (value: number) => string;
  /** Set when a smaller number wins, e.g. bounce rate or cost */
  lowerIsBetter?: boolean;
};

export type ExperimentVariant = {
  id: string;
  /** Short key shown in the badge and the chart, e.g. "A" */
  key: string;
  name: string;
  /** The baseline every lift is measured against – defaults to the first variant */
  control?: boolean;
  visitors?: number;
  /** One number per metric id */
  values: Record<string, number>;
  /** Confidence against the control in percent, per metric id */
  confidence?: Record<string, number>;
  /** Any CSS color – defaults to gray for the control, then blue, violet, amber */
  color?: string;
};

type OwnProps = {
  /** Visual style. Defaults to the file's look: Standard in experiment-card.tsx, Clean in experiment-card-clean.tsx */
  look?: Look;
  title: string;
  variants: ExperimentVariant[];
  metrics: ExperimentMetric[];
  /** Controlled metric id */
  metric?: string;
  defaultMetric?: string;
  onMetricChange?: (id: string) => void;
  /** Controlled id of the variant picked as the winner */
  winner?: string | null;
  defaultWinner?: string | null;
  onWinnerChange?: (id: string | null) => void;
  /** The tag under the title, e.g. { label: "Running", tone: "green" } */
  status?: { label: string; tone?: ExperimentTone };
  /** Short text next to the status, e.g. "Day 9 of 14" */
  note?: string;
  /**
   * The button that appears on the tray (Clean: in the last row) once a winner is picked. `label` gets the picked
   * variant. `onClick` may return a promise: the button waits while it runs, and a rejection says so on the tray and
   * lets you try again
   */
  action?: { label: string | ((variant: ExperimentVariant) => string); onClick: (variant: ExperimentVariant) => void | Promise<unknown> };
  /** Replaces the line on the tray (Clean: in the last row) while nothing is hovered or picked */
  hint?: ReactNode;
  /** "hover" opens under the pointer (taps and the keyboard still toggle), "click" only on click */
  trigger?: "hover" | "click";
  /** Controlled open state */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type ExperimentCardProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

/* ---------- Helpers ---------- */

const PALETTE = ["var(--tc-experiment-card-series-1)", "var(--tc-experiment-card-series-2)", "var(--tc-experiment-card-series-3)", "var(--tc-experiment-card-series-4)"];
// Built once – a formatter is costly to make and these run on every render
const ONE_DECIMAL = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const WHOLE = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const defaultFormat = (n: number) => ONE_DECIMAL.format(n);
const whole = (n: number) => WHOLE.format(n);

/* ---------- Icons ---------- */

// Standard: 1.4–1.7px lines and a ringed status mark · Clean: a size up, thinner lines, a solid dot in a soft ring
const lineWidth = (look: Look) => (look === "clean" ? 1.1 : 1.5);
const lineProps = (look: Look) => ({ stroke: "currentColor", strokeWidth: lineWidth(look), strokeLinecap: "round", strokeLinejoin: "round" }) as const;
type IconProps = { look: Look };

const CheckIcon = ({ look }: IconProps) =>
  look === "clean" ? (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="m3 6.2 2 2 4-4.4" {...lineProps(look)} strokeWidth={1.5} />
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="m2.2 5.2 1.9 1.9 3.7-4.1" {...lineProps(look)} strokeWidth={1.7} />
    </svg>
  );
const ArrowIcon = ({ look }: IconProps) =>
  look === "clean" ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" {...lineProps(look)} strokeWidth={1.2} />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6h7M6.5 3l3 3-3 3" {...lineProps(look)} strokeWidth={1.4} />
    </svg>
  );
const TrendIcon = ({ look, down }: IconProps & { down?: boolean }) =>
  look === "clean" ? (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={down ? { transform: "scaleY(-1)" } : undefined}>
      <path d="M1.5 8.5 4.5 5.5l2 2 4-4M8 3.5h2.5V6" {...lineProps(look)} strokeWidth={1.2} />
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={down ? { transform: "scaleY(-1)" } : undefined}>
      <path d="M1.5 7 4 4.5l1.6 1.6L8.5 3M6.2 3h2.3v2.3" {...lineProps(look)} strokeWidth={1.4} />
    </svg>
  );
/** Status – Standard: a ring with a dot · Clean: a solid dot in a soft ring */
const PulseIcon = ({ look }: IconProps) =>
  look === "clean" ? (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <circle cx="5" cy="5" r="4.5" fill="currentColor" opacity="0.22" />
      <circle cx="5" cy="5" r="2.25" fill="currentColor" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.25" {...lineProps(look)} />
      <circle cx="6" cy="6" r="1.5" fill="currentColor" />
    </svg>
  );

/* ---------- Hooks ---------- */

/**
 * Numbers that roll to their new values – written straight into their elements, one animation frame at a time, so
 * a metric switch doesn't re-render the card every frame (the DOM-writing variant of useRolling). Render always shows
 * the final value; before the first paint the effect puts each number back where it was and rolls it from there.
 */
function useRollingText(target: Record<string, number>, duration: number, format: (n: number) => string) {
  const els = useRef(new Map<string, HTMLElement>());
  const current = useRef(target);
  const fmt = useRef(format);
  const signature = JSON.stringify(target);
  useLayoutEffect(() => {
    fmt.current = format;
  });
  useLayoutEffect(() => {
    const to = JSON.parse(signature) as Record<string, number>;
    const from = { ...current.current };
    const write = (values: Record<string, number>) => {
      for (const [k, el] of els.current) if (values[k] !== undefined) el.textContent = fmt.current(values[k]);
    };
    if (reducedMotion() || Object.keys(to).every((k) => (from[k] ?? to[k]) === to[k])) {
      current.current = to;
      return;
    }
    const at = (e: number) => {
      const next: Record<string, number> = {};
      for (const k in to) next[k] = (from[k] ?? to[k]) + (to[k] - (from[k] ?? to[k])) * e;
      current.current = next;
      write(next);
    };
    at(0);
    let start = -1;
    let frame = 0;
    const step = (now: number) => {
      if (start < 0) start = now;
      const t = Math.min(1, (now - start) / duration);
      at(easeOutQuart(t));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      // Interrupted (a new target, or unmount): whatever is shown is where the next roll starts; the text is final
      write(to);
    };
  }, [signature, duration]);
  return (key: string) => (el: HTMLElement | null) => {
    if (el) els.current.set(key, el);
    else els.current.delete(key);
  };
}

/** Opening and closing: under the pointer with a short delay (trigger "hover"), on click, and closed by a press outside */
function useHoverOpen(isOpen: boolean, setOpen: (open: boolean) => void, hover: boolean, rootRef: { current: HTMLElement | null }, setHot: (id: string | null) => void) {
  const timer = useRef(0);
  const change = (next: boolean) => {
    window.clearTimeout(timer.current);
    if (!next) setHot(null);
    setOpen(next);
  };
  const later = (next: boolean, ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => change(next), ms);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // While open, a press outside closes it
  useEffect(() => {
    if (!isOpen) return;
    const down = (e: globalThis.PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      window.clearTimeout(timer.current);
      setHot(null);
      setOpen(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [isOpen, setOpen, rootRef, setHot]);
  return {
    change,
    enter: (e: PointerEvent<HTMLDivElement>) => hover && e.pointerType === "mouse" && later(true, 90),
    // Focus inside the open card keeps it open: closing would make the focused row inert (2.4.3)
    leave: (e: PointerEvent<HTMLDivElement>) =>
      hover && e.pointerType === "mouse" && !rootRef.current?.querySelector(".ui-xc__fold")?.contains(document.activeElement) && later(false, 220),
  };
}

/* ---------- Pieces ---------- */

function MetricSwitch({ metrics, current, isOpen, onPick }: { metrics: ExperimentMetric[]; current?: string; isOpen: boolean; onPick: (id: string) => void }) {
  const switchRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  // Measured when the metric changes or the card opens – not on every render
  useLayoutEffect(() => {
    const el = switchRef.current?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [current, metrics.length, isOpen]);
  const onKey = (e: KeyboardEvent) => {
    const i = metrics.findIndex((m) => m.id === current);
    const next = e.key === "ArrowRight" || e.key === "ArrowDown";
    const prev = e.key === "ArrowLeft" || e.key === "ArrowUp";
    const to = next ? i + 1 : prev ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? metrics.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    onPick(metrics[(to + metrics.length) % metrics.length].id);
    requestAnimationFrame(() => switchRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
  };
  return (
    <div ref={switchRef} className="ui-xc__switch" role="radiogroup" aria-label="Metric" onKeyDown={onKey}>
      {pill && <span className="ui-xc__thumb" style={{ transform: `translateX(${pill.left}px)`, width: pill.width }} />}
      {metrics.map((m) => (
        <button key={m.id} type="button" role="radio" aria-checked={m.id === current} tabIndex={m.id === current ? 0 : -1} className="ui-xc__metric" onClick={() => onPick(m.id)}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

const signed = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}%`;

type RowProps = {
  v: ExperimentVariant;
  look: Look;
  isControl: boolean;
  checked: boolean;
  hot: string | null;
  value: number;
  change: number;
  lift: number;
  max: number;
  color: string;
  format: (n: number) => string;
  valueRef: (el: HTMLElement | null) => void;
  setHot: (id: string | null) => void;
  onPick: (id: string) => void;
};

function VariantRow({ v, look, isControl, checked, hot, value, change, lift, max, color, format, valueRef, setHot, onPick, extra }: RowProps & { extra: string }) {
  const better = lift > 0.05 ? "better" : lift < -0.05 ? "worse" : "about the same";
  return (
    // A toggle: pressing it picks this variant as the winner, pressing it again clears the pick – so a toggle button,
    // not a radio (a radio can't be unchecked)
    <button
      type="button"
      aria-pressed={checked}
      // Starts with the row's visible text (key, name, value, lift), so speech input can say what it sees (2.5.3)
      aria-label={`${v.key} ${v.name} ${format(value)} ${isControl ? "Base" : signed(change)}${isControl ? ", baseline" : `, ${change >= 0 ? "up" : "down"} ${Math.abs(change).toFixed(1)} percent, ${better}`}${extra}`}
      className="ui-xc__row"
      data-hot={hot === v.id ? "" : undefined}
      data-dim={hot && hot !== v.id ? "" : undefined}
      style={{ ["--tc-experiment-card-color" as string]: color }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHot(v.id)}
      onFocus={() => setHot(v.id)}
      onBlur={() => setHot(null)}
      onClick={() => onPick(v.id)}
    >
      <span className="ui-xc__badge">
        <span>{v.key}</span>
        <CheckIcon look={look} />
      </span>{" "}
      <span className="ui-xc__label">{v.name}</span>{" "}
      <span className="ui-xc__value" ref={valueRef}>
        {format(value)}
      </span>{" "}
      {isControl ? (
        <span className="ui-xc__lift" data-tone="gray">
          Base
        </span>
      ) : (
        // Better or worse is an arrow too, not only green or red (1.4.1) – it points the way of "better", so it also
        // reads right for lower-is-better metrics, where the sign alone would mislead
        <span className="ui-xc__lift" data-tone={lift > 0.05 ? "green" : lift < -0.05 ? "red" : "gray"}>
          {Math.abs(lift) > 0.05 && <TrendIcon look={look} down={lift < 0} />}
          {signed(change)}
        </span>
      )}
      <span className="ui-xc__track">
        <span className="ui-xc__bar" style={{ transform: `scaleX(${Math.max(0.02, value / max)})` }} />
      </span>
    </button>
  );
}

/** The line on the tray: what you are pointing at, the pick, or the hint */
function captionFor(about: ExperimentVariant | null, control: ExperimentVariant | undefined, metricId: string | undefined, picked: ExperimentVariant | null, failed: boolean, hint: ReactNode) {
  if (about) {
    const conf = about.confidence?.[metricId ?? ""];
    return {
      key: `hot-${about.id}-${metricId}`,
      caption: (
        <>
          <b>{about.key}</b>
          {about.visitors !== undefined && <> · {whole(about.visitors)} visitors</>}
          {about === control ? <> · baseline</> : conf !== undefined && <> · {whole(conf)}% confidence</>}
        </>
      ),
    };
  }
  if (picked && failed) return { key: `error-${picked.id}`, caption: <>Couldn’t finish – try again</> };
  if (picked)
    return {
      key: `picked-${picked.id}`,
      caption: (
        <>
          <b>{picked.name}</b> picked
        </>
      ),
    };
  return { key: "rest", caption: hint ?? "Pick a winner" };
}

function Tray({ isOpen, captionKey, caption, picked, action, pending, failed, look, onRun }: { isOpen: boolean; captionKey: string; caption: ReactNode; picked: ExperimentVariant | null; action?: OwnProps["action"]; pending: boolean; failed: boolean; look: Look; onRun: (v: ExperimentVariant) => void }) {
  const label = picked && action ? (typeof action.label === "function" ? action.label(picked) : action.label) : null;
  return (
    <div className="ui-xc__fold" inert={!isOpen}>
      <div className="ui-xc__clip">
        <div className="ui-xc__foot">
          {/* Follows the pointer and focus, so it isn't a live region (S7); the result is announced below */}
          <span className="ui-xc__caption">
            <span key={captionKey}>{caption}</span>
          </span>
          {picked && action && (
            // aria-disabled, not disabled: it keeps focus while the action runs
            <button type="button" className="ui-xc__action" key={picked.id} aria-disabled={pending || undefined} aria-busy={pending || undefined} onClick={() => onRun(picked)}>
              {label}
              <ArrowIcon look={look} />
            </button>
          )}
        </div>
      </div>
      {/* Mounted from the start: the pick and a failed action, nothing else */}
      <span className="ui-xc__sr" role="status">
        {picked && failed ? `Couldn’t finish ${picked.name} – try again` : picked ? `${picked.name} picked` : ""}
      </span>
    </div>
  );
}

export function ExperimentCard({
  look,
  title,
  variants,
  metrics,
  metric,
  defaultMetric,
  onMetricChange,
  winner,
  defaultWinner = null,
  onWinnerChange,
  status,
  note,
  action,
  hint,
  trigger = "hover",
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  ref,
  onPointerEnter,
  onPointerLeave,
  onKeyDown: onKeyDownProp,
  ...rest
}: ExperimentCardProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const uid = useId();
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const [metricId, setMetricId] = useControllable<string | undefined>(metric, defaultMetric ?? metrics[0]?.id, (id) => id !== undefined && onMetricChange?.(id));
  const metricNow = metrics.find((m) => m.id === metricId) ?? metrics[0];
  const [winnerId, setWinner] = useControllable<string | null>(winner, defaultWinner, onWinnerChange);
  /** The variant under the pointer (row or column) */
  const [hot, setHot] = useState<string | null>(null);
  /** The action while its promise runs, and whether the last run failed */
  const [actionState, setActionState] = useState<"idle" | "pending" | "error">("idle");

  const rootRef = useRef<HTMLDivElement | null>(null);
  // The root goes to our own ref and to the consumer's
  const setRoot = useRootRef(rootRef, ref);
  // Whatever focused thing goes away or goes inert hands focus to the head's toggle
  useFocusRescue(rootRef, { fallback: () => rootRef.current?.querySelector(".ui-xc__toggle") });
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const format = metricNow?.format ?? defaultFormat;
  const lower = Boolean(metricNow?.lowerIsBetter);
  const valueOf = (v: ExperimentVariant) => v.values[metricNow?.id ?? ""] ?? 0;
  const control = variants.find((v) => v.control) ?? variants[0];
  const base = control ? valueOf(control) : 0;
  /** Change against the control in percent, as measured */
  const changeOf = (v: ExperimentVariant) => (base ? ((valueOf(v) - base) / Math.abs(base)) * 100 : 0);
  /** The same change counted as "how much better": flipped for metrics where less is better */
  const liftOf = (v: ExperimentVariant) => changeOf(v) * (lower ? -1 : 1);
  const leader = variants.reduce<ExperimentVariant | undefined>((best, v) => (!best || liftOf(v) > liftOf(best) ? v : best), undefined);
  const max = Math.max(...variants.map(valueOf), 0.0001);
  const min = Math.min(...variants.map(valueOf));
  /** Column height in the head chart: stretched between the smallest and the largest value, so small gaps stay visible */
  const columnOf = (v: ExperimentVariant) => (max > min ? 0.38 + 0.62 * ((valueOf(v) - min) / (max - min)) : 0.7);
  const colorOf = (v: ExperimentVariant) => v.color ?? (v === control ? "var(--tc-experiment-card-series-control)" : PALETTE[variants.filter((x) => x !== control).indexOf(v) % PALETTE.length]);

  // Numbers roll when the metric changes
  const rolling = useRollingText(Object.fromEntries(variants.map((v) => [v.id, valueOf(v)])), 620, format);
  const opening = useHoverOpen(isOpen, setOpen, trigger === "hover", rootRef, setHot);

  const onEnter = (e: PointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(e);
    opening.enter(e);
  };
  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e);
    opening.leave(e);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDownProp?.(e);
    if (e.key !== "Escape" || !isOpen) return;
    e.stopPropagation();
    const root = rootRef.current;
    // Focus leaves the folding body for the toggle before the body goes inert
    if (!rescueFocus(root, [() => root?.querySelector(".ui-xc__toggle")])) root?.querySelector<HTMLElement>(".ui-xc__toggle")?.focus({ preventScroll: true });
    opening.change(false);
  };

  const pick = (id: string) => {
    setWinner(winnerId === id ? null : id);
    if (actionState === "error") setActionState("idle");
  };

  const runAction = async (variant: ExperimentVariant) => {
    if (!action || actionState === "pending") return;
    const result = action.onClick(variant);
    if (!result || typeof (result as Promise<unknown>).then !== "function") return;
    setActionState("pending");
    try {
      await result;
      if (mounted.current) setActionState("idle");
    } catch {
      if (mounted.current) setActionState("error");
    }
  };

  /* ---------- What the head and the tray say ---------- */

  const ahead = leader && leader !== control && liftOf(leader) > 0 ? leader : null;
  const picked = variants.find((v) => v.id === winnerId) ?? null;
  const about = variants.find((v) => v.id === hot) ?? null;
  const { key: captionKey, caption } = captionFor(about, control, metricNow?.id, picked, actionState === "error", hint);

  // Standard: the gray tray under the card · Clean: the last row inside the card. Either way it says what you are
  // pointing at, and holds the action once a winner is picked
  const tray = <Tray isOpen={isOpen} captionKey={captionKey} caption={caption} picked={picked} action={action} pending={actionState === "pending"} failed={actionState === "error"} look={resolvedLook} onRun={runAction} />;
  /** What the caption shows on hover, in the row's name too – so it isn't hover-only */
  const extraOf = (v: ExperimentVariant) => {
    const conf = v.confidence?.[metricNow?.id ?? ""];
    return `${v.visitors !== undefined ? `, ${whole(v.visitors)} visitors` : ""}${v !== control && conf !== undefined ? `, ${whole(conf)}% confidence` : ""}`;
  };

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-open={isOpen ? "" : undefined}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onKeyDown={onKeyDown}
    >
      <style href="ui-experiment-card" precedence="default">
        {css}
      </style>

      <div className="ui-xc__card">
        <div className="ui-xc__head">
          {/* The whole head toggles; the chart on top of it only reacts once the card is open */}
          <button
            type="button"
            className="ui-xc__toggle"
            aria-expanded={isOpen}
            aria-controls={`${uid}-body`}
            aria-label={`${title}${status ? `, ${status.label}` : ""}${ahead ? `, ${ahead.name} is ahead by ${Math.abs(changeOf(ahead)).toFixed(1)} percent` : ""}`}
            onClick={() => opening.change(!isOpen)}
          />

          {/* One column per variant – the same numbers as the rows below, small */}
          <span className="ui-xc__chart" aria-hidden="true" onPointerLeave={() => setHot(null)}>
            {variants.map((v) => (
              <span
                key={v.id}
                className="ui-xc__col"
                data-hot={hot === v.id ? "" : undefined}
                data-dim={hot && hot !== v.id ? "" : undefined}
                data-picked={winnerId === v.id ? "" : undefined}
                data-passed={winnerId && winnerId !== v.id ? "" : undefined}
                style={{ ["--tc-experiment-card-color" as string]: colorOf(v), ["--tc-experiment-card-size" as string]: columnOf(v) }}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHot(v.id)}
                onClick={() => pick(v.id)}
              />
            ))}
          </span>

          <span className="ui-xc__titles">
            <span className="ui-xc__name">{title}</span>
            <span className="ui-xc__sub">
              {status && (
                <span className="ui-xc__tag" data-tone={status.tone ?? "gray"}>
                  <PulseIcon look={resolvedLook} />
                  {status.label}
                </span>
              )}
              {note && <span className="ui-xc__note">{note}</span>}
            </span>
          </span>

          {ahead ? (
            <span className="ui-xc__lead" data-tone="green" key={`${ahead.id}-${metricNow?.id}`}>
              <b>{ahead.key}</b>
              <TrendIcon look={resolvedLook} down={changeOf(ahead) < 0} />
              {signed(changeOf(ahead))}
            </span>
          ) : (
            <span className="ui-xc__lead" data-tone="gray" key={`none-${metricNow?.id}`}>
              No lift yet
            </span>
          )}
        </div>

        <div id={`${uid}-body`} className="ui-xc__fold" inert={!isOpen}>
          <div className="ui-xc__clip">
            <div className="ui-xc__body">
              {metrics.length > 1 && <MetricSwitch metrics={metrics} current={metricNow?.id} isOpen={isOpen} onPick={setMetricId} />}

              <div className="ui-xc__rows" role="group" aria-label="Winner" onPointerLeave={() => setHot(null)}>
                {variants.map((v) => (
                  <VariantRow
                    key={v.id}
                    v={v}
                    look={resolvedLook}
                    isControl={v === control}
                    checked={winnerId === v.id}
                    hot={hot}
                    value={valueOf(v)}
                    change={changeOf(v)}
                    lift={liftOf(v)}
                    max={max}
                    color={colorOf(v)}
                    format={format}
                    valueRef={rolling(v.id)}
                    setHot={setHot}
                    onPick={pick}
                    extra={extraOf(v)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Clean: the last row of the card */}
        {resolvedLook === "clean" && tray}
      </div>

      {/* Standard: the tray under the card */}
      {resolvedLook !== "clean" && tray}
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *).ui-xc {
  /* Series: the control variant, then the others in order */
  --tc-experiment-card-series-control: light-dark(#b4b4ba, #6e6e76);
  --tc-experiment-card-series-1: light-dark(#2f6bff, #5b8cff);
  --tc-experiment-card-series-2: light-dark(#7c5cff, #9b83ff);
  --tc-experiment-card-series-3: #f0a020;
  --tc-experiment-card-series-4: #22a05a;
  box-sizing: border-box;
  width: 100%;
  max-width: 340px;
  /* The tray recipe */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  container-type: inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-xc */
:where([data-look="clean"], [data-look="clean"] *).ui-xc {
  /* Series: the control variant, then the others in order */
  --tc-experiment-card-series-control: light-dark(rgba(0, 0, 0, 0.22), rgba(255, 255, 255, 0.3));
  --tc-experiment-card-series-1: light-dark(rgba(0, 96, 226, 0.765), #4d8dff);
  --tc-experiment-card-series-2: light-dark(#5b5bd6, #8585f0);
  --tc-experiment-card-series-3: #e8a20c;
  --tc-experiment-card-series-4: #1a9a52;
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 340px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-xc *, .ui-xc *::before, .ui-xc *::after { box-sizing: border-box; }
:where(.ui-xc) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-xc button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-xc svg { display: block; flex: none; }
.ui-xc b { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
/* Tags and lifts: the status / tone colours – every fg ≥ 4.5:1 on its tint */
.ui-xc [data-tone="red"] { --tc-experiment-card-tag-fg: var(--tc-status-danger-fg); --tc-experiment-card-tag-bg: var(--tc-status-danger-bg); }
.ui-xc [data-tone="amber"] { --tc-experiment-card-tag-fg: var(--tc-status-warning-fg); --tc-experiment-card-tag-bg: var(--tc-status-warning-bg); }
.ui-xc [data-tone="green"] { --tc-experiment-card-tag-fg: var(--tc-status-success-fg); --tc-experiment-card-tag-bg: var(--tc-status-success-bg); }
.ui-xc [data-tone="blue"] { --tc-experiment-card-tag-fg: var(--tc-status-info-fg); --tc-experiment-card-tag-bg: var(--tc-status-info-bg); }
.ui-xc [data-tone="violet"] { --tc-experiment-card-tag-fg: var(--tc-tone-violet-fg); --tc-experiment-card-tag-bg: var(--tc-tone-violet-bg); }
.ui-xc [data-tone="gray"] { --tc-experiment-card-tag-fg: var(--tc-text-secondary); --tc-experiment-card-tag-bg: var(--tc-fill-default); }
.ui-xc__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
/* Everything that opens does it the same quiet way: it unfolds and fades, nothing travels */
.ui-xc__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where(.ui-xc[data-look="clean"]) svg { display: block; flex: none; }
/* One white card – the edge is a shadow, not a border (the card rule above) */
/* Everything that opens does it the same quiet way: it unfolds and fades, nothing travels */
.ui-xc__clip { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc[data-open] > .ui-xc__fold,
:where([data-look="standard"], [data-look="standard"] *).ui-xc[data-open] > .ui-xc__card > .ui-xc__fold { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slower) var(--tc-ease-standard) var(--tc-duration-quick); }
/* ----- Head: the same in both states ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-xc__head { position: relative; display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
.ui-xc__toggle { position: absolute; inset: 0; border-radius: var(--tc-card-radius); }
:where([data-look="clean"], [data-look="clean"] *).ui-xc[data-open] > .ui-xc__card > .ui-xc__fold { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slower) var(--tc-ease-standard) var(--tc-duration-quick); }
/* ----- Head: the same in both states ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-xc__head { position: relative; display: flex; align-items: center; gap: 10px; padding: 12px; }
.ui-xc__head > :not(.ui-xc__toggle) { position: relative; pointer-events: none; }
.ui-xc[data-open] .ui-xc__chart { pointer-events: auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__chart { display: flex; flex: none; align-items: flex-end; justify-content: center; gap: 3px; width: 34px; height: 34px; padding: 6px 5px 5px; border-radius: var(--tc-radius-lg); background: var(--tc-surface-sunken); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__col { flex: 1; max-width: 7px; height: calc(var(--tc-experiment-card-size) * 100%); border-radius: var(--tc-radius-2xs); background: var(--tc-experiment-card-color); cursor: pointer; transition: height var(--tc-duration-slowest) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move); transform-origin: 50% 100%; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__chart { display: flex; flex: none; align-items: flex-end; justify-content: center; gap: 3px; width: 36px; height: 36px; padding: 7px 6px 6px; border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__col { flex: 1; max-width: 6px; height: calc(var(--tc-experiment-card-size) * 100%); border-radius: var(--tc-radius-2xs); background: var(--tc-experiment-card-color); cursor: pointer; transition: height var(--tc-duration-slowest) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move); transform-origin: 50% 100%; }
.ui-xc__col[data-hot] { transform: scaleX(1.25); }
.ui-xc__col[data-dim] { opacity: 0.3; }
.ui-xc__col[data-passed]:not([data-hot]) { opacity: 0.35; }
.ui-xc__titles { display: grid; grid-template-columns: minmax(0, 1fr); flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__name { overflow: hidden; font-size: var(--tc-font-size-md-plus); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__sub { display: flex; align-items: center; gap: 6px; min-width: 0; min-height: 20px; margin-top: 1px; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); white-space: nowrap; }
/* Status tag, lift and leader chips: the pill pattern */
.ui-xc__tag { display: inline-flex; flex: none; align-items: center; gap: 4px; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px) 0 calc(var(--tc-pill-px) - 2px); border-radius: var(--tc-pill-radius); background: var(--tc-experiment-card-tag-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-experiment-card-tag-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__name { overflow: hidden; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__sub { display: flex; align-items: center; gap: 6px; min-width: 0; min-height: 20px; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
.ui-xc__note { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-xc__lead { display: inline-flex; flex: none; align-items: center; gap: 4px; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-experiment-card-tag-bg); font-size: var(--tc-pill-font-size-lg); line-height: var(--tc-line-height-tight); font-weight: var(--tc-pill-font-weight); color: var(--tc-experiment-card-tag-fg); white-space: nowrap; font-variant-numeric: tabular-nums; animation: ui-xc-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-xc__lead b { color: inherit; }
/* ----- Body ----- */
.ui-xc__body { padding: 0 12px 10px; }
/* Metric switch: the segmented pattern */
:where([data-look="standard"], [data-look="standard"] *).ui-xc__switch { position: relative; display: grid; grid-auto-columns: 1fr; grid-auto-flow: column; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__thumb { position: absolute; top: var(--tc-seg-pad); left: 0; height: calc(100% - var(--tc-seg-pad) * 2); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); transition: transform var(--tc-duration-slower) var(--tc-ease-move), width var(--tc-duration-slower) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__metric { position: relative; height: 26px; padding: 0 8px; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); text-align: center; white-space: nowrap; transition: color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__metric:hover { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__metric[aria-checked="true"] { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); }
/* Metric switch: the tab-button look – the active one: fill-selected plus a border-selected ring (≥ 3:1) */
:where([data-look="clean"], [data-look="clean"] *).ui-xc__switch { position: relative; display: flex; gap: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__thumb { position: absolute; top: 0; left: 0; height: 100%; border-radius: var(--tc-radius-sm); background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); transition: transform var(--tc-duration-instant) var(--tc-ease-decelerate), width var(--tc-duration-instant) var(--tc-ease-decelerate); }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__metric { position: relative; height: 28px; padding: 4px 10px; border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); text-align: center; white-space: nowrap; transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__metric:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__metric[aria-checked="true"] { background: none; box-shadow: none; color: var(--tc-text-primary); }
.ui-xc__rows { display: grid; gap: 2px; margin-top: 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; column-gap: 9px; row-gap: 6px; width: calc(100% + 12px); margin: 0 -6px; padding: 7px 6px 8px; border-radius: var(--tc-radius-lg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__row[data-hot] { background: var(--tc-surface-sunken); }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__row[data-dim] { opacity: 0.5; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__row[aria-pressed="true"] { background: var(--tc-surface-sunken); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__badge { display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-sm); background: color-mix(in srgb, var(--tc-experiment-card-color) 16%, transparent); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); color: color-mix(in srgb, var(--tc-experiment-card-color) 72%, var(--tc-text-primary)); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-xc__badge > * { grid-area: 1 / 1; transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; column-gap: 8px; row-gap: 6px; width: calc(100% + 12px); margin: 0 -6px; padding: 7px 6px 8px; border-radius: var(--tc-radius-sm); transition: background-color var(--tc-duration-quick) var(--tc-ease-decelerate), opacity var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__row[data-hot] { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__row[data-dim] { opacity: 0.55; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__row[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__badge { display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-badge); background: color-mix(in srgb, var(--tc-experiment-card-color) 14%, transparent); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); color: color-mix(in srgb, var(--tc-experiment-card-color) 80%, var(--tc-text-strong)); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-xc__badge svg { opacity: 0; transform: scale(0.5); }
.ui-xc__row[aria-pressed="true"] .ui-xc__badge { background: var(--tc-experiment-card-color); color: var(--tc-text-on-inverse); }
.ui-xc__row[aria-pressed="true"] .ui-xc__badge span { opacity: 0; transform: scale(0.5); }
.ui-xc__row[aria-pressed="true"] .ui-xc__badge svg { opacity: 1; transform: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__label { overflow: hidden; color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__value { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-xc__lift { display: inline-flex; align-items: center; justify-content: center; gap: 2px; min-width: 50px; height: var(--tc-pill-h); padding: 0 6px; border-radius: var(--tc-pill-radius); background: var(--tc-experiment-card-tag-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-experiment-card-tag-fg); text-align: center; white-space: nowrap; font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), color var(--tc-duration-moderate) var(--tc-ease-standard); }
/* The bar behind each row: the meter pattern */
.ui-xc__track { grid-column: 2 / -1; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-xc__bar { display: block; width: 100%; height: 100%; border-radius: var(--tc-radius-2xs); background: var(--tc-experiment-card-color); transform-origin: 0 50%; transition: transform var(--tc-duration-slowest) var(--tc-ease-move); }
/* ----- Tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-xc__foot { display: flex; align-items: center; gap: 8px; height: 38px; padding: 4px 4px 0 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm-plus); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-xc__caption > span { display: inline-block; animation: ui-xc-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
/* The action: the primary button – flat ink, the control geometry */
:where([data-look="standard"], [data-look="standard"] *).ui-xc__action { display: inline-flex; align-items: center; gap: 4px; flex: none; height: var(--tc-control-h-sm); padding: 0 calc(var(--tc-control-px-sm) - 3px) 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; animation: ui-xc-pop var(--tc-duration-slow) var(--tc-ease-move) both; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-xc__action:hover { background: var(--tc-action-primary-bg-hover); }
.ui-xc__action:active { background: var(--tc-action-primary-bg-active); }
.ui-xc__action[aria-disabled="true"] { opacity: 0.6; cursor: progress; }
.ui-xc__action svg { transition: transform var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__label { overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__value { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); font-variant-numeric: tabular-nums; }
/* ----- The last row inside the card ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-xc__foot { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 8px 0 12px; border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* Primary: the dark chip */
:where([data-look="clean"], [data-look="clean"] *).ui-xc__action { display: inline-flex; align-items: center; gap: 4px; flex: none; height: var(--tc-control-h-md); padding: 0 calc(var(--tc-control-px-md) - 3px) 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); line-height: var(--tc-line-height-normal); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; animation: ui-xc-pop var(--tc-duration-slow) var(--tc-ease-move) both; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-xc__action:hover svg { transform: translateX(2px); }
.ui-xc__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-xc__lift svg { flex: none; }
@keyframes ui-xc-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-xc-pop { from { opacity: 0; transform: scale(0.94); } }
/* Narrow cards: the note gives way first, then the lift chip loses its padding */
@container (max-width: 300px) {
:where([data-look="standard"], [data-look="standard"] *).ui-xc__head { gap: 8px; padding: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__chart { width: 30px; height: 30px; padding: 5px 4px 4px; gap: 2.5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__note { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__lead { gap: 3px; padding: 0 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__lead svg { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__body { padding: 0 10px 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__metric { padding: 0 4px; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__row { column-gap: 7px; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__lift { min-width: 44px; padding: 0 4px; }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-xc__metric { height: 32px; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__row { padding: 10px 6px 11px; }
:where([data-look="standard"], [data-look="standard"] *).ui-xc__action { height: 30px; }
}
/* Narrow cards: the note gives way first, then the chips lose their padding */
@container (max-width: 300px) {
:where([data-look="clean"], [data-look="clean"] *).ui-xc__head { gap: 8px; padding: 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__chart { width: 32px; height: 32px; padding: 6px 5px 5px; gap: 2.5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__note { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__lead { gap: 3px; padding: 0 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__lead svg { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__body { padding: 0 10px 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__switch { gap: 2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__metric { flex: 1; padding: 4px 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__row { column-gap: 7px; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__lift { min-width: 44px; padding: 0 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__foot { padding: 0 8px 0 10px; }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-xc__metric { height: 34px; padding: 7px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__row { padding: 10px 6px 11px; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__foot { height: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-xc__action { height: 34px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-xc *, .ui-xc *::before, .ui-xc *::after { animation: none !important; transition: none !important; }
}
`;

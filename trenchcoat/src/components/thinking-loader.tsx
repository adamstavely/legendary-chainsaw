"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type Ref } from "react";
import { useControllable } from "../internal/use-controllable";
import { useOnScreen } from "../internal/use-on-screen";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Thinking Loader – a small "the model is working" pill, in a single self-contained file.
 * A spinner of eight rays and a label with a light sweeping over it. The label walks through
 * phases (Thinking → Searching the web → …): the old one rolls up and blurs out, the new one
 * rolls in, and the pill glides to its new width. When done, the spinner turns into a check
 * and the label settles on "Thought for 6s".
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (Standard by default). Clean is one white chip with hairline shadows, a thin
 * spinner in the accent blue and a quiet gray label with a darker band sweeping over it.
 */
export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-tl";

type ThinkingLoaderOwnProps = {
  /** Visual style: "standard" (the default) or "clean" */
  look?: Look;
  /** Labels to walk through, one after another */
  phases?: string[];
  /** Time per phase, in ms */
  interval?: number;
  /** Show a specific phase instead of advancing on a timer – e.g. from your stream events (controlled when defined) */
  phase?: number;
  /** The phase to start from when uncontrolled; the timer moves on from there */
  defaultPhase?: number;
  /** Reports each phase the timer moves to */
  onPhaseChange?: (phase: number) => void;
  /** When the work started, in epoch ms – the done label counts from here. Defaults to when the loader mounted (or work restarted) */
  startedAt?: number;
  /** Start over after the last phase instead of holding it – at most twice, then it holds the last phase (content
   *  that moves on by itself stops within a few cycles, WCAG 2.2.2) */
  loop?: boolean;
  /** Finished: the spinner turns into a check and the label into doneLabel */
  done?: boolean;
  /** Label once done – a string, or a function that gets the seconds since the loader started */
  doneLabel?: string | ((seconds: number) => string);
  size?: "sm" | "md";
  /** "pill" = bordered capsule, "plain" = just the spinner and the label, e.g. inside a chat bubble */
  variant?: "pill" | "plain";
  className?: string;
};

export type ThinkingLoaderProps = Omit<ComponentPropsWithoutRef<"span">, keyof ThinkingLoaderOwnProps> &
  ThinkingLoaderOwnProps & {
    /** The root element */
    ref?: Ref<HTMLSpanElement>;
  };

const DEFAULT_PHASES = ["Thinking", "Searching the web", "Reading sources", "Writing response"];
const RAYS = Array.from({ length: 8 }, (_, i) => i);
/** `loop` starts over this many times, then holds the last phase */
const MAX_LOOPS = 2;

/** A change handler for state whose changes another callback already reports (keeps useControllable from warning) */
const reportedElsewhere = () => {};

export function ThinkingLoader({
  look,
  phases = DEFAULT_PHASES,
  interval = 2200,
  phase,
  defaultPhase = 0,
  onPhaseChange,
  startedAt,
  loop = false,
  done = false,
  doneLabel = (s) => `Thought for ${s}s`,
  size = "md",
  variant = "pill",
  className,
  ref,
  ...rest
}: ThinkingLoaderProps) {
  const [step, setStep] = useControllable(
    phase,
    defaultPhase,
    // A controlled phase only shows what it's given (nothing here changes it), so it needs no handler
    onPhaseChange ?? reportedElsewhere,
  );
  const [seconds, setSeconds] = useState<number | null>(null);

  // The clock is only read in effects, never while rendering: the start is noted after mount (and when work
  // starts again), and the seconds are counted before the browser paints the done state
  const start = useRef<number | null>(null);
  const wasDone = useRef(done);
  useLayoutEffect(() => {
    if (!done) {
      start.current = Date.now();
      if (wasDone.current) {
        setSeconds(null);
        setStep(0);
      }
    } else {
      const from = startedAt ?? start.current ?? Date.now();
      setSeconds(Math.max(1, Math.round((Date.now() - from) / 1000)));
    }
    wasDone.current = done;
    // startedAt is read when done turns on; setStep is stable for a given mode
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the done edge restarts or stops the clock
  }, [done]);

  // Advance through the phases on a timer – unless the phase is controlled
  const timed = phase === undefined;
  useEffect(() => {
    if (done || !timed || phases.length < 2) return;
    let rounds = 0;
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s + 1 < phases.length) return s + 1;
        if (!loop || rounds >= MAX_LOOPS) return s;
        rounds++;
        return 0;
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [done, timed, phases.length, interval, loop, setStep]);

  const index = Math.min(Math.max(step, 0), Math.max(phases.length - 1, 0));
  // Until the seconds are counted (the same frame done turns on) the phase label stays
  const finished = done && seconds !== null;
  const label = finished ? (typeof doneLabel === "function" ? doneLabel(seconds) : doneLabel) : (phases[index] ?? "");

  // The label on screen and the one rolling out – swapped during render so both animate in the same frame
  const [shown, setShown] = useState({ key: 0, text: label });
  const [leaving, setLeaving] = useState<{ key: number; text: string } | null>(null);
  if (label !== shown.text) {
    setLeaving(shown);
    setShown({ key: shown.key + 1, text: label });
  }

  // The text box takes the width of the incoming label, so the pill glides to its new size
  const box = useRef<HTMLSpanElement>(null);
  const current = useRef<HTMLSpanElement>(null);
  const measured = useRef(false);
  useLayoutEffect(() => {
    const b = box.current;
    const c = current.current;
    if (!b || !c) return;
    if (!measured.current) b.style.transition = "none";
    // offsetWidth is in layout pixels, so it stays right inside a CSS zoom or transform (+1 covers rounding)
    b.style.width = `${c.offsetWidth + 1}px`;
    if (!measured.current) {
      b.getBoundingClientRect();
      b.style.transition = "";
      measured.current = true;
    }
    // The label can also grow without changing – a user's text spacing or font size (WCAG 1.4.12): follow it
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      b.style.width = `${c.offsetWidth + 1}px`;
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [shown.key]);

  // The spinner and the sweep pause while the loader is scrolled away or the tab is hidden
  const root = useRef<HTMLSpanElement>(null);
  const setRoot = useRootRef(root, ref);
  const onScreen = useOnScreen(root);

  return (
    <span
      role="status"
      aria-live="polite"
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={look ?? DEFAULT_LOOK}
      data-size={size}
      data-variant={variant}
      data-done={done || undefined}
      data-offscreen={onScreen ? undefined : ""}
    >
      {/* React 19 hoists this into <head> once, no matter how many loaders render */}
      <style href="ui-thinking-loader" precedence="default">
        {css}
      </style>

      <span className="ui-tl__icon" aria-hidden="true">
        <svg className="ui-tl__spinner" viewBox="0 0 16 16">
          {RAYS.map((i) => (
            <line
              key={i}
              x1="8"
              y1="1.75"
              x2="8"
              y2="4.75"
              transform={`rotate(${i * 45} 8 8)`}
              style={{ animationDelay: `${(i - 8) * 100}ms` }}
            />
          ))}
        </svg>
        <svg className="ui-tl__check" viewBox="0 0 16 16">
          <path d="M3.5 8.4 6.6 11.3 12.5 4.9" pathLength={1} />
        </svg>
      </span>

      {/* Announced: the first phase, then the done label – not every phase on its way (WCAG 4.1.3) */}
      <span className="ui-tl__sr">{finished ? label : (phases[0] ?? "")}</span>

      <span ref={box} className="ui-tl__text" aria-hidden="true">
        {leaving && (
          <span
            key={leaving.key}
            className="ui-tl__label ui-tl__label--out"
            aria-hidden="true"
            onAnimationEnd={() => setLeaving(null)}
          >
            {leaving.text}
          </span>
        )}
        <span
          key={shown.key}
          ref={current}
          className={["ui-tl__label", shown.key > 0 && "ui-tl__label--in"].filter(Boolean).join(" ")}
        >
          {shown.text}
        </span>
        {!done && (
          <span key={`shine-${shown.key}`} className="ui-tl__shine">
            <span>{shown.text}</span>
          </span>
        )}
      </span>
    </span>
  );
}

const css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *).ui-tl {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-thinking-loader-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.95));
  --tc-thinking-loader-h: 34px;
  --tc-thinking-loader-font: var(--tc-font-size-lg);
  --tc-thinking-loader-lh: var(--tc-line-height-snug);
  --tc-thinking-loader-icon: 15px;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  box-sizing: border-box;
  height: var(--tc-thinking-loader-h);
  padding: 0 var(--tc-space-4) 0 var(--tc-space-3);
  border-radius: var(--tc-radius-full);
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 1px var(--tc-border-default), var(--tc-shadow-control);
  color: var(--tc-text-muted);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-thinking-loader-font);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-none);
  letter-spacing: -0.006em;
  vertical-align: middle;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tl[data-size="sm"] {
  --tc-thinking-loader-h: 28px;
  --tc-thinking-loader-font: var(--tc-font-size-md);
  --tc-thinking-loader-lh: var(--tc-line-height-tight);
  --tc-thinking-loader-icon: 13px;
  gap: var(--tc-space-2);
  padding: 0 var(--tc-space-3) 0 var(--tc-space-2-5);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tl[data-variant="plain"] {
  padding: 0;
  background: none;
  box-shadow: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tl {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-thinking-loader-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  --tc-thinking-loader-h: 32px;
  --tc-thinking-loader-font: var(--tc-font-size-md);
  --tc-thinking-loader-lh: var(--tc-line-height-normal);
  --tc-thinking-loader-icon: 16px;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  box-sizing: border-box;
  height: var(--tc-thinking-loader-h);
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  color: var(--tc-text-secondary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-thinking-loader-font);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-thinking-loader-lh);
  letter-spacing: -0.003em;
  vertical-align: middle;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tl[data-size="sm"] {
  --tc-thinking-loader-h: 26px;
  --tc-thinking-loader-font: var(--tc-font-size-sm);
  --tc-thinking-loader-lh: var(--tc-line-height-tight);
  --tc-thinking-loader-icon: 14px;
  gap: var(--tc-space-1);
  padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5);
  border-radius: var(--tc-radius-sm);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tl[data-variant="plain"] {
  height: auto;
  padding: 0;
  background: none;
  box-shadow: none;
}
/* Spinner and check share one square and swap with a little scale */
.ui-tl__icon {
  position: relative;
  flex: none;
  width: var(--tc-thinking-loader-icon);
  height: var(--tc-thinking-loader-icon);
}
.ui-tl__icon svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard), transform var(--tc-duration-slower) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tl__spinner line {
  stroke: var(--tc-text-primary);
  stroke-width: 1.6;
  stroke-linecap: round;
  opacity: 0.18;
  animation: ui-tl-ray var(--tc-duration-reveal) linear infinite;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tl__check {
  opacity: 0;
  transform: scale(0.6);
  fill: none;
  stroke: var(--tc-text-primary);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Thin rays in the accent blue – they fade one after another, so the spinner turns without rotating */
:where([data-look="clean"], [data-look="clean"] *).ui-tl__spinner line {
  stroke: var(--tc-accent);
  stroke-width: 1.1;
  stroke-linecap: round;
  opacity: 0.2;
  animation: ui-tl-ray-clean var(--tc-duration-reveal) linear infinite;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tl__check {
  opacity: 0;
  transform: scale(0.6);
  fill: none;
  stroke: var(--tc-accent);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ui-tl__check path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
.ui-tl[data-done] .ui-tl__spinner {
  opacity: 0;
  transform: scale(0.6) rotate(-45deg);
}
.ui-tl[data-done] .ui-tl__check {
  opacity: 1;
  transform: none;
}
.ui-tl[data-done] .ui-tl__check path {
  animation: ui-tl-draw var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-quick) forwards;
}
/* The text box glides to the width of the incoming label; labels roll through it */
/* The text box glides to the width of the incoming label; labels roll through it */
.ui-tl__text {
  position: relative;
  display: block;
  line-height: var(--tc-thinking-loader-lh);
  height: var(--tc-thinking-loader-lh);
  height: 1lh;
  overflow: hidden;
  transition: width var(--tc-duration-slower) var(--tc-ease-move);
}
.ui-tl__label {
  position: absolute;
  top: 0;
  left: 0;
  white-space: nowrap;
}
.ui-tl[data-done] .ui-tl__label {
  color: var(--tc-text-primary);
}
.ui-tl__label--in {
  animation: ui-tl-in var(--tc-duration-slower) var(--tc-ease-move) both;
}
.ui-tl__label--out {
  animation: ui-tl-out var(--tc-duration-slow) var(--tc-ease-move) both;
}
/* A soft light sweeping over the label while it works */
/* A soft light sweeps over the label while it works – a few times, then it rests (WCAG 2.2.2). The window slides one
   way and the copy of the label inside it the other way, so only transform animates; paused off-screen */
.ui-tl__shine {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  animation: ui-tl-sweep var(--tc-duration-shimmer) linear var(--tc-duration-slower) 3 both;
}
.ui-tl__shine > span {
  display: block;
  white-space: nowrap;
  color: var(--tc-thinking-loader-shimmer);
  animation: ui-tl-sweep-text var(--tc-duration-shimmer) linear var(--tc-duration-slower) 3 both;
}
.ui-tl[data-done] .ui-tl__shine { display: none; }
.ui-tl[data-offscreen] :is(.ui-tl__shine, .ui-tl__shine > span, .ui-tl__spinner line) { animation-play-state: paused; }
.ui-tl__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-tl-sweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
@keyframes ui-tl-sweep-text {
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
}
@keyframes ui-tl-ray {
  0% { opacity: 1; }
  100% { opacity: 0.18; }
}
/* A darker band sweeping through the gray label while it works */
@keyframes ui-tl-ray-clean {
  0% { opacity: 1; }
  100% { opacity: 0.2; }
}
@keyframes ui-tl-in {
  from { opacity: 0; transform: translateY(70%); filter: blur(3px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-tl-out {
  from { opacity: 1; transform: none; filter: none; }
  to { opacity: 0; transform: translateY(-70%); filter: blur(3px); }
}
@keyframes ui-tl-draw {
  to { stroke-dashoffset: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-tl *,
  .ui-tl *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
  .ui-tl__spinner line { opacity: 0.6; }
  .ui-tl__shine { display: none; }
  .ui-tl__check path { stroke-dashoffset: 0; }
}
`;

"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react";
import { useRootRef } from "../internal/use-root-ref";
import { useOnScreen } from "../internal/use-on-screen";
import { reducedMotion } from "../internal/reduced-motion";

/*
 * Progress Tracker – a checklist with a progress bar, in a single self-contained file.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: progress-tracker.tsx is Standard,
 * progress-tracker-clean.tsx is Clean). Clean is one white card with hairline shadows, quiet gray type, a thin
 * blue bar and blue checks; the markup and behaviour are the same.
 */
export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-progress";

export type ProgressStep = {
  id: string;
  label: string;
  done?: boolean;
  /** Small icon on the right, e.g. the app the step belongs to */
  icon?: ReactNode;
};

type ProgressTrackerOwnProps = {
  title?: string;
  /** The checklist. Each step's `done` flag is where it starts; when the flags change, the tracker follows them */
  steps: ProgressStep[];
  /** Ids of the ticked steps. Controlled when defined – pair it with `onDoneChange` */
  done?: string[];
  /** Ids ticked on mount when `done` isn't controlled – defaults to the steps marked `done` */
  defaultDone?: string[];
  /** Called with the ticked ids whenever a step is ticked or cleared */
  onDoneChange?: (done: string[]) => void;
  /** Ticks the open steps one after another, then starts over – stops as soon as someone interacts, and starts
   *  again when it's switched off and on. Shows a Pause / Play button while on (WCAG 2.2.2) and doesn't run when the
   *  user asked for reduced motion */
  autoPlay?: boolean;
  /** Pause between two automatic steps, in ms */
  interval?: number;
  /** Called with every step and its new `done` flag whenever a step is ticked or cleared */
  onChange?: (steps: ProgressStep[]) => void;
  className?: string;
  /** Visual style. Defaults to the file's look: Standard in progress-tracker.tsx, Clean in progress-tracker-clean.tsx */
  look?: Look;
  ref?: Ref<HTMLDivElement>;
};

export type ProgressTrackerProps = Omit<ComponentPropsWithoutRef<"div">, keyof ProgressTrackerOwnProps> & ProgressTrackerOwnProps;


export function ProgressTracker({
  title = "Getting started",
  steps,
  done: doneProp,
  defaultDone,
  onDoneChange,
  autoPlay = false,
  interval = 2200,
  onChange,
  className,
  look,
  ref,
  onPointerDown,
  onKeyDown,
  ...rest
}: ProgressTrackerProps) {
  // Uncontrolled: our own ticks, remembered with the steps' flags they were made on – new flags win
  const flagged = steps.filter((s) => s.done).map((s) => s.id);
  const flaggedKey = flagged.join("\u0000");
  const [own, setOwn] = useState(() => ({ base: flaggedKey, ids: defaultDone ?? flagged }));
  const doneIds = doneProp ?? (own.base === flaggedKey ? own.ids : flagged);
  const done = new Set(doneIds);
  const doneKey = steps.filter((s) => done.has(s.id)).map((s) => s.id).join("\u0000");

  // Auto play stops on the first interaction, and starts again when autoPlay is switched back on
  const [interrupted, setInterrupted] = useState(false);
  const [lastAutoPlay, setLastAutoPlay] = useState(autoPlay);
  if (lastAutoPlay !== autoPlay) {
    setLastAutoPlay(autoPlay);
    if (autoPlay) setInterrupted(false);
  }
  // Reduced motion: no auto play (read after mount, so server and client render the same)
  const [still, setStill] = useState(false);
  useEffect(() => setStill(reducedMotion()), []);
  const playing = autoPlay && !interrupted && !still;
  // Auto play waits while the tracker is off screen or its tab is hidden
  const rootRef = useRef<HTMLDivElement>(null);
  const rootRefs = useRootRef(rootRef, ref);
  const onScreen = useOnScreen(rootRef);

  const total = steps.length;
  const count = steps.filter((s) => done.has(s.id)).length;
  const progress = total ? count / total : 0;

  // Computed from the current state and reported outside an updater – an updater runs during render
  // (twice under StrictMode), where calling the parent's onChange would update another component
  const commit = (next: Set<string>) => {
    const ids = steps.filter((s) => next.has(s.id)).map((s) => s.id);
    if (doneProp === undefined) setOwn({ base: flaggedKey, ids });
    onDoneChange?.(ids);
    onChange?.(steps.map((s) => ({ ...s, done: next.has(s.id) })));
  };

  const toggle = (id: string) => {
    const next = new Set(done);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    commit(next);
  };

  // Auto play: tick the next open step; when all are done, start over from the steps' own flags
  const autoStep = () => {
    const open = steps.find((s) => !done.has(s.id));
    if (open) toggle(open.id);
    else commit(new Set(flagged));
  };
  // The timer acts on the latest props when it fires
  const autoStepRef = useRef(autoStep);
  autoStepRef.current = autoStep;
  const allDone = count === total;
  useEffect(() => {
    if (!playing || !onScreen) return;
    const t = window.setTimeout(() => autoStepRef.current(), allDone ? interval * 2 : interval);
    return () => clearTimeout(t);
  }, [playing, onScreen, doneKey, allDone, interval]);

  return (
    <div
      {...rest}
      ref={rootRefs}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={look ?? DEFAULT_LOOK}
      data-complete={count === total || undefined}
      onPointerDown={(e) => {
        if (!isPlayButton(e.target)) setInterrupted(true);
        onPointerDown?.(e);
      }}
      onKeyDown={(e) => {
        if (!isPlayButton(e.target)) setInterrupted(true);
        onKeyDown?.(e);
      }}
    >
      {/* React 19 hoists this into <head> once, no matter how many trackers render */}
      <style href="ui-progress-tracker" precedence="default">
        {css}
      </style>

      <div className="ui-progress__head">
        <h3 className="ui-progress__title">{title}</h3>
        <span className="ui-progress__count" aria-hidden="true">
          <span className="ui-progress__digit" key={count}>
            {count}
          </span>
          /{total}
        </span>
        {autoPlay && (
          // One button for both states, so focus stays on it (WCAG 2.2.2, 2.4.3)
          <button
            type="button"
            className="ui-progress__play"
            aria-label={playing ? "Pause auto-play" : "Play auto-play"}
            title={playing ? "Pause" : "Play"}
            onClick={() => {
              if (playing) setInterrupted(true);
              else {
                setInterrupted(false);
                setStill(false);
              }
            }}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
        )}
      </div>

      <div
        className="ui-progress__bar"
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={count}
        aria-valuetext={`${count} of ${total} done`}
      >
        <span className="ui-progress__fill" style={{ transform: `scaleX(${progress})` }}>
          {/* A new key replays the shine each time progress grows */}
          <span className="ui-progress__shine" key={count} />
        </span>
      </div>

      <ul className="ui-progress__list">
        {steps.map((step, index) => {
          const checked = done.has(step.id);
          return (
            <li key={step.id} style={{ animationDelay: `${180 + index * 90}ms` }}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                className="ui-progress__step"
                onClick={() => toggle(step.id)}
              >
                <span className="ui-progress__check" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M6.5 12.5l3.5 3.5 7.5-8" pathLength={1} />
                  </svg>
                </span>
                <span className="ui-progress__label">
                  <span>{step.label}</span>
                </span>
                {step.icon && (
                  <span className="ui-progress__icon" aria-hidden="true">
                    {step.icon}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const isPlayButton = (target: EventTarget) => target instanceof Element && !!target.closest(".ui-progress__play");

/* pause / play: Lucide (ISC, lucide.dev) */
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="14" y="4" width="4" height="16" rx="1" />
    <rect x="6" y="4" width="4" height="16" rx="1" />
  </svg>
);
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

/* ---------- Styles ---------- */

const css = /* css */ `
/* Colors and motion as variables – override them on .ui-progress (see Theming in the docs) */
.ui-progress {
  box-sizing: border-box;
  width: 100%;
  background: var(--tc-surface-raised);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
  animation: ui-progress-in var(--tc-duration-slowest) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress {
  /* The sweep of light over the dark (light, in the dark theme) bar */
  --tc-progress-tracker-shine: light-dark(rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.7));
  max-width: 360px;
  padding: 22px var(--tc-space-4) var(--tc-space-3-5);
}
:where([data-look="clean"], [data-look="clean"] *).ui-progress {
  /* The light band over the blue bar is pure white in the dark theme */
  --tc-progress-tracker-shine: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  container-type: inline-size;
  max-width: 340px;
  padding: var(--tc-space-3-5) var(--tc-space-1-5) var(--tc-space-1-5);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  text-align: left;
}
.ui-progress *,
.ui-progress *::before,
.ui-progress *::after {
  box-sizing: border-box;
}
:where(.ui-progress) button {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  cursor: pointer;
}
/* Header: the title, a quiet counter and – with autoPlay – Pause / Play */
.ui-progress__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--tc-space-3);
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__head { padding: 0 var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__head { padding: 0 var(--tc-space-2-5); }
.ui-progress__title { margin: 0; font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-progress__title {
  font-size: var(--tc-font-size-xl);
  letter-spacing: -0.01em;
}
:where([data-look="clean"], [data-look="clean"] *).ui-progress__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--tc-text-strong);
  font-size: var(--tc-font-size-lg-plus);
  line-height: var(--tc-line-height-loose);
}
.ui-progress__count {
  margin-left: auto;
  color: var(--tc-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__count { font-size: var(--tc-font-size-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__count { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* The number rolls in from below whenever it changes */
.ui-progress__digit {
  display: inline-block;
  animation: ui-progress-roll var(--tc-duration-slowest) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-progress__digit { color: var(--tc-text-primary); }
/* Pause / Play: a ghost icon button, like Button's */
.ui-progress__play {
  flex: none;
  display: inline-grid;
  place-items: center;
  align-self: center;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  margin: calc(var(--tc-control-h-sm) / -4) calc(var(--tc-control-h-sm) / -4) calc(var(--tc-control-h-sm) / -4) 0;
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-action-ghost-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-progress__play:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-progress__play:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-progress__play svg { display: block; }
/* The bar: the meter recipe – ink in Standard (like its checks), the accent in Clean */
.ui-progress__bar {
  position: relative;
  border-radius: var(--tc-meter-radius);
  background: var(--tc-meter-track);
  overflow: hidden;
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__bar { height: var(--tc-meter-h-hero); margin: var(--tc-space-4) var(--tc-space-1-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__bar { height: var(--tc-meter-h); margin: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2); }
.ui-progress__fill {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  transform-origin: 0 50%;
  overflow: hidden;
  transition: transform calc(2 * var(--tc-duration-slowest)) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__fill { background: var(--tc-surface-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__fill { background: var(--tc-meter-fill); }
/* A shine runs once each time progress grows – it moves with transform (composited) */
.ui-progress__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 30%, var(--tc-progress-tracker-shine) 50%, transparent 70%);
  transform: translateX(100%);
  animation: ui-progress-shine calc(2 * var(--tc-duration-reveal)) var(--tc-ease-decelerate) both;
}
.ui-progress__list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__list { gap: var(--tc-space-0-5); }
/* On mount the card settles in, then the rows fade up one after another */
.ui-progress__list > li {
  position: relative;
  animation: ui-progress-row-in var(--tc-duration-reveal) var(--tc-ease-move) both;
}
.ui-progress__step {
  display: flex;
  align-items: center;
  width: 100%;
  background: transparent;
  text-align: left;
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__step {
  gap: var(--tc-space-3);
  padding: var(--tc-space-2) var(--tc-space-1-5);
  border-radius: var(--tc-radius-xl);
  font-size: var(--tc-font-size-lg-plus);
  line-height: var(--tc-line-height-relaxed);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-progress__step {
  gap: var(--tc-space-2-5);
  padding: var(--tc-space-1-5) var(--tc-space-2-5);
  border-radius: var(--tc-radius-sm);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate);
}
.ui-progress__step:hover {
  background: var(--tc-fill-hover);
}
/* Rows sit edge to edge: the ring is drawn inside the row so it never overlaps its neighbour */
.ui-progress__step:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: calc(-1 * var(--tc-focus-ring-width));
}
/* Checkbox: the ring fills and pops, then the tick draws itself. The unchecked ring is a control edge (≥ 3:1) */
.ui-progress__check {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: transparent;
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__check {
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--tc-border-control);
  transition:
    background-color var(--tc-duration-base) var(--tc-ease-move),
    border-color var(--tc-duration-base) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-progress__check {
  width: 16px;
  height: 16px;
  box-shadow: inset 0 0 0 1px var(--tc-border-control);
  transition:
    background-color var(--tc-duration-base) var(--tc-ease-move),
    box-shadow var(--tc-duration-base) var(--tc-ease-move);
}
.ui-progress__check svg {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset var(--tc-duration-quick) var(--tc-ease-in);
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__check svg { width: 14px; height: 14px; stroke: var(--tc-text-on-inverse); stroke-width: 2.4; }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__check svg { width: 12px; height: 12px; stroke: var(--tc-text-on-accent); stroke-width: 2.2; }
:where([data-look="standard"], [data-look="standard"] *).ui-progress__step[aria-checked="true"] .ui-progress__check {
  background: var(--tc-surface-inverse);
  border-color: var(--tc-surface-inverse);
  animation: ui-progress-pop var(--tc-duration-slowest) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-progress__step[aria-checked="true"] .ui-progress__check {
  background: var(--tc-accent);
  box-shadow: inset 0 0 0 1px transparent;
  animation: ui-progress-pop-clean var(--tc-duration-slowest) var(--tc-ease-move);
}
.ui-progress__step[aria-checked="true"] .ui-progress__check svg {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-fast);
}
/* Label: wraps instead of clipping (nothing is lost at narrow widths), grays out while a line strikes through it */
.ui-progress__label {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  transition: color var(--tc-duration-slow) var(--tc-ease-standard);
}
.ui-progress__label > span {
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  transition: background-size var(--tc-duration-slower) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__label > span { background: linear-gradient(currentColor, currentColor) 0 58% / 0% 1.5px no-repeat; }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__label > span { background: linear-gradient(var(--tc-text-disabled), var(--tc-text-disabled)) 0 60% / 0% 1px no-repeat; }
.ui-progress__step[aria-checked="true"] .ui-progress__label {
  color: var(--tc-text-muted);
}
.ui-progress__step[aria-checked="true"] .ui-progress__label > span { transition: background-size var(--tc-duration-slowest) var(--tc-ease-move) var(--tc-duration-base); }
:where([data-look="standard"], [data-look="standard"] *).ui-progress__step[aria-checked="true"] .ui-progress__label > span { background-size: 100% 1.5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__step[aria-checked="true"] .ui-progress__label > span { background-size: 100% 1px; }
.ui-progress__icon {
  flex: none;
  display: grid;
  place-items: center;
  transition: opacity var(--tc-duration-slow) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-progress__icon { width: 18px; height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__icon { width: 16px; height: 16px; color: var(--tc-icon-muted); }
.ui-progress__icon > svg {
  width: 100%;
  height: 100%;
}
.ui-progress__step[aria-checked="true"] .ui-progress__icon {
  opacity: 0.45;
}
@keyframes ui-progress-pop {
  0% { transform: scale(0.9); }
  60% { transform: scale(1.06); }
  100% { transform: scale(1); }
}
/* Touch screens: taller rows */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-progress__step {
    padding-top: var(--tc-space-2-5);
    padding-bottom: var(--tc-space-2-5);
}
}
/* Narrow cards: a little less inset */
@container (max-width: 300px) {
:where([data-look="clean"], [data-look="clean"] *).ui-progress__head { padding: 0 var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__bar { margin-left: var(--tc-space-2); margin-right: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-progress__step { padding-left: var(--tc-space-2); padding-right: var(--tc-space-2); }
}
@keyframes ui-progress-pop-clean {
  0% { transform: scale(0.9); }
  60% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
@keyframes ui-progress-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
@keyframes ui-progress-row-in {
  from {
    opacity: 0;
    filter: blur(3px);
    transform: translateY(8px);
  }
}
@keyframes ui-progress-roll {
  from { opacity: 0; transform: translateY(60%); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-progress-shine {
  from { transform: translateX(100%); opacity: 1; }
  to { transform: translateX(-100%); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-progress,
  .ui-progress *,
  .ui-progress *::before,
  .ui-progress *::after {
    animation: none !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }
}
`;

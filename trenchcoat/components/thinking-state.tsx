"use client";

/*
 * Thinking State – the "working…" panel of an AI chat, in a single self-contained file.
 * A header with a live timer, then searches with their sources and the thinking steps
 * appear one after another; at the end a check, and the header turns into "Worked for …".
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: thinking-state.tsx is Standard,
 * thinking-state-clean.tsx is Clean). Clean is one white card with hairline shadows: the header row holds a 3×3
 * pixel mark that twinkles while it thinks, the live timer and the chevron; only the steps below a hairline fold
 * away. Clean shows the first step right away, so the panel never opens empty; Standard reveals it after a short
 * pause.
 */
// Generated from src/components/thinking-state.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-think";

export type ThinkingSource = {
  label: string;
  icon?: ReactNode;
  /** Opens in a new tab */
  href?: string;
  /** Tooltip on hover – defaults to the link */
  tooltip?: string;
};

export type ThinkingStep =
  | {
      kind: "search";
      label: string;
      activeLabel?: string;
      sources: ThinkingSource[];
      /** Hidden behind a "+N more" chip until it is clicked */
      moreSources?: ThinkingSource[];
    }
  | { kind: "step"; label: string };

type ThinkingStateOwnProps = {
  steps: ThinkingStep[];
  /** Label of the final row */
  doneLabel?: string;
  /** Pause between two steps, in ms (the timeline that runs when `progress` and `done` aren't passed) */
  stepMs?: number;
  /**
   * How many steps have appeared (controlled when defined) – e.g. from your stream events. The timeline then
   * leaves the steps to you; pass `done` to finish
   */
  progress?: number;
  /** Reports each step the timeline reveals */
  onProgressChange?: (progress: number) => void;
  /** Finished (controlled when defined): the check row shows and the header says how long it worked */
  done?: boolean;
  /**
   * Start over after a pause once finished – nice for previews (only while the timeline runs everything). It stops by
   * itself after a few runs, and as soon as the pointer or focus is inside (WCAG 2.2.2)
   */
  loop?: boolean;
  /** Called once it's finished – by the timeline or by `done` – with the seconds it worked */
  onDone?: (seconds: number) => void;
  /** Whether the steps are unfolded (controlled when defined) */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When the work started, in epoch ms – the header's timer counts from here. Defaults to when the run started */
  startedAt?: number;
  /** Visual style. Defaults to the file's look: Standard in thinking-state.tsx, Clean in thinking-state-clean.tsx */
  look?: Look;
  className?: string;
};

export type ThinkingStateProps = Omit<ComponentPropsWithoutRef<"div">, keyof ThinkingStateOwnProps> &
  ThinkingStateOwnProps & {
    /** The root element */
    ref?: Ref<HTMLDivElement>;
  };

/** How many times `loop` starts over before it stays finished */
const MAX_RUNS = 3;

/** Standard reveals the first step after this pause; Clean shows it from the start */
const START_MS = 700;
const CHIP_MS = 160;

/** What identifies a step for the timeline: its kind, label and how many sources pop in */
const stepKey = (s: ThinkingStep) => (s.kind === "search" ? `search\u0001${s.label}\u0001${s.sources.length}` : `step\u0001${s.label}`);

export function ThinkingState({
  steps,
  doneLabel = "Finished thinking",
  stepMs = 1300,
  progress,
  onProgressChange,
  done: doneProp,
  loop = false,
  onDone,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  startedAt,
  look,
  className,
  ref,
  ...rest
}: ThinkingStateProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const bodyId = `${useId()}-steps`;
  // How many steps are visible at the start of a run – Clean shows the first one right away, so it never opens empty
  const firstShown = clean ? Math.min(1, steps.length) : 0;
  const [run, setRun] = useState(0);
  // What the timeline has revealed / finished; `progress` and `done` take over when passed
  const [timedShown, setShown] = useState(firstShown);
  const [timedDone, setDone] = useState(false);
  const stepsControlled = progress !== undefined;
  const doneControlled = doneProp !== undefined;
  const shown = Math.max(0, Math.min(steps.length, stepsControlled ? progress : timedShown));
  const done = doneProp ?? (stepsControlled ? false : timedDone);
  const timed = !stepsControlled && !doneControlled;
  const [seconds, setSeconds] = useState(0);
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const started = useRef(0);
  // Once someone clicks inside, a looping preview stays put instead of starting over
  const touched = useRef(false);

  // Reveal the steps one by one; a search waits until all of its sources have popped in.
  // The effect keys on the steps' content, not the array's identity, so a parent re-rendering with an inline
  // array doesn't restart it, and steps appended while it runs (or after it finished) continue the timeline.
  const signature = steps.map(stepKey).join("\u0000");
  const timeline = useRef({ run: -1, signature: "", stepMs: 0, shown: 0, done: false });
  const onDoneRef = useRef(onDone);
  const onProgressRef = useRef(onProgressChange);
  useEffect(() => {
    onDoneRef.current = onDone;
    onProgressRef.current = onProgressChange;
  });
  // Before the timeline has run (e.g. mounted already done) the start is now
  const startOf = (now: number) => startedAt ?? (started.current || now);
  useEffect(() => {
    const tl = timeline.current;
    const now = Date.now();
    const continues = tl.run === run && tl.stepMs === stepMs && (signature === tl.signature || signature.startsWith(tl.signature + "\u0000"));
    if (!continues) {
      started.current = now;
      tl.shown = firstShown;
      tl.done = false;
      setShown(firstShown);
      setDone(false);
      setSeconds(0);
      setOpen(true);
      setExpanded(new Set());
    } else if (tl.done && steps.length > tl.shown) {
      tl.done = false;
      setDone(false);
    }
    Object.assign(tl, { run, signature, stepMs });
    // When each step appears on this run's clock (the first after START_MS, or from the start in Clean), and finally
    // when it's done
    const at: number[] = [];
    let t = clean ? 0 : START_MS;
    for (const step of steps) {
      at.push(t);
      t += stepMs + (step.kind === "search" ? (step.sources.length + 1) * CHIP_MS : 0);
    }
    at.push(t);
    const elapsed = now - started.current;
    // Steps appended after the end show from now rather than all at once
    const shift = Math.max(0, elapsed - at[Math.min(tl.shown, steps.length)]);
    const timers: number[] = [];
    // A controlled `progress` reveals the steps itself, and a controlled `done` finishes
    for (let i = tl.shown; !stepsControlled && i < steps.length; i++) {
      timers.push(
        window.setTimeout(() => {
          tl.shown = i + 1;
          setShown(i + 1);
          onProgressRef.current?.(i + 1);
        }, at[i] + shift - elapsed),
      );
    }
    if (!tl.done && timed) {
      timers.push(
        window.setTimeout(() => {
          tl.done = true;
          setDone(true);
        }, at[steps.length] + shift - elapsed),
      );
    }
    if (loop && timed && run < MAX_RUNS - 1) timers.push(window.setTimeout(() => !touched.current && setRun((r) => r + 1), at[steps.length] + shift + 4000 - elapsed));
    return () => timers.forEach(clearTimeout);
  }, [run, signature, stepMs, loop, clean, stepsControlled, timed]); // eslint-disable-line react-hooks/exhaustive-deps -- `steps` is read through its content signature

  // Finished (by the timeline or by `done`): count the seconds before the browser paints, and report them
  const reported = useRef(false);
  useLayoutEffect(() => {
    if (!done) {
      reported.current = false;
      return;
    }
    if (reported.current) return;
    reported.current = true;
    const now = Date.now();
    const s = Math.max(1, Math.round((now - startOf(now)) / 1000));
    setSeconds(s);
    onDoneRef.current?.(s);
  }, [done, run]); // eslint-disable-line react-hooks/exhaustive-deps -- startedAt is read when it finishes

  // Live timer while thinking: written into the header's text, never rendered – the panel only re-renders when a
  // step appears. Paused while off-screen or in a hidden tab
  const timeRef = useRef<HTMLSpanElement>(null);
  const live = useRef(false);
  const startOfRef = useRef(startOf);
  useLayoutEffect(() => {
    startOfRef.current = startOf;
  });
  const paintTime = useCallback(() => {
    const node = timeRef.current?.firstChild;
    // Only while the timer runs – once done, the header shows the final count from state
    if (!live.current || !node || node.nodeType !== Node.TEXT_NODE) return;
    const now = Date.now();
    const value = format(Math.max(0, Math.floor((now - startOfRef.current(now)) / 1000)));
    if (node.nodeValue !== value) node.nodeValue = value;
  }, []);
  useLayoutEffect(paintTime);
  useEffect(() => {
    if (done) return;
    let onScreen = true;
    const el = timeRef.current;
    const io =
      el && typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting;
            if (onScreen) paintTime();
          })
        : null;
    if (el) io?.observe(el);
    const onVisible = () => document.visibilityState !== "hidden" && paintTime();
    document.addEventListener("visibilitychange", onVisible);
    live.current = true;
    paintTime();
    const t = window.setInterval(() => {
      if (onScreen && document.visibilityState !== "hidden") paintTime();
    }, 250);
    return () => {
      live.current = false;
      clearInterval(t);
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [done, run, startedAt, paintTime]);

  const active = done ? -1 : shown - 1;

  const list = (
    <ol className="ui-think__list">
      {steps.slice(0, shown).map((step, i) => {
        const isActive = i === active;
        const label = step.kind === "search" && isActive ? (step.activeLabel ?? "Searching") : step.label;
        return (
          <li key={i} className="ui-think__item" data-kind={step.kind} data-active={isActive || undefined}>
            <span className="ui-think__node" aria-hidden="true">
              {step.kind === "search" ? (
                <svg viewBox="0 0 24 24" className="ui-think__globe">
                  <path d="M22 12A10 10 0 1 0 12 22" />
                  <path d="M20 5.7c-.93.07-2.13.43-2.96 1.5-1.5 1.94-3 2.1-4 1.46-1.5-.97-.24-2.54-2-3.4-1.15-.56-1.31-2.07-.67-3.26" />
                  <path d="M2 11c.76.66 1.83 1.27 3.09 1.27 2.6 0 3.12.5 3.12 2.48s0 1.99.52 3.48c.34.97.46 1.94-.22 2.77" />
                  <path d="m19.9 19.93 2.1 2.07m-.89-4.95a4.05 4.05 0 1 1-8.11 0 4.05 4.05 0 0 1 8.11 0Z" />
                </svg>
              ) : (
                <span className="ui-think__dot" />
              )}
            </span>
            <div className="ui-think__content">
              <span
                className={isActive ? "ui-think__label ui-think__shimmer" : "ui-think__label"}
                data-text={label}
              >
                {label}
              </span>
              {step.kind === "search" && (
                <div className="ui-think__sources">
                  {[...step.sources, ...(expanded.has(i) ? (step.moreSources ?? []) : [])].map((source, j) => (
                    <Source
                      key={source.label + j}
                      source={source}
                      // Extra sources pop in quickly after a click, the first ones follow the search
                      delay={j < step.sources.length ? 120 + j * CHIP_MS : (j - step.sources.length) * 70}
                    />
                  ))}
                  {step.moreSources?.length ? (
                    <button
                      type="button"
                      className="ui-think__source ui-think__more"
                      aria-expanded={expanded.has(i)}
                      style={{ animationDelay: `${120 + step.sources.length * CHIP_MS}ms` }}
                      onClick={() => {
                        touched.current = true;
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          return next;
                        });
                      }}
                    >
                      {expanded.has(i) ? "Show less" : `+${step.moreSources.length} more`}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </li>
        );
      })}
      {done && (
        <li className="ui-think__item" data-kind="done">
          <span className="ui-think__node" aria-hidden="true">
            {clean ? (
              <svg viewBox="0 0 16 16" className="ui-think__check">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M5.4 8.3l1.75 1.75L10.7 6.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="ui-think__check">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12.5l2.5 2.5L16 9" />
              </svg>
            )}
          </span>
          <div className="ui-think__content">
            <span className="ui-think__label">{doneLabel}</span>
          </div>
        </li>
      )}
    </ol>
  );

  return (
    <div
      {...rest}
      ref={ref}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-done={done || undefined}
      key={run}
      // A looping preview stays put once someone points at it or moves focus into it
      onPointerEnter={(e) => {
        touched.current = true;
        rest.onPointerEnter?.(e);
      }}
      onFocus={(e) => {
        touched.current = true;
        rest.onFocus?.(e);
      }}
    >
      {/* React 19 hoists this into <head> once, no matter how many panels render */}
      <style href="ui-thinking-state" precedence="default">
        {css}
      </style>

      {/* Says the outcome once – the steps themselves aren't a live region */}
      <span className="ui-think__sr" role="status">
        {done ? `${doneLabel}. Worked for ${format(seconds)}` : ""}
      </span>
      <button type="button" className="ui-think__head" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((o) => !o)}>
        {clean ? (
          // A 3×3 pixel mark: the squares twinkle while it thinks and settle once it's done
          <span className="ui-think__mark" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} style={{ animationDelay: `${PIXEL_DELAYS[i]}ms` }} />
            ))}
          </span>
        ) : (
          <span className="ui-think__chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M18 9s-4.419 6-6 6c-1.581 0-6-6-6-6" />
            </svg>
          </span>
        )}
        <span className="ui-think__title" key={done ? "done" : "busy"}>
          {done ? (
            `Worked for ${format(seconds)}`
          ) : (
            <>
              <span className="ui-think__shimmer" data-text="Thinking">
                Thinking
              </span>
              {/* Ticks every second – kept out of the button's name */}
              <span className="ui-think__time" ref={timeRef} aria-hidden="true">
                {format(seconds)}
              </span>
            </>
          )}
        </span>
        {/* Clean: the chevron ends the header row */}
        {clean && (
          <span className="ui-think__chevron" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M4.5 6.25 8 9.75l3.5-3.5" />
            </svg>
          </span>
        )}
      </button>

      {/* Folded away = inert: nothing inside can be focused or read */}
      <div className="ui-think__body" id={bodyId} data-open={open} inert={!open}>
        {/* Clean: only the steps fold away, inside a clip – the header row always stays in view */}
        {clean ? <div className="ui-think__clip">{list}</div> : list}
      </div>
    </div>
  );
}

/** A source chip: a link when it has one, with a tooltip on hover and focus */
function Source({ source, delay }: { source: ThinkingSource; delay: number }) {
  const tip = source.tooltip ?? source.href?.replace(/^https?:\/\//, "");
  // Escape hides the tooltip (without moving focus) until the pointer or focus leaves the chip – WCAG 1.4.13
  const [hot, setHot] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!hot || !tip) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setDismissed(true);
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [hot, tip]);
  const leave = () => {
    setHot(false);
    setDismissed(false);
  };
  const inner = (
    <>
      {source.icon && <span className="ui-think__favicon">{source.icon}</span>}
      <span className="ui-think__source-label">{source.label}</span>
      {tip && (
        <span className="ui-think__tip" aria-hidden="true">
          {tip}
        </span>
      )}
    </>
  );
  const props = {
    className: "ui-think__source",
    "data-count": !source.icon || undefined,
    "data-tip-off": dismissed || undefined,
    style: { animationDelay: `${delay}ms` },
    onPointerEnter: () => setHot(true),
    onPointerLeave: leave,
    onFocus: () => setHot(true),
    onBlur: leave,
  };
  return source.href ? (
    <a {...props} href={source.href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    <span {...props}>{inner}</span>
  );
}

/** Twinkle order of Clean's 3×3 pixel mark – a diagonal wave */
const PIXEL_DELAYS = [0, 120, 240, 120, 240, 360, 240, 360, 480];

/** 9s, 1m 05s */
const format = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`);

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
.ui-think:where([data-look="standard"]),
.ui-think__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-overlay: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-tooltip-bg: light-dark(#171717, #ededed);
  --_tc-tooltip-fg: light-dark(#ffffff, #111113);
  --_tc-tooltip-font-size: 12px;
  --_tc-tooltip-px: 8px;
  --_tc-tooltip-py: 4px;
  --_tc-tooltip-radius: 6px;
}
.ui-think:where([data-look="clean"]),
.ui-think__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-overlay: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-tooltip-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-tooltip-fg: light-dark(#fcfcfc, #161618);
  --_tc-tooltip-font-size: 12px;
  --_tc-tooltip-px: 8px;
  --_tc-tooltip-py: 4px;
  --_tc-tooltip-radius: 6px;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Colors and motion as variables – override them on .ui-think (see Theming in the docs) */
:where([data-look="standard"], [data-look="standard"] *).ui-think {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-thinking-state-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.95));

  width: 100%;
  max-width: 440px;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  line-height: 1.45;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-think (see Theming in the docs) */
:where([data-look="clean"], [data-look="clean"] *).ui-think {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-thinking-state-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */

  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 440px;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-think *,
.ui-think *::before,
.ui-think *::after {
  box-sizing: border-box;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think svg {
  display: block;
  width: 100%;
  height: 100%;
}
/* Header: chevron + "Thinking 4s" / "Worked for 18s" */
:where([data-look="standard"], [data-look="standard"] *).ui-think__head {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 0 -4px;
  padding: 4px 8px 4px 4px;
  border: 0;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: none;
  font: inherit;
  font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  cursor: pointer;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__head:hover {
  background: var(--tc-fill-default, var(--_tc-fill-default));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__chevron {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(-90deg);
  transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__head[aria-expanded="true"] .ui-think__chevron {
  transform: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__title {
  display: inline-flex;
  gap: 8px;
  animation: ui-think-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__time {
  font-variant-numeric: tabular-nums;
}
/* Body collapses smoothly */
:where([data-look="standard"], [data-look="standard"] *).ui-think__body {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__body[data-open="false"] {
  grid-template-rows: 0fr;
  opacity: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__body[data-open="false"] .ui-think__list {
  overflow: hidden;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__list {
  min-height: 0;
  /* clips only while collapsed, so tooltips can reach out when open */
  overflow: visible;
  margin: 0;
  padding: 10px 0 0;
  list-style: none;
}
/* Timeline: icon column with a line growing down to the next node */
:where([data-look="standard"], [data-look="standard"] *).ui-think__item {
  position: relative;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 12px;
  padding-bottom: 12px;
  animation: ui-think-in var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__item:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 9.5px;
  top: 24px;
  bottom: 2px;
  width: 1px;
  background: var(--tc-border-default, var(--_tc-border-default));
  transform-origin: top;
  animation: ui-think-line var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__node {
  display: grid;
  place-items: center;
  width: 20px;
  height: 21px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__globe {
  width: 18px !important;
  height: 18px !important;
  fill: none;
  stroke: var(--tc-text-muted, var(--_tc-text-muted));
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tc-text-disabled, var(--_tc-text-disabled));
  transition: background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__item[data-active] .ui-think__dot {
  background: var(--tc-text-primary, var(--_tc-text-primary));
  animation: ui-think-pulse 1.2s ease-in-out 4;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__check {
  width: 18px !important;
  height: 18px !important;
  animation: ui-think-pop var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-spring, var(--_tc-ease-spring)) both;
}
:where([data-look="clean"], [data-look="clean"] *):where(.ui-think) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-think) svg { display: block; flex: none; }
.ui-think button:focus-visible,
.ui-think a:focus-visible {
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset));
}
.ui-think__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* Header row: pixel mark + "Thinking 4s" / "Worked for 18s" + chevron */
:where([data-look="clean"], [data-look="clean"] *).ui-think__head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 44px;
  padding: 0 12px 0 16px;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  text-align: left;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), border-radius 0ms linear var(--tc-duration-slow, var(--_tc-duration-slow));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__head[aria-expanded="true"] {
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)) var(--tc-radius-lg, var(--_tc-radius-lg)) 0 0;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__head:hover {
  background: var(--tc-fill-subtle, var(--_tc-fill-subtle));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__mark {
  display: grid;
  grid-template-columns: repeat(3, 3px);
  grid-auto-rows: 3px;
  gap: 1.5px;
  place-content: center;
  width: 16px;
  height: 16px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__mark i {
  border-radius: 0.75px;
  background: var(--tc-accent, var(--_tc-accent));
  animation: ui-think-pixel 1.2s ease-in-out 4 both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think[data-done] .ui-think__mark i {
  animation: ui-think-settle var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__title {
  display: inline-flex;
  flex: 1;
  min-width: 0;
  gap: 8px;
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  white-space: nowrap;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  animation: ui-think-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__title .ui-think__shimmer {
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__time {
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__chevron {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-right: -6px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__chevron svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(-90deg);
  transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__head[aria-expanded="true"] .ui-think__chevron svg {
  transform: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__head:hover .ui-think__chevron {
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
/* Body: folds away under a hairline – only this part animates and clips */
:where([data-look="clean"], [data-look="clean"] *).ui-think__body {
  display: grid;
  grid-template-rows: 1fr;
  border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default));
  transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), border-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__body[data-open="false"] {
  grid-template-rows: 0fr;
  opacity: 0;
  border-top-color: transparent;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__clip {
  min-height: 0;
  /* clips only while folded, so tooltips can reach out when open */
  overflow: visible;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__body[data-open="false"] .ui-think__clip {
  overflow: hidden;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__list {
  margin: 0;
  padding: 14px 16px 4px;
  list-style: none;
}
/* Timeline: icon column with a thin rail growing down to the next node */
:where([data-look="clean"], [data-look="clean"] *).ui-think__item {
  position: relative;
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 10px;
  padding-bottom: 12px;
  animation: ui-think-in var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__item:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 7.5px;
  top: 22px;
  bottom: 2px;
  width: 1px;
  background: var(--tc-border-default, var(--_tc-border-default));
  transform-origin: top;
  animation: ui-think-line var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__node {
  display: grid;
  place-items: center;
  width: 16px;
  height: 20px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__globe {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--tc-icon-muted, var(--_tc-icon-muted));
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* A finished step is a small gray dot, the running one a blue pixel that pulses */
:where([data-look="clean"], [data-look="clean"] *).ui-think__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--tc-text-disabled, var(--_tc-text-disabled));
  transition: background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), border-radius var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__item[data-active] .ui-think__dot {
  width: 6px;
  height: 6px;
  border-radius: 1.5px;
  background: var(--tc-accent, var(--_tc-accent));
  animation: ui-think-pulse-clean 1s ease-in-out 4;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__check {
  width: 16px;
  height: 16px;
  animation: ui-think-pop var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-spring, var(--_tc-ease-spring)) both;
}
.ui-think__check circle {
  fill: var(--tc-accent, var(--_tc-accent));
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__check path {
  fill: none;
  stroke: #fff;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 14;
  stroke-dashoffset: 14;
  animation: ui-think-draw var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-base, var(--_tc-duration-base)) forwards;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__content {
  min-width: 0;
  padding-top: 0.5px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__label {
  display: inline-block;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__item[data-active] .ui-think__label,
:where([data-look="standard"], [data-look="standard"] *).ui-think__item[data-kind="done"] .ui-think__label {
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
/* Sources: chips pop in one after another */
:where([data-look="standard"], [data-look="standard"] *).ui-think__sources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__source {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  height: 28px;
  padding: 0 10px 0 6px;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  animation: ui-think-chip var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
a.ui-think__source:where([data-look="standard"], [data-look="standard"] *),
:where([data-look="standard"], [data-look="standard"] *).ui-think__more {
  position: relative;
  border: 0;
  font: inherit;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
a.ui-think__source:where([data-look="standard"], [data-look="standard"] *):hover {
  background: var(--tc-fill-hover, var(--_tc-fill-hover));
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__more {
  padding: 0 10px;
  background: none;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__more:hover {
  background: var(--tc-fill-default, var(--_tc-fill-default));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
/* Tooltip above the chip: the tooltip recipe in both looks. It can be hovered (a bridge spans the gap), shows on
   focus too, and Escape hides it */
.ui-think__tip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  z-index: 2;
  padding: var(--tc-tooltip-py, var(--_tc-tooltip-py)) var(--tc-tooltip-px, var(--_tc-tooltip-px));
  border-radius: var(--tc-tooltip-radius, var(--_tc-tooltip-radius));
  background: var(--tc-tooltip-bg, var(--_tc-tooltip-bg));
  box-shadow: var(--tc-shadow-overlay, var(--_tc-shadow-overlay));
  color: var(--tc-tooltip-fg, var(--_tc-tooltip-fg));
  font-size: var(--tc-tooltip-font-size, var(--_tc-tooltip-font-size));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, 4px);
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-think__tip::before { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-think__check path {
  fill: none;
  stroke: #fff;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 9;
  stroke-dashoffset: 9;
  animation: ui-think-draw var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-base, var(--_tc-duration-base)) forwards;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__content {
  min-width: 0;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__label {
  position: relative;
  display: inline-block;
  max-width: 100%;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* The running step: gray with a darker band sweeping through */
:where([data-look="clean"], [data-look="clean"] *).ui-think__item[data-active] .ui-think__label {
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__item[data-kind="done"] .ui-think__label {
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
/* Sources: small white chips that pop in one after another */
:where([data-look="clean"], [data-look="clean"] *).ui-think__sources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding: 1px 0 2px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__source {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  height: 26px;
  padding: 0 8px 0 6px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-decoration: none;
  animation: ui-think-chip var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
a.ui-think__source:where([data-look="clean"], [data-look="clean"] *),
:where([data-look="clean"], [data-look="clean"] *).ui-think__more {
  position: relative;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
a.ui-think__source:where([data-look="clean"], [data-look="clean"] *):hover {
  background: var(--tc-fill-subtle, var(--_tc-fill-subtle));
}
/* "+3 more" – the quiet chip with an inner hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-think .ui-think__more {
  padding: 0 8px;
  background: none;
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think .ui-think__more:hover {
  background: var(--tc-fill-subtle, var(--_tc-fill-subtle));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think .ui-think__more[aria-expanded="true"] {
  background: var(--tc-fill-default, var(--_tc-fill-default));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
.ui-think__source:hover .ui-think__tip,
.ui-think__source:focus-visible .ui-think__tip {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, 0);
  transition-delay: var(--tc-duration-moderate, var(--_tc-duration-moderate));
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__source[data-count] {
  padding: 0 10px;
  background: none;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__source[data-count] {
  padding: 0 8px;
  background: none;
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
.ui-think__source-label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="standard"], [data-look="standard"] *).ui-think__favicon {
  display: grid;
  place-items: center;
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  overflow: hidden;
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__favicon {
  display: grid;
  place-items: center;
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  overflow: hidden;
  box-shadow: 0 0 0 0.5px var(--tc-border-strong, var(--_tc-border-strong));
}
:where([data-look="clean"], [data-look="clean"] *).ui-think__favicon svg {
  width: 100%;
  height: 100%;
}
/* Shimmer over the active label, like the loading states elsewhere */
.ui-think__shimmer {
  position: relative;
}
.ui-think__shimmer::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, var(--tc-thinking-state-shimmer) 50%, transparent 62%) 100% 0 / 300% 100%
    no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ui-think-sweep var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 3;
  pointer-events: none;
}
@keyframes ui-think-in {
  from { opacity: 0; transform: translateY(6px); filter: blur(3px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-think-line {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
@keyframes ui-think-chip {
  from { opacity: 0; transform: translateY(4px) scale(0.92); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-think-pulse {
  50% { transform: scale(0.7); opacity: 0.5; }
}
@keyframes ui-think-pulse-clean {
  50% { transform: scale(0.7); opacity: 0.45; }
}
@keyframes ui-think-pixel {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
@keyframes ui-think-settle {
  from { opacity: 0.2; transform: scale(0.6); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-think-pop {
  0% { transform: scale(0.5); }
  60% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
@keyframes ui-think-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes ui-think-sweep {
  from { background-position: 100% 0; }
  to { background-position: 0% 0; }
}
.ui-think__source[data-tip-off] .ui-think__tip { opacity: 0; pointer-events: none; }
/* Narrow (phones) */
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-think__head { padding: 0 10px 0 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-think__list { padding: 12px 14px 2px; }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-think__head { height: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-think__source { height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-think *,
  .ui-think *::before,
  .ui-think *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
  .ui-think__shimmer::after {
    display: none;
  }
  .ui-think__check path {
    stroke-dashoffset: 0;
  }
}
`;

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";

/*
 * Grid Background – a fine line grid behind your content, in a single self-contained file.
 * The grid drifts slowly by one cell per loop and fades out towards the edges through a radial mask.
 * On first view it can be uncovered by a circle that grows from the center.
 * The drift runs for `playFor` seconds (5 by default, WCAG 2.2.2) and then rests; it pauses while the grid is off
 * screen or its tab is hidden.
 * Reduced motion: the grid stays still and appears without the reveal.
 * Part of Trenchcoat. Imports: react only.
 */

export type GridDirection = "up" | "down" | "left" | "right" | "diagonal";

export type GridBackgroundOwnProps = {
  /** Content rendered above the grid */
  children?: ReactNode;
  /** Cell size in px */
  size?: number;
  /** Line color – defaults to a faint black, or a faint white in dark mode */
  color?: string;
  /** Seconds per cell; 0 keeps the grid still */
  speed?: number;
  /** Seconds the grid drifts before it rests; Infinity never stops – then give users a way to pause it (WCAG 2.2.2) */
  playFor?: number;
  /** Drift direction; "diagonal" runs from top right to bottom left */
  direction?: GridDirection;
  /** Uncover the grid with a growing circle when it first comes into view */
  reveal?: boolean;
  /** Radius of the edge fade, in % of the distance to the corners */
  fade?: number;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

/** Other DOM props go to the root */
export type GridBackgroundProps = Omit<ComponentPropsWithoutRef<"div">, keyof GridBackgroundOwnProps> & GridBackgroundOwnProps;

const offsets: Record<GridDirection, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  diagonal: [-1, 1],
};

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
 * Calls `onChange(active)` right away and whenever `el` comes into or leaves the viewport or its tab is hidden or shown.
 * Like Trenchcoat's useOnScreen, but it reports to a callback instead of React state, so pausing costs no render.
 */
function watchOnScreen(el: Element, onChange: (active: boolean) => void) {
  let inView = true;
  let last: boolean | undefined;
  // Reports the starting state once, then only real changes
  const update = () => {
    const next = inView && document.visibilityState !== "hidden";
    if (next !== last) onChange((last = next));
  };
  const io =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
          inView = entries[entries.length - 1].isIntersecting;
          update();
        })
      : null;
  io?.observe(el);
  document.addEventListener("visibilitychange", update);
  update();
  return () => {
    io?.disconnect();
    document.removeEventListener("visibilitychange", update);
  };
}

export function GridBackground({
  children,
  size = 48,
  color,
  speed = 3,
  playFor = 5,
  direction = "diagonal",
  reveal = true,
  fade = 70,
  className,
  style: styleProp,
  ref: refProp,
  ...rest
}: GridBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const setRoot = useRootRef(ref, refProp);
  const [shown, setShown] = useState(!reveal);

  // Reveal once the grid scrolls into view (right away with reduced motion or without IntersectionObserver)
  useEffect(() => {
    if (!reveal) return setShown(true);
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reveal]);

  // The drift is an endless CSS animation: hold it while nobody can see it (an attribute, so no render)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return watchOnScreen(el, (active) => el.toggleAttribute("data-paused", !active));
  }, []);

  const [dx, dy] = offsets[direction] ?? offsets.diagonal;
  const style = {
    "--tc-grid-background-size": `${size}px`,
    "--tc-grid-background-dx": `${dx * size}px`,
    "--tc-grid-background-dy": `${dy * size}px`,
    "--tc-grid-background-speed": `${Math.max(speed, 0)}s`,
    "--tc-grid-background-passes": Number.isFinite(playFor) && speed > 0 ? String(Math.max(playFor, 0) / speed) : "infinite",
    "--tc-grid-background-fade": `${fade}%`,
    ...(color ? { "--tc-grid-background-line": color } : {}),
    ...styleProp,
  } as CSSProperties;

  return (
    <div
      {...rest}
      ref={setRoot}
      className={["ui-gb", className].filter(Boolean).join(" ")}
      style={style}
      data-reveal={reveal ? "" : undefined}
      data-shown={shown ? "" : undefined}
      data-static={speed > 0 ? undefined : ""}
    >
      {/* React 19 hoists this into <head> once, no matter how many instances render */}
      <style href="ui-grid-background" precedence="default">
        {css}
      </style>
      <div className="ui-gb-grid" aria-hidden="true">
        <div className="ui-gb-reveal">
          <div className="ui-gb-lines" />
        </div>
      </div>
      <div className="ui-gb-content">{children}</div>
    </div>
  );
}

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

@property --tc-grid-background-r {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 0%;
}

.ui-gb {
  /* The reveal's length; --tc-grid-background-passes (drift loops before it rests) comes from playFor */
  --tc-grid-background-reveal: 1.6s;
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

/* Edge fade: a still radial mask, so the drifting lines dissolve towards the sides */
.ui-gb-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  -webkit-mask-image: radial-gradient(ellipse at center, #000 20%, transparent var(--tc-grid-background-fade));
  mask-image: radial-gradient(ellipse at center, #000 20%, transparent var(--tc-grid-background-fade));
}

/* Reveal: a circle from the center grows until it reaches the corners */
.ui-gb-reveal {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.ui-gb[data-reveal] .ui-gb-reveal {
  --tc-grid-background-r: 0%;
  -webkit-mask-image: radial-gradient(circle farthest-corner at center, #000 var(--tc-grid-background-r), transparent calc(var(--tc-grid-background-r) + 12%));
  mask-image: radial-gradient(circle farthest-corner at center, #000 var(--tc-grid-background-r), transparent calc(var(--tc-grid-background-r) + 12%));
}
.ui-gb[data-reveal][data-shown] .ui-gb-reveal {
  animation: ui-gb-reveal var(--tc-grid-background-reveal) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) forwards;
}

/* The lines: one cell larger on every side, so a shift by one cell loops seamlessly */
.ui-gb-lines {
  position: absolute;
  inset: calc(var(--tc-grid-background-size) * -1);
  background-image:
    linear-gradient(to right, var(--tc-grid-background-line, var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)))) 1px, transparent 1px),
    linear-gradient(to bottom, var(--tc-grid-background-line, var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)))) 1px, transparent 1px);
  background-size: var(--tc-grid-background-size) var(--tc-grid-background-size);
  animation: ui-gb-drift var(--tc-grid-background-speed) linear var(--tc-grid-background-passes, infinite) forwards;
}
.ui-gb[data-static] .ui-gb-lines {
  animation: none;
}
.ui-gb[data-paused] .ui-gb-lines,
.ui-gb[data-paused] .ui-gb-reveal {
  animation-play-state: paused;
}

.ui-gb-content {
  position: relative;
  z-index: 1;
  height: 100%;
}

@keyframes ui-gb-drift {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(var(--tc-grid-background-dx), var(--tc-grid-background-dy), 0); }
}
@keyframes ui-gb-reveal {
  from { --tc-grid-background-r: 0%; }
  to { --tc-grid-background-r: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-gb-lines { animation: none; }
  .ui-gb[data-reveal] .ui-gb-reveal { -webkit-mask-image: none; mask-image: none; animation: none; }
}

`;

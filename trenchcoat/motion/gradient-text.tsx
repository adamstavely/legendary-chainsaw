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
 * Gradient Text – a text effect, in a single self-contained file.
 * The letters are a mask over a liquid gradient: a few soft color blobs drift over a two-color base,
 * so the word keeps flowing while the glyphs stay crisp. On first view the color can sweep across
 * the word from left to right before it settles into the flow. Font, size and weight come from the parent.
 * The flow runs for `playFor` seconds (5 by default, WCAG 2.2.2) and comes to rest; it pauses while the text is off
 * screen or its tab is hidden; reduced motion shows the finished gradient. The default colours keep 3:1 for large
 * display text – for body-size text pass colours with 4.5:1 against your background (light-dark() works).
 * Part of Trenchcoat. Imports: react only.
 */

export type GradientTextOwnProps = {
  children: ReactNode;
  /** Gradient start, end and up to two blob colors: [start, end, blob, blob] */
  colors?: string[];
  /** Seconds per flow cycle */
  speed?: number;
  /** Seconds the flow runs before it rests (on the nearest quarter cycle below); Infinity never stops – then give
   * users a way to pause it (WCAG 2.2.2) */
  playFor?: number;
  /** Sweep the color in from left to right when the text scrolls into view */
  sweep?: boolean;
  /** Element to render */
  as?: "span" | "h1" | "h2" | "p";
  className?: string;
  /** The root element */
  ref?: Ref<HTMLElement>;
};

/** Other DOM props go to the root */
export type GradientTextProps = Omit<ComponentPropsWithoutRef<"span">, keyof GradientTextOwnProps> & GradientTextOwnProps;

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

export function GradientText({
  children,
  colors,
  speed = 8,
  playFor = 5,
  sweep = true,
  as: Tag = "span",
  className,
  style: styleProp,
  ref: refProp,
  ...rest
}: GradientTextProps) {
  const ref = useRef<HTMLElement>(null);
  const setRoot = useRootRef(ref, refProp);
  // "idle" – plain text, waiting to be seen; "in" – the color sweeps (or simply is) in
  const [state, setState] = useState<"idle" | "in">(sweep ? "idle" : "in");

  useEffect(() => {
    if (!sweep) return setState("in");
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setState("in");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("in");
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sweep]);

  // The flow is an endless CSS animation: hold it while nobody can see it (an attribute, so no render)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return watchOnScreen(el, (active) => el.toggleAttribute("data-paused", !active));
  }, []);

  // Whole quarter cycles: every keyframe of the flow is a resting point, so it never stops mid-move
  const passes = Number.isFinite(playFor) ? String(Math.max(0.25, Math.floor((Math.max(playFor, 0) / Math.max(speed, 0.1)) * 4) / 4)) : "infinite";
  const style = { "--tc-gradient-text-speed": `${speed}s`, "--tc-gradient-text-passes": passes } as Record<string, string>;
  if (colors?.length) {
    const [a, b = a, c = a, d = b] = colors;
    Object.assign(style, { "--tc-gradient-text-c1": a, "--tc-gradient-text-c2": b, "--tc-gradient-text-c3": c, "--tc-gradient-text-c4": d });
  }

  return (
    <Tag
      {...rest}
      ref={setRoot as never}
      className={["ui-gt", className].filter(Boolean).join(" ")}
      data-state={state}
      data-sweep={sweep ? "" : undefined}
      style={{ ...style, ...styleProp } as CSSProperties}
    >
      {/* React 19 hoists this into <head> once, no matter how many instances render */}
      <style href="ui-gradient-text" precedence="default">
        {css}
      </style>
      {/* The real text: sets the size, carries selection and screen readers, shows until the color arrives */}
      <span className="ui-gt__base">{children}</span>
      {/* The same text again, filled with the flowing gradient */}
      <span className="ui-gt__fill" aria-hidden="true">
        {children}
      </span>
    </Tag>
  );
}

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

.ui-gt {
  --tc-gradient-text-c1: light-dark(#dd0674, #f472b6);
  --tc-gradient-text-c2: light-dark(#5e3ee0, #a78bfa);
  --tc-gradient-text-c3: light-dark(#ec4899, #f9a8d4);
  --tc-gradient-text-c4: light-dark(#7c5cff, #c4b5fd);
  --tc-gradient-text-sweep: 1100ms;
  position: relative;
  display: inline-block;
  margin: 0;
  font: inherit;
  letter-spacing: inherit;
}
.ui-gt__base {
  color: inherit;
  transition: color var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease);
}
.ui-gt__fill {
  position: absolute;
  inset: 0;
  pointer-events: none;
  user-select: none;
  color: transparent;
  -webkit-text-fill-color: transparent;
  background-image:
    radial-gradient(closest-side, var(--tc-gradient-text-c3), transparent),
    radial-gradient(closest-side, var(--tc-gradient-text-c4), transparent),
    radial-gradient(closest-side, var(--tc-gradient-text-c1), transparent),
    linear-gradient(100deg, var(--tc-gradient-text-c1) 10%, var(--tc-gradient-text-c2) 90%);
  background-size: 70% 170%, 80% 190%, 60% 160%, 100% 100%;
  background-repeat: no-repeat;
  background-position: -20% 30%, 120% 70%, 50% -40%, 0 0;
  -webkit-background-clip: text;
  background-clip: text;
  /* A little room around the box, so overhanging glyphs are not cut by the sweep */
  clip-path: inset(-0.25em -0.25em -0.25em -0.25em);
  animation: ui-gt-flow var(--tc-gradient-text-speed) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) var(--tc-gradient-text-passes, infinite) forwards;
}

/* Sweep: the fill is hidden until the text is seen, then wipes in from the left */
.ui-gt[data-sweep][data-state="idle"] .ui-gt__fill {
  clip-path: inset(-0.25em 100% -0.25em -0.25em);
}
.ui-gt[data-sweep] .ui-gt__fill {
  transition: clip-path var(--tc-gradient-text-sweep) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1));
}
.ui-gt[data-state="in"] .ui-gt__base {
  color: transparent;
}
.ui-gt[data-sweep][data-state="in"] .ui-gt__base {
  transition-delay: calc(var(--tc-gradient-text-sweep) - var(--tc-duration-base, 200ms));
}

.ui-gt[data-paused] .ui-gt__fill { animation-play-state: paused; }

/* The blobs drift on their own paths; the base gradient stays put */
@keyframes ui-gt-flow {
  0%, 100% { background-position: -20% 30%, 120% 70%, 50% -40%, 0 0; }
  25% { background-position: 40% 110%, 60% -10%, 110% 60%, 0 0; }
  50% { background-position: 120% 40%, -20% 40%, 40% 140%, 0 0; }
  75% { background-position: 60% -30%, 30% 120%, -10% 30%, 0 0; }
}

/* Reduced motion: the finished gradient, standing still */
@media (prefers-reduced-motion: reduce) {
  .ui-gt .ui-gt__fill,
  .ui-gt[data-sweep][data-state="idle"] .ui-gt__fill {
    animation: none;
    transition: none;
    clip-path: inset(-0.25em -0.25em -0.25em -0.25em);
  }
  .ui-gt .ui-gt__base,
  .ui-gt[data-sweep] .ui-gt__base {
    color: transparent;
    transition: none;
  }
}
`;

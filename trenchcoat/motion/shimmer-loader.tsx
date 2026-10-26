"use client";

import { useCallback, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode, type Ref } from "react";

/*
 * Shimmer Loader – loading states with a soft light sweep, in a single self-contained file.
 * Skeleton draws placeholder blocks with a band of light that moves across them; every skeleton starts together
 * and runs on the same beat. ShimmerText runs a brighter band through the letters of a label, like an AI
 * "Thinking…" state – the label itself stays readable the whole time. The styles are injected below.
 * The bands move on transform only (composited, no repaint per frame), run a few passes and then rest (WCAG 2.2.2;
 * set --tc-shimmer-loader-passes to change that, e.g. `infinite` when you offer your own pause), and hold while the
 * element is off screen. Reduced motion (live, via the media query) shows plain blocks and plain text.
 * Part of Trenchcoat. Imports: react only.
 */

export type SkeletonOwnProps = {
  /** Width – a number is px, a string any CSS length; defaults to 100% */
  width?: number | string;
  /** Height – a number is px, a string any CSS length; defaults to 12px */
  height?: number | string;
  /** Corner radius; defaults to 6px */
  radius?: number | string;
  /** Round shape, e.g. for avatars – uses width for both sides */
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
  /** The placeholder element */
  ref?: Ref<HTMLSpanElement>;
};

/** Other DOM props go to the placeholder; it is aria-hidden unless you pass aria-hidden yourself */
export type SkeletonProps = Omit<ComponentPropsWithoutRef<"span">, keyof SkeletonOwnProps> & SkeletonOwnProps;

export type ShimmerTextOwnProps = {
  children: ReactNode;
  /** Seconds for one pass of the highlight */
  duration?: number;
  className?: string;
  /** The text element */
  ref?: Ref<HTMLSpanElement>;
};

/** Other DOM props go to the text element */
export type ShimmerTextProps = Omit<ComponentPropsWithoutRef<"span">, keyof ShimmerTextOwnProps> & ShimmerTextOwnProps;

const len = (v: number | string | undefined) => (typeof v === "number" ? `${v}px` : v);

const Style = () => (
  <style href="ui-shimmer-loader" precedence="default">
    {css}
  </style>
);

/* One observer for every shimmer on the page: off screen, an element gets data-off and its sweep holds */
let observer: IntersectionObserver | null = null;
function watch(el: Element) {
  if (typeof IntersectionObserver !== "function") return () => {};
  observer ??= new IntersectionObserver((entries) => {
    for (const e of entries) e.target.toggleAttribute("data-off", !e.isIntersecting);
  });
  observer.observe(el);
  return () => observer?.unobserve(el);
}

/** A ref callback that watches the element and forwards it to the caller's `ref` (React 19 ref cleanups included) */
function useWatchedRef<T extends Element>(ref: Ref<T> | undefined) {
  return useCallback(
    (el: T | null) => {
      if (!el) return;
      const stop = watch(el);
      const cleanup = typeof ref === "function" ? ref(el) : (ref && (ref.current = el), undefined);
      return () => {
        stop();
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [ref],
  );
}

export function Skeleton({ width, height, radius, circle, className, style, ref, ...rest }: SkeletonProps) {
  const setRef = useWatchedRef(ref);
  const w = len(width);
  return (
    <>
      <Style />
      <span
        aria-hidden="true"
        {...rest}
        ref={setRef}
        className={["ui-shm", className].filter(Boolean).join(" ")}
        style={{
          width: w,
          height: circle ? (w ?? len(height)) : len(height),
          borderRadius: circle ? "50%" : len(radius),
          ...style,
        }}
      />
    </>
  );
}

export function ShimmerText({ children, duration = 1.6, className, style, ref, ...rest }: ShimmerTextProps) {
  const setRef = useWatchedRef(ref);
  return (
    <>
      <Style />
      <span
        {...rest}
        ref={setRef}
        className={["ui-shm-text", className].filter(Boolean).join(" ")}
        style={{ "--tc-shimmer-loader-text-dur": `${duration}s`, ...style } as CSSProperties}
      >
        {children}
        {/* The band: a window that slides across, showing a brighter copy of the label that stays in place */}
        <span className="ui-shm-text__clip" aria-hidden="true">
          <span className="ui-shm-text__band">
            <span className="ui-shm-text__copy">{children}</span>
          </span>
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

.ui-shm,
.ui-shm-text {
  /* Opaque placeholder blocks, so they read on any card; a soft band of light sweeps over them */
  --tc-shimmer-loader-base: light-dark(#ececec, #2f2f33);
  --tc-shimmer-loader-glow: var(--tc-shimmer, light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.28)));
  /* The band in the label: the strong text colour, so the label never drops below 4.5:1 */
  --tc-shimmer-loader-text-glow: var(--tc-text-strong, light-dark(#171717, #f5f5f5));
  --tc-shimmer-loader-dur: var(--tc-duration-shimmer, 1600ms);
  /* Passes before the sweep rests (2.2.2: a few seconds); \`infinite\` only with a pause of your own */
  --tc-shimmer-loader-passes: 3;
}

/* Skeleton: the band is a pseudo-element moved on transform, clipped by the block */
.ui-shm {
  position: relative;
  display: block;
  flex: none;
  width: 100%;
  height: 12px;
  max-width: 100%;
  overflow: hidden;
  border-radius: var(--tc-radius-sm, 6px);
  background-color: var(--tc-shimmer-loader-base);
}
.ui-shm::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 20%, var(--tc-shimmer-loader-glow) 50%, transparent 80%);
  transform: translateX(-100%);
  animation: ui-shm-sweep var(--tc-shimmer-loader-dur) linear var(--tc-shimmer-loader-passes) both;
}
@keyframes ui-shm-sweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

/* Text: the label in a readable muted colour; the band window (40% wide) slides right while the copy inside it
   slides left by the same distance, so the brighter letters line up with the real ones */
.ui-shm-text {
  position: relative;
  display: inline-block;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-shm-text__clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.ui-shm-text__band {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 40%;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 50%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 50%, transparent);
  transform: translateX(-100%);
  animation: ui-shm-band var(--tc-shimmer-loader-text-dur, 1.6s) linear var(--tc-shimmer-loader-passes) both;
}
.ui-shm-text__copy {
  position: absolute;
  top: 0;
  left: 0;
  width: 250%;
  color: var(--tc-shimmer-loader-text-glow);
  -webkit-text-fill-color: currentColor;
  transform: translateX(40%);
  animation: ui-shm-copy var(--tc-shimmer-loader-text-dur, 1.6s) linear var(--tc-shimmer-loader-passes) both;
}
@keyframes ui-shm-band {
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
}
@keyframes ui-shm-copy {
  from { transform: translateX(40%); }
  to { transform: translateX(-100%); }
}

/* Off screen: hold the sweep */
.ui-shm[data-off]::after,
.ui-shm-text[data-off] .ui-shm-text__band,
.ui-shm-text[data-off] .ui-shm-text__copy {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .ui-shm::after,
  .ui-shm-text__clip { display: none; }
}
`;

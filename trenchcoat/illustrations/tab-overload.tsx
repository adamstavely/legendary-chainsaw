"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type Ref, type RefObject } from "react";

/*
 * Tab Overload – a small card illustration, in a single self-contained file.
 * Three overlapping browser windows; the front one is active with colored dots, an outline and a glow.
 * Hover a window behind it and the highlight moves over to that one.
 * The artwork is drawn on a 360 × 240 viewBox and fades out towards the right and bottom edge.
 * The shimmer runs a few cycles, pauses while it's off screen and stays still with reduced motion.
 * Colours follow the page theme (.dark, data-theme / data-tc-theme or the OS setting) through light-dark().
 * Decorative by default (hidden from assistive tech); pass `label` to describe it as an image.
 */

export type TabOverloadProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** Describes the scene to assistive tech (role="img"); without it the illustration is decorative and hidden from them */
  label?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

/** Offsets of the three windows (top-left corner of each frame) */
const windows = [
  { n: 1, x: 30, y: 68 },
  { n: 2, x: 125, y: 56 },
  { n: 3, x: 220, y: 44 },
] as const;

/** A described image when there's a label, otherwise decoration that assistive tech skips */
const a11y = (label?: string) => (label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const });

export function TabOverload({ className, label, ref, ...rest }: TabOverloadProps) {
  const id = "ui-to" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const own = useRef<HTMLDivElement>(null);
  const rootRef = useRootRef(own, ref);
  const onScreen = useOnScreen(own);

  return (
    <div
      {...a11y(label)}
      {...rest}
      ref={rootRef}
      className={["ui-to", className].filter(Boolean).join(" ")}
      data-paused={onScreen ? undefined : ""}
    >
      {/* React 19 hoists this into <head> once, no matter how many instances render */}
      <style href="ui-tab-overload" precedence="default">
        {css}
      </style>
      <svg className="ui-to-art" viewBox="0 0 360 240" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-blob-h`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFB89E" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#C8A8E5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#A8B5FF" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`${id}-blob-v`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF6B5C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFB89E" stopOpacity="0.3" />
          </linearGradient>
          <filter id={`${id}-blur`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <linearGradient id={`${id}-stroke`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B5C0FF" />
            <stop offset="40%" stopColor="#D5BBEF" />
            <stop offset="75%" stopColor="#FFC5AB" />
            <stop offset="100%" stopColor="#FFB5BC" />
          </linearGradient>
        </defs>

        {/* Each window: glow → frame → content; the next window covers any overflow */}
        {windows.map(({ n, x, y }) => (
          <g key={n}>
            <g className={`ui-to-blobs ui-to-blobs-${n}`}>
              <ellipse
                cx={x + 70}
                cy={y + 8}
                rx="90"
                ry="14"
                fill={`url(#${id}-blob-h)`}
                filter={`url(#${id}-blur)`}
              />
              <ellipse
                cx={x + 8}
                cy={y + 96}
                rx="14"
                ry="90"
                fill={`url(#${id}-blob-v)`}
                filter={`url(#${id}-blur)`}
              />
            </g>
            <g className={`ui-to-tab ui-to-tab-${n}`} transform={`translate(${x} ${y})`}>
              {/* Outer gray frame, reaching well past the edges */}
              <rect className="ui-to-frame" width="380" height="300" rx="6" strokeWidth="0.7" />
              <circle className="ui-to-dot" cx="14" cy="14" r="3" />
              <circle className="ui-to-dot" cx="24" cy="14" r="3" />
              <circle className="ui-to-dot" cx="34" cy="14" r="3" />
              <rect className="ui-to-page" x="4" y="24" width="372" height="272" rx="5" strokeWidth="0.7" />
            </g>
            <g className={`ui-to-content ui-to-content-${n}`} transform={`translate(${x} ${y})`}>
              <rect className="ui-to-bar" x="12" y="36" width="30" height="30" rx="4" />
              <rect className="ui-to-bar" x="52" y="38" width="100" height="6" rx="2" />
              <rect className="ui-to-bar" x="52" y="46" width="100" height="6" rx="2" />
              <rect className="ui-to-bar" x="52" y="54" width="35" height="6" rx="2" />
              <rect className="ui-to-bar" x="12" y="72" width="140" height="6" rx="2" />
              <rect className="ui-to-bar" x="12" y="80" width="140" height="6" rx="2" />
              <rect className="ui-to-bar" x="12" y="88" width="55" height="6" rx="2" />
            </g>
          </g>
        ))}

        {/* Active-window decoration (colored dots + outline), shown on one window at a time */}
        {windows.map(({ n, x, y }) => (
          <g key={n} className={`ui-to-front ui-to-front-${n}`}>
            <circle cx={x + 14} cy={y + 14} r="3" fill="#FF6B5C" />
            <circle cx={x + 24} cy={y + 14} r="3" fill="#FFB89E" />
            <circle cx={x + 34} cy={y + 14} r="3" fill="#A8B5FF" />
            <path
              d={`M ${x} 240 L ${x} ${y + 6} A 6 6 0 0 1 ${x + 6} ${y} L ${n === 3 ? 360 : x + 95} ${y}`}
              fill="none"
              stroke={`url(#${id}-stroke)`}
              strokeWidth="0.8"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ---------- Hooks (copied from Trenchcoat's src/internal, so this file stays self-contained) ---------- */

/** A ref callback that fills `own` and the caller's ref (object or callback, incl. React 19 cleanups) */
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

/** True while `ref`'s element intersects the viewport and the tab is visible. Starts true; renders only on a change */
function useOnScreen(ref: RefObject<Element | null>) {
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    let inView = true;
    let last = true;
    // Only a real change is set: the observer's first report (visible) costs no render
    const update = () => {
      const next = inView && document.visibilityState !== "hidden";
      if (next !== last) setOnScreen((last = next));
    };
    const io =
      el && typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries) => {
            inView = entries[entries.length - 1].isIntersecting;
            update();
          })
        : null;
    if (el) io?.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [ref]);
  return onScreen;
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the colours below use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

.ui-to {
  --tc-tab-overload-frame: light-dark(#f4f5f7, #1b1b1d);
  --tc-tab-overload-frame-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.1));
  --tc-tab-overload-dot: light-dark(#cccccc, #3a3a3f);
  --tc-tab-overload-page: light-dark(#ffffff, #232326);
  --tc-tab-overload-page-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.08));
  --tc-tab-overload-bar: light-dark(#eff1f4, #2e2e32);
  --tc-tab-overload-bar-peak: light-dark(#dde1e5, #3a3a3f);
  /* One shimmer cycle; it runs a few times and then rests */
  --tc-tab-overload-shimmer: 2.4s;
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  /* Fade out towards the right and bottom edge */
  -webkit-mask-image:
    linear-gradient(to right, #000 70%, transparent 100%),
    linear-gradient(to bottom, #000 70%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(to right, #000 70%, transparent 100%),
    linear-gradient(to bottom, #000 70%, transparent 100%);
  mask-composite: intersect;
}
.ui-to-art {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
.ui-to-frame { fill: var(--tc-tab-overload-frame); stroke: var(--tc-tab-overload-frame-edge); }
.ui-to-dot { fill: var(--tc-tab-overload-dot); }
.ui-to-page { fill: var(--tc-tab-overload-page); stroke: var(--tc-tab-overload-page-edge); }

/* Placeholder blocks shimmer softly for a few cycles – and hold still while the card is off screen */
.ui-to-bar {
  fill: var(--tc-tab-overload-bar);
  animation: ui-to-shimmer var(--tc-tab-overload-shimmer) var(--tc-ease-standard, ease) 3;
}
.ui-to[data-paused] .ui-to-bar { animation-play-state: paused; }
@keyframes ui-to-shimmer {
  0%, 100% { fill: var(--tc-tab-overload-bar); }
  50% { fill: var(--tc-tab-overload-bar-peak); }
}

/* The highlight follows the hovered window; the front window is active by default */
.ui-to-blobs,
.ui-to-front {
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-to-content {
  opacity: 0.2;
  pointer-events: none;
  transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-to-blobs-3,
.ui-to-front-3,
.ui-to-content-3 { opacity: 1; }

.ui-to-art:has(.ui-to-tab-1:hover) .ui-to-blobs-1,
.ui-to-art:has(.ui-to-tab-1:hover) .ui-to-front-1,
.ui-to-art:has(.ui-to-tab-1:hover) .ui-to-content-1,
.ui-to-art:has(.ui-to-tab-2:hover) .ui-to-blobs-2,
.ui-to-art:has(.ui-to-tab-2:hover) .ui-to-front-2,
.ui-to-art:has(.ui-to-tab-2:hover) .ui-to-content-2 { opacity: 1; }

.ui-to-art:has(.ui-to-tab-1:hover, .ui-to-tab-2:hover) .ui-to-blobs-3,
.ui-to-art:has(.ui-to-tab-1:hover, .ui-to-tab-2:hover) .ui-to-front-3 { opacity: 0; }
.ui-to-art:has(.ui-to-tab-1:hover, .ui-to-tab-2:hover) .ui-to-content-3 { opacity: 0.2; }

@media (prefers-reduced-motion: reduce) {
  .ui-to-bar { animation: none; }
  .ui-to-blobs, .ui-to-front, .ui-to-content { transition: none; }
}
`;

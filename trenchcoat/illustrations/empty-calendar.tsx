"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type Ref, type RefObject } from "react";

/*
 * Empty Calendar – a small card illustration, in a single self-contained file.
 * Three stacked calendar cards with an "Empty" badge and a disabled "Join meeting" button.
 * Hover the front card to lift it, hover a back card to slide it further out.
 * The artwork is drawn on a 320 × 240 viewBox inside a 3 : 2 frame.
 * Decorative by default (aria-hidden); pass `label` to have it announced as an image. The shimmer and the glow run
 * a few cycles and then rest, hold still off screen and stay still with reduced motion.
 * Colours follow the page theme (a dark class, data-theme / data-tc-theme or the OS setting) through light-dark().
 */

type EmptyCalendarOwnProps = {
  className?: string;
  /** Accessible description – when set, the scene is announced as an image; otherwise it is decorative */
  label?: string;
  ref?: Ref<HTMLDivElement>;
};

export type EmptyCalendarProps = Omit<ComponentPropsWithoutRef<"div">, keyof EmptyCalendarOwnProps | "children"> & EmptyCalendarOwnProps;

export function EmptyCalendar({ className, label, ref, ...rest }: EmptyCalendarProps) {
  const id = "ui-ec" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const root = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(root, ref);
  const onScreen = useOnScreen(root);

  return (
    <div
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...rest}
      ref={setRoot}
      className={["ui-ec", className].filter(Boolean).join(" ")}
      data-paused={!onScreen || undefined}
    >
      {/* React 19 hoists this into <head> once, no matter how many instances render */}
      <style href="ui-empty-calendar" precedence="default">
        {css}
      </style>
      <svg className="ui-ec-art" viewBox="0 0 320 240" aria-hidden="true">
        <defs>
          <filter id={`${id}-blur`} x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow className="ui-ec-drop" dx="0" dy="3" stdDeviation="4" />
          </filter>
          <linearGradient id={`${id}-blob`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFA0AB" stopOpacity="0.25" />
            <stop offset="33%" stopColor="#FFB89E" stopOpacity="0.25" />
            <stop offset="66%" stopColor="#C8A8E5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#A8B5FF" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id={`${id}-stroke`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop className="ui-ec-edge" offset="0%" />
            <stop offset="18%" stopColor="#FFB5BC" />
            <stop offset="40%" stopColor="#FFC5AB" />
            <stop offset="60%" stopColor="#D5BBEF" />
            <stop offset="82%" stopColor="#B5C0FF" />
            <stop className="ui-ec-edge" offset="100%" />
          </linearGradient>
        </defs>

        <g transform="translate(30 47) scale(0.814)">
          {/* Back cards – hover to slide them out further */}
          <g className="ui-ec-back ui-ec-back-left">
            <CalendarCard shadow={`url(#${id}-shadow)`} />
          </g>
          <g className="ui-ec-back ui-ec-back-right">
            <CalendarCard shadow={`url(#${id}-shadow)`} />
          </g>

          {/* Front card with a soft colored glow underneath */}
          <g className="ui-ec-front">
            <ellipse
              className="ui-ec-blob"
              cx="160"
              cy="152"
              rx="125"
              ry="35"
              fill={`url(#${id}-blob)`}
              filter={`url(#${id}-blur)`}
            />
            <CalendarCard shadow={`url(#${id}-shadow)`} />
            {/* Colored bottom edge, matching the glow */}
            <path
              d="M40 150 A 10 10 0 0 0 50 160 L270 160 A 10 10 0 0 0 280 150"
              fill="none"
              stroke={`url(#${id}-stroke)`}
              strokeWidth="0.5"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

/** One calendar card: title, "Empty" badge, placeholder lines and a disabled button */
function CalendarCard({ shadow }: { shadow: string }) {
  return (
    <>
      <rect className="ui-ec-card" x="40" y="20" width="240" height="140" rx="10" strokeWidth="0.5" filter={shadow} />
      <text className="ui-ec-title" x="56" y="48" fontSize="13" fontWeight="500">
        Calendar
      </text>
      <g transform="translate(218 34)">
        <rect className="ui-ec-badge" width="46" height="18" rx="5" />
        <text x="23" y="12" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="0.06em" fill="#FAB082">
          EMPTY
        </text>
      </g>
      <rect className="ui-ec-bar" x="56" y="64" width="208" height="7" rx="2" />
      <rect className="ui-ec-bar" x="56" y="74" width="208" height="7" rx="2" />
      <rect className="ui-ec-bar" x="56" y="84" width="168" height="7" rx="2" />
      <g transform="translate(56 104)">
        <rect className="ui-ec-btn" width="208" height="40" rx="8" strokeWidth="0.5" />
        {/* "Not available" icon + label, centered together */}
        <g
          className="ui-ec-btn-ink"
          transform="translate(64 14)"
          fill="none"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="6" r="5" />
          <line x1="2.5" y1="9.5" x2="9.5" y2="2.5" />
        </g>
        <text className="ui-ec-btn-label" x="84" y="24" fontSize="10" fontWeight="500">
          Join meeting
        </text>
      </g>
    </>
  );
}

/* ---------- Helpers (copied from Trenchcoat's src/internal, so this file stays self-contained) ---------- */

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
/* Theme: every colour is light-dark(), which follows color-scheme – so dark works through .dark,
   data-theme / data-tc-theme and the OS setting alike */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

.ui-ec {
  --tc-empty-calendar-card: light-dark(#ffffff, #232326);
  --tc-empty-calendar-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.08));
  --tc-empty-calendar-drop: light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4));
  --tc-empty-calendar-title: light-dark(#8a8a8a, #8f8f8f);
  --tc-empty-calendar-badge: light-dark(#fef8ef, rgba(250, 176, 130, 0.16));
  --tc-empty-calendar-bar: light-dark(#eff1f4, #2a2a2d);
  --tc-empty-calendar-bar-peak: light-dark(#dde1e5, #36363b);
  --tc-empty-calendar-btn: light-dark(#f4f4f6, #2a2a2d);
  --tc-empty-calendar-btn-ink: light-dark(#9a9aa3, #6b6b70);
  /* One shimmer / glow cycle; each runs a few times and then rests */
  --tc-empty-calendar-shimmer: 2.4s;
  --tc-empty-calendar-breathe: 5s;
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
}
.ui-ec-art {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/* Card parts */
.ui-ec-card { fill: var(--tc-empty-calendar-card); stroke: var(--tc-empty-calendar-edge); }
.ui-ec-drop { flood-color: var(--tc-empty-calendar-drop); }
.ui-ec-edge { stop-color: light-dark(#e4e7ec, #3a3a3f); }
.ui-ec-title { fill: var(--tc-empty-calendar-title); }
.ui-ec-badge { fill: var(--tc-empty-calendar-badge); }
.ui-ec-btn { fill: var(--tc-empty-calendar-btn); stroke: var(--tc-empty-calendar-edge); }
.ui-ec-btn-ink { stroke: var(--tc-empty-calendar-btn-ink); }
.ui-ec-btn-label { fill: var(--tc-empty-calendar-btn-ink); }

/* Placeholder lines shimmer softly for a few cycles */
.ui-ec-bar {
  fill: var(--tc-empty-calendar-bar);
  animation: ui-ec-shimmer var(--tc-empty-calendar-shimmer) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) 3;
}
@keyframes ui-ec-shimmer {
  0%, 100% { fill: var(--tc-empty-calendar-bar); }
  50% { fill: var(--tc-empty-calendar-bar-peak); }
}

/* The glow under the front card breathes for a few cycles */
.ui-ec-blob {
  transform-origin: 160px 152px;
  animation: ui-ec-breathe var(--tc-empty-calendar-breathe) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) 3 both;
}
@keyframes ui-ec-breathe {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.06); }
}

/* Front card: lifts and tilts on hover */
.ui-ec-front {
  transform-origin: 160px 90px;
  transition: transform var(--tc-duration-slow, 320ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-ec-front:hover { transform: translate(0, -8px) rotate(2deg); }

/* Back cards: fanned out, slide further on hover */
.ui-ec-back {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform var(--tc-duration-slow, 320ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-ec-back-left { transform: translate(-22px, 0) rotate(-3deg); }
.ui-ec-back-left:hover { transform: translate(-48px, 4px) rotate(-7deg); }
.ui-ec-back-right { transform: translate(22px, 0) rotate(3deg); }
.ui-ec-back-right:hover { transform: translate(48px, 4px) rotate(7deg); }

/* Off screen or in a hidden tab: the loops hold still */
.ui-ec[data-paused] :is(.ui-ec-bar, .ui-ec-blob) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-ec-bar, .ui-ec-blob { animation: none; }
  .ui-ec-front, .ui-ec-back { transition: none; }
}
`;

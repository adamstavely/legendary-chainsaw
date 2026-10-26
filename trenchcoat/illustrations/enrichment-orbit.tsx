"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type Ref, type RefObject } from "react";

/*
 * Enrichment Orbit – a small card illustration, in a single self-contained file.
 * A Grok tile inside two rings; colored comets run around the rings in opposite directions
 * and three small data nodes orbit the outer ring, staying upright as they travel.
 * The artwork is drawn on a 320 × 240 viewBox inside a 3 : 2 frame.
 * Decorative by default (aria-hidden); pass `label` to have it announced as an image. The comets and nodes make
 * a few rounds and then rest, hold still off screen and stay still with reduced motion.
 * Colours follow the page theme (a dark class, data-theme / data-tc-theme or the OS setting) through light-dark().
 */

type EnrichmentOrbitOwnProps = {
  className?: string;
  /** Accessible description – when set, the scene is announced as an image; otherwise it is decorative */
  label?: string;
  ref?: Ref<HTMLDivElement>;
};

export type EnrichmentOrbitProps = Omit<ComponentPropsWithoutRef<"div">, keyof EnrichmentOrbitOwnProps | "children"> & EnrichmentOrbitOwnProps;

/** Start offsets of the three orbiting nodes on the 22 s orbit (120° apart), in seconds */
const ORBIT = 22;
const nodeOffsets = [0, 7.33, 14.66];

export function EnrichmentOrbit({ className, label, ref, ...rest }: EnrichmentOrbitProps) {
  const id = "ui-eo" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const root = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(root, ref);
  const onScreen = useOnScreen(root);

  return (
    <div
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...rest}
      ref={setRoot}
      className={["ui-eo", className].filter(Boolean).join(" ")}
      data-paused={!onScreen || undefined}
    >
      {/* React 19 hoists this into <head> once, no matter how many instances render */}
      <style href="ui-enrichment-orbit" precedence="default">
        {css}
      </style>
      <svg className="ui-eo-art" viewBox="0 0 320 240" aria-hidden="true">
        <defs>
          {/* Drop shadow plus a thin light-gray inner edge at the bottom */}
          <filter id={`${id}-tile`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="dropBlur" />
            <feOffset in="dropBlur" dx="0" dy="3" result="dropOffset" />
            <feFlood className="ui-eo-drop" result="dropColor" />
            <feComposite in="dropColor" in2="dropOffset" operator="in" result="dropShadow" />
            <feOffset in="SourceAlpha" dx="0" dy="-4" result="alphaUp" />
            <feComposite in="SourceAlpha" in2="alphaUp" operator="out" result="sliver" />
            <feFlood className="ui-eo-sliver" result="innerColor" />
            <feComposite in="innerColor" in2="sliver" operator="in" result="innerShadow" />
            <feMerge>
              <feMergeNode in="dropShadow" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="innerShadow" />
            </feMerge>
          </filter>
          <filter id={`${id}-node`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="dropBlur" />
            <feOffset in="dropBlur" dx="0" dy="2" result="dropOffset" />
            <feFlood className="ui-eo-drop ui-eo-drop--node" result="dropColor" />
            <feComposite in="dropColor" in2="dropOffset" operator="in" result="dropShadow" />
            <feOffset in="SourceAlpha" dx="0" dy="-3" result="alphaUp" />
            <feComposite in="SourceAlpha" in2="alphaUp" operator="out" result="sliver" />
            <feFlood className="ui-eo-sliver" result="innerColor" />
            <feComposite in="innerColor" in2="sliver" operator="in" result="innerShadow" />
            <feMerge>
              <feMergeNode in="dropShadow" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="innerShadow" />
            </feMerge>
          </filter>
          {/* Comet gradient, fading out at both ends */}
          <linearGradient id={`${id}-comet`}>
            <stop offset="0%" stopColor="#FF6B5C" stopOpacity="0" />
            <stop offset="22%" stopColor="#FFB89E" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#C8A8E5" stopOpacity="0.9" />
            <stop offset="78%" stopColor="#A8B5FF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#A8B5FF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Two concentric rings */}
        <g className="ui-eo-rings" fill="none" strokeWidth="1.2">
          <circle cx="160" cy="120" r="56" strokeOpacity="0.45" />
          <circle cx="160" cy="120" r="80" />
        </g>

        {/* Comets running around each ring in opposite directions */}
        <g className="ui-eo-spin">
          <path
            fill="none"
            stroke={`url(#${id}-comet)`}
            strokeWidth="1.6"
            strokeLinecap="round"
            d="M114.1 54.5 A80 80 0 0 1 205.9 54.5"
          />
        </g>
        <g className="ui-eo-spin ui-eo-reverse">
          <path
            fill="none"
            stroke={`url(#${id}-comet)`}
            strokeWidth="1.6"
            strokeLinecap="round"
            d="M120.4 80.4 A56 56 0 0 1 199.6 80.4"
          />
        </g>

        {/* Central Grok tile */}
        <rect className="ui-eo-tile" x="134" y="94" width="52" height="52" rx="12" strokeWidth="0.5" filter={`url(#${id}-tile)`} />
        <GrokLogo x={147} y={107} size={26} />

        {/* Three nodes orbiting the outer ring, 120° apart; the inner group turns back so the icons stay upright */}
        {nodeOffsets.map((offset) => {
          // Each node starts `offset` into the orbit and runs one full round, so it comes to rest where it started
          const timing = { animationDelay: `${-offset}s`, animationIterationCount: 1 + offset / ORBIT };
          return (
            <g key={offset} className="ui-eo-orbit" style={timing}>
              <g className="ui-eo-upright" style={timing}>
                <circle className="ui-eo-tile" cx="160" cy="40" r="17" strokeWidth="0.5" filter={`url(#${id}-node)`} />
                <g transform="translate(154 34) scale(0.0288)" className="ui-eo-icon" fillOpacity="0.55">
                  <path d="M278 88C278 115.614 300.386 138 328 138H366C393.614 138 416 160.386 416 188V228C416 255.614 393.614 278 366 278H328C300.386 278 278 300.386 278 328V366C278 393.614 255.614 416 228 416H188C160.386 416 138 393.614 138 366V328C138 300.386 115.614 278 88 278H50C22.3858 278 0 255.614 0 228V188C0 160.386 22.3858 138 50 138H88C115.614 138 138 115.614 138 88V50C138 22.3858 160.386 0 188 0H228C255.614 0 278 22.3858 278 50V88ZM140 226C140 253.614 162.386 276 190 276H226C253.614 276 276 253.614 276 226V190C276 162.386 253.614 140 226 140H190C162.386 140 140 162.386 140 190V226Z" />
                </g>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- Logo (nested SVG, placed in the 320 × 240 artboard) ---------- */

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

.ui-eo {
  /* One round of the comets and of the nodes (ORBIT in the component); the comets make three, the nodes one */
  --tc-enrichment-orbit-comet: 7s;
  --tc-enrichment-orbit-node: 22s;
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
}
.ui-eo-art {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/* Colours */
.ui-eo-rings { stroke: light-dark(#e4e7ec, rgba(255, 255, 255, 0.14)); }
.ui-eo-tile { fill: light-dark(#ffffff, #232326); stroke: light-dark(#e4e7ec, rgba(255, 255, 255, 0.08)); }
.ui-eo-drop { flood-color: light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4)); }
.ui-eo-drop--node { flood-color: light-dark(rgba(0, 0, 0, 0.07), rgba(0, 0, 0, 0.4)); }
.ui-eo-sliver { flood-color: light-dark(#eaecef, #1a1a1c); }
.ui-eo-icon { fill: light-dark(#6b6f76, #c4c4c4); }
.ui-eo-mark { fill: light-dark(#171717, #ededed); }

/* Comets: one full turn around the center every 7 s, three times */
.ui-eo-spin {
  transform-origin: 160px 120px;
  animation: ui-eo-turn var(--tc-enrichment-orbit-comet) linear 3;
}
.ui-eo-reverse { animation-direction: reverse; }

/* Nodes: one orbit in 22 s, turned back around their own center to stay upright; each ends where it started
   (the component staggers them with a delay and a matching iteration count) */
.ui-eo-orbit {
  transform-origin: 160px 120px;
  animation: ui-eo-turn var(--tc-enrichment-orbit-node) linear 1 both;
}
.ui-eo-upright {
  transform-box: fill-box;
  transform-origin: center;
  animation: ui-eo-turn var(--tc-enrichment-orbit-node) linear 1 reverse both;
}
@keyframes ui-eo-turn {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Reduced motion: everything stays put, the nodes keep their staggered spots on the ring */
/* Off screen or in a hidden tab: the orbits hold still */
.ui-eo[data-paused] :is(.ui-eo-spin, .ui-eo-orbit, .ui-eo-upright) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-eo-spin, .ui-eo-orbit, .ui-eo-upright { animation-play-state: paused; }
}
`;

/** Grok mark, monochrome */
const GrokLogo = ({ x, y, size }: { x: number; y: number; size: number }) => (
  <svg x={x} y={y} width={size} height={size} viewBox="0 0 33.4 32" overflow="visible">
    <path className="ui-eo-mark" d="M12.8734 20.5407L23.9549 12.3506C24.4982 11.9491 25.2747 12.1057 25.5336 12.7294C26.896 16.0185 26.2873 19.9712 23.5766 22.6851C20.866 25.3989 17.0944 25.9941 13.6471 24.6386L9.88123 26.3843C15.2826 30.0806 21.8416 29.1665 25.9403 25.0601C29.1914 21.8051 30.1983 17.3683 29.2568 13.3673L29.2653 13.3758C27.9 7.49809 29.601 5.14871 33.0853 0.344576C33.1677 0.230667 33.2502 0.116757 33.3327 0L28.7476 4.59055V4.57631L12.8706 20.5436" />
    <path className="ui-eo-mark" d="M10.5867 22.5312C6.70979 18.8234 7.37821 13.0852 10.6862 9.77618C13.1323 7.3271 17.14 6.32755 20.6385 7.79698L24.3959 6.05986C23.719 5.57005 22.8514 5.04322 21.8559 4.67301C17.3562 2.81914 11.969 3.7418 8.31115 7.40114C4.79271 10.9238 3.68626 16.3402 5.58628 20.9621C7.0056 24.4164 4.67893 26.8597 2.3352 29.3259C1.50465 30.2001 0.67126 31.0744 0 31.9999L10.5838 22.534" />
  </svg>
);

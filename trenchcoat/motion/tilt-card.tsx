"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";

/*
 * Tilt Card – a card that tilts in 3D towards the pointer, in a single self-contained file.
 * A soft glare follows the pointer and the card lifts a little; on leave it springs back smoothly.
 * Pointer moves are batched with requestAnimationFrame and written to CSS variables (--tc-tilt-card-rx, --tc-tilt-card-ry, --tc-tilt-card-gx, --tc-tilt-card-gy).
 * Touch pointers don't tilt. Keyboard focus inside the card gives a slight lift.
 * Reduced motion: no tilt, only the shadow changes (also when the setting changes while the page is open).
 * Part of Trenchcoat. Imports: react only.
 */

export type TiltCardOwnProps = {
  /** The card's content – it fills the tilting surface */
  children?: ReactNode;
  /** Maximum tilt in degrees */
  maxTilt?: number;
  /** Show a soft glare that follows the pointer */
  glare?: boolean;
  /** Scale while the pointer is over the card */
  scale?: number;
  /** Perspective distance in px – smaller is more dramatic */
  perspective?: number;
  className?: string;
  /** The root (the untransformed wrapper) */
  ref?: Ref<HTMLDivElement>;
};

/** Other DOM props go to the root; your pointer handlers run before the card's own */
export type TiltCardProps = Omit<ComponentPropsWithoutRef<"div">, keyof TiltCardOwnProps> & TiltCardOwnProps;

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

export function TiltCard({
  children,
  maxTilt = 10,
  glare = true,
  scale = 1.02,
  perspective = 900,
  className,
  style: styleProp,
  ref,
  onPointerMove,
  onPointerLeave,
  onPointerCancel,
  ...rest
}: TiltCardProps) {
  const root = useRef<HTMLDivElement>(null);
  const setRoot = useRootRef(root, ref);
  const card = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const point = useRef<{ x: number; y: number } | null>(null);
  const still = useRef(false);

  // Back to rest: no pending frame, no tilt
  const settle = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    point.current = null;
    card.current?.style.setProperty("--tc-tilt-card-rx", "0deg");
    card.current?.style.setProperty("--tc-tilt-card-ry", "0deg");
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      still.current = mq.matches;
      // Turned on mid-tilt: drop the tilt that is showing
      if (still.current) settle();
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      cancelAnimationFrame(frame.current);
    };
  }, [settle]);

  // Read the pointer relative to the untransformed wrapper, so the tilt itself never feeds back
  const apply = () => {
    frame.current = 0;
    const r = root.current, c = card.current, p = point.current;
    if (!r || !c || !p) return;
    const box = r.getBoundingClientRect();
    const x = Math.min(Math.max((p.x - box.left) / box.width, 0), 1);
    const y = Math.min(Math.max((p.y - box.top) / box.height, 0), 1);
    c.style.setProperty("--tc-tilt-card-rx", `${((0.5 - y) * 2 * maxTilt).toFixed(2)}deg`);
    c.style.setProperty("--tc-tilt-card-ry", `${((x - 0.5) * 2 * maxTilt).toFixed(2)}deg`);
    c.style.setProperty("--tc-tilt-card-gx", `${(x * 100).toFixed(1)}%`);
    c.style.setProperty("--tc-tilt-card-gy", `${(y * 100).toFixed(1)}%`);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    if (e.pointerType === "touch") return;
    const c = card.current;
    if (c && !c.hasAttribute("data-active")) c.setAttribute("data-active", "");
    if (still.current) return;
    point.current = { x: e.clientX, y: e.clientY };
    if (!frame.current) frame.current = requestAnimationFrame(apply);
  };

  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.type === "pointercancel") onPointerCancel?.(e);
    else onPointerLeave?.(e);
    settle();
    card.current?.removeAttribute("data-active");
  };

  const style = {
    "--tc-tilt-card-perspective": `${perspective}px`,
    "--tc-tilt-card-scale": scale,
    ...styleProp,
  } as CSSProperties;

  return (
    <div
      {...rest}
      ref={setRoot}
      className={["ui-tlt", className].filter(Boolean).join(" ")}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerCancel={onLeave}
    >
      {/* React 19 hoists this into <head> once, no matter how many instances render */}
      <style href="ui-tilt-card" precedence="default">
        {css}
      </style>
      <div ref={card} className="ui-tlt-card">
        {children}
        {glare && <span className="ui-tlt-glare" aria-hidden="true" />}
      </div>
    </div>
  );
}

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

.ui-tlt {
  --tc-tilt-card-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4)), 0 8px 24px -12px light-dark(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.6));
  /* Lifted: a deeper, softer shadow while tilting */
  --tc-tilt-card-shadow-active: 0 2px 4px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 24px 48px -16px light-dark(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.75));
  --tc-tilt-card-glare-color: light-dark(rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0.24));
  display: inline-block;
  perspective: var(--tc-tilt-card-perspective);
}

.ui-tlt-card {
  --tc-tilt-card-rx: 0deg;
  --tc-tilt-card-ry: 0deg;
  --tc-tilt-card-gx: 50%;
  --tc-tilt-card-gy: 50%;
  --tc-tilt-card-lift: 0px;
  --tc-tilt-card-s: 1;
  position: relative;
  overflow: hidden;
  border-radius: var(--tc-radius-3xl, 20px);
  box-shadow: var(--tc-tilt-card-shadow);
  transform: translateY(var(--tc-tilt-card-lift)) rotateX(var(--tc-tilt-card-rx)) rotateY(var(--tc-tilt-card-ry)) scale(var(--tc-tilt-card-s));
  /* The return: a soft spring back to rest */
  transition: transform var(--tc-duration-reveal, 700ms) var(--tc-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1)), box-shadow var(--tc-duration-slowest, 560ms) var(--tc-ease-standard, ease);
  will-change: transform;
}

/* While the pointer is over it: follow closely, with just enough easing to smooth the steps */
.ui-tlt-card[data-active] {
  --tc-tilt-card-s: var(--tc-tilt-card-scale);
  --tc-tilt-card-lift: -2px;
  box-shadow: var(--tc-tilt-card-shadow-active);
  transition: transform var(--tc-duration-fast, 150ms) var(--tc-ease-decelerate, cubic-bezier(0, 0, 0.58, 1)), box-shadow var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}

/* Keyboard focus inside the card: a slight lift */
.ui-tlt:has(:focus-visible) .ui-tlt-card {
  --tc-tilt-card-lift: -4px;
  box-shadow: var(--tc-tilt-card-shadow-active);
}

.ui-tlt-glare {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(circle at var(--tc-tilt-card-gx) var(--tc-tilt-card-gy), var(--tc-tilt-card-glare-color), transparent 55%);
  mix-blend-mode: soft-light;
  opacity: 0;
  transition: opacity var(--tc-duration-slower, 420ms) var(--tc-ease-standard, ease);
}
.ui-tlt-card[data-active] .ui-tlt-glare { opacity: 1; }

@media (hover: none), (pointer: coarse) {
  .ui-tlt-card[data-active] { --tc-tilt-card-s: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-tlt-card,
  .ui-tlt-card[data-active],
  .ui-tlt:has(:focus-visible) .ui-tlt-card {
    transform: none;
    transition: box-shadow var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
  }
  .ui-tlt-glare { display: none; }
}

`;

"use client";

import { useCallback, useEffect, useId, useRef, type ComponentPropsWithoutRef, type Ref } from "react";

/*
 * Frost Cloud – a little cloud with eyes on a colored sky, in a single self-contained file.
 * Frosted white and a little see-through, the sky shining through softly towards the bottom, eyes cut out of it.
 * It floats and breathes, turns a little to look left and right, blinks now and then,
 * follows the pointer with its eyes and gives a squishy bounce and a wink when clicked.
 * Everything moves on soft springs; it runs only while on screen and keeps still with prefers-reduced-motion.
 * Left alone it idles for about 12 s and then settles (WCAG 2.2.2); the pointer, a click or scrolling it back
 * into view wakes it up again.
 * Decorative by default (aria-hidden); pass `label` to have it announced as an image.
 */

type FrostCloudOwnProps = {
  /** Fill the whole illustration with the sky gradient; false leaves the cloud on a transparent background */
  background?: boolean;
  /** "blue": a blue-to-cyan sky · "orange": a red-to-orange sky */
  color?: "blue" | "orange";
  /** The eyes follow the pointer while it's over the illustration */
  followPointer?: boolean;
  className?: string;
  /** Accessible description – when set, the cloud is announced as an image; otherwise it is decorative */
  label?: string;
  ref?: Ref<HTMLDivElement>;
};

export type FrostCloudProps = Omit<ComponentPropsWithoutRef<"div">, keyof FrostCloudOwnProps | "children"> & FrostCloudOwnProps;

/* The cloud: puffs that melt into one shape through a soft "goo" filter */
const PUFFS = [
  { cx: 115, cy: 93, r: 43 }, // the big puff on top
  { cx: 163, cy: 111, r: 39 }, // right
  { cx: 156, cy: 155, r: 31 }, // bottom right
  { cx: 107, cy: 155, r: 35 }, // bottom
  { cx: 72, cy: 126, r: 34 }, // left
];
/** Fills the middle between the puffs */
const CORE = { x: 80, y: 100, width: 80, height: 65 };
/** Two wide pills, close together, a little below the middle */
const EYES = { y: 106, w: 18, h: 31, left: 96.5, right: 127.5 };
const CX = 120;
const CY = 120;
const BOTTOM = 180;

/** Idle glances: straight, left, right, up and to the side, down and to the side */
const GLANCES = [
  { x: 0, y: 0 },
  { x: -1, y: 0.05 },
  { x: 1, y: -0.05 },
  { x: 0, y: 0 },
  { x: 0.65, y: -0.55 },
  { x: -0.7, y: 0.35 },
];

/** Seconds it idles (floats, glances, blinks) after it comes into view or is touched, before it settles */
const IDLE = 12;

const about = (x: number, y: number, t: string) => `translate(${x} ${y}) ${t} translate(${-x} ${-y})`;
/** A gradient stop whose color comes from a CSS variable, so the palette can change */
const Stop = ({ offset, color, opacity }: { offset: number; color: string; opacity?: number }) => (
  <stop offset={offset} style={{ stopColor: `var(--tc-frost-cloud-${color})`, stopOpacity: opacity }} />
);

export function FrostCloud({
  background = true,
  color = "orange",
  followPointer = true,
  className,
  label,
  ref,
  ...rest
}: FrostCloudProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `fc${uid}-${name}`;

  const root = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(root, ref);
  const floatRef = useRef<SVGGElement>(null);
  const turnRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const leftEye = useRef<SVGGElement>(null);
  const rightEye = useRef<SVGGElement>(null);
  const shineRef = useRef<SVGEllipseElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const look = { x: 0, y: 0, vx: 0, vy: 0 };
    const target = { x: 0, y: 0 };
    const squish = { p: 0, v: 0 }; // click bounce
    let pointer = false;
    let nextGlance = 1.2;
    let nextBlink = 1.8;
    let blinkAt = -1;
    let blinkTwice = false;
    let winkAt = -1;
    let frame = 0;
    let stillTimer = 0;
    let last = 0;
    let time = 0;
    // Idle motion fades in and out smoothly (amp 0 → 1) and runs until `until`
    let until = IDLE;
    let amp = 1;

    const blinkScale = (since: number, length = 0.16) => (since < 0 || since > length ? 1 : 1 - 0.9 * Math.sin((since / length) * Math.PI));

    const draw = () => {
      const float = still ? 0 : Math.sin(time * 1.1) * 5 * amp;
      const breathe = still ? 0 : Math.sin(time * 1.1 + Math.PI / 2) * 0.012 * amp;
      const sy = 1 + breathe - squish.p * 0.12;
      const sx = 1 - breathe + squish.p * 0.1;
      floatRef.current?.setAttribute("transform", `translate(0 ${float.toFixed(2)}) ${about(CX, BOTTOM, `scale(${sx.toFixed(4)} ${sy.toFixed(4)})`)}`);
      // Turning: the body shifts and tilts a little, the eyes move further, the shine slides the other way
      turnRef.current?.setAttribute("transform", `translate(${(look.x * 4).toFixed(2)} ${(look.y * 2).toFixed(2)}) ${about(CX, CY, `rotate(${(look.x * 2.5).toFixed(2)}) scale(${(1 - Math.abs(look.x) * 0.025).toFixed(4)} 1)`)}`);
      eyesRef.current?.setAttribute("transform", `translate(${(look.x * 12).toFixed(2)} ${(look.y * 7).toFixed(2)})`);
      shineRef.current?.setAttribute("transform", `translate(${(-look.x * 7).toFixed(2)} ${(-look.y * 3).toFixed(2)})`);
      const both = blinkAt < 0 ? 1 : Math.min(blinkScale(time - blinkAt), blinkTwice ? blinkScale(time - blinkAt - 0.26) : 1);
      const wink = blinkScale(time - winkAt, 0.34);
      const eyeY = EYES.y + EYES.h / 2;
      leftEye.current?.setAttribute("transform", about(EYES.left + EYES.w / 2, eyeY, `scale(1 ${both.toFixed(3)})`));
      rightEye.current?.setAttribute("transform", about(EYES.right + EYES.w / 2, eyeY, `scale(1 ${Math.min(both, wink).toFixed(3)})`));
      // The shadow shrinks and fades as the cloud rises
      const lift = (float + 5) / 10;
      shadowRef.current?.setAttribute("transform", about(CX, 210, `scale(${(1 - lift * 0.12).toFixed(3)} 1)`));
      shadowRef.current?.setAttribute("opacity", (0.34 - lift * 0.1).toFixed(3));
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      time += dt;

      const idle = time < until;
      amp += ((idle ? 1 : 0) - amp) * Math.min(1, dt * 1.5);
      if (!idle && !pointer) {
        target.x = 0;
        target.y = 0;
      }
      if (idle && !pointer && time > nextGlance) {
        const g = GLANCES[Math.floor(Math.random() * GLANCES.length)];
        target.x = g.x;
        target.y = g.y;
        nextGlance = time + 1.4 + Math.random() * 2.2;
      }
      if (idle && time > nextBlink) {
        blinkAt = time;
        blinkTwice = Math.random() < 0.25;
        nextBlink = time + 2.4 + Math.random() * 3;
      }

      // Springs: the gaze settles softly, the bounce wobbles out
      look.vx += ((target.x - look.x) * 70 - look.vx * 13) * dt;
      look.vy += ((target.y - look.y) * 70 - look.vy * 13) * dt;
      look.x += look.vx * dt;
      look.y += look.vy * dt;
      squish.v += (-squish.p * 220 - squish.v * 9) * dt;
      squish.p += squish.v * dt;

      draw();
      // Settled: no idle motion left, the gaze at rest and the bounce, blink and wink over
      const resting =
        !idle && amp < 0.002 && Math.abs(look.x - target.x) + Math.abs(look.y - target.y) + Math.abs(look.vx) + Math.abs(look.vy) < 0.002 &&
        Math.abs(squish.p) + Math.abs(squish.v) < 0.002 && time - blinkAt > 0.6 && time - winkAt > 0.6;
      if (resting) {
        amp = 0;
        draw();
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    /** Touched or back in view: idle for another while */
    const wake = () => {
      until = Math.max(until, time + IDLE);
      start();
    };

    const start = () => {
      if (frame || still) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const io = new IntersectionObserver((entries) => (entries[entries.length - 1].isIntersecting ? wake() : stop()));
    io.observe(el);

    const onMove = (e: PointerEvent) => {
      if (!followPointer) return;
      const r = el.getBoundingClientRect();
      pointer = true;
      wake();
      target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2.4));
      target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2.4));
    };
    const onLeave = () => {
      pointer = false;
      target.x = 0;
      target.y = 0;
      nextGlance = time + 1.2;
    };
    const onDown = () => {
      squish.p = 0.9;
      squish.v = 0;
      winkAt = time + 0.12;
      if (!still) wake();
      if (still) {
        // Reduced motion: run just long enough for the bounce to settle
        start();
        window.clearTimeout(stillTimer);
        stillTimer = window.setTimeout(stop, 1200);
      }
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    draw();

    return () => {
      stop();
      window.clearTimeout(stillTimer);
      io.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
    };
  }, [followPointer]);

  const puffs = PUFFS.map((p, i) => <circle key={i} {...p} />);
  const eye = (x: number, ref: typeof leftEye, side: string) => {
    const pill = { x, y: EYES.y, width: EYES.w, height: EYES.h, rx: EYES.w / 2 };
    return (
      <g ref={ref}>
        {/* A soft shade around the hole, then the sky color inside with a slightly darker inner edge at the top */}
        <rect {...pill} x={x - 1.5} y={EYES.y - 1} width={EYES.w + 3} height={EYES.h + 3} rx={EYES.w / 2 + 1.5} className="ui-fc__eye-drop" filter={`url(#${id("edge")})`} />
        <rect {...pill} fill={`url(#${id("hole")})`} />
        <clipPath id={id(`clip-${side}`)}>
          <rect {...pill} />
        </clipPath>
        <rect {...pill} y={EYES.y + 2.5} className="ui-fc__eye-shade" fill="none" strokeWidth="5" filter={`url(#${id("edge")})`} clipPath={`url(#${id(`clip-${side}`)})`} />
      </g>
    );
  };

  return (
    <div
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...rest}
      ref={setRoot}
      className={["ui-fc", className].filter(Boolean).join(" ")}
      data-bg={background || undefined}
      data-color={color}
    >
      {/* React 19 hoists this into <head> once, no matter how many clouds render */}
      <style href="ui-frost-cloud" precedence="default">
        {css}
      </style>
      <svg viewBox="0 0 240 240" aria-hidden="true">
        <defs>
          {/* Blur, then sharpen the edge again: the puffs melt into one soft cloud */}
          <filter id={id("goo")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="3.5" />
            <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -12" />
          </filter>
          <filter id={id("soft")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id={id("halo")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id={id("edge")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter id={id("shade")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <g id={id("shape")} filter={`url(#${id("goo")})`}>
            {puffs}
            <rect {...CORE} />
          </g>
          <mask id={id("mask")} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="240">
            <use href={`#${id("shape")}`} fill="#fff" />
          </mask>
          <linearGradient id={id("frost")} x1="0" y1="50" x2="0" y2="192" gradientUnits="userSpaceOnUse">
            <Stop offset={0} color="white" />
            <Stop offset={1} color="frost" opacity={0.97} />
          </linearGradient>
          <linearGradient id={id("hole")} x1="0" y1="0" x2="0" y2="1">
            <Stop offset={0} color="hole-1" />
            <Stop offset={1} color="hole-2" />
          </linearGradient>
        </defs>

        <ellipse ref={shadowRef} className="ui-fc__shadow" cx={CX} cy="210" rx="54" ry="7" filter={`url(#${id("shade")})`} />

        <g ref={floatRef}>
          <g ref={turnRef}>
            {/* A soft halo around the cloud, and a fine edge right around it that keeps it crisp on white */}
            <use href={`#${id("shape")}`} className="ui-fc__halo" filter={`url(#${id("halo")})`} />
            <use href={`#${id("shape")}`} className="ui-fc__edge" filter={`url(#${id("edge")})`} />
            <g mask={`url(#${id("mask")})`}>
              <rect width="240" height="240" fill={`url(#${id("frost")})`} />
              {/* The sky shines through softly towards the bottom left; the edge stays bright white all around */}
              <g filter={`url(#${id("soft")})`} className="ui-fc__tint" transform={`translate(-6 18) ${about(CX, CY, "scale(0.84 0.78)")}`}>
                {puffs}
                <rect {...CORE} />
              </g>
              <ellipse ref={shineRef} cx="108" cy="78" rx="34" ry="14" fill="#fff" opacity="0.75" filter={`url(#${id("shade")})`} />
            </g>
            <g ref={eyesRef}>
              {eye(EYES.left, leftEye, "l")}
              {eye(EYES.right, rightEye, "r")}
            </g>
          </g>
        </g>
      </svg>
    </div>
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

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: every colour is light-dark(), which follows color-scheme – so dark works through .dark,
   data-theme / data-tc-theme and the OS setting alike */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Palette as variables – blue, or red-orange via data-color="orange" */
.ui-fc {
  --tc-frost-cloud-sky-top: light-dark(#2475ea, #1659c8);
  --tc-frost-cloud-sky-bottom: light-dark(#4ac8f5, #2aa6e6);
  --tc-frost-cloud-sky-light: light-dark(rgba(110, 225, 255, 0.55), rgba(90, 205, 255, 0.45));
  --tc-frost-cloud-white: #ffffff;
  --tc-frost-cloud-frost: #eef8ff;
  --tc-frost-cloud-tint: rgba(70, 165, 235, 0.2);
  --tc-frost-cloud-hole-1: #3aaef2;
  --tc-frost-cloud-hole-2: #62cdfa;
  --tc-frost-cloud-eye-drop: rgba(40, 130, 210, 0.1);
  --tc-frost-cloud-eye-shade: rgba(10, 90, 190, 0.24);
  --tc-frost-cloud-halo: light-dark(rgba(30, 150, 255, 0.2), rgba(255, 255, 255, 0.35));
  --tc-frost-cloud-edge: light-dark(rgba(20, 120, 240, 0.4), rgba(255, 255, 255, 0.25));
  --tc-frost-cloud-shadow: rgba(10, 90, 200, 0.55);
  --tc-frost-cloud-ground: light-dark(rgba(10, 80, 190, 0.4), rgba(5, 50, 140, 0.5));
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.ui-fc[data-color="orange"] {
  --tc-frost-cloud-sky-top: light-dark(#e94135, #bf2722);
  --tc-frost-cloud-sky-bottom: light-dark(#fa9842, #ed701d);
  --tc-frost-cloud-sky-light: light-dark(rgba(255, 205, 150, 0.5), rgba(255, 175, 120, 0.42));
  --tc-frost-cloud-frost: #fff5f0;
  --tc-frost-cloud-tint: rgba(235, 110, 70, 0.2);
  --tc-frost-cloud-hole-1: #f05f42;
  --tc-frost-cloud-hole-2: #fba05b;
  --tc-frost-cloud-eye-drop: rgba(200, 70, 40, 0.1);
  --tc-frost-cloud-eye-shade: rgba(170, 40, 20, 0.24);
  --tc-frost-cloud-halo: light-dark(rgba(240, 100, 60, 0.2), rgba(255, 255, 255, 0.35));
  --tc-frost-cloud-edge: light-dark(rgba(220, 80, 40, 0.4), rgba(255, 255, 255, 0.25));
  --tc-frost-cloud-shadow: rgba(170, 50, 20, 0.5);
  --tc-frost-cloud-ground: light-dark(rgba(150, 30, 10, 0.36), rgba(110, 15, 5, 0.5));
}
.ui-fc svg { display: block; width: 100%; max-width: 320px; overflow: visible; }
.ui-fc__halo { fill: var(--tc-frost-cloud-halo); }
.ui-fc__edge { fill: var(--tc-frost-cloud-edge); }
.ui-fc__shadow { fill: var(--tc-frost-cloud-shadow); }
.ui-fc__tint { fill: var(--tc-frost-cloud-tint); }
.ui-fc__eye-drop { fill: var(--tc-frost-cloud-eye-drop); }
.ui-fc__eye-shade { stroke: var(--tc-frost-cloud-eye-shade); }

/* The sky: darker at the top, lighter at the bottom, a brighter patch behind the cloud – fills the whole box */
.ui-fc[data-bg] {
  --tc-frost-cloud-halo: rgba(255, 255, 255, 0.75);
  --tc-frost-cloud-edge: rgba(255, 255, 255, 0.5);
  --tc-frost-cloud-shadow: var(--tc-frost-cloud-ground);
  background:
    radial-gradient(60% 55% at 62% 42%, var(--tc-frost-cloud-sky-light), transparent 70%),
    linear-gradient(180deg, var(--tc-frost-cloud-sky-top), var(--tc-frost-cloud-sky-bottom));
}

`;

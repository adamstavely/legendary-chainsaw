"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

/*
 * Cover Flow – browse covers in 3D, in a single self-contained file.
 * The cover in front faces you; the others turn away and stack up on both sides, with a soft reflection
 * on the floor. Drag, flick, scrub with the trackpad, use the arrow keys or click a cover – a spring
 * carries the row along and settles on the nearest cover. The caption below rolls to the new title.
 * Everything moves on the GPU (transforms only) and React re-renders only when the front cover changes.
 * The styles are injected below, so no extra files are needed. Colours follow the page theme (a dark class, data-theme /
 * data-tc-theme or the OS setting) through light-dark().
 * `index` is controlled: a drag, flick, key or click asks for a cover through onIndexChange, and the row settles
 * on whatever `index` the parent passes back. Leave `index` out (or use `defaultIndex`) to let it move freely.
 */

export type CoverFlowItem = {
  id: string | number;
  title?: string;
  subtitle?: string;
  /** Image URL – or pass your own cover with `cover` */
  image?: string;
  alt?: string;
  /** Any content instead of an image: artwork, a video, a product card */
  cover?: ReactNode;
};

type CoverFlowOwnProps = {
  items: CoverFlowItem[];
  /** Controlled front cover – changes are asked for through onIndexChange */
  index?: number;
  /** Starting cover when uncontrolled – defaults to the middle one */
  defaultIndex?: number;
  /** Uncontrolled: called as each new cover reaches the front. Controlled: called with the cover a gesture settles on */
  onIndexChange?: (index: number) => void;
  /** Clicking (or pressing Enter on) the cover in front */
  onSelect?: (item: CoverFlowItem, index: number) => void;
  /** Cover size in px – scales down on narrow containers */
  itemWidth?: number;
  itemHeight?: number;
  /** How far the side covers turn away, in degrees */
  angle?: number;
  /** Mirror the covers on the floor */
  reflection?: boolean;
  /** Title and subtitle of the front cover */
  caption?: boolean;
  /** Replaces the default caption (title and subtitle) */
  renderCaption?: (item: CoverFlowItem, index: number) => ReactNode;
  /** Previous / next buttons next to the caption */
  controls?: boolean;
  /** A row of small position ticks under the caption */
  ticks?: boolean;
  /** A soft click each time a new cover reaches the front */
  sound?: boolean;
  /** Names the carousel region */
  "aria-label"?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type CoverFlowProps = Omit<ComponentPropsWithoutRef<"div">, keyof CoverFlowOwnProps | "children"> & CoverFlowOwnProps;

const VISIBLE = 7; // covers drawn on each side
const DRAG_PX = 110; // drag distance per cover, before scaling

export function CoverFlow({
  items,
  index,
  defaultIndex,
  onIndexChange,
  onSelect,
  itemWidth = 280,
  itemHeight = 280,
  angle = 50,
  reflection = true,
  caption = true,
  renderCaption,
  controls = true,
  ticks = true,
  sound = false,
  "aria-label": ariaLabel = "Cover flow",
  className,
  style,
  ref,
  ...rest
}: CoverFlowProps) {
  const count = items.length;
  const last = Math.max(count - 1, 0);
  const clamp = (v: number) => Math.min(Math.max(v, 0), last);
  const start = clamp(index ?? defaultIndex ?? Math.floor(last / 2));

  const [active, setActive] = useState(start);
  const [dir, setDir] = useState(1); // direction of travel, for the caption
  // What the status region says: the cover a move settles on – not every cover passing by (WCAG 4.1.3)
  const [settled, setSettled] = useState("");

  const outer = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(outer, ref);
  const root = useRef<HTMLDivElement>(null);
  // Covers scale down when the container is narrow
  const scale = useFitScale(root, itemWidth);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  // Motion state lives outside React: pos follows target on a spring, painted every frame
  const m = useRef({ pos: start, target: start, vel: 0, raf: 0, last: 0, active: start });
  // Latest props for the motion callbacks (the "latest value in a ref" pattern)
  const opts = useRef({ angle, scale, itemWidth, onIndexChange, sound, count, index, items });
  opts.current = { angle, scale, itemWidth, onIndexChange, sound, count, index, items };

  const reduced = useReducedMotionRef();

  const { tick, wake: wakeAudio } = useClickSound(() => opts.current.sound);

  // Place every cover for the current (fractional) position
  const paint = useCallback(() => {
    const { pos } = m.current;
    placeCards(cards.current, pos, opts.current);
    const now = Math.round(Math.min(Math.max(pos, 0), opts.current.count - 1));
    if (now !== m.current.active) {
      setDir(now > m.current.active ? 1 : -1);
      m.current.active = now;
      setActive(now);
      // Controlled, the parent hears where a gesture settles (see request), not every cover passing by
      if (opts.current.index === undefined) opts.current.onIndexChange?.(now);
      tick();
    }
  }, [tick]);

  /** Once the row comes to rest, name the cover in front */
  const announce = useCallback(() => {
    const i = m.current.active;
    const item = opts.current.items[i];
    if (item) setSettled(slideLabel(item, i, opts.current.count) + (item.subtitle ? `, ${item.subtitle}` : ""));
  }, []);

  // Spring toward the target; stops itself once settled
  const run = useCallback(() => {
    const s = m.current;
    if (s.raf) return;
    s.last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(now - s.last, 32) / 1000;
      s.last = now;
      const k = 190;
      const c = 2 * Math.sqrt(k) * 0.92; // a hair under critical: settles with the faintest give
      s.vel += (k * (s.target - s.pos) - c * s.vel) * dt;
      s.pos += s.vel * dt;
      if (Math.abs(s.target - s.pos) < 0.0006 && Math.abs(s.vel) < 0.002) {
        s.pos = s.target;
        s.vel = 0;
        s.raf = 0;
        paint();
        announce();
        return;
      }
      paint();
      s.raf = requestAnimationFrame(frame);
    };
    s.raf = requestAnimationFrame(frame);
  }, [paint, announce]);

  const goTo = useCallback(
    (i: number) => {
      const s = m.current;
      s.target = Math.min(Math.max(Math.round(i), 0), opts.current.count - 1);
      if (reduced.current) {
        s.pos = s.target;
        s.vel = 0;
        paint();
        announce();
      } else run();
    },
    [paint, run, reduced, announce],
  );

  /** A gesture, key or click asks for a cover: taken directly when uncontrolled, asked of the parent when controlled */
  const request = useCallback(
    (i: number) => {
      const { index: held, count: c, onIndexChange: report } = opts.current;
      if (held === undefined) return goTo(i);
      const to = Math.min(Math.max(Math.round(i), 0), c - 1);
      if (to !== held) report?.(to);
      // Settle on the controlled cover; if the parent accepts, the effect below moves on to the new one
      goTo(held);
    },
    [goTo],
  );

  useEffect(() => () => cancelAnimationFrame(m.current.raf), []);

  // Controlled index
  useEffect(() => {
    if (index !== undefined && index !== Math.round(m.current.target)) goTo(index);
  }, [index, goTo]);

  // Keep the position valid when items are added or removed
  useEffect(() => {
    if (m.current.target > last) goTo(last);
    else paint();
  }, [last, goTo, paint]);

  // After every render: items may have been reordered or resized (cheap – React renders only on a new front cover)
  useLayoutEffect(paint);

  // Trackpad / horizontal wheel scrubs; vertical scrolling stays with the page
  const snapTimer = useRef(0);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      if (Math.abs(dx) <= Math.abs(e.deltaY) && !e.shiftKey) return;
      e.preventDefault();
      wakeAudio();
      const s = m.current;
      const unit = DRAG_PX * opts.current.scale * 1.4;
      s.target = Math.min(Math.max(s.target + dx / unit, -0.35), opts.current.count - 1 + 0.35);
      run();
      window.clearTimeout(snapTimer.current);
      // Settle with the swipe's momentum: lean toward the direction it was going
      snapTimer.current = window.setTimeout(() => request(s.target + Math.sign(dx) * 0.3), 110);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(snapTimer.current);
    };
  }, [run, request, wakeAudio]);

  // Drag and flick: the row follows the finger 1:1, a flick carries on, then it settles on a cover
  const drag = useRef<{ id: number; x: number; from: number; moved: boolean; hit: number | null; samples: { x: number; t: number }[] } | null>(null);
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    wakeAudio();
    const hit = (e.target as HTMLElement).closest<HTMLElement>("[data-cf-index]");
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      from: m.current.pos,
      moved: false,
      hit: hit ? Number(hit.dataset.cfIndex) : null,
      samples: [{ x: e.clientX, t: performance.now() }],
    };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.dataset.dragging = "";
    }
    const s = m.current;
    cancelAnimationFrame(s.raf);
    s.raf = 0;
    let p = d.from - dx / (DRAG_PX * opts.current.scale);
    const max = opts.current.count - 1;
    if (p < 0) p = p * 0.3; // rubber band past the ends
    if (p > max) p = max + (p - max) * 0.3;
    s.pos = s.target = p;
    s.vel = 0;
    d.samples.push({ x: e.clientX, t: performance.now() });
    if (d.samples.length > 6) d.samples.shift();
    paint();
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    delete e.currentTarget.dataset.dragging;
    if (!d.moved) {
      // A click: bring that cover to the front, or select it if it is already there
      if (d.hit === null) return;
      if (d.hit === Math.round(m.current.target)) onSelect?.(items[d.hit], d.hit);
      else request(d.hit);
      return;
    }
    const first = d.samples[0];
    const lastS = d.samples[d.samples.length - 1];
    const dt = Math.max(lastS.t - first.t, 1);
    const v = -((lastS.x - first.x) / dt) * 1000 / (DRAG_PX * opts.current.scale); // covers per second
    const s = m.current;
    s.vel = reduced.current ? 0 : v;
    let to = Math.round(s.pos + v * 0.18);
    // A quick flick always moves at least one cover
    if (Math.abs(v) > 0.8 && to === Math.round(d.from)) to += Math.sign(v);
    request(to);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const cur = Math.round(m.current.target);
    const keys: Record<string, number> = { ArrowLeft: cur - 1, ArrowRight: cur + 1, Home: 0, End: last };
    if (e.key in keys) {
      e.preventDefault();
      wakeAudio();
      request(keys[e.key]);
    } else if ((e.key === "Enter" || e.key === " ") && onSelect && e.target === e.currentTarget) {
      e.preventDefault();
      onSelect(items[cur], cur);
    }
  };

  const w = Math.round(itemWidth * scale);
  const h = Math.round(itemHeight * scale);

  return (
    <div
      {...rest}
      ref={setRoot}
      className={["ui-cf", className].filter(Boolean).join(" ")}
      style={{ ...style, "--tc-cover-flow-w": `${w}px`, "--tc-cover-flow-h": `${h}px` } as CSSProperties}
      data-reflection={reflection || undefined}
    >
      {/* React 19 hoists this into <head> once, no matter how many cover flows render */}
      <style href="ui-cover-flow" precedence="default">
        {css}
      </style>

      <div
        ref={root}
        className="ui-cf__viewport"
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        data-selectable={onSelect ? "" : undefined}
      >
        <div className="ui-cf__stage" style={{ perspective: `${Math.round(1000 * scale)}px` }}>
          {items.map((item, i) => (
            <div
              key={item.id}
              ref={(el) => {
                cards.current[i] = el;
              }}
              className="ui-cf__item"
              data-cf-index={i}
              data-active={i === active || undefined}
              role="group"
              aria-roledescription="slide"
              aria-label={slideLabel(item, i, count)}
              aria-hidden={i !== active || undefined}
            >
              <div className="ui-cf__ground" aria-hidden="true" />
              <div className="ui-cf__card">
                <CoverFace item={item} />
              </div>
              {reflection && (
                <div className="ui-cf__reflection" aria-hidden="true" inert>
                  <div className="ui-cf__card">
                    <CoverFace item={item} decorative />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mounted from the start, so the first change is announced too */}
      <div className="ui-cf__status" role="status">
        {settled}
      </div>

      {(caption || controls || ticks) && (
        <CoverFlowFooter
          items={items}
          active={active}
          dir={dir}
          caption={caption}
          controls={controls}
          ticks={ticks}
          renderCaption={renderCaption}
          onStep={(delta) => request(Math.round(m.current.target) + delta)}
          onPick={request}
        />
      )}
    </div>
  );
}

/** "3 of 7: Static Hearts" – a slide's name, also what the status region announces */
function slideLabel(item: CoverFlowItem, i: number, count: number) {
  return `${i + 1} of ${count}${item.title ? `: ${item.title}` : ""}`;
}

/** Caption with previous / next on either side, position ticks below */
function CoverFlowFooter({
  items,
  active,
  dir,
  caption,
  controls,
  ticks,
  renderCaption,
  onStep,
  onPick,
}: {
  items: CoverFlowItem[];
  active: number;
  dir: number;
  caption: boolean;
  controls: boolean;
  ticks: boolean;
  renderCaption?: (item: CoverFlowItem, index: number) => ReactNode;
  onStep: (delta: -1 | 1) => void;
  onPick: (index: number) => void;
}) {
  const current = items[active];
  return (
    <div className="ui-cf__footer">
      <div className="ui-cf__row">
      {controls && (
        // aria-disabled rather than disabled at the ends, so a press that reaches the end keeps focus on the button
        <button type="button" className="ui-cf__nav" aria-label="Previous" aria-disabled={active === 0} onClick={() => onStep(-1)}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10 3.5 5.5 8l4.5 4.5" />
          </svg>
        </button>
      )}
      {caption && (
        <div className="ui-cf__caption">
          <div key={current?.id} className="ui-cf__caption-in" data-dir={dir > 0 ? "next" : "prev"}>
            {current &&
              (renderCaption ? (
                renderCaption(current, active)
              ) : (
                <>
                  {current.title && <div className="ui-cf__title">{current.title}</div>}
                  {current.subtitle && <div className="ui-cf__subtitle">{current.subtitle}</div>}
                </>
              ))}
          </div>
        </div>
      )}
      {controls && (
        <button type="button" className="ui-cf__nav" aria-label="Next" aria-disabled={active === items.length - 1} onClick={() => onStep(1)}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6 3.5 10.5 8 6 12.5" />
          </svg>
        </button>
      )}
      </div>
      {ticks && items.length > 1 && (
        <div className="ui-cf__ticks">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              tabIndex={-1}
              className="ui-cf__tick"
              aria-label={`Show ${item.title ?? `cover ${i + 1}`}`}
              aria-current={i === active || undefined}
              onClick={() => onPick(i)}
            />
          ))}
        </div>
      )}
</div>
  );
}

/** The cover's image (or custom content); the reflection's copy has an empty alt */
function CoverFace({ item, decorative = false }: { item: CoverFlowItem; decorative?: boolean }) {
  return (
    <div className="ui-cf__media">
      {item.cover ??
        (item.image ? (
          <img src={item.image} alt={decorative ? "" : (item.alt ?? item.title ?? "")} draggable={false} loading="lazy" decoding="async" />
        ) : null)}
    </div>
  );
}

/** Scale for covers of `itemWidth` in the element's width: 1 when three fit, down to 0.5 */
function useFitScale(root: RefObject<HTMLElement | null>, itemWidth: number) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, Math.max(0.5, el.clientWidth / (itemWidth * 3.2))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [root, itemWidth]);
  return scale;
}

/** Whether reduced motion is on, kept current in a ref for the motion callbacks */
function useReducedMotionRef() {
  const reduced = useRef(false);
  useEffect(() => {
    const q = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!q) return;
    reduced.current = q.matches;
    const on = () => (reduced.current = q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Places every cover for a (fractional) position: the front one faces you, the others turn away and stack up */
function placeCards(cards: (HTMLDivElement | null)[], pos: number, { angle: a, scale: s, itemWidth: w }: { angle: number; scale: number; itemWidth: number }) {
  const gap = w * 0.78 * s; // center cover to the first side cover
  const step = w * 0.27 * s; // between side covers
  const depth = w * 0.7 * s;
  cards.forEach((el, i) => {
    if (!el) return;
    const d = i - pos;
    const ad = Math.abs(d);
    if (ad > VISIBLE + 1) {
      el.style.visibility = "hidden";
      return;
    }
    const t = Math.min(ad, 1); // 0 in front, 1 once fully turned
    const dir = Math.sign(d);
    const x = dir * (t * gap + Math.max(ad - 1, 0) * step);
    el.style.visibility = "";
    const k = 1 - t * 0.08 - Math.min(Math.max(ad - 1, 0), 4) * 0.015; // recede a little more with distance
    el.style.transform = `translate3d(${x}px, 0, ${-t * depth}px) rotateY(${-dir * t * a}deg) scale(${k.toFixed(4)})`;
    el.style.zIndex = String(1000 - Math.round(ad * 10));
    el.style.setProperty("--tc-cover-flow-t", t.toFixed(3));
    el.style.setProperty("--tc-cover-flow-d", Math.min(Math.max(d, -1.5), 1.5).toFixed(3)); // drives the image drift
    el.dataset.side = d < 0 ? "left" : "right";
  });
}

/** A short, soft tick each time a cover reaches the front – made with Web Audio, no sound file */
function useClickSound(enabled: () => boolean) {
  const audio = useRef<AudioContext | null>(null);
  const on = useRef(enabled);
  useEffect(() => {
    on.current = enabled;
  });
  useEffect(() => () => void audio.current?.close(), []);
  const tick = useCallback(() => {
    const ctx = audio.current;
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.03);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }, []);
  // Browsers only start audio from a user gesture, so the context is created (or resumed) on the first one
  const wake = useCallback(() => {
    if (!on.current()) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!audio.current && Ctx) audio.current = new Ctx();
    if (audio.current?.state === "suspended") void audio.current.resume();
  }, []);
  return { tick, wake };
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

const css = /* css */ `
/* Theme: every colour is light-dark(), which follows color-scheme – so dark works through .dark,
   data-theme / data-tc-theme and the OS setting alike */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

.ui-cf {
  --tc-cover-flow-card: light-dark(#f1f1f1, #1d1d20);
  --tc-cover-flow-dim: light-dark(rgba(255, 255, 255, 0.24), rgba(0, 0, 0, 0.5));
  /* The drop is a little longer in dark, so each theme has its own (the other one's is transparent) */
  --tc-cover-flow-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.3)), 0 10px 20px -12px light-dark(rgba(0, 0, 0, 0.18), transparent), 0 12px 24px -14px light-dark(transparent, rgba(0, 0, 0, 0.6));
  /* How strong the reflection starts (--tc-cover-flow-reflect overrides both themes) */
  --tc-cover-flow-reflect-mask: light-dark(rgba(0, 0, 0, var(--tc-cover-flow-reflect, 0.22)), rgba(0, 0, 0, var(--tc-cover-flow-reflect, 0.3)));
  --tc-cover-flow-ground: light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.45));
  --tc-cover-flow-edge: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
  --tc-cover-flow-tick: light-dark(rgba(0, 0, 0, 0.16), rgba(255, 255, 255, 0.2));
  display: grid;
  gap: 4px;
  width: 100%;
  min-width: 0;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Soft fade on both sides, so the stacks run out instead of being cut off */
.ui-cf__viewport {
  position: relative;
  overflow: hidden;
  padding: calc(var(--tc-cover-flow-h) * 0.08) 0 0;
  height: calc(var(--tc-cover-flow-h) * 1.08);
  border-radius: var(--tc-radius-xl, 12px);
  outline: none;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
}
.ui-cf[data-reflection] .ui-cf__viewport { height: calc(var(--tc-cover-flow-h) * 1.4); }
.ui-cf__viewport[data-dragging] { cursor: grabbing; }
.ui-cf__viewport:focus-visible .ui-cf__item[data-active] .ui-cf__card {
  box-shadow: var(--tc-cover-flow-shadow), 0 0 0 3px var(--tc-focus-ring, light-dark(#2f68ff, #6b95ff));
}

.ui-cf__stage {
  position: relative;
  height: var(--tc-cover-flow-h);
  transform-style: preserve-3d;
}
.ui-cf__item {
  position: absolute;
  top: 0;
  left: 50%;
  width: var(--tc-cover-flow-w);
  height: var(--tc-cover-flow-h);
  margin-left: calc(var(--tc-cover-flow-w) / -2);
  transform-style: preserve-3d;
  will-change: transform;
}
.ui-cf__viewport[data-selectable] .ui-cf__item[data-active] { cursor: pointer; }
.ui-cf__card {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-cover-flow-card);
  box-shadow: var(--tc-cover-flow-shadow);
}
.ui-cf__media {
  position: absolute;
  inset: 0 -8%;
  transform: translateX(calc(var(--tc-cover-flow-d, 0) * -5%));
}
.ui-cf__media > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
/* A soft shadow on the floor that fades as a cover turns away */
.ui-cf__ground {
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: -3px;
  height: 8px;
  border-radius: 50%;
  background: var(--tc-cover-flow-ground);
  filter: blur(5px);
  opacity: calc(1 - var(--tc-cover-flow-t, 0) * 0.7);
  pointer-events: none;
}
/* Hairline edge, a dim that grows as a cover turns away, and a sheen on the side facing the light */
.ui-cf__card::before,
.ui-cf__card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}
.ui-cf__card::before {
  z-index: 2;
  box-shadow: inset 0 0 0 1px var(--tc-cover-flow-edge);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.22), transparent 45%);
  opacity: calc(var(--tc-cover-flow-t, 0) * 0.9);
}
.ui-cf__item[data-side="right"] .ui-cf__card::before {
  background: linear-gradient(270deg, rgba(255, 255, 255, 0.22), transparent 45%);
}
.ui-cf__card::after {
  z-index: 1;
  background: var(--tc-cover-flow-dim);
  opacity: var(--tc-cover-flow-t, 0);
}

/* The floor: a flipped copy that fades out – a mask, so it works on any background */
.ui-cf__reflection {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 32%;
  margin-top: 2px;
  overflow: hidden;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(to bottom, var(--tc-cover-flow-reflect-mask), transparent 85%);
  mask-image: linear-gradient(to bottom, var(--tc-cover-flow-reflect-mask), transparent 85%);
}
.ui-cf__reflection > .ui-cf__card {
  height: var(--tc-cover-flow-h);
  transform: scaleY(-1);
  transform-origin: 50% calc(var(--tc-cover-flow-h) / 2);
  box-shadow: none;
}
.ui-cf__reflection > .ui-cf__card {
  position: absolute;
  bottom: auto;
  top: 0;
}

/* Caption with previous / next on either side, position ticks below */
.ui-cf__footer {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 14px;
  margin-top: calc(var(--tc-cover-flow-h) * -0.04);
}
.ui-cf:not([data-reflection]) .ui-cf__footer { margin-top: 12px; }
.ui-cf__row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 44px;
}
.ui-cf__ticks {
  display: flex;
  align-items: center;
  gap: 2px;
}
.ui-cf__tick {
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}
.ui-cf__tick::before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: var(--tc-radius-full, 999px);
  background: var(--tc-cover-flow-tick);
  transition: width var(--tc-duration-slow, 320ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), background-color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-cf__tick[aria-current]::before {
  width: 14px;
  background: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-cf__tick:hover::before { background: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-cf__tick[aria-current]:hover::before { background: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-cf__caption {
  display: grid;
  min-width: min(220px, 50vw);
  text-align: center;
}
.ui-cf__caption-in { animation: ui-cf-in var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both; }
.ui-cf__caption-in[data-dir="prev"] { animation-name: ui-cf-in-prev; }
.ui-cf__title {
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font-size: var(--tc-font-size-lg-plus, 15px);
  font-weight: var(--tc-font-weight-semibold, 600);
  letter-spacing: -0.01em;
  line-height: 1.35;
}
.ui-cf__subtitle {
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  font-size: var(--tc-font-size-md, 13px);
  line-height: 1.4;
}
.ui-cf__nav {
  display: grid;
  place-items: center;
  flex: none;
  /* A round secondary button: the secondary action colours and the control height */
  width: var(--tc-control-h-md, 32px);
  height: var(--tc-control-h-md, 32px);
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-full, 999px);
  background: var(--tc-action-secondary-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-action-secondary-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  color: var(--tc-action-secondary-fg, light-dark(#171717, #ededed));
  cursor: pointer;
  transition: transform var(--tc-duration-fast, 150ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), opacity var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-cf__nav:hover:not([aria-disabled="true"]) { box-shadow: var(--tc-action-secondary-shadow-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
.ui-cf__nav:active { transform: scale(0.92); }
/* At an end: the arrow dims, the button (and its focus ring) stays at full strength */
.ui-cf__nav[aria-disabled="true"] { cursor: default; transform: none; }
.ui-cf__nav[aria-disabled="true"] svg { opacity: 0.35; }
/* Visually hidden, still read */
.ui-cf__status {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.ui-cf__nav:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-cf__nav svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
@media (pointer: coarse) {
  .ui-cf__nav { width: var(--tc-control-h-lg, 40px); height: var(--tc-control-h-lg, 40px); }
}

/* The caption rises in from the direction of travel */
@keyframes ui-cf-in {
  from { opacity: 0; transform: translate(14px, 4px); filter: blur(3px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-cf-in-prev {
  from { opacity: 0; transform: translate(-14px, 4px); filter: blur(3px); }
  to { opacity: 1; transform: none; filter: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-cf__caption-in { animation: none; }
  .ui-cf__media { transform: none; }
  .ui-cf__tick::before { transition: none; }
  .ui-cf__nav { transition: none; }
}
`;

"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

/*
 * Layer Stack – an interactive card illustration, in a single self-contained file.
 * An isometric stack of five layers next to a list of five entries. The chosen entry lifts its layer
 * out of the stack in blue, with a soft glow underneath; the others settle back to glassy gray.
 * It steps through the entries on its own – twice round by default (`rounds`), then it rests – and pauses while you
 * hover, while it's off screen and with reduced motion; click or focus an entry to pick it (arrow keys, Home and End move through the list).
 * Pass `index` with `onIndexChange` to control the chosen entry – it then only moves when you change it.
 * The artwork is laid out on a 600 × 400 grid inside a 3 : 2 frame and scales with its container.
 */

export type LayerStackItem = {
  /** Main line of the entry */
  title: string;
  /** Short muted hint on the right */
  hint?: string;
  /** Icon drawn onto the layer: one of the built-in names */
  icon?: LayerIcon;
};

export type LayerIcon = "bolt" | "database" | "plug" | "spark" | "pulse";

type LayerStackOwnProps = {
  /** Up to five entries, top layer first */
  items?: LayerStackItem[];
  /** The chosen entry (controlled when defined: it doesn't step on its own then) */
  index?: number;
  /** Entry to start on when uncontrolled */
  defaultIndex?: number;
  /** Reports every change of the chosen entry – picked by the user or stepped to on its own */
  onIndexChange?: (index: number) => void;
  /** Time per entry while it plays on its own, in ms */
  interval?: number;
  /** How many times it steps through all entries on its own before it rests (default 2; Infinity keeps going) */
  rounds?: number;
  /**
   * Called when an entry is picked by the user
   * @deprecated Use onIndexChange, which also reports the automatic steps
   */
  onChange?: (index: number) => void;
};

export type LayerStackProps = Omit<ComponentPropsWithoutRef<"div">, keyof LayerStackOwnProps> &
  LayerStackOwnProps & {
    /** The root element */
    ref?: Ref<HTMLDivElement>;
  };

const defaultItems: LayerStackItem[] = [
  { title: "Triggered by events", hint: "Webhooks", icon: "bolt" },
  { title: "Grounded in your data", hint: "Context", icon: "database" },
  { title: "Connected to your apps", hint: "APIs", icon: "plug" },
  { title: "Works with any model", hint: "Routing", icon: "spark" },
  { title: "Traced at every step", hint: "Logs", icon: "pulse" },
];

/* Layer geometry on the 600 × 400 grid */
const SIZE = 104; // side of a layer before the isometric projection (rhombus 208 × 104)
const STEP = 26; // vertical distance between resting layers
const GAP = 34; // the chosen layer lifts off the ones below it
const ABOVE = 24; // and the layers above it lift a little further, so it shows
const THICK = 9; // layer thickness
const CX = 168; // stack centre
const TOP = 109; // y of the top layer's back corner when nothing is lifted

export function LayerStack({
  items = defaultItems,
  index,
  defaultIndex = 0,
  onIndexChange,
  interval = 2600,
  rounds = 2,
  onChange,
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ref,
  ...rest
}: LayerStackProps) {
  const id = "ui-lyr" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const list = items.slice(0, 5);
  const [chosen, setChosen] = useControllable(index, defaultIndex, onIndexChange, "index");
  // Fewer items than the chosen entry: show the last one
  const active = Math.max(0, Math.min(chosen, list.length - 1));
  const [paused, setPaused] = useState(false);
  const touched = useRef(false);
  // Automatic steps so far: it rests after `rounds` times through the list (WCAG 2.2.2)
  const steps = useRef(0);
  const own = useRef<HTMLDivElement>(null);
  const rootRef = useRootRef(own, ref);
  const onScreen = useOnScreen(own);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);

  // Step through the entries on its own until someone interacts – only uncontrolled, on screen and without reduced motion
  const timed = index === undefined;
  useEffect(() => {
    const limit = rounds * list.length;
    if (!timed || paused || !onScreen || touched.current || list.length < 2 || steps.current >= limit || reducedMotion()) return;
    const timer = window.setInterval(() => {
      if (steps.current >= limit) return window.clearInterval(timer);
      steps.current++;
      setChosen((i) => (Math.min(i, list.length - 1) + 1) % list.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [timed, paused, onScreen, interval, rounds, list.length, setChosen]);

  const pick = (i: number) => {
    touched.current = true;
    setChosen(i);
    onChange?.(i);
  };

  // Resting y of each layer: gaps open below and above the chosen one. The bottom layer has nothing
  // below it, so when it's chosen it stays put and only the layers above it rise
  const last = list.length - 1;
  const yOf = (i: number) => TOP + i * STEP - (i < active ? GAP + ABOVE : i === active && active < last ? GAP : 0);

  return (
    <div
      {...rest}
      ref={rootRef}
      className={["ui-lyr", className].filter(Boolean).join(" ")}
      onMouseEnter={(e) => {
        setPaused(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setPaused(false);
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        setPaused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setPaused(false);
        onBlur?.(e);
      }}
    >
      {/* React 19 hoists this into <head> once, no matter how many instances render */}
      <style href="ui-layer-stack" precedence="default">
        {css}
      </style>

      <svg className="ui-lyr-stack" viewBox="0 0 600 400" aria-hidden="true">
        <defs>
          <filter id={`${id}-glow`} x="-60%" y="-120%" width="220%" height="340%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        {/* Bottom layer first, so the upper ones overlap it */}
        {list
          .map((item, i) => (
            <g
              key={i}
              className="ui-lyr-layer"
              data-active={i === active ? "" : undefined}
              data-above={i < active ? "" : undefined}
              style={{ transform: `translate(${CX}px, ${yOf(i)}px)` }}
            >
              {/* Glow just beneath this layer – fades in while it's the chosen one, same strength on every layer */}
              <ellipse className="ui-lyr-glow" cx={0} cy={SIZE / 2 + THICK + 18} rx={70} ry={24} filter={`url(#${id}-glow)`} />
              {/* Thickness: the same rhombus, shifted down, peeks out below the top face */}
              <g transform={`translate(0 ${THICK}) matrix(1 0.5 -1 0.5 0 0)`}>
                <rect className="ui-lyr-side" width={SIZE} height={SIZE} rx={9} />
                <rect className="ui-lyr-side-on" width={SIZE} height={SIZE} rx={9} />
              </g>
              <g transform="matrix(1 0.5 -1 0.5 0 0)">
                <rect className="ui-lyr-face" width={SIZE} height={SIZE} rx={9} />
                <rect className="ui-lyr-face-on" width={SIZE} height={SIZE} rx={9} />
                <g className="ui-lyr-icon" transform={`translate(${SIZE / 2 - 18} ${SIZE / 2 - 18}) scale(1.5)`}>
                  {icons[item.icon ?? "bolt"]}
                </g>
              </g>
            </g>
          ))
          .reverse()}
      </svg>

      <div className="ui-lyr-menu" role="tablist" aria-label="Layers" aria-orientation="vertical">
        <span className="ui-lyr-pill" aria-hidden="true" style={{ transform: `translateY(calc(${active} * var(--tc-layer-stack-row)))` }} />
        {list.map((item, i) => (
          <button
            key={i}
            ref={(el) => {
              rows.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            className="ui-lyr-row"
            onClick={() => pick(i)}
            onKeyDown={(e) => {
              const moves: Record<string, number> = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: list.length - 1 };
              if (!(e.key in moves)) return;
              e.preventDefault();
              const n = (moves[e.key] + list.length) % list.length;
              pick(n);
              rows.current[n]?.focus();
            }}
          >
            <span className="ui-lyr-title">{item.title}</span>
            {item.hint && <span className="ui-lyr-hint">{item.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Icons, drawn on a 24 grid and laid onto the layer ---------- */

const icons: Record<LayerIcon, ReactNode> = {
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />,
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
    </>
  ),
  plug: <path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0V8ZM12 16.5V21" />,
  spark: <path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7ZM18.5 15.5c.2 1.5.8 2.1 2.3 2.3-1.5.2-2.1.8-2.3 2.3-.2-1.5-.8-2.1-2.3-2.3 1.5-.2 2.1-.8 2.3-2.3Z" />,
  pulse: <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />,
};

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

/**
 * State that a parent may control. `value` defined → controlled: the component shows `value` and only asks for
 * changes through `onChange`. `value` undefined → uncontrolled: it keeps its own state, starting at `defaultValue`,
 * and still reports changes. Whether `onChange` is passed never decides which.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: say so once (in development)
  const warned = useRef(false);
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
  if (controlled && !onChange && !warned.current && env !== "production") {
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

/** Whether the user asked for reduced motion – safe to call during SSR */
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

.ui-lyr {
  /* 1 unit of the 600 × 400 layout grid */
  --tc-layer-stack-u: calc(100cqw / 600);
  --tc-layer-stack-row: calc(52 * var(--tc-layer-stack-u));
  /* The accent blue used across the library */
  --tc-layer-stack-accent: light-dark(#2f6bff, #6b95ff);
  --tc-layer-stack-accent-deep: light-dark(#2557d9, #2f6bff);
  --tc-layer-stack-tint: light-dark(#e9f0ff, #1f2c4d);
  --tc-layer-stack-glow: light-dark(rgba(47, 107, 255, 0.28), rgba(47, 107, 255, 0.3));
  --tc-layer-stack-face: light-dark(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.04));
  --tc-layer-stack-edge: light-dark(rgba(10, 10, 10, 0.11), rgba(255, 255, 255, 0.13));
  --tc-layer-stack-side: light-dark(#ececef, #26262a);
  --tc-layer-stack-face-above: light-dark(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.025));
  --tc-layer-stack-side-above: light-dark(rgba(236, 236, 239, 0.55), rgba(38, 38, 42, 0.5));
  --tc-layer-stack-panel: light-dark(#f5f5f5, #161618);
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  container-type: inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.ui-lyr *, .ui-lyr *::before, .ui-lyr *::after { box-sizing: border-box; }

/* ---------- Stack ---------- */

.ui-lyr-stack { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.ui-lyr-layer { transition: transform var(--tc-duration-slowest, 560ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)); }
.ui-lyr-glow {
  fill: var(--tc-layer-stack-glow);
  opacity: 0;
  transition: opacity var(--tc-duration-slower, 420ms) var(--tc-ease-standard, ease);
}
.ui-lyr-layer[data-active] .ui-lyr-glow { opacity: 1; }
.ui-lyr-side-on {
  fill: var(--tc-layer-stack-accent-deep);
  opacity: 0;
  transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-lyr-side {
  fill: var(--tc-layer-stack-side);
  stroke: var(--tc-layer-stack-edge);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  transition: fill var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease), stroke var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-lyr-face {
  fill: var(--tc-layer-stack-face);
  stroke: var(--tc-layer-stack-edge);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  transition: fill var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease), stroke var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-lyr-face-on {
  fill: var(--tc-layer-stack-tint);
  stroke: var(--tc-layer-stack-accent);
  opacity: 0;
  stroke-width: 1.6;
  vector-effect: non-scaling-stroke;
  transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-lyr-icon {
  fill: none;
  stroke: var(--tc-layer-stack-accent);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
/* Layers above the chosen one turn more glassy, so its color shows through */
.ui-lyr-layer[data-above] .ui-lyr-face { fill: var(--tc-layer-stack-face-above); }
.ui-lyr-layer[data-above] .ui-lyr-side { fill: var(--tc-layer-stack-side-above); }
.ui-lyr-layer[data-active] .ui-lyr-side-on { opacity: 1; }
.ui-lyr-layer[data-active] .ui-lyr-face-on { opacity: 1; }
.ui-lyr-layer[data-active] .ui-lyr-icon { opacity: 1; transition-delay: var(--tc-duration-quick, 120ms); }

/* ---------- Menu ---------- */

.ui-lyr-menu {
  position: absolute;
  left: calc(326 * var(--tc-layer-stack-u));
  top: 50%;
  width: calc(248 * var(--tc-layer-stack-u));
  padding: calc(8 * var(--tc-layer-stack-u));
  transform: translateY(-50%);
  border-radius: calc(18 * var(--tc-layer-stack-u));
  background: var(--tc-layer-stack-panel);
}
/* White card that glides behind the chosen row */
.ui-lyr-pill {
  position: absolute;
  left: calc(8 * var(--tc-layer-stack-u));
  right: calc(8 * var(--tc-layer-stack-u));
  top: calc(8 * var(--tc-layer-stack-u));
  height: var(--tc-layer-stack-row);
  border-radius: calc(12 * var(--tc-layer-stack-u));
  background: var(--tc-surface-overlay, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-shadow-raised, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: transform var(--tc-duration-slower, 420ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1));
}
.ui-lyr-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(10 * var(--tc-layer-stack-u));
  width: 100%;
  height: var(--tc-layer-stack-row);
  margin: 0;
  padding: 0 calc(14 * var(--tc-layer-stack-u));
  border: 0;
  border-radius: calc(12 * var(--tc-layer-stack-u));
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ui-lyr-row:focus-visible { outline: 2px solid var(--tc-layer-stack-accent); outline-offset: -2px; }
.ui-lyr-title {
  min-width: 0;
  overflow: hidden;
  font-size: calc(14 * var(--tc-layer-stack-u));
  font-weight: var(--tc-font-weight-medium, 500);
  line-height: 1.3;
  letter-spacing: -0.01em;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  transition: color var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-lyr-hint {
  flex: none;
  font-size: calc(12 * var(--tc-layer-stack-u));
  line-height: 1.3;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
/* The chosen title uses the accent text colour: the plain accent is 4.49 : 1 on the white pill (WCAG 1.4.3) */
.ui-lyr-row[aria-selected="true"] .ui-lyr-title { color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); }

@media (prefers-reduced-motion: reduce) {
  .ui-lyr-layer, .ui-lyr-glow, .ui-lyr-pill, .ui-lyr-side, .ui-lyr-side-on, .ui-lyr-face, .ui-lyr-face-on, .ui-lyr-icon, .ui-lyr-title { transition: none; }
}
`;

"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";

/*
 * Blur Crossfade – swaps content with a soft blur while the box glides to the new size,
 * in a single self-contained file. Change `id` and the old content blurs out as the new one
 * blurs in; height (and optionally width) morphs from old to new.
 * If keyboard focus was on something in the old content, it moves to the first control of the new content (or the
 * new content itself), so it never drops to the page. The styles are injected below, so no extra files are needed.
 * Part of Trenchcoat. Imports: react only.
 */

export type BlurCrossfadeOwnProps = {
  /** Change this to swap – the children of the old id fade out, the new ones fade in */
  id: string | number;
  children?: ReactNode;
  /** Length of the swap in ms */
  duration?: number;
  /** Blur in px at the start and end of the fade */
  blur?: number;
  /** Which sides glide to the new size; "both" sizes the box to its content */
  morph?: "height" | "both" | "none";
  /** Root element – use span inside buttons and other inline content */
  as?: "div" | "span";
  className?: string;
  style?: CSSProperties;
  /** The root element */
  ref?: Ref<HTMLElement>;
};

/** Other DOM props go to the root; `id` is the swap key, so it never reaches the DOM */
export type BlurCrossfadeProps = Omit<ComponentPropsWithoutRef<"div">, keyof BlurCrossfadeOwnProps> & BlurCrossfadeOwnProps;

type Exit = { id: string | number; node: ReactNode; n: number; w: number; h: number };

// Read at the moment of each swap, so a change of the setting applies to the next one
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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

export function BlurCrossfade({
  id,
  children,
  duration = 420,
  blur = 10,
  morph = "height",
  as: Tag = "div",
  className,
  style,
  ref,
  ...rest
}: BlurCrossfadeProps) {
  const rootRef = useRef<HTMLElement>(null);
  const setRoot = useRootRef(rootRef, ref);
  const curRef = useRef<HTMLElement>(null);
  const [exit, setExit] = useState<Exit | null>(null);
  const lastId = useRef(id);
  // Children and size of what is on screen, kept for the moment it has to leave
  const lastNode = useRef<ReactNode>(children);
  const size = useRef({ w: 0, h: 0 });
  const busy = useRef(false);
  const timer = useRef(0);
  const counter = useRef(0);
  // The element that last had focus inside the box – if a swap removes it, focus moves to the new content
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onFocusIn = (e: FocusEvent) => {
      lastFocus.current = e.target instanceof HTMLElement ? e.target : null;
    };
    root.addEventListener("focusin", onFocusIn);
    return () => root.removeEventListener("focusin", onFocusIn);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const layer = curRef.current;
    if (id === lastId.current || !root || !layer) {
      lastNode.current = children;
      return;
    }
    lastId.current = id;
    const leaving = lastNode.current;
    lastNode.current = children;
    window.clearTimeout(timer.current);

    // Focus was on the old content, which is gone now: give it to the new content before paint
    const prev = lastFocus.current;
    const active = document.activeElement;
    if (prev && !prev.isConnected && (!active || active === document.body)) {
      lastFocus.current = null;
      const target = layer.querySelector<HTMLElement>(FOCUSABLE);
      if (target) target.focus({ preventScroll: true });
      else {
        layer.setAttribute("tabindex", "-1");
        layer.focus({ preventScroll: true });
      }
    }

    const to = { w: layer.offsetWidth, h: layer.offsetHeight };
    if (reduced() || duration <= 0) {
      setExit(null);
      root.style.height = root.style.width = root.style.transition = "";
      root.removeAttribute("data-busy");
      busy.current = false;
      size.current = to;
      return;
    }

    // Mid-swap the box is already animating – start from where it is right now
    const r = root.getBoundingClientRect();
    const from = busy.current ? { w: r.width, h: r.height } : size.current;
    setExit({ id: lastId.current, node: leaving, n: ++counter.current, w: size.current.w, h: size.current.h });
    size.current = to;
    busy.current = true;
    root.setAttribute("data-busy", "");

    if (morph !== "none") {
      root.style.transition = "none";
      root.style.height = `${from.h}px`;
      if (morph === "both") root.style.width = `${from.w}px`;
      void root.offsetHeight;
      const t = `${duration}ms var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1))`;
      root.style.transition = morph === "both" ? `height ${t}, width ${t}` : `height ${t}`;
      root.style.height = `${to.h}px`;
      if (morph === "both") root.style.width = `${to.w}px`;
    }

    timer.current = window.setTimeout(() => {
      root.style.height = root.style.width = root.style.transition = "";
      root.removeAttribute("data-busy");
      busy.current = false;
      setExit(null);
    }, duration + 30);
    // Runs after every new id or children: the children of the current id are what leaves on the next swap
  }, [id, children, duration, morph]);

  // Keep the resting size current when the content changes on its own
  useEffect(() => {
    const layer = curRef.current;
    if (!layer || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (!busy.current) size.current = { w: layer.offsetWidth, h: layer.offsetHeight };
    });
    ro.observe(layer);
    size.current = { w: layer.offsetWidth, h: layer.offsetHeight };
    return () => ro.disconnect();
  }, [id]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const vars = {
    "--tc-blur-crossfade-duration": `${duration}ms`,
    "--tc-blur-crossfade-blur": `${blur}px`,
    ...style,
  } as CSSProperties;

  const Layer = Tag;
  return (
    <>
      <style href="ui-blur-crossfade" precedence="default">
        {css}
      </style>
      <Tag
        {...rest}
        ref={setRoot as never}
        className={["ui-bx", `ui-bx--${morph}`, className].filter(Boolean).join(" ")}
        style={vars}
      >
        <Layer
          key={`c-${id}`}
          ref={curRef as never}
          className={`ui-bx__layer${exit ? " ui-bx__layer--in" : ""}`}
        >
          {children}
        </Layer>
        {exit && (
          <Layer
            key={`x-${exit.id}-${exit.n}`}
            className="ui-bx__layer ui-bx__layer--out"
            aria-hidden="true"
            inert
            style={{ width: exit.w || undefined }}
          >
            {exit.node}
          </Layer>
        )}
      </Tag>
    </>
  );
}

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

.ui-bx {
  --tc-blur-crossfade-duration: 420ms;
  --tc-blur-crossfade-blur: 10px;
  position: relative;
  display: block;
}
.ui-bx--both {
  display: inline-block;
  vertical-align: top;
}
/* Clip only while swapping, so shadows and focus rings show the rest of the time */
.ui-bx[data-busy] { overflow: hidden; }

.ui-bx__layer { display: block; }
/* The new content takes focus only when focus had to move there (its old control is gone) */
.ui-bx__layer:focus-visible {
  outline: var(--tc-focus-ring-width, 2px) solid var(--tc-focus-ring, light-dark(#2f68ff, #6b95ff));
  outline-offset: var(--tc-focus-ring-offset, 2px);
}
.ui-bx--both > .ui-bx__layer { width: max-content; }
.ui-bx__layer--out {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
.ui-bx--height > .ui-bx__layer--out,
.ui-bx--none > .ui-bx__layer--out { right: 0; }
/* With width morph both layers stay centered in the gliding box */
.ui-bx--both > .ui-bx__layer--out { left: 50%; translate: -50% 0; }
.ui-bx--both > .ui-bx__layer--in { margin-left: 50%; translate: -50% 0; }

.ui-bx__layer--in {
  animation: ui-bx-in var(--tc-blur-crossfade-duration) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
}
.ui-bx__layer--out {
  animation: ui-bx-out calc(var(--tc-blur-crossfade-duration) * 0.8) var(--tc-ease-in, cubic-bezier(0.4, 0, 1, 1)) both;
}
@keyframes ui-bx-in {
  from { opacity: 0; filter: blur(var(--tc-blur-crossfade-blur)); transform: scale(0.98); }
  to { opacity: 1; filter: blur(0); transform: scale(1); }
}
@keyframes ui-bx-out {
  from { opacity: 1; filter: blur(0); transform: scale(1); }
  to { opacity: 0; filter: blur(var(--tc-blur-crossfade-blur)); transform: scale(1.02); }
}

@media (prefers-reduced-motion: reduce) {
  .ui-bx__layer--in, .ui-bx__layer--out { animation: none; }
  .ui-bx__layer--out { display: none; }
}
`;

"use client";

import {
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { useHotkey } from "../internal/use-hotkey";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";

/*
 * Toaster – calm toasts with an imperative API, in a single self-contained file.
 * Put <Toaster /> once near the root, then call toast("Saved"), toast.success(…), toast.error(…),
 * toast.promise(promise, { loading, success, error }) or toast.dismiss(id) from anywhere – no context needed.
 * Toasts stack in a corner: the newest in front, two more peeking behind it. Hovering or focusing the stack
 * fans it out into a list; every toast is measured, so heights and positions glide instead of jumping.
 * A promise toast morphs its spinner into a check or a cross while the text crossfades and the card resizes.
 * The timer pauses on hover, focus and while the tab is hidden; swipe a toast away or press Esc. Toasts with an action
 * stay until they're dismissed (WCAG 2.2.1) unless you give them a duration or set `actionDuration`.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop on <Toaster> (the default comes from the file: toaster.tsx is Standard,
 * toaster-clean.tsx is Clean). Clean draws one white card per toast with hairline shadows instead of borders,
 * Inter at 13px and 16px status icons; the markup, the API and the motion are the same. The look belongs to the
 * stack – each file keeps its own toast() store, as before.
 */
export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-ts";

export type ToastId = string | number;
export type ToastType = "default" | "success" | "error" | "info" | "loading";
export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

export type ToastAction = {
  label: string;
  /** Runs on click; the toast closes afterwards unless you call event.preventDefault() */
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
};

export type ToastOptions = {
  /** Pass the id of an existing toast to update it in place */
  id?: ToastId;
  description?: ReactNode;
  action?: ToastAction;
  /** In ms – Infinity keeps the toast until it's dismissed. Defaults to the Toaster's duration, or to its
   *  `actionDuration` (Infinity) when the toast has an action */
  duration?: number;
  /** Replaces the status icon */
  icon?: ReactNode;
  /** Sends the toast to the <Toaster id="…"> with this id instead of the default one */
  toaster?: string;
  /** Called when the toast closes – by its timer, a swipe, Esc, the close button or toast.dismiss() */
  onDismiss?: (id: ToastId) => void;
};

/** A title, or a title with a description */
export type ToastContent = ReactNode | { title: ReactNode; description?: ReactNode };

export type ToastPromiseMessages<T> = {
  loading: ToastContent;
  success: ToastContent | ((value: T) => ToastContent);
  error: ToastContent | ((error: unknown) => ToastContent);
};

type ToasterOwnProps = {
  /** Corner (or edge center) the stack sits in */
  position?: ToastPosition;
  /** Positions the stack inside the nearest positioned ancestor instead of the viewport – for previews and panels */
  inline?: boolean;
  /** Only shows toasts sent with { toaster: id } – for a second, separate stack. Not the element's DOM id */
  id?: string;
  /** Default time on screen in ms */
  duration?: number;
  /** Default time on screen for toasts with an action. Infinity (the default) keeps them until they're dismissed, so
   *  nobody has to hurry to reach the button (WCAG 2.2.1) */
  actionDuration?: number;
  /** How many toasts are visible at once; older ones wait behind */
  visibleToasts?: number;
  /** Always show the stack fanned out */
  expand?: boolean;
  /** Distance from the edges in px */
  offset?: number;
  /** Space between toasts when fanned out, in px */
  gap?: number;
  /** Key that moves focus to the newest toast (KeyboardEvent.key or .code) – `false` (or null) turns it off. Several
   *  toasters share one window listener per key; the newest that has a toast to focus takes the key */
  hotkey?: string | false | null;
  /** A 1px line along the bottom of a toast that runs down with its timer */
  hairline?: boolean;
  /** Show a close button on hover and focus (always on touch screens) */
  closeButton?: boolean;
  /** Name of the region for screen readers */
  label?: string;
  className?: string;
  /** Visual style. Defaults to the file's look: Standard in toaster.tsx, Clean in toaster-clean.tsx */
  look?: Look;
  ref?: Ref<HTMLElement>;
};

export type ToasterProps = Omit<ComponentPropsWithoutRef<"section">, keyof ToasterOwnProps> & ToasterOwnProps;

type ToastData = {
  id: ToastId;
  type: ToastType;
  title: ReactNode;
  description?: ReactNode;
  action?: ToastAction;
  duration?: number;
  icon?: ReactNode;
  toaster?: string;
  onDismiss?: (id: ToastId) => void;
  /** Goes up with every update – restarts the timer and crossfades the text */
  version: number;
  removing?: boolean;
  /** Unique per showing – a toast shown again with the same id while the old one still exits is a new item */
  key: string;
};

/* ---------- The store: a module-level list, so toast() works from anywhere ---------- */

let toasts: ToastData[] = [];
const listeners = new Set<() => void>();
const EMPTY: ToastData[] = [];
let counter = 0;
let shown = 0;
const exitTimers = new Set<number>();

const commit = (next: ToastData[]) => {
  toasts = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const getSnapshot = () => toasts;
const getServerSnapshot = () => EMPTY;

/** Adds a toast, or updates it when the id is already on screen */
function show(type: ToastType, title: ReactNode, options: ToastOptions = {}, onlyIfAlive = false): ToastId {
  const { id: given, ...rest } = options;
  const existing = given !== undefined ? toasts.find((t) => t.id === given && !t.removing) : undefined;
  if (existing) {
    commit(toasts.map((t) => (t === existing ? { ...t, ...rest, type, title, version: t.version + 1 } : t)));
    return existing.id;
  }
  const id = given ?? `toast-${++counter}`;
  // A promise that settles after its toast was dismissed doesn't bring it back
  if (onlyIfAlive) return id;
  // An exiting toast with the same id finishes its exit; this one enters fresh beside it, with its own timer
  commit([...toasts, { ...rest, id, type, title, version: 0, key: `${String(id)}#${++shown}` }]);
  return id;
}

const EXIT_MS = 420;

/** Closes one toast, or all of them without an id */
function dismiss(id?: ToastId) {
  const targets = toasts.filter((t) => !t.removing && (id === undefined || t.id === id));
  if (!targets.length) return;
  commit(toasts.map((t) => (targets.includes(t) ? { ...t, removing: true } : t)));
  targets.forEach((t) => t.onDismiss?.(t.id));
  // Kept a moment for the exit animation, then dropped
  const timer = window.setTimeout(() => {
    exitTimers.delete(timer);
    commit(toasts.filter((t) => !(t.removing && targets.some((x) => x.key === t.key))));
  }, EXIT_MS);
  exitTimers.add(timer);
}

/** Empties the store at once – no exit animation, no onDismiss – and cancels pending exits. Meant for tests
 *  (e.g. in afterEach), since the store lives at module level and would otherwise carry toasts between them */
export function resetToasts() {
  exitTimers.forEach((t) => window.clearTimeout(t));
  exitTimers.clear();
  counter = 0;
  shown = 0;
  commit([]);
}

const isContentObject = (c: unknown): c is { title: ReactNode; description?: ReactNode } =>
  typeof c === "object" && c !== null && !isValidElement(c) && !Array.isArray(c) && "title" in c;
const split = (c: ToastContent) => (isContentObject(c) ? c : { title: c, description: undefined });

function promise<T>(
  input: Promise<T> | (() => Promise<T>),
  messages: ToastPromiseMessages<T>,
  options: Omit<ToastOptions, "id"> & { id?: ToastId } = {},
): Promise<T> {
  const run = typeof input === "function" ? input() : input;
  const first = split(messages.loading);
  const id = show("loading", first.title, { ...options, description: first.description });
  const settle = (type: "success" | "error", content: ToastContent) => {
    const c = split(content);
    // `description` is always passed, so a loading description doesn't linger
    show(type, c.title, { ...options, id, description: c.description }, true);
  };
  run.then(
    (value) => settle("success", typeof messages.success === "function" ? messages.success(value) : messages.success),
    (error: unknown) => settle("error", typeof messages.error === "function" ? messages.error(error) : messages.error),
  );
  return run;
}

/** toast("Saved"), toast.success(…), toast.error(…), toast.info(…), toast.loading(…), toast.promise(…), toast.dismiss(id?) */
export const toast = Object.assign((title: ReactNode, options?: ToastOptions) => show("default", title, options), {
  success: (title: ReactNode, options?: ToastOptions) => show("success", title, options),
  error: (title: ReactNode, options?: ToastOptions) => show("error", title, options),
  info: (title: ReactNode, options?: ToastOptions) => show("info", title, options),
  /** Stays until you update it (same id) or dismiss it */
  loading: (title: ReactNode, options?: ToastOptions) => show("loading", title, options),
  promise,
  dismiss,
});

/* ---------- Icons ---------- */

/** One drawing for every state: the ring spins as an arc while loading, then closes while a check or cross draws in */
function StatusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="ui-ts__status" aria-hidden="true">
      <g className="ui-ts__spin">
        <circle className="ui-ts__ring" cx="12" cy="12" r="9.25" pathLength={1} />
      </g>
      <path className="ui-ts__mark ui-ts__check" d="M8.3 12.4l2.5 2.5 4.9-5.3" pathLength={1} />
      <path className="ui-ts__mark ui-ts__x1" d="M9.5 9.5l5 5" pathLength={1} />
      <path className="ui-ts__mark ui-ts__x2" d="M14.5 9.5l-5 5" pathLength={1} />
      <path className="ui-ts__info" d="M12 11.2v4.6M12 8.2h.01" />
    </svg>
  );
}

const CloseGlyph = () => (
  <svg viewBox="0 0 24 24" className="ui-ts__glyph" aria-hidden="true">
    <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
  </svg>
);

/* ---------- One toast ---------- */

/** Wall clock for the pause bookkeeping – read in effects only, never during render */
const clock = () => Date.now();

type Layout = { y: number; scale: number; height: number; z: number; behind: boolean; hidden: boolean };

const keyOf = (t: ToastData) => t.key;

function ToastItem({
  t,
  layout,
  edge,
  paused,
  defaultDuration,
  actionDuration,
  hairline,
  closeButton,
  onHeight,
}: {
  t: ToastData;
  layout: Layout;
  /** 1 when the stack sits at the bottom (down = out), -1 at the top */
  edge: 1 | -1;
  paused: boolean;
  defaultDuration: number;
  actionDuration: number;
  hairline: boolean;
  closeButton: boolean;
  onHeight: (key: string, height: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [ghost, setGhost] = useState<{ title: ReactNode; description?: ReactNode; version: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<HTMLDivElement>(null);
  const prev = useRef({ title: t.title, description: t.description, version: t.version });
  const ghostTimer = useRef(0);
  const timer = useRef({ version: -1, left: 0 });
  const drag = useRef<{ pointer: number; x: number; y: number; axis: "x" | "y" | null; samples: { v: number; at: number }[] } | null>(null);
  const dragged = useRef(false);
  const removing = !!t.removing;

  // Painted once off-screen, then lifted in
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Every toast measures its content – the stack positions and heights are built from these
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const key = keyOf(t);
    const report = () => onHeight(key, el.offsetHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // New text: the old one stays on top for a moment and fades out while the new one fades in
  useLayoutEffect(() => {
    const old = prev.current;
    if (old.version === t.version) return;
    prev.current = { title: t.title, description: t.description, version: t.version };
    if (old.title === t.title && old.description === t.description) return;
    setGhost(old);
    window.clearTimeout(ghostTimer.current);
    ghostTimer.current = window.setTimeout(() => setGhost(null), 320);
  }, [t.version]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => window.clearTimeout(ghostTimer.current), []);

  // The timer: restarts on every update, keeps what's left while paused
  const duration = t.duration ?? (t.action ? actionDuration : defaultDuration);
  const timed = t.type !== "loading" && Number.isFinite(duration);
  const running = timed && !paused && !swiping && !removing;
  useEffect(() => {
    if (timer.current.version !== t.version) timer.current = { version: t.version, left: duration };
    if (!running) return;
    const version = t.version;
    const started = clock();
    const id = window.setTimeout(() => dismiss(t.id), Math.max(0, timer.current.left));
    return () => {
      window.clearTimeout(id);
      if (timer.current.version === version) timer.current.left -= clock() - started;
    };
  }, [running, t.version, duration, t.id]);

  /* Swipe: sideways in both directions, or out over the near edge; anything else rubber-bands back */
  const onPointerDown = (e: ReactPointerEvent<HTMLLIElement>) => {
    if (e.button !== 0 || removing) return;
    if ((e.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    drag.current = { pointer: e.pointerId, x: e.clientX, y: e.clientY, axis: null, samples: [] };
    dragged.current = false;
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLLIElement>) => {
    const d = drag.current;
    const el = swipeRef.current;
    if (!d || d.pointer !== e.pointerId || !el) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.axis) {
      if (Math.hypot(dx, dy) < 6) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      e.currentTarget.setPointerCapture(e.pointerId);
      dragged.current = true;
      setSwiping(true);
      el.style.transition = "none";
    }
    let v = d.axis === "x" ? dx : dy;
    const outward = d.axis === "x" || v * edge > 0;
    // Pulling inwards only gives a little – like a rubber band
    if (!outward) v = Math.sign(v) * Math.pow(Math.abs(v), 0.7) * 0.6;
    const size = d.axis === "x" ? el.offsetWidth : el.offsetHeight * 2;
    el.style.transform = d.axis === "x" ? `translateX(${v}px)` : `translateY(${v}px)`;
    el.style.opacity = outward ? String(Math.max(0.25, 1 - Math.abs(v) / (size * 1.1))) : "";
    d.samples.push({ v, at: e.timeStamp });
    if (d.samples.length > 6) d.samples.shift();
  };
  const endDrag = (e: ReactPointerEvent<HTMLLIElement>) => {
    const d = drag.current;
    const el = swipeRef.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    if (!d.axis || !el) return;
    setSwiping(false);
    const last = d.samples[d.samples.length - 1] ?? { v: 0, at: 0 };
    const first = d.samples[0] ?? last;
    const velocity = last.at > first.at ? (last.v - first.v) / (last.at - first.at) : 0; // px per ms
    const outward = d.axis === "x" || last.v * edge > 0;
    const fast = Math.abs(velocity) > 0.45 && Math.sign(velocity) === Math.sign(last.v);
    if (e.type === "pointerup" && outward && (Math.abs(last.v) > 64 || fast)) {
      const distance = (d.axis === "x" ? el.offsetWidth : el.offsetHeight) + 48;
      el.style.transition = "transform var(--tc-duration-slow) var(--tc-ease-out), opacity var(--tc-duration-base) var(--tc-ease-standard)";
      el.style.transform = `${d.axis === "x" ? "translateX" : "translateY"}(${Math.sign(last.v) * distance}px)`;
      el.style.opacity = "0";
      dismiss(t.id);
    } else {
      el.style.transition = "";
      el.style.transform = "";
      el.style.opacity = "";
    }
  };

  const inward = -edge;
  let transform = `translateY(${inward * layout.y}px) scale(${layout.scale})`;
  if (!mounted) transform = `translateY(${edge * 100}%) scale(${layout.scale})`;
  if (removing) transform = `translateY(${inward * layout.y + edge * 10}px) scale(${layout.scale * 0.96})`;

  const icon = t.type === "loading" ? <StatusIcon /> : t.icon ?? (t.type === "default" ? null : <StatusIcon />);

  return (
    <li
      className="ui-ts__toast"
      data-toast-id={String(t.id)}
      data-toast-key={keyOf(t)}
      data-type={t.type}
      data-behind={layout.behind || undefined}
      data-removing={removing || undefined}
      data-swiping={swiping || undefined}
      tabIndex={0}
      inert={layout.hidden || removing}
      style={{
        transform,
        opacity: !mounted || removing || layout.hidden ? 0 : 1,
        height: layout.height ? `${layout.height}px` : undefined,
        zIndex: layout.z,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(e) => {
        // A swipe is not a click
        if (!dragged.current) return;
        dragged.current = false;
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div ref={swipeRef} className="ui-ts__swipe">
        <div className="ui-ts__card">
          <div ref={contentRef} className="ui-ts__content" data-action={t.action ? "" : undefined}>
            {icon && (
              <span className="ui-ts__icon" data-type={t.icon && t.type !== "loading" ? "custom" : t.type}>
                {icon}
              </span>
            )}
            <div className="ui-ts__text">
              <div className="ui-ts__copy" key={t.version} data-changed={t.version > 0 || undefined}>
                <div className="ui-ts__title">{t.title}</div>
                {t.description != null && t.description !== "" && <div className="ui-ts__desc">{t.description}</div>}
              </div>
              {ghost && (
                <div className="ui-ts__copy ui-ts__ghost" key={`ghost-${ghost.version}`} aria-hidden="true">
                  <div className="ui-ts__title">{ghost.title}</div>
                  {ghost.description != null && ghost.description !== "" && <div className="ui-ts__desc">{ghost.description}</div>}
                </div>
              )}
            </div>
            {t.action && (
              <button
                type="button"
                className="ui-ts__action"
                onClick={(e) => {
                  t.action!.onClick(e);
                  if (!e.defaultPrevented) dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
          {hairline && timed && (
            <span
              key={t.version}
              className="ui-ts__timer"
              aria-hidden="true"
              style={{ animationDuration: `${duration}ms`, animationPlayState: running ? "running" : "paused" }}
            />
          )}
        </div>
        {closeButton && (
          <button type="button" className="ui-ts__close" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}>
            <CloseGlyph />
          </button>
        )}
      </div>
    </li>
  );
}

/* ---------- The stack ---------- */

const PEEK = 10; // px each toast behind peeks out
const SHRINK = 0.05; // scale step per toast behind
const HIDDEN: Layout = { y: 0, scale: 1, height: 0, z: 0, behind: false, hidden: true };

export function Toaster({
  position = "bottom-right",
  inline = false,
  id,
  duration = 4000,
  actionDuration = Infinity,
  visibleToasts = 3,
  expand = false,
  offset,
  gap = 10,
  hotkey = "F8",
  hairline = true,
  closeButton = true,
  label = "Notifications",
  className,
  look,
  ref,
  style: styleProp,
  onKeyDown: onKeyDownProp,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  onPointerDownCapture,
  onPointerEnter,
  onPointerLeave,
  onClick,
  ...rest
}: ToasterProps) {
  const all = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Any focus inside pauses the timers (a screen reader or a script may move focus without :focus-visible);
  // only keyboard focus fans the stack out
  const [focusInside, setFocusInside] = useState(false);
  const [touched, setTouched] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");
  const sectionRef = useRef<HTMLElement | null>(null);
  // The root is ours (focus, announcements) and the consumer's
  const setSection = useCallback(
    (el: HTMLElement | null) => {
      sectionRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );
  const frozen = useRef(new Map<string, Layout>());
  const lastFront = useRef(0);
  const returnFocus = useRef<HTMLElement | null>(null);
  const pointerType = useRef("mouse");
  const announced = useRef(new Map<string, number>());

  const [yEdge, xEdge] = position.split("-") as ["top" | "bottom", "left" | "center" | "right"];
  const edge: 1 | -1 = yEdge === "bottom" ? 1 : -1;

  // Newest first – that's the order for the stack, the DOM and Tab
  const list = all.filter((t) => (t.toaster ?? null) === (id ?? null)).reverse();
  const live = list.filter((t) => !t.removing);
  const expanded = expand || hovered || focused || touched;
  const paused = hovered || focused || focusInside || touched || tabHidden;
  const limit = Math.max(1, visibleToasts);

  const onHeight = useCallback((key: string, h: number) => {
    setHeights((map) => (map[key] === h ? map : { ...map, [key]: h }));
  }, []);

  /* Layout: collapsed, every toast takes the front toast's height and peeks out a little;
     expanded, each one keeps its own height and they line up with a gap */
  const frontHeight = (live[0] && heights[keyOf(live[0])]) || lastFront.current;
  if (frontHeight) lastFront.current = frontHeight;
  const layouts = new Map<string, Layout>();
  let stacked = 0;
  live.forEach((t, i) => {
    const own = heights[keyOf(t)] ?? 0;
    const depth = Math.min(i, limit - 1);
    const layout: Layout = expanded
      ? { y: stacked, scale: 1, height: own, z: live.length - i, behind: false, hidden: i >= limit }
      : { y: depth * PEEK, scale: 1 - depth * SHRINK, height: i === 0 ? own : frontHeight, z: live.length - i, behind: i > 0, hidden: i >= limit };
    if (i < limit) stacked += own + gap;
    layouts.set(keyOf(t), layout);
    // Leaving toasts stay exactly where they were while they fade
    frozen.current.set(keyOf(t), layout);
  });
  const shown = Math.min(live.length, limit);
  const stackHeight = !live.length ? 0 : expanded ? Math.max(0, stacked - gap) : frontHeight + PEEK * (shown - 1);

  // Forget the sizes of toasts that are gone
  useEffect(() => {
    const keys = new Set(list.map(keyOf));
    setHeights((map) => {
      const stale = Object.keys(map).filter((k) => !keys.has(k));
      if (!stale.length) return map;
      const next = { ...map };
      stale.forEach((k) => delete next[k]);
      return next;
    });
    frozen.current.forEach((_, k) => !keys.has(k) && frozen.current.delete(k));
    if (!live.length) setTouched(false);
  }, [all]); // eslint-disable-line react-hooks/exhaustive-deps

  // Read new and changed toasts out – errors right away, everything else politely
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    live.forEach((t) => {
      const key = keyOf(t);
      if (announced.current.get(key) === t.version) return;
      announced.current.set(key, t.version);
      const node = Array.from(section.querySelectorAll<HTMLElement>("[data-toast-id]")).find((el) => el.dataset.toastKey === key);
      const text = node?.querySelector(".ui-ts__copy:not(.ui-ts__ghost)")?.textContent?.trim();
      if (!text) return;
      // A trailing no-break space that alternates makes the same message count as new
      const set = t.type === "error" ? setAssertive : setPolite;
      set((old) => (old === text ? `${text} ` : text));
    });
    announced.current.forEach((_, k) => !list.some((t) => keyOf(t) === k) && announced.current.delete(k));
  }, [all]); // eslint-disable-line react-hooks/exhaustive-deps

  // The timer also waits while the tab is in the background
  useEffect(() => {
    const sync = () => setTabHidden(document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // Touch: a tap fans the stack out, a tap anywhere else folds it again
  useEffect(() => {
    if (!touched) return;
    const onDown = (e: PointerEvent) => {
      if (!sectionRef.current?.contains(e.target as Node)) setTouched(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [touched]);

  const toastNodes = () => Array.from(sectionRef.current?.querySelectorAll<HTMLElement>("[data-toast-id]:not([data-removing])") ?? []);

  // The hotkey jumps to the newest toast; Esc or Tab out gives focus back. Off: no listener, no preventDefault
  const focusNewest = useRef<() => boolean>(() => false);
  // Kept after each commit, never written during render
  useLayoutEffect(() => {
    focusNewest.current = () => {
      const first = toastNodes().find((el) => !el.inert);
      if (!first) return false;
      if (!sectionRef.current?.contains(document.activeElement)) returnFocus.current = document.activeElement as HTMLElement | null;
      first.focus();
      return true;
    };
  });
  useHotkey(hotkey, () => focusNewest.current());

  // Close, an action or a timer took the focused toast away: focus goes to the next toast, else back to where it
  // was before the hotkey, else the region – never to <body> (WCAG 2.4.3)
  useFocusRescue(sectionRef, {
    fallback: () => toastNodes().find((el) => !el.inert) ?? (returnFocus.current?.isConnected ? returnFocus.current : null),
  });

  const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    onKeyDownProp?.(e);
    if (e.key !== "Escape" || !live.length || e.defaultPrevented) return;
    e.preventDefault();
    e.stopPropagation();
    // The focused toast if there is one, otherwise the newest
    const host = (e.target as HTMLElement).closest<HTMLElement>("[data-toast-id]");
    const target = live.find((t) => keyOf(t) === host?.dataset.toastKey) ?? live[0];
    const index = live.indexOf(target);
    const next = live.filter((t) => t !== target)[Math.min(index, live.length - 2)];
    const nextNode = next && toastNodes().find((el) => el.dataset.toastKey === keyOf(next));
    // Focus moves first – to the next toast, back to where it was before the hotkey, or the region
    rescueFocus(sectionRef.current, [nextNode, () => (returnFocus.current?.isConnected ? returnFocus.current : null), sectionRef.current]);
    dismiss(target.id);
  };

  const onFocus = (e: ReactFocusEvent<HTMLElement>) => {
    onFocusProp?.(e);
    // Only keyboard focus fans the stack out – a mouse click shouldn't keep it open after leaving
    if ((e.target as HTMLElement).matches(":focus-visible")) setFocused(true);
    setFocusInside(true);
  };
  const onBlur = (e: ReactFocusEvent<HTMLElement>) => {
    onBlurProp?.(e);
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setFocused(false);
      setFocusInside(false);
    }
  };

  const style = { ...styleProp, "--tc-toaster-offset": offset !== undefined ? `${offset}px` : undefined } as CSSProperties;

  return (
    <section
      {...rest}
      ref={setSection}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={look ?? DEFAULT_LOOK}
      data-y={yEdge}
      data-x={xEdge}
      data-inline={inline || undefined}
      data-expanded={expanded || undefined}
      data-empty={!live.length || undefined}
      aria-label={hotkey ? `${label} (${hotkey})` : label}
      tabIndex={-1}
      style={style}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      onPointerDownCapture={(e) => {
        pointerType.current = e.pointerType;
        onPointerDownCapture?.(e);
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHovered(true);
        onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setHovered(false);
        onPointerLeave?.(e);
      }}
      onClick={(e) => {
        if (pointerType.current !== "mouse" && live.length > 1) setTouched(true);
        onClick?.(e);
      }}
    >
      {/* React 19 hoists this into <head> once, no matter how many toasters render */}
      <style href="ui-toaster" precedence="default">
        {css}
      </style>

      <ol className="ui-ts__list" style={{ height: `${stackHeight}px` }}>
        {list.map((t) => (
          <ToastItem
            key={keyOf(t)}
            t={t}
            layout={layouts.get(keyOf(t)) ?? frozen.current.get(keyOf(t)) ?? HIDDEN}
            edge={edge}
            paused={paused || (layouts.get(keyOf(t))?.hidden ?? false)}
            defaultDuration={duration}
            actionDuration={actionDuration}
            hairline={hairline}
            closeButton={closeButton}
            onHeight={onHeight}
          />
        ))}
      </ol>

      <div className="ui-ts__sr" role="status">
        {polite}
      </div>
      <div className="ui-ts__sr" role="alert">
        {assertive}
      </div>
    </section>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Colors and motion as variables – override them on .ui-ts */
:where([data-look="standard"], [data-look="standard"] *).ui-ts {
  --tc-toaster-width: 356px;
  --tc-toaster-offset: 24px;
  position: fixed;
  z-index: var(--tc-z-toast);
  box-sizing: border-box;
  width: var(--tc-toaster-width);
  max-width: calc(100% - 2 * var(--tc-toaster-offset));
  margin: 0;
  padding: 0;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md-plus);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
  outline: none;
}
/* Colors and motion as variables – override them on .ui-ts */
:where([data-look="clean"], [data-look="clean"] *).ui-ts {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  /* Toasts float above the page: the same hairline with a wider, very soft drop */
  --tc-toaster-width: 356px;
  --tc-toaster-offset: 24px;
  position: fixed;
  z-index: var(--tc-z-toast);
  box-sizing: border-box;
  container-type: inline-size;
  width: var(--tc-toaster-width);
  max-width: calc(100% - 2 * var(--tc-toaster-offset));
  margin: 0;
  padding: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  outline: none;
}
.ui-ts[data-inline] { position: absolute; z-index: var(--tc-z-toast); --tc-toaster-offset: 20px; }
.ui-ts[data-empty] { pointer-events: none; }
.ui-ts *, .ui-ts *::before, .ui-ts *::after { box-sizing: border-box; }
:where(.ui-ts) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where(.ui-ts) svg { display: block; flex: none; }
.ui-ts button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The region itself takes focus only as a last resort (nothing left to focus) – it shows where focus is */
.ui-ts:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); border-radius: var(--tc-card-radius); }
/* Corners and edge centers */
.ui-ts[data-y="bottom"] { bottom: var(--tc-toaster-offset); }
.ui-ts[data-y="top"] { top: var(--tc-toaster-offset); }
.ui-ts[data-x="right"] { right: var(--tc-toaster-offset); }
.ui-ts[data-x="left"] { left: var(--tc-toaster-offset); }
.ui-ts[data-x="center"] { left: 50%; transform: translateX(-50%); }
.ui-ts:not([data-inline])[data-y="bottom"] { bottom: max(var(--tc-toaster-offset), env(safe-area-inset-bottom)); }
.ui-ts__list { position: relative; isolation: isolate; margin: 0; padding: 0; list-style: none; }
/* A toast: positioned by transform, sized by height – both glide */
.ui-ts__toast {
  position: absolute;
  left: 0;
  right: 0;
  outline: none;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  transition: transform var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slow) var(--tc-ease-standard), height var(--tc-duration-slower) var(--tc-ease-move);
}
.ui-ts[data-y="bottom"] .ui-ts__toast { bottom: 0; transform-origin: 50% 0; }
.ui-ts[data-y="top"] .ui-ts__toast { top: 0; transform-origin: 50% 100%; }
.ui-ts__toast[data-removing] { pointer-events: none; transition: transform var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard), height var(--tc-duration-slower) var(--tc-ease-move); }
/* The swipe layer moves on its own, so the stack's transform never fights the finger */
.ui-ts__swipe { position: relative; height: 100%; transition: transform var(--tc-duration-slower) var(--tc-ease-spring), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-ts__toast[data-swiping] { cursor: grabbing; }
/* One card per toast – the edge is a shadow, not a border */
.ui-ts__card { position: relative; height: 100%; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-overlay); }
.ui-ts__toast:focus-visible .ui-ts__card { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* Content is measured; the card clips it while it grows or shrinks */
:where([data-look="standard"], [data-look="standard"] *).ui-ts__content { display: flex; align-items: flex-start; gap: 10px; padding: 14px; transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ts__content[data-action] { padding-right: 10px; }
/* Content is measured; the card clips it while it grows or shrinks */
:where([data-look="clean"], [data-look="clean"] *).ui-ts__content { display: flex; align-items: flex-start; gap: 8px; padding: 12px 14px 12px 12px; transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ts__content[data-action] { padding-right: 12px; }
/* Toasts behind the front one only show their edge */
.ui-ts__toast[data-behind] .ui-ts__content,
.ui-ts__toast[data-behind] .ui-ts__timer { opacity: 0; }
.ui-ts__text { position: relative; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ts__title { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); overflow-wrap: anywhere; }
:where([data-look="standard"], [data-look="standard"] *).ui-ts__desc { margin-top: 1px; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-ts__title { font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-strong); overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-ts__desc { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); overflow-wrap: anywhere; }
/* Changed text slides in with a soft blur; the old text fades out on top */
.ui-ts__copy[data-changed] { animation: ui-ts-text-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-ts__ghost { position: absolute; top: 0; left: 0; right: 0; pointer-events: none; animation: ui-ts-text-out var(--tc-duration-base) var(--tc-ease-standard) both; }
/* Status icon: one drawing that morphs from spinner to check or cross */
:where([data-look="standard"], [data-look="standard"] *).ui-ts__icon { display: grid; place-items: center; flex: none; width: 20px; height: 20px; color: var(--tc-text-muted); transition: color var(--tc-duration-slow) var(--tc-ease-standard); }
/* Status icon, 16px on the title's line: one drawing that morphs from spinner to check or cross */
:where([data-look="clean"], [data-look="clean"] *).ui-ts__icon { display: grid; place-items: center; flex: none; width: 16px; height: 20px; color: var(--tc-icon-muted); transition: color var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-ts__icon[data-type="success"] { color: var(--tc-status-success-fg); }
.ui-ts__icon[data-type="error"] { color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ts__icon[data-type="info"] { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ts__icon[data-type="custom"] > * { width: 18px; height: 18px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ts__status { width: 18px; height: 18px; overflow: visible; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-ts__icon[data-type="info"] { color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-ts__icon[data-type="custom"] > * { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ts__status { width: 16px; height: 16px; overflow: visible; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.ui-ts__icon[data-type="success"] .ui-ts__status,
.ui-ts__icon[data-type="error"] .ui-ts__status { animation: ui-ts-pop var(--tc-duration-slower) var(--tc-ease-spring) both; }
.ui-ts__spin { transform-box: fill-box; transform-origin: center; animation: ui-ts-spin var(--tc-duration-reveal) linear infinite; animation-play-state: paused; }
.ui-ts__icon[data-type="loading"] .ui-ts__spin { animation-play-state: running; }
/* The arc closes into a quiet ring; the spin freezes where it is, so nothing jumps */
:where([data-look="standard"], [data-look="standard"] *).ui-ts__ring { stroke-dasharray: 1 0; stroke-opacity: 0.28; transition: stroke-dasharray var(--tc-duration-slowest) var(--tc-ease-move), stroke-opacity var(--tc-duration-slow) var(--tc-ease-standard); }
/* The arc closes into a quiet ring; the spin freezes where it is, so nothing jumps */
:where([data-look="clean"], [data-look="clean"] *).ui-ts__ring { stroke-dasharray: 1 0; stroke-opacity: 0.24; transition: stroke-dasharray var(--tc-duration-slowest) var(--tc-ease-move), stroke-opacity var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-ts__icon[data-type="loading"] .ui-ts__ring { stroke-dasharray: 0.28 0.72; stroke-opacity: 1; }
.ui-ts__mark { stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }
.ui-ts__info { opacity: 0; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-ts__icon[data-type="success"] .ui-ts__check,
.ui-ts__icon[data-type="error"] .ui-ts__x1,
.ui-ts__icon[data-type="error"] .ui-ts__x2 { opacity: 1; stroke-dashoffset: 0; animation: ui-ts-draw var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-fast) both; }
.ui-ts__icon[data-type="error"] .ui-ts__x2 { animation-delay: var(--tc-duration-moderate); }
.ui-ts__icon[data-type="info"] .ui-ts__info { opacity: 1; }
/* The action: a secondary button, like Button's (control tokens; 28px in both looks) */
.ui-ts__action {
  flex: none;
  align-self: center;
  margin: -4px 0;
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-action-secondary-fg);
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ts__action { height: var(--tc-control-h-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-ts__action { height: var(--tc-control-h-md); }
.ui-ts__action:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-ts__action:active { transform: scale(0.97); }
/* Close: a small round button on the corner (24px – 2.5.8), shown on hover and focus */
.ui-ts__close {
  position: absolute;
  top: -8px;
  left: -8px;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: var(--tc-radius-full);
  background: var(--tc-surface-overlay);
  box-shadow: var(--tc-shadow-raised);
  color: var(--tc-icon-muted);
  opacity: 0;
  transform: scale(0.8);
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-move), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ts__close:hover { color: var(--tc-text-primary); box-shadow: var(--tc-shadow-raised-hover); }
.ui-ts__close::before { content: ""; position: absolute; inset: -4px; }
.ui-ts__toast:not([data-behind]):hover .ui-ts__close,
.ui-ts__toast:not([data-behind]):focus-within .ui-ts__close { opacity: 1; transform: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-ts__glyph { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
/* The timer as a hairline – it stops whenever the timer does */
:where([data-look="standard"], [data-look="standard"] *).ui-ts__timer {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 0;
  height: 1px;
  background: var(--tc-border-subtle);
  transform-origin: left;
  animation-name: ui-ts-timer;
  animation-timing-function: linear;
  animation-fill-mode: both;
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ts__glyph { width: 10px; height: 10px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; }
/* The timer as a hairline – it stops whenever the timer does */
:where([data-look="clean"], [data-look="clean"] *).ui-ts__timer {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 1px;
  background: var(--tc-border-subtle);
  transform-origin: left;
  animation-name: ui-ts-timer;
  animation-timing-function: linear;
  animation-fill-mode: both;
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
.ui-ts__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-ts-spin { to { transform: rotate(360deg); } }
@keyframes ui-ts-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes ui-ts-pop { 0% { transform: scale(0.82); } 55% { transform: scale(1.08); } 100% { transform: scale(1); } }
@keyframes ui-ts-timer { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@keyframes ui-ts-text-in { from { opacity: 0; transform: translateY(4px); filter: blur(3px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ui-ts-text-out { from { opacity: 1; } to { opacity: 0; transform: translateY(-4px); filter: blur(3px); } }
/* Narrow stacks: a little less padding */
@container (max-width: 300px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ts__content { padding: 10px 12px 10px 10px; }
}
/* Phones: full width along the edge with 12px gutters */
@media (max-width: 600px) {
  .ui-ts, .ui-ts[data-x] { left: 12px; right: 12px; width: auto; max-width: none; transform: none; }
  .ui-ts[data-y="bottom"] { bottom: 12px; }
  .ui-ts:not([data-inline])[data-y="bottom"] { bottom: max(12px, env(safe-area-inset-bottom)); }
  .ui-ts[data-y="top"] { top: 12px; }
}
/* Touch screens: the close button always shows, with a bigger hit area, and a taller action button */
@media (hover: none) and (pointer: coarse) {
.ui-ts__toast:not([data-behind]) .ui-ts__close { opacity: 1; transform: none; }
.ui-ts__close::before { inset: -8px; }
.ui-ts__action { height: 36px; margin: -8px -2px -8px 0; padding: 0 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ts__action { border-radius: var(--tc-radius-lg); font-size: var(--tc-font-size-md); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-ts *:not(.ui-ts__spin):not(.ui-ts__timer), .ui-ts *::before, .ui-ts *::after { animation: none !important; transition: none !important; }
}
`;

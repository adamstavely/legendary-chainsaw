import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, HotkeyController, rescueFocus } from "./internal/controllers";

/*
 * <tc-toaster> – the Lit port of src/components/toaster.tsx: calm toasts with an imperative API.
 * Put <tc-toaster> once near the root, then call toast("Saved"), toast.success(…), toast.error(…),
 * toast.promise(promise, { loading, success, error }) or toast.dismiss(id) from anywhere.
 *
 *   import { toast } from "trenchcoat/toaster";
 *   <tc-toaster position="bottom-right"></tc-toaster>
 *   toast.success("Invoice sent", { description: "INV-2041" });
 *
 * Toasts stack in a corner: the newest in front, two more peeking behind it. Hovering or focusing the stack fans it
 * out into a list; every toast is measured, so heights and positions glide instead of jumping. A promise toast morphs
 * its spinner into a check or a cross while the text crossfades and the card resizes. The timer pauses on hover, focus
 * and while the tab is hidden; swipe a toast away or press Esc. Toasts with an action stay until they're dismissed
 * (WCAG 2.2.1) unless they have a duration or the toaster an `actionDuration`.
 *
 * The host is the region (role="region", named by `label` and the hotkey). Titles and descriptions are strings or DOM
 * nodes; a custom icon is an Element, cloned into the toast.
 */

export type ToastId = string | number;
export type ToastType = "default" | "success" | "error" | "info" | "loading";
export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
/** A toast's title or description: text, or a DOM node shown as it is */
export type ToastText = string | Node;

export type ToastAction = {
  label: string;
  /** Runs on click; the toast closes afterwards unless you call event.preventDefault() */
  onClick: (event: MouseEvent) => void;
};

export type ToastOptions = {
  /** Pass the id of an existing toast to update it in place */
  id?: ToastId;
  description?: ToastText;
  action?: ToastAction;
  /** In ms – Infinity keeps the toast until it's dismissed. Defaults to the toaster's duration, or to its
   *  `actionDuration` (Infinity) when the toast has an action */
  duration?: number;
  /** Replaces the status icon (cloned) */
  icon?: Element;
  /** Sends the toast to the <tc-toaster stack="…"> with this name instead of the default one */
  toaster?: string;
  /** Called when the toast closes – by its timer, a swipe, Esc, the close button or toast.dismiss() */
  onDismiss?: (id: ToastId) => void;
};

/** A title, or a title with a description */
export type ToastContent = ToastText | { title: ToastText; description?: ToastText };

export type ToastPromiseMessages<T> = {
  loading: ToastContent;
  success: ToastContent | ((value: T) => ToastContent);
  error: ToastContent | ((error: unknown) => ToastContent);
};

type ToastData = {
  id: ToastId;
  type: ToastType;
  title: ToastText;
  description?: ToastText;
  action?: ToastAction;
  duration?: number;
  icon?: Element;
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
let counter = 0;
let shown = 0;
const exitTimers = new Set<number>();

const commit = (next: ToastData[]) => {
  toasts = next;
  listeners.forEach((l) => l());
};

/** Adds a toast, or updates it when the id is already on screen */
function show(type: ToastType, title: ToastText, options: ToastOptions = {}, onlyIfAlive = false): ToastId {
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

const isContentObject = (c: unknown): c is { title: ToastText; description?: ToastText } =>
  typeof c === "object" && c !== null && !(c instanceof Node) && !Array.isArray(c) && "title" in c;
const split = (c: ToastContent) => (isContentObject(c) ? c : { title: c, description: undefined });

function promise<T>(input: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>, options: Omit<ToastOptions, "id"> & { id?: ToastId } = {}): Promise<T> {
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
export const toast = Object.assign((title: ToastText, options?: ToastOptions) => show("default", title, options), {
  success: (title: ToastText, options?: ToastOptions) => show("success", title, options),
  error: (title: ToastText, options?: ToastOptions) => show("error", title, options),
  info: (title: ToastText, options?: ToastOptions) => show("info", title, options),
  /** Stays until you update it (same id) or dismiss it */
  loading: (title: ToastText, options?: ToastOptions) => show("loading", title, options),
  promise,
  dismiss,
});

/* ---------- Icons ---------- */

/** One drawing for every state: the ring spins as an arc while loading, then closes while a check or cross draws in */
const statusIcon = html`<svg viewBox="0 0 24 24" class="ui-ts__status" aria-hidden="true">${svg`
  <g class="ui-ts__spin"><circle class="ui-ts__ring" cx="12" cy="12" r="9.25" pathLength="1"></circle></g>
  <path class="ui-ts__mark ui-ts__check" d="M8.3 12.4l2.5 2.5 4.9-5.3" pathLength="1"></path>
  <path class="ui-ts__mark ui-ts__x1" d="M9.5 9.5l5 5" pathLength="1"></path>
  <path class="ui-ts__mark ui-ts__x2" d="M14.5 9.5l-5 5" pathLength="1"></path>
  <path class="ui-ts__info" d="M12 11.2v4.6M12 8.2h.01"></path>`}</svg>`;
const closeGlyph = html`<svg viewBox="0 0 24 24" class="ui-ts__glyph" aria-hidden="true">${svg`<path d="M7.5 7.5l9 9M16.5 7.5l-9 9"></path>`}</svg>`;

/* ---------- Per-toast bookkeeping ---------- */

/** Wall clock for the pause bookkeeping – read in event and timer code only, never while rendering */
const clock = () => Date.now();

type Layout = { y: number; scale: number; height: number; z: number; behind: boolean; hidden: boolean };
type Copy = { title: ToastText; description?: ToastText; version: number };
type Drag = { pointer: number; x: number; y: number; axis: "x" | "y" | null; samples: { v: number; at: number }[] };
type Item = {
  mounted: boolean;
  raf: number;
  swiping: boolean;
  ghost: Copy | null;
  ghostTimer: number;
  prev: Copy;
  /** What's left of the timer for `version`, and the running timeout */
  timer: { version: number; left: number };
  timeout: number;
  started: number;
  running: boolean;
  runVersion: number;
  sig: string;
  drag: Drag | null;
  dragged: boolean;
  ro?: ResizeObserver;
  icon?: { src: Element; clone: Element };
};

const keyOf = (t: ToastData) => t.key;
const PEEK = 10; // px each toast behind peeks out
const SHRINK = 0.05; // scale step per toast behind
const HIDDEN: Layout = { y: 0, scale: 1, height: 0, z: 0, behind: false, hidden: true };
const clone = (n: ToastText | undefined) => (n instanceof Node ? n.cloneNode(true) : n);
const hasText = (n: ToastText | undefined) => n != null && n !== "";

/**
 * A stack of toasts in a corner of the page (or of a positioned parent, with `inline`). Show toasts with `toast()`.
 * @tag tc-toaster
 */
export class TcToaster extends TcElement {
  static override ui = "ts";

  /** Corner (or edge center) the stack sits in */
  @property({ reflect: true }) accessor position: ToastPosition = "bottom-right";
  /** Positions the stack inside the nearest positioned ancestor instead of the viewport – for previews and panels */
  @property({ type: Boolean }) accessor inline = false;
  /** Only shows toasts sent with { toaster: name } – for a second, separate stack */
  @property() accessor stack: string | undefined = undefined;
  /** Default time on screen in ms */
  @property({ type: Number }) accessor duration = 4000;
  /** Default time on screen for toasts with an action. Infinity (the default) keeps them until they're dismissed (WCAG 2.2.1) */
  @property({ type: Number }) accessor actionDuration = Infinity;
  /** How many toasts are visible at once; older ones wait behind */
  @property({ type: Number }) accessor visibleToasts = 3;
  /** Always show the stack fanned out */
  @property({ type: Boolean }) accessor expand = false;
  /** Distance from the edges in px */
  @property({ type: Number }) accessor offset: number | undefined = undefined;
  /** Space between toasts when fanned out, in px */
  @property({ type: Number }) accessor gap = 10;
  /** Key that moves focus to the newest toast (KeyboardEvent.key or .code) – false (or null) turns it off */
  @property({ attribute: false }) accessor hotkey: string | false | null = "F8";
  /** A 1px line along the bottom of a toast that runs down with its timer */
  @property({ type: Boolean }) accessor hairline = true;
  /** Show a close button on hover and focus (always on touch screens) */
  @property({ type: Boolean }) accessor closeButton = true;
  /** Name of the region for screen readers */
  @property() accessor label = "Notifications";

  /** @internal */ @state() accessor all: ToastData[] = toasts;
  /** @internal */ @state() accessor heights: Record<string, number> = {};
  /** @internal */ @state() accessor hovered = false;
  /** @internal */ @state() accessor focused = false;
  /** @internal Any focus inside pauses the timers; only keyboard focus fans the stack out */
  @state() accessor focusInside = false;
  /** @internal */ @state() accessor touched = false;
  /** @internal */ @state() accessor tabHidden = false;
  /** @internal */ @state() accessor polite = "";
  /** @internal */ @state() accessor assertive = "";

  private items = new Map<string, Item>();
  private frozen = new Map<string, Layout>();
  private lastFront = 0;
  private returnFocus: HTMLElement | null = null;
  private pointerType = "mouse";
  private announced = new Map<string, number>();
  private layouts = new Map<string, Layout>();

  constructor() {
    super();
    // The hotkey jumps to the newest toast; Esc or Tab out gives focus back. Off: no listener, no preventDefault
    // (only while connected: an update that lands after removal would otherwise register the key again)
    new HotkeyController(this, () => this.isConnected && this.hotkey, () => this.focusNewest());
    // Close, an action or a timer took the focused toast away: focus goes to the next toast, else back to where it
    // was before the hotkey, else the region – never to <body> (WCAG 2.4.3)
    new FocusRescueController(this, () => this.toastNodes().find((el) => !el.inert) ?? (this.returnFocus?.isConnected ? this.returnFocus : null));
  }

  private onStore = () => {
    this.all = toasts;
  };
  private syncTab = () => {
    this.tabHidden = document.visibilityState === "hidden";
  };
  /** Touch: a tap fans the stack out, a tap anywhere else folds it again */
  private onDocDown = (e: PointerEvent) => {
    if (this.touched && !this.contains(e.target as Node)) this.touched = false;
  };

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.tabIndex = -1;
    listeners.add(this.onStore);
    this.all = toasts;
    this.syncTab();
    document.addEventListener("visibilitychange", this.syncTab);
    document.addEventListener("pointerdown", this.onDocDown);
    this.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("focusin", this.onFocusIn);
    this.addEventListener("focusout", this.onFocusOut);
    this.addEventListener("pointerdown", this.onHostPointerDown, { capture: true });
    this.addEventListener("pointerenter", this.onPointerEnter);
    this.addEventListener("pointerleave", this.onPointerLeave);
    this.addEventListener("click", this.onHostClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    listeners.delete(this.onStore);
    document.removeEventListener("visibilitychange", this.syncTab);
    document.removeEventListener("pointerdown", this.onDocDown);
    this.removeEventListener("keydown", this.onKeyDown);
    this.removeEventListener("focusin", this.onFocusIn);
    this.removeEventListener("focusout", this.onFocusOut);
    this.removeEventListener("pointerdown", this.onHostPointerDown, { capture: true });
    this.removeEventListener("pointerenter", this.onPointerEnter);
    this.removeEventListener("pointerleave", this.onPointerLeave);
    this.removeEventListener("click", this.onHostClick);
    for (const key of [...this.items.keys()]) this.drop(key);
  }

  /** Newest first – that's the order for the stack, the DOM and Tab */
  private get list() {
    return this.all.filter((t) => (t.toaster ?? null) === (this.stack ?? null)).reverse();
  }
  private get live() {
    return this.list.filter((t) => !t.removing);
  }
  private get expanded() {
    return this.expand || this.hovered || this.focused || this.touched;
  }
  private get paused() {
    return this.hovered || this.focused || this.focusInside || this.touched || this.tabHidden;
  }

  private toastNodes() {
    return [...this.querySelectorAll<HTMLElement>("[data-toast-id]:not([data-removing])")];
  }

  private focusNewest() {
    const first = this.toastNodes().find((el) => !el.inert);
    if (!first) return false;
    if (!this.contains(document.activeElement)) this.returnFocus = document.activeElement as HTMLElement | null;
    first.focus();
    return true;
  }

  /* ---------- Host events ---------- */

  private onKeyDown = (e: KeyboardEvent) => {
    const live = this.live;
    if (e.key !== "Escape" || !live.length || e.defaultPrevented) return;
    e.preventDefault();
    e.stopPropagation();
    // The focused toast if there is one, otherwise the newest
    const host = (e.target as HTMLElement).closest<HTMLElement>("[data-toast-id]");
    const target = live.find((t) => keyOf(t) === host?.dataset.toastKey) ?? live[0];
    const index = live.indexOf(target);
    const next = live.filter((t) => t !== target)[Math.min(index, live.length - 2)];
    const nextNode = next && this.toastNodes().find((el) => el.dataset.toastKey === keyOf(next));
    // Focus moves first – to the next toast, back to where it was before the hotkey, or the region
    rescueFocus(this, [nextNode, this.returnFocus?.isConnected ? this.returnFocus : null, this]);
    dismiss(target.id);
  };
  private onFocusIn = (e: FocusEvent) => {
    // Only keyboard focus fans the stack out – a mouse click shouldn't keep it open after leaving
    if ((e.target as HTMLElement).matches(":focus-visible")) this.focused = true;
    this.focusInside = true;
  };
  private onFocusOut = (e: FocusEvent) => {
    if (!this.contains(e.relatedTarget as Node | null)) {
      this.focused = false;
      this.focusInside = false;
    }
  };
  private onHostPointerDown = (e: PointerEvent) => {
    this.pointerType = e.pointerType;
  };
  private onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") this.hovered = true;
  };
  private onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") this.hovered = false;
  };
  private onHostClick = () => {
    if (this.pointerType !== "mouse" && this.live.length > 1) this.touched = true;
  };

  /* ---------- Swipe: sideways in both directions, or out over the near edge; anything else rubber-bands back ---------- */

  private get edge(): 1 | -1 {
    return this.position.startsWith("bottom") ? 1 : -1;
  }

  private onToastPointerDown(e: PointerEvent, t: ToastData) {
    const it = this.items.get(keyOf(t));
    if (!it || e.button !== 0 || t.removing) return;
    if ((e.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    it.drag = { pointer: e.pointerId, x: e.clientX, y: e.clientY, axis: null, samples: [] };
    it.dragged = false;
  }
  private onToastPointerMove(e: PointerEvent, t: ToastData) {
    const it = this.items.get(keyOf(t));
    const li = e.currentTarget as HTMLElement;
    const el = li.querySelector<HTMLElement>(".ui-ts__swipe");
    const d = it?.drag;
    if (!it || !d || d.pointer !== e.pointerId || !el) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.axis) {
      if (Math.hypot(dx, dy) < 6) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      li.setPointerCapture(e.pointerId);
      it.dragged = true;
      it.swiping = true;
      this.requestUpdate();
      el.style.transition = "none";
    }
    let v = d.axis === "x" ? dx : dy;
    const outward = d.axis === "x" || v * this.edge > 0;
    // Pulling inwards only gives a little – like a rubber band
    if (!outward) v = Math.sign(v) * Math.pow(Math.abs(v), 0.7) * 0.6;
    const size = d.axis === "x" ? el.offsetWidth : el.offsetHeight * 2;
    el.style.transform = d.axis === "x" ? `translateX(${v}px)` : `translateY(${v}px)`;
    el.style.opacity = outward ? String(Math.max(0.25, 1 - Math.abs(v) / (size * 1.1))) : "";
    d.samples.push({ v, at: e.timeStamp });
    if (d.samples.length > 6) d.samples.shift();
  }
  private endDrag(e: PointerEvent, t: ToastData) {
    const it = this.items.get(keyOf(t));
    const d = it?.drag;
    const el = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(".ui-ts__swipe");
    if (!it || !d || d.pointer !== e.pointerId) return;
    it.drag = null;
    if (!d.axis || !el) return;
    it.swiping = false;
    this.requestUpdate();
    const last = d.samples[d.samples.length - 1] ?? { v: 0, at: 0 };
    const first = d.samples[0] ?? last;
    const velocity = last.at > first.at ? (last.v - first.v) / (last.at - first.at) : 0; // px per ms
    const outward = d.axis === "x" || last.v * this.edge > 0;
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
  }

  /* ---------- Bookkeeping ---------- */

  private drop(key: string) {
    const it = this.items.get(key);
    if (!it) return;
    cancelAnimationFrame(it.raf);
    window.clearTimeout(it.ghostTimer);
    window.clearTimeout(it.timeout);
    it.ro?.disconnect();
    this.items.delete(key);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const [yEdge, xEdge] = this.position.split("-");
    this.dataset.y = yEdge;
    this.dataset.x = xEdge;
    this.toggleAttribute("data-inline", this.inline);
    this.toggleAttribute("data-expanded", this.expanded);
    this.toggleAttribute("data-empty", !this.live.length);
    if (this.offset !== undefined) this.style.setProperty("--tc-toaster-offset", `${this.offset}px`);
    else if (changed.has("offset")) this.style.removeProperty("--tc-toaster-offset");
    this.setAttribute("aria-label", this.hotkey ? `${this.label} (${this.hotkey})` : this.label);

    const list = this.list;
    for (const t of list) {
      const key = keyOf(t);
      let it = this.items.get(key);
      if (!it) {
        it = { mounted: false, raf: 0, swiping: false, ghost: null, ghostTimer: 0, prev: { title: t.title, description: t.description, version: t.version }, timer: { version: -1, left: 0 }, timeout: 0, started: 0, running: false, runVersion: -1, sig: "", drag: null, dragged: false };
        this.items.set(key, it);
        continue;
      }
      // New text: the old one stays on top for a moment and fades out while the new one fades in
      const old = it.prev;
      if (old.version === t.version) continue;
      it.prev = { title: t.title, description: t.description, version: t.version };
      if (old.title === t.title && old.description === t.description) continue;
      it.ghost = { title: clone(old.title)!, description: clone(old.description), version: old.version };
      window.clearTimeout(it.ghostTimer);
      const item = it;
      it.ghostTimer = window.setTimeout(() => {
        item.ghost = null;
        this.requestUpdate();
      }, 320);
    }
    // Forget toasts that are gone
    const keys = new Set(list.map(keyOf));
    for (const key of [...this.items.keys()]) if (!keys.has(key)) this.drop(key);
    if (Object.keys(this.heights).some((k) => !keys.has(k))) this.heights = Object.fromEntries(Object.entries(this.heights).filter(([k]) => keys.has(k)));
    this.frozen.forEach((_, k) => !keys.has(k) && this.frozen.delete(k));
    if (!this.live.length) this.touched = false;
  }

  protected override updated() {
    // An update that lands after removal starts nothing
    if (!this.isConnected) return;
    const paused = this.paused;
    const nodes = new Map([...this.querySelectorAll<HTMLElement>("[data-toast-key]")].map((el) => [el.dataset.toastKey!, el]));
    for (const t of this.list) {
      const key = keyOf(t);
      const it = this.items.get(key);
      if (!it) continue;
      const li = nodes.get(key);
      // Painted once off-screen, then lifted in
      if (!it.mounted && !it.raf) {
        it.raf = requestAnimationFrame(() => {
          it.raf = requestAnimationFrame(() => {
            it.raf = 0;
            it.mounted = true;
            this.requestUpdate();
          });
        });
      }
      // Every toast measures its content – the stack positions and heights are built from these
      const content = li?.querySelector<HTMLElement>(".ui-ts__content");
      if (!it.ro && content) {
        const report = () => {
          const h = content.offsetHeight;
          if (this.heights[key] !== h) this.heights = { ...this.heights, [key]: h };
        };
        report();
        if (typeof ResizeObserver !== "undefined") {
          it.ro = new ResizeObserver(report);
          it.ro.observe(content);
        }
      }
      // The timer: restarts on every update, keeps what's left while paused
      const duration = this.durationOf(t);
      const timed = t.type !== "loading" && Number.isFinite(duration);
      const running = timed && !(paused || (this.layouts.get(key)?.hidden ?? false)) && !it.swiping && !t.removing;
      const sig = `${running}|${t.version}|${duration}`;
      if (sig === it.sig) continue;
      it.sig = sig;
      if (it.running) {
        window.clearTimeout(it.timeout);
        if (it.timer.version === it.runVersion) it.timer.left -= clock() - it.started;
        it.running = false;
      }
      if (it.timer.version !== t.version) it.timer = { version: t.version, left: duration };
      if (running) {
        const id = t.id;
        it.running = true;
        it.runVersion = t.version;
        it.started = clock();
        it.timeout = window.setTimeout(() => dismiss(id), Math.max(0, it.timer.left));
      }
    }
    this.announce();
  }

  /** Read new and changed toasts out – errors right away, everything else politely */
  private announce() {
    const list = this.list;
    for (const t of this.live) {
      const key = keyOf(t);
      if (this.announced.get(key) === t.version) continue;
      this.announced.set(key, t.version);
      const node = this.toastNodes().find((el) => el.dataset.toastKey === key);
      // Title and description as separate sentences – their text run together reads as one word ("sentINV-2041")
      const copy = node?.querySelector(".ui-ts__copy:not(.ui-ts__ghost)");
      const parts = copy ? [...copy.children].map((c) => c.textContent?.trim() ?? "").filter(Boolean) : [];
      const text = (parts.length ? parts.map((p) => (/[.!?…]$/.test(p) ? p : `${p}.`)).join(" ") : copy?.textContent?.trim())?.replace(/\.$/, "");
      if (!text) continue;
      // A trailing no-break space that alternates makes the same message count as new
      if (t.type === "error") this.assertive = this.assertive === text ? `${text} ` : text;
      else this.polite = this.polite === text ? `${text} ` : text;
    }
    this.announced.forEach((_, k) => !list.some((t) => keyOf(t) === k) && this.announced.delete(k));
  }

  private durationOf(t: ToastData) {
    return t.duration ?? (t.action ? this.actionDuration : this.duration);
  }

  private iconOf(t: ToastData, it: Item | undefined) {
    if (t.type === "loading") return statusIcon;
    if (!t.icon) return t.type === "default" ? null : statusIcon;
    if (!it) return null;
    if (it.icon?.src !== t.icon) it.icon = { src: t.icon, clone: t.icon.cloneNode(true) as Element };
    return it.icon.clone;
  }

  private renderCopy(c: { title: ToastText; description?: ToastText }) {
    return html`<div class="ui-ts__title">${c.title}</div>${hasText(c.description) ? html`<div class="ui-ts__desc">${c.description}</div>` : nothing}`;
  }

  private renderToast(t: ToastData, layout: Layout, paused: boolean) {
    const key = keyOf(t);
    const it = this.items.get(key);
    const mounted = it?.mounted ?? false;
    const removing = !!t.removing;
    const edge = this.edge;
    const inward = -edge;
    let transform = `translateY(${inward * layout.y}px) scale(${layout.scale})`;
    if (!mounted) transform = `translateY(${edge * 100}%) scale(${layout.scale})`;
    if (removing) transform = `translateY(${inward * layout.y + edge * 10}px) scale(${layout.scale * 0.96})`;
    const icon = this.iconOf(t, it);
    const duration = this.durationOf(t);
    const timed = t.type !== "loading" && Number.isFinite(duration);
    const running = timed && !paused && !it?.swiping && !removing;
    const ghost = it?.ghost;
    return html`<li
      class="ui-ts__toast"
      data-toast-id=${String(t.id)}
      data-toast-key=${key}
      data-type=${t.type}
      data-behind=${ifDefined(layout.behind ? "" : undefined)}
      data-removing=${ifDefined(removing ? "" : undefined)}
      data-swiping=${ifDefined(it?.swiping ? "" : undefined)}
      tabindex="0"
      .inert=${layout.hidden || removing}
      style=${styleMap({ transform, opacity: !mounted || removing || layout.hidden ? "0" : "1", height: layout.height ? `${layout.height}px` : undefined, zIndex: String(layout.z) })}
      @pointerdown=${(e: PointerEvent) => this.onToastPointerDown(e, t)}
      @pointermove=${(e: PointerEvent) => this.onToastPointerMove(e, t)}
      @pointerup=${(e: PointerEvent) => this.endDrag(e, t)}
      @pointercancel=${(e: PointerEvent) => this.endDrag(e, t)}
      @click=${{
        capture: true,
        handleEvent: (e: Event) => {
          // A swipe is not a click
          if (!it?.dragged) return;
          it.dragged = false;
          e.stopPropagation();
          e.preventDefault();
        },
      }}
    >
      <div class="ui-ts__swipe">
        <div class="ui-ts__card">
          <div class="ui-ts__content" data-action=${ifDefined(t.action ? "" : undefined)}>
            ${icon ? html`<span class="ui-ts__icon" data-type=${t.icon && t.type !== "loading" ? "custom" : t.type}>${icon}</span>` : nothing}
            <div class="ui-ts__text">
              ${keyed(t.version, html`<div class="ui-ts__copy" data-changed=${ifDefined(t.version > 0 ? "" : undefined)}>${this.renderCopy(t)}</div>`)}
              ${ghost ? keyed(`ghost-${ghost.version}`, html`<div class="ui-ts__copy ui-ts__ghost" aria-hidden="true">${this.renderCopy(ghost)}</div>`) : nothing}
            </div>
            ${t.action
              ? html`<button
                  type="button"
                  class="ui-ts__action"
                  @click=${(e: MouseEvent) => {
                    t.action!.onClick(e);
                    if (!e.defaultPrevented) dismiss(t.id);
                  }}
                >
                  ${t.action.label}
                </button>`
              : nothing}
          </div>
          ${this.hairline && timed ? keyed(t.version, html`<span class="ui-ts__timer" aria-hidden="true" style=${styleMap({ animationDuration: `${duration}ms`, animationPlayState: running ? "running" : "paused" })}></span>`) : nothing}
        </div>
        ${this.closeButton ? html`<button type="button" class="ui-ts__close" aria-label="Dismiss notification" @click=${() => dismiss(t.id)}>${closeGlyph}</button>` : nothing}
      </div>
    </li>`;
  }

  protected override render() {
    const list = this.list;
    const live = this.live;
    const expanded = this.expanded;
    const limit = Math.max(1, this.visibleToasts);
    const heights = this.heights;

    /* Layout: collapsed, every toast takes the front toast's height and peeks out a little;
       expanded, each one keeps its own height and they line up with a gap */
    const frontHeight = (live[0] && heights[keyOf(live[0])]) || this.lastFront;
    if (frontHeight) this.lastFront = frontHeight;
    const layouts = new Map<string, Layout>();
    let stacked = 0;
    live.forEach((t, i) => {
      const own = heights[keyOf(t)] ?? 0;
      const depth = Math.min(i, limit - 1);
      const layout: Layout = expanded
        ? { y: stacked, scale: 1, height: own, z: live.length - i, behind: false, hidden: i >= limit }
        : { y: depth * PEEK, scale: 1 - depth * SHRINK, height: i === 0 ? own : frontHeight, z: live.length - i, behind: i > 0, hidden: i >= limit };
      if (i < limit) stacked += own + this.gap;
      layouts.set(keyOf(t), layout);
      // Leaving toasts stay exactly where they were while they fade
      this.frozen.set(keyOf(t), layout);
    });
    this.layouts = layouts;
    const count = Math.min(live.length, limit);
    const stackHeight = !live.length ? 0 : expanded ? Math.max(0, stacked - this.gap) : frontHeight + PEEK * (count - 1);
    const paused = this.paused;

    return html`
      <ol class="ui-ts__list" style=${styleMap({ height: `${stackHeight}px` })}>
        ${repeat(list, keyOf, (t) => this.renderToast(t, layouts.get(keyOf(t)) ?? this.frozen.get(keyOf(t)) ?? HIDDEN, paused || (layouts.get(keyOf(t))?.hidden ?? false)))}
      </ol>
      <div class="ui-ts__sr" role="status">${this.polite}</div>
      <div class="ui-ts__sr" role="alert">${this.assertive}</div>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="ts"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ts"] {
  --tc-toaster-width: 356px;
  --tc-toaster-offset: 24px;
  position: fixed;
  z-index: var(--tc-z-toast);
  box-sizing: border-box;
  width: var(--tc-toaster-width);
  max-width: calc(100% - 2 * var(--tc-toaster-offset));
  margin: 0;
  padding: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
  outline: none;
}
/* Colors and motion as variables – override them on [data-ui="ts"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ts"] {
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
[data-ui="ts"][data-inline] { position: absolute; z-index: var(--tc-z-toast); --tc-toaster-offset: 20px; }
[data-ui="ts"][data-empty] { pointer-events: none; }
[data-ui="ts"] *, [data-ui="ts"] *::before, [data-ui="ts"] *::after { box-sizing: border-box; }
:where([data-ui="ts"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="ts"]) svg { display: block; flex: none; }
[data-ui="ts"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The region itself takes focus only as a last resort (nothing left to focus) – it shows where focus is */
[data-ui="ts"]:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); border-radius: var(--tc-card-radius); }
/* Corners and edge centers */
[data-ui="ts"][data-y="bottom"] { bottom: var(--tc-toaster-offset); }
[data-ui="ts"][data-y="top"] { top: var(--tc-toaster-offset); }
[data-ui="ts"][data-x="right"] { right: var(--tc-toaster-offset); }
[data-ui="ts"][data-x="left"] { left: var(--tc-toaster-offset); }
[data-ui="ts"][data-x="center"] { left: 50%; transform: translateX(-50%); }
[data-ui="ts"]:not([data-inline])[data-y="bottom"] { bottom: max(var(--tc-toaster-offset), env(safe-area-inset-bottom)); }
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
[data-ui="ts"][data-y="bottom"] .ui-ts__toast { bottom: 0; transform-origin: 50% 0; }
[data-ui="ts"][data-y="top"] .ui-ts__toast { top: 0; transform-origin: 50% 100%; }
.ui-ts__toast[data-removing] { pointer-events: none; transition: transform var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard), height var(--tc-duration-slower) var(--tc-ease-move); }
/* The swipe layer moves on its own, so the stack's transform never fights the finger */
.ui-ts__swipe { position: relative; height: 100%; transition: transform var(--tc-duration-slower) var(--tc-ease-spring), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-ts__toast[data-swiping] { cursor: grabbing; }
/* One card per toast – the edge is a shadow, not a border */
.ui-ts__card { position: relative; height: 100%; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-overlay); }
.ui-ts__toast:focus-visible .ui-ts__card { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* Content is measured; the card clips it while it grows or shrinks */
:where([data-look="standard"], [data-look="standard"] *).ui-ts__content { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); padding: var(--tc-space-3-5); transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ts__content[data-action] { padding-right: var(--tc-space-2-5); }
/* Content is measured; the card clips it while it grows or shrinks */
:where([data-look="clean"], [data-look="clean"] *).ui-ts__content { display: flex; align-items: flex-start; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3) var(--tc-space-3); transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ts__content[data-action] { padding-right: var(--tc-space-3); }
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
:where([data-look="clean"], [data-look="clean"] *).ui-ts__content { padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-2-5); }
}
/* Phones: full width along the edge with 12px gutters */
@media (max-width: 600px) {
  [data-ui="ts"], [data-ui="ts"][data-x] { left: 12px; right: 12px; width: auto; max-width: none; transform: none; }
  [data-ui="ts"][data-y="bottom"] { bottom: 12px; }
  [data-ui="ts"]:not([data-inline])[data-y="bottom"] { bottom: max(12px, env(safe-area-inset-bottom)); }
  [data-ui="ts"][data-y="top"] { top: 12px; }
}
/* Touch screens: the close button always shows, with a bigger hit area, and a taller action button */
@media (hover: none) and (pointer: coarse) {
.ui-ts__toast:not([data-behind]) .ui-ts__close { opacity: 1; transform: none; }
.ui-ts__close::before { inset: -8px; }
.ui-ts__action { height: 36px; margin: -8px -2px -8px 0; padding: 0 var(--tc-space-3-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-ts__action { border-radius: var(--tc-radius-lg); font-size: var(--tc-font-size-md); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ts"] *:not(.ui-ts__spin):not(.ui-ts__timer), [data-ui="ts"] *::before, [data-ui="ts"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-toaster")) customElements.define("tc-toaster", TcToaster);

declare global {
  interface HTMLElementTagNameMap {
    "tc-toaster": TcToaster;
  }
}

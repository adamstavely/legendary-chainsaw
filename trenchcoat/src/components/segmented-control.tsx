"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { useControllable } from "../internal/use-controllable";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Segmented Control – switch between two to six options, in a single self-contained file.
 * "tray": a gray track with a white raised pill; "underline": text tabs with a sliding line.
 * The indicator glides to the picked option – its leading edge runs ahead, so it stretches a little and settles.
 * Labels crossfade to semibold without the width jumping, and when a label or count changes the control morphs to its new size.
 * Arrow keys, Home and End move and select; press the pill and drag it across the options to pick as you go.
 * If it doesn't fit (phones), it scrolls sideways with soft edges and keeps the active option in view.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: segmented-control.tsx is Standard,
 * segmented-control-clean.tsx is Clean). Clean adds the "buttons" variant – its default: separate quiet chips with a
 * hairline, the active one filled light gray; its "tray" is a compact light-gray track. The indicator slide is
 * shorter and crisper, and labels keep one weight (only the color changes), so there is no semibold copy.
 */
export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-seg";

export type SegmentOption<T extends string = string> = {
  value: T;
  label?: ReactNode;
  icon?: ReactNode;
  /** A small gray number after the label, e.g. unread items */
  count?: number | string;
  /** A small tinted tag after the label, e.g. "Save 20%" */
  badge?: ReactNode;
  disabled?: boolean;
  /** Accessible name – needed when the option only shows an icon */
  ariaLabel?: string;
  /** With kind="tabs": the id of the panel this tab shows */
  controls?: string;
};

type SegmentedControlOwnProps<T extends string = string> = {
  options: SegmentOption<T>[];
  /** Controlled value */
  value?: T;
  /** Starting value when uncontrolled – defaults to the first enabled option */
  defaultValue?: T;
  onChange?: (value: T) => void;
  size?: "sm" | "md" | "lg";
  /** "tray" = gray track with a raised pill, "underline" = text tabs with a sliding line, "buttons" = separate chips,
   *  the active one filled (Clean only – the Standard look shows it as "tray"). Defaults to "tray" in the Standard
   *  look and "buttons" in the Clean look */
  variant?: "buttons" | "tray" | "underline";
  /** Fill the container with equal segments */
  fullWidth?: boolean;
  /** "radio" (a radiogroup, the default) or "tabs" (a tablist that switches panels) */
  kind?: "radio" | "tabs";
  disabled?: boolean;
  /** Submits the picked value with a native form, through a hidden input */
  name?: string;
  /** The id of the form the hidden input belongs to, when the control sits outside it */
  form?: string;
  /** Names the radiogroup / tablist */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  /** Visual style. Defaults to the file's look: Standard in segmented-control.tsx, Clean in segmented-control-clean.tsx */
  look?: Look;
  ref?: Ref<HTMLDivElement>;
};

export type SegmentedControlProps<T extends string = string> = Omit<
  ComponentPropsWithoutRef<"div">,
  keyof SegmentedControlOwnProps<T>
> &
  SegmentedControlOwnProps<T>;

/** The option buttons, in order */
const optionEls = (track: HTMLElement | null) => Array.from(track?.querySelectorAll<HTMLElement>(":scope > .ui-seg__opt") ?? []);

/** Soft edges only on the sides that can scroll – reads first, then writes */
function fadeEdges(s: HTMLElement, root: HTMLElement | null) {
  const max = s.scrollWidth - s.clientWidth;
  const left = s.scrollLeft;
  root?.toggleAttribute("data-overflow", max > 1);
  s.style.setProperty("--tc-segmented-control-fade-l", left > 1 ? "24px" : "0px");
  s.style.setProperty("--tc-segmented-control-fade-r", left < max - 1 ? "24px" : "0px");
}

type PillLayout = {
  root: RefObject<HTMLDivElement | null>;
  scroller: RefObject<HTMLDivElement | null>;
  track: RefObject<HTMLDivElement | null>;
  pill: RefObject<HTMLSpanElement | null>;
  variant: string;
  fullWidth: boolean;
  size: string;
  clean: boolean;
  /** Options are observed one by one, so a changed set of options (not just a changed count) observes the new ones */
  optionKey: string;
  current: unknown;
  activeIndex: number;
};

/**
 * Sizes and the pill: buttons take their content's width, the pill (or line) sits under the active one and glides
 * to a new value; measured on mount and when an option, a label, the container or the font changes (ResizeObserver),
 * never on every render
 */
function usePillLayout({ root, scroller, track, pill, variant, fullWidth, size, clean, optionKey, current, activeIndex }: PillLayout) {
  const gliding = useRef(false);
  const glideTimer = useRef(0);
  const placed = useRef<unknown>(undefined);
  /** Buttons get the width of their content, so a changed label or count makes them – and the control – glide to the new size */
  const measure = () => {
    const els = optionEls(track.current);
    if (!els.length || !track.current) return;
    const cs = getComputedStyle(els[0]);
    const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const widths = els.map((b) => (b.firstElementChild as HTMLElement).offsetWidth + pad);
    if (fullWidth) {
      track.current.style.setProperty("--tc-segmented-control-min", `${Math.max(...widths)}px`);
      els.forEach((b) => (b.style.width = ""));
    } else els.forEach((b, i) => (b.style.width = `${widths[i]}px`));
  };

  /** Moves the pill (or line) under the active option. Without `animate` it follows at once – unless a glide is still running */
  const place = (animate: boolean) => {
    const t = track.current;
    const p = pill.current;
    if (!t || !p) return;
    const btn = t.querySelector<HTMLElement>(":scope > .ui-seg__opt[data-active]");
    if (!btn || !btn.offsetWidth) {
      p.style.opacity = "0";
      return;
    }
    // Every read first (the track's width too), then the writes – one layout, not one per write
    const trackW = t.clientWidth;
    let x = btn.offsetLeft;
    let w = btn.offsetWidth;
    // The line sits under the text only, not under the whole button
    if (variant === "underline") {
      const content = btn.firstElementChild as HTMLElement;
      x += content.offsetLeft;
      w = content.offsetWidth;
    }
    const instant = !p.dataset.ready || (!animate && !gliding.current);
    const prev = parseFloat(p.style.left) || 0;
    // The edge facing the target leads, the other one trails – the stretch
    if (!instant && x !== prev) p.dataset.dir = x > prev ? "right" : "left";
    if (instant) p.style.transition = "none";
    p.style.opacity = "1";
    p.style.left = `${x}px`;
    p.style.right = `${trackW - x - w}px`;
    if (instant) {
      p.dataset.ready = "1";
      void p.offsetWidth;
      p.style.transition = "";
    }
  };

  const fades = () => scroller.current && fadeEdges(scroller.current, root.current);

  /** Keeps the active option in view when the control scrolls */
  const reveal = (smooth: boolean) => {
    const s = scroller.current;
    const t = track.current;
    const btn = t?.querySelector<HTMLElement>(":scope > .ui-seg__opt[data-active]");
    if (!s || !t || !btn || s.scrollWidth <= s.clientWidth + 1) return;
    const left = t.offsetLeft + btn.offsetLeft - (s.clientWidth - btn.offsetWidth) / 2;
    s.scrollTo({ left: Math.max(0, left), behavior: smooth ? "smooth" : "auto" });
  };


  // Sizes: measured on mount and whenever an option, a label, the container or the font changes
  useLayoutEffect(() => {
    const t = track.current;
    const s = scroller.current;
    if (!t || !s) return;
    const sync = () => {
      measure();
      place(false);
      fades();
    };
    sync();
    // Width transitions only after the first measure, so nothing grows in on load
    const ready = requestAnimationFrame(() => root.current?.setAttribute("data-ready", ""));
    // One frame later, so setting widths inside the observer never loops
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    });
    ro.observe(s);
    ro.observe(t);
    t.querySelectorAll(".ui-seg__opt, .ui-seg__content").forEach((el) => ro.observe(el));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(ready);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the helpers read refs; re-run only when the option set or layout props change
  }, [optionKey, fullWidth, variant, size]);

  // A new value: the pill glides there, focus follows if it was inside, and a scrolling control brings it into view
  useLayoutEffect(() => {
    if (placed.current === current) return;
    const first = placed.current === undefined;
    placed.current = current;
    if (!first) {
      gliding.current = true;
      clearTimeout(glideTimer.current);
      glideTimer.current = window.setTimeout(() => (gliding.current = false), clean ? 240 : 440);
    }
    place(!first);
    reveal(!first);
    const t = track.current;
    if (!first && t && t.contains(document.activeElement)) optionEls(track.current)[activeIndex]?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per new value
  }, [current]);

  useEffect(() => () => clearTimeout(glideTimer.current), []);
}

type Press = { id: number; touch: boolean; drag: boolean; x: number; moved: boolean };

/** Pointer: press feedback and dragging across options. A plain press picks on release (2.5.2 – pressing and sliding
 *  off picks nothing); dragging picks as it goes and is undone by dragging back. Touch only drags the pill itself, so
 *  swiping to scroll doesn't pick */
function useDragSelect<T extends string>(
  options: SegmentOption<T>[],
  disabled: boolean,
  latest: { current: T | undefined },
  root: RefObject<HTMLDivElement | null>,
  select: (v: T) => void,
  buttons: () => HTMLElement[],
) {
  const press = useRef<Press | null>(null);
  /** The option under (or nearest to) a horizontal pointer position */
  const optionAt = (clientX: number) => {
    let best = -1;
    let dist = Infinity;
    buttons().forEach((b, i) => {
      const r = b.getBoundingClientRect();
      const d = clientX < r.left ? r.left - clientX : clientX > r.right ? clientX - r.right : 0;
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return options[best];
  };

  const endPress = () => {
    press.current = null;
    root.current?.removeAttribute("data-pressed");
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    const opt = optionAt(e.clientX);
    if (!opt || opt.disabled) return;
    const touch = e.pointerType === "touch";
    // Touch: the pill itself can be dragged right away; a mouse can drag from anywhere
    const drag = !touch || opt.value === latest.current;
    press.current = { id: e.pointerId, touch, drag, x: e.clientX, moved: false };
    if (drag) root.current?.setAttribute("data-pressed", "");
    if (!touch) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* capture is a nicety */
      }
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    if (!p.moved && Math.abs(e.clientX - p.x) < (p.touch ? 8 : 3)) return;
    p.moved = true;
    if (!p.drag) return;
    const opt = optionAt(e.clientX);
    if (opt && !opt.disabled) select(opt.value);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    if (!p.moved) {
      // Released over the control (not dragged off it): pick the option under the pointer
      const box = root.current?.getBoundingClientRect();
      const inside = !box || !box.width || (e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom);
      const opt = optionAt(e.clientX);
      if (opt && inside) select(opt.value);
    }
    endPress();
  };
  return { onPointerDown, onPointerMove, onPointerUp, endPress };
}

type ButtonProps<T extends string> = { option: SegmentOption<T>; active: boolean; tabbable: boolean; isTabs: boolean; clean: boolean; disabled: boolean; onSelect: (v: T) => void };

function SegmentButton<T extends string>({ option: o, active, tabbable, isTabs, clean, disabled, onSelect }: ButtonProps<T>) {
  return (
    <button
      type="button"
      className="ui-seg__opt"
      role={isTabs ? "tab" : "radio"}
      aria-checked={isTabs ? undefined : active}
      aria-selected={isTabs ? active : undefined}
      aria-controls={isTabs ? o.controls : undefined}
      aria-label={o.ariaLabel}
      data-active={active || undefined}
      disabled={o.disabled || disabled}
      tabIndex={tabbable ? 0 : -1}
      // Keyboard (Enter / Space) and screen readers – pointers are handled on the track
      onClick={() => onSelect(o.value)}
    >
      <span className="ui-seg__content">
        {o.icon && <span className="ui-seg__icon">{o.icon}</span>}
        {o.label != null && clean && (
          // Clean: one weight for both states – only the color changes, so nothing shifts
          <span className="ui-seg__label">{o.label}</span>
        )}
        {o.label != null && !clean && (
          // The semibold copy reserves the width; the two crossfade, so nothing shifts
          <span className="ui-seg__label">
            <span className="ui-seg__text">{o.label}</span>
            <span className="ui-seg__text ui-seg__text-bold" aria-hidden="true">
              {o.label}
            </span>
          </span>
        )}
        {o.count != null && (
          <span key={String(o.count)} className="ui-seg__count">
            {o.count}
          </span>
        )}
        {o.badge != null && <span className="ui-seg__badge">{o.badge}</span>}
      </span>
    </button>
  );
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  defaultValue,
  onChange,
  size = "md",
  variant: variantProp,
  fullWidth = false,
  kind = "radio",
  disabled = false,
  name,
  form,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  className,
  look,
  ref,
  ...rest
}: SegmentedControlProps<T>) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const variant = variantProp === "buttons" && !clean ? "tray" : (variantProp ?? (clean ? "buttons" : "tray"));
  const [current, setCurrent] = useControllable<T | undefined>(
    value,
    defaultValue ?? options.find((o) => !o.disabled)?.value,
    onChange as ((v: T | undefined) => void) | undefined,
  );

  const root = useRef<HTMLDivElement | null>(null);
  // The root is ours (pressed/overflow/ready flags) and the consumer's
  const setRoot = useRootRef(root, ref);
  const scroller = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  // Latest value without waiting for a render – dragging picks several options in one frame
  const latest = useRef(current);
  latest.current = current;

  const buttons = () => optionEls(track.current);
  const activeIndex = options.findIndex((o) => o.value === current);
  const tabbable = activeIndex >= 0 ? activeIndex : options.findIndex((o) => !o.disabled);

  const select = (v: T) => {
    const opt = options.find((o) => o.value === v);
    if (!opt || opt.disabled || disabled || v === latest.current) return;
    latest.current = v;
    setCurrent(v);
  };

  usePillLayout({ root, scroller, track, pill, variant, fullWidth, size, clean, optionKey: options.map((o) => o.value).join("\u0000"), current, activeIndex });

  /* ---------- Keyboard ---------- */

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing) return;
    const enabled = options.filter((o) => !o.disabled);
    if (!enabled.length || disabled) return;
    const prevKeys = kind === "radio" ? ["ArrowLeft", "ArrowUp"] : ["ArrowLeft"];
    const nextKeys = kind === "radio" ? ["ArrowRight", "ArrowDown"] : ["ArrowRight"];
    const at = enabled.findIndex((o) => o.value === latest.current);
    let target: SegmentOption<T> | undefined;
    if (prevKeys.includes(e.key)) target = enabled[(at - 1 + enabled.length) % enabled.length];
    else if (nextKeys.includes(e.key)) target = enabled[(at + 1) % enabled.length];
    else if (e.key === "Home") target = enabled[0];
    else if (e.key === "End") target = enabled[enabled.length - 1];
    if (!target) return;
    e.preventDefault();
    select(target.value);
    buttons()[options.indexOf(target)]?.focus();
  };

  /* ---------- Pointer: press feedback and dragging across options ---------- */

  const drag = useDragSelect(options, disabled, latest, root, select, buttons);

  const isTabs = kind === "tabs";

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-size={size}
      data-variant={variant}
      data-full={fullWidth || undefined}
      data-disabled={disabled || undefined}
    >
      {/* React 19 hoists this into <head> once, no matter how many controls render */}
      <style href="ui-segmented-control" precedence="default">
        {css}
      </style>

      <div ref={scroller} className="ui-seg__scroller" onScroll={(e) => fadeEdges(e.currentTarget, root.current)}>
        <div
          ref={track}
          className="ui-seg__track"
          role={isTabs ? "tablist" : "radiogroup"}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-disabled={disabled || undefined}
          aria-orientation={isTabs ? "horizontal" : undefined}
          onKeyDown={onKeyDown}
          onPointerDown={drag.onPointerDown}
          onPointerMove={drag.onPointerMove}
          onPointerUp={drag.onPointerUp}
          onPointerCancel={drag.endPress}
          onLostPointerCapture={drag.endPress}
        >
          <span ref={pill} className="ui-seg__pill" aria-hidden="true" />
          {options.map((o, i) => (
            <SegmentButton key={o.value} option={o} active={i === activeIndex} tabbable={i === tabbable} isTabs={isTabs} clean={clean} disabled={disabled} onSelect={select} />
          ))}
        </div>
      </div>
      {name !== undefined && <input type="hidden" name={name} form={form} value={current ?? ""} disabled={disabled} />}
    </div>
  );
}

const css = /* css */ `
/* Animatable custom properties: the equal segment width and the soft edges glide too */
@property --tc-segmented-control-min { syntax: "<length>"; inherits: true; initial-value: 0px; }
@property --tc-segmented-control-fade-l { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --tc-segmented-control-fade-r { syntax: "<length>"; inherits: false; initial-value: 0px; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg {
  /* Size: md – the segmented pattern: track --tc-seg-*, options as tall as a control */
  --tc-segmented-control-h: var(--tc-control-h-md);
  --tc-segmented-control-px: var(--tc-control-px-md);
  --tc-segmented-control-fs: var(--tc-font-size-md-plus);
  --tc-segmented-control-radius: var(--tc-seg-track-radius);
  --tc-segmented-control-pad: var(--tc-seg-pad);
  --tc-segmented-control-icon: 15px;
  --tc-segmented-control-gap: 20px;
  box-sizing: border-box;
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
  vertical-align: middle;
  border-radius: var(--tc-segmented-control-radius);
  background: var(--tc-seg-track-bg);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-segmented-control-fs);
  line-height: var(--tc-line-height-none);
  color: var(--tc-text-muted);
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *).ui-seg[data-size="sm"] { --tc-segmented-control-h: 26px; --tc-segmented-control-px: var(--tc-control-px-sm); --tc-segmented-control-fs: var(--tc-font-size-sm-plus); --tc-segmented-control-icon: 14px; --tc-segmented-control-gap: 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg[data-size="lg"] { --tc-segmented-control-h: var(--tc-control-h-lg); --tc-segmented-control-px: var(--tc-control-px-lg); --tc-segmented-control-fs: var(--tc-font-size-lg); --tc-segmented-control-icon: 16px; --tc-segmented-control-gap: 24px; }
:where([data-look="clean"], [data-look="clean"] *).ui-seg {
  /* Size: md – control-height chips */
  --tc-segmented-control-h: var(--tc-control-h-md);
  --tc-segmented-control-px: var(--tc-control-px-md);
  --tc-segmented-control-fs: var(--tc-font-size-md);
  --tc-segmented-control-lh: var(--tc-line-height-normal);
  --tc-segmented-control-icon: 16px;
  --tc-segmented-control-gap: 8px;
  --tc-segmented-control-pad: var(--tc-seg-pad);
  --tc-segmented-control-ring: 3px;
  box-sizing: border-box;
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
  vertical-align: middle;
  border-radius: var(--tc-seg-track-radius);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-segmented-control-fs);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-segmented-control-lh);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-size="sm"] { --tc-segmented-control-h: var(--tc-control-h-sm); --tc-segmented-control-px: var(--tc-control-px-sm); --tc-segmented-control-fs: var(--tc-font-size-sm); --tc-segmented-control-lh: var(--tc-line-height-tight); --tc-segmented-control-icon: 14px; --tc-segmented-control-gap: 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-size="lg"] { --tc-segmented-control-h: var(--tc-control-h-lg); --tc-segmented-control-px: var(--tc-control-px-lg); --tc-segmented-control-icon: 16px; --tc-segmented-control-gap: 8px; }
.ui-seg[data-full] { display: flex; width: 100%; }
.ui-seg[data-disabled] { opacity: 0.5; pointer-events: none; }
.ui-seg *, .ui-seg *::before, .ui-seg *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *):where(.ui-seg) button { margin: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-seg) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where(.ui-seg) svg { display: block; flex: none; }
/* Scrolls sideways only when it doesn't fit; the padding keeps focus rings from being cut off */
:where([data-look="standard"], [data-look="standard"] *).ui-seg__scroller {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: var(--tc-segmented-control-pad);
  border-radius: inherit;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--tc-segmented-control-fade-l), #000 calc(100% - var(--tc-segmented-control-fade-r)), transparent);
  mask-image: linear-gradient(to right, transparent, #000 var(--tc-segmented-control-fade-l), #000 calc(100% - var(--tc-segmented-control-fade-r)), transparent);
  transition: --tc-segmented-control-fade-l var(--tc-duration-base) var(--tc-ease-standard), --tc-segmented-control-fade-r var(--tc-duration-base) var(--tc-ease-standard);
}
/* Scrolls sideways only when it doesn't fit; the padding keeps focus rings from being cut off */
:where([data-look="clean"], [data-look="clean"] *).ui-seg__scroller {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: var(--tc-segmented-control-pad);
  border-radius: inherit;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--tc-segmented-control-fade-l), #000 calc(100% - var(--tc-segmented-control-fade-r)), transparent);
  mask-image: linear-gradient(to right, transparent, #000 var(--tc-segmented-control-fade-l), #000 calc(100% - var(--tc-segmented-control-fade-r)), transparent);
  transition: --tc-segmented-control-fade-l var(--tc-duration-fast) var(--tc-ease-standard), --tc-segmented-control-fade-r var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-seg__scroller::-webkit-scrollbar { display: none; }
.ui-seg__track {
  position: relative;
  display: flex;
  width: max-content;
  min-width: 100%;
  /* Horizontal drags move the pill; vertical ones still scroll the page */
  touch-action: pan-y;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
/* When it scrolls, swipes scroll it instead of dragging the pill */
.ui-seg[data-overflow] .ui-seg__track { touch-action: pan-x pan-y; }
/* Equal segments, each as wide as the widest one needs */
.ui-seg[data-full] .ui-seg__track { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(var(--tc-segmented-control-min), 1fr); }
:where([data-look="standard"], [data-look="standard"] *).ui-seg[data-ready] .ui-seg__track { transition: --tc-segmented-control-min var(--tc-duration-slow) var(--tc-ease-move); }
/* An option */
:where([data-look="standard"], [data-look="standard"] *).ui-seg__opt {
  position: relative;
  z-index: 1;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  height: var(--tc-segmented-control-h);
  padding: 0 var(--tc-segmented-control-px);
  overflow: clip;
  border-radius: calc(var(--tc-segmented-control-radius) - var(--tc-segmented-control-pad));
  white-space: nowrap;
  transition: color var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-seg[data-ready]:not([data-full]) .ui-seg__opt { transition: color var(--tc-duration-base) var(--tc-ease-standard), width var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-ready] .ui-seg__track { transition: --tc-segmented-control-min var(--tc-duration-base) var(--tc-ease-move); }
/* An option */
:where([data-look="clean"], [data-look="clean"] *).ui-seg__opt {
  position: relative;
  z-index: 1;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  height: var(--tc-segmented-control-h);
  padding: 0 var(--tc-segmented-control-px);
  overflow: clip;
  border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad));
  white-space: nowrap;
  /* Hover washes are short and crisp, in and out */
  transition: color var(--tc-duration-instant) var(--tc-ease-standard), background-color var(--tc-duration-instant) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-ready]:not([data-full]) .ui-seg__opt { transition: color var(--tc-duration-instant) var(--tc-ease-standard), background-color var(--tc-duration-instant) var(--tc-ease-standard), width var(--tc-duration-base) var(--tc-ease-move); }
.ui-seg__opt[data-active] { color: var(--tc-text-primary); }
.ui-seg__opt:disabled { opacity: 0.4; cursor: not-allowed; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__opt:focus-visible { outline: var(--tc-focus-outline); outline-offset: 0; }
@media (hover: hover) {
:where([data-look="standard"], [data-look="standard"] *).ui-seg__opt:not([data-active]):not(:disabled):hover { color: var(--tc-text-secondary); }
}
:where([data-look="clean"], [data-look="clean"] *).ui-seg__opt:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@media (hover: hover) {
:where([data-look="clean"], [data-look="clean"] *).ui-seg__opt:not([data-active]):not(:disabled):hover { background-color: var(--tc-fill-subtle); }
}
.ui-seg__content { display: inline-flex; flex: none; align-items: center; gap: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__icon { display: grid; place-items: center; width: var(--tc-segmented-control-icon); height: var(--tc-segmented-control-icon); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-size="sm"] .ui-seg__content { gap: 5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-seg__icon { display: grid; place-items: center; width: var(--tc-segmented-control-icon); height: var(--tc-segmented-control-icon); color: var(--tc-icon-muted); transition: color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg__opt[data-active] .ui-seg__icon { color: var(--tc-text-primary); }
.ui-seg__icon svg { width: 100%; height: 100%; }
/* Regular and semibold copies of the label crossfade */
:where([data-look="standard"], [data-look="standard"] *).ui-seg__label { display: grid; justify-items: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__text { grid-area: 1 / 1; font-weight: var(--tc-font-weight-medium); transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__text-bold { font-weight: var(--tc-font-weight-strong); opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__opt[data-active] .ui-seg__text { opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__opt[data-active] .ui-seg__text-bold { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__count {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-default);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-secondary);
  animation: ui-seg-in var(--tc-duration-moderate) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-seg[data-size="sm"] .ui-seg__count { min-width: 16px; height: 16px; padding: 0 4px; font-size: var(--tc-font-size-2xs); }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border-radius: var(--tc-pill-radius);
  background: var(--tc-accent-subtle);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  color: var(--tc-accent-text);
}
/* The indicator: left and right edges glide separately – the one facing the target leads, so it stretches and settles */
:where([data-look="standard"], [data-look="standard"] *).ui-seg__pill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 100%;
  z-index: 0;
  border-radius: calc(var(--tc-segmented-control-radius) - var(--tc-segmented-control-pad));
  background: var(--tc-seg-thumb-bg);
  box-shadow: var(--tc-seg-thumb-shadow);
  opacity: 0;
  pointer-events: none;
  transition: left var(--tc-duration-slower) var(--tc-ease-move), right var(--tc-duration-slower) var(--tc-ease-move), scale var(--tc-duration-base) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-seg__pill[data-dir="right"] { transition-duration: var(--tc-duration-slower), var(--tc-duration-moderate), var(--tc-duration-base), var(--tc-duration-fast); }
:where([data-look="standard"], [data-look="standard"] *).ui-seg__pill[data-dir="left"] { transition-duration: var(--tc-duration-moderate), var(--tc-duration-slower), var(--tc-duration-base), var(--tc-duration-fast); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg__label { display: block; }
:where([data-look="clean"], [data-look="clean"] *).ui-seg__count {
  display: inline-grid;
  place-items: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-default);
  font-size: var(--tc-pill-font-size);
  line-height: var(--tc-line-height-tight);
  font-weight: var(--tc-font-weight-medium);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-secondary);
  animation: ui-seg-in-clean var(--tc-duration-base) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-seg__opt[data-active] .ui-seg__count { background: var(--tc-surface-raised); box-shadow: 0 0 0 0.5px var(--tc-border-default); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-size="sm"] .ui-seg__count { min-width: 14px; height: 14px; padding: 0 3px; font-size: var(--tc-font-size-2xs); line-height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-seg__badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border-radius: var(--tc-pill-radius);
  background: var(--tc-accent-subtle);
  font-size: var(--tc-font-size-xs);
  line-height: var(--tc-line-height-tight);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-accent-text);
}
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-size="sm"] .ui-seg__badge { height: 16px; padding: 0 5px; font-size: var(--tc-font-size-2xs); }
/* The indicator: left and right edges slide separately – the one facing the target leads a touch. Short and crisp */
:where([data-look="clean"], [data-look="clean"] *).ui-seg__pill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 100%;
  z-index: 0;
  border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad));
  background: var(--tc-fill-selected);
  box-shadow: inset 0 0 0 1px var(--tc-border-selected);
  opacity: 0;
  pointer-events: none;
  transition: left var(--tc-duration-base) var(--tc-ease-move), right var(--tc-duration-base) var(--tc-ease-move), scale var(--tc-duration-quick) var(--tc-ease-move), opacity var(--tc-duration-quick) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-seg__pill[data-dir="right"] { transition-duration: var(--tc-duration-base), var(--tc-duration-fast), var(--tc-duration-quick), var(--tc-duration-quick); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg__pill[data-dir="left"] { transition-duration: var(--tc-duration-fast), var(--tc-duration-base), var(--tc-duration-quick), var(--tc-duration-quick); }
/* Press feedback: the pill gives a little while held or dragged */
.ui-seg[data-pressed]:not([data-variant="underline"]) .ui-seg__pill { scale: 0.97; }
/* Underline variant: text tabs on a hairline */
:where([data-look="standard"], [data-look="standard"] *).ui-seg[data-variant="underline"] { --tc-segmented-control-px: 2px; border-radius: 0; background: none; box-shadow: inset 0 -1px 0 var(--tc-border-default); }
/* Buttons (default): separate chips with a hairline; the light-gray fill slides to the active one.
   The control reaches a few px past its box so focus rings are never clipped, and still lines up with its neighbours */
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="buttons"] { --tc-segmented-control-pad: var(--tc-segmented-control-ring); margin: calc(var(--tc-segmented-control-ring) * -1); max-width: calc(100% + var(--tc-segmented-control-ring) * 2); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="buttons"][data-full] { width: calc(100% + var(--tc-segmented-control-ring) * 2); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="buttons"] .ui-seg__track { gap: var(--tc-segmented-control-gap); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="buttons"] .ui-seg__opt { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
/* Selected = fill-selected + a 1px border-selected ring on the sliding chip (≥ 3:1, not a fill alone) */
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="buttons"] .ui-seg__opt[data-active] { box-shadow: none; }
/* Tray: the segmented pattern – a light-gray track with a raised thumb; options stay at least 24px tall (2.5.8) */
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="tray"] { background: var(--tc-seg-track-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="tray"] .ui-seg__opt { height: max(24px, calc(var(--tc-segmented-control-h) - var(--tc-segmented-control-pad) * 2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="tray"] .ui-seg__pill { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); }
/* Underline: text tabs on a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="underline"] { --tc-segmented-control-px: 2px; --tc-segmented-control-gap: 20px; border-radius: 0; box-shadow: inset 0 calc(var(--tc-hairline) * -1) 0 var(--tc-border-default); }
.ui-seg[data-variant="underline"] .ui-seg__scroller { padding: 0; }
.ui-seg[data-variant="underline"]:not([data-full]) .ui-seg__track { gap: var(--tc-segmented-control-gap); }
.ui-seg[data-variant="underline"][data-full] { --tc-segmented-control-px: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg[data-variant="underline"] .ui-seg__opt { height: calc(var(--tc-segmented-control-h) + 6px); border-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="underline"] .ui-seg__opt { height: calc(var(--tc-segmented-control-h) + 6px); }
.ui-seg[data-variant="underline"] .ui-seg__opt:focus-visible { outline-offset: -2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg[data-variant="underline"] .ui-seg__pill { top: auto; height: 2px; border-radius: var(--tc-radius-2xs) var(--tc-radius-2xs) 0 0; background: var(--tc-text-primary); box-shadow: none; }
@keyframes ui-seg-in { from { opacity: 0; transform: translateY(3px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
/* Touch screens: every option at least 40px tall */
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-seg[data-size] { --tc-segmented-control-h: 40px; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg[data-size="lg"] { --tc-segmented-control-h: 44px; }
:where([data-look="standard"], [data-look="standard"] *).ui-seg[data-variant="underline"] .ui-seg__opt { height: var(--tc-segmented-control-h); }
}
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="underline"] .ui-seg__pill { top: auto; height: 1.5px; border-radius: var(--tc-radius-2xs) var(--tc-radius-2xs) 0 0; background: var(--tc-text-primary); box-shadow: none; }
@media (hover: hover) {
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="underline"] .ui-seg__opt:not([data-active]):not(:disabled):hover { background-color: transparent; color: var(--tc-text-secondary); }
}
@keyframes ui-seg-in-clean { from { opacity: 0; transform: translateY(2px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
/* Touch screens: every option at least 40px tall */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-size] { --tc-segmented-control-h: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-size="lg"] { --tc-segmented-control-h: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="tray"][data-size] { --tc-segmented-control-h: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-seg[data-variant="underline"] .ui-seg__opt { height: var(--tc-segmented-control-h); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-seg *, .ui-seg *::before, .ui-seg *::after { animation: none !important; transition: none !important; }
}
`;

"use client";

/*
 * Button – a single self-contained file.
 * The styles are injected below, so no extra files are needed.
 * Two looks, picked with the `look` prop (the default comes from the file: button.tsx is Standard,
 * button-clean.tsx is Clean):
 *   · Standard: a flat ink chip, a white button with the card ring, 28 · 32 · 40 high
 *   · Clean: a flat ink chip, a white button with hairline shadows, a quiet ghost and a minimal red fill,
 *     24 · 28 · 32 high
 * Both are built from the control and action pattern tokens (--tc-control-*, --tc-action-*), which every
 * hand-rolled action in the library uses too.
 */
// Generated from src/components/button.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { isValidElement, useCallback, useEffect, useLayoutEffect, useRef, type ComponentPropsWithRef, type ReactNode, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-button";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  /** Visual style. Defaults to the file's look: Standard in button.tsx, Clean in button-clean.tsx */
  look?: Look;
  /** primary: dark and filled · secondary: white with an outline (Clean: a hairline shadow) · ghost: text only ·
   *  destructive: red, for deleting */
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  /** Shows a shimmer over the label, blocks clicks and adds "loading" to the accessible name */
  loading?: boolean;
  /** Icon before the label, e.g. an inline SVG */
  icon?: ReactNode;
  /** Icon after the label */
  iconRight?: ReactNode;
};

export function Button({
  look,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  children,
  className,
  disabled,
  onClick,
  type = "button",
  ref,
  ...rest
}: ButtonProps) {
  // The shimmer copies the label, so it only works on plain text
  const text = typeof children === "string" ? children : undefined;
  const iconOnly = !children && Boolean(icon || iconRight);

  // Morph: when label or icon change, the width glides to its new size and the new content blurs in.
  // Nothing animates on the first render.
  const inner = useRef<HTMLButtonElement | null>(null);
  const setRoot = useRootRef(inner, ref);
  const labelKey = text ?? "label";
  const iconKey = loading && icon ? "spinner" : contentKey(icon);
  const iconRightKey = contentKey(iconRight);
  useWidthMorph(inner, `${labelKey}|${iconKey}|${iconRightKey}`);
  usePauseOffScreen(inner, loading);

  return (
    <>
      {/* React 19 hoists this into <head> once, no matter how many buttons render */}
      <style href="ui-button" precedence="default">
        {css}
      </style>
      <button
        type={type}
        className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
        data-look={look ?? DEFAULT_LOOK}
        data-variant={variant}
        data-size={size}
        data-loading={loading || undefined}
        data-icon-only={iconOnly || undefined}
        data-icon-left={(!iconOnly && Boolean(icon)) || undefined}
        data-icon-right={(!iconOnly && Boolean(iconRight)) || undefined}
        ref={setRoot}
        disabled={disabled}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        onClick={(event) => {
          if (loading) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        {...rest}
      >
        {/* New keys remount the parts that changed, which replays their enter animation */}
        {icon && (
          <span className="ui-button__icon" aria-hidden="true" key={`icon-${iconKey}`}>
            {loading ? <Spinner /> : icon}
          </span>
        )}
        {children != null && (
          <span className="ui-button__label" key={`label-${labelKey}`}>
            {children}
            {loading && text && (
              <span className="ui-button__shine" aria-hidden="true">
                <span>{text}</span>
              </span>
            )}
          </span>
        )}
        {iconRight && (
          <span className="ui-button__icon" aria-hidden="true" key={`icon-right-${iconRightKey}`}>
            {iconRight}
          </span>
        )}
        {loading && <span className="ui-button__status">, loading</span>}
      </button>
    </>
  );
}

/**
 * The button's width glides from its old size to its new one whenever `content` changes. The width is kept
 * current by a ResizeObserver (no layout read on ordinary renders); it's measured during a render only when the
 * content changed. `data-ready` (which turns the blur-in on) is set on the element after mount, without a re-render.
 */
function useWidthMorph(inner: { current: HTMLButtonElement | null }, content: string) {
  const lastWidth = useRef(0);
  const lastContent = useRef(content);

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    el.setAttribute("data-ready", "");
    if (typeof ResizeObserver === "undefined") {
      lastWidth.current = el.getBoundingClientRect().width;
      return;
    }
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      lastWidth.current = box ? box.inlineSize : el.getBoundingClientRect().width;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [inner]);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el || lastContent.current === content) return;
    lastContent.current = content;
    const from = lastWidth.current;
    const width = el.getBoundingClientRect().width;
    lastWidth.current = width;
    if (!from || Math.abs(from - width) < 0.5 || reducedMotion()) return;
    el.animate([{ width: `${from}px` }, { width: `${width}px` }], {
      duration: 480,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    });
  }, [inner, content]);
}

/** While loading, the sweep and spinner pause when the button is scrolled out of view (set on the element, no render) */
function usePauseOffScreen(inner: { current: HTMLButtonElement | null }, active: boolean) {
  useEffect(() => {
    const el = inner.current;
    if (!active || !el || typeof IntersectionObserver !== "function") return;
    const io = new IntersectionObserver((entries) => {
      el.toggleAttribute("data-offscreen", !entries[entries.length - 1].isIntersecting);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      el.removeAttribute("data-offscreen");
    };
  }, [inner, active]);
}

/** Shown in place of the left icon while loading */
const Spinner = () => (
  <svg
    className="ui-button__spinner"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="8.5" opacity={0.2} />
    <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" />
  </svg>
);

/** A stable id per icon component, so swapping e.g. <CopyIcon /> for <CheckIcon /> counts as a change */
const ids = new WeakMap<object, number>();
let nextId = 1;
function contentKey(node: ReactNode) {
  if (!isValidElement(node) || typeof node.type === "string") return 0;
  const type = node.type as object;
  if (!ids.has(type)) ids.set(type, nextId++);
  return ids.get(type)!;
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-button:where([data-look="standard"]),
.ui-button__portal:where([data-look="standard"]) {
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-lg: 40px;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-lg: 16px;
  --_tc-control-px-md: 12px;
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-lg: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-duration-fast: 150ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-sm: 12px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-text-primary: light-dark(#171717, #ededed);
}
.ui-button:where([data-look="clean"]),
.ui-button__portal:where([data-look="clean"]) {
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-lg: 32px;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-lg: 12px;
  --_tc-control-px-md: 10px;
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-lg: 6px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-duration-fast: 150ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-sm: 12px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Geometry and colours come from the control and action pattern tokens (CONTRIBUTING.md): every primary,
   secondary and ghost action in the library looks like this. Override the --tc-button-* variables on .ui-button
   to theme one button. */
.ui-button {
  --tc-button-h: var(--tc-control-h-md, var(--_tc-control-h-md));
  --tc-button-px: var(--tc-control-px-md, var(--_tc-control-px-md));
  --tc-button-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  --tc-button-fs: var(--tc-control-font-size, var(--_tc-control-font-size));
  --tc-button-gap: 6px;
  --tc-button-icon: 16px;
  --tc-button-load: 1040ms;

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-button-gap);
  box-sizing: border-box;
  height: var(--tc-button-h);
  min-width: var(--tc-button-h);
  padding: 0 var(--tc-button-px);
  margin: 0;
  border: 0;
  border-radius: var(--tc-button-radius);
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-button-fs);
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: nowrap;
  text-decoration: none;
  color: var(--tc-button-fg);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
  transition:
    background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move)),
    opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-button {
  letter-spacing: -0.01em;
}
/* Sizes follow --tc-control-h-sm/md/lg: Standard 28 · 32 · 40, Clean 24 · 28 · 32 */
.ui-button[data-size="sm"] {
  --tc-button-h: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  --tc-button-px: var(--tc-control-px-sm, var(--_tc-control-px-sm));
  --tc-button-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  --tc-button-gap: 4px;
  --tc-button-icon: 14px;
}
.ui-button[data-size="lg"] {
  --tc-button-h: var(--tc-control-h-lg, var(--_tc-control-h-lg));
  --tc-button-px: var(--tc-control-px-lg, var(--_tc-control-px-lg));
  --tc-button-radius: var(--tc-control-radius-lg, var(--_tc-control-radius-lg));
}
:where([data-look="standard"], [data-look="standard"] *).ui-button[data-size="lg"] {
  --tc-button-fs: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  --tc-button-gap: 8px;
  --tc-button-icon: 18px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-button[data-size="sm"] {
  --tc-button-fs: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
}
/* An icon sits closer to the edge than the text, so both look evenly spaced */
.ui-button[data-icon-left] {
  padding-left: calc(var(--tc-button-px) - var(--tc-button-icon-inset, 2px));
}
.ui-button[data-icon-right] {
  padding-right: calc(var(--tc-button-px) - var(--tc-button-icon-inset, 2px));
}
.ui-button[data-icon-only] {
  width: var(--tc-button-h);
  padding: 0;
}
/* primary: flat ink (design decision 1) */
.ui-button[data-variant="primary"] {
  --tc-button-fg: var(--tc-action-primary-fg, var(--_tc-action-primary-fg));
  background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg));
  box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow));
}
.ui-button[data-variant="primary"]:hover:not(:disabled) {
  background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover));
}
.ui-button[data-variant="primary"]:active:not(:disabled):not([data-loading]) {
  background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active));
}
/* secondary: the control surface with the card ring */
.ui-button[data-variant="secondary"] {
  --tc-button-fg: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
}
.ui-button[data-variant="secondary"]:hover:not(:disabled) {
  box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover));
}
/* ghost: a quiet label, a wash appears on hover */
.ui-button[data-variant="ghost"] {
  --tc-button-fg: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg));
  background: transparent;
}
.ui-button[data-variant="ghost"]:hover:not(:disabled) {
  --tc-button-fg: var(--tc-text-primary, var(--_tc-text-primary));
  background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover));
}
:where([data-look="clean"], [data-look="clean"] *).ui-button:is([data-variant="secondary"], [data-variant="ghost"]) .ui-button__icon {
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-button[data-variant="ghost"]:hover:not(:disabled) .ui-button__icon {
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
/* destructive: red label on a light red fill */
.ui-button[data-variant="destructive"] {
  --tc-button-fg: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
  background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg));
}
.ui-button[data-variant="destructive"]:hover:not(:disabled) {
  background: color-mix(in srgb, var(--tc-status-danger-bg, var(--_tc-status-danger-bg)) 88%, var(--tc-status-danger-solid, var(--_tc-status-danger-solid)));
}
.ui-button:active:not(:disabled):not([data-loading]) {
  transform: scale(0.97);
}
.ui-button:focus-visible {
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset));
}
.ui-button:disabled {
  opacity: 0.4;
  cursor: default;
}
.ui-button[data-loading] {
  cursor: default;
}
.ui-button__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--tc-button-icon);
  height: var(--tc-button-icon);
}
.ui-button__icon > svg {
  width: 100%;
  height: 100%;
}
/* Announced with the name while loading ("Save, loading"); visually hidden */
.ui-button__status {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/* Morph: the button clips while its width glides; changed parts blur in */
.ui-button {
  overflow: clip;
}
.ui-button[data-ready] .ui-button__label {
  animation: ui-button-label-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
.ui-button[data-ready] .ui-button__icon {
  animation: ui-button-icon-in var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
/* Loading: the label dims and a band of full-colour label sweeps across it. The window slides one way and the
   text inside it the other way, so only transform animates (composited); paused while off-screen. */
.ui-button__label {
  position: relative;
}
.ui-button[data-loading] .ui-button__label {
  color: color-mix(in srgb, var(--tc-button-fg) 55%, transparent);
}
.ui-button__shine {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  animation: ui-button-sweep var(--tc-button-load) linear infinite;
}
.ui-button__shine > span {
  display: block;
  white-space: nowrap;
  color: var(--tc-button-fg);
  animation: ui-button-sweep-text var(--tc-button-load) linear infinite;
}
.ui-button__spinner {
  animation: ui-button-spin var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) linear infinite;
}
.ui-button[data-offscreen] :is(.ui-button__shine, .ui-button__shine > span, .ui-button__spinner) {
  animation-play-state: paused;
}
@keyframes ui-button-label-in {
  from {
    opacity: 0;
    filter: blur(3px);
    transform: translateY(25%);
  }
}
@keyframes ui-button-icon-in {
  from {
    opacity: 0;
    filter: blur(2px);
    transform: scale(0.7);
  }
}
@keyframes ui-button-spin {
  to {
    transform: rotate(1turn);
  }
}
@keyframes ui-button-sweep {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
@keyframes ui-button-sweep-text {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(-100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ui-button[data-ready] .ui-button__label,
  .ui-button[data-ready] .ui-button__icon {
    animation: none;
  }
  .ui-button {
    transition-duration: 1ms;
  }
  .ui-button__shine {
    display: none;
  }
}
`;

"use client";

/*
 * Tips Panel – a panel of short tips, each with one action, in a gray tray with a white card, in a single self-contained file.
 * Taking an action marks the tip as done; the list scrolls inside the white card, framed by the gray tray.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: tips-panel.tsx is Standard,
 * tips-panel-clean.tsx is Clean). Clean drops the gray tray: one white card with a hairline shadow, the heading
 * and the Close row separated by hairlines, quieter tip tiles, smaller buttons and a green done check. Only the
 * tip list scrolls – the heading and the Close row stay in place.
 */
// Generated from src/components/tips-panel.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-tp";

export type Tip = {
  id: string;
  title: string;
  /** Short explanation – may contain a <Kbd> */
  description: ReactNode;
  /** Button text */
  action: string;
  /** Text after the action was taken, e.g. "Enabled" */
  doneLabel?: string;
  /** Shows the action as the dark button – use once for the most important tip */
  primary?: boolean;
  onAction?: () => void;
};

type TipsPanelOwnProps = {
  title?: string;
  tips: Tip[];
  /** Ids of the tips whose action was taken. Controlled when defined – pair it with `onDoneChange` */
  done?: string[];
  /** Ids already done on mount when `done` isn't controlled */
  defaultDone?: string[];
  /** Called with the new list of done ids whenever a tip's action is taken */
  onDoneChange?: (done: string[]) => void;
  /** Shows the Close button in the footer */
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
  /** Visual style. Defaults to the file's look: Standard in tips-panel.tsx, Clean in tips-panel-clean.tsx */
  look?: Look;
  ref?: Ref<HTMLElement>;
};

export type TipsPanelProps = Omit<ComponentPropsWithoutRef<"section">, keyof TipsPanelOwnProps> & TipsPanelOwnProps;

const NONE: string[] = [];

export function TipsPanel({
  title = "Tips",
  tips,
  done: doneProp,
  defaultDone = NONE,
  onDoneChange,
  onClose,
  closeLabel = "Close",
  className,
  look,
  ref,
  ...rest
}: TipsPanelProps) {
  const [doneIds, setDoneIds] = useControllable(doneProp, defaultDone, onDoneChange);
  const done = useMemo(() => new Set(doneIds), [doneIds]);
  const doneCount = tips.filter((t) => done.has(t.id)).length;
  const resolvedLook = look ?? DEFAULT_LOOK;
  const root = useRef<HTMLElement>(null);
  const setRoot = useRootRef(root, ref);
  // The action turns into its "Done" mark: focus waits on the panel, then moves onto the mark – not to <body>
  const refocus = useRef<string | null>(null);
  useLayoutEffect(() => {
    const id = refocus.current;
    if (!id) return;
    refocus.current = null;
    rescueFocus(root.current, [`[data-focus-key="tip-${CSS.escape(id)}"]`], root.current ?? document);
  });
  // One persistent status line: which tip was done and the new count (the counter itself isn't live)
  const [status, setStatus] = useState("");

  return (
    <>
      <style href="ui-tips-panel" precedence="default">
        {css}
      </style>
      <section
        aria-label={title}
        {...rest}
        ref={setRoot}
        tabIndex={-1}
        className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
        data-look={resolvedLook}
      >
        <header className="ui-tp__head">
          <h3 className="ui-tp__title">{title}</h3>
          <span className="ui-tp__count">
            {doneCount}/{tips.length} done
          </span>
        </header>

        <div className="ui-tp__card">
          <ul className="ui-tp__grid">
            {tips.map((tip, i) => {
              const isDone = done.has(tip.id);
              return (
                <li key={tip.id} className="ui-tp__tip" data-done={isDone || undefined} style={{ animationDelay: `${80 + i * 50}ms` }}>
                  <p className="ui-tp__tip-title">{tip.title}</p>
                  <p className="ui-tp__tip-text">{tip.description}</p>
                  {isDone ? (
                    <span className="ui-tp__done" tabIndex={-1} data-focus-key={`tip-${tip.id}`}>
                      <CheckIcon look={resolvedLook} />
                      {tip.doneLabel ?? "Done"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={["ui-tp__btn", tip.primary && "ui-tp__btn--primary"].filter(Boolean).join(" ")}
                      data-focus-key={`tip-${tip.id}`}
                      onClick={(e) => {
                        if (rescueFocus(e.currentTarget, [root.current])) refocus.current = tip.id;
                        setDoneIds((d) => (d.includes(tip.id) ? d : [...d, tip.id]));
                        setStatus(`${tip.title}: ${tip.doneLabel ?? "Done"}. ${doneCount + 1} of ${tips.length} done.`);
                        tip.onAction?.();
                      }}
                    >
                      {tip.action}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <span className="ui-tp__sr" role="status">
          {status}
        </span>

        {onClose && (
          <footer className="ui-tp__foot">
            <button type="button" className="ui-tp__btn" onClick={onClose}>
              {closeLabel}
            </button>
          </footer>
        )}
      </section>
    </>
  );
}

/** Keyboard key for tip descriptions, e.g. <Kbd>⌘K</Kbd> */
export const Kbd = ({ children }: { children: ReactNode }) => <kbd className="ui-tp__kbd">{children}</kbd>;

const CheckIcon = ({ look }: { look: Look }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    {look === "clean" ? (
      <>
        <circle cx="8" cy="8" r="6.5" fill="currentColor" />
        <path d="m5.6 8.1 1.7 1.7 3.2-3.4" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      <>
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path d="m5 8.2 2 2 4-4.2" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
  </svg>
);

/* ---------- Shared helpers (inlined from src/internal) ---------- */

// Written as the literal `process.env.NODE_ENV` so bundlers replace it and production builds skip the warning;
// without a bundler `process` doesn't exist and the warning stays off
declare const process: { env: { NODE_ENV?: string } };
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

/**
 * State that a parent may control. `value` defined → controlled: the component shows `value` and only asks for
 * changes through `onChange`. `value` undefined → uncontrolled: the component keeps its own state, starting at
 * `defaultValue`, and still reports changes. Whether `onChange` is passed never decides which – passing a callback
 * for analytics must not freeze the component.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: a controlled value nobody can change is almost always a
  // starting value passed to the wrong prop, so say so once (in development)
  const warned = useRef(false);
  if (controlled && !onChange && !warned.current && DEV) {
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

/** Connected, not inside something inert or hidden, not disabled */
const focusable = (el: Element | null | undefined): boolean =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Moves focus to the first usable target, but only if focus is inside `from` now (call it before removing, disabling
 * or inerting `from`). Targets may be elements, selectors (looked up inside `within`, default document) or functions.
 */
function rescueFocus(
  from: Element | null | undefined,
  targets: Array<Element | string | null | undefined | (() => Element | null | undefined)>,
  within: ParentNode = document,
) {
  const active = document.activeElement;
  if (!from || !active || !from.contains(active)) return false;
  for (const t of targets) {
    const el = typeof t === "function" ? t() : typeof t === "string" ? within.querySelector(t) : t;
    if (el !== active && focusable(el)) {
      (el as HTMLElement).focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}

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
.ui-tp:where([data-look="standard"]),
.ui-tp__portal:where([data-look="standard"]) {
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xl: 16px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 1px;
  --_tc-kbd-bg: light-dark(#ffffff, #19191b);
  --_tc-kbd-fg: light-dark(#404040, #c8c8cc);
  --_tc-kbd-font-size: 10.5px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 18px;
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 5px;
  --_tc-kbd-shadow: inset 0 0 0 1px light-dark(#dedede, #3a3a40), 0 1px 0 light-dark(#ececec, #2a2a2e);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-xl: 12px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-tp:where([data-look="clean"]),
.ui-tp__portal:where([data-look="clean"]) {
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xl: 16px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 0.5px;
  --_tc-kbd-bg: light-dark(#ffffff, #1c1c1e);
  --_tc-kbd-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-kbd-font-size: 10px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 16px;
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 4px;
  --_tc-kbd-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-xl: 12px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-tp {
  /* Height of the tip list before it scrolls */
  --tc-tips-panel-max-height: 420px;
  box-sizing: border-box;
  width: 100%;
  max-width: 760px;
  /* Like the Chat Composer: a gray tray with heading and footer, the white card sits on top of it */
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  /* The gray tray frames the white card on every side */
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-tp */
:where([data-look="clean"], [data-look="clean"] *).ui-tp {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  /* Height of the tip list before it scrolls */
  --tc-tips-panel-max-height: 420px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  /* One white card – the edge is a shadow, not a border */
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-tp *, .ui-tp *::before, .ui-tp *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *):where(.ui-tp) button { margin: 0; font: inherit; cursor: pointer; }
:where([data-look="standard"], [data-look="standard"] *).ui-tp__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 20px 12px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__title {
  margin: 0;
  font-size: var(--tc-font-size-xl, var(--_tc-font-size-xl));
  font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold));
  line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed));
  letter-spacing: -0.01em;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__count {
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__card {
  container-type: inline-size;
  max-height: var(--tc-tips-panel-max-height);
  overflow-y: auto;
  scrollbar-width: thin;
  background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray));
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 14px;
  list-style: none;
}
:where([data-look="clean"], [data-look="clean"] *):where(.ui-tp) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-tp button:focus-visible,
.ui-tp__done:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-tp) svg { display: block; flex: none; }
/* ----- Head ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-tp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
:where([data-look="clean"], [data-look="clean"] *).ui-tp__title {
  margin: 0;
  font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose));
  color: var(--tc-text-strong, var(--_tc-text-strong));
}
:where([data-look="clean"], [data-look="clean"] *).ui-tp__count {
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  white-space: nowrap;
}
/* ----- The tip list: the only part that scrolls (Clean: no card of its own) ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-tp__card {
  container-type: inline-size;
  max-height: var(--tc-tips-panel-max-height);
  overflow-y: auto;
  scrollbar-width: thin;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tp__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 12px;
  list-style: none;
}
@container (max-width: 560px) { .ui-tp__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@container (max-width: 380px) { .ui-tp__grid { grid-template-columns: minmax(0, 1fr); } }
:where([data-look="standard"], [data-look="standard"] *).ui-tp__tip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 16px 14px;
  border: 1px solid var(--tc-border-default, var(--_tc-border-default));
  border-radius: var(--tc-radius-xl, var(--_tc-radius-xl));
  animation: ui-tp-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
  transition: background-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), border-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__tip[data-done] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="standard"], [data-look="standard"] *).ui-tp__tip-title {
  margin: 0;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__tip-text {
  flex: 1;
  margin: 6px 0 14px;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
/* Each tip is a quiet tile: a hairline drawn as an inset shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-tp__tip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default));
  animation: ui-tp-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
  transition: background-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-tp__tip[data-done] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-tp__tip-title {
  margin: 0;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-strong, var(--_tc-text-strong));
}
:where([data-look="clean"], [data-look="clean"] *).ui-tp__tip-text {
  flex: 1;
  margin: 2px 0 12px;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
/* Secondary: white with the card shadow */
/* Key chip: the kbd pattern */
.ui-tp__kbd {
  display: inline-grid;
  place-items: center;
  min-width: var(--tc-kbd-h, var(--_tc-kbd-h));
  height: var(--tc-kbd-h, var(--_tc-kbd-h));
  padding: 0 var(--tc-kbd-px, var(--_tc-kbd-px));
  border-radius: var(--tc-kbd-radius, var(--_tc-kbd-radius));
  background: var(--tc-kbd-bg, var(--_tc-kbd-bg));
  box-shadow: var(--tc-kbd-shadow, var(--_tc-kbd-shadow));
  font-family: inherit;
  font-size: var(--tc-kbd-font-size, var(--_tc-kbd-font-size));
  font-weight: var(--tc-kbd-font-weight, var(--_tc-kbd-font-weight));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  color: var(--tc-kbd-fg, var(--_tc-kbd-fg));
  vertical-align: 1px;
}
/* Actions look exactly like Button: secondary by default, primary (flat ink) for the one important tip */
.ui-tp__btn {
  display: inline-flex;
  align-items: center;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border: 0;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  white-space: nowrap;
  transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-tp__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
.ui-tp__btn--primary {
  background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg));
  box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow));
  color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg));
}
.ui-tp__btn--primary:hover { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); }
.ui-tp__btn--primary:active { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); }
.ui-tp__btn:active { transform: scale(0.98); }
.ui-tp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-tp__done {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-accent-text, var(--_tc-accent-text));
  animation: ui-tp-pop var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__foot { padding: 8px 10px 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-tp:not(:has(.ui-tp__foot)) { padding-bottom: 8px; }
/* Primary: the dark chip */
:where([data-look="clean"], [data-look="clean"] *).ui-tp__done {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-accent-text, var(--_tc-accent-text));
  animation: ui-tp-pop var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
/* ----- The last row inside the card ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-tp__foot {
  display: flex;
  justify-content: flex-end;
  padding: 8px;
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
@keyframes ui-tp-in {
  from { opacity: 0; transform: translateY(4px); }
}
@keyframes ui-tp-pop {
  from { opacity: 0; transform: scale(0.94); }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-tp__tip,
:where([data-look="standard"], [data-look="standard"] *).ui-tp__done { animation: none; }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-tp__btn,
:where([data-look="clean"], [data-look="clean"] *).ui-tp__done { height: 34px; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-tp__tip,
:where([data-look="clean"], [data-look="clean"] *).ui-tp__done { animation: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-tp__tip,
:where([data-look="clean"], [data-look="clean"] *).ui-tp__btn { transition: none; }
}
`;

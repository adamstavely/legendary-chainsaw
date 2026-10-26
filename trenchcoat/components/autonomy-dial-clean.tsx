"use client";

/*
 * Autonomy Dial – how much an agent may do on its own, in a single self-contained file.
 * A white card on a soft gray tray: three levels as a segmented control – Always ask, If risky, Full auto – with a raised
 * pill that glides to the chosen one, and the agent's real actions on the tray below, as small cards in two groups,
 * "Runs on its own" and "Asks you first"; risky and destructive ones carry a small tag.
 *   · pick a level and the actions glide from one group to the other, so the setting reads as what it does
 *   · the lock on an action pins it to "Asks you first", whatever the dial says – e.g. spending money
 *   · the counts next to both groups roll when they change
 * Click a level or use the arrow keys. Controlled or uncontrolled for both the level and the pins.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: autonomy-dial.tsx is Standard,
 * autonomy-dial-clean.tsx is Clean). Clean is one quiet white card: the chosen level is marked without a gliding
 * pill, and the two groups of actions sit inside the card, below the levels, instead of on a tray.
 */
// Generated from src/components/autonomy-dial.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-ad";

export type AutonomyLevel = 0 | 1 | 2;
export type ActionRisk = "safe" | "risky" | "destructive";

export type AgentAction = {
  id: string;
  label: string;
  /** A few words on what it touches, e.g. "Gmail · to customers" */
  detail?: string;
  risk: ActionRisk;
  /** A 16px glyph or a small brand mark */
  icon?: ReactNode;
};

type AutonomyDialOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in autonomy-dial.tsx, Clean in autonomy-dial-clean.tsx */
  look?: Look;
  actions: AgentAction[];
  /** 0 Ask every time · 1 Ask before risky actions · 2 Full auto. Controlled when defined */
  level?: AutonomyLevel;
  /** Starting level when `level` isn't controlled */
  defaultLevel?: AutonomyLevel;
  /** Called with the new level on every change, controlled or not */
  onLevelChange?: (level: AutonomyLevel) => void;
  /** Ids of actions that always ask, whatever the level. Controlled when defined */
  pinned?: string[];
  /** Starting pins when `pinned` isn't controlled */
  defaultPinned?: string[];
  /** Called with the new list of pinned ids on every change, controlled or not */
  onPinnedChange?: (pinned: string[]) => void;
  /** Heading, e.g. the agent's name */
  title?: string;
  /** Line under the heading */
  subtitle?: string;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type AutonomyDialProps = Omit<ComponentPropsWithoutRef<"div">, keyof AutonomyDialOwnProps> & AutonomyDialOwnProps;

const NONE: string[] = [];
/** Where each row sits, relative to the root, and how tall the gliding box is – the "before" of a move */
type Snapshot = { rows: Map<string, number>; height: number };

/** Does the agent have to ask before this action? */
export const asksFirst = (action: AgentAction, level: AutonomyLevel, pinned: string[] = []) =>
  pinned.includes(action.id) || level === 0 || (level === 1 && action.risk !== "safe");

/* ---------- Helpers ---------- */

const LEVELS: { id: AutonomyLevel; label: string; hint: string }[] = [
  { id: 0, label: "Always ask", hint: "Nothing happens without your OK" },
  { id: 1, label: "If risky", hint: "Safe actions run, risky ones wait for you" },
  { id: 2, label: "Full auto", hint: "Everything runs, except what you locked" },
];
const RISK: Record<ActionRisk, string> = { safe: "", risky: "Risky", destructive: "Destructive" };
/** A calm in-and-out – the rows settle without a snap */
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const clamp = (n: number): AutonomyLevel => (Math.max(0, Math.min(2, Math.round(n))) as AutonomyLevel);

/* ---------- Icons ---------- */

/* Risk, lock and unlock – triangle-alert, octagon-alert, lock-keyhole and lock-keyhole-open, rounded 1.5px strokes: Lucide (ISC, lucide.dev) */
const RiskyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);
const DestructiveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 16h.01" />
    <path d="M12 8v4" />
    <path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z" />
  </svg>
);
const LockedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="16" r="1" />
    <rect x="3" y="10" width="18" height="12" rx="2" />
    <path d="M7 10V7a5 5 0 0 1 10 0v3" />
  </svg>
);
const UnlockedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="16" r="1" />
    <rect width="18" height="12" x="3" y="10" rx="2" />
    <path d="M7 10V7a5 5 0 0 1 9.33-2.5" />
  </svg>
);

const Spark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor" />
    <circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55" />
  </svg>
);
const DotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="2.4" fill="currentColor" />
  </svg>
);

/** A number that rolls to its new value */
function Roll({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    if (value === shown) return;
    setDir(value > shown ? "up" : "down");
    setShown(value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps -- rolls only when the value changes
  return (
    <span key={shown} className="ui-ad__roll" data-dir={dir ?? undefined}>
      {shown}
    </span>
  );
}

export function AutonomyDial({
  look,
  actions,
  level,
  defaultLevel = 1,
  onLevelChange,
  pinned,
  defaultPinned = NONE,
  onPinnedChange,
  title = "Agent permissions",
  subtitle = "What it may do without asking you",
  className,
  ref,
  ...rest
}: AutonomyDialProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  // Standard: a gliding pill under the chosen level, and the groups on the tray below the card.
  // Clean: no pill, and the groups inside the card
  const isClean = resolvedLook === "clean";
  const uid = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  const [lvl, changeLevel] = useControllable<AutonomyLevel>(level, defaultLevel, onLevelChange, "level");
  const [pins, setPins] = useControllable<string[]>(pinned, defaultPinned, onPinnedChange, "pinned");
  // A pinned or unpinned action moves to the other group (a new element): focus follows its lock button there,
  // through the shared data-focus-key, instead of dropping to <body> (WCAG 2.4.3)
  useFocusRescue(rootRef);

  // Both measure the rows first, so they glide from where they are now
  const setLevel = (next: AutonomyLevel) => {
    if (next === lvl) return;
    snapshot();
    changeLevel(next);
  };
  const togglePin = (id: string) => {
    snapshot();
    setPins(pins.includes(id) ? pins.filter((p) => p !== id) : [...pins, id]);
  };

  const own = actions.filter((a) => !asksFirst(a, lvl, pins));
  const ask = actions.filter((a) => asksFirst(a, lvl, pins));

  /* ---------- The levels: a segmented control, arrow keys move between them ---------- */

  const segRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  // The pill sits under the chosen level – the levels are as wide as their words, so it is measured
  useLayoutEffect(() => {
    if (isClean) return;
    const btn = segRef.current?.querySelector<HTMLElement>(`[data-level="${lvl}"]`);
    if (btn) setPill({ x: btn.offsetLeft, w: btn.offsetWidth });
  }, [lvl, isClean]);
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = clamp(lvl + step);
    setLevel(next);
    segRef.current?.querySelector<HTMLElement>(`[data-level="${next}"]`)?.focus();
  };

  /* ---------- Motion: actions glide between the groups ---------- */

  const rows = useRef(new Map<string, HTMLElement>());
  const cardRef = useRef<HTMLDivElement>(null);
  const shape = `${own.map((a) => a.id).join(",")}|${ask.map((a) => a.id).join(",")}`;
  const lastShape = useRef(shape);
  // Layout is read only in event handlers and layout effects, never during render: a click measures right before
  // it changes anything; a change from the parent glides from where the rows were after the last move
  const before = useRef<Snapshot | null>(null);
  const measure = (): Snapshot | null => {
    const root = rootRef.current;
    if (!root) return null;
    const top = root.getBoundingClientRect().top;
    // The box whose height glides: the whole tray in Standard, the card in Clean
    const height = (isClean ? cardRef.current : root)?.offsetHeight ?? 0;
    return { rows: new Map([...rows.current].map(([id, el]) => [id, el.getBoundingClientRect().top - top])), height };
  };
  const snapshot = () => {
    before.current = measure();
  };
  useLayoutEffect(() => {
    if (lastShape.current === shape) {
      // First layout (or a new look): the baseline for the next move
      if (!before.current) before.current = measure();
      return;
    }
    lastShape.current = shape;
    const from = before.current;
    const to = measure();
    before.current = to;
    if (reducedMotion() || !from || !to) return;
    const card = (isClean ? cardRef : rootRef).current;
    if (card && from.height && Math.abs(to.height - from.height) > 1) {
      card.animate([{ height: `${from.height}px` }, { height: `${to.height}px` }], { duration: 420, easing: EASE });
    }
    let k = 0;
    for (const [id, el] of rows.current) {
      const a = from.rows.get(id);
      const b = to.rows.get(id);
      if (a === undefined || b === undefined) continue;
      const dy = a - b;
      if (Math.abs(dy) < 1) continue;
      // Rows that change group glide a beat after each other
      el.animate([{ transform: `translateY(${dy}px)`, zIndex: 2 }, { transform: "none", zIndex: 2 }], {
        duration: 420,
        delay: k++ * 20,
        easing: EASE,
        fill: "backwards",
      });
    }
  }, [shape, isClean]); // eslint-disable-line react-hooks/exhaustive-deps -- measure reads refs only

  /* ---------- One action ---------- */

  const row = (a: AgentAction, asks: boolean) => {
    const isPinned = pins.includes(a.id);
    return (
      <li
        key={a.id}
        className="ui-ad__row"
        data-asks={asks ? "" : undefined}
        ref={(el) => {
          if (el) rows.current.set(a.id, el);
          else rows.current.delete(a.id);
        }}
      >
        <span className="ui-ad__icon">{a.icon ?? <DotIcon />}</span>
        <span className="ui-ad__name">
          <span className="ui-ad__line">
            <span className="ui-ad__label" title={a.label}>
              {a.label}
            </span>
            {a.risk !== "safe" && (
              <span className="ui-ad__risk" data-risk={a.risk}>
                {a.risk === "risky" ? <RiskyIcon /> : <DestructiveIcon />}
                {RISK[a.risk]}
              </span>
            )}
          </span>
          {a.detail && (
            <span className="ui-ad__detail" title={a.detail}>
              {a.detail}
            </span>
          )}
        </span>
        <button
          type="button"
          className="ui-ad__pin"
          aria-pressed={isPinned}
          aria-label={`Always ask before: ${a.label}`}
          data-focus-key={`pin:${a.id}`}
          title={isPinned ? "Always asks – click to follow the dial again" : "Always ask, whatever the dial says"}
          onClick={() => togglePin(a.id)}
        >
          {isPinned ? <LockedIcon /> : <UnlockedIcon />}
        </button>
      </li>
    );
  };

  const current = LEVELS[lvl];

  /* What it does on its own, and what waits for you – on the tray (Standard) or inside the card (Clean) */
  const groups = (
    <div className="ui-ad__groups">
      <section className="ui-ad__group" aria-labelledby={`${uid}-own`}>
        <h4 className="ui-ad__group-head" id={`${uid}-own`}>
          Runs on its own
          <span className="ui-ad__count">
            <Roll value={own.length} />
          </span>
        </h4>
        <ul className="ui-ad__list">
          {own.map((a) => row(a, false))}
          {own.length === 0 && <li className="ui-ad__empty">Every action waits for you</li>}
        </ul>
      </section>
      <section className="ui-ad__group" aria-labelledby={`${uid}-ask`}>
        <h4 className="ui-ad__group-head" id={`${uid}-ask`}>
          Asks you first
          <span className="ui-ad__count">
            <Roll value={ask.length} />
          </span>
        </h4>
        <ul className="ui-ad__list">
          {ask.map((a) => row(a, true))}
          {ask.length === 0 && <li className="ui-ad__empty">The agent runs everything itself</li>}
        </ul>
      </section>
    </div>
  );

  return (
    <div {...rest} ref={setRoot} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook} data-level={lvl}>
      <style href="ui-autonomy-dial" precedence="default">
        {css}
      </style>

      <div ref={cardRef} className="ui-ad__card">
        <header className="ui-ad__head">
          <span className="ui-ad__spark">
            <Spark />
          </span>
          <span className="ui-ad__heading">
            <span className="ui-ad__title" title={title}>
              {title}
            </span>
            {subtitle && (
              <span className="ui-ad__sub" title={subtitle}>
                {subtitle}
              </span>
            )}
          </span>
        </header>

        {/* ----- The levels ----- */}
        <div className="ui-ad__levels">
          <div
            ref={segRef}
            className="ui-ad__segmented"
            role="radiogroup"
            aria-label="Autonomy"
            aria-describedby={`${uid}-hint`}
            style={pill && !isClean ? { ["--x" as string]: `${pill.x}px`, ["--w" as string]: `${pill.w}px` } : undefined}
            onKeyDown={onKey}
          >
            {!isClean && <span className="ui-ad__pill" aria-hidden="true" />}
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={l.id === lvl}
                tabIndex={l.id === lvl ? 0 : -1}
                data-level={l.id}
                className="ui-ad__level"
                onClick={() => setLevel(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <span className="ui-ad__sr" id={`${uid}-hint`}>
            {current.hint}
          </span>
        </div>

        {isClean && groups}
      </div>

      {!isClean && groups}

      <span className="ui-ad__sr" aria-live="polite">
        {`${current.label}: ${own.length} on its own, ${ask.length} ask first`}
      </span>
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

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

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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
type Options = {
  /** Where focus goes when the control it was on is gone – gets that control's `data-focus-key` (if it had one) */
  fallback?: (key: string | null) => Element | null | undefined;
};

/**
 * Safety net for a component's root: when the focused element inside it is removed, disabled or made inert and
 * focus fell to <body>, focus moves (before paint) to
 *   1. an element with the same `data-focus-key` (the control was re-mounted, e.g. a card moved to another list),
 *   2. `fallback(key)`, e.g. the next row or the trigger,
 *   3. the root itself (made focusable with tabindex=-1 if it isn't).
 * Prefer moving focus explicitly with rescueFocus where the right target is known; this catches the rest.
 */
function useFocusRescue(root: RefObject<HTMLElement | null>, options: Options = {}) {
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    const el = root.current;
    if (!el || typeof MutationObserver !== "function") return;
    let last: HTMLElement | null = null;
    const onFocusIn = (e: FocusEvent) => {
      last = e.target instanceof HTMLElement ? e.target : null;
    };
    const check = () => {
      const prev = last;
      if (!prev || !el.isConnected) return;
      const gone = !focusable(prev);
      const active = document.activeElement;
      const lost = !active || active === document.body || active === prev;
      if (!lost || !gone) return;
      const key = prev.getAttribute("data-focus-key");
      const same = key ? [...el.querySelectorAll(`[data-focus-key="${CSS.escape(key)}"]`)].find((c) => c !== prev && focusable(c)) : null;
      const target = [same, latest.current.fallback?.(key)].find(focusable) as HTMLElement | undefined;
      last = null;
      if (target) target.focus({ preventScroll: true });
      else {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "inert", "hidden"] });
    el.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
    };
  }, [root]);
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-ad:where([data-look="standard"]),
.ui-ad__portal:where([data-look="standard"]) {
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-px: 8px;
  --_tc-pill-radius: 999px;
  --_tc-radius-badge: 999px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-seg-pad: 2px;
  --_tc-seg-thumb-bg: light-dark(#ffffff, #34343a);
  --_tc-seg-thumb-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-seg-track-bg: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-seg-track-radius: 10px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
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
.ui-ad:where([data-look="clean"]),
.ui-ad__portal:where([data-look="clean"]) {
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-px: 6px;
  --_tc-pill-radius: 5px;
  --_tc-radius-badge: 5px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-seg-pad: 2px;
  --_tc-seg-thumb-bg: light-dark(#ffffff, #34343a);
  --_tc-seg-thumb-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-seg-track-bg: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-seg-track-radius: 8px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
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

/* Colors and motion as variables – override them on .ui-ad */
.ui-ad {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: the card and the groups on a tray */
:where([data-look="standard"], [data-look="standard"] *).ui-ad {
  max-width: 420px;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  overflow: hidden;
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  letter-spacing: -0.006em;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ad {
  max-width: 400px;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
.ui-ad *, .ui-ad *::before, .ui-ad *::after { box-sizing: border-box; }
:where(.ui-ad) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-ad button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-ad ul { margin: 0; padding: 0; list-style: none; }
.ui-ad h4 { margin: 0; }
.ui-ad svg { display: block; flex: none; }
.ui-ad__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The card holds the heading and the levels – the edge is a shadow, not a border */
.ui-ad__card { position: relative; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__card { background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__card { overflow: hidden; background: var(--tc-surface-raised, var(--_tc-surface-raised)); }
.ui-ad__head { display: flex; align-items: center; padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4, var(--_tc-space-4)) 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__head { gap: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__head { gap: var(--tc-space-2-5, var(--_tc-space-2-5)); }
.ui-ad__spark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text, var(--_tc-accent-text)); }
.ui-ad__heading { display: grid; min-width: 0; }
.ui-ad__title { overflow: hidden; font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__title { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__title { color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-ad__sub { overflow: hidden; color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__sub { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__sub { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
/* ----- Standard levels: the segmented-control recipe – a track, a raised thumb glides to the chosen one ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ad__levels { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4, var(--_tc-space-4)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__segmented { position: relative; display: flex; padding: var(--tc-seg-pad, var(--_tc-seg-pad)); border-radius: var(--tc-seg-track-radius, var(--_tc-seg-track-radius)); background: var(--tc-seg-track-bg, var(--_tc-seg-track-bg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__pill { position: absolute; top: var(--tc-seg-pad, var(--_tc-seg-pad)); bottom: var(--tc-seg-pad, var(--_tc-seg-pad)); left: 0; width: var(--w, 0); border-radius: calc(var(--tc-seg-track-radius, var(--_tc-seg-track-radius)) - var(--tc-seg-pad, var(--_tc-seg-pad))); background: var(--tc-seg-thumb-bg, var(--_tc-seg-thumb-bg)); box-shadow: var(--tc-seg-thumb-shadow, var(--_tc-seg-thumb-shadow)); transform: translateX(var(--x, 0)); transition: transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), width var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level { position: relative; flex: 1; height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)); border-radius: calc(var(--tc-seg-track-radius, var(--_tc-seg-track-radius)) - var(--tc-seg-pad, var(--_tc-seg-pad))); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); text-align: center !important; white-space: nowrap; transition: color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* The chosen level: the thumb, the primary colour and the strong weight – not a fill alone */
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level[aria-checked="true"] { color: var(--tc-text-primary, var(--_tc-text-primary)); font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level[aria-checked="false"]:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* ----- On the tray: the two groups ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ad__groups { display: grid; gap: var(--tc-space-3-5, var(--_tc-space-3-5)); padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1, var(--_tc-space-1)); }
.ui-ad__group-head { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__group-head { margin: 0 var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) !important; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
/* The count: a small badge with a soft lift – no taller than the heading */
.ui-ad__count { display: grid; place-items: center; overflow: hidden; border-radius: var(--tc-radius-badge, var(--_tc-radius-badge)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__count { min-width: 18px; height: 18px; padding: 0 var(--tc-space-1, var(--_tc-space-1)); font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- Clean levels: three separate buttons ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ad__levels { padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4-5, var(--_tc-space-4-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__segmented { position: relative; display: flex; gap: var(--tc-space-2, var(--_tc-space-2)); }
/* The others are gray, the chosen one is white with a lift and a ≥ 3:1 selected edge (WCAG 1.4.11) */
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level { position: relative; flex: 1; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); text-align: center !important; white-space: nowrap; transition: color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level[aria-checked="true"] { background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)), var(--tc-shadow-raised, var(--_tc-shadow-raised)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level[aria-checked="false"]:hover { background: var(--tc-fill-strong, var(--_tc-fill-strong)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* ----- The two groups: spacing between them, one hairline above ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ad__groups { display: grid; gap: var(--tc-space-3-5, var(--_tc-space-3-5)); padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3, var(--_tc-space-3)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__group-head { margin: 0 var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-1, var(--_tc-space-1)) !important; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__count { min-width: 16px; height: 16px; padding: 0 var(--tc-space-1, var(--_tc-space-1)); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-ad__roll { display: block; }
.ui-ad__roll[data-dir="up"] { animation: ui-ad-roll-up var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-ad__roll[data-dir="down"] { animation: ui-ad-roll-down var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-ad__list { display: grid; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__list { gap: var(--tc-space-1, var(--_tc-space-1)); }
.ui-ad__row { position: relative; display: flex; align-items: center; gap: var(--tc-space-3, var(--_tc-space-3)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__row { min-height: 42px; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-3-5, var(--_tc-space-3-5)); border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__row { min-height: 30px; padding: 0 var(--tc-space-1, var(--_tc-space-1)) 0 var(--tc-space-1-5, var(--_tc-space-1-5)); border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__row:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
.ui-ad__icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
.ui-ad__icon > svg { width: 16px; height: 16px; }
.ui-ad__name { display: grid; flex: 1; min-width: 0; }
/* The name and its risk tag wrap onto two lines rather than the tag cutting the name off */
.ui-ad__line { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5, var(--_tc-space-0-5)) var(--tc-space-2, var(--_tc-space-2)); min-width: 0; }
.ui-ad__label { min-width: 0; max-width: 100%; overflow: hidden; color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__label { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
.ui-ad__detail { overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
/* Risk: a small pill right after the name – glyph and word; safe actions carry nothing */
.ui-ad__risk { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); height: var(--tc-pill-h, var(--_tc-pill-h)); padding: 0 var(--tc-pill-px, var(--_tc-pill-px)) 0 calc(var(--tc-pill-px, var(--_tc-pill-px)) - 2px); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
.ui-ad__risk > svg { width: 12px; height: 12px; }
.ui-ad__risk[data-risk="destructive"] { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* The lock: an icon button like Button's ghost icon button, always visible (≥ 3:1) */
.ui-ad__pin { display: grid; flex: none; place-items: center; border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__pin { width: var(--tc-control-h-sm, var(--_tc-control-h-sm)); height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__pin { width: var(--tc-control-h-md, var(--_tc-control-h-md)); height: var(--tc-control-h-md, var(--_tc-control-h-md)); }
.ui-ad__pin:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-ad__pin[aria-pressed="true"] { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* Empty group: one quiet tag across the whole width */
.ui-ad__empty { display: flex; align-items: center; justify-content: center; background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-muted, var(--_tc-text-muted)); text-align: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__empty { min-height: 42px; padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-3, var(--_tc-space-3)); border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__empty { min-height: 30px; margin: var(--tc-space-0-5, var(--_tc-space-0-5)) 0; padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2-5, var(--_tc-space-2-5)); border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
@keyframes ui-ad-roll-up { from { opacity: 0; transform: translateY(70%); } }
@keyframes ui-ad-roll-down { from { opacity: 0; transform: translateY(-70%); } }
/* Narrow containers: the levels get tighter – the details stay (truncated, the full text in a tooltip) */
@container (max-width: 340px) {
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level { padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__segmented { gap: var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level { padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1-5, var(--_tc-space-1-5)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level { height: 36px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__pin { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level { padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__pin { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__row { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-ad *, .ui-ad *::before, .ui-ad *::after { animation: none !important; transition: none !important; }
}
`;

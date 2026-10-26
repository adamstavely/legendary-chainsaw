"use client";

/*
 * Smart Recommendation – a suggestion card with a confidence signal, alternatives and one-click accept, in a single
 * self-contained file. Fold it away, pick an alternative instead, accept and undo.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: smart-recommendation.tsx is Standard,
 * smart-recommendation-clean.tsx is Clean). Clean drops the tray: one white card with hairline shadows and quiet
 * gray type, a solid blue sparkle as the mark, the signal and the actions in the card's last row, and thin icons on
 * the Alternatives and Undo buttons.
 */
// Generated from src/components/smart-recommendation.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-sr";

export type Recommendation = {
  id: string;
  /** Short name, used in the accept button, e.g. "Incremental sync" */
  label: string;
  /** One sentence why – shown in the card */
  reason: ReactNode;
  /** 0 = no signal, 1 = weak, 2 = good, 3 = strong */
  signal: 0 | 1 | 2 | 3;
};

type SmartRecommendationOwnProps = {
  title?: string;
  /**
   * First entry is the recommendation, the rest are offered as alternatives. A new set of options starts over
   * (uncontrolled choice and acceptance go back to the recommendation); an empty list shows the card with nothing to accept
   */
  options: Recommendation[];
  /** Id of the option on show (controlled when defined) – the recommendation or an alternative */
  value?: string;
  /** The option on show at first when uncontrolled – defaults to the recommendation */
  defaultValue?: string;
  /** Called when an alternative (or the recommendation again) is picked from the menu */
  onValueChange?: (id: string) => void;
  /** Id of the accepted option, or null (controlled when defined). onAccept / onUndo report the changes */
  accepted?: string | null;
  defaultAccepted?: string | null;
  /**
   * Accepts the option. Return a promise to keep the button pending until it settles: the option counts as
   * accepted once it resolves, and a rejection says so and lets you try again
   */
  onAccept?: (option: Recommendation) => void | Promise<unknown>;
  /** Takes the acceptance back – may return a promise, like onAccept */
  onUndo?: (option: Recommendation) => void | Promise<unknown>;
  /** Whether the reason is unfolded (controlled when defined) */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Visual style. Defaults to the file's look: Standard in smart-recommendation.tsx, Clean in smart-recommendation-clean.tsx */
  look?: Look;
  className?: string;
};

export type SmartRecommendationProps = Omit<ComponentPropsWithoutRef<"section">, keyof SmartRecommendationOwnProps> &
  SmartRecommendationOwnProps & {
    /** The root <section> */
    ref?: Ref<HTMLElement>;
  };

const isPromise = (value: unknown): value is Promise<unknown> =>
  !!value && typeof (value as Promise<unknown>).then === "function";

/** A change handler for state whose changes another callback already reports (keeps useControllable from warning) */
const reportedElsewhere = () => {};

const signalText = ["No signal", "Weak signal", "Good signal", "Strong signal"];

export function SmartRecommendation({
  title = "Smart recommendation",
  options,
  value,
  defaultValue,
  onValueChange,
  accepted: acceptedProp,
  defaultAccepted = null,
  onAccept,
  onUndo,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  look,
  className,
  ref,
  ...rest
}: SmartRecommendationProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const [chosen, setChosen] = useControllable(value, defaultValue ?? options[0]?.id ?? "", onValueChange);
  // onAccept / onUndo report acceptance (they may be async), so it has no change callback of its own here
  const [accepted, setAccepted] = useControllable<string | null>(
    acceptedProp,
    defaultAccepted,
    onAccept || onUndo ? reportedElsewhere : undefined,
  );
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [menu, setMenu] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  const menuId = `${useId()}-menu`;
  // Accept ⇄ Undo swap their buttons and a pick closes the menu: focus lands on the action that is there now
  useFocusRescue(rootRef, {
    fallback: () =>
      rootRef.current?.querySelector(".ui-sr__btn--primary") ?? rootRef.current?.querySelector(".ui-sr__actions .ui-sr__btn") ?? rootRef.current?.querySelector(".ui-sr__head"),
  });
  const trigger = () => menuRef.current?.querySelector<HTMLElement>("[aria-haspopup]");
  const items = () => [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
  /** Closes the menu; focus goes back to its trigger when it was inside (the menu pattern) */
  const closeMenu = (refocus = true) => {
    if (refocus) rescueFocus(menuRef.current?.querySelector('[role="menu"]'), [trigger]);
    setMenu(false);
  };
  // Opening moves focus into the menu, onto the option on show
  useEffect(() => {
    if (!menu) return;
    const list = items();
    (list.find((el) => el.getAttribute("aria-checked") === "true") ?? list[0])?.focus();
  }, [menu]);
  const onMenuKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const to = e.key === "ArrowDown" ? (at + 1) % list.length : e.key === "ArrowUp" ? (at - 1 + list.length) % list.length : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : -1;
    if (to >= 0) {
      e.preventDefault();
      list[to]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
    } else if (e.key === "Tab") closeMenu(false);
  };
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // A new set of options starts over: back to the recommendation, nothing accepted (when the panel holds them)
  const optionsKey = options.map((o) => o.id).join("\u0000");
  const seenOptions = useRef(optionsKey);
  useLayoutEffect(() => {
    if (seenOptions.current === optionsKey) return;
    seenOptions.current = optionsKey;
    if (value === undefined) setChosen(options[0]?.id ?? "");
    if (acceptedProp === undefined) setAccepted(null);
    setMenu(false);
    setFailed(null);
    // Only a new options key starts over – the props read here are the latest at that moment
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the option ids, not on every new array
  }, [optionsKey]);

  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [menu]);

  const current: Recommendation | undefined = options.find((o) => o.id === chosen) ?? options[0];
  const isRecommended = !current || current.id === options[0]?.id;
  const done = !!current && accepted === current.id;

  // Accept and Undo: a promise keeps the button pending; a rejection is reported and leaves things as they were
  const run = (work: () => unknown, apply: () => void, what: string) => {
    if (pending) return;
    setFailed(null);
    const result = work();
    if (!isPromise(result)) return apply();
    setPending(true);
    result.then(
      () => {
        if (!alive.current) return;
        setPending(false);
        apply();
      },
      () => {
        if (!alive.current) return;
        setPending(false);
        setFailed(`Couldn't ${what}. Try again.`);
      },
    );
  };

  const head = (
    <button type="button" className="ui-sr__head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
      {clean ? <SparkMark /> : <SparkIcon />}
      <span className="ui-sr__title">{title}</span>
      {!isRecommended && <span className="ui-sr__pill">Alternative</span>}
      <span className="ui-sr__chevron">
        <Icon clean={clean} d="m4.5 6.25 3.5 3.5 3.5-3.5" />
      </span>
    </button>
  );
  const body = (
    <div className="ui-sr__body" data-open={open || undefined} inert={!open}>
      <p className="ui-sr__reason" key={current?.id}>
        {current ? current.reason : "No recommendation right now."}
      </p>
    </div>
  );

  return (
    <>
      <style href="ui-smart-recommendation" precedence="default">
        {css}
      </style>
      <section
        aria-label={title}
        {...rest}
        ref={setRoot}
        className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
        data-look={resolvedLook}
        data-accepted={done || undefined}
      >
        {/* Standard: head and reason sit on a card of their own above the tray; Clean: rows of the one card */}
        {clean ? (
          <>
            {head}
            {body}
          </>
        ) : (
          <div className="ui-sr__card">
            {head}
            {body}
          </div>
        )}

        <footer className="ui-sr__foot">
          {failed ? (
            <span className="ui-sr__signal ui-sr__error" role="alert">
              {failed}
            </span>
          ) : (
            <span className="ui-sr__signal" data-level={current?.signal ?? 0} title={signalText[current?.signal ?? 0]}>
              <span className="ui-sr__bars" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <span key={n} data-on={(current?.signal ?? 0) >= n || undefined} />
                ))}
              </span>
              {signalText[current?.signal ?? 0]}
            </span>
          )}

          <div className="ui-sr__actions">
            {current && options.length > 1 && !done && (
              <div className="ui-sr__alt" ref={menuRef}>
                <button
                  type="button"
                  className={clean ? "ui-sr__btn ui-sr__btn--icon" : "ui-sr__btn"}
                  aria-haspopup="menu"
                  aria-expanded={menu}
                  aria-controls={menu ? menuId : undefined}
                  onClick={() => setMenu((m) => !m)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault();
                      setMenu(true);
                    } else if (e.key === "Escape" && menu) closeMenu();
                  }}
                >
                  {clean && <Icon clean d="M5 12.5v-9M2.75 5.75 5 3.5l2.25 2.25M11 3.5v9M8.75 10.25 11 12.5l2.25-2.25" />}
                  Alternatives
                </button>
                {menu && (
                  <div className="ui-sr__menu" role="menu" id={menuId} aria-label="Alternatives" onKeyDown={onMenuKey}>
                    {options.map((o, i) => (
                      <button
                        key={o.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={o.id === chosen}
                        tabIndex={-1}
                        className="ui-sr__option"
                        onClick={() => {
                          setChosen(o.id);
                          closeMenu();
                          setOpen(true);
                        }}
                      >
                        <span className="ui-sr__option-label">
                          <span className="ui-sr__option-name">{o.label}</span>
                          {i === 0 && <span className="ui-sr__tag">Recommended</span>}
                        </span>
                        {/* The chosen one: a check, not only a fill */}
                        <svg className="ui-sr__check" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="m4 8.25 2.6 2.6L12 5.25" />
                        </svg>
                        <span className="ui-sr__mini" data-level={o.signal}>
                          {[1, 2, 3].map((n) => (
                            <span key={n} data-on={o.signal >= n || undefined} aria-hidden="true" />
                          ))}
                          <span className="ui-sr__sr">{`, ${signalText[o.signal]}`}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!current ? null : done ? (
              <>
                <span className="ui-sr__done" role="status">
                  <Icon clean={clean} d="m3.5 8.5 3 3 6-7" size={clean ? 16 : 14} />
                  <span className="ui-sr__done-text">{current.label} accepted</span>
                </span>
                <button
                  type="button"
                  className={clean ? "ui-sr__btn ui-sr__btn--icon" : "ui-sr__btn"}
                  aria-busy={pending || undefined}
                  aria-disabled={pending || undefined}
                  onClick={() => run(() => onUndo?.(current), () => setAccepted(null), "undo")}
                >
                  {clean && <Icon clean d="M3.5 6.5h6.25a2.75 2.75 0 0 1 0 5.5H8M5.75 4.25 3.5 6.5l2.25 2.25" />}
                  Undo
                </button>
              </>
            ) : (
              <button
                type="button"
                className="ui-sr__btn ui-sr__btn--primary"
                aria-busy={pending || undefined}
                aria-disabled={pending || undefined}
                onClick={() => {
                  setMenu(false);
                  run(() => onAccept?.(current), () => setAccepted(current.id), "accept it");
                }}
              >
                Accept {current.label.toLowerCase()}
              </button>
            )}
          </div>
        </footer>
      </section>
    </>
  );
}

/** Standard's mark: a box with a plus */
const SparkIcon = () => (
  <svg className="ui-sr__spark" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 3.5H4A1.5 1.5 0 0 0 2.5 5v7A1.5 1.5 0 0 0 4 13.5h7a1.5 1.5 0 0 0 1.5-1.5V8" />
    <path d="M12.5 1.5v4M10.5 3.5h4" />
  </svg>
);

/** Clean's mark: a solid blue sparkle with a small one beside it */
const SparkMark = () => (
  <svg viewBox="0 0 16 16" className="ui-sr__mark" aria-hidden="true">
    <path d="M6.5 2.2c.2 0 .36.14.4.33.53 2.6 1.4 3.48 4 4.02a.4.4 0 0 1 0 .79c-2.6.53-3.47 1.4-4 4a.4.4 0 0 1-.8 0c-.53-2.6-1.4-3.47-4-4a.4.4 0 0 1 0-.79c2.6-.54 3.47-1.42 4-4.02a.4.4 0 0 1 .4-.33Z" />
    <path d="M12 9.6c.12 0 .22.08.25.2.28 1.3.72 1.75 2.03 2.03a.25.25 0 0 1 0 .49c-1.31.28-1.75.72-2.03 2.03a.25.25 0 0 1-.5 0c-.28-1.31-.72-1.75-2.03-2.03a.25.25 0 0 1 0-.49c1.31-.28 1.75-.73 2.03-2.03a.25.25 0 0 1 .25-.2Z" />
  </svg>
);

/** Line icons – Clean draws them thinner */
const Icon = ({ d, size = 16, clean }: { d: string; size?: number; clean: boolean }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={clean ? "1.1" : "1.5"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
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
.ui-sr:where([data-look="standard"]),
.ui-sr__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
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
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #232326);
  --_tc-menu-item-font-size: 13px;
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-menu-item-px: 10px;
  --_tc-menu-item-radius: 8px;
  --_tc-menu-item-selected-fg: light-dark(#2456d6, #8ab4ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 12px;
  --_tc-menu-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-h-lg: 22px;
  --_tc-pill-px: 8px;
  --_tc-pill-px-lg: 10px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tone-violet-bg: light-dark(rgba(105, 65, 198, 0.1), rgba(150, 110, 240, 0.16));
  --_tc-tone-violet-fg: light-dark(#6941c6, #b9a2f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
  --_tc-z-dropdown: 30;
}
.ui-sr:where([data-look="clean"]),
.ui-sr__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
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
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #252527);
  --_tc-menu-item-font-size: 13px;
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-menu-item-px: 8px;
  --_tc-menu-item-radius: 6px;
  --_tc-menu-item-selected-fg: light-dark(#0058cf, #70b8ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 10px;
  --_tc-menu-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-h-lg: 20px;
  --_tc-pill-px: 6px;
  --_tc-pill-px-lg: 8px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tone-violet-bg: light-dark(rgba(91, 91, 214, 0.08), rgba(130, 120, 240, 0.15));
  --_tc-tone-violet-fg: light-dark(#5b45b8, #b7a6f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
  --_tc-z-dropdown: 30;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-sr {
  box-sizing: border-box;
  width: 100%;
  max-width: 440px;
  container-type: inline-size;
  /* Like the Chat Composer: the white card on a gray tray, the actions live in the tray below */
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  /* The gray tray frames the white card on every side – the tray recipe */
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-sr */
:where([data-look="clean"], [data-look="clean"] *).ui-sr {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 440px;
  /* One white card – the edge is a shadow, not a border */
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-sr *, .ui-sr *::before, .ui-sr *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr button { margin: 0; font: inherit; color: inherit; cursor: pointer; }
.ui-sr button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__card {
  padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2));
  /* The card on the tray */
  background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray));
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  width: 100%;
  height: 40px;
  padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5));
  border: 0;
  border-radius: var(--tc-radius-xl, var(--_tc-radius-xl));
  background: transparent;
  text-align: left;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__head:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__spark { flex: none; color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__title { font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__pill {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h, var(--_tc-pill-h));
  padding: 0 var(--tc-pill-px, var(--_tc-pill-px));
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  background: var(--tc-tone-violet-bg, var(--_tc-tone-violet-bg));
  font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size));
  font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight));
  color: var(--tc-tone-violet-fg, var(--_tc-tone-violet-fg));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__chevron { display: grid; margin-left: auto; color: var(--tc-text-muted, var(--_tc-text-muted)); transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-sr) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-sr) svg { display: block; flex: none; }
/* The heading row folds the reason in and out */
:where([data-look="clean"], [data-look="clean"] *).ui-sr__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  width: 100%;
  height: 44px;
  padding: 0 var(--tc-space-3, var(--_tc-space-3)) 0 var(--tc-space-4, var(--_tc-space-4));
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)) var(--tc-radius-lg, var(--_tc-radius-lg)) 0 0;
  text-align: left;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__head:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr button.ui-sr__head:focus-visible { outline-offset: -2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mark { width: 16px; height: 16px; fill: var(--tc-accent, var(--_tc-accent)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__title { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__pill {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg));
  padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg));
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  background: var(--tc-tone-violet-bg, var(--_tc-tone-violet-bg));
  font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg));
  font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  color: var(--tc-tone-violet-fg, var(--_tc-tone-violet-fg));
  animation: ui-sr-swap var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__chevron {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  margin-left: auto;
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__head:hover .ui-sr__chevron { color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-sr__head[aria-expanded="false"] .ui-sr__chevron { transform: rotate(-90deg); }
.ui-sr__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-sr__body[data-open] { grid-template-rows: 1fr; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__reason {
  min-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  line-height: 21px;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  animation: ui-sr-swap var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__body[data-open] .ui-sr__reason { padding-bottom: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__reason {
  min-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0 var(--tc-space-4, var(--_tc-space-4));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  animation: ui-sr-swap var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__body[data-open] .ui-sr__reason { padding-bottom: var(--tc-space-3-5, var(--_tc-space-3-5)); }
.ui-sr__reason strong { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__foot {
  display: flex;
  align-items: center;
  /* Narrow containers: the actions move below the signal instead of running out of the tray */
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5));
  min-height: 50px;
  padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-4, var(--_tc-space-4));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__signal {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  white-space: nowrap;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
/* The last row: the signal on the left, the actions on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-sr__foot {
  display: flex;
  align-items: center;
  /* Narrow cards: the actions move below the signal instead of running out of the card */
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5));
  min-height: 48px;
  padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-4, var(--_tc-space-4));
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__signal {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  white-space: nowrap;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
/* A failed accept or undo takes the signal's place until the next try */
.ui-sr__signal.ui-sr__error { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); white-space: normal; }
.ui-sr__bars, .ui-sr__mini { display: inline-flex; align-items: flex-end; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__bars span,
:where([data-look="standard"], [data-look="standard"] *).ui-sr__mini span {
  width: 3px;
  border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs));
  background: var(--tc-border-strong, var(--_tc-border-strong));
  transition: background-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__bars span:nth-child(1),
:where([data-look="standard"], [data-look="standard"] *).ui-sr__mini span:nth-child(1) { height: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__bars span:nth-child(2),
:where([data-look="standard"], [data-look="standard"] *).ui-sr__mini span:nth-child(2) { height: 9px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__bars span:nth-child(3),
:where([data-look="standard"], [data-look="standard"] *).ui-sr__mini span:nth-child(3) { height: 12px; }
:where([data-look="standard"], [data-look="standard"] *) [data-level="1"] > span[data-on] { background: var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); }
:where([data-look="standard"], [data-look="standard"] *) [data-level="2"] > span[data-on] { background: var(--tc-accent, var(--_tc-accent)); }
:where([data-look="standard"], [data-look="standard"] *) [data-level="3"] > span[data-on] { background: var(--tc-status-success-solid, var(--_tc-status-success-solid)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__signal[data-level="0"] .ui-sr__bars span:first-child { background: var(--tc-icon-muted, var(--_tc-icon-muted)); }
/* The actions wrap and shrink instead of running out of the card at 320px */
.ui-sr__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-width: 0; max-width: 100%; margin-left: auto; }
/* Secondary and primary: exactly like Button – the control geometry, flat ink for the primary (decision 1) */
:where([data-look="standard"], [data-look="standard"] *).ui-sr__btn {
  max-width: 100%;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  overflow: hidden;
  border: 0;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size)) !important;
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-sr__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__btn:active { transform: scale(0.98); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__btn--primary {
  background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg));
  box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow));
  color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)) !important;
}
.ui-sr__btn--primary:hover { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); }
.ui-sr__btn--primary:active { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__done {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  padding-right: var(--tc-space-1, var(--_tc-space-1));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-status-success-fg, var(--_tc-status-success-fg));
  animation: ui-sr-swap var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__bars span,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mini span {
  width: 3px;
  border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs));
  background: var(--tc-fill-strong, var(--_tc-fill-strong));
  transition: background-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__bars span:nth-child(1),
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mini span:nth-child(1) { height: 5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__bars span:nth-child(2),
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mini span:nth-child(2) { height: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__bars span:nth-child(3),
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mini span:nth-child(3) { height: 11px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr [data-level="1"] > span[data-on] { background: var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr [data-level="2"] > span[data-on] { background: var(--tc-accent, var(--_tc-accent)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr [data-level="3"] > span[data-on] { background: var(--tc-status-success-solid, var(--_tc-status-success-solid)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr [data-level="0"] > span:first-child { background: var(--tc-text-disabled, var(--_tc-text-disabled)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__actions { gap: var(--tc-space-2, var(--_tc-space-2)); }
/* Secondary: white with the card's hairline shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  max-width: 100%;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  overflow: hidden;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where(.ui-sr) :where([data-look="clean"], [data-look="clean"] *).ui-sr__btn { background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn--icon { padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn--icon svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn[aria-expanded="true"] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn:active { transform: scale(0.97); }
/* Primary: a dark chip */
:where(.ui-sr) :where([data-look="clean"], [data-look="clean"] *).ui-sr__btn--primary { background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)); }
/* Accepted: a minimal green fill in the place of the button */
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  min-width: 0;
  height: 28px;
  padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-status-success-bg, var(--_tc-status-success-bg));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-status-success-fg, var(--_tc-status-success-fg));
  animation: ui-sr-swap var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-sr__alt { position: relative; }
/* The menu pattern */
.ui-sr__menu {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  display: grid;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  width: 260px;
  padding: var(--tc-menu-padding, var(--_tc-menu-padding));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  animation: ui-sr-drop var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
/* Narrow: the actions sit on their own row – the menu lines up with its right edge so it stays inside */
@container (max-width: 420px) {
:where([data-look="standard"], [data-look="standard"] *).ui-sr__actions { position: relative; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__alt { position: static; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__menu { width: min(260px, 100cqw - 24px); }
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  min-height: var(--tc-menu-item-h, var(--_tc-menu-item-h));
  padding: 0 var(--tc-menu-item-px, var(--_tc-menu-item-px));
  border: 0;
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  background: transparent;
  font-size: var(--tc-menu-item-font-size, var(--_tc-menu-item-font-size)) !important;
  text-align: left;
}
.ui-sr__option:hover { background: var(--tc-menu-item-hover, var(--_tc-menu-item-hover)); }
/* Selected: the accent text and a check (menu pattern) – not a faint fill alone */
.ui-sr__option[aria-checked="true"] { color: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg)); }
.ui-sr__check { flex: none; width: 16px; height: 16px; margin-left: auto; fill: none; stroke: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg)); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; opacity: 0; }
.ui-sr__option[aria-checked="true"] .ui-sr__check { opacity: 1; }
.ui-sr__option:focus-visible { outline-offset: calc(var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) * -1) !important; }
.ui-sr__sr, .ui-sr__mini > .ui-sr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; background: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__option-label { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__tag { padding: 0 var(--tc-pill-px, var(--_tc-pill-px)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__menu { bottom: calc(100% + 6px); width: 248px; }
/* Narrow: the actions sit on their own row – the menu lines up with its right edge so it stays inside */
@container (max-width: 420px) {
:where([data-look="clean"], [data-look="clean"] *).ui-sr__actions { position: relative; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__alt { position: static; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__menu { width: min(248px, 100cqw - 20px); }
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  height: var(--tc-menu-item-h, var(--_tc-menu-item-h));
  padding: 0 var(--tc-menu-item-px, var(--_tc-menu-item-px));
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  font-size: var(--tc-menu-item-font-size, var(--_tc-menu-item-font-size));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  text-align: left;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option[aria-checked="true"] { color: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr button.ui-sr__option:focus-visible { outline-offset: -2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option-label { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option-name { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__tag {
  flex: none;
  padding: 0 var(--tc-space-1, var(--_tc-space-1));
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  background: var(--tc-accent-subtle, var(--_tc-accent-subtle));
  font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug));
  color: var(--tc-accent-text, var(--_tc-accent-text));
}
@keyframes ui-sr-swap { from { opacity: 0; transform: translateY(2px); } }
@keyframes ui-sr-drop { from { opacity: 0; transform: translateY(4px) scale(0.98); } }
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-sr__reason,
:where([data-look="standard"], [data-look="standard"] *).ui-sr__done,
:where([data-look="standard"], [data-look="standard"] *).ui-sr__menu { animation: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__body,
:where([data-look="standard"], [data-look="standard"] *).ui-sr__chevron { transition: none; }
}
/* Narrow cards (phones) */
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-sr__head { padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__reason { padding: 0 var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__foot { padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3-5, var(--_tc-space-3-5)); }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-sr__head { height: 48px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn { padding: 0 var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn--icon,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done { padding: 0 var(--tc-space-3-5, var(--_tc-space-3-5)) 0 var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-sr__reason,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__menu,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__pill { animation: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__body,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__chevron { transition: none; }
}
`;

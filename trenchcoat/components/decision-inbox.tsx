"use client";

/*
 * Decision Inbox – open decisions with two quick actions each, in a gray tray with a white card, in a single self-contained file.
 * Answering a decision confirms it briefly, then folds it away and the count goes down.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: decision-inbox.tsx is Standard,
 * decision-inbox-clean.tsx is Clean). Clean is one white card: a heading row with the count at the top, every
 * decision a row under a hairline, and solid glyphs whose cut-out mark takes the card color.
 */
// Generated from src/components/decision-inbox.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-di";

export type Decision = {
  id: string;
  title: string;
  /** Short context under the title */
  detail?: string;
  /** Main answer, shown as the dark button */
  primary: string;
  /** Other answer, shown as the light button */
  secondary: string;
  /** Starts folded to one muted line – click to open */
  collapsed?: boolean;
};

export type DecisionAnswer = "primary" | "secondary";

type DecisionInboxOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in decision-inbox.tsx, Clean in decision-inbox-clean.tsx */
  look?: Look;
  /** The decisions to show – new ones join as they're passed, answered ones fold away */
  decisions: Decision[];
  /** The answers given so far, by decision id. Controlled when defined – pair it with `onAnswersChange` */
  answers?: Record<string, DecisionAnswer>;
  /** Answers already given on mount when `answers` isn't controlled – those rows start folded away */
  defaultAnswers?: Record<string, DecisionAnswer>;
  /** Called with every answer, controlled or not */
  onAnswersChange?: (answers: Record<string, DecisionAnswer>) => void;
  /**
   * Called with the decision and the chosen answer. Return a promise to hold the row until it settles: it answers on
   * success, and on a rejection says so and offers both buttons again
   */
  onDecide?: (decision: Decision, answer: DecisionAnswer) => void | Promise<unknown>;
  className?: string;
  /** The root <section> */
  ref?: Ref<HTMLElement>;
};

export type DecisionInboxProps = Omit<ComponentPropsWithoutRef<"section">, keyof DecisionInboxOwnProps> & DecisionInboxOwnProps;

const NO_ANSWERS: Record<string, DecisionAnswer> = {};
/** How long the confirmation shows before the row folds away */
const CONFIRM_MS = 1100;

export function DecisionInbox({
  look,
  decisions,
  answers: answersProp,
  defaultAnswers = NO_ANSWERS,
  onAnswersChange,
  onDecide,
  className,
  ref,
  ...rest
}: DecisionInboxProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const [answers, setAnswers] = useControllable(answersProp, defaultAnswers, onAnswersChange, "answers");
  // Opened or folded by hand, by id – a decision that hasn't been touched starts as its `collapsed` says
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  // Rows folded away after their confirmation; answers that were there on mount start folded away
  const [gone, setGone] = useState<Record<string, true>>(() =>
    Object.fromEntries(Object.keys(answersProp ?? defaultAnswers).map((id) => [id, true as const])),
  );
  // Answers waiting on an onDecide promise, and the rows whose promise rejected
  const [pending, setPending] = useState<Record<string, DecisionAnswer>>({});
  const [failed, setFailed] = useState<Record<string, true>>({});

  const isOpen = (d: Decision) => opened[d.id] ?? !d.collapsed;
  const uid = useId();

  // Focus never drops to <body> (WCAG 2.4.3): answering swaps the buttons for the answer, folding away makes the row
  // inert, opening a folded title swaps it for plain text. Focus goes to the answer, then the next open decision,
  // and a just-opened decision's first button
  const rootRef = useRef<HTMLElement | null>(null);
  useFocusRescue(rootRef, {
    fallback: (key) => {
      const root = rootRef.current;
      if (!root || !key) return null;
      const id = key.slice(0, key.lastIndexOf("::"));
      const rows = [...root.querySelectorAll<HTMLElement>(".ui-di__row")];
      const at = rows.findIndex((r) => r.dataset.id === id);
      const firstIn = (r: HTMLElement | undefined) =>
        r && !r.hasAttribute("inert") ? r.querySelector<HTMLElement>(".ui-di__done, .ui-di__body:not([inert]) button, button.ui-di__title--folded") : null;
      return firstIn(rows[at]) ?? rows.slice(at + 1).map(firstIn).find(Boolean) ?? rows.slice(0, Math.max(at, 0)).reverse().map(firstIn).find(Boolean);
    },
  });
  const setRoot = (el: HTMLElement | null) => {
    rootRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };
  const open = decisions.filter((d) => !answers[d.id]).length;

  const alive = useRef(true);
  const timers = useRef(new Map<string, number>());
  useEffect(() => {
    alive.current = true;
    const all = timers.current;
    return () => {
      alive.current = false;
      for (const t of all.values()) window.clearTimeout(t);
      all.clear();
    };
  }, []);

  // An answer – given here or passed in – shows its confirmation for a moment, then the row folds away and the next
  // folded one opens
  const latest = useRef(decisions);
  useEffect(() => {
    latest.current = decisions;
  });
  useEffect(() => {
    for (const id of Object.keys(answers)) {
      if (gone[id] || timers.current.has(id)) continue;
      timers.current.set(
        id,
        window.setTimeout(() => {
          timers.current.delete(id);
          setGone((g) => ({ ...g, [id]: true }));
          setOpened((o) => {
            const folded = latest.current.find((x) => x.id !== id && !(o[x.id] ?? !x.collapsed) && !answers[x.id]);
            return folded ? { ...o, [folded.id]: true } : o;
          });
        }, CONFIRM_MS),
      );
    }
  }, [answers, gone]);

  const decide = async (d: Decision, answer: DecisionAnswer) => {
    if (answers[d.id] || pending[d.id]) return;
    setFailed(({ [d.id]: _was, ...others }) => others);
    let result: void | Promise<unknown>;
    try {
      result = onDecide?.(d, answer);
    } catch {
      setFailed((f) => ({ ...f, [d.id]: true }));
      return;
    }
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setPending((p) => ({ ...p, [d.id]: answer }));
      let ok = true;
      try {
        await result;
      } catch {
        ok = false;
      }
      if (!alive.current) return;
      setPending(({ [d.id]: _done, ...others }) => others);
      if (!ok) {
        setFailed((f) => ({ ...f, [d.id]: true }));
        return;
      }
    }
    setAnswers((a) => ({ ...a, [d.id]: answer }));
  };

  return (
    <>
      <style href="ui-decision-inbox" precedence="default">
        {css}
      </style>
      <section
        {...rest}
        ref={setRoot}
        className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
        data-look={resolvedLook}
        data-clear={open === 0 || undefined}
      >
        <header className="ui-di__head" aria-live="polite">
          {open > 0 ? (
            <>
              <AlertIcon clean={clean} />
              <span>
                {open} {open === 1 ? "needs" : "need"} your input
              </span>
            </>
          ) : (
            <>
              <DoneIcon clean={clean} />
              <span>All caught up</span>
            </>
          )}
        </header>

        <div className="ui-di__card">
          {decisions.map((d) => {
            const answer = answers[d.id];
            const answered = answer ? (answer === "primary" ? d.primary : d.secondary) : undefined;
            const rowOpen = isOpen(d);
            const waiting = pending[d.id];
            const bodyId = `${uid}-${d.id}`;
            const key = (part: string) => `${d.id}::${part}`;
            return (
              <div key={d.id} className="ui-di__row" data-id={d.id} data-gone={(gone[d.id] && answered) || undefined} inert={Boolean(gone[d.id] && answered)}>
                <div className="ui-di__row-inner">
                  <div className="ui-di__item" data-open={rowOpen || undefined} data-answered={answered ? true : undefined} aria-busy={waiting ? true : undefined}>
                    {rowOpen ? (
                      <p className="ui-di__title">{d.title}</p>
                    ) : (
                      <button
                        type="button"
                        className="ui-di__title ui-di__title--folded"
                        aria-expanded={false}
                        aria-controls={bodyId}
                        data-focus-key={key("title")}
                        onClick={() => setOpened((o) => ({ ...o, [d.id]: true }))}
                      >
                        {d.title}
                      </button>
                    )}
                    <div className="ui-di__body" id={bodyId} data-open={rowOpen || undefined} inert={!rowOpen}>
                      <div className="ui-di__body-inner">
                        {d.detail && <p className="ui-di__detail">{d.detail}</p>}
                        <div className="ui-di__actions">
                          {answered ? (
                            <span className="ui-di__done" tabIndex={-1} data-focus-key={key("done")}>
                              <DoneIcon clean={clean} />
                              {answered}
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="ui-di__btn ui-di__btn--primary"
                                aria-disabled={waiting ? true : undefined}
                                data-pending={waiting === "primary" || undefined}
                                data-focus-key={key("primary")}
                                onClick={() => void decide(d, "primary")}
                              >
                                {d.primary}
                              </button>
                              <button
                                type="button"
                                className="ui-di__btn"
                                aria-disabled={waiting ? true : undefined}
                                data-pending={waiting === "secondary" || undefined}
                                data-focus-key={key("secondary")}
                                onClick={() => void decide(d, "secondary")}
                              >
                                {d.secondary}
                              </button>
                            </>
                          )}
                        </div>
                        {failed[d.id] && !answered && (
                          <p className="ui-di__error" role="alert">
                            Couldn't save that – try again.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <p className="ui-di__empty">Nothing waiting on you – new decisions show up here.</p>
        </div>
      </section>
    </>
  );
}

/* ---------- Icons ---------- */

type IconProps = { clean: boolean };

// Solid glyphs – the cut-out mark takes the surface colour (CSS), so it works in dark mode too
const AlertIcon = ({ clean }: IconProps) =>
  clean ? (
    <svg className="ui-di__glyph" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M6.7 2.3a1.5 1.5 0 0 1 2.6 0l5.4 9.4A1.5 1.5 0 0 1 13.4 14H2.6a1.5 1.5 0 0 1-1.3-2.3Z" fill="currentColor" />
      <path className="ui-di__cut" d="M8 5.8v3.2" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <circle className="ui-di__cut-dot" cx="8" cy="11.3" r="0.8" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M6.7 2.3a1.5 1.5 0 0 1 2.6 0l5.4 9.4A1.5 1.5 0 0 1 13.4 14H2.6a1.5 1.5 0 0 1-1.3-2.3Z" fill="currentColor" />
      <path className="ui-di__cut" d="M8 5.6v3.6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle className="ui-di__cut-dot" cx="8" cy="11.4" r="0.85" />
    </svg>
  );

const DoneIcon = ({ clean }: IconProps) =>
  clean ? (
    <svg className="ui-di__glyph" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="currentColor" />
      <path className="ui-di__cut" d="m5.3 8.2 1.8 1.8 3.6-3.8" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path className="ui-di__cut" d="m5 8.2 2 2 4-4.2" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
.ui-di:where([data-look="standard"]),
.ui-di__portal:where([data-look="standard"]) {
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-fast: 150ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 1px;
  --_tc-line-height-normal: 20px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
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
.ui-di:where([data-look="clean"]),
.ui-di__portal:where([data-look="clean"]) {
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-fast: 150ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 0.5px;
  --_tc-line-height-normal: 20px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
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

/* A decision whose onDecide promise is still running, and one whose promise failed */
.ui-di__btn[aria-disabled] { opacity: 0.6; cursor: progress; }
.ui-di__error {
  margin: 8px 0 0;
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
}
.ui-di {
  box-sizing: border-box;
  width: 100%;
  max-width: 440px;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
/* Like the Chat Composer: a tray with the heading, the card sits on top of it */
:where([data-look="standard"], [data-look="standard"] *).ui-di {
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
}
/* Clean: one card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-di {
  container-type: inline-size;
  overflow: hidden;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  text-align: left;
}
.ui-di *, .ui-di *::before, .ui-di *::after { box-sizing: border-box; }
:where(.ui-di) button { margin: 0; font: inherit; cursor: pointer; }
:where(.ui-di):where([data-look="clean"], [data-look="clean"] *) button { padding: 0; border: 0; background: none; color: inherit; -webkit-tap-highlight-color: transparent; }
:where(.ui-di):where([data-look="clean"], [data-look="clean"] *) svg { display: block; flex: none; }
.ui-di button:focus-visible, .ui-di__done:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-di__done:focus:not(:focus-visible) { outline: none; }
/* Solid glyphs: the mark is cut out in the colour of the surface under it */
.ui-di__cut { fill: none; stroke: var(--tc-surface-raised, var(--_tc-surface-raised)); }
.ui-di__cut-dot { fill: var(--tc-surface-raised, var(--_tc-surface-raised)); }
:where([data-look="standard"], [data-look="standard"] *).ui-di .ui-di__cut { stroke: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); }
:where([data-look="standard"], [data-look="standard"] *).ui-di .ui-di__cut-dot { fill: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__glyph { width: 16px; height: 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-di__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px 10px;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg));
  transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-di[data-clear] .ui-di__head { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-di__card {
  overflow: hidden;
  background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray));
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
}
/* The heading row at the top of the card: an amber mark while something waits, a green one when all is done */
:where([data-look="clean"], [data-look="clean"] *).ui-di__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-di__head .ui-di__glyph { color: var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); animation: ui-di-pop var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-di[data-clear] .ui-di__head .ui-di__glyph { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__head span { animation: ui-di-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
/* Rows fold away with a height transition once answered */
.ui-di__row {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-di__row[data-gone] { grid-template-rows: 0fr; opacity: 0; }
.ui-di__row-inner { min-height: 0; overflow: hidden; }
.ui-di__row + .ui-di__row .ui-di__item { border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
.ui-di__row[data-gone] + .ui-di__row .ui-di__item { border-top-color: transparent; }
:where([data-look="standard"], [data-look="standard"] *).ui-di__item { padding: 16px 20px 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-di__item:not([data-open]) { padding-bottom: 16px; }
.ui-di__title {
  display: block;
  width: 100%;
  margin: 0;
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  text-align: left;
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__title {
  padding: 0;
  border: 0;
  background: none;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__title--folded {
  color: var(--tc-text-muted, var(--_tc-text-muted));
  transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__title--folded:hover { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__item { padding: 14px 16px 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-di__item:not([data-open]) { padding: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-di__title {
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  color: var(--tc-text-strong, var(--_tc-text-strong));
}
/* A folded decision: one muted line that opens on click */
:where(.ui-di) :where([data-look="clean"], [data-look="clean"] *).ui-di__title--folded {
  padding: 14px 16px;
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-di__title--folded:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-di button.ui-di__title--folded:focus-visible { outline-offset: -2px; }
.ui-di__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-di__body[data-open] { grid-template-rows: 1fr; }
/* Room around the buttons so the clipping for the fold never cuts their ring and shadow */
.ui-di__body-inner {
  min-height: 0;
  overflow: hidden;
  margin: 0 -4px -4px;
  padding: 0 4px 4px;
}
.ui-di__detail {
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__detail { margin: 4px 0 0; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__detail { margin: 2px 0 0; color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-di__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: var(--tc-control-h-md, var(--_tc-control-h-md));
  margin-top: 12px;
}
/* The two answers look exactly like Button: secondary, and the flat-ink primary */
.ui-di__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border: 0;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  white-space: nowrap;
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-di__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
.ui-di__btn:active { transform: scale(0.98); }
.ui-di__btn--primary { background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)); }
.ui-di__btn--primary:hover { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); }
.ui-di__btn--primary:active { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); }
/* The answer in the place of the buttons */
.ui-di__done {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-status-success-fg, var(--_tc-status-success-fg));
  animation: ui-di-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
/* Clean: a minimal green fill */
:where([data-look="clean"], [data-look="clean"] *).ui-di__done {
  min-height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 10px 0 8px;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-status-success-bg, var(--_tc-status-success-bg));
}
.ui-di__empty {
  display: none;
  margin: 0;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__empty { padding: 18px 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-di__empty { padding: 14px 16px; }
.ui-di[data-clear] .ui-di__empty { display: block; animation: ui-di-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-slow, var(--_tc-duration-slow)) both; }
@keyframes ui-di-in {
  from { opacity: 0; transform: translateY(3px); }
}
@keyframes ui-di-pop {
  from { opacity: 0; transform: scale(0.6); }
}
/* Narrow cards (phones) */
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-di__head { padding: 0 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-di__item { padding: 12px 14px 14px; }
:where(.ui-di) :where([data-look="clean"], [data-look="clean"] *).ui-di__title--folded { padding: 14px 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-di__empty { padding: 14px; }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-di__btn,
:where([data-look="clean"], [data-look="clean"] *).ui-di__done { height: 36px; padding: 0 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-di__done { padding: 0 14px 0 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-di__actions { min-height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
.ui-di__row,
.ui-di__body { transition: none; }
.ui-di__done,
.ui-di__empty,
.ui-di__head .ui-di__glyph,
.ui-di__head span { animation: none !important; }
}
`;

"use client";

import { useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type Ref } from "react";
import { useControllable } from "../internal/use-controllable";
import { useFocusRescue } from "../internal/use-focus-rescue";

/*
 * Decision Inbox – open decisions with two quick actions each, in a gray tray with a white card, in a single self-contained file.
 * Answering a decision confirms it briefly, then folds it away and the count goes down.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: decision-inbox.tsx is Standard,
 * decision-inbox-clean.tsx is Clean). Clean is one white card: a heading row with the count at the top, every
 * decision a row under a hairline, and solid glyphs whose cut-out mark takes the card color.
 */
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

/* ---------- Styles ---------- */

const css = /* css */ `
/* A decision whose onDecide promise is still running, and one whose promise failed */
.ui-di__btn[aria-disabled] { opacity: 0.6; cursor: progress; }
.ui-di__error {
  margin: var(--tc-space-2) 0 0;
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-font-size-sm);
}
.ui-di {
  box-sizing: border-box;
  width: 100%;
  max-width: 440px;
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Like the Chat Composer: a tray with the heading, the card sits on top of it */
:where([data-look="standard"], [data-look="standard"] *).ui-di {
  background: var(--tc-surface-tray);
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
}
/* Clean: one card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-di {
  container-type: inline-size;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  text-align: left;
}
.ui-di *, .ui-di *::before, .ui-di *::after { box-sizing: border-box; }
:where(.ui-di) button { margin: 0; font: inherit; cursor: pointer; }
:where(.ui-di):where([data-look="clean"], [data-look="clean"] *) button { padding: 0; border: 0; background: none; color: inherit; -webkit-tap-highlight-color: transparent; }
:where(.ui-di):where([data-look="clean"], [data-look="clean"] *) svg { display: block; flex: none; }
.ui-di button:focus-visible, .ui-di__done:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-di__done:focus:not(:focus-visible) { outline: none; }
/* Solid glyphs: the mark is cut out in the colour of the surface under it */
.ui-di__cut { fill: none; stroke: var(--tc-surface-raised); }
.ui-di__cut-dot { fill: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-di .ui-di__cut { stroke: var(--tc-surface-on-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-di .ui-di__cut-dot { fill: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__glyph { width: 16px; height: 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-di__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  padding: var(--tc-space-3) var(--tc-space-4-5) var(--tc-space-2-5);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-status-warning-fg);
  transition: color var(--tc-duration-slow) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-di[data-clear] .ui-di__head { color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-di__card {
  overflow: hidden;
  background: var(--tc-surface-on-tray);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-card-shadow);
}
/* The heading row at the top of the card: an amber mark while something waits, a green one when all is done */
:where([data-look="clean"], [data-look="clean"] *).ui-di__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-height: 44px;
  padding: 0 var(--tc-space-4);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-di__head .ui-di__glyph { color: var(--tc-status-warning-solid); animation: ui-di-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-di[data-clear] .ui-di__head .ui-di__glyph { color: var(--tc-status-success-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__head span { animation: ui-di-in var(--tc-duration-slow) var(--tc-ease-move) both; }
/* Rows fold away with a height transition once answered */
.ui-di__row {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slow) var(--tc-ease-standard);
}
.ui-di__row[data-gone] { grid-template-rows: 0fr; opacity: 0; }
.ui-di__row-inner { min-height: 0; overflow: hidden; }
.ui-di__row + .ui-di__row .ui-di__item { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-di__row[data-gone] + .ui-di__row .ui-di__item { border-top-color: transparent; }
:where([data-look="standard"], [data-look="standard"] *).ui-di__item { padding: var(--tc-space-4) var(--tc-space-5) var(--tc-space-3-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-di__item:not([data-open]) { padding-bottom: var(--tc-space-4); }
.ui-di__title {
  display: block;
  width: 100%;
  margin: 0;
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  text-align: left;
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__title {
  padding: 0;
  border: 0;
  background: none;
  font-size: var(--tc-font-size-lg);
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__title--folded {
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__title--folded:hover { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__item { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__item:not([data-open]) { padding: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-di__title {
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-strong);
}
/* A folded decision: one muted line that opens on click */
:where(.ui-di) :where([data-look="clean"], [data-look="clean"] *).ui-di__title--folded {
  padding: var(--tc-space-3-5) var(--tc-space-4);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-di__title--folded:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-di button.ui-di__title--folded:focus-visible { outline-offset: -2px; }
.ui-di__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move);
}
.ui-di__body[data-open] { grid-template-rows: 1fr; }
/* Room around the buttons so the clipping for the fold never cuts their ring and shadow */
.ui-di__body-inner {
  min-height: 0;
  overflow: hidden;
  margin: 0 -4px -4px;
  padding: 0 var(--tc-space-1) var(--tc-space-1);
}
.ui-di__detail {
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__detail { margin: var(--tc-space-1) 0 0; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__detail { margin: var(--tc-space-0-5) 0 0; color: var(--tc-text-secondary); }
.ui-di__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-2);
  min-height: var(--tc-control-h-md);
  margin-top: var(--tc-space-3);
}
/* The two answers look exactly like Button: secondary, and the flat-ink primary */
.ui-di__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  white-space: nowrap;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-action-secondary-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
.ui-di__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-di__btn:active { transform: scale(0.98); }
.ui-di__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-di__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-di__btn--primary:active { background: var(--tc-action-primary-bg-active); }
/* The answer in the place of the buttons */
.ui-di__done {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-status-success-fg);
  animation: ui-di-in var(--tc-duration-slow) var(--tc-ease-move);
}
/* Clean: a minimal green fill */
:where([data-look="clean"], [data-look="clean"] *).ui-di__done {
  min-height: var(--tc-control-h-md);
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-status-success-bg);
}
.ui-di__empty {
  display: none;
  margin: 0;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
}
:where([data-look="standard"], [data-look="standard"] *).ui-di__empty { padding: var(--tc-space-4-5) var(--tc-space-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__empty { padding: var(--tc-space-3-5) var(--tc-space-4); }
.ui-di[data-clear] .ui-di__empty { display: block; animation: ui-di-in var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-slow) both; }
@keyframes ui-di-in {
  from { opacity: 0; transform: translateY(3px); }
}
@keyframes ui-di-pop {
  from { opacity: 0; transform: scale(0.6); }
}
/* Narrow cards (phones) */
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-di__head { padding: 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__item { padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5); }
:where(.ui-di) :where([data-look="clean"], [data-look="clean"] *).ui-di__title--folded { padding: var(--tc-space-3-5) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__empty { padding: var(--tc-space-3-5); }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-di__btn,
:where([data-look="clean"], [data-look="clean"] *).ui-di__done { height: 36px; padding: 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-di__done { padding: 0 var(--tc-space-3-5) 0 var(--tc-space-3); }
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

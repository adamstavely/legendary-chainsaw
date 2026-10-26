"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type Ref } from "react";
import { useControllable } from "../internal/use-controllable";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Smart Recommendation – a suggestion card with a confidence signal, alternatives and one-click accept, in a single
 * self-contained file. Fold it away, pick an alternative instead, accept and undo.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (Standard by default). Clean drops the tray: one white card with hairline shadows and quiet
 * gray type, a solid blue sparkle as the mark, the signal and the actions in the card's last row, and thin icons on
 * the Alternatives and Undo buttons.
 */

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
  /** Visual style: "standard" (the default) or "clean" */
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

/* ---------- Styles ---------- */

const css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *).ui-sr {
  box-sizing: border-box;
  width: 100%;
  max-width: 440px;
  container-type: inline-size;
  /* Like the Chat Composer: the white card on a gray tray, the actions live in the tray below */
  background: var(--tc-surface-sunken);
  /* The gray tray frames the white card on every side – the tray recipe */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary);
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
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-sr *, .ui-sr *::before, .ui-sr *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr button { margin: 0; font: inherit; color: inherit; cursor: pointer; }
.ui-sr button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__card {
  padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-2);
  /* The card on the tray */
  background: var(--tc-surface-on-tray);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  width: 100%;
  height: 40px;
  padding: 0 var(--tc-space-2-5);
  border: 0;
  border-radius: var(--tc-radius-xl);
  background: transparent;
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__head:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__spark { flex: none; color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__title { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__pill {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-tone-violet-bg);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  color: var(--tc-tone-violet-fg);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__chevron { display: grid; margin-left: auto; color: var(--tc-text-muted); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-sr) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-sr) svg { display: block; flex: none; }
/* The heading row folds the reason in and out */
:where([data-look="clean"], [data-look="clean"] *).ui-sr__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  width: 100%;
  height: 44px;
  padding: 0 var(--tc-space-3) 0 var(--tc-space-4);
  border-radius: var(--tc-radius-lg) var(--tc-radius-lg) 0 0;
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__head:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr button.ui-sr__head:focus-visible { outline-offset: -2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mark { width: 16px; height: 16px; fill: var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__title { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__pill {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: var(--tc-pill-h-lg);
  padding: 0 var(--tc-pill-px-lg);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-tone-violet-bg);
  font-size: var(--tc-pill-font-size-lg);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-tone-violet-fg);
  animation: ui-sr-swap var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__chevron {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  margin-left: auto;
  color: var(--tc-icon-muted);
  transition: transform var(--tc-duration-moderate) var(--tc-ease-move), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__head:hover .ui-sr__chevron { color: var(--tc-text-primary); }
.ui-sr__head[aria-expanded="false"] .ui-sr__chevron { transform: rotate(-90deg); }
.ui-sr__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move);
}
.ui-sr__body[data-open] { grid-template-rows: 1fr; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__reason {
  min-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0 var(--tc-space-2-5);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  animation: ui-sr-swap var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__body[data-open] .ui-sr__reason { padding-bottom: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__reason {
  min-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0 var(--tc-space-4);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  animation: ui-sr-swap var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__body[data-open] .ui-sr__reason { padding-bottom: var(--tc-space-3-5); }
.ui-sr__reason strong { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__foot {
  display: flex;
  align-items: center;
  /* Narrow containers: the actions move below the signal instead of running out of the tray */
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--tc-space-2) var(--tc-space-2-5);
  min-height: 50px;
  padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__signal {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  font-size: var(--tc-font-size-md);
  white-space: nowrap;
  color: var(--tc-text-muted);
}
/* The last row: the signal on the left, the actions on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-sr__foot {
  display: flex;
  align-items: center;
  /* Narrow cards: the actions move below the signal instead of running out of the card */
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--tc-space-2) var(--tc-space-2-5);
  min-height: 48px;
  padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-4);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__signal {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
  color: var(--tc-text-secondary);
}
/* A failed accept or undo takes the signal's place until the next try */
.ui-sr__signal.ui-sr__error { color: var(--tc-status-danger-fg); white-space: normal; }
.ui-sr__bars, .ui-sr__mini { display: inline-flex; align-items: flex-end; gap: var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__bars span,
:where([data-look="standard"], [data-look="standard"] *).ui-sr__mini span {
  width: 3px;
  border-radius: var(--tc-radius-2xs);
  background: var(--tc-border-strong);
  transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__bars span:nth-child(1),
:where([data-look="standard"], [data-look="standard"] *).ui-sr__mini span:nth-child(1) { height: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__bars span:nth-child(2),
:where([data-look="standard"], [data-look="standard"] *).ui-sr__mini span:nth-child(2) { height: 9px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__bars span:nth-child(3),
:where([data-look="standard"], [data-look="standard"] *).ui-sr__mini span:nth-child(3) { height: 12px; }
:where([data-look="standard"], [data-look="standard"] *) [data-level="1"] > span[data-on] { background: var(--tc-status-warning-solid); }
:where([data-look="standard"], [data-look="standard"] *) [data-level="2"] > span[data-on] { background: var(--tc-accent); }
:where([data-look="standard"], [data-look="standard"] *) [data-level="3"] > span[data-on] { background: var(--tc-status-success-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__signal[data-level="0"] .ui-sr__bars span:first-child { background: var(--tc-icon-muted); }
/* The actions wrap and shrink instead of running out of the card at 320px */
.ui-sr__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--tc-space-1-5); min-width: 0; max-width: 100%; margin-left: auto; }
/* Secondary and primary: exactly like Button – the control geometry, flat ink for the primary (decision 1) */
:where([data-look="standard"], [data-look="standard"] *).ui-sr__btn {
  max-width: 100%;
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  overflow: hidden;
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size) !important;
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-secondary-fg);
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-sr__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__btn:active { transform: scale(0.98); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__btn--primary {
  background: var(--tc-action-primary-bg);
  box-shadow: var(--tc-action-primary-shadow);
  color: var(--tc-action-primary-fg) !important;
}
.ui-sr__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-sr__btn--primary:active { background: var(--tc-action-primary-bg-active); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__done {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  padding-right: var(--tc-space-1);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-status-success-fg);
  animation: ui-sr-swap var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__bars span,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mini span {
  width: 3px;
  border-radius: var(--tc-radius-2xs);
  background: var(--tc-fill-strong);
  transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__bars span:nth-child(1),
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mini span:nth-child(1) { height: 5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__bars span:nth-child(2),
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mini span:nth-child(2) { height: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__bars span:nth-child(3),
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mini span:nth-child(3) { height: 11px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr [data-level="1"] > span[data-on] { background: var(--tc-status-warning-solid); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr [data-level="2"] > span[data-on] { background: var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr [data-level="3"] > span[data-on] { background: var(--tc-status-success-solid); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr [data-level="0"] > span:first-child { background: var(--tc-text-disabled); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__actions { gap: var(--tc-space-2); }
/* Secondary: white with the card's hairline shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5);
  max-width: 100%;
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  overflow: hidden;
  border-radius: var(--tc-control-radius-md);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where(.ui-sr) :where([data-look="clean"], [data-look="clean"] *).ui-sr__btn { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn--icon { padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn--icon svg { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn[aria-expanded="true"] { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn:active { transform: scale(0.97); }
/* Primary: a dark chip */
:where(.ui-sr) :where([data-look="clean"], [data-look="clean"] *).ui-sr__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
/* Accepted: a minimal green fill in the place of the button */
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  height: 28px;
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border-radius: var(--tc-radius-sm);
  background: var(--tc-status-success-bg);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-status-success-fg);
  animation: ui-sr-swap var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-sr__alt { position: relative; }
/* The menu pattern */
.ui-sr__menu {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  z-index: var(--tc-z-dropdown);
  display: grid;
  gap: var(--tc-space-0-5);
  width: 260px;
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  animation: ui-sr-drop var(--tc-duration-base) var(--tc-ease-move);
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
  gap: var(--tc-space-2-5);
  min-height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px);
  border: 0;
  border-radius: var(--tc-menu-item-radius);
  background: transparent;
  font-size: var(--tc-menu-item-font-size) !important;
  text-align: left;
}
.ui-sr__option:hover { background: var(--tc-menu-item-hover); }
/* Selected: the accent text and a check (menu pattern) – not a faint fill alone */
.ui-sr__option[aria-checked="true"] { color: var(--tc-menu-item-selected-fg); }
.ui-sr__check { flex: none; width: 16px; height: 16px; margin-left: auto; fill: none; stroke: var(--tc-menu-item-selected-fg); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; opacity: 0; }
.ui-sr__option[aria-checked="true"] .ui-sr__check { opacity: 1; }
.ui-sr__option:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1) !important; }
.ui-sr__sr, .ui-sr__mini > .ui-sr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; background: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__option-label { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__tag { padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-accent-subtle); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-accent-text); }
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
  gap: var(--tc-space-2-5);
  height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px);
  border-radius: var(--tc-menu-item-radius);
  font-size: var(--tc-menu-item-font-size);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option[aria-checked="true"] { color: var(--tc-menu-item-selected-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr button.ui-sr__option:focus-visible { outline-offset: -2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option-label { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option-name { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__tag {
  flex: none;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-accent-subtle);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-accent-text);
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
:where([data-look="clean"], [data-look="clean"] *).ui-sr__head { padding: 0 var(--tc-space-2-5) 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__reason { padding: 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__foot { padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-3-5); }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-sr__head { height: 48px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn { padding: 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn--icon,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done { padding: 0 var(--tc-space-3-5) 0 var(--tc-space-3); }
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

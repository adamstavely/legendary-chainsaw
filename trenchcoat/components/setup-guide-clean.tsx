"use client";

/*
 * Setup Guide – an onboarding panel with a progress bar and collapsible task groups, in a single self-contained file.
 * Tasks unlock one after another; finished tasks and groups are struck through.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: setup-guide.tsx is Standard,
 * setup-guide-clean.tsx is Clean). Clean is one white card with hairline shadows, quiet gray type, a thin blue
 * progress line with a count next to it, flat group rows with a soft wash on the open one, blue checks and
 * thinner 16px icons.
 */
// Generated from src/components/setup-guide.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-sg";

export type SetupTask = {
  id: string;
  label: string;
  done?: boolean;
};

export type SetupGroup = {
  id: string;
  title: string;
  tasks: SetupTask[];
};

type SetupGuideOwnProps = {
  title?: string;
  /** The task groups. Each task's `done` flag is where it starts; when the flags change, the guide follows them */
  groups: SetupGroup[];
  /** Ids of the finished tasks. Controlled when defined – pair it with `onDoneChange` */
  done?: string[];
  /** Ids finished on mount when `done` isn't controlled – defaults to the tasks marked `done` */
  defaultDone?: string[];
  /** Called with the ids of all finished tasks whenever a task is ticked or cleared */
  onDoneChange?: (done: string[]) => void;
  /** @deprecated Use `onDoneChange` – same arguments. Kept for one release */
  onChange?: (done: string[]) => void;
  /** Id of the unfolded group, `null` for none. Controlled when defined – pair it with `onOpenGroupChange` */
  openGroup?: string | null;
  /** Group unfolded on mount when `openGroup` isn't controlled – defaults to the first unfinished group */
  defaultOpenGroup?: string | null;
  /** Called when a group unfolds or folds – also when a finished group folds away on its own */
  onOpenGroupChange?: (id: string | null) => void;
  /** Whether the body is collapsed to the header. Controlled when defined – pair it with `onMinimizedChange` */
  minimized?: boolean;
  defaultMinimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
  /** Shows an "Edit" link in the header */
  onEdit?: () => void;
  /** Shows a close button in the header */
  onClose?: () => void;
  className?: string;
  /** Visual style. Defaults to the file's look: Standard in setup-guide.tsx, Clean in setup-guide-clean.tsx */
  look?: Look;
  ref?: Ref<HTMLElement>;
};

export type SetupGuideProps = Omit<ComponentPropsWithoutRef<"section">, keyof SetupGuideOwnProps> & SetupGuideOwnProps;

const FOLD_DELAY = 420;

export function SetupGuide({
  title = "Setup guide",
  groups,
  done: doneProp,
  defaultDone,
  onDoneChange,
  onChange,
  openGroup,
  defaultOpenGroup,
  onOpenGroupChange,
  minimized: minimizedProp,
  defaultMinimized = false,
  onMinimizedChange,
  onEdit,
  onClose,
  className,
  look,
  ref,
  ...rest
}: SetupGuideProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const uid = useId();
  const tasks = groups.flatMap((g) => g.tasks);

  // Uncontrolled: our own ticks, remembered with the tasks' flags they were made on – new flags win
  const flagged = tasks.filter((t) => t.done).map((t) => t.id);
  const flaggedKey = flagged.join("\u0000");
  const [own, setOwn] = useState(() => ({ base: flaggedKey, ids: defaultDone ?? flagged }));
  const done = new Set(doneProp ?? (own.base === flaggedKey ? own.ids : flagged));

  const firstOpen = groups.find((g) => g.tasks.some((t) => !done.has(t.id)));
  const [open, setOpen] = useControllable<string | null>(
    openGroup,
    defaultOpenGroup !== undefined ? defaultOpenGroup : (firstOpen?.id ?? null),
    onOpenGroupChange,
  );
  const [minimized, setMinimized] = useControllable(minimizedProp, defaultMinimized, onMinimizedChange);

  // The fold-away timer never outlives the guide, and a newer tick replaces it
  const foldTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(foldTimer.current), []);
  const rootRef = useRef<HTMLElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  // Anything focused that goes away (a group folding, the body minimizing) leaves focus on its group's header
  useFocusRescue(rootRef, { fallback: (key) => rootRef.current?.querySelector(`[data-group-head="${key ?? ""}"]`) ?? rootRef.current?.querySelector(".ui-sg__icon-btn") });

  const total = tasks.length;
  const count = tasks.filter((t) => done.has(t.id)).length;
  const progress = total ? count / total : 0;

  const toggle = (group: SetupGroup, id: string) => {
    const next = new Set(done);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const ids = tasks.filter((t) => next.has(t.id)).map((t) => t.id);
    if (doneProp === undefined) setOwn({ base: flaggedKey, ids });
    onDoneChange?.(ids);
    onChange?.(ids);
    // A finished group folds away and the next open one unfolds
    window.clearTimeout(foldTimer.current);
    if (group.tasks.every((t) => next.has(t.id))) {
      const following = groups.find((g) => g.tasks.some((t) => !next.has(t.id)));
      const index = groups.indexOf(group);
      foldTimer.current = window.setTimeout(() => {
        // The task that was just ticked is about to go inert: its group's header takes focus first (2.4.3)
        const root = rootRef.current;
        rescueFocus(root?.querySelector(`#${CSS.escape(`${uid}-panel-${index}`)}`), [() => root?.querySelector(`[data-group-head="${index}"]`)]);
        setOpen(following?.id ?? null);
      }, FOLD_DELAY);
    }
  };

  const track = (
    <span
      className="ui-sg__track"
      role="progressbar"
      aria-label={`${title} progress`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <span className="ui-sg__fill" style={{ transform: `scaleX(${progress})` }} />
    </span>
  );

  return (
    <>
      <style href="ui-setup-guide" precedence="default">
        {css}
      </style>
      <section
        aria-label={title}
        {...rest}
        ref={setRoot}
        className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
        data-look={resolvedLook}
      >
        <header className="ui-sg__head">
          <h3 className="ui-sg__title">{title}</h3>
          <div className="ui-sg__actions">
            {onEdit && (
              <button type="button" className="ui-sg__edit" onClick={onEdit}>
                Edit
              </button>
            )}
            <button
              type="button"
              className="ui-sg__icon-btn"
              aria-label={minimized ? "Expand setup guide" : "Minimize setup guide"}
              aria-expanded={!minimized}
              aria-controls={`${uid}-body`}
              onClick={() => setMinimized(!minimized)}
            >
              {minimized ? <ExpandIcon look={resolvedLook} /> : <MinimizeIcon look={resolvedLook} />}
            </button>
            {onClose && (
              <button type="button" className="ui-sg__icon-btn" aria-label="Close setup guide" onClick={onClose}>
                <CloseIcon look={resolvedLook} />
              </button>
            )}
          </div>
        </header>

        {/* Clean: the count sits next to the progress line */}
        {resolvedLook === "clean" ? (
          <div className="ui-sg__progress">
            {track}
            <span className="ui-sg__count" aria-hidden="true">
              {count}/{total}
            </span>
          </div>
        ) : (
          track
        )}

        {/* Minimized: folded away and inert, so its tasks are neither focusable nor read (S6) */}
        <div className="ui-sg__body" id={`${uid}-body`} data-hidden={minimized || undefined} inert={minimized}>
          <div className="ui-sg__groups">
            {groups.map((group, groupIndex) => {
              const isOpen = open === group.id;
              const finished = group.tasks.every((t) => done.has(t.id));
              // The first open task is the current one, everything after it waits
              const current = group.tasks.find((t) => !done.has(t.id))?.id;
              const currentIndex = group.tasks.findIndex((t) => t.id === current);
              const panelId = `${uid}-panel-${groupIndex}`;
              return (
                <div key={group.id} className="ui-sg__group" data-open={isOpen || undefined}>
                  <button
                    type="button"
                    className="ui-sg__group-head"
                    data-group-head={groupIndex}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : group.id)}
                  >
                    <span className="ui-sg__group-title" data-done={finished || undefined}>
                      {group.title}
                      {/* The strike-through, in words */}
                      {finished && <span className="ui-sg__sr">, done</span>}
                    </span>
                    <ChevronIcon look={resolvedLook} />
                  </button>
                  <div className="ui-sg__panel" id={panelId} inert={!isOpen}>
                    <ul className="ui-sg__tasks">
                      {group.tasks.map((task, index) => {
                        const isDone = done.has(task.id);
                        const locked = !isDone && currentIndex !== -1 && index > currentIndex;
                        const state = isDone ? "done" : locked ? "locked" : "current";
                        return (
                          <li key={task.id}>
                            <button
                              type="button"
                              role="checkbox"
                              className="ui-sg__task"
                              data-state={state}
                              data-focus-key={groupIndex}
                              disabled={locked}
                              aria-checked={isDone}
                              title={locked ? "Finish the task before it first" : undefined}
                              onClick={() => toggle(group, task.id)}
                            >
                              <span className="ui-sg__mark" aria-hidden="true">
                                {state === "done" ? (
                                  <CheckIcon look={resolvedLook} />
                                ) : state === "locked" ? (
                                  <LockedIcon look={resolvedLook} />
                                ) : null}
                              </span>
                              <span className="ui-sg__task-label">{task.label}</span>
                              {locked && <span className="ui-sg__sr"> – finish the task before it first</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- Icons ---------- */

const ChevronIcon = ({ look }: { look: Look }) => (
  <svg className="ui-sg__chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={look === "clean" ? "1.3" : "1.6"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m4.5 6.25 3.5 3.5 3.5-3.5" />
  </svg>
);

const MinimizeIcon = ({ look }: { look: Look }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={look === "clean" ? "1.2" : "1.5"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.5 2.5v4h4M9.5 6.5l4.5-4.5M6.5 13.5v-4h-4M6.5 9.5 2 14" />
  </svg>
);

const ExpandIcon = ({ look }: { look: Look }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={look === "clean" ? "1.2" : "1.5"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 2h4v4M14 2 9.5 6.5M6 14H2v-4M2 14l4.5-4.5" />
  </svg>
);

const CloseIcon = ({ look }: { look: Look }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={look === "clean" ? "1.2" : "1.5"} strokeLinecap="round" aria-hidden="true">
    <path d={look === "clean" ? "m4 4 8 8M12 4l-8 8" : "m3.5 3.5 9 9M12.5 3.5l-9 9"} />
  </svg>
);

const CheckIcon = ({ look }: { look: Look }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="7" fill="currentColor" />
    {look === "clean" ? (
      <path d="m5.2 8.2 1.9 1.9 3.7-3.9" fill="none" stroke="var(--tc-text-on-accent, var(--_tc-text-on-accent))" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="m5 8.2 2 2 4-4.2" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

const LockedIcon = ({ look }: { look: Look }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={look === "clean" ? "1.1" : "1.5"} aria-hidden="true">
    {look === "clean" ? (
      <circle cx="8" cy="8" r="6.5" strokeDasharray="2 2" />
    ) : (
      <>
        <circle cx="8" cy="8" r="6" />
        <path d="m4 12 8-8" />
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
.ui-sg:where([data-look="standard"]),
.ui-sg__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-border-control: light-dark(#858585, #7c7c82);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-meter-fill: #2f68ff;
  --_tc-meter-h: 4px;
  --_tc-meter-radius: 999px;
  --_tc-meter-track: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-4: 16px;
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-accent: #ffffff;
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
}
.ui-sg:where([data-look="clean"]),
.ui-sg__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-border-control: light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-meter-fill: light-dark(#0060e2, #1a6cf0);
  --_tc-meter-h: 4px;
  --_tc-meter-radius: 999px;
  --_tc-meter-track: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-4: 16px;
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-accent: #ffffff;
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-strong: light-dark(#000000, #ffffff);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-sg {
  --tc-setup-guide-mark-bg-hover: light-dark(#d3d7de, #4a4a50);
  box-sizing: border-box;
  width: 100%;
  max-width: 320px;
  padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2));
  /* The card pattern – its ring is the shadow */
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-sg */
:where([data-look="clean"], [data-look="clean"] *).ui-sg {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 320px;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-sg *, .ui-sg *::before, .ui-sg *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-sg button {
  margin: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg button:focus-visible {
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  padding: 0 var(--tc-space-2, var(--_tc-space-2));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__title {
  margin: 0;
  font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus));
  font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold));
  line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__actions {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  margin-right: -4px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__edit {
  padding: var(--tc-space-0-5, var(--_tc-space-0-5)) var(--tc-space-1-5, var(--_tc-space-1-5));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-accent-text, var(--_tc-accent-text)) !important;
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__edit:hover { opacity: 0.75; }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__icon-btn {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)) !important;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__icon-btn:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)) !important; color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-sg) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-sg) svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
/* ---- Header: title, Edit and the two ghost icon buttons ---- */
:where([data-look="clean"], [data-look="clean"] *).ui-sg__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-4, var(--_tc-space-4));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__title {
  overflow: hidden;
  min-width: 0;
  margin: 0;
  font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose));
  color: var(--tc-text-strong, var(--_tc-text-strong));
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__actions { display: flex; flex: none; align-items: center; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__edit {
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-sm, var(--_tc-control-px-sm));
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg));
  transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__edit:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__icon-btn {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-md, var(--_tc-control-h-md));
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg));
  transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__icon-btn:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-sg__icon-btn svg { width: 16px; height: 16px; }
/* One continuous bar for all tasks */
:where([data-look="standard"], [data-look="standard"] *).ui-sg__track {
  display: block;
  height: var(--tc-meter-h, var(--_tc-meter-h));
  margin: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2));
  overflow: hidden;
  border-radius: var(--tc-meter-radius, var(--_tc-meter-radius));
  background: var(--tc-meter-track, var(--_tc-meter-track));
}
/* ---- One thin blue line for all tasks, with the count next to it ---- */
:where([data-look="clean"], [data-look="clean"] *).ui-sg__progress {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-3, var(--_tc-space-3));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__track {
  display: block;
  flex: 1;
  height: var(--tc-meter-h, var(--_tc-meter-h));
  overflow: hidden;
  border-radius: var(--tc-meter-radius, var(--_tc-meter-radius));
  background: var(--tc-meter-track, var(--_tc-meter-track));
}
.ui-sg__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--tc-meter-fill, var(--_tc-meter-fill));
  transform-origin: left center;
  transition: transform var(--tc-duration-reveal, var(--_tc-duration-reveal)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__count {
  flex: none;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
/* Minimize folds the whole list away */
.ui-sg__body {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-sg__body[data-hidden] { grid-template-rows: 0fr; opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__groups { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group {
  border-radius: var(--tc-radius-xl, var(--_tc-radius-xl));
  transition: background-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group[data-open] { background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  width: 100%;
  padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3));
  border-radius: var(--tc-radius-xl, var(--_tc-radius-xl));
  text-align: left;
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group-title {
  position: relative;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* Finished: a line draws through the title */
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group-title::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 52%;
  height: 1.5px;
  border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs));
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__groups {
  display: grid;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  min-height: 0;
  overflow: hidden;
  padding: 0 var(--tc-space-1, var(--_tc-space-1));
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
/* Inner padding as a spacer, so focus rings aren't cut and the fold can still close to 0 */
:where([data-look="clean"], [data-look="clean"] *).ui-sg__groups::before,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__groups::after { content: ""; display: block; height: 2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group {
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group[data-open] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  width: 100%;
  padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-3, var(--_tc-space-3));
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  text-align: left;
  transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-head:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group[data-open] .ui-sg__group-head:hover { background: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-title {
  position: relative;
  min-width: 0;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-strong, var(--_tc-text-strong));
  transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-title[data-done] { color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Finished: a hairline draws through the title */
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-title::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 52%;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-sg__group-title[data-done]::after { transform: scaleX(1); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__chevron {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__chevron {
  width: 16px;
  height: 16px;
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-sg__group[data-open] .ui-sg__chevron { transform: rotate(180deg); }
/* Each group is a dropdown */
.ui-sg__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-sg__group[data-open] .ui-sg__panel { grid-template-rows: 1fr; }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__tasks {
  min-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
  list-style: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__tasks li:last-child { padding-bottom: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__task {
  display: flex;
  align-items: flex-start;
  gap: var(--tc-space-3, var(--_tc-space-3));
  width: 100%;
  padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-3, var(--_tc-space-3));
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  text-align: left;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group[data-open] .ui-sg__task { opacity: 1; transform: none; transition-delay: var(--tc-duration-instant, var(--_tc-duration-instant)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__tasks {
  min-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0 var(--tc-space-1, var(--_tc-space-1));
  list-style: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__tasks li:last-child { padding-bottom: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task {
  display: flex;
  align-items: flex-start;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  width: 100%;
  padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  text-align: left;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group[data-open] .ui-sg__task { opacity: 1; transform: none; transition-delay: var(--tc-duration-instant, var(--_tc-duration-instant)), var(--tc-duration-instant, var(--_tc-duration-instant)), 0ms, 0ms; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task:not(:disabled):hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
.ui-sg__task[data-state="current"] { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__task[data-state="current"]:hover .ui-sg__mark { background: var(--tc-setup-guide-mark-bg-hover); }
.ui-sg__task[data-state="locked"] { color: var(--tc-text-muted, var(--_tc-text-muted)); cursor: default; }
.ui-sg__task[data-state="done"] { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: var(--tc-space-0-5, var(--_tc-space-0-5));
  border-radius: 50%;
  transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* The current task's open box: its edge is its only cue, so border-control (≥ 3:1) */
:where([data-look="standard"], [data-look="standard"] *).ui-sg__task[data-state="current"] .ui-sg__mark { box-shadow: inset 0 0 0 1.5px var(--tc-border-control, var(--_tc-border-control)); }
/* The mark: an open ring for the current task, a dashed faint ring while locked, a blue check when done */
:where([data-look="clean"], [data-look="clean"] *).ui-sg__mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: var(--tc-space-0-5, var(--_tc-space-0-5));
  border-radius: 50%;
  transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task[data-state="current"] .ui-sg__mark { box-shadow: inset 0 0 0 1px var(--tc-border-control, var(--_tc-border-control)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task[data-state="current"]:hover .ui-sg__mark { box-shadow: inset 0 0 0 1px var(--tc-accent, var(--_tc-accent)); }
.ui-sg__task[data-state="locked"] .ui-sg__mark { color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
.ui-sg__task[data-state="done"] .ui-sg__mark { color: var(--tc-accent, var(--_tc-accent)); }
.ui-sg__mark svg { width: 16px; height: 16px; }
.ui-sg__task[data-state="done"] .ui-sg__mark svg { animation: ui-sg-pop var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__task-label {
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  text-decoration-line: line-through;
  text-decoration-color: transparent;
  text-decoration-thickness: 1.5px;
  transition: text-decoration-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task-label {
  min-width: 0;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  text-decoration-line: line-through;
  text-decoration-color: transparent;
  text-decoration-thickness: 1px;
  transition: text-decoration-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-sg__task[data-state="done"] .ui-sg__task-label { text-decoration-color: currentColor; }
.ui-sg__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-sg-pop {
  from { transform: scale(0.5); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-sg__fill,
:where([data-look="standard"], [data-look="standard"] *).ui-sg__body,
:where([data-look="standard"], [data-look="standard"] *).ui-sg__panel,
:where([data-look="standard"], [data-look="standard"] *).ui-sg__task,
:where([data-look="standard"], [data-look="standard"] *).ui-sg__chevron,
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group-title::after { transition: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__mark svg { animation: none !important; }
}
/* Narrow: a little less side padding */
@container (max-width: 300px) {
:where([data-look="clean"], [data-look="clean"] *).ui-sg__head { padding-left: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__progress { padding-inline: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-head { padding-left: var(--tc-space-2-5, var(--_tc-space-2-5)); }
}
/* Touch: taller targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-sg__icon-btn { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__edit { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-head { padding-block: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task { padding-block: var(--tc-space-2, var(--_tc-space-2)); }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-sg__fill,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__body,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__panel,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__chevron,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-title::after { transition: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__mark svg { animation: none; }
}
`;

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { reducedMotion } from "../internal/reduced-motion";
import { useControllable } from "../internal/use-controllable";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Stepper Form – a multi-step flow for onboarding, checkout or setup wizards, in a single self-contained file.
 * Numbered steps on top; finished steps swap their number for a check that draws in.
 * Each step slides in from the side you're heading to, and the card glides to the new step's height.
 * Continue checks the step: invalid fields shake once and say what's wrong; Enter continues, Back keeps everything.
 * The last step submits, then a small success state takes over. On narrow screens the steps collapse
 * to "Step 2 of 4 · Team".
 * Building blocks for the steps come along: StepperField, StepperInput, StepperTags (emails as chips),
 * StepperChoices (selectable cards), StepperReview (a summary with Edit links) and StepperSuccess.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop on <StepperForm> (the default comes from the file: stepper-form.tsx is
 * Standard, stepper-form-clean.tsx is Clean); the building blocks follow the form they sit in. Clean is one white
 * card with hairline shadows: on top a thin progress bar per step with small uppercase labels and plain numbers,
 * finished steps get a blue check, and Back and Continue sit in the card's last row. In Clean the email field stays
 * one line – chips scroll sideways, and a new one scrolls into view next to the text.
 */

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-sf";

export type StepErrors = Partial<Record<string, string>>;

export type StepContext<V> = {
  values: V;
  /** Merges a patch into the values – shared by every step, so Back keeps what was entered */
  setValues: (patch: Partial<V>) => void;
  /** Messages of this step – only filled after a Continue that didn't pass */
  errors: StepErrors;
  /** Jumps to a step by id – from a later step, Continue then returns to where you came from */
  goTo: (id: string) => void;
  /** Same as pressing Continue */
  next: () => void;
};

export type Step<V> = {
  id: string;
  /** Short label for the step list, e.g. "Team" */
  title: string;
  /** Heading inside the card – defaults to the title */
  heading?: string;
  /** A line under the heading */
  description?: string;
  render: (ctx: StepContext<V>) => ReactNode;
  /** Returns messages by field name; nothing (or an empty object) means the step is fine */
  validate?: (values: V) => StepErrors | null | undefined;
};

type StepperFormOwnProps<V extends Record<string, unknown>> = {
  steps: Step<V>[];
  /** The values of every step. Controlled when defined – pair it with `onValuesChange` */
  values?: V;
  /** Starting values when `values` isn't controlled */
  defaultValues?: V;
  /** @deprecated Use `defaultValues` – same meaning. Kept for one release */
  initialValues?: V;
  /** Called with all values whenever a step changes them */
  onValuesChange?: (values: V) => void;
  /**
   * Called with all values on the last step; return a promise to show "Creating…" until it settles (throw to show an
   * error that can be retried). The signal aborts when the form unmounts mid-way.
   */
  onComplete?: (values: V, options: { signal: AbortSignal }) => void | Promise<void>;
  /** Controlled step index – pair it with onStepChange */
  step?: number;
  /** Index of the first step shown when `step` isn't controlled */
  defaultStep?: number;
  /** @deprecated Use `defaultStep` – same meaning. Kept for one release */
  initialStep?: number;
  onStepChange?: (step: number) => void;
  /** Label of the last button */
  submitLabel?: string;
  /** Label while onComplete runs */
  submittingLabel?: string;
  /** What shows once onComplete is done – defaults to a short "All set" */
  success?: (values: V, reset: () => void) => ReactNode;
  className?: string;
  /** Visual style. Defaults to the file's look: Standard in stepper-form.tsx, Clean in stepper-form-clean.tsx */
  look?: Look;
  ref?: Ref<HTMLDivElement>;
};

export type StepperFormProps<V extends Record<string, unknown>> = Omit<ComponentPropsWithoutRef<"div">, keyof StepperFormOwnProps<V>> &
  StepperFormOwnProps<V>;

/* ---------- Helpers ---------- */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const hasErrors = (e: StepErrors | null | undefined) => !!e && Object.values(e).some(Boolean);

/** A short, calm shake – Web Animations, so it can run again on the same element without remounting it */
function shake(el: HTMLElement | null) {
  if (!el || reducedMotion() || !el.animate) return;
  el.animate(
    [{ transform: "none" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(-2px)" }, { transform: "none" }],
    { duration: 340, easing: "ease-out" },
  );
}

/** Moves a ring or pill onto the active child of a list – no transition on the first placement, so it doesn't fly in */
function glide(list: HTMLElement | null, pill: HTMLElement | null, selector: string) {
  if (!list || !pill) return;
  const active = list.querySelector<HTMLElement>(selector);
  if (!active || !active.offsetWidth) {
    pill.style.opacity = "0";
    return;
  }
  const first = !pill.dataset.ready;
  if (first) pill.style.transition = "none";
  pill.style.opacity = "1";
  pill.style.width = `${active.offsetWidth}px`;
  pill.style.height = `${active.offsetHeight}px`;
  pill.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
  if (first) {
    pill.dataset.ready = "1";
    void pill.offsetWidth;
    pill.style.transition = "";
  }
}

/* ---------- Icons ---------- */

const Glyph = ({ d, className }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={cx("ui-sf__glyph", className)} aria-hidden="true">
    <path d={d} />
  </svg>
);
const icons = {
  check: "M5.5 12.5l4 4L18.5 8",
  close: "M7 7l10 10M17 7 7 17",
  back: "M14.5 6l-6 6 6 6",
};

/** A check that draws itself in – pathLength 1 makes the dash math independent of the path */
const DrawCheck = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cx("ui-sf__draw", className)} aria-hidden="true">
    <path d={icons.check} pathLength={1} />
  </svg>
);

/* ---------- Contexts for the building blocks ---------- */

type PaneState = {
  errors: StepErrors;
  shake: number;
  report: (name: string, message: string | null) => void;
  /** Says a message through the form's status region – for problems a building block finds on its own */
  say: (message: string) => void;
};
const PaneContext = createContext<PaneState>({ errors: {}, shake: 0, report: () => {}, say: () => {} });

type FieldState = { id: string; invalid: boolean; describedBy?: string; flag: (message: string | null) => void };
const FieldContext = createContext<FieldState | null>(null);
/** The form's look, for building blocks whose behaviour depends on it */
const LookContext = createContext<Look>(DEFAULT_LOOK);

/* ---------- The form ---------- */

const NO_VALUES = {};

/**
 * The flow: which step is open, the values of every step, what was checked, and Continue / Back / jumps / submit.
 * Refs it hands out tell the motion hooks what just happened (a move, the first render).
 */
function useStepperFlow<V extends Record<string, unknown>>({
  steps,
  values: valuesProp,
  startValues,
  onValuesChange,
  onComplete,
  step,
  startStep,
  onStepChange,
}: {
  steps: Step<V>[];
  values?: V;
  startValues: V;
  onValuesChange?: (values: V) => void;
  onComplete?: StepperFormProps<V>["onComplete"];
  step?: number;
  startStep: number;
  onStepChange?: (step: number) => void;
}) {
  const n = steps.length;
  const [stepState, setStep] = useControllable(step, startStep, onStepChange);
  const index = Math.max(0, Math.min(n - 1, stepState));
  const [values, setValuesState] = useControllable(valuesProp, startValues, onValuesChange);
  // Patches merge into the latest values at once, so several setValues calls in one event all land
  const valuesRef = useRef(values);
  useLayoutEffect(() => {
    valuesRef.current = values;
  }, [values]);
  const [reached, setReached] = useState(index);
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const [shakes, setShakes] = useState(0);
  const [returnTo, setReturnTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const [announce, setAnnounce] = useState("");
  // Set on every move, so focus follows it (never on the first render)
  const moved = useRef(false);
  // Nothing slides in on the first render
  const navigated = useRef(false);
  // Problems a building block found on its own, e.g. a typed email that isn't one yet
  const local = useRef<StepErrors>({});
  const report = useCallback((name: string, message: string | null) => {
    local.current = { ...local.current, [name]: message ?? undefined };
  }, []);

  const setValues = useCallback(
    (patch: Partial<V>) => {
      valuesRef.current = { ...valuesRef.current, ...patch };
      setValuesState(valuesRef.current);
    },
    [setValuesState],
  );

  // onComplete may still be running when the form goes away: nothing is set afterwards, and its signal aborts
  const alive = useRef(true);
  const completing = useRef<AbortController | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      completing.current?.abort();
    };
  }, []);

  const go = (to: number) => {
    const next = Math.max(0, Math.min(n - 1, to));
    if (next === index) return;
    moved.current = true;
    navigated.current = true;
    local.current = {};
    setStep(next);
    setReached((r) => Math.max(r, next));
    setSubmitError("");
    setAnnounce(`Step ${next + 1} of ${n}: ${steps[next].title}`);
  };

  /** Checks the current step; shakes and announces the first problem when it doesn't pass */
  const check = () => {
    const errs = { ...local.current, ...steps[index].validate?.(valuesRef.current) };
    if (!hasErrors(errs)) {
      setAttempted((a) => ({ ...a, [index]: false }));
      return true;
    }
    setAttempted((a) => ({ ...a, [index]: true }));
    setShakes((s) => s + 1);
    setAnnounce(Object.values(errs).find(Boolean) ?? "Check this step");
    return false;
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (submitting || done || !check()) return;
    if (index < n - 1) {
      if (returnTo !== null && returnTo > index) {
        setReturnTo(null);
        go(returnTo);
      } else go(index + 1);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    const controller = new AbortController();
    completing.current = controller;
    try {
      await onComplete?.(valuesRef.current, { signal: controller.signal });
      if (!alive.current) return;
      moved.current = true;
      navigated.current = true;
      setDone(true);
      setAnnounce("All done");
    } catch (err) {
      if (!alive.current) return;
      const message = err instanceof Error && err.message ? err.message : "Something went wrong – try again";
      setSubmitError(message);
      setAnnounce(message);
    } finally {
      if (completing.current === controller) completing.current = null;
      if (alive.current) setSubmitting(false);
    }
  };

  const back = () => {
    setReturnTo(null);
    go(index - 1);
  };

  const goTo = (id: string) => {
    const to = steps.findIndex((s) => s.id === id);
    if (to < 0 || to === index) return;
    // Forward jumps need the current step to pass first
    if (to > index && !check()) return;
    setReturnTo(to < index ? index : null);
    go(to);
  };

  const reset = () => {
    valuesRef.current = startValues;
    setValuesState(startValues);
    setAttempted({});
    setReturnTo(null);
    setReached(startStep);
    setDone(false);
    setSubmitError("");
    moved.current = true;
    navigated.current = true;
    local.current = {};
    setStep(startStep);
  };

  return {
    index,
    values,
    setValues,
    furthest: Math.max(reached, index),
    attempted: !!attempted[index],
    shakes,
    returnTo,
    submitting,
    submitError,
    done,
    announce,
    moved,
    navigated,
    report,
    say: setAnnounce,
    submit,
    back,
    goTo,
    reset,
  };
}

/**
 * Which pane shows, and the one sliding out – derived during render, so both are there in the same frame.
 * The leaving pane goes once its slide is over.
 */
function usePaneView(viewIndex: number) {
  const [view, setView] = useState<{ index: number; from: number | null; dir: 1 | -1 }>({ index: viewIndex, from: null, dir: 1 });
  if (view.index !== viewIndex) setView({ index: viewIndex, from: view.index, dir: viewIndex > view.index ? 1 : -1 });
  useEffect(() => {
    if (view.from === null) return;
    const t = window.setTimeout(() => setView((v) => ({ ...v, from: null })), 420);
    return () => clearTimeout(t);
  }, [view.index, view.from]);
  return view;
}

/**
 * The card's motion: focus follows the new step, a failed Continue focuses the first problem, the card glides to the
 * height of the step coming in (kept by a ResizeObserver, not measured per render), and the primary button glides to
 * the width of its label.
 */
function useCardMotion(viewIndex: number, shakes: number, moved: { current: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const btnInner = useRef<HTMLSpanElement>(null);

  // Focus follows the new step: its first field, else its heading (never on the first render)
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const pane = viewport.current?.querySelector<HTMLElement>('[data-pane="current"]');
    const field = pane?.querySelector<HTMLElement>('input:not([type="hidden"]):not(:disabled), textarea, select');
    (field ?? pane?.querySelector<HTMLElement>(".ui-sf__heading"))?.focus({ preventScroll: true });
  }, [viewIndex, moved]);

  // After a failed Continue the first field with a problem gets the focus
  useEffect(() => {
    if (!shakes) return;
    const field = viewport.current?.querySelector<HTMLElement>('[data-pane="current"] [aria-invalid="true"]');
    field?.focus({ preventScroll: true });
    // Into view above the sticky footer (scroll-margin-bottom on fields) – never hidden behind it (2.4.11)
    field?.scrollIntoView?.({ block: "nearest" });
  }, [shakes]);

  // The card glides to the height of the step that's coming in
  useLayoutEffect(() => {
    const box = viewport.current;
    const pane = box?.querySelector<HTMLElement>('[data-pane="current"]');
    if (!box || !pane) return;
    const first = !box.dataset.ready;
    const set = () => (box.style.height = `${pane.offsetHeight}px`);
    if (first) box.style.transition = "none";
    set();
    if (first) {
      box.dataset.ready = "1";
      void box.offsetWidth;
      box.style.transition = "";
    }
    const ro = new ResizeObserver(set);
    ro.observe(pane);
    return () => ro.disconnect();
  }, [viewIndex]);

  // The primary button glides to the width of its new label
  useLayoutEffect(() => {
    const box = btn.current;
    const inner = btnInner.current;
    if (!box || !inner) return;
    const set = () => (box.style.width = `${inner.offsetWidth}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return { viewport, btn, btnInner };
}

/**
 * The numbered steps on top – wide: the full list; narrow: replaced on screen by one line, the list stays for screen
 * readers and comes back into view while one of its jump buttons has keyboard focus (so focus is never invisible)
 */
function StepperHead<V>({
  steps,
  index,
  furthest,
  done,
  submitting,
  look,
  onJump,
}: {
  steps: Step<V>[];
  index: number;
  furthest: number;
  done: boolean;
  submitting: boolean;
  look: Look;
  onJump: (id: string) => void;
}) {
  const n = steps.length;
  return (
    <div className="ui-sf__head">
      <div className="ui-sf__steps">
        <ol className="ui-sf__list" aria-label="Progress">
          {steps.map((s, i) => {
            const state = done || (i < furthest && i !== index) ? "done" : i === index ? "current" : "upcoming";
            const canJump = !done && !submitting && i !== index && i <= furthest;
            const inner = (
              <>
                {/* Clean: a thin progress bar per step, and plain numbers */}
                {look === "clean" && <span className="ui-sf__bar" aria-hidden="true" />}
                <span className="ui-sf__mark">
                  {state === "done" ? <DrawCheck key="check" /> : <span key="num">{look === "clean" ? i + 1 : `${i + 1}.`}</span>}
                </span>
                <span className="ui-sf__step-label">{s.title}</span>
                <span className="ui-sf__sr">{state === "done" ? " (done)" : state === "current" ? " (current)" : ""}</span>
              </>
            );
            return (
              <li key={s.id} className="ui-sf__step" data-state={state} aria-current={!done && i === index ? "step" : undefined}>
                {canJump ? (
                  <button type="button" className="ui-sf__step-btn" onClick={() => onJump(s.id)}>
                    {inner}
                  </button>
                ) : (
                  <span className="ui-sf__step-btn">{inner}</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="ui-sf__compact" aria-hidden="true">
        <span className="ui-sf__compact-text" key={done ? "done" : index}>
          {done ? (
            <>All {n} steps done</>
          ) : (
            <>
              Step {index + 1} of {n}
              <span className="ui-sf__compact-dot">·</span>
              <span className="ui-sf__compact-title">{steps[index].title}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

/** Back and Continue (or Finish) – the footer folds away once everything is done */
function StepperFoot({
  index,
  done,
  submitting,
  submitError,
  valid,
  label,
  btn,
  btnInner,
  onBack,
}: {
  index: number;
  done: boolean;
  submitting: boolean;
  submitError: string;
  valid: boolean;
  label: string;
  btn: { current: HTMLButtonElement | null };
  btnInner: { current: HTMLSpanElement | null };
  onBack: () => void;
}) {
  return (
    <div className="ui-sf__foot-fold" data-hidden={done || undefined}>
      <div className="ui-sf__foot" inert={done}>
        <button type="button" className="ui-sf__btn ui-sf__btn-ghost" data-hidden={index === 0 || undefined} disabled={index === 0 || submitting} onClick={onBack}>
          <Glyph d={icons.back} />
          Back
        </button>
        {submitError && (
          <span className="ui-sf__submit-error" role="alert">
            {submitError}
          </span>
        )}
        <button ref={btn} type="submit" className="ui-sf__btn ui-sf__btn-primary" aria-disabled={!valid || submitting || undefined} data-busy={submitting || undefined}>
          <span ref={btnInner} className="ui-sf__btn-inner">
            {submitting && <span className="ui-sf__spinner" aria-hidden="true" />}
            <span className="ui-sf__btn-label" key={label}>
              {label}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

export function StepperForm<V extends Record<string, unknown>>({
  steps,
  values: valuesProp,
  defaultValues,
  initialValues,
  onValuesChange,
  onComplete,
  step,
  defaultStep,
  initialStep,
  onStepChange,
  submitLabel = "Finish",
  submittingLabel = "Creating…",
  success,
  className,
  look,
  ref,
  style,
  ...rest
}: StepperFormProps<V>) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const n = steps.length;
  const startStep = defaultStep ?? initialStep ?? 0;
  const startValues = (defaultValues ?? initialValues ?? NO_VALUES) as V;
  const flow = useStepperFlow({ steps, values: valuesProp, startValues, onValuesChange, onComplete, step, startStep, onStepChange });
  const { index, values, setValues, done, submitting, returnTo, shakes, goTo, reset, report, navigated } = flow;
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const rootRef = useRootRef(root, ref);

  const viewIndex = done ? n : index;
  const view = usePaneView(viewIndex);
  const { viewport, btn, btnInner } = useCardMotion(viewIndex, shakes, flow.moved);
  // Safety net: Back disabled on the first step or while submitting, a jump button gone, the footer folding away –
  // focus goes to Continue, else the open step's heading, never <body>
  useFocusRescue(root, {
    fallback: () => (btn.current?.closest("[inert]") ? null : btn.current) ?? viewport.current?.querySelector<HTMLElement>('[data-pane="current"] .ui-sf__heading'),
  });

  const current = steps[index];
  // The step's verdict, once per change of values – not once for the messages and again for the button
  const verdict = useMemo(() => current.validate?.(values), [current, values]);
  const errors = flow.attempted ? verdict ?? {} : {};
  const valid = !hasErrors(verdict);
  const last = index === n - 1;
  const label = submitting ? submittingLabel : last ? submitLabel : returnTo !== null && returnTo > index ? `Back to ${steps[returnTo].title.toLowerCase()}` : "Continue";

  const ctx: StepContext<V> = { values, setValues, errors, goTo, next: () => formRef.current?.requestSubmit() };

  const renderPane = (i: number) => {
    if (i >= n) {
      return success ? success(values, reset) : <StepperSuccess title="All set" description="Everything is saved. You can change it any time." />;
    }
    const s = steps[i];
    const paneCtx = i === index ? ctx : { ...ctx, errors: {} };
    return (
      <>
        <h2 className="ui-sf__heading" tabIndex={-1} id={`${uid}-h${i}`}>
          {s.heading ?? s.title}
        </h2>
        {s.description && <p className="ui-sf__desc">{s.description}</p>}
        <div className="ui-sf__body">{s.render(paneCtx)}</div>
      </>
    );
  };

  const panes = view.from !== null && view.from !== view.index ? [view.from, view.index] : [view.index];

  return (
    <div
      {...rest}
      ref={rootRef}
      className={cx(ROOT_CLASS, className)}
      data-look={resolvedLook}
      style={{ ...style, "--tc-stepper-form-n": n } as CSSProperties}
    >
      <LookContext.Provider value={resolvedLook}>
      {/* React 19 hoists this into <head> once, no matter how many forms render */}
      <style href="ui-stepper-form" precedence="default">
        {css}
      </style>

      <StepperHead steps={steps} index={index} furthest={flow.furthest} done={done} submitting={submitting} look={resolvedLook} onJump={goTo} />

      <form ref={formRef} className="ui-sf__card" noValidate onSubmit={flow.submit} aria-labelledby={done ? undefined : `${uid}-h${index}`}>
        <div ref={viewport} className="ui-sf__viewport">
          {panes.map((i) => {
            const isCurrent = i === view.index;
            return (
              <div
                key={i}
                className="ui-sf__pane"
                data-pane={isCurrent ? "current" : "leaving"}
                data-dir={view.dir}
                data-first={!navigated.current || undefined}
                inert={!isCurrent}
                aria-hidden={!isCurrent || undefined}
              >
                <PaneContext.Provider value={{ errors: isCurrent && i === index ? errors : {}, shake: isCurrent ? shakes : 0, report, say: flow.say }}>
                  {renderPane(i)}
                </PaneContext.Provider>
              </div>
            );
          })}
        </div>

        <StepperFoot index={index} done={done} submitting={submitting} submitError={flow.submitError} valid={valid} label={label} btn={btn} btnInner={btnInner} onBack={flow.back} />
      </form>

      {/* Persistent from mount: step changes, the first problem after Continue, an entry that couldn't be added */}
      <span className="ui-sf__sr" role="status">
        {flow.announce}
      </span>
      </LookContext.Provider>
    </div>
  );
}

/* ---------- Building blocks ---------- */

export type StepperFieldProps = {
  /** Matches the key in the step's validate result */
  name: string;
  label: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
};

/** A label, the control and an inline message that folds in – the control shakes when Continue finds a problem */
export function StepperField({ name, label, hint, optional, children }: StepperFieldProps) {
  const { errors, shake: shakes, report, say } = useContext(PaneContext);
  const [local, setLocal] = useState<string | null>(null);
  const [localShake, setLocalShake] = useState(0);
  const id = useId();
  const control = useRef<HTMLDivElement>(null);
  const message = errors[name] ?? local ?? "";
  // Keeps the last text while the message folds away
  const [lastMessage, setLastMessage] = useState(message);
  if (message && message !== lastMessage) setLastMessage(message);
  const invalid = !!message;

  useEffect(() => {
    if (shakes && (errors[name] || local)) shake(control.current);
  }, [shakes]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (localShake) shake(control.current);
  }, [localShake]);

  const flag = useCallback((m: string | null) => {
    setLocal(m);
    report(name, m);
    if (m) {
      setLocalShake((s) => s + 1);
      say(m);
    }
  }, [name, report, say]);

  return (
    <div className="ui-sf__field" data-invalid={invalid || undefined}>
      <label className="ui-sf__label" htmlFor={id}>
        {label}
        {optional && <span className="ui-sf__optional">Optional</span>}
      </label>
      <div ref={control} className="ui-sf__control">
        <FieldContext.Provider value={{ id, invalid, describedBy: invalid ? `${id}-msg` : hint ? `${id}-hint` : undefined, flag }}>
          {children}
        </FieldContext.Provider>
      </div>
      <div className="ui-sf__fold" data-open={invalid || undefined}>
        <div>
          <p className="ui-sf__msg" id={`${id}-msg`} key={message || lastMessage}>
            {message || lastMessage}
          </p>
        </div>
      </div>
      {hint && (
        <div className="ui-sf__fold" data-open={!invalid || undefined}>
          <div>
            <p className="ui-sf__hint" id={`${id}-hint`}>
              {hint}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export type StepperInputProps = Omit<ComponentPropsWithoutRef<"input">, "prefix"> & {
  /** Fixed text before the value, e.g. "acme.com/" */
  prefix?: string;
  /** Goes to the wrapper (which draws the field), not the <input> */
  className?: string;
  ref?: Ref<HTMLInputElement>;
};

/**
 * A text field wired to its StepperField – label, message and aria come from there. Every other prop (name,
 * required, disabled, autoComplete, ref …) reaches the <input>; autoComplete is left to you and the browser.
 */
export function StepperInput({ prefix, className, id, "aria-describedby": describedBy, "aria-invalid": ariaInvalid, ...rest }: StepperInputProps) {
  const field = useContext(FieldContext);
  return (
    <div className={cx("ui-sf__input", className)} data-invalid={field?.invalid || undefined}>
      {prefix && (
        <span className="ui-sf__prefix" aria-hidden="true">
          {prefix}
        </span>
      )}
      <input
        spellCheck={false}
        {...rest}
        // The field's wiring wins, so its label and message stay attached; your own description is kept too
        id={field?.id ?? id}
        aria-invalid={field?.invalid || ariaInvalid || undefined}
        aria-describedby={[field?.describedBy, describedBy].filter(Boolean).join(" ") || undefined}
      />
    </div>
  );
}

export type StepperTagsProps = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Returns a message when an entry can't be added */
  validate?: (entry: string, list: string[]) => string | null;
  /** Largest number of entries */
  max?: number;
  /** Submits the entries with a native form, comma-separated, through a hidden input */
  name?: string;
  disabled?: boolean;
  /** Marks the field as required for assistive tech – checking it is up to the step's validate */
  required?: boolean;
  /** The input's autocomplete – "off" by default, since the entries are usually other people's addresses */
  autoComplete?: string;
};

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;

/** Entries as chips – add with Enter, comma or by pasting a list, remove with × or Backspace. Defaults to email checks */
export function StepperTags({
  value,
  onChange,
  placeholder = "name@company.com",
  validate = (entry, list) => (!EMAIL.test(entry) ? "That doesn't look like an email address" : list.includes(entry) ? "Already on the list" : null),
  max,
  name,
  disabled = false,
  required,
  autoComplete = "off",
}: StepperTagsProps) {
  const field = useContext(FieldContext);
  const [draft, setDraft] = useState("");
  const [leaving, setLeaving] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const look = useContext(LookContext);
  const box = useRef<HTMLDivElement>(null);
  const count = useRef(value.length);

  // Clean: the field stays one line – chips scroll sideways, and a new one scrolls into view next to the text
  useLayoutEffect(() => {
    const el = box.current;
    if (look === "clean" && el && value.length > count.current)
      el.scrollTo({ left: el.scrollWidth, behavior: reducedMotion() ? "auto" : "smooth" });
    count.current = value.length;
  }, [value.length, look]);

  /** Adds every entry in the text; keeps the ones that fail in the field and says why */
  const commit = (text: string) => {
    const parts = text.split(/[\s,;]+/).map((p) => p.trim().toLowerCase()).filter(Boolean);
    if (!parts.length) return true;
    const next = [...valueRef.current];
    const rest: string[] = [];
    let problem: string | null = null;
    for (const p of parts) {
      const m = max !== undefined && next.length >= max ? `Up to ${max}` : validate(p, next);
      if (m) {
        problem ??= m;
        rest.push(p);
      } else next.push(p);
    }
    if (next.length !== valueRef.current.length) {
      valueRef.current = next;
      onChange(next);
    }
    setDraft(rest.join(", "));
    field?.flag(problem);
    return !problem;
  };

  const remove = (entry: string) => {
    if (leaving.includes(entry)) return;
    setLeaving((l) => [...l, entry]);
    const el = list.current?.querySelector<HTMLElement>(`[data-entry="${CSS.escape(entry)}"]`);
    // Focus on this chip's × moves at once to the next chip's ×, else the previous one, else the text field
    const sibling = (dir: "next" | "prev") => () => {
      let li = el?.[dir === "next" ? "nextElementSibling" : "previousElementSibling"];
      while (li && li.hasAttribute("data-leaving")) li = li[dir === "next" ? "nextElementSibling" : "previousElementSibling"];
      return li?.querySelector("button");
    };
    rescueFocus(el, [sibling("next"), sibling("prev"), input.current]);
    const finish = () => {
      setLeaving((l) => l.filter((x) => x !== entry));
      onChange(valueRef.current.filter((x) => x !== entry));
    };
    // A short flash, then the chip folds away and the others close the gap
    if (el && el.animate && !reducedMotion()) {
      el.animate(
        [
          { width: `${el.offsetWidth}px`, marginRight: "0px", opacity: 1, transform: "none" },
          { width: "0px", marginRight: "-6px", opacity: 0, transform: "scale(0.85)" },
        ],
        { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
      ).onfinish = finish;
    } else finish();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Keys that confirm an IME composition aren't ours
    if (e.nativeEvent.isComposing) return;
    if ((e.key === "Enter" && draft.trim()) || e.key === "," || e.key === ";") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      e.preventDefault();
      remove(value[value.length - 1]);
    }
    // Enter in an empty field falls through to the form: Continue
  };

  return (
    <div
      ref={box}
      className="ui-sf__tags"
      data-invalid={field?.invalid || undefined}
      data-disabled={disabled || undefined}
      onClick={(e) => e.target === e.currentTarget && input.current?.focus()}
    >
      {value.length > 0 && (
        <ul ref={list} className="ui-sf__chips" aria-label="Added">
          {value.map((entry) => (
            <li key={entry} className="ui-sf__chip" data-entry={entry} data-leaving={leaving.includes(entry) || undefined}>
              <span className="ui-sf__chip-text" title={entry}>
                {entry}
              </span>
              <button type="button" className="ui-sf__chip-x" aria-label={`Remove ${entry}`} disabled={disabled} onClick={() => remove(entry)}>
                <Glyph d={icons.close} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={input}
        id={field?.id}
        type="email"
        inputMode="email"
        autoComplete={autoComplete}
        spellCheck={false}
        className="ui-sf__tags-input"
        placeholder={value.length ? "Add another" : placeholder}
        value={draft}
        aria-invalid={field?.invalid || undefined}
        aria-describedby={field?.describedBy}
        aria-required={required || undefined}
        disabled={disabled}
        onChange={(e) => {
          setDraft(e.target.value);
          field?.flag(null);
        }}
        onKeyDown={onKeyDown}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (/[\s,;]/.test(text.trim())) {
            e.preventDefault();
            commit(`${draft} ${text}`);
          }
        }}
        onBlur={() => draft.trim() && commit(draft)}
      />
      {name !== undefined && <input type="hidden" name={name} value={value.join(",")} disabled={disabled} />}
    </div>
  );
}

export type StepperChoice = {
  value: string;
  title: string;
  /** Shown on the right of the title, e.g. a price */
  aside?: ReactNode;
  description?: ReactNode;
  /** A small label, e.g. "Popular" */
  badge?: string;
};

export type StepperChoicesProps = {
  value: string;
  onChange: (value: string) => void;
  options: StepperChoice[];
  /** Name of the group for screen readers */
  label: string;
  /** Submits the chosen value with a native form, through a hidden input */
  name?: string;
  disabled?: boolean;
  /** Marks the group as required for assistive tech – checking it is up to the step's validate */
  required?: boolean;
};

/** Selectable cards – a ring glides to the chosen one. Arrow keys move, Enter picks and continues */
export function StepperChoices({ value, onChange, options, label, name, disabled = false, required }: StepperChoicesProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);

  // The ring moves when the choice or the options change – not on every render
  useLayoutEffect(() => {
    glide(listRef.current, ring.current, '[aria-checked="true"]');
  }, [value, options]);
  // Columns turn into rows on narrow screens – the ring follows
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => glide(list, ring.current, '[aria-checked="true"]'));
    ro.observe(list);
    return () => ro.disconnect();
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || e.nativeEvent.isComposing) return;
    const at = options.findIndex((o) => o.value === value);
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (step) {
      e.preventDefault();
      const next = options[(at + step + options.length) % options.length];
      onChange(next.value);
      listRef.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(next.value)}"]`)?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget.closest("form") as HTMLFormElement | null)?.requestSubmit();
    }
  };

  return (
    <div
      ref={listRef}
      className="ui-sf__choices"
      role="radiogroup"
      aria-label={label}
      aria-required={required || undefined}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
    >
      <span ref={ring} className="ui-sf__ring" aria-hidden="true" />
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            data-value={o.value}
            className="ui-sf__choice"
            disabled={disabled}
            onClick={() => onChange(o.value)}
          >
            <span className="ui-sf__choice-top">
              <span className="ui-sf__choice-title">{o.title}</span>
              {o.badge && <span className="ui-sf__badge">{o.badge}</span>}
              <span className="ui-sf__radio" aria-hidden="true" />
            </span>
            {o.aside && <span className="ui-sf__choice-aside">{o.aside}</span>}
            {o.description && <span className="ui-sf__choice-desc">{o.description}</span>}
          </button>
        );
      })}
      {name !== undefined && <input type="hidden" name={name} value={value} disabled={disabled} />}
    </div>
  );
}

export type StepperReviewRow = {
  label: string;
  value: ReactNode;
  /** Id of the step that sets it – shows an Edit link */
  step?: string;
};

/** A summary of what was entered, each row with an Edit link back to its step */
export function StepperReview({ rows, onEdit }: { rows: StepperReviewRow[]; onEdit?: (step: string) => void }) {
  return (
    <dl className="ui-sf__review">
      {rows.map((r) => (
        <div key={r.label} className="ui-sf__review-row">
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
          {r.step && onEdit && (
            <button type="button" className="ui-sf__edit" aria-label={`Edit ${r.label.toLowerCase()}`} onClick={() => onEdit(r.step!)}>
              Edit
            </button>
          )}
        </div>
      ))}
    </dl>
  );
}

/** The success state: a check pops in, a heading and a short line, plus optional actions */
export function StepperSuccess({ title, description, children }: { title: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="ui-sf__success">
      <span className="ui-sf__success-check">
        <DrawCheck />
      </span>
      <h2 className="ui-sf__heading" tabIndex={-1}>
        {title}
      </h2>
      {description && <p className="ui-sf__desc">{description}</p>}
      {children && <div className="ui-sf__success-actions">{children}</div>}
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Colors and motion as variables – override them on .ui-sf */
:where([data-look="standard"], [data-look="standard"] *).ui-sf {
  /* A soft gray halo (hovered step, the success check) and the hairline of a hovered field */
  --tc-stepper-form-halo: light-dark(rgba(23, 23, 23, 0.08), rgba(255, 255, 255, 0.08));
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 520px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md-plus);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-sf */
:where([data-look="clean"], [data-look="clean"] *).ui-sf {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 520px;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
.ui-sf *, .ui-sf *::before, .ui-sf *::after { box-sizing: border-box; }
:where(.ui-sf) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where(.ui-sf) svg { display: block; flex: none; }
:where(.ui-sf) :is(h2, p, dl, dd, ul, ol) { margin: 0; }
.ui-sf button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
/* 16px icons with thin ~1.1px lines */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }
.ui-sf__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* A check that draws in */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__draw { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
/* A check that draws in */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__draw { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.ui-sf__draw path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ui-sf-draw var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-instant) forwards; }
/* ---- The steps on the tray: "1. Account" in a row, the current one in ink ---- */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__head { padding: 6px 6px 4px; }
/* ---- The steps on top: a thin bar per step, a small uppercase label under it ---- */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__head { padding: 16px 20px 0; }
.ui-sf__steps { position: relative; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__list { display: grid; grid-template-columns: repeat(var(--tc-stepper-form-n), minmax(0, 1fr)); padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step { position: relative; display: grid; justify-items: center; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 100%;
  height: 26px;
  padding: 0 6px;
  border-radius: var(--tc-radius-md);
  line-height: var(--tc-line-height-none);
  cursor: default;
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__list { display: grid; grid-template-columns: repeat(var(--tc-stepper-form-n), minmax(0, 1fr)); gap: 8px; padding: 0; list-style: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step { position: relative; display: grid; min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step-btn {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  column-gap: 6px;
  row-gap: 6px;
  min-width: 0;
  margin: -4px;
  padding: 4px 4px 2px;
  border-radius: var(--tc-radius-sm);
  text-align: left;
  cursor: default;
  transition: background-color var(--tc-duration-instant) var(--tc-ease-standard);
}
button.ui-sf__step-btn { cursor: pointer; }
button:where([data-look="standard"], [data-look="standard"] *).ui-sf__step-btn:hover { background: var(--tc-stepper-form-halo); }
/* The number, or the check once the step is done – same small slot, so the label never moves */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__mark {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  font-size: var(--tc-font-size-sm-plus);
  line-height: var(--tc-line-height-none);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sf__mark > span { line-height: var(--tc-line-height-none); animation: ui-sf-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__mark .ui-sf__draw { width: 13px; height: 13px; stroke-width: 2.4; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step[data-state="current"] .ui-sf__mark { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step[data-state="done"] .ui-sf__mark { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step-label {
  overflow: hidden;
  max-width: 100%;
  font-size: var(--tc-font-size-sm-plus);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-moderate) var(--tc-ease-standard);
}
button:where([data-look="clean"], [data-look="clean"] *).ui-sf__step-btn:hover { background: var(--tc-fill-subtle); }
/* The bar fills from the left once the step is reached */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__bar { position: relative; grid-column: 1 / -1; height: 2px; overflow: hidden; border-radius: var(--tc-radius-2xs); background: var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__bar::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--tc-accent);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step:not([data-state="upcoming"]) .ui-sf__bar::after { transform: none; }
/* The number, or the check once the step is done – same small slot, so the label never moves */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__mark {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: flex-start;
  min-width: 12px;
  height: 16px;
  font-size: var(--tc-font-size-2xs);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__mark > span { animation: ui-sf-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__mark .ui-sf__draw { width: 12px; height: 12px; stroke-width: 2.4; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step[data-state="current"] .ui-sf__mark { color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step[data-state="done"] .ui-sf__mark { color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step-label {
  overflow: hidden;
  min-width: 0;
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-caption-color);
  transition: color var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-sf__step[data-state="done"] .ui-sf__step-label { color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step[data-state="current"] .ui-sf__step-label { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step[data-state="current"] .ui-sf__step-label { color: var(--tc-text-strong); }
button.ui-sf__step-btn:hover .ui-sf__step-label { color: var(--tc-text-primary); }
/* Compact header for narrow screens */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__compact { display: none; gap: 8px; padding: 0 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__compact-text { display: flex; align-items: baseline; min-width: 0; font-size: var(--tc-font-size-sm-plus); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); white-space: nowrap; animation: ui-sf-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
/* Compact line for narrow screens: "STEP 2 OF 4 · TEAM" above the bars */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__compact { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__compact-text {
  display: flex;
  min-width: 0;
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  font-variant-numeric: tabular-nums;
  color: var(--tc-caption-color);
  white-space: nowrap;
  animation: ui-sf-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both;
}
.ui-sf__compact-dot { margin: 0 6px; color: var(--tc-text-disabled); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__compact-title { overflow: hidden; text-overflow: ellipsis; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
/* ---- The white card ---- */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__card { display: grid; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clips the sliding panes; the panes carry a little padding so focus rings aren't cut */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__viewport { position: relative; overflow: hidden; transition: height var(--tc-duration-slower) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__pane { padding: 20px 20px 8px; animation: ui-sf-enter var(--tc-duration-slower) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__pane[data-dir="-1"] { animation-name: ui-sf-enter-back; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__compact-title { overflow: hidden; text-overflow: ellipsis; color: var(--tc-text-strong); }
/* ---- The step content: only this part clips and glides to each step's height ---- */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__card { display: grid; min-width: 0; }
/* The panes carry a little padding so focus rings aren't cut */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__viewport { position: relative; overflow: hidden; transition: height var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__pane { padding: 20px 20px 20px; animation: ui-sf-enter-clean var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__pane[data-dir="-1"] { animation-name: ui-sf-enter-back-clean; }
.ui-sf__pane[data-first] { animation: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__pane[data-pane="leaving"] { position: absolute; top: 0; left: 0; right: 0; pointer-events: none; animation: ui-sf-leave var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__pane[data-pane="leaving"][data-dir="-1"] { animation-name: ui-sf-leave-back; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__heading { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); letter-spacing: -0.01em; color: var(--tc-text-primary); outline: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__desc { margin-top: 4px; color: var(--tc-text-muted); text-wrap: pretty; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__body { display: grid; gap: 14px; margin-top: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__pane[data-pane="leaving"] { position: absolute; top: 0; left: 0; right: 0; pointer-events: none; animation: ui-sf-leave-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__pane[data-pane="leaving"][data-dir="-1"] { animation-name: ui-sf-leave-back-clean; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__heading { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); color: var(--tc-text-strong); outline: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__desc { color: var(--tc-text-secondary); text-wrap: pretty; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__body { display: grid; gap: 16px; margin-top: 16px; }
/* Fields */
.ui-sf__field { display: grid; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__label { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 6px; font-size: var(--tc-font-size-sm-plus); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__label { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 0 0 6px 2px; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-sf__optional { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-sf__control { min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__input,
:where([data-look="standard"], [data-look="standard"] *).ui-sf__tags {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: var(--tc-field-h);
  border-radius: var(--tc-field-radius);
}
/* The field recipe: a control border (≥ 3:1) at rest, the focus ring + halo on the wrapper while typing */
.ui-sf__input, .ui-sf__tags {
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard);
  cursor: text;
}
.ui-sf__input:hover, .ui-sf__tags:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-sf__input:focus-within, .ui-sf__tags:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-sf__input[data-invalid], .ui-sf__tags[data-invalid] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-sf__input[data-invalid]:focus-within, .ui-sf__tags[data-invalid]:focus-within { box-shadow: var(--tc-field-shadow-invalid), 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
/* Focus never lands under the sticky footer (2.4.11) */
.ui-sf__card :is(input, textarea, select, button) { scroll-margin: 16px 0 88px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__input input,
:where([data-look="standard"], [data-look="standard"] *).ui-sf__tags-input {
  flex: 1;
  min-width: 0;
  height: var(--tc-field-h);
  padding: 0 var(--tc-field-px);
  border: 0;
  /* The wrapper shows focus (:focus-within) */
  outline: none;
  background: none;
  font: inherit;
  font-size: var(--tc-field-font-size);
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__input,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags {
  display: flex;
  align-items: center;
  min-width: 0;
  height: var(--tc-field-h);
  border-radius: var(--tc-field-radius);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__input input,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags-input {
  flex: 1;
  min-width: 0;
  height: var(--tc-field-h);
  margin: 0;
  padding: 0 var(--tc-field-px);
  border: 0;
  /* The wrapper shows focus (:focus-within) */
  outline: none;
  background: none;
  font: inherit;
  font-size: var(--tc-field-font-size);
  color: var(--tc-text-primary);
}
.ui-sf__input input::placeholder, .ui-sf__tags-input::placeholder { color: var(--tc-text-placeholder); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__prefix { flex: none; padding-left: var(--tc-field-px); font-size: var(--tc-field-font-size); color: var(--tc-text-muted); white-space: nowrap; user-select: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__prefix + input { padding-left: 1px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__prefix { flex: none; padding-left: var(--tc-field-px); color: var(--tc-text-muted); white-space: nowrap; user-select: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__prefix + input { padding-left: 0; }
/* Message and hint fold open and closed */
.ui-sf__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-moderate) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-sf__fold[data-open] { grid-template-rows: 1fr; opacity: 1; }
.ui-sf__fold > div { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__msg,
:where([data-look="standard"], [data-look="standard"] *).ui-sf__hint { padding-top: 6px; font-size: var(--tc-font-size-sm-plus); text-wrap: pretty; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__msg { color: var(--tc-status-danger-solid); animation: ui-sf-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__msg,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__hint { padding: 6px 0 0 2px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); text-wrap: pretty; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__msg { color: var(--tc-status-danger-solid); animation: ui-sf-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-sf__hint { color: var(--tc-text-muted); }
/* Email chips */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__tags { flex-wrap: wrap; gap: 6px; padding: 3px; }
/* Email chips: one line – the chips scroll sideways, the text field stays at the end */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags { gap: 4px; padding: 0 4px; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; overscroll-behavior-x: contain; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags::-webkit-scrollbar { display: none; }
.ui-sf__chips { display: contents; padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  max-width: 100%;
  height: 28px;
  padding: 0 2px 0 10px;
  overflow: hidden;
  border-radius: var(--tc-radius-md);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-primary);
  white-space: nowrap;
  animation: ui-sf-chip var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 2px;
  max-width: 220px;
  height: 24px;
  padding: 0 3px 0 8px;
  overflow: hidden;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-primary);
  white-space: nowrap;
  animation: ui-sf-chip var(--tc-duration-moderate) var(--tc-ease-move) both;
}
.ui-sf__chip[data-leaving] { pointer-events: none; }
.ui-sf__chip-text { overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__chip-x { display: grid; place-items: center; flex: none; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__chip-x .ui-sf__glyph { width: 13px; height: 13px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__chip-x:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
/* A 24px target drawn as an 18px square: the hover fill is inset, the margins keep the chip's size */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip-x { position: relative; display: grid; place-items: center; flex: none; width: 24px; height: 24px; margin: 0 -3px; color: var(--tc-icon-muted); transition: color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip-x::before { content: ""; position: absolute; inset: 3px; border-radius: var(--tc-radius-xs); transition: background-color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip-x .ui-sf__glyph { position: relative; width: 12px; height: 12px; stroke-width: 1.9; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip-x:hover { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip-x:hover::before { background: var(--tc-fill-default); }
.ui-sf__chip[data-leaving] .ui-sf__chip-x, .ui-sf__chip[data-leaving] .ui-sf__chip-x::before { background: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__tags-input { flex: 1 1 140px; height: 28px; padding: 0 7px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags-input { flex: 1 0 140px; height: 24px; padding: 0 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags-input:first-child { padding-left: 6px; }
/* Selectable cards with a ring that glides */
.ui-sf__choices { position: relative; display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; gap: 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__ring {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  border-radius: var(--tc-radius-xl);
  box-shadow: inset 0 0 0 1.5px var(--tc-accent), 0 0 0 3px var(--tc-accent-subtle);
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-slower) var(--tc-ease-move), width var(--tc-duration-slower) var(--tc-ease-move), height var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice {
  position: relative;
  display: grid;
  align-content: start;
  gap: 2px;
  min-width: 0;
  padding: 12px;
  border-radius: var(--tc-radius-xl);
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  text-align: left;
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice:hover { box-shadow: inset 0 0 0 1px var(--tc-border-control-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice[aria-checked="true"] { background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 1px transparent; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__ring {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  border-radius: var(--tc-radius-md);
  box-shadow: 0 0 0 0.5px var(--tc-border-selected);
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-moderate) var(--tc-ease-move), width var(--tc-duration-moderate) var(--tc-ease-move), height var(--tc-duration-moderate) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice {
  position: relative;
  display: grid;
  align-content: start;
  gap: 2px;
  min-width: 0;
  padding: 10px 12px 12px;
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  text-align: left;
  transition: background-color var(--tc-duration-instant) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice[aria-checked="true"] { background: var(--tc-accent-subtle); }
.ui-sf__choice:focus-visible { outline-offset: 3px; }
.ui-sf__choice-top { display: flex; align-items: center; gap: 6px; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice-title { overflow: hidden; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
/* Badge: the pill recipe */
.ui-sf__badge { display: inline-flex; align-items: center; flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__badge { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__radio { position: relative; flex: none; width: 16px; height: 16px; margin-left: auto; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1.5px var(--tc-border-control); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__radio::after { content: ""; position: absolute; inset: 4px; border-radius: var(--tc-radius-full); background: var(--tc-accent); transform: scale(0); transition: transform var(--tc-duration-slow) var(--tc-ease-spring); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice[aria-checked="true"] .ui-sf__radio { box-shadow: inset 0 0 0 1.5px var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice-title { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__badge { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__radio { position: relative; flex: none; width: 14px; height: 14px; margin-left: auto; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1px var(--tc-border-control); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__radio::after { content: ""; position: absolute; inset: 3.5px; border-radius: var(--tc-radius-full); background: var(--tc-accent); transform: scale(0); transition: transform var(--tc-duration-moderate) var(--tc-ease-spring); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice[aria-checked="true"] .ui-sf__radio { box-shadow: inset 0 0 0 1px var(--tc-accent); }
.ui-sf__choice[aria-checked="true"] .ui-sf__radio::after { transform: scale(1); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice-aside { font-size: var(--tc-font-size-md); font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice-desc { margin-top: 4px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-wrap: pretty; }
/* Review */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review { display: grid; border-radius: var(--tc-radius-xl); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review-row { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; align-items: baseline; gap: 12px; padding: 11px 8px 11px 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review-row + .ui-sf__review-row { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review dt { font-size: var(--tc-font-size-sm-plus); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice-aside { font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice-desc { margin-top: 2px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); text-wrap: pretty; }
/* Review: rows under hairlines */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review { display: grid; border-radius: var(--tc-radius-md); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review-row { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; align-items: baseline; gap: 12px; padding: 10px 8px 10px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review-row + .ui-sf__review-row { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review dt { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); }
.ui-sf__review dd { min-width: 0; color: var(--tc-text-primary); overflow-wrap: break-word; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__edit { height: var(--tc-control-h-sm); margin: -5px 0; padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm-plus); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__edit:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* Success */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__success { display: grid; justify-items: center; padding: 20px 0 14px; text-align: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__success-check {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 14px;
  border-radius: var(--tc-radius-full);
  background: var(--tc-text-primary);
  color: var(--tc-text-on-inverse);
  box-shadow: 0 0 0 6px var(--tc-stepper-form-halo);
  animation: ui-sf-pop var(--tc-duration-slowest) var(--tc-ease-spring) var(--tc-duration-quick) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-sf__success-check .ui-sf__draw { width: 20px; height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__edit { height: var(--tc-control-h-sm); margin: -2px 0; padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__edit:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* Success */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__success { display: grid; justify-items: center; padding: 16px 0 8px; text-align: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__success-check {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-bottom: 12px;
  border-radius: var(--tc-radius-full);
  background: var(--tc-status-success-bg);
  color: var(--tc-status-success-fg);
  animation: ui-sf-pop var(--tc-duration-slowest) var(--tc-ease-spring) var(--tc-duration-quick) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-sf__success-check .ui-sf__draw { width: 18px; height: 18px; stroke-width: 2; }
.ui-sf__success-check .ui-sf__draw path { animation-delay: var(--tc-duration-slow); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__success .ui-sf__heading { animation: ui-sf-in var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-base) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__success .ui-sf__desc { max-width: 40ch; text-wrap: balance; animation: ui-sf-in var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-moderate) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__success-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 16px; animation: ui-sf-in var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-slow) both; }
/* ---- Footer: sticks to the bottom of the screen in long pages ---- */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__foot-fold { position: sticky; bottom: 0; z-index: 3; display: grid; grid-template-rows: 1fr; border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: var(--tc-surface-on-tray); transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__success .ui-sf__heading { animation: ui-sf-in-clean var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-base) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__success .ui-sf__desc { max-width: 40ch; text-wrap: balance; animation: ui-sf-in-clean var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-moderate) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__success-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 16px; animation: ui-sf-in-clean var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-slow) both; }
/* ---- The last row of the card: Back and Continue under a hairline; sticks to the bottom in long pages ---- */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__foot-fold { position: sticky; bottom: 0; z-index: 3; display: grid; grid-template-rows: 1fr; border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: var(--tc-surface-raised); transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-sf__foot-fold[data-hidden] { grid-template-rows: 0fr; opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__foot { display: flex; align-items: center; gap: 10px; min-height: 0; overflow: hidden; padding: 12px 16px 16px; }
/* Back and Continue: Button's recipe (control + action pattern tokens) */
.ui-sf__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: var(--tc-control-h-md);
  border-radius: var(--tc-control-radius-md);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn {
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard), width var(--tc-duration-slow) var(--tc-ease-move), visibility var(--tc-duration-base);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn-ghost { gap: 4px; padding: 0 var(--tc-control-px-md) 0 8px; color: var(--tc-action-ghost-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn-ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__foot { display: flex; align-items: center; gap: 12px; min-height: 0; overflow: hidden; padding: 0 12px; border-top: var(--tc-hairline) solid var(--tc-divider); }
/* The row's height lives on a pseudo spacer so the fold can still close it to 0 */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__foot::before { content: ""; flex: none; width: 0; height: 48px; margin-right: -12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn {
  transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard), width var(--tc-duration-slow) var(--tc-ease-move), visibility var(--tc-duration-base);
}
/* Back: Button's secondary recipe */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-ghost { gap: 6px; padding: 0 var(--tc-control-px-md) 0 8px; background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-ghost .ui-sf__glyph { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-ghost:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-sf__btn-ghost[data-hidden] { opacity: 0; visibility: hidden; }
/* Continue: Button's primary recipe – flat ink in both looks */
.ui-sf__btn-primary { margin-left: auto; overflow: hidden; background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-sf__btn-primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-sf__btn-primary:active { background: var(--tc-action-primary-bg-active); }
.ui-sf__btn:active { transform: scale(0.97); }
/* Not ready yet: dimmed, but still answers a press with the messages */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn-primary[aria-disabled="true"] { opacity: 0.4; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn-primary[data-busy] { opacity: 0.75; cursor: progress; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn-inner { display: inline-flex; flex: none; align-items: center; gap: 8px; padding: 0 var(--tc-control-px-md); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn-label { animation: ui-sf-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__spinner { width: 13px; height: 13px; border-radius: var(--tc-radius-full); border: 1.8px solid currentColor; border-right-color: transparent; animation: ui-sf-spin var(--tc-duration-reveal) linear infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__submit-error { min-width: 0; font-size: var(--tc-font-size-sm-plus); color: var(--tc-status-danger-solid); animation: ui-sf-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
@keyframes ui-sf-in { from { opacity: 0; transform: translateY(4px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ui-sf-enter { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
@keyframes ui-sf-enter-back { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: none; } }
@keyframes ui-sf-leave { to { opacity: 0; transform: translateX(-28px); } }
@keyframes ui-sf-leave-back { to { opacity: 0; transform: translateX(28px); } }
/* Not ready yet: dimmed, but still answers a press with the messages */
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-primary[aria-disabled="true"] { opacity: 0.35; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-primary[data-busy] { opacity: 0.7; cursor: progress; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-inner { display: inline-flex; flex: none; align-items: center; gap: 6px; padding: 0 var(--tc-control-px-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn-label { animation: ui-sf-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__spinner { width: 12px; height: 12px; border-radius: var(--tc-radius-full); border: 1.5px solid currentColor; border-right-color: transparent; animation: ui-sf-spin var(--tc-duration-reveal) linear infinite; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__submit-error { min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-solid); animation: ui-sf-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
@keyframes ui-sf-in-clean { from { opacity: 0; transform: translateY(3px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ui-sf-enter-clean { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
@keyframes ui-sf-enter-back-clean { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: none; } }
@keyframes ui-sf-leave-clean { to { opacity: 0; transform: translateX(-24px); } }
@keyframes ui-sf-leave-back-clean { to { opacity: 0; transform: translateX(24px); } }
@keyframes ui-sf-draw { to { stroke-dashoffset: 0; } }
@keyframes ui-sf-pop { 0% { opacity: 0; transform: scale(0.4); } 60% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
@keyframes ui-sf-chip { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: none; } }
@keyframes ui-sf-spin { to { transform: rotate(360deg); } }
/* Narrow (phones): the compact header, cards as rows, stacked review rows, bigger buttons */
@container (max-width: 420px) {
:where([data-look="standard"], [data-look="standard"] *).ui-sf__head { padding: 12px 8px 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__steps:not(:focus-within) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__compact { display: grid; }
/* A jump button has keyboard focus: the list comes back into view in place of the compact line */
:where([data-look="standard"], [data-look="standard"] *).ui-sf__head:has(.ui-sf__steps:focus-within) .ui-sf__compact { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__pane { padding: 18px 16px 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__foot { padding: 12px 12px 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn { height: var(--tc-control-h-lg); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choices { grid-template-columns: minmax(0, 1fr); grid-auto-flow: row; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice { grid-template-columns: minmax(0, 1fr) auto; column-gap: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice-top { grid-column: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice-aside { grid-column: 2; grid-row: 1; align-self: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__choice-desc { grid-column: 1 / -1; margin-top: 2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__radio { order: -1; margin-left: 0; margin-right: 2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review-row { grid-template-columns: minmax(0, 1fr) auto; row-gap: 2px; padding-left: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review dt { grid-column: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__review dd { grid-column: 1; grid-row: 2; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__edit { grid-column: 2; grid-row: 1 / span 2; align-self: center; margin: 0; }
}
/* Touch screens: 16px fields (no zoom on iOS) and 40px targets */
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-sf__input input,
:where([data-look="standard"], [data-look="standard"] *).ui-sf__tags-input,
:where([data-look="standard"], [data-look="standard"] *).ui-sf__prefix { font-size: var(--tc-font-size-xl); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__input,
:where([data-look="standard"], [data-look="standard"] *).ui-sf__tags { min-height: 44px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__input input { height: 42px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__chip { height: 32px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__chip-x { width: 30px; height: 30px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__btn { height: var(--tc-control-h-lg); }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__edit { height: 36px; padding: 0 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sf__step-btn { padding: 4px; margin: -4px 0; }
}
/* Narrow (phones): the compact line over the bars, cards as rows, stacked review rows */
@container (max-width: 420px) {
:where([data-look="clean"], [data-look="clean"] *).ui-sf__head { padding: 14px 16px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__compact { display: flex; margin-bottom: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step-btn { row-gap: 0; padding-bottom: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__mark,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__pane { padding: 16px 16px 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__foot { padding: 0 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choices { grid-template-columns: minmax(0, 1fr); grid-auto-flow: row; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice { grid-template-columns: minmax(0, 1fr) auto; column-gap: 10px; padding: 10px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice-top { grid-column: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice-aside { grid-column: 2; grid-row: 1; align-self: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__choice-desc { grid-column: 1 / -1; margin-top: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__radio { order: -1; margin-left: 0; margin-right: 2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review-row { grid-template-columns: minmax(0, 1fr) auto; row-gap: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review dt { grid-column: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__review dd { grid-column: 1; grid-row: 2; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__edit { grid-column: 2; grid-row: 1 / span 2; align-self: center; margin: 0; }
}
/* Touch screens: 16px fields (no zoom on iOS) and taller targets */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-sf__input input,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags-input,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__prefix { font-size: var(--tc-font-size-xl); }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__input,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags,
:where([data-look="clean"], [data-look="clean"] *).ui-sf__input input { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip { height: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__chip-x { width: 30px; height: 30px; margin: 0 -4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__tags-input { height: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__btn { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__foot::before { height: 56px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__edit { height: 34px; padding: 0 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sf__step-btn { padding-top: 10px; padding-bottom: 8px; margin: -10px -4px -8px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-sf *, .ui-sf *::before, .ui-sf *::after { animation-duration: 1ms !important; animation-delay: 0ms !important; transition: none !important; }
}
`;

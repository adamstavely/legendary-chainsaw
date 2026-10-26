import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { createPortal, flushSync } from "react-dom";
import {
  TcStepperChoices,
  TcStepperField,
  TcStepperForm,
  TcStepperInput,
  TcStepperReview,
  TcStepperSuccess,
  TcStepperTags,
  type StepperChoice as ElementChoice,
  type StepperErrors,
  type StepperPane,
  type StepperReviewRow as ElementReviewRow,
} from "../stepper-form";
import { h, isNode, useControlled, useStaged } from "./internal";

/*
 * The Stepper Form and its building blocks with the React component's API. The form is <tc-stepper-form>; each
 * step's React content is rendered with a portal into its pane (so hooks and context work as before), and the
 * building blocks wrap <tc-stepper-field>, <tc-stepper-input> … which find their form and field in the DOM.
 */

export type StepErrors = StepperErrors;

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
  render: (ctx: StepContext<V>) => React.ReactNode;
  /** Returns messages by field name; nothing (or an empty object) means the step is fine */
  validate?: (values: V) => StepErrors | null | undefined;
};

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** A ref for us and the one the app passed */
function useMergedRef<T>(own: React.MutableRefObject<T | null>, theirs: React.Ref<T> | undefined) {
  return React.useCallback(
    (node: T | null) => {
      own.current = node;
      if (typeof theirs === "function") theirs(node);
      else if (theirs) (theirs as React.MutableRefObject<T | null>).current = node;
    },
    [own, theirs],
  );
}

/* ---------- The form ---------- */

const RawStepperForm = createComponent({
  tagName: "tc-stepper-form",
  elementClass: TcStepperForm,
  react: React,
  events: {
    onTcValuesChange: "tc-values-change" as EventName<CustomEvent<{ values: Record<string, unknown> }>>,
    onTcStepChange: "tc-step-change" as EventName<CustomEvent<{ step: number }>>,
    onTcPanesChange: "tc-panes-change" as EventName<CustomEvent<{ panes: StepperPane[] }>>,
  },
});
type RawStepperFormProps = React.ComponentProps<typeof RawStepperForm>;

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
  success?: (values: V, reset: () => void) => React.ReactNode;
  ref?: React.Ref<TcStepperForm>;
};

export type StepperFormProps<V extends Record<string, unknown>> = Omit<RawStepperFormProps, keyof StepperFormOwnProps<V> | "onTcValuesChange" | "onTcStepChange" | "onTcPanesChange"> &
  StepperFormOwnProps<V>;

const NO_VALUES = {};

export function StepperForm<V extends Record<string, unknown>>({
  steps,
  values,
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
  ref,
  ...props
}: StepperFormProps<V>) {
  const el = React.useRef<TcStepperForm | null>(null);
  const setRef = useMergedRef(el, ref);
  const startValues = (defaultValues ?? initialValues ?? NO_VALUES) as V;
  const startStep = defaultStep ?? initialStep ?? 0;
  // The values: the prop when controlled, else kept here too (from the element's change events) – so a step's
  // controlled inputs re-render within the event that changed them
  const [ownValues, setOwnValues] = React.useState<V>(startValues);
  const controlled = values !== undefined;
  const shown = controlled ? values : ownValues;
  const s = useControlled(step, startStep, onStepChange);
  const ownStep = React.useRef(startStep);
  // The panes the element shows: each step's React content goes into its body with a portal
  const [panes, setPanes] = React.useState<StepperPane[]>([]);
  const elementSteps = React.useMemo(() => steps.map(({ render: _render, ...rest }) => rest), [steps]);

  const ctxFor = (pane: StepperPane): StepContext<V> => ({
    values: shown,
    setValues: (patch) => el.current?.setValues(patch as Partial<Record<string, unknown>>),
    errors: pane.current ? el.current?.errorsShown ?? {} : {},
    goTo: (id) => el.current?.goTo(id),
    next: () => el.current?.next(),
  });

  return h(
    React.Fragment,
    null,
    h(RawStepperForm, {
      ...props,
      ref: setRef,
      steps: elementSteps as RawStepperFormProps["steps"],
      values: shown,
      step: s.controlled ? s.value : ownStep.current,
      onComplete: onComplete as RawStepperFormProps["onComplete"],
      submitLabel,
      submittingLabel,
      success: success ? null : undefined,
      onTcValuesChange: (e: CustomEvent<{ values: Record<string, unknown> }>) => {
        const next = e.detail.values as V;
        if (controlled) e.preventDefault();
        else setOwnValues(next);
        onValuesChange?.(next);
      },
      onTcStepChange: (e: CustomEvent<{ step: number }>) => {
        s.handler(e.detail.step, e);
        if (!s.controlled) ownStep.current = e.detail.step;
      },
      onTcPanesChange: (e: CustomEvent<{ panes: StepperPane[] }>) => flushSync(() => setPanes(e.detail.panes)),
    }),
    panes.map((pane) => {
      if (pane.index < steps.length) return createPortal(steps[pane.index].render(ctxFor(pane)), pane.element, `p${pane.index}`);
      return success ? createPortal(success(shown, () => el.current?.reset()), pane.element, "success") : null;
    }),
  );
}

/* ---------- Building blocks ---------- */

const RawField = createComponent({ tagName: "tc-stepper-field", elementClass: TcStepperField, react: React });

export type StepperFieldProps = {
  /** Matches the key in the step's validate result */
  name: string;
  label: string;
  hint?: React.ReactNode;
  optional?: boolean;
  children: React.ReactNode;
};

/** A label, the control and an inline message that folds in – the control shakes when Continue finds a problem */
export function StepperField({ name, label, hint, optional = false, children }: StepperFieldProps) {
  const node = isNode(hint) ? hint : null;
  const { stage, els } = useStaged(node ? [["hint", node]] : []);
  const hintValue = node ? els.hint : hint == null || hint === false ? undefined : String(hint);
  return h(React.Fragment, null, stage, h(RawField, { name, label, hint: hintValue, optional }, h("div", { className: "ui-sf__control" }, children)));
}

const RawInput = createComponent({ tagName: "tc-stepper-input", elementClass: TcStepperInput, react: React });

export type StepperInputProps = Omit<React.ComponentPropsWithoutRef<"input">, "prefix"> & {
  /** Fixed text before the value, e.g. "acme.com/" */
  prefix?: string;
  /** Goes to the wrapper (which draws the field), not the <input> */
  className?: string;
  ref?: React.Ref<HTMLInputElement>;
};

/**
 * A text field wired to its StepperField – label, message and aria come from there. Every other prop (name,
 * required, disabled, autoComplete, ref …) reaches the <input>; autoComplete is left to you and the browser.
 */
export function StepperInput({ prefix, className, id, "aria-describedby": describedBy, "aria-invalid": ariaInvalid, ...rest }: StepperInputProps) {
  return h(
    RawInput,
    {
      className: cx("ui-sf__input", className),
      prefixText: prefix ?? "",
      describedby: describedBy ?? "",
      controlId: id ?? "",
      controlInvalid: ariaInvalid === true || ariaInvalid === "true",
    },
    h("input", { spellCheck: false, ...rest }),
  );
}

const RawTags = createComponent({
  tagName: "tc-stepper-tags",
  elementClass: TcStepperTags,
  react: React,
  events: { onTcValueChange: "tc-value-change" as EventName<CustomEvent<{ value: string[] }>> },
});

export type StepperTagsProps = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Returns a message when an entry can't be added */
  validate?: (entry: string, list: string[]) => string | null;
  /** Largest number of entries */
  max?: number;
  /** Submits the entries with a native form, comma-separated */
  name?: string;
  disabled?: boolean;
  /** Marks the field as required for assistive tech – checking it is up to the step's validate */
  required?: boolean;
  /** The input's autocomplete – "off" by default, since the entries are usually other people's addresses */
  autoComplete?: string;
};

/** Entries as chips – add with Enter, comma or by pasting a list, remove with × or Backspace. Defaults to email checks */
export function StepperTags({ value, onChange, placeholder, validate, max, name, disabled = false, required = false, autoComplete = "off" }: StepperTagsProps) {
  return h(RawTags, {
    value,
    max,
    name: name ?? "",
    disabled,
    required,
    autocomplete: autoComplete,
    ...(placeholder !== undefined && { placeholder }),
    ...(validate && { validate }),
    onTcValueChange: (e: CustomEvent<{ value: string[] }>) => {
      e.preventDefault();
      onChange(e.detail.value);
    },
  });
}

/** A selectable card; aside and description may be React nodes */
export type StepperChoice = Omit<ElementChoice, "aside" | "description"> & { aside?: React.ReactNode; description?: React.ReactNode };

const RawChoices = createComponent({
  tagName: "tc-stepper-choices",
  elementClass: TcStepperChoices,
  react: React,
  events: { onTcValueChange: "tc-value-change" as EventName<CustomEvent<{ value: string }>> },
});

export type StepperChoicesProps = {
  value: string;
  onChange: (value: string) => void;
  options: StepperChoice[];
  /** Name of the group for screen readers */
  label: string;
  /** Submits the chosen value with a native form */
  name?: string;
  disabled?: boolean;
  /** Marks the group as required for assistive tech – checking it is up to the step's validate */
  required?: boolean;
};

const text = (v: React.ReactNode) => (typeof v === "string" || typeof v === "number" ? String(v) : undefined);

/** Selectable cards – a ring glides to the chosen one. Arrow keys move, Enter picks and continues */
export function StepperChoices({ value, onChange, options, label, name, disabled = false, required = false }: StepperChoicesProps) {
  const nodes: [string, React.ReactNode][] = [];
  options.forEach((o) => {
    if (isNode(o.aside)) nodes.push([`aside:${o.value}`, o.aside]);
    if (isNode(o.description)) nodes.push([`desc:${o.value}`, o.description]);
  });
  const { stage, els } = useStaged(nodes);
  const opts = React.useMemo(
    () =>
      options.map((o) => ({
        ...o,
        aside: isNode(o.aside) ? els[`aside:${o.value}`] : text(o.aside),
        description: isNode(o.description) ? els[`desc:${o.value}`] : text(o.description),
      })) as ElementChoice[],
    [options, els],
  );
  return h(
    React.Fragment,
    null,
    stage,
    h(RawChoices, {
      value,
      options: opts,
      label,
      name: name ?? "",
      disabled,
      required,
      onTcValueChange: (e: CustomEvent<{ value: string }>) => {
        e.preventDefault();
        onChange(e.detail.value);
      },
    }),
  );
}

/** A row of the summary; its value may be a React node */
export type StepperReviewRow = Omit<ElementReviewRow, "value"> & { value: React.ReactNode };

const RawReview = createComponent({
  tagName: "tc-stepper-review",
  elementClass: TcStepperReview,
  react: React,
  events: { onTcEdit: "tc-edit" as EventName<CustomEvent<{ step: string }>> },
});

/** A summary of what was entered, each row with an Edit link back to its step */
export function StepperReview({ rows, onEdit }: { rows: StepperReviewRow[]; onEdit?: (step: string) => void }) {
  const { stage, els } = useStaged(rows.filter((r) => isNode(r.value)).map((r) => [r.label, r.value]));
  const items = React.useMemo(() => rows.map((r) => ({ ...r, value: isNode(r.value) ? els[r.label] ?? "" : text(r.value) ?? "" })) as ElementReviewRow[], [rows, els]);
  return h(React.Fragment, null, stage, h(RawReview, { rows: items, editable: !!onEdit, onTcEdit: (e: CustomEvent<{ step: string }>) => onEdit?.(e.detail.step) }));
}

const RawSuccess = createComponent({ tagName: "tc-stepper-success", elementClass: TcStepperSuccess, react: React });

/** The success state: a check pops in, a heading and a short line, plus optional actions */
export function StepperSuccess({ title, description, children }: { title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode }) {
  const node = isNode(description) ? description : null;
  const { stage, els } = useStaged(node ? [["desc", node]] : []);
  return h(
    React.Fragment,
    null,
    stage,
    h(
      RawSuccess,
      { heading: text(title) ?? "", description: node ? els.desc : text(description) },
      children ? h("div", { className: "ui-sf__success-actions" }, children) : null,
    ),
  );
}

"use client";

/*
 * Billing Schedule – build one phase of a billing plan, in a single self-contained file.
 * Pick a start date and a duration, add products from a catalog, set how often each repeats, its price
 * and whether it's billed in advance or in arrears, then add a discount or a minimum commitment.
 * The phase summary and the totals update as you go; rows glide in and out.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: billing-schedule.tsx is Standard,
 * billing-schedule-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows and quiet gray
 * type. The title and the phase summary head the card, the lines sit in a table with hairline rows, the add
 * buttons follow right under it and the totals close the card as a last row under a hairline.
 */
// Generated from src/components/billing-schedule.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-bs";

export type Repeat = "once" | "monthly" | "quarterly" | "yearly";
export type Timing = "advance" | "arrears";

export type ScheduleLine =
  | { id: string; kind: "product"; name: string; repeat: Repeat; price: number; timing: Timing }
  | { id: string; kind: "discount"; name: string; percent: number }
  | { id: string; kind: "minimum"; name: string; amount: number };

export type CatalogItem = { name: string; repeat: Repeat; price: number };

export type Schedule = { phase: string; start: string; duration: string; lines: ScheduleLine[] };

/** Duration ids: "milestone", "1m", "3m", "6m", "12m" */
export type Duration = "milestone" | "1m" | "3m" | "6m" | "12m";

type OwnProps = {
  /** Visual style. Defaults to the file's look: Standard in billing-schedule.tsx, Clean in billing-schedule-clean.tsx */
  look?: Look;
  title?: string;
  /** Phase name (controlled). Leave undefined and use `defaultPhase` to let the component keep it */
  phase?: string;
  /** Starting phase name when `phase` isn't controlled */
  defaultPhase?: string;
  onPhaseChange?: (phase: string) => void;
  /** Currency symbol shown with prices */
  currency?: string;
  /** Products offered under "Add product" */
  catalog?: CatalogItem[];
  /** Schedule lines (controlled) */
  lines?: ScheduleLine[];
  /** Starting lines when `lines` isn't controlled */
  defaultLines?: ScheduleLine[];
  onLinesChange?: (lines: ScheduleLine[]) => void;
  /** Start date, yyyy-mm-dd (controlled) */
  start?: string;
  /** Starting date when `start` isn't controlled, yyyy-mm-dd */
  defaultStart?: string;
  onStartChange?: (start: string) => void;
  /** Phase length (controlled) */
  duration?: Duration;
  /** Starting length when `duration` isn't controlled */
  defaultDuration?: Duration;
  onDurationChange?: (duration: Duration) => void;
  /** Called with the full schedule after every change the user makes (not on mount) */
  onChange?: (schedule: Schedule) => void;
  /** Form field name: a hidden input carries the schedule as JSON for native form submission */
  name?: string;
  /** Disables every field and button */
  disabled?: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type BillingScheduleProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

const DURATIONS: { id: Duration; label: string; months: number }[] = [
  { id: "milestone", label: "Milestone", months: 0 },
  { id: "1m", label: "1 month", months: 1 },
  { id: "3m", label: "3 months", months: 3 },
  { id: "6m", label: "6 months", months: 6 },
  { id: "12m", label: "12 months", months: 12 },
];

const REPEATS: { id: Repeat; label: string; perYear: number }[] = [
  { id: "once", label: "Once", perYear: 0 },
  { id: "monthly", label: "Monthly", perYear: 12 },
  { id: "quarterly", label: "Quarterly", perYear: 4 },
  { id: "yearly", label: "Yearly", perYear: 1 },
];

const defaultCatalog: CatalogItem[] = [
  { name: "Set-up fee", repeat: "once", price: 4999 },
  { name: "Platform licence", repeat: "monthly", price: 1200 },
  { name: "Premium support", repeat: "monthly", price: 350 },
  { name: "Extra seats (10)", repeat: "monthly", price: 240 },
  { name: "Onboarding workshop", repeat: "once", price: 1500 },
];

const defaultSeedLines: ScheduleLine[] = [{ id: "seed-1", kind: "product", name: "Set-up fee", repeat: "once", price: 4999, timing: "advance" }];

let uid = 0;
const nextId = () => `l${++uid}`;

// Formatters are built once – toLocaleString() and toLocaleDateString() build a new one on every call
const fmtMoney = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPercent = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmtDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Last day of a phase that starts on `iso` and runs `months` months; the day of month is clamped, so Jan 31 + 1 month ends Feb 27, not Mar 2 */
function phaseEnd(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const lastDay = new Date(y, m - 1 + months + 1, 0).getDate();
  return new Date(y, m - 1 + months, Math.min(d, lastDay) - 1, 12);
}

export function BillingSchedule({
  look,
  title = "Create a billing schedule",
  phase: phaseProp,
  defaultPhase = "Build-out phase",
  onPhaseChange,
  currency = "$",
  catalog = defaultCatalog,
  lines: linesProp,
  defaultLines = defaultSeedLines,
  onLinesChange,
  start: startProp,
  defaultStart = "2026-01-01",
  onStartChange,
  duration: durationProp,
  defaultDuration = "milestone",
  onDurationChange,
  onChange,
  name,
  disabled,
  className,
  ref,
  ...rest
}: BillingScheduleProps) {
  const [phase, setPhase] = useControllable(phaseProp, defaultPhase, onPhaseChange);
  const [start, setStart] = useControllable(startProp, defaultStart, onStartChange);
  const [duration, setDuration] = useControllable<Duration>(durationProp, defaultDuration, onDurationChange);
  const [lines, setLines] = useControllable<ScheduleLine[]>(linesProp, defaultLines, onLinesChange);
  const [menu, setMenu] = useState<null | "duration" | "product">(null);
  const rowsInner = useRef<HTMLDivElement>(null);
  const rowsOuter = useSmoothHeight(rowsInner);
  const durationId = useId();
  const root = useRef<HTMLDivElement | null>(null);
  const rootRef = useRootRef(root, ref);
  const addRef = useRef<HTMLButtonElement>(null);
  // Focus never falls to <body>: a control that goes away (a removed line, a button that got disabled) hands it to
  // "Add product"
  useFocusRescue(root, { fallback: () => addRef.current });
  // A line just added with a button: its field takes focus once it's there (the button itself gets disabled)
  const focusLine = useRef<string | null>(null);
  useLayoutEffect(() => {
    const id = focusLine.current;
    if (!id) return;
    const input = root.current?.querySelector<HTMLInputElement>(`[data-line="${CSS.escape(id)}"] .ui-bs__num input`);
    if (!input) return;
    focusLine.current = null;
    input.focus();
  });

  // onChange fires from the change handlers, never on mount, and a new callback identity is not a change
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const emit = (patch: Partial<Schedule>) => onChangeRef.current?.({ phase, start, duration, lines, ...patch });
  const changePhase = (v: string) => (setPhase(v), emit({ phase: v }));
  const changeStart = (v: string) => (setStart(v), emit({ start: v }));
  const changeDuration = (v: Duration) => {
    if (v === duration) return;
    setDuration(v);
    emit({ duration: v });
  };
  const changeLines = (next: ScheduleLine[]) => (setLines(next), emit({ lines: next }));

  const money = (n: number) => `${currency}${fmtMoney.format(n)}`;
  const fmtDate = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    return isNaN(d.getTime()) ? "–" : fmtDay.format(d);
  };
  const dur = DURATIONS.find((d) => d.id === duration) ?? DURATIONS[0];
  const end = (() => {
    if (!dur.months) return "Milestone";
    const d = phaseEnd(start, dur.months);
    return d && !isNaN(d.getTime()) ? fmtDay.format(d) : "–";
  })();

  const update = (id: string, patch: Partial<ScheduleLine>) => {
    const line = lines.find((l) => l.id === id);
    // A blur without an edit commits the same value – not a change
    if (!line || Object.entries(patch).every(([k, v]) => line[k as keyof ScheduleLine] === v)) return;
    changeLines(lines.map((l) => (l === line ? ({ ...l, ...patch } as ScheduleLine) : l)));
  };
  const remove = (id: string) => {
    // Focus goes to the next line's Remove, else the one before, else "Add product"
    const rows = [...(root.current?.querySelectorAll<HTMLElement>("[data-line]") ?? [])];
    const at = rows.findIndex((r) => r.dataset.line === id);
    const removeOf = (row?: HTMLElement) => row?.querySelector<HTMLElement>(".ui-bs__remove");
    rescueFocus(rows[at], [removeOf(rows[at + 1]), removeOf(rows[at - 1]), addRef.current]);
    changeLines(lines.filter((l) => l.id !== id));
  };
  const addLine = (line: ScheduleLine) => {
    focusLine.current = line.id;
    changeLines([...lines, line]);
  };
  const addProduct = (c: CatalogItem) => {
    changeLines([...lines.filter((l) => l.kind === "product"), { id: nextId(), kind: "product", ...c, timing: "advance" }, ...lines.filter((l) => l.kind !== "product")]);
    setMenu(null);
  };
  const hasDiscount = lines.some((l) => l.kind === "discount");
  const hasMinimum = lines.some((l) => l.kind === "minimum");

  // Totals: what the first invoice holds, and what the phase is worth over its length
  const products = lines.filter((l): l is Extract<ScheduleLine, { kind: "product" }> => l.kind === "product");
  const discount = lines.find((l): l is Extract<ScheduleLine, { kind: "discount" }> => l.kind === "discount");
  const minimum = lines.find((l): l is Extract<ScheduleLine, { kind: "minimum" }> => l.kind === "minimum");
  const off = 1 - (discount?.percent ?? 0) / 100;
  const firstInvoice = products.filter((p) => p.timing === "advance").reduce((s, p) => s + p.price, 0) * off;
  // Recurring products are worth their price per year × the share of the year the phase covers, so a yearly
  // product in a 3-month phase counts a quarter of its price; a milestone counts one billing period of each
  const phaseTotal =
    products.reduce((s, p) => {
      const per = REPEATS.find((r) => r.id === p.repeat)!.perYear;
      if (!per) return s + p.price;
      return s + (dur.months ? Math.round(((p.price * per * dur.months) / 12) * 100) / 100 : p.price);
    }, 0) * off;
  const total = Math.max(phaseTotal, minimum?.amount ?? 0);

  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";

  const title_ = <p className="ui-bs__title">{title}</p>;

  // Phase summary – the name is editable, dates follow the fields below
  const summary = (
    <div className="ui-bs__summary">
      {/* The name is a field: a pencil says so, and hover / focus draw the field's edge */}
      <span className="ui-bs__phase-field">
        <input className="ui-bs__phase" value={phase} onChange={(e) => changePhase(e.target.value)} aria-label="Phase name" disabled={disabled} size={Math.max(6, phase.length)} />
        <Icon d={PENCIL} />
      </span>
      {clean && (
        <span className="ui-bs__dot" aria-hidden="true">
          ·
        </span>
      )}
      <span className="ui-bs__date">{fmtDate(start)}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14m0 0-5-5m5 5-5 5" />
      </svg>
      <span key={end} className="ui-bs__end">
        {end}
      </span>
    </div>
  );

  const fields = (
    <div className="ui-bs__fields">
      <label className="ui-bs__field">
        <span className="ui-bs__label">Start date</span>
        <span className="ui-bs__input">
          <input type="date" value={start} disabled={disabled} onChange={(e) => changeStart(e.target.value)} />
          <Icon d="M7 4v3M17 4v3M4.5 9.5h15M6 6h12a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 6 6Z" />
        </span>
      </label>
      <div className="ui-bs__field">
        <span className="ui-bs__label" id={durationId}>
          Duration
        </span>
        <Dropdown
          open={menu === "duration"}
          onOpenChange={(o) => setMenu(o ? "duration" : null)}
          label={dur.label}
          labelledBy={durationId}
          disabled={disabled}
        >
          {DURATIONS.map((d) => (
            <button key={d.id} type="button" role="option" tabIndex={-1} aria-selected={d.id === duration} onClick={() => (changeDuration(d.id), setMenu(null))}>
              {d.label}
              {d.id === duration && <Icon d="m6 12.5 4 4 8-9" />}
            </button>
          ))}
        </Dropdown>
      </div>
    </div>
  );

  const table = (
    <div className="ui-bs__table" role="table" aria-label="Billing lines">
      <div className="ui-bs__row ui-bs__row--head" role="row">
        <span role="columnheader">Name</span>
        <span role="columnheader">Repeats</span>
        <span role="columnheader" className="ui-bs__right">
          Price
        </span>
      </div>
      <div className="ui-bs__rows-outer" ref={rowsOuter}>
        <div ref={rowsInner}>
          {lines.length === 0 && <p className="ui-bs__empty">No products yet – add one below.</p>}
          {lines.map((l) => (
            <LineRow key={l.id} line={l} currency={currency} disabled={disabled} onUpdate={(patch) => update(l.id, patch)} onRemove={() => remove(l.id)} />
          ))}
        </div>
      </div>
    </div>
  );

  const actions = (
    <div className="ui-bs__actions">
      <Dropdown
        open={menu === "product"}
        onOpenChange={(o) => setMenu(o ? "product" : null)}
        label={
          <>
            <Icon d="M12 5.5v13M5.5 12h13" />
            Add product
          </>
        }
        button
        up
        menu
        triggerRef={addRef}
        disabled={disabled}
      >
        {catalog.map((c) => (
          <button key={c.name} type="button" role="menuitem" tabIndex={-1} onClick={() => addProduct(c)}>
            <span>
              {c.name}
              <small>
                {money(c.price)} · {REPEATS.find((r) => r.id === c.repeat)!.label.toLowerCase()}
              </small>
            </span>
          </button>
        ))}
      </Dropdown>
      <span className="ui-bs__spacer" />
      <button
        type="button"
        className="ui-bs__btn"
        disabled={disabled || hasDiscount}
        onClick={() => addLine({ id: nextId(), kind: "discount", name: "Discount", percent: 10 })}
      >
        <Icon d={DISCOUNT} />
        Add discount
      </button>
      <button
        type="button"
        className="ui-bs__btn"
        disabled={disabled || hasMinimum}
        onClick={() => addLine({ id: nextId(), kind: "minimum", name: "Minimum commitment", amount: 10000 })}
      >
        <Icon d={MINIMUM} />
        Add minimum
      </button>
    </div>
  );

  const minimumApplies = Boolean(minimum && total === minimum.amount && phaseTotal < minimum.amount);
  const phaseLabel = dur.months ? `Phase total (${dur.label})` : "Phase total";

  return (
    <div {...rest} ref={rootRef} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook} aria-disabled={disabled || undefined}>
      <style href="ui-billing-schedule" precedence="default">
        {css}
      </style>
      {name !== undefined && <input type="hidden" name={name} disabled={disabled} value={JSON.stringify({ phase, start, duration, lines })} />}

      {clean ? (
        // Clean: no tray – the title and summary head the card, the rest follows in it
        <>
          <div className="ui-bs__head">
            {title_}
            {summary}
          </div>
          {fields}
          {table}
          {actions}
          {/* Totals: the last row of the card */}
          <Totals clean first={money(firstInvoice)} total={money(total)} label={phaseLabel} minimumApplies={minimumApplies} />
        </>
      ) : (
        // Standard: the title on the tray, a card for the editing, the totals on the tray below it
        <>
          {title_}
          <div className="ui-bs__card">
            {summary}
            {fields}
            {table}
            {actions}
          </div>
          <Totals first={money(firstInvoice)} total={money(total)} label={phaseLabel} minimumApplies={minimumApplies} />
        </>
      )}
    </div>
  );
}

/* ---------- Pieces ---------- */

const REPEAT = "M17 3.5 19.5 6 17 8.5M19.5 6H9a5 5 0 0 0-5 5M7 20.5 4.5 18 7 15.5M4.5 18H15a5 5 0 0 0 5-5";
const DISCOUNT = "M9 15 15 9M9.5 9.5h.01M14.5 14.5h.01M12 3l2.1 1.6 2.6-.2.9 2.5 2.3 1.2-.4 2.6L21 12.6l-1.5 2.1.4 2.6-2.3 1.2-.9 2.5-2.6-.2L12 21.4l-2.1-1.6-2.6.2-.9-2.5L4.1 16.3l.4-2.6L3 12l1.5-2.1-.4-2.6 2.3-1.2.9-2.5 2.6.2Z";
const MINIMUM = "M5 19.5h14M7 15.5h10M9 11.5h6M10 7.5h4M12 4v1";
const PENCIL = "M14.5 5.5l4 4M4.5 19.5l1-4.2L15.8 5a1.4 1.4 0 0 1 2 0l1.2 1.2a1.4 1.4 0 0 1 0 2L8.7 18.5l-4.2 1Z";

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** One line of the schedule: a product (repeats, price, billed in advance or arrears), a discount or a minimum */
function LineRow({
  line: l,
  currency,
  disabled,
  onUpdate,
  onRemove,
}: {
  line: ScheduleLine;
  currency: string;
  disabled?: boolean;
  onUpdate: (patch: Partial<ScheduleLine>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="ui-bs__row" role="row" data-kind={l.kind} data-line={l.id}>
      <span role="cell" className="ui-bs__name">
        {l.kind !== "product" && (
          <span className="ui-bs__tag" aria-hidden="true">
            <Icon d={l.kind === "discount" ? DISCOUNT : MINIMUM} />
          </span>
        )}
        <span className="ui-bs__name-text">{l.name}</span>
      </span>
      <span role="cell">
        {l.kind === "product" ? (
          <label className="ui-bs__repeat">
            <Icon d={REPEAT} />
            <select value={l.repeat} disabled={disabled} onChange={(e) => onUpdate({ repeat: e.target.value as Repeat })} aria-label={`${l.name} repeats`}>
              {REPEATS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="ui-bs__muted">{l.kind === "discount" ? "Whole phase" : "Per phase"}</span>
        )}
      </span>
      <span role="cell" className="ui-bs__price">
        {/* Amount on top, billing timing quietly underneath – the column never runs into Repeats */}
        <span className="ui-bs__price-main">
          {l.kind === "product" && (
            <>
              <NumberField value={l.price} prefix={currency} onChange={(v) => onUpdate({ price: v })} label={`${l.name} price`} disabled={disabled} />
              <span className="ui-bs__muted">/ {l.repeat === "once" ? "once" : REPEATS.find((r) => r.id === l.repeat)!.label.toLowerCase().replace("ly", "")}</span>
            </>
          )}
          {l.kind === "discount" && (
            <>
              <NumberField value={l.percent} suffix="%" max={100} onChange={(v) => onUpdate({ percent: v })} label="Discount percent" disabled={disabled} />
              <span className="ui-bs__muted">off</span>
            </>
          )}
          {l.kind === "minimum" && (
            <>
              <NumberField value={l.amount} prefix={currency} onChange={(v) => onUpdate({ amount: v })} label="Minimum commitment" disabled={disabled} />
              <span className="ui-bs__muted">minimum</span>
            </>
          )}
          <button type="button" className="ui-bs__remove" aria-label={`Remove ${l.name}`} disabled={disabled} onClick={onRemove}>
            <Icon d="M7 7l10 10M17 7 7 17" />
          </button>
        </span>
        {l.kind === "product" && (
          <select className="ui-bs__timing" value={l.timing} disabled={disabled} onChange={(e) => onUpdate({ timing: e.target.value as Timing })} aria-label={`${l.name} billed`}>
            <option value="advance">Billed in advance</option>
            <option value="arrears">Billed in arrears</option>
          </select>
        )}
      </span>
    </div>
  );
}

/** First invoice and the phase total – Clean: the card's last row, Standard: the tray under the card */
function Totals({ clean, first, total, label, minimumApplies }: { clean?: boolean; first: string; total: string; label: string; minimumApplies: boolean }) {
  return clean ? (
    <div className="ui-bs__totals" role="status">
      <span className="ui-bs__total">
        <span className="ui-bs__total-label">First invoice</span>
        <b>{first}</b>
      </span>
      <span className="ui-bs__total ui-bs__total--phase">
        {minimumApplies && <em>Minimum applies</em>}
        <span className="ui-bs__total-label">{label}</span>
        <b>{total}</b>
      </span>
    </div>
  ) : (
    <div className="ui-bs__totals" role="status">
      <span>
        First invoice <b>{first}</b>
      </span>
      <span>
        {label} <b>{total}</b>
        {minimumApplies && <em>minimum applies</em>}
      </span>
    </div>
  );
}

/** Number input that shows a formatted value and edits the raw one. What it can't take is said, not dropped silently */
function NumberField({
  value,
  onChange,
  prefix,
  suffix,
  max,
  label,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  max?: number;
  label: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  // An input error (WCAG 3.3.1): letters typed, nothing to read, or a value over the maximum that was capped
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const shown = draft ?? (suffix ? fmtPercent : fmtMoney).format(value);
  return (
    <span className="ui-bs__num" data-invalid={error ? "" : undefined}>
      {prefix}
      <input
        value={shown}
        inputMode="decimal"
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        size={Math.max(2, shown.length)}
        onFocus={() => setDraft(String(value))}
        onChange={(e) => {
          const raw = e.target.value;
          // Thousands separators are fine; anything else is kept (so nothing vanishes) and flagged
          setDraft(raw);
          setError(/[^\d.,\s]/.test(raw) ? "Numbers only" : null);
        }}
        onBlur={() => {
          const parsed = parseFloat((draft ?? "").replace(/[,\s]/g, ""));
          if (draft !== null && (Number.isNaN(parsed) || /[^\d.,\s]/.test(draft))) {
            // Nothing usable: the last value stays, and the field says why
            setError(draft.trim() ? "Not a number – kept the previous value" : "Enter a number – kept the previous value");
            setDraft(null);
            return;
          }
          const v = Math.max(0, Math.min(max ?? Infinity, parsed));
          setError(max !== undefined && parsed > max ? `Capped at ${max}${suffix ?? ""}` : null);
          onChange(v);
          setDraft(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && (e.target as HTMLInputElement).blur()}
      />
      {suffix}
      {error && (
        <span className="ui-bs__num-error" id={errorId}>
          {error}
        </span>
      )}
    </span>
  );
}

/**
 * A button with a popup: a listbox of options (Duration) or a menu of actions (Add product). Either way focus moves
 * into it, arrow keys / Home / End move, Enter or Space picks, Escape and picking return focus to the button, and
 * Tab closes it (APG listbox / menu button)
 */
function Dropdown({
  open,
  onOpenChange,
  label,
  labelledBy,
  button,
  up,
  menu,
  triggerRef,
  disabled,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: ReactNode;
  /** The visible label's id – the button's name is that label plus its value */
  labelledBy?: string;
  button?: boolean;
  up?: boolean;
  /** Actions (role=menu) rather than options to choose from (role=listbox) */
  menu?: boolean;
  triggerRef?: { current: HTMLButtonElement | null };
  disabled?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ownTrigger = useRef<HTMLButtonElement | null>(null);
  const valueId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const openAt = useRef<"current" | "first" | "last">("current");
  const items = () => [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"], [role="menuitem"]') ?? [])];
  const close = (refocus: boolean) => {
    onOpenChange(false);
    if (refocus) ownTrigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && onOpenChange(false);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onOpenChange(false);
      if (ref.current?.contains(document.activeElement)) ownTrigger.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);
  // Focus moves in when it opens: onto the chosen option, or the first / last
  useLayoutEffect(() => {
    if (!open) return;
    const all = items();
    const at = openAt.current;
    (at === "first" ? all[0] : at === "last" ? all.at(-1) : (all.find((el) => el.getAttribute("aria-selected") === "true") ?? all[0]))?.focus();
  }, [open]);
  const onListKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const all = items();
    const i = all.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      all[(n + all.length) % all.length]?.focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(all.length - 1);
    else if (e.key === "Tab") onOpenChange(false);
  };
  return (
    <div className="ui-bs__dd" ref={ref}>
      <button
        ref={(el) => {
          ownTrigger.current = el;
          if (triggerRef) triggerRef.current = el;
        }}
        type="button"
        className={button ? "ui-bs__btn" : "ui-bs__select"}
        aria-haspopup={menu ? "menu" : "listbox"}
        aria-expanded={open}
        aria-labelledby={labelledBy ? `${labelledBy} ${valueId}` : undefined}
        disabled={disabled}
        onClick={() => {
          openAt.current = "current";
          onOpenChange(!open);
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
          e.preventDefault();
          openAt.current = e.key === "ArrowUp" ? "last" : "first";
          onOpenChange(true);
        }}
      >
        <span className="ui-bs__select-label" id={valueId}>
          {label}
        </span>
        {!button && <Icon d="m7 10 5 5 5-5" />}
      </button>
      {open && !disabled && (
        <div
          ref={listRef}
          className="ui-bs__menu"
          role={menu ? "menu" : "listbox"}
          aria-labelledby={labelledBy ?? valueId}
          data-up={up ? "" : undefined}
          onKeyDown={onListKey}
          // Picking an item (its own handler runs first) returns focus to the button
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('[role="option"], [role="menuitem"]')) close(true);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

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

/** The outer box follows the inner box's height, with a transition after the first frame */
function useSmoothHeight(inner: RefObject<HTMLElement | null>) {
  const outer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const sync = () => {
      o.style.height = `${i.offsetHeight}px`;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(i);
    const frame = requestAnimationFrame(() => o.setAttribute("data-smooth", ""));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [inner]);
  return outer;
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-bs:where([data-look="standard"]),
.ui-bs__portal:where([data-look="standard"]) {
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
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
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #232326);
  --_tc-field-font-size: 13.5px;
  --_tc-field-h: 36px;
  --_tc-field-px: 12px;
  --_tc-field-radius: 10px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent);
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-invalid: inset 0 0 0 1px light-dark(#e5484d, #ff6369);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
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
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-overlay: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-surface-overlay: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
  --_tc-z-dropdown: 30;
}
.ui-bs:where([data-look="clean"]),
.ui-bs__portal:where([data-look="clean"]) {
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
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
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #252527);
  --_tc-field-font-size: 13px;
  --_tc-field-h: 32px;
  --_tc-field-px: 10px;
  --_tc-field-radius: 8px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#0060e2, #5b9aff), 0 0 0 3px color-mix(in srgb, light-dark(#0060e2, #5b9aff) 24%, transparent);
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.52));
  --_tc-field-shadow-invalid: inset 0 0 0 1px light-dark(#e5484d, #ff6369);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
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
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-overlay: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-surface-overlay: light-dark(#ffffff, #252527);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
  --_tc-z-dropdown: 30;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-bs {
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 560px;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-bs */
:where([data-look="clean"], [data-look="clean"] *).ui-bs {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 560px;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-bs *, .ui-bs *::before, .ui-bs *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs button,
:where([data-look="standard"], [data-look="standard"] *).ui-bs select,
:where([data-look="standard"], [data-look="standard"] *).ui-bs input { font: inherit; color: inherit; margin: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs button { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-bs :focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs svg { width: 16px; height: 16px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__title { margin: 0; padding: 10px 10px 12px; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); letter-spacing: -0.01em; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__card {
  padding: 12px;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
}
/* Summary */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__summary { display: flex; align-items: center; gap: 8px; padding: 2px 2px 12px; font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__phase {
  min-width: 0;
  padding: 2px 4px;
  margin-left: -4px !important;
  border: 0;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: none;
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-text-primary, var(--_tc-text-primary)) !important;
  outline: none;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-bs__phase:hover { background: var(--tc-field-bg, var(--_tc-field-bg)); box-shadow: var(--tc-field-shadow-hover, var(--_tc-field-shadow-hover)); }
.ui-bs__phase:focus { background: var(--tc-field-bg, var(--_tc-field-bg)); box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
.ui-bs__phase-field { display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
.ui-bs__phase-field > svg { width: 13px !important; height: 13px !important; color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__summary svg { width: 15px; height: 15px; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where(.ui-bs[data-look="clean"]) button,
:where(.ui-bs[data-look="clean"]) select,
:where(.ui-bs[data-look="clean"]) input { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; }
:where(.ui-bs[data-look="clean"]) button { cursor: pointer; -webkit-tap-highlight-color: transparent; }
/* 16px icons with thin ~1.1px lines */
:where([data-look="clean"], [data-look="clean"] *).ui-bs svg { display: block; width: 16px; height: 16px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }
/* Head: title and the phase summary */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__head { display: grid; gap: 2px; padding: 14px 14px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__title { margin: 0; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__summary { display: flex; align-items: center; gap: 6px; min-width: 0; color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__phase {
  min-width: 0;
  max-width: 100%;
  margin-left: -4px;
  padding: 0 4px;
  border-radius: 5px;
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  outline: none;
  text-overflow: ellipsis;
  /* Hugs its text where supported – the size attribute is the fallback */
  field-sizing: content;
  transition: background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__dot { color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__summary svg { width: 14px; height: 14px; color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
.ui-bs__end { animation: ui-bs-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
/* Fields */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); background: var(--tc-surface-sunken, var(--_tc-surface-sunken)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__field { display: grid; gap: 7px; min-width: 0; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__input,
:where([data-look="standard"], [data-look="standard"] *).ui-bs__select {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: var(--tc-field-h, var(--_tc-field-h));
  padding: 0 var(--tc-field-px, var(--_tc-field-px));
  border: 0;
  border-radius: var(--tc-field-radius, var(--_tc-field-radius));
  background: var(--tc-field-bg, var(--_tc-field-bg));
  box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow));
  font-size: var(--tc-field-font-size, var(--_tc-field-font-size));
  color: var(--tc-text-primary, var(--_tc-text-primary)) !important;
  text-align: left;
}
:where([data-look="standard"], [data-look="standard"] *).ui-bs__input input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: none;
  outline: none;
}
/* Fields */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 14px 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__field { display: grid; gap: 6px; min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__label { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__input,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__select {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: var(--tc-field-h, var(--_tc-field-h));
  padding: 0 calc(var(--tc-field-px, var(--_tc-field-px)) - 2px) 0 var(--tc-field-px, var(--_tc-field-px));
  border-radius: var(--tc-field-radius, var(--_tc-field-radius));
  background: var(--tc-field-bg, var(--_tc-field-bg));
  box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-align: left;
  transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-bs__select:hover,
.ui-bs__input:hover { box-shadow: var(--tc-field-shadow-hover, var(--_tc-field-shadow-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__input input {
  flex: 1;
  min-width: 0;
  height: 100%;
  outline: none;
  font-variant-numeric: tabular-nums;
}
/* The native picker opens from the whole field; its own icon is hidden behind ours */
.ui-bs__input input::-webkit-calendar-picker-indicator { position: absolute; inset: 0; width: auto; height: auto; opacity: 0; cursor: pointer; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__input svg { color: var(--tc-text-secondary, var(--_tc-text-secondary)); pointer-events: none; }
.ui-bs__input:focus-within { box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__select svg { color: var(--tc-text-muted, var(--_tc-text-muted)); transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__input svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__select svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-bs__select[aria-expanded="true"] svg { transform: rotate(180deg); }
/* Dropdowns */
.ui-bs__dd { position: relative; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  display: grid;
  gap: 1px;
  min-width: 220px;
  padding: var(--tc-menu-padding, var(--_tc-menu-padding));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  animation: ui-bs-menu var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)) both;
  transform-origin: top;
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  display: grid;
  gap: 1px;
  min-width: 220px;
  padding: var(--tc-menu-padding, var(--_tc-menu-padding));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  animation: ui-bs-menu var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)) both;
  transform-origin: top;
}
.ui-bs__menu[data-up] { top: auto; bottom: calc(100% + 6px); right: auto; transform-origin: bottom left; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__menu button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: var(--tc-menu-item-h, var(--_tc-menu-item-h));
  padding: 6px var(--tc-menu-item-px, var(--_tc-menu-item-px));
  border: 0;
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  background: none;
  font-size: var(--tc-menu-item-font-size, var(--_tc-menu-item-font-size));
  text-align: left;
}
.ui-bs__menu button:hover { background: var(--tc-menu-item-hover, var(--_tc-menu-item-hover)); }
/* Menu rows: the ring sits inside the row */
.ui-bs__menu button:focus-visible { outline-offset: calc(var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) * -1); }
.ui-bs__menu button svg { color: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__menu small { display: block; margin-top: 1px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Table */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__table { margin-top: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__row {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr) 216px;
  align-items: center;
  gap: 14px;
  min-height: 52px;
  padding: 6px 4px 6px 6px;
  border-bottom: 1px solid var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  animation: ui-bs-row var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-bs__row--head { min-height: 40px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); animation: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__right { text-align: right; padding-right: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__menu button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: var(--tc-menu-item-h, var(--_tc-menu-item-h));
  padding: 4px var(--tc-menu-item-px, var(--_tc-menu-item-px));
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  font-size: var(--tc-menu-item-font-size, var(--_tc-menu-item-font-size));
  text-align: left;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate));
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__menu small { display: block; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Table: hairline rows from edge to edge */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__table { border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__row {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr) 216px;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 6px 10px 6px 14px;
  border-bottom: 0.5px solid var(--tc-border-default, var(--_tc-border-default));
  transition: background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-bs-row var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__rows-outer .ui-bs__row:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__row--head {
  min-height: 32px;
  padding-top: 8px;
  padding-bottom: 8px;
  font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  animation: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__right { text-align: right; padding-right: 36px; }
.ui-bs__rows-outer { overflow: hidden; }
.ui-bs__rows-outer[data-smooth] { transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__empty { margin: 0; padding: 16px 6px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__name { display: flex; align-items: center; gap: 8px; min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__empty { margin: 0; padding: 14px; border-bottom: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__name { display: flex; align-items: center; gap: 8px; min-width: 0; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-bs__name-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__tag { display: grid; place-items: center; width: 22px; height: 22px; flex: none; border-radius: 7px; background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__tag svg { width: 13px; height: 13px; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__muted { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__repeat { position: relative; display: inline-flex; align-items: center; gap: 6px; color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__repeat select,
:where([data-look="standard"], [data-look="standard"] *).ui-bs__timing {
  padding: 3px 4px;
  margin-left: -4px !important;
  border: 0;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: none;
  appearance: none;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-bs__repeat select:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-bs__timing:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
/* Under the amount, right-aligned with it (the remove button's slot stays free) */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__timing { min-height: 24px; margin: 0 28px 0 0 !important; padding: 1px 4px !important; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)) !important; text-align: right; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__tag { display: grid; place-items: center; width: 20px; height: 20px; flex: none; border-radius: 5px; background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__tag svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__muted { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__repeat { position: relative; display: inline-flex; align-items: center; gap: 4px; color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__repeat select { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__repeat select,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__timing {
  height: 24px;
  padding: 0 6px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  appearance: none;
  cursor: pointer;
  transition: background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__repeat select:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__timing:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Under the amount, right-aligned with it (the remove button's slot stays free) */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__timing { height: 24px; margin: 0 30px 0 0; padding: 0 4px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); text-align: right; }
.ui-bs__price { display: grid; justify-items: end; min-width: 0; }
.ui-bs__price-main { display: flex; align-items: center; gap: 4px; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__num { display: inline-flex; align-items: center; color: var(--tc-text-primary, var(--_tc-text-primary)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__num input {
  padding: 3px 1px;
  border: 0;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: none;
  outline: none;
  text-align: right;
  font-variant-numeric: tabular-nums;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-bs__num input:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
.ui-bs__num input:focus { background: var(--tc-field-bg, var(--_tc-field-bg)); box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
.ui-bs__num[data-invalid] input { box-shadow: var(--tc-field-shadow-invalid, var(--_tc-field-shadow-invalid)); }
.ui-bs__num { position: relative; }
.ui-bs__num-error { position: absolute; top: 100%; right: 0; z-index: 1; margin-top: 2px; padding: 2px 6px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-surface-overlay, var(--_tc-surface-overlay)); box-shadow: var(--tc-shadow-overlay, var(--_tc-shadow-overlay)); font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__remove {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-left: 4px !important;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: none;
  color: var(--tc-text-muted, var(--_tc-text-muted)) !important;
  opacity: 0;
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-bs__remove svg { width: 13px; height: 13px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__num { display: inline-flex; align-items: center; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__num input {
  height: 24px;
  padding: 0 1px;
  border-radius: 5px;
  outline: none;
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  text-align: right;
  font-variant-numeric: tabular-nums;
  field-sizing: content;
  min-width: 2ch;
  transition: background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__num input:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); }
/* Ghost icon button – shows on row hover */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__remove {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-left: 2px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  opacity: 0;
  transition: opacity var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-bs__row:hover .ui-bs__remove, .ui-bs__remove:focus-visible { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__remove:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
/* Actions */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__actions { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 10px; border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); background: var(--tc-surface-sunken, var(--_tc-surface-sunken)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__remove:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Actions: secondary buttons right under the lines */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__actions { display: flex; align-items: center; gap: 8px; padding: 10px 14px 12px; }
.ui-bs__spacer { flex: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border: 0;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)) !important;
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-bs__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__btn:active:not(:disabled) { transform: scale(0.98); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__btn:disabled { opacity: 0.45; cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__btn svg { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__select-label { display: inline-flex; align-items: center; gap: 8px; }
/* Totals */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__totals { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 12px 10px 6px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__totals b { margin-left: 4px; font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-primary, var(--_tc-text-primary)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__totals em { margin-left: 6px; font-style: normal; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)) 0 calc(var(--tc-control-px-md, var(--_tc-control-px-md)) - 2px);
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  white-space: nowrap;
  transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-bs__btn:active:not(:disabled) { transform: scale(0.97); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__btn:disabled { opacity: 0.4; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__btn svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__select-label { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
/* Totals: the last row under a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-bs__totals { display: flex; align-items: center; justify-content: space-between; gap: 6px 16px; flex-wrap: wrap; padding: 10px 14px; border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total { display: inline-flex; align-items: baseline; gap: 8px; min-width: 0; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total-label { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total b { font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total em {
  align-self: center;
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--tc-accent-subtle, var(--_tc-accent-subtle));
  font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-style: normal;
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-accent-text, var(--_tc-accent-text));
  animation: ui-bs-fade var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) both;
}
@keyframes ui-bs-fade { from { opacity: 0; } }
@keyframes ui-bs-row { from { opacity: 0; transform: translateY(-4px); } }
@keyframes ui-bs-menu { from { opacity: 0; transform: scale(0.97) translateY(-4px); } }
@container (max-width: 500px) {
:where([data-look="standard"], [data-look="standard"] *).ui-bs__fields { grid-template-columns: 1fr; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__summary { flex-wrap: wrap; row-gap: 2px; }
  /* Each line stacks: name on top, price and timing below */
:where([data-look="standard"], [data-look="standard"] *).ui-bs__row { grid-template-columns: minmax(0, 1fr); gap: 2px; padding: 10px 4px 10px 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__row--head { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__price { justify-items: stretch; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__price-main { justify-content: flex-start; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__timing { justify-self: start; margin: 0 0 0 -4px !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__remove { opacity: 1; margin-left: auto !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__actions { flex-wrap: wrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__spacer { display: none; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-bs__rows-outer[data-smooth] { transition: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-bs__row,
:where([data-look="standard"], [data-look="standard"] *).ui-bs__menu,
:where([data-look="standard"], [data-look="standard"] *).ui-bs__end { animation: none; }
}
/* Narrow card (phones): fields stack, each line stacks, buttons wrap */
@container (max-width: 500px) {
:where([data-look="clean"], [data-look="clean"] *).ui-bs__fields { grid-template-columns: 1fr; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__summary { flex-wrap: wrap; row-gap: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__row { grid-template-columns: minmax(0, 1fr); gap: 2px; padding: 10px 8px 10px 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__row--head { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__price { justify-items: stretch; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__price-main { justify-content: flex-start; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__num { margin-left: -2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__timing { justify-self: start; margin: 0 0 0 -4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__remove { opacity: 1; margin-left: auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__actions { flex-wrap: wrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__spacer { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__totals { flex-direction: column; align-items: stretch; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total { justify-content: space-between; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total--phase .ui-bs__total-label { margin-right: auto; order: -1; }
}
/* Touch screens: bigger targets, the remove button always visible */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-bs__input,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__select { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__btn { height: 36px; padding: 0 12px 0 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__menu button { min-height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__remove { width: 36px; height: 36px; opacity: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__repeat select { height: 32px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__num input { height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-bs__rows-outer[data-smooth] { transition: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs__row,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__menu,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__end,
:where([data-look="clean"], [data-look="clean"] *).ui-bs__total em { animation: none; }
}
/* Text fields: their own box (or their wrapper) shows focus with the field ring, so no second outline */
.ui-bs input:not([type="checkbox"]):not([type="radio"]):focus-visible,
.ui-bs textarea:focus-visible,
.ui-bs [contenteditable]:focus-visible { outline: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-bs select option { background: var(--tc-surface-raised, var(--_tc-surface-raised)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
`;

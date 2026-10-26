"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { useRootRef } from "../internal/use-root-ref";
import { reducedMotion } from "../internal/reduced-motion";
import { useControllable } from "../internal/use-controllable";
import { useFocusRescue } from "../internal/use-focus-rescue";

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
export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
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

/* ---------- Styles ---------- */

const css = /* css */ `
/* Colors and motion as variables – override them on .ui-ad */
.ui-ad {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: the card and the groups on a tray */
:where([data-look="standard"], [data-look="standard"] *).ui-ad {
  max-width: 420px;
  padding: var(--tc-tray-inset);
  overflow: hidden;
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-size: var(--tc-font-size-lg);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ad {
  max-width: 400px;
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-secondary);
}
.ui-ad *, .ui-ad *::before, .ui-ad *::after { box-sizing: border-box; }
:where(.ui-ad) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-ad button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ad ul { margin: 0; padding: 0; list-style: none; }
.ui-ad h4 { margin: 0; }
.ui-ad svg { display: block; flex: none; }
.ui-ad__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The card holds the heading and the levels – the edge is a shadow, not a border */
.ui-ad__card { position: relative; border-radius: var(--tc-card-radius); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__card { background: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__card { overflow: hidden; background: var(--tc-surface-raised); }
.ui-ad__head { display: flex; align-items: center; padding: 16px 16px 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__head { gap: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__head { gap: 10px; }
.ui-ad__spark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
.ui-ad__heading { display: grid; min-width: 0; }
.ui-ad__title { overflow: hidden; font-weight: var(--tc-font-weight-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__title { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__title { color: var(--tc-text-strong); }
.ui-ad__sub { overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__sub { font-size: var(--tc-font-size-sm-plus); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__sub { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* ----- Standard levels: the segmented-control recipe – a track, a raised thumb glides to the chosen one ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ad__levels { padding: 14px 16px 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__segmented { position: relative; display: flex; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__pill { position: absolute; top: var(--tc-seg-pad); bottom: var(--tc-seg-pad); left: 0; width: var(--w, 0); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); transform: translateX(var(--x, 0)); transition: transform var(--tc-duration-slow) var(--tc-ease-move), width var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level { position: relative; flex: 1; height: var(--tc-control-h-sm); padding: 0 10px; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); text-align: center !important; white-space: nowrap; transition: color var(--tc-duration-base) var(--tc-ease-standard); }
/* The chosen level: the thumb, the primary colour and the strong weight – not a fill alone */
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level[aria-checked="true"] { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level[aria-checked="false"]:hover { color: var(--tc-text-primary); }
/* ----- On the tray: the two groups ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ad__groups { display: grid; gap: 14px; padding: 14px 4px 4px; }
.ui-ad__group-head { display: flex; align-items: center; gap: 6px; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__group-head { margin: 0 8px 8px !important; font-size: var(--tc-font-size-sm-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
/* The count: a small badge with a soft lift – no taller than the heading */
.ui-ad__count { display: grid; place-items: center; overflow: hidden; border-radius: var(--tc-radius-badge); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__count { min-width: 18px; height: 18px; padding: 0 5px; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
/* ----- Clean levels: three separate buttons ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ad__levels { padding: 16px 16px 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__segmented { position: relative; display: flex; gap: 8px; }
/* The others are gray, the chosen one is white with a lift and a ≥ 3:1 selected edge (WCAG 1.4.11) */
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level { position: relative; flex: 1; padding: 3px 8px; border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); text-align: center !important; white-space: nowrap; transition: color var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level[aria-checked="true"] { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-selected), var(--tc-shadow-raised); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level[aria-checked="false"]:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
/* ----- The two groups: spacing between them, one hairline above ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ad__groups { display: grid; gap: 14px; padding: 14px 10px 12px; border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__group-head { margin: 0 6px 4px !important; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-tight); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__count { min-width: 16px; height: 16px; padding: 0 4px; font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-ad__roll { display: block; }
.ui-ad__roll[data-dir="up"] { animation: ui-ad-roll-up var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-ad__roll[data-dir="down"] { animation: ui-ad-roll-down var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-ad__list { display: grid; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__list { gap: 4px; }
.ui-ad__row { position: relative; display: flex; align-items: center; gap: 12px; background: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__row { min-height: 42px; padding: 4px 6px 4px 14px; border-radius: var(--tc-radius-xl); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__row { min-height: 30px; padding: 0 4px 0 6px; border-radius: var(--tc-radius-sm); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__row:hover { background: var(--tc-fill-subtle); }
.ui-ad__icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; color: var(--tc-icon-muted); }
.ui-ad__icon > svg { width: 16px; height: 16px; }
.ui-ad__name { display: grid; flex: 1; min-width: 0; }
/* The name and its risk tag wrap onto two lines rather than the tag cutting the name off */
.ui-ad__line { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px; min-width: 0; }
.ui-ad__label { min-width: 0; max-width: 100%; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__label { font-size: var(--tc-font-size-md-plus); font-weight: var(--tc-font-weight-medium); }
.ui-ad__detail { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* Risk: a small pill right after the name – glyph and word; safe actions carry nothing */
.ui-ad__risk { display: inline-flex; flex: none; align-items: center; gap: 3px; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px) 0 calc(var(--tc-pill-px) - 2px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-status-warning-fg); }
.ui-ad__risk > svg { width: 12px; height: 12px; }
.ui-ad__risk[data-risk="destructive"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* The lock: an icon button like Button's ghost icon button, always visible (≥ 3:1) */
.ui-ad__pin { display: grid; flex: none; place-items: center; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__pin { width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__pin { width: var(--tc-control-h-md); height: var(--tc-control-h-md); }
.ui-ad__pin:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-ad__pin[aria-pressed="true"] { color: var(--tc-text-secondary); }
/* Empty group: one quiet tag across the whole width */
.ui-ad__empty { display: flex; align-items: center; justify-content: center; background: var(--tc-fill-subtle); color: var(--tc-text-muted); text-align: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__empty { min-height: 42px; padding: 8px 12px; border-radius: var(--tc-radius-xl); font-size: var(--tc-font-size-sm-plus); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__empty { min-height: 30px; margin: 2px 0; padding: 6px 10px; border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
@keyframes ui-ad-roll-up { from { opacity: 0; transform: translateY(70%); } }
@keyframes ui-ad-roll-down { from { opacity: 0; transform: translateY(-70%); } }
/* Narrow containers: the levels get tighter – the details stay (truncated, the full text in a tooltip) */
@container (max-width: 340px) {
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level { padding: 0 6px; font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__segmented { gap: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level { padding: 4px 6px; font-size: var(--tc-font-size-sm); }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level { height: 36px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__pin { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level { padding: 8px 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__pin { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__row { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-ad *, .ui-ad *::before, .ui-ad *::after { animation: none !important; transition: none !important; }
}
`;

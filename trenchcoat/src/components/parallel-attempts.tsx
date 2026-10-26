"use client";

import { useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { useOnScreen } from "../internal/use-on-screen";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Parallel Attempts – an agent tries the same task several ways at once and the best one wins, in a single
 * self-contained file. A soft gray tray with the task, and on it, like a race, every attempt as a white card of its own – its model's logo, its approach and a bar that
 * grows while it works; when they're through, each one has a score, the best is marked and picked – and you can pick
 * another.
 *   · every row keeps its height: what it does right now turns into its outcome in place, nothing jumps
 *   · bars are tinted by state: running blue with a sweeping shine and a soft glow at its edge, done green,
 *     failed red – a failed one stops where it failed
 *   · the best finished attempt is marked "Best", picked on its own and gets a soft green wash, unless you pick
 *     another – point at a finished row and "Use this one" takes the place of its time and cost
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (Standard by default). Clean drops the gray tray: every attempt is a quiet card of its own, with
 * hairline shadows. Behaviour is the same.
 */
export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-pa";

export type AttemptStatus = "running" | "done" | "failed";

export type Attempt = {
  id: string;
  /** A short name – e.g. "Attempt A" */
  name: string;
  /** How this one goes about it, in a few words – e.g. "Mock the payment API" */
  approach: string;
  /** The model behind it – shown after the name */
  model?: string;
  /** A small mark, e.g. the model maker's logo */
  icon?: ReactNode;
  status: AttemptStatus;
  /** How far it is, 0 to 1 – the bar's length while it runs */
  progress?: number;
  /** What it does right now, while it runs – e.g. "Running tests 12/20" */
  step?: string;
  /** 0–100 once done – the highest finished score is the best */
  score?: number;
  /** One line about the outcome – e.g. "20/20 runs green" or the error */
  note?: string;
  /** How long it took, in ms */
  took?: number;
  cost?: number;
};

/** How an attempt came to be in use: picked by hand, or the best one taken on its own once all were through */
export type AttemptPickReason = { auto: boolean };

type ParallelAttemptsOwnProps = {
  /** Visual style: "standard" (the default) or "clean" */
  look?: Look;
  attempts: Attempt[];
  /** What all of them try to do – e.g. "Fix the flaky checkout test" */
  task?: string;
  /** The id of the attempt in use. Controlled when defined; null or an unknown id falls back to the best finished
   *  attempt once all are through */
  picked?: string | null;
  /** The attempt in use on mount when `picked` isn't controlled */
  defaultPicked?: string | null;
  /**
   * Called with the attempt in use whenever it changes – picked by hand (`auto: false`), or the best one taken on its
   * own once all are through (`auto: true`)
   */
  onPick?: (attempt: Attempt, reason: AttemptPickReason) => void;
  /** Formats every cost – defaults to dollars, e.g. "$0.31" */
  formatCost?: (amount: number) => string;
  title?: string;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type ParallelAttemptsProps = Omit<ComponentPropsWithoutRef<"div">, keyof ParallelAttemptsOwnProps> & ParallelAttemptsOwnProps;

/* ---------- Helpers ---------- */

const SEC = 1000;
const dollars = (n: number) => (n === 0 ? "$0" : n < 0.01 ? `$${n.toFixed(3)}` : n < 100 ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString("en-US")}`);
const took = (ms: number) => {
  if (ms < SEC) return `${Math.max(0, Math.round(ms))}ms`;
  if (ms < 10 * SEC) return `${(ms / SEC).toFixed(1)}s`;
  const s = Math.round(ms / SEC);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};
const STATUS: Record<AttemptStatus, string> = { running: "Running", done: "Done", failed: "Failed" };

/* ---------- Icons ---------- */

/* Three lanes and a finish mark for the title (drawn for Trenchcoat) */
const RaceMark = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1.5" y="2.5" width="9" height="2.4" rx="1.2" fill="currentColor" />
    <rect x="1.5" y="6.8" width="12" height="2.4" rx="1.2" fill="currentColor" opacity="0.55" />
    <rect x="1.5" y="11.1" width="6" height="2.4" rx="1.2" fill="currentColor" opacity="0.3" />
  </svg>
);
/* check: Lucide (ISC, lucide.dev) */
const Tick = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export function ParallelAttempts({
  look,
  attempts,
  task,
  picked: pickedProp,
  defaultPicked = null,
  onPick,
  formatCost = dollars,
  title,
  className,
  ref,
  ...rest
}: ParallelAttemptsProps) {
  const [ownPick, setOwn] = useState<string | null>(defaultPicked);
  const label = useId();

  const finished = attempts.filter((a) => a.status !== "running");
  const done = attempts.filter((a) => a.status === "done");
  const best = done.reduce<Attempt | undefined>((b, a) => (b === undefined || (a.score ?? 0) > (b.score ?? 0) ? a : b), undefined);
  const settled = finished.length === attempts.length && attempts.length > 0;
  // The best one is picked on its own once all are through – unless one was picked (by hand, or by the parent).
  // A pick that isn't among the attempts any more (a new run) no longer counts
  const chosen = pickedProp !== undefined ? pickedProp : ownPick;
  const valid = chosen !== null && attempts.some((a) => a.id === chosen) ? chosen : null;
  const auto = valid === null && settled ? (best?.id ?? null) : null;
  const picked = valid ?? auto;
  const cost = attempts.reduce((sum, a) => sum + (a.cost ?? 0), 0);
  const report = useRef(onPick);
  useEffect(() => {
    report.current = onPick;
  });
  const pick = (a: Attempt) => {
    if (pickedProp === undefined) setOwn(a.id);
    if (a.id !== picked || auto !== null) report.current?.(a, { auto: false });
  };

  const root = useRef<HTMLDivElement>(null);
  const setRoot = useRootRef(root, ref);
  // The bars' sweep and glow pause while the list is scrolled away
  const onScreen = useOnScreen(root);

  // The "Use this one" radios: one tab stop (the one in use, else the first), arrow keys move and pick (APG radio group)
  const choices = settled ? done : [];
  const tabStop = choices.some((a) => a.id === picked) ? picked : choices[0]?.id;
  const onRadioKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(event.key in keys) || choices.length === 0) return;
    const at = choices.findIndex((a) => a.id === (event.target as HTMLElement).dataset.attempt);
    if (at < 0) return;
    event.preventDefault();
    const next = choices[(at + keys[event.key] + choices.length) % choices.length];
    pick(next);
    root.current?.querySelector<HTMLElement>(`[data-attempt="${CSS.escape(next.id)}"]`)?.focus();
  };

  // One persistent status line: the result once all are through, and each pick – not the running percentages
  const pickedAttempt = attempts.find((a) => a.id === picked);
  const status = !settled
    ? ""
    : `${finished.length} of ${attempts.length} done${best ? `, best: ${best.name}` : ""}.${pickedAttempt ? ` Using ${pickedAttempt.name}.` : ""}`;
  // The auto pick is reported too – once per best attempt
  useEffect(() => {
    if (auto === null) return;
    const a = attempts.find((x) => x.id === auto);
    if (a) report.current?.(a, { auto: true });
  }, [auto]); // eslint-disable-line react-hooks/exhaustive-deps -- reported when the auto pick changes, not on every new array

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={look ?? DEFAULT_LOOK}
      data-offscreen={onScreen ? undefined : ""}
    >
      <style href="ui-parallel-attempts" precedence="default">
        {css}
      </style>

      <header className="ui-pa__bar">
        <span className="ui-pa__mark">
          <RaceMark />
        </span>
        <span className="ui-pa__title" id={label}>
          {title ?? `Best of ${attempts.length}`}
        </span>
        {task && <span className="ui-pa__task">{task}</span>}
        <span className="ui-pa__sum">
          <span>
            <b>{finished.length}</b> of {attempts.length} done
          </span>
          <span>
            <b>{formatCost(cost)}</b>
          </span>
        </span>
      </header>

      <span className="ui-pa__sr" role="status">
        {status}
      </span>

      <div className="ui-pa__panel" role="radiogroup" aria-labelledby={label} onKeyDown={onRadioKey}>
        {attempts.map((a, i) => {
          const isBest = settled && a.id === best?.id;
          const isPicked = a.id === picked;
          const progress = a.status === "done" ? 1 : Math.max(0.03, Math.min(1, a.progress ?? 0));
          const meta = [a.took !== undefined ? took(a.took) : undefined, a.cost !== undefined ? formatCost(a.cost) : undefined].filter(Boolean).join(" · ");
          return (
            <div
              key={a.id}
              className="ui-pa__row"
              data-status={a.status}
              data-best={isBest ? "" : undefined}
              data-picked={isPicked ? "" : undefined}
              data-quiet={settled && picked && !isPicked ? "" : undefined}
              style={{ "--i": i, "--p": progress } as CSSProperties}
            >
              {/* Two lines, always: what and how – then what it does right now, which turns into how it went */}
              <span className="ui-pa__icon" aria-hidden="true">
                {a.icon ?? a.name.slice(0, 1)}
              </span>
              <div className="ui-pa__who">
                <span className="ui-pa__name">
                  {a.name}
                  {a.model && <span className="ui-pa__model">{a.model}</span>}
                  <span className="ui-pa__approach">{a.approach}</span>
                </span>
                {(() => {
                  const line = a.status === "running" ? a.step ?? "Working…" : a.note ?? STATUS[a.status];
                  return (
                    <span className="ui-pa__line" key={a.status} title={typeof line === "string" ? line : undefined}>
                      {line}
                    </span>
                  );
                })()}
              </div>

              <div className="ui-pa__lane" aria-hidden="true">
                <span className="ui-pa__fill" />
              </div>

              <div className="ui-pa__end">
                <span className="ui-pa__score" key={a.status}>
                  {a.status === "running" ? (
                    <span className="ui-pa__pct">{Math.round(progress * 100)}%</span>
                  ) : a.status === "failed" ? (
                    <span className="ui-pa__failed">Failed</span>
                  ) : (
                    <>
                      {isBest && <span className="ui-pa__best">Best</span>}
                      {a.score ?? STATUS.done}
                    </>
                  )}
                </span>
                <span className="ui-pa__meta-slot">
                  <span className="ui-pa__meta" data-hide={a.status === "done" && (isPicked || settled) ? "" : undefined}>
                    {meta}
                  </span>
                  {a.status === "done" && settled && (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isPicked}
                      className="ui-pa__use"
                      data-on={isPicked ? "" : undefined}
                      data-attempt={a.id}
                      tabIndex={a.id === tabStop ? 0 : -1}
                      onClick={() => pick(a)}
                      // Starts with the visible text, so speech input can say it (WCAG 2.5.3)
                      aria-label={`${isPicked ? "In use" : "Use this one"}: ${a.name}${a.score !== undefined ? `, score ${a.score}` : ""}`}
                    >
                      {isPicked ? (
                        <>
                          <Tick />
                          In use
                        </>
                      ) : (
                        "Use this one"
                      )}
                    </button>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Colors, sizes and motion as variables – override them on .ui-pa */
:where([data-look="standard"], [data-look="standard"] *).ui-pa {
  /* Bars by state: a tint, its edge and the ink */
  --tc-parallel-attempts-picked-bg: light-dark(#f3fbf6, #1c2b22);
  --tc-parallel-attempts-best-bg: light-dark(#c4ebd1, #1d4a2d);
  --tc-parallel-attempts-best-edge: light-dark(#6fc590, #3f9a62);
  --tc-parallel-attempts-sweep: 1500ms;
  --tc-parallel-attempts-glow: 1100ms;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container: ui-pa / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors, sizes and motion as variables – override them on .ui-pa */
:where([data-look="clean"], [data-look="clean"] *).ui-pa {
  /* Bars by state: a tint, its edge and the ink – the Trace Waterfall bar recipe */
  --tc-parallel-attempts-best-bg: light-dark(rgba(0, 164, 51, 0.24), rgba(40, 200, 110, 0.32));
  --tc-parallel-attempts-best-edge: light-dark(rgba(0, 140, 50, 0.48), rgba(60, 220, 130, 0.6));
  --tc-parallel-attempts-picked-wash: light-dark(rgba(0, 164, 51, 0.035), rgba(40, 200, 110, 0.06));
  --tc-parallel-attempts-sweep: 1500ms;
  --tc-parallel-attempts-glow: 1100ms;
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container: ui-pa / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-pa *, .ui-pa *::before, .ui-pa *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *):where(.ui-pa) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-pa) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-pa button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-pa svg { display: block; flex: none; }
/* ----- On the tray: what they try, how many are through ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-pa__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); }
/* ----- The bar: what they try, how many are through ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-pa__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; margin-bottom: var(--tc-space-4); }
.ui-pa__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__title { flex: none; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__task { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__sum { display: flex; align-items: center; gap: var(--tc-space-3-5); margin-left: auto; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__sum b { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
/* ----- One white card per attempt, stacked on the tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-pa__panel { display: grid; gap: var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__row { position: relative; display: grid; grid-template-columns: 32px minmax(0, 1fr) minmax(120px, 36%) 100px; align-items: center; column-gap: var(--tc-space-3-5); padding: var(--tc-space-3-5) var(--tc-space-4-5) var(--tc-space-3-5) var(--tc-space-3-5); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); transition: opacity var(--tc-duration-slow) var(--tc-ease-standard), background-color var(--tc-duration-slowest) var(--tc-ease-standard), box-shadow var(--tc-duration-slow) var(--tc-ease-standard); animation: ui-pa-in var(--tc-duration-slower) var(--tc-ease-move) calc(var(--i, 0) * var(--tc-duration-instant)) backwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__title { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__task { min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__sum { display: flex; align-items: center; gap: var(--tc-space-3-5); margin-left: auto; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__sum b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
/* ----- The white panel: one row per attempt ----- */
/* One card per attempt, a little space between them */
:where([data-look="clean"], [data-look="clean"] *).ui-pa__panel { display: grid; gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__row { position: relative; display: grid; grid-template-columns: 28px minmax(0, 1fr) minmax(120px, 36%) 96px; align-items: center; column-gap: var(--tc-space-3-5); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); transition: opacity var(--tc-duration-slow) var(--tc-ease-standard), background-color var(--tc-duration-slowest) var(--tc-ease-standard), box-shadow var(--tc-duration-slow) var(--tc-ease-standard); animation: ui-pa-in var(--tc-duration-slower) var(--tc-ease-move) calc(var(--i, 0) * var(--tc-duration-instant)) backwards; }
.ui-pa__row > .ui-pa__lane { margin-left: var(--tc-space-1-5); }
/* The model's logo on a small square tile */
:where([data-look="standard"], [data-look="standard"] *).ui-pa__icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__icon > svg { width: 16px; height: 16px; }
/* The one in use gets a soft green wash and edge; once one is picked, the others step back a little */
:where([data-look="standard"], [data-look="standard"] *).ui-pa__row[data-picked] { background: var(--tc-parallel-attempts-picked-bg); box-shadow: 0 0 0 1px var(--tc-status-success-border), var(--tc-shadow-control); }
/* The model's logo on a small square tile */
:where([data-look="clean"], [data-look="clean"] *).ui-pa__icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-avatar-radius-agent); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__icon > svg { width: 14px; height: 14px; }
/* The one in use gets a soft wash; once one is picked, the others step back a little */
:where([data-look="clean"], [data-look="clean"] *).ui-pa__row[data-picked] { background: linear-gradient(var(--tc-parallel-attempts-picked-wash), var(--tc-parallel-attempts-picked-wash)), var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised), 0 0 0 0.5px var(--tc-status-success-border); }
/* Once one is picked the others step back – their art fades, their text only turns quieter (never below 4.5:1) */
.ui-pa__row[data-quiet] :is(.ui-pa__icon, .ui-pa__lane) { opacity: 0.5; transition: opacity var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-pa__row[data-quiet] :is(.ui-pa__name, .ui-pa__score) { color: var(--tc-text-secondary); }
/* On the green wash, quiet text steps up a shade so it keeps 4.5:1 (dark: muted on the wash was 4.35) */
.ui-pa__row[data-picked] :is(.ui-pa__model, .ui-pa__line, .ui-pa__meta) { color: var(--tc-text-secondary); }
.ui-pa__row[data-quiet]:hover :is(.ui-pa__icon, .ui-pa__lane), .ui-pa__row[data-quiet]:focus-within :is(.ui-pa__icon, .ui-pa__lane) { opacity: 1; }
.ui-pa__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* Two lines, always the same height */
.ui-pa__who { display: grid; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__name { display: flex; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__name { display: flex; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: nowrap; }
.ui-pa__model { flex: none; font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-pa__approach { min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); text-overflow: ellipsis; }
.ui-pa__approach::before { content: "·"; margin-right: var(--tc-space-1-5); color: var(--tc-text-disabled); }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__line { overflow: hidden; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; animation: ui-pa-fade var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__line { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; animation: ui-pa-fade var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-pa__row[data-status="running"] .ui-pa__line { color: var(--tc-parallel-attempts-status-ink); }
.ui-pa__row[data-status="failed"] .ui-pa__line { color: var(--tc-status-danger-fg); }
/* The bar: a tint with an edge; running, a shine sweeps over it and its leading edge glows */
:where([data-look="standard"], [data-look="standard"] *).ui-pa__lane { position: relative; height: 10px; border-radius: var(--tc-meter-radius); background: var(--tc-fill-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__fill { position: absolute; inset: 0 auto 0 0; width: calc(var(--p) * 100%); border-radius: var(--tc-meter-radius); background: var(--tc-parallel-attempts-status-bg); box-shadow: inset 0 0 0 1px var(--tc-parallel-attempts-status-edge); overflow: hidden; transition: width var(--tc-duration-slowest) var(--tc-ease-move), background-color var(--tc-duration-slower) var(--tc-ease-standard), box-shadow var(--tc-duration-slower) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__row[data-status="running"] .ui-pa__fill::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 60px; background: linear-gradient(90deg, transparent, var(--tc-shimmer), transparent); opacity: 0.85; animation: ui-pa-sweep var(--tc-parallel-attempts-sweep) linear 4; }
/* The bar: a tint with a hairline edge; running, a shine sweeps over it and its leading edge glows */
:where([data-look="clean"], [data-look="clean"] *).ui-pa__lane { position: relative; height: 8px; border-radius: var(--tc-radius-xs); background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__fill { position: absolute; inset: 0 auto 0 0; width: calc(var(--p) * 100%); border-radius: var(--tc-radius-xs); background: var(--tc-parallel-attempts-status-bg); box-shadow: inset 0 0 0 0.5px var(--tc-parallel-attempts-status-edge); overflow: hidden; transition: width var(--tc-duration-slowest) var(--tc-ease-move), background-color var(--tc-duration-slower) var(--tc-ease-standard), box-shadow var(--tc-duration-slower) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__row[data-status="running"] .ui-pa__fill::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 60px; background: linear-gradient(90deg, transparent, var(--tc-shimmer), transparent); opacity: 0.8; animation: ui-pa-sweep var(--tc-parallel-attempts-sweep) linear 4; }
.ui-pa__row[data-status="running"] .ui-pa__fill::after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; width: 24px; background: linear-gradient(90deg, transparent, var(--tc-parallel-attempts-status-edge)); animation: ui-pa-glow var(--tc-parallel-attempts-glow) var(--tc-ease-in-out) 6 alternate; }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__row[data-best] .ui-pa__fill { background: var(--tc-parallel-attempts-best-bg); box-shadow: inset 0 0 0 1px var(--tc-parallel-attempts-best-edge); }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__row[data-best] .ui-pa__fill { background: var(--tc-parallel-attempts-best-bg); box-shadow: inset 0 0 0 0.5px var(--tc-parallel-attempts-best-edge); }
/* On the right: the share done, then the score (or Failed) – and under it time and cost, or the pick */
.ui-pa__end { display: grid; justify-items: end; min-width: 0; text-align: right; }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__score { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; animation: ui-pa-fade var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__score { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; animation: ui-pa-fade var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-pa__pct { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__failed { font-weight: var(--tc-font-weight-medium); color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__best { height: 20px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-status-success-bg); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-status-success-fg); animation: ui-pa-pop var(--tc-duration-slower) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__meta-slot { position: relative; display: grid; justify-items: end; height: 20px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__meta { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__use { position: absolute; top: -4px; right: -8px; display: inline-flex; align-items: center; gap: var(--tc-space-1); height: 26px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-full); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); white-space: nowrap; opacity: 0; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__failed { color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__best { height: 18px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-status-success-bg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-status-success-fg); animation: ui-pa-pop var(--tc-duration-slower) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__meta-slot { position: relative; display: grid; justify-items: end; height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__meta { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__use { position: absolute; top: -3px; right: -6px; display: inline-flex; align-items: center; gap: var(--tc-space-1); height: 24px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); white-space: nowrap; opacity: 0; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
/* Pointing at a finished card: its time and cost make room for "Use this one" – the one in use says so */
.ui-pa__row:hover .ui-pa__meta[data-hide], .ui-pa__row:focus-within .ui-pa__meta[data-hide], .ui-pa__row[data-picked] .ui-pa__meta[data-hide] { opacity: 0; }
.ui-pa__row:hover .ui-pa__use, .ui-pa__use:focus-visible, .ui-pa__use[data-on] { opacity: 1; }
.ui-pa__use:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-pa__use[data-on] { color: var(--tc-status-success-fg); cursor: default; }
.ui-pa__use[data-on]:hover { background: none; }
/* Every state's colors in one place */
.ui-pa [data-status="running"] { --tc-parallel-attempts-status-bg: var(--tc-status-info-bg); --tc-parallel-attempts-status-edge: var(--tc-status-info-border); --tc-parallel-attempts-status-ink: var(--tc-status-info-fg); }
.ui-pa [data-status="done"] { --tc-parallel-attempts-status-bg: var(--tc-status-success-bg); --tc-parallel-attempts-status-edge: var(--tc-status-success-border); --tc-parallel-attempts-status-ink: var(--tc-status-success-fg); }
.ui-pa [data-status="failed"] { --tc-parallel-attempts-status-bg: var(--tc-status-danger-bg); --tc-parallel-attempts-status-edge: var(--tc-status-danger-border); --tc-parallel-attempts-status-ink: var(--tc-status-danger-fg); }
/* ----- Narrow: the bar under the name, the score beside it ----- */
@container ui-pa (max-width: 560px) {
:where([data-look="standard"], [data-look="standard"] *).ui-pa__sum { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__row { grid-template-columns: 32px minmax(0, 1fr) 88px; grid-template-areas: "icon who end" "lane lane lane"; row-gap: var(--tc-space-3); column-gap: var(--tc-space-3); padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4) var(--tc-space-3-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__icon { grid-area: icon; }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__who { grid-area: who; }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__end { grid-area: end; }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__row > .ui-pa__lane { grid-area: lane; margin-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-pa__approach { display: none; }
  /* The step and the outcome get two lines here – always reserved, so nothing jumps when one turns into the other */
:where([data-look="standard"], [data-look="standard"] *).ui-pa__line { display: -webkit-box; min-height: 38px; white-space: normal; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
}
:where([data-look="clean"], [data-look="clean"] *).ui-pa__row[data-best] { --tc-parallel-attempts-status-bg: var(--tc-parallel-attempts-best-bg); --tc-parallel-attempts-status-edge: var(--tc-parallel-attempts-best-edge); }
/* ----- Narrow: the bar under the name, the score beside it ----- */
@container ui-pa (max-width: 560px) {
:where([data-look="clean"], [data-look="clean"] *).ui-pa__sum { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__row { grid-template-columns: 28px minmax(0, 1fr) 84px; grid-template-areas: "icon who end" "lane lane lane"; row-gap: var(--tc-space-3); column-gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__icon { grid-area: icon; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__who { grid-area: who; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__end { grid-area: end; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__row > .ui-pa__lane { grid-area: lane; margin-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pa__approach { display: none; }
  /* The step and the outcome get two lines here – always reserved, so nothing jumps when one turns into the other */
:where([data-look="clean"], [data-look="clean"] *).ui-pa__line { display: -webkit-box; min-height: 36px; white-space: normal; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
}
@keyframes ui-pa-in { from { opacity: 0; transform: translateY(4px); } }
@keyframes ui-pa-fade { from { opacity: 0; } }
@keyframes ui-pa-pop { 0% { opacity: 0; transform: scale(0.8); } 60% { opacity: 1; transform: scale(1.06); } 100% { transform: scale(1); } }
@keyframes ui-pa-sweep { from { transform: translateX(-60px); } to { transform: translateX(900px); } }
@keyframes ui-pa-glow { from { opacity: 0.45; } to { opacity: 1; } }
/* Touch screens can't point: "Use this one" shows on every finished card, in place of its time and cost */
.ui-pa[data-offscreen] .ui-pa__fill::before, .ui-pa[data-offscreen] .ui-pa__fill::after { animation-play-state: paused; }
@media (hover: none) {
  .ui-pa__use { opacity: 1; }
  .ui-pa__meta[data-hide] { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-pa *, .ui-pa *::before, .ui-pa *::after { animation: none !important; transition: none !important; }
}
`;

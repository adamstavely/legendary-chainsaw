"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { AgentLedger, Button, type LedgerEntry, type Look } from "trenchcoat/react";
import { lookContext } from "trenchcoat/look-provider";

/*
 * Red-team Finding – what an adversarial test broke, and what was done about it, in one self-contained file. A list
 * of findings on the left (on the top when narrow); the picked one on the right:
 *   · its code, severity, status and age, the title, what happened and which parts of the system it touched
 *   · the invariants it failed – the rules that must always hold
 *   · the scenario that found it, and the evidence it left
 *   · the response, as the library's Agent Ledger: every change made in response, newest first, each with an undo
 * Built on the Trenchcoat elements through `trenchcoat/react` (Button, AgentLedger). The look follows the nearest
 * <LookProvider> – the same one the elements read – or the `look` prop. The styles are injected below and use only
 * the shared tokens, so both looks and both themes come from tokens.css.
 *
 * Keyboard: the findings are a listbox – ↑ ↓ Home End move and pick (the detail follows), Tab moves on to the detail.
 */

export type FindingSeverity = "critical" | "high" | "medium" | "low";
export type FindingStatus = "open" | "investigating" | "mitigated" | "resolved";

export type FindingEvidence = {
  id: string;
  /** What it is, e.g. "Run trace" or "Evidence package EP-4471" */
  label: string;
  /** A line under it, e.g. "Sealed · ready to export" */
  detail?: string;
};

export type Finding = {
  id: string;
  /** Short code shown before everything else, e.g. "F-001" – the id by default */
  code?: string;
  title: string;
  severity: FindingSeverity;
  status: FindingStatus;
  /** When it was opened, already formatted – e.g. "2h ago" */
  opened: string;
  /** One area tag in the list, e.g. "policy" */
  area?: string;
  /** What happened, in a sentence or three */
  summary: string;
  /** The parts of the system it touched */
  affected?: string[];
  /** The invariants that failed – rule ids or short sentences */
  invariants: { id: string; rule: string; detail?: string }[];
  /** The scenario that found it */
  scenario: { id: string; description: string; tags?: string[] };
  evidence?: FindingEvidence[];
  /** What was done in response – shown in the Agent Ledger, with undo */
  responses?: LedgerEntry[];
};

type OwnProps = {
  findings: Finding[];
  /** Id of the finding on show (controlled) */
  finding?: string;
  /** The finding on show at first – the first one by default */
  defaultFinding?: string;
  /** Called with the id of the finding picked in the list */
  onFindingChange?: (id: string) => void;
  /** The clock for the ledger's "2m ago", in epoch ms */
  now?: number;
  /** Who made the responses, shown in the ledger's header – e.g. "Response agent" */
  responder?: string;
  /** Undo / Redo in the ledger; either may return a promise (see AgentLedger) */
  onUndo?: (ids: string[], finding: Finding) => void | Promise<unknown>;
  onRedo?: (ids: string[], finding: Finding) => void | Promise<unknown>;
  /** An evidence row was opened; without it the rows are plain text */
  onOpenEvidence?: (evidence: FindingEvidence, finding: Finding) => void;
  /** Shows "Run again" in the detail */
  onRerun?: (finding: Finding) => void;
  /** Words for the severities and statuses – the defaults are plain English */
  severityLabels?: Partial<Record<FindingSeverity, string>>;
  statusLabels?: Partial<Record<FindingStatus, string>>;
  /** The list's heading – "Findings" by default */
  title?: string;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type RedTeamFindingProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

const SEVERITY: Record<FindingSeverity, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
const STATUS: Record<FindingStatus, string> = { open: "Open", investigating: "Investigating", mitigated: "Mitigated", resolved: "Resolved" };
const NONE: LedgerEntry[] = [];

export function RedTeamFinding({
  findings,
  finding: findingProp,
  defaultFinding,
  onFindingChange,
  now,
  responder = "Response",
  onUndo,
  onRedo,
  onOpenEvidence,
  onRerun,
  severityLabels,
  statusLabels,
  title = "Findings",
  look: lookProp,
  className,
  ref,
  ...rest
}: RedTeamFindingProps) {
  const uid = "ui-rtf" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [look, setLookNode] = useLook(lookProp);
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      setLookNode(node);
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
    },
    [ref, setLookNode],
  );
  const [pickedId, setPicked] = useControllable(findingProp, defaultFinding ?? findings[0]?.id ?? "", onFindingChange, "finding");
  const picked = findings.find((f) => f.id === pickedId) ?? findings[0];
  const severity = (s: FindingSeverity) => severityLabels?.[s] ?? SEVERITY[s];
  const status = (s: FindingStatus) => statusLabels?.[s] ?? STATUS[s];
  const open = findings.filter((f) => f.status !== "resolved").length;

  // The listbox: focus follows the pick
  const list = useRef<HTMLDivElement>(null);
  const focusPicked = useRef(false);
  useLayoutEffect(() => {
    if (!focusPicked.current) return;
    focusPicked.current = false;
    list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
  });
  const onListKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = findings.findIndex((f) => f.id === picked?.id);
    const to =
      e.key === "ArrowDown" ? Math.min(findings.length - 1, at + 1) : e.key === "ArrowUp" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : e.key === "End" ? findings.length - 1 : -2;
    if (to === -2) return;
    e.preventDefault();
    if (to >= 0 && findings[to].id !== picked?.id) {
      focusPicked.current = true;
      setPicked(findings[to].id);
    }
  };

  return (
    <div {...rest} ref={setRoot} data-look={look} className={["ui-rtf", className].filter(Boolean).join(" ")}>
      <style href="ui-red-team-finding" precedence="default">
        {css}
      </style>
      <div className="ui-rtf__layout">

      <section className="ui-rtf__card ui-rtf__list" aria-labelledby={`${uid}-list`}>
        <Head id={`${uid}-list`} icon={icons.target} title={title} aside={<span className="ui-rtf__pill" data-tone={open ? "danger" : "success"}>{open} open</span>} />
        <div className="ui-rtf__body">
          {findings.length === 0 ? (
            <p className="ui-rtf__empty">Nothing found yet.</p>
          ) : (
            <div ref={list} role="listbox" aria-labelledby={`${uid}-list`} className="ui-rtf__options" onKeyDown={onListKey}>
              {findings.map((f) => {
                const on = f.id === picked?.id;
                return (
                  <div
                    key={f.id}
                    role="option"
                    aria-selected={on}
                    tabIndex={on ? 0 : -1}
                    className="ui-rtf__option"
                    onClick={() => setPicked(f.id)}
                  >
                    <span className="ui-rtf__row">
                      <span className="ui-rtf__code">{f.code ?? f.id}</span>
                      <span className="ui-rtf__pill" data-tone={SEVERITY_TONE[f.severity]}>
                        {severity(f.severity)}
                      </span>
                      <span className="ui-rtf__when">{f.opened}</span>
                    </span>
                    <span className="ui-rtf__option-title">{f.title}</span>
                    <span className="ui-rtf__row">
                      <span className="ui-rtf__pill" data-tone={STATUS_TONE[f.status]} data-dot>
                        {status(f.status)}
                      </span>
                      {f.area && <span className="ui-rtf__tag">{f.area}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {picked && (
        <article className="ui-rtf__detail" aria-labelledby={`${uid}-title`} key={picked.id}>
          <header className="ui-rtf__intro">
            <div className="ui-rtf__row">
              <span className="ui-rtf__code">{picked.code ?? picked.id}</span>
              <span className="ui-rtf__pill" data-tone={SEVERITY_TONE[picked.severity]}>
                {severity(picked.severity)}
              </span>
              <span className="ui-rtf__pill" data-tone={STATUS_TONE[picked.status]} data-dot>
                {status(picked.status)}
              </span>
              <span className="ui-rtf__when">Opened {picked.opened}</span>
            </div>
            <h2 id={`${uid}-title`} className="ui-rtf__title">
              {picked.title}
            </h2>
            <p className="ui-rtf__summary">{picked.summary}</p>
            {(picked.affected?.length || onRerun) && (
              <div className="ui-rtf__row ui-rtf__affected">
                {picked.affected?.length ? (
                  <ul className="ui-rtf__chips" aria-label="Affected">
                    {picked.affected.map((a) => (
                      <li key={a} className="ui-rtf__chip">
                        {a}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {onRerun && (
                  <Button look={look} variant="secondary" size="sm" icon={<Glyph d={icons.rerun} />} onClick={() => onRerun(picked)}>
                    Run again
                  </Button>
                )}
              </div>
            )}
          </header>

          <section className="ui-rtf__card" aria-labelledby={`${uid}-inv`}>
            <Head
              id={`${uid}-inv`}
              icon={icons.shield}
              title="Failed invariants"
              subtitle="Rules that must always hold"
              aside={<span className="ui-rtf__pill" data-tone={picked.invariants.length ? "danger" : "success"}>{picked.invariants.length} failed</span>}
            />
            <div className="ui-rtf__body">
              {picked.invariants.length ? (
                <ul className="ui-rtf__rules">
                  {picked.invariants.map((r) => (
                    <li key={r.id}>
                      <span className="ui-rtf__x" aria-hidden="true">
                        <Glyph d={icons.x} />
                      </span>
                      <span>
                        <code className="ui-rtf__rule">{r.rule}</code>
                        {r.detail && <span className="ui-rtf__rule-detail">{r.detail}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ui-rtf__empty">Every invariant held.</p>
              )}
            </div>
          </section>

          <div className="ui-rtf__pair">
            <section className="ui-rtf__card" aria-labelledby={`${uid}-scn`}>
              <Head id={`${uid}-scn`} icon={icons.flask} title="Scenario" subtitle={<code className="ui-rtf__mono">{picked.scenario.id}</code>} />
              <div className="ui-rtf__body">
                <p className="ui-rtf__text">{picked.scenario.description}</p>
                {picked.scenario.tags?.length ? (
                  <ul className="ui-rtf__chips" aria-label="Scenario tags">
                    {picked.scenario.tags.map((t) => (
                      <li key={t} className="ui-rtf__chip">
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>

            <section className="ui-rtf__card" aria-labelledby={`${uid}-ev`}>
              <Head id={`${uid}-ev`} icon={icons.file} title="Evidence" aside={<span className="ui-rtf__count">{picked.evidence?.length ?? 0}</span>} />
              <div className="ui-rtf__body">
                {picked.evidence?.length ? (
                  <ul className="ui-rtf__evidence">
                    {picked.evidence.map((ev) => {
                      const inner = (
                        <>
                          <span className="ui-rtf__ev-icon" aria-hidden="true">
                            <Glyph d={icons.file} />
                          </span>
                          <span className="ui-rtf__ev-text">
                            <span className="ui-rtf__ev-label">{ev.label}</span>
                            {ev.detail && <span className="ui-rtf__ev-detail">{ev.detail}</span>}
                          </span>
                          {onOpenEvidence && (
                            <span className="ui-rtf__ev-go" aria-hidden="true">
                              <Glyph d={icons.chevron} />
                            </span>
                          )}
                        </>
                      );
                      return (
                        <li key={ev.id}>
                          {onOpenEvidence ? (
                            <button type="button" className="ui-rtf__ev" onClick={() => onOpenEvidence(ev, picked)}>
                              {inner}
                            </button>
                          ) : (
                            <div className="ui-rtf__ev">{inner}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="ui-rtf__empty">No evidence attached.</p>
                )}
              </div>
            </section>
          </div>

          <AgentLedger
            look={look}
            title="Response timeline"
            agent={responder}
            entries={picked.responses ?? NONE}
            now={now}
            onUndo={onUndo ? (ids) => onUndo(ids, picked) : undefined}
            onRedo={onRedo ? (ids) => onRedo(ids, picked) : undefined}
          />
        </article>
      )}
      </div>
    </div>
  );
}

/* ---------- Pieces ---------- */

const SEVERITY_TONE: Record<FindingSeverity, string> = { critical: "danger", high: "warning", medium: "info", low: "neutral" };
const STATUS_TONE: Record<FindingStatus, string> = { open: "danger", investigating: "warning", mitigated: "info", resolved: "success" };

/** 24 px stroke icons (Lucide, ISC) */
const icons = {
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  shield: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM14.5 9.5l-5 5M9.5 9.5l5 5",
  flask: "M10 2v7.53a2 2 0 0 1-.21.9L4.72 20.55A1 1 0 0 0 5.62 22h12.76a1 1 0 0 0 .9-1.45l-5.07-10.12a2 2 0 0 1-.21-.9V2M8.5 2h7M7 16h10",
  file: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v4a2 2 0 0 0 2 2h4M9 13h6M9 17h4",
  x: "M18 6 6 18M6 6l12 12",
  chevron: "m9 18 6-6-6-6",
  rerun: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5",
};

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** The card header every Trenchcoat card shares: a boxed icon, the title (a real heading), a quiet line and an aside */
function Head({ id, icon, title, subtitle, aside }: { id: string; icon: string; title: ReactNode; subtitle?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="ui-rtf__head">
      <span className="ui-rtf__head-icon" aria-hidden="true">
        <Glyph d={icon} />
      </span>
      <div className="ui-rtf__head-text">
        <h3 id={id} className="ui-rtf__head-title">
          {title}
        </h3>
        {subtitle && <p className="ui-rtf__head-sub">{subtitle}</p>}
      </div>
      {aside && <div className="ui-rtf__head-aside">{aside}</div>}
    </div>
  );
}

/* ---------- Hooks ---------- */

/**
 * The block's look: the `look` prop, else the nearest <LookProvider> (asked through the same context the elements
 * use, and followed when it changes), else the page's data-tc-look. Unset, the page's tokens apply as they are.
 */
function useLook(own: Look | undefined) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [inherited, setInherited] = useState<Look | undefined>(undefined);
  useLayoutEffect(() => {
    if (own || !node) return;
    let stop: (() => void) | undefined;
    let answered = false;
    const request = Object.assign(new Event("context-request", { bubbles: true, composed: true }), {
      context: lookContext,
      contextTarget: node,
      subscribe: true,
      callback: (value: Look | undefined, unsubscribe?: () => void) => {
        answered = true;
        stop = unsubscribe;
        setInherited(value);
      },
    });
    node.dispatchEvent(request);
    if (!answered) {
      const page = node.parentElement?.closest("[data-look], [data-tc-look]");
      const value = page?.getAttribute("data-look") ?? page?.getAttribute("data-tc-look");
      setInherited(value === "clean" || value === "standard" ? value : undefined);
    }
    return () => stop?.();
  }, [own, node]);
  return [own ?? inherited, setNode] as const;
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  const warned = useRef(false);
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
  if (controlled && !onChange && !warned.current && env !== "production") {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T) => {
      if (Object.is(next, latest.current)) return;
      if (!controlled) setOwn(next);
      latest.current = next;
      report.current?.(next);
    },
    [controlled],
  );
  return [current, set] as const;
}

/* ---------- Styles ---------- */

const css = /* css */ `
.ui-rtf {
  container-type: inline-size;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: var(--tc-font-size-md, 13px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
}
.ui-rtf__layout {
  display: grid;
  grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
  align-items: start;
  gap: var(--tc-space-4, 16px);
}
.ui-rtf *, .ui-rtf *::before, .ui-rtf *::after { box-sizing: border-box; }
@container (max-width: 760px) { .ui-rtf__layout { grid-template-columns: minmax(0, 1fr); } }

/* A card: Standard puts the header on the gray tray above the white card; Clean is one white card, header first */
.ui-rtf__card { min-width: 0; padding: var(--tc-tray-inset, 4px); border-radius: var(--tc-tray-radius, calc(16px + 4px)); background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b)); }
.ui-rtf__body { padding: var(--tc-space-3, 12px) var(--tc-space-4, 16px); border-radius: var(--tc-card-radius, 16px); background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-rtf[data-look="clean"] .ui-rtf__card { padding: 0; border-radius: var(--tc-card-radius, 16px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-rtf[data-look="clean"] .ui-rtf__body { padding: 0 var(--tc-space-4, 16px) var(--tc-space-4, 16px); border-radius: 0; background: none; box-shadow: none; }
.ui-rtf__list .ui-rtf__body { padding: var(--tc-space-1, 4px); }
.ui-rtf[data-look="clean"] .ui-rtf__list .ui-rtf__body { padding: 0 var(--tc-space-1-5, 6px) var(--tc-space-1-5, 6px); }

.ui-rtf__head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-head-gap, 10px); row-gap: var(--tc-space-2, 8px); padding: var(--tc-head-pad, 8px 10px 10px); }
.ui-rtf__head-icon { flex: none; display: grid; place-items: center; width: var(--tc-head-icon-size, 28px); height: var(--tc-head-icon-size, 28px); border-radius: var(--tc-head-icon-radius, 8px); background: var(--tc-head-icon-bg, light-dark(#ffffff, #232326)); box-shadow: var(--tc-head-icon-shadow, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); color: var(--tc-head-icon-fg, light-dark(#404040, #c8c8cc)); }
.ui-rtf__head-icon svg { width: var(--tc-head-glyph, 16px); height: var(--tc-head-glyph, 16px); stroke-width: var(--tc-head-glyph-stroke, 1.75); }
.ui-rtf__head-text { flex: 1 1 0; min-width: min(100%, 8rem); }
.ui-rtf__head-title { margin: 0; color: var(--tc-title-color, light-dark(#171717, #ededed)); font-size: var(--tc-title-font-size, 14px); font-weight: var(--tc-title-font-weight, 600); line-height: var(--tc-title-line-height, 20px); letter-spacing: var(--tc-title-tracking, -0.006em); }
.ui-rtf__head-sub { margin: 0; color: var(--tc-subtitle-color, light-dark(#404040, #c8c8cc)); font-size: var(--tc-subtitle-font-size, 12px); line-height: var(--tc-subtitle-line-height, 16px); overflow-wrap: anywhere; }
.ui-rtf__head-aside { display: flex; align-items: center; gap: var(--tc-space-2, 8px); margin-left: auto; }

/* Pills: tinted status recipes */
.ui-rtf__pill { display: inline-flex; align-items: center; gap: var(--tc-space-1, 4px); height: var(--tc-pill-h, 20px); padding: 0 var(--tc-pill-px, 8px); border-radius: var(--tc-pill-radius, 999px); background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); font-size: var(--tc-pill-font-size, 11px); font-weight: var(--tc-pill-font-weight, 500); white-space: nowrap; }
.ui-rtf__pill[data-dot]::before { content: ""; width: var(--tc-space-1-5, 6px); height: var(--tc-space-1-5, 6px); border-radius: 50%; background: currentColor; }
.ui-rtf__pill[data-tone="danger"] { background: var(--tc-status-danger-bg, light-dark(#fdecea, #3b1714)); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-rtf__pill[data-tone="warning"] { background: var(--tc-status-warning-bg, light-dark(#fff3e0, #3a2410)); color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-rtf__pill[data-tone="info"] { background: var(--tc-status-info-bg, light-dark(#eaf1ff, #16243f)); color: var(--tc-status-info-fg, light-dark(#2456d6, #8ab4ff)); }
.ui-rtf__pill[data-tone="success"] { background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f)); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-rtf__count { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-sm, 12px); font-variant-numeric: tabular-nums; }
.ui-rtf__tag, .ui-rtf__chip { display: inline-flex; align-items: center; height: var(--tc-pill-h, 20px); padding: 0 var(--tc-pill-px, 8px); border-radius: var(--tc-pill-radius, 999px); box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-default, light-dark(#ececec, #2a2a2e)); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); font-size: var(--tc-pill-font-size, 11px); white-space: nowrap; }
.ui-rtf__chip { font-family: var(--tc-font-mono, ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace); }
.ui-rtf__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5, 6px); margin: 0; padding: 0; list-style: none; }
.ui-rtf__code, .ui-rtf__mono { font-family: var(--tc-font-mono, ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace); font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-rtf__when { margin-left: auto; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-sm, 12px); white-space: nowrap; }
.ui-rtf__row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5, 6px); min-width: 0; }
.ui-rtf__empty { margin: 0; padding: var(--tc-space-3, 12px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* The list */
.ui-rtf__options { display: grid; gap: var(--tc-space-0-5, 2px); outline: none; }
.ui-rtf__option { display: grid; gap: var(--tc-space-1-5, 6px); padding: var(--tc-space-2-5, 10px) var(--tc-space-3, 12px); border-radius: var(--tc-radius-md, 8px); cursor: pointer; transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease); }
.ui-rtf__option:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-rtf__option[aria-selected="true"] { background: var(--tc-fill-selected, light-dark(rgba(47, 107, 255, 0.08), rgba(91, 154, 255, 0.14))); box-shadow: inset 2px 0 0 var(--tc-status-danger-solid, light-dark(#e5484d, #ff6369)); }
.ui-rtf__option:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: calc(var(--tc-focus-ring-offset, 2px) * -1); }
.ui-rtf__option-title { font-size: var(--tc-font-size-md, 13px); font-weight: var(--tc-font-weight-medium, 500); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

/* The detail */
.ui-rtf__detail { display: grid; gap: var(--tc-space-4, 16px); min-width: 0; animation: ui-rtf-in var(--tc-duration-moderate, 260ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both; }
.ui-rtf__intro { display: grid; gap: var(--tc-space-2, 8px); padding: var(--tc-space-1, 4px) var(--tc-space-1, 4px) 0; }
.ui-rtf__title { margin: 0; font-size: var(--tc-font-size-2xl, 20px); font-weight: var(--tc-font-weight-semibold, 600); line-height: var(--tc-line-height-display-sm, 28px); letter-spacing: var(--tc-tracking-snug, -0.01em); color: var(--tc-text-strong, light-dark(#171717, #f5f5f5)); text-wrap: balance; }
.ui-rtf[data-look="clean"] .ui-rtf__title { font-weight: var(--tc-font-weight-medium, 500); }
.ui-rtf__summary, .ui-rtf__text { margin: 0; color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-relaxed, 22px); max-width: 68ch; }
.ui-rtf__text { font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); margin-bottom: var(--tc-space-2-5, 10px); }
.ui-rtf__affected { justify-content: space-between; gap: var(--tc-space-3, 12px); }

.ui-rtf__rules { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-rtf__rules li { display: flex; align-items: flex-start; gap: var(--tc-space-2-5, 10px); padding: var(--tc-space-2, 8px) 0; border-top: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-rtf__rules li:first-child { border-top: 0; }
.ui-rtf__x { flex: none; display: grid; place-items: center; width: var(--tc-space-5, 20px); height: var(--tc-space-5, 20px); border-radius: 50%; background: var(--tc-status-danger-bg, light-dark(#fdecea, #3b1714)); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-rtf__x svg { width: var(--tc-space-3, 12px); height: var(--tc-space-3, 12px); stroke-width: 2.5; }
.ui-rtf__rule { display: block; font-family: var(--tc-font-mono, ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace); font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); overflow-wrap: anywhere; }
.ui-rtf__rule-detail { display: block; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); }

.ui-rtf__pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: var(--tc-space-4, 16px); align-items: stretch; }
.ui-rtf__pair > .ui-rtf__card { display: flex; flex-direction: column; }
.ui-rtf__pair .ui-rtf__body { flex: 1; }

.ui-rtf__evidence { display: grid; gap: var(--tc-space-0-5, 2px); margin: calc(var(--tc-space-1, 4px) * -1) calc(var(--tc-space-2, 8px) * -1); padding: 0; list-style: none; }
.ui-rtf__ev { display: flex; align-items: center; gap: var(--tc-space-2-5, 10px); width: 100%; padding: var(--tc-space-2, 8px); border: 0; border-radius: var(--tc-radius-md, 8px); background: none; font: inherit; color: inherit; text-align: left; }
button.ui-rtf__ev { cursor: pointer; transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease); }
button.ui-rtf__ev:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
button.ui-rtf__ev:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: calc(var(--tc-focus-ring-offset, 2px) * -1); }
.ui-rtf__ev-icon { flex: none; display: grid; place-items: center; width: var(--tc-space-7, 28px); height: var(--tc-space-7, 28px); border-radius: var(--tc-radius-sm, 6px); background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f)); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-rtf__ev-icon svg, .ui-rtf__ev-go svg { width: var(--tc-space-4, 16px); height: var(--tc-space-4, 16px); stroke-width: 1.75; }
.ui-rtf__ev-text { flex: 1; min-width: 0; display: grid; }
.ui-rtf__ev-label { font-weight: var(--tc-font-weight-medium, 500); overflow-wrap: anywhere; }
.ui-rtf__ev-detail { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); }
.ui-rtf__ev-go { color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }


@keyframes ui-rtf-in { from { opacity: 0; transform: translateY(4px); } }
@media (prefers-reduced-motion: reduce) { .ui-rtf__detail { animation: none; } .ui-rtf__option, button.ui-rtf__ev { transition: none; } }
@media (forced-colors: active) {
  .ui-rtf__option[aria-selected="true"] { outline: 2px solid Highlight; }
  .ui-rtf__pill, .ui-rtf__tag, .ui-rtf__chip, .ui-rtf__head-icon { border: 1px solid CanvasText; }
}
`;

"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type Ref,
} from "react";
import { BreakdownChart, type Look } from "trenchcoat/react";
import { lookContext } from "trenchcoat/look-provider";

/*
 * Uncertainty Mix – where an answer's uncertainty comes from, in one self-contained file. Not all uncertainty is the
 * same: some would shrink with more information, some can't be known yet, some is past what the model knows – and
 * each asks for something different. Two parts:
 *   · a reading card: the whole answer's mix as one bar, each kind with its share and what it means, and a short
 *     reading of what to do – led by the kind that weighs most
 *   · the library's Breakdown Chart: the same mix per part of the answer (or per claim), with its linked table –
 *     hide a kind from the legend and the reading follows
 * Built on the Trenchcoat elements through `trenchcoat/react` (BreakdownChart). The look follows the nearest
 * <LookProvider> – the same one the elements read – or the `look` prop. The styles are injected below and use only
 * the shared tokens.
 */

export type UncertaintyKind = {
  key: string;
  /** e.g. "Missing information" */
  label: string;
  /** What it means, in a few words */
  meaning: string;
  /** What to do about it, as a sentence */
  advice: string;
  /** Segment colour, any CSS colour – keep it at 3:1 against the card in both themes */
  color?: string;
};

export type UncertaintySource = {
  /** The part of the answer it belongs to, e.g. "Timeline" */
  part: string;
  /** A kind's key */
  kind: string;
  /** How much uncertainty it adds, in any unit – shares are worked out from the sum */
  amount: number;
  /** The claim it comes from, if it's one claim */
  claim?: string;
};

type OwnProps = {
  sources: UncertaintySource[];
  /** The kinds, in display order – missing information, inherent uncertainty and model limits by default */
  kinds?: UncertaintyKind[];
  /** The parts in display order – by first appearance in `sources` by default */
  parts?: string[];
  /** What a part is called, e.g. "Section" or "Claim" – "Part of the answer" by default */
  partLabel?: string;
  /** Keys of the kinds hidden from the chart and the reading (controlled) */
  hidden?: string[];
  /** Hidden at first when uncontrolled */
  defaultHidden?: string[];
  /** Called when the chart's legend hides or shows kinds */
  onHiddenChange?: (keys: string[]) => void;
  /** The reading card's heading – "Uncertainty mix" by default */
  title?: string;
  /** The line under it, e.g. "Current session" */
  subtitle?: string;
  /** The chart's heading – "By part of the answer" by default */
  chartTitle?: string;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type UncertaintyMixProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

export const DEFAULT_KINDS: UncertaintyKind[] = [
  {
    key: "gap",
    label: "Missing information",
    meaning: "More information would narrow it",
    advice: "Find or request what's missing before relying on it.",
    color: "var(--tc-tone-violet-solid, light-dark(#8b5cf6, #a78bfa))",
  },
  {
    key: "chance",
    label: "Inherent uncertainty",
    meaning: "The outcome isn't decided yet",
    advice: "Watch for early signs and revisit as things change.",
    color: "var(--tc-status-info-solid, light-dark(#2f68ff, #6b95ff))",
  },
  {
    key: "model",
    label: "Model limits",
    meaning: "At the edge of what the model knows",
    advice: "Check it with a person who knows the area, or a primary source.",
    color: "var(--tc-tone-amber-solid, light-dark(#c2710c, #f5a524))",
  },
];
const NONE: string[] = [];

export function UncertaintyMix({
  sources,
  kinds = DEFAULT_KINDS,
  parts: partsProp,
  partLabel = "Part of the answer",
  hidden: hiddenProp,
  defaultHidden = NONE,
  onHiddenChange,
  title = "Uncertainty mix",
  subtitle,
  chartTitle = "By part of the answer",
  look: lookProp,
  className,
  ref,
  ...rest
}: UncertaintyMixProps) {
  const uid = "ui-umix" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [look, setLookNode] = useLook(lookProp);
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      setLookNode(node);
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
    },
    [ref, setLookNode],
  );
  const [hidden, setHidden] = useControllable(hiddenProp, defaultHidden, onHiddenChange, "hidden");

  const parts = useMemo(() => partsProp ?? [...new Set(sources.map((s) => s.part))], [partsProp, sources]);
  const byKey = useMemo(() => new Map(kinds.map((k) => [k.key, k])), [kinds]);
  // The chart speaks in labels (they're what it shows); the block's API in keys
  const records = useMemo(
    () => sources.filter((s) => byKey.has(s.kind)).map((s) => ({ part: s.part, kind: byKey.get(s.kind)!.label, amount: s.amount })),
    [sources, byKey],
  );
  const dimensions = useMemo(
    () => [
      { key: "part", label: partLabel, values: parts },
      { key: "kind", label: "Kind", values: kinds.map((k) => k.label), colors: Object.fromEntries(kinds.filter((k) => k.color).map((k) => [k.label, k.color!])) },
    ],
    [partLabel, parts, kinds],
  );
  const hiddenLabels = useMemo(() => hidden.map((k) => byKey.get(k)?.label).filter((l): l is string => !!l), [hidden, byKey]);

  // The reading: the shares of what's shown
  const shown = kinds.filter((k) => !hidden.includes(k.key));
  const totals = shown.map((k) => ({ kind: k, amount: sources.filter((s) => s.kind === k.key).reduce((n, s) => n + s.amount, 0) }));
  const total = totals.reduce((n, t) => n + t.amount, 0);
  const shares = totals.map((t) => ({ ...t, share: total ? t.amount / total : 0 }));
  const lead = [...shares].sort((a, b) => b.amount - a.amount)[0];
  const partTotals = parts.map((p) => ({ part: p, amount: sources.filter((s) => s.part === p && !hidden.includes(s.kind)).reduce((n, s) => n + s.amount, 0) }));
  const heaviest = [...partTotals].sort((a, b) => b.amount - a.amount)[0];
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div {...rest} ref={setRoot} data-look={look} className={["ui-umix", className].filter(Boolean).join(" ")}>
      <style href="ui-uncertainty-mix" precedence="default">
        {css}
      </style>
      <div className="ui-umix__layout">

      <section className="ui-umix__card" aria-labelledby={`${uid}-title`}>
        <div className="ui-umix__head">
          <span className="ui-umix__head-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          </span>
          <div className="ui-umix__head-text">
            <h3 id={`${uid}-title`} className="ui-umix__head-title">
              {title}
            </h3>
            {subtitle && <p className="ui-umix__head-sub">{subtitle}</p>}
          </div>
        </div>
        <div className="ui-umix__body">
          {total > 0 ? (
            <>
              <div className="ui-umix__bar" role="img" aria-label={shares.map((s) => `${s.kind.label} ${pct(s.share)}`).join(", ")}>
                {shares.map((s) => (
                  <span key={s.kind.key} className="ui-umix__seg" style={{ flexGrow: s.amount, background: s.kind.color ?? "var(--tc-chart-neutral, light-dark(#a3a3a3, #5c5c63))" }} />
                ))}
              </div>
              <ul className="ui-umix__kinds">
                {shares.map((s) => (
                  <li key={s.kind.key} className="ui-umix__kind">
                    <span className="ui-umix__swatch" style={{ background: s.kind.color ?? "var(--tc-chart-neutral, light-dark(#a3a3a3, #5c5c63))" }} aria-hidden="true" />
                    <span className="ui-umix__share">{pct(s.share)}</span>
                    <span className="ui-umix__kind-text">
                      <span className="ui-umix__kind-label">{s.kind.label}</span>
                      <span className="ui-umix__kind-meaning">{s.kind.meaning}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="ui-umix__reading" aria-live="polite">
                <p className="ui-umix__caption">Reading</p>
                <p>
                  {lead.share >= 0.5 ? "Most" : "The largest share"} of the uncertainty – {pct(lead.share)} – is <b>{lead.kind.label.toLowerCase()}</b>.{" "}
                  {lead.kind.advice}
                </p>
                {heaviest && parts.length > 1 && heaviest.amount > 0 && (
                  <p>
                    <b>{heaviest.part}</b> carries the most ({pct(heaviest.amount / total)}) – start there.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="ui-umix__empty">{sources.length ? "Every kind is hidden – show one in the chart's legend." : "No uncertainty recorded for this answer."}</p>
          )}
        </div>
      </section>

      <BreakdownChart
        className="ui-umix__chart"
        look={look}
        fill
        title={chartTitle}
        records={records}
        dimensions={dimensions}
        measures={MEASURES}
        defaultSlice="part"
        defaultSegment="kind"
        hidden={hiddenLabels}
        onHiddenChange={(labels) => setHidden(kinds.filter((k) => labels.includes(k.label)).map((k) => k.key))}
      />
      </div>
    </div>
  );
}

const MEASURES = [
  { key: "amount", label: "Uncertainty", unit: "points", field: "amount" },
  { key: "count", label: "Sources", unit: "sources" },
];

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
.ui-umix {
  container-type: inline-size;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: var(--tc-font-size-md, 13px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
}
.ui-umix__layout {
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
  align-items: start;
  gap: var(--tc-space-4, 16px);
}
.ui-umix *, .ui-umix *::before, .ui-umix *::after { box-sizing: border-box; }
@container (max-width: 720px) { .ui-umix__layout { grid-template-columns: minmax(0, 1fr); } }

.ui-umix__card { min-width: 0; padding: var(--tc-tray-inset, 4px); border-radius: var(--tc-tray-radius, calc(16px + 4px)); background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b)); }
.ui-umix__body { display: grid; gap: var(--tc-space-4, 16px); padding: var(--tc-space-4, 16px); border-radius: var(--tc-card-radius, 16px); background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-umix[data-look="clean"] .ui-umix__card { padding: 0; border-radius: var(--tc-card-radius, 16px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-umix[data-look="clean"] .ui-umix__body { padding: 0 var(--tc-space-4, 16px) var(--tc-space-4, 16px); border-radius: 0; background: none; box-shadow: none; }

.ui-umix__head { display: flex; align-items: center; gap: var(--tc-head-gap, 10px); padding: var(--tc-head-pad, 8px 10px 10px); }
.ui-umix__head-icon { flex: none; display: grid; place-items: center; width: var(--tc-head-icon-size, 28px); height: var(--tc-head-icon-size, 28px); border-radius: var(--tc-head-icon-radius, 8px); background: var(--tc-head-icon-bg, light-dark(#ffffff, #232326)); box-shadow: var(--tc-head-icon-shadow, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); color: var(--tc-head-icon-fg, light-dark(#404040, #c8c8cc)); }
.ui-umix__head-icon svg { width: var(--tc-head-glyph, 16px); height: var(--tc-head-glyph, 16px); stroke-width: var(--tc-head-glyph-stroke, 1.75); }
.ui-umix__head-text { flex: 1; min-width: 0; }
.ui-umix__head-title { margin: 0; color: var(--tc-title-color, light-dark(#171717, #ededed)); font-size: var(--tc-title-font-size, 14px); font-weight: var(--tc-title-font-weight, 600); line-height: var(--tc-title-line-height, 20px); letter-spacing: var(--tc-title-tracking, -0.006em); }
.ui-umix__head-sub { margin: 0; color: var(--tc-subtitle-color, light-dark(#404040, #c8c8cc)); font-size: var(--tc-subtitle-font-size, 12px); line-height: var(--tc-subtitle-line-height, 16px); }

/* The whole answer's mix: one bar, a gap between kinds */
.ui-umix__bar { display: flex; gap: var(--tc-space-0-5, 2px); height: var(--tc-space-3, 12px); }
.ui-umix__seg { flex: 1 1 0; min-width: var(--tc-space-1, 4px); border-radius: var(--tc-radius-2xs, 2px); transition: flex-grow var(--tc-duration-slow, 320ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-umix__seg:first-child { border-radius: var(--tc-radius-full, 999px) var(--tc-radius-2xs, 2px) var(--tc-radius-2xs, 2px) var(--tc-radius-full, 999px); }
.ui-umix__seg:last-child { border-radius: var(--tc-radius-2xs, 2px) var(--tc-radius-full, 999px) var(--tc-radius-full, 999px) var(--tc-radius-2xs, 2px); }
.ui-umix__seg:only-child { border-radius: var(--tc-radius-full, 999px); }
.ui-umix__kinds { display: grid; gap: var(--tc-space-3, 12px); margin: 0; padding: 0; list-style: none; }
.ui-umix__kind { display: grid; grid-template-columns: auto 3.25em minmax(0, 1fr); align-items: baseline; gap: var(--tc-space-2, 8px); }
.ui-umix__swatch { width: var(--tc-space-2-5, 10px); height: var(--tc-space-2-5, 10px); border-radius: var(--tc-radius-2xs, 2px); transform: translateY(1px); }
.ui-umix__share { font-size: var(--tc-font-size-xl, 16px); font-weight: var(--tc-font-weight-semibold, 600); font-variant-numeric: tabular-nums; color: var(--tc-text-strong, light-dark(#171717, #f5f5f5)); line-height: var(--tc-line-height-normal, 20px); }
.ui-umix[data-look="clean"] .ui-umix__share { font-weight: var(--tc-font-weight-medium, 500); }
.ui-umix__kind-text { display: grid; }
.ui-umix__kind-label { font-weight: var(--tc-font-weight-medium, 500); }
.ui-umix__kind-meaning { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); }
.ui-umix__reading { display: grid; gap: var(--tc-space-1-5, 6px); padding: var(--tc-space-3, 12px); border-radius: var(--tc-radius-lg, 10px); background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113)); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-umix__reading p { margin: 0; }
.ui-umix__reading b { color: var(--tc-text-strong, light-dark(#171717, #f5f5f5)); font-weight: var(--tc-font-weight-semibold, 600); }
.ui-umix__caption { color: var(--tc-caption-color, light-dark(#646464, #9a9aa1)); font-size: var(--tc-caption-font-size, 12px); font-weight: var(--tc-caption-font-weight, 500); line-height: var(--tc-caption-line-height, 16px); letter-spacing: var(--tc-caption-tracking, 0); text-transform: var(--tc-caption-transform, none); }
.ui-umix__empty { margin: 0; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

@media (prefers-reduced-motion: reduce) { .ui-umix__seg { transition: none; } }
@media (forced-colors: active) { .ui-umix__seg, .ui-umix__swatch { forced-color-adjust: none; outline: 1px solid CanvasText; } .ui-umix__head-icon { border: 1px solid CanvasText; } }
`;

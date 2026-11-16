"use client";

import type { ComponentPropsWithoutRef, Ref } from "react";
import { RunInspector as TcRunInspector, type InspectorSpan, type Look, type RunInspectorLabels } from "@adamstavely/trenchcoat/react";

/*
 * Run Inspector – one multi-agent run on one screen: the run's numbers on top (status, duration, cost, tokens, calls,
 * errors), who started whom as a tree of agent cards, every agent's calls as small bars on its card, and a click on a
 * call opens it right under its row in the library's Tool Call Card, with its error first.
 * The block is the <tc-run-inspector> element through `@adamstavely/trenchcoat/react`. The look follows the nearest
 * <LookProvider>, or the `look` prop.
 */

export type { InspectorSpan, RunInspectorLabels } from "@adamstavely/trenchcoat/react";

type OwnProps = {
  /** The run as a Trace Waterfall span tree: agents and sub-agents are cards, their llm and tool children are calls */
  root: InspectorSpan;
  /** For a live run, ms since it started */
  elapsed?: number;
  /** Id of the open call (controlled) */
  selected?: string | null;
  /** The open call at first when uncontrolled */
  defaultSelected?: string | null;
  /** Called when a call opens or closes */
  onSelectedChange?: (selected: string | null, span: InspectorSpan | null) => void;
  /** How many calls each card shows before "Show N more" */
  callLimit?: number;
  /** Formats every cost – dollars by default */
  formatCost?: (amount: number) => string;
  /** The heading – "Run inspector" by default */
  title?: string;
  /** Rename any of the words */
  labels?: Partial<RunInspectorLabels>;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element – the <tc-run-inspector> element */
  ref?: Ref<HTMLDivElement>;
};

export type RunInspectorProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

export function RunInspector({ root, elapsed, selected, defaultSelected, onSelectedChange, callLimit, formatCost, title, labels, look, className, ref, ...rest }: RunInspectorProps) {
  return (
    <TcRunInspector
      {...(rest as object)}
      ref={ref as Ref<never>}
      className={["ui-rins", className].filter(Boolean).join(" ")}
      look={look}
      root={root}
      elapsed={elapsed}
      selected={selected}
      defaultSelected={defaultSelected}
      onSelectedChange={onSelectedChange}
      callLimit={callLimit}
      {...(formatCost ? { formatCost } : {})}
      title={title}
      labels={labels ?? {}}
    />
  );
}

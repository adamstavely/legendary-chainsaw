import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcExperimentCard, type ExperimentMetric, type ExperimentTone, type ExperimentVariant } from "../experiment-card";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { ExperimentMetric, ExperimentTone, ExperimentVariant } from "../experiment-card";

const RawExperimentCard = createComponent({
  tagName: "tc-experiment-card",
  elementClass: TcExperimentCard,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<{ open: boolean }>>,
    onTcMetricChange: "tc-metric-change" as EventName<CustomEvent<{ metric: string }>>,
    onTcWinnerChange: "tc-winner-change" as EventName<CustomEvent<{ winner: string | null }>>,
  },
});
type RawExperimentCardProps = React.ComponentProps<typeof RawExperimentCard>;
export type ExperimentCardProps = Omit<
  RawExperimentCardProps,
  "heading" | "variants" | "metrics" | "metric" | "winner" | "status" | "note" | "action" | "hint" | "trigger" | "open" | "onTcOpenChange" | "onTcMetricChange" | "onTcWinnerChange"
> & {
  title: string;
  variants: ExperimentVariant[];
  metrics: ExperimentMetric[];
  /** Controlled metric id */
  metric?: string;
  defaultMetric?: string;
  onMetricChange?: (id: string) => void;
  /** Controlled id of the variant picked as the winner */
  winner?: string | null;
  defaultWinner?: string | null;
  onWinnerChange?: (id: string | null) => void;
  /** The tag under the title, e.g. { label: "Running", tone: "green" } */
  status?: { label: string; tone?: ExperimentTone };
  /** Short text next to the status, e.g. "Day 9 of 14" */
  note?: string;
  /**
   * The button that appears on the tray (Clean: in the last row) once a winner is picked. `label` gets the picked
   * variant. `onClick` may return a promise: the button waits while it runs, and a rejection says so on the tray and
   * lets you try again
   */
  action?: { label: string | ((variant: ExperimentVariant) => string); onClick: (variant: ExperimentVariant) => void | Promise<unknown> };
  /** Replaces the line on the tray (Clean: in the last row) while nothing is hovered or picked */
  hint?: React.ReactNode;
  /** "hover" opens under the pointer (taps and the keyboard still toggle), "click" only on click */
  trigger?: "hover" | "click";
  /** Controlled open state */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** useControlled, plus the element's own value while uncontrolled – @lit/react sets every prop on each render */
function useValue<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const c = useControlled(value, defaultValue, onChange);
  const own = React.useRef(defaultValue);
  return {
    value: c.controlled ? c.value : own.current,
    handler: (next: T, e: Event) => {
      c.handler(next, e);
      if (!c.controlled) own.current = next;
    },
  };
}

export function ExperimentCard({
  title,
  metric,
  defaultMetric,
  onMetricChange,
  winner,
  defaultWinner = null,
  onWinnerChange,
  open,
  defaultOpen = false,
  onOpenChange,
  hint,
  trigger = "hover",
  note = "",
  ...props
}: ExperimentCardProps) {
  const o = useValue(open, defaultOpen, onOpenChange);
  const m = useValue<string | undefined>(metric, defaultMetric ?? props.metrics[0]?.id, (id) => id !== undefined && onMetricChange?.(id));
  const w = useValue<string | null>(winner, defaultWinner, onWinnerChange);
  const hintNode = isNode(hint) ? hint : null;
  const { stage, els } = useStaged(hintNode ? [["hint", hintNode]] : []);
  const hintValue = hintNode ? els.hint : typeof hint === "string" || typeof hint === "number" ? String(hint) : (hint as Element | undefined);
  return h(
    React.Fragment,
    null,
    stage,
    h(RawExperimentCard, {
      ...props,
      heading: title,
      note,
      trigger,
      hint: hintValue,
      open: o.value,
      metric: m.value,
      winner: w.value,
      onTcOpenChange: (e: CustomEvent<{ open: boolean }>) => o.handler(e.detail.open, e),
      onTcMetricChange: (e: CustomEvent<{ metric: string }>) => m.handler(e.detail.metric, e),
      onTcWinnerChange: (e: CustomEvent<{ winner: string | null }>) => w.handler(e.detail.winner, e),
    }),
  );
}

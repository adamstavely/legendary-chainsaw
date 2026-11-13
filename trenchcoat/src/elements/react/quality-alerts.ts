import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcQualityAlerts, type QualityAlertRule, type QualityAlertsChange } from "../quality-alerts";
import { h, useControlled } from "./internal";

export type { QualityAlertComparison, QualityAlertMetric, QualityAlertOption, QualityAlertRule, QualityAlertsLabels } from "../quality-alerts";
export { defaultQualityAlertsLabels, qualityAlertProblem, qualityAlertSentence } from "../quality-alerts";

const RawQualityAlerts = createComponent({
  tagName: "tc-quality-alerts",
  elementClass: TcQualityAlerts,
  react: React,
  events: {
    onTcRulesChange: "tc-rules-change" as EventName<CustomEvent<QualityAlertsChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawQualityAlerts>;
type Owned = "heading" | "rules" | "onTcRulesChange" | "children";
export type QualityAlertsProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The rules – controlled when given */
  rules?: QualityAlertRule[];
  /** The rules on mount when `rules` isn't controlled */
  defaultRules?: QualityAlertRule[];
  /** A rule was edited, added, removed or switched – with the whole list, the rule's id and what happened */
  onRulesChange?: (rules: QualityAlertRule[], id: string, change: QualityAlertsChange["change"]) => void;
};

export function QualityAlerts({ title, rules, defaultRules = [], onRulesChange, ...props }: QualityAlertsProps) {
  const r = useControlled<QualityAlertRule[]>(rules, defaultRules, undefined);
  return h(RawQualityAlerts, {
    ...props,
    heading: title ?? "Quality alerts",
    rules: r.value,
    onTcRulesChange: (e: CustomEvent<QualityAlertsChange>) => {
      r.handler(e.detail.rules, e);
      onRulesChange?.(e.detail.rules, e.detail.id, e.detail.change);
    },
  });
}

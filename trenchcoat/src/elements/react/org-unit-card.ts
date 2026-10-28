import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcOrgUnitCard, type OrgActionEvent, type OrgExpandedChange, type OrgItem, type OrgOpen } from "../org-unit-card";
import { h, useControlled } from "./internal";

export type { OrgAction, OrgHealth, OrgHealthCounts, OrgItem, OrgPerson, OrgStat, OrgTeam } from "../org-unit-card";
export { defaultOrgHealthLabels } from "../org-unit-card";

const RawOrgUnitCard = createComponent({
  tagName: "tc-org-unit-card",
  elementClass: TcOrgUnitCard,
  react: React,
  events: {
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<OrgExpandedChange>>,
    onTcAction: "tc-action" as EventName<CustomEvent<OrgActionEvent>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<OrgOpen>>,
  },
});
type RawProps = React.ComponentProps<typeof RawOrgUnitCard>;
type Owned = "heading" | "expanded" | "onTcExpandedChange" | "onTcAction" | "onTcOpen" | "children";
export type OrgUnitCardProps = Omit<RawProps, Owned> & {
  /** The unit's name, and the card's heading */
  title?: string;
  /** The open teams' ids – controlled when given */
  expanded?: string[];
  /** The teams open on mount when `expanded` isn't controlled */
  defaultExpanded?: string[];
  /** A team was opened or closed */
  onExpandedChange?: (expanded: string[]) => void;
  /** A header action was used */
  onAction?: (id: string) => void;
  /** An item was opened with Enter or a click */
  onOpen?: (team: string, item: OrgItem) => void;
};

const NONE: string[] = [];

export function OrgUnitCard({ title, expanded, defaultExpanded = NONE, onExpandedChange, onAction, onOpen, ...props }: OrgUnitCardProps) {
  const x = useControlled<string[]>(expanded, defaultExpanded, onExpandedChange);
  return h(RawOrgUnitCard, {
    ...props,
    heading: title ?? "",
    expanded: x.value,
    onTcExpandedChange: (e: CustomEvent<OrgExpandedChange>) => x.handler(e.detail.expanded, e),
    onTcAction: (e: CustomEvent<OrgActionEvent>) => onAction?.(e.detail.id),
    onTcOpen: (e: CustomEvent<OrgOpen>) => onOpen?.(e.detail.team, e.detail.item),
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcTeamRoster,
  type RosterAction,
  type RosterFilterChange,
  type RosterGroup,
  type RosterGroupChange,
  type RosterMember,
  type RosterSelectedChange,
  type RosterView,
  type RosterViewChange,
} from "../team-roster";
import { h, useControlled } from "./internal";

export type { RosterGroup, RosterMember, RosterStatus, RosterView } from "../team-roster";

const RawTeamRoster = createComponent({
  tagName: "tc-team-roster",
  elementClass: TcTeamRoster,
  react: React,
  events: {
    onTcGroupChange: "tc-group-change" as EventName<CustomEvent<RosterGroupChange>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<RosterFilterChange>>,
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<RosterViewChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<RosterSelectedChange>>,
    onTcAction: "tc-action" as EventName<CustomEvent<RosterAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTeamRoster>;
type Owned = "heading" | "groupBy" | "filter" | "view" | "selected" | "onTcGroupChange" | "onTcFilterChange" | "onTcViewChange" | "onTcSelectedChange" | "onTcAction" | "children";
export type TeamRosterProps = Omit<RawProps, Owned> & {
  /** The heading, and the roster's name */
  title?: string;
  /** How members are grouped – controlled when given */
  groupBy?: RosterGroup;
  /** The grouping on mount when `groupBy` isn't controlled */
  defaultGroupBy?: RosterGroup;
  /** The grouping changed */
  onGroupByChange?: (groupBy: RosterGroup) => void;
  /** The filter text – controlled when given */
  filter?: string;
  /** The filter on mount when `filter` isn't controlled */
  defaultFilter?: string;
  /** The filter changed */
  onFilterChange?: (filter: string) => void;
  /** List or grid – controlled when given */
  view?: RosterView;
  /** The view on mount when `view` isn't controlled */
  defaultView?: RosterView;
  /** The view changed */
  onViewChange?: (view: RosterView) => void;
  /** The selected member's id – controlled when given (null for none) */
  selected?: string | null;
  /** The selection on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A member was selected, or unselected */
  onSelectedChange?: (selected: string | null, member: RosterMember | null) => void;
  /** Message was pressed on a member */
  onMessage?: (member: RosterMember) => void;
};

export function TeamRoster({
  title,
  groupBy,
  defaultGroupBy = "team",
  onGroupByChange,
  filter,
  defaultFilter = "",
  onFilterChange,
  view,
  defaultView = "list",
  onViewChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  onMessage,
  ...props
}: TeamRosterProps) {
  const g = useControlled<RosterGroup>(groupBy, defaultGroupBy, onGroupByChange);
  const f = useControlled<string>(filter, defaultFilter, onFilterChange);
  const v = useControlled<RosterView>(view, defaultView, onViewChange);
  const member = React.useRef<RosterMember | null>(null);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? (next) => onSelectedChange(next, member.current) : undefined);
  return h(RawTeamRoster, {
    ...props,
    heading: title ?? "Team",
    groupBy: g.value,
    filter: f.value,
    view: v.value,
    selected: s.value,
    onTcGroupChange: (e: CustomEvent<RosterGroupChange>) => g.handler(e.detail.groupBy, e),
    onTcFilterChange: (e: CustomEvent<RosterFilterChange>) => f.handler(e.detail.filter, e),
    onTcViewChange: (e: CustomEvent<RosterViewChange>) => v.handler(e.detail.view, e),
    onTcSelectedChange: (e: CustomEvent<RosterSelectedChange>) => {
      member.current = e.detail.member;
      s.handler(e.detail.selected, e);
    },
    onTcAction: (e: CustomEvent<RosterAction>) => onMessage?.(e.detail.member),
  });
}

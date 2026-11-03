import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSessionList, type SessionArchive, type SessionItem, type SessionListAction, type SessionPin, type SessionQueryChange, type SessionSelectedChange } from "../session-list";
import { h, useControlled } from "./internal";

export type { SessionArchive, SessionGroupBy, SessionItem, SessionListAction, SessionListActionItem, SessionListLabels, SessionPin, SessionQueryChange, SessionSelectedChange, SessionStatus } from "../session-list";
export { defaultSessionListLabels } from "../session-list";

const RawSessionList = createComponent({
  tagName: "tc-session-list",
  elementClass: TcSessionList,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<SessionSelectedChange>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<SessionQueryChange>>,
    onTcPin: "tc-pin" as EventName<CustomEvent<SessionPin>>,
    onTcArchive: "tc-archive" as EventName<CustomEvent<SessionArchive>>,
    onTcCreate: "tc-create" as EventName<CustomEvent<Record<string, never>>>,
    onTcAction: "tc-action" as EventName<CustomEvent<SessionListAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSessionList>;
type Owned = "heading" | "selected" | "query" | "onTcSelectedChange" | "onTcQueryChange" | "children";
export type SessionListProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The open session's id – controlled when given */
  selected?: string | null;
  /** At first, when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** Another session was opened */
  onSelectedChange?: (selected: string | null, session?: SessionItem) => void;
  /** The filter's text – controlled when given */
  query?: string;
  /** At first, when `query` isn't controlled */
  defaultQuery?: string;
  /** The filter's text changed */
  onQueryChange?: (query: string) => void;
};

export function SessionList({ title = "Sessions", selected, defaultSelected = null, onSelectedChange, query, defaultQuery = "", onQueryChange, ...props }: SessionListProps) {
  const s = useControlled<string | null>(selected, defaultSelected, undefined);
  const q = useControlled<string>(query, defaultQuery, onQueryChange);
  return h(RawSessionList, {
    ...props,
    heading: title,
    selected: s.value,
    query: q.value,
    onTcSelectedChange: (e: CustomEvent<SessionSelectedChange>) => {
      s.handler(e.detail.selected, e);
      onSelectedChange?.(e.detail.selected, e.detail.session);
    },
    onTcQueryChange: (e: CustomEvent<SessionQueryChange>) => q.handler(e.detail.query, e),
  });
}

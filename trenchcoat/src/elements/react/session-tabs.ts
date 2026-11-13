import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSessionTabs, type SessionTab, type SessionTabsActiveChange, type SessionTabsClose, type SessionTabsOrderChange } from "../session-tabs";
import { h, useControlled } from "./internal";

export type { SessionTab, SessionTabStatus, SessionTabsActiveChange, SessionTabsClose, SessionTabsLabels, SessionTabsOrderChange } from "../session-tabs";
export { defaultSessionTabsLabels } from "../session-tabs";

const RawSessionTabs = createComponent({
  tagName: "tc-session-tabs",
  elementClass: TcSessionTabs,
  react: React,
  events: {
    onTcActiveChange: "tc-active-change" as EventName<CustomEvent<SessionTabsActiveChange>>,
    onTcOrderChange: "tc-order-change" as EventName<CustomEvent<SessionTabsOrderChange>>,
    onTcClose: "tc-close" as EventName<CustomEvent<SessionTabsClose>>,
    onTcNew: "tc-new" as EventName<CustomEvent<Record<string, never>>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSessionTabs>;
type Owned = "active" | "order" | "onTcActiveChange" | "onTcOrderChange" | "children";
export type SessionTabsProps = Omit<RawProps, Owned> & {
  /** The open tab's id – controlled when given */
  active?: string | null;
  /** At first, when `active` isn't controlled */
  defaultActive?: string | null;
  /** Another tab was opened */
  onActiveChange?: (active: string | null, tab?: SessionTab) => void;
  /** The tabs' ids in the order shown – controlled when given */
  order?: string[];
  /** At first, when `order` isn't controlled; empty follows `tabs` */
  defaultOrder?: string[];
  /** A tab was moved */
  onOrderChange?: (order: string[], id: string) => void;
};

const NO_ORDER: string[] = [];

export function SessionTabs({ active, defaultActive = null, onActiveChange, order, defaultOrder = NO_ORDER, onOrderChange, ...props }: SessionTabsProps) {
  const a = useControlled<string | null>(active, defaultActive, undefined);
  const o = useControlled<string[]>(order, defaultOrder, undefined);
  return h(RawSessionTabs, {
    ...props,
    active: a.value,
    order: o.value,
    onTcActiveChange: (e: CustomEvent<SessionTabsActiveChange>) => {
      a.handler(e.detail.active, e);
      onActiveChange?.(e.detail.active, e.detail.tab);
    },
    onTcOrderChange: (e: CustomEvent<SessionTabsOrderChange>) => {
      o.handler(e.detail.order, e);
      onOrderChange?.(e.detail.order, e.detail.id);
    },
  });
}

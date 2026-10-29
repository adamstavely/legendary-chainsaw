import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPersonHovercard, type HovercardActionDetail, type HovercardLookupDetail, type HovercardOpenChange, type HovercardOpenDetail, type HovercardPerson } from "../person-hovercard";
import { h } from "./internal";

export type { HovercardAction, HovercardPerson, HovercardResolver, HovercardStatus } from "../person-hovercard";

const RawPersonHovercard = createComponent({
  tagName: "tc-person-hovercard",
  elementClass: TcPersonHovercard,
  react: React,
  events: {
    onTcPersonLookup: "tc-person-lookup" as EventName<CustomEvent<HovercardLookupDetail>>,
    onTcAction: "tc-action" as EventName<CustomEvent<HovercardActionDetail>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<HovercardOpenDetail>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<HovercardOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPersonHovercard>;
type Owned = "onTcPersonLookup" | "onTcAction" | "onTcOpen" | "onTcOpenChange";
export type PersonHovercardProps = Omit<RawProps, Owned> & {
  /** The card needs a person's details; answer with `detail.respondWith(person)` */
  onPersonLookup?: (detail: HovercardLookupDetail, event: CustomEvent<HovercardLookupDetail>) => void;
  /** Message was pressed */
  onMessage?: (person: HovercardPerson) => void;
  /** View profile was pressed */
  onViewProfile?: (person: HovercardPerson) => void;
  /** The card opened or closed */
  onCardOpenChange?: (open: boolean) => void;
};

export function PersonHovercard({ onPersonLookup, onMessage, onViewProfile, onCardOpenChange, ...props }: PersonHovercardProps) {
  return h(RawPersonHovercard, {
    ...props,
    onTcPersonLookup: (e: CustomEvent<HovercardLookupDetail>) => onPersonLookup?.(e.detail, e),
    onTcAction: (e: CustomEvent<HovercardActionDetail>) => onMessage?.(e.detail.person),
    onTcOpen: (e: CustomEvent<HovercardOpenDetail>) => onViewProfile?.(e.detail.person),
    onTcOpenChange: (e: CustomEvent<HovercardOpenChange>) => onCardOpenChange?.(e.detail.open),
  });
}

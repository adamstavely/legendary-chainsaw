import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcHandoffBrief,
  type HandoffBriefAccept,
  type HandoffBriefAccess,
  type HandoffBriefAccessRequest,
  type HandoffBriefAcknowledgedChange,
  type HandoffBriefSection,
} from "../handoff-brief";
import { h, useControlled } from "./internal";

export type {
  HandoffBriefAccess,
  HandoffBriefAccessResolver,
  HandoffBriefItem,
  HandoffBriefPerson,
  HandoffBriefRequest,
  HandoffBriefSection,
} from "../handoff-brief";

const RawHandoffBrief = createComponent({
  tagName: "tc-handoff-brief",
  elementClass: TcHandoffBrief,
  react: React,
  events: {
    onTcAcknowledgedChange: "tc-acknowledged-change" as EventName<CustomEvent<HandoffBriefAcknowledgedChange>>,
    onTcAccessRequest: "tc-access-request" as EventName<CustomEvent<HandoffBriefAccessRequest>>,
    onTcAccept: "tc-accept" as EventName<CustomEvent<HandoffBriefAccept>>,
  },
});
type RawProps = React.ComponentProps<typeof RawHandoffBrief>;
type Owned = "heading" | "acknowledged" | "accepted" | "onTcAcknowledgedChange" | "onTcAccessRequest" | "onTcAccept" | "children";
export type HandoffBriefProps = Omit<RawProps, Owned> & {
  /** The heading, and the group's name */
  title?: string;
  /** The sections acknowledged – controlled when given */
  acknowledged?: HandoffBriefSection[];
  /** The sections acknowledged at first, when `acknowledged` isn't set */
  defaultAcknowledged?: HandoffBriefSection[];
  /** Called with the acknowledged sections whenever one is acknowledged or un-acknowledged */
  onAcknowledgedChange?: (acknowledged: HandoffBriefSection[]) => void;
  /** Called when Request access (or Retry) is pressed; call `event.preventDefault()` to set `accessRequest` yourself */
  onRequestAccess?: (items: HandoffBriefAccess[], event: CustomEvent<HandoffBriefAccessRequest>) => void;
  /** Whether the receiver has accepted – controlled when given */
  accepted?: boolean;
  /** Whether it starts accepted, when `accepted` isn't set */
  defaultAccepted?: boolean;
  /** Called when the receiver accepts the handoff */
  onAccept?: () => void;
};
const NONE: HandoffBriefSection[] = [];

export function HandoffBrief({
  title,
  acknowledged,
  defaultAcknowledged = NONE,
  onAcknowledgedChange,
  onRequestAccess,
  accepted,
  defaultAccepted = false,
  onAccept,
  ...props
}: HandoffBriefProps) {
  const a = useControlled(acknowledged, defaultAcknowledged, onAcknowledgedChange);
  const acc = useControlled(accepted, defaultAccepted, onAccept ? () => onAccept() : undefined);
  return h(RawHandoffBrief, {
    ...props,
    heading: title ?? "Handoff",
    acknowledged: a.value,
    accepted: acc.value,
    onTcAcknowledgedChange: (e: CustomEvent<HandoffBriefAcknowledgedChange>) => a.handler(e.detail.acknowledged, e),
    onTcAccessRequest: (e: CustomEvent<HandoffBriefAccessRequest>) => onRequestAccess?.(e.detail.items, e),
    onTcAccept: (e: CustomEvent<HandoffBriefAccept>) => acc.handler(true, e),
  });
}

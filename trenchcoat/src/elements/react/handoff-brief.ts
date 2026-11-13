import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcHandoffBrief,
  type HandoffBriefAccept,
  type HandoffBriefAccess,
  type HandoffBriefAccessRequest,
  type HandoffBriefAcknowledgedChange,
  type HandoffBriefHandoff,
  type HandoffBriefHandoffCancel,
  type HandoffBriefHandoffState,
  type HandoffBriefHandoffToChange,
  type HandoffBriefPauseChange,
  type HandoffBriefPerson,
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
  HandoffBriefRun,
  HandoffBriefRunStatus,
  HandoffBriefHandoff,
  HandoffBriefHandoffCancel,
  HandoffBriefHandoffState,
} from "../handoff-brief";
export { defaultHandoffTakesOver } from "../handoff-brief";

const RawHandoffBrief = createComponent({
  tagName: "tc-handoff-brief",
  elementClass: TcHandoffBrief,
  react: React,
  events: {
    onTcAcknowledgedChange: "tc-acknowledged-change" as EventName<CustomEvent<HandoffBriefAcknowledgedChange>>,
    onTcAccessRequest: "tc-access-request" as EventName<CustomEvent<HandoffBriefAccessRequest>>,
    onTcAccept: "tc-accept" as EventName<CustomEvent<HandoffBriefAccept>>,
    onTcHandoffToChange: "tc-handoff-to-change" as EventName<CustomEvent<HandoffBriefHandoffToChange>>,
    onTcPauseUntilAcceptedChange: "tc-pause-until-accepted-change" as EventName<CustomEvent<HandoffBriefPauseChange>>,
    onTcHandoff: "tc-handoff" as EventName<CustomEvent<HandoffBriefHandoff>>,
    onTcHandoffCancel: "tc-handoff-cancel" as EventName<CustomEvent<HandoffBriefHandoffCancel>>,
  },
});
type RawProps = React.ComponentProps<typeof RawHandoffBrief>;
type Owned =
  | "heading"
  | "acknowledged"
  | "accepted"
  | "handoffTo"
  | "pauseUntilAccepted"
  | "handoffState"
  | "onTcAcknowledgedChange"
  | "onTcAccessRequest"
  | "onTcAccept"
  | "onTcHandoffToChange"
  | "onTcPauseUntilAcceptedChange"
  | "onTcHandoff"
  | "onTcHandoffCancel"
  | "children";
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
  /** The run's receiver (a person's id, or name) – controlled when given */
  handoffTo?: string;
  /** The receiver chosen at first, when `handoffTo` isn't set */
  defaultHandoffTo?: string;
  /** Called with the receiver whenever one is chosen */
  onHandoffToChange?: (handoffTo: string, person: HandoffBriefPerson | undefined) => void;
  /** Whether the run pauses until the receiver accepts – controlled when given */
  pauseUntilAccepted?: boolean;
  /** Whether it pauses at first, when `pauseUntilAccepted` isn't set (default true) */
  defaultPauseUntilAccepted?: boolean;
  /** Called when the pause choice changes */
  onPauseUntilAcceptedChange?: (pauseUntilAccepted: boolean) => void;
  /** Where the run's handoff stands – controlled when given */
  handoffState?: HandoffBriefHandoffState;
  /** Called when Hand off is pressed; return false to keep the card as it is */
  onHandoff?: (handoff: HandoffBriefHandoff) => boolean | void;
  /** Called when Cancel handoff is pressed; return false to keep waiting */
  onHandoffCancel?: (detail: HandoffBriefHandoffCancel) => boolean | void;
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
  handoffTo,
  defaultHandoffTo = "",
  onHandoffToChange,
  pauseUntilAccepted,
  defaultPauseUntilAccepted = true,
  onPauseUntilAcceptedChange,
  handoffState,
  onHandoff,
  onHandoffCancel,
  ...props
}: HandoffBriefProps) {
  const a = useControlled(acknowledged, defaultAcknowledged, onAcknowledgedChange);
  const acc = useControlled(accepted, defaultAccepted, onAccept ? () => onAccept() : undefined);
  const person = React.useRef<HandoffBriefPerson | undefined>(undefined);
  const to = useControlled(handoffTo, defaultHandoffTo, onHandoffToChange ? (next) => onHandoffToChange(next, person.current) : undefined);
  const pause = useControlled(pauseUntilAccepted, defaultPauseUntilAccepted, onPauseUntilAcceptedChange);
  const [ownState, setOwnState] = React.useState<HandoffBriefHandoffState>("");
  const state = handoffState ?? ownState;
  return h(RawHandoffBrief, {
    ...props,
    heading: title ?? "Handoff",
    acknowledged: a.value,
    accepted: acc.value,
    onTcAcknowledgedChange: (e: CustomEvent<HandoffBriefAcknowledgedChange>) => a.handler(e.detail.acknowledged, e),
    onTcAccessRequest: (e: CustomEvent<HandoffBriefAccessRequest>) => onRequestAccess?.(e.detail.items, e),
    onTcAccept: (e: CustomEvent<HandoffBriefAccept>) => acc.handler(true, e),
    handoffTo: to.value,
    pauseUntilAccepted: pause.value,
    handoffState: state,
    onTcHandoffToChange: (e: CustomEvent<HandoffBriefHandoffToChange>) => {
      person.current = e.detail.person;
      to.handler(e.detail.handoffTo, e);
    },
    onTcPauseUntilAcceptedChange: (e: CustomEvent<HandoffBriefPauseChange>) => pause.handler(e.detail.pauseUntilAccepted, e),
    onTcHandoff: (e: CustomEvent<HandoffBriefHandoff>) => {
      if (onHandoff?.(e.detail) === false || handoffState !== undefined) e.preventDefault();
      else setOwnState("sent");
    },
    onTcHandoffCancel: (e: CustomEvent<HandoffBriefHandoffCancel>) => {
      if (onHandoffCancel?.(e.detail) === false || handoffState !== undefined) e.preventDefault();
      else setOwnState("");
    },
  });
}

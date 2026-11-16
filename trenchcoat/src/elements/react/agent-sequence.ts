import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentSequence, type AgentSequenceOpenChange, type SequenceMessage, type SequenceParticipant as SequenceParticipantData } from "../agent-sequence";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { AgentSequenceLabels, AgentSequenceOpenChange, SequenceActivation, SequenceGroup, SequenceGroupKind, SequenceMessage, SequenceMessageKind, SequenceParticipantKind } from "../agent-sequence";
export { defaultAgentSequenceLabels, sequenceActivations } from "../agent-sequence";
/** A participant's icon may be a React node as well as an element */
export type SequenceParticipant = Omit<SequenceParticipantData, "icon"> & { icon?: React.ReactNode | Element };

const RawAgentSequence = createComponent({
  tagName: "tc-agent-sequence",
  elementClass: TcAgentSequence,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<AgentSequenceOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAgentSequence>;
type Owned = "heading" | "participants" | "openId" | "onTcOpenChange" | "children";
export type AgentSequenceProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The lifelines, left to right: you, the agents and the tools */
  participants: SequenceParticipant[];
  /** Controlled id of the message or participant whose details are open */
  openId?: string | null;
  /** The open id on mount when `openId` isn't controlled */
  defaultOpenId?: string | null;
  /** Called when details open (with the message or participant) or close (null) */
  onOpenChange?: (openId: string | null, item?: SequenceMessage | SequenceParticipant) => void;
};

export function AgentSequence({ title = "Agent sequence", participants, openId, defaultOpenId = null, onOpenChange, ...props }: AgentSequenceProps) {
  const { stage, els } = useStaged(participants.filter((p) => isNode(p.icon)).map((p) => [p.id, p.icon as React.ReactNode]));
  const data = React.useMemo(() => participants.map((p): SequenceParticipantData => ({ ...p, icon: isNode(p.icon) ? els[p.id] : (p.icon as Element | undefined) })), [participants, els]);
  const messages = props.messages;
  const o = useControlled<string | null>(
    openId,
    defaultOpenId,
    onOpenChange && ((id) => onOpenChange(id, id ? (messages?.find((m) => m.id === id) ?? participants.find((p) => p.id === id)) : undefined)),
  );
  return h(
    React.Fragment,
    null,
    stage,
    h(RawAgentSequence, {
      ...props,
      heading: title,
      participants: data,
      openId: o.value,
      onTcOpenChange: (e: CustomEvent<AgentSequenceOpenChange>) => o.handler(e.detail.openId, e),
    }),
  );
}

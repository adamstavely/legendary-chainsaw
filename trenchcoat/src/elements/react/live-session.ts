import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcLiveSession, type LiveSessionAgentChange } from "../live-session";
import type { CollabParticipant } from "../collaboration-stream";
import { h, useControlled } from "./internal";

export type { LiveSessionMessage, LiveSessionParticipant, LiveSessionSend, LiveSessionAgentChange, LiveSessionLabels, LiveSessionStep } from "../live-session";
export { defaultLiveSessionLabels } from "../live-session";

const RawLiveSession = createComponent({
  tagName: "tc-live-session",
  elementClass: TcLiveSession,
  react: React,
  events: {
    onTcAgentChange: "tc-agent-change" as EventName<CustomEvent<LiveSessionAgentChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawLiveSession>;
type Owned = "heading" | "agent" | "onTcAgentChange" | "children";
export type LiveSessionProps = Omit<RawProps, Owned> & {
  /** The heading (default "Live session") */
  title?: string;
  /** The picked agent's id, or null for the whole team. Controlled when defined */
  agent?: string | null;
  /** The agent at first when uncontrolled – the whole team by default */
  defaultAgent?: string | null;
  /** Called with the picked agent (null for the whole team) */
  onAgentChange?: (agent: string | null, participant: CollabParticipant | null) => void;
};

export function LiveSession({ title, agent, defaultAgent = null, onAgentChange, ...props }: LiveSessionProps) {
  const who = React.useRef<CollabParticipant | null>(null);
  const a = useControlled(agent, defaultAgent, onAgentChange ? (next) => onAgentChange(next, who.current) : undefined);
  return h(RawLiveSession, {
    ...props,
    heading: title ?? "Live session",
    agent: a.value,
    onTcAgentChange: (e: CustomEvent<LiveSessionAgentChange>) => {
      who.current = e.detail.participant;
      a.handler(e.detail.agent, e);
    },
  });
}

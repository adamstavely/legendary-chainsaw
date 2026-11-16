"use client";

import type { ComponentPropsWithoutRef, Ref } from "react";
import {
  LiveSession as TcLiveSession,
  type LiveSessionLabels,
  type LiveSessionMessage,
  type LiveSessionParticipant,
  type LiveSessionSend,
  type LiveSessionStep,
  type Look,
} from "@adamstavely/trenchcoat/react";

/*
 * Live Session – work with a team of agents while they work: their conversation in the middle, in the library's
 * Collaboration Stream with its composer; the team's plan ticking off beside it; how full the shared context is under
 * the plan, in the library's Meter Row. Picking an agent points at its steps in the plan and its messages in the
 * stream. Narrow, the plan goes under the stream.
 * The block is the <tc-live-session> element through `@adamstavely/trenchcoat/react`. The look follows the nearest
 * <LookProvider>, or the `look` prop.
 */

export type { LiveSessionLabels, LiveSessionMessage, LiveSessionParticipant, LiveSessionSend, LiveSessionStep } from "@adamstavely/trenchcoat/react";

type OwnProps = {
  /** You and the agents */
  participants: LiveSessionParticipant[];
  /** What they said */
  messages: LiveSessionMessage[];
  /** The team's plan, in order */
  steps: LiveSessionStep[];
  /** Your participant id – "you" by default */
  you?: string;
  /** Runs when you send a message or an answer; it may return a promise */
  onSend?: (message: LiveSessionSend) => void | Promise<unknown>;
  /** How full the shared context is, from 0 to 1 */
  context?: number;
  /** The meter's value in words, e.g. "124k of 200k tokens" */
  contextText?: string;
  /** The picked agent's id, or null for the whole team (controlled) */
  agent?: string | null;
  /** The agent at first when uncontrolled */
  defaultAgent?: string | null;
  /** Called with the picked agent */
  onAgentChange?: (agent: string | null, participant: LiveSessionParticipant | null) => void;
  /** The heading – "Live session" by default */
  title?: string;
  /** Rename any of the words */
  labels?: Partial<LiveSessionLabels>;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element – the <tc-live-session> element */
  ref?: Ref<HTMLDivElement>;
};

export type LiveSessionProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

export function LiveSession({ participants, messages, steps, you, onSend, context, contextText, agent, defaultAgent, onAgentChange, title, labels, look, className, ref, ...rest }: LiveSessionProps) {
  return (
    <TcLiveSession
      {...(rest as object)}
      ref={ref as Ref<never>}
      className={["ui-lses", className].filter(Boolean).join(" ")}
      look={look}
      participants={participants}
      messages={messages}
      steps={steps}
      you={you ?? "you"}
      onSend={onSend}
      context={context}
      contextText={contextText ?? ""}
      agent={agent}
      defaultAgent={defaultAgent}
      onAgentChange={onAgentChange}
      title={title}
      labels={labels ?? {}}
    />
  );
}

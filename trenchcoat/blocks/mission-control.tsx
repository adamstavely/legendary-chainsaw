"use client";

import type { ComponentPropsWithoutRef, Ref } from "react";
import {
  MissionControl as TcMissionControl,
  type Look,
  type MissionAgent,
  type MissionDecision,
  type MissionEvent,
  type MissionFilter,
  type MissionLabels,
} from "@adamstavely/trenchcoat/react";

/*
 * Mission Control – the home of an agent product: every agent at a glance. On top, what happened since you looked as
 * a small chart and a line in words; in the middle, who runs under whom in the library's Agent Tree; on the side,
 * what needs you in the library's Decision Inbox. One status filter – All, Running, Waiting, Failed – applies to all
 * three. Narrow, it stacks with what needs you first.
 * The block is the <tc-mission-control> element through `@adamstavely/trenchcoat/react` – the same component Angular, Vue and
 * plain HTML get. The look follows the nearest <LookProvider>, or the `look` prop.
 */

export type { MissionAgent, MissionDecision, MissionEvent, MissionFilter, MissionLabels } from "@adamstavely/trenchcoat/react";

type OwnProps = {
  /** The orchestrator, with its sub-agents as `children` */
  root: MissionAgent;
  /** What happened since you looked; `agentId` ties an event to an agent */
  events?: MissionEvent[];
  /** The decisions waiting on you; `agentId` ties one to the agent that asks */
  decisions?: MissionDecision[];
  /** Since when, epoch ms */
  since?: number;
  /** The end of the period, epoch ms */
  now?: number;
  /** Which agents show (controlled) */
  filter?: MissionFilter;
  /** The filter at first when uncontrolled – "all" by default */
  defaultFilter?: MissionFilter;
  /** Called with the new filter */
  onFilterChange?: (filter: MissionFilter) => void;
  /** A click on an agent card */
  onSelectAgent?: (agent: MissionAgent) => void;
  /** A decision on the side was answered; it may return a promise */
  onDecide?: (decision: MissionDecision, answer: "primary" | "secondary") => void | Promise<unknown>;
  /** The heading – "Mission control" by default */
  title?: string;
  /** Rename any of the words */
  labels?: Partial<MissionLabels>;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element – the <tc-mission-control> element */
  ref?: Ref<HTMLDivElement>;
};

export type MissionControlProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

export function MissionControl({ root, events = [], decisions = [], since, now, filter, defaultFilter, onFilterChange, onSelectAgent, onDecide, title, labels, look, className, ref, ...rest }: MissionControlProps) {
  return (
    <TcMissionControl
      // The block's DOM props land on the element, its root
      {...(rest as object)}
      ref={ref as Ref<never>}
      className={["ui-mctl", className].filter(Boolean).join(" ")}
      look={look}
      root={root}
      events={events}
      decisions={decisions}
      since={since}
      now={now}
      filter={filter}
      defaultFilter={defaultFilter}
      onFilterChange={onFilterChange}
      onSelectAgent={onSelectAgent}
      onDecide={onDecide}
      title={title}
      labels={labels ?? {}}
    />
  );
}

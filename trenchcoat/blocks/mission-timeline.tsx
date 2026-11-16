"use client";

import type { ComponentPropsWithoutRef, Ref } from "react";
import {
  MissionTimeline as TcMissionTimeline,
  type Look,
  type MissionLaneAgent,
  type MissionLaneTask,
  type MissionDecision,
  type MissionEvent,
  type MissionFilter,
  type MissionLabels,
} from "@adamstavely/trenchcoat/react";

/*
 * Mission Timeline – the home of an agent product on one clock. The same frame as Mission Control – what happened
 * since you looked on top, what needs you on the side, one status filter for all three – with every agent on its own
 * lane of a live timeline in the middle, in the library's Agent Lanes. Narrow, it stacks with what needs you first.
 * The block is the <tc-mission-timeline> element through `@adamstavely/trenchcoat/react`. The look follows the nearest
 * <LookProvider>, or the `look` prop.
 */

export type { MissionDecision, MissionLaneAgent, MissionLaneTask, MissionEvent, MissionFilter, MissionLabels } from "@adamstavely/trenchcoat/react";

type OwnProps = {
  /** One lane per agent */
  agents: MissionLaneAgent[];
  /** The agents' tasks */
  tasks: MissionLaneTask[];
  /** What happened since you looked; `agentId` ties an event to an agent */
  events?: MissionEvent[];
  /** The decisions waiting on you; `agentId` ties one to the agent that asks */
  decisions?: MissionDecision[];
  /** Since when, epoch ms */
  since?: number;
  /** The time now, epoch ms – the timeline keeps its own clock when unset */
  now?: number;
  /** How much time the timeline shows, in ms */
  span?: number;
  /** Which agents show (controlled) */
  filter?: MissionFilter;
  /** The filter at first when uncontrolled – "all" by default */
  defaultFilter?: MissionFilter;
  /** Called with the new filter */
  onFilterChange?: (filter: MissionFilter) => void;
  /** Approve or reject a waiting task; each may return a promise */
  onApprove?: (task: MissionLaneTask) => void | Promise<unknown>;
  onReject?: (task: MissionLaneTask) => void | Promise<unknown>;
  /** "Open" in a task's details – shown when given */
  onOpenTask?: (task: MissionLaneTask) => void;
  /** A decision on the side was answered; it may return a promise */
  onDecide?: (decision: MissionDecision, answer: "primary" | "secondary") => void | Promise<unknown>;
  /** The heading – "Mission timeline" by default */
  title?: string;
  /** Rename any of the words */
  labels?: Partial<MissionLabels>;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element – the <tc-mission-timeline> element */
  ref?: Ref<HTMLDivElement>;
};

export type MissionTimelineProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

export function MissionTimeline({ agents, tasks, events = [], decisions = [], since, now, span = 30 * 60_000, filter, defaultFilter, onFilterChange, onApprove, onReject, onOpenTask, onDecide, title, labels, look, className, ref, ...rest }: MissionTimelineProps) {
  return (
    <TcMissionTimeline
      {...(rest as object)}
      ref={ref as Ref<never>}
      className={["ui-mtl", className].filter(Boolean).join(" ")}
      look={look}
      agents={agents}
      tasks={tasks}
      events={events}
      decisions={decisions}
      since={since}
      now={now}
      span={span}
      filter={filter}
      defaultFilter={defaultFilter}
      onFilterChange={onFilterChange}
      onApprove={onApprove}
      onReject={onReject}
      onOpenTask={onOpenTask}
      onDecide={onDecide}
      title={title}
      labels={labels ?? {}}
    />
  );
}

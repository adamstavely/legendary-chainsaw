import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcAgentCrew,
  type AgentCrewAgentEvent,
  type AgentCrewOpenedChange,
  type AgentCrewProjectChange,
  type AgentCrewSteer,
  type CrewAgent,
  type CrewProject,
} from "../agent-crew";
import { h, useControlled } from "./internal";

export type {
  AgentCrewAgentEvent,
  AgentCrewLabels,
  AgentCrewOpenedChange,
  AgentCrewProjectChange,
  AgentCrewSteer,
  CrewAgent,
  CrewAgentStatus,
  CrewHandoff,
  CrewProject,
} from "../agent-crew";
export { defaultAgentCrewLabels } from "../agent-crew";

const RawAgentCrew = createComponent({
  tagName: "tc-agent-crew",
  elementClass: TcAgentCrew,
  react: React,
  events: {
    onTcProjectChange: "tc-project-change" as EventName<CustomEvent<AgentCrewProjectChange>>,
    onTcOpenedChange: "tc-opened-change" as EventName<CustomEvent<AgentCrewOpenedChange>>,
    onTcSteer: "tc-steer" as EventName<CustomEvent<AgentCrewSteer>>,
    onTcPause: "tc-pause" as EventName<CustomEvent<AgentCrewAgentEvent>>,
    onTcResume: "tc-resume" as EventName<CustomEvent<AgentCrewAgentEvent>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAgentCrew>;
export type AgentCrewProps = Omit<
  RawProps,
  "heading" | "project" | "opened" | "onTcProjectChange" | "onTcOpenedChange" | "onTcSteer" | "onTcPause" | "onTcResume" | "children"
> & {
  /** The heading; "" leaves the header out (default "Crew") */
  title?: string;
  /** The shown project's id – controlled when given */
  project?: string | null;
  /** The project shown at first, when `project` isn't controlled */
  defaultProject?: string | null;
  /** A project tab was chosen */
  onProjectChange?: (project: string | null, item?: CrewProject) => void;
  /** The agent whose detail is open – controlled when given */
  opened?: string | null;
  /** The agent open at first, when `opened` isn't controlled */
  defaultOpened?: string | null;
  /** An agent's detail was opened or closed */
  onOpenedChange?: (opened: string | null, agent: CrewAgent | null) => void;
  /** A note to steer an agent; return false to keep the note in the field */
  onSteer?: (agent: CrewAgent, note: string) => void | boolean;
  /** Pause was pressed for an agent */
  onPauseAgent?: (agent: CrewAgent) => void;
  /** Resume was pressed for an agent */
  onResumeAgent?: (agent: CrewAgent) => void;
};

/** A lead agent and its sub-agents as one live tree of cards – what each does now, its context, tools and last handoff */
export function AgentCrew({
  title,
  project,
  defaultProject = null,
  onProjectChange,
  opened,
  defaultOpened = null,
  onOpenedChange,
  onSteer,
  onPauseAgent,
  onResumeAgent,
  ...props
}: AgentCrewProps) {
  const item = React.useRef<CrewProject | undefined>(undefined);
  const agent = React.useRef<CrewAgent | null>(null);
  const p = useControlled<string | null>(project, defaultProject, onProjectChange ? (next) => onProjectChange(next, item.current) : undefined);
  const o = useControlled<string | null>(opened, defaultOpened, onOpenedChange ? (next) => onOpenedChange(next, agent.current) : undefined);
  return h(RawAgentCrew, {
    ...props,
    heading: title ?? "Crew",
    project: p.value,
    opened: o.value,
    onTcProjectChange: (e: CustomEvent<AgentCrewProjectChange>) => {
      item.current = e.detail.item;
      p.handler(e.detail.project, e);
    },
    onTcOpenedChange: (e: CustomEvent<AgentCrewOpenedChange>) => {
      agent.current = e.detail.agent;
      o.handler(e.detail.opened, e);
    },
    onTcSteer: (e: CustomEvent<AgentCrewSteer>) => {
      if (onSteer?.(e.detail.agent, e.detail.note) === false) e.preventDefault();
    },
    onTcPause: (e: CustomEvent<AgentCrewAgentEvent>) => onPauseAgent?.(e.detail.agent),
    onTcResume: (e: CustomEvent<AgentCrewAgentEvent>) => onResumeAgent?.(e.detail.agent),
  });
}

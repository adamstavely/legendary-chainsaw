import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentSteering } from "../agent-steering";
import { h, useControlled } from "./internal";

export type { SteerNote, SteerRunStatus, SteerStep, SteerStepStatus } from "../agent-steering";

const RawAgentSteering = createComponent({
  tagName: "tc-agent-steering",
  elementClass: TcAgentSteering,
  react: React,
  events: {
    onTcDraftChange: "tc-draft-change" as EventName<CustomEvent<{ draft: string }>>,
    onTcRemove: "tc-remove" as EventName<CustomEvent<{ id: string }>>,
    onTcPause: "tc-pause" as EventName<CustomEvent<null>>,
    onTcResume: "tc-resume" as EventName<CustomEvent<null>>,
  },
});
type RawAgentSteeringProps = React.ComponentProps<typeof RawAgentSteering>;
export type AgentSteeringProps = Omit<
  RawAgentSteeringProps,
  "heading" | "draft" | "removable" | "pausable" | "resumable" | "onInterrupt" | "onTcDraftChange" | "onTcRemove" | "onTcPause" | "onTcResume"
> & {
  /** What the agent is working on, e.g. "Migrate users table" */
  title: string;
  /** ⌘↵ in the field, or "Now" on a queued note (then with its id): apply it to the active step right away. May
   *  return a promise, like onQueue */
  onInterrupt?: (text: string, queuedId?: string) => void | Promise<unknown>;
  /** The text in the field. Controlled when defined – pair with onDraftChange; otherwise the component keeps it,
   *  starting from `defaultDraft` */
  draft?: string;
  defaultDraft?: string;
  onDraftChange?: (text: string) => void;
  /** ✕ on a queued note */
  onRemove?: (id: string) => void;
  /** Shows Pause / Resume in the header */
  onPause?: () => void;
  onResume?: () => void;
};

export function AgentSteering({ title, draft, defaultDraft = "", onDraftChange, onInterrupt, onRemove, onPause, onResume, ...props }: AgentSteeringProps) {
  const d = useControlled(draft, defaultDraft, onDraftChange);
  return h(RawAgentSteering, {
    ...props,
    heading: title,
    draft: d.value,
    onInterrupt: onInterrupt as ((text: string, queuedId?: string) => void | Promise<unknown>) | undefined,
    removable: !!onRemove,
    pausable: !!onPause,
    resumable: !!onResume,
    onTcDraftChange: (e: CustomEvent<{ draft: string }>) => d.handler(e.detail.draft, e),
    onTcRemove: (e: CustomEvent<{ id: string }>) => onRemove?.(e.detail.id),
    onTcPause: () => onPause?.(),
    onTcResume: () => onResume?.(),
  });
}

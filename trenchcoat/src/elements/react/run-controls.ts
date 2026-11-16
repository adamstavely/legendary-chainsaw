import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcRunControls,
  type RunControlsMode,
  type RunControlsModeChange,
  type RunControlsPermission,
  type RunControlsPermissionChange,
  type RunControlsQueueChange,
  type RunControlsResume,
  type RunControlsSend,
  type RunControlsState,
  type RunControlsStateChange,
  type RunControlsSteer,
  type RunControlsStop,
} from "../run-controls";
import { h, useControlled } from "./internal";

export type {
  RunControlsLabels,
  RunControlsMode,
  RunControlsModeChange,
  RunControlsPermission,
  RunControlsPermissionChange,
  RunControlsQueueChange,
  RunControlsResume,
  RunControlsSend,
  RunControlsState,
  RunControlsStateChange,
  RunControlsSteer,
  RunControlsStop,
} from "../run-controls";
export { defaultRunControlsLabels } from "../run-controls";

const RawRunControls = createComponent({
  tagName: "tc-run-controls",
  elementClass: TcRunControls,
  react: React,
  events: {
    onTcSend: "tc-send" as EventName<CustomEvent<RunControlsSend>>,
    onTcSteer: "tc-steer" as EventName<CustomEvent<RunControlsSteer>>,
    onTcStop: "tc-stop" as EventName<CustomEvent<RunControlsStop>>,
    onTcResume: "tc-resume" as EventName<CustomEvent<RunControlsResume>>,
    onTcRetry: "tc-retry" as EventName<CustomEvent<Record<string, never>>>,
    onTcDismiss: "tc-dismiss" as EventName<CustomEvent<Record<string, never>>>,
    onTcStateChange: "tc-state-change" as EventName<CustomEvent<RunControlsStateChange>>,
    onTcModeChange: "tc-mode-change" as EventName<CustomEvent<RunControlsModeChange>>,
    onTcPermissionChange: "tc-permission-change" as EventName<CustomEvent<RunControlsPermissionChange>>,
    onTcQueueChange: "tc-queue-change" as EventName<CustomEvent<RunControlsQueueChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRunControls>;
export type RunControlsProps = Omit<
  RawProps,
  | "heading"
  | "state"
  | "mode"
  | "permission"
  | "queue"
  | "onTcSend"
  | "onTcSteer"
  | "onTcStop"
  | "onTcResume"
  | "onTcRetry"
  | "onTcDismiss"
  | "onTcStateChange"
  | "onTcModeChange"
  | "onTcPermissionChange"
  | "onTcQueueChange"
  | "children"
> & {
  /** A heading for the card; "" (the default) leaves the header out */
  title?: string;
  /** Where the run is – controlled when given */
  state?: RunControlsState;
  /** Where the run is at first, when `state` isn't controlled */
  defaultState?: RunControlsState;
  /** The controls moved the run to another state */
  onStateChange?: (state: RunControlsState) => void;
  /** Chat or Act – controlled when given */
  mode?: RunControlsMode;
  /** The mode at first, when `mode` isn't controlled */
  defaultMode?: RunControlsMode;
  /** Chat or Act was chosen */
  onModeChange?: (mode: RunControlsMode) => void;
  /** What the agent may do without asking – controlled when given */
  permission?: RunControlsPermission;
  /** The permission at first, when `permission` isn't controlled */
  defaultPermission?: RunControlsPermission;
  /** A permission was chosen */
  onPermissionChange?: (permission: RunControlsPermission) => void;
  /** The queued asks – controlled when given */
  queue?: string[];
  /** The queued asks at first, when `queue` isn't controlled */
  defaultQueue?: string[];
  /** An ask was queued or removed */
  onQueueChange?: (queue: string[]) => void;
  /** Send was pressed; return false to keep the text and the state */
  onSend?: (text: string) => void | boolean;
  /** A steering note was sent; return false to keep it in the field */
  onSteer?: (note: string) => void | boolean;
  /** Stop was pressed, with how much of the answer had arrived */
  onStop?: (partial: number) => void;
  /** Resume was pressed: carry on from this many characters in */
  onResume?: (from: number) => void;
  /** Retry was pressed */
  onRetry?: () => void;
  /** Dismiss was pressed */
  onDismiss?: () => void;
};

/** One composer with every control a running agent needs – stop, resume, retry, steer, queue, mode, permissions, context */
export function RunControls({
  title,
  state,
  defaultState = "idle",
  onStateChange,
  mode,
  defaultMode = "chat",
  onModeChange,
  permission,
  defaultPermission = "ask",
  onPermissionChange,
  queue,
  defaultQueue = [],
  onQueueChange,
  onSend,
  onSteer,
  onStop,
  onResume,
  onRetry,
  onDismiss,
  ...props
}: RunControlsProps) {
  const s = useControlled<RunControlsState>(state, defaultState, onStateChange);
  const m = useControlled<RunControlsMode>(mode, defaultMode, onModeChange);
  const p = useControlled<RunControlsPermission>(permission, defaultPermission, onPermissionChange);
  const q = useControlled<string[]>(queue, defaultQueue, onQueueChange);
  return h(RawRunControls, {
    ...props,
    heading: title ?? "",
    state: s.value,
    mode: m.value,
    permission: p.value,
    queue: q.value,
    onTcStateChange: (e: CustomEvent<RunControlsStateChange>) => s.handler(e.detail.state, e),
    onTcModeChange: (e: CustomEvent<RunControlsModeChange>) => m.handler(e.detail.mode, e),
    onTcPermissionChange: (e: CustomEvent<RunControlsPermissionChange>) => p.handler(e.detail.permission, e),
    onTcQueueChange: (e: CustomEvent<RunControlsQueueChange>) => q.handler(e.detail.queue, e),
    onTcSend: (e: CustomEvent<RunControlsSend>) => {
      if (onSend?.(e.detail.text) === false) e.preventDefault();
    },
    onTcSteer: (e: CustomEvent<RunControlsSteer>) => {
      if (onSteer?.(e.detail.note) === false) e.preventDefault();
    },
    onTcStop: (e: CustomEvent<RunControlsStop>) => onStop?.(e.detail.partial),
    onTcResume: (e: CustomEvent<RunControlsResume>) => onResume?.(e.detail.from),
    onTcRetry: () => onRetry?.(),
    onTcDismiss: () => onDismiss?.(),
  });
}

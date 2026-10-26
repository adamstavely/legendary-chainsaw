import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentQueue, type QueueJob as ElementJob, type QueueWorker as ElementWorker } from "../agent-queue";
import { h, isNode, useStaged } from "./internal";

export type { QueueJobKind, QueueJobPriority, QueueJobStatus, QueueRateLimit } from "../agent-queue";
/** A job, its icon a React node */
export type QueueJob = Omit<ElementJob, "icon"> & { icon?: React.ReactNode };
/** A worker slot, its icon a React node */
export type QueueWorker = Omit<ElementWorker, "icon"> & { icon?: React.ReactNode };

/**
 * useControlled, except an uncontrolled value is mirrored here: @lit/react sets every prop on every render, so passing
 * the starting value back would undo the user's change whenever the parent re-renders
 */
function useOwned<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const [own, setOwn] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const handler = (next: T, event: Event) => {
    if (controlled) event.preventDefault();
    else setOwn(next);
    onChange?.(next);
  };
  return { value: controlled ? value : own, handler };
}

const RawAgentQueue = createComponent({
  tagName: "tc-agent-queue",
  elementClass: TcAgentQueue,
  react: React,
  events: {
    onTcPausedChange: "tc-paused-change" as EventName<CustomEvent<{ paused: boolean }>>,
    onTcConcurrencyChange: "tc-concurrency-change" as EventName<CustomEvent<{ workers: number }>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<{ id: string | null; job?: ElementJob }>>,
    onTcPromote: "tc-promote" as EventName<CustomEvent<{ job: ElementJob }>>,
    onTcCancel: "tc-cancel" as EventName<CustomEvent<{ job: ElementJob }>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAgentQueue>;
export type AgentQueueProps = Omit<
  RawProps,
  "jobs" | "workers" | "paused" | "pausable" | "stepper" | "openId" | "promotable" | "cancellable" | "heading" | "range" | "onTcPausedChange" | "onTcConcurrencyChange" | "onTcOpenChange" | "onTcPromote" | "onTcCancel"
> & {
  /** Waiting and running jobs, plus finished ones for as long as the chart should count them */
  jobs: QueueJob[];
  /** The worker slots – their number is the concurrency */
  workers: QueueWorker[];
  /** The queue is paused – no new jobs start. Controlled when defined; otherwise the component keeps it, starting
   *  from `defaultPaused` */
  paused?: boolean;
  defaultPaused?: boolean;
  /** Shows a Pause/Resume button, and hears every change */
  onPausedChange?: (paused: boolean) => void;
  /** Shows a – N + stepper for the number of workers */
  onConcurrencyChange?: (workers: number) => void;
  /** How far back the chart looks, in ms (default 2 minutes) */
  window?: number;
  /** The id of the job whose card is pinned. Controlled when defined (null = none); otherwise the component keeps it,
   *  starting from `defaultOpenId` */
  openId?: string | null;
  defaultOpenId?: string | null;
  onOpenChange?: (id: string | null, job?: QueueJob) => void;
  /** Shows "Move to front" in a waiting job's card */
  onPromote?: (job: QueueJob) => void;
  /** Shows "Cancel" in a waiting or running job's card */
  onCancel?: (job: QueueJob) => void;
  title?: string;
};

export function AgentQueue({
  jobs,
  workers,
  paused,
  defaultPaused = false,
  onPausedChange,
  onConcurrencyChange,
  window: range,
  openId,
  defaultOpenId = null,
  onOpenChange,
  onPromote,
  onCancel,
  title = "Queue",
  ...props
}: AgentQueueProps) {
  // Icons given as React nodes render in the staging box; the element clones them
  const nodes: [string, React.ReactNode][] = [];
  for (const j of jobs) if (isNode(j.icon)) nodes.push([`job:${j.id}`, j.icon]);
  for (const w of workers) if (isNode(w.icon)) nodes.push([`worker:${w.id}`, w.icon]);
  const { stage, els } = useStaged(nodes);
  const elJobs = React.useMemo(() => jobs.map((j) => (isNode(j.icon) ? { ...j, icon: els[`job:${j.id}`] } : j)) as ElementJob[], [jobs, els]);
  const elWorkers = React.useMemo(() => workers.map((w) => (isNode(w.icon) ? { ...w, icon: els[`worker:${w.id}`] } : w)) as ElementWorker[], [workers, els]);
  // The callbacks get the app's own job back, React icon and all
  const byId = new Map(jobs.map((j) => [j.id, j]));
  const own = (j?: ElementJob) => (j ? (byId.get(j.id) ?? (j as unknown as QueueJob)) : undefined);
  const p = useOwned(paused, defaultPaused, onPausedChange);
  const o = useOwned<string | null>(openId, defaultOpenId, undefined);
  return h(React.Fragment, null, stage, h(RawAgentQueue, {
    ...props,
    jobs: elJobs,
    workers: elWorkers,
    heading: title,
    range: range ?? 2 * 60_000,
    paused: p.value,
    pausable: !!onPausedChange,
    stepper: !!onConcurrencyChange,
    openId: o.value,
    promotable: !!onPromote,
    cancellable: !!onCancel,
    onTcPausedChange: (e: CustomEvent<{ paused: boolean }>) => p.handler(e.detail.paused, e),
    onTcConcurrencyChange: (e: CustomEvent<{ workers: number }>) => onConcurrencyChange?.(e.detail.workers),
    onTcOpenChange: (e: CustomEvent<{ id: string | null; job?: ElementJob }>) => {
      o.handler(e.detail.id, e);
      onOpenChange?.(e.detail.id, own(e.detail.job));
    },
    onTcPromote: (e: CustomEvent<{ job: ElementJob }>) => onPromote?.(own(e.detail.job)!),
    onTcCancel: (e: CustomEvent<{ job: ElementJob }>) => onCancel?.(own(e.detail.job)!),
  }));
}

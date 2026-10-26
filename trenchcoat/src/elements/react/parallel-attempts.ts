import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcParallelAttempts, type ParallelAttempt, type ParallelAttemptPick, type ParallelAttemptStatus } from "../parallel-attempts";
import { h, isNode, useControlled, useStaged } from "./internal";

export type AttemptStatus = ParallelAttemptStatus;
/** React nodes in place of elements: the model's logo */
export type Attempt = Omit<ParallelAttempt, "icon"> & { icon?: React.ReactNode };
/** How an attempt came to be in use: picked by hand, or the best one taken on its own once all were through */
export type AttemptPickReason = { auto: boolean };

const RawParallelAttempts = createComponent({
  tagName: "tc-parallel-attempts",
  elementClass: TcParallelAttempts,
  react: React,
  events: { onTcPickedChange: "tc-picked-change" as EventName<CustomEvent<ParallelAttemptPick>> },
});
type RawParallelAttemptsProps = React.ComponentProps<typeof RawParallelAttempts>;
export type ParallelAttemptsProps = Omit<RawParallelAttemptsProps, "attempts" | "picked" | "heading" | "onTcPickedChange"> & {
  attempts: Attempt[];
  /** The id of the attempt in use. Controlled when defined; null or an unknown id falls back to the best finished
   *  attempt once all are through */
  picked?: string | null;
  /** The attempt in use on mount when `picked` isn't controlled */
  defaultPicked?: string | null;
  /** Called with the attempt in use whenever it changes – picked by hand (`auto: false`), or the best one taken on its
   *  own once all are through (`auto: true`) */
  onPick?: (attempt: Attempt, reason: AttemptPickReason) => void;
  title?: string;
};
export function ParallelAttempts({ attempts, picked, defaultPicked = null, onPick, title, ...props }: ParallelAttemptsProps) {
  const { stage, els } = useStaged(attempts.filter((a) => isNode(a.icon)).map((a) => [a.id, a.icon]));
  const list = React.useMemo(() => attempts.map((a) => (isNode(a.icon) ? { ...a, icon: els[a.id] } : a)) as ParallelAttempt[], [attempts, els]);
  const p = useControlled(picked, defaultPicked, undefined);
  return h(React.Fragment, null, stage, h(RawParallelAttempts, {
    ...props,
    heading: title,
    attempts: list,
    picked: p.value,
    onTcPickedChange: (e: CustomEvent<ParallelAttemptPick>) => {
      if (p.controlled && e.cancelable) e.preventDefault();
      // The app's own attempt (with its React icon) goes back
      onPick?.(attempts.find((a) => a.id === e.detail.picked) ?? (e.detail.attempt as Attempt), { auto: e.detail.auto });
    },
  }));
}

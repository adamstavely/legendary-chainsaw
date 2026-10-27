import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcKillSwitch, type KillResumeEvent, type KillRunning, type KillStop, type KillStopEvent } from "../kill-switch";
import { h, useControlled } from "./internal";

export type { KillPosture, KillRunning, KillStop } from "../kill-switch";
export { defaultKillPostureLabels } from "../kill-switch";

const RawKillSwitch = createComponent({
  tagName: "tc-kill-switch",
  elementClass: TcKillSwitch,
  react: React,
  events: {
    onTcStop: "tc-stop" as EventName<CustomEvent<KillStopEvent>>,
    onTcResume: "tc-resume" as EventName<CustomEvent<KillResumeEvent>>,
  },
});
type RawProps = React.ComponentProps<typeof RawKillSwitch>;
type Owned = "heading" | "stops" | "onTcStop" | "onTcResume" | "children";
export type KillSwitchProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The active stops – controlled when given */
  stops?: KillStop[];
  /** The active stops on mount when `stops` isn't controlled */
  defaultStops?: KillStop[];
  /** The stops changed – a stop was confirmed or one resumed */
  onStopsChange?: (stops: KillStop[]) => void;
  /** A stop was confirmed: halt `halts` (or everything, for target "all") */
  onStop?: (stop: KillStop, halts: KillRunning[]) => void;
  /** Resume was pressed on a stop */
  onResume?: (stop: KillStop) => void;
};
const NONE: KillStop[] = [];

export function KillSwitch({ title, stops, defaultStops = NONE, onStopsChange, onStop, onResume, ...props }: KillSwitchProps) {
  const s = useControlled(stops, defaultStops, onStopsChange);
  return h(RawKillSwitch, {
    ...props,
    heading: title ?? "Emergency stop",
    stops: s.value,
    onTcStop: (e: CustomEvent<KillStopEvent>) => {
      s.handler(e.detail.stops, e);
      onStop?.(e.detail.stop, e.detail.halts);
    },
    onTcResume: (e: CustomEvent<KillResumeEvent>) => {
      s.handler(e.detail.stops, e);
      onResume?.(e.detail.stop);
    },
  });
}

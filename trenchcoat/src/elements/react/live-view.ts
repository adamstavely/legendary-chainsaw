import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcLiveView, type LiveViewControl, type LiveViewControlChange, type LiveViewPausedChange, type LiveViewScreenClick } from "../live-view";
import { h, useControlled } from "./internal";

export type { LiveViewAction, LiveViewActionKind, LiveViewControl, LiveViewScreenClick } from "../live-view";

const RawLiveView = createComponent({
  tagName: "tc-live-view",
  elementClass: TcLiveView,
  react: React,
  events: {
    onTcPausedChange: "tc-paused-change" as EventName<CustomEvent<LiveViewPausedChange>>,
    onTcControlChange: "tc-control-change" as EventName<CustomEvent<LiveViewControlChange>>,
    onTcScreenClick: "tc-screen-click" as EventName<CustomEvent<LiveViewScreenClick>>,
  },
});
type RawLiveViewProps = React.ComponentProps<typeof RawLiveView>;

export type LiveViewProps = Omit<RawLiveViewProps, "heading" | "paused" | "control" | "onTcPausedChange" | "onTcControlChange" | "onTcScreenClick" | "children"> & {
  /** What the agent is doing overall – the header's title */
  title?: string;
  /** Your own stream – a <video>, <canvas>, <img>, <svg> or any content – drawn under the overlays */
  screen?: React.ReactNode;
  /** The agent is paused. Controlled when defined; otherwise the component keeps it, starting from `defaultPaused` */
  paused?: boolean;
  defaultPaused?: boolean;
  onPausedChange?: (paused: boolean) => void;
  /** Who drives the screen. Controlled when defined; otherwise kept by the component, from `defaultControl` */
  control?: LiveViewControl;
  defaultControl?: LiveViewControl;
  onControlChange?: (control: LiveViewControl) => void;
  /** While you have control: a click on the screen, in frame pixels – forward it to the agent's browser */
  onScreenClick?: (point: LiveViewScreenClick) => void;
};

export function LiveView({ title = "", screen, paused, defaultPaused = false, onPausedChange, control, defaultControl = "agent", onControlChange, onScreenClick, ...props }: LiveViewProps) {
  const p = useControlled<boolean>(paused, defaultPaused, onPausedChange);
  const c = useControlled<LiveViewControl>(control, defaultControl, onControlChange);
  return h(
    RawLiveView,
    {
      ...props,
      heading: title,
      paused: p.value,
      control: c.value,
      onTcPausedChange: (e: CustomEvent<LiveViewPausedChange>) => p.handler(e.detail.paused, e),
      onTcControlChange: (e: CustomEvent<LiveViewControlChange>) => c.handler(e.detail.control, e),
      onTcScreenClick: (e: CustomEvent<LiveViewScreenClick>) => onScreenClick?.(e.detail),
    },
    screen != null && screen !== false ? h("div", { slot: "screen" }, screen) : null,
  );
}

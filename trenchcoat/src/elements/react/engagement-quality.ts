import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEngagementQuality, type EngagementSignalOpen } from "../engagement-quality";
import { h } from "./internal";

export type { EngagementBand, EngagementSignal, EngagementSignalKind, EngagementWindow } from "../engagement-quality";
export { ENGAGEMENT_SIGNAL_KINDS, engagementIndex } from "../engagement-quality";

const RawEngagementQuality = createComponent({
  tagName: "tc-engagement-quality",
  elementClass: TcEngagementQuality,
  react: React,
  events: {
    onTcSignalOpen: "tc-signal-open" as EventName<CustomEvent<EngagementSignalOpen>>,
  },
});
type RawEngagementQualityProps = React.ComponentProps<typeof RawEngagementQuality>;
type Wrapped = "heading" | "browsable" | "onTcSignalOpen";
export type EngagementQualityProps = Omit<RawEngagementQualityProps, Wrapped> & {
  /** The heading, and the region's name */
  title?: string;
  /** Adds "Show these reviews" to each signal's example; called with the signal's id */
  onOpenSignal?: (id: string) => void;
};

export function EngagementQuality({ title, onOpenSignal, ...props }: EngagementQualityProps) {
  return h(RawEngagementQuality, {
    ...props,
    heading: title ?? "Engagement quality",
    browsable: !!onOpenSignal,
    onTcSignalOpen: (e: CustomEvent<EngagementSignalOpen>) => onOpenSignal?.(e.detail.id),
  });
}

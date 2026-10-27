import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRelianceGauge, type RelianceEpisodeKind, type RelianceEpisodesOpen, type RelianceReviewLevel, type RelianceReviewLevelChange } from "../reliance-gauge";
import { h, useControlled } from "./internal";

export type { RelianceAgent, RelianceBand, RelianceCalibration, RelianceDirection, RelianceDomain, RelianceEpisodeKind, RelianceReviewLevel, RelianceSignal, RelianceSignalState, RelianceWindow } from "../reliance-gauge";

const RawRelianceGauge = createComponent({
  tagName: "tc-reliance-gauge",
  elementClass: TcRelianceGauge,
  react: React,
  events: {
    onTcReviewLevelChange: "tc-review-level-change" as EventName<CustomEvent<RelianceReviewLevelChange>>,
    onTcEpisodesOpen: "tc-episodes-open" as EventName<CustomEvent<RelianceEpisodesOpen>>,
  },
});
type RawRelianceGaugeProps = React.ComponentProps<typeof RawRelianceGauge>;
type Wrapped = "heading" | "reviewLevel" | "browsable" | "onTcReviewLevelChange" | "onTcEpisodesOpen";
export type RelianceGaugeProps = Omit<RawRelianceGaugeProps, Wrapped> & {
  /** The heading, and the region's name */
  title?: string;
  /** The review level in force. Controlled when defined: pair with onReviewLevelChange and pass the new level back.
   *  Otherwise the component keeps it, starting from `defaultReviewLevel` */
  reviewLevel?: RelianceReviewLevel;
  /** The level in force at first, when uncontrolled – leave both unset for no footer */
  defaultReviewLevel?: RelianceReviewLevel;
  /** The footer's switch was pressed: the new level and the one before */
  onReviewLevelChange?: (level: RelianceReviewLevel, previous: RelianceReviewLevel) => void;
  /** Makes the episode counts buttons; called with the kind pressed */
  onOpenEpisodes?: (kind: RelianceEpisodeKind) => void;
};

export function RelianceGauge({ title, reviewLevel, defaultReviewLevel, onReviewLevelChange, onOpenEpisodes, ...props }: RelianceGaugeProps) {
  const own = useControlled<RelianceReviewLevel | undefined>(reviewLevel, defaultReviewLevel, undefined);
  return h(RawRelianceGauge, {
    ...props,
    heading: title ?? "Reliance",
    reviewLevel: own.value,
    browsable: !!onOpenEpisodes,
    onTcReviewLevelChange: (e: CustomEvent<RelianceReviewLevelChange>) => {
      own.handler(e.detail.level, e);
      onReviewLevelChange?.(e.detail.level, e.detail.previous);
    },
    onTcEpisodesOpen: (e: CustomEvent<RelianceEpisodesOpen>) => onOpenEpisodes?.(e.detail.kind),
  });
}

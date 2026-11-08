import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTimeDetails, type TimeMatch, type TimeOpenChange } from "../time-details";
import { h } from "./internal";

export type { FindTimesOptions, TimeDetailsLabels, TimeMatch, TimeOpenChange } from "../time-details";
export { defaultTimeDetailsLabels, findTimes, timeZoneAbbreviations } from "../time-details";

const RawTimeDetails = createComponent({
  tagName: "tc-time-details",
  elementClass: TcTimeDetails,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<TimeOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTimeDetails>;
export type TimeDetailsProps = Omit<RawProps, "onTcOpenChange" | "children"> & {
  /** Called with the time whose tooltip opened, or null when it closed */
  onOpenChange?: (open: TimeMatch | null) => void;
};

/** Times in text, underlined: hover or focus one to see it in your own time zone */
export function TimeDetails({ onOpenChange, ...props }: TimeDetailsProps) {
  return h(RawTimeDetails, {
    ...props,
    onTcOpenChange: (e: CustomEvent<TimeOpenChange>) => onOpenChange?.(e.detail.open),
  });
}

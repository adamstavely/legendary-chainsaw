import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcMapItinerary, type ItineraryDay, type ItineraryDayChange, type ItineraryStop, type ItineraryStopSelect } from "../map-itinerary";
import { h, useControlled } from "./internal";

export type { ItineraryDay, ItineraryDayChange, ItineraryKindIcon, ItineraryStop, ItineraryStopSelect } from "../map-itinerary";
export { defaultItineraryKinds, mercator } from "../map-itinerary";

const RawMapItinerary = createComponent({
  tagName: "tc-map-itinerary",
  elementClass: TcMapItinerary,
  react: React,
  events: {
    onTcDayChange: "tc-day-change" as EventName<CustomEvent<ItineraryDayChange>>,
    onTcStopSelect: "tc-stop-select" as EventName<CustomEvent<ItineraryStopSelect>>,
  },
});
type RawProps = React.ComponentProps<typeof RawMapItinerary>;
type Owned = "heading" | "day" | "stop" | "onTcDayChange" | "onTcStopSelect" | "children";
export type MapItineraryProps = Omit<RawProps, Owned> & {
  /** The heading, and the map's name */
  title?: string;
  /** The chosen day's id – controlled when given */
  day?: string | null;
  /** The day chosen on mount when `day` isn't controlled; by default the first */
  defaultDay?: string | null;
  /** A day was chosen */
  onDayChange?: (day: string, item?: ItineraryDay) => void;
  /** The picked stop's id – controlled when given (null for none) */
  stop?: string | null;
  /** The stop picked on mount when `stop` isn't controlled */
  defaultStop?: string | null;
  /** A stop was picked or cleared, in the list or on the map */
  onStopSelect?: (stop: string | null, item?: ItineraryStop) => void;
};

export function MapItinerary({ title, day, defaultDay = null, onDayChange, stop, defaultStop = null, onStopSelect, ...props }: MapItineraryProps) {
  const dayItem = React.useRef<ItineraryDay | undefined>(undefined);
  const stopItem = React.useRef<ItineraryStop | undefined>(undefined);
  const reportDay = React.useCallback((next: string | null) => next != null && onDayChange?.(next, dayItem.current), [onDayChange]);
  const reportStop = React.useCallback((next: string | null) => onStopSelect?.(next, stopItem.current), [onStopSelect]);
  const d = useControlled<string | null>(day, defaultDay, onDayChange ? reportDay : undefined);
  const s = useControlled<string | null>(stop, defaultStop, onStopSelect ? reportStop : undefined);
  return h(RawMapItinerary, {
    ...props,
    heading: title ?? "Itinerary",
    day: d.value,
    stop: s.value,
    onTcDayChange: (e: CustomEvent<ItineraryDayChange>) => {
      dayItem.current = e.detail.item;
      d.handler(e.detail.day, e);
    },
    onTcStopSelect: (e: CustomEvent<ItineraryStopSelect>) => {
      stopItem.current = e.detail.item;
      s.handler(e.detail.stop, e);
    },
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTravelItinerary, type TravelLeg, type TravelOpen } from "../travel-itinerary";
import { h } from "./internal";

export type { TravelFlagTone, TravelLeg, TravelMode, TravelOpen, TravelPlace, TravelSource } from "../travel-itinerary";
export { defaultTravelFlags } from "../travel-itinerary";

const RawTravelItinerary = createComponent({
  tagName: "tc-travel-itinerary",
  elementClass: TcTravelItinerary,
  react: React,
  events: {
    onTcOpen: "tc-open" as EventName<CustomEvent<TravelOpen>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTravelItinerary>;
type Owned = "heading" | "onTcOpen" | "children";
export type TravelItineraryProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** A leg was opened */
  onOpen?: (id: string, leg: TravelLeg) => void;
};

export function TravelItinerary({ title, onOpen, ...props }: TravelItineraryProps) {
  return h(RawTravelItinerary, {
    ...props,
    heading: title ?? "Travel",
    onTcOpen: (e: CustomEvent<TravelOpen>) => onOpen?.(e.detail.id, e.detail.leg),
  });
}

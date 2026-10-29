import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCoordinateDetails, type CoordinateCopyDetail, type CoordinateLookupDetail, type CoordinateNotation, type CoordinateOpenChange, type CoordinateOpenDetail } from "../coordinate-details";
import { h } from "./internal";

export type {
  Coordinate,
  CoordinateCopyDetail,
  CoordinateEmbed,
  CoordinateLookupDetail,
  CoordinateMatch,
  CoordinateNotation,
  CoordinateOpenChange,
  CoordinateOpenDetail,
  CoordinatePlace,
  CoordinateResolver,
  CoordinateTrigger,
} from "../coordinate-details";
export { findCoordinates, parseCoordinate } from "../coordinate-details";

const RawCoordinateDetails = createComponent({
  tagName: "tc-coordinate-details",
  elementClass: TcCoordinateDetails,
  react: React,
  events: {
    onTcCoordinateLookup: "tc-coordinate-lookup" as EventName<CustomEvent<CoordinateLookupDetail>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<CoordinateCopyDetail>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<CoordinateOpenDetail>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<CoordinateOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawCoordinateDetails>;
type Wrapped = "onTcCoordinateLookup" | "onTcCopy" | "onTcOpen" | "onTcOpenChange" | "onCopy" | "children";
export type CoordinateDetailsProps = Omit<RawProps, Wrapped> & {
  /** Called when a card needs a place's details; call `detail.respondWith(place | promise)` to answer, or use `resolve` instead */
  onLookup?: (detail: CoordinateLookupDetail, event: CustomEvent<CoordinateLookupDetail>) => void;
  /** Called when Copy is pressed; return false to stop the component writing to the clipboard itself */
  onCopy?: (text: string, notation: CoordinateNotation) => boolean | void;
  /** Called before a mapping link opens; return false to open your own map instead */
  onOpenMap?: (detail: CoordinateOpenDetail) => boolean | void;
  /** Called with the position whose card opened, or null when it closed */
  onOpenChange?: (position: { latitude: number; longitude: number } | null) => void;
};

/** Coordinates in text, checked and marked: hover, focus or right-click one for the place, both notations, mapping links and a map */
export function CoordinateDetails({ onLookup, onCopy, onOpenMap, onOpenChange, ...props }: CoordinateDetailsProps) {
  return h(RawCoordinateDetails, {
    ...props,
    onTcCoordinateLookup: (e: CustomEvent<CoordinateLookupDetail>) => onLookup?.(e.detail, e),
    onTcCopy: (e: CustomEvent<CoordinateCopyDetail>) => {
      if (onCopy?.(e.detail.text, e.detail.notation) === false) e.preventDefault();
    },
    onTcOpen: (e: CustomEvent<CoordinateOpenDetail>) => {
      if (onOpenMap?.(e.detail) === false) e.preventDefault();
    },
    onTcOpenChange: (e: CustomEvent<CoordinateOpenChange>) => {
      const { latitude, longitude } = e.detail;
      onOpenChange?.(latitude === null || longitude === null ? null : { latitude, longitude });
    },
  });
}

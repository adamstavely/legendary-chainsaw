import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcGeoLocation, type GeoCopy, type GeoNotation, type GeoNotationChange, type GeoOpen, type GeoPoint, type GeoSelectedChange } from "../geo-location";
import { h, useControlled } from "./internal";

export type { GeoCopy, GeoEmbed, GeoNotation, GeoNotationChange, GeoOpen, GeoPoint, GeoProvider, GeoSelectedChange } from "../geo-location";
export { defaultGeoEmbedSrc, defaultGeoProviders, fillGeoTemplate, geoProblem, toDms } from "../geo-location";

const RawGeoLocation = createComponent({
  tagName: "tc-geo-location",
  elementClass: TcGeoLocation,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<GeoSelectedChange>>,
    onTcNotationChange: "tc-notation-change" as EventName<CustomEvent<GeoNotationChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<GeoOpen>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<GeoCopy>>,
  },
});
type RawProps = React.ComponentProps<typeof RawGeoLocation>;
type Owned = "heading" | "selected" | "notation" | "onTcSelectedChange" | "onTcNotationChange" | "onTcOpen" | "onTcCopy" | "children";
export type GeoLocationProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The shown point's id when `points` is given – controlled when given (null shows the first) */
  selected?: string | null;
  /** The point shown on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** Another point was picked */
  onSelectedChange?: (selected: string | null, point?: GeoPoint) => void;
  /** Decimal or DMS – controlled when given */
  notation?: GeoNotation;
  /** The notation on mount when `notation` isn't controlled */
  defaultNotation?: GeoNotation;
  /** Decimal or DMS was picked */
  onNotationChange?: (notation: GeoNotation) => void;
  /** A mapping link is about to open; return false to stop it, e.g. to open your own map */
  onOpenMap?: (detail: GeoOpen) => boolean | void;
  /** The coordinates are about to be copied; return false to stop it */
  onCopyCoordinates?: (detail: GeoCopy) => boolean | void;
};

export function GeoLocation({ title, selected, defaultSelected = null, onSelectedChange, notation, defaultNotation = "decimal", onNotationChange, onOpenMap, onCopyCoordinates, ...props }: GeoLocationProps) {
  const point = React.useRef<GeoPoint | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, point.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  const n = useControlled<GeoNotation>(notation, defaultNotation, onNotationChange);
  return h(RawGeoLocation, {
    ...props,
    heading: title ?? "Location",
    selected: s.value,
    notation: n.value,
    onTcSelectedChange: (e: CustomEvent<GeoSelectedChange>) => {
      point.current = e.detail.point;
      s.handler(e.detail.selected, e);
    },
    onTcNotationChange: (e: CustomEvent<GeoNotationChange>) => n.handler(e.detail.notation, e),
    onTcOpen: (e: CustomEvent<GeoOpen>) => {
      if (onOpenMap?.(e.detail) === false) e.preventDefault();
    },
    onTcCopy: (e: CustomEvent<GeoCopy>) => {
      if (onCopyCoordinates?.(e.detail) === false) e.preventDefault();
    },
  });
}

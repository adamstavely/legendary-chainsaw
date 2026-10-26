import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcWorldMap, type Continent, type WorldMapContinentChange } from "../world-map";
import { h, useControlled } from "./internal";

export type { Continent } from "../world-map";

const RawWorldMap = createComponent({
  tagName: "tc-world-map",
  elementClass: TcWorldMap,
  react: React,
  events: { onTcContinentChange: "tc-continent-change" as EventName<CustomEvent<WorldMapContinentChange>> },
});
type RawWorldMapProps = React.ComponentProps<typeof RawWorldMap>;
export type WorldMapProps = Omit<RawWorldMapProps, "continent" | "onTcContinentChange"> & {
  /** Highlighted continent (controlled when defined; pass onContinentChange so the menu can change it) */
  continent?: Continent;
  /** Continent highlighted first when `continent` is not set */
  defaultContinent?: Continent;
  /** Called when the viewer picks a continent in the menu */
  onContinentChange?: (continent: Continent) => void;
};

/** World Map – one highlighted continent on a gray world, with a menu to switch it */
export function WorldMap({ continent, defaultContinent = "europe", onContinentChange, showSwitcher = true, ...props }: WorldMapProps) {
  // Like React's <input value> without onChange: say so once (in development). Without the menu nothing can change it
  const warned = React.useRef(false);
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
  if (continent !== undefined && !onContinentChange && showSwitcher && !warned.current && env !== "production") {
    warned.current = true;
    console.warn("Trenchcoat: `continent` is set without its change handler, so it can't change. Pass the handler to control it, or use the default… prop for a starting value.");
  }
  const v = useControlled<Continent>(continent, defaultContinent, onContinentChange);
  return h(RawWorldMap, {
    ...props,
    showSwitcher,
    continent: v.value,
    onTcContinentChange: (e: CustomEvent<WorldMapContinentChange>) => v.handler(e.detail.continent, e),
  });
}

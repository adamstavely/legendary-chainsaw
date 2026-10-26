import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRegionDach, type Region, type RegionDachRegionChange } from "../region-dach";
import { h, useControlled } from "./internal";

export type { Region } from "../region-dach";

const RawRegionDach = createComponent({
  tagName: "tc-region-dach",
  elementClass: TcRegionDach,
  react: React,
  events: { onTcRegionChange: "tc-region-change" as EventName<CustomEvent<RegionDachRegionChange>> },
});
type RawRegionDachProps = React.ComponentProps<typeof RawRegionDach>;
export type RegionDachProps = Omit<RawRegionDachProps, "region" | "onTcRegionChange"> & {
  /** Shown region (controlled when defined; pass onRegionChange so the menu can change it) */
  region?: Region;
  /** Region shown first when `region` is not set */
  defaultRegion?: Region;
  /** Called when the viewer picks a region in the menu */
  onRegionChange?: (region: Region) => void;
};

/** Region DACH – Germany, Austria and Switzerland with a band along their border, and a menu to switch the region */
export function RegionDach({ region, defaultRegion = "dach", onRegionChange, showSwitcher = true, ...props }: RegionDachProps) {
  // Like React's <input value> without onChange: say so once (in development). Without the menu nothing can change it
  const warned = React.useRef(false);
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
  if (region !== undefined && !onRegionChange && showSwitcher && !warned.current && env !== "production") {
    warned.current = true;
    console.warn("Trenchcoat: `region` is set without its change handler, so it can't change. Pass the handler to control it, or use the default… prop for a starting value.");
  }
  const v = useControlled<Region>(region, defaultRegion, onRegionChange);
  return h(RawRegionDach, {
    ...props,
    showSwitcher,
    region: v.value,
    onTcRegionChange: (e: CustomEvent<RegionDachRegionChange>) => v.handler(e.detail.region, e),
  });
}

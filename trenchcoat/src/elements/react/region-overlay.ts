import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcRegionOverlay,
  type OverlayRegion,
  type RegionKindsChange,
  type RegionSelectedChange,
  type RegionShowBoxesChange,
  type RegionThresholdChange,
} from "../region-overlay";
import { h, useControlled } from "./internal";

export type { OverlayRegion, RegionBox, RegionConfidenceWords, RegionKind, RegionOverlayLabels, RegionOverlayLabelsInput } from "../region-overlay";
export { defaultRegionOverlayLabels } from "../region-overlay";

const RawRegionOverlay = createComponent({
  tagName: "tc-region-overlay",
  elementClass: TcRegionOverlay,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<RegionSelectedChange>>,
    onTcThresholdChange: "tc-threshold-change" as EventName<CustomEvent<RegionThresholdChange>>,
    onTcKindsChange: "tc-kinds-change" as EventName<CustomEvent<RegionKindsChange>>,
    onTcShowBoxesChange: "tc-show-boxes-change" as EventName<CustomEvent<RegionShowBoxesChange>>,
  },
});
type RawRegionOverlayProps = React.ComponentProps<typeof RawRegionOverlay>;

export type RegionOverlayOwnProps = {
  /** The heading */
  title?: string;
  /** The selected region's id. Controlled when defined – pass back what onSelectedChange reports */
  selected?: string | null;
  /** The selected region when uncontrolled */
  defaultSelected?: string | null;
  /** A region was selected, or the selection cleared (null) */
  onSelectedChange?: (selected: string | null, region?: OverlayRegion) => void;
  /** Regions under this confidence (0–1) are hidden. Controlled when defined */
  threshold?: number;
  /** The starting threshold when uncontrolled */
  defaultThreshold?: number;
  /** The confidence slider moved */
  onThresholdChange?: (threshold: number) => void;
  /** The kinds shown, null for all. Controlled when defined */
  kinds?: string[] | null;
  /** The kinds shown when uncontrolled */
  defaultKinds?: string[] | null;
  /** A kind chip was turned on or off */
  onKindsChange?: (kinds: string[] | null) => void;
  /** Whether the boxes are drawn. Controlled when defined */
  showBoxes?: boolean;
  /** Whether the boxes start drawn when uncontrolled */
  defaultShowBoxes?: boolean;
  /** Show boxes was switched */
  onShowBoxesChange?: (showBoxes: boolean) => void;
};
export type RegionOverlayProps = Omit<
  RawRegionOverlayProps,
  keyof RegionOverlayOwnProps | "heading" | "onTcSelectedChange" | "onTcThresholdChange" | "onTcKindsChange" | "onTcShowBoxesChange"
> &
  RegionOverlayOwnProps;

export function RegionOverlay({
  title = "What the model read",
  selected,
  defaultSelected = null,
  onSelectedChange,
  threshold,
  defaultThreshold = 0,
  onThresholdChange,
  kinds,
  defaultKinds = null,
  onKindsChange,
  showBoxes,
  defaultShowBoxes = true,
  onShowBoxesChange,
  ...props
}: RegionOverlayProps) {
  const regions = props.regions;
  const sel = useControlled(selected, defaultSelected, onSelectedChange ? (next) => onSelectedChange(next, regions?.find((r) => r.id === next)) : undefined);
  const thr = useControlled(threshold, defaultThreshold, onThresholdChange);
  const kin = useControlled(kinds, defaultKinds, onKindsChange);
  const box = useControlled(showBoxes, defaultShowBoxes, onShowBoxesChange);
  return h(RawRegionOverlay, {
    ...props,
    heading: title,
    selected: sel.value,
    threshold: thr.value,
    kinds: kin.value,
    showBoxes: box.value,
    onTcSelectedChange: (e: CustomEvent<RegionSelectedChange>) => sel.handler(e.detail.selected, e),
    onTcThresholdChange: (e: CustomEvent<RegionThresholdChange>) => thr.handler(e.detail.threshold, e),
    onTcKindsChange: (e: CustomEvent<RegionKindsChange>) => kin.handler(e.detail.kinds, e),
    onTcShowBoxesChange: (e: CustomEvent<RegionShowBoxesChange>) => box.handler(e.detail.showBoxes, e),
  });
}

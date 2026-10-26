import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcImageGrid, type ImageGridCompareChange, type ImageGridSplitChange, type ImageGridTile, type ImageGridTileEvent, type ImageGridTilesChange } from "../image-grid";
import { h, useControlled } from "./internal";

export type { ImageGridAction, ImageGridTile, ImageGridTileStatus } from "../image-grid";

const RawImageGrid = createComponent({
  tagName: "tc-image-grid",
  elementClass: TcImageGrid,
  react: React,
  events: {
    onTcRegenerate: "tc-regenerate" as EventName<CustomEvent<ImageGridTileEvent>>,
    onTcUpscale: "tc-upscale" as EventName<CustomEvent<ImageGridTileEvent>>,
    onTcDownload: "tc-download" as EventName<CustomEvent<ImageGridTileEvent>>,
    onTcTilesChange: "tc-tiles-change" as EventName<CustomEvent<ImageGridTilesChange>>,
    onTcCompareChange: "tc-compare-change" as EventName<CustomEvent<ImageGridCompareChange>>,
    onTcSplitChange: "tc-split-change" as EventName<CustomEvent<ImageGridSplitChange>>,
  },
});
type RawImageGridProps = React.ComponentProps<typeof RawImageGrid>;

export type ImageGridOwnProps = {
  /** Names the grid – the heading over the images */
  title?: string;
  /** The prompt the images came from, shown under the title */
  prompt?: string;
  /** The images. Controlled when defined – pass back what onTilesChange reports (alt-text edits) */
  tiles?: ImageGridTile[];
  /** Starting images when uncontrolled */
  defaultTiles?: ImageGridTile[];
  /** An alt text was edited: the whole list with the change */
  onTilesChange?: (tiles: ImageGridTile[]) => void;
  /** The two tile ids side by side, or null for the grid. Controlled when defined */
  compare?: [string, string] | null;
  defaultCompare?: [string, string] | null;
  onCompareChange?: (compare: [string, string] | null) => void;
  /** Where the compare divider is, 0–100. Controlled when defined */
  split?: number;
  defaultSplit?: number;
  onSplitChange?: (split: number) => void;
  /** Regenerate (or Try again) on a tile – answer by updating the tile: pending, then done with the new src */
  onRegenerate?: (tile: ImageGridTile, index: number) => void;
  /** Upscale on a tile – answer by updating the tile */
  onUpscale?: (tile: ImageGridTile, index: number) => void;
  /** Download on a tile; the image is saved unless you call event.preventDefault() */
  onDownload?: (tile: ImageGridTile, index: number, event: Event) => void;
};
export type ImageGridProps = Omit<RawImageGridProps, keyof ImageGridOwnProps | "heading" | "onTcRegenerate" | "onTcUpscale" | "onTcDownload" | "onTcTilesChange" | "onTcCompareChange" | "onTcSplitChange"> & ImageGridOwnProps;

const EMPTY: ImageGridTile[] = [];

export function ImageGrid({
  title = "Variations",
  tiles,
  defaultTiles = EMPTY,
  onTilesChange,
  compare,
  defaultCompare = null,
  onCompareChange,
  split,
  defaultSplit = 50,
  onSplitChange,
  onRegenerate,
  onUpscale,
  onDownload,
  ...props
}: ImageGridProps) {
  const t = useControlled(tiles, defaultTiles, onTilesChange);
  const c = useControlled(compare, defaultCompare, onCompareChange);
  const s = useControlled(split, defaultSplit, onSplitChange);
  return h(RawImageGrid, {
    ...props,
    heading: title,
    tiles: t.value,
    compare: c.value,
    split: s.value,
    onTcTilesChange: (e: CustomEvent<ImageGridTilesChange>) => t.handler(e.detail.tiles, e),
    onTcCompareChange: (e: CustomEvent<ImageGridCompareChange>) => c.handler(e.detail.compare, e),
    onTcSplitChange: (e: CustomEvent<ImageGridSplitChange>) => s.handler(e.detail.split, e),
    onTcRegenerate: (e: CustomEvent<ImageGridTileEvent>) => onRegenerate?.(e.detail.tile, e.detail.index),
    onTcUpscale: (e: CustomEvent<ImageGridTileEvent>) => onUpscale?.(e.detail.tile, e.detail.index),
    onTcDownload: (e: CustomEvent<ImageGridTileEvent>) => onDownload?.(e.detail.tile, e.detail.index, e),
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAssetList, type Asset, type AssetOpen, type AssetRevealedChange } from "../asset-list";
import { h, useControlled } from "./internal";

export type { Asset, AssetGroup, AssetKind, AssetOpen, AssetRevealedChange, AssetTone } from "../asset-list";
export { defaultAssetStatuses } from "../asset-list";

const RawAssetList = createComponent({
  tagName: "tc-asset-list",
  elementClass: TcAssetList,
  react: React,
  events: {
    onTcOpen: "tc-open" as EventName<CustomEvent<AssetOpen>>,
    onTcRevealedChange: "tc-revealed-change" as EventName<CustomEvent<AssetRevealedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAssetList>;
type Owned = "heading" | "revealed" | "onTcOpen" | "onTcRevealedChange" | "children";
export type AssetListProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The ids whose identifiers are shown – controlled when given */
  revealed?: string[];
  /** The ids shown on mount when `revealed` isn't controlled */
  defaultRevealed?: string[];
  /** An identifier was shown or masked again; `revealed` is the new list */
  onRevealedChange?: (revealed: string[]) => void;
  /** Open was pressed on a row; `group` is its group's id */
  onOpen?: (asset: Asset, group: string) => void;
};

const NONE: string[] = [];

export function AssetList({ title, revealed, defaultRevealed = NONE, onRevealedChange, onOpen, ...props }: AssetListProps) {
  const r = useControlled<string[]>(revealed, defaultRevealed, onRevealedChange);
  return h(RawAssetList, {
    ...props,
    heading: title ?? "Assets",
    revealed: r.value,
    onTcRevealedChange: (e: CustomEvent<AssetRevealedChange>) => r.handler(e.detail.revealed, e),
    onTcOpen: (e: CustomEvent<AssetOpen>) => onOpen?.(e.detail.asset, e.detail.group),
  });
}

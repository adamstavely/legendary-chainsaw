import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcIconRail, type IconRailAction, type IconRailItem, type IconRailSelectedChange } from "../icon-rail";
import { h, useControlled } from "./internal";

export type { IconRailAction, IconRailItem, IconRailMoreItem, IconRailSelectedChange } from "../icon-rail";

const RawIconRail = createComponent({
  tagName: "tc-icon-rail",
  elementClass: TcIconRail,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<IconRailSelectedChange>>,
    onTcAction: "tc-action" as EventName<CustomEvent<IconRailAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawIconRail>;
export type IconRailProps = Omit<RawProps, "selected" | "onTcSelectedChange" | "children"> & {
  /** The chosen button's id – controlled when given */
  selected?: string | null;
  /** The chosen button at first, when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A button was chosen or let go */
  onSelectedChange?: (selected: string | null, item?: IconRailItem) => void;
};

/** A row of icon buttons for a panel: one chosen, each with a tooltip, and an optional More menu */
export function IconRail({ selected, defaultSelected = null, onSelectedChange, ...props }: IconRailProps) {
  const item = React.useRef<IconRailItem | undefined>(undefined);
  const v = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? (next) => onSelectedChange(next, item.current) : undefined);
  return h(RawIconRail, {
    ...props,
    selected: v.value,
    onTcSelectedChange: (e: CustomEvent<IconRailSelectedChange>) => {
      item.current = e.detail.item;
      v.handler(e.detail.selected, e);
    },
  });
}

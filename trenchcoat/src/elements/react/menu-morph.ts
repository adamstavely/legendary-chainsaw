import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcMenuMorph, type MenuMorphOpenChange } from "../menu-morph";
import { h, useControlled } from "./internal";

export type { MenuMorphOpenChange, MenuMorphAlign, MenuMorphSide } from "../menu-morph";

const RawMenuMorph = createComponent({
  tagName: "tc-menu-morph",
  elementClass: TcMenuMorph,
  react: React,
  events: { onTcOpenChange: "tc-open-change" as EventName<CustomEvent<MenuMorphOpenChange>> },
});
type RawProps = React.ComponentProps<typeof RawMenuMorph>;
export type MenuMorphProps = Omit<RawProps, "open" | "onTcOpenChange"> & {
  /** Whether the menu is open – controlled when given */
  open?: boolean;
  /** Whether it's open on mount when `open` isn't controlled */
  defaultOpen?: boolean;
  /** The menu is opening or closing */
  onOpenChange?: (open: boolean) => void;
};

/** A button that grows into its menu. Children: a trigger marked data-menu-trigger and a panel marked data-menu */
export function MenuMorph({ open, defaultOpen = false, onOpenChange, ...props }: MenuMorphProps) {
  const o = useControlled<boolean>(open, defaultOpen, onOpenChange);
  return h(RawMenuMorph, { ...props, open: o.value, onTcOpenChange: (e: CustomEvent<MenuMorphOpenChange>) => o.handler(e.detail.open, e) });
}

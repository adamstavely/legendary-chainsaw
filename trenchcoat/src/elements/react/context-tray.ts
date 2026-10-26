import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcContextTray, type ContextTrayChange, type ContextTrayItem, type ContextTrayItemsChange } from "../context-tray";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { ContextTrayChange } from "../context-tray";

/** A React node (or an element) for the icon */
export type ContextTrayEntry = Omit<ContextTrayItem, "icon"> & { icon?: React.ReactNode | Element };

const RawContextTray = createComponent({
  tagName: "tc-context-tray",
  elementClass: TcContextTray,
  react: React,
  events: {
    onTcItemsChange: "tc-items-change" as EventName<CustomEvent<ContextTrayItemsChange>>,
  },
});
type RawContextTrayProps = React.ComponentProps<typeof RawContextTray>;
export type ContextTrayOwnProps = {
  /** The heading, and the group's name (default "In context") */
  title?: string;
  /** The chips. Controlled when given; otherwise the tray keeps its own, starting at `defaultItems` */
  items?: ContextTrayEntry[];
  defaultItems?: ContextTrayEntry[];
  /** Every remove, undo (restore), pin and unpin, with the items after it */
  onChange?: (items: ContextTrayEntry[], change: ContextTrayChange) => void;
};
export type ContextTrayProps = Omit<RawContextTrayProps, keyof ContextTrayOwnProps | "heading" | "onTcItemsChange" | "onChange"> & ContextTrayOwnProps;

export function ContextTray({ title = "In context", items, defaultItems = [], onChange, ...props }: ContextTrayProps) {
  const last = React.useRef<ContextTrayChange | null>(null);
  const v = useControlled<ContextTrayEntry[]>(items, defaultItems, (next) => onChange?.(next, last.current!));
  // Every entry seen, so Undo brings back the one given (its React-node icon included)
  const seen = React.useRef(new Map<string, ContextTrayEntry>());
  for (const it of v.value) seen.current.set(it.id, it);
  const { stage, els } = useStaged(v.value.filter((it) => isNode(it.icon)).map((it) => [it.id, it.icon as React.ReactNode]));
  const list = React.useMemo(() => v.value.map((it) => (isNode(it.icon) ? { ...it, icon: els[it.id] } : it)) as ContextTrayItem[], [v.value, els]);
  return h(React.Fragment, null, stage, h(RawContextTray, {
    ...props,
    heading: title,
    items: list,
    onTcItemsChange: (e: CustomEvent<ContextTrayItemsChange>) => {
      last.current = e.detail.change;
      // The tray hands back its own copies; map them to the entries given (their React-node icons included)
      const next = e.detail.items.map((it): ContextTrayEntry => {
        const own = seen.current.get(it.id);
        return own ? { ...own, pinned: it.pinned } : it;
      });
      v.handler(next, e);
    },
  }));
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPanelDock, type PanelDockActiveChange, type PanelDockClose, type PanelDockCollapsedChange, type PanelDockItem, type PanelDockOpenChange, type PanelDockWidthChange } from "../panel-dock";
import { h, useControlled } from "./internal";

export type { PanelDockActiveChange, PanelDockClose, PanelDockCollapsedChange, PanelDockItem, PanelDockLabels, PanelDockOpenChange, PanelDockSide, PanelDockWidthChange } from "../panel-dock";
export { defaultPanelDockLabels } from "../panel-dock";

const RawPanelDock = createComponent({
  tagName: "tc-panel-dock",
  elementClass: TcPanelDock,
  react: React,
  events: {
    onTcActiveChange: "tc-active-change" as EventName<CustomEvent<PanelDockActiveChange>>,
    onTcClose: "tc-close" as EventName<CustomEvent<PanelDockClose>>,
    onTcWidthChange: "tc-width-change" as EventName<CustomEvent<PanelDockWidthChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<PanelDockOpenChange>>,
    onTcCollapsedChange: "tc-collapsed-change" as EventName<CustomEvent<PanelDockCollapsedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPanelDock>;
type Owned = "active" | "open" | "collapsed" | "width" | "onTcActiveChange" | "onTcOpenChange" | "onTcCollapsedChange" | "onTcWidthChange";
export type PanelDockProps = Omit<RawProps, Owned> & {
  /** The shown item's id – controlled when given */
  active?: string | null;
  /** At first, when `active` isn't controlled */
  defaultActive?: string | null;
  /** Another item was shown */
  onActiveChange?: (active: string | null, item?: PanelDockItem) => void;
  /** Whether the panel shows – controlled when given */
  open?: boolean;
  /** At first, when `open` isn't controlled */
  defaultOpen?: boolean;
  /** The panel was closed */
  onOpenChange?: (open: boolean) => void;
  /** Folded to a rail – controlled when given */
  collapsed?: boolean;
  /** At first, when `collapsed` isn't controlled */
  defaultCollapsed?: boolean;
  /** The panel was folded or opened out */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** The panel's width, px – controlled when given */
  width?: number;
  /** At first, when `width` isn't controlled */
  defaultWidth?: number;
  /** The panel was resized */
  onWidthChange?: (width: number) => void;
};

/**
 * The panel's items' content is its children, each with `slot` set to its item's id:
 * <PanelDock items={items}><article slot="draft">…</article></PanelDock>
 */
export function PanelDock({
  active,
  defaultActive = null,
  onActiveChange,
  open,
  defaultOpen = true,
  onOpenChange,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  width,
  defaultWidth = 420,
  onWidthChange,
  ...props
}: PanelDockProps) {
  // The children are the page's: their own change events bubble through and aren't the dock's
  const a = useControlled<string | null>(active, defaultActive, undefined, { ownEvents: true });
  const o = useControlled<boolean>(open, defaultOpen, onOpenChange, { ownEvents: true });
  const c = useControlled<boolean>(collapsed, defaultCollapsed, onCollapsedChange, { ownEvents: true });
  const w = useControlled<number>(width, defaultWidth, onWidthChange, { ownEvents: true });
  return h(RawPanelDock, {
    ...props,
    active: a.value,
    open: o.value,
    collapsed: c.value,
    width: w.value,
    onTcActiveChange: (e: CustomEvent<PanelDockActiveChange>) => {
      if (e.target !== e.currentTarget) return;
      a.handler(e.detail.active, e);
      onActiveChange?.(e.detail.active, e.detail.item);
    },
    onTcOpenChange: (e: CustomEvent<PanelDockOpenChange>) => o.handler(e.detail.open, e),
    onTcCollapsedChange: (e: CustomEvent<PanelDockCollapsedChange>) => c.handler(e.detail.collapsed, e),
    onTcWidthChange: (e: CustomEvent<PanelDockWidthChange>) => w.handler(e.detail.width, e),
  });
}

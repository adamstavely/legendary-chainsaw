import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSideNav, type SideNavCollapsedChange, type SideNavNavigate } from "../side-nav";
import { h, useControlled } from "./internal";

export type { SideNavCollapsedChange, SideNavItem, SideNavLabels, SideNavNavigate } from "../side-nav";
export { defaultSideNavLabels, SIDE_NAV_BRAND_ID } from "../side-nav";

const RawSideNav = createComponent({
  tagName: "tc-side-nav",
  elementClass: TcSideNav,
  react: React,
  events: {
    onTcNavigate: "tc-navigate" as EventName<CustomEvent<SideNavNavigate>>,
    onTcCollapsedChange: "tc-collapsed-change" as EventName<CustomEvent<SideNavCollapsedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSideNav>;
export type SideNavProps = Omit<RawProps, "current" | "collapsed" | "onTcNavigate" | "onTcCollapsedChange"> & {
  /** The current page's item id – controlled when given; your router sets it */
  current?: string | null;
  /** The current item at first, when `current` isn't controlled; then a click moves it */
  defaultCurrent?: string | null;
  /** An item or the linked brand (id "brand", `event.detail.brand`) was clicked; call `event.preventDefault()` to route a link yourself instead of following it */
  onNavigate?: (id: string, href: string | undefined, event: CustomEvent<SideNavNavigate>) => void;
  /** Folded into an icon-only rail – controlled when given */
  collapsed?: boolean;
  /** Folded at first, when `collapsed` isn't controlled */
  defaultCollapsed?: boolean;
  /** The collapse button was pressed */
  onCollapsedChange?: (collapsed: boolean) => void;
};

/** An app's main navigation down the side: brand, places with icons and badges, the current page; children go at the bottom */
export function SideNav({ current, defaultCurrent = null, onNavigate, collapsed, defaultCollapsed = false, onCollapsedChange, ...props }: SideNavProps) {
  // Not useControlled: that prevents the event when controlled, which would also stop a link from being followed
  const [own, setOwn] = React.useState(defaultCurrent);
  const c = useControlled<boolean>(collapsed, defaultCollapsed, onCollapsedChange);
  return h(RawSideNav, {
    ...props,
    current: current !== undefined ? current : own,
    collapsed: c.value,
    onTcNavigate: (e: CustomEvent<SideNavNavigate>) => {
      onNavigate?.(e.detail.id, e.detail.href, e);
      if (current === undefined && !e.defaultPrevented && !e.detail.brand) setOwn(e.detail.id);
    },
    onTcCollapsedChange: (e: CustomEvent<SideNavCollapsedChange>) => c.handler(e.detail.collapsed, e),
  });
}

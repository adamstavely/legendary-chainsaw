import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBannerStack, type BannerStackDismiss, type BannerStackExpandedChange } from "../banner-stack";
import { h, useControlled } from "./internal";

export type { BannerStackDismiss, BannerStackExpandedChange } from "../banner-stack";

const RawBannerStack = createComponent({
  tagName: "tc-banner-stack",
  elementClass: TcBannerStack,
  react: React,
  events: {
    onTcDismiss: "tc-dismiss" as EventName<CustomEvent<BannerStackDismiss>>,
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<BannerStackExpandedChange>>,
  },
});
type RawBannerStackProps = React.ComponentProps<typeof RawBannerStack>;

export type BannerStackProps = Omit<RawBannerStackProps, "expanded" | "onTcDismiss" | "onTcExpandedChange"> & {
  /** Spread into a full list – controlled when given */
  expanded?: boolean;
  /** Start spread out, uncontrolled */
  defaultExpanded?: boolean;
  /** The stack is spreading out (hover, focus) or gathering (leaving, Escape) */
  onExpandedChange?: (expanded: boolean) => void;
  /** A banner is being dismissed – remove it from your data; call `event.preventDefault()` to keep it */
  onDismiss?: (id: string, event: CustomEvent<BannerStackDismiss>) => void;
};

/** Stacked notices that spread into a list on hover or focus. Banners are the children, newest first, each with a `data-id`; a `data-dismiss` button inside one dismisses it. The ref receives the element */
export function BannerStack({ expanded, defaultExpanded = false, onExpandedChange, onDismiss, ...props }: BannerStackProps) {
  const s = useControlled(expanded, defaultExpanded, onExpandedChange, { ownEvents: true });
  return h(RawBannerStack, {
    ...props,
    expanded: s.value,
    onTcExpandedChange: (e: CustomEvent<BannerStackExpandedChange>) => s.handler(e.detail.expanded, e),
    onTcDismiss: (e: CustomEvent<BannerStackDismiss>) => {
      if (e.target === e.currentTarget) onDismiss?.(e.detail.id, e);
    },
  } as RawBannerStackProps);
}

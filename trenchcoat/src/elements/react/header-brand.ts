import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcHeaderBrand, type HeaderBrandNavigate } from "../header-brand";
import { h, isNode, useStaged } from "./internal";

export type { HeaderBrandNavigate } from "../header-brand";

const RawHeaderBrand = createComponent({
  tagName: "tc-header-brand",
  elementClass: TcHeaderBrand,
  react: React,
  events: { onTcNavigate: "tc-navigate" as EventName<CustomEvent<HeaderBrandNavigate>> },
});
type RawProps = React.ComponentProps<typeof RawHeaderBrand>;
export type HeaderBrandProps = Omit<RawProps, "icon" | "onTcNavigate"> & {
  /** The logo – a React node or an element, cloned before the name */
  icon?: React.ReactNode | Element;
  /** The linked brand was clicked; call `event.preventDefault()` to route it yourself instead of following the link */
  onNavigate?: (href: string, event: CustomEvent<HeaderBrandNavigate>) => void;
};

/** The product's logo and name in an app header, as a link home or plain text */
export function HeaderBrand({ icon, onNavigate, ...props }: HeaderBrandProps) {
  const { stage, els } = useStaged(isNode(icon) ? [["icon", icon as React.ReactNode]] : []);
  return h(React.Fragment, null, stage, h(RawHeaderBrand, {
    ...props,
    icon: isNode(icon) ? els.icon : (icon as Element | undefined),
    onTcNavigate: (e: CustomEvent<HeaderBrandNavigate>) => onNavigate?.(e.detail.href, e),
  }));
}

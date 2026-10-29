import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBreadcrumbs, type BreadcrumbCopy, type BreadcrumbItem, type BreadcrumbNavigate } from "../breadcrumbs";
import { h } from "./internal";

export type { BreadcrumbCopy, BreadcrumbIcon, BreadcrumbItem, BreadcrumbNavigate } from "../breadcrumbs";

const RawBreadcrumbs = createComponent({
  tagName: "tc-breadcrumbs",
  elementClass: TcBreadcrumbs,
  react: React,
  events: {
    onTcNavigate: "tc-navigate" as EventName<CustomEvent<BreadcrumbNavigate>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<BreadcrumbCopy>>,
  },
});
export type BreadcrumbsProps = Omit<React.ComponentProps<typeof RawBreadcrumbs>, "onTcNavigate" | "onTcCopy" | "children"> & {
  /** An item was clicked; call `event.preventDefault()` to route a link yourself instead of following it */
  onNavigate?: (item: BreadcrumbItem, index: number, event: CustomEvent<BreadcrumbNavigate>) => void;
  /** Copy path was pressed; call `event.preventDefault()` to copy it your own way */
  onCopyPath?: (text: string, event: CustomEvent<BreadcrumbCopy>) => void;
};
export function Breadcrumbs({ onNavigate, onCopyPath, ...props }: BreadcrumbsProps) {
  return h(RawBreadcrumbs, {
    ...props,
    onTcNavigate: (e: CustomEvent<BreadcrumbNavigate>) => onNavigate?.(e.detail.item, e.detail.index, e),
    onTcCopy: (e: CustomEvent<BreadcrumbCopy>) => onCopyPath?.(e.detail.text, e),
  });
}

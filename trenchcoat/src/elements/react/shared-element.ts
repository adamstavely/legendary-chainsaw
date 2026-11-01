import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSharedElement, type SharedElementOpenChange } from "../shared-element";
import { h, useControlled } from "./internal";

export type { SharedElementOpenChange } from "../shared-element";

const RawSharedElement = createComponent({
  tagName: "tc-shared-element",
  elementClass: TcSharedElement,
  react: React,
  events: { onTcOpenChange: "tc-open-change" as EventName<CustomEvent<SharedElementOpenChange>> },
});
type RawProps = React.ComponentProps<typeof RawSharedElement>;
export type SharedElementProps = Omit<RawProps, "open" | "onTcOpenChange"> & {
  /** Whether the detail shows – controlled when given */
  open?: boolean;
  /** Whether it shows on mount when `open` isn't controlled */
  defaultOpen?: boolean;
  /** The detail is opening or closing */
  onOpenChange?: (open: boolean) => void;
};

export function SharedElement({ open, defaultOpen = false, onOpenChange, ...props }: SharedElementProps) {
  const o = useControlled<boolean>(open, defaultOpen, onOpenChange);
  return h(RawSharedElement, { ...props, open: o.value, onTcOpenChange: (e: CustomEvent<SharedElementOpenChange>) => o.handler(e.detail.open, e) });
}

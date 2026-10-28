import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcUncertaintyMix, type UncertaintyHiddenChange } from "../uncertainty-mix";
import { h, useControlled } from "./internal";

export type { UncertaintyHiddenChange, UncertaintyKind, UncertaintySource } from "../uncertainty-mix";
export { defaultUncertaintyKinds } from "../uncertainty-mix";

const RawUncertaintyMix = createComponent({
  tagName: "tc-uncertainty-mix",
  elementClass: TcUncertaintyMix,
  react: React,
  events: {
    onTcHiddenChange: "tc-hidden-change" as EventName<CustomEvent<UncertaintyHiddenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawUncertaintyMix>;
type Owned = "heading" | "hidden" | "hiddenKinds" | "onTcHiddenChange" | "children";
export type UncertaintyMixProps = Omit<RawProps, Owned> & {
  /** The reading card's heading – "Uncertainty mix" by default */
  title?: string;
  /** Keys of the kinds hidden from the chart and the reading (controlled) */
  hidden?: string[];
  /** Hidden at first when uncontrolled */
  defaultHidden?: string[];
  /** Called when the chart's legend hides or shows kinds */
  onHiddenChange?: (keys: string[]) => void;
};

const NONE: string[] = [];

export function UncertaintyMix({ title, hidden, defaultHidden = NONE, onHiddenChange, ...props }: UncertaintyMixProps) {
  const s = useControlled(hidden, defaultHidden, onHiddenChange);
  return h(RawUncertaintyMix, {
    ...props,
    heading: title ?? "Uncertainty mix",
    hiddenKinds: s.value,
    onTcHiddenChange: (e: CustomEvent<UncertaintyHiddenChange>) => s.handler(e.detail.hiddenKinds, e),
  });
}

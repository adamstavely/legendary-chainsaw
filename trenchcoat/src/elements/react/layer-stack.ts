import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcLayerStack, type LayerStackIndexChange } from "../layer-stack";
import { h, useControlled } from "./internal";

export type { LayerIcon, LayerStackItem } from "../layer-stack";

const RawLayerStack = createComponent({
  tagName: "tc-layer-stack",
  elementClass: TcLayerStack,
  react: React,
  events: { onTcIndexChange: "tc-index-change" as EventName<CustomEvent<LayerStackIndexChange>> },
});
type RawLayerStackProps = React.ComponentProps<typeof RawLayerStack>;
export type LayerStackProps = Omit<RawLayerStackProps, "index" | "onTcIndexChange" | "onChange"> & {
  /** The chosen entry (controlled when defined: it doesn't step on its own then) */
  index?: number;
  /** Entry to start on when uncontrolled */
  defaultIndex?: number;
  /** Reports every change of the chosen entry – picked by the user or stepped to on its own */
  onIndexChange?: (index: number) => void;
  /**
   * Called when an entry is picked by the user
   * @deprecated Use onIndexChange, which also reports the automatic steps
   */
  onChange?: (index: number) => void;
};

/** Layer Stack – an isometric stack beside a list; the chosen entry lifts its layer */
export function LayerStack({ index, defaultIndex = 0, onIndexChange, onChange, rounds, ...props }: LayerStackProps) {
  const v = useControlled<number>(index, defaultIndex, onIndexChange);
  return h(RawLayerStack, {
    ...props,
    index: v.value,
    // Controlled: it only moves when the parent changes it
    rounds: v.controlled ? 0 : rounds,
    onTcIndexChange: (e: CustomEvent<LayerStackIndexChange>) => {
      v.handler(e.detail.index, e);
      if (e.detail.user) onChange?.(e.detail.index);
    },
  });
}

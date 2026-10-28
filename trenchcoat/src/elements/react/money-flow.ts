import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcMoneyFlow, type FlowNode, type FlowRef, type FlowSelectedChange, type FlowTransfer } from "../money-flow";
import { h, useControlled } from "./internal";

export type { FlowNode, FlowNodeKind, FlowRef, FlowSelectedChange, FlowTransfer } from "../money-flow";
export { defaultFlowKindLabels } from "../money-flow";

const RawMoneyFlow = createComponent({
  tagName: "tc-money-flow",
  elementClass: TcMoneyFlow,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<FlowSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawMoneyFlow>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type MoneyFlowProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The selected entity or transfer – controlled when given (null for none) */
  selected?: FlowRef | null;
  /** The entity or transfer selected on mount when `selected` isn't controlled */
  defaultSelected?: FlowRef | null;
  /** An entity or a transfer was selected or cleared, with the one selected */
  onSelectedChange?: (selected: FlowRef | null, item?: FlowNode | FlowTransfer) => void;
};

export function MoneyFlow({ title, selected, defaultSelected = null, onSelectedChange, ...props }: MoneyFlowProps) {
  const item = React.useRef<FlowNode | FlowTransfer | undefined>(undefined);
  const report = React.useCallback((next: FlowRef | null) => onSelectedChange?.(next, item.current), [onSelectedChange]);
  const s = useControlled<FlowRef | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawMoneyFlow, {
    ...props,
    heading: title ?? "Money flow",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<FlowSelectedChange>) => {
      item.current = e.detail.node ?? e.detail.transfer;
      s.handler(e.detail.selected, e);
    },
  });
}

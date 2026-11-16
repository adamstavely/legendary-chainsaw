import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFlowBuilder, type FlowChange, type FlowStep, type FlowTestRun } from "../flow-builder";
import { h, useControlled } from "./internal";

export type { FlowBranch, FlowChange, FlowPlace, FlowStep, FlowStepOption, FlowStepStatus, FlowTestRun, FlowTrigger } from "../flow-builder";
export { defaultFlowKinds, defaultFlowOptions, flowCount, flowInsert, flowMove, flowPlaceOf, flowRemove, flowRename, flowStep } from "../flow-builder";

const RawFlowBuilder = createComponent({
  tagName: "tc-flow-builder",
  elementClass: TcFlowBuilder,
  react: React,
  events: {
    onTcFlowChange: "tc-flow-change" as EventName<CustomEvent<FlowChange>>,
    onTcTestRun: "tc-test-run" as EventName<CustomEvent<FlowTestRun>>,
  },
});
type RawProps = React.ComponentProps<typeof RawFlowBuilder>;
type Owned = "heading" | "flow" | "onTcFlowChange" | "onTcTestRun" | "children";
export type FlowBuilderProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The steps – controlled when given */
  flow?: FlowStep[];
  /** The steps on mount when `flow` isn't controlled */
  defaultFlow?: FlowStep[];
  /** A step was added, removed, moved or renamed, or an edit undone or redone */
  onFlowChange?: (flow: FlowStep[], change: FlowChange["change"], id: string) => void;
  /** Test run was pressed: run the flow and pass `statuses` as it goes */
  onTestRun?: (flow: FlowStep[]) => void;
};

const NONE: FlowStep[] = [];

export function FlowBuilder({ title, flow, defaultFlow = NONE, onFlowChange, onTestRun, ...props }: FlowBuilderProps) {
  const last = React.useRef<FlowChange | null>(null);
  const f = useControlled<FlowStep[]>(flow, defaultFlow, onFlowChange ? (next) => onFlowChange(next, last.current!.change, last.current!.id) : undefined);
  return h(RawFlowBuilder, {
    ...props,
    heading: title ?? "Flow",
    flow: f.value,
    onTcFlowChange: (e: CustomEvent<FlowChange>) => {
      last.current = e.detail;
      f.handler(e.detail.flow, e);
    },
    onTcTestRun: (e: CustomEvent<FlowTestRun>) => onTestRun?.(e.detail.flow),
  });
}

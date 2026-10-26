import { createComponent } from "@lit/react";
import * as React from "react";
import { TcPlanVsActual, type PlanVsActualStep as ElementPlanStep } from "../plan-vs-actual";
import { h, isNode, useStaged } from "./internal";

/** React nodes in place of elements: the step's icon */
export type PlanVsActualStep = Omit<ElementPlanStep, "icon"> & { icon?: React.ReactNode };

const RawPlanVsActual = createComponent({ tagName: "tc-plan-vs-actual", elementClass: TcPlanVsActual, react: React });
type RawPlanVsActualProps = React.ComponentProps<typeof RawPlanVsActual>;
export type PlanVsActualProps = Omit<RawPlanVsActualProps, "steps" | "heading" | "look"> & {
  /** The plan's steps, in order – each with its planned time, what it waits for, and its real start and end so far; `icon` takes a React node */
  steps: PlanVsActualStep[];
  /** The heading, and the list's name (default "Plan vs actual") */
  title?: string;
};
export function PlanVsActual({ steps, title = "Plan vs actual", ...props }: PlanVsActualProps) {
  const { stage, els } = useStaged(steps.filter((s) => isNode(s.icon)).map((s) => [s.id, s.icon]));
  const list = React.useMemo(() => steps.map((s) => (isNode(s.icon) ? { ...s, icon: els[s.id] } : s)) as ElementPlanStep[], [steps, els]);
  return h(React.Fragment, null, stage, h(RawPlanVsActual, { ...props, heading: title, steps: list }));
}

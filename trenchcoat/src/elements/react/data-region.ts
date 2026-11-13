import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDataRegion, type DataRegionMigrate, type DataRegionStep, type DataRegionStepChange, type DataRegionTargetChange } from "../data-region";
import { h, useControlled } from "./internal";

export type {
  DataRegionOption,
  DataRegionImpact,
  DataRegionItem,
  DataRegionLabels,
  DataRegionLabelsInput,
  DataRegionMigrate,
  DataRegionProgressStep,
  DataRegionStep,
  DataRegionStepChange,
  DataRegionTargetChange,
} from "../data-region";
export { DATA_REGION_STEPS, defaultDataRegionLabels } from "../data-region";

const RawDataRegion = createComponent({
  tagName: "tc-data-region",
  elementClass: TcDataRegion,
  react: React,
  events: {
    onTcStepChange: "tc-step-change" as EventName<CustomEvent<DataRegionStepChange>>,
    onTcTargetChange: "tc-target-change" as EventName<CustomEvent<DataRegionTargetChange>>,
    onTcMigrate: "tc-migrate" as EventName<CustomEvent<DataRegionMigrate>>,
  },
});
type RawProps = React.ComponentProps<typeof RawDataRegion>;
type Owned = "heading" | "step" | "target" | "onTcStepChange" | "onTcTargetChange" | "onTcMigrate" | "children";
export type DataRegionProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The flow's step – controlled when given */
  step?: DataRegionStep;
  /** The step on mount, when `step` isn't controlled */
  defaultStep?: DataRegionStep;
  /** The flow moved to another step */
  onStepChange?: (step: DataRegionStep) => void;
  /** The region chosen to move to – controlled when given */
  target?: string | null;
  /** The chosen region on mount, when `target` isn't controlled */
  defaultTarget?: string | null;
  /** A region was picked */
  onTargetChange?: (target: string | null) => void;
  /** Start migration was confirmed; return false to stay on Confirm */
  onMigrate?: (migrate: DataRegionMigrate) => boolean | void;
};

export function DataRegion({ title, step, defaultStep = "choose", onStepChange, target, defaultTarget = null, onTargetChange, onMigrate, ...props }: DataRegionProps) {
  const s = useControlled<DataRegionStep>(step, defaultStep, onStepChange);
  const t = useControlled<string | null>(target, defaultTarget, onTargetChange);
  return h(RawDataRegion, {
    ...props,
    heading: title ?? "Data region",
    step: s.value,
    target: t.value,
    onTcStepChange: (e: CustomEvent<DataRegionStepChange>) => s.handler(e.detail.step, e),
    onTcTargetChange: (e: CustomEvent<DataRegionTargetChange>) => t.handler(e.detail.target, e),
    onTcMigrate: (e: CustomEvent<DataRegionMigrate>) => {
      if (onMigrate?.(e.detail) === false) e.preventDefault();
    },
  });
}

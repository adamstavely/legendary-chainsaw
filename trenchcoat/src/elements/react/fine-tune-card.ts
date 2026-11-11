import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFineTuneCard, type FineTuneAdjustRequest, type FineTuneValues, type FineTuneValuesChange } from "../fine-tune-card";
import { h, useControlled } from "./internal";

export type {
  FineTuneAdjustRequest,
  FineTuneAgentChange,
  FineTuneField,
  FineTuneLabels,
  FineTuneOption,
  FineTunePreview,
  FineTuneSection,
  FineTuneValues,
  FineTuneValuesChange,
} from "../fine-tune-card";
export { defaultFineTuneLabels } from "../fine-tune-card";

const NO_VALUES: FineTuneValues = {};

const RawFineTuneCard = createComponent({
  tagName: "tc-fine-tune-card",
  elementClass: TcFineTuneCard,
  react: React,
  events: {
    onTcValuesChange: "tc-values-change" as EventName<CustomEvent<FineTuneValuesChange>>,
    onTcAdjustRequest: "tc-adjust-request" as EventName<CustomEvent<FineTuneAdjustRequest>>,
  },
});
type RawProps = React.ComponentProps<typeof RawFineTuneCard>;
export type FineTuneCardProps = Omit<RawProps, "heading" | "values" | "onTcValuesChange" | "onTcAdjustRequest" | "children"> & {
  /** What's being tuned; an empty one draws no header */
  title?: string;
  /** Each field's value by id – controlled when given */
  values?: FineTuneValues;
  /** The values to start with when uncontrolled */
  defaultValues?: FineTuneValues;
  /** A field changed – by the person, the agent or a revert */
  onValuesChange?: (values: FineTuneValues, change: FineTuneValuesChange) => void;
  /** Adjust was pressed: ask your agent to tune */
  onAdjustRequest?: () => void;
};

export function FineTuneCard({ title, values, defaultValues = NO_VALUES, onValuesChange, onAdjustRequest, ...props }: FineTuneCardProps) {
  const last = React.useRef<FineTuneValuesChange | null>(null);
  const v = useControlled(values, defaultValues, onValuesChange ? (next) => onValuesChange(next, last.current!) : undefined);
  return h(RawFineTuneCard, {
    ...props,
    heading: title ?? "Fine-tune",
    values: v.value,
    onTcValuesChange: (e: CustomEvent<FineTuneValuesChange>) => {
      last.current = e.detail;
      v.handler(e.detail.values, e);
    },
    onTcAdjustRequest: () => onAdjustRequest?.(),
  });
}

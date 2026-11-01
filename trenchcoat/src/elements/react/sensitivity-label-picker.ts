import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSensitivityLabelPicker, type SensitivityValueChange } from "../sensitivity-label-picker";
import { h, useControlled } from "./internal";

export type { SensitivityDirection, SensitivityLabel, SensitivityLabelPickerWords, SensitivityValueChange } from "../sensitivity-label-picker";
export { defaultSensitivityLabelPickerWords, defaultSensitivityLabels } from "../sensitivity-label-picker";

const RawSensitivityLabelPicker = createComponent({
  tagName: "tc-sensitivity-label-picker",
  elementClass: TcSensitivityLabelPicker,
  react: React,
  events: { onTcValueChange: "tc-value-change" as EventName<CustomEvent<SensitivityValueChange>> },
});
type RawProps = React.ComponentProps<typeof RawSensitivityLabelPicker>;
type Owned = "value" | "defaultValue" | "onTcValueChange" | "children";
export type SensitivityLabelPickerProps = Omit<RawProps, Owned> & {
  /** The id of the file's label, or null for none – controlled when given */
  value?: string | null;
  /** The label on mount when `value` isn't controlled */
  defaultValue?: string | null;
  /** The label changed; `detail` has the reason when it was lowered */
  onValueChange?: (value: string, detail: SensitivityValueChange) => void;
};

export function SensitivityLabelPicker({ value, defaultValue = null, onValueChange, ...props }: SensitivityLabelPickerProps) {
  const v = useControlled<string | null>(value, defaultValue, undefined);
  return h(RawSensitivityLabelPicker, {
    ...props,
    value: v.value,
    onTcValueChange: (e: CustomEvent<SensitivityValueChange>) => {
      v.handler(e.detail.value, e);
      onValueChange?.(e.detail.value, e.detail);
    },
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSliderField } from "../slider-field";
import { h, useControlled } from "./internal";

const Raw = createComponent({
  tagName: "tc-slider-field",
  elementClass: TcSliderField,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<
      CustomEvent<{ value: number | null }>
    >,
  },
});
export type SliderFieldProps = Omit<
  React.ComponentProps<typeof Raw>,
  "value" | "defaultValue" | "onChange" | "onTcValueChange"
> & {
  /** Current value when controlled by the application. */
  value?: number | null;
  /** Initial value when the element owns its state. */
  defaultValue?: number | null;
  /** Called with proposed edits; controlled values remain application-owned. */
  onChange?: (value: number | null) => void;
};
const DEFAULT: number | null = 0;
export function SliderField({
  value,
  defaultValue = DEFAULT,
  onChange,
  ...props
}: SliderFieldProps) {
  const state = useControlled(value, defaultValue, onChange);
  return h(Raw, {
    ...props,
    value: state.value,
    onTcValueChange: (e: CustomEvent<{ value: number | null }>) =>
      state.handler(e.detail.value, e),
  });
}

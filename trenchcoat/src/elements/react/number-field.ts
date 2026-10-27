import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcNumberField } from "../number-field";
import { h, useControlled } from "./internal";

const Raw = createComponent({
  tagName: "tc-number-field",
  elementClass: TcNumberField,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<
      CustomEvent<{ value: number }>
    >,
  },
});
export type NumberFieldProps = Omit<
  React.ComponentProps<typeof Raw>,
  "value" | "defaultValue" | "onChange" | "onTcValueChange"
> & {
  /** Current value when controlled by the application. */
  value?: number;
  /** Initial value when the element owns its state. */
  defaultValue?: number;
  /** Called with proposed edits; controlled values remain application-owned. */
  onChange?: (value: number) => void;
};
const DEFAULT: number = 0;
export function NumberField({
  value,
  defaultValue = DEFAULT,
  onChange,
  ...props
}: NumberFieldProps) {
  const state = useControlled(value, defaultValue, onChange);
  return h(Raw, {
    ...props,
    value: state.value,
    onTcValueChange: (e: CustomEvent<{ value: number }>) =>
      state.handler(e.detail.value, e),
  });
}

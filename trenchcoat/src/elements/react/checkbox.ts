import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCheckbox } from "../checkbox";
import { h, useControlled } from "./internal";

const Raw = createComponent({
  tagName: "tc-checkbox",
  elementClass: TcCheckbox,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<
      CustomEvent<{ value: boolean }>
    >,
  },
});
export type CheckboxProps = Omit<
  React.ComponentProps<typeof Raw>,
  "value" | "defaultValue" | "onChange" | "onTcValueChange"
> & {
  /** Current value when controlled by the application. */
  value?: boolean;
  /** Initial value when the element owns its state. */
  defaultValue?: boolean;
  /** Called with proposed edits; controlled values remain application-owned. */
  onChange?: (value: boolean) => void;
};
const DEFAULT: boolean = false;
export function Checkbox({
  value,
  defaultValue = DEFAULT,
  onChange,
  ...props
}: CheckboxProps) {
  const state = useControlled(value, defaultValue, onChange);
  return h(Raw, {
    ...props,
    value: state.value,
    onTcValueChange: (e: CustomEvent<{ value: boolean }>) =>
      state.handler(e.detail.value, e),
  });
}

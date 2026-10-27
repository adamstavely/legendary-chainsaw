import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSecretField } from "../secret-field";
import { h, useControlled } from "./internal";

const Raw = createComponent({
  tagName: "tc-secret-field",
  elementClass: TcSecretField,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<
      CustomEvent<{ value: string }>
    >,
  },
});
export type SecretFieldProps = Omit<
  React.ComponentProps<typeof Raw>,
  "value" | "defaultValue" | "onChange" | "onTcValueChange"
> & {
  /** Current value when controlled by the application. */
  value?: string;
  /** Initial value when the element owns its state. */
  defaultValue?: string;
  /** Called with proposed edits; controlled values remain application-owned. */
  onChange?: (value: string) => void;
};
const DEFAULT: string = "";
export function SecretField({
  value,
  defaultValue = DEFAULT,
  onChange,
  ...props
}: SecretFieldProps) {
  const state = useControlled(value, defaultValue, onChange);
  return h(Raw, {
    ...props,
    value: state.value,
    onTcValueChange: (e: CustomEvent<{ value: string }>) =>
      state.handler(e.detail.value, e),
  });
}

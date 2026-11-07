import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSelect, type SelectOpenChange, type SelectOption, type SelectValueChange } from "../select";
import { h, useControlled } from "./internal";

export type { SelectOption, SelectValueChange, SelectOpenChange } from "../select";

const RawSelect = createComponent({
  tagName: "tc-select",
  elementClass: TcSelect,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<SelectValueChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<SelectOpenChange>>,
  },
});
type RawSelectProps = React.ComponentProps<typeof RawSelect>;
type Own = "options" | "value" | "defaultValue" | "onChange" | "open" | "onTcValueChange" | "onTcOpenChange";
export type SelectProps = Omit<RawSelectProps, Own> & {
  /** The options, in list order */
  options: SelectOption[];
  /** The chosen option's value (controlled when defined) */
  value?: string;
  /** The value chosen at first when uncontrolled – none (the placeholder) by default */
  defaultValue?: string;
  /** Called with the value of the option that was picked */
  onChange?: (value: string) => void;
  /** Controlled open state of the list */
  open?: boolean;
  /** Whether the list starts open when uncontrolled */
  defaultOpen?: boolean;
  /** Called when the list opens or closes */
  onOpenChange?: (open: boolean) => void;
};

export function Select({ options, value, defaultValue = "", onChange, open, defaultOpen = false, onOpenChange, ...props }: SelectProps) {
  const v = useControlled(value, defaultValue, onChange);
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(RawSelect, {
    ...props,
    options,
    value: v.value,
    open: o.value,
    onTcValueChange: (e: CustomEvent<SelectValueChange>) => v.handler(e.detail.value, e),
    onTcOpenChange: (e: CustomEvent<SelectOpenChange>) => o.handler(e.detail.open, e),
  });
}

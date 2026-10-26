import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCombobox, type ComboboxOption, type ComboboxValueChange } from "../combobox";
import { h, isNode, useControlled, useStaged } from "./internal";

/** React nodes in place of elements: icons and logos */
export type ComboboxOptionNode = Omit<ComboboxOption, "icon"> & { icon?: React.ReactNode };
export type { ComboboxOptionNode as ComboboxOption };

const RawCombobox = createComponent({
  tagName: "tc-combobox",
  elementClass: TcCombobox,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<ComboboxValueChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<{ open: boolean }>>,
  },
});
type RawComboboxProps = React.ComponentProps<typeof RawCombobox>;
export type ComboboxProps = Omit<RawComboboxProps, "value" | "open" | "onTcValueChange" | "onTcOpenChange" | "single" | "onChange" | "options"> & {
  options: ComboboxOptionNode[];
  /** Pick many (the default) or one */
  multiple?: boolean;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[], options: ComboboxOption[]) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};
export function Combobox({ multiple = true, value, defaultValue = [], onChange, open, defaultOpen = false, onOpenChange, options, ...props }: ComboboxProps) {
  const last = React.useRef<ComboboxOption[]>([]);
  const { stage, els } = useStaged(options.filter((o) => isNode(o.icon)).map((o) => [o.value, o.icon]));
  const opts = React.useMemo(() => options.map((o) => (isNode(o.icon) ? { ...o, icon: els[o.value] } : o)) as ComboboxOption[], [options, els]);
  const v = useControlled(value, defaultValue, (next) => onChange?.(next, last.current));
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(React.Fragment, null, stage, h(RawCombobox, {
    ...props,
    options: opts,
    single: !multiple,
    value: v.value,
    open: o.value,
    onTcValueChange: (e: CustomEvent<ComboboxValueChange>) => {
      last.current = e.detail.options;
      v.handler(e.detail.value, e);
    },
    onTcOpenChange: (e: CustomEvent<{ open: boolean }>) => o.handler(e.detail.open, e),
  }));
}

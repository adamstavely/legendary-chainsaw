import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTreeSelect, type TreeOption, type TreeSelectOpenChange, type TreeSelectValue, type TreeSelectValueChange } from "../tree-select";
import { h, useControlled } from "./internal";

export type { TreeOption, TreeSelectValue, TreeSelectValueChange } from "../tree-select";

const RawTreeSelect = createComponent({
  tagName: "tc-tree-select",
  elementClass: TcTreeSelect,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<TreeSelectValueChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<TreeSelectOpenChange>>,
  },
});
export type TreeSelectProps = Omit<React.ComponentProps<typeof RawTreeSelect>, "value" | "defaultValue" | "open" | "onChange" | "onTcValueChange" | "onTcOpenChange" | "children"> & {
  /** The picked id (or ids with `multiple`), null for nothing – controlled when given */
  value?: TreeSelectValue;
  /** The value on mount when `value` isn't controlled */
  defaultValue?: TreeSelectValue;
  /** Every pick, check and clear, with the picked options */
  onChange?: (value: TreeSelectValue, options: TreeOption[]) => void;
  /** Whether the tree is open – controlled when given */
  open?: boolean;
  /** Whether the tree starts open when uncontrolled */
  defaultOpen?: boolean;
  /** The tree opened or closed */
  onOpenChange?: (open: boolean) => void;
};
export function TreeSelect({ value, defaultValue = null, onChange, open, defaultOpen = false, onOpenChange, ...props }: TreeSelectProps) {
  const last = React.useRef<TreeOption[]>([]);
  const v = useControlled<TreeSelectValue>(value, defaultValue, (next) => onChange?.(next, last.current));
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(RawTreeSelect, {
    ...props,
    value: v.value,
    open: o.value,
    onTcValueChange: (e: CustomEvent<TreeSelectValueChange>) => {
      last.current = e.detail.options;
      v.handler(e.detail.value, e);
    },
    onTcOpenChange: (e: CustomEvent<TreeSelectOpenChange>) => o.handler(e.detail.open, e),
  });
}

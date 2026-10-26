import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { compareDateRange, defaultRangePresets, formatDateRange, TcDateRangePicker, type CompareMode, type DateRange, type DateRangeValueChange } from "../date-range-picker";
import { h, useControlled } from "./internal";

export type { CompareMode, DateRange, RangePreset } from "../date-range-picker";
/** "Sep 9 – Oct 8, 2026", "Dec 20, 2025 – Jan 5, 2026", "Oct 8, 2026" */
export const formatRange = formatDateRange;
export const compareRange = compareDateRange;
export const defaultPresets = defaultRangePresets;

const RawDateRangePicker = createComponent({
  tagName: "tc-date-range-picker",
  elementClass: TcDateRangePicker,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<DateRangeValueChange>>,
    onTcCompareChange: "tc-compare-change" as EventName<CustomEvent<{ mode: CompareMode }>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<{ open: boolean }>>,
  },
});
type RawDateRangePickerProps = React.ComponentProps<typeof RawDateRangePicker>;
export type DateRangePickerProps = Omit<RawDateRangePickerProps, "value" | "open" | "compareMode" | "onChange" | "onTcValueChange" | "onTcCompareChange" | "onTcOpenChange"> & {
  /** The applied range. Controlled when defined; otherwise the picker keeps its own, starting at `defaultValue` */
  value?: DateRange;
  /** Starting range when uncontrolled – defaults to the last 30 days */
  defaultValue?: DateRange;
  /** Called on Apply with the range and the comparison range (if any) */
  onChange?: (range: DateRange, compare: DateRange | null, mode: CompareMode) => void;
  /** The applied comparison. Controlled when defined (changes come through onChange's third argument); otherwise
   *  starts at `defaultCompare` */
  compareMode?: CompareMode;
  defaultCompare?: CompareMode;
  /** Whether the panel is open. Controlled when defined; otherwise starts at `defaultOpen` */
  open?: boolean;
  /** Open the panel right away – nice for previews */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DateRangePicker({ value, defaultValue, onChange, compare = true, compareMode, defaultCompare = "previous", open, defaultOpen = false, onOpenChange, ...props }: DateRangePickerProps) {
  const [initialValue] = React.useState(defaultValue);
  const [initialCompare] = React.useState(defaultCompare);
  const modeControlled = compare && compareMode !== undefined;
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(RawDateRangePicker, {
    ...props,
    compare,
    value: value ?? initialValue,
    compareMode: modeControlled ? compareMode : initialCompare,
    open: o.value,
    onTcValueChange: (e: CustomEvent<DateRangeValueChange>) => {
      if (value !== undefined) e.preventDefault();
      onChange?.(e.detail.value, e.detail.compare, e.detail.mode);
    },
    onTcCompareChange: (e: CustomEvent<{ mode: CompareMode }>) => {
      if (modeControlled) e.preventDefault();
    },
    onTcOpenChange: (e: CustomEvent<{ open: boolean }>) => o.handler(e.detail.open, e),
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcColorPicker, type ColorPickerCopy, type ColorPickerFormat, type ColorPickerFormatChange, type ColorPickerValueChange } from "../color-picker";
import { h, useControlled } from "./internal";

export type { ColorPickerCmyk, ColorPickerCopy, ColorPickerFormat, ColorPickerLabels, ColorPickerRgb, ColorPickerSwatch, ColorPickerValueChange } from "../color-picker";
export { colorCmykToRgb, colorRgbToCmyk, colorToHex, defaultColorPickerLabels, parseColorHex } from "../color-picker";

const RawColorPicker = createComponent({
  tagName: "tc-color-picker",
  elementClass: TcColorPicker,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<ColorPickerValueChange>>,
    onTcFormatChange: "tc-format-change" as EventName<CustomEvent<ColorPickerFormatChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<ColorPickerCopy>>,
  },
});
type RawProps = React.ComponentProps<typeof RawColorPicker>;
type Owned = "heading" | "value" | "defaultValue" | "format" | "onTcValueChange" | "onTcFormatChange" | "onTcCopy" | "children";
export type ColorPickerProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Colour" */
  title?: string;
  /** The colour, "#rrggbb" ("#rrggbbaa" with `alpha`) – controlled when given */
  value?: string;
  /** The colour on mount when `value` isn't controlled; by default black */
  defaultValue?: string;
  /** The colour changed; `detail` has it as rgb and CMYK too */
  onValueChange?: (value: string, detail: ColorPickerValueChange) => void;
  /** Which fields show – controlled when given */
  format?: ColorPickerFormat;
  /** The fields on mount when `format` isn't controlled; by default "hex" */
  defaultFormat?: ColorPickerFormat;
  /** Another format was picked */
  onFormatChange?: (format: ColorPickerFormat) => void;
  /** Copy was pressed with the colour as text; return false to copy it yourself */
  onCopyColor?: (text: string, format: ColorPickerFormat) => void | false;
};

export function ColorPicker({ title, value, defaultValue = "#000000", onValueChange, format, defaultFormat = "hex", onFormatChange, onCopyColor, ...props }: ColorPickerProps) {
  const detail = React.useRef<ColorPickerValueChange | null>(null);
  const v = useControlled<string>(value, defaultValue, onValueChange ? (next) => onValueChange(next, detail.current!) : undefined);
  const f = useControlled<ColorPickerFormat>(format, defaultFormat, onFormatChange);
  return h(RawColorPicker, {
    ...props,
    heading: title ?? "",
    value: v.value,
    format: f.value,
    onTcValueChange: (e: CustomEvent<ColorPickerValueChange>) => {
      detail.current = e.detail;
      v.handler(e.detail.value, e);
    },
    onTcFormatChange: (e: CustomEvent<ColorPickerFormatChange>) => f.handler(e.detail.format, e),
    onTcCopy: (e: CustomEvent<ColorPickerCopy>) => {
      if (onCopyColor?.(e.detail.text, e.detail.format) === false) e.preventDefault();
    },
  });
}

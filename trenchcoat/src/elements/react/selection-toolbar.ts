import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcSelectionToolbar,
  type SelectionToolbarClose,
  type SelectionToolbarCommand,
  type SelectionToolbarPressedChange,
  type SelectionToolbarValuesChange,
} from "../selection-toolbar";
import { h, useControlled } from "./internal";

export type {
  SelectionToolbarClose,
  SelectionToolbarCommand,
  SelectionToolbarItem,
  SelectionToolbarLabels,
  SelectionToolbarOption,
  SelectionToolbarPressedChange,
  SelectionToolbarValuesChange,
} from "../selection-toolbar";
export { defaultSelectionToolbarItems, defaultSelectionToolbarLabels, selectionRect } from "../selection-toolbar";

const RawSelectionToolbar = createComponent({
  tagName: "tc-selection-toolbar",
  elementClass: TcSelectionToolbar,
  react: React,
  events: {
    onTcCommand: "tc-command" as EventName<CustomEvent<SelectionToolbarCommand>>,
    onTcPressedChange: "tc-pressed-change" as EventName<CustomEvent<SelectionToolbarPressedChange>>,
    onTcValuesChange: "tc-values-change" as EventName<CustomEvent<SelectionToolbarValuesChange>>,
    onTcClose: "tc-close" as EventName<CustomEvent<SelectionToolbarClose>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSelectionToolbar>;
export type SelectionToolbarProps = Omit<RawProps, "pressed" | "values" | "onTcPressedChange" | "onTcValuesChange" | "children"> & {
  /** The toggles that are on – controlled when given (usually from the editor's state at the selection) */
  pressed?: string[];
  /** The toggles on at first, when `pressed` isn't controlled */
  defaultPressed?: string[];
  /** A toggle was pressed */
  onPressedChange?: (pressed: string[], id: string) => void;
  /** Each menu's chosen option – controlled when given */
  values?: Record<string, string>;
  /** The menus' options at first, when `values` isn't controlled */
  defaultValues?: Record<string, string>;
  /** A menu option was chosen */
  onValuesChange?: (values: Record<string, string>, id: string, value: string) => void;
};

/** A formatting bar that floats over selected text; every press fires `onTcCommand` for the editor to apply */
export function SelectionToolbar({ pressed, defaultPressed = [], onPressedChange, values, defaultValues = {}, onValuesChange, ...props }: SelectionToolbarProps) {
  const last = React.useRef<{ id: string; value: string }>({ id: "", value: "" });
  const p = useControlled<string[]>(pressed, defaultPressed, onPressedChange ? (next) => onPressedChange(next, last.current.id) : undefined);
  const v = useControlled<Record<string, string>>(values, defaultValues, onValuesChange ? (next) => onValuesChange(next, last.current.id, last.current.value) : undefined);
  return h(RawSelectionToolbar, {
    ...props,
    pressed: p.value,
    values: v.value,
    onTcPressedChange: (e: CustomEvent<SelectionToolbarPressedChange>) => {
      last.current = { id: e.detail.id, value: "" };
      p.handler(e.detail.pressed, e);
    },
    onTcValuesChange: (e: CustomEvent<SelectionToolbarValuesChange>) => {
      last.current = { id: e.detail.id, value: e.detail.value };
      v.handler(e.detail.values, e);
    },
  });
}

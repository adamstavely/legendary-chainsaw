import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcColumnMapper, type ColumnMapperContinue, type ColumnMapping, type ColumnMappingChange } from "../column-mapper";
import { h, useControlled } from "./internal";

export type { ColumnMapperColumn, ColumnMapperField, ColumnMapperLabels, ColumnMapperSuggestion, ColumnMapping, ColumnMappingChange } from "../column-mapper";

const RawColumnMapper = createComponent({
  tagName: "tc-column-mapper",
  elementClass: TcColumnMapper,
  react: React,
  events: {
    onTcMappingChange: "tc-mapping-change" as EventName<CustomEvent<ColumnMappingChange>>,
    onTcContinue: "tc-continue" as EventName<CustomEvent<ColumnMapperContinue>>,
  },
});
type RawColumnMapperProps = React.ComponentProps<typeof RawColumnMapper>;

export type ColumnMapperOwnProps = {
  /** The heading */
  title?: string;
  /** Column id → field id, null for "Don't import". Controlled when defined – pass back what onMappingChange reports */
  mapping?: ColumnMapping;
  /** The starting mapping when uncontrolled; columns left out use their suggestion */
  defaultMapping?: ColumnMapping;
  /** A column's field changed, or every suggestion was accepted: the whole mapping, the column (null for all) and its field */
  onMappingChange?: (mapping: ColumnMapping, column: string | null, field: string | null) => void;
  /** Continue was pressed with every required field matched */
  onContinue?: (mapping: ColumnMapping) => void;
};
export type ColumnMapperProps = Omit<RawColumnMapperProps, keyof ColumnMapperOwnProps | "heading" | "onTcMappingChange" | "onTcContinue"> & ColumnMapperOwnProps;

const EMPTY: ColumnMapping = {};

export function ColumnMapper({ title = "Match columns", mapping, defaultMapping = EMPTY, onMappingChange, onContinue, ...props }: ColumnMapperProps) {
  const last = React.useRef<{ column: string | null; field: string | null }>({ column: null, field: null });
  const report = React.useCallback((next: ColumnMapping) => onMappingChange?.(next, last.current.column, last.current.field), [onMappingChange]);
  const m = useControlled(mapping, defaultMapping, report);
  return h(RawColumnMapper, {
    ...props,
    heading: title,
    mapping: m.value,
    onTcMappingChange: (e: CustomEvent<ColumnMappingChange>) => {
      last.current = { column: e.detail.column, field: e.detail.field };
      m.handler(e.detail.mapping, e);
    },
    onTcContinue: (e: CustomEvent<ColumnMapperContinue>) => onContinue?.(e.detail.mapping),
  });
}

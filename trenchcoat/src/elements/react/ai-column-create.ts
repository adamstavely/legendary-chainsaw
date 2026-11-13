import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAiColumnCreate, defaultAiColumnValue, type AiColumnField, type AiColumnRequest, type AiColumnValue, type AiColumnValueChange } from "../ai-column-create";
import { h, useControlled } from "./internal";

export type {
  AiColumnField,
  AiColumnModel,
  AiColumnPreviewRow,
  AiColumnRequest,
  AiColumnSource,
  AiColumnType,
  AiColumnValue,
  AiColumnValueChange,
} from "../ai-column-create";
export { aiColumnProblems, defaultAiColumnValue, promptVariables } from "../ai-column-create";

const RawAiColumnCreate = createComponent({
  tagName: "tc-ai-column-create",
  elementClass: TcAiColumnCreate,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<AiColumnValueChange>>,
    onTcPreview: "tc-preview" as EventName<CustomEvent<AiColumnRequest>>,
    onTcCreate: "tc-create" as EventName<CustomEvent<AiColumnRequest>>,
  },
});
type RawAiColumnCreateProps = React.ComponentProps<typeof RawAiColumnCreate>;

export type AiColumnCreateOwnProps = {
  /** The heading */
  title?: string;
  /** The column being written. Controlled when defined – pass back what onValueChange reports */
  value?: AiColumnValue;
  /** The column to start from, when uncontrolled */
  defaultValue?: AiColumnValue;
  /** A field was edited: the whole column and which field */
  onValueChange?: (value: AiColumnValue, field: AiColumnField) => void;
  /** Try on 3 rows was pressed: run the prompt on three rows and pass `preview` back. Return false to stay idle */
  onPreview?: (column: AiColumnValue) => void | boolean;
  /** Create column was pressed with a column that can run. Return false to stop it being announced */
  onCreate?: (column: AiColumnValue) => void | boolean;
};
export type AiColumnCreateProps = Omit<RawAiColumnCreateProps, keyof AiColumnCreateOwnProps | "heading" | "onTcValueChange" | "onTcPreview" | "onTcCreate" | "children"> &
  AiColumnCreateOwnProps;

export function AiColumnCreate({ title = "New AI column", value, defaultValue = defaultAiColumnValue, onValueChange, onPreview, onCreate, ...props }: AiColumnCreateProps) {
  // The edited field travels with the value: kept from the event for onValueChange's second argument
  const field = React.useRef<AiColumnField>("name");
  const report = React.useCallback((next: AiColumnValue) => onValueChange?.(next, field.current), [onValueChange]);
  const s = useControlled(value, defaultValue, report);
  return h(RawAiColumnCreate, {
    ...props,
    heading: title,
    value: s.value,
    onTcValueChange: (e: CustomEvent<AiColumnValueChange>) => {
      field.current = e.detail.field;
      s.handler(e.detail.value, e);
    },
    onTcPreview: (e: CustomEvent<AiColumnRequest>) => {
      if (onPreview?.(e.detail.column) === false) e.preventDefault();
    },
    onTcCreate: (e: CustomEvent<AiColumnRequest>) => {
      if (onCreate?.(e.detail.column) === false) e.preventDefault();
    },
  });
}

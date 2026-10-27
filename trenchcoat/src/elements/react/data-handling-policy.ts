import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDataHandlingPolicy, type DataHandlingPolicyValue, type DataPolicyChange, type DataPolicyDeletionEvent, type DataPolicyField, type DataPolicyOption } from "../data-handling-policy";
import { h, useControlled } from "./internal";

export type {
  DataHandlingPolicyValue,
  DataPolicyCategory,
  DataPolicyChange,
  DataPolicyDeletion,
  DataPolicyDeletionEvent,
  DataPolicyField,
  DataPolicyLock,
  DataPolicyOption,
} from "../data-handling-policy";
export { DATA_POLICY_CATEGORIES, DATA_POLICY_DELETION_SCOPES, DATA_POLICY_LOGGING, DATA_POLICY_MEMORY, DATA_POLICY_RETENTION } from "../data-handling-policy";

const RawDataHandlingPolicy = createComponent({
  tagName: "tc-data-handling-policy",
  elementClass: TcDataHandlingPolicy,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<DataPolicyChange>>,
    onTcDeletionRequest: "tc-deletion-request" as EventName<CustomEvent<DataPolicyDeletionEvent>>,
  },
});
type RawProps = React.ComponentProps<typeof RawDataHandlingPolicy>;
type Owned = "value" | "defaultValue" | "heading" | "onTcValueChange" | "onTcDeletionRequest" | "onChange" | "children";
export type DataHandlingPolicyProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The chosen policy (controlled) */
  value?: DataHandlingPolicyValue;
  /** The policy to start with when uncontrolled */
  defaultValue?: DataHandlingPolicyValue;
  /** Called with the whole policy and the setting that changed, after every change */
  onChange?: (value: DataHandlingPolicyValue, field: DataPolicyField) => void;
  /** A deletion was confirmed: send the request. Call `event.preventDefault()` if it can't be sent, so no pending request shows */
  onDeletionRequest?: (scope: DataPolicyOption, event: CustomEvent<DataPolicyDeletionEvent>) => void;
};

const DEFAULT: DataHandlingPolicyValue = { retention: "30d", memory: "conversation", logging: "metadata", redact: ["personal", "financial", "credentials"], training: false };

export function DataHandlingPolicy({ title, value, defaultValue = DEFAULT, onChange, onDeletionRequest, ...props }: DataHandlingPolicyProps) {
  const field = React.useRef<DataPolicyField>("retention");
  const report = React.useCallback((next: DataHandlingPolicyValue) => onChange?.(next, field.current), [onChange]);
  const v = useControlled(value, defaultValue, onChange ? report : undefined);
  return h(RawDataHandlingPolicy, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    value: v.value as RawProps["value"],
    onTcValueChange: (e: CustomEvent<DataPolicyChange>) => {
      field.current = e.detail.field;
      v.handler(e.detail.value, e);
    },
    onTcDeletionRequest: (e: CustomEvent<DataPolicyDeletionEvent>) => onDeletionRequest?.(e.detail.scope, e),
  });
}

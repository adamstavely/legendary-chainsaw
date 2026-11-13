import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDataControls, type DataControlsDeleteChats, type DataControlsField, type DataControlsValue, type DataControlsValueChange } from "../data-controls";
import { h, useControlled } from "./internal";

export type { DataControlsDeleteChats, DataControlsField, DataControlsLabels, DataControlsValue, DataControlsValueChange, DataExportStatus } from "../data-controls";
export { defaultDataControlsLabels } from "../data-controls";

const RawDataControls = createComponent({
  tagName: "tc-data-controls",
  elementClass: TcDataControls,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<DataControlsValueChange>>,
    onTcExport: "tc-export" as EventName<CustomEvent<Record<string, never>>>,
    onTcDeleteChats: "tc-delete-chats" as EventName<CustomEvent<DataControlsDeleteChats>>,
    onTcDeleteAccount: "tc-delete-account" as EventName<CustomEvent<Record<string, never>>>,
  },
});
type RawProps = React.ComponentProps<typeof RawDataControls>;
type Owned = "heading" | "value" | "defaultValue" | "onTcValueChange" | "onTcExport" | "onTcDeleteChats" | "onTcDeleteAccount" | "children";
export type DataControlsProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The switches – controlled when given */
  value?: DataControlsValue;
  /** The switches on mount, when `value` isn't controlled */
  defaultValue?: DataControlsValue;
  /** A switch was flipped: the whole value and the field that changed */
  onValueChange?: (value: DataControlsValue, field: DataControlsField) => void;
  /** Export my data was pressed; return false to keep the status as it is */
  onExport?: () => boolean | void;
  /** Delete chats was confirmed; return false to keep the dialog open */
  onDeleteChats?: (count: number) => boolean | void;
  /** Delete account was pressed, when there's no `deleteAccountHref` */
  onDeleteAccount?: () => void;
};

const START: DataControlsValue = { training: false, history: true, memory: true };

export function DataControls({ title, value, defaultValue = START, onValueChange, onExport, onDeleteChats, onDeleteAccount, ...props }: DataControlsProps) {
  const field = React.useRef<DataControlsField>("training");
  const v = useControlled<DataControlsValue>(value, defaultValue, onValueChange ? (next) => onValueChange(next, field.current) : undefined);
  return h(RawDataControls, {
    ...props,
    heading: title ?? "Data controls",
    value: v.value,
    onTcValueChange: (e: CustomEvent<DataControlsValueChange>) => {
      field.current = e.detail.field;
      v.handler(e.detail.value, e);
    },
    onTcExport: (e: CustomEvent) => {
      if (onExport?.() === false) e.preventDefault();
    },
    onTcDeleteChats: (e: CustomEvent<DataControlsDeleteChats>) => {
      if (onDeleteChats?.(e.detail.count) === false) e.preventDefault();
    },
    onTcDeleteAccount: () => onDeleteAccount?.(),
  });
}

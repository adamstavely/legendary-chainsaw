import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTagInput, type TagInputValueChange, type TagInvalid } from "../tag-input";
import { h, useControlled } from "./internal";

export type { TagInputValueChange, TagInvalid, TagInvalidReason, TagValidator } from "../tag-input";

const RawTagInput = createComponent({
  tagName: "tc-tag-input",
  elementClass: TcTagInput,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<TagInputValueChange>>,
    onTcInvalidTag: "tc-invalid-tag" as EventName<CustomEvent<TagInvalid>>,
  },
});
export type TagInputProps = Omit<React.ComponentProps<typeof RawTagInput>, "value" | "defaultValue" | "onChange" | "onTcValueChange" | "onTcInvalidTag" | "children"> & {
  /** The tags – controlled when given */
  value?: string[];
  /** The tags on mount when `value` isn't controlled */
  defaultValue?: string[];
  /** Tags were added or removed */
  onChange?: (value: string[], change: TagInputValueChange) => void;
  /** A tag was refused: a duplicate, over `max`, not a suggestion, or refused by `validate` */
  onInvalidTag?: (invalid: TagInvalid) => void;
};
const NONE: string[] = [];
export function TagInput({ value, defaultValue = NONE, onChange, onInvalidTag, ...props }: TagInputProps) {
  const last = React.useRef<TagInputValueChange>({ value: [] });
  const v = useControlled(value, defaultValue, (next) => onChange?.(next, last.current));
  return h(RawTagInput, {
    ...props,
    value: v.value,
    onTcValueChange: (e: CustomEvent<TagInputValueChange>) => {
      last.current = e.detail;
      v.handler(e.detail.value, e);
    },
    onTcInvalidTag: (e: CustomEvent<TagInvalid>) => onInvalidTag?.(e.detail),
  });
}

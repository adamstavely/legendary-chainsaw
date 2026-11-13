import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcModelAccess, type ModelAccessChange, type ModelAccessChangeCause, type ModelAccessValue } from "../model-access";
import { h, useControlled } from "./internal";

export type {
  ModelAccessChange,
  ModelAccessChangeCause,
  ModelAccessEditor,
  ModelAccessLabels,
  ModelAccessModel,
  ModelAccessRule,
  ModelAccessValue,
  ModelCapability,
  ModelPriceTier,
} from "../model-access";
export { defaultModelAccessLabels, modelAllowed } from "../model-access";

const RawModelAccess = createComponent({
  tagName: "tc-model-access",
  elementClass: TcModelAccess,
  react: React,
  events: { onTcAccessChange: "tc-access-change" as EventName<CustomEvent<ModelAccessChange>> },
});
type Owned = "heading" | "access" | "onTcAccessChange" | "children";
export type ModelAccessProps = Omit<React.ComponentProps<typeof RawModelAccess>, Owned> & {
  /** The heading */
  title?: string;
  /** The policy – controlled when given */
  access?: ModelAccessValue;
  /** The policy on mount, when `access` isn't controlled */
  defaultAccess?: ModelAccessValue;
  /** Called with the next policy and what changed */
  onAccessChange?: (access: ModelAccessValue, change: ModelAccessChangeCause) => void;
};
const EMPTY: ModelAccessValue = { models: {} };

export function ModelAccess({ title, access, defaultAccess = EMPTY, onAccessChange, ...props }: ModelAccessProps) {
  const cause = React.useRef<ModelAccessChangeCause>({ type: "block-new", blockNew: false });
  const report = React.useCallback((next: ModelAccessValue) => onAccessChange?.(next, cause.current), [onAccessChange]);
  const a = useControlled(access, defaultAccess, onAccessChange ? report : undefined);
  return h(RawModelAccess, {
    ...props,
    heading: title ?? "Model access",
    access: a.value,
    onTcAccessChange: (e: CustomEvent<ModelAccessChange>) => {
      cause.current = e.detail.change;
      a.handler(e.detail.access, e);
    },
  });
}

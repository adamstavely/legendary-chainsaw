import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTriggerBuilder, type TriggerEvent, type TriggerValue, type TriggerValueChange } from "../trigger-builder";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { TriggerActive, TriggerCondition, TriggerField, TriggerFrequency, TriggerOperator, TriggerSchedule, TriggerValue } from "../trigger-builder";
export { describeTrigger, nextTriggerRuns } from "../trigger-builder";

/** React nodes in place of elements: event icons */
export type TriggerEventNode = Omit<TriggerEvent, "icon"> & { icon?: React.ReactNode };
export type { TriggerEventNode as TriggerEvent };

const RawTriggerBuilder = createComponent({
  tagName: "tc-trigger-builder",
  elementClass: TcTriggerBuilder,
  react: React,
  events: { onTcValueChange: "tc-value-change" as EventName<CustomEvent<TriggerValueChange>> },
});

type RawProps = React.ComponentProps<typeof RawTriggerBuilder>;
export type TriggerBuilderProps = Omit<RawProps, "value" | "defaultValue" | "events" | "heading" | "onTcValueChange" | "onChange"> & {
  /** The events a trigger can listen for */
  events?: TriggerEventNode[];
  /** Shown at the top; names the group */
  title?: string;
  /** The trigger definition (controlled) */
  value?: TriggerValue;
  defaultValue?: TriggerValue;
  onChange?: (value: TriggerValue) => void;
};

const DEFAULT: TriggerValue = { kind: "schedule", schedule: { frequency: "weekly", days: [1], time: "09:00" }, active: null, conditions: [], match: "all" };

export function TriggerBuilder({ events = [], title, value, defaultValue = DEFAULT, onChange, ...props }: TriggerBuilderProps) {
  const { stage, els } = useStaged(events.filter((e) => isNode(e.icon)).map((e) => [e.id, e.icon]));
  const evs = React.useMemo(() => events.map((e) => (isNode(e.icon) ? { ...e, icon: els[e.id] } : e)) as TriggerEvent[], [events, els]);
  const v = useControlled(value, defaultValue, onChange);
  return h(React.Fragment, null, stage, h(RawTriggerBuilder, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    events: evs,
    value: v.value,
    onTcValueChange: (e: CustomEvent<TriggerValueChange>) => v.handler(e.detail.value, e),
  }));
}

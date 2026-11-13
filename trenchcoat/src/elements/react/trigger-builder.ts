import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTriggerBuilder, type TriggerEvent, type TriggerValue, type TriggerValueChange, type TriggerWebhookTest } from "../trigger-builder";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { TriggerActive, TriggerCondition, TriggerField, TriggerFrequency, TriggerMethod, TriggerOperator, TriggerSchedule, TriggerValue, TriggerWebhook, TriggerWebhookRequest, TriggerWebhookTest } from "../trigger-builder";
export { describeTrigger, nextTriggerRuns } from "../trigger-builder";

/** React nodes in place of elements: event icons */
export type TriggerEventNode = Omit<TriggerEvent, "icon"> & { icon?: React.ReactNode };
export type { TriggerEventNode as TriggerEvent };

const RawTriggerBuilder = createComponent({
  tagName: "tc-trigger-builder",
  elementClass: TcTriggerBuilder,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<TriggerValueChange>>,
    onTcWebhookTest: "tc-webhook-test" as EventName<CustomEvent<TriggerWebhookTest>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<{ text: string }>>,
  },
});

type RawProps = React.ComponentProps<typeof RawTriggerBuilder>;
export type TriggerBuilderProps = Omit<RawProps, "value" | "defaultValue" | "events" | "heading" | "onTcValueChange" | "onTcWebhookTest" | "onTcCopy" | "onChange"> & {
  /** The events a trigger can listen for */
  events?: TriggerEventNode[];
  /** Shown at the top; names the group */
  title?: string;
  /** The trigger definition (controlled) */
  value?: TriggerValue;
  /** The trigger definition to start with when uncontrolled */
  defaultValue?: TriggerValue;
  /** Called with the whole definition after every change */
  onChange?: (value: TriggerValue) => void;
  /** Send test request was pressed: send it, then pass how it went as `webhookLast`. Return false to stop the button waiting */
  onWebhookTest?: (test: TriggerWebhookTest) => void | boolean;
  /** Copy was pressed on the webhook address. Return false to keep it off the clipboard */
  onCopyAddress?: (text: string) => void | boolean;
};

const DEFAULT: TriggerValue = { kind: "schedule", schedule: { frequency: "weekly", days: [1], time: "09:00" }, active: null, conditions: [], match: "all" };

export function TriggerBuilder({ events = [], title, value, defaultValue = DEFAULT, onChange, onWebhookTest, onCopyAddress, ...props }: TriggerBuilderProps) {
  const { stage, els } = useStaged(events.filter((e) => isNode(e.icon)).map((e) => [e.id, e.icon]));
  const evs = React.useMemo(() => events.map((e) => (isNode(e.icon) ? { ...e, icon: els[e.id] } : e)) as TriggerEvent[], [events, els]);
  const v = useControlled(value, defaultValue, onChange);
  return h(React.Fragment, null, stage, h(RawTriggerBuilder, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    events: evs,
    value: v.value,
    onTcValueChange: (e: CustomEvent<TriggerValueChange>) => v.handler(e.detail.value, e),
    onTcWebhookTest: (e: CustomEvent<TriggerWebhookTest>) => {
      if (onWebhookTest?.(e.detail) === false) e.preventDefault();
    },
    onTcCopy: (e: CustomEvent<{ text: string }>) => {
      if (onCopyAddress?.(e.detail.text) === false) e.preventDefault();
    },
  }));
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcGateConfig, type GateConfigValue, type GateValueChange } from "../gate-config";
import { h, useControlled } from "./internal";

export type { GateActionOption, GateCondition, GateConfigValue, GateReviewer, GateView } from "../gate-config";
export { describeGate, GATE_ACTIONS, GATE_CONDITIONS, GATE_REVIEWERS, GATE_VIEWS } from "../gate-config";

const RawGateConfig = createComponent({
  tagName: "tc-gate-config",
  elementClass: TcGateConfig,
  react: React,
  events: { onTcValueChange: "tc-value-change" as EventName<CustomEvent<GateValueChange>> },
});

type RawProps = React.ComponentProps<typeof RawGateConfig>;
export type GateConfigProps = Omit<RawProps, "value" | "defaultValue" | "heading" | "onTcValueChange" | "onChange"> & {
  /** Shown at the top; names the group */
  title?: string;
  /** The gate's config (controlled) */
  value?: GateConfigValue;
  /** The config to start with when uncontrolled */
  defaultValue?: GateConfigValue;
  /** Called with the whole config after every change */
  onChange?: (value: GateConfigValue) => void;
};

const DEFAULT: GateConfigValue = { triggers: ["low-confidence", "irreversible"], reviewer: "lead", view: "evidence", actions: ["approve", "send-back", "reject"], reason: "" };

export function GateConfig({ title, value, defaultValue = DEFAULT, onChange, ...props }: GateConfigProps) {
  const v = useControlled(value, defaultValue, onChange);
  return h(RawGateConfig, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    value: v.value,
    onTcValueChange: (e: CustomEvent<GateValueChange>) => v.handler(e.detail.value, e),
  });
}

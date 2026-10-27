import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcToolConfiguration, type ToolConfigurationValue, type ToolConfigurationValueChange } from "../tool-configuration";
import { h, useControlled } from "./internal";

export type { ToolApprovalOption, ToolConfigurationValue, ToolIssue, ToolParameter, ToolParameterType } from "../tool-configuration";
export { TOOL_APPROVALS, TOOL_PARAMETER_TYPES, toolExampleCall, toolInputSchema, validateTool } from "../tool-configuration";

const RawToolConfiguration = createComponent({
  tagName: "tc-tool-configuration",
  elementClass: TcToolConfiguration,
  react: React,
  events: { onTcValueChange: "tc-value-change" as EventName<CustomEvent<ToolConfigurationValueChange>> },
});

type RawProps = React.ComponentProps<typeof RawToolConfiguration>;
export type ToolConfigurationProps = Omit<RawProps, "value" | "defaultValue" | "heading" | "onTcValueChange" | "onChange"> & {
  /** The title while the tool has no name – the tool's name replaces it */
  title?: string;
  /** The definition (controlled) */
  value?: ToolConfigurationValue;
  /** The definition to start with when uncontrolled */
  defaultValue?: ToolConfigurationValue;
  /** Called with the whole definition after every change */
  onChange?: (value: ToolConfigurationValue) => void;
};

const DEFAULT: ToolConfigurationValue = { name: "", description: "", parameters: [], approval: "inherit" };

export function ToolConfiguration({ title, value, defaultValue = DEFAULT, onChange, ...props }: ToolConfigurationProps) {
  const v = useControlled(value, defaultValue, onChange);
  return h(RawToolConfiguration, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    value: v.value,
    onTcValueChange: (e: CustomEvent<ToolConfigurationValueChange>) => v.handler(e.detail.value, e),
  });
}

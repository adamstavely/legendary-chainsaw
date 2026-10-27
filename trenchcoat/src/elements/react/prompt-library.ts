import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPromptLibrary, type PromptCopy, type PromptValueChange, type PromptValues, type PromptValuesChange } from "../prompt-library";
import { h, useControlled } from "./internal";

export type { PromptTemplate, PromptTone, PromptValues, PromptVariable } from "../prompt-library";

const NO_VALUES: PromptValues = {};

const RawPromptLibrary = createComponent({
  tagName: "tc-prompt-library",
  elementClass: TcPromptLibrary,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<PromptValueChange>>,
    onTcValuesChange: "tc-values-change" as EventName<CustomEvent<PromptValuesChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<PromptCopy>>,
  },
});
type RawPromptLibraryProps = React.ComponentProps<typeof RawPromptLibrary>;
export type PromptLibraryProps = Omit<RawPromptLibraryProps, "value" | "values" | "heading" | "onTcValueChange" | "onTcValuesChange" | "onTcCopy" | "onSelect" | "onCopy" | "defaultValue"> & {
  /** Id of the chosen template (controlled when defined) */
  value?: string;
  /** Id chosen at first when uncontrolled – defaults to the first template */
  defaultValue?: string;
  /** Called with the template's id when another template is chosen */
  onSelect?: (id: string) => void;
  /** The variables typed so far, per template (controlled when defined) */
  values?: PromptValues;
  /** The variables to start with when uncontrolled */
  defaultValues?: PromptValues;
  /** Every edit to a variable, with the values of every template */
  onValuesChange?: (values: PromptValues) => void;
  /** Called once the finished prompt is on the clipboard – not when the clipboard refused it */
  onCopy?: (prompt: string) => void;
  /** The heading over the list, and the group's accessible name – "Prompts" by default */
  title?: string;
};
export function PromptLibrary({ value, defaultValue, onSelect, values, defaultValues = NO_VALUES, onValuesChange, onCopy, title = "Prompts", ...props }: PromptLibraryProps) {
  const v = useControlled(value, defaultValue ?? props.templates?.[0]?.id ?? "", onSelect);
  const all = useControlled(values, defaultValues, onValuesChange);
  return h(RawPromptLibrary, {
    ...props,
    heading: title,
    value: v.value,
    values: all.value,
    onTcValueChange: (e: CustomEvent<PromptValueChange>) => v.handler(e.detail.value, e),
    onTcValuesChange: (e: CustomEvent<PromptValuesChange>) => all.handler(e.detail.values, e),
    onTcCopy: (e: CustomEvent<PromptCopy>) => onCopy?.(e.detail.prompt),
  });
}

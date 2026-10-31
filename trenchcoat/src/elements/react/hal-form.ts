import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcHalForm, type HalFormError, type HalFormResponse, type HalFormSubmit, type HalFormValues, type HalFormValuesChange } from "../hal-form";
import { h, useControlled } from "./internal";

export type {
  HalFormError,
  HalFormFetcher,
  HalFormLabels,
  HalFormResponse,
  HalFormSubmit,
  HalFormValue,
  HalFormValues,
  HalFormValuesChange,
  HalFormWireValue,
  HalFormsDocument,
  HalFormsOptions,
  HalFormsProperty,
  HalFormsTemplate,
  HalRequest,
} from "../hal-form";

const RawHalForm = createComponent({
  tagName: "tc-hal-form",
  elementClass: TcHalForm,
  react: React,
  events: {
    onTcValuesChange: "tc-values-change" as EventName<CustomEvent<HalFormValuesChange>>,
    onTcSubmit: "tc-submit" as EventName<CustomEvent<HalFormSubmit>>,
    onTcResponse: "tc-response" as EventName<CustomEvent<HalFormResponse>>,
    onTcError: "tc-error" as EventName<CustomEvent<HalFormError>>,
  },
});
type RawProps = React.ComponentProps<typeof RawHalForm>;
type Owned = "heading" | "values" | "onTcValuesChange" | "children";
export type HalFormProps = Omit<RawProps, Owned> & {
  /** The heading; by default the template's title */
  title?: string;
  /** The fields' values – controlled when given */
  values?: HalFormValues;
  /** The values on mount, over what the template starts with, when `values` isn't controlled */
  defaultValues?: HalFormValues;
  /** A field changed */
  onValuesChange?: (values: HalFormValues) => void;
};

export function HalForm({ title, values, defaultValues = {}, onValuesChange, ...props }: HalFormProps) {
  const v = useControlled<HalFormValues>(values, defaultValues, onValuesChange);
  return h(RawHalForm, {
    ...props,
    heading: title ?? "",
    values: v.value,
    onTcValuesChange: (e: CustomEvent<HalFormValuesChange>) => v.handler(e.detail.values, e),
  });
}

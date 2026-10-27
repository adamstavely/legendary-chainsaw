import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcOutputSchemaBuilder, type OutputSchemaField, type OutputSchemaPreview, type OutputSchemaValueChange } from "../output-schema-builder";
import { h, useControlled } from "./internal";

export type { OutputFieldType, OutputJsonSchema, OutputSchemaField, OutputSchemaIssue, OutputSchemaPreview } from "../output-schema-builder";
export { sampleFromFields, schemaFieldError, schemaFromFields, schemaIssues, validateOutputSample } from "../output-schema-builder";

const RawOutputSchemaBuilder = createComponent({
  tagName: "tc-output-schema-builder",
  elementClass: TcOutputSchemaBuilder,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<OutputSchemaValueChange>>,
    onTcPreviewChange: "tc-preview-change" as EventName<CustomEvent<{ preview: OutputSchemaPreview }>>,
  },
});

type RawProps = React.ComponentProps<typeof RawOutputSchemaBuilder>;
type Owned = "value" | "defaultValue" | "heading" | "preview" | "onTcValueChange" | "onTcPreviewChange" | "onChange" | "children";
export type OutputSchemaBuilderProps = Omit<RawProps, Owned> & {
  /** The heading – what the output is for */
  title?: string;
  /** The output object's fields (controlled) */
  value?: OutputSchemaField[];
  /** The fields to start with when uncontrolled */
  defaultValue?: OutputSchemaField[];
  /** Called with every change to the fields */
  onChange?: (value: OutputSchemaField[]) => void;
  /** What the preview shows (controlled): the rendered answer ("output"), its raw JSON ("sample") or the JSON Schema ("schema") */
  preview?: OutputSchemaPreview;
  /** What the preview shows first when uncontrolled */
  defaultPreview?: OutputSchemaPreview;
  /** Called when Output, JSON or Schema is picked */
  onPreviewChange?: (preview: OutputSchemaPreview) => void;
};

const NONE: OutputSchemaField[] = [];

export function OutputSchemaBuilder({ title, value, defaultValue = NONE, onChange, preview, defaultPreview = "output", onPreviewChange, ...props }: OutputSchemaBuilderProps) {
  const v = useControlled(value, defaultValue, onChange);
  const p = useControlled(preview, defaultPreview, onPreviewChange);
  return h(RawOutputSchemaBuilder, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    value: v.value,
    preview: p.value,
    onTcValueChange: (e: CustomEvent<OutputSchemaValueChange>) => v.handler(e.detail.value, e),
    onTcPreviewChange: (e: CustomEvent<{ preview: OutputSchemaPreview }>) => p.handler(e.detail.preview, e),
  });
}

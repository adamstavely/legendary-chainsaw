import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSchemaFields, type SchemaFieldsAnchorCopy, type SchemaFieldsExpandedChange, type SchemaFieldsQueryChange } from "../schema-fields";
import { h, useControlled } from "./internal";

export type { JsonSchema, SchemaField, SchemaFieldsAnchorCopy, SchemaFieldsExpandedChange, SchemaFieldsLabels, SchemaFieldsQueryChange, SchemaFieldValue } from "../schema-fields";
export { defaultSchemaFieldsLabels, fieldTypeWords, schemaConstraints, schemaToFields } from "../schema-fields";

const RawSchemaFields = createComponent({
  tagName: "tc-schema-fields",
  elementClass: TcSchemaFields,
  react: React,
  events: {
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<SchemaFieldsExpandedChange>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<SchemaFieldsQueryChange>>,
    onTcAnchorCopy: "tc-anchor-copy" as EventName<CustomEvent<SchemaFieldsAnchorCopy>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSchemaFields>;
export type SchemaFieldsProps = Omit<RawProps, "heading" | "expanded" | "query" | "onTcExpandedChange" | "onTcQueryChange" | "onTcAnchorCopy" | "children"> & {
  /** The heading */
  title?: string;
  /** The paths of fields whose children are showing – controlled when given */
  expanded?: string[];
  /** On mount, when `expanded` isn't controlled */
  defaultExpanded?: string[];
  /** Called with the open fields' paths when a field opens or closes, or Expand all / Collapse all is pressed */
  onExpandedChange?: (expanded: string[], detail: SchemaFieldsExpandedChange) => void;
  /** The filter text – controlled when given */
  query?: string;
  /** On mount, when `query` isn't controlled */
  defaultQuery?: string;
  /** Called with the filter text as it's typed */
  onQueryChange?: (query: string) => void;
  /** Copy link was pressed; return false to copy nothing (the page copies or shares it itself) */
  onAnchorCopy?: (detail: SchemaFieldsAnchorCopy) => boolean | void;
};

export function SchemaFields({ title, expanded, defaultExpanded = [], onExpandedChange, query, defaultQuery = "", onQueryChange, onAnchorCopy, ...props }: SchemaFieldsProps) {
  const last = React.useRef<SchemaFieldsExpandedChange | null>(null);
  const x = useControlled<string[]>(expanded, defaultExpanded, onExpandedChange ? (next) => onExpandedChange(next, last.current ?? { expanded: next, path: null, open: true }) : undefined);
  const q = useControlled<string>(query, defaultQuery, onQueryChange);
  return h(RawSchemaFields, {
    ...props,
    heading: title ?? "Fields",
    expanded: x.value,
    query: q.value,
    onTcExpandedChange: (e: CustomEvent<SchemaFieldsExpandedChange>) => {
      last.current = e.detail;
      x.handler(e.detail.expanded, e);
    },
    onTcQueryChange: (e: CustomEvent<SchemaFieldsQueryChange>) => q.handler(e.detail.query, e),
    onTcAnchorCopy: (e: CustomEvent<SchemaFieldsAnchorCopy>) => {
      if (onAnchorCopy?.(e.detail) === false) e.preventDefault();
    },
  });
}

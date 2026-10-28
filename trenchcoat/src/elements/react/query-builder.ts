import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcQueryBuilder, emptyQuery, type QueryGroup, type QuerySubmit, type QueryValueChange } from "../query-builder";
import { h, useControlled } from "./internal";

export type { QueryCondition, QueryField, QueryFieldOption, QueryFieldType, QueryGroup, QueryNode, QueryOperator } from "../query-builder";
export { defaultQueryOperatorLabels, emptyQuery, queryOperators } from "../query-builder";

const RawQueryBuilder = createComponent({
  tagName: "tc-query-builder",
  elementClass: TcQueryBuilder,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<QueryValueChange>>,
    onTcSubmit: "tc-submit" as EventName<CustomEvent<QuerySubmit>>,
  },
});
type RawProps = React.ComponentProps<typeof RawQueryBuilder>;
type Owned = "heading" | "value" | "defaultValue" | "onTcValueChange" | "onTcSubmit" | "children";
export type QueryBuilderProps = Omit<RawProps, Owned> & {
  /** The heading, and the builder's name */
  title?: string;
  /** The query tree – controlled when given */
  value?: QueryGroup;
  /** The query on mount when `value` isn't controlled */
  defaultValue?: QueryGroup;
  /** The query changed */
  onValueChange?: (value: QueryGroup) => void;
  /** Run was pressed, with the query string */
  onRun?: (value: QueryGroup, query: string) => void;
};

const EMPTY = emptyQuery();

export function QueryBuilder({ title, value, defaultValue = EMPTY, onValueChange, onRun, ...props }: QueryBuilderProps) {
  const v = useControlled<QueryGroup>(value, defaultValue, onValueChange);
  return h(RawQueryBuilder, {
    ...props,
    heading: title ?? "Query builder",
    value: v.value,
    onTcValueChange: (e: CustomEvent<QueryValueChange>) => v.handler(e.detail.value, e),
    onTcSubmit: (e: CustomEvent<QuerySubmit>) => onRun?.(e.detail.value, e.detail.query),
  });
}

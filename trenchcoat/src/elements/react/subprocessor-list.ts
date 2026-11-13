import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcSubprocessorList,
  type Subprocessor,
  type SubprocessorCategoryChange,
  type SubprocessorExport,
  type SubprocessorLocationChange,
  type SubprocessorQueryChange,
  type SubprocessorSubscribe,
} from "../subprocessor-list";
import { h, useControlled } from "./internal";

export type {
  Subprocessor,
  SubprocessorCategoryChange,
  SubprocessorExport,
  SubprocessorListLabels,
  SubprocessorLocationChange,
  SubprocessorQueryChange,
  SubprocessorStatus,
  SubprocessorSubscribe,
} from "../subprocessor-list";
export { defaultSubprocessorListLabels, isEmail, subprocessorCsv } from "../subprocessor-list";

const RawSubprocessorList = createComponent({
  tagName: "tc-subprocessor-list",
  elementClass: TcSubprocessorList,
  react: React,
  events: {
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<SubprocessorQueryChange>>,
    onTcCategoryChange: "tc-category-change" as EventName<CustomEvent<SubprocessorCategoryChange>>,
    onTcLocationChange: "tc-location-change" as EventName<CustomEvent<SubprocessorLocationChange>>,
    onTcSubscribe: "tc-subscribe" as EventName<CustomEvent<SubprocessorSubscribe>>,
    onTcExport: "tc-export" as EventName<CustomEvent<SubprocessorExport>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSubprocessorList>;
type Owned = "heading" | "query" | "category" | "location" | "onTcQueryChange" | "onTcCategoryChange" | "onTcLocationChange" | "onTcSubscribe" | "onTcExport" | "children";
export type SubprocessorListProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The search text – controlled when given */
  query?: string;
  /** The search on mount when `query` isn't controlled */
  defaultQuery?: string;
  /** The search changed */
  onQueryChange?: (query: string) => void;
  /** The data category shown, or null for all – controlled when given */
  category?: string | null;
  /** The category on mount when `category` isn't controlled */
  defaultCategory?: string | null;
  /** The data-category filter changed */
  onCategoryChange?: (category: string | null) => void;
  /** The location shown, or null for all – controlled when given */
  location?: string | null;
  /** The location on mount when `location` isn't controlled */
  defaultLocation?: string | null;
  /** The location filter changed */
  onLocationChange?: (location: string | null) => void;
  /** A valid email was submitted to Subscribe to changes; return false to keep the form showing */
  onSubscribe?: (email: string) => boolean | void;
  /** Export CSV was pressed; return false to download it yourself */
  onExport?: (csv: string, rows: Subprocessor[]) => boolean | void;
};

export function SubprocessorList({
  title,
  query,
  defaultQuery = "",
  onQueryChange,
  category,
  defaultCategory = null,
  onCategoryChange,
  location,
  defaultLocation = null,
  onLocationChange,
  onSubscribe,
  onExport,
  ...props
}: SubprocessorListProps) {
  const q = useControlled<string>(query, defaultQuery, onQueryChange);
  const c = useControlled<string | null>(category, defaultCategory, onCategoryChange);
  const l = useControlled<string | null>(location, defaultLocation, onLocationChange);
  return h(RawSubprocessorList, {
    ...props,
    heading: title ?? "Subprocessors",
    query: q.value,
    category: c.value,
    location: l.value,
    onTcQueryChange: (e: CustomEvent<SubprocessorQueryChange>) => q.handler(e.detail.query, e),
    onTcCategoryChange: (e: CustomEvent<SubprocessorCategoryChange>) => c.handler(e.detail.category, e),
    onTcLocationChange: (e: CustomEvent<SubprocessorLocationChange>) => l.handler(e.detail.location, e),
    onTcSubscribe: (e: CustomEvent<SubprocessorSubscribe>) => {
      if (onSubscribe?.(e.detail.email) === false) e.preventDefault();
    },
    onTcExport: (e: CustomEvent<SubprocessorExport>) => {
      if (onExport?.(e.detail.csv, e.detail.rows) === false) e.preventDefault();
    },
  });
}

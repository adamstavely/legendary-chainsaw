import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTextAnnotator, type TextAnnotation, type TextAnnotatorChangeType, type TextAnnotatorCopy, type TextAnnotatorFilter, type TextAnnotatorFilterChange, type TextAnnotatorValueChange } from "../text-annotator";
import { h, useControlled } from "./internal";

export type { HighlightColor, TextAnnotation, TextAnnotatorChangeType, TextAnnotatorFilter } from "../text-annotator";

const RawTextAnnotator = createComponent({
  tagName: "tc-text-annotator",
  elementClass: TcTextAnnotator,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<TextAnnotatorValueChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<TextAnnotatorCopy>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<TextAnnotatorFilterChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTextAnnotator>;
type Wrapped = "heading" | "value" | "defaultValue" | "filter" | "onTcValueChange" | "onTcCopy" | "onTcFilterChange" | "onChange" | "onCopy" | "children";
export type TextAnnotatorProps = Omit<RawProps, Wrapped> & {
  /** The heading, and the component's name */
  title?: string;
  /** The annotations. Controlled when defined; otherwise the component keeps them, starting at `defaultValue` */
  value?: TextAnnotation[];
  /** The annotations when uncontrolled */
  defaultValue?: TextAnnotation[];
  /** Called with the whole new list, what kind of change it was and the annotation it touched */
  onChange?: (value: TextAnnotation[], type: TextAnnotatorChangeType, annotation: TextAnnotation) => void;
  /** What the rail and the marks show. Controlled when defined */
  filter?: TextAnnotatorFilter;
  /** The filter when uncontrolled */
  defaultFilter?: TextAnnotatorFilter;
  /** Called when the filter changes */
  onFilterChange?: (filter: TextAnnotatorFilter) => void;
  /** Called when Copy is chosen; return false to stop the component writing to the clipboard itself */
  onCopy?: (text: string, start: number, end: number) => boolean | void;
};

const NONE: TextAnnotation[] = [];
const ALL: TextAnnotatorFilter = { colors: [], authors: [], resolved: true };

export function TextAnnotator({ title, value, defaultValue = NONE, onChange, filter, defaultFilter = ALL, onFilterChange, onCopy, ...props }: TextAnnotatorProps) {
  const last = React.useRef<{ type: TextAnnotatorChangeType; annotation: TextAnnotation } | null>(null);
  const report = React.useCallback((next: TextAnnotation[]) => last.current && onChange?.(next, last.current.type, last.current.annotation), [onChange]);
  const v = useControlled<TextAnnotation[]>(value, defaultValue, report);
  // The filter isn't cancelable: uncontrolled, the element applies it and the wrapper keeps a copy
  const [ownFilter, setOwnFilter] = React.useState(defaultFilter);
  return h(RawTextAnnotator, {
    ...props,
    heading: title ?? "Annotations",
    value: v.value,
    filter: filter ?? ownFilter,
    onTcValueChange: (e: CustomEvent<TextAnnotatorValueChange>) => {
      last.current = e.detail.change;
      v.handler(e.detail.value, e);
    },
    onTcFilterChange: (e: CustomEvent<TextAnnotatorFilterChange>) => {
      if (filter === undefined) setOwnFilter(e.detail.filter);
      onFilterChange?.(e.detail.filter);
    },
    onTcCopy: (e: CustomEvent<TextAnnotatorCopy>) => {
      if (onCopy?.(e.detail.text, e.detail.start, e.detail.end) === false) e.preventDefault();
    },
  });
}

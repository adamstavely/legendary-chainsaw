import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcGradeDistribution, type Grade, type GradeSelectedChange } from "../grade-distribution";
import { h, useControlled } from "./internal";

export type { Grade, GradeTone } from "../grade-distribution";
export { defaultGrades } from "../grade-distribution";

const RawGradeDistribution = createComponent({
  tagName: "tc-grade-distribution",
  elementClass: TcGradeDistribution,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<GradeSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawGradeDistribution>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type GradeDistributionProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The grade picked as a filter – controlled when given (null for none) */
  selected?: string | null;
  /** The grade picked on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A grade was picked or cleared; `grade` is the picked grade */
  onSelectedChange?: (selected: string | null, grade?: Grade) => void;
};

export function GradeDistribution({ title, selected, defaultSelected = null, onSelectedChange, ...props }: GradeDistributionProps) {
  const grade = React.useRef<Grade | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, grade.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawGradeDistribution, {
    ...props,
    heading: title ?? "Grades",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<GradeSelectedChange>) => {
      grade.current = e.detail.grade;
      s.handler(e.detail.selected, e);
    },
  });
}

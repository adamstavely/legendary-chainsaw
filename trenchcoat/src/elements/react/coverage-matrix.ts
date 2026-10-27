import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCoverageMatrix, type CoverageCell, type CoverageCellRef, type CoverageOpenChange } from "../coverage-matrix";
import { h, useControlled } from "./internal";

export type { CoverageCell, CoverageCellRef, CoverageCheck, CoverageMap, CoveragePart, CoverageStatus } from "../coverage-matrix";
export { defaultCoverageStatusLabels } from "../coverage-matrix";

const RawCoverageMatrix = createComponent({
  tagName: "tc-coverage-matrix",
  elementClass: TcCoverageMatrix,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<CoverageOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawCoverageMatrix>;
type Owned = "heading" | "open" | "onTcOpenChange" | "children";
export type CoverageMatrixProps = Omit<RawProps, Owned> & {
  /** The heading, and the grid's name */
  title?: string;
  /** The cell whose detail is open – controlled when given (null for none) */
  open?: CoverageCellRef | null;
  /** The cell open on mount when `open` isn't controlled */
  defaultOpen?: CoverageCellRef | null;
  /** A cell's detail opened or closed; `cell` is the opened cell */
  onOpenChange?: (open: CoverageCellRef | null, cell?: CoverageCell) => void;
};

export function CoverageMatrix({ title, open, defaultOpen = null, onOpenChange, ...props }: CoverageMatrixProps) {
  const cell = React.useRef<CoverageCell | undefined>(undefined);
  const report = React.useCallback((next: CoverageCellRef | null) => onOpenChange?.(next, cell.current), [onOpenChange]);
  const o = useControlled<CoverageCellRef | null>(open, defaultOpen, onOpenChange ? report : undefined);
  return h(RawCoverageMatrix, {
    ...props,
    heading: title ?? "Coverage",
    open: o.value,
    onTcOpenChange: (e: CustomEvent<CoverageOpenChange>) => {
      cell.current = e.detail.cell;
      o.handler(e.detail.open, e);
    },
  });
}

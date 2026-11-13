import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEnrichmentGrid, type EnrichmentCell, type EnrichmentCellSelect, type EnrichmentRetry, type EnrichmentRunChange, type EnrichmentSelection } from "../enrichment-grid";
import { h, useControlled } from "./internal";

export type {
  EnrichmentCell,
  EnrichmentCellSelect,
  EnrichmentCellState,
  EnrichmentColumn,
  EnrichmentProgress,
  EnrichmentRetry,
  EnrichmentRow,
  EnrichmentRunChange,
  EnrichmentSelection,
} from "../enrichment-grid";
export { enrichmentCell, enrichmentProgress, enrichmentTimeLeft } from "../enrichment-grid";

const RawEnrichmentGrid = createComponent({
  tagName: "tc-enrichment-grid",
  elementClass: TcEnrichmentGrid,
  react: React,
  events: {
    onTcRunChange: "tc-run-change" as EventName<CustomEvent<EnrichmentRunChange>>,
    onTcRetry: "tc-retry" as EventName<CustomEvent<EnrichmentRetry>>,
    onTcCellSelect: "tc-cell-select" as EventName<CustomEvent<EnrichmentCellSelect>>,
  },
});
type RawEnrichmentGridProps = React.ComponentProps<typeof RawEnrichmentGrid>;

export type EnrichmentGridOwnProps = {
  /** The heading */
  title?: string;
  /** Whether the run is going. Controlled when defined – pass back what onRunChange reports */
  running?: boolean;
  /** Whether the run starts going, when uncontrolled */
  defaultRunning?: boolean;
  /** Pause or Resume was pressed */
  onRunChange?: (running: boolean) => void;
  /** The picked cell. Controlled when defined */
  selected?: EnrichmentSelection | null;
  /** The cell picked at first, when uncontrolled */
  defaultSelected?: EnrichmentSelection | null;
  /** A cell was picked: where it is and what's in it */
  onCellSelect?: (selected: EnrichmentSelection, cell: EnrichmentCell | string | null) => void;
  /** Retry failed, or R on a failed cell: the cells to run again. Return false to stop it being announced */
  onRetry?: (cells: EnrichmentSelection[]) => void | boolean;
};
export type EnrichmentGridProps = Omit<RawEnrichmentGridProps, keyof EnrichmentGridOwnProps | "heading" | "onTcRunChange" | "onTcRetry" | "onTcCellSelect" | "children"> &
  EnrichmentGridOwnProps;

export function EnrichmentGrid({
  title = "Enrichment",
  running,
  defaultRunning = false,
  onRunChange,
  selected,
  defaultSelected = null,
  onCellSelect,
  onRetry,
  ...props
}: EnrichmentGridProps) {
  const run = useControlled(running, defaultRunning, onRunChange);
  // The cell's content travels with the pick: kept from the event for onCellSelect's second argument
  const cell = React.useRef<EnrichmentCell | string | null>(null);
  const report = React.useCallback((next: EnrichmentSelection | null) => next && onCellSelect?.(next, cell.current), [onCellSelect]);
  const pick = useControlled(selected, defaultSelected, report);
  return h(RawEnrichmentGrid, {
    ...props,
    heading: title,
    running: run.value,
    selected: pick.value,
    onTcRunChange: (e: CustomEvent<EnrichmentRunChange>) => run.handler(e.detail.running, e),
    onTcCellSelect: (e: CustomEvent<EnrichmentCellSelect>) => {
      cell.current = e.detail.cell;
      pick.handler(e.detail.selected, e);
    },
    onTcRetry: (e: CustomEvent<EnrichmentRetry>) => {
      if (onRetry?.(e.detail.cells) === false) e.preventDefault();
    },
  });
}

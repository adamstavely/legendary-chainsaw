import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import type { ChartMarkClick, ChartMarkHover } from "../internal/chart/element";
import type { ChartEvent } from "../internal/chart/types";
import { TcSmallMultiples, type SmallMultiplesCheck } from "../small-multiples";
import { h } from "./internal";

export type { SmallMultiplesCheck, SmallMultiplesLabels, SmallMultiplesShared, SmallMultiplesSort } from "../small-multiples";
export type { ChartSpec, SpecData, SpecIssue } from "../internal/chart/spec";
export type { ChartEvent } from "../internal/chart/types";

const RawSmallMultiples = createComponent({
  tagName: "tc-small-multiples",
  elementClass: TcSmallMultiples,
  react: React,
  events: {
    onTcSpecCheck: "tc-spec-check" as EventName<CustomEvent<SmallMultiplesCheck>>,
    onTcMarkHover: "tc-mark-hover" as EventName<CustomEvent<ChartMarkHover>>,
    onTcMarkClick: "tc-mark-click" as EventName<CustomEvent<ChartMarkClick>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSmallMultiples>;
type Owned = "heading" | "onTcSpecCheck" | "onTcMarkHover" | "onTcMarkClick" | "children";
export type SmallMultiplesProps = Omit<RawProps, Owned> & {
  /** The heading; by default the spec's title */
  title?: string;
  /** The spec was checked: valid, with its errors and warnings */
  onSpecCheck?: (check: SmallMultiplesCheck) => void;
  /** A panel's pointer or keyboard moved to a mark (null: off them) */
  onMarkHover?: (event: ChartEvent | null) => void;
  /** A panel's mark was clicked, or picked with Enter or Space */
  onMarkClick?: (event: ChartEvent) => void;
};

export function SmallMultiples({ title, onSpecCheck, onMarkHover, onMarkClick, ...props }: SmallMultiplesProps) {
  return h(RawSmallMultiples, {
    ...props,
    heading: title ?? "",
    onTcSpecCheck: onSpecCheck ? (e: CustomEvent<SmallMultiplesCheck>) => onSpecCheck(e.detail) : undefined,
    onTcMarkHover: onMarkHover ? (e: CustomEvent<ChartMarkHover>) => onMarkHover(e.detail.event) : undefined,
    onTcMarkClick: onMarkClick ? (e: CustomEvent<ChartMarkClick>) => onMarkClick(e.detail.event) : undefined,
  });
}

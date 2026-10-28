import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDayRhythm, type RhythmSegment, type RhythmSelect } from "../day-rhythm";
import { h } from "./internal";

export type { RhythmKind, RhythmRow, RhythmSegment } from "../day-rhythm";
export { rhythmTime } from "../day-rhythm";

const RawDayRhythm = createComponent({
  tagName: "tc-day-rhythm",
  elementClass: TcDayRhythm,
  react: React,
  events: {
    onTcSelect: "tc-select" as EventName<CustomEvent<RhythmSelect>>,
  },
});
type RawProps = React.ComponentProps<typeof RawDayRhythm>;
type Owned = "heading" | "onTcSelect" | "onSelect" | "children";
export type DayRhythmProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** A block was chosen with Enter, Space or a click: its row's id and the block */
  onSelect?: (row: string, segment: RhythmSegment) => void;
};

export function DayRhythm({ title, onSelect, ...props }: DayRhythmProps) {
  return h(RawDayRhythm, {
    ...props,
    heading: title ?? "Daily rhythm",
    onTcSelect: (e: CustomEvent<RhythmSelect>) => onSelect?.(e.detail.row, e.detail.segment),
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFactSheet, type FactCopy } from "../fact-sheet";
import { h } from "./internal";

export type { Fact, FactBand, FactCopy, FactReading, FactSection, FactSource } from "../fact-sheet";
export { factBand, gradeWords } from "../fact-sheet";

const RawFactSheet = createComponent({
  tagName: "tc-fact-sheet",
  elementClass: TcFactSheet,
  react: React,
  events: {
    onTcCopy: "tc-copy" as EventName<CustomEvent<FactCopy>>,
  },
});
type RawProps = React.ComponentProps<typeof RawFactSheet>;
type Owned = "heading" | "onTcCopy" | "onCopy" | "children";
export type FactSheetProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** A value's Copy was pressed. Return false to stop the element copying, to copy your own way */
  onCopy?: (fact: string, text: string) => void | boolean;
};

export function FactSheet({ title, onCopy, ...props }: FactSheetProps) {
  return h(RawFactSheet, {
    ...props,
    heading: title ?? "Facts",
    onTcCopy: (e: CustomEvent<FactCopy>) => {
      if (onCopy?.(e.detail.fact, e.detail.text) === false) e.preventDefault();
    },
  });
}

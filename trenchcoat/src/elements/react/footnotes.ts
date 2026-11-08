import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFootnotes, type FootnotesNavigate } from "../footnotes";
import { h } from "./internal";

export type { FootnoteNote, FootnotesNavigate } from "../footnotes";

const RawFootnotes = createComponent({
  tagName: "tc-footnotes",
  elementClass: TcFootnotes,
  react: React,
  events: { onTcNavigate: "tc-navigate" as EventName<CustomEvent<FootnotesNavigate>> },
});
type RawProps = React.ComponentProps<typeof RawFootnotes>;
export type FootnotesProps = Omit<RawProps, "heading" | "onTcNavigate" | "children"> & {
  /** The heading ("Notes" by default), and the region's name */
  title?: string;
  /** A note's link was clicked; call `event.preventDefault()` to route it yourself instead of following the link */
  onNavigate?: (href: string, id: string, event: CustomEvent<FootnotesNavigate>) => void;
};

/** A quiet card of caveats and notes under a page's charts */
export function Footnotes({ title, onNavigate, ...props }: FootnotesProps) {
  return h(RawFootnotes, {
    ...props,
    heading: title ?? "Notes",
    onTcNavigate: (e: CustomEvent<FootnotesNavigate>) => onNavigate?.(e.detail.href, e.detail.id, e),
  });
}

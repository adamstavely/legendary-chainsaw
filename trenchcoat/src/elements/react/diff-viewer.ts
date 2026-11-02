import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDiffViewer, type DiffViewerExpandedChange } from "../diff-viewer";
import { h, useControlled } from "./internal";

export type { DiffFile, DiffFileStatus, DiffViewerExpandedChange, DiffViewerLabels } from "../diff-viewer";
export { defaultDiffViewerLabels, diffFileCounts, diffFileStatus } from "../diff-viewer";

const RawDiffViewer = createComponent({
  tagName: "tc-diff-viewer",
  elementClass: TcDiffViewer,
  react: React,
  events: {
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<DiffViewerExpandedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawDiffViewer>;
export type DiffViewerProps = Omit<RawProps, "heading" | "expanded" | "onTcExpandedChange" | "children"> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The paths of the open files – controlled when given */
  expanded?: string[];
  /** The paths open at first, when `expanded` isn't controlled; unset opens the first `autoExpand` */
  defaultExpanded?: string[];
  /** A file was opened or closed */
  onExpandedChange?: (expanded: string[]) => void;
};

export function DiffViewer({ title = "Changes", expanded, defaultExpanded, onExpandedChange, ...props }: DiffViewerProps) {
  const v = useControlled<string[] | undefined>(expanded, defaultExpanded, onExpandedChange as ((next: string[] | undefined) => void) | undefined);
  return h(RawDiffViewer, {
    ...props,
    heading: title,
    expanded: v.value,
    onTcExpandedChange: (e: CustomEvent<DiffViewerExpandedChange>) => v.handler(e.detail.expanded, e),
  });
}

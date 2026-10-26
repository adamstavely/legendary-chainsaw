import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcRetrievalInspector,
  type RetrievalChunk,
  type RetrievalOpenSource,
  type RetrievalSelectedChange,
  type RetrievalShow,
  type RetrievalShowChange,
} from "../retrieval-inspector";
import { h, useControlled } from "./internal";

export type { RetrievalChunk, RetrievalMiss, RetrievalShow } from "../retrieval-inspector";

const RawRetrievalInspector = createComponent({
  tagName: "tc-retrieval-inspector",
  elementClass: TcRetrievalInspector,
  react: React,
  events: {
    onTcShowChange: "tc-show-change" as EventName<CustomEvent<RetrievalShowChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<RetrievalSelectedChange>>,
    onTcOpenSource: "tc-open-source" as EventName<CustomEvent<RetrievalOpenSource>>,
  },
});
type RawRetrievalInspectorProps = React.ComponentProps<typeof RawRetrievalInspector>;

export type RetrievalInspectorProps = Omit<
  RawRetrievalInspectorProps,
  "heading" | "show" | "selected" | "openHandled" | "onTcShowChange" | "onTcSelectedChange" | "onTcOpenSource"
> & {
  /** The heading – defaults to "Retrieval" */
  title?: string;
  /** Which chunks show – "all", "used" or "unused". Controlled when defined; otherwise the component keeps it */
  show?: RetrievalShow;
  /** Which chunks show at first when `show` isn't controlled */
  defaultShow?: RetrievalShow;
  /** Called with the filter the user picked, controlled or not */
  onShowChange?: (show: RetrievalShow) => void;
  /** The id of the open chunk, or null. Controlled when defined */
  selected?: string | null;
  /** The chunk open at first when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** Called with the chunk picked (or null when it closes), controlled or not */
  onSelectedChange?: (id: string | null, chunk?: RetrievalChunk) => void;
  /** Called by Open source. With it the link doesn't navigate on its own – open the document yourself */
  onOpenSource?: (chunk: RetrievalChunk) => void;
};

export function RetrievalInspector({
  title = "Retrieval",
  show,
  defaultShow = "all",
  onShowChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  onOpenSource,
  ...props
}: RetrievalInspectorProps) {
  const s = useControlled<RetrievalShow>(show, defaultShow, onShowChange);
  const sel = useControlled<string | null>(selected, defaultSelected, undefined);
  return h(RawRetrievalInspector, {
    ...props,
    heading: title,
    show: s.value,
    selected: sel.value,
    openHandled: !!onOpenSource,
    onTcShowChange: (e: CustomEvent<RetrievalShowChange>) => s.handler(e.detail.show, e),
    onTcSelectedChange: (e: CustomEvent<RetrievalSelectedChange>) => {
      sel.handler(e.detail.selected, e);
      onSelectedChange?.(e.detail.selected, e.detail.chunk);
    },
    onTcOpenSource: (e: CustomEvent<RetrievalOpenSource>) => onOpenSource?.(e.detail.chunk),
  });
}

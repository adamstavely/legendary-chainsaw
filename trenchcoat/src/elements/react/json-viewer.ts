import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcJsonViewer,
  type JsonFlag,
  type JsonViewerCopy,
  type JsonViewerDownload,
  type JsonViewerFilterChange,
  type JsonViewerFlagsChange,
  type JsonViewerLayout,
  type JsonViewerLayoutChange,
  type JsonViewerOpenChange,
  type JsonViewerView,
  type JsonViewerViewChange,
} from "../json-viewer";
import { h, useControlled } from "./internal";

export type { JsonFlag, JsonKeyStyle, JsonValue, JsonViewerCopy, JsonViewerDownload, JsonViewerLayout, JsonViewerView } from "../json-viewer";

const RawJsonViewer = createComponent({
  tagName: "tc-json-viewer",
  elementClass: TcJsonViewer,
  react: React,
  events: {
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<JsonViewerViewChange>>,
    onTcLayoutChange: "tc-layout-change" as EventName<CustomEvent<JsonViewerLayoutChange>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<JsonViewerFilterChange>>,
    onTcFlagsChange: "tc-flags-change" as EventName<CustomEvent<JsonViewerFlagsChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<JsonViewerOpenChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<JsonViewerCopy>>,
    onTcDownload: "tc-download" as EventName<CustomEvent<JsonViewerDownload>>,
  },
});
type RawProps = React.ComponentProps<typeof RawJsonViewer>;
type Owned =
  | "heading"
  | "view"
  | "layout"
  | "onTcLayoutChange"
  | "filter"
  | "flags"
  | "open"
  | "onTcViewChange"
  | "onTcFilterChange"
  | "onTcFlagsChange"
  | "onTcOpenChange"
  | "onTcCopy"
  | "onTcDownload"
  | "children";
export type JsonViewerProps = Omit<RawProps, Owned> & {
  /** The heading, and the viewer's name */
  title?: string;
  /** The view shown – controlled when given */
  view?: JsonViewerView;
  /** The view on mount when `view` isn't controlled */
  defaultView?: JsonViewerView;
  /** The view changed */
  onViewChange?: (view: JsonViewerView) => void;
  /** One view at a time ("tabs") or the rendered view beside the raw JSON ("split") – controlled when given */
  layout?: JsonViewerLayout;
  /** The layout on mount when `layout` isn't controlled */
  defaultLayout?: JsonViewerLayout;
  /** The layout was switched with the toolbar button */
  onLayoutChange?: (layout: JsonViewerLayout) => void;
  /** The search – controlled when given */
  filter?: string;
  /** The search on mount when `filter` isn't controlled */
  defaultFilter?: string;
  /** The search changed */
  onFilterChange?: (filter: string) => void;
  /** The reviewer's flags – controlled when given: adding, editing and removing report the next list */
  flags?: JsonFlag[];
  /** The flags on mount when `flags` isn't controlled */
  defaultFlags?: JsonFlag[];
  /** A flag was added, edited or removed; `next` is the list as it will be */
  onFlagsChange?: (next: JsonFlag[], change: { path: string; note: string | null }) => void;
  /** With `modal`: whether the dialog is showing – controlled when given; pair it with onOpenChange */
  open?: boolean;
  /** With `modal`: whether an uncontrolled dialog starts open */
  defaultOpen?: boolean;
  /** With `modal`: the dialog asks to open or close (Escape, Close) */
  onOpenChange?: (open: boolean) => void;
  /** The JSON was copied; `event.preventDefault()` stops the copy */
  onCopyJson?: (detail: JsonViewerCopy, event: CustomEvent<JsonViewerCopy>) => void;
  /** Download was pressed; `event.preventDefault()` to save it your own way */
  onDownload?: (detail: JsonViewerDownload, event: CustomEvent<JsonViewerDownload>) => void;
};

const NONE: JsonFlag[] = [];

export function JsonViewer({
  title,
  view,
  defaultView = "document",
  onViewChange,
  layout,
  defaultLayout = "tabs",
  onLayoutChange,
  filter,
  defaultFilter = "",
  onFilterChange,
  flags,
  defaultFlags = NONE,
  onFlagsChange,
  open,
  defaultOpen = false,
  onOpenChange,
  onCopyJson,
  onDownload,
  ...props
}: JsonViewerProps) {
  const v = useControlled<JsonViewerView>(view, defaultView, onViewChange);
  const f = useControlled<string>(filter, defaultFilter, onFilterChange);
  const lay = useControlled<JsonViewerLayout>(layout, defaultLayout, onLayoutChange);
  const fl = useControlled<JsonFlag[]>(flags, defaultFlags, undefined);
  const o = useControlled<boolean>(open, defaultOpen, onOpenChange);
  return h(RawJsonViewer, {
    ...props,
    heading: title ?? "JSON",
    view: v.value,
    layout: lay.value,
    filter: f.value,
    flags: fl.value,
    open: o.value,
    onTcViewChange: (e: CustomEvent<JsonViewerViewChange>) => v.handler(e.detail.view, e),
    onTcLayoutChange: (e: CustomEvent<JsonViewerLayoutChange>) => lay.handler(e.detail.layout, e),
    onTcFilterChange: (e: CustomEvent<JsonViewerFilterChange>) => f.handler(e.detail.filter, e),
    onTcFlagsChange: (e: CustomEvent<JsonViewerFlagsChange>) => {
      onFlagsChange?.(e.detail.flags, { path: e.detail.path, note: e.detail.note });
      fl.handler(e.detail.flags, e);
    },
    onTcOpenChange: (e: CustomEvent<JsonViewerOpenChange>) => o.handler(e.detail.open, e),
    onTcCopy: (e: CustomEvent<JsonViewerCopy>) => onCopyJson?.(e.detail, e),
    onTcDownload: (e: CustomEvent<JsonViewerDownload>) => onDownload?.(e.detail, e),
  });
}

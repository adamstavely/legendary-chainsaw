import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcPreviewFrame,
  type PreviewActiveChange,
  type PreviewError,
  type PreviewExternal,
  type PreviewFixRequest,
  type PreviewNavigate,
  type PreviewTab,
  type PreviewTabEvent,
  type PreviewViewport,
  type PreviewViewportChange,
} from "../preview-frame";
import { h, useControlled } from "./internal";

export type {
  PreviewActiveChange,
  PreviewConsole,
  PreviewError,
  PreviewExternal,
  PreviewFixRequest,
  PreviewFrameLabels,
  PreviewNavigate,
  PreviewTab,
  PreviewTabEvent,
  PreviewViewport,
  PreviewViewportChange,
} from "../preview-frame";
export { defaultPreviewFrameLabels, normalizePreviewUrl, previewDocument, previewPolicy, previewSecurity, PREVIEW_WIDTHS } from "../preview-frame";

const RawPreviewFrame = createComponent({
  tagName: "tc-preview-frame",
  elementClass: TcPreviewFrame,
  react: React,
  events: {
    onTcNavigate: "tc-navigate" as EventName<CustomEvent<PreviewNavigate>>,
    onTcViewportChange: "tc-viewport-change" as EventName<CustomEvent<PreviewViewportChange>>,
    onTcActiveChange: "tc-active-change" as EventName<CustomEvent<PreviewActiveChange>>,
    onTcClose: "tc-close" as EventName<CustomEvent<PreviewTabEvent>>,
    onTcNewTab: "tc-new-tab" as EventName<CustomEvent<null>>,
    onTcBack: "tc-back" as EventName<CustomEvent<null>>,
    onTcForward: "tc-forward" as EventName<CustomEvent<null>>,
    onTcReload: "tc-reload" as EventName<CustomEvent<null>>,
    onTcStart: "tc-start" as EventName<CustomEvent<null>>,
    onTcOpenExternal: "tc-open-external" as EventName<CustomEvent<PreviewExternal>>,
    onTcConsole: "tc-console" as EventName<CustomEvent<null>>,
    onTcFixRequest: "tc-fix-request" as EventName<CustomEvent<PreviewFixRequest>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPreviewFrame>;
export type PreviewFrameProps = Omit<RawProps, "heading" | "viewport" | "active" | "onTcViewportChange" | "onTcActiveChange" | "onTcFixRequest"> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The width the page is drawn at – controlled when given */
  viewport?: PreviewViewport;
  /** The width at first, when `viewport` isn't controlled */
  defaultViewport?: PreviewViewport;
  /** A width was chosen */
  onViewportChange?: (viewport: PreviewViewport) => void;
  /** The active tab's id – controlled when given */
  active?: string | null;
  /** The active tab at first, when `active` isn't controlled */
  defaultActive?: string | null;
  /** A tab was chosen */
  onActiveChange?: (active: string | null, tab?: PreviewTab) => void;
  /** Ask to fix was pressed under the errors from `html`; return false to stop the "Sent to fix" announcement */
  onFixRequest?: (errors: PreviewError[], event: CustomEvent<PreviewFixRequest>) => boolean | void;
  /** Shown instead of the iframe: a mock page, a canvas, a screenshot */
  children?: React.ReactNode;
};

export function PreviewFrame({ title = "Preview", viewport, defaultViewport = "desktop", onViewportChange, active, defaultActive = null, onActiveChange, onFixRequest, children, ...props }: PreviewFrameProps) {
  const v = useControlled<PreviewViewport>(viewport, defaultViewport, onViewportChange, { ownEvents: true });
  const tab = React.useRef<PreviewTab | undefined>(undefined);
  const a = useControlled<string | null>(active, defaultActive, onActiveChange ? (next) => onActiveChange(next, tab.current) : undefined, { ownEvents: true });
  return h(
    RawPreviewFrame,
    {
      ...props,
      heading: title,
      viewport: v.value,
      active: a.value,
      onTcViewportChange: (e: CustomEvent<PreviewViewportChange>) => v.handler(e.detail.viewport, e),
      onTcActiveChange: (e: CustomEvent<PreviewActiveChange>) => {
        tab.current = e.detail.tab;
        a.handler(e.detail.active, e);
      },
      onTcFixRequest: onFixRequest
        ? (e: CustomEvent<PreviewFixRequest>) => {
            if (onFixRequest(e.detail.errors, e) === false) e.preventDefault();
          }
        : undefined,
    },
    children,
  );
}

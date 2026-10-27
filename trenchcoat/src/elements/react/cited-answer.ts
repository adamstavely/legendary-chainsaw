import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCitedAnswer, type CitedSource as ElementSource } from "../cited-answer";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { CitedSegment } from "../cited-answer";
/** The favicon or logo may be a React node */
export type CitedSource = Omit<ElementSource, "icon"> & { icon?: React.ReactNode };

const RawCitedAnswer = createComponent({
  tagName: "tc-cited-answer",
  elementClass: TcCitedAnswer,
  react: React,
  events: {
    onTcPreviewChange: "tc-preview-change" as EventName<CustomEvent<{ preview: string | null }>>,
    onTcOpenSource: "tc-open-source" as EventName<CustomEvent<{ source: ElementSource }>>,
    onTcAction: "tc-action" as EventName<CustomEvent<null>>,
  },
});
type RawCitedAnswerProps = React.ComponentProps<typeof RawCitedAnswer>;
export type CitedAnswerProps = Omit<RawCitedAnswerProps, "sources" | "preview" | "openHandled" | "actionLabel" | "onTcPreviewChange" | "onTcOpenSource" | "onTcAction"> & {
  /** The sources, numbered in this order – chips under the answer and the passages their previews quote */
  sources: CitedSource[];
  /** Id of the source whose preview is open – controlled when defined (null: closed) */
  preview?: string | null;
  /** Id of the source whose preview is open at first (uncontrolled) */
  defaultPreview?: string | null;
  /**
   * The old name of `defaultPreview`, still read when that's unset
   * @deprecated use `defaultPreview`
   */
  defaultOpen?: string;
  /** Called by Open source. With it the link doesn't navigate on its own – open the page yourself */
  onOpenSource?: (source: CitedSource) => void;
  /** Called when the open preview changes (null = closed) */
  onPreviewChange?: (id: string | null) => void;
  /** A button on the tray, e.g. { label: "Follow up", onClick } */
  action?: { label: string; onClick: () => void };
};

export function CitedAnswer({ sources, preview, defaultPreview, defaultOpen, onOpenSource, onPreviewChange, action, ...props }: CitedAnswerProps) {
  const { stage, els } = useStaged(sources.filter((s) => isNode(s.icon)).map((s) => [s.id, s.icon]));
  const srcs = React.useMemo(() => sources.map((s) => (isNode(s.icon) ? { ...s, icon: els[s.id] } : s)) as ElementSource[], [sources, els]);
  const initial = defaultPreview ?? defaultOpen ?? null;
  const p = useControlled<string | null | undefined>(preview, initial && sources.some((s) => s.id === initial) ? initial : null, (id) => onPreviewChange?.(id ?? null));
  return h(React.Fragment, null, stage, h(RawCitedAnswer, {
    ...props,
    sources: srcs,
    preview: p.value ?? null,
    openHandled: !!onOpenSource,
    actionLabel: action?.label ?? "",
    onTcPreviewChange: (e: CustomEvent<{ preview: string | null }>) => p.handler(e.detail.preview, e),
    onTcOpenSource: (e: CustomEvent<{ source: ElementSource }>) => onOpenSource?.(sources.find((s) => s.id === e.detail.source.id) ?? (e.detail.source as CitedSource)),
    onTcAction: () => action?.onClick(),
  }));
}

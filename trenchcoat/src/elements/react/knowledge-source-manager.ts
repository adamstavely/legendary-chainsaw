import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcKnowledgeSourceManager,
  type KnowledgePauseEvent,
  type KnowledgeSelectedChange,
  type KnowledgeShow,
  type KnowledgeShowChange,
  type KnowledgeSource,
  type KnowledgeSourceEvent,
  type KnowledgeSourcesChange,
} from "../knowledge-source-manager";
import { h, useControlled } from "./internal";

export type { KnowledgeSchedule, KnowledgeShow, KnowledgeSource, KnowledgeSourceState } from "../knowledge-source-manager";
export { KNOWLEDGE_SCHEDULES } from "../knowledge-source-manager";

const RawKnowledgeSourceManager = createComponent({
  tagName: "tc-knowledge-source-manager",
  elementClass: TcKnowledgeSourceManager,
  react: React,
  events: {
    onTcSourcesChange: "tc-sources-change" as EventName<CustomEvent<KnowledgeSourcesChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<KnowledgeSelectedChange>>,
    onTcShowChange: "tc-show-change" as EventName<CustomEvent<KnowledgeShowChange>>,
    onTcAdd: "tc-add" as EventName<CustomEvent<null>>,
    onTcResync: "tc-resync" as EventName<CustomEvent<KnowledgeSourceEvent>>,
    onTcPause: "tc-pause" as EventName<CustomEvent<KnowledgePauseEvent>>,
    onTcReviewChunks: "tc-review-chunks" as EventName<CustomEvent<KnowledgeSourceEvent>>,
  },
});

type RawProps = React.ComponentProps<typeof RawKnowledgeSourceManager>;
type Owned = "heading" | "sources" | "selected" | "show" | "noAdd" | "noReview" | "onTcSourcesChange" | "onTcSelectedChange" | "onTcShowChange" | "onTcAdd" | "onTcResync" | "onTcPause" | "onTcReviewChunks" | "children";
export type KnowledgeSourceManagerProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The sources – controlled when given */
  sources?: KnowledgeSource[];
  /** The sources on mount when `sources` isn't controlled */
  defaultSources?: KnowledgeSource[];
  /** The sources changed: one was removed or its schedule changed */
  onSourcesChange?: (sources: KnowledgeSource[], change: KnowledgeSourcesChange["change"]) => void;
  /** The open source's id – controlled when given (null for none) */
  selected?: string | null;
  /** A source was picked or the open one closed */
  onSelectedChange?: (selected: string | null) => void;
  /** Which sources show – controlled when given */
  show?: KnowledgeShow;
  /** All or Needs attention was picked */
  onShowChange?: (show: KnowledgeShow) => void;
  /** Add source was pressed – open your picker; without it there's no Add source button */
  onAdd?: () => void;
  /** Resync or Retry was pressed */
  onResync?: (source: KnowledgeSource) => void;
  /** Pause or Resume was pressed; `paused` is what was asked for */
  onPauseChange?: (source: KnowledgeSource, paused: boolean) => void;
  /** Review chunks was pressed – open your chunk review; without it there's no Review chunks button */
  onReviewChunks?: (source: KnowledgeSource) => void;
};
const NONE: KnowledgeSource[] = [];

export function KnowledgeSourceManager({ title, sources, defaultSources = NONE, onSourcesChange, selected, onSelectedChange, show, onShowChange, onAdd, onResync, onPauseChange, onReviewChunks, ...props }: KnowledgeSourceManagerProps) {
  const lastChange = React.useRef<KnowledgeSourcesChange["change"] | null>(null);
  const onChange = React.useCallback((next: KnowledgeSource[]) => lastChange.current && onSourcesChange?.(next, lastChange.current), [onSourcesChange]);
  const s = useControlled(sources, defaultSources, onChange);
  const sel = useControlled<string | null>(selected, null, onSelectedChange);
  const sh = useControlled<KnowledgeShow>(show, "all", onShowChange);
  return h(RawKnowledgeSourceManager, {
    ...props,
    heading: title ?? "Knowledge sources",
    sources: s.value,
    selected: sel.value,
    show: sh.value,
    noAdd: !onAdd,
    noReview: !onReviewChunks,
    onTcSourcesChange: (e: CustomEvent<KnowledgeSourcesChange>) => {
      lastChange.current = e.detail.change;
      s.handler(e.detail.sources, e);
    },
    onTcSelectedChange: (e: CustomEvent<KnowledgeSelectedChange>) => sel.handler(e.detail.selected, e),
    onTcShowChange: (e: CustomEvent<KnowledgeShowChange>) => sh.handler(e.detail.show, e),
    onTcAdd: () => onAdd?.(),
    onTcResync: (e: CustomEvent<KnowledgeSourceEvent>) => onResync?.(e.detail.source),
    onTcPause: (e: CustomEvent<KnowledgePauseEvent>) => onPauseChange?.(e.detail.source, e.detail.paused),
    onTcReviewChunks: (e: CustomEvent<KnowledgeSourceEvent>) => onReviewChunks?.(e.detail.source),
  });
}

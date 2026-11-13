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
  type KnowledgeSourcesAdd,
  type KnowledgeSourcesChange,
} from "../knowledge-source-manager";
import { h, useControlled } from "./internal";

export type { KnowledgeCrawlDepth, KnowledgeSchedule, KnowledgeShow, KnowledgeSource, KnowledgeSourcesAdd, KnowledgeSourceState, KnowledgeText } from "../knowledge-source-manager";
export { KNOWLEDGE_SCHEDULES, knowledgeUrl } from "../knowledge-source-manager";

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
    onTcSourcesAdd: "tc-sources-add" as EventName<CustomEvent<KnowledgeSourcesAdd>>,
  },
});

type RawProps = React.ComponentProps<typeof RawKnowledgeSourceManager>;
type Owned = "heading" | "sources" | "selected" | "show" | "noAdd" | "noReview" | "addInline" | "onTcSourcesChange" | "onTcSelectedChange" | "onTcShowChange" | "onTcAdd" | "onTcResync" | "onTcPause" | "onTcReviewChunks" | "onTcSourcesAdd" | "children";
export type KnowledgeSourceManagerProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The sources – controlled when given */
  sources?: KnowledgeSource[];
  /** The sources on mount when `sources` isn't controlled */
  defaultSources?: KnowledgeSource[];
  /** The sources changed: one was removed, its schedule changed, or new ones were added as queued from the panel */
  onSourcesChange?: (sources: KnowledgeSource[], change: KnowledgeSourcesChange["change"]) => void;
  /** The open source's id – controlled when given (null for none) */
  selected?: string | null;
  /** A source was picked or the open one closed */
  onSelectedChange?: (selected: string | null) => void;
  /** Which sources show – controlled when given */
  show?: KnowledgeShow;
  /** All or Needs attention was picked */
  onShowChange?: (show: KnowledgeShow) => void;
  /** Add source was pressed – open your picker; without it (or onSourcesAdd) there's no Add source button */
  onAdd?: () => void;
  /**
   * Given, Add source opens the built-in Add sources panel – files, links and pasted text – and this is called with
   * what to add. Start ingesting them; return false to stop them being listed as queued (you'll pass the real ones)
   */
  onSourcesAdd?: (add: KnowledgeSourcesAdd) => boolean | void;
  /** Resync or Retry was pressed */
  onResync?: (source: KnowledgeSource) => void;
  /** Pause or Resume was pressed; `paused` is what was asked for */
  onPauseChange?: (source: KnowledgeSource, paused: boolean) => void;
  /** Review chunks was pressed – open your chunk review; without it there's no Review chunks button */
  onReviewChunks?: (source: KnowledgeSource) => void;
};
const NONE: KnowledgeSource[] = [];

export function KnowledgeSourceManager({ title, sources, defaultSources = NONE, onSourcesChange, selected, onSelectedChange, show, onShowChange, onAdd, onSourcesAdd, onResync, onPauseChange, onReviewChunks, ...props }: KnowledgeSourceManagerProps) {
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
    noAdd: !onAdd && !onSourcesAdd,
    addInline: !!onSourcesAdd,
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
    onTcSourcesAdd: (e: CustomEvent<KnowledgeSourcesAdd>) => {
      if (onSourcesAdd?.(e.detail) === false) e.preventDefault();
    },
  });
}

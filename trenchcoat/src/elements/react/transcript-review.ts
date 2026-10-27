import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcTranscriptReview,
  type TranscriptCopyDetail,
  type TranscriptHiddenSpeakersChange,
  type TranscriptQueryChange,
  type TranscriptSegment,
  type TranscriptSegmentChange,
  type TranscriptTranslationMode,
  type TranscriptTranslationModeChange,
  type TranscriptVerifyDetail,
} from "../transcript-review";
import { h, useControlled } from "./internal";

export type {
  TranscriptCopyDetail,
  TranscriptHiddenSpeakersChange,
  TranscriptMediaKind,
  TranscriptQueryChange,
  TranscriptSegment,
  TranscriptSegmentChange,
  TranscriptSpeaker,
  TranscriptTone,
  TranscriptTranslationMode,
  TranscriptTranslationModeChange,
  TranscriptVerifyDetail,
  TranscriptWord,
} from "../transcript-review";
export { transcriptClock } from "../transcript-review";

const NONE: string[] = [];

const RawTranscriptReview = createComponent({
  tagName: "tc-transcript-review",
  elementClass: TcTranscriptReview,
  react: React,
  events: {
    onTcSegmentChange: "tc-segment-change" as EventName<CustomEvent<TranscriptSegmentChange>>,
    onTcVerify: "tc-verify" as EventName<CustomEvent<TranscriptVerifyDetail>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<TranscriptCopyDetail>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<TranscriptQueryChange>>,
    onTcHiddenSpeakersChange: "tc-hidden-speakers-change" as EventName<CustomEvent<TranscriptHiddenSpeakersChange>>,
    onTcTranslationModeChange: "tc-translation-mode-change" as EventName<CustomEvent<TranscriptTranslationModeChange>>,
  },
});
type RawTranscriptReviewProps = React.ComponentProps<typeof RawTranscriptReview>;
type Owned = "heading" | "query" | "hiddenSpeakers" | "translationMode" | "sent" | `onTc${string}`;
export type TranscriptReviewProps = Omit<RawTranscriptReviewProps, Owned> & {
  /** The heading, and the region's name */
  title?: string;
  /** The search text – controlled when defined; pair it with `onQueryChange` */
  query?: string;
  /** The search text at first, when `query` isn't controlled */
  defaultQuery?: string;
  /** Called as the search text changes */
  onQueryChange?: (query: string) => void;
  /** Speaker ids the list leaves out – controlled when defined */
  hiddenSpeakers?: string[];
  /** Speaker ids left out at first, when `hiddenSpeakers` isn't controlled */
  defaultHiddenSpeakers?: string[];
  /** Called when a speaker chip is toggled, with the ids now hidden */
  onHiddenSpeakersChange?: (hiddenSpeakers: string[]) => void;
  /** Original, translation or both side by side – controlled when defined */
  translationMode?: TranscriptTranslationMode;
  /** The view at first, when `translationMode` isn't controlled (default "original") */
  defaultTranslationMode?: TranscriptTranslationMode;
  /** Called when the view is switched */
  onTranslationModeChange?: (mode: TranscriptTranslationMode) => void;
  /** Ids of segments sent to verification – controlled when defined; pair it with `onSentChange` */
  sent?: string[];
  /** Ids already sent at first, when `sent` isn't controlled */
  defaultSent?: string[];
  /** Called with every sent id after "Send to verification" */
  onSentChange?: (sent: string[]) => void;
  /** Called when a segment is sent to verification – hand it to your review process here */
  onVerify?: (segment: TranscriptSegment) => void;
  /** Called when a segment is copied, with the text that went to the clipboard */
  onCopySegment?: (segment: TranscriptSegment, text: string) => void;
  /** Called when the segment being played changes – null in a gap between segments */
  onSegmentChange?: (segment: TranscriptSegment | null) => void;
};

export function TranscriptReview({
  title = "Transcript",
  query,
  defaultQuery = "",
  onQueryChange,
  hiddenSpeakers,
  defaultHiddenSpeakers = NONE,
  onHiddenSpeakersChange,
  translationMode,
  defaultTranslationMode = "original",
  onTranslationModeChange,
  sent,
  defaultSent = NONE,
  onSentChange,
  onVerify,
  onCopySegment,
  onSegmentChange,
  ...props
}: TranscriptReviewProps) {
  const q = useControlled(query, defaultQuery, onQueryChange);
  const hidden = useControlled(hiddenSpeakers, defaultHiddenSpeakers, onHiddenSpeakersChange);
  const mode = useControlled(translationMode, defaultTranslationMode, onTranslationModeChange);
  const s = useControlled(sent, defaultSent, onSentChange);
  return h(RawTranscriptReview, {
    ...props,
    heading: title,
    query: q.value,
    hiddenSpeakers: hidden.value,
    translationMode: mode.value,
    sent: s.value,
    onTcQueryChange: (e: CustomEvent<TranscriptQueryChange>) => q.handler(e.detail.query, e),
    onTcHiddenSpeakersChange: (e: CustomEvent<TranscriptHiddenSpeakersChange>) => hidden.handler(e.detail.hiddenSpeakers, e),
    onTcTranslationModeChange: (e: CustomEvent<TranscriptTranslationModeChange>) => mode.handler(e.detail.mode, e),
    onTcVerify: (e: CustomEvent<TranscriptVerifyDetail>) => {
      s.handler(e.detail.sent, e);
      onVerify?.(e.detail.segment);
    },
    onTcCopy: (e: CustomEvent<TranscriptCopyDetail>) => onCopySegment?.(e.detail.segment, e.detail.text),
    onTcSegmentChange: (e: CustomEvent<TranscriptSegmentChange>) => onSegmentChange?.(e.detail.segment),
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSpeedReader, type SpeedReaderChunkChange, type SpeedReaderFinish, type SpeedReaderPositionChange, type SpeedReaderWpmChange } from "../speed-reader";
import { h, useControlled } from "./internal";

export type { SpeedReaderChunkChange, SpeedReaderFinish, SpeedReaderPositionChange, SpeedReaderScheduler, SpeedReaderWpmChange } from "../speed-reader";
export { readerWords, recognitionPoint, wordWeight } from "../speed-reader";

const RawSpeedReader = createComponent({
  tagName: "tc-speed-reader",
  elementClass: TcSpeedReader,
  react: React,
  events: {
    onTcWpmChange: "tc-wpm-change" as EventName<CustomEvent<SpeedReaderWpmChange>>,
    onTcChunkChange: "tc-chunk-change" as EventName<CustomEvent<SpeedReaderChunkChange>>,
    onTcPositionChange: "tc-position-change" as EventName<CustomEvent<SpeedReaderPositionChange>>,
    onTcFinish: "tc-finish" as EventName<CustomEvent<SpeedReaderFinish>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSpeedReader>;
type Owned = "heading" | "wpm" | "chunk" | "position" | "onTcWpmChange" | "onTcChunkChange" | "onTcPositionChange" | "onTcFinish" | "children";
export type SpeedReaderProps = Omit<RawProps, Owned> & {
  /** The heading; "Speed reader" by default */
  title?: string;
  /** Words a minute, 100–1000 – controlled when given */
  wpm?: number;
  /** The speed on mount when `wpm` isn't controlled */
  defaultWpm?: number;
  /** The speed was changed */
  onWpmChange?: (wpm: number) => void;
  /** Words shown at a time, 1–3 – controlled when given */
  chunk?: number;
  /** The words at a time on mount when `chunk` isn't controlled */
  defaultChunk?: number;
  /** The words at a time were changed */
  onChunkChange?: (chunk: number) => void;
  /** The first word on screen, 0-based – controlled when given */
  position?: number;
  /** The place on mount when `position` isn't controlled */
  defaultPosition?: number;
  /** The place moved – reading on, stepping or the scrubber */
  onPositionChange?: (position: number) => void;
  /** The last word was shown */
  onFinish?: (words: number) => void;
};

export function SpeedReader({ title, wpm, defaultWpm = 300, onWpmChange, chunk, defaultChunk = 1, onChunkChange, position, defaultPosition = 0, onPositionChange, onFinish, ...props }: SpeedReaderProps) {
  const w = useControlled(wpm, defaultWpm, onWpmChange);
  const c = useControlled(chunk, defaultChunk, onChunkChange);
  const p = useControlled(position, defaultPosition, onPositionChange);
  return h(RawSpeedReader, {
    ...props,
    heading: title ?? "Speed reader",
    wpm: w.value,
    chunk: c.value,
    position: p.value,
    onTcWpmChange: (e: CustomEvent<SpeedReaderWpmChange>) => w.handler(e.detail.wpm, e),
    onTcChunkChange: (e: CustomEvent<SpeedReaderChunkChange>) => c.handler(e.detail.chunk, e),
    onTcPositionChange: (e: CustomEvent<SpeedReaderPositionChange>) => p.handler(e.detail.position, e),
    onTcFinish: (e: CustomEvent<SpeedReaderFinish>) => onFinish?.(e.detail.words),
  });
}

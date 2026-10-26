import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcVoiceMode } from "../voice-mode";
import { h, useControlled } from "./internal";

export type { VoiceModeLabels, VoiceModeState, VoiceTurn } from "../voice-mode";

const RawVoiceMode = createComponent({
  tagName: "tc-voice-mode",
  elementClass: TcVoiceMode,
  react: React,
  events: {
    onTcMutedChange: "tc-muted-change" as EventName<CustomEvent<{ muted: boolean }>>,
    onTcCaptionsChange: "tc-captions-change" as EventName<CustomEvent<{ captions: boolean }>>,
    onTcInterrupt: "tc-interrupt" as EventName<CustomEvent<null>>,
    onTcEnd: "tc-end" as EventName<CustomEvent<null>>,
  },
});
type RawVoiceModeProps = React.ComponentProps<typeof RawVoiceMode>;
type Own = "muted" | "captions" | "title" | "onTcMutedChange" | "onTcCaptionsChange" | "onTcInterrupt" | "onTcEnd";
export type VoiceModeProps = Omit<RawVoiceModeProps, Own> & {
  /** A title over the orb */
  title?: string;
  /** The microphone is muted (controlled when defined) */
  muted?: boolean;
  defaultMuted?: boolean;
  onMutedChange?: (muted: boolean) => void;
  /** The captions are shown (controlled when defined) */
  captions?: boolean;
  defaultCaptions?: boolean;
  onCaptionsChange?: (captions: boolean) => void;
  /** Interrupt was pressed (or Esc) while the assistant thinks or speaks */
  onInterrupt?: () => void;
  /** End was pressed */
  onEnd?: () => void;
};

/** Voice Mode – a spoken conversation: the orb, live captions for every turn, and Mute, Captions, Interrupt and End */
export function VoiceMode({ title, muted, defaultMuted = false, onMutedChange, captions, defaultCaptions = true, onCaptionsChange, onInterrupt, onEnd, ...props }: VoiceModeProps) {
  const m = useControlled(muted, defaultMuted, onMutedChange);
  const c = useControlled(captions, defaultCaptions, onCaptionsChange);
  return h(RawVoiceMode, {
    ...props,
    heading: title ?? props.heading,
    muted: m.value,
    captions: c.value,
    onTcMutedChange: (e: CustomEvent<{ muted: boolean }>) => m.handler(e.detail.muted, e),
    onTcCaptionsChange: (e: CustomEvent<{ captions: boolean }>) => c.handler(e.detail.captions, e),
    onTcInterrupt: () => onInterrupt?.(),
    onTcEnd: () => onEnd?.(),
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTextToSpeech, type TextToSpeechEnd, type TextToSpeechPitchChange, type TextToSpeechRateChange, type TextToSpeechStart, type TextToSpeechVoiceChange } from "../text-to-speech";
import { h, useControlled } from "./internal";

export type { TextToSpeechEnd, TextToSpeechPitchChange, TextToSpeechRateChange, TextToSpeechStart, TextToSpeechState, TextToSpeechVoiceChange } from "../text-to-speech";
export { splitSentences } from "../text-to-speech";

const RawTextToSpeech = createComponent({
  tagName: "tc-text-to-speech",
  elementClass: TcTextToSpeech,
  react: React,
  events: {
    onTcRateChange: "tc-rate-change" as EventName<CustomEvent<TextToSpeechRateChange>>,
    onTcPitchChange: "tc-pitch-change" as EventName<CustomEvent<TextToSpeechPitchChange>>,
    onTcVoiceChange: "tc-voice-change" as EventName<CustomEvent<TextToSpeechVoiceChange>>,
    onTcStart: "tc-start" as EventName<CustomEvent<TextToSpeechStart>>,
    onTcEnd: "tc-end" as EventName<CustomEvent<TextToSpeechEnd>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTextToSpeech>;
// onRateChange is also a React media-event prop: left out so ours replaces it
type Owned = "heading" | "onRateChange" | "rate" | "pitch" | "voice" | "onTcRateChange" | "onTcPitchChange" | "onTcVoiceChange" | "onTcStart" | "onTcEnd" | "children";
export type TextToSpeechProps = Omit<RawProps, Owned> & {
  /** The heading; "Read aloud" by default */
  title?: string;
  /** Speaking speed from 0.5 to 2 – controlled when given */
  rate?: number;
  /** The speed on mount when `rate` isn't controlled */
  defaultRate?: number;
  /** The speed was changed */
  onRateChange?: (rate: number) => void;
  /** Pitch from 0 to 2 – controlled when given */
  pitch?: number;
  /** The pitch on mount when `pitch` isn't controlled */
  defaultPitch?: number;
  /** The pitch was changed */
  onPitchChange?: (pitch: number) => void;
  /** The voice's `voiceURI`, "" for the browser's default – controlled when given */
  voice?: string;
  /** The voice on mount when `voice` isn't controlled */
  defaultVoice?: string;
  /** A voice was picked */
  onVoiceChange?: (voice: string) => void;
  /** Reading began at a sentence (0-based) */
  onReadStart?: (sentence: number) => void;
  /** Reading stopped – `completed` when it reached the end */
  onReadEnd?: (completed: boolean, sentence: number) => void;
};

export function TextToSpeech({ title, rate, defaultRate = 1, onRateChange, pitch, defaultPitch = 1, onPitchChange, voice, defaultVoice = "", onVoiceChange, onReadStart, onReadEnd, ...props }: TextToSpeechProps) {
  const r = useControlled(rate, defaultRate, onRateChange);
  const p = useControlled(pitch, defaultPitch, onPitchChange);
  const v = useControlled(voice, defaultVoice, onVoiceChange);
  return h(RawTextToSpeech, {
    ...props,
    heading: title ?? "Read aloud",
    rate: r.value,
    pitch: p.value,
    voice: v.value,
    onTcRateChange: (e: CustomEvent<TextToSpeechRateChange>) => r.handler(e.detail.rate, e),
    onTcPitchChange: (e: CustomEvent<TextToSpeechPitchChange>) => p.handler(e.detail.pitch, e),
    onTcVoiceChange: (e: CustomEvent<TextToSpeechVoiceChange>) => v.handler(e.detail.voice, e),
    onTcStart: (e: CustomEvent<TextToSpeechStart>) => onReadStart?.(e.detail.sentence),
    onTcEnd: (e: CustomEvent<TextToSpeechEnd>) => onReadEnd?.(e.detail.completed, e.detail.sentence),
  });
}

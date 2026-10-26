import { createComponent } from "@lit/react";
import * as React from "react";
import { TcVoiceOrb } from "../voice-orb";
import { h } from "./internal";

export type { VoiceOrbState } from "../voice-orb";

const RawVoiceOrb = createComponent({ tagName: "tc-voice-orb", elementClass: TcVoiceOrb, react: React });
type RawVoiceOrbProps = React.ComponentProps<typeof RawVoiceOrb>;
export type VoiceOrbProps = Omit<RawVoiceOrbProps, "pressable"> & {
  /** Makes the orb a button, e.g. to start and stop listening */
  onPress?: () => void;
};

/** Voice Orb – a dot sphere that shows whether the assistant is idle, listening, thinking or speaking */
export function VoiceOrb({ onPress, onClick, ...props }: VoiceOrbProps) {
  // A caller's own onClick still runs first; preventDefault() in it skips onPress
  const click = React.useCallback(
    (e: React.MouseEvent<TcVoiceOrb>) => {
      onClick?.(e);
      if (onPress && !e.defaultPrevented && (e.target as Element).closest?.(".ui-vo__hit")) onPress();
    },
    [onClick, onPress],
  );
  return h(RawVoiceOrb, { ...props, pressable: !!onPress, onClick: onPress || onClick ? click : undefined });
}

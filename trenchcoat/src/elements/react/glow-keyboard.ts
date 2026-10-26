import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcGlowKeyboard, type GlowKeyboardSubmit } from "../glow-keyboard";

const RawGlowKeyboard = createComponent({
  tagName: "tc-glow-keyboard",
  elementClass: TcGlowKeyboard,
  react: React,
  events: { onTcSubmit: "tc-submit" as EventName<CustomEvent<GlowKeyboardSubmit>> },
});
export type GlowKeyboardProps = Omit<React.ComponentProps<typeof RawGlowKeyboard>, "children" | "look" | "onTcSubmit" | "onSubmit"> & {
  /** Called when a prompt is sent with Enter – by the demo or by the user */
  onSubmit?: (text: string) => void;
};
/** An AI chat input above a glass keyboard and a moving gradient floor; the prompt types itself */
export function GlowKeyboard({ onSubmit, ...props }: GlowKeyboardProps) {
  const latest = React.useRef(onSubmit);
  latest.current = onSubmit;
  const onTcSubmit = React.useCallback((e: CustomEvent<GlowKeyboardSubmit>) => latest.current?.(e.detail.text), []);
  return React.createElement(RawGlowKeyboard, { ...props, onTcSubmit });
}

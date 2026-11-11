import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcLikeBurst, type LikeBurstPressedChange } from "../like-burst";
import { h, useControlled } from "./internal";

export type { LikeBurstPressedChange } from "../like-burst";

const Raw = createComponent({
  tagName: "tc-like-burst",
  elementClass: TcLikeBurst,
  react: React,
  events: { onTcPressedChange: "tc-pressed-change" as EventName<CustomEvent<LikeBurstPressedChange>> },
});

export type LikeBurstProps = Omit<React.ComponentProps<typeof Raw>, "pressed" | "onTcPressedChange"> & {
  /** On or off – controlled when given; then pass the matching `count` too */
  pressed?: boolean;
  /** Where it starts when the element keeps its own state */
  defaultPressed?: boolean;
  /** Called with the new state when it's pressed */
  onPressedChange?: (pressed: boolean) => void;
};

/** A like or save toggle whose icon fills with a spring and a small burst */
export function LikeBurst({ pressed, defaultPressed = false, onPressedChange, count, ...props }: LikeBurstProps) {
  const s = useControlled(pressed, defaultPressed, onPressedChange);
  // Uncontrolled, `count` is where it started: the element's own press moves it by one, and a re-render mustn't undo that
  const shown = count === undefined || s.controlled ? count : Math.max(0, count + (s.value === defaultPressed ? 0 : s.value ? 1 : -1));
  return h(Raw, {
    ...props,
    count: shown,
    pressed: s.value,
    onTcPressedChange: (e: CustomEvent<LikeBurstPressedChange>) => s.handler(e.detail.pressed, e),
  });
}

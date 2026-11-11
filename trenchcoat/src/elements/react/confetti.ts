import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcConfetti, type ConfettiDone } from "../confetti";

export type { ConfettiDone, ConfettiOptions, ConfettiOrigin } from "../confetti";

/** A celebration burst of confetti. The ref receives the element – call ref.current.fire() */
export const Confetti = createComponent({
  tagName: "tc-confetti",
  elementClass: TcConfetti,
  react: React,
  events: { onConfettiDone: "tc-confetti-done" as EventName<CustomEvent<ConfettiDone>> },
});
export type ConfettiProps = React.ComponentProps<typeof Confetti>;

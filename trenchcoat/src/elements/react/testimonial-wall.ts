import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTestimonialWall, type TestimonialPausedChange } from "../testimonial-wall";
import { h, useControlled } from "./internal";

export { dealTestimonials, testimonialColumns } from "../testimonial-wall";
export type { Testimonial } from "../testimonial-wall";

const RawTestimonialWall = createComponent({
  tagName: "tc-testimonial-wall",
  elementClass: TcTestimonialWall,
  react: React,
  events: {
    onTcPausedChange: "tc-paused-change" as EventName<CustomEvent<TestimonialPausedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTestimonialWall>;

export type TestimonialWallOwnProps = {
  /** Stopped (controlled) – pass `onPausedChange` with it. Leave undefined to start at `defaultPaused` */
  paused?: boolean;
  /** Stopped at first when uncontrolled */
  defaultPaused?: boolean;
  /** Called when the Pause / Play button is pressed */
  onPausedChange?: (paused: boolean) => void;
};
export type TestimonialWallProps = Omit<RawProps, keyof TestimonialWallOwnProps | "onTcPausedChange" | "children"> & TestimonialWallOwnProps;

export function TestimonialWall({ paused, defaultPaused = false, onPausedChange, ...props }: TestimonialWallProps) {
  const p = useControlled(paused, defaultPaused, onPausedChange);
  return h(RawTestimonialWall, {
    ...props,
    paused: p.value,
    onTcPausedChange: (e: CustomEvent<TestimonialPausedChange>) => p.handler(e.detail.paused, e),
  });
}

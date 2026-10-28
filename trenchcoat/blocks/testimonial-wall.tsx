"use client";

import { TestimonialWall as Base, type Testimonial, type TestimonialWallProps as BaseProps } from "trenchcoat/react";

/*
 * Testimonial Wall – the landing-page wall of quotes: columns that scroll endlessly in opposite directions, ease to a
 * stop on hover or keyboard focus and scrub with inertia, with a Pause / Play button that stops the whole wall for good
 * (WCAG 2.2.2); prefers-reduced-motion shows a static grid. It is the <tc-testimonial-wall> element through
 * `trenchcoat/react` (install `trenchcoat` instead of copying files); every framework gets the same element. Set the
 * height with --tc-testimonial-wall-height (600px by default).
 */

export type { Testimonial };
export type TestimonialWallProps = BaseProps & {
  /** The quotes */
  items: Testimonial[];
};

export function TestimonialWall(props: TestimonialWallProps) {
  return <Base {...props} />;
}

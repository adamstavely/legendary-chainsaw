"use client";

import { LogoMarquee as Base, type LogoMarqueeProps as BaseProps, type MarqueeLogo } from "trenchcoat/react";

/*
 * Logo Marquee – the endless "Trusted by" strip for landing pages. Rows of logos loop seamlessly, ease to a stop on
 * hover or keyboard focus, scrub with inertia and lift the hovered logo to colour; a Pause / Play button stops it for
 * good (WCAG 2.2.2), and prefers-reduced-motion shows a static row. It is the <tc-logo-marquee> element through
 * `trenchcoat/react` (install `trenchcoat` instead of copying files); every framework gets the same element. Marks may
 * be React nodes.
 */

export type { MarqueeLogo };
export type LogoMarqueeProps = BaseProps;

export function LogoMarquee(props: LogoMarqueeProps) {
  return <Base {...props} />;
}

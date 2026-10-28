import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcLogoMarquee, type MarqueeLogo as ElementLogo, type MarqueePausedChange } from "../logo-marquee";
import { h, isNode, useControlled, useStaged } from "./internal";

export { marqueeRows } from "../logo-marquee";
export type { MarqueeLabels } from "../logo-marquee";

const RawLogoMarquee = createComponent({
  tagName: "tc-logo-marquee",
  elementClass: TcLogoMarquee,
  react: React,
  events: {
    onTcPausedChange: "tc-paused-change" as EventName<CustomEvent<MarqueePausedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawLogoMarquee>;

/** A logo; its mark may be a React node, as before */
export type MarqueeLogo = Omit<ElementLogo, "svg"> & { svg?: React.ReactNode | Element };

export type LogoMarqueeOwnProps = {
  /** The logos */
  logos: MarqueeLogo[];
  /** Stopped (controlled) – pass `onPausedChange` with it. Leave undefined to start at `defaultPaused` */
  paused?: boolean;
  /** Stopped at first when uncontrolled */
  defaultPaused?: boolean;
  /** Called when the Pause / Play button is pressed */
  onPausedChange?: (paused: boolean) => void;
};
export type LogoMarqueeProps = Omit<RawProps, keyof LogoMarqueeOwnProps | "onTcPausedChange" | "children"> & LogoMarqueeOwnProps;

export function LogoMarquee({ logos, paused, defaultPaused = false, onPausedChange, ...props }: LogoMarqueeProps) {
  const p = useControlled(paused, defaultPaused, onPausedChange);
  const { stage, els } = useStaged(logos.filter((l) => isNode(l.svg)).map((l) => [l.name, l.svg as React.ReactNode]));
  const list = React.useMemo(() => logos.map((l) => ({ ...l, svg: isNode(l.svg) ? els[l.name] : (l.svg as Element | undefined) })) as ElementLogo[], [logos, els]);
  return h(
    React.Fragment,
    null,
    stage,
    h(RawLogoMarquee, {
      ...props,
      logos: list,
      paused: p.value,
      onTcPausedChange: (e: CustomEvent<MarqueePausedChange>) => p.handler(e.detail.paused, e),
    }),
  );
}

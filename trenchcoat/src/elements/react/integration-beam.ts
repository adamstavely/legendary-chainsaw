import { createComponent } from "@lit/react";
import * as React from "react";
import { TcIntegrationBeam, type IntegrationBeamCenter, type IntegrationBeamTool } from "../integration-beam";
import { h, isNode, useStaged } from "./internal";

export type BeamTool = {
  /** Shown in the tooltip and read to screen readers, e.g. "Slack" */
  name: string;
  /** Logo, drawn into a 28 × 28 box (an <svg> fills the box) */
  logo: React.ReactNode;
};

export type BeamCenter = {
  /** Your product's name, used in the accessible description */
  name: string;
  /** Your mark, drawn into a 36 × 36 box on the dark tile – a neutral flower when left out */
  logo?: React.ReactNode;
};

const RawIntegrationBeam = createComponent({ tagName: "tc-integration-beam", elementClass: TcIntegrationBeam, react: React });
type RawIntegrationBeamProps = React.ComponentProps<typeof RawIntegrationBeam>;
export type IntegrationBeamProps = Omit<RawIntegrationBeamProps, "left" | "right" | "center" | "children"> & {
  /** Tools that send data in (left, or above on narrow widths) – three look best */
  left?: BeamTool[];
  /** Tools that receive data (right, or below on narrow widths) – three look best */
  right?: BeamTool[];
  /** The product in the middle */
  center?: BeamCenter;
};

const asElement = (node: React.ReactNode, staged: Element | undefined) => (isNode(node) ? staged : (node as unknown as Element | undefined) ?? undefined);

export function IntegrationBeam({ left, right, center, ...props }: IntegrationBeamProps) {
  const nodes: [string, React.ReactNode][] = [];
  left?.forEach((t, i) => isNode(t.logo) && nodes.push([`l${i}`, t.logo]));
  right?.forEach((t, i) => isNode(t.logo) && nodes.push([`r${i}`, t.logo]));
  if (isNode(center?.logo)) nodes.push(["c", center!.logo]);
  const { stage, els } = useStaged(nodes);
  const tools = React.useMemo(() => {
    const map = (list: BeamTool[] | undefined, k: string): IntegrationBeamTool[] | undefined => list?.map((t, i) => ({ name: t.name, logo: asElement(t.logo, els[`${k}${i}`]) }));
    return { left: map(left, "l"), right: map(right, "r") };
  }, [left, right, els]);
  const hub = React.useMemo<IntegrationBeamCenter | undefined>(() => (center ? { name: center.name, logo: asElement(center.logo, els.c) } : undefined), [center, els]);
  return h(React.Fragment, null, stage, h(RawIntegrationBeam, { ...props, left: tools.left, right: tools.right, ...(hub ? { center: hub } : null) }));
}

import { createComponent } from "@lit/react";
import * as React from "react";
import { TcIntegrationFlow, type IntegrationFlowItem } from "../integration-flow";
import { h, isNode, useStaged } from "./internal";

export type IntegrationItem = {
  /** Shown as the second line of the pill, e.g. "Slack" */
  name: string;
  /** Logo, drawn into a 64 × 64 box inside the round badge (an <svg> fills the box) */
  icon: React.ReactNode;
  /** First line of the pill */
  title?: string;
  /** Single-color logo: white on the passing pills, black (white in dark mode) in the centre */
  mono?: boolean;
};

const RawIntegrationFlow = createComponent({ tagName: "tc-integration-flow", elementClass: TcIntegrationFlow, react: React });
type RawIntegrationFlowProps = React.ComponentProps<typeof RawIntegrationFlow>;
export type IntegrationFlowProps = Omit<RawIntegrationFlowProps, "items" | "children"> & {
  /** Integrations that rotate through the pills (5 or more look best) */
  items?: IntegrationItem[];
};

export function IntegrationFlow({ items, ...props }: IntegrationFlowProps) {
  const nodes: [string, React.ReactNode][] = [];
  items?.forEach((it, i) => isNode(it.icon) && nodes.push([`i${i}`, it.icon]));
  const { stage, els } = useStaged(nodes);
  const list = React.useMemo(
    () => items?.map((it, i): IntegrationFlowItem => ({ ...it, icon: isNode(it.icon) ? els[`i${i}`] : ((it.icon as unknown as Element | null | undefined) ?? null) })),
    [items, els],
  );
  return h(React.Fragment, null, stage, h(RawIntegrationFlow, { ...props, items: list }));
}

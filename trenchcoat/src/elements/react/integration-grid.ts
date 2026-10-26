import { createComponent } from "@lit/react";
import * as React from "react";
import { TcIntegrationGrid } from "../integration-grid";
import { h, isNode, useStaged } from "./internal";

export type { IntegrationGridLogo } from "../integration-grid";

const RawIntegrationGrid = createComponent({ tagName: "tc-integration-grid", elementClass: TcIntegrationGrid, react: React });
type RawIntegrationGridProps = React.ComponentProps<typeof RawIntegrationGrid>;
export type IntegrationGridProps = Omit<RawIntegrationGridProps, "mark" | "children"> & {
  /** Content of the centre tile – defaults to a neutral product mark */
  mark?: React.ReactNode;
};
export function IntegrationGrid({ mark, ...props }: IntegrationGridProps) {
  const { stage, els } = useStaged(isNode(mark) ? [["mark", mark]] : []);
  return h(React.Fragment, null, stage, h(RawIntegrationGrid, { ...props, mark: isNode(mark) ? els.mark : (mark as Element | undefined) }));
}

import { createComponent } from "@lit/react";
import * as React from "react";
import { TcAudienceMix } from "../audience-mix";
import { h } from "./internal";

export type { AudienceMixData, AudienceShare, AudienceSplit } from "../audience-mix";

const RawAudienceMix = createComponent({ tagName: "tc-audience-mix", elementClass: TcAudienceMix, react: React });
type RawProps = React.ComponentProps<typeof RawAudienceMix>;
export type AudienceMixProps = Omit<RawProps, "heading" | "children"> & {
  /** The heading */
  title?: string;
};

export function AudienceMix({ title, ...props }: AudienceMixProps) {
  return h(RawAudienceMix, { ...props, heading: title ?? "Who is reading" });
}

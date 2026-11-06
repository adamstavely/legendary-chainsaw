import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPrLink, type PrLinkOpenChange } from "../pr-link";

export type { PrLinkLabels, PrLinkState } from "../pr-link";

/** A pull request in running text, with its card on hover or focus. The ref receives the element */
export const PrLink = createComponent({
  tagName: "tc-pr-link",
  elementClass: TcPrLink,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<PrLinkOpenChange>>,
  },
});
export type PrLinkProps = React.ComponentProps<typeof PrLink>;

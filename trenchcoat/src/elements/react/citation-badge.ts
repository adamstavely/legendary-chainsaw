import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCitationBadge, type CitationOpen } from "../citation-badge";
import { h } from "./internal";

export type { CitationIcon, CitationRow, CitationTone } from "../citation-badge";
export { defaultCitationRows } from "../citation-badge";

const RawCitationBadge = createComponent({
  tagName: "tc-citation-badge",
  elementClass: TcCitationBadge,
  react: React,
  events: { onTcOpen: "tc-open" as EventName<CustomEvent<CitationOpen>> },
});
type RawProps = React.ComponentProps<typeof RawCitationBadge>;
export type CitationBadgeProps = Omit<RawProps, "onTcOpen" | "children"> & {
  /** The badge was opened (with `href` or `openable`); return false to stop a link being followed */
  onOpen?: (href?: string) => boolean | void;
};

export function CitationBadge({ onOpen, ...props }: CitationBadgeProps) {
  return h(RawCitationBadge, {
    ...props,
    onTcOpen: (e: CustomEvent<CitationOpen>) => {
      if (onOpen?.(e.detail.href) === false) e.preventDefault();
    },
  });
}

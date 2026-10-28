import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCitationSections, type CitationSectionsOpen } from "../citation-sections";
import { h } from "./internal";

export type { CitationSection } from "../citation-sections";
export { defaultCitationSections } from "../citation-sections";

const RawCitationSections = createComponent({
  tagName: "tc-citation-sections",
  elementClass: TcCitationSections,
  react: React,
  events: { onTcOpen: "tc-open" as EventName<CustomEvent<CitationSectionsOpen>> },
});
type RawProps = React.ComponentProps<typeof RawCitationSections>;
export type CitationSectionsProps = Omit<RawProps, "onTcOpen" | "children"> & {
  /** "See more details" was used; return false to stop a link being followed */
  onOpen?: (href?: string) => boolean | void;
};

export function CitationSections({ onOpen, ...props }: CitationSectionsProps) {
  return h(RawCitationSections, {
    ...props,
    onTcOpen: (e: CustomEvent<CitationSectionsOpen>) => {
      if (onOpen?.(e.detail.href) === false) e.preventDefault();
    },
  });
}

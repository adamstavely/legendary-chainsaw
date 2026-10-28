import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPersonLinks, type LinkedPerson, type PersonLinksAction, type PersonLinksSelectedChange } from "../person-links";
import { h, useControlled } from "./internal";

export type { LinkStrength, LinkTone, LinkedPerson } from "../person-links";
export { defaultLinkStrengthLabels } from "../person-links";

const RawPersonLinks = createComponent({
  tagName: "tc-person-links",
  elementClass: TcPersonLinks,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<PersonLinksSelectedChange>>,
    onTcAction: "tc-action" as EventName<CustomEvent<PersonLinksAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPersonLinks>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "onTcAction" | "children";
export type PersonLinksProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The selected person's id – controlled when given (null for none) */
  selected?: string | null;
  /** The person selected on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A row was selected or cleared; `person` is the selected person */
  onSelectedChange?: (selected: string | null, person?: LinkedPerson) => void;
  /** The header's network action was used (shown when `networkLabel` is set) */
  onNetwork?: () => void;
};

export function PersonLinks({ title, selected, defaultSelected = null, onSelectedChange, onNetwork, ...props }: PersonLinksProps) {
  const person = React.useRef<LinkedPerson | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, person.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  return h(RawPersonLinks, {
    ...props,
    heading: title ?? "Linked people",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<PersonLinksSelectedChange>) => {
      person.current = e.detail.person;
      s.handler(e.detail.selected, e);
    },
    onTcAction: () => onNetwork?.(),
  });
}

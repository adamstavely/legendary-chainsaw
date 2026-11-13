import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTopSpenders, type Spender, type SpenderFilter, type TopSpenderOpen, type TopSpendersKindChange } from "../top-spenders";
import { h, useControlled } from "./internal";

export type { Spender, SpenderFilter, SpenderKind, TopSpenderOpen, TopSpendersKindChange } from "../top-spenders";

const RawTopSpenders = createComponent({
  tagName: "tc-top-spenders",
  elementClass: TcTopSpenders,
  react: React,
  events: {
    onTcKindChange: "tc-kind-change" as EventName<CustomEvent<TopSpendersKindChange>>,
    onTcSpenderOpen: "tc-spender-open" as EventName<CustomEvent<TopSpenderOpen>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTopSpenders>;
type Owned = "heading" | "kind" | "onTcKindChange" | "onTcSpenderOpen" | "children";
export type TopSpendersProps = Omit<RawProps, Owned> & {
  /** The heading, and the list's name */
  title?: string;
  /** The kind filter – controlled when given */
  kind?: SpenderFilter;
  /** The kind filter on mount, when `kind` isn't controlled */
  defaultKind?: SpenderFilter;
  /** The kind filter was changed */
  onKindChange?: (kind: SpenderFilter) => void;
  /** A row was opened */
  onSpenderOpen?: (id: string, spender: Spender) => void;
};

export function TopSpenders({ title, kind, defaultKind = "all", onKindChange, onSpenderOpen, ...props }: TopSpendersProps) {
  const k = useControlled<SpenderFilter>(kind, defaultKind, onKindChange);
  return h(RawTopSpenders, {
    ...props,
    heading: title ?? "Top spenders",
    kind: k.value,
    onTcKindChange: (e: CustomEvent<TopSpendersKindChange>) => k.handler(e.detail.kind, e),
    onTcSpenderOpen: (e: CustomEvent<TopSpenderOpen>) => onSpenderOpen?.(e.detail.id, e.detail.spender),
  });
}

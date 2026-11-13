import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSpendLimits, type SpendDefaultLimit, type SpendDefaultLimitChange, type SpendLimit, type SpendLimitsChange } from "../spend-limits";
import { h, useControlled } from "./internal";

export type { SpendDefaultLimit, SpendLimit, SpendLimitAction, SpendLimitKind, SpendLimitPeriod, SpendLimitTarget, SpendLimitsChange } from "../spend-limits";

const RawSpendLimits = createComponent({
  tagName: "tc-spend-limits",
  elementClass: TcSpendLimits,
  react: React,
  events: {
    onTcLimitsChange: "tc-limits-change" as EventName<CustomEvent<SpendLimitsChange>>,
    onTcDefaultLimitChange: "tc-default-limit-change" as EventName<CustomEvent<SpendDefaultLimitChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSpendLimits>;
type Owned = "heading" | "limits" | "defaultLimit" | "onTcLimitsChange" | "onTcDefaultLimitChange" | "children";
export type SpendLimitsProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The limits – controlled when given */
  limits?: SpendLimit[];
  /** The limits on mount when `limits` isn't controlled */
  defaultLimits?: SpendLimit[];
  /** A limit was edited, added or removed, or its action changed */
  onLimitsChange?: (limits: SpendLimit[], change: SpendLimitsChange["change"], id: string) => void;
  /** The workspace default – controlled when given (null for none) */
  workspaceDefault?: SpendDefaultLimit | null;
  /** The workspace default on mount when `workspaceDefault` isn't controlled */
  defaultWorkspaceDefault?: SpendDefaultLimit | null;
  /** The workspace default was edited */
  onWorkspaceDefaultChange?: (defaultLimit: SpendDefaultLimit) => void;
};

const NONE: SpendLimit[] = [];

export function SpendLimits({
  title,
  limits,
  defaultLimits = NONE,
  onLimitsChange,
  workspaceDefault,
  defaultWorkspaceDefault = null,
  onWorkspaceDefaultChange,
  ...props
}: SpendLimitsProps) {
  const last = React.useRef<SpendLimitsChange | null>(null);
  const l = useControlled<SpendLimit[]>(limits, defaultLimits, onLimitsChange ? (next) => onLimitsChange(next, last.current!.change, last.current!.id) : undefined);
  const w = useControlled<SpendDefaultLimit | null>(workspaceDefault, defaultWorkspaceDefault, onWorkspaceDefaultChange ? (next) => next && onWorkspaceDefaultChange(next) : undefined);
  return h(RawSpendLimits, {
    ...props,
    heading: title ?? "Spend limits",
    limits: l.value,
    defaultLimit: w.value,
    onTcLimitsChange: (e: CustomEvent<SpendLimitsChange>) => {
      last.current = e.detail;
      l.handler(e.detail.limits, e);
    },
    onTcDefaultLimitChange: (e: CustomEvent<SpendDefaultLimitChange>) => w.handler(e.detail.defaultLimit, e),
  });
}

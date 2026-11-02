import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEnvironmentList, type EnvironmentAction, type EnvironmentTogglesChange } from "../environment-list";
import { h, useControlled } from "./internal";

export type { EnvironmentAction, EnvironmentItem, EnvironmentKind, EnvironmentTogglesChange } from "../environment-list";

const RawEnvironmentList = createComponent({
  tagName: "tc-environment-list",
  elementClass: TcEnvironmentList,
  react: React,
  events: {
    onTcAction: "tc-action" as EventName<CustomEvent<EnvironmentAction>>,
    onTcTogglesChange: "tc-toggles-change" as EventName<CustomEvent<EnvironmentTogglesChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawEnvironmentList>;
type Owned = "heading" | "toggles" | "onTcTogglesChange" | "children";
export type EnvironmentListProps = Omit<RawProps, Owned> & {
  /** The heading; by default none */
  title?: string;
  /** The switches' values by row id – controlled when given */
  toggles?: Record<string, boolean>;
  /** On mount, when `toggles` isn't controlled */
  defaultToggles?: Record<string, boolean>;
  /** A row's switch was changed */
  onTogglesChange?: (toggles: Record<string, boolean>) => void;
};

const NONE: Record<string, boolean> = {};

export function EnvironmentList({ title, toggles, defaultToggles = NONE, onTogglesChange, ...props }: EnvironmentListProps) {
  const t = useControlled<Record<string, boolean>>(toggles, defaultToggles, onTogglesChange);
  return h(RawEnvironmentList, {
    ...props,
    heading: title ?? "",
    toggles: t.value,
    onTcTogglesChange: (e: CustomEvent<EnvironmentTogglesChange>) => t.handler(e.detail.toggles, e),
  });
}

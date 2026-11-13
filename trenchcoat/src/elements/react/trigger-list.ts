import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTriggerList, type AgentTrigger, type TriggerEnabledChange, type TriggerKind, type TriggerListAdd, type TriggerListEdit } from "../trigger-list";
import { h, useControlled } from "./internal";

export type { AgentTrigger, TriggerEnabledChange, TriggerKind, TriggerListAdd, TriggerListEdit, TriggerListLabels } from "../trigger-list";
export { defaultTriggerListLabels, triggerAgo } from "../trigger-list";

const RawTriggerList = createComponent({
  tagName: "tc-trigger-list",
  elementClass: TcTriggerList,
  react: React,
  events: {
    onTcEnabledChange: "tc-enabled-change" as EventName<CustomEvent<TriggerEnabledChange>>,
    onTcEdit: "tc-edit" as EventName<CustomEvent<TriggerListEdit>>,
    onTcAdd: "tc-add" as EventName<CustomEvent<TriggerListAdd>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTriggerList>;
type Owned = "heading" | "triggers" | "onTcEnabledChange" | "onTcEdit" | "onTcAdd" | "children";
export type TriggerListProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Triggers" */
  title?: string;
  /** The triggers – controlled when given */
  triggers?: AgentTrigger[];
  /** The triggers on mount when `triggers` isn't controlled */
  defaultTriggers?: AgentTrigger[];
  /** A switch was flipped – the whole list after it, and which one */
  onTriggersChange?: (triggers: AgentTrigger[], detail: TriggerEnabledChange) => void;
  /** Edit was pressed */
  onEdit?: (id: string, trigger: AgentTrigger) => void;
  /** A kind was picked from Add trigger */
  onAdd?: (kind: TriggerKind) => void;
};

const NONE: AgentTrigger[] = [];

export function TriggerList({ title, triggers, defaultTriggers = NONE, onTriggersChange, onEdit, onAdd, ...props }: TriggerListProps) {
  const t = useControlled<AgentTrigger[]>(triggers, defaultTriggers, undefined);
  return h(RawTriggerList, {
    ...props,
    heading: title ?? "",
    triggers: t.value,
    onTcEnabledChange: (e: CustomEvent<TriggerEnabledChange>) => {
      t.handler(e.detail.triggers, e);
      onTriggersChange?.(e.detail.triggers, e.detail);
    },
    onTcEdit: (e: CustomEvent<TriggerListEdit>) => onEdit?.(e.detail.id, e.detail.trigger),
    onTcAdd: (e: CustomEvent<TriggerListAdd>) => onAdd?.(e.detail.kind),
  });
}

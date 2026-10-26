import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcMemoryPanel, type Memory } from "../memory-panel";
import { h, useControlled } from "./internal";

export type { Memory } from "../memory-panel";

const RawMemoryPanel = createComponent({
  tagName: "tc-memory-panel",
  elementClass: TcMemoryPanel,
  react: React,
  events: {
    onTcMemoriesChange: "tc-memories-change" as EventName<CustomEvent<{ memories: Memory[] }>>,
    onTcEnabledChange: "tc-enabled-change" as EventName<CustomEvent<{ enabled: boolean }>>,
    onTcAction: "tc-action" as EventName<CustomEvent<null>>,
  },
});
type RawMemoryPanelProps = React.ComponentProps<typeof RawMemoryPanel>;
export type MemoryPanelProps = Omit<
  RawMemoryPanelProps,
  "memories" | "enabled" | "heading" | "actionLabel" | "onChange" | "onTcMemoriesChange" | "onTcEnabledChange" | "onTcAction"
> & {
  /**
   * The memories (controlled): the panel shows exactly these and asks for changes through onChange. Leave it
   * undefined to let the panel keep the list, starting at `defaultMemories`
   */
  memories?: Memory[];
  /** The memories to start with when uncontrolled */
  defaultMemories?: Memory[];
  /** Called with the full list after any change – in both modes */
  onChange?: (memories: Memory[]) => void;
  /** The master switch – controlled when defined */
  enabled?: boolean;
  defaultEnabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  title?: string;
  /** A button on the tray, e.g. { label: "Manage", onClick } – Undo takes its place for a moment */
  action?: { label: string; onClick: () => void };
};

const NO_MEMORIES: Memory[] = [];

export function MemoryPanel({ memories, defaultMemories = NO_MEMORIES, onChange, enabled, defaultEnabled = true, onEnabledChange, title = "Memory", action, ...props }: MemoryPanelProps) {
  const m = useControlled(memories, defaultMemories, onChange);
  const e = useControlled(enabled, defaultEnabled, onEnabledChange);
  return h(RawMemoryPanel, {
    ...props,
    heading: title,
    memories: m.value,
    enabled: e.value,
    actionLabel: action?.label ?? "",
    onTcMemoriesChange: (ev: CustomEvent<{ memories: Memory[] }>) => m.handler(ev.detail.memories, ev),
    onTcEnabledChange: (ev: CustomEvent<{ enabled: boolean }>) => e.handler(ev.detail.enabled, ev),
    onTcAction: () => action?.onClick(),
  });
}

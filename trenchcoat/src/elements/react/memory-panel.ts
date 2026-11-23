import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcMemoryPanel, type Memory, type MemoryConsent } from "../memory-panel";
import { h, useControlled } from "./internal";

export type { AssistantTone, Memory, MemoryConsent } from "../memory-panel";
export { defaultTones } from "../memory-panel";

const RawMemoryPanel = createComponent({
  tagName: "tc-memory-panel",
  elementClass: TcMemoryPanel,
  react: React,
  events: {
    onTcMemoriesChange: "tc-memories-change" as EventName<CustomEvent<{ memories: Memory[] }>>,
    onTcEnabledChange: "tc-enabled-change" as EventName<CustomEvent<{ enabled: boolean }>>,
    onTcAction: "tc-action" as EventName<CustomEvent<null>>,
    onTcConsent: "tc-consent" as EventName<CustomEvent<MemoryConsent>>,
    onTcToneChange: "tc-tone-change" as EventName<CustomEvent<{ tone: string }>>,
    onTcInstructionsChange: "tc-instructions-change" as EventName<CustomEvent<{ instructions: string }>>,
  },
});
type RawMemoryPanelProps = React.ComponentProps<typeof RawMemoryPanel>;
export type MemoryPanelProps = Omit<
  RawMemoryPanelProps,
  "memories" | "enabled" | "heading" | "actionLabel" | "onChange" | "onTcMemoriesChange" | "onTcEnabledChange" | "onTcAction" | "tone" | "instructions" | "onTcToneChange" | "onTcInstructionsChange"
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
  /** The master switch to start with when uncontrolled */
  defaultEnabled?: boolean;
  /** Called when the master switch is flipped – in both modes */
  onEnabledChange?: (enabled: boolean) => void;
  /** The heading, and the group's name */
  title?: string;
  /** A button on the tray, e.g. { label: "Manage", onClick } – Undo takes its place for a moment */
  action?: { label: string; onClick: () => void };
  /** The assistant's tone, an id from `tones` – controlled when defined */
  tone?: string;
  /** The tone to start with when uncontrolled */
  defaultTone?: string;
  /** Called with the tone picked in Personality – in both modes */
  onToneChange?: (tone: string) => void;
  /** How the person wants to be answered, in their own words – controlled when defined */
  instructions?: string;
  /** The instructions to start with when uncontrolled */
  defaultInstructions?: string;
  /** Called as the instructions are typed – in both modes */
  onInstructionsChange?: (instructions: string) => void;
};

const NO_MEMORIES: Memory[] = [];

export function MemoryPanel({
  memories,
  defaultMemories = NO_MEMORIES,
  onChange,
  enabled,
  defaultEnabled = true,
  onEnabledChange,
  title = "Memory",
  action,
  tone,
  defaultTone = "default",
  onToneChange,
  instructions,
  defaultInstructions = "",
  onInstructionsChange,
  ...props
}: MemoryPanelProps) {
  const m = useControlled(memories, defaultMemories, onChange);
  const e = useControlled(enabled, defaultEnabled, onEnabledChange);
  const t = useControlled(tone, defaultTone, onToneChange);
  const i = useControlled(instructions, defaultInstructions, onInstructionsChange);
  return h(RawMemoryPanel, {
    ...props,
    heading: title,
    memories: m.value,
    enabled: e.value,
    tone: t.value,
    instructions: i.value,
    actionLabel: action?.label ?? "",
    onTcMemoriesChange: (ev: CustomEvent<{ memories: Memory[] }>) => m.handler(ev.detail.memories, ev),
    onTcEnabledChange: (ev: CustomEvent<{ enabled: boolean }>) => e.handler(ev.detail.enabled, ev),
    onTcAction: () => action?.onClick(),
    onTcToneChange: (ev: CustomEvent<{ tone: string }>) => t.handler(ev.detail.tone, ev),
    onTcInstructionsChange: (ev: CustomEvent<{ instructions: string }>) => i.handler(ev.detail.instructions, ev),
  });
}

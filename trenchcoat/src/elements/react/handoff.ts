import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcHandoff, type HandoffAgent, type HandoffCheckedChange, type HandoffNoteChange, type HandoffReturn, type HandoffStatus, type HandoffStatusChange } from "../handoff";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { HandoffItem, HandoffReturn, HandoffStatus } from "../handoff";

const RawHandoff = createComponent({
  tagName: "tc-handoff",
  elementClass: TcHandoff,
  react: React,
  events: {
    onTcStatusChange: "tc-status-change" as EventName<CustomEvent<HandoffStatusChange>>,
    onTcCheckedChange: "tc-checked-change" as EventName<CustomEvent<HandoffCheckedChange>>,
    onTcNoteChange: "tc-note-change" as EventName<CustomEvent<HandoffNoteChange>>,
    onTcReturn: "tc-return" as EventName<CustomEvent<HandoffReturn>>,
  },
});
type RawProps = React.ComponentProps<typeof RawHandoff>;
type Owned = "agent" | "status" | "checked" | "defaultChecked" | "note" | "onTcStatusChange" | "onTcCheckedChange" | "onTcNoteChange" | "onTcReturn" | "children";
export type HandoffProps = Omit<RawProps, Owned> & {
  /** Who hands over: { name, model?, avatar? } */
  agent: { name: string; model?: string; avatar?: React.ReactNode };
  /** Who has control – controlled when given */
  status?: HandoffStatus;
  /** Who has control at first, when `status` isn't set – "waiting" by default */
  defaultStatus?: HandoffStatus;
  /** Take over, Hand back, Take over again */
  onStatusChange?: (status: HandoffStatus) => void;
  /** Ids of the needs ticked off – controlled when given */
  checked?: string[];
  /** The needs ticked off at first, when `checked` isn't set */
  defaultChecked?: string[];
  /** Called with the ids of the ticked needs, in the needs' order, whenever one is ticked or unticked */
  onCheckedChange?: (checked: string[]) => void;
  /** The note for the agent – controlled when given */
  note?: string;
  /** The note at first, when `note` isn't set */
  defaultNote?: string;
  /** Called with the note as it is typed */
  onNoteChange?: (note: string) => void;
  /** Handed back: what was done, what's still open and the note – the agent should listen to this */
  onReturn?: (result: HandoffReturn) => void;
};
const NONE: string[] = [];

export function Handoff({
  agent,
  status,
  defaultStatus = "waiting",
  onStatusChange,
  checked,
  defaultChecked = NONE,
  onCheckedChange,
  note,
  defaultNote = "",
  onNoteChange,
  onReturn,
  ...props
}: HandoffProps) {
  const { stage, els } = useStaged(isNode(agent.avatar) ? [["avatar", agent.avatar]] : []);
  const who = React.useMemo<HandoffAgent>(() => ({ ...agent, avatar: isNode(agent.avatar) ? els.avatar : (agent.avatar as Element | undefined) }), [agent, els]);
  const s = useControlled(status, defaultStatus, onStatusChange);
  const c = useControlled(checked, defaultChecked, onCheckedChange);
  const n = useControlled(note, defaultNote, onNoteChange);
  return h(
    React.Fragment,
    null,
    stage,
    h(RawHandoff, {
      ...props,
      agent: who,
      status: s.value,
      checked: c.value,
      note: n.value,
      onTcStatusChange: (e: CustomEvent<HandoffStatusChange>) => s.handler(e.detail.status, e),
      onTcCheckedChange: (e: CustomEvent<HandoffCheckedChange>) => c.handler(e.detail.checked, e),
      onTcNoteChange: (e: CustomEvent<HandoffNoteChange>) => n.handler(e.detail.note, e),
      onTcReturn: (e: CustomEvent<HandoffReturn>) => onReturn?.(e.detail),
    }),
  );
}

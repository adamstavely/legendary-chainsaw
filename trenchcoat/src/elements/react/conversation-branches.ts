import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcConversationBranches, type BranchEditDetail, type BranchMessage, type BranchMessagesChange, type BranchSelectedChange, type BranchSelection } from "../conversation-branches";
import { h, useControlled } from "./internal";

export type { BranchEditDetail, BranchMessage, BranchRole, BranchSelection } from "../conversation-branches";

const NO_MESSAGES: BranchMessage[] = [];
const NO_SELECTION: BranchSelection = {};

const RawConversationBranches = createComponent({
  tagName: "tc-conversation-branches",
  elementClass: TcConversationBranches,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<BranchSelectedChange>>,
    onTcMessagesChange: "tc-messages-change" as EventName<CustomEvent<BranchMessagesChange>>,
    onTcEdit: "tc-edit" as EventName<CustomEvent<BranchEditDetail>>,
  },
});
type RawProps = React.ComponentProps<typeof RawConversationBranches>;

/** What an edit hands to `onEdit` */
export type ConversationEdit = Omit<BranchEditDetail, "respondWith">;

export type ConversationBranchesProps = Omit<RawProps, "messages" | "selected" | "onTcSelectedChange" | "onTcMessagesChange" | "onTcEdit" | "onChange"> & {
  /** Every message of every branch. Controlled when defined; otherwise the element keeps them, starting at `defaultMessages` */
  messages?: BranchMessage[];
  /** The messages at first when uncontrolled */
  defaultMessages?: BranchMessage[];
  /** Called with the whole list when messages are added (a new branch, its replies) */
  onMessagesChange?: (messages: BranchMessage[]) => void;
  /** The picked child per parent id ("" for the first messages). Controlled when defined */
  selected?: BranchSelection;
  /** The picked branches at first when uncontrolled – unset shows the newest child at every fork */
  defaultSelected?: BranchSelection;
  /** Called when a branch is picked, or a new branch was made */
  onSelectedChange?: (selected: BranchSelection, change: { messageId: string; index: number; count: number }) => void;
  /**
   * Called when an edited message is sent. Return the new branch's replies (or a promise of them) to answer it;
   * return false to drop the edit
   */
  onEdit?: (edit: ConversationEdit) => BranchMessage[] | Promise<BranchMessage[]> | void | false;
};

/** A conversation that forks when a past message is edited, with a "‹ 2 / 3 ›" switcher on each fork */
export function ConversationBranches({ messages, defaultMessages = NO_MESSAGES, onMessagesChange, selected, defaultSelected = NO_SELECTION, onSelectedChange, onEdit, ...props }: ConversationBranchesProps) {
  const list = useControlled(messages, defaultMessages, onMessagesChange);
  const pick = useControlled(selected, defaultSelected, undefined);
  return h(RawConversationBranches, {
    ...props,
    messages: list.value,
    selected: pick.value,
    onTcMessagesChange: (e: CustomEvent<BranchMessagesChange>) => list.handler(e.detail.messages, e),
    onTcSelectedChange: (e: CustomEvent<BranchSelectedChange>) => {
      const { selected: next, messageId, index, count } = e.detail;
      pick.handler(next, e);
      onSelectedChange?.(next, { messageId, index, count });
    },
    onTcEdit: (e: CustomEvent<BranchEditDetail>) => {
      if (!onEdit) return;
      const { respondWith, ...edit } = e.detail;
      const answer = onEdit(edit);
      if (answer === false) e.preventDefault();
      else if (answer) respondWith(answer);
    },
  });
}

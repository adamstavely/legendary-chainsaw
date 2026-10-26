import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcMentionPicker,
  type MentionPickerGroup,
  type MentionPickerItem,
  type MentionPickerOpenChange,
  type MentionPickerPick,
  type MentionPickerQueryChange,
  type MentionPickerTrigger,
} from "../mention-picker";
import { h, isNode, useStaged } from "./internal";

export type { MentionPickerPick, MentionPickerRenderChip, MentionPickerSearch } from "../mention-picker";

/** React nodes (or elements) for icons */
export type MentionItem = Omit<MentionPickerItem, "icon"> & { icon?: React.ReactNode | Element };
export type MentionGroup = { id: string; label: string; items: MentionItem[] };
export type MentionTrigger = Omit<MentionPickerTrigger, "groups"> & { groups: MentionGroup[] };

const RawMentionPicker = createComponent({
  tagName: "tc-mention-picker",
  elementClass: TcMentionPicker,
  react: React,
  events: {
    onTcPick: "tc-pick" as EventName<CustomEvent<MentionPickerPick>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<MentionPickerOpenChange>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<MentionPickerQueryChange>>,
  },
});
type RawMentionPickerProps = React.ComponentProps<typeof RawMentionPicker>;
export type MentionPickerOwnProps = {
  /** The field to attach to: an element or a ref to one (a <textarea>, an <input> or a contenteditable element) */
  target?: HTMLElement | React.RefObject<HTMLElement | null> | null;
  /** …or its id */
  htmlFor?: string;
  /** The trigger characters and what each one offers – icons may be React nodes */
  triggers: MentionTrigger[];
  /**
   * Called with the pick. The picker then puts a token (textarea, input) or a chip (contenteditable) in place of the
   * typed query – call `event.preventDefault()` to insert it yourself instead
   */
  onPick?: (pick: MentionPickerPick, event: Event) => void;
  /** Called when the list opens or closes, with the trigger character it opened for (null when closed) */
  onOpenChange?: (open: boolean, trigger: string | null) => void;
  /** Called when the text typed after the trigger changes while the list is open */
  onQueryChange?: (query: string, trigger: string) => void;
};
export type MentionPickerProps = Omit<RawMentionPickerProps, keyof MentionPickerOwnProps | "onTcPick" | "onTcOpenChange" | "onTcQueryChange"> & MentionPickerOwnProps;

const isRef = (t: unknown): t is React.RefObject<HTMLElement | null> => !!t && typeof t === "object" && "current" in t && !(t instanceof Element);

export function MentionPicker({ target, triggers, onPick, onOpenChange, onQueryChange, ...props }: MentionPickerProps) {
  const nodes: [string, React.ReactNode][] = [];
  for (const t of triggers) for (const g of t.groups) for (const it of g.items) if (isNode(it.icon)) nodes.push([`${t.char}:${g.id}:${it.id}`, it.icon as React.ReactNode]);
  const { stage, els } = useStaged(nodes);
  const list = React.useMemo(
    () =>
      triggers.map((t) => ({
        ...t,
        groups: t.groups.map((g) => ({ ...g, items: g.items.map((it) => ({ ...it, icon: isNode(it.icon) ? els[`${t.char}:${g.id}:${it.id}`] : (it.icon as Element | undefined) })) })) as MentionPickerGroup[],
      })) as MentionPickerTrigger[],
    [triggers, els],
  );
  // A ref is filled after the commit: read it then (and after every render, in case it points elsewhere)
  const [field, setField] = React.useState<HTMLElement | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- no deps on purpose: a ref's target changes without a prop changing; it only sets state when it differs
  React.useLayoutEffect(() => {
    const next = isRef(target) ? target.current : (target ?? null);
    if (next !== field) setField(next);
  });
  return h(React.Fragment, null, stage, h(RawMentionPicker, {
    ...props,
    target: field,
    triggers: list,
    onTcPick: (e: CustomEvent<MentionPickerPick>) => onPick?.(e.detail, e),
    onTcOpenChange: (e: CustomEvent<MentionPickerOpenChange>) => onOpenChange?.(e.detail.open, e.detail.trigger),
    onTcQueryChange: (e: CustomEvent<MentionPickerQueryChange>) => onQueryChange?.(e.detail.query, e.detail.trigger),
  }));
}

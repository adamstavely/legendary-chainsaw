import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcPromptStarters,
  type PromptStarter as ElementStarter,
  type PromptStarterGroup as ElementGroup,
  type PromptStarterIconName,
  type PromptStarterPick,
} from "../prompt-starters";
import { h, isNode, useStaged } from "./internal";

export type { PromptStarterIconName, PromptStarterMode, PromptStarterPick, PromptStarterTone } from "../prompt-starters";

/** A suggestion – its icon may be a built-in icon's name or a React node */
export type PromptStarter = Omit<ElementStarter, "icon"> & { icon?: PromptStarterIconName | React.ReactNode };
/** A group of suggestions – its icon may be a built-in icon's name or a React node */
export type PromptStarterGroup = Omit<ElementGroup, "icon" | "items"> & { icon?: PromptStarterIconName | React.ReactNode; items: PromptStarter[] };

const RawPromptStarters = createComponent({
  tagName: "tc-prompt-starters",
  elementClass: TcPromptStarters,
  react: React,
  events: {
    onTcSend: "tc-send" as EventName<CustomEvent<PromptStarterPick>>,
    onTcFill: "tc-fill" as EventName<CustomEvent<PromptStarterPick>>,
  },
});
type RawPromptStartersProps = React.ComponentProps<typeof RawPromptStarters>;
export type PromptStartersProps = Omit<RawPromptStartersProps, "heading" | "groups" | "items" | "onTcSend" | "onTcFill"> & {
  /** The heading above the list, and the list's accessible name */
  title?: string;
  /** Suggestions in groups, each with a heading and an icon */
  groups?: PromptStarterGroup[];
  /** Suggestions without groups – shown after any groups */
  items?: PromptStarter[];
  /** Called with the text when a suggestion is chosen to send as it is */
  onSend?: (text: string, item: PromptStarter) => void;
  /** Called with the text when a suggestion is chosen to fill the composer – put it there and focus it */
  onFill?: (text: string, item: PromptStarter) => void;
};

const NO_GROUPS: PromptStarterGroup[] = [];
const NO_ITEMS: PromptStarter[] = [];

export function PromptStarters({ title = "Suggestions", groups = NO_GROUPS, items = NO_ITEMS, onSend, onFill, ...props }: PromptStartersProps) {
  const nodes: [string, React.ReactNode][] = [];
  for (const g of groups) {
    if (isNode(g.icon)) nodes.push([`g:${g.id}`, g.icon]);
    for (const it of g.items) if (isNode(it.icon)) nodes.push([`i:${g.id}:${it.id}`, it.icon]);
  }
  for (const it of items) if (isNode(it.icon)) nodes.push([`i::${it.id}`, it.icon]);
  const { stage, els } = useStaged(nodes);
  const icon = (v: PromptStarterIconName | React.ReactNode, key: string) => (isNode(v) ? els[key] : (v as PromptStarterIconName | undefined));
  const originals = React.useRef(new Map<ElementStarter, PromptStarter>());
  const mapped = React.useMemo(() => {
    originals.current = new Map();
    const item = (it: PromptStarter, key: string): ElementStarter => {
      const out = { ...it, icon: icon(it.icon, key) } as ElementStarter;
      originals.current.set(out, it);
      return out;
    };
    return {
      groups: groups.map((g): ElementGroup => ({ ...g, icon: icon(g.icon, `g:${g.id}`), items: g.items.map((it) => item(it, `i:${g.id}:${it.id}`)) })),
      items: items.map((it) => item(it, `i::${it.id}`)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- icon reads els, which is listed
  }, [groups, items, els]);
  const back = (e: CustomEvent<PromptStarterPick>) => originals.current.get(e.detail.item) ?? (e.detail.item as PromptStarter);
  return h(React.Fragment, null, stage, h(RawPromptStarters, {
    ...props,
    heading: title,
    groups: mapped.groups,
    items: mapped.items,
    onTcSend: (e: CustomEvent<PromptStarterPick>) => onSend?.(e.detail.text, back(e)),
    onTcFill: (e: CustomEvent<PromptStarterPick>) => onFill?.(e.detail.text, back(e)),
  }));
}

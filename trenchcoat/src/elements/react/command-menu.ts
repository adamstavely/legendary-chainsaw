import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCommandMenu, defaultCommandGroups, type CommandMenuCommand, type CommandMenuGroup, type CommandMenuRun } from "../command-menu";
import { h, isNode, useControlled, useStaged } from "./internal";

/** React nodes (or elements) for the logo and icon */
export type Command = Omit<CommandMenuCommand, "icon" | "logo"> & { icon?: React.ReactNode | Element; logo?: React.ReactNode | Element };
export type CommandGroup = { id: string; label: string; commands: Command[] };
/** Sample commands – replace with your own */
export const defaultGroups: CommandGroup[] = defaultCommandGroups;

const RawCommandMenu = createComponent({
  tagName: "tc-command-menu",
  elementClass: TcCommandMenu,
  react: React,
  events: {
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<{ query: string }>>,
    onTcClose: "tc-close" as EventName<CustomEvent<null>>,
  },
});
type RawCommandMenuProps = React.ComponentProps<typeof RawCommandMenu>;
export type CommandMenuOwnProps = {
  /** The commands, in titled groups; a group with the id "suggestions" gets ⌘1–⌘5. Defaults to the sample `defaultGroups` */
  groups?: CommandGroup[];
  /** Placeholder text in the search field */
  placeholder?: string;
  /** Called with the command id; for the assistant fallback with "ask" and the typed text. May return a promise */
  onRun?: CommandMenuRun;
  /** The search text. Controlled when defined; otherwise the menu keeps its own, starting at `defaultQuery` */
  query?: string;
  /** The search text to start with when `query` isn't set */
  defaultQuery?: string;
  /** Called with the new search text as people type or clear it */
  onQueryChange?: (query: string) => void;
  /** Window shortcut that focuses the field – "mod+k" by default, or false for none */
  hotkey?: string | false;
  /** Runs on Esc in an empty search */
  onClose?: () => void;
  /** Focus the field when the menu appears */
  autoFocus?: boolean;
  /** Most rows rendered at once (default 200) */
  maxRows?: number;
};
export type CommandMenuProps = Omit<RawCommandMenuProps, keyof CommandMenuOwnProps | "onTcQueryChange" | "onTcClose"> & CommandMenuOwnProps;

export function CommandMenu({ groups = defaultGroups, query, defaultQuery = "", onQueryChange, onClose, ...props }: CommandMenuProps) {
  const nodes: [string, React.ReactNode][] = [];
  for (const g of groups)
    for (const c of g.commands) {
      if (isNode(c.logo)) nodes.push([`${g.id}:${c.id}:logo`, c.logo as React.ReactNode]);
      if (isNode(c.icon)) nodes.push([`${g.id}:${c.id}:icon`, c.icon as React.ReactNode]);
    }
  const { stage, els } = useStaged(nodes);
  const list = React.useMemo(
    () =>
      groups.map((g) => ({
        ...g,
        commands: g.commands.map((c) => ({
          ...c,
          logo: isNode(c.logo) ? els[`${g.id}:${c.id}:logo`] : (c.logo as Element | undefined),
          icon: isNode(c.icon) ? els[`${g.id}:${c.id}:icon`] : (c.icon as Element | undefined),
        })),
      })) as CommandMenuGroup[],
    [groups, els],
  );
  const q = useControlled(query, defaultQuery, onQueryChange);
  return h(React.Fragment, null, stage, h(RawCommandMenu, {
    ...props,
    groups: list,
    query: q.value,
    onTcQueryChange: (e: CustomEvent<{ query: string }>) => q.handler(e.detail.query, e),
    onTcClose: () => onClose?.(),
  }));
}

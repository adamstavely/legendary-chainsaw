import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcProfileHeader, type ProfileActionEvent, type ProfileSelectedChange } from "../profile-header";
import { h, useControlled } from "./internal";

export type { ProfileAction, ProfileIconName, ProfileMeta, ProfilePill, ProfileTab, ProfileTone } from "../profile-header";

const RawProfileHeader = createComponent({
  tagName: "tc-profile-header",
  elementClass: TcProfileHeader,
  react: React,
  events: {
    onTcAction: "tc-action" as EventName<CustomEvent<ProfileActionEvent>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<ProfileSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawProfileHeader>;
type Owned = "selected" | "onTcAction" | "onTcSelectedChange" | "children";
export type ProfileHeaderProps = Omit<RawProps, Owned> & {
  /** The selected tab's id – controlled when given */
  selected?: string;
  /** The tab selected on mount when `selected` isn't controlled; the first tab when unset */
  defaultSelected?: string;
  /** A tab was chosen */
  onSelectedChange?: (selected: string) => void;
  /** An action button, or the overflow button ("more"), was used */
  onAction?: (id: string) => void;
};

export function ProfileHeader({ selected, defaultSelected, onSelectedChange, onAction, ...props }: ProfileHeaderProps) {
  const s = useControlled<string | undefined>(selected, defaultSelected, onSelectedChange as ((next: string | undefined) => void) | undefined);
  return h(RawProfileHeader, {
    ...props,
    selected: s.value,
    onTcAction: (e: CustomEvent<ProfileActionEvent>) => onAction?.(e.detail.id),
    onTcSelectedChange: (e: CustomEvent<ProfileSelectedChange>) => s.handler(e.detail.selected, e),
  });
}

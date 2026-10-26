import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcProfileMenu, type ProfileMenuItem as ElementItem, type ProfileSetup } from "../profile-menu";
import { h, isNode, useStaged } from "./internal";

export type { ProfileSetup } from "../profile-menu";

/** An action; its icon may be a React node */
export type ProfileMenuItem = Omit<ElementItem, "icon"> & { icon?: React.ReactNode };

const RawProfileMenu = createComponent({
  tagName: "tc-profile-menu",
  elementClass: TcProfileMenu,
  react: React,
  events: {
    onTcItemSelect: "tc-item-select" as EventName<CustomEvent<{ id: string }>>,
    onTcSetupContinue: "tc-setup-continue" as EventName<CustomEvent<{ next: string }>>,
  },
});
type RawProfileMenuProps = React.ComponentProps<typeof RawProfileMenu>;
export type ProfileMenuProps = Omit<RawProfileMenuProps, "avatar" | "items" | "setup" | "name" | "email"> & {
  name: string;
  email: string;
  /** Replaces the default avatar */
  avatar?: React.ReactNode;
  items?: ProfileMenuItem[];
  /** Profile setup progress under the actions – leave empty to hide */
  setup?: ProfileSetup;
};
export function ProfileMenu({ avatar, items, ...props }: ProfileMenuProps) {
  const nodes: [string, React.ReactNode][] = [];
  if (isNode(avatar)) nodes.push(["avatar", avatar]);
  items?.forEach((it) => isNode(it.icon) && nodes.push([`item:${it.id}`, it.icon]));
  const { stage, els } = useStaged(nodes);
  const elItems = React.useMemo(
    () => items?.map((it) => ({ ...it, icon: isNode(it.icon) ? els[`item:${it.id}`] : (it.icon as Element | undefined) })) as ElementItem[] | undefined,
    [items, els],
  );
  return h(React.Fragment, null, stage, h(RawProfileMenu, { ...props, items: elItems, avatar: isNode(avatar) ? els.avatar : (avatar as Element | undefined) }));
}

/* The menu's icons, as React components – the stroke follows the menu's look through --tc-profile-menu-icon-stroke */
const Svg = ({ children }: { children: React.ReactNode }) =>
  h(
    "svg",
    { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", style: { strokeWidth: "var(--tc-profile-menu-icon-stroke, 1.5)" }, "aria-hidden": "true" },
    children,
  );
const p = (d: string) => h("path", { d });
export const SettingsIcon = () =>
  h(
    Svg,
    null,
    p(
      "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
    ),
    h("circle", { cx: "12", cy: "12", r: "3" }),
  );
export const LanguageIcon = () => h(Svg, null, p("m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"));
export const DocsIcon = () => h(Svg, null, p("M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"), p("M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8"));
export const AppsIcon = () =>
  h(
    Svg,
    null,
    h("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1.5" }),
    h("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1.5" }),
    h("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1.5" }),
    p("M17.5 3v7M14 6.5h7"),
  );
export const LogoutIcon = () => h(Svg, null, p("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"));

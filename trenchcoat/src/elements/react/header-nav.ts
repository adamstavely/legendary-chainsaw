import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcHeaderNav, type HeaderNavAccountSelect, type HeaderNavPanel, type HeaderNavPanelChange, type HeaderNavSetupContinue } from "../header-nav";
import type { ProfileMenuItem as ElementItem, ProfileSetup } from "../profile-menu";
import { AppPicker, type AppPickerProps } from "./app-picker";
import { h, isNode, useStaged } from "./internal";
import { Notifications, type NotificationsProps } from "./notifications";
import type { ProfileMenuItem } from "./profile-menu";

export { headerNavDefaultItems, headerNavInitials, headerNavTone } from "../header-nav";
export type { HeaderNavPanel, HeaderNavPresence, HeaderNavTone, HeaderNavUser } from "../header-nav";

const RawHeaderNav = createComponent({
  tagName: "tc-header-nav",
  elementClass: TcHeaderNav,
  react: React,
  events: {
    onTcPanelChange: "tc-panel-change" as EventName<CustomEvent<HeaderNavPanelChange>>,
    onTcAccountSelect: "tc-account-select" as EventName<CustomEvent<HeaderNavAccountSelect>>,
    onTcSetupContinue: "tc-setup-continue" as EventName<CustomEvent<HeaderNavSetupContinue>>,
  },
});
type RawProps = React.ComponentProps<typeof RawHeaderNav>;

export type HeaderNavOwnProps = {
  /** The bell: <Notifications> props – the app's items and handlers. Unset hides the bell */
  notifications?: Omit<NotificationsProps, "open" | "defaultOpen" | "inline">;
  /** The app picker: <AppPicker> props – the app's apps, pins and handlers. Unset hides the picker */
  apps?: Omit<AppPickerProps, "open" | "defaultOpen" | "layout">;
  /** The account card's actions; unset shows Settings, Language, Docs and Sign out. Icons may be React nodes */
  accountItems?: ProfileMenuItem[];
  /** An account action was picked (the popover closes and focus returns to the avatar) */
  onAccountSelect?: (id: string) => void;
  /** Profile setup progress in the account card – unset hides it */
  setup?: ProfileSetup;
  /** The setup's next step was picked */
  onSetupContinue?: (next: string) => void;
  /** The open popover (controlled), null for none */
  open?: HeaderNavPanel | null;
  /** The popover open at first when uncontrolled */
  defaultOpen?: HeaderNavPanel | null;
  /** A popover opened (its name) or closed (null) */
  onOpenChange?: (open: HeaderNavPanel | null) => void;
};
export type HeaderNavProps = Omit<RawProps, keyof HeaderNavOwnProps | "panel" | "onTcPanelChange" | "onTcAccountSelect" | "onTcSetupContinue" | "children"> & HeaderNavOwnProps;

export function HeaderNav({ notifications, apps, accountItems, onAccountSelect, setup, onSetupContinue, open, defaultOpen = null, onOpenChange, look, ...props }: HeaderNavProps) {
  const controlled = open !== undefined;
  const [own, setOwn] = React.useState<HeaderNavPanel | null>(defaultOpen);
  const panel = controlled ? open : own;
  // The latest value between renders: a bell closing and the picker opening can report in one tick
  const latest = React.useRef(panel);
  latest.current = panel;
  const report = React.useRef(onOpenChange);
  report.current = onOpenChange;
  const set = React.useCallback(
    (next: HeaderNavPanel | null) => {
      if (Object.is(next, latest.current)) return;
      if (!controlled) setOwn(next);
      latest.current = next;
      report.current?.(next);
    },
    [controlled],
  );
  /** One panel's open state changed: opening it closes the others; closing it leaves another that opened alone */
  const child = (kind: HeaderNavPanel) => (next: boolean) => set(next ? kind : latest.current === kind ? null : latest.current);

  const { stage, els } = useStaged((accountItems ?? []).filter((it) => isNode(it.icon)).map((it) => [it.id, it.icon]));
  const items = React.useMemo(
    () => accountItems?.map((it) => ({ ...it, icon: isNode(it.icon) ? els[it.id] : (it.icon as Element | undefined) })) as ElementItem[] | undefined,
    [accountItems, els],
  );

  return h(
    React.Fragment,
    null,
    stage,
    h(
      RawHeaderNav,
      {
        ...props,
        look,
        panel,
        accountItems: items,
        setup,
        onTcPanelChange: (e: CustomEvent<HeaderNavPanelChange>) => {
          if (controlled) e.preventDefault();
          set(e.detail.panel);
        },
        onTcAccountSelect: (e: CustomEvent<HeaderNavAccountSelect>) => onAccountSelect?.(e.detail.id),
        onTcSetupContinue: (e: CustomEvent<HeaderNavSetupContinue>) => onSetupContinue?.(e.detail.next),
      },
      notifications &&
        h(Notifications, {
          ...notifications,
          look,
          open: panel === "notifications",
          onOpenChange: (next: boolean) => {
            notifications.onOpenChange?.(next);
            child("notifications")(next);
          },
        }),
      apps &&
        h(AppPicker, {
          ...apps,
          look,
          open: panel === "apps",
          onOpenChange: (next: boolean) => {
            apps.onOpenChange?.(next);
            child("apps")(next);
          },
        }),
    ),
  );
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcNotifications, type NotificationItem, type NotificationsAction, type NotificationsDismiss, type NotificationsFilterChange, type NotificationsItemOpen, type NotificationsLoadMore, type NotificationsMarkAllRead, type NotificationsOpenChange, type NotificationsReadChange } from "../notifications";
import { h, useControlled } from "./internal";

export type { NotificationCategory, NotificationItem, NotificationItemAction, NotificationsLabels, NotificationTone } from "../notifications";

const RawNotifications = createComponent({
  tagName: "tc-notifications",
  elementClass: TcNotifications,
  react: React,
  events: {
    onTcReadChange: "tc-read-change" as EventName<CustomEvent<NotificationsReadChange>>,
    onTcMarkAllRead: "tc-mark-all-read" as EventName<CustomEvent<NotificationsMarkAllRead>>,
    onTcDismiss: "tc-dismiss" as EventName<CustomEvent<NotificationsDismiss>>,
    onTcAction: "tc-action" as EventName<CustomEvent<NotificationsAction>>,
    onTcItemOpen: "tc-item-open" as EventName<CustomEvent<NotificationsItemOpen>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<NotificationsFilterChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<NotificationsOpenChange>>,
    onTcLoadMore: "tc-load-more" as EventName<CustomEvent<NotificationsLoadMore>>,
    onTcRetry: "tc-retry" as EventName<CustomEvent<Record<string, never>>>,
    onTcSettings: "tc-settings" as EventName<CustomEvent<Record<string, never>>>,
  },
});
type RawProps = React.ComponentProps<typeof RawNotifications>;

/** What changed the list: read or unread (with the ids), all marked read, or one dismissed */
export type NotificationsChange = { action: "read" | "unread" | "read-all" | "dismiss"; ids: string[] };

export type NotificationsOwnProps = {
  /** The panel's title, and the start of the bell's name – "Notifications" by default */
  title?: string;
  /** The notifications. Controlled when defined: reading, Mark all as read and dismiss only report, and you update the list */
  items?: NotificationItem[];
  /** The notifications when uncontrolled – the component applies read changes and dismissals itself */
  defaultItems?: NotificationItem[];
  /** Called with the list as it is after a read change, Mark all as read or a dismissal, and what happened */
  onItemsChange?: (items: NotificationItem[], change: NotificationsChange) => void;
  /** Notifications were marked read or unread (opening one marks it read) */
  onReadChange?: (ids: string[], read: boolean) => void;
  /** Mark all as read was chosen, with the ids it marks */
  onMarkAllRead?: (ids: string[]) => void;
  /** A notification was dismissed */
  onDismiss?: (item: NotificationItem) => void;
  /** An inline action was chosen; return false to keep the notification unread */
  onAction?: (item: NotificationItem, action: string) => boolean | void;
  /** A notification was opened; return false to stop its link being followed (route it yourself) */
  onItemOpen?: (item: NotificationItem) => boolean | void;
  /** The next page is wanted: the oldest loaded notification's id and how many are loaded. Set `loadingMore` while it loads */
  onLoadMore?: (after: string | null, count: number) => void;
  /** Try again was chosen after an error */
  onRetry?: () => void;
  /** The settings link or button was chosen; return false to stop `settingsHref` being followed */
  onSettings?: () => boolean | void;
  /** The tab showing: "all", "unread" or a category's id. Controlled when defined */
  filter?: string;
  /** The tab showing first when uncontrolled */
  defaultFilter?: string;
  /** A tab was picked */
  onFilterChange?: (filter: string) => void;
  /** Whether the bell's panel is open. Controlled when defined */
  open?: boolean;
  /** Whether the panel starts open when uncontrolled */
  defaultOpen?: boolean;
  /** The panel opened or closed */
  onOpenChange?: (open: boolean) => void;
};
type Wrapped = keyof NotificationsOwnProps | "heading" | "onTcReadChange" | "onTcMarkAllRead" | "onTcDismiss" | "onTcAction" | "onTcItemOpen" | "onTcFilterChange" | "onTcOpenChange" | "onTcLoadMore" | "onTcRetry" | "onTcSettings" | "children";
export type NotificationsProps = Omit<RawProps, Wrapped> & NotificationsOwnProps;

const NONE: NotificationItem[] = [];

export function Notifications({ title, items, defaultItems = NONE, onItemsChange, onReadChange, onMarkAllRead, onDismiss, onAction, onItemOpen, onLoadMore, onRetry, onSettings, filter, defaultFilter = "all", onFilterChange, open, defaultOpen = false, onOpenChange, ...props }: NotificationsProps) {
  const last = React.useRef<NotificationsChange>({ action: "read", ids: [] });
  const report = React.useCallback((next: NotificationItem[]) => onItemsChange?.(next, last.current), [onItemsChange]);
  const list = useControlled<NotificationItem[]>(items, defaultItems, report);
  const tab = useControlled(filter, defaultFilter, onFilterChange);
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(RawNotifications, {
    ...props,
    heading: title ?? "Notifications",
    items: list.value,
    filter: tab.value,
    open: o.value,
    onTcOpenChange: (e: CustomEvent<NotificationsOpenChange>) => o.handler(e.detail.open, e),
    onTcFilterChange: (e: CustomEvent<NotificationsFilterChange>) => tab.handler(e.detail.filter, e),
    onTcReadChange: (e: CustomEvent<NotificationsReadChange>) => {
      onReadChange?.(e.detail.ids, e.detail.read);
      last.current = { action: e.detail.read ? "read" : "unread", ids: e.detail.ids };
      list.handler(e.detail.items, e);
    },
    onTcMarkAllRead: (e: CustomEvent<NotificationsMarkAllRead>) => {
      onMarkAllRead?.(e.detail.ids);
      last.current = { action: "read-all", ids: e.detail.ids };
      list.handler(e.detail.items, e);
    },
    onTcDismiss: (e: CustomEvent<NotificationsDismiss>) => {
      onDismiss?.(e.detail.item);
      last.current = { action: "dismiss", ids: [e.detail.id] };
      list.handler(e.detail.items, e);
    },
    onTcAction: (e: CustomEvent<NotificationsAction>) => {
      if (onAction?.(e.detail.item, e.detail.action) === false) e.preventDefault();
    },
    onTcItemOpen: (e: CustomEvent<NotificationsItemOpen>) => {
      if (onItemOpen?.(e.detail.item) === false) e.preventDefault();
    },
    onTcLoadMore: (e: CustomEvent<NotificationsLoadMore>) => onLoadMore?.(e.detail.after, e.detail.count),
    onTcRetry: () => onRetry?.(),
    onTcSettings: (e: CustomEvent) => {
      if (onSettings?.() === false) e.preventDefault();
    },
  });
}

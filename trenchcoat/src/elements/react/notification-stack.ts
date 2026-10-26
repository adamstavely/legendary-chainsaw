import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcNotificationStack, type Notice } from "../notification-stack";
import { h } from "./internal";

export type { Notice, NoticePattern } from "../notification-stack";

const RawNotificationStack = createComponent({
  tagName: "tc-notification-stack",
  elementClass: TcNotificationStack,
  react: React,
  events: { onTcDismiss: "tc-dismiss" as EventName<CustomEvent<Notice>> },
});
type RawNotificationStackProps = React.ComponentProps<typeof RawNotificationStack>;
export type NotificationStackProps = Omit<RawNotificationStackProps, "onTcDismiss" | "notices"> & {
  /** The notices to show, front first */
  notices: Notice[];
  /** Called after a notice was dismissed */
  onDismiss?: (notice: Notice) => void;
};
export function NotificationStack({ onDismiss, ...props }: NotificationStackProps) {
  return h(RawNotificationStack, { ...props, onTcDismiss: (e: CustomEvent<Notice>) => onDismiss?.(e.detail) });
}

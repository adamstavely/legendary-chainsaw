import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAlertFeed, type AlertActionEvent, type AlertItem, type AlertPausedChange } from "../alert-feed";
import { h, useControlled } from "./internal";

export type { AlertAction, AlertItem, AlertSeverity } from "../alert-feed";
export { alertTime, defaultAlertActions, defaultAlertSeverityLabels } from "../alert-feed";

const RawAlertFeed = createComponent({
  tagName: "tc-alert-feed",
  elementClass: TcAlertFeed,
  react: React,
  events: {
    onTcAction: "tc-action" as EventName<CustomEvent<AlertActionEvent>>,
    onTcPausedChange: "tc-paused-change" as EventName<CustomEvent<AlertPausedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAlertFeed>;
type Owned = "heading" | "paused" | "onTcAction" | "onTcPausedChange" | "children";
export type AlertFeedProps = Omit<RawProps, Owned> & {
  /** The heading, and the feed's name */
  title?: string;
  /** Whether new alerts are held back – controlled when given */
  paused?: boolean;
  /** Paused on mount when `paused` isn't controlled */
  defaultPaused?: boolean;
  /** Pause feed or Resume was pressed */
  onPausedChange?: (paused: boolean) => void;
  /** An alert's action was used; return false to stop the element acting on it (Acknowledge quieting the alert) */
  onAction?: (id: string, action: string, item: AlertItem) => boolean | void;
};

export function AlertFeed({ title, paused, defaultPaused = false, onPausedChange, onAction, ...props }: AlertFeedProps) {
  const p = useControlled<boolean>(paused, defaultPaused, onPausedChange);
  return h(RawAlertFeed, {
    ...props,
    heading: title ?? "Live alerts",
    paused: p.value,
    onTcPausedChange: (e: CustomEvent<AlertPausedChange>) => p.handler(e.detail.paused, e),
    onTcAction: (e: CustomEvent<AlertActionEvent>) => {
      if (onAction?.(e.detail.id, e.detail.action, e.detail.item) === false) e.preventDefault();
    },
  });
}

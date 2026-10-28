import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSessionState, type SessionAction } from "../session-state";
import { h } from "./internal";

export type { SessionChip, SessionHealth, SessionTile, SessionTone } from "../session-state";
export { defaultSessionHealthLabels } from "../session-state";

const RawSessionState = createComponent({
  tagName: "tc-session-state",
  elementClass: TcSessionState,
  react: React,
  events: {
    onTcAction: "tc-action" as EventName<CustomEvent<SessionAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSessionState>;
type Owned = "heading" | "onTcAction" | "children";
export type SessionStateProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** A tile (with `actionable`) or a chip with `action` was pressed */
  onAction?: (id: string, kind: "tile" | "chip") => void;
};

export function SessionState({ title, onAction, ...props }: SessionStateProps) {
  return h(RawSessionState, {
    ...props,
    heading: title ?? "Session state",
    onTcAction: (e: CustomEvent<SessionAction>) => onAction?.(e.detail.id, e.detail.kind),
  });
}

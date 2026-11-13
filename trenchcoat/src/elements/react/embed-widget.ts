import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEmbedWidget, type EmbedOpenChange, type EmbedSend, type EmbedStarter } from "../embed-widget";
import { h, useControlled } from "./internal";

export type { EmbedMessage, EmbedMessageFrom, EmbedOpenChange, EmbedPosition, EmbedSend, EmbedStarter, EmbedTheme, EmbedWidgetLabels } from "../embed-widget";
export { defaultEmbedWidgetLabels, embedAccentText, embedContrast, parseEmbedHex } from "../embed-widget";

const RawEmbedWidget = createComponent({
  tagName: "tc-embed-widget",
  elementClass: TcEmbedWidget,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<EmbedOpenChange>>,
    onTcSend: "tc-send" as EventName<CustomEvent<EmbedSend>>,
  },
});
type RawProps = React.ComponentProps<typeof RawEmbedWidget>;
type Owned = "heading" | "open" | "onTcOpenChange" | "onTcSend" | "children";
export type EmbedWidgetProps = Omit<RawProps, Owned> & {
  /** The agent's name in the header (theme.title overrides it) */
  title?: string;
  /** The panel is open – controlled when given */
  open?: boolean;
  /** Open on mount when `open` isn't controlled */
  defaultOpen?: boolean;
  /** The panel opened or closed */
  onOpenChange?: (open: boolean) => void;
  /** The visitor sent a message or picked a starter – append it and the reply to `messages`; return false to keep the text in the field */
  onSend?: (text: string, starter: EmbedStarter | null) => void | false;
};

export function EmbedWidget({ title, open, defaultOpen = false, onOpenChange, onSend, ...props }: EmbedWidgetProps) {
  const o = useControlled<boolean>(open, defaultOpen, onOpenChange);
  return h(RawEmbedWidget, {
    ...props,
    heading: title ?? "Assistant",
    open: o.value,
    onTcOpenChange: (e: CustomEvent<EmbedOpenChange>) => o.handler(e.detail.open, e),
    onTcSend: (e: CustomEvent<EmbedSend>) => {
      if (onSend?.(e.detail.text, e.detail.starter) === false) e.preventDefault();
    },
  });
}

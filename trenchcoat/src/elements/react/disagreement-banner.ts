import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDisagreementBanner, type DisagreementAnswer, type DisagreementExpandedChange, type DisagreementOpenSession } from "../disagreement-banner";
import { h, useControlled } from "./internal";

export type { DisagreementAnswer, DisagreementOpenSession } from "../disagreement-banner";

const RawDisagreementBanner = createComponent({
  tagName: "tc-disagreement-banner",
  elementClass: TcDisagreementBanner,
  react: React,
  events: {
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<DisagreementExpandedChange>>,
    onTcDismiss: "tc-dismiss" as EventName<CustomEvent<null>>,
    onTcOpenSession: "tc-open-session" as EventName<CustomEvent<DisagreementOpenSession>>,
  },
});
type RawDisagreementBannerProps = React.ComponentProps<typeof RawDisagreementBanner>;

export type DisagreementBannerProps = Omit<
  RawDisagreementBannerProps,
  "heading" | "expanded" | "dismissible" | "canOpen" | "dismissed" | "onTcExpandedChange" | "onTcDismiss" | "onTcOpenSession"
> & {
  /** The heading */
  title?: string;
  /** Shows both answers in full (controlled). Leave it undefined to let the banner keep it, starting at `defaultExpanded` */
  expanded?: boolean;
  /** Whether both answers show in full at first when uncontrolled */
  defaultExpanded?: boolean;
  /** Called when "Show full answers" or "Show changes only" is pressed, controlled or not */
  onExpandedChange?: (expanded: boolean) => void;
  /** Shows Dismiss and is called when it's pressed; return false to keep the banner */
  onDismiss?: () => boolean | void;
  /** Shows "Open earlier session" and is called with the earlier answer's session id when it's pressed */
  onOpenEarlier?: (sessionId: string | undefined, answer: DisagreementAnswer) => void;
};

export function DisagreementBanner({ title = "This answer differs from an earlier one", expanded, defaultExpanded = false, onExpandedChange, onDismiss, onOpenEarlier, ...props }: DisagreementBannerProps) {
  const x = useControlled(expanded, defaultExpanded, onExpandedChange);
  return h(RawDisagreementBanner, {
    ...props,
    heading: title,
    expanded: x.value,
    dismissible: !!onDismiss,
    canOpen: !!onOpenEarlier,
    onTcExpandedChange: (e: CustomEvent<DisagreementExpandedChange>) => x.handler(e.detail.expanded, e),
    onTcDismiss: (e: CustomEvent<null>) => {
      if (onDismiss?.() === false) e.preventDefault();
    },
    onTcOpenSession: (e: CustomEvent<DisagreementOpenSession>) => onOpenEarlier?.(e.detail.sessionId, e.detail.answer),
  });
}

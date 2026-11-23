import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAiDisclosure, type AiDisclosureOpenChange, type AiDisclosureReport } from "../ai-disclosure";
import { h } from "./internal";

export type { AiDisclosureKind, AiDisclosureLabels, AiDisclosureOpenChange, AiDisclosureReport, AiDisclosureVariant } from "../ai-disclosure";
export { defaultAiDisclosureLabels } from "../ai-disclosure";

const RawAiDisclosure = createComponent({
  tagName: "tc-ai-disclosure",
  elementClass: TcAiDisclosure,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<AiDisclosureOpenChange>>,
    onTcReport: "tc-report" as EventName<CustomEvent<AiDisclosureReport>>,
    onTcDismiss: "tc-dismiss" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAiDisclosure>;
type Owned = "heading" | "dismissible" | "onTcOpenChange" | "onTcReport" | "onTcDismiss" | "children";
export type AiDisclosureProps = Omit<RawProps, Owned> & {
  /** The notice's heading */
  title?: string;
  /** Shows the notice's close button; on when `onDismiss` is given */
  dismissible?: boolean;
  /** The mark's card opened or closed */
  onOpenChange?: (open: boolean) => void;
  /** Report a problem was pressed (no `reportHref`); return false to keep the button as it is */
  onReport?: (detail: AiDisclosureReport) => boolean | void;
  /** The notice's close button was pressed; return false to keep it showing */
  onDismiss?: () => boolean | void;
};

export function AiDisclosure({ title, dismissible, onOpenChange, onReport, onDismiss, ...props }: AiDisclosureProps) {
  return h(RawAiDisclosure, {
    ...props,
    heading: title,
    dismissible: dismissible ?? !!onDismiss,
    onTcOpenChange: (e: CustomEvent<AiDisclosureOpenChange>) => onOpenChange?.(e.detail.open),
    onTcReport: (e: CustomEvent<AiDisclosureReport>) => {
      if (onReport?.(e.detail) === false) e.preventDefault();
    },
    onTcDismiss: (e: CustomEvent<null>) => {
      if (onDismiss?.() === false) e.preventDefault();
    },
  });
}

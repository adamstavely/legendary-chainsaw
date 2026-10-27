import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCapabilityNotice, type CapabilityOpenChange } from "../capability-notice";
import { h, useControlled } from "./internal";

export type { CapabilityLevel, CapabilityOpenChange } from "../capability-notice";

const RawCapabilityNotice = createComponent({
  tagName: "tc-capability-notice",
  elementClass: TcCapabilityNotice,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<CapabilityOpenChange>>,
  },
});
type RawCapabilityNoticeProps = React.ComponentProps<typeof RawCapabilityNotice>;

export type CapabilityNoticeOwnProps = {
  /** The heading – what to do about the answer: "Check this answer independently" or "Treat this answer as a starting point" by default */
  title?: string;
  /** Whether the distance detail is open. Controlled when defined */
  open?: boolean;
  /** Whether the detail starts open when uncontrolled – folded by default */
  defaultOpen?: boolean;
  /** The distance detail was opened or closed */
  onOpenChange?: (open: boolean) => void;
};
export type CapabilityNoticeProps = Omit<RawCapabilityNoticeProps, keyof CapabilityNoticeOwnProps | "heading" | "onTcOpenChange"> & CapabilityNoticeOwnProps;

export function CapabilityNotice({ title, open, defaultOpen = false, onOpenChange, ...props }: CapabilityNoticeProps) {
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(RawCapabilityNotice, {
    ...props,
    heading: title,
    open: o.value,
    onTcOpenChange: (e: CustomEvent<CapabilityOpenChange>) => o.handler(e.detail.open, e),
  });
}

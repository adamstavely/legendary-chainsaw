import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAppPicker, type AppPickerApp, type AppPickerOpenChange, type AppPickerPinDetail, type AppPickerSelectDetail } from "../app-picker";
import { h, useControlled } from "./internal";

export type { AppPickerApp, AppPickerLabels, AppPickerLayout, AppPickerSearch, AppTone } from "../app-picker";

const RawAppPicker = createComponent({
  tagName: "tc-app-picker",
  elementClass: TcAppPicker,
  react: React,
  events: {
    onTcAppSelect: "tc-app-select" as EventName<CustomEvent<AppPickerSelectDetail>>,
    onTcPinChange: "tc-pin-change" as EventName<CustomEvent<AppPickerPinDetail>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<AppPickerOpenChange>>,
    onTcRetry: "tc-retry" as EventName<CustomEvent<Record<string, never>>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAppPicker>;

export type AppPickerOwnProps = {
  /** The pinned app ids, in order. Controlled when defined: a pin toggle only reports, and you update the list */
  pinned?: string[];
  /** The pinned app ids when uncontrolled – the component applies pin toggles itself */
  defaultPinned?: string[];
  /** Called with the pinned ids as they are after a pin toggle */
  onPinnedChange?: (pinned: string[]) => void;
  /** An app was picked with a plain click or Enter; return false to stop its link being followed (route yourself) */
  onSelect?: (app: AppPickerApp) => boolean | void;
  /** Whether the panel is open. Controlled when defined */
  open?: boolean;
  /** Whether the panel starts open when uncontrolled */
  defaultOpen?: boolean;
  /** The panel opened or closed */
  onOpenChange?: (open: boolean) => void;
  /** Retry was chosen after `error` – load the apps again */
  onRetry?: () => void;
};
type Wrapped = keyof AppPickerOwnProps | "onTcAppSelect" | "onTcPinChange" | "onTcOpenChange" | "onTcRetry" | "children";
export type AppPickerProps = Omit<RawProps, Wrapped> & AppPickerOwnProps;

const NONE: string[] = [];

export function AppPicker({ pinned, defaultPinned = NONE, onPinnedChange, onSelect, open, defaultOpen = false, onOpenChange, onRetry, ...props }: AppPickerProps) {
  const p = useControlled<string[]>(pinned, defaultPinned, onPinnedChange);
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(RawAppPicker, {
    ...props,
    pinned: p.value,
    open: o.value,
    onTcOpenChange: (e: CustomEvent<AppPickerOpenChange>) => o.handler(e.detail.open, e),
    onTcPinChange: (e: CustomEvent<AppPickerPinDetail>) => p.handler(e.detail.pins, e),
    onTcAppSelect: (e: CustomEvent<AppPickerSelectDetail>) => {
      if (onSelect?.(e.detail.app) === false) e.preventDefault();
    },
    onTcRetry: () => onRetry?.(),
  });
}

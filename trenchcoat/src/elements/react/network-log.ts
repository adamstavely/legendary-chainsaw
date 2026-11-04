import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcNetworkLog, type NetworkRequest, type NetworkSelectedChange, type NetworkType, type NetworkTypesChange } from "../network-log";
import { h, useControlled } from "./internal";

export type { NetworkLogLabels, NetworkRequest, NetworkSelectedChange, NetworkType, NetworkTypesChange } from "../network-log";
export { defaultNetworkLogLabels, networkTypes, requestName } from "../network-log";

const RawNetworkLog = createComponent({
  tagName: "tc-network-log",
  elementClass: TcNetworkLog,
  react: React,
  events: {
    onTcTypesChange: "tc-types-change" as EventName<CustomEvent<NetworkTypesChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<NetworkSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawNetworkLog>;
type Owned = "heading" | "types" | "selected" | "onTcTypesChange" | "onTcSelectedChange" | "children";
export type NetworkLogProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The types that show, empty for all – controlled when given */
  types?: NetworkType[];
  /** The types that show at first, when `types` isn't controlled */
  defaultTypes?: NetworkType[];
  /** A type chip was toggled */
  onTypesChange?: (types: NetworkType[]) => void;
  /** The open request's id – controlled when given */
  selected?: string | null;
  /** The open request at first, when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A request was opened or its details closed */
  onSelectedChange?: (selected: string | null, request?: NetworkRequest) => void;
};

const NONE: NetworkType[] = [];

export function NetworkLog({ title = "Network", types, defaultTypes = NONE, onTypesChange, selected, defaultSelected = null, onSelectedChange, ...props }: NetworkLogProps) {
  const t = useControlled<NetworkType[]>(types, defaultTypes, onTypesChange);
  const s = useControlled<string | null>(selected, defaultSelected, undefined);
  return h(RawNetworkLog, {
    ...props,
    heading: title,
    types: t.value,
    selected: s.value,
    onTcTypesChange: (ev: CustomEvent<NetworkTypesChange>) => {
      // Only the log's own events: those of the JSON Viewer inside it bubble through here too
      if (ev.target === ev.currentTarget) t.handler(ev.detail.types, ev);
    },
    onTcSelectedChange: (ev: CustomEvent<NetworkSelectedChange>) => {
      if (ev.target !== ev.currentTarget) return;
      s.handler(ev.detail.selected, ev);
      onSelectedChange?.(ev.detail.selected, ev.detail.request);
    },
  });
}

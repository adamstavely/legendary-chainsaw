import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSharePanel, type ShareDenied, type ShareGrant, type ShareSubmit } from "../share-panel";
import { h, useControlled } from "./internal";

export type { ShareDenied, ShareEntitlement, ShareEntitlementCheck, ShareExclusion, ShareGrant, ShareLevel, SharePanelLabels, SharePartial, ShareRecipient, ShareSearch, ShareSubmit } from "../share-panel";
export { defaultShareLevels, defaultSharePanelLabels } from "../share-panel";

const RawSharePanel = createComponent({
  tagName: "tc-share-panel",
  elementClass: TcSharePanel,
  react: React,
  events: {
    onTcShare: "tc-share" as EventName<CustomEvent<ShareSubmit>>,
    onTcShareDenied: "tc-share-denied" as EventName<CustomEvent<ShareDenied>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSharePanel>;
type Owned = "heading" | "access" | "onTcShare" | "children";
export type SharePanelProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Share", or "Share {resourceName}" */
  title?: string;
  /** Who has access now – controlled when given */
  access?: ShareGrant[];
  /** Who has access on mount when `access` isn't controlled */
  defaultAccess?: ShareGrant[];
  /** Share was pressed; `detail` says who was added, changed, removed and left out */
  onShare?: (detail: ShareSubmit) => void;
};

const NONE: ShareGrant[] = [];

export function SharePanel({ title, access, defaultAccess = NONE, onShare, ...props }: SharePanelProps) {
  const a = useControlled<ShareGrant[]>(access, defaultAccess, undefined);
  return h(RawSharePanel, {
    ...props,
    heading: title ?? "",
    access: a.value,
    onTcShare: (e: CustomEvent<ShareSubmit>) => {
      a.handler(e.detail.access, e);
      onShare?.(e.detail);
    },
  });
}

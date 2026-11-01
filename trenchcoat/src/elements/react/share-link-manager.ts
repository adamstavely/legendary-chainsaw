import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcShareLinkManager, type ShareLink, type ShareLinkCopy, type ShareLinksChange } from "../share-link-manager";
import { h, useControlled } from "./internal";

export type { ShareLink, ShareLinkCopy, ShareLinkManagerLabels, ShareLinkStatus, ShareLinksChange, ShareLinksChangeKind } from "../share-link-manager";
export { defaultShareLinkManagerLabels, shareLinkStatus } from "../share-link-manager";

const RawShareLinkManager = createComponent({
  tagName: "tc-share-link-manager",
  elementClass: TcShareLinkManager,
  react: React,
  events: {
    onTcLinksChange: "tc-links-change" as EventName<CustomEvent<ShareLinksChange>>,
    onTcCopyLink: "tc-copy" as EventName<CustomEvent<ShareLinkCopy>>,
    onTcCreate: "tc-create" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawShareLinkManager>;
type Owned = "heading" | "links" | "onTcLinksChange" | "children";
export type ShareLinkManagerProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Share links" */
  title?: string;
  /** The links – controlled when given */
  links?: ShareLink[];
  /** The links on mount when `links` isn't controlled */
  defaultLinks?: ShareLink[];
  /** A link was revoked or its expiry changed */
  onLinksChange?: (links: ShareLink[], detail: ShareLinksChange) => void;
};

const NONE: ShareLink[] = [];

export function ShareLinkManager({ title, links, defaultLinks = NONE, onLinksChange, ...props }: ShareLinkManagerProps) {
  const l = useControlled<ShareLink[]>(links, defaultLinks, undefined);
  return h(RawShareLinkManager, {
    ...props,
    heading: title ?? "",
    links: l.value,
    onTcLinksChange: (e: CustomEvent<ShareLinksChange>) => {
      l.handler(e.detail.links, e);
      onLinksChange?.(e.detail.links, e.detail);
    },
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcIdentifierDetails, type IdentifierCopyDetail, type IdentifierKind, type IdentifierLookupDetail, type IdentifierMatch, type IdentifierOpenChange, type IdentifierOpenDetail } from "../identifier-details";
import { h } from "./internal";

export type { IdentifierCopyDetail, IdentifierInfo, IdentifierKind, IdentifierLookupDetail, IdentifierMatch, IdentifierOpenChange, IdentifierOpenDetail, IdentifierResolver, IdentifierSeverity, IdentifierTrigger, IpRange } from "../identifier-details";
export { defaultIdentifierKindLabels, findIdentifiers, identifierKinds, ipRange } from "../identifier-details";

const RawIdentifierDetails = createComponent({
  tagName: "tc-identifier-details",
  elementClass: TcIdentifierDetails,
  react: React,
  events: {
    onTcIdentifierLookup: "tc-identifier-lookup" as EventName<CustomEvent<IdentifierLookupDetail>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<IdentifierCopyDetail>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<IdentifierOpenDetail>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<IdentifierOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawIdentifierDetails>;
type Wrapped = "onTcIdentifierLookup" | "onTcCopy" | "onTcOpen" | "onTcOpenChange" | "onCopy" | "children";
export type IdentifierDetailsProps = Omit<RawProps, Wrapped> & {
  /** Called when a card needs details; call `detail.respondWith(details | promise)` to answer, or use `resolve` instead */
  onLookup?: (detail: IdentifierLookupDetail, event: CustomEvent<IdentifierLookupDetail>) => void;
  /** Called when Copy is pressed; return false to stop the component writing to the clipboard itself */
  onCopy?: (text: string, kind: IdentifierKind) => boolean | void;
  /** Called before a link in the card opens (doi.org, NVD, CVE.org, the app's links); return false to handle it yourself */
  onOpenLink?: (detail: IdentifierOpenDetail) => boolean | void;
  /** Called with what the open card is for, or null when it closed */
  onOpenChange?: (open: IdentifierMatch | null) => void;
};

/** DOIs, IP addresses, file hashes, CVE ids and tracking numbers in text, marked: hover, focus or right-click one for what it is, Copy and what the app knows */
export function IdentifierDetails({ onLookup, onCopy, onOpenLink, onOpenChange, ...props }: IdentifierDetailsProps) {
  return h(RawIdentifierDetails, {
    ...props,
    onTcIdentifierLookup: (e: CustomEvent<IdentifierLookupDetail>) => onLookup?.(e.detail, e),
    onTcCopy: (e: CustomEvent<IdentifierCopyDetail>) => {
      if (onCopy?.(e.detail.text, e.detail.kind) === false) e.preventDefault();
    },
    onTcOpen: (e: CustomEvent<IdentifierOpenDetail>) => {
      if (onOpenLink?.(e.detail) === false) e.preventDefault();
    },
    onTcOpenChange: (e: CustomEvent<IdentifierOpenChange>) => onOpenChange?.(e.detail.open),
  });
}

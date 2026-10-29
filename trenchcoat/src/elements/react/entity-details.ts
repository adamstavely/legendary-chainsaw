import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEntityDetails, type EntityCopyDetail, type EntityKind, type EntityLookupDetail, type EntityMatch, type EntityOpenChange, type EntityOpenDetail } from "../entity-details";
import { h } from "./internal";

export type { EntityCopyDetail, EntityInfo, EntityKind, EntityLookupDetail, EntityMatch, EntityOpenChange, EntityOpenDetail, EntityResolver, EntityTrigger } from "../entity-details";
export { defaultEntityKindLabels, entityKinds, findEntities, phoneCountry } from "../entity-details";

const RawEntityDetails = createComponent({
  tagName: "tc-entity-details",
  elementClass: TcEntityDetails,
  react: React,
  events: {
    onTcEntityLookup: "tc-entity-lookup" as EventName<CustomEvent<EntityLookupDetail>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<EntityCopyDetail>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<EntityOpenDetail>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<EntityOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawEntityDetails>;
type Wrapped = "onTcEntityLookup" | "onTcCopy" | "onTcOpen" | "onTcOpenChange" | "onCopy" | "children";
export type EntityDetailsProps = Omit<RawProps, Wrapped> & {
  /** Called when a card needs details; call `detail.respondWith(details | promise)` to answer, or use `resolve` instead */
  onLookup?: (detail: EntityLookupDetail, event: CustomEvent<EntityLookupDetail>) => void;
  /** Called when Copy is pressed; return false to stop the component writing to the clipboard itself */
  onCopy?: (text: string, kind: EntityKind) => boolean | void;
  /** Called before a link in the card opens (Write email, Call, Open, the app's links); return false to handle it yourself */
  onOpenLink?: (detail: EntityOpenDetail) => boolean | void;
  /** Called with what the open card is for, or null when it closed */
  onOpenChange?: (open: EntityMatch | null) => void;
};

/** Email addresses, phone numbers, links and @handles in text, marked: hover, focus or right-click one for its details, Copy and its action */
export function EntityDetails({ onLookup, onCopy, onOpenLink, onOpenChange, ...props }: EntityDetailsProps) {
  return h(RawEntityDetails, {
    ...props,
    onTcEntityLookup: (e: CustomEvent<EntityLookupDetail>) => onLookup?.(e.detail, e),
    onTcCopy: (e: CustomEvent<EntityCopyDetail>) => {
      if (onCopy?.(e.detail.text, e.detail.kind) === false) e.preventDefault();
    },
    onTcOpen: (e: CustomEvent<EntityOpenDetail>) => {
      if (onOpenLink?.(e.detail) === false) e.preventDefault();
    },
    onTcOpenChange: (e: CustomEvent<EntityOpenChange>) => onOpenChange?.(e.detail.open),
  });
}

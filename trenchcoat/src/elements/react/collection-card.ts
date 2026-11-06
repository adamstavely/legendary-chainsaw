import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCollectionCard } from "../collection-card";
import { h } from "./internal";

export type { CollectionCardLabels, CollectionPreview } from "../collection-card";
export { defaultCollectionCardLabels } from "../collection-card";

const RawCollectionCard = createComponent({
  tagName: "tc-collection-card",
  elementClass: TcCollectionCard,
  react: React,
  events: { onTcOpen: "tc-open" as EventName<CustomEvent<{ href: string | null }>> },
});
type RawProps = React.ComponentProps<typeof RawCollectionCard>;
export type CollectionCardProps = Omit<RawProps, "heading"> & {
  /** The collection's name */
  title?: string;
};

/** A card that introduces a collection – previews, counts, a description, what's inside – and links into it */
export function CollectionCard({ title, ...props }: CollectionCardProps) {
  return h(RawCollectionCard, { ...props, heading: title ?? "" });
}

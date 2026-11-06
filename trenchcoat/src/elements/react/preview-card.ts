import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPreviewCard } from "../preview-card";
import { h } from "./internal";

export type { PreviewCardFit, PreviewCardOrientation } from "../preview-card";

const RawPreviewCard = createComponent({
  tagName: "tc-preview-card",
  elementClass: TcPreviewCard,
  react: React,
  events: { onTcOpen: "tc-open" as EventName<CustomEvent<{ href: string | null }>> },
});
type RawProps = React.ComponentProps<typeof RawPreviewCard>;
export type PreviewCardProps = Omit<RawProps, "heading"> & {
  /** The title, on one line */
  title?: string;
};

/** A gallery tile: a large preview above a title and a short description. Children are a live preview, inert and unread */
export function PreviewCard({ title, ...props }: PreviewCardProps) {
  return h(RawPreviewCard, { ...props, heading: title ?? "" });
}

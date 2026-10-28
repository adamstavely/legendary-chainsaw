import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentGallery, type GalleryIndexChange } from "../agent-gallery";
import { h, useControlled } from "./internal";

export type { GalleryIndexChange, GalleryItem } from "../agent-gallery";
export { defaultGalleryItems } from "../agent-gallery";

const RawAgentGallery = createComponent({
  tagName: "tc-agent-gallery",
  elementClass: TcAgentGallery,
  react: React,
  events: {
    onTcIndexChange: "tc-index-change" as EventName<CustomEvent<GalleryIndexChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAgentGallery>;
type Owned = "heading" | "index" | "onTcIndexChange" | "children";
export type AgentGalleryProps = Omit<RawProps, Owned> & {
  /** The heading, and the carousel's name */
  title?: string;
  /** The open agent (controlled) – the gallery glides there the short way round */
  index?: number;
  /** The agent open at first, when `index` isn't set – by default the middle one */
  defaultIndex?: number;
  /** Called with the agent a visitor picks (a panel, an arrow button or an arrow key) */
  onIndexChange?: (index: number) => void;
};

export function AgentGallery({ title, index, defaultIndex, onIndexChange, ...props }: AgentGalleryProps) {
  const i = useControlled<number | undefined>(index, defaultIndex, onIndexChange as ((next: number | undefined) => void) | undefined);
  return h(RawAgentGallery, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    index: i.value,
    onTcIndexChange: (e: CustomEvent<GalleryIndexChange>) => i.handler(e.detail.index, e),
  });
}

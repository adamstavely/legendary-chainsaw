import { createComponent } from "@lit/react";
import * as React from "react";
import { TcPageSlide } from "../page-slide";
import { h } from "./internal";

export type { PageSlideDirection } from "../page-slide";

const RawPageSlide = createComponent({ tagName: "tc-page-slide", elementClass: TcPageSlide, react: React });
type RawProps = React.ComponentProps<typeof RawPageSlide>;

export type PageSlideOwnProps = {
  /** The key of the view on show – change it to slide to the new view */
  view: string;
  /** The current view only – it's rendered in a layer keyed by `view`, so a new view is a new layer and the old one slides out */
  children?: React.ReactNode;
  /** The layer element */
  as?: "div" | "section";
};
export type PageSlideProps = Omit<RawProps, keyof PageSlideOwnProps> & PageSlideOwnProps;

/** Slides between views as `view` changes; render only the current view's content */
export function PageSlide({ view, children, as = "div", ...props }: PageSlideProps) {
  return h(RawPageSlide, { ...(props as RawProps), view }, h(as, { key: `v-${view}`, "data-view": view }, children));
}

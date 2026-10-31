import { createComponent } from "@lit/react";
import * as React from "react";
import { TcContentHidden } from "../content-hidden";

/** Content Hidden illustration, with its words as real text. The ref receives the element */
export const ContentHidden = createComponent({ tagName: "tc-content-hidden", elementClass: TcContentHidden, react: React });
export type ContentHiddenProps = React.ComponentProps<typeof ContentHidden>;

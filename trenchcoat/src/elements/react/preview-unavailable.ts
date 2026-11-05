import { createComponent } from "@lit/react";
import * as React from "react";
import { TcPreviewUnavailable } from "../preview-unavailable";

/** Preview Unavailable illustration, with its words as real text. The ref receives the element */
export const PreviewUnavailable = createComponent({ tagName: "tc-preview-unavailable", elementClass: TcPreviewUnavailable, react: React });
export type PreviewUnavailableProps = React.ComponentProps<typeof PreviewUnavailable>;

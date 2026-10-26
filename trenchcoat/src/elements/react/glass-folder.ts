import { createComponent } from "@lit/react";
import * as React from "react";
import { TcGlassFolder } from "../glass-folder";

/**
 * A glassy folder; `label` makes it an image, otherwise it is decorative. `open` holds the hover look (pocket tipped
 * forward, documents shifted) without a pointer. The ref receives the element
 */
export const GlassFolder = createComponent({ tagName: "tc-glass-folder", elementClass: TcGlassFolder, react: React });
export type GlassFolderProps = React.ComponentProps<typeof GlassFolder>;

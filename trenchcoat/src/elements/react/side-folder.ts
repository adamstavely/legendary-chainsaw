import { createComponent } from "@lit/react";
import * as React from "react";
import { TcSideFolder } from "../side-folder";

/** A glassy folder on its side; `label` makes it an image, otherwise it is decorative. The ref receives the element */
export const SideFolder = createComponent({ tagName: "tc-side-folder", elementClass: TcSideFolder, react: React });
export type SideFolderProps = React.ComponentProps<typeof SideFolder>;

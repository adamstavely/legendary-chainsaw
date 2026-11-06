import { createComponent } from "@lit/react";
import * as React from "react";
import { TcInTranslation } from "../in-translation";

/** In Translation illustration, with its words as real text. The ref receives the element */
export const InTranslation = createComponent({ tagName: "tc-in-translation", elementClass: TcInTranslation, react: React });
export type InTranslationProps = React.ComponentProps<typeof InTranslation>;

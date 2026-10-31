import { createComponent } from "@lit/react";
import * as React from "react";
import { TcNothingFound } from "../nothing-found";

/** Nothing Found illustration; `label` makes it an image, otherwise it is decorative. The ref receives the element */
export const NothingFound = createComponent({ tagName: "tc-nothing-found", elementClass: TcNothingFound, react: React });
export type NothingFoundProps = React.ComponentProps<typeof NothingFound>;

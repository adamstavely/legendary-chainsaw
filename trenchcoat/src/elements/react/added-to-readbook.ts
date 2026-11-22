import { createComponent } from "@lit/react";
import * as React from "react";
import { TcAddedToReadbook } from "../added-to-readbook";

/** Added to Readbook illustration, with its words as real text. The ref receives the element */
export const AddedToReadbook = createComponent({ tagName: "tc-added-to-readbook", elementClass: TcAddedToReadbook, react: React });
export type AddedToReadbookProps = React.ComponentProps<typeof AddedToReadbook>;

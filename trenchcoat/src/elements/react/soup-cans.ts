import { createComponent } from "@lit/react";
import * as React from "react";
import { TcSoupCans } from "../soup-cans";

/** Soup Cans illustration – three unlabeled cans in a heap. The ref receives the element */
export const SoupCans = createComponent({ tagName: "tc-soup-cans", elementClass: TcSoupCans, react: React });
export type SoupCansProps = React.ComponentProps<typeof SoupCans>;

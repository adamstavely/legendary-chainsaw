import { createComponent } from "@lit/react";
import * as React from "react";
import { TcPageState } from "../page-state";

export type { PageStateKind } from "../page-state";
export { pageStateWords } from "../page-state";

/** Page state illustration – nothing found, offline, something wrong, link expired and the rest – with its words as real text. The ref receives the element */
export const PageState = createComponent({ tagName: "tc-page-state", elementClass: TcPageState, react: React });
export type PageStateProps = React.ComponentProps<typeof PageState>;

import { createComponent } from "@lit/react";
import * as React from "react";
import { TcDocStatus } from "../doc-status";

export type { DocStatus as DocStatusValue } from "../doc-status";
export { docStatusWords } from "../doc-status";

/** Doc Status illustration – where a document stands, its drawing, colours and words picked by `status`. The ref receives the element */
export const DocStatus = createComponent({ tagName: "tc-doc-status", elementClass: TcDocStatus, react: React });
export type DocStatusProps = React.ComponentProps<typeof DocStatus>;

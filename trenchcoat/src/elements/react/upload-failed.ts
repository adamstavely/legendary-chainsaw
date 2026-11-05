import { createComponent } from "@lit/react";
import * as React from "react";
import { TcUploadFailed } from "../upload-failed";

/** Upload Failed illustration, with its words as real text. The ref receives the element */
export const UploadFailed = createComponent({ tagName: "tc-upload-failed", elementClass: TcUploadFailed, react: React });
export type UploadFailedProps = React.ComponentProps<typeof UploadFailed>;

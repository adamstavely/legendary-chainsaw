import { createComponent } from "@lit/react";
import * as React from "react";
import { TcUploading } from "../uploading";

/** Uploading illustration, with its words as real text. The ref receives the element */
export const Uploading = createComponent({ tagName: "tc-uploading", elementClass: TcUploading, react: React });
export type UploadingProps = React.ComponentProps<typeof Uploading>;

import { createComponent } from "@lit/react";
import * as React from "react";
import { TcDownloading } from "../downloading";

/** Downloading illustration, with its words as real text. The ref receives the element */
export const Downloading = createComponent({ tagName: "tc-downloading", elementClass: TcDownloading, react: React });
export type DownloadingProps = React.ComponentProps<typeof Downloading>;

import { createComponent } from "@lit/react";
import * as React from "react";
import { TcMetadataCleansing } from "../metadata-cleansing";

export type { MetadataCleansingStatus } from "../metadata-cleansing";
export { metadataCleansingWords } from "../metadata-cleansing";

/** Metadata cleansing illustration – required, in progress, failed or done – with its words as real text. The ref receives the element */
export const MetadataCleansing = createComponent({ tagName: "tc-metadata-cleansing", elementClass: TcMetadataCleansing, react: React });
export type MetadataCleansingProps = React.ComponentProps<typeof MetadataCleansing>;

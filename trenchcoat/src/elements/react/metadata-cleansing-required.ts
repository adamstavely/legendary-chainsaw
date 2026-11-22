import { createComponent } from "@lit/react";
import * as React from "react";
import { TcMetadataCleansingRequired } from "../metadata-cleansing-required";

/** Metadata cleansing required illustration, with its words as real text. The ref receives the element */
export const MetadataCleansingRequired = createComponent({ tagName: "tc-metadata-cleansing-required", elementClass: TcMetadataCleansingRequired, react: React });
export type MetadataCleansingRequiredProps = React.ComponentProps<typeof MetadataCleansingRequired>;

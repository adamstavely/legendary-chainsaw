import { createComponent } from "@lit/react";
import * as React from "react";
import { TcInQualityControl } from "../in-quality-control";

/** In Quality Control illustration, with its words as real text. The ref receives the element */
export const InQualityControl = createComponent({ tagName: "tc-in-quality-control", elementClass: TcInQualityControl, react: React });
export type InQualityControlProps = React.ComponentProps<typeof InQualityControl>;

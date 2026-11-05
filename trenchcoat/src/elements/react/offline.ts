import { createComponent } from "@lit/react";
import * as React from "react";
import { TcOffline } from "../offline";

/** Offline illustration, with its words as real text. The ref receives the element */
export const Offline = createComponent({ tagName: "tc-offline", elementClass: TcOffline, react: React });
export type OfflineProps = React.ComponentProps<typeof Offline>;

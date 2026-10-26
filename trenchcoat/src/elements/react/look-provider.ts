import { createComponent } from "@lit/react";
import * as React from "react";
import { TcLookProvider } from "../internal/look";

export type { Look } from "../internal/look";
export const LookProvider = createComponent({ tagName: "tc-look-provider", elementClass: TcLookProvider, react: React });

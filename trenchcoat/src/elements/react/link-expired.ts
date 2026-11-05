import { createComponent } from "@lit/react";
import * as React from "react";
import { TcLinkExpired } from "../link-expired";

/** Link Expired illustration, with its words as real text. The ref receives the element */
export const LinkExpired = createComponent({ tagName: "tc-link-expired", elementClass: TcLinkExpired, react: React });
export type LinkExpiredProps = React.ComponentProps<typeof LinkExpired>;

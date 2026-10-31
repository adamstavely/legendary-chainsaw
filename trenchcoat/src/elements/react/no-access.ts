import { createComponent } from "@lit/react";
import * as React from "react";
import { TcNoAccess } from "../no-access";

/** No Access illustration; `label` makes it an image, otherwise it is decorative. The ref receives the element */
export const NoAccess = createComponent({ tagName: "tc-no-access", elementClass: TcNoAccess, react: React });
export type NoAccessProps = React.ComponentProps<typeof NoAccess>;

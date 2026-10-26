import { createComponent } from "@lit/react";
import * as React from "react";
import { TcGhostedChat } from "../ghosted-chat";

/** Unanswered chat messages; `label` makes it an image, otherwise it is decorative. The ref receives the element */
export const GhostedChat = createComponent({ tagName: "tc-ghosted-chat", elementClass: TcGhostedChat, react: React });
export type GhostedChatProps = React.ComponentProps<typeof GhostedChat>;

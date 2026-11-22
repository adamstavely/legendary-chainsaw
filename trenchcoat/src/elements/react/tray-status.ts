import { createComponent } from "@lit/react";
import * as React from "react";
import { TcTrayStatus } from "../tray-status";

export type { TrayStatusKind } from "../tray-status";
export { trayStatusWords } from "../tray-status";

/** Tray Status illustration – all done or upload failed – with its words as real text. The ref receives the element */
export const TrayStatus = createComponent({ tagName: "tc-tray-status", elementClass: TcTrayStatus, react: React });
export type TrayStatusProps = React.ComponentProps<typeof TrayStatus>;

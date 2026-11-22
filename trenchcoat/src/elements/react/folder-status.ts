import { createComponent } from "@lit/react";
import * as React from "react";
import { TcFolderStatus } from "../folder-status";

export type { FolderStatusKind } from "../folder-status";
export { folderStatusWords } from "../folder-status";

/** Folder Status illustration – empty, shared, archived or locked – with its words as real text. The ref receives the element */
export const FolderStatus = createComponent({ tagName: "tc-folder-status", elementClass: TcFolderStatus, react: React });
export type FolderStatusProps = React.ComponentProps<typeof FolderStatus>;

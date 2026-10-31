import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import type { ShareSubmit } from "../share-panel";
import { TcFileDetails, type FileDetailsFlagChange } from "../file-details";
import { h, useControlled } from "./internal";

export type { FileDetailsFile, FileDetailsFlagChange } from "../file-details";

const RawFileDetails = createComponent({
  tagName: "tc-file-details",
  elementClass: TcFileDetails,
  react: React,
  events: {
    onTcFlagChange: "tc-flag-change" as EventName<CustomEvent<FileDetailsFlagChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<null>>,
    onTcShare: "tc-share" as EventName<CustomEvent<ShareSubmit>>,
  },
});
type RawProps = React.ComponentProps<typeof RawFileDetails>;
type Owned = "flag" | "onTcFlagChange" | "children";
export type FileDetailsProps = Omit<RawProps, Owned> & {
  /** The id of the file's flag, or null for none – controlled when given */
  flag?: string | null;
  /** The flag on mount when `flag` isn't controlled */
  defaultFlag?: string | null;
  /** The file's flag was picked or cleared */
  onFlagChange?: (flag: string | null) => void;
};

export function FileDetails({ flag, defaultFlag = null, onFlagChange, ...props }: FileDetailsProps) {
  const f = useControlled<string | null>(flag, defaultFlag, onFlagChange);
  return h(RawFileDetails, { ...props, flag: f.value, onTcFlagChange: (e: CustomEvent<FileDetailsFlagChange>) => f.handler(e.detail.flag, e) });
}

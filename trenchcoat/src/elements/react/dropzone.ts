import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDropzone, type DropzoneUpload, type UploadItem } from "../dropzone";
import { h, useControlled } from "./internal";

export type { UploadItem, UploadStatus } from "../dropzone";

const RawDropzone = createComponent({
  tagName: "tc-dropzone",
  elementClass: TcDropzone,
  react: React,
  events: { onTcValueChange: "tc-value-change" as EventName<CustomEvent<{ value: UploadItem[] }>> },
});
type RawDropzoneProps = React.ComponentProps<typeof RawDropzone>;

export type DropzoneOwnProps = {
  /** Allowed types: extensions (".pdf"), MIME types ("application/pdf") or wildcards ("image/*") – any file when
   *  left out */
  accept?: string[];
  /** Largest file in bytes */
  maxSize?: number;
  /**
   * Upload a file and report its progress (0–1); throw to mark it as failed. `signal` aborts when the row is
   * removed or the dropzone unmounts – stop the upload then. Simulated when left out (and warns once, unless
   * `demo` is set)
   */
  onUpload?: DropzoneUpload;
  /** The list of files. Controlled when defined – pass back what onChange reports (progress included), preload
   *  files that are already uploaded, or clear it with []. Otherwise the dropzone keeps its own list */
  value?: UploadItem[];
  /** Starting list when uncontrolled */
  defaultValue?: UploadItem[];
  /** Called whenever the list changes */
  onChange?: (items: UploadItem[]) => void;
  /** Name for native form submission: the added files (not the rejected ones) are submitted under it */
  name?: string;
  /** A native form needs at least one file that isn't rejected */
  required?: boolean;
  /** No files can be added, retried or removed */
  disabled?: boolean;
  /** Text under the title – defaults to the accepted types and size */
  hint?: string;
  /** Plays a sample drop on its own – nice for previews */
  autoplay?: boolean;
  /** Demo mode: files dropped without onUpload are simulated silently. For galleries and prototypes */
  demo?: boolean;
};
export type DropzoneProps = Omit<RawDropzoneProps, keyof DropzoneOwnProps | "onTcValueChange"> & DropzoneOwnProps;

const EMPTY: UploadItem[] = [];

export function Dropzone({ value, defaultValue = EMPTY, onChange, name = "", required = false, disabled = false, autoplay = false, demo = false, ...props }: DropzoneProps) {
  const v = useControlled(value, defaultValue, onChange);
  // While uncontrolled, the element's own list – @lit/react sets every prop on each render
  const own = React.useRef(defaultValue);
  return h(RawDropzone, {
    ...props,
    name,
    required,
    disabled,
    autoplay,
    demo,
    value: v.controlled ? v.value : own.current,
    onTcValueChange: (e: CustomEvent<{ value: UploadItem[] }>) => {
      v.handler(e.detail.value, e);
      if (!v.controlled) own.current = e.detail.value;
    },
  });
}

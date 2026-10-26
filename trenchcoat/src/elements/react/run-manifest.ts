import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRunManifest, type RunManifestCopy, type RunManifestCopyField, type RunManifestExport, type RunManifestRecord } from "../run-manifest";
import { h } from "./internal";

export type { RunManifestCopyField, RunManifestRecord, RunManifestSetting, RunManifestSource, RunVerification, RunVerificationState } from "../run-manifest";

const RawRunManifest = createComponent({
  tagName: "tc-run-manifest",
  elementClass: TcRunManifest,
  react: React,
  events: {
    onTcCopy: "tc-copy" as EventName<CustomEvent<RunManifestCopy>>,
    onTcExport: "tc-export" as EventName<CustomEvent<RunManifestExport>>,
  },
});
type RawRunManifestProps = React.ComponentProps<typeof RawRunManifest>;
type Wrapped = "heading" | "modelIcon" | "onCopy" | "onTcCopy" | "onTcExport";
export type RunManifestProps = Omit<RawRunManifestProps, Wrapped> & {
  /** The heading, and the region's name */
  title?: string;
  /** An icon for the model badge – an Element, cloned in */
  modelIcon?: Element;
  /** A copy button was pressed: which field and the text copied. Return false to copy it yourself instead (this replaces React's clipboard onCopy on this component) */
  onCopy?: (field: RunManifestCopyField, text: string) => void | false;
  /** Export was pressed, with the whole record */
  onExport?: (manifest: RunManifestRecord) => void;
};

export function RunManifest({ title, onCopy, onExport, ...props }: RunManifestProps) {
  return h(RawRunManifest, {
    ...props,
    heading: title ?? "Run manifest",
    onTcCopy: (e: CustomEvent<RunManifestCopy>) => {
      if (onCopy?.(e.detail.field, e.detail.text) === false) e.preventDefault();
    },
    onTcExport: (e: CustomEvent<RunManifestExport>) => onExport?.(e.detail.manifest),
  });
}

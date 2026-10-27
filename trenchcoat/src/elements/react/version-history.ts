import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcVersionHistory,
  type VersionActivateDetail,
  type VersionCompareDetail,
  type VersionEntry,
  type VersionRestoreDetail,
  type VersionSelectDetail,
} from "../version-history";
import { h, useControlled } from "./internal";

export type {
  VersionActivateDetail,
  VersionChange,
  VersionChangeKind,
  VersionCompareDetail,
  VersionCompareResolver,
  VersionEntry,
  VersionRestoreDetail,
  VersionSelectDetail,
  VersionStatus,
} from "../version-history";

const NONE: VersionEntry[] = [];

const RawVersionHistory = createComponent({
  tagName: "tc-version-history",
  elementClass: TcVersionHistory,
  react: React,
  events: {
    onTcSelectChange: "tc-select-change" as EventName<CustomEvent<VersionSelectDetail>>,
    onTcCompare: "tc-compare" as EventName<CustomEvent<VersionCompareDetail>>,
    onTcRestore: "tc-restore" as EventName<CustomEvent<VersionRestoreDetail>>,
    onTcActivate: "tc-activate" as EventName<CustomEvent<VersionActivateDetail>>,
  },
});
type RawVersionHistoryProps = React.ComponentProps<typeof RawVersionHistory>;
export type VersionHistoryProps = Omit<
  RawVersionHistoryProps,
  "versions" | "selected" | "heading" | "onTcSelectChange" | "onTcCompare" | "onTcRestore" | "onTcActivate"
> & {
  /** The heading, and the region's name */
  title?: string;
  /** The versions, newest first – controlled when defined; pair it with `onVersionsChange` */
  versions?: VersionEntry[];
  /** The versions at first, when `versions` isn't controlled – the element applies activations itself */
  defaultVersions?: VersionEntry[];
  /** Called with the whole list after a draft is activated */
  onVersionsChange?: (versions: VersionEntry[]) => void;
  /** The version whose detail shows – controlled when defined */
  selected?: string | null;
  /** The version shown at first (default: the draft, else the active version, else the newest) */
  defaultSelected?: string | null;
  /** Called when another version is selected */
  onSelectedChange?: (id: string) => void;
  /** Called when two versions are picked to compare; call `event.preventDefault()` to show the comparison yourself */
  onCompare?: (detail: VersionCompareDetail, event: CustomEvent<VersionCompareDetail>) => void;
  /** Called when Restore is pressed – add the new draft to `versions` to answer it; `event.preventDefault()` declines */
  onRestore?: (version: VersionEntry, event: CustomEvent<VersionRestoreDetail>) => void;
  /** Called when a draft's activation is confirmed, with the draft, the version it replaces and the list after */
  onActivate?: (detail: VersionActivateDetail) => void;
};

export function VersionHistory({
  title = "Version history",
  versions,
  defaultVersions = NONE,
  onVersionsChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  onCompare,
  onRestore,
  onActivate,
  ...props
}: VersionHistoryProps) {
  const v = useControlled(versions, defaultVersions, onVersionsChange);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange as ((next: string | null) => void) | undefined);
  return h(RawVersionHistory, {
    ...props,
    heading: title,
    versions: v.value,
    selected: s.value,
    onTcSelectChange: (e: CustomEvent<VersionSelectDetail>) => s.handler(e.detail.id, e),
    onTcCompare: (e: CustomEvent<VersionCompareDetail>) => onCompare?.(e.detail, e),
    onTcRestore: (e: CustomEvent<VersionRestoreDetail>) => onRestore?.(e.detail.version, e),
    onTcActivate: (e: CustomEvent<VersionActivateDetail>) => {
      onActivate?.(e.detail);
      v.handler(e.detail.versions, e);
    },
  });
}

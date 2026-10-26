import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcArtifactPanel,
  type Artifact,
  type ArtifactDownload,
  type ArtifactPanelView,
  type ArtifactSelectedChange,
  type ArtifactVersion,
  type ArtifactVersionChange,
  type ArtifactViewChange,
} from "../artifact-panel";
import { h, useControlled } from "./internal";

export { artifactTableFromCsv, artifactTableToCsv, saveArtifact } from "../artifact-panel";
export type { Artifact, ArtifactKind, ArtifactPanelView, ArtifactTable, ArtifactVersion } from "../artifact-panel";

const RawArtifactPanel = createComponent({
  tagName: "tc-artifact-panel",
  elementClass: TcArtifactPanel,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<ArtifactSelectedChange>>,
    onTcVersionChange: "tc-version-change" as EventName<CustomEvent<ArtifactVersionChange>>,
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<ArtifactViewChange>>,
    onTcDownload: "tc-download" as EventName<CustomEvent<ArtifactDownload>>,
  },
});
type RawArtifactPanelProps = React.ComponentProps<typeof RawArtifactPanel>;
export type ArtifactPanelProps = Omit<
  RawArtifactPanelProps,
  "heading" | "selected" | "version" | "view" | "onTcSelectedChange" | "onTcVersionChange" | "onTcViewChange" | "onTcDownload"
> & {
  /** The heading, and the region's name */
  title?: string;
  /** The id of the artifact shown (controlled); empty shows the first */
  selected?: string;
  /** The artifact shown first when `selected` isn't given */
  defaultSelected?: string;
  /** Called with the artifact's id when the user picks one in the list */
  onSelectedChange?: (id: string) => void;
  /** The id of the version shown (controlled); empty shows the latest */
  version?: string;
  /** The version shown first when `version` isn't given; empty shows the latest */
  defaultVersion?: string;
  /** A version was picked; picking another artifact goes back to its latest ("") */
  onVersionChange?: (version: string, artifactId: string) => void;
  /** "preview", or "diff" to compare with the version before (controlled) */
  view?: ArtifactPanelView;
  /** The view to start in when `view` isn't given */
  defaultView?: ArtifactPanelView;
  /** Called when the user turns Compare on ("diff") or off ("preview") */
  onViewChange?: (view: ArtifactPanelView) => void;
  /** Download was pressed. The panel saves the file itself unless you call event.preventDefault() */
  onDownload?: (artifact: Artifact, version: ArtifactVersion, event: Event) => void;
};
export function ArtifactPanel({
  title = "Artifacts",
  selected,
  defaultSelected = "",
  onSelectedChange,
  version,
  defaultVersion = "",
  onVersionChange,
  view,
  defaultView = "preview",
  onViewChange,
  onDownload,
  ...props
}: ArtifactPanelProps) {
  const s = useControlled(selected, defaultSelected, onSelectedChange);
  const artifactOf = React.useRef("");
  const v = useControlled(version, defaultVersion, (next: string) => onVersionChange?.(next, artifactOf.current));
  const w = useControlled(view, defaultView, onViewChange);
  return h(RawArtifactPanel, {
    ...props,
    heading: title,
    selected: s.value,
    version: v.value,
    view: w.value,
    onTcSelectedChange: (e: CustomEvent<ArtifactSelectedChange>) => s.handler(e.detail.id, e),
    onTcVersionChange: (e: CustomEvent<ArtifactVersionChange>) => {
      artifactOf.current = e.detail.artifact;
      v.handler(e.detail.version, e);
    },
    onTcViewChange: (e: CustomEvent<ArtifactViewChange>) => w.handler(e.detail.view, e),
    onTcDownload: (e: CustomEvent<ArtifactDownload>) => onDownload?.(e.detail.artifact, e.detail.version, e),
  });
}

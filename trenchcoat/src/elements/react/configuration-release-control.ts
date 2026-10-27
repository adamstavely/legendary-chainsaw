import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcConfigurationReleaseControl, type ReleaseCompareEvent, type ReleasePromoteEvent, type ReleaseRollbackEvent } from "../configuration-release-control";
import { h } from "./internal";

export type {
  ReleaseApproval,
  ReleaseChange,
  ReleaseCompareEvent,
  ReleaseEvidence,
  ReleasePromoteEvent,
  ReleaseRollback,
  ReleaseRollbackEvent,
  ReleaseStage,
  ReleaseVersion,
} from "../configuration-release-control";

const RawConfigurationReleaseControl = createComponent({
  tagName: "tc-configuration-release-control",
  elementClass: TcConfigurationReleaseControl,
  react: React,
  events: {
    onTcPromote: "tc-promote" as EventName<CustomEvent<ReleasePromoteEvent>>,
    onTcRollback: "tc-rollback" as EventName<CustomEvent<ReleaseRollbackEvent>>,
    onTcCompare: "tc-compare" as EventName<CustomEvent<ReleaseCompareEvent>>,
  },
});
type RawProps = React.ComponentProps<typeof RawConfigurationReleaseControl>;
type Owned = "heading" | "onTcPromote" | "onTcRollback" | "onTcCompare" | "children";
export type ConfigurationReleaseControlProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** Promote was confirmed: start the move. Call `event.preventDefault()` if it can't start, so the stage isn't marked "Requested" */
  onPromote?: (request: ReleasePromoteEvent, event: CustomEvent<ReleasePromoteEvent>) => void;
  /** Roll back was confirmed: start it. Call `event.preventDefault()` if it can't start, so the stage isn't marked "Requested" */
  onRollback?: (request: ReleaseRollbackEvent, event: CustomEvent<ReleaseRollbackEvent>) => void;
  /** Compare was pressed: open the full diff between the two versions */
  onCompare?: (versions: ReleaseCompareEvent) => void;
};

export function ConfigurationReleaseControl({ title, onPromote, onRollback, onCompare, ...props }: ConfigurationReleaseControlProps) {
  return h(RawConfigurationReleaseControl, {
    ...props,
    heading: title ?? "Configuration release",
    onTcPromote: (e: CustomEvent<ReleasePromoteEvent>) => onPromote?.(e.detail, e),
    onTcRollback: (e: CustomEvent<ReleaseRollbackEvent>) => onRollback?.(e.detail, e),
    onTcCompare: (e: CustomEvent<ReleaseCompareEvent>) => onCompare?.(e.detail),
  });
}

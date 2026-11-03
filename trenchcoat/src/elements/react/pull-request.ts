import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcPullRequest,
  type PullRequestAction,
  type PullRequestAutoMergeChange,
  type PullRequestDetail,
  type PullRequestMerge,
  type PullRequestMergeMethod,
  type PullRequestMergeMethodChange,
  type PullRequestOpen,
} from "../pull-request";
import { h, useControlled } from "./internal";

export type {
  PullRequestAction,
  PullRequestActionItem,
  PullRequestAutoMergeChange,
  PullRequestDetail,
  PullRequestLabels,
  PullRequestMerge,
  PullRequestMergeable,
  PullRequestMergeMethod,
  PullRequestMergeMethodChange,
  PullRequestOpen,
  PullRequestReview,
  PullRequestReviewer,
  PullRequestState,
} from "../pull-request";
export { defaultPullRequestLabels } from "../pull-request";

const RawPullRequest = createComponent({
  tagName: "tc-pull-request",
  elementClass: TcPullRequest,
  react: React,
  events: {
    onTcOpen: "tc-open" as EventName<CustomEvent<PullRequestOpen>>,
    onTcMerge: "tc-merge" as EventName<CustomEvent<PullRequestMerge>>,
    onTcReady: "tc-ready" as EventName<CustomEvent<PullRequestDetail>>,
    onTcUpdateBranch: "tc-update-branch" as EventName<CustomEvent<PullRequestDetail>>,
    onTcResolve: "tc-resolve" as EventName<CustomEvent<PullRequestDetail>>,
    onTcChecks: "tc-checks" as EventName<CustomEvent<PullRequestDetail>>,
    onTcCreate: "tc-create" as EventName<CustomEvent<PullRequestDetail>>,
    onTcAction: "tc-action" as EventName<CustomEvent<PullRequestAction>>,
    onTcAutoMergeChange: "tc-auto-merge-change" as EventName<CustomEvent<PullRequestAutoMergeChange>>,
    onTcMergeMethodChange: "tc-merge-method-change" as EventName<CustomEvent<PullRequestMergeMethodChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPullRequest>;
type Owned = "heading" | "autoMerge" | "mergeMethod" | "onTcAutoMergeChange" | "onTcMergeMethodChange" | "children";
export type PullRequestProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** Merge on its own once the checks pass – controlled when given */
  autoMerge?: boolean;
  /** At first, when `autoMerge` isn't controlled */
  defaultAutoMerge?: boolean;
  /** The auto-merge switch changed */
  onAutoMergeChange?: (autoMerge: boolean) => void;
  /** How Merge merges – controlled when given */
  mergeMethod?: PullRequestMergeMethod;
  /** At first, when `mergeMethod` isn't controlled */
  defaultMergeMethod?: PullRequestMergeMethod;
  /** Another merge method was picked */
  onMergeMethodChange?: (mergeMethod: PullRequestMergeMethod) => void;
};

export function PullRequest({ title = "Pull request", autoMerge, defaultAutoMerge = false, onAutoMergeChange, mergeMethod, defaultMergeMethod = "merge", onMergeMethodChange, ...props }: PullRequestProps) {
  const a = useControlled<boolean>(autoMerge, defaultAutoMerge, onAutoMergeChange);
  const m = useControlled<PullRequestMergeMethod>(mergeMethod, defaultMergeMethod, onMergeMethodChange);
  return h(RawPullRequest, {
    ...props,
    heading: title,
    autoMerge: a.value,
    mergeMethod: m.value,
    onTcAutoMergeChange: (e: CustomEvent<PullRequestAutoMergeChange>) => a.handler(e.detail.autoMerge, e),
    onTcMergeMethodChange: (e: CustomEvent<PullRequestMergeMethodChange>) => m.handler(e.detail.mergeMethod, e),
  });
}

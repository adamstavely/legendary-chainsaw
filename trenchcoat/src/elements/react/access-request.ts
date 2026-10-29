import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcAccessRequest,
  type AccessCancel,
  type AccessDurationChange,
  type AccessDurationId,
  type AccessLevelChange,
  type AccessRequestDetail,
  type AccessStatus,
  type AccessStatusChange,
} from "../access-request";
import { h, useControlled } from "./internal";

export type {
  AccessCancel,
  AccessDuration,
  AccessDurationChange,
  AccessDurationId,
  AccessLevel,
  AccessLevelChange,
  AccessRequestDetail,
  AccessResource,
  AccessResourceType,
  AccessStatus,
  AccessStatusChange,
  AccessTone,
} from "../access-request";
export { defaultAccessClassifications, defaultAccessDurations, defaultAccessLevels } from "../access-request";

const RawAccessRequest = createComponent({
  tagName: "tc-access-request",
  elementClass: TcAccessRequest,
  react: React,
  events: {
    onTcRequest: "tc-request" as EventName<CustomEvent<AccessRequestDetail>>,
    onTcStatusChange: "tc-status-change" as EventName<CustomEvent<AccessStatusChange>>,
    onTcCancel: "tc-cancel" as EventName<CustomEvent<AccessCancel>>,
    onTcLevelChange: "tc-level-change" as EventName<CustomEvent<AccessLevelChange>>,
    onTcDurationChange: "tc-duration-change" as EventName<CustomEvent<AccessDurationChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAccessRequest>;
type Owned = "heading" | "status" | "level" | "duration" | "onTcRequest" | "onTcStatusChange" | "onTcCancel" | "onTcLevelChange" | "onTcDurationChange" | "children";
export type AccessRequestProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** Where the request stands – controlled when given */
  status?: AccessStatus;
  /** The status on mount when `status` isn't controlled */
  defaultStatus?: AccessStatus;
  /** The status changed: pending after a request, draft after Cancel or Request again */
  onStatusChange?: (status: AccessStatus) => void;
  /** The picked level – controlled when given */
  level?: string;
  /** The level on mount when `level` isn't controlled */
  defaultLevel?: string;
  /** A level was picked */
  onLevelChange?: (level: string) => void;
  /** The picked duration – controlled when given */
  duration?: AccessDurationId;
  /** The duration on mount when `duration` isn't controlled */
  defaultDuration?: AccessDurationId;
  /** A duration was picked */
  onAccessDurationChange?: (duration: AccessDurationId) => void;
  /** The form was sent; return false to keep the form as it is (e.g. the request failed) */
  onRequest?: (request: AccessRequestDetail) => boolean | void;
  /** Cancel request was used; return false to keep the request pending */
  onCancelRequest?: () => boolean | void;
};

export function AccessRequest({
  title,
  status,
  defaultStatus = "draft",
  onStatusChange,
  level,
  defaultLevel,
  onLevelChange,
  duration,
  defaultDuration,
  onAccessDurationChange,
  onRequest,
  onCancelRequest,
  ...props
}: AccessRequestProps) {
  const s = useControlled<AccessStatus>(status, defaultStatus, onStatusChange);
  // Kept here as well, so a parent's re-render doesn't put the element's own pick back
  const l = useControlled<string | undefined>(level, defaultLevel, onLevelChange ? (v) => v !== undefined && onLevelChange(v) : undefined);
  const d = useControlled<AccessDurationId | undefined>(duration, defaultDuration, onAccessDurationChange ? (v) => v !== undefined && onAccessDurationChange(v) : undefined);
  return h(RawAccessRequest, {
    ...props,
    heading: title ?? "Request access",
    status: s.value,
    level: l.value,
    duration: d.value,
    onTcLevelChange: (e: CustomEvent<AccessLevelChange>) => l.handler(e.detail.level, e),
    onTcDurationChange: (e: CustomEvent<AccessDurationChange>) => d.handler(e.detail.duration, e),
    onTcStatusChange: (e: CustomEvent<AccessStatusChange>) => s.handler(e.detail.status, e),
    onTcRequest: (e: CustomEvent<AccessRequestDetail>) => {
      if (onRequest?.(e.detail) === false) e.preventDefault();
    },
    onTcCancel: (e: CustomEvent<AccessCancel>) => {
      if (onCancelRequest?.() === false) e.preventDefault();
    },
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAccessRequest, type AccessCancel, type AccessRequestDetail, type AccessStatus, type AccessStatusChange } from "../access-request";
import { h, useControlled } from "./internal";

export type {
  AccessCancel,
  AccessDuration,
  AccessDurationId,
  AccessLevel,
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
  },
});
type RawProps = React.ComponentProps<typeof RawAccessRequest>;
type Owned = "heading" | "status" | "onTcRequest" | "onTcStatusChange" | "onTcCancel" | "children";
export type AccessRequestProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** Where the request stands – controlled when given */
  status?: AccessStatus;
  /** The status on mount when `status` isn't controlled */
  defaultStatus?: AccessStatus;
  /** The status changed: pending after a request, draft after Cancel or Request again */
  onStatusChange?: (status: AccessStatus) => void;
  /** The form was sent; return false to keep the form as it is (e.g. the request failed) */
  onRequest?: (request: AccessRequestDetail) => boolean | void;
  /** Cancel request was used; return false to keep the request pending */
  onCancelRequest?: () => boolean | void;
};

export function AccessRequest({ title, status, defaultStatus = "draft", onStatusChange, onRequest, onCancelRequest, ...props }: AccessRequestProps) {
  const s = useControlled<AccessStatus>(status, defaultStatus, onStatusChange);
  return h(RawAccessRequest, {
    ...props,
    heading: title ?? "Request access",
    status: s.value,
    onTcStatusChange: (e: CustomEvent<AccessStatusChange>) => s.handler(e.detail.status, e),
    onTcRequest: (e: CustomEvent<AccessRequestDetail>) => {
      if (onRequest?.(e.detail) === false) e.preventDefault();
    },
    onTcCancel: (e: CustomEvent<AccessCancel>) => {
      if (onCancelRequest?.() === false) e.preventDefault();
    },
  });
}

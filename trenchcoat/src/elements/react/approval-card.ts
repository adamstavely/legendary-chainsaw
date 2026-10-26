import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcApprovalCard, type ApprovalDeny, type ApprovalStatus, type ApprovalStatusChange, type DenyReason } from "../approval-card";
import { h, isNode, useStaged } from "./internal";

export type { ApprovalRisk, ApprovalStatus, DenyReason } from "../approval-card";
/** React nodes in place of elements */
export type ApprovalDetail = { label: string; value: React.ReactNode };

const RawApprovalCard = createComponent({
  tagName: "tc-approval-card",
  elementClass: TcApprovalCard,
  react: React,
  events: {
    onTcStatusChange: "tc-status-change" as EventName<CustomEvent<ApprovalStatusChange>>,
    onTcDeny: "tc-deny" as EventName<CustomEvent<ApprovalDeny>>,
    onTcEdit: "tc-edit" as EventName<CustomEvent<null>>,
    onTcExpire: "tc-expire" as EventName<CustomEvent<null>>,
  },
});
type RawApprovalCardProps = React.ComponentProps<typeof RawApprovalCard>;
type Nodes = "heading" | "description" | "icon" | "details" | "preview" | "label" | "status" | "editable";
export type ApprovalCardProps = Omit<RawApprovalCardProps, Nodes | "onTcStatusChange" | "onTcDeny" | "onTcEdit" | "onTcExpire" | "children"> & {
  /** The action, e.g. "Send campaign email" */
  title: string;
  /** One line of context below the title */
  description?: React.ReactNode;
  /** Icon in the header tile – defaults to a small shield */
  icon?: React.ReactNode;
  /** Key-value rows in the preview, e.g. To, Subject, Scheduled */
  details?: ApprovalDetail[];
  /** Anything to show above the details, e.g. a recipient list – children work too */
  preview?: React.ReactNode;
  /** The preview, when `preview` isn't given */
  children?: React.ReactNode;
  /** Small label on the gray tray above the card */
  label?: React.ReactNode;
  /** The status. Controlled when defined – the card then only asks for changes through `onStatusChange` */
  status?: ApprovalStatus;
  /** Starting status when `status` isn't controlled */
  defaultStatus?: ApprovalStatus;
  /** Called with the new status whenever the card is approved, denied or expires (controlled or not) */
  onStatusChange?: (status: ApprovalStatus) => void;
  /** Called when the card is denied, by the user or by the countdown (`reason: "timeout"`) */
  onDeny?: (decision: { reason: DenyReason }) => void;
  /** Shows an "Edit" button */
  onEdit?: () => void;
  /** Called when the countdown runs out (onDeny is called too) */
  onExpire?: () => void;
};

/**
 * Like useControlled, but an uncontrolled value is tracked here as well: the wrapper sets every prop on each render, so
 * passing the starting value again would undo the decision whenever the parent re-renders
 */
function useValue<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const handler = (next: T, event: Event) => {
    if (controlled) event.preventDefault();
    else setInner(next);
    onChange?.(next);
  };
  return { value: controlled ? value : inner, handler };
}

/** Text stays text; other React nodes are staged under `key` */
const textOf = (n: React.ReactNode) => (typeof n === "string" || typeof n === "number" ? String(n) : undefined);

export function ApprovalCard({
  title,
  description,
  icon,
  details,
  preview,
  children,
  label,
  status,
  defaultStatus = "pending",
  onStatusChange,
  onDeny,
  onEdit,
  onExpire,
  ...props
}: ApprovalCardProps) {
  const body = preview ?? children;
  const staged: [string, React.ReactNode][] = [];
  const stage = (key: string, n: React.ReactNode) => {
    if (n == null || n === false || textOf(n) !== undefined) return;
    // One element as it is; anything else in a box that doesn't affect layout
    staged.push([key, React.isValidElement(n) && n.type !== React.Fragment ? n : h("span", { style: { display: "contents" } }, n)]);
  };
  stage("description", description);
  if (isNode(icon)) stage("icon", icon);
  stage("preview", body);
  stage("label", label);
  details?.forEach((d, i) => stage(`detail-${i}`, d.value));
  const { stage: box, els } = useStaged(staged);
  const pick = (key: string, n: React.ReactNode) => textOf(n) ?? (n == null || n === false ? undefined : els[key]);
  const s = useValue(status, defaultStatus, onStatusChange);
  return h(React.Fragment, null, box, h(RawApprovalCard, {
    ...props,
    heading: title,
    description: pick("description", description),
    icon: isNode(icon) ? els.icon : (icon as Element | undefined),
    preview: pick("preview", body),
    label: pick("label", label),
    details: details?.map((d, i) => ({ label: d.label, value: pick(`detail-${i}`, d.value) ?? "" })),
    status: s.value,
    editable: !!onEdit,
    onTcStatusChange: (e: CustomEvent<ApprovalStatusChange>) => s.handler(e.detail.status, e),
    onTcDeny: (e: CustomEvent<ApprovalDeny>) => onDeny?.(e.detail),
    onTcEdit: () => onEdit?.(),
    onTcExpire: () => onExpire?.(),
  }));
}

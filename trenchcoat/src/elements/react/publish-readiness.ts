import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcPublishReadiness,
  type ReadinessBlocker,
  type ReadinessCheck,
  type ReadinessConfirmedChange,
  type ReadinessOpenBlocker,
  type ReadinessOpenChange,
} from "../publish-readiness";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { ReadinessBlocker, ReadinessCheck, ReadinessConfirmedChange, ReadinessOpenBlocker, ReadinessOpenChange, ReadinessState } from "../publish-readiness";

const RawPublishReadiness = createComponent({
  tagName: "tc-publish-readiness",
  elementClass: TcPublishReadiness,
  react: React,
  events: {
    onTcConfirmedChange: "tc-confirmed-change" as EventName<CustomEvent<ReadinessConfirmedChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<ReadinessOpenChange>>,
    onTcOpenBlocker: "tc-open-blocker" as EventName<CustomEvent<ReadinessOpenBlocker>>,
    onTcPublish: "tc-publish" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPublishReadiness>;
type Owned =
  | "heading"
  | "confirmed"
  | "open"
  | "description"
  | "note"
  | "plainBlockers"
  | "publishDisabled"
  | "onTcConfirmedChange"
  | "onTcOpenChange"
  | "onTcOpenBlocker"
  | "onTcPublish"
  | "children";
export type PublishReadinessProps = Omit<RawProps, Owned> & {
  /** The dialog's heading – "Ready to publish?" by default */
  title?: string;
  /** The line under the summary's title */
  description?: React.ReactNode;
  /** Who approves and what happens next – a note above the action */
  note?: React.ReactNode;
  /** Ids of the manual checks the person has signed off (controlled) */
  confirmed?: string[];
  /** Signed off at first when uncontrolled */
  defaultConfirmed?: string[];
  /** Called with every change to the signed-off ids */
  onConfirmedChange?: (ids: string[]) => void;
  /** Whether the dialog is open (controlled) */
  open?: boolean;
  /** The checks dialog is open at first (uncontrolled) */
  defaultOpen?: boolean;
  /** The checks dialog opened or closed */
  onOpenChange?: (open: boolean) => void;
  /** A blocker's link was followed – open the place it points at. Without it, blockers are plain text */
  onOpenBlocker?: (blocker: ReadinessBlocker, check: ReadinessCheck) => void;
  /** The release action – enabled once nothing blocks and every sign-off is given; without it the action stays off */
  onPublish?: () => void;
};

const NONE: string[] = [];

export function PublishReadiness({ title, description, note, confirmed, defaultConfirmed = NONE, onConfirmedChange, open, defaultOpen = false, onOpenChange, onOpenBlocker, onPublish, ...props }: PublishReadinessProps) {
  const c = useControlled(confirmed, defaultConfirmed, onConfirmedChange);
  const o = useControlled(open, defaultOpen, onOpenChange);
  const nodes: [string, React.ReactNode][] = [];
  // Wrapped in a span: the staging box hands over one element, and a fragment would lose its text
  if (isNode(description)) nodes.push(["description", h("span", null, description)]);
  if (isNode(note)) nodes.push(["note", h("span", null, note)]);
  const { stage, els } = useStaged(nodes);
  const text = (v: React.ReactNode) => (typeof v === "string" || typeof v === "number" ? String(v) : undefined);
  return h(
    React.Fragment,
    null,
    stage,
    h(RawPublishReadiness, {
      ...props,
      heading: title ?? "Ready to publish?",
      description: isNode(description) ? els.description : text(description),
      note: isNode(note) ? els.note : text(note),
      confirmed: c.value,
      open: o.value,
      plainBlockers: !onOpenBlocker,
      publishDisabled: !onPublish,
      onTcConfirmedChange: (e: CustomEvent<ReadinessConfirmedChange>) => c.handler(e.detail.confirmed, e),
      onTcOpenChange: (e: CustomEvent<ReadinessOpenChange>) => o.handler(e.detail.open, e),
      onTcOpenBlocker: (e: CustomEvent<ReadinessOpenBlocker>) => onOpenBlocker?.(e.detail.blocker, e.detail.check),
      onTcPublish: () => onPublish?.(),
    }),
  );
}

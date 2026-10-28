"use client";

import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";
import { PublishReadiness as TcPublishReadiness, type Look, type ReadinessBlocker, type ReadinessCheck } from "trenchcoat/react";

/*
 * Publish Readiness – what must pass before something is released. A summary card says how close the release is
 * (checks passed, blockers left) and opens a dialog that walks through every check: the library's Progress Tracker
 * (sign-offs tick by hand, automated checks are read-only rows), each failing check with the blockers behind it, every
 * blocker a link the app opens, checks still to run and who approves – and the publish action, held back while
 * anything blocks.
 * The block is the <tc-publish-readiness> element through `trenchcoat/react` – the same component Angular, Vue and
 * plain HTML get – kept here with its original props. The look follows the nearest <LookProvider>, or the `look` prop.
 */

export type { ReadinessBlocker, ReadinessCheck, ReadinessState } from "trenchcoat/react";

type OwnProps = {
  /** What is being released, e.g. "Daily briefing" */
  subject: string;
  /** Its version, e.g. "v1.3" */
  version?: string;
  checks: ReadinessCheck[];
  /** Ids of the manual checks the person has signed off (controlled) */
  confirmed?: string[];
  /** Signed off at first when uncontrolled */
  defaultConfirmed?: string[];
  /** Called with every change to the signed-off ids */
  onConfirmedChange?: (ids: string[]) => void;
  /** Whether the dialog is open (controlled) */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** A blocker's link was followed – open the place it points at */
  onOpenBlocker?: (blocker: ReadinessBlocker, check: ReadinessCheck) => void;
  /** The release action – enabled once nothing blocks and every sign-off is given */
  onPublish?: () => void;
  /** The dialog's heading – "Ready to publish?" by default */
  title?: string;
  /** The line under the summary's title */
  description?: ReactNode;
  /** Who approves and what happens next – a note above the action */
  note?: ReactNode;
  /** The action's label – "Submit for approval" by default */
  publishLabel?: string;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element – the <tc-publish-readiness> element */
  ref?: Ref<HTMLDivElement>;
};

export type PublishReadinessProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

export function PublishReadiness({
  subject,
  version,
  checks,
  confirmed,
  defaultConfirmed,
  onConfirmedChange,
  open,
  defaultOpen,
  onOpenChange,
  onOpenBlocker,
  onPublish,
  title,
  description,
  note,
  publishLabel = "Submit for approval",
  look,
  className,
  ref,
  ...rest
}: PublishReadinessProps) {
  return (
    <TcPublishReadiness
      // The block's DOM props land on the element, its root
      {...(rest as object)}
      ref={ref as Ref<never>}
      className={["ui-prd", className].filter(Boolean).join(" ")}
      look={look}
      subject={subject}
      version={version}
      checks={checks}
      confirmed={confirmed}
      defaultConfirmed={defaultConfirmed}
      onConfirmedChange={onConfirmedChange}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      onOpenBlocker={onOpenBlocker}
      onPublish={onPublish}
      title={title}
      description={description}
      note={note}
      publishLabel={publishLabel}
    />
  );
}

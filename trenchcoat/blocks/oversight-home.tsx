"use client";

import type { ComponentPropsWithoutRef, Ref } from "react";
import { OversightHome as TcOversightHome, type Look, type OversightRole, type ServiceState } from "trenchcoat/react";

/*
 * Oversight Home – the first screen for someone who oversees AI work. Each role gets its own home; switch roles at
 * the top right. A home has the day and the role with a headline that says what needs doing, the one thing that needs
 * this person first, the library's KPI Chart for each number the role watches (this week against the last), and the
 * service posture in the library's Data Table with a filter by state.
 * The block is the <tc-oversight-home> element through `trenchcoat/react` – the same component Angular, Vue and plain
 * HTML get – kept here with its original props. The look follows the nearest <LookProvider>, or the `look` prop.
 */

export type { OversightKpi, OversightRole, OversightService, ServiceState } from "trenchcoat/react";

type OwnProps = {
  roles: OversightRole[];
  /** Id of the role on show (controlled) */
  role?: string;
  /** The role at first when uncontrolled – the first one by default */
  defaultRole?: string;
  /** Called when another role is picked */
  onRoleChange?: (id: string) => void;
  /** The focus card's action was pressed */
  onOpenFocus?: (role: OversightRole) => void;
  /** Words for the service states – "Normal", "Limited", "Down", "Unknown" by default */
  stateLabels?: Partial<Record<ServiceState, string>>;
  /** Names of the two lines in each chart */
  currentLabel?: string;
  previousLabel?: string;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element – the <tc-oversight-home> element */
  ref?: Ref<HTMLDivElement>;
};

export type OversightHomeProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

export function OversightHome({
  roles,
  role,
  defaultRole,
  onRoleChange,
  onOpenFocus,
  stateLabels,
  currentLabel = "This week",
  previousLabel = "Last week",
  look,
  className,
  ref,
  ...rest
}: OversightHomeProps) {
  return (
    <TcOversightHome
      // The block's DOM props land on the element, its root
      {...(rest as object)}
      ref={ref as Ref<never>}
      className={["ui-ovh", className].filter(Boolean).join(" ")}
      look={look}
      roles={roles}
      role={role}
      defaultRole={defaultRole}
      onRoleChange={onRoleChange}
      onOpenFocus={onOpenFocus}
      stateLabels={stateLabels ?? {}}
      currentLabel={currentLabel}
      previousLabel={previousLabel}
    />
  );
}

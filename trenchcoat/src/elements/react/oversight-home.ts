import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcOversightHome, type OversightOpenFocus, type OversightRole, type OversightRoleChange } from "../oversight-home";
import { h, useControlled } from "./internal";

export type { OversightKpi, OversightOpenFocus, OversightRole, OversightRoleChange, OversightService, ServiceState } from "../oversight-home";
export { defaultServiceStateLabels } from "../oversight-home";

const RawOversightHome = createComponent({
  tagName: "tc-oversight-home",
  elementClass: TcOversightHome,
  react: React,
  events: {
    onTcRoleChange: "tc-role-change" as EventName<CustomEvent<OversightRoleChange>>,
    onTcOpenFocus: "tc-open-focus" as EventName<CustomEvent<OversightOpenFocus>>,
  },
});
type RawProps = React.ComponentProps<typeof RawOversightHome>;
type Owned = "role" | "roleId" | "hideFocusAction" | "onTcRoleChange" | "onTcOpenFocus" | "children";
export type OversightHomeProps = Omit<RawProps, Owned> & {
  /** Id of the role on show (controlled) */
  role?: string;
  /** The role at first when uncontrolled – the first one by default */
  defaultRole?: string;
  /** Called when another role is picked */
  onRoleChange?: (id: string) => void;
  /** The focus card's action was pressed; without it the action isn't shown */
  onOpenFocus?: (role: OversightRole) => void;
};

export function OversightHome({ role, defaultRole, onRoleChange, onOpenFocus, ...props }: OversightHomeProps) {
  const r = useControlled(role, defaultRole ?? props.roles?.[0]?.id ?? "", onRoleChange);
  return h(RawOversightHome, {
    ...props,
    roleId: r.value || undefined,
    hideFocusAction: !onOpenFocus,
    onTcRoleChange: (e: CustomEvent<OversightRoleChange>) => r.handler(e.detail.roleId, e),
    onTcOpenFocus: (e: CustomEvent<OversightOpenFocus>) => onOpenFocus?.(e.detail.role),
  });
}

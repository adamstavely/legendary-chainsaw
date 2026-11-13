import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRoleEditor, type Role, type RoleDiff, type RoleEditCause, type RolesChange, type RolesSave } from "../role-editor";
import { h, useControlled } from "./internal";

export type { Role, RoleDiff, RoleEditCause, RolePermission, RolePermissionGroup, RolesChange, RolesSave } from "../role-editor";
export { defaultRolePermissionGroups } from "../role-editor";

const RawRoleEditor = createComponent({
  tagName: "tc-role-editor",
  elementClass: TcRoleEditor,
  react: React,
  events: {
    onTcRolesChange: "tc-roles-change" as EventName<CustomEvent<RolesChange>>,
    onTcRolesSave: "tc-roles-save" as EventName<CustomEvent<RolesSave>>,
  },
});
type Owned = "heading" | "roles" | "saved" | "onTcRolesChange" | "onTcRolesSave" | "children";
export type RoleEditorProps = Omit<React.ComponentProps<typeof RawRoleEditor>, Owned> & {
  /** The heading, and the grid's name */
  title?: string;
  /** The roles – controlled when given */
  roles?: Role[];
  /** The roles on mount, when `roles` isn't controlled */
  defaultRoles?: Role[];
  /** Called with the next roles and what changed */
  onRolesChange?: (roles: Role[], change: RoleEditCause) => void;
  /** What was last saved – controlled when given; otherwise the first roles, then whatever Save stores */
  saved?: Role[];
  /** Save was pressed – store the roles; return false to keep the changes listed (a failed save) */
  onRolesSave?: (roles: Role[], changes: RoleDiff[]) => void | boolean;
};
const NONE: Role[] = [];

export function RoleEditor({ title, roles, defaultRoles = NONE, onRolesChange, saved, onRolesSave, ...props }: RoleEditorProps) {
  const cause = React.useRef<RoleEditCause>({ type: "discard" });
  const report = React.useCallback((next: Role[]) => onRolesChange?.(next, cause.current), [onRolesChange]);
  const r = useControlled(roles, defaultRoles, onRolesChange ? report : undefined);
  const s = useControlled<Role[] | undefined>(saved, undefined, undefined);
  return h(RawRoleEditor, {
    ...props,
    heading: title ?? "Roles",
    roles: r.value,
    saved: s.value,
    onTcRolesChange: (e: CustomEvent<RolesChange>) => {
      cause.current = e.detail.change;
      r.handler(e.detail.roles, e);
    },
    onTcRolesSave: (e: CustomEvent<RolesSave>) => {
      if (onRolesSave?.(e.detail.roles, e.detail.changes) === false) {
        e.preventDefault();
        return;
      }
      s.handler(e.detail.roles.map((x) => ({ ...x, permissions: [...x.permissions] })), e);
    },
  });
}

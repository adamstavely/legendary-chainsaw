import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcToolPermissions,
  type ToolPermissionAgent as ElementAgent,
  type ToolPermissionChange,
  type ToolPermissionMatrix,
  type ToolPermissionSave,
  type ToolPermissionTool as ElementTool,
  type ToolPermissionValueChange,
} from "../tool-permissions";
import { h, isNode, useControlled, useStaged } from "./internal";

export type {
  ToolPermissionCause,
  ToolPermissionChange,
  ToolPermissionLevel,
  ToolPermissionMatrix,
  ToolPermissionPreset,
  ToolPermissionRisk,
  ToolPermissionScope,
} from "../tool-permissions";
export { defaultToolPermissionPresets } from "../tool-permissions";
/** A column, its avatar a React node */
export type ToolPermissionAgent = Omit<ElementAgent, "avatar"> & { avatar?: React.ReactNode };
/** A tool and its scopes, its mark a React node */
export type ToolPermissionTool = Omit<ElementTool, "icon"> & { icon?: React.ReactNode };

const RawToolPermissions = createComponent({
  tagName: "tc-tool-permissions",
  elementClass: TcToolPermissions,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<ToolPermissionValueChange>>,
    onTcSave: "tc-save" as EventName<CustomEvent<ToolPermissionSave>>,
  },
});
type RawProps = React.ComponentProps<typeof RawToolPermissions>;
type Owned = "heading" | "agents" | "tools" | "value" | "saved" | "onTcValueChange" | "onTcSave" | "onChange" | "defaultValue" | "children";
export type ToolPermissionsProps = Omit<RawProps, Owned> & {
  /** The heading, and the grid's name */
  title?: string;
  /** The columns: one per agent, with an optional avatar node and model name */
  agents: ToolPermissionAgent[];
  /** The rows: each tool's scopes, grouped under the tool */
  tools: ToolPermissionTool[];
  /** The matrix – controlled when given */
  value?: ToolPermissionMatrix;
  /** The matrix on mount when `value` isn't controlled – a missing cell is `defaultLevel` */
  defaultValue?: ToolPermissionMatrix;
  /** A cell, a preset or Reset changed the matrix; `detail` says which and lists the changes since the last save */
  onChange?: (value: ToolPermissionMatrix, detail: Omit<ToolPermissionValueChange, "value">) => void;
  /** What was last saved – controlled when given; otherwise the first value, then whatever Save stores */
  saved?: ToolPermissionMatrix;
  /** Save was pressed – store the value; the summary then starts from it */
  onSave?: (value: ToolPermissionMatrix, changes: ToolPermissionChange[]) => void;
};
const EMPTY: ToolPermissionMatrix = {};

export function ToolPermissions({ title, agents, tools, value, defaultValue = EMPTY, onChange, saved, onSave, ...props }: ToolPermissionsProps) {
  const nodes: [string, React.ReactNode][] = [];
  for (const a of agents) if (isNode(a.avatar)) nodes.push([`agent:${a.id}`, a.avatar]);
  for (const t of tools) if (isNode(t.icon)) nodes.push([`tool:${t.id}`, t.icon]);
  const { stage, els } = useStaged(nodes);
  const cols = React.useMemo<ElementAgent[]>(() => agents.map((a) => ({ ...a, avatar: isNode(a.avatar) ? els[`agent:${a.id}`] : (a.avatar as Element | undefined) })), [agents, els]);
  const rows = React.useMemo<ElementTool[]>(() => tools.map((t) => ({ ...t, icon: isNode(t.icon) ? els[`tool:${t.id}`] : (t.icon as Element | undefined) })), [tools, els]);
  const detail = React.useRef<Omit<ToolPermissionValueChange, "value">>({ changes: [], cause: { type: "reset" } });
  const report = React.useCallback((next: ToolPermissionMatrix) => onChange?.(next, detail.current), [onChange]);
  const v = useControlled(value, defaultValue, onChange ? report : undefined);
  const s = useControlled<ToolPermissionMatrix | undefined>(saved, undefined, undefined);
  return h(
    React.Fragment,
    null,
    stage,
    h(RawToolPermissions, {
      ...props,
      heading: title ?? "Tool permissions",
      agents: cols,
      tools: rows,
      value: v.value,
      saved: s.value,
      onTcValueChange: (e: CustomEvent<ToolPermissionValueChange>) => {
        detail.current = { changes: e.detail.changes, cause: e.detail.cause };
        v.handler(e.detail.value, e);
      },
      onTcSave: (e: CustomEvent<ToolPermissionSave>) => {
        s.handler(structuredClone(e.detail.value), e);
        onSave?.(e.detail.value, e.detail.changes);
      },
    }),
  );
}

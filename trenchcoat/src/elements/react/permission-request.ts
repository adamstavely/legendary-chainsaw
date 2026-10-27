import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcPermissionRequest,
  type PermissionAgent,
  type PermissionDecision,
  type PermissionPreviewItem as ElementPreviewItem,
  type PermissionScope,
} from "../permission-request";
import { h, isNode, useStaged } from "./internal";

export type { PermissionDecision, PermissionRisk, PermissionScope } from "../permission-request";
/** A row of the preview, its icon and meta React nodes */
export type PermissionPreviewItem = Omit<ElementPreviewItem, "icon" | "meta"> & { meta?: React.ReactNode; icon?: React.ReactNode };

/**
 * useControlled, except an uncontrolled value is mirrored here: @lit/react sets every prop on every render, so passing
 * the starting value back would undo the user's change whenever the parent re-renders
 */
function useOwned<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const [own, setOwn] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const handler = (next: T, event: Event) => {
    if (controlled) event.preventDefault();
    else setOwn(next);
    onChange?.(next);
  };
  return { value: controlled ? value : own, handler };
}

const RawPermissionRequest = createComponent({
  tagName: "tc-permission-request",
  elementClass: TcPermissionRequest,
  react: React,
  events: {
    onTcDecisionChange: "tc-decision-change" as EventName<CustomEvent<{ decision: PermissionDecision | null }>>,
    onTcScopeChange: "tc-scope-change" as EventName<CustomEvent<{ scope: PermissionScope }>>,
    onTcExpire: "tc-expire" as EventName<CustomEvent<{ decision: PermissionDecision }>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPermissionRequest>;
export type PermissionRequestProps = Omit<RawProps, "agent" | "toolIcon" | "preview" | "scope" | "decision" | "onTcDecisionChange" | "onTcScopeChange" | "onTcExpire"> & {
  /** Who asks: { name, model?, avatar? } */
  agent: { name: string; model?: string; avatar?: React.ReactNode };
  /** The tool's mark next to the target */
  toolIcon?: React.ReactNode;
  /** What will happen if you allow it – files, recipients, amounts */
  preview?: PermissionPreviewItem[];
  /** Controlled choice of how long */
  scope?: PermissionScope;
  /** The starting choice of how long, when `scope` isn't controlled */
  defaultScope?: PermissionScope;
  /** The user picked how long */
  onScopeChange?: (scope: PermissionScope) => void;
  /** Controlled decision – null while it waits */
  decision?: PermissionDecision | null;
  /** The starting decision, when `decision` isn't controlled */
  defaultDecision?: PermissionDecision | null;
  /** Allow, Deny, Revoke (null) – the agent should listen to this */
  onDecisionChange?: (decision: PermissionDecision | null) => void;
  /** Fires once when a timed right runs out (the decision stays, shown as "Access expired") */
  onExpire?: (decision: PermissionDecision) => void;
};
const NO_PREVIEW: PermissionPreviewItem[] = [];
const isText = (v: unknown): v is string | number => typeof v === "string" || typeof v === "number";

export function PermissionRequest({
  agent,
  toolIcon,
  preview = NO_PREVIEW,
  scope,
  defaultScope = "once",
  onScopeChange,
  decision,
  defaultDecision = null,
  onDecisionChange,
  onExpire,
  ...props
}: PermissionRequestProps) {
  // Icons, the avatar and node metas render in the staging box; the element clones them
  const nodes: [string, React.ReactNode][] = [];
  if (isNode(agent.avatar)) nodes.push(["avatar", agent.avatar]);
  if (isNode(toolIcon)) nodes.push(["tool", toolIcon]);
  for (const p of preview) {
    if (isNode(p.icon)) nodes.push([`icon:${p.id}`, p.icon]);
    if (isNode(p.meta)) nodes.push([`meta:${p.id}`, h("span", null, p.meta)]);
  }
  const { stage, els } = useStaged(nodes);
  const who = React.useMemo<PermissionAgent>(() => ({ ...agent, avatar: isNode(agent.avatar) ? els.avatar : (agent.avatar as Element | undefined) }), [agent, els]);
  const rows = React.useMemo(
    () =>
      preview.map((p) => ({
        ...p,
        icon: isNode(p.icon) ? els[`icon:${p.id}`] : (p.icon as Element | undefined),
        meta: isText(p.meta) ? String(p.meta) : isNode(p.meta) ? els[`meta:${p.id}`] : undefined,
      })) as ElementPreviewItem[],
    [preview, els],
  );
  const s = useOwned(scope, defaultScope, onScopeChange);
  const d = useOwned<PermissionDecision | null>(decision, defaultDecision, onDecisionChange);
  return h(React.Fragment, null, stage, h(RawPermissionRequest, {
    ...props,
    agent: who,
    toolIcon: isNode(toolIcon) ? els.tool : (toolIcon as Element | undefined),
    preview: rows,
    scope: s.value,
    decision: d.value,
    onTcScopeChange: (e: CustomEvent<{ scope: PermissionScope }>) => s.handler(e.detail.scope, e),
    onTcDecisionChange: (e: CustomEvent<{ decision: PermissionDecision | null }>) => d.handler(e.detail.decision, e),
    onTcExpire: (e: CustomEvent<{ decision: PermissionDecision }>) => onExpire?.(e.detail.decision),
  }));
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcToolCallCard, TcToolCallGroup, type ToolCallOpenChange } from "../tool-call-card";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { ToolCallStatus } from "../tool-call-card";

const RawToolCallCard = createComponent({
  tagName: "tc-tool-call-card",
  elementClass: TcToolCallCard,
  react: React,
  events: { onTcOpenChange: "tc-open-change" as EventName<CustomEvent<ToolCallOpenChange>> },
});
const RawToolCallGroup = createComponent({
  tagName: "tc-tool-call-group",
  elementClass: TcToolCallGroup,
  react: React,
  events: { onTcOpenChange: "tc-open-change" as EventName<CustomEvent<ToolCallOpenChange>> },
});

type RawCardProps = React.ComponentProps<typeof RawToolCallCard>;
export type ToolCallCardProps = Omit<RawCardProps, "summary" | "icon" | "open" | "onTcOpenChange" | "name" | "status"> & {
  /** Tool name as the agent calls it, shown in mono – e.g. "search_web" */
  name: string;
  /** "running" shows a spinner and a live timer, "success" a check and the duration, "error" "Failed" and the message */
  status: TcToolCallCard["status"];
  /** Short human summary – e.g. "Searched the web for 'CRM pricing 2026'" */
  summary?: React.ReactNode;
  /** Icon in the tile on the left – defaults to a wrench */
  icon?: React.ReactNode;
  /** Start expanded (uncontrolled) */
  defaultOpen?: boolean;
  /** Expanded state (controlled) */
  open?: boolean;
  /** Called when the card opens or closes – by a click, or on its own when the call fails */
  onOpenChange?: (open: boolean) => void;
};
export function ToolCallCard({ summary, icon, defaultOpen = false, open, onOpenChange, openOnError = true, ...props }: ToolCallCardProps) {
  const text = typeof summary === "string" || typeof summary === "number" ? String(summary) : undefined;
  const nodes: [string, React.ReactNode][] = [];
  if (isNode(icon)) nodes.push(["icon", icon]);
  if (summary != null && text === undefined && isNode(summary)) nodes.push(["summary", h("span", null, summary)]);
  const { stage, els } = useStaged(nodes);
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(React.Fragment, null, stage, h(RawToolCallCard, {
    ...props,
    icon: isNode(icon) ? els.icon : (icon as Element | undefined),
    summary: text ?? (summary != null ? els.summary : undefined),
    open: o.value,
    // A controlled card isn't opened on error
    openOnError: openOnError && !o.controlled,
    onTcOpenChange: (e: CustomEvent<ToolCallOpenChange>) => o.handler(e.detail.open, e),
  }));
}

type RawGroupProps = React.ComponentProps<typeof RawToolCallGroup>;
export type ToolCallGroupProps = Omit<RawGroupProps, "open" | "onTcOpenChange" | "children"> & {
  /** ToolCallCard elements – the group reads their name, icon, status and duration */
  children: React.ReactNode;
  /** Start expanded (uncontrolled) */
  defaultOpen?: boolean;
  /** Expanded state (controlled) */
  open?: boolean;
  /** Called when the group opens or closes */
  onOpenChange?: (open: boolean) => void;
};
export function ToolCallGroup({ children, defaultOpen = false, open, onOpenChange, ...props }: ToolCallGroupProps) {
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(
    RawToolCallGroup,
    { ...props, open: o.value, onTcOpenChange: (e: CustomEvent<ToolCallOpenChange>) => o.handler(e.detail.open, e) },
    // The body the group folds, around the cards: it grows from 0fr to 1fr, the clip hides the rest
    h("div", { slot: "list", className: "ui-tc__body" }, h("div", { className: "ui-tc__clip" }, h("div", { className: "ui-tc-group__list" }, children))),
  );
}

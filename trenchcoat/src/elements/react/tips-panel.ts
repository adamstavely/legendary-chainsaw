import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTipsPanel, type TipsPanelDoneChange, type TipsPanelTip } from "../tips-panel";
import { h, useControlled, useStaged } from "./internal";

/** A tip: the description may be a React node (e.g. with <Kbd>) */
export type Tip = Omit<TipsPanelTip, "description"> & {
  /** Short explanation – may contain a <Kbd> */
  description: React.ReactNode;
  onAction?: () => void;
};

const RawTipsPanel = createComponent({
  tagName: "tc-tips-panel",
  elementClass: TcTipsPanel,
  react: React,
  events: {
    onTcDoneChange: "tc-done-change" as EventName<CustomEvent<TipsPanelDoneChange>>,
    onTcTipAction: "tc-tip-action" as EventName<CustomEvent<{ id: string }>>,
    onTcClose: "tc-close" as EventName<CustomEvent<null>>,
  },
});
type RawTipsPanelProps = React.ComponentProps<typeof RawTipsPanel>;
export type TipsPanelProps = Omit<RawTipsPanelProps, "heading" | "tips" | "done" | "closable" | "onTcDoneChange" | "onTcTipAction" | "onTcClose"> & {
  title?: string;
  tips: Tip[];
  /** Ids of the tips whose action was taken. Controlled when defined – pair it with `onDoneChange` */
  done?: string[];
  /** Ids already done on mount when `done` isn't controlled */
  defaultDone?: string[];
  /** Called with the new list of done ids whenever a tip's action is taken */
  onDoneChange?: (done: string[]) => void;
  /** Shows the Close button in the footer */
  onClose?: () => void;
};

const NONE: string[] = [];

export function TipsPanel({ title = "Tips", tips, done, defaultDone = NONE, onDoneChange, onClose, ...props }: TipsPanelProps) {
  const { stage, els } = useStaged(tips.filter((t) => typeof t.description !== "string").map((t) => [t.id, h("span", null, t.description)]));
  const data = React.useMemo(
    () => tips.map(({ onAction: _onAction, ...t }) => ({ ...t, description: typeof t.description === "string" ? t.description : (els[t.id] ?? "") })) as TipsPanelTip[],
    [tips, els],
  );
  const v = useControlled(done, defaultDone, onDoneChange);
  return h(React.Fragment, null, stage, h(RawTipsPanel, {
    ...props,
    heading: title,
    tips: data,
    done: v.value,
    closable: !!onClose,
    onTcDoneChange: (e: CustomEvent<TipsPanelDoneChange>) => v.handler(e.detail.done, e),
    onTcTipAction: (e: CustomEvent<{ id: string }>) => tips.find((t) => t.id === e.detail.id)?.onAction?.(),
    onTcClose: () => onClose?.(),
  }));
}

/** Keyboard key for tip descriptions, e.g. <Kbd>⌘K</Kbd> */
export const Kbd = ({ children }: { children: React.ReactNode }) => h("kbd", { className: "ui-tp__kbd" }, children);

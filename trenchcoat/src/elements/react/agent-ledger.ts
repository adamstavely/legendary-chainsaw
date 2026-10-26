import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentLedger, type LedgerEntry as ElementEntry } from "../agent-ledger";
import { h, isNode, useControlled, useStaged } from "./internal";

/** A logo may be a React node, as before */
export type LedgerEntry = Omit<ElementEntry, "icon"> & { icon?: React.ReactNode };

const RawAgentLedger = createComponent({
  tagName: "tc-agent-ledger",
  elementClass: TcAgentLedger,
  react: React,
  events: {
    onTcUndoneChange: "tc-undone-change" as EventName<CustomEvent<{ undone: string[] }>>,
  },
});
type RawAgentLedgerProps = React.ComponentProps<typeof RawAgentLedger>;
export type AgentLedgerProps = Omit<RawAgentLedgerProps, "heading" | "entries" | "undone" | "now" | "pointAt" | "onUndo" | "onRedo" | "onTcUndoneChange"> & {
  /** The changes the agent made, in any order – listed newest first; `icon` may be a React node */
  entries: LedgerEntry[];
  /** The clock for "2m ago", in epoch ms – defaults to an internal clock */
  now?: number;
  /** Ids of undone changes. Controlled when defined; otherwise the component keeps them, starting from `defaultUndone` */
  undone?: string[];
  /** Ids undone at first when uncontrolled */
  defaultUndone?: string[];
  /** Every change to the undone ids, as the whole new list */
  onUndoneChange?: (ids: string[]) => void;
  /** Undo sends the change and its reversible dependents, Redo the same set back – plus any undone changes that set
   *  builds on. Either may return a promise: the rows show the result at once and wait; if it rejects they go back
   *  and the bar says so */
  onUndo?: (ids: string[]) => void | Promise<unknown>;
  /** Called with the ids a Redo brings back; a returned promise holds the rows until it settles, a rejection reverts them */
  onRedo?: (ids: string[]) => void | Promise<unknown>;
  /** Lights up a change and what builds on it, as if its Undo were pointed at – e.g. for a walkthrough */
  pointAt?: string | null;
  /** The heading, and the list's name – "Ledger" by default */
  title?: string;
};

const NONE: string[] = [];

export function AgentLedger({ title = "Ledger", entries, now, undone, defaultUndone = NONE, onUndoneChange, onUndo, onRedo, pointAt = null, ...props }: AgentLedgerProps) {
  const { stage, els } = useStaged(entries.filter((e) => isNode(e.icon)).map((e) => [e.id, e.icon]));
  const list = React.useMemo(() => entries.map((e) => (isNode(e.icon) ? { ...e, icon: els[e.id] } : e)) as ElementEntry[], [entries, els]);
  const u = useControlled(undone, defaultUndone, onUndoneChange);
  return h(React.Fragment, null, stage, h(RawAgentLedger, {
    ...props,
    heading: title,
    entries: list,
    now,
    undone: u.value,
    pointAt,
    onUndo,
    onRedo,
    onTcUndoneChange: (e: CustomEvent<{ undone: string[] }>) => u.handler(e.detail.undone, e),
  }));
}

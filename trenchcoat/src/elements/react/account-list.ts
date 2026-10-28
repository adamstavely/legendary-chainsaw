import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAccountList, type AccountOpen, type AccountRecord, type AccountRevealedChange } from "../account-list";
import { h, useControlled } from "./internal";

export type { AccountOpen, AccountRecord, AccountRevealedChange, AccountStat, AccountTone } from "../account-list";
export { defaultAccountStatuses } from "../account-list";

const RawAccountList = createComponent({
  tagName: "tc-account-list",
  elementClass: TcAccountList,
  react: React,
  events: {
    onTcOpen: "tc-open" as EventName<CustomEvent<AccountOpen>>,
    onTcRevealedChange: "tc-revealed-change" as EventName<CustomEvent<AccountRevealedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAccountList>;
type Owned = "heading" | "revealed" | "onTcOpen" | "onTcRevealedChange" | "children";
export type AccountListProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The ids whose identifiers are shown – controlled when given */
  revealed?: string[];
  /** The ids shown on mount when `revealed` isn't controlled */
  defaultRevealed?: string[];
  /** An identifier was shown or masked again; `revealed` is the new list */
  onRevealedChange?: (revealed: string[]) => void;
  /** View was pressed on a row */
  onOpen?: (account: AccountRecord) => void;
};

const NONE: string[] = [];

export function AccountList({ title, revealed, defaultRevealed = NONE, onRevealedChange, onOpen, ...props }: AccountListProps) {
  const r = useControlled<string[]>(revealed, defaultRevealed, onRevealedChange);
  return h(RawAccountList, {
    ...props,
    heading: title ?? "Linked accounts",
    revealed: r.value,
    onTcRevealedChange: (e: CustomEvent<AccountRevealedChange>) => r.handler(e.detail.revealed, e),
    onTcOpen: (e: CustomEvent<AccountOpen>) => onOpen?.(e.detail.account),
  });
}

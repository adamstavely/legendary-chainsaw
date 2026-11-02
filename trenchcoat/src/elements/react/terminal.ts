import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTerminal, type TerminalCommand, type TerminalCopy, type TerminalValueChange } from "../terminal";
import { h, useControlled } from "./internal";

export type { TerminalCommand, TerminalCopy, TerminalValueChange } from "../terminal";

const RawTerminal = createComponent({
  tagName: "tc-terminal",
  elementClass: TcTerminal,
  react: React,
  events: {
    onTcCommand: "tc-command" as EventName<CustomEvent<TerminalCommand>>,
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<TerminalValueChange>>,
    onTcInterrupt: "tc-interrupt" as EventName<CustomEvent<null>>,
    onTcClear: "tc-clear" as EventName<CustomEvent<null>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<TerminalCopy>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTerminal>;
export type TerminalProps = Omit<RawProps, "heading" | "value" | "onTcValueChange" | "children"> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The text in the prompt – controlled when given */
  value?: string;
  /** The text in the prompt at first, when `value` isn't controlled */
  defaultValue?: string;
  /** The text in the prompt changed */
  onValueChange?: (value: string) => void;
};

export function Terminal({ title = "Terminal", value, defaultValue = "", onValueChange, ...props }: TerminalProps) {
  const v = useControlled<string>(value, defaultValue, onValueChange);
  return h(RawTerminal, {
    ...props,
    heading: title,
    value: v.value,
    onTcValueChange: (e: CustomEvent<TerminalValueChange>) => v.handler(e.detail.value, e),
  });
}

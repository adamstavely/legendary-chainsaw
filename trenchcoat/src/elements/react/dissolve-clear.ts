import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDissolveClear, type DissolveClearDetail } from "../dissolve-clear";

export type { DissolveClearDetail } from "../dissolve-clear";

const Raw = createComponent({
  tagName: "tc-dissolve-clear",
  elementClass: TcDissolveClear,
  react: React,
  events: { onTcClear: "tc-clear" as EventName<CustomEvent<DissolveClearDetail>> },
});

export type DissolveClearProps = Omit<React.ComponentProps<typeof Raw>, "onTcClear"> & {
  /** Called before the field clears with the text it had; return false to keep the text */
  onClear?: (value: string) => boolean | void;
};

/** A clear button for a text input whose text dissolves as it's cleared. Wrap the page's own input */
export function DissolveClear({ onClear, ...props }: DissolveClearProps) {
  return React.createElement(Raw, {
    ...props,
    onTcClear: (e: CustomEvent<DissolveClearDetail>) => {
      if (onClear?.(e.detail.value) === false) e.preventDefault();
    },
  });
}

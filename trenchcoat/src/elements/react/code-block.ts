import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCodeBlock, type CodeBlockApply, type CodeBlockCopy, type CodeBlockView, type CodeBlockViewChange } from "../code-block";
import { h, useControlled } from "./internal";

export { codeBlockDiff, codeBlockLanguageLabel, codeBlockTokens } from "../code-block";
export type { CodeBlockApply, CodeBlockDiffLine, CodeBlockToken, CodeBlockTokenType, CodeBlockView } from "../code-block";

const RawCodeBlock = createComponent({
  tagName: "tc-code-block",
  elementClass: TcCodeBlock,
  react: React,
  events: {
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<CodeBlockViewChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<CodeBlockCopy>>,
    onTcApply: "tc-apply" as EventName<CustomEvent<CodeBlockApply>>,
  },
});
type RawCodeBlockProps = React.ComponentProps<typeof RawCodeBlock>;
export type CodeBlockProps = Omit<RawCodeBlockProps, "view" | "applyable" | "onTcViewChange" | "onTcCopy" | "onTcApply" | "onCopy"> & {
  /** "code" or "diff" (controlled) – Diff shows the changes against `current` */
  view?: CodeBlockView;
  /** The view to start with when uncontrolled */
  defaultView?: CodeBlockView;
  /** Called with "code" or "diff" when the Diff button is toggled */
  onViewChange?: (view: CodeBlockView) => void;
  /** Called with the code after Copy put it on the clipboard */
  onCopy?: (text: string) => void;
  /** Shows the Apply button; called with the code, the file name and the language */
  onApply?: (apply: CodeBlockApply) => void;
};
export function CodeBlock({ view, defaultView = "code", onViewChange, onCopy, onApply, ...props }: CodeBlockProps) {
  const v = useControlled(view, defaultView, onViewChange);
  return h(RawCodeBlock, {
    ...props,
    view: v.value,
    applyable: !!onApply,
    onTcViewChange: (e: CustomEvent<CodeBlockViewChange>) => v.handler(e.detail.view, e),
    onTcCopy: (e: CustomEvent<CodeBlockCopy>) => onCopy?.(e.detail.text),
    onTcApply: (e: CustomEvent<CodeBlockApply>) => onApply?.(e.detail),
  });
}

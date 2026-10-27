import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSelectionTranslate, type SelectionTranslateCopy, type SelectionTranslateRequest, type SelectionTranslateTargetChange, type SelectionTranslateTextChange } from "../selection-translate";
import { h, useControlled } from "./internal";

export type { SelectionTranslateRequest, SelectionTranslateResolver, SelectionTranslateTextChange, SelectionTranslation, TranslateLanguage } from "../selection-translate";

const RawSelectionTranslate = createComponent({
  tagName: "tc-selection-translate",
  elementClass: TcSelectionTranslate,
  react: React,
  events: {
    onTcTranslate: "tc-translate" as EventName<CustomEvent<SelectionTranslateRequest>>,
    onTcTargetChange: "tc-target-change" as EventName<CustomEvent<SelectionTranslateTargetChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<SelectionTranslateCopy>>,
    onTcTextChange: "tc-text-change" as EventName<CustomEvent<SelectionTranslateTextChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSelectionTranslate>;
type Wrapped = "text" | "target" | "onTcTranslate" | "onTcTargetChange" | "onTcCopy" | "onTcTextChange" | "children";
export type SelectionTranslateProps = Omit<RawProps, Wrapped> & {
  /** The text, plain. Controlled when defined (with `onTextChange`); otherwise the component keeps it, starting at `defaultText` */
  text?: string;
  /** The text when uncontrolled */
  defaultText?: string;
  /** Called with the new text when Replace puts a translation in place (needs `editable`) */
  onTextChange?: (text: string, change: SelectionTranslateTextChange) => void;
  /** The target language's code. Controlled when defined; otherwise the component keeps it, starting at `defaultTarget` */
  target?: string;
  /** The target language when uncontrolled (default "en") */
  defaultTarget?: string;
  /** Called when the target language is changed in the card – store it to remember the choice */
  onTargetChange?: (target: string) => void;
  /** Called for every translation the card needs; answer with `request.respondWith()`, or leave it to `resolveTranslate`. Return false to take it elsewhere (the card closes) */
  onTranslate?: (request: SelectionTranslateRequest) => boolean | void;
  /** Called when Copy is chosen on a translation; return false to stop the component writing to the clipboard itself */
  onCopy?: (text: string) => boolean | void;
};

export function SelectionTranslate({ text, defaultText = "", onTextChange, target, defaultTarget = "en", onTargetChange, onTranslate, onCopy, ...props }: SelectionTranslateProps) {
  const last = React.useRef<SelectionTranslateTextChange | null>(null);
  const report = React.useCallback((next: string) => last.current && onTextChange?.(next, last.current), [onTextChange]);
  const t = useControlled<string>(text, defaultText, report);
  const g = useControlled<string>(target, defaultTarget, onTargetChange);
  return h(RawSelectionTranslate, {
    ...props,
    text: t.value,
    target: g.value,
    onTcTextChange: (e: CustomEvent<SelectionTranslateTextChange>) => {
      last.current = e.detail;
      t.handler(e.detail.text, e);
    },
    onTcTargetChange: (e: CustomEvent<SelectionTranslateTargetChange>) => g.handler(e.detail.target, e),
    onTcTranslate: (e: CustomEvent<SelectionTranslateRequest>) => {
      if (onTranslate?.(e.detail) === false) e.preventDefault();
    },
    onTcCopy: (e: CustomEvent<SelectionTranslateCopy>) => {
      if (onCopy?.(e.detail.text) === false) e.preventDefault();
    },
  });
}

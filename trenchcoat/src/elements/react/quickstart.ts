import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { QUICKSTART_LANGUAGES, TcQuickstart, type QuickstartCopy, type QuickstartLanguage, type QuickstartLanguageChange, type QuickstartRun } from "../quickstart";
import { h, useControlled } from "./internal";

export type {
  QuickstartCopy,
  QuickstartEndpoint,
  QuickstartLabels,
  QuickstartLabelsInput,
  QuickstartLanguage,
  QuickstartLanguageChange,
  QuickstartMethod,
  QuickstartRun,
  QuickstartStep,
} from "../quickstart";
export { QUICKSTART_LANGUAGES, defaultQuickstartLabels, maskKey, quickstartInstall, quickstartSnippet } from "../quickstart";

const RawQuickstart = createComponent({
  tagName: "tc-quickstart",
  elementClass: TcQuickstart,
  react: React,
  events: {
    onTcLanguageChange: "tc-language-change" as EventName<CustomEvent<QuickstartLanguageChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<QuickstartCopy>>,
    onTcRun: "tc-run" as EventName<CustomEvent<QuickstartRun>>,
  },
});
type RawProps = React.ComponentProps<typeof RawQuickstart>;
export type QuickstartProps = Omit<RawProps, "heading" | "language" | "onTcLanguageChange" | "onTcCopy" | "onTcRun" | "children"> & {
  /** The heading */
  title?: string;
  /** The language shown – controlled when given */
  language?: QuickstartLanguage;
  /** The language on mount, when `language` isn't controlled */
  defaultLanguage?: QuickstartLanguage;
  /** Called with the language the user picked */
  onLanguageChange?: (language: QuickstartLanguage) => void;
  /** A step's text was copied; return false to stop the copy */
  onCopyStep?: (copy: QuickstartCopy) => boolean | void;
  /** Run it was pressed: send the request, then pass `response` and clear `running`; return false to leave `running` off */
  onRun?: (run: QuickstartRun) => boolean | void;
};

/** The language remembered under `storageKey`, if any – read once, for the uncontrolled starting value */
function stored(storageKey: string | undefined) {
  if (!storageKey) return undefined;
  try {
    const saved = localStorage.getItem(storageKey);
    return saved && (QUICKSTART_LANGUAGES as string[]).includes(saved) ? (saved as QuickstartLanguage) : undefined;
  } catch {
    return undefined;
  }
}

export function Quickstart({ title, language, defaultLanguage = "curl", onLanguageChange, onCopyStep, onRun, ...props }: QuickstartProps) {
  const [start] = React.useState(() => stored(props.storageKey) ?? defaultLanguage);
  const l = useControlled<QuickstartLanguage>(language, start, onLanguageChange);
  return h(RawQuickstart, {
    ...props,
    heading: title ?? "Quickstart",
    language: l.value,
    onTcLanguageChange: (e: CustomEvent<QuickstartLanguageChange>) => l.handler(e.detail.language, e),
    onTcCopy: (e: CustomEvent<QuickstartCopy>) => {
      if (onCopyStep?.(e.detail) === false) e.preventDefault();
    },
    onTcRun: (e: CustomEvent<QuickstartRun>) => {
      if (onRun?.(e.detail) === false) e.preventDefault();
    },
  });
}

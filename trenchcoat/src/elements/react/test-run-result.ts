import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTestRunResult, type TestOpen, type TestOpenChange, type TestRerun } from "../test-run-result";
import { h, useControlled } from "./internal";

export type { TestCase, TestCounts, TestOpen, TestOpenChange, TestRerun, TestStatus } from "../test-run-result";
export { countTests, firstUserFrame, isLibraryFrame } from "../test-run-result";

const RawTestRunResult = createComponent({
  tagName: "tc-test-run-result",
  elementClass: TcTestRunResult,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<TestOpenChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<TestOpen>>,
    onTcRerun: "tc-rerun" as EventName<CustomEvent<TestRerun>>,
  },
});
type RawTestRunResultProps = React.ComponentProps<typeof RawTestRunResult>;

export type TestRunResultOwnProps = {
  /** The heading */
  title?: string;
  /** The failures that are open, by id. Controlled when defined */
  open?: string[];
  /** The failures open at first when uncontrolled; left out, the first failure */
  defaultOpen?: string[];
  /** A failure was opened or closed */
  onOpenChange?: (open: string[]) => void;
  /** A failure's file link was pressed */
  onOpenFile?: (file: string, line: number | undefined, id: string) => void;
  /** Re-run failed was pressed. Return false to stop it being announced */
  onRerun?: (ids: string[]) => void | boolean;
};
export type TestRunResultProps = Omit<RawTestRunResultProps, keyof TestRunResultOwnProps | "heading" | "onTcOpenChange" | "onTcOpen" | "onTcRerun" | "children"> &
  TestRunResultOwnProps;

export function TestRunResult({ title = "Test run", open, defaultOpen, onOpenChange, onOpenFile, onRerun, ...props }: TestRunResultProps) {
  const s = useControlled<string[] | undefined>(open, defaultOpen, onOpenChange as ((next: string[] | undefined) => void) | undefined);
  return h(RawTestRunResult, {
    ...props,
    heading: title,
    open: s.value,
    onTcOpenChange: (e: CustomEvent<TestOpenChange>) => s.handler(e.detail.open, e),
    onTcOpen: (e: CustomEvent<TestOpen>) => onOpenFile?.(e.detail.file, e.detail.line, e.detail.id),
    onTcRerun: (e: CustomEvent<TestRerun>) => {
      if (onRerun?.(e.detail.ids) === false) e.preventDefault();
    },
  });
}

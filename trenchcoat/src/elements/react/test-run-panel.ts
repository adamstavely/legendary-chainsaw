import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcTestRunPanel,
  type TestRunSaveCase,
  type TestRunSend,
  type TestRunTurn,
  type TestRunTurnsChange,
  type TestRunVariable,
  type TestRunVariablesChange,
} from "../test-run-panel";
import { h, useControlled } from "./internal";

export { defaultTestRunPanelLabels } from "../test-run-panel";
export type { TestRunPanelLabels, TestRunSaveCase, TestRunSend, TestRunTarget, TestRunToolCall, TestRunTurn, TestRunVariable } from "../test-run-panel";

const RawTestRunPanel = createComponent({
  tagName: "tc-test-run-panel",
  elementClass: TcTestRunPanel,
  react: React,
  events: {
    onTcSend: "tc-send" as EventName<CustomEvent<TestRunSend>>,
    onTcTurnsChange: "tc-turns-change" as EventName<CustomEvent<TestRunTurnsChange>>,
    onTcVariablesChange: "tc-variables-change" as EventName<CustomEvent<TestRunVariablesChange>>,
    onTcSaveCase: "tc-save-case" as EventName<CustomEvent<TestRunSaveCase>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTestRunPanel>;

export type TestRunPanelProps = Omit<RawProps, "heading" | "turns" | "variables" | "onTcSend" | "onTcTurnsChange" | "onTcVariablesChange" | "onTcSaveCase"> & {
  /** The heading – defaults to "Test" */
  title?: string;
  /** The conversation. Controlled when defined; otherwise kept by the component from `defaultTurns`, and Reset clears it */
  turns?: TestRunTurn[];
  /** On mount, when `turns` isn't controlled */
  defaultTurns?: TestRunTurn[];
  /** Called when Reset clears the conversation */
  onTurnsChange?: (turns: TestRunTurn[]) => void;
  /** Test inputs sent with every message. Controlled when defined */
  variables?: TestRunVariable[];
  /** On mount, when `variables` isn't controlled */
  defaultVariables?: TestRunVariable[];
  /** Called with the next `variables` */
  onVariablesChange?: (variables: TestRunVariable[]) => void;
  /** Called with the message and the variables when Send is pressed. Return false to keep the text in the field */
  onSend?: (text: string, variables: TestRunVariable[]) => void | boolean;
  /** Called when a reply is saved as a test case. Return false to leave it unsaved */
  onSaveCase?: (saved: TestRunSaveCase) => void | boolean;
};

const NONE: never[] = [];

export function TestRunPanel({ title = "Test", turns, defaultTurns = NONE, onTurnsChange, variables, defaultVariables = NONE, onVariablesChange, onSend, onSaveCase, ...props }: TestRunPanelProps) {
  const t = useControlled<TestRunTurn[]>(turns, defaultTurns, onTurnsChange);
  const v = useControlled<TestRunVariable[]>(variables, defaultVariables, onVariablesChange);
  return h(RawTestRunPanel, {
    ...props,
    heading: title,
    turns: t.value,
    variables: v.value,
    onTcTurnsChange: (e: CustomEvent<TestRunTurnsChange>) => t.handler(e.detail.turns, e),
    onTcVariablesChange: (e: CustomEvent<TestRunVariablesChange>) => v.handler(e.detail.variables, e),
    onTcSend: (e: CustomEvent<TestRunSend>) => {
      if (onSend?.(e.detail.text, e.detail.variables) === false) e.preventDefault();
    },
    onTcSaveCase: (e: CustomEvent<TestRunSaveCase>) => {
      if (onSaveCase?.(e.detail) === false) e.preventDefault();
    },
  });
}

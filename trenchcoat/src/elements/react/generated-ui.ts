import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcGeneratedUi, type GeneratedUiActionDetail, type GeneratedUiSpecCheck } from "../generated-ui";
import { h } from "./internal";

export type {
  GeneratedUiAction,
  GeneratedUiActionDetail,
  GeneratedUiBlock,
  GeneratedUiCallout,
  GeneratedUiChart,
  GeneratedUiColumn,
  GeneratedUiField,
  GeneratedUiFieldKind,
  GeneratedUiForm,
  GeneratedUiGroup,
  GeneratedUiIssue,
  GeneratedUiMetric,
  GeneratedUiOption,
  GeneratedUiSpec,
  GeneratedUiTable,
  GeneratedUiText,
  GeneratedUiTone,
  GeneratedUiValue,
} from "../generated-ui";

const RawGeneratedUi = createComponent({
  tagName: "tc-generated-ui",
  elementClass: TcGeneratedUi,
  react: React,
  events: {
    onTcAction: "tc-action" as EventName<CustomEvent<GeneratedUiActionDetail>>,
    onTcSpecCheck: "tc-spec-check" as EventName<CustomEvent<GeneratedUiSpecCheck>>,
  },
});
type RawGeneratedUiProps = React.ComponentProps<typeof RawGeneratedUi>;
export type GeneratedUiProps = Omit<RawGeneratedUiProps, "onTcAction" | "onTcSpecCheck"> & {
  /** Called when a form is submitted (with its values) or an action button is pressed */
  onAction?: (action: GeneratedUiActionDetail) => void;
  /** Called once the spec settles with the blocks that fell back to text, and why */
  onSpecCheck?: (issues: GeneratedUiSpecCheck["issues"]) => void;
};

export function GeneratedUi({ onAction, onSpecCheck, ...props }: GeneratedUiProps) {
  return h(RawGeneratedUi, {
    ...props,
    onTcAction: (e: CustomEvent<GeneratedUiActionDetail>) => onAction?.(e.detail),
    onTcSpecCheck: (e: CustomEvent<GeneratedUiSpecCheck>) => onSpecCheck?.(e.detail.issues),
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcInstructionEditor, type InstructionEditorChange, type InstructionEditorValue, type InstructionSaveEvent, type InstructionVersion } from "../instruction-editor";
import { h, useControlled } from "./internal";

export type { InstructionEditorValue, InstructionRole, InstructionVariable, InstructionVersion } from "../instruction-editor";
export { defaultInstructionRoles, instructionVariables } from "../instruction-editor";

const RawInstructionEditor = createComponent({
  tagName: "tc-instruction-editor",
  elementClass: TcInstructionEditor,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<InstructionEditorChange>>,
    onTcSave: "tc-save" as EventName<CustomEvent<InstructionSaveEvent>>,
  },
});

type RawProps = React.ComponentProps<typeof RawInstructionEditor>;
type Owned = "value" | "defaultValue" | "heading" | "versions" | "onTcValueChange" | "onTcSave" | "onChange";
export type InstructionEditorProps = Omit<RawProps, Owned> & {
  /** Shown at the top; names the group and the editor */
  title?: string;
  /** The role and the text (controlled) */
  value?: InstructionEditorValue;
  /** The role and the text to start with when uncontrolled */
  defaultValue?: InstructionEditorValue;
  /** Called with the role and the text after every edit */
  onChange?: (value: InstructionEditorValue) => void;
  /** Saved versions, oldest first (controlled) */
  versions?: InstructionVersion[];
  /** The versions to start with when uncontrolled */
  defaultVersions?: InstructionVersion[];
  /** Save as a new version was pressed: `version` is the one to add, `versions` the list with it */
  onSave?: (version: InstructionVersion, versions: InstructionVersion[]) => void;
};

const EMPTY: InstructionEditorValue = { role: "system", text: "" };
const NONE: InstructionVersion[] = [];

export function InstructionEditor({ title, value, defaultValue = EMPTY, onChange, versions, defaultVersions = NONE, onSave, ...props }: InstructionEditorProps) {
  const v = useControlled(value, defaultValue, onChange);
  const list = useControlled(versions, defaultVersions, undefined);
  return h(RawInstructionEditor, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    value: v.value,
    versions: list.value,
    onTcValueChange: (e: CustomEvent<InstructionEditorChange>) => v.handler(e.detail.value, e),
    onTcSave: (e: CustomEvent<InstructionSaveEvent>) => {
      list.handler(e.detail.versions, e);
      onSave?.(e.detail.version, e.detail.versions);
    },
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcEditRegion,
  type EditRegionEdit,
  type EditRegionInstructionChange,
  type EditRegionMaskChange,
  type EditRegionOp,
  type EditRegionTool,
  type EditRegionToolChange,
} from "../edit-region";
import { h, useControlled } from "./internal";

export type {
  EditRegionBounds,
  EditRegionEdit,
  EditRegionInstructionChange,
  EditRegionLabels,
  EditRegionMaskChange,
  EditRegionOp,
  EditRegionPoint,
  EditRegionTool,
  EditRegionToolChange,
} from "../edit-region";
export { defaultEditRegionLabels, measureMask, paintMask } from "../edit-region";

const RawEditRegion = createComponent({
  tagName: "tc-edit-region",
  elementClass: TcEditRegion,
  react: React,
  events: {
    onTcMaskChange: "tc-mask-change" as EventName<CustomEvent<EditRegionMaskChange>>,
    onTcToolChange: "tc-tool-change" as EventName<CustomEvent<EditRegionToolChange>>,
    onTcInstructionChange: "tc-instruction-change" as EventName<CustomEvent<EditRegionInstructionChange>>,
    onTcEdit: "tc-edit" as EventName<CustomEvent<EditRegionEdit>>,
  },
});
type RawProps = React.ComponentProps<typeof RawEditRegion>;

export type EditRegionOwnProps = {
  /** The title above the image */
  title?: string;
  /** The mask. Controlled when defined; otherwise the element keeps its own, starting at `defaultMask` */
  mask?: EditRegionOp[];
  /** Starting mask when uncontrolled */
  defaultMask?: EditRegionOp[];
  /** A stroke or box was added, or undo, redo or clear */
  onMaskChange?: (mask: EditRegionOp[], reason: EditRegionMaskChange["reason"]) => void;
  /** The tool. Controlled when defined */
  tool?: EditRegionTool;
  /** Starting tool when uncontrolled */
  defaultTool?: EditRegionTool;
  /** Another tool was picked */
  onToolChange?: (tool: EditRegionTool) => void;
  /** What should change. Controlled when defined */
  instruction?: string;
  /** Starting instruction when uncontrolled */
  defaultInstruction?: string;
  /** The instruction was edited */
  onInstructionChange?: (instruction: string) => void;
  /** Generate: the instruction, the mask as a PNG and its bounds. The element turns busy unless you call event.preventDefault() – pass `busy` to own it */
  onEdit?: (edit: EditRegionEdit, event: Event) => void;
};
export type EditRegionProps = Omit<RawProps, keyof EditRegionOwnProps | "heading" | "onTcMaskChange" | "onTcToolChange" | "onTcInstructionChange" | "onTcEdit" | "children"> & EditRegionOwnProps;

/** Brush a mask over an image and say what should change – brush, eraser, a keyboard box, undo and Generate */
export function EditRegion({
  title = "Edit region",
  mask,
  defaultMask = [],
  onMaskChange,
  tool,
  defaultTool = "brush",
  onToolChange,
  instruction,
  defaultInstruction = "",
  onInstructionChange,
  onEdit,
  ...props
}: EditRegionProps) {
  const reason = React.useRef<EditRegionMaskChange["reason"]>("draw");
  const m = useControlled(mask, defaultMask, onMaskChange ? (next: EditRegionOp[]) => onMaskChange(next, reason.current) : undefined);
  const t = useControlled(tool, defaultTool, onToolChange);
  const i = useControlled(instruction, defaultInstruction, onInstructionChange);
  return h(RawEditRegion, {
    ...props,
    heading: title,
    mask: m.value,
    tool: t.value,
    instruction: i.value,
    onTcMaskChange: (e: CustomEvent<EditRegionMaskChange>) => {
      reason.current = e.detail.reason;
      m.handler(e.detail.mask, e);
    },
    onTcToolChange: (e: CustomEvent<EditRegionToolChange>) => t.handler(e.detail.tool, e),
    onTcInstructionChange: (e: CustomEvent<EditRegionInstructionChange>) => i.handler(e.detail.instruction, e),
    onTcEdit: (e: CustomEvent<EditRegionEdit>) => onEdit?.(e.detail, e),
  });
}

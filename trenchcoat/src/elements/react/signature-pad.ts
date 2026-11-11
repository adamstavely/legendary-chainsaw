import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSignaturePad, type SignatureValue, type SignatureValueChange } from "../signature-pad";
import { h, useControlled } from "./internal";

export type { SignatureLabels, SignaturePoint, SignatureStroke, SignatureValue, SignatureValueChange } from "../signature-pad";
export { defaultSignatureLabels } from "../signature-pad";

const RawSignaturePad = createComponent({
  tagName: "tc-signature-pad",
  elementClass: TcSignaturePad,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<SignatureValueChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSignaturePad>;
type Owned = "heading" | "value" | "defaultValue" | "onTcValueChange" | "onChange" | "children";
export type SignaturePadProps = Omit<RawProps, Owned> & {
  /** The title above the pad */
  title?: string;
  /** The signature. Controlled when defined (null for none); otherwise the pad keeps its own, starting at `defaultValue` */
  value?: SignatureValue | null;
  /** Starting signature when uncontrolled */
  defaultValue?: SignatureValue | null;
  /** Called when a stroke ends, on undo or clear, and as the name is typed */
  onValueChange?: (value: SignatureValue | null) => void;
};

export function SignaturePad({ title, value, defaultValue = null, onValueChange, ...props }: SignaturePadProps) {
  const v = useControlled(value, defaultValue, onValueChange);
  return h(RawSignaturePad, {
    ...props,
    heading: title ?? "Signature",
    value: v.value,
    onTcValueChange: (e: CustomEvent<SignatureValueChange>) => v.handler(e.detail.value, e),
  });
}

import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcOtpInput, type OtpValueChange } from "../otp-input";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { OtpStatus } from "../otp-input";

const RawOtpInput = createComponent({
  tagName: "tc-otp-input",
  elementClass: TcOtpInput,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<OtpValueChange>>,
    onTcResend: "tc-resend" as EventName<CustomEvent<null>>,
  },
});
type RawOtpInputProps = React.ComponentProps<typeof RawOtpInput>;
export type OtpInputProps = Omit<RawOtpInputProps, "value" | "errorMessage" | "resendable" | "onTcValueChange" | "onTcResend" | "onChange"> & {
  /** The code. Controlled when defined; otherwise the field keeps its own, starting at `defaultValue` */
  value?: string;
  /** Starting code when uncontrolled */
  defaultValue?: string;
  /** Called with the new code each time the user types, pastes or deletes */
  onChange?: (code: string) => void;
  /** Shown below the boxes while `status` is "error" */
  errorMessage?: React.ReactNode;
  /** Shows "Resend code" below the boxes once the countdown is over */
  onResend?: () => void;
};
export type OtpInputOwnProps = Pick<
  OtpInputProps,
  "length" | "separator" | "numeric" | "value" | "defaultValue" | "onChange" | "onComplete" | "status" | "errorMessage" | "clearOnError" | "successLabel" | "onResend" | "resendIn" | "align" | "disabled" | "name" | "required" | "autoFocus" | "label" | "labelledBy" | "look" | "className" | "ref"
>;
export function OtpInput({ value, defaultValue = "", onChange, errorMessage, onResend, ...props }: OtpInputProps) {
  const v = useControlled(value, defaultValue, onChange);
  const { stage, els } = useStaged(isNode(errorMessage) ? [["msg", errorMessage]] : []);
  const msg = errorMessage === undefined ? undefined : isNode(errorMessage) ? els.msg : typeof errorMessage === "string" || errorMessage instanceof Element ? errorMessage : String(errorMessage);
  return h(React.Fragment, null, stage, h(RawOtpInput, {
    ...props,
    ...(msg !== undefined ? { errorMessage: msg } : {}),
    value: v.value,
    resendable: !!onResend,
    onTcValueChange: (e: CustomEvent<OtpValueChange>) => v.handler(e.detail.value, e),
    onTcResend: () => onResend?.(),
  }));
}

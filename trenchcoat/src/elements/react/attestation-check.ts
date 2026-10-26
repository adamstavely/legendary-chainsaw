import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAttestationCheck, type AttestationInput, type AttestationResult, type AttestationResultChange, type AttestationVerifyStart } from "../attestation-check";
import { h, useControlled } from "./internal";

export type { AttestationCheckItem, AttestationInput, AttestationResult, AttestationVerify } from "../attestation-check";

const RawAttestationCheck = createComponent({
  tagName: "tc-attestation-check",
  elementClass: TcAttestationCheck,
  react: React,
  events: {
    onTcVerify: "tc-verify" as EventName<CustomEvent<AttestationVerifyStart>>,
    onTcResultChange: "tc-result-change" as EventName<CustomEvent<AttestationResultChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAttestationCheck>;
type Wrapped = "heading" | "result" | "onTcVerify" | "onTcResultChange";
export type AttestationCheckProps = Omit<RawProps, Wrapped> & {
  /** The heading, and the component's name */
  title?: string;
  /** The result on show. Controlled when defined (null = none); otherwise the component keeps it */
  result?: AttestationResult | null;
  /** The result on show when uncontrolled */
  defaultResult?: AttestationResult | null;
  /** Called when a check finishes (with its result and what was checked), or with null when "Check another" clears it */
  onResultChange?: (result: AttestationResult | null, input?: AttestationInput) => void;
  /** Called when a check starts, with the pasted hash or the File */
  onVerifyStart?: (input: AttestationInput) => void;
};

export function AttestationCheck({ title, result, defaultResult = null, onResultChange, onVerifyStart, ...props }: AttestationCheckProps) {
  const input = React.useRef<AttestationInput | undefined>(undefined);
  const report = React.useCallback((next: AttestationResult | null) => onResultChange?.(next, input.current), [onResultChange]);
  const value = useControlled<AttestationResult | null>(result, defaultResult, report);
  return h(RawAttestationCheck, {
    ...props,
    heading: title ?? "Verify an evidence package",
    result: value.value,
    onTcVerify: (e: CustomEvent<AttestationVerifyStart>) => onVerifyStart?.(e.detail.input),
    onTcResultChange: (e: CustomEvent<AttestationResultChange>) => {
      input.current = e.detail.input;
      value.handler(e.detail.result, e);
    },
  });
}

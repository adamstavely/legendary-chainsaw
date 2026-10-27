import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgreementTracker, type AgreementCounterRequest } from "../agreement-tracker";
import { h } from "./internal";

export type { AgreementCounterRequest, AgreementLayout, AgreementStance, AgreementStats, AgreementTurn } from "../agreement-tracker";
export { agreementStats } from "../agreement-tracker";

const RawAgreementTracker = createComponent({
  tagName: "tc-agreement-tracker",
  elementClass: TcAgreementTracker,
  react: React,
  events: {
    onTcCounterRequest: "tc-counter-request" as EventName<CustomEvent<AgreementCounterRequest>>,
  },
});
type RawAgreementTrackerProps = React.ComponentProps<typeof RawAgreementTracker>;

export type AgreementTrackerOwnProps = {
  /** The heading, and the tracker's accessible name – "Agreement" by default */
  title?: string;
  /** "Show the other side" was pressed: the length of the run of agreements and its last turn – show the counter-argument */
  onRequestCounter?: (detail: AgreementCounterRequest) => void;
};
export type AgreementTrackerProps = Omit<RawAgreementTrackerProps, keyof AgreementTrackerOwnProps | "heading" | "onTcCounterRequest"> & AgreementTrackerOwnProps;

export function AgreementTracker({ title, onRequestCounter, ...props }: AgreementTrackerProps) {
  return h(RawAgreementTracker, {
    ...props,
    heading: title ?? "Agreement",
    onTcCounterRequest: (e: CustomEvent<AgreementCounterRequest>) => onRequestCounter?.(e.detail),
  });
}

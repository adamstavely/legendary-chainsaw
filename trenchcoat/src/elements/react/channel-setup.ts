import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcChannelSetup, type ChannelGoLive, type ChannelSetupStep, type ChannelSetupValue, type ChannelStepChange, type ChannelTest, type ChannelValueChange } from "../channel-setup";
import { h, useControlled } from "./internal";

export type {
  ChannelGoLive,
  ChannelReplyMode,
  ChannelSetupLabels,
  ChannelSetupLabelsInput,
  ChannelSetupStep,
  ChannelSetupValue,
  ChannelStepChange,
  ChannelTarget,
  ChannelTest,
  ChannelTestResult,
  ChannelValueChange,
} from "../channel-setup";

const RawChannelSetup = createComponent({
  tagName: "tc-channel-setup",
  elementClass: TcChannelSetup,
  react: React,
  events: {
    onTcConnect: "tc-connect" as EventName<CustomEvent<{ step: "connect" }>>,
    onTcStepChange: "tc-step-change" as EventName<CustomEvent<ChannelStepChange>>,
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<ChannelValueChange>>,
    onTcTest: "tc-test" as EventName<CustomEvent<ChannelTest>>,
    onTcGoLive: "tc-go-live" as EventName<CustomEvent<ChannelGoLive>>,
  },
});
type RawProps = React.ComponentProps<typeof RawChannelSetup>;
type Owned = "heading" | "step" | "value" | "defaultValue" | "onTcConnect" | "onTcStepChange" | "onTcValueChange" | "onTcTest" | "onTcGoLive" | "children";
export type ChannelSetupProps = Omit<RawProps, Owned> & {
  /** The heading; "Set up a channel" by default */
  title?: string;
  /** The current step – controlled when given */
  step?: ChannelSetupStep;
  /** On mount, when `step` isn't controlled */
  defaultStep?: ChannelSetupStep;
  /** Called with the next step – Next, Back or a step in the list */
  onStepChange?: (step: ChannelSetupStep) => void;
  /** The settings – controlled when given */
  value?: ChannelSetupValue;
  /** On mount, when `value` isn't controlled */
  defaultValue?: ChannelSetupValue;
  /** Called with the next settings as they're edited */
  onValueChange?: (value: ChannelSetupValue) => void;
  /** Connect was pressed: authorize, then pass `account` */
  onConnect?: () => void;
  /** Send test was pressed: send it, then pass `testResult`. Return false to stop the button waiting */
  onTest?: (message: string, value: ChannelSetupValue) => boolean | void;
  /** Go live was pressed. Return false to stay on the summary */
  onGoLive?: (value: ChannelSetupValue, account: string) => boolean | void;
};

const BLANK: ChannelSetupValue = { targets: [], replies: "mentions", hours: { from: "09:00", to: "17:00", timeZone: "UTC" } };

export function ChannelSetup({ title, step, defaultStep = "connect", onStepChange, value, defaultValue = BLANK, onValueChange, onConnect, onTest, onGoLive, ...props }: ChannelSetupProps) {
  const s = useControlled<ChannelSetupStep>(step, defaultStep, onStepChange);
  const v = useControlled<ChannelSetupValue>(value, defaultValue, onValueChange);
  return h(RawChannelSetup, {
    ...props,
    heading: title ?? "Set up a channel",
    step: s.value,
    value: v.value,
    onTcStepChange: (e: CustomEvent<ChannelStepChange>) => s.handler(e.detail.step, e),
    onTcValueChange: (e: CustomEvent<ChannelValueChange>) => v.handler(e.detail.value, e),
    onTcConnect: () => onConnect?.(),
    onTcTest: (e: CustomEvent<ChannelTest>) => {
      if (onTest?.(e.detail.message, e.detail.value) === false) e.preventDefault();
    },
    onTcGoLive: (e: CustomEvent<ChannelGoLive>) => {
      if (onGoLive?.(e.detail.value, e.detail.account) === false) e.preventDefault();
    },
  });
}

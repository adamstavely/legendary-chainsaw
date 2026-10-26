import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcUsageMeter, type UsagePeriodChange, type UsageState, type UsageUpgrade } from "../usage-meter";
import { h } from "./internal";

/**
 * useControlled, except an uncontrolled value is mirrored here: @lit/react sets every prop on every render, so passing
 * the starting value back would undo the element's own change whenever the parent re-renders
 */
function useOwned<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const own = React.useRef(defaultValue);
  const controlled = value !== undefined;
  const handler = (next: T, event: Event) => {
    if (controlled) event.preventDefault();
    else own.current = next;
    onChange?.(next);
  };
  return { value: controlled ? value : own.current, handler, controlled };
}

export type { UsageDay, UsageItem, UsageLimit, UsagePeriod, UsageState } from "../usage-meter";

const RawUsageMeter = createComponent({
  tagName: "tc-usage-meter",
  elementClass: TcUsageMeter,
  react: React,
  events: {
    onTcPeriodChange: "tc-period-change" as EventName<CustomEvent<UsagePeriodChange>>,
    onTcUpgrade: "tc-upgrade" as EventName<CustomEvent<UsageUpgrade>>,
  },
});
type RawUsageMeterProps = React.ComponentProps<typeof RawUsageMeter>;
export type UsageMeterProps = Omit<RawUsageMeterProps, "heading" | "period" | "total" | "used" | "onTcPeriodChange" | "onTcUpgrade"> & {
  /** Credits included in the plan */
  total: number;
  /** What the credits were spent on in the shown period */
  used: NonNullable<RawUsageMeterProps["used"]>;
  /** The chosen period id. Controlled when defined; otherwise the meter keeps its own, starting at `defaultPeriod` */
  period?: string;
  /** First period when uncontrolled – defaults to the first of `periods` */
  defaultPeriod?: string;
  /** Called with the new period id – pass the matching `used`, `limits` and `daily` back in */
  onPeriodChange?: (id: string) => void;
  /** Called by the button, with the current state */
  onUpgrade?: (state: UsageState) => void;
  title?: string;
};
export function UsageMeter({ title = "Usage", period, defaultPeriod, onPeriodChange, onUpgrade, ...props }: UsageMeterProps) {
  const p = useOwned<string | undefined>(period, defaultPeriod ?? props.periods?.[0]?.id, onPeriodChange as ((id: string | undefined) => void) | undefined);
  return h(RawUsageMeter, {
    ...props,
    heading: title,
    period: p.value,
    onTcPeriodChange: (e: CustomEvent<UsagePeriodChange>) => p.handler(e.detail.period, e),
    onTcUpgrade: (e: CustomEvent<UsageUpgrade>) => onUpgrade?.(e.detail.state),
  });
}
